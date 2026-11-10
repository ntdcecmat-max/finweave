import type { FastifyRequest } from 'fastify';
import type { Tx } from './uow.ts';
import type { Envelope } from './contracts.ts';
import type { Actor } from './identity.ts';
import { Identity,cookieMap,sessionCookies } from './identity.ts';
import { token } from './crypto.ts';
import { ApiError,fail } from './errors.ts';
import { authReplay } from './replay.ts';
export async function sessionOperation(tx:Tx,id:Identity,a:Actor,req:Envelope,http:FastifyRequest) {
  switch(req.operationId) {
    case 'getSession': return {data:await id.projection(tx,a)};
    case 'listSessions': {
      if(req.input.page.cursor!==null)fail('CURSOR_INVALID');
      const rows=(await tx.query('SELECT * FROM fw_auth.sessions WHERE subject_id=$1 AND NOT revoked AND expires_at>clock_timestamp() ORDER BY id LIMIT $2',[a.identity.id,req.input.page.pageSize])).rows;
      return {data:{items:rows.map(s=>({sessionId:s.id,deviceId:s.installation_id,expiresAt:new Date(s.expires_at).toISOString(),current:s.id===a.session.id})),nextCursor:null,snapshotVersion:a.identity.epoch,totalCount:null}};
    }
    case 'signOut': {
      if(req.input.sessionId!==a.session.id)fail('FORBIDDEN',403);
      await tx.query('UPDATE fw_auth.sessions SET revoked=true WHERE id=$1',[a.session.id]);
      return {data:{signedOut:true,synthetic:true},...(!a.bearer?{cookies:sessionCookies('','')}:{})};
    }
    case 'revokeSession': {
      const s=await tx.one('SELECT * FROM fw_auth.sessions WHERE id=$1 AND subject_id=$2 FOR UPDATE',[req.input.id,a.identity.id]);
      if(!s)fail('NOT_FOUND',404);
      await tx.query('UPDATE fw_auth.sessions SET revoked=true WHERE id=$1',[s.id]); return {data:{revoked:true}};
    }
    case 'renewSession': {
      if(a.bearer)fail('UNAUTHENTICATED',401);
      const secret=cookieMap(http.headers.cookie).fw_test_session!,hash=id.d('session',secret);
      return authReplay(tx,id.config,'browser:'+hash+':'+a.identity.epoch,req,async()=>{
        const access=token(),csrf=token();
        await tx.query("INSERT INTO fw_auth.browser_rotations(digest,session_id,csrf_digest,key,expires_at) VALUES($1,$2,$3,$4,clock_timestamp()+interval '5 minutes')",[hash,a.session.id,a.session.csrf_digest,req.mutation!.idempotencyKey]);
        await tx.query('UPDATE fw_auth.sessions SET secret_digest=$1,csrf_digest=$2 WHERE id=$3',[id.d('session',access),id.d('csrf',csrf),a.session.id]);
        return {data:{session:await id.projection(tx,a),profile:{email:a.identity.email,name:a.identity.name},synthetic:true},cookies:sessionCookies(access,csrf)};
      });
    }
    case 'rotateOwnerRecoveryCodes': {
      id.fresh(a);
      return authReplay(tx,id.config,'recovery:'+a.session.id+':'+a.identity.epoch,req,async()=>{
        const codes=Array.from({length:10},()=>token());
        await tx.query('DELETE FROM fw_auth.recovery_codes WHERE subject_id=$1',[a.identity.id]);
        for(const c of codes)await tx.query('INSERT INTO fw_auth.recovery_codes(digest,subject_id) VALUES($1,$2)',[id.d('recovery',c),a.identity.id]);
        return {data:{codes,generatedAt:new Date(a.now).toISOString()}};
      });
    }
    default: fail('ACTION_NOT_ALLOWED');
  }
}
export async function redeemRecovery(tx:Tx,id:Identity,req:Envelope) {
  await id.control(tx); const email=req.input.email.toLowerCase();
  const limited=await id.rate(tx,'recovery:'+email); if(limited)return limited;
  const owner=await tx.one("SELECT * FROM fw_auth.identities WHERE email=$1 AND state IN ('active','blocked') FOR UPDATE",[email]);
  const c=await tx.one('SELECT * FROM fw_auth.recovery_codes WHERE digest=$1 FOR UPDATE',[id.d('recovery',req.input.recoveryCode)]);
  if(!owner||!c||c.subject_id!==owner.id||c.consumed)return new ApiError('RESET_INVALID',401);
  await tx.query('UPDATE fw_auth.recovery_codes SET consumed=true WHERE digest=$1',[c.digest]);
  const reset=token(),expires=new Date((await tx.now())+900000).toISOString();
  await tx.query('INSERT INTO fw_auth.resets(digest,subject_id,epoch,expires_at) VALUES($1,$2,$3,$4)',[id.d('reset',reset),owner.id,owner.epoch,expires]);
  return {data:{resetToken:reset,expiresAt:expires}};
}
