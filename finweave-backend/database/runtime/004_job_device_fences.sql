-- Optional device-bound tickets preserve durable receipts but fence revoked consent/owner/device epochs.
ALTER TABLE fw_dispatch.jobs ADD COLUMN device_id text REFERENCES fw_auth.devices(id);
ALTER TABLE fw_dispatch.jobs ADD COLUMN device_epoch integer CHECK(device_epoch>=0);
ALTER TABLE fw_dispatch.jobs ADD COLUMN consent text;
ALTER TABLE fw_dispatch.jobs ADD CONSTRAINT bound_device_ticket CHECK((device_id IS NULL AND device_epoch IS NULL AND consent IS NULL) OR (device_id IS NOT NULL AND device_epoch IS NOT NULL AND consent IS NOT NULL));
CREATE OR REPLACE FUNCTION fw_dispatch.claim(p_profile text,p_token text) RETURNS SETOF fw_dispatch.jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs; owner_row fw_auth.identities; workspace_row fw_finance.workspaces; r integer;
BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;
 IF r IS NULL THEN RETURN; END IF;
 UPDATE fw_dispatch.jobs q SET state='cancelled',lease_token=NULL,lease_until=NULL WHERE q.profile=p_profile AND q.state IN ('queued','running') AND q.device_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fw_auth.devices d WHERE d.id=q.device_id AND d.subject_id=q.subject_id AND d.workspace_id=q.workspace_id AND NOT d.revoked AND d.epoch=q.device_epoch AND d.consent=q.consent AND d.auth_epoch=q.auth_epoch AND d.recovery_epoch=r AND d.authorized_until>clock_timestamp());
 UPDATE fw_dispatch.jobs SET state='failed',lease_token=NULL,lease_until=NULL WHERE profile=p_profile AND state IN ('queued','running') AND (deadline<=clock_timestamp() OR (attempts>=max_attempts AND (state='queued' OR lease_until<=clock_timestamp())));
 SELECT q.* INTO j FROM fw_dispatch.jobs q JOIN fw_auth.identities i ON i.id=q.subject_id JOIN fw_finance.workspaces w ON w.id=q.workspace_id LEFT JOIN fw_auth.devices d ON d.id=q.device_id
 WHERE q.profile=p_profile AND (q.state='queued' OR(q.state='running' AND q.lease_until<clock_timestamp())) AND q.due_at<=clock_timestamp() AND q.deadline>clock_timestamp() AND q.attempts<q.max_attempts AND i.state='active' AND i.epoch=q.auth_epoch AND w.subject_id=i.id AND NOT w.blocked AND q.recovery_epoch=r AND (q.device_id IS NULL OR (d.subject_id=q.subject_id AND d.workspace_id=q.workspace_id AND NOT d.revoked AND d.epoch=q.device_epoch AND d.consent=q.consent AND d.auth_epoch=q.auth_epoch AND d.recovery_epoch=r AND d.authorized_until>clock_timestamp())) ORDER BY q.due_at,q.id LIMIT 1;
 IF j.id IS NULL THEN RETURN; END IF;
 SELECT * INTO owner_row FROM fw_auth.identities WHERE id=j.subject_id FOR UPDATE;
 SELECT * INTO workspace_row FROM fw_finance.workspaces WHERE id=j.workspace_id FOR UPDATE;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=j.id FOR UPDATE SKIP LOCKED;
 IF j.id IS NULL OR owner_row.state<>'active' OR owner_row.epoch<>j.auth_epoch OR workspace_row.blocked OR j.recovery_epoch<>r OR j.attempts>=j.max_attempts OR j.deadline<=clock_timestamp() OR (j.state<>'queued' AND (j.state<>'running' OR j.lease_until>=clock_timestamp())) THEN RETURN; END IF;
 IF j.device_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fw_auth.devices d WHERE d.id=j.device_id AND d.subject_id=j.subject_id AND d.workspace_id=j.workspace_id AND NOT d.revoked AND d.epoch=j.device_epoch AND d.consent=j.consent AND d.auth_epoch=j.auth_epoch AND d.recovery_epoch=r AND d.authorized_until>clock_timestamp()) THEN RETURN; END IF;
 UPDATE fw_dispatch.jobs SET state='running',generation=generation+1,lease_token=p_token,lease_until=least(clock_timestamp()+interval '30 seconds',deadline),attempts=attempts+1 WHERE id=j.id RETURNING * INTO j;
 RETURN NEXT j;
END $$;
CREATE OR REPLACE FUNCTION fw_dispatch.finalize(p_profile text,p_id text,p_generation integer,p_token text,p_epoch integer,p_success boolean) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw_dispatch.jobs; i fw_auth.identities; w fw_finance.workspaces; d fw_auth.devices; r integer;
BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 SELECT epoch INTO r FROM fw_control.state WHERE NOT locked FOR SHARE;
 SELECT a.* INTO i FROM fw_auth.identities a JOIN fw_dispatch.jobs q ON q.subject_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT a.* INTO w FROM fw_finance.workspaces a JOIN fw_dispatch.jobs q ON q.workspace_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT a.* INTO d FROM fw_auth.devices a JOIN fw_dispatch.jobs q ON q.device_id=a.id WHERE q.id=p_id FOR UPDATE OF a;
 SELECT * INTO j FROM fw_dispatch.jobs WHERE id=p_id FOR UPDATE;
 IF r IS NULL OR r<>p_epoch OR j.id IS NULL OR i.id IS NULL OR w.id IS NULL OR j.profile<>p_profile OR j.state<>'running' OR j.generation<>p_generation OR j.lease_token<>p_token OR j.lease_until<=clock_timestamp() OR j.deadline<=clock_timestamp() OR i.state<>'active' OR i.epoch<>j.auth_epoch OR w.blocked OR j.recovery_epoch<>r OR (j.device_id IS NOT NULL AND (d.id IS NULL OR d.subject_id<>j.subject_id OR d.workspace_id<>j.workspace_id OR d.revoked OR d.epoch<>j.device_epoch OR d.consent<>j.consent OR d.auth_epoch<>j.auth_epoch OR d.recovery_epoch<>r OR d.authorized_until<=clock_timestamp())) THEN RETURN false; END IF;
 UPDATE fw_dispatch.jobs SET state=CASE WHEN p_success THEN 'done' WHEN attempts>=max_attempts THEN 'failed' ELSE 'queued' END,lease_token=NULL,lease_until=NULL,due_at=clock_timestamp()+interval '10 seconds' WHERE id=p_id;
 RETURN true;
END $$;
