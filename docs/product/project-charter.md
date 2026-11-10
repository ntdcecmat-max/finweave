> Baseline v3 — 07/10/2026: nội dung dưới giữ phân tích/quy tắc lịch sử v2. Khi khác phạm vi, ưu tiên [PRD v3](prd.md), [Scope v3](scope.md), [SRS v3](../requirements/srs.md) và [Agent trong Plan/Goals](ai-agent-specification.md). Không dùng giới hạn web/mock/M2 dưới đây làm giới hạn sản phẩm mới; invariant nghiệp vụ và anti-Ops vẫn giữ trừ delta được ghi rõ.

# FinWeave — Project Charter

Ngày 05/10/2026; baseline `scope-v2`. Chủ sản phẩm là người giao nhiệm vụ trong chat; chưa có danh tính pháp nhân, nhà tài trợ, nhóm vận hành hoặc ngân sách được chỉ định. Đây là charter làm việc, không tự tạo phê duyệt tổ chức.

## Mục tiêu và quyền

Mục tiêu sản phẩm hiện chọn: chuẩn bị và tiến tới M1 cho bốn nhóm ngân hàng/ví, tiền mặt, cổ phiếu, vàng với thiết lập, thu thập/cập nhật, quản lý giao dịch, theo dõi và Review. Amendment quản trị v2.0: nhiệm vụ mới **hoàn thiện quản trị bước 1 → thực hiện đủ bước 2 → đánh giá gate rồi dừng**, theo D-12/D-19; scope-v2 có 28 REQ/AC, giữ nguyên 18 lõi và oracle.

Quyền lần này: đọc workspace, tạo/sửa tài liệu, kiểm tra local bước 2. Chưa giao thực hiện bước 3, tích hợp thật, public deployment, billing hoặc mua dịch vụ. Phạm vi chi tiết và acceptance criteria nằm trong [Scope](scope.md); thay đổi lần này đưa Plan/Goals/Insights/AI vào phạm vi theo D-19.

## Deliverables và gate

| Mốc | Deliverables | Tiêu chí thoát |
|---|---|---|
| Bước 1 lần này | Vision, Problem, Value, Charter, Scope, Feasibility, Options, Cost, Assumptions/Constraints, Risks, Roadmap; thêm backlog và execution | Đủ artefact, bốn nhóm × năm chức năng, benefit/AC kiểm tra được, phần hoãn riêng, giả định/chi phí/rủi ro có nhãn; link/ID nhất quán |
| Bước 2 hiện được giao | Stakeholder Needs, Context Model, Operational Scenarios, PRD, SRS FR/NFR, Use Cases, Business Rules Catalogue, Data Requirements, Glossary, RTM; register và review | 28 REQ/AC bao phủ; UC đủ trường; rules/data/scenarios/oracle nhất quán; evidence review; external review pending |
| Bước 3 khi được giao | UX, prototype web tương tác local, review/demo guide/evidence | AC-01…28 kiểm tra được bằng mô phỏng, đủ desktop/mobile/keyboard; lỗi nghiêm trọng xử lý; báo đúng loại nghiên cứu |

## Trách nhiệm

| Vai trò | Trách nhiệm | Trạng thái |
|---|---|---|
| Chủ sản phẩm | Chọn mục tiêu/scope, phản hồi hồ sơ/prototype; quyết định chi phí, quyền dữ liệu và môi trường mới | User hiện tại |
| Agent thực hiện | Phân tích, tạo artefact, tự rà soát, giữ nguồn và báo trạng thái có bằng chứng | Được giao bước 2; không reviewer độc lập |
| Người tham gia đánh giá | Chạy tác vụ giả, phản hồi mức hiểu | Chưa có; không giả định đã tuyển |
| Người phụ trách nguồn/security/Ops tương lai | Xác minh adapter/quyền/PoC/gate và vận hành | Chưa chỉ định; không có vai trò Ops trên prototype |

Các owner “Agent” ở risk/backlog là trách nhiệm chuẩn bị/kiểm tra trong bước được giao; không tự gán người thật hoặc cam kết nguồn lực tương lai.

## Ràng buộc, thay đổi và thành công

Không deadline cụ thể hoặc ngân sách tiền xác nhận. Roadmap dựa trên gate, cost model là ước lượng sơ bộ. Dùng dữ liệu giả, tiếng Việt/VND/+07:00, responsive web local. Không sửa nguồn yêu cầu để làm scope tự phù hợp kết quả.

Khi có thay đổi: ghi yêu cầu mới → đánh giá tác động tới scope/AC/backlog/phụ thuộc/chi phí → cập nhật decisions và baseline. Tài liệu mở rộng lần này đã được user yêu cầu; Plan/Goals/Assistant/Insights được chọn; Budget độc lập nâng cao và Alerts vẫn `out-of-scope`. Nếu chưa có user test, chỉ báo walkthrough và giới hạn chưa kiểm chứng nhu cầu. Bước 1 xong không đồng nghĩa M1 đạt.

## Thay đổi scope-v2 — D-19 supersedes ranh giới module cũ

Nhiệm vụ hiện tại được user giao: sửa hồ sơ bước 1–2 theo 5 navigation, không build bước 3. Goal/Plan/Insights/AI/mascot trong M1 synthetic; bổ sung 10 REQ/AC giữ 18 core thành 28 tổng. DoD: đủ 11 artefact bước 1 và 10 artefact bước 2 cập nhật, UC/BR/DR/SCN/NFR/RTM không mâu thuẫn; archive v1, version/register/gate mới; thực kiểm tra local. AG self-review, PO formal approval pending. Không tự triển khai public/mua dịch vụ/gọiLLM/real data; debt/Alerts/Budget advanced ngoài scope.
