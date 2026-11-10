# BE-14/15 — Runtime, flows và evidence

11/10/2026 · **LOCAL_DETERMINISTIC_RUNTIME_IMPLEMENTED_AND_MEASURED** · FW-ASSISTANT-002. Đây là phần triển khai nối tiếp [baseline local](backend-assistant-local-2026-10-11.md), không phải nghiệm thu toàn bộ model, UI/native hoặc production.

Runtime giữ cùng conversation/message history, Q&A không ép tạo AgentRun, draft/manual simulation và owner preview/confirm. Engine là authority cho balances, funding, contributions, variance và forecast. Agent chỉ ghi draft; confirm chỉ Plan + Goal + support links, không posting, transfer, allocation actual hoặc mark achieved.

## Runtime và flows

- [AgentWorker](../../finweave-backend/src/runtime/agent-worker.ts) điều phối live J2 ticket, durable selection/action reservations và checkpoint; [selector](../../finweave-backend/src/runtime/agent-selector.ts) chọn bước từ observations. Clean/incomplete/uncertain investigation có trace khác nhau; failed scenario có thể dẫn tới thử lịch khác. Không phát một danh sách tool cố định để gọi đó là adaptive model.
- [ToolGateway](../../finweave-backend/src/runtime/tool-gateway.ts) kiểm strict Decision schema, intent, nested scope, confirmed assumptions, candidate identity và version. Forbidden SQL/HTTP/confirm/actual capabilities không được dispatch. Engine tính mức góp trong [planning](../../finweave-backend/src/engine/planning.ts); comparison có thể chọn candidate khả thi ở vị trí khác đầu danh sách.
- Goal-first có competing closure, reserve/income clarification, skipped months và bounded rescheduling. Plan-first nhận typed owner proposal, hỗ trợ Plan-only/multi-goal; replan đọc variance và amendment giữ cùng draft identity. Owner answers có thể xác nhận settings, tăng constraint revision; old comparisons giữ evidence nhưng không cấp quyền cho proposal mới. Scope/facts/period giữ nguyên, không tự restart để né budget.
- [GroundedRenderer](../../finweave-backend/src/runtime/grounded-renderer.ts) chỉ lấy financial metrics từ ToolResult/Engine, giữ classification/quality/asOf/provenance. Model free prose/thinking không được publish. Q&A và run terminal/question replies nằm trong cùng transcript với run/draft refs. `getToolResult` giữ Q&A snapshot gốc; history được đánh dấu stale, không thay bằng snapshot mới.
- [Model context/adapter](../../finweave-backend/src/runtime/agent-provider.ts) dùng opaque aliases và structured allowlist; loại tên/memo/raw answers/source refs/secrets. Market values không được đưa vào model khi non-display rights chưa có. Ollama route cố định trên loopback, redirects bị chặn; không pull/create/delete model hay hosted fallback. Manifest phải kiểm runtime/weights/Ollama manifest/tokenizer/template/license artifact hashes, prompt/tool/schema/Engine pins và synthetic/cloud-disabled gates.

## Journal, replay, cancel và budgets

[Migration 009](../../finweave-backend/database/runtime/009_agent_runtime.sql) additive, không sửa migration 008 hoặc historical API005/DB005/native003. Lost-ACK receipt replay trả cùng committed result, changed arguments cùng action bị từ chối; draft + checkpoint + receipt commit cùng UnitOfWork. Không có reservation thì commit bị từ chối. Agent role không SELECT/UPDATE tenant tables trực tiếp.

Giới hạn cộng dồn: **8 accepted actions, 60 giây active, 2 clarifications, 12 model rounds, 32768 input / 4096 output tokens per root**. Ask/finish tính action; invalid model decisions vẫn charge round/token và tối đa một repair liên tiếp. Monotonic time bao gồm selection/validation/tool compute; unknown reservations charge toàn slice. Generation/session/epoch/version fences chặn stale settlement/publish; cancel abort inference best effort, không refund unknown usage hoặc tự apply/delete committed draft.

Admission dùng PostgreSQL lock/CAS: **10 roots/workspace/ngày UTC, 50 global/ngày, inference allocation concurrency 1**; cùng root không double admission trong ngày, continuation kiểm lại bucket ngày hiện tại. Breaker có 5 transient failures/5 phút và pause 60 giây. Kiểm thử prior-day/resource expiry dùng fault injection trong synthetic cluster, không gọi đó là thời gian thực đã trôi qua hoặc model throughput.

## Evaluation và mức bằng chứng

Evidence hiện hành đã kiểm source hashes bằng [verifier tổng hợp](../../finweave-backend/scripts/verify-agent-evidence.ts): [verification](evidence/backend-agent-runtime-2026-10-11/verification-1791714574437.json), [PostgreSQL Assistant](evidence/backend-assistant-local-2026-10-11/assistant-1791714503859.json), [business regression](evidence/backend-business-local-2026-10-10/business-1791714511489.json), [typecheck/pins/unit](evidence/backend-business-local-2026-10-10/checks-1791714429683.json). **33 Assistant integration groups, 23 business regression groups, 57 unit tests PASS**; **61 Assistant source/schema hashes** và **25 operations** được verifier đối chiếu. Cluster thử đã dừng. Unit regression có independent Python/Fraction financial oracle, không dùng model tự chấm tiền.

[Compute evaluation](evidence/backend-agent-runtime-2026-10-11/evaluation-1791714572068.json) mới nhất được chạy sau khi các cluster integration đã dừng. Có 28 typed instances × 3 repeats/profile, bao gồm 12 held-out instances mới sau [freeze](evidence/backend-agent-runtime-2026-10-11/freeze-1791714570008.json) và [split](evidence/backend-agent-runtime-2026-10-11/split-1791714570255.json). Repeats không phải 84 tasks độc lập.

| Profile | Rubric successes / repeats | Compute p50 | Compute p95 |
| --- | --- | --- | --- |
| Manual + Engine compute emulator | 84 / 84 | 8.59 ms | 45.00 ms |
| Single-tool assistant | 9 / 84 | 0.13 ms | 0.28 ms |
| Fixed branching workflow | 78 / 84 | 3.46 ms | 13.69 ms |
| Observation-driven deterministic controller | 84 / 84 | 4.38 ms | 13.03 ms |

Đây là in-process Gateway/Engine latency trên shared host, có order/cache confounding; không dùng để nhận owner-time hoặc model latency benefit. API latency Fastify injection + PostgreSQL, sample counts/p50/p95 theo từng operation nằm trong verification JSON. Model calls/tokens trong compute evaluation bằng zero; local CPU/RAM/energy không được diễn giải thành total monetary cost bằng zero.

`node scripts/evaluate-agent.ts` freeze source/prompt/tools/Engine/runtime trước khi process riêng sinh **12 held-out instances** bằng entropy mới. Seed/data giữ trong `.local` có ACL riêng; artifact public chỉ digest/split metadata/outcomes đã sanitize. Generator không dùng selector output để tạo expected labels và expected answers không được đưa vào runtime/model context. Implementer vẫn là tác giả generator; **independent human-authored blind review chưa chạy**.

Inventory báo đủ **30 public specifications đều không blind**. Evaluator hiện thực thi **16 bounded typed refinements** cùng 12 held-out instances, mỗi instance/profile 3 repeats. Các specification/refinement còn thiếu executable rubric ghi `NOT_RUN_BY_THIS_EVALUATOR`, không suy ra full challenge PASS. Safety/concurrency được đo riêng trong PostgreSQL suite, không cộng vào completion để nâng tỷ lệ.

Ba baseline dùng cùng tools/Engine/scope/bounds: manual forms + Engine **compute emulator**, single-tool assistant và fixed branching workflow. Human manual steps/time chưa được đo; không suy từ số action hoặc tốc độ code. Quality rubric kiểm conclusion, immutable actual/active input và financial oracle scalars; oracle Engine độc lập đã có trong unit regression. Latency p50/p95/cpu/RSS là đo compute thực trên shared host, không model cold-start hoặc elapsed task time của owner.

**Benefit gate: NOT_DEMONSTRATED** trước baseline mạnh nhất. Controller deterministic xử lý được ca late-income cần đổi lịch mà fixed workflow không xử lý, nhưng manual+Engine mạnh nhất cũng hoàn thành. Không nhận ngưỡng gain bằng cách chỉ so với single-tool yếu hơn hoặc đổi compute latency thành owner time. Mẫu nhỏ, repeats deterministic và Wilson intervals có giới hạn; không chứng minh an toàn tuyệt đối.

## Phần chưa được chứng minh

- **Actual model NOT_RUN:** hồ sơ chưa có exact pinned deployment; Ollama không tìm thấy trong PATH, đường cài/model directory thông dụng. Không tải model, mở service, gọi cloud/paid hoặc đưa dữ liệu thật vào inference. Provider tests dùng TEST_DOUBLE và được ghi nhãn riêng, không nhận là model performance. Conservative context bounds/schema compatibility, real cold/warm inference/quality/benefit cần model và phần cứng thực.
- Natural-language `reviseDraftByMessage`, formula và toàn bộ transaction-filter semantics chưa hoàn tất. Typed owner proposals/clarifications và manual planner hoạt động; không giả lời nói đã được model hiểu khi chưa chạy model.
- Web/Android chat/history/panel/mascot/manual UI giữ nguyên synthetic adapter; chưa nối toàn bộ authenticated API005 consumers/BE19 và chưa nghiệm thu full ART/native/UAT. Backend transcript/refs đã dùng chung, không tạo kho chat thứ hai.
- Physical purge, multi-workspace global-quota workload, full source license activation, production restore/unknown usage witness và human benefit evaluation còn mở. Real-data deployment vẫn đóng.

Tái lập: [runbook](../../finweave-backend/ASSISTANT.md), [local contract/policy](../contracts/local-assistant/README.md). Verifiers so source hashes với **source hiện tại**; FAIL/STALE evidence trước giữ nguyên, không sửa hashes để nhận PASS. Các PostgreSQL cluster thử độc lập và được dừng; không migrate/reset cluster đang thu quan sát scheduler 7 ngày.
