> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 current target08/10/2026:** [identity protocol](../security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](../contracts/v2-t1-r2/README.md), [auth DB expand](../data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> **Contract delta08/10/2026 — ARCH-05 ACCEPTED CONTRACT DESIGN:** [working API T1](../contracts/v2-t1/README.md), [ADR-012](../architecture/adr/ADR-012-unified-t1-contract-revision.md).141 operations, fresh mapping, revision/hash pin, native/collector/owner/Ops authorities vàJ2 tickets rõ. APIbaseline/schema/r1/r2 giữ nguyên; chưa tạo handoverrevision mới. Auth credentials/storage/crypto ARCH-06 vàruntimeconformance cònNOT RUN, không bàn giao làbackend đãreadyreal.

> **Database delta08/10/2026 — ARCH-04 ACCEPTED D1 + J2:** [target package](../data/target-t1/README.md), [ADR-011](../architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md), [API/storage delta](../data/target-t1/api-data-delta.md). Baseline API2.0.0/physical001–003/r1/r2 giữ nguyên; target70 bảng/782 cột là expand design với migration plan004+, không SQL execution hoặc handover revision mới. Tiếp ARCH-05 contracts và ARCH-06/07/08/09 trước chốt implementation details. Không chạy old54-table schema rồi nhận là target hoàn tất.

# Bàn giao kỹ thuật FinWeave

**Delta kiến trúc sau r2 — 08/10/2026:** owner chọn [ARCH-01 A + T1](../architecture/adr/ADR-008-modular-backend-trusted-server.md). [HLD](../architecture/high-level-design.md), [context](../requirements/context-model.md), [views](../architecture/views/architecture-views.md), SRS và security hiện hành theo trusted-server. Không sửa snapshot r1/r2 hoặc API/schema và chưa đóng baseline mới; acceptance/mapping của các snapshots không tự mở rộng sang T1 runtime.

**Delta ARCH-02 sau r2 — 08/10/2026:** owner chọn [S1 + P2 / ADR-009](../architecture/adr/ADR-009-fastify-and-isolated-processes.md). [Stack](../architecture/tech-stack.md) và [module HLD](../architecture/module-high-level-design.md) chốt Fastify/TypeScript, P2 process boundaries, ownership54 bảng và UnitOfWork; SQL/runtime/roles/contract compiler chưa kiểm. HLD/views/LLD/agenda đã đồng bộ, API/schema và immutable snapshots giữ nguyên; chưa có baseline mới.

**Revision frontend hiện hành:** [FW-HANDOVER-20261008-r2](../governance/baselines/FW-HANDOVER-20261008-r2/README.md), ghi nhận source và evidence acceptance-2: 67/67 browser, 131/131 unit trong phạm vi synthetic đã kiểm. Manifest/SHA256/payload ở cùng thư mục revision; v3 vẫn PARTIAL, chưa backend/native/security/UAT.

**Mốc hợp đồng/schema kế thừa:** [FW-HANDOVER-20261008-r1](../governance/baselines/FW-HANDOVER-20261008-r1/README.md), working tree đã review trên HEAD `fac053c5ccb7c7792feb5325409e68974b8aad84`. [Review/changelog](../governance/baselines/FW-HANDOVER-20261008-r1/review-report.md), snapshot r1 giữ nguyên. API target2.0.0; physical artifact FW-PHYS-SYNTHETIC-001, migrations001–003 chưa chạy. R2 là bổ sung frontend, không xác nhận lại toàn bộ consumer mapping. [Chính sách và workflow revision](baseline-policy.md).

Revision mới reconciliation9 đường dẫn và sửa metadata/mapping, không thay historical drift/FAIL. Source preservation r1 chỉ nói khoảng task mới. Các liên kết handover-2026-10-08 bên dưới là evidence của lượt bàn giao trước; đọc cùng report r1 để có trạng thái mới nhất.

08/10/2026. Bộ hồ sơ thống nhất cho backend, user web, admin web và Android. **Sẵn để bắt đầu xây local synthetic theo các hợp đồng đã đặc tả; chưa nghiệm thu backend/native/security hoặc sẵn sàng dữ liệu thật.**

| Đọc theo thứ tự | Nguồn và mục đích |
| --- | --- |
| 1. Yêu cầu | [PRD](../product/prd.md), [Scope](../product/scope.md), [SRS41 AC](../requirements/srs.md), [AI-SPEC-001](../product/ai-agent-specification.md). SRS/BR/DR là authority nghiệp vụ; AI-SPEC là nguồn chi tiết AI duy nhất |
| 2. Baseline đã quan sát | [UI08/10](../execution/ui-implementation-2026-10-08.md), [catalogue đã sửa](../design/interface-catalogue.md), [observed contracts](../execution/evidence/handover-2026-10-08/observed-contracts.json). User/admin mock+Android bridge, không backend/native thật |
| 3. API | [Canonical OpenAPI](../contracts/v2/openapi.json), [index/examples/mapping](../contracts/v2/README.md), [semantics](../contracts/v2/semantics.md), [lifecycle](../contracts/v2/lifecycles.md), [migration](../contracts/v2/migration.md) |
| 4. PostgreSQL | [Physical/migration index](../data/physical/README.md), [ERD](../data/physical/erd.md), [dictionary](../data/physical/data-dictionary.md), [API/data mapping](../contracts/v2/api-data-mapping.csv) |
| 5. Trust và vận hành | [Security design](../security/security-design.md), [ADR-007](../architecture/adr/ADR-007-technical-handover-baseline.md), [sources/quota/cost decisions](operational-decisions.md), [environment example](environment.synthetic.example), [environment schema](environment.schema.json) |
| 6. Truy vết và tích hợp | [RTM41 AC](../execution/realignment-traceability.md), [checklist/thứ tự bốn nhóm](integration-checklist.md), [test plan](../testing/operational-acceptance-plan.md) |
| 7. Kiểm tra và review | [Validation report](validation-report.md), [raw validation](../execution/evidence/handover-2026-10-08/validation.json), [frontend preservation](../execution/evidence/handover-2026-10-08/frontend-preservation.json) |

Canonical v2 là **đích bàn giao**, không đồng nghĩa frontend Zod đã chuyển sang bộ này. V1 OpenAPI và Step4–6 giữ exact lịch sử mock; [nghiệm thu frontend hiện hành](../testing/frontend-acceptance-report.md) ghi nhận acceptance-2 trong phạm vi synthetic, không canonical v2 conformance. [Snapshot trước cập nhật](../governance/baselines/handover-before-2026-10-08/manifest.json) bảo tồn lịch sử docs; không phục hồi các file người dùng đã xóa hoặc ghi đè frontend.

Chốt local synthetic, schema profile, operation/version/error/idempotency semantics, source fallback và integration order. ARCH-03 chọn **I0 local + I1 Oracle Always Free VM có điều kiện** theo [ADR-010](../architecture/adr/ADR-010-local-and-conditional-free-cloud.md), [topology](../architecture/deployment-topology.md), [environments](../architecture/environment-matrix.md) và [cost](../product/cost-model.md); quota/account/provision/restore chưa kiểm, không auto paid fallback. Cần PostgreSQL execution+domain/auth/concurrency tests trước nhận backend synthetic; cần Kotlin/APK/device matrix trước nhận Android; cần SEC-REAL-T1/auth/device/keys/logs/encryption/restore/privacy evidence và quyền nguồn/provider trước dữ liệu thật; protected anti-Ops PoC không còn gate bắt buộc T1. Các phê duyệt còn lại có khuyến nghị cụ thể trong operational decisions, không chặn hoàn thiện artifact hoặc công việc synthetic đã được phép ở tương lai.

## ARCH-10 — Android implementation handover

Android implementation handover now includes bridge consumer mapping/local schema/build/signing/upgrade/support and32 runtime intentions. No new r1/r2 baseline; no APK acceptance.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Bổ sung Sources package và32 source runtime gates NOT RUN. Provider shortlist/read public docs không là actual integration hoặc rights approval. Giữ r1/r2 snapshots và lịch sử kết quả trước.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Thêm Agent LLD/eval/32runtimecases, API005/native003 consumer delta và binding matrix từ packages cũ. DB005 unchanged; no model/runtime/backend/frontend migration acceptance. Giữ r1/r2, source gates.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Bổ sung CI/config/secrets/release/migration/rollback/health/backup/retention/incidents và32 ca vận hành chưa chạy. API005/DB005/native003 không đổi. Tiếp theo là DB local và implementation.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
