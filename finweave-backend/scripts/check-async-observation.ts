import { readFile,readdir } from 'node:fs/promises';
import { resolve,relative,isAbsolute } from 'node:path';
import { Pool } from 'pg';
import { sha,jcs } from '../src/runtime/crypto.ts';
import { loadConfig } from '../src/runtime/config.ts';
import type { Config } from '../src/runtime/config.ts';
import { checkObservationCompatibility } from '../src/runtime/async-observation-readiness.ts';
async function check() {
 const state=JSON.parse(await readFile(resolve('.local/async-observation-state.json'),'utf8'));
 const local=resolve('.local'),dir=resolve(state.dir),rel=relative(local,dir),clusterRel=relative(dir,resolve(state.cluster));
 const url=new URL(state.adminUrl);
 if(!rel||rel.startsWith('..')||isAbsolute(rel)||!clusterRel||clusterRel.startsWith('..')||isAbsolute(clusterRel)||url.hostname!=='127.0.0.1'||url.pathname!=='/postgres'||!Number.isFinite(Date.parse(state.startedAt)))throw Error('OBSERVATION_TARGET_INVALID');
 const expected:Record<string,string>={};
 for(const file of await readdir('database/runtime'))if(/^\d{3}_.*\.sql$/.test(file))expected[file.slice(0,3)]=sha(await readFile(resolve('database/runtime',file)));
 const configs:Config[]=[];
 const saved={profile:process.env.FW_PROFILE,mode:process.env.FW_MODE,secret:process.env.FW_SECRET_FILE};
 try {
  for(const profile of ['ingestion','market']) {
   process.env.FW_PROFILE=profile;process.env.FW_MODE='synthetic-local';process.env.FW_SECRET_FILE=resolve(dir,profile+'.json');
   const config=await loadConfig(),workerUrl=new URL(config.databaseUrl);
   if(workerUrl.hostname!==url.hostname||workerUrl.port!==url.port||workerUrl.pathname!==url.pathname)throw Error('OBSERVATION_DATABASE_MISMATCH');
   configs.push(config);
  }
 }finally {
  for(const [key,value] of Object.entries({FW_PROFILE:saved.profile,FW_MODE:saved.mode,FW_SECRET_FILE:saved.secret}))if(value===undefined)delete process.env[key];else process.env[key]=value;
 }
 const admin=new Pool({connectionString:state.adminUrl,max:1,connectionTimeoutMillis:5000});
 try {
  const compatible=await checkObservationCompatibility(admin,configs,expected);
  const source:Record<string,string>={};
  for(const folder of ['src/runtime','src/engine','database/runtime'])for(const file of await readdir(folder))if(/\.(ts|sql|conf|json)$/.test(file))source[folder+'/'+file]=sha(await readFile(resolve(folder,file)));
  for(const file of ['pnpm-lock.yaml','../docs/contracts/v2-t1-r5/openapi.json'])source[file]=sha(await readFile(file));
  const running=Object.fromEntries((await admin.query("SELECT profile,count(*)::integer AS n FROM fw_dispatch.jobs WHERE state='running' AND profile IN('ingestion','market') GROUP BY profile")).rows.map(r=>[r.profile,r.n]));
  console.log(JSON.stringify({status:'OBSERVATION_COMPATIBLE',...compatible,startedAt:state.startedAt,codeHash:sha(jcs({source,node:process.version})),node:process.version,running}));
 }
 finally {await admin.end();}
}
try {await check();}catch(error) {
 const code=(error as Error).message;
 console.error(JSON.stringify({safeCode:/^OBSERVATION_[A-Z_]+$/.test(code)?code:'OBSERVATION_PREFLIGHT_FAILED'}));process.exitCode=1;
}
