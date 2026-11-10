import type { Tx } from './uow.ts';
import type { Actor,Identity } from './identity.ts';
import type { Envelope } from './contracts.ts';
import type { Config } from './config.ts';
import type { FastifyRequest } from 'fastify';
import { validator } from './contracts.ts';
import { authorizeWorkspace,page } from './workspace.ts';
import { command } from './replay.ts';
import { token,jcs,sha } from './crypto.ts';
import { fail,ApiError } from './errors.ts';
export const sourceOperations=['listSources','bindCollector','listCollectorBindings','disableCollectorBinding','listSourceSupport','disconnectSource','reconnectSource','ingestNotifications','reconcileReceipts','getReceipt','listReceipts','requestPriceRefresh','getRefreshJob','listRefreshJobs'];
export const syntheticPackage='dev.finweave.synthetic';
export const syntheticParser='synthetic-v1';
export const accountMask=(id:string)=>'mask_'+sha(id).slice(0,16);
export function itemDigest(item:any) {const {payloadDigest,...content}=item;return sha(jcs(content));}
export function safeItem(item:any,now:number) {
 const e=item.normalizedEvidence;
 return item.sourceKey==='synthetic-bank'&&item.parserVersion===syntheticParser&&item.payloadDigest===itemDigest(item)&&
 new Date(item.observedAt).getTime()<=now&&new Date(item.observedAt).getTime()>now-7*86400000&&
 (e.sourceAccountRef===null||/^mask_[a-f0-9]{16}$/.test(e.sourceAccountRef))&&
 (e.transactionRef===null||/^syn_[a-z][a-z_-]{1,60}$/.test(e.transactionRef))&&
 (e.sourceOccurredAt===null||new Date(e.sourceOccurredAt).getTime()<=now);
}
export function receiptProjection(r:any) {return {id:r.id,deviceId:r.device_id,source:r.item.sourceKey,parserVersion:r.item.parserVersion,observedAt:r.item.observedAt,ackAt:r.created_at.toISOString(),state:r.state,eventId:r.event_id,reviewId:r.review_id,reason:r.reason,eventKey:r.event_key,revision:r.revision,bindingId:r.item.bindingId,payloadDigest:r.digest,errorCode:r.state==='failed'?'TRANSIENT':null};}
export function refreshProjection(f:any,coalesced=false) {return {id:f.id,status:f.status,requestedAt:f.created_at.toISOString(),fetchedAt:f.result?.fetchedAt??null,quoteAsOf:f.result?.quoteAsOf??null,due:0,results:f.result?.results??[],retryAfter:f.result?.retryAfter??null,coalesced};}
function bindingProjection(b:any) {return {id:b.id,deviceId:b.device_id,packageName:syntheticPackage,accountId:b.account_id,parserProfileId:b.parser,version:b.version,enabled:b.enabled};}
async function device(tx:Tx,w:string,id:string,subject:string) {
 const d=await tx.one('SELECT * FROM fw_auth.devices WHERE id=$1 AND workspace_id=$2 AND subject_id=$3 FOR UPDATE',[id,w,subject]);if(!d)fail('NOT_FOUND',404);return d;
}
export async function collectorOperation(tx:Tx,id:Identity,req:Envelope,http:FastifyRequest) {
 if(http.headers.cookie||http.headers.origin!==undefined)fail('FORBIDDEN',403);
 const raw=http.headers.authorization;if(typeof raw!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(raw))fail('UNAUTHENTICATED',401);
 const secret=raw.slice(7),recovery=await id.control(tx),hash=id.d('collector',secret);
 const initial=await tx.one('SELECT d.* FROM fw_auth.devices d JOIN fw_auth.collectors c ON c.device_id=d.id WHERE c.digest=$1',[hash]);if(!initial)fail('UNAUTHENTICATED',401);
 const owner=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[initial.subject_id]);await tx.context(owner!.id,req.workspaceId);
 const w=await tx.one('SELECT * FROM fw_finance.workspaces WHERE id=$1 FOR UPDATE',[req.workspaceId]);if(!w||w.subject_id!==owner!.id)fail('NOT_FOUND',404);
 const d=await device(tx,w.id,req.input.deviceId,owner!.id),c=await tx.one('SELECT * FROM fw_auth.collectors WHERE digest=$1 FOR UPDATE',[hash]),now=await tx.now();
 if(!c||c.device_id!==d.id||c.consumed||new Date(c.expires_at).getTime()<=now)fail('UNAUTHENTICATED',401);
 if(d.revoked||d.epoch!==req.input.deviceEpoch||c.epoch!==d.epoch||d.auth_epoch!==owner!.epoch||owner!.state!=='active'||w.blocked||d.recovery_epoch!==recovery||new Date(d.authorized_until).getTime()<=now||d.consent!=='synthetic-consent-v1')fail('DEVICE_REVOKED',403);
 if(req.operationId==='ingestNotifications'&&req.input.recoveryEpoch!==recovery)fail('RECOVERY_FENCE',409);
 await id.proof(tx,req,http,d.public_key,'collector:'+d.id,secret,null,true);
 const items=req.input.items as any[],keys=new Set<string>();
 for(const item of items) {const key=item.eventKey+':'+item.revision;if(keys.has(key))fail('BAD_REQUEST');keys.add(key);}
 if(req.operationId==='reconcileReceipts') {
 const out=[];for(const item of items) {const r=await tx.one('SELECT * FROM fw_async.receipts WHERE workspace_id=$1 AND device_id=$2 AND event_key=$3 AND revision=$4',[w.id,d.id,item.eventKey,item.revision]);out.push({eventKey:item.eventKey,revision:item.revision,state:!r?'missing':r.digest===item.payloadDigest&&r.device_epoch===d.epoch?'durable':'conflict',receiptId:r?.id??null});}
 return {data:{recoveryEpoch:recovery,items:out},version:null};
 }
 const receipts=[];
 for(const item of items) {
 const b=await tx.one('SELECT b.* FROM fw_async.bindings b JOIN fw_async.sources s ON s.workspace_id=b.workspace_id AND s.id=b.source_id WHERE b.workspace_id=$1 AND b.id=$2 AND s.enabled FOR UPDATE OF b',[w.id,item.bindingId]);
 let code:string|null=!safeItem(item,now)?'NORMALIZED_EVIDENCE_INVALID':!b||!b.enabled||b.device_id!==d.id||b.version!==item.bindingVersion||b.parser!==item.parserVersion?'BINDING_REVOKED':null;
 const old=await tx.one('SELECT * FROM fw_async.receipts WHERE workspace_id=$1 AND device_id=$2 AND event_key=$3 AND revision=$4',[w.id,d.id,item.eventKey,item.revision]);
 if(!code&&old&&old.device_epoch!==d.epoch)code='CAPTURE_EPOCH_CHANGED';
 if(!code&&old&&old.digest!==item.payloadDigest)code='DIGEST_CONFLICT';
 if(code){receipts.push({eventKey:item.eventKey,revision:item.revision,receiptId:null,state:'rejected',errorCode:code});continue;}
 const rid=old?.id??token();
 if(!old) {
 // A restored database cannot prove a missing old item was never posted. Review reconciliation first.

 const cutoff=(await tx.one('SELECT fw_async.capture_cutoff() AS at'))!.at;
 if(cutoff&&new Date(item.observedAt).getTime()<=new Date(cutoff).getTime()) {receipts.push({eventKey:item.eventKey,revision:item.revision,receiptId:null,state:'rejected',errorCode:'RECOVERY_REVIEW_REQUIRED'});continue;}

 await tx.query('INSERT INTO fw_async.receipts(workspace_id,id,device_id,device_epoch,event_key,revision,digest,item) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[w.id,rid,d.id,d.epoch,item.eventKey,item.revision,item.payloadDigest,item]);
 await tx.query("INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,auth_epoch,recovery_epoch,device_id,device_epoch,consent,kind,deadline,max_attempts) VALUES($1,$2,$3,'ingestion',$4,$5,$6,$7,$8,$9,'receipt',clock_timestamp()+interval '7 days',8)",[token(),w.id,owner!.id,rid,owner!.epoch,recovery,d.id,d.epoch,d.consent]);
 }
 receipts.push({eventKey:item.eventKey,revision:item.revision,receiptId:rid,state:'durable',errorCode:null});
 }
 if(receipts.every(r=>r.state==='rejected')){const error=new ApiError('VALIDATION',422);error.itemErrors=receipts.map(r=>({eventKey:r.eventKey,revision:r.revision,errorCode:r.errorCode!}));throw error;}
 return {data:{receipts,acceptedAt:new Date(now).toISOString()},version:null};
}
export async function sourceOperation(tx:Tx,config:Config,a:Actor,req:Envelope) {
 const w=await authorizeWorkspace(tx,a,req),i=req.input,op=req.operationId;
 if(op==='listSourceSupport')return {data:{items:[{packageName:syntheticPackage,name:'Synthetic local collector',parserProfileId:syntheticParser,supported:true,reason:'Synthetic normalized contract only; no Android support claim'}],nextCursor:null,snapshotVersion:w.version,totalCount:1},version:w.version};
 if(op==='listSources')return page(tx,req,'SELECT * FROM fw_async.sources WHERE workspace_id=$1 ORDER BY id',[w.id],async r=>{
 const observation=r.kind==='price'?(await tx.one("SELECT max((payload->>'quoteAsOf')::timestamptz) AS at FROM fw_finance.quotes WHERE workspace_id=$1 AND payload->>'sourceId'=$2",[w.id,r.id]))!.at:r.last_success;
 const stale=observation&&a.now-observation.getTime()>36*3600000;
 return {id:r.id,version:r.version,name:r.id,kind:r.kind,connection:r.enabled?'connected':'disconnected',lastSuccess:r.last_success?.toISOString()??null,lastAttempt:r.last_attempt?.toISOString()??null,errorCode:null,freshness:{status:observation?(stale?'stale':'complete'):'unknown',sourceIds:[r.id],asOf:new Date(a.now).toISOString(),reasons:observation?(stale?['STALE_SOURCE']:[]):['NO_DATA']}};
 },w.version);
 if(op==='getReceipt') {const r=await tx.one('SELECT * FROM fw_async.receipts WHERE workspace_id=$1 AND id=$2',[w.id,i.id]);if(!r)fail('NOT_FOUND',404);return {data:receiptProjection(r),version:w.version};}
 if(op==='listReceipts') {if(i.deviceId)await device(tx,w.id,i.deviceId,a.identity.id);return page(tx,req,'SELECT * FROM fw_async.receipts WHERE workspace_id=$1 AND ($2::text IS NULL OR device_id=$2) ORDER BY id',[w.id,i.deviceId],receiptProjection,w.version);}
 if(op==='listRefreshJobs')return page(tx,req,'SELECT * FROM fw_async.refreshes WHERE workspace_id=$1 AND parent_id IS NULL ORDER BY id',[w.id],refreshProjection,w.version);
 if(op==='getRefreshJob') {const f=await tx.one('SELECT * FROM fw_async.refreshes WHERE workspace_id=$1 AND id=$2',[w.id,i.id]);if(!f)fail('NOT_FOUND',404);return {data:refreshProjection(f),version:w.version};}
 if(op==='listCollectorBindings') {await device(tx,w.id,i.deviceId,a.identity.id);return page(tx,req,'SELECT * FROM fw_async.bindings WHERE workspace_id=$1 AND device_id=$2 ORDER BY id',[w.id,i.deviceId],bindingProjection,w.version);}
 return command(tx,config,a.identity.id,req,w.version,async()=>{
 for(const [reference,expected] of Object.entries(req.mutation!.expectedObjectVersions)) {
 let row:any;for(const t of ['sources','bindings']) {row=await tx.one('SELECT version FROM fw_async.'+t+' WHERE workspace_id=$1 AND id=$2',[w.id,reference]);if(row)break;}if(!row)fail('NOT_FOUND',404);if(row.version!==expected)fail('VERSION_CONFLICT',409);
 }
 if(op==='requestPriceRefresh') {
 const ids=[...new Set<string>(i.holdingIds)].sort();if(!ids.length)fail('VALIDATION',422);
 let ref:any;try{ref=await tx.one("SELECT fw_async.admit_refresh($1,$2,$3,'manual') AS id",[w.id,ids,req.mutation!.idempotencyKey]);}catch(e){if((e as Error).message==='RATE_LIMITED')fail('RATE_LIMITED',429);throw e;}
 const f=await tx.one('SELECT * FROM fw_async.refreshes WHERE workspace_id=$1 AND id=$2',[w.id,ref!.id]);return {data:refreshProjection(f,f!.input.key!==req.mutation!.idempotencyKey),version:w.version};
 }
 let row:any,ref:string;
 if(op==='bindCollector') {
 const d=await device(tx,w.id,i.deviceId,a.identity.id);if(d.revoked||d.consent!=='synthetic-consent-v1'||d.epoch!==i.expectedVersion||d.recovery_epoch!==a.recovery)fail('DEVICE_REVOKED',403);
 if(i.packageName!==syntheticPackage||i.parserProfileId!==syntheticParser)fail('PARSER_UNSUPPORTED',422);
 const acc=await tx.one('SELECT * FROM fw_finance.accounts WHERE workspace_id=$1 AND id=$2',[w.id,i.accountId]);if(!acc||acc.payload.archived)fail('NOT_FOUND',404);
 const existing=await tx.one('SELECT * FROM fw_async.bindings WHERE workspace_id=$1 AND device_id=$2 AND account_id=$3',[w.id,d.id,acc.id]);if(existing)fail('ACTION_NOT_ALLOWED',409);
 ref=token();await tx.query("INSERT INTO fw_async.sources(workspace_id,id,kind) VALUES($1,'synthetic-bank','bank') ON CONFLICT DO NOTHING",[w.id]);
 await tx.query('INSERT INTO fw_async.bindings(workspace_id,id,device_id,account_id,source_id,parser,mask,namespace) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[w.id,ref,d.id,acc.id,'synthetic-bank',syntheticParser,accountMask(acc.id),'synthetic-economic-v1']);
 row=await tx.one('SELECT * FROM fw_async.bindings WHERE workspace_id=$1 AND id=$2',[w.id,ref]);
 } else if(op==='disableCollectorBinding') {
 row=await tx.one('SELECT * FROM fw_async.bindings WHERE workspace_id=$1 AND id=$2 FOR UPDATE',[w.id,i.id]);if(!row)fail('NOT_FOUND',404);if(row.version!==i.expectedVersion)fail('VERSION_CONFLICT',409);
 row=await tx.one('UPDATE fw_async.bindings SET enabled=false,version=version+1 WHERE workspace_id=$1 AND id=$2 RETURNING *',[w.id,i.id]);ref=i.id;
 } else {
 row=await tx.one('SELECT * FROM fw_async.sources WHERE workspace_id=$1 AND id=$2 FOR UPDATE',[w.id,i.id]);if(!row)fail('NOT_FOUND',404);
 if(req.mutation!.expectedObjectVersions[row.id]!==row.version)fail('VERSION_CONFLICT',409);
 row=await tx.one('UPDATE fw_async.sources SET enabled=$3,version=version+1 WHERE workspace_id=$1 AND id=$2 RETURNING *',[w.id,i.id,op==='reconnectSource']);ref=i.id;
 }
 await tx.query('UPDATE fw_finance.workspaces SET version=version+1 WHERE id=$1',[w.id]);const version=w.version+1;
 return {data:['bindCollector','disableCollectorBinding'].includes(op)?bindingProjection(row):{operationId:op,workspaceVersion:version,objectVersions:{[ref]:row.version},affectedIds:[ref],replayed:false},version};
 });
}
