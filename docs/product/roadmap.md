# Roadmap v4 — triển khai đầy đủ sản phẩm

08/10/2026. Theo chỉ dẫn chủ sản phẩm: AI đảm nhiệm phân tích/thiết kế/triển khai/kiểm chứng; không mở vòng cắt MVP hoặc loại feature vì ưu tiên. [Backlog](backend-backlog.md) kiểm soát độ phủ và phụ thuộc; tất cả gói đều REQUIRED. Chia đợt để kiểm được trong lúc xây, đích là toàn bộ backend/tích hợp rồi tiếp tục cải tiến.

| Mốc | Deliverable / điều kiện |
| --- | --- |
| D0 — đã có | R1 bàn giao API/schema; r2 frontend 67 browser/131 unit PASS phạm vi synthetic. V3 PARTIAL, chưa backend/native/security thật. Snapshot r1/r2 giữ nguyên |
| A — chốt kiến trúc | AI chuẩn bị phương án tổng thể rồi xuống HLD/LLD, stack/platform/infrastructure, database, API/auth/trust, Agent và vận hành; chốt theo [agenda](../architecture/architecture-decision-agenda.md) |
| P — thử nghiệm sớm | [15 spike](../testing/technical-spikes.md) Android, nguồn, scheduler, DB/concurrency, auth, T1 security/recovery, model/Agent và adapters; song song khi độc lập, không nhận mock thành real proof |
| D — database trước | PostgreSQL local riêng, migrations001–003/roles/seed/postflight, constraints/isolation và restore; log thực thi, không chỉ parse SQL |
| B — toàn bộ backend | Identity, accounts/ledger/Engine, holdings/quotes, nguồn/import/Review, jobs/sync, Plan/Goals/simulation, Assistant/Agent và admin. Kiểm từng module theo dependency; không bỏ gói nào |
| C — ba giao diện tích hợp | User/admin adapters canonical v2 và native Kotlin/collector/outbox/APK; giữ toàn bộ tương tác và nhánh lỗi; local capability không bị ép thành API |
| Q — hoàn thiện đầy đủ | Domain/contract/integration/browser/device/Agent/security tests; mọi trạng thái bắt buộc, concurrency/crash/restore; sửa và regression, không xóa test để đạt số |
| R — dữ liệu thật/vận hành | Trusted-server T1 theo [ADR-008](../architecture/adr/ADR-008-modular-backend-trusted-server.md)/SEC-REAL-T1, nguồn có quyền, signing/deployment/scheduler, backup/monitor/quota/cost/rollback có bằng chứng |
| U — pilot/UAT/release | Dùng thật khi đủ điều kiện, sửa lỗi, owner UAT; signed APK + dịch vụ + hướng dẫn/runbook/release notes; không lỗi critical chưa xử lý |
| E — evolution | Tối ưu hiệu quả/trải nghiệm/nguồn từ bằng chứng; không dùng evolution để bỏ các tính năng đã chọn |

AI tự xử lý chi tiết kỹ thuật thường lệ trong task đã giao. Credentials/tài khoản riêng, thiết bị, nguồn thật, chi tiền hoặc thay yêu cầu bảo mật cần quyền/quyết định tương ứng. Ưu tiên miễn phí nhưng không hứa free đáp ứng mọi yêu cầu. Anti-Ops vẫn giữ; thử kiến trúc sớm trước khi khóa implementation cho real data. “Full backend” gồm nghiệp vụ, lưu bền, workers, quyền và phục hồi; stub/CRUD/mock response không là hoàn thành. Việc cập nhật roadmap này chưa thực thi SQL/backend/PoC/deploy.
