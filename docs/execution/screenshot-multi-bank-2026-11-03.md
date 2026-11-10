# Đọc ảnh giao dịch chung cho các ngân hàng

03/11/2026 · thực hiện yêu cầu bỏ giới hạn một mẫu/ngân hàng. [Yêu cầu hiện hành](../product/screenshot-transaction-entry.md).

## Kết quả và cách nhận diện

Thay parser BIDV bằng bộ đọc trường thông tin dùng chung `fields-v2`. Không dùng tên ngân hàng làm điều kiện nhận diện hoặc tự lưu. Tên biết trước chỉ phục vụ hiển thị; tên mới hoặc không hiện tên vẫn sử dụng cùng parser và luồng ghi số dư.

- Tìm khoản tiền tăng/giảm có đơn vị VND, phân biệt khỏi số dư và phí. Hỗ trợ dấu tiền, ghi Có/ghi Nợ, credited/debited, thông báo văn xuôi, trường theo dòng, card ngày và dấu `|`.
- Tách nhiều thông báo, xử lý nhãn OCR dính, ngày ISO/dd-MM-yyyy, năm rút gọn theo ngày chung hoặc kỳ theo dõi có duy nhất một đáp án. Không lấy thời gian trên thanh trạng thái điện thoại.
- Không bắt ảnh phải có mã tham chiếu, số tài khoản đầy đủ, tên ngân hàng hoặc giờ. Người dùng chọn tài khoản để nhận biến động. Số tài khoản đầy đủ tại ngân hàng khác nhau là các định danh khác nhau; số bị che chỉ được so theo phần hiện rõ.
- So sánh OCR gốc và ảnh tăng tương phản. Không tự ghi khi hai lượt mâu thuẫn về trường tài chính; số tiền chứa chữ O do OCR được chuẩn hóa để xem nhưng phải đối chiếu trước khi lưu.
- Không có mã nguồn: cùng ảnh được nhận trùng; ảnh khác có giao dịch tương tự sẽ chờ người dùng xác nhận đó là giao dịch khác. Xác nhận này không áp dụng cho chế độ tự động.

Luồng vẫn dùng cùng ledger, version, phiên owner/CSRF/native proof, idempotency, ghi nguyên tử và bằng chứng. Không tự nhập ảnh mẫu của người dùng vào ledger.

## Đối chiếu ảnh người dùng cung cấp

[Receipt OCR thật](evidence/screenshots-2026-11-03/multi-bank-samples-1793701460302.json) chỉ lưu các trường cần đối chiếu, không lưu ảnh, số tài khoản hoặc nguyên văn riêng tư.

| Ảnh | Kết quả đọc |
| --- | --- |
| VCB | Hai biến động +10.000 / −30.000 VND, ngày 03/11/2026; OCR giữ giờ ở độ chính xác phút trong ảnh này, không tự thêm giây bị bỏ sót. |
| MB | Hai biến động −400.000 / +400.000 VND, ngày 29/10/2026, 10:49 / 10:48. OCR đọc các số 0 thành O nên phải đối chiếu số tiền trước khi lưu. |
| VietinBank | Bốn biến động nhìn thấy: −10.000 / +10.000 / −10.011 / +10.000 VND, ngày 12/10/2026; không nhầm 17:06 trên thanh trạng thái. |

Tập fixture còn gồm tên BIDV, Vietcombank, MBbank, Techcombank, VietinBank, ACB, VPBank, TPBank, Agribank, Sacombank, HDBank, VIB, SHB, MSB, OCB, SeABank, Eximbank, LPBank, Shinhan, HSBC và tên giả FutureBank, cộng trường hợp bỏ tên hoàn toàn. Đây là kiểm thử thuật toán chung trên dữ liệu giả, không phải nghiệm thu giao diện thực của từng ngân hàng hoặc cam kết đọc đúng mọi ảnh.

## Kiểm chứng và phạm vi

- Unit parser, chữ số/chữ OCR, định dạng tiền, hướng dòng tiền, ngày rút gọn, tách thông báo, số bị che và đối chiếu OCR.
- HTTP/PostgreSQL: 22 nhóm gồm các ràng buộc cũ, VCB, số tài khoản trùng chữ số giữa hai ngân hàng, mã thiếu, masked account, ảnh trùng và xác nhận giao dịch tương tự.
- Trình duyệt/OCR thật: 8 luồng gồm lưu bền, gửi lại ảnh, sửa dòng thiếu, mobile, bằng chứng giao dịch, ngân hàng chưa biết và quyết định giao dịch tương tự.
- Kiểm type backend/frontend, unit toàn bộ và build web; APK debug local được cập nhật riêng, giữ artifacts trước đó. Thiết bị/camera thật chưa nghiệm thu.

Kết quả: 122 backend unit, 140 frontend unit và kiểm type/build web đạt; 44 JVM test và build/chữ ký APK đạt. [22 nhóm HTTP/PostgreSQL](evidence/screenshots-2026-11-03/1793701673544.json), [8 luồng trình duyệt](evidence/screenshots-2026-11-03/ui-1793701428265/results.json), [APK local](../../artifacts/android/screenshots/README.md). Các lượt thất bại trước đó được giữ nguyên. OCR Windows `en-US` vẫn có giới hạn. Ảnh không đọc rõ số tiền, chiều tiền hoặc ngày không được dùng để đoán số dư. Chuyển giữa hai tài khoản của cùng chủ vẫn cần nghiệp vụ chuyển nội bộ, không tự gọi là thu nhập/chi tiêu chỉ vì dấu +/−.
