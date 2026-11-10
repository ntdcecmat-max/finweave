# Physical data dictionary — synthetic PostgreSQL
08/10/2026. Generated with physical-model.json and 001 by tools/handover/build_data.py; change the authored model definitions and regenerate together before first deployment. After migration execution, issue new migrations instead of editing historical checksums. Plaintext profile, never anti-Ops evidence. JSON payloads are schema-validated in the service against canonical v2; SQL checks only outer type/size.
All tenant PKs `(workspace_id,id)`; cross-object FKs carry workspace. Text IDs preserve frontend opaque IDs; UUID-shaped IDs are accepted, not required. `numeric(18,0)` VND integer; `numeric(28,8)` quantity/quotes. Instants timestamptz, business dates date. Versions bigint in DB but <=2^53-1 at JSON boundary.
For mutable tables service archives old row in version_history and increments version; financial_version increments only after financial projection changes. Read/draft/chat/receipt ACK do not automatically advance it.

## identities
Boundary: identity/public catalogue/ops service; grants explicit. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| email | `email text NOT NULL UNIQUE CHECK (email ~ '^[^@]+@[^@]+[.]test$')` | no | email |
| display_name | `display_name text NOT NULL` | no | display name |
| credential_hash | `credential_hash text NOT NULL` | no | credential hash |
| state | `state text NOT NULL CHECK (state IN ('active','suspended','deleted'))` | no | state |

Constraints: .

## workspaces
Boundary: identity/public catalogue/ops service; grants explicit. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| owner_id | `owner_id text NOT NULL REFERENCES fw.identities(id)` | no | owner id |
| currency | `currency text NOT NULL DEFAULT 'VND' CHECK (currency='VND')` | no | currency |
| timezone | `timezone text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh' CHECK (timezone='Asia/Ho_Chi_Minh')` | no | timezone |
| tracking_start | `tracking_start date NOT NULL` | no | tracking start |
| financial_version | `financial_version bigint NOT NULL DEFAULT 1 CHECK (financial_version > 0)` | no | financial version |
| profile | `profile text NOT NULL DEFAULT 'synthetic' CHECK (profile='synthetic')` | no | profile |

Constraints: .

## sessions
Boundary: identity/public catalogue/ops service; grants explicit. Retention: expired/revoked metadata 30d; no tokens stored.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| subject_id | `subject_id text NOT NULL REFERENCES fw.identities(id)` | no | subject id |
| token_digest | `token_digest text NOT NULL UNIQUE` | no | token digest |
| role | `role text NOT NULL CHECK (role IN ('owner','admin'))` | no | role |
| device_id | `device_id text` | yes | device id |
| expires_at | `expires_at timestamptz NOT NULL` | no | expires at |
| revoked_at | `revoked_at timestamptz` | yes | revoked at |

Constraints: .

## identity_challenges
Boundary: identity/public catalogue/ops service; grants explicit. Retention: expired challenges 24h; digests only.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| subject_id | `subject_id text REFERENCES fw.identities(id)` | yes | subject id |
| challenge_digest | `challenge_digest text NOT NULL UNIQUE` | no | challenge digest |
| purpose | `purpose text NOT NULL CHECK (purpose IN ('signin','register','reset','enrollment'))` | no | purpose |
| expires_at | `expires_at timestamptz NOT NULL` | no | expires at |
| consumed_at | `consumed_at timestamptz` | yes | consumed at |
| attempts | `attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 5)` | no | attempts |

Constraints: .

## devices
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| owner_id | `owner_id text NOT NULL REFERENCES fw.identities(id)` | no | owner id |
| platform | `platform text NOT NULL CHECK (platform='android')` | no | platform |
| public_key | `public_key text NOT NULL` | no | public key |
| key_digest | `key_digest text NOT NULL` | no | key digest |
| name | `name text NOT NULL` | no | name |
| app_version | `app_version text NOT NULL` | no | app version |
| consent_version | `consent_version text NOT NULL` | no | consent version |
| status | `status text NOT NULL CHECK (status IN ('active','revoked'))` | no | status |
| revoked_at | `revoked_at timestamptz` | yes | revoked at |
| last_seen | `last_seen timestamptz` | yes | last seen |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,key_digest)`; `CHECK ((status='revoked')=(revoked_at IS NOT NULL))`.

## accounts
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| name | `name text NOT NULL` | no | name |
| kind | `kind text NOT NULL CHECK (kind IN ('bank','wallet','cash'))` | no | kind |
| opening | `opening numeric(18,0) NOT NULL CHECK (opening>=0)` | no | opening |
| opening_date | `opening_date date NOT NULL` | no | opening date |
| archived | `archived boolean NOT NULL DEFAULT false` | no | archived |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`.

## ledger_accounts
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| account_id | `account_id text` | yes | account id |
| kind | `kind text NOT NULL CHECK (kind IN ('asset','income','expense','equity','clearing','investment'))` | no | kind |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,account_id)`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## sources
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| name | `name text NOT NULL` | no | name |
| kind | `kind text NOT NULL CHECK (kind IN ('bank','wallet','price','manual','csv'))` | no | kind |
| connection | `connection text NOT NULL CHECK (connection IN ('connected','disconnected','revoked'))` | no | connection |
| last_attempt | `last_attempt timestamptz` | yes | last attempt |
| last_success | `last_success timestamptz` | yes | last success |
| error_code | `error_code text` | yes | error code |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`.

## instruments
Boundary: identity/public catalogue/ops service; grants explicit. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| symbol | `symbol text NOT NULL` | no | symbol |
| exchange | `exchange text NOT NULL` | no | exchange |
| currency | `currency text NOT NULL CHECK (currency='VND')` | no | currency |
| unit | `unit text NOT NULL CHECK (unit='share')` | no | unit |
| active_from | `active_from date NOT NULL` | no | active from |
| active_to | `active_to date` | yes | active to |
| supported | `supported boolean NOT NULL DEFAULT false` | no | supported |

Constraints: `UNIQUE (exchange,symbol,active_from)`.

## gold_profiles
Boundary: identity/public catalogue/ops service; grants explicit. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| product | `product text NOT NULL` | no | product |
| purity | `purity text NOT NULL` | no | purity |
| brand | `brand text NOT NULL` | no | brand |
| region | `region text NOT NULL` | no | region |
| source_ref | `source_ref text NOT NULL` | no | source ref |
| side | `side text NOT NULL CHECK (side IN ('buy','sell'))` | no | side |
| currency | `currency text NOT NULL CHECK (currency='VND')` | no | currency |
| unit | `unit text NOT NULL CHECK (unit='chi')` | no | unit |

Constraints: .

## holdings
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| kind | `kind text NOT NULL CHECK (kind IN ('stock','gold'))` | no | kind |
| instrument_id | `instrument_id text REFERENCES fw.instruments(id)` | yes | instrument id |
| gold_profile_id | `gold_profile_id text REFERENCES fw.gold_profiles(id)` | yes | gold profile id |
| name | `name text NOT NULL` | no | name |
| cost | `cost numeric(18,0) CHECK (cost>=0)` | yes | cost |
| cost_date | `cost_date date` | yes | cost date |
| profile_confirmed_version | `profile_confirmed_version bigint` | yes | profile confirmed version |
| archived | `archived boolean NOT NULL DEFAULT false` | no | archived |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `CHECK ((kind='stock' AND instrument_id IS NOT NULL AND gold_profile_id IS NULL) OR (kind='gold' AND gold_profile_id IS NOT NULL AND instrument_id IS NULL))`.

## events
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| kind | `kind text NOT NULL CHECK (kind IN ('opening','income','expense','transfer','refund','investment','adjustment','unknown','reversal'))` | no | kind |
| amount | `amount numeric(18,0) NOT NULL CHECK (amount>0)` | no | amount |
| business_date | `business_date date NOT NULL` | no | business date |
| account_id | `account_id text NOT NULL` | no | account id |
| to_account_id | `to_account_id text` | yes | to account id |
| holding_id | `holding_id text` | yes | holding id |
| origin_id | `origin_id text` | yes | origin id |
| reversal_of | `reversal_of text` | yes | reversal of |
| category | `category text NOT NULL` | no | category |
| description | `description text NOT NULL` | no | description |
| posting | `posting text NOT NULL CHECK (posting IN ('draft','pending','posted'))` | no | posting |
| manual_category_override | `manual_category_override boolean NOT NULL DEFAULT false` | no | manual category override |
| reference | `reference text` | yes | reference |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `CHECK (account_id IS DISTINCT FROM to_account_id)`; `CHECK (kind<>'transfer' OR to_account_id IS NOT NULL)`; `UNIQUE (workspace_id,reversal_of)`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,to_account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,origin_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,reversal_of) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `events_period` (workspace_id,business_date DESC,id DESC): listTransactions stable date/id + period; predicate all rows.
Index `events_account` (workspace_id,account_id,business_date,id): account history and scoped flow; predicate all rows.

## entry_groups
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| event_id | `event_id text NOT NULL` | no | event id |
| reversal_of | `reversal_of text` | yes | reversal of |
| committed_at | `committed_at timestamptz NOT NULL DEFAULT now()` | no | committed at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,event_id)`; `UNIQUE (workspace_id,reversal_of)`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,reversal_of) REFERENCES fw.entry_groups(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## posting_lines
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| group_id | `group_id text NOT NULL` | no | group id |
| ledger_account_id | `ledger_account_id text NOT NULL` | no | ledger account id |
| signed_amount | `signed_amount numeric(18,0) NOT NULL CHECK (signed_amount<>0)` | no | signed amount |
| currency | `currency text NOT NULL DEFAULT 'VND' CHECK (currency='VND')` | no | currency |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,group_id) REFERENCES fw.entry_groups(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,ledger_account_id) REFERENCES fw.ledger_accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `lines_balance` (workspace_id,ledger_account_id,group_id): account signed balance, group validation; predicate all rows.

## holding_movements
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| holding_id | `holding_id text NOT NULL` | no | holding id |
| event_id | `event_id text` | yes | event id |
| business_date | `business_date date NOT NULL` | no | business date |
| quantity | `quantity numeric(28,8) NOT NULL CHECK (quantity>=0)` | no | quantity |
| delta | `delta numeric(28,8)` | yes | delta |
| kind | `kind text NOT NULL CHECK (kind IN ('declaration','investment','correction'))` | no | kind |
| reason | `reason text NOT NULL` | no | reason |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `movement_asof` (workspace_id,holding_id,business_date DESC,id): quantity at historical date; predicate all rows.

## provider_entitlements
Boundary: workspace owner. Retention: entitlement lifecycle; refs only, no credentials.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| provider_id | `provider_id text NOT NULL` | no | provider id |
| rights_version | `rights_version text NOT NULL` | no | rights version |
| credential_ref | `credential_ref text` | yes | credential ref |
| quota_daily | `quota_daily integer NOT NULL CHECK (quota_daily>=0)` | no | quota daily |
| allowed_assets | `allowed_assets jsonb NOT NULL CHECK (jsonb_typeof(allowed_assets)='array') CHECK (allowed_assets IS NULL OR (jsonb_typeof(allowed_assets)='array' AND octet_length(allowed_assets::text)<=262144))` | no | allowed assets |
| cache_scope | `cache_scope text NOT NULL` | no | cache scope |
| expires_at | `expires_at timestamptz` | yes | expires at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`.

## quote_observations
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| holding_id | `holding_id text NOT NULL` | no | holding id |
| entitlement_id | `entitlement_id text NOT NULL` | no | entitlement id |
| provider_id | `provider_id text NOT NULL` | no | provider id |
| price | `price numeric(28,8) NOT NULL CHECK (price>0)` | no | price |
| currency | `currency text NOT NULL CHECK (currency IN ('VND','USD'))` | no | currency |
| unit | `unit text NOT NULL CHECK (unit IN ('share','chi','luong'))` | no | unit |
| side | `side text NOT NULL CHECK (side IN ('buy','sell','close'))` | no | side |
| quote_as_of | `quote_as_of timestamptz NOT NULL` | no | quote as of |
| fetched_at | `fetched_at timestamptz NOT NULL` | no | fetched at |
| fx_vnd_per_usd | `fx_vnd_per_usd numeric(28,8) CHECK (fx_vnd_per_usd>0)` | yes | fx vnd per usd |
| fx_at | `fx_at timestamptz` | yes | fx at |
| fingerprint | `fingerprint text NOT NULL` | no | fingerprint |
| quality | `quality text NOT NULL CHECK (quality IN ('fresh','stale','unknown'))` | no | quality |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,holding_id,provider_id,fingerprint)`; `FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,entitlement_id) REFERENCES fw.provider_entitlements(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `quotes_asof` (workspace_id,holding_id,quote_as_of DESC,id): latest compatible observation <= report asOf; predicate all rows.

## evidence
Boundary: workspace owner. Retention: normalized payload 90d; evidence identity/digest for ledger lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| source_id | `source_id text` | yes | source id |
| kind | `kind text NOT NULL` | no | kind |
| recorded_at | `recorded_at timestamptz NOT NULL` | no | recorded at |
| observed_date | `observed_date date` | yes | observed date |
| reference | `reference text` | yes | reference |
| content | `content jsonb CHECK (content IS NULL OR (jsonb_typeof(content)='object' AND octet_length(content::text)<=262144))` | yes | content |
| content_digest | `content_digest text NOT NULL CHECK (content_digest ~ '^[a-f0-9]{64}$')` | no | content digest |
| schema_ref | `schema_ref text NOT NULL` | no | schema ref |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## event_evidence
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| event_id | `event_id text NOT NULL` | no | event id |
| evidence_id | `evidence_id text NOT NULL` | no | evidence id |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,event_id,evidence_id)`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## source_records
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| source_id | `source_id text NOT NULL` | no | source id |
| source_record_key | `source_record_key text NOT NULL` | no | source record key |
| revision | `revision bigint NOT NULL CHECK (revision>=0)` | no | revision |
| parser_version | `parser_version text NOT NULL` | no | parser version |
| mapping_version | `mapping_version bigint NOT NULL` | no | mapping version |
| evidence_id | `evidence_id text NOT NULL` | no | evidence id |
| event_id | `event_id text` | yes | event id |
| status | `status text NOT NULL CHECK (status IN ('staged','invalid','duplicate','linked'))` | no | status |
| manual_override | `manual_override jsonb CHECK (manual_override IS NULL OR (jsonb_typeof(manual_override)='object' AND octet_length(manual_override::text)<=262144))` | yes | manual override |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,source_id,source_record_key,revision)`; `FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## reviews
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| event_id | `event_id text` | yes | event id |
| holding_id | `holding_id text` | yes | holding id |
| account_id | `account_id text` | yes | account id |
| type | `type text NOT NULL CHECK (type IN ('cash','duplicate','invalid','transfer','refund','quality','category','pending'))` | no | type |
| status | `status text NOT NULL CHECK (status IN ('open','resolved'))` | no | status |
| title | `title text NOT NULL` | no | title |
| variance | `variance numeric(18,0)` | yes | variance |
| observed | `observed numeric(18,0)` | yes | observed |
| resolution | `resolution jsonb CHECK (resolution IS NULL OR (jsonb_typeof(resolution)='object' AND octet_length(resolution::text)<=262144))` | yes | resolution |
| resolved_at | `resolved_at timestamptz` | yes | resolved at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `review_open` (workspace_id,status,created_at DESC,id): Review inbox; predicate all rows.

## cash_observations
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| account_id | `account_id text NOT NULL` | no | account id |
| observed | `observed numeric(18,0) NOT NULL CHECK (observed>=0)` | no | observed |
| as_of | `as_of timestamptz NOT NULL` | no | as of |
| matched_workspace_version | `matched_workspace_version bigint NOT NULL` | no | matched workspace version |
| variance | `variance numeric(18,0) NOT NULL` | no | variance |
| review_id | `review_id text` | yes | review id |
| evidence_id | `evidence_id text NOT NULL` | no | evidence id |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,review_id) REFERENCES fw.reviews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## collector_bindings
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| device_id | `device_id text NOT NULL` | no | device id |
| account_id | `account_id text NOT NULL` | no | account id |
| package_name | `package_name text NOT NULL` | no | package name |
| parser_profile_id | `parser_profile_id text NOT NULL` | no | parser profile id |
| consent_at | `consent_at timestamptz NOT NULL` | no | consent at |
| enabled | `enabled boolean NOT NULL DEFAULT true` | no | enabled |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,device_id,id)`; `FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `binding_live` (workspace_id,device_id,package_name,account_id): unique active mapping; no owner retarget; predicate enabled.

## ingestion_receipts
Boundary: workspace owner. Retention: payload 90d; identity/digest tombstone until workspace erasure.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| device_id | `device_id text NOT NULL` | no | device id |
| binding_id | `binding_id text NOT NULL` | no | binding id |
| binding_version | `binding_version bigint NOT NULL` | no | binding version |
| event_key | `event_key text NOT NULL` | no | event key |
| revision | `revision bigint NOT NULL CHECK (revision>=0)` | no | revision |
| source_key | `source_key text NOT NULL` | no | source key |
| observed_at | `observed_at timestamptz NOT NULL` | no | observed at |
| received_at | `received_at timestamptz NOT NULL DEFAULT now()` | no | received at |
| parser_version | `parser_version text NOT NULL` | no | parser version |
| payload_digest | `payload_digest text NOT NULL CHECK (payload_digest ~ '^[a-f0-9]{64}$')` | no | payload digest |
| normalized_evidence | `normalized_evidence jsonb CHECK (normalized_evidence IS NULL OR (jsonb_typeof(normalized_evidence)='object' AND octet_length(normalized_evidence::text)<=262144))` | yes | normalized evidence |
| state | `state text NOT NULL CHECK (state IN ('received','parsed','posted','needs_review','ignored','failed'))` | no | state |
| event_id | `event_id text` | yes | event id |
| review_id | `review_id text` | yes | review id |
| error_code | `error_code text` | yes | error code |
| ack_at | `ack_at timestamptz` | yes | ack at |
| lease_until | `lease_until timestamptz` | yes | lease until |
| lease_token | `lease_token text` | yes | lease token |
| attempts | `attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3)` | no | attempts |
| next_attempt | `next_attempt timestamptz NOT NULL DEFAULT now()` | no | next attempt |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,device_id,event_key,revision)`; `CHECK (state<>'posted' OR event_id IS NOT NULL)`; `CHECK (state<>'needs_review' OR review_id IS NOT NULL)`; `FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,binding_id) REFERENCES fw.collector_bindings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,review_id) REFERENCES fw.reviews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `receipt_poll` (workspace_id,device_id,created_at DESC,id): device receipts cursor; predicate all rows.
Index `receipt_pending` (workspace_id,created_at,id): ingestion dispatcher; predicate state IN ('received','parsed').

## receipt_evidence
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| receipt_id | `receipt_id text NOT NULL` | no | receipt id |
| evidence_id | `evidence_id text NOT NULL` | no | evidence id |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,receipt_id,evidence_id)`; `FOREIGN KEY (workspace_id,receipt_id) REFERENCES fw.ingestion_receipts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,evidence_id) REFERENCES fw.evidence(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## coverage_gaps
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| account_id | `account_id text NOT NULL` | no | account id |
| source_id | `source_id text` | yes | source id |
| device_id | `device_id text` | yes | device id |
| start_at | `start_at timestamptz NOT NULL` | no | start at |
| end_at | `end_at timestamptz` | yes | end at |
| reason | `reason text NOT NULL` | no | reason |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `CHECK (end_at IS NULL OR end_at>=start_at)`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,source_id) REFERENCES fw.sources(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,device_id) REFERENCES fw.devices(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## refresh_jobs
Boundary: workspace owner. Retention: result payload 90d; dedupe identities workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| entitlement_id | `entitlement_id text NOT NULL` | no | entitlement id |
| dedupe_key | `dedupe_key text NOT NULL` | no | dedupe key |
| business_date | `business_date date NOT NULL` | no | business date |
| trigger_kind | `trigger_kind text NOT NULL` | no | trigger kind |
| state | `state text NOT NULL CHECK (state IN ('queued','running','succeeded','partial','failed','rate_limited'))` | no | state |
| attempts | `attempts integer NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 3)` | no | attempts |
| next_attempt | `next_attempt timestamptz NOT NULL DEFAULT now()` | no | next attempt |
| lease_until | `lease_until timestamptz` | yes | lease until |
| lease_token | `lease_token text` | yes | lease token |
| result | `result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | yes | result |
| error_code | `error_code text` | yes | error code |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,dedupe_key)`; `FOREIGN KEY (workspace_id,entitlement_id) REFERENCES fw.provider_entitlements(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `refresh_due` (next_attempt,lease_until): SKIP LOCKED due jobs; service role only; predicate state IN ('queued','running','rate_limited').

## import_previews
Boundary: workspace owner. Retention: staged CSV normalized rows 24h; raw CSV memory only.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| account_id | `account_id text NOT NULL` | no | account id |
| file_digest | `file_digest text NOT NULL CHECK (file_digest ~ '^[a-f0-9]{64}$')` | no | file digest |
| mapping_digest | `mapping_digest text NOT NULL CHECK (mapping_digest ~ '^[a-f0-9]{64}$')` | no | mapping digest |
| profile_version | `profile_version text NOT NULL` | no | profile version |
| mapping_version | `mapping_version bigint NOT NULL` | no | mapping version |
| rows | `rows jsonb NOT NULL CHECK (rows IS NULL OR (jsonb_typeof(rows)='array' AND octet_length(rows::text)<=262144))` | no | rows |
| expected_workspace_version | `expected_workspace_version bigint NOT NULL` | no | expected workspace version |
| expires_at | `expires_at timestamptz NOT NULL` | no | expires at |
| token_digest | `token_digest text NOT NULL UNIQUE` | no | token digest |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## import_jobs
Boundary: workspace owner. Retention: result 90d; identity tombstone remains.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| preview_id | `preview_id text NOT NULL` | no | preview id |
| account_id | `account_id text NOT NULL` | no | account id |
| selected_row_ids | `selected_row_ids jsonb NOT NULL CHECK (selected_row_ids IS NULL OR (jsonb_typeof(selected_row_ids)='array' AND octet_length(selected_row_ids::text)<=262144))` | no | selected row ids |
| state | `state text NOT NULL CHECK (state IN ('pending','running','completed','failed'))` | no | state |
| result | `result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | yes | result |
| error_code | `error_code text` | yes | error code |
| lease_until | `lease_until timestamptz` | yes | lease until |
| lease_token | `lease_token text` | yes | lease token |
| attempts | `attempts integer NOT NULL DEFAULT 0` | no | attempts |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,preview_id)`; `FOREIGN KEY (workspace_id,preview_id) REFERENCES fw.import_previews(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## snapshots
Boundary: workspace owner. Retention: frozen refs for histories; projection cache 30d, reconstruct or OUTSIDE_SNAPSHOT.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| financial_version | `financial_version bigint NOT NULL` | no | financial version |
| as_of | `as_of timestamptz NOT NULL` | no | as of |
| refs | `refs jsonb NOT NULL CHECK (refs IS NULL OR (jsonb_typeof(refs)='object' AND octet_length(refs::text)<=262144))` | no | refs |
| schema_ref | `schema_ref text NOT NULL` | no | schema ref |
| projection | `projection jsonb NOT NULL CHECK (projection IS NULL OR (jsonb_typeof(projection)='object' AND octet_length(projection::text)<=262144))` | no | projection |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,financial_version)`.
Index `snapshots_asof` (workspace_id,as_of DESC): frozen report refs; predicate all rows.

## financial_plans
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| name | `name text NOT NULL` | no | name |
| horizon | `horizon date NOT NULL` | no | horizon |
| baseline_snapshot_id | `baseline_snapshot_id text NOT NULL` | no | baseline snapshot id |
| lifecycle | `lifecycle text NOT NULL CHECK (lifecycle IN ('active','archived'))` | no | lifecycle |
| assumptions | `assumptions jsonb NOT NULL CHECK (assumptions IS NULL OR (jsonb_typeof(assumptions)='array' AND octet_length(assumptions::text)<=262144))` | no | assumptions |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,baseline_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## plan_items
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| plan_id | `plan_id text` | yes | plan id |
| name | `name text NOT NULL` | no | name |
| kind | `kind text NOT NULL CHECK (kind IN ('income','expense','investment'))` | no | kind |
| amount | `amount numeric(18,0) NOT NULL CHECK (amount>0)` | no | amount |
| account_id | `account_id text NOT NULL` | no | account id |
| holding_id | `holding_id text` | yes | holding id |
| start_date | `start_date date NOT NULL` | no | start date |
| end_date | `end_date date NOT NULL` | no | end date |
| recurrence | `recurrence text NOT NULL CHECK (recurrence IN ('once','monthly'))` | no | recurrence |
| day_of_month | `day_of_month integer NOT NULL CHECK (day_of_month BETWEEN 1 AND 31)` | no | day of month |
| skip_months | `skip_months jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (skip_months IS NULL OR (jsonb_typeof(skip_months)='array' AND octet_length(skip_months::text)<=262144))` | no | skip months |
| category | `category text NOT NULL` | no | category |
| archived | `archived boolean NOT NULL DEFAULT false` | no | archived |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `CHECK (start_date<=end_date)`; `CHECK (kind<>'investment' OR holding_id IS NOT NULL)`; `FOREIGN KEY (workspace_id,plan_id) REFERENCES fw.financial_plans(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,holding_id) REFERENCES fw.holdings(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## actual_links
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| plan_item_id | `plan_item_id text NOT NULL` | no | plan item id |
| plan_item_version | `plan_item_version bigint NOT NULL` | no | plan item version |
| plan_version | `plan_version bigint NOT NULL` | no | plan version |
| occurrence_id | `occurrence_id text NOT NULL` | no | occurrence id |
| event_id | `event_id text NOT NULL` | no | event id |
| event_version | `event_version bigint NOT NULL` | no | event version |
| reason | `reason text NOT NULL` | no | reason |
| released_at | `released_at timestamptz` | yes | released at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,plan_item_id) REFERENCES fw.plan_items(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,event_id) REFERENCES fw.events(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `actual_unique_active` (workspace_id,plan_version,event_id): one event per plan version; unique; predicate released_at IS NULL.

## goals
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| name | `name text NOT NULL` | no | name |
| target | `target numeric(18,0) NOT NULL CHECK (target>0)` | no | target |
| due | `due date NOT NULL` | no | due |
| status | `status text NOT NULL CHECK (status IN ('active','achieved','archived'))` | no | status |
| contribution_schedule | `contribution_schedule jsonb CHECK (contribution_schedule IS NULL OR (jsonb_typeof(contribution_schedule)='object' AND octet_length(contribution_schedule::text)<=262144))` | yes | contribution schedule |
| projection | `projection jsonb CHECK (projection IS NULL OR (jsonb_typeof(projection)='object' AND octet_length(projection::text)<=262144))` | yes | projection |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`.
Index `goal_status` (workspace_id,status,id): Goals pages; predicate all rows.

## plan_goal_links
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| plan_item_id | `plan_item_id text NOT NULL` | no | plan item id |
| plan_item_version | `plan_item_version bigint NOT NULL` | no | plan item version |
| goal_id | `goal_id text NOT NULL` | no | goal id |
| goal_version | `goal_version bigint NOT NULL` | no | goal version |
| role | `role text NOT NULL` | no | role |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,plan_item_id,plan_item_version,goal_id)`; `FOREIGN KEY (workspace_id,plan_item_id) REFERENCES fw.plan_items(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## goal_allocations
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| goal_id | `goal_id text NOT NULL` | no | goal id |
| account_id | `account_id text NOT NULL` | no | account id |
| amount | `amount numeric(18,0) NOT NULL CHECK (amount>0)` | no | amount |
| business_date | `business_date date NOT NULL` | no | business date |
| active | `active boolean NOT NULL DEFAULT true` | no | active |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,account_id) REFERENCES fw.accounts(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `allocation_active` (workspace_id,account_id,goal_id): sum earmarks across goals under account lock; predicate active.

## simulations
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| goal_id | `goal_id text` | yes | goal id |
| base_snapshot_id | `base_snapshot_id text NOT NULL` | no | base snapshot id |
| frozen_inputs | `frozen_inputs jsonb NOT NULL CHECK (frozen_inputs IS NULL OR (jsonb_typeof(frozen_inputs)='object' AND octet_length(frozen_inputs::text)<=262144))` | no | frozen inputs |
| result | `result jsonb NOT NULL CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | no | result |
| schema_ref | `schema_ref text NOT NULL` | no | schema ref |
| state | `state text NOT NULL CHECK (state IN ('ready','failed'))` | no | state |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,goal_id) REFERENCES fw.goals(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## conversations
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| title | `title text NOT NULL` | no | title |
| lifecycle | `lifecycle text NOT NULL CHECK (lifecycle IN ('active','archived'))` | no | lifecycle |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`.

## messages
Boundary: workspace owner. Retention: owner history lifecycle; purge on explicit erasure, backup window applies.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| conversation_id | `conversation_id text NOT NULL` | no | conversation id |
| text | `text text NOT NULL` | no | text |
| captured_context | `captured_context jsonb NOT NULL CHECK (captured_context IS NULL OR (jsonb_typeof(captured_context)='object' AND octet_length(captured_context::text)<=262144))` | no | captured context |
| processing_kind | `processing_kind text NOT NULL CHECK (processing_kind IN ('rule','single_tool','agent','scripted'))` | no | processing kind |
| state | `state text NOT NULL CHECK (state IN ('queued','processing','completed','failed','cancelled'))` | no | state |
| result | `result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | yes | result |
| agent_run_id | `agent_run_id text` | yes | agent run id |
| planning_draft_id | `planning_draft_id text` | yes | planning draft id |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `messages_history` (workspace_id,conversation_id,created_at DESC,id DESC): shared history keyset pagination; predicate all rows.

## agent_runs
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| conversation_id | `conversation_id text NOT NULL` | no | conversation id |
| base_snapshot_id | `base_snapshot_id text NOT NULL` | no | base snapshot id |
| intent | `intent text NOT NULL CHECK (intent IN ('goal','plan','investigation'))` | no | intent |
| state | `state text NOT NULL CHECK (state IN ('queued','reading','awaiting_user','simulating','draft_ready','completed','partial','failed','cancelled'))` | no | state |
| question_id | `question_id text` | yes | question id |
| constraints | `constraints jsonb NOT NULL CHECK (constraints IS NULL OR (jsonb_typeof(constraints)='object' AND octet_length(constraints::text)<=262144))` | no | constraints |
| settings | `settings jsonb NOT NULL CHECK (settings IS NULL OR (jsonb_typeof(settings)='object' AND octet_length(settings::text)<=262144))` | no | settings |
| active_millis | `active_millis integer NOT NULL DEFAULT 0 CHECK (active_millis BETWEEN 0 AND 60000)` | no | active millis |
| tool_calls | `tool_calls integer NOT NULL DEFAULT 0 CHECK (tool_calls BETWEEN 0 AND 8)` | no | tool calls |
| clarifications | `clarifications integer NOT NULL DEFAULT 0 CHECK (clarifications BETWEEN 0 AND 2)` | no | clarifications |
| lease_until | `lease_until timestamptz` | yes | lease until |
| lease_token | `lease_token text` | yes | lease token |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## planning_drafts
Boundary: workspace owner. Retention: unconfirmed 30d; confirmed refs workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| conversation_id | `conversation_id text NOT NULL` | no | conversation id |
| run_id | `run_id text` | yes | run id |
| base_snapshot_id | `base_snapshot_id text NOT NULL` | no | base snapshot id |
| state | `state text NOT NULL CHECK (state IN ('draft','previewed','confirmed','superseded','expired'))` | no | state |
| body | `body jsonb NOT NULL CHECK (body IS NULL OR (jsonb_typeof(body)='object' AND octet_length(body::text)<=262144))` | no | body |
| schema_ref | `schema_ref text NOT NULL` | no | schema ref |
| confirmed_ids | `confirmed_ids jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (confirmed_ids IS NULL OR (jsonb_typeof(confirmed_ids)='array' AND octet_length(confirmed_ids::text)<=262144))` | no | confirmed ids |
| expires_at | `expires_at timestamptz NOT NULL` | no | expires at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,conversation_id) REFERENCES fw.conversations(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.
Index `draft_owner_state` (workspace_id,state,created_at DESC,id): draft list and expiry; predicate all rows.

## tool_results
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| run_id | `run_id text` | yes | run id |
| message_id | `message_id text` | yes | message id |
| base_snapshot_id | `base_snapshot_id text NOT NULL` | no | base snapshot id |
| tool_name | `tool_name text NOT NULL` | no | tool name |
| result | `result jsonb NOT NULL CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | no | result |
| schema_ref | `schema_ref text NOT NULL` | no | schema ref |
| evidence_refs | `evidence_refs jsonb NOT NULL CHECK (evidence_refs IS NULL OR (jsonb_typeof(evidence_refs)='array' AND octet_length(evidence_refs::text)<=262144))` | no | evidence refs |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `FOREIGN KEY (workspace_id,run_id) REFERENCES fw.agent_runs(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,message_id) REFERENCES fw.messages(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`; `FOREIGN KEY (workspace_id,base_snapshot_id) REFERENCES fw.snapshots(workspace_id,id) DEFERRABLE INITIALLY DEFERRED`.

## version_history
Boundary: workspace owner. Retention: workspace lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| object_type | `object_type text NOT NULL` | no | object type |
| object_id | `object_id text NOT NULL` | no | object id |
| object_version | `object_version bigint NOT NULL` | no | object version |
| payload | `payload jsonb NOT NULL CHECK (payload IS NULL OR (jsonb_typeof(payload)='object' AND octet_length(payload::text)<=262144))` | no | payload |
| schema_ref | `schema_ref text NOT NULL` | no | schema ref |
| reason | `reason text NOT NULL` | no | reason |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,object_type,object_id,object_version)`.

## proposal_previews
Boundary: workspace owner. Retention: expired 24h; result identities in idempotency.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| subject_id | `subject_id text NOT NULL REFERENCES fw.identities(id)` | no | subject id |
| operation_id | `operation_id text NOT NULL` | no | operation id |
| object_id | `object_id text` | yes | object id |
| digest | `digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$')` | no | digest |
| base_versions | `base_versions jsonb NOT NULL CHECK (base_versions IS NULL OR (jsonb_typeof(base_versions)='object' AND octet_length(base_versions::text)<=262144))` | no | base versions |
| changes | `changes jsonb NOT NULL CHECK (changes IS NULL OR (jsonb_typeof(changes)='object' AND octet_length(changes::text)<=262144))` | no | changes |
| token_digest | `token_digest text NOT NULL UNIQUE` | no | token digest |
| expires_at | `expires_at timestamptz NOT NULL` | no | expires at |
| consumed_at | `consumed_at timestamptz` | yes | consumed at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`.

## idempotency_records
Boundary: workspace owner. Retention: result body 90d, identity/digest/ref tombstone until workspace erasure.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| workspace_id | `workspace_id text NOT NULL` | no | workspace id |
| id | `id text NOT NULL` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| principal_id | `principal_id text NOT NULL` | no | principal id |
| operation_id | `operation_id text NOT NULL` | no | operation id |
| key | `key text NOT NULL` | no | key |
| payload_digest | `payload_digest text NOT NULL CHECK (payload_digest ~ '^[a-f0-9]{64}$')` | no | payload digest |
| result_ref | `result_ref text NOT NULL` | no | result ref |
| result | `result jsonb CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | yes | result |
| committed_at | `committed_at timestamptz NOT NULL DEFAULT now()` | no | committed at |

Constraints: `PRIMARY KEY (workspace_id,id)`; `FOREIGN KEY (workspace_id) REFERENCES fw.workspaces(id)`; `UNIQUE (workspace_id,principal_id,operation_id,key)`.

## ops_accounts
Boundary: identity/public catalogue/ops service; grants explicit. Retention: support metadata lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| subject_token | `subject_token text NOT NULL` | no | subject token |
| workspace_token | `workspace_token text NOT NULL` | no | workspace token |
| state | `state text NOT NULL CHECK (state IN ('active','suspended'))` | no | state |
| device_health | `device_health jsonb NOT NULL CHECK (device_health IS NULL OR (jsonb_typeof(device_health)='array' AND octet_length(device_health::text)<=262144))` | no | device health |

Constraints: .

## ops_sources
Boundary: identity/public catalogue/ops service; grants explicit. Retention: source lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| name | `name text NOT NULL` | no | name |
| package_name | `package_name text NOT NULL` | no | package name |
| parser_version | `parser_version text NOT NULL` | no | parser version |
| compatibility | `compatibility text NOT NULL` | no | compatibility |
| state | `state text NOT NULL CHECK (state IN ('enabled','disabled','degraded'))` | no | state |
| binding_count | `binding_count integer NOT NULL CHECK (binding_count>=0)` | no | binding count |
| last_success | `last_success timestamptz` | yes | last success |
| error_code | `error_code text` | yes | error code |

Constraints: .

## ops_jobs
Boundary: identity/public catalogue/ops service; grants explicit. Retention: metadata 90d.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| source_id | `source_id text NOT NULL` | no | source id |
| job_type | `job_type text NOT NULL CHECK (job_type IN ('price_refresh','ingestion','sync','import','agent'))` | no | job type |
| state | `state text NOT NULL CHECK (state IN ('queued','running','failed','succeeded','paused'))` | no | state |
| attempts | `attempts integer NOT NULL DEFAULT 0` | no | attempts |
| lease_until | `lease_until timestamptz` | yes | lease until |
| lease_token | `lease_token text` | yes | lease token |
| next_attempt | `next_attempt timestamptz NOT NULL DEFAULT now()` | no | next attempt |
| error_code | `error_code text` | yes | error code |
| request_id | `request_id text NOT NULL` | no | request id |

Constraints: .
Index `ops_due` (next_attempt,lease_until): scheduler due metadata; predicate state IN ('queued','running').

## ops_quotas
Boundary: identity/public catalogue/ops service; grants explicit. Retention: 30d.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| name | `name text NOT NULL` | no | name |
| used | `used bigint NOT NULL CHECK (used>=0)` | no | used |
| limit_value | `limit_value bigint NOT NULL CHECK (limit_value>=0)` | no | limit value |
| reset_at | `reset_at timestamptz NOT NULL` | no | reset at |
| cooldown_until | `cooldown_until timestamptz` | yes | cooldown until |

Constraints: .

## ops_releases
Boundary: identity/public catalogue/ops service; grants explicit. Retention: release lifecycle.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| version_name | `version_name text NOT NULL` | no | version name |
| channel | `channel text NOT NULL` | no | channel |
| published_at | `published_at timestamptz` | yes | published at |
| artifact_url | `artifact_url text` | yes | artifact url |
| sha256 | `sha256 text` | yes | sha256 |
| signing_fingerprint | `signing_fingerprint text` | yes | signing fingerprint |
| compatibility | `compatibility text NOT NULL` | no | compatibility |
| test_state | `test_state text NOT NULL CHECK (test_state IN ('not_run','passed','failed'))` | no | test state |

Constraints: .

## ops_incidents
Boundary: identity/public catalogue/ops service; grants explicit. Retention: 90d.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| severity | `severity text NOT NULL CHECK (severity IN ('info','warning','critical'))` | no | severity |
| source_id | `source_id text` | yes | source id |
| code | `code text NOT NULL` | no | code |
| state | `state text NOT NULL CHECK (state IN ('open','resolved'))` | no | state |

Constraints: .

## ops_previews
Boundary: identity/public catalogue/ops service; grants explicit. Retention: 24h.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| version | `version bigint NOT NULL DEFAULT 1 CHECK (version > 0)` | no | version |
| updated_at | `updated_at timestamptz NOT NULL DEFAULT now()` | no | updated at |
| subject_id | `subject_id text NOT NULL` | no | subject id |
| action | `action text NOT NULL` | no | action |
| object_id | `object_id text NOT NULL` | no | object id |
| expected_version | `expected_version bigint NOT NULL` | no | expected version |
| reason_code | `reason_code text NOT NULL` | no | reason code |
| digest | `digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$')` | no | digest |
| token_digest | `token_digest text NOT NULL UNIQUE` | no | token digest |
| expires_at | `expires_at timestamptz NOT NULL` | no | expires at |

Constraints: .

## ops_idempotency
Boundary: identity/public catalogue/ops service; grants explicit. Retention: 90d plus dedupe tombstone.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| subject_id | `subject_id text NOT NULL` | no | subject id |
| operation_id | `operation_id text NOT NULL` | no | operation id |
| key | `key text NOT NULL` | no | key |
| digest | `digest text NOT NULL CHECK (digest ~ '^[a-f0-9]{64}$')` | no | digest |
| result | `result jsonb NOT NULL CHECK (result IS NULL OR (jsonb_typeof(result)='object' AND octet_length(result::text)<=262144))` | no | result |

Constraints: .
Index `ops_replay` (subject_id,operation_id,key): unique admin request replay; predicate all rows.

## ops_audit
Boundary: identity/public catalogue/ops service; grants explicit. Retention: 180d synthetic; real retention pending policy.
| Column | PostgreSQL declaration | Nullable | Meaning |
| --- | --- | --- | --- |
| id | `id text PRIMARY KEY` | no | id |
| created_at | `created_at timestamptz NOT NULL DEFAULT now()` | no | created at |
| actor_id | `actor_id text NOT NULL` | no | actor id |
| action | `action text NOT NULL CHECK (action IN ('retry_job','disable_source'))` | no | action |
| object_id | `object_id text NOT NULL` | no | object id |
| reason_code | `reason_code text NOT NULL` | no | reason code |
| from_version | `from_version bigint NOT NULL` | no | from version |
| to_version | `to_version bigint NOT NULL` | no | to version |
| result | `result text NOT NULL CHECK (result IN ('succeeded','failed','denied'))` | no | result |
| request_id | `request_id text NOT NULL` | no | request id |

Constraints: .
