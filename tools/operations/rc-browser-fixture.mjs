import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { writeFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createServer } from 'node:net';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
const root = process.cwd(), backend = resolve(root, 'finweave-backend'), web = resolve(root, 'finweave-web');
// Fail on occupied endpoints; never kill, reuse or mutate another local runtime.
for (const port of [4310,4311,5173,4183]) {
  const probe = createServer();
  await new Promise((ok, fail) => { probe.once('error', fail); probe.listen(port, '127.0.0.1', ok); });
  await new Promise(ok => probe.close(ok));
}
process.chdir(backend);
const { startCluster } = await import('../../finweave-backend/scripts/runtime-cluster.ts');
const { token, hashPassword, seal } = await import('../../finweave-backend/src/runtime/crypto.ts');
const cluster = await startCluster('rc-browser-' + Date.now()), children = [], streams = [];
const state = resolve(cluster.dir, 'test-runtime-state.json');
const receipt = { scope: 'LOCAL_SYNTHETIC_BROWSER_REHEARSAL_DEV_SERVERS_NOT_TLS_STAGING', startedAt: new Date().toISOString(), status: 'FAIL', existingRuntimeStateModified: false, realEnabled: false, children: [] };
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('FW_')));
env.FINWEAVE_TEST_RUNTIME_STATE = state;
async function ready(url) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (children.some(c => c.exitCode !== null)) throw Error('RC_FIXTURE_CHILD_EXIT');
    try { if ((await fetch(url, { signal: AbortSignal.timeout(2000) })).ok) return; } catch {}
    await new Promise(ok => setTimeout(ok, 250));
  }
  throw Error('RC_FIXTURE_READINESS_TIMEOUT');
}
function launch(label, args, cwd, extra = {}) {
  const child = spawn(process.execPath, args, { cwd, env: { ...env, ...extra }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.on('error', () => {}); children.push(child);
  const stream = createWriteStream(resolve(cluster.dir, label + '.log')); streams.push(stream);
  child.stdout.pipe(stream, { end: false }); child.stderr.pipe(stream, { end: false });
  receipt.children.push({ label, pid: child.pid });
}
try {
  await writeFile(state, JSON.stringify({ dir: cluster.dir, cluster: cluster.cluster, adminUrl: cluster.adminUrl }), { flag: 'wx' });
  for (const [profile, config] of Object.entries(cluster.configs)) await writeFile(resolve(cluster.dir, profile + '.json'), JSON.stringify({ ...config, pepper: config.pepper.toString('base64url'), replayKey: config.replayKey.toString('base64url'), ...(config.factorKey ? { factorKey: config.factorKey.toString('base64url') } : {}) }), { flag: 'wx' });
  const seed = randomBytes(20), id = token(), password = 'Synthetic Ops password 2026!';
  await cluster.admin.query('INSERT INTO fw_ops.identities(id,email,password,seed) VALUES($1,$2,$3,$4)', [id, 'operator@ops.test', await hashPassword(password), seal(cluster.configs.ops.factorKey, seed.toString('base64url'), 'totp:' + id)]);
  await writeFile(resolve(cluster.dir, 'ops-fixture.json'), JSON.stringify({ seed: seed.toString('base64url') }), { flag: 'wx' });
  for (const profile of ['user','ops','ingestion','market','forecast','agent','retention']) launch(profile, ['src/runtime/main.ts'], backend, { FW_MODE: 'synthetic-local', FW_PROFILE: profile, FW_SECRET_FILE: resolve(cluster.dir, profile + '.json') });
  await ready('http://127.0.0.1:4310/health'); await ready('http://127.0.0.1:4311/health');
  launch('web', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1'], web, { VITE_DATA_MODE: 'backend', FINWEAVE_VITE_CACHE: '.local/vite-rc' });
  launch('admin', ['node_modules/vite/bin/vite.js', '--config', 'vite.admin.config.ts'], web, { VITE_ADMIN_DATA_MODE: 'backend', FINWEAVE_VITE_CACHE: '.local/vite-rc' });
  await ready('http://127.0.0.1:5173'); await ready('http://127.0.0.1:4183');
  const result = await promisify(execFile)(process.execPath, ['scripts/be19-check.cjs','integration'], { cwd: web, env, windowsHide: true, timeout: 900000, maxBuffer: 8 * 1024 * 1024 });
  console.log(result.stdout); receipt.status = 'PASS';
} catch (e) {
  if (e.stdout) console.log(e.stdout);
  throw Error('RC_BROWSER_REHEARSAL_FAILED');
} finally {
  for (const child of children) {
    if (child.exitCode === null) { const closed = new Promise(ok => child.once('exit', ok)); child.kill(); await closed; }
  }
  for (const stream of streams) stream.end();
  await cluster.stop(); receipt.clusterStopped = true; receipt.finishedAt = new Date().toISOString();
  const out = resolve(root, 'docs/execution/evidence/release-review'); await mkdir(out, { recursive: true });
  const path = resolve(out, 'browser-rehearsal-' + Date.now() + '.json'); await writeFile(path, JSON.stringify(receipt, null, 2));
  console.log('Rehearsal receipt: ' + path);
}
