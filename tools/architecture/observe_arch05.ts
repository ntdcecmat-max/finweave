// Read-only contract observation; no runtime UI or server imports.
import {writeFileSync} from 'node:fs';
import {z} from '../../finweave-web/node_modules/zod/index.js';
import {operations} from '../../finweave-web/src/contracts/operations.ts';
import {identityOperations} from '../../finweave-web/src/contracts/identity.ts';
import {v2Operations} from '../../finweave-web/src/contracts/operational.ts';
import * as admin from '../../finweave-web/admin/contracts.ts';
import {NativeStatus} from '../../finweave-web/src/native/collector.ts';
const convert=(s:any)=>z.toJSONSchema(s,{target:'draft-2020-12',io:'input'});
const map=(ops:any)=>Object.fromEntries(Object.entries(ops).map(([name,o]:any)=>[name,{input:convert(o.input),output:convert(o.output)}]));
writeFileSync('docs/execution/evidence/arch-05-t1-2026-10-08/observed-contracts.json',JSON.stringify({v1:map(operations),identity:map(identityOperations),v2:map(v2Operations),admin:Object.fromEntries(Object.entries(admin).filter(([,v]:any)=>v instanceof z.ZodType).map(([k,v])=>[k,convert(v)])),native:convert(NativeStatus)},null,2)+'\n');
