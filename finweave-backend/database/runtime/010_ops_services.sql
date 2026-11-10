-- BE-16: OpsIdentity and metadata/control pools have disjoint grants.
CREATE ROLE fw_runtime_ops_business NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE SCHEMA fw_ops_private;
REVOKE ALL ON SCHEMA fw_ops_private FROM PUBLIC;
CREATE TABLE fw_ops_private.refs(kind text,scope text,private_id text,public_id text UNIQUE NOT NULL DEFAULT replace(gen_random_uuid()::text,'-',''),PRIMARY KEY(kind,scope,private_id));
CREATE TABLE fw_ops_private.pauses(workspace_id text,source_id text,PRIMARY KEY(workspace_id,source_id));
ALTER TABLE fw_dispatch.jobs ADD COLUMN requested_at timestamptz;
ALTER TABLE fw_dispatch.jobs ADD COLUMN updated_at timestamptz;
ALTER TABLE fw_dispatch.jobs ALTER COLUMN requested_at SET DEFAULT clock_timestamp();
ALTER TABLE fw_dispatch.jobs ALTER COLUMN updated_at SET DEFAULT clock_timestamp();
CREATE FUNCTION fw_ops_private.job_timestamp() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN NEW.updated_at:=clock_timestamp();RETURN NEW;END $$;
CREATE TRIGGER ops_job_timestamp BEFORE UPDATE ON fw_dispatch.jobs FOR EACH ROW EXECUTE FUNCTION fw_ops_private.job_timestamp();
CREATE TABLE fw_ops.state(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),version integer NOT NULL DEFAULT 1);
INSERT INTO fw_ops.state DEFAULT VALUES;
CREATE TABLE fw_ops.previews(token text PRIMARY KEY,actor text NOT NULL,session_id text NOT NULL,epoch integer NOT NULL,action jsonb NOT NULL,digest text NOT NULL,snapshot integer NOT NULL,expires_at timestamptz NOT NULL,consumed boolean NOT NULL DEFAULT false);
CREATE TABLE fw_ops.commands(actor text,operation text,key text,digest text NOT NULL,result_ref text NOT NULL,result jsonb,version integer,expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '90 days',PRIMARY KEY(actor,operation,key));
CREATE TABLE fw_ops.control_requests(id text PRIMARY KEY,actor text NOT NULL,action text NOT NULL CHECK(action IN('retry_job','disable_source')),object_id text NOT NULL,object_version integer NOT NULL,reason text NOT NULL CHECK(reason IN('SOURCE_DEGRADED','PARSER_UNSUPPORTED','TRANSIENT_FAILURE','USER_REPORTED_GAP','MAINTENANCE')),request_id text NOT NULL,epoch integer NOT NULL,actor_epoch integer NOT NULL,disposition text NOT NULL DEFAULT 'accepted' CHECK(disposition IN('accepted','applied','rejected')),created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE fw_ops.audit(id text PRIMARY KEY,actor_id text NOT NULL,action text NOT NULL,object_id text NOT NULL,reason text NOT NULL,from_version integer NOT NULL,to_version integer NOT NULL,result text NOT NULL CHECK(result IN('accepted','applied','rejected')),request_id text NOT NULL,at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE fw_ops.releases(id text PRIMARY KEY,version_name text NOT NULL,channel text NOT NULL,published_at timestamptz,url text,sha256 text,signing_fingerprint text,verified boolean NOT NULL DEFAULT false,compatibility text NOT NULL,test_state text NOT NULL CHECK(test_state IN('not_run','passed','failed')),CHECK(NOT verified OR (url LIKE 'https://%' AND sha256 ~ '^[a-f0-9]{64}$' AND signing_fingerprint IS NOT NULL AND published_at IS NOT NULL)));
CREATE TABLE fw_ops.incidents(id text PRIMARY KEY,severity text NOT NULL CHECK(severity IN('info','warning','critical')),source_id text REFERENCES fw_ops_private.refs(public_id),code text NOT NULL CHECK(code ~ '^[A-Z0-9_]{1,80}$'),status text NOT NULL CHECK(status IN('open','resolved')),created_at timestamptz NOT NULL DEFAULT clock_timestamp());
GRANT USAGE ON SCHEMA fw_ops TO fw_runtime_ops_business;
GRANT SELECT ON fw_ops.state,fw_ops.audit,fw_ops.releases,fw_ops.incidents,fw_ops.control_requests TO fw_runtime_ops_business;
GRANT SELECT,INSERT,UPDATE ON fw_ops.previews,fw_ops.commands TO fw_runtime_ops_business;
GRANT INSERT ON fw_ops.control_requests,fw_ops.audit TO fw_runtime_ops_business;
GRANT UPDATE ON fw_ops.state TO fw_runtime_ops_business;
-- No blanket grants on these newly created tables for the credential pool.

CREATE FUNCTION fw_ops.authorize(secret text,csrf text,mutating boolean) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE s fw_ops.sessions;i fw_ops.identities;r integer;BEGIN
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;
 IF r IS NULL THEN RETURN jsonb_build_object('error','RECOVERY_FENCE');END IF;
 SELECT * INTO s FROM fw_ops.sessions WHERE secret_digest=secret;
 IF s.id IS NULL THEN RETURN jsonb_build_object('error','UNAUTHENTICATED');END IF;
 SELECT * INTO i FROM fw_ops.identities WHERE id=s.subject_id FOR UPDATE;
 SELECT * INTO s FROM fw_ops.sessions WHERE id=s.id FOR UPDATE;
 IF NOT i.active OR s.revoked OR s.epoch<>i.epoch OR s.recovery_epoch<>r OR s.expires_at<=clock_timestamp() OR s.idle_at<=clock_timestamp() THEN RETURN jsonb_build_object('error','UNAUTHENTICATED');END IF;
 IF mutating AND csrf IS DISTINCT FROM s.csrf_digest THEN RETURN jsonb_build_object('error','FORBIDDEN');END IF;
 UPDATE fw_ops.sessions SET idle_at=least(expires_at,clock_timestamp()+interval '15 minutes') WHERE id=s.id;
 RETURN jsonb_build_object('id',i.id,'sessionId',s.id,'epoch',r,'actorEpoch',i.epoch,'fresh',s.reauth_at>clock_timestamp()-interval '5 minutes');
END $$;

CREATE FUNCTION fw_ops_private.ref(k text,s text,p text) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE v text;BEGIN
 INSERT INTO fw_ops_private.refs(kind,scope,private_id) VALUES(k,s,p) ON CONFLICT DO NOTHING;
 SELECT public_id INTO v FROM fw_ops_private.refs WHERE kind=k AND scope=s AND private_id=p;RETURN v;
END $$;
CREATE FUNCTION fw_ops_private.job_source(j fw_dispatch.jobs) RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT CASE WHEN j.kind='receipt' THEN (SELECT b.source_id FROM fw_async.receipts r JOIN fw_async.bindings b ON b.workspace_id=r.workspace_id AND b.id=r.item->>'bindingId' WHERE r.workspace_id=j.workspace_id AND r.id=j.domain_id)
 WHEN j.kind='price' THEN (SELECT e.source_id FROM fw_async.refreshes f JOIN fw_async.entitlements e ON e.workspace_id=f.workspace_id AND e.id=f.entitlement_id WHERE f.workspace_id=j.workspace_id AND f.id=j.domain_id) END
$$;
CREATE FUNCTION fw_ops_private.paused(j fw_dispatch.jobs) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM fw_ops_private.pauses p WHERE p.workspace_id=j.workspace_id AND p.source_id=fw_ops_private.job_source(j))
$$;
-- The DTO is constructed field by field; never serialize private rows or payloads.
CREATE FUNCTION fw_ops.metadata() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE accounts jsonb;sources jsonb;jobs jsonb;quotas jsonb;BEGIN
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',fw_ops_private.ref('account','',w.id),'workspaceId',fw_ops_private.ref('workspace','',w.id),'status',CASE WHEN w.blocked OR i.state<>'active' THEN 'suspended' ELSE 'active' END,'devices',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',fw_ops_private.ref('device','',d.id),'appVersion',CASE WHEN d.app_version ~ '^[0-9]{1,4}([.][0-9]{1,4}){1,3}$' OR EXISTS(SELECT 1 FROM fw_ops.releases a WHERE a.version_name=d.app_version) THEN d.app_version ELSE 'unknown' END,'lastSeen',NULL,'health','unknown')),'[]') FROM fw_auth.devices d WHERE d.workspace_id=w.id))),'[]') INTO accounts FROM fw_finance.workspaces w JOIN fw_auth.identities i ON i.id=w.subject_id;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',fw_ops_private.ref('source',s.workspace_id,s.id),'name',CASE s.kind WHEN 'bank' THEN 'Notification source' ELSE 'Price source' END,'packageName',CASE s.kind WHEN 'bank' THEN 'synthetic.bank' ELSE 'stub' END,'parserVersion','synthetic-v1','appCompatibility','synthetic-local','status',CASE WHEN s.enabled AND NOT EXISTS(SELECT 1 FROM fw_ops_private.pauses p WHERE p.workspace_id=s.workspace_id AND p.source_id=s.id) THEN 'enabled' ELSE 'disabled' END,'bindings',(SELECT count(*) FROM fw_async.bindings b WHERE b.workspace_id=s.workspace_id AND b.source_id=s.id),'version',s.version+1,'lastSuccess',s.last_success,'errorCode',NULL)),'[]') INTO sources FROM fw_async.sources s;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',fw_ops_private.ref('job','',j.id),'type',CASE j.kind WHEN 'price' THEN 'price_refresh' WHEN 'receipt' THEN 'ingestion' WHEN 'import' THEN 'import' WHEN 'agent' THEN 'agent' WHEN 'forecast' THEN 'forecast' ELSE 'sync' END,'state',CASE WHEN fw_ops_private.paused(j) AND j.state IN('queued','running') THEN 'paused' WHEN j.state='done' THEN 'succeeded' WHEN j.state='cancelled' THEN 'cancelled' ELSE j.state END,'sourceId',coalesce((SELECT fw_ops_private.ref('source',j.workspace_id,s.id) FROM fw_async.sources s WHERE s.workspace_id=j.workspace_id AND s.id=fw_ops_private.job_source(j)),'system'),'version',j.control_version+1,'attempts',j.attempts,'leaseUntil',j.lease_until,'requestedAt',j.requested_at,'updatedAt',j.updated_at,'errorCode',CASE WHEN j.last_error IN('TRANSIENT','RATE_LIMITED','LEASE_EXPIRED','BUDGET_EXHAUSTED','AUTHORITY_REVOKED','PROVIDER_INVALID') THEN j.last_error WHEN j.last_error IS NOT NULL THEN 'JOB_FAILED' ELSE NULL END,'requestId',fw_ops_private.ref('request','',j.id))),'[]') INTO jobs FROM fw_dispatch.jobs j;
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',fw_ops_private.ref('quota','',q.namespace),'name','Provider request quota','used',coalesce(b.reserved,0),'limit',q.hard_limit,'resetAt',(current_date+1)::timestamptz,'cooldownUntil',greatest(q.cooldown_until,b.cooldown_until))),'[]') INTO quotas FROM fw_async.quota_configs q LEFT JOIN fw_async.quota_buckets b ON b.namespace=q.namespace AND b.window_start=current_date;
 RETURN jsonb_build_object('accounts',accounts,'sources',sources,'jobs',jobs,'quotas',quotas);
END $$;

-- Preview eligibility returns a boolean, never the policy's private rows.
CREATE FUNCTION fw_ops.action_allowed(a text,oid text,v integer) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE m fw_ops_private.refs;j fw_dispatch.jobs;BEGIN
 SELECT * INTO m FROM fw_ops_private.refs WHERE public_id=oid;
 IF EXISTS(SELECT 1 FROM fw_ops.control_requests WHERE object_id=oid AND disposition='accepted') THEN RETURN false;END IF;
 IF a='disable_source' THEN RETURN m.kind='source' AND EXISTS(SELECT 1 FROM fw_async.sources WHERE workspace_id=m.scope AND id=m.private_id AND version+1=v AND enabled);END IF;
 IF a<>'retry_job' OR m.kind IS DISTINCT FROM 'job' THEN RETURN false;END IF;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=m.private_id;
 RETURN coalesce(j.kind IN('receipt','price') AND j.state='failed' AND j.control_version+1=v AND j.last_error IN('TRANSIENT','RATE_LIMITED','LEASE_EXPIRED') AND j.retry_cycles<2 AND j.deadline>clock_timestamp() AND (j.lease_until IS NULL OR j.lease_until<=clock_timestamp()) AND j.recovery_epoch=(SELECT epoch FROM fw_control.state WHERE NOT locked) AND NOT fw_ops_private.paused(j)
 AND EXISTS(SELECT 1 FROM fw_finance.workspaces w JOIN fw_auth.identities i ON i.id=w.subject_id WHERE w.id=j.workspace_id AND NOT w.blocked AND i.id=j.subject_id AND i.state='active' AND i.epoch=j.auth_epoch)
 AND EXISTS(SELECT 1 FROM fw_async.sources s WHERE s.workspace_id=j.workspace_id AND s.id=fw_ops_private.job_source(j) AND s.enabled)
 AND NOT EXISTS(SELECT 1 FROM fw_dispatch.outcomes WHERE job_id=j.id)
 AND NOT EXISTS(SELECT 1 FROM fw_async.intents WHERE job_id=j.id AND phase='sent_unknown')
 AND (j.device_id IS NULL OR EXISTS(SELECT 1 FROM fw_auth.devices d WHERE d.id=j.device_id AND NOT d.revoked AND d.epoch=j.device_epoch AND d.consent=j.consent AND d.subject_id=j.subject_id AND d.workspace_id=j.workspace_id AND d.auth_epoch=j.auth_epoch AND d.recovery_epoch=j.recovery_epoch AND d.authorized_until>clock_timestamp()))
 AND (CASE j.kind WHEN 'price' THEN EXISTS(SELECT 1 FROM fw_async.refreshes f JOIN fw_async.entitlements e ON e.workspace_id=f.workspace_id AND e.id=f.entitlement_id WHERE f.workspace_id=j.workspace_id AND f.id=j.domain_id AND e.enabled AND e.rights_confirmed AND e.expires_at>clock_timestamp()) ELSE EXISTS(SELECT 1 FROM fw_async.receipts r JOIN fw_async.bindings b ON b.workspace_id=r.workspace_id AND b.id=r.item->>'bindingId' WHERE r.workspace_id=j.workspace_id AND r.id=j.domain_id AND r.state='failed' AND b.enabled AND b.version=(r.item->>'bindingVersion')::integer) END),false);
END $$;
-- Broker is a worker capability. Ops can only enqueue an opaque request.
CREATE FUNCTION fw_ops.apply_controls(p_profile text) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE c fw_ops.control_requests;refrow fw_ops_private.refs;j fw_dispatch.jobs;s fw_async.sources;i fw_auth.identities;w fw_finance.workspaces;d fw_auth.devices;ok boolean;r integer;n integer:=0;BEGIN
 IF p_profile NOT IN('ingestion','market') OR NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;IF r IS NULL THEN RETURN 0;END IF;
 -- All Ops mutations take this row before business state to keep lock order stable.
 PERFORM 1 FROM fw_ops.state FOR UPDATE;
 FOR c IN SELECT q.* FROM fw_ops.control_requests q JOIN fw_ops_private.refs m ON m.public_id=q.object_id WHERE q.disposition='accepted' AND ((q.action='retry_job' AND m.kind='job' AND EXISTS(SELECT 1 FROM fw_dispatch.jobs a WHERE a.id=m.private_id AND a.profile=p_profile)) OR (q.action='disable_source' AND m.kind='source' AND EXISTS(SELECT 1 FROM fw_async.sources a WHERE a.workspace_id=m.scope AND a.id=m.private_id AND (CASE a.kind WHEN 'bank' THEN 'ingestion' ELSE 'market' END)=p_profile))) ORDER BY q.created_at,q.id LIMIT 100 FOR UPDATE OF q SKIP LOCKED LOOP
 ok:=false;SELECT * INTO refrow FROM fw_ops_private.refs WHERE public_id=c.object_id;
 IF c.epoch=r AND EXISTS(SELECT 1 FROM fw_ops.identities a WHERE a.id=c.actor AND a.active AND a.epoch=c.actor_epoch) THEN
 IF c.action='disable_source' THEN
 SELECT * INTO s FROM fw_async.sources WHERE workspace_id=refrow.scope AND id=refrow.private_id FOR UPDATE;
 IF s.version+1=c.object_version AND s.enabled THEN
 INSERT INTO fw_ops_private.pauses VALUES(s.workspace_id,s.id) ON CONFLICT DO NOTHING;
 UPDATE fw_async.sources SET enabled=false,version=version+1 WHERE workspace_id=s.workspace_id AND id=s.id;ok:=true;
 END IF;
 ELSE
 -- Owner/workspace/device are checked again under their usual lock order.
 SELECT a.* INTO i FROM fw_auth.identities a JOIN fw_dispatch.jobs q ON q.subject_id=a.id WHERE q.id=refrow.private_id FOR UPDATE OF a;
 SELECT a.* INTO w FROM fw_finance.workspaces a JOIN fw_dispatch.jobs q ON q.workspace_id=a.id WHERE q.id=refrow.private_id FOR UPDATE OF a;
 SELECT a.* INTO d FROM fw_auth.devices a JOIN fw_dispatch.jobs q ON q.device_id=a.id WHERE q.id=refrow.private_id FOR UPDATE OF a;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=refrow.private_id FOR UPDATE;
 IF j.kind IN('receipt','price') AND j.profile=p_profile AND j.state='failed' AND j.control_version+1=c.object_version AND j.last_error IN('TRANSIENT','RATE_LIMITED','LEASE_EXPIRED') AND j.retry_cycles<2 AND j.deadline>clock_timestamp() AND (j.lease_until IS NULL OR j.lease_until<=clock_timestamp()) AND j.recovery_epoch=r AND i.state='active' AND i.epoch=j.auth_epoch AND w.subject_id=i.id AND NOT w.blocked AND NOT fw_ops_private.paused(j) AND EXISTS(SELECT 1 FROM fw_async.sources a WHERE a.workspace_id=j.workspace_id AND a.id=fw_ops_private.job_source(j) AND a.enabled) AND NOT EXISTS(SELECT 1 FROM fw_dispatch.outcomes o WHERE o.job_id=j.id) AND NOT EXISTS(SELECT 1 FROM fw_async.intents a WHERE a.job_id=j.id AND a.phase='sent_unknown') AND (j.device_id IS NULL OR (d.id IS NOT NULL AND NOT d.revoked AND d.epoch=j.device_epoch AND d.consent=j.consent AND d.subject_id=j.subject_id AND d.workspace_id=j.workspace_id AND d.auth_epoch=i.epoch AND d.recovery_epoch=r AND d.authorized_until>clock_timestamp())) THEN
 -- Preserve provider cooldown, cumulative attempts and bounded manual retry cycles.
 IF j.kind='price' THEN
 ok:=EXISTS(SELECT 1 FROM fw_async.refreshes f JOIN fw_async.entitlements e ON e.workspace_id=f.workspace_id AND e.id=f.entitlement_id WHERE f.workspace_id=j.workspace_id AND f.id=j.domain_id AND e.enabled AND e.rights_confirmed AND e.expires_at>clock_timestamp());
 ELSE ok:=EXISTS(SELECT 1 FROM fw_async.receipts a JOIN fw_async.bindings b ON b.workspace_id=a.workspace_id AND b.id=a.item->>'bindingId' WHERE a.workspace_id=j.workspace_id AND a.id=j.domain_id AND a.state='failed' AND b.enabled AND b.version=(a.item->>'bindingVersion')::integer);END IF;
 IF ok THEN ok:=fw_dispatch.manual_retry(p_profile,j.id,j.control_version);END IF;
 END IF;
 END IF;END IF;
 UPDATE fw_ops.control_requests SET disposition=CASE WHEN ok THEN 'applied' ELSE 'rejected' END WHERE id=c.id;
 UPDATE fw_ops.state SET version=version+1;
 INSERT INTO fw_ops.audit(id,actor_id,action,object_id,reason,from_version,to_version,result,request_id) VALUES(replace(gen_random_uuid()::text,'-',''),c.actor,c.action,c.object_id,c.reason,c.object_version,c.object_version+CASE WHEN ok THEN 1 ELSE 0 END,CASE WHEN ok THEN 'applied' ELSE 'rejected' END,c.request_id);
 n:=n+1;
 END LOOP;RETURN n;
END $$;

-- Pause gates both new claims and live-ticket publication without deleting history.
DO $$ DECLARE definition text;BEGIN
 SELECT pg_get_functiondef('fw_dispatch.claim(text,text)'::regprocedure) INTO definition;
 IF position('IF j.due_at>clock_timestamp()' IN definition)=0 THEN RAISE EXCEPTION 'CLAIM_PAUSE_HOOK_MISSING';END IF;
 definition:=replace(definition,'IF j.due_at>clock_timestamp()','IF fw_ops_private.paused(j) THEN CONTINUE;END IF; IF j.due_at>clock_timestamp()');
 EXECUTE definition;
 SELECT pg_get_functiondef('fw_async.lock_ticket(text,text,integer,text,integer)'::regprocedure) INTO definition;
 IF position('IF r IS NULL OR r<>p_epoch' IN definition)=0 THEN RAISE EXCEPTION 'TICKET_PAUSE_HOOK_MISSING';END IF;
 definition:=replace(definition,'IF r IS NULL OR r<>p_epoch','IF j.kind IN(''receipt'',''price'') AND fw_ops_private.job_source(j) IS NOT NULL THEN PERFORM 1 FROM fw_async.sources WHERE workspace_id=j.workspace_id AND id=fw_ops_private.job_source(j) AND enabled FOR SHARE;IF NOT FOUND THEN RETURN NULL;END IF;END IF; IF fw_ops_private.paused(j) OR r IS NULL OR r<>p_epoch');
 EXECUTE definition;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw_ops_private FROM PUBLIC;
REVOKE ALL ON FUNCTION fw_ops.authorize(text,text,boolean),fw_ops.metadata(),fw_ops.action_allowed(text,text,integer),fw_ops.apply_controls(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_ops.authorize(text,text,boolean),fw_ops.metadata(),fw_ops.action_allowed(text,text,integer) TO fw_runtime_ops_business;
GRANT USAGE ON SCHEMA fw_ops TO fw_runtime_ingestion,fw_runtime_market;
GRANT EXECUTE ON FUNCTION fw_ops.apply_controls(text) TO fw_runtime_ingestion,fw_runtime_market;
