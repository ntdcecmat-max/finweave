-- Additive local Assistant/Planning implementation; historical DB005 is untouched.
CREATE SCHEMA fw_assistant;
CREATE TABLE fw_assistant.conversations(workspace_id text REFERENCES fw_finance.workspaces,id text,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_assistant.messages(workspace_id text,id text,conversation_id text NOT NULL,payload jsonb NOT NULL,sequence bigint GENERATED ALWAYS AS IDENTITY,expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '90 days',PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,conversation_id) REFERENCES fw_assistant.conversations);
CREATE INDEX conversation_sequence ON fw_assistant.messages(workspace_id,conversation_id,sequence);
CREATE TABLE fw_assistant.drafts(workspace_id text,id text,conversation_id text NOT NULL,payload jsonb NOT NULL,expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '30 days',PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,conversation_id) REFERENCES fw_assistant.conversations);
CREATE TABLE fw_assistant.runs(workspace_id text,id text,conversation_id text NOT NULL,session_id text REFERENCES fw_auth.sessions,input jsonb NOT NULL,payload jsonb NOT NULL,checkpoint jsonb NOT NULL DEFAULT '{"activeMillis":0,"rounds":0,"clarifications":0,"answers":[],"results":[]}',expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '90 days',PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,conversation_id) REFERENCES fw_assistant.conversations);
CREATE TABLE fw_assistant.actions(workspace_id text,run_id text,ordinal integer CHECK(ordinal BETWEEN 1 AND 8),digest text NOT NULL,reserved_ms integer NOT NULL CHECK(reserved_ms>0),generation integer NOT NULL,phase text NOT NULL CHECK(phase IN('reserved','committed')),result jsonb,PRIMARY KEY(workspace_id,run_id,ordinal),FOREIGN KEY(workspace_id,run_id) REFERENCES fw_assistant.runs);
CREATE TABLE fw_assistant.goal_plan_links(workspace_id text,goal_id text,plan_id text,draft_id text,PRIMARY KEY(workspace_id,goal_id,plan_id),FOREIGN KEY(workspace_id,goal_id) REFERENCES fw_business.goals,FOREIGN KEY(workspace_id,plan_id) REFERENCES fw_business.plans,FOREIGN KEY(workspace_id,draft_id) REFERENCES fw_assistant.drafts);
CREATE TABLE fw_assistant.simulations(workspace_id text,id text,draft_id text,input jsonb NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,draft_id) REFERENCES fw_assistant.drafts);
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON fw_assistant.simulations FOR EACH ROW EXECUTE FUNCTION fw_finance.immutable();
GRANT USAGE ON SCHEMA fw_assistant TO fw_runtime_user,fw_runtime_agent;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['conversations','messages','drafts','runs','actions','goal_plan_links','simulations'] LOOP
 EXECUTE format('ALTER TABLE fw_assistant.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE fw_assistant.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owned ON fw_assistant.%I TO fw_runtime_user USING(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked)) WITH CHECK(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked))',t);
 EXECUTE format('GRANT SELECT ON fw_assistant.%I TO fw_runtime_user',t);
 END LOOP;
END $$;
GRANT INSERT,UPDATE ON fw_assistant.conversations,fw_assistant.messages,fw_assistant.drafts,fw_assistant.runs TO fw_runtime_user;
GRANT INSERT,DELETE ON fw_assistant.goal_plan_links TO fw_runtime_user;
GRANT INSERT ON fw_assistant.simulations TO fw_runtime_user;
CREATE TRIGGER frozen_agent_input BEFORE UPDATE ON fw_assistant.runs FOR EACH ROW EXECUTE FUNCTION fw_business.frozen_job_input();
ALTER TABLE fw_dispatch.jobs DROP CONSTRAINT jobs_kind_check;
ALTER TABLE fw_dispatch.jobs ADD CHECK(kind IN('probe','receipt','price','import','forecast','agent'));
-- Every worker port checks a live ticket AND the captured owner session. Reads
-- never advance the state. The agent role has no direct tenant-table grants.
CREATE FUNCTION fw_assistant.lock_run(jid text,gen integer,tok text,epoch integer) RETURNS fw_assistant.runs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;r fw_assistant.runs;s fw_auth.sessions;BEGIN
 j:=fw_async.lock_ticket('agent',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'agent' THEN RETURN NULL;END IF;
 SELECT * INTO r FROM fw_assistant.runs WHERE workspace_id=j.workspace_id AND id=j.domain_id FOR UPDATE;
 SELECT * INTO s FROM fw_auth.sessions WHERE id=r.session_id FOR SHARE;
 IF r.id IS NULL OR r.expires_at<=clock_timestamp() OR r.payload->>'state' NOT IN('queued','reading','simulating') OR s.id IS NULL OR s.revoked OR s.subject_id<>j.subject_id OR s.epoch<>j.auth_epoch OR s.recovery_epoch<>epoch OR s.absolute_at<=clock_timestamp() THEN RETURN NULL;END IF;
 RETURN r;
END $$;
CREATE FUNCTION fw_assistant.run_input(jid text,gen integer,tok text,epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;d jsonb;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN NULL;END IF;
 SELECT payload INTO d FROM fw_assistant.drafts WHERE workspace_id=r.workspace_id AND id=r.payload->>'draftId' AND payload->>'runId'=r.id AND expires_at>clock_timestamp();
 RETURN jsonb_build_object('input',r.input,'run',r.payload,'checkpoint',r.checkpoint,'draft',d);
END $$;
CREATE FUNCTION fw_assistant.reserve_action(jid text,gen integer,tok text,epoch integer,decision_digest text,ms integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;n integer;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN NULL;END IF;
 n:=coalesce((r.payload->>'toolCalls')::integer,0)+1;
 IF n>8 OR ms<1 OR ms>25000 OR (r.checkpoint->>'activeMillis')::integer+ms>60000 THEN RETURN NULL;END IF;
 INSERT INTO fw_assistant.actions VALUES(r.workspace_id,r.id,n,decision_digest,ms,gen,'reserved',NULL);
 UPDATE fw_assistant.runs SET checkpoint=jsonb_set(checkpoint,'{activeMillis}',to_jsonb((checkpoint->>'activeMillis')::integer+ms)),payload=payload||jsonb_build_object('toolCalls',n,'state','reading','version',(payload->>'version')::integer+1) WHERE workspace_id=r.workspace_id AND id=r.id;
 RETURN jsonb_build_object('ordinal',n,'runId',r.id);
END $$;
CREATE FUNCTION fw_assistant.commit_action(jid text,gen integer,tok text,epoch integer,ordinal integer,decision_digest text,wire jsonb,checkpoint_result jsonb,elapsed_ms integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;a fw_assistant.actions;old_calls integer;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN false;END IF;
 SELECT * INTO a FROM fw_assistant.actions WHERE workspace_id=r.workspace_id AND run_id=r.id AND fw_assistant.actions.ordinal=commit_action.ordinal FOR UPDATE;
 IF a.phase='committed' THEN RETURN a.digest=decision_digest AND a.result=wire;END IF;
 IF a.phase<>'reserved' OR a.digest<>decision_digest OR a.generation<>gen OR elapsed_ms<0 OR elapsed_ms>a.reserved_ms OR octet_length(wire::text)>65536 OR octet_length(checkpoint_result::text)>49152 THEN RETURN false;END IF;
 old_calls:=(r.payload->>'toolCalls')::integer;
 IF wire->>'id'<>r.id OR wire->>'conversationId'<>r.conversation_id OR (wire->>'toolCalls')::integer<>old_calls OR (wire->>'baseVersion')::integer<>(r.input->'workspace'->>'version')::integer OR wire->'context'<>r.payload->'context' OR wire->'settings'<>r.payload->'settings' OR wire->>'intent'<>r.payload->>'intent' OR (wire->'draftId' IS DISTINCT FROM r.payload->'draftId' AND NOT EXISTS(SELECT 1 FROM fw_assistant.drafts d WHERE d.workspace_id=r.workspace_id AND d.id=wire->>'draftId' AND d.payload->>'runId'=r.id)) OR wire->>'state' NOT IN('reading','awaiting_user','completed','partial','failed','draft_ready') THEN RETURN false;END IF;
 UPDATE fw_assistant.actions SET phase='committed',result=wire WHERE workspace_id=r.workspace_id AND run_id=r.id AND fw_assistant.actions.ordinal=commit_action.ordinal;
 UPDATE fw_assistant.runs SET payload=wire,checkpoint=jsonb_set(checkpoint_result,'{activeMillis}',to_jsonb((r.checkpoint->>'activeMillis')::integer-a.reserved_ms+elapsed_ms)) WHERE workspace_id=r.workspace_id AND id=r.id;
 IF wire->>'state' IN('awaiting_user','completed','partial','failed','draft_ready') THEN
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=jid;
 INSERT INTO fw_dispatch.outcomes(job_id,generation,result) VALUES(jid,gen,jsonb_build_object('runId',r.id,'state',wire->>'state')) ON CONFLICT(job_id) DO UPDATE SET generation=excluded.generation,result=excluded.result;
 END IF;RETURN true;
END $$;
CREATE FUNCTION fw_assistant.commit_draft_action(jid text,gen integer,tok text,epoch integer,ordinal integer,decision_digest text,wire jsonb,checkpoint_result jsonb,elapsed_ms integer,draft jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;v integer;old_draft fw_assistant.drafts;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN false;END IF;
 SELECT version INTO v FROM fw_finance.workspaces WHERE id=r.workspace_id;
 IF r.payload->>'intent'='investigation' OR (r.input->'workspace'->>'version')::integer<>v OR draft->>'id' IS DISTINCT FROM wire->>'draftId' OR draft->>'runId' IS DISTINCT FROM r.id OR draft->>'conversationId' IS DISTINCT FROM r.conversation_id OR draft->>'state' IS DISTINCT FROM 'draft' OR (draft->>'baseVersion')::integer IS DISTINCT FROM v OR octet_length(draft::text)>65536 THEN RETURN false;END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements_text(draft->'body'->'scope') scope(id) WHERE NOT EXISTS(SELECT 1 FROM fw_finance.accounts a WHERE a.workspace_id=r.workspace_id AND a.id=scope.id AND NOT (a.payload->>'archived')::boolean)) THEN RETURN false;END IF;
 IF (draft->>'version')::integer=0 THEN
  IF r.payload->>'draftId' IS NOT NULL THEN RETURN false;END IF;
  INSERT INTO fw_assistant.drafts(workspace_id,id,conversation_id,payload) VALUES(r.workspace_id,draft->>'id',r.conversation_id,draft);
 ELSE
  SELECT * INTO old_draft FROM fw_assistant.drafts WHERE workspace_id=r.workspace_id AND id=draft->>'id' FOR UPDATE;
  IF old_draft.id IS NULL OR old_draft.expires_at<=clock_timestamp() OR old_draft.id IS DISTINCT FROM r.payload->>'draftId' OR old_draft.payload->>'runId' IS DISTINCT FROM r.id OR old_draft.payload->>'state' NOT IN('draft','previewed') OR (old_draft.payload->>'version')::integer+1 IS DISTINCT FROM (draft->>'version')::integer OR old_draft.payload->'createdAt' IS DISTINCT FROM draft->'createdAt' OR old_draft.payload->'confirmedIds' IS DISTINCT FROM draft->'confirmedIds' OR draft->'preview'<>'null'::jsonb THEN RETURN false;END IF;
  UPDATE fw_assistant.drafts SET payload=draft WHERE workspace_id=r.workspace_id AND id=old_draft.id;
 END IF;
 IF NOT fw_assistant.commit_action(jid,gen,tok,epoch,ordinal,decision_digest,wire,checkpoint_result,elapsed_ms) THEN RAISE EXCEPTION 'AGENT_COMMIT_FENCE';END IF;
 RETURN true;
END $$;
CREATE FUNCTION fw_assistant.stop_run(jid text,gen integer,tok text,epoch integer,reason text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL OR reason NOT IN('BUDGET_EXHAUSTED','INVALID_DECISION','CONTEXT_LIMIT','MODEL_UNAVAILABLE','TOOL_FAILED') THEN RETURN false;END IF;
 UPDATE fw_assistant.runs SET payload=payload||jsonb_build_object('state','partial','summary',reason,'version',(payload->>'version')::integer+1) WHERE workspace_id=r.workspace_id AND id=r.id;
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=jid;
 INSERT INTO fw_dispatch.outcomes(job_id,generation,result) VALUES(jid,gen,jsonb_build_object('runId',r.id,'state','partial')) ON CONFLICT(job_id) DO UPDATE SET generation=excluded.generation,result=excluded.result;RETURN true;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw_assistant FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_assistant.run_input(text,integer,text,integer),fw_assistant.reserve_action(text,integer,text,integer,text,integer),fw_assistant.commit_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer) TO fw_runtime_agent;
GRANT EXECUTE ON FUNCTION fw_assistant.commit_draft_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer,jsonb),fw_assistant.stop_run(text,integer,text,integer,text) TO fw_runtime_agent;
CREATE FUNCTION fw_assistant.enqueue_run(wid text,rid text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;i fw_auth.identities;e integer;BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_user','member') OR current_setting('fw.workspace',true)<>wid THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 SELECT * INTO r FROM fw_assistant.runs WHERE workspace_id=wid AND id=rid;
 SELECT * INTO i FROM fw_auth.identities WHERE id=current_setting('fw.subject',true) AND state='active';
 SELECT epoch INTO e FROM fw_control.state WHERE NOT locked;
 IF r.id IS NULL OR r.payload->>'state'<>'queued' OR NOT EXISTS(SELECT 1 FROM fw_finance.workspaces WHERE id=wid AND subject_id=i.id AND NOT blocked) OR NOT EXISTS(SELECT 1 FROM fw_auth.sessions WHERE id=r.session_id AND subject_id=i.id AND NOT revoked AND epoch=i.epoch AND recovery_epoch=e) THEN RETURN false;END IF;
 INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,auth_epoch,recovery_epoch,kind,deadline) VALUES(md5(wid||rid)||md5(rid||wid),wid,i.id,'agent',rid,i.epoch,e,'agent',clock_timestamp()+interval '24 hours') ON CONFLICT(profile,workspace_id,domain_id) DO UPDATE SET state='queued',due_at=clock_timestamp(),lease_token=NULL,lease_until=NULL,control_version=fw_dispatch.jobs.control_version+1 WHERE fw_dispatch.jobs.state='done';RETURN FOUND;
END $$;
CREATE FUNCTION fw_assistant.cancel_run(wid text,rid text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_user','member') OR current_setting('fw.workspace',true)<>wid OR NOT EXISTS(SELECT 1 FROM fw_finance.workspaces WHERE id=wid AND subject_id=current_setting('fw.subject',true) AND NOT blocked) OR NOT EXISTS(SELECT 1 FROM fw_assistant.runs WHERE workspace_id=wid AND id=rid AND payload->>'state'='cancelled') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 UPDATE fw_dispatch.jobs SET state='cancelled',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE workspace_id=wid AND domain_id=rid AND kind='agent' AND state IN('queued','running');RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_assistant.enqueue_run(text,text),fw_assistant.cancel_run(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_assistant.enqueue_run(text,text),fw_assistant.cancel_run(text,text) TO fw_runtime_user;
