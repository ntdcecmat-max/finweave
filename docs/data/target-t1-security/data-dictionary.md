# ARCH-07 security dictionary delta

Inherited82-table dictionary remains in target-t1-auth; this lists only new security fields/tables. SQL NOT RUN.

## identities

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| recovery_token | text | False | Stable random256bit opaque recovery target, generated once; not finance/PII hash |
| recovery_control_epoch | bigint | False | Monotonic recovery event counter independent of auth/device/domain epochs |

- UNIQUE(recovery_token); no regeneration on backup/restore; typed target_kind separates scopes
- recovery_control_epoch>=0; lock target anchor before allocating event epoch; do not replace domain auth/device/recovery epoch with this counter

## workspaces

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| recovery_token | text | False | Stable random256bit opaque recovery target, generated once; not finance/PII hash |
| recovery_control_epoch | bigint | False | Monotonic recovery event counter independent of auth/device/domain epochs |

- UNIQUE(recovery_token); no regeneration on backup/restore; typed target_kind separates scopes
- recovery_control_epoch>=0; lock target anchor before allocating event epoch; do not replace domain auth/device/recovery epoch with this counter

## devices

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| recovery_token | text | False | Stable random256bit opaque recovery target, generated once; not finance/PII hash |
| recovery_control_epoch | bigint | False | Monotonic recovery event counter independent of auth/device/domain epochs |

- UNIQUE(recovery_token); no regeneration on backup/restore; typed target_kind separates scopes
- recovery_control_epoch>=0; lock target anchor before allocating event epoch; do not replace domain auth/device/recovery epoch with this counter

## workspaces

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| access_state | text | False | active denied erasing; deny before erasure publication |

- Every finance query/mutation/worker rechecks workspace access_state; erasing cannot reactivate through ordinary owner/admin operation

## identities

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| recovery_reset_required | boolean | False | Restore-only gate: false after freshly authorized reset, true after restore |

- Old password PHC cannot authorize sign-in while recovery_reset_required; no fallback to old backup credentials

## recovery_journal

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| scope_kind | text | False | identity workspace or device; historical workspace_token is target-token alias |
| environment_id | text | False | Pinned environment stream, never synthetic↔real |
| producer_key_id | text | False | Approved Ed25519 public key registry id |
| producer_signature | text | False | Signature on immutable canonical event body |

- workspace_token is legacy-named opaque target_token, no workspace FK
- UNIQUE(scope_kind,workspace_token,epoch) replaces legacy two-column unique at cutover
- Append only; event body stored in delivery state must hash exactly to event_digest
- epoch comes from target.recovery_control_epoch; auth/device/domain epochs remain distinct; deny events only

## recovery_delivery_state

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque id |
| created_at | timestamptz | False | UTC creation |
| journal_id | text | False | Immutable recovery_journal reference |
| state | text | False | prepared anchored applied failed |
| command_operation | text | False | Registered auth/erasure operation or runbook command |
| command_principal_token | text | False | Opaque authorized actor scope |
| command_key_digest | text | False | Keyed original command key, no bearer/password |
| event_body | jsonb | False | Strict RecoveryEvent; max8192bytes; no financial/free-text payload |
| witness_sequence | bigint | True | Independent durable append sequence |
| witness_receipt | jsonb | True | Signed strict receipt, not trusted merely from DB |
| attempt_count | integer | False | Bounded publication attempts; no second finance queue |
| last_safe_error | text | True | Enum only |
| updated_at | timestamptz | False | Last control state change |

- PRIMARY KEY(id)
- UNIQUE(journal_id)
- UNIQUE(command_principal_token,command_operation,command_key_digest,journal_id)
- Anchored/applied require verified witness receipt matching event digest/environment/target
- No update to original journal to fill checkpoint_ref; acknowledgment lives here
- Recovery coordinator only; jobs table not duplicated; no finance dispatch claim

## erasure_requests

| Column | Type | Null | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque id |
| created_at | timestamptz | False | UTC creation |
| scope_kind | text | False | identity or workspace |
| target_token | text | False | Opaque token, deliberately no erased-owner FK |
| parent_request_id | text | True | Identity erasure parent for frozen workspace child inventory |
| request_key_digest | text | False | Keyed authorized original erasure request |
| state | text | False | requested denied anchored active_purged backup_pending completed failed |
| requested_by_token | text | False | Opaque verified owner/privileged-runbook actor |
| checkpoint_ref | text | True | Verified independent deny checkpoint |
| active_purged_at | timestamptz | True | All active stores purged, not only UI hidden |
| backup_purge_due_at | timestamptz | False | Original request +35days; never slides after retry |
| completed_at | timestamptz | True | All tracked copies verified purged |
| last_safe_error | text | True | Enum only |
| updated_at | timestamptz | False | Control status update |

- PRIMARY KEY(id)
- UNIQUE(scope_kind,target_token,request_key_digest)
- Completed requires checkpoint+active purge+all copy inventories verified; not deadline alone
- Identity parent completes only after every frozen workspace child completes; no cascade to erased owner
- Parent, when present, must be an identity request; child must be a workspace request; identity parent has no parent; no self-link or cycles
- Child inherits the original parent deadline; frozen inventory must contain every owned workspace under ownership locks
- No financial body/email/raw/free text; target tombstone survives workspace deletion

