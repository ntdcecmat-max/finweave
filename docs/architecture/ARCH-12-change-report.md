# ARCH-12 — Báo cáo Agent runtime

09/10/2026 · **DESIGN SPECIFIED / MODEL DISABLED / RUNTIME & EVAL NOT RUN.**

Đã xuống mức thực thi cho Agent Plan–Goals/điều tra, kế thừa đầy đủ assistant/chat/history/panel/mascot/manual và41 AC. [AI-SPEC-001 v1.1](../product/ai-agent-specification.md) vẫn là nguồn product requirements duy nhất, [Agent package](../agent/README.md) là LLD/refinement và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md) ghi thiết kế chọn.

| Thay đổi | Vì sao |
| --- | --- |
| Làm rõ simple read/rules vs adaptive PG-01/02/03/INV-01 | Agent cần chọn bước/clarification/phương án theo kết quả thực; không giả có khả năng ngoài tool calling hoặc ép mọi câu hỏi chạy đa bước |
| Custom TS/J2 loop,13capabilities và per-intent/live auth guards | Kế thừa stack/Engine/atomicity, không Agent tự confirm/actual hoặc worker impersonation |
| Journal/replay/budget/clarification/cancel/UTCday admission | Crash/retry/resume không duplicate draft, reset8/60s hoặc dùng quota ngày trước để vượt cap |
| Grounded server rendering và scoped context/rights | Không lấy model text làm authority tiền, không leak qua narrative/history/accessibility, không raw/thinking/API keys |
| Tạo API005 + native003, DB005 giữ nguyên | API004 result.mode khóa scripted_mock tại năm projections; model thật cần mode đúng, counters nonnegative/bounded, native handshake exact005 |
| Local Ollama/Qwen3-4B PoC candidate, artifact pin/limits/fallback | Ưu tiên free-first nhưng không giả runtime/hardware/model quality đã kiểm; không cloud/paid silently |
| 32runtimecases,30publiceval+12regression và baseline A/B/C/heldout protocol | Đo lợi ích thật và giữ capability cũ/mới; publiccases không nhận là blind hoặc benchmark PASS |

## Hợp đồng và preservation

Current **FW-API-T1-D1J2-005 —153operations/634schemas**, **FW-PHYS-T1-ASYNC-005 —87bảng/1001cột/162FK**, **FW-NATIVE-BRIDGE-003**. Five Assistant result.mode outputs mở scripted_mock/deterministic/local_model/hosted_model; five AgentRun projections bound toolCalls0..8; không đổi input/route/auth/actors. API004/bridge002 và các packages ARCH06–11 giữ nguyên, compatibility/binding ghi trong [bundle](../agent/implementation-bundle.json)/[consumer delta](../contracts/v2-t1-r5/consumer-delta.md). Native/web/admin/backend consumers chưa migrate.

**486 tệp được bảo vệ** gồm frontend/baselines/prior packages/tools/evidence được đối chiếu;27 current documents cập nhật và hashes mới nằm manifest ARCH12. Không sửa r1/r2/historical manifests hoặc files người dùng đã xóa.

[Validation](../execution/evidence/arch-12-agent-2026-10-09/validation-report.json) · [schema examples](../execution/evidence/arch-12-agent-2026-10-09/schema-validation.json) · [model-only vectors](../execution/evidence/arch-12-agent-2026-10-09/model-validation.json) · [manifest](../execution/evidence/arch-12-agent-2026-10-09/artifact-manifest.json).

Kết quả: **31/31 kiểm tra tài liệu và hợp đồng, 77/77 ca kiểm tra schema, 34/34 ví dụ mô hình thiết kế đạt**; **486 tệp được bảo vệ không thay đổi**, 68 artifact được ghi checksum. Đây **không** phải kiểm thử model thật, Engine tài chính đã triển khai, SQL/phân quyền/quota đồng thời, Android/APK, security/restore hoặc UAT. Kết quả frontend lịch sử 67 browser / 131 unit không được chạy lại hay mở rộng phạm vi bởi task này.

## Phần chưa kiểm chứng và tiếp theo

Exact runtime/weights/quantization/tokenizer/template/license hashes, machine RAM/CPU/cold-warm inference, Vietnamese/action quality và60s budget chưa đo; model vẫn disabled. Hosted model/provider/budget/egress/retention chưa chọn. Registered payload/quota broker, Engine/draft/replay/serialization/runtime adapters cần implementation và fault tests; source rights vẫn gates ARCH11.

Không tải/chạy/gọi model, không sửa frontend/dependencies/lockfile, không commit/push/deploy/account/chi phí. Tiếp theo **ARCH-13 Operations**: CI/config/secrets/migration/rollback/metrics/backup/retention/runbooks, rồi các PoC rủi ro cao và database/backend implementation theo hồ sơ đã thống nhất.
