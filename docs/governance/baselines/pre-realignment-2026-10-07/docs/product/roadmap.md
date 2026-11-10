# FinWeave — Roadmap theo gate

Ngày 05/10/2026; version2.0, scope-v2. Không có deadline/capacity được cấp nên không hẹn ngày. Các mốc là thứ tự có phụ thuộc, không lịch cam kết. [Cost Model](cost-model.md) chỉ ước lượng phần còn lại M1; roadmap giai đoạn module Ideas 17 khác mức bàn giao Playbook.

| Mốc | Phạm vi / output | Dependency và gate | Trạng thái / quyền |
|---|---|---|---|
| RDM-01 — bước 1 | Bộ hồ sơ chuyên nghiệp, Scope/Backlog và execution baseline | Matrix 4×5, benefit/AC, assumptions/risks/cost và quyết định mở đủ dùng bước 2 | Được giao; `verified` về tài liệu sau rà soát |
| RDM-02 — bước 2 | Needs, Context, Scenarios, PRD, SRS FR/NFR, UC, Rules, Data Requirements, Glossary, RTM; register/review | RDM-01; BL-02…06; OD-02…04 giữ nhãn giả định, 28 REQ/AC nhất quán, 18 lõi/oracle được giữ | Được giao theo D-12/D-19; xem progress và EVD-S2-001 cho gate cuối |
| RDM-03 — bước 3, gate M1 | UX + web prototype local, reset, chart/detail/Review, evidence/demo guide | RDM-02; BL-07…17; AC-01…28, oracle, desktop/mobile/keyboard, lỗi nghiêm trọng xử lý | `planned`; **M1 chưa đạt** |
| RDM-03U — đánh giá user khi có người | Thử tác vụ giả, báo khả năng hiểu, sửa UX có căn cứ | Prototype đủ thử, OD-01/A-04, BL-11 | Có điều kiện; chưa nghiên cứu, không giả kết quả |
| RDM-04 — bước 4–6, gate M2 | Frontend-spec/API logical + transport, mock/API layer, tests/handover | M1 baseline và hướng protected transport khảo sát; FUT-01 | Chưa được giao; không backend thật để thay mock |
| RDM-05 — bước 7–9, gate M3 | Backend/worker/Engine/quyền/bảo vệ, nguồn được chọn, deploy và restore | Contract M2, FUT-02/03/04, OD-05…07, quyền/budget/môi trường, gate privacy trước dữ liệu thật | Chưa được giao; synthetic integration không tự là M3 thật |
| RDM-EXT — mở rộng có lựa chọn | Budget độc lập nâng cao, Alerts; tài sản/nguồn/nghiệp vụ chưa chọn | Nhiệm vụ chọn rõ + impact analysis/AC/quyền/gate riêng | `out-of-scope` hiện tại; chưa xếp lịch |

Đường phụ thuộc chính: RDM-01 → RDM-02 → RDM-03 → baseline M1. RDM-03U cần người tham gia; nếu chưa có thì giữ trạng thái chưa kiểm chứng user. Khảo sát security/source tương lai có thể tiến sớm khi được giao và đủ quyền, nhưng không nhập vào đường bắt buộc dựng UI M1.

Mỗi gate ghi scope/môi trường/evidence/missing work. Bước 1 chỉ được ghi hoàn thành về hồ sơ; không đánh dấu RDM-03 đạt vì có Scope hay AC. Sau bước 2 và vòng UX đầu, cập nhật effort/capacity nếu cần hẹn lịch. Thêm module không tự kế thừa trạng thái verified của các module lõi.

## Mốc thay thế theo scope-v2

RDM-01/02 được cập nhật hồ sơ scope-v2/analysis-v2 trong nhiệm vụ này, không còn kế hoạch bước 2 chỉ18 REQ. RDM-03 cần thêm 5 navigation/Home period/Insights/Plan/Goals/simulation/AI scripted/mascot và test28 AC; BL-12…18 mô tả việc mới. M2 cần contracts Plan/goal/report/context/read-only tools và mock; M3 thêm supplier/AI evaluation khi chọn provider, real-data LLM vẫn chưa được phép. Không hẹn ngày; cost estimate mới chưa actual. Không kế thừa gate v1 như đã đủ scope-v2.
