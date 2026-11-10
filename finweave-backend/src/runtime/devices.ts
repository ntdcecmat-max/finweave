import type { FastifyRequest } from 'fastify';
import type { Tx } from './uow.ts';
import type { Envelope } from './contracts.ts';
import { revision } from './contracts.ts';
import type { Actor } from './identity.ts';
import { Identity } from './identity.ts';
import { token,sha,signature,publicKey } from './crypto.ts';
import { ApiError,fail } from './errors.ts';
import { authReplay,command,semantic } from './replay.ts';
import { authorizeWorkspace,page } from './workspace.ts';
export function deviceProjection(d:any) {return {id:d.id,name:d.name,version:d.epoch,appVersion:d.app_version,consentVersion:d.consent,status:d.revoked?'revoked':'active',permission:'unknown',network:'unknown',lastSeen:null,lastObserved:null,lastAck:null,pending:0,gaps:[],synthetic:true};}
export async function deviceOperation(tx:Tx,id:Identity,a:Actor,req:Envelope) {
  const w=await authorizeWorkspace(tx,a,req);
  for(const reference of Object.keys(req.mutation?.expectedObjectVersions??{})) {
    if(!await tx.one('SELECT id FROM fw_auth.devices WHERE workspace_id=$1 AND subject_id=$2 AND id=$3',[w.id,a.identity.id,reference]))fail('NOT_FOUND',404);
  }
  if(req.operationId==='listDevices') return page(tx,req,'SELECT * FROM fw_auth.devices WHERE subject_id=$1 AND workspace_id=$2 ORDER BY id',[a.identity.id,w.id],deviceProjection,w.version);
  const target=req.input.deviceId??req.input.id;
  const device=target?await tx.one('SELECT * FROM fw_auth.devices WHERE id=$1 AND subject_id=$2 AND workspace_id=$3 FOR UPDATE',[target,a.identity.id,w.id]):null;
  if(target&&!device)fail('NOT_FOUND',404);
  if(req.operationId==='revokeDevice')return command(tx,id.config,a.identity.id,req,w.version,async()=>{
    if(device!.epoch!==req.input.expectedVersion)fail('VERSION_CONFLICT',409);
    await tx.query('UPDATE fw_auth.devices SET revoked=true,epoch=epoch+1 WHERE id=$1',[device!.id]);
    return {data:deviceProjection({...device,revoked:true,epoch:device!.epoch+1}),version:w.version};
  });
  if(!a.bearer||!a.session.public_key)fail('FORBIDDEN',403);
  id.fresh(a);
  if(device&&(device.revoked||device.auth_epoch!==a.identity.epoch||device.recovery_epoch!==a.recovery))fail('DEVICE_REVOKED',403);
  if(['requestDeviceEnrollment','requestCollectorCredentialChallenge'].includes(req.operationId))return authReplay(tx,id.config,'device-challenge:'+a.session.id+':'+a.identity.epoch,req,async()=>{
    if(req.mutation!.expectedWorkspaceVersion!==w.version)fail('VERSION_CONFLICT',409);
    const challenge=token(),nonce=token(),expires=new Date(a.now+300000).toISOString();
    await tx.query('INSERT INTO fw_auth.challenges(id,subject_id,purpose,nonce,code_digest,session_id,workspace_id,binding,epoch,expires_at) VALUES($1,$2,$3,$4,\'\',$5,$6,$7,$8,$9)',[challenge,a.identity.id,req.operationId,nonce,a.session.id,w.id,{publicKeyDigest:req.input.publicKeyDigest??sha(Buffer.from(device!.public_key,'base64url')),deviceId:device?.id??null},a.identity.epoch,expires]);
    return {data:{challengeId:challenge,nonce,expiresAt:expires},version:w.version};
  });
  const c=await tx.one('SELECT * FROM fw_auth.challenges WHERE id=$1 FOR UPDATE',[req.input.challengeId]);
  if(!c||c.subject_id!==a.identity.id||c.session_id!==a.session.id||c.workspace_id!==w.id||c.epoch!==a.identity.epoch)fail('CHALLENGE_INVALID',401);
  const scope='device-issue:'+c.id+':'+a.identity.epoch;
  return authReplay(tx,id.config,scope,req,async()=>{
    if(req.mutation!.expectedWorkspaceVersion!==w.version)fail('VERSION_CONFLICT',409);
    if(c.consumed||new Date(c.expires_at).getTime()<=a.now)fail('CHALLENGE_INVALID',401);
    let d=device;
    if(req.operationId==='registerDevice') {
      if(c.purpose!=='requestDeviceEnrollment')fail('CHALLENGE_INVALID',401);
      publicKey(req.input.publicKey);
      if(sha(Buffer.from(req.input.publicKey,'base64url'))!==c.binding.publicKeyDigest)fail('FORBIDDEN',403);
      signature(req.input.publicKey,{revision,purpose:'enrollment',challengeId:c.id,nonce:c.nonce,subjectId:a.identity.id,sessionId:a.session.id,workspaceId:w.id,publicKeyDigest:c.binding.publicKeyDigest,name:req.input.name,appVersion:req.input.appVersion,consentVersion:req.input.consentVersion,recoveryEpoch:a.recovery},req.input.proof);
      d={id:token(),name:req.input.name,app_version:req.input.appVersion,consent:req.input.consentVersion,epoch:0,revoked:false};
      await tx.query('INSERT INTO fw_auth.devices(id,subject_id,workspace_id,public_key,name,app_version,consent,auth_epoch,recovery_epoch,authorized_until) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[d.id,a.identity.id,w.id,req.input.publicKey,d.name,d.app_version,d.consent,a.identity.epoch,a.recovery,new Date(a.now+30*86400000)]);
    } else {
      if(c.purpose!=='requestCollectorCredentialChallenge'||c.binding.deviceId!==d!.id)fail('CHALLENGE_INVALID',401);
      signature(d!.public_key,{revision,purpose:'collector_token',challengeId:c.id,nonce:c.nonce,subjectId:a.identity.id,sessionId:a.session.id,workspaceId:w.id,deviceId:d!.id,publicKeyDigest:c.binding.publicKeyDigest,deviceEpoch:d!.epoch,recoveryEpoch:a.recovery},req.input.proof);
      await tx.query('UPDATE fw_auth.devices SET authorized_until=$1 WHERE id=$2',[new Date(a.now+30*86400000),d!.id]);
    }
    await tx.query('UPDATE fw_auth.challenges SET consumed=true WHERE id=$1',[c.id]);
    if(req.operationId==='registerDevice')return {data:deviceProjection(d),version:w.version,authority:{kind:'device',id:d!.id}};
    await tx.query('UPDATE fw_auth.collectors SET consumed=true WHERE device_id=$1',[d!.id]);
    return {data:await issue(tx,id,d!,a.now,a.recovery,new Date(a.now+30*86400000)),version:w.version,authority:{kind:'device',id:d!.id}};
  });
}
async function issue(tx:Tx,id:Identity,d:any,now:number,recovery:number,authorized:Date) {
  const secret=token(),expires=new Date(Math.min(now+86400000,authorized.getTime()));
  await tx.query('INSERT INTO fw_auth.collectors(digest,device_id,epoch,expires_at) VALUES($1,$2,$3,$4)',[id.d('collector',secret),d.id,d.epoch,expires]);
  return {deviceId:d.id,token:secret,expiresAt:expires.toISOString(),deviceEpoch:d.epoch,recoveryEpoch:recovery,authorizedUntil:authorized.toISOString()};
}
export async function renewCollector(tx:Tx,id:Identity,req:Envelope,http:FastifyRequest) {
  const recovery=await id.control(tx), raw=http.headers.authorization;
  if(http.headers.cookie||typeof raw!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(raw))fail('UNAUTHENTICATED',401);
  const secret=raw.slice(7),hash=id.d('collector',secret), initial=await tx.one('SELECT d.* FROM fw_auth.devices d JOIN fw_auth.collectors c ON c.device_id=d.id WHERE c.digest=$1',[hash]);
  if(!initial)fail('UNAUTHENTICATED',401);
  const owner=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[initial.subject_id]);
  await tx.context(owner!.id,initial.workspace_id);
  const w=await tx.one('SELECT * FROM fw_finance.workspaces WHERE id=$1 FOR UPDATE',[initial.workspace_id]);
  const d=await tx.one('SELECT * FROM fw_auth.devices WHERE id=$1 FOR UPDATE',[initial.id]),c=await tx.one('SELECT * FROM fw_auth.collectors WHERE digest=$1 FOR UPDATE',[hash]),now=await tx.now();
  if(req.workspaceId!==d!.workspace_id)fail('NOT_FOUND',404);
  if(c!.epoch!==d!.epoch)fail('DEVICE_REVOKED',403);
  if(d!.revoked||owner!.state!=='active'||owner!.epoch!==d!.auth_epoch||d!.recovery_epoch!==recovery||w!.blocked||d!.id!==req.input.deviceId||req.input.deviceEpoch!==d!.epoch||req.input.recoveryEpoch!==recovery||new Date(d!.authorized_until).getTime()<=now||new Date(c!.expires_at).getTime()<now-7*86400000)fail('DEVICE_REVOKED',403);
  await id.proof(tx,req,http,d!.public_key,'collector:'+d!.id,secret,null,true);
  const prior=await tx.one('SELECT * FROM fw_auth.replays WHERE scope=$1 AND operation=$2 AND key=$3',['collector:'+hash,req.operationId,req.mutation!.idempotencyKey]);
  if(c!.consumed&&(!prior||prior.digest!==semantic(id.config,req))) {
    await tx.query('UPDATE fw_auth.devices SET revoked=true,epoch=epoch+1 WHERE id=$1',[d!.id]);
    return new ApiError('REFRESH_REUSE',401);
  }
  return authReplay(tx,id.config,'collector:'+hash,req,async()=>{
    await tx.query('UPDATE fw_auth.collectors SET consumed=true WHERE digest=$1',[hash]);
    return {data:await issue(tx,id,d!,now,recovery,new Date(d!.authorized_until))};
  });
}
