# API T1 — revision003 / Financial Engine

09/10/2026 · **FW-API-T1-D1J2-003 — ACCEPTED DESIGN / IMPLEMENTATION NOT RUN**. Payload contractVersion=2.0.0 chưa phát hành; request/response header X-FW-Contract-Revision phải exact003, pin [OpenAPI SHA256](revision.json). Không suy tương thích chỉ từ nhãn2.0.0.

[OpenAPI](openapi.json) là bộ đầy đủ **151 operations / 626 schemas**. Kế thừa nguyên nghĩa147 operations và nguyên600 schema definitions của [002](../v2-t1-r2/README.md); header/metadata revision được cập nhật, không thay payload cũ. Thêm4 operations/26schemas để bao phủ forecast dài hạn đang chạy local trong frontend. [Diff](revision-diff.json), [schemas](schemas.json).

| Operation | Authority và kết quả |
| --- | --- |
| startForecastRun | Owner mutation, CSRF nếu cookie, idempotency/expected workspace version; freeze+enqueue cùng transaction;202 trả run, không báo forecast thành công |
| getForecastRun | Owner query đúng workspace/object/current access; cursor=null đọc trang đầu; state chưa succeeded thì page=null; succeeded trả trang bounded và nextCursor |
| cancelForecastRun | Owner mutation đúng run/version; cancel chưa commit result thì chặn publish; succeeded không bị xóa/đảo; trả authoritative state |
| executeForecastRun | Private ForecastWorker, mTLS AND per-profile MAC và live typed J2 ticket; chỉ frozen compute/checkpoint/result, không Agent/actual/active-planning authority |

start input: baseSnapshotId có thể null để server freeze current authorized facts dưới expectedWorkspaceVersion; nếu supplied thì check snapshot ownership/closure/cutoffs. Input không chứa raw ledger, LLM prompt hoặc client-authoritative balance. Scope accountIds nonempty≤100, output Goal IDs≤50, trials1…1000, months1…360; đây là per-request bounds, không cắt feature. Run phải tính cả competing Goals cần funding trong account scope.

Settings/rates/range, missing states, baseline/Plan replacement, RNG, timing, page ordering và probability semantics theo [forecast model](../../domain/forecast-model.md), [precision](../../domain/precision-calendar-snapshots.md). Strict schemas chưa đủ range validation cho numeric strings, cross-field date/scope/trial/page invariants; backend bắt buộc semantic validators. Không silent defaults/clamping/truncation. API vẫn chấp nhận kết quả thiếu dữ liệu có reason; không đổi unknown thành0.

getForecastRun không tự nhận HTTP query pagination thông thường: cursor được sign và bind owner/workspace/run/inputDigest/page/expiry; không expose private digests qua Ops. Page index0-based, pageCount cố định,12points/flows mỗi trang,≤256KiB; terminal expired trả run state=expired/page=null, không rerun. Summary phản ánh settings/seed/input/versions/classification simulated; moneyBasis=nominal dù realMoney là hint hiển thị. Probability có successes/trials và missingReasons, không incomplete-path estimate.

Cancel/finish race serialize trên run+live J2 fence. cancelRequested=true/state=running nghĩa đã nhận yêu cầu hủy, chưa hoàn tất hủy; queued có thể chuyển cancelled ngay. Nếu succeeded commit trước thì trả succeeded và không xóa kết quả. Worker cập nhật checkpoint và stage pages qua procedure hẹp; publish tất cả pages và succeeded atomic, không trả partially staged page. Current auth/access/erasure vẫn kiểm khi đọc immutable historical results. Command replay hết body TTL giữ tombstone và result reference; không tính lại cùng key. Network/timeout outcome theo [semantics001](../v2-t1/semantics.md), auth theo ARCH-06, recovery theo ARCH-07. Forecast compute **không gọi market/model/provider**.

[Permission matrix151](../../domain/operation-permissions.csv), [security overlay151](../../domain/operation-security-overlay.csv), [DB revision004](../../data/target-t1-domain/README.md), [implementation bundle](../../domain/implementation-bundle.json), [acceptance](../../domain/acceptance-plan.md). ForecastWorker là capability mới trên process/shared Planning implementation, không microservice hoặc queue authority mới. Registry/service principals phải cấp đúng profile, không dùng AgentWorker/ingestion credentials.

Frontend chưa có callsite của4operations mới và chưa migrate001/002/003; local UI forecast vẫn là local synthetic. [Consumer delta](consumer-delta.md) ghi cụ thể, không nhận source đã aligned chỉ vì thêm tài liệu. Prior API/DB/security/identity packages, evidence, r1/r2 giữ nguyên. Crypto, Fastify serialization, worker/concurrency/performance/security/UAT **NOT RUN**.
