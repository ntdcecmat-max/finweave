-- Infrastructure controls for synthetic-local. Domain DB005 is not redefined.
ALTER TABLE fw_control.state ADD COLUMN maintenance boolean NOT NULL DEFAULT false;
CREATE TABLE fw_control.erasures(subject_id text PRIMARY KEY,deny_id text NOT NULL UNIQUE,
 requested_at timestamptz NOT NULL DEFAULT clock_timestamp(),deadline timestamptz NOT NULL DEFAULT clock_timestamp()+interval '35 days',
 children jsonb NOT NULL,active_purged_at timestamptz);
-- This journal contains only frozen recovery references; never reset deadlines.
REVOKE ALL ON fw_control.erasures FROM PUBLIC;
CREATE TABLE fw_control.private_objects(object_oid oid PRIMARY KEY,subject_id text NOT NULL);
REVOKE ALL ON fw_control.private_objects FROM PUBLIC;
GRANT USAGE ON SCHEMA fw_control TO fw_runtime_ops_business;
GRANT EXECUTE ON FUNCTION fw_control.read_state() TO fw_runtime_ops_business,fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
CREATE ROLE fw_runtime_operator NOLOGIN NOSUPERUSER NOBYPASSRLS;
GRANT USAGE ON SCHEMA fw_control TO fw_runtime_operator;
GRANT USAGE ON SCHEMA fw_control TO fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
ALTER FUNCTION fw_dispatch.claim(text,text) RENAME TO claim_before_operations;
REVOKE ALL ON FUNCTION fw_dispatch.claim_before_operations(text,text) FROM PUBLIC,fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
CREATE FUNCTION fw_dispatch.claim(p_profile text,p_token text) RETURNS SETOF fw_dispatch.jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 IF NOT pg_has_role(session_user,'fw_runtime_'||p_profile,'member') THEN RAISE EXCEPTION 'PROFILE_DENIED' USING ERRCODE='42501';END IF;
 PERFORM 1 FROM fw_control.state WHERE NOT locked AND (NOT maintenance OR p_profile='retention') FOR SHARE;
 IF NOT FOUND THEN RETURN;END IF;
 RETURN QUERY SELECT * FROM fw_dispatch.claim_before_operations(p_profile,p_token);
END $$;
REVOKE ALL ON FUNCTION fw_dispatch.claim(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_dispatch.claim(text,text) TO fw_runtime_ingestion,fw_runtime_market,fw_runtime_forecast,fw_runtime_agent,fw_runtime_retention;
CREATE FUNCTION fw_control.admission_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 PERFORM 1 FROM fw_control.state WHERE NOT locked AND (NOT maintenance OR NEW.profile='retention') FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'OPERATIONS_ADMISSION_CLOSED' USING ERRCODE='55000';END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION fw_control.admission_guard() FROM PUBLIC;
CREATE TRIGGER operations_admission BEFORE INSERT ON fw_dispatch.jobs FOR EACH ROW EXECUTE FUNCTION fw_control.admission_guard();
CREATE FUNCTION fw_control.enter_maintenance() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN UPDATE fw_control.state SET maintenance=true;END $$;
CREATE FUNCTION fw_control.fence_workers() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE n integer;BEGIN
 PERFORM 1 FROM fw_control.state WHERE maintenance FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MAINTENANCE_REQUIRED';END IF;
 -- Preserve deadlines, attempts, unknown external intents and reservations.
 UPDATE fw_dispatch.jobs SET generation=generation+1,lease_token=NULL,lease_until=NULL,
 state=CASE WHEN attempts>=max_attempts OR deadline<=clock_timestamp() THEN 'failed' ELSE 'queued' END
 WHERE state='running' AND profile<>'retention';GET DIAGNOSTICS n=ROW_COUNT;RETURN n;
END $$;
REVOKE ALL ON FUNCTION fw_control.enter_maintenance(),fw_control.fence_workers() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_control.enter_maintenance(),fw_control.fence_workers() TO fw_runtime_operator;
CREATE FUNCTION fw_control.safe_metrics() RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('maintenance',maintenance,'locked',locked,
 'queued',(SELECT count(*) FROM fw_dispatch.jobs WHERE state='queued'),
 'running',(SELECT count(*) FROM fw_dispatch.jobs WHERE state='running'),
 'failed',(SELECT count(*) FROM fw_dispatch.jobs WHERE state='failed')) FROM fw_control.state
$$;
REVOKE ALL ON FUNCTION fw_control.safe_metrics() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_control.safe_metrics() TO fw_runtime_operator;
CREATE FUNCTION fw_control.purge_runtime_payloads() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE n integer;BEGIN
 -- No recovery/maintenance early return: TTL deletion must survive closed finance.
 PERFORM 1 FROM fw_control.state FOR SHARE;
 UPDATE fw_auth.replays SET body=NULL WHERE body IS NOT NULL AND expires_at<=clock_timestamp();
 UPDATE fw_ops.replays SET body=NULL WHERE body IS NOT NULL AND expires_at<=clock_timestamp();
 DELETE FROM fw_auth.nonces WHERE expires_at<=clock_timestamp();
 DELETE FROM fw_auth.challenges WHERE expires_at<clock_timestamp()-interval '24 hours';
 DELETE FROM fw_finance.previews WHERE expires_at<=clock_timestamp();
 DELETE FROM fw_ops.previews WHERE expires_at<=clock_timestamp();
 DELETE FROM fw_assistant.messages m WHERE expires_at<=clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.runs r WHERE r.workspace_id=m.workspace_id AND r.conversation_id=m.conversation_id AND r.payload->>'state' IN('queued','reading','simulating'));
 DELETE FROM fw_assistant.tool_snapshots s WHERE expires_at<=clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.runs r WHERE r.workspace_id=s.workspace_id AND r.payload->>'state' IN('queued','reading','simulating'));
 DELETE FROM fw_assistant.drafts d WHERE expires_at<=clock_timestamp() AND d.payload->>'state' IN('draft','previewed','cancelled')
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.goal_plan_links l WHERE l.workspace_id=d.workspace_id AND l.draft_id=d.id)
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.simulations s WHERE s.workspace_id=d.workspace_id AND s.draft_id=d.id)
 AND NOT EXISTS(SELECT 1 FROM fw_assistant.runs r WHERE r.workspace_id=d.workspace_id AND r.payload->>'draftId'=d.id AND r.payload->>'state' IN('queued','reading','simulating'));
 -- Immutable import previews pinned by admitted imports are intentionally kept.
 -- Unpinned staging purge is a narrowly scoped privileged exception.
 PERFORM set_config('session_replication_role','replica',true);
 DELETE FROM fw_business.import_previews p WHERE expires_at<=clock_timestamp()
 AND NOT EXISTS(SELECT 1 FROM fw_business.imports i WHERE i.workspace_id=p.workspace_id AND i.preview_id=p.id);
 PERFORM set_config('session_replication_role','origin',true);
 RETURN jsonb_build_object('purged',true);
END $$;
REVOKE ALL ON FUNCTION fw_control.purge_runtime_payloads() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw_control.purge_runtime_payloads() TO fw_runtime_retention;
