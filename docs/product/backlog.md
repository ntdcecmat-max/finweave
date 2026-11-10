> **Chỉ dẫn hiện hành — 08/10/2026:** triển khai đầy đủ mọi tính năng frontend và yêu cầu đã chọn; không dùng P0/P1/P2 hoặc giới hạn MVP để bỏ tính năng. Đọc [backlog backend đầy đủ](backend-backlog.md), [roadmap](roadmap.md), [agenda kiến trúc](../architecture/architecture-decision-agenda.md) và [thử nghiệm rủi ro](../testing/technical-spikes.md). AI phân rã, đề xuất, code, test và sửa; chủ sản phẩm cung cấp ý tưởng/phản hồi và quyết định thay yêu cầu, quyền hoặc ngân sách. Thứ tự công việc là phụ thuộc kỹ thuật, không phải cắt phạm vi.

> **Lịch sử bên dưới:** các nhãn M1/M2, P0/P1/P2, “chưa được giao”, “Android ngoài phạm vi” mô tả mốc cũ, không là backlog hiện hành. Giữ mã BL/FUT/EXT/DEP để truy vết. Nghiệp vụ theo [PRD](prd.md), [SRS](../requirements/srs.md) và [AI-SPEC](ai-agent-specification.md); không phục hồi chức năng đã chủ động thay thế, ví dụ trang Báo cáo riêng.

# FinWeave — Backlog từ phạm vi M1

Baseline `scope-v2`, version 2.1, 06/10/2026. Nguồn: [scope](scope.md), Playbook bước 1–3; nhiệm vụ bước3 tới M1 theo D-23, giữ D-19 scope. P0 = bắt buộc cho mốc tương ứng; P1 = hỗ trợ/giảm rủi ro; P2 = mở rộng chưa chọn. Bước3 đã thực hiện; dừngM1. M2/M3 chưa được giao.

## 1. Thứ tự và đầu ra có thể nghiệm thu

| ID | Priority / mức / bước | Công việc và đầu ra | REQ / AC | Phụ thuộc | Trạng thái |
|---|---|---|---|---|---|
| BL-01 | P0 / chuẩn bị M1 / 1 | Kiểm kê workspace; bộ hồ sơ 11 artefact chuyên nghiệp theo README, backlog và execution; kiểm tra phạm vi/link/ID/số | Tất cả REQ, AC-01…28 | Ba tài liệu + nhiệm vụ + yêu cầu bổ sung | `verified` về tài liệu bước 1; xem evidence |
| BL-02 | P0 / M1 / 2 | Viết use cases setup đủ ngân hàng, ví, cash, cổ phiếu, vàng; trường/validation/mốc/nhánh hủy | SET/BANK/CASH-01/STOCK/GOLD; AC-01…05 | BL-01, OD-01/02/04 dùng mặc định | verified hồ sơ EVD-S2-001; hành vi M1 nay có evidence EVD-M1-001/EVD-COV-001 |
| BL-03 | P0 / M1 / 2 | UC nhập thu–chi/chuyển/refund, CSV, source demo, cash count, lượng/giá; nêu thay đổi trước–sau | INPUT/MONEY/CASH-02/HOLD; AC-06…10 | BL-02, OD-03/04 | verified hồ sơ EVD-S2-001; hành vi M1 nay có evidence EVD-M1-001/EVD-COV-001 |
| BL-04 | P0 / M1 / 2 | UC giao dịch/override/adjustment, Tổng quan/drill-down/phạm vi, từng loại Review | TXN/TRACK/REVIEW; AC-11…16 | BL-02/03 | verified hồ sơ EVD-S2-001; hành vi M1 nay có evidence EVD-M1-001/EVD-COV-001 |
| BL-05 | P0 / M1 / 2 | Business Rules Catalogue + Data Requirements/dictionary + Glossary; trạng thái riêng, giả định OD; SRS gồm 28 FR và NFR đo/đánh giá được | Tất cả REQ; AC-01…28 | BL-02…04, nguồn Ideas + oracle | verified hồ sơ EVD-S2-001; hành vi M1 nay có evidence EVD-M1-001/EVD-COV-001 |
| BL-06 | P0 / M1 / 2 | Stakeholder Needs, Context Model, PRD; Operational Scenarios/reset/expected độc lập; RTM/register/decisions/evidence; gate bước 2 | Tất cả AC | BL-05, OD-02/04 | verified hồ sơ EVD-S2-001; hành vi M1 nay có evidence EVD-M1-001/EVD-COV-001 |
| BL-07 | P0 / M1 / 3 | IA, wireframes, tokens, ux-spec: câu hỏi→visual→drill-down; trạng thái thiếu/cũ/lỗi/empty | TRACK/UX; AC-13…17 | BL-02…06 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-08 | P0 / M1 / 3 | Web prototype local setup và cập nhật đủ bốn nhóm; reset/state demo thống nhất | SET/BANK/CASH/STOCK/GOLD/INPUT/MONEY/HOLD/DEMO; AC-01…10,18 | BL-07; chọn công cụ local khi xây | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-09 | P0 / M1 / 3 | Giao dịch, category/posted adjustment, dashboard và Review tương tác; mọi tác động theo cùng scenario | TXN/TRACK/REVIEW; AC-11…16 | BL-08 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-10 | P0 / M1 / 3 | Walkthrough đủ AC desktop/mobile/keyboard; sửa lỗi nghiêm trọng, ghi prototype-review, ảnh và demo script/cách mở | UX/DEMO; AC-01…28 | BL-08/09/12…17 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-11 | P1 / M1 / 3 | Thử tác vụ với người tham gia nếu có; ghi mẫu, trợ giúp, câu trả lời, vấn đề; nếu không thì nêu chưa user test | UP-01…08, A-01…06 | BL-10, OD-01 + người tham gia | Research Plan ready;0participants, user test/Results chưa thực hiện |
| BL-12 | P0 / M1 / 3 | IA đúng 5 navigation, tab/detail và context dùng chung, settings qua profile | REQ-NAV-01; AC-19 | BL-07, D-19/20 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-13 | P0 / M1 / 3 | Home hai khối, tháng/quý/năm/custom, Insights có căn cứ, báo thiếu coverage | REQ-REPORT-01/INSIGHT-01; AC-20/21 | BL-09/12, BR-26/27/36 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-14 | P0 / M1 / 3 | Plan CRUD/version/dashboard, thu–chi–đầu tư dự kiến, ánh xạ actual và tracking | REQ-PLAN-01/02; AC-22/23 | BL-09/12, BR-28/29 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-15 | P0 / M1 / 3 | Goals/allocations/progress và shortfall sau actual spending; tránh cộng trùng | REQ-GOAL-01/02; AC-24/25 | BL-14, BR-30/31 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-16 | P0 / M1 / 3 | Mô phỏng khi đạt goal, mua tiêu dùng/đầu tư, version và nhãn điều kiện | REQ-SIM-01; AC-26 | BL-14/15, BR-32 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-17 | P0 / M1 / 3 | AI chat/history, result cards/drill links; linh vật ở cả 5 nav, context/masking/failure | REQ-AI-01/02; AC-27/28 | BL-12…16, BR-33…36 | verified M1 (AG self-test); EVD-M1-001/EVD-COV-001 |
| BL-18 | P0 / chuẩn bị M1 / 1–2 | Archive v1, cập nhật gói bước 1–2 theo 5 navigation, 28 FR/AC, register/RTM/decisions/gate | AC-01…28; D-19…22 | Nhiệm vụ user, baseline v1/oracle | `verified` về hồ sơ; EVD-S2-001 v2; PO review pending |

BL-02…06 là gói bước 2 đã được giao: Use Cases trong BL-02…04; Rules/Data/Glossary/SRS trong BL-05; Needs/Context/Scenarios/PRD/RTM trong BL-06, đủ 10 artefact Playbook. BL-07…10/12…17 đã thực hiện và kiểm chứng M1 tại EVD-M1-001. BL-11 có Research Plan và status0participants, chưa user test thật. Không yêu cầu BL-11 có kết quả giả để vượt gate.

## 2. Công việc tiếp nối có điều kiện, chưa được giao

| ID | Priority khi được giao / mức | Đầu ra và lợi ích | Phụ thuộc / gate | Trạng thái hiện tại |
|---|---|---|---|---|
| FUT-01 | P0 / M2 bước 4–6 | Frontend-spec, logical API/transport, mock mutation/error/version/reset; frontend/tests/handover | Baseline M1; DEP-04 khảo sát boundary trước chốt transport | `planned`, hoãn thực hiện |
| FUT-02 | P1 / trước M2 transport và M3 dữ liệu thật | Threat model/PoC phạm vi Ops, ingress/egress, key policy/code/client/auth/recovery, chi phí | Nguồn Ideas 15–16; OD-07; hạ tầng/quyền riêng | `planned`, không là gate M1 |
| FUT-03 | P0 / M3 bước 7–9 | Backend ledger/worker/Engine, atomic/idempotency, workspace, tích hợp và restore có bằng chứng | FUT-01/02; budget/môi trường được cấp; gate security | `planned`, chưa tích hợp |
| FUT-04 | P1 / M3 nguồn | Chọn CSV/provider giá hợp lệ, thử mẫu/quota/license; nêu capability hỗ trợ | OD-05/06, DEP-01…03; nguồn thật chỉ sau gate security | `planned`, chưa xác minh bởi nhiệm vụ này |
| FUT-05 | P2 / nếu chọn thêm | Collector Android, thêm adapter/PDF/OCR/SMS/email, sync holdings | Scope riêng + permission/license/mẫu kiểm thử | `out-of-scope` hiện tại |
| EXT-01 | P2 / nếu chọn | Budget độc lập nâng cao với actual/refund/unclassified từ Engine | Nhiệm vụ mới + rule/báo cáo | `out-of-scope` |
| EXT-02 | Đã được chọn qua D-19 | Goals chuyển vào Plan, allocation/progress/simulation | BL-15/16; REQ-GOAL-01/02, REQ-SIM-01 | `superseded` bởi scope-v2; implemented/verified M1 |
| EXT-03 | P2 / nếu chọn | Alerts/inbox/ngưỡng/dedupe và thông báo an toàn | Nhiệm vụ mới + quyền kênh/rules | `out-of-scope` |
| EXT-04 | Đã được chọn qua D-19 | Assistant chuyển thành Trợ lý AI và linh vật; M1 scripted/read-only | BL-17; REQ-AI-01/02; provider thật OD-09 | `superseded` bởi scope-v2; implemented/verified M1 |
| EXT-05 | P2 / nếu chọn | BĐS/vốn kinh doanh/nợ/thẻ/đa tiền tệ/hộ gia đình/export/rule nâng cao | Scope + mô hình nghiệp vụ/quyền riêng | `out-of-scope` |

## 3. Phụ thuộc cần theo dõi

| ID | Phụ thuộc / điều chưa biết | Cách xử lý M1 | Cần giải quyết lúc nào / bằng chứng | Việc liên quan |
|---|---|---|---|---|
| DEP-01 | Ngân hàng/ví và mẫu thông báo/sao kê, Android permission; web/iOS không có collector tương đương mặc định | CSV và thông báo fixture giả, không công bố tên nguồn hỗ trợ thật | Trước chọn adapter thật: mẫu có quyền, version/độ trễ/thiếu/trùng/lỗi | BL-03/06, FUT-04/05 |
| DEP-02 | Provider cổ phiếu, key cá nhân quyền đọc, quota/phí/license SaaS | DEMO-A + key dummy, không gọi API | Trước tích hợp: tài khoản được cấp quyền, điều khoản/key handling; SSI chỉ là ứng viên trong nguồn | BL-03/06, FUT-04 |
| DEP-03 | Nguồn vàng, loại sản phẩm/buy-sell/đơn vị/purity; FX/time/license | Quote VND/chỉ giả chính; nhánh quốc tế/FX giả để kiểm tra thiếu/sai | Trước định giá thật: xác minh nguồn, đơn vị, license, timestamp; không tự coi giá quốc tế là giá thu mua nội địa | BL-03/05/06, FUT-04 |
| DEP-04 | Công nghệ boundary bảo vệ, key policy độc lập Ops, client/auth/recovery và chi phí | Ghi yêu cầu chưa kiểm chứng; không triển khai crypto để đạt M1 | Khảo sát trước chốt transport M2; PoC và toàn gate Ideas 15 trước thật | FUT-01/02/03 |
| DEP-05 | Nhóm user đầu, ba câu hỏi hằng tuần, người tham gia/rubric bài nộp | Giả định rõ; web tương tác local tiếng Việt đã được chọn | Trước đánh giá nhu cầu/khả năng hiểu: user test thật; rubric thêm chỉ khi được cung cấp | BL-02/07/11 |
| DEP-06 | Kỳ demo, stale policy, định dạng CSV mẫu, loại quote và rounding | Dùng mặc định OD-02…04; ghi version fixture/reset | Chốt trong rules/scenarios bước 2; không cần backend/provider | BL-05/06 |

Không kiểm tra web/provider thật trong bước 1; các nhận định API của Ideas được giữ như thông tin nguồn cần tái xác minh ở tích hợp, không phải bằng chứng mới. Không có blocker ngăn bàn giao bước 1 hoặc bắt đầu bước 2 bằng mặc định đã ghi.

DEP-07: provider/model/quota/retention và đánh giá AI thật chưa chọn (OD-09); AG theo dõi, PO chỉ định reviewer trước tích hợp. M1 scripted không cần dependency này; không suy demo có căn cứ thành chất lượng mô hình đã được đo. EST-02 thay EST-01; không có time log/actual cost đáng tin để công bố. Không dùng estimatev1 cho scope-v2. Evidence M1 không là cam kết effort M2/M3.

Kết quả hiện hành: [Validation/Gate](../design/validation-report.md), [Coverage](../execution/evidence/m1-coverage.md), [Demo](../execution/evidence/demo-script.md). FUT-01 có một số tài nguyên UI/service/mock/test tái dùng từ M1, nhưng formal contracts/transport/security và gateM2 chưa làm.

## Bước4 / v2.2

FUT-01 phần hồsơ/contract/preparation đãhoànthành theoD30; UI authmock/catalgoue theoD33implemented. Các phầnresourcehandlers/querymigration/importtokenjob/AIservices vàM2validation cònStep5–6pending. FUT-02/DEP-04securityPoC vẫnBLOCKEDreal, khôngchuyểnsangverified bởiMockTransport hayAuthGate. AUTH-UI01…08 làcheckbổsungtheouser,28REQ/ACcũ giữnguyên. [Step4report](../execution/evidence/step4-validation-report.md) và [Catalogue](../execution/evidence/step4-action-coverage.md) nêu mức thực thi từngmodule/action.

## Cập nhật bước 5 — frontend với mock

BL-02…10 và BL-12…17 đã triển khai ở same frontend qua hooks/services/API/MSW và tự kiểm trong scope M2; giữ REQ/AC hiện hành, không phục hồi optional/exclusion Goals/AI cũ. Bàn giao [source/mock/configuration](../frontend/mock-implementation.md), [coverage](../execution/evidence/step5-runtime-coverage.md), [validation](../execution/evidence/step5-validation-report.md). BL-11 research vẫn 0 participants, chưa Results. Formal M2 integration gate thuộc bước 6 chưa thực hiện. Real security/privacy/auth/provider/storage và các feature ngoài scope vẫn pending/blocked, không tự triển khai.
