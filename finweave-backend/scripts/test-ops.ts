import { startCluster } from './runtime-cluster.ts';
import { runOpsTests } from '../tests/ops.ts';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from '../src/runtime/crypto.ts';
const sources=['src/runtime/ops-business.ts','src/runtime/ops-contract.ts','src/runtime/ops.ts','src/runtime/app.ts','src/runtime/config.ts','src/runtime/uow.ts','src/runtime/main.ts','src/runtime/migrate.ts','database/runtime/010_ops_services.sql','tests/ops.ts','tests/ops-outcome.test.ts','scripts/test-ops.ts','scripts/runtime-cluster.ts','scripts/local-runtime.ts','scripts/build-ops-contract.ts','package.json','pnpm-lock.yaml','../docs/contracts/v2-t1-r5/openapi.json','../docs/contracts/local-ops/openapi.json','../docs/contracts/local-ops/catalogue-mapping.json'];
const evidence:any={scope:'BE16_SYNTHETIC_LOCAL_REAL_POSTGRES_ROLES_NOT_PRODUCTION_UAT',startedAt:new Date().toISOString(),status:'FAIL',source:{}};
for(const path of sources)evidence.source[path]=sha(await readFile(path));
let cluster:Awaited<ReturnType<typeof startCluster>>|undefined;
try {cluster=await startCluster('ops-test-'+Date.now());evidence.groups=await runOpsTests(cluster.admin,cluster.configs);evidence.status='PASS';}
finally {
 if(cluster){await cluster.stop();evidence.clusterStopped=true;}
 evidence.finishedAt=new Date().toISOString();const dir=resolve('../docs/execution/evidence/backend-ops-local-2026-10-11');await mkdir(dir,{recursive:true});const path=resolve(dir,'ops-'+Date.now()+'.json');await writeFile(path,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log('Evidence: '+path);
}
