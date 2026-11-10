# Agent runtime design — ARCH-12

> **Runtime bổ sung 11/10/2026:** [BE-14/15 runtime report](../execution/backend-agent-runtime-2026-10-11.md), [runbook](../../finweave-backend/ASSISTANT.md), local FW-ASSISTANT-002. Observation-driven deterministic flows, private ToolGateway/scoped context/grounded renderer, journal/replay/cancel và cumulative model/action/time/token/admission budgets đã có implementation/evidence. Ollama adapter gated; actual model chưa pin/cài. Compute evaluation có cả ba baseline và process-generated held-out; benefit chưa được chứng minh trước baseline mạnh nhất, không coi 30 public cases là blind.

> **Implementation 11/10/2026:** [local report](../execution/backend-assistant-local-2026-10-11.md) có 23 owner APIs, 13 capability handlers và 18 PostgreSQL integration groups PASS cho deterministic baseline. Model/evals/full ART chưa chạy. Notices NOT RUN dưới đây là design baseline.

**FW-AGENT-DESIGN-001 · 09/10/2026 · DESIGN SPECIFIED / REAL MODEL NOT SELECTED / NOT RUN.**
Đây là **LLD/refinement** của [AI-SPEC-001](../product/ai-agent-specification.md), không một đặc tả sản phẩm AI cạnh tranh. Giữ AI-FR-001…024, AI-NFR-001…008, AC-27/28/38…40 và toàn bộ41 AC: hỏi–đáp, chat/history/panel/linh vật, manual planner và Agent Plan–Goals/điều tra đều phải triển khai.

Agent vẫn dùng tool calling. Khác biệt là vòng lặp chọn câu hỏi, bằng chứng hoặc phương án tiếp theo dựa vào kết quả thực, trong giới hạn server kiểm soát. Không có khẳng định lập trình cố định “không thể làm”; giá trị Agent cần đo bằng kết quả so với baseline mạnh, không số lượng tool calls.

| Hồ sơ | Nội dung |
| --- | --- |
| [Vai trò và workflows](roles-and-workflows.md) | Simple assistant, PG-01/02/03, INV-01 và trace mẫu |
| [Architecture/options](architecture-and-options.md) | Orchestrator TS/J2/Engine, local model candidate, optional cloud |
| [Execution/budgets](execution-and-recovery.md) | Decisions/state/lease/action journal/retry/cancel/admission |
| [Tools/context](tools-and-context.md) | 13 capabilities, frozen facts, privacy/injection và grounded rendering |
| [Contract/storage](contract-storage-addendum.md) | API005153ops/634schemas, DB005 unchanged, bridge003, quota/private registry |
| [Provider/model](model-provider-design.md) | Ollama/Qwen3-4B PoC, pinned artifacts/cost/egress/capability gates |
| [Evaluation](evaluation-plan.md) | 30 public challenge cases, regression12, held-out protocol/baselines/gates |
| [Acceptance](acceptance-plan.md) | 32 runtime cases NOT RUN và mapping AI-FR/NFR |

[Policy](agent-policy.json) · [Registry](tool-registry.json) · [Decision schemas](decision-schemas.json) · [Consumer/storage map](contract-storage-map.json) · [Traceability](requirement-traceability.json) · [Research](research-sources.json) · [Bundle](implementation-bundle.json).

API004 phát hiện mode=scripted_mock const ở năm Assistant projections, không thể dùng làm nhãn model thật. Tạo **[API005](../contracts/v2-t1-r5/README.md)**; [DB00587bảng/1001cột](../data/target-t1-async/README.md) giữ nguyên, **native bridge003** đổi handshake exact005. API005 không thêm endpoint/request field hoặc quyền. r1/r2, API004, các package ARCH06–11 và frontend immutable trong task này. Runtime consumers còn cần adapters/migration implementation.

Ưu tiên local PoC **Ollama + Qwen3-4B**, chưa pin GGUF/quantization/digest/runtime/model template hoặc benchmark; không tải/chạy/gọi model. Scripted và deterministic/manual baseline luôn còn. Không ngầm dùng cloud/paid/external model hoặc biến model lỗi thành lý do bỏ feature.
