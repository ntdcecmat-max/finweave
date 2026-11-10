# Từ điển dữ liệu — D1 + J2 expand design

**DESIGN ONLY, không phải DDL đã chạy.** 54 bảng kế thừa +16 bảng mới; cột cũ vẫn tồn tại trong expand. Xem [kế hoạch migration](migration-plan.md) cho replacements/removals và [invariants](invariants-and-workflows.md) cho ý nghĩa nghiệp vụ, units, checks và retention. Baseline meaning ngắn được giữ nguyên, không gọi đó là đặc tả nghiệp vụ mới.

## identities — Identity

Tenant: False; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Synthetic .test restriction kept in original migrations; gated profile-aware auth validation replaces it only for real-T1 deployment. No raw PII in logs.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| email | text | False | email (baseline) |
| display_name | text | False | display name (baseline) |
| credential_hash | text | False | credential hash (baseline) |
| state | text | False | state (baseline) |

Rules (design): 

## workspaces — Identity

Tenant: False; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Replace synthetic-only profile constraint only in a separately gated T1 migration; never enable real by client input.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| owner_id | text | False | owner id (baseline) |
| currency | text | False | currency (baseline) |
| timezone | text | False | timezone (baseline) |
| tracking_start | date | False | tracking start (baseline) |
| financial_version | bigint | False | financial version (baseline) |
| profile | text | False | profile (baseline) |
| recovery_epoch | bigint | False | Monotonic external-restore fence (D1 target) |

Rules (design): 

## sessions — Identity

Tenant: False; stage: INHERITED_EXPAND. Retention: expired/revoked metadata 30d; no tokens stored.

Contract-phase change: Customer sessions role becomes owner only after migrating admin authentication to OpsIdentity; session.device_id semantic clarified ARCH-06, not guessed as FK.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| subject_id | text | False | subject id (baseline) |
| token_digest | text | False | token digest (baseline) |
| role | text | False | role (baseline) |
| device_id | text | True | device id (baseline) |
| expires_at | timestamptz | False | expires at (baseline) |
| revoked_at | timestamptz | True | revoked at (baseline) |

Rules (design): 

## identity_challenges — Identity

Tenant: False; stage: INHERITED_EXPAND. Retention: expired challenges 24h; digests only.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| subject_id | text | True | subject id (baseline) |
| challenge_digest | text | False | challenge digest (baseline) |
| purpose | text | False | purpose (baseline) |
| expires_at | timestamptz | False | expires at (baseline) |
| consumed_at | timestamptz | True | consumed at (baseline) |
| attempts | integer | False | attempts (baseline) |

Rules (design): 

## devices — Identity

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Revocation fence checked at receipt acceptance and financial commit.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| owner_id | text | False | owner id (baseline) |
| platform | text | False | platform (baseline) |
| public_key | text | False | public key (baseline) |
| key_digest | text | False | key digest (baseline) |
| name | text | False | name (baseline) |
| app_version | text | False | app version (baseline) |
| consent_version | text | False | consent version (baseline) |
| status | text | False | status (baseline) |
| revoked_at | timestamptz | True | revoked at (baseline) |
| last_seen | timestamptz | True | last seen (baseline) |
| owner_epoch | bigint | False | Enrollment or revocation epoch (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,key_digest); CHECK ((status='revoked')=(revoked_at IS NOT NULL))

## accounts — Accounts

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| name | text | False | name (baseline) |
| kind | text | False | kind (baseline) |
| opening | numeric(18,0) | False | opening (baseline) |
| opening_date | date | False | opening date (baseline) |
| archived | boolean | False | archived (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)

## ledger_accounts — Ledger

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Immutable account_id/kind once used by posted bundle; archive allowed, no retarget.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| account_id | text | True | account id (baseline) |
| kind | text | False | kind (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,account_id); FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## sources — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| name | text | False | name (baseline) |
| kind | text | False | kind (baseline) |
| connection | text | False | connection (baseline) |
| last_attempt | timestamptz | True | last attempt (baseline) |
| last_success | timestamptz | True | last success (baseline) |
| error_code | text | True | error code (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)

## instruments — Market

Tenant: False; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| symbol | text | False | symbol (baseline) |
| exchange | text | False | exchange (baseline) |
| currency | text | False | currency (baseline) |
| unit | text | False | unit (baseline) |
| active_from | date | False | active from (baseline) |
| active_to | date | True | active to (baseline) |
| supported | boolean | False | supported (baseline) |

Rules (design): UNIQUE (exchange,symbol,active_from)

## gold_profiles — Market

Tenant: False; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| product | text | False | product (baseline) |
| purity | text | False | purity (baseline) |
| brand | text | False | brand (baseline) |
| region | text | False | region (baseline) |
| source_ref | text | False | source ref (baseline) |
| side | text | False | side (baseline) |
| currency | text | False | currency (baseline) |
| unit | text | False | unit (baseline) |

Rules (design): 

## holdings — Portfolio

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| kind | text | False | kind (baseline) |
| instrument_id | text | True | instrument id (baseline) |
| gold_profile_id | text | True | gold profile id (baseline) |
| name | text | False | name (baseline) |
| cost | numeric(18,0) | True | cost (baseline) |
| cost_date | date | True | cost date (baseline) |
| profile_confirmed_version | bigint | True | profile confirmed version (baseline) |
| archived | boolean | False | archived (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); CHECK ((kind='stock' AND instrument_id IS NOT NULL AND gold_profile_id IS NULL) OR (kind='gold' AND gold_profile_id IS NOT NULL AND instrument_id IS NULL))

## events — Ledger

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| kind | text | False | kind (baseline) |
| amount | numeric(18,0) | False | amount (baseline) |
| business_date | date | False | business date (baseline) |
| account_id | text | False | account id (baseline) |
| to_account_id | text | True | to account id (baseline) |
| holding_id | text | True | holding id (baseline) |
| origin_id | text | True | origin id (baseline) |
| reversal_of | text | True | reversal of (baseline) |
| category | text | False | category (baseline) |
| description | text | False | description (baseline) |
| posting | text | False | posting (baseline) |
| manual_category_override | boolean | False | manual category override (baseline) |
| reference | text | True | reference (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); CHECK (account_id IS DISTINCT FROM to_account_id); CHECK (kind<>'transfer' OR to_account_id IS NOT NULL); UNIQUE (workspace_id,reversal_of); FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,to_account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,origin_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,reversal_of) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## entry_groups — Ledger

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Replace immutable trigger intentionally: new group builds only within one transaction; must seal before commit; sealed bundle rejects append/update/delete.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| event_id | text | False | event id (baseline) |
| reversal_of | text | True | reversal of (baseline) |
| committed_at | timestamptz | False | committed at (baseline) |
| seal_state | text | False | building or sealed (D1 target) |
| sealed_at | timestamptz | True | Final immutable bundle seal (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,event_id); UNIQUE (workspace_id,reversal_of); FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,reversal_of) REFERENCES fw.entry_groups(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## posting_lines — Ledger

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| group_id | text | False | group id (baseline) |
| ledger_account_id | text | False | ledger account id (baseline) |
| signed_amount | numeric(18,0) | False | signed amount (baseline) |
| currency | text | False | currency (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,group_id) REFERENCES fw.entry_groups(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,ledger_account_id) REFERENCES fw.ledger_accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## holding_movements — Portfolio

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: UNIQUE(workspace_id,holding_id,sequence_no); quantity is resulting balance; delta only for delta mode, declaration not purchase.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| holding_id | text | False | holding id (baseline) |
| event_id | text | True | event id (baseline) |
| business_date | date | False | business date (baseline) |
| quantity | numeric(28,8) | False | quantity (baseline) |
| delta | numeric(28,8) | True | delta (baseline) |
| kind | text | False | kind (baseline) |
| reason | text | False | reason (baseline) |
| sequence_no | bigint | False | Monotonic per-holding ordering (D1 target) |
| quantity_mode | text | False | set or delta (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## provider_entitlements — Market

Tenant: True; stage: INHERITED_EXPAND. Retention: entitlement lifecycle; refs only, no credentials.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| provider_id | text | False | provider id (baseline) |
| rights_version | text | False | rights version (baseline) |
| credential_ref | text | True | credential ref (baseline) |
| quota_daily | integer | False | quota daily (baseline) |
| allowed_assets | jsonb | False | allowed assets (baseline) |
| cache_scope | text | False | cache scope (baseline) |
| expires_at | timestamptz | True | expires at (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)

## quote_observations — Market

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Freeze source price/currency/unit, quoteAsOf and FX provenance; quality exposed by API is derived at read asOf, not permanently fresh.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| holding_id | text | False | holding id (baseline) |
| entitlement_id | text | False | entitlement id (baseline) |
| provider_id | text | False | provider id (baseline) |
| price | numeric(28,8) | False | price (baseline) |
| currency | text | False | currency (baseline) |
| unit | text | False | unit (baseline) |
| side | text | False | side (baseline) |
| quote_as_of | timestamptz | False | quote as of (baseline) |
| fetched_at | timestamptz | False | fetched at (baseline) |
| fx_vnd_per_usd | numeric(28,8) | True | fx vnd per usd (baseline) |
| fx_at | timestamptz | True | fx at (baseline) |
| fingerprint | text | False | fingerprint (baseline) |
| quality | text | False | quality (baseline) |
| profile_snapshot | jsonb | False | Frozen instrument gold profile units side and normalization versions (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,holding_id,provider_id,fingerprint); FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,entitlement_id) REFERENCES fw.provider_entitlements(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## evidence — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: normalized payload 90d; evidence identity/digest for ledger lifecycle.

Contract-phase change: After verified move remove content field, retain digest/identity/refs; no raw notification or OTP.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| source_id | text | True | source id (baseline) |
| kind | text | False | kind (baseline) |
| recorded_at | timestamptz | False | recorded at (baseline) |
| observed_date | date | True | observed date (baseline) |
| reference | text | True | reference (baseline) |
| content | jsonb | True | content (baseline) |
| content_digest | text | False | content digest (baseline) |
| schema_ref | text | False | schema ref (baseline) |
| content_payload_id | text | True | Domain-owned expirable content object (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## event_evidence — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| event_id | text | False | event id (baseline) |
| evidence_id | text | False | evidence id (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,event_id,evidence_id); FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## source_records — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| source_id | text | False | source id (baseline) |
| source_record_key | text | False | source record key (baseline) |
| revision | bigint | False | revision (baseline) |
| parser_version | text | False | parser version (baseline) |
| mapping_version | bigint | False | mapping version (baseline) |
| evidence_id | text | False | evidence id (baseline) |
| event_id | text | True | event id (baseline) |
| status | text | False | status (baseline) |
| manual_override | jsonb | True | manual override (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,source_id,source_record_key,revision); FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## reviews — Review

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| event_id | text | True | event id (baseline) |
| holding_id | text | True | holding id (baseline) |
| account_id | text | True | account id (baseline) |
| type | text | False | type (baseline) |
| status | text | False | status (baseline) |
| title | text | False | title (baseline) |
| variance | numeric(18,0) | True | variance (baseline) |
| observed | numeric(18,0) | True | observed (baseline) |
| resolution | jsonb | True | resolution (baseline) |
| resolved_at | timestamptz | True | resolved at (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## cash_observations — Ledger

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| account_id | text | False | account id (baseline) |
| observed | numeric(18,0) | False | observed (baseline) |
| as_of | timestamptz | False | as of (baseline) |
| matched_workspace_version | bigint | False | matched workspace version (baseline) |
| variance | numeric(18,0) | False | variance (baseline) |
| review_id | text | True | review id (baseline) |
| evidence_id | text | False | evidence id (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,review_id) REFERENCES fw.reviews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## collector_bindings — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| device_id | text | False | device id (baseline) |
| account_id | text | False | account id (baseline) |
| package_name | text | False | package name (baseline) |
| parser_profile_id | text | False | parser profile id (baseline) |
| consent_at | timestamptz | False | consent at (baseline) |
| enabled | boolean | False | enabled (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,device_id,id); FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## ingestion_receipts — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: payload 90d; identity/digest tombstone until workspace erasure.

Contract-phase change: After verified payload cutover remove normalized_evidence; after J2 cutover remove delivery lease/retry fields; retain transport dedupe identity and minimal result tombstone.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| device_id | text | False | device id (baseline) |
| binding_id | text | False | binding id (baseline) |
| binding_version | bigint | False | binding version (baseline) |
| event_key | text | False | event key (baseline) |
| revision | bigint | False | revision (baseline) |
| source_key | text | False | source key (baseline) |
| observed_at | timestamptz | False | observed at (baseline) |
| received_at | timestamptz | False | received at (baseline) |
| parser_version | text | False | parser version (baseline) |
| payload_digest | text | False | payload digest (baseline) |
| normalized_evidence | jsonb | True | normalized evidence (baseline) |
| state | text | False | state (baseline) |
| event_id | text | True | event id (baseline) |
| review_id | text | True | review id (baseline) |
| error_code | text | True | error code (baseline) |
| ack_at | timestamptz | True | ack at (baseline) |
| lease_until | timestamptz | True | lease until (baseline) |
| lease_token | text | True | lease token (baseline) |
| attempts | integer | False | attempts (baseline) |
| next_attempt | timestamptz | False | next attempt (baseline) |
| capture_epoch | bigint | False | Device epoch captured and checked (D1 target) |
| result_payload_id | text | True | Expirable minimal receipt evidence (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,device_id,event_key,revision); CHECK (state<>'posted' OR event_id IS NOT NULL); CHECK (state<>'needs_review' OR review_id IS NOT NULL); FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,binding_id) REFERENCES fw.collector_bindings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,review_id) REFERENCES fw.reviews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## receipt_evidence — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| receipt_id | text | False | receipt id (baseline) |
| evidence_id | text | False | evidence id (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,receipt_id,evidence_id); FOREIGN KEY (workspace_id,receipt_id) REFERENCES fw.ingestion_receipts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## coverage_gaps — Ingestion

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| account_id | text | False | account id (baseline) |
| source_id | text | True | source id (baseline) |
| device_id | text | True | device id (baseline) |
| start_at | timestamptz | False | start at (baseline) |
| end_at | timestamptz | True | end at (baseline) |
| reason | text | False | reason (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); CHECK (end_at IS NULL OR end_at>=start_at); FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## refresh_jobs — Market

Tenant: True; stage: INHERITED_EXPAND. Retention: result payload 90d; dedupe identities workspace lifecycle.

Contract-phase change: Domain lifecycle remains; remove inline result after payload cutover and lease/retry fields after J2 cutover.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| entitlement_id | text | False | entitlement id (baseline) |
| dedupe_key | text | False | dedupe key (baseline) |
| business_date | date | False | business date (baseline) |
| trigger_kind | text | False | trigger kind (baseline) |
| state | text | False | state (baseline) |
| attempts | integer | False | attempts (baseline) |
| next_attempt | timestamptz | False | next attempt (baseline) |
| lease_until | timestamptz | True | lease until (baseline) |
| lease_token | text | True | lease token (baseline) |
| result | jsonb | True | result (baseline) |
| error_code | text | True | error code (baseline) |
| result_payload_id | text | True | Expirable detailed refresh result (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,dedupe_key); FOREIGN KEY (workspace_id,entitlement_id) REFERENCES fw.provider_entitlements(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## import_previews — Imports

Tenant: True; stage: INHERITED_EXPAND. Retention: staged CSV normalized rows 24h; raw CSV memory only.

Contract-phase change: Move rows array to import_rows; retain preview token, expiry and selected-set digest; budget applies per row and per request, not whole CSV in one JSON.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| account_id | text | False | account id (baseline) |
| file_digest | text | False | file digest (baseline) |
| mapping_digest | text | False | mapping digest (baseline) |
| profile_version | text | False | profile version (baseline) |
| mapping_version | bigint | False | mapping version (baseline) |
| rows | jsonb | False | rows (baseline) |
| expected_workspace_version | bigint | False | expected workspace version (baseline) |
| expires_at | timestamptz | False | expires at (baseline) |
| token_digest | text | False | token digest (baseline) |
| row_count | integer | False | Staged row count (D1 target) |
| rows_digest | text | False | Ordered row-set digest (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## import_jobs — Imports

Tenant: True; stage: INHERITED_EXPAND. Retention: result 90d; identity tombstone remains.

Contract-phase change: Domain lifecycle remains; remove inline result after payload cutover and lease/retry fields after J2 cutover; selected set atomic.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| preview_id | text | False | preview id (baseline) |
| account_id | text | False | account id (baseline) |
| selected_row_ids | jsonb | False | selected row ids (baseline) |
| state | text | False | state (baseline) |
| result | jsonb | True | result (baseline) |
| error_code | text | True | error code (baseline) |
| lease_until | timestamptz | True | lease until (baseline) |
| lease_token | text | True | lease token (baseline) |
| attempts | integer | False | attempts (baseline) |
| result_payload_id | text | True | Expirable detailed import result (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,preview_id); FOREIGN KEY (workspace_id,preview_id) REFERENCES fw.import_previews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## snapshots — ReadModels

Tenant: True; stage: INHERITED_EXPAND. Retention: frozen refs for histories; projection cache 30d, reconstruct or OUTSIDE_SNAPSHOT.

Contract-phase change: Replace UNIQUE(workspace_id,financial_version) with (workspace_id,financial_version,as_of,refs_digest,engine_version); move projection to projection_cache after cutover.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| financial_version | bigint | False | financial version (baseline) |
| as_of | timestamptz | False | as of (baseline) |
| refs | jsonb | False | refs (baseline) |
| schema_ref | text | False | schema ref (baseline) |
| projection | jsonb | False | projection (baseline) |
| refs_digest | text | False | Pinned immutable input identity (D1 target) |
| engine_version | text | False | Financial rules version (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,financial_version)

## financial_plans — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| name | text | False | name (baseline) |
| horizon | date | False | horizon (baseline) |
| baseline_snapshot_id | text | False | baseline snapshot id (baseline) |
| lifecycle | text | False | lifecycle (baseline) |
| assumptions | jsonb | False | assumptions (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,baseline_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## plan_items — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Backfill from plan_id, or explicit standalone scope; freeze revisions under scope lock.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| plan_id | text | True | plan id (baseline) |
| name | text | False | name (baseline) |
| kind | text | False | kind (baseline) |
| amount | numeric(18,0) | False | amount (baseline) |
| account_id | text | False | account id (baseline) |
| holding_id | text | True | holding id (baseline) |
| start_date | date | False | start date (baseline) |
| end_date | date | False | end date (baseline) |
| recurrence | text | False | recurrence (baseline) |
| day_of_month | integer | False | day of month (baseline) |
| skip_months | jsonb | False | skip months (baseline) |
| category | text | False | category (baseline) |
| archived | boolean | False | archived (baseline) |
| scope_id | text | False | Stable plan or standalone scope (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); CHECK (start_date<=end_date); CHECK (kind<>'investment' OR holding_id IS NOT NULL); FOREIGN KEY (workspace_id,plan_id) REFERENCES fw.financial_plans(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## actual_links — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Replace active unique index with (workspace_id,planning_revision_id,event_id) WHERE released_at IS NULL; FK to frozen item version. Resolve scope from authorized item, never from bare plan_version.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| plan_item_id | text | False | plan item id (baseline) |
| plan_item_version | bigint | False | plan item version (baseline) |
| plan_version | bigint | False | plan version (baseline) |
| occurrence_id | text | False | occurrence id (baseline) |
| event_id | text | False | event id (baseline) |
| event_version | bigint | False | event version (baseline) |
| reason | text | False | reason (baseline) |
| released_at | timestamptz | True | released at (baseline) |
| planning_revision_id | text | False | Unambiguous frozen plan scope/revision (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,plan_item_id) REFERENCES fw.plan_items(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## goals — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| name | text | False | name (baseline) |
| target | numeric(18,0) | False | target (baseline) |
| due | date | False | due (baseline) |
| status | text | False | status (baseline) |
| contribution_schedule | jsonb | True | contribution schedule (baseline) |
| projection | jsonb | True | projection (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)

## plan_goal_links — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| plan_item_id | text | False | plan item id (baseline) |
| plan_item_version | bigint | False | plan item version (baseline) |
| goal_id | text | False | goal id (baseline) |
| goal_version | bigint | False | goal version (baseline) |
| role | text | False | role (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,plan_item_id,plan_item_version,goal_id); FOREIGN KEY (workspace_id,plan_item_id) REFERENCES fw.plan_items(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## goal_allocations — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| goal_id | text | False | goal id (baseline) |
| account_id | text | False | account id (baseline) |
| amount | numeric(18,0) | False | amount (baseline) |
| business_date | date | False | business date (baseline) |
| active | boolean | False | active (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## simulations — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| goal_id | text | True | goal id (baseline) |
| base_snapshot_id | text | False | base snapshot id (baseline) |
| frozen_inputs | jsonb | False | frozen inputs (baseline) |
| result | jsonb | False | result (baseline) |
| schema_ref | text | False | schema ref (baseline) |
| state | text | False | state (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## conversations — Assistant

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| title | text | False | title (baseline) |
| lifecycle | text | False | lifecycle (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)

## messages — Assistant

Tenant: True; stage: INHERITED_EXPAND. Retention: owner history lifecycle; purge on explicit erasure, backup window applies.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| conversation_id | text | False | conversation id (baseline) |
| text | text | False | text (baseline) |
| captured_context | jsonb | False | captured context (baseline) |
| processing_kind | text | False | processing kind (baseline) |
| state | text | False | state (baseline) |
| result | jsonb | True | result (baseline) |
| agent_run_id | text | True | agent run id (baseline) |
| planning_draft_id | text | True | planning draft id (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## agent_runs — Assistant

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Delivery lease/retry/cancel execution authority moves to J2; Agent logical state and budget stay in domain record.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| conversation_id | text | False | conversation id (baseline) |
| base_snapshot_id | text | False | base snapshot id (baseline) |
| intent | text | False | intent (baseline) |
| state | text | False | state (baseline) |
| question_id | text | True | question id (baseline) |
| constraints | jsonb | False | constraints (baseline) |
| settings | jsonb | False | settings (baseline) |
| active_millis | integer | False | active millis (baseline) |
| tool_calls | integer | False | tool calls (baseline) |
| clarifications | integer | False | clarifications (baseline) |
| lease_until | timestamptz | True | lease until (baseline) |
| lease_token | text | True | lease token (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## planning_drafts — Planning

Tenant: True; stage: INHERITED_EXPAND. Retention: unconfirmed 30d; confirmed refs workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| conversation_id | text | False | conversation id (baseline) |
| run_id | text | True | run id (baseline) |
| base_snapshot_id | text | False | base snapshot id (baseline) |
| state | text | False | state (baseline) |
| body | jsonb | False | body (baseline) |
| schema_ref | text | False | schema ref (baseline) |
| confirmed_ids | jsonb | False | confirmed ids (baseline) |
| expires_at | timestamptz | False | expires at (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## tool_results — Assistant

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

Contract-phase change: Remove inline result after verified payload cutover; typed evidence retention separate from operational attempt logs.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| run_id | text | True | run id (baseline) |
| message_id | text | True | message id (baseline) |
| base_snapshot_id | text | False | base snapshot id (baseline) |
| tool_name | text | False | tool name (baseline) |
| result | jsonb | False | result (baseline) |
| schema_ref | text | False | schema ref (baseline) |
| evidence_refs | jsonb | False | evidence refs (baseline) |
| result_payload_id | text | True | Agent-owned tool evidence object (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); FOREIGN KEY (workspace_id,run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,message_id) REFERENCES fw.messages(workspace_id,id) DEFERRABLE INITIALLY DEFERRED; FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED

## version_history — SharedTX

Tenant: True; stage: INHERITED_EXPAND. Retention: workspace lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| object_type | text | False | object type (baseline) |
| object_id | text | False | object id (baseline) |
| object_version | bigint | False | object version (baseline) |
| payload | jsonb | False | payload (baseline) |
| schema_ref | text | False | schema ref (baseline) |
| reason | text | False | reason (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,object_type,object_id,object_version)

## proposal_previews — SharedTX

Tenant: True; stage: INHERITED_EXPAND. Retention: expired 24h; result identities in idempotency.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| subject_id | text | False | subject id (baseline) |
| operation_id | text | False | operation id (baseline) |
| object_id | text | True | object id (baseline) |
| digest | text | False | digest (baseline) |
| base_versions | jsonb | False | base versions (baseline) |
| changes | jsonb | False | changes (baseline) |
| token_digest | text | False | token digest (baseline) |
| expires_at | timestamptz | False | expires at (baseline) |
| consumed_at | timestamptz | True | consumed at (baseline) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)

## idempotency_records — SharedTX

Tenant: True; stage: INHERITED_EXPAND. Retention: result body 90d, identity/digest/ref tombstone until workspace erasure.

Contract-phase change: Remove inline result after verified payload cutover; retain operation/key/digest and committed effect refs beyond result TTL; old key never silently re-executes.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | workspace id (baseline) |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| principal_id | text | False | principal id (baseline) |
| operation_id | text | False | operation id (baseline) |
| key | text | False | key (baseline) |
| payload_digest | text | False | payload digest (baseline) |
| result_ref | text | False | result ref (baseline) |
| result | jsonb | True | result (baseline) |
| committed_at | timestamptz | False | committed at (baseline) |
| result_payload_id | text | True | Expirable response body separate from command tombstone (D1 target) |

Rules (design): PRIMARY KEY (workspace_id,id); FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id); UNIQUE (workspace_id,principal_id,operation_id,key)

## ops_accounts — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: support metadata lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| subject_token | text | False | subject token (baseline) |
| workspace_token | text | False | workspace token (baseline) |
| state | text | False | state (baseline) |
| device_health | jsonb | False | device health (baseline) |

Rules (design): 

## ops_sources — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: source lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| name | text | False | name (baseline) |
| package_name | text | False | package name (baseline) |
| parser_version | text | False | parser version (baseline) |
| compatibility | text | False | compatibility (baseline) |
| state | text | False | state (baseline) |
| binding_count | integer | False | binding count (baseline) |
| last_success | timestamptz | True | last success (baseline) |
| error_code | text | True | error code (baseline) |

Rules (design): 

## ops_jobs — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: metadata 90d.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| source_id | text | False | source id (baseline) |
| job_type | text | False | job type (baseline) |
| state | text | False | state (baseline) |
| attempts | integer | False | attempts (baseline) |
| lease_until | timestamptz | True | lease until (baseline) |
| lease_token | text | True | lease token (baseline) |
| next_attempt | timestamptz | False | next attempt (baseline) |
| error_code | text | True | error code (baseline) |
| request_id | text | False | request id (baseline) |

Rules (design): 

## ops_quotas — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: 30d.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| name | text | False | name (baseline) |
| used | bigint | False | used (baseline) |
| limit_value | bigint | False | limit value (baseline) |
| reset_at | timestamptz | False | reset at (baseline) |
| cooldown_until | timestamptz | True | cooldown until (baseline) |

Rules (design): 

## ops_releases — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: release lifecycle.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| version_name | text | False | version name (baseline) |
| channel | text | False | channel (baseline) |
| published_at | timestamptz | True | published at (baseline) |
| artifact_url | text | True | artifact url (baseline) |
| sha256 | text | True | sha256 (baseline) |
| signing_fingerprint | text | True | signing fingerprint (baseline) |
| compatibility | text | False | compatibility (baseline) |
| test_state | text | False | test state (baseline) |

Rules (design): 

## ops_incidents — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: 90d.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| severity | text | False | severity (baseline) |
| source_id | text | True | source id (baseline) |
| code | text | False | code (baseline) |
| state | text | False | state (baseline) |

Rules (design): 

## ops_previews — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: 24h.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| version | bigint | False | version (baseline) |
| updated_at | timestamptz | False | updated at (baseline) |
| subject_id | text | False | subject id (baseline) |
| action | text | False | action (baseline) |
| object_id | text | False | object id (baseline) |
| expected_version | bigint | False | expected version (baseline) |
| reason_code | text | False | reason code (baseline) |
| digest | text | False | digest (baseline) |
| token_digest | text | False | token digest (baseline) |
| expires_at | timestamptz | False | expires at (baseline) |

Rules (design): 

## ops_idempotency — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: 90d plus dedupe tombstone.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| subject_id | text | False | subject id (baseline) |
| operation_id | text | False | operation id (baseline) |
| key | text | False | key (baseline) |
| digest | text | False | digest (baseline) |
| result | jsonb | False | result (baseline) |

Rules (design): 

## ops_audit — Ops

Tenant: False; stage: INHERITED_EXPAND. Retention: 180d synthetic; real retention pending policy.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | id (baseline) |
| created_at | timestamptz | False | created at (baseline) |
| actor_id | text | False | actor id (baseline) |
| action | text | False | action (baseline) |
| object_id | text | False | object id (baseline) |
| reason_code | text | False | reason code (baseline) |
| from_version | bigint | False | from version (baseline) |
| to_version | bigint | False | to version (baseline) |
| result | text | False | result (baseline) |
| request_id | text | False | request id (baseline) |

Rules (design): 

## jobs — SharedJobs

Tenant: True; stage: NEW_DESIGN. Retention: Keep dispatch tombstone through business replay horizon; no finance/prompt/raw notification.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| job_type | text | False | Registered worker capability (D1 target) |
| domain_kind | text | False | Registered domain reference type (D1 target) |
| domain_id | text | False | Domain record in this workspace (D1 target) |
| dedupe_key | text | False | Business dispatch identity (D1 target) |
| state | text | False | queued running succeeded failed cancelled (D1 target) |
| next_attempt_at | timestamptz | False | UTC due time (D1 target) |
| lease_until | timestamptz | True | Claim expiry (D1 target) |
| lease_token | text | True | Unpredictable claim token (D1 target) |
| generation | bigint | False | Monotonic fencing counter (D1 target) |
| attempt_count | integer | False | Started attempts (D1 target) |
| max_attempts | integer | False | Bounded retry limit (D1 target) |
| cancel_requested | boolean | False | Cooperative cancellation (D1 target) |
| recovery_epoch | bigint | False | Workspace restore fence (D1 target) |
| updated_at | timestamptz | False | Last dispatcher transition (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE(workspace_id,job_type,dedupe_key); generation>=0; 0<=attempt_count<=max_attempts; max_attempts>0; Lease fields both present iff running; bounded counters; domain reference validated by typed registry in same UnitOfWork; no arbitrary JSON payload

## job_attempts — SharedJobs

Tenant: True; stage: NEW_DESIGN. Retention: Operational audit, bounded retention after terminal job.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| job_id | text | False | Parent dispatch (D1 target) |
| attempt_no | integer | False | Attempt number (D1 target) |
| generation | bigint | False | Fence captured on claim (D1 target) |
| worker_profile | text | False | Capability identity (D1 target) |
| started_at | timestamptz | False | Claim time (D1 target) |
| finished_at | timestamptz | True | Terminal time (D1 target) |
| outcome | text | True | success retry failed cancelled expired (D1 target) |
| error_code | text | True | Allowlisted sanitized error (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE(workspace_id,job_id,attempt_no); Append attempt; finalize once under matching generation; times ordered

## scheduler_state — SharedJobs

Tenant: False; stage: NEW_DESIGN. Retention: Retain watermark across restart.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| schedule_key | text | False | Registered schedule (D1 target) |
| scope_key | text | False | global or opaque workspace key (D1 target) |
| workspace_id | text | True | Optional tenant target (D1 target) |
| timezone | text | False | Business timezone (D1 target) |
| next_due_at | timestamptz | False | Next due instant (D1 target) |
| last_dispatched_at | timestamptz | True | Committed enqueue watermark (D1 target) |
| version | bigint | False | Optimistic state version (D1 target) |

Rules (design): PK(id); UNIQUE(schedule_key,scope_key); Workspace schedules require matching workspace reference; global schedules use explicit global scope; Only scheduler role; catch-up bounded and coalesced

## planning_scopes — Planning

Tenant: True; stage: NEW_DESIGN. Retention: Stable identity, archive rather than retarget.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| kind | text | False | plan or standalone (D1 target) |
| plan_id | text | True | Owning plan when kind=plan (D1 target) |
| current_revision | bigint | False | Monotonic revision counter (D1 target) |
| version | bigint | False | Optimistic aggregate version (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE NULLS NOT DISTINCT(workspace_id,plan_id); CHECK kind=plan iff plan_id IS NOT NULL; exactly one standalone scope per workspace

## planning_revisions — Planning

Tenant: True; stage: NEW_DESIGN. Retention: Pinned history until authorized workspace erasure.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| scope_id | text | False | Stable plan or standalone scope (D1 target) |
| revision_no | bigint | False | Scope-local revision (D1 target) |
| base_snapshot_id | text | False | Frozen financial context (D1 target) |
| source_versions | jsonb | False | Validated bounded version refs (D1 target) |
| engine_version | text | False | Simulation rules version (D1 target) |
| bundle_digest | text | False | Frozen bundle checksum (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE(workspace_id,scope_id,revision_no); Immutable; revision_no>0; bounded typed source refs

## planning_revision_items — Planning

Tenant: True; stage: NEW_DESIGN. Retention: Same as planning revision.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| planning_revision_id | text | False | Frozen parent revision (D1 target) |
| plan_item_id | text | False | Stable item identity (D1 target) |
| plan_item_version | bigint | False | Captured item version (D1 target) |
| frozen_item | jsonb | False | Typed immutable item body (D1 target) |
| item_digest | text | False | Frozen body checksum (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE(workspace_id,planning_revision_id,plan_item_id,plan_item_version); Immutable; no hard delete of referenced current item

## projection_cache — ReadModels

Tenant: True; stage: NEW_DESIGN. Retention: TTL, rebuildable.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| snapshot_id | text | False | Pinned facts descriptor (D1 target) |
| query_digest | text | False | Scope period asOf versions engine and DTO schema (D1 target) |
| result_payload_id | text | True | Expirable result object (D1 target) |
| expires_at | timestamptz | False | Cache expiry (D1 target) |
| updated_at | timestamptz | False | Refresh time (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE(workspace_id,snapshot_id,query_digest); Discard cache without deleting pinned facts/history

## import_rows — Imports

Tenant: True; stage: NEW_DESIGN. Retention: Expire staging payload; retain selected-set/result digests as required for replay.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| preview_id | text | False | Parent preview (D1 target) |
| row_key | text | False | Stable parsed row identity (D1 target) |
| row_number | integer | False | Original file row (D1 target) |
| status | text | False | valid invalid selected confirmed redacted (D1 target) |
| normalized_row | jsonb | True | Minimal typed row (D1 target) |
| row_digest | text | False | Canonical row checksum (D1 target) |
| error_code | text | True | Sanitized validation result (D1 target) |
| expires_at | timestamptz | False | Staging retention (D1 target) |
| redacted_at | timestamptz | True | Payload deletion time (D1 target) |

Rules (design): PK(workspace_id,id); UNIQUE(workspace_id,preview_id,row_key); row_number>0; bounded row payload; redacted payload must be NULL

## admin_principals — OpsIdentity

Tenant: False; stage: NEW_DESIGN. Retention: Until admin offboarding then minimum audit tombstone.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| login_name | text | False | Normalized admin identifier (D1 target) |
| auth_ref | text | False | Controlled credential or external subject reference (D1 target) |
| status | text | False | active suspended revoked (D1 target) |
| auth_epoch | bigint | False | Session revocation epoch (D1 target) |
| mfa_required | boolean | False | Mandatory for privileged access (D1 target) |
| version | bigint | False | Optimistic state version (D1 target) |

Rules (design): PK(id); UNIQUE(login_name); UNIQUE(auth_ref); No customer identity grants; auth mechanism decided ARCH-06

## admin_sessions — OpsIdentity

Tenant: False; stage: NEW_DESIGN. Retention: Short session lifetime; sanitized audit separately.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| principal_id | text | False | Admin principal (D1 target) |
| token_digest | text | False | Digest only, never bearer secret (D1 target) |
| auth_epoch | bigint | False | Principal epoch at issue (D1 target) |
| expires_at | timestamptz | False | Session expiry (D1 target) |
| revoked_at | timestamptz | True | Revocation (D1 target) |
| mfa_verified_at | timestamptz | True | Step-up time (D1 target) |

Rules (design): PK(id); UNIQUE(token_digest); Expiry and epoch checked on every request

## admin_mfa_factors — OpsIdentity

Tenant: False; stage: NEW_DESIGN. Retention: Revoke before deleting secret material.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| principal_id | text | False | Admin principal (D1 target) |
| method | text | False | Registered MFA method (D1 target) |
| secret_ref | text | False | Vault or public-key reference (D1 target) |
| status | text | False | pending active revoked (D1 target) |
| counter | bigint | False | Replay or usage counter (D1 target) |

Rules (design): PK(id); Counter nonnegative; method-specific validation ARCH-06; no raw secret in JSON

## admin_challenges — OpsIdentity

Tenant: False; stage: NEW_DESIGN. Retention: Expire promptly, keep sanitized security audit.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| principal_id | text | True | Resolved admin principal (D1 target) |
| purpose | text | False | Registered authentication step (D1 target) |
| challenge_digest | text | False | Digest only (D1 target) |
| expires_at | timestamptz | False | Challenge expiry (D1 target) |
| attempts | integer | False | Bounded attempts (D1 target) |
| consumed_at | timestamptz | True | One-time consumption (D1 target) |

Rules (design): PK(id); UNIQUE(challenge_digest); Bounded attempts, expiry, consume once atomically

## payload_objects — SharedTX

Tenant: True; stage: NEW_DESIGN. Retention: By domain policy; immutable identity distinct from expirable content.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| workspace_id | text | False | Owner workspace (D1 target) |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| owner_module | text | False | Registered domain capability (D1 target) |
| object_kind | text | False | Registered payload schema (D1 target) |
| object_id | text | False | Domain identity within this workspace (D1 target) |
| schema_ref | text | False | Validator version (D1 target) |
| content_digest | text | False | Canonical content checksum (D1 target) |
| content | jsonb | True | Bounded sensitive typed content (D1 target) |
| policy | text | False | Registered retention class (D1 target) |
| expires_at | timestamptz | True | Policy expiry (D1 target) |
| redacted_at | timestamptz | True | Irreversible content purge marker (D1 target) |

Rules (design): PK(workspace_id,id); No generic cross-module CRUD; domain registry validates reference; Redacted content must be NULL; digest must not contain raw PII; no OTP/raw bank notification

## recovery_journal — Recovery

Tenant: False; stage: NEW_DESIGN. Retention: Keep through maximum recoverable backup and replay horizon.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| workspace_token | text | False | Opaque recovery identifier (D1 target) |
| event_kind | text | False | delete revoke restore (D1 target) |
| epoch | bigint | False | Monotonic recovery fence (D1 target) |
| event_digest | text | False | Integrity checksum (D1 target) |
| checkpoint_ref | text | True | Independent off-host durable checkpoint (D1 target) |
| metadata | jsonb | False | Allowlisted operational metadata only (D1 target) |

Rules (design): PK(id); UNIQUE(workspace_token,epoch); Append only; deliberately no FK to workspace; must outlive erased DB row; Local copy is not independent recovery authority

## ops_control_requests — Ops

Tenant: False; stage: NEW_DESIGN. Retention: Sanitized admin audit/replay horizon.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| principal_id | text | False | Authorized admin (D1 target) |
| target_kind | text | False | Allowlisted ops source/job metadata (D1 target) |
| target_ops_id | text | False | Sanitized target identity (D1 target) |
| action | text | False | Allowlisted pause resume retry (D1 target) |
| expected_version | bigint | False | Target version precondition (D1 target) |
| request_key | text | False | Idempotency key (D1 target) |
| request_digest | text | False | Canonical safe request checksum (D1 target) |
| state | text | False | requested accepted rejected completed (D1 target) |
| reason_code | text | False | Allowlisted reason (D1 target) |
| updated_at | timestamptz | False | Transition time (D1 target) |

Rules (design): PK(id); UNIQUE(principal_id,request_key); No arbitrary workspace/finance payload; dispatcher rechecks safe action and revocation

## migration_journal — Migrations

Tenant: False; stage: NEW_DESIGN. Retention: Permanent schema history.

| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |
| --- | --- | --- | --- |
| id | text | False | Opaque stable ID (D1 target) |
| created_at | timestamptz | False | Server UTC creation time (D1 target) |
| migration_name | text | False | Immutable migration identity (D1 target) |
| checksum | text | False | Reviewed file checksum (D1 target) |
| schema_from | text | False | Expected prior revision (D1 target) |
| schema_to | text | False | Committed revision (D1 target) |
| applied_at | timestamptz | False | Successful transaction timestamp (D1 target) |
| runner_version | text | False | Controlled runner build (D1 target) |

Rules (design): PK(id); UNIQUE(migration_name); Migration role only; preflight verifies baseline before bootstrap; Failed attempt diagnostics external; no success entry on rollback

