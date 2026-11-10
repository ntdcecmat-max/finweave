import { createHash } from 'node:crypto';
import { money,sumMoney,valueHolding } from './exact.ts';
import { replayQuantity } from './posting.ts';
export const dateAt=(ms:number)=>new Date(ms+7*3600000).toISOString().slice(0,10);
export const addDays=(date:string,n:number)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function shiftMonth(date:string,n:number) {const [y,m,d]=date.split('-').map(Number),first=new Date(Date.UTC(y,m-1+n,1));first.setUTCDate(Math.min(d,new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate()));return first.toISOString().slice(0,10);}
export const opaque=(...parts:any[])=>createHash('sha256').update(JSON.stringify(parts)).digest('hex');
export const vnd=(value:string|bigint)=>({value:value.toString(),currency:'VND'});
export function metric(value:string|bigint|null,now:number,classification='actual',reason='NO_DATA'):any {return {value:value===null?null:vnd(value),missingReason:value===null?reason:null,classification:value===null?'unknown':classification,quality:{status:value===null?'unknown':'complete',sourceIds:[],asOf:new Date(now).toISOString(),reasons:value===null?[reason]:[]},evidenceIds:[]};}
export function occurrences(r:any,horizon:string) {
 const p=r.payload,rows:{id:string;date:string}[]=[];
 if(p.archived)return rows;
 if(p.recurrence==='once'){if(p.start<=horizon)rows.push({id:opaque(r.id,r.version,p.start),date:p.start});return rows;}
 for(let m=p.start.slice(0,7)+'-01',n=0;m<=p.end&&m<=horizon;m=shiftMonth(m,1),n++){
  if(n>=1200)throw Error('WORK_BUDGET_EXCEEDED');const last=new Date(Date.parse(shiftMonth(m,1)+'T00:00:00Z')-86400000).getUTCDate(),date=m.slice(0,8)+String(Math.min(p.dayOfMonth,last)).padStart(2,'0');
  if(date>=p.start&&date<=p.end&&date<=horizon&&!p.skipMonths?.includes(date.slice(0,7)))rows.push({id:opaque(r.id,r.version,date),date});
 }return rows;
}
export const histories=(f:any,id:string)=>f.history.filter((h:any)=>h.object_id===id).map((h:any)=>h.payload).sort((a:any,b:any)=>a.at.localeCompare(b.at)||a.version-b.version||a.id.localeCompare(b.id));
export function accountBalance(f:any,id:string,cutoff:string) {return sumMoney(f.lines.filter((l:any)=>l.ledger_id==='asset:'+id&&(!l.business_date||l.business_date<cutoff)).map((l:any)=>l.signed_amount));}
export function eventDTO(f:any,r:any) {const p=r.payload,link=f.links.find((l:any)=>l.active&&l.event_family===r.family);return {id:r.id,version:r.version,kind:p.kind,amount:p.amount,date:p.date,accountId:p.accountId,toAccountId:p.toAccountId??null,category:p.category,description:p.description,posting:p.posting,reconciliation:p.reconciliation??'clear',reference:p.reference??null,originId:p.originId??null,reversalOf:p.reversalOf??null,holdingId:p.holdingId??null,planLinkId:link?.id??null,manualCategoryOverride:p.manualCategoryOverride??false,evidenceIds:p.evidenceIds??[],history:histories(f,r.id)};}
export function overview(f:any,w:string,version:number,context:any,now:number) {
 const end=context.period.endExclusive,clockEnd=addDays(dateAt(now),1),cutoff=end<clockEnd?end:clockEnd,scope=context.accountIds.length?context.accountIds:f.accounts.map((a:any)=>a.id);
 const accounts=f.accounts.filter((a:any)=>scope.includes(a.id)).map((r:any)=>({id:r.id,version:r.version,...r.payload,balance:metric(r.payload.openingDate>=cutoff?null:accountBalance(f,r.id,cutoff),now,'actual','OUTSIDE_SNAPSHOT'),evidenceIds:[]}));
 const quoteIds:string[]=[],holdings=f.holdings.filter((r:any)=>f.movements.some((m:any)=>m.holding_id===r.id&&m.business_date<cutoff)).map((r:any)=>{
  const {catalogId,profileConfirmedVersion,...p}=r.payload,profile=Object.fromEntries(Object.entries(r.payload).filter(([k])=>!['name','cost','costDate','costQuantity','quantityDate'].includes(k)));
  const moves=f.movements.filter((m:any)=>m.holding_id===r.id&&m.business_date<cutoff),q=moves.length?replayQuantity(moves.map((m:any)=>({mode:m.mode,quantity:m.quantity}))):null;
  const qs=f.quotes.filter((q:any)=>q.holding_id===r.id&&dateAt(Date.parse(q.payload.at))<cutoff&&(!f.quoteBasis.find((b:any)=>b.quote_id===q.id)||JSON.stringify(f.quoteBasis.find((b:any)=>b.quote_id===q.id).profile)===JSON.stringify(profile))).sort((a:any,b:any)=>b.payload.at.localeCompare(a.payload.at)||(b.payload.fetchedAt??b.payload.at).localeCompare(a.payload.fetchedAt??a.payload.at)||b.id.localeCompare(a.id));
  const quote=qs[0]?.payload;if(quote)quoteIds.push(quote.id);const val=valueHolding({quantity:q,price:quote?.price.value??null,unit:quote?.price.per??(p.kind==='gold'?'chi':'share'),currency:quote?.price.currency??'VND',fx:quote?.fxAt&&dateAt(Date.parse(quote.fxAt))>=cutoff?null:quote?.fxVndPerUsd??null});
  const valuation=metric(val.known?val.amount:null,now,'actual',q===null?'MISSING_QUANTITY':!val.known&&val.reason==='FX_UNKNOWN'?'MISSING_FX':'MISSING_PRICE');
  if(quote&&val.known){valuation.quality.sourceIds=[quote.sourceId];if(now-Date.parse(quote.quoteAsOf??quote.at)>36*3600000){valuation.quality.status='stale';valuation.quality.reasons=['STALE_SOURCE'];}}
  return {id:r.id,version:r.version,...p,quantity:q===null?null:{value:q,unit:p.kind==='gold'?'chi':'share'},valuation,evidenceIds:[]};
 });
 const events=f.events.filter((r:any)=>r.payload.posting==='posted'&&!r.payload.reversalOf&&r.payload.date>=context.period.start&&r.payload.date<cutoff&&(scope.includes(r.payload.accountId)||scope.includes(r.payload.toAccountId)));
 const total=(kind:string)=>sumMoney(events.filter((r:any)=>r.payload.kind===kind&&scope.includes(r.payload.accountId)&&(kind!=='refund'||r.payload.originId)).map((r:any)=>r.payload.amount.value));
 const income=total('income'),expense=total('expense'),refund=total('refund'),net=(BigInt(expense)-BigInt(refund)).toString();
 let flow=0n;for(const r of events){const p=r.payload,v=BigInt(p.amount.value),src=scope.includes(p.accountId),dst=scope.includes(p.toAccountId);if(p.kind==='income'||p.kind==='refund'){if(src)flow+=v;}else if(p.kind==='expense'||p.kind==='investment'){if(src)flow-=v;}else if(p.kind==='transfer'){if(src)flow-=v;if(dst&&!p.oneLeg)flow+=v;}else if(p.kind==='adjustment'&&src)flow+=BigInt(p.signed??'0');}
 const categories=new Map<string,{gross:bigint;refunds:bigint;eventIds:string[]}>();for(const r of events){const p=r.payload;if(!scope.includes(p.accountId)||!['expense','refund'].includes(p.kind)||p.kind==='refund'&&!p.originId)continue;const origin=p.kind==='refund'?f.events.find((e:any)=>e.family===p.originId&&e.payload.kind==='expense'&&e.payload.posting==='posted'):null,key=origin?.payload.category??p.category,b=categories.get(key)??{gross:0n,refunds:0n,eventIds:[]};b[p.kind==='expense'?'gross':'refunds']+=BigInt(p.amount.value);b.eventIds.push(r.id);categories.set(key,b);}
 const cashOnly=context.accountIds.length>0&&scope.length!==f.accounts.length&&f.holdings.length>0,cashKnown=accounts.every((a:any)=>a.balance.value!==null),cash=sumMoney(accounts.flatMap((a:any)=>a.balance.value?[a.balance.value.value]:[])),known=sumMoney([cash,...(cashOnly?[]:holdings.flatMap((h:any)=>h.valuation.value?[h.valuation.value.value]:[]))]),complete=!cashOnly&&cashKnown&&holdings.every((h:any)=>h.valuation.value!==null);
 const refs={workspaceVersion:version,sourceVersions:Object.fromEntries(f.sources.map((r:any)=>[r.id,r.version])),holdingVersions:Object.fromEntries(f.holdings.map((r:any)=>[r.id,r.version])),quoteIds,eventVersions:Object.fromEntries(f.events.map((r:any)=>[r.id,r.version])),planVersions:Object.fromEntries(f.plans.map((r:any)=>[r.id,r.version])),goalVersions:Object.fromEntries(f.goals.map((r:any)=>[r.id,r.version]))};
 const result={id:opaque(w,version,context),version,context:{...context,snapshotVersion:version},snapshotRefs:refs,cash:metric(cashKnown?cash:null,now),assets:metric(complete?known:null,now,'actual',cashOnly||!cashKnown?'OUTSIDE_SNAPSHOT':'MISSING_PRICE'),income:metric(income,now),grossExpense:metric(expense,now),refunds:metric(refund,now),netExpense:metric(net,now),scopedFlow:metric(flow,now),knownAssetSubtotal:vnd(known),spending:[...categories].sort(([a],[b])=>a.localeCompare(b)).map(([category,b])=>({category,gross:vnd(b.gross),refunds:vnd(b.refunds),net:vnd(b.gross-b.refunds),eventIds:b.eventIds})),accounts,holdings:cashOnly?[]:holdings,evidenceIds:[]};
 if(!complete&&known!=='0')result.assets.quality.status='partial';return result;
}
// All competing allocations participate, even when a view selects one goal.
export function funding(f:any,cutoff:string) {
 const result=new Map<string,bigint>(),active=f.allocations.filter((a:any)=>a.active&&f.goals.find((g:any)=>g.id===a.goal_id)?.payload.status!=='archived').sort((a:any,b:any)=>a.id.localeCompare(b.id));
 for(const account of f.accounts){const rows=active.filter((a:any)=>a.account_id===account.id),total=rows.reduce((s:bigint,a:any)=>s+BigInt(a.amount),0n),bal=BigInt(accountBalance(f,account.id,cutoff)),cap=bal<0n?0n:bal<total?bal:total;let used=0n;
  for(const row of rows){const share=total?cap*BigInt(row.amount)/total:0n;result.set(row.id,share);used+=share;}let remainder=cap-used;for(const row of rows){if(remainder<=0n)break;if(result.get(row.id)!<BigInt(row.amount)){result.set(row.id,result.get(row.id)!+1n);remainder--;}}
 }return result;
}
export const defaultProjection={criterion:'savings',profile:'cash',targetBasis:'nominal',expenseMultiple:25,liquidMonths:0,icon:'target'};
export function goalDTO(f:any,r:any,now:number) {
 const funded=funding(f,addDays(dateAt(now),1)),allocations=f.allocations.filter((a:any)=>a.goal_id===r.id).map((a:any)=>{const amount=BigInt(a.amount),value=funded.get(a.id)??0n;return {id:a.id,version:a.version,goalId:r.id,accountId:a.account_id,earmarked:vnd(amount),funded:vnd(value),shortfall:vnd(a.active?amount-value:0n),active:a.active,date:a.business_date};});
 const sum=allocations.reduce((s:bigint,a:any)=>s+BigInt(a.funded.value),0n),target=BigInt(r.payload.target.value),ratio=sum*10000n/target;return {...r.payload,projection:r.payload.projection??defaultProjection,id:r.id,version:r.version,allocations,funded:metric(sum,now),shortfall:vnd(target>sum?target-sum:0n),progressPercent:(ratio/100n).toString()+'.'+(ratio%100n).toString().padStart(2,'0'),history:histories(f,r.id)};
}
export const planDTO=(f:any,r:any)=>({id:r.id,version:r.version,...r.payload,history:histories(f,r.id)});
export function eligibleActual(f:any,link:any,cutoff:string):bigint {const family=f.events.filter((e:any)=>e.family===link.event_family&&e.payload.posting==='posted'&&!e.payload.reversalOf&&e.payload.date<cutoff),gross:bigint=family.reduce((s:bigint,e:any)=>s+BigInt(e.payload.amount.value),0n),refund:bigint=f.events.filter((e:any)=>e.payload.kind==='refund'&&e.payload.posting==='posted'&&e.payload.originId===link.event_family&&e.payload.date<cutoff).reduce((s:bigint,e:any)=>s+BigInt(e.payload.amount.value),0n);return gross-refund;}
export function planForecast(f:any,snap:any,horizon:string,now:number) {
 const items:any[]=[],cutoff=addDays(dateAt(now),1);let cash=BigInt(snap.cash.value?.value??'0'),assets=snap.assets.value===null?null:BigInt(snap.assets.value.value);
 for(const r of f.plans)for(const o of occurrences(r,horizon)){const links=f.links.filter((l:any)=>l.active&&l.plan_id===r.id&&l.payload.planItemVersion===r.version&&l.payload.occurrenceId===o.id),actual=links.reduce((s:bigint,l:any)=>s+eligibleActual(f,l,cutoff),0n),planned=money(r.payload.amount.value),remaining=planned>actual?planned-actual:0n,overspend=actual>planned?actual-planned:0n;
  const sign=r.payload.kind==='income'?1n:-1n;cash+=sign*remaining;if(assets!==null&&r.payload.kind!=='investment')assets+=sign*remaining;
  items.push({item:planDTO(f,r),occurrenceId:o.id,date:o.date,actual:vnd(actual),remaining:vnd(remaining),overspend:vnd(overspend),links:links.map((l:any)=>({id:l.id,version:l.version,...l.payload}))});
 }return {version:snap.version,horizon,actualCash:snap.cash,actualAssets:snap.assets,forecastCash:metric(snap.cash.value?cash:null,now,'planned'),forecastAssets:metric(assets,now,'planned','MISSING_PRICE'),items,assumptions:['Remaining occurrences include overdue amounts; planned amounts are not actual or funded.','Investment transfers simulated cash into assets; no actual postings.']};
}
