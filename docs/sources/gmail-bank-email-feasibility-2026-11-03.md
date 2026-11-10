# Nhận email giao dịch BIDV / Vietcombank qua Gmail

Ngày kiểm tra: 03/11/2026 (Asia/Bangkok). Phạm vi: kiểm tra source hiện có và tài liệu chính thức; chưa kết nối hộp thư, chưa đọc email thật, chưa triển khai connector hoặc xác nhận end-to-end.

## Kết luận

Có thể xây kênh Gmail API để nhận email giao dịch ngân hàng, độc lập với việc Gmail có phát notification Android hay không. FinWeave hiện chưa có kênh này. Tài liệu BIDV và VCB xác nhận dịch vụ email **kết quả giao dịch**, nhưng chưa đủ căn cứ để coi đây là luồng đầy đủ mọi biến động số dư. Phải xác minh riêng tiền vào, tiền ra, phí, chuyển nội bộ, giao dịch thẻ, hoàn/đảo và giao dịch ngoài ứng dụng.

## Những điểm đang chặn trong code

| Thành phần | Bằng chứng trong workspace | Ý nghĩa |
| --- | --- | --- |
| Android | `finweave-web/android/app/src/main/java/test/finweave/prototype/collector/Parser.kt`: `SourceCatalog.liveProfiles = emptyList()` | Chưa có profile nhận nguồn thật được bật. |
| Listener | `CollectorListener.kt`: tìm profile theo package rồi return nếu không có | Bật quyền đọc thông báo chưa làm app tự nhận giao dịch; notification Gmail cũng chưa có đường xử lý. |
| Backend PostgreSQL | `finweave-backend/src/runtime/sources.ts`: `safeItem()` chỉ nhận `synthetic-bank`/`synthetic-v1`; `bindCollector` chỉ chấp nhận synthetic package/parser | Không thể chỉ thêm parser phía điện thoại rồi gửi email thật vào endpoint hiện tại. |
| Hosted demo | `sites/finweave-demo/README.md`, `server/demo.ts` | Web demo dùng workspace mẫu riêng; không host backend PostgreSQL hoặc Android collector. Giá thị trường thật không đồng nghĩa có dữ liệu ngân hàng thật. |
| Gmail | Kiểm tra source native, backend runtime và hosted demo | Chưa thấy connector Gmail/IMAP, scope Gmail, OAuth cho hộp thư hoặc worker đồng bộ email. Email OTP đăng nhập FinWeave là chức năng khác. |

Đây là kết luận từ source trong workspace, không phải xác nhận trạng thái mọi APK hoặc deployment đang chạy trên thiết bị của người dùng.

## Bật email ngân hàng

**BIDV:** theo hướng dẫn SmartBanking bản web: Quản lý dịch vụ → Đăng ký email thông báo → nhập địa chỉ Gmail → Đăng ký ngay → xác thực theo ngân hàng. Có chức năng sửa địa chỉ và hủy đăng ký. Tên màn hình trên ứng dụng điện thoại có thể khác bản web.

- [BIDV: đăng ký email kết quả giao dịch](https://omni.bidv.com.vn/static/bidv/hdsdib/pages/vi/5-cai-dat-gui-mail-thong-bao-ket-qua-giao-dich/1-dang-ky-nhan-email-thong-bao-ket-qua-giao-dich.html).
- [BIDV: sửa địa chỉ email](https://omni.bidv.com.vn/static/bidv/hdsdib/pages/vi/5-cai-dat-gui-mail-thong-bao-ket-qua-giao-dich/2-cap-nhat-dia-chi-email-nhan-thong-bao-giao-dich.html).

**Vietcombank:** Trang chủ → Cài đặt → Quản lý email → Đăng ký nhận kết quả giao dịch qua email. FAQ chính thức cũng hướng dẫn kiểm tra địa chỉ đăng ký, thư rác và danh sách chặn nếu không nhận được thư.

- [VCB Digibank: FAQ giao diện mới](https://digibankm5.vietcombank.com.vn/get_file/ibomni/html/faq_uiux/index.html?theme=theme-mass).

Chưa xác minh biểu phí hoặc phạm vi email cụ thể của tài khoản người dùng. Không suy luận rằng đăng ký email thông tin khách hàng, email OTP hay sao kê thẻ đồng nghĩa đã bật email giao dịch tài khoản.

## Phương án tích hợp đề xuất

Luồng: ngân hàng gửi thư → Gmail → connector được người dùng cấp quyền → xác minh thư và parser theo ngân hàng → bản ghi chờ duyệt → người dùng xác nhận → sổ giao dịch.

1. **Gmail API + OAuth, quyền đọc:** dùng `gmail.readonly` để đọc nội dung. Không cần quyền gửi/xóa thư. Phạm vi quyền này cho phép đọc hộp thư; nhãn hoặc query ngân hàng chỉ là bộ lọc trong ứng dụng, không phải giới hạn quyền OAuth vào vài thư. `gmail.metadata` không đọc được body. [Google: scopes](https://developers.google.com/workspace/gmail/api/auth/scopes).
2. **Thử local trước:** đồng bộ theo lịch khi tiến trình đang chạy; chu kỳ dự kiến 60–120 giây là lựa chọn triển khai, không phải cam kết thời gian nhận của ngân hàng. Lần đầu chỉ lấy khoảng lịch sử người dùng chọn; phân trang đầy đủ, lưu checkpoint và ID đã xử lý. Sau đó dùng `history.list`; cursor hết hạn/404 thì đồng bộ lại khoảng cần thiết và chống trùng. Không dựa vào trạng thái đã đọc/chưa đọc. [Google: đồng bộ](https://developers.google.com/workspace/gmail/api/guides/sync).
3. **Nếu chạy server liên tục:** có thể dùng Gmail `watch` + Cloud Pub/Sub; thông báo thay đổi chứa thông tin checkpoint chứ không chứa toàn bộ giao dịch. Phải lấy thư qua API, gia hạn watch ít nhất mỗi bảy ngày (Google khuyến nghị hằng ngày), có đường đồng bộ bù và xử lý thông báo lặp/mất. [Google: push](https://developers.google.com/workspace/gmail/api/guides/push).
4. **Bộ đọc riêng BIDV/VCB:** xác minh địa chỉ/domain và kết quả xác thực email từ hệ thống nhận tin đáng tin cậy; tên hiển thị hoặc trường From đơn lẻ không đủ. Giải mã MIME text/HTML, không chạy script hoặc tải tài nguyên từ thư. Bỏ OTP, quảng cáo, đăng nhập, giao dịch thất bại/chờ xử lý. Không đoán mẫu hay hardcode địa chỉ gửi khi chưa có mẫu được kiểm chứng.
5. **Chuẩn hóa:** lấy số tiền chính xác, đơn vị tiền, hướng tiền theo tài khoản đã liên kết, thời điểm giao dịch, mã tham chiếu và trạng thái. Phân biệt số tiền giao dịch với số dư, phí và tài khoản thụ hưởng. Không dùng ngày nhận thư thay ngày giao dịch một cách im lặng. Thiếu thông tin thì chờ duyệt.
6. **Chống trùng hai tầng:** hộp thư + Gmail message ID ngăn nhập lại cùng thư; tài khoản + tham chiếu giao dịch đã kiểm chứng giúp đối chiếu email/notification/CSV. Cùng số tiền và cùng phút chỉ tạo nghi vấn trùng, không tự xóa giao dịch. Chuyển giữa hai tài khoản của chính người dùng cần ghép thành chuyển khoản, tránh tính hai lần thu/chi.

Để giữ ranh giới riêng tư hiện có, bản thử đầu nên xử lý nội dung thư trên thiết bị hoặc tiến trình local do chủ sở hữu chạy; chỉ chuyển dữ liệu tối thiểu đã chuẩn hóa lên backend. Không ghi raw email, OTP, token hoặc tài khoản đầy đủ vào log/repo/model. Thiết kế Gmail worker trên cloud sẽ thay đổi ranh giới xử lý raw hiện hành và cần được mô tả riêng.

`gmail.readonly` thuộc restricted scope. Phát hành rộng rãi cần xử lý OAuth verification theo Google; lưu/truyền restricted data trên server có yêu cầu security assessment. Không coi cấu hình test cá nhân là cấu hình sản xuất. [Google: scopes và yêu cầu](https://developers.google.com/workspace/gmail/api/auth/scopes). OAuth app External ở trạng thái Testing có thể có refresh token hết hạn bảy ngày khi dùng scope Gmail; cần hiển thị yêu cầu kết nối lại, không báo nguồn vẫn hoạt động. [Google: token expiration](https://developers.google.com/identity/protocols/oauth2#expiration).

## Trình tự triển khai và kiểm chứng

1. Xác nhận email giao dịch cũ có sẵn trong Gmail cho từng ngân hàng, bao gồm tiền vào và tiền ra; chưa cần tạo giao dịch tài chính mới để thử. Hiện kết nối Gmail trong chat chưa được xác nhận. Kết nối đó hỗ trợ kiểm tra mẫu, không tự tạo connector bên trong FinWeave.
2. Xác nhận mẫu thư, sender/authentication, trường tiền/ngày/tài khoản/trạng thái. Tạo fixture đã thay dữ liệu cá nhân bằng dữ liệu giả để kiểm parser.
3. Xây connector local read-only và màn hình trạng thái: lần đồng bộ cuối, số thư đọc, nhận diện được, bỏ qua, chờ duyệt, lỗi và kết nối lại. Token giữ trong kho bảo mật của môi trường chạy.
4. Thêm source/binding Gmail và đường nhập có xác thực, đúng chủ sở hữu, idempotency, thu hồi quyền và retention. Không nới `safeItem()` thành nhận mọi nguồn hoặc giả danh Gmail thành synthetic/Android device.
5. Kiểm chứng end-to-end: thư hợp lệ tạo đúng một bản chờ duyệt; đồng bộ lại không trùng; OTP/thư giả/thư không hỗ trợ không ghi sổ; lỗi parse hiện rõ; ngắt OAuth dừng nhận; email + notification + CSV không cộng lặp.

Trạng thái sau khảo sát: **khả thi về kỹ thuật; chưa có bằng chứng Gmail thật → FinWeave → giao dịch được duyệt**. Chỉ thêm tài liệu khảo sát, không thay đổi runtime hoặc triển khai app.
