# Biên bản kiểm tra bộ tài liệu

Ngày 28/10/2026. Phạm vi: bộ phân tích ca sử dụng và kiến trúc; không kiểm thử lại runtime ứng dụng.

- 50 ID ca chi tiết duy nhất và 7 ca tổng quan; các ca chi tiết có đủ trường đặc tả.
- 12 quan hệ include/extend có endpoint hợp lệ; các extend có điều kiện và extension point.
- Kiểm các liên kết Markdown nội bộ tới file/thư mục có thật; kết quả máy đọc tại [validation.json](validation.json).
- 11 sơ đồ SVG đã render thành PNG; kiểm hình tổng hợp và các hình nhiều quan hệ ở kích thước đọc được.
- 9 file PlantUML có source và quan hệ từ cùng model; **chưa render bằng engine PlantUML**. Bản PNG/SVG được dựng trực tiếp, không phải ảnh render từ PlantUML.
- Kiểm HTML bằng trình duyệt: **11 kiểm tra PASS**, không có lỗi JavaScript. Gồm 50 thẻ ca, 11 hình nhúng, tìm theo ID, tìm tiếng Việt không dấu, lọc phân hệ, mở ca/đọc hậu điều kiện, phóng hình và bố cục 390px không tràn trang. Chi tiết tại [ui-validation.json](ui-validation.json).
- Đã xem ảnh tổng hợp 11 sơ đồ; xem riêng các hình nhiều quan hệ, ảnh đầu trang desktop và mobile. [Desktop](report-preview.png) · [Mobile](report-mobile-preview.png) · [Tổng hợp sơ đồ](diagram-contact-sheet.png).

Các kết quả triển khai trong phần kiến trúc được trích từ báo cáo có ngày/revision; không dùng kiểm tra tài liệu này để xác nhận production, model thật hoặc Android/nguồn tài chính thật.
