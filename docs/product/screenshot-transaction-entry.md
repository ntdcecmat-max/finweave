# Nhập giao dịch bằng ảnh chụp

03/11/2026 · bộ đọc trường thông tin `fields-v2` theo yêu cầu áp dụng cho mọi ngân hàng · FW-SCREENSHOT-001.

## Phương án hiện hành

Người dùng chủ động chọn hoặc chụp ảnh giao dịch. Hệ thống dùng nhận dạng chữ trong ảnh (OCR), tách từng thông báo, đọc dữ liệu, kiểm tra và lưu giao dịch vào ledger dùng chung. Đây là phương thức nhập chính mới. Không cần quyền đọc thông báo hoặc kết nối ngân hàng để dùng luồng này. Thu thập thông báo Android giữ lại như tùy chọn; CSV và biểu mẫu nhập tay tiếp tục phục vụ dữ liệu cần bổ sung thủ công.

Luồng mới được triển khai tại trang **Giao dịch** và **Nguồn dữ liệu**. Bộ đọc không giới hạn tên ngân hàng và không chọn parser theo một mẫu cố định. Nó tìm trường tiền tăng/giảm, ngày, giờ nếu có, tài khoản, nội dung và mã tham chiếu trong thông báo hoặc biên nhận. Danh sách tên ngân hàng chỉ chuẩn hóa cách hiển thị; ngân hàng chưa có tên trong danh sách đi qua cùng luồng. Số dư cuối trên ảnh là dữ liệu đối chiếu, không phải số tiền giao dịch và không tự sửa opening/số dư trong hệ thống.

## Yêu cầu và quy tắc

| ID | Hành vi |
| --- | --- |
| REQ-SHOT-01 | Chọn ảnh PNG/JPG/WebP tối đa 10 MB hoặc mở máy ảnh bằng trình chọn tệp. Trình duyệt cắt giảm kích thước tối đa 2.400 px, nén JPEG tối đa 160 KiB; ảnh quá lớn/không đọc được báo lỗi. Không tự chụp màn hình app khác. |
| REQ-SHOT-02 | Tách tối đa 20 thông báo trong một ảnh; mỗi dòng có số tiền VND nguyên, tiền vào/ra từ dấu +/− hoặc ghi Có/ghi Nợ, ngày, giờ nếu đọc được, tài khoản nguồn nếu hiện, nội dung, mã giao dịch nếu có và cảnh báo. Hỗ trợ thông báo văn xuôi, dạng trường, card theo ngày và dòng phân cách bằng dấu \|. Không lấy số dư cuối, đồng hồ điện thoại hoặc phí làm số tiền giao dịch. |
| REQ-SHOT-03 | Người dùng chọn tài khoản đích trong hệ thống. Ảnh ngân hàng được gắn vào tài khoản ngân hàng người dùng chọn; hỗ trợ cả số bị che và ảnh không hiện tên ngân hàng. Cùng số tài khoản tại các ngân hàng khác nhau được phân biệt; không gắn số đầy đủ hoặc ngân hàng xung đột vào cùng tài khoản. |
| REQ-SHOT-04 | Tùy chọn “Tự động lưu khi đọc đủ thông tin” bật mặc định và hiển thị trước khi tải ảnh. Khi đọc rõ số tiền VND, chiều tiền, ngày và không có cảnh báo thì tự ghi sổ vào tài khoản được chọn. Không bắt buộc ảnh có tên ngân hàng, số tài khoản đầy đủ, giờ hoặc mã tham chiếu. Đây là kiểm tra quy tắc, không phải xác suất tin cậy OCR được hiệu chuẩn. |
| REQ-SHOT-05 | Dòng thiếu/nhập nhằng giữ ở màn hình kiểm tra; người dùng sửa, chọn các dòng cần lưu và xác nhận. Không mặc định ngày hôm nay hoặc đoán chiều tiền. Năm hai chữ số chỉ được giải khi có ngày đầy đủ khớp trong ảnh hoặc duy nhất một năm phù hợp với kỳ theo dõi của tài khoản. Thiếu giờ giữ độ chính xác ngày; không lấy đồng hồ điện thoại làm giờ giao dịch. Lỗi OCR chữ O trong số tiền hiển thị số được chuẩn hóa và bắt buộc kiểm tra. Giao dịch thất bại/hủy bị chặn. Refund, chuyển nội bộ, phí riêng dùng biểu mẫu nghiệp vụ hiện có. |
| REQ-SHOT-06 | Lưu các dòng đã chọn trong một transaction PostgreSQL. Một dòng không hợp lệ thì toàn bộ lần lưu được hoàn tác. Kiểm ngày bắt đầu theo dõi, opening date, ngày tương lai, account state, owner và workspace version. |
| REQ-SHOT-07 | Chống trùng theo scan/dòng, hash ảnh và trường trích xuất, mã nguồn và fingerprint giao dịch trong từng tài khoản. Retry dùng cùng request/key. Ảnh không có mã vẫn nhập được: cùng ảnh được bỏ qua; ảnh khác có cùng số tiền/chiều/ngày/giờ/nội dung sẽ chờ quyết định rõ của người dùng trước khi ghi thêm. Không âm thầm gộp mọi giao dịch cùng số tiền. OCR đọc sai trường trên ảnh khác vẫn có thể làm giảm khả năng nhận trùng. |
| REQ-SHOT-08 | Lưu giờ giao dịch, dữ liệu OCR, dữ liệu đã sửa, ngôn ngữ/bộ đọc, hash ảnh, chế độ lưu và liên kết bằng chứng. Chi tiết giao dịch hiện nguồn “Ảnh giao dịch” và giờ trên ảnh. Màn hình tuân thủ ẩn thông tin, keyboard và bố cục mobile. |

## Kiến trúc và hợp đồng

Client → `scanScreenshot` → Windows OCR (ảnh gốc + tăng tương phản) → bộ đọc trường thông tin dùng chung → bản đọc ảnh tạm → `saveScreenshot` → cùng `applyFinance`/ledger → bằng chứng và chống trùng → cập nhật giao diện.

- `scanScreenshot`: truy vấn owner có accountId, MIME và base64. Server kiểm byte header/kích thước, session/origin/workspace, giới hạn 30 lần đọc/15 phút và tối đa hai OCR đang chạy. OCR chạy bằng tiến trình Windows riêng có timeout 12 giây, không đưa nội dung ảnh vào câu lệnh. Tiến trình tạm được xóa sau khi đọc. Bản local giữ transaction/khóa owner trong thời gian đọc có giới hạn; chưa phải hàng đợi OCR quy mô lớn.
- `saveScreenshot`: mutation owner có CSRF hoặc native proof, idempotency key và workspace version; input gồm scanId, mode auto/reviewed, subset dòng. Auto phải khớp nguyên dữ liệu đã trích xuất và không có cảnh báo. `confirmSimilar` là tùy chọn chỉ có hiệu lực trong chế độ reviewed cho tình huống không có mã nguồn; auto không thể dùng nó để vượt cảnh báo. Server tự lấy version account trong cùng workspace lock.
- Extension `FW-SCREENSHOT-001` được ghép thêm vào hợp đồng hiệu lực; không sửa bytes/pin lịch sử API005. Bộ sinh đồng bộ schema và allowlist Android; APK cũ chưa có allowlist mới phải được build/cài lại.
- Không migration mới. Bản đọc và ảnh đã nén nằm trong `fw_business.import_previews`, hết hạn sau 24 giờ và được retention worker dọn ở lần chạy tiếp theo. Bằng chứng OCR/text/hash lưu trong `fw_business.evidence`, dedupe trong `fw_business.import_dedupe`; ledger/history giữ quy tắc bất biến hiện hành. Sao lưu hệ thống dùng quy trình backup hiện có. Ảnh gốc không được lưu trữ lâu dài bởi tính năng này.
- OCR dùng [Windows.Media.Ocr](https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr.ocrengine), chạy trên máy backend Windows. Không gửi ảnh tới dịch vụ AI bên ngoài. Máy hiện có bộ đọc `en-US`; có thể đọc sai hoặc mất dấu tiếng Việt. So sánh hai lượt đọc; bất đồng về số tiền/chiều/ngày/tài khoản cần kiểm tra. Không ghép các đoạn của nhiều lượt thành một giao dịch đoán lại. Model Qwen phục vụ Agent hiện có không được coi là model nhìn ảnh.

## Giới hạn nghiệm thu

Luồng chạy trong profile local hiện hành. Các ảnh BIDV/VCB/MB/VietinBank người dùng gửi được dùng đối chiếu OCR, không tự nhập vào tài khoản tài chính. HTTP/PostgreSQL dùng dữ liệu giả; kiểm trình duyệt dùng ảnh giả với Windows OCR thật. [Bằng chứng và cách chạy](../execution/screenshot-multi-bank-2026-11-03.md).

Thiết kế áp dụng chung cho các ngân hàng, không có danh sách chỉ cho phép một số ngân hàng. Điều đó không bảo đảm đọc đúng mọi ảnh/bố cục 100%: ảnh mờ, số bị nhận sai, ngoại tệ, ngày nhập nhằng hoặc loại giao dịch phức tạp vẫn cần kiểm tra. Cần đo tỷ lệ sai trường và nghiệm thu trên dữ liệu đa dạng. [APK Android debug local](../../artifacts/android/screenshots/README.md) đã build với schema/allowlist mới và 44 JVM test đạt; chưa kiểm file picker/camera trên thiết bị thật hoặc phát hành APK pilot mới. Các điều kiện triển khai công khai/nguồn thật/vận hành còn mở trong hồ sơ local vẫn áp dụng.
