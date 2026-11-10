BEGIN;
-- Profile separation; local NOLOGIN capabilities. Login credentials are outside this bundle.
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_owner_reader') THEN CREATE ROLE fw_owner_reader NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_owner_reader' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_ops_business') THEN CREATE ROLE fw_ops_business NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_ops_business' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_ops_identity') THEN CREATE ROLE fw_ops_identity NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_ops_identity' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_ingestion') THEN CREATE ROLE fw_ingestion NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_ingestion' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_import') THEN CREATE ROLE fw_import NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_import' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_market') THEN CREATE ROLE fw_market NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_market' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_agent') THEN CREATE ROLE fw_agent NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_agent' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_forecast') THEN CREATE ROLE fw_forecast NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_forecast' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_scheduler') THEN CREATE ROLE fw_scheduler NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_scheduler' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_retention') THEN CREATE ROLE fw_retention NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_retention' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_recovery') THEN CREATE ROLE fw_recovery NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_recovery' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_quota') THEN CREATE ROLE fw_quota NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; ELSIF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='fw_quota' AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolinherit OR rolbypassrls OR rolcanlogin)) THEN RAISE EXCEPTION 'CAPABILITY_ROLE_DRIFT'; END IF; END $$;
GRANT USAGE ON SCHEMA fw TO fw_owner_reader,fw_ops_business,fw_ops_identity,fw_ingestion,fw_import,fw_market,fw_agent,fw_forecast,fw_scheduler,fw_retention,fw_recovery,fw_quota;
REVOKE ALL ON ALL TABLES IN SCHEMA fw FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA fw REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA fw REVOKE ALL ON TABLES FROM PUBLIC;

ALTER TABLE fw.identities DROP CONSTRAINT identities_state_check;
ALTER TABLE fw.identities ADD CHECK(state IN ('pending_verification','active','suspended','deleted'));
ALTER TABLE fw.sessions DROP CONSTRAINT sessions_role_check;
ALTER TABLE fw.sessions ADD CHECK(role='owner');
ALTER TABLE fw.identity_challenges DROP CONSTRAINT identity_challenges_purpose_check;
ALTER TABLE fw.identity_challenges ADD CHECK(purpose IN ('signin','register','reset','enrollment','collector_token','reauth'));
ALTER TABLE fw.identities ADD UNIQUE(recovery_token);
ALTER TABLE fw.workspaces ADD UNIQUE(recovery_token);
ALTER TABLE fw.devices ADD UNIQUE(recovery_token);
ALTER TABLE fw.identities ADD CHECK(recovery_token ~ '^[0-9a-f]{64}$');
ALTER TABLE fw.workspaces ADD CHECK(recovery_token ~ '^[0-9a-f]{64}$');
ALTER TABLE fw.devices ADD CHECK(recovery_token ~ '^[0-9a-f]{64}$');
ALTER TABLE fw.workspaces ADD CHECK(access_state IN ('active','blocked','erasing','erased'));
ALTER TABLE fw.sessions ADD CHECK(kind IN ('browser','native') AND ((kind='native')=(installation_id IS NOT NULL)) AND last_user_activity_at<=absolute_expires_at AND expires_at<=absolute_expires_at);
ALTER TABLE fw.identity_challenges ADD CHECK(flow_purpose IN ('signin_web','signin_native','register_web','register_native','reset','reauth','enrollment','collector_token'));
ALTER TABLE fw.identity_challenges ADD CHECK(state IN ('pending','consumed','expired','locked'));
ALTER TABLE fw.devices ADD CHECK(signing_algorithm='ES256' AND public_key_format='base64url_der_spki');
ALTER TABLE fw.auth_client_instances ADD CHECK(state IN ('active','revoked') AND ((state='revoked')=(revoked_at IS NOT NULL)));
ALTER TABLE fw.admin_principals ADD CHECK(mfa_required AND status IN ('active','suspended','revoked'));
ALTER TABLE fw.admin_sessions ADD CHECK(last_user_activity_at<=absolute_expires_at AND expires_at<=absolute_expires_at);
ALTER TABLE fw.admin_mfa_factors ADD CHECK(method='totp_sha1_6_30' AND octet_length(secret_ciphertext) BETWEEN 28 AND 8192);
ALTER TABLE fw.admin_challenges ADD CHECK(attempts BETWEEN 0 AND 5 AND expires_at>created_at);
ALTER TABLE fw.session_credentials ADD CHECK(audience IN ('owner_access','owner_refresh','collector') AND expires_at>created_at AND
 ((audience='collector' AND session_id IS NULL AND workspace_id IS NOT NULL AND device_id IS NOT NULL AND device_epoch IS NOT NULL AND recovery_epoch IS NOT NULL)
 OR (audience<>'collector' AND session_id IS NOT NULL AND workspace_id IS NULL AND device_id IS NULL AND device_epoch IS NULL AND recovery_epoch IS NULL)));
CREATE UNIQUE INDEX credentials_owner_generation ON fw.session_credentials(session_id,audience,generation) WHERE session_id IS NOT NULL;
CREATE UNIQUE INDEX credentials_collector_generation ON fw.session_credentials(workspace_id,device_id,audience,generation) WHERE audience='collector';
CREATE UNIQUE INDEX credentials_current_refresh ON fw.session_credentials(session_id) WHERE audience='owner_refresh' AND consumed_at IS NULL AND revoked_at IS NULL;
CREATE UNIQUE INDEX credentials_current_collector ON fw.session_credentials(workspace_id,device_id) WHERE audience='collector' AND consumed_at IS NULL AND revoked_at IS NULL;
CREATE INDEX credentials_revoke_subject ON fw.session_credentials(subject_id,expires_at);
CREATE INDEX challenge_expiry ON fw.identity_challenges(expires_at,purpose,state);
CREATE INDEX native_nonce_expiry ON fw.native_proof_nonces(expires_at);
CREATE INDEX collector_nonce_expiry ON fw.collector_proof_nonces(expires_at);
CREATE INDEX service_nonce_expiry ON fw.service_nonces(expires_at);
ALTER TABLE fw.auth_replays ADD CHECK(expires_at<=committed_at+interval '5 minutes' AND octet_length(response_ciphertext)<=8192);
ALTER TABLE fw.ops_auth_replays ADD CHECK(expires_at<=committed_at+interval '5 minutes' AND octet_length(response_ciphertext)<=8192);
ALTER TABLE fw.auth_rate_buckets ADD CHECK(attempts BETWEEN 0 AND 100000);
ALTER TABLE fw.ops_auth_rate_buckets ADD CHECK(attempts BETWEEN 0 AND 100000);
ALTER TABLE fw.planning_scopes ADD CHECK(kind IN ('plan','standalone') AND ((kind='plan')=(plan_id IS NOT NULL)));
ALTER TABLE fw.import_rows ADD CHECK(row_number>0 AND (redacted_at IS NULL OR normalized_row IS NULL));
ALTER TABLE fw.payload_objects ADD CHECK(redacted_at IS NULL OR content IS NULL);
ALTER TABLE fw.jobs ADD CHECK(state IN ('queued','running','succeeded','failed','cancelled') AND attempt_count BETWEEN 0 AND max_attempts AND max_attempts BETWEEN 1 AND 100 AND deadline_at>created_at AND
 ((state='running' AND lease_until IS NOT NULL AND lease_token IS NOT NULL) OR (state<>'running' AND lease_until IS NULL AND lease_token IS NULL)));
ALTER TABLE fw.job_attempts ADD CHECK(attempt_no>0 AND (finished_at IS NULL OR finished_at>=started_at) AND ((finished_at IS NULL)=(outcome IS NULL)));
ALTER TABLE fw.provider_quota_buckets ADD CHECK(window_end>window_start AND reserved_count BETWEEN 0 AND limit_value);
ALTER TABLE fw.recovery_journal ADD UNIQUE(scope_kind,workspace_token,epoch);
ALTER TABLE fw.recovery_journal ADD CHECK(scope_kind IN ('identity','workspace','device') AND event_kind IN ('delete','revoke','restore') AND environment_id='local-synthetic');
ALTER TABLE fw.recovery_delivery_state ADD CHECK(state IN ('prepared','anchored','applied','failed') AND attempt_count BETWEEN 0 AND 100 AND (state NOT IN ('anchored','applied') OR (witness_sequence IS NOT NULL AND witness_receipt IS NOT NULL)));
ALTER TABLE fw.erasure_requests ADD CHECK(scope_kind IN ('identity','workspace') AND id IS DISTINCT FROM parent_request_id AND (parent_request_id IS NULL OR scope_kind='workspace') AND backup_purge_due_at<=created_at+interval '35 days');
ALTER TABLE fw.erasure_requests ADD CHECK(state IN ('requested','denied','anchored','active_purged','backup_pending','completed','failed') AND (state<>'completed' OR (checkpoint_ref IS NOT NULL AND active_purged_at IS NOT NULL AND completed_at IS NOT NULL)));
CREATE INDEX erasure_parent ON fw.erasure_requests(parent_request_id);
CREATE INDEX erasure_due ON fw.erasure_requests(backup_purge_due_at) WHERE state<>'completed';
CREATE INDEX recovery_pending ON fw.recovery_delivery_state(updated_at) WHERE state IN ('prepared','failed');
ALTER TABLE fw.forecast_runs ADD CHECK(state IN ('queued','running','succeeded','failed','cancelled','expired') AND trials BETWEEN 1 AND 1000);
ALTER TABLE fw.forecast_result_pages ADD CHECK(page_index>=0);
CREATE INDEX forecast_state ON fw.forecast_runs(workspace_id,state,created_at);
CREATE INDEX forecast_pages ON fw.forecast_result_pages(workspace_id,run_id,page_index);
ALTER TABLE fw.holding_movements ADD CHECK(sequence_no>0 AND quantity_mode IN ('set','delta') AND (quantity_mode<>'delta' OR delta IS NOT NULL));
CREATE UNIQUE INDEX movements_sequence ON fw.holding_movements(workspace_id,holding_id,sequence_no);
DROP INDEX fw.actual_unique_active;
CREATE UNIQUE INDEX actual_revision_active ON fw.actual_links(workspace_id,planning_revision_id,event_id) WHERE released_at IS NULL;
-- Legacy domain dispatch indexes are removed only at this maintenance cutover.
DROP INDEX fw.refresh_due;
DROP INDEX fw.ops_due;
DROP INDEX fw.receipt_pending;

CREATE FUNCTION fw.guard_control_fences() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE n jsonb:=to_jsonb(NEW); o jsonb:=to_jsonb(OLD); k text;
BEGIN
 FOREACH k IN ARRAY ARRAY['auth_epoch','recovery_epoch','recovery_control_epoch','owner_epoch','credential_epoch','refresh_generation'] LOOP
  IF (n->>k)::bigint < (o->>k)::bigint THEN RAISE EXCEPTION 'FENCE_REWIND_FORBIDDEN' USING ERRCODE='23514'; END IF;
 END LOOP;
 IF o ? 'recovery_token' AND n->>'recovery_token' IS DISTINCT FROM o->>'recovery_token' THEN RAISE EXCEPTION 'RECOVERY_TOKEN_IMMUTABLE' USING ERRCODE='23514'; END IF;
 IF o->>'access_state' IN ('erasing','erased') AND n->>'access_state' IS DISTINCT FROM o->>'access_state' THEN RAISE EXCEPTION 'ERASURE_REACTIVATION_FORBIDDEN' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER control_fences BEFORE UPDATE ON fw.identities FOR EACH ROW EXECUTE FUNCTION fw.guard_control_fences();
CREATE TRIGGER control_fences BEFORE UPDATE ON fw.workspaces FOR EACH ROW EXECUTE FUNCTION fw.guard_control_fences();
CREATE TRIGGER control_fences BEFORE UPDATE ON fw.devices FOR EACH ROW EXECUTE FUNCTION fw.guard_control_fences();
CREATE TRIGGER control_fences BEFORE UPDATE ON fw.sessions FOR EACH ROW EXECUTE FUNCTION fw.guard_control_fences();

CREATE FUNCTION fw.guard_erasure_tree() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE p fw.erasure_requests;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.scope_kind||':'||NEW.target_token,0));
 IF TG_OP='UPDATE' AND (NEW.parent_request_id IS DISTINCT FROM OLD.parent_request_id OR NEW.target_token<>OLD.target_token OR NEW.scope_kind<>OLD.scope_kind OR NEW.backup_purge_due_at<>OLD.backup_purge_due_at) THEN RAISE EXCEPTION 'ERASURE_IDENTITY_DEADLINE_IMMUTABLE' USING ERRCODE='23514'; END IF;
 IF NEW.parent_request_id IS NOT NULL THEN
  SELECT * INTO p FROM fw.erasure_requests WHERE id=NEW.parent_request_id FOR UPDATE;
  IF p.id IS NULL OR p.scope_kind<>'identity' OR p.parent_request_id IS NOT NULL OR NEW.backup_purge_due_at<>p.backup_purge_due_at THEN RAISE EXCEPTION 'ERASURE_PARENT_OR_DEADLINE_INVALID' USING ERRCODE='23514'; END IF;
 END IF;
 IF TG_OP='INSERT' AND EXISTS(SELECT 1 FROM fw.erasure_requests WHERE scope_kind=NEW.scope_kind AND target_token=NEW.target_token AND state<>'completed') THEN RAISE EXCEPTION 'ERASURE_EXISTING_WORKFLOW_REQUIRED' USING ERRCODE='23514'; END IF;
 IF NEW.state='completed' AND EXISTS(SELECT 1 FROM fw.erasure_requests WHERE parent_request_id=NEW.id AND state<>'completed') THEN RAISE EXCEPTION 'ERASURE_CHILDREN_INCOMPLETE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER erasure_tree BEFORE INSERT OR UPDATE ON fw.erasure_requests FOR EACH ROW EXECUTE FUNCTION fw.guard_erasure_tree();

CREATE FUNCTION fw.guard_credential_owner() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF NEW.audience='collector' AND NOT EXISTS(SELECT 1 FROM fw.devices d JOIN fw.workspaces w ON w.id=d.workspace_id WHERE d.workspace_id=NEW.workspace_id AND d.id=NEW.device_id AND d.owner_id=NEW.subject_id AND d.status='active' AND d.credential_epoch=NEW.device_epoch AND w.recovery_epoch=NEW.recovery_epoch AND w.access_state='active') THEN RAISE EXCEPTION 'COLLECTOR_OWNER_OR_FENCE_INVALID' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER credential_owner BEFORE INSERT OR UPDATE ON fw.session_credentials FOR EACH ROW EXECUTE FUNCTION fw.guard_credential_owner();

CREATE FUNCTION fw.guard_planning_scope() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE s fw.planning_scopes;
BEGIN
 SELECT * INTO s FROM fw.planning_scopes WHERE workspace_id=NEW.workspace_id AND id=NEW.scope_id FOR UPDATE;
 IF s.id IS NULL OR s.plan_id IS DISTINCT FROM NEW.plan_id THEN RAISE EXCEPTION 'PLANNING_SCOPE_MISMATCH' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER planning_scope BEFORE INSERT OR UPDATE ON fw.plan_items FOR EACH ROW EXECUTE FUNCTION fw.guard_planning_scope();

-- Restrictive policies also constrain historical permissive policies. Workspace lookup is
-- nonrecursive: workspace policy reads identity, and tenant policies read workspace.
CREATE POLICY workspace_live ON fw.workspaces AS RESTRICTIVE USING (access_state='active' AND EXISTS(SELECT 1 FROM fw.identities i WHERE i.id=owner_id AND i.state='active' AND NOT i.recovery_reset_required));
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT table_name FROM information_schema.columns WHERE table_schema='fw' AND column_name='workspace_id' AND table_name<>'session_credentials' LOOP
  EXECUTE format('CREATE POLICY tenant_live ON fw.%I AS RESTRICTIVE USING (workspace_id=current_setting(''app.workspace_id'',true) AND EXISTS(SELECT 1 FROM fw.workspaces w WHERE w.id=workspace_id AND w.owner_id=current_setting(''app.subject_id'',true)))',t.table_name);
  IF NOT EXISTS(SELECT 1 FROM pg_policies WHERE schemaname='fw' AND tablename=t.table_name AND policyname='workspace_owner') THEN
   EXECUTE format('CREATE POLICY workspace_owner ON fw.%I USING (workspace_id=current_setting(''app.workspace_id'',true))',t.table_name);
  END IF;
 END LOOP;
END $$;
GRANT SELECT(id,state,recovery_reset_required) ON fw.identities TO fw_owner_reader;
GRANT SELECT ON fw.workspaces,fw.accounts,fw.ledger_accounts,fw.events,fw.posting_lines,fw.holdings,fw.holding_movements,fw.quote_observations,fw.financial_plans,fw.plan_items,fw.goals,fw.goal_allocations,fw.actual_links,fw.planning_scopes,fw.planning_revisions,fw.planning_revision_items TO fw_owner_reader;
-- No general owner INSERT/UPDATE or generic payload read. Auth and domain command ports
-- must be implemented explicitly; deny is preferable to inventing broad grants.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema='fw' AND table_name IN ('ops_accounts','ops_sources','ops_jobs','ops_quotas','ops_releases','ops_incidents') LOOP
  EXECUTE format('GRANT SELECT ON fw.%I TO fw_ops_business',t.table_name);
  EXECUTE format('CREATE POLICY ops_safe ON fw.%I FOR SELECT TO fw_ops_business USING (true)',t.table_name);
 END LOOP;
 FOR t IN SELECT unnest(ARRAY['planning_revisions','planning_revision_items','forecast_result_pages','recovery_journal','security_audit_events']) AS table_name LOOP
  EXECUTE format('CREATE TRIGGER immutable_row BEFORE UPDATE OR DELETE ON fw.%I FOR EACH ROW EXECUTE FUNCTION fw.immutable_row()',t.table_name);
  EXECUTE format('CREATE TRIGGER immutable_truncate BEFORE TRUNCATE ON fw.%I FOR EACH STATEMENT EXECUTE FUNCTION fw.immutable_row()',t.table_name);
 END LOOP;
END $$;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw FROM PUBLIC;
COMMIT;
