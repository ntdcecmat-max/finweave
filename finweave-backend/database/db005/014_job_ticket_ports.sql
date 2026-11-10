BEGIN;
CREATE FUNCTION fw.guard_job_registry() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE r fw_infra.job_registry; present boolean;
BEGIN
 SELECT * INTO r FROM fw_infra.job_registry WHERE job_type=NEW.job_type;
 IF r.job_type IS NULL OR NEW.domain_kind<>r.domain_kind OR NEW.policy_version<>r.policy_version OR NEW.max_attempts>r.attempts_max*3 OR NEW.deadline_at>NEW.created_at+make_interval(secs=>r.deadline_seconds) THEN RAISE EXCEPTION 'JOB_REGISTRY_POLICY_INVALID' USING ERRCODE='23514'; END IF;
 -- The table name is from immutable provisioning, never from a client parameter.
 EXECUTE format('SELECT EXISTS(SELECT 1 FROM fw.%I WHERE workspace_id=$1 AND id=$2)',r.domain_table) INTO present USING NEW.workspace_id,NEW.domain_id;
 IF NOT present THEN RAISE EXCEPTION 'JOB_DOMAIN_REFERENCE_INVALID' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER job_registry BEFORE INSERT ON fw.jobs FOR EACH ROW EXECUTE FUNCTION fw.guard_job_registry();

CREATE FUNCTION fw.claim_job(w text,typ text) RETURNS TABLE(job_id text,generation bigint,lease_token text,recovery_epoch bigint) LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE r fw_infra.job_registry; j fw.jobs; gate fw.workspaces; tok text;
BEGIN
 SELECT * INTO r FROM fw_infra.job_registry WHERE job_type=typ;
 IF r.job_type IS NULL OR current_setting('role')<>r.worker_role THEN RAISE EXCEPTION 'JOB_PROFILE_DENIED' USING ERRCODE='42501'; END IF;
 -- Serialize the small profile cap, then workspace anchor, then the job row.
 PERFORM pg_advisory_xact_lock(hashtextextended('fw_job_profile:'||r.worker_role,0));
 SELECT * INTO gate FROM fw.workspaces WHERE id=w FOR UPDATE;
 IF gate.id IS NULL OR gate.access_state<>'active' OR NOT EXISTS(SELECT 1 FROM fw.identities WHERE id=gate.owner_id AND state='active' AND NOT recovery_reset_required) THEN RETURN; END IF;
 IF (SELECT count(*) FROM fw.jobs x JOIN fw_infra.job_registry rr ON rr.job_type=x.job_type WHERE rr.worker_role=r.worker_role AND x.state='running' AND x.lease_until>clock_timestamp())>=r.concurrency_max OR (SELECT count(*) FROM fw.jobs x WHERE x.workspace_id=w AND x.state='running' AND x.lease_until>clock_timestamp())>=3 THEN RETURN; END IF;
 SELECT * INTO j FROM fw.jobs x WHERE x.workspace_id=w AND x.job_type=typ AND x.state='queued' AND x.next_attempt_at<=clock_timestamp() AND x.deadline_at>clock_timestamp() AND NOT x.cancel_requested AND x.attempt_count<x.max_attempts AND x.recovery_epoch=gate.recovery_epoch ORDER BY x.next_attempt_at,x.created_at,x.id LIMIT 1 FOR UPDATE SKIP LOCKED;
 IF j.id IS NULL THEN RETURN; END IF;
 IF typ='ingestion' AND NOT EXISTS(SELECT 1 FROM fw.ingestion_receipts x JOIN fw.devices d ON (d.workspace_id,d.id)=(x.workspace_id,x.device_id) JOIN fw.collector_bindings b ON (b.workspace_id,b.id)=(x.workspace_id,x.binding_id) WHERE x.workspace_id=w AND x.id=j.domain_id AND d.status='active' AND d.authorized_until>clock_timestamp() AND d.owner_epoch=x.capture_epoch AND b.enabled AND b.version=x.binding_version) THEN RETURN; END IF;
 tok:=replace(gen_random_uuid()::text,'-','')||replace(gen_random_uuid()::text,'-','');
 UPDATE fw.jobs x SET state='running',attempt_count=x.attempt_count+1,generation=x.generation+1,lease_token=tok,lease_until=least(clock_timestamp()+make_interval(secs=>r.lease_seconds),x.deadline_at),updated_at=clock_timestamp() WHERE (x.workspace_id,x.id)=(w,j.id) RETURNING x.* INTO j;
 INSERT INTO fw.job_attempts(workspace_id,id,job_id,attempt_no,generation,worker_profile,started_at) VALUES(w,j.id||':'||j.generation,j.id,j.attempt_count,j.generation,r.worker_role,clock_timestamp());
 RETURN QUERY SELECT j.id,j.generation,j.lease_token,j.recovery_epoch;
END $$;
REVOKE ALL ON FUNCTION fw.claim_job(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.claim_job(text,text) TO fw_ingestion,fw_import,fw_market,fw_agent,fw_forecast;

CREATE FUNCTION fw.assert_job_ticket(w text,jid text,gen bigint,tok text,epoch bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw.jobs; gate fw.workspaces; r fw_infra.job_registry;
BEGIN
 IF w IS NULL OR jid IS NULL OR gen IS NULL OR tok IS NULL OR epoch IS NULL OR tok !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'STALE_JOB_TICKET' USING ERRCODE='23514'; END IF;
 SELECT * INTO gate FROM fw.workspaces WHERE id=w FOR UPDATE;
 SELECT * INTO j FROM fw.jobs WHERE workspace_id=w AND id=jid FOR UPDATE;
 SELECT * INTO r FROM fw_infra.job_registry WHERE job_type=j.job_type;
 IF j.id IS NULL OR current_setting('role')<>r.worker_role OR j.state<>'running' OR j.generation<>gen OR j.lease_token<>tok OR j.recovery_epoch<>epoch OR gate.recovery_epoch<>epoch OR gate.access_state<>'active' OR j.cancel_requested OR j.deadline_at<=clock_timestamp() OR j.lease_until<=clock_timestamp() OR NOT EXISTS(SELECT 1 FROM fw.identities WHERE id=gate.owner_id AND state='active' AND NOT recovery_reset_required) THEN RAISE EXCEPTION 'STALE_JOB_TICKET' USING ERRCODE='23514'; END IF;
 IF j.job_type='ingestion' AND NOT EXISTS(SELECT 1 FROM fw.ingestion_receipts x JOIN fw.devices d ON (d.workspace_id,d.id)=(x.workspace_id,x.device_id) JOIN fw.collector_bindings b ON (b.workspace_id,b.id)=(x.workspace_id,x.binding_id) WHERE x.workspace_id=w AND x.id=j.domain_id AND d.status='active' AND d.authorized_until>clock_timestamp() AND d.owner_epoch=x.capture_epoch AND b.enabled AND b.version=x.binding_version) THEN RAISE EXCEPTION 'DEVICE_OR_CONSENT_REVOKED' USING ERRCODE='23514'; END IF;
END $$;
REVOKE ALL ON FUNCTION fw.assert_job_ticket(text,text,bigint,text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.assert_job_ticket(text,text,bigint,text,bigint) TO fw_ingestion,fw_import,fw_market,fw_agent,fw_forecast;

CREATE FUNCTION fw.heartbeat_job(w text,jid text,gen bigint,tok text,epoch bigint) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM fw.assert_job_ticket(w,jid,gen,tok,epoch);
 UPDATE fw.jobs j SET lease_until=least(j.deadline_at,clock_timestamp()+make_interval(secs=>r.lease_seconds)),updated_at=clock_timestamp() FROM fw_infra.job_registry r WHERE j.workspace_id=w AND j.id=jid AND r.job_type=j.job_type;
END $$;
REVOKE ALL ON FUNCTION fw.heartbeat_job(text,text,bigint,text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.heartbeat_job(text,text,bigint,text,bigint) TO fw_ingestion,fw_import,fw_market,fw_agent,fw_forecast;

CREATE FUNCTION fw.reap_job(w text,jid text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j fw.jobs;
BEGIN
 IF current_setting('role')<>'fw_scheduler' THEN RAISE EXCEPTION 'SCHEDULER_CAPABILITY_DENIED' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM fw.workspaces WHERE id=w FOR UPDATE;
 SELECT * INTO j FROM fw.jobs WHERE workspace_id=w AND id=jid FOR UPDATE;
 IF j.id IS NULL OR j.state<>'running' OR j.lease_until>clock_timestamp() THEN RETURN false; END IF;
 UPDATE fw.job_attempts SET finished_at=clock_timestamp(),outcome='lease_expired',error_code='LEASE_EXPIRED' WHERE workspace_id=w AND job_id=jid AND generation=j.generation AND finished_at IS NULL;
 UPDATE fw.jobs SET state=CASE WHEN cancel_requested THEN 'cancelled' WHEN attempt_count>=max_attempts OR deadline_at<=clock_timestamp() THEN 'failed' ELSE 'queued' END,generation=generation+1,lease_token=NULL,lease_until=NULL,next_attempt_at=clock_timestamp()+interval '5 seconds',updated_at=clock_timestamp() WHERE workspace_id=w AND id=jid;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw.reap_job(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.reap_job(text,text) TO fw_scheduler;
COMMIT;
