import { startCluster } from './runtime-cluster.ts';
import { runAsyncTests } from '../tests/async.ts';
import { mkdir,readFile,writeFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from '../src/runtime/crypto.ts';
const evidence:any={scope:'LOCAL_POSTGRES_BE07_BE08_BE17_NATIVE_SIMULATOR_PROVIDER_STUB',startedAt:new Date().toISOString(),node:process.version,status:'FAIL',source:{}};
for(const dir of ['src/runtime','database/runtime'])for(const f of await readdir(dir))if(/\.(ts|sql)$/.test(f))evidence.source[dir+'/'+f]=sha(await readFile(dir+'/'+f));
for(const f of ['tests/async.ts','scripts/test-async.ts','scripts/runtime-cluster.ts','pnpm-lock.yaml','../docs/contracts/v2-t1-r5/openapi.json'])evidence.source[f]=sha(await readFile(f));
let cluster:Awaited<ReturnType<typeof startCluster>>|undefined;
try {cluster=await startCluster('async-test-'+Date.now());evidence.results=await runAsyncTests(cluster.admin,cluster.configs,cluster.dir);evidence.status='PASS';}
catch(e){evidence.error={message:(e as Error).message,stack:(e as Error).stack};console.error(e);process.exitCode=1;}
finally {if(cluster){await cluster.stop();evidence.clusterStopped=true;}evidence.finishedAt=new Date().toISOString();const dir=resolve('../docs/execution/evidence/backend-async-local-2026-10-09');await mkdir(dir,{recursive:true});const file=resolve(dir,'async-'+Date.now()+'.json');await writeFile(file,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log('Evidence: '+file);}
