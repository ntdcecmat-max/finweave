> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](docs/product/screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

> **03/11/2026 — Bản local hiện hành:** đã nối web/admin/backend PostgreSQL và Android native, bổ sung sửa draft tiếng Việt, model local và công cụ mở app/lấy OTP. Bắt đầu tại [hướng dẫn sử dụng](docs/LOCAL-QUICKSTART.md), [báo cáo và bằng chứng](docs/execution/completion-2026-11-03.md), [APK](artifacts/android/README.md). Chạy `Start-FinWeave.cmd`. Dùng dữ liệu thử nghiệm; nguồn thật, thiết bị thật, quan sát bảy ngày và triển khai công khai còn điều kiện nghiệm thu. Các ghi chú bên dưới là lịch sử từng giai đoạn.

> **Task 9 — 12/10/2026:** [APK 0.1.2 candidate](artifacts/android/README.md) đã build/ký; Kotlin collector, encrypted outbox và API005/native003 bridge đã có code. Cặp **VCB + ZaloPay**, MoMo để sau. 21 collector unit + 135 web unit PASS; device/instrumentation NOT RUN. Live profiles chưa bật, native identity/enrollment và HTTPS origin chưa nối; ZaloPay còn thiếu notification. [Báo cáo và mapping](docs/execution/android-collector-2026-10-12.md). Không đóng BE-20 hoặc nghiệm thu nguồn thật.

> **Implementation 11/10/2026:** [Assistant/Planning local](docs/execution/backend-assistant-local-2026-10-11.md) có 18 nhóm kiểm thử PASS. [APK FinWeave 0.1.1 pilot](artifacts/android/README.md) đã build/ký để cài thử, dùng dữ liệu minh họa; chưa collector/backend connection. Model thật, web/native adapters, Ops/production/UAT và quan sát 7 ngày còn mở. Notices phía dưới là lịch sử thiết kế.

> **ARCH-13 hiện hành — 09/10/2026:** [Operations](docs/operations/README.md) / [ADR020](docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](docs/operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](docs/agent/README.md) và [ADR019](docs/architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](docs/contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](docs/agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](docs/sources/README.md), [ADR018](docs/architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](docs/sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](docs/android/README.md), [ADR017](docs/architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](docs/android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](docs/async/README.md), [API004: 153 operations / 634 schemas](docs/contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](docs/data/target-t1-async/README.md) và [bundle/hashes](docs/async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](docs/domain/README.md), [API revision 003: 151 operations / 626 schemas](docs/contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](docs/data/target-t1-domain/README.md) và [bundle/hashes](docs/domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](docs/security/t1/README.md), [bundle và hashes](docs/security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](docs/data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 current target08/10/2026:** [identity protocol](docs/security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](docs/contracts/v2-t1-r2/README.md), [auth DB expand](docs/data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> **Implementation local — 09/10/2026:** [FW-BE-FOUNDATION-001](docs/execution/backend-foundation-2026-10-09.md) / [source](finweave-backend/README.md). Đã chạy PostgreSQL16, runner và ledger guards local; Engine exact kernel có unit execution. API005/DB005/native003 vẫn là đích; DB005/full backend/native/Agent chưa hoàn thành. Trạng thái NOT RUN trong các hồ sơ ARCH là evidence thiết kế lịch sử, không thay kết quả mới. [Physical addendum có revision](docs/data/local-foundation/README.md) ghi rõ journal placement và numeric/seal corrections; giữ đủ21 BE/41 AC.

# FinWeave — hồ sơ bàn giao kỹ thuật

Cập nhật 08/10/2026. [Bắt đầu bàn giao](docs/handover/README.md) · [Kết quả và giới hạn](docs/handover/validation-report.md).

**Baseline có phiên bản:** [FW-HANDOVER-20261008-r1](docs/governance/baselines/FW-HANDOVER-20261008-r1/README.md) · [review](docs/governance/baselines/FW-HANDOVER-20261008-r1/review-report.md). Working tree đã review + SHA256 manifest, API target2.0.0/physical synthetic001–003. Historical preservation FAIL được giữ nguyên; revision mới không nghiệm thu frontend hoặc backend.

Đích sản phẩm: user web, admin web riêng và Android dùng một authority backend. Hiện có React/TypeScript user web, admin build/adapter metadata riêng, 70 business +6 identity contracts v1 và18 operations của prototype nhãn 2.0.0 tại `/__mock/v2/operational`, khác canonical API v2. Android có shell/config và native bridge interface. **Chưa có backend/database persistent, Kotlin collector, signed APK, giá/provider hoặc LLM thật.** `/home/reports` chuyển về `/home`; nghiệp vụ report vẫn thuộc Home và API.

- Yêu cầu: [PRD](docs/product/prd.md), [Scope](docs/product/scope.md), [SRS](docs/requirements/srs.md); inventory41 AC giữ nguyên. [AI-SPEC-001](docs/product/ai-agent-specification.md) là nguồn chi tiết AI duy nhất.
- Nguồn API đích: [OpenAPI T1 working revision](docs/contracts/v2-t1/openapi.json), [semantics/adapters/revision/hash](docs/contracts/v2-t1/README.md); [v2baseline](docs/contracts/v2/README.md) giữ lịch sử. V1 và frontend Zod mô tả implementation mock hiện tại, không API production.
- Dữ liệu: [D1 + J2 target design/ERD/dictionary/migration plan](docs/data/target-t1/README.md), [physical001–003 baseline](docs/data/physical/README.md), [logical model](docs/data/logical-data-model.md).
- Bảo mật: [trust/security](docs/security/security-design.md), [quyết định triển khai](docs/architecture/adr/ADR-007-technical-handover-baseline.md), [môi trường/nguồn/quota](docs/handover/operational-decisions.md).
- Triển khai: [checklist bốn nhóm](docs/handover/integration-checklist.md), [traceability41 AC](docs/execution/realignment-traceability.md), [UI implementation08/10](docs/execution/ui-implementation-2026-10-08.md).

Hồ sơ này cho phép bắt đầu thiết kế chi tiết và xây backend **local synthetic** theo hợp đồng; chưa phải chấp nhận backend/native hoặc sẵn sàng production. SQL mới chỉ kiểm cú pháp và cấu trúc; migration chưa chạy trên PostgreSQL. Trust hiện hành là A + T1 theo [ADR-008](docs/architecture/adr/ADR-008-modular-backend-trusted-server.md); SEC-REAL-T1 chưa chạy, anti-root-Ops không còn gate bắt buộc. [ADR-011](docs/architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md) chốt DB D1 + J2; SQL004+ mới có design, không tự bật real.

Mở prototype sẵn có bằng `Start-Prototype.cmd`. Lượt bàn giao chỉ ghi docs/tools và không sửa runtime frontend hoặc chạy build; [hash trước/sau](docs/execution/evidence/handover-2026-10-08/frontend-preservation.json) **phát hiện biến động frontend/build trong thời gian làm việc**, nên không kết luận toàn frontend unchanged. Giữ mọi thay đổi/xóa có sẵn và biến động đồng thời, không restore/commit/push/deploy. [Báo cáo nghiệm thu frontend hiện hành](docs/testing/frontend-acceptance-report.md) ghi bằng chứng mới và giới hạn; hồ sơ Step4–6 là lịch sử, không chứng minh backend/native/security. [Snapshot tài liệu trước lượt này](docs/governance/baselines/handover-before-2026-10-08/manifest.json).

## ARCH-10 — Android implementation handover

Android vẫn React/Vite + Capacitor/Kotlin. Chưa có Capacitor dependency/Gradle project/APK thật; native bridge2 và consumer adapter chỉ SPECIFIED. Tất cả feature giữ nguyên.

[Chi tiết Android](docs/android/README.md) · [Acceptance32 NOT RUN](docs/android/acceptance-plan.md) · [Báo cáo ARCH10](docs/architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Nguồn thật chưa activate. Giữ mọi feature; synthetic/manual/CSV là baseline. SSI V3 read-only là ứng viên PoC, VCB/MoMo chưa owner-selected, PNJ/SJC chưa xác minh automation/license. Không runtime frontend/backend/native change.

[Source design](docs/sources/README.md) · [Acceptance32 NOT RUN](docs/sources/acceptance-plan.md) · [Báo cáo ARCH11](docs/architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Agent runtime design kế thừa toàn bộ assistant/chat/history/mascot/manual và PG-01/02/03/INV-01. API005, native003, DB005; model thực chưa selected/enabled, frontend chưa adapter migration.

[Runtime design](docs/agent/README.md) · [Acceptance32 NOT RUN](docs/agent/acceptance-plan.md) · [Báo cáo ARCH12](docs/architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

ARCH01–13 đã có thiết kế để triển khai và thử rủi ro. Tiếp theo: PostgreSQL local disposable, executable migrations, rồi full backend đủ21 gói/41 AC. Chưa nghiệm thu runtime/production.

[Hồ sơ vận hành](docs/operations/README.md) · [Acceptance32 NOT RUN](docs/operations/acceptance-plan.md) · [Báo cáo](docs/architecture/ARCH-13-change-report.md).
