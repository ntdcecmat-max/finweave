import assert from 'node:assert/strict';
import { generateKeyPairSync,randomBytes,sign } from 'node:crypto';
import { mkdir,writeFile,readFile,readdir,unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn,execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { once } from 'node:events';
import { Pool } from 'pg';
import { startCluster } from './runtime-cluster.ts';
import { migrateRuntime } from '../src/runtime/migrate.ts';
import { readiness } from '../src/runtime/readiness.ts';
import { loadConfig } from '../src/runtime/config.ts';
import { buildApp } from '../src/runtime/app.ts';
import { revision,contract } from '../src/runtime/contracts.ts';
import { token,jcs,sha } from '../src/runtime/crypto.ts';
import { Worker } from '../src/runtime/worker.ts';
import { backupSynthetic,restoreSynthetic,rpoMs,purgeSyntheticCopy } from '../src/runtime/operations-backup.ts';
import { FileWitness,reconcileRestore } from '../src/runtime/recovery.ts';
import { beginErasure,purgeActiveSynthetic,verifyActivePurge } from '../src/runtime/operations-erasure.ts';
import { expireAuthArtifacts } from '../src/runtime/retention.ts';
import { saveCatalog,pruneSyntheticRepository } from '../src/runtime/operations-prune.ts';
import type { SafeEvent } from '../src/runtime/telemetry.ts';
async function sourceFingerprint() {const source:Record<string,string>={};for(const directory of ['src/runtime','database/runtime','scripts'])for(const name of await readdir(directory))if(/\.(ts|sql|json|ps1|conf)$/.test(name))source[directory+'/'+name]=sha(await readFile(directory+'/'+name));for(const name of ['package.json','pnpm-lock.yaml'])source[name]=sha(await readFile(name));return source;}
const startedAt=new Date().toISOString(),sourceBefore=await sourceFingerprint(),cluster=await startCluster('operations-'+Date.now());
cluster.admin.on('error',()=>{}); // Fault-injected terminated idle connection; never dump pg Client.
const root=cluster.dir,repository=resolve(root,'repository'),scratch=resolve(root,'scratch');await mkdir(repository);await mkdir(scratch);
const evidence:any={scope:'SYNTHETIC_LOCAL_POSTGRES_HTTP_SUBPROCESSES_SAME_HOST',startedAt,status:'FAIL',node:process.version,checks:[],observedRetentionDays:0,offHostIndependence:false,realEnabled:false};
const check=(ops:string[],name:string,details:unknown={})=>{evidence.checks.push({ops,name,status:'PASS',details,at:new Date().toISOString()});console.log('PASS '+name);};
const wait=(ms:number)=>new Promise(r=>setTimeout(r,ms));
const execute=promisify(execFile);
const pools:Pool[]=[],children:ReturnType<typeof spawn>[]=[];
const user=new Pool({connectionString:cluster.configs.user.databaseUrl}),workerPool=new Pool({connectionString:cluster.configs.ingestion.databaseUrl});pools.push(user,workerPool);
const metrics:SafeEvent[]=[],mails:any[]=[],app=await buildApp(cluster.configs.user,user,{async send(m){mails.push(m);}},e=>metrics.push(e));
const path=(op:string)=>Object.entries(contract.paths).find(([,v]:any)=>v.post?.operationId===op)![0];
const request=(op:string,input:any={},workspaceId:string|null=null,version:number|null=null)=>({contractVersion:'2.0.0',requestId:token(),operationId:op,workspaceId,input,mutation:contract.components.schemas[op+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:token(),expectedWorkspaceVersion:version,expectedObjectVersions:{},previewToken:null}});
const headers={'content-type':'application/json','x-fw-contract-revision':revision,'x-fw-client':'web',origin:cluster.configs.user.origin};
async function call(op:string,input:any={},auth:any={},workspace:string|null=null,version:number|null=null) {return app.inject({method:'POST',url:path(op),headers:{...headers,...auth},payload:request(op,input,workspace,version)});}
try {
  const secretPath=resolve(root,'secret.json'),config={...cluster.configs.user,pepper:cluster.configs.user.pepper.toString('base64url'),replayKey:cluster.configs.user.replayKey.toString('base64url')};
  const saved={...process.env};
  try {
    for(const k of Object.keys(process.env))if(k.startsWith('FW_'))delete process.env[k];
    Object.assign(process.env,{FW_MODE:'synthetic-local',FW_PROFILE:'user',FW_SECRET_FILE:secretPath});await writeFile(secretPath,JSON.stringify(config));assert.equal((await loadConfig()).profile,'user');
    for(const patch of [{unknown:'private'},{factorKey:randomBytes(32).toString('base64url')},{origin:'https://evil.test'},{local:false},{recoveryEpoch:-1},{replayKey:config.pepper}]){await writeFile(secretPath,JSON.stringify({...config,...patch}));await assert.rejects(loadConfig());}
    await writeFile(secretPath,JSON.stringify(config));process.env.FW_INLINE_PASSWORD='sentinel';await assert.rejects(loadConfig());delete process.env.FW_INLINE_PASSWORD;
    process.env.FW_MODE='real';await assert.rejects(loadConfig(),/REAL_PROFILE_NOT_ENABLED/);
    delete process.env.FW_SECRET_FILE;await assert.rejects(loadConfig());
  }finally{for(const k of Object.keys(process.env))if(k.startsWith('FW_'))delete process.env[k];Object.assign(process.env,saved);await unlink(secretPath);}
  check(['OPS-01','OPS-03','OPS-04'],'strict loader rejects unknown/mismatched/real configuration',{encryptedMount:'NOT_PROVEN',fileAcl:'NOT_PROVEN',inlineSecrets:'public/runtime environment rejected; private synthetic secret file only'});
  await readiness(user,cluster.configs.user);await assert.rejects(readiness(cluster.admin,cluster.configs.user));
  for(const profile of ['ops','ingestion','market','forecast','agent','retention'] as const){const p=new Pool({connectionString:cluster.configs[profile].databaseUrl});try{await readiness(p,cluster.configs[profile]);}finally{await p.end();}}
  await cluster.admin.query('UPDATE fw_control.state SET locked=true');assert.equal((await app.inject('/health')).json().healthy,false);await assert.rejects(readiness(user,cluster.configs.user));await cluster.admin.query('UPDATE fw_control.state SET locked=false');
  await cluster.admin.query('REVOKE EXECUTE ON FUNCTION fw_dispatch.claim(text,text) FROM fw_runtime_ingestion');await assert.rejects(readiness(workerPool,cluster.configs.ingestion));await cluster.admin.query('GRANT EXECUTE ON FUNCTION fw_dispatch.claim(text,text) TO fw_runtime_ingestion');
  await cluster.admin.query('ALTER TABLE fw_finance.posting_lines RENAME TO missing_posting_lines');await assert.rejects(readiness(user,cluster.configs.user),/REQUIRED_SCHEMA_MISSING/);await cluster.admin.query('ALTER TABLE fw_finance.missing_posting_lines RENAME TO posting_lines');
  await assert.rejects(workerPool.query('SELECT * FROM fw_finance.accounts'),{code:'42501'});await assert.rejects(user.query('SELECT fw_control.enter_maintenance()'),{code:'42501'});
  const role=new URL(cluster.configs.user.databaseUrl).username;await cluster.admin.query(`GRANT fw_runtime_agent TO ${role}`);await assert.rejects(readiness(user,cluster.configs.user));await cluster.admin.query(`REVOKE fw_runtime_agent FROM ${role}`);
  check(['OPS-14','OPS-03'],'runtime readiness checks recovery, required grants and disjoint non-root role');
  // Actual contention and connection-loss against PostgreSQL, not just source assertions.
  const locker=await cluster.admin.connect();await locker.query('BEGIN');await locker.query("SELECT pg_advisory_xact_lock(hashtextextended('fw-runtime-migration',0))");
  await assert.rejects(migrateRuntime(cluster.admin),{code:'55P03'});const pid=(await locker.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;locker.on('error',()=>{});await cluster.admin.query('SELECT pg_terminate_backend($1)',[pid]);locker.release(true);
  assert.equal(await migrateRuntime(cluster.admin),false);
  const original=(await cluster.admin.query("SELECT checksum FROM fw_runtime_meta.migrations WHERE id='011'")).rows[0].checksum;
  await cluster.admin.query("UPDATE fw_runtime_meta.migrations SET checksum='fault-injected' WHERE id='011'");await assert.rejects(migrateRuntime(cluster.admin),/CHECKSUM_MISMATCH/);await cluster.admin.query("UPDATE fw_runtime_meta.migrations SET checksum=$1 WHERE id='011'",[original]);
  check(['OPS-10','OPS-11'],'migrator contention, terminated connection and checksum fault',{scope:'additive local runtime 001..011; target DB005 upgrade separate gate'});
  const password='Synthetic Operations password 2026!',registered=await call('registerIdentity',{email:'opsdrill@owner.test',name:'Synthetic sentinel owner',password,passwordConfirmation:password,syntheticAcknowledgement:true,installationPublicKey:null});assert.equal(registered.statusCode,200,registered.body);
  const verified=await call('verifyIdentityChallenge',{challengeId:registered.json().data.challengeId,code:mails.at(-1).code});assert.equal(verified.statusCode,200,verified.body);
  const cookies=verified.headers['set-cookie'] as string[],auth={cookie:cookies.map(x=>x.split(';')[0]).join('; '),'x-fw-csrf':cookies[1].split(';')[0].split('=')[1]};
  const subject=(await cluster.admin.query("SELECT id FROM fw_auth.identities WHERE email='opsdrill@owner.test'")).rows[0].id;
  const blob=(await cluster.admin.query('SELECT lo_from_bytea(0,$1) AS oid',[Buffer.from('SYNTHETIC_PRIVATE_BLOB')])).rows[0].oid;await cluster.admin.query('INSERT INTO fw_control.private_objects VALUES($1,$2)',[blob,subject]);
  const ws=await call('createWorkspace',{trackingStart:'2026-10-12',currency:'VND',timezone:'Asia/Ho_Chi_Minh'},auth);assert.equal(ws.statusCode,200,ws.body);const workspace=ws.json().data.id;
  const accountInput={name:'SYNTHETIC_PRIVATE_ACCOUNT',kind:'cash',opening:{value:'123456',currency:'VND'},openingDate:'2026-10-12'};
  const preview=await call('previewMutation',{operationId:'createAccount',input:accountInput,expectedWorkspaceVersion:0,expectedObjectVersions:{}},auth,workspace,0);assert.equal(preview.statusCode,200,preview.body);
  const accountReq=request('createAccount',accountInput,workspace,0);accountReq.mutation!.previewToken=preview.json().data.previewToken;
  const account=await app.inject({method:'POST',url:path('createAccount'),headers:{...headers,...auth},payload:accountReq});assert.equal(account.statusCode,200,account.body);
  await cluster.admin.query("INSERT INTO fw_business.plans(workspace_id,id,payload) VALUES($1,'synthetic_plan',$2)",[workspace,{name:'synthetic plan',amount:'17'}]);await cluster.admin.query("INSERT INTO fw_business.goals(workspace_id,id,payload) VALUES($1,'synthetic_goal',$2)",[workspace,{name:'synthetic goal',amount:'19'}]);
  await cluster.admin.query("INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,auth_epoch,recovery_epoch) VALUES('synthetic_old',$1,$2,'ingestion','synthetic_probe_old',0,0)",[workspace,subject]);
  const worker=new Worker(workerPool,'ingestion'),ticket=await worker.claim();assert(ticket);const old=(await cluster.admin.query("SELECT attempts,deadline FROM fw_dispatch.jobs WHERE id='synthetic_old'")).rows[0];
  await cluster.admin.query('SELECT fw_control.enter_maintenance()');assert.equal(await worker.claim(),null);assert.equal((await call('createWorkspace',{trackingStart:'2026-10-12',currency:'VND',timezone:'Asia/Ho_Chi_Minh'},auth)).statusCode,503);
  await assert.rejects(cluster.admin.query("INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,auth_epoch,recovery_epoch) VALUES('synthetic_blocked',$1,$2,'ingestion','synthetic_probe_blocked',0,0)",[workspace,subject]),{code:'55000'});
  assert.equal((await call('signOut',{sessionId:verified.json().data.session.sessionId},auth)).statusCode,200);
  assert.equal((await cluster.admin.query('SELECT fw_control.fence_workers() AS n')).rows[0].n,1);assert.equal(await worker.complete(ticket,{kind:'probe'}),false);
  const after=(await cluster.admin.query("SELECT attempts,deadline FROM fw_dispatch.jobs WHERE id='synthetic_old'")).rows[0];assert.deepEqual(after,old);
  await cluster.admin.query('UPDATE fw_control.state SET maintenance=false');
  check(['OPS-08','OPS-09'],'maintenance HTTP/enqueue/claim denial, signout retained and stale ticket publish rejected',{attemptsAndDeadlinePreserved:true,externalUnknownCommit:'separate existing J2 drill required'});
  // Real elapsed TTL with production wall clock. This proves seconds only.
  const retentionStart=Date.now();await cluster.admin.query("INSERT INTO fw_auth.nonces VALUES('ttl_probe','ttl_nonce',clock_timestamp()+interval '2 seconds')");await cluster.admin.query("INSERT INTO fw_auth.replays VALUES('ttl_scope','ttl_op','ttl_key','ttl_digest','SYNTHETIC_REPLAY_SECRET',clock_timestamp()+interval '2 seconds')");
  await cluster.admin.query("INSERT INTO fw_assistant.conversations VALUES($1,'ttl_conversation','{}')",[workspace]);
  await cluster.admin.query("INSERT INTO fw_assistant.messages(workspace_id,id,conversation_id,payload,expires_at) VALUES($1,'ttl_message','ttl_conversation',$2,clock_timestamp()+interval '2 seconds')",[workspace,{text:'SYNTHETIC_PRIVATE_MESSAGE'}]);
  await cluster.admin.query("INSERT INTO fw_assistant.tool_snapshots VALUES($1,'ttl_snapshot',$2,clock_timestamp()+interval '2 seconds')",[workspace,{secret:'SYNTHETIC_PRIVATE_TOOL'}]);
  const retentionPool=new Pool({connectionString:cluster.configs.retention.databaseUrl});pools.push(retentionPool);
  await expireAuthArtifacts(user,'user');assert.equal((await cluster.admin.query("SELECT count(*) AS n FROM fw_auth.nonces WHERE principal='ttl_probe'")).rows[0].n,'1');await wait(2300);await expireAuthArtifacts(user,'user');
  assert.equal((await cluster.admin.query("SELECT count(*) AS n FROM fw_auth.nonces WHERE principal='ttl_probe'")).rows[0].n,'0');assert.equal((await cluster.admin.query("SELECT body FROM fw_auth.replays WHERE scope='ttl_scope'")).rows[0].body,null);
  await cluster.admin.query('UPDATE fw_control.state SET maintenance=true');await retentionPool.query('SELECT fw_control.purge_runtime_payloads()');await cluster.admin.query('UPDATE fw_control.state SET maintenance=false');
  assert.equal((await cluster.admin.query("SELECT count(*) AS n FROM fw_assistant.messages WHERE id='ttl_message'")).rows[0].n,'0');assert.equal((await cluster.admin.query("SELECT count(*) AS n FROM fw_assistant.tool_snapshots WHERE id='ttl_snapshot'")).rows[0].n,'0');
  check(['OPS-31'],'real elapsed 2-second auth TTL physically removes nonce/body, keeps marker',{elapsedMs:Date.now()-retentionStart,productionDaysObserved:false});
  const rsa=generateKeyPairSync('rsa',{modulusLength:3072}),publicPem=rsa.publicKey.export({type:'spki',format:'pem'}).toString(),privatePem=rsa.privateKey.export({type:'pkcs8',format:'pem'}).toString();
  const keyring:Record<string,string>={};for(const [p,c] of Object.entries(cluster.configs))for(const k of ['pepper','replayKey','factorKey'] as const)if(c[k])keyring[p+':'+k+':v1']=c[k]!.toString('base64url');
  const witnessKeys=generateKeyPairSync('ed25519'),witnessPrivate=witnessKeys.privateKey.export({type:'pkcs8',format:'pem'}).toString(),witnessPublic=witnessKeys.publicKey.export({type:'spki',format:'pem'}).toString();
  const journal=resolve(root,'witness.json');await writeFile(journal,'[]');const witness=new FileWitness(journal,witnessPrivate);
  const operatorFile=resolve(root,'operator.json'),stateFile=resolve(root,'operator-state.json');
  await writeFile(stateFile,JSON.stringify({dir:root,adminUrl:cluster.adminUrl}));await writeFile(operatorFile,JSON.stringify({mode:'synthetic-local',runtimeStateFile:stateFile,releaseFile:resolve(root,'missing-release.json'),oldWriterFenced:false,graceMs:500}));
  const cli=async(command:string)=>execute(process.execPath,['scripts/operate.ts',command,operatorFile],{env:{...process.env,FW_MODE:'synthetic-local'},windowsHide:true,timeout:10000});
  const status=(await cli('status')).stdout;assert.equal(JSON.parse(status).realEnabled,false);assert(!status.includes(new URL(cluster.adminUrl).password));
  await cli('maintenance');await cli('drain');await cli('fence');await cli('migrate');await assert.rejects(cli('open'));await assert.rejects(cli('restore'));await cluster.admin.query('UPDATE fw_control.state SET maintenance=false');
  const crashFile=resolve(root,'crash-secret.json');await writeFile(crashFile,JSON.stringify({...config,databaseUrl:'postgresql://synthetic:SYNTHETIC_DEPENDENCY_SECRET@127.0.0.1:1/postgres'}));
  let crashOutput='';try{await execute(process.execPath,['src/runtime/main.ts'],{env:{...process.env,FW_MODE:'synthetic-local',FW_PROFILE:'user',FW_SECRET_FILE:crashFile},windowsHide:true,timeout:10000});assert.fail('crash must fail');}catch(e){crashOutput=(e as any).stdout+(e as any).stderr;assert(crashOutput.includes('safeCode'));assert(!crashOutput.includes('SYNTHETIC_DEPENDENCY_SECRET'));assert(!crashOutput.includes('postgresql://'));}
  await unlink(crashFile);
  check(['OPS-08','OPS-10','OPS-13','OPS-19'],'actual host CLI status/maintenance/drain/fence/migrate, fail-closed open/restore and sanitized process crash');
  const financialRows=async(p:Pool)=>{const rows:Record<string,unknown>={};for(const t of ['fw_finance.accounts','fw_finance.ledger_accounts','fw_finance.events','fw_finance.entry_groups','fw_finance.posting_lines','fw_finance.history','fw_business.plans','fw_business.goals'])rows[t]=(await p.query(`SELECT row_to_json(t) AS data FROM ${t} t ORDER BY row_to_json(t)::text`)).rows;return rows;};
  const financialBefore=await financialRows(cluster.admin);
  const receipt=await backupSynthetic(cluster.admin,cluster.adminUrl,scratch,repository,publicPem,keyring);evidence.backup={...receipt,inventory:undefined,tableCount:Object.keys(receipt.inventory).length};
  await saveCatalog(repository,receipt,witnessPrivate);
  const catalogPath=resolve(repository,receipt.id+'.receipt.json'),catalogOriginal=await readFile(catalogPath,'utf8'),catalog=JSON.parse(catalogOriginal);catalog.receipt.snapshotStart='2100-01-01T00:00:00Z';await writeFile(catalogPath,JSON.stringify(catalog));await assert.rejects(pruneSyntheticRepository(repository,scratch,witnessPublic,1),/CATALOG_SIGNATURE_INVALID/);await writeFile(catalogPath,catalogOriginal);
  await assert.rejects(pruneSyntheticRepository(repository,scratch,witnessPublic,Number.MAX_SAFE_INTEGER),/PRUNE_SCRATCH_RESERVE_UNAVAILABLE/);assert.equal((await readdir(repository)).length,2);
  const sealed=await readFile(resolve(repository,receipt.id+'.sealed'));assert(!sealed.includes(Buffer.from('SYNTHETIC_PRIVATE_ACCOUNT')));assert(!sealed.includes(Buffer.from(keyring['user:pepper:v1'])));
  await assert.rejects(backupSynthetic(cluster.admin,cluster.adminUrl,scratch,resolve(root,'missing-destination'),publicPem,keyring));assert.deepEqual(await readdir(scratch),[]);
  check(['OPS-23'],'consistent exported PostgreSQL snapshot, encrypted pack+runtime key inventory and failed destination',{tables:Object.keys(receipt.inventory).length,largeObjects:receipt.largeObjects,offHost:false,scratchPruned:true});
  // Failure lower bound occurs after actual dump and readback. No simulated clock.
  await cluster.admin.query("INSERT INTO fw_business.goals(workspace_id,id,payload) VALUES($1,'synthetic_after_snapshot',$2)",[workspace,{name:'synthetic post-snapshot goal',amount:'23'}]);
  const failureAt=Date.now();evidence.rpo={milliseconds:rpoMs(receipt,failureAt),from:receipt.snapshotStart,to:new Date(failureAt).toISOString(),targetHours:24,scope:'synthetic point-in-time dump; no production scheduling observation',syntheticPostSnapshotRecordsLost:1};
  assert(evidence.rpo.milliseconds>=Date.parse(receipt.completedAt)-Date.parse(receipt.snapshotStart));
  check(['OPS-24'],'RPO measured from DB snapshot lower bound, including export/readback duration',evidence.rpo);
  // Fresh database has CONNECT revoked before import. Old login cannot touch restore.
  const db='fw_restore_'+Date.now(),restoreUrl=new URL(cluster.adminUrl);restoreUrl.pathname='/'+db;await cluster.admin.query('CREATE DATABASE '+db);
  const wrong=generateKeyPairSync('rsa',{modulusLength:2048}).privateKey.export({type:'pkcs8',format:'pem'}).toString();await assert.rejects(restoreSynthetic(restoreUrl.href,receipt,repository,scratch,wrong));
  const media1=resolve(root,'capsule-media-1.pem'),media2=resolve(root,'capsule-media-2.pem');await writeFile(media1,privatePem);await writeFile(media2,privatePem);await unlink(media1);
  const restoreStart=Date.now(),restored=await restoreSynthetic(restoreUrl.href,receipt,repository,scratch,await readFile(media2,'utf8'));assert(restored.locked);assert.deepEqual(restored.runtimeKeys,keyring);
  const restoredPool=new Pool({connectionString:restoreUrl.href});pools.push(restoredPool);assert.deepEqual(await financialRows(restoredPool),financialBefore);
  assert.equal((await restoredPool.query("SELECT count(*) AS n FROM fw_business.goals WHERE id='synthetic_after_snapshot'")).rows[0].n,'0');
  assert.equal((await restoredPool.query('SELECT lo_get($1) AS body',[blob])).rows[0].body.toString(),'SYNTHETIC_PRIVATE_BLOB');
  const oldLogin=new URL(cluster.configs.user.databaseUrl);oldLogin.pathname='/'+db;const oldLoginPool=new Pool({connectionString:oldLogin.href});try{await assert.rejects(oldLoginPool.query('SELECT 1'),{code:'42501'});}finally{await oldLoginPool.end();}
  assert.equal((await restoredPool.query('SELECT locked FROM fw_control.state')).rows[0].locked,true);
  for(const t of ['fw_auth.sessions','fw_ops.sessions','fw_auth.devices'])assert.equal(Number((await restoredPool.query(`SELECT count(*) AS n FROM ${t} WHERE NOT revoked`)).rows[0].n),0);
  for(const t of ['fw_auth.replays','fw_ops.replays'])assert.equal(Number((await restoredPool.query(`SELECT count(*) AS n FROM ${t} WHERE body IS NOT NULL`)).rows[0].n),0);
  assert.equal((await restoredPool.query('SELECT blocked_until::text AS t FROM fw_async.market_gate')).rows[0].t,'infinity');assert.equal((await restoredPool.query('SELECT open_until::text AS t FROM fw_assistant.inference_slot')).rows[0].t,'infinity');
  const stale={async append(){},async head(nonce:string){return witness.head(nonce+'wrong');}};await assert.rejects(reconcileRestore(restoredPool,stale,witnessPublic),/WITNESS_UNVERIFIED/);assert.equal((await restoredPool.query('SELECT locked FROM fw_control.state')).rows[0].locked,true);
  const head=await witness.head(token());assert.equal(head.entries.length,0);
  await witness.append({id:'deny_drill',subjectId:subject,epoch:1,kind:'erase'});await reconcileRestore(restoredPool,witness,witnessPublic);assert.equal((await restoredPool.query('SELECT state FROM fw_auth.identities WHERE id=$1',[subject])).rows[0].state,'erased');
  evidence.rto={milliseconds:Date.now()-restoreStart,from:new Date(restoreStart).toISOString(),to:new Date().toISOString(),scope:'decrypt/import/inventory/fence/credential+quota checks/fresh witness reconciliation; service remains closed to all pre-restore identities',excluded:['host provisioning','off-host download','key custody retrieval','DNS/TLS','new identity proof/enrollment','production financial service reopening']};
  check(['OPS-25','OPS-26','OPS-27','OPS-28'],'wrong capsule locks, second medium restore, default locked+revoked credentials, erased witness and quotas denied',{rto:evidence.rto,hostLoss:'source path not needed; physical independent host loss NOT RUN',financialRoundtrip:true});
  const erasure=await beginErasure(cluster.admin,subject,cluster.configs.user.pepper);const second=await beginErasure(cluster.admin,subject,cluster.configs.user.pepper);assert.equal(erasure.deny_id,second.deny_id);assert.equal(erasure.deadline.getTime(),second.deadline.getTime());
  const inaccessibleWitness={async append(){throw Error('SYNTHETIC_DESTINATION_OUTAGE');},async head(){throw Error('SYNTHETIC_DESTINATION_OUTAGE');}};await assert.rejects(inaccessibleWitness.append());assert.equal((await cluster.admin.query('SELECT state FROM fw_auth.identities WHERE id=$1',[subject])).rows[0].state,'erased');
  await purgeActiveSynthetic(cluster.admin,subject);const purge=await verifyActivePurge(cluster.admin,subject);assert.equal(purge.residual,0);assert.equal((await beginErasure(cluster.admin,subject,cluster.configs.user.pepper)).deadline.getTime(),erasure.deadline.getTime());
  const copyPurge=await pruneSyntheticRepository(repository,scratch,witnessPublic,1,1);assert.equal(copyPurge.purged,1);assert.equal(copyPurge.lastGoodPrivacyConflict,true);assert.equal((await readdir(repository)).length,0);await assert.rejects(readFile(resolve(repository,receipt.id+'.sealed')),{code:'ENOENT'});
  // Explicit fault-injected deadline metadata. This is a breach-branch test, never
  // evidence of observing the production 35-day deadline.
  await cluster.admin.query("UPDATE fw_control.erasures SET deadline=clock_timestamp()-interval '1 second' WHERE subject_id=$1",[subject]);assert.equal((await verifyActivePurge(cluster.admin,subject)).deadlineBreached,true);
  check(['OPS-29','OPS-30'],'deny despite witness failure, stable request, queried active purge, signed catalog/prune and deadline alarm',{active:purge,copy:copyPurge,timestampTamperRejected:true,insufficientMeasuredScratchRejected:true,hard34DaysObserved:false,packPurge24HoursObserved:false,deadline35DaysObserved:false,deadlineBranch:'FAULT_INJECTED_METADATA',otherRestoredCopyStillExists:true,completion:'PENDING; never claim all server copies purged'});
  const loadRegistration=await call('registerIdentity',{email:'load@owner.test',name:'Synthetic load owner',password,passwordConfirmation:password,syntheticAcknowledgement:true,installationPublicKey:null});assert.equal(loadRegistration.statusCode,200,loadRegistration.body);
  const loadVerified=await call('verifyIdentityChallenge',{challengeId:loadRegistration.json().data.challengeId,code:mails.at(-1).code});assert.equal(loadVerified.statusCode,200,loadVerified.body);
  const loadCookies=loadVerified.headers['set-cookie'] as string[],loadAuth={cookie:loadCookies.map(x=>x.split(';')[0]).join('; '),'x-fw-csrf':loadCookies[1].split(';')[0].split('=')[1]};
  const loadWorkspace=(await call('createWorkspace',{trackingStart:'2026-10-12',currency:'VND',timezone:'Asia/Ho_Chi_Minh'},loadAuth)).json().data.id;
  // Actual pool pressure: one held connection saturates a bounded synthetic pool.
  const pressurePool=new Pool({connectionString:cluster.configs.user.databaseUrl,max:1,connectionTimeoutMillis:100});const held=await pressurePool.connect();try{await assert.rejects(pressurePool.query('SELECT 1'),/timeout/);}finally{held.release();await pressurePool.end();}
  await assert.rejects(cluster.admin.query("DO $$ BEGIN RAISE EXCEPTION 'SYNTHETIC_SQL_SECRET';END $$"),{code:'P0001'});
  const nativeLog=await readFile(resolve(root,'postgres.log'),'utf8');assert(!nativeLog.includes('SYNTHETIC_SQL_SECRET'));
  // Real HTTP load/error output, not static redaction assertions.
  await app.listen({host:'127.0.0.1',port:0});const address=app.server.address() as {port:number},base='http://127.0.0.1:'+address.port,sentinels=['SYNTHETIC_RAW_NOTIFICATION','SYNTHETIC_OTP_349201','SYNTHETIC_PRIVATE_EMAIL@owner.test','SYNTHETIC_PROMPT','SYNTHETIC_SQL_SECRET'];
  const latencies:number[]=[],loadStart=performance.now();let completed=0;
  await Promise.all(Array.from({length:10},async()=>{for(let n=0;n<40;n++){const t=performance.now(),kind=n%3;const res=await fetch(base+(kind===0?'/health':path(kind===1?'signIn':'getWorkspace')),{method:kind===0?'GET':'POST',headers:kind===2?{...headers,...loadAuth}:{...headers,authorization:'Bearer '+sentinels[2]},...(kind===0?{}:{body:kind===1?JSON.stringify({raw:sentinels,password:sentinels[1],amount:'123456789',prompt:sentinels[3]}):JSON.stringify(request('getWorkspace',{},loadWorkspace))})});const body=await res.text();for(const sentinel of sentinels)assert(!body.includes(sentinel));assert([200,400].includes(res.status));latencies.push(performance.now()-t);completed++;}}));
  const safe=JSON.stringify(metrics);for(const sentinel of [...sentinels,'SYNTHETIC_PRIVATE_ACCOUNT','123456789',password,...Object.values(keyring)])assert(!safe.includes(sentinel));
  latencies.sort((a,b)=>a-b);evidence.load={scope:'loopback HTTP health + invalid ingress + authenticated PostgreSQL workspace reads; no production finance/provider capacity SLO',requests:completed,concurrency:10,elapsedMs:performance.now()-loadStart,p95Ms:latencies[Math.floor(latencies.length*.95)],p99Ms:latencies[Math.floor(latencies.length*.99)],telemetryEvents:metrics.length,poolPressure:'actual max1 exhaustion times out bounded',nativePgErrorSecretAbsent:true};
  await writeFile(resolve(root,'safe-telemetry.ndjson'),metrics.map(x=>JSON.stringify(x)).join('\n')+'\n');
  check(['OPS-19','OPS-22'],'400 real HTTP requests, private sentinels excluded from response/error and emitted telemetry',evidence.load);
  // Two OS processes. Killing producer proves process independence only, same host.
  const keys=generateKeyPairSync('ed25519'),privateKeyFile=resolve(root,'hb-private.pem'),publicKeyFile=resolve(root,'hb-public.pem'),eventsFile=resolve(root,'heartbeat-events.ndjson'),readyFile=resolve(root,'heartbeat-ready.json');await writeFile(privateKeyFile,keys.privateKey.export({format:'pem',type:'pkcs8'}));await writeFile(publicKeyFile,keys.publicKey.export({format:'pem',type:'spki'}));
  const receiverFile=resolve(root,'receiver.json');await writeFile(receiverFile,JSON.stringify({mode:'synthetic-local',publicKeyFile,missingMs:800,eventsFile,readyFile}));
  const receiver=spawn(process.execPath,['scripts/heartbeat-receiver.ts',receiverFile],{windowsHide:true,stdio:'ignore'});children.push(receiver);
  let port=0;for(let n=0;n<50;n++){try{port=JSON.parse(await readFile(readyFile,'utf8')).port;break;}catch{await wait(100);}}assert(port);
  const producerFile=resolve(root,'producer.json'),url=`http://127.0.0.1:${port}/heartbeat`;await writeFile(producerFile,JSON.stringify({mode:'synthetic-local',privateKeyFile,url}));
  const producer=spawn(process.execPath,['scripts/heartbeat-producer.ts',producerFile],{windowsHide:true,stdio:'ignore'});children.push(producer);await wait(500);const death=Date.now();producer.kill();await once(producer,'exit');await wait(1200);
  const events=()=>readFile(eventsFile,'utf8');assert((await events()).includes('HEARTBEAT_MISSING'));
  const claims={at:Date.now(),sequence:10000,code:'HEARTBEAT'},message={...claims,signature:sign(null,Buffer.from(jcs(claims)),keys.privateKey).toString('base64url')};assert.equal((await fetch(url,{method:'POST',body:JSON.stringify(message)})).status,204);assert.equal((await fetch(url,{method:'POST',body:JSON.stringify(message)})).status,400);assert((await events()).includes('HEARTBEAT_RECOVERED'));
  check(['OPS-20','OPS-21'],'separate receiver detects killed producer, signed recovery and duplicate denied',{elapsedMs:Date.now()-death,offHost:false,tlsFailure:'NOT RUN',clockRollback:'NOT RUN',thresholdMs:800});
  evidence.status='PASS';
}catch(e){evidence.failure={code:e instanceof Error?e.message.split('\n')[0]:'UNKNOWN'};throw e;}
finally {
  for(const child of children)if(child.exitCode===null&&child.signalCode===null){const exited=once(child,'exit');child.kill();await exited;}
  await app.close();for(const pool of pools)await pool.end();await cluster.stop();evidence.finishedAt=new Date().toISOString();
  const source=await sourceFingerprint();evidence.source=sourceBefore;evidence.sourceStable=jcs(sourceBefore)===jcs(source);if(!evidence.sourceStable){evidence.status='FAIL_SOURCE_CHANGED';process.exitCode=1;}
  const out=resolve('../docs/execution/evidence/backend-operations-2026-10-12');await mkdir(out,{recursive:true});const report=resolve(out,'operations-'+Date.now()+'.json');await writeFile(report,JSON.stringify(evidence,null,2)+'\n');console.log('Evidence: '+report);
}
