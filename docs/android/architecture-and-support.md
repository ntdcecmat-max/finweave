# Android component ownership và support

## Quyết định

React/Vite assets đóng trong APK, Capacitor8 làm shell; Kotlin chịu quyền OS, auth/proof/HTTP, notification capture, Room, Keystore, WorkManager. Owner UI vẫn có toàn bộ nghiệp vụ user như web. Không có admin UI/worker service credentials trong APK. Server Engine duy nhất quyết định actual; capture/ACK/native parser không tự tạo ledger. Không remote web app thay assets qua server.url ở REAL; cập nhật code qua signed APK.

| Component | Trách nhiệm / không vượt quyền |
| --- | --- |
| Bundled WebView | Render owner data/draft; gọi typed bridge, không giữ access/refresh/collector token hoặc raw notification |
| FinWeaveIdentity | Installation key, owner login/challenge/reauth/refresh, token vault, collector enrollment handlers; không cung cấp sign arbitrary bytes |
| FinWeaveOwnerApi | Allowlist owner operationId + API004 input schema; native inject auth/proof, validate bounded reply; không arbitrary URL/header/credential |
| FinWeaveCollector | Seven legacy methods qua adapter + v2 status/config actions; consent/source/binding/status, không generic SQL/file/HTTP |
| NotificationListenerService | Chỉ callback sources được bật và support catalog hợp lệ; extract tối thiểu có bound, normalize memory, enqueue ciphertext |
| LocalQueueRepository | Một owner/workspace/device epoch bất biến mỗi item; atomic state/batch/ACK journal; không actual |
| NativeUploader/WorkManager | Một scoped uploader; network/retry constraints + ARCH09; không cần owner login mỗi ngày |
| API/Engine | Auth/receipt/dedupe/review/posting/version/coverage; Ops app-admin không đọc finance |

## Android/permission matrix

[Capacitor8 guide](https://capacitorjs.com/docs/updating/8-0) cho framework floor API24 và target/compile36. **Product APK minSdk24**, giữ khả năng kiểm cả máy cũ; chưa OS/OEM nào được chứng nhận hỗ trợ collector. Ma trận kiểm ban đầu: API24/29/32 compatibility; API33/34/35/36 full suites; API37+ chưa thẩm định, không tự ghi supported. Release support được xác định bởi kết quả trên model/OS/source app/version cụ thể, không chỉ minSdk. Không tự cắt feature trên máy cũ; fallback manual/CSV khi collector không khả dụng. Toolchain snapshot không phải lời khẳng định phiên bản patch mới nhất.

Emulator kiểm install/bridge/Room/faults bằng notifications synthetic; ít nhất một Android thật do owner dùng, cộng model/OEM thứ hai trước tuyên bố đa OEM. Ghi Android build/security patch/WebView/app bank/parser/build/cert; emulator không chứng minh notification ngân hàng thật. Thử low RAM/API29, work profile và enterprise policy nếu muốn hỗ trợ; [NLS](https://developer.android.com/reference/android/service/notification/NotificationListenerService) nêu giới hạn các môi trường này.

Notification access là OS special access qua Settings, khác `POST_NOTIFICATIONS` cho thông báo trạng thái FinWeave ở API33+. Không xin READ_SMS/email/Accessibility/QUERY_ALL_PACKAGES, không pretend browser đọc notification. Manifest listener có BIND_NOTIFICATION_LISTENER_SERVICE và action chuẩn; nếu exported để hệ thống bind thì chỉ permission đặc quyền đó cho phép, thử app khác gọi service phải bị chặn. Các component nội bộ không exported; launcher Activity chỉ nhận intents đã kiểm, không arbitrary bridge deep link. `<queries>` chỉ packages nguồn định hỗ trợ theo [package visibility](https://developer.android.com/training/package-visibility/declaring), xác minh signer/version của source; ARCH11 chưa chọn package thật.

Permission granted chưa đủ: cần consent version hiện hành, listener bound, unlocked vault, valid clock, enrolled live owner/device/binding/catalog, capacity và không paused. `onListenerConnected`/disconnect và foreground recheck mới cập nhật readiness, không coi quay lại Settings là granted. Own-push denied không được ghi notification access denied; hiển thị cảnh báo health riêng. [Restricted settings](https://support.google.com/android/answer/12623953?hl=en) có thể ảnh hưởng APK sideload; mở hướng dẫn OS phù hợp, không bypass hay yêu cầu tắt bảo vệ toàn thiết bị. [Android15](https://developer.android.com/about/versions/15/behavior-changes-all) có thể che OTP; không tìm cách lấy lại OTP.

WorkManager một lần khi capture/network recovery, periodic safety15min và backoff tối thiểu30s; OS có thể hoãn, [không lịch chạy chính xác](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work). No exact alarm/always foreground service/default battery-exemption request. Một unique work name theo opaque scoped vault ID, database fence + upload mutex, không email/account ở work name/Data. Reboot chỉ tiếp tục sau first unlock và eligibility/clock check. Không DirectBoot lưu financial data theo [storage model](https://developer.android.com/privacy-and-security/direct-boot).

Doze/OEM/force-stop/permission revoke/network gap có thể làm mất observation chưa thấy; ghi gap từ last confirmed health đến resumed health, không biết chính xác số giao dịch mất. Startup inventory activeNotifications chỉ kiểm health, **không tự ingest lịch sử**. Không notification không có nghĩa không phát sinh giao dịch. Phần server price scheduler chạy độc lập điện thoại.
