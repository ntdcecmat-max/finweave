# ARCH-06 — Identity/session/permissions

08/10/2026 · **ACCEPTED DESIGN theo ủy quyền kỹ thuật / IMPLEMENTATION NOT RUN**. [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [identity specification](../security/identity/identity-access-design.md).

| Bổ sung/thay đổi | Vì sao |
| --- | --- |
| First-party auth, password/email challenge owner; admin password+TOTP riêng | Khớp UX hiện tại, free-first; không nhầm email thành MFA hay app-admin thành owner |
| Browser host-cookie/CSRF; native installation key và access/refresh tách; TTL/idle/rotation rõ | Chống lẫn authority, replay/refresh races và giữ native secrets ngoài WebView |
| Collector credential24h + renewal bằng collector key trong authorization30days | Cập nhật nền không buộc login hằng ngày, không dùng owner refresh token cho upload |
| Auth response encrypted replay5min + generation/epoch/reuse detection | Mất response không rotate/commit hai lần; revoke/reset thắng retained replay |
| Purpose-bound challenges/SPKI/ES256 raw proof; service mTLS+per-profile HMAC/nonces | Backend/Android có cùng transcript, không coi token bearer hoặc internal route là proof đủ |
| Owner/admin fresh reauth5min;147-operation matrix | Quyền được áp ở từng API và nested object, không chỉ tên role/UI |
| Reset15min/offline one-time recovery alternative/revoke/logout/restore protocols | Password reset khác Keystore/data restore, không hồi sinh credentials từ backup |
| API002147operations/600schemas giữ141 và thêm6, exact revision+hash | Giữ001/r1/r2 nguyên vẹn, không sửa nhãn2.0.0 rồi ngầm nhận tương thích |
| Identity target82tables/921columns,12newstructures+35fields trên7tables |70-table D1/J2 chưa biểu diễn credential rotation/replay/nonce/recovery/P2 isolation đủ |
| Migration plan/DB permissions/30 runtime acceptance cases và index notes | Thiết kế có thể bàn giao, không đồng nhất schema/hash checks với bảo mật thực chạy |

Source frontend/dependencies/lockfile và268protected files trong capture được đối chiếu [preservation](../execution/evidence/arch-06-identity-2026-10-08/preservation.json); không thay originalAPI/physical/targetD1J2/ARCH-05package/evidence/tools/r1/r2. [Validation](../execution/evidence/arch-06-identity-2026-10-08/validation.json) ghi kết quả chính xác, không giả browser tests được chạy lại.

Mọi implementation auth/crypto/SQL/grants/concurrency/mail/APK/restore/security PoC còn **NOT RUN**. Mail provider/library exactversions/custody triển khai còn gate; chưa chọn/mua/gọi dịch vụ thật. AUTH-MAIL-REAL và SEC-REAL-T1 chưa đạt. Consumer002 chưa tích hợp, [compatibility delta](../contracts/v2-t1-r2/compatibility-delta.md) ghi rõ. 41parent AC/full21 backlog không bị giảm.

Tiếp theo **ARCH-07 T1 security/privacy**: threat model, server/tenant/admin/device isolation, key/secrets custody, minimized logs/provider egress, encryption/backup và independent revoke/delete checkpoint. Kế thừa identity đã chốt, không mở real data hoặc deploy bằng việc đổi trạng thái tài liệu.

Kết quả cuối: **23 static checks PASS**,294positive request/reply shapes,16negative structural cases bị từ chối đúng,268protected hashes không drift. AUTH-01…30 vẫn NOT RUN; không chạy lại hoặc nâng trạng thái nghiệm thu frontend. [Nguồn nghiên cứu](../execution/evidence/arch-06-identity-2026-10-08/research-sources.json), [22current document references](../execution/evidence/arch-06-identity-2026-10-08/current-document-sync.json).
