import assert from 'node:assert/strict';
import { Pool } from 'pg';
import type { Config,Profile } from '../src/runtime/config.ts';
import { buildApp } from '../src/runtime/app.ts';
import { contract,revision,validator } from '../src/runtime/contracts.ts';
import { token } from '../src/runtime/crypto.ts';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { unitOfWork } from '../src/runtime/uow.ts';
import { group,eventRevision } from '../src/runtime/finance-store.ts';
export async function runFinanceTests(admin:Pool,configs:Record<Profile,Config>,python:string) {
 const pool=new Pool({connectionString:configs.user.databaseUrl,max:8});pool.on('error',()=>{});
 let fault:'ack'|'disconnect'|'bundle'|null=null;
 const proxy={async connect(){const client=await pool.connect();return {async query(sql:string,values?:any[]){
  if(fault==='bundle'&&sql.startsWith('UPDATE fw_finance.workspaces SET version=version+1')){fault=null;throw Error('Injected failure after ledger/quantity before version/replay');}
  if(sql==='COMMIT'&&fault){const f=fault;fault=null;if(f==='ack'){await client.query(sql);throw Error('Injected lost COMMIT acknowledgement');}
   const pid=(await client.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;await admin.query('SELECT pg_terminate_backend($1)',[pid]);throw Error('Disconnected before COMMIT was sent');}
  return client.query(sql,values);
 },on(event:"error",listener:()=>void){client.on(event,listener);},removeListener(event:"error",listener:()=>void){client.removeListener(event,listener);},release(broken:boolean){client.release(broken);}};}} as unknown as Pool;
 const mails:any[]=[],app=await buildApp(configs.user,proxy,{async send(m){mails.push(m);}});
 app.addHook('onError',async(_req,_res,e)=>{if(!(e as any).status)console.error('Finance diagnostic:',e.message);});
 const groups:string[]=[],oracleActions:any[]=[],registry:Record<string,number>={};let workspace='',version=0,auth:any;
 const path=(op:string)=>Object.entries(contract.paths).find(([,p]:any)=>p.post?.operationId===op)![0];
 const headers=(owner:any)=>({'content-type':'application/json','x-fw-contract-revision':revision,'x-fw-client':'web',origin:configs.user.origin,...owner});
 function envelope(op:string,input:any,w:string|null=workspace||null,versions:Record<string,number>=registry):any {return {contractVersion:'2.0.0',requestId:token(),operationId:op,workspaceId:w,input,mutation:contract.components.schemas[op+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:token(),expectedWorkspaceVersion:w?version:null,expectedObjectVersions:{...versions},previewToken:null}};}
 async function send(body:any,owner=auth) {const r=await app.inject({method:'POST',url:path(body.operationId),headers:headers(owner),payload:body}),b:any=r.json();assert(validator(r.statusCode===200?body.operationId+'Reply':'Error')(b),JSON.stringify(b));return {status:r.statusCode,body:b as any,request:body};}
 async function call(op:string,input:any,w:string|null=workspace||null,owner=auth) {return send(envelope(op,input,w),owner);}
 const ok=(r:any)=>{assert.equal(r.status,200,JSON.stringify(r.body));return r.body.data;};
 const track=(r:any)=>{const d=ok(r);version=r.body.workspaceVersion??version;if(d.objectVersions){if(r.request.operationId==='recordPriceQuote')registry[r.request.input.holdingId]=d.objectVersions[r.request.input.holdingId];else Object.assign(registry,d.objectVersions);}return d;};
 const check=(name:string)=>{groups.push(name);console.log('PASS '+name);};
 async function owner(email:string) {
  const h={};const s=ok(await call('registerIdentity',{email,name:'Finance fixture',password:'Synthetic password 2026!',passwordConfirmation:'Synthetic password 2026!',syntheticAcknowledgement:true,installationPublicKey:null},null,h));
  const r=await send(envelope('verifyIdentityChallenge',{challengeId:s.challengeId,code:mails.at(-1).code},null,{}),h);ok(r);
  // Read the issued session cookie from a second login (send exposes envelopes only).
  const start=ok(await call('signIn',{email,password:'Synthetic password 2026!',installationPublicKey:null},null,h));
  const b=envelope('verifyIdentityChallenge',{challengeId:start.challengeId,code:mails.at(-1).code},null,{}),response=await app.inject({method:'POST',url:path(b.operationId),headers:headers(h),payload:b});assert.equal(response.statusCode,200,response.body);
  const cookies=response.headers['set-cookie'] as string[];return {cookie:cookies.map(x=>x.split(';')[0]).join('; '),'x-fw-csrf':cookies[1]!.split(';')[0]!.split('=')[1]!};
 }
 async function prepare(op:string,input:any,versions=registry) {const p=ok(await send(envelope('previewMutation',{operationId:op,input,expectedWorkspaceVersion:version,expectedObjectVersions:{...versions}},workspace,versions)));const b=envelope(op,input,workspace,versions);b.mutation!.previewToken=p.previewToken;return {request:b,preview:p};}
 async function mutate(op:string,input:any) {const p=await prepare(op,input);return track(await send(p.request));}
 const event=(kind:string,accountId:string,amount:string,extra:any={})=>({kind,accountId,amount:{value:amount,currency:'VND'},date:'2026-10-09',description:kind+' fixture',category:kind,posting:'posted',reference:null,...extra});
 let cash='',bank='',wallet='',expenseId='',gold='',stock='';
 try {
  auth=await owner('finance-alice@owner.test');const authB=await owner('finance-bob@owner.test');
  workspace=ok(await call('createWorkspace',{trackingStart:'2026-10-01',currency:'VND',timezone:'Asia/Ho_Chi_Minh'},null)).id;
  const other=ok(await call('createWorkspace',{trackingStart:'2026-10-01',currency:'VND',timezone:'Asia/Ho_Chi_Minh'},null,authB)).id;
  for(const [kind,opening] of [['cash','9007199254740993'],['bank','100000'],['wallet','0']]) {
   const d=await mutate('createAccount',{name:kind,kind,opening:{value:opening,currency:'VND'},openingDate:'2026-10-01'});const id=d.affectedIds[0];if(kind==='cash')cash=id;else if(kind==='bank')bank=id;else wallet=id;oracleActions.push({kind:'opening',account:id,amount:opening});
  }
  assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,'9007199254740993');
  assert.equal((await admin.query("SELECT count(*)::int AS n FROM fw_finance.entry_groups WHERE workspace_id=$1",[workspace])).rows[0].n,2);
  check('cash/bank/wallet openings exact above 2^53, zero opening has no posting group');
  const p=await prepare('createEvent',event('income',cash,'100'));assert.equal(p.preview.before.income.value.value,'0');assert.equal(p.preview.after.income.value.value,'100');assert.equal(p.preview.before.cash.value.value,'9007199254840993');
  assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,'9007199254740993');track(await send(p.request));oracleActions.push({kind:'income',account:cash,amount:'100'});
  const expense=await mutate('createEvent',event('expense',cash,'1000'));expenseId=expense.affectedIds.find((id:string)=>id!==cash)!;oracleActions.push({kind:'expense',account:cash,amount:'1000'});
  await mutate('createEvent',event('transfer',cash,'200',{toAccountId:bank,oneLeg:false,fee:{value:'7',currency:'VND'}}));oracleActions.push({kind:'transfer',account:cash,to:bank,amount:'200',fee:'7'});
  await mutate('createEvent',event('refund',cash,'300',{originId:expenseId}));oracleActions.push({kind:'refund',account:cash,amount:'300'});
  check('preview has no financial effects; income/expense/transfer/fee/refund post atomically');
  const draft=track(await call('createEvent',event('expense',cash,'15',{posting:'draft'}))).affectedIds[0],before=ok(await call('getAccount',{id:cash})).balance.value.value;
  await mutate('updateDraft',{id:draft,amount:{value:'20',currency:'VND'},description:'Edited draft',reason:'Owner edit'});
  assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,before);
  const parallel=await prepare('postDraft',{id:draft,reason:'Owner confirmed'}),duplicates=await Promise.all([send(parallel.request),send({...parallel.request,requestId:token()})]);duplicates.forEach(track);assert.deepEqual(duplicates[0]!.body.data,duplicates[1]!.body.data);oracleActions.push({kind:'expense',account:cash,amount:'20'});
  assert.equal((await admin.query('SELECT count(*)::int AS n FROM fw_finance.entry_groups WHERE workspace_id=$1 AND event_id=$2',[workspace,draft])).rows[0].n,1);
  assert.equal((await send({...parallel.request,input:{id:draft,reason:'changed'}})).body.code,'IDEMPOTENCY_CONFLICT');
  const second=await call('postDraft',{id:draft,reason:'Again'});assert.equal(second.status,409);
  check('parallel postDraft duplicate commands: one effect, exact replay before stale versions, changed payload denied');
  const refundInput=event('refund',cash,'500',{originId:expenseId}),r1=await prepare('createEvent',refundInput),r2=await prepare('createEvent',refundInput),race=await Promise.all([send(r1.request),send(r2.request)]);assert.equal(race.filter(r=>r.status===200).length,1);track(race.find(r=>r.status===200));oracleActions.push({kind:'refund',account:cash,amount:'500'});
  assert.equal(race.find(r=>r.status!==200)!.body.code,'VERSION_CONFLICT');const over=await call('previewMutation',{operationId:'createEvent',input:refundInput,expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}});assert.equal(over.status,409);
  assert.equal((await call('previewMutation',{operationId:'correctPostedEvent',input:{id:expenseId,amount:{value:'799',currency:'VND'},description:'Too small',reason:'Correction'},expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}})).status,409);
  const corrected=await mutate('correctPostedEvent',{id:expenseId,amount:{value:'1200',currency:'VND'},description:'Corrected expense',reason:'Owner correction'});oracleActions.push({kind:'correction',account:cash,originalKind:'expense',old:'1000',amount:'1200'});
  assert.equal(ok(await call('getTransaction',{id:expenseId})).posting,'reversed');assert(corrected.affectedIds.length>=4);
  const reversalId=(await admin.query("SELECT id FROM fw_finance.event_heads WHERE workspace_id=$1 AND payload->>'reversalOf'=$2",[workspace,expenseId])).rows[0].id;
  assert.equal((await call('previewMutation',{operationId:'correctPostedEvent',input:{id:reversalId,amount:{value:'1',currency:'VND'},description:'Cannot edit reversal',reason:'Attempt'},expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}})).body.code,'ACTION_NOT_ALLOWED');
  check('parallel refunds cannot exceed cap; correction under active refunds denied; exact immutable reversal/replacement');
  const stale=await prepare('createEvent',event('income',cash,'12'));await mutate('createEvent',event('income',cash,'11'));oracleActions.push({kind:'income',account:cash,amount:'11'});assert.equal((await send(stale.request)).body.code,'VERSION_CONFLICT');
  const mismatch=await prepare('createEvent',event('income',cash,'12'));assert.equal((await send({...mismatch.request,input:event('income',cash,'13')})).body.code,'PREVIEW_MISMATCH');
  const expire=await prepare('createEvent',event('income',cash,'12'));
  // Expiry is tested against an independently persisted already-expired preview, without mutating immutable rows.
  const expiredId=token();await admin.query('INSERT INTO fw_finance.previews SELECT workspace_id,$2,subject_id,version,digest,clock_timestamp()-interval \'1 second\',payload FROM fw_finance.previews WHERE id=$1',[expire.request.mutation!.previewToken,expiredId]);expire.request.mutation!.previewToken=expiredId;assert.equal((await send(expire.request)).body.code,'PREVIEW_EXPIRED');
  check('stale preview, input mismatch and expiry rejected with no effect');
  const loss=await prepare('createEvent',event('income',cash,'17'));fault='ack';const unknown=await send(loss.request);assert.equal(unknown.body.code,'OUTCOME_UNKNOWN');assert.equal(unknown.body.outcome,'unknown');
  assert.equal(ok(await call('getCommandOutcome',{operationId:'createEvent',idempotencyKey:loss.request.mutation!.idempotencyKey})).state,'committed');track(await send(loss.request));track(await send(loss.request));oracleActions.push({kind:'income',account:cash,amount:'17'});
  const disconnect=await prepare('createEvent',event('income',cash,'19'));fault='disconnect';assert.equal((await send(disconnect.request)).body.code,'OUTCOME_UNKNOWN');assert.equal(ok(await call('getCommandOutcome',{operationId:'createEvent',idempotencyKey:disconnect.request.mutation!.idempotencyKey})).state,'not_found');track(await send(disconnect.request));oracleActions.push({kind:'income',account:cash,amount:'19'});
  check('lost COMMIT acknowledgement and actual backend disconnect: unknown outcome resolved, same-key retry has one effect');
  const bobInput={name:'Bob cash',kind:'cash',opening:{value:'1',currency:'VND'},openingDate:'2026-10-01'},bobPreview=envelope('previewMutation',{operationId:'createAccount',input:bobInput,expectedWorkspaceVersion:0,expectedObjectVersions:{}},other,{});bobPreview.mutation.expectedWorkspaceVersion=0;
  const bp=ok(await send(bobPreview,authB)),bobCreate=envelope('createAccount',bobInput,other,{});bobCreate.mutation.expectedWorkspaceVersion=0;bobCreate.mutation.previewToken=bp.previewToken;const foreign=ok(await send(bobCreate,authB)).affectedIds[0];
  const foreignBodies=[envelope('getAccount',{id:cash},other,{}),envelope('createEvent',event('transfer',cash,'1',{toAccountId:foreign,oneLeg:false,fee:{value:'0',currency:'VND'}})),envelope('createEvent',event('refund',foreign,'1',{originId:expenseId})),envelope('getTransaction',{id:expenseId},other,{})];
  assert.equal((await send(foreignBodies[0],authB)).status,404);for(const b of foreignBodies.slice(1,3)){const input={operationId:b.operationId,input:b.input,expectedWorkspaceVersion:version,expectedObjectVersions:{...registry,[foreign]:0}};assert.equal((await call('previewMutation',input)).status,404);}assert.equal((await send(foreignBodies[3],authB)).status,404);
  check('cross-owner workspace/account/transfer/refund reference and reads denied');
  const sourceBefore=ok(await call('getAccount',{id:cash})).balance.value.value,destinationBefore=ok(await call('getAccount',{id:bank})).balance.value.value;
  const one=await mutate('createEvent',event('transfer',cash,'50',{toAccountId:bank,oneLeg:true,fee:{value:'3',currency:'VND'}})),transferReview=one.affectedIds.find((id:string)=>id!==cash&&id!==bank&&id!==one.affectedIds[0]&&registry[id]===0&&!id.startsWith('asset'));
  const reviews=ok(await call('listReviewCases',{page:{cursor:null,pageSize:100},status:'open',type:'transfer'})).items;const review=reviews.find((r:any)=>r.eventId===one.affectedIds[0]);assert(review);
  assert.equal(ok(await call('getAccount',{id:bank})).balance.value.value,destinationBefore);assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,(BigInt(sourceBefore)-53n).toString());
  await mutate('resolveReviewCase',{id:review.id,resolution:{action:'confirmTransfer',reason:'Owner confirmed receiving leg'}});oracleActions.push({kind:'transfer',account:cash,to:bank,amount:'50',fee:'3'});
  assert.equal((await call('previewMutation',{operationId:'resolveReviewCase',input:{id:review.id,resolution:{action:'confirmTransfer',reason:'Again'}},expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}})).body.code,'ACTION_NOT_ALLOWED');
  const unknownRefund=await mutate('createEvent',event('refund',cash,'10',{originId:null})),unknownRefundId=unknownRefund.affectedIds[0],cashBeforeLink=ok(await call('getAccount',{id:cash})).balance.value.value;
  await mutate('linkRefund',{refundId:unknownRefundId,originId:expenseId,reason:'Matched expense origin'});assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,cashBeforeLink);oracleActions.push({kind:'refund',account:cash,amount:'10'});
  const pending=track(await call('createEvent',event('transfer',bank,'55',{toAccountId:wallet,oneLeg:false,fee:{value:'2',currency:'VND'},posting:'pending'}))),pendingCases=ok(await call('listReviewCases',{page:{cursor:null,pageSize:100},status:'open',type:'pending'})).items;
  assert.equal(ok(await call('getAccount',{id:wallet})).balance.value.value,'0');await mutate('resolveReviewCase',{id:pendingCases.find((r:any)=>r.eventId===pending.affectedIds[0]).id,resolution:{action:'postPending',reason:'Confirmed pending transfer and fee'}});oracleActions.push({kind:'transfer',account:bank,to:wallet,amount:'55',fee:'2'});
  const categoryBefore=ok(await call('getAccount',{id:cash})).balance.value.value;await mutate('updateCategory',{id:unknownRefundId,category:'Owner override',reason:'Owner category'});assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,categoryBefore);assert.equal(ok(await call('getTransaction',{id:unknownRefundId})).manualCategoryOverride,true);
  check('one-leg transfer clearing and receiving-leg confirmation, pending fee atomicity, refund linking and category history have no duplicate cash effects');
  const independentPosting1=await prepare('createEvent',event('income',bank,'21')),independentPosting2=await prepare('createEvent',event('income',bank,'22')),postingRace=await Promise.all([send(independentPosting1.request),send(independentPosting2.request)]);assert.equal(postingRace.filter(r=>r.status===200).length,1);const winner=postingRace.find(r=>r.status===200)!;track(winner);oracleActions.push({kind:'income',account:bank,amount:winner.request.input.amount.value});
  const loser=postingRace.find(r=>r.status!==200)!;assert.equal(loser.body.code,'VERSION_CONFLICT');await mutate('createEvent',loser.request.input);oracleActions.push({kind:'income',account:bank,amount:loser.request.input.amount.value});
  const raceExpense=(await mutate('createEvent',event('expense',bank,'100'))).affectedIds[0];oracleActions.push({kind:'expense',account:bank,amount:'100'});
  const raceCorrectionInput={id:raceExpense,amount:{value:'50',currency:'VND'},description:'Correct race expense',reason:'Correction racing refund'},raceRefundInput=event('refund',bank,'75',{originId:raceExpense});
  const rc=await prepare('correctPostedEvent',raceCorrectionInput),rr=await prepare('createEvent',raceRefundInput),cr=await Promise.all([send(rc.request),send(rr.request)]);assert.equal(cr.filter(r=>r.status===200).length,1);const cw=cr.find(r=>r.status===200)!;track(cw);if(cw.request.operationId==='correctPostedEvent')oracleActions.push({kind:'correction',account:bank,originalKind:'expense',old:'100',amount:'50'});else oracleActions.push({kind:'refund',account:bank,amount:'75'});
  const cl=cr.find(r=>r.status!==200)!;assert.equal(cl.body.code,'VERSION_CONFLICT');assert.equal((await call('previewMutation',{operationId:cl.request.operationId,input:cl.request.input,expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}})).status,409);
  check('different-key parallel postings serialize; correction/refund race revalidates cap and never loses committed effects');
  await mutate('createEvent',event('expense',wallet,'100'));oracleActions.push({kind:'expense',account:wallet,amount:'100'});assert.equal(ok(await call('getAccount',{id:wallet})).balance.value.value,'-45');
  check('recorded actual expense can produce an exact negative balance without a planning funding gate');
  const gp=ok(await call('getGoldProfiles',{page:{cursor:null,pageSize:100}})).items[0];assert.equal(gp.unit,'chi');
  const hInput={existingId:null,kind:'gold',catalogId:gp.id,quantity:'2.5',date:'2026-10-02',cost:'1000',profileConfirmed:true};const hp=ok(await call('previewHolding',hInput));const hr=track(await call('confirmHolding',{...hInput,token:hp.token,digest:hp.digest}));gold=hr.id;registry[gold]=hr.version;oracleActions.push({kind:'declaration',holding:gold,quantity:'2.5',unit:'chi',date:'2026-10-02'});
  const stockInput={name:'Manual stock',kind:'stock',quantity:{value:'3.00000001',unit:'share'},quantityDate:'2026-10-02',market:'HOSE',product:null,purity:null,cost:null,costDate:null,catalogId:'manual-stock',profileConfirmedVersion:null};stock=(await mutate('createHolding',stockInput)).affectedIds[0];oracleActions.push({kind:'declaration',holding:stock,quantity:'3.00000001',unit:'share',date:'2026-10-02'});
  await mutate('updateHoldingQuantity',{id:gold,quantity:{value:'0.3',unit:'luong'},date:'2026-10-03',reason:'Gold declaration'});oracleActions.push({kind:'declaration',holding:gold,quantity:'0.3',unit:'luong',date:'2026-10-03'});
  const inv=event('investment',cash,'33',{holdingId:gold,quantity:{value:'0.12',unit:'chi'}});await mutate('createEvent',inv);oracleActions.push({kind:'investment',account:cash,amount:'33',holding:gold,quantity:'0.12',unit:'chi',date:'2026-10-09',mode:'delta'});
  const rollbackPurchase=await prepare('createEvent',event('investment',cash,'3',{holdingId:gold,quantity:{value:'0.01',unit:'chi'}})),rollbackCash=ok(await call('getAccount',{id:cash})).balance.value.value,rollbackQuantity=ok(await call('getHolding',{id:gold})).quantity.value;
  fault='bundle';assert.equal((await send(rollbackPurchase.request)).body.outcome,'not_committed');assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,rollbackCash);assert.equal(ok(await call('getHolding',{id:gold})).quantity.value,rollbackQuantity);assert.equal(ok(await call('getCommandOutcome',{operationId:'createEvent',idempotencyKey:rollbackPurchase.request.mutation.idempotencyKey})).state,'not_found');track(await send(rollbackPurchase.request));oracleActions.push({kind:'investment',account:cash,amount:'3',holding:gold,quantity:'0.01',unit:'chi',date:'2026-10-09',mode:'delta'});
  check('failure after ledger/quantity effects rolls back the complete investment bundle, versions, history and replay');
  await mutate('updateHoldingQuantity',{id:gold,quantity:{value:'2.9',unit:'chi'},date:'2026-10-08',reason:'Backdated exact set'});oracleActions.push({kind:'declaration',holding:gold,quantity:'2.9',unit:'chi',date:'2026-10-08'});
  const cashBeforePrice=ok(await call('getAccount',{id:cash})).balance.value.value,quantityBefore=ok(await call('getHolding',{id:gold})).quantity.value;
  for(const [holding,price,per,currency,fx] of [[gold,'99999.99','luong','VND',null],[stock,'100.125','share','USD','25000.01']] as const) {
   await mutate('recordPriceQuote',{holdingId:holding,price:{value:price,currency,per},at:'2026-10-09T00:00:00Z',sourceId:'manual-owner',fxVndPerUsd:fx,fxAt:fx?'2026-10-09T00:00:00Z':null,compatible:true});oracleActions.push({kind:'quote',holding,price,per,fx:fx??'1'});
  }
  assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,cashBeforePrice);assert.equal(ok(await call('getHolding',{id:gold})).quantity.value,quantityBefore);
  await mutate('updateHoldingCost',{id:gold,cost:{value:'9000',currency:'VND'},date:'2026-10-09',reason:'Owner documented cost basis'});const costHolding=ok(await call('getHolding',{id:gold}));assert.equal(costHolding.cost.value,'9000');assert.equal(costHolding.costQuantity.value,quantityBefore);assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,cashBeforePrice);
  const catalogPreviewInput={existingId:null,kind:'stock',catalogId:'manual-stock',quantity:'1',date:'2026-10-09',cost:null,profileConfirmed:false},catalogPreview=ok(await call('previewHolding',catalogPreviewInput));await admin.query("UPDATE fw_finance.catalog SET version=version+1 WHERE id='manual-stock'");assert.equal((await call('confirmHolding',{...catalogPreviewInput,token:catalogPreview.token,digest:catalogPreview.digest})).body.code,'STALE_PROPOSAL');await admin.query("UPDATE fw_finance.catalog SET version=version-1 WHERE id='manual-stock'");
  const quantityBeforeOverflow=ok(await call('getHolding',{id:stock})).quantity.value;
  assert.equal((await call('previewHolding',{...catalogPreviewInput,existingId:stock,quantity:'999999999999999999'})).body.code,'VALIDATION');assert.equal(ok(await call('getHolding',{id:stock})).quantity.value,quantityBeforeOverflow);
  const hugePriceInput={holdingId:gold,price:{value:'999999999999999999',currency:'VND',per:'chi'},at:'2026-10-09T00:00:00Z',sourceId:'manual-owner',fxVndPerUsd:null,fxAt:null,compatible:true};
  assert.equal((await call('previewMutation',{operationId:'recordPriceQuote',input:hugePriceInput,expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}})).body.code,'VALIDATION');assert.equal((await call('recordPriceQuote',hugePriceInput)).body.code,'PREVIEW_MISMATCH');
  const badQty=await call('previewMutation',{operationId:'updateHoldingQuantity',input:{id:gold,quantity:{value:'3',unit:'share'},date:'2026-10-09',reason:'Wrong unit'},expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}});assert.equal(badQty.body.code,'UNIT_INCOMPATIBLE');
  check('stock/gold declarations, preview/confirm, chi/luong conversion, ordered backdated set/delta and exact quote/FX valuation; price leaves cash/quantity unchanged');
  const countBefore=ok(await call('getAccount',{id:cash})).balance.value.value,count=(await mutate('recordCashCount',{accountId:cash,observed:{value:(BigInt(countBefore)-5n).toString(),currency:'VND'},reason:'Count cash'})).affectedIds[0];assert.equal(ok(await call('getAccount',{id:cash})).balance.value.value,countBefore);
  await mutate('resolveReviewCase',{id:count,resolution:{action:'forgottenExpense',category:'cash-variance',reason:'Owner identified missing expense'}});oracleActions.push({kind:'expense',account:cash,amount:'5'});
  const bankCount=await call('previewMutation',{operationId:'recordCashCount',input:{accountId:bank,observed:{value:'0',currency:'VND'},reason:'Invalid bank count'},expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}});assert.equal(bankCount.body.code,'ACTION_NOT_ALLOWED');
  check('cash count is an immutable observation; only explicit resolution posts variance, bank count rejected');
  // Independent oracle mixes exact, seeded amounts and account scopes, not implementation-derived expected balances.
  let seed=73013;for(let n=0;n<24;n++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const amount=String(seed%10000+1),kind=n%2?'expense':'income',account=n%3?cash:bank;await mutate('createEvent',event(kind,account,amount));oracleActions.push({kind,account,amount});}
  const oracle=await runOracle(python,oracleActions);
  for(const [id,value] of Object.entries(oracle.cash))assert.equal(ok(await call('getAccount',{id})).balance.value.value,value);
  for(const [id,value] of Object.entries(oracle.quantities)){const h=ok(await call('getHolding',{id}));assert.equal(h.quantity.value,value);assert.equal(h.valuation.value?.value??null,oracle.valuations[id]);}
  const totals=await prepare('createEvent',event('income',wallet,'1'));for(const k of ['income','grossExpense','refunds','netExpense'])assert.equal(totals.preview.before[k].value.value,oracle[k]);
  check('independent Python Decimal oracle matches PostgreSQL balances, quantity, per-holding HALF_UP/FX and opening-excluded flows across seeded sequence');
  const movementPage=ok(await call('listHoldingMovements',{id:gold,page:{cursor:null,pageSize:100}}));assert.equal(movementPage.items.length,5);
  const history=ok(await call('getTransaction',{id:expenseId})).history;assert(history.some((x:any)=>x.action==='correctPostedEvent'));
  const quotePage=ok(await call('listPriceQuotes',{holdingId:gold,asOf:'2026-10-09T23:59:59Z',page:{cursor:null,pageSize:100}}));assert.equal(quotePage.items.length,1);
  check('API005 reply validation for account/event/holding/movement/quote/review history');
  const sealed=(await admin.query('SELECT id FROM fw_finance.entry_groups WHERE workspace_id=$1 LIMIT 1',[workspace])).rows[0].id;
  await assert.rejects(admin.query('UPDATE fw_finance.posting_lines SET signed_amount=signed_amount+1 WHERE workspace_id=$1 AND group_id=$2',[workspace,sealed]),{code:'23514'});
  await assert.rejects(admin.query('DELETE FROM fw_finance.events WHERE workspace_id=$1',[workspace]),{code:'23514'});
  await assert.rejects(admin.query('INSERT INTO fw_finance.posting_lines VALUES($1,$2,999,$3,1,\'VND\')',[workspace,sealed,'asset:'+cash]),{code:'23514'});
  await assert.rejects(unitOfWork(admin,async tx=>{const id=token(),eid=(await tx.one('SELECT id FROM fw_finance.events WHERE workspace_id=$1 AND version=0 LIMIT 1',[workspace]))!.id;await tx.query('INSERT INTO fw_finance.entry_groups(workspace_id,id,event_id,event_version) VALUES($1,$2,$3,0)',[workspace,id,eid]);}),{code:'23514'});
  await assert.rejects(pool.query('TRUNCATE fw_finance.posting_lines'),{code:'42501'});
  const balanced=(await admin.query('SELECT count(*)::int AS n FROM (SELECT g.id FROM fw_finance.entry_groups g LEFT JOIN fw_finance.posting_lines l ON l.workspace_id=g.workspace_id AND l.group_id=g.id WHERE g.workspace_id=$1 GROUP BY g.id,g.sealed HAVING NOT g.sealed OR count(l.*)<2 OR sum(l.signed_amount)<>0) q',[workspace])).rows[0].n;assert.equal(balanced,0);
  check('database rejects sealed append/update/delete, immutable event delete, empty/unsealed COMMIT, TRUNCATE; every committed group balanced');
  const sqlWorkspace=token(),sqlAccount=token(),sqlExpense=token(),subject=(await admin.query('SELECT subject_id FROM fw_finance.workspaces WHERE id=$1',[workspace])).rows[0].subject_id;
  await unitOfWork(admin,async tx=>{
   await tx.query('INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES($1,$2,$3)',[sqlWorkspace,subject,'2026-10-01']);
   await tx.query('INSERT INTO fw_finance.accounts(workspace_id,id,payload) VALUES($1,$2,$3)',[sqlWorkspace,sqlAccount,{name:'SQL race fixture',kind:'cash',opening:{value:'0',currency:'VND'},openingDate:'2026-10-01',archived:false}]);
   await tx.query('INSERT INTO fw_finance.ledger_accounts VALUES($1,$2,$3,$4)',[sqlWorkspace,'asset:'+sqlAccount,sqlAccount,'asset']);
   await eventRevision(tx,sqlWorkspace,sqlExpense,0,event('expense',sqlAccount,'100'));await group(tx,sqlWorkspace,sqlExpense,0,[{ledger:'asset:'+sqlAccount,amount:'-100'},{ledger:'counter:expense',amount:'100'}]);
  });
  const pids:number[]=[];let arrivals=0,releaseBarrier!:()=>void;const barrier=new Promise<void>(r=>releaseBarrier=r);
  const sqlRefund=()=>unitOfWork(admin,async tx=>{pids.push((await tx.one('SELECT pg_backend_pid() AS pid'))!.pid);if(++arrivals===2)releaseBarrier();await barrier;const id=token();await eventRevision(tx,sqlWorkspace,id,0,event('refund',sqlAccount,'75',{originId:sqlExpense}));await group(tx,sqlWorkspace,id,0,[{ledger:'asset:'+sqlAccount,amount:'75'},{ledger:'counter:refund',amount:'-75'}]);});
  const sqlRace=await Promise.allSettled([sqlRefund(),sqlRefund()]);assert.equal(new Set(pids).size,2);assert.equal(sqlRace.filter(x=>x.status==='fulfilled').length,1);const rejected=sqlRace.find(x=>x.status==='rejected') as PromiseRejectedResult;assert.equal(rejected.reason.code,'23514');
  assert.equal((await admin.query("SELECT sum((payload->'amount'->>'value')::numeric)::text AS total FROM fw_finance.event_heads WHERE workspace_id=$1 AND payload->>'kind'='refund'",[sqlWorkspace])).rows[0].total,'75');
  await assert.rejects(unitOfWork(admin,async tx=>{await eventRevision(tx,sqlWorkspace,token(),0,event('income',cash,'1'));}),{code:'23514'});
  await assert.rejects(unitOfWork(admin,async tx=>{await eventRevision(tx,sqlWorkspace,token(),0,event('income',sqlAccount,'1'));}),{code:'23514'});
  check('two distinct PostgreSQL backend PIDs: SQL refund cap survives direct concurrent writes; cross-workspace references and posted event without seal rejected');
  const archiveBefore=ok(await call('getAccount',{id:wallet})).balance.value.value;await mutate('archiveAccount',{id:wallet,reason:'Keep history archived'});assert.equal(ok(await call('getAccount',{id:wallet})).balance.value.value,archiveBefore);assert.equal(ok(await call('getAccount',{id:wallet})).archived,true);
  assert.equal((await call('previewMutation',{operationId:'createEvent',input:event('expense',wallet,'1'),expectedWorkspaceVersion:version,expectedObjectVersions:{...registry}})).body.code,'VALIDATION');
  check('account archive keeps sealed balance/history and rejects subsequent posting');
  const address=await app.listen({host:'127.0.0.1',port:0});const b=envelope('getHolding',{id:gold}),network=await fetch(address+path(b.operationId),{method:'POST',headers:headers(auth),body:JSON.stringify(b)});assert.equal(network.status,200);assert(validator('getHoldingReply')(await network.json()));
  check('real TCP HTTP API against local PostgreSQL and non-superuser RLS role');
  return {groups,oracle,oracleActionCount:oracleActions.length,postgres:(await admin.query('SELECT version() AS version')).rows[0].version,workspaceVersion:version,balancedViolations:balanced,concurrencyConnections:8,sqlRaceBackendPids:pids,sqlRace:['one refund committed','one refund rejected by deferred cap'],commitFaults:['server committed; acknowledgement suppressed','physical backend terminated before COMMIT','ledger/quantity written; precommit failure rolls back entire bundle'],catalog:'explicit manual local declarations; no market feeds'};
 } finally {await app.close();await pool.end();}
}
async function runOracle(python:string,input:any[]):Promise<any> {
 return new Promise((resolveResult,reject)=>{const child=spawn(python,[resolve('tests/finance-oracle.py')],{windowsHide:true,stdio:['pipe','pipe','pipe']});let out='',err='';child.stdout.on('data',x=>out+=x);child.stderr.on('data',x=>err+=x);child.on('error',reject);child.on('close',code=>code?reject(Error(err)):resolveResult(JSON.parse(out)));child.stdin.end(JSON.stringify(input));});
}
