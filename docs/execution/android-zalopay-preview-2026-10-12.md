# FinWeave0.1.6 — nhận thử ZaloPay cục bộ

Người dùng chọn ZaloPay thật, đã cài app riêng và xác nhận bật thông báo trên Sony SO-01M/Android11 kết nối USB.0.1.6 giữ collector đầy đủ, bổ sung phiên xem trước opt-in15phút; chưa tự ghi tiền thật hoặc nối backend.

## Thay đổi

- Đo installed APK version/current signer; [metadata](evidence/android-notification-test-2026-10-12/zalopay-installed-identity.json) ghi Google Play installer, version11.14.0/code1074603. Chỉ kéo binary đã cài để đo; không đọc account-private files/raw notification, không upload.
- Local allowlist riêng exact package/signerset/version/Sony-SO01M/API30, expiry12/11/2026UTC. Package visibility chỉ ZaloPay, không QUERY_ALL_PACKAGES. Metadata gates kiểm trước extras. Local preview không vào live registry.
- Opt-in UI/native bridge riêng, origin https://localhost/exact input keys; giới hạn15phút monotonic,20mẫu/100occurrence RAM. Output chỉ fixed labels/placeholders, không giữ tiền/tên/account/ref/time/free text. OTP/PIN/password/mã xác thực bất cứ field nào loại cả notification; không upload/Room/ledger.
- User dừng hoặc logout xóa ngay; guard expiry/unlock/access/listener/consent/source trước callback/status. TTL enforce lúc callback/status, không có timer xóa lúc process suspend; RAM mất khi process chết.
- Giữ nguồn demo/test notification giả, collector/outbox/Keystore/Room/WorkManager và toàn bộ UI; versionCode7/cùng khóa pilot.

## Kết quả kiểm

Web136tests PASS. Native policy tests mới kiểm identity/expiry, live registry, OTP mọi field, redaction/bounds. Native29tests + template1 PASS; lint0errors/38warnings. Release/instrumentation compile, signature/manifest/DEX/source-assets-APK hashes và API005/JCS/ES256 proof PASS. Cài USB0.1.6/code7 Success, process chạy và quyền/binding listener PASS. [Evidence](evidence/android-zalopay-preview-2026-10-12/verification.json), [cài thiết bị](evidence/android-zalopay-preview-2026-10-12/device-install.json). APK SHA256 `bd0e8fdd3a991dab40ebf005d837f02c985130c71a239fafbd767bd36b9fcbe5`, giữ chứng thư pilot.

Callback ZaloPay cần người dùng bật phiên và có OS notification mới; chưa ghi PASS cho callback, parser tiền vào/ra, background/reboot, encrypted outbox hoặc backend ledger. Không yêu cầu chuyển tiền để test.

Google Play Protect/direct Internet sideload vẫn NOT_CONFIRMED; upload VirusTotal/appeal0.1.4 vẫn NOT_SUBMITTED. Build/cài development không thay Google verdict. Hướng dẫn [test ZaloPay](../android/zalopay-real-test.md).

Người dùng gửi ảnh màn hình chi tiết giao dịch trong ZaloPay; đây là receipt UI, không phải OS notification/extras. Không lưu tên/tài khoản/ref hoặc ảnh này trong repo, không dùng để tự tạo grammar notification hay chứng minh capture đã thành công.

Người dùng xác nhận bài Test tiền vào đã hiện thông báo tiền vào giả lập. Ghi USER_CONFIRMED cho hiển thị notification giả; không suy ra callback parse đã được nghiệm thu hoặc nhận notification ZaloPay thật. Không thay đổi kênh thông báo, không tạo kênh mới để vượt thiết lập người dùng.
