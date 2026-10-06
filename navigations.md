Cấu trúc **5 navigation này phù hợp với hướng FinWeave bạn đang hình dung**: xem tình hình → quản lý giao dịch → lập kế hoạch → kiểm tra dữ liệu → hỏi AI. Mình sẽ cụ thể hóa như sau:

| Navigation chính | Mục con / tab đề xuất |
| --- | --- |
| **1. Tổng quan & Báo cáo — Home** | Tổng hợp · Báo cáo · Tài khoản & Tài sản |
| **2. Giao dịch** | Tất cả · Thu–chi · Chuyển tiền · Hoàn tiền |
| **3. Plan — Kế hoạch** | Tổng quan kế hoạch · Thu nhập & Chi tiêu · Đầu tư · Mục tiêu · Mô phỏng |
| **4. Dữ liệu** | Nguồn dữ liệu · Kiểm tra dữ liệu |
| **5. Trợ lý AI** | Trò chuyện · Lịch sử hội thoại |

Cài đặt nằm ở menu hồ sơ; linh vật AI là điểm truy cập dùng chung trên mọi trang.

## **1. Home: hai khối dashboard chính**

Mình đề xuất hai khối trong tab **Tổng hợp**:

| Khối | Nội dung |
| --- | --- |
| **Tiền & Hoạt động tài chính** | Tổng tiền, số dư từng tài khoản, thu nhập, chi tiêu, hoàn tiền, dòng tiền và nhóm chi lớn |
| **Tài sản & Cơ cấu** | Tổng tài sản theo dõi, phân bổ ngân hàng/ví/tiền mặt/cổ phiếu/vàng, thay đổi lượng sở hữu và định giá |

Bên dưới có **Insights**: những điểm đáng chú ý, nguyên nhân biến động và dữ liệu cần kiểm tra. Mỗi insight có kỳ, căn cứ và nút mở chi tiết; phần giải thích bằng AI được nhận diện rõ.

Bộ chọn **Tháng · Quý · Năm · Khoảng tùy chọn** dùng chung cho dashboard và báo cáo. Cần giữ đúng ý nghĩa:

- **Thu–chi, dòng tiền:** hoạt động diễn ra trong khoảng đã chọn.
- **Số dư, lượng sở hữu, giá trị tài sản:** trạng thái tại cuối khoảng đã chọn.
- **Biến động:** so đầu–cuối khoảng, tách tác động giao dịch với tác động giá.

Tab **Tài khoản & Tài sản** rất cần thiết trong cấu trúc này vì không còn navigation riêng cho tài sản. Từ đây người dùng vào ngân hàng/ví, tiền mặt, cổ phiếu, vàng và trang chi tiết để cập nhật.

Với “**balance sheet**”, hiện bốn nhóm lõi mới đủ cho **cơ cấu tài sản đang theo dõi**. Nếu muốn bảng cân đối gồm tài sản, nghĩa vụ nợ và tài sản ròng, cần bổ sung mô hình nợ vào phạm vi.

## **2. Giao dịch: nơi quản lý những gì đã xảy ra**

Giữ các tính năng bạn liệt kê: ghi thu/chi/chuyển/phí/hoàn tiền, lọc, phân loại, xem bằng chứng và điều chỉnh có lịch sử.

Trang chi tiết nên nối được tới **tài khoản, tài sản, khoản hoàn tiền, case kiểm tra và kế hoạch liên quan**. Ví dụ khoản mua cổ phiếu có thể liên kết với thay đổi lượng sở hữu và kế hoạch đầu tư.

## **3. Plan: dữ liệu thực tế → dự kiến → theo dõi**

Đây là phần mở rộng lớn nhất của ý tưởng:

| Mục con | Tính năng |
| --- | --- |
| **Tổng quan kế hoạch** | Tiền hiện có, thu–chi dự kiến, tiền dự kiến còn lại, phân bổ đầu tư và tiến độ mục tiêu |
| **Thu nhập & Chi tiêu** | Lập khoản dự kiến, thời điểm, tần suất, nhóm/tài khoản; so thực tế với kế hoạch |
| **Đầu tư** | Lập mức đóng góp, lịch đầu tư và phân bổ dự kiến giữa các nhóm tài sản |
| **Mục tiêu** | Số tiền, thời hạn, nguồn tiền, mức đóng góp và tiến độ |
| **Mô phỏng** | So các phương án: đạt mục tiêu, mua tài sản, tăng đầu tư hoặc thay đổi thu–chi |

Plan lấy dữ liệu hiện có làm điểm xuất phát, nhưng **khoản dự kiến phải tách khỏi giao dịch thực tế**. Đạt goal không tự sinh tiền hoặc tài sản mới; dashboard mô phỏng thể hiện tác động **nếu** hành động dự kiến được thực hiện.

## **4. Dữ liệu: giữ đúng hai nhóm bạn đề xuất**

- **Nguồn dữ liệu:** kết nối, nhập CSV, preview/ánh xạ cột, lịch sử nhập, trạng thái cập nhật.
- **Kiểm tra dữ liệu:** trùng, thiếu, lệch, chuyển/hoàn tiền chưa rõ, lượng/giá cũ hoặc không phù hợp.

Badge tại navigation Dữ liệu có thể cho biết số case cần xử lý.

## **5. AI: một hội thoại, hai cách truy cập**

Trang **Trợ lý AI** dành cho hội thoại đầy đủ. **Linh vật nổi** mở panel chat ngay tại trang đang xem và giữ ngữ cảnh như kỳ, bộ lọc, giao dịch hoặc tài sản đang chọn.

AI có thể giải thích số liệu, tìm căn cứ và đề xuất kế hoạch dạng bản nháp. Số liệu đến từ Financial Engine; thay đổi giao dịch hoặc kế hoạch cần người dùng xác nhận.
