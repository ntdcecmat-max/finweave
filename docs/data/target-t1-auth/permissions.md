# Auth storage permissions — target, SQL NOT RUN

[Domain permissions D1/J2](../target-t1/permissions.md) tiếp tục áp dụng; bảng này bổ sung identity. Dependency trong OpenAPI không tự là grant.

| P2 process/profile | Allowed auth access | Denied |
| --- | --- | --- |
| User/API Identity | Own credential operations through subject-bound procedures; identities/sessions/challenges/auth_client_instances/session_credentials/auth_replays/auth_rate_buckets/owner_recovery_codes/native+collector nonce stores; append safe audit | Ops password/TOTP/admin session/replay, arbitrary root recovery |
| Ops API/OpsIdentity | admin principals/sessions/factors/challenges, ops_auth_replays/ops_auth_rate_buckets; sanitized audit aggregation; approved control requests | All customer hashes/tokens/recovery codes/finance/replay bodies |
| Ingestion worker | Narrow live-device/identity epoch boolean check + receipt/ledger permitted procedures | Credential digests, auth replay bodies, password/seed, mint owner/collector token |
| Market/import/Agent workers | Only scoped authorization/cancellation decision, typed job tickets; domain profile grants | Identity mutation, owner confirmation, arbitrary auth table reads |
| PlatformSecurity/internal authenticator | service_principals public registry, own service_nonces; signature key per profile injected outside DB | Customer/Ops credentials, broad finance grants |
| Retention | Narrow expiry procedures for ciphertext/challenge/nonce/counter metadata, respecting replay tombstones/active refs | Deleting active credentials/recovery codes/audit/checkpoint or financial history |
| Trusted infrastructure provisioning/recovery | Explicit privileged runbook, audited separated credential custody | No everyday app-admin impersonation endpoint |

Authentication lookup trước tenant selection là lý do một số identitytables non-tenant, **không là SELECT ALL cho general user APIs**. API repositories narrow lookup token digest/email/session với subject-derived checks, SQL routines default deny. Auth secret decryption key không cấp Ops UI hoặc workers. IdentityAudit append writer riêng, không raw free text; recovery_journal independent checkpoint vẫn riêng authority.
