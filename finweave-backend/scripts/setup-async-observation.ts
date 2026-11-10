import { startCluster } from './runtime-cluster.ts';
import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateKeyPairSync,randomBytes,sign } from 'node:crypto';
import { token,sha,jcs,digest } from '../src/runtime/crypto.ts';
import { accountMask,itemDigest } from '../src/runtime/sources.ts';
import { buildApp } from '../src/runtime/app.ts';
import { revision } from '../src/runtime/contracts.ts';
import { NativeOutboxSimulator } from '../src/runtime/native-simulator.ts';
import { Pool } from 'pg';
import { unitOfWork } from '../src/runtime/uow.ts';
const statePath=resolve('.local/async-observation-state.json');
try {await readFile(statePath);console.log('Observation state exists; preserve start/counters.');process.exit(0);}catch(e){if((e as any).code!=='ENOENT')throw e;}
const cluster=await startCluster('async-observation-'+Date.now());let successful=false;
try {
 const startedAt=new Date().toISOString();const cfg=cluster.configs.user;cfg.origin='http://127.0.0.1:4312';
 for(const [profile,c] of Object.entries(cluster.configs))await writeFile(resolve(cluster.dir,profile+'.json'),JSON.stringify({...c,pepper:c.pepper.toString('base64url'),replayKey:c.replayKey.toString('base64url'),...(c.factorKey?{factorKey:c.factorKey.toString('base64url')}:{})}),{flag:'wx'});
 const subject=token(),workspace=token(),account=token(),device=token(),binding=token(),credential=token(),keys=generateKeyPairSync('ec',{namedCurve:'prime256v1'}),publicKey=keys.publicKey.export({type:'spki',format:'der'}).toString('base64url');
 await cluster.admin.query("INSERT INTO fw_auth.identities(id,email,name,password,state) VALUES($1,'observation@synthetic.test','Synthetic observation','no-login','active')",[subject]);
 await cluster.admin.query("INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES($1,$2,'2026-01-01')",[workspace,subject]);
 await cluster.admin.query('INSERT INTO fw_finance.accounts(workspace_id,id,payload) VALUES($1,$2,$3)',[workspace,account,{name:'Observation fixture',kind:'cash',opening:{value:'0',currency:'VND'},openingDate:'2026-01-01',archived:false}]);
 await cluster.admin.query("INSERT INTO fw_finance.ledger_accounts VALUES($1,$2,$3,'asset')",[workspace,'asset:'+account,account]);
 await cluster.admin.query("INSERT INTO fw_auth.devices(id,subject_id,workspace_id,public_key,name,app_version,consent,auth_epoch,recovery_epoch,authorized_until) VALUES($1,$2,$3,$4,'Simulated collector','local','synthetic-consent-v1',0,0,clock_timestamp()+interval '30 days')",[device,subject,workspace,publicKey]);
 await cluster.admin.query("INSERT INTO fw_auth.collectors VALUES($1,$2,false,0,clock_timestamp()+interval '1 day')",[digest(cfg.pepper,'collector',credential),device]);
 await cluster.admin.query("INSERT INTO fw_async.sources(workspace_id,id,kind) VALUES($1,'synthetic-bank','bank'),($1,'stub-price','price')",[workspace]);
 await cluster.admin.query("INSERT INTO fw_async.bindings(workspace_id,id,device_id,account_id,source_id,parser,mask,namespace) VALUES($1,$2,$3,$4,'synthetic-bank','synthetic-v1',$5,'synthetic-economic-v1')",[workspace,binding,device,account,accountMask(account)]);
 const namespace='local_'+sha(workspace).slice(0,20);await cluster.admin.query('INSERT INTO fw_async.quota_configs(namespace,hard_limit) VALUES($1,100)',[namespace]);
 await cluster.admin.query("INSERT INTO fw_async.entitlements(workspace_id,id,source_id,rights_confirmed,expires_at,quota_scopes) VALUES($1,'stub-rights','stub-price',true,clock_timestamp()+interval '30 days',$2)",[workspace,[namespace]]);
 const fixtures:Record<string,any>={};
 for(const kind of ['stock','gold']) {
 const h=token(),payload={kind,name:'Synthetic '+kind,catalogId:kind==='stock'?'manual-stock':'manual-gold-9999',profileConfirmedVersion:1,market:kind==='stock'?'HOSE':'VN',product:kind==='gold'?'gold':null,purity:kind==='gold'?'9999':null,quantityDate:'2026-01-01',cost:null,costDate:null,costQuantity:null,archived:false};
 await cluster.admin.query('INSERT INTO fw_finance.holdings(workspace_id,id,payload) VALUES($1,$2,$3)',[workspace,h,payload]);
 await cluster.admin.query("INSERT INTO fw_finance.holding_movements(workspace_id,id,holding_id,mode,quantity,business_date,payload) VALUES($1,$2,$3,'set',1,'2026-01-01','{}')",[workspace,token(),h]);
 await cluster.admin.query("INSERT INTO fw_async.holding_sources VALUES($1,$2,'stub-rights')",[workspace,h]);
 fixtures[h]={value:kind==='stock'?'12345':'88888',currency:'VND',unit:kind==='stock'?'share':'chi',quoteAsOf:startedAt};
 }
 await cluster.admin.query("UPDATE fw_async.entitlements SET fixtures=$2 WHERE workspace_id=$1 AND id='stub-rights'",[workspace,fixtures]);
 await cluster.admin.query("INSERT INTO fw_async.schedules(workspace_id,next_due_at) VALUES($1,date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'+interval '18 hours')",[workspace]);
 const outboxKey=randomBytes(32),sim=new NativeOutboxSimulator(resolve(cluster.dir,'outbox.encrypted'),outboxKey,{workspaceId:workspace,deviceId:device,deviceEpoch:0});
 const item={eventKey:token(),revision:0,bindingId:binding,bindingVersion:0,sourceKey:'synthetic-bank',observedAt:startedAt,parserVersion:'synthetic-v1',normalizedEvidence:{amount:'100000',currency:'VND',direction:'income',sourceAccountRef:accountMask(account),transactionRef:'syn_observation',sourceOccurredAt:startedAt,ruleStatus:'complete'}};
 await sim.capture({...item,payloadDigest:itemDigest(item)});const req=await sim.batch(0);
 const pool=new Pool({connectionString:cfg.databaseUrl}),app=await buildApp(cfg,pool,{async send(){}});
 try {
 await unitOfWork(pool,async tx=>{await tx.context(subject,workspace);await tx.query("SELECT fw_async.admit_refresh($1,$2,$3,'manual')",[workspace,Object.keys(fixtures),token()]);});
 const claims={revision,purpose:'ingestNotifications',method:'POST',path:'/v2/operations/ingestNotifications',audience:cfg.origin,bodyDigest:sha(jcs(req)),credentialDigest:sha(credential),challengeId:null,challengeNonce:null,issuedAt:Math.floor(Date.now()/1000),nonce:token()};
 const proof=Buffer.from(jcs(claims)).toString('base64url')+'.'+sign('sha256',Buffer.from(jcs(claims)),{key:keys.privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
 const response=await app.inject({method:'POST',url:'/v2/operations/ingestNotifications',headers:{'x-fw-contract-revision':revision,authorization:'Bearer '+credential,'x-fw-collector-proof':proof},payload:req});
 if(response.statusCode!==202)throw Error('OBSERVATION_INTAKE_FAILED:'+response.body);await sim.acknowledge(req,response.json());
 } finally {await app.close();await pool.end();}
 await writeFile(resolve(cluster.dir,'native-fixture-private.json'),JSON.stringify({credential,outboxKey:outboxKey.toString('base64url'),privateKey:keys.privateKey.export({type:'pkcs8',format:'pem'}),workspace,device,binding}),{flag:'wx'});
 await mkdir(resolve('../docs/execution/evidence/backend-async-observation'),{recursive:true});
 await writeFile(statePath,JSON.stringify({dir:cluster.dir,cluster:cluster.cluster,adminUrl:cluster.adminUrl,startedAt,timezone:'Asia/Bangkok',scheduleTimezone:'Asia/Ho_Chi_Minh',fixture:'synthetic-only',services:{}},null,2),{flag:'wx',flush:true});
 successful=true;console.log('Observation initialized at '+startedAt+'; real elapsed time begins now; seven-day evidence pending.');
}finally {if(successful)await cluster.admin.end();else await cluster.stop();}
