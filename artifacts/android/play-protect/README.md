# Hồ sơ yêu cầu Play Protect xem xét

Hồ sơ được chuẩn bị local, **chưa xác nhận tải đúng APK lên VirusTotal, chưa gửi Google, chưa được chấp thuận**. Giữ nguyên chức năng tự ghi nhận bằng NotificationListener.

Form chính thức: https://support.google.com/googleplay/android-developer/contact/protectappeals

Form yêu cầu email, package name, SHA-256 của APK đã upload VirusTotal và giải thích. Upload APK lên VirusTotal đưa binary ra một dịch vụ bên ngoài; cần chủ app đồng ý trước khi thực hiện. Không đưa signing key, password, nguồn code, token hoặc thông tin ngân hàng vào hồ sơ.

- `submission-record.json`: phân biệt bản 0.1.2 nghi là file bị chặn và bản 0.1.4 đầy đủ chưa thử trên máy. Ảnh không hiển thị phiên bản; cần xác nhận đúng file trước khi gửi.
- `appeal-observed-0.1.2.txt`: bản nháp cho APK cũ. Chỉ dùng đúng hash 0.1.2 và đúng binary nếu xác nhận file bị chặn là bản này.
- `candidate-0.1.4.txt`: thông tin bản đầy đủ mới. Nếu 0.1.4 vẫn bị chặn, bổ sung bằng chứng rồi dùng hash/binary 0.1.4. Không lấy hash 0.1.3 rút gọn.

Chủ app đã cho phép upload APK 0.1.4 và gửi hồ sơ, với email `ntd.cecmat@gmail.com`. Form đã điền email, tên app FinWeave và package; chưa bấm Submit. Filechooser của trình duyệt bị timeout, chưa xác nhận báo cáo VirusTotal khớp hash APK. Còn cần hoàn tất upload đúng binary trước khi gửi; không cần xin lại quyền đã được cấp. Quyết định thuộc Google; không bảo đảm khiếu nại được chấp thuận. Theo form hiện tại, quyết định là cuối cùng và Google không gửi phản hồi. Kiểm lại cài đặt/quét trên thiết bị để xác nhận kết quả.

Tham khảo: [hướng dẫn cảnh báo](https://developers.google.com/android/play-protect/warning-dev-guidance), [form xem xét](https://support.google.com/googleplay/android-developer/contact/protectappeals).
