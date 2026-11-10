import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { createServer } from 'node:net';
import { mkdir, readFile, writeFile, unlink, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import { initdb, pg_ctl, postgres } from '@embedded-postgres/windows-x64';
import { root, sha256, pins } from '../src/pins.ts';
import { runDatabaseTests } from '../tests/database.ts';
import { loadMigrations, runnerRevision } from '../src/database/migrate.ts';

const exec = promisify(execFile);
const runId = new Date().toISOString().replaceAll(/[:.]/g, '-');
const evidenceDir = resolve(root, 'docs/execution/evidence/backend-foundation-2026-10-09');
const clusterDir = resolve(root, 'finweave-backend/.local', `pg-${runId}`);
const password = randomBytes(32).toString('hex');
const passwordFile = resolve(clusterDir, '..', `pw-${runId}`);
const netServer = createServer();
await new Promise<void>(r => netServer.listen(0, '127.0.0.1', r));
const address = netServer.address();
if (!address || typeof address === 'string') throw new Error('PORT_ALLOCATION_FAILED');
const port = address.port;
await new Promise<void>((r, j) => netServer.close(e => e ? j(e) : r()));
await mkdir(evidenceDir, { recursive: true });
await mkdir(resolve(clusterDir, '..'), { recursive: true });
const result: Record<string, unknown> = { runId, startedAt: new Date().toISOString(), pins,
  dataset: 'Historical .test fixtures, fictional amounts, disabled password hashes; no external services.',
  status: 'FAIL', scope: 'POSTGRES16_RUNTIME_LOCAL_FOUNDATION_ONLY',
  runtime: { platform: process.platform, node: process.version, binaryPackage: '16.14.0-beta.17',
    postgresSha256: sha256(await readFile(postgres)), initdbSha256: sha256(await readFile(initdb)), pgCtlSha256: sha256(await readFile(pg_ctl)) }
};
let started = false;
let client: Client | undefined;
const config = { host: '127.0.0.1', port, user: 'fw_local', password, database: 'postgres', connectionTimeoutMillis: 5000 };
const execute = (binary: string, args: string[]) => exec(binary, args, { windowsHide: true, timeout: 30000 });
const source: Record<string,string> = {};
async function capture(dir: string, prefix: string) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === '.local' || entry.name === 'node_modules') continue;
    const path = resolve(dir, entry.name), name = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await capture(path, name);
    else if (entry.isFile()) source[name] = sha256(await readFile(path));
  }
}
await capture(resolve(root, 'finweave-backend'), 'finweave-backend');
for (const migration of await loadMigrations()) source[migration.path] = sha256(await readFile(resolve(root,migration.path)));
result.source = source;
result.runnerRevision = runnerRevision;
try {
  await writeFile(passwordFile, password, { flag: 'wx' });
  try {
    const initialization = await execute(initdb, ['-D', clusterDir, '-U', 'fw_local', '--auth=scram-sha-256', '--pwfile', passwordFile, '--encoding=UTF8', '--locale=C']);
    result.initialization = initialization.stdout;
  } finally { await unlink(passwordFile); }
  await execute(pg_ctl, ['-D', clusterDir, '-l', resolve(clusterDir, 'server.log'), '-w', 'start', '-o', `-h 127.0.0.1 -p ${port} -c timezone=UTC -c max_connections=20`]);
  started = true;
  client = new Client(config);
  await client.connect();
  result.server = (await client.query('SELECT version(),current_setting(\'server_version_num\') AS server_version_num')).rows[0];
  result.tests = await runDatabaseTests(client, { ...config, database: 'fw_synthetic_foundation' });
  result.status = 'PASS';
} catch (error) {
  const e = error as Error & { code?: string; stdout?: string; stderr?: string };
  result.failure = { name: e.name, message: e.message.replaceAll(password, '[REDACTED]'), code: e.code,
    stdout: e.stdout?.replaceAll(password, '[REDACTED]'), stderr: e.stderr?.replaceAll(password, '[REDACTED]') };
  process.exitCode = 1;
} finally {
  await client?.end().catch(() => {});
  if (started) {
    try { await execute(pg_ctl, ['-D', clusterDir, '-w', 'stop', '-m', 'fast']); result.clusterStopped = true; }
    catch { result.clusterStopped = false; process.exitCode = 1; }
  }
  result.finishedAt = new Date().toISOString();
  result.sourceUnchangedDuringRun = (await Promise.all(Object.entries(source).map(async ([name, hash]) =>
    sha256(await readFile(resolve(root,name))) === hash))).every(Boolean);
  if (!result.sourceUnchangedDuringRun) { result.status = 'FAIL'; process.exitCode = 1; }
  try {
    const logPath = resolve(evidenceDir, `postgres-${runId}.log`);
    await writeFile(logPath, await readFile(resolve(clusterDir, 'server.log')), { flag: 'wx' });
    result.serverLog = logPath;
  } catch { /* initdb/start may fail before server log exists */ }
  const path = resolve(evidenceDir, `postgres-${runId}.json`);
  await writeFile(path, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ status: result.status, evidence: path, failure: result.failure, tests: result.tests }));
}
