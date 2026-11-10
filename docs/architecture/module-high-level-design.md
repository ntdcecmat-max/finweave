> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 hiện hành:** [Identity/session/permissions](../security/identity/identity-access-design.md), [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [API002](../contracts/v2-t1-r2/README.md), [identity DB delta](../data/target-t1-auth/README.md). Auth design supersede follow-up ARCH-06 trước đây; implementation/crypto/SQL/mail/native/security vẫn NOT RUN. API001 và DB D1/J2 giữ lịch sử, không overwrite.

# FinWeave — Module High-Level Design v1.1

ARC-MOD-001 · 08/10/2026 · **ARCH-02 ACCEPTED: S1 + P2; ARCH-04 ACCEPTED: D1 + J2** · design only. [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [Stack](tech-stack.md), [HLD](high-level-design.md), [LLD](low-level-design.md), [backlog](../product/backend-backlog.md).

## 1. Consistency và ownership

Một backend codebase, một canonical ledger mỗi workspace, PostgreSQL consistency boundary cho các cập nhật cần atomic. Hai HTTP processes và worker profiles dùng cùng versioned domain/Engine code; đây không là microservices/domain DB riêng. App-admin và Agent không có authority actual writes; trusted infrastructure T1 vẫn có khả năng đọc finance.

12 business modules, Financial Engine và shared transaction infrastructure. Bảng dưới chốt logical ownership của **54 bảng hiện có** để triển khai; không tự chứng nhận physical schema đủ hoặc SQL grants đã áp dụng.

| Module / nhóm | Bảng logical owner | Ranh giới nghiệp vụ / backlog |
| --- | --- | --- |
| Identity & Access | identities, workspaces, sessions, identity_challenges, devices | BE-01; register/auth/membership/enrollment/revoke; app-admin auth dùng identity primitives nhưng tách authority |
| Accounts | accounts | BE-03; tài khoản/opening configuration/archive/settings; actual effects qua Ledger |
| Ledger | ledger_accounts, events, entry_groups, posting_lines, cash_observations | BE-04; posting/balancing/transfer/refund/correction/count; không import Agent/Planning |
| Portfolio | holdings, holding_movements | BE-06; declarations/quantity/cost/history; investment actual workflow phối hợp Ledger |
| Market | instruments, gold_profiles, provider_entitlements, quote_observations, refresh_jobs | BE-06/07; catalog/gold compatibility/FX/quotes; không ghi cash/quantity |
| Ingestion & Connections | sources, evidence, event_evidence, source_records, collector_bindings, ingestion_receipts, receipt_evidence, coverage_gaps | BE-08; consent/source binding/receipt/parse/evidence; dùng Identity device checks, không tự đổi owner |
| Imports | import_previews, import_jobs | BE-09; CSV staging/mapping/preview/selection/confirm; normalized data vào ingestion/domain workflow |
| Review | reviews | BE-10; cases/decision lifecycle; actual resolution gọi Ledger, không ghi bảng Ledger trực tiếp |
| Planning | financial_plans, plan_items, actual_links, goals, plan_goal_links, goal_allocations, simulations, planning_drafts | BE-11/12/13/15; Plan/Goal chung consistency boundary, linked draft/allocations; read actual, không write actual |
| Read Models | snapshots | BE-05; consistent projections cho Home/report/insights/drill-down; không tự tạo finance events |
| Assistant | conversations, messages, agent_runs, tool_results | BE-14/15; Q&A/context/history/mascot/run orchestration; planning draft ghi qua Planning public draft API |
| Ops | ops_accounts, ops_sources, ops_jobs, ops_quotas, ops_releases, ops_incidents, ops_previews, ops_idempotency, ops_audit | BE-16; sanitized metadata/auth lifecycle/safe commands, không join finance cho admin |
| Shared transaction infrastructure | version_history, proposal_previews, idempotency_records | BE-02/17/18; domain owner quyết định payload/policy; không generic public CRUD xuyên modules |

Owner services kiểm business invariants và writes; module khác không import private repository hoặc tự UPDATE bảng của owner. Read-model queries/joins xuyên module chỉ qua query layer đã authorize với consistent snapshot/version refs; không cấm mọi join và không dùng ORM entities làm public API.

Shared history/preview/replay do infrastructure lưu nhưng domain owner quyết định payload, version, actor/scope và permissions. Không expose generic CRUD cho shared tables. Ops có authority/auth records riêng; reuse identity primitives không có nghĩa Ops đọc sessions/workspaces/finance của user.

54 bảng là baseline ownership; [target D1 + J2](../data/target-t1/README.md) bổ sung16 structures theo bảng cuối tài liệu. Physical baseline giữ nguyên; target permissions/retention/recovery cần SQL implementation và ARCH-06/07/09 checks.

## 2. Public interfaces và dependency rules

| Caller | Interfaces được dùng | Không được làm |
| --- | --- | --- |
| User/device routes | Authorized application use cases: accounts/ledger/portfolio/intake/Review/planning/chat/read models | Tin role/workspace/client amount calculation thay validation, SQL trực tiếp trong route |
| Ingestion/Imports/Review workflows | Device/source checks, normalized evidence, Ledger/Portfolio owner mutation ports trong UnitOfWork | Import parser/Review ngược vào Ledger; bypass preview/owner decision của case yêu cầu xác nhận |
| Planning | Authorized financial facts readers + Financial Engine; own draft/preview/confirm services | Import Assistant hoặc ghi actual ledger; planned income thành available funding |
| Assistant/Agent | Authorized facts, Engine simulation, Planning draft API, own conversations/runs/results | Confirmation/posting/correction tools, raw SQL/arbitrary HTTP, tự cấp scope hoặc tự confirm |
| Market worker | Licensed adapter, quote validation/persistence và projection invalidation | Đổi holdings quantity/cash/income hoặc đưa private positions tới feed không cần thiết |
| Ops API | Ops-only queries/DTOs/safe preview/confirm/control requests | Finance joins/exports/payloads, owner impersonation, truyền financial mutation command |
| Read Models | Approved module readers/projection SQL và Engine | Tạo source events, suy số dư từ một trang giao dịch hoặc ghép state khác version |

Dependency hướng từ entrypoints/adapters/workflows đến public module services, domain/Engine và infrastructure ports. Domain/Engine không import Fastify, React, DB connection, fixtures, mocks hoặc model SDK. Infrastructure adapters implement interfaces; composition roots nối dependencies rõ, không global service locator chứa mọi quyền.

Application coordinator sở hữu cross-module workflow; Ledger không import Planning/Review/Assistant, Planning không import Agent. Agent gọi Planning draft interface, không ngược lại. Shared authorized query interfaces tránh vòng phụ thuộc giữa Planning và Read Models. Public exports/import-boundary checks và no-cycles ở CI; module folders/Fastify plugin scopes không tự enforce các quy tắc đó.

## 3. Process capability boundary P2

| Process/profile | Quyền dữ liệu cần thiết | Không cấp |
| --- | --- | --- |
| User/device API | Finance use cases dưới owner/device/workspace authorization; owner preview/confirmation; receipts/jobs cần thiết | DDL/schema ownership, Ops admin credentials, model tự confirm |
| Ops API | Ops auth/MFA/metadata/audit/preview/replay và restricted safe-control requests | Finance pool/credentials/grants, private jobs/prompt/evidence, owner sessions/impersonation |
| Ingestion/import worker | Authorized intake/source/receipt/Review và domain posting procedures/effects đúng nhiệm vụ | Agent tool expansion, owner planning confirmation, DDL |
| Market worker | Catalog/entitlement/quotes/refresh state, projection invalidation cần thiết | Ledger posting/holding quantity writes; external model credentials |
| Agent worker | Conversations/runs/results, authorized finance readers, Engine và Planning draft-only persistence | Ledger mutation, active Plan/Goal confirmation, broad history/preview/replay writes để bypass rules |
| Retention worker | Narrow retention/erasure procedures theo policy đã duyệt | Generic unrestricted delete trên posted ledger/history, bypass owner erasure authorization |
| Migration runner | DDL/role provisioning/migration journal cho environment được chọn | Public endpoint, chạy credentials migration trong API/worker |

Bảng là capability design, **grants/procedures SQL và negative tests chưa được triển khai**. Quyền ghi hẹp trên bảng shared có thể cần narrow procedure/guards; không cấp generic grants rồi claim Agent draft-only. Profiles khác privilege chạy process riêng, không chung process giữ tất cả credentials và chỉ branch bằng profile string.

Ops safe-control path dùng operational IDs/typed actions (retry/disable được phép), không private job payload hoặc arbitrary operation ID. Worker service identity translate/validate state/quota/consent/lease trước thao tác; retry không bypass owner confirmation, revoke hoặc semantic dedupe. Không vòng HTTP qua API công khai để reuse domain; dùng application services cùng code, DB roles riêng.

Bootstrap fail closed nếu thiếu profile/credentials hoặc cấu hình nhầm user/Ops pool. Mỗi process có bounded pool, graceful shutdown/drain, job payload/version compatibility khi rollout. Tổng connections tính theo số processes × replicas × pool size, phải đo trước khi chọn platform; không assume mỗi process free RAM hoặc worker host có sẵn.

## 4. Transaction ownership và atomic workflows

UnitOfWork lấy một checked-out PG client, BEGIN, gắn actor/workspace theo transaction, phối hợp owner services, COMMIT/ROLLBACK, release. Truyền opaque TxContext; adapters/repositories map sang cùng client. Không `pool.query` rời rạc cho câu lệnh thuộc transaction, không nested independent commit, không service tự mở transaction khác khi workflow đã có.

| Workflow | Bundle atomic |
| --- | --- |
| Posting/transfer/refund/correction/investment | Locks/domain checks, balanced Ledger effects, related Portfolio/evidence links nếu cần, history/versions/replay; reversal+replacement cùng commit |
| Owner confirm linked Plan–Goal draft | Owner/preview/digest/expiry/versions/current cash checks, Plans/Goals/items/links/allocations/history/preview consumption/replay; **actual ledger không đổi** |
| Receive notification | Fixed event identity+digest, normalized receipt và durable dispatch state; ACK sau commit, không chờ posting |
| Worker complete financial effect | Lease/binding fence, domain effect+processed/dedupe marker/result atomic; queue cleanup có thể retry, không duplicate effect |

Provider/model calls và clarification không nằm trong transaction mở lâu. Simulation dài dùng frozen/versioned authorized facts; confirm revalidate current state. Job delivery có thể lặp; idempotency/constraints/locks bảo đảm effect theo domain, không hứa exactly-once delivery.

Lock order và anchor chung phải áp dụng cho mọi writer của cùng invariant, kể cả lần tạo allocation đầu khi chưa có rows để lock. Bounded retry toàn transaction cho serialization/deadlock; không retry external effects hoặc bỏ stale preview. Existing committed replay được xét trước version stale, cùng key khác semantic digest trả conflict. Actual chi tiêu không bị cấm chỉ vì Goals đã phân bổ cash; Goal shortfall phản ánh state mới.

Read snapshots lấy consistent database snapshot + relevant versions; asynchronous projections phải giữ label/version/lag đúng, không ghép data cũ/mới thành một financial snapshot giả. Concurrency/invariants/restore cần independent DB oracle ở ARCH-04/08; thiết kế transaction không là test PASS.

## 5. Cấu trúc source và phạm vi đầy đủ

Backend riêng trong cùng repository, chưa tạo thư mục hoặc package runtime:

```text
finweave-backend/
  src/entrypoints/       user-api, ops-api, worker, migrate
  src/modules/          identity, accounts, ledger, portfolio, market,
                        ingestion, imports, review, planning, read-models,
                        assistant, ops
  src/engine/           pure financial calculations
  src/workflows/        atomic cross-module coordinators
  src/platform/         UnitOfWork, jobs ports, auth primitives, telemetry
  src/adapters/         HTTP, SQL repositories, price/model providers
  src/contracts/        generated canonical wire types and validators
  tests/                domain, DB, contracts, concurrency, authorization
```

Mỗi module có public application interface và private domain/persistence. Routes/worker handlers gọi cùng use cases, tests không cần khởi động HTTP để kiểm arithmetic/domain. Reuse frontend arithmetic sau review/parity/oracle, không import Store/mocks/commands vào backend.

| Backlog REQUIRED | Nơi thực hiện |
| --- | --- |
| BE-01/02/03/04/05 | Identity/platform/accounts/ledger/read models/Engine |
| BE-06/07 | Portfolio/Market/price worker |
| BE-08/09/10 | Ingestion/connections/imports/Review và native intake |
| BE-11/12/13 | Planning chung Plan–Goal consistency boundary/Engine/simulation |
| BE-14/15 | Assistant/orchestration và Planning draft services |
| BE-16/17/18 | Ops/process profiles/Jobs port/T1 security/backup/recovery |
| BE-19/20/21 | Client/native adapters/APK/integration/release/operations; không tạo module backend giả cho local interactions |

Giữ cả Q&A/chat/history/mascot, manual planning, multi-goal/plan-only, notifications/CSV/Review, stock/gold, daily/manual refresh và admin. Mapping ownership không là endpoint/runtime coverage. ARCH-03 chọn I0 local + I1 Oracle Always Free VM có điều kiện theo [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md); P2/PG cùng host nếu đủ tài nguyên, không auto paid fallback. Exact versions, SQL grants/new tables, jobs implementation, auth/reset, providers/model, deploy/restore evidence tiếp tục ARCH-05…13. [Spikes](../testing/technical-spikes.md) còn SPECIFIED/NOT RUN.

## 6. Ownership bổ sung D1 + J2

| Owner | Target structures mới | Giới hạn |
| --- | --- | --- |
| SharedJobs | jobs, job_attempts, scheduler_state | Infrastructure authority, per-profile scoped ports; không financial payload |
| Planning | planning_scopes, planning_revisions, planning_revision_items | Stable plan/standalone identity, immutable revisions; không actual writes |
| Read Models | projection_cache | Rebuildable TTL cache, pinned snapshot/history vẫn giữ |
| Imports | import_rows | Staging theo row, selected-set atomic |
| OpsIdentity (Identity primitives, Ops authority riêng) | admin_principals, admin_sessions, admin_mfa_factors, admin_challenges | Customer auth không quyền admin; Ops business không đọc credential material |
| Shared transaction infrastructure | payload_objects | Domain owner quyết policy; không generic CRUD xuyên module |
| Recovery capability | recovery_journal | Dedicated privileged workflow; off-host checkpoint, không ordinary Ops grants |
| Ops | ops_control_requests | Safe allowlisted commands; dispatcher rechecks domain preconditions |
| Migration runner | migration_journal | Runner-only DDL/history, không runtime grants |

Đây là infrastructure subcomponents, không thêm microservices hoặc domain DB riêng. [Permissions](../data/target-t1/permissions.md), [migration plan](../data/target-t1/migration-plan.md), [ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md) chốt interfaces/ownership. Queue domain record và jobs authority khác nhau; legacy lease fields contract sau cutover.

## ARCH-06 — Ownership extension

[Identity DB package](../data/target-t1-auth/README.md) kế thừa ownership70-table D1/J2, target82tables. Identity giữ auth_client_instances/session_credentials/auth_replays/auth_rate_buckets/recovery_codes/native+collector nonces; OpsIdentity giữ admin credentials/sessions/factors và ops_auth_replays/ops_auth_rate_buckets riêng. PlatformSecurity giữ service registry/nonces; IdentityAudit writer chỉ safe metadata. Các module domain chỉ nhận verified actor/capability và narrow current-epoch decision, không nhận password/seed/replay bodies. Tham chiếu API persistenceTables không cấp SELECT hoặc cross-module write grant.

## ARCH-07 — Quyền sở hữu recovery và xóa dữ liệu

Recovery sở hữu recovery_delivery_state và erasure_requests cùng protocol target token/control epoch. Hai bảng mới chỉ theo dõi điều khiển, không tạo dispatcher tài chính ngoài J2. Target hiện hành có 84 bảng / 960 cột; SQL/grants/functions chưa thực thi.

Retention thông thường không được xóa active ledger/history hoặc deny checkpoint. Profile xóa riêng, được owner cho phép, gọi procedure hẹp có kiểm tra dependency. Ops chỉ nhận tổng số đang chờ và mã lỗi an toàn; không đọc target token, event body, lease/preview token, replay body hoặc tài chính người dùng.

## ARCH-08 — Domain ownership tiếp nối

Ledger sở hữu sealed posting/correction/clearing; Portfolio sở hữu quantity và valuation inputs; Planning sở hữu Plan/Goal/funding/forecast_runs/forecast_result_pages. Shared Engine tính thuần, không own repository/auth/network. Snapshot query coordinator resolve toàn dependency closure qua authorized ports.

ForecastWorker chỉ có frozen input/checkpoint/result procedures và live typed J2 capability; không Agent tools, live ledger SELECT rộng, active Plan/Goal confirm hoặc actual posting. jobs giữ dispatch/lease authority; runs giữ computation lifecycle. [Full target86bảng](../data/target-t1-domain/README.md), [permissions151](../domain/operation-permissions.csv), [ADR-015](adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md). Ownership không tự chứng minh grants đã enforce.

## ARCH-09 — Ownership và worker ports

SharedJobs owns policy/deadline/lease/attempts; Market owns refresh input/checkpoint, MarketQuota narrow broker owns private shared quota buckets; Planning owns forecast input/result. AgentWorker giữ cả assistant_message local port và multi-step runs, không bỏ chat cũ. Ops chỉ sanitized projections/control requests, không read private quota/coverage.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Android separate first-party consumer, not P2 worker. Background token renewal uses collector key only, never owner refresh. Native broker denies admin/internal and arbitrary signing/network.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Market owns quote/profile/entitlement adapters; Ingestion owns support/bindings/source records; Engine owns posting/correction. Private entitlement registered payload Market, no genericCRUD/cross-module bypass.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Assistant owns messages/agent_runs/tool_results/private execution kinds; Planning owns planning_drafts/commit; AgentAdmission narrow Ops aggregate quota broker, no generic cross-module DB access. Worker calls local ports via ticket, không impersonate owner HTTP.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Journal/maintenance infrastructure cần inventory và DDL riêng ngoài87 bảng domain. Ops API không có quyền finance/DDL/deploy/restore/prune. Denial, witness và deadline erase vẫn hoạt động khi bảo trì.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
