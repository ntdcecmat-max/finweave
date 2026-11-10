import type { FastifyRequest } from 'fastify';
import type { Tx } from './uow.ts';
import type { Config } from './config.ts';
import type { Envelope } from './contracts.ts';
import { digest, jcs, token, sha, seal, open } from './crypto.ts';
import { cookieMap } from './identity.ts';
import { semantic } from './replay.ts';
import { ApiError, fail } from './errors.ts';

export const opsBusinessOperations=['opsStatus','opsListAccounts','opsListSources','opsListJobs','opsListQuotas','opsListReleases','opsListIncidents','opsListAudit','opsPreviewAction','opsConfirmAction','opsGetCommandOutcome'];
const lists:Record<string,string>={opsListAccounts:'accounts',opsListSources:'sources',opsListJobs:'jobs',opsListQuotas:'quotas',opsListReleases:'releases',opsListIncidents:'incidents',opsListAudit:'audit'};

async function snapshot(tx:Tx) {
 const metadata=(await tx.one('SELECT fw_ops.metadata() AS data'))!.data;
 const version=(await tx.one('SELECT version FROM fw_ops.state'))!.version;
 const releases=(await tx.query(`SELECT id,version_name AS "versionName",channel,published_at AS "publishedAt",CASE WHEN verified THEN jsonb_build_object('url',url,'sha256',sha256,'signingFingerprint',signing_fingerprint) ELSE NULL END AS artifact,compatibility,test_state AS "testState" FROM fw_ops.releases ORDER BY id`)).rows;
 const incidents=(await tx.query('SELECT id,severity,source_id AS "sourceId",code,status,created_at AS "createdAt" FROM fw_ops.incidents ORDER BY id')).rows;
 const audit=(await tx.query('SELECT id,actor_id AS "actorId",action,object_id AS "objectId",reason,from_version AS "fromVersion",to_version AS "toVersion",result,request_id AS "requestId",at FROM fw_ops.audit ORDER BY at,id')).rows;
 return JSON.parse(JSON.stringify({version,environment:'synthetic',build:'FW-OPS-001',asOf:new Date(await tx.now()).toISOString(),...metadata,releases,incidents,audit}));
}
function eligible(state:any,action:any,now:number) {
 const object=(action.action==='disable_source'?state.sources:state.jobs).find((x:any)=>x.id===action.id);
 if(!object)fail('NOT_FOUND',404);
 if(object.version!==action.expectedVersion)fail('VERSION_CONFLICT',409);
 if(action.action==='disable_source') {if(object.status==='disabled')fail('ACTION_NOT_ALLOWED',403);}
 else if(object.state!=='failed'||!['ingestion','price_refresh'].includes(object.type)||!['TRANSIENT','RATE_LIMITED','LEASE_EXPIRED'].includes(object.errorCode)||object.leaseUntil&&Date.parse(object.leaseUntil)>now||!state.sources.some((s:any)=>s.id===object.sourceId&&s.status==='enabled'))fail('ACTION_NOT_ALLOWED',403);
 return object;
}

export async function opsBusinessOperation(tx:Tx,config:Config,req:Envelope,http:FastifyRequest) {
 const cookies=cookieMap(http.headers.cookie);
 if(http.headers.authorization||cookies.fw_test_session||!cookies.fw_test_admin_session)fail('UNAUTHENTICATED',401);
 const csrf=typeof http.headers['x-fw-csrf']==='string'?digest(config.pepper,'admin-csrf',http.headers['x-fw-csrf']):null;
 const actor=(await tx.one('SELECT fw_ops.authorize($1,$2,$3) AS actor',[digest(config.pepper,'admin-session',cookies.fw_test_admin_session),csrf,!!req.mutation]))!.actor;
 if(actor.error)fail(actor.error,actor.error==='RECOVERY_FENCE'?503:actor.error==='FORBIDDEN'?403:401);
 // One serialized Ops revision; private metadata is read under REPEATABLE READ.
 await tx.query('SELECT version FROM fw_ops.state FOR UPDATE');
 if(req.operationId==='opsGetCommandOutcome') {
  if(!['opsPreviewAction','opsConfirmAction'].includes(req.input.operationId))fail('ACTION_NOT_ALLOWED',403);
  const row=await tx.one('SELECT result_ref,result,version,expires_at FROM fw_ops.commands WHERE actor=$1 AND operation=$2 AND key=$3',[actor.id,req.input.operationId,req.input.idempotencyKey]);
  const control=row?await tx.one('SELECT disposition FROM fw_ops.control_requests WHERE id=$1 AND actor=$2',[row.result_ref,actor.id]):null;
  return {data:{state:row?'committed':'not_found',resultRef:row?.result_ref??null,replayAvailable:!!row?.result&&new Date(row.expires_at).getTime()>await tx.now(),committedVersion:row?.version??null,controlDisposition:control?.disposition??null}};
 }
 if(req.mutation) {
  if(!actor.fresh)fail('REAUTH_REQUIRED',401);
  const old=await tx.one('SELECT * FROM fw_ops.commands WHERE actor=$1 AND operation=$2 AND key=$3',[actor.id,req.operationId,req.mutation.idempotencyKey]);
  if(old) {
   if(old.digest!==semantic(config,req))fail('IDEMPOTENCY_CONFLICT',409);
   if(!old.result||new Date(old.expires_at).getTime()<=await tx.now())throw new ApiError('REPLAY_EXPIRED',409,'committed',old.result_ref);
   return {data:old.result};
  }
 }
 const state=await snapshot(tx),now=await tx.now();
 if(req.operationId==='opsStatus')return {data:state};
 const name=lists[req.operationId];
 if(name) {
  const items=state[name].slice().sort((a:any,b:any)=>a.id.localeCompare(b.id)),page=req.input.page,hash=sha(jcs(items));let after='';
  if(page.cursor) {
   let c:any;try {c=open(config.replayKey,page.cursor,'ops-page:'+actor.id+':'+req.operationId);}catch{fail('CURSOR_INVALID',409);}
   if(c.hash!==hash||c.size!==page.pageSize||c.until<=now)fail('CURSOR_INVALID',409);after=c.after;
  }
  const remaining=items.filter((x:any)=>x.id.localeCompare(after)>0),selected=remaining.slice(0,page.pageSize);
  const nextCursor=remaining.length>selected.length?seal(config.replayKey,{hash,size:page.pageSize,after:selected.at(-1).id,until:now+300000},'ops-page:'+actor.id+':'+req.operationId):null;
  return {data:{items:selected,nextCursor,snapshotVersion:state.version,totalCount:items.length}};
 }
 let data:any;
 if(req.operationId==='opsPreviewAction') {
  if(req.mutation!.previewToken!==null||Object.keys(req.mutation!.expectedObjectVersions).length)fail('BAD_REQUEST');
  eligible(state,req.input,now);
  if(!(await tx.one('SELECT fw_ops.action_allowed($1,$2,$3) AS allowed',[req.input.action,req.input.id,req.input.expectedVersion]))!.allowed)fail('ACTION_NOT_ALLOWED',403);
  const id=token(),hash=sha(jcs({action:req.input,sessionId:actor.sessionId,epoch:actor.epoch,snapshot:state.version})),expires=new Date(now+300000).toISOString();
  await tx.query('INSERT INTO fw_ops.previews(token,actor,session_id,epoch,action,digest,snapshot,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[id,actor.id,actor.sessionId,actor.epoch,req.input,hash,state.version,expires]);
  data={token:id,digest:hash,expiresAt:expires,action:req.input,impact:req.input.action==='retry_job'?'Accept a bounded retry request; the worker rechecks authority, lease, outcome and policy. Acceptance does not mean the job succeeded.':'Accept a source pause request; the worker applies the claim/publication fence and preserves history.',snapshotVersion:state.version};
 } else if(req.operationId==='opsConfirmAction') {
  const input=req.input,preview=await tx.one('SELECT * FROM fw_ops.previews WHERE token=$1 FOR UPDATE',[input.previewToken]);
  if(!preview||preview.actor!==actor.id||preview.session_id!==actor.sessionId||preview.epoch!==actor.epoch)fail('NOT_FOUND',404);
  if(preview.consumed)fail('PREVIEW_ALREADY_CONFIRMED',409);
  if(new Date(preview.expires_at).getTime()<=now)fail('PREVIEW_EXPIRED',409);
  if(req.mutation!.previewToken!==input.previewToken||input.digest!==preview.digest)fail('PREVIEW_MISMATCH',409);
  if(input.expectedOpsVersion!==preview.snapshot||state.version!==preview.snapshot)fail('VERSION_CONFLICT',409);
  const versions=req.mutation!.expectedObjectVersions;
  if(Object.keys(versions).length!==1||versions[preview.action.id]!==preview.action.expectedVersion)fail('VERSION_CONFLICT',409);
  eligible(state,preview.action,now);
  if(!(await tx.one('SELECT fw_ops.action_allowed($1,$2,$3) AS allowed',[preview.action.action,preview.action.id,preview.action.expectedVersion]))!.allowed)fail('ACTION_NOT_ALLOWED',403);
  const auditId=token(),controlId=token();
  await tx.query('INSERT INTO fw_ops.control_requests(id,actor,action,object_id,object_version,reason,request_id,epoch,actor_epoch) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[controlId,actor.id,preview.action.action,preview.action.id,preview.action.expectedVersion,preview.action.reason,req.requestId,actor.epoch,actor.actorEpoch]);
  await tx.query(`INSERT INTO fw_ops.audit(id,actor_id,action,object_id,reason,from_version,to_version,result,request_id) VALUES($1,$2,$3,$4,$5,$6,$6,'accepted',$7)`,[auditId,actor.id,preview.action.action,preview.action.id,preview.action.reason,preview.action.expectedVersion,req.requestId]);
  await tx.query('UPDATE fw_ops.previews SET consumed=true WHERE token=$1',[input.previewToken]);
  const version=(await tx.one('UPDATE fw_ops.state SET version=version+1 RETURNING version'))!.version;
  data={opsVersion:version,auditId,objectId:preview.action.id,controlId,disposition:'accepted'};
 } else fail('ACTION_NOT_ALLOWED',403);
 await tx.query('INSERT INTO fw_ops.commands(actor,operation,key,digest,result_ref,result,version) VALUES($1,$2,$3,$4,$5,$6,$7)',[actor.id,req.operationId,req.mutation!.idempotencyKey,semantic(config,req),data.controlId??data.token,data,data.opsVersion??state.version]);
 return {data};
}
