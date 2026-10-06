# FinWeave — Product Requirements Document

> Cập nhật execution06/10/2026: nội dung requirement/scope-v2/analysis-v2 và28REQ/AC dưới đây giữ nguyên. Bước3 đã implement/kiểm chứng synthetic M1; xem [Validation](../design/validation-report.md) và [coverage](../execution/evidence/m1-coverage.md). Các câu planned/chưa app của hồ sơ bước1–2 mô tả thời điểm phân tích; trạng thái sản phẩm hiện hành nằm trong execution/register. Formal PO acceptance và user research chưa diễn ra.


ID PRD-001 · v2.0 · analysis-v2 trên scope-v2 · 05/10/2026 · in-review. Agent owner/self-review; PO pending external review. [Scope](scope.md) là nguồn 28 REQ/AC theo D-19; PRD diễn giải scope-v2. [SRS](../requirements/srs.md) đặc tả hành vi, [RTM](../execution/traceability.md) nối kiểm chứng.

## Vấn đề, mục tiêu và đối tượng

Cá nhân giả định A-01…03 có tiền phân tán, ghi tiền mặt chưa đủ, holdings tự khai báo và nguồn có thể thiếu/trùng/cũ. Sản phẩm cần trả lời tiền ở đâu, chi vào gì, tài sản theo giá nào và dữ liệu nào cần kiểm tra. Nguồn [Stakeholder Needs](stakeholder-needs.md) SN-01…12; chưa phỏng vấn hoặc kiểm chứng thị trường.

Mục tiêu bàn giao hướng M1: web tiếng Việt responsive local, tác vụ mô phỏng đủ bốn nhóm và đường truy căn cứ. Nhiệm vụ hiện tại chỉ hoàn thành hồ sơ bước 2 rồi đánh giá gate. Không xây prototype/contract/backend trong bước này.

## Phạm vi và hành trình

| Nhóm khả năng / ưu tiên | Nội dung và benefit | Requirement / AC |
|---|---|---|
| Thiết lập / P0 | Workspace/mốc, bank/wallet/cash, stock/gold; biết nguồn và trạng thái khai báo | REQ-SET-01/BANK-01/CASH-01/STOCK-01/GOLD-01; AC-01…05 |
| Đưa dữ liệu vào / P0 | CSV preview/confirm, thông báo/giá demo, thu/chi/chuyển/refund/count và lượng/giá | REQ-INPUT-01/INPUT-02/MONEY-01/CASH-02/HOLD-01; AC-06…10 |
| Khám phá và cập nhật / P0 | Filter/detail, category và sửa posted có lịch sử | REQ-TXN-01/TXN-02; AC-11/12 |
| Theo dõi / P0 | Tiền, thu–chi, dòng tiền, tài sản, drill-down giữ context; scope/archive | REQ-TRACK-01/TRACK-02; AC-13/14 |
| Review / P0 | Thiếu/trùng/transfer/refund/pending/lệch, quantity/quote/FX/cũ | REQ-REVIEW-01/REVIEW-02; AC-15/16 |
| Trải nghiệm và demo / P0 | Tiếng Việt, bàn phím, ba viewport, masking/reset và nhãn synthetic | REQ-UX-01/DEMO-01; AC-17/18 |
| Navigation và Home đa kỳ / P0 | Đúng 5 đích, tháng/quý/năm/custom; balance/as-of và coverage rõ | REQ-NAV-01/REPORT-01; AC-19/20 |
| Insights / P0 | Điểm đáng chú ý có căn cứ, mở đúng detail và không bịa xu hướng | REQ-INSIGHT-01; AC-21 |
| Plan / P0 | Thu nhập/chi tiêu/đầu tư dự kiến, ánh xạ actual, dashboard/tracking và remaining forecast | REQ-PLAN-01/02; AC-22/23 |
| Goals và mô phỏng / P0 | Phân bổ, funded progress/shortfall, kịch bản đạt goal và tác động có điều kiện | REQ-GOAL-01/02/SIM-01; AC-24…26 |
| Trợ lý AI / P0 | Chat/history/scripted result cards và linh vật contextual ở mọi navigation | REQ-AI-01/02; AC-27/28 |

Luồng lần đầu: thiết lập → đưa dữ liệu → Tổng quan → khám phá giao dịch/holding → cập nhật hoặc Review → tiếp tục theo dõi. Lần sau mở Tổng quan trực tiếp; Review là nhánh có lựa chọn, không cổng bắt buộc. Giá mới không cập nhật lượng và không thành thu nhập. Tiền chuyển trong phạm vi không là thu/chi sinh hoạt; tài khoản ngoài phạm vi làm dòng tiền của phạm vi thay đổi.

Plan/Goals/AI/Insights được chọn theo D-19. Alerts và Budget advanced độc lập vẫn out-of-scope; không giả card/inbox ngoài scope hoạt động. BĐS/vốn kinh doanh/nợ/thẻ/đa tiền tệ tài khoản/hộ gia đình, nguồn thật/collector, export/batch/user rules/trade engine đầy đủ chưa chọn. Status/badge Review và nguồn vẫn trong lõi. Không gọi tổng bốn nhóm là tài sản ròng đầy đủ.

## Chất lượng và tiêu chí thành công

Các mục dưới là **mục tiêu chưa đo**, không kết quả: 28/28 AC có tác vụ và expected; oracle khớp từng giá trị; mọi tổng có nguồn/kỳ/unit/version và drill-down; không còn lỗi nghiêm trọng khiến không hoàn thành hoặc hiểu sai tài chính. Bước 3 cần kiểm tra 1440×900, 390×844, rộng 360px, bàn phím và masking. Chart có bảng thay thế; dữ liệu thiếu/cũ/tự khai báo có nhãn. NFR cụ thể nằm SRS; không đưa ngưỡng hiệu năng server bịa vào M1.

Nếu có người thật, dùng A-04 như đề xuất, chốt rubric trước thử; chưa có thì chỉ báo Agent walkthrough. Với số giả, AC-13 kỳ vọng tiền 31,1 triệu; tài sản 76,1→77,6 triệu khi đổi giá; thu nhập 10 triệu, gross 1,1 triệu, refund 0,2 triệu, net 0,9 triệu, dòng tiền +9,1 triệu. [Operational Scenarios](operational-scenarios.md) mô tả thứ tự/reset và nhánh độc lập.

## Giả định, dependency và release boundary

OD-02: tháng 10/2026, clock demo 31/10 18:00 +07; giá >24h, lượng >30 ngày, nguồn >48h chỉ là fixture policy. OD-03: CSV demo có mapping; OD-04: vàng nhẫn demo 9999, VND/chỉ và quốc tế+FX giả. Những lựa chọn dẫn xuất (rounding, error transitions, category/refund) có nhãn ở D-13…18/BR; thay đổi phải impact RTM/scenarios/data, không tự phê duyệt.

OD-01/A-01…06 nghiên cứu còn mở; OD-05/06 provider/license và OD-07 boundary/key/client/recovery chưa xác minh. AG theo dõi, PO chỉ định reviewer thực trước bước cần chốt. M2 kế thừa hồ sơ rồi đặc tả API/transport; M3 phải có Ledger/Engine và gate privacy thật. Không gửi real finance cho Agent phát triển/LLM, không key thật trong repo/demo. Không billing hoặc public deployment.

## Gate hồ sơ

DoR/DoD theo [Plan](../execution/plan.md). Bước 2 đủ khi có 10 artefact nhất quán, UC đầy đủ, rule testable, state độc lập, REQ–AC–SCN–rule–data truy vết và self-review có evidence. Formal approval pending external review; đạt hồ sơ bước 2 không đồng nghĩa đạt M1. Backlog BL-02…06 thực hiện bước này; BL-07…17 là kế tiếp khi được giao.

## Phạm vi bổ sung — 5 navigation, 28 FR/AC

[Scope§10](scope.md) là nguồn 5 navigation: Home(Tổng hợp/Báo cáo/Tài khoản&Tài sản), Giao dịch, Plan, Dữ liệu(Nguồn/Kiểm tra), Trợ lý AI; settings ở hồ sơ. Home cho phép 1–2 khối lớn, chọn 2 khối Tiền&Hoạt động / Tài sản&Cơ cấu làm mặc định thiết kế D-20. Tháng/quý/năm/custom đổi period/scope, balance as-of khác dòng tiền kỳ; Insights có rule/result refs, no fake trends hoặc số thiếu thành0. Cơ cấu bốn nhóm không full balance sheet do chưa nợ.

Plan gồm planned income/expense/investment, dashboards/timeline, liên kết actual và variance/remaining forecast; Goals có target/due/allocations/progress/shortfall; mô phỏng khi đạt goal/mua/đầu tư có assumptions và không actual writes. M1 mô phỏng bằng synthetic fixture, không Engine thật hoặc đặt lệnh.

AI có full chat/history và mascot contextual trên cả 5 navigation, cùng conversation/cards nguồn Engine. M1 scripted responses/read-only tool result simulation, errors/no data/context change có kịch bản; không model/key/billing. Goals/Assistant không còn out-of-scope. Chi tiêu kế hoạch thuộc Plan, không mặc định chọn Budget advanced/Alerts. Mục tiêu nghiệm thu bước 3 nay 28 AC, dữ liệu người dùng vẫn chưa kiểm chứng; gate M1 cũ không đủ scope-v2.
