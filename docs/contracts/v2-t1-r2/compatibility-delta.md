# Consumer migration: revision001 →002

**NOT IMPLEMENTED**. Source frontend giữ nguyên hybrid1.1.0/operational2.0.0 mock; revision002 là target mới. Không nâng nhãn/hạ fail-closed guard rồi tuyên bố đã tích hợp.

| Consumer | Required change | Gate |
| --- | --- | --- |
| User web | Exact002/hash, null installationPublicKey, nonce/channel; host cookie/CSRF lifecycle; nullable session.deviceId; reauth prompt/recovery-code display; reset fragment handling | API/auth integration tests và human UAT |
| Admin web | Admin origin riêng, __Host-cookie/CSRF, password15 và TOTP; adminReauthenticate khi window5min hết | MFA replay/concurrency và permission tests |
| Native owner | Generate installation SPKI before signin; proof header/native-only verifier/refresh; native token storage+mutex+lost-response pending key; không WebView secrets | Android/Node ES256 interoperability, secure storage/bridge tests |
| Native collector | Collector key enrollment riêng; DeviceBearer ingest/reconcile, DeviceRenewalBearer+collector proof renewal24h/authorization30days; receipt ACK/outbox semantics giữ | Keystore/WorkManager/offline/revoke/epoch tests |
| Backend | Identity/OpsIdentity storage delta, password policy, auth replay, nonce/rate stores, exact route security/schema responses, fresh reauth/object checks | Real PostgreSQL/auth/security spike |
| Services/Agent | mTLS+per-profile HMAC signature, live principal/nonce/ticket; Agent scope read/simulate/draft | No finance grant escalation; cert/key rotation tests |

Baseline147operation matrix đầy đủ ở identity/operation-permissions.csv. ARCH-05 dynamic adapter AST/99field differences vẫn useful historical input; cần regenerated source→002 mapping sau khi implementation consumer thực sự đổi. Không ghi lại141/145 mapping rows cũ thành integration PASS.
