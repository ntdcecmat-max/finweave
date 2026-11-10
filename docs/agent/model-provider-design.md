# Model/provider và khả năng chạy thực tế

| Profile | Chọn/hạn chế |
| --- | --- |
| Scripted synthetic | Chốt baseline demo/regression, result.mode=scripted_mock; không giả là Agent thật |
| Deterministic tools/manual | Chốt luôn còn, mode=deterministic khi không model; numeric Engine authority |
| Ollama local + Qwen3-4B | **Ứng viên PoC ưu tiên**, mode=local_model chỉ sau actual call; chưa exact pin/benchmark/enable |
| Hosted optional | Không chọn model/tài khoản/API plan hoặc paid quota; mode=hosted_model chỉ sau rights/privacy/budget và actual execution |

Ollama docs có tool loop và JSON-schema structured outputs; Qwen3-4B card/license là Apache2.0 tại09/10, không chứng minh runtime artifact cụ thể/chat template/quantization/tiếng Việt phù hợp. [Ollama tools](https://docs.ollama.com/capabilities/tool-calling), [structured](https://docs.ollama.com/capabilities/structured-outputs), [Qwen card](https://huggingface.co/Qwen/Qwen3-4B). **Ollama Cloud hiện không hỗ trợ structured outputs theo docs đã đọc**, không đồng nhất local và cloud. Không dùng mutable model tag làm lockfile.

Local adapter candidate POST/api/chat non-stream, schema-constrained single Decision JSON, think=false khi model/runtime hỗ trợ; không assumption format+native tools combination hoạt động. Tool execution luôn server. Native tool-calling adapter khác phải normalize một action, no automatic execute từ SDK. Exact model/tool schema compatibility/response sizes/refusal/truncation phải test. Model supports thinking không là quyền lưu thinking; parse chọn content field, không spill raw response/thinking ra history/logger khi JSON lỗi.

Khởi điểm context8192tokens, max output1024tokens, sanitized prompt≤48KiB, response≤64KiB, concurrent1, generation timeout≤25s và remaining active budget. Đây là **config đề xuất cần PoC**; tokenizer/KV cache/model RAM/cold start/CPU/GPU/ARM64 trên I0/I1 chưa đo. Input/output bytes và tokenizer estimate phải kiểm trước request, giữ room system+decision schema+answer; vượt cap trả context-too-large/partial, không âm thầm drop competing allocations. Small model chưa đạt thì tune/quantization/model alternative được benchmark trong budget, không auto paid fallback.

Local-only config disable Ollama cloud (OLLAMA_NO_CLOUD=1 theo FAQ), loopback/private ACL, no public11434 hoặc direct browser access. Agent process chỉ inference route, không pull/delete/create model/admin endpoints. Model installation là deployment step có pinned origin/checksum/license review, không runtime request từ model. Cùng-host T1 operator vẫn có thể đọc RAM; local inference không hóa đơn API nhưng dùng CPU/RAM/điện và có thể không đáp ứng latency. [Ollama FAQ](https://docs.ollama.com/faq).

Hosted OpenAI adapter nếu được chọn sau: official function-calling strict schema, additionalProperties=false/all fields required with nullable where appropriate, parallel_tool_calls=false, application vẫn validate auth/semantic constraints. Strict structure **không bảo đảm financial correctness/quyền**; provider refusal/unknown response là explicit failure, không tool success. [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling). API schema subset phải compile per-tool, không pass nguyên private checkpoint JSONschema như provider-supported. Không dùng hosted agent state/traces/memory làm DB authority; retention/source/model egress terms còn phải kiểm trước real, chưa claim ZDR hoặc miễn phí.

Provider manifest bắt buộc runtimeVersion/imageDigest/model origin+revision+weightsDigest+quantization/tokenizer/chatTemplateDigest/licenseDigest/promptVersion+hash/toolRegistryHash/decisionSchemaHash/EngineVersion/timeout/context caps. Hiện missing artifact pins nên modelEnabled=false. Registry/preflight metadata/public docs không thay model smoke tests, safety eval hoặc latency evidence. Không tải model, sửa dependencies, mở network service hoặc gọi API ở lượt này.
