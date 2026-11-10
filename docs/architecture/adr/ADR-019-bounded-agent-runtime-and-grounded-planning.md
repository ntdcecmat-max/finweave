# ADR-019 — Bounded Agent runtime và grounded Plan–Goals

09/10/2026 · **ACCEPTED RUNTIME DESIGN / MODEL NOT SELECTED / NOT RUN.** Trong hướng A+T1/S1+P2/D1+J2 đã chọn; không thay đầy đủ phạm vi sản phẩm, cấp quyền chi tiền hoặc deploy.

## Vấn đề

AI-SPEC-001 đã hợp nhất trợ lý cũ và Agent nhưng chưa định nghĩa cách thực thi/pin/eval. Tool calling đơn giản đã đủ nhiều câu hỏi; Agent cần giá trị thực ở chọn bước theo evidence và điều chỉnh Plan–Goals nhiều ràng buộc. Model có thể bịa số, vượt quyền, lặp sau crash hoặc reset budget qua continuation. API004 còn khóa năm Assistant outputs ở mode scripted_mock, không mô tả được model thật.

## Quyết định

1. Custom typed TypeScript orchestrator trong Assistant module/AgentWorker + J2 duy nhất; ContextBuilder/ModelAdapter/ToolGateway/GroundedRenderer. Không queue/state/financial authority thứ hai. Simple read/rules và đầy đủ history/chat/mascot/manual giữ nguyên.
2. 13 application capabilities: authorized read, bounded pure Engine compare/simulate, Planning draft-only commands, structured ask/finish. Investigation/simple subsets không được draft. Live owner/object/intent/epoch/rights mỗi action, không SQL/HTTP/trade/payment/impersonation/confirm/active-actual mutation. Worker dùng ticket/local ports, không mượn bearer owner.
3. Model decisions một action/lần, strict schemas/semantic validation; all accepted actions gồm ask/finish≤8, active≤60s, clarification≤2 qua mọi retries/resumes. Model rounds≤12, bounded repair; journal/reservation/unknown charging và draft/result/checkpoint cùng UoW. Root+UTCday admission atomic, cross-day phải reserve lại capacity nhưng không reset run budget.
4. Engine tính mọi fact; server renderer giải thích từ verified refs/classification/quality, không publish model free factual-money prose/thinking. Context minimize, source use rights kể cả local; prompts/OTP/raw/secret không log/persist/egress tùy ý. T1 trusted operator vẫn có khả năng đọc RAM.
5. Local **Ollama/Qwen3-4B** là PoC candidate; actual artifacts/hardware/structured output/tiếng Việt/latency chưa pin/đo, modelEnabled=false. Hosted adapter optional chưa chọn/cấp phí; không silent cloud/paid fallback. Scripted/deterministic/manual luôn còn.
6. **API005** supersedes unreleased004 với result.mode enum4 + toolCalls0..8, unchanged153ops/634schemas/requests/auth. Native bridge003 đổi handshake exact005; DB005 giữ87bảng/1001cột/162FK, typed Assistant payload + narrow Ops aggregate admission broker là addendum SPECIFIED cần grants/transactions tests.
7. 30 public challenge specs +12regression; baseline manual/single-tool/fixed branching, fresh held-out sau freeze, independent numeric/security oracle và cost/latency. Không coi publiccases là blind. Không đạt benefit thì cải thiện/fallback giữ đủ feature, không xóa Agent use cases.

## Hậu quả/alternatives

Typed loop phải tự kiểm recovery/concurrency, đổi lại ít dependency và tận dụng atomic J2/Planning boundaries. Framework/hosted execution chỉ review nếu có nhu cầu đo được, không mặc định microservices hoặc multi-agent. Strict JSON không financial correctness, Apache license/model card không hardware/quality guarantee. Local miễn hóa đơn inference API không chứng minh tổng chi phí0 hoặc60s đạt.

[Product spec](../../product/ai-agent-specification.md), [Agent LLD](../../agent/README.md), [API005](../../contracts/v2-t1-r5/README.md), [bundle](../../agent/implementation-bundle.json), [change report](../ARCH-12-change-report.md). Prior packages/r1/r2/runtime frontend không sửa; model/backend/native/SQL/eval/security/UAT NOT RUN.
