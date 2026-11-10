import type { Tx } from './uow.ts';
import type { Actor } from './identity.ts';
import { validator } from './contracts.ts';
import { fail } from './errors.ts';
import { sha,jcs,token } from './crypto.ts';
import { history } from './finance-store.ts';
import { overview,defaultProjection,dateAt,addDays,shiftMonth,metric } from '../engine/business.ts';
import { runForecastPath,validateForecastSettings } from '../engine/forecast.ts';

export function screenText(text:string):string {
  // Screen before storage. Structured facts, rather than arbitrary prose, are used
  // for calculations. This is a conservative intake guard, not a PII detector.
  if (/(?:\b\d[\s-]*){6,}|\b(?:otp|password|bearer|api[_ -]?key|access[_ -]?token|refresh[_ -]?token)\b|-----BEGIN|https?:\/\//i.test(text)) fail('PRIVACY_REPHRASE',422);
  return text.normalize('NFC').trim();
}
export function normalizedSettings(settings:any) {
  const rates=['incomeGrowth','inflation','cashReturn','stockReturn','goldReturn','stockVolatility','goldVolatility','incomeVolatility','expenseVolatility','reserveMonths','investSurplus','goldWeight','debtAPR','incomeDrop','stockShock','inflationShock'];
  const out={...settings};for(const key of rates)out[key]=String(settings[key]);
  try{validateForecastSettings(out);}catch{fail('VALIDATION');}return out;
}
export function materializePlanning(facts:any,body:any,tracking:string,asOf:number) {
  if(!validator('createPlanningDraftInput')({conversationId:'validation',body}))fail('VALIDATION');
  const f=structuredClone(facts),scope=new Set<string>(body.scope);
  if(scope.size!==body.scope.length||!body.goals.length&&!body.items.length)fail('VALIDATION');
  for(const id of scope)if(!f.accounts.some((a:any)=>a.id===id&&!a.payload.archived))fail('NOT_FOUND',404);
  if(f.holdings.length&&scope.size!==f.accounts.length)fail('INSUFFICIENT_DATA',409);
  const refIds=new Set<string>(),existingIds=new Set<string>(),goals=new Map<string,string>(),plans=new Map<string,string>();
  const refs=(r:any)=>{if(refIds.has(r.ref)||r.existingId&&existingIds.has(r.existingId))fail('VALIDATION');refIds.add(r.ref);if(r.existingId)existingIds.add(r.existingId);if(!scope.has(r.account))fail('NOT_FOUND',404);screenText(r.name);};
  const upsert=(table:string,r:any,p:any)=>{
    const index=f[table].findIndex((x:any)=>x.id===r.existingId),id=r.existingId??('proposal_'+sha(r.ref).slice(0,32));
    if(r.existingId&&index<0)fail('NOT_FOUND',404);
    const old=index>=0?f[table][index]:null;
    if(old&&(old.payload.archived||old.payload.status&&old.payload.status!=='active'))fail('ACTION_NOT_ALLOWED');
    const row={id,version:old?old.version+1:0,payload:{...old?.payload,...p}};
    if(index>=0)f[table][index]=row;else f[table].push(row);return id;
  };
  for(const g of body.goals){refs(g);if(BigInt(g.target)<=0n||g.start<tracking||g.due<g.start||g.due<dateAt(asOf)||g.due>shiftMonth(dateAt(asOf),360)||new Set(g.skipMonths).size!==g.skipMonths.length)fail('VALIDATION');
    const old=f.goals.find((x:any)=>x.id===g.existingId);
    const payload={name:g.name,target:{value:g.target,currency:'VND'},due:g.due,status:'active',projection:{...(old?.payload.projection??defaultProjection),profile:g.profile},contributionSchedule:g.contribution==='0'?null:{accountId:g.account,amount:{value:g.contribution,currency:'VND'},start:g.start,dayOfMonth:g.day,skipMonths:g.skipMonths}};
    goals.set(g.ref,upsert('goals',g,payload));
  }
  for(const p of body.items){refs(p);if(BigInt(p.amount)<=0n||p.date<tracking||p.end<p.date||p.end>shiftMonth(dateAt(asOf),360)||(p.kind==='investment')!==!!p.holding)fail('VALIDATION');
    if(p.holding&&!f.holdings.some((h:any)=>h.id===p.holding&&!h.payload.archived))fail('NOT_FOUND',404);
    screenText(p.category);
    const payload={name:p.name,kind:p.kind,amount:{value:p.amount,currency:'VND'},accountId:p.account,start:p.date,end:p.end,recurrence:p.recurrence,dayOfMonth:p.day,category:p.category,holdingId:p.holding,archived:false};
    plans.set(p.ref,upsert('plans',p,payload));
  }
  const links=new Set<string>();for(const l of body.links){const pair=l.itemRef+':'+l.goalRef;if(links.has(pair)||!plans.has(l.itemRef)||!goals.has(l.goalRef))fail('VALIDATION');links.add(pair);}
  for(const p of body.items)if(p.supportsGoal!==body.links.some((l:any)=>l.itemRef===p.ref))fail('VALIDATION');
  if(body.income!==body.settings.income||body.expense!==body.settings.expense)fail('VALIDATION');
  const settings=normalizedSettings(body.settings);screenText(body.notes);
  // Reserve is an explicit amount: convert upwards at six decimal places so a
  // fractional-month representation never silently weakens the owner's reserve.
  if(BigInt(body.reserve)>0n){if(body.expense===null||BigInt(body.expense)===0n)fail('INSUFFICIENT_DATA',409);const scale=1000000n,exp=BigInt(body.expense),n=(BigInt(body.reserve)*scale+exp-1n)/exp;if(n>24n*scale)fail('VALIDATION');settings.reserveMonths=String(Number(n)/1e6);}
  else settings.reserveMonths='0';
  return {facts:f,goals,plans,settings};
}
export function evaluatePlanning(f:any,body:any,w:any,asOf:number,id:string) {
  const m=materializePlanning(f,body,w.tracking_start,asOf),context={period:{start:w.tracking_start,endExclusive:addDays(dateAt(asOf),1),timezone:'Asia/Ho_Chi_Minh'},accountIds:body.scope,snapshotVersion:w.version},base=overview(f,w.id,w.version,context,asOf);
  const request={settings:m.settings,scopeAccountIds:body.scope,goalIds:[...m.goals.values()],seed:'planning-deterministic',trials:1,overduePolicy:'retain_overdue'},path=runForecastPath({facts:m.facts,request,base,asOf},-1),baseline=runForecastPath({facts:f,request,base,asOf},-1),last=path.points.at(-1),before=baseline.points.at(-1);
  const warnings:string[]=[...path.missingReasons??[]];
  if(path.baseline?.complete===false)warnings.push('BASELINE_COVERAGE_UNKNOWN');
  if(last.cash===null)warnings.push('UNKNOWN_CASH');else if(BigInt(path.minimumFreeCash)<BigInt(body.reserve))warnings.push('RESERVE_UNMET');
  if(body.settings.debt===null)warnings.push('DEBT_UNKNOWN');
  if(path.flows.some((p:any)=>p.unfundedInvestment===null||BigInt(p.unfundedInvestment??'0')>0n))warnings.push('INVESTMENT_UNFUNDED');
  for(const g of body.goals){const gid=m.goals.get(g.ref)!;const due=path.due?.[gid];if(!due?.pass)warnings.push('GOAL_UNMET:'+g.ref);}
  if(path.solvent===false||path.state?.solvent===false)warnings.push('INSUFFICIENT_FUNDS');
  const total=(p:any,k:string):bigint|null=>p.flows.some((row:any)=>row[k]===null)?null:p.flows.reduce((sum:bigint,row:any)=>sum+BigInt(row[k]??'0'),0n);
  const income=total(path,'income'),expense=total(path,'expense'),investment=total(path,'invested'),bi=total(baseline,'income'),be=total(baseline,'expense'),bv=total(baseline,'invested');
  const first=body.goals[0],gid=first?m.goals.get(first.ref)!:null,mm=(v:any,c='simulated')=>metric(v===null||v===undefined?null:BigInt(v),asOf,c);
  const result={goalId:gid,mode:'save',amount:{value:first?.contribution??'0',currency:'VND'},count:body.settings.months,accountId:body.scope[0],firstDate:dateAt(asOf),intervalDays:30,horizon:last.date,id,version:0,baseWorkspaceVersion:w.version,goalVersion:first?first.existingId?f.goals.find((g:any)=>g.id===first.existingId).version:0:null,snapshotRefs:base.snapshotRefs,context,steps:[],baseCash:mm(before.cash,'planned'),baseAssets:mm(before.assets,'planned'),baseIncome:mm(bi,'planned'),baseGrossExpense:mm(be,'planned'),baseNetExpense:mm(be,'planned'),baseScopedFlow:mm(bi===null||be===null||bv===null?null:bi-be-bv,'planned'),cash:mm(last.cash),assets:mm(last.assets),income:mm(income),scopedFlow:mm(income===null||expense===null||investment===null?null:income-expense-investment),grossExpense:mm(expense),netExpense:mm(expense),cumulativeGrossExpense:mm(expense===null?null:BigInt(base.grossExpense.value?.value??'0')+expense),cumulativeNetExpense:mm(expense===null?null:BigInt(base.netExpense.value?.value??'0')+expense),goalFunded:mm(first?last.goals[gid!]:null),assumptions:['Conditional deterministic scenario from frozen inputs; no actual posting or allocation.','All competing Goals and reservations in the selected accounts are retained.','Proposed identifiers refer to hypothetical Goals; Plan-only output has unknown goal funding.'],createdAt:new Date(asOf).toISOString()};
  const assetDependent=body.items.some((p:any)=>p.kind==='investment')||body.goals.some((g:any)=>{const base=f.goals.find((r:any)=>r.id===g.existingId);return ['assets','independence'].includes(base?.payload.projection?.criterion);});
  const blockingWarnings=warnings.filter(reason=>assetDependent||!['MISSING_PRICE','MISSING_QUANTITY','MISSING_FX','INCOMPATIBLE_UNIT'].includes(reason));
  return {simulationId:id,baseVersion:w.version,feasible:blockingWarnings.length===0,warnings:[...new Set(warnings)],result};
}
export async function commitPlanning(tx:Tx,a:Actor,w:any,f:any,draft:any) {
  const m=materializePlanning(f,draft.body,w.tracking_start,a.now),ids:string[]=[],mapping=new Map<string,string>();
  for(const [table,rows,refs]of [['goals',draft.body.goals,m.goals],['plans',draft.body.items,m.plans]] as const){
    for(const r of rows){const proposed=m.facts[table].find((x:any)=>x.id===refs.get(r.ref)),id=r.existingId??token(),old=f[table].find((x:any)=>x.id===r.existingId);mapping.set(r.ref,id);
      if(old)await tx.query(`UPDATE fw_business.${table} SET version=version+1,payload=$3 WHERE workspace_id=$1 AND id=$2`,[w.id,id,proposed.payload]);
      else await tx.query(`INSERT INTO fw_business.${table}(workspace_id,id,payload) VALUES($1,$2,$3)`,[w.id,id,proposed.payload]);
      await history(tx,a,w.id,id,old?old.version+1:0,'confirmPlanningDraft');ids.push(id);
      if(table==='plans')await tx.query('DELETE FROM fw_assistant.goal_plan_links WHERE workspace_id=$1 AND plan_id=$2',[w.id,id]);
    }
  }
  for(const l of draft.body.links)await tx.query('INSERT INTO fw_assistant.goal_plan_links VALUES($1,$2,$3,$4)',[w.id,mapping.get(l.goalRef),mapping.get(l.itemRef),draft.id]);
  await tx.query('UPDATE fw_finance.workspaces SET version=version+1 WHERE id=$1',[w.id]);
  return ids;
}
export const draftDigest=(d:any)=>sha(jcs({id:d.id,version:d.version,baseVersion:d.baseVersion,body:d.body}));
