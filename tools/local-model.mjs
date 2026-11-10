import {readFile,mkdir} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {spawn} from 'node:child_process';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const path=resolve(root,'.local/model-toolchain/finweave-model-manifest.json');
const {OllamaProvider,validateModelManifest}=await import('../finweave-backend/src/runtime/agent-provider.ts');
try{
 const manifest=JSON.parse(await readFile(path,'utf8'));validateModelManifest(manifest);
 let present=false;try{present=(await fetch('http://127.0.0.1:11434/api/version',{signal:AbortSignal.timeout(2000)})).ok;}catch{}
 if(present){await new OllamaProvider(manifest).preflight();console.log('Approved local model is ready. Open Start-FinWeave.cmd.');process.exit(0);}
 const logs=resolve(root,'.local/model-logs',String(Date.now()));await mkdir(logs,{recursive:true});
 const stream=createWriteStream(resolve(logs,'runtime.log'));
 const child=spawn(manifest.runtimeArtifact,['serve'],{cwd:root,windowsHide:true,env:{...process.env,OLLAMA_HOST:'127.0.0.1:11434',OLLAMA_MODELS:resolve(root,'.local/model-toolchain/ollama-models'),OLLAMA_NO_CLOUD:'true'},stdio:['ignore','pipe','pipe']});
 let launchFailed=false;child.once('error',()=>{launchFailed=true;});
 child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});
 console.log('Starting the pinned local model. No cloud model or download fallback is enabled.');
 const close=()=>child.kill();process.once('SIGINT',close);process.once('SIGTERM',close);
 let ready=false;
 for(let attempt=0;attempt<120&&child.exitCode===null&&!launchFailed;attempt++){
  try{if((await fetch('http://127.0.0.1:11434/api/version',{signal:AbortSignal.timeout(2000)})).ok){await new OllamaProvider(manifest).preflight();ready=true;break;}}catch{}
  await new Promise(ok=>setTimeout(ok,500));
 }
 if(!ready){child.kill();throw Error('MODEL_START_FAILED');}
 console.log('Approved local model ready. Keep this window open, then run Start-FinWeave.cmd.');
 await new Promise(ok=>child.once('exit',ok));stream.end();
}catch{console.error('Local model is unavailable or does not match its approved manifest. The financial app can still run with the deterministic Engine.');process.exitCode=1;}
