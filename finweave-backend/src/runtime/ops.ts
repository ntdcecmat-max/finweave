import type { FastifyRequest } from 'fastify';
import type { Tx } from './uow.ts';
import type { Config } from './config.ts';
import type { Envelope } from './contracts.ts';
import { digest,token,open,checkPassword,equal,totp } from './crypto.ts';
import { cookieMap,sessionCookies } from './identity.ts';
import { authReplay } from './replay.ts';
import { ApiError,fail } from './errors.ts';
export async function opsOperation(tx:Tx,config:Config,req:Envelope,http:FastifyRequest,dummy:string) {
  const control=await tx.one('SELECT * FROM fw_control.read_state()'); if(control!.locked)fail('RECOVERY_FENCE',503);
  const now=await tx.now(), d=(p:string,v:string)=>digest(config.pepper,p,v);
  if(['adminSignIn','adminReauthenticate'].includes(req.operationId)) {
    const prefix=http.ip.includes('.')?http.ip.split('.').slice(0,3).join('.'):http.ip.split(':').slice(0,4).join(':');
    const rate=await tx.one(`INSERT INTO fw_ops.rates(key,bucket,count) VALUES($1,$2,1) ON CONFLICT(key) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN fw_ops.rates.bucket=excluded.bucket THEN fw_ops.rates.count+1 ELSE 1 END RETURNING count`,[d('ip',prefix),Math.floor(now/900000)]);
    if(rate!.count>20)return new ApiError('RATE_LIMITED',429);
  }
  if(req.operationId==='adminSignIn') {
    const email=req.input.email.toLowerCase(); if(!email.endsWith('.test'))fail('BAD_REQUEST');
    const rate=await tx.one(`INSERT INTO fw_ops.rates(key,bucket,count) VALUES($1,$2,1) ON CONFLICT(key) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN fw_ops.rates.bucket=excluded.bucket THEN fw_ops.rates.count+1 ELSE 1 END RETURNING count`,[d('rate',email),Math.floor(now/900000)]);
    if(rate!.count>5)return new ApiError('RATE_LIMITED',429);
    const i=await tx.one('SELECT * FROM fw_ops.identities WHERE email=$1 FOR UPDATE',[email]);
    if(!await checkPassword(i?.password??dummy,req.input.password)||!i||!i.active)return new ApiError('INVALID_CREDENTIALS',401);
    return authReplay(tx,config,'ops:'+i.id+':'+i.epoch+':'+control!.epoch,req,async()=>{
      const accepted=await acceptTotp(tx,config,i,req.input.mfaCode,now); if(!accepted)return new ApiError('INVALID_CREDENTIALS',401);
      const secret=token(),csrf=token(),expires=new Date(now+4*3600000).toISOString(),sessionId=token();
      await tx.query('INSERT INTO fw_ops.sessions(id,subject_id,secret_digest,csrf_digest,epoch,recovery_epoch,expires_at,idle_at,reauth_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,clock_timestamp())',[sessionId,i.id,d('admin-session',secret),d('admin-csrf',csrf),i.epoch,control!.epoch,expires,new Date(now+900000)]);
      return {data:{subjectId:i.id,role:'admin',expiresAt:expires},cookies:sessionCookies(secret,csrf,true),authority:{kind:'ops',id:sessionId}};
    });
  }
  const cookies=cookieMap(http.headers.cookie); if(http.headers.authorization||cookies.fw_test_session||!cookies.fw_test_admin_session)fail('UNAUTHENTICATED',401);
  const first=await tx.one('SELECT * FROM fw_ops.sessions WHERE secret_digest=$1',[d('admin-session',cookies.fw_test_admin_session)]);
  if(!first)fail('UNAUTHENTICATED',401);
  const i=await tx.one('SELECT * FROM fw_ops.identities WHERE id=$1 FOR UPDATE',[first.subject_id]),s=await tx.one('SELECT * FROM fw_ops.sessions WHERE id=$1 FOR UPDATE',[first.id]);
  if(!i!.active||s!.revoked||s!.epoch!==i!.epoch||s!.recovery_epoch!==control!.epoch||new Date(s!.expires_at).getTime()<=now||new Date(s!.idle_at).getTime()<=now)fail('UNAUTHENTICATED',401);
  const csrf=http.headers['x-fw-csrf']; if(req.mutation&&(typeof csrf!=='string'||!equal(d('admin-csrf',csrf),s!.csrf_digest)))fail('FORBIDDEN',403);
  if(req.operationId==='adminSignOut') { await tx.query('UPDATE fw_ops.sessions SET revoked=true WHERE id=$1',[s!.id]); return {data:{signedOut:true},cookies:sessionCookies('','',true)}; }
  if(req.operationId==='adminReauthenticate') {
    if(!await checkPassword(i!.password,req.input.password))return new ApiError('INVALID_CREDENTIALS',401);
    return authReplay(tx,config,'ops-reauth:'+s!.id+':'+i!.epoch,req,async()=>{
      if(!await acceptTotp(tx,config,i!,req.input.mfaCode,now))return new ApiError('INVALID_CREDENTIALS',401);
      await tx.query('UPDATE fw_ops.sessions SET reauth_at=clock_timestamp(),idle_at=$1 WHERE id=$2',[new Date(now+900000),s!.id]);
      return {data:{reauthenticatedUntil:new Date(now+300000).toISOString()}};
    });
  }
  fail('ACTION_NOT_ALLOWED',403);
}
async function acceptTotp(tx:Tx,config:Config,i:any,code:string,now:number) {
  if(!config.factorKey)throw Error('OPS_FACTOR_KEY_REQUIRED');
  const seed=Buffer.from(open<string>(config.factorKey,i.seed,'totp:'+i.id),'base64url'),step=Math.floor(now/30000);
  const match=[step-1,step,step+1].find(x=>x>Number(i.last_step)&&equal(totp(seed,x),code));
  if(match===undefined)return false;
  await tx.query('UPDATE fw_ops.identities SET last_step=$1 WHERE id=$2',[match,i.id]); return true;
}
