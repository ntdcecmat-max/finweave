import {readFileSync} from 'node:fs';
import {Ajv2020} from 'ajv/dist/2020.js';
import formats from 'ajv-formats';
import {sha,jcs} from './crypto.ts';
import {validator} from './contracts.ts';
import {overview,dateAt,planForecast,metric} from '../engine/business.ts';
import {evaluatePlanning,materializePlanning} from './planning-drafts.ts';
import {newDraft} from './assistant.ts';
import {renderGrounded} from './grounded-renderer.ts';
const schema=JSON.parse(readFileSync(new URL('../../../docs/agent/decision-schemas.json',import.meta.url),'utf8'));
const ajv=new Ajv2020({strict:false,coerceTypes:false,removeAdditional:false});(formats as any)(ajv);
ajv.addSchema(schema);const decisionValidator=ajv.compile({$ref:schema.$id+'#/$defs/Decision'});
const registry=JSON.parse(readFileSync(new URL('../../../docs/agent/tool-registry.json',import.meta.url),'utf8'));
export interface Decision {capability:string;arguments:Record<string,any>}
export function validateDecision(value:unknown,intent:string):asserts value is Decision {
 if(!decisionValidator(value)||!registry.capabilities.find((x:any)=>x.name===(value as Decision).capability)?.intents.includes(intent))throw Error('INVALID_DECISION');
}
export const alias=(run:string,kind:string,id:string)=>'r_'+sha(jcs([run,kind,id])).slice(0,32);
export function coverageComplete(input:any){
 return input.scope.every((account:string)=>{
  let end=input.context.period.start;
  for(const row of input.facts.coverage.filter((r:any)=>r.account_id===account).sort((a:any,b:any)=>a.payload.start.localeCompare(b.payload.start))){if(row.payload.start>end)break;if(row.payload.endExclusive>end)end=row.payload.endExclusive;}
  return end>=input.context.period.endExclusive;
 });
}

export class ToolGateway {
 execute(state:any,decision:Decision,ordinal:number){
  validateDecision(decision,state.run.intent);
  const {run,input,checkpoint}=state,f=input.facts,w=input.workspace,now=input.asOf;
  const snap=overview(f,w.id,w.version,input.context,now),ref='action_'+ordinal;
  let value:any=null,draft:any=null,next={...run,version:run.version+2,toolCalls:ordinal,state:'reading',steps:[...run.steps,decision.capability]},cp={...checkpoint,results:[...checkpoint.results]};
    const a=decision.arguments;
    if(decision.capability==='getFinancialSnapshot')value={cash:snap.cash,assets:snap.assets,income:snap.income,netExpense:snap.netExpense};
    else if(decision.capability==='getPlanningContext')value=scopedPlanningContext(state);
    else if(['getCoverage','getTransactions'].includes(decision.capability)){
     const rows=decision.capability==='getCoverage'?f.coverage.filter((r:any)=>input.scope.includes(r.account_id)&&r.payload.start<input.context.period.endExclusive&&r.payload.endExclusive>input.context.period.start):f.events.filter((r:any)=>(input.scope.includes(r.payload.accountId)||input.scope.includes(r.payload.toAccountId))&&r.payload.date>=input.context.period.start&&r.payload.date<input.context.period.endExclusive&&r.payload.date<=dateAt(now)&&(a.kind==='all'||r.payload.kind===a.kind));
     const all=rows.map((r:any)=>({ref:alias(run.id,decision.capability,r.id),...(decision.capability==='getCoverage'?{start:r.payload.start,endExclusive:r.payload.endExclusive}:{kind:r.payload.kind,amount:r.payload.amount,date:r.payload.date,posting:r.payload.posting,oneLeg:r.payload.oneLeg??false,originVerified:!!r.payload.originId,reviewReasons:f.reviews.filter((v:any)=>v.payload.eventId===r.id&&v.payload.status==='open').map((v:any)=>({duplicate:'POSSIBLE_DUPLICATE',transfer:'TRANSFER_UNRESOLVED',refund:'REFUND_LINEAGE_MISSING',fee:'FEE_AMBIGUOUS'}[v.payload.type as string])).filter(Boolean)})})).sort((a:any,b:any)=>a.ref.localeCompare(b.ref));
     if(a.cursor&&!all.some((r:any)=>r.ref===a.cursor))throw Error('INVALID_DECISION');const selected=all.filter((r:any)=>!a.cursor||r.ref>a.cursor);value={items:selected.slice(0,50),nextCursor:selected.length>50?selected[49].ref:null,truncated:selected.length>50,...(decision.capability==='getCoverage'?{complete:coverageComplete(input)}:{})};
    }
    else if(decision.capability==='getPlanActualVariance'){
     const scoped={...f,plans:f.plans.filter((p:any)=>input.scope.includes(p.payload.accountId))};
     const forecast=planForecast(scoped,snap,dateAt(now),now);if(forecast.items.length>50)throw Error('CONTEXT_LIMIT');
     value={actualCash:forecast.actualCash,forecastCash:forecast.forecastCash,items:forecast.items.map((x:any)=>({ref:alias(run.id,'occurrence',x.occurrenceId),planRef:alias(run.id,'plan',x.item.id),date:x.date,actual:metric(x.actual.value,now,'actual'),remaining:metric(x.remaining.value,now,'planned'),overspend:metric(x.overspend.value,now,'actual')}))};
    }
    else if(decision.capability==='getEvidence'){value=a.evidenceRefs.map((r:string)=>{const old=cp.results.find((x:any)=>x.ref===r);if(!old)throw Error('INVALID_DECISION');return {ref:r,capability:old.capability,value:old.value};});}
    else if(decision.capability==='compareScenarios'){
     value=a.candidates.map((body:any,n:number)=>{checkHardConstraints(state,body);if(body.settings.months>24)throw Error('CONTEXT_LIMIT');return evaluatePlanning(f,body,w,now,'scenario_'+ordinal+'_'+n);});cp.candidates=a.candidates;cp.candidate=a.candidates[0];cp.comparisonRevision=cp.constraintRevision??0;
    }
    else if(decision.capability==='proposePlanningDraft'){
     materializePlanning(f,a.body,w.tracking_start,now);if((cp.comparisonRevision??0)!==(cp.constraintRevision??0)||!(cp.candidates??[cp.candidate]).some((body:any)=>body&&jcs(a.body)===jcs(body)))throw Error('INVALID_DECISION');
     checkHardConstraints(state,a.body);
     draft=newDraft(run.conversationId,a.body,w.version,now,'draft_'+sha(run.id+':'+ordinal).slice(0,40),run.id);next.draftId=draft.id;value={draftRef:draft.id,version:0};
    }
    else if(['simulatePlan','amendPlanningDraft'].includes(decision.capability)){
     const current=state.draft;
     if(!current||a.draftRef!==run.draftId||current.id!==a.draftRef||current.version!==a.expectedVersion||current.baseVersion!==run.baseVersion||!['draft','previewed'].includes(current.state))throw Error('INVALID_DECISION');
     if(decision.capability==='simulatePlan'){
      checkHardConstraints(state,current.body);if(current.body.settings.months>24)throw Error('CONTEXT_LIMIT');
      value=evaluatePlanning(f,current.body,w,now,'simulation_'+sha(run.id+':'+ordinal).slice(0,32));
     }else{
      checkHardConstraints(state,a.body);materializePlanning(f,a.body,w.tracking_start,now);
      if((cp.comparisonRevision??0)!==(cp.constraintRevision??0)||!(cp.candidates??[cp.candidate]).some((body:any)=>body&&jcs(a.body)===jcs(body)))throw Error('INVALID_DECISION');
      draft={...current,body:a.body,version:current.version+1,state:'draft',preview:null,revisions:[...current.revisions,'AGENT_REVISED']};
      value={draftRef:draft.id,version:draft.version};
     }
    }
    else if(decision.capability==='askClarification'){
     if(cp.clarifications>=2)throw Error('CONTEXT_LIMIT');next.state='awaiting_user';next.questionId='question_'+sha(run.id+':'+ordinal).slice(0,32);next.summary='Please clarify: '+a.missingFields.join(', ');cp.clarifications++;value={questionId:next.questionId,missingFields:a.missingFields};
    }
    else if(decision.capability==='proposeReviewActions'){
     if(a.evidenceRefs.some((ref:string)=>!cp.results.some((r:any)=>r.ref===ref)))throw Error('INVALID_DECISION');
     const rows=cp.results.filter((r:any)=>r.capability==='getTransactions').flatMap((r:any)=>r.value.items),reasons=new Set(rows.flatMap((x:any)=>[...(x.reviewReasons??[]),...(x.kind==='transfer'&&x.oneLeg?['TRANSFER_UNRESOLVED']:[]),...(x.kind==='refund'&&!x.originVerified?['REFUND_LINEAGE_MISSING']:[])]));
     if(a.reasonCodes.some((code:string)=>!reasons.has(code)))throw Error('INVALID_DECISION');value={reasonCodes:a.reasonCodes,evidenceRefs:a.evidenceRefs};
    }
    else if(decision.capability==='finishRun'){
     if([...a.evidenceRefs,...a.assumptionRefs].some((ref:string)=>!cp.results.some((r:any)=>r.ref===ref))||a.proposalRefs.some((ref:string)=>ref!==run.draftId))throw Error('INVALID_DECISION');
     if(a.conclusion==='DRAFT_READY'&&!run.draftId)throw Error('INVALID_DECISION');
     if(a.conclusion==='DRAFT_READY'){
      if(!run.draftId||!state.draft)throw Error('INVALID_DECISION');
      const checked=cp.results.findLast((r:any)=>r.capability==='compareScenarios'&&(r.constraintRevision??0)===(cp.constraintRevision??0));
      const candidate=state.draft?.body??cp.candidate;
      if(!checked||(cp.candidates??[cp.candidate]).every((b:any,n:number)=>jcs(b)!==jcs(candidate)||!checked.value[n]?.feasible))throw Error('INVALID_DECISION');
     }
     if(a.conclusion==='FACTS_EXPLAINED'&&run.intent==='investigation'&&(!coverageComplete(input)||['getCoverage','getTransactions'].some(name=>cp.results.findLast((r:any)=>r.capability===name)?.value?.nextCursor)))throw Error('INVALID_DECISION');
     if(a.conclusion==='INFEASIBLE'){const compared=cp.results.findLast((r:any)=>r.capability==='compareScenarios'&&(r.constraintRevision??0)===(cp.constraintRevision??0));if(!compared||compared.value.some((r:any)=>r.feasible||r.warnings.some((x:string)=>/UNKNOWN|COVERAGE/.test(x))))throw Error('INVALID_DECISION');}
     if(a.conclusion==='NO_DATA'&&input.scope.length)throw Error('INVALID_DECISION');
     if(a.conclusion==='NEEDS_REVIEW'&&!cp.results.some((r:any)=>r.capability==='proposeReviewActions'))throw Error('INVALID_DECISION');
     if(['FACTS_EXPLAINED','NEEDS_REVIEW'].includes(a.conclusion)&&!a.evidenceRefs.length)throw Error('INVALID_DECISION');
     next.state=a.conclusion==='DRAFT_READY'?'draft_ready':['PARTIAL','INFEASIBLE','NO_DATA'].includes(a.conclusion)?'partial':'completed';next.summary=a.conclusion;next.evidence=a.evidenceRefs;value={conclusion:a.conclusion};
     cp.rendered=renderGrounded(a.conclusion,cp.results,a.evidenceRefs,cp.mode??input.mode);
    }
    else throw Error('INVALID_DECISION');

  cp.results.push({ref,capability:decision.capability,value,constraintRevision:cp.constraintRevision??0});
  if(next.state!=='reading'&&input.aiContext){
   const id='message_'+sha(run.id+':'+ordinal).slice(0,32),createdAt=new Date(now).toISOString();
   const text=cp.rendered?.text??'Cần làm rõ các giả định và ưu tiên trong bản nháp trước khi tiếp tục.';
   cp.message={id,conversationId:run.conversationId,version:0,role:'assistant',text,context:input.aiContext,state:'completed',errorCode:null,createdAt,processingKind:'agent',agentRunId:run.id,planningDraftId:next.draftId,result:{id:'result_'+sha(id).slice(0,32),messageId:id,mode:cp.mode??'deterministic',context:input.aiContext,tool:run.intent==='investigation'?'insights':'plans',text,metrics:cp.rendered?.metrics??[],evidenceIds:next.evidence,targets:[],stale:false,createdAt}};
   if(!validator('sendAssistantMessageOutput')(cp.message))throw Error('INVALID_DECISION');
  }
  if(Buffer.byteLength(jcs(cp))>49152)throw Error('CONTEXT_LIMIT');
  if(!validator('getAgentRunOutput')(next as unknown))throw Error('INVALID_DECISION');
  return {next,cp,draft};
 }
}
export function scopedPlanningContext(state:any){
 const {run,input}=state,f=input.facts,scope=input.scope;
 const allocations=f.allocations.filter((a:any)=>a.active&&scope.includes(a.account_id));
 const goals=f.goals.filter((g:any)=>g.payload.status!=='archived'&&(scope.includes(g.payload.contributionSchedule?.accountId)||allocations.some((a:any)=>a.goal_id===g.id)));
 const plans=f.plans.filter((p:any)=>!p.payload.archived&&scope.includes(p.payload.accountId));
 if(goals.length>50||plans.length>50||allocations.length>50)throw Error('CONTEXT_LIMIT');
 return {plans:plans.map((p:any)=>({ref:alias(run.id,'plan',p.id),kind:p.payload.kind,amount:p.payload.amount,version:p.version})),goals:goals.map((g:any)=>({ref:alias(run.id,'goal',g.id),target:g.payload.target,due:g.payload.due,version:g.version})),allocations:allocations.map((a:any)=>({ref:alias(run.id,'allocation',a.id),amount:a.amount,active:a.active}))};
}
export function checkHardConstraints(state:any,body:any){
 const {run,input}=state;
 const approved=state.checkpoint?.answers.findLast((a:any)=>a.proposal)?.proposal??input.proposalBody;
 if(input.reserveConfirmed===false&&!state.checkpoint?.answers.some((a:any)=>a.reserveConfirmed))throw Error('INVALID_DECISION');
 if(jcs([...body.scope].sort())!==jcs([...input.scope].sort())||jcs(body.settings)!==jcs(run.settings)||body.income!==run.settings.income||body.expense!==run.settings.expense)throw Error('INVALID_DECISION');
 const reserve=run.settings.expense===null?null:(BigInt(run.settings.expense)*BigInt(Math.ceil(run.settings.reserveMonths*1000000))+999999n)/1000000n;
 if(reserve===null||BigInt(body.reserve)<reserve||(approved&&BigInt(body.reserve)<BigInt(approved.reserve)))throw Error('INVALID_DECISION');
 if(run.goalId&&!body.goals.some((g:any)=>g.existingId===run.goalId))throw Error('INVALID_DECISION');
 for(const g of body.goals.filter((g:any)=>g.existingId)){
  const old=input.facts.goals.find((x:any)=>x.id===g.existingId),fixed=approved?.goals.find((x:any)=>x.existingId===g.existingId);
  if(!old||g.target!==(fixed?.target??old.payload.target.value)||g.due!==(fixed?.due??old.payload.due))throw Error('INVALID_DECISION');
 }
 // Only owner-confirmed draft assumptions can grant Plan changes. A model
 // cannot grant itself permission by changing priority to prefer_goals.
 for(const p of body.items.filter((p:any)=>p.existingId)){
  const old=input.facts.plans.find((x:any)=>x.id===p.existingId)?.payload;
  const consent=approved?.items.find((x:any)=>x.existingId===p.existingId);
  if(!old||(!consent&&(p.amount!==old.amount.value||p.kind!==old.kind||p.date!==old.start||p.end!==old.end||p.account!==old.accountId))||(consent&&jcs(p)!==jcs(consent)))throw Error('INVALID_DECISION');
 }
 if(approved&&(body.goals.some((g:any)=>{const fixed=approved.goals.find((x:any)=>x.ref===g.ref);return !fixed||g.target!==fixed.target||g.due!==fixed.due;})||body.priority!==approved.priority))throw Error('INVALID_DECISION');
}
