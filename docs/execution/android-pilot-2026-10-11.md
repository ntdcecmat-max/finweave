# APK pilot — 11/10/2026

**SIGNED_SYNTHETIC_PILOT_DEVICE_NOT_TESTED.** Đã tạo [APK 0.1.1](../../artifacts/android/FinWeave-0.1.1-pilot.apk), [manifest/hash](../../artifacts/android/manifest-0.1.1-pilot.json), [signature result](../../artifacts/android/signature-0.1.1-pilot.txt) và [hướng dẫn cài](../../artifacts/android/README.md).

Capacitor 8.5.3 / App 8.1.2, Temurin JDK 21, Gradle 8.14.3, AGP 8.13.0, SDK/target 36, min SDK 24. Gradle `assembleRelease lintRelease` PASS. APK ký bằng chứng thư pilot RSA3072; apksigner v2/v3 verify PASS. Không dùng debug keystore; khóa/password giữ trong ignored `.local/`. App ID `test.finweave.prototype`, versionCode 2. Cấm backup và cleartext/mixed content; WebView debug/logging tắt.

UI React hiện có được đóng gói với biểu tượng FinWeave. Native bootstrap dùng mock transport trong process vì WebView không dùng MSW Service Worker; browser giữ transport MSW hiện có. Kiểm thử Edge 390×844 mô phỏng nhánh native tắt Service Worker PASS 1 case: đăng nhập/xác thực demo, đọc workspace, mở Plan/màn Android, reject request mock không có session, đăng xuất, không có pageerror hoặc network request `/__mock/`. [Kết quả máy đọc](evidence/android-pilot-2026-10-11/browser-results.json), [ảnh](evidence/android-pilot-2026-10-11/android-setup-390.png).

**Không có điện thoại thật trong phiên này:** cài/nâng cấp/lifecycle WebView/back button/OEM/crypto interoperability NOT RUN. Không có collector, NotificationListener, Keystore/Room outbox, native owner/collector credential bridge hoặc API005 adapter. APK chưa kết nối backend PC; UI Agent vẫn mock. Không tính APK pilot này là BE-20 complete hoặc full Android acceptance.

Script build tái lập ở `finweave-web/scripts/build-apk.ps1`. Manifest ghi hashes source và dist assets. Không đánh đồng build/signature/browser bootstrap với kiểm thử thiết bị thật hoặc production deployment.
