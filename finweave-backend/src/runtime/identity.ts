import { randomInt } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import type { Tx } from './uow.ts';
import type { Config } from './config.ts';
import type { Envelope } from './contracts.ts';
import { revision } from './contracts.ts';
import { token, digest, sha, jcs, publicKey, signature, password, hashPassword, checkPassword, equal } from './crypto.ts';
import { ApiError, fail } from './errors.ts';
import { authReplay } from './replay.ts';
import type { Delivery } from './replay.ts';
import { ownedWorkspaceIds,blockOwnedWorkspaces } from './workspace.ts';
export interface Actor { identity:any; session:any; now:number; recovery:number; bearer:string|null; }
export class Identity {
  config:Config; private dummy:string;
  constructor(config: Config, dummy: string) {this.config=config;this.dummy=dummy;}
  d(purpose:string,value:string) { return digest(this.config.pepper,purpose,value); }
  async control(tx:Tx) { const c=await tx.one('SELECT * FROM fw_control.read_state()'); if(c!.locked) fail('RECOVERY_FENCE',503); return c!.epoch as number; }
  async rate(tx: Tx, key:string, limit=5, seconds=900) {
    const bucket=Math.floor((await tx.now())/1000/seconds);
    const r=await tx.one(`INSERT INTO fw_auth.rates(key,bucket,count) VALUES($1,$2,1) ON CONFLICT(key) DO UPDATE SET bucket=excluded.bucket,count=CASE WHEN fw_auth.rates.bucket=excluded.bucket THEN fw_auth.rates.count+1 ELSE 1 END RETURNING count`,[this.d('rate',key),bucket]);
    return r!.count>limit?new ApiError('RATE_LIMITED',429):null;
  }
  async proof(tx: Tx, req:Envelope, http:FastifyRequest, key:string, principal:string, credential:string|null, challenge:any=null, collector=false) {
    const wire=http.headers[collector?'x-fw-collector-proof':'x-fw-native-proof'];
    if(typeof wire!=='string') fail('FORBIDDEN',403);
    const parts=wire.split('.'); if(parts.length!==2) fail('FORBIDDEN',403);
    let claims:any;
    try { claims=JSON.parse(Buffer.from(parts[0]!,'base64url').toString()); } catch { fail('FORBIDDEN',403); }
    if(Buffer.from(jcs(claims)).toString('base64url')!==parts[0]) fail('FORBIDDEN',403);
    const expected={revision,purpose:req.operationId,method:'POST',path:http.url,audience:this.config.origin,bodyDigest:sha(jcs(req)),credentialDigest:credential?sha(credential):null,challengeId:challenge?.id??null,challengeNonce:challenge?.nonce??null,issuedAt:claims.issuedAt,nonce:claims.nonce};
    if(jcs(expected)!==jcs(claims) || !Number.isInteger(claims.issuedAt) || Math.abs(claims.issuedAt-(await tx.now())/1000)>60 || typeof claims.nonce!=='string' || !/^[A-Za-z0-9_-]{43}$/.test(claims.nonce)) fail('FORBIDDEN',403);
    signature(key,claims,parts[1]!);
    const result=await tx.query("INSERT INTO fw_auth.nonces(principal,nonce,expires_at) VALUES($1,$2,clock_timestamp()+interval '5 minutes') ON CONFLICT DO NOTHING",[principal,claims.nonce]);
    if(result.rowCount!==1) fail('FORBIDDEN',403);
  }
  async actor(tx:Tx, req:Envelope, http:FastifyRequest, allowRefresh=false): Promise<Actor> {
    const recovery=await this.control(tx), cookies=cookieMap(http.headers.cookie), raw=http.headers.authorization;
    const cookie=cookies.fw_test_session, bearer=typeof raw==='string'&&/^Bearer [A-Za-z0-9_-]{43}$/.test(raw)?raw.slice(7):null;
    if(raw && (!bearer || cookie) || !cookie&&!bearer || cookies.fw_test_admin_session) fail('UNAUTHENTICATED',401);
    if(bearer&&http.headers.origin!==undefined)fail('FORBIDDEN',403);
    const secret=bearer??cookie!, hash=this.d(allowRefresh?'refresh':'session',secret);
    let found=allowRefresh?await tx.one('SELECT s.* FROM fw_auth.sessions s JOIN fw_auth.refresh_tokens t ON t.session_id=s.id WHERE t.digest=$1',[hash]):await tx.one('SELECT * FROM fw_auth.sessions WHERE secret_digest=$1',[hash]);
    const alias=!found&&cookie&&req.operationId==='renewSession'?await tx.one('SELECT * FROM fw_auth.browser_rotations WHERE digest=$1 AND key=$2 AND expires_at>clock_timestamp()',[hash,req.mutation!.idempotencyKey]):null;
    if(alias)found=await tx.one('SELECT * FROM fw_auth.sessions WHERE id=$1',[alias.session_id]);
    if(!found) fail('UNAUTHENTICATED',401);
    const identity=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[found.subject_id]);
    const session=await tx.one('SELECT * FROM fw_auth.sessions WHERE id=$1 FOR UPDATE',[found.id]);
    const now=await tx.now();
    if(!session || session.revoked || identity!.state!=='active' || session.epoch!==identity!.epoch || session.recovery_epoch!==recovery || new Date(session.absolute_at).getTime()<=now || (!allowRefresh&&(new Date(session.expires_at).getTime()<=now||new Date(session.idle_at).getTime()<=now))) fail('UNAUTHENTICATED',401);
    if(allowRefresh&&session.kind!=='native' || bearer&&session.kind!=='native' || cookie&&session.kind!=='web') fail('UNAUTHENTICATED',401);
    // Re-read credential under the lock; no token validated using a stale pre-lock snapshot.
    if(!allowRefresh && !alias && session.secret_digest!==hash) fail('UNAUTHENTICATED',401);
    if(cookie && req.mutation) { const csrf=http.headers['x-fw-csrf']; if(typeof csrf!=='string'||!equal(this.d('csrf',csrf),alias?.csrf_digest??session.csrf_digest??'')) fail('FORBIDDEN',403); }
    if(bearer) await this.proof(tx,req,http,session.public_key,session.id,secret);
    await tx.context(identity!.id,req.workspaceId);
    return {identity,session,now,recovery,bearer};
  }
  async projection(tx:Tx,a:Actor) {
    const workspaceIds=await ownedWorkspaceIds(tx,a.identity.id);
    return {sessionId:a.session.id,subjectId:a.identity.id,deviceId:a.session.installation_id,workspaceIds,role:'owner',expiresAt:new Date(a.session.expires_at).toISOString(),synthetic:true};
  }
  async issue(tx:Tx,identity:any,recovery:number,key:string|null):Promise<Delivery> {
    const now=await tx.now(), access=token(), refresh=key?token():null, csrf=token(), id=token(), absolute=now+(key?30*86400000:12*3600000), expires=now+(key?900000:1800000);
    const session={id,subject_id:identity.id,installation_id:key?token():null,expires_at:new Date(expires),absolute_at:new Date(absolute),kind:key?'native':'web'};
    await tx.query('INSERT INTO fw_auth.sessions(id,subject_id,kind,secret_digest,csrf_digest,public_key,installation_id,epoch,recovery_epoch,expires_at,absolute_at,idle_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$10)',[id,identity.id,session.kind,this.d('session',access),this.d('csrf',csrf),key,session.installation_id,identity.epoch,recovery,new Date(expires),new Date(absolute)]);
    if(refresh) await tx.query('INSERT INTO fw_auth.refresh_tokens(digest,session_id) VALUES($1,$2)',[this.d('refresh',refresh),id]);
    await tx.context(identity.id,null);
    const data:any={session:await this.projection(tx,{identity,session,recovery,now,bearer:null}),profile:{email:identity.email,name:identity.name},synthetic:true};
    if(key) data.tokens={accessToken:access,refreshToken:refresh,tokenType:'Bearer',accessExpiresAt:new Date(expires).toISOString(),refreshExpiresAt:new Date(absolute).toISOString()};
    return {data,authority:{kind:'owner',id},...(!key?{cookies:sessionCookies(access,csrf)}:{})};
  }
  async challenge(tx:Tx,identity:any,purpose:string,key:string|null,session:any=null):Promise<Delivery> {
    const id=token(), nonce=token(), code=String(randomInt(1000000)).padStart(6,'0'), expires=new Date((await tx.now())+300000).toISOString();
    await tx.query('INSERT INTO fw_auth.challenges(id,subject_id,purpose,nonce,code_digest,public_key,session_id,epoch,expires_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)',[id,identity?.id??null,purpose,nonce,this.d('otp:'+id,code),key,session?.id??null,identity?.epoch??0,expires]);
    return {data:purpose==='reauth'?{challengeId:id,expiresAt:expires,nonce,channel:'email'}:{challengeId:id,state:'challenge',expiresAt:expires,synthetic:true,nonce,channel:'email'},...(identity?{mail:{email:identity.email,challengeId:id,code}}:{})};
  }
  async start(tx:Tx,req:Envelope,http:FastifyRequest):Promise<Delivery|ApiError> {
    await this.control(tx); const i=req.input, email=i.email.toLowerCase(), android=http.headers['x-fw-client']==='android';
    if(!email.endsWith('.test')) fail('BAD_REQUEST');
    if(!['web','android'].includes(String(http.headers['x-fw-client']))) fail('BAD_REQUEST');
    if(android) { if(!i.installationPublicKey) fail('BAD_REQUEST'); publicKey(i.installationPublicKey); } else if(i.installationPublicKey!==null) fail('BAD_REQUEST');
    await tx.lock('email:'+this.d('email',email));
    const limited=await this.rate(tx,email+':'+req.operationId); if(limited) return limited;
    return authReplay(tx,this.config,'pre:'+this.d('email',email),req,async()=>{
      let identity:any=await tx.one('SELECT * FROM fw_auth.identities WHERE email=$1 FOR UPDATE',[email]);
      if(req.operationId==='registerIdentity') {
        if(password(i.password)!==password(i.passwordConfirmation)) fail('PASSWORD_MISMATCH');
        if(!i.syntheticAcknowledgement) fail('BAD_REQUEST');
        const phc=await hashPassword(i.password);
        if(identity) identity=null;
        else { identity={id:token(),email,name:i.name,password:phc,epoch:0,state:'pending'}; await tx.query("INSERT INTO fw_auth.identities(id,email,name,password,state) VALUES($1,$2,$3,$4,'pending')",[identity.id,email,i.name,phc]); }
      } else {
        const matches=await checkPassword(identity?.password??this.dummy,i.password);
        if(!matches||identity?.state!=='active') identity=null;
      }
      return this.challenge(tx,identity,(req.operationId==='registerIdentity'?'register':'login')+(android?'_native':'_web'),i.installationPublicKey);
    });
  }
  async verify(tx:Tx,req:Envelope,http:FastifyRequest):Promise<Delivery|ApiError> {
    const recovery=await this.control(tx), initial=await tx.one('SELECT * FROM fw_auth.challenges WHERE id=$1',[req.input.challengeId]);
    if(!initial) fail('CHALLENGE_INVALID',401);
    const identity=initial.subject_id?await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[initial.subject_id]):null;
    const c=await tx.one('SELECT * FROM fw_auth.challenges WHERE id=$1 FOR UPDATE',[initial.id]), native=req.operationId==='verifyNativeIdentityChallenge';
    if(!identity || identity.epoch!==c!.epoch || ['blocked','erased'].includes(identity.state) || !['register_'+(native?'native':'web'),'login_'+(native?'native':'web')].includes(c!.purpose)) fail('CHALLENGE_INVALID',401);
    if(native) await this.proof(tx,req,http,c!.public_key,'challenge:'+c!.id,null,c);
    return authReplay(tx,this.config,'challenge:'+c!.id+':'+identity.epoch,req,async()=>{
      if(c!.consumed || c!.attempts>=5) return new ApiError('CHALLENGE_INVALID',401);
      if(new Date(c!.expires_at).getTime()<=await tx.now()) return new ApiError('CHALLENGE_EXPIRED',401);
      await tx.query('UPDATE fw_auth.challenges SET attempts=attempts+1 WHERE id=$1',[c!.id]);
      if(!equal(c!.code_digest,this.d('otp:'+c!.id,req.input.code))) return new ApiError('CHALLENGE_INVALID',401);
      await tx.query('UPDATE fw_auth.challenges SET consumed=true WHERE id=$1',[c!.id]);
      await tx.query("UPDATE fw_auth.identities SET state='active' WHERE id=$1",[identity.id]);
      return this.issue(tx,identity,recovery,native?c!.public_key:null);
    });
  }
  async renew(tx:Tx,req:Envelope,http:FastifyRequest):Promise<Delivery|ApiError> {
    const a=await this.actor(tx,req,http,true), hash=this.d('refresh',a.bearer!), old=await tx.one('SELECT * FROM fw_auth.refresh_tokens WHERE digest=$1 FOR UPDATE',[hash]);
    const limited=await this.rate(tx,'renew:'+a.session.id,30,60); if(limited) return limited;
    const prior=await tx.one('SELECT * FROM fw_auth.replays WHERE scope=$1 AND operation=$2 AND key=$3',['refresh:'+hash,req.operationId,req.mutation!.idempotencyKey]);
    if(old!.consumed&&!prior) { await tx.query('UPDATE fw_auth.sessions SET revoked=true WHERE id=$1',[a.session.id]); return new ApiError('REFRESH_REUSE',401); }
    if(old!.consumed&&prior) {
      // A different semantic command under the original key is also reuse, not conflict grace.
      const {semantic}=await import('./replay.ts');
      if(prior.digest!==semantic(this.config,req)) {await tx.query('UPDATE fw_auth.sessions SET revoked=true WHERE id=$1',[a.session.id]);return new ApiError('REFRESH_REUSE',401);}
    }
    return authReplay(tx,this.config,'refresh:'+hash,req,async()=>{
      const access=token(),refresh=token(),expires=Math.min(a.now+900000,new Date(a.session.absolute_at).getTime());
      await tx.query('UPDATE fw_auth.refresh_tokens SET consumed=true WHERE digest=$1',[hash]);
      await tx.query('INSERT INTO fw_auth.refresh_tokens(digest,session_id) VALUES($1,$2)',[this.d('refresh',refresh),a.session.id]);
      await tx.query('UPDATE fw_auth.sessions SET secret_digest=$1,expires_at=$2,idle_at=$2 WHERE id=$3',[this.d('session',access),new Date(expires),a.session.id]);
      a.session.expires_at=new Date(expires);
      return {data:{session:await this.projection(tx,a),profile:{email:a.identity.email,name:a.identity.name},synthetic:true,tokens:{accessToken:access,refreshToken:refresh,tokenType:'Bearer',accessExpiresAt:new Date(expires).toISOString(),refreshExpiresAt:new Date(a.session.absolute_at).toISOString()}}};
    });
  }
  async resetRequest(tx:Tx,req:Envelope):Promise<Delivery|ApiError> {
    await this.control(tx); const email=req.input.email.toLowerCase(); if(!email.endsWith('.test')) fail('BAD_REQUEST');
    const limited=await this.rate(tx,'reset:'+email); if(limited)return limited;
    return authReplay(tx,this.config,'reset-request:'+this.d('email',email),req,async()=>{
      const identity=await tx.one("SELECT * FROM fw_auth.identities WHERE email=$1 AND state IN ('active','blocked') FOR UPDATE",[email]);
      const reset=token(); if(identity) await tx.query("INSERT INTO fw_auth.resets(digest,subject_id,epoch,expires_at) VALUES($1,$2,$3,clock_timestamp()+interval '15 minutes')",[this.d('reset',reset),identity.id,identity.epoch]);
      return {data:{message:'If eligible, a reset link is sent.',synthetic:true},...(identity?{mail:{email,resetToken:reset}}:{})};
    });
  }
  async reset(tx:Tx,req:Envelope):Promise<Delivery|ApiError> {
    await this.control(tx); const hash=this.d('reset',req.input.resetToken), initial=await tx.one('SELECT * FROM fw_auth.resets WHERE digest=$1',[hash]);
    if(!initial)fail('RESET_INVALID',401);
    const i=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[initial.subject_id]);
    const r=await tx.one('SELECT * FROM fw_auth.resets WHERE digest=$1 FOR UPDATE',[hash]);
    const scope='reset:'+hash;
    if(r!.consumed) {
      const prior=await tx.one('SELECT key FROM fw_auth.replays WHERE scope=$1 AND operation=$2 AND key=$3',[scope,req.operationId,req.mutation!.idempotencyKey]);
      if(!prior||i!.epoch!==r!.epoch+1||i!.state==='erased')fail('RESET_INVALID',401);
      return authReplay(tx,this.config,scope,req,async()=>{fail('RESET_INVALID',401);});
    }
    if(r!.epoch!==i!.epoch||new Date(r!.expires_at).getTime()<=await tx.now()||i!.state==='erased')fail('RESET_INVALID',401);
    return authReplay(tx,this.config,scope,req,async()=>{
    if(password(req.input.password)!==password(req.input.passwordConfirmation))fail('PASSWORD_MISMATCH');
    const phc=await hashPassword(req.input.password), epoch=i!.epoch+1;
    await tx.context(i!.id,null);
    await tx.query("UPDATE fw_auth.identities SET password=$1,epoch=$2,state='blocked' WHERE id=$3",[phc,epoch,i!.id]);
    await tx.query('UPDATE fw_auth.sessions SET revoked=true WHERE subject_id=$1',[i!.id]);
    await tx.query('UPDATE fw_auth.devices SET revoked=true,epoch=epoch+1 WHERE subject_id=$1',[i!.id]);
    await tx.query('UPDATE fw_auth.challenges SET consumed=true WHERE subject_id=$1',[i!.id]);
    await tx.query('UPDATE fw_auth.resets SET consumed=true WHERE subject_id=$1',[i!.id]);
    await tx.query('UPDATE fw_auth.recovery_codes SET consumed=true WHERE subject_id=$1',[i!.id]);
    await blockOwnedWorkspaces(tx,i!.id,true);
    await tx.query("INSERT INTO fw_control.denies(id,subject_id,epoch,kind) VALUES($1,$2,$3,'reset')",[token(),i!.id,epoch]);
    return {data:{message:'Password reset committed; identity remains blocked until deny checkpoint is anchored.',synthetic:true}};
    });
  }
  fresh(a:Actor) { if(!a.session.reauth_at||new Date(a.session.reauth_at).getTime()<a.now-300000)fail('REAUTH_REQUIRED',401); }
  async reauth(tx:Tx,req:Envelope,a:Actor):Promise<Delivery|ApiError> {
    if(req.operationId==='requestOwnerReauthentication') {
      const limited=await this.rate(tx,'reauth:'+a.identity.id); if(limited)return limited;
      if(!await checkPassword(a.identity.password,req.input.password))return new ApiError('INVALID_CREDENTIALS',401);
      return authReplay(tx,this.config,'reauth:'+a.session.id+':'+a.identity.epoch,req,()=>this.challenge(tx,a.identity,'reauth',null,a.session));
    }
    const c=await tx.one('SELECT * FROM fw_auth.challenges WHERE id=$1 FOR UPDATE',[req.input.challengeId]);
    if(!c||c.subject_id!==a.identity.id||c.session_id!==a.session.id||c.epoch!==a.identity.epoch||c.purpose!=='reauth')fail('CHALLENGE_INVALID',401);
    return authReplay(tx,this.config,'reauth-verify:'+c.id+':'+a.identity.epoch,req,async()=>{
      if(c.consumed||c.attempts>=5||new Date(c.expires_at).getTime()<=a.now)return new ApiError('CHALLENGE_INVALID',401);
      await tx.query('UPDATE fw_auth.challenges SET attempts=attempts+1 WHERE id=$1',[c.id]);
      if(!equal(c.code_digest,this.d('otp:'+c.id,req.input.code)))return new ApiError('CHALLENGE_INVALID',401);
      await tx.query('UPDATE fw_auth.challenges SET consumed=true WHERE id=$1',[c.id]);
      await tx.query('UPDATE fw_auth.sessions SET reauth_at=clock_timestamp() WHERE id=$1',[a.session.id]);
      return {data:{reauthenticatedUntil:new Date(a.now+300000).toISOString()}};
    });
  }
}
export function cookieMap(header?:string) { const result:Record<string,string>={}; for(const pair of (header??'').split(';')) { const [key,...rest]=pair.trim().split('='); if(key&&key in result) fail('UNAUTHENTICATED',401); if(key) result[key]=rest.join('='); } return result; }
export function sessionCookies(access:string,csrf:string,admin=false) { const name=admin?'fw_test_admin':'fw_test'; return [`${name}_session=${access}; HttpOnly; SameSite=Lax; Path=/`,`${name}_csrf=${csrf}; SameSite=Lax; Path=/`]; }
