> Baseline v3 — 07/10/2026: nội dung dưới giữ phân tích/quy tắc lịch sử v2. Khi khác phạm vi, ưu tiên [PRD v3](prd.md), [Scope v3](scope.md), [SRS v3](../requirements/srs.md) và [Agent trong Plan/Goals](ai-agent-specification.md). Không dùng giới hạn web/mock/M2 dưới đây làm giới hạn sản phẩm mới; invariant nghiệp vụ và anti-Ops vẫn giữ trừ delta được ghi rõ.

# FinWeave — Product Vision

Ngày 05/10/2026; version2.0, scope-v2. Nguồn: Ideas mục 1, 20; phạm vi thực hiện: [scope-v2](scope.md). Đây là hướng sản phẩm và giả thuyết cần kiểm chứng.

## Tầm nhìn

FinWeave giúp cá nhân nhìn tài chính phân tán thành một bức tranh có thể kiểm tra: biết tiền đang ở đâu, chi vào gì, lượng tài sản đã khai báo được định giá thế nào và dữ liệu nào cần bổ sung. Mọi số tổng hợp cần có đường truy về căn cứ và giới hạn dữ liệu.

User dự kiến là người tự quản lý tài chính cá nhân, có ngân hàng/ví và tiền mặt, có thể nắm cổ phiếu/vàng. Đây là A-01, chưa xác nhận qua nghiên cứu; không khẳng định mọi user đều sở hữu đủ bốn nhóm.

## Kết quả mong muốn và nguyên tắc

| Kết quả | Cách thể hiện trong M1 | Dấu hiệu kiểm chứng dự kiến |
|---|---|---|
| Hiểu tiền/tài sản trong phạm vi theo dõi | Tổng quan bốn nhóm, tiền tách khỏi tài sản cần bán | Đọc đúng tiền 31,1 triệu và tài sản 76,1 triệu của scenario |
| Hiểu nguyên nhân biến động | Thu–chi/dòng tiền/định giá tách nghĩa; drill-down | Tìm được giao dịch đóng góp; giá tăng không thành thu nhập |
| Chủ động kiểm tra dữ liệu | Source/time/unit, Review có preview | Nhận ra dữ liệu cũ/thiếu, biết xác nhận làm thay đổi gì |
| Có nền để phát triển tiếp | REQ→UC→màn hình→contract/test/evidence | Bước 2 không phải tự đoán lại phạm vi hoặc quy tắc quan trọng |

Ưu tiên trung thực về dữ liệu, visual dẫn tới hành động, chủ dữ liệu quyết định điều chỉnh, và privacy trước dữ liệu thật. Giá trị này chưa chứng minh ưu thế thị trường hoặc khả năng bảo mật thực tế.

## Tầm nhìn dài hạn và mốc hiện tại

Hướng dài hạn trong Ideas là SaaS backend trung tâm, nguồn được cấp quyền, ledger/Engine chính thức và bảo vệ tài chính khỏi Ops. Plan/Goals/AI đã chọn qua D-19 trong M1 synthetic; tài sản mở rộng/real-data AI còn gate riêng.

M1 hiện tại kiểm chứng trải nghiệm bằng dữ liệu giả trên responsive web tiếng Việt. Không đặt mục tiêu realtime, tự động bao phủ mọi tài sản, doanh thu/retention hay khuyến nghị đầu tư cho mốc này. Chỉ số sau M1 có thể nghiên cứu: thời gian ra câu trả lời hữu ích, số thao tác nhập/sửa, khả năng hiểu nguồn số và mức quay lại sử dụng; chưa có baseline để đặt cam kết kinh doanh.

## Phạm vi giá trị bổ sung — D-19

FinWeave nối **hiện trạng có căn cứ → kế hoạch → thực tế → giải thích** qua 5 navigation Home/Giao dịch/Plan/Dữ liệu/Trợ lý AI. Plan ánh xạ thu nhập/chi tiêu/đầu tư với dữ liệu thực, goals theo nguồn tiền hiện có và mô phỏng trạng thái khi đạt. Insights/AI giúp hiểu nguyên nhân, không tự ghi sổ/đặt lệnh. Tài khoản & Tài sản là tab của Home, giữ tác vụ quản lý đầy đủ. Mốc M1 có scripted AI/linh vật chat, không provider thật. Mục tiêu mới AC-19…28 chưa đo; A-05/06 chưa nghiên cứu nhu cầu Plan/AI.
