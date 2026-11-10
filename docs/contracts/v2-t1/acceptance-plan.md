# ARCH-05 — Acceptance và conformance plan

08/10/2026 · structural validation có evidence riêng; mọi scenario runtime dưới đây **SPECIFIED / NOT RUN**. Request/reply examples là synthetic shape fixtures, không financial oracle. [Validation](../../execution/evidence/arch-05-t1-2026-10-08/validation.json) không thay backend/consumer/native/security/UAT acceptance.

| ID | Case cần chạy | Expected |
| --- | --- | --- |
| API05-01 | Build/revision/hash mismatch, prototype cùng2.0.0 | Refuse adapter cutover/fallback; giữ command pending khi reply không xác minh |
| API05-02 | Route/body operation mismatch; unknown fields/null/required/decimal/date/time | Structural/domain reject đúng safe error, no effect |
| API05-03 | OwnerA object/workspace/nested refB, forged role/context | Denied/no existence leak/no writes; pooled context không rò |
| API05-04 | DeviceBearer gọi getSession/listAccounts/confirmPlanningDraft | Denied ngay capability, không dựa UI ẩn nút |
| API05-05 | Owner native/session/refresh token dùng sai audience | Denied; refresh chỉ renewNativeSession; cookie không fallback trong native bearer flow |
| API05-06 | Admin cookie gọi finance; owner gọiOps; raw user data trong Ops DTO | Denied; output allowlist/no finance/prompt/evidence/impersonation |
| API05-07 | Wrong Origin/CORS/media/revision/CSRF, login CSRF/session fixation | Denied trước effect; cookie/session rotation và CSRF bound session |
| API05-08 | Native challenge wrong purpose/expired/consumed/race | No unauthorized token; retries short-lived protected replay đúngfamily |
| API05-09 | Concurrent refresh/response lost/reuse/logout/reset/revoke | One active family policy, revoke/recovery đúng; tokens không logs/WebView/replay90d |
| API05-10 | Collector wrong key/proof/device/nonce/epoch/consent | Denied, no owner change; consumed challenge cannot mint independent new credential |
| API05-11 | Receipt same identity/digest, changed digest, mixed/all rejected | Stable receipt IDs; no double effect; one paired ACK per item; all rejected422 |
| API05-12 | Revoke after accept before worker commit; old epoch afterrestore | Commit fenced; no automatic owner/epoch rebinding |
| API05-13 | Restore backup before durable ACK; reconcile missing/conflict | Independent latest revoke/delete journal applied; replay only originalauthorized identity; gaps explicit, no zero-loss claim |
| API05-14 | Command commit then lost response; samekeynewpayload | Replay original effect once;409different digest |
| API05-15 | Result body expires; getCommandOutcome/Ops outcome | REPLAY_EXPIRED outcome=committed; tombstone/ref retained; no reexecute/keymint/finance exposure toOps |
| API05-16 | Auth replay after credential/family revoked | No credential resurrection; current auth checked before replay |
| API05-17 | Preview expired/stale/payload changed and committed replay oldpreview | New stale command re-preview; alreadycommitted replay before freshness, no duplicate |
| API05-18 | Same occurrence/version numbers across Plans/standalone | Resolve scope+frozen revision/item; no fake input planVersion or cross-plan collision |
| API05-19 | Agent proposal/confirm attempts; owner Plan-only/multi-goal confirm | Agent draft-only; owner bundle atomic, no actual ledger writes |
| API05-20 | Money rounding/NaN/overflow/timezones/unknownmetrics | Independent decimal/calendar/ledger oracle; null not0 |
| API05-21 | Cursor drift/filter tamper; paginated report | Cursor invalid/restart; report fromconsistent snapshot, no page summation |
| API05-22 | Posted-group balanced append/retarget/correction/refund/allocations races | Seal/invariants/locks preserve actual correctness |
| API05-23 | Provider stale/profile change/missingFX/failure | Last-good/provenance/asOf honest; no cash/quantity changes |
| API05-24 | CSV bound/selectedduplicates/expired/cancel/crash | Stable row digests/IDs; selected-set atomic, Review ambiguity |
| API05-25 | Worker ticket wrong workspace/domain/type/generation/token/epoch | Denied; no crossdomain or late-worker effects |
| API05-26 | Service mTLS/signature/nonce/path/body/clock attacks | Private audience/capability denied; no public scheduler/retention |
| API05-27 | Import/receipt/market/Agent crash before/after effect and queue ACK | At-least-once delivery, idempotent domain effects, one lease authority |
| API05-28 | TTLcleanup pinned history/evidence/replay; unauthorizederasure | No broken pins/FKs; broadfinanceDELETE denied; erasure separate auditedworkflow |
| API05-29 | Browser/auth/admin/proxy caches and unsafeerror echo | no-store; no raw/token/password/OTP/prompt/finance inlogs orOps error |
| API05-30 | Fastify request+serializer dialect vs canonicalJSONSchema | Both validate2020-12/unions/formats/required/null; no default-compiler assumption |
| API05-31 | Fresh/upgrade/restore SQL + consumers fullregression | Targetcatalog/roles/domain/API align; frontend acceptance updated only afterreal integration |

Adapter fixtures cần input/output transformation assertions theo [fresh field diff](../../execution/evidence/arch-05-t1-2026-10-08/consumer-field-differences.json), không chỉ snapshot expected bằng chính implementation. Domain oracles/DB concurrency tests dùng authority độc lập. Native cases chạy signed APK/device matrix, không responsive browser simulation.
