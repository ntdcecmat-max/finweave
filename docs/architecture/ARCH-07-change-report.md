# ARCH-07 — Bảo vệ dữ liệu và khôi phục theo T1

09/10/2026 · **ACCEPTED DESIGN theo hướng đã được ủy quyền; IMPLEMENTATION NOT RUN**. [ADR-014](adr/ADR-014-t1-data-protection-and-recovery-witness.md), [hồ sơ bảo mật](../security/t1/README.md).

| Bổ sung/thay đổi | Lý do |
| --- | --- |
| Threat model 16 rủi ro; phân loại đủ 84 bảng và overlay 147 operations | Làm rõ ranh giới tenant/admin/device/worker/Agent/infra; giá gắn holding là dữ liệu riêng; lease/preview/replay không lộ cho admin |
| 20 nhóm khóa cùng custody, rotation và recovery capsule | Tách owner/Ops/worker; tránh mất khóa mở backup và tránh cam kết chống root được tin theo T1 |
| Storage mã hóa; export PostgreSQL nhất quán → restic mã hóa ngoài host | Backup có đường khôi phục; process upload không được xóa repository, custodian prune riêng |
| Witness độc lập lưu lệnh thu hồi/xóa có chữ ký; journal và delivery state riêng | Backup cũ không chứa deny mới nhất; chặn local trước, chỉ xác nhận an toàn cho recovery sau durable receipt |
| Restore mặc định LOCKED; kiểm witness trước đọc finance, vô hiệu credentials cũ | Tránh hồi sinh dữ liệu đã xóa, password/session/device/recovery code cũ hoặc host cũ vẫn ghi |
| Snapshot tối đa 34 ngày + prune trong 24 giờ; deadline xóa 35 ngày từ yêu cầu gốc | Lịch 7 bản ngày / 4 bản tuần không tự bảo đảm tuổi backup; bỏ snapshot metadata chưa chứng minh dữ liệu đã xóa |
| Parent/child xóa đúng loại, không chu trình; reset hoàn tất muộn không bỏ qua deny mới | Tránh parent hoàn thành sớm, race tạo workspace và khôi phục quyền ngoài ý muốn |
| Logs và egress theo allowlist/mục đích | Không đưa finance/raw/OTP/prompt/secrets vào telemetry, admin hoặc model tùy ý |
| Schema bảo mật revision 003: 84 bảng / 960 cột / 155 FK | Kế thừa 82 bảng, thêm 2 bảng điều khiển và 12 trường vào bảng hiện có; không thêm authority J2 |
| 32 ca SEC và 7 security spikes; đồng bộ HLD/LLD/Stack/Views/SRS/backlog/cost | Tách bằng chứng thiết kế khỏi SQL, crypto, backup/restore hoặc security thực tế |

API **FW-API-T1-D1J2-002** giữ nguyên 147 operations / 600 schemas; bundle pin thêm security profile và schema đích. Giữ đủ 21 mục backend REQUIRED / 41 AC. Frontend, dependencies/lockfiles, snapshot r1/r2, các API/DB/identity packages và evidence trước được giữ nguyên trong tập hash bảo vệ. Không chạy lại browser suite hoặc nâng trạng thái nghiệm thu frontend.

[Validation](../execution/evidence/arch-07-t1-security-2026-10-09/validation.json) và [preservation](../execution/evidence/arch-07-t1-security-2026-10-09/preservation.json) ghi kết quả kiểm tra thực tế. Kiểm tra artifact không chứng minh crypto, phân quyền hoặc durability đã hoạt động.

Storage/keys, SQL/grants, witness, backup/prune/restore, native, providers và Agent thật vẫn **NOT RUN**. Endpoint backup/witness/mail, dung lượng và versions chưa provision; không có cam kết tổng phí bằng 0. Không dùng dữ liệu thật, phát sinh chi phí, deploy, commit hoặc push.

Tiếp theo là **ARCH-08 Engine/domain**: decimal, lịch/ngày, FX/provenance; correction/refund/transfer/opening; Plan–Goals/forecast/snapshots; transactions/locks và oracle tài chính độc lập. Frontend float/mock không là authority tài chính cho backend.

Kết quả kiểm tra hồ sơ cuối lượt: **24/24 kiểm tra static đạt**, gồm 3 mẫu metadata hợp lệ và 15 mẫu sai bị schema từ chối. Chữ ký/hash trong fixtures là placeholder synthetic, không chứng minh crypto hoặc durability. **296 tệp trong tập bảo vệ giữ nguyên hashes**, không phát hiện drift trong tập này. [Manifest artifact ARCH-07](../execution/evidence/arch-07-t1-security-2026-10-09/artifact-manifest.json) ghi hashes của hồ sơ hiện hành; đây không phải baseline bàn giao r3 hay nghiệm thu runtime mới.
