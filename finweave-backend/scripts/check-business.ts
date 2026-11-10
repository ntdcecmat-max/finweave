import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir,readFile,writeFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha } from '../src/runtime/crypto.ts';
const checks:any[]=[],source:Record<string,string>={};
for(const dir of ['src/runtime','src/engine','database/runtime','tests'])for(const name of await readdir(dir)){const p=dir+'/'+name;if(!name.includes('.'))continue;source[p]=sha(await readFile(p));}
for(const p of ['package.json','pnpm-lock.yaml','tsconfig.json','scripts/check-business.ts'])source[p]=sha(await readFile(p));
for(const [id,args]of [['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],['pins',['scripts/verify-pins.ts']],['unit',['--test','--test-concurrency=1',...(await readdir('tests')).filter(n=>n.endsWith('.test.ts')).map(n=>'tests/'+n)]]] as [string,string[]][]){try{const r=await promisify(execFile)(process.execPath,args,{windowsHide:true,timeout:60000});checks.push({id,status:'PASS',stdout:r.stdout,stderr:r.stderr});}catch(e){const r=e as any;checks.push({id,status:'FAIL',stdout:r.stdout,stderr:r.stderr,error:r.message});process.exitCode=1;}}
const dir=resolve('../docs/execution/evidence/backend-business-local-2026-10-10');await mkdir(dir,{recursive:true});const path=resolve(dir,'checks-'+Date.now()+'.json');await writeFile(path,JSON.stringify({scope:'LOCAL_TYPECHECK_PINS_AND_EXECUTED_UNIT_BUSINESS',node:process.version,at:new Date().toISOString(),source,checks,status:checks.every(c=>c.status==='PASS')?'PASS':'FAIL'},null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path,checks:checks.map(c=>({id:c.id,status:c.status}))}));
