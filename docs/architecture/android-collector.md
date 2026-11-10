> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

# Android collector — current architecture entry

ARCH-ANDROID-001 · v2.0 · 09/10/2026 · DESIGN SPECIFIED / NATIVE NOT BUILT / NOT RUN.

Tài liệu chi tiết hiện hành ở [ARCH-10 Android](../android/README.md): component ownership, listener/permissions, event identity/binding, native auth/proofs, eight-table Room model, encrypted outbox/ACK journal, clock/retention, bridge2 và signed APK/update/support. Kế thừa ARCH-06/07/09; nội dung ARCH10 supersedes mô tả native cũ khi khác nhau. Historical revisions giữ trong snapshots/evidence, không sửa r1/r2.

React/Vite UI tiếp tục Capacitor/Kotlin; chưa có Capacitor dependency/Gradle native project/APK. Listener/WorkManager/Room/Keystore chưa triển khai. Server API004/DB005/Engine giữ authority, không generic native signing/network proxy và không raw/OTP disk/server/LLM. Native owner token15min/refresh30d riêng collector24h/authorization30d, không owner refresh trong background uploader. Dữ liệu gắn bất biến owner/workspace/device/capture epoch và binding version.

Pending≤1000items/8MiB/7days, quarantine thêm7days; encrypted normalized ACK replay riêng≤1000/8MiB/7days phục vụ reconcile. Mất receipt sau restore điều tra, không auto ingest lại. Expiry chặn decrypt/display/upload; OS tắt/force-stop không bảo đảm physical erase đúng giờ. After reboot cần trusted time trước unseal/capture REAL. No observations không có nghĩa không giao dịch; ghi coverage uncertainty, không hứa chạy nền liên tục.

[Bridge/consumer map](../android/bridge-and-consumer.md) giữ seven legacy methods qua future adapter, thêm bridge2 handshake/status/config; không sửa frontend ở vòng docs này. [Sáu màn Android](../design/android-ui-specification.md) native_pending; [32 acceptance cases](../android/acceptance-plan.md) NOT RUN. [APK/release](../android/apk-release.md) fail closed REAL khi appId/HTTPS origin/signing/support/catalog chưa xác minh, không fake download link. Full user UI/manual/CSV/Plan–Goals/Agent giữ nguyên.

ARCH-10 local budget clarification: pending+quarantine dùng chung≤1.000items/8MiB; ACK replay budget riêng. Chuyển quarantine không giải phóng chỗ capture, không silent pending eviction. Native key generation/nonce rotation và clock checks theo [local storage](../android/local-storage.md).

## ARCH-11 — Source integration handover

App signer/version/template/finality phải verified trước supported=true. Unbound/ambiguous không upload fake binding: local warning+gap; bound incomplete đúng DTO đi server Review. Raw/OTP không disk/server/model/chat.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Native API005 handshake cần bridge003 kế thừa002, chỉ exact revision fields đổi. Notification parser vẫn deterministic; raw/OTP không Agent. Android owner UI đầy đủ Agent/manual qua owner broker, worker không có token owner.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).
