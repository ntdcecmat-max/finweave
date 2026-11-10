# ARCH-06 identity acceptance — implementation backlog

**ALL RUNTIME CASES NOT RUN**. Static schema/rule/hash results ở [validation](../../execution/evidence/arch-06-identity-2026-10-08/validation.json) không tự đổi trạng thái các ca bên dưới. Local synthetic trước, real chỉ sau SEC-REAL-T1/AUTH-MAIL-REAL. IDs AUTH-01…30 là acceptance kỹ thuật, không thay41 parent AC.

| ID | Test có thể chứng minh / expected invariant | Environment |
| --- | --- | --- |
| AUTH-01 | Browser challenge không consume qua native verifier và ngược lại; reauth không thành login | API+PostgreSQL |
| AUTH-02 | Wrong email/password/duplicate register cùng safe shape/timing budget, không email enumeration | API+mail sink |
| AUTH-03 | OTP đúng hết hạn/used/attempt6 từ chối; resend không reset cumulative failures | DB/concurrency |
| AUTH-04 | Pending registration không đọc/create workspace trước verify; no session on mail failure | API+DB |
| AUTH-05 | Unicode NFC/codepoints/128 bound/blocklist/password mismatch; real không nhận fixture123456 | Password adapter |
| AUTH-06 | Argon2id known vectors, PHC parameter verification, ARM64 memory/latency/concurrency2 bound | Local/ARM64 spike |
| AUTH-07 | Secure/HttpOnly/SameSite/host-prefix cookie, no Domain; subdomain cookie injection fail | Real browser HTTPS |
| AUTH-08 | Cookie mutation thiếu/sai CSRF/Origin403; loginCSRF/fixation/cross-origin blocked | Browser+API |
| AUTH-09 | Browser idle30min/12h và admin15min/4h; polling/renew không kéo dài idle/absolute | Controlled clocks |
| AUTH-10 | Owner access không renew, refresh không finance, collector không owner, admin không user | Direct API negative |
| AUTH-11 | Native secret không vào WebView/localStorage/logs/crash dumps; bridge không arbitrary URL | Android real device |
| AUTH-12 | P-256 SPKI/ES256 raw signatures Android↔Node; DER/curve/invalid point/wrong body/origin/purpose denied | Cross-runtime vectors |
| AUTH-13 | Native refresh exactly one generation dưới concurrent renew; reused old token different key revokes family | PostgreSQL races |
| AUTH-14 | Lost response same key/semantics/fresh proof trong5min replay exact tokens, không rotate lần2 | API faults/network |
| AUTH-15 | Auth replay hết5min không re-execute; revoke/reset beats retained body; AEAD wrong AAD denied | API+crypto adapter |
| AUTH-16 | Enrollment challenge bind owner/session/key/workspace/epochs; no browser enrollment secret shortcut | API+native |
| AUTH-17 | Collector token24h renew bằng collector key dưới30day authorization; expired token chỉ renew<=7days | API+controlled clocks |
| AUTH-18 | Wrong collector key/nonce/body/owner/recovery fence và consumed-token reuse bị chặn; nonce store unavailable failclosed | DB+API |
| AUTH-19 | Logout/switch A→B stops upload, quarantinesA, clears tokens/cache, không retarget old payload | Real APK/offline |
| AUTH-20 | Revoke device/password reset race với receipt posting; no effect after revoke commit fence | DB races |
| AUTH-21 | Cross-owner workspace/nested object/session/device/evidence IDs consistent404/403 without existence leak | API+RLS roles |
| AUTH-22 | Admin provisioning only host runbook; TOTPstep replay/concurrent two requests only one accepted | Ops API+DB |
| AUTH-23 | Admin cannot read owner credential/replay/finance, reset owner, elevate own role or impersonate | Separate DB roles |
| AUTH-24 | Owner/admin reauth5min bound session; export/erase/enroll/code rotation/control requirefresh, revocation remains accessible | API+browser |
| AUTH-25 | Email reset highentropy15min oneuse, epoch/revoke atomic, no auto-login, fragment no log/referrer | Browser+mail sink+DB |
| AUTH-26 | Recovery code256bit oneuse, rotation invalidates oldbatch, concurrent redeem one success; no backup/Keystore recovery | DB+API |
| AUTH-27 | Service mTLS+signature same principal; wrong cert/key/capability/body/timestamp/nonce reject | Private network/PKI |
| AUTH-28 | DBpool no scope leak; workers/Agent cannot mint credentials/confirm/impersonate; lease fences survive auth integration | P2 roles/processes |
| AUTH-29 | Rate limits shared across replicas, spoofed proxyheaders ignored, counters unavailable failclosed; no sensitive logs | Load/fault/security |
| AUTH-30 | Isolated restore applies latest independent revoke/delete checkpoint; old auth tokens/replay/challenges never resurrect | Restore rehearsal |

Mỗi case lưu source/API/schema hashes, environment/versions, synthetic IDs, clocks, expected/actual outcome và sanitized evidence. Không email/tokens/seed/recovery-code thật trong output. Khi fail, phân protocol/implementation/test/env rõ, không đổi test chỉ để PASS. Human UAT cho login/reauth/connection renewal/recovery vẫn riêng.
