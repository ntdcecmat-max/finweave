import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import type { Config,Profile } from '../src/runtime/config.ts';
import { buildApp,opsOperations } from '../src/runtime/app.ts';
import { contract,revision,validator } from '../src/runtime/contracts.ts';
import { hashPassword,seal,token,totp } from '../src/runtime/crypto.ts';
import { Worker } from '../src/runtime/worker.ts';

export async function runOpsTests(admin:Pool,configs:Record<Profile,Config>) {
 const authPool=new Pool({connectionString:configs.ops.databaseUrl,max:4}),businessPool=new Pool({connectionString:configs.ops.opsBusinessDatabaseUrl,max:2}),userPool=new Pool({connectionString:configs.user.databaseUrl,max:2}),workerPool=new Pool({connectionString:configs.ingestion.databaseUrl,max:2});
 const app=await buildApp(configs.ops,authPool,{async send(){throw Error('OPS_MAIL_FORBIDDEN');}}),user=await buildApp(configs.user,userPool,{async send(){}});
 app.addHook('onError',async(_req,_res,e)=>{if(!(e as any).status)console.error(e.message);});
 const groups:string[]=[];const pass=(name:string)=>{groups.push(name);console.log('PASS '+name);};
 const password='Synthetic Ops password 2026!',seed=randomBytes(20),id=token();
 const path=(op:string)=>Object.entries(contract.paths).find(([,v]:any)=>v.post?.operationId===op)![0];
 function envelope(op:string,input:any={},key=token()):any {return {contractVersion:'2.0.0',requestId:token(),workspaceId:null,operationId:op,input,mutation:contract.components.schemas[op+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:key,expectedWorkspaceVersion:null,expectedObjectVersions:{},previewToken:null}};}
 let cookie='',csrf='';
 async function call(op:string,input:any={},options:any={}) {
  const body=options.body??envelope(op,input,options.key),headers={'x-fw-contract-revision':revision,'content-type':'application/json',origin:configs.ops.origin,...(cookie?{cookie}:{}),...(csrf?{'x-fw-csrf':csrf}:{}),...options.headers};
  const response=await (options.server??app).inject({method:'POST',url:path(op),headers,payload:body}),result:any=response.json();
  assert(validator(response.statusCode<300?op+'Reply':'Error')(result),JSON.stringify(result));return {response,result:result as any,body};
 }
 function useCookies(response:any) {const set=response.headers['set-cookie'] as string[];cookie=set.map(x=>x.split(';')[0]).join('; ');csrf=set[1].split(';')[0].split('=')[1];}
 async function preview(action:any,options:any={}) {return call('opsPreviewAction',action,options);}
 async function confirm(p:any,options:any={}) {const body=envelope('opsConfirmAction',{previewToken:p.token,digest:p.digest,expectedOpsVersion:p.snapshotVersion},options.key);body.mutation.previewToken=p.token;body.mutation.expectedObjectVersions={[p.action.id]:p.action.expectedVersion};if(options.edit)options.edit(body);return call('opsConfirmAction',{}, {...options,body:options.body??body});}
 try {
  // Private fixtures use sentinels so metadata/error leakage is directly observable.
  const owner=token(),workspace=token(),source=token(),account=token(),device=token(),receipt=token(),job=token();
  await admin.query(`INSERT INTO fw_auth.identities(id,email,name,password,state) VALUES($1,'private@owner.test','PRIVATE_OWNER_NAME','PRIVATE_PASSWORD_HASH','active')`,[owner]);
  await admin.query(`INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES($1,$2,'2026-01-01')`,[workspace,owner]);
  await admin.query(`INSERT INTO fw_finance.accounts(workspace_id,id,payload) VALUES($1,$2,'{"private":"PRIVATE_FINANCE","archived":false}')`,[workspace,account]);
  await admin.query(`INSERT INTO fw_async.sources(workspace_id,id,kind) VALUES($1,$2,'bank')`,[workspace,source]);
  await admin.query(`INSERT INTO fw_auth.devices(id,subject_id,workspace_id,public_key,name,app_version,consent,auth_epoch,recovery_epoch,authorized_until) VALUES($1,$2,$3,'PRIVATE_DEVICE_KEY','PRIVATE_DEVICE_NAME','test-1','test-v1',0,0,clock_timestamp()+interval '1 day')`,[device,owner,workspace]);
  const binding=token();
  await admin.query(`INSERT INTO fw_async.bindings(workspace_id,id,device_id,account_id,source_id,parser,mask,namespace) VALUES($1,$2,$3,$4,$5,'synthetic-v1','mask_synthetic','PRIVATE_NAMESPACE')`,[workspace,binding,device,account,source]);
  await admin.query(`INSERT INTO fw_async.receipts(workspace_id,id,device_id,device_epoch,digest,item,state) VALUES($1,$2,$3,0,'synthetic_digest',$4,'failed')`,[workspace,receipt,device,{bindingId:binding,bindingVersion:0,private:'PRIVATE_EVIDENCE'}]);
  await admin.query(`INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,kind,state,last_error,device_id,device_epoch,consent,auth_epoch,recovery_epoch,attempts) VALUES($1,$2,$3,'ingestion',$4,'receipt','failed','TRANSIENT',$5,0,'test-v1',0,0,3)`,[job,workspace,owner,receipt,device]);
  await admin.query(`INSERT INTO fw_async.quota_configs VALUES('PRIVATE_CREDENTIAL_NAMESPACE',10,NULL)`);
  await admin.query(`INSERT INTO fw_ops.releases(id,version_name,channel,compatibility,test_state) VALUES('release_1','test-1','synthetic','synthetic-local','not_run')`);
  await admin.query(`INSERT INTO fw_ops.incidents(id,severity,code,status) VALUES('incident_1','warning','SOURCE_DEGRADED','open')`);
  await admin.query('INSERT INTO fw_ops.identities(id,email,password,seed) VALUES($1,$2,$3,$4)',[id,'operator@ops.test',await hashPassword(password),seal(configs.ops.factorKey!,seed.toString('base64url'),'totp:'+id)]);
  for(const op of opsOperations.filter(x=>x!=='adminSignIn')) {
   const input=op.startsWith('opsList')?{page:{cursor:null,pageSize:100}}:op==='opsPreviewAction'?{action:'retry_job',id:job,expectedVersion:1,reason:'TRANSIENT_FAILURE'}:op==='opsConfirmAction'?{previewToken:'missing',digest:'0'.repeat(64),expectedOpsVersion:1}:op==='opsGetCommandOutcome'?{operationId:'opsConfirmAction',idempotencyKey:'missing'}:op==='adminReauthenticate'?{password,mfaCode:'000000'}:{};
   assert.equal((await call(op,input)).response.statusCode,401,op);
  }
  const signin=envelope('adminSignIn',{email:'operator@ops.test',password,mfaCode:totp(seed,Math.floor(Date.now()/30000))});
  const races=await Promise.all([call('adminSignIn',{}, {body:signin}),call('adminSignIn',{email:'operator@ops.test',password,mfaCode:signin.input.mfaCode})]);
  assert.deepEqual(races.map(r=>r.response.statusCode).sort(),[200,401]);useCookies(races.find(r=>r.response.statusCode===200)!.response);
  assert.equal((await call('adminSignIn',{}, {body:signin})).response.statusCode,200);
  pass('All admin services require auth; TOTP counter race and exact signin replay');
  const status=await call('opsStatus');assert.equal(status.response.statusCode,200,JSON.stringify(status.result));
  const state=status.result.data,publicJob=state.jobs[0],publicSource=state.sources[0];
  const json=JSON.stringify(state);assert(!json.includes('PRIVATE_'));for(const privateId of [workspace,owner,source,account,device,receipt,job,binding])assert(!json.includes(privateId));
  assert.equal(state.releases[0].artifact,null);assert.equal(state.accounts[0].devices[0].lastSeen,null);
  await admin.query(`UPDATE fw_auth.devices SET app_version='PRIVATE_PROMPT' WHERE id=$1`,[device]);
  assert.equal((await call('opsStatus')).result.data.accounts[0].devices[0].appVersion,'unknown');
  for(const op of Object.keys({opsListAccounts:1,opsListSources:1,opsListJobs:1,opsListQuotas:1,opsListReleases:1,opsListIncidents:1,opsListAudit:1}))assert.equal((await call(op,{page:{cursor:null,pageSize:100}})).response.statusCode,200,op);
  pass('Overview and seven lists use real PG metadata; opaque IDs, no private fields or invented APK/heartbeat');
  for(const pool of [authPool,businessPool]) {
   for(const sql of ['SELECT * FROM fw_finance.accounts','SELECT * FROM fw_auth.identities','SELECT * FROM fw_auth.sessions','SELECT * FROM fw_async.receipts','SELECT * FROM fw_dispatch.jobs','SELECT * FROM fw_assistant.messages','SELECT * FROM fw_ops_private.refs','SET ROLE fw_runtime_user','CREATE SCHEMA admin_escape','UPDATE fw_control.state SET locked=false'])await assert.rejects(pool.query(sql),{code:'42501'},sql);
   await assert.rejects(pool.query(`SELECT fw_dispatch.manual_retry('ingestion',$1,0)`,[job]),{code:'42501'});
   await assert.rejects(pool.query(`SELECT fw_ops.apply_controls('ingestion')`),{code:'42501'});
  }
  for(const sql of ['SELECT * FROM fw_ops.identities','SELECT * FROM fw_ops.sessions','SELECT * FROM fw_ops.replays','DELETE FROM fw_ops.audit','UPDATE fw_ops.audit SET result=\'applied\'','UPDATE fw_ops.releases SET verified=true','UPDATE fw_ops.incidents SET status=\'resolved\''])await assert.rejects(businessPool.query(sql),{code:'42501'});
  await assert.rejects(authPool.query('SELECT * FROM fw_ops.previews'),{code:'42501'});
  await assert.rejects(userPool.query('SELECT fw_ops.metadata()'),{code:'42501'});
  assert.equal((await call('opsStatus',{}, {headers:{cookie:'fw_test_session=owner',authorization:'Bearer owner'}})).response.statusCode,401);
  assert.equal((await call('opsStatus',{}, {server:user,headers:{origin:configs.user.origin}})).response.statusCode,404);
  for(const op of ['getOverview','getAgentEvidence','getSession','resetIdentityPassword'])assert.equal((await app.inject({method:'POST',url:path(op),headers:{origin:configs.ops.origin,cookie},payload:{}})).statusCode,404);
  for(const op of ['deploy','migrate','restore','prune','impersonateOwner','setQuota','publishRelease'])assert.equal((await app.inject({method:'POST',url:'/v2/admin/'+op,payload:{}})).statusCode,404);
  await assert.rejects(buildApp({...configs.ops,opsBusinessDatabaseUrl:configs.user.databaseUrl},authPool,{async send(){}}),/OPS_BUSINESS_CAPABILITY_MISMATCH/);
  await admin.query('GRANT fw_runtime_market TO fw_local_ops_business');
  await assert.rejects(buildApp(configs.ops,authPool,{async send(){}}),/OPS_EXTRA_CAPABILITY_DENIED/);
  await admin.query('REVOKE fw_runtime_market FROM fw_local_ops_business');
  await admin.query('ALTER ROLE fw_local_ops_business CREATEROLE');
  await assert.rejects(buildApp(configs.ops,authPool,{async send(){}}),/OPS_BUSINESS_CAPABILITY_MISMATCH/);
  await admin.query('ALTER ROLE fw_local_ops_business NOCREATEROLE');
  pass('Real SQL roles deny finance/prompt/evidence/owner credentials, MFA business access, audit rewrites and infrastructure authority');
  const action={action:'retry_job',id:publicJob.id,expectedVersion:publicJob.version,reason:'TRANSIENT_FAILURE'};
  assert.equal((await preview({...action,reason:'PRIVATE_REASON'})).response.statusCode,400);
  assert.equal((await preview({...action,action:'force_success'})).response.statusCode,400);
  assert.equal((await preview({...action,id:job})).response.statusCode,404);
  assert.equal((await preview(action,{headers:{origin:'http://attacker.test'}})).response.statusCode,403);
  assert.equal((await preview(action,{headers:{'x-fw-csrf':'bad'}})).response.statusCode,403);
  await admin.query(`UPDATE fw_ops.sessions SET reauth_at=clock_timestamp()-interval '6 minutes' WHERE subject_id=$1`,[id]);
  assert.equal((await preview(action)).result.code,'REAUTH_REQUIRED');
  // Fresh step-up uses the next accepted TOTP counter and binds to the session.
  assert.equal((await call('adminReauthenticate',{password,mfaCode:totp(seed,Math.floor(Date.now()/30000)+1)})).response.statusCode,200);
  const p=(await preview(action)).result.data;assert(p.token);
  assert.equal((await confirm(p,{edit:(b:any)=>b.input.digest='0'.repeat(64)})).result.code,'PREVIEW_MISMATCH');
  assert.equal((await confirm(p,{edit:(b:any)=>b.input.expectedOpsVersion++})).result.code,'VERSION_CONFLICT');
  assert.equal((await confirm(p,{edit:(b:any)=>b.mutation.expectedObjectVersions={}})).result.code,'VERSION_CONFLICT');
  await admin.query(`UPDATE fw_ops.previews SET expires_at=clock_timestamp()-interval '1 second' WHERE token=$1`,[p.token]);
  assert.equal((await confirm(p)).result.code,'PREVIEW_EXPIRED');
  pass('Reason enum, origin/CSRF, fresh MFA, preview digest/version/object/expiry validation');
  for(const [sql,values] of [
   [`UPDATE fw_dispatch.jobs SET lease_until=clock_timestamp()+interval '1 minute' WHERE id=$1`,[job]],
   [`UPDATE fw_dispatch.jobs SET retry_cycles=2 WHERE id=$1`,[job]],
   [`UPDATE fw_dispatch.jobs SET deadline=clock_timestamp()-interval '1 second' WHERE id=$1`,[job]],
   [`UPDATE fw_auth.devices SET revoked=true WHERE id=$1`,[device]],
   [`UPDATE fw_auth.identities SET epoch=1 WHERE id=$1`,[owner]],
   [`UPDATE fw_async.sources SET enabled=false WHERE workspace_id=$1 AND id=$2`,[workspace,source]],
   [`INSERT INTO fw_async.intents(job_id,generation,phase) VALUES($1,0,'sent_unknown')`,[job]],
   [`INSERT INTO fw_dispatch.outcomes(job_id,generation,result) VALUES($1,0,'{}')`,[job]],
  ] as [string,any[]][]) {
   await admin.query(sql,values);assert.equal((await preview(action)).response.statusCode,403,sql);
   await admin.query(`UPDATE fw_dispatch.jobs SET lease_until=NULL,retry_cycles=0,deadline=clock_timestamp()+interval '1 hour' WHERE id=$1`,[job]);
   await admin.query('UPDATE fw_auth.devices SET revoked=false WHERE id=$1',[device]);await admin.query('UPDATE fw_auth.identities SET epoch=0 WHERE id=$1',[owner]);await admin.query('UPDATE fw_async.sources SET enabled=true WHERE workspace_id=$1 AND id=$2',[workspace,source]);await admin.query('DELETE FROM fw_async.intents WHERE job_id=$1',[job]);await admin.query('DELETE FROM fw_dispatch.outcomes WHERE job_id=$1',[job]);
  }
  pass('Retry denies live lease, exhausted policy, expired deadline, revoked device/owner, disabled source, unknown provider effect and committed outcome');
  const valid=(await preview(action)).result.data,key=token(),confirmed=await confirm(valid,{key});assert.equal(confirmed.response.statusCode,202,JSON.stringify(confirmed.result));assert.equal(confirmed.result.data.disposition,'accepted');
  assert.equal((await admin.query('SELECT state FROM fw_dispatch.jobs WHERE id=$1',[job])).rows[0].state,'failed');
  const retries=await Promise.all(Array.from({length:10},()=>confirm(valid,{body:{...confirmed.body,requestId:token()}})));for(const retry of retries)assert.deepEqual(retry.result.data,confirmed.result.data);
  assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_ops.control_requests')).rows[0].n,1);
  assert.equal((await call('opsGetCommandOutcome',{operationId:'opsConfirmAction',idempotencyKey:key})).result.data.state,'committed');
  assert.equal((await call('opsGetCommandOutcome',{operationId:'opsConfirmAction',idempotencyKey:token()})).result.data.state,'not_found');
  assert.equal((await confirm(valid,{body:{...confirmed.body,input:{...confirmed.body.input,expectedOpsVersion:10}}})).result.code,'IDEMPOTENCY_CONFLICT');
  assert.equal((await confirm(valid)).result.code,'PREVIEW_ALREADY_CONFIRMED');
  assert.equal((await workerPool.query(`SELECT fw_ops.apply_controls('ingestion') AS n`)).rows[0].n,1);
  assert.equal((await workerPool.query(`SELECT fw_ops.apply_controls('ingestion') AS n`)).rows[0].n,0);
  const after=(await admin.query('SELECT * FROM fw_dispatch.jobs WHERE id=$1',[job])).rows[0];assert.equal(after.state,'queued');assert.equal(after.attempts,3);assert.equal(after.retry_cycles,1);assert.equal(after.max_attempts,11);
  const audit=(await call('opsListAudit',{page:{cursor:null,pageSize:100}})).result.data.items;assert.deepEqual(audit.map((x:any)=>x.result).sort(),['accepted','applied']);
  await admin.query(`UPDATE fw_ops.commands SET expires_at=clock_timestamp()-interval '1 second',result=NULL WHERE operation='opsConfirmAction' AND key=$1`,[key]);
  const expired=await confirm(valid,{body:confirmed.body});assert.equal(expired.result.code,'REPLAY_EXPIRED');assert.equal(expired.result.outcome,'committed');assert.equal(expired.result.resultRef,confirmed.result.data.controlId);
  pass('Concurrent lost-response replay enqueues once; acceptance differs from applied; journal survives replay expiry');
  // A second admin cannot confirm another session's preview or discover its journal.
  const cookie1=cookie,csrf1=csrf,id2=token(),seed2=randomBytes(20);
  await admin.query('INSERT INTO fw_ops.identities(id,email,password,seed) VALUES($1,$2,$3,$4)',[id2,'second@ops.test',await hashPassword(password),seal(configs.ops.factorKey!,seed2.toString('base64url'),'totp:'+id2)]);
  useCookies((await call('adminSignIn',{email:'second@ops.test',password,mfaCode:totp(seed2,Math.floor(Date.now()/30000))})).response);
  assert.equal((await confirm(valid)).response.statusCode,404);
  assert.equal((await call('opsGetCommandOutcome',{operationId:'opsConfirmAction',idempotencyKey:key})).result.data.state,'not_found');
  cookie=cookie1;csrf=csrf1;
  // Authority changed after acceptance: the broker must reject rather than revive work.
  await admin.query(`UPDATE fw_dispatch.jobs SET state='failed' WHERE id=$1`,[job]);
  const laterAction={...action,expectedVersion:after.control_version+1};
  const later=(await preview(laterAction)).result.data,laterKey=token();assert.equal((await confirm(later,{key:laterKey})).response.statusCode,202);
  await admin.query('UPDATE fw_auth.identities SET epoch=1 WHERE id=$1',[owner]);
  await workerPool.query(`SELECT fw_ops.apply_controls('ingestion')`);
  const disposition=(await call('opsGetCommandOutcome',{operationId:'opsConfirmAction',idempotencyKey:laterKey})).result.data;
  assert.equal(disposition.state,'committed');assert.equal(disposition.controlDisposition,'rejected');
  assert.equal((await admin.query('SELECT state FROM fw_dispatch.jobs WHERE id=$1',[job])).rows[0].state,'failed');
  await admin.query('UPDATE fw_auth.identities SET epoch=0 WHERE id=$1',[owner]);
  await admin.query(`UPDATE fw_dispatch.jobs SET state='queued' WHERE id=$1`,[job]);
  pass('Cross-admin preview/outcome isolation and post-acceptance owner revocation produce committed/rejected');
  // Source pause fences a ticket already held by a worker as well as future claims.
  const worker=new Worker(workerPool,'ingestion'),ticket=await worker.claim();assert(ticket);
  const current=(await call('opsStatus')).result.data,disable=(await preview({action:'disable_source',id:publicSource.id,expectedVersion:current.sources[0].version,reason:'MAINTENANCE'})).result.data;
  assert.equal((await confirm(disable)).response.statusCode,202);
  await workerPool.query(`SELECT fw_ops.apply_controls('ingestion')`);
  assert.equal(await worker.complete(ticket,{private:'PRIVATE_RESULT'}),false);assert.equal(await worker.claim(),null);
  const paused=(await call('opsStatus')).result.data;assert.equal(paused.sources[0].status,'disabled');assert.equal(paused.jobs[0].state,'paused');assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_async.receipts')).rows[0].n,1);
  pass('Disable applies durable pause: new claims and inflight publication denied, history preserved');
  // Signed cursor binds actor, operation, size and the live metadata digest.
  await admin.query(`INSERT INTO fw_ops.releases(id,version_name,channel,compatibility,test_state) VALUES('release_2','test-2','synthetic','synthetic-local','not_run')`);
  const page=(await call('opsListReleases',{page:{cursor:null,pageSize:1}})).result.data;assert(page.nextCursor);
  const next=(await call('opsListReleases',{page:{cursor:page.nextCursor,pageSize:1}})).result.data;assert.equal(next.items[0].id,'release_2');
  assert.equal((await call('opsListJobs',{page:{cursor:page.nextCursor,pageSize:1}})).result.code,'CURSOR_INVALID');
  await admin.query(`UPDATE fw_ops.releases SET version_name='test-3' WHERE id='release_2'`);assert.equal((await call('opsListReleases',{page:{cursor:page.nextCursor,pageSize:1}})).result.code,'CURSOR_INVALID');
  await admin.query('UPDATE fw_ops.identities SET active=false WHERE id=$1',[id]);assert.equal((await call('opsStatus')).response.statusCode,401);await admin.query('UPDATE fw_ops.identities SET active=true WHERE id=$1',[id]);
  assert.equal((await call('adminSignOut')).response.statusCode,200);assert.equal((await call('opsStatus')).response.statusCode,401);
  pass('Pagination cannot cross resources or changed snapshots; inactive/revoked sessions fail closed');
  return groups;
 } finally {await app.close();await user.close();await Promise.all([authPool.end(),businessPool.end(),userPool.end(),workerPool.end()]);}
}
