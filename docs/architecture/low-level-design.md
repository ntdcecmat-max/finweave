> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 hiện hành:** [Identity/session/permissions](../security/identity/identity-access-design.md), [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [API002](../contracts/v2-t1-r2/README.md), [identity DB delta](../data/target-t1-auth/README.md). Auth design supersede follow-up ARCH-06 trước đây; implementation/crypto/SQL/mail/native/security vẫn NOT RUN. API001 và DB D1/J2 giữ lịch sử, không overwrite.

# FinWeave — Low-Level Design v0.9

08/10/2026 · A + T1 / S1 + P2 / I0 + I1 alignment; thuật toán chi tiết kế thừa ngày07/10, ARCH-04 đã chọn D1 + J2, ARCH-05/06 đã có design; tiếp ARCH-07…13. [Stack](tech-stack.md), [module HLD](module-high-level-design.md), [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [topology](deployment-topology.md). Target specification only; quota/resources/SQL/runtime chưa kiểm. [HLD](high-level-design.md), [data](../data/logical-data-model.md), [API](../contracts/operational-api-spec.md). [LLD cũ](../governance/baselines/pre-realignment-2026-10-07/docs/architecture/low-level-design.md) giữ thuật toán M2/BR; module ở đây chưa có backend implementation.

## 1. Atomic command và ownership

S1 UnitOfWork lấy một checked-out pg client và TxContext dùng chung cho mọi owner service/repository trong transaction; actor/workspace transaction-scoped, không pool session state rò sang caller khác. Không pool.query riêng rẽ, nested independent commit hoặc direct write bảng module khác. Public owner services phối hợp bởi application workflow; Ledger không import Planning/Review/Agent. Same client không tự đủ chống races: lock anchors/order và bounded whole-transaction retry phải được kiểm trên DB.

P2 user/device API và Ops API processes riêng; Ops chỉ Ops pool/capabilities, không finance credentials. Worker profiles khác quyền chạy process riêng; Agent chỉ read/simulate/draft, không posting/active-plan-confirm grants hoặc tools. [Target permission matrix](../data/target-t1/permissions.md) của ARCH-04 đã có; SQL roles/procedures cần implement và kiểm ARCH-06/09 trước claim isolation đã implement.

Authenticate → authorize workspace/object/device → validate typed DTO → lookup idempotency (operation+workspace+key, digest của semantic payload) → validate expected versions/preview owner+digest+expiry → domain validation → transaction commit effects+audit+outbox+replay result → ACK. Retry committed key trả prior result trước stale version check; same key different payload409. Xung đột mới phải re-preview, không tự tăng version rồi retry.

Tenant ID/client role/prompt chỉ là input, không quyền. Admin không dùng user finance services. Owner đã chọn A + T1 tại [ADR-008](adr/ADR-008-modular-backend-trusted-server.md): authorization/parse/matching/Engine chạy trong trusted backend; conventional SQL storage được phép thiết kế cho T1. Backend/DBA có khả năng đọc finance; app-admin không có finance grants. Real data vẫn chờ SEC-REAL-T1/runtime evidence, không được bật bằng sửa docs.

## 2. Android receipt và domain dedupe

Native tạo eventId cố định tại capture, deviceId, source package, notification key/revision, observedAt, sourceTxnRef nếu có, parserVersion và normalized minimum evidence. Keystore mã hóa queue. Listener không chờ JS hoặc HTTP; WorkManager upload batch≤50/256KiB (mục tiêu thiết kế), account binding thuộc cùng owner.

Unique(workspaceId,deviceId,eventId) là transport identity. Backend lưu receipt bền trước202; parse/post có status riêng. Device giữ tới ACK; 401 cần reauth,403 revoked dừng,413 split batch,429 retryAfter,5xx/network exponential backoff+jitter. Lỗi item không hợp lệ được quarantine, không silent drop hoặc làm cả queue kẹt vô hạn.

Mẫu có sourceTxnRef đáng tin: unique theo source account+reference+revision. Không có reference: cùng notification key/revision dùng để nối evidence trên một device; cross-device/CSV so account,direction,currency,amount,time/reference nhưng ambiguous phải Review. Hai giao dịch bằng nhau vẫn có thể là hai event thật. Repeated notification update không tự correction posted amount; tạo revision case. Transfer phải xác nhận hai accounts thuộc user, hai legs cân bằng, fee riêng.

## 3. Jobs và giá

Daily key=(source,entitlementScope,businessDate,scheduled); manual key có cooldown bucket, coalesce với compatible in-flight job. Một lease có expiry; worker claim bằng atomic row lock, crash lease expire rồi retry. Provider request có timeout/budget; attempts hữu hạn, cuối failed/partial+retryAfter. Không giữ một DB transaction mở qua network call.

Dữ liệu giá validate positive finite decimal, instrument/profile/side/currency/unit, quoteAsOf không tương lai bất hợp lý. Cùng quote fingerprint không tạo dữ liệu lịch sử giả; lastAttempt/success vẫn cập nhật độc lập. Provider fail không xóa last-good. VND/share, VND/chỉ canonical; lượng÷10 cho giá mỗi chỉ, quantity lượng×10. Valuation round-half-up mỗi holding, không float. Không dùng quoteAsOf>reportAsOf cho báo cáo lịch sử.

## 4. Snapshot và sync

Client foreground poll version20s (design default), stop background; refresh-on-focus/network-restored/mutation. Khi version đổi fetch snapshot nhất quán; incoming older version bị loại. API trả version/asOf/sourceQuality/coverage; pending ingest không cộng vào posted report. Admin operational version và chat/draft version không tự tăng financial workspaceVersion.

Backend cold-start không biến timeout thành mutation failure chắc chắn; giữ key/input và truy job/receipt. Client pending state trước ACK có thể hiển thị “chờ gửi”, không optimistic cộng số tiền thật.

## 5. Agent và planning drafts

Mỗi run gắn owner/workspace, frozen baseSnapshot, user intent, constraints, status, step budget/deadline và sanitized tool evidence. Planner bước sau phụ thuộc kết quả đã validate; tool registry không cho SQL/network tùy ý hay confirm command. Notification/provider text là untrusted data.

Draft gồm GoalDraft(s), PlanDraft/items, goal-item links, assumptions, constraints, snapshotVersion, plan/goal versions, simulation result refs. Draft không là active Goal/allocation. Proposal tool chỉ lưu draft; user confirmation riêng sinh previewToken ràng buộc toàn bundle. Commit plan+goals+links+audit+idempotency trong một transaction, recheck allocations across all goals. Actual ledger không thay đổi. Nếu user chỉ muốn một Goal, plan draft có thể omitted; nếu plan tổng thể không có Goal, links rỗng hợp lệ.

Agent không tự tăng target/hạn/giảm reserve khi gặp infeasible: giải thích, đề xuất alternatives rồi hỏi. Theo dõi actual variance dùng Engine/rules; Agent chỉ investigation/replan khi user yêu cầu hoặc trigger đã opt-in. Draft cũ/stale yêu cầu simulate và preview lại. Cancel run không commit, confirm concurrent cancel xử lý theo trạng thái server không suy từ UI.

## 6. Giữ invariant cũ

Opening tách income; transfer trong scope không expense; refund theo ngày nhận; posted correction dùng reversal/replacement; category override giữ qua reimport; count variance không tự expense. Goals earmark không thêm tài sản; tổng allocation kiểm trên cash hiện có, planned income không funded. Simulation/history giữ frozen refs, không actual write. LLD v0.1/BR-01…36 vẫn là nguồn regression cho chi tiết chưa thay đổi.

## 7. D1 + J2 — ràng buộc implementation

[Target invariants](../data/target-t1/invariants-and-workflows.md) supersede cách hiểu lease nằm riêng mỗi domain ở mục3: một J2 jobs layer claim/retry/fence, domain refresh/receipt/import/Agent records chỉ lifecycle nghiệp vụ. Domain+enqueue và effect+history+replay là atomic boundaries; finalize kiểm generation/token/epoch cùng current consent. Scheduler watermarks/catch-up không dựa browser.

Posting service khóa group và seal trước commit; append cân bằng vào group cũ vẫn phải denied. Planning actual link dùng frozen revision identity+item version, không bare plan_version. Snapshot facts refs bất biến, projection_cache có TTL/key theo scope/asOf/versions/Engine; payload purge không xóa pinned history/dedupe identities. [Migration plan](../data/target-t1/migration-plan.md) mô tả004+ và tests cần chạy; SQL files/grants/procedure implementation chưa có. [ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md).

## 8. Contract/context/replay delta ARCH-05

Mục ARCH-05 này ghi [API revision001](../contracts/v2-t1/README.md); target hiện hành là [revision002](../contracts/v2-t1-r2/README.md) và auth LLD ARCH-06 bên dưới. Identity/admin/global services có context null; tenant worker bắt buộc workspaceId để resolve composite keys. OwnerBearer khác DeviceBearer; refresh credential chỉ dùng renewal. Admin auth không dùng customer sessions. Current auth/revoke kiểm trước replay lookup; committed replay kiểm trước versions/preview freshness. Khi response body hết hạn: REPLAY_EXPIRED với outcome=committed/ref, không re-execute. Committed của command202 chưa có nghĩa job hoàn thành.

Typed J2 ticket có dispatchJobId/generation/leaseToken/recoveryEpoch và domain ID; service capability được kiểm lại. Receipt ACK có durable/rejected union và epochs; restore reconciliation không bảo đảm zero loss. [Semantics](../contracts/v2-t1/semantics.md), [storage follow-up](../contracts/v2-t1/db-contract-delta.md), [ADR-012](adr/ADR-012-unified-t1-contract-revision.md). Auth/crypto/DB/Fastify/consumer tests NOT RUN.

## ARCH-06 — Auth LLD đã cụ thể hóa

[Identity LLD](../security/identity/identity-access-design.md) định nghĩa transcript ES256/SPKI/raw signature, browserCSRF, native refresh consumed-token exact-replay exception, collector rotation24h trong authorization30days, admin TOTP counter lock và service signature nonce. [DB migration plan](../data/target-t1-auth/migration-plan.md) định nghĩa expand/backfill/revoke/cutover/index/grants; chưa có executable004+.

Authorization trước domain replay/versions; owner subject/workspace/nested refs được server resolve. Credential issuer transactions dùng auth_replays/ops_auth_replays encrypted5min, không generic90day result. Interface147operations hiện hành tại API002; consumer source chưa migrate.

## ARCH-07 — Đặc tả bảo mật và schema tiếp nối

[Protocol backup/restore/xóa](../security/t1/backup-restore-erasure.md) quy định chữ ký Ed25519, receipt/hash chain của witness, head gắn nonce mới và các trạng thái prepared → anchored → applied. recovery_control_epoch độc lập với auth/device/domain epochs. Target token ngẫu nhiên được giữ ổn định để đối chiếu khi restore; không suy ra target từ email. ACK nằm trong delivery state riêng, không sửa journal append-only.

[Migration và quyền](../data/target-t1-security/migration-plan.md) bổ sung 2 bảng và 12 trường vào các bảng hiện có: chặn workspace, yêu cầu reset sau restore, theo dõi publication và xóa parent/child. Không FK tới owner đã xóa; parent/child phải đúng loại, không chu trình và giữ nguyên deadline ban đầu. SQL/grants chưa được thực thi.

[Phụ lục API](../security/t1/contract-storage-delta.md) giữ nguyên API002. Retry lệnh thu hồi chỉ được hoàn tất đúng lệnh gốc, không cấp lại quyền tài chính. Reset chờ witness phải giữ identity bị chặn; hoàn tất muộn không được bỏ qua lệnh thu hồi/xóa mới hơn. Chữ ký, network, backup, prune và restore thực tế đều NOT RUN.

## ARCH-08 — Engine/domain LLD

Các port thuần: validateCanonicalInput, buildPostingEffects, reverseAndReplace, replayHoldingMovements, valuePortfolio, buildPlanOccurrences, matchActualLineage, fundGoals, assessGoal, simulateGoal và computeForecastChunk. Đây là design interfaces, chưa có production functions. [Precision/calendar/snapshot](../domain/precision-calendar-snapshots.md), [Ledger/portfolio](../domain/ledger-and-portfolio.md), [Plan–Goals](../domain/planning-and-goals.md), [forecast](../domain/forecast-model.md).

[Transaction protocol](../domain/transactions-and-concurrency.md): short READ COMMITTED writes với workspace anchor và stable lock order; REPEATABLE READ snapshot closure; effect/history/version/replay/enqueue atomic, không network trong lock. Forecast chunks tính ngoài transaction, live J2 fence khi checkpoint/publish; cancelled/incomplete paths không xuất probability. [API003](../contracts/v2-t1-r3/README.md), [DB004 migration/grants](../data/target-t1-domain/migration-plan.md); SQL/Engine/worker/concurrency chưa chạy.

## ARCH-09 — Async LLD

Claim workspace access/recovery anchor trước job lock; DB wall-clock sau lock, live ticket và bounded heartbeat/deadline. Effect+processed/history/replay atomic, queue ACK sau domain commit; retry floor/cycles không reset counters. Native ACK pairing/dedupe/restore và query side-effect-free theo hồ sơ async.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Local eight-table model, AEAD scope/AAD/nonce reservation, current-generation fences, bounded immutable upload batches/ACK replay, trusted-clock expiry, no destructive migration. Native not implemented.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Source registry/profile/rights snapshots versioned, private metadata schemas; scaled VND/sourceUnit stored, exact canonical valuation trong Engine. Missing time/finality/unit reject new quote, last-good giữ nguyên. API no lifecycle field, không fabricate.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Server single decision, exact schemas/scope/intent/live fences; journal action reservation→unknown→observed, draft/result/checkpoint same UoW, budget cộng dồn/cancel CAS. Grounded rendering từ numeric refs, không model free financial prose.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Deploy lock, maintenance, drain và worker fence bảo vệ lúc nâng cấp. Migrator dùng PG advisory lock và journal/phase catalog. Rollback phải tương thích; không rewind DB hoặc reset attempts/budgets.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
