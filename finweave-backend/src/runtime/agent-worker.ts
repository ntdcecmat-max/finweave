import type {Pool} from 'pg';
import {Worker} from './worker.ts';
import type {Ticket} from './worker.ts';
import {unitOfWork} from './uow.ts';
import {sha,jcs} from './crypto.ts';
import {ToolGateway,validateDecision} from './tool-gateway.ts';
import type {Decision} from './tool-gateway.ts';
import {adaptiveDecision} from './agent-selector.ts';
import {resolveModelDecision} from './agent-provider.ts';
import type {DecisionProvider} from './agent-provider.ts';
export {validateDecision,scopedPlanningContext} from './tool-gateway.ts';
export {adaptiveDecision as deterministicDecision} from './agent-selector.ts';
export type {Decision} from './tool-gateway.ts';
export class AgentWorker {
 readonly worker:Worker;private pool:Pool;private decide:(state:any)=>Decision|Promise<Decision>;private provider:DecisionProvider|null;private gateway=new ToolGateway();
 constructor(pool:Pool,decide:(state:any)=>Decision|Promise<Decision>=adaptiveDecision,provider:DecisionProvider|null=null){this.pool=pool;this.worker=new Worker(pool,'agent');this.decide=decide;this.provider=provider;}
 async stop(t:Ticket,reason:string){return unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_assistant.stop_run($1,$2,$3,$4,$5) AS accepted',[t.id,t.generation,t.lease_token,t.recovery_epoch,reason]))!.accepted);}
 async input(t:Ticket){return unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_assistant.run_input($1,$2,$3,$4) AS state',[t.id,t.generation,t.lease_token,t.recovery_epoch]))!.state);}
 async execute(t:Ticket){
  if(t.kind!=='agent')throw Error('TICKET_KIND');const args=[t.id,t.generation,t.lease_token,t.recovery_epoch];let repair=false;
  for(let loop=0;loop<24;loop++){
   if(!await this.worker.heartbeat(t))return false;
   let state=await this.input(t);if(!state)return false;
   if(state.currentWorkspaceVersion!==state.run.baseVersion)return this.stop(t,'STALE_PROPOSAL');
   if(state.run.toolCalls>=8||state.checkpoint.activeMillis>=60000)return this.stop(t,'BUDGET_EXHAUSTED');
   const started=performance.now(),ms=Math.min(25000,60000-state.checkpoint.activeMillis),provider=this.provider;
   let prepared:{prompt:string;inputTokens:number}|null=null;
   try{if(provider)prepared=provider.prepare(state);}catch(e){return this.stop(t,(e as Error).message==='MODEL_UNAVAILABLE'?'MODEL_UNAVAILABLE':'CONTEXT_LIMIT');}
   const reservation=await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_assistant.reserve_round($1,$2,$3,$4,$5,$6,$7,$8) AS value',[...args,!!provider,ms,prepared?.inputTokens??0,provider?1024:0]))!.value);
   if(!reservation)return this.stop(t,'BUDGET_EXHAUSTED');
   const controller=new AbortController();let busy=false;
   const timeout=setTimeout(()=>controller.abort(),ms);timeout.unref();
   const watcher=setInterval(()=>{if(busy)return;busy=true;void this.worker.heartbeat(t).then(ok=>{if(!ok)controller.abort();}).catch(()=>controller.abort()).finally(()=>{busy=false;});},250);watcher.unref();
   let decision:Decision|undefined,outputTokens=provider?1024:0,error:string|null=null;
   try{
    if(provider){const result=await provider.decide(prepared!.prompt,controller.signal);outputTokens=result.outputTokens;validateDecision(result.decision,state.run.intent);decision=resolveModelDecision(state,result.decision);}
    else decision=await this.decide(state);
    validateDecision(decision,state.run.intent);
   }catch(e){error=(e as Error).message==='INVALID_DECISION'?'INVALID_DECISION':'MODEL_UNAVAILABLE';}
   finally{clearTimeout(timeout);clearInterval(watcher);}
   const elapsed=Math.ceil(performance.now()-started);
   if(controller.signal.aborted||elapsed>ms)return this.stop(t,'BUDGET_EXHAUSTED');
   if(!await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_assistant.settle_round($1,$2,$3,$4,$5,$6,$7,$8) AS accepted',[...args,reservation.ordinal,elapsed,outputTokens,sha(decision?jcs(decision):'UNOBSERVED')]))!.accepted))return false;
   if(provider&&error==='MODEL_UNAVAILABLE')await unitOfWork(this.pool,async tx=>tx.query('SELECT fw_assistant.provider_failure($1,$2,$3,$4)',args));
   if(error){
    if(provider&&!repair&&error!=='MODEL_UNAVAILABLE'){repair=true;continue;}
    return this.stop(t,error);
   }
   repair=false;state=await this.input(t);if(!state)return false;
   const actionMs=Math.min(25000,60000-state.checkpoint.activeMillis);if(actionMs<1)return this.stop(t,'BUDGET_EXHAUSTED');
   const hash=sha(jcs(decision)),reserved=await unitOfWork(this.pool,async tx=>(await tx.one('SELECT fw_assistant.reserve_action($1,$2,$3,$4,$5,$6) AS value',[...args,hash,actionMs]))!.value);if(!reserved)return false;
   const actionStart=performance.now();
   try{
    state.checkpoint.mode=provider?'local_model':'deterministic';
    const {next,cp,draft}=this.gateway.execute(state,decision!,reserved.ordinal);
    const actionElapsed=Math.ceil(performance.now()-actionStart);if(actionElapsed>actionMs)return this.stop(t,'BUDGET_EXHAUSTED');
    const accepted=await unitOfWork(this.pool,async tx=>(await tx.one(draft?'SELECT fw_assistant.commit_draft_action($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) AS accepted':'SELECT fw_assistant.commit_action($1,$2,$3,$4,$5,$6,$7,$8,$9) AS accepted',[...args,reserved.ordinal,hash,next,cp,actionElapsed,...(draft?[draft]:[])]))!.accepted);
    if(!accepted)return await this.input(t)?this.stop(t,'STALE_PROPOSAL'):false;if(next.state!=='reading')return true;
   }catch(e){return this.stop(t,['CONTEXT_LIMIT','INVALID_DECISION','MODEL_UNAVAILABLE'].includes((e as Error).message)?(e as Error).message:'TOOL_FAILED');}
  }
  return this.stop(t,'BUDGET_EXHAUSTED');
 }
 async runOnce(){const ticket=await this.worker.claim();return ticket?this.execute(ticket):false;}
}
