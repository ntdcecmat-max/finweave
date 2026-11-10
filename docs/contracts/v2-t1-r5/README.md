# API T1 — revision005 / Agent execution modes

09/10/2026 · **FW-API-T1-D1J2-005 — DESIGN SPECIFIED / NOT IMPLEMENTED.**
[OpenAPI](openapi.json), [schemas](schemas.json), [revision/hash](revision.json), [exact diff](revision-diff.json), [consumer delta](consumer-delta.md).

**153 operations / 634 schemas**, body contractVersion2.0.0, header X-FW-Contract-Revision exact005. API004 và các packages/baselines cũ giữ nguyên. Đây là target chưa phát hành, không tự đổi API công khai đã deploy.

`result.mode` trong getConversation/listMessages/sendAssistantMessage/getAssistantMessage/cancelAssistantMessage được mở từ const scripted_mock thành enum scripted_mock/deterministic/local_model/hosted_model. Scripted fixture cũ vẫn hợp lệ; mode mới chỉ khi thực sự chạy đúng adapter. processingKind rule/single_tool/agent/scripted vẫn riêng: cách xử lý khác nơi thực thi. Mode không cấp quyền egress hoặc xác nhận real ready.

Agent toolCalls output được bound integer0..8 ở mọi projection AgentRun; model rounds ở private checkpoint, không thêm wire field. Counter âm/vượt8 là lỗi implementation, không clamp để PASS. Run state vẫn queued/reading/awaiting_user/simulating/draft_ready/completed/partial/failed/cancelled; không thêm planning/paused enum.

Inputs, routes, auth/permissions, money fields, database DB005 giữ nguyên. [Agent architecture](../../agent/README.md) định nghĩa guards/budgets/grounded rendering. Native bridge003 kế thừa bridge002 với exact API005 handshake; consumer chưa migrate, frontend không sửa. Runtime/backend/model/native/security/eval NOT RUN.
