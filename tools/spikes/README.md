# Local spike harness

Run from repository root with existing Node24.19.0:

```powershell
node tools/spikes/run-local.mjs
```

No dependencies/downloads. HTTP binds only127.0.0.1; sandbox may require a narrowly authorized execution. No real login/notification/provider/model is used. Each run preserves a new directory under `docs/execution/evidence/local-spikes/`, including failures, source hashes, runtime, expected/actual assertions, synthetic journals and concrete BLOCKED inputs. Exit1 indicates a failed experiment; BLOCKED real gates are not turned into PASS.

`local-core.mjs` is spike code, never a production auth/crypto/schema library. Canonicalization is limited to ordinary synthetic JSON and is not an RFC8785 certified implementation. The schema validator handles only explicitly listed keywords and fails on unsupported ones; production requires an audited pinned Draft2020 validator. Journal supports one synchronous writer, not multi-process concurrency or arbitrary truncated-tail recovery. Invalid/truncated JSON causes fail closed, not silent tail repair. Witness uses simplified receipts and same-host fsync, so it is not the production witness protocol or independence proof. AES-GCM test is not an age capsule. Outbox JSONL is not Room. Resource timing is validator overhead only, never model inference latency.

Source/model/device templates list the inputs for subsequent real trials. Kotlin candidates are uncompiled fragments, deliberately do not implement/advertise full native bridge003. The exact target schemas are `docs/agent/native-bridge-003.json` (older Android bridge002 files are historical). Public30 cases and newly restricted held-out instances are different datasets; no blind gate is claimed from public fixtures.

Database validation is separately reproducible using the existing `finweave-backend/scripts/test-db005.ts` disposable PG16 harness. Evidence scopes must stay separate.
