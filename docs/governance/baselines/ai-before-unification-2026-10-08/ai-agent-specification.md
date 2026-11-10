# AI Agent — cùng người dùng tạo Plan, Goals và điều tra

07/10/2026 · scope-v3 · thiết kế và giả thuyết cần kiểm chứng; chưa có real model/orchestrator. User đã làm rõ Agent phải tích hợp vào quy trình Plan/Goals. [PRD](prd.md), AC-38…40 trong [SRS](../requirements/srs.md).

## 1. Vai trò

Agent là lớp phối hợp nhiều bước có quyết định dựa trên kết quả tools, clarification và phản hồi của user. Tool calling vẫn là cơ chế của Agent; không phải công nghệ đối lập. Một nút khởi chạy được Agent, nên “có nút trigger” không phải tiêu chí phủ nhận Agent. Cần phân biệt workflow cố định với quá trình tìm phương án/điều tra thích ứng và đo giá trị của phần thích ứng.

| Việc | Thành phần thực hiện |
| --- | --- |
| Giá, lịch refresh, sum/balance, allocation capacity, cashflow, forecast, constraints | Code/Financial Engine xác định |
| Chọn dữ liệu cần xem tiếp, hỏi ưu tiên chưa rõ, kiểm giả thuyết, so và chỉnh phương án | Agent khi eval cho thấy hữu ích |
| Ghi active Plan/Goals/allocations | PlanGoals service sau explicit user preview/confirm |
| Chuyển tiền, đặt lệnh, tự sửa actual ledger, tự cấp quyền | Không tool nào của Agent được làm |

Không dùng Agent chỉ để kể lại dashboard, cộng tiền hoặc bấm refresh. Linh vật là presentation; không bằng chứng năng lực.

## 2. Journey PG-01 — tạo từ mục tiêu

Entry: nút “Cùng trợ lý lập kế hoạch” trong Goals hoặc Plan, có thể bắt đầu từ chat. Ví dụ fixture: “Muốn có quỹ100 triệu sau12 tháng, vẫn giữ20 triệu dự phòng.”

1. Agent đọc authorized current cash/coverage, các Goal/allocations đang có, Plan/actual/recurring obligations đã khai báo. Không suy mọi khoản bắt buộc từ lịch sử ngắn.
2. Hỏi phần thiếu làm thay đổi kết luận: target đã có vốn dành riêng chưa, deadline cứng/mềm, income ổn định không, reserve, ưu tiên và khoản không muốn cắt. Không lặp câu hỏi đã có dữ liệu đáng tin.
3. `proposePlanningDraft` tạo GoalDraft và PlanDraft liên kết; contribution dự kiến khác funded cash. Goal hiện có thì tạo amendment draft với baseGoalVersion.
4. `simulatePlan`/`compareScenarios` tính theo giả định, cash floor, allocations, timeline. Nếu không khả thi, Agent hỏi/đề xuất thay deadline/contribution/target; không âm thầm hạ reserve hoặc giả lợi suất để làm đẹp kết quả.
5. User sửa bằng hội thoại: “Tháng12 không đóng góp”, “Ưu tiên quỹ khẩn cấp trước”. Agent sửa draft, Engine chạy lại; hiện phần nào đổi và ảnh hưởng tới từng Goal.
6. Hiển thị Goal(s), Plan items, source funds, assumptions, cashflow/shortfall và side-by-side phương án. User có thể chỉnh form trực tiếp, lưu draft hoặc hủy.
7. “Áp dụng” mở server preview; user xác nhận rõ. Backend kiểm versions/digest/allocations và lưu bundle atomic. Hết hạn/stale phải tính/preview lại; chat “đồng ý” chưa tự cấp tool confirm trong pilot.

Result: Goal(s) và Plan đã được user lựa chọn, có quan hệ theo dõi contribution/actual rõ. Không làm thay đổi tiền thật chỉ vì tạo plan. User không dùng AI vẫn có manual planner tương đương về quyền và Engine.

## 3. Journey PG-02 — tạo từ kế hoạch tổng thể

User có thể nêu “Sắp xếp lại kế hoạch6 tháng” mà chưa có Goal cụ thể. Agent đọc phạm vi, hỏi ưu tiên, tạo PlanDraft rồi đề xuất GoalDraft tùy nhu cầu. Plan item không bắt buộc gắn goal. Một Goal có nhiều contribution items, tránh double allocation giữa mục tiêu. Không tự ép mọi expense vào một savings goal.

## 4. Journey PG-03 — theo dõi và điều chỉnh

Trigger “Phân tích và điều chỉnh” từ Plan/Goal có variance/shortfall. Rule có thể phát hiện variance và mời user; Agent đọc actual, coverage, planned items/links, kiểm sự kiện một lần hay recurring, hỏi thay đổi hoàn cảnh, so các amendment drafts. User chọn preview/confirm phiên bản mới; lịch sử kế hoạch cũ giữ. Chưa bật autonomous background replanning hoặc tự chuyển tiền. Một báo cáo định kỳ dùng rules không cần gọi model nếu không có vấn đề mở.

## 5. Journey INV-01 — điều tra chênh lệch

User hỏi vì sao tiền/giá trị tài sản thay đổi. Agent bắt đầu coverage/context, phân tách money flow với valuation, kiểm transfer/refund/duplicate/fee và actual-vs-plan khi liên quan. Kết quả mỗi bước quyết định bước sau; source thiếu thì hỏi user hoặc trả partial. Đưa ranked hypotheses/evidence/counter-evidence và đề xuất Review, không chắc chắn giả khi data thiếu. Evidence text không có quyền thay chỉ dẫn/tool policy.

## 6. Tool registry dự kiến

| Tool | Quyền / contract |
| --- | --- |
| getFinancialSnapshot, getCoverage, getTransactions, getEvidence | Read theo owner/workspace/snapshot cố định; payload tối thiểu, quyền từng object |
| getPlans, getGoals, getAllocations, getPlanActualVariance | Read trạng thái hiện tại và versions; không lấy Goal valuation làm cash |
| simulatePlan, compareScenarios | Pure calculation trên frozen inputs; decimal/constraints do Engine; response results/evidence/violations |
| askClarification | Một câu hỏi có lý do và lựa chọn; run awaiting_user, không giữ worker chờ vô hạn |
| proposePlanningDraft, amendPlanningDraft | Chỉ ghi draft sandbox của owner; không active Plan/Goal/ledger, input/schema/version validation |
| proposeReviewActions | Đề xuất chưa áp dụng có evidence/reason; user xử lý qua Review preview riêng |
| finishRun | Structured conclusion, limitations, source refs, proposal IDs; renderer chỉ nhận số đã kiểm |

Không cấp `confirmPlanningDraft`, ledger write, SQL, arbitrary HTTP, provider keys, user impersonation hoặc trade/payment tools. Các công cụ phải kiểm quyền server, không chỉ nhờ prompt. Model thấy normalized authorized facts; raw notifications/OTP/credential không vào context. Model deployment phải đáp ứng privacy profile đã chọn; local model cũng có plaintext runtime nên không tự giải quyết anti-Ops.

## 7. Runtime, budget và lỗi

Run state: queued → planning/reading → awaiting_user hoặc simulating → draft_ready/completed/partial/failed/cancelled. Draft có vòng draft→previewed→confirmed/superseded/expired riêng. Resume kiểm lại session/object versions; snapshot đổi thì rebase và đánh dấu kết quả cũ.

Mặc định đề xuất:8 tool calls và60s active runtime/run,2 lượt clarification rồi pause; mỗi user continuation tạo budget mới có rate limit ngày. Không tính thời gian user suy nghĩ vào60s. Provider/model daily quota được admin cấu hình nhưng không tự mua thêm; hết quota giữ draft và chuyển manual. Không yêu cầu chain-of-thought; audit lưu tool names/arguments được phép/results/version và giải thích ngắn đủ kiểm chứng.

Injection/invalid tool args/denied→reject, không retry mở quyền. Tool timeout→partial nếu đã có evidence; không bịa số. Sim infeasible→nêu constraints, không tự thay giả định. Cancel→dừng tool chưa bắt đầu, không áp draft; tool draft creation đã hoàn tất có thể giữ draft với nhãn cancelled run, không biến thành active plan.

## 8. Evaluation trước phát hành

Baseline A: manual forms + deterministic simulator + rule insights. Baseline B: chat single-turn routing tới một read tool. So với Agent trên cùng synthetic/adversarial dataset, không dùng dataset thiết kế làm toàn bộ held-out evaluation.

Đề xuất bộ30 tình huống:10 tạo Plan/Goals (thiếu thông tin/nhiều mục tiêu/khả thi-bất khả thi),10 điều chỉnh/điều tra (coverage gap/trùng/transfer/refund/giá),10 safety/failure (stale/cancel/quota/injection/tenant/device). Dùng rubric và expected financial oracle độc lập trước chạy; người đánh giá kiểm evidence và trải nghiệm. Mục tiêu cần PO review, không kết quả đã có:

- Tất cả phép tính hiển thị khớp Engine và mỗi factual claim có source hoặc nhãn giả định;0 unauthorized active/actual writes,0 cross-tenant leaks.
- ≥80% task completion trên các case đủ dữ liệu; case thiếu dữ liệu được đánh giá đúng clarification/partial, không thưởng cho đoán.
- Agent cải thiện ≥15 điểm phần trăm completion **hoặc** giảm≥25% thao tác/thời gian người dùng so baseline mạnh nhất, không giảm correctness/safety. Report sample sizes/latency/cost và từng nhóm; đây là ngưỡng thử nghiệm, không bảo đảm thị trường.
- Không đạt benefit hoặc latency/cost vượt ngân sách: giữ assisted forms/rules, thu hẹp Agent cho case có lợi; không thêm tác vụ vô ích để hợp thức hóa tên Agent.

Chưa chạy eval, chưa chọn model/provider/terms. R1.1 không được gọi “AI Agent hoàn thiện” khi vẫn chỉ có `scripted-assistant.ts`.
