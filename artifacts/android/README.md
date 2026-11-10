> **Nhập ảnh giao dịch 03/11/2026:** có [APK debug local mới](screenshots/README.md) với luồng chọn/chụp ảnh. Cần backend Windows; bản pilot minh họa bên dưới vẫn giữ nguyên.

# FinWeave APK pilot đầy đủ

Bản hiện hành **03/11/2026: [FinWeave-0.1.9-pilot.apk](FinWeave-0.1.9-pilot.apk)**, versionCode10, cùng appId và chứng thư pilot. Android API 24 trở lên; **giao diện cần WebView Chromium 120 trở lên**. Bản này chạy độc lập bằng dữ liệu minh họa (`synthetic_mock`), không nối máy chủ local hoặc nguồn ngân hàng/ví thật. Đã cài, đăng nhập demo và mở Home trên giả lập Android 15. [Receipt thử APK đã ký](../../docs/execution/evidence/completion-2026-11-03/signed-smoke-1793692066839/results.json), [manifest/hash](manifest-0.1.9-pilot.json), [chữ ký](signature-0.1.9-pilot.txt).

SHA-256 APK: `ae50f5910a3a63eee88b4310a5c3e50201e91bc64acca84794b3e88871847d09`.

**Bản debug nối backend local:** [finweave-be19-local-debug.apk](be19/finweave-be19-local-debug.apk), dùng API tại `http://127.0.0.1:4310` qua ADB reverse. Đây là bản ký debug phục vụ kiểm thử, khác chữ ký pilot. Sáu luồng native/web/PostgreSQL đã đạt trên giả lập; xem [receipt](../../docs/execution/evidence/completion-2026-11-03/native-1793691579081/results.json). Token và khóa ký giữ ở native; enrollment yêu cầu đồng ý và xác minh lại mật khẩu/OTP. [Hướng dẫn local](../../docs/LOCAL-QUICKSTART.md) và [báo cáo hiện hành](../../docs/execution/completion-2026-11-03.md).

Trên máy này chưa có điện thoại thật để nghiệm thu. Play Protect, các OEM và nguồn notification thật vẫn cần kiểm riêng. Image Android đang dùng là `userdebug`, nên việc không xuất hiện WebView debug socket trên thiết bị sản xuất chưa được nghiệm thu; manifest release không khai báo debuggable và cấu hình WebView debug là false.

## Lịch sử 0.1.8 và các đợt kiểm tháng 10

Bản trước: **[FinWeave-0.1.8-pilot.apk](FinWeave-0.1.8-pilot.apk)**. Giữ NotificationListener, plugin collector, Room/Keystore outbox, WorkManager uploader, parser VCB và toàn bộ giao diện tài chính/nhập tay/CSV/Plan–Goals/Assistant hiện có. VersionCode9 dùng cùng appId và chứng thư pilot cũ. Thêm bộ đọc tiền vào/ra ứng viên theo câu chữ chung, số tiền VND nguyên và ba nút test ZaloPay bằng dữ liệu giả. Phiên nhận thử ZaloPay15phút yêu cầu đồng ý mới để phân tích amount/direction cục bộ; không giữ raw/tên/tài khoản/ref, không upload hoặc tự ghi sổ. [Báo cáo0.1.8](../../docs/execution/android-zalopay-candidate-2026-10-12.md).

**Chưa xác nhận hết cảnh báo Play Protect.** Google có thể chặn APK tải từ Internet khai báo quyền đọc thông báo, ngay cả khi quyền cần thiết cho chức năng hợp lệ. Ký APK đúng không thay thế kết quả xem xét của Google. Người dùng yêu cầu tiếp tục phân phối APK trực tiếp; hướng xử lý là giữ chức năng và chuẩn bị [hồ sơ Play Protect](play-protect/README.md). Xem [hướng dẫn Google](https://developers.google.com/android/play-protect/warning-dev-guidance) và [báo cáo](../../docs/execution/android-play-protect-2026-10-12.md).

1. Dùng file 0.1.8 khi kiểm tra bản đầy đủ; giữ Play Protect bật. Bản 0.1.3 là phương án rút gọn đã bị loại khỏi hướng triển khai, chỉ giữ làm lịch sử. Hồ sơ Google hiện chuẩn bị cho 0.1.4; chưa gửi.
2. Thử cài/nâng cấp trên điện thoại. Nếu còn bị chặn, ghi đúng phiên bản, hash APK, Android/Play Protect và ảnh cảnh báo để gửi xem xét.
3. Sau khi cài được: FinWeave → **Điền thông tin mẫu** → **Đăng nhập demo** → mã **123456**.
4. Thiết lập Android giải thích xử lý dữ liệu trước khi người dùng chủ động cấp Notification Access. Cấp quyền không tự đăng ký thiết bị hoặc bật nguồn chưa xác minh.

Giới hạn kế thừa bản0.1.2: app vẫn là `synthetic_mock`; live source registry trống, native identity/enrollment và HTTPS backend chưa nối. Bộ đọc ZaloPay chỉ là candidate generic, chưa đối chiếu notification giao dịch thật. Callback nguồn đã được chủ thiết bị xác nhận bằng ảnh UI0.1.7, nhưng mẫu chỉ có `[TEXT]`; chưa chứng minh money parsing. Model AI thật chưa bật. Không tự biến kết quả nhận diện thử thành giao dịch đã ghi sổ.

`manifest-0.1.8-pilot.json` ghi source/assets/APK hashes, chứng thư và trạng thái chưa Google duyệt. `signature-0.1.8-pilot.txt`, `permissions-0.1.8-pilot.txt`, `android-manifest-0.1.8-pilot.txt` ghi kiểm tra APK cuối cùng. Khóa pilot nằm ngoài source trong `.local/`; không chia sẻ cùng APK hoặc hồ sơ xem xét.

Build lại:

```powershell
cd finweave-web
./scripts/build-apk.ps1
node scripts/prepare-play-protect.cjs
```

Pipeline build/unit/instrumentation compile/lint → zipalign/sign → kiểm manifest và DEX cuối cùng → đối chiếu chứng thư/versionCode → artifacts. Build phải có listener/plugin/runtime/worker/vault/parser; từ chối quyền SMS/accessibility/query-all-packages/install-packages không cần thiết. Đọc thông báo vẫn khai báo minh bạch.

Bản0.1.5 đã cài/mở và có Notification Access/CollectorListener binding trên SO-01M/Android11. Bản0.1.7/code8 đã nâng cấp USB thành công, process chạy và quyền/binding listener được xác nhận; xem báo cáo phiên ZaloPay. Nhận/parse callback kiểm thử, capture/offline/reboot/Room/Keystore và end-to-end native backend chưa nghiệm thu. Play Protect cho đường tải Internet chưa xác nhận. Kết quả build/cài USB không phải nghiệm thu production hoặc BE-20.

Kiểm thử local qua USB/Emulator: [hướng dẫn mô phỏng](../../docs/android/local-simulation.md). Script cài đặt kiểm hash/chữ ký trước khi chạy ADB; không thay đổi Play Protect. File APK tải trực tiếp vẫn là bản đầy đủ ở đầu trang.
