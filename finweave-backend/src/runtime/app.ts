import Fastify from 'fastify';
import { Pool } from 'pg';
import type { Config } from './config.ts';
import { parse,reply,contract,revision,validator } from './contracts.ts';
import { Identity } from './identity.ts';
import { hashPassword } from './crypto.ts';
import { unitOfWork } from './uow.ts';
import { ApiError,fail } from './errors.ts';
import { workspaceOperation } from './workspace.ts';
import { deviceOperation,renewCollector } from './devices.ts';
import { opsOperation } from './ops.ts';
import { sessionOperation,redeemRecovery } from './sessions.ts';
import type { Delivery } from './replay.ts';
import { financeOperations,financeOperation } from './finance.ts';
import { sourceOperations,sourceOperation,collectorOperation } from './sources.ts';
import { businessOperations,businessOperation } from './business.ts';
import { importOperations,importOperation } from './imports.ts';
import { EngineInputError } from '../engine/exact.ts';
import { businessRevision } from './business-contract.ts';
import { assistantOperations,assistantOperation } from './assistant.ts';
import { opsBusinessOperations,opsBusinessOperation } from './ops-business.ts';
import { opsRevision } from './ops-contract.ts';
import { safeEvent,type SafeEvent } from './telemetry.ts';
import { screenshotOperations } from './screenshot-contract.ts';
import { screenshotOperation,type ScreenshotRecognizer } from './screenshots.ts';
export interface MailSink { send(mail: NonNullable<Delivery['mail']>): Promise<void>; }
export const userOperations=['registerIdentity','signIn','verifyIdentityChallenge','verifyNativeIdentityChallenge','requestPasswordReset','resetIdentityPassword','getSession','listSessions','signOut','revokeSession','renewSession','renewNativeSession','requestOwnerReauthentication','verifyOwnerReauthentication','rotateOwnerRecoveryCodes','redeemOwnerRecoveryCode','listWorkspaces','createWorkspace','getWorkspace','listAccounts','getAccount','createAccount','archiveAccount','getCommandOutcome','requestDeviceEnrollment','registerDevice','listDevices','revokeDevice','requestCollectorCredentialChallenge','issueCollectorCredential','renewCollectorCredential'];
export const opsOperations=['adminSignIn','adminSignOut','adminReauthenticate',...opsBusinessOperations];
userOperations.push(...financeOperations);
userOperations.push(...sourceOperations);
userOperations.push(...businessOperations,...importOperations);
userOperations.push(...assistantOperations);
userOperations.push(...screenshotOperations);
export async function buildApp(config:Config,pool:Pool,mail:MailSink,telemetry:(event:SafeEvent)=>void=()=>{},ports:{recognizeScreenshot?:ScreenshotRecognizer}={}) {
  if(!['user','ops'].includes(config.profile))throw Error('WORKER_HAS_NO_PUBLIC_HTTP');
  const app=Fastify({logger:false,bodyLimit:256*1024,trustProxy:false,requestTimeout:15000});
  app.addHook('onResponse',async(_req,res)=>{telemetry(safeEvent(config.profile,res.statusCode,res.elapsedTime));});
  app.get('/health',async()=>{try {const r=await pool.query('SELECT * FROM fw_control.read_state()');return {healthy:!r.rows[0].locked&&!r.rows[0].maintenance};}catch{return {healthy:false};}});
  let businessPool:Pool|undefined;
  if(config.profile==='ops') {
    if(!config.opsBusinessDatabaseUrl)throw Error('OPS_BUSINESS_POOL_REQUIRED');
    businessPool=new Pool({connectionString:config.opsBusinessDatabaseUrl,max:4,connectionTimeoutMillis:5000});
    businessPool.on('error',()=>telemetry(safeEvent('ops',503,0)));
    try {
      const authRole=(await pool.query(`SELECT r.rolsuper,r.rolbypassrls,r.rolcreaterole,r.rolcreatedb,r.rolreplication,pg_has_role(current_user,'fw_runtime_ops','member') AS member,pg_has_role(current_user,'fw_runtime_user','member') AS owner,pg_has_role(current_user,'fw_runtime_ops_business','member') AS business FROM pg_roles r WHERE rolname=current_user`)).rows[0];
      if(!authRole?.member||authRole.rolsuper||authRole.rolbypassrls||authRole.rolcreaterole||authRole.rolcreatedb||authRole.rolreplication||authRole.owner||authRole.business)throw Error('OPS_AUTH_CAPABILITY_MISMATCH');
      const role=(await businessPool.query(`SELECT r.rolsuper,r.rolbypassrls,r.rolcreaterole,r.rolcreatedb,r.rolreplication,pg_has_role(current_user,'fw_runtime_ops_business','member') AS member,pg_has_role(current_user,'fw_runtime_ops','member') AS auth,pg_has_role(current_user,'fw_runtime_user','member') AS owner FROM pg_roles r WHERE rolname=current_user`)).rows[0];
      if(!role?.member||role.rolsuper||role.rolbypassrls||role.rolcreaterole||role.rolcreatedb||role.rolreplication||role.auth||role.owner)throw Error('OPS_BUSINESS_CAPABILITY_MISMATCH');
      for(const candidate of [pool,businessPool]) {
        const extra=(await candidate.query(`SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname IN('fw_runtime_ingestion','fw_runtime_market','fw_runtime_forecast','fw_runtime_agent','fw_runtime_retention') AND pg_has_role(current_user,oid,'member')) AS worker,has_schema_privilege(current_user,'fw_finance','USAGE') AS finance,has_schema_privilege(current_user,'fw_ops','CREATE') AS ddl`)).rows[0];
        if(extra.worker||extra.finance||extra.ddl)throw Error('OPS_EXTRA_CAPABILITY_DENIED');
      }
    }catch(e){await businessPool.end();throw e;}
    app.addHook('onClose',async()=>{await businessPool!.end();});
  }
  const dummy=await hashPassword('Synthetic dummy password only!'),identity=new Identity(config,dummy);
  app.addHook('onSend',async(_req,res,payload)=>{res.header('Cache-Control','no-store').header('X-FW-Contract-Revision',revision).header('X-FW-Business-Revision',businessRevision).header('X-FW-Assistant-Revision','FW-ASSISTANT-002').header('X-FW-Ops-Revision',opsRevision);return payload;});
  app.setErrorHandler((error,request,res)=>{
    const e=error instanceof ApiError?error:error instanceof EngineInputError?new ApiError('VALIDATION',400):new ApiError((error as any).code==='FST_ERR_CTP_BODY_TOO_LARGE'?'PAYLOAD_TOO_LARGE':(error as any).statusCode===415?'UNSUPPORTED_MEDIA_TYPE':(error as any).statusCode===400?'BAD_REQUEST':'SERVICE_UNAVAILABLE',(error as any).statusCode===413?413:(error as any).statusCode===415?415:(error as any).statusCode===400?400:503);
    if((request.body as any)?.operationId==='opsGetCommandOutcome'&&e.status===503)e.outcome='unknown';
    const requestId=(request.body as any)?.requestId;
    const body={contractVersion:'2.0.0',requestId:typeof requestId==='string'&&/^[A-Za-z0-9_-]{1,80}$/.test(requestId)?requestId:'invalid_request',workspaceVersion:null,code:e.code,message:e.code,retryable:e.status===503||e.status===429,retryAfterSeconds:e.status===429?60:null,fieldErrors:[],outcome:e.outcome,...(e.resultRef?{resultRef:e.resultRef}:{})};
    if(e.itemErrors)Object.assign(body,{itemErrors:e.itemErrors});
    if(!validator('Error')(body))throw Error('INVALID_ERROR_ENVELOPE');
    res.code(e.status).send(body);
  });
  app.setNotFoundHandler(()=>{fail('NOT_FOUND',404);});
  for(const op of config.profile==='user'?userOperations:opsOperations) {
    const path=Object.entries(contract.paths).find(([,value]:any)=>value.post?.operationId===op)?.[0];
    if(!path)throw Error('MISSING_OPERATION:'+op);
    app.post(path,async(http,res)=>{
      if(http.headers['x-fw-contract-revision']!==revision)fail('CONTRACT_VERSION_UNSUPPORTED',400);
      if(!String(http.headers['content-type']).startsWith('application/json'))fail('UNSUPPORTED_MEDIA_TYPE',415);
      const req=parse(op,http.body);
      const browser=!!http.headers.cookie||http.headers['x-fw-client']==='web'||config.profile==='ops'||['verifyIdentityChallenge','requestPasswordReset','resetIdentityPassword','redeemOwnerRecoveryCode'].includes(op);
      if(op==='verifyNativeIdentityChallenge'&&http.headers['x-fw-client']!=='android')fail('BAD_REQUEST');
      if(['registerIdentity','signIn','verifyIdentityChallenge','verifyNativeIdentityChallenge'].includes(op)&&http.headers.authorization)fail('UNAUTHENTICATED',401);
      if(browser) {
        if(http.headers.origin!==config.origin)fail('FORBIDDEN',403);
      } else if(http.headers.origin!==undefined)fail('FORBIDDEN',403);
      const opsBusiness=config.profile==='ops'&&opsBusinessOperations.includes(op);
      const result=await unitOfWork(opsBusiness?businessPool!:pool,async tx=>{
        // Share lock serializes maintenance with admission through COMMIT.
        // Denial/reset/revoke workflows remain available; backup/witness/erase are host ports.
        {
          const control=await tx.one('SELECT * FROM fw_control.read_state()');
          const denial=['signOut','revokeSession','revokeDevice','adminSignOut','requestPasswordReset','resetIdentityPassword','redeemOwnerRecoveryCode'];
          if(control!.maintenance&&req.mutation&&!denial.includes(op))fail('SERVICE_UNAVAILABLE',503);
        }
        let delivery:Delivery|ApiError;
        if(config.profile==='user'&&['registerIdentity','signIn','verifyIdentityChallenge','verifyNativeIdentityChallenge','requestPasswordReset','resetIdentityPassword','redeemOwnerRecoveryCode'].includes(op)) {
          const prefix=http.ip.includes('.')?http.ip.split('.').slice(0,3).join('.'):http.ip.split(':').slice(0,4).join(':');
          const limited=await identity.rate(tx,'ip:'+prefix,30);if(limited)return limited;
        }
        if(opsBusiness)delivery=await opsBusinessOperation(tx,config,req,http);
        else if(config.profile==='ops')delivery=await opsOperation(tx,config,req,http,dummy);
        else if(['registerIdentity','signIn'].includes(op))delivery=await identity.start(tx,req,http);
        else if(['verifyIdentityChallenge','verifyNativeIdentityChallenge'].includes(op))delivery=await identity.verify(tx,req,http);
        else if(op==='requestPasswordReset')delivery=await identity.resetRequest(tx,req);
        else if(op==='resetIdentityPassword')delivery=await identity.reset(tx,req);
        else if(op==='renewNativeSession')delivery=await identity.renew(tx,req,http);
        else if(op==='renewCollectorCredential')delivery=await renewCollector(tx,identity,req,http);
        else if(['ingestNotifications','reconcileReceipts'].includes(op))delivery=await collectorOperation(tx,identity,req,http);
        else if(op==='redeemOwnerRecoveryCode')delivery=await redeemRecovery(tx,identity,req);
        else {
          const actor=await identity.actor(tx,req,http);
          if(['requestOwnerReauthentication','verifyOwnerReauthentication'].includes(op))delivery=await identity.reauth(tx,req,actor);
          else if(['requestDeviceEnrollment','registerDevice','listDevices','revokeDevice','requestCollectorCredentialChallenge','issueCollectorCredential'].includes(op))delivery=await deviceOperation(tx,identity,actor,req);
          else if(screenshotOperations.includes(op)){
            const limited=op==='scanScreenshot'?await identity.rate(tx,'screenshot:'+actor.identity.id,30,900):null;
            delivery=limited??await screenshotOperation(tx,config,actor,req,ports.recognizeScreenshot);
          }
          else if(financeOperations.includes(op))delivery=await financeOperation(tx,config,actor,req);
          else if(businessOperations.includes(op))delivery=await businessOperation(tx,config,actor,req);
          else if(importOperations.includes(op))delivery=await importOperation(tx,config,actor,req);
          else if(assistantOperations.includes(op))delivery=await assistantOperation(tx,config,actor,req);
          else if(sourceOperations.includes(op))delivery=await sourceOperation(tx,config,actor,req);
          else if(['createWorkspace','listWorkspaces','getWorkspace','listAccounts','getAccount','createAccount','archiveAccount','getCommandOutcome'].includes(op))delivery=await workspaceOperation(tx,config,actor,req);
          else delivery=await sessionOperation(tx,identity,actor,req,http);
          if(!(delivery instanceof ApiError)&&req.mutation&&actor.session.kind==='web'&&!['renewSession','signOut'].includes(op)) {
            await tx.query("UPDATE fw_auth.sessions SET idle_at=least(absolute_at,clock_timestamp()+interval '30 minutes'),expires_at=least(absolute_at,clock_timestamp()+interval '30 minutes') WHERE id=$1 AND NOT revoked",[actor.session.id]);
          }
        }
        if(delivery instanceof ApiError)return delivery;
        // Validate response BEFORE commit, so serializer/schema failures never hide a committed effect.
        return {...delivery,body:reply(op,req,delivery.data,delivery.version??null)};
      },opsBusiness);
      if(result instanceof ApiError)throw result;
      if(result.mail)await mail.send(result.mail).catch(()=>{}); // best effort, no transaction/network overlap
      if(result.cookies)res.header('Set-Cookie',result.cookies);
      if(['ingestNotifications','startForecastRun','confirmImport'].includes(op))res.code(202);
      if(op==='opsConfirmAction')res.code(202);
      return result.body;
    });
  }
  return app;
}
