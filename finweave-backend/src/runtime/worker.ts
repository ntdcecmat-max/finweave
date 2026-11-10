import type { Pool } from 'pg';
import type { Profile } from './config.ts';
import { unitOfWork } from './uow.ts';
import { token } from './crypto.ts';
export interface Ticket { id:string; workspace_id:string; subject_id:string; domain_id:string; profile:Profile; generation:number; lease_token:string; recovery_epoch:number; device_id:string|null;device_epoch:number|null;consent:string|null; kind:'probe'|'receipt'|'price'|'import'|'forecast'|'agent'; }
export class Worker {
  private pool:Pool; profile:Profile;
  constructor(pool:Pool,profile:Profile) {if(['user','ops'].includes(profile))throw Error('WORKER_PROFILE_REQUIRED');this.pool=pool;this.profile=profile;}
  async claim():Promise<Ticket|null> { return unitOfWork(this.pool,async tx=>(await tx.one('SELECT * FROM fw_dispatch.claim($1,$2)',[this.profile,token()]) as Ticket|undefined)??null); }
  async heartbeat(t:Ticket) {return unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_dispatch.heartbeat($1,$2,$3,$4,$5) AS accepted',[this.profile,t.id,t.generation,t.lease_token,t.recovery_epoch]))!.accepted as boolean);}
  async fail(t:Ticket,error:string,transient:boolean,floor:string|null=null) {return unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_dispatch.fail_attempt($1,$2,$3,$4,$5,$6,$7,$8) AS accepted',[this.profile,t.id,t.generation,t.lease_token,t.recovery_epoch,error,transient,floor]))!.accepted as boolean);}
  async finalize(ticket:Ticket,success:boolean) {
    if(ticket.profile!==this.profile)throw Error('TICKET_PROFILE_MISMATCH');
    return unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_dispatch.finalize($1,$2,$3,$4,$5,$6) AS accepted',[this.profile,ticket.id,ticket.generation,ticket.lease_token,ticket.recovery_epoch,success]))!.accepted as boolean);
  }
  async complete(ticket:Ticket,result:unknown) {
    if(ticket.profile!==this.profile)throw Error('TICKET_PROFILE_MISMATCH');
    return unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_dispatch.complete($1,$2,$3,$4,$5,$6) AS accepted',[this.profile,ticket.id,ticket.generation,ticket.lease_token,ticket.recovery_epoch,result]))!.accepted as boolean);
  }
  async runOnce(handler:(ticket:Ticket)=>Promise<unknown>) {
    const ticket=await this.claim();if(!ticket)return false;
    try {const result=await handler(ticket);return await this.complete(ticket,result);} catch {await this.finalize(ticket,false);return false;}
  }
}
