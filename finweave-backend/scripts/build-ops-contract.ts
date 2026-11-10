import assert from 'node:assert/strict';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {contract,revision} from '../src/runtime/contracts.ts';
import {opsOperations} from '../src/runtime/app.ts';
import {opsRevision} from '../src/runtime/ops-contract.ts';
import {sha} from '../src/runtime/crypto.ts';
const catalogue=[
 {screenId:'ADMIN-AUTH',route:'/admin',actions:['signIn','signOut','reauthenticate'],operations:['adminSignIn','adminSignOut','adminReauthenticate'],service:'src/runtime/ops.ts'},
 {screenId:'UI-ADM-01',route:'/admin/overview',actions:['snapshot','refresh','retry failed job'],operations:['opsStatus','opsPreviewAction','opsConfirmAction','opsGetCommandOutcome'],service:'src/runtime/ops-business.ts'},
 {screenId:'UI-ADM-02',route:'/admin/accounts',actions:['list','exact opaque account/workspace search','device metadata'],operations:['opsStatus','opsListAccounts'],service:'src/runtime/ops-business.ts'},
 {screenId:'UI-ADM-03',route:'/admin/sources',actions:['list','filter','disable with reason/preview/confirm'],operations:['opsStatus','opsListSources','opsPreviewAction','opsConfirmAction','opsGetCommandOutcome'],service:'src/runtime/ops-business.ts'},
 {screenId:'UI-ADM-04',route:'/admin/jobs',actions:['list','filter','metadata detail','bounded retry'],operations:['opsStatus','opsListJobs','opsPreviewAction','opsConfirmAction','opsGetCommandOutcome'],service:'src/runtime/ops-business.ts'},
 {screenId:'UI-ADM-05',route:'/admin/quotas',actions:['read usage/limit/reset/cooldown'],operations:['opsStatus','opsListQuotas'],service:'src/runtime/ops-business.ts'},
 {screenId:'UI-ADM-06',route:'/admin/releases',actions:['read published verified artifact metadata'],operations:['opsStatus','opsListReleases'],service:'src/runtime/ops-business.ts'},
 {screenId:'UI-ADM-07',route:'/admin/incidents',actions:['read incidents','read append-only audit and control disposition'],operations:['opsStatus','opsListIncidents','opsListAudit','opsGetCommandOutcome'],service:'src/runtime/ops-business.ts'},
];
const sourceCatalogue=await readFile('../finweave-web/src/contracts/surface-catalogue.ts','utf8');
const declared=[...sourceCatalogue.matchAll(/"id": "(UI-ADM-\d+)"/g)].map(m=>m[1]);
assert.deepEqual(catalogue.filter(x=>x.screenId.startsWith('UI-ADM')).map(x=>x.screenId).sort(),declared.sort());
assert.deepEqual([...new Set(catalogue.flatMap(x=>x.operations))].sort(),[...opsOperations].sort());
const paths=structuredClone(Object.fromEntries(Object.entries(contract.paths).filter(([,p]:any)=>opsOperations.includes(p.post.operationId))));
for(const p of Object.values(paths) as any[]) {
 p.post['x-finweave']={...p.post['x-finweave'],availability:'SYNTHETIC_LOCAL_POSTGRES',opsRevision};
 if(p.post.operationId==='opsConfirmAction') {p.post.responses['202']={...p.post.responses['200'],description:'Durable control request committed; private effect awaits broker disposition'};delete p.post.responses['200'];}
}
const needed=new Set<string>();
function collect(value:any){for(const m of JSON.stringify(value).matchAll(/#\/components\/schemas\/([A-Za-z0-9]+)/g))if(!needed.has(m[1]!)){needed.add(m[1]!);collect(contract.components.schemas[m[1]!]);}}
collect(paths);
const subset={...contract,info:{...contract.info,title:'FinWeave local Ops API',description:'BE-16 real PostgreSQL services in synthetic-local mode. Frontend integration and production UAT are separate.'},paths,components:{...contract.components,schemas:Object.fromEntries([...needed].sort().map(n=>[n,contract.components.schemas[n]]))},'x-ops-revision':opsRevision};
const dir=resolve('../docs/contracts/local-ops');await mkdir(dir,{recursive:true});
const bytes=JSON.stringify(subset,null,2)+'\n';await writeFile(resolve(dir,'openapi.json'),bytes);
await writeFile(resolve(dir,'catalogue-mapping.json'),JSON.stringify({revision:opsRevision,baseRevision:revision,baseSha256:sha(await readFile('../docs/contracts/v2-t1-r5/openapi.json')),contractSha256:sha(bytes),frontendChanged:false,frontendIntegration:'BE19_PENDING',catalogue,denied:['finance','private prompts/evidence','owner impersonation/reset','credentials','force success','quota increase/provider purchase','deploy','migrate','restore','prune','root'],databaseProfiles:{auth:'fw_runtime_ops',metadata:'fw_runtime_ops_business',broker:['fw_runtime_ingestion','fw_runtime_market']},reasonCodes:contract.components.schemas.opsPreviewActionInput.properties.reason.enum,tests:['tests/ops.ts','tests/ops-outcome.test.ts'],migration:'database/runtime/010_ops_services.sql'},null,2)+'\n');
console.log(JSON.stringify({revision:opsRevision,operations:opsOperations.length,screens:declared.length,path:dir}));
