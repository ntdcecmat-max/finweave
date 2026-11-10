-- Artifact only, dedicated disposable database; operator runs with CREATE ROLE privilege.
-- NOLOGIN group roles, no credentials, no BYPASSRLS, no schema/table ownership to clients.
BEGIN;
CREATE ROLE fw_app NOLOGIN NOBYPASSRLS;
CREATE ROLE fw_auth NOLOGIN NOBYPASSRLS;
CREATE ROLE fw_ops NOLOGIN NOBYPASSRLS;
CREATE ROLE fw_worker NOLOGIN NOBYPASSRLS;
CREATE ROLE fw_dispatch NOLOGIN NOBYPASSRLS;
GRANT USAGE ON SCHEMA fw TO fw_app,fw_auth,fw_ops,fw_worker;
GRANT USAGE ON SCHEMA fw TO fw_dispatch;
GRANT SELECT(id,owner_id) ON fw.workspaces TO fw_dispatch;
CREATE POLICY dispatch_workspace ON fw.workspaces FOR SELECT TO fw_dispatch USING (true);
GRANT SELECT,INSERT,UPDATE ON fw.workspaces TO fw_app;
GRANT SELECT(id,email,display_name,state,created_at,version,updated_at) ON fw.identities TO fw_app;
GRANT SELECT,INSERT,UPDATE ON fw.identities,fw.sessions,fw.identity_challenges TO fw_auth;
CREATE POLICY auth_identity ON fw.identities TO fw_auth USING (true) WITH CHECK (true);
CREATE POLICY auth_sessions ON fw.sessions TO fw_auth USING (true) WITH CHECK (true);
CREATE POLICY auth_challenges ON fw.identity_challenges TO fw_auth USING (true) WITH CHECK (true);
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema='fw' AND table_name LIKE 'ops_%' LOOP
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON fw.%I TO fw_ops',t.table_name);
  EXECUTE format('CREATE POLICY ops_metadata ON fw.%I TO fw_ops USING (true) WITH CHECK (true)',t.table_name);
 END LOOP;
 FOR t IN SELECT DISTINCT table_name FROM information_schema.columns WHERE table_schema='fw' AND column_name='workspace_id' LOOP
  EXECUTE format('GRANT SELECT,INSERT,UPDATE ON fw.%I TO fw_app,fw_worker',t.table_name);
 END LOOP;
END $$;
GRANT SELECT ON fw.instruments,fw.gold_profiles TO fw_app,fw_worker;
GRANT SELECT ON fw.workspaces TO fw_worker;
-- Dispatcher sees due IDs and owner mapping only, never result JSON or finance.
GRANT SELECT(workspace_id,id,state,next_attempt,lease_until,lease_token,attempts,version) ON fw.refresh_jobs,fw.ingestion_receipts TO fw_dispatch;
CREATE POLICY dispatch_refresh ON fw.refresh_jobs FOR SELECT TO fw_dispatch USING (true);
CREATE POLICY dispatch_receipt ON fw.ingestion_receipts FOR SELECT TO fw_dispatch USING (true);
GRANT SELECT(workspace_id,id,state,lease_until,lease_token,attempts,version) ON fw.import_jobs TO fw_dispatch;
CREATE POLICY dispatch_import ON fw.import_jobs FOR SELECT TO fw_dispatch USING (true);
GRANT SELECT(workspace_id,id,state,lease_until,lease_token,version) ON fw.agent_runs TO fw_dispatch;
CREATE POLICY dispatch_agent ON fw.agent_runs FOR SELECT TO fw_dispatch USING (true);
-- After selecting a due opaque reference, worker sets trusted owner/workspace context
-- and claims under the scoped worker connection with row locks and lease fencing.
-- Function execution is granted only to service roles, still not SECURITY DEFINER/bypass.
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA fw TO fw_app,fw_worker,fw_ops;
-- Retention DELETE and catalogue writes are deliberately not provisioned yet.
-- app/worker must SET LOCAL app.subject_id and app.workspace_id after trusted auth;
-- SQL cannot protect against a compromised backend that sets these arbitrarily.
COMMIT;
