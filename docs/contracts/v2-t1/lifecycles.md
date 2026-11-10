# Async lifecycles và polling — T1 / J2

08/10/2026 · **SPECIFIED / NOT RUN**. Business states kế thừa [baseline lifecycles](../v2/lifecycles.md) khi không bị delta này thay; enum cụ thể theo [OpenAPI](openapi.json), SQL domain theo [DB delta](db-contract-delta.md). Không coi delivery queue state là domain state.

| Luồng | Durable acceptance | Completion / uncertainty |
| --- | --- | --- |
| Notification | Commit receipt identity/digest và minimal evidence trước202; per-item durable/rejected | Worker parse/post hoặc Review/ignored/failed; collector ACK không nghĩa tiền đã ghi sổ |
| Import | Owner preview+selected set confirm tạo import domain job và enqueue J2 | getImportJob pending/running/completed/failed; completed có thể gồm Review cases; queue cancel/fence không thêm enum cancelled vào import domain |
| Price refresh | Authorized selection, cooldown/coalesce, domain refresh record+J2 | getRefreshJob result/quality/provenance và last-good; failed không xóa giá tốt cũ; không đổi quantity/cash |
| Chat/Agent | Persist captured context/run/message rồi202 | Queued/running/await-user/draft/terminal theo schema; answer đúng question/run version; Agent draft-only |
| Planning draft | Persist/revise/simulate/preview, invalidates stale preview khi đổi | Owner confirm atomic Plan/Goals/links/history, không actual; confirmed terminal không discard |
| Ops control | Preview binding+safe confirm/replay/audit/request | Dispatcher rechecks action/domain policy; Ops result không user finance; unknown outcome tra Ops store riêng |

Polling thiết kế1/2/4/8/15s+jitter, respect Retry-After; foreground only, pause khi background/offline, resume-on-focus/network. Owner UI polls typed status APIs, không getState aggregate để advance jobs. Collector background dùng native durable worker/reconciliation, không browser timer. GET/query status side-effect-free.

J2 claim/finalize generation/token/epoch và typed domain refs là execution authority duy nhất. Provider/model call ngoài transaction; stale/expired worker denied, retry at-least-once delivery với idempotent domain effects. cancel HTTP không cancel command; cancel endpoint/CAS của Agent riêng, import preview cancel không là job execution cancel API. Lease/retry/catch-up/budget defaults cần ARCH-09 kiểm theo từng profile, không lấy generic3 attempts làm policy mọi task.

Outcome lookup committed chỉ xác nhận command đã commit receipt/enqueue/effect tương ứng, không hứa async completion. Timeout/proxy errors giữ exact original key/semantic request; result TTL expiry không re-execute. Recovery latest independent revoke/delete checkpoint áp trước uploader/workers; reconcile missing không chứng minh chưa từng post trước backup.
