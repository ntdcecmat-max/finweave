# Thứ tự triển khai và checklist bàn giao

08/10/2026. Các checkbox là việc tiếp theo, không test đã đạt. Scope được phép trong lượt này chỉ artifacts/docs; không bắt đầu backend/native/deploy từ checklist.

| Cổng | Công việc và dependency | Điều kiện ra cổng |
| --- | --- | --- |
| H0 — hồ sơ | Review canonical API2.0.0+semantics/SQL/trust/config/mapping; pin SHA256 trong build; giữ41 AC và AI-SPEC-001 | Artifact validation, known gaps và quyết định owner rõ. Không coi đây là backend accepted |
| B1 — backend local synthetic | Dedicated PG disposable, migrations001→003+roles+seed/postflight; implement auth/session/workspace/device authorization, idempotency ledger transaction, correct Engine, history/snapshot | Migration logs+least-privilege grants/RLS tests+independent ledger oracle; crash/lost-ACK/concurrent tests. Không provider thật |
| B2 — async và planning | Durable receipts/import/refresh jobs, lease fencing, draft multi-goal/plan-only, preview/confirm atomic, owner-only confirm; shared conversations/results | Schemas/examples roundtrip + domain tests AC liên quan + stale/cancel/replay/fault injection, no protected claims |
| W — user adapter | Explicit v2 envelope/errors/decimal conversions+build flag; migrate read projection/history rồi mutations/CSV/plan/goals; operational reads split getState | Regression historical capabilities+new cases, UI mask/accessibility/context/version. Không sửa route reports trở lại để hợp docs cũ |
| A — admin adapter | Separate cookie/MFA/role, metadata DTO only, reason codes, preview/confirm, safe release links | Owner/admin cross-role direct API denials, no finance in DTO/logs/import graph, audit atomic; quota/releases read-only |
| N — Android synthetic | Native bridge DTO, disclosure/OS handoff, signed bundled shell, Keystore outbox/worker, device proof/enrollment, bounded batch/ACK/quarantine | Real-device fixtures across screenoff/reboot/offline/revoke/logout/switch/force-stop; queue restart survival, no OTP/raw/cross-owner. Kotlin/APK phải làm trong task được phép sau |
| S — source/inference PoC | Source bank/wallet owner chọn; price license/key/quota rights; local model only synthetic benchmark | Source/template/OS/OEM matrix và model oracle/rubric; no silent paid fallback. OS API existence không đủ source support |
| R — real-data release | SEC-REAL independent key/client/runtime/recovery/rollback/backup proof, source rights, privacy policy/budget/UAT | Tất cả gates approved + runtime evidence; conventional synthetic không tự nâng thành real pilot |

Backend cần lưu effects+history+idempotency+versions cùng transaction; receipt ACK riêng posting; financialVersion không tăng vì chỉ đọc/chat/draft. Version/binding/device auth recheck khi worker commit. Chạy financial oracle cho transfer/refund/correction/opening/price/plan actual/goal funded/simulation, không chỉ snapshot tests phản chiếu code.

User web cần immutable original request qua timeout, replay trước re-preview khi chưa biết outcome; nhận409 definitive mới giữ input và xin preview mới. Cache không áp ACK/version cũ lên snapshot mới. Header/body protected đích không finance plaintext; current real adapter fail closed tiếp tục là expected cho tới SEC-REAL.

Admin cần kiểm cả direct requests và DB permissions, không suy role từ UI login mock. Safe reason codes, sanitized upstream errors và metadata projection không dùng join toàn finance rồi filter ở browser. Source disable giữ evidence/history và fence running job; retry không bypass provider limits hoặc force ledger effects.

Android bridge calls là local capabilities, không “REST settings permission API”. Native must persist before HTTP, validate từng item ACK, delete only durable accepted, preserve IDs/revisions/digests qua retry, same-owner epoch enforcement. Pin native/app/parser compatibility and signing fingerprint; không tạo nút tải APK khi artifact null.

Evidence mỗi cổng: commit/build digest, canonical SHA, synthetic dataset version, command/env/time, expected vs actual, raw logs sanitized, failed attempts giữ, list tests NOT RUN, reviewer/owner decision. Không dùng generated OpenAPI/SQL syntax/document checks làm bằng chứng cổng B/N/R đã hoạt động. Trạng thái hiện tại ở [validation](validation-report.md) và [RTM](../execution/realignment-traceability.md).
