# Keys/secrets — custody và rotation

**DESIGN / NOT PROVISIONED**. [20 key classes](key-inventory.csv); [identity algorithms/TTLs](../identity/identity-access-design.md) giữ nguyên. Không tạo secret thật trong task này.

## 1. Chọn cách vận hành phù hợp I0/I1

Local chỉ synthetic secrets riêng, không copy real DB/key vào test. Linux I1 chọn encrypted data volume **LUKS2** cho PGDATA/WAL/temp/export staging và secret source; mount unlock do authorized operator, PG/API không startup nếu mount chưa có, không fallback sang thư mục root plaintext. Restart có thể chờ operator, schedule phải báo missed/gap; không hứa auto-unlock miễn phí có cùng mức bảo vệ. [Cryptsetup LUKS format](https://gitlab.com/cryptsetup/cryptsetup/-/wikis/LUKS-standard/on-disk-format.pdf) là chuẩn tham chiếu cho encrypted volume, không là bằng chứng host đã cấu hình đúng.

Runtime secret qua file read-only riêng process trong runtime credential directory, owner/mode0400, source ở unlocked encrypted storage; không secrets trong VITE/client bundle/env public, command args/shell history, image layers, repo, process-environment dump hoặc Compose YAML. Compose secret mount tự nó không chứng minh encryption/custody. Memory/swap/core dumps: disable unencrypted swap và crash cores, bounded tmpfs, scrub sensitive diagnostic buffers; tmpfs có thể swap nên không tự nhận đã an toàn.

Chọn file custody thay paid managed KMS hoặc self-host Vault cluster giai đoạn này để giảm tài nguyên/chi phí vận hành. Hệ quả: host root vẫn đọc được files/memory, operator phải unlock/rotate/restore; không HA/key-access policy chống chính root. Managed KMS là alternative nếu có ngân sách/need, chưa cấp quyền mua hoặc gửi secrets ra vendor. [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) hướng dẫn về inventory, least privilege và lifecycle; các cadence dưới đây là quyết định của dự án.

## 2. Cấp quyền theo purpose

Identity chỉ nhận owner verifiers/challenge/replay/CSRF/digest/recovery-code keys; OpsIdentity nhận seed/admin counterparts riêng material. Workers không nhận password/seed/owner keys. Mỗi service profile có cert+HMAC key riêng. Recovery producer Ed25519 chỉ coordinator, witness signing private key chỉ independent witness. Backup writer được đọc export và repository decryption capability cần cho restic nhưng **không backend delete quyền**; pruning credential không nằm trên source VM. API không nhận restic password/volume-unlock/APK signing/CA private key.

Tên keyId/version/purpose/createdAt/custody là metadata cấu hình; registry không chứa key bytes. CSPRNG và thư viện chuẩn; không dùng password/key cùng material cho CSRF, OTP, payload digest, service signing và backup. AEAD nonce không lặp theo cùng key, AAD bind principal/environment/purpose/object/epoch theo protocol. Auth envelope5min và TOTP seed không dùng generic payload TTL90d.

Native installation signing key, collector signing key và outbox encryption key tách purpose; không escrow private signing key sang server. Device loss/invalidation/uninstall có thể làm mất chưa-ACK payload; server recovery không giải mã hộ Keystore. APK release-signing key là key khác và cần signing continuity, không rotate theo cadence HMAC90d. Native implementations/OS support tiếp ARCH-10.

## 3. Rotation và compromise

Key lifecycle: generate→active write→read/verify-only→retired→destroyed, mỗi chuyển có version inventory và evidence. Review90days cho owner/Ops keys; không tự drop pepper đang có offline codes/refresh/tombstones hoặc AEAD key còn backup references. Reencrypt live seed/envelopes bằng approved library; retain decrypt-only versions trong capsule đến khi last referenced backup bị xóa, không đưa mọi old key vào mọi process.

Service leaf30days/renew trước7days; per-profile HMAC30days coordinated drain/restart/registry cutover theo ARCH-06. Không wildcard accept old certs/keys. CA private offline, fingerprint/public trust history và revocation state independent. Keys lost/compromised không fallback weak algorithm/constant seed; fail closed and reauthenticate/reprovision profile đúng scope.

RCE/secret incident: isolate affected process/host/egress→deny/revoke relevant epochs/credentials and anchor→preserve sanitized evidence→rotate relevant material→build clean release/host→reconcile witness/backup→test before reopen. User API compromise có thể cần revoke toàn bộ owner sessions và review multi-tenant exposure, không chỉ user đang báo lỗi. Nếu repository master key có thể bị lộ, tạo **repository mới/key mới + clean full backup**, kiểm capacity và retire compromised copies; đổi restic password/key wrapper không tự reencrypt mọi stored object. [Restic encryption/key design](https://restic.readthedocs.io/en/stable/100_references.html#keys-encryption-and-mac).

## 4. Không làm mất khả năng restore

Key capsule là encrypted file bằng **age recipient encryption**; offline recipient private key ở owner/custodian khác vị trí backup, không nhét private recipient vào chính capsule. Capsule chứa versioned server key inventory cần decrypt backup/seed và volume recovery, repository password, trust public manifests, recovery instructions; APK/CA secrets compartment riêng, không cấp bundle đó cho application processes. [age official project](https://github.com/FiloSottile/age) cung cấp file encryption; exact tool version/binary integrity/restore interoperability chưa kiểm.

Ít nhất hai bản capsule ciphertext ở media/failure domains khác nhau, recipient private key có offline recovery copy kiểm đọc được. Không vòng phụ thuộc “khóa mở backup chỉ nằm trong backup”. Key loss test gồm mất VM, mất một media, mất current key version; nếu không có authorized decrypt path thì báo không thể phục hồi, không fabricate plaintext. Real phải rehearsal bằng synthetic fixture trên môi trường isolated trước, không thử phá key thật.
