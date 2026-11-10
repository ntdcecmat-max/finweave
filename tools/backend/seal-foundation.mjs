import assert from 'node:assert/strict';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=fileURLToPath(new URL('../../',import.meta.url));
const prefix='docs/execution/evidence/backend-foundation-2026-10-09';
const dir=resolve(root,prefix);
const read=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));
const sha=async p=>createHash('sha256').update(await readFile(resolve(root,p))).digest('hex');
const names=await readdir(dir);
const latest=pattern=>`${prefix}/${names.filter(n=>pattern.test(n)).sort().at(-1)}`;
const postgresPath=latest(/^postgres-.*\.json$/),checksPath=latest(/^checks-.*\.json$/);
const pg=await read(postgresPath),checks=await read(checksPath);
assert.equal(pg.status,'PASS');
assert.equal(pg.clusterStopped,true);
assert.equal(pg.sourceUnchangedDuringRun,true);
assert.equal(pg.server.server_version_num,'160014');
assert(checks.checks.every(c=>c.status==='PASS'));
for(const [path,hash] of Object.entries(pg.source)) assert.equal(await sha(path),hash,`tested-source-drift:${path}`);
for(const [path,hash] of Object.entries(checks.source)) assert.equal(await sha(path),hash,`checked-source-drift:${path}`);
const before=await read(`${prefix}/source-before.json`),after=await read(`${prefix}/source-after.json`);
const allowed=['README.md','docs/architecture/architecture-decision-agenda.md','docs/product/backend-backlog.md'];
const changed=Object.keys(before.files).filter(n=>before.files[n]!==after.files[n]);
assert.deepEqual(changed.sort(),allowed.sort());
assert.equal(after.summary.failedPins,0);
assert.deepEqual(after.missingTracked,before.missingTracked);
// Also compare actual bytes now, rather than only trusting the earlier after-inventory.
for(const [path,hash] of Object.entries(before.files)) if(!allowed.includes(path)) assert.equal(await sha(path),hash,`preservation:${path}`);
const backlog=await readFile(resolve(root,'docs/product/backend-backlog.md'),'utf8');
const packages=[...backlog.matchAll(/^\| (BE-\d{2}) \|/gm)].map(m=>m[1]);
assert.equal(packages.length,21);
// Current SRS inherits core AC through linked history; the complete current parent inventory is the coverage CSV.
const coverage=await readFile(resolve(root,'docs/product/backend-requirement-coverage.csv'),'utf8');
const acceptance=[...new Set([...coverage.matchAll(/^(AC-\d{2}),/gm)].map(m=>m[1]))].sort();
assert.equal(acceptance.length,41);
assert.deepEqual(acceptance,(await read('docs/operations/requirement-traceability.json')).parentAcceptance);
const ai=await readFile(resolve(root,'docs/product/ai-agent-specification.md'),'utf8');
const functions=[...new Set(ai.match(/AI-FR-\d{3}\b/g))].sort();
const qualities=[...new Set(ai.match(/AI-NFR-\d{3}\b/g))].sort();
assert.equal(functions.length,24);assert.equal(qualities.length,8);
const summary={
  task:'FW-BE-FOUNDATION-001',sealedAt:new Date().toISOString(),
  revision:await read('docs/data/local-foundation/revision.json'),
  checks:{
    evidence:checksPath,typecheck:'PASS',pins:'PASS',unitTests:29,inheritedGoldenVectors:23,
    fractionalOracleCombinationsInsideOneTest:81,scope:checks.scope
  },
  postgres:{evidence:postgresPath,serverLog:pg.serverLog,server:pg.server,runtime:pg.runtime,
    checks:pg.tests.length,pass:pg.tests.filter(t=>t.status==='PASS').length,
    expectedHistoricalDefectProbes:pg.tests.filter(t=>t.status==='KNOWN_DEFECT').length,
    sourceUnchangedDuringRun:true,clusterStopped:true,scope:pg.scope},
  preservation:{baselineFiles:Object.keys(before.files).length,currentBundlePins:after.summary.pins,
    allPinsMatch:true,changedPriorFiles:changed,missingTracked:before.missingTracked,
    frontendChanged:false,historicalEvidenceChanged:false,r1r2Changed:false,historicalMigrationsChanged:false},
  requiredScope:{packages:packages.map(id=>({id,required:true,status:'SPECIFIED_FULL_PACKAGE_NOT_COMPLETE'})),
    acceptance:acceptance.map(id=>({id,status:'NO_FULL_BACKEND_PARENT_ACCEPTANCE_CLAIM'})),
    aiFunctional:functions,aiNonFunctional:qualities},
  notRun:['Full DB005 migration/grants parity','Fastify business API and auth','J2 dispatch/workers',
    'Full Engine/domain/forecast','Full Agent/tools/model evaluation','Client adapter integration',
    'Native APK/device matrix','Independent backup/witness/restore/alerts','Whole-product UAT'],
  nextGate:'Foundation tested locally; continue D1 expand/auth/ledger service. Full DB005/grants/auth required before consumers/J2 integration. Real disabled.'
};
await writeFile(resolve(dir,'verification-summary.json'),JSON.stringify(summary,null,2)+'\n',{flag:'wx'});
const artifacts={};
async function collect(directory,pathPrefix) {
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    if(entry.name==='node_modules'||entry.name==='.local')continue;
    const name=`${pathPrefix}/${entry.name}`;
    if(entry.isDirectory())await collect(resolve(directory,entry.name),name);
    else if(entry.isFile()&&!name.endsWith('/artifact-manifest.json'))artifacts[name]=await sha(name);
  }
}
await collect(resolve(root,'finweave-backend'),'finweave-backend');
await collect(resolve(root,'docs/data/local-foundation'),'docs/data/local-foundation');
await collect(dir,prefix);
await collect(resolve(root,'tools/backend'),'tools/backend');
for(const name of [...allowed,'docs/execution/backend-foundation-2026-10-09.md',...Object.values(pg.pins).map(p=>p.path)])artifacts[name]=await sha(name);
const manifest={id:'FW-BE-FOUNDATION-ARTIFACTS-001',sealedAt:new Date().toISOString(),
  targetPins:pg.pins,sourceScope:'Exact tested backend code, new addendum/aggregate notices, test evidence and tooling; existing source inventory referenced separately.',
  artifacts,selfHashExcluded:true};
await writeFile(resolve(dir,'artifact-manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({summary:`${prefix}/verification-summary.json`,manifest:`${prefix}/artifact-manifest.json`,
  artifacts:Object.keys(artifacts).length,manifestSha256:await sha(`${prefix}/artifact-manifest.json`),
  postgres:{pass:summary.postgres.pass,probes:summary.postgres.expectedHistoricalDefectProbes},preservation:summary.preservation}));
