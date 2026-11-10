# P2 — Database capability matrix

08/10/2026 · **ROLE DESIGN ONLY; GRANTS/NEGATIVE TESTS NOT RUN**. Supersedes cách sử dụng broad fw_app/fw_worker ở baseline cho target. Không sửa file role-provisioning.sql lịch sử; SQL migrations mới phải implement matrix này. Mỗi process dùng credential riêng; chia pool cùng process không thay process isolation đã chọn.

| Process/capability | Đọc | Ghi / EXECUTE | Bị cấm |
| --- | --- | --- | --- |
| User API — authenticated owner | Scoped finance/domain query ports, own session qua auth capability | Approved owner commands, preview/confirm; UnitOfWork context do server xác lập | DDL, admin auth/Ops credentials, arbitrary generic payload CRUD |
| Device ingress | Own enrollment/binding/status tối thiểu | Narrow accept receipt/enqueue với epoch/consent; enrollment/revoke theo owner auth flow | Query toàn sổ, direct posting, đổi owner bằng payload |
| Ops API auth process/pool | Admin principal/session/challenges/factor metadata | Narrow signin/step-up/revoke; protected credential refs | Customer identities/sessions/finance/prompt; raw MFA secrets trong business pool |
| Ops API business | Sanitized Ops tables/projections, allowed release/source/job metadata | ops_control_requests/ops_audit/replay bằng narrow commands | joins finance, raw jobs.domain_id/workspace payload lookup, impersonation |
| Scheduler/dispatcher | Minimum due/type/id/scope/fence, watermarks, safe control request | claim/enqueue/finalize metadata qua registered procedures | Finance payload/model prompt; generic SQL job creation từ admin input |
| Ingestion worker | Scoped receipt/binding/evidence/accounts via owner ports | Parse/review/post workflow chỉ khi policy cho phép, transactional replay/history | Other workspace, provider/Agent credentials, bypass revoked binding |
| Import worker | Scoped preview/rows/selection and needed account facts | Confirmed import workflow, atomic selected set, history/replay | Unconfirmed import into actual; batch partial financial effect |
| Market worker | Instrument/profile/entitlement và scoped holding identifiers/quote history | Quotes/refresh state/result; catalog updates only separate privileged catalog capability | Cash/posting/holding quantity/active Plans/Goals |
| Agent worker | Authorized frozen context/tool results/simulation | conversations/messages/run/tool evidence, Planning draft port | Ledger writes; active Plan/Goal/allocation/confirm; arbitrary SQL/network tools |
| Retention worker | Expiry/policy/pin metadata tối thiểu | Narrow expire cache/staging/redact payload procedures | Broad finance DELETE, workspace erasure, rewrite immutable posting/history |
| Recovery/erasure service | Authorized workspace/key/checkpoint metadata, trusted backup scope when required | Explicit audited revoke/erase/restore fencing workflow, off-host checkpoint | Reuse this capability in ordinary Ops/Agent/retention process |
| Migration runner | Catalog and checksum/journal | Controlled DDL/grants/backfill with maintenance gate | Expose migration secret to application or admin routes |
| Backup operator | Dedicated trusted consistent backup scope + role/config metadata | Backup off-host, restore into isolated target via controlled workflow | Treat RLS-filtered user dump as full backup; use app/Ops pool for backup |

Read permissions above are **logical query/owner ports**, not carte-blanche SELECT on all listed tables. Direct grants are table/column/procedure specific; code composition exposes only permitted ports. Default deny PUBLIC/schema/default privileges, NOBYPASSRLS/non-owner application roles; no runtime DDL/TRUNCATE/SET ROLE into stronger roles. Cross-workspace queue claim uses audited narrow SECURITY DEFINER with fixed search_path/qualified identifiers/revoked PUBLIC EXECUTE and validated registered worker identity; do not let client-supplied workspace establish authorization. Privileged owner should own only needed routines/objects, not unrelated financial schema.

Tenant tables use workspace-scoped RLS and composite FKs; global tables have explicit catalog/auth/control policies. Shared payload/history stores also enforce registered owner_module/object type through controlled mutation/query ports. RLS by itself does not enforce Agent draft-only; separate capabilities/grants do. Negative tests must try direct SQL as each real role, not only API requests. [RLS](https://www.postgresql.org/docs/16/ddl-rowsecurity.html), [SECURITY DEFINER](https://www.postgresql.org/docs/16/sql-createfunction.html).

T1 administrators of infrastructure can bypass app restrictions; this matrix does not reinstate anti-root-Ops. ARCH-06 chốt login/token/MFA implementation, ARCH-07 secrets/logging/recovery, ARCH-09 queue procedures. Full role DDL and exact grants must be reviewed and executed before backend acceptance.
