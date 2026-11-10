-- DB005 additive expand. Existing added fields stay nullable until verified backfill.
BEGIN;
ALTER TABLE fw."identities" ADD COLUMN "auth_epoch" bigint;
ALTER TABLE fw."identities" ADD COLUMN "email_verified_at" timestamptz;
ALTER TABLE fw."identities" ADD COLUMN "recovery_token" text;
ALTER TABLE fw."identities" ADD COLUMN "recovery_control_epoch" bigint;
ALTER TABLE fw."identities" ADD COLUMN "recovery_reset_required" boolean;
ALTER TABLE fw."workspaces" ADD COLUMN "recovery_epoch" bigint;
ALTER TABLE fw."workspaces" ADD COLUMN "recovery_token" text;
ALTER TABLE fw."workspaces" ADD COLUMN "recovery_control_epoch" bigint;
ALTER TABLE fw."workspaces" ADD COLUMN "access_state" text;
ALTER TABLE fw."sessions" ADD COLUMN "kind" text;
ALTER TABLE fw."sessions" ADD COLUMN "installation_id" text;
ALTER TABLE fw."sessions" ADD COLUMN "auth_epoch" bigint;
ALTER TABLE fw."sessions" ADD COLUMN "last_user_activity_at" timestamptz;
ALTER TABLE fw."sessions" ADD COLUMN "absolute_expires_at" timestamptz;
ALTER TABLE fw."sessions" ADD COLUMN "reauthenticated_at" timestamptz;
ALTER TABLE fw."sessions" ADD COLUMN "refresh_generation" bigint;
ALTER TABLE fw."sessions" ADD COLUMN "csrf_key_ref" text;
ALTER TABLE fw."sessions" ADD COLUMN "revoke_reason" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "flow_purpose" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "bound_session_id" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "client_key_digest" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "nonce_digest" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "nonce_value" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "auth_epoch" bigint;
ALTER TABLE fw."identity_challenges" ADD COLUMN "workspace_id" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "device_id" text;
ALTER TABLE fw."identity_challenges" ADD COLUMN "device_epoch" bigint;
ALTER TABLE fw."identity_challenges" ADD COLUMN "recovery_epoch" bigint;
ALTER TABLE fw."identity_challenges" ADD COLUMN "state" text;
ALTER TABLE fw."devices" ADD COLUMN "owner_epoch" bigint;
ALTER TABLE fw."devices" ADD COLUMN "signing_algorithm" text;
ALTER TABLE fw."devices" ADD COLUMN "public_key_format" text;
ALTER TABLE fw."devices" ADD COLUMN "credential_epoch" bigint;
ALTER TABLE fw."devices" ADD COLUMN "installation_id" text;
ALTER TABLE fw."devices" ADD COLUMN "authorized_until" timestamptz;
ALTER TABLE fw."devices" ADD COLUMN "recovery_token" text;
ALTER TABLE fw."devices" ADD COLUMN "recovery_control_epoch" bigint;
ALTER TABLE fw."holding_movements" ADD COLUMN "sequence_no" bigint;
ALTER TABLE fw."holding_movements" ADD COLUMN "quantity_mode" text;
ALTER TABLE fw."quote_observations" ADD COLUMN "profile_snapshot" jsonb;
ALTER TABLE fw."evidence" ADD COLUMN "content_payload_id" text;
ALTER TABLE fw."ingestion_receipts" ADD COLUMN "capture_epoch" bigint;
ALTER TABLE fw."ingestion_receipts" ADD COLUMN "result_payload_id" text;
ALTER TABLE fw."refresh_jobs" ADD COLUMN "result_payload_id" text;
ALTER TABLE fw."refresh_jobs" ADD COLUMN "request_payload_id" text;
ALTER TABLE fw."import_previews" ADD COLUMN "row_count" integer;
ALTER TABLE fw."import_previews" ADD COLUMN "rows_digest" text;
ALTER TABLE fw."import_jobs" ADD COLUMN "result_payload_id" text;
ALTER TABLE fw."snapshots" ADD COLUMN "refs_digest" text;
ALTER TABLE fw."snapshots" ADD COLUMN "engine_version" text;
ALTER TABLE fw."plan_items" ADD COLUMN "scope_id" text;
ALTER TABLE fw."actual_links" ADD COLUMN "planning_revision_id" text;
ALTER TABLE fw."tool_results" ADD COLUMN "result_payload_id" text;
ALTER TABLE fw."idempotency_records" ADD COLUMN "result_payload_id" text;
CREATE TABLE fw."jobs" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "job_type" text NOT NULL,
  "domain_kind" text NOT NULL,
  "domain_id" text NOT NULL,
  "dedupe_key" text NOT NULL,
  "state" text NOT NULL,
  "next_attempt_at" timestamptz NOT NULL,
  "lease_until" timestamptz,
  "lease_token" text,
  "generation" bigint NOT NULL,
  "attempt_count" integer NOT NULL,
  "max_attempts" integer NOT NULL,
  "cancel_requested" boolean NOT NULL,
  "recovery_epoch" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "policy_version" text NOT NULL,
  "deadline_at" timestamptz NOT NULL
);
ALTER TABLE fw."jobs" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."jobs" ADD UNIQUE  (workspace_id,job_type,dedupe_key);
ALTER TABLE fw."jobs" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."jobs" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."job_attempts" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "job_id" text NOT NULL,
  "attempt_no" integer NOT NULL,
  "generation" bigint NOT NULL,
  "worker_profile" text NOT NULL,
  "started_at" timestamptz NOT NULL,
  "finished_at" timestamptz,
  "outcome" text,
  "error_code" text
);
ALTER TABLE fw."job_attempts" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."job_attempts" ADD UNIQUE  (workspace_id,job_id,attempt_no);
ALTER TABLE fw."job_attempts" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."job_attempts" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."scheduler_state" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "schedule_key" text NOT NULL,
  "scope_key" text NOT NULL,
  "workspace_id" text,
  "timezone" text NOT NULL,
  "next_due_at" timestamptz NOT NULL,
  "last_dispatched_at" timestamptz,
  "version" bigint NOT NULL
);
ALTER TABLE fw."scheduler_state" ADD PRIMARY KEY (id);
ALTER TABLE fw."scheduler_state" ADD UNIQUE  (schedule_key,scope_key);
ALTER TABLE fw."scheduler_state" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."scheduler_state" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."planning_scopes" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "kind" text NOT NULL,
  "plan_id" text,
  "current_revision" bigint NOT NULL,
  "version" bigint NOT NULL
);
ALTER TABLE fw."planning_scopes" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."planning_scopes" ADD UNIQUE NULLS NOT DISTINCT (workspace_id,plan_id);
ALTER TABLE fw."planning_scopes" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."planning_scopes" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."planning_revisions" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "scope_id" text NOT NULL,
  "revision_no" bigint NOT NULL,
  "base_snapshot_id" text NOT NULL,
  "source_versions" jsonb NOT NULL,
  "engine_version" text NOT NULL,
  "bundle_digest" text NOT NULL
);
ALTER TABLE fw."planning_revisions" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."planning_revisions" ADD UNIQUE  (workspace_id,scope_id,revision_no);
ALTER TABLE fw."planning_revisions" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."planning_revisions" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."planning_revision_items" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "planning_revision_id" text NOT NULL,
  "plan_item_id" text NOT NULL,
  "plan_item_version" bigint NOT NULL,
  "frozen_item" jsonb NOT NULL,
  "item_digest" text NOT NULL
);
ALTER TABLE fw."planning_revision_items" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."planning_revision_items" ADD UNIQUE  (workspace_id,planning_revision_id,plan_item_id,plan_item_version);
ALTER TABLE fw."planning_revision_items" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."planning_revision_items" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."projection_cache" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "snapshot_id" text NOT NULL,
  "query_digest" text NOT NULL,
  "result_payload_id" text,
  "expires_at" timestamptz NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE fw."projection_cache" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."projection_cache" ADD UNIQUE  (workspace_id,snapshot_id,query_digest);
ALTER TABLE fw."projection_cache" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."projection_cache" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."import_rows" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "preview_id" text NOT NULL,
  "row_key" text NOT NULL,
  "row_number" integer NOT NULL,
  "status" text NOT NULL,
  "normalized_row" jsonb,
  "row_digest" text NOT NULL,
  "error_code" text,
  "expires_at" timestamptz NOT NULL,
  "redacted_at" timestamptz
);
ALTER TABLE fw."import_rows" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."import_rows" ADD UNIQUE  (workspace_id,preview_id,row_key);
ALTER TABLE fw."import_rows" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."import_rows" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."admin_principals" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "login_name" text NOT NULL,
  "auth_ref" text NOT NULL,
  "status" text NOT NULL,
  "auth_epoch" bigint NOT NULL,
  "mfa_required" boolean NOT NULL,
  "version" bigint NOT NULL,
  "password_hash" text NOT NULL
);
ALTER TABLE fw."admin_principals" ADD PRIMARY KEY (id);
ALTER TABLE fw."admin_principals" ADD UNIQUE  (login_name);
ALTER TABLE fw."admin_principals" ADD UNIQUE  (auth_ref);
ALTER TABLE fw."admin_principals" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."admin_principals" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."admin_sessions" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text NOT NULL,
  "token_digest" text NOT NULL,
  "auth_epoch" bigint NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz,
  "mfa_verified_at" timestamptz,
  "last_user_activity_at" timestamptz NOT NULL,
  "absolute_expires_at" timestamptz NOT NULL,
  "csrf_key_ref" text NOT NULL,
  "reauthenticated_at" timestamptz NOT NULL,
  "revoke_reason" text
);
ALTER TABLE fw."admin_sessions" ADD PRIMARY KEY (id);
ALTER TABLE fw."admin_sessions" ADD UNIQUE  (token_digest);
ALTER TABLE fw."admin_sessions" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."admin_sessions" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."admin_mfa_factors" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text NOT NULL,
  "method" text NOT NULL,
  "secret_ref" text NOT NULL,
  "status" text NOT NULL,
  "counter" bigint NOT NULL,
  "key_version" text NOT NULL,
  "secret_ciphertext" bytea NOT NULL
);
ALTER TABLE fw."admin_mfa_factors" ADD PRIMARY KEY (id);
ALTER TABLE fw."admin_mfa_factors" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."admin_mfa_factors" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."admin_challenges" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text,
  "purpose" text NOT NULL,
  "challenge_digest" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "attempts" integer NOT NULL,
  "consumed_at" timestamptz
);
ALTER TABLE fw."admin_challenges" ADD PRIMARY KEY (id);
ALTER TABLE fw."admin_challenges" ADD UNIQUE  (challenge_digest);
ALTER TABLE fw."admin_challenges" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."admin_challenges" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."payload_objects" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "owner_module" text NOT NULL,
  "object_kind" text NOT NULL,
  "object_id" text NOT NULL,
  "schema_ref" text NOT NULL,
  "content_digest" text NOT NULL,
  "content" jsonb,
  "policy" text NOT NULL,
  "expires_at" timestamptz,
  "redacted_at" timestamptz
);
ALTER TABLE fw."payload_objects" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."payload_objects" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."payload_objects" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."recovery_journal" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "workspace_token" text NOT NULL,
  "event_kind" text NOT NULL,
  "epoch" bigint NOT NULL,
  "event_digest" text NOT NULL,
  "checkpoint_ref" text,
  "metadata" jsonb NOT NULL,
  "scope_kind" text NOT NULL,
  "environment_id" text NOT NULL,
  "producer_key_id" text NOT NULL,
  "producer_signature" text NOT NULL
);
ALTER TABLE fw."recovery_journal" ADD PRIMARY KEY (id);
ALTER TABLE fw."recovery_journal" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."recovery_journal" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."ops_control_requests" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text NOT NULL,
  "target_kind" text NOT NULL,
  "target_ops_id" text NOT NULL,
  "action" text NOT NULL,
  "expected_version" bigint NOT NULL,
  "request_key" text NOT NULL,
  "request_digest" text NOT NULL,
  "state" text NOT NULL,
  "reason_code" text NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE fw."ops_control_requests" ADD PRIMARY KEY (id);
ALTER TABLE fw."ops_control_requests" ADD UNIQUE  (principal_id,request_key);
ALTER TABLE fw."ops_control_requests" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."ops_control_requests" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."auth_client_instances" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "subject_id" text NOT NULL,
  "public_key_spki" text NOT NULL,
  "key_digest" text NOT NULL,
  "state" text NOT NULL,
  "auth_epoch" bigint NOT NULL,
  "revoked_at" timestamptz
);
ALTER TABLE fw."auth_client_instances" ADD PRIMARY KEY (id);
ALTER TABLE fw."auth_client_instances" ADD UNIQUE  (id,subject_id);
ALTER TABLE fw."auth_client_instances" ADD UNIQUE  (subject_id,key_digest);
ALTER TABLE fw."auth_client_instances" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."auth_client_instances" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."session_credentials" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "subject_id" text NOT NULL,
  "session_id" text,
  "workspace_id" text,
  "device_id" text,
  "audience" text NOT NULL,
  "token_digest" text NOT NULL,
  "key_version" text NOT NULL,
  "generation" bigint NOT NULL,
  "auth_epoch" bigint NOT NULL,
  "device_epoch" bigint,
  "recovery_epoch" bigint,
  "expires_at" timestamptz NOT NULL,
  "consumed_at" timestamptz,
  "revoked_at" timestamptz,
  "rotation_key_digest" text
);
ALTER TABLE fw."session_credentials" ADD PRIMARY KEY (id);
ALTER TABLE fw."session_credentials" ADD UNIQUE  (key_version,audience,token_digest);
ALTER TABLE fw."session_credentials" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."session_credentials" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."auth_replays" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text NOT NULL,
  "authority_ref" text NOT NULL,
  "operation_id" text NOT NULL,
  "key_digest" text NOT NULL,
  "input_digest" text NOT NULL,
  "response_ciphertext" bytea,
  "key_version" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "committed_at" timestamptz NOT NULL,
  "revoked_at" timestamptz
);
ALTER TABLE fw."auth_replays" ADD PRIMARY KEY (id);
ALTER TABLE fw."auth_replays" ADD UNIQUE  (principal_id,authority_ref,operation_id,key_digest);
ALTER TABLE fw."auth_replays" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."auth_replays" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."ops_auth_replays" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text NOT NULL,
  "authority_ref" text NOT NULL,
  "operation_id" text NOT NULL,
  "key_digest" text NOT NULL,
  "input_digest" text NOT NULL,
  "response_ciphertext" bytea,
  "key_version" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "committed_at" timestamptz NOT NULL,
  "revoked_at" timestamptz
);
ALTER TABLE fw."ops_auth_replays" ADD PRIMARY KEY (id);
ALTER TABLE fw."ops_auth_replays" ADD UNIQUE  (principal_id,authority_ref,operation_id,key_digest);
ALTER TABLE fw."ops_auth_replays" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."ops_auth_replays" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."auth_rate_buckets" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "bucket_digest" text NOT NULL,
  "purpose" text NOT NULL,
  "window_start" timestamptz NOT NULL,
  "attempts" integer NOT NULL,
  "blocked_until" timestamptz
);
ALTER TABLE fw."auth_rate_buckets" ADD PRIMARY KEY (id);
ALTER TABLE fw."auth_rate_buckets" ADD UNIQUE  (bucket_digest,purpose,window_start);
ALTER TABLE fw."auth_rate_buckets" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."auth_rate_buckets" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."ops_auth_rate_buckets" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "bucket_digest" text NOT NULL,
  "purpose" text NOT NULL,
  "window_start" timestamptz NOT NULL,
  "attempts" integer NOT NULL,
  "blocked_until" timestamptz
);
ALTER TABLE fw."ops_auth_rate_buckets" ADD PRIMARY KEY (id);
ALTER TABLE fw."ops_auth_rate_buckets" ADD UNIQUE  (bucket_digest,purpose,window_start);
ALTER TABLE fw."ops_auth_rate_buckets" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."ops_auth_rate_buckets" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."owner_recovery_codes" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "subject_id" text NOT NULL,
  "batch_id" text NOT NULL,
  "code_digest" text NOT NULL,
  "key_version" text NOT NULL,
  "consumed_at" timestamptz,
  "revoked_at" timestamptz
);
ALTER TABLE fw."owner_recovery_codes" ADD PRIMARY KEY (id);
ALTER TABLE fw."owner_recovery_codes" ADD UNIQUE  (key_version,code_digest);
ALTER TABLE fw."owner_recovery_codes" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."owner_recovery_codes" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."service_principals" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "name" text NOT NULL,
  "certificate_fingerprint" text NOT NULL,
  "signature_key_ref" text NOT NULL,
  "capabilities" text[] NOT NULL,
  "auth_epoch" bigint NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "revoked_at" timestamptz
);
ALTER TABLE fw."service_principals" ADD PRIMARY KEY (id);
ALTER TABLE fw."service_principals" ADD UNIQUE  (name);
ALTER TABLE fw."service_principals" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."service_principals" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."service_nonces" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_id" text NOT NULL,
  "nonce_digest" text NOT NULL,
  "expires_at" timestamptz NOT NULL
);
ALTER TABLE fw."service_nonces" ADD PRIMARY KEY (id);
ALTER TABLE fw."service_nonces" ADD UNIQUE  (principal_id,nonce_digest);
ALTER TABLE fw."service_nonces" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."service_nonces" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."native_proof_nonces" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "installation_id" text NOT NULL,
  "nonce_digest" text NOT NULL,
  "expires_at" timestamptz NOT NULL
);
ALTER TABLE fw."native_proof_nonces" ADD PRIMARY KEY (id);
ALTER TABLE fw."native_proof_nonces" ADD UNIQUE  (installation_id,nonce_digest);
ALTER TABLE fw."native_proof_nonces" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."native_proof_nonces" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."collector_proof_nonces" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "workspace_id" text NOT NULL,
  "device_id" text NOT NULL,
  "nonce_digest" text NOT NULL,
  "expires_at" timestamptz NOT NULL
);
ALTER TABLE fw."collector_proof_nonces" ADD PRIMARY KEY (id);
ALTER TABLE fw."collector_proof_nonces" ADD UNIQUE  (workspace_id,device_id,nonce_digest);
ALTER TABLE fw."collector_proof_nonces" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."collector_proof_nonces" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."security_audit_events" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "principal_token" text,
  "event_kind" text NOT NULL,
  "actor_kind" text NOT NULL,
  "correlation_id" text NOT NULL,
  "reason_code" text NOT NULL,
  "authority_epoch" bigint
);
ALTER TABLE fw."security_audit_events" ADD PRIMARY KEY (id);
ALTER TABLE fw."security_audit_events" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."security_audit_events" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."recovery_delivery_state" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "journal_id" text NOT NULL,
  "state" text NOT NULL,
  "command_operation" text NOT NULL,
  "command_principal_token" text NOT NULL,
  "command_key_digest" text NOT NULL,
  "event_body" jsonb NOT NULL,
  "witness_sequence" bigint,
  "witness_receipt" jsonb,
  "attempt_count" integer NOT NULL,
  "last_safe_error" text,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE fw."recovery_delivery_state" ADD PRIMARY KEY (id);
ALTER TABLE fw."recovery_delivery_state" ADD UNIQUE  (journal_id);
ALTER TABLE fw."recovery_delivery_state" ADD UNIQUE  (command_principal_token,command_operation,command_key_digest,journal_id);
ALTER TABLE fw."recovery_delivery_state" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."recovery_delivery_state" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."erasure_requests" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "scope_kind" text NOT NULL,
  "target_token" text NOT NULL,
  "parent_request_id" text,
  "request_key_digest" text NOT NULL,
  "state" text NOT NULL,
  "requested_by_token" text NOT NULL,
  "checkpoint_ref" text,
  "active_purged_at" timestamptz,
  "backup_purge_due_at" timestamptz NOT NULL,
  "completed_at" timestamptz,
  "last_safe_error" text,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE fw."erasure_requests" ADD PRIMARY KEY (id);
ALTER TABLE fw."erasure_requests" ADD UNIQUE  (scope_kind,target_token,request_key_digest);
ALTER TABLE fw."erasure_requests" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."erasure_requests" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."forecast_runs" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "version" bigint NOT NULL,
  "state" text NOT NULL,
  "base_snapshot_id" text NOT NULL,
  "base_financial_version" bigint NOT NULL,
  "inputs_payload_id" text NOT NULL,
  "checkpoint_payload_id" text,
  "input_digest" text NOT NULL,
  "engine_version" text NOT NULL,
  "model_version" text NOT NULL,
  "seed" text NOT NULL,
  "trials" integer NOT NULL,
  "cancel_requested" boolean NOT NULL,
  "completed_at" timestamptz,
  "result_expires_at" timestamptz,
  "safe_error_code" text,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE fw."forecast_runs" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."forecast_runs" ADD UNIQUE  (workspace_id,id,base_snapshot_id);
ALTER TABLE fw."forecast_runs" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."forecast_runs" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."forecast_result_pages" (
  "workspace_id" text NOT NULL,
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "run_id" text NOT NULL,
  "page_index" integer NOT NULL,
  "payload_id" text NOT NULL,
  "content_digest" text NOT NULL,
  "schema_ref" text NOT NULL,
  "published_at" timestamptz
);
ALTER TABLE fw."forecast_result_pages" ADD PRIMARY KEY (workspace_id,id);
ALTER TABLE fw."forecast_result_pages" ADD UNIQUE  (workspace_id,run_id,page_index);
ALTER TABLE fw."forecast_result_pages" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."forecast_result_pages" FORCE ROW LEVEL SECURITY;
CREATE TABLE fw."provider_quota_buckets" (
  "id" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT clock_timestamp(),
  "namespace_digest" text NOT NULL,
  "window_start" timestamptz NOT NULL,
  "window_end" timestamptz NOT NULL,
  "limit_value" bigint NOT NULL,
  "reserved_count" bigint NOT NULL,
  "cooldown_until" timestamptz,
  "version" bigint NOT NULL,
  "updated_at" timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE fw."provider_quota_buckets" ADD PRIMARY KEY (id);
ALTER TABLE fw."provider_quota_buckets" ADD UNIQUE  (namespace_digest,window_start,window_end);
ALTER TABLE fw."provider_quota_buckets" ENABLE ROW LEVEL SECURITY; ALTER TABLE fw."provider_quota_buckets" FORCE ROW LEVEL SECURITY;
ALTER DEFAULT PRIVILEGES IN SCHEMA fw REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA fw FROM PUBLIC;
COMMIT;
