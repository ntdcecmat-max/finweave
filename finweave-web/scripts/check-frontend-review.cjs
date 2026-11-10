const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
process.chdir(path.resolve(__dirname,'..'));
const run=process.argv[2]||'final';if(!/^[a-z0-9-]+$/.test(run))throw Error('Invalid run');
const out=path.resolve('../docs/execution/evidence/frontend-review-2026-10-08',run);fs.mkdirSync(out,{recursive:true});
if(fs.existsSync(path.join(out,'checks.json')))throw Error('Evidence run already exists; choose a new run name');
const results=[];
const commands=[['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],['lint',['scripts/lint.cjs']],['unit',['node_modules/vitest/vitest.mjs','run','--maxWorkers=1','--pool=threads','--reporter=json','--outputFile='+path.join(out,'unit-results.json')]],['build-user',['node_modules/vite/bin/vite.js','build']],['build-admin',['node_modules/vite/bin/vite.js','build','--config','vite.admin.config.ts']],['source-contract-audit',['scripts/audit-frontend-review.cjs',run]]];
for(const[name,args]of commands){
 const start=new Date(),result=spawnSync(process.execPath,args,{encoding:'utf8',maxBuffer:40*1024*1024,timeout:600000,env:{...process.env,FINWEAVE_EVIDENCE_DIR:out,FINWEAVE_VITE_CACHE:'node_modules/.vite-review-check'}});
 fs.writeFileSync(path.join(out,name+'.log'),[process.execPath+' '+args.join(' '),result.stdout||'',result.stderr||'',result.error?.message||''].join('\n'));
 const status={name,command:args,startedAt:start.toISOString(),finishedAt:new Date().toISOString(),exitCode:result.status,error:result.error?.message||null};results.push(status);
 fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(status));
 if(result.status!==0)process.exitCode=1;
}
