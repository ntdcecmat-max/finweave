import { readFile,writeFile,readdir,mkdir,copyFile } from 'node:fs/promises';
import { resolve,relative,dirname } from 'node:path';
import { createHash } from 'node:crypto';
const root=process.cwd(),out=resolve('docs/execution/evidence/backend-operations-2026-10-12');
const sha=b=>createHash('sha256').update(b).digest('hex');
async function latest(prefix) {const paths=(await readdir(out)).filter(p=>p.startsWith(prefix)&&p.endsWith('.json')).sort();if(!paths.length)throw Error('EVIDENCE_MISSING');return resolve(out,paths.at(-1));}
const operationsPath=process.argv[2]?resolve(process.argv[2]):await latest('operations-'),ops=JSON.parse(await readFile(operationsPath,'utf8'));
if(ops.status!=='PASS'||ops.sourceStable!==true)throw Error('OPERATIONS_RUNTIME_EVIDENCE_REQUIRED');
for(const [path,hash] of Object.entries(ops.source))if(sha(await readFile(resolve('finweave-backend',path)))!==hash)throw Error('STALE_OPERATIONS_SOURCE:'+path);
const regressionPath=await latest('regressions-'),regressions=JSON.parse(await readFile(regressionPath,'utf8'));
if(regressions.checks.some(c=>c.status!=='PASS'))throw Error('REGRESSION_FAILURE_REMAINS');
const releasePath=process.argv[3]?resolve(process.argv[3]):null,release=releasePath?JSON.parse(await readFile(releasePath,'utf8')):null;
if(release&&(release.status!=='SYNTHETIC_VERIFIED_REAL_CLOSED'||release.checks.some(c=>c.status!=='PASS')))throw Error('ARTIFACT_EVIDENCE_REQUIRED');
const smokePath=await latest('release-smoke-'),smoke=JSON.parse(await readFile(smokePath,'utf8'));if(smoke.status!=='PASS'||smoke.checks.length!==9)throw Error('HOST_CLI_SMOKE_EVIDENCE_REQUIRED');
const baseline=JSON.parse(await readFile('docs/operations/requirement-traceability.json','utf8'));
const notes={
 'OPS-01':'Loader strict/profile/purpose/loopback/REAL deny; public client config/revision on real clients still gate.',
 'OPS-02':'Encrypted mount, actual UID/ACL/reboot and plaintext-fallback fault NOT RUN.',
 'OPS-03':'All seven disjoint non-root SQL profiles/readiness and cross-grants tested locally; real environment namespaces/keys/channels remain open.',
 'OPS-04':'Purpose keys and restored key inventory checked; rotation, age/offline custody and all-client leakage remain open.',
 'OPS-05':'Trusted local build only; untrusted runner isolation has not been proven. Untrusted build must stay disabled.',
 'OPS-06':'Artifact made before tests; extracted artifact tested then signed. Local dependency junction/ephemeral signer are not production supply-chain custody.',
 'OPS-07':'Missing/skipped/cancelled/stale/source/artifact receipts fail gate helper; CLI missing artifact denies; full21BE/41AC/UAT still closed.',
 'OPS-08':'Real local HTTP mutation/enqueue/claim maintenance denied; signout/privileged retention/witness/erase kept; proxy/native topology remains gate.',
 'OPS-09':'Actual stale ticket publication blocked; attempts/deadline preserved. J2 crash/sent_unknown/COMMIT regressions synthetic only.',
 'OPS-10':'Actual migration contention, terminated connection, checksum fault and host CLI checked; target migrator regressions executed.',
 'OPS-11':'Local001..011 and DB foundation/DB005 upgrade runtime executed; production backfill/roles topology remains gate.',
 'OPS-12':'DB005 nontransaction phase/catalog invalid-index recovery regression executed; target deployment still gated.',
 'OPS-13':'Exact compatibility helper and CLI fail-closed gates; no DB rewind/down migration. Actual old-code deployment rollback remains gate.',
 'OPS-14':'SELECT1 cannot bypass missing table, required grants, root/combined role or recovery lock; actual deployed readiness still needs smoke.',
 'OPS-15':'Synthetic scheduler catchup regression; 7-day actual observation NOT RUN, fake due timestamps do not count.',
 'OPS-16':'Provider stub rights/units/outage/quota regressions; real licensed endpoint/profile tests NOT RUN.',
 'OPS-17':'Bounded Assistant/Agent synthetic regressions; approved actual local model inference/long-run privacy NOT RUN.',
 'OPS-18':'No APK signer/install/update/owner-device UAT executed by this operations run.',
 'OPS-19':'Actual HTTP error/telemetry, process dependency crash, SQL exception/native PG log sentinels checked. Proxy/OS/core/PANIC/provider sinks NOT RUN.',
 'OPS-20':'Killed separate producer detected by separate signed receiver on same host; off-host host/network/power loss and external notification NOT RUN.',
 'OPS-21':'Signed heartbeat freshness/duplicate policy partly covered; TLS expiry/domain and clock rollback/skew failures NOT RUN.',
 'OPS-22':'400 requests concurrency10 including authenticated PostgreSQL reads, real bounded pool exhaustion and measured scratch reserve failure; production capacity/SLO NOT PROVEN.',
 'OPS-23':'Actual exported snapshot/custom dump/encrypted archive+keys/full fw-table and LO inventory, failed destination and scratch cleanup; off-host append-only durable receipt NOT PROVEN.',
 'OPS-24':'Measured DB snapshot-start age includes export/readback; one actual post-snapshot synthetic record absent after restore. Scheduled24h production RPO NOT PROVEN.',
 'OPS-25':'Wrong capsule key fails, one local media deleted and second restores current keyring; same-host fixtures do not prove source-host loss/age custody/rotation.',
 'OPS-26':'Fresh-nonce stale signature denial and erased target mapping checked; physical old-writer fence and independent latest witness remain gates.',
 'OPS-27':'Restored sessions/replay/collector/challenges/devices/admin/bindings revoked or blocked, old login CONNECT denied; actual fresh identity/reset/enrollment remains gate.',
 'OPS-28':'Actual ledger/events/history/Plan–Goals+LO roundtrip, jobs cancelled and market/model quota deny infinity; full finance service/real provider reconciliation NOT RUN.',
 'OPS-29':'Signed catalog tamper, measured scratch reserve, short-policy actual unlink/reopen and last-good conflict checked; real34d/restic packs24h observation=0.',
 'OPS-30':'Deny despite witness failure, immutable duplicate deadline/children, queried base-table/registered LO purge; deadline branch uses explicit fault metadata. All-copy physical completion remains PENDING.',
 'OPS-31':'Actual2-second wall-clock deletion of auth nonce/body/messages/tools during maintenance, markers retained. Production multi-day/license TTL and active-payload sanitation remain gates.',
 'OPS-32':'Full21BE/41AC/AI/3-client real UAT and incident close NOT RUN; local runtime never certifies full acceptance.'
};
const aux={
 'OPS-09':['auth-recovery','async-j2'], 'OPS-10':['db-foundation','db005-upgrade'], 'OPS-11':['db-foundation','db005-upgrade'], 'OPS-12':['db005-upgrade'],
 'OPS-15':['async-j2'], 'OPS-16':['async-j2'], 'OPS-17':['assistant','unit'], 'OPS-27':['auth-recovery'], 'OPS-28':['async-j2','assistant'], 'OPS-07':['unit'], 'OPS-13':['unit']
};
const cases=baseline.cases.map(c=>{
 const runtime=ops.checks.filter(g=>g.ops.includes(c.id)).map(g=>g.name),related=aux[c.id]??[];
 const artifact=release&&['OPS-06','OPS-07'].includes(c.id)?releasePath:null;
 return {id:c.id,title:c.title,runbook:c.runbook,gate:c.gate,status:runtime.length||related.length||artifact?'LOCAL_SYNTHETIC_PARTIAL_REAL_GATE_OPEN':'NOT_RUN_REAL_GATE_OPEN',runtimeChecks:runtime,regressionChecks:related,artifactEvidence:artifact,remainingScope:notes[c.id]};
});
if(cases.length!==32||new Set(cases.map(c=>c.id)).size!==32)throw Error('OPS_INVENTORY_MISMATCH');
const copy=resolve(out,'final-operations.json');await copyFile(operationsPath,copy);
const runtimeArtifacts={};
if(releasePath){const local=resolve(release.testedStage??resolve(dirname(releasePath),'tested'),'finweave-backend/.local'),clusters=(await readdir(local)).filter(p=>/^operations-\d+$/.test(p));if(clusters.length!==1)throw Error('ARTIFACT_DRILL_DIRECTORY_AMBIGUOUS');for(const [name,file] of [['telemetry','safe-telemetry.ndjson'],['nativePostgresLog','postgres.log'],['heartbeat','heartbeat-events.ndjson']]){const original=resolve(local,clusters[0],file),destination=resolve(out,'final-'+file),bytes=await readFile(original);await writeFile(destination,bytes);runtimeArtifacts[name]={path:relative(root,destination).replaceAll('\\','/'),sha256:sha(bytes),original};}}
const summary={id:'FW-OPS-RUNTIME-20261013',status:'LOCAL_SYNTHETIC_PARTIAL_REAL_CLOSED',requiredBacklog:baseline.requiredBacklog,parentAcceptance:baseline.parentAcceptance,
 offHostIndependence:false,observedProductionRetentionDays:0,productionRpoRtoMeasured:false,operationsEvidence:relative(root,copy).replaceAll('\\','/'),originalOperationsEvidence:operationsPath,regressionEvidence:regressionPath,releaseEvidence:releasePath,hostCliEvidence:smokePath,
 rpo:ops.rpo,rto:ops.rto,load:ops.load,runtimeArtifacts,cases};
await writeFile('docs/operations/runtime-acceptance.json',JSON.stringify(summary,null,2)+'\n');
const markdown=[
 '# BE-18/21 — Operations runtime, 13/10/2026',
 '',
 'Đã triển khai và diễn tập local synthetic. REAL vẫn bị chặn; không nhận DONE cho toàn bộ21BE/41AC hoặc OPS-01…32.',
 '',
 '- Host CLI: strict secrets/config, role/schema readiness, maintenance→drain/fence→migration, compatibility-only rollback checks, source/artifact evidence gates.',
 '- Telemetry: allowlist DTO, sanitized process crash, native PG ordinary SQL/parameter logging suppression; signed heartbeat producer/receiver riêng process.',
 '- Backup/restore: consistent exported PostgreSQL snapshot, custom dump, encrypted archive+runtime key inventory, signed catalog, wrong-key failure, reserve/prune controller; isolated restore LOCKED, witness/credential/job/quota fences.',
 '- Erasure/TTL: local deny, frozen children/original deadline, base-table and registered LO purge with independent residual/reopen queries; privileged TTL deletion survives maintenance. All-copy completion intentionally remains PENDING.',
 '',
 `Operations runtime: **${ops.checks.length} nhóm PASS**, source stable; regressions: **${regressions.checks.length}/${regressions.checks.length} PASS**.`,
 `Host CLI positive smoke: **${smoke.checks.length}/9 PASS** (status/backup/witness/maintenance/drain/fence/migrate/rollback-check/open), cluster riêng đã dừng; không deploy service thật.`,
 `RPO snapshot-start age synthetic **${(ops.rpo.milliseconds/1000).toFixed(3)}s**; **${ops.rpo.syntheticPostSnapshotRecordsLost??0}** record sau snapshot thực sự không có trong restore.`,
 `RTO partial drill **${(ops.rto.milliseconds/1000).toFixed(3)}s**: decrypt/import/inventory/fence/credentials+quota/fresh witness. Chưa gồm host/custody/off-host download/TLS/new proof/enrollment/finance reopening.`,
 `Load **${ops.load.requests} requests / concurrency ${ops.load.concurrency}**, gồm authenticated PG reads/invalid ingress/health; p95 **${ops.load.p95Ms.toFixed(1)}ms**, p99 **${ops.load.p99Ms.toFixed(1)}ms**. Không phải production capacity SLO.`,
 '',
 'Không dùng hashes/typecheck/gate unit tests thay runtime drills. TTL2s dùng wall clock thật nhưng không chứng minh production5min/24h/30/90/180d. Short prune policy/deadline metadata fault không chứng minh34d/24h/35d đã quan sát. Cùng host không chứng minh off-host independence.',
 '',
 'Artifact source gzip được tạo trước test và chính bytes đã giải nén được test/typecheck rồi ký bằng ephemeral synthetic signer. Dependency junction, signer và runner chưa có production custody/attestation. Không publish/deploy tự động.',
 'Source manifest giữ snapshot tại lúc build. Acceptance/report được cập nhật sau build là output evidence; runtime backend bytes vẫn phải khớp artifact khi mở service.',
 '',
 `[Runbooks chạy được](../operations/runtime-runbooks.md) · [32 OPS RTM](../operations/runtime-acceptance.json) · [real gates/implementation gaps](../operations/real-gates.md)`,
 '',
 `Raw operations: [JSON](${relative(resolve('docs/execution'),copy).replaceAll('\\','/')}); [regression receipt](${relative(resolve('docs/execution'),regressionPath).replaceAll('\\','/')}).`,
 releasePath?`Tested artifact receipt: [release.json](<${releasePath.replaceAll('\\','/')}>). Artifact digest: ${release.artifactDigest}.`:'Artifact build receipt chưa được cung cấp; không nhận artifact gate đã chạy.',
 `Host CLI receipt: [JSON](${relative(resolve('docs/execution'),smokePath).replaceAll('\\','/')}).`,
 '',
 'Evidence raw/.local đang gitignored theo repository policy. Summary và runbooks được lưu trong docs; muốn chia sẻ raw cần chọn bản đã review riêng.',
 '',
 'Lượt fail/invalid trước được giữ: sandbox loopback denial; thiếu client tools; teardown/pg connection-loss harness errors; view bị chọn nhầm khi purge; J2 oracle cũ còn kỳ vọng rights/quota tự mở; DB foundation source thay đổi trong lúc chạy; bundle thiếu catalogue/golden vectors/package ESM và Windows staging path quá sâu. Các lượt này không được dùng để promote. Current evidence phải khớp source, không lấy PASS cũ cho source mới.',
 '',
 '| OPS | Runtime scope |', '| --- | --- |', ...cases.map(c=>`| ${c.id} | ${c.remainingScope} |`), ''
 ].join('\n');
await writeFile('docs/execution/backend-operations-2026-10-13.md',markdown);
console.log(JSON.stringify({report:'docs/execution/backend-operations-2026-10-13.md',opsCases:cases.length,groups:ops.checks.length,regressions:regressions.checks.length,offHost:false,observedRetentionDays:0}));
