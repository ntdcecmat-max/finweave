-- ARTIFACT ONLY. PostgreSQL 16+. Dedicated disposable synthetic database.

BEGIN;

CREATE SCHEMA fw;

REVOKE ALL ON SCHEMA fw FROM PUBLIC;

CREATE TABLE fw.identities (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL UNIQUE CHECK (email ~ '^[^@]+@[^@]+[.]test$'),
  display_name text NOT NULL,
  credential_hash text NOT NULL,
  state text NOT NULL CHECK (state IN ('active','suspended','deleted'))
);

CREATE TABLE fw.workspaces (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  owner_id text NOT NULL REFERENCES fw.identities(id),
  currency text NOT NULL DEFAULT 'VND' CHECK (currency='VND'),
  timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh' CHECK (timezone='Asia/Ho_Chi_Minh'),
  tracking_start date NOT NULL,
  financial_version bigint NOT NULL DEFAULT 1 CHECK (financial_version > 0),
  profile text NOT NULL DEFAULT 'synthetic' CHECK (profile='synthetic')
);

CREATE TABLE fw.sessions (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  subject_id text NOT NULL REFERENCES fw.identities(id),
  token_digest text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('owner','admin')),
  device_id text,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE fw.identity_challenges (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  subject_id text REFERENCES fw.identities(id),
  challenge_digest text NOT NULL UNIQUE,
  purpose text NOT NULL CHECK (purpose IN ('signin','register','reset','enrollment')),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5)
);

CREATE TABLE fw.devices (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  owner_id text NOT NULL REFERENCES fw.identities(id),
  platform text NOT NULL CHECK (platform='android'),
  public_key text NOT NULL,
  key_digest text NOT NULL,
  name text NOT NULL,
  app_version text NOT NULL,
  consent_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('active','revoked')),
  revoked_at timestamptz,
  last_seen timestamptz,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,key_digest),
  CHECK ((status='revoked')=(revoked_at IS NOT NULL))
);

CREATE TABLE fw.accounts (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('bank','wallet','cash')),
  opening numeric(18,0) NOT NULL CHECK (opening>=0),
  opening_date date NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)
);

CREATE TABLE fw.ledger_accounts (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  account_id text,
  kind text NOT NULL CHECK (kind IN ('asset','income','expense','equity','clearing','investment')),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,account_id),
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.sources (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('bank','wallet','price','manual','csv')),
  connection text NOT NULL CHECK (connection IN ('connected','disconnected','revoked')),
  last_attempt timestamptz,
  last_success timestamptz,
  error_code text,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)
);

CREATE TABLE fw.instruments (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  symbol text NOT NULL,
  exchange text NOT NULL,
  currency text NOT NULL CHECK (currency='VND'),
  unit text NOT NULL CHECK (unit='share'),
  active_from date NOT NULL,
  active_to date,
  supported boolean NOT NULL DEFAULT false,
  UNIQUE (exchange,symbol,active_from)
);

CREATE TABLE fw.gold_profiles (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  product text NOT NULL,
  purity text NOT NULL,
  brand text NOT NULL,
  region text NOT NULL,
  source_ref text NOT NULL,
  side text NOT NULL CHECK (side IN ('buy','sell')),
  currency text NOT NULL CHECK (currency='VND'),
  unit text NOT NULL CHECK (unit='chi')
);

CREATE TABLE fw.holdings (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (kind IN ('stock','gold')),
  instrument_id text REFERENCES fw.instruments(id),
  gold_profile_id text REFERENCES fw.gold_profiles(id),
  name text NOT NULL,
  cost numeric(18,0) CHECK (cost>=0),
  cost_date date,
  profile_confirmed_version bigint,
  archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  CHECK ((kind='stock' AND instrument_id IS NOT NULL AND gold_profile_id IS NULL) OR (kind='gold' AND gold_profile_id IS NOT NULL AND instrument_id IS NULL))
);

CREATE TABLE fw.events (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL CHECK (kind IN ('opening','income','expense','transfer','refund','investment','adjustment','unknown','reversal')),
  amount numeric(18,0) NOT NULL CHECK (amount>0),
  business_date date NOT NULL,
  account_id text NOT NULL,
  to_account_id text,
  holding_id text,
  origin_id text,
  reversal_of text,
  category text NOT NULL,
  description text NOT NULL,
  posting text NOT NULL CHECK (posting IN ('draft','pending','posted')),
  manual_category_override boolean NOT NULL DEFAULT false,
  reference text,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  CHECK (account_id IS DISTINCT FROM to_account_id),
  CHECK (kind<>'transfer' OR to_account_id IS NOT NULL),
  UNIQUE (workspace_id,reversal_of),
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,to_account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,origin_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,reversal_of) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.entry_groups (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id text NOT NULL,
  reversal_of text,
  committed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,event_id),
  UNIQUE (workspace_id,reversal_of),
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,reversal_of) REFERENCES fw.entry_groups(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.posting_lines (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  group_id text NOT NULL,
  ledger_account_id text NOT NULL,
  signed_amount numeric(18,0) NOT NULL CHECK (signed_amount<>0),
  currency text NOT NULL DEFAULT 'VND' CHECK (currency='VND'),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,group_id) REFERENCES fw.entry_groups(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,ledger_account_id) REFERENCES fw.ledger_accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.holding_movements (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  holding_id text NOT NULL,
  event_id text,
  business_date date NOT NULL,
  quantity numeric(28,8) NOT NULL CHECK (quantity>=0),
  delta numeric(28,8),
  kind text NOT NULL CHECK (kind IN ('declaration','investment','correction')),
  reason text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.provider_entitlements (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  provider_id text NOT NULL,
  rights_version text NOT NULL,
  credential_ref text,
  quota_daily integer NOT NULL CHECK (quota_daily>=0),
  allowed_assets jsonb NOT NULL CHECK (jsonb_typeof(allowed_assets)='array') CHECK (allowed_assets IS NULL OR (jsonb_typeof(allowed_assets)='array' AND octet_length(allowed_assets::text)<=262144)),
  cache_scope text NOT NULL,
  expires_at timestamptz,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)
);

CREATE TABLE fw.quote_observations (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  holding_id text NOT NULL,
  entitlement_id text NOT NULL,
  provider_id text NOT NULL,
  price numeric(28,8) NOT NULL CHECK (price>0),
  currency text NOT NULL CHECK (currency IN ('VND','USD')),
  unit text NOT NULL CHECK (unit IN ('share','chi','luong')),
  side text NOT NULL CHECK (side IN ('buy','sell','close')),
  quote_as_of timestamptz NOT NULL,
  fetched_at timestamptz NOT NULL,
  fx_vnd_per_usd numeric(28,8) CHECK (fx_vnd_per_usd>0),
  fx_at timestamptz,
  fingerprint text NOT NULL,
  quality text NOT NULL CHECK (quality IN ('fresh','stale','unknown')),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,holding_id,provider_id,fingerprint),
  FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,entitlement_id) REFERENCES fw.provider_entitlements(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.evidence (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_id text,
  kind text NOT NULL,
  recorded_at timestamptz NOT NULL,
  observed_date date,
  reference text,
  content jsonb CHECK (content IS NULL OR (jsonb_typeof(content)='object' AND octet_length(content::text)<=262144)),
  content_digest text NOT NULL CHECK (content_digest ~ '^[a-f0-9]{64}$'),
  schema_ref text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.event_evidence (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  event_id text NOT NULL,
  evidence_id text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,event_id,evidence_id),
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.source_records (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source_id text NOT NULL,
  source_record_key text NOT NULL,
  revision bigint NOT NULL CHECK (revision>=0),
  parser_version text NOT NULL,
  mapping_version bigint NOT NULL,
  evidence_id text NOT NULL,
  event_id text,
  status text NOT NULL CHECK (status IN ('staged','invalid','duplicate','linked')),
  manual_override jsonb CHECK (manual_override IS NULL OR (jsonb_typeof(manual_override)='object' AND octet_length(manual_override::text)<=262144)),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,source_id,source_record_key,revision),
  FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.reviews (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  event_id text,
  holding_id text,
  account_id text,
  type text NOT NULL CHECK (type IN ('cash','duplicate','invalid','transfer','refund','quality','category','pending')),
  status text NOT NULL CHECK (status IN ('open','resolved')),
  title text NOT NULL,
  variance numeric(18,0),
  observed numeric(18,0),
  resolution jsonb CHECK (resolution IS NULL OR (jsonb_typeof(resolution)='object' AND octet_length(resolution::text)<=262144)),
  resolved_at timestamptz,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.cash_observations (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  account_id text NOT NULL,
  observed numeric(18,0) NOT NULL CHECK (observed>=0),
  as_of timestamptz NOT NULL,
  matched_workspace_version bigint NOT NULL,
  variance numeric(18,0) NOT NULL,
  review_id text,
  evidence_id text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,review_id) REFERENCES fw.reviews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.collector_bindings (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  device_id text NOT NULL,
  account_id text NOT NULL,
  package_name text NOT NULL,
  parser_profile_id text NOT NULL,
  consent_at timestamptz NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,device_id,id),
  FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.ingestion_receipts (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  device_id text NOT NULL,
  binding_id text NOT NULL,
  binding_version bigint NOT NULL,
  event_key text NOT NULL,
  revision bigint NOT NULL CHECK (revision>=0),
  source_key text NOT NULL,
  observed_at timestamptz NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  parser_version text NOT NULL,
  payload_digest text NOT NULL CHECK (payload_digest ~ '^[a-f0-9]{64}$'),
  normalized_evidence jsonb CHECK (normalized_evidence IS NULL OR (jsonb_typeof(normalized_evidence)='object' AND octet_length(normalized_evidence::text)<=262144)),
  state text NOT NULL CHECK (state IN ('received','parsed','posted','needs_review','ignored','failed')),
  event_id text,
  review_id text,
  error_code text,
  ack_at timestamptz,
  lease_until timestamptz,
  lease_token text,
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  next_attempt timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,device_id,event_key,revision),
  CHECK (state<>'posted' OR event_id IS NOT NULL),
  CHECK (state<>'needs_review' OR review_id IS NOT NULL),
  FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,binding_id) REFERENCES fw.collector_bindings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,review_id) REFERENCES fw.reviews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.receipt_evidence (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  receipt_id text NOT NULL,
  evidence_id text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,receipt_id,evidence_id),
  FOREIGN KEY (workspace_id,receipt_id) REFERENCES fw.ingestion_receipts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.coverage_gaps (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  account_id text NOT NULL,
  source_id text,
  device_id text,
  start_at timestamptz NOT NULL,
  end_at timestamptz,
  reason text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  CHECK (end_at IS NULL OR end_at>=start_at),
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.refresh_jobs (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  entitlement_id text NOT NULL,
  dedupe_key text NOT NULL,
  business_date date NOT NULL,
  trigger_kind text NOT NULL,
  state text NOT NULL CHECK (state IN ('queued','running','succeeded','partial','failed','rate_limited')),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3),
  next_attempt timestamptz NOT NULL DEFAULT now(),
  lease_until timestamptz,
  lease_token text,
  result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144)),
  error_code text,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,dedupe_key),
  FOREIGN KEY (workspace_id,entitlement_id) REFERENCES fw.provider_entitlements(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.import_previews (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  account_id text NOT NULL,
  file_digest text NOT NULL CHECK (file_digest ~ '^[a-f0-9]{64}$'),
  mapping_digest text NOT NULL CHECK (mapping_digest ~ '^[a-f0-9]{64}$'),
  profile_version text NOT NULL,
  mapping_version bigint NOT NULL,
  rows jsonb NOT NULL CHECK (rows IS NULL OR (jsonb_typeof(rows)='array' AND octet_length(rows::text)<=262144)),
  expected_workspace_version bigint NOT NULL,
  expires_at timestamptz NOT NULL,
  token_digest text NOT NULL UNIQUE,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.import_jobs (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  preview_id text NOT NULL,
  account_id text NOT NULL,
  selected_row_ids jsonb NOT NULL CHECK (selected_row_ids IS NULL OR (jsonb_typeof(selected_row_ids)='array' AND octet_length(selected_row_ids::text)<=262144)),
  state text NOT NULL CHECK (state IN ('pending','running','completed','failed')),
  result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144)),
  error_code text,
  lease_until timestamptz,
  lease_token text,
  attempts integer NOT NULL DEFAULT 0,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,preview_id),
  FOREIGN KEY (workspace_id,preview_id) REFERENCES fw.import_previews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.snapshots (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  financial_version bigint NOT NULL,
  as_of timestamptz NOT NULL,
  refs jsonb NOT NULL CHECK (refs IS NULL OR (jsonb_typeof(refs)='object' AND octet_length(refs::text)<=262144)),
  schema_ref text NOT NULL,
  projection jsonb NOT NULL CHECK (projection IS NULL OR (jsonb_typeof(projection)='object' AND octet_length(projection::text)<=262144)),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,financial_version)
);

CREATE TABLE fw.financial_plans (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  horizon date NOT NULL,
  baseline_snapshot_id text NOT NULL,
  lifecycle text NOT NULL CHECK (lifecycle IN ('active','archived')),
  assumptions jsonb NOT NULL CHECK (assumptions IS NULL OR (jsonb_typeof(assumptions)='array' AND octet_length(assumptions::text)<=262144)),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,baseline_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.plan_items (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  plan_id text,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('income','expense','investment')),
  amount numeric(18,0) NOT NULL CHECK (amount>0),
  account_id text NOT NULL,
  holding_id text,
  start_date date NOT NULL,
  end_date date NOT NULL,
  recurrence text NOT NULL CHECK (recurrence IN ('once','monthly')),
  day_of_month integer NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  skip_months jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (skip_months IS NULL OR (jsonb_typeof(skip_months)='array' AND octet_length(skip_months::text)<=262144)),
  category text NOT NULL,
  archived boolean NOT NULL DEFAULT false,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  CHECK (start_date<=end_date),
  CHECK (kind<>'investment' OR holding_id IS NOT NULL),
  FOREIGN KEY (workspace_id,plan_id) REFERENCES fw.financial_plans(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.actual_links (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  plan_item_id text NOT NULL,
  plan_item_version bigint NOT NULL,
  plan_version bigint NOT NULL,
  occurrence_id text NOT NULL,
  event_id text NOT NULL,
  event_version bigint NOT NULL,
  reason text NOT NULL,
  released_at timestamptz,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,plan_item_id) REFERENCES fw.plan_items(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.goals (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  target numeric(18,0) NOT NULL CHECK (target>0),
  due date NOT NULL,
  status text NOT NULL CHECK (status IN ('active','achieved','archived')),
  contribution_schedule jsonb CHECK (contribution_schedule IS NULL OR (jsonb_typeof(contribution_schedule)='object' AND octet_length(contribution_schedule::text)<=262144)),
  projection jsonb CHECK (projection IS NULL OR (jsonb_typeof(projection)='object' AND octet_length(projection::text)<=262144)),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)
);

CREATE TABLE fw.plan_goal_links (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  plan_item_id text NOT NULL,
  plan_item_version bigint NOT NULL,
  goal_id text NOT NULL,
  goal_version bigint NOT NULL,
  role text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,plan_item_id,plan_item_version,goal_id),
  FOREIGN KEY (workspace_id,plan_item_id) REFERENCES fw.plan_items(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.goal_allocations (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  goal_id text NOT NULL,
  account_id text NOT NULL,
  amount numeric(18,0) NOT NULL CHECK (amount>0),
  business_date date NOT NULL,
  active boolean NOT NULL DEFAULT true,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.simulations (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  goal_id text,
  base_snapshot_id text NOT NULL,
  frozen_inputs jsonb NOT NULL CHECK (frozen_inputs IS NULL OR (jsonb_typeof(frozen_inputs)='object' AND octet_length(frozen_inputs::text)<=262144)),
  result jsonb NOT NULL CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144)),
  schema_ref text NOT NULL,
  state text NOT NULL CHECK (state IN ('ready','failed')),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.conversations (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  lifecycle text NOT NULL CHECK (lifecycle IN ('active','archived')),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)
);

CREATE TABLE fw.messages (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  conversation_id text NOT NULL,
  text text NOT NULL,
  captured_context jsonb NOT NULL CHECK (captured_context IS NULL OR (jsonb_typeof(captured_context)='object' AND octet_length(captured_context::text)<=262144)),
  processing_kind text NOT NULL CHECK (processing_kind IN ('rule','single_tool','agent','scripted')),
  state text NOT NULL CHECK (state IN ('queued','processing','completed','failed','cancelled')),
  result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144)),
  agent_run_id text,
  planning_draft_id text,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.agent_runs (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  conversation_id text NOT NULL,
  base_snapshot_id text NOT NULL,
  intent text NOT NULL CHECK (intent IN ('goal','plan','investigation')),
  state text NOT NULL CHECK (state IN ('queued','reading','awaiting_user','simulating','draft_ready','completed','partial','failed','cancelled')),
  question_id text,
  constraints jsonb NOT NULL CHECK (constraints IS NULL OR (jsonb_typeof(constraints)='object' AND octet_length(constraints::text)<=262144)),
  settings jsonb NOT NULL CHECK (settings IS NULL OR (jsonb_typeof(settings)='object' AND octet_length(settings::text)<=262144)),
  active_millis integer NOT NULL DEFAULT 0 CHECK (active_millis BETWEEN 0 AND 60000),
  tool_calls integer NOT NULL DEFAULT 0 CHECK (tool_calls BETWEEN 0 AND 8),
  clarifications integer NOT NULL DEFAULT 0 CHECK (clarifications BETWEEN 0 AND 2),
  lease_until timestamptz,
  lease_token text,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.planning_drafts (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  conversation_id text NOT NULL,
  run_id text,
  base_snapshot_id text NOT NULL,
  state text NOT NULL CHECK (state IN ('draft','previewed','confirmed','superseded','expired')),
  body jsonb NOT NULL CHECK (body IS NULL OR (jsonb_typeof(body)='object' AND octet_length(body::text)<=262144)),
  schema_ref text NOT NULL,
  confirmed_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (confirmed_ids IS NULL OR (jsonb_typeof(confirmed_ids)='array' AND octet_length(confirmed_ids::text)<=262144)),
  expires_at timestamptz NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.tool_results (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  run_id text,
  message_id text,
  base_snapshot_id text NOT NULL,
  tool_name text NOT NULL,
  result jsonb NOT NULL CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144)),
  schema_ref text NOT NULL,
  evidence_refs jsonb NOT NULL CHECK (evidence_refs IS NULL OR (jsonb_typeof(evidence_refs)='array' AND octet_length(evidence_refs::text)<=262144)),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  FOREIGN KEY (workspace_id,run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,message_id) REFERENCES fw.messages(workspace_id,id) DEFERRABLE INITIALLY DEFERRED,
  FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE fw.version_history (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  object_type text NOT NULL,
  object_id text NOT NULL,
  object_version bigint NOT NULL,
  payload jsonb NOT NULL CHECK (payload IS NULL OR (jsonb_typeof(payload)='object' AND octet_length(payload::text)<=262144)),
  schema_ref text NOT NULL,
  reason text NOT NULL,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,object_type,object_id,object_version)
);

CREATE TABLE fw.proposal_previews (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  subject_id text NOT NULL REFERENCES fw.identities(id),
  operation_id text NOT NULL,
  object_id text,
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  base_versions jsonb NOT NULL CHECK (base_versions IS NULL OR (jsonb_typeof(base_versions)='object' AND octet_length(base_versions::text)<=262144)),
  changes jsonb NOT NULL CHECK (changes IS NULL OR (jsonb_typeof(changes)='object' AND octet_length(changes::text)<=262144)),
  token_digest text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)
);

CREATE TABLE fw.idempotency_records (
  workspace_id text NOT NULL,
  id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  principal_id text NOT NULL,
  operation_id text NOT NULL,
  key text NOT NULL,
  payload_digest text NOT NULL CHECK (payload_digest ~ '^[a-f0-9]{64}$'),
  result_ref text NOT NULL,
  result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144)),
  committed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id,id),
  FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id),
  UNIQUE (workspace_id,principal_id,operation_id,key)
);

CREATE TABLE fw.ops_accounts (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  subject_token text NOT NULL,
  workspace_token text NOT NULL,
  state text NOT NULL CHECK (state IN ('active','suspended')),
  device_health jsonb NOT NULL CHECK (device_health IS NULL OR (jsonb_typeof(device_health)='array' AND octet_length(device_health::text)<=262144))
);

CREATE TABLE fw.ops_sources (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  package_name text NOT NULL,
  parser_version text NOT NULL,
  compatibility text NOT NULL,
  state text NOT NULL CHECK (state IN ('enabled','disabled','degraded')),
  binding_count integer NOT NULL CHECK (binding_count>=0),
  last_success timestamptz,
  error_code text
);

CREATE TABLE fw.ops_jobs (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source_id text NOT NULL,
  job_type text NOT NULL CHECK (job_type IN ('price_refresh','ingestion','sync','import','agent')),
  state text NOT NULL CHECK (state IN ('queued','running','failed','succeeded','paused')),
  attempts integer NOT NULL DEFAULT 0,
  lease_until timestamptz,
  lease_token text,
  next_attempt timestamptz NOT NULL DEFAULT now(),
  error_code text,
  request_id text NOT NULL
);

CREATE TABLE fw.ops_quotas (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  used bigint NOT NULL CHECK (used>=0),
  limit_value bigint NOT NULL CHECK (limit_value>=0),
  reset_at timestamptz NOT NULL,
  cooldown_until timestamptz
);

CREATE TABLE fw.ops_releases (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  version_name text NOT NULL,
  channel text NOT NULL,
  published_at timestamptz,
  artifact_url text,
  sha256 text,
  signing_fingerprint text,
  compatibility text NOT NULL,
  test_state text NOT NULL CHECK (test_state IN ('not_run','passed','failed'))
);

CREATE TABLE fw.ops_incidents (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  source_id text,
  code text NOT NULL,
  state text NOT NULL CHECK (state IN ('open','resolved'))
);

CREATE TABLE fw.ops_previews (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  subject_id text NOT NULL,
  action text NOT NULL,
  object_id text NOT NULL,
  expected_version bigint NOT NULL,
  reason_code text NOT NULL,
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  token_digest text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL
);

CREATE TABLE fw.ops_idempotency (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  subject_id text NOT NULL,
  operation_id text NOT NULL,
  key text NOT NULL,
  digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$'),
  result jsonb NOT NULL CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))
);

CREATE TABLE fw.ops_audit (
  id text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  actor_id text NOT NULL,
  action text NOT NULL CHECK (action IN ('retry_job','disable_source')),
  object_id text NOT NULL,
  reason_code text NOT NULL,
  from_version bigint NOT NULL,
  to_version bigint NOT NULL,
  result text NOT NULL CHECK (result IN ('succeeded','failed','denied')),
  request_id text NOT NULL
);

-- listTransactions stable date/id + period

CREATE INDEX events_period ON fw.events (workspace_id,business_date DESC,id DESC);

-- account history and scoped flow

CREATE INDEX events_account ON fw.events (workspace_id,account_id,business_date,id);

-- account signed balance, group validation

CREATE INDEX lines_balance ON fw.posting_lines (workspace_id,ledger_account_id,group_id);

-- latest compatible observation <= report asOf

CREATE INDEX quotes_asof ON fw.quote_observations (workspace_id,holding_id,quote_as_of DESC,id);

-- quantity at historical date

CREATE INDEX movement_asof ON fw.holding_movements (workspace_id,holding_id,business_date DESC,id);

-- device receipts cursor

CREATE INDEX receipt_poll ON fw.ingestion_receipts (workspace_id,device_id,created_at DESC,id);

-- ingestion dispatcher

CREATE INDEX receipt_pending ON fw.ingestion_receipts (workspace_id,created_at,id) WHERE state IN ('received','parsed');

-- SKIP LOCKED due jobs; service role only

CREATE INDEX refresh_due ON fw.refresh_jobs (next_attempt,lease_until) WHERE state IN ('queued','running','rate_limited');

-- scheduler due metadata

CREATE INDEX ops_due ON fw.ops_jobs (next_attempt,lease_until) WHERE state IN ('queued','running');

-- shared history keyset pagination

CREATE INDEX messages_history ON fw.messages (workspace_id,conversation_id,created_at DESC,id DESC);

-- draft list and expiry

CREATE INDEX draft_owner_state ON fw.planning_drafts (workspace_id,state,created_at DESC,id);

-- Review inbox

CREATE INDEX review_open ON fw.reviews (workspace_id,status,created_at DESC,id);

-- sum earmarks across goals under account lock

CREATE INDEX allocation_active ON fw.goal_allocations (workspace_id,account_id,goal_id) WHERE active;

-- one event per plan version; unique

CREATE UNIQUE INDEX actual_unique_active ON fw.actual_links (workspace_id,plan_version,event_id) WHERE released_at IS NULL;

-- unique active mapping; no owner retarget

CREATE UNIQUE INDEX binding_live ON fw.collector_bindings (workspace_id,device_id,package_name,account_id) WHERE enabled;

-- unique admin request replay

CREATE UNIQUE INDEX ops_replay ON fw.ops_idempotency (subject_id,operation_id,key);

-- frozen report refs

CREATE INDEX snapshots_asof ON fw.snapshots (workspace_id,as_of DESC);

-- Goals pages

CREATE INDEX goal_status ON fw.goals (workspace_id,status,id);

ALTER TABLE fw.messages ADD FOREIGN KEY (workspace_id,agent_run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE fw.messages ADD FOREIGN KEY (workspace_id,planning_draft_id) REFERENCES fw.planning_drafts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED;

COMMIT;
