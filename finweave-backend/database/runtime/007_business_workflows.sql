-- Local business implementation. Immutable historical API005/DB005 packages are preserved.
CREATE SCHEMA fw_business;
CREATE TABLE fw_business.coverage(workspace_id text,id text,account_id text NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,account_id) REFERENCES fw_finance.accounts);
CREATE TABLE fw_business.plans(workspace_id text REFERENCES fw_finance.workspaces,id text,version integer NOT NULL DEFAULT 0,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_business.goals(LIKE fw_business.plans INCLUDING ALL);
ALTER TABLE fw_business.goals ADD FOREIGN KEY(workspace_id) REFERENCES fw_finance.workspaces;
CREATE TABLE fw_business.links(workspace_id text,id text,version integer NOT NULL DEFAULT 0,plan_id text NOT NULL,event_family text NOT NULL,active boolean NOT NULL DEFAULT true,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,plan_id) REFERENCES fw_business.plans);
CREATE UNIQUE INDEX one_active_actual_family ON fw_business.links(workspace_id,event_family) WHERE active;
CREATE TABLE fw_business.allocations(workspace_id text,id text,version integer NOT NULL DEFAULT 0,goal_id text NOT NULL,account_id text NOT NULL,amount numeric NOT NULL CHECK(amount>0 AND amount=trunc(amount) AND amount<=999999999999999999),active boolean NOT NULL DEFAULT true,business_date text NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,goal_id) REFERENCES fw_business.goals,FOREIGN KEY(workspace_id,account_id) REFERENCES fw_finance.accounts);
CREATE TABLE fw_business.simulations(workspace_id text REFERENCES fw_finance.workspaces,id text,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_business.evidence(LIKE fw_business.simulations INCLUDING ALL);
ALTER TABLE fw_business.evidence ADD FOREIGN KEY(workspace_id) REFERENCES fw_finance.workspaces;
CREATE TABLE fw_business.import_previews(workspace_id text REFERENCES fw_finance.workspaces,id text,subject_id text NOT NULL,version integer NOT NULL,expires_at timestamptz NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_business.imports(workspace_id text,id text,preview_id text NOT NULL,input jsonb NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,preview_id),FOREIGN KEY(workspace_id,preview_id) REFERENCES fw_business.import_previews);
CREATE TABLE fw_business.import_dedupe(workspace_id text,account_id text,fingerprint text,event_id text NOT NULL,PRIMARY KEY(workspace_id,account_id,fingerprint),FOREIGN KEY(workspace_id,account_id) REFERENCES fw_finance.accounts);
CREATE TABLE fw_business.facts(workspace_id text REFERENCES fw_finance.workspaces,version integer,recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),payload jsonb NOT NULL,PRIMARY KEY(workspace_id,version));
CREATE TABLE fw_business.forecasts(workspace_id text REFERENCES fw_finance.workspaces,id text,version integer NOT NULL DEFAULT 1,input jsonb NOT NULL,payload jsonb NOT NULL,pages jsonb,PRIMARY KEY(workspace_id,id));
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['plans','goals','links','allocations','simulations','evidence','import_previews','imports','import_dedupe','facts','forecasts','coverage'] LOOP
 EXECUTE format('ALTER TABLE fw_business.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE fw_business.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owned ON fw_business.%I TO fw_runtime_user USING(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked)) WITH CHECK(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked))',t);
 EXECUTE format('GRANT SELECT,INSERT ON fw_business.%I TO fw_runtime_user',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['facts','simulations','evidence','import_previews','import_dedupe','coverage'] LOOP
 EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON fw_business.%I FOR EACH ROW EXECUTE FUNCTION fw_finance.immutable()',t);
 END LOOP;
END $$;
GRANT USAGE ON SCHEMA fw_business TO fw_runtime_user,fw_runtime_forecast,fw_runtime_ingestion;
GRANT UPDATE ON fw_business.plans,fw_business.goals,fw_business.links,fw_business.allocations,fw_business.forecasts TO fw_runtime_user;
-- Each committed financial/planning version captures its complete knowledge closure.
CREATE FUNCTION fw_business.capture(w text) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('accounts',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_finance.accounts r WHERE workspace_id=w),'events',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_finance.event_heads r WHERE workspace_id=w),'lines',(SELECT coalesce(jsonb_agg(to_jsonb(l)||jsonb_build_object('signed_amount',l.signed_amount::text,'business_date',e.payload->>'date')),'[]') FROM fw_finance.posting_lines l JOIN fw_finance.entry_groups g ON g.workspace_id=l.workspace_id AND g.id=l.group_id JOIN fw_finance.events e ON e.workspace_id=g.workspace_id AND e.id=g.event_id AND e.version=g.event_version WHERE l.workspace_id=w AND g.sealed),'holdings',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_finance.holdings r WHERE workspace_id=w),'movements',(SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('quantity',r.quantity::text) ORDER BY business_date,sequence_no),'[]') FROM fw_finance.holding_movements r WHERE workspace_id=w),'quotes',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_finance.quotes r WHERE workspace_id=w),'quoteBasis',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM fw_async.quote_basis r WHERE workspace_id=w),'plans',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_business.plans r WHERE workspace_id=w),'goals',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_business.goals r WHERE workspace_id=w),'links',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_business.links r WHERE workspace_id=w),'allocations',(SELECT coalesce(jsonb_agg(to_jsonb(r)||jsonb_build_object('amount',r.amount::text) ORDER BY id),'[]') FROM fw_business.allocations r WHERE workspace_id=w),'reviews',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_finance.reviews r WHERE workspace_id=w),'history',(SELECT coalesce(jsonb_agg(to_jsonb(r)),'[]') FROM fw_finance.history r WHERE workspace_id=w),'sources',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_async.sources r WHERE workspace_id=w),'coverage',(SELECT coalesce(jsonb_agg(to_jsonb(r) ORDER BY id),'[]') FROM fw_business.coverage r WHERE workspace_id=w),'tracking',(SELECT tracking_start FROM fw_finance.workspaces WHERE id=w))
$$;
CREATE FUNCTION fw_business.capture_version() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF TG_OP='INSERT' OR NEW.version<>OLD.version THEN INSERT INTO fw_business.facts(workspace_id,version,payload) VALUES(NEW.id,NEW.version,fw_business.capture(NEW.id));END IF;RETURN NEW;
END $$;
CREATE TRIGGER capture_business_version AFTER INSERT OR UPDATE ON fw_finance.workspaces FOR EACH ROW EXECUTE FUNCTION fw_business.capture_version();
INSERT INTO fw_business.facts(workspace_id,version,payload) SELECT id,version,fw_business.capture(id) FROM fw_finance.workspaces;
ALTER TABLE fw_dispatch.jobs DROP CONSTRAINT jobs_kind_check;
ALTER TABLE fw_dispatch.jobs ADD CHECK(kind IN('probe','receipt','price','import','forecast'));
-- Compute-only forecast worker gets frozen inputs through live J2 ticket ports.
CREATE FUNCTION fw_business.forecast_input(jid text,gen integer,tok text,epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs; BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN NULL;END IF;
 RETURN (SELECT input FROM fw_business.forecasts WHERE workspace_id=j.workspace_id AND id=j.domain_id AND payload->>'state'='queued');END $$;
CREATE FUNCTION fw_business.publish_forecast(jid text,gen integer,tok text,epoch integer,result jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;f fw_business.forecasts;p jsonb;n integer:=0; BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN false;END IF;
 SELECT * INTO f FROM fw_business.forecasts WHERE workspace_id=j.workspace_id AND id=j.domain_id;
 IF jsonb_typeof(result)<>'array' OR jsonb_array_length(result)<1 OR EXISTS(SELECT 1 FROM generate_series(0,(f.input->'request'->>'trials')::integer-1) t(n) WHERE NOT EXISTS(SELECT 1 FROM fw_business.forecast_chunks c WHERE c.workspace_id=j.workspace_id AND c.run_id=j.domain_id AND c.trial=t.n AND c.part=0 AND c.input_digest=f.input->>'inputDigest' AND (c.payload->>'parts')::integer=(SELECT count(*) FROM fw_business.forecast_chunks x WHERE x.workspace_id=c.workspace_id AND x.run_id=c.run_id AND x.trial=c.trial))) THEN RAISE EXCEPTION 'FORECAST_INCOMPLETE';END IF;
 FOR p IN SELECT value FROM jsonb_array_elements(result) LOOP
 IF octet_length(p::text)>262144 OR (p->>'pageIndex')::integer<>n OR (p->>'pageCount')::integer<>jsonb_array_length(result) OR p->'summary'->>'inputDigest' IS DISTINCT FROM f.input->>'inputDigest' OR (p->'summary'->>'trials')::integer<>(f.input->'request'->>'trials')::integer OR jsonb_array_length(p->'points')>12 THEN RAISE EXCEPTION 'FORECAST_PAGE_INVALID';END IF;n:=n+1;END LOOP;
 UPDATE fw_business.forecasts SET version=version+1,pages=result,payload=payload||jsonb_build_object('version',version+1,'state','succeeded','completedAt',clock_timestamp(),'resultExpiresAt',clock_timestamp()+interval '30 days') WHERE workspace_id=j.workspace_id AND id=j.domain_id AND payload->>'state' IN('queued','running') AND NOT (payload->>'cancelRequested')::boolean;
 IF NOT FOUND THEN RETURN false;END IF;
 INSERT INTO fw_finance.history VALUES(j.workspace_id,md5(j.domain_id||'forecastPublished'),j.domain_id,jsonb_build_object('id',md5(j.domain_id||'forecastPublished'),'at',clock_timestamp(),'action','forecastSucceeded','reason',NULL,'actorId',j.subject_id,'version',f.version+1,'evidenceIds','[]'::jsonb));
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='succeeded' WHERE job_id=j.id AND generation=gen;RETURN true;END $$;
CREATE FUNCTION fw_business.cancel_forecast(w text,rid text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF w IS DISTINCT FROM current_setting('fw.workspace',true) OR NOT pg_has_role(session_user,'fw_runtime_user','member') THEN RAISE EXCEPTION 'WORKSPACE_DENIED';END IF;
 UPDATE fw_dispatch.jobs SET state='cancelled',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE workspace_id=w AND domain_id=rid AND kind='forecast' AND state IN('queued','running');END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw_business FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.forecast_input(text,integer,text,integer),fw_business.publish_forecast(text,integer,text,integer,jsonb) TO fw_runtime_forecast;
GRANT EXECUTE ON FUNCTION fw_business.cancel_forecast(text,text) TO fw_runtime_user;
CREATE FUNCTION fw_business.process_import(jid text,gen integer,tok text,epoch integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;imp fw_business.imports;a fw_finance.accounts;r jsonb;p jsonb;eid text;rid text;gid text;existing text;events jsonb:='[]';reviews jsonb:='[]';wv integer;n timestamptz;delta numeric;BEGIN
 j:=fw_async.lock_ticket('ingestion',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'import' THEN RETURN false;END IF;
 SELECT * INTO imp FROM fw_business.imports WHERE workspace_id=j.workspace_id AND id=j.domain_id FOR UPDATE;
 IF imp.payload->>'state'<>'pending' THEN RETURN false;END IF;
 SELECT * INTO a FROM fw_finance.accounts WHERE workspace_id=j.workspace_id AND id=imp.payload->>'accountId' FOR UPDATE;n:=clock_timestamp();
 IF a.id IS NULL OR (a.payload->>'archived')::boolean THEN
 UPDATE fw_business.imports SET payload=payload||jsonb_build_object('version',(payload->>'version')::integer+1,'state','failed','errorCode','ACCOUNT_UNAVAILABLE','updatedAt',n) WHERE workspace_id=j.workspace_id AND id=imp.id;
 UPDATE fw_dispatch.jobs SET state='failed',last_error='INPUT_INVALID',lease_token=NULL,lease_until=NULL WHERE id=j.id;RETURN true;END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(imp.input->'rows') LOOP
 p:=r->'normalized';existing:=NULL;
 IF p<>'null'::jsonb THEN
 SELECT event_id INTO existing FROM fw_business.import_dedupe WHERE workspace_id=j.workspace_id AND account_id=a.id AND fingerprint=r->>'fingerprint';
 IF existing IS NULL AND p->>'reference' IS NOT NULL THEN SELECT id INTO existing FROM fw_finance.event_heads WHERE workspace_id=j.workspace_id AND payload->>'accountId'=a.id AND payload->>'reference'=p->>'reference' ORDER BY id LIMIT 1;END IF;
 END IF;
 IF p='null'::jsonb OR existing IS NOT NULL THEN
 rid:=md5(imp.id||(r->>'id')||'review');
 INSERT INTO fw_finance.reviews(workspace_id,id,payload) VALUES(j.workspace_id,rid,jsonb_build_object('type',CASE WHEN p='null'::jsonb THEN 'invalid' ELSE 'duplicate' END,'title','CSV row requires owner review','status','open','eventId',existing,'holdingId',NULL,'accountId',a.id,'variance',NULL,'observed',NULL,'rawEvidenceId',r->>'rawEvidenceId'));
 reviews:=reviews||to_jsonb(rid);
 ELSE
 IF NOT coalesce(p->'amount'->>'value' ~ '^[1-9][0-9]{0,17}$',false) OR p->>'kind' NOT IN('income','expense') OR p->>'accountId'<>a.id OR p->>'date'<a.payload->>'openingDate' OR p->>'date'<(SELECT tracking_start FROM fw_finance.workspaces WHERE id=j.workspace_id) THEN RAISE EXCEPTION 'IMPORT_ROW_INVALID';END IF;
 eid:=md5(imp.id||(r->>'id'));gid:=md5(eid||'ledger');p:=p||jsonb_build_object('reconciliation','clear','evidenceIds',jsonb_build_array(r->>'rawEvidenceId'));
 INSERT INTO fw_finance.events VALUES(j.workspace_id,eid,0,eid,p);
 INSERT INTO fw_finance.ledger_accounts VALUES(j.workspace_id,'counter:'||(p->>'kind'),NULL,p->>'kind') ON CONFLICT DO NOTHING;
 INSERT INTO fw_finance.entry_groups(workspace_id,id,event_id,event_version) VALUES(j.workspace_id,gid,eid,0);
 delta:=(p->'amount'->>'value')::numeric*CASE WHEN p->>'kind'='expense' THEN -1 ELSE 1 END;
 INSERT INTO fw_finance.posting_lines VALUES(j.workspace_id,gid,0,'asset:'||a.id,delta,'VND'),(j.workspace_id,gid,1,'counter:'||(p->>'kind'),-delta,'VND');
 UPDATE fw_finance.entry_groups SET sealed=true WHERE workspace_id=j.workspace_id AND id=gid;
 INSERT INTO fw_business.import_dedupe VALUES(j.workspace_id,a.id,r->>'fingerprint',eid);
 INSERT INTO fw_finance.history VALUES(j.workspace_id,md5(eid||'history'),eid,jsonb_build_object('id',md5(eid||'history'),'at',n,'action','import','reason',NULL,'actorId',j.subject_id,'version',0,'evidenceIds',jsonb_build_array(r->>'rawEvidenceId')));events:=events||to_jsonb(eid);
 END IF;
 END LOOP;
 IF jsonb_array_length(events)>0 THEN UPDATE fw_finance.accounts SET version=version+1 WHERE workspace_id=j.workspace_id AND id=a.id;END IF;
 UPDATE fw_business.imports SET payload=payload||jsonb_build_object('version',(payload->>'version')::integer+1,'state','completed','committedEventIds',events,'reviewCaseIds',reviews,'resultWorkspaceVersion',wv,'updatedAt',n) WHERE workspace_id=j.workspace_id AND id=imp.id;
 INSERT INTO fw_finance.history VALUES(j.workspace_id,md5(imp.id||'completed'),imp.id,jsonb_build_object('id',md5(imp.id||'completed'),'at',n,'action','importCompleted','reason',NULL,'actorId',j.subject_id,'version',(imp.payload->>'version')::integer+1,'evidenceIds','[]'::jsonb));
 UPDATE fw_finance.workspaces SET version=version+1 WHERE id=j.workspace_id RETURNING version INTO wv;
 UPDATE fw_business.imports SET payload=payload||jsonb_build_object('resultWorkspaceVersion',wv) WHERE workspace_id=j.workspace_id AND id=imp.id;
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=n,disposition='succeeded' WHERE job_id=j.id AND generation=gen;SET CONSTRAINTS ALL IMMEDIATE;RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_business.process_import(text,integer,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.process_import(text,integer,text,integer) TO fw_runtime_ingestion;
-- Owner retry preserves selected pins and does not reopen or reparse CSV.
CREATE FUNCTION fw_business.retry_import(w text,rid text,expected integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE imp fw_business.imports;BEGIN
 IF w IS DISTINCT FROM current_setting('fw.workspace',true) OR NOT pg_has_role(session_user,'fw_runtime_user','member') OR NOT EXISTS(SELECT 1 FROM fw_finance.workspaces WHERE id=w AND subject_id=current_setting('fw.subject',true) AND NOT blocked) THEN RAISE EXCEPTION 'WORKSPACE_DENIED';END IF;
 SELECT * INTO imp FROM fw_business.imports WHERE workspace_id=w AND id=rid FOR UPDATE;
 IF imp.id IS NULL OR (imp.payload->>'version')::integer<>expected THEN RETURN false;END IF;
 UPDATE fw_dispatch.jobs SET state='queued',due_at=clock_timestamp(),max_attempts=max_attempts+3,retry_cycles=retry_cycles+1,control_version=control_version+1 WHERE workspace_id=w AND domain_id=rid AND kind='import' AND state='failed' AND retry_cycles<2 AND deadline>clock_timestamp() AND recovery_epoch=(SELECT epoch FROM fw_control.state WHERE NOT locked) AND last_error IN('TRANSIENT','LEASE_EXPIRED');
 IF NOT FOUND THEN RETURN false;END IF;RETURN true;END $$;
REVOKE ALL ON FUNCTION fw_business.retry_import(text,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.retry_import(text,text,integer) TO fw_runtime_user;
CREATE TABLE fw_business.forecast_chunks(workspace_id text,run_id text,trial integer,part integer,input_digest text NOT NULL,payload jsonb NOT NULL CHECK(octet_length(payload::text)<=262144),PRIMARY KEY(workspace_id,run_id,trial,part),FOREIGN KEY(workspace_id,run_id) REFERENCES fw_business.forecasts);
ALTER TABLE fw_business.forecast_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_business.forecast_chunks FORCE ROW LEVEL SECURITY;
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON fw_business.forecast_chunks FOR EACH ROW EXECUTE FUNCTION fw_finance.immutable();
CREATE FUNCTION fw_business.checkpoint_forecast(jid text,gen integer,tok text,epoch integer,p_trial integer,p_part integer,chunk jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;f fw_business.forecasts;BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN false;END IF;
 SELECT * INTO f FROM fw_business.forecasts WHERE workspace_id=j.workspace_id AND id=j.domain_id;
 IF f.payload->>'state' NOT IN('queued','running') OR (f.payload->>'cancelRequested')::boolean OR p_trial<0 OR p_trial>=(f.input->'request'->>'trials')::integer OR p_part<0 THEN RETURN false;END IF;
 IF jsonb_typeof(chunk)<>'object' OR (chunk->>'parts')::integer<1 OR (chunk->>'parts')::integer>1000 OR p_part>=(chunk->>'parts')::integer OR jsonb_array_length(chunk->'points')>12 OR jsonb_array_length(chunk->'counterfactualPoints')<>jsonb_array_length(chunk->'points') THEN RAISE EXCEPTION 'CHECKPOINT_INVALID';END IF;
 INSERT INTO fw_business.forecast_chunks VALUES(j.workspace_id,j.domain_id,p_trial,p_part,f.input->>'inputDigest',chunk) ON CONFLICT DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM fw_business.forecast_chunks WHERE workspace_id=j.workspace_id AND run_id=j.domain_id AND trial=p_trial AND part=p_part AND input_digest=f.input->>'inputDigest' AND payload=chunk) THEN RAISE EXCEPTION 'CHECKPOINT_DIGEST_CONFLICT';END IF;RETURN true;END $$;
CREATE FUNCTION fw_business.forecast_checkpoints(jid text,gen integer,tok text,epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN NULL;END IF;
 RETURN (SELECT coalesce(jsonb_agg(jsonb_build_object('trial',c.trial,'part',c.part,'payload',c.payload) ORDER BY c.trial,c.part),'[]') FROM fw_business.forecast_chunks c JOIN fw_business.forecasts f ON f.workspace_id=c.workspace_id AND f.id=c.run_id WHERE c.workspace_id=j.workspace_id AND c.run_id=j.domain_id AND c.input_digest=f.input->>'inputDigest');END $$;
CREATE OR REPLACE FUNCTION fw_business.forecast_input(jid text,gen integer,tok text,epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN NULL;END IF;
 UPDATE fw_business.forecasts SET payload=payload||jsonb_build_object('state','running') WHERE workspace_id=j.workspace_id AND id=j.domain_id AND payload->>'state'='queued';
 RETURN (SELECT input FROM fw_business.forecasts WHERE workspace_id=j.workspace_id AND id=j.domain_id AND payload->>'state'='running' AND NOT (payload->>'cancelRequested')::boolean);END $$;
CREATE FUNCTION fw_business.dispatch_terminal() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.kind='forecast' AND NEW.state IN('failed','cancelled') THEN UPDATE fw_business.forecasts SET version=version+1,payload=payload||jsonb_build_object('version',version+1,'state',CASE WHEN NEW.state='cancelled' THEN 'cancelled' ELSE 'failed' END,'cancelRequested',NEW.state='cancelled','safeErrorCode',CASE WHEN NEW.state='cancelled' THEN 'CANCELLED' WHEN NEW.last_error='INPUT_INVALID' THEN 'INPUT_INVALID' ELSE 'INTERNAL_ERROR' END,'completedAt',clock_timestamp()) WHERE workspace_id=NEW.workspace_id AND id=NEW.domain_id AND payload->>'state' IN('queued','running');END IF;
 IF NEW.kind='import' AND NEW.state IN('failed','cancelled') THEN UPDATE fw_business.imports SET payload=payload||jsonb_build_object('version',(payload->>'version')::integer+1,'state','failed','errorCode',coalesce(NEW.last_error,'AUTHORITY_REVOKED'),'updatedAt',clock_timestamp()) WHERE workspace_id=NEW.workspace_id AND id=NEW.domain_id AND payload->>'state'='pending';END IF;
 IF NEW.kind='import' AND OLD.state='failed' AND NEW.state='queued' THEN UPDATE fw_business.imports SET payload=payload||jsonb_build_object('version',(payload->>'version')::integer+1,'state','pending','errorCode',NULL,'updatedAt',clock_timestamp()) WHERE workspace_id=NEW.workspace_id AND id=NEW.domain_id;END IF;
 IF NEW.kind IN('forecast','import') AND NEW.state IN('failed','cancelled') AND NEW.state IS DISTINCT FROM OLD.state THEN INSERT INTO fw_finance.history VALUES(NEW.workspace_id,md5(NEW.id||NEW.control_version::text||NEW.state),NEW.domain_id,jsonb_build_object('id',md5(NEW.id||NEW.control_version::text||NEW.state),'at',clock_timestamp(),'action',NEW.kind||NEW.state,'reason',NEW.last_error,'actorId',NEW.subject_id,'version',NEW.control_version,'evidenceIds','[]'::jsonb));END IF;RETURN NEW;END $$;
CREATE TRIGGER business_terminal AFTER UPDATE OF state ON fw_dispatch.jobs FOR EACH ROW EXECUTE FUNCTION fw_business.dispatch_terminal();
CREATE OR REPLACE FUNCTION fw_dispatch.heartbeat(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;BEGIN
 j:=fw_async.lock_ticket(p_profile,p_id,p_generation,p_token,p_epoch);IF j.id IS NULL THEN RETURN false;END IF;
 UPDATE fw_dispatch.jobs SET lease_until=least(clock_timestamp()+interval '30 seconds',active_start+CASE WHEN kind='forecast' THEN interval '600 seconds' WHEN kind='receipt' THEN interval '30 seconds' WHEN kind='price' THEN interval '60 seconds' ELSE interval '120 seconds' END,deadline) WHERE id=j.id AND active_start+CASE WHEN kind='forecast' THEN interval '600 seconds' WHEN kind='receipt' THEN interval '30 seconds' WHEN kind='price' THEN interval '60 seconds' ELSE interval '120 seconds' END>clock_timestamp();RETURN FOUND;END $$;
REVOKE ALL ON FUNCTION fw_business.checkpoint_forecast(text,integer,text,integer,integer,integer,jsonb),fw_business.forecast_checkpoints(text,integer,text,integer),fw_business.dispatch_terminal() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.checkpoint_forecast(text,integer,text,integer,integer,integer,jsonb),fw_business.forecast_checkpoints(text,integer,text,integer) TO fw_runtime_forecast;
CREATE FUNCTION fw_business.fail_forecast(jid text,gen integer,tok text,epoch integer,code text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;ok boolean;BEGIN
 IF code NOT IN('INPUT_INVALID','RESULT_TOO_LARGE','WORK_BUDGET_EXCEEDED','INTERNAL_ERROR') THEN RAISE EXCEPTION 'SAFE_ERROR_REQUIRED';END IF;
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN false;END IF;
 ok:=fw_dispatch.fail_attempt('forecast',jid,gen,tok,epoch,'PROVIDER_INVALID',false,NULL);
 IF ok THEN UPDATE fw_business.forecasts SET payload=payload||jsonb_build_object('safeErrorCode',code) WHERE workspace_id=j.workspace_id AND id=j.domain_id;END IF;RETURN ok;END $$;
REVOKE ALL ON FUNCTION fw_business.fail_forecast(text,integer,text,integer,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.fail_forecast(text,integer,text,integer,text) TO fw_runtime_forecast;
CREATE FUNCTION fw_business.receipt_decision(w text,rid text,action text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF w IS DISTINCT FROM current_setting('fw.workspace',true) OR NOT pg_has_role(session_user,'fw_runtime_user','member') OR NOT EXISTS(SELECT 1 FROM fw_finance.workspaces WHERE id=w AND subject_id=current_setting('fw.subject',true) AND NOT blocked) THEN RAISE EXCEPTION 'WORKSPACE_DENIED';END IF;
 IF action IN('mergeDuplicate','dismissInvalid','acknowledgeQuality') AND EXISTS(SELECT 1 FROM fw_finance.reviews WHERE workspace_id=w AND id=rid AND payload->>'status'='resolved') THEN UPDATE fw_async.receipts SET state='ignored',reason='OWNER_REVIEW_RESOLVED' WHERE workspace_id=w AND review_id=rid AND state='needs_review';END IF;END $$;
REVOKE ALL ON FUNCTION fw_business.receipt_decision(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.receipt_decision(text,text,text) TO fw_runtime_user;
-- Slice state includes exact residuals and the next daily position. A complete
-- manifest and its bounded parts commit together; partial slices cannot resume.
CREATE TABLE fw_business.forecast_slices(workspace_id text,run_id text,trial integer,with_plans boolean,slice integer,part integer,input_digest text NOT NULL,payload jsonb NOT NULL CHECK(octet_length(payload::text)<=262144),PRIMARY KEY(workspace_id,run_id,trial,with_plans,slice,part),FOREIGN KEY(workspace_id,run_id) REFERENCES fw_business.forecasts);
ALTER TABLE fw_business.forecast_slices ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_business.forecast_slices FORCE ROW LEVEL SECURITY;
CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON fw_business.forecast_slices FOR EACH ROW EXECUTE FUNCTION fw_finance.immutable();
CREATE FUNCTION fw_business.checkpoint_slice(jid text,gen integer,tok text,epoch integer,p_trial integer,p_with boolean,p_slice integer,parts jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;f fw_business.forecasts;p jsonb;n integer:=0;BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN false;END IF;
 SELECT * INTO f FROM fw_business.forecasts WHERE workspace_id=j.workspace_id AND id=j.domain_id;
 IF f.payload->>'state'<>'running' OR (f.payload->>'cancelRequested')::boolean THEN RETURN false;END IF;
 IF p_trial< -1 OR p_trial>=(f.input->'request'->>'trials')::integer OR p_slice<0 OR jsonb_typeof(parts)<>'array' OR jsonb_array_length(parts)<1 OR jsonb_array_length(parts)>1000 THEN RAISE EXCEPTION 'SLICE_INVALID';END IF;
 FOR p IN SELECT value FROM jsonb_array_elements(parts) LOOP
 INSERT INTO fw_business.forecast_slices VALUES(j.workspace_id,j.domain_id,p_trial,p_with,p_slice,n,f.input->>'inputDigest',p) ON CONFLICT DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM fw_business.forecast_slices WHERE workspace_id=j.workspace_id AND run_id=j.domain_id AND trial=p_trial AND with_plans=p_with AND slice=p_slice AND part=n AND input_digest=f.input->>'inputDigest' AND payload=p) THEN RAISE EXCEPTION 'SLICE_DIGEST_CONFLICT';END IF;n:=n+1;END LOOP;RETURN true;END $$;
CREATE FUNCTION fw_business.load_slices(jid text,gen integer,tok text,epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ DECLARE j fw_dispatch.jobs;BEGIN
 j:=fw_async.lock_ticket('forecast',jid,gen,tok,epoch);IF j.id IS NULL OR j.kind<>'forecast' THEN RETURN NULL;END IF;
 RETURN(SELECT coalesce(jsonb_agg(jsonb_build_object('trial',c.trial,'withPlans',c.with_plans,'slice',c.slice,'part',c.part,'payload',c.payload) ORDER BY c.trial,c.with_plans,c.part),'[]') FROM fw_business.forecast_slices c JOIN fw_business.forecasts f ON f.workspace_id=c.workspace_id AND f.id=c.run_id WHERE c.workspace_id=j.workspace_id AND c.run_id=j.domain_id AND c.input_digest=f.input->>'inputDigest' AND c.slice=(SELECT max(s.slice) FROM fw_business.forecast_slices s WHERE s.workspace_id=c.workspace_id AND s.run_id=c.run_id AND s.trial=c.trial AND s.with_plans=c.with_plans));END $$;
REVOKE ALL ON FUNCTION fw_business.checkpoint_slice(text,integer,text,integer,integer,boolean,integer,jsonb),fw_business.load_slices(text,integer,text,integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_business.checkpoint_slice(text,integer,text,integer,integer,boolean,integer,jsonb),fw_business.load_slices(text,integer,text,integer) TO fw_runtime_forecast;
CREATE FUNCTION fw_business.frozen_job_input() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.input IS DISTINCT FROM OLD.input THEN RAISE EXCEPTION 'FROZEN_INPUT_IMMUTABLE';END IF;
 IF TG_TABLE_NAME='forecasts' THEN IF OLD.pages IS NOT NULL AND NEW.pages IS DISTINCT FROM OLD.pages THEN RAISE EXCEPTION 'FROZEN_RESULTS_IMMUTABLE';END IF;END IF;RETURN NEW;END $$;
CREATE TRIGGER frozen_input BEFORE UPDATE ON fw_business.forecasts FOR EACH ROW EXECUTE FUNCTION fw_business.frozen_job_input();
CREATE TRIGGER frozen_input BEFORE UPDATE ON fw_business.imports FOR EACH ROW EXECUTE FUNCTION fw_business.frozen_job_input();
REVOKE ALL ON FUNCTION fw_business.frozen_job_input() FROM PUBLIC;
