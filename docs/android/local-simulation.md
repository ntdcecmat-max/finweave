# Mô phỏng FinWeave trên Android

APK đầy đủ0.1.8 giữ notification collector, bài test thông báo Android cục bộ và thêm bộ đọc ZaloPay ứng viên cùng test dữ liệu giả. Nếu chỉ mô phỏng, dùng luồng phát triển chính thức: Android Emulator hoặc thiết bị thử kết nối USB/ADB. [Android hướng dẫn kiểm thử thiết bị thật](https://developer.android.com/studio/run/device), [ADB](https://developer.android.com/tools/adb) và [Emulator](https://developer.android.com/studio/run/emulator).

Đây là lựa chọn kiểm thử local; không phải chứng nhận Play Protect. Cảnh báo trong ảnh liên quan APK từ nguồn Internet có quyền đọc thông báo theo [Google](https://developers.google.com/android/play-protect/warning-dev-guidance). Không bảo đảm ADB làm app được Google cho phép; nếu hệ thống vẫn chặn hoặc phát hiện nguy hiểm, dừng và xử lý qua kênh xem xét chính thức.

## Điện thoại qua USB

1. Giữ Play Protect bật. Dùng điện thoại thử nếu có, chỉ dùng dữ liệu demo.
2. Trên điện thoại, bật Developer options → USB debugging, kết nối cáp với máy tính của bạn, mở khóa và xác nhận khóa RSA của đúng máy. ADB có quyền kiểm thử rộng trên thiết bị; chỉ tin cậy máy phát triển của bạn.
3. Từ thư mục gốc workspace chạy:

```powershell
./finweave-web/scripts/install-pilot.ps1
```

Script kiểm SHA-256 và chữ ký APK rồi chạy `adb -d install -r` để cài/nâng cấp, giữ dữ liệu. Không tự cấp quyền notification, không gỡ app/wipe, không giả installer, không tắt quét hay mở ADB qua mạng. Nếu có nhiều máy USB, chỉ kết nối máy cần thử.

Sau khi cài, mở FinWeave → Điền thông tin mẫu → Đăng nhập demo → mã 123456. Thử nhập tay/CSV, thu–chi, kế hoạch, mục tiêu và luồng minh họa Android. Khi cần kiểm quyền native, đọc phần giải thích trong app rồi chủ động cấp quyền cho FinWeave; collector giữ các gate consent/source/binding/enrollment gốc.

### Test nhận notification thật của Android bằng dữ liệu giả

1. Mở **Nguồn dữ liệu → Thiết lập Android** (`/data/android`). Tìm thẻ **Test nhận thông báo trên điện thoại**.
2. Xác nhận đồng ý test dữ liệu giả, bấm **1. Mở quyền đọc thông báo**. Trong Android, bật quyền cho FinWeave rồi quay lại app. Đợi trạng thái **Listener: Đã kết nối**; quyền đã cấp chưa đồng nghĩa listener đã kết nối.
3. Bấm **2. Bật bài test**, cho phép app hiển thị thông báo nếu Android yêu cầu.
4. Bấm **Test tiền vào**: Android phải hiện notification; khi callback đến, app hiện **Android đã gọi listener** và **321.654 VND** tiền vào. **Test tiền ra** phải ra **87.543 VND** tiền ra. **Test loại OTP** phải hiện **Đã loại bỏ OTP; không tạo giao dịch**.
5. Nếu chỉ thấy “đang chờ Android gọi listener”, bài test chưa thành công. Kiểm tra Notification Access và kênh **FinWeave · thông báo kiểm thử** trong cài đặt Android. Không xem việc bấm nút phát notification là kết quả nhận.
6. Dùng **Dừng và xóa kết quả test** khi xong. Phiên tự hết hạn sau 15 phút; kết quả chỉ giữ trong RAM, mất khi process kết thúc. Đăng xuất dừng test.

Đường test: NotificationManager → hệ điều hành Android → CollectorListener → parser VCB ứng viên → kết quả kiểm thử trong UI. Chỉ những fixture cố định do chính FinWeave phát trong phiên được nhận; package/channel/id/tag nonce/nội dung phải khớp. Không đọc nội dung app khác để làm test, không nới registry ngân hàng/ví, không tạo enrollment giả và không upload.

Bài này kiểm được quyền OS, kết nối listener, tiền vào/ra và loại OTP. Nó chưa kiểm end-to-end enrollment → encrypted outbox → HTTPS backend → ghi sổ; không tự tạo giao dịch trong sổ từ thông báo giả. Nhập tay/CSV và các chức năng UI vẫn test bằng demo như trước. Capture ngân hàng/ví thật và đồng bộ native cần hoàn thiện các đầu vào ở cuối tài liệu.

Sau buổi thử, tắt USB debugging và thu hồi quyền debug máy tính trên điện thoại. Không chạy lệnh tắt Play Protect hoặc package verifier. Nếu có hạn chế OEM/quản lý thiết bị, không tự bỏ chính sách đó để ép cài.

## Nhận thử ZaloPay thật

Bản0.1.8 có thẻ **Xem trước ZaloPay thật** chỉ trên SO-01M/Android11 và đúng ZaloPay11.14.0 đã đo. Chủ động đồng ý nhận và phân tích cục bộ rồi bật phiên15phút; có thể hiện số tiền/hướng tiền ứng viên nếu câu chữ rõ ràng. Tên/tài khoản/ref/thời gian/free text được che, OTP loại cả thông báo; kết quả chỉ trong RAM, không upload hoặc tự ghi sổ. Có mục **Test bộ đọc ZaloPay bằng dữ liệu giả**: tiền vào130.000đ, tiền ra45.000đ, không xác định. Bài này gọi native parser bằng fixture cố định; không phát thông báo giả mạo ZaloPay và không chứng minh mẫu ví thật khớp. Xem [hướng dẫn test ZaloPay](zalopay-real-test.md). Tự ghi tiền thật vẫn chờ mẫu nguồn được xác minh/enrollment/backend.

## Android Emulator

Trong Android Studio Device Manager, tạo một thiết bị thử với system image có Google Play nếu muốn quan sát Play Protect. Không đăng nhập tài khoản ngân hàng hay lưu thông tin thật trong emulator. Khởi động một emulator rồi chạy:

```powershell
./finweave-web/scripts/install-pilot.ps1 -Target Emulator
```

Workspace hiện có platform-tools/ADB nhưng chưa có emulator/system image; chưa tạo hoặc chạy AVD. Emulator kiểm luồng Android bằng dữ liệu demo, không chứng minh tương thích app ngân hàng thật/OEM/capture nền.

Chỉ kiểm file, không cài:

```powershell
./finweave-web/scripts/install-pilot.ps1 -VerifyOnly
```

Giới hạn app hiện có: registry nguồn thật trống, enrollment và HTTPS backend chưa nối; mô phỏng UI/commands đã hoạt động, còn tự ghi nhận giao dịch ngân hàng thật vẫn cần những đầu vào này. Xem [báo cáo](../execution/android-play-protect-2026-10-12.md).
