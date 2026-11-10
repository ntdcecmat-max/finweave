import {goalCandidate} from '../engine/planning.ts';
import type {Decision} from './tool-gateway.ts';
const finish=(conclusion:string,refs:string[]=[],proposals:string[]=[]):Decision=>({capability:'finishRun',arguments:{conclusion,evidenceRefs:refs.slice(-20),assumptionRefs:[],proposalRefs:proposals}});
// An observation-driven deterministic fallback, always labelled deterministic.
// A provider can replace decision selection without replacing the gateway.
export function adaptiveDecision(state:any):Decision {
 const {run,input,checkpoint:cp}=state,results=cp.results,refs=results.map((r:any)=>r.ref);
 const last=(name:string)=>results.findLast((r:any)=>r.capability===name);
 if(!input.scope.length)return finish('NO_DATA');
 if(run.intent==='investigation'){
  const coverage=last('getCoverage'),snapshot=last('getFinancialSnapshot'),tx=last('getTransactions');
  if(!coverage)return {capability:'getCoverage',arguments:{cursor:null}};
  if(coverage.value.nextCursor)return {capability:'getCoverage',arguments:{cursor:coverage.value.nextCursor}};
  if(!snapshot)return {capability:'getFinancialSnapshot',arguments:{}};
  if(!coverage.value.complete)return finish('PARTIAL',refs);
  if(!tx)return {capability:'getTransactions',arguments:{cursor:null,kind:'all'}};
  if(tx.value.nextCursor)return {capability:'getTransactions',arguments:{cursor:tx.value.nextCursor,kind:'all'}};
  const rows=results.filter((r:any)=>r.capability==='getTransactions').flatMap((r:any)=>r.value.items);
  const reasons=[...new Set<string>(rows.flatMap((x:any)=>[...(x.reviewReasons??[]),...(x.kind==='transfer'&&x.oneLeg?['TRANSFER_UNRESOLVED']:[]),...(x.kind==='refund'&&!x.originVerified?['REFUND_LINEAGE_MISSING']:[])]))];
  const uncertain=reasons.length>0||rows.some((x:any)=>x.posting!=='posted'||x.kind==='unknown');
  if(uncertain&&!last('getEvidence'))return {capability:'getEvidence',arguments:{evidenceRefs:results.filter((r:any)=>r.capability==='getTransactions').map((r:any)=>r.ref)}};
  if(uncertain&&reasons.length&&!last('proposeReviewActions'))return {capability:'proposeReviewActions',arguments:{reasonCodes:reasons.slice(0,5),evidenceRefs:[last('getEvidence').ref]}};
  if(uncertain&&!reasons.length)return finish('PARTIAL',refs);
  return finish(uncertain?'NEEDS_REVIEW':'FACTS_EXPLAINED',refs);
 }
 if(!last('getPlanningContext'))return {capability:'getPlanningContext',arguments:{}};
 if(input.reserveConfirmed===false&&!cp.answers.some((a:any)=>a.reserveConfirmed))return cp.clarifications<2?{capability:'askClarification',arguments:{missingFields:['reserve']}}:finish('PARTIAL',refs);
 if(run.settings.income===null||run.settings.expense===null)return cp.clarifications<2?{capability:'askClarification',arguments:{missingFields:['income_assumptions']}}:finish('PARTIAL',refs);
 // A Plan-first run observes linked actuals before proposing a revision.
 const planning=last('getPlanningContext').value;
 if(run.intent==='plan'&&planning.plans.length&&!last('getPlanActualVariance'))return {capability:'getPlanActualVariance',arguments:{}};
 const answers=cp.answers.filter((a:any)=>a.proposal),proposal=answers.at(-1)?.proposal??input.proposalBody;
 if(!run.goalId&&!proposal){
  if(cp.clarifications>=2)return finish('PARTIAL',refs);
  return {capability:'askClarification',arguments:{missingFields:['priorities']}};
 }
 const compared=results.findLast((r:any)=>r.capability==='compareScenarios'&&(r.constraintRevision??0)===(cp.constraintRevision??0));
 if(!compared){
  const body=proposal??goalCandidate(state);
  if(!body)return finish('PARTIAL',refs);
  return {capability:'compareScenarios',arguments:{candidates:[body]}};
 }
 const feasible=compared.value.findIndex((v:any)=>v.feasible);
 if(feasible<0){
  const warnings=compared.value.flatMap((x:any)=>x.warnings);
  // Unknown inputs and infeasibility are different outcomes. Do not invent an
  // income, lower reserves, or change a confirmed target to force success.
  if(warnings.some((x:string)=>/UNKNOWN|COVERAGE/.test(x)))return finish('PARTIAL',refs);
  if(run.goalId&&results.filter((r:any)=>r.capability==='compareScenarios'&&(r.constraintRevision??0)===(cp.constraintRevision??0)).length===1){
   const day=warnings.some((x:string)=>x==='RESERVE_UNMET'||x==='INSUFFICIENT_FUNDS'||x.startsWith('GOAL_UNMET'))?28:1;
   const body=goalCandidate(state,day);
   if(body&&body.goals[0].day!==cp.candidate?.goals[0]?.day)return {capability:'compareScenarios',arguments:{candidates:[body]}};
  }
  return finish('INFEASIBLE',refs);
 }
 if(!run.draftId)return {capability:'proposePlanningDraft',arguments:{body:cp.candidates[feasible]}};
 const changed=JSON.stringify(state.draft?.body)!==JSON.stringify(cp.candidates[feasible]);
 if(changed)return {capability:'amendPlanningDraft',arguments:{draftRef:run.draftId,expectedVersion:state.draft.version,body:cp.candidates[feasible]}};
 return finish('DRAFT_READY',refs,[run.draftId]);
}
// This is deliberately fixed branching: a fair stronger baseline shares tools,
// Engine and authority, but cannot reselect a schedule after a failed scenario.
export function fixedWorkflowDecision(state:any):Decision {
 const compared=state.checkpoint.results.findLast((r:any)=>r.capability==='compareScenarios'&&(r.constraintRevision??0)===(state.checkpoint.constraintRevision??0));
 if(compared&&compared.value.every((r:any)=>!r.feasible))return finish(compared.value.some((r:any)=>r.warnings.some((w:string)=>/UNKNOWN|COVERAGE/.test(w)))?'PARTIAL':'INFEASIBLE',state.checkpoint.results.map((r:any)=>r.ref));
 return adaptiveDecision(state);
}
