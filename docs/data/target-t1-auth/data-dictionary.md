# Identity target data dictionary

Inherited declarations are historical, not executable target DDL. All SQL/migration checks NOT RUN.

## identities

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| auth_epoch | bigint | False | Monotonic all-session revocation fence |
| email_verified_at | timestamptz | True | Email verification, not MFA assurance |

- auth_epoch>=0
- State expands to pending_verification active suspended deleted; pending registration cannot access workspaces
- Only password PHC Argon2id hash in credential_hash; admin authority prohibited

## sessions

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| kind | text | False | browser or native |
| installation_id | text | True | Native auth client, NOT collector device |
| auth_epoch | bigint | False | Identity epoch at issue |
| last_user_activity_at | timestamptz | False | Meaningful user activity; polling/renew do not extend idle |
| absolute_expires_at | timestamptz | False | Browser12h/native30d fixed family limit |
| reauthenticated_at | timestamptz | True | Fresh password+email challenge |
| refresh_generation | bigint | False | Monotonic native rotation generation |
| csrf_key_ref | text | True | Session-bound CSRF key reference, browser only |
| revoke_reason | text | True | Safe enum only |

- role=owner only; no legacy admin session migrated into customer authority
- kind=native iff installation_id IS NOT NULL; sessions.device_id deprecated legacy alias, never FK to collector
- Unique(id,subject_id); last_user_activity_at<=absolute_expires_at; generation>=0
- Legacy token_digest no longer authorization for native; all legacy sessions revoked at cutover

## identity_challenges

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| flow_purpose | text | False | signin_web signin_native register_web register_native reset reauth enrollment collector_token |
| bound_session_id | text | True | Owner reauth/enrollment/collector only |
| client_key_digest | text | True | Installation or collector key transcript binding |
| nonce_digest | text | False | 256-bit challenge nonce digest |
| nonce_value | text | False | Public base64url nonce to reconstruct collector proof transcript; NOT OTP/reset/bearer |
| auth_epoch | bigint | True | Subject epoch at issue |
| workspace_id | text | True | Enrollment/collector exact workspace |
| device_id | text | True | Existing collector device if issuing token |
| device_epoch | bigint | True | Exact live collector epoch |
| recovery_epoch | bigint | True | Exact workspace epoch |
| state | text | False | pending consumed expired locked |

- purpose legacy enum expands collector_token and reauth; flow_purpose controls verifier and channel
- 5 attempts maximum,5min expiry; reset high-entropy token15min; consume+session issue/epoch update atomic
- bound_session_id references sessions; scoped collector device FK(workspace_id,device_id); subject owner match verified under lock

## devices

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| signing_algorithm | text | False | ES256/P-256 |
| public_key_format | text | False | base64url DER SPKI |
| credential_epoch | bigint | False | Collector token generation fence |
| installation_id | text | False | Enrolling native owner installation |
| authorized_until | timestamptz | False | 30days owner-approved collector authority; renewal cannot extend |

- Stored public_key validated SPKI P-256; key_digest=SHA256 decoded DER; no arbitrary PEM/key type
- device revoke increments credential_epoch and owner_epoch; session_credentials owner/workspace/device must match devices

## admin_principals

Owner: OpsIdentity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| password_hash | text | False | PHC Argon2id, separate customer credential domain |

- mfa_required=true; no owner identity FK/grants; auth_ref controlled local identifier, not automatic external IdP

## admin_sessions

Owner: OpsIdentity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| last_user_activity_at | timestamptz | False | Idle15min |
| absolute_expires_at | timestamptz | False | Fixed4h |
| csrf_key_ref | text | False | Ops CSRF binding |
| reauthenticated_at | timestamptz | False | Latest password+TOTP |
| revoke_reason | text | True | Safe enum |

- UNIQUE(id,principal_id); epoch/current active MFA checked each request

## admin_mfa_factors

Owner: OpsIdentity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| key_version | text | False | AEAD envelope key id |
| secret_ciphertext | bytea | False | AES-256-GCM seed envelope with unique nonce/tag/AAD |

- method=totp_sha1_6_30; counter is largest accepted RFC6238 time-step, transactional compare/update; decrypt OpsIdentity only

## auth_client_instances

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| subject_id | text | False | Owner after successful native verify |
| public_key_spki | text | False | Native P-256 signing public key |
| key_digest | text | False | SHA256 decoded SPKI |
| state | text | False | active revoked |
| auth_epoch | bigint | False | Subject epoch |
| revoked_at | timestamptz | True | Revoked instance |

- PRIMARY KEY(id)
- UNIQUE(id,subject_id)
- UNIQUE(subject_id,key_digest)
- State/revoked_at coherent; key possession at first verify; no financial/collector authority

## session_credentials

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| subject_id | text | False | Owner principal |
| session_id | text | True | Browser/native family; null for collector |
| workspace_id | text | True | Collector workspace only |
| device_id | text | True | Collector device only |
| audience | text | False | owner_access owner_refresh collector |
| token_digest | text | False | HMAC-SHA256 purpose-separated pepper |
| key_version | text | False | Digest pepper version |
| generation | bigint | False | Native rotation or collector issue generation |
| auth_epoch | bigint | False | Identity epoch |
| device_epoch | bigint | True | Collector capture epoch |
| recovery_epoch | bigint | True | Collector restore fence |
| expires_at | timestamptz | False | Access15m,refresh fixed30d,collector24h |
| consumed_at | timestamptz | True | Refresh/collector previous token marker |
| revoked_at | timestamptz | True | Revocation |
| rotation_key_digest | text | True | Original idempotency key binding for exact lost-response replay |

- PRIMARY KEY(id)
- UNIQUE(key_version,audience,token_digest)
- UNIQUE(session_id,audience,generation) for owner credentials
- UNIQUE(workspace_id,device_id,audience,generation) for collector credentials
- Exactly collector branch has workspace/device/epochs and null session_id; owner branches inverse
- Composite FK(session_id,subject_id) and collector owner match by checked transaction; random token32bytes

## auth_replays

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| principal_id | text | False | Customer subject or resolved preauth challenge principal |
| authority_ref | text | False | Session/challenge/credential family ID |
| operation_id | text | False | Allowed auth operation |
| key_digest | text | False | HMAC idempotency key |
| input_digest | text | False | Keyed semantic digest; no public password digest |
| response_ciphertext | bytea | True | Short AEAD response only; wipe after5min |
| key_version | text | False | AEAD key version |
| expires_at | timestamptz | False | Body horizon max5min |
| committed_at | timestamptz | False | Atomic command commit |
| revoked_at | timestamptz | True | Revocation fences even retained body |

- PRIMARY KEY(id)
- UNIQUE(principal_id,authority_ref,operation_id,key_digest)
- Owner API only; no generic90day result payload; AEAD AAD includes scope/op/key/epoch

## ops_auth_replays

Owner: OpsIdentity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| principal_id | text | False | Customer subject or resolved preauth challenge principal |
| authority_ref | text | False | Session/challenge/credential family ID |
| operation_id | text | False | Allowed auth operation |
| key_digest | text | False | HMAC idempotency key |
| input_digest | text | False | Keyed semantic digest; no public password digest |
| response_ciphertext | bytea | True | Short AEAD response only; wipe after5min |
| key_version | text | False | AEAD key version |
| expires_at | timestamptz | False | Body horizon max5min |
| committed_at | timestamptz | False | Atomic command commit |
| revoked_at | timestamptz | True | Revocation fences even retained body |

- PRIMARY KEY(id)
- UNIQUE(principal_id,authority_ref,operation_id,key_digest)
- Ops process only; no customer rows; no customer FK

## auth_rate_buckets

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| bucket_digest | text | False | HMAC login/IP-prefix+purpose; no raw PII |
| purpose | text | False | Bounded allowed operation class |
| window_start | timestamptz | False | Server time bucket |
| attempts | integer | False | Atomic bounded attempts |
| blocked_until | timestamptz | True | Bounded throttle not permanent account lock |

- PRIMARY KEY(id)
- UNIQUE(bucket_digest,purpose,window_start)
- Atomic counter; minimum limit enforced across API replicas; fail closed if unavailable

## ops_auth_rate_buckets

Owner: OpsIdentity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| bucket_digest | text | False | HMAC login/IP-prefix+purpose; no raw PII |
| purpose | text | False | Bounded allowed operation class |
| window_start | timestamptz | False | Server time bucket |
| attempts | integer | False | Atomic bounded attempts |
| blocked_until | timestamptz | True | Bounded throttle not permanent account lock |

- PRIMARY KEY(id)
- UNIQUE(bucket_digest,purpose,window_start)
- Ops counters/credentials separate; fail closed

## owner_recovery_codes

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| subject_id | text | False | Owner only |
| batch_id | text | False | Current code batch |
| code_digest | text | False | HMAC 256-bit single-use code; no plaintext |
| key_version | text | False | Pepper version |
| consumed_at | timestamptz | True | Atomic redeem |
| revoked_at | timestamptz | True | Rotation invalidates all previous codes |

- PRIMARY KEY(id)
- UNIQUE(key_version,code_digest)
- 10 codes per active batch; rotate requires fresh owner reauth; code alone is powerful recovery secret

## service_principals

Owner: PlatformSecurity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| name | text | False | Per-profile stable identity |
| certificate_fingerprint | text | False | Pinned SHA256 leaf certificate |
| signature_key_ref | text | False | HMAC-SHA256 key outside DB, per principal |
| capabilities | text[] | False | Server registered job types only |
| auth_epoch | bigint | False | Revoke fence |
| expires_at | timestamptz | False | Cert/key lifecycle |
| revoked_at | timestamptz | True | Revoke |

- PRIMARY KEY(id)
- UNIQUE(name)
- Ops/API/worker profile is not caller-supplied role; private TLS authenticated; no secrets in table

## service_nonces

Owner: PlatformSecurity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| principal_id | text | False | Same mTLS+signature principal |
| nonce_digest | text | False | SHA256 256-bit nonce |
| expires_at | timestamptz | False | Retain minimum5min |

- PRIMARY KEY(id)
- UNIQUE(principal_id,nonce_digest)
- Atomic insert before acceptance; bounded clock skew60s; replays denied

## native_proof_nonces

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| installation_id | text | False | Authenticated client instance |
| nonce_digest | text | False | SHA256 256-bit nonce |
| expires_at | timestamptz | False | Retain minimum5min |

- PRIMARY KEY(id)
- UNIQUE(installation_id,nonce_digest)
- First native verify uses one-time identity challenge before instance exists; subsequent proofs use this store
- Separate from service nonce privileges

## collector_proof_nonces

Owner: Identity.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| workspace_id | text | False | Collector workspace |
| device_id | text | False | Collector device |
| nonce_digest | text | False | SHA256 nonce |
| expires_at | timestamptz | False | Minimum5min |

- PRIMARY KEY(id)
- UNIQUE(workspace_id,device_id,nonce_digest)
- Scoped collector proof store, not owner/service nonce authority

## security_audit_events

Owner: IdentityAudit.

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque record id |
| created_at | timestamptz | False | UTC server creation |
| principal_token | text | True | Opaque pseudonymous subject |
| event_kind | text | False | Allowlisted authentication/revocation/recovery enum |
| actor_kind | text | False | owner admin service infra |
| correlation_id | text | False | Opaque request ID |
| reason_code | text | False | Allowlisted code |
| authority_epoch | bigint | True | Fence number |

- PRIMARY KEY(id)
- Append-only narrow writer, no finance/email/IP/code/secret/body fields
- Ops reads aggregate/sanitized subset only; no user session tracking query

