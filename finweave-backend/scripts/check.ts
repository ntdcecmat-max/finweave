import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sha256 } from '../src/pins.ts';

const runId = new Date().toISOString().replaceAll(/[:.]/g,'-');
const evidence = resolve(root,'docs/execution/evidence/backend-foundation-2026-10-09',`checks-${runId}.json`);
const result: { id: string; status: string; exitCode: number; stdout: string; stderr: string }[] = [];
for (const [id,args] of [
  ['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],
  ['pins',['scripts/verify-pins.ts']],
  ['unit',['--test','--test-concurrency=1','tests/exact.test.ts','tests/posting.test.ts']]
] as [string,string[]][]) {
  try {
    const r=await promisify(execFile)(process.execPath,args,{cwd:resolve(root,'finweave-backend'),windowsHide:true,timeout:30000});
    result.push({id,status:'PASS',exitCode:0,stdout:r.stdout,stderr:r.stderr});
  } catch(e) {
    const error=e as {code?:number;stdout?:string;stderr?:string};
    result.push({id,status:'FAIL',exitCode:error.code??1,stdout:error.stdout??'',stderr:error.stderr??''});
    process.exitCode=1;
  }
}
const source:Record<string,string>={};
for(const file of ['src/engine/exact.ts','src/engine/posting.ts','tests/exact.test.ts','tests/posting.test.ts','src/database/migrate.ts','src/pins.ts','tsconfig.json','pnpm-lock.yaml','scripts/check.ts']) {
  source[`finweave-backend/${file}`]=sha256(await readFile(resolve(root,'finweave-backend',file)));
}
await mkdir(resolve(evidence,'..'),{recursive:true});
await writeFile(evidence,JSON.stringify({runId,node:process.version,scope:'TYPECHECK_STATIC_PINS_AND_EXECUTED_KERNEL_UNIT_TESTS_NO_API_INTEGRATION',source,checks:result},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({evidence,checks:result.map(({id,status,exitCode})=>({id,status,exitCode}))}));
