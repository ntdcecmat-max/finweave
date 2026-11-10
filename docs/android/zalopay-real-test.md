# Kiểm thử nguồn ZaloPay trên điện thoại

12/10/2026. Người dùng đã cài ZaloPay riêng trên SO-01M/Android11 và xác nhận bật thông báo. Metadata: package `vn.com.vng.zalopay`, version11.14.0/code1074603, installer `com.android.vending`, signer SHA256 `59dd31fdf36070a0d7f8c8cde843fac371df7f1a915c0136c9c9b55992e8cdae`. [Bằng chứng đo](../execution/evidence/android-notification-test-2026-10-12/zalopay-installed-identity.json) chỉ chứa metadata APK; không đọc notification/dữ liệu tài khoản. Package đối chiếu [Google Play chính thức](https://play.google.com/store/apps/details?id=vn.com.vng.zalopay).

## Phiên xem trước trong0.1.8

1. Tự đăng nhập ZaloPay, bật thông báo và danh mục giao dịch nếu có. [Google hướng dẫn](https://support.google.com/android/answer/9079661?hl=vi). Không gửi mật khẩu/OTP.
2. FinWeave → **Nguồn dữ liệu → Thiết lập Android**. Thẻ **Test nhận thông báo trên điện thoại** phải có quyền đọc và listener kết nối.
3. Thẻ **Xem trước ZaloPay thật**: đồng ý nhận thử và phân tích số tiền/hướng tiền cục bộ rồi **Bật nhận thử ZaloPay**. Exact package/current signer/version, Sony/SO-01M/API30 và Google Play installer phải khớp. App cập nhật hoặc thiết bị khác cần đo lại; không tự chấp nhận signer rotation. Bỏ chọn đồng ý trong phiên sẽ dừng và xóa mẫu.
4. Dùng ZaloPay bình thường; khi có OS notification mới, quay lại FinWeave. Không cần chuyển tiền chỉ để test. Biên lai/thông báo bên trong app không thay OS notification. Không lấy lịch sử trước khi bật phiên.
5. **Android đã chuyển thông báo ZaloPay** cùng mẫu `[TEXT]`, `[NUMBER]`, `[PAYMENT]`, `[SUCCESS]`... xác nhận callback thật. Bộ đọc ứng viên chỉ nhận câu chữ rõ chủ thể như “Bạn đã nhận được …”/“Bạn đã chuyển …”/“Thanh toán thành công …” cùng một số tiền VND. Có thể hiện **Tiền vào/ra: … đ**, ghi rõ nhận diện thử; nội dung khác hiện **Chưa xác định**, không đoán theo dấu +/− hoặc từ “chuyển tiền” riêng lẻ. Tên/tài khoản/ref/thời gian/free text không được giữ hoặc xuất bridge; chỉ amount nguyên VND/direction/reason và hình dạng trường trong RAM. OTP/PIN/password/mã xác thực ở bất cứ field nào loại cả bản, chỉ tăng bộ đếm.
6. **Dừng và xóa mẫu** khi xong. Tối đa15phút monotonic,20mẫu/100occurrence trong RAM; mất khi process kết thúc. Hết hạn, mất unlock/quyền/consent/binding hoặc nguồn không khớp sẽ dừng/xóa khi gate kiểm tra; logout dừng ngay. Không lưu file/Room/log/raw, không upload. TTL được enforce khi callback/status; không có timer xóa khi process suspend.

Đây là test nhận notification và bộ đọc ứng viên cục bộ, chưa tự ghi giao dịch thật. Không có mẫu giao dịch OS notification ZaloPay thật để đối chiếu các quy tắc chung. Finality/account binding chưa xác minh; live registry vẫn trống, native identity/enrollment và HTTPS backend chưa nối. Local preview không vào live registry, không tạo enrollment giả hoặc bỏ gate collector. Các chức năng demo, notification giả, nhập tay/CSV vẫn giữ.

### Test bộ đọc không cần thông báo ZaloPay

Ngay trong thẻ, cuộn đến **Test bộ đọc ZaloPay bằng dữ liệu giả**. **Test ZaloPay tiền vào** phải hiện130.000đ tiền vào; **Test ZaloPay tiền ra** phải hiện45.000đ tiền ra; **Test không xác định** phải để trống tiền/hướng. Đây là fixture generic được tạo sẵn, không giả mạo thông báo từ ZaloPay và không ghi sổ. Thẻ **Test nhận thông báo trên điện thoại** phía trên vẫn kiểm Android NotificationManager→listener bằng fixture FinWeave như trước.

## Trước ghi sổ tự động

Mẫu che chỉ chứng minh callback/hình dạng trường, chưa chứng minh đúng tiền/hướng tiền. Cần fixture thay bằng dữ liệu giả giữ đủ cấu trúc; kiểm tiền vào/ra, pending/failed/refund, fee/transfer, duplicate/update, time/finality và OTP. Sau đó nối đăng ký thiết bị/tài khoản/backend HTTPS/ledger-reconciliation, test end-to-end trước công bố tự ghi nguồn thật. Không đánh dấu PASS vì APK build/cài thành công.

Cài0.1.8 qua USB development/cùng khóa pilot không chứng minh Google Play Protect duyệt APK tải Internet. Hồ sơ Google0.1.4 vẫn chưa gửi. Không thay notification bằng SMS/accessibility hoặc tắt Play Protect.
## Chẩn đoán trong0.1.7

Thẻ ZaloPay hiện quyền/listener, phút còn lại và **Android đã chuyển X thông báo ZaloPay**. Nếu X=0 trong phiên đang bật, app chưa nhận callback nguồn; chưa thể suy ra ZaloPay chưa phát hay Android chưa chuyển. Nếu X>0 nhưng không có mẫu, xem bộ đếm OTP/sensitive hoặc summary/empty/oversize. Mẫu hết phiên bị xóa; không đọc lại lịch sử cũ. Nút **Cài đặt thông báo ZaloPay** mở đúng settings app để người dùng tự kiểm các danh mục. FinWeave preview không tự phát OS notification xác nhận sau giao dịch.

Thẻ Test có **Cài đặt thông báo FinWeave** mở đúng channel; canPost xét cả app/channel/group blocked. Số **Android đang giữ X thông báo test** chỉ đọc metadata notification chính FinWeave phát, không đọc app khác. Kênh default có thể không bật biểu ngữ; kiểm bằng thanh thông báo. Không tạo channel mới để vượt preference người dùng.
