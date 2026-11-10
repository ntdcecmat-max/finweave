# FinWeave 0.1.5 — kiểm thử notification cục bộ

Theo yêu cầu test trên điện thoại qua USB, bắt đầu với thông báo giả khi APK Internet bị Play Protect chặn. Giữ nguyên collector, parser, vault, worker và UI hiện có. Thêm plugin `FinWeaveNotificationTest` riêng; không thay FW-NATIVE-BRIDGE-003 hoặc API005, không biến login demo thành enrollment thật.

NotificationManager phát ba fixture cố định (tiền vào, tiền ra, OTP). CollectorListener nhận callback từ Android; chỉ đường own-package test mới đi qua probe. Trước khi đọc extras, probe kiểm own package, channel, pending notification id và tag nonce của phiên đã được người dùng bật. Nội dung phải khớp fixture trước khi parser chạy. Không nhận raw text từ JavaScript; không ghi raw notification ra disk/log hoặc gửi mạng. Native origin giới hạn https://localhost; consent và Notification Access là gate native. POST_NOTIFICATIONS là quyền phát thông báo test, do người dùng tự cấp trên Android 13+.

Kết quả chỉ giữ trong RAM, tối đa 20 mục, pending tối đa 16, phiên tối đa 15 phút. Tiền vào/ra giữ trạng thái parsed synthetic, chưa tạo ledger event; OTP discarded không giữ financial evidence. Dừng, hết phiên, mất quyền/listener hoặc đăng xuất xóa phiên. Scope nghiệp vụ ngân hàng/ví thật và các gate cũ được giữ nguyên.

UI ở `/data/android` hiển thị quyền, listenerBound, quyền phát notification, pending và callback nhận được. Không coi phát thành công là nhận thành công. Hướng dẫn: [local-simulation.md](../android/local-simulation.md).

Kiểm chứng:

| Kiểm tra | Kết quả |
| --- | --- |
| Web build / Capacitor sync | PASS |
| Web unit | 136/136 PASS |
| Native collector unit | 21/21 PASS |
| Native test-session gate / spoof / expiry / OTP unit | 4/4 PASS |
| Shell template unit | 1/1 PASS, ghi riêng |
| Android release / lint | PASS |
| Instrumentation | Compile PASS; chưa chạy điện thoại |
| APK signed manifest / DEX / certificate / hash | PASS; cùng pilot certificate, versionCode6 |
| API005 / JCS / ES256 / source-assets-APK hashes | PASS |
| Cài/nâng cấp qua USB và mở app | PASS; ADB install -r trả Success, versionCode6 và process được xác nhận |
| Quyền Notification Access / OS binding | PASS; người dùng cấp quyền, Android bind CollectorListener (hasBound=true) |
| Nhận/parse notification giả trên điện thoại | PENDING; chờ người dùng chạy bài test |

Thiết bị **SO-01M / Android 11 / API30** đã kết nối ADB và cho phép máy tính. `install-pilot.ps1` đã kiểm hash/chứng thư rồi cài bằng `adb -d install -r`, nhận `Success`, mở MainActivity. `dumpsys package` xác nhận versionName0.1.5/versionCode6, installed=true, hidden=false, suspended=false; process app đang chạy. Không gỡ app, không xóa dữ liệu, không giả installer và không thay đổi Play Protect/package verifier. [Bằng chứng cài thiết bị](evidence/android-notification-test-2026-10-12/device-install.json).

Lần kiểm tra đầu sau cài: FinWeave chưa có Notification Access. Sau khi người dùng thao tác cấp quyền, Android xác nhận FinWeave có quyền và `dumpsys activity services` xác nhận system đã bind CollectorListener (`requested=true received=true hasBound=true`). Người dùng được hướng dẫn chạy test trong UI; chưa tính nhận/parse notification là PASS chỉ từ binding. APK này chưa được Google duyệt; cài qua USB thành công không chứng minh tải từ Internet hết bị chặn.

[APK](../../artifacts/android/FinWeave-0.1.5-pilot.apk), [manifest kiểm hash](../../artifacts/android/manifest-0.1.5-pilot.json), [contract proof](evidence/android-notification-test-2026-10-12/contract-proof.json).
