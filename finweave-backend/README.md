# FinWeave backend local

**Hiện hành 03/11/2026:** database migration 001–012; web/admin và Android đã có bằng chứng tích hợp local. Agent Qwen/Ollama thực thi hai kịch bản, sửa draft tiếng Việt có giới hạn và retention preview được kiểm riêng. Mở từ `Start-FinWeave.cmd`; OTP từ `Local-Login-Code.cmd`. Đọc [hướng dẫn](../docs/LOCAL-QUICKSTART.md) và [báo cáo hiện hành](../docs/execution/completion-2026-11-03.md). Các đoạn tháng 10 bên dưới là lịch sử; điều kiện nguồn thật, bảy ngày và production vẫn mở.

**11/10/2026 — BE-16:** 14 admin operations và đủ 7 màn có PostgreSQL services, OpsIdentity/metadata pools riêng, negative authorization, safe preview/confirm/reason/audit và worker pause/retry broker. [Runbook](OPS.md), [contract/catalogue](../docs/contracts/local-ops/README.md), [report](../docs/execution/backend-ops-local-2026-10-11.md). Frontend giữ nguyên; BE-19 và production UAT còn pending.

**11/10/2026:** BE-14/15 bổ sung 23 Assistant/Planning owner operations và bounded deterministic Agent worker trên PostgreSQL; 18 integration groups PASS. [Runbook](ASSISTANT.md), [contract](../docs/contracts/local-assistant/README.md), [report và giới hạn](../docs/execution/backend-assistant-local-2026-10-11.md). Model thật, toàn bộ intent/eval/retention và frontend API005 còn mở. [APK pilot](../artifacts/android/README.md) đã build/ký; collector và kiểm thiết bị thật chưa chạy.

BE-07/08/17 receipt/Review and price pipelines now run on local PostgreSQL with a native DTO simulator and provider stub. Shared queue lease/fences/retry, durable receipt before ACK, quota intents, last-good/stale and host daily scheduling have executable fault tests. Run `node scripts/test-async.ts`; see [Async runbook](ASYNC.md) and [execution report](../docs/execution/backend-async-local-2026-10-10.md). Real-time daily observation started 10/10/2026; seven-day evidence is pending. No real source, Android collector or provider egress is enabled.

User API, Ops API và worker profiles đã có Fastify/TypeScript runtime với cookies/credentials thật, mail sink, một PG connection mỗi UnitOfWork, J2/recovery fences và contract/security tests. Xem [hướng dẫn chạy tái lập](RUNTIME.md); chạy `scripts/reproduce-runtime.ps1` để kiểm runtime. REAL profile bị chặn.

Engine và **BE-03/04/06 chạy thật trên PostgreSQL local**: accounts/opening, immutable balanced ledger, preview/post/refund/correction/transfer/cash count và stock/gold history. [Báo cáo và evidence](../docs/execution/backend-finance-local-2026-10-09.md), [33 API operations](../docs/contracts/local-finance/README.md). Chạy `pnpm test:finance` cho 19 nhóm correctness/concurrency với oracle Python Decimal độc lập; `node scripts/verify-finance-evidence.ts` kiểm source hashes và contract subset.

**BE-05/09/10/11/12/13 có API/database và workers thực thi local**: snapshot/Home/reports tích hợp, CSV staging/atomic import, toàn bộ nhóm Review resolution, Plan actual links/variance, Goal shared funding và daily simulation/forecast đóng băng. [Hướng dẫn](BUSINESS.md), [contract](../docs/contracts/local-business/README.md), [evidence](../docs/execution/backend-business-local-2026-10-10.md), [mapping đủ41 AC](../docs/execution/backend-business-ac41.csv). Chạy `pnpm check:business`, `pnpm test:business`, `pnpm verify:business`; persistent services dùng `scripts/start-business-local.ps1` và `scripts/smoke-business-local.ts`. Không thêm màn Báo cáo riêng.

## Historical foundation scope — FW-BE-FOUNDATION-001

Phần dưới mô tả foundation trước khi bổ sung auth runtime; các giới hạn API/identity/J2 ở đây là giới hạn của gói lịch sử đó.

FW-BE-FOUNDATION-001 · API005 / DB005 / native003 target pins.

This package implements a TypeScript migration runner, SQL ledger guards and a small exact Financial Engine kernel. It does **not** implement the 153 business API operations, full DB005, identity, J2 dispatch, native collector or full Agent. All 21 backend packages and 41 parent acceptance criteria remain required. See [execution report](../docs/execution/backend-foundation-2026-10-09.md) and [deployment addendum](../docs/data/local-foundation/README.md).

Requires Node 24.19.x, pnpm 11.25.0 and Windows x64 for the bundled disposable PostgreSQL harness. Dependencies are exact-pinned in `pnpm-lock.yaml`. No application service is installed and no cloud/provider/model is enabled. The database binds only `127.0.0.1`, uses generated SCRAM credentials and is stopped in the harness's `finally` block. Its synthetic files remain under ignored `.local/` for investigation. Never use this harness against a real database.

```powershell
pnpm install --frozen-lockfile --ignore-scripts --store-dir .local/pnpm-store
pnpm check
pnpm test:postgres
```

`check` preserves typecheck, artifact-pin and exact-kernel test output in uniquely named evidence files. `test:postgres` preserves source hashes, binary hashes, run configuration, results and fictional SQL server logs; old evidence files are not replaced. Scripts can be run directly with `node scripts/check.ts` and `node scripts/test-postgres.ts` after installing dependencies. The Windows binary package does not need the Unix symlink hydration script; installation intentionally disables package lifecycle scripts.

Migrations 001–003 are read from the untouched historical physical package. Migration 004 is new executable SQL. Raw file checksums, a dedicated session advisory lock, per-transaction journal writes and catalog fingerprints reject conflicting runners, unknown schemas, downgrade and manual DDL drift. Infrastructure journal DDL is in `src/database/migrate.ts`; its reviewed source hash is included in runtime evidence. Nontransactional/concurrent-index phases are rejected until a separate resumable phase runner is implemented. No target-parity or production-readiness gate is implied by these foundation tests.

The exact kernel uses BigInt coefficients and rational arithmetic for money sums and holding valuation, with holding-level HALF_UP rounding. It implements 23 of 57 inherited golden vectors; the other Engine behaviors remain specified. Static pin validation, unit execution and actual PostgreSQL execution have separate evidence scopes.

Portable PostgreSQL comes from the [embedded-postgres maintainer](https://github.com/leinelissen/embedded-postgres); installed package `@embedded-postgres/windows-x64@16.14.0-beta.17`, observed server version 16.14. [PostgreSQL numeric semantics](https://www.postgresql.org/docs/16/datatype-numeric.html) explain why validation must precede typmod rounding; [advisory-lock documentation](https://www.postgresql.org/docs/16/explicit-locking.html) describes the session lock used by the runner. No downloaded source generator or historical sealing script is run.
