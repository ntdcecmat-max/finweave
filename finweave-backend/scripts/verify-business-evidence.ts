import assert from 'node:assert/strict';
import { readdir,readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from '../src/runtime/crypto.ts';
import { parseCSV } from '../src/runtime/imports.ts';
import { contract,validator } from '../src/runtime/contracts.ts';
import { userOperations } from '../src/runtime/app.ts';
const dir=resolve('../docs/execution/evidence/backend-business-local-2026-10-10'),names=(await readdir(dir)).filter(n=>/^business-\d+\.json$/.test(n)).sort(),path=resolve(dir,names.at(-1)!),e=JSON.parse(await readFile(path,'utf8'));assert.equal(e.status,'PASS');assert.equal(e.clusterStopped,true);const mismatches=[];for(const [p,h]of Object.entries(e.source)){if(sha(await readFile(p))!==h)mismatches.push(p);}assert.deepEqual(mismatches,[],'Latest business evidence does not describe current sources');
const policy=JSON.parse(await readFile('../docs/contracts/local-business/runtime-policy.json','utf8')),apiBytes=await readFile('../docs/contracts/local-business/openapi.json'),api=JSON.parse(apiBytes.toString());assert.equal(sha(apiBytes),policy.subsetSha256);assert.equal(sha(await readFile('../docs/contracts/v2-t1-r5/openapi.json')),policy.baseSha256);assert.equal(new Set(userOperations).size,userOperations.length);for(const op of policy.operations){assert(userOperations.includes(op));assert(Object.values(api.paths).some((p:any)=>p.post.operationId===op));validator(op+'Request');validator(op+'Reply');}
for(const [name,schema]of Object.entries(api.components.schemas))assert.deepEqual(schema,contract.components.schemas[name]);const rows=parseCSV(await readFile('../docs/execution/backend-business-ac41.csv','utf8'));assert.equal(rows.length,42);assert.deepEqual(rows.slice(1).map(r=>r[0]),Array.from({length:41},(_,n)=>'AC-'+String(n+1).padStart(2,'0')));
console.log(JSON.stringify({status:'PASS',evidence:path,groups:e.results.length,sourceHashes:Object.keys(e.source).length,operations:policy.operations.length,schemas:Object.keys(api.components.schemas).length,parentAC:41}));
