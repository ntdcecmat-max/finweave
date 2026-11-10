# ARCH-09 — Báo cáo thay đổi xử lý nền và đồng bộ

09/10/2026 · **ACCEPTED DESIGN; RUNTIME NOT RUN**. [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [hồ sơ async](../async/README.md).

| Thay đổi | Lý do |
| --- | --- |
| Narrow PostgreSQL queue ports,6typed job kinds, live lease/generation/epoch và lock order | Kế thừa J2; tránh hai nơi dispatch hoặc worker cũ ghi sau revoke/restore |
| Job policy/deadline, retry floors/cycles, pause/cancel/capacity | Restart/retry không đổi luật, nâng quyền hoặc gia hạn work vô hạn |
| Native outbox/ACK replay/quarantine có bounds, exact pairing và dedupe hai lớp | ACK chỉ xác nhận receipt; tránh vừa mất notification vừa ghi trùng giao dịch |
| Restore missing→investigation, không auto repost | Backup cũ không chứng minh chưa từng ghi tiền; giữ witness/deny precedence |
| Daily18hVN/manual/catch-up, frozen selection, private durable quota | Client tắt vẫn có lịch; không giả lịch sử/giá mới, không vượt source quota sau crash |
| Atomic import, Assistant kế thừa, cumulative Agent budget, forecast compute pool/checkpoint | Không bỏ feature; không partial import hoặc block HTTP/heartbeat; không publish xác suất từ paths dở |
| Session/epoch/version sync, bounded polling và unknown outcome | Không render response user cũ hoặc thực hiện lại command chỉ vì timeout |
| API004153operations/634schemas; DB00587bảng/1001cột/162FK | Sửa2schema CSV/coverage, thêm2queries coverage; thêm1bảng quota và3trường để protocol có storage rõ |

Giữ **21 REQUIRED backend items /41 parent AC**. Chỉ cập nhật tài liệu, metadata và công cụ kiểm hồ sơ. Không sửa frontend/dependencies/lockfiles, deleted root files, prior packages/evidence hoặc r1/r2. API004/DB005 là target design, consumers chưa migrate. Không chạy lại browser suite hoặc đổi kết luận frontend synthetic/mock.

Kết quả: **28 kiểm tra hồ sơ tĩnh PASS; 48/48 ví dụ mô hình PASS; 377 tệp được bảo vệ giữ nguyên hash; 25 tài liệu hiện hành đã đồng bộ**.634schema definitions hợp lệ về cấu trúc;8request/reply mẫu mới/sửa và298mẫu kế thừa đạt. Hai trường hợp CSV selectors hợp lệ được nhận,14input sai cấu trúc bị từ chối;2ví dụ kỳ thời gian sai ngữ nghĩa nhắc việc backend vẫn cần semantic validators. Không lấy các số này làm số bài kiểm thử runtime đã chạy.

Kết quả lưu tại [validation](../execution/evidence/arch-09-async-2026-10-09/validation.json), [model results](../execution/evidence/arch-09-async-2026-10-09/model-results.json), [schema shapes](../execution/evidence/arch-09-async-2026-10-09/schema-shape-results.json), [preservation](../execution/evidence/arch-09-async-2026-10-09/preservation.json), [document sync](../execution/evidence/arch-09-async-2026-10-09/document-sync-validation.json), [manifest](../execution/evidence/arch-09-async-2026-10-09/artifact-manifest.json). Manifest ghi nhận72artifact thiết kế/tools/evidence/current docs, không tạo release backend hoặc thay baseline r1/r2.

**32 runtime cases NOT RUN**: SQL/clean install/upgrade/grants/concurrency, worker kill/heartbeat/faults, largest forecast/ARM64/memory, provider quota/source quyền, Android listener/OS/OEM/replay, crypto/witness/backup/restore/erasure và Agent/model/UAT chưa nghiệm thu.48 model examples chỉ kiểm specification decisions, không là production workers hoặc concurrency proof. Không dùng dữ liệu thật, gọi provider/model thật, phát sinh chi phí, provision, deploy, commit hoặc push.

Tiếp theo **ARCH-10 Android**: listener/WorkManager/Keystore/encrypted Room/outbox, native↔WebView owner broker, capture identity/provenance, support matrix, build/sign/update APK và các thử nghiệm OS/OEM cần thiết.
