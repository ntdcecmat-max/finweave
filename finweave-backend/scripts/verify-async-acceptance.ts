import assert from 'node:assert/strict';
import { readFile,readdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root,sha256,verifyPins } from '../src/pins.ts';
const records:Record<string,unknown>={};
for(const [label,folder,prefix] of [
 ['async','backend-async-local-2026-10-09','async-'],
 ['auth','backend-auth-local-2026-10-09','runtime-'],
 ['finance','backend-finance-local-2026-10-09','finance-'],
] as const) {
 const dir=resolve(root,'docs/execution/evidence',folder);
 const names=(await readdir(dir)).filter(n=>new RegExp('^'+prefix+'\\d+\\.json$').test(n)).sort().reverse();
 let record:any,file='';
 for(const name of names){const candidate=JSON.parse(await readFile(resolve(dir,name),'utf8'));if(candidate.status==='PASS'){record=candidate;file=name;break;}}
 assert(record,label+'_PASS_REQUIRED');
 for(const [path,hash] of Object.entries(record.source))assert.equal(sha256(await readFile(resolve(path))),hash,'SOURCE_DRIFT:'+path);
 records[label]={file:folder+'/'+file,sha256:sha256(await readFile(resolve(dir,file))),groups:record.results?.groups?.length??record.groups?.length,sourceHashesVerified:Object.keys(record.source).length,clusterStopped:record.clusterStopped};
 assert.equal(record.clusterStopped,true);
}
const foundation=resolve(root,'docs/execution/evidence/backend-foundation-2026-10-09');
const checkNames=(await readdir(foundation)).filter(n=>/^checks-.*\.json$/.test(n)).sort().reverse();
const checkFile=checkNames[0],checks=JSON.parse(await readFile(resolve(foundation,checkFile),'utf8'));
assert(checks.checks.every((c:any)=>c.status==='PASS'&&c.exitCode===0),'FINAL_CHECKS_FAILED');
for(const [path,hash] of Object.entries(checks.source))assert.equal(sha256(await readFile(resolve(root,path))),hash,'CHECK_SOURCE_DRIFT:'+path);
await verifyPins();
const baseline=JSON.parse(await readFile(resolve(root,'docs/execution/evidence/backend-async-observation/latest.json'),'utf8'));
assert.equal(baseline.source?.['database/runtime/006_async_sources.sql']??baseline.sourceHash,sha256(await readFile('database/runtime/006_async_sources.sql')),'OBSERVATION_MIGRATION_DRIFT');
if(baseline.source)for(const [path,hash] of Object.entries(baseline.source))assert.equal(sha256(await readFile(resolve(path))),hash,'OBSERVATION_SOURCE_DRIFT:'+path);
assert(baseline.services?.ingestion?.healthy&&baseline.services?.market?.healthy,'OBSERVATION_WORKERS_NOT_HEALTHY');
const operationalHashes:Record<string,string>={};
for(const file of ['scripts/setup-async-observation.ts','scripts/resume-async-observation.ts','scripts/start-async-observation.ps1','scripts/check-async-observation.ts','scripts/observe-async.ts','scripts/verify-async-acceptance.ts','ASYNC.md','../docs/execution/backend-async-local-2026-10-10.md','../docs/execution/backend-async-recovery-2026-10-13.md'])operationalHashes[file]=sha256(await readFile(file));
const output={status:'PASS_LOCAL_ASYNC_PIPELINES',verifiedAt:new Date().toISOString(),records,foundation:{file:checkFile,sha256:sha256(await readFile(resolve(foundation,checkFile))),checks:checks.checks.map((c:any)=>({id:c.id,status:c.status}))},observation:{startedAt:baseline.startedAt,sampledAt:baseline.sampledAt,elapsedDays:baseline.elapsedDays,observedDays:baseline.observedDays,sevenDayObservation:baseline.sevenDayObservation,services:baseline.services},operationalHashes};
const out=resolve(root,'docs/execution/evidence/backend-async-local-2026-10-09'),unique=resolve(out,'acceptance-'+Date.now()+'.json');
await writeFile(unique,JSON.stringify(output,null,2)+'\n',{flag:'wx'});
await writeFile(resolve(out,'acceptance-latest.json'),JSON.stringify({...output,immutableEvidence:unique},null,2)+'\n');
console.log(JSON.stringify({status:output.status,evidence:unique,sevenDayObservation:baseline.sevenDayObservation}));
