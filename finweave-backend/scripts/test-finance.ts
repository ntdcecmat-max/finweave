import { startCluster } from './runtime-cluster.ts';
import { runFinanceTests } from '../tests/finance.ts';
import { mkdir,readFile,writeFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from '../src/runtime/crypto.ts';
const python=process.env.FW_ORACLE_PYTHON??'C:/Users/ntdce/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const source:Record<string,string>={};
for(const dir of ['src/runtime','src/engine','database/runtime'])for(const file of await readdir(dir))source[dir+'/'+file]=sha(await readFile(dir+'/'+file));
for(const file of ['tests/finance.ts','tests/finance-oracle.py','scripts/test-finance.ts','scripts/runtime-cluster.ts','package.json','pnpm-lock.yaml','../docs/contracts/v2-t1-r5/openapi.json'])source[file]=sha(await readFile(file));
const evidence:any={scope:'EXECUTED_LOCAL_POSTGRES_BE03_BE04_BE06_MANUAL_MARKET_NO_PROVIDER_FEED',node:process.version,startedAt:new Date().toISOString(),source,status:'FAIL'};
let cluster:Awaited<ReturnType<typeof startCluster>>|undefined;
try {cluster=await startCluster('finance-test-'+Date.now());evidence.results=await runFinanceTests(cluster.admin,cluster.configs,python);evidence.status='PASS';}
catch(e){evidence.error={message:(e as Error).message,stack:(e as Error).stack};process.exitCode=1;console.error(e);}
finally {if(cluster){await cluster.stop();evidence.clusterStopped=true;}evidence.finishedAt=new Date().toISOString();const dir=resolve('../docs/execution/evidence/backend-finance-local-2026-10-09');await mkdir(dir,{recursive:true});const path=resolve(dir,'finance-'+Date.now()+'.json');await writeFile(path,JSON.stringify(evidence,null,2)+'\n',{flag:'wx'});console.log('Evidence: '+path);}
