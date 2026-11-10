-- Durable local migration infrastructure, inventoried separately from DB005 domain tables.
BEGIN;
CREATE TABLE fw_infra.backfill_progress (
  table_name text PRIMARY KEY, input_sha256 text NOT NULL CHECK(input_sha256 ~ '^[0-9a-f]{64}$'),
  last_key text NOT NULL DEFAULT '', rows_done bigint NOT NULL DEFAULT 0 CHECK(rows_done>=0),
  completed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE fw_infra.migration_phases (
  migration_id text PRIMARY KEY, checksum text NOT NULL CHECK(checksum ~ '^[0-9a-f]{64}$'),
  expected_definition text NOT NULL, base_catalog_sha256 text NOT NULL,
  state text NOT NULL CHECK(state IN ('intended','verified')), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON ALL TABLES IN SCHEMA fw_infra FROM PUBLIC;
COMMIT;
