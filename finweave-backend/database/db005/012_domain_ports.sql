BEGIN;
-- Additional reviewed invariants and narrow local capabilities. No provider/model calls.
CREATE FUNCTION fw.guard_actual_family() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE scope text; root_event text;
BEGIN
 PERFORM 1 FROM fw.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 SELECT scope_id INTO scope FROM fw.planning_revisions WHERE workspace_id=NEW.workspace_id AND id=NEW.planning_revision_id;
 IF NOT EXISTS(SELECT 1 FROM fw.plan_items p WHERE p.workspace_id=NEW.workspace_id AND p.id=NEW.plan_item_id AND p.scope_id=scope) THEN RAISE EXCEPTION 'ACTUAL_SCOPE_MISMATCH' USING ERRCODE='23514'; END IF;
 IF NEW.released_at IS NULL THEN
  WITH RECURSIVE lineage AS (
   SELECT e.id,e.origin_id,e.reversal_of,ARRAY[e.id] AS visited FROM fw.events e WHERE e.workspace_id=NEW.workspace_id AND e.id=NEW.event_id
   UNION ALL SELECT e.id,e.origin_id,e.reversal_of,l.visited||e.id FROM fw.events e JOIN lineage l ON e.id=coalesce(l.reversal_of,l.origin_id) WHERE e.workspace_id=NEW.workspace_id AND NOT e.id=ANY(l.visited)
  ) SELECT id INTO root_event FROM lineage WHERE origin_id IS NULL AND reversal_of IS NULL;
  IF root_event IS NULL THEN RAISE EXCEPTION 'EVENT_LINEAGE_INVALID' USING ERRCODE='23514'; END IF;
  IF EXISTS(
   WITH RECURSIVE family AS (
    SELECT e.id FROM fw.events e WHERE e.workspace_id=NEW.workspace_id AND e.id=root_event
    UNION SELECT e.id FROM fw.events e JOIN family f ON e.origin_id=f.id OR e.reversal_of=f.id WHERE e.workspace_id=NEW.workspace_id
   ) SELECT 1 FROM fw.actual_links a JOIN fw.planning_revisions r ON r.workspace_id=a.workspace_id AND r.id=a.planning_revision_id WHERE a.workspace_id=NEW.workspace_id AND a.id<>NEW.id AND r.scope_id=scope AND a.released_at IS NULL AND a.event_id IN(SELECT id FROM family)
  ) THEN RAISE EXCEPTION 'EVENT_FAMILY_ALREADY_ACTIVE' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER actual_family BEFORE INSERT OR UPDATE ON fw.actual_links FOR EACH ROW EXECUTE FUNCTION fw.guard_actual_family();

CREATE FUNCTION fw.check_quantity_timeline() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE m record; balance numeric:=0;
BEGIN
 PERFORM 1 FROM fw.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 PERFORM 1 FROM fw.holdings WHERE workspace_id=NEW.workspace_id AND id=NEW.holding_id FOR UPDATE;
 FOR m IN SELECT * FROM fw.holding_movements WHERE workspace_id=NEW.workspace_id AND holding_id=NEW.holding_id ORDER BY business_date,sequence_no LOOP
  IF m.quantity_mode='set' THEN balance:=m.quantity; ELSE balance:=balance+m.delta; END IF;
  IF balance<0 OR balance IS DISTINCT FROM m.quantity THEN RAISE EXCEPTION 'QUANTITY_TIMELINE_INVALID' USING ERRCODE='23514'; END IF;
 END LOOP;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER quantity_timeline AFTER INSERT ON fw.holding_movements DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw.check_quantity_timeline();

CREATE FUNCTION fw.check_refund_limit() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE original_amount numeric; refunded numeric;
BEGIN
 IF NEW.kind='refund' AND NEW.posting='posted' THEN
  PERFORM 1 FROM fw.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
  SELECT amount INTO original_amount FROM fw.events WHERE workspace_id=NEW.workspace_id AND id=NEW.origin_id AND posting='posted' AND kind='expense' FOR UPDATE;
  SELECT sum(amount) INTO refunded FROM fw.events WHERE workspace_id=NEW.workspace_id AND origin_id=NEW.origin_id AND kind='refund' AND posting='posted' AND NOT EXISTS(SELECT 1 FROM fw.events r WHERE r.workspace_id=NEW.workspace_id AND r.reversal_of=events.id AND r.posting='posted');
  IF original_amount IS NULL OR refunded>original_amount THEN RAISE EXCEPTION 'REFUND_SOURCE_OR_LIMIT_INVALID' USING ERRCODE='23514'; END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER refund_limit AFTER INSERT ON fw.events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw.check_refund_limit();

CREATE FUNCTION fw.guard_job_identity() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
 IF (NEW.workspace_id,NEW.id,NEW.job_type,NEW.domain_kind,NEW.domain_id,NEW.dedupe_key,NEW.policy_version,NEW.deadline_at,NEW.created_at,NEW.max_attempts) IS DISTINCT FROM (OLD.workspace_id,OLD.id,OLD.job_type,OLD.domain_kind,OLD.domain_id,OLD.dedupe_key,OLD.policy_version,OLD.deadline_at,OLD.created_at,OLD.max_attempts) OR NEW.generation<OLD.generation OR NEW.attempt_count<OLD.attempt_count THEN RAISE EXCEPTION 'JOB_IDENTITY_POLICY_OR_COUNTER_IMMUTABLE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER job_identity BEFORE UPDATE ON fw.jobs FOR EACH ROW EXECUTE FUNCTION fw.guard_job_identity();

CREATE FUNCTION fw.guard_forecast_payload() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE p fw.payload_objects; pid text; kind text;
BEGIN
 IF TG_TABLE_NAME='forecast_runs' THEN
  pid:=NEW.inputs_payload_id;kind:='forecast_input';
  IF TG_OP='UPDATE' AND (NEW.inputs_payload_id,NEW.base_snapshot_id,NEW.base_financial_version,NEW.input_digest,NEW.engine_version,NEW.model_version,NEW.seed,NEW.trials) IS DISTINCT FROM (OLD.inputs_payload_id,OLD.base_snapshot_id,OLD.base_financial_version,OLD.input_digest,OLD.engine_version,OLD.model_version,OLD.seed,OLD.trials) THEN RAISE EXCEPTION 'FORECAST_INPUT_IMMUTABLE' USING ERRCODE='23514'; END IF;
 ELSE pid:=NEW.payload_id;kind:='forecast_page'; END IF;
 SELECT * INTO p FROM fw.payload_objects WHERE workspace_id=NEW.workspace_id AND id=pid;
 IF p.id IS NULL OR p.owner_module<>'Planning' OR p.object_kind<>kind OR p.object_id<>(to_jsonb(NEW)->>CASE WHEN TG_TABLE_NAME='forecast_runs' THEN 'id' ELSE 'run_id' END) THEN RAISE EXCEPTION 'FORECAST_PAYLOAD_OWNERSHIP_INVALID' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER forecast_payload BEFORE INSERT OR UPDATE ON fw.forecast_runs FOR EACH ROW EXECUTE FUNCTION fw.guard_forecast_payload();
CREATE TRIGGER forecast_payload BEFORE INSERT ON fw.forecast_result_pages FOR EACH ROW EXECUTE FUNCTION fw.guard_forecast_payload();

CREATE FUNCTION fw.reserve_quota(ids text[]) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE b fw.provider_quota_buckets; seen integer:=0;
BEGIN
 IF current_setting('role')<>'fw_quota' OR ids IS NULL OR array_position(ids,NULL) IS NOT NULL OR cardinality(ids) NOT BETWEEN 1 AND 20 OR cardinality(ids)<>(SELECT count(DISTINCT x) FROM unnest(ids) x) THEN RAISE EXCEPTION 'QUOTA_CAPABILITY_OR_BOUNDS_INVALID' USING ERRCODE='42501'; END IF;
 FOR b IN SELECT * FROM fw.provider_quota_buckets WHERE id=ANY(ids) ORDER BY namespace_digest,window_start,id FOR UPDATE LOOP
  seen:=seen+1;
  IF clock_timestamp()<b.window_start OR clock_timestamp()>=b.window_end OR b.cooldown_until>clock_timestamp() OR b.reserved_count>=b.limit_value THEN RAISE EXCEPTION 'QUOTA_UNAVAILABLE' USING ERRCODE='23514'; END IF;
  UPDATE fw.provider_quota_buckets SET reserved_count=reserved_count+1,version=version+1,updated_at=clock_timestamp() WHERE id=b.id;
 END LOOP;
 IF seen<>cardinality(ids) THEN RAISE EXCEPTION 'QUOTA_BUCKET_UNKNOWN' USING ERRCODE='23514'; END IF;
END $$;
REVOKE ALL ON FUNCTION fw.reserve_quota(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.reserve_quota(text[]) TO fw_quota;

CREATE FUNCTION fw.accept_totp_counter(factor_id text,new_counter bigint) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE accepted boolean;
BEGIN
 IF current_setting('role')<>'fw_ops_identity' OR new_counter NOT BETWEEN 0 AND 9007199254740991 THEN RAISE EXCEPTION 'TOTP_CAPABILITY_OR_COUNTER_INVALID' USING ERRCODE='42501'; END IF;
 -- Cryptographic TOTP verification and fresh step-up happen in the separate OpsIdentity process.
 UPDATE fw.admin_mfa_factors SET counter=new_counter WHERE id=factor_id AND status='active' AND method='totp_sha1_6_30' AND counter<new_counter RETURNING true INTO accepted;
 RETURN coalesce(accepted,false);
END $$;
REVOKE ALL ON FUNCTION fw.accept_totp_counter(text,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.accept_totp_counter(text,bigint) TO fw_ops_identity;

CREATE FUNCTION fw.redact_expired_payload(w text,pid text) RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE p fw.payload_objects;
BEGIN
 IF current_setting('role')<>'fw_retention' THEN RAISE EXCEPTION 'RETENTION_CAPABILITY_INVALID' USING ERRCODE='42501'; END IF;
 PERFORM 1 FROM fw.workspaces WHERE id=w FOR UPDATE;
 SELECT * INTO p FROM fw.payload_objects WHERE workspace_id=w AND id=pid FOR UPDATE;
 IF p.id IS NULL OR p.expires_at IS NULL OR p.expires_at>clock_timestamp() OR p.policy NOT IN ('staging','cache') THEN RETURN false; END IF;
 IF EXISTS(SELECT 1 FROM fw.forecast_runs WHERE workspace_id=w AND (inputs_payload_id=pid OR checkpoint_payload_id=pid)) OR EXISTS(SELECT 1 FROM fw.forecast_result_pages WHERE workspace_id=w AND payload_id=pid) OR EXISTS(SELECT 1 FROM fw.refresh_jobs WHERE workspace_id=w AND request_payload_id=pid) THEN RETURN false; END IF;
 UPDATE fw.payload_objects SET content=NULL,redacted_at=coalesce(redacted_at,clock_timestamp()) WHERE workspace_id=w AND id=pid;
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION fw.redact_expired_payload(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION fw.redact_expired_payload(text,text) TO fw_retention;
COMMIT;
