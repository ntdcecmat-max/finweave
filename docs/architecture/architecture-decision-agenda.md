> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **Execution local — 09/10/2026:** [FW-BE-FOUNDATION-001](../execution/backend-foundation-2026-10-09.md) bắt đầu implementation theo ARCH13: PostgreSQL16 disposable, migration runner và ledger seals/exact kernel. [Addendum revision001](../data/local-foundation/README.md) giải quyết physical journal/numeric/seal defects có runtime evidence. ARCH01–13 và các pins kế thừa giữ nguyên; chưa full DB005/API/backend/native/Agent acceptance.

# Chốt kiến trúc từ tổng thể đến chi tiết

ARCH-AGENDA-001 · 08/10/2026 · **ARCH-01 ACCEPTED A + T1; ARCH-02 ACCEPTED S1 + P2; ARCH-03 ACCEPTED I0 + I1; ARCH-04 ACCEPTED D1 + J2; ARCH-05 ACCEPTED CONTRACT DESIGN; ARCH-06 ACCEPTED IDENTITY DESIGN; ARCH-07 ACCEPTED SECURITY DESIGN; ARCH-08 ACCEPTED ENGINE/DOMAIN DESIGN; ARCH-09 ACCEPTED ASYNC/SYNC DESIGN; ARCH-10 ACCEPTED ANDROID DESIGN; ARCH-11 ACCEPTED SOURCE INTEGRATION DESIGN; ARCH-12 ACCEPTED AGENT RUNTIME DESIGN; ARCH-13 ACCEPTED OPERATIONS DESIGN**. Phạm vi đầy đủ đã được owner chọn; vòng này chốt cách thực hiện. AI chuẩn bị phương án có khuyến nghị, giải thích trade-off, mô hình hóa và cập nhật ADR/HLD/LLD. Không giao lại việc thiết kế kỹ thuật cho owner.

[Nghiên cứu và các lựa chọn ARCH-01](ARCH-01-options.md) đã có so sánh A/B/C, trust T1/T2/T3, ba luồng chính và nguồn chính thức; owner đã chọn **A + T1**; [ADR-008](adr/ADR-008-modular-backend-trusted-server.md), [HLD](high-level-design.md), [context](../requirements/context-model.md) và [views](views/architecture-views.md) ghi thiết kế hiện hành.

Đầu vào: [HLD](high-level-design.md), [LLD](low-level-design.md), [topology](deployment-topology.md), [schema](../data/physical/README.md), [quyết định vận hành](../handover/operational-decisions.md), [backlog](../product/backend-backlog.md). R1/r2 giữ nguyên; Oracle Always Free là hướng I1 đã chọn có điều kiện, chưa provision/account quota/security/chi phí thực/implementation.

[Nghiên cứu và lựa chọn ARCH-02](ARCH-02-options.md): so sánh S1 Fastify/TypeScript, S2 NestJS/Fastify, S3 Spring/Java; P1/P2 về API/worker processes. Owner đã chọn **S1 + P2**; [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [Stack](tech-stack.md), [module HLD](module-high-level-design.md) và HLD ghi ownership54 bảng, dependencies, atomic workflows và P2 capabilities; implementation/tests vẫn NOT RUN.

| ID / lớp | AI phải chuẩn bị | Quyết định/bằng chứng cần chốt | Hồ sơ kết quả |
| --- | --- | --- | --- |
| ARCH-01 Tổng thể — ACCEPTED A + T1 | Ba clients/API/Engine/workers/DB/providers; notification/price/Plan–Goals flows | Ranh giới trách nhiệm/trust; đủ mọi feature; một nguồn dữ liệu tài chính đúng | [HLD](high-level-design.md)/[context](../requirements/context-model.md)/[views](views/architecture-views.md)/[ADR-008](adr/ADR-008-modular-backend-trusted-server.md) |
| ARCH-02 Cấu trúc — ACCEPTED S1 + P2 | Fastify TypeScript modular backend; user/Ops API processes riêng, worker profiles/quyền riêng | Chốt logical ownership/dependencies/UnitOfWork; physical grants/runtime checks chưa chạy; không microservices | [Stack](tech-stack.md)/[module HLD](module-high-level-design.md)/[ADR-009](adr/ADR-009-fastify-and-isolated-processes.md) |
| ARCH-03 Infrastructure/platform — ACCEPTED I0 + I1 | Local + Oracle Always Free VM có điều kiện; private PG, P2 processes, host timer, HTTPS web/admin/APK, off-host backup | [Options](ARCH-03-options.md) giữ alternatives; quota/account/ARM64/sizing/DNS/TLS/backup/restore chưa kiểm; không auto paid fallback | [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md)/[Topology](deployment-topology.md)/[Environments](environment-matrix.md)/[Cost](../product/cost-model.md) |
| ARCH-04 Database — ACCEPTED D1 + J2 | Kế thừa54 bảng/610 cột; [target expand design](../data/target-t1/README.md)70 bảng/782 cột;17 findings có design disposition | D1 migrations004+ tiếp nối; J2 một dispatch authority, P2 roles/history/cache/recovery; SQL/RLS/upgrade/restore NOT RUN | [ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md), ERD/dictionary/migration plan/permissions/API overlay; giữ001–003 |
| ARCH-05 Contracts — ACCEPTED CONTRACT DESIGN | [Working API T1](../contracts/v2-t1/README.md),141 operations, fresh consumer/field mapping, paging/version/cache/replay/outcome/native credentials | Revision+hash pin, DeviceBearer không có quyền owner session, typed J2 tickets; runtime NOT RUN, auth storage/crypto ARCH-06 | [ADR-012](adr/ADR-012-unified-t1-contract-revision.md), [adapter/acceptance](../contracts/v2-t1/acceptance-plan.md) |
| ARCH-06 Identity/quyền — ACCEPTED DESIGN | Browser host-cookie/CSRF; native installation/owner refresh; collector-key renewal; admin TOTP; service mTLS+MAC | Purpose/replay/reauth/revoke/reset/storage chốt; implementation/crypto/mail/SQL/native NOT RUN | [Identity LLD](../security/identity/identity-access-design.md)/[147-operation matrix](../security/identity/operation-permissions.csv)/[ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md) |
| ARCH-07 Bảo vệ dữ liệu T1 — ACCEPTED DESIGN | [Threat model, khóa, phân quyền, logs, backup, witness, xóa dữ liệu](../security/t1/README.md); phân loại 84 bảng và 147 operations | 32 ca kiểm thử thực tế NOT RUN; API002 giữ nguyên; chưa bật dữ liệu thật; T1 tin root/DBA | [ADR-014](adr/ADR-014-t1-data-protection-and-recovery-witness.md), [schema bảo mật](../data/target-t1-security/README.md), [báo cáo thay đổi](ARCH-07-change-report.md) |
| ARCH-08 Engine/domain — ACCEPTED DESIGN | [Exact ledger/planning/quantity/calendar và full conditional forecast](../domain/README.md); API003151operations, DB00486bảng | Oracle độc lập và static checks tách runtime; Engine/SQL/concurrency/Monte Carlo/performance NOT RUN; không sửa frontend | [ADR-015](adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md), [domain LLD/cases](../domain/acceptance-plan.md), [change report](ARCH-08-change-report.md) |
| ARCH-09 Async/sync — ACCEPTED DESIGN | [J2 queue/lease/fence/retry/ACK/native replay/daily/manual prices/Agent/forecast/client sync](../async/README.md); API004153operations và DB00587bảng | 32 runtime cases NOT RUN; schema/model/hash checks khác implementation; consumers chưa migrate | [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [change report](ARCH-09-change-report.md), [acceptance](../async/acceptance-plan.md) |
| ARCH-10 Android — ACCEPTED DESIGN | Capacitor8/Kotlin/Room/Keystore/WorkManager; bridge2, scoped auth/outbox/ACK/clock; signed APK/update/distribution | 32 Android runtime cases NOT RUN; appId/origin/cert/device/source REAL gates unresolved | [Android](../android/README.md)/[ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md)/[report](ARCH-10-change-report.md) |
| ARCH-11 Sources — ACCEPTED INTEGRATION DESIGN | Versioned parser/binding/finality, market units/time/rights/quota, exact API004/DB005 mappings |32source cases NOT RUN; provider/app/device/entitlement real unverified, không auto activate |[Sources](../sources/README.md)/[ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md)/[report](ARCH-11-change-report.md) |
| ARCH-12 Agent — ACCEPTED RUNTIME DESIGN | Typed TS/J2/Engine,13capabilities, local model candidate, API005/native003/DB005 |32runtimecases +30publiceval/12regression NOT RUN; model disabled/pins/eval missing |[Agent](../agent/README.md)/[ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md)/[report](ARCH-12-change-report.md) |
| ARCH-13 Operations — ACCEPTED DESIGN | Local CI / maintenance release / config / migration / safe metrics / off-host recovery | OPS-01…32 runtime NOT RUN; RPO/RTO/capacity not measured; no real activation | [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md) / [report](ARCH-13-change-report.md) |

AI trình bày phương án tổng thể trước để thống nhất, sau đó xuống từng module: dữ liệu vào/ra, trạng thái, quyền, transaction, lỗi, recovery và tests. Kết luận từ [spikes](../testing/technical-spikes.md) cập nhật ADR trước khi khóa thiết kế bị ảnh hưởng. Mỗi quyết định ghi lựa chọn/lý do/bằng chứng/phần chưa đo/chi phí/hậu quả.

AI tự chốt chi tiết thường lệ trong hướng đã duyệt; owner quyết định trải nghiệm, thay yêu cầu bảo mật, trade-off recovery, tài khoản/nguồn riêng và ngân sách. Không hỏi lại quyền đã có. Hướng hiện hành: React/Vite user+admin, Capacitor/Kotlin; Fastify/TypeScript/P2/PostgreSQL/durable jobs; I0 local + I1 Oracle Always Free có điều kiện theo ADR-010. Exact versions/shape/region/DNS/TLS/backup destination/queue library còn cần kiểm; đây không là quyền mua cloud, gọi nguồn/model thật hoặc triển khai production.

## ARCH-10 — Android implementation handover

ARCH-10 ACCEPTED ANDROID DESIGN trong hướng Capacitor/Kotlin đã duyệt; OS/OEM/source/release support chưa đo. ARCH-11…13 REVIEW PENDING.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

ARCH-11 ACCEPTED SOURCE INTEGRATION DESIGN trong hướng đã duyệt; real provider/app/device/rights/quota còn gates. ARCH-12…13 REVIEW PENDING.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

ARCH-12 ACCEPTED AGENT RUNTIME DESIGN trong stack hiện hành; local Ollama/Qwen3-4B chỉ PoC candidate chưa pin/benchmark. ARCH-13 ACCEPTED OPERATIONS DESIGN.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

ARCH13 đã chốt thiết kế vận hành trong hướng đã duyệt. Các lớp01–13 sẵn hồ sơ để triển khai/thử rủi ro; chưa có nghiệm thu runtime/production.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
