# Cấu hình, secrets và khởi động

## 1. Ba môi trường, không đổi nhãn thay cách ly

LOCAL-SYNTHETIC: DB disposable/local volume, fixtures, mail sink, provider stub, model scripted/deterministic mặc định. STAGING-SYNTHETIC: HTTPS/origins/roles/keys/DB riêng, synthetic APK channel. REAL-T1: host/DB/keys độc lập synthetic; staging ở local hoặc host khác. Không clone finance thật vào test. Synthetic reset/seed/debug routes không đăng ký trong real.

Config loader strict typed, reject unknown/missing fields/environment và sai revisions. Public manifest chỉ apiBaseUrl/releaseId/apiRevision/nativeBridgeRevision/environmentLabel; frontend/APK không nhận DB/provider/signing/mail/model keys. REAL phải HTTPS thật, app/admin origins riêng, exact API005/DB005/native003/hash, role/profile allowlist và file secret refs đã kiểm. Placeholder/localhost/test appId/test certificate làm real startup fail. `realEnabled` không là quyền riêng lẻ vượt source/security/recovery gates.

`environmentId` random stable, namespace DB/jobs/quota/crypto/witness/backup/release theo môi trường. Không nhận environment từ request header để chọn credential. DNS/TLS/region/backup destination/alert destination/source entitlement chưa provision; cấu hình mẫu không là endpoint hoạt động. Pin nguồn config/hash; reload cần validate rồi atomic switch/generation, lỗi giữ config trước hoặc dừng component, không nửa cũ nửa mới.

## 2. Secrets và quyền

Kế thừa [key inventory](../security/t1/key-inventory.csv) và [custody](../security/t1/keys-and-secrets.md). I1 data/WAL/temp/export/secret source ở volume LUKS2 đã unlock; thiếu đúng mount identity thì dừng, không tạo plaintext directory fallback. Local synthetic không claim LUKS đã cấu hình. Operator unlock/recovery có thể làm tăng downtime; không hứa tự khởi động sau reboot.

Process nhận file read-only riêng purpose/UID/mode; kiểm quyền thật bằng cùng UID container, mount/source permissions. Compose file secrets là bind-mount, không tự mã hóa file nguồn; UID/GID/mode portability phải kiểm trên runtime đã pin. Không secret trong YAML/public env/VITE/image layers/args/shell history/error/compose-render output. Disable unencrypted swap/core dumps; tmpfs cần kiểm swap. DB/password file và certificate private refs riêng theo role; API/worker không nhận volume unlock, restic/prune, CA/APK signing keys.

Rotation giữ active-write / verify-or-decrypt-only / retired inventory. Drain/reload atomic đúng key version; không xóa key còn trong backup/capsule/refresh/factors. Service cert/HMAC theo ARCH06/07; APK signer giữ continuity theo ARCH10, không rotate như service key. Compromise restic master cần repository/key mới và clean backup, không chỉ đổi password wrapper. Secret scan chỉ hỗ trợ phát hiện, không chứng minh không có secrets.

## 3. Network và process startup

HTTPS reverse proxy tới đúng user/Ops origin; PG/model/internal API private. Root/DBA tin theo T1 nhưng app-admin không finance. Firewall deny egress mặc định theo profile; raw bank/OTP không ra model/mail/log. Docker socket không mount trong API/Ops/worker/CI untrusted. TLS verify/hostname và internal service identity không tắt vì local transport.

Thứ tự: validate mount/config/secrets→PG/schema+grants→recovery/maintenance gate→private APIs readiness→workers/policy registry→scheduler→public proxy. Readiness phải kiểm expected migration+checksum, roles, registry and recovery fence; không chỉ TCP/SELECT1. Dependency outage sau boot cần reconnect/backoff/circuit limits; [Compose health ordering](https://docs.docker.com/compose/how-tos/startup-order/) chỉ hỗ trợ startup, không là recovery protocol. App API không tự migrate. Missing model chỉ disable model feature minh bạch; không làm ledger phụ thuộc model.

[Compose secret files](https://docs.docker.com/compose/how-tos/use-secrets/). Cấu hình schema/example là DESIGN; loader, grants, mounts, firewall và TLS chưa chạy.
