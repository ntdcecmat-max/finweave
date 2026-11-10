# FinWeave: APK đầy đủ và xử lý cảnh báo Play Protect

12/10/2026 · **FULL APK BUILT / FEATURES PRESERVED / GOOGLE REVIEW NOT SUBMITTED / DEVICE TEST NOT RUN**.

Người dùng yêu cầu giữ toàn bộ chức năng, gồm tự ghi nhận giao dịch từ notification, và tiếp tục phân phối APK trực tiếp. Bản rút gọn 0.1.3 không đáp ứng yêu cầu này; cấu hình build rút gọn đã được bỏ. Bản hiện hành là [FinWeave-0.1.4-pilot.apk](../../artifacts/android/FinWeave-0.1.4-pilot.apk). Các APK cũ giữ làm lịch sử.

## Nguyên nhân và giới hạn xử lý

Ảnh hiển thị đúng dạng cảnh báo chặn app có thể yêu cầu dữ liệu nhạy cảm gây rủi ro danh tính/gian lận tài chính. Theo [Google](https://developers.google.com/android/play-protect/warning-dev-guidance), APK từ Internet/file manager khai báo NotificationListener có thể bị chặn bởi cơ chế này. FinWeave cần NotificationListener cho chức năng cốt lõi. Chữ ký hợp lệ, consent UI, cập nhật SDK hoặc đổi tên package không chứng minh app sẽ được Play Protect cho phép. Không ẩn service/quyền, chuyển quyền sang mã tải động, tắt Play Protect hay bỏ gate xác minh nguồn để né cảnh báo.

Ảnh không hiển thị version/hash. Bản 0.1.2 là artifact đầy đủ mới nhất trước công việc này, nhưng chưa xác nhận nó chính là binary bị chặn. Bản 0.1.4 chưa thử trên điện thoại; không được gắn cảnh báo trong ảnh với hash 0.1.4 như một bằng chứng đã quan sát.

Với lựa chọn phân phối APK trực tiếp, bước còn lại là kiểm bản đầy đủ trên thiết bị và, nếu bị chặn nhầm, gửi [form Play Protect](https://support.google.com/googleplay/android-developer/contact/protectappeals). Form hiện yêu cầu SHA-256 của APK đã upload VirusTotal và email chủ app. Hồ sơ chỉ chuẩn bị local; chưa có sự cho phép upload/gửi, chưa biết email nhà phát triển, chưa có quyết định Google. Google không bảo đảm chấp thuận và form thông báo không gửi phản hồi.

## Thay đổi đã hoàn tất

- Khôi phục NotificationListener, plugin/runtime, Room/Keystore, WorkManager uploader và parser vào source set `main`; khôi phục các native tests. Không còn product flavors rút gọn.
- Build mặc định luôn tạo APK đầy đủ. Manifest vẫn khai báo minh bạch `BIND_NOTIFICATION_LISTENER_SERVICE`; nhãn/mô tả quyền giải thích tự ghi nhận giao dịch và quyền thu hồi của người dùng.
- Kiểm APK **sau ký**, gồm manifest dependency đã merge và DEX. Build từ chối khi thiếu listener/plugin/runtime/worker/vault/parser; từ chối SMS/accessibility/query-all-packages/install-packages không cần thiết. APK chỉ đưa vào artifacts sau khi xác minh chữ ký và danh tính nâng cấp.
- Frontend giữ toàn bộ màn hình, luồng consent và chức năng hiện có. Bootstrap chỉ đăng ký JS collector khi Android thật có plugin; proxy không được coi là quyền native. Không hiển thị nhãn bản rút gọn.
- Chuẩn bị hồ sơ tại [artifacts/android/play-protect](../../artifacts/android/play-protect/README.md), tách artifact cũ nghi bị chặn và candidate mới. Generator kiểm hash APK trước khi tạo hồ sơ; không gọi mạng hoặc gửi form.

## Kết quả xác minh

| Kiểm tra | Kết quả |
| --- | --- |
| React/TypeScript build + Capacitor sync | PASS |
| Web unit | 136/136 PASS |
| Native parser/wire unit | 21/21 PASS; thêm 1 template unit PASS |
| Android instrumentation | Compile PASS; chưa chạy thiết bị |
| Android release build/lint | PASS; 0 errors, 37 warnings |
| APK v2/v3 signature | PASS; chứng thư pilot giữ nguyên |
| Manifest + DEX cuối cùng | PASS; listener/plugin/runtime/worker/vault/parser có mặt |
| So sánh collector với bản 0.1.2 | 9/9 file Kotlin giữ nguyên byte-for-byte |
| API005/JCS/ES256 wire proof + source/assets/APK hashes | PASS |
| Browser native pilot: login, Android setup, commands, logout | 1/1 PASS |
| Cài/nâng cấp và Play Protect thật | NOT RUN; ADB không có thiết bị |
| Upload VirusTotal / gửi Google / Google chấp thuận | NOT DONE |

APK: `test.finweave.prototype`, version `0.1.4-pilot`, versionCode **5**, minSdk24/targetSdk36, **44,026,878 bytes**.

SHA-256 APK: `73560e83dc32573f2f40de670632af3b8e8fb2e37f411ac66024cfe34f710639`.

SHA-256 chứng thư: `734a9b3d80c66eacd6515b0250c2ef0aad6fff0b7ddb45d9bfaad20616ce7286`.

[Manifest](../../artifacts/android/manifest-0.1.4-pilot.json), [chữ ký](../../artifacts/android/signature-0.1.4-pilot.txt), [permissions](../../artifacts/android/permissions-0.1.4-pilot.txt), [Android manifest cuối cùng](../../artifacts/android/android-manifest-0.1.4-pilot.txt). Lưu ý `aapt2 dump permissions` liệt kê uses-permission; quyền bind của service được kiểm trong Android manifest, không suy luận thiếu Notification Access chỉ từ danh sách uses-permission.

## Khả năng sử dụng thật còn thiếu từ trước

Các file collector được giữ nguyên. App vẫn là prototype `synthetic_mock`: live source registry trống, native identity/enrollment và HTTPS backend chưa nối, ZaloPay chưa có mẫu notification được xác minh, model AI thật chưa bật. Xem [báo cáo collector](android-collector-2026-10-12.md). Công việc này không xóa tính năng hoặc thêm giới hạn mới cho capture; cũng không thể tuyên bố app đã tự ghi nhận giao dịch ngân hàng thật chỉ vì cài được.

Để đóng lỗi cài đặt: thử đúng 0.1.4 trên điện thoại với Play Protect bật, xác nhận kết quả; nếu tiếp tục chặn, bổ sung đúng file/hash/phiên bản/ảnh vào hồ sơ rồi kiểm lại thiết bị sau xử lý. Chủ app đã cho phép upload binary ra VirusTotal/gửi Google và cung cấp email. Browser upload chưa xác nhận thành công do filechooser timeout; form Google mới điền một phần, chưa gửi. Build PASS chưa đóng bước này.

[Hướng dẫn mô phỏng local](../android/local-simulation.md) giữ nguyên APK đầy đủ và Play Protect. `install-pilot.ps1 -VerifyOnly` kiểm hash/chứng thư PASS; chưa cài thiết bị vì ADB chưa có máy kết nối.
