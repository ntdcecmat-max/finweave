# ARCH-07 — Bảo vệ dữ liệu theo T1

FW-SEC-T1-001 · 09/10/2026 · **ACCEPTED DESIGN theo ủy quyền tiếp tục; IMPLEMENTATION / SEC-REAL-T1 NOT RUN**. Kế thừa A+T1, S1+P2, I0+I1, D1+J2 và [identity ARCH-06](../identity/identity-access-design.md). Giữ toàn bộ tính năng/21 REQUIRED backlog/41 parent AC.

| Hồ sơ hiện hành | Nội dung |
| --- | --- |
| [Threat model](threat-model.md), [16 threats](threat-register.csv) | Assets/actors/boundaries, controls và rủi ro còn lại |
| [Keys/secrets](keys-and-secrets.md), [key inventory](key-inventory.csv) | Custody, cấp khóa theo process, rotation/compromise/recovery |
| [Isolation/egress](isolation-and-egress.md), [table classification](table-data-classification.csv) | Tenant/admin/device/worker/Agent; mọi bảng đích được phân loại |
| [Logs/retention](logging-and-retention.md) | Allowlist, không raw bank/finance/secret/prompt logs, TTL và xóa có kiểm chứng |
| [Backup/restore/erase](backup-restore-erasure.md) | Backup encrypted off-host, witness độc lập, recovery gate và giới hạn35days |
| [Contract/storage delta](contract-storage-delta.md), [DB target](../../data/target-t1-security/README.md) | API002 giữ nguyên; storage/security profile tiếp nối riêng |
| [Acceptance](acceptance-plan.md), [policy](security-policy.json), [bundle](implementation-bundle.json) |32 security cases NOT RUN; pin API/schema/security hashes |

Lựa chọn: giữ modular backend, per-profile permissions; secret files riêng trên storage mã hóa, không thêm paid KMS/Vault cluster. DB finance vẫn là logical structured records trong trusted server, mã hóa volume khi lưu và encrypted backup; không tự biến mọi JSON/money field thành ciphertext làm lệch API/Engine/schema. Secret/auth seed/replay có AEAD theo ARCH-06. Local synthetic trước, cloud/real cần actual encryption/key/restore evidence.

Chọn hướng **pg_dump consistent export + restic encrypted repository off-host**, append-only upload principal và pruning custodian riêng. Key capsule mã hóa `age`, offline recipient riêng. Independent deny witness chỉ chứa opaque control metadata, là control plane recovery nhỏ, không tách business modules thành microservices. Host/destination/witness endpoint, exact tool versions, capacity và credentials chưa provision. Không hứa free quota, zero chi phí/zero downtime hay backup sẵn sàng vì đã chọn tool.

T1 tin runtime/root/DBA/backup/key operators; các bên đó có khả năng đọc plaintext. RLS/masking/storage encryption không chống chính người có quyền này. App-admin khác infrastructure operator và không được đọc finance/giả danh user. RCE vào user API có thể ảnh hưởng nhiều tenant theo DB authority của process; controls giảm nguy cơ, không chứng minh chống compromise bằng vài static checks.

API hiện hành vẫn **FW-API-T1-D1J2-002**,147operations; không có wire fields/endpoint mới ở ARCH-07. Backend phải pin thêm security profile và DB revision trong bundle; schema compatibility không thay security behavior. Không sửa frontend, baselines r1/r2, API/DB packages trước hoặc evidence cũ.

[ADR-014](../../architecture/adr/ADR-014-t1-data-protection-and-recovery-witness.md), [change report](../../architecture/ARCH-07-change-report.md), [validation](../../execution/evidence/arch-07-t1-security-2026-10-09/validation.json). Kiểm chứng hồ sơ không là SQL, penetration test, APK, vendor, backup encryption hay restore execution PASS. Sau ARCH-07 tiếp **ARCH-08 Engine/domain**.
