-- FW-DB-LOCAL-004: partial DB005 implementation; historical 001-003 remain byte-identical.
-- Infrastructure journal is fw_infra, separate from domain tables. Local synthetic only.
BEGIN;

-- Preserve exact input before validation. numeric(18,0) rounds fractions before CHECK/trigger execution.
-- Every inherited 18-digit integer money column keeps its original sign/null constraints plus exact bounds.
DO $$ DECLARE field record; BEGIN
  FOR field IN SELECT table_name,column_name FROM information_schema.columns
    WHERE table_schema='fw' AND data_type='numeric' AND numeric_precision=18 AND numeric_scale=0
    ORDER BY table_name,column_name LOOP
    EXECUTE format('ALTER TABLE fw.%I ALTER COLUMN %I TYPE numeric',field.table_name,field.column_name);
    EXECUTE format('ALTER TABLE fw.%I ADD CONSTRAINT %I CHECK (
      %I NOT IN (''NaN''::numeric,''Infinity''::numeric,''-Infinity''::numeric)
      AND %I=trunc(%I) AND abs(%I)<=999999999999999999)',
      field.table_name,'exact_'||field.column_name,field.column_name,field.column_name,field.column_name,field.column_name);
  END LOOP;
END $$;

ALTER TABLE fw.entry_groups ADD COLUMN seal_state text;
ALTER TABLE fw.entry_groups ADD COLUMN sealed_at timestamptz;

-- Invalid legacy data aborts the migration. Never invent balancing lines or repair money during upgrade.
DO $$ BEGIN
  IF EXISTS (
    SELECT g.workspace_id,g.id FROM fw.entry_groups g
    LEFT JOIN fw.posting_lines p ON p.workspace_id=g.workspace_id AND p.group_id=g.id
    GROUP BY g.workspace_id,g.id HAVING count(p.id)<2 OR coalesce(sum(p.signed_amount),0)<>0
  ) OR EXISTS (
    SELECT 1 FROM fw.entry_groups g LEFT JOIN fw.events e ON e.workspace_id=g.workspace_id AND e.id=g.event_id
    WHERE e.posting IS DISTINCT FROM 'posted'
  ) THEN RAISE EXCEPTION 'LEGACY_LEDGER_REQUIRES_QUARANTINE' USING ERRCODE='23514'; END IF;
END $$;

DROP TRIGGER immutable_row ON fw.entry_groups;
UPDATE fw.entry_groups SET seal_state='sealed',sealed_at=committed_at;
ALTER TABLE fw.entry_groups ALTER COLUMN seal_state SET DEFAULT 'building';
ALTER TABLE fw.entry_groups ALTER COLUMN seal_state SET NOT NULL;
ALTER TABLE fw.entry_groups ADD CONSTRAINT seal_coherence CHECK (
  (seal_state='building' AND sealed_at IS NULL) OR (seal_state='sealed' AND sealed_at IS NOT NULL)
);
ALTER TABLE fw.entry_groups ADD CONSTRAINT no_self_reversal CHECK (reversal_of IS NULL OR reversal_of<>id);

CREATE FUNCTION fw.guard_group_seal() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF TG_OP='INSERT' THEN
    IF NEW.seal_state<>'building' OR NEW.sealed_at IS NOT NULL THEN
      RAISE EXCEPTION 'GROUP_MUST_START_BUILDING' USING ERRCODE='23514';
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP='DELETE' OR OLD.seal_state<>'building' THEN
    RAISE EXCEPTION 'SEALED_GROUP_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  IF NEW.seal_state<>'sealed' OR (to_jsonb(NEW)-ARRAY['seal_state','sealed_at']) IS DISTINCT FROM
    (to_jsonb(OLD)-ARRAY['seal_state','sealed_at']) THEN
    RAISE EXCEPTION 'ONLY_BUILDING_TO_SEALED_ALLOWED' USING ERRCODE='23514';
  END IF;
  NEW.sealed_at:=clock_timestamp();
  RETURN NEW;
END $$;
CREATE TRIGGER group_seal BEFORE INSERT OR UPDATE OR DELETE ON fw.entry_groups
  FOR EACH ROW EXECUTE FUNCTION fw.guard_group_seal();

CREATE FUNCTION fw.guard_line_append() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE state text;
BEGIN
  -- All new posting/retarget paths take the workspace anchor first, then the group.
  PERFORM 1 FROM fw.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
  SELECT seal_state INTO state FROM fw.entry_groups WHERE workspace_id=NEW.workspace_id AND id=NEW.group_id FOR UPDATE;
  IF state IS DISTINCT FROM 'building' THEN
    RAISE EXCEPTION 'POSTING_APPEND_REQUIRES_BUILDING_GROUP' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER line_append BEFORE INSERT ON fw.posting_lines FOR EACH ROW EXECUTE FUNCTION fw.guard_line_append();

CREATE FUNCTION fw.check_group_sealed() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
DECLARE state text; original text;
BEGIN
  SELECT seal_state,reversal_of INTO state,original FROM fw.entry_groups WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
  IF state IS DISTINCT FROM 'sealed' THEN RAISE EXCEPTION 'UNSEALED_GROUP_AT_COMMIT' USING ERRCODE='23514'; END IF;
  IF original IS NOT NULL AND (
    NOT EXISTS (SELECT 1 FROM fw.entry_groups WHERE workspace_id=NEW.workspace_id AND id=original AND seal_state='sealed')
    OR EXISTS (
      (SELECT ledger_account_id,currency,signed_amount FROM fw.posting_lines WHERE workspace_id=NEW.workspace_id AND group_id=NEW.id
       EXCEPT ALL SELECT ledger_account_id,currency,-signed_amount FROM fw.posting_lines WHERE workspace_id=NEW.workspace_id AND group_id=original)
      UNION ALL
      (SELECT ledger_account_id,currency,-signed_amount FROM fw.posting_lines WHERE workspace_id=NEW.workspace_id AND group_id=original
       EXCEPT ALL SELECT ledger_account_id,currency,signed_amount FROM fw.posting_lines WHERE workspace_id=NEW.workspace_id AND group_id=NEW.id)
    )
  ) THEN RAISE EXCEPTION 'REVERSAL_LINES_NOT_EXACT' USING ERRCODE='23514'; END IF;
  RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER sealed_at_commit AFTER INSERT OR UPDATE ON fw.entry_groups
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw.check_group_sealed();

CREATE FUNCTION fw.guard_used_ledger_account() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  PERFORM 1 FROM fw.workspaces WHERE id=OLD.workspace_id FOR UPDATE;
  IF (NEW.workspace_id,NEW.id,NEW.account_id,NEW.kind) IS DISTINCT FROM (OLD.workspace_id,OLD.id,OLD.account_id,OLD.kind)
    AND EXISTS (SELECT 1 FROM fw.posting_lines WHERE workspace_id=OLD.workspace_id AND ledger_account_id=OLD.id) THEN
    RAISE EXCEPTION 'USED_LEDGER_ACCOUNT_IMMUTABLE' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER used_ledger_account BEFORE UPDATE ON fw.ledger_accounts FOR EACH ROW EXECUTE FUNCTION fw.guard_used_ledger_account();
CREATE UNIQUE INDEX internal_ledger_purpose ON fw.ledger_accounts(workspace_id,kind) WHERE account_id IS NULL;
CREATE INDEX posting_group_lookup ON fw.posting_lines(workspace_id,group_id);

CREATE TRIGGER no_group_truncate BEFORE TRUNCATE ON fw.entry_groups FOR EACH STATEMENT EXECUTE FUNCTION fw.immutable_row();
CREATE TRIGGER no_line_truncate BEFORE TRUNCATE ON fw.posting_lines FOR EACH STATEMENT EXECUTE FUNCTION fw.immutable_row();
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA fw FROM PUBLIC;
COMMIT;
