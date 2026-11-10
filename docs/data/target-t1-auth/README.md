# PostgreSQL target — identity expand revision002

FW-PHYS-T1-AUTH-002 · **EXPAND DESIGN / SQL NOT RUN**. Kế thừa nguyên70tables/782columns của [D1/J2](../target-t1/README.md), thêm12structures và35columns vào7bảng cũ; target **82tables/921columns**, counts/hash tại [revision](revision.json). Không sửa target001/physical001–003.

[Full target model](target-model.json), [delta](identity-delta.json), [dictionary](data-dictionary.md), [inventory](table-inventory.csv), [identity ERD](identity-erd.mmd), [migration plan](migration-plan.md), [permissions](permissions.md). ERD này là **identity delta**, full relationships vẫn nằm trong target-model.json; không giả biểu đồ nhỏ là full82-table ERD. Count không là mục tiêu kiến trúc hoặc proof đủ nghiệp vụ.

New structures: auth_client_instances, session_credentials, auth_replays, ops_auth_replays, auth_rate_buckets, ops_auth_rate_buckets, owner_recovery_codes, service_principals, service_nonces, native_proof_nonces, collector_proof_nonces, security_audit_events. Tách owner/Ops replay/counters và service/native/collector nonce authority để P2 không dùng cùng credential store với grants quá rộng.

Inherited baselineDeclaration/checks trong JSON giữ **lịch sử**, không phải target DDL: sessions.role→owner-only, identities.state thêm pending_verification, challengepurpose/flows mở rộng, native token_digest cũ không cấp quyền, devices bind installation/auth policy mới. `targetRules`+delta+migration plan là review intent; cần actual SQL constraints/index/grants/backfill và execution checks trước gọi schema deployable.

Không có plaintext token/password/code/TOTP seed trong JSON; ciphertext bytea chỉ thiết kế field. auth replay body5min khác finance replay90d. Recovery checkpoint ngoài host chưa provision; local restored auth/session rows không chứng minh còn quyền. [Identity design](../../security/identity/identity-access-design.md).
