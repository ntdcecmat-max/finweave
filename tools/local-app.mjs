import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdir } from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),backend=resolve(root,'finweave-backend'),web=resolve(root,'finweave-web');
const run=promisify(execFile),children=[],streams=[],logs=resolve(root,'.local/app-logs',String(Date.now()));
const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('FW_')&&key!=='FINWEAVE_TEST_RUNTIME_STATE'));
const cli=args=>run(process.execPath,args,{cwd:backend,env,windowsHide:true,timeout:120000,maxBuffer:1024*1024});
let startedDatabase=false,stopping=false;
async function stop(){
 if(stopping)return;stopping=true;
 for(const child of children.reverse())if(child.exitCode===null){const closed=new Promise(ok=>child.once('exit',ok));child.kill();await closed;}
 for(const stream of streams)stream.end();
 if(startedDatabase)await cli(['scripts/local-runtime.ts','stop']).catch(()=>{});
}
function launch(name,args,cwd,extra={}){
 const child=spawn(process.execPath,args,{cwd,env:{...env,...extra},windowsHide:true,stdio:['ignore','pipe','pipe']});
 const stream=createWriteStream(resolve(logs,name+'.log'));streams.push(stream);children.push(child);
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 child.once('error',()=>{});return child;
}
async function ready(url){
 const deadline=Date.now()+120000;
 while(Date.now()<deadline){
  if(children.some(c=>c.exitCode!==null))throw Error('LOCAL_SERVICE_EXITED');
  try{if((await fetch(url,{signal:AbortSignal.timeout(2000)})).ok)return;}catch{}
  await new Promise(ok=>setTimeout(ok,250));
 }
 throw Error('LOCAL_SERVICE_NOT_READY');
}
try{
 await mkdir(logs,{recursive:true});
 for(const port of [4310,4311,5173,4183]){
  const probe=createServer();await new Promise((ok,fail)=>{probe.once('error',fail);probe.listen(port,'127.0.0.1',ok);});await new Promise(ok=>probe.close(ok));
 }
 const statePath=resolve(backend,'.local/runtime-state.json');
 try{await readFile(statePath);}catch(e){if(e.code!=='ENOENT')throw e;await cli(['scripts/local-runtime.ts','init']);startedDatabase=true;}
 const state=JSON.parse(await readFile(statePath,'utf8'));
 const {Pool}=createRequire(resolve(backend,'package.json'))('pg');
 const pool=new Pool({connectionString:state.adminUrl,connectionTimeoutMillis:2000});
 try{await pool.query('SELECT 1');}catch{await cli(['scripts/local-runtime.ts','start']);startedDatabase=true;}finally{await pool.end();}
 let modelManifest=null;
 try{const path=resolve(root,'.local/model-toolchain/finweave-model-manifest.json'),manifest=JSON.parse(await readFile(path,'utf8'));const service=await fetch('http://127.0.0.1:11434/api/version',{signal:AbortSignal.timeout(2000)});if(service.ok&&(await service.json()).version===manifest.runtimeVersion)modelManifest=path;}catch{}
 for(const profile of ['user','ops','ingestion','market','forecast','agent','retention'])launch(profile,['src/runtime/main.ts'],backend,{FW_MODE:'synthetic-local',FW_PROFILE:profile,FW_SECRET_FILE:resolve(state.dir,profile+'.json'),...(profile==='agent'&&modelManifest?{FW_MODEL_MANIFEST:modelManifest}:{})});
 await ready('http://127.0.0.1:4310/health');await ready('http://127.0.0.1:4311/health');
 launch('web',['node_modules/vite/bin/vite.js','--host','127.0.0.1'],web,{VITE_DATA_MODE:'backend',FINWEAVE_VITE_CACHE:'.local/vite-app'});
 launch('admin',['node_modules/vite/bin/vite.js','--config','vite.admin.config.ts'],web,{VITE_ADMIN_DATA_MODE:'backend',FINWEAVE_VITE_CACHE:'.local/vite-app'});
 await ready('http://127.0.0.1:5173');await ready('http://127.0.0.1:4183');
 console.log('FinWeave local: http://127.0.0.1:5173');console.log('Admin: http://127.0.0.1:4183');
 console.log('Synthetic-local only. Existing data is preserved. Press Ctrl+C to stop services started here.');console.log('Private logs: '+logs);
 console.log(modelManifest?'Agent: local model requested; worker verifies artifact pins before inference.':'Agent: deterministic Engine; no approved local model service connected.');
 if(process.argv.includes('--smoke')){console.log('PASS local backend, user and admin readiness');await stop();}
 else await new Promise((ok,fail)=>{
  process.once('SIGINT',()=>stop().then(ok));process.once('SIGTERM',()=>stop().then(ok));
  for(const child of children)child.once('exit',()=>{if(!stopping)fail(Error('LOCAL_SERVICE_EXITED'));});
 });
}catch(error){console.error(error.code==='EADDRINUSE'?'A required local port is occupied. Preserve the other runtime; stop it before launching this app.':'Local startup failed. Inspect private logs: '+logs);process.exitCode=1;await stop();}
