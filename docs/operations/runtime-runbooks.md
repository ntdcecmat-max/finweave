# BE-18/21 — Runbooks thực thi local synthetic

12–13/10/2026. Đây là implementation bổ sung cho ARCH-13, không chứng nhận SEC-REAL-T1,
HA, off-host independence, retention nhiều ngày hoặc toàn bộ 41 AC. Các gates thật nằm
trong [real-gates.md](real-gates.md); [OPS runtime RTM](runtime-acceptance.json) giữ đủ OPS-01…32.
Các thiết kế policy/custody gốc vẫn áp dụng cho REAL. CLI chỉ chấp nhận `synthetic-local`.
RSA-OAEP/AES-GCM local là harness, **không thay age capsule/restic production**.

## Chuẩn bị — RB-01

Từ `finweave-backend`, Node 24.19.0, pnpm 11.25.0, dependencies theo lock đã pin:

```powershell
./scripts/prepare-operations-tools.ps1
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-operations.ts
node scripts/local-runtime.ts init
node scripts/init-operations.ts
$env:FW_MODE = 'synthetic-local'
node scripts/operate.ts status .local/operations/operator.json
```

Chỉ chạy `local-runtime init` khi chưa có `.local/runtime-state.json`; không reset cluster
đang dùng. `init-operations` tạo thư mục mới, không ghi đè custody có sẵn. Secret files,
media, mail fixtures, DB và scratch dưới `.local` là dữ liệu synthetic. Hai media trên
cùng máy không chứng minh custody độc lập. Client PostgreSQL 16.15 được tải ZIP EDB chính
thức và kiểm archive/binary/DLL pins trước mỗi dump/restore. Server local vẫn 16.14.
Observed hashes không phải vendor attestation hoặc runtime evidence.

Các lệnh `operate` yêu cầu runtime migration011. Cluster từ mã cũ chưa có port maintenance
phải giữ ingress đóng, có backup, xác minh drain/fence/stop các writer cũ theo scope trước
khi chạy migrator host `local-runtime.ts migrate`. Không nhận clean-install drill là bằng
chứng live upgrade của cluster đó; bootstrap/fence dưới deployment thật còn thuộc G-RELEASE.

Kiểm file `operator.json`: toàn bộ secrets là đường dẫn file, không dán khóa vào CLI/log.
Thay `releaseFile`, `subjectId` bằng artifact/subject synthetic đúng lần chạy. REAL loader
vẫn từ chối. Mount mã hóa/ACL/UID/network/TLS production cần được kiểm dưới service identity
thật trước mở REAL; local loopback không được nhận là bằng chứng các gates đó.

Khởi API/workers theo `RUNTIME.md`, dùng đúng `FW_PROFILE`, `FW_SECRET_FILE`, `FW_MODE`.
Startup kiểm role flags, role kết hợp, recovery epoch/state, required ports/grants. API
không tự migrate. `/health` chỉ trả boolean, không topology. Không print pg Client hoặc
exception gốc: crash boundary chỉ phát opaque code. Metrics HTTP dựng DTO mới với enum,
không body/header/request ID/URL/amount/prompt/SQL error. Proxy/OS/DB logs là gates riêng.
Native PG local dùng `private-logging.conf` để chặn ordinary statements/parameters/error
detail; drill bơm SQL exception và đọc log thực. PANIC/core/OS/proxy sinks vẫn là gate riêng.

## Build và release — RB-02, RB-03, RB-14

```powershell
node scripts/build-operations-release.ts
node scripts/operate.ts backup .local/operations/operator.json
node scripts/operate.ts witness-anchor .local/operations/operator.json
node scripts/operate.ts maintenance .local/operations/operator.json
node scripts/operate.ts drain .local/operations/operator.json
# Nếu drain timeout: fence trước khi kill process cũ.
node scripts/operate.ts fence .local/operations/operator.json
node scripts/operate.ts migrate .local/operations/operator.json
node scripts/operate.ts rollback-check .local/operations/operator.json
node scripts/operate.ts open .local/operations/operator.json
```

Build in đường dẫn `release.json`; cập nhật `releaseFile` trong operator file tới đó.
Artifact gzip được tạo **trước test**, giải nén ra stage riêng, chạy typecheck/unit/runtime
operations trên bytes đã giải nén, kiểm lại bytes rồi ký chính artifact digest đó. Manifest
source gồm Git tracked/untracked/deletions, lock, pins và toolchain. Source thay đổi khi
capture/test thì build FAIL. Child env không nhận provider/DB/signing credentials. Dependencies
được junction tới local node_modules đã pin; đó chưa phải independent install/SBOM proof.
Signer là ephemeral synthetic, không phải production signer. Artifact là source bundle cho
Node native TS, không phải container/APK. Không publish hoặc deploy tự động.
Stage dùng temp path ngắn để native PostgreSQL Windows không vướng giới hạn đường dẫn;
manifest ghi `testedStage`. Source bundle giữ docs/oracles và package scopes cần cho test.

Đây là trusted local build. `FW_UNTRUSTED_BUILD` bị chặn: không chạy PR/dependency code
không tin cậy trên máy chứa tài chính. Independent CI runner và publish/sign custody còn là gate.

`open` kiểm signature/bytes, đủ PASS không stale cho typecheck/unit/operations, current
backend source đúng artifact, tuple compatibility, migration journal DB, backup ≤24h với
signed catalog/readback, fresh witness phủ local denies, recovery unlocked và workers drained.
REAL vẫn bị chặn dù synthetic artifact PASS. Full promotion đòi đủ 21 BE/41 AC/OPS/clients.
Tuple gồm API/DB/native, migrations, source parser/job runtime, model/tool schema, config/key
format và lock. Unknown tuple chỉ forward fix; không down-migrate/restore DB để rollback.

Maintenance giữ share/exclusive state lock tới COMMIT: chặn mutations/native enqueue/claim
mới trước ACK. Signout/revoke/reset, host witness/erasure/backup và retention port vẫn chạy.
Worker đang chạy được drain; fence tăng generation và xóa lease, giữ attempts/deadline/unknown
external intents/quota. Không dùng recovery epoch cho maintenance vì nó có nghĩa restore.
Fence hoàn tất trước OS kill. Outcome unknown phải query/replay cùng key, theo `OPS.md`/`ASYNC.md`.

Migrator local dùng transaction advisory lock, lock timeout, append applied checksums; checksum
khác thì dừng. Không sửa journal production. Target DB005/CONCURRENT INDEX/backfill dùng
`scripts/test-db005.ts`, `scripts/test-postgres.ts` và migrator đã có; không coi journal local
001…011 là đã triển khai target DB005 production.

## Backup/prune — RB-08

```powershell
node scripts/operate.ts backup .local/operations/operator.json
node scripts/operate.ts prune .local/operations/operator.json
```

Backup dùng `REPEATABLE READ READ ONLY` + `pg_export_snapshot`, đếm toàn bộ base tables và
large objects trên cùng snapshot, truyền `--snapshot` cho `pg_dump --format=custom`. RPO lower
bound lấy tại DB **trước** export snapshot; export/upload/readback completion không thay mốc.
Không dump qua tenant role/RLS. Runtime key inventory v1 nằm bên trong archive mã hóa; khóa
archive được capsule public key wrap, private key không nằm trong pack. DB login credentials
không được tái sử dụng từ capsule. Full cluster roles/external object stores vẫn là gates riêng.

Destination write/readback và signed catalog phải xong mới có receipt. Export/destination lỗi
không thay last receipt. `.pending` và plaintext scratch của chính lần gọi được unlink/rmdir
trong finally. Crash kill giữa dump có thể để scratch: giữ volume mã hóa, cách ly, đối chiếu
directory/owner/time/active PID trước xóa; không recursive-delete đường dẫn suy ra hoặc để
plaintext fallback. Orphan/unknown catalog object là incident, không âm thầm bỏ qua.

Prune kiểm available scratch thực bằng `statfs` và reserve tuyệt đối, xác minh catalog chữ ký,
clock, byte identity và mọi object (không chia nhóm tags/hosts). Hard34d áp từ snapshot start;
archive quá hạn bị unlink và reopen phải ENOENT. Nếu mất last-good do privacy, báo conflict,
không vẫn claim RPO. Không có restic packs/versioning ở local harness: ENOENT chỉ chứng minh
unlink logical, không physical sector erasure/pack purge. Prune signature/timestamp/scratch
failure branches và deadline metadata fault tests không chứng minh 34d/24h/35d đã quan sát.

Production custodian ngoài host phải kiểm `forget` rồi `prune`, repack/scratch/quota, tất cả
snapshots/packs/tags/hosts/versioned/soft-deleted copies; inventory trước/sau và attempt fetch
deleted packs. `forget` riêng không xóa dữ liệu packs. Không thiết lập backend/custody thật
hay lệnh destructive production từ harness này. Xem [restic](https://restic.readthedocs.io/en/stable/060_forget.html).

## Restore — RB-09, RB-10

```powershell
node scripts/operate.ts maintenance .local/operations/operator.json
node scripts/operate.ts fence .local/operations/operator.json
# Dừng mọi writer synthetic cũ; kiểm đã dừng rồi đặt oldWriterFenced=true.
node scripts/operate.ts restore .local/operations/operator.json
node scripts/operate.ts witness-reconcile .local/operations/operator.json
```

`oldWriterFenced` là local operator assertion, không proof vật lý mất host. REAL cần independent
fence proof. Target phải là DB mới tên `fw_restore_*`, không có fw schemas; REVOKE CONNECT
FROM PUBLIC trước import để old logins không chạm restored DB. Archive chạy SQL trusted local
superuser, nên không dùng dump không tin cậy. Inventory/large objects được kiểm sau import.
Restore fence bật LOCKED, tăng epoch, block identities/workspaces, revoke user/Ops sessions/
devices, consume challenges/reset/recovery/refresh/collector, xóa rotations/nonces/replay bodies,
tắt binding/rights, cancel jobs giữ attempts/budgets, giữ market/model quota `infinity`.

Fresh nonce witness chữ ký/chain/head phải phủ local denies; unknown mapping/head stale giữ
LOCKED. Reconciliation chỉ bỏ global lock; owner vẫn erased/blocked, admin inactive. Cần
identity proof/reset được anchor, enrollment mới, admin provision mới và trusted quota review.
Không tự post receipts hoặc chạy restored jobs. API/export/finance chưa được mở bởi decrypt
hoặc `witness-reconcile`. Không có automatic quota reset. Không xuất restored keys ra log.

RPO = failure declaration − DB snapshot-start lower bound. RTO drill = từ bắt đầu decrypt/
import đến inventory, fence, credentials/quota checks và fresh witness reconciliation trong
scratch. Báo riêng host provision/off-host download/custody/TLS/identity reset/finance reopening;
không gọi thời gian partial recovery này là production full-service RTO. Full RTO bắt đầu tại
recovery declaration, kết thúc khi dịch vụ tài chính có kiểm soát phục vụ được.

## Erasure/TTL — RB-11

```powershell
node scripts/operate.ts erase-deny .local/operations/operator.json
node scripts/operate.ts witness-anchor .local/operations/operator.json
node scripts/operate.ts erase-purge .local/operations/operator.json
node scripts/operate.ts erase-verify .local/operations/operator.json
```

Erasure lock state/subject, deny ngay, freeze workspaces/sessions/devices/jobs/auth replay
scopes/registered blobs; requested_at/deadline35d không reset vì request key khác. Witness lỗi
không rollback deny. Privileged synthetic purge xóa đúng base-table graph, auth scopes,
private reference mappings và registered PostgreSQL large objects trong một transaction.
Replication-role exception chỉ LOCAL transaction, không cấp app/Ops; exception rollback hết.
Oracle query count/reopen độc lập với expiry timestamp. Denies và erasure journal giữ nguyên.

`erase-verify` chỉ báo active graph residual/deadline; **không có lệnh completion**. Cần kiểm
mọi backup/restore scratch/WAL/volume/replica/versioned destination/mail/log/capsule copies và
witness receipt trước completion. Files đã tải và thiết bị offline ngoài server có phạm vi riêng.
Unregistered blob/external object/new schema là inventory gap, không được xem residual0 là
proof toàn server. Giữ tombstones ít nhất90d và đến mọi affected copies expired+7d.

Retention profile chạy `fw_control.purge_runtime_payloads()` mỗi worker vòng, kể cả maintenance.
Nó xóa auth body/nonces, stale challenges, expired previews, unpinned expired messages/tools/
unconfirmed drafts/import previews; giữ financial history, linked simulations/confirmed pins,
dedupe markers và deny journals. TTL test2 giây quan sát bằng wall clock thật; production
5min/24h/30/90/180d, license TTL và active payload sanitation còn phải kiểm đúng scope/gate.

## Alert và resource/provider/model/native incident — RB-04…07, RB-12, RB-13

Heartbeat receiver/producer là scripts riêng; config file paths được harness chuẩn bị, HTTP
loopback ký Ed25519, strict body/sequence/time, monotonic missing interval. Receiver phát
`HEARTBEAT_MISSING`/`HEARTBEAT_RECOVERED` opaque, duplicate bị từ chối. Kill producer là actual
process fault; receiver cùng host chưa phát hiện/prove host power/network failure independence.
REAL cần receiver ở failure domain khác, TLS và notification delivery được kiểm thực.

Disk/scratch reserve thiếu: không prune hoặc mở release. Quota không biết: deny egress.
Provider/Agent lỗi dùng `ASYNC.md`/`ASSISTANT.md`/`OPS.md`, giữ rights/quota/budget/unknown intent,
không paid fallback. APK dùng signing/update/outbox runbooks Android đã có; source/model/device
đã có synthetic evidence không thay actual licensed provider/local model/owner device UAT.
Critical privacy/recovery/erasure/incorrect ledger thì giữ maintenance/LOCKED; incident close
phải kiểm lại runtime và đúng source/artifact, không chỉ hash/static checks.

Nguồn kỹ thuật: [PostgreSQL pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html),
[EDB binary distribution](https://www.enterprisedb.com/download-postgresql-binaries).
