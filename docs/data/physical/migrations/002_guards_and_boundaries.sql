-- Artifact only. Run after 001 in a disposable synthetic database.
BEGIN;
CREATE FUNCTION fw.bump_version() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.version <> OLD.version + 1 THEN RAISE EXCEPTION 'VERSION_INCREMENT_REQUIRED' USING ERRCODE='40001'; END IF;
 NEW.updated_at := now(); RETURN NEW;
END $$;
CREATE FUNCTION fw.immutable_row() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'IMMUTABLE_RECORD' USING ERRCODE='23514'; END $$;
CREATE FUNCTION fw.guard_owner_binding() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE actual_owner text;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.workspace_id<>OLD.workspace_id OR NEW.owner_id<>OLD.owner_id OR NEW.public_key<>OLD.public_key) THEN
  RAISE EXCEPTION 'DEVICE_OWNER_IMMUTABLE' USING ERRCODE='23514';
 END IF;
 SELECT owner_id INTO actual_owner FROM fw.workspaces WHERE id=NEW.workspace_id;
 IF actual_owner IS DISTINCT FROM NEW.owner_id THEN RAISE EXCEPTION 'DEVICE_OWNER_MISMATCH' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER device_owner BEFORE INSERT OR UPDATE ON fw.devices FOR EACH ROW EXECUTE FUNCTION fw.guard_owner_binding();
CREATE FUNCTION fw.guard_binding() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.workspace_id<>OLD.workspace_id OR NEW.device_id<>OLD.device_id OR NEW.account_id<>OLD.account_id OR NEW.package_name<>OLD.package_name THEN
  RAISE EXCEPTION 'BINDING_RETARGET_FORBIDDEN' USING ERRCODE='23514';
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER binding_owner BEFORE UPDATE ON fw.collector_bindings FOR EACH ROW EXECUTE FUNCTION fw.guard_binding();
CREATE FUNCTION fw.guard_receipt() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE b fw.collector_bindings; d fw.devices;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.workspace_id<>OLD.workspace_id OR NEW.device_id<>OLD.device_id OR NEW.event_key<>OLD.event_key OR NEW.revision<>OLD.revision OR NEW.payload_digest<>OLD.payload_digest OR NEW.binding_id<>OLD.binding_id) THEN
  RAISE EXCEPTION 'RECEIPT_IDENTITY_IMMUTABLE' USING ERRCODE='23514';
 END IF;
 IF TG_OP='INSERT' THEN
  SELECT * INTO b FROM fw.collector_bindings WHERE workspace_id=NEW.workspace_id AND id=NEW.binding_id FOR SHARE;
  SELECT * INTO d FROM fw.devices WHERE workspace_id=NEW.workspace_id AND id=NEW.device_id FOR SHARE;
  IF b.id IS NULL OR d.id IS NULL OR b.device_id<>d.id OR b.version<>NEW.binding_version OR NOT b.enabled OR d.status<>'active' THEN
   RAISE EXCEPTION 'DEVICE_OR_BINDING_INVALID' USING ERRCODE='23514';
  END IF;
 END IF; RETURN NEW;
END $$;
CREATE TRIGGER receipt_binding BEFORE INSERT OR UPDATE ON fw.ingestion_receipts FOR EACH ROW EXECUTE FUNCTION fw.guard_receipt();
CREATE FUNCTION fw.guard_posted_event() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD.posting='posted' THEN RAISE EXCEPTION 'POSTED_EVENT_IMMUTABLE_USE_REVERSAL' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
CREATE TRIGGER event_immutable BEFORE UPDATE OR DELETE ON fw.events FOR EACH ROW EXECUTE FUNCTION fw.guard_posted_event();
CREATE FUNCTION fw.check_posting_group() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE w text; g text; original text; ev text; total numeric; line_count integer;
BEGIN
 w:=NEW.workspace_id;
 IF TG_TABLE_NAME='entry_groups' THEN g:=NEW.id; ELSE g:=NEW.group_id; END IF;
 SELECT reversal_of,event_id INTO original,ev FROM fw.entry_groups WHERE workspace_id=w AND id=g;
 SELECT count(*),coalesce(sum(signed_amount),0) INTO line_count,total FROM fw.posting_lines WHERE workspace_id=w AND group_id=g;
 IF line_count<2 OR total<>0 THEN RAISE EXCEPTION 'UNBALANCED_POSTING' USING ERRCODE='23514'; END IF;
 IF NOT EXISTS (SELECT 1 FROM fw.events WHERE workspace_id=w AND id=ev AND posting='posted') THEN RAISE EXCEPTION 'GROUP_EVENT_NOT_POSTED' USING ERRCODE='23514'; END IF;
 IF original IS NOT NULL AND EXISTS (
  SELECT ledger_account_id FROM fw.posting_lines WHERE workspace_id=w AND group_id IN (g,original)
  GROUP BY ledger_account_id HAVING sum(signed_amount)<>0
 ) THEN RAISE EXCEPTION 'REVERSAL_NOT_EXACT' USING ERRCODE='23514'; END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER balanced_group AFTER INSERT ON fw.entry_groups DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw.check_posting_group();
CREATE CONSTRAINT TRIGGER balanced_lines AFTER INSERT ON fw.posting_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw.check_posting_group();
CREATE FUNCTION fw.check_event_group() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.posting='posted' AND NOT EXISTS (SELECT 1 FROM fw.entry_groups WHERE workspace_id=NEW.workspace_id AND event_id=NEW.id) THEN
  RAISE EXCEPTION 'POSTED_EVENT_REQUIRES_GROUP' USING ERRCODE='23514';
 END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER posted_group AFTER INSERT OR UPDATE ON fw.events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw.check_event_group();
-- No role is granted to PUBLIC. DBA/runtime are trusted here: synthetic-only.
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema='fw' LOOP
  EXECUTE format('ALTER TABLE fw.%I ENABLE ROW LEVEL SECURITY',t.table_name);
  EXECUTE format('ALTER TABLE fw.%I FORCE ROW LEVEL SECURITY',t.table_name);
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fw' AND table_name=t.table_name AND column_name='workspace_id') THEN
   EXECUTE format('CREATE POLICY workspace_owner ON fw.%I USING (workspace_id=current_setting(''app.workspace_id'',true) AND EXISTS (SELECT 1 FROM fw.workspaces w WHERE w.id=workspace_id AND w.owner_id=current_setting(''app.subject_id'',true))) WITH CHECK (workspace_id=current_setting(''app.workspace_id'',true) AND EXISTS (SELECT 1 FROM fw.workspaces w WHERE w.id=workspace_id AND w.owner_id=current_setting(''app.subject_id'',true)))',t.table_name);
  END IF;
 END LOOP;
END $$;
CREATE POLICY own_workspace ON fw.workspaces USING (owner_id=current_setting('app.subject_id',true)) WITH CHECK (owner_id=current_setting('app.subject_id',true));
CREATE POLICY own_identity ON fw.identities USING (id=current_setting('app.subject_id',true));
CREATE POLICY own_sessions ON fw.sessions USING (subject_id=current_setting('app.subject_id',true));
-- Catalogue read is explicit; still no grants to anonymous users.
CREATE POLICY catalogue_read ON fw.instruments FOR SELECT USING (true);
CREATE POLICY gold_read ON fw.gold_profiles FOR SELECT USING (true);
-- Remaining identity/ops tables default deny. Trusted auth/worker roles require explicit
-- provisioning outside migrations; never give fw_app BYPASSRLS or table ownership.
REVOKE ALL ON ALL TABLES IN SCHEMA fw FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw FROM PUBLIC;
COMMIT;
