CREATE SCHEMA fw_async;
ALTER TABLE fw_dispatch.jobs ADD COLUMN kind text NOT NULL DEFAULT 'probe' CHECK(kind IN('probe','receipt','price'));
ALTER TABLE fw_dispatch.jobs ADD COLUMN policy_version text NOT NULL DEFAULT 'FW-ASYNC-J2-001';
ALTER TABLE fw_dispatch.jobs ADD COLUMN active_start timestamptz;
ALTER TABLE fw_dispatch.jobs ADD COLUMN control_version integer NOT NULL DEFAULT 0;
ALTER TABLE fw_dispatch.jobs ADD COLUMN retry_cycles integer NOT NULL DEFAULT 0 CHECK(retry_cycles BETWEEN 0 AND 2);
ALTER TABLE fw_dispatch.jobs ADD COLUMN last_error text;
CREATE INDEX runtime_jobs_due ON fw_dispatch.jobs(profile,due_at,id) WHERE state IN('queued','running');
CREATE TABLE fw_async.attempts(job_id text REFERENCES fw_dispatch.jobs,generation integer,started_at timestamptz NOT NULL,ended_at timestamptz,disposition text,PRIMARY KEY(job_id,generation));
CREATE TABLE fw_async.sources(workspace_id text REFERENCES fw_finance.workspaces,id text,version integer NOT NULL DEFAULT 0,kind text NOT NULL CHECK(kind IN('bank','price')),enabled boolean NOT NULL DEFAULT true,last_success timestamptz,last_attempt timestamptz,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_async.bindings(workspace_id text,id text,device_id text REFERENCES fw_auth.devices,account_id text,source_id text,version integer NOT NULL DEFAULT 0,enabled boolean NOT NULL DEFAULT true,parser text NOT NULL CHECK(parser='synthetic-v1'),mask text NOT NULL CHECK(mask ~ '^mask_[A-Za-z0-9_-]{1,32}$'),namespace text NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,account_id) REFERENCES fw_finance.accounts,FOREIGN KEY(workspace_id,source_id) REFERENCES fw_async.sources);
CREATE TABLE fw_async.receipts(workspace_id text,id text,device_id text REFERENCES fw_auth.devices,device_epoch integer NOT NULL,event_key text,revision integer,digest text NOT NULL,item jsonb NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),state text NOT NULL DEFAULT 'received' CHECK(state IN('received','parsed','posted','needs_review','ignored','failed')),event_id text,review_id text,reason text,PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,device_id,event_key,revision));
CREATE TABLE fw_async.semantic_records(workspace_id text,namespace text,reference text,account_id text,direction text,event_id text NOT NULL,amount text NOT NULL,occurred_at text NOT NULL,PRIMARY KEY(workspace_id,namespace,reference,account_id,direction));
CREATE TABLE fw_async.entitlements(workspace_id text,id text,source_id text,version integer NOT NULL DEFAULT 0,enabled boolean NOT NULL DEFAULT true,provider text NOT NULL DEFAULT 'stub' CHECK(provider='stub'),rights_confirmed boolean NOT NULL DEFAULT false,expires_at timestamptz NOT NULL,quota_scopes text[] NOT NULL,fixtures jsonb NOT NULL DEFAULT '{}',PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,source_id) REFERENCES fw_async.sources,CHECK(cardinality(quota_scopes)>0));
CREATE TABLE fw_async.quota_configs(namespace text PRIMARY KEY,hard_limit integer NOT NULL CHECK(hard_limit>0),cooldown_until timestamptz);
CREATE TABLE fw_async.quota_buckets(namespace text REFERENCES fw_async.quota_configs,window_start date,reserved integer NOT NULL DEFAULT 0 CHECK(reserved>=0),hard_limit integer NOT NULL CHECK(hard_limit>0),cooldown_until timestamptz,PRIMARY KEY(namespace,window_start),CHECK(reserved<=hard_limit));
CREATE TABLE fw_async.market_gate(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),blocked_until timestamptz NOT NULL DEFAULT '-infinity',restored_at timestamptz);
INSERT INTO fw_async.market_gate DEFAULT VALUES;
CREATE TABLE fw_async.holding_sources(workspace_id text,holding_id text,entitlement_id text,PRIMARY KEY(workspace_id,holding_id),FOREIGN KEY(workspace_id,holding_id) REFERENCES fw_finance.holdings,FOREIGN KEY(workspace_id,entitlement_id) REFERENCES fw_async.entitlements);
CREATE TABLE fw_async.refreshes(workspace_id text,id text,parent_id text,entitlement_id text,input jsonb NOT NULL,selection_digest text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),status text NOT NULL DEFAULT 'queued',result jsonb,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,parent_id) REFERENCES fw_async.refreshes);
CREATE TABLE fw_async.intents(job_id text REFERENCES fw_dispatch.jobs,generation integer,phase text NOT NULL CHECK(phase IN('sent_unknown','observed')),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(job_id,generation));
CREATE TABLE fw_async.schedules(workspace_id text PRIMARY KEY REFERENCES fw_finance.workspaces,next_due_at timestamptz NOT NULL,last_dispatched_at timestamptz);
CREATE TABLE fw_async.schedule_history(workspace_id text,occurrence timestamptz,missed integer NOT NULL,disposition text NOT NULL,refresh_id text,PRIMARY KEY(workspace_id,occurrence));
CREATE TABLE fw_async.quote_basis(workspace_id text,quote_id text,profile jsonb NOT NULL,PRIMARY KEY(workspace_id,quote_id));
CREATE TABLE fw_async.observation_fingerprints(workspace_id text,fingerprint text,quote_id text NOT NULL,PRIMARY KEY(workspace_id,fingerprint));
-- Tenant metadata/evidence remain private; workers only have ticket-bound functions.
GRANT USAGE ON SCHEMA fw_async TO fw_runtime_user,fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['sources','bindings','receipts','refreshes','holding_sources','entitlements','schedules','schedule_history','semantic_records','quote_basis'] LOOP
 EXECUTE format('ALTER TABLE fw_async.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE fw_async.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owned ON fw_async.%I TO fw_runtime_user USING(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked)) WITH CHECK(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT blocked))',t);
 EXECUTE format('GRANT SELECT ON fw_async.%I TO fw_runtime_user',t);
 END LOOP;
END $$;
GRANT INSERT ON fw_async.receipts,fw_async.schedules TO fw_runtime_user;
GRANT UPDATE ON fw_async.sources,fw_async.bindings TO fw_runtime_user;
-- One common lock order and live authority check. Only called from scoped definer ports.
CREATE FUNCTION fw_async.lock_ticket(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS fw_dispatch.jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;r integer;i fw_auth.identities;w fw_finance.workspaces;d fw_auth.devices;
BEGIN
 IF p_profile NOT IN('ingestion','market','forecast','agent','retention') OR NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;
 SELECT a.* INTO i FROM fw_auth.identities a JOIN fw_dispatch.jobs q ON q.subject_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT a.* INTO w FROM fw_finance.workspaces a JOIN fw_dispatch.jobs q ON q.workspace_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=p_id FOR UPDATE;
 IF j.device_id IS NOT NULL THEN SELECT * INTO d FROM fw_auth.devices WHERE id=j.device_id FOR UPDATE; END IF;
 IF r IS NULL OR r<>p_epoch OR j.id IS NULL OR j.profile<>p_profile OR j.state<>'running' OR j.generation<>p_generation OR j.lease_token IS DISTINCT FROM p_token OR j.lease_until<=clock_timestamp() OR j.deadline<=clock_timestamp() OR i.state<>'active' OR i.epoch<>j.auth_epoch OR w.blocked OR w.subject_id<>i.id OR j.recovery_epoch<>r OR (j.device_id IS NOT NULL AND (d.id IS NULL OR d.revoked OR d.epoch<>j.device_epoch OR d.consent<>j.consent OR d.subject_id<>j.subject_id OR d.workspace_id<>j.workspace_id OR d.auth_epoch<>i.epoch OR d.recovery_epoch<>r OR d.authorized_until<=clock_timestamp())) THEN RETURN NULL; END IF;
 RETURN j;
END $$;
CREATE FUNCTION fw_async.backoff(n integer) RETURNS interval LANGUAGE sql VOLATILE AS $$ SELECT make_interval(secs=>least(900,5*power(2,least(n-1,20)))*(0.5+random()*0.5)) $$;
CREATE OR REPLACE FUNCTION fw_dispatch.claim(p_profile text,p_token text) RETURNS SETOF fw_dispatch.jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE c record;j fw_dispatch.jobs;r integer;i fw_auth.identities;w fw_finance.workspaces;valid boolean;due timestamptz;
BEGIN
 IF p_profile NOT IN('ingestion','market','forecast','agent','retention') OR NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;IF r IS NULL THEN RETURN;END IF;
 FOR c IN SELECT id,subject_id,workspace_id FROM fw_dispatch.jobs WHERE profile=p_profile AND state IN('queued','running') AND (due_at<=clock_timestamp() OR lease_until<=clock_timestamp() OR deadline<=clock_timestamp()) ORDER BY due_at,id LIMIT 100 LOOP
 SELECT * INTO i FROM fw_auth.identities WHERE id=c.subject_id FOR UPDATE;
 SELECT * INTO w FROM fw_finance.workspaces WHERE id=c.workspace_id FOR UPDATE;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=c.id FOR UPDATE SKIP LOCKED;IF j.id IS NULL OR j.state NOT IN('queued','running') THEN CONTINUE;END IF;
 valid:=i.state='active' AND i.epoch=j.auth_epoch AND NOT w.blocked AND w.subject_id=i.id AND j.recovery_epoch=r;
 IF j.device_id IS NOT NULL THEN valid:=valid AND EXISTS(SELECT 1 FROM fw_auth.devices d WHERE d.id=j.device_id AND NOT d.revoked AND d.epoch=j.device_epoch AND d.consent=j.consent AND d.auth_epoch=i.epoch AND d.recovery_epoch=r AND d.authorized_until>clock_timestamp() AND d.subject_id=i.id AND d.workspace_id=w.id);END IF;
 IF NOT valid THEN
 UPDATE fw_dispatch.jobs SET state='cancelled',lease_token=NULL,lease_until=NULL,last_error='AUTHORITY_REVOKED',control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='revoked' WHERE job_id=j.id AND generation=j.generation AND ended_at IS NULL;
 UPDATE fw_async.receipts SET state='ignored',reason='AUTHORITY_REVOKED' WHERE workspace_id=j.workspace_id AND id=j.domain_id AND state IN('received','parsed');
 UPDATE fw_async.refreshes SET status='failed',result=fw_async.failure_result(j.workspace_id,j.domain_id,'AUTHORITY_REVOKED',NULL) WHERE workspace_id=j.workspace_id AND id=j.domain_id;CONTINUE;
 END IF;
 IF j.state='running' AND j.lease_until>clock_timestamp() THEN CONTINUE;END IF;
 IF j.state='running' THEN
 due:=clock_timestamp()+fw_async.backoff(j.attempts);
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='expired' WHERE job_id=j.id AND generation=j.generation AND ended_at IS NULL;
 UPDATE fw_dispatch.jobs SET state='queued',lease_token=NULL,lease_until=NULL,due_at=due,last_error='LEASE_EXPIRED',control_version=control_version+1 WHERE id=j.id RETURNING * INTO j;
 END IF;
 IF j.deadline<=clock_timestamp() OR j.attempts>=j.max_attempts OR j.due_at>=j.deadline THEN
 UPDATE fw_dispatch.jobs SET state='failed',lease_token=NULL,lease_until=NULL,last_error=coalesce(last_error,'BUDGET_EXHAUSTED'),control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.receipts SET state='failed',reason='BUDGET_EXHAUSTED' WHERE workspace_id=j.workspace_id AND id=j.domain_id AND state IN('received','parsed');
 UPDATE fw_async.refreshes SET status='failed',result=fw_async.failure_result(j.workspace_id,j.domain_id,'BUDGET_EXHAUSTED',NULL) WHERE workspace_id=j.workspace_id AND id=j.domain_id;
 CONTINUE;END IF;
 IF j.due_at>clock_timestamp() OR (SELECT count(*) FROM fw_dispatch.jobs WHERE workspace_id=w.id AND state='running')>=3 THEN CONTINUE;END IF;
 IF NOT pg_try_advisory_xact_lock(hashtextextended('fw-lane:'||p_profile,0)) THEN RETURN;END IF;
 IF (SELECT count(*) FROM fw_dispatch.jobs WHERE profile=p_profile AND state='running')>=2 THEN RETURN;END IF;
 UPDATE fw_dispatch.jobs SET state='running',generation=generation+1,lease_token=p_token,active_start=clock_timestamp(),lease_until=least(clock_timestamp()+interval '30 seconds',deadline),attempts=attempts+1,control_version=control_version+1 WHERE id=j.id RETURNING * INTO j;
 INSERT INTO fw_async.attempts VALUES(j.id,j.generation,j.active_start,NULL,NULL);
 RETURN NEXT j;RETURN;
 END LOOP;
END $$;
CREATE FUNCTION fw_dispatch.heartbeat(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;BEGIN j:=fw_async.lock_ticket(p_profile,p_id,p_generation,p_token,p_epoch);IF j.id IS NULL THEN RETURN false;END IF;
 UPDATE fw_dispatch.jobs SET lease_until=least(clock_timestamp()+interval '30 seconds',active_start+CASE WHEN kind='receipt' THEN interval '30 seconds' WHEN kind='price' THEN interval '60 seconds' ELSE interval '120 seconds' END,deadline) WHERE id=j.id AND active_start+(CASE WHEN kind='receipt' THEN interval '30 seconds' WHEN kind='price' THEN interval '60 seconds' ELSE interval '120 seconds' END)>clock_timestamp();RETURN FOUND;
END $$;
CREATE FUNCTION fw_dispatch.fail_attempt(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer,p_error text,p_transient boolean,p_floor timestamptz DEFAULT NULL) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;due timestamptz;BEGIN
 IF p_error NOT IN('TRANSIENT','RATE_LIMITED','PROVIDER_INVALID','AUTHORITY_REVOKED','LEASE_EXPIRED') THEN RAISE EXCEPTION 'ERROR_NOT_ALLOWLISTED';END IF;
 j:=fw_async.lock_ticket(p_profile,p_id,p_generation,p_token,p_epoch);IF j.id IS NULL THEN RETURN false;END IF;
 due:=greatest(clock_timestamp()+fw_async.backoff(j.attempts),p_floor);
 UPDATE fw_dispatch.jobs SET state=CASE WHEN p_transient AND attempts<max_attempts AND due<deadline THEN 'queued' ELSE 'failed' END,lease_token=NULL,lease_until=NULL,due_at=due,last_error=p_error,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition=p_error WHERE job_id=j.id AND generation=j.generation;
 UPDATE fw_async.receipts SET state='failed',reason=p_error WHERE workspace_id=j.workspace_id AND id=j.domain_id AND (SELECT state='failed' FROM fw_dispatch.jobs WHERE id=j.id);
 UPDATE fw_async.refreshes SET status=CASE WHEN (SELECT state FROM fw_dispatch.jobs WHERE id=j.id)='queued' THEN CASE WHEN p_error='RATE_LIMITED' THEN 'rate_limited' ELSE 'queued' END ELSE 'failed' END,result=fw_async.failure_result(j.workspace_id,j.domain_id,p_error,CASE WHEN (SELECT state FROM fw_dispatch.jobs WHERE id=j.id)='queued' THEN due ELSE NULL END) WHERE workspace_id=j.workspace_id AND id=j.domain_id;
 RETURN true;END $$;
CREATE OR REPLACE FUNCTION fw_dispatch.finalize(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer,p_success boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;BEGIN
 IF NOT p_success THEN RETURN fw_dispatch.fail_attempt(p_profile,p_id,p_generation,p_token,p_epoch,'TRANSIENT',true,NULL);END IF;
 j:=fw_async.lock_ticket(p_profile,p_id,p_generation,p_token,p_epoch);IF j.id IS NULL THEN RETURN false;END IF;
 -- Domain jobs can only finish through their typed effect port.
 IF j.kind<>'probe' THEN RAISE EXCEPTION 'TYPED_DOMAIN_PORT_REQUIRED';END IF;
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='succeeded' WHERE job_id=j.id AND generation=j.generation;
 RETURN true;END $$;
CREATE FUNCTION fw_dispatch.cancel(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;BEGIN j:=fw_async.lock_ticket(p_profile,p_id,p_generation,p_token,p_epoch);IF j.id IS NULL THEN RETURN false;END IF;
 UPDATE fw_dispatch.jobs SET state='cancelled',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='cancelled' WHERE job_id=j.id AND generation=j.generation;
 RETURN true;END $$;
CREATE FUNCTION fw_dispatch.manual_retry(p_profile text,p_id text,p_version integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM fw_control.state WHERE NOT locked FOR SHARE;IF NOT FOUND THEN RETURN false;END IF;
 PERFORM 1 FROM fw_auth.identities i JOIN fw_dispatch.jobs q ON q.subject_id=i.id WHERE q.id=p_id AND i.state='active' AND i.epoch=q.auth_epoch FOR UPDATE OF i;IF NOT FOUND THEN RETURN false;END IF;
 PERFORM 1 FROM fw_finance.workspaces w JOIN fw_dispatch.jobs q ON q.workspace_id=w.id WHERE q.id=p_id AND NOT blocked FOR UPDATE OF w;IF NOT FOUND THEN RETURN false;END IF;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=p_id FOR UPDATE;
 IF j.profile<>p_profile OR j.control_version<>p_version OR j.state<>'failed' OR j.last_error NOT IN('TRANSIENT','RATE_LIMITED','LEASE_EXPIRED') OR j.retry_cycles>=2 OR j.deadline<=clock_timestamp() OR j.recovery_epoch<>(SELECT epoch FROM fw_control.state) THEN RETURN false;END IF;
 UPDATE fw_dispatch.jobs SET state='queued',max_attempts=max_attempts+(CASE WHEN kind='receipt' THEN 8 WHEN kind='price' THEN 5 ELSE 3 END),retry_cycles=retry_cycles+1,control_version=control_version+1,due_at=greatest(due_at,clock_timestamp()) WHERE id=j.id;RETURN true;
END $$;
-- Intake is implemented in the authenticated owner/collector Tx. Processing is ticket-scoped.
CREATE FUNCTION fw_async.process_receipt(p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;r fw_async.receipts;b fw_async.bindings;a fw_finance.accounts;e jsonb;p jsonb;existing fw_async.semantic_records;eid text;rid text;gid text;day text;why text;n timestamptz;
BEGIN
 j:=fw_async.lock_ticket('ingestion',p_id,p_generation,p_token,p_epoch);IF j.id IS NULL OR j.kind<>'receipt' THEN RETURN false;END IF;
 SELECT * INTO r FROM fw_async.receipts WHERE workspace_id=j.workspace_id AND id=j.domain_id FOR UPDATE;
 SELECT * INTO b FROM fw_async.bindings WHERE workspace_id=j.workspace_id AND id=r.item->>'bindingId' FOR UPDATE;
 SELECT * INTO a FROM fw_finance.accounts WHERE workspace_id=j.workspace_id AND id=b.account_id FOR UPDATE;
 n:=clock_timestamp();e:=r.item->'normalizedEvidence';
 IF b.id IS NULL OR NOT b.enabled OR b.version<>(r.item->>'bindingVersion')::integer OR b.device_id<>j.device_id OR NOT EXISTS(SELECT 1 FROM fw_async.sources WHERE workspace_id=j.workspace_id AND id=b.source_id AND enabled) THEN why:='BINDING_REVOKED';
 ELSIF a.id IS NULL OR (a.payload->>'archived')::boolean THEN why:='ACCOUNT_UNAVAILABLE';END IF;
 IF why IS NOT NULL THEN UPDATE fw_async.receipts SET state='ignored',reason=why WHERE workspace_id=j.workspace_id AND id=r.id;
 ELSE
 day:=to_char((e->>'sourceOccurredAt')::timestamptz AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYY-MM-DD');
 SELECT * INTO existing FROM fw_async.semantic_records WHERE workspace_id=j.workspace_id AND namespace=b.namespace AND reference=e->>'transactionRef' AND account_id=b.account_id AND direction=e->>'direction';
 IF r.state IN('posted','needs_review','ignored') THEN NULL;
 ELSIF existing.event_id IS NOT NULL AND existing.amount=e->>'amount' AND existing.occurred_at=e->>'sourceOccurredAt' THEN
 UPDATE fw_async.receipts SET state='ignored',event_id=existing.event_id,reason='TRUSTED_REFERENCE_DUPLICATE' WHERE workspace_id=j.workspace_id AND id=r.id;
 ELSIF existing.event_id IS NOT NULL OR e->>'transactionRef' IS NULL OR e->>'ruleStatus'<>'complete' OR e->>'amount' IS NULL OR e->>'amount'='0' OR e->>'direction'='unknown' OR e->>'sourceAccountRef' IS DISTINCT FROM b.mask OR day IS NULL OR day<(SELECT tracking_start FROM fw_finance.workspaces WHERE id=j.workspace_id) OR day<a.payload->>'openingDate' OR (e->>'sourceOccurredAt')::timestamptz>n THEN
 rid:=replace(gen_random_uuid()::text,'-','');eid:=NULL;
 -- A complete amount/direction can become a pending event for existing preview/confirm Review.
 IF e->>'amount' ~ '^[1-9][0-9]{0,17}$' AND e->>'direction' IN('income','expense') AND day IS NOT NULL AND day>=(SELECT tracking_start FROM fw_finance.workspaces WHERE id=j.workspace_id) AND day>=a.payload->>'openingDate' AND (e->>'sourceOccurredAt')::timestamptz<=n THEN
 eid:=replace(gen_random_uuid()::text,'-','');
 p:=jsonb_build_object('kind',e->>'direction','amount',jsonb_build_object('value',e->>'amount','currency','VND'),'date',day,'accountId',b.account_id,'description','Synthetic notification requiring review','category','uncategorized','posting','pending','reconciliation','review','reference',e->>'transactionRef');
 INSERT INTO fw_finance.events VALUES(j.workspace_id,eid,0,eid,p);
 END IF;
 INSERT INTO fw_finance.reviews(workspace_id,id,payload) VALUES(j.workspace_id,rid,jsonb_build_object('type',CASE WHEN existing.event_id IS NOT NULL THEN 'duplicate' ELSE 'pending' END,'title','Notification requires owner review','status','open','eventId',eid,'holdingId',NULL,'accountId',b.account_id,'variance',NULL,'observed',NULL,'rawEvidenceId',NULL));
 UPDATE fw_async.receipts SET state='needs_review',event_id=eid,review_id=rid,reason=CASE WHEN existing.event_id IS NOT NULL THEN 'REFERENCE_CONFLICT' ELSE 'INCOMPLETE_OR_AMBIGUOUS' END WHERE workspace_id=j.workspace_id AND id=r.id;
 UPDATE fw_finance.workspaces SET version=version+1 WHERE id=j.workspace_id;
 ELSE
 eid:=replace(gen_random_uuid()::text,'-','');gid:=replace(gen_random_uuid()::text,'-','');
 p:=jsonb_build_object('kind',e->>'direction','amount',jsonb_build_object('value',e->>'amount','currency','VND'),'date',day,'accountId',b.account_id,'description','Verified synthetic notification','category','uncategorized','posting','posted','reconciliation','clear','reference',e->>'transactionRef');
 INSERT INTO fw_finance.events VALUES(j.workspace_id,eid,0,eid,p);
 INSERT INTO fw_finance.ledger_accounts VALUES(j.workspace_id,'counter:'||(e->>'direction'),NULL,e->>'direction') ON CONFLICT DO NOTHING;
 INSERT INTO fw_finance.entry_groups(workspace_id,id,event_id,event_version) VALUES(j.workspace_id,gid,eid,0);
 INSERT INTO fw_finance.posting_lines VALUES(j.workspace_id,gid,0,'asset:'||b.account_id,CASE WHEN e->>'direction'='income' THEN (e->>'amount')::numeric ELSE -(e->>'amount')::numeric END,'VND'),(j.workspace_id,gid,1,'counter:'||(e->>'direction'),CASE WHEN e->>'direction'='income' THEN -(e->>'amount')::numeric ELSE (e->>'amount')::numeric END,'VND');
 UPDATE fw_finance.entry_groups SET sealed=true WHERE workspace_id=j.workspace_id AND id=gid;
 INSERT INTO fw_async.semantic_records VALUES(j.workspace_id,b.namespace,e->>'transactionRef',b.account_id,e->>'direction',eid,e->>'amount',e->>'sourceOccurredAt');
 INSERT INTO fw_finance.history VALUES(j.workspace_id,replace(gen_random_uuid()::text,'-',''),eid,jsonb_build_object('id',replace(gen_random_uuid()::text,'-',''),'at',n,'action','notificationPosted','reason',NULL,'actorId',j.subject_id,'version',0,'evidenceIds',jsonb_build_array(r.id)));
 UPDATE fw_finance.accounts SET version=version+1 WHERE workspace_id=j.workspace_id AND id=b.account_id;
 UPDATE fw_finance.workspaces SET version=version+1 WHERE id=j.workspace_id;
 UPDATE fw_async.receipts SET state='posted',event_id=eid WHERE workspace_id=j.workspace_id AND id=r.id;
 END IF;
 END IF;
 SET CONSTRAINTS ALL IMMEDIATE;
 -- No network between the final live fence and effect commit.
 IF j.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'LEASE_EXPIRED';END IF;
 INSERT INTO fw_dispatch.outcomes VALUES(j.id,j.generation,jsonb_build_object('receiptId',r.id),clock_timestamp());
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='succeeded' WHERE job_id=j.id AND generation=j.generation;
 RETURN true;
END $$;
-- Stable per-source/rights selection identity, and a manifest for more than one partition.
CREATE FUNCTION fw_async.admit_refresh(p_workspace text,p_ids text[],p_key text,p_trigger text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE w fw_finance.workspaces;i fw_auth.identities;r integer;root text;child text;job text;part record;input jsonb;digest text;active text;recent boolean;parts integer;total integer;scope text;root_input jsonb;root_digest text;
BEGIN
 IF NOT (pg_has_role(session_user,'fw_runtime_user','member') OR pg_has_role(session_user,'fw_runtime_market','member')) THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 IF pg_has_role(session_user,'fw_runtime_user','member') AND p_workspace IS DISTINCT FROM current_setting('fw.workspace',true) THEN RAISE EXCEPTION 'WORKSPACE_DENIED' USING ERRCODE='42501';END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;IF r IS NULL THEN RAISE EXCEPTION 'RECOVERY_FENCE';END IF;
 SELECT a.* INTO i FROM fw_auth.identities a JOIN fw_finance.workspaces b ON b.subject_id=a.id WHERE b.id=p_workspace FOR UPDATE OF a;
 SELECT * INTO w FROM fw_finance.workspaces WHERE id=p_workspace FOR UPDATE;
 IF i.state<>'active' OR w.blocked OR (pg_has_role(session_user,'fw_runtime_user','member') AND i.id IS DISTINCT FROM current_setting('fw.subject',true)) THEN RAISE EXCEPTION 'WORKSPACE_DENIED' USING ERRCODE='42501';END IF;
 IF cardinality(p_ids)=0 OR p_trigger NOT IN('manual','scheduled') THEN RAISE EXCEPTION 'EMPTY_SELECTION';END IF;
 SELECT count(*) INTO total FROM fw_finance.holdings WHERE workspace_id=p_workspace AND id=ANY(p_ids) AND NOT (payload->>'archived')::boolean;
 IF total<>cardinality(p_ids) THEN RAISE EXCEPTION 'SELECTION_UNAVAILABLE';END IF;

 SELECT jsonb_agg(jsonb_build_object('id',h.id,'profile',h.payload,'entitlement',hs.entitlement_id,'rightsVersion',e.version,'sourceVersion',src.version) ORDER BY h.id) INTO root_input FROM fw_finance.holdings h LEFT JOIN fw_async.holding_sources hs ON hs.workspace_id=h.workspace_id AND hs.holding_id=h.id LEFT JOIN fw_async.entitlements e ON e.workspace_id=hs.workspace_id AND e.id=hs.entitlement_id LEFT JOIN fw_async.sources src ON src.workspace_id=e.workspace_id AND src.id=e.source_id WHERE h.workspace_id=p_workspace AND h.id=ANY(p_ids);
 root_digest:=md5(root_input::text);
 IF p_trigger='manual' THEN
 SELECT x.id INTO active FROM fw_async.refreshes x WHERE x.workspace_id=p_workspace AND x.parent_id IS NULL AND x.input->'rootSelection'=root_input AND (EXISTS(SELECT 1 FROM fw_dispatch.jobs q WHERE q.workspace_id=x.workspace_id AND q.domain_id=x.id AND q.state IN('queued','running')) OR EXISTS(SELECT 1 FROM fw_async.refreshes c JOIN fw_dispatch.jobs q ON q.workspace_id=c.workspace_id AND q.domain_id=c.id WHERE c.workspace_id=x.workspace_id AND c.parent_id=x.id AND q.state IN('queued','running'))) ORDER BY x.created_at DESC LIMIT 1;
 IF active IS NOT NULL THEN RETURN active;END IF;
 IF EXISTS(SELECT 1 FROM fw_async.refreshes x WHERE x.workspace_id=p_workspace AND x.parent_id IS NULL AND x.input->'rootSelection'=root_input AND x.created_at>clock_timestamp()-interval '60 seconds') THEN RAISE EXCEPTION 'RATE_LIMITED';END IF;
 END IF;
 -- Group by entitlement and bounded pages; every requested holding has an explicit result.
 WITH selected AS (SELECT h.id,h.version,h.payload,hs.entitlement_id,row_number() OVER(PARTITION BY hs.entitlement_id ORDER BY h.id) AS n FROM fw_finance.holdings h LEFT JOIN fw_async.holding_sources hs ON hs.workspace_id=h.workspace_id AND hs.holding_id=h.id WHERE h.workspace_id=p_workspace AND h.id=ANY(p_ids))
 SELECT count(*) INTO parts FROM (SELECT entitlement_id,(n-1)/100 FROM selected GROUP BY entitlement_id,(n-1)/100) q;
 root:=replace(gen_random_uuid()::text,'-','');
 IF parts>1 THEN INSERT INTO fw_async.refreshes(workspace_id,id,input,selection_digest) VALUES(p_workspace,root,jsonb_build_object('trigger',p_trigger,'key',p_key,'manifest',true,'rootSelection',root_input),root_digest);END IF;
 FOR part IN
 WITH selected AS (SELECT h.id,h.version,h.payload,hs.entitlement_id,row_number() OVER(PARTITION BY hs.entitlement_id ORDER BY h.id) AS n FROM fw_finance.holdings h LEFT JOIN fw_async.holding_sources hs ON hs.workspace_id=h.workspace_id AND hs.holding_id=h.id WHERE h.workspace_id=p_workspace AND h.id=ANY(p_ids))
 SELECT entitlement_id,(n-1)/100 AS page,jsonb_agg(jsonb_build_object('id',id,'version',version,'profile',payload) ORDER BY id) AS selection FROM selected GROUP BY entitlement_id,(n-1)/100 ORDER BY entitlement_id,page
 LOOP
 input:=jsonb_build_object('selection',part.selection,'entitlementId',part.entitlement_id,'entitlementVersion',(SELECT version FROM fw_async.entitlements WHERE workspace_id=p_workspace AND id=part.entitlement_id),'sourceVersion',(SELECT s.version FROM fw_async.sources s JOIN fw_async.entitlements e ON e.workspace_id=s.workspace_id AND e.source_id=s.id WHERE e.workspace_id=p_workspace AND e.id=part.entitlement_id),'trigger',p_trigger,'key',p_key,'rootSelection',root_input);
 -- md5 here is only a private coalescing index; full JSON equality also required, no integrity claim.
 scope:=(input-'trigger'-'key')::text;digest:=md5(scope);
 active:=NULL;
 child:=CASE WHEN parts=1 THEN root ELSE replace(gen_random_uuid()::text,'-','') END;job:=replace(gen_random_uuid()::text,'-','');
 INSERT INTO fw_async.refreshes(workspace_id,id,parent_id,entitlement_id,input,selection_digest) VALUES(p_workspace,child,CASE WHEN parts>1 THEN root ELSE NULL END,part.entitlement_id,input,digest);
 INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,auth_epoch,recovery_epoch,kind,deadline,max_attempts) VALUES(job,p_workspace,w.subject_id,'market',child,i.epoch,r,'price',clock_timestamp()+interval '6 hours',5);
 END LOOP;
 RETURN root;
END $$;
CREATE FUNCTION fw_async.price_input(p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;f fw_async.refreshes;e fw_async.entitlements;BEGIN
 j:=fw_async.lock_ticket('market',p_id,p_generation,p_token,p_epoch);IF j.id IS NULL OR j.kind<>'price' THEN RETURN NULL;END IF;
 SELECT * INTO f FROM fw_async.refreshes WHERE workspace_id=j.workspace_id AND id=j.domain_id FOR UPDATE;
 SELECT * INTO e FROM fw_async.entitlements WHERE workspace_id=j.workspace_id AND id=f.entitlement_id;
 UPDATE fw_async.refreshes SET status='running' WHERE workspace_id=j.workspace_id AND id=f.id;
 RETURN jsonb_build_object('input',f.input,'entitlement',to_jsonb(e),'serverNow',clock_timestamp());
END $$;
-- Reserve every applicable opaque scope together; intent written before external request.
CREATE FUNCTION fw_async.reserve_request(p_id text,p_generation integer,p_token text,p_epoch integer) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;f fw_async.refreshes;e fw_async.entitlements;s text;b fw_async.quota_buckets;lim integer;floor timestamptz;scope_floor timestamptz;day date;BEGIN
 j:=fw_async.lock_ticket('market',p_id,p_generation,p_token,p_epoch);IF j.id IS NULL OR j.kind<>'price' THEN RETURN jsonb_build_object('allowed',false,'reason','STALE_TICKET');END IF;
 SELECT * INTO f FROM fw_async.refreshes WHERE workspace_id=j.workspace_id AND id=j.domain_id FOR UPDATE;
 SELECT * INTO e FROM fw_async.entitlements WHERE workspace_id=j.workspace_id AND id=f.entitlement_id FOR UPDATE;
 IF e.id IS NULL OR NOT e.enabled OR NOT e.rights_confirmed OR e.version IS DISTINCT FROM (f.input->>'entitlementVersion')::integer OR e.expires_at<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM fw_async.sources WHERE workspace_id=j.workspace_id AND id=e.source_id AND enabled AND version=(f.input->>'sourceVersion')::integer) THEN RETURN jsonb_build_object('allowed',false,'reason','AUTHORITY_REVOKED');END IF;
 SELECT blocked_until INTO floor FROM fw_async.market_gate FOR SHARE;
 IF floor>clock_timestamp() THEN RETURN jsonb_build_object('allowed',false,'reason','RATE_LIMITED','retryAfter',floor);END IF;
 IF EXISTS(SELECT 1 FROM fw_async.intents WHERE job_id=j.id AND generation=j.generation) THEN RETURN jsonb_build_object('allowed',false,'reason','SENT_UNKNOWN');END IF;
 day:=(clock_timestamp() AT TIME ZONE 'UTC')::date;floor:=NULL;
 FOR s IN SELECT DISTINCT unnest(e.quota_scopes) ORDER BY 1 LOOP
 SELECT hard_limit,cooldown_until INTO lim,scope_floor FROM fw_async.quota_configs WHERE namespace=s FOR UPDATE;
 IF lim IS NULL THEN RETURN jsonb_build_object('allowed',false,'reason','AUTHORITY_REVOKED');END IF;
 INSERT INTO fw_async.quota_buckets VALUES(s,day,0,lim,NULL) ON CONFLICT DO NOTHING;
 SELECT * INTO b FROM fw_async.quota_buckets WHERE namespace=s AND window_start=day FOR UPDATE;
 IF b.hard_limit<>lim OR b.reserved>=least(lim,b.hard_limit) THEN floor:=greatest(floor,(day+1)::timestamptz);END IF;
 IF greatest(b.cooldown_until,scope_floor)>clock_timestamp() THEN floor:=greatest(floor,b.cooldown_until,scope_floor);END IF;
 END LOOP;
 IF floor IS NOT NULL THEN RETURN jsonb_build_object('allowed',false,'reason','RATE_LIMITED','retryAfter',floor);END IF;
 UPDATE fw_async.quota_buckets SET reserved=reserved+1 WHERE window_start=day AND namespace=ANY(e.quota_scopes);
 INSERT INTO fw_async.intents VALUES(j.id,j.generation,'sent_unknown',clock_timestamp());
 UPDATE fw_async.sources SET last_attempt=clock_timestamp() WHERE workspace_id=j.workspace_id AND id=e.source_id;
 RETURN jsonb_build_object('allowed',true);
END $$;
CREATE FUNCTION fw_async.cooldown(p_id text,p_generation integer,p_token text,p_epoch integer,p_floor timestamptz) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;e fw_async.entitlements;s text;BEGIN
 j:=fw_async.lock_ticket('market',p_id,p_generation,p_token,p_epoch);IF j.id IS NULL THEN RETURN false;END IF;
 SELECT a.* INTO e FROM fw_async.entitlements a JOIN fw_async.refreshes f ON f.workspace_id=a.workspace_id AND f.entitlement_id=a.id WHERE f.workspace_id=j.workspace_id AND f.id=j.domain_id;
 FOR s IN SELECT DISTINCT unnest(e.quota_scopes) ORDER BY 1 LOOP
 PERFORM 1 FROM fw_async.quota_configs WHERE namespace=s FOR UPDATE;
 UPDATE fw_async.quota_configs SET cooldown_until=greatest(cooldown_until,p_floor) WHERE namespace=s;
 PERFORM 1 FROM fw_async.quota_buckets WHERE namespace=s AND window_start=(clock_timestamp() AT TIME ZONE 'UTC')::date FOR UPDATE;
 UPDATE fw_async.quota_buckets SET cooldown_until=greatest(cooldown_until,p_floor) WHERE namespace=s AND window_start=(clock_timestamp() AT TIME ZONE 'UTC')::date;
 END LOOP;RETURN true;
END $$;
CREATE FUNCTION fw_async.aggregate_parent(p_workspace text,p_child text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE parent text;done boolean;failed boolean;all_failed boolean;BEGIN
 SELECT parent_id INTO parent FROM fw_async.refreshes WHERE workspace_id=p_workspace AND id=p_child;IF parent IS NULL THEN RETURN;END IF;
 PERFORM 1 FROM fw_async.refreshes WHERE workspace_id=p_workspace AND id=parent FOR UPDATE;
 SELECT bool_and(status IN('succeeded','partial','failed')),bool_or(status<>'succeeded'),bool_and(status='failed') INTO done,failed,all_failed FROM fw_async.refreshes WHERE workspace_id=p_workspace AND parent_id=parent;
 UPDATE fw_async.refreshes SET status=CASE WHEN done THEN CASE WHEN all_failed THEN 'failed' WHEN failed THEN 'partial' ELSE 'succeeded' END ELSE 'running' END,
 result=jsonb_build_object('results',coalesce((SELECT jsonb_agg(v) FROM fw_async.refreshes f CROSS JOIN LATERAL jsonb_array_elements(coalesce(f.result->'results','[]')) v WHERE f.workspace_id=p_workspace AND f.parent_id=parent),'[]'::jsonb),'fetchedAt',(SELECT max(result->>'fetchedAt') FROM fw_async.refreshes WHERE workspace_id=p_workspace AND parent_id=parent),'quoteAsOf',(SELECT min(result->>'quoteAsOf') FROM fw_async.refreshes WHERE workspace_id=p_workspace AND parent_id=parent),'retryAfter',(SELECT max(result->>'retryAfter') FROM fw_async.refreshes WHERE workspace_id=p_workspace AND parent_id=parent))
 WHERE workspace_id=p_workspace AND id=parent;
END $$;
CREATE FUNCTION fw_async.publish_prices(p_id text,p_generation integer,p_token text,p_epoch integer,p_quotes jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs;f fw_async.refreshes;e fw_async.entitlements;h fw_finance.holdings;s jsonb;q jsonb;price jsonb;fp text;qid text;results jsonb:='[]';state text;reason text;changed boolean:=false;asof timestamptz;lastasof timestamptz;n timestamptz;
BEGIN
 j:=fw_async.lock_ticket('market',p_id,p_generation,p_token,p_epoch);IF j.id IS NULL OR j.kind<>'price' THEN RETURN false;END IF;
 SELECT * INTO f FROM fw_async.refreshes WHERE workspace_id=j.workspace_id AND id=j.domain_id FOR UPDATE;
 SELECT * INTO e FROM fw_async.entitlements WHERE workspace_id=j.workspace_id AND id=f.entitlement_id FOR UPDATE;
 IF e.id IS NOT NULL AND (NOT e.enabled OR NOT e.rights_confirmed OR e.expires_at<=clock_timestamp() OR e.version IS DISTINCT FROM (f.input->>'entitlementVersion')::integer OR NOT EXISTS(SELECT 1 FROM fw_async.sources WHERE workspace_id=j.workspace_id AND id=e.source_id AND enabled AND version=(f.input->>'sourceVersion')::integer)) THEN RETURN false;END IF;
 IF p_quotes IS NULL OR jsonb_typeof(p_quotes)<>'array' OR jsonb_array_length(p_quotes)>100 OR octet_length(p_quotes::text)>131072 THEN RAISE EXCEPTION 'PROVIDER_INVALID';END IF;
 IF jsonb_array_length(p_quotes)>0 AND NOT EXISTS(SELECT 1 FROM fw_async.intents WHERE job_id=j.id AND generation=j.generation AND phase='sent_unknown') THEN RAISE EXCEPTION 'REQUEST_INTENT_REQUIRED';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_quotes) candidate(value) WHERE NOT EXISTS(SELECT 1 FROM jsonb_array_elements(f.input->'selection') v WHERE v->>'id'=candidate.value->>'holdingId')) OR EXISTS(SELECT 1 FROM jsonb_array_elements(p_quotes) candidate(value) GROUP BY candidate.value->>'holdingId' HAVING count(*)>1) THEN RAISE EXCEPTION 'PROVIDER_INVALID';END IF;
 n:=clock_timestamp();
 FOR s IN SELECT * FROM jsonb_array_elements(f.input->'selection') LOOP
 SELECT * INTO h FROM fw_finance.holdings WHERE workspace_id=j.workspace_id AND id=s->>'id' FOR UPDATE;
 SELECT v INTO q FROM jsonb_array_elements(p_quotes) v WHERE v->>'holdingId'=h.id;
 state:='missing';reason:='MISSING_PRICE';
 IF EXISTS(SELECT 1 FROM fw_finance.quotes WHERE workspace_id=j.workspace_id AND holding_id=h.id) THEN state:='retained';reason:='LAST_GOOD';END IF;
 IF (h.payload-ARRAY['name','cost','costDate','costQuantity','quantityDate']) IS DISTINCT FROM ((s->'profile')-ARRAY['name','cost','costDate','costQuantity','quantityDate']) OR (e.id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fw_async.holding_sources WHERE workspace_id=j.workspace_id AND holding_id=h.id AND entitlement_id=e.id)) THEN reason:='PROFILE_CHANGED';
 ELSIF q IS NOT NULL THEN
 IF (q-ARRAY['holdingId','value','currency','unit','quoteAsOf'])<>'{}'::jsonb OR q->>'quoteAsOf' IS NULL OR NOT coalesce(q->>'value' ~ '^(0|[1-9][0-9]{0,17})([.][0-9]{1,8})?$',false) OR (q->>'value')::numeric<=0 OR q->>'currency' IS DISTINCT FROM 'VND' OR q->>'unit' IS DISTINCT FROM (CASE WHEN h.payload->>'kind'='stock' THEN 'share' ELSE 'chi' END) OR (q->>'quoteAsOf')::timestamptz>n OR (q->>'quoteAsOf')::timestamptz<n-interval '30 days' THEN RAISE EXCEPTION 'PROVIDER_INVALID';END IF;
 asof:=(q->>'quoteAsOf')::timestamptz;lastasof:=least(lastasof,asof);
 fp:=encode(sha256(convert_to(jsonb_build_array(e.id,e.version,f.input->'sourceVersion',h.id,h.payload-ARRAY['name','cost','costDate','costQuantity','quantityDate'],trim_scale((q->>'value')::numeric)::text,q->>'currency',q->>'unit',extract(epoch FROM asof))::text,'UTF8')),'hex');
 SELECT quote_id INTO qid FROM fw_async.observation_fingerprints WHERE workspace_id=j.workspace_id AND fingerprint=fp;
 IF qid IS NULL THEN
 qid:=replace(gen_random_uuid()::text,'-','');price:=jsonb_build_object('value',q->>'value','currency','VND','per',q->>'unit');
 INSERT INTO fw_finance.quotes VALUES(j.workspace_id,qid,h.id,jsonb_build_object('id',qid,'version',0,'holdingId',h.id,'price',price,'at',asof,'sourceId',e.source_id,'compatible',true,'fxVndPerUsd',NULL,'fxAt',NULL,'evidenceIds','[]'::jsonb,'quoteAsOf',asof,'fetchedAt',n,'instrumentId',CASE WHEN h.payload->>'kind'='stock' THEN h.payload->>'catalogId' ELSE NULL END,'goldProfileId',CASE WHEN h.payload->>'kind'='gold' THEN h.payload->>'catalogId' ELSE NULL END,'side',CASE WHEN h.payload->>'kind'='stock' THEN 'close' ELSE 'buy' END,'quality',CASE WHEN asof<n-interval '36 hours' THEN 'stale' ELSE 'fresh' END));
 INSERT INTO fw_async.observation_fingerprints VALUES(j.workspace_id,fp,qid);
 INSERT INTO fw_async.quote_basis VALUES(j.workspace_id,qid,h.payload-ARRAY['name','cost','costDate','costQuantity','quantityDate']);changed:=true;
 END IF;state:='updated';reason:='STUB_OBSERVATION';
 END IF;
 results:=results||jsonb_build_array(jsonb_build_object('holdingId',h.id,'state',state,'reason',reason));
 END LOOP;
 IF changed THEN UPDATE fw_finance.workspaces SET version=version+1 WHERE id=j.workspace_id;END IF;
 UPDATE fw_async.intents SET phase='observed' WHERE job_id=j.id AND generation=j.generation;
 UPDATE fw_async.refreshes SET status=CASE WHEN NOT EXISTS(SELECT 1 FROM jsonb_array_elements(results) v WHERE v->>'state'<>'updated') THEN 'succeeded' ELSE 'partial' END,result=jsonb_build_object('results',results,'fetchedAt',n,'quoteAsOf',lastasof,'retryAfter',NULL) WHERE workspace_id=j.workspace_id AND id=f.id;
 IF lastasof IS NOT NULL THEN UPDATE fw_async.sources SET last_success=n WHERE workspace_id=j.workspace_id AND id=e.source_id;END IF;
 PERFORM fw_async.aggregate_parent(j.workspace_id,f.id);
 IF j.lease_until<=clock_timestamp() THEN RAISE EXCEPTION 'LEASE_EXPIRED';END IF;
 INSERT INTO fw_dispatch.outcomes VALUES(j.id,j.generation,jsonb_build_object('refreshId',f.id),clock_timestamp());
 UPDATE fw_dispatch.jobs SET state='done',lease_token=NULL,lease_until=NULL,control_version=control_version+1 WHERE id=j.id;
 UPDATE fw_async.attempts SET ended_at=clock_timestamp(),disposition='succeeded' WHERE job_id=j.id AND generation=j.generation;
 RETURN true;
END $$;
-- Host scheduling: latest daily occurrence, atomic watermark, no historical quote fabrication.
CREATE FUNCTION fw_async.scheduler_tick() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE c record;s fw_async.schedules;w fw_finance.workspaces;i fw_auth.identities;occ timestamptz;ids text[];refresh text;n timestamptz;cnt integer:=0;r integer;BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_market','member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;IF r IS NULL THEN RETURN 0;END IF;
 FOR c IN SELECT workspace_id FROM fw_async.schedules WHERE next_due_at<=clock_timestamp() ORDER BY next_due_at LIMIT 100 LOOP
 SELECT a.* INTO i FROM fw_auth.identities a JOIN fw_finance.workspaces b ON b.subject_id=a.id WHERE b.id=c.workspace_id FOR UPDATE OF a;
 SELECT * INTO w FROM fw_finance.workspaces WHERE id=c.workspace_id FOR UPDATE;
 SELECT * INTO s FROM fw_async.schedules WHERE workspace_id=c.workspace_id FOR UPDATE SKIP LOCKED;
 n:=clock_timestamp();IF s.workspace_id IS NULL OR s.next_due_at>n THEN CONTINUE;END IF;
 occ:=date_trunc('day',n AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'+interval '18 hours';
 IF occ>n THEN occ:=occ-interval '1 day';END IF;
 SELECT array_agg(id ORDER BY id) INTO ids FROM fw_finance.holdings WHERE workspace_id=w.id AND NOT (payload->>'archived')::boolean;
 refresh:=NULL;
 IF i.state='active' AND NOT w.blocked AND cardinality(ids)>0 THEN refresh:=fw_async.admit_refresh(w.id,ids,'daily_'||to_char(occ AT TIME ZONE 'Asia/Ho_Chi_Minh','YYYYMMDD'),'scheduled');END IF;
 INSERT INTO fw_async.schedule_history VALUES(w.id,occ,greatest(0,floor(extract(epoch FROM (occ-s.next_due_at))/86400)::integer),CASE WHEN refresh IS NULL THEN 'disabled_or_no_eligible' ELSE 'latest_only' END,refresh) ON CONFLICT DO NOTHING;
 UPDATE fw_async.schedules SET next_due_at=occ+interval '1 day',last_dispatched_at=n WHERE workspace_id=w.id;
 DELETE FROM fw_async.schedule_history WHERE workspace_id=w.id AND occurrence<n-interval '30 days';
 cnt:=cnt+1;
 END LOOP;RETURN cnt;
END $$;
CREATE FUNCTION fw_async.on_restore() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.epoch<>OLD.epoch THEN UPDATE fw_async.market_gate SET restored_at=clock_timestamp(),blocked_until=date_trunc('day',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC'+interval '1 day';END IF;RETURN NEW;END $$;
CREATE TRIGGER async_restore AFTER UPDATE ON fw_control.state FOR EACH ROW EXECUTE FUNCTION fw_async.on_restore();
CREATE FUNCTION fw_async.metrics() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('sampledAt',clock_timestamp(),'queued',(SELECT count(*) FROM fw_dispatch.jobs WHERE state='queued'),'running',(SELECT count(*) FROM fw_dispatch.jobs WHERE state='running'),'failed',(SELECT count(*) FROM fw_dispatch.jobs WHERE state='failed'),'oldestDue',(SELECT min(due_at) FROM fw_dispatch.jobs WHERE state='queued'),'receipts',(SELECT count(*) FROM fw_async.receipts),'posted',(SELECT count(*) FROM fw_async.receipts WHERE state='posted'),'needsReview',(SELECT count(*) FROM fw_async.receipts WHERE state='needs_review'),'quotaReserved',(SELECT coalesce(sum(reserved),0) FROM fw_async.quota_buckets),'restoreBlockedUntil',(SELECT blocked_until::text FROM fw_async.market_gate),'schedulerOverdue',(SELECT count(*) FROM fw_async.schedules WHERE next_due_at<clock_timestamp()-interval '2 minutes'),'dailyMissed',(SELECT coalesce(sum(missed),0) FROM fw_async.schedule_history),'dailyOccurrences',(SELECT count(*) FROM fw_async.schedule_history),'lastQuoteAsOf',(SELECT max(payload->>'quoteAsOf') FROM fw_finance.quotes),'lastFetchedAt',(SELECT max(payload->>'fetchedAt') FROM fw_finance.quotes),'staleQuotes',(SELECT count(*) FROM fw_finance.quotes WHERE (payload->>'at')::timestamptz<clock_timestamp()-interval '36 hours'),'coverageMissing',(SELECT count(*) FROM fw_async.refreshes f CROSS JOIN LATERAL jsonb_array_elements(coalesce(f.result->'results','[]')) v WHERE f.parent_id IS NULL AND v->>'state'='missing'))
$$;
-- All helper functions are private; explicit grants are the only executable entry points.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw_async FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw_dispatch FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_async.admit_refresh(text,text[],text,text) TO fw_runtime_user;
GRANT EXECUTE ON FUNCTION fw_async.process_receipt(text,integer,text,integer) TO fw_runtime_ingestion;
GRANT EXECUTE ON FUNCTION fw_async.price_input(text,integer,text,integer),fw_async.reserve_request(text,integer,text,integer),fw_async.publish_prices(text,integer,text,integer,jsonb),fw_async.cooldown(text,integer,text,integer,timestamptz),fw_async.scheduler_tick() TO fw_runtime_market;
GRANT EXECUTE ON FUNCTION fw_dispatch.heartbeat(text,text,integer,text,integer),fw_dispatch.fail_attempt(text,text,integer,text,integer,text,boolean,timestamptz),fw_dispatch.cancel(text,text,integer,text,integer),fw_dispatch.manual_retry(text,text,integer) TO fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
GRANT EXECUTE ON FUNCTION fw_async.metrics() TO fw_runtime_ops;
REVOKE ALL ON SCHEMA fw_async FROM PUBLIC;
GRANT INSERT ON fw_async.sources,fw_async.bindings TO fw_runtime_user;


INSERT INTO fw_async.schedules(workspace_id,next_due_at) SELECT id,date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'+interval '18 hours' FROM fw_finance.workspaces ON CONFLICT DO NOTHING;
CREATE FUNCTION fw_async.capture_cutoff() RETURNS timestamptz LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS 'SELECT restored_at FROM fw_async.market_gate';
REVOKE ALL ON FUNCTION fw_async.capture_cutoff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_async.capture_cutoff() TO fw_runtime_user;
CREATE FUNCTION fw_async.parent_on_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$ BEGIN IF NEW.parent_id IS NOT NULL THEN PERFORM fw_async.aggregate_parent(NEW.workspace_id,NEW.id);END IF;RETURN NEW;END $$;
REVOKE ALL ON FUNCTION fw_async.parent_on_status() FROM PUBLIC;
CREATE TRIGGER aggregate_refresh AFTER UPDATE OF status ON fw_async.refreshes FOR EACH ROW EXECUTE FUNCTION fw_async.parent_on_status();

CREATE FUNCTION fw_async.failure_result(p_workspace text,p_domain text,p_reason text,p_floor timestamptz) RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('results',coalesce(jsonb_agg(jsonb_build_object('holdingId',s->>'id','state',CASE WHEN EXISTS(SELECT 1 FROM fw_finance.quotes q WHERE q.workspace_id=p_workspace AND q.holding_id=s->>'id') THEN 'retained' ELSE 'missing' END,'reason',p_reason)),'[]'::jsonb),'fetchedAt',NULL,'quoteAsOf',NULL,'retryAfter',p_floor) FROM fw_async.refreshes f CROSS JOIN LATERAL jsonb_array_elements(f.input->'selection') s WHERE f.workspace_id=p_workspace AND f.id=p_domain
$$;
REVOKE ALL ON FUNCTION fw_async.failure_result(text,text,text,timestamptz) FROM PUBLIC;
CREATE FUNCTION fw_async.resolve_receipt_review(p_workspace text,p_review text,p_action text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_async.receipts;b fw_async.bindings;rv fw_finance.reviews;e fw_finance.events;BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_user','member') OR p_workspace IS DISTINCT FROM current_setting('fw.workspace',true) OR NOT EXISTS(SELECT 1 FROM fw_finance.workspaces w JOIN fw_auth.identities i ON i.id=w.subject_id WHERE w.id=p_workspace AND w.subject_id=current_setting('fw.subject',true) AND NOT w.blocked AND i.state='active') THEN RAISE EXCEPTION 'WORKSPACE_DENIED' USING ERRCODE='42501';END IF;
 SELECT * INTO rv FROM fw_finance.reviews WHERE workspace_id=p_workspace AND id=p_review;
 IF rv.payload->>'status'<>'resolved' OR p_action NOT IN('postPending','rejectPending') THEN RETURN;END IF;
 SELECT * INTO r FROM fw_async.receipts WHERE workspace_id=p_workspace AND review_id=p_review FOR UPDATE;
 IF r.id IS NULL OR r.state<>'needs_review' THEN RETURN;END IF;
 SELECT * INTO e FROM fw_finance.event_heads WHERE workspace_id=p_workspace AND id=r.event_id;
 IF (p_action='postPending' AND e.payload->>'posting'<>'posted') OR (p_action='rejectPending' AND e.payload->>'posting'<>'draft') THEN RAISE EXCEPTION 'REVIEW_EFFECT_REQUIRED';END IF;
 IF p_action='postPending' THEN
 SELECT * INTO b FROM fw_async.bindings WHERE workspace_id=p_workspace AND id=r.item->>'bindingId';
 IF r.item->'normalizedEvidence'->>'transactionRef' IS NOT NULL THEN
 INSERT INTO fw_async.semantic_records VALUES(p_workspace,b.namespace,r.item->'normalizedEvidence'->>'transactionRef',b.account_id,e.payload->>'kind',r.event_id,e.payload->'amount'->>'value',r.item->'normalizedEvidence'->>'sourceOccurredAt');
 END IF;
 END IF;
 UPDATE fw_async.receipts SET state=CASE WHEN p_action='postPending' THEN 'posted' ELSE 'ignored' END,reason='OWNER_REVIEW_RESOLVED' WHERE workspace_id=p_workspace AND id=r.id;
END $$;
REVOKE ALL ON FUNCTION fw_async.resolve_receipt_review(text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_async.resolve_receipt_review(text,text,text) TO fw_runtime_user;
GRANT USAGE ON SCHEMA fw_async TO fw_runtime_ops;
