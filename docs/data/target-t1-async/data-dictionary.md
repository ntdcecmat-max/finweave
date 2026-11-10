# DB005 dictionary additions

DESIGN / SQL NOT RUN. Inherited columns in full target-model.json; only additions listed here.

## jobs

| Field | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| policy_version | text | False | Immutable registered policy snapshot at enqueue |
| deadline_at | timestamptz | False | Absolute job admission deadline; retries never extend it |

## refresh_jobs

| Field | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| request_payload_id | text | False | Frozen authorized selection/profile/rights/normalization and request digest |

## provider_quota_buckets

| Field | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| id | text | False | Opaque bucket ID |
| created_at | timestamptz | False | UTC creation |
| namespace_digest | text | False | Keyed opaque credential/license/scope namespace, never a public user/provider key |
| window_start | timestamptz | False | Provider contract window start |
| window_end | timestamptz | False | Exclusive provider contract window end |
| limit_value | bigint | False | Approved hard call quota; zero disables |
| reserved_count | bigint | False | Conservatively charged calls including unknown outcomes |
| cooldown_until | timestamptz | True | Persisted Retry-After floor |
| version | bigint | False | Serialized bucket version |
| updated_at | timestamptz | False | UTC update |

