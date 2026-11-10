# Local Assistant / Planning — FW-ASSISTANT-002

11/10/2026: local additive runtime hiện có **25 owner operations**, migration 009, ToolGateway/grounded renderer/scoped model context, observation-driven deterministic selection, model-round/token/admission journals và `getAgentEvidence`. `getToolResult` đã có frozen Q&A snapshot port. Request extensions: `startAgentRun` nhận optional `proposalBody`, `draftId`, `reserveConfirmed`; `answerAgentRun` nhận optional `proposalBody`, `reserveConfirmed:true`, `settings`. Response header local là `FW-ASSISTANT-002`. Historical API005/DB005/bridge003 giữ nguyên. [Runbook](../../../finweave-backend/ASSISTANT.md) và [report hiện hành](../../execution/backend-agent-runtime-2026-10-11.md).

Các đoạn dưới mô tả baseline FW-ASSISTANT-001 trước bổ sung; trạng thái model/API consumer trong report hiện hành có hiệu lực.

23 owner operations trong [OpenAPI thực thi](openapi.json), [runtime policy](runtime-policy.json). Header base vẫn `X-FW-Contract-Revision: FW-API-T1-D1J2-005`; response thêm `X-FW-Assistant-Revision: FW-ASSISTANT-001`. Historical API005 và DB005 giữ nguyên byte/hash.

Conversation/message, grounded deterministic answer, Agent run lifecycle và planning draft CRUD/refresh/preview/confirm/simulation thực thi trên PostgreSQL. `getPlanningSimulation` là query local bổ sung tại `/v2/assistant/getPlanningSimulation`, trả simulation đã lưu, giữ baseline/version ban đầu. Plan-only simulation có `goalId`/`goalVersion` null và proposed contribution bằng zero; không nới quy tắc amount dương của actual ledger.

`reviseDraftByMessage` được đăng ký và trả `MODEL_UNAVAILABLE` sau kiểm privacy; không giả lập thành công. Simple assistant hiện trả metrics Engine từ scope/kỳ đã chụp, chưa hiểu đầy đủ intent tự nhiên, formula hoặc mọi transaction filter. Agent dùng baseline deterministic, có strict decision gateway cho 13 capabilities và không có quyền confirm/post/allocate/merge. Chưa có model provider, local model, admission model, prompt eval hoặc frontend consumer API005.

Mutation dùng command/replay, expected workspace/object versions và CSRF/current authorization như runtime chung. Preview planning TTL 5 phút, version/digest/token và base snapshot đều được kiểm trước confirm. Confirm chỉ ghi Plan/Goal/support links nguyên tử; không ghi cash, ledger hoặc funded allocations. Draft manual có thể không khả thi; phải đọc kết quả mô phỏng để biết warnings.

Mã SQL mới: `finweave-backend/database/runtime/008_assistant_planning.sql`. Worker login chỉ được gọi live-ticket ports; không SELECT/UPDATE tenant tables trực tiếp. Frozen run input, action reservations/counters và kết quả commit tồn tại qua restart. Mỗi action đều tính vào giới hạn 8 actions / 60 giây active; tối đa 2 câu hỏi, 3 candidates mỗi comparison, Agent simulation 24 tháng. Owner simulation giữ bound schema riêng.

Messages/runs có cửa sổ đọc 90 ngày; draft chưa confirm 30 ngày. Job deadline 24 giờ. Physical retention, projection terminal khi dispatcher cạn retries, eval/model admission và production recovery/release vẫn cần hoàn thiện riêng; không coi các TTL đọc là chứng minh retention đầy đủ.

Tái lập: [Assistant runbook](../../../finweave-backend/ASSISTANT.md), [kết quả](../../execution/backend-assistant-local-2026-10-11.md).
