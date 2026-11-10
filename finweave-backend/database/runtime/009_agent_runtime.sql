-- Additive bounded selection/model journal. Unknown reservations are never refunded.
CREATE TABLE fw_assistant.rounds(workspace_id text,run_id text,ordinal integer,generation integer NOT NULL,model boolean NOT NULL,reserved_ms integer NOT NULL,reserved_tokens integer NOT NULL,prompt_tokens integer NOT NULL,phase text NOT NULL CHECK(phase IN('reserved','observed')),elapsed_ms integer,output_tokens integer,digest text,PRIMARY KEY(workspace_id,run_id,ordinal),FOREIGN KEY(workspace_id,run_id) REFERENCES fw_assistant.runs);
CREATE TABLE fw_assistant.admissions(workspace_id text,run_id text,day date,PRIMARY KEY(workspace_id,run_id,day),FOREIGN KEY(workspace_id,run_id) REFERENCES fw_assistant.runs);
CREATE TABLE fw_assistant.inference_slot(id integer PRIMARY KEY CHECK(id=1),run_id text,until_at timestamptz,failures integer NOT NULL DEFAULT 0,failure_window timestamptz,open_until timestamptz);
INSERT INTO fw_assistant.inference_slot(id) VALUES(1);
CREATE TABLE fw_assistant.tool_snapshots(workspace_id text REFERENCES fw_finance.workspaces,id text,payload jsonb NOT NULL,expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '90 days',PRIMARY KEY(workspace_id,id));
ALTER TABLE fw_assistant.tool_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_assistant.tool_snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY owned ON fw_assistant.tool_snapshots TO fw_runtime_user USING(workspace_id=current_setting('fw.workspace',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked)) WITH CHECK(workspace_id=current_setting('fw.workspace',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked));
GRANT SELECT,INSERT ON fw_assistant.tool_snapshots TO fw_runtime_user;
CREATE TRIGGER immutable BEFORE UPDATE ON fw_assistant.tool_snapshots FOR EACH ROW EXECUTE FUNCTION fw_finance.immutable();
ALTER TABLE fw_assistant.rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_assistant.rounds FORCE ROW LEVEL SECURITY;
CREATE POLICY owned ON fw_assistant.rounds TO fw_runtime_user USING(workspace_id=current_setting('fw.workspace',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked));
GRANT SELECT ON fw_assistant.rounds TO fw_runtime_user;
CREATE FUNCTION fw_assistant.reserve_round(jid text,gen integer,tok text,epoch integer,is_model boolean,ms integer,prompt_tokens integer,output_tokens integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;n integer;d date;s fw_assistant.inference_slot;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN NULL;END IF;
 n:=coalesce((r.checkpoint->>'selectionRounds')::integer,0)+1;
 IF n>24 OR ms<1 OR ms>25000 OR (r.checkpoint->>'activeMillis')::integer+ms>60000 THEN RETURN NULL;END IF;
 IF is_model THEN
  IF coalesce((r.checkpoint->>'rounds')::integer,0)>=12 OR prompt_tokens<1 OR prompt_tokens>8192 OR output_tokens<1 OR output_tokens>1024 OR coalesce((r.checkpoint->>'inputTokens')::integer,0)+prompt_tokens>32768 OR coalesce((r.checkpoint->>'outputTokens')::integer,0)+output_tokens>4096 THEN RETURN NULL;END IF;
  -- One lock covers global quota, workspace quota and inference concurrency.
  SELECT * INTO s FROM fw_assistant.inference_slot WHERE id=1 FOR UPDATE;
  IF s.until_at>clock_timestamp() OR s.open_until>clock_timestamp() THEN RETURN NULL;END IF;
  d:=(clock_timestamp() AT TIME ZONE 'UTC')::date;
  IF NOT EXISTS(SELECT 1 FROM fw_assistant.admissions a WHERE a.workspace_id=r.workspace_id AND a.run_id=r.id AND a.day=d) THEN
   IF (SELECT count(*) FROM fw_assistant.admissions WHERE day=d)>=50 OR (SELECT count(*) FROM fw_assistant.admissions WHERE workspace_id=r.workspace_id AND day=d)>=10 THEN RETURN NULL;END IF;
   INSERT INTO fw_assistant.admissions VALUES(r.workspace_id,r.id,d);
  END IF;
  UPDATE fw_assistant.inference_slot SET run_id=r.id,until_at=clock_timestamp()+make_interval(secs=>ms::double precision/1000)+interval '5 seconds' WHERE id=1;
 ELSE
  IF prompt_tokens<>0 OR output_tokens<>0 THEN RETURN NULL;END IF;
 END IF;
 INSERT INTO fw_assistant.rounds VALUES(r.workspace_id,r.id,n,gen,is_model,ms,output_tokens,prompt_tokens,'reserved',NULL,NULL,NULL);
 UPDATE fw_assistant.runs SET checkpoint=checkpoint||jsonb_build_object('selectionRounds',n,'rounds',coalesce((checkpoint->>'rounds')::integer,0)+CASE WHEN is_model THEN 1 ELSE 0 END,'activeMillis',(checkpoint->>'activeMillis')::integer+ms,'inputTokens',coalesce((checkpoint->>'inputTokens')::integer,0)+prompt_tokens,'outputTokens',coalesce((checkpoint->>'outputTokens')::integer,0)+output_tokens) WHERE workspace_id=r.workspace_id AND id=r.id;
 RETURN jsonb_build_object('ordinal',n);
END $$;
CREATE FUNCTION fw_assistant.settle_round(jid text,gen integer,tok text,epoch integer,ordinal integer,elapsed integer,tokens integer,response_digest text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;s fw_assistant.rounds;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN false;END IF;
 SELECT * INTO s FROM fw_assistant.rounds WHERE workspace_id=r.workspace_id AND run_id=r.id AND fw_assistant.rounds.ordinal=settle_round.ordinal FOR UPDATE;
 IF s.phase='observed' THEN RETURN s.elapsed_ms=elapsed AND s.output_tokens=tokens AND s.digest=response_digest;END IF;
 IF s.run_id IS NULL OR s.generation<>gen OR elapsed<0 OR elapsed>s.reserved_ms OR tokens<0 OR tokens>s.reserved_tokens THEN RETURN false;END IF;
 UPDATE fw_assistant.rounds SET phase='observed',elapsed_ms=elapsed,output_tokens=tokens,digest=response_digest WHERE workspace_id=r.workspace_id AND run_id=r.id AND fw_assistant.rounds.ordinal=settle_round.ordinal;
 UPDATE fw_assistant.runs SET checkpoint=checkpoint||jsonb_build_object('activeMillis',(checkpoint->>'activeMillis')::integer-s.reserved_ms+elapsed,'outputTokens',(checkpoint->>'outputTokens')::integer-s.reserved_tokens+tokens) WHERE workspace_id=r.workspace_id AND id=r.id;
 IF s.model THEN UPDATE fw_assistant.inference_slot SET run_id=NULL,until_at=NULL WHERE id=1 AND run_id=r.id;END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_assistant.reserve_round(text,integer,text,integer,boolean,integer,integer,integer),fw_assistant.settle_round(text,integer,text,integer,integer,integer,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_assistant.reserve_round(text,integer,text,integer,boolean,integer,integer,integer),fw_assistant.settle_round(text,integer,text,integer,integer,integer,integer,text) TO fw_runtime_agent;
CREATE FUNCTION fw_assistant.provider_failure(jid text,gen integer,tok text,epoch integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;s fw_assistant.inference_slot;n integer;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN false;END IF;
 SELECT * INTO s FROM fw_assistant.inference_slot WHERE id=1 FOR UPDATE;
 n:=CASE WHEN s.failure_window>clock_timestamp()-interval '5 minutes' THEN s.failures+1 ELSE 1 END;
 UPDATE fw_assistant.inference_slot SET failures=n,failure_window=CASE WHEN n=1 THEN clock_timestamp() ELSE failure_window END,open_until=CASE WHEN n>=5 THEN clock_timestamp()+interval '60 seconds' ELSE open_until END WHERE id=1;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_assistant.provider_failure(text,integer,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_assistant.provider_failure(text,integer,text,integer) TO fw_runtime_agent;
-- Preserve the historical port, add checks and shared conversation publication.
ALTER FUNCTION fw_assistant.commit_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer) RENAME TO commit_action_core;
DO $$ DECLARE definition text;BEGIN
 definition:=replace(pg_get_functiondef('fw_assistant.commit_action_core(text,integer,text,integer,integer,text,jsonb,jsonb,integer)'::regprocedure),'commit_action.ordinal','commit_action_core.ordinal');
 definition:=replace(definition,'IF a.phase=''committed'' THEN','IF a.run_id IS NULL THEN RETURN false;END IF; IF a.phase=''committed'' THEN');
 EXECUTE definition;
END $$;
REVOKE ALL ON FUNCTION fw_assistant.commit_action_core(text,integer,text,integer,integer,text,jsonb,jsonb,integer) FROM fw_runtime_agent;
CREATE FUNCTION fw_assistant.commit_action(jid text,gen integer,tok text,epoch integer,ordinal integer,decision_digest text,wire jsonb,checkpoint_result jsonb,elapsed_ms integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;m jsonb;k text;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN false;END IF;
 FOREACH k IN ARRAY ARRAY['rounds','selectionRounds','inputTokens','outputTokens'] LOOP
  IF checkpoint_result->k IS DISTINCT FROM r.checkpoint->k THEN RETURN false;END IF;
 END LOOP;
 IF NOT fw_assistant.commit_action_core(jid,gen,tok,epoch,ordinal,decision_digest,wire,checkpoint_result,elapsed_ms) THEN RETURN false;END IF;
 m:=checkpoint_result->'message';
 IF wire->>'state'<>'reading' AND m IS NOT NULL THEN
  IF m->>'conversationId' IS DISTINCT FROM r.conversation_id OR m->>'agentRunId' IS DISTINCT FROM r.id OR m->'context' IS DISTINCT FROM r.input->'aiContext' THEN RAISE EXCEPTION 'MESSAGE_SCOPE_FENCE';END IF;
  INSERT INTO fw_assistant.messages(workspace_id,id,conversation_id,payload) VALUES(r.workspace_id,m->>'id',r.conversation_id,m) ON CONFLICT DO NOTHING;
 END IF;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_assistant.commit_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_assistant.commit_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer) TO fw_runtime_agent;
CREATE OR REPLACE FUNCTION fw_assistant.run_input(jid text,gen integer,tok text,epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;d jsonb;v integer;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN NULL;END IF;
 SELECT version INTO v FROM fw_finance.workspaces WHERE id=r.workspace_id;
 SELECT payload INTO d FROM fw_assistant.drafts WHERE workspace_id=r.workspace_id AND id=r.payload->>'draftId' AND payload->>'runId'=r.id AND expires_at>clock_timestamp();
 RETURN jsonb_build_object('input',r.input,'run',r.payload,'checkpoint',r.checkpoint,'draft',d,'currentWorkspaceVersion',v);
END $$;
CREATE OR REPLACE FUNCTION fw_assistant.stop_run(jid text,gen integer,tok text,epoch integer,reason text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL OR reason NOT IN('BUDGET_EXHAUSTED','INVALID_DECISION','CONTEXT_LIMIT','MODEL_UNAVAILABLE','TOOL_FAILED','STALE_PROPOSAL') THEN RETURN false;END IF;
 UPDATE fw_assistant.runs SET payload=payload||jsonb_build_object('state','partial','summary',reason,'version',(payload->>'version')::integer+1) WHERE workspace_id=r.workspace_id AND id=r.id;
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=jid;
 INSERT INTO fw_dispatch.outcomes(job_id,generation,result) VALUES(jid,gen,jsonb_build_object('runId',r.id,'state','partial')) ON CONFLICT(job_id) DO UPDATE SET generation=excluded.generation,result=excluded.result;RETURN true;
END $$;
ALTER TABLE fw_assistant.actions ADD COLUMN draft_body jsonb;
ALTER FUNCTION fw_assistant.commit_draft_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer,jsonb) RENAME TO commit_draft_action_core;
REVOKE ALL ON FUNCTION fw_assistant.commit_draft_action_core(text,integer,text,integer,integer,text,jsonb,jsonb,integer,jsonb) FROM fw_runtime_agent;
CREATE FUNCTION fw_assistant.commit_draft_action(jid text,gen integer,tok text,epoch integer,ordinal integer,decision_digest text,wire jsonb,checkpoint_result jsonb,elapsed_ms integer,draft jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_assistant.runs;a fw_assistant.actions;BEGIN
 r:=fw_assistant.lock_run(jid,gen,tok,epoch);IF r.id IS NULL THEN RETURN false;END IF;
 SELECT * INTO a FROM fw_assistant.actions WHERE workspace_id=r.workspace_id AND run_id=r.id AND fw_assistant.actions.ordinal=commit_draft_action.ordinal FOR UPDATE;
 IF a.run_id IS NULL THEN RETURN false;END IF;
 IF a.phase='committed' THEN RETURN a.digest=decision_digest AND a.result=wire AND a.draft_body=draft;END IF;
 IF NOT fw_assistant.commit_draft_action_core(jid,gen,tok,epoch,ordinal,decision_digest,wire,checkpoint_result,elapsed_ms,draft) THEN RETURN false;END IF;
 UPDATE fw_assistant.actions SET draft_body=draft WHERE workspace_id=r.workspace_id AND run_id=r.id AND fw_assistant.actions.ordinal=commit_draft_action.ordinal;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_assistant.commit_draft_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_assistant.commit_draft_action(text,integer,text,integer,integer,text,jsonb,jsonb,integer,jsonb) TO fw_runtime_agent;
