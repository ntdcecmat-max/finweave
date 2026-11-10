import { startCluster } from './runtime-cluster.ts';
import { runRuntimeTests } from '../tests/runtime.ts';
import { mkdir,readFile,writeFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from '../src/runtime/crypto.ts';
const cluster=await startCluster('runtime-test-'+Date.now());
const source:Record<string,string>={};
for(const name of await readdir('src/runtime'))source['src/runtime/'+name]=sha(await readFile('src/runtime/'+name));
for(const name of await readdir('database/runtime'))if(name.endsWith('.sql'))source['database/runtime/'+name]=sha(await readFile('database/runtime/'+name));
for(const name of ['database/runtime/001_runtime.sql','database/runtime/002_auth_payload_expiry.sql','database/runtime/003_ops_restore_gate.sql','database/runtime/004_job_device_fences.sql','pnpm-lock.yaml','package.json','tests/runtime.ts','scripts/test-runtime.ts','scripts/runtime-cluster.ts','scripts/provision-admin.ts','scripts/local-runtime.ts','scripts/smoke-local.ts','scripts/reproduce-runtime.ps1'])source[name]=sha(await readFile(name));
const evidence:Record<string,unknown>={scope:'SYNTHETIC_LOCAL_API005_AUTH_P2_J2_NOT_SEC_REAL_T1',node:process.version,startedAt:new Date().toISOString(),source,status:'FAIL'};
try {evidence.groups=await runRuntimeTests(cluster.admin,cluster.configs);evidence.status='PASS';console.log('API005/AUTH/P2/J2 synthetic runtime PASS');}
finally {
  await cluster.stop();evidence.clusterStopped=true;evidence.finishedAt=new Date().toISOString();
  const dir=resolve('../docs/execution/evidence/backend-auth-local-2026-10-09');await mkdir(dir,{recursive:true});
  const path=resolve(dir,'runtime-'+Date.now()+'.json');await writeFile(path,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log('Evidence: '+path);
}
