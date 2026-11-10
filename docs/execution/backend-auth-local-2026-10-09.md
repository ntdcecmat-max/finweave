# Fastify/API005 auth local implementation — 09/10/2026

**EXECUTED LOCAL SYNTHETIC; SEC-REAL-T1 chưa bật.** Backend có 31 User operations và 3 Ops operations chạy thực, cookies/opaque bearer/P-256 proof/TOTP thật; không dùng session header giả hoặc route skeleton trả200.

Code ở `finweave-backend/src/runtime`, migrations001–004 ở `finweave-backend/database/runtime`. [Runbook](../../finweave-backend/RUNTIME.md) mô tả frozen install, chạy hai process API, mail sink, worker profiles, MFA provisioning và reset/restore coordination. Script `finweave-backend/scripts/reproduce-runtime.ps1` đã chạy thành công từ install đến các suite.

| Kiểm chứng | Kết quả/phạm vi |
| --- | --- |
| TypeScript strict | PASS |
| Frozen install / Node24.19.0 / pnpm11.25.0 / PG16.14 / dependency và SQL hashes | PASS |
| Engine/foundation unit regression | 29/29 PASS |
| Contract/security trên Fastify và PostgreSQL nhiều connection | 19 nhóm PASS; xem [source-bound evidence](evidence/backend-auth-local-2026-10-09/runtime-1791527303475.json) |
| HTTP loopback thật, hai process User/Ops, mail sink và MFA | [PASS](evidence/backend-auth-local-2026-10-09/http-smoke.json) |
| Local upgrade001→004 / rerun migrations | PASS |
| Tổng hợp và hash match với code bàn giao | [PASS](evidence/backend-auth-local-2026-10-09/verification-summary.json) |

Các nhóm kiểm tra gồm strict request/reply/error API005; fake header/revision/origin; CSRF kể cả logout; cross-user/workspace/object/session; semantic replay/conflict/stale versions; tombstone/outcome; authorization/revoke trước replay; reauth/recovery code; browser rotation; P-256 transcript/audience/nonce replay; native/collector key separation/enrollment/renew/reuse; native refresh lost-response retry/race/expiry; TOTP race/exact issuer retry và hai mã provisioning; Ops/worker SQL deny finance; J2 leases/generation/profile/budget/atomic outcome; device revoke và owner reset trước finalize; một connection/context cleanup mỗi UoW; OTP attempts; one-use reset và exact reset retry; signed witness outage/restore gates và vô hiệu factor Ops cũ.

API005/DB005/native003 design pins và historical SQL/evidence/frontend được giữ nguyên. Runtime dùng schema bổ sung trong cluster local riêng, không tuyên bố đã migrate toàn bộ historical data hoặc hoàn tất DB005/153 operations. Các operations ngoài34 route triển khai không trả200 giả. Account read model local hiện chỉ phản ánh opening; domain Ledger/Engine integrations, providers, Agent và real ingestion adapters còn phạm vi tiếp theo.

Worker nền có typed SQL ports, profile grants và checkpoint thật; adapter local duy nhất là `synthetic_probe`, adapter chưa đăng ký sẽ retry hữu hạn rồi failed. Journal local Ed25519/hash-chain và nonce head phục vụ kiểm coordination; chưa là witness/backup ngoài host. Mail provider, production transport/mTLS, key rotation/custody, Android Keystore interoperability và full domain/erasure gates chưa được chạy. Không có dữ liệu/dịch vụ/model thật được bật.

HTTP processes và mọi cluster dùng để kiểm đã dừng. `.local/runtime-state.json` và secret fixtures bị Git ignore vẫn được giữ để khởi động lại bằng runbook; không ghi credentials vào evidence.
