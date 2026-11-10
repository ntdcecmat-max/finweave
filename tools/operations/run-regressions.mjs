import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const run=promisify(execFile),backend=resolve('finweave-backend'),out=resolve('docs/execution/evidence/backend-operations-2026-10-12');await mkdir(out,{recursive:true});
const startedAt=new Date().toISOString(),checks=[];
for(const [id,args] of [
  ['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],
  ['unit',['--test','--test-concurrency=1','tests/operations-release.test.ts','tests/ops-outcome.test.ts','tests/agent-runtime.test.ts']],
  ['auth-recovery',['scripts/test-runtime.ts']],
  ['ops-isolation',['scripts/test-ops.ts']],
  ['async-j2',['scripts/test-async.ts']],
  ['assistant',['scripts/test-assistant.ts']],
  ['db-foundation',['scripts/test-postgres.ts']],
  ['db005-upgrade',['scripts/test-db005.ts']]
]) {
  const start=new Date().toISOString();console.log('Running '+id);
  try {const r=await run(process.execPath,args,{cwd:backend,windowsHide:true,timeout:300000,maxBuffer:8*1024*1024});await writeFile(resolve(out,id+'.log'),r.stdout+r.stderr);checks.push({id,status:'PASS',startedAt:start,finishedAt:new Date().toISOString(),log:resolve(out,id+'.log')});console.log('PASS '+id);}
  catch(e){await writeFile(resolve(out,id+'.log'),(e.stdout??'')+(e.stderr??''));checks.push({id,status:'FAIL',startedAt:start,finishedAt:new Date().toISOString(),log:resolve(out,id+'.log')});process.exitCode=1;console.log('FAIL '+id);}
}
await writeFile(resolve(out,'regressions-'+Date.now()+'.json'),JSON.stringify({scope:'EXECUTED_SYNTHETIC_REGRESSIONS_NOT_FULL_ACCEPTANCE',startedAt,finishedAt:new Date().toISOString(),checks},null,2));
