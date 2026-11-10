# Integration Handover — frontend M2 synthetic

INT-HO-001 · v1.0 · 06/10/2026. Same `finweave-web` app, React/Router/Vite/TypeScript, tokens/components `/design` retained. Scope28REQ/AC, 5 primary nav, 16 business tabs +7 auth +/design, 13 modules/86 actions. API logical contract **1.1.0 exact**, 70 business +6 identity operations/64 base schemas. Candidate protected transport **0.1** is separate and unverified. Backend developer can implement against logical contracts; **real-data integration is BLOCKED_SECURITY_POC** until trusted client/code/key/auth/recovery/Anti-Ops proof is verified.

## Run and repeat checks

From repository root, `Start-Prototype.cmd` serves existing dist at **http://127.0.0.1:4181** (SPA fallback). Or from `finweave-web`: `node run-local.cjs 4181`. Leave server running before browser test. `npm run dev` uses loopback5173; build then server4181 is acceptance baseline. Node>=24.19.0<25; existing bundled executable on this machine is `C:\Users\Lenovo\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe`; use PowerShell `& 'absolute-path-to-node.exe' scripts/check-step6.cjs build`. On another machine Node24 in PATH works. If dependencies absent, `npm ci --ignore-scripts` using exact lock, not install latest. Installed Chrome needed for browser channel; no paid/public services.

Actual commands, cwd `finweave-web`:

```powershell
node scripts/check-step6.cjs typecheck
node scripts/check-step6.cjs lint
node scripts/check-step6.cjs build
node scripts/check-step6.cjs unit
node scripts/check-step6.cjs contracts
node run-local.cjs 4181
# Second terminal, while server stays running:
node scripts/check-step6.cjs browser
```

`FINWEAVE_URL` overrides test URL only. Runner uses work/tmp TEMP and writes separate step6 logs/JSON/HTML/screenshots; failed runs retained. Custom architecture lint is not ESLint/style lint. No new dependency; unchanged lock SHA256 `93ce8cb03f0e38b9b448de82d26af704f8d1693315dd862813599b2beffb2b95`. npm aliases typecheck/lint/check:m2:* call same commands. Static action audit uses checked-in Step5 hashes, no external M1 directory requirement.

Auth walkthrough: **Điền thông tin mẫu → Đăng nhập demo → 123456**. Only `.test` identities; fake password shown by UI, no real email/SMS. Synthetic session header/workspace owner checked by repository; marker sessionStorage lasts30min, no financial Store/password. Registration/password recovery are mock flows, never a production identity system.

## Boundaries and mapping

| Layer | Integration point | Responsibility |
|---|---|---|
| Components/features | src/components, features, app/context, chat-provider | Local filter/open/close/privacy/panel; forms through hooks; no fixture imports/directfetch |
| Queries/mutations | src/services/presentation.ts, contracts.ts | Single strict readonly presentation snapshot → selectors/cards/charts/details; named typed mutations; cancel query then refetch/invalidate |
| API | src/services/api.ts / logical transport | Strict input/output/envelope1.1.0, requestId/workspaceVersion, Abort5s, no automatic retry/fallback |
| Contracts | src/contracts + docs/contracts/v1 | DTOs, operations, schemas/OpenAPI/examples; source-to-target map; validation/date/money/error semantics |
| Mock only | src/mocks/browser.ts, handlers.ts, repository.ts | Lazy MSW worker, stateful atomic command handling, reset/jobs/AI/auth; replace adapter, never import mock into production UI |
| Protected candidate | src/services transport boundary + docs/security | Closed adapter refuses before network. No plaintext fallback; secure transport construction still blocked |

Money is integer VND decimal string, quantity/quote decimal strings, half-up per holding; display tabular numerals. Time is ISO offset +07 with date-only fields separately validated, periods half-open. Null/unknown carries reason, source and asOf; actual/planned/simulated/draft distinct. Read model version aligns cards/charts/table/detail. Pagination cursor binds filter and workspaceVersion (stale409); IDs opaque logical. Error includes code/message/retryable/fieldErrors/currentVersion/retryAfterSeconds; HTML500 remains server error, malformed success DTO becomes retryable502 and never enters cache.

Mutation: preview token + object/workspace expectedversion + idempotencykey; definitive4xx rejects before commit, refresh/repreview allowed. If response is lost/timeout/offline/5xx after commit is possible, **retain exact original request body/requestId/key/options** and retry that request; never recompute key from a newer snapshot. User sees unconfirmed outcome. Commit ACK alone is not projection: fetch latest presentation; replay older ACK must not replace a newer snapshot. After successful refetch release cached request. Concurrent submit latch and disabled preview inputs prevent inconsistent confirmation.

Import: rawCSV + mapping/profile/account → preview/errors/immutable staging token; select subset → confirm202 samekey → pending/running/completed job polling → atomic ledger events/refetch. Replay samejob no secondmoney; reject expired/mismatch/staleversion without partialcommit. Source revision preserves manual overrides, posts delta only. Raw/source evidence SHA/history defined in [source mapping](../contracts/source-to-target-mapping.csv).

AI M2 is scripted read-only. Capture nav/period/scope/filter/selectedrecord/snapshotVersion at send; result/evidence/history preserve that capture; navigation changes mark result stale. Server pending/result/cancel and cursor page10. Cancel failure retains pending and announces unconfirmed cancel; retry explicit. No real LLM key, database SQL or trading/write tool.

## Disable mock / protected work remaining

`.env.example` public enum `VITE_DATA_MODE=synthetic_mock`; absent selects explicit build default mock. To disable worker, set `VITE_DATA_MODE=protected` **before build**; startup fails closed and protected adapter throws beforefetch. This does not enable a real backend. There is no supported `VITE_API_URL` production switch. Do not swap plaintext `/__mock/...` for gateway endpoints and assume Anti-Ops compliance.

Implement secure adapter to the established LogicalTransport interface after independent trusted-client distribution, key/bootstrap authority, identity binding, encrypted authenticated envelope, attestation/recovery/revocation and gateway metadata minimization PoC. Current synthetic identity HTTP header and financial plaintext transport are test-only. Real cookies/CSRF/CORS/credentials/session/key lifetime must follow verified design; no secret in publicenv/bundle/localStorage. Preserve logical DTO validations inside trusted client, ciphertext-only gateway/Ops boundary. Protected negative tests prove **refusal**, not encryption/security readiness. [Security Design](../security/security-design.md), [ADR003](../architecture/adr/ADR-003-privacy-boundary.md) and [contracts](../contracts/README.md) record blockers; backend framework/physicalDB not chosen here.

Memory Store/importjobs/chat reset on reload to F-COMPLETE; fake auth marker may survive same-tab reload. Explicit Reset clears fixture/forms/filter/mask/chat/jobs; Logout clears session/cache/drafts. None demonstrates durable backend storage, backup, provider collection or data recovery. No backend fallback/demo success on real API failure. Final self-assessment and open limits: [Acceptance](frontend-acceptance-report.md).

## Final gate verification and targeted regression

After all six check modes finish: `node scripts/verify-step6.cjs`. This reads actual raw results (does not edit test status), verifies original inputs/lock/schema refs/links/manual evidence, and writes step6-acceptance-summary.json, step6-delivery-checks.json and root step6-manifest-sha256.json. If source/docs change, rerun affected checks and this delivery verification; manifest excludes itself.

Current accepted history:99unit; full54 + finalAI8 =55distinct. Current full browser command runs55 source cases. To repeat the affected AI regression separately (server4181 remains running):

```powershell
$env:FINWEAVE_EVIDENCE_PREFIX='step6-ai-regression'
node node_modules/@playwright/test/cli.js test --config playwright.step6-ai-regression.config.ts
Remove-Item Env:FINWEAVE_EVIDENCE_PREFIX
node scripts/verify-step6.cjs
```

Full runner sets its own evidence prefix; targeted prefix keeps the prior full screenshots intact. Archive the existing step6 evidence before intentionally replacing reports in a new acceptance run. MSW idle wake uses the same repository/session and public worker lifecycle APIs; it is bounded and preserves state, with no financial reset or automatic mutation retry. Scripts/components and tests use logical1.1.0 throughout.
