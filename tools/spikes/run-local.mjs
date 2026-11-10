import assert from 'node:assert/strict';
import { generateKeyPairSync, randomBytes, sign, verify, createCipheriv, createDecipheriv, createPublicKey } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { createServer, request } from 'node:http';
import os from 'node:os';
import * as core from './local-core.mjs';
import { Witness, verifyHead } from './witness.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const run=resolve(root,'docs/execution/evidence/local-spikes',new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomBytes(3).toString('hex'));
mkdirSync(run,{recursive:true});
const results=[];
async function test(id, expected, f) { const start=performance.now(); try { const actual=await f(); results.push({id,status:'PASS_LOCAL_SYNTHETIC',expected,actual:actual??'Assertions matched',durationMs:performance.now()-start}); } catch(e) { results.push({id,status:'FAIL',expected,error:e.code??e.message.split('\n')[0],durationMs:performance.now()-start}); } }
const now=1802044800, nonce=()=>randomBytes(32).toString('base64url');
await test('AUTH-CSRF-01','same-origin valid mutation passes; origin/missing csrf/expiry/owner/epoch/mixed bearer denied',()=>{
  const s={origin:'http://127.0.0.1',owner:'synthetic-A',epoch:2,expires:now+100,csrf:nonce()};
  const r={origin:s.origin,owner:s.owner,epoch:2,now,mutation:true,csrfCookie:s.csrf,csrfHeader:s.csrf};
  assert(core.cookieGate(r,s));
  for(const patch of [{origin:'null'},{origin:'http://evil.invalid'},{csrfHeader:undefined},{csrfCookie:'wrong'},{now:s.expires},{owner:'synthetic-B'},{epoch:1},{bearer:'mixed'}]) assert(!core.cookieGate({...r,...patch},s));
  return {positive:1,negative:8,scope:'pure admission policy, no browser/TLS/session issuance'};
});
await test('AUTH-CSRF-HTTP','actual loopback POST reflects deny/allow policy and no-store',async()=>{
  const s={origin:'http://127.0.0.1',owner:'A',epoch:2,expires:now+100,csrf:nonce()};
  const server=createServer((req,res)=>{const ok=core.cookieGate({origin:req.headers.origin,csrfCookie:req.headers['x-test-csrf-cookie'],csrfHeader:req.headers['x-fw-csrf'],owner:'A',epoch:2,now,mutation:true},s); res.writeHead(ok?204:403,{'Cache-Control':'no-store'});res.end();});
  try { await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);}); const port=server.address().port;
    for(const [origin,expected] of [[s.origin,204],['http://evil.invalid',403]]) {const response=await new Promise((yes,no)=>{const req=request({host:'127.0.0.1',port,method:'POST',headers:{Origin:origin,'X-Test-CSRF-Cookie':s.csrf,'X-FW-CSRF':s.csrf}},res=>{res.resume();res.on('end',()=>yes(res));});req.on('error',no);req.setTimeout(3000,()=>req.destroy(Error('LOCAL_TIMEOUT')));req.end();});assert.equal(response.statusCode,expected);assert.equal(response.headers['cache-control'],'no-store');}
    return {positive:1,negative:1,scope:'Node HTTP synthetic headers; not browser cookie/CORS/HTTPS evidence'};
  } finally { if(server.listening) await new Promise(r=>server.close(r)); }
});
await test('NATIVE-ES256-01','SPKI import, DER/raw verify; all bindings/tamper/replay denied',()=>{
  const pair=generateKeyPairSync('ec',{namedCurve:'prime256v1'}); const spki=pair.publicKey.export({type:'spki',format:'der'});const pub=createPublicKey({key:spki,format:'der',type:'spki'});
  const expected={revision:'005',purpose:'renewCollectorCredential',method:'POST',path:'/v2/operations/renewCollectorCredential',audience:'https://synthetic.invalid',bodyDigest:core.digest({requestId:'one',input:{epoch:2}}),credentialDigest:core.digest('synthetic-bearer'),challengeId:null,challengeNonce:null,now};
  const {now:_,...bindings}=expected;const claims={...bindings,issuedAt:now,nonce:nonce()};const bytes=Buffer.from(core.canonical(claims));
  const raw=sign('sha256',bytes,{key:pair.privateKey,dsaEncoding:'ieee-p1363'}); const der=sign('sha256',bytes,pair.privateKey);
  assert.equal(raw.length,64);assert(verify('sha256',bytes,pub,der));assert(core.nativeGate(claims,raw,pub,expected,new Set()));
  let denied=0;
  for(const k of Object.keys(bindings)) {assert(!core.nativeGate({...claims,[k]:typeof claims[k]==='string'?'wrong': 'unexpected'},raw,pub,expected,new Set()));denied++;}
  for(const c of [{...claims,issuedAt:now-61},{...claims,extra:true},{...claims,nonce:'short'}]){assert(!core.nativeGate(c,raw,pub,expected,new Set()));denied++;}
  const used=new Set();assert(core.nativeGate(claims,raw,pub,expected,used));assert(!core.nativeGate(claims,raw,pub,expected,used));
  assert(!core.nativeGate(claims,raw,generateKeyPairSync('ec',{namedCurve:'prime256v1'}).publicKey,expected,new Set()));
  return {negative:denied+2,scope:'Node OpenSSL interoperability only; Android DER conversion/Keystore pending'};
});
await test('WORKER-01','cert and HMAC resolve same profile; capability/workspace/lease/fence/replay denied',()=>{
  const registry={price:{live:true,cert:'cert-price',key:randomBytes(32),operations:['executePriceRefresh'],workspace:'A',generation:2},agent:{live:true,cert:'cert-agent',key:randomBytes(32),operations:['executeAgentStep'],workspace:'A',generation:2}};
  const expected={now,operation:'executePriceRefresh',path:'/internal/v2/executePriceRefresh',bodyDigest:core.digest({synthetic:true}),revision:'005',leaseLive:true,workspace:'A',generation:2};
  const claims={revision:'005',principalId:'price',method:'POST',path:expected.path,bodyDigest:expected.bodyDigest,timestamp:now,nonce:nonce()};const sig=core.mac(registry.price.key,claims);
  assert(core.serviceGate(claims,sig,'cert-price',registry,expected,new Set()));
  for(const patch of [{operation:'executeAgentStep'},{workspace:'B'},{generation:1},{leaseLive:false},{now:now+61},{bodyDigest:'wrong'}]) assert(!core.serviceGate(claims,sig,'cert-price',registry,{...expected,...patch},new Set()));
  assert(!core.serviceGate(claims,sig,'cert-agent',registry,expected,new Set()));assert(!core.serviceGate(claims,core.mac(registry.agent.key,claims),'cert-price',registry,expected,new Set()));
  const used=new Set();assert(core.serviceGate(claims,sig,'cert-price',registry,expected,used));assert(!core.serviceGate(claims,sig,'cert-price',registry,expected,used));
  return {positive:1,negative:9,scope:'synthetic registry, no TLS handshake or production SQL roles'};
});
await test('NATIVE-QUEUE-01','restart/partial ACK/lost ACK retain IDs; no owner retag/expiry extension',()=>{
  const file=resolve(run,'outbox.synthetic.jsonl');writeFileSync(file,'');const q=new core.Outbox(file);
  q.enqueue({id:'one',owner:'A',epoch:2,capturedAt:now,digest:'synthetic-one'});q.enqueue({id:'two',owner:'A',epoch:2,capturedAt:now,digest:'synthetic-two'});
  q.ack('one','A',2);const restarted=new core.Outbox(file);assert.deepEqual(restarted.pending('A',2,now).map(x=>x.id),['two']);
  const receipts=new Set(['two']);const attempts=[];for(let i=0;i<2;i++){attempts.push(restarted.pending('A',2,now)[0].id);receipts.add('two');}assert.equal(receipts.size,1);assert.deepEqual(attempts,['two','two']);
  assert.deepEqual(restarted.pending('B',2,now),[]);assert.deepEqual(restarted.pending('A',3,now),[]);assert.deepEqual(restarted.pending('A',2,now+7*86400+1),[]);assert.throws(()=>restarted.ack('two','B',2),/OWNER_MISMATCH/);
  restarted.ack('two','A',2);restarted.ack('two','A',2);assert.equal(new core.Outbox(file).pending('A',2,now).length,0);
  return {scope:'fsync JSONL process restart model; not Room, reboot, screen-off, WorkManager or power-loss'};
});
await test('OUTBOX-PROCESS-CRASH-01','separate process exits after fsync; new process recovers same item without ACK',()=>{
  const file=resolve(run,'crash-outbox.synthetic.jsonl');writeFileSync(file,'');const script=resolve(root,'tools/spikes/crash-outbox.mjs');
  const crashed=spawnSync(process.execPath,[script,file,'crash-after-durable-append'],{encoding:'utf8'});assert.equal(crashed.status,86);
  const restarted=spawnSync(process.execPath,[script,file,'read-after-restart'],{encoding:'utf8'});assert.equal(restarted.status,0);assert.deepEqual(JSON.parse(restarted.stdout),['crash-item']);
  return {scope:'actual Node child process termination/restart after fsync; not power-loss/Android/Room'};
});
await test('NOTIFICATION-PARSER-01','permission/consent/allowlist/OTP discard; four synthetic types normalized; ambiguity Review',()=>{
  const c={consent:true,permission:true,package:'synthetic.bank',signer:'fixture-cert-v1',version:1,bindings:{A:'binding-A',B:'binding-B'}};
  for(const kind of ['IN','OUT','REFUND','TRANSFER']) assert.equal(core.parseNotification(`SYNTHETIC ${kind} 12345 VND ACC=A REF=R1`,c).kind,kind);
  for(const patch of [{consent:false},{permission:false},{package:'other'},{signer:'other'},{version:2}]) assert.equal(core.parseNotification('SYNTHETIC IN 12345 VND ACC=A REF=R1',{...c,...patch}).state,'DISCARD');
  assert.equal(core.parseNotification('OTP 123456 '+ 'SYNTHETIC IN 12345 VND ACC=A REF=R1',c).state,'DISCARD');
  assert.equal(core.parseNotification('SYNTHETIC IN 12345 VND ACC=A',c).state,'REVIEW');assert.equal(core.parseNotification('SYNTHETIC IN 12345 VND ACC=B REF=R1',{...c,bindings:{A:'binding-A'}}).state,'REVIEW');
  return {normalized:4,discard:6,review:2,scope:'invented template with authored synthetic dataset; not VCB/MoMo parser precision'};
});
await test('WITNESS-01','deny only, fsync before receipt, lost receipt retry, late epoch max floor, signed fresh head and corrupted chain deny',()=>{
  const producer=generateKeyPairSync('ed25519'),witness=generateKeyPairSync('ed25519');const file=resolve(run,'witness.synthetic.jsonl');writeFileSync(file,'');const w=new Witness(file,producer.publicKey,witness.privateKey);const token=nonce();
  const ev={profile:'FW-RECOVERY-EVENT-001',eventId:'e1',environmentId:'synthetic',scopeKind:'identity',targetToken:token,epoch:4,kind:'identity_revoke',createdAt:new Date(now*1000).toISOString(),producerKeyId:'producer-fixture'};
  const signing=e=>sign(null,Buffer.from(core.canonical(e)),producer.privateKey);
  assert.throws(()=>w.appendDeny(ev,signing(ev),'beforeAppend'));assert.equal(w.rows.length,0);
  assert.throws(()=>w.appendDeny(ev,signing(ev),'afterAppend'));assert.equal(w.rows.length,1);
  const restarted=new Witness(file,producer.publicKey,witness.privateKey);assert.equal(restarted.appendDeny(ev,signing(ev)).sequence,1);
  const lower={...ev,eventId:'e2',epoch:2};restarted.appendDeny(lower,signing(lower));assert.equal(restarted.floor(token),4);
  for(const bad of [{...ev,kind:'grant'},{...ev,environmentId:'other'},{...ev,eventId:'e1',epoch:5},{...ev,eventId:'e3'}]) assert.throws(()=>restarted.appendDeny(bad,signing(bad)));
  const n=nonce(),head=restarted.head(n,now);assert(verifyHead(head,witness.publicKey,n,now,2,head.recordHash));assert(!verifyHead(head,witness.publicKey,nonce(),now,2,head.recordHash));assert(!verifyHead(head,witness.publicKey,n,now+61,2,head.recordHash));assert(!verifyHead(head,witness.publicKey,n,now,1,head.recordHash));
  const corrupt=resolve(run,'witness.corrupted.synthetic.jsonl');writeFileSync(corrupt,readFileSync(file,'utf8').replace('"epoch":4','"epoch":9'));assert.throws(()=>new Witness(corrupt,producer.publicKey,witness.privateKey),/CHAIN_CORRUPT/);
  return {scope:'one synchronous writer on same host; receipt simplified; no independent receiver, concurrency, real capsule or backup'};
});
await test('KEY-RESTORE-01','AEAD wrong key/AAD/tamper rejected; every absent restore precondition LOCKED; old credentials stay invalid',()=>{
  const key=randomBytes(32),iv=randomBytes(12),aad=Buffer.from('synthetic:A:epoch2:purpose:fixture');const cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(aad);const ct=Buffer.concat([cipher.update('SYNTHETIC capsule placeholder'),cipher.final()]),tag=cipher.getAuthTag();
  const decrypt=(k,a,t)=>{const d=createDecipheriv('aes-256-gcm',k,iv);d.setAAD(a);d.setAuthTag(t);return Buffer.concat([d.update(ct),d.final()]);};assert.equal(decrypt(key,aad,tag).toString(),'SYNTHETIC capsule placeholder');assert.throws(()=>decrypt(randomBytes(32),aad,tag));assert.throws(()=>decrypt(key,Buffer.from('B'),tag));assert.throws(()=>decrypt(key,aad,Buffer.alloc(16)));
  const good={capsuleVerified:true,backupVerified:true,hostFenced:true,headVerified:true,chainComplete:true,deniesApplied:true,credentialsInvalidated:true,contactVerified:true};assert.equal(core.restoreGate({}),'LOCKED');assert.equal(core.restoreGate(good),'READY_FOR_SIGNOFF');for(const k of Object.keys(good))assert.equal(core.restoreGate({...good,[k]:false}),'LOCKED');
  const session={origin:'local',owner:'A',epoch:3,expires:now+100,csrf:'synthetic'};assert(!core.cookieGate({origin:'local',owner:'A',epoch:2,now,mutation:false},session));
  return {scope:'Node AEAD primitive + gate model; NOT age interoperability, Keystore, restic, credential DB restore or deletion scan'};
});
await test('SOURCES-UNITS-RIGHTS-01','exact gold scale applied once, 10chi/luong; missing rights BLOCKED_SOURCE',()=>{
  const p={currency:'VND',unit:'luong',side:'buy',scale:'1000',product:'ring',brand:'synthetic',purity:'9999',region:'fixture',version:1};
  const a=core.normalizeGold('12345',p),b=core.normalizeGold('1234.5',{...p,unit:'chi'});assert.equal(a.storedNumerator/a.storedDenominator,12345000n);assert.equal(a.perChiNumerator/a.perChiDenominator,1234500n);assert.equal(b.perChiNumerator/b.perChiDenominator,1234500n);
  for(const v of ['1,234','1.234,56','NaN','0','-1','１２３','1.123456789'])assert.throws(()=>core.normalizeGold(v,p));assert.throws(()=>core.normalizeGold('12345',{...p,unit:'oz'}));
  const provider={selected:true,evidenceRef:'authored-synthetic-fixture',validUntil:now+1,rights:{automation:true,cache:true,derivedValuation:true}};assert.equal(core.rightsGate(provider,now,['automation','cache','derivedValuation']),'AUTHORIZED_FIXTURE');assert.equal(core.rightsGate(provider,now,['backup']),'BLOCKED_SOURCE');assert.equal(core.rightsGate(provider,now+2,['cache']),'BLOCKED_SOURCE');assert.equal(core.rightsGate({...provider,selected:false},now,['cache']),'BLOCKED_SOURCE');
  return {scope:'independent integer constants from spec; no external quote/provider entitlement verification'};
});
await test('STOCK-PROFILE-01','synthetic stock profile retains last-known asOf; unknown/date-only/future/not-final/precision/basis denied',()=>{
  const p={scale:'1',currency:'VND',unit:'share',basis:'unadjusted_close',catalogueVersion:'fixture-v1',exchange:'FIXTURE',symbols:['FAKE'],version:1};
  const row={symbol:'FAKE',exchange:'FIXTURE',close:'12345.6789',asOf:new Date((now-3600)*1000).toISOString().replace('.000Z','Z'),final:true};const quote=core.normalizeStock(row,p,now);assert.equal(quote.price,'12345.6789');assert.equal(quote.quoteAsOf,row.asOf);assert.notEqual(quote.quoteAsOf,quote.fetchedAt);
  for(const patch of [{symbol:'UNKNOWN'},{exchange:'OTHER'},{close:'0'},{close:'1,234'},{close:'1.123456789'},{close:'1234567890123456789'},{asOf:'2026-10-09'},{asOf:new Date((now+100)*1000).toISOString().replace('.000Z','Z')},{final:false}])assert.throws(()=>core.normalizeStock({...row,...patch},p,now));
  for(const patch of [{scale:'1000'},{basis:'adjusted_close'},{unit:'lot'}])assert.throws(()=>core.normalizeStock(row,{...p,...patch},now));
  return {negative:12,scope:'invented stock fields/profile; not SSI field mapping, paging/quota, holiday calendar or API evidence'};
});
await test('OFFLINE-RETRY-01','429 floor and exponential cap; same deadline never renewed; exceeded horizon quarantine',()=>{
  const input={now,attempt:4,serverRetryAfter:now+600,deadline:now+7*86400};assert.equal(core.retryAt(input).next,now+600);assert.equal(core.retryAt({...input,attempt:100,serverRetryAfter:now}).next,now+3600);assert.equal(core.retryAt({...input,now:input.deadline-1,serverRetryAfter:input.deadline+1}).state,'QUARANTINE');assert.equal(core.retryAt({...input,attempt:5}).deadline,input.deadline);assert.throws(()=>core.retryAt({...input,serverRetryAfter:NaN}));
  return {scope:'virtual time local policy only; no seven-day scheduler/OEM/provider observation'};
});
await test('MODEL-SCHEMA-01','canonical Decision fixtures validated; forbidden write/SQL and excess args denied; Vietnamese JSON survives UTF8',()=>{
  const schema=JSON.parse(readFileSync(resolve(root,'docs/agent/decision-schemas.json'))),fixtures=JSON.parse(readFileSync(resolve(root,'docs/agent/schema-fixtures.json'))).cases.filter(x=>x.schema==='Decision');
  for(const f of fixtures)assert.equal(core.validate(f.value,schema.$defs.Decision,schema),f.expectedValid,f.id);
  for(const value of [{capability:'executeSQL',arguments:{sql:'DELETE'}},{capability:'confirmPlan',arguments:{}},{capability:'getFinancialSnapshot',arguments:{owner:'B'}},{capability:'askClarification',arguments:{missingFields:['deadline'],text:'raw'}}])assert(!core.validate(value,schema.$defs.Decision,schema));
  const vi='Tôi muốn lập kế hoạch mua nhà; còn thiếu thời hạn và quỹ dự phòng.';assert.equal(JSON.parse(Buffer.from(JSON.stringify({vi}),'utf8').toString()).vi,vi);
  const times=[];for(let i=0;i<1000;i++){const t=performance.now();assert(core.validate({capability:'askClarification',arguments:{missingFields:['deadline','reserve']}},schema.$defs.Decision,schema));times.push(performance.now()-t);}times.sort((a,b)=>a-b);
  return {fixtureCount:fixtures.length,validatorMs:{p50:times[500],p95:times[950]},scope:'limited fail-closed schema validator + Unicode roundtrip; no inference/semantic Vietnamese/quality/model latency'};
});
const commandInventory={};for(const name of ['adb','gradle','ollama','age','restic']){const r=spawnSync('where.exe',[name],{encoding:'utf8'});commandInventory[name]=r.status===0?r.stdout.trim().split(/\r?\n/):[];}
const hashPaths=['tools/spikes/local-core.mjs','tools/spikes/witness.mjs','tools/spikes/run-local.mjs','tools/spikes/crash-outbox.mjs','docs/testing/technical-spikes.md','docs/operations/implementation-and-spikes.md','docs/security/identity/identity-access-design.md','docs/security/t1/backup-restore-erasure.md','docs/agent/decision-schemas.json','docs/agent/model-manifest-template.json','docs/agent/schema-fixtures.json','docs/sources/provider-registry.json','docs/sources/market-normalization.md','docs/android/native-bridge-schemas.json','docs/agent/native-bridge-003.json'];
const preparedPaths=readdirSync(resolve(root,'tools/spikes'),{recursive:true}).filter(p=>/\.(mjs|md|json|kt|xml)$/.test(p)).map(p=>'tools/spikes/'+p.replaceAll('\\','/'));
const evidence={profile:'FW-LOCAL-SPIKES-001',timestamp:new Date().toISOString(),scope:'LOCAL_SYNTHETIC_ONLY',permission:'User authorized local/synthetic. No model download, vendor call or real notification.',environment:{node:process.version,openssl:process.versions.openssl,platform:process.platform,arch:process.arch,cpu:os.cpus()[0]?.model,totalMemoryBytes:os.totalmem(),rssBytes:process.memoryUsage().rss,commandInventory},revisions:{api:'005',db:'005',bridge:'003'},sourceHashes:Object.fromEntries([...new Set([...hashPaths,...preparedPaths])].sort().map(p=>[p,core.digest(readFileSync(resolve(root,p)).toString())])),results,blocked:[{id:'APK-DEVICE',inputs:'No adb/Gradle on PATH; SDK/JDK/Capacitor pins unresolved; no owner device/appId/signing custody',gate:'build/sign/verify then install/update and OS permission/Room/Keystore/kill/reboot tests'},{id:'AUTH-REAL',inputs:'HTTPS browser topology, full identity runtime/Argon2 package/ARM64 and actual service TLS/SQL integration missing',gate:'Browser cookies/CORS/preauth/expiry, atomic DB nonce/rotation and live worker deny tests'},{id:'RESTORE-REAL',inputs:'No age/restic on PATH or independent receiver/offline recipients/host fencing/deletion inventory',gate:'Fresh independent witness + actual authorized restore and old credential rejection; RPO/RTO/retention'},{id:'MODEL-REAL',inputs:'Unpinned disabled model manifest; no ollama on PATH or approved exact local artifacts',gate:'No download; exact runtime/model/tokenizer/template/license pins, Vietnamese inference, cold/warm resources and baseline/held-out evaluation'},{id:'SOURCE-REAL',inputs:'No owner selected bank/wallet device/sample authorization; provider rights/credentials/verified units/calendar absent',gate:'No fetch/scrape; entitlement per purpose and licensed profile/sample evidence'},{id:'OPS-LONG-RUN',inputs:'No 7day deployment/independent alert failure domain/full clients',gate:'OPS07 schedule observation, OPS08 backup actual packs, OPS09 alert delivery, OPS10 real integration/UAT'}]};
writeFileSync(resolve(run,'results.json'),JSON.stringify(evidence,null,2)+'\n');
console.log(JSON.stringify({evidence:relative(root,run),passed:results.filter(x=>x.status==='PASS_LOCAL_SYNTHETIC').length,failed:results.filter(x=>x.status==='FAIL'),blocked:evidence.blocked.map(x=>x.id)},null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
