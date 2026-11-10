# ARCH-10 — Android native collector và APK

09/10/2026 · **DESIGN SPECIFIED / NATIVE NOT BUILT / ALL32 RUNTIME CASES NOT RUN.**

## Đã làm và vì sao

| Bổ sung/thay đổi | Lý do |
| --- | --- |
| [Native architecture/support](../android/architecture-and-support.md), ADR017 | Kế thừa React/Vite qua Capacitor/Kotlin, làm rõ phần OS/background cần xây; không có bằng chứng cần viết lại UI |
| [Capture/auth](../android/capture-and-identity.md) | Source/parser/binding và event identity không được auto đoán; collector renewal tách owner auth, no raw/OTP disk/server/LLM |
| [Eight-table local Room design](../android/local-storage.md) | Crash/offline/keys/nonce/owner switch/clock và expiry có quy tắc; tám bảng không cộng vào PostgreSQL; không claim toàn DB encrypted |
| [Bridge2 consumer mapping](../android/bridge-and-consumer.md) | Bảy methods cũ vẫn kế thừa qua future adapter; strict legacy status khác rich status; typed native auth/owner API không expose token hoặc signing oracle;15managed auth/enrollment field maps tách UI/native input và secret-free response |
| [APK/signing/update/free-first distribution](../android/apk-release.md) | Có quy trình tạo/cài/cập nhật APK giữ queue, signing custody và metadata; không fake link hoặc mặc định public unlimited free |
| [UI-M01…06 specification](../design/android-ui-specification.md) | Thêm clock/key/update/error states, queue paging/bytes, ACK replay, offline revoke pending, support/distribution; UI chưa triển khai native |
| [32 Android acceptance intentions](../android/acceptance-plan.md) | Tách static/schema/model bằng chứng khỏi signed APK/OS/OEM/source/end-to-end thực tế |
| Current docs/index/HLD/LLD/stack/context/views/cost/handover | Cùng trỏ master Android/bundle, giữ full feature/backlog/41parent AC và các snapshot cũ |

## Kiểm chứng artifact và giới hạn

Kết quả máy đọc ở [static validation](../execution/evidence/arch-10-android-2026-10-09/static-validation.json), [bridge schemas](../execution/evidence/arch-10-android-2026-10-09/bridge-schema-validation.json), [specification models](../execution/evidence/arch-10-android-2026-10-09/model-validation.json), [source observations](../execution/evidence/arch-10-android-2026-10-09/source-observations.json), [artifact manifest](../execution/evidence/arch-10-android-2026-10-09/artifact-manifest.json).

**Kết quả artifact:28checksPASS,9schema-positivePASS/22schema-negative rejected đúng,43model-only vectorsPASS;26currentdocs đồng bộ,425protectedfiles không drift.** Các kiểm tra chỉ xác thực documents/schema/fixtures/input expectations/hashes/scoped links. **Không chạy Android/Gradle/Keystore/AES/ES256 interoperability/Room/SQL/OS notification/provider/backend/end-to-end tests; không build/cài APK**. REAL appId/HTTPS origin/certificate/device support/source catalog chưa cấu hình; release fail closed. Package dependencies/lockfile/frontend runtime không sửa; API004153operations634schemas và DB00587tables1001cols162FK giữ nguyên. Prior425protectedfiles được đối chiếu hash (bao gồm frontend, r1/r2, ARCH07–09 packages/evidence/tools/reports); historical FAIL/PASS giữ nguyên, không biến thành nghiệm thu mới.

## Điểm cần lưu ý

Android/OEM có thể ngừng collector và làm thiếu observation; hiển thị coverage uncertainty, không hứa luôn chạy nền. OS tắt/force-stop không bảo đảm xóa vật lý đúng giờ; expired payload không được decrypt/display/upload, purge khi có execution. Keystore backing phải đo, process compromise vẫn có thể dùng key; T1 server operators vẫn trusted. Native2 consumer adapter, actual APK, security/restore/source PoCs/UAT chưa có.

Nguồn platform/vendor đã kiểm ngày09/10/2026 ở [research register](../android/research-sources.json), liên kết chính thức đặt cạnh claims trong thiết kế. Distribution account optional≤20devices chỉ theo eligibility hiện hành, không auto chấp nhận commercial SaaS/free forever; không mua/tạo account/deploy/publish/call provider thật.

Tiếp theo **ARCH-11 Sources**: chốt ngân hàng/ví cụ thể, package/signer/app-version/parser/consented samples; stock/gold identity/profile/units/bid-ask/time/rights/quota/fallback. Sau đó ARCH12Agent/ARCH13operations, rồi thực thi các PoC và kiểm PostgreSQL/backend/native.
