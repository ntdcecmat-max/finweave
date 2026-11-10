# BE-16 local Ops services

BE-18/21 bổ sung host-only synthetic operations: [runbooks](../docs/operations/runtime-runbooks.md),
[drill scope/32 OPS](../docs/operations/runtime-acceptance.json), [real gates](../docs/operations/real-gates.md).
Chạy `node scripts/test-operations.ts`; `operate.ts` không cấp infrastructure authority qua app-admin.

`FW-OPS-001` supplies admin auth/MFA, overview, accounts/device metadata, sources,
jobs, quotas, releases, incidents, audit and command outcomes. All seven existing
admin screens map to real PostgreSQL services; frontend wiring stays in BE-19.
See [contract and catalogue mapping](../docs/contracts/local-ops/README.md).

Run from `finweave-backend`:

```powershell
node scripts/build-ops-contract.ts
node node_modules/typescript/bin/tsc --noEmit
node --test tests/ops-outcome.test.ts
node scripts/test-ops.ts
node scripts/test-runtime.ts
node scripts/test-async.ts
node scripts/verify-ops-evidence.ts
```

The integration tests create and stop a temporary PostgreSQL cluster on loopback.
They use actual non-superuser roles, HTTP injection, private-data sentinels and
worker capabilities. Evidence is written to `docs/execution/evidence/backend-ops-local-2026-10-11`.
No UI files, real providers, paid egress, infrastructure deployment or real-data
activation are involved.

Ops has two distinct pools: `databaseUrl` for `fw_runtime_ops` (password/TOTP/session
authority), and `opsBusinessDatabaseUrl` for `fw_runtime_ops_business`. Startup
rejects root, BYPASSRLS, owner-role or combined auth/business-role credentials.
`local:init` creates both logins. For an older local cluster, run
`node scripts/local-runtime.ts migrate` to add the business login/configuration.
Admin provisioning remains the host-only `scripts/provision-admin.ts` workflow.

Read APIs build explicitly allowed DTOs through fixed-search-path procedures.
Workspace, account, device, source, job, request and quota identifiers are opaque;
private references never leave the broker. Device heartbeat is `null/unknown`
when unobserved. Historical job timestamps without a recorded timestamp remain
null. Unknown error strings are mapped to `JOB_FAILED`. APK links appear only
for host-published verified HTTPS artifacts. Quotas and releases remain read-only.

Preview requires current MFA reauthentication, CSRF, an allowlisted reason code,
an eligible object and its version. A five-minute digest/token binds action,
reason, object version, session and recovery epoch. Confirm rechecks the binding,
Ops revision, object versions and policy, then commits the consumed preview,
control request, append-only acceptance audit and immutable command marker together.
The HTTP reply is **202 accepted**. It does not claim a private job was retried,
finished or posted. `opsGetCommandOutcome` reports the command's committed state
and separately its control disposition. After replay-body expiry the marker still
reports committed, and exact replay returns `REPLAY_EXPIRED/outcome=committed`.
A lost COMMIT acknowledgement returns `OUTCOME_UNKNOWN/outcome=unknown`; preserve
the original key/request, query outcome, then replay that same semantic request.

The ingestion/market worker loop drains its own bounded control requests before
claiming jobs. The broker rechecks object version, admin/owner/device/recovery
epochs, source, lease, deadline, prior outcome and unknown provider intent. Only
receipt/price jobs with permitted transient errors can use the existing bounded
manual-retry policy; attempts and cumulative budgets do not reset. Import,
Agent and Forecast jobs stay visible but cannot gain generic Ops retry authority.
Existing owner/domain workflows remain their authority. Provider cooldown and
quota reservation still govern execution.

Disable applies a persistent source pause plus source version change. Claim and
live-ticket publication are fenced; source locks serialize publication with
disable. Pauses preserve stored history and do not extend deadlines or reset
budgets. Applied/rejected disposition appends a second audit entry. There is no
dashboard enable/parser edit/release publish/role change/root/deploy/migrate/
restore/prune endpoint or SQL grant.
