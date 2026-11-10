# ARCH-04 — Database: audit và phương án để chọn

ARC-04-OPTIONS-001 · 08/10/2026 · **ACCEPTED BY OWNER: D1 + J2**. Static review, **SQL/constraints/RLS/concurrency/upgrade/restore NOT RUN**. Kế thừa A + T1, S1 + P2 và I0 + I1; không tự thay các lựa chọn đó.

## 1. Kết luận

**Giữ nền PostgreSQL và mô hình Ledger/Planning hiện có, nhưng phải sửa và bổ sung trước khi dùng làm schema backend thật.** 54 bảng/610 cột là inventory của bản synthetic, không phải mức đầy đủ đã nghiệm thu. Khuyến nghị **D1 + J2**: tiến hóa schema bằng migrations tiếp nối, dùng lớp durable jobs chung trong cùng PostgreSQL.

Đã đọc [model](../data/physical/physical-model.json), [001](../data/physical/migrations/001_synthetic_tables.sql), [002](../data/physical/migrations/002_guards_and_boundaries.sql), [003](../data/physical/migrations/003_mutable_and_immutable_triggers.sql), [roles](../data/physical/role-provisioning.sql), pre/postflight/fixtures, generator/ERD/dictionary và đối chiếu [module ownership](module-high-level-design.md), [21 gói backend](../product/backend-backlog.md), [canonical API](../contracts/v2/README.md), [business rules](../product/business-rules.md). Rà bao gồm toàn bộ danh sách cột/constraints/indexes; chưa chứng minh mapping domain của mọi payload JSON hoặc mọi SQL query bằng execution.

Kết quả kiểm kê: **54 bảng,610 cột,39 bảng có workspace_id,18 explicit indexes** (3 unique),15 cột numeric và31 cột JSONB. PK/UNIQUE constraints còn sinh indexes riêng; không gọi18 là tổng indexes vật lý. SQL001 chứa110 FK references; ERD chỉ62 edges và36 table nodes. [Audit chi tiết](ARCH-04-schema-review.md), [inventory từng bảng](../execution/evidence/arch-04-research-2026-10-08/table-audit.csv), [inventory610 cột](../execution/evidence/arch-04-research-2026-10-08/column-inventory.csv).

## 2. Chọn cách tiến hóa schema

| Option | Cách làm | Lợi ích | Đánh đổi |
| --- | --- | --- | --- |
| **D1 — Kế thừa và bổ sung, khuyến nghị** | Giữ domain/table identities có ý nghĩa; sửa defects, bổ sung cấu trúc thiếu bằng migrations004+ và kế hoạch backfill | Giữ mapping API/consumer, ownership và lịch sử review; có đường upgrade kiểm được | Phải xử lý legacy synthetic constraints và các thay đổi cấu trúc, không chỉ thêm vài bảng |
| **D2 — Tạo baseline T1 mới** | Thiết kế schema revision mới từ cùng domain, mapping đầy đủ từ54 bảng cũ; giữ originals trong baseline; migration/import nếu đã có DB | Dọn naming/security/lifecycle nhất quán trước backend; hiện chưa có bằng chứng DB real nên có cơ hội làm sạch | Phải review lại toàn bộ mapping/fixtures/generator/migrations, nguy cơ mất behavior đã giải quyết; không bỏ bất kỳ feature nào |

D1 không giữ nguyên con số54 hoặc mọi tên cột. Khi cần tách payload/versions/jobs/auth, tạo bảng mới có ownership và migration. D2 không đổi thành document DB, database mỗi workspace hay microservices; những thay đổi đó không có nhu cầu chứng minh trong A/S1/P2/I1. Không chọn full event sourcing toàn sản phẩm chỉ vì Ledger có history: Ledger append-only, các aggregate khác có current state + revisions đã đủ hướng hiện tại.

## 3. Chọn cách lưu durable jobs

| Option | Cách làm | Ưu điểm | Chi phí thiết kế |
| --- | --- | --- | --- |
| **J1 — Jobs ở từng domain table** | Tiếp tục receipt/refresh_jobs/import_jobs/agent_runs tự giữ next_attempt/lease/fence/attempt, dùng interface chung | Ít thay đổi cấu trúc lúc đầu; từng domain tự đủ lifecycle | Chuẩn hóa nhiều state machines/indexes/claim paths; dễ lệch retry/cancel/restore; scheduler/retention vẫn cần storage |
| **J2 — Lớp jobs chung, khuyến nghị** | Một lớp dispatch trong PostgreSQL, job chứa typed domain reference; records nghiệp vụ vẫn riêng | Một cơ chế claim/retry/fence/attempt/catch-up cho các worker P2, dễ quan sát và phục hồi | Bổ sung jobs/attempts/scheduler state và mapping; phải tránh hai nơi cùng làm authority lease |

J2 là chung **hạ tầng**, không chung quyền. Worker chỉ claim job types/workspaces được cấp; dispatcher thấy ID/status tối thiểu, Ops chỉ projections đã lọc. Payload/prompt/finance không nằm trong admin-visible queue. Domain record + enqueue cùng transaction; financial effect + domain processed marker/replay cùng transaction. Job queue dùng delivery at-least-once; không hứa exactly-once delivery. Nếu thư viện queue có ACK riêng transaction, domain idempotency vẫn ngăn double effect.

Chọn J2 chưa chọn thư viện hoặc tự viết queue; ARCH-09 sẽ đối chiếu implementation và schema thư viện, không tạo một bộ generic jobs cạnh một bộ queue library trùng authority. Existing lease fields được chuyển/backfill rồi bỏ theo expand/contract; không để hai workers claim cùng domain task từ hai nguồn. PostgreSQL mô tả SKIP LOCKED phù hợp queue consumers, nhưng nó không tự bảo đảm ordering/fairness hoặc exactly-once. [SELECT locking](https://www.postgresql.org/docs/16/sql-select.html).

## 4. Những việc bắt buộc cho cả D1 và D2

| Nhóm | Thiết kế đề xuất | Căn cứ |
| --- | --- | --- |
| Tenant/ownership | Composite workspace FKs, owner services, per-profile roles/policies; một DB consistency boundary | A/S1/P2; DB04-F01/F12 |
| Sổ actual | Balanced immutable posting bundle; chặn cả UPDATE/DELETE và append vào group đã seal; reversal riêng, không retarget ledger account đã dùng | DB04-F02/F03; BR-04…17 |
| Tiền/quantity/giá | VND integer numeric18; quantities/prices numeric28,8; finite/range/scale validation trước coercion; intermediate Engine precision đủ | DB04-F05; canonical decimal string |
| Plan/Goals | Stable planning scope/revision identity, lock account cho allocation, atomic bundle/history/replay; Agent chỉ draft | DB04-F04/F09; BR-28…39 |
| History/snapshots | Revision immutable + source refs; phân biệt canonical facts snapshot với projection cache key có scope/period/asOf/versions/engine version; cache tách pinned history | DB04-F06/F07 |
| Jobs/receipts | Dedupe identity giữ lâu hơn payload; durable claim/fence/catch-up; receipt ACK không là posted | DB04-F08/F10 |
| Auth/Ops | Separate admin auth/session/MFA storage hoặc audited external identity mapping; device epoch/revoke; safe-control command path | DB04-F01/F11/F12 |
| Retention/recovery | Payload có lifecycle riêng khỏi immutable receipt/history identities; deletion journal độc lập backup cũ; restore fence trước mở uploader | DB04-F10/F15 |
| Prices/holdings | Frozen instrument/gold profile/version, quote/FX provenance; derived freshness; quantity state rõ declaration vs delta | DB04-F13/F14 |
| Queries/indexes | Index theo actual query plans, group lookup, lease/due filters, history pagination; không index mọi cột | DB04-F16 |
| Artifacts | Một model authority cho SQL/ERD/dictionary; full FKs/optional/unique cardinality, semantic meanings và explicit unique metadata | DB04-F17 |

## 5. Các cấu trúc có thể cần thêm

Tên dưới đây là logical candidates để định lượng, **chưa là migration đã chốt**. Không chốt trước tổng số bảng mới.

| Cấu trúc | Owner | Lý do | Cách không tạo trùng dữ liệu |
| --- | --- | --- | --- |
| jobs / job_attempts / scheduler_state | Shared jobs infrastructure; domain owns payload/meaning | Retry/lease/fence/catch-up/attempt history; J2 | Domain tables giữ nghiệp vụ, queue giữ delivery state; mapping một domain reference rõ |
| planning_revisions hoặc planning_scopes | Planning | Plan revision thật và standalone item scope; sửa actual unique key | Current plan/item không là bản history mutable |
| Snapshot descriptors / projection cache | Read Models | Pinned historical refs khác cache có TTL | Có thể split bảng hiện có; không một ledger thứ hai |
| import_rows | Imports | Row-level status/selection/replay, CSV lớn hơn blob256KiB | Tách rows khỏi import_previews blob nếu cần; không lưu raw CSV/cloud OTP |
| admin principals/sessions/MFA/recovery | Identity/Ops boundary | ops_accounts hiện là metadata của người dùng, không admin credentials | Dùng auth provider nếu được chọn hoặc tables riêng; không dùng finance identity tùy tiện |
| Device enrollment/revocation epochs | Identity & Ingestion | Capture/upload/commit/restore fencing | Có thể thêm columns/history vào devices/bindings thay tạo bảng vô ích |
| retention/deletion journal & payload storage | T1 security/retention dưới owner policy | Erasure/replay-safe cleanup và restore | Payload có TTL, identity/digest tombstone còn theo policy; journal mới nhất giữ ngoài backup cũ |
| Safe ops control requests | Ops / restricted dispatcher | Admin retry/disable có trạng thái, worker thực thi đúng scope | Ops projection không là business queue authority |
| migration journal | Deployment/migration runner | filename/checksum/success/schema revision | Một journal runner-owned, không app mutable |

Financial Engine không có bảng ledger riêng. BE-19/20 client/native vẫn có phần local; không tạo bảng server giả để đủ mapping. Không tự thêm workspace membership/collaboration feature ngoài scope owner hiện hành; chỉ thêm nếu PRD/API yêu cầu được xác nhận.

## 6. Types, keys và concurrency

Giữ opaque text IDs khớp wire, composite tenant keys; không ép UUID làm client migration không cần thiết. Bổ sung CHECK length/format nơi phù hợp. BIGINT versions dùng integer JSON chỉ trong safe range; phân biệt expectedVersion0 cho chưa tồn tại với stored version>=1. API/backend mapping phải ghi rõ, không ép Number cho tiền hoặc quantity.

Tiền VND numeric(18,0) hiện phù hợp độ dài input canonical. Quantity numeric(28,8) có20 chữ số nguyên, wire hiện tối đa18: cần validate wire/normalization bounds và overflow khi nhân quantity×price×FX, không truncate. Cấm NaN; numeric scale có thể làm tròn trước CHECK của cột, do đó kiểm input thô qua typed boundary/domain hoặc narrow procedure trước cast. CHECK amount>0 một mình không đủ finite validation. [PostgreSQL numeric](https://www.postgresql.org/docs/16/datatype-numeric.html).

Business date là date; observed/received/committed instants là timestamptz, giữ source time precision và timezone provenance. Không dùng giờ nhận thay giờ giao dịch. Missing opening/cost khác0; opening required trong createAccount v2 hiện phù hợp luồng khai báo, nhưng tình huống account coverage thiếu cần mapping rõ, không tự đổi schema nullable hoặc bịa opening.

Application UnitOfWork giữ cùng PG client. Các aggregate invariants dùng lock anchors/order chung hoặc isolation mạnh hơn có retry toàn transaction: allocations qua Goals, cumulative refund, seal posting, receipt/binding revoke, owner draft confirm. Không chỉ lock rows allocation đã tồn tại; lần đầu chưa có row cũng phải chống race. Actual expense vẫn post và làm Goal shortfall. Không provider/model calls trong transaction. [Transaction isolation](https://www.postgresql.org/docs/16/transaction-iso.html).

DB bảo vệ constraints/FKs/finite/key/immutability; Engine/service giữ business calculations, permissions, interpretation, approval và canonical validation. Cross-row rules không đặt CHECK giả đọc bảng khác. FK phía con không tự có index; chọn theo query/delete/update workload và đo EXPLAIN trên dữ liệu representative. [Constraints](https://www.postgresql.org/docs/16/ddl-constraints.html).

## 7. T1 storage/security

PostgreSQL private trên I0/I1, persistent encrypted storage và encrypted off-host backups. Đây là T1: host/root/DBA được tin; RLS không chống superuser. Runtime dùng NOBYPASSRLS, không schema owner, per-profile grants/column permissions/narrow procedures; app-admin không finance access, Agent không actual/confirm. Auth-derived subject/workspace đặt transaction-local; không lấy từ body hoặc để rò giữa pooled requests. [RLS](https://www.postgresql.org/docs/16/ddl-rowsecurity.html), [encryption](https://www.postgresql.org/docs/16/encryption-options.html).

T1 cho phép số tiền rõ trong DB để constraints/indexes/transactions hoạt động. Credential/token/signing/MFA secrets vẫn theo key custody phù hợp, không plaintext client/log hoặc tùy tiện JSONB. SECURITY DEFINER nếu cần phải là function hẹp, fixed safe search_path/qualified objects, revoke PUBLIC, dedicated owner/grants và negative tests; không biến nó thành generic bypass. [CREATE FUNCTION security](https://www.postgresql.org/docs/16/sql-createfunction.html).

protected-candidate.sql là alternative T2 lịch sử, không chạy lẫn T1 tables và không gate bắt buộc. BR-44 còn câu anti-root-Ops theo ADR-006; đó là drift tài liệu phải đồng bộ theo ADR-008 khi chốt, không quay lại chọn T2 vì một dòng cũ.

## 8. Migrations, upgrade và restore

Đề xuất dùng PostgreSQL16 làm compatibility baseline cho lần chạy đầu vì artifact đang target16; pin minor được hỗ trợ tại lúc cài. PostgreSQL16 còn support đến09/11/2028; major mới hơn cần rehearsal, không đổi major âm thầm từ tag latest. [Versioning policy](https://www.postgresql.org/support/versioning/).

Nếu chọn D1:

1. Hash/freeze001–003 và role file cũ; dựng DB disposable đúng baseline để tái hiện lỗi. Chưa có runtime environment thì ghi NOT RUN, không sửa test để thành PASS.
2. Tạo migrations004+ theo dependency: revision/journal foundations, integrity/precision, P2 roles/procedures, jobs/history/retention/auth additions. Số thứ tự và grouping chốt sau thiết kế; không chạy generator cũ để ghi đè001.
3. Sửa generator thành mô hình revision có explicit constraints/FKs/index uniqueness và dictionaries; tạo target artifacts mới. Giữ upgrade path từ baseline và fresh install đi qua cùng migration chain cho tới khi có quyết định squash riêng.
4. Kiểm preconditions/checksum/schema drift, migration lock và transaction success+journal record. Credential/role provisioning có scope cluster nên không giả DB rollback xóa roles. Runner có failure/resume semantics riêng cho lệnh không transactional.
5. Thay key/index lớn theo expand/backfill/validate/switch/contract. CREATE INDEX CONCURRENTLY không chạy trong transaction block; phải ghi journal/repair invalid index có kiểm, không bọc tất cả migrations tùy tiện. [CREATE INDEX](https://www.postgresql.org/docs/16/sql-createindex.html).
6. Test fresh install, baseline→target, interrupted step/retry, checksum mismatch, restore và mixed-version jobs. Tránh down DROP CASCADE trên dữ liệu thật; rollback app cần backward-compatible schema, còn data rollback có kế hoạch cụ thể.

Backup baseline theo ARCH-03: encrypted off-host daily dumps,7 daily+4 weekly, RPO24h/RTO1ngày là mục tiêu chưa đo. pg_dump một DB không gồm cluster roles/tablespaces; cần roles/config/extensions/grants/key recovery riêng, không export secrets không kiểm soát. Backup role phải đọc đầy đủ, không bị RLS âm thầm lọc rows. [pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html), [SQL dump](https://www.postgresql.org/docs/16/backup-dump.html).

Restore vào DB sạch, tạm dừng uploader/jobs khi đối chiếu: migration hashes, roles/grants, ledger invariants, identities/dedupe, latest deletion/revocation journal, restore epoch, counters/versions. Receipt đã ACK sau bản backup có thể không còn trên server và client đã xóa outbox: **daily dump không tự bảo đảm không mất các receipt đó**. Phải công khai RPO và thiết kế replay window/durable journal hoặc WAL protection nếu muốn giảm mất dữ liệu; chốt retention/ACK recovery ARCH-09/10/13. Không claim zero-loss chỉ vì dedupe có unique key.

PITR là lựa chọn tăng bảo vệ khi cần RPO thấp hơn, đòi base backup và liên tục archived WAL; logical dump không thay WAL backup. Lưu trữ/egress/monitoring thêm phải được tính vào I1 quota trước bật. [Continuous archiving](https://www.postgresql.org/docs/16/continuous-archiving.html).

## 9. Full-feature coverage và acceptance

| Backlog | Dữ liệu/kiểm chứng cần |
| --- | --- |
| BE-01/02 | Identity/session/device/auth, previews/replay/migration journal, role isolation |
| BE-03/04 | Accounts/opening/Ledger/reversal/refund/Review/evidence, immutable sealed groups, concurrent invariants |
| BE-05 | Consistent scope/period/version snapshots, retained history/projection rebuild |
| BE-06/07 | Holdings/movements/profile revisions/quote provenance/entitlements/refresh |
| BE-08/09/10 | Receipt/revision/binding/coverage/dedupe/CSV rows/jobs/Review; ACK/revoke/restore cases |
| BE-11/12/13 | Plan/Goal/links/allocations/occurrences/revisions/simulations; actual không bị Agent đổi |
| BE-14/15 | Conversations/messages/context/runs/steps/tools/drafts; await-user/resume/cancel/budget/history |
| BE-16/17/18 | Admin auth/metadata/commands/audit; durable jobs/schedule; redaction/retention/deletion/recovery |
| BE-19/20/21 | Consumer mappings/native DTOs/release metadata/environment migrations/restore/UAT |

Trước schema acceptance phải có: catalog introspection đúng target model; all-role direct SQL positive/negative tests; NaN/scale/bounds; posted-group append/retarget denial; cross-plan revision links; duplicate replay/lost ACK/crash/revoke races; multi-goal/refund concurrency; cache/history retention; fresh/upgrade/restore; query plans và realistic payload sizes. DB tests chạy role ứng dụng thật, không chỉ schema owner. Các test hiện tại chỉ vài fixtures không đủ.

Các bước này không trì hoãn toàn bộ feature; chúng xác định thứ tự xây chắc nền DB để mọi module dùng được. Không đánh dấu BE hoàn thành chỉ vì có table/operation mapping.

## 10. Quyết định đã chốt

Owner đã chọn **D1 + J2**: kế thừa schema và chuẩn hóa durable jobs trong cùng PostgreSQL. D2 là phương án baseline mới; J1 là phương án jobs theo domain được chuẩn hóa. Không thêm ngân sách cloud để đưa ra lựa chọn này.

Đã cập nhật [target package](../data/target-t1/README.md), model/ERD/dictionary, migration design004+, P2 permission matrix, API/storage delta, HLD/LLD và [ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md). SQL004+ chưa viết/chạy;17 findings ở trạng thái DESIGN SPECIFIED / IMPLEMENTATION NOT RUN. Phần consumer/wire nào cần đổi phải ghi rõ với ARCH-05, không tự đổi frontend. Research hiện chỉ tạo options/audit/evidence và liên kết; canonical schema/migrations/API/source frontend và r1/r2 giữ nguyên.
