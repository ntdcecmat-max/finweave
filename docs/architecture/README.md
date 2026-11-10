> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 hiện hành:** [Identity/session/permissions](../security/identity/identity-access-design.md), [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [API002](../contracts/v2-t1-r2/README.md), [identity DB delta](../data/target-t1-auth/README.md). Auth design supersede follow-up ARCH-06 trước đây; implementation/crypto/SQL/mail/native/security vẫn NOT RUN. API001 và DB D1/J2 giữ lịch sử, không overwrite.

> **ARCH-05 retained API revision:** [API T1/D1/J2 revision FW-API-T1-D1J2-001](../contracts/v2-t1/README.md), [ADR-012](adr/ADR-012-unified-t1-contract-revision.md), [change report](ARCH-05-change-report.md).141 operations, revision/hash pin bắt buộc; canonical v2/r1/r2 giữ lịch sử. Contract design accepted theo ủy quyền kỹ thuật, backend/consumer/native/security NOT RUN; tiếp ARCH-06.

# Kiến trúc hiện hành — A + T1 / S1 + P2 / I0 + I1 / D1 + J2

08/10/2026 · **ACCEPTED BY OWNER, design chưa implementation**. [Quyết định/options](ARCH-01-options.md), [ADR-008](adr/ADR-008-modular-backend-trusted-server.md), [HLD v0.9](high-level-design.md), [context v3](../requirements/context-model.md), [views v0.9](views/architecture-views.md), [agenda ARCH-08…13](architecture-decision-agenda.md), [security T1](../security/security-design.md).

**ARCH-02 ACCEPTED S1 + P2:** [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [Stack hiện hành](tech-stack.md), [module HLD](module-high-level-design.md), [nghiên cứu ARCH-02](ARCH-02-options.md). Fastify/TypeScript/shared Engine, user/device API và Ops API processes riêng, workers theo profile/quyền; ownership đủ54 bảng hiện có. Trusted server/runtime/DBA có khả năng đọc finance; app-admin chỉ metadata. T1 thay anti-Ops target cũ, không tự bật real data, transport, vendor hoặc ngân sách. API v2/schema artifacts và r1/r2 giữ nguyên; migrations/backend/native/security/UAT chưa nghiệm thu.

**ARCH-03 ACCEPTED I0 + I1:** [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [topology v0.4](deployment-topology.md), [environment matrix](environment-matrix.md), [cost v4](../product/cost-model.md) và [options giữ alternatives](ARCH-03-options.md). Local cho phát triển, Oracle Always Free VM cho synthetic pilot có điều kiện; P2/PG cùng host, host timer enqueue, HTTPS static web/admin/APK, off-host backup. Account/quota/ARM64/DNS/TLS/sizing/backup/restore chưa kiểm; không tự paid fallback hoặc nhận real ready.

**ARCH-04 ACCEPTED D1 + J2:** [ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md), [target DB package](../data/target-t1/README.md), [change report](ARCH-04-change-report.md); baseline54 bảng/610 cột giữ nguyên, expand design70 bảng/782 cột,16 structures mới. Model/ERD/dictionary/migration plan/permissions/API overlay đã có;17 findings DESIGN SPECIFIED, SQL/upgrade/restore NOT RUN. [Options](ARCH-04-options.md) giữ alternatives.

## Nội dung lịch sử M1/M2 bên dưới

Các số lượng/schema/wiring/security blocker bên dưới là lịch sử ngày06–07/10, không override ADR-008/009 hoặc frontend acceptance r2. Đọc tài liệu hiện hành qua các link đầu trang.

> Bổ sung bàn giao08/10/2026: [index](../handover/README.md), [API v2 canonical](../contracts/v2/README.md), [physical schema](../data/physical/README.md), [quyết định vận hành](../handover/operational-decisions.md) và [validation](../handover/validation-report.md). Các tuyên bố chưa generated/chỉ logical hoặc mọi lựa chọn còn mở trong phần ngày07/10 là trạng thái lịch sử; frontend hiện có additive v2/admin mock nhưng chưa backend/native/security thật.

> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# Architecture package — current M2 frontend mock

ARC-PKG-001 · v0.3 ·06/10/2026. [ADR004](adr/ADR-004-stateful-mock-and-read-model.md) implements same-app network/read model; logical1.1.0 has70business+6identity/64baseschemas. [Integration Handover](../testing/integration-handover.md), [Acceptance](../testing/frontend-acceptance-report.md) and [current catalogue](../execution/evidence/step6-action-coverage.md) supersede wiring status below. Real transport/security integration remains BLOCKED_SECURITY_POC.

## Bước4 architecture baseline retained

# Bước 4 — kiến trúc/contract và giao diện hệ thống

ARC-PKG-001 · v0.1 · 06/10/2026 · chuẩn bị M2 trong cùng `finweave-web`. [Danh mục đầy đủ](../execution/evidence/step4-action-coverage.md), [Validation/Gate bước4](../execution/evidence/step4-validation-report.md).

| Deliverable | Nguồn hiện hành |
|---|---|
| HLD | [high-level-design.md](high-level-design.md) |
| Architecture Views | [views/architecture-views.md](views/architecture-views.md),5views |
| ADRs | [ADR-001 frontend kế thừa](adr/ADR-001-frontend.md), [ADR-002 reuse/contracts](adr/ADR-002-contracts-and-m2-reuse.md), [ADR-003 protectedboundary](adr/ADR-003-privacy-boundary.md) |
| LLD | [low-level-design.md](low-level-design.md), pipeline/query/cache/guard/import/job/AI |
| API/DTO/examples/services | [Contract package](../contracts/README.md),66business+6identityoperations,63namedbase schemas; generatedOpenAPI/JSONSchema/examples; typedservices incode |
| File/Event contracts | [file-event-contracts.md](../contracts/file-event-contracts.md) |
| Source-to-Target Mapping | [source-to-target-mapping.csv](../contracts/source-to-target-mapping.csv),48maps |
| Error/Auth/Idempotency models | [error-auth-idempotency.md](../contracts/error-auth-idempotency.md) |
| Data models | [logical-data-model.md](../data/logical-data-model.md),DR01…22 |
| Security design/PoC blockers | [security-design.md](../security/security-design.md) |
| Screen behaviors/fields/validation/rights/error/mutation | [screen-behavior-specification.md](../design/screen-behavior-specification.md) |
| Auth screens/flows/states | [authentication-specification.md](../design/authentication-specification.md) |
| Module → interface → action → state / REQ/AC | [step4-action-coverage.md](../execution/evidence/step4-action-coverage.md), [machine-readableinventory](../execution/evidence/step4-action-inventory.json); /design đọc cùngsource |

UI tài chính/M1 đủ28AC và16routes, kế thừa nguyên5navigation; auth/system surfaces bổ sung theo yêu cầu mới:7authroutes+sessionsection, có localmock. Schemas/interfaces/protocolfixtures mới thựcthi test nhưng endpointsv1/statefulM2domain/querymigration chưa wire. Step4 complete không bằngM2productgate. Khôngrealdata/LLM/provider/paid/publicdeployment. Realprotectedtransport/auth/coderoots/keypolicy vàsecurityPoC vẫnBLOCKED.

## ARCH-10 — Android implementation handover

ARCH-10 chốt native ownership/support/Room/keys/clock/bridge/APK/release; ARCH-11 Sources tiếp theo. Không nhầm tám bảng Room local với87bảng PostgreSQL.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

ARCH11 source architecture SPECIFIED với32 requirements/32 runtime cases NOT RUN; ARCH12 Agent tiếp theo, ARCH13 vận hành. Provider shortlist không phải live support hoặc owner entitlement.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

ARCH12 chốt custom TS state loop + J2/Engine/ToolGateway/ContextBuilder/GroundedRenderer,13capabilities. API005 sửa prototype-only mode, ARCH13 Operations tiếp theo; model/runtime NOT RUN.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

ARCH13 chọn CI local, release có bảo trì, artifact bất biến, migration/rollback có kiểm tương thích, giám sát an toàn và recovery ngoài host. Không thêm microservices hoặc tự phát sinh phí.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
