import assert from 'node:assert/strict';
import { readFile,readdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha,jcs } from '../src/runtime/crypto.ts';
const dir=resolve('../docs/execution/evidence/backend-async-local-2026-10-09');
const names=(await readdir(dir)).filter(x=>/^async-\d+\.json$/.test(x)).sort().reverse();
let evidence:any,name='';
for(const file of names){const record=JSON.parse(await readFile(resolve(dir,file),'utf8'));if(record.status==='PASS'){evidence=record;name=file;break;}}
assert(evidence,'ASYNC_PASS_REQUIRED');
for(const [file,hash] of Object.entries(evidence.source))assert.equal(sha(await readFile(resolve(file))),hash,'SOURCE_DRIFT:'+file);
const baseline=JSON.parse(await readFile('../docs/execution/evidence/backend-async-observation/latest.json','utf8'));
assert.equal(baseline.source?.['database/runtime/006_async_sources.sql']??baseline.sourceHash,sha(await readFile('database/runtime/006_async_sources.sql')),'OBSERVATION_MIGRATION_DRIFT');
if(baseline.source){for(const [file,hash] of Object.entries(baseline.source))assert.equal(sha(await readFile(resolve(file))),hash,'OBSERVATION_SOURCE_DRIFT:'+file);assert.equal(baseline.sourceHash,sha(jcs(baseline.source)),'OBSERVATION_SOURCE_IDENTITY_INVALID');}
const audit={status:'PASS',scope:'CURRENT_LOCAL_ASYNC_SOURCE_HASHES_AND_REAL_TIME_BASELINE',verifiedAt:new Date().toISOString(),asyncEvidence:name,sourceHashesVerified:Object.keys(evidence.source).length,groups:evidence.results.groups.length,observationStartedAt:baseline.startedAt,sevenDayObservation:baseline.sevenDayObservation,toolHash:sha(await readFile('scripts/verify-async-evidence.ts'))};
const output=resolve(dir,'source-audit-'+Date.now()+'.json');await writeFile(output,JSON.stringify(audit,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(audit));
