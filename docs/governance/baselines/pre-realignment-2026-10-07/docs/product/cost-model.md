# FinWeave — Cost Model sơ bộ

PRD-CST-001 · v2.0 · scope-v2 · 05/10/2026 · in-review. Owner Agent, PO review pending. Chưa có time log, đơn giá, capacity, deadline hoặc ngân sách được chốt.

## Thay đổi cơ sở ước lượng

Ước lượng EST-01 cũ 28/42/60 giờ cho scope-v1, gồm cả phân tích bước 2, đã **superseded**. Không dùng ước lượng đó làm effort còn lại của 5 navigation. Hồ sơ bước 1–2 nay đã được cập nhật; effort đã dùng không biết, không suy từ thời gian chat/token và không cộng gói tài liệu đã hoàn thành vào công việc còn lại.

| Gói còn lại khi được giao bước 3 | Backlog | Yếu tố cần ước lượng |
|---|---|---|
| IA, wireframe, tokens, UX và context | BL-07/12 | 5 navigation, tab/detail, profile settings, mascot responsive/keyboard |
| Prototype bốn nhóm lõi và dữ liệu | BL-08/09 | Setup, import, transactions, holdings, Review, reset và trạng thái lỗi |
| Home, báo cáo theo kỳ và Insights | BL-13 | Calendar/as-of/coverage, chart và drill-down giữ context |
| Plan và Goals | BL-14/15 | Version, actual mapping, remaining/variance, allocation/shortfall |
| Mô phỏng | BL-16 | Input giả định, frozen versions, kịch bản tiêu dùng/đầu tư, không tác động actual |
| Trợ lý AI scripted | BL-17 | Chat/history, result cards/evidence, panel linh vật, stale/denied/failure |
| Verification, sửa lỗi, evidence/demo guide | BL-10 | 28 AC, ba viewport/bàn phím; core regression và các fixture mở rộng |
| User test khi có người | BL-11 | Tuyển người, tác vụ và tổng hợp thật; hiện chưa có |

EST-02: effort từng gói và tổng mới **TBD**, do Agent thực hiện bước 3 đề xuất sau một vòng UX, PO rà soát. Chưa có cơ sở để đưa con số tổng mới đáng tin cậy. Các gói dùng chung component/context cần phân chia trước khi cộng để tránh tính hai lần; cập nhật estimate sau khi chọn stack và có độ phức tạp giao diện.

## Công thức và khoản chi

`H_remaining = Σ H_package` cho các gói chưa hoàn thành, không tính trùng.

`H_plan = (H_remaining + H_user_test + H_review) × (1 + contingency)`; các biến hiện chưa chốt. Dự phòng 20% ở v1 chỉ là giả định lịch sử, chưa được duyệt lại cho scope-v2.

`C_remaining = Σ(H_i × rate_i) + C_tools + C_participants + C_infra + C_provider + C_deploy`.

Không mặc định biến chưa biết bằng 0 hoặc cộng contingency labor lần hai. M1 local/scripted không yêu cầu mua hạ tầng hay API/LLM; giá dịch vụ, license và phí tham gia chưa xác minh, không tự phát sinh mua. Tổng chi phí dự án còn cần actual đã dùng (chưa biết).

## Lịch và điều kiện cập nhật

Ngày làm hữu ích = H_plan / capacity; lịch còn cộng thời gian chờ phản hồi/người tham gia. Chưa có capacity/deadline nên [Roadmap](roadmap.md) không hẹn ngày. Rủi ro tăng effort: báo cáo lịch sử thiếu dữ liệu, quá nhiều vòng UX, Plan/matching phức tạp, thêm provider thật hoặc trade lifecycle. R-18 và EST-02 theo dõi phần này; D-19 không đồng nghĩa đã chấp thuận chi phí.

M2/M3 cần estimate riêng cho contracts/backend/worker/Engine, lưu và quyền Plan/Goals/chat, provider/license/quota, privacy boundary, vận hành/restore và verification. Chỉ lập tổng tiền khi có kiến trúc, quyền và báo giá. [Decisions](../execution/decisions.md) và [Assumptions](assumptions-constraints.md) giữ điều chưa biết.
