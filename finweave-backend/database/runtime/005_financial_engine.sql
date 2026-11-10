-- Executable BE-03/04/06. Historical bundles remain untouched.
CREATE TABLE fw_finance.ledger_accounts(workspace_id text NOT NULL REFERENCES fw_finance.workspaces, id text NOT NULL, account_id text, purpose text NOT NULL, PRIMARY KEY(workspace_id,id), UNIQUE(workspace_id,account_id), FOREIGN KEY(workspace_id,account_id) REFERENCES fw_finance.accounts);
CREATE UNIQUE INDEX ledger_counter_unique ON fw_finance.ledger_accounts(workspace_id,purpose) WHERE account_id IS NULL;
CREATE TABLE fw_finance.events(workspace_id text NOT NULL REFERENCES fw_finance.workspaces,id text NOT NULL,version integer NOT NULL, family text NOT NULL,payload jsonb NOT NULL, PRIMARY KEY(workspace_id,id,version));
ALTER TABLE fw_finance.events ADD CHECK(COALESCE(payload->'amount'->>'value' ~ '^[1-9][0-9]{0,17}$',false));
CREATE VIEW fw_finance.event_heads WITH(security_invoker=true) AS SELECT DISTINCT ON(workspace_id,id) * FROM fw_finance.events ORDER BY workspace_id,id,version DESC;
CREATE TABLE fw_finance.entry_groups(workspace_id text NOT NULL,id text NOT NULL,event_id text NOT NULL,event_version integer NOT NULL,sealed boolean NOT NULL DEFAULT false,reversal_of text,PRIMARY KEY(workspace_id,id),UNIQUE(workspace_id,reversal_of),FOREIGN KEY(workspace_id,event_id,event_version) REFERENCES fw_finance.events,FOREIGN KEY(workspace_id,reversal_of) REFERENCES fw_finance.entry_groups);
-- Unconstrained numeric plus CHECK: reject scale before any typmod rounding.
CREATE TABLE fw_finance.posting_lines(workspace_id text NOT NULL,group_id text NOT NULL,line_no integer NOT NULL,ledger_id text NOT NULL,signed_amount numeric NOT NULL CHECK(signed_amount<>0 AND signed_amount=trunc(signed_amount) AND abs(signed_amount)<=999999999999999999),currency text NOT NULL CHECK(currency='VND'),PRIMARY KEY(workspace_id,group_id,line_no),FOREIGN KEY(workspace_id,group_id) REFERENCES fw_finance.entry_groups,FOREIGN KEY(workspace_id,ledger_id) REFERENCES fw_finance.ledger_accounts);
CREATE TABLE fw_finance.holdings(workspace_id text NOT NULL REFERENCES fw_finance.workspaces,id text NOT NULL,version integer NOT NULL DEFAULT 0,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_finance.holding_movements(workspace_id text NOT NULL, id text NOT NULL,holding_id text NOT NULL,sequence_no bigint GENERATED ALWAYS AS IDENTITY,mode text NOT NULL CHECK(mode IN('set','delta')),quantity numeric NOT NULL CHECK(quantity>=0 AND quantity<100000000000000000000 AND quantity=round(quantity,8)),business_date text NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,holding_id) REFERENCES fw_finance.holdings);
CREATE TABLE fw_finance.quotes(workspace_id text NOT NULL,id text NOT NULL,holding_id text NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,holding_id) REFERENCES fw_finance.holdings);
CREATE TABLE fw_finance.history(workspace_id text NOT NULL REFERENCES fw_finance.workspaces,id text NOT NULL,object_id text NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_finance.reviews(workspace_id text NOT NULL REFERENCES fw_finance.workspaces,id text NOT NULL,version integer NOT NULL DEFAULT 0,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_finance.cash_observations(workspace_id text NOT NULL,id text NOT NULL,account_id text NOT NULL,observed numeric NOT NULL CHECK(observed>=0 AND observed=trunc(observed)),cutoff_version integer NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(workspace_id,id),FOREIGN KEY(workspace_id,account_id) REFERENCES fw_finance.accounts);
CREATE TABLE fw_finance.previews(workspace_id text NOT NULL REFERENCES fw_finance.workspaces,id text NOT NULL,subject_id text NOT NULL,version integer NOT NULL,digest text NOT NULL,expires_at timestamptz NOT NULL,payload jsonb NOT NULL,PRIMARY KEY(workspace_id,id));
CREATE TABLE fw_finance.catalog(id text PRIMARY KEY,kind text NOT NULL CHECK(kind IN('stock','gold')),version integer NOT NULL,payload jsonb NOT NULL);
-- Explicit manual local profiles: no provider feed or market quote is fabricated.
INSERT INTO fw_finance.catalog VALUES
('manual-stock','stock',1,'{"id":"manual-stock","symbol":"MANUAL","name":"Manual stock declaration","exchange":"HOSE","currency":"VND","unit":"share","supported":true}'),
('manual-gold-9999','gold',1,'{"id":"manual-gold-9999","name":"Manual gold 9999","product":"gold","purity":"9999","source":"manual-owner","side":"buy","currency":"VND","unit":"chi","brand":"owner-declared","region":"VN","confirmationVersion":1}');
CREATE FUNCTION fw_finance.immutable() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'IMMUTABLE_FINANCIAL_HISTORY' USING ERRCODE='23514'; END $$;
CREATE FUNCTION fw_finance.guard_group() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF TG_OP='DELETE' OR OLD.sealed OR NEW.workspace_id<>OLD.workspace_id OR NEW.id<>OLD.id OR NEW.event_id<>OLD.event_id OR NEW.event_version<>OLD.event_version OR NEW.reversal_of IS DISTINCT FROM OLD.reversal_of OR NOT NEW.sealed THEN RAISE EXCEPTION 'SEALED_GROUP_IMMUTABLE' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_group BEFORE UPDATE OR DELETE ON fw_finance.entry_groups FOR EACH ROW EXECUTE FUNCTION fw_finance.guard_group();
CREATE FUNCTION fw_finance.guard_line() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ DECLARE s boolean; BEGIN
 IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'POSTING_IMMUTABLE' USING ERRCODE='23514'; END IF;
 SELECT sealed INTO s FROM fw_finance.entry_groups WHERE workspace_id=NEW.workspace_id AND id=NEW.group_id FOR UPDATE;
 IF s THEN RAISE EXCEPTION 'SEALED_GROUP_APPEND_DENIED' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_line BEFORE INSERT OR UPDATE OR DELETE ON fw_finance.posting_lines FOR EACH ROW EXECUTE FUNCTION fw_finance.guard_line();
CREATE FUNCTION fw_finance.balanced() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ DECLARE s boolean; n integer; total numeric; BEGIN
 SELECT sealed INTO s FROM fw_finance.entry_groups WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 SELECT count(*),sum(signed_amount) INTO n,total FROM fw_finance.posting_lines WHERE workspace_id=NEW.workspace_id AND group_id=NEW.id;
 IF NOT s OR n<2 OR total<>0 THEN RAISE EXCEPTION 'ATOMIC_BALANCED_SEAL_REQUIRED' USING ERRCODE='23514'; END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER balanced_commit AFTER INSERT OR UPDATE ON fw_finance.entry_groups DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw_finance.balanced();
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['ledger_accounts','events','holding_movements','quotes','history','cash_observations','previews'] LOOP
 EXECUTE format('CREATE TRIGGER immutable BEFORE UPDATE OR DELETE ON fw_finance.%I FOR EACH ROW EXECUTE FUNCTION fw_finance.immutable()',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['ledger_accounts','events','entry_groups','posting_lines','holdings','holding_movements','quotes','history','reviews','cash_observations','previews'] LOOP
 EXECUTE format('ALTER TABLE fw_finance.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE fw_finance.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('CREATE POLICY owned ON fw_finance.%I TO fw_runtime_user USING(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT w.blocked)) WITH CHECK(workspace_id=current_setting(''fw.workspace'',true) AND EXISTS(SELECT 1 FROM fw_finance.workspaces w WHERE w.id=workspace_id AND NOT w.blocked))',t);
 EXECUTE format('GRANT SELECT,INSERT ON fw_finance.%I TO fw_runtime_user',t);
 END LOOP;
END $$;
GRANT UPDATE ON fw_finance.entry_groups,fw_finance.holdings,fw_finance.reviews TO fw_runtime_user;
GRANT SELECT ON fw_finance.event_heads,fw_finance.catalog TO fw_runtime_user;
GRANT USAGE,SELECT ON SEQUENCE fw_finance.holding_movements_sequence_no_seq TO fw_runtime_user;
CREATE FUNCTION fw_finance.lock_financial_event() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ DECLARE head fw_finance.events; BEGIN
 PERFORM 1 FROM fw_finance.workspaces WHERE id=NEW.workspace_id FOR UPDATE;
 IF NOT EXISTS(SELECT 1 FROM fw_finance.accounts WHERE workspace_id=NEW.workspace_id AND id=NEW.payload->>'accountId') OR (NEW.payload->>'toAccountId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fw_finance.accounts WHERE workspace_id=NEW.workspace_id AND id=NEW.payload->>'toAccountId')) OR (NEW.payload->>'holdingId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM fw_finance.holdings WHERE workspace_id=NEW.workspace_id AND id=NEW.payload->>'holdingId')) THEN RAISE EXCEPTION 'CROSS_WORKSPACE_FINANCIAL_REFERENCE' USING ERRCODE='23514'; END IF;
 SELECT * INTO head FROM fw_finance.event_heads WHERE workspace_id=NEW.workspace_id AND id=NEW.id;
 IF (head.id IS NULL AND NEW.version<>0) OR (head.id IS NOT NULL AND (NEW.version<>head.version+1 OR NEW.family<>head.family)) THEN RAISE EXCEPTION 'EVENT_REVISION_SEQUENCE' USING ERRCODE='23514'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER serialize_events BEFORE INSERT ON fw_finance.events FOR EACH ROW EXECUTE FUNCTION fw_finance.lock_financial_event();
CREATE FUNCTION fw_finance.refund_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ DECLARE r record; cap numeric; total numeric; BEGIN
 FOR r IN SELECT payload->>'originId' AS origin,payload->>'accountId' AS account FROM fw_finance.event_heads WHERE workspace_id=NEW.workspace_id AND payload->>'kind'='refund' AND payload->>'posting'='posted' AND payload->>'originId' IS NOT NULL LOOP
 SELECT (payload->'amount'->>'value')::numeric INTO cap FROM fw_finance.event_heads WHERE workspace_id=NEW.workspace_id AND family=r.origin AND payload->>'kind'='expense' AND payload->>'posting'='posted' AND payload->>'accountId'=r.account;
 SELECT sum((payload->'amount'->>'value')::numeric) INTO total FROM fw_finance.event_heads WHERE workspace_id=NEW.workspace_id AND payload->>'kind'='refund' AND payload->>'posting'='posted' AND payload->>'originId'=r.origin;
 IF cap IS NULL OR total>cap THEN RAISE EXCEPTION 'REFUND_ORIGIN_OR_CAP' USING ERRCODE='23514'; END IF;
 END LOOP;RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER refund_commit AFTER INSERT ON fw_finance.events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw_finance.refund_guard();
CREATE FUNCTION fw_finance.posted_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF EXISTS(SELECT 1 FROM fw_finance.event_heads e WHERE e.workspace_id=NEW.workspace_id AND e.id=NEW.id AND e.payload->>'posting' IN('posted','reversed') AND NOT EXISTS(SELECT 1 FROM fw_finance.entry_groups g WHERE g.workspace_id=e.workspace_id AND g.event_id=e.id AND g.sealed)) THEN RAISE EXCEPTION 'POSTED_EVENT_REQUIRES_SEALED_GROUP' USING ERRCODE='23514'; END IF; RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER posted_event_commit AFTER INSERT ON fw_finance.events DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION fw_finance.posted_guard();
CREATE FUNCTION fw_finance.account_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.id<>OLD.id OR NEW.workspace_id<>OLD.workspace_id OR NEW.payload->'opening' IS DISTINCT FROM OLD.payload->'opening' OR NEW.payload->'openingDate' IS DISTINCT FROM OLD.payload->'openingDate' OR NEW.payload->'kind' IS DISTINCT FROM OLD.payload->'kind' THEN RAISE EXCEPTION 'ACCOUNT_BASELINE_IMMUTABLE' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_account BEFORE UPDATE ON fw_finance.accounts FOR EACH ROW EXECUTE FUNCTION fw_finance.account_guard();
CREATE FUNCTION fw_finance.holding_guard() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$ BEGIN
 IF NEW.id<>OLD.id OR NEW.workspace_id<>OLD.workspace_id OR NEW.payload->'catalogId' IS DISTINCT FROM OLD.payload->'catalogId' OR NEW.payload->'kind' IS DISTINCT FROM OLD.payload->'kind' OR NEW.payload->'product' IS DISTINCT FROM OLD.payload->'product' OR NEW.payload->'purity' IS DISTINCT FROM OLD.payload->'purity' THEN RAISE EXCEPTION 'HOLDING_PROFILE_IMMUTABLE' USING ERRCODE='23514'; END IF; RETURN NEW;
END $$;
CREATE TRIGGER protect_holding BEFORE UPDATE ON fw_finance.holdings FOR EACH ROW EXECUTE FUNCTION fw_finance.holding_guard();
-- Reconcile pre-engine local declarations exactly once, inside the migration UoW.
INSERT INTO fw_finance.ledger_accounts SELECT workspace_id,'asset:'||id,id,'asset' FROM fw_finance.accounts;
INSERT INTO fw_finance.ledger_accounts SELECT id,'counter:opening',NULL,'opening' FROM fw_finance.workspaces;
INSERT INTO fw_finance.events SELECT workspace_id,'opening-'||id,0,'opening-'||id,jsonb_build_object('kind','opening','accountId',id,'amount',payload->'opening','date',payload->>'openingDate','posting','posted','description','Opening declaration','category','opening','reference',NULL) FROM fw_finance.accounts WHERE (payload->'opening'->>'value')::numeric>0;
INSERT INTO fw_finance.entry_groups SELECT workspace_id,'opening-'||id,'opening-'||id,0,false,NULL FROM fw_finance.accounts WHERE (payload->'opening'->>'value')::numeric>0;
INSERT INTO fw_finance.posting_lines SELECT workspace_id,'opening-'||id,1,'asset:'||id,(payload->'opening'->>'value')::numeric,'VND' FROM fw_finance.accounts WHERE (payload->'opening'->>'value')::numeric>0;
INSERT INTO fw_finance.posting_lines SELECT workspace_id,'opening-'||id,2,'counter:opening',-(payload->'opening'->>'value')::numeric,'VND' FROM fw_finance.accounts WHERE (payload->'opening'->>'value')::numeric>0;
UPDATE fw_finance.entry_groups SET sealed=true;
