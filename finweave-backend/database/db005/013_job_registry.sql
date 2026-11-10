-- Pinned registry SHA256 07c9f4e3b7924e77e0aef3929239a392e2974c4f5232d41d954d74c15dc49b46. Trusted static SQL only.
BEGIN;
CREATE TABLE fw_infra.job_registry(job_type text PRIMARY KEY,domain_kind text NOT NULL,domain_table text NOT NULL,worker_role text NOT NULL,policy_version text NOT NULL,lease_seconds integer NOT NULL,attempts_max integer NOT NULL,deadline_seconds integer NOT NULL,concurrency_max integer NOT NULL);
INSERT INTO fw_infra.job_registry VALUES
('ingestion','ingestion_receipt','ingestion_receipts','fw_ingestion','FW-ASYNC-J2-001',60,8,604800,2),
('price_refresh','refresh_job','refresh_jobs','fw_market','FW-ASYNC-J2-001',90,5,21600,2),
('import','import_job','import_jobs','fw_import','FW-ASYNC-J2-001',90,3,86400,1),
('agent_step','agent_run','agent_runs','fw_agent','FW-ASYNC-J2-001',90,3,86400,1),
('assistant_message','assistant_message','messages','fw_agent','FW-ASYNC-J2-001',90,3,86400,1),
('forecast','forecast_run','forecast_runs','fw_forecast','FW-ASYNC-J2-001',120,3,86400,1);
CREATE TRIGGER registry_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON fw_infra.job_registry FOR EACH STATEMENT EXECUTE FUNCTION fw_infra.deny_journal_mutation();
REVOKE ALL ON fw_infra.job_registry FROM PUBLIC;
COMMIT;
