# Imports, Assistant, Agent, forecast và Ops

**ASY-23…27 · DESIGN / IMPLEMENTATION NOT RUN.** [Registry](job-registry.json), [API003](../contracts/v2-t1-r3/README.md).

## Import

Preview parse/stage là owner-scoped bounded operation, không post. Confirm kiểm preview/digest/expected versions/account/mapping và unique selected rows≤100; atomically freeze selected set, pin normalized rows + typed mapping/profile context, tạo import_job pending và J2 job. Expire preview24h không được xóa selected rows của job đã confirm. Preview không đủ selected context không enqueue; không reload raw CSV khi retry.

Worker chuẩn bị parse/match ngoài transaction; all selected effects + Review references + immutable committed IDs + result/version/replay/job success commit **một UoW**. Không chunk commit từng10rows rồi gọi failed như chưa import gì. Max100 selected/request là contract đang có, không truncate file hoặc bỏ functionality; cùng preview một confirmed selected set unique, chọn khác cần preview mới theo current design. Crash trước commit→rollback; crash sau commit→retry trả result cũ, không import lại. Duplicate source/CSV phải qua semantic dedupe ARCH-08/09; ambiguous có Review, `completed` không nghĩa mọi row đã post.

Domain enum pending/running/completed/failed giữ nguyên. Permission/recovery/erasure fence đi failed với safe reason khi thích hợp, queue có thể cancelled; không thêm cancelled/needs_review vào import state. Current expected versions của confirm là admission; worker vẫn rechecks source/mapping/account hiện tại và financial rules, không dùng confirmation để bypass thay đổi nguy hiểm. Full selected set fail thì không có subset financial effects; staged Review planning không public trước commit. Hai connections/fault injection phải kiểm atomicity và selected pin cleanup.

## Assistant kế thừa và Agent đa bước

Q&A/chat/history/context/mascot vẫn giữ. `sendAssistantMessage` có thể tạo message+frozen context+J2 `assistant_message`; AgentWorker thực hiện local typed port `executeAssistantMessage` dưới job ticket, không cần bịa public operation mới. Message simple có agentRunId=null; không ép mọi câu hỏi thành goal/plan/investigation chỉ để vừa enum startAgentRun. Tool read/simulate/draft đã duyệt, không actual/owner confirm. Multi-step run dùng existing start/execute/answer/cancel operations và cùng conversation.

Agent `awaiting_user` commit questionId/run version rồi job step succeeded/release lease; không giữ process ngủ chờ user. Answer phải đúng question/version, current owner và idempotency, CAS consume question, tạo step dedupe(run,question,answerVersion). Hai answers chỉ một accepted continuation; replay không thêm một job. Run budget8tool calls/60s active/2clarifications **cộng dồn qua steps/retries**, không reset vì answer hoặc restart. User-wait không tính active60s; queue deadline24h chỉ cho step đã enqueue, run pause không giả expired vì user chưa trả lời. Run history/payload retention theo existing policy; re-preview context stale khi tiếp tục.

Trước mỗi model/tool call reserve call counter/active budget trong run+private checkpoint dưới live ticket; network ngoài transaction. Với timeout/crash charge phần đã reserve, không trả lại vì thiếu receipt. Chỉ refund unused reservation khi observed completion được settle một lần đúng generation/call identity. Tool/model unknown không retry mù: read-only có thể thử lại dưới quota còn, draft-write tool phải tra committed tool result/deterministic draft identity trước gọi lại. Budget hết thì partial/pause có evidence đã lưu, không trả số bịa hoặc cấp thêm quyền. Chưa cho phép paid/model egress; provider choice/evals ở ARCH-12.

Cancel message/run CAS terminal/fence theo [queue protocol](queue-protocol.md); tool đã commit draft không tự xóa/áp dụng. Owner confirm draft là command riêng với preview/version/funding, không nằm trong retry job. Agent invocation không có quyền tự bấm confirm hoặc tạo actual.

## Forecast

Frozen input/model/Engine/RNG/seed/dependencies theo ARCH-08. ForecastWorker supervisor có **pool worker_threads bounded1** cho pure compute, giữ heartbeat/cancel/DB I/O trên supervisor loop. Chỉ truyền input/checkpoint dữ liệu, không DB client/token/key; threads là cách tránh block loop, **không là security sandbox**. API và worker profiles vẫn process riêng P2. [Node worker threads](https://nodejs.org/api/worker_threads.html) dành cho CPU work; async function đơn thuần không đưa vòng lặp tính toán sang thread khác.

Checkpoint mỗi≤2s compute slice hoặc10.000 trial-days, whichever first; private chunk≤256KiB, kết quả lớn chia result pages hiện có. Intermediate matrix/RNG/residual không được serialize thành một JSON không giới hạn; layout per-trial/aggregate chunks có typed payload closure và manifest checkpoint atomic. Current input/model/runtime digest phải trùng khi resume; release thay incompatible runtime thì fail rõ, không mix math versions. Batching khác không đổi simulation grid/draw IDs. Attempt active cap600s, automatic3attempts, job deadline24h là starting resource budgets; nếu largest supported input không đạt cần benchmark/tune implementation/config, không giảm trials/horizon/Goals hoặc nhận partial paths thành full probability.

Supervisor checkpoint chỉ khi live fence và chưa cancel; checkpoint/reply không tăng claim attempts. Không publish bất cứ page/probability nào cho tới mọi paths/pages validate và atomic succeeded. Near attempt cap có thể save checkpoint rồi transient retry trong budget; repeated zero-progress hoặc budget exhausted phải failed rõ. `executeForecastRun.completed=false` là chunk progress, không job success; completed=true phải kèm authoritative terminal state, cancelled/failed không được xem như thành công tính toán. Frozen outputs vẫn current-auth protected, pinned/expiry/recovery theo ARCH-07/08.

## Ops và global maintenance

Ops preview/confirm chỉ safe retry_job/disable_source qua opaque operational mapping. `ops_control_requests` + audit/replay commit cùng Ops DB transaction; broker private resolve và recheck registry/live domain/version/rights rồi disposition applied/rejected. Không distributed transaction giữa admin HTTP và finance work, không dùng Ops success ACK để báo private job đã retry thành công. Retrying control request không reset domain budgets.

Host retention chạy bounded batches≤1000 theo existing `purgeExpiredData`; before input chỉ giảm cutoff, không cho purge sớm hơn policy/pins. Lock prevents overlapping batch, process chết có thể retry by identity. Full erasure/backup/witness pruning không được giả cache purge và không nằm trong generic tenant worker profile. Global control/witness/retention queues có own typed stores, không tạo J2 thứ hai cho financial delivery.
