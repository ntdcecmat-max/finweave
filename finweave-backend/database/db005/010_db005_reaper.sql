CREATE INDEX CONCURRENTLY db005_reaper ON fw.jobs USING btree (lease_until, workspace_id, id) WHERE (state = 'running'::text);
