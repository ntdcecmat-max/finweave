import {writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {z} from '../../finweave-web/node_modules/zod/index.js';
import {operations} from '../../finweave-web/src/contracts/operations.ts';
import {identityOperations,identityExamples} from '../../finweave-web/src/contracts/identity.ts';
import {v2Operations} from '../../finweave-web/src/contracts/operational.ts';
import * as admin from '../../finweave-web/admin/contracts.ts';
import {NativeStatus} from '../../finweave-web/src/native/collector.ts';
import {allExamples} from '../../finweave-web/src/contracts/examples.ts';
const convert=(s:any)=>z.toJSONSchema(s,{target:'draft-2020-12',io:'input'});
const map=(ops:any)=>Object.fromEntries(Object.entries(ops).map(([name,o]:any)=>[name,{input:convert(o.input),output:convert(o.output),kind:o.kind??null,status:o.status??200,preview:o.preview??false,authorized:o.authorized??true}]));
// Require a new revision; historical evidence is immutable.
const out=process.env.FW_HANDOVER_EVIDENCE;
if(!out || !/^docs\/execution\/evidence\/FW-HANDOVER-\d{8}-r\d+$/.test(out))throw Error('Set FW_HANDOVER_EVIDENCE to a versioned evidence directory');
if(existsSync('docs/governance/baselines/'+out.split('/').pop()+'/manifest.json'))throw Error('Revision sealed; start a new revision');
mkdirSync(out,{recursive:true});
writeFileSync(out+'/observed-contracts.json',JSON.stringify({v1:map(operations),identity:map(identityOperations),v2:map(v2Operations),admin:Object.fromEntries(Object.entries(admin).filter(([,v]:any)=>v instanceof z.ZodType).map(([k,v])=>[k,convert(v)])),native:convert(NativeStatus),v1Examples:allExamples(),identityExamples},null,2)+'\n');
console.log(JSON.stringify({v1:Object.keys(operations).length,identity:Object.keys(identityOperations).length,v2:Object.keys(v2Operations).length}));
