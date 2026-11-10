import assert from 'node:assert/strict';
import { readFile,readdir,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { token } from '../src/runtime/crypto.ts';
import { contract,revision,validator } from '../src/runtime/contracts.ts';
const state=JSON.parse(await readFile('.local/runtime-state.json','utf8')),config=JSON.parse(await readFile(resolve(state.dir,'user.json'),'utf8'));
const run=Date.now(),email=`finance-demo-${run}@owner.test`,password='Synthetic finance demo 2026!';
let cookie='',csrf='',workspace:string|null=null,version=0;const versions:Record<string,number>={};
async function call(op:string,input:any,preview:string|null=null) {
 const body={contractVersion:'2.0.0',requestId:token(),operationId:op,workspaceId:workspace,input,mutation:contract.components.schemas[op+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:token(),expectedWorkspaceVersion:workspace?version:null,expectedObjectVersions:workspace?{...versions}:{},previewToken:preview}};
 const path=Object.entries(contract.paths).find(([,p]:any)=>p.post.operationId===op)![0],response=await fetch(config.origin+path,{method:'POST',headers:{'content-type':'application/json','x-fw-client':'web','x-fw-contract-revision':revision,origin:config.origin,...(cookie?{cookie,'x-fw-csrf':csrf}:{})},body:JSON.stringify(body)}),result:any=await response.json();assert.equal(response.status,200,JSON.stringify(result));assert(validator(op+'Reply')(result));
 if(op==='verifyIdentityChallenge'){const cookies=response.headers.getSetCookie();cookie=cookies.map(x=>x.split(';')[0]).join('; ');csrf=cookies.find(x=>x.startsWith('fw_test_csrf='))!.split(';')[0]!.split('=')[1]!;}
 const data=(result as any).data;if(workspace&&(result as any).workspaceVersion!==null)version=(result as any).workspaceVersion;
 if(data.objectVersions){if(op==='recordPriceQuote')versions[input.holdingId]=data.objectVersions[input.holdingId];else Object.assign(versions,data.objectVersions);}
 return data;
}
async function mutate(op:string,input:any) {const p=await call('previewMutation',{operationId:op,input,expectedWorkspaceVersion:version,expectedObjectVersions:{...versions}});return call(op,input,p.previewToken);}
const admin=new Pool({connectionString:state.adminUrl,max:2});
try {
 const registered=await call('registerIdentity',{email,name:'Local Finance Demo',password,passwordConfirmation:password,syntheticAcknowledgement:true,installationPublicKey:null});
 const mailDir=resolve(state.dir,'mail');let code:string|undefined;
 for(const f of await readdir(mailDir)){if(!f.endsWith('.json'))continue;const mail=JSON.parse(await readFile(resolve(mailDir,f),'utf8'));if(mail.email===email&&mail.challengeId===registered.challengeId)code=mail.code;}
 assert(code,'LOCAL_MAIL_CHALLENGE_MISSING');await call('verifyIdentityChallenge',{challengeId:registered.challengeId,code});
 workspace=(await call('createWorkspace',{trackingStart:'2026-10-01',currency:'VND',timezone:'Asia/Ho_Chi_Minh'})).id;
 const account=(await mutate('createAccount',{name:'Local demo cash',kind:'cash',opening:{value:'1000',currency:'VND'},openingDate:'2026-10-01'})).affectedIds[0];
 const base={accountId:account,date:'2026-10-09',description:'Local smoke',category:'demo',posting:'posted',reference:null};
 await mutate('createEvent',{...base,kind:'income',amount:{value:'100',currency:'VND'}});
 const expense=(await mutate('createEvent',{...base,kind:'expense',amount:{value:'40',currency:'VND'}})).affectedIds[0];
 await mutate('createEvent',{...base,kind:'refund',amount:{value:'10',currency:'VND'},originId:expense});
 const holding=(await mutate('createHolding',{name:'Local demo stock',kind:'stock',quantity:{value:'2',unit:'share'},quantityDate:'2026-10-01',market:'HOSE',product:null,purity:null,cost:null,costDate:null,catalogId:'manual-stock',profileConfirmedVersion:null})).affectedIds[0];
 await mutate('recordPriceQuote',{holdingId:holding,price:{value:'75',currency:'VND',per:'share'},at:'2026-10-09T00:00:00Z',sourceId:'manual-owner',fxVndPerUsd:null,fxAt:null,compatible:true});
 const a=await call('getAccount',{id:account}),h=await call('getHolding',{id:holding});assert.equal(a.balance.value.value,'1070');assert.equal(h.quantity.value,'2');assert.equal(h.valuation.value.value,'150');
 const evidence={status:'PASS',scope:'PERSISTENT_LOCAL_POSTGRES_REAL_TCP_API_SYNTHETIC_DEMO',finishedAt:new Date().toISOString(),origin:config.origin,revision,workspaceId:workspace,workspaceVersion:version,accountId:account,cash:a.balance.value,holdingId:holding,quantity:h.quantity,valuation:h.valuation.value,migrations:(await admin.query('SELECT id,checksum FROM fw_runtime_meta.migrations ORDER BY id')).rows,postgres:(await admin.query('SELECT version() AS version')).rows[0].version,sourceEvidence:'See test-finance source-hashed oracle/concurrency evidence'};
 await writeFile(resolve(state.dir,`finance-demo-${run}.json`),JSON.stringify({email,password,workspaceId:workspace},null,2)+'\n',{flag:'wx'});
 const dir=resolve('../docs/execution/evidence/backend-finance-local-2026-10-09');await mkdir(dir,{recursive:true});const file=resolve(dir,`local-smoke-${run}.json`);await writeFile(file,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({status:'PASS',origin:config.origin,workspaceId:workspace,cash:'1070',quantity:'2',valuation:'150',evidence:file}));
} finally {await admin.end();}
