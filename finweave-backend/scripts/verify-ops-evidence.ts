import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sha} from '../src/runtime/crypto.ts';
import {opsOperations} from '../src/runtime/app.ts';
const dir=resolve('../docs/execution/evidence/backend-ops-local-2026-10-11');
let evidence:any,path='';
for(const name of (await readdir(dir)).filter(n=>/^ops-\d+\.json$/.test(n)).sort().reverse()) {
 const candidate=JSON.parse(await readFile(resolve(dir,name),'utf8'));if(candidate.status==='PASS'){evidence=candidate;path=resolve(dir,name);break;}
}
assert(evidence,'No passing Ops evidence');assert.equal(evidence.clusterStopped,true);
for(const [file,hash] of Object.entries(evidence.source))assert.equal(sha(await readFile(file)),hash,'Stale evidence: '+file);
const mapping=JSON.parse(await readFile('../docs/contracts/local-ops/catalogue-mapping.json','utf8'));
assert.deepEqual([...new Set(mapping.catalogue.flatMap((x:any)=>x.operations))].sort(),[...opsOperations].sort());
assert.equal(mapping.catalogue.filter((x:any)=>x.screenId.startsWith('UI-ADM')).length,7);
assert.equal(mapping.contractSha256,sha(await readFile('../docs/contracts/local-ops/openapi.json')));
const result={status:'PASS',scope:evidence.scope,evidence:path,sourceHashes:Object.keys(evidence.source).length,operations:opsOperations.length,screens:7,groups:evidence.groups.length};
await writeFile(resolve(dir,'verification-'+Date.now()+'.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
