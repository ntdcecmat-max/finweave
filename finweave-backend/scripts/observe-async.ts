import { readFile,writeFile,appendFile,open,unlink,mkdir,stat,readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { sha,jcs } from '../src/runtime/crypto.ts';
import { observationHealth } from './observation-health.ts';
const state=JSON.parse(await readFile(resolve('.local/async-observation-state.json'),'utf8'));
const out=resolve('../docs/execution/evidence/backend-async-observation');await mkdir(out,{recursive:true});
const lockPath=resolve(out,'sample.lock'),lock=await open(lockPath,'wx');
const pool=new Pool({connectionString:JSON.parse(await readFile(resolve(state.dir,'ops.json'),'utf8')).databaseUrl,connectionTimeoutMillis:5000});
try {
 const now=Date.now(),metrics=(await pool.query('SELECT fw_async.metrics() AS value')).rows[0].value;
 const services:Record<string,unknown>={};
 for(const profile of ['ingestion','market']) {
  const saved=state.services?.[profile];let alive=false,probeError:string|null=null;
  if(saved&&Number.isInteger(saved.pid)&&saved.pid>0&&Number.isFinite(Date.parse(saved.startedAt))) {
   try {
    const result=execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',
     '$s=[Console]::In.ReadToEnd()|ConvertFrom-Json; $p=Get-Process -Id $s.pid -ErrorAction SilentlyContinue; $alive=$false; if($p -and $p.ProcessName -eq "node") {$alive=[Math]::Abs(($p.StartTime.ToUniversalTime()-[DateTimeOffset]::Parse($s.startedAt).UtcDateTime).TotalSeconds)-lt 30}; @{alive=$alive}|ConvertTo-Json -Compress'],
     {input:JSON.stringify({pid:saved.pid,startedAt:saved.startedAt}),encoding:'utf8',windowsHide:true,timeout:10000});
    alive=JSON.parse(result).alive===true;
   }catch{probeError='PROCESS_PROBE_FAILED';}
  }
  const ready=saved?((await readFile(saved.stdout,'utf8').catch(()=>''))).includes(profile+' synthetic-local worker ready'):false;
  const stderrBytes=saved?await stat(saved.stderr).then(s=>s.size).catch(()=>null):null;
  services[profile]={alive,ready,stderrBytes,probeError,loadedCodeHash:saved?.codeHash??null,healthy:alive&&ready&&stderrBytes===0};
 }
 const rows=await readFile(resolve(out,'samples.ndjson'),'utf8').catch(e=>{if(e.code==='ENOENT')return '';throw e;});
 const prior=rows.trim()?rows.trim().split('\n').map(x=>JSON.parse(x)):[];
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const elapsedDays=(now-Date.parse(state.startedAt))/86400000;
 const observedDays=[...new Set([...prior.map(x=>x.localDay),day])];
 const times=[Date.parse(state.startedAt),...prior.map(x=>Date.parse(x.sampledAt)),now].sort((a,b)=>a-b);
 const maxSampleGapHours=Math.max(0,...times.slice(1).map((x,i)=>(x-times[i])/3600000));
 const source:Record<string,string>={};
 for(const folder of ['src/runtime','src/engine','database/runtime'])for(const name of await readdir(folder))if(/\.(ts|sql|conf|json)$/.test(name))source[folder+'/'+name]=sha(await readFile(folder+'/'+name));
 for(const file of ['pnpm-lock.yaml','scripts/observe-async.ts','scripts/observation-health.ts','../docs/contracts/v2-t1-r5/openapi.json'])source[file]=sha(await readFile(file));
 const workerSource=Object.fromEntries(Object.entries(source).filter(([file])=>!file.startsWith('scripts/')));
 const expectedWorkerCodeHash=sha(jcs({source:workerSource,node:process.version}));
 for(const profile of ['ingestion','market']) {
  const service=services[profile] as {loadedCodeHash:string|null;healthy:boolean;codeMatches?:boolean};
  service.codeMatches=service.loadedCodeHash===expectedWorkerCodeHash;
  service.healthy=service.healthy&&service.codeMatches;
 }
 const sample={sampledAt:new Date(now).toISOString(),startedAt:state.startedAt,localDay:day,elapsedDays,observedDays:observedDays.length,sevenDayObservation:false,maxSampleGapHours,scope:'REAL_ELAPSED_LOCAL_SYNTHETIC_STUB_NO_ANDROID_NO_REAL_PROVIDER',services,metrics,sourceHash:sha(jcs(source)),sourceIdentityScope:'RUNTIME_ENGINE_MIGRATIONS_LOCK_OBSERVER_AND_API005',source};
 const qualification=observationHealth([...prior,sample] as any,state.startedAt,now,sample.sourceHash);
 sample.sevenDayObservation=qualification.accepted;
 Object.assign(sample,{expectedWorkerCodeHash,qualification,qualificationScope:'ROLLING_SEVEN_DAY_HEALTHY_SCHEDULER_SAME_SOURCE_NOT_REAL_QUOTE_UAT'});
 await appendFile(resolve(out,'samples.ndjson'),JSON.stringify(sample)+'\n',{flush:true});
 await writeFile(resolve(out,'latest.json'),JSON.stringify(sample,null,2)+'\n',{flush:true});
 console.log(JSON.stringify(sample,null,2));
} finally {await pool.end();await lock.close();await unlink(lockPath);}
