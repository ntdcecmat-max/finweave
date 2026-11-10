# FinWeave Async/Sources local runtime

13/10 recovery update: see [current execution report](../docs/execution/backend-async-recovery-2026-10-13.md). The existing observation cluster has migrations 001–011. Startup now checks exact installed checksums, worker role readiness and the narrow Ops broker grant before launch, waits for both processes to be ready, and binds their loaded source/Node hash to samples. A code change reloads a verified idle worker; an active job requires draining before reload. This check never migrates or grants permissions automatically.

Seven-day qualification uses a rolling seven-day window of healthy, same-source samples: at least eight local dates, gaps at most 26h, no failed/missed/overdue/missing coverage, and both worker code hashes matching. Original startedAt and every old unhealthy/source-changed sample stay intact. Quote freshness is a separate flag; fixed stub observations can correctly remain stale. Seven elapsed days from the original start alone cannot qualify the current release after a failure or code change.

Each new observation sample checks both worker PID/start-time pairs, readiness and stderr size. Run with the process/DB permissions used at setup: a sandbox-hidden process is not proof that the worker exited. Immutable stub fixtures become stale after 36 hours; refresh must preserve their original quoteAsOf.

BE-07/08/17 local synthetic slice, API005 / native bridge003 pinned. Provider and Android are simulated; REAL mode remains disabled. Migration 006 extends the executable local runtime and does not modify the sealed target DB005 or earlier migrations.

Run from this directory with Node 24.19.0 and the existing pinned dependencies:

```powershell
node node_modules/typescript/bin/tsc --noEmit
node scripts/test-async.ts
node scripts/test-runtime.ts
node scripts/test-finance.ts
```

The fault suite creates a separate disposable PostgreSQL cluster, stops it in finally, and writes a uniquely named evidence JSON under docs/execution/evidence/backend-async-local-2026-10-09. It must never be pointed at the observation cluster.

The receipt pipeline uses the pinned ingestNotifications and reconcileReceipts envelopes, P-256 collector proof, current collector/device/consent/recovery guards, synthetic parser support and binding version. Receipt identity, digest, normalized evidence and queue job commit before HTTP 202. Same immutable identity reuses the receipt; a changed digest or capture epoch conflicts. Mixed ACKs pair eventKey/revision, all-rejected 422 has itemErrors, and reads never advance jobs. Explicit reference duplicates are ignored; ambiguous evidence creates a pending event/Review when possible. Existing preview/confirm Review operations update receipt and ledger in the same transaction. Incomplete evidence without a usable event remains Review for owner investigation; no value is guessed.

The encrypted outbox simulator persists only the native normalized DTO, checks the exact API schema and semantic redaction, binds ciphertext to workspace/device/epoch, retains unknown/malformed ACKs, limits batches/items/bytes and refuses expired items. This is a local transport emulator, not Room/Keystore/WorkManager or an Android permission/reboot/OEM test. Quarantine/OS cleanup, production native vault and collector renewal still belong to BE-20.

Queue claim, heartbeat, attempts, retry, cancel fencing and manual retry use narrow SQL ports. Locks follow recovery → identity → workspace → job → domain → sorted quota scopes. Reaping uses bounded candidate scans, expires prior attempts and persists backoff. Lease equality is expired. Profiles reserve at most two running jobs and a workspace at most three; the in-process supervisor executes one claimed job at a time. Receipt budgets are eight automatic attempts/seven days, price budgets five attempts/six hours. Active caps are 30s/60s; the local lease request ceiling is 30s. Manual retry adds at most two bounded base cycles, preserves attempts, deadline, identity and quota, and refuses committed/cancelled/permanent failures. The generic cancel port is an internal control operation; no public receipt/price cancel endpoint was invented. Agent/import/forecast domain adapters and their run budgets remain the responsibility of their respective BE modules; this change supplies shared queue mechanics, not those domain implementations.

Price admission freezes unique holding selection, profile, entitlement/source versions and trigger. Exact compatible active requests coalesce; same-key command replay precedes a 60s server cooldown. All partitions/children and their parent manifest enqueue atomically. A parent has no worker lease. Updated/retained/missing results cover the complete requested set. A missing provider mapping has an explicit missing/last-good result.

Only the stub adapter is registered. Real provider IDs are rejected by both runtime mode and entitlement table constraints; no vendor credentials, subscription or external calls are enabled. Each stub request also requires confirmed synthetic rights, a live source, expiry and known positive quota scopes. Reservations lock every shared-license/tenant scope together, persist a sent_unknown intent before the call, stay charged after crash/unknown response, and reserve again on a new attempt. Cooldown is scope-wide across daily windows. Current recovery fences revoke rights and deny unknown restored quota until explicit trusted reconciliation; a new UTC window or a fresh ticket alone cannot make old counters trustworthy.

Quotes preserve provider quoteAsOf and separate fetchedAt. Normalized observation fingerprints prevent repeated daily reads from inventing history. Publishing rechecks live ticket, recovery, source/rights/version and holding basis; invalid/nonpositive/future/incompatible quotes do not replace last-good. Valuation freshness and source freshness use quoteAsOf. Prices never change cash or quantity. This stub implements normalized VND share/chi observations; manual price/FX and exact conversions remain in the existing finance APIs. Vendor-specific SSI/gold/FX acquisition is not enabled or claimed verified.

Daily scheduling runs on the market host every 60s, due at 18:00 Asia/Ho_Chi_Minh. A multi-day outage enqueues the latest due occurrence once, records missed intervals, and commits the watermark with work. It does not label today's quote with past business dates. It scans all non-archived holdings and partitions them; no browser/mobile timer is needed.

Real-time observation is separate from fault tests:

```powershell
# Only the first time; refuses to replace existing state.
node scripts/setup-async-observation.ts
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-async-observation.ps1
node scripts/observe-async.ts
```

The saved observation state is .local/async-observation-state.json. Resume starts the same loopback cluster and preserves startedAt, receipts, attempts and quota counters. Hidden ingestion/market processes use separate non-superuser credentials. Secrets, DB files and native simulation keys stay under ignored .local; they are not evidence artifacts.

Samples are append-only records at docs/execution/evidence/backend-async-observation/samples.ndjson; latest.json is the current view. Ops reads counts/times only through fw_async.metrics(), with no account/ticker/evidence/entitlement identifiers. lastFetchedAt is the stored observation's fetch provenance; a later fetch of the identical observation can increment quota/schedule counters without adding or retimestamping the historical quote.

The Codex heartbeat **finweave-async-sources-daily-observation** samples daily at 18:10 Asia/Bangkok. It stays quiet unless there is a meaningful change, failure, required action or seven-day completion. Source refresh itself remains at 18:00 on the host. The machine and app must be available for the heartbeat; sleeping/offline time is a gap, not fabricated observation. Seven-day observation requires at least seven actual elapsed days, eight observed local dates and no sample gap over 26 hours. A true elapsed-time flag is not a claim that all runs were healthy; failed/missed/stale/coverage metrics must also be reviewed.

First observation start: **10/10/2026 00:21:28.222 Asia/Bangkok** (2026-10-09T17:21:28.222Z). Earliest seven elapsed days: **17/10/2026 00:21:28.222**. At setup only day zero was observed; seven days are **PENDING**, not accepted.
