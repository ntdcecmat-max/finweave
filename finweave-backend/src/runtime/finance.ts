import type { Tx } from './uow.ts';
import type { Actor } from './identity.ts';
import type { Config } from './config.ts';
import type { Envelope } from './contracts.ts';
import { authorizeWorkspace,workspaceOperation,page } from './workspace.ts';
import { command } from './replay.ts';
import { token,jcs,sha } from './crypto.ts';
import { fail } from './errors.ts';
import { money,decimal,sumMoney,EngineInputError } from '../engine/exact.ts';
import { posting,quantity,formatQuantity } from '../engine/posting.ts';
import { object,history,histories,eventRevision,group,balance,vnd,metric,accountProjection,holdingProjection,holdingQuantity,eventProjection } from './finance-store.ts';
import { previewCheck,previewDigest } from './finance-preview.ts';
import { businessMutations,applyBusiness,facts,checkContext,defaultContext } from './business.ts';
import { eventDTO,overview,dateAt,addDays } from '../engine/business.ts';
export const financeMutations=['createHolding','confirmHolding','updateHoldingQuantity','updateHoldingCost','recordPriceQuote','createEvent','updateDraft','postDraft','correctPostedEvent','linkRefund','updateCategory','recordCashCount','resolveReviewCase','updateTrackingSettings'];
export const financeOperations=[...financeMutations,'previewMutation','previewHolding','listHoldings','getHolding','listHoldingMovements','listPriceQuotes','searchInstruments','getGoldProfiles','listTransactions','getTransaction','getReviewCase','listReviewCases'];
const needsPreview=new Set(['createHolding','updateHoldingQuantity','updateHoldingCost','recordPriceQuote','correctPostedEvent','linkRefund','postDraft','resolveReviewCase','updateTrackingSettings']);
async function checkVersions(tx:Tx,w:string,versions:Record<string,number>) {
 for(const [id,version] of Object.entries(versions)) {
  let r:any;for(const t of ['accounts','holdings','event_heads','reviews']) {r=await tx.one(`SELECT version FROM fw_finance.${t} WHERE workspace_id=$1 AND id=$2`,[w,id]);if(r)break;}
  if(!r)for(const t of ['plans','goals','links','allocations','forecasts']){r=await tx.one(`SELECT version FROM fw_business.${t} WHERE workspace_id=$1 AND id=$2`,[w,id]);if(r)break;}
  if(!r)fail('NOT_FOUND',404);if(r.version!==version)fail('VERSION_CONFLICT',409);
 }
}
async function catalog(tx:Tx,id:string,kind:string) {const r=await tx.one('SELECT * FROM fw_finance.catalog WHERE id=$1 AND kind=$2',[id,kind]);if(!r)fail('NOT_FOUND',404);return r;}
async function refundLimit(tx:Tx,w:string,p:any,exclude:string|null=null) {
 if(!p.originId)return;
 const origin=await object(tx,w,'event_heads',p.originId);
 const expense=await tx.one("SELECT * FROM fw_finance.event_heads WHERE workspace_id=$1 AND family=$2 AND payload->>'kind'='expense' AND payload->>'posting'='posted'",[w,origin.family]);
 if(!expense||expense.payload.accountId!==p.accountId)fail('VALIDATION',409);
 const refunded=sumMoney((await tx.query("SELECT payload->'amount'->>'value' AS amount FROM fw_finance.event_heads WHERE workspace_id=$1 AND payload->>'kind'='refund' AND payload->>'posting'='posted' AND payload->>'originId'=$2 AND ($3::text IS NULL OR id<>$3)",[w,origin.family,exclude])).rows.map(x=>x.amount));
 if(money(refunded)+money(p.amount.value)>money(expense.payload.amount.value))fail('VALIDATION',409);
 p.originId=origin.family;
}
async function makeReview(tx:Tx,w:string,type:string,p:any) {const id=token();await tx.query('INSERT INTO fw_finance.reviews(workspace_id,id,payload) VALUES($1,$2,$3)',[w,id,{type,title:type+' requires owner review',status:'open',eventId:null,holdingId:null,accountId:null,variance:null,observed:null,rawEvidenceId:null,...p}]);return id;}
// One checked-out Tx and workspace anchor for all module effects.
export async function applyFinance(tx:Tx,a:Actor,w:any,req:Envelope):Promise<{data:any;version:number}> {
 const op=req.operationId,i=req.input,objects=req.mutation!.expectedObjectVersions,touched:Record<string,number>={};
 const checked=async(t:string,id:string)=>{const r=await object(tx,w.id,t,id);if(objects[id]!==r.version)fail('VERSION_CONFLICT',409);return r;};
 const touch=async(t:string,r:any)=>{if(touched[r.id]!==undefined)return;touched[r.id]=r.version+1;await tx.query(`UPDATE fw_finance.${t} SET version=version+1 WHERE workspace_id=$1 AND id=$2`,[w.id,r.id]);};
 const append=async(r:any,p:any)=>{await eventRevision(tx,w.id,r.id,r.version+1,p,r.family);touched[r.id]=r.version+1;await history(tx,a,w.id,r.id,r.version+1,op,i.reason??i.resolution?.reason??null);};
 const move=async(h:any,q:any,date:string,mode:string,eventId:string|null,reason:string)=>{
  if(date<w.tracking_start)fail('VALIDATION');const value=quantity(q.value,q.unit,h.payload.kind),id=token(),version=h.version+1;
  const scaled=(x:string)=>{const d=decimal(x);return d.coefficient*10n**BigInt(8-d.scale);};
  const after=mode==='delta'?formatQuantity(scaled(await holdingQuantity(tx,w.id,h.id,date))+scaled(value)):value;
  await tx.query('INSERT INTO fw_finance.holding_movements(workspace_id,id,holding_id,mode,quantity,business_date,payload) VALUES($1,$2,$3,$4,$5,$6,$7)',[w.id,id,h.id,mode,value,date,{id,holdingId:h.id,version,quantity:{value:after,unit:h.payload.kind==='gold'?'chi':'share'},delta:mode==='delta'?value:null,date,kind:mode==='delta'?'investment':'correction',eventId,reason,evidenceIds:[]}]);
  await holdingQuantity(tx,w.id,h.id);await touch('holdings',h);await history(tx,a,w.id,h.id,version,op,reason);
 };
 const post=async(id:string,version:number,p:any)=>{
  const account=await checked('accounts',p.accountId);if(account.payload.archived||p.date<account.payload.openingDate||p.date<w.tracking_start)fail('VALIDATION');
  if(p.kind==='transfer'){const to=await checked('accounts',p.toAccountId);if(to.payload.archived||p.date<to.payload.openingDate)fail('VALIDATION');if(!p.oneLeg)await touch('accounts',to);}
  if(p.kind==='refund')await refundLimit(tx,w.id,p,id);
  if(p.kind==='investment'){const h=await checked('holdings',p.holdingId);decimal(p.quantity.value,true);await move(h,p.quantity,p.date,'delta',id,'Investment purchase');}
  await group(tx,w.id,id,version,posting(p));await touch('accounts',account);
  if(p.kind==='transfer'&&p.fee.value!=='0') {
   const fid=token(),fee={kind:'expense',amount:p.fee,date:p.date,accountId:p.accountId,description:'Transfer fee',category:'fee',posting:'posted',reference:p.reference,originId:id};
   await eventRevision(tx,w.id,fid,0,fee);await group(tx,w.id,fid,0,posting(fee));touched[fid]=0;await history(tx,a,w.id,fid,0,'transferFee');
  }
 };
 if(op==='createEvent') {
  const id=token(),p={...i};await checked('accounts',p.accountId);
  if(p.toAccountId)await checked('accounts',p.toAccountId);if(p.holdingId)await checked('holdings',p.holdingId);if(p.originId)await checked('event_heads',p.originId);
  if(p.kind==='refund'&&p.originId)await refundLimit(tx,w.id,p);
  p.reconciliation=p.kind==='transfer'&&p.oneLeg||p.kind==='refund'&&!p.originId||p.posting==='pending'?'review':'clear';
  await eventRevision(tx,w.id,id,0,p);touched[id]=0;if(p.posting==='posted')await post(id,0,p);
  if(p.reconciliation==='review') {const rid=await makeReview(tx,w.id,p.posting==='pending'?'pending':p.kind,{eventId:id,accountId:p.accountId});touched[rid]=0;}
  await history(tx,a,w.id,id,0,op);
 } else if(['postDraft','updateDraft','correctPostedEvent','updateCategory','linkRefund'].includes(op)) {
  const r=await checked('event_heads',i.id??i.refundId),p={...r.payload};
  if(op==='updateCategory') {p.category=i.category;p.manualCategoryOverride=true;await append(r,p);}
  else if(op==='updateDraft') {if(!['draft','pending'].includes(p.posting))fail('ACTION_NOT_ALLOWED');p.amount=i.amount;p.description=i.description;await append(r,p);}
  else if(op==='postDraft') {if(!['draft','pending'].includes(p.posting))fail('ACTION_NOT_ALLOWED');p.posting='posted';if(p.kind==='refund')await refundLimit(tx,w.id,p,r.id);await append(r,p);await post(r.id,r.version+1,p);}
  else if(op==='linkRefund') {
   if(p.kind!=='refund'||p.posting!=='posted'||p.originId)fail('ACTION_NOT_ALLOWED');await checked('event_heads',i.originId);p.originId=i.originId;await refundLimit(tx,w.id,p,r.id);p.reconciliation='linked';await append(r,p);
   await group(tx,w.id,r.id,r.version+1,[{ledger:'counter:suspense',amount:p.amount.value},{ledger:'counter:refund',amount:(-money(p.amount.value)).toString()}]);
  } else {
   if(p.posting!=='posted'||p.reversalOf||!['income','expense','refund','adjustment'].includes(p.kind))fail('ACTION_NOT_ALLOWED');
   const original=await tx.one('SELECT * FROM fw_finance.entry_groups WHERE workspace_id=$1 AND event_id=$2 AND reversal_of IS NULL ORDER BY event_version LIMIT 1',[w.id,r.id]);if(!original)fail('ACTION_NOT_ALLOWED');
   if(p.kind==='expense') {
    const refunds=sumMoney((await tx.query("SELECT payload->'amount'->>'value' AS amount FROM fw_finance.event_heads WHERE workspace_id=$1 AND payload->>'originId'=$2 AND payload->>'kind'='refund' AND payload->>'posting'='posted'",[w.id,r.family])).rows.map(x=>x.amount));if(money(i.amount.value)<money(refunds))fail('VALIDATION',409);
   }
   const related=(await tx.query('SELECT * FROM fw_finance.entry_groups WHERE workspace_id=$1 AND event_id=$2 AND reversal_of IS NULL ORDER BY id',[w.id,r.id])).rows;
   const reversal=token(),replacement=token();await append(r,{...p,posting:'reversed'});
   await eventRevision(tx,w.id,reversal,0,{...p,kind:'adjustment',reversalOf:r.id,description:i.reason},r.family);
   for(const g of related) {const lines=(await tx.query('SELECT ledger_id,signed_amount::text FROM fw_finance.posting_lines WHERE workspace_id=$1 AND group_id=$2 ORDER BY line_no',[w.id,g.id])).rows;await group(tx,w.id,reversal,0,lines.map(l=>({ledger:l.ledger_id,amount:(-BigInt(l.signed_amount)).toString()})),g.id);}
   const next={...p,amount:i.amount,description:i.description,originId:p.originId??null};if(next.kind==='adjustment')next.signed=(BigInt(p.signed)<0n?-money(i.amount.value):money(i.amount.value)).toString();
   await eventRevision(tx,w.id,replacement,0,next,r.family);await post(replacement,0,next);touched[reversal]=0;touched[replacement]=0;
   await history(tx,a,w.id,reversal,0,'reversal',i.reason);await history(tx,a,w.id,replacement,0,'replacement',i.reason);
  }
 } else if(op==='createHolding'||op==='confirmHolding') {
  const c=await catalog(tx,i.catalogId,i.kind);
  if(op==='createHolding'&&(i.kind==='gold'&&i.profileConfirmedVersion!==c.version||i.market!==c.payload.exchange&&i.kind==='stock'||i.kind==='gold'&&(i.product!==c.payload.product||i.purity!==c.payload.purity)))fail('UNIT_INCOMPATIBLE');
  if(op==='confirmHolding'&&i.kind==='gold'&&!i.profileConfirmed)fail('UNIT_INCOMPATIBLE');
  const date=i.quantityDate??i.date;if(date<w.tracking_start)fail('VALIDATION');
  const q=quantity(op==='createHolding'?i.quantity.value:i.quantity,op==='createHolding'?i.quantity.unit:c.payload.unit,i.kind);
  if(i.existingId) {
   const h=await checked('holdings',i.existingId);if(h.payload.catalogId!==c.id||h.payload.kind!==i.kind)fail('UNIT_INCOMPATIBLE');await move(h,{value:q,unit:c.payload.unit},date,'set',null,'Owner declaration');
   await tx.query('UPDATE fw_finance.holdings SET payload=payload||$3::jsonb WHERE workspace_id=$1 AND id=$2',[w.id,h.id,{cost:i.cost===null?null:vnd(i.cost),costDate:i.cost===null?null:date,costQuantity:i.cost===null?null:{value:q,unit:c.payload.unit}}]);
  } else {
   const id=token(),cost=op==='createHolding'?i.cost:i.cost===null?null:vnd(i.cost),p={name:op==='createHolding'?i.name:c.payload.name,kind:i.kind,quantityDate:date,market:c.payload.exchange??'VN',product:c.payload.product??null,purity:c.payload.purity??null,cost,costDate:cost?(i.costDate??date):null,costQuantity:cost?{value:q,unit:c.payload.unit}:null,archived:false,catalogId:c.id,profileConfirmedVersion:c.version};
   await tx.query('INSERT INTO fw_finance.holdings(workspace_id,id,payload) VALUES($1,$2,$3)',[w.id,id,p]);const mid=token();
   await tx.query('INSERT INTO fw_finance.holding_movements(workspace_id,id,holding_id,mode,quantity,business_date,payload) VALUES($1,$2,$3,$4,$5,$6,$7)',[w.id,mid,id,'set',q,date,{id:mid,holdingId:id,version:0,quantity:{value:q,unit:c.payload.unit},delta:null,date,kind:'declaration',eventId:null,reason:'Owner declaration',evidenceIds:[]}]);
   touched[id]=0;await history(tx,a,w.id,id,0,op);
  }
 } else if(['updateHoldingQuantity','updateHoldingCost','recordPriceQuote'].includes(op)) {
  const h=await checked('holdings',i.id??i.holdingId);
  if(op==='updateHoldingQuantity')await move(h,i.quantity,i.date,'set',null,i.reason);
  else if(op==='updateHoldingCost') {
   if(i.date<w.tracking_start)fail('VALIDATION');const q=await holdingQuantity(tx,w.id,h.id,i.date);
   await tx.query('UPDATE fw_finance.holdings SET payload=payload||$3::jsonb WHERE workspace_id=$1 AND id=$2',[w.id,h.id,{cost:i.cost,costDate:i.cost?i.date:null,costQuantity:i.cost?{value:q,unit:h.payload.kind==='gold'?'chi':'share'}:null}]);await touch('holdings',h);await history(tx,a,w.id,h.id,h.version+1,op,i.reason);
  } else {
   const c=await catalog(tx,h.payload.catalogId,h.payload.kind);
   decimal(i.price.value,true);if(i.fxVndPerUsd!==null)decimal(i.fxVndPerUsd,true);
   if(!i.compatible||h.payload.kind==='stock'&&i.price.per!=='share'||h.payload.kind==='gold'&&!['chi','luong'].includes(i.price.per)||i.sourceId!=='manual-owner'||new Date(i.at).getTime()>a.now||i.price.currency==='USD'&&(!i.fxVndPerUsd||!i.fxAt)||i.price.currency==='USD'&&new Date(i.fxAt).getTime()>a.now)fail('UNIT_INCOMPATIBLE');
   const id=token(),p={id,version:0,...i,evidenceIds:[],quoteAsOf:i.at,fetchedAt:new Date(a.now).toISOString(),instrumentId:h.payload.kind==='stock'?c.id:null,goldProfileId:h.payload.kind==='gold'?c.id:null,side:h.payload.kind==='stock'?'close':c.payload.side,quality:'fresh'};
   await tx.query('INSERT INTO fw_finance.quotes VALUES($1,$2,$3,$4)',[w.id,id,h.id,p]);await touch('holdings',h);touched[id]=0;await history(tx,a,w.id,h.id,h.version+1,op);
  }
 } else if(op==='recordCashCount') {
  const account=await checked('accounts',i.accountId);if(account.payload.kind!=='cash')fail('ACTION_NOT_ALLOWED');
  const b=await balance(tx,w.id,account.id),id=token();await tx.query('INSERT INTO fw_finance.cash_observations(workspace_id,id,account_id,observed,cutoff_version) VALUES($1,$2,$3,$4,$5)',[w.id,id,account.id,i.observed.value,w.version]);
  const rid=await makeReview(tx,w.id,'cash',{accountId:account.id,observed:i.observed,variance:vnd((money(i.observed.value)-money(b,'signed')).toString()),observationId:id});touched[rid]=0;await history(tx,a,w.id,rid,0,op,i.reason);
 } else if(op==='resolveReviewCase') {
  const r=await checked('reviews',i.id),p={...r.payload},res=i.resolution;if(p.status!=='open')fail('ACTION_NOT_ALLOWED');
  if(res.action==='defer'){} else if(p.type==='cash'&&['adjustUnknown','forgottenExpense'].includes(res.action)) {
   const account=await checked('accounts',p.accountId),difference=money(p.observed.value)-money(await balance(tx,w.id,account.id),'signed');
   if(res.action==='forgottenExpense'&&difference>=0n)fail('ACTION_NOT_ALLOWED');
   if(difference!==0n) {const id=token(),e={kind:res.action==='forgottenExpense'?'expense':'adjustment',amount:vnd((difference<0n?-difference:difference).toString()),signed:difference.toString(),date:new Date(a.now+7*3600000).toISOString().slice(0,10),accountId:p.accountId,description:res.reason,category:res.category??'unknown-adjustment',posting:'posted',reference:null};await eventRevision(tx,w.id,id,0,e);await post(id,0,e);touched[id]=0;await history(tx,a,w.id,id,0,'cashCountResolution',res.reason);}
   p.status='resolved';
  } else if(p.type==='transfer'&&res.action==='confirmTransfer') {
   const e=await checked('event_heads',p.eventId),to=await checked('accounts',e.payload.toAccountId);if(e.payload.posting!=='posted'||!e.payload.oneLeg||to.payload.archived)fail('ACTION_NOT_ALLOWED');
   await group(tx,w.id,e.id,e.version,[{ledger:'counter:transfer',amount:(-money(e.payload.amount.value)).toString()},{ledger:'asset:'+to.id,amount:e.payload.amount.value}]);await touch('accounts',to);await append(e,{...e.payload,oneLeg:false,reconciliation:'linked'});p.status='resolved';
  } else if(p.type==='pending'&&['postPending','rejectPending'].includes(res.action)) {
   const e=await checked('event_heads',p.eventId);if(e.payload.posting!=='pending')fail('ACTION_NOT_ALLOWED');const next={...e.payload,posting:res.action==='postPending'?'posted':'draft',reconciliation:'clear'};await append(e,next);if(res.action==='postPending')await post(e.id,e.version+1,next);p.status='resolved';
  } else if(p.type==='refund'&&res.action==='linkRefund'){
   const e=await checked('event_heads',p.eventId);if(e.payload.kind!=='refund'||e.payload.posting!=='posted'||e.payload.originId)fail('ACTION_NOT_ALLOWED');await checked('event_heads',res.originId);const next={...e.payload,originId:res.originId,reconciliation:'linked'};await refundLimit(tx,w.id,next,e.id);await append(e,next);await group(tx,w.id,e.id,e.version+1,[{ledger:'counter:suspense',amount:e.payload.amount.value},{ledger:'counter:refund',amount:(-money(e.payload.amount.value)).toString()}]);p.status='resolved';
  } else if(p.type==='category'&&res.action==='categorize'){
   const e=await checked('event_heads',p.eventId);await append(e,{...e.payload,category:res.category,manualCategoryOverride:true,reconciliation:'clear'});p.status='resolved';
  } else if(p.type==='quality'&&res.action==='acknowledgeQuality'||p.type==='invalid'&&res.action==='dismissInvalid'){p.status='resolved';}
  else if(p.type==='invalid'&&res.action==='supplementInvalid'){
   const id=token(),event={...res.event};await checked('accounts',event.accountId);if(event.toAccountId)await checked('accounts',event.toAccountId);if(event.holdingId)await checked('holdings',event.holdingId);if(event.originId)await checked('event_heads',event.originId);if(event.kind==='refund'&&event.originId)await refundLimit(tx,w.id,event);event.reconciliation=event.posting==='pending'||event.kind==='transfer'&&event.oneLeg||event.kind==='refund'&&!event.originId?'review':'clear';await eventRevision(tx,w.id,id,0,event);if(event.posting==='posted')await post(id,0,event);if(event.reconciliation==='review'){const rid=await makeReview(tx,w.id,event.posting==='pending'?'pending':event.kind,{eventId:id,accountId:event.accountId,rawEvidenceId:p.rawEvidenceId});touched[rid]=0;}touched[id]=0;await history(tx,a,w.id,id,0,'supplementInvalid',res.reason);p.eventId=id;p.status='resolved';
  }else if(p.type==='duplicate'&&res.action==='mergeDuplicate'){
   if(!p.eventId)fail('ACTION_NOT_ALLOWED');const candidate=await checked('event_heads',p.eventId);
   if(candidate.payload.posting==='pending'){
    const e=candidate.payload,canonical=await tx.one("SELECT * FROM fw_finance.event_heads WHERE workspace_id=$1 AND id<>$2 AND payload->>'accountId'=$3 AND payload->>'kind'=$4 AND payload->'amount'=$5 AND payload->>'reference'=$6 AND payload->>'posting'='posted' ORDER BY id LIMIT 1",[w.id,candidate.id,e.accountId,e.kind,e.amount,e.reference]);if(!canonical)fail('ACTION_NOT_ALLOWED');if(objects[canonical.id]!==canonical.version)fail('VERSION_CONFLICT',409);await append(candidate,{...e,posting:'draft',reconciliation:'linked'});p.eventId=canonical.id;
   }else if(candidate.payload.posting!=='posted')fail('ACTION_NOT_ALLOWED');p.status='resolved';
  }else fail('ACTION_NOT_ALLOWED');
  await tx.query('UPDATE fw_finance.reviews SET payload=$3 WHERE workspace_id=$1 AND id=$2',[w.id,r.id,p]);
  await tx.query('SELECT fw_async.resolve_receipt_review($1,$2,$3)',[w.id,r.id,res.action]);await tx.query('SELECT fw_business.receipt_decision($1,$2,$3)',[w.id,r.id,res.action]);await touch('reviews',r);await history(tx,a,w.id,r.id,r.version+1,op,res.reason);
 } else if(op==='updateTrackingSettings') {
  const earliest=await tx.one("SELECT min(d) AS date FROM (SELECT payload->>'openingDate' AS d FROM fw_finance.accounts WHERE workspace_id=$1 UNION ALL SELECT payload->>'date' FROM fw_finance.event_heads WHERE workspace_id=$1 UNION ALL SELECT business_date FROM fw_finance.holding_movements WHERE workspace_id=$1) x",[w.id]);if(earliest?.date&&i.trackingStart>earliest.date)fail('VALIDATION');
  await tx.query('UPDATE fw_finance.workspaces SET tracking_start=$2 WHERE id=$1',[w.id,i.trackingStart]);await history(tx,a,w.id,w.id,w.version+1,op,i.reason);
 } else fail('ACTION_NOT_ALLOWED');
 await tx.query('UPDATE fw_finance.workspaces SET version=version+1 WHERE id=$1',[w.id]);
 const version=w.version+1;
 return {data:op==='confirmHolding'?{id:Object.keys(touched)[0],version:Object.values(touched)[0]}:{operationId:op,workspaceVersion:version,objectVersions:touched,affectedIds:Object.keys(touched),replayed:false},version};
}
export async function financeOperation(tx:Tx,config:Config,a:Actor,req:Envelope):Promise<any> {
 try {
 const w=await authorizeWorkspace(tx,a,req),op=req.operationId,i=req.input;
 if(op==='previewMutation')return await command(tx,config,a.identity.id,req,w.version,async()=>{
  if(!financeMutations.includes(i.operationId)&&!businessMutations.includes(i.operationId)&&!['createAccount','archiveAccount'].includes(i.operationId))fail('ACTION_NOT_ALLOWED');
  if(i.expectedWorkspaceVersion!==w.version)fail('VERSION_CONFLICT',409);await checkVersions(tx,w.id,i.expectedObjectVersions);
  const before=await snapshot(tx,w,a.now),probe={...req,operationId:i.operationId,input:i.input,mutation:{...req.mutation!,expectedWorkspaceVersion:w.version,expectedObjectVersions:i.expectedObjectVersions,previewToken:null}};
  await tx.query('SAVEPOINT preview_effect');
  let after:any;
  try {if(['createAccount','archiveAccount'].includes(probe.operationId))await workspaceOperation(tx,config,a,probe,true);else if(businessMutations.includes(probe.operationId))await applyBusiness(tx,a,w,probe);else await applyFinance(tx,a,w,probe);await tx.query('SET CONSTRAINTS ALL IMMEDIATE');after=await snapshot(tx,(await tx.one('SELECT * FROM fw_finance.workspaces WHERE id=$1',[w.id]))!,a.now);}finally{await tx.query('ROLLBACK TO SAVEPOINT preview_effect');await tx.query('RELEASE SAVEPOINT preview_effect');}
  const id=token(),expiresAt=new Date(a.now+5*60000).toISOString(),digest=previewDigest(i.operationId,i.input,w.version,i.expectedObjectVersions);
  await tx.query('INSERT INTO fw_finance.previews VALUES($1,$2,$3,$4,$5,$6,$7)',[w.id,id,a.identity.id,w.version,digest,expiresAt,i]);
  return {data:{previewToken:id,operationId:i.operationId,workspaceVersion:w.version,expiresAt,before,after,warnings:businessMutations.includes(i.operationId)?['Plan/Goal changes preserve actual cash; referenced Plan/Goal versions identify the proposed changes.']:[],classification:businessMutations.includes(i.operationId)?'planned':'actual'},version:w.version};
 });
 if(op==='previewHolding')return await command(tx,config,a.identity.id,req,w.version,async()=>{
  await checkVersions(tx,w.id,req.mutation!.expectedObjectVersions);const c=await catalog(tx,i.catalogId,i.kind);quantity(i.quantity,c.payload.unit,i.kind);if(i.date<w.tracking_start||i.kind==='gold'&&!i.profileConfirmed)fail('UNIT_INCOMPATIBLE');if(i.existingId){const h=await object(tx,w.id,'holdings',i.existingId);if(req.mutation!.expectedObjectVersions[h.id]!==h.version)fail('VERSION_CONFLICT',409);if(h.payload.catalogId!==c.id||h.payload.kind!==i.kind)fail('UNIT_INCOMPATIBLE');}
  decimal(i.quantity,true);
  await tx.query('SAVEPOINT holding_preview_effect');
  try {await applyFinance(tx,a,w,{...req,operationId:'confirmHolding'});await tx.query('SET CONSTRAINTS ALL IMMEDIATE');await snapshot(tx,{...w,version:w.version+1},a.now);}finally{await tx.query('ROLLBACK TO SAVEPOINT holding_preview_effect');await tx.query('RELEASE SAVEPOINT holding_preview_effect');}
  const id=token(),digest=previewDigest('confirmHolding',i,w.version,req.mutation!.expectedObjectVersions),expiresAt=new Date(a.now+5*60000).toISOString();await tx.query('INSERT INTO fw_finance.previews VALUES($1,$2,$3,$4,$5,$6,$7)',[w.id,id,a.identity.id,w.version,digest,expiresAt,{input:i,catalogVersion:c.version}]);return {data:{token:id,expiresAt,name:c.payload.name,unit:c.payload.unit,version:w.version,digest},version:w.version};
 });
 if(financeMutations.includes(op))return await command(tx,config,a.identity.id,req,w.version,async()=>{
  await checkVersions(tx,w.id,req.mutation!.expectedObjectVersions);
  if(op==='confirmHolding') {const {token:pt,digest,...input}=i,p=await tx.one('SELECT * FROM fw_finance.previews WHERE workspace_id=$1 AND id=$2 AND subject_id=$3',[w.id,pt,a.identity.id]);if(!p||digest!==p.digest||digest!==previewDigest(op,input,w.version,req.mutation!.expectedObjectVersions))fail('PREVIEW_MISMATCH',409);if(new Date(p.expires_at).getTime()<=await tx.now())fail('PREVIEW_EXPIRED',409);if(p.version!==w.version)fail('STALE_PROPOSAL',409);const c=await catalog(tx,i.catalogId,i.kind);if(p.payload.catalogVersion!==c.version)fail('STALE_PROPOSAL',409);}
  else if(needsPreview.has(op)||op==='createEvent'&&i.posting==='posted'||req.mutation!.previewToken)await previewCheck(tx,a,w,req);
  return applyFinance(tx,a,w,req);
 });
 if(i.context) {
  const frozen=await facts(tx,w,i.context.snapshotVersion),f=frozen.payload;checkContext(f,i.context);const clockEnd=addDays(dateAt(new Date(frozen.recorded_at).getTime()),1),cutoff=i.context.period.endExclusive<clockEnd?i.context.period.endExclusive:clockEnd;
  if(op==='getTransaction'){const r=f.events.find((r:any)=>r.id===i.id);if(!r||r.payload.date>=cutoff||r.payload.date<i.context.period.start||i.context.accountIds.length&&!i.context.accountIds.includes(r.payload.accountId)&&!i.context.accountIds.includes(r.payload.toAccountId))fail('NOT_FOUND',404);return {data:eventDTO(f,r),version:frozen.version};}
  if(op==='getHolding'){const h=overview(f,w.id,frozen.version,i.context,new Date(frozen.recorded_at).getTime()).holdings.find((h:any)=>h.id===i.id);if(!h)fail('NOT_FOUND',404);if(h.quantity===null)fail('INSUFFICIENT_DATA',409);return {data:h,version:frozen.version};}
 }
 if(op==='getHolding'){const row=await facts(tx,w),h=overview(row.payload,w.id,row.version,defaultContext(w,a.now),new Date(row.recorded_at).getTime()).holdings.find((h:any)=>h.id===i.id);if(!h)fail('NOT_FOUND',404);return {data:h,version:row.version};}
 if(op==='getTransaction'){const row=await facts(tx,w),r=row.payload.events.find((r:any)=>r.id===i.id);if(!r||r.payload.date>=addDays(dateAt(new Date(row.recorded_at).getTime()),1))fail('NOT_FOUND',404);return {data:eventDTO(row.payload,r),version:row.version};}
 if(op==='getReviewCase')return {data:await reviewProjection(tx,await object(tx,w.id,'reviews',i.id)),version:w.version};
 if(op==='listHoldings')return page(tx,req,"SELECT * FROM fw_finance.holdings WHERE workspace_id=$1 AND ($2='all' OR payload->>'kind'=$2) ORDER BY id",[w.id,i.kind],r=>holdingProjection(tx,r,a.now),w.version);
 if(op==='listHoldingMovements') {await object(tx,w.id,'holdings',i.id);return page(tx,req,'SELECT id,payload FROM fw_finance.holding_movements WHERE workspace_id=$1 AND holding_id=$2 ORDER BY id',[w.id,i.id],r=>r.payload,w.version);}
 if(op==='listPriceQuotes') {await object(tx,w.id,'holdings',i.holdingId);return page(tx,req,"SELECT id,payload FROM fw_finance.quotes WHERE workspace_id=$1 AND holding_id=$2 AND (payload->>'at')::timestamptz<=$3 ORDER BY id",[w.id,i.holdingId,i.asOf],r=>r.payload,w.version);}
 if(op==='searchInstruments'||op==='getGoldProfiles')return page(tx,req,"SELECT id,payload FROM fw_finance.catalog WHERE kind=$1 AND ($2::text IS NULL OR payload->>'exchange'=$2) AND ($3='' OR payload->>'symbol' ILIKE '%'||$3||'%' OR payload->>'name' ILIKE '%'||$3||'%') ORDER BY id",[op==='getGoldProfiles'?'gold':'stock',i.exchange??null,i.query??''],r=>r.payload,w.version);
 if(op==='listReviewCases')return page(tx,req,"SELECT * FROM fw_finance.reviews WHERE workspace_id=$1 AND ($2='all' OR payload->>'type'=$2) AND ($3='all' OR payload->>'status'=$3) ORDER BY id",[w.id,i.type,i.status],r=>reviewProjection(tx,r),w.version);
 if(op==='listTransactions') {
  const frozen=await facts(tx,w,i.context.snapshotVersion),f=frozen.payload;checkContext(f,i.context);const clockEnd=addDays(dateAt(new Date(frozen.recorded_at).getTime()),1),cutoff=i.context.period.endExclusive<clockEnd?i.context.period.endExclusive:clockEnd;
  if(i.accountId&&!f.accounts.some((a:any)=>a.id===i.accountId)||i.planItemId&&!f.plans.some((p:any)=>p.id===i.planItemId))fail('NOT_FOUND',404);
  const rows=f.events.filter((r:any)=>{const p=r.payload;return p.kind!=='opening'&&(!i.planItemId||f.links.some((l:any)=>l.active&&l.plan_id===i.planItemId&&l.event_family===r.family))&&p.date>=i.context.period.start&&p.date<cutoff&&(i.kind==='all'||p.kind===i.kind)&&(i.posting==='all'||p.posting===i.posting)&&(i.reconciliation==='all'||(p.reconciliation??'clear')===i.reconciliation)&&(!i.category||p.category===i.category)&&(!i.accountId||p.accountId===i.accountId||p.toAccountId===i.accountId)&&(!i.context.accountIds.length||i.context.accountIds.includes(p.accountId)||i.context.accountIds.includes(p.toAccountId))&&p.description.toLowerCase().includes(i.search.toLowerCase());}).sort((a:any,b:any)=>a.payload.date.localeCompare(b.payload.date)||a.id.localeCompare(b.id));
  if(i.sort==='date_desc_id')rows.reverse();let start=0;if(i.page.cursor){const index=rows.findIndex((r:any)=>r.id===i.page.cursor);if(index<0)fail('CURSOR_INVALID');start=index+1;}const selected=rows.slice(start,start+i.page.pageSize);
  const items=selected.map((r:any)=>eventDTO(f,r));
  return {data:{items,nextCursor:start+selected.length<rows.length?selected.at(-1)!.id:null,snapshotVersion:frozen.version,totalCount:null},version:frozen.version};
 }
 fail('ACTION_NOT_ALLOWED');
 } catch(e) {if(e instanceof EngineInputError)fail(e.code==='UNIT_INCOMPATIBLE'?'UNIT_INCOMPATIBLE':'VALIDATION');throw e;}
}
async function reviewProjection(tx:Tx,r:any) {const {observationId,receiptId,...p}=r.payload;return {id:r.id,version:r.version,...p,history:await histories(tx,r.workspace_id,r.id)};}
async function snapshot(tx:Tx,w:any,now:number) {
 const f=(await facts(tx,w)).payload;return overview(f,w.id,w.version,{period:{start:w.tracking_start,endExclusive:new Date(now+7*3600000+86400000).toISOString().slice(0,10),timezone:'Asia/Ho_Chi_Minh'},accountIds:[],snapshotVersion:w.version},now);
}
