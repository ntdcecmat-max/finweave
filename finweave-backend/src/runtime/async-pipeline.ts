import type { Pool } from 'pg';
import { Worker } from './worker.ts';
import type { Ticket } from './worker.ts';
import { unitOfWork } from './uow.ts';
export interface PriceObservation {holdingId:string;value:string;currency:'VND';unit:'share'|'chi';quoteAsOf:string;}
export interface PriceAdapter {readonly provider:'stub';fetch(input:any,signal:AbortSignal):Promise<PriceObservation[]>;}
export class StubPriceAdapter implements PriceAdapter {
 readonly provider='stub' as const;calls=0;
 async fetch(input:any,signal:AbortSignal) {
  this.calls++;signal.throwIfAborted();
  // Fixtures are explicit current/last-known observations. Never use the scheduled date as quoteAsOf.
  return input.input.selection.flatMap((h:any)=>{const q=input.entitlement?.fixtures[h.id];return q?[{holdingId:h.id,...q}]:[];});
 }
}
export class ProviderFailure extends Error {
 floor:string|null;transient:boolean;
 constructor(code:'RATE_LIMITED'|'TRANSIENT'|'PROVIDER_INVALID',floor:string|null=null,transient=true) {super(code);this.floor=floor;this.transient=transient;}
}
export function retryAfter(header:string|null,bodySeconds:unknown,now:number) {
 const seconds=header&&/^\d+$/.test(header)?Number(header):null,at=header&&seconds===null?Date.parse(header):NaN;
 const headerFloor=seconds!==null&&Number.isFinite(seconds)?now+seconds*1000:Number.isFinite(at)?at:now;
 const bodyFloor=typeof bodySeconds==='number'&&Number.isFinite(bodySeconds)&&bodySeconds>=0?now+bodySeconds*1000:now;
 return {at:new Date(Math.max(now,headerFloor,bodyFloor)).toISOString(),mismatch:headerFloor!==now&&bodyFloor!==now&&headerFloor!==bodyFloor};
}
export class AsyncPipeline {
 worker:Worker;pool:Pool;adapter:PriceAdapter;private active=new Set<string>();
 constructor(pool:Pool,profile:'ingestion'|'market',adapter:PriceAdapter=new StubPriceAdapter()) {this.pool=pool;this.worker=new Worker(pool,profile);this.adapter=adapter;if(adapter.provider!=='stub')throw Error('REAL_PROVIDER_DISABLED');}
 private args(t:Ticket) {return [t.id,t.generation,t.lease_token,t.recovery_epoch];}
 async tick() {if(this.worker.profile!=='market')throw Error('PROFILE_DENIED');return await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_async.scheduler_tick() AS count'))!.count as number);}
 async runOnce() {const ticket=await this.worker.claim();if(!ticket)return false;return this.execute(ticket);}
 async execute(t:Ticket) {
  if(t.profile!==this.worker.profile||this.active.has(t.id))return false;this.active.add(t.id);
  const abort=new AbortController(),timeout=setTimeout(()=>abort.abort(Error('TRANSIENT')),25000);
  const heartbeat=setInterval(()=>{void this.worker.heartbeat(t).then(ok=>{if(!ok)abort.abort(Error('STALE_TICKET'));}).catch(()=>abort.abort(Error('TRANSIENT')));},t.kind==='receipt'?5000:15000);
  try {
   if(t.kind==='receipt'&&t.profile==='ingestion')return await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_async.process_receipt($1,$2,$3,$4) AS accepted',this.args(t)))!.accepted as boolean);
   if(t.kind==='import'&&t.profile==='ingestion')return await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_business.process_import($1,$2,$3,$4) AS accepted',this.args(t)))!.accepted as boolean);
   if(t.kind==='probe')return await this.worker.complete(t,{kind:'synthetic_probe',generation:t.generation});
   if(t.kind!=='price'||t.profile!=='market')throw new ProviderFailure('PROVIDER_INVALID',null,false);
   const input=await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_async.price_input($1,$2,$3,$4) AS input',this.args(t)))!.input);
   if(!input)return false;
   if(!input.entitlement?.id)return await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_async.publish_prices($1,$2,$3,$4,$5) AS accepted',[...this.args(t),'[]']))!.accepted as boolean);
   const reservation=await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_async.reserve_request($1,$2,$3,$4) AS result',this.args(t)))!.result);
   if(!reservation.allowed) {
    if(['SENT_UNKNOWN','STALE_TICKET'].includes(reservation.reason))return false;
    await this.worker.fail(t,reservation.reason==='RATE_LIMITED'?'RATE_LIMITED':'AUTHORITY_REVOKED',reservation.reason==='RATE_LIMITED',reservation.retryAfter??null);return false;
   }
   // Abort/lease supervision and durable single-flight intent bound a request outside DB locks.
   const quotes=await Promise.race([this.adapter.fetch(input,abort.signal),new Promise<never>((_,reject)=>abort.signal.addEventListener('abort',()=>reject(abort.signal.reason),{once:true}))]);
   abort.signal.throwIfAborted();
   if(Buffer.byteLength(JSON.stringify(quotes))>128*1024)throw new ProviderFailure('PROVIDER_INVALID',null,false);
   const ids=new Set<string>();for(const q of quotes) {
    if(ids.has(q.holdingId)||!input.input.selection.some((h:any)=>h.id===q.holdingId)||Object.keys(q).sort().join()!=='currency,holdingId,quoteAsOf,unit,value')throw new ProviderFailure('PROVIDER_INVALID',null,false);ids.add(q.holdingId);
   }
   return await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_async.publish_prices($1,$2,$3,$4,$5) AS accepted',[...this.args(t),JSON.stringify(quotes)]))!.accepted as boolean);
  } catch(error) {
   const e=error instanceof ProviderFailure?error:new ProviderFailure((error as Error).message==='PROVIDER_INVALID'?'PROVIDER_INVALID':'TRANSIENT',null,(error as Error).message!=='PROVIDER_INVALID');
   if(e.floor)await unitOfWork(this.pool,async tx=>{await tx.query('SELECT fw_async.cooldown($1,$2,$3,$4,$5)',[...this.args(t),e.floor]);});
   await this.worker.fail(t,e.message,e.transient,e.floor);return false;
  } finally {clearTimeout(timeout);clearInterval(heartbeat);this.active.delete(t.id);}
 }
}
