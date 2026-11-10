import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

// Audit only existing local synthetic test infrastructure. No remote provisioning.
const root = process.cwd(), run = promisify(execFile);
const out = resolve(root, 'docs/execution/evidence/release-review', new Date().toISOString().replaceAll(/[:.]/g, '-'));
await mkdir(out, { recursive: true });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function capture() {
  const { stdout } = await run('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  const source = {};
  for (const p of [...new Set(stdout.split('\0').filter(Boolean))].sort()) {
    try { source[p] = sha(await readFile(resolve(root, p))); }
    catch (e) { if (e.code !== 'ENOENT') throw e; source[p] = null; }
  }
  return source;
}
const before = await capture();
const receipt = { id: 'FW-RC-20261013-01', scope: 'LOCAL_SYNTHETIC_CHECKS_NOT_REAL_UAT_OR_STAGING_DEPLOY', startedAt: new Date().toISOString(), node: process.version, sourceDigest: sha(JSON.stringify(before)), source: before, checks: [], fullProductAccepted: false, stagingDeployed: false, realReleased: false };
const file = resolve(out, 'checks.json');
await writeFile(file, JSON.stringify(receipt, null, 2));
console.log('Evidence: ' + file);
const backend = resolve(root, 'finweave-backend'), web = resolve(root, 'finweave-web');
const backendTests = ['pins', 'typecheck', 'unit', 'db-foundation', 'db005', 'auth', 'finance', 'business', 'async', 'assistant', 'agent-evaluation', 'ops', 'operations', 'be19-contract'];
const backendCommands = {
  pins: ['scripts/verify-pins.ts'], typecheck: ['node_modules/typescript/bin/tsc', '--noEmit'],
  unit: ['--test', '--test-concurrency=1', ...Object.keys(before).filter(p => /^finweave-backend\/tests\/[^/]+\.test\.ts$/.test(p)).map(p => p.slice('finweave-backend/'.length))],
  'db-foundation': ['scripts/test-postgres.ts'], db005: ['scripts/test-db005.ts'],
  auth: ['scripts/test-runtime.ts'], finance: ['scripts/test-finance.ts'], business: ['scripts/test-business.ts'],
  async: ['scripts/test-async.ts'], assistant: ['scripts/test-assistant.ts'],
  'agent-evaluation': ['scripts/evaluate-agent.ts'], ops: ['scripts/test-ops.ts'],
  operations: ['scripts/test-operations.ts'], 'be19-contract': ['scripts/build-be19-contract.ts', '--check']
};
async function check(id, cwd, args, scope) {
  console.log('RUN ' + id);
  const row = { id, scope, args, startedAt: new Date().toISOString(), status: 'FAIL', log: id + '.log' };
  try {
    const r = await run(process.execPath, args, { cwd, windowsHide: true, timeout: 1800000, maxBuffer: 32 * 1024 * 1024 });
    await writeFile(resolve(out, row.log), r.stdout + r.stderr);
    row.status = 'PASS'; row.exitCode = 0;
  } catch (e) {
    await writeFile(resolve(out, row.log), (e.stdout ?? '') + (e.stderr ?? '') + '\n' + (e.code ?? 'PROCESS_ERROR'));
    row.exitCode = typeof e.code === 'number' ? e.code : null;
  }
  row.finishedAt = new Date().toISOString();
  row.logSha256 = sha(await readFile(resolve(out, row.log)));
  receipt.checks.push(row);
  await writeFile(file, JSON.stringify(receipt, null, 2));
  console.log(row.status + ' ' + id);
}
// These branches do not edit runtime source; their generated output directories differ.
await Promise.allSettled([
  (async () => { for (const id of backendTests) await check(id, backend, backendCommands[id], id === 'agent-evaluation' ? 'DETERMINISTIC_TYPED_EVALUATION_MODEL_NOT_RUN' : 'LOCAL_SYNTHETIC_BACKEND'); })(),
  (async () => { for (const id of ['typecheck', 'unit', 'build', 'mockbuild', 'mockbrowser', 'integration', 'android']) await check('web-' + id, id === 'integration' ? root : web, id === 'integration' ? ['tools/operations/rc-browser-fixture.mjs'] : ['scripts/be19-check.cjs', id], id === 'integration' ? 'REAL_HTTP_PG_SYNTHETIC_BROWSER_SUBSET' : id === 'android' ? 'BUILD_JVM_NO_DEVICE' : 'BUILD_OR_SYNTHETIC_REGRESSION'); })()
]).then(results => { for (const r of results) if (r.status === 'rejected') throw r.reason; });
const after = await capture();
receipt.sourceUnchanged = JSON.stringify(before) === JSON.stringify(after);
receipt.changedPaths = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(p => before[p] !== after[p]);
receipt.finishedAt = new Date().toISOString();
receipt.status = !receipt.sourceUnchanged ? 'SOURCE_DRIFT' : receipt.checks.every(c => c.status === 'PASS') ? 'LOCAL_CHECKS_PASS_REAL_CLOSED' : 'CHECK_FAILURE';
await writeFile(file, JSON.stringify(receipt, null, 2));
console.log(JSON.stringify({ status: receipt.status, file, checks: receipt.checks.map(({ id, status }) => ({ id, status })), changedPaths: receipt.changedPaths }));
if (receipt.status !== 'LOCAL_CHECKS_PASS_REAL_CLOSED') process.exitCode = 1;
