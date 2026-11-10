> **Cập nhật tiếp theo: đọc chung cho các ngân hàng.** Giới hạn BIDV của lượt triển khai ban đầu bên dưới đã được thay bằng [bộ đọc fields-v2 và bằng chứng mới](screenshot-multi-bank-2026-11-03.md).

# Cập nhật nhập giao dịch bằng ảnh — 03/11/2026

Chủ dự án chọn cập nhật cả ứng dụng và tài liệu, chuyển phương thức nhập chính sang ảnh do người dùng chủ động chọn/chụp. [Yêu cầu và thiết kế hiện hành](../product/screenshot-transaction-entry.md).

## Thay đổi

- Trang Giao dịch và Nguồn dữ liệu có chọn tài khoản, chọn ảnh/máy ảnh, tự lưu khi đầy đủ thông tin, kiểm tra/sửa/subset và kết quả lưu/bỏ qua trùng.
- Bộ đọc Windows OCR cục bộ; bộ chuẩn hóa mẫu BIDV tách nhiều thông báo, số tiền có dấu, ngày giờ, tài khoản, nội dung, mã. Bỏ qua số dư cuối. Không dùng tên model chat để giả lập đọc ảnh.
- Hai operation owner mới qua cùng session/CSRF/native proof và phiên bản workspace. Lưu qua engine hiện có, toàn bộ subset nguyên tử, idempotency và chống trùng. Nguồn ảnh và thời điểm giao dịch xuất hiện trong chi tiết.
- Bản đọc ảnh hết hạn 24 giờ; nguyên văn OCR, hash và dữ liệu đã xác nhận lưu làm bằng chứng. Không sửa baseline lịch sử hoặc tự nhập ảnh thật của người dùng vào ledger.

## Kiểm chứng

| Nhóm | Phương pháp / bằng chứng |
| --- | --- |
| Đọc ảnh mẫu thật | [Kết quả OCR](evidence/screenshots-2026-11-03/sample-ocr.json). Windows OCR `en-US` đọc hai khoản trái chiều, ngày/giờ và trường nguồn. Không lưu nguyên văn riêng tư vào báo cáo và không nhập giao dịch mẫu. |
| Parser | `node --test tests/screenshot.test.ts` tại backend. Tám test gồm nhiều dòng, lỗi dấu tiếng Việt/CD, bỏ qua số dư, dấu tiền, ngày sai, thất bại/chờ/refund/nội bộ, ngoại tệ, byte ảnh. |
| HTTP/PostgreSQL | 15 nhóm đạt, thêm kiểm ánh xạ số tài khoản theo hai chiều. `node scripts/test-screenshots.ts` tại backend dùng OCR được thay bằng dữ liệu kiểm thử để kiểm xác thực, nguyên tử, retry, dedupe, evidence, review, account mismatch, CSRF, version và hết hạn. [Receipt cuối](evidence/screenshots-2026-11-03/1793696262082.json). |
| Giao diện và OCR thật | 6 luồng đạt với `node tools/operations/test-screenshot-ui.mjs`: ảnh giả, Edge, backend/DB riêng, OCR Windows thật. Cổng riêng giữ nguyên ứng dụng người dùng đang mở. [Receipt cuối](evidence/screenshots-2026-11-03/ui-1793696420944/results.json), [desktop](evidence/screenshots-2026-11-03/ui-1793696420944/desktop.png), [mobile 390 px](evidence/screenshots-2026-11-03/ui-1793696420944/mobile.png). |
| Hồi quy | Type backend/frontend đạt; backend 85 unit và frontend 140 unit đạt; build user/admin đạt. Parser 8 test được kiểm lại sau bổ sung yêu cầu có đơn vị tiền. Receipt thất bại trước đó giữ nguyên. |
| Android | Build debug/backend local đạt; 44 JVM test, không skip/failure. Kiểm schema/allowlist trong APK và chữ ký đạt. [APK và hướng dẫn](../../artifacts/android/screenshots/README.md), [receipt](evidence/screenshots-2026-11-03/android-build/results.json). Chưa kiểm camera hoặc thiết bị thật. |

## Dùng thử

Mở lại bản local bằng `Start-FinWeave.cmd` để backend đọc được extension mới, vào **Giao dịch**, chọn tài khoản ngân hàng phù hợp và **Chọn ảnh giao dịch**. Có thể tắt tự lưu để kiểm tra mọi dòng. Ảnh ngoài mẫu hoặc thiếu trường sẽ chờ xác nhận; gửi lại ảnh cùng mã giao dịch sẽ được bỏ qua. Tạo tài khoản tiền trước nếu danh sách tài khoản còn trống.

OCR Windows phụ thuộc ngôn ngữ đã cài. Máy hiện có `en-US`, có thể đọc sai tên/nội dung tiếng Việt; không có cam kết OCR chính xác hoàn toàn. APK pilot cũ vẫn được giữ; bản debug local mới được bàn giao riêng, chưa coi build là bằng chứng cài APK hay camera thật. Notification collector vẫn là tùy chọn, không còn điều kiện cần cho luồng nhập ảnh.
