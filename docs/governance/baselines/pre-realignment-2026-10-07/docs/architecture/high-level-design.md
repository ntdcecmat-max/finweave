> Trạng thái hiện hành 06/10/2026: bước5 đã chuyển frontend sang stateful mock network contract1.1.0. Phần “planned/Step5pending” bên dưới giữ lịch sử thiết kế bước4; implementation thực tế, lựa chọn read model và giới hạn ở [ADR004](adr/ADR-004-stateful-mock-and-read-model.md) và [Mock Implementation](../frontend/mock-implementation.md). Real transport/security vẫn BLOCKED.

# High-Level Design v0.1

ARC-HLD-001 · 06/10/2026 · logical M2 synthetic design; real security integration blocked. Scope-v2/analysis-v2, 28REQ/AC,5nav. [Views](views/architecture-views.md), [LLD](low-level-design.md), [ADR-001](adr/ADR-001-frontend.md), [ADR-002](adr/ADR-002-contracts-and-m2-reuse.md), [ADR-003](adr/ADR-003-privacy-boundary.md).

FinWeave trả lời tiền ở đâu, nhóm chi nào lớn và căn cứ của số liệu; cùng app còn theo dõi Plan/actual, goals/allocations, mô phỏng và AI contextual. Home/Giao dịch/Plan/Dữ liệu/AI là views của cùng tài chính, không5data stores. Requirements/rules/DR hiện hành giữ nguyên; không đưa billing, Alerts, debt, actual trading hoặc provider thật vào scope.

## Components và trách nhiệm

| Component | Input/output / trách nhiệm / quyền |
|---|---|
| UI shell/features | React Router routes/design tokens/components v0.1; local dialogs/filter/mask/drafts/chatpanel; render financial DTO, chart+table+drill; không tự tạo source authority |
| Query/Services | Typed named services từ registry66operations; abort/correlation/errors/preview+idempotency; Querykeys bindworkspace/filter/snapshot; one snapshot và monotonicversion |
| Logical adapter | DTO input/output validation, null/date/unit normalization, mock versus protected transport selection được cấu hình ở composition root; không fallback real→plaintextmock |
| M2 mock repository (bước5) | MSW handlers + shared synthetic domain Engine kế thừa M1; stateful workspace/entities/preview/jobs/conversations; auth/fault fixtures; no real secrets; resetsessionmemory |
| Protected core (candidate chưa triển khai) | Auth/object guards/parser/matcher/ledger/portfolio/reports/PlanGoalsSimulation/scriptedAI trong attested boundary; entry/audit/idempotency/jobs atomic, encrypt result về authorizeddevice |
| Relay/storage/queues | Opaque ciphertext/allowlistedmetadata only; no financial parser/report/cache/log tại gateway/Ops; availability/backpressure không decrypt |
| Independent trust authorities (unselected) | Key release/code signing/device registry/recoverypolicy approvals táchOps; audit/quorum/attestation policy; không operator tự cấp quyền tới plaintext |

Current deployed local prototype chỉ UI+M1 `/demo/*` mock, not backend. Bước4 thêm logical interfaces/protocol fixture và blocked adapter, không wire endpoints66vào UI; đồng thời bổ sung authmock/systemcatalogue theo user. Backend language/framework, physical DB, enclave vendor, auth provider, key authority và paid resources đều open để privacyPoC quyết định. Không Rails hoặc app thứhai. Reuse domain Decimal/selectors/rules làm oracle; actual protected engine triển khai sau phải passsamefinancialsuite, không chạy engine ngoàiboundary rồi gọi encryption wrapper.

## Data ownership và flow

Owner workspace owns accounts/holdings/events/evidence/cases/source-state/plan/goals/scenarios/conversations. Public quotes có thể công khai khi license cho phép, nhưng quote subscription/holdingidentity/position association private. APIqueries trả projection theo exactscope/time/version. Events/evidence/entrygroups immutableposted; correction reversal+replacement. Report/GoalProgress/Tracking/Insight là projections, không authoritymoney. Simulation/AIhistory giữ frozen refs, không cập nhật actual bởi response/history.

File flow: client syntheticCSV→preview staging→raw+normalizedrows+errors→selectedvalidsubsetconfirm→pending/runningjob→atomic ledger/evidence/cases→completedIDs+workspaceVersion→queryinvalidate. Cancel preview không publish cases/job. Failedjob không halfposting. Real file nằmciphertext tới protectedparser, không relayCSVplaintext.

Interaction boundaries: local action không request; changed querykey fetch khi cần; mutationpreview query không commit; confirms require owner/version/digest/key. Retry timeout sameidempotency key; querycompletion before new submit. UI never derives balance from paginatedTransactions. Scopedflow cótransferacrossscope, khôngincome−netexpense giản lược.

## Quality, failure và vận hành

M2 scope data max20CSV rows/demo; pages25(default)/100(max), simulation24steps, planning24monthhorizon. Client fetch timeout5s kế thừa M1 nhưng service errorTIMEOUT không kết luậnserverđãcommit. Queryretrybounded2 vớibackoff; mutationmanualretry samekey, không retry409. Job/message polling1s→2s→5s khi pending, stop terminal/background vàAbort unmount; synthetic clocks controllable, no SLO production claim. Logs chỉ safe opaqueIDs/code/duration trongreal; không console errorsvớiDTO/body. Mock synthetic fixtures có thể inspect trongdevtools, điều đó không security capability.

Không durablebackend trong bước4; persistence/retention/keyrotationrestore real blocked. M1 cache['store'] giữ nguyên đếnmigration; newcontracts modules không vàoUIbundle vì chưaimport. Stacklicense/pins unchanged. Warm filterM1 đã đo không suy latencyencrypt/protectedengine. Mainbundlewarning và real accessibility/device checks follow-up unchanged.

## Gate và implementation sequence

Bước4 hoàn thành hồ sơ/schema/interface/protocolfixture/coverage/checks theo report. Tiếp bước5 trongsameapp: adapterbackwardmigration, statefulhandlers/resourcequeries, importpreviewtoken/job, mutations/refetch, AIsharedservices, faulttests; sau đó bước6integration/walkthrough mới xét gateM2. M2synthetic không cho dữ liệuthật. SecurityPoC riêng cần trustedclient/coderoots/independentkeyauth, allIdeas§15gate evidence trướcrealdata. Không deploy/cấp tài khoản hay paidregistrations.
