# Database invariants và workflows D1 + J2

08/10/2026 · **TARGET SPECIFICATION, TESTS NOT RUN**. Đây là nghĩa nghiệp vụ bổ sung cho [dictionary](data-dictionary.md); [17 findings](../../architecture/ARCH-04-schema-review.md) vẫn cần kiểm SQL/domain/concurrency.

##1. Một actual authority, posting bundle bất biến

Accounts.opening là cấu hình declaration; balances/report lấy posted ledger cùng Engine, không cộng opening lặp hoặc thêm projection cache làm authority. Posted event phải có group sealed, ít nhất2 lines, sum(signed_amount)=0 theo currency; VND là actual ledger currency hiện tại. Pending/review/receipt không là tiền đã ghi sổ. Price/Plan/Goal/Agent không ghi actual.

Posting service dùng một UnitOfWork: lock workspace/domain anchors theo thứ tự chuẩn, recheck authorization/versions/replay → tạo event/group building → insert lines → validate/reverse rules → seal → history/replay/result/job completion → commit. Group building không được tồn tại sau commit. Group lock và guard kiểm seal trên mọi line INSERT; group đã seal chặn cả balanced append, UPDATE/DELETE. Không chỉ dựa sum0 deferred trigger. Ledger account account_id/kind không được retarget sau khi đã có line posted; kiểm sử dụng dưới cùng anchor lock để tránh race.

Correction tạo reversal/replacement nguyên tử và history; exact reversal theo từng ledger account, currency, group gốc. Opening không là income, transfer nội bộ không là expense, fees tách; refund theo ngày nhận và tổng không vượt nguồn được hoàn; investment phối hợp quantity/cash trong cùng transaction. UI/typecheck không chứng minh các invariants này.

##2. Precision, calendar và input validation

Tiền VND numeric(18,0), quantity/giá numeric(28,8), FX numeric theo declaration baseline. API decimal strings, Engine decimal arithmetic; không JavaScript float cho phép tính authority. Validate hữu hạn, range và scale **trước cast vào typmod**, kể cả repository/procedure boundary; reject fractional VND thay vì để PostgreSQL làm tròn. CHECK finite/NaN và domain sign bounds vẫn cần sau cast; versions/counters chuyển JSON phải trong safe integer range hoặc versioned string contract qua ARCH-05, không đổi wire ngầm. Giá>0, quantity/balance>=0 theo domain; signed ledger line≠0, delta có thể âm.

PostgreSQL numeric nhận NaN và có coercion/rounding trước constraints; CHECK(x>0) riêng không đủ. Raw numeric/text input của narrow mutation procedure phải kiểm scale/range/finite trước gán numeric(p,s). Trusted migration importer cũng qua kiểm này. [Numeric types](https://www.postgresql.org/docs/16/datatype-numeric.html).

created/received/lease/expiry dùng timestamptz UTC; business_date dùng date theo Asia/Ho_Chi_Minh. Quote asOf/fetchedAt/FXasOf khác nhau; không lấy quote tương lai cho report lịch sử. Bounded JSON/schema/request budgets áp dụng trước DB; typed refs không tùy ý trỏ SQL object.

##3. Planning revision và history

planning_scopes định danh một Plan hoặc standalone items trong workspace. planning_revisions=(workspace,scope,revision_no), không dùng plan_version trần làm identity toàn workspace. Revision items đóng băng item version/body và input refs; actual_links có composite FK tới frozen item version, active unique theo planning_revision_id+event_id. API planVersion cũ là source version, không tự chuyển thành revision PK; resolver lấy scope từ authorized item/plan.

Owner procedure phải kiểm plan_items.plan_id khớp scope.plan_id (standalone thì cả hai NULL), frozen revision item thuộc đúng scope, actual event cùng workspace và event_version có history tương ứng. Composite FK bảo vệ identity nhưng không tự chứng minh mọi cross-row business condition; validate dưới scope/domain locks, không để generic INSERT bypass.

Owner confirm Plan–Goals bundle lock workspace/planning scope, rồi accounts/holdings/goals/items theo stable ID order, recheck versions/available cash/tổng allocations tất cả Goals, ghi Plan/Goals/links/revision/history/replay cùng transaction. Concurrent mutations/refund và actual link uniqueness dùng DB locks+constraints; cross-row totals không dùng CHECK tham chiếu bảng khác. Agent role chỉ tạo draft qua narrow procedure, không confirm và không posting. Plan-only, Goal-first và standalone vẫn được hỗ trợ.

version_history được ghi cùng transaction mutation, không chỉ hy vọng application nhớ gọi; public write ports bắt buộc capture. Snapshot giữ immutable facts refs/source versions/asOf/engine identity, không là ledger thay thế. projection_cache key gồm scope,period,asOf,relevant versions,Engine/DTO schema; có TTL và rebuild được. Pinned simulation/Agent/planning history không bị cache cleanup làm mất refs. User erasure là quy trình riêng được audit, không sửa history thường ngày.

##4. J2 — một dispatch authority

jobs chứa workspace/type/domain reference/dedupe/state/lease/generation/epoch, không payload tài chính. Domain records (ingestion_receipts/refresh_jobs/import_jobs/agent_runs) giữ semantic lifecycle; jobs/job_attempts giữ delivery lifecycle. scheduler_state giữ UTC watermark + business timezone; global catalogue jobs xử lý bởi explicit scheduler/catalog capability, không tạo workspace giả.

Domain record+enqueue cùng transaction. Claim procedure chỉ nhận registered capability, lấy due job bằng row locking/SKIP LOCKED, tăng generation và attempts, cấp token+lease. Worker fetch payload qua owner-specific port bằng scoped job ticket; dispatcher không đọc finance. External provider/model call ngoài transaction. Finalize compare job ID/type/workspace/generation/token/lease/recovery epoch và current consent/binding; expired worker không commit. Heartbeat có giới hạn; retry backoff+jitter bounded, dead jobs có sanitized error và owner/admin-safe retry.

Financial effect+domain processed marker+command replay trong cùng UnitOfWork. Nếu queue ACK không tham gia cùng transaction, ACK sau domain commit; retry thấy domain committed và hoàn tất job, không post lại. Queue delivery at-least-once, không hứa exactly-once network. Unique transport replay khác semantic dedupe; ambiguous transactions phải Review. Cancel chỉ ngăn công việc chưa commit; không âm thầm reverse actual đã commit. Ops pause/retry phải qua control request đã authorize, không bỏ qua consent/revoke/domain preconditions. Library selection/heartbeat timings/catch-up policy chi tiết ARCH-09.

##5. Payload, price và quantity lifecycle

payload_objects chỉ tách nội dung nhạy cảm khỏi identity/digest. Domain owner quyết schema/retention/access; không expose generic CRUD. Staging/import row/quote details/tool evidence có policy riêng. Immutable receipt/replay IDs sống lâu hơn payload để retry không tạo effect mới; response hết TTL thì báo replay body unavailable/reconciliation theo ARCH-05, không re-execute old key. Không đưa raw bank notification/OTP vào DB/server/model/log ngay từ capture.

Sau copy/digest verification và reader cutover: bỏ evidence.content, ingestion_receipts.normalized_evidence, refresh_jobs/import_jobs/idempotency_records/tool_results.result; import_previews.rows chuyển import_rows, snapshots.projection chuyển projection_cache. Không giữ bản inline nhạy cảm song song vô hạn rồi gọi payload đã được purge. Frozen domain histories còn JSON là retention class riêng tới authorized erasure, không thuộc cache TTL.

Retention worker không có broad DELETE finance: narrow procedure chỉ xóa cache/expired staging hoặc redact expirable content; pinned refs giữ tới explicit erasure policy. Purge không phá FK từ event/evidence/history; identities/digests/replay tombstones giữ đúng horizon. Full workspace erasure dùng dedicated privileged audited workflow, xử lý retained history, backups và external recovery journal, không là cache TTL.

Quote freezes instrument/gold-profile version, side/unit/currency/source price, quoteAsOf/fetchedAt, entitlement scope, FX/asOf và normalization version. Existing source fields + profile_snapshot là provenance, không rewrite quote khi profile đổi. API freshness tính theo current asOf/stale policy; cached baseline quality không trở thành forever-fresh. Last-good giữ khi provider fail. Quote không đổi quantity/cash.

holding_movements có per-holding sequence được serialized; set declaration/correction khác delta investment. quantity là balance sau movement, delta ghi thay đổi khi mode=delta; initial declaration không tạo purchase. Original units/provenance giữ trong typed history; chỉ/share canonical, lượng đổi10 chỉ. Imports dùng import_rows bounded từng row, toàn preview có digest/count; owner-selected set commit nguyên tử, không để CSV size vượt một JSON limit.

##6. Recovery, trust và authentication

T1 tin host/root/DBA/backup/key operator; app-admin không finance access. SQL RLS+composite FKs+owner services cùng bảo vệ tenant/object. Pg client context transaction-local, không SET lâu trên pool; client không tự xác lập actor/role/workspace. Global reference phải kiểm scope/entitlement/expiry, không coi global ID là public authorization.

Admin principal/session/MFA tách customer session; sessions.role='admin' legacy không dùng cho Ops sau cutover. Admin auth pool chỉ OpsIdentity, admin business pool chỉ sanitized Ops. session.device_id semantics quyết ARCH-06, không tự FK vào Android device nếu đó là browser session identifier.

devices.owner_epoch/workspaces.recovery_epoch và receipt.capture_epoch kiểm lúc accept và lúc commit. recovery_journal local không đủ: restore từ backup cũ phải lấy **latest independent off-host revoke/delete checkpoint** trước mở uploader/workers, áp lại revocation/erasure, tăng restore fence. Checkpoint không sẵn thì ingest và privileged mutations fail closed. Không lưu ID/PII thô trong Ops recovery metadata. Native giữ minimum replay/reconciliation theo ARCH-09/10 để xử lý receipt ACK đã có trước một backup bị mất. RPO24h/RTO1day là mục tiêu chưa đo, không bảo đảm zero-loss.
