# ARCH-13 — Báo cáo thiết kế vận hành

09/10/2026 · **DESIGN SPECIFIED / RUNTIME NOT RUN**.

Đã hoàn thiện [hồ sơ vận hành](../operations/README.md) và [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). Giữ đủ21 gói backend/41 AC và toàn bộ yêu cầu Agent. API005:153 operations/634 schemas; DB005:87 bảng/1001 cột/162 FK; native bridge003 đều không đổi.

| Bổ sung/chốt | Vì sao |
| --- | --- |
| CI local; pin source, toolchain và artifact; hosted CI cần kiểm quota | Ưu tiên không phát sinh phí; bảo đảm source đã kiểm chính là source đem phát hành |
| Cấu hình strict, secrets theo process, kiểm mount/readiness | Không lộ secrets hoặc tự tạo plaintext fallback; API chạy không đồng nghĩa đủ quyền/an toàn recovery |
| Release có bảo trì; drain/fence workers; migration journal; rollback theo tương thích | Worker cũ không được ghi sau upgrade; không reset dedupe, quyền đã thu hồi, attempts/budgets hoặc tự rewind DB |
| Logs/metrics an toàn và heartbeat/alerts ngoài host | Admin chỉ xem aggregate; host mất phải có bên ngoài phát hiện, không gửi finance/raw/prompt qua cảnh báo |
| Backup, restore và retention cụ thể | Đo RPO từ snapshot start; thử lịch12h tạo dự phòng cho mục tiêu24h; restore cần khóa/witness; purge đúng34d+24h và erase35d |
|14 runbooks,32 ca nghiệm thu và10 nhóm thử nghiệm rủi ro | Có thủ tục, điều kiện dừng, bằng chứng và thứ tự thực thi từ DB local đến full product |

19 tài liệu tổng quan được cập nhật. **536 tệp được bảo vệ không thay đổi**, gồm frontend, snapshot r1/r2, hợp đồng và các gói/evidence trước. Không đổi runtime/dependencies/lockfiles.

**Kết quả kiểm tra thiết kế:33/33 kiểm tra nhất quán,40/40 ca schema,39/39 ví dụ quyết định đạt.** Đây chỉ là kiểm tra artifact/schema và mô hình policy, không phải config loader/release/SQL/backup/restore/alerts đã triển khai.32 ca nghiệm thu vận hành vẫn NOT RUN. [Validation](../execution/evidence/arch-13-operations-2026-10-09/validation-report.json) · [Manifest/hashes](../execution/evidence/arch-13-operations-2026-10-09/artifact-manifest.json).

Chưa pin/cài toolchain thật, chưa provision cloud/backup/witness/alerts hoặc đo capacity/RPO/RTO; nguồn/model/APK/UAT vẫn chưa nghiệm thu. Không tạo secrets, gọi nguồn/model, gửi thông báo, commit/push/deploy hoặc phát sinh phí.

Các lớp ARCH01–13 đã có hồ sơ thiết kế để bắt đầu implementation và kiểm rủi ro. **Bước tiếp theo: chuẩn bị PostgreSQL local disposable và executable migrations, kiểm database trước khi xây full backend**, theo [kế hoạch](../operations/implementation-and-spikes.md). Những gates thật còn thiếu không bị coi là đã đạt hoặc dùng để bỏ tính năng.
