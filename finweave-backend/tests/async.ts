import assert from 'node:assert/strict';
import { Pool } from 'pg';
import type { Config,Profile } from '../src/runtime/config.ts';
import { generateKeyPairSync,sign,randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { buildApp } from '../src/runtime/app.ts';
import { contract,revision,validator } from '../src/runtime/contracts.ts';
import { token,jcs,sha } from '../src/runtime/crypto.ts';
import { accountMask,itemDigest } from '../src/runtime/sources.ts';
import { NativeOutboxSimulator } from '../src/runtime/native-simulator.ts';
import { AsyncPipeline,StubPriceAdapter,ProviderFailure,retryAfter } from '../src/runtime/async-pipeline.ts';
import { Worker } from '../src/runtime/worker.ts';
import { unitOfWork } from '../src/runtime/uow.ts';
import { fenceRestore } from '../src/runtime/recovery.ts';
import { spawn } from 'node:child_process';
import { readFile,readdir } from 'node:fs/promises';
import { checkObservationCompatibility } from '../src/runtime/async-observation-readiness.ts';
export async function runAsyncTests(admin:Pool,configs:Record<Profile,Config>,dir:string) {
 const up=new Pool({connectionString:configs.user.databaseUrl,max:4}),ip=new Pool({connectionString:configs.ingestion.databaseUrl,max:4}),mp=new Pool({connectionString:configs.market.databaseUrl,max:4}),op=new Pool({connectionString:configs.ops.databaseUrl,max:1});
 const app=await buildApp(configs.user,up,{async send() {}}),ingest=new AsyncPipeline(ip,'ingestion'),adapter=new StubPriceAdapter(),market=new AsyncPipeline(mp,'market',adapter);
 app.addHook('onError',async(_req,_res,e)=>{if(!(e as any).status)console.error('Async diagnostic:',e.message);});
 const groups:string[]=[];const passed=(name:string)=>{groups.push(name);console.log('PASS '+name);};
 const path=(id:string)=>Object.entries(contract.paths).find(([,v]:any)=>v.post.operationId===id)![0];
 const keypair=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),publicKey=keypair.publicKey.export({type:'spki',format:'der'}).toString('base64url');
 const subject=token(),workspace=token(),account=token(),device=token(),credential=token(),session=token(),cookie=token(),csrf=token();
 const cfg=configs.user;
 const { digest }=await import('../src/runtime/crypto.ts');
 const web={'x-fw-client':'web',origin:cfg.origin,cookie:'fw_test_session='+cookie,'x-fw-csrf':csrf,'x-fw-contract-revision':revision};
 async function version() {return (await admin.query('SELECT version FROM fw_finance.workspaces WHERE id=$1',[workspace])).rows[0].version;}
 function envelope(id:string,input:any,key=token(),v=0):any {return {contractVersion:'2.0.0',requestId:token(),operationId:id,workspaceId:workspace,input,mutation:contract.components.schemas[id+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:key,expectedWorkspaceVersion:v,expectedObjectVersions:{},previewToken:null}};}
 async function call(id:string,input:any,key=token()) {
 const req=envelope(id,input,key,await version());const res=await app.inject({method:'POST',url:path(id),headers:web,payload:req});
 return {res,body:res.json(),req};
 }
 async function upload(req:any) {
 const claims={revision,purpose:req.operationId,method:'POST',path:path(req.operationId),audience:cfg.origin,bodyDigest:sha(jcs(req)),credentialDigest:sha(credential),challengeId:null,challengeNonce:null,issuedAt:Math.floor(Date.now()/1000),nonce:token()};
 const proof=Buffer.from(jcs(claims)).toString('base64url')+'.'+sign('sha256',Buffer.from(jcs(claims)),{key:keypair.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
 const res=await app.inject({method:'POST',url:path(req.operationId),headers:{'x-fw-contract-revision':revision,authorization:'Bearer '+credential,'x-fw-collector-proof':proof},payload:req});
 const body=res.json();assert(validator(res.statusCode<300?req.operationId+'Reply':'Error')(body),JSON.stringify(body));return {res,body:body as any};
 }
 let binding:string;
 const item=(eventKey:string,reference:string|null='syn_alpha',changes:any={})=>{const x={eventKey,bindingId:binding,bindingVersion:0,sourceKey:'synthetic-bank',revision:0,observedAt:new Date().toISOString(),parserVersion:'synthetic-v1',normalizedEvidence:{amount:'125000',currency:'VND',direction:'income',sourceAccountRef:accountMask(account),transactionRef:reference,sourceOccurredAt:new Date(Date.now()-1000).toISOString(),ruleStatus:'complete',...changes}};return {...x,payloadDigest:itemDigest(x)};};
 async function dueAll(profile='market') {await admin.query("UPDATE fw_dispatch.jobs SET due_at=clock_timestamp()-interval '1 second' WHERE workspace_id=$1 AND profile=$2 AND state='queued'",[workspace,profile]);}
 async function request(ids:string[],key=token()) {const x=await call('requestPriceRefresh',{holdingIds:ids},key);assert.equal(x.res.statusCode,200,JSON.stringify(x.body));return x;}
 async function holding(id:string,entitlement:string|null) {
 const payload={kind:'stock',name:'Synthetic fixture',catalogId:'manual-stock',profileConfirmedVersion:1,market:'HOSE',product:null,purity:null,quantityDate:'2026-01-01',cost:null,costDate:null,costQuantity:null,archived:false};
 await admin.query('INSERT INTO fw_finance.holdings(workspace_id,id,payload) VALUES($1,$2,$3)',[workspace,id,payload]);
 const movement=token();await admin.query('INSERT INTO fw_finance.holding_movements(workspace_id,id,holding_id,mode,quantity,business_date,payload) VALUES($1,$2,$3,$4,$5,$6,$7)',[workspace,movement,id,'set','1',payload.quantityDate,{id:movement,holdingId:id,version:0,quantity:{value:'1',unit:'share'},delta:null,date:payload.quantityDate,kind:'declaration',eventId:null,reason:'Explicit synthetic quantity fixture',evidenceIds:[]}]);
 if(entitlement)await admin.query('INSERT INTO fw_async.holding_sources VALUES($1,$2,$3)',[workspace,id,entitlement]);
 }
 const entitlement='stub-rights';
 try {
 const expectedMigrations:Record<string,string>={};
 for(const file of await readdir('database/runtime'))if(/^\d{3}_.*\.sql$/.test(file))expectedMigrations[file.slice(0,3)]=sha(await readFile(resolve('database/runtime',file)));
 await checkObservationCompatibility(admin,[configs.ingestion,configs.market],expectedMigrations);
 await assert.rejects(checkObservationCompatibility(admin,[configs.ingestion,configs.market],{...expectedMigrations,'006':'wrong-checksum'}),/OBSERVATION_MIGRATION_MISMATCH/);
 await admin.query('REVOKE EXECUTE ON FUNCTION fw_ops.apply_controls(text) FROM fw_runtime_ingestion');
 try {await assert.rejects(checkObservationCompatibility(admin,[configs.ingestion,configs.market],expectedMigrations),/OBSERVATION_WORKER_PORT_DENIED/);}
 finally {await admin.query('GRANT EXECUTE ON FUNCTION fw_ops.apply_controls(text) TO fw_runtime_ingestion');}
 passed('observation preflight uses actual worker roles; migration drift and missing Ops broker execution fail before launching workers');
 await admin.query("INSERT INTO fw_auth.identities(id,email,name,password,state) VALUES($1,$2,'Synthetic','unused','active')",[subject,subject+'@synthetic.test']);
 await admin.query("INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES($1,$2,'2026-01-01')",[workspace,subject]);
 await admin.query("INSERT INTO fw_auth.sessions(id,subject_id,kind,secret_digest,csrf_digest,epoch,recovery_epoch,expires_at,absolute_at,idle_at,reauth_at) VALUES($1,$2,'web',$3,$4,0,0,clock_timestamp()+interval '1 hour',clock_timestamp()+interval '1 hour',clock_timestamp()+interval '1 hour',clock_timestamp())",[session,subject,digest(cfg.pepper,'session',cookie),digest(cfg.pepper,'csrf',csrf)]);
 await admin.query('INSERT INTO fw_finance.accounts(workspace_id,id,payload) VALUES($1,$2,$3)',[workspace,account,{name:'Synthetic cash',kind:'cash',opening:{value:'0',currency:'VND'},openingDate:'2026-01-01',archived:false}]);
 await admin.query("INSERT INTO fw_finance.ledger_accounts VALUES($1,$2,$3,'asset')",[workspace,'asset:'+account,account]);
 await admin.query("INSERT INTO fw_auth.devices(id,subject_id,workspace_id,public_key,name,app_version,consent,auth_epoch,recovery_epoch,authorized_until) VALUES($1,$2,$3,$4,'Synthetic device','local','synthetic-consent-v1',0,0,clock_timestamp()+interval '30 days')",[device,subject,workspace,publicKey]);
 await admin.query("INSERT INTO fw_auth.collectors VALUES($1,$2,false,0,clock_timestamp()+interval '1 day')",[digest(cfg.pepper,'collector',credential),device]);
 const bound=await call('bindCollector',{deviceId:device,packageName:'dev.finweave.synthetic',accountId:account,parserProfileId:'synthetic-v1',expectedVersion:0});assert.equal(bound.res.statusCode,200,JSON.stringify(bound.body));binding=bound.body.data.id;
 const outboxKey=randomBytes(32),outboxPath=resolve(dir,'encrypted-outbox');
 const sim=new NativeOutboxSimulator(outboxPath,outboxKey,{workspaceId:workspace,deviceId:device,deviceEpoch:0});
 await sim.capture(item('event_alpha'));const sent=await sim.batch(0);assert(sent);const accepted=await upload(sent);assert.equal(accepted.res.statusCode,202,JSON.stringify(accepted.body));
 assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_async.receipts WHERE workspace_id=$1',[workspace])).rows[0].n,1);
 assert.equal((await sim.counts()).pending,1); // ACK deliberately lost.
 const restarted=new NativeOutboxSimulator(outboxPath,outboxKey,{workspaceId:workspace,deviceId:device,deviceEpoch:0}),retry=await restarted.batch(0),replayed=await upload(retry);assert.equal(replayed.body.data.receipts[0].receiptId,accepted.body.data.receipts[0].receiptId);
 assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_dispatch.jobs WHERE workspace_id=$1',[workspace])).rows[0].n,1);
 await assert.rejects(restarted.acknowledge(retry,{...replayed.body,requestId:'wrong'}),/ACK_PROTOCOL_ERROR/);assert.equal((await restarted.counts()).pending,1);
 await restarted.acknowledge(retry,replayed.body);assert.deepEqual(await restarted.counts(),{pending:0,acked:1});
 passed('native-shaped encrypted durable outbox + lost ACK replay + malformed ACK keeps pending + one receipt/job');
 const ticket=await ingest.worker.claim();assert(ticket);const v0=await version();
 await assert.rejects(unitOfWork(ip,async tx=>{await tx.query('SELECT fw_async.process_receipt($1,$2,$3,$4)',[ticket.id,ticket.generation,ticket.lease_token,ticket.recovery_epoch]);throw Error('CRASH_BEFORE_COMMIT');}),/CRASH_BEFORE_COMMIT/);
 assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_finance.events WHERE workspace_id=$1',[workspace])).rows[0].n,0);assert.equal(await version(),v0);
 assert.equal(await ingest.execute(ticket),true);assert.equal(await ingest.execute(ticket),false);
 const posted=(await admin.query('SELECT * FROM fw_async.receipts WHERE workspace_id=$1',[workspace])).rows[0];assert.equal(posted.state,'posted');assert.equal((await admin.query('SELECT sum(signed_amount)::text AS total FROM fw_finance.posting_lines WHERE workspace_id=$1',[workspace])).rows[0].total,'0');
 passed('ingestion effect/ledger seal/outcome atomic; rollback before commit; lost completion replay cannot double-post');
 const original=sent.input.items[0],sameEconomic=item('event_beta');sameEconomic.normalizedEvidence.sourceOccurredAt=original.normalizedEvidence.sourceOccurredAt;sameEconomic.payloadDigest=itemDigest(sameEconomic);
 await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[sameEconomic]}));await ingest.runOnce();
 assert.equal((await admin.query("SELECT state FROM fw_async.receipts WHERE event_key='event_beta'")).rows[0].state,'ignored');
 const conflict={...original,normalizedEvidence:{...original.normalizedEvidence,amount:'999'}};conflict.payloadDigest=itemDigest(conflict);
 assert.equal((await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[conflict]}))).res.statusCode,422);
 const ambiguous=item('event_ambiguous',null);await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[ambiguous]}));await ingest.runOnce();
 const review=(await admin.query("SELECT * FROM fw_async.receipts WHERE event_key='event_ambiguous'")).rows[0];assert.equal(review.state,'needs_review');assert(review.review_id);
 assert.equal((await call('getReviewCase',{id:review.review_id})).res.statusCode,200);
 const objectVersions={[review.review_id]:0,[review.event_id]:0,[account]:(await admin.query('SELECT version FROM fw_finance.accounts WHERE workspace_id=$1 AND id=$2',[workspace,account])).rows[0].version};
 const resolutionInput={id:review.review_id,resolution:{action:'postPending',reason:'Owner verified synthetic evidence'}};
 const pv=envelope('previewMutation',{operationId:'resolveReviewCase',input:resolutionInput,expectedWorkspaceVersion:await version(),expectedObjectVersions:objectVersions},token(),await version());pv.mutation.expectedObjectVersions=objectVersions;
 const preview=await app.inject({method:'POST',url:path('previewMutation'),headers:web,payload:pv});assert.equal(preview.statusCode,200,preview.body);
 const confirm=envelope('resolveReviewCase',resolutionInput,token(),await version());confirm.mutation.expectedObjectVersions=objectVersions;confirm.mutation.previewToken=preview.json().data.previewToken;
 const resolved=await app.inject({method:'POST',url:path('resolveReviewCase'),headers:web,payload:confirm});assert.equal(resolved.statusCode,200,resolved.body);
 const secondConfirm=await app.inject({method:'POST',url:path('resolveReviewCase'),headers:web,payload:confirm});assert.equal(secondConfirm.statusCode,200,secondConfirm.body);
 assert.equal((await admin.query('SELECT state FROM fw_async.receipts WHERE id=$1',[review.id])).rows[0].state,'posted');

 const unsafe=item('event_unsafe','syn_otp123456',{sourceAccountRef:'123456789012'});assert.equal((await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[unsafe]}))).res.statusCode,422);
 const duplicate=item('duplicate_batch');assert.equal((await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[duplicate,duplicate]}))).res.statusCode,400);
 passed('trusted semantic duplicate ignored; digest conflict/raw/full-account/OTP rejected; ambiguous evidence goes through Review preview/confirm/replay without duplicate posting');
 const consentPending=item('event_consent_withdrawn','syn_consent_withdrawn');
 assert.equal((await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[consentPending]}))).res.statusCode,202);
 const consentTicket=await ingest.worker.claim();assert(consentTicket);
 await admin.query("UPDATE fw_auth.devices SET consent='withdrawn' WHERE id=$1",[device]);
 assert.equal(await ingest.worker.heartbeat(consentTicket),false);assert.equal(await ingest.execute(consentTicket),false);
 assert.equal((await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[consentPending]}))).res.statusCode,403);
 assert.equal(await ingest.worker.claim(),null);
 const withdrawn=(await admin.query("SELECT state,event_id FROM fw_async.receipts WHERE event_key='event_consent_withdrawn'")).rows[0];assert.equal(withdrawn.state,'ignored');assert.equal(withdrawn.event_id,null);
 // Restore only this disposable test fixture to exercise the remaining independent guards.
 await admin.query("UPDATE fw_auth.devices SET consent='synthetic-consent-v1' WHERE id=$1",[device]);
 const pending=item('event_revoked','syn_revoked');await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[pending]}));const stale=await ingest.worker.claim();assert(stale);
 await admin.query('UPDATE fw_async.bindings SET enabled=false,version=version+1 WHERE workspace_id=$1',[workspace]);assert.equal(await ingest.execute(stale),true);assert.equal((await admin.query("SELECT state FROM fw_async.receipts WHERE event_key='event_revoked'")).rows[0].state,'ignored');
 await admin.query('UPDATE fw_auth.devices SET revoked=true,epoch=epoch+1 WHERE id=$1',[device]);assert.equal((await upload(envelope('ingestNotifications',{deviceId:device,deviceEpoch:0,recoveryEpoch:0,items:[original]}))).res.statusCode,403);
 passed('consent withdrawal fences heartbeat/effect/replay; binding rechecked at effect; device revoke checked before durable replay');
 const worker=new Worker(ip,'ingestion'),probe=token();
 await admin.query("INSERT INTO fw_dispatch.jobs(id,workspace_id,subject_id,profile,domain_id,auth_epoch,recovery_epoch) VALUES($1,$2,$3,'ingestion',$4,0,0)",[probe,workspace,subject,token()]);
 const lease=await worker.claim();assert(lease);assert.equal(await worker.heartbeat(lease),true);
 await admin.query("UPDATE fw_dispatch.jobs SET lease_until=clock_timestamp() WHERE id=$1",[lease.id]);assert.equal(await worker.heartbeat(lease),false);assert.equal(await worker.complete(lease,{}),false);
 assert.equal(await worker.claim(),null);await dueAll('ingestion');const replacement=await worker.claim();assert(replacement);assert.equal(replacement.generation,lease.generation+1);assert.equal(await worker.complete(lease,{}),false);
 await worker.fail(replacement,'TRANSIENT',true,new Date(Date.now()+3600000).toISOString());
 const f=(await admin.query('SELECT * FROM fw_dispatch.jobs WHERE id=$1',[probe])).rows[0];assert.equal(f.state,'failed');const before={attempts:f.attempts,deadline:f.deadline.getTime(),max:f.max_attempts};
 await admin.query("UPDATE fw_dispatch.jobs SET due_at=clock_timestamp() WHERE id=$1",[probe]);
 const retried=(await ip.query("SELECT fw_dispatch.manual_retry('ingestion',$1,$2) AS ok",[probe,f.control_version])).rows[0].ok;assert.equal(retried,true);
 const after=(await admin.query('SELECT * FROM fw_dispatch.jobs WHERE id=$1',[probe])).rows[0];assert.equal(after.attempts,before.attempts);assert.equal(after.deadline.getTime(),before.deadline);assert.equal(after.max_attempts,before.max+3);
 const cancel=await worker.claim();assert(cancel);assert.equal((await ip.query('SELECT fw_dispatch.cancel($1,$2,$3,$4,$5) AS ok',['ingestion',cancel.id,cancel.generation,cancel.lease_token,cancel.recovery_epoch])).rows[0].ok,true);assert.equal(await worker.complete(cancel,{}),false);
 passed('heartbeat expiry equality, stale generation fence, floor beyond deadline, manual retry preserves attempts/deadline, cancel late result');
 await admin.query("INSERT INTO fw_async.sources(workspace_id,id,kind) VALUES($1,'stub-price','price')",[workspace]);
 await admin.query("INSERT INTO fw_async.quota_configs(namespace,hard_limit) VALUES('shared-license',20),('tenant-budget',20)");
 await admin.query("INSERT INTO fw_async.entitlements(workspace_id,id,source_id,rights_confirmed,expires_at,quota_scopes) VALUES($1,$2,'stub-price',true,clock_timestamp()+interval '30 days',ARRAY['shared-license','tenant-budget'])",[workspace,entitlement]);
 const h1=token(),h2=token(),missing=token();await holding(h1,entitlement);await holding(h2,entitlement);await holding(missing,null);
 const asof=new Date(Date.now()-2*86400000).toISOString(),fixtures={[h1]:{value:'12345',currency:'VND',unit:'share',quoteAsOf:asof},[h2]:{value:'23456',currency:'VND',unit:'share',quoteAsOf:asof}};
 await admin.query('UPDATE fw_async.entitlements SET fixtures=$3 WHERE workspace_id=$1 AND id=$2',[workspace,entitlement,fixtures]);
 const first=await request([h1,h1]),coalesced=await request([h1]);assert.equal(coalesced.body.data.id,first.body.data.id);assert.equal(coalesced.body.data.coalesced,true);
 const empty=await call('requestPriceRefresh',{holdingIds:[]});assert.equal(empty.res.statusCode,422);
 assert.equal(await market.runOnce(),true);assert.equal(adapter.calls,1);
 const price=(await admin.query('SELECT payload FROM fw_finance.quotes WHERE workspace_id=$1 AND holding_id=$2',[workspace,h1])).rows[0].payload;assert.equal(new Date(price.quoteAsOf).toISOString(),asof);
 const exact=await app.inject({method:'POST',url:path('requestPriceRefresh'),headers:web,payload:{...first.req,requestId:token()}});assert.equal(exact.statusCode,200,exact.body);assert.equal(exact.json().data.id,first.body.data.id);
 assert.equal((await call('requestPriceRefresh',{holdingIds:[h1]})).res.statusCode,429);
 passed('stub adapter, exact frozen selection/coalescing, same-key replay before cooldown, nonempty selection, server cooldown');
 const parent=await request([h2,missing]);assert.equal(await market.runOnce(),true);assert.equal(await market.runOnce(),true);
 const parentResult=await call('getRefreshJob',{id:parent.body.data.id});assert.equal(parentResult.body.data.status,'partial');assert.equal(parentResult.body.data.results.length,2);
 passed('atomic parent/children fanout; complete selected-set coverage with updated/missing; no parent lease');
 // Refresh a previous quote after outage with the same explicit as-of. No daily fake history.
 await admin.query("UPDATE fw_async.refreshes SET created_at=clock_timestamp()-interval '2 minutes' WHERE workspace_id=$1",[workspace]);
 const again=await request([h1]);const countBefore=(await admin.query('SELECT count(*)::integer AS n FROM fw_finance.quotes WHERE workspace_id=$1',[workspace])).rows[0].n;await market.runOnce();
 assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_finance.quotes WHERE workspace_id=$1',[workspace])).rows[0].n,countBefore);
 assert.equal((await call('getRefreshJob',{id:again.body.data.id})).body.data.status,'succeeded');
 passed('same observation dedupe preserves quoteAsOf and does not manufacture history');
 const holdingState=await call('getHolding',{id:h1});assert.equal(holdingState.res.statusCode,200,JSON.stringify(holdingState.body));assert.equal(holdingState.body.data.valuation.quality.status,'stale');
 await admin.query("UPDATE fw_async.refreshes SET created_at=clock_timestamp()-interval '2 minutes' WHERE workspace_id=$1",[workspace]);
 const badRefresh=await request([h1]);
 const badMarket=new AsyncPipeline(mp,'market',{provider:'stub',async fetch(){return [{holdingId:h1,value:'-1',currency:'VND',unit:'share',quoteAsOf:new Date().toISOString()}];}});
 assert.equal(await badMarket.runOnce(),false);
 const badStatus=await call('getRefreshJob',{id:badRefresh.body.data.id});assert.equal(badStatus.body.data.status,'failed');assert.equal(badStatus.body.data.results[0].state,'retained');
 assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_finance.quotes WHERE workspace_id=$1',[workspace])).rows[0].n,countBefore);
 assert.equal((await call('getHolding',{id:h1})).body.data.valuation.quality.status,'stale');
 const sourceRead=await call('listSources',{page:{cursor:null,pageSize:100}});assert.equal(sourceRead.res.statusCode,200,JSON.stringify(sourceRead.body));assert.equal(sourceRead.body.data.items.find((x:any)=>x.id==='stub-price').freshness.status,'stale');
 passed('invalid provider quote is permanent failure; last-good quote/value retained and freshness stale');
 await admin.query("UPDATE fw_async.refreshes SET created_at=clock_timestamp()-interval '2 minutes' WHERE workspace_id=$1",[workspace]);
 const deniedRefresh=await request([h1]);const deniedTicket=await market.worker.claim();assert(deniedTicket);
 await admin.query("UPDATE fw_async.entitlements SET rights_confirmed=false WHERE workspace_id=$1 AND id=$2",[workspace,entitlement]);
 const deniedUsed=(await admin.query('SELECT sum(reserved)::integer AS n FROM fw_async.quota_buckets')).rows[0].n;
 assert.equal(await market.execute(deniedTicket),false);assert.equal((await call('getRefreshJob',{id:deniedRefresh.body.data.id})).body.data.status,'failed');
 assert.equal((await admin.query('SELECT sum(reserved)::integer AS n FROM fw_async.quota_buckets')).rows[0].n,deniedUsed);
 await admin.query("UPDATE fw_async.entitlements SET rights_confirmed=true WHERE workspace_id=$1 AND id=$2",[workspace,entitlement]);
 passed('unconfirmed/revoked entitlement denies stub request and quota reservation');

 // Process crash after reservation: child exits without calling adapter, charged intent persists.
 await admin.query("UPDATE fw_async.refreshes SET created_at=clock_timestamp()-interval '2 minutes' WHERE workspace_id=$1",[workspace]);await request([h1]);
 const crashTicket=await market.worker.claim();assert(crashTicket);
 const crashCode="import {Pool} from 'pg';let s='';for await(const c of process.stdin)s+=c;const x=JSON.parse(s),p=new Pool({connectionString:x.url});await p.query('SELECT fw_async.reserve_request($1,$2,$3,$4)',x.args);process.exit(19);";
 const exit=await new Promise<number|null>((resolve,reject)=>{const child=spawn(process.execPath,['--input-type=module','-e',crashCode],{windowsHide:true,stdio:['pipe','ignore','pipe']});let err='';child.stderr.on('data',b=>{err+=b;});child.on('error',reject);child.on('exit',code=>err?reject(Error(err)):resolve(code));child.stdin.end(JSON.stringify({url:configs.market.databaseUrl,args:[crashTicket.id,crashTicket.generation,crashTicket.lease_token,0]}));});assert.equal(exit,19);
 const used=(await admin.query("SELECT reserved FROM fw_async.quota_buckets WHERE namespace='shared-license'")).rows[0].reserved;
 assert.equal((await mp.query('SELECT fw_async.reserve_request($1,$2,$3,$4) AS result',[crashTicket.id,crashTicket.generation,crashTicket.lease_token,0])).rows[0].result.reason,'SENT_UNKNOWN');
 await admin.query("UPDATE fw_dispatch.jobs SET lease_until=clock_timestamp()-interval '1 second' WHERE id=$1",[crashTicket.id]);await market.worker.claim();await dueAll();const newTicket=await market.worker.claim();assert(newTicket);await market.execute(newTicket);
 assert.equal((await admin.query("SELECT reserved FROM fw_async.quota_buckets WHERE namespace='shared-license'")).rows[0].reserved,used+1);assert.equal(await market.execute(crashTicket),false);
 passed('actual worker process crash after charged intent; unknown request cannot repeat; retry reserves anew; stale worker loses fence');
 // Shared quota races across two jobs use the same stable quota namespace.
 await admin.query("UPDATE fw_async.refreshes SET created_at=clock_timestamp()-interval '2 minutes' WHERE workspace_id=$1",[workspace]);
 await request([h1]);
 const secondWorkspace=token(),secondHolding=token();
 await admin.query("INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES($1,$2,'2026-01-01')",[secondWorkspace,subject]);
 await admin.query("INSERT INTO fw_async.sources(workspace_id,id,kind) VALUES($1,'stub-price','price')",[secondWorkspace]);
 await admin.query("INSERT INTO fw_async.quota_configs(namespace,hard_limit) VALUES('tenant-budget-two',20)");
 await admin.query("INSERT INTO fw_async.entitlements(workspace_id,id,source_id,rights_confirmed,expires_at,quota_scopes) VALUES($1,$2,'stub-price',true,clock_timestamp()+interval '30 days',ARRAY['shared-license','tenant-budget-two'])",[secondWorkspace,entitlement]);
 const holdingPayload=(await admin.query('SELECT payload FROM fw_finance.holdings WHERE workspace_id=$1 AND id=$2',[workspace,h1])).rows[0].payload;
 await admin.query('INSERT INTO fw_finance.holdings(workspace_id,id,payload) VALUES($1,$2,$3)',[secondWorkspace,secondHolding,holdingPayload]);
 const secondMovement=token();await admin.query('INSERT INTO fw_finance.holding_movements(workspace_id,id,holding_id,mode,quantity,business_date,payload) VALUES($1,$2,$3,$4,$5,$6,$7)',[secondWorkspace,secondMovement,secondHolding,'set','1',holdingPayload.quantityDate,{id:secondMovement,holdingId:secondHolding,version:0,quantity:{value:'1',unit:'share'},delta:null,date:holdingPayload.quantityDate,kind:'declaration',eventId:null,reason:'Explicit synthetic quantity fixture',evidenceIds:[]}]);
 await admin.query('INSERT INTO fw_async.holding_sources VALUES($1,$2,$3)',[secondWorkspace,secondHolding,entitlement]);
 await unitOfWork(up,async tx=>{await tx.context(subject,secondWorkspace);await tx.query("SELECT fw_async.admit_refresh($1,$2,$3,'manual')",[secondWorkspace,[secondHolding],token()]);});
 const t1=await market.worker.claim(),t2=await market.worker.claim();assert(t1&&t2);assert.notEqual(t1.workspace_id,t2.workspace_id);
 await admin.query("UPDATE fw_async.quota_buckets SET hard_limit=reserved+1 WHERE namespace='shared-license'");const limit=(await admin.query("SELECT hard_limit FROM fw_async.quota_buckets WHERE namespace='shared-license'")).rows[0].hard_limit;await admin.query("UPDATE fw_async.quota_configs SET hard_limit=$1 WHERE namespace='shared-license'",[limit]);
 const reserve=(t:any)=>mp.query('SELECT fw_async.reserve_request($1,$2,$3,$4) AS result',[t.id,t.generation,t.lease_token,0]);
 const reservations=await Promise.all([reserve(t1),reserve(t2)]);assert.equal(reservations.filter(x=>x.rows[0].result.allowed).length,1);
 assert.equal((await admin.query("SELECT reserved<=hard_limit AS valid FROM fw_async.quota_buckets WHERE namespace='shared-license'")).rows[0].valid,true);
 passed('concurrent workspaces reserve shared license and separate tenant quota atomically; hard limit cannot be exceeded');
 const floor=retryAfter('3600',7200,Date.now());assert(floor.mismatch);assert(new Date(floor.at).getTime()>Date.now()+7199000);
 await mp.query('SELECT fw_async.cooldown($1,$2,$3,$4,$5)',[t1.id,t1.generation,t1.lease_token,0,floor.at]);
 assert((await admin.query("SELECT cooldown_until>clock_timestamp()+interval '1 hour' AS held FROM fw_async.quota_buckets WHERE namespace='shared-license'")).rows[0].held);
 // Restart the JS worker object has no impact on the persisted provider floor.
 const otherMarket=new AsyncPipeline(mp,'market');assert.equal(otherMarket.adapter.provider,'stub');
 passed('Retry-After seconds/body maximum persisted; new runtime cannot clear provider cooldown');
 await admin.query("UPDATE fw_dispatch.jobs SET state='failed',lease_token=NULL,lease_until=NULL WHERE workspace_id=$1 AND state='running'",[workspace]);
 await admin.query("INSERT INTO fw_async.schedules VALUES($1,date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'+interval '18 hours'-interval '7 days',NULL)",[workspace]);
 const dailyBefore=(await admin.query('SELECT count(*)::integer AS n FROM fw_async.schedule_history')).rows[0].n;assert.equal(await market.tick(),1);assert.equal(await market.tick(),0);
 assert.equal((await admin.query('SELECT count(*)::integer AS n FROM fw_async.schedule_history')).rows[0].n,dailyBefore+1);
 const hist=(await admin.query('SELECT * FROM fw_async.schedule_history WHERE workspace_id=$1',[workspace])).rows[0];assert(hist.missed>=6);assert.equal(hist.disposition,'latest_only');
 passed('host scheduler with clients absent: latest catch-up only; atomic watermark and missed intervals; second tick no extra fetch');
 await assert.rejects(ip.query('SELECT * FROM fw_async.receipts'),{code:'42501'});await assert.rejects(mp.query("SELECT fw_async.process_receipt('x',1,'x',0)"),{code:'42501'});await assert.rejects(up.query('SELECT * FROM fw_async.quota_buckets'),{code:'42501'});
 const metrics=(await op.query('SELECT fw_async.metrics() AS value')).rows[0].value;assert(!JSON.stringify(metrics).includes(workspace));assert(metrics.receipts>=4);
 passed('private evidence/quotas inaccessible to worker and owner pools; Ops metrics carry counts without identifiers');
 const budget=(await admin.query('SELECT sum(reserved)::integer AS n FROM fw_async.quota_buckets')).rows[0].n;
 await fenceRestore(admin);assert.equal((await admin.query('SELECT sum(reserved)::integer AS n FROM fw_async.quota_buckets')).rows[0].n,budget);
 assert((await admin.query('SELECT blocked_until>clock_timestamp() AS closed FROM fw_async.market_gate')).rows[0].closed);
 assert.equal(await market.tick(),0);assert.equal(await market.execute(t1),false);
 passed('restore fences credentials/jobs/rights and market egress until explicit trusted reconciliation; durable counters never reset');
 // Restore fault injection: older backup loses some current-window reservations.
 await admin.query("UPDATE fw_async.quota_buckets SET reserved=greatest(0,reserved-1)");
 await admin.query("UPDATE fw_control.state SET locked=false");await admin.query("UPDATE fw_auth.identities SET state='active' WHERE id=$1",[subject]);await admin.query("UPDATE fw_finance.workspaces SET blocked=false WHERE id=$1",[workspace]);
 await admin.query("UPDATE fw_async.refreshes SET created_at=clock_timestamp()-interval '2 minutes' WHERE workspace_id=$1",[workspace]);
 await unitOfWork(up,async tx=>{await tx.context(subject,workspace);await tx.query("SELECT fw_async.admit_refresh($1,$2,$3,'manual')",[workspace,[h1],token()]);});
 // Reaper first closes obsolete queued tickets; fresh job has the new recovery epoch.
 let restoredTicket=await market.worker.claim();for(let n=0;n<5&&(!restoredTicket||restoredTicket.recovery_epoch!==1);n++)restoredTicket=await market.worker.claim();assert(restoredTicket&&restoredTicket.recovery_epoch===1);
 const restoredUsed=(await admin.query('SELECT sum(reserved)::integer AS n FROM fw_async.quota_buckets')).rows[0].n;
 const restoredReservation=(await mp.query('SELECT fw_async.reserve_request($1,$2,$3,$4) AS result',[restoredTicket.id,restoredTicket.generation,restoredTicket.lease_token,1])).rows[0].result;
 assert.equal(restoredReservation.allowed,false);assert.equal(restoredReservation.reason,'AUTHORITY_REVOKED');
 // Synthetic trusted entitlement revalidation does not make restored quota trusted.
 await admin.query('UPDATE fw_async.entitlements SET rights_confirmed=true WHERE workspace_id=$1',[workspace]);
 const rightsRevalidated=(await mp.query('SELECT fw_async.reserve_request($1,$2,$3,$4) AS result',[restoredTicket.id,restoredTicket.generation,restoredTicket.lease_token,1])).rows[0].result;
 assert.equal(rightsRevalidated.allowed,false);assert.equal(rightsRevalidated.reason,'RATE_LIMITED');
 assert.equal((await admin.query('SELECT sum(reserved)::integer AS n FROM fw_async.quota_buckets')).rows[0].n,restoredUsed);
 assert.equal((await admin.query('SELECT blocked_until::text AS until FROM fw_async.market_gate')).rows[0].until,'infinity');
 passed('older-backup counter fault injection denies revoked rights and then unknown quota even after rights revalidation; explicit trusted quota reconciliation still required');

 return {groups,checks:groups.length,metrics,realObservation:{sampledAt:new Date().toISOString(),elapsedDays:0,sevenDayObservation:false}};
 } finally {await app.close();await Promise.all([up.end(),ip.end(),mp.end(),op.end()]);}
}
