import { histories,defaultProjection } from '../engine/business.ts';
// Financial entities come exclusively from the same immutable facts closure.
// Saved simulations and import job metadata are auxiliary records, never ledger inputs.
export function presentation(f:any,version:number,now:number,w:any,simulations:any[]=[],imports:any[]=[]) {
 const h=(id:string)=>histories(f,id).map((p:any)=>`${p.at} ${p.action}${p.reason?' — '+p.reason:''}`);
 const money=(m:any)=>m?.value?.value??null;
 return {currency:'VND',timezone:'Asia/Ho_Chi_Minh',snapshotVersion:version,data:{version,scenario:'server-local',clock:new Date(now).toISOString(),tracking:f.tracking??w.tracking_start,
 accounts:f.accounts.map((r:any)=>({id:r.id,name:r.payload.name,kind:r.payload.kind,opening:r.payload.opening.value,date:r.payload.openingDate,archived:r.payload.archived,source:'manual-owner'})),
 events:f.events.filter((r:any)=>r.payload.kind!=='opening').map((r:any)=>{const p=r.payload,l=f.links.find((l:any)=>l.active&&l.event_family===r.family);return {id:r.id,kind:p.kind,amount:p.amount.value,date:p.date,account:p.accountId,...(p.toAccountId?{to:p.toAccountId}:{}),category:p.category,description:p.description,posting:p.posting,reconciliation:p.reconciliation??'clear',source:p.screenshotId?'Ảnh giao dịch':p.evidenceIds?.length?'evidence':'manual-owner',version:r.version,history:h(r.id),...(p.reference?{reference:p.reference}:{}),...(p.originId?{origin:p.originId}:{}),...(p.reversalOf?{reversal:true}:{}),...(p.oneLeg!==undefined?{oneLeg:p.oneLeg}:{}),...(p.holdingId?{holding:p.holdingId}:{}),...(p.manualCategoryOverride?{override:true}:{}),...(l?{plan:l.plan_id,planVersion:l.payload.planItemVersion}:{})};}),
 holdings:f.holdings.map((r:any)=>{const p=r.payload,m=f.movements.filter((m:any)=>m.holding_id===r.id);return {id:r.id,name:p.name,kind:p.kind,market:p.market,product:p.product??'',purity:p.purity??'',unit:p.kind==='gold'?'chi':'share',quantity:m.at(-1)?.payload.quantity.value??'0',date:p.quantityDate,source:'server',archived:p.archived,...(p.cost?{cost:{amount:p.cost.value,date:p.costDate,quantity:p.costQuantity.value,source:'manual-owner'}}:{}),quantities:m.map((m:any)=>({quantity:m.payload.quantity.value,date:m.business_date,reason:m.payload.reason})),quotes:f.quotes.filter((q:any)=>q.holding_id===r.id).map((q:any)=>({price:q.payload.price.value,currency:q.payload.price.currency,unit:q.payload.price.per,date:q.payload.at,source:q.payload.sourceId,compatible:q.payload.compatible,...(q.payload.fxVndPerUsd?{fx:q.payload.fxVndPerUsd,fxDate:q.payload.fxAt}:{})}))};}),
 sources:f.sources.map((s:any)=>({id:s.id,name:s.id,kind:s.kind,connection:s.enabled?'connected':'disconnected',lastSuccess:s.last_success?new Date(s.last_success).toISOString():null,lastAttempt:s.last_attempt?new Date(s.last_attempt).toISOString():null,version:s.version})),
 reviews:f.reviews.map((r:any)=>({id:r.id,type:r.payload.type,title:r.payload.title,status:r.payload.status,history:h(r.id),...(r.payload.eventId?{event:r.payload.eventId}:{}),...(r.payload.accountId?{account:r.payload.accountId}:{}),...(r.payload.holdingId?{holding:r.payload.holdingId}:{}),...(r.payload.observed?{observed:r.payload.observed.value}:{}),...(r.payload.rawEvidenceId?{raw:r.payload.rawEvidenceId}:{})})),
 plans:f.plans.map((r:any)=>{const p=r.payload;return {id:r.id,name:p.name,kind:p.kind,amount:p.amount.value,account:p.accountId,date:p.start,end:p.end,recurrence:p.recurrence,day:p.dayOfMonth,category:p.category,archived:p.archived,version:r.version,baselineCash:p.baselineCash?.value??null,baselineAssets:p.baselineAssets?.value??null,history:h(r.id),...(p.holdingId?{holding:p.holdingId}:{})};}),
 goals:f.goals.map((r:any)=>{const p=r.payload,c=p.contributionSchedule;return {id:r.id,name:p.name,target:p.target.value,due:p.due,status:p.status,projection:p.projection??defaultProjection,allocations:f.allocations.filter((al:any)=>al.active&&al.goal_id===r.id).map((al:any)=>({id:al.id,account:al.account_id,amount:al.amount,date:al.business_date})),history:h(r.id),...(c?{contributionSchedule:{amount:c.amount.value,account:c.accountId,start:c.start,day:c.dayOfMonth,skipMonths:c.skipMonths??[]}}:{})};}),
 simulations:simulations.map((p:any)=>({id:p.id,goal:p.goalId,mode:p.mode,amount:p.amount.value,count:p.count,account:p.accountId,horizon:p.horizon,steps:p.steps.map((s:any)=>({...s,amount:s.amount.value})),cash:money(p.cash),assets:money(p.assets),gross:money(p.grossExpense)??'0',net:money(p.netExpense)??'0',baseGross:money(p.baseGrossExpense)??'0',baseNet:money(p.baseNetExpense)??'0',baseCash:money(p.baseCash),baseAssets:money(p.baseAssets),goalFunded:money(p.goalFunded)??'0',assumptions:p.assumptions,version:p.version,context:JSON.stringify(p.context)})),
 imports:imports.map((p:any)=>({id:p.id,payload:p.state,account:p.accountId,selected:JSON.stringify(p.selectedRowIds),mapping:JSON.stringify({profileVersion:p.profileVersion,mappingVersion:p.mappingVersion}),history:h(p.id)})),
 audit:f.history.map((r:any)=>`${r.payload.at} ${r.payload.action} ${r.object_id}`),counter:version,fault:'none'}};
}

// Evidence's public wire contract is a string map. Keep nested/long declarations
// losslessly in deterministic JSON chunks instead of truncating or leaking raw receipts.
export function evidenceWire(p:any) {
 if(!p.content?.normalizedFields)return p;
 const fields:Record<string,string>={};let n=0;
 for(const [key,value]of Object.entries(p.content.normalizedFields)){
  if(key.length<=100&&typeof value==='string'&&value.length<=1000&&!key.startsWith('json_chunk_'))fields[key]=value;
  else {const encoded=JSON.stringify([key,value]);for(let at=0,part=0;at<encoded.length;at+=1000,part++)fields[`json_chunk_${n}_${part}`]=encoded.slice(at,at+1000);n++;}
 }
 return {...p,content:{...p.content,normalizedFields:fields}};
}
