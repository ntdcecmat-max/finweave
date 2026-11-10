-- SEPARATE EMPTY DISPOSABLE DATABASE ONLY. Candidate storage, NOT SEC-REAL approved.
-- No plaintext finance columns, SQL balance/amount checks, or reuse of fw conventional tables.
BEGIN;
CREATE SCHEMA fw_protected;
REVOKE ALL ON SCHEMA fw_protected FROM PUBLIC;
CREATE TABLE fw_protected.scopes (
 scope_token bytea PRIMARY KEY CHECK (octet_length(scope_token)=32),
 encrypted_manifest bytea NOT NULL,
 key_epoch bigint NOT NULL CHECK (key_epoch>0),
 opaque_commit_token bytea NOT NULL
);
CREATE TABLE fw_protected.objects (
 scope_token bytea NOT NULL REFERENCES fw_protected.scopes(scope_token),
 object_token bytea NOT NULL CHECK (octet_length(object_token)=32),
 ciphertext bytea NOT NULL CHECK (octet_length(ciphertext)>32),
 cipher_format integer NOT NULL,
 key_epoch bigint NOT NULL,
 etag bytea NOT NULL,
 PRIMARY KEY (scope_token,object_token)
);
CREATE TABLE fw_protected.replay_records (
 scope_token bytea NOT NULL REFERENCES fw_protected.scopes(scope_token),
 dedupe_tag bytea NOT NULL,
 encrypted_reply bytea NOT NULL,
 commit_token bytea NOT NULL,
 PRIMARY KEY (scope_token,dedupe_tag)
);
CREATE TABLE fw_protected.work_queue (
 opaque_job_token bytea PRIMARY KEY,
 sealed_job bytea NOT NULL,
 not_before timestamptz NOT NULL,
 lease_until timestamptz,
 attempts integer NOT NULL DEFAULT 0
);
CREATE INDEX opaque_due ON fw_protected.work_queue(not_before,lease_until);
REVOKE ALL ON ALL TABLES IN SCHEMA fw_protected FROM PUBLIC;
COMMIT;
-- AEAD protocol, nonce allocation, epoch/counter anti-rollback, independent key authority,
-- access pattern leakage, attestation and protected Engine indexes remain PoC dependencies.
-- The host can replace/delete ciphertext; integrity/rollback detection is inside trusted runtime.
