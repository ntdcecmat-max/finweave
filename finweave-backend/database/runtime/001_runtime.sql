-- Additive executable local foundation; does not mutate/seal the historical DB005 bundle.
CREATE SCHEMA fw_auth;
CREATE SCHEMA fw_finance;
CREATE SCHEMA fw_ops;
CREATE SCHEMA fw_dispatch;
CREATE SCHEMA fw_control;
CREATE ROLE fw_runtime_user NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE fw_runtime_ops NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE fw_runtime_ingestion NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE fw_runtime_market NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE fw_runtime_forecast NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE fw_runtime_agent NOLOGIN NOSUPERUSER NOBYPASSRLS;
CREATE ROLE fw_runtime_retention NOLOGIN NOSUPERUSER NOBYPASSRLS;

CREATE TABLE fw_control.state(singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), epoch integer NOT NULL DEFAULT 0, locked boolean NOT NULL DEFAULT false);
INSERT INTO fw_control.state DEFAULT VALUES;
CREATE FUNCTION fw_control.read_state() RETURNS SETOF fw_control.state LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS 'SELECT * FROM fw_control.state FOR SHARE';
REVOKE ALL ON FUNCTION fw_control.read_state() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_control.read_state() TO fw_runtime_user,fw_runtime_ops;
CREATE TABLE fw_control.denies(id text PRIMARY KEY, subject_id text NOT NULL, epoch integer NOT NULL, kind text NOT NULL CHECK(kind IN ('reset','revoke','erase')), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), anchored boolean NOT NULL DEFAULT false);
CREATE TABLE fw_auth.identities(id text PRIMARY KEY, email text UNIQUE NOT NULL, name text NOT NULL, password text NOT NULL, state text NOT NULL CHECK(state IN ('pending','active','blocked','erased')), epoch integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE fw_auth.challenges(id text PRIMARY KEY, subject_id text REFERENCES fw_auth.identities, purpose text NOT NULL, nonce text NOT NULL, code_digest text NOT NULL, public_key text, session_id text, workspace_id text, binding jsonb NOT NULL DEFAULT '{}', attempts integer NOT NULL DEFAULT 0, consumed boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL, epoch integer NOT NULL DEFAULT 0);
CREATE TABLE fw_auth.sessions(id text PRIMARY KEY, subject_id text NOT NULL REFERENCES fw_auth.identities, kind text NOT NULL CHECK(kind IN ('web','native')), secret_digest text UNIQUE NOT NULL, csrf_digest text, public_key text, installation_id text, epoch integer NOT NULL, recovery_epoch integer NOT NULL, revoked boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL, absolute_at timestamptz NOT NULL, idle_at timestamptz NOT NULL, reauth_at timestamptz);
CREATE TABLE fw_auth.refresh_tokens(digest text PRIMARY KEY, session_id text NOT NULL REFERENCES fw_auth.sessions, consumed boolean NOT NULL DEFAULT false);
CREATE TABLE fw_auth.browser_rotations(digest text PRIMARY KEY,session_id text NOT NULL REFERENCES fw_auth.sessions,csrf_digest text NOT NULL,key text NOT NULL,expires_at timestamptz NOT NULL);
CREATE TABLE fw_auth.resets(digest text PRIMARY KEY, subject_id text NOT NULL REFERENCES fw_auth.identities, epoch integer NOT NULL, consumed boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL);
CREATE TABLE fw_auth.recovery_codes(digest text PRIMARY KEY, subject_id text NOT NULL REFERENCES fw_auth.identities, consumed boolean NOT NULL DEFAULT false);
CREATE TABLE fw_auth.replays(scope text NOT NULL, operation text NOT NULL, key text NOT NULL, digest text NOT NULL, body text NOT NULL, expires_at timestamptz NOT NULL, PRIMARY KEY(scope,operation,key));
CREATE TABLE fw_auth.nonces(principal text NOT NULL, nonce text NOT NULL, expires_at timestamptz NOT NULL, PRIMARY KEY(principal,nonce));
CREATE TABLE fw_auth.rates(key text PRIMARY KEY, bucket bigint NOT NULL, count integer NOT NULL);
CREATE TABLE fw_auth.devices(id text PRIMARY KEY, subject_id text NOT NULL REFERENCES fw_auth.identities, workspace_id text NOT NULL, public_key text NOT NULL, name text NOT NULL, app_version text NOT NULL, consent text NOT NULL, epoch integer NOT NULL DEFAULT 0, auth_epoch integer NOT NULL, recovery_epoch integer NOT NULL, revoked boolean NOT NULL DEFAULT false, authorized_until timestamptz NOT NULL);
CREATE TABLE fw_auth.collectors(digest text PRIMARY KEY, device_id text NOT NULL REFERENCES fw_auth.devices, consumed boolean NOT NULL DEFAULT false, epoch integer NOT NULL, expires_at timestamptz NOT NULL);

CREATE TABLE fw_finance.workspaces(id text PRIMARY KEY, subject_id text NOT NULL REFERENCES fw_auth.identities, version integer NOT NULL DEFAULT 0, tracking_start text NOT NULL, blocked boolean NOT NULL DEFAULT false);
ALTER TABLE fw_auth.devices ADD CONSTRAINT device_workspace FOREIGN KEY(workspace_id) REFERENCES fw_finance.workspaces(id);
CREATE TABLE fw_finance.accounts(workspace_id text NOT NULL REFERENCES fw_finance.workspaces, id text NOT NULL, version integer NOT NULL DEFAULT 0, payload jsonb NOT NULL, PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_finance.commands(subject_id text NOT NULL, workspace_id text NOT NULL, operation text NOT NULL, key text NOT NULL, digest text NOT NULL, result_ref text NOT NULL, result jsonb, version integer, expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '90 days', PRIMARY KEY(subject_id,workspace_id,operation,key));
CREATE TABLE fw_finance.audit(id text PRIMARY KEY, subject_id text NOT NULL, workspace_id text NOT NULL, operation text NOT NULL, result_ref text NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp());
CREATE TABLE fw_dispatch.jobs(id text PRIMARY KEY, workspace_id text NOT NULL REFERENCES fw_finance.workspaces, subject_id text NOT NULL, profile text NOT NULL CHECK(profile IN ('ingestion','market','forecast','agent','retention')), domain_id text NOT NULL, state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','running','done','failed','cancelled')), generation integer NOT NULL DEFAULT 0, lease_token text, lease_until timestamptz, deadline timestamptz NOT NULL DEFAULT clock_timestamp()+interval '1 hour', attempts integer NOT NULL DEFAULT 0, max_attempts integer NOT NULL DEFAULT 3, auth_epoch integer NOT NULL, recovery_epoch integer NOT NULL, due_at timestamptz NOT NULL DEFAULT clock_timestamp(), UNIQUE(profile,workspace_id,domain_id));
CREATE TABLE fw_dispatch.outcomes(job_id text PRIMARY KEY REFERENCES fw_dispatch.jobs, generation integer NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp());

CREATE TABLE fw_ops.identities(id text PRIMARY KEY, email text UNIQUE NOT NULL, password text NOT NULL, seed text NOT NULL, last_step bigint NOT NULL DEFAULT -1, epoch integer NOT NULL DEFAULT 0);
CREATE TABLE fw_ops.sessions(id text PRIMARY KEY, subject_id text NOT NULL REFERENCES fw_ops.identities, secret_digest text UNIQUE NOT NULL, csrf_digest text NOT NULL, epoch integer NOT NULL, recovery_epoch integer NOT NULL, revoked boolean NOT NULL DEFAULT false, expires_at timestamptz NOT NULL, idle_at timestamptz NOT NULL, reauth_at timestamptz);
CREATE TABLE fw_ops.replays(LIKE fw_auth.replays INCLUDING ALL);
CREATE TABLE fw_ops.rates(LIKE fw_auth.rates INCLUDING ALL);

GRANT USAGE ON SCHEMA fw_auth,fw_finance,fw_control,fw_dispatch TO fw_runtime_user;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA fw_auth TO fw_runtime_user;
GRANT SELECT,INSERT,UPDATE ON ALL TABLES IN SCHEMA fw_finance TO fw_runtime_user;
GRANT SELECT ON fw_control.state TO fw_runtime_user,fw_runtime_ops;
GRANT INSERT ON fw_control.denies TO fw_runtime_user;
GRANT USAGE ON SCHEMA fw_ops,fw_control TO fw_runtime_ops;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA fw_ops TO fw_runtime_ops;
GRANT INSERT ON fw_dispatch.jobs TO fw_runtime_user;

ALTER TABLE fw_finance.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_finance.workspaces FORCE ROW LEVEL SECURITY;
CREATE POLICY owned_workspace ON fw_finance.workspaces TO fw_runtime_user USING(subject_id=current_setting('fw.subject',true)) WITH CHECK(subject_id=current_setting('fw.subject',true));
ALTER TABLE fw_finance.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fw_finance.accounts FORCE ROW LEVEL SECURITY;
CREATE POLICY owned_account ON fw_finance.accounts TO fw_runtime_user USING(workspace_id=current_setting('fw.workspace',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT w.blocked)) WITH CHECK(workspace_id=current_setting('fw.workspace',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT w.blocked));
ALTER TABLE fw_finance.commands ENABLE ROW LEVEL SECURITY;
CREATE POLICY owned_command ON fw_finance.commands TO fw_runtime_user USING(subject_id=current_setting('fw.subject',true)) WITH CHECK(subject_id=current_setting('fw.subject',true));
ALTER TABLE fw_finance.audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY owned_audit ON fw_finance.audit TO fw_runtime_user USING(subject_id=current_setting('fw.subject',true)) WITH CHECK(subject_id=current_setting('fw.subject',true));

-- Worker authority is a narrow SECURITY DEFINER port; never a table grant.
CREATE FUNCTION fw_dispatch.claim(p_profile text,p_token text) RETURNS SETOF fw_dispatch.jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs; owner_row fw_auth.identities; workspace_row fw_finance.workspaces; r integer;
BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;
 IF r IS NULL THEN RETURN; END IF;
 UPDATE fw_dispatch.jobs SET state='failed',lease_token=NULL,lease_until=NULL WHERE profile=p_profile AND state IN ('queued','running') AND (deadline<=clock_timestamp() OR (attempts>=max_attempts AND (state='queued' OR lease_until<=clock_timestamp())));
 SELECT q.* INTO j FROM fw_dispatch.jobs q JOIN fw_auth.identities i ON i.id=q.subject_id JOIN fw_finance.workspaces w ON w.id=q.workspace_id
 WHERE q.profile=p_profile AND (q.state='queued' OR(q.state='running' AND q.lease_until<clock_timestamp())) AND q.due_at<=clock_timestamp() AND q.deadline>clock_timestamp() AND q.attempts<q.max_attempts AND i.state='active' AND i.epoch=q.auth_epoch AND w.subject_id=i.id AND NOT w.blocked AND q.recovery_epoch=r ORDER BY q.due_at,q.id LIMIT 1;
 IF j.id IS NULL THEN RETURN; END IF;
 SELECT * INTO owner_row FROM fw_auth.identities WHERE id=j.subject_id FOR UPDATE;
 SELECT * INTO workspace_row FROM fw_finance.workspaces WHERE id=j.workspace_id FOR UPDATE;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=j.id FOR UPDATE SKIP LOCKED;
 IF j.id IS NULL OR owner_row.state<>'active' OR owner_row.epoch<>j.auth_epoch OR workspace_row.blocked OR j.recovery_epoch<>r OR j.attempts>=j.max_attempts OR j.deadline<=clock_timestamp() OR (j.state<>'queued' AND (j.state<>'running' OR j.lease_until>=clock_timestamp())) THEN RETURN; END IF;
 UPDATE fw_dispatch.jobs SET state='running',generation=generation+1,lease_token=p_token,lease_until=least(clock_timestamp()+interval '30 seconds',deadline),attempts=attempts+1 WHERE id=j.id RETURNING * INTO j;
 RETURN NEXT j;
END $$;
CREATE FUNCTION fw_dispatch.finalize(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer,p_success boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs; i fw_auth.identities; w fw_finance.workspaces; r integer;
BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;
 SELECT a.* INTO i FROM fw_auth.identities a JOIN fw_dispatch.jobs q ON q.subject_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT a.* INTO w FROM fw_finance.workspaces a JOIN fw_dispatch.jobs q ON q.workspace_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=p_id FOR UPDATE;
 IF r IS NULL OR r<>p_epoch OR j.id IS NULL OR i.id IS NULL OR w.id IS NULL OR j.profile<>p_profile OR j.state<>'running' OR j.generation<>p_generation OR j.lease_token<>p_token OR j.lease_until<=clock_timestamp() OR j.deadline<=clock_timestamp() OR i.state<>'active' OR i.epoch<>j.auth_epoch OR w.blocked OR j.recovery_epoch<>r THEN RETURN false; END IF;
 UPDATE fw_dispatch.jobs SET state=CASE WHEN p_success THEN 'done' WHEN attempts>=max_attempts THEN 'failed' ELSE 'queued' END,lease_token=NULL,lease_until=NULL,due_at=clock_timestamp()+interval '10 seconds' WHERE id=p_id;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_dispatch.claim(text,text),fw_dispatch.finalize(text,text,integer,text,integer,boolean) FROM PUBLIC;
GRANT USAGE ON SCHEMA fw_dispatch TO fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
GRANT EXECUTE ON FUNCTION fw_dispatch.claim(text,text),fw_dispatch.finalize(text,text,integer,text,integer,boolean) TO fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
CREATE FUNCTION fw_dispatch.complete(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer,p_result jsonb) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF octet_length(p_result::text)>16384 THEN RAISE EXCEPTION 'CHECKPOINT_TOO_LARGE'; END IF;
 IF NOT fw_dispatch.finalize(p_profile,p_id,p_generation,p_token,p_epoch,true) THEN RETURN false; END IF;
 INSERT INTO fw_dispatch.outcomes(job_id,generation,result) VALUES(p_id,p_generation,p_result);
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw_dispatch.complete(text,text,integer,text,integer,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_dispatch.complete(text,text,integer,text,integer,jsonb) TO fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
REVOKE ALL ON SCHEMA fw_auth,fw_ops,fw_finance,fw_control,fw_dispatch FROM PUBLIC;
