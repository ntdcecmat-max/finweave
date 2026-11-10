import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const output = resolve(root, process.argv[2] ?? 'docs/execution/evidence/backend-foundation-2026-10-09/source-before.json');
const hash = async p => {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(p)) digest.update(chunk);
  return digest.digest('hex');
};
const files = {};
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const absolute = resolve(dir, entry.name);
    const path = relative(root, absolute).replaceAll('\\', '/');
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || path === 'finweave-backend/.local') continue;
      await walk(absolute);
    } else if (entry.isFile() && absolute !== output && path !== 'tools/backend/audit-source.mjs') {
      files[path] = await hash(absolute);
    }
  }
}
await walk(root);
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const status = git('status', '--porcelain=v1', '-z', '--untracked-files=all').split('\0').filter(Boolean);
const tracked = git('ls-files', '-z').split('\0').filter(Boolean);
const missingTracked = tracked.filter(path => !(path in files));
const bundles = [];
for (const path of Object.keys(files).filter(p => p.endsWith('/implementation-bundle.json') && !p.includes('/baselines/'))) {
  const bundle = JSON.parse(await readFile(resolve(root, path), 'utf8'));
  for (const [name, pin] of Object.entries(bundle.files ?? {})) {
    if (!pin.path || !pin.sha256) continue;
    const actual = files[pin.path] ?? null;
    bundles.push({ bundle: path, name, path: pin.path, expected: pin.sha256, actual, pass: actual === pin.sha256 });
  }
}
await mkdir(resolve(output, '..'), { recursive: true });
await writeFile(output, JSON.stringify({
  capturedAt: new Date().toISOString(), root, head: git('rev-parse', 'HEAD').trim(),
  scope: 'Actual bytes incl. tracked, untracked, ignored historical artifacts; Git deletions retained. Excludes .git, node_modules, new local runtime and this bootstrap scanner.',
  status, missingTracked, files, bundles,
  summary: { files: Object.keys(files).length, tracked: tracked.length, statusEntries: status.length, missingTracked: missingTracked.length,
    pins: bundles.length, failedPins: bundles.filter(p => !p.pass).length }
}, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, files: Object.keys(files).length, missingTracked, pins: bundles.length, failedPins: bundles.filter(p => !p.pass) }));
