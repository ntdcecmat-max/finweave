# Native sequences và state transitions

## Capture→ACK

1. System callback → gate current local generation/consent/source signer/binding/unlock/clock/capacity.
2. Bounded memory extract → normalize/filter → Room transaction event/revision + nonce reservation + encrypted outbox insert (crash prior commit = not accepted locally; gap possible).
3. Unique scoped worker → live eligibility → immutable batch snapshot≤50items/256KiB actual serialized UTF8 API envelope → credential renewal only if needed → send outside Room transaction.
4. 413 split same identities; 429 RetryAfter floor; timeout/lost response same semantic IDs, fresh proof where required. No queued item rewrite while in-flight.
5. Validate API revision/reply/schema/current request binding/receipt matching identity. ARCH09 mixed202/all422 outcomes; only durable accepted/matching already-ACKed result qualifies ACK. Permanent reject→quarantine, transient→retry, not all HTTP2xx mean accepted.
6. Single Room transaction store bounded ACK replay+receipt metadata and remove that exact pending revision. Invalid/reordered/wrong-owner/wrong-digest/request-mismatch response leaves pending, health failure. ACK without digest only trusted if exact immutable request pairing preserved. Poll/query server receipt for posted/Review; native no actual write.

States pending→sending→retry_wait→sending; exact ACK→ack_replay; permanent/revoked/expired/generation mismatch→quarantined; explicit current-owner delete or retention expiry→removed. Expired sending becomes quarantine before any next retry. ACK replay expiration/overflow records recovery gap then removes oldest journal only. Queue identity and old-owner scope never migrate.

## Logout/switch/restore

Local generation fence→capture stop→cancel worker/request best effort→quarantine old vault→attempt server revoke (offline pending explicit)→clear UI/auth sessions→new owner different vault. Late callback/ACK cannot cross vault; server already accepted old observation stays old owner authority. Reconnect same owner validates all epochs before action; restore calls reconcile only with new live creds/protocol, missing receipts investigate, no auto replay. Reinstall cannot decrypt old copied vault, no backup identity reuse.

## Install/update

Verify published release metadata/certificate/source→user package installer→same-app signed upgrade→Room migration atomic/rollback tested→vault/key/clock/generation check→bridge+API compatibility→onboarding consent update if required→permission health + server sync. Missing signing key or migration error fail closed; no destructive migration/default database recreation hiding pending data loss. Back action/keyboard/dialog/wizard never commits financial draft implicitly.
