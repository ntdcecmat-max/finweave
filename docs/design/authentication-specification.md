# Authentication, session và system screens

DES-AUTH-001 · v1.0 · 08/10/2026 · SPECIFIED; real auth/security PoC pending.
[API đích](../contracts/operational-api-spec.md), [security](../security/security-design.md), [ADR006](../architecture/adr/ADR-006-deployment-trust-profiles.md), [screen states](screen-behavior-specification.md). Bản auth mock và dummy credentials được [lưu lịch sử](../governance/baselines/ui-before-v3-2026-10-08/authentication-specification.md); không mang OTP/password/sessionStorage demo thành policy production.

## 1. Màn, fields và actions

| ID / route kế thừa | Nội dung / validation / hành động | Hậu điều kiện và state |
| --- | --- | --- |
| UI-AUTH-01 /auth/login | Email/identifier*,password* hoặc cơ chế auth đã chốt; reveal có label; submit, register/forgot links | pending/generic invalid/challenge/authenticated; không finance fetch trước auth; không hardcoded demo credentials trong real mode |
| UI-AUTH-02 /auth/register | Name*,email*,password*/confirmation* nếu password flow, acknowledgement theo policy sản phẩm | Validate match/limits active schema; generic duplicate handling, challenge/verified; mock12–128 và ký hiệu không tự là policy real mới |
| UI-AUTH-03 /auth/verify | Challenge reference và code* theo cơ chế đã chốt; verify/resend có cooldown/cancel | Wrong/expired/consumed/verified; không ghi mã mẫu là OTP thật; single-use/rate-limit là server authority |
| UI-AUTH-04 /auth/forgot | Email/identifier*, submit, back login | Generic response không enumeration; chỉ nói đã gửi khi real delivery integration cho phép; không claim reset chống Ops đã giải quyết |
| UI-AUTH-05 /auth/reset | One-time recovery reference + new password*/confirmation* nếu flow được chốt | Invalid/expired/consumed/mismatch/completed; credential fields clear, reference không log/analytics và loại khỏi URL sau xử lý phù hợp policy |
| UI-AUTH-06 /auth/expired | Lý do an toàn, đăng nhập lại; không private data | Session expiry cancel private reads/writes chưa gửi, clear/unmount cache/chat/drafts; uncertain committed operation tra lại cùng owner, không submit lại mù |
| UI-AUTH-07 /auth/denied | Không có quyền, quay lại phần hợp lệ/logout | Không finance DTO hoặc bypass workspace selector; admin denied cũng không finance fallback |
| UI-AUTH-08 Settings/session | Profile minimal, device/session status, logout/revoke links, privacy mask | Logout acknowledged hoặc local lock nếu offline, collector stop; owner queue quarantine; không xóa đã-sync records |

Route này là user web baseline; Android native navigation giữ cùng semantics. Admin login dùng entry/session riêng trong admin build, không cho user tự chọn role bằng form; admin role do authority cấp. Auth challenges/recovery/security protocol phải chốt trước real implementation; không tự coi các route UI là approval cho phương thức lưu/chuyển password.

## 2. Quyền và context

Protected gate trước financial providers/queries. Session/device/workspace/object checks phía server/trusted authority; owner identity không lấy từ URL/body/prompt. Safe returnTo chỉ relative allowlisted route, không open redirect hoặc private data query. Authenticated user vào admin denied; admin vào finance API user denied, không impersonate.

Đổi user/workspace không phục hồi draft/chat/cache owner khác. Mobile enrollment tách session app; OS notification access còn granted không nghĩa token/binding còn được phép upload. Revoke/logout dừng capture/upload và policy queue như [Android](android-ui-specification.md). Device permission trên web là last-reported, có timestamp.

## 3. Secrets, recovery và trust gate

Không token/key/password trong URL/localStorage/log/telemetry; opaque one-time recovery reference phải có handling tránh leak. Hạ tầng conventional hiện synthetic-only khi anti-Ops PoC chưa đạt. Production auth/enrollment/recovery phải tương thích independent trust/key boundary, không gửi plaintext credentials qua Ops gateway rồi tự nhận đạt NFR-08. UI không tự cấp quyền reset/recover/decrypt cho admin.

Draft khi401 có thể giữ trong memory đã khóa đúng owner nếu policy cho phép trước expiry/logout; hết phiên/logout phải bỏ private UI và không giữ plaintext trên storage tùy tiện. Sau reauth kiểm phiên/object versions và tra uncertain operation trước new preview/confirm. Không tự chốt retention/key scheme bằng UI spec.

## 4. Accessibility và kiểm tra

Desktop story/form, mobile brand/form stack theo tokens; labels/hints/error summary/focus/Enter, reveal aria-pressed, challenge input semantics đúng. Không yêu cầu dán OTP có chủ đích từ notification collector hoặc auto-read SMS/email.

AUTH-UI-01…08 là nhóm kiểm tra lịch sử, không renumber. UI-AUTH là screen IDs mới để trace. Kiểm real login/challenge/recovery/logout/revoke/admin role/cache isolation/native enrollment **NOT RUN**; PASS mock cũ không chứng minh auth/security production.

## ARCH-06 — UX integration delta (SPECIFIED / NOT IMPLEMENTED)

Protocol đích tại [identity LLD](../security/identity/identity-access-design.md); frontend mock hiện tại giữ nguyên. AUTH-UI-T1-01: owner reauth password+email challenge và lỗi/expiry không mất form. AUTH-UI-T1-02: admin password+TOTP, fresh reauth5min cho controls. AUTH-UI-T1-03: native installation-key/collector enrollment diễn ra native, web hướng dẫn chuyển sang APK, không nhập secrets từ WebView. AUTH-UI-T1-04: hiển thị collector24h auto renewal, authorization30days/needs reconnect/offline gaps trung thực. AUTH-UI-T1-05: optional recovery codes hiển thị một lần, lưu offline/rotate cảnh báo, không telemetry; email reset fragment và no auto-login. AUTH-UI-T1-06: logout/switch quarantines old-owner outbox, revoke device/session tách biệt, không retarget queue. Các UX delta cần integration/UAT; không đánh dấu UI đã dựng hoặc đã pass.
