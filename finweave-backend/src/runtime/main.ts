import { Pool } from 'pg';
import { mkdir,writeFile } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { loadConfig } from './config.ts';
import { buildApp } from './app.ts';
import { token } from './crypto.ts';
import { Worker } from './worker.ts';
import { expireAuthArtifacts } from './retention.ts';
import { AsyncPipeline } from './async-pipeline.ts';
import { ForecastWorker } from './forecast-worker.ts';
import { AgentWorker } from './agent-worker.ts';
import { configuredProvider } from './agent-provider.ts';
import { readiness } from './readiness.ts';
// Last-resort crash boundary: Node's default error inspection can print pg clients,
// connection URLs or dependency messages. Supervisor sees only an opaque code.
process.on('uncaughtException',()=>{console.error('{"safeCode":"PROCESS_CRASH"}');process.exit(1);});
process.on('unhandledRejection',()=>{console.error('{"safeCode":"PROCESS_FAILURE"}');process.exit(1);});
const config=await loadConfig(),pool=new Pool({connectionString:config.databaseUrl,max:config.profile==='user'?8:4,connectionTimeoutMillis:5000});
pool.on('error',()=>console.error('{"safeCode":"DATABASE_CONNECTION_LOST"}'));
try {await readiness(pool,config);}catch(e){await pool.end();throw e;}
if(!['user','ops'].includes(config.profile)) {
  const worker=new Worker(pool,config.profile);let stopped=false;
  const pipeline=['ingestion','market'].includes(config.profile)?new AsyncPipeline(pool,config.profile as 'ingestion'|'market'):null;
  const forecast=config.profile==='forecast'?new ForecastWorker(pool):null;
  const agent=config.profile==='agent'?new AgentWorker(pool,undefined,await configuredProvider(process.env.FW_MODEL_MANIFEST)):null;
  let nextTick=0;
  process.once('SIGINT',()=>{stopped=true;});process.once('SIGTERM',()=>{stopped=true;});
  console.log(`${config.profile} synthetic-local worker ready`);
  try {while(!stopped){
    if(config.profile==='retention')await pool.query('SELECT fw_control.purge_runtime_payloads()');
    if(pipeline)await pool.query('SELECT fw_ops.apply_controls($1)',[config.profile]);
    if(config.profile==='market'&&Date.now()>=nextTick){await pipeline!.tick();nextTick=Date.now()+60000;}
    if(pipeline)await pipeline.runOnce();else if(forecast)await forecast.runOnce().catch(()=>{});else if(agent)await agent.runOnce().catch(()=>{});else await worker.runOnce(async ticket=>{
    if(!ticket.domain_id.startsWith('synthetic_probe_'))throw Error('DOMAIN_ADAPTER_NOT_REGISTERED');
    return {kind:'synthetic_probe',profile:config.profile,generation:ticket.generation};
  });if(!stopped)await new Promise(r=>setTimeout(r,1000));}}finally{await pool.end();}
  process.exit(0);
}
const state=(await pool.query('SELECT * FROM fw_control.state')).rows[0];
if(state.locked||state.epoch!==config.recoveryEpoch){await pool.end();throw Error('STARTUP_RECOVERY_FENCE');}
const mailDir=resolve(dirname(process.env.FW_SECRET_FILE!), 'mail');await mkdir(mailDir,{recursive:true});
const app=await buildApp(config,pool,{async send(mail){await writeFile(resolve(mailDir,token()+'.json'),JSON.stringify(mail),{flag:'wx'});}},event=>console.log(JSON.stringify(event)));
const authProfile=config.profile as 'user'|'ops';
await expireAuthArtifacts(pool,authProfile);
const expiry=setInterval(()=>{void expireAuthArtifacts(pool,authProfile).catch(()=>{});},60000);expiry.unref();
const origin=new URL(config.origin);await app.listen({host:'127.0.0.1',port:Number(origin.port)});
console.log(`${config.profile} API synthetic-local at ${config.origin}`);
let closing=false;
async function close(){if(closing)return;closing=true;clearInterval(expiry);await app.close();await pool.end();}
process.once('SIGINT',()=>void close());process.once('SIGTERM',()=>void close());
