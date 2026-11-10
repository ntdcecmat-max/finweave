# Tenant/admin/device/worker isolation và egress

**DESIGN NOT ENFORCED YET**. [147operation overlay](operation-security-overlay.csv), [table classification](table-data-classification.csv), [Identity147permissions](../identity/operation-permissions.csv). Authority xuất phát server, không body/URL/prompt.

## 1. DB/process boundary

P2 user/API và Ops processes/pools/credentials riêng. Runtime roles không superuser, BYPASSRLS, tableowner hoặc schema DDL; migrate/backup/recovery roles privileged tách khỏi ordinary runtime. Bảo đảm ENABLE+FORCE RLS nơi tenanttables có policy, `WITH CHECK` và nested composite ownership; non-tenant authtables chỉ narrow lookup/procedures. Scope dùng SET LOCAL trong một checked-out transaction, rollback/reset không để context leak pool. Workspace.access_state active là precondition cho finance queries/commands/tools/workers.

PostgreSQL superuser/BYPASSRLS vượt RLS, tableowner thường vượt nếu không FORCE; `TRUNCATE`/FK checks có hành vi riêng. Vì vậy FORCE RLS không là bảo đảm chống DBA hoặc API đã chiếm DB authority. [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html). Với SECURITY DEFINER: owner/grants/search_path cố định, revoke PUBLIC EXECUTE, không dynamic identifier/SQL; check caller capability và full nested scope. [CREATE FUNCTION security guidance](https://www.postgresql.org/docs/18/sql-createfunction.html). Chưa có actual SQL grants/function tests.

App-admin không SELECT user tables/password/replay/finance, không owner recovery/export route hay impersonation. Ops DTO chỉ allowlisted aggregate health/quota/release/safe enum codes, opaque Ops IDs; financial sourceAccountRef, amount, user prompts/ticker holdings/evidence/receipt digest không được “sanitize” bằng đổi tên field. Cross-role calls deny dù routes private hoặc UI ẩn. Admin safe pause/retry vẫn qua ops_control_requests và domain service rechecks, không arbitrary workspace/procedure dispatch.

Các bản ghi quote_observations gắn workspace/holding/entitlement là dữ liệu tài chính riêng; chỉ instruments/gold_profiles không gắn owner mới thuộc danh mục thị trường. jobs/job_attempts/scheduler_state và Ops preview/idempotency là dữ liệu điều khiển hạn chế: admin không đọc trực tiếp lease token, preview token hoặc replay body. Mỗi process chỉ có quyền hẹp phục vụ đúng mục đích; Ops UI lấy projection đã loại các trường này. Phân loại bảng không thay thế grants theo cột/procedure cần thực thi.

Worker profile chỉ typed job/domain capability; Market chỉ quotes, Agent read/simulate/draft, ingestion approved receipt posting, retention bounded expiry. Narrow role containment không có nghĩa process compromise chỉ ảnh hưởng một tenant; thực tế grants/profile có thể phục vụ nhiều tenant. Engine nhận verified TxContext, không authenticate bằng request text hoặc tin role model trả ra. Full finance feature set giữ nguyên.

## 2. Network và TLS

Public inbound chỉ HTTPS user/admin origins và native endpoints; DB/internal worker/witness append control không public generic route. SSH/provisioning từ operator-approved network/key; no public PG5432, Docker socket hoặc unauth health diagnostics. TLS1.3 preferred, reviewed TLS1.2 interoperability nếu cần, không TLS1.0/1.1 hoặc disable validation; actual Android API support/cert rotation phải test. [RFC9325](https://www.rfc-editor.org/rfc/rfc9325.html). Private mTLS và body signature theo ARCH-06, không substitute bằng network address.

User/admin API không arbitrary outboundHTTP. DNS/proxy/firewall allowlist theo exact approved adapter destinations, reject loopback/private/link-local/metadata/redirect-chain abuse ở public-provider fetcher; operator-defined local model/private DB endpoint là explicit separate profile exception, không blanket “allow private IP”. Revalidate DNS/IP/redirect và cap response/time/bytes, không client-supplied URL/provider/model switch. TLS proxy termination nằm trong T1; access logs không ghi private URL/body/cookies.

## 3. Egress theo data class

| Profile | Được gửi khi đã duyệt | Bị cấm / gate |
| --- | --- | --- |
| licensed_market | Public instrument IDs/batched catalog/source auth, không owner/quantity/cost basis/account | License/automation/cache/redistribution ARCH-11; provider vẫn thấy tickers/IP |
| auth_mail | FinWeave email verification/reset code/link cho đúng mailbox; endpoint auth riêng | Không bank OTP/raw notification/finance/LLM; AUTH-MAIL-REAL chưa đạt |
| approved_inference | Minimum scoped aggregate/tool projection cần Plan–Goals/investigation, sau privacy/eval | External finance mặc định DENY; không passwords/bank raw/OTP/account refs/full ledger dumps; ARCH-12 |
| encrypted_backup | Encrypted repository objects, bounded operational manifest | Không plaintext dump/key capsule private recipient; destination/capacity chưa chọn |
| recovery_witness | Signed opaque deny metadata, target tokens, epoch/digests; no finance | Latest head độc lập, append-only; witness chưa provision |

Bank/wallet raw notification/SMS/email body và bank OTP chỉ được filter trong native memory; **FinWeave's own auth code/TOTP** được gửi đúng auth verifier/mail adapter theo protocol, không thuộc lệnh cấm làm auth không thể hoạt động. Default deny logs/LLM/debug vẫn áp dụng. External LLM không được tự nhận finance vì T1 cho backend plaintext; local inference là candidate chưa được enable/eval. Tool outputs minimized và schemaallowlisted, không model direct DB/network access.
