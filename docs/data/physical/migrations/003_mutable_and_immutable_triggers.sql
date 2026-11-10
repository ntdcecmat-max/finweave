BEGIN;
DO $$ DECLARE t record; BEGIN
 FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema='fw' LOOP
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='fw' AND table_name=t.table_name AND column_name='version') THEN
   EXECUTE format('CREATE TRIGGER bump_version BEFORE UPDATE ON fw.%I FOR EACH ROW EXECUTE FUNCTION fw.bump_version()',t.table_name);
  ELSE
   -- Immutable evidence payload redaction needs a narrowly scoped retention procedure,
   -- reviewed separately. Generic application UPDATE/DELETE remains forbidden.
   EXECUTE format('CREATE TRIGGER immutable_row BEFORE UPDATE OR DELETE ON fw.%I FOR EACH ROW EXECUTE FUNCTION fw.immutable_row()',t.table_name);
  END IF;
 END LOOP;
END $$;
COMMIT;
