# Domain dictionary delta — ARCH-08

Chỉ2bảng mới; [full model](target-model.json) giữ đủ86bảng. Kế thừa [dictionary security](../target-t1-security/data-dictionary.md) và [auth](../target-t1-auth/data-dictionary.md). SQL/grants NOT RUN.

## forecast_runs

| Field | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace |
| id | text | False | Opaque id |
| created_at | timestamptz | False | Server UTC creation |
| version | bigint | False | Run control version, not financial version |
| state | text | False | queued running succeeded failed cancelled expired |
| base_snapshot_id | text | False | Immutable authorized dependency closure |
| base_financial_version | bigint | False | Financial snapshot version |
| inputs_payload_id | text | False | Strict frozen settings/scope/goal selection/seed, private payload |
| checkpoint_payload_id | text | True | Private versioned compute cursor/aggregate/RNG state; fenced update, never a second lease authority |
| input_digest | text | False | Private semantic digest, never Ops logs |
| engine_version | text | False | Exact engine release |
| model_version | text | False | Exact forecast formula/RNG/grid version |
| seed | text | False | Reproducibility seed, not security credential |
| trials | integer | False | 1..1000; completed paths only |
| cancel_requested | boolean | False | Checked between bounded compute chunks |
| completed_at | timestamptz | True | Terminal completion |
| result_expires_at | timestamptz | True | Content expiry, not permission expiry |
| safe_error_code | text | True | Enum only; no financial exception text |
| updated_at | timestamptz | False | Control change |

- PRIMARY KEY(workspace_id,id)
- Inputs immutable after enqueue; no partial run probability published
- UNIQUE(workspace_id,id,base_snapshot_id)
- J2 jobs owns dispatch/lease/generation, not this table
- Result expiry preserves run/input digest tombstone; pinned history cannot be silently purged

## forecast_result_pages

| Field | Type | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace |
| id | text | False | Opaque id |
| created_at | timestamptz | False | Server UTC creation |
| run_id | text | False | Frozen run |
| page_index | integer | False | Zero-based deterministic page |
| payload_id | text | False | Strict bounded result page in payload_objects |
| content_digest | text | False | Private canonical page digest |
| schema_ref | text | False | ForecastResultPage schema + model version |
| published_at | timestamptz | True | Visible only after full run atomically succeeded |

- PRIMARY KEY(workspace_id,id)
- UNIQUE(workspace_id,run_id,page_index)
- Immutable pages; staged pages cannot be served until run succeeded
- Page bytes<=262144; max12 chronological rows, max50 selected output goals; no silent truncation

