CREATE INDEX CONCURRENTLY db005_due ON fw.jobs USING btree (job_type, next_attempt_at, created_at, workspace_id, id) WHERE (state = 'queued'::text);
