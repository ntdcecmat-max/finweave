# ADR-013 — First-party identity và credentials theo scope

08/10/2026 · **ACCEPTED DESIGN theo ủy quyền kỹ thuật; IMPLEMENTATION NOT RUN**.

## Bối cảnh

ARCH-05 chốt141operations và authority separation nhưng chưa có credential family/replay/crypto/challenge storage đủ để implement. T1 tin server/root/DBA, P2 tách user/Ops/workers; mục tiêu free-first và full frontend features không đổi. Prototype hybrid mock không là auth thật.

## Quyết định

- First-party password/email challenge owner và opaque sessions; admin password+TOTP bắt buộc, credentials/stores riêng. Email không được gọi MFA/AAL2. Không thêm managed IdP/Redis/paid resource.
- Browser __Host-cookie HttpOnly/Secure và session-bound signed CSRF; native owner access15min/rotating refresh family30days, install key proof. Auth response encrypted replay5min, current revoke/epochs luôn thắng replay.
- Collector key/token riêng, token24h renewal bằng collector-key proof trong owner authorization30days. Không lấy owner refresh cho unattended upload; device renewal không có owner finance quyền.
- Service mTLS AND per-profile HMAC-SHA256 signature+nonce; typed J2 capabilities và DB grants vẫn kiểm độc lập. Argon2id candidate64MiB/t3/p4 cần benchmark; ES256 P-256/SPKI/raw signature có wire rõ.
- Server-managed password reset15min và optional offline one-time recovery codes; không recover Keystore/backup từ email. App-admin không reset owner; restore cần latest off-host revocation/delete checkpoint.
- [API revision002](../../contracts/v2-t1-r2/README.md) giữ141 và thêm6=147, supersede001 working target nhưng không rewrite; [identity DB expand](../../data/target-t1-auth/README.md) kế thừa70 và thêm12tables. Migrations chỉ plan.

## Alternatives và hệ quả

Managed OIDC/IdP để lại alternative khi vendor/budget/terms được chọn; JWT self-contained chưa cần, revocation vẫn cần central state. Phishing-resistant passkey chưa implement, không claim TOTP giải quyết phishing. Chọn tự vận hành nghĩa là phải build/kiểm rate limits/rotation/delivery/recovery đúng trước real; không đánh đồng free software với zero operations effort.

Owner email takeover là residual risk của password reset T1; optional offline codes là alternative bearer recovery. Second-device-only recovery chưa có API và không được giả đã làm. Exact crypto package/cert custody/mail provider/security evidence là implementation gates, không hidden requirement cuts.

## Bằng chứng

[Identity specification](../../security/identity/identity-access-design.md), [operation matrix](../../security/identity/operation-permissions.csv), [acceptance](../../security/identity/acceptance-plan.md), [ARCH-06 evidence](../../execution/evidence/arch-06-identity-2026-10-08/validation.json). References primary và rationale ở specification. Static PASS không là security/Android/Fastify/SQL/restore PASS; SEC-REAL-T1 vẫn NOT RUN.
