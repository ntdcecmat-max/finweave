import { Worker as ComputeThread } from 'node:worker_threads';
import type { Pool } from 'pg';
import { Worker } from './worker.ts';
import type { Ticket } from './worker.ts';
import { unitOfWork } from './uow.ts';
import { validator } from './contracts.ts';
import { assembleForecast } from '../engine/forecast.ts';
import { engineDigest } from './engine-pin.ts';
export class ForecastWorker {
 pool:Pool;worker:Worker;private busy=false;
 constructor(pool:Pool){this.pool=pool;this.worker=new Worker(pool,'forecast');}
 async runOnce(){if(this.busy)return false;const t=await this.worker.claim();return t?this.execute(t):false;}
 async execute(t:Ticket) {
  if(t.kind!=='forecast'||t.profile!=='forecast'||this.busy)return false;this.busy=true;
  const args=[t.id,t.generation,t.lease_token,t.recovery_epoch],thread=new ComputeThread(new URL('./forecast-thread.ts',import.meta.url));let stopped=false;
  const heartbeat=setInterval(()=>{void this.worker.heartbeat(t).then(ok=>{if(!ok){stopped=true;void thread.terminate();}}).catch(()=>{stopped=true;void thread.terminate();});},5000);
  const attemptStart=performance.now();
  const computeSlice=(input:any,trial:number,withPlans:boolean,checkpoint:any)=>new Promise<any>((resolve,reject)=>{const message=(m:any)=>{cleanup();m.error?reject(Error(m.error)):resolve(m.result);},error=(e:Error)=>{cleanup();reject(e);},exit=()=>{cleanup();reject(Error('STALE_TICKET'));},cleanup=()=>{thread.off('message',message);thread.off('error',error);thread.off('exit',exit);};thread.once('message',message);thread.once('error',error);thread.once('exit',exit);thread.postMessage({input,trial,withPlans,checkpoint});});
  const query=async(sql:string,values:any[]=args)=>unitOfWork(this.pool,async tx=>(await tx.one(sql,values))!);
  try {
   const input=(await query('SELECT fw_business.forecast_input($1,$2,$3,$4) AS input')).input;if(!input)return false;
   if(input.runtimeVersion!==process.version||input.engineDigest!==engineDigest)throw Error('INPUT_INVALID');
   const slices=(await query('SELECT fw_business.load_slices($1,$2,$3,$4) AS chunks')).chunks??[];
   const compute=async(input:any,trial:number,withPlans=true)=>{const saved=slices.filter((s:any)=>s.trial===trial&&s.withPlans===withPlans).sort((a:any,b:any)=>a.part-b.part);let checkpoint:any=saved.length?{state:saved[0].payload.state,points:saved.flatMap((s:any)=>s.payload.points),flows:saved.flatMap((s:any)=>s.payload.flows)}:null,slice=saved.length?saved[0].slice+1:0;
    for(;;){if(stopped)throw Error('STALE_TICKET');if(performance.now()-attemptStart>590000)throw Error('WORK_BUDGET_EXCEEDED');const result=await computeSlice(input,trial,withPlans,checkpoint);if(!result.checkpoint)return result;checkpoint=result.checkpoint;const count=Math.max(1,Math.ceil(checkpoint.points.length/12)),parts=Array.from({length:count},(_,n)=>({state:n===0?checkpoint.state:null,points:checkpoint.points.slice(n*12,n*12+12),flows:checkpoint.flows.slice(n*12,n*12+12)}));for(const part of parts)if(Buffer.byteLength(JSON.stringify(part))>256*1024)throw Error('RESULT_TOO_LARGE');const accepted=(await query('SELECT fw_business.checkpoint_slice($1,$2,$3,$4,$5,$6,$7,$8) AS accepted',[...args,trial,withPlans,slice++,JSON.stringify(parts)])).accepted;if(!accepted)throw Error('STALE_TICKET');}
   };
   const central=await compute(input,-1),without=await compute(input,-1,false),trials:any[]=[];
   const stored=(await query('SELECT fw_business.forecast_checkpoints($1,$2,$3,$4) AS chunks')).chunks??[];
   for(let n=0;n<input.request.trials;n++){
    if(stopped)return false;let result:any;const chunks=stored.filter((c:any)=>c.trial===n).sort((a:any,b:any)=>a.part-b.part);
    if(chunks.length&&chunks.length===chunks[0].payload.parts){result={...chunks[0].payload.meta,points:chunks.flatMap((c:any)=>c.payload.points),counterfactualPoints:chunks.flatMap((c:any)=>c.payload.counterfactualPoints)};}
    else {
     const path=await compute(input,n),counterfactual=await compute(input,n,false);result={points:path.points,counterfactualPoints:counterfactual.points,due:path.due,solvent:path.solvent};const count=Math.ceil(path.points.length/12);
     for(let part=0;part<count;part++){const payload={parts:count,points:path.points.slice(part*12,part*12+12),counterfactualPoints:counterfactual.points.slice(part*12,part*12+12),meta:part===0?{due:path.due,solvent:path.solvent}:null};if(Buffer.byteLength(JSON.stringify(payload))>256*1024)throw Error('RESULT_TOO_LARGE');const r=await query('SELECT fw_business.checkpoint_forecast($1,$2,$3,$4,$5,$6,$7) AS accepted',[...args,n,part,JSON.stringify(payload)]);if(!r.accepted)return false;}
    }trials.push(result);
   }
   const pages=assembleForecast(input,central,without,trials);for(const page of pages)if(!validator('ForecastResultPage')(page))throw Error('INPUT_INVALID:'+JSON.stringify(validator('ForecastResultPage').errors));
   return (await query('SELECT fw_business.publish_forecast($1,$2,$3,$4,$5) AS accepted',[...args,JSON.stringify(pages)])).accepted as boolean;
  }catch(e){if((e as Error).message!=='STALE_TICKET'){const code=['RESULT_TOO_LARGE','INPUT_INVALID','WORK_BUDGET_EXCEEDED'].find(c=>(e as Error).message.startsWith(c));if(code)await query('SELECT fw_business.fail_forecast($1,$2,$3,$4,$5) AS accepted',[...args,code]);else await this.worker.fail(t,'TRANSIENT',true);throw e;}return false;}
  finally{clearInterval(heartbeat);await thread.terminate();this.busy=false;}
 }
}
