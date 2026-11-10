# API/schema/security alignment — ARCH-07

**DESIGN / IMPLEMENTATION NOT RUN**. [Implementation bundle](implementation-bundle.json) pins exact API002 OpenAPI SHA, security policy SHA và DB security target SHA. API147operations/600schemas giữ nguyên hashes từ ARCH-06, không tạo v3 hoặc silently change payload fields.

| Boundary | Required behavior/storage |
| --- | --- |
| All147API operations | Current identity/capability/object checks + response/log/egress policy, workspace access_state; security profile is additional deployment artifact, schema alone not authorization |
| Logout/revoke/reset | Immediate local deny, immutable journal+pending delivery; anchored completion before successful recovery-safe ACK, original-key retry under existing auth-special rules |
| Recovery errors | Existing503OUTCOME_UNKNOWN/outcome semantics; local effect committed≠externally anchored≠all copies erased; no success claim while witness unknown |
| Restore | No public network until current signed witness reconciliation; all old auth/recovery codes invalidated, owner fresh password reset; no body replay/reactivated bindings |
| Retention/erasure | Narrow privileged procedures and parent/child inventory, not ordinary source delete or generic worker DELETE; no new public API introduced |
| Storage | [Target revision003](../../data/target-t1-security/README.md): persistent target tokens/control counters, access/reset gates, journal metadata and2newcontrol structures |

ARCH-06 browser/native initial challenge and refresh exact-key replay rules vẫn giữ; **deny/revoke resume** cần bounded continuation authority: expired/revoked original credential may prove original command binding only through stored keyed digest/proof and exact operation/key/input, return sanitized completion only. Không grant finance/session-renew bằng credential bị revoke. Native client never resend plaintext password/token into generic getCommandOutcome; pending auth-state resource internal, not new arbitrary query. Structural error response không chứng minh current backend đã implement continuation.

Logout offline must clear local secrets and stop capture; UI changes cần task integration sau, không sửa frontend ở đây. Network/API errors after local deny must preserve pending/retry key and not restore session/cache because screen failed. Runtime compatibility cần API/domain/auth/restore tests; giữ source mappings ARCH-05/06 là historical observations, không tự mark consumer migrated.
