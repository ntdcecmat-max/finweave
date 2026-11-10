import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import type { ClientConfig } from 'pg';
import { loadMigrations, migrate } from '../src/database/migrate.ts';
import { root, sha256 } from '../src/pins.ts';

export async function runDatabaseTests(admin: Client, config: ClientConfig) {
  const cases: { id: string; status: string; observed?: unknown }[] = [];
  const migrationList = await loadMigrations();
  const expectSqlError = async (id: string, sql: string, code = '23514') => {
    await client.query('BEGIN');
    let error: { code?: string; message?: string } | undefined;
    try { await client.query(sql); await client.query('SET CONSTRAINTS ALL IMMEDIATE'); }
    catch (e) { error = e as typeof error; }
    finally { await client.query('ROLLBACK'); }
    assert.equal(error?.code, code, `${id}: ${error?.message ?? 'unexpected success'}`);
    cases.push({ id, status: 'PASS', observed: { code: error!.code, message: error!.message } });
  };
  const groupSql = (id: string, lines = "('LA_BANK',50),('LA_EQUITY',-50)", reversal: string | null = null) => `
    INSERT INTO fw.events (workspace_id,id,kind,amount,business_date,account_id,category,description,posting)
    VALUES ('W_A','EV_${id}','${reversal ? 'reversal' : 'income'}',50,'2026-10-09','A_BANK','fixture','Fictional runtime test','posted');
    INSERT INTO fw.entry_groups (workspace_id,id,event_id,reversal_of) VALUES ('W_A','${id}','EV_${id}',${reversal ? `'${reversal}'` : 'NULL'});
    INSERT INTO fw.posting_lines (workspace_id,id,group_id,ledger_account_id,signed_amount)
      SELECT 'W_A','${id}_'||row_number() OVER (), '${id}',account,amount FROM (VALUES ${lines}) AS v(account,amount);
  `;
  await admin.query('CREATE DATABASE fw_synthetic_foundation');
  const client = new Client(config);
  await client.connect();
  try {
    assert.deepEqual(await migrate(client, { releaseId: 'FW-LOCAL-FOUNDATION-001', through: '003' }), ['001', '002', '003']);
    assert.equal(Number((await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='fw'")).rows[0].count), 54);
    cases.push({ id: 'baseline-clean-install-001-003', status: 'PASS' });
    assert.deepEqual(await migrate(client, { releaseId: 'FW-LOCAL-FOUNDATION-001', through: '003' }), []);
    cases.push({ id: 'baseline-idempotent-rerun', status: 'PASS' });
    await client.query(await readFile(resolve(root, 'docs/data/physical/seed-synthetic.sql'), 'utf8'));
    const cash = (await client.query(`SELECT sum(p.signed_amount)::text AS cash FROM fw.posting_lines p
      JOIN fw.ledger_accounts a ON a.workspace_id=p.workspace_id AND a.id=p.ledger_account_id WHERE a.account_id='A_BANK'`)).rows[0].cash;
    assert.equal(cash, '10000000');
    cases.push({ id: 'historical-synthetic-seed-cash', status: 'PASS', observed: cash });
    await client.query('BEGIN');
    await client.query(`INSERT INTO fw.posting_lines (workspace_id,id,group_id,ledger_account_id,signed_amount)
      VALUES ('W_A','BUG_APPEND_1','G_OPEN','LA_BANK',25),('W_A','BUG_APPEND_2','G_OPEN','LA_EQUITY',-25)`);
    await client.query('SET CONSTRAINTS ALL IMMEDIATE');
    const changed = (await client.query(`SELECT sum(signed_amount)::text AS amount FROM fw.posting_lines WHERE ledger_account_id='LA_BANK'`)).rows[0].amount;
    await client.query('ROLLBACK');
    assert.equal(changed, '10000025');
    cases.push({ id: 'historical-balanced-append-defect-reproduced', status: 'KNOWN_DEFECT', observed: { before: cash, after: changed } });
    await client.query('BEGIN');
    await client.query(`INSERT INTO fw.posting_lines (workspace_id,id,group_id,ledger_account_id,signed_amount)
      VALUES ('W_A','FRACTION1','G_OPEN','LA_BANK','1.5'),('W_A','FRACTION2','G_OPEN','LA_EQUITY','-1.5')`);
    const rounded = (await client.query("SELECT signed_amount::text AS amount FROM fw.posting_lines WHERE id='FRACTION1'")).rows[0].amount;
    await client.query('ROLLBACK');
    assert.equal(rounded, '2');
    cases.push({ id: 'historical-fraction-coercion-reproduced', status: 'KNOWN_DEFECT', observed: { input: '1.5', stored: rounded } });
    await writeFile(resolve(root, 'docs/execution/evidence/backend-foundation-2026-10-09/baseline-defects.json'), JSON.stringify({
      status: 'RUNTIME_DEFECT_REPRODUCED', cases,
      meaning: 'Balanced append changes committed money, and numeric(18,0) silently rounds input. Probe transactions rolled back; historical files unchanged.'
    }, null, 2) + '\n', { flag: 'wx' }).catch(e => { if (e.code !== 'EEXIST') throw e; });
    assert.deepEqual(await migrate(client, { releaseId: 'FW-LOCAL-FOUNDATION-001' }), ['004']);
    const groups = (await client.query("SELECT seal_state,sealed_at IS NOT NULL AS sealed FROM fw.entry_groups WHERE id='G_OPEN'")).rows[0];
    assert.deepEqual(groups, { seal_state: 'sealed', sealed: true });
    assert.equal((await client.query("SELECT sum(signed_amount)::text AS amount FROM fw.posting_lines WHERE ledger_account_id='LA_BANK'")).rows[0].amount, cash);
    cases.push({ id: 'upgrade-001-003-to-004-preserves-opening', status: 'PASS' });
    assert.deepEqual(await migrate(client, { releaseId: 'FW-LOCAL-FOUNDATION-001' }), []);
    cases.push({ id: 'latest-idempotent-rerun', status: 'PASS' });
    await assert.rejects(migrate(client, { releaseId: 'test', through: '003' }), /DOWNGRADE_FORBIDDEN/);
    cases.push({ id: 'migration-downgrade-denied', status: 'PASS' });
    await assert.rejects(migrate(client, { releaseId: 'test', migrations: migrationList.map(m => m.id === '004' ? { ...m, sha256: '0'.repeat(64) } : m) }), /MIGRATION_CHECKSUM_MISMATCH:004/);
    cases.push({ id: 'migration-file-checksum-mismatch-denied', status: 'PASS' });
    await expectSqlError('journal-update-denied', "UPDATE fw_infra.migration_journal SET release_id='forged'");
    await expectSqlError('journal-truncate-denied', 'TRUNCATE fw_infra.migration_journal');
    await client.query('BEGIN; ALTER TABLE fw.accounts ADD COLUMN drift_fixture text');
    await assert.rejects(migrate(client, { releaseId: 'test' }), /CATALOG_DRIFT/);
    await client.query('ROLLBACK');
    cases.push({ id: 'migration-catalog-drift-denied', status: 'PASS' });
    const second = new Client(config);
    await second.connect();
    try {
      await second.query('SELECT pg_advisory_lock(1179997261,1)');
      await assert.rejects(migrate(client, { releaseId: 'test' }), /MIGRATION_LOCK_BUSY/);
      await second.query('SELECT pg_advisory_unlock(1179997261,1)');
      cases.push({ id: 'concurrent-migrator-denied', status: 'PASS' });
    } finally { await second.end(); }
    const faultPath = 'finweave-backend/.local/fault-005.sql';
    const faultSql = 'BEGIN; CREATE TABLE fw.rollback_probe(id text); SELECT 1/0; COMMIT;';
    await writeFile(resolve(root, faultPath), faultSql);
    await assert.rejects(migrate(client, { releaseId: 'test-fault', migrations: [...migrationList,
      { id: '005', path: faultPath, sha256: sha256(faultSql) }] }), { code: '22012' });
    assert.equal((await client.query("SELECT to_regclass('fw.rollback_probe') AS table")).rows[0].table, null);
    assert.equal((await client.query("SELECT count(*)::int AS count FROM fw_infra.migration_journal")).rows[0].count, 4);
    assert.deepEqual(await migrate(client, { releaseId: 'test' }), []);
    cases.push({ id: 'failed-ddl-and-journal-rollback-retry', status: 'PASS' });
    const crashSql = 'BEGIN; CREATE TABLE fw.crash_probe(id text); SELECT pg_sleep(10); COMMIT;';
    const crashPath = 'finweave-backend/.local/crash-005.sql';
    await writeFile(resolve(root, crashPath), crashSql);
    const victim = new Client(config);
    victim.on('error', () => {}); // Termination can also emit an idle-client error after the active query rejects.
    await victim.connect();
    const victimPid = (await victim.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    const crashing = migrate(victim, { releaseId: 'test-connection-loss', migrations: [...migrationList,
      { id: '005', path: crashPath, sha256: sha256(crashSql) }] }).then(() => 'UNEXPECTED_SUCCESS', e => e.code ?? e.message);
    let sleeping = false;
    const killDeadline = Date.now()+5000;
    while (Date.now()<killDeadline) {
      sleeping = (await admin.query('SELECT wait_event FROM pg_stat_activity WHERE pid=$1',[victimPid])).rows[0]?.wait_event === 'PgSleep';
      if (sleeping) break;
      await new Promise(r=>setTimeout(r,20));
    }
    assert.equal(sleeping,true);
    await admin.query('SELECT pg_terminate_backend($1)',[victimPid]);
    assert.equal(await crashing,'57P01');
    await victim.end().catch(()=>{});
    assert.equal((await client.query("SELECT to_regclass('fw.crash_probe') AS table")).rows[0].table,null);
    assert.deepEqual(await migrate(client,{releaseId:'test-after-connection-loss'}),[]);
    cases.push({id:'connection-loss-rolls-back-ddl-releases-lock-and-stops-runner',status:'PASS'});
    await expectSqlError('sealed-balanced-append-denied', `INSERT INTO fw.posting_lines(workspace_id,id,group_id,ledger_account_id,signed_amount)
      VALUES ('W_A','ILLEGAL1','G_OPEN','LA_BANK',25),('W_A','ILLEGAL2','G_OPEN','LA_EQUITY',-25)`);
    await expectSqlError('posted-line-update-denied', "UPDATE fw.posting_lines SET signed_amount=1 WHERE id='L_OPEN_1'");
    await expectSqlError('sealed-group-update-denied', "UPDATE fw.entry_groups SET event_id='x' WHERE id='G_OPEN'");
    await expectSqlError('sealed-group-delete-denied', "DELETE FROM fw.entry_groups WHERE id='G_OPEN'");
    await expectSqlError('posting-truncate-denied', 'TRUNCATE fw.posting_lines');
    await expectSqlError('used-account-retarget-denied', "UPDATE fw.ledger_accounts SET kind='expense',version=version+1 WHERE id='LA_BANK'");
    await expectSqlError('duplicate-internal-ledger-purpose-denied', "INSERT INTO fw.ledger_accounts(workspace_id,id,kind) VALUES ('W_A','DUP_EQUITY','equity')", '23505');
    for (const value of ['1.5', 'NaN', 'Infinity', '-Infinity', '1000000000000000000']) {
      await expectSqlError(`exact-opening-rejects-${value}`, `INSERT INTO fw.accounts (workspace_id,id,name,kind,opening,opening_date)
        VALUES ('W_A','INVALID','Fixture','cash','${value}','2026-10-09')`);
    }
    await expectSqlError('cross-workspace-reference-denied', `INSERT INTO fw.ledger_accounts(workspace_id,id,account_id,kind) VALUES ('W_B','BAD','A_BANK','asset')`, '23503');
    await expectSqlError('building-group-cannot-commit', groupSql('UNSEALED'));
    await expectSqlError('unbalanced-group-cannot-commit', groupSql('UNBALANCED', "('LA_BANK',50),('LA_EQUITY',-49)") + "UPDATE fw.entry_groups SET seal_state='sealed' WHERE id='UNBALANCED';");
    await client.query('BEGIN');
    await client.query(groupSql('VALID'));
    await client.query("UPDATE fw.entry_groups SET seal_state='sealed' WHERE id='VALID'");
    await client.query('COMMIT');
    assert.equal((await client.query("SELECT sum(signed_amount)::text AS amount FROM fw.posting_lines WHERE ledger_account_id='LA_BANK'")).rows[0].amount, '10000050');
    cases.push({ id: 'balanced-new-group-commits-once-sealed', status: 'PASS' });
    await expectSqlError('aggregate-only-reversal-denied', groupSql('BAD_REV', "('LA_BANK',-20),('LA_BANK',-30),('LA_EQUITY',50)", 'VALID') + "UPDATE fw.entry_groups SET seal_state='sealed' WHERE id='BAD_REV';");
    await client.query('BEGIN');
    await client.query(groupSql('REV', "('LA_BANK',-50),('LA_EQUITY',50)", 'VALID'));
    await client.query("UPDATE fw.entry_groups SET seal_state='sealed' WHERE id='REV'");
    await client.query('COMMIT');
    assert.equal((await client.query("SELECT sum(signed_amount)::text AS amount FROM fw.posting_lines WHERE ledger_account_id='LA_BANK'")).rows[0].amount, cash);
    cases.push({ id: 'exact-line-reversal-restores-cash', status: 'PASS' });

    // Connection B waits on the same workspace anchor until A seals/commits; it must then reject stale append.
    const contender = new Client(config);
    await contender.connect();
    try {
      await client.query('BEGIN');
      await client.query(groupSql('RACE'));
      await contender.query('BEGIN');
      const pid = (await contender.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
      const pending = contender.query(`INSERT INTO fw.posting_lines(workspace_id,id,group_id,ledger_account_id,signed_amount)
        VALUES ('W_A','RACE_LATE1','RACE','LA_BANK',1),('W_A','RACE_LATE2','RACE','LA_EQUITY',-1)`)
        .then(() => ({ code: 'UNEXPECTED_SUCCESS' }), e => ({ code: e.code }));
      const deadline = Date.now() + 5000;
      let blocked = false;
      while (Date.now() < deadline) {
        blocked = (await admin.query('SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1', [pid])).rows[0]?.wait_event_type === 'Lock';
        if (blocked) break;
        await new Promise(r => setTimeout(r, 20));
      }
      assert.equal(blocked, true);
      await client.query("UPDATE fw.entry_groups SET seal_state='sealed' WHERE id='RACE'");
      await client.query('COMMIT');
      assert.equal((await pending).code, '23514');
      await contender.query('ROLLBACK');
      cases.push({ id: 'two-connections-seal-vs-stale-append', status: 'PASS' });
    } finally { await client.query('ROLLBACK').catch(() => {}); await contender.end(); }

    await admin.query('CREATE DATABASE fw_synthetic_clean');
    const clean = new Client({ ...config, database: 'fw_synthetic_clean' });
    await clean.connect();
    try {
      assert.deepEqual(await migrate(clean, { releaseId: 'FW-LOCAL-FOUNDATION-001' }), ['001','002','003','004']);
      assert.equal((await clean.query("SELECT count(*)::int AS count FROM information_schema.tables WHERE table_schema='fw'")).rows[0].count, 54);
      assert.deepEqual(await migrate(clean, { releaseId: 'FW-LOCAL-FOUNDATION-001' }), []);
      cases.push({ id: 'latest-clean-install-and-rerun', status: 'PASS' });
    } finally { await clean.end(); }
    await admin.query('CREATE DATABASE fw_synthetic_unknown');
    const unknown = new Client({ ...config, database: 'fw_synthetic_unknown' });
    await unknown.connect();
    try {
      await unknown.query('CREATE SCHEMA fw');
      await assert.rejects(migrate(unknown, { releaseId: 'test' }), /UNMANAGED_SCHEMA_REQUIRES_REVIEW/);
      cases.push({ id: 'unmanaged-existing-schema-denied', status: 'PASS' });
    } finally { await unknown.end(); }
    await assert.rejects(migrate(admin, { releaseId: 'test' }), /DISPOSABLE_DATABASE_REQUIRED/);
    cases.push({ id: 'non-disposable-database-denied', status: 'PASS' });

    // Test-only narrow read roles. The historical broad worker/dispatcher provisioning is deliberately unused.
    await client.query(`CREATE ROLE fw_test_owner NOLOGIN NOBYPASSRLS;
      CREATE ROLE fw_test_ops NOLOGIN NOBYPASSRLS;
      CREATE ROLE fw_test_worker NOLOGIN NOBYPASSRLS;
      GRANT USAGE ON SCHEMA fw TO fw_test_owner,fw_test_ops,fw_test_worker;
      GRANT SELECT ON fw.accounts,fw.workspaces TO fw_test_owner;`);
    await client.query("BEGIN; SET LOCAL ROLE fw_test_owner; SET LOCAL app.subject_id='U_A'; SET LOCAL app.workspace_id='W_A'");
    assert.deepEqual((await client.query('SELECT id FROM fw.accounts')).rows, [{ id: 'A_BANK' }]);
    await client.query("SET LOCAL app.workspace_id='W_B'");
    assert.deepEqual((await client.query('SELECT id FROM fw.accounts')).rows, []);
    await client.query('ROLLBACK');
    cases.push({ id: 'owner-rls-cross-workspace-denied', status: 'PASS' });
    await client.query('BEGIN; SET LOCAL ROLE fw_test_owner');
    assert.deepEqual((await client.query('SELECT id FROM fw.accounts')).rows, []);
    await client.query('ROLLBACK');
    cases.push({ id: 'reused-connection-has-no-owner-context', status: 'PASS' });
    await expectSqlError('ops-finance-read-denied', 'SET LOCAL ROLE fw_test_ops; SELECT * FROM fw.accounts', '42501');
    await expectSqlError('worker-finance-read-denied', 'SET LOCAL ROLE fw_test_worker; SELECT * FROM fw.accounts', '42501');
    await expectSqlError('app-journal-read-denied', 'SET LOCAL ROLE fw_test_owner; SELECT * FROM fw_infra.migration_journal', '42501');
    await expectSqlError('app-ddl-denied', 'SET LOCAL ROLE fw_test_owner; CREATE TABLE fw.illegal(id text)', '42501');
    return cases;
  } catch (error) {
    cases.push({ id: 'unexpected-runtime-failure', status: 'FAIL', observed: { message: (error as Error).message, code: (error as {code?: string}).code } });
    throw error;
  } finally {
    await writeFile(resolve(root, `docs/execution/evidence/backend-foundation-2026-10-09/database-cases-${Date.now()}.json`), JSON.stringify(cases, null, 2) + '\n', { flag: 'wx' });
    await client.end();
  }
}
