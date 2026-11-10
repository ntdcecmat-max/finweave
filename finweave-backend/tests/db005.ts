import assert from 'node:assert/strict';
import {generateKeyPairSync,createHash} from 'node:crypto';
import { readFile,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import type {ClientConfig} from 'pg';
import {migrate,catalogHash} from '../src/database/migrate.ts';
import type {Migration} from '../src/database/migrate.ts';
import {backfillDb005} from '../src/database/backfill-db005.ts';
import {root,sha256} from '../src/pins.ts';

export async function runDb005Tests(admin:Client,config:ClientConfig,evidenceDir:string){
 const migrations:Migration[]=JSON.parse(await readFile(resolve(root,'finweave-backend/database/db005-manifest.json'),'utf8')).migrations;
 const model=JSON.parse(await readFile(resolve(root,'docs/data/target-t1-async/target-model.json'),'utf8'));
 const cases:any[]=[];const trace:any[]=[];
 const record=(id:string,observed:unknown)=>cases.push({id,status:'PASS',observed});
 const client=new Client(config);await admin.query(`CREATE DATABASE ${config.database}`);await client.connect();
 // Capture executed SQL and outcomes without passwords, token values or financial table dumps.
 const original=client.query.bind(client);
 (client as any).query=async(...args:any[])=>{const sql=typeof args[0]==='string'?args[0]:args[0].text;try{const r=await (original as any)(...args);trace.push({sql,status:'OK',rowCount:r?.rowCount});return r;}catch(e){trace.push({sql,status:'ERROR',code:(e as any).code,message:(e as Error).message});throw e;}};
 const run=async(c:Client,through?:string,list=migrations)=>migrate(c,{releaseId:'FW-DB005-LOCAL-001',migrations:list,through});
 const negative=async(id:string,sql:string,code='23514')=>{await client.query('BEGIN');let err:any;try{await client.query(sql);await client.query('SET CONSTRAINTS ALL IMMEDIATE');}catch(e){err=e;}finally{await client.query('ROLLBACK');}assert.equal(err?.code,code,`${id}: ${err?.message??'unexpected success'}`);record(id,{code:err.code,message:err.message});};
 async function snapshot(c:Client,label:string){
  const catalog:any={};
  for(const [name,sql] of Object.entries({
   columns:"SELECT table_schema,table_name,column_name,data_type,udt_name,is_nullable,numeric_precision,numeric_scale,column_default FROM information_schema.columns WHERE table_schema IN ('fw','fw_infra') ORDER BY table_schema,table_name,ordinal_position",
   constraints:"SELECT n.nspname AS schema,c.relname AS table,k.conname,k.contype,k.convalidated,k.condeferrable,pg_get_constraintdef(k.oid) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('fw','fw_infra') ORDER BY 1,2,3",
   indexes:"SELECT schemaname,tablename,indexname,indexdef,indisvalid,indisready,indisunique,indnullsnotdistinct FROM pg_indexes x JOIN pg_index i ON i.indexrelid=to_regclass(quote_ident(x.schemaname)||'.'||quote_ident(x.indexname)) WHERE schemaname IN ('fw','fw_infra') ORDER BY 1,2,3",
   policies:"SELECT * FROM pg_policies WHERE schemaname IN ('fw','fw_infra') ORDER BY schemaname,tablename,policyname",
   grants:"SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema IN ('fw','fw_infra') ORDER BY 1,2,3,4",
   columnGrants:"SELECT table_schema,table_name,column_name,grantee,privilege_type FROM information_schema.role_column_grants WHERE table_schema IN ('fw','fw_infra') ORDER BY 1,2,3,4,5",
   functions:"SELECT n.nspname,p.proname,p.prosecdef,p.proconfig,p.proacl::text,pg_get_functiondef(p.oid) AS definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('fw','fw_infra') ORDER BY 1,2",
   triggers:"SELECT n.nspname,c.relname,t.tgname,t.tgenabled,pg_get_triggerdef(t.oid) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('fw','fw_infra') AND NOT t.tgisinternal ORDER BY 1,2,3",
   roles:"SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolbypassrls FROM pg_roles WHERE rolname LIKE 'fw_%' ORDER BY rolname",
   rls:"SELECT relname,relrowsecurity,relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='fw' AND c.relkind='r' ORDER BY relname",
   journal:"SELECT migration_name,checksum,runner_version,release_id,schema_from,schema_to,catalog_sha256 FROM fw_infra.migration_journal ORDER BY migration_name"
  })) catalog[name]=(await c.query(sql)).rows;
  const differences:any[]=[];
  for(const t of model.tables)for(const col of t.columns){
   const actual=catalog.columns.find((a:any)=>a.table_schema===(t.name==='migration_journal'?'fw_infra':'fw')&&a.table_name===t.name&&a.column_name===col.name);
   if(!actual) differences.push({table:t.name,column:col.name,kind:'MISSING_COLUMN'});
   else{
    const type=actual.data_type==='timestamp with time zone'?'timestamptz':actual.data_type==='ARRAY'?actual.udt_name.slice(1)+'[]':actual.data_type==='numeric'?(actual.numeric_precision?`numeric(${actual.numeric_precision},${actual.numeric_scale})`:'numeric'):actual.data_type;
    if(type!==col.type) differences.push({table:t.name,column:col.name,kind:'TYPE_DIFFERENCE',expected:col.type,actual:type,disposition:/^numeric\(/.test(col.type)&&type==='numeric'?'EXACT_CHECK_OVERLAY':'UNRESOLVED'});
    if((actual.is_nullable==='YES')!==col.nullable)differences.push({table:t.name,column:col.name,kind:'NULLABILITY_DIFFERENCE',expected:col.nullable,actual:actual.is_nullable});
   }
  }
  const actualFK=catalog.constraints.filter((a:any)=>a.contype==='f');
  const missingFK=model.foreignKeys.filter((f:any)=>!actualFK.some((a:any)=>a.table===f.table&&a.definition.replaceAll(' ','').includes(`FOREIGNKEY(${f.columns.join(',')})REFERENCESfw.${f.target}(${f.targetColumns.join(',')})`)));
  differences.push(...missingFK.map((f:any)=>({kind:'MISSING_FK',...f})));
  assert.equal(differences.filter(d=>d.kind!=='TYPE_DIFFERENCE'||d.disposition!=='EXACT_CHECK_OVERLAY').length,0,JSON.stringify(differences));
  assert.ok(catalog.indexes.every((i:any)=>i.indisvalid&&i.indisready));
  assert.ok(catalog.constraints.every((k:any)=>k.convalidated));
  assert.equal(catalog.rls.length,86);assert.ok(catalog.rls.every((r:any)=>r.relrowsecurity&&r.relforcerowsecurity));
  await writeFile(resolve(evidenceDir,`${label}-catalog.json`),JSON.stringify(catalog,null,2)+'\n');
  await writeFile(resolve(evidenceDir,`${label}-schema-diff.json`),JSON.stringify({target:model.id,differences,foreignKeys:actualFK.length,domainTables:catalog.rls.length,infrastructureTables:[...new Set(catalog.columns.filter((x:any)=>x.table_schema==='fw_infra').map((x:any)=>x.table_name))],semanticAcceptance:'NOT_FULL_DB005_RUNTIME_PARITY'},null,2)+'\n');
  return catalog;
 }
 try{
  await run(client,'003');
  await client.query(await readFile(resolve(root,'docs/data/physical/seed-synthetic.sql'),'utf8'));
  const before=(await client.query("SELECT sum(signed_amount)::text AS cash FROM fw.posting_lines WHERE ledger_account_id='LA_BANK'")).rows[0].cash;
  await run(client,'006');record('upgrade-expand-001-006',{baselineTables:54});
  const inputs=JSON.parse(await readFile(resolve(root,'finweave-backend/database/fixtures/db005-backfill.json'),'utf8'));
  await client.query("INSERT INTO fw.auth_client_instances(id,subject_id,public_key_spki,key_digest,state,auth_epoch,revoked_at) VALUES('LEGACY_REVOKED_FIXTURE','U_A','SYNTHETIC_NONCRYPTO_KEY','SYNTHETIC_DIGEST','revoked',0,clock_timestamp())");
  await assert.rejects(backfillDb005(client,inputs,{chunkSize:1,failAfterChunks:1,evidence:v=>trace.push({backfill:v})}),/INJECTED_BACKFILL_INTERRUPTION/);
  const firstToken=(await client.query("SELECT recovery_token FROM fw.identities WHERE id='U_A'")).rows[0].recovery_token;
  await assert.rejects(backfillDb005(client,{...inputs,revision:'CHANGED'}),/BACKFILL_INPUT_CHECKSUM_MISMATCH/);
  const progress=await backfillDb005(client,inputs,{chunkSize:1,evidence:v=>trace.push({backfill:v})});
  assert.equal((await client.query("SELECT recovery_token FROM fw.identities WHERE id='U_A'")).rows[0].recovery_token,firstToken);
  assert.ok(progress.every(p=>p.completed));record('backfill-interruption-resume-stable-random-token',progress);
  assert.deepEqual(await backfillDb005(client,inputs,{chunkSize:1}),progress);record('backfill-second-run-no-mutations',true);
  await run(client);record('upgrade-to-db005-complete-ddl',true);
  assert.equal((await client.query("SELECT sum(signed_amount)::text AS cash FROM fw.posting_lines WHERE ledger_account_id='LA_BANK'")).rows[0].cash,before);
  assert.equal((await client.query("SELECT status FROM fw.devices WHERE id='D_A'")).rows[0].status,'revoked');
  record('legacy-device-revoked-opening-preserved',true);
  assert.deepEqual(await run(client),[]);record('db005-rerun',true);
  await snapshot(client,'upgrade');
  await negative('journal-immutable',"UPDATE fw_infra.migration_journal SET release_id='forged'");
  await negative('journal-truncate-denied','TRUNCATE fw_infra.migration_journal');
  await assert.rejects(run(client,undefined,migrations.map(m=>m.id==='005'?{...m,sha256:'0'.repeat(64)}:m)),/MIGRATION_CHECKSUM_MISMATCH/);record('checksum-mismatch-halts-before-ddl',true);
  const contender=new Client(config);await contender.connect();
  try{await contender.query('SELECT pg_advisory_lock(1179997261,1)');await assert.rejects(run(client),/MIGRATION_LOCK_BUSY/);await contender.query('SELECT pg_advisory_unlock(1179997261,1)');record('dedicated-session-migration-lock',true);}finally{await contender.end();}
  await client.query('BEGIN; ALTER TABLE fw.accounts ADD COLUMN injected_drift text');await assert.rejects(run(client),/CATALOG_DRIFT/);await client.query('ROLLBACK');record('unexpected-catalog-drift-denied',true);
  await client.query('BEGIN; ALTER ROLE fw_agent BYPASSRLS');await assert.rejects(run(client),/CATALOG_DRIFT/);await client.query('ROLLBACK');record('role-authority-drift-denied',true);
  await client.query("BEGIN; ALTER TABLE fw_infra.migration_journal DISABLE TRIGGER USER; UPDATE fw_infra.migration_journal SET checksum=repeat('a',64) WHERE migration_name='005'");await assert.rejects(run(client),/JOURNAL_CHECKSUM_OR_ORDER_MISMATCH/);await client.query('ROLLBACK');record('durable-journal-checksum-mismatch-denied',true);
  const fault='BEGIN; CREATE TABLE fw.fault_probe(id text); SELECT 1/0; COMMIT;';const path='finweave-backend/.local/db005-fault.sql';await writeFile(resolve(root,path),fault);
  await assert.rejects(run(client,undefined,[...migrations,{id:'015',path,sha256:sha256(fault)}]),{code:'22012'});
  assert.equal((await client.query("SELECT to_regclass('fw.fault_probe') AS r")).rows[0].r,null);assert.equal((await client.query('SELECT count(*)::int AS n FROM fw_infra.migration_journal')).rows[0].n,14);record('middle-ddl-transaction-rollback-no-journal-success',true);
  await negative('money-fraction-rejected',"INSERT INTO fw.accounts(workspace_id,id,name,kind,opening,opening_date) VALUES('W_A','X','x','cash',1.5,current_date)");
  await client.query("INSERT INTO fw.holdings(workspace_id,id,kind,instrument_id,name) VALUES('W_A','H1','stock','I1','fixture')").catch(async(e)=>{if(e.code!=='23503')throw e;await client.query("INSERT INTO fw.instruments(id,symbol,exchange,currency,unit,active_from) VALUES('I1','TEST','SYNTHETIC','VND','share',current_date)");await client.query("INSERT INTO fw.holdings(workspace_id,id,kind,instrument_id,name) VALUES('W_A','H1','stock','I1','fixture')");});
  for(const value of ['0.000000001','NaN','Infinity','100000000000000000000'])await negative(`quantity-precision-${value}`,`INSERT INTO fw.holding_movements(workspace_id,id,holding_id,business_date,quantity,kind,reason,sequence_no,quantity_mode) VALUES('W_A','Mbad','H1',current_date,'${value}','declaration','fixture',1,'set')`);
  await client.query("INSERT INTO fw.holding_movements(workspace_id,id,holding_id,business_date,quantity,kind,reason,sequence_no,quantity_mode) VALUES('W_A','M1','H1',current_date,'12345678901234567890.12345678','declaration','fixture',1,'set')");record('quantity-20-plus-8-digits-preserved',(await client.query("SELECT quantity::text AS quantity FROM fw.holding_movements WHERE id='M1'")).rows[0]);
  await negative('quantity-delta-timeline-mismatch',"INSERT INTO fw.holding_movements(workspace_id,id,holding_id,business_date,quantity,delta,kind,reason,sequence_no,quantity_mode) VALUES('W_A','M2','H1',current_date,1,-1,'investment','fixture',2,'delta')");
  await negative('tenant-composite-fk',"INSERT INTO fw.ledger_accounts(workspace_id,id,account_id,kind) VALUES('W_B','bad','A_BANK','asset')",'23503');
  await negative('committed-balanced-append',"INSERT INTO fw.posting_lines(workspace_id,id,group_id,ledger_account_id,signed_amount) VALUES('W_A','BAD1','G_OPEN','LA_BANK',1),('W_A','BAD2','G_OPEN','LA_EQUITY',-1)");
  await negative('fence-rewind',"UPDATE fw.workspaces SET recovery_epoch=-1,version=version+1 WHERE id='W_A'");
  await negative('stable-recovery-token',"UPDATE fw.workspaces SET recovery_token=repeat('a',64),version=version+1 WHERE id='W_A'");
  await client.query("UPDATE fw.identities SET recovery_reset_required=false,version=version+1 WHERE id='U_A'; UPDATE fw.workspaces SET access_state='active',version=version+1 WHERE id='W_A'");
  const pub=generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey.export({type:'spki',format:'der'});const key=pub.toString('base64url'),digest=createHash('sha256').update(pub).digest('hex');
  await client.query("INSERT INTO fw.auth_client_instances(id,subject_id,public_key_spki,key_digest,state,auth_epoch) VALUES('NEW_TEST_INSTALL','U_A',$1,$2,'active',0)",[key,digest]);
  await client.query("INSERT INTO fw.devices(workspace_id,id,owner_id,platform,public_key,key_digest,name,app_version,consent_version,status,owner_epoch,signing_algorithm,public_key_format,credential_epoch,installation_id,authorized_until,recovery_token,recovery_control_epoch) VALUES('W_A','Dnew','U_A','android',$1,$2,'Fictional device','test','test','active',0,'ES256','base64url_der_spki',0,'NEW_TEST_INSTALL',clock_timestamp()+interval '1 hour',repeat('d',64),0)",[key,digest]);
  await client.query("INSERT INTO fw.collector_bindings(workspace_id,id,device_id,account_id,package_name,parser_profile_id,consent_at) VALUES('W_A','Bnew','Dnew','A_BANK','test.bank','test',clock_timestamp()); INSERT INTO fw.ingestion_receipts(workspace_id,id,device_id,binding_id,binding_version,event_key,revision,source_key,observed_at,parser_version,payload_digest,state,capture_epoch) VALUES('W_A','Rnew','Dnew','Bnew',1,'test_event',0,'test',clock_timestamp(),'test',repeat('a',64),'received',0)");
  const jobSql="INSERT INTO fw.jobs(workspace_id,id,job_type,domain_kind,domain_id,dedupe_key,state,next_attempt_at,generation,attempt_count,max_attempts,cancel_requested,recovery_epoch,policy_version,deadline_at) VALUES('W_A','J1','ingestion','ingestion_receipt','Rnew','Rnew','queued',clock_timestamp(),0,0,8,false,0,'FW-ASYNC-J2-001',clock_timestamp()+interval '1 hour')";
  await negative('job-unknown-policy',jobSql.replaceAll('FW-ASYNC-J2-001','unknown'));
  await negative('job-typed-domain-reference',jobSql.replaceAll("'Rnew'","'missing'"));
  await client.query(jobSql);
  await client.query('BEGIN; SET LOCAL ROLE fw_ingestion');const ticket=(await client.query("SELECT * FROM fw.claim_job('W_A','ingestion')")).rows[0];assert.ok(ticket);await client.query('COMMIT');
  await client.query('BEGIN; SET LOCAL ROLE fw_ingestion');await client.query("SELECT fw.heartbeat_job('W_A','J1',$1,$2,$3)",[ticket.generation,ticket.lease_token,ticket.recovery_epoch]);await client.query('COMMIT');
  await negative('null-ticket-cannot-bypass-sql-three-valued-logic',"SET LOCAL ROLE fw_ingestion; SELECT fw.assert_job_ticket('W_A','J1',NULL,NULL,NULL)");
  assert.equal((await client.query("SELECT attempt_count FROM fw.jobs WHERE id='J1'")).rows[0].attempt_count,1);record('registered-claim-heartbeat-does-not-increment-attempt',true);
  await negative('worker-wrong-profile-ticket',`SET LOCAL ROLE fw_market; SELECT fw.assert_job_ticket('W_A','J1',${ticket.generation},'${ticket.lease_token}',0)`);
  await client.query("UPDATE fw.collector_bindings SET enabled=false,version=version+1 WHERE id='Bnew'");
  await negative('stale-worker-consent-revoked',`SET LOCAL ROLE fw_ingestion; SELECT fw.assert_job_ticket('W_A','J1',${ticket.generation},'${ticket.lease_token}',0)`);
  await client.query("UPDATE fw.jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id='J1'; BEGIN; SET LOCAL ROLE fw_scheduler; SELECT fw.reap_job('W_A','J1'); COMMIT");
  assert.deepEqual((await client.query("SELECT state,lease_token,lease_until,attempt_count FROM fw.jobs WHERE id='J1'")).rows[0],{state:'queued',lease_token:null,lease_until:null,attempt_count:1});
  await negative('reaper-invalidates-old-ticket',`SET LOCAL ROLE fw_ingestion; SELECT fw.assert_job_ticket('W_A','J1',${ticket.generation},'${ticket.lease_token}',0)`);record('reaper-closes-attempt-and-preserves-counters',true);
  await negative('retry-does-not-extend-deadline',"UPDATE fw.jobs SET deadline_at=deadline_at+interval '1 hour' WHERE id='J1'");
  await client.query("INSERT INTO fw.snapshots(workspace_id,id,financial_version,as_of,refs,schema_ref,projection,refs_digest,engine_version) VALUES('W_A','S1',1,clock_timestamp(),'{}','test','{}',repeat('a',64),'test'); INSERT INTO fw.planning_scopes(workspace_id,id,kind,current_revision,version) VALUES('W_A','SC1','standalone',2,1)");
  await negative('one-standalone-scope-null-uniqueness',"INSERT INTO fw.planning_scopes(workspace_id,id,kind,current_revision,version) VALUES('W_A','SC2','standalone',1,1)",'23505');
  await client.query("INSERT INTO fw.plan_items(workspace_id,id,name,kind,amount,account_id,start_date,end_date,recurrence,day_of_month,category,scope_id) VALUES('W_A','PI1','Fixture','income',10,'A_BANK',current_date,current_date,'once',1,'test','SC1'); INSERT INTO fw.planning_revisions(workspace_id,id,scope_id,revision_no,base_snapshot_id,source_versions,engine_version,bundle_digest) VALUES('W_A','PR1','SC1',1,'S1','{}','test',repeat('a',64)),('W_A','PR2','SC1',2,'S1','{}','test',repeat('b',64)); INSERT INTO fw.planning_revision_items(workspace_id,id,planning_revision_id,plan_item_id,plan_item_version,frozen_item,item_digest) VALUES('W_A','PRI1','PR1','PI1',1,'{}',repeat('a',64)),('W_A','PRI2','PR2','PI1',1,'{}',repeat('a',64))");
  const link="INSERT INTO fw.actual_links(workspace_id,id,plan_item_id,plan_item_version,plan_version,occurrence_id,event_id,event_version,reason,planning_revision_id) VALUES('W_A','AL1','PI1',1,1,'O1','EV_OPEN',1,'synthetic guard probe','PR1')";
  await client.query(link);await negative('actual-family-active-across-revisions',link.replaceAll('AL1','AL2').replaceAll('PR1','PR2'));await negative('planning-history-immutable',"UPDATE fw.planning_revisions SET engine_version='forged' WHERE id='PR1'");
  await client.query("INSERT INTO fw.payload_objects(workspace_id,id,owner_module,object_kind,object_id,schema_ref,content_digest,content,policy) VALUES('W_A','FInput','Planning','forecast_input','FR1','test',repeat('a',64),'{}','frozen'),('W_A','FPage','Planning','forecast_page','FR1','test',repeat('b',64),'{}','frozen'),('W_A','FWrong','Market','forecast_input','FR1','test',repeat('c',64),'{}','frozen')");
  const forecast="INSERT INTO fw.forecast_runs(workspace_id,id,version,state,base_snapshot_id,base_financial_version,inputs_payload_id,input_digest,engine_version,model_version,seed,trials,cancel_requested) VALUES('W_A','FR1',1,'queued','S1',1,'FInput',repeat('a',64),'test','test','synthetic-seed',1,false)";
  await negative('forecast-cross-module-payload-denied',forecast.replaceAll('FInput','FWrong'));await client.query(forecast);
  await client.query("INSERT INTO fw.forecast_result_pages(workspace_id,id,run_id,page_index,payload_id,content_digest,schema_ref) VALUES('W_A','FP1','FR1',0,'FPage',repeat('b',64),'test')");
  await negative('forecast-input-immutable-after-enqueue',"UPDATE fw.forecast_runs SET seed='changed' WHERE id='FR1'");await negative('forecast-page-immutable',"DELETE FROM fw.forecast_result_pages WHERE id='FP1'");record('forecast-typed-payload-positive-and-frozen-guards',true);
  await client.query("BEGIN; SET LOCAL ROLE fw_owner_reader; SET LOCAL app.subject_id='U_A'; SET LOCAL app.workspace_id='W_A'");assert.equal((await client.query('SELECT id FROM fw.accounts')).rows.length,1);await client.query("SET LOCAL app.workspace_id='W_B'");assert.equal((await client.query('SELECT id FROM fw.accounts')).rows.length,0);await client.query('ROLLBACK');record('owner-tenant-isolation-real-role',true);
  await client.query('BEGIN; SET LOCAL ROLE fw_owner_reader');assert.equal((await client.query('SELECT id FROM fw.accounts')).rows.length,0);await client.query('ROLLBACK');record('pool-context-cleared-after-transaction',true);
  await client.query("UPDATE fw.workspaces SET access_state='erasing',version=version+1 WHERE id='W_A'");
  await client.query("BEGIN; SET LOCAL ROLE fw_owner_reader; SET LOCAL app.subject_id='U_A'; SET LOCAL app.workspace_id='W_A'");assert.equal((await client.query('SELECT id FROM fw.accounts')).rows.length,0);await client.query('ROLLBACK');record('erasing-workspace-denies-finance',true);
  await negative('erasing-cannot-reactivate',"UPDATE fw.workspaces SET access_state='active',version=version+1 WHERE id='W_A'");
  for(const role of ['fw_ops_business','fw_ops_identity','fw_ingestion','fw_import','fw_market','fw_agent','fw_forecast','fw_scheduler','fw_retention','fw_recovery','fw_quota']){
   await negative(`${role}-finance-select-denied`,`SET LOCAL ROLE ${role}; SELECT * FROM fw.accounts`,'42501');
   await negative(`${role}-customer-secret-denied`,`SET LOCAL ROLE ${role}; SELECT credential_hash FROM fw.identities`,'42501');
   await negative(`${role}-journal-ddl-denied`,`SET LOCAL ROLE ${role}; CREATE TABLE fw_infra.illegal(id text)`,'42501');
  }
  await negative('owner-hash-column-denied','SET LOCAL ROLE fw_owner_reader; SELECT credential_hash FROM fw.identities','42501');
  await negative('agent-active-plan-write-denied',"SET LOCAL ROLE fw_agent; UPDATE fw.financial_plans SET name='forged'",'42501');
  await negative('worker-posting-denied',"SET LOCAL ROLE fw_market; INSERT INTO fw.posting_lines(workspace_id,id,group_id,ledger_account_id,signed_amount) VALUES('W_A','X','G_OPEN','LA_BANK',1)",'42501');
  await client.query("INSERT INTO fw.provider_quota_buckets(id,namespace_digest,window_start,window_end,limit_value,reserved_count,version) VALUES('Q1','opaque1',clock_timestamp()-interval '1 minute',clock_timestamp()+interval '1 hour',1,0,1),('Q2','opaque2',clock_timestamp()-interval '1 minute',clock_timestamp()+interval '1 hour',0,0,1)");
  await negative('quota-atomic-all-buckets-rollback',"SET LOCAL ROLE fw_quota; SELECT fw.reserve_quota(ARRAY['Q1','Q2'])");
  assert.equal((await client.query("SELECT reserved_count::text AS n FROM fw.provider_quota_buckets WHERE id='Q1'")).rows[0].n,'0');
  await client.query("BEGIN; SET LOCAL ROLE fw_quota; SELECT fw.reserve_quota(ARRAY['Q1']); COMMIT");record('quota-positive-narrow-port-and-unknown-charged',true);
  await negative('quota-no-refund-or-overrun',"SET LOCAL ROLE fw_quota; SELECT fw.reserve_quota(ARRAY['Q1'])");
  await negative('quota-port-not-public',"SET LOCAL ROLE fw_market; SELECT fw.reserve_quota(ARRAY['Q1'])",'42501');
  await negative('quota-null-array-rejected',"SET LOCAL ROLE fw_quota; SELECT fw.reserve_quota(NULL)",'42501');
  await client.query("INSERT INTO fw.admin_principals(id,login_name,auth_ref,status,auth_epoch,mfa_required,version,password_hash) VALUES('OPS1','test_admin','local:test_admin','active',0,true,1,'DISABLED_TEST_HASH'); INSERT INTO fw.admin_mfa_factors(id,principal_id,method,secret_ref,status,counter,key_version,secret_ciphertext) VALUES('F1','OPS1','totp_sha1_6_30','local:test','active',0,'test',decode(repeat('00',28),'hex'))");
  await client.query('BEGIN; SET LOCAL ROLE fw_ops_identity');assert.equal((await client.query("SELECT fw.accept_totp_counter('F1',1) AS accepted")).rows[0].accepted,true);assert.equal((await client.query("SELECT fw.accept_totp_counter('F1',1) AS accepted")).rows[0].accepted,false);await client.query('COMMIT');record('totp-counter-single-acceptance',true);
  const erasure=`INSERT INTO fw.erasure_requests(id,scope_kind,target_token,request_key_digest,state,requested_by_token,backup_purge_due_at) VALUES('E1','identity','opaque_target','key1','requested','actor',statement_timestamp()+interval '35 days')`;
  await client.query(erasure);
  await negative('erasure-retry-cannot-reset-clock',erasure.replaceAll('E1','E2').replaceAll('key1','key2'));
  await negative('erasure-no-deadline-extension',"UPDATE fw.erasure_requests SET backup_purge_due_at=backup_purge_due_at+interval '1 day' WHERE id='E1'");
  await negative('erasure-invalid-parent',"INSERT INTO fw.erasure_requests(id,scope_kind,target_token,parent_request_id,request_key_digest,state,requested_by_token,backup_purge_due_at) VALUES('Ebad','workspace','child','E1','key','requested','actor',clock_timestamp()+interval '34 days')");
  await client.query("INSERT INTO fw.payload_objects(workspace_id,id,owner_module,object_kind,object_id,schema_ref,content_digest,content,policy,expires_at) VALUES('W_A','Pexpired','SharedTX','cache','cache1','test',repeat('a',64),'{\"synthetic\":true}','cache',clock_timestamp()-interval '1 minute')");
  await client.query("BEGIN; SET LOCAL ROLE fw_retention; SELECT fw.redact_expired_payload('W_A','Pexpired'); COMMIT");
  assert.deepEqual((await client.query("SELECT content,redacted_at IS NOT NULL AS redacted FROM fw.payload_objects WHERE id='Pexpired'")).rows[0],{content:null,redacted:true});record('retention-narrow-redaction-keeps-tombstone',true);
  // Clean path has no fixture credentials or finance data.
  await admin.query('CREATE DATABASE fw_synthetic_db005_clean');const clean=new Client({...config,database:'fw_synthetic_db005_clean'});await clean.connect();
  try{await run(clean);assert.deepEqual(await run(clean),[]);await snapshot(clean,'clean');record('clean-install-db005-and-rerun',true);}finally{await clean.end();}
  // A real failed CONCURRENTLY leaves an invalid index; retry repairs only exact ownership.
  await admin.query('CREATE DATABASE fw_synthetic_db005_index');const indexDb=new Client({...config,database:'fw_synthetic_db005_index'});await indexDb.connect();
  try{
   await run(indexDb,'008');
   await indexDb.query("INSERT INTO fw.identities(id,email,display_name,credential_hash,state,auth_epoch,recovery_token,recovery_control_epoch,recovery_reset_required) VALUES('IX1','ix1@test.test','duplicate','DISABLED','active',0,repeat('1',64),0,true),('IX2','ix2@test.test','duplicate','DISABLED','active',0,repeat('2',64),0,true)");
   const definition='CREATE UNIQUE INDEX fault_concurrent ON fw.identities USING btree (display_name)';const indexSql=definition.replace('CREATE UNIQUE INDEX ','CREATE UNIQUE INDEX CONCURRENTLY ')+';';const indexPath='finweave-backend/.local/concurrent-009.sql';await writeFile(resolve(root,indexPath),indexSql);
   const list:Migration[]=[...migrations.slice(0,8),{id:'009',path:indexPath,sha256:sha256(indexSql),concurrentIndex:{name:'fw.fault_concurrent',definition}}];
   await assert.rejects(run(indexDb,undefined,list),{code:'23505'});
   assert.equal((await indexDb.query("SELECT indisvalid FROM pg_index WHERE indexrelid='fw.fault_concurrent'::regclass")).rows[0].indisvalid,false);
   assert.equal((await indexDb.query('SELECT count(*)::int AS n FROM fw_infra.migration_journal')).rows[0].n,8);record('concurrent-ddl-failure-invalid-index-no-success-journal',true);
   await indexDb.query("UPDATE fw.identities SET display_name='unique',version=version+1 WHERE id='IX2'");
   await indexDb.query('BEGIN; DROP INDEX fw.fault_concurrent; CREATE INDEX fault_concurrent ON fw.identities(email)');
   await assert.rejects(run(indexDb,undefined,list),/CONCURRENT_INDEX_DEFINITION_MISMATCH/);await indexDb.query('ROLLBACK');record('concurrent-name-collision-different-definition-denied',true);
   assert.deepEqual(await run(indexDb,undefined,list),['009']);assert.equal((await indexDb.query("SELECT indisvalid FROM pg_index WHERE indexrelid='fw.fault_concurrent'::regclass")).rows[0].indisvalid,true);record('concurrent-invalid-index-repaired-and-resumed',true);
   const nextDefinition='CREATE INDEX fault_after_create ON fw.identities USING btree (email)';const nextSql=nextDefinition.replace('CREATE INDEX ','CREATE INDEX CONCURRENTLY ')+';';const nextPath='finweave-backend/.local/concurrent-010.sql';await writeFile(resolve(root,nextPath),nextSql);
   const next:Migration[]=[...list,{id:'010',path:nextPath,sha256:sha256(nextSql),concurrentIndex:{name:'fw.fault_after_create',definition:nextDefinition}}];
   const native=indexDb.query.bind(indexDb);let injected=false;(indexDb as any).query=async(...a:any[])=>{const r=await (native as any)(...a);if(a[0]===nextSql&&!injected){injected=true;throw new Error('INJECTED_AFTER_INDEX_CREATE');}return r;};
   await assert.rejects(run(indexDb,undefined,next),/INJECTED_AFTER_INDEX_CREATE/);(indexDb as any).query=native;
   assert.deepEqual(await run(indexDb,undefined,next),['010']);record('concurrent-commit-before-journal-resume-valid-exact-index',true);
  }finally{await indexDb.end();}
  await admin.query('CREATE DATABASE fw_synthetic_db005_provenance');const gap=new Client({...config,database:'fw_synthetic_db005_provenance'});await gap.connect();
  try{
   await run(gap,'003');await gap.query(await readFile(resolve(root,'docs/data/physical/seed-synthetic.sql'),'utf8'));await run(gap,'006');
   await assert.rejects(backfillDb005(gap,{revision:'MISSING_PROVENANCE_FIXTURE',rows:{}},{chunkSize:1}),/LEGACY_PROVENANCE_REQUIRED:devices:signing_algorithm/);
   assert.equal((await gap.query("SELECT installation_id FROM fw.devices WHERE id='D_A'")).rows[0].installation_id,null);
   await assert.rejects(run(gap),{code:'23502'});assert.equal((await gap.query('SELECT max(migration_name) AS n FROM fw_infra.migration_journal')).rows[0].n,'006');record('missing-legacy-provenance-quarantines-and-constraints-cannot-cutover',true);
  }finally{await gap.end();}
  return cases;
 }catch(e){cases.push({id:'runtime-failure',status:'FAIL',message:(e as Error).message,code:(e as any).code});throw e;}
 finally{await client.query('ROLLBACK').catch(()=>{});await writeFile(resolve(evidenceDir,'cases.json'),JSON.stringify(cases,null,2)+'\n');await writeFile(resolve(evidenceDir,'executed-sql.json'),JSON.stringify(trace,null,2)+'\n');await client.end();}
}
