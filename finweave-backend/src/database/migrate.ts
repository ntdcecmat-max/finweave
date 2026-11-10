import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Client } from 'pg';
import { root, sha256, verifyPins } from '../pins.ts';

export const runnerRevision = 'FW-MIGRATOR-LOCAL-003';
export interface Migration { id: string; path: string; sha256: string; concurrentIndex?: {name:string; definition:string} }
export async function loadMigrations(): Promise<Migration[]> {
  return JSON.parse(await readFile(resolve(root, 'finweave-backend/database/manifest.json'), 'utf8')).migrations;
}

// Hash catalog definitions, never table data. Detect manual DDL/grant/trigger drift on reruns.
export async function catalogHash(client: Client, omitIndex: string | null = null): Promise<string> {
  const result = await client.query(`
    SELECT jsonb_build_object(
      'relations', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,c.relacl::text,pg_get_userbyid(c.relowner) AS owner
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('fw','fw_infra') AND c.relkind IN ('r','v','S')
      ) x),
      'columns', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,c.relname,a.attname,format_type(a.atttypid,a.atttypmod) AS type,
          a.attnotnull,pg_get_expr(d.adbin,d.adrelid) AS default_expr,a.attacl::text
        FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid
        JOIN pg_namespace n ON n.oid=c.relnamespace
        LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum
        WHERE n.nspname IN ('fw','fw_infra') AND a.attnum>0 AND NOT a.attisdropped
          AND ($1::text IS NULL OR c.oid<>coalesce(to_regclass($1),0::oid))
      ) x),
      'constraints', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,c.relname,k.conname,pg_get_constraintdef(k.oid) AS definition,k.convalidated
        FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('fw','fw_infra')
      ) x),
      'indexes', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,c.relname,pg_get_indexdef(i.indexrelid) AS definition,i.indisvalid,i.indisready
        FROM pg_index i JOIN pg_class c ON c.oid=i.indrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('fw','fw_infra') AND ($1::text IS NULL OR i.indexrelid<>coalesce(to_regclass($1),0::oid))
      ) x),
      'triggers', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,c.relname,t.tgname,pg_get_triggerdef(t.oid) AS definition,t.tgenabled
        FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname IN ('fw','fw_infra') AND NOT t.tgisinternal
      ) x),
      'functions', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,p.proname,pg_get_functiondef(p.oid) AS definition,p.proacl::text,pg_get_userbyid(p.proowner) AS owner
        FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('fw','fw_infra')
      ) x),
      'policies', (SELECT jsonb_agg(x ORDER BY x::text) FROM (SELECT * FROM pg_policies WHERE schemaname IN ('fw','fw_infra')) x),
      'schemas', (SELECT jsonb_agg(x ORDER BY x::text) FROM (SELECT nspname,nspacl::text,pg_get_userbyid(nspowner) AS owner FROM pg_namespace WHERE nspname IN ('fw','fw_infra')) x),
      'roles', (SELECT jsonb_agg(x ORDER BY x::text) FROM (SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolbypassrls FROM pg_roles WHERE rolname LIKE 'fw_%') x),
      'memberships', (SELECT jsonb_agg(x ORDER BY x::text) FROM (SELECT a.rolname AS role,b.rolname AS member,m.admin_option,m.inherit_option,m.set_option FROM pg_auth_members m JOIN pg_roles a ON a.oid=m.roleid JOIN pg_roles b ON b.oid=m.member WHERE a.rolname LIKE 'fw_%' OR b.rolname LIKE 'fw_%') x),
      'default_acl', (SELECT jsonb_agg(x ORDER BY x::text) FROM (
        SELECT n.nspname,d.defaclobjtype,d.defaclacl::text FROM pg_default_acl d JOIN pg_namespace n ON n.oid=d.defaclnamespace
        WHERE n.nspname IN ('fw','fw_infra')
      ) x)
    ) AS catalog`,[omitIndex]);
  return sha256(JSON.stringify(result.rows[0].catalog));
}

export function transactionBody(sql: string): string {
  // Historical artifacts own an outer transaction; the runner takes ownership so journal+DDL commit together.
  const stripped = sql.replace(/^\s*(?:--[^\r\n]*(?:\r?\n|$)\s*)*BEGIN;\s*/i, '').replace(/\s*COMMIT;\s*$/i, '');
  if (stripped === sql || /\bCREATE\s+(?:UNIQUE\s+)?INDEX\s+CONCURRENTLY\b/i.test(stripped)) throw new Error('TRANSACTIONAL_MIGRATION_REQUIRED');
  return stripped;
}

const bootstrap = `
  CREATE SCHEMA fw_infra;
  REVOKE ALL ON SCHEMA fw_infra FROM PUBLIC;
  ALTER DEFAULT PRIVILEGES IN SCHEMA fw_infra REVOKE ALL ON TABLES FROM PUBLIC;
  ALTER DEFAULT PRIVILEGES IN SCHEMA fw_infra REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
  CREATE TABLE fw_infra.migration_journal (
    id text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    migration_name text NOT NULL UNIQUE,
    checksum text NOT NULL CHECK (checksum ~ '^[0-9a-f]{64}$'),
    runner_version text NOT NULL,
    release_id text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    schema_from text NOT NULL,
    schema_to text NOT NULL,
    catalog_sha256 text NOT NULL CHECK (catalog_sha256 ~ '^[0-9a-f]{64}$')
  );
  REVOKE ALL ON fw_infra.migration_journal FROM PUBLIC;
  CREATE FUNCTION fw_infra.deny_journal_mutation() RETURNS trigger LANGUAGE plpgsql
    SET search_path = pg_catalog AS $$
    BEGIN RAISE EXCEPTION 'MIGRATION_JOURNAL_IMMUTABLE' USING ERRCODE='23514'; END $$;
  REVOKE ALL ON FUNCTION fw_infra.deny_journal_mutation() FROM PUBLIC;
  CREATE TRIGGER journal_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON fw_infra.migration_journal
    FOR EACH STATEMENT EXECUTE FUNCTION fw_infra.deny_journal_mutation();
`;

export async function migrate(client: Client, options: {
  releaseId: string; migrations?: Migration[]; through?: string;
}): Promise<string[]> {
  await verifyPins();
  const migrations = options.migrations ?? await loadMigrations();
  if (!migrations.length || migrations.some((m, i) => m.id !== String(i + 1).padStart(3, '0'))) throw new Error('MIGRATION_ORDER_INVALID');
  if (options.through && !migrations.some(m => m.id === options.through)) throw new Error('MIGRATION_TARGET_UNKNOWN');
  // Validate every raw file before opening any transaction, including migrations outside the requested prefix.
  const bodies = new Map<string, string>();
  for (const migration of migrations) {
    const bytes = await readFile(resolve(root, migration.path));
    if (sha256(bytes) !== migration.sha256) throw new Error(`MIGRATION_CHECKSUM_MISMATCH:${migration.id}`);
    if(migration.concurrentIndex){
      const index=migration.concurrentIndex;
      if(!/^fw\.[a-z0-9_]+$/.test(index.name)||bytes.toString('utf8').trim()!==index.definition.replace('CREATE UNIQUE INDEX ','CREATE UNIQUE INDEX CONCURRENTLY ').replace(/^CREATE INDEX /,'CREATE INDEX CONCURRENTLY ')+';') throw new Error('CONCURRENT_INDEX_MANIFEST_INVALID');
      bodies.set(migration.id,bytes.toString('utf8'));
    }else bodies.set(migration.id, transactionBody(bytes.toString('utf8')));
  }
  const meta = (await client.query(`SELECT current_database() AS name,
    current_setting('server_version_num')::int AS version, current_setting('server_encoding') AS encoding`)).rows[0];
  if (!/^fw_synthetic_[a-z0-9_]+$/.test(meta.name)) throw new Error('DISPOSABLE_DATABASE_REQUIRED');
  if (meta.version < 160000 || meta.version >= 170000 || meta.encoding !== 'UTF8') throw new Error('POSTGRES16_UTF8_REQUIRED');
  const lock = (await client.query('SELECT pg_try_advisory_lock(1179997261, 1) AS held')).rows[0].held;
  if (!lock) throw new Error('MIGRATION_LOCK_BUSY');
  const applied: string[] = [];
  try {
    await client.query("SET search_path = pg_catalog; SET timezone = 'UTC'; SET lock_timeout = '5s'; SET statement_timeout = '60s';");
    const namespaces = (await client.query("SELECT nspname FROM pg_namespace WHERE nspname IN ('fw','fw_infra')")).rows.map(r => r.nspname);
    let recorded: { migration_id: string; checksum: string; catalog_sha256: string }[] = [];
    if (namespaces.length) {
      if (!namespaces.includes('fw_infra') || !(await client.query("SELECT to_regclass('fw_infra.migration_journal') AS journal")).rows[0].journal) throw new Error('UNMANAGED_SCHEMA_REQUIRES_REVIEW');
      recorded = (await client.query('SELECT migration_name AS migration_id,checksum,catalog_sha256 FROM fw_infra.migration_journal ORDER BY migration_name')).rows;
      if (!recorded.length || recorded.some((r, i) => r.migration_id !== migrations[i]?.id || r.checksum !== migrations[i]?.sha256)) throw new Error('JOURNAL_CHECKSUM_OR_ORDER_MISMATCH');
      if (options.through && recorded.at(-1)!.migration_id > options.through) throw new Error('DOWNGRADE_FORBIDDEN');
      if (await catalogHash(client) !== recorded.at(-1)!.catalog_sha256) {
        const next=migrations[recorded.length];
        const phases=(await client.query("SELECT to_regclass('fw_infra.migration_phases') AS phases")).rows[0].phases;
        const phase=phases?(await client.query("SELECT * FROM fw_infra.migration_phases WHERE state='intended'")).rows:[];
        if(!next?.concurrentIndex||phase.length!==1||phase[0].migration_id!==next.id||phase[0].checksum!==next.sha256||phase[0].expected_definition!==next.concurrentIndex.definition||phase[0].base_catalog_sha256!==recorded.at(-1)!.catalog_sha256||await catalogHash(client,next.concurrentIndex.name)!==recorded.at(-1)!.catalog_sha256) throw new Error('CATALOG_DRIFT');
      }
    }
    for (const migration of migrations.slice(recorded.length)) {
      if (options.through && migration.id > options.through) break;
      if(migration.concurrentIndex){
        const index=migration.concurrentIndex;
        const base=(await client.query('SELECT catalog_sha256 FROM fw_infra.migration_journal ORDER BY migration_name DESC LIMIT 1')).rows[0].catalog_sha256;
        await client.query(`INSERT INTO fw_infra.migration_phases(migration_id,checksum,expected_definition,base_catalog_sha256,state) VALUES($1,$2,$3,$4,'intended') ON CONFLICT DO NOTHING`,[migration.id,migration.sha256,index.definition,base]);
        const phase=(await client.query('SELECT * FROM fw_infra.migration_phases WHERE migration_id=$1',[migration.id])).rows[0];
        if(phase.checksum!==migration.sha256||phase.expected_definition!==index.definition||phase.base_catalog_sha256!==base||phase.state!=='intended') throw new Error('PHASE_CHECKSUM_OR_STATE_MISMATCH');
        let observed=(await client.query('SELECT pg_get_indexdef(indexrelid) AS definition,indisvalid,indisready FROM pg_index WHERE indexrelid=to_regclass($1)',[index.name])).rows[0];
        if(observed&&observed.definition!==index.definition) throw new Error('CONCURRENT_INDEX_DEFINITION_MISMATCH');
        if(observed&&(!observed.indisvalid||!observed.indisready)){
          // Repair only the exact phase-owned invalid index; never hide a name collision.
          await client.query(`DROP INDEX CONCURRENTLY ${index.name}`);
          observed=undefined;
        }
        if(!observed) await client.query(bodies.get(migration.id)!);
        observed=(await client.query('SELECT pg_get_indexdef(indexrelid) AS definition,indisvalid,indisready FROM pg_index WHERE indexrelid=to_regclass($1)',[index.name])).rows[0];
        if(observed?.definition!==index.definition||!observed.indisvalid||!observed.indisready) throw new Error('CONCURRENT_INDEX_NOT_VERIFIED');
        await client.query('BEGIN');
        try{
          await client.query(`INSERT INTO fw_infra.migration_journal(id,migration_name,checksum,runner_version,release_id,schema_from,schema_to,catalog_sha256) VALUES($1,$1,$2,$3,$4,$5,$6,$7)`,[migration.id,migration.sha256,runnerRevision,options.releaseId,`FW-DB-LOCAL-${String(Number(migration.id)-1).padStart(3,'0')}`,`FW-DB-LOCAL-${migration.id}`,await catalogHash(client)]);
          await client.query("UPDATE fw_infra.migration_phases SET state='verified',updated_at=clock_timestamp() WHERE migration_id=$1",[migration.id]);
          await client.query('COMMIT');applied.push(migration.id);
        }catch(e){await client.query('ROLLBACK');throw e;}
        continue;
      }
      await client.query('BEGIN');
      try {
        if (!recorded.length && !applied.length) await client.query(bootstrap);
        await client.query(bodies.get(migration.id)!);
        const catalog = await catalogHash(client);
        await client.query(`INSERT INTO fw_infra.migration_journal
          (id,migration_name,checksum,runner_version,release_id,schema_from,schema_to,catalog_sha256) VALUES ($1,$1,$2,$3,$4,$5,$6,$7)`,
          [migration.id, migration.sha256, runnerRevision, options.releaseId,
            migration.id === '001' ? 'EMPTY' : `FW-DB-LOCAL-${String(Number(migration.id)-1).padStart(3,'0')}`,
            `FW-DB-LOCAL-${migration.id}`, catalog]);
        await client.query('COMMIT');
        applied.push(migration.id);
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        throw error;
      }
    }
    return applied;
  } finally {
    await client.query('SELECT pg_advisory_unlock(1179997261, 1)').catch(() => {});
  }
}
