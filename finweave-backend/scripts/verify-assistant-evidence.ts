import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sha} from '../src/runtime/crypto.ts';
import {contract,validator} from '../src/runtime/contracts.ts';
import {userOperations} from '../src/runtime/app.ts';
import {assistantOperations} from '../src/runtime/assistant.ts';

const dir=resolve('../docs/execution/evidence/backend-assistant-local-2026-10-11');
const names=(await readdir(dir)).filter(n=>/^assistant-\d+\.json$/.test(n)).sort();
const path=resolve(dir,names.at(-1)!);const e=JSON.parse(await readFile(path,'utf8'));
assert.equal(e.status,'PASS');assert.equal(e.clusterStopped,true);
const mismatches=[];
for(const [p,h] of Object.entries(e.source))if(sha(await readFile(p))!==h)mismatches.push(p);
assert.deepEqual(mismatches,[],'Assistant evidence is stale for current source');
const policy=JSON.parse(await readFile('../docs/contracts/local-assistant/runtime-policy.json','utf8'));
const bytes=await readFile('../docs/contracts/local-assistant/openapi.json');const api=JSON.parse(bytes.toString());
assert.equal(sha(bytes),policy.subsetSha256);
assert.equal(sha(await readFile('../docs/contracts/v2-t1-r5/openapi.json')),policy.baseSha256);
assert.equal(new Set(userOperations).size,userOperations.length);
assert.deepEqual(policy.operations,assistantOperations);
for(const op of assistantOperations){assert(userOperations.includes(op));assert(Object.values(api.paths).some((p:any)=>p.post.operationId===op));validator(op+'Request');validator(op+'Reply');}
for(const [name,schema] of Object.entries(api.components.schemas))assert.deepEqual(schema,contract.components.schemas[name]);
console.log(JSON.stringify({status:'PASS',evidence:path,groups:e.results.length,sourceHashes:Object.keys(e.source).length,operations:assistantOperations.length}));
