# J2 queue protocol

**ASY-01…10 · DESIGN / SQL & CONCURRENCY NOT RUN.** [Registry](job-registry.json), [transitions](job-transitions.csv), [Engine transaction order](../domain/transactions-and-concurrency.md).

## 1. Ownership và enqueue

`jobs` là nguồn duy nhất của dispatch state, lease, generation, attempts và thời điểm thử lại. Receipt/refresh/import/message/Agent/forecast giữ trạng thái nghiệp vụ; legacy lease fields chỉ tồn tại trong expand design cho tới cutover, không có hai consumer cùng chạy. `ops_jobs` chỉ là projection được làm sạch, không có quyền điều khiển tài chính bằng sửa trực tiếp.

Domain acceptance + payload input/pin + job + command replay được commit trong một UnitOfWork. Dedupe `(workspace,job_type,dedupe_key)` trỏ identity nghiệp vụ bất biến, không lấy attempt hoặc thời gian retry làm identity mới. Question/answer continuation có bước riêng nhưng cùng run/budget. Enqueue xong mới ACK; `202` không nghĩa đã post/hoàn thành. [HTTP semantics](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.3).

Jobs không chứa notification, account amount, prompt, tool evidence, model output hoặc seed/results. Registry server map type → domain kind/table → selector → capability → typed port; không nhận table/profile/SQL từ caller. Cùng service certificate không tự có mọi profile. Private HTTP ports vẫn mTLS AND MAC; in-process port dùng verified scoped ticket và DB role đúng, không bỏ quyền vì cùng codebase.

## 2. Claim và lock order

Dispatcher scan **candidate IDs không khóa** từ due index, chỉ trong capability lanes có slot trống. Với từng candidate, transaction ngắn lấy workspace access/recovery anchor trước, rồi job row `FOR UPDATE SKIP LOCKED`, kiểm lại due/state/policy/deadline/attempt/current authority. Không scan khóa toàn queue rồi gọi financial workflow ngược lock order. Narrow workspace-gate procedure không cấp SELECT dữ liệu tài chính cho dispatcher.

Claim thành công tăng generation và attempt_count đúng một lần, tạo attempt, cấp token ngẫu nhiên và lease; tất cả cùng commit. Token không log. Mọi check/heartbeat/checkpoint/finalize bind workspace, domain kind/ID, type, capability, job ID, generation, token và recovery epoch. Generation/token cũ không được hồi sinh. `attempt_count` không tăng vì heartbeat, checkpoint, poll hoặc bị pause trước claim.

Global scheduler/control/retention dùng global scoped ports + host/advisory locks + bounded pages, không tạo workspace giả trong bảng tenant jobs. `dispatchJobs` chỉ trả counts; không trả ticket/payload hàng loạt cho public/admin. `leaseSeconds` của contract là request ceiling trong30…120s, **server min với profile, attempt deadline và job deadline**; không cho caller nâng policy. Batch≤20 nhưng chỉ claim số work có reserved local slots; profile lanes không claim để nằm chờ trong RAM.

## 3. Clock, heartbeat, finalize

DB `clock_timestamp()` lấy sau khi đã có locks quyết định lease/due/deadline. `now()`/transaction timestamp không dùng làm thời gian mới sau một lần chờ lock dài. Supervisor dùng monotonic elapsed timer để cắt execution; không lấy clock browser/provider để cấp lease. [PostgreSQL clocks](https://www.postgresql.org/docs/18/functions-datetime.html#FUNCTIONS-DATETIME-CURRENT).

Lease mới = min(DB-now + requested/profile lease, attempt-start + active cap, absolute deadline). Heartbeat chỉ khi **now < lease_until**, ticket/epoch còn đúng, chưa cancel và chưa vượt active cap. Equality đã expired. Không heartbeat mãi một attempt bị treo. Config/profile có version pin trong job; `deadline_at` ghi ngay enqueue và không đổi khi retry/manual retry/deploy. Timings trong registry là cấu hình thử đầu, cần đo trước tăng tải.

Tác vụ chạy ngoài transaction. Checkpoint lưu qua narrow procedure dưới live fence; forecast staging không public. Finalize lấy locks chuẩn, kiểm current authority và DB time ngay câu SQL cuối có effects. Effect/domain marker/history/version/result/replay và **job success cùng UoW nếu cùng DB**, sau đó commit ngay, không network. Fence check dưới row lock là điểm tuyến tính hóa; reaper/cancel phải đợi lock. Transaction phải bounded, không hứa wall-clock chưa qua expiry ở thời điểm ACK tới client. Nếu ACK queue tách khỏi domain commit: luôn commit domain trước; retry kiểm durable domain result rồi ACK, không tính/ghi effect lại.

Lease hết hạn: reaper khóa đúng anchor/job, đóng prior attempt `expired`, invalidates token (generation tiếp tục tăng ở claim tiếp theo), clear cả lease fields, rồi queued với backoff hoặc failed khi hết budget/deadline. Worker cũ không được tự finalize attempt của worker mới. Queued/terminal không mang lease. Unknown COMMIT outcome phải tra marker/replay bằng identity cũ; không tạo domain/key mới.

## 4. Retry, pause và capacity

Backoff `b=min(900,5×2^(attempt−1))` giây; equal jitter trong `[b/2,b]`. Next due ≥ max(backoff, Retry-After/provider cooldown), không cap floor của provider xuống900s. Nếu next due vượt deadline thì terminal failure, không chạy sớm để “kịp”. Giới hạn3 retries của DB deadlock/serialization là retry **toàn UoW**, không nhân thành3 provider/model calls. Không tự retry lỗi quyền, stale preview, digest conflict, input invalid hay recovery fence.

Manual Ops retry chỉ cho lỗi transient thuộc safe registry, tối đa2 cycles bổ sung theo base profile, CAS current version và cùng domain identity. Tăng `max_attempts` có giới hạn; không reset attempt_count, deadline, quota, Agent run budget hoặc consent. Committed/succeeded/cancelled/permanent-error jobs không bị reopen. Owner muốn một tác vụ khác dùng command mới theo UX, không giả đó là retry cùng job. Ops không chọn workspace/private job payload; private broker resolve opaque Ops mapping.

Pause/source disabled chặn admission và recheck trước effect. Không giữ slot/lease để ngủ chờ hàng giờ. Job queued được defer không tăng attempts, deadline vẫn chạy; khi hết hạn phải có trạng thái rõ. Capacity limit trả429/503 với floor, không giảm trials, bỏ selected rows hoặc đổi paid provider. Luân phiên workspace lanes và giới hạn3 running/workspace tránh một owner giữ mọi slot; fairness cần benchmark, `SKIP LOCKED` không tự bảo đảm công bằng.

## 5. Cancellation

Hủy HTTP/đóng tab chỉ hủy việc chờ, không hủy command. Chỉ cancellation operation được đặc tả mới đổi domain. Forecast: queued→cancelled ngay; running giữ cancelRequested=true, cấm checkpoint/publish mới và supervisor abort, rồi fenced ack/reaper đóng cancelled. Succeeded commit trước thì giữ succeeded. Agent/message có enum cancelled nhưng không có cờ public: cancel CAS có thể terminal hóa domain và fence job trong cùng transaction; late model/tool result bị bỏ, draft đã commit vẫn là draft.

Import/receipt không có public cancel-job endpoint. Revoke/erase/disable policy có thể fence work, nhưng không bịa enum cancelled vào import domain và không reverse posted facts. Retention/erasure dùng workflow quyền riêng ARCH-07. Cancel sau actual commit không là lệnh hoàn tiền/sửa giao dịch.
