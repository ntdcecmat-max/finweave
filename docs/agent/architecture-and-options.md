# Kiến trúc và phương án

Chọn **custom TypeScript orchestrator nhỏ trong module Assistant/Agent**, chạy AgentWorker P2 và J2 Postgres của ARCH09. Dùng state/action validators, ContextBuilder, ToolGateway, ModelAdapter, GroundedRenderer, Engine ports, private journal và admission broker. Không framework thứ hai sở hữu queue, financial truth hoặc conversation. Đây là thiết kế, chưa package/runtime.

| Option | Trade-off | Disposition |
| --- | --- | --- |
| O1 Typed TS state loop + existing J2 | Ít phụ thuộc; quyền/replay/budget gắn cùng UoW; phải tự kiểm checkpoint/cancel/trace | **Chốt hướng orchestration** theo stack đã chọn |
| O2 LangGraph/agent framework | Hữu ích graph lớn; thêm checkpoint/retry semantics và integration complexity; không tự thay J2 hoặc grants | Optional review nếu O1 thật sự khó bảo trì, chưa cài/chọn |
| O3 Hosted agent execution | Managed loop/hosting; thêm cost/egress/retention/trust và tool permissions | Không baseline; cần explicit provider/security/budget approval |

Flow: owner API→frozen context + message/run + J2 enqueue (atomic)→AgentWorker ticket→ModelAdapter single decision→ToolGateway auth/schema/live fence→Engine read/pure simulate hoặc draft-only command→private checkpoint/tool result→next decision→server-rendered reply. Không DB transaction giữ trong lúc chờ model; all mutations và checkpoints dưới current generation/recovery epoch. Model service không DB/token/service credentials/Internet tools; Ollama inference process chỉ weights và sanitized request, không browser truy cập trực tiếp.

I0 local model loopback ở cùng trusted host. I1 chỉ co-host inference trên private network nếu RAM/CPU/quota/backup/latency đo đạt; không hứa Oracle free VM đủ chạy cùng PostgreSQL/workers/model. Backend cloud không thể gọi localhost máy owner; remote host/tunnel cần T1 service auth/network review riêng, chưa chọn hoặc mở port. Một process inference concurrent1 khởi điểm, admission fair perworkspace, queue wait hiển thị; không chiếm API loop hoặc chặn ForecastWorker.

Chọn hướng model PoC local **Ollama/Qwen3-4B** để kiểm chất lượng và chi phí trước. Exact runtime/weights/tokenizer/chat template/quantization/license/digest pin trước test. Hosted optional adapter giữ cùng capabilities và server guards; không tự fallback hoặc dùng API key/cost của owner nếu chưa có quyền. Model card/tool support không chứng minh tiếng Việt, tool correctness, RAM hay60s đạt.
