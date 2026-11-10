# Local Ops contract — FW-OPS-001

BE-16 implements all admin services against PostgreSQL in synthetic-local mode.
[OpenAPI](openapi.json) is generated from the pinned API005 catalogue plus the
explicit [runtime extension](../../../finweave-backend/src/runtime/ops-contract.ts).
[Catalogue mapping](catalogue-mapping.json) covers all seven `UI-ADM` screens,
existing sign-in/out/snapshot/preview/confirm actions, MFA and outcome recovery.
The generator fails if an admin screen or registered operation lacks a mapping.
Historical API005 bytes are unchanged. Frontend code/adapters remain untouched.

Changes from API005: `opsConfirmAction` returns 202 with `controlId` and
`disposition=accepted`; audit result is `accepted/applied/rejected` rather than a
misleading success. Command outcomes include separate `controlDisposition`.
Jobs additionally expose import/forecast/agent/cancelled metadata without giving
those domains generic retry authority. Unrecorded job/device timestamps are null.
Free-text reasons remain prohibited; API005 reason enums are enforced.

See [service and test runbook](../../../finweave-backend/OPS.md) and
[execution report](../../execution/backend-ops-local-2026-10-11.md).
