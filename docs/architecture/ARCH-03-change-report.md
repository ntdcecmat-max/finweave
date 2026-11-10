# ARCH-03 — Ghi nhận I0 + I1

08/10/2026 · **ACCEPTED DESIGN — NOT DEPLOYED**. Owner chọn “tôi chọn I0 + I1”. [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md) ghi quyết định; [options](ARCH-03-options.md) giữ nghiên cứu và alternatives.

## Những thay đổi và lý do

| Tài liệu | Đã thay đổi | Vì sao |
| --- | --- | --- |
| [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md) | Chốt I0 local + I1 Oracle Always Free có điều kiện; không auto paid fallback | Ghi lựa chọn owner, giới hạn free và các bằng chứng còn thiếu |
| [Topology v0.4](deployment-topology.md) | PG/hai API/worker profiles cùng host, tách quyền; containers/Compose; host timer; HTTPS web/admin/APK | Thực hiện đúng S1 + P2 trên host miễn phí, thay candidate web service cũ |
| [Environment matrix](environment-matrix.md) | LOCAL-SYNTHETIC/STAGING-SYNTHETIC/REAL-T1, secrets/DB/client URLs và gates | Tránh trộn môi trường và test phá hủy trên real |
| [Cost v4](../product/cost-model.md) | Mục tiêu tiền thuê cloud0 có điều kiện; tách model/nguồn giá/backup/domain/email/distribution | Không nhầm free compute với full product miễn phí hoặc trial credit lâu dài |
| [HLD v0.5](high-level-design.md) / [views v0.5](views/architecture-views.md) | Cập nhật infrastructure/scheduler, thêm deployment/environment view V8 | Ranh giới logical và topology hiện hành khớp quyết định mới |
| [Stack v1.1](tech-stack.md) / [module HLD](module-high-level-design.md) | Gắn platform và scheduler I0 + I1, giữ P2/grants/atomic transactions | Không để stack tiếp tục ghi platform chưa chọn; không coi process isolation đã test |
| [LLD](low-level-design.md) / [Security](../security/security-design.md) | Cập nhật tham chiếu hướng đã chốt và backup ngoài host | Không để backup cùng VM được tính là off-host hoặc giữ Supabase candidate làm security baseline |
| [Agenda](architecture-decision-agenda.md) / [index](README.md) / [options](ARCH-03-options.md) | ARCH-03 accepted, liên kết hồ sơ, tiếp ARCH-04…13 | Phân biệt decision đã chốt với verification NOT RUN |
| [Operational decisions](../handover/operational-decisions.md) / [handover index](../handover/README.md) | Thay Render/Supabase/Vercel/Cron candidate cũ, đồng bộ cloud/DB/static/backup | Backend/Android không triển khai nhầm topology hoặc suy đã có cloud thật |

## Các điều kiện được làm rõ

- Cloud pilot phụ thuộc quota/capacity/terms thực; khi không cấp máy miễn phí thì giữ local, không tự PAYG hoặc mua dịch vụ.
- Database private/persistent, role và secret scope riêng theo process; app-admin chỉ metadata, root/DBA thuộc trust T1.
- Host timer enqueue durable jobs; mất host thì lịch ngừng, startup phải catch-up và hiển thị stale/coverage đúng.
- Backup phải mã hóa ngoài host với destination/quota/availability được kiểm; restore/deletion replay và alert độc lập host. RPO24h/RTO1ngày chưa đo.
- Model và nguồn giá chưa chọn; không xem manual fallback/scripted Agent là hoàn thành feature thật.
- DNS/TLS, exact versions/shape/region, capacity/pools và release APK còn cần kiểm. REAL-T1 chưa được bật.

## Kiểm tra và bằng chứng

[Document validation](../execution/evidence/arch-03-i0-i1-2026-10-08/document-validation.json) ghi kiểm liên kết, trạng thái và consistency của các tài liệu thay đổi. [Preservation](../execution/evidence/arch-03-i0-i1-2026-10-08/preservation.json) đối chiếu hashes trước/sau của174 tệp frontend trong source manifest đã nghiệm thu cùng canonical API/physical artifacts và r1/r2, tổng213 tệp. [Before hashes](../execution/evidence/arch-03-i0-i1-2026-10-08/preservation-before.json) giữ đầu vào kiểm tra của task này.

Đây là document checks, không chạy lại frontend suite, không SQL execution, cloud provisioning, native/model/provider calls hoặc security/restore/UAT tests. Không commit/push/deploy hay phát sinh phí. API/schema/baseline và các tệp root người dùng đã xóa được giữ nguyên.

## Tiếp theo

**ARCH-04 Database:** rà schema54 bảng/610 cột và migrations001–003 với full backlog, ownership/precision/keys/constraints/indexes/history/jobs/retention/recovery; chuẩn bị các options và kế hoạch kiểm PostgreSQL local. Không mặc định inventory hiện tại đủ hoặc đã chạy SQL.
