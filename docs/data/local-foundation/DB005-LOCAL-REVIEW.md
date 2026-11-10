# Kiểm tiếp nhận và thực thi DB005 local — 09/10/2026

Gói bàn giao đủ các baseline physical001–003, D1, AUTH002, SECURITY003,
DOMAIN004, ASYNC005, dictionary/model và migration plans. API005/DB005/native003
vẫn là pin hiện hành. Các target là expand design, không phải SQL đã chạy.
Migration004 là triển khai ledger có sẵn;001–004 giữ nguyên checksum.

Kết quả cuối: **97/97 ca DB005 local PASS**, trace676 SQL statements; PG16.14,
source không đổi trong run và cluster đã dừng. Regression foundation:41PASS,
2KNOWN_DEFECT baseline được tái hiện có rollback. Typecheck/pins/kernel unit
checks PASS. [Tổng hợp evidence](../../execution/evidence/db005-local-2026-10-09/latest-verified.json)
trỏ tới actual catalogs, schema diffs, cases và SQL trace theo source cuối.
**FULL_DB005_ACCEPTANCE: NOT MET** do các gaps nghiệp vụ/quyền/provenance bên dưới.

Artifact mới nằm trong `finweave-backend/database/db005/`, manifest riêng
`db005-manifest.json`. Manifest foundation cũ không bị thay thế. Runner cùng
session giữ advisory lock; nhận duy nhất database `fw_synthetic_*`, PG16/UTF8.
Không dùng dữ liệu thật, không sửa frontend hoặc target packages lịch sử.

## Chuỗi triển khai

| Bước | Artifact | Hành vi |
|---|---|---|
|001–004|Historical manifests|Schema synthetic, ledger seals, tiền nguyên exact CHECK|
|005|expand|Tạo32 bảng domain mới; nullable expand các cột kế thừa|
|006|backfill infrastructure|Checkpoint/hash input và journal cho DDL ngoài transaction|
|backfill|`backfill-db005.ts`|Chunk1–1000 rows, transaction/checkpoint đồng commit, recovery token CSPRNG32bytes, resume không đổi token|
|007|constraints|NOT NULL, toàn bộ162FK target, numeric finite/scale/range, bounded counters và JSON|
|008|guards/capabilities|Role default-deny, FORCE RLS, identity/credential/planning/erasure checks, cutover indexes|
|009–011|concurrent indexes|J2 due/reaper và quota indexes, kiểm exact definition/validity trước success journal|
|012|domain ports|Quantity timeline, actual event-family guards, refund limit, quota/TOTP/redaction ports|
|013|job registry|Registry pin immutable trong infrastructure|
|014|job ticket ports|Claim/heartbeat/reaper/ticket checks; worker profile, workspace/recovery/consent fences|

Clean install không cần seed. Upgrade fixture baseline đi qua006, nạp reviewed
provenance, backfill, rồi007+. `test-db005.ts` tạo và dừng cluster PG16 disposable;
artifact/test logs được lưu vào mỗi run directory riêng.

## Đối chiếu thực tế

Schema target87 được ánh xạ thành86 domain tables trong `fw` và một migration
journal trong `fw_infra`, theo addendum foundation có sẵn. Infrastructure thêm
`backfill_progress`, `migration_phases`, `job_registry`, không cộng giả vào87.
Journal có thêm release/catalog hash fields. Báo cáo catalog lấy types/nullability,
default expressions, FK deferrability/validation, indexes/predicates/uniqueness,
RLS/policies, grants theo table/column, function bodies/ACL/search_path, triggers
và role attributes. Mỗi run có `clean-schema-diff.json`, `upgrade-schema-diff.json`.

Tiền, quantity, price và FX dùng unconstrained `numeric` + finite/range/scale
CHECK. Đây là khác biệt physical có chủ đích: typmod `numeric(p,s)` làm tròn
trước CHECK nên không thể từ chối nguyên giá trị fractional/overprecision.
Các sign checks kế thừa vẫn giữ. Lexical decimal input và PHC/SPKI/AEAD/schema
validation thuộc trusted command/auth ports, chưa được chứng minh chỉ bằng DDL.

Backfill không đoán installation, snapshot refs/engine versions, quote profile,
planning revision hoặc refresh input từ trạng thái live. Thiếu required mapping
làm chunk rollback với `LEGACY_PROVENANCE_REQUIRED`; constraints không cutover.
Input đã bắt đầu bị pin checksum; sửa input không âm thầm resume cùng checkpoint.
Fixture riêng khai báo legacy installation **revoked** và device **revoked**,
giữ khóa giả baseline như tombstone synthetic; không quảng cáo đó là validated
SPKI hoặc credentials có thể đăng nhập. Inherited workspaces bị blocked và
identity recovery reset required cho tới trusted privileged verification.

## Tính đầy đủ và giới hạn nghiệm thu

**Executable schema + các ca SQL local không đồng nghĩa FULL_DB005_PARITY.**
Permission matrix mô tả approved query/command ports, không phải GRANT SELECT
toàn bộ bảng. Bundle hiện cấp owner read có RLS, sanitized Ops read, quota
reserve, Ops TOTP counter CAS, retention redaction và J2 ticket ports. Những
role chưa có domain/auth command port vẫn default-deny; đây là khác biệt phải
ghi nhận, không dùng denial test để tuyên bố positive capability hoàn chỉnh.

| Nghĩa vụ còn thiếu | Vì sao chưa đủ nghiệm thu |
|---|---|
|Owner domain UnitOfWork ports|Create/confirm/history/replay/financial commit chưa có đầy đủ write capability implementation; FK và guards không thay thế dịch vụ|
|Auth credential lifecycle|PHC Argon2id, email verifier, SPKI possession, refresh rotation/reuse, challenge-purpose binding và AEAD envelopes chưa full runtime|
|Planning/snapshot backfill|Legacy plans/actuals/quotes/refresh inputs cần reviewed provenance; fixture cơ bản không chứng minh tất cả populated legacy families|
|Payload/import/cache contract|Giữ expand inline columns; chưa full copy/digest/selected-set validation và reader cutover/drop lifecycle|
|J2 complete domain finalize|Claim/ticket/heartbeat/reaper có SQL; typed domain effect+history+replay+finalize ports và bounded lifetime/concurrency policies chưa đầy đủ|
|Forecast publish|Typed input/page ownership checks có; all-path/page/trials digest verification + fenced publish/retention pin closure còn thiếu|
|Recovery witness/erase closure|Tree/deadline/deny SQL có; independent signatures/receipts, frozen child inventory, all-copy proof và restore credentials fence cần runtime riêng|
|Market/Agent external policies|SQL quota reserve không tự xác nhận namespace authorization/license; model/tool budget settle-once và frozen typed inputs cần domain ports|

`semantic-inventory.json` giữ nguyên các rule nghĩa vụ không thể tự dịch từ
prose thành SQL; danh sách này không phải PASS checklist. Cần implementation và
positive behavioral evidence cho các dòng trên trước acceptance DB005 đầy đủ.
Không mở consumer hoặc REAL chỉ vì tables/columns/FKs khớp.

## Tái lập và evidence

Từ `finweave-backend`, Node24.19.0, pnpm11.25.0, lockfile frozen; PostgreSQL
binary package16.14.0-beta.17 thực chạy server16.14. Dependency versions đang
pin trong `package.json`/`pnpm-lock.yaml`; mỗi run ghi executable SHA256.

```powershell
pnpm install --frozen-lockfile
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-postgres.ts
node scripts/test-db005.ts
node ../tools/backend/audit-db005-handover.mjs
node ../tools/backend/report-db005.mjs
```

Có thể dùng `scripts/reproduce-db005.ps1` để pin/check/install và chạy cả hai
disposable suites. `scripts/verify-db005-toolchain.ts` kiểm executable/lock hashes.
Để apply trên một DB local disposable đã tạo, dùng `scripts/migrate-db005.ts`
với PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE đặt rõ trong environment; `--through
006` dừng ở expand, `--backfill-input path.json` dùng reviewed provenance trước
cutover. CLI không có database/password/remote-host mặc định. Synthetic fixture
mapping là test input, không dùng để tự tạo installation cho dữ liệu không rõ nguồn.

`test-postgres.ts` kiểm regression001–004, connection loss và seal concurrency.
`test-db005.ts` lưu `cases.json`, `executed-sql.json`, actual catalogs/schema diffs,
PostgreSQL server log và runtime/source hashes. Failed runs được giữ riêng;
chỉ run status PASS, sourceUnchangedDuringRun=true, clusterStopped=true mới dùng
làm evidence thành công. Không sửa evidence lịch sử để che lần fail.

Hành vi concurrent index đối chiếu [PostgreSQL16 CREATE INDEX](https://www.postgresql.org/docs/16/sql-createindex.html);
tenant policy đối chiếu [RLS](https://www.postgresql.org/docs/16/ddl-rowsecurity.html);
precision đối chiếu [Numeric Types](https://www.postgresql.org/docs/16/datatype-numeric.html).
