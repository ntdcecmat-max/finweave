# FinWeave — Assumptions và Constraints

Ngày 05/10/2026, v2.0, scope-v2. Nguồn quyết định: [decisions](../execution/decisions.md); nguồn phạm vi: [scope](scope.md). Constraints là điều phải giữ; assumptions là điều chưa có bằng chứng, không biến thành yêu cầu user đã duyệt. D-13…18 là assumptions dẫn xuất cho analysis-v2 (kế thừa analysis-v1), xem quyết định và tác động đầy đủ tại decisions.

## Constraints

| ID | Ràng buộc / nguồn | Hệ quả kiểm tra |
|---|---|---|
| CON-01 | Hoàn thiện quản trị bước 1, thực hiện bước 2 và dừng sau gate — user/D-12 | Không tự thực hiện bước 3/app; không ghi đạt M1 |
| CON-02 | Bốn nhóm và năm chức năng lõi — user | Bao phủ matrix 4×5, ngân hàng và ví đều có scenario |
| CON-03 | Tiếng Việt, responsive web, synthetic — user | AC-17/18; không dữ liệu thật hoặc collector thật |
| CON-04 | Budget độc lập nâng cao và Alerts ngoài phạm vi; Goals/Assistant đã được chọn qua D-19 | Scope §10 có đủ Plan/Goals/AI, không giả các phần hoãn đã hoạt động |
| CON-05 | Không tự phát sinh billing/dịch vụ trả phí/public deploy — Playbook và quyền hiện tại | Chỉ local/tài liệu; chi phí mới phải được chọn rõ |
| CON-06 | Thiếu không bằng 0; giá khác lượng; transfer/refund/opening/reversal đúng nghĩa — nguồn nghiệp vụ | AC-01…16 và oracle/rules nhất quán |
| CON-07 | Admin/Ops không đọc tài chính thật — Ideas 15–16 | Không tự hạ privacy; gate trước dữ liệu thật, M1 chưa chứng minh |
| CON-08 | Không bịa user research hoặc trạng thái verified sản phẩm — nhiệm vụ/Playbook | Gắn nhãn assumptions, evidence đúng loại |

## Assumptions và điều chưa biết

| ID liên quan | Giả định / mặc định | Chủ thể cần xác minh | Hạn / tác động nếu sai |
|---|---|---|---|
| A-01 | Cá nhân tự quản lý nhiều nguồn, có thể tự khai báo holdings | Chủ sản phẩm + người tham gia | Trước kết luận nhu cầu; đổi form/hierarchy |
| A-02 | Tiền ở đâu/chi vào gì/dữ liệu cần kiểm tra là ba câu hỏi ưu tiên | Người tham gia | Trước đánh giá giá trị; đổi tác vụ/visual |
| A-03 | Mobile nhập nhanh, desktop kiểm tra chi tiết | Người tham gia | Trước chốt UX; điều chỉnh viewport/interaction |
| A-04 | 5 người, ≥4/5 hoàn thành là ngưỡng thử nhỏ phù hợp | Chủ sản phẩm | Trước user test; chưa là kết quả hoặc yêu cầu tuyển bắt buộc |
| OD-02 | Kỳ/thời điểm/stale như decisions, chỉ fixture giả | Agent ở bước 2 | Trước scenarios; ảnh hưởng nhãn và filter |
| OD-03 | CSV schema demo nhỏ đủ chứng minh import/Review | Agent ở bước 2 | Trước thiết kế wizard; đổi validation/fixture |
| OD-04 | Quote vàng VND/chỉ và nhánh quốc tế/FX giả đủ chứng minh đơn vị | Agent ở bước 2 | Trước rules; đổi quy đổi/rounding/căn cứ định giá |
| EST-02, thay EST-01 | Effort còn lại scope-v2 TBD; estimate v1 28/42/60 giờ và 20% dự phòng superseded | Agent bước 3 + PO | Sau vòng UX đầu và chọn stack; trước cam kết lịch/chi phí; không actual |
| UNK-01 | Runtime/browser/công cụ xây prototype sẵn dùng | Agent khi được giao bước 3 | Kiểm tra trước scaffold; chọn cách local khác nếu cần |
| UNK-02 | Deadline, capacity, đơn giá, budget tiền, rubric | Chủ sản phẩm, hiện chưa cung cấp | Trước cam kết lịch/chi phí; không cản tài liệu bước 1 |
| OD-05…07 | Nguồn thật và security boundary đủ quyền/chi phí | Vai trò nguồn/security tương lai, chưa chỉ định | Trước M2 transport/M3 thật; không mặc định khả thi hoặc miễn phí |

Mọi assumption thay đổi phải cập nhật decisions, scope/scenarios nếu ảnh hưởng nghĩa số và cost/roadmap nếu ảnh hưởng effort. Tài liệu nguồn chưa được xác minh lại về giá, quota, model hay license; không dùng thông tin đó để ký cam kết hiện tại.

## Constraints/assumptions bổ sung

CON-09: user đã chọn đúng 5 navigation, Plan/Goals/AI/Insights qua D-19; không còn exclusion Goals/Assistant. CON-10: planning/simulation/goal allocation không tự commit actual; AI chỉ đọc/giải thích, không trade hoặc thayledger. CON-11: “balance sheet” mô phỏng cơ cấu tài sản; nợ/net-worth chưa chọn.

A-05/06: giá trị Plan/AI contextual chưa user research; owner AG+PO, kiểm chứng ở bước 3 khi có người. OD-08: thuật toán remaining forecast/goal funding và input matching dùng mặc định D-21, owner AG/PO review. OD-09: thiết kế mascot/channel/LLM thật chưa chốt; D-22 scripted M1, provider/key/quota/license chờ bước 4/7 nếu được giao. OD-02/03/04 vẫn fixture giả định, không phê duyệt thị trường/SLA.
