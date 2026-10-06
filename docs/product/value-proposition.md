# FinWeave — Value Proposition

Ngày 05/10/2026; version2.0, scope-v2. Đề xuất giá trị chưa kiểm chứng, dựa trên Ideas mục 20 và [Problem Statement](problem-statement.md).

Đối với cá nhân cần kiểm tra tài chính ở nhiều nguồn, FinWeave đề xuất một nơi để khai báo, cập nhật và nhìn tiền/tài sản với căn cứ rõ. Giá trị kỳ vọng là giảm công ghép dữ liệu bằng tay và giảm hiểu sai số; M1 chỉ kiểm chứng trải nghiệm và khả năng giải thích qua tác vụ giả.

| Công việc user cần làm | Chức năng cụ thể | Lợi ích kỳ vọng | Căn cứ nghiệm thu / giới hạn |
|---|---|---|---|
| Xem tiền nằm ở đâu | Tạo bank/wallet/cash, chọn phạm vi, Tổng quan | Thấy tổng cùng mốc và đóng góp tài khoản | AC-01…03,13–14; không xác minh tài sản ngoài đời |
| Nhập/cập nhật có kiểm soát | Form thu–chi, CSV preview, cash count | Biết dữ liệu được nhận và phần cần sửa | AC-06…09; chưa chứng minh tự động thu thập thật |
| Biết danh mục giá trị bao nhiêu | Khai báo cổ phiếu/vàng; lượng/giá/FX riêng | Tránh nhầm quote mới với sở hữu mới | AC-04–05,10,16; không hứa giá thanh lý hoặc P&L đầy đủ |
| Tìm khoản chi đáng chú ý | Bar chi tiêu, filter, detail/category | Từ tổng tới dữ liệu cần hành động | AC-11…14; không có lời khuyên tài chính cá nhân |
| Kiểm tra dữ liệu chưa rõ | Evidence, compare, preview và resolve Review | Thấy vì sao nghi vấn, hiểu tác động quyết định | AC-15–16; không có độ chính xác % giả |

Sự khác biệt được đề xuất gồm hợp nhất bốn nhóm nhưng ghi giới hạn, visual có drill-down và nguồn số truy được. Chưa có nghiên cứu so sánh thị trường để tuyên bố tốt hơn đối thủ. Privacy chống Ops là yêu cầu dài hạn với gate kỹ thuật riêng, không là điểm đã chứng minh của prototype.

Đánh giá đề xuất bằng tác vụ: user đọc được tổng tiền/tài sản, nhóm chi lớn, nguồn/time/unit và ảnh hưởng Review. Ghi sai hiểu và thao tác cần trợ giúp; chỉ sau đó mới có cơ sở điều chỉnh hierarchy, ngôn ngữ và lời hứa giá trị.

## Giá trị bổ sung — D-19

| Công việc | Chức năng | Lợi ích kỳ vọng / căn cứ |
|---|---|---|
| Đọc theo tháng/quý/năm/custom | Home two-block dashboard/period + insights | Hiểu số dư tại mốc khác hoạt động kỳ, AC-19…21 |
| Lập kế hoạch theo nguồn thực | Planned income/expense/investment + actual mapping | Thấy variance/remaining forecast, AC-22/23; không đảm bảo thu nhập tương lai |
| Theo goal và phương án đạt | Allocation/shortfall/scenario | Không cộng earmark lần2, không giả tạo tài sản; AC-24…26 |
| Hỏi theo ngữ cảnh đang xem | Full AI chat + mascot panel, read-only Engine cards | Giải thích có nguồn và history đồng bộ, AC-27/28; M1 scripted, không LLM thật |
