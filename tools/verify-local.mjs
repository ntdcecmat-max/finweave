import { spawn } from 'node:child_process';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'docs/execution/evidence/completion-2026-11-03', String(Date.now()));
await mkdir(output, { recursive: true });
const temp = resolve(root, '.local/check-temp');await mkdir(temp, { recursive: true });
const checks = [
  ['backend-types', 'finweave-backend', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['backend-unit', 'finweave-backend', ['--test', '--test-concurrency=1', '--test-reporter=spec', 'tests/*.test.ts']],
  ['frontend-types', 'finweave-web', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['frontend-unit', 'finweave-web', ['node_modules/vitest/vitest.mjs', 'run', '--maxWorkers=1', '--pool=threads']],
  ['frontend-build', 'finweave-web', ['node_modules/vite/bin/vite.js', 'build']],
  ['admin-build', 'finweave-web', ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.admin.config.ts']],
  ['market-unit', 'sites/finweave-demo', ['--test', 'scripts/market.test.ts']],
  ['market-pipeline', 'sites/finweave-demo', ['scripts/check-market-pipeline.mjs']],
];
const inputs = ['finweave-backend/package.json', 'finweave-backend/pnpm-lock.yaml', 'finweave-web/package.json', 'finweave-web/pnpm-lock.yaml', 'finweave-web/.npmrc', 'sites/finweave-demo/package.json', 'sites/finweave-demo/pnpm-lock.yaml', 'tools/verify-local.mjs'];
async function capture() { return Object.fromEntries(await Promise.all(inputs.map(async p => [p, createHash('sha256').update(await readFile(resolve(root, p))).digest('hex')]))); }
const before = await capture();
const receipt = { scope: 'LOCAL_BUILD_AND_UNIT_CHECKS_NOT_DEVICE_PROVIDER_MODEL_OR_PRODUCTION_UAT', startedAt: new Date().toISOString(), node: process.version, checks: [], source: before, status: 'RUNNING' };
for (const [name, folder, args] of checks) {
  const startedAt = new Date().toISOString(); let log = '';
  const result = await new Promise(ok => {
    const child = spawn(process.execPath, args, { cwd: resolve(root, folder), env: { ...process.env, TEMP: temp, TMP: temp }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const timer = setTimeout(() => { child.kill(); }, 300000);
    for (const stream of [child.stdout, child.stderr]) stream.on('data', b => { log += b.toString(); });
    child.once('error', e => { log += e.message; });
    child.once('close', (code, signal) => { clearTimeout(timer); ok({ code, signal }); });
  });
  await writeFile(resolve(output, name + '.log'), log, { flag: 'wx' });
  receipt.checks.push({ name, startedAt, finishedAt: new Date().toISOString(), exitCode: result.code, signal: result.signal, status: result.code === 0 ? 'PASS' : 'FAIL', log: name + '.log' });
  console.log(name + ': ' + receipt.checks.at(-1).status);
}
receipt.inputsUnchanged = JSON.stringify(before) === JSON.stringify(await capture());
receipt.status = !receipt.inputsUnchanged ? 'SOURCE_DRIFT' : receipt.checks.every(c => c.status === 'PASS') ? 'PASS_LOCAL_CHECKED_SCOPE' : 'FAIL';
receipt.finishedAt = new Date().toISOString();
await writeFile(resolve(output, 'results.json'), JSON.stringify(receipt, null, 2), { flag: 'wx' });
console.log(JSON.stringify({ status: receipt.status, results: resolve(output, 'results.json') }));
if (receipt.status !== 'PASS_LOCAL_CHECKED_SCOPE') process.exitCode = 1;
