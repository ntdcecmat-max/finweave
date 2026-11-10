"""Author operations design only. No deploy, SQL execution, secret creation or network."""
from pathlib import Path
import csv, hashlib, json, re, os

R=Path(__file__).resolve().parents[2]
D=R/'docs/operations'
E=R/'docs/execution/evidence/arch-13-operations-2026-10-09'
OLD=R/'docs/execution/evidence/arch-12-agent-2026-10-09'
CURRENT=[
 'README.md','docs/architecture/README.md','docs/architecture/architecture-decision-agenda.md',
 'docs/architecture/deployment-topology.md','docs/architecture/environment-matrix.md',
 'docs/architecture/high-level-design.md','docs/architecture/low-level-design.md',
 'docs/architecture/module-high-level-design.md','docs/architecture/tech-stack.md',
 'docs/architecture/views/architecture-views.md','docs/contracts/README.md',
 'docs/governance/artifact-register.md','docs/handover/README.md',
 'docs/product/backend-backlog.md','docs/product/cost-model.md','docs/security/security-design.md',
 'docs/testing/integration-handover.md','docs/testing/technical-spikes.md',
 'docs/handover/operational-decisions.md']

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):
 p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def md(n,s):
 p=D/n;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s.strip()+'\n',encoding='utf-8')

def preserve():
 p=E/'preservation-before.json'
 if p.exists():protected=json.loads(p.read_text(encoding='utf-8'))['files']
 else:
  old=json.loads((OLD/'preservation-before.json').read_text(encoding='utf-8'))['files']
  manifest=json.loads((OLD/'artifact-manifest.json').read_text(encoding='utf-8'))
  assert all(sha(R/n)==h for n,h in old.items()),'prior protected drift'
  assert all(sha(R/n)==v['sha256'] for n,v in manifest['files'].items()),'prior ARCH12 drift'
  protected=dict(old)
  protected.update({n:v['sha256'] for n,v in manifest['files'].items() if n not in CURRENT})
  protected[(OLD/'artifact-manifest.json').relative_to(R).as_posix()]=sha(OLD/'artifact-manifest.json')
  put(p,{'date':'2026-10-09','scope':'Frontend/baselines/all prior sealed packages and evidence; only 19 current overview documents excluded','files':dict(sorted(protected.items()))})
 assert all((R/n).exists() and sha(R/n)==h for n,h in protected.items()),'Protected drift'
 put(E/'current-documents.json',{'files':CURRENT})
 return len(protected)

def policy():
 p={
  'id':'FW-OPS-POLICY-001','date':'2026-10-09','status':'DESIGN_SPECIFIED_RUNTIME_NOT_RUN',
  'apiRevision':'FW-API-T1-D1J2-005','databaseRevision':'FW-PHYS-T1-ASYNC-005','nativeBridgeRevision':'FW-NATIVE-BRIDGE-003',
  'deployment':{'baseline':'I0_LOCAL_FIRST_I1_CONDITIONAL','topology':'SINGLE_HOST_P2_NOT_HA','releaseMode':'MANUAL_MAINTENANCE_STOP_START','autoDeploy':False,'autoPaidFallback':False,'externalBudgetVnd':0,'realEnabled':False,'modelEnabled':False,'sourcesEnabled':False},
  'ci':{'authority':'LOCAL_SYNTHETIC_COMMANDS','hosted':'OPTIONAL_AFTER_ACCOUNT_QUOTA_REVIEW','untrustedRunsHaveSecrets':False,'runnerOnFinanceHost':False,'artifactFromTestedSourceOnly':True,'actionsPin':'FULL_COMMIT_SHA_IF_USED','containerPin':'DIGEST_PER_PLATFORM','runtimePins':'UNRESOLVED_IMPLEMENTATION_GATE'},
  'config':{'strict':True,'unknownFields':'REJECT','unknownEnvironment':'REJECT','missingSecret':'FAIL_STARTUP','missingEncryptedMount':'FAIL_STARTUP_NO_PLAINTEXT_FALLBACK','configSecrets':'FILE_REFERENCES_ONLY','publicFields':['apiBaseUrl','releaseId','apiRevision','nativeBridgeRevision','environmentLabel'],'environmentIsolation':'DB_ROLES_KEYS_ORIGINS_APK_CHANNEL_AND_NAMESPACES'},
  'release':{'state':['prepared','verified','maintenance','drained','migrated','smoke_passed','opened','halted'],
    'maintenanceBlocks':['new_financial_writes','new_jobs','native_upload','owner_and_ops_mutations'],
    'retains':['local_denial','recovery_witness_delivery','erase_deadlines','backup_and_independent_alerting'],
    'workerGraceSeconds':90,'workerGraceIs':'STARTING_BOUND_NOT_SLO','forceKillNeedsFence':True,
    'compatibility':['api_revision_hash','db_migration_checksums','job_policy_versions','payload_kinds','native_bridge','source_parser_versions','model_prompt_tool_schemas','auth_key_versions'],
    'rollback':'PRIOR_CODE_ONLY_IF_EXPLICITLY_COMPATIBLE_ELSE_FORWARD_FIX','automaticDatabaseRestore':False,'automaticDownMigration':False,'readinessChecksSchemaGrantsAndRecoveryGate':True},
  'migration':{'postgresMajor':16,'singleRunner':'PG_SESSION_ADVISORY_LOCK_DEDICATED_CONNECTION','history':'APPEND_ONLY_CHECKSUM_APPLIED_JOURNAL','transactionalDdl':'ONE_MIGRATION_TRANSACTION_WHERE_SUPPORTED','nontransactionalDdl':'EXPLICIT_PHASE_PROGRESS_AND_CATALOG_RECONCILIATION','lockTimeoutSecondsCandidate':5,'statementTimeoutSecondsCandidate':60,'timeoutNeedsPerMigrationReview':True,'expandBeforeContract':True,'backfillResumable':True,'syntheticSeedsInReal':False,'executableTargetSql':'NOT_WRITTEN_OR_RUN'},
  'backup':{'database':'CONSISTENT_LOGICAL_CUSTOM_EXPORT','tool':'restic','offHost':True,'appendOnlySource':True,'pruneCustody':'OUTSIDE_FINANCE_HOST','snapshotHardMaxAgeDays':34,'unreferencedPurgeHoursMax':24,'erasureDeadlineDays':35,'preferredDaily':7,'preferredWeekly':4,'rpoHoursTarget':24,'rtoHoursTarget':24,'snapshotTimeForRpo':'DB_SNAPSHOT_START_LOWER_BOUND_NOT_UPLOAD_END','preReleaseBackupRequired':True,'restoreDrillDaysCandidate':30,'latestWitnessRequired':True,'oldWriterFenceRequired':True,'measured':False,'destinationProvisioned':False,'pitrEnabled':False},
  'retention':{'opsLogsDays':30,'jobIncidentMetadataDays':90,'restrictedSecurityAuditDays':180,'privatePayloadDaysMax':90,'importStagingHours':24,'unconfirmedDraftDays':30,'authReplayMinutes':5,'denyMinDays':90,'denyBeyondMin':'ALL_AFFECTED_COPIES_EXPIRED_PLUS_7_DAYS','financialHistory':'OWNER_LIFECYCLE_UNTIL_AUTHORIZED_ERASURE','licenseMayShorten':True,'expiryIsDeletionProof':False},
  'telemetry':{'labelAllowlist':['environmentClass','releaseId','profile','operationClass','statusClass','safeCode','latencyBucket'],
    'forbidden':['body','headers','token','password','rawNotification','OTP','amount','balance','quantity','accountRef','email','prompt','SQLParameters','rawUrl','workspaceId','deviceId','payloadDigest','bankTickerHoldings'],
    'publicHealth':'BOOLEAN_ONLY_NO_TOPOLOGY','opsHealth':'AGGREGATE_ALLOWLIST_NOT_FINANCE','externalAlerts':'OPAQUE_OPERATIONAL_CODES_ONLY','clientReplayScreenshots':False},
  'alerts':{'allThresholds':'STARTING_CONFIG_NOT_MEASURED_SLO','independentHeartbeatSeconds':60,'missingHeartbeatSeconds':180,'backupWarningAgeHours':20,'backupCriticalAgeHours':24,'diskWarnPercent':75,'diskCriticalPercent':85,'diskStopHeavyPercent':90,'diskAbsoluteReserve':'MEASURED_REQUIRED_NOT_PERCENT_ONLY','queueAgeWarnSeconds':300,'clockSkewFailSeconds':60,'tlsWarningDays':14,'tlsCriticalDays':7,'erasureWarningDays':30,'erasureCriticalDays':35,'receiverProvisioned':False,'notificationDeliveryTested':False},
  'cost':{'defaultExternalCalls':'DENY_UNTIL_ENTITLEMENT_AND_QUOTA','unknownQuota':'DENY','chargedUnknownOutcome':True,'restoreQuota':'DENY_UNTIL_TRUSTED_RESET_OR_RECONCILIATION','storageOrVmExhausted':'BACKPRESSURE_STOP_HEAVY_REPORT_NOT_DELETE_LEDGER','provisioning':'NOT_AUTHORIZED_BY_THIS_DOCUMENT'},
  'runtime':'SQL_CI_SERVICES_RELEASE_RESTORE_ALERTS_ANDROID_PROVIDER_MODEL_UAT_NOT_RUN'}
 put(D/'operations-policy.json',p)
 sources=[
 ('PG-DUMP','https://www.postgresql.org/docs/16/app-pgdump.html','Consistent single-DB export; roles/other assets separate; version-aware tools and scope.'),
 ('PG-RESTORE','https://www.postgresql.org/docs/16/app-pgrestore.html','Archive execution is a trust boundary; data-only does not make hostile archive safe.'),
 ('PG-INDEX','https://www.postgresql.org/docs/16/sql-createindex.html','CONCURRENTLY cannot run inside a transaction block; failed builds can leave invalid indexes.'),
 ('SYSTEMD','https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml','Persistent applies to OnCalendar; a missed activation does not replay every logical business occurrence.'),
 ('COMPOSE-SECRETS','https://docs.docker.com/compose/how-tos/use-secrets/','Per-service mounted files; file bind mount does not supply encryption-at-rest or custody.'),
 ('COMPOSE-HEALTH','https://docs.docker.com/compose/how-tos/startup-order/','Health-based startup ordering does not prove application invariants or recovery readiness.'),
 ('DOCKER-SOCKET','https://docs.docker.com/engine/security/protect-access/','Daemon access is privileged; application, Ops UI and untrusted CI get no Docker socket.'),
 ('ACTIONS-SECURITY','https://docs.github.com/en/actions/reference/security/secure-use','Least privilege, untrusted event handling, reviewed actions pinned to full SHA.'),
 ('ACTIONS-BILLING','https://docs.github.com/en/billing/concepts/product-billing/github-actions','Private hosted minutes/storage quotas and paid overage; do not promise all CI free.'),
 ('RESTIC-RETENTION','https://restic.readthedocs.io/en/stable/060_forget.html','Forget versus prune, OR retention counts, append-only malicious labels, repack scratch space.')]
 put(D/'research-sources.json',{'date':'2026-10-09','basis':'Official documentation checked; project choices and thresholds are design decisions, not vendor guarantees','sources':[{'id':i,'url':u,'finding':f} for i,u,f in sources]})

def documents():
 md('README.md','''# ARCH-13 — Hồ sơ vận hành

FW-OPS-DESIGN-001 · 09/10/2026 · **DESIGN SPECIFIED / RUNTIME NOT RUN**.

Chọn vận hành local trước; I1 cloud chỉ sau khi đủ tài nguyên/quyền và chi phí đã kiểm. Giữ A+T1, S1+P2, D1+J2, đầy đủ 21 gói backend / 41 AC. Một máy chủ, phát hành có thời gian bảo trì; không thêm Kubernetes, microservices, queue, paid monitoring hoặc tự triển khai.

| Hồ sơ | Nội dung |
| --- | --- |
| [Lựa chọn](architecture-and-options.md) | CI local, release có bảo trì, giám sát nhẹ; alternatives và lý do |
| [Cấu hình và secrets](configuration-and-secrets.md) | Phân môi trường, kiểm startup, custody/quyền/network |
| [CI và release](ci-and-release.md) | Source đã kiểm, artifact pin/sign, các cổng nghiệm thu, APK |
| [Migration/rollback](migration-and-rollback.md) | Một runner, journal/checksum, backfill, tương thích workers/clients |
| [Quan sát và cảnh báo](observability-and-alerting.md) | Health/metrics/logs an toàn, độc lập host và ngưỡng ban đầu |
| [Sao lưu/khôi phục](backup-restore-and-retention.md) | RPO/RTO, witness, khóa và deadline xóa |
| [Runbooks](runbooks.md) | Thủ tục vận hành/sự cố, vai trò, bằng chứng, điều kiện mở lại |
| [Checklist phát hành](release-checklist.md) | Local, staging, real và điều kiện dừng |
| [Thử nghiệm tiếp theo](implementation-and-spikes.md) | Danh sách rủi ro chi tiết và thứ tự thực thi |
| [Truy vết/nghiệm thu](acceptance-plan.md) | OPS-01…OPS-32, không thay 41 AC |
| [Policy](operations-policy.json) / [schemas](operations-schemas.json) | Cấu hình/release/evidence/metadata định kiểu |
| [Bundle/hash](implementation-bundle.json) | API005 / DB005 / native003 và các policy kế thừa |

Đây là hồ sơ thiết kế, không CI đang chạy hoặc runbook đã diễn tập. API vẫn153 operations/634 schemas; DB vẫn87 bảng/1001 cột/162 FK. Không tạo operation/bảng mới. Runtime migration journal thuộc infrastructure schema riêng chỉ được triển khai cùng DDL đã review, không lén tính nó là một trong87 bảng domain.

Các gói ARCH06–12 và snapshot r1/r2 giữ nguyên. Tài liệu tổng quan có notice mới; hợp đồng/policy gốc đã pin không bị ghi đè. [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md) và [báo cáo](../architecture/ARCH-13-change-report.md).
''')
 md('architecture-and-options.md','''# Phương án và ranh giới vận hành

## Lựa chọn trong hướng đã duyệt

| Quyết định | Chọn | Alternatives / điều kiện xem lại |
| --- | --- | --- |
| CI | Chạy cùng tập lệnh local trên dữ liệu giả lập; hosted CI tùy chọn sau kiểm account/quota | GitHub Actions cần pin actions/quyền và tránh overage; không tự đăng ký. Không public repository để lấy free |
| Release | Build một lần, kiểm/ký, chuyển đúng artifact; stop/start trong maintenance | Blue/green hoặc rolling chỉ sau có hai writer fences, DB/job backward compatibility và capacity; hiện không hứa zero downtime |
| Supervisor | Linux systemd quản Compose/process profiles; Windows I0 chạy local harness tương đương | Không Kubernetes/Vault/Redis mới. Exact OS/runtime/image/tool versions cần pin trước build |
| Monitoring | Aggregate collector nội bộ + log rotation + heartbeat/alerts ngoài host | Prometheus/Grafana có thể thêm nếu đo cần; chưa cài, chưa chọn alert vendor |
| Backup | Kế thừa pg_dump custom + restic off-host append-only, custodian prune độc lập | WAL/PITR phù hợp khi cần RPO thấp hơn/DB lớn; cần thiết kế retention/keys/witness/chi phí và restore riêng |

CI và release có cùng trust boundary: mã PR/dependency/untrusted test có thể thực thi, không được chạy trên finance VM, giữ secret thật hoặc có Docker socket/production access. App-admin chỉ xem aggregate và yêu cầu các thao tác có hợp đồng; không là root, không deploy/migrate/prune/restore/erase qua dashboard. Người vận hành trusted infrastructure có trách nhiệm các runbook đặc quyền; AI chuẩn bị và thực hiện các bước local được giao, còn tài khoản, thiết bị, dữ liệu/quyền riêng và chi phí cần đầu vào thật.

P2 giữ tách user-api, ops-api, ingestion/import, Market, Assistant/Agent, Forecast và retention capabilities; scheduler chỉ enqueue, witness coordinator deny-only, backup reader trusted, migrator DDL riêng. Shared code/DB/J2 không biến chúng thành microservices. Không cho Ops API pool finance, không dùng container names/labels làm bằng chứng isolation.

Health/readiness, restore unlock, provider enable và release approval là các trạng thái khác nhau. Một API liveness xanh không chứng minh ledger/authorization/native/Agent đúng. Full product completion vẫn cần toàn bộ41AC, 21BE và mọi use case Agent; real gate chưa đạt chỉ chặn bật thật, không xóa tính năng/backlog.

Nghiên cứu: [GitHub security](https://docs.github.com/en/actions/reference/security/secure-use), [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Docker daemon](https://docs.docker.com/engine/security/protect-access/). Chọn local/maintenance/thresholds là quyết định dự án; không vendor SLA.
''')
 md('configuration-and-secrets.md','''# Cấu hình, secrets và khởi động

## 1. Ba môi trường, không đổi nhãn thay cách ly

LOCAL-SYNTHETIC: DB disposable/local volume, fixtures, mail sink, provider stub, model scripted/deterministic mặc định. STAGING-SYNTHETIC: HTTPS/origins/roles/keys/DB riêng, synthetic APK channel. REAL-T1: host/DB/keys độc lập synthetic; staging ở local hoặc host khác. Không clone finance thật vào test. Synthetic reset/seed/debug routes không đăng ký trong real.

Config loader strict typed, reject unknown/missing fields/environment và sai revisions. Public manifest chỉ apiBaseUrl/releaseId/apiRevision/nativeBridgeRevision/environmentLabel; frontend/APK không nhận DB/provider/signing/mail/model keys. REAL phải HTTPS thật, app/admin origins riêng, exact API005/DB005/native003/hash, role/profile allowlist và file secret refs đã kiểm. Placeholder/localhost/test appId/test certificate làm real startup fail. `realEnabled` không là quyền riêng lẻ vượt source/security/recovery gates.

`environmentId` random stable, namespace DB/jobs/quota/crypto/witness/backup/release theo môi trường. Không nhận environment từ request header để chọn credential. DNS/TLS/region/backup destination/alert destination/source entitlement chưa provision; cấu hình mẫu không là endpoint hoạt động. Pin nguồn config/hash; reload cần validate rồi atomic switch/generation, lỗi giữ config trước hoặc dừng component, không nửa cũ nửa mới.

## 2. Secrets và quyền

Kế thừa [key inventory](../security/t1/key-inventory.csv) và [custody](../security/t1/keys-and-secrets.md). I1 data/WAL/temp/export/secret source ở volume LUKS2 đã unlock; thiếu đúng mount identity thì dừng, không tạo plaintext directory fallback. Local synthetic không claim LUKS đã cấu hình. Operator unlock/recovery có thể làm tăng downtime; không hứa tự khởi động sau reboot.

Process nhận file read-only riêng purpose/UID/mode; kiểm quyền thật bằng cùng UID container, mount/source permissions. Compose file secrets là bind-mount, không tự mã hóa file nguồn; UID/GID/mode portability phải kiểm trên runtime đã pin. Không secret trong YAML/public env/VITE/image layers/args/shell history/error/compose-render output. Disable unencrypted swap/core dumps; tmpfs cần kiểm swap. DB/password file và certificate private refs riêng theo role; API/worker không nhận volume unlock, restic/prune, CA/APK signing keys.

Rotation giữ active-write / verify-or-decrypt-only / retired inventory. Drain/reload atomic đúng key version; không xóa key còn trong backup/capsule/refresh/factors. Service cert/HMAC theo ARCH06/07; APK signer giữ continuity theo ARCH10, không rotate như service key. Compromise restic master cần repository/key mới và clean backup, không chỉ đổi password wrapper. Secret scan chỉ hỗ trợ phát hiện, không chứng minh không có secrets.

## 3. Network và process startup

HTTPS reverse proxy tới đúng user/Ops origin; PG/model/internal API private. Root/DBA tin theo T1 nhưng app-admin không finance. Firewall deny egress mặc định theo profile; raw bank/OTP không ra model/mail/log. Docker socket không mount trong API/Ops/worker/CI untrusted. TLS verify/hostname và internal service identity không tắt vì local transport.

Thứ tự: validate mount/config/secrets→PG/schema+grants→recovery/maintenance gate→private APIs readiness→workers/policy registry→scheduler→public proxy. Readiness phải kiểm expected migration+checksum, roles, registry and recovery fence; không chỉ TCP/SELECT1. Dependency outage sau boot cần reconnect/backoff/circuit limits; [Compose health ordering](https://docs.docker.com/compose/how-tos/startup-order/) chỉ hỗ trợ startup, không là recovery protocol. App API không tự migrate. Missing model chỉ disable model feature minh bạch; không làm ledger phụ thuộc model.

[Compose secret files](https://docs.docker.com/compose/how-tos/use-secrets/). Cấu hình schema/example là DESIGN; loader, grants, mounts, firewall và TLS chưa chạy.
''')
 md('ci-and-release.md','''# CI, build và phát hành

## 1. Pipeline cùng source, tách bằng chứng

1. Chọn source immutable: commit sạch hoặc content-addressed archive của working tree đã review gồm untracked/lockfiles/config; HEAD một mình không đại diện source bẩn. Manifest liệt kê hashes và absent/deleted inputs, không tự phục hồi file người dùng xóa. Kế thừa r1/r2 theo link, không ghi lại snapshot.
2. Pin Node/package manager/PostgreSQL16/client tools, dependency lock, containers per-platform digest, Android SDK/Gradle/JDK/AGP/Capacitor compatible patch, signing channel. Không `latest`/tag mutable. Exact pins chưa có là BLOCKED build release, không bịa digest.
3. Isolated synthetic runner: artifact/schema/link validation, type/lint/build user+admin/backend, Engine oracle, SQL clean/upgrade/grants/concurrency/fault, strict API005 contract/consumer mapping, browser regression, privacy/egress and supply-chain checks. NOT RUN không đổi thành PASS vì job chưa viết. Existing67/131frontend là historical scoped evidence, không số test bắt buộc cố định.
4. Build một lần từ source này; hash user/admin assets/backend per-platform images/APK/migration files/policies; inventory third-party components/licenses và reproducibility differences. Đừng build lại lúc deploy rồi coi là artifact đã test. Signed release manifest bằng approved standard tool, release signing custody tách CI untrusted và APK signer; exact signing tool/key chưa chọn, không crypto tự viết.
5. Chạy integration/UAT trên đúng artifact và môi trường; sanitize logs, no raw finance/screenshots/secrets uploaded. Failure blocks promotion, giữ bằng chứng thất bại. Required check absent/cancelled/skipped không PASS; branch protection nếu dùng hosted cần kiểm khả dụng, local checklist vẫn bắt buộc.
6. Operator verified manifest/key-trust + capability compatibility + backup/witness preflight; maintenance release theo runbook. Không tự commit/push/deploy từ tài liệu này.

## 2. CI không có quyền finance

Local là baseline không phát sinh phí dịch vụ CI. Hosted optional: kiểm quota/minutes/artifact/cache retention/budget0 và dừng trước overage; không cam kết GitHub private/free vô hạn. Không dùng finance host làm self-hosted runner. Untrusted PR không secrets, write token, production network, Docker daemon hoặc privileged publish/signing; không dùng pull_request_target checkout untrusted code rồi chạy với secrets. Permissions tối thiểu, actions full commit SHA và review upstream; lockfile digest không chứng minh dependency an toàn.

## 3. Clients và APK

API005 exact + schemas checksum; strict consumer accepts đúng revision, không hybrid fallback production. Native bridge003 exact; older APK: report incompatible/update path bằng envelope đã thỏa thuận, không tự chuyển token/profile hoặc ACK dữ liệu chưa lưu. Server phải giữ compatibility handler có quyền đúng cho installed releases nếu đã có real users; hiện chưa có release thật nên baseline005/003. Sunset collector cần consent/status/queue safe export or quarantine, không bỏ offline receipts để lên version.

APK build/sign/verify/install/update/data continuity theo [ARCH10](../android/apk-release.md); signing key offline/custody, no debug, bundled assets, HTTPS verified. User tải HTTPS artifact với package/version/certificate/hash/release metadata, Android xác minh signer; không Android auto-installer vượt OS. Metadata/release artifact integrity không thay runtime security/UAT.

[GitHub secure use](https://docs.github.com/en/actions/reference/security/secure-use), [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Không tạo workflow đang hoạt động hoặc gọi hosted runner trong ARCH13.
''')
 md('migration-and-rollback.md','''# Migration, phát hành và rollback

## 1. Một migrator, checksum bất biến

001–003 hiện là executable synthetic DDL chưa chạy; target D1/J2→DB005 vẫn expand design. Khi implementation mới viết004+ theo approved plans, không giả hiện có87bảng thực thi. Infrastructure migration history schema riêng ghi ID/checksum/status/timestamps/release và phase progress không finance; schema/grants này phải có DDL đã review, được kê trong physical deployment inventory ngoài87 domaintables. Không sửa migration đã applied để sửa checksum.

Runner giữ session-level PostgreSQL advisory lock trên dedicated connection suốt release, reject runner khác; mất connection→dừng/quarantine, không tiếp tục phase từ memory. Journal+DDL atomic trong mỗi transaction nếu hỗ trợ; checksum mismatch/unknown prior schema→halt. Explicit lock_timeout5s/statement_timeout60s là starting candidate, per migration review, không vô hạn toàn bộ; backfill chunk/timeouts/resume checkpoints riêng. Không network/provider/model hoặc long batch trong financial transaction.

Expand nullable tables/columns/guards→bounded resumable backfill→verify constraints/indexes/projections/permissions/invariants→cutover. Domain effect idempotency, revoked epochs, recovery denies, quotas, job deadlines và frozen payload versions phải giữ. Unknown legacy ownership/rights/input→quarantine, không đoán. Contract/drop chỉ release sau khi toàn bộ readers/writers/jobs/installed APK compatible, retention/archive/backup reviewed. Không dual dispatch J2+legacy.

PostgreSQL `CREATE INDEX CONCURRENTLY` không trong transaction; thất bại có thể để invalid index. Journal phase intended→catalog observed→verified/applied, inspect validity/definition/duplicates, controlled repair before retry. Không `IF NOT EXISTS` coi tên trùng là cùng index. Role/grants/RLS/triggers cùng negative tests, direct SQL stale worker tests; không production seed.

## 2. Maintenance stop/start

Release coordinator đặc quyền giữ deploy lock và DB maintenance state; public ingress từ chối new owner/Ops mutations, native uploads và enqueue. Read chỉ nếu version/recovery/privacy safe; nếu chưa chứng minh thì maintenance503 cho toàn finance, UI không báo saved. Exceptions deny/revoke/erase phải dùng trusted narrow control path; active app mutation bị chặn không được nhận giả success. Tiếp tục witness delivery, denial/erase deadlines, backup và alerts trong maintenance.

Stop scheduler/claim mới→drain active workers với grace90s starting bound; heartbeat/cancel còn sống để kết thúc. Khi quá hạn: fence persisted execution/recovery generation và service authority, terminate process, xác minh old writer/DB connection đã hết; chưa chứng minh fence thì không migrate/open. J2 rows không reset attempts/deadlines/budgets, unknown external calls quota charged, financial unknown COMMIT lookup marker. Old network response không được publish sau fence. Backup consistent pre-release và witness pending đã reconcile trước irreversible DDL.

Migrate→start API private, validate schema/grants/registry/fences→new workers đúng job/payload policies→synthetic smoke/negative safe cases→restore scheduler→mở ingress. Smoke không tạo fakefinance vào real ledger; dùng tenant synthetic riêng chỉ khi environment có isolation reviewed, real smoke read-only+authorized explicit controlled test. Atomic release config/current pointer, no mixed API serializers/frontend target. Startup catches missed business occurrences qua J2, không replay mọi timer tick.

## 3. Rollback không rewind tài chính

Prior code chỉ rollback nếu release manifest cho phép đọc DB/schema/guards và mọi queued job/payload/auth/API/native revisions hiện có. Không rollback to legacy dispatch hoặc bỏ deny/quota. Nếu không compatible: maintenance + forward fix hoặc quarantine job profile có evidence, không xóa jobs/reset counters để xanh.

Không tự down-migrate, truncate/reset DB hoặc restore pre-deploy dump: dữ liệu đã ACK sau backup sẽ mất, thu hồi/xóa có thể hồi sinh. Restore là incident riêng: fence oldhost, locked restore, latest witness, reset credentials, reconcile quota/gaps theo ARCH07; owner-aware loss statement/RPO. Migration fail giữ serving closed, transactional phase rollback, nontransactional phase inspect catalog rồi repair đúng ID/checksum.

[PG16 index behavior](https://www.postgresql.org/docs/16/sql-createindex.html). Release coordinator/maintenance gate/journal/fences mới SPECIFIED, chưa triển khai.
''')
 md('observability-and-alerting.md','''# Health, logs, metrics và cảnh báo

## Ranh giới thông tin

Public health chỉ boolean/status không version/topology/DB errors. Internal authenticated readiness có release/schema/policy registry/recovery status cho trusted operator; Ops API chỉ approved aggregates, không finance/provider credentials/prompts. Không thêm public APIoperation trong ARCH13. Per-workspace coverage/quote staleness là owner UI, không metrics label/alert payload ra vendor. Restricted security audit có opaque actor theo ARCH07 và quyền riêng, không stream sang app-admin.

Log schema allowlist safe codes/requestId opaque/operationClass/profile/release/environmentClass/latency bucket. Proxy route template, không URL/query/pathIDs/header/cookie/body/referrer. No SQL params/error rows/model text/raw bank/OTP/amount/holding/quantity/email/accountRef/payload digest. Dependencies/DB stderr/crash cores/build scanners/backup tools đều thuộc kiểm tra, không chỉ logger chính. Disable session replay/screenshot analytics; debug chỉ synthetic sanitized. Logs30d, job/incidentmetadata90d, restricted audit180d theo policy; rotation byte cap perprofile cần đo, expiry phải actual purge.

| Tín hiệu | Hành động ban đầu | Điều kiện không được suy |
| --- | --- | --- |
| API error/rate/latency, pool wait/connections | Aggregate theo allowlisted operation class; alert sustained baseline deviation | SELECT1/HTTP200 không chứng minh authorization/domain |
| Heartbeat host mỗi60s; missing>180s | Alert receiver ở failure domain khác; xác minh mất host/network | App-host tự gửi không phát hiện chính nó mất nếu không có external timeout |
| Dispatch/J2 oldest due>300s, scheduler watermark, retry/deadletter | Điều tra profile/DB/quota/license; no mass reset | Queue length0 không chứng minh job được tạo đúng |
| Backup snapshot-start age≥20h warn, >24h critical | Independent destination receipt+snapshot lowerbound; backup/restore check | Upload end mới không làm snapshot cũ fresh |
| Disk75/85/90% + reserve bytes | Warn/critical/stop imports, forecast, inference và new heavy work; giữ denial/control | Không xóa ledger/backup last-good vô điều kiện; quota% đủ chưa chắc repack có scratch |
| Clock skew>60s | Hold auth-sensitive ops/witness/lease assumptions, fix trusted clock | Không tăng TTL/rewind clocks để PASS |
| TLS còn14/7days | Warn/critical renewal; verify correct origin/cert chain | Renewal success job không chứng minh public cert mới |
| Erasure day30 warn, day35 critical hoặc pack purge>24h | Privacy incident, keep denied, no deadline extension | Snapshot forgotten/TTL expired không là data physically removed |
| Witness lag, latest-head verification failure | Restore blocked; local denials stay | Healthy witness ping không là fresh nonce-bound signed head |
| Price/job/source license/quota, Agent budget/concurrency | Coarse safe status; owner sees quality separately | Disabled source/model không tính reliable daily/Agent fullfeature PASS |

Mọi ngưỡng là starting configuration, chưa SLO đã đo. RPO/RTO24h targets; không đặt uptime99.9 hoặc exact low latency khi singlehost/freequota chưa kiểm. Quote stale>24h theo sourcepolicy, chỉ bằng24h chưa stale; giữ quoteAsOf/fetchedAt riêng, không dùng HTTPhealth thay freshness.

Independent alert receiver chưa chọn/provision; chỉ nhận environmentClass/releaseId/profile/safeCode/severity/time và opaque incident ref, không owner IDs/values. Alert/recovery key trust độc lập host; integration test hostdown/destinationdown/duplicate/recoverynotification và quota0. Không gửi email/chat nào từ task thiết kế này. Nếu receiver hoặc contact chưa cấu hình thì real gate BLOCKED, local console chỉ demo.
''')
 md('backup-restore-and-retention.md','''# Sao lưu, khôi phục và retention

Kế thừa nguyên [security recovery protocol](../security/t1/backup-restore-erasure.md), [keys](../security/t1/keys-and-secrets.md), [retention](../security/t1/logging-and-retention.md). ARCH13 làm rõ điều kiện vận hành, không giảm deny witness hoặc thay crypto.

## 1. Chọn logical backup với giới hạn rõ

Daily PostgreSQL16 custom export nhất quán một DB + versioned schema/migration/grant/release manifests + payload/object inventory + refs keycapsule/witness checkpoint. Same-major pg_dump/restore pinned, fullprivilege trusted backup role đọc đủ tenants; không bật RLS lọc rồi coi complete. Backup source mount encrypted; restic repository mã hóa off-host qua TLS authenticated append-only. Custodian read/delete/prune ngoàifinancehost, age capsule/recipient privateoffline, APK/CAcompartment riêng.

Theo [pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html), export snapshot nhất quán không chứa toàn cluster roles/external objects. [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html) có thể thực thi mã từ archive; hash chỉ integrity với manifest tin cậy, không tự tin schema dump. Logicaldaily là lựa chọn small singlehost với RPO24h mục tiêu; benchmarkdump/restore size/WALgrowth/lock/egress. Nếu không đạt phải xem WAL/PITR design/retention/cost, không tự hạ requirements hay bật paidservice.

Backup success chỉ sau dump exit0+inventory+off-host durable receipt+hash integrity/catalog+capsule references và witness checkpoint xác minh. RPO tính từ lowerbound thời điểm snapshot bắt đầu ở DB, không thời điểm upload xong. Nightly every24h cộng export/upload delay có thể vượt24h tại worstcase; initial schedule mỗi12h để có headroom, giữ preferred7daily/4weekly trong hard34d (các bản intraday tính capacity riêng), đo và chỉ claim RPO nếu worstcaseage≤24h. Security daily là minimum, không bỏ daily. Exportlock và release/migration/pruner coordination tránh dumpDDLrace; failed/incomplete snapshot không thaylastgood.

Monthly≤30d candidate restore drill + trước major migration/key/role/toolchain change + sau incident; integritychecks repository mỗibackup cycle và periodicfullread budget, không coi `restic check` là SQLrestore. Backup capacity gồm fullinitial+incremental+scratchrepack+keys/catalog; chưa có destination/quota/bandwidth/realavailability.

## 2. Retention và xóa

Hard snapshot max34d và unreferencedpacks thực xóa≤24h; erasure originalrequest+35d không reset. Custodian enumerate tất cả snapshot/tags/hosts/paths/softdelete/versioned/offlinecopies bằng trusted inventory/receive time; future labels không đẩy lastgood. Restic `forget` khác `prune`; repack scratch hoặc locking có thể chặn backups. Chọn prune policy kiểm toànbộpack có deletedcontent, `--max-unused 0` candidate phải reviewbenchmark, không default5% hoặc maxrepackshortcuts để claim purge. Nếu encryptedpack vẫn còn dữ liệu owner dù metadatađãforget thì chưacompletion. [Restic retention/pruning](https://restic.readthedocs.io/en/stable/060_forget.html).

Runtimecleanup typed procedures tránh activepins/confirmedhistory/dedupetombstones/recoverytokens. License/source TTL có thể ngắn hơn90d; authreplay5min không genericpayload90d. Agent checkpoints/modelbudget durable cần livepin nhưng không kéo contentretention vô hạn; expiredcontent sanitizedtombstone+explicitpartial. Confirmedledger/Plan/history ownerlifecycle, eraseprofile privilege riêng, notordinaryretentiondelete. Userexports/offlinedevices outside servercontrol được label scope/unknown.

## 3. Restore locked, không mở nhầm dữ liệu/quyền

RTO đo từ incident/recovery declaration đến controlledservice restored with auth/reconciliation smoke, gồm operatorunlock/waitkeys/download/migrate/verification/witness/emailresetpath và fence. Owner phải reset/re-enroll riêng, thời gian người dùng không được che; chưa khôi phục fullowneraccess thì ghi partialservice/RTOscope, không completeproduct. RPO báo actualgap từ committedfacts đến restoresnapshot, không ACKnativebacklog tự claimzero loss.

Fence oldwriter trướcnewwriter. Isolatedlockedrestore providers/model/mail/uploadworkers/publicfinance disabled; approvedschema dựng từ pinnedmigrations, allowlisted data restore dưới restrictedprofile, không execute arbitrarydumpSQL/root. Loaddata withFK/triggers theo reviewedrestore plan; narrowtemporaryrestoreguard nếu cần phải audit và reenforce/validate trướcready, không disablealltriggers/RLS rồi quên.

Fetchfreshnonce latestsignedwitnesshead/contiguouschain, applyerased/denybeforeanyfinancialread, unknownmapping→quarantine. Invalidaterestoredcredentials/challenges/replay/bindings/oldpasswordlogin, rotateepochs/serverkeys và freshverifiedownerreset/adminreprovision. Restoredqueuedjobs không tự chạy; reconcileleases/effects/unknowncalls/market+modelquotas/sourceconsent/rights; unknownquota denyuntiltrustedreset. Restore không re-tagoldoutbox/newowner, missingreceipt→gap/investigate notautopost. Onlyexplicitgate afterinvariants/grants/deniedscan/capsuleandcatalogvalid.

Witness/backup/alert phải ngoàifailure domainfinancehost; cùngVM demosynthetic không đạtindependence. Những endpoints/custodyngườithật cònunresolved, REALblocked. Không chạy backup/restore hay tạo khóa trong ARCH13.
''')

def runbooks():
 rows=[
 ('RB-01','Khởi động/reboot','Operator; encrypted mount/config/keys và expectedrelease có thật','Giữ public closed; unlock đúng volume; PG/schema/grants/recoverygate; privateAPI→workers→scheduler→proxy','Mount/key/schema mismatch, oldwriter unknown hoặc recoverylocked: dừng; không plaintext fallback','Mount identity, versions, health/denied probes; không secret output'),
 ('RB-02','Release có bảo trì','Release operator; tested signedartifact, compatiblematrix, offhostbackup/witness','Deploylock; maintenance; stopenqueue/claims; drain/fence; migrate; private smoke; startworkers/timer; open','Migration/checksum/role/smoke fail: halted; priorcode chỉ nếu compatibility đã chứng minh','Release/source/image/migrationhashes, gate evidence, timewindow/fence'),
 ('RB-03','Migration lỗi/rollback','Migrator; unique lock, journal và catalog','Giữ maintenance; classify tx vs nontransactional; inspect actualcatalog; exactphase repair/forwardfix; replay idempotent','Không resetjournal, rename checksum, downmigration hay restoredump tự động','Phase/checksum/invalidindex/invariants, repairedrelease reference'),
 ('RB-04','Job kẹt/worker chết','Capability operator qua narrow scoped procedure','Kiểm lease/policy/deadline/quota/currentauth; fenceoldattempt; reaper/retry same job khi eligible; reconcile unknown effect','Không tạo job/key mới cho unknowncommit, khôngreset attempts/budget; permanenterror quarantine','Safe job/profile status và fault/replay marker; no financebody'),
 ('RB-05','Nguồn giá/notification lỗi','Source operator; approvedprofile/right/quota','Disableaffectedprofile; keep lastgood labeled stale; notifyownercoverage; investigate version/binding/unit/time; synthetic regression before re-enable','No alternate scraper/unauthorizedtemplate; no bankrawcapture; ambiguous→Review','Licensedprofile versions, coarse failure/coverage; ownerprivate evidence staysprivate'),
 ('RB-06','Model quá chậm/injection/quota','Assistant operator; artifact/schema/policy pins','Cancel/fence run; no latepublish; inspect safe decision/guard outcomes; deterministic/manual fallback cùng feature; repair+eval trước enable','No hosted silentfallback, toolpermissionincrease, reset8/60s/rootdailyquota hoặc actualwrite','Runstate refs restricted, sanitized faultmetrics/model version/evaluation'),
 ('RB-07','Disk/pool/VM/quota cạn','Infrastructure operator; resource metrics và reserved headroom','Stopnewheavy imports/forecast/inference, backpressure ingress; retain denial/witness/erasure; controlled expansion chỉ quyền/quota đã duyệt','No deleteledger/lastgoodbackup để tự cứu; noauto paidshape; ifwrites unsafe closefinance','Disk/bytes/pools/queueage/cost metadata, capacityplan'),
 ('RB-08','Backup/destination/prune lỗi','Backup writer + independent custodian','Keep lastgood catalog; check dump/snapshotstart/capsule/destinationreceipt/locks/scratch; retry idempotent; alert ngoàihost','Age>24h gate fail; snapshot>34d orpack>24h privacyincident; no timestampedit','Trusted catalog, errorsafe code, inventory, successfulrestoredrill reference'),
 ('RB-09','Mất host/database, restore','Trusted recoveryoperator; independent witness/keys/destination','Fenceoldhost; isolatedlockedrestore; schema/data validation; latestwitness/deny; invalidatecredentials; quotas/jobsreconcile; controlledsmoke→open','Missingfreshhead/key/deniedscan/oldfence: LOCKED; reportloss notzeroloss','Snapshotlowerbound, recoverytimeline, oldwriterproof, witnesshead, invariants/RPO/RTO'),
 ('RB-10','Secret compromise/host RCE','Trusted incidentoperator; independent control channel','Isolate host/egress; localdeny+anchoredrevoke; preserve sanitized evidence; rotate scopekeys; cleanbuild/host; lockedrestoreprotocol','No rootconsole throughOpsUI; compromisedrepo master→newrepo+backup, notpassword-only','Affectedpurpose/version/custody/revocationproof, nosensitive incidentdump'),
 ('RB-11','Erase/revoke/witness outage','Recovery/erase authorizedprofile; original request identity','Localdeny immediate; publish exactdeny event retry; keepdeadline/children frozen; purge active/inventoriedcopies; verified completion','No un-deny foravailability, no35dclockreset, no completion beforeactualpacksdeleted','Originaldeadline, anchoredreceipt, copy inventory/purgeverification, residualdevice scope'),
 ('RB-12','TLS/DNS/clock/alert failure','Infrastructure operator; verifieddomains/trust','Close unsafeauth paths, correct trustedtime/cert/origin; checkexternalreachability andalertdelivery; re-evaluateexpiredsessions/jobs','No disableTLSverify/CSRF, increaseTTL, trust stale witnesshead orhardcodeplaceholderdomain','Cert/time/origin checks and receiver timeout/recovery evidence'),
 ('RB-13','APK incompatibility/update/queuegap','Release+nativeowner support; current channel/signingcontinuity','VerifyAPK signer/hash/minimumsupport; explain update; keepqueueimmutable; serverrefusesunsupportedrevision beforeACK; re-enroll onlyownerflow','No retagoldowneritems, debugAPKreal, arbitraryremoteURL, forceinstall or guaranteed recoveryofKeystoreloss','Device/OS/appversions synthetic evidence, install/update andgapcase results'),
 ('RB-14','Kết thúc sự cố','Incidentoperator; fixedrootcause + allaffectedgates','Retestcorrectness/auth/restore/replay; reopengradually; write sanitizedpostmortem; updateregression andrunbook','Unknowncritical/cross-tenant/financialcorruption/eraserisk: remainhalted','Impactscope/time, whatlost/unknown, correctiveaction/evidence, no claimbeyondtested')]
 put(D/'runbooks.json',{'status':'PROCEDURES_SPECIFIED_NOT_REHEARSED','runbooks':[{'id':i,'name':n,'preconditions':p,'steps':s,'stopConditions':h,'evidence':e} for i,n,p,s,h,e in rows]})
 md('runbooks.md','''# Runbooks — chưa diễn tập

Mỗi thủ tục phải ghi môi trường/release, actorpurpose, preconditions, các bước, điều kiện dừng/mở lại, thời gian và bằng chứng sạch. Operator là trusted infrastructure capability; app-admin không được các quyền này. Một người có thể giữ nhiều vai trò trong dự án cá nhân nhưng credentials/process/custody vẫn tách; prune/witness ngoài financehost.

'''+ '\n\n'.join(f'## {i} — {n}\n\n**Điều kiện:** {p}.\n\n**Thực hiện:** {s}.\n\n**Dừng khi:** {h}.\n\n**Bằng chứng:** {e}.' for i,n,p,s,h,e in rows)+'''

Nội dung là procedures để implementation/diễn tập; không có lệnh shell với secret, destructive script hoặc backgroundservice đã tạo. Drill dùng synthetic/disposable verifiedtarget. Sự cố thật cần impact/authority rõ; không thử phá host/data/key thật để sinh evidence.
''')

def release_and_spikes():
 md('release-checklist.md','''# Checklist phát hành và cách đọc trạng thái

**NOT RUN / SPECIFIED không bằng PASS.** Schema valid/manifest hash chỉ kiểm artifact, không restore/security/runtime. Không chọn vài feature để nhận fullproductDONE.

| Gate | Điều kiện / bằng chứng | Hiện tại |
| --- | --- | --- |
| G-ARTIFACT | Immutable reviewed source+lock/tool/runtime/image hashes; trusted signature; API005/DB005/native003/policy compatibility; all41AC/21BE mapping | Design/static scope only; runtime artifact chưa build |
| G-DB | Executable migrations to DB005; clean/upgrade/backfill/grants/RLS/triggers/precision/invariants/concurrency/restore | NOT RUN |
| G-DOMAIN | Exact ledger/planning/forecast/oracle/replay/cancel/partial/quantity/history; no doubleeffect | NOT RUN |
| G-AUTH | Browser/native/Ops/workers scopes, CSRF/MFA/revoke/reset/mail, denial/cross-tenant | NOT RUN |
| G-J2 | Jobs/scheduler/worker crash/fence/due/quotas/ACK/sync, ≥7daydaily synthetic observation | NOT RUN |
| G-CONSUMERS | User/admin/Android canonical005/003 adapters; allstates/browser regressions, installedversion policy | NOT RUN; historical frontendmock acceptance riêng |
| G-NATIVE | Realdevice signedAPK install/update/permission/allowlist/offline/OEM/Keystore/revoke/gaps | NOT RUN |
| G-SOURCE | Selectedapp/device/profile/signer/independentparse samples/rights/time/unit/quotas and actual daily/manual prices | NOT RUN, candidates not activated |
| G-AGENT | Exactmodel/runtime/prompt/tools pins, actualVN quality andfairmanual/singletool/fixedworkflow benefit, authoritynegative/coldwarm budget | NOT RUN, model disabled |
| G-SEC-T1 | T1 grants/log/secret/egress/custody independentwitness/erase/recovery tests | NOT RUN |
| G-OPS | Deploy/drain/migration rollbackfailure/load/quota/independentalerts, backup/restore/capsule/erase actualpurge | NOT RUN |
| G-UAT | Full41AC across3clients incl Agent/realupdates/notifications underownerconsent, limitations/disclosure, no unresolvedcritical | NOT RUN |

LOCAL-SYNTHETIC implementation có thể bắt đầu với no-egress stub/sink/disposable DB mà không cần realprovider gates; kết quả chỉ nghiệm thu local scope đã chạy. STAGING-SYNTHETIC cần deployment/TLS/config/quotas/sourcefixtures + integration/opsdrills, không gọi là productionUAT. REAL-T1 phải đạt tất cả gates liên quan trước bật thật; fullproduct requires allfeatures, không bỏ G-AGENT/G-NATIVE vì cònmanualweb fallback.

Pre-release checklist: verify correcttarget/no concurrentwriter; safetycritical evidence with testedsource hash/freshness and no unresolvedregression; offhost consistentbackup andrestoreknownpath; pendingwitness/erasedeadlines; sufficientresource reserve; rollbackcompatibility andknownsupportmatrix; explicitmaintenance window/operatorkeys; safealertreceiver ready. Evidence stale after impactedconfig/code changes→retest affectedgates, không rerun unrelatedchecks vô hạn.

Release halted if financialcorruption/crosstenant/rawleak/authoritybypass/recoverystale/eraserisk/secretcompromise or requiredgateunknown. Critical0 observed in scope is required, not absolute futurebugfree guarantee. Record limitations/knownbugs and release notes honestly. No publicdeploy/account/cost authorized by this checklist.
''')
 md('implementation-and-spikes.md','''# Sau ARCH13: thử rủi ro, database và fullbackend

Các lớp ARCH01–13 đã có thiết kế; điều đó không làm SQL/APK/model/production sẵn sàng. Giữ toàn bộ21BE/41AC/AI-FR/NFR trong backlog. Thực hiện sớm bằng chứng rủi ro rồi xây fullbackend theo dependency, kiểm và sửa liên tục, không chờ xong toàncode.

| ID | Thử gì cụ thể | Điều kiện / đầu vào | Đạt khi / evidence |
| --- | --- | --- | --- |
| OPS-SP01 | Local isolated PG16 + executable004+ migration plan, grants/guard negative và precision mapping | Localruntime đã pin/disposabletarget; không data thật | Cleaninstall+001–003upgrade đúngDB005, journal/rollback/faultconcurrency; không chỉ tablecount |
| OPS-SP02 | Native signedAPK + syntheticnotification, Keystore/Room/reboot/screenoff/offline/revoke/lostACK | AndroidSDK/runtime và thiết bị thật owner cấp | Exact bridge003/API005, durableIDs, noOTP/raw, realdevice support/gapmatrix |
| OPS-SP03 | T1 auth/CSRF/nativeproof/serviceidentity, witness/capsule/backup/lockedrestore | Syntheticcredentials/endpoints; independence local chỉ demo | Directdenial/replay/fence+restoredoldcredentialdenied, freshhead verified |
| OPS-SP04 | Localmodel structureddecision + Vietnamese Plan/Goal/investigation + hardware/coldwarm | Pinnedmodel artifacts/download permission/runtime/resources before actualdownload | Realperformance/quality/safety+fairA/B/C/heldout; no public30caseblindclaim |
| OPS-SP05 | Stock/gold rights/units/finality andfirstbank/walletprofile | Ownerapp/device + permittedsamples/providerentitlement/credentials | Explicitrights andversionprofile, independentparse+unitoracle; no autonomousscraping |
| OPS-SP06 | Release/workerdrain/advisorylock/nontransactionindexfailure/backfill/oldAPKjobsrollback | Local synthetic deployedprocesses/DDL afterfoundations | Oldworker cannotwrite, attempts/budgets preserved; incompatibledowngrade denied |
| OPS-SP07 | Daily/manualscheduler withclientsoff/hostsleep/restart/429/quotarestore | J2workers+stub; actualdaily later licensedsource | ≥7day observedfacts withmissedcoverage, durablequota, no fakehistory |
| OPS-SP08 | Backup12hheadroom/dump/restore/capsule/prune34d+24h inventory | Independent syntheticdestination/receiver; sizedscratch | MeasuredRPO/RTO underworstcase, signedfreshwitness, deleteddata notrevived, actualpacks purged |
| OPS-SP09 | Independenthostdownalerts, disk/pool/clock/TLS/quota failure | Separatefailure domain+approvedcontact whenavailable | Alerts delivered safely/timeoutduplicates, backpressure preservesdenies/erasure; no paidfallback |
| OPS-SP10 | Crossclientfullintegration/Agent actualmodel/UAT andload | Backend+adapters+native+sources+model complete | Every41AC/21BE covered withrealtypedresults andcorrectscope; no missingfeature hidden |

Thứ tự: chuẩn bị executable DB/spike harness và source/runtime pins → OPS-SP01/03 cùng native synthetic preparation → backend foundation/auth/Engine/J2 → toàn bộ modules BE03…18 theo dependencies → adapters/native/Agent/source integration BE19/20 → ops/restore/load/UAT BE21. Có thể chuẩn bị source/model/device gates song song bằng công việc độc lập; không tạo subagent/tài khoản/dịch vụ từ tài liệu này.

Nguồn/device/model/download chưa có đầu vào không chặn localDB/fullbackendstubimplementation, nhưng không được nhận mockthànhreal. Nếu riskspike fail: sửa ADR/schema/contracts có revision và rerun affectedcases; giữ tất cảfeature. Không auto thaytrustT1/budget0/provider/quota/retention.

Mỗi evidence ghi hypothesistarget, exactsource/config/artifact revisions, dataset quyền, expected/actual, failureattempts, sanitizedlogs, PASS/FAIL/BLOCKED/NOTRUN. Bước tiếp theo cụ thể là **chuẩn bị và kiểm tra database local disposable**; chưa chạy PostgreSQL trong ARCH13.
''')

def sync():
 details={
 'README.md':'ARCH01–13 đã có thiết kế; chưa runtime acceptance. Tiếp theo local disposable PostgreSQL/executable migrations/risk spikes rồi fullbackend đủ21BE/41AC, không giảmfeatures.',
 'docs/architecture/README.md':'ARCH13 vận hành localfirst, maintenance release, immutableartifact, migrate/rollbackcompatibility, independentbackup/witness/alerts; noKubernetes/microservices/paidfallback.',
 'docs/architecture/architecture-decision-agenda.md':'ARCH13 ACCEPTED OPERATIONS DESIGN trong hướng đã duyệt. Các lớp01–13 design ready cho implementation/spikes, không runtime/productionready.',
 'docs/architecture/deployment-topology.md':'systemd/Compose P2 singlehost, maintenance stop/start, PG/model private; backup/witness/alert ngoàifailure domain; destinations/versions/quota chưaprovision. Dailyminimum backup refined12hcandidate headroom.',
 'docs/architecture/environment-matrix.md':'Local/staging synthetic vàREAL khácDB/roles/keys/origins/namespaces/channels; no realclone/testreset. Missingmount/secret/schema/recoverygate failstartup; noauto paid/hosted/source/model.',
 'docs/architecture/high-level-design.md':'CI ngoàifinancehost; releaseoperator/migrator/backup/witness/pruner táchcapability. Health/readiness/recovery/providerenable làdifferentgates; app-admin aggregate khôngroot.',
 'docs/architecture/low-level-design.md':'Deploylock+maintenance/drain/workerfence, dedicatedPGadvisorylock/migrationjournal/phasecatalog, payload/jobpolicy compatibility; noautomatedDBrewind or attempt/budget reset.',
 'docs/architecture/module-high-level-design.md':'Release/migration infrastructure inventory riêng87domain tables; Ops profile nofinance/DDL/deploy/restore/prune privileges. Recoverydeny/erase/control tiếp tục khi maintenance.',
 'docs/architecture/tech-stack.md':'Local CI tập lệnh synthetic, optionalhostedquota gate; systemd/Compose supervision, pg_dump/restic/age inherited. Runtime/image/actions/signingtool exactpins implementationgate; no dependencieschange.',
 'docs/architecture/views/architecture-views.md':'Build/test/sign sameartifact→maintenance→drain/fence→migrate→privatereadiness/smoke→workers/timer→open. Independentoffhost backup/witness/alert; noHA/zerodowntimeclaim.',
 'docs/contracts/README.md':'API005153operations634schemas/native003 unchanged; ops runbooks không tạopublicAPI mới. Release compatibility includes serializers/installedclient/payload/jobpolicy revisions; nohybridproductionfallback.',
 'docs/governance/artifact-register.md':'FW-OPS-DESIGN-001 / FW-OPS-POLICY-001 / schemas / OPS01…32 / runbooksRB01…14 / ADR020 / manifestARCH13. Priorpackages/baselines unchanged, current19overviews updated.',
 'docs/handover/README.md':'Thêmoperations package: CI/config/secrets/release/migration/rollback/health/backup/retention/incidents+32runtimecases NOTRUN. API005/DB005/native003 unchanged; implementation/localDB tiếp theo.',
 'docs/product/backend-backlog.md':'Giữ21BE/41AC vàfullAgent. BE21 operational gates/runbooks/CI/migration/drain/alerts/restore, BE18secrets/witness/privacy, BE17J2/quota/pins; notDONE trước runtimeevidence.',
 'docs/product/cost-model.md':'Externalbudget0 vànoautoupgrade. Local CI baseline; hostedActions onlyafterquota+storage review; independentbackup/alert availability andinference resources chưa đo/selected. FreeVM không totalfee0guarantee.',
 'docs/security/security-design.md':'T1custody/deny protocol unchanged. FilemountnotKMS, runneroutsidefinancehost, noDocker socket toAPI/Ops. Restorefreshwitness/oldwriterfence/credentialreset; prune34d+24h/erase35dactualpurge.',
 'docs/testing/integration-handover.md':'Pin same testedsource/artifacts/API005/DB005/native003, allrequiredgate status explicit. Operations32 notexecuted; schema/decisionmodels ≠ release/restore/auth/CI runtimePASS.',
 'docs/testing/technical-spikes.md':'OPS-SP01…10 detailed risks withdependencies/expectedevidence; localDBfirst plusnative/auth/model/sourcepreparation. PublicAgent30cases +freshheldout perARCH12, not30blindinstancesclaimed.',
 'docs/handover/operational-decisions.md':'Local-first CI, manualmaintenance release, lightweightaggregate monitoring, offhostrestic/witness/alerts inherited. Endpoint/account/contact/quota/exactpins unresolved→realBLOCKED; nofees/provisionauthorized.'}
 for n in CURRENT:
  p=R/n;s=p.read_text(encoding='utf-8')
  s=re.sub(r'^> \*\*ARCH-13 hiện hành[^\n]*\n\n','',s)
  s=re.sub(r'\n## ARCH-13 — Operations handover\n.*\Z','',s,flags=re.S)
  if n.endswith('architecture-decision-agenda.md'):
   s=s.replace('ARCH-13 REVIEW PENDING','ARCH-13 ACCEPTED OPERATIONS DESIGN')
   s=s.replace('| ARCH-13 Operations | CI/environments/secrets/signing/migration/rollback/metrics/backup/retention | Đo RPO/RTO/quota; log không finance/raw/prompt; incident handling | Runbooks/release checklist |','| ARCH-13 Operations — ACCEPTED DESIGN | Local CI / maintenance release / config / migration / safe metrics / off-host recovery | OPS-01…32 runtime NOT RUN; RPO/RTO/capacity not measured; no real activation | [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md) / [report](ARCH-13-change-report.md) |')
  if n=='docs/testing/technical-spikes.md':
   s=s.replace('Pin model/runtime;30 held-out cases: clarify/multi-goal/infeasible/investigate/replan/missing/stale','Pin model/runtime;30 public challenge cases + fresh restricted held-out instances theo ARCH12: clarify/multi-goal/infeasible/investigate/replan/missing/stale')
  rel=lambda x:os.path.relpath(R/x,p.parent).replace('\\','/')
  notice=f'> **ARCH-13 hiện hành — 09/10/2026:** [Operations]({rel("docs/operations/README.md")}) / [ADR020]({rel("docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md")}). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle]({rel("docs/operations/implementation-bundle.json")}).\n\n'
  p.write_text(notice+s.rstrip()+'\n\n## ARCH-13 — Operations handover\n\n'+details[n]+f'\n\n[Hồ sơ vận hành]({rel("docs/operations/README.md")}) · [Acceptance32 NOT RUN]({rel("docs/operations/acceptance-plan.md")}) · [Báo cáo]({rel("docs/architecture/ARCH-13-change-report.md")}).\n',encoding='utf-8')

def adr_report():
 (R/'docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md').write_text('''# ADR-020 — Local-first operations, fenced maintenance release và recovery

09/10/2026 · **ACCEPTED DESIGN / IMPLEMENTATION NOT RUN**. Refinement trong A+T1/S1+P2/I0+conditionalI1/D1+J2 đã được owner giao tiếp tục, không cấp quyền provision/spend/deploy.

Problem: singlehost/free-first cần đúngsource/version/schema/worker/clients và safe recovery; manual deployment không được reset financial dedupe/denies/budgets hoặc mấtfinance vì rollback. Các lớp01–12 đã có hợp đồng/LLD nhưng chưaruntimeevidence.

Decision: local synthetic CI commandset authority, optionalhosted onlyquota/securitygate; build/test/hash/sign sameartifact; manualmaintenance stop/drain/fence/migrate/privatevalidate/open. Dedicatedmigrator/checksumjournal withnontransactionphase recovery; priorcode rollback chỉexplicitcompatible, noautoDownMigration/DBrestore. Isolatedsecrets/files/encryptedmount, P2leastprivilege; lightweightaggregates + independentheartbeat/alert. Inheritrestic/offhostappendonly/witness/agecustody/erasedeadline;12h backupcandidateheadroom forunmeasured24hRPO, measuredrestorebeforeclaim. Preserveall21BE/41AC/Agent, API005/DB005/native003 unchanged.

Alternatives: hosted autoCD/rolling/k8s/managedKMS/fullmonitoring/PITR có thể xem lại khi nhu cầu đo/chi phí/HA thay đổi; chưa chọn, không miễnphíbảođảm. CI trênfinancehost, Docker socket choapp/Ops, resetDB/legacyqueue rollback và health200=realready bị loại vì authority/data risk.

Consequences: bảo trì/downtime/operatorunlock chấp nhận theo singlehostdesign, không HA/zero-lossSLA. Exacttoolchain/signer/destination/alertprovider/account/capacity/quota unresolved gates. Infrastructuremigrationjournal ngoài87domain tables phải DDLreview trước triểnkhai. Source/model/native/security/UAT vẫn NOTRUN. [Operations](../../operations/README.md), [acceptance](../../operations/acceptance-plan.md), [report](../ARCH-13-change-report.md).
''',encoding='utf-8')
 (R/'docs/architecture/ARCH-13-change-report.md').write_text('''# ARCH-13 — Báo cáo thiết kế vận hành

09/10/2026 · **DESIGN SPECIFIED / RUNTIME NOT RUN**.

Đã hoàn thiện [hồ sơ vận hành](../operations/README.md) và [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md), giữ toàn bộ21gói backend/41AC và Agent requirements. API005153operations634schemas / DB00587bảng1001cột162FK / nativebridge003 không đổi. ARCH01–13 đủ hồ sơ để bắt đầu executableDB/fullbackend và các thử nghiệm rủi ro, chưa đủ production.

| Thay đổi | Vì sao |
| --- | --- |
| CI local, pin đúng source/artifacts/toolchain, optionalhostedquota gate | Free-first, không nhầm HEAD với workingtree đã review hoặc artifactdeploy với artifacttested |
| Configstrict, mountedsecret custody và startup/readinessgate | Không publicsecrets/plaintextfallback, health200 không là authorization/recovery proof |
| Release maintenance/drain/fence, migrationjournal/phase và compatibilityrollback | Không stale worker ghi sauupgrade, không duplicateeffect/resetdenies hoặc rewindDB tự động |
| Safe aggregate observability + independentheartbeat/alerts | Ops không finance/raw/prompt, hostmất phải có bênngoài phát hiện |
| Backup/restore/retention vận hành cụ thể | Snapshotstart RPO,12hcandidateheadroom, restorelockedfreshwitness/keys, actualprune34d+24h/erase35d |
| RB01…14, OPS01…32 và OPS-SP01…10 | Có procedures/negativecases/bằngchứng và thứ tựDB-first tớifullproduct, khôngdropfeatures |

19tài liệu tổngquan được đồngbộ. Các packages/evidence/snapshottrước và frontend được hashđối chiếu; không sửa dependency/lockfile/runtime. [Validation](../execution/evidence/arch-13-operations-2026-10-09/validation-report.json) / [manifest](../execution/evidence/arch-13-operations-2026-10-09/artifact-manifest.json) ghi sốkiểm tra thực tế. Kiểmtra static/schema/decisionexamples chỉ kiểm thiết kế, khôngSQL/release/backup/restore/CI/runtimePASS.

Chưa pin/cài runtime/image/signer thật; chưaprovision backup/witness/alert/cloud/source/model, chưa chạy migrations/restore/deploy/native/UAT, chưa có RPO/RTO/capacity đo. Không tạo secrets/gọi nguồn/model/gửi thôngbáo/commit/push/chi phí. Bước tiếp theo: chuẩn bị local PostgreSQLdisposable/executableDDL rồi kiểm DB/auth/domainconcurrency, cùng các riskspikes theo [kế hoạch](../operations/implementation-and-spikes.md).
''',encoding='utf-8')

def bundle():
 paths={'api':'docs/contracts/v2-t1-r5/openapi.json','database':'docs/data/target-t1-async/target-model.json','nativeBridge':'docs/agent/native-bridge-003.json','agent':'docs/agent/implementation-bundle.json','async':'docs/async/implementation-bundle.json','sources':'docs/sources/implementation-bundle.json','android':'docs/android/implementation-bundle.json','security':'docs/security/t1/security-policy.json','recovery':'docs/security/t1/backup-restore-erasure.md','keys':'docs/security/t1/keys-and-secrets.md','retention':'docs/security/t1/logging-and-retention.md','policy':'docs/operations/operations-policy.json','schemas':'docs/operations/operations-schemas.json','runtimeCases':'docs/operations/requirement-traceability.json','runbooks':'docs/operations/runbooks.json'}
 put(D/'implementation-bundle.json',{'id':'FW-OPS-BUNDLE-20261009','status':'DESIGN_ONLY','apiRevision':'FW-API-T1-D1J2-005','databaseRevision':'FW-PHYS-T1-ASYNC-005','nativeBridgeRevision':'FW-NATIVE-BRIDGE-003','files':{k:{'path':n,'sha256':sha(R/n)} for k,n in paths.items()},'compatibility':'Inherited packages retain original revision pins; current API005/DB005/native003 per Agent delta. Ops adds no routes/schema changes; runtime migration infrastructure journal requires separate reviewed DDL.','runtime':'NOT_RUN','realEnabled':False})

def main():
 count=preserve();policy();documents();runbooks();release_and_spikes();adr_report();sync()
 print(json.dumps({'status':'AUTHORED_OPERATIONS_DESIGN','protectedFiles':count,'currentDocs':len(CURRENT),'next':'Build schemas/acceptance then seal; runtime NOT_RUN'}))
if __name__=='__main__':main()
