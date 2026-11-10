# Backend/auth local — API005, S1/P2, J2

Chỉ chạy **synthetic-local**, email `.test`, loopback. Node **24.19.0**, pnpm **11.25.0**, PostgreSQL **16.14** qua package Windows x64 đã pin. Fastify5.12.5, Argon2id64MiB/t3/p4, AJV8.20.0 và JCS đều có version exact trong package/lockfile. Không cần Docker, Redis, dịch vụ mail hoặc credentials thật.

Financial runtime đã bổ sung migration005 và 33 operations account/ledger/portfolio. [Contract + preview/confirm protocol](../docs/contracts/local-finance/README.md), [correctness/concurrency report](../docs/execution/backend-finance-local-2026-10-09.md). Chạy `pnpm test:finance`; dùng `node scripts/local-runtime.ts migrate` để upgrade cluster hiện có trước khi mở User API. Local `start` giữ port từ runtime-state và chỉ bind IPv4 loopback. `scripts/start-finance-local.ps1` mở API ẩn, `scripts/smoke-finance-local.ts` ghi nghiệp vụ vào persistent DB qua HTTP thật.

## Chạy lại kiểm chứng

Trong thư mục `finweave-backend`:

```powershell
pnpm install --frozen-lockfile --ignore-scripts --store-dir .local/pnpm-store
pnpm typecheck
pnpm test
pnpm verify:pins
node scripts/verify-db005-toolchain.ts
pnpm test:runtime
```

`test:runtime` tạo cluster PG riêng, các login không superuser/BYPASSRLS, thực thi HTTP contract qua Fastify inject và races trên nhiều kết nối PG thật, rồi dừng cluster. Evidence không chứa secrets nằm tại `docs/execution/evidence/backend-auth-local-2026-10-09/runtime-*.json`. Các cluster/secret fixture ở `.local/` bị Git ignore. TCP localhost cần được hệ điều hành/sandbox cho phép. Không giảm tham số Argon2 để chạy test.

## Khởi tạo và chạy HTTP thật

```powershell
pnpm local:init
node scripts/local-runtime.ts paths
node scripts/smoke-local.ts
```

`init` tạo PostgreSQL persistent, secret file riêng từng profile và seed Ops thử; chỉ chạy một lần. `smoke-local` tự mở hai process, chạy đăng ký → mail sink → xác minh → workspace → logout, và password+TOTP Ops → deny finance → logout qua HTTP thật, rồi đóng hai process. PostgreSQL vẫn chạy. Kết quả ở `.local/<runtime-dir>/smoke-result.json`.

Để dùng backend sau smoke, mở **hai terminal riêng**. Terminal User:

```powershell
$runtimeState = Get-Content .local/runtime-state.json | ConvertFrom-Json
$env:FW_MODE = 'synthetic-local'
$env:FW_PROFILE = 'user'
$env:FW_SECRET_FILE = Join-Path $runtimeState.dir 'user.json'
node src/runtime/main.ts
```

Terminal Ops:

```powershell
$runtimeState = Get-Content .local/runtime-state.json | ConvertFrom-Json
$env:FW_MODE = 'synthetic-local'
$env:FW_PROFILE = 'ops'
$env:FW_SECRET_FILE = Join-Path $runtimeState.dir 'ops.json'
node src/runtime/main.ts
```

User origin `http://127.0.0.1:4310`; Ops origin `http://127.0.0.1:4311`. Gửi `Content-Type: application/json`, `X-FW-Contract-Revision: FW-API-T1-D1J2-005`, `X-FW-Client: web`, và **Origin đúng process**. Method/path/envelope/input giữ nguyên OpenAPI005. Query cũng là POST và `mutation: null`; mutation có đầy đủ idempotencyKey/expectedWorkspaceVersion/expectedObjectVersions/previewToken. Unknown fields, coercion và revision shorthand `005` bị từ chối.

Đăng ký email `.test` với password15–128 Unicode code points, `passwordConfirmation`, `syntheticAcknowledgement:true`, `installationPublicKey:null`. Đọc mail thử từ `<runtime-dir>/mail/*.json`, tìm đúng `challengeId`, gửi code đó đến `verifyIdentityChallenge`. Mail sink là thư mục thử riêng, không endpoint công khai hoặc log ứng dụng. Không có mã OTP cố định. Session thực được cấp bằng Set-Cookie `fw_test_session` HttpOnly/SameSite=Lax; CSRF cookie `fw_test_csrf` đọc được và phải gửi qua `X-FW-CSRF` cho mutation, kể cả logout. Giữ cookies của HTTP client. **Không có X-Session/User/Role header bypass.**

Ops fixture: `operator@ops.test`, password `Synthetic Ops password 2026!`. Chạy `node scripts/local-runtime.ts mfa` để lấy mã RFC6238 hiện tại từ fixture riêng. `adminSignIn` cần cả password và mã. Timestep chỉ dùng một lần, chỉ retry đúng keyed command mới replay được5 phút. Chờ timestep mới để đăng nhập lần khác. Fixture này là provisioning thử; không mở public admin signup hoặc nút reset factor.

Provision thêm admin local bằng infrastructure CLI `scripts/provision-admin.ts` với `FW_MODE=synthetic-local`. Truyền một JSON qua stdin có đúng `email,password,seed,firstCode,secondCode` (seed160bit/base64url, hai mã của timestep trước và hiện tại). CLI kiểm hai mã liên tiếp, lưu PHC và seed AES256GCM bằng **Ops factor key riêng**, consume activation timestep; đăng nhập bằng timestep kế tiếp. Không truyền password/seed qua command-line arguments hoặc lưu stdin vào repo. Fixture do `init` tạo là harness thử riêng, không thay workflow provisioning này.

Dừng API bằng Ctrl+C. Dừng/khởi động lại PG:

```powershell
node scripts/local-runtime.ts stop
node scripts/local-runtime.ts start
node scripts/local-runtime.ts migrate
```

`migrate` kiểm checksum001–004 và chỉ áp dụng migration thiếu, bằng credentials infrastructure riêng. Process API không có quyền migration/DDL. Không xóa `.local/runtime-state.json` hoặc đổi sang credentials DBA để bỏ qua lỗi recovery/profile.

## Các owner và ranh giới

| Owner | Trách nhiệm/quyền |
| --- | --- |
| Identity | Pending/active/blocked identities, challenges, PHC passwords, opaque sessions, refresh families, reauth, recovery codes, installations, devices/collector credentials |
| Workspace | Workspace/object authorization, accounts local, versions, Workspace owner ports dùng trong reset coordination |
| Command/replay | Semantic HMAC loại requestId/proof, effects+audit+replay atomic, outcome/tombstones; current auth và object ownership trước replay |
| OpsIdentity | DB pool/login/pepper/replay key/TOTP factor key riêng; password+TOTP, session và reauth; không schema/grants finance |
| Dispatch/J2 | Narrow SQL ports theo profile, owner/workspace anchors trước job lock, generation/token/epoch/deadline/attempt budget, atomic completion+checkpoint |
| Recovery coordinator | Infrastructure CLI riêng; block local, signed deny journal, verify fresh nonce/head/chain, apply receipt với epoch guard, restore locks và force reset |

Mỗi UnitOfWork lấy đúng một checked-out `pg` client. Mọi owner port nhận cùng `Tx`; không nested commit hoặc pool.query trong workflow. READ COMMITTED với owner/workspace locks; bounded retry chỉ serialization/deadlock trước commit. COMMIT mất kết nối trả `OUTCOME_UNKNOWN`, không tự chạy lại. Actor/workspace context transaction-local và RLS defense-in-depth. Response schema kiểm **trước commit**, không âm thầm strip fields. Errors dùng đúng schema API005, không echo password/code/token/SQL details.

Browser idle30 phút/absolute12 giờ; meaningful mutation cập nhật idle, query/poll/renew không kéo dài idle. Native access15 phút, refresh family absolute30 ngày. Cookie/bearer lẫn nhau, wrong audience và Origin đều denied. Token digests có pepper/purpose; auth issuer responses dùng AES256GCM5 phút, tách khỏi generic command90 ngày. Maintenance mỗi phút xóa encrypted replay bodies hết hạn và giữ keyed marker; exact consumed-refresh retry hết hạn cần reauth, không rotate lần nữa.

Native tests dùng khóa P-256 thật. Installation SPKI DER canonical, proof JCS claims exact, ES256 raw64byte/P1363, ±60 giây và nonce một lần. Enrollment/collector issuance cần native owner proof + fresh reauth + collector signature riêng. Collector24 giờ, authorization30 ngày không tự kéo dài khi renew, recovery/device/auth epochs và workspace binding đều kiểm lại. Wrong token audience bị từ chối. Independent refresh reuse revoke family; collector reuse chỉ revoke device/authorization. Chưa có APK/Keystore interoperability evidence.

## Worker profiles

`ingestion`, `market`, `forecast`, `agent`, `retention` có login và secret file riêng; không public HTTP listener, không grants trực tiếp finance/Ops. Chạy một process cho mỗi profile bằng `FW_PROFILE=<profile>` và secret `<profile>.json`, như API ở trên. `Worker.claim/finalize/complete/runOnce` là nền J2 đã chạy trên PG; compute nằm ngoài transaction, completion+checkpoint có fence atomic. Worker sai profile, ticket cũ/hết lease, owner revoked/reset, recovery mismatch, deadline/budget hết đều không publish.

Profiles ingestion/market/forecast/agent đã có domain handlers local và typed owner ports: receipt/CSV ingestion, market stub refresh, threaded forecast và deterministic Assistant/Planning Agent. Xem [ASYNC.md](ASYNC.md), [BUSINESS.md](BUSINESS.md), [ASSISTANT.md](ASSISTANT.md). Các handlers yêu cầu cluster đã áp dụng migration đến 008; không dùng probe làm kết quả nghiệp vụ. REAL provider/model vẫn tắt. Retention domain/Assistant cleanup đầy đủ còn mở; generic synthetic probe chỉ là harness nền lịch sử.

## Reset, deny và restore local

Reset email trả generic response, reset token256bit/15 phút dùng một lần, không tự login. Reset tăng auth epoch, revoke tất cả sessions/devices/challenges/reset/recovery authorities và block workspaces trong cùng transaction; ghi deny metadata. Với witness offline, identity **tiếp tục blocked**. Sau reset local:

```powershell
node scripts/local-runtime.ts anchor
```

CLI append deny vào journal Ed25519 ký từng entry/hash-chain, lấy signed head với nonce mới, kiểm chữ ký, rồi đánh dấu anchored. Chỉ đúng epoch reset còn hiện hành mới unblock; receipt cũ không bỏ qua deny mới. Không app-admin control/DB credential nào được phép gọi coordinator.

Diễn tập restore trong **dataset synthetic**, sau khi dừng writer/API/worker:

```powershell
node scripts/local-runtime.ts restore-fence
node scripts/local-runtime.ts restore-reconcile
```

Fence tăng recovery epoch, revoke credentials và block owners. Reconcile giữ LOCKED khi witness mất/chain sai/mapping thiếu/head thiếu local denies; fresh verified checkpoint mới mở global gate. Owners vẫn blocked, phải thực hiện **reset mới + anchor**; Ops identities bị inactive và factor cũ không thể signin/replay. Infrastructure operator phải dùng `provision-admin.ts` với **seed mới và hai mã liên tiếp**; CLI giữ principal ID, không thay factor của admin đang active. CLI đồng bộ recovery epoch vào các secret file local; API startup sai epoch bị từ chối. Missing journal hoặc stale lock không được tự bỏ qua.

## Phạm vi đã chạy và phần chưa bật

34 operation routes có implementation: identity/session/reauth/recovery/native/collector, workspace/accounts/outcomes, Ops signin/signout/reauth. Các request/reply/error dùng trực tiếp bộ 634 schemas / 153 operations của API005 đã pin SHA256; operation chưa hỗ trợ không có route trả200. Account local chỉ phản ánh opening, chưa là toàn bộ Ledger/reporting/financial Engine workflow.

Runtime schemas `fw_auth`, `fw_finance`, `fw_ops`, `fw_dispatch`, `fw_control` là nền executable bổ sung trong DB local riêng. Không nâng trạng thái của toàn bộ DB005 / 153 operations; chưa migrate historical synthetic owners/disabled hashes vào identities thật. Historical SQL DB005, contracts, frontend và evidence trước được giữ. `database/runtime/toolchain.json` ghi lock extension/provenance; verifier vẫn kiểm các PG/Node binary pins cũ.

REAL mode bị fail-closed. Mail provider, HTTPS production cookies `__Host-*`, mTLS/service request gateway, Android device interoperability, off-host witness/backup/custody, erasure35 ngày và đầy đủ domain adapters chưa được kiểm/bật. Journal local có chữ ký và durability nhưng **không phải witness ngoài host hoặc SEC-REAL-T1**. Mail sink/fixture seeds/private keys chỉ thuộc test profile. Không đổi các gate này bằng environment flag hoặc gọi local test là production security acceptance.
