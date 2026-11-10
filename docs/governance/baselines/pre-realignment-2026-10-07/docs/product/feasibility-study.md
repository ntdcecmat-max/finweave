# FinWeave — Feasibility Study sơ bộ

Ngày 05/10/2026; version2.0, scope-v2. Phương pháp: phân tích ba tài liệu nguồn và kiểm kê workspace; chưa chạy PoC, user research, benchmark hoặc xác minh provider. Kết luận là đánh giá kế hoạch, không phải xác nhận kỹ thuật/thương mại thực tế.

## Kết luận

Có thể tiếp tục bước 2 và chuẩn bị prototype M1 trong phạm vi đã chọn bằng fixture và web local; chưa phát hiện phụ thuộc bắt buộc backend/provider thật cho tác vụ mô phỏng. M2 phụ thuộc contract/mock/transport; M3 còn điều kiện nguồn, quyền, privacy, chi phí và môi trường chưa giải quyết. Chưa có cơ sở cam kết ngày hoàn thành, chi phí tiền hoặc tính khả thi sản phẩm SaaS với dữ liệu thật.

| Khía cạnh | Căn cứ hiện có | Đánh giá sơ bộ M1 | Điều còn phải kiểm chứng / gate |
|---|---|---|---|
| Nhu cầu/giá trị | Ideas/user idea nêu UP-01…08; chưa có người tham gia | Giả thuyết đủ để viết tác vụ, giá trị chưa xác nhận | Phỏng vấn/test giả, câu trả lời và lỗi hiểu |
| Kỹ thuật UI | Playbook cho phép prototype local/mock; workspace chưa có code | Hướng web khả thi về phạm vi kế hoạch; chưa kiểm tra runtime | Chọn công cụ và chạy browser ở bước 3; thao tác/visual/reset đủ AC |
| Dữ liệu/nghiệp vụ | Oracle có opening, transfer, refund và bốn nhóm | Có thể định nghĩa expected độc lập; nhánh phức tạp cần rules | Bước 2 dictionary/status/rounding; bước 3 consistency walkthrough |
| Vận hành/demo | Một workspace giả, không yêu cầu service production | Có thể giới hạn local, không phụ thuộc vận hành SaaS | Cách mở/reset, yêu cầu môi trường và lưu state phải thử khi có app |
| Bảo mật/quyền riêng tư | Ideas 15–16 đặt gate chống Ops cả runtime | M1 giả giảm phụ thuộc dữ liệu thật; không chứng minh bảo đảm security | FUT-02: boundary/key/code/client/auth/recovery và test trước thật |
| Nguồn/quyền sử dụng | Thông tin ứng viên trong Ideas, chưa xác minh lại | Dùng nguồn dummy, không công bố adapter thật | DEP-01…03 trước tích hợp; tài liệu/terms/mẫu được cấp quyền |
| Kinh tế/nguồn lực | Chưa budget, deadline, đơn giá/capacity | Effort scope-v2 TBD, estimate cũ superseded; chưa cần mua dịch vụ | Cost model + báo giá/effort thực khi có nguồn lực |
| Lịch/khả năng bàn giao | Bước1 đã có; nhiệm vụ mới bước 2, bước 3 chưa được giao | Có thể chia theo gate, cập nhật D-12/D-19 | Chốt capacity/rubric/user availability trước hẹn ngày |

## Các điểm phải khảo sát sớm và điều kiện dừng

Trước thiết kế: làm rõ nhóm user, timestamp/stale, CSV/quote demo bằng OD-01…04. Không có người tham gia thì ghi hạn chế và tiếp tục walkthrough, không phát minh kết quả.

Trước contract M2 phục vụ backend định hướng: khảo sát protected boundary vì transport tài chính không được mặc định plaintext qua gateway. Trước dữ liệu thật: PoC/gate Ideas 15, quyền provider/key/nguồn và recovery cần bằng chứng. Nếu ngân sách/boundary chưa đáp ứng, duy trì synthetic integration, không đổi nhãn thành M3 cho khách hàng thật.

Nếu runtime local không đáp ứng cách mở prototype, kiểm tra phương án kỹ thuật khác trong cùng web local trước khi phát sinh phí. Nếu scope/rubric yêu cầu thêm tính năng hoặc platform, cập nhật charter/AC/cost thay vì tự thêm trong lúc xây. Xem [Options](options-analysis.md), [Risks](risk-register.md).

## Khả thi bổ sung sơ bộ — chưa PoC/benchmark

Plan/Goals/Insights/AI scripted có thể đặc tả và mô phỏng M1 mà không nguồn thật. Rủi ro mới: forecast không đồng nhất actual, over-allocation, context/report lịch sử stale, chat hallucination/masking. Nghiệp vụ được bổ sung BR-25…36/DR-16…22/SCN mới; khả thi kỹ thuật thực tế của protected Engine/LLM vẫn chưa chứng minh. D-19 thay phạm vi, cần estimate mới; không giữ estimate cũ làm cam kết scope-v2.
