# Operational API design delta v0.1

07/10/2026 · thiết kế hợp đồng đích, chưa generated/implemented. Contract1.1 trong code và `v1/` vẫn là mock baseline. Không sửa OpenAPI/Zod frontend trong nhiệm vụ document-only. Trước implementation phải chuyển delta thành một schema source, examples, mocks và contract tests; không tự coi bảng này là release API hoàn chỉnh.

## 1. Transport/version

Đề xuất logical business API version2 vì thêm device/receipt/roles/Agent drafts, không silently change1.1. HTTP paths dưới đây mô tả conventional synthetic profile; với PROTECTED-REAL, operation+payload+errors nằm trong sealed request bên trusted boundary theo ADR-003/006, không expose finance plaintext qua relay.

Common authenticated reply: requestId,contractVersion,workspaceVersion (nullable cho ops),data hoặc error(code,retryAfter,fieldErrors safe). IDs opaque, money/quantity decimal strings, instants RFC3339; auth identity không lấy từ body. Mutations dùng Idempotency-Key, expected versions; conflict409, validation422, auth401, denied403, quota429, unavailable503. Timeout không chứng minh chưa commit.

## 2. Operations mới

| Operation / HTTP đề xuất | Input chính | Output / quyền |
| --- | --- | --- |
| registerDevice POST /v2/devices | platform,appVersion,consentVersion,device public binding | deviceId,status,scoped enrollment; authenticated owner |
| revokeDevice POST /v2/devices/{id}/revoke | reason,expectedVersion | revokedAt; owner, không admin lấy quyền upload thay user |
| listSourceSupport GET /v2/source-support | platform,appVersion | tested package/template/device support, không financial data |
| bindCollector POST /v2/collector-bindings | deviceId,packageName,accountId,parserProfileId | versioned binding; owner/account same workspace |
| ingestNotifications POST /v2/ingestion/batches | items(eventId,deviceId,bindingId,sourceKey,revision,observedAt,normalizedEvidence,parserVersion) |202 receipts[{eventId,receiptId,state,errorCode?}]; identity bound device, per-item validation; no raw OTP/body |
| getReceipt GET /v2/ingestion/receipts/{id} | id | received/parsed/posted/needs_review/ignored/failed,affectedIds/version; owner only |
| getSyncState GET /v2/sync-state | lastKnownVersion | currentVersion,coverage,device status; owner, no full finance in URL |
| searchInstruments GET /v2/instruments | bounded query,market | instrumentId,symbol,exchange,currency,unit,support status |
| getGoldProfiles GET /v2/gold-profiles | optional product filter | compatible choices including side/source/units, no default unconfirmed |
| requestPriceRefresh POST /v2/price-refreshes | authorized holdingIds or all,reason=manual |202 jobId,status,coalesced,retryAfter; never accepts arbitrary provider URL |
| getRefreshJob GET /v2/price-refreshes/{id} | id | source statuses,lastAttempt,lastSuccess,quoteAsOf,partial/errors; owner |
| startAgentRun POST /v2/agent-runs | intent,entryPoint=plan/goal/investigation,context,baseVersions,constraints |202 runId,state; no user-supplied role/tool permissions |
| answerAgentRun POST /v2/agent-runs/{id}/answers | questionId,answer,runVersion | state/next step; authorization and snapshot recheck |
| get/cancelAgentRun GET/POST /v2/agent-runs/{id}[/cancel] | id; cancel expectedVersion | state,question,tool evidence,proposal refs or partial; immutable terminal result |
| getPlanningDraft GET /v2/planning-drafts/{id} | id | PlanDraft/GoalDrafts/links/constraints/simulation/evidence/stale; owner |
| previewPlanningDraft POST /v2/planning-drafts/{id}/preview | expectedVersions,draftDigest | previewToken,changes,conflicts,expiresAt; no active writes |
| confirmPlanningDraft POST /v2/planning-drafts/{id}/confirm | previewToken,expectedVersions,digest | persisted plan/goal/link IDs/version; **owner UI only**, not agent tool; atomic/idempotent |
| opsStatus GET /v2/admin/status | bounded operational filters | safe metadata only; admin role server-managed |
| opsRetryJob / opsDisableSource POST /v2/admin/jobs/{id}/retry or /sources/{id}/disable | expectedVersion,reason | audited metadata ack; no financial preview or impersonation |
| dispatchJobs POST /internal/jobs/dispatch | signed/authenticated scheduler request,opaque batch bound | operational count/status only; not public user operation, strict timeout/lease |

## 3. Payload semantics và lỗi

Notification normalizedEvidence: amount positive decimal hoặc null, currency, direction hoặc unknown, masked sourceAccountRef, transactionRef optional, sourceOccurredAt optional, parser confidence **rule status**, không phần trăm AI bịa. Missing account/amount/direction cần Review, không tạo posted event. Source text đã rút gọn vẫn là sensitive, không log/LLM mặc định. Batch≤50 items/256KiB là proposal cần device test; receipt unique theo workspace/device/event.

Price refresh input không chứa quote do client tự đặt vào giá thị trường. Quote response gồm identity/profile,side,unit,currency,price,quoteAsOf,fetchedAt,source,quality. Chưa có giá: metric.value=null+missingReason. Rate limit giữ job/reference đúng, manual không bypass entitlement.

PlanningDraft gồm target/deadline/reserve/priority/assumptions, proposedGoals, proposedPlanItems, goalLinks, baseSnapshot/versions, simulationResults và evidenceRefs. Chỉ proposed allocation đủ cash hiện tại mới được confirm; planned income không funding. Preview10 phút là design default. STALE_PROPOSAL/PREVIEW_EXPIRED/IDEMPOTENCY_CONFLICT cần refetch/re-preview, không auto-apply.

## 4. Migration và tests phải có

**AI compatibility:** theo [AI-SPEC-001](../product/ai-agent-specification.md), giữ capability create/select/list conversations, history pagination, send/poll/cancel message, read ToolResult và context/evidence/drill. Message có thể tham chiếu AgentRun/PlanningDraft và processingKind/mode rõ trong version mới; cùng conversation ID trên full chat/panel/Plan/Goals. Không thay tất cả read requests bằng agent-runs, không tạo hai kho history. Schema migration phải bảo toàn context đã chụp và label scripted/synthetic đúng. AI-FR-001…009/019…024 và AI-NFR-001…008 là refinement contract behavior, chưa sửa runtime1.1 trong lượt docs.

Inventory1.1→v2 từng operation; thêm schemas/examples rồi mocks cùng source; native/plugin DTO match; backend implements verified shapes/semantics; từng consumer migrate explicit version. Không sửa runtime schemas một nửa để tài liệu trông hoàn thành. Negative tests: cross-tenant/role/device, timeout after commit, same key different payload, concurrent refresh, old snapshot, parser unknown, interrupted draft confirm, agent injection/budget/cancel. [Acceptance plan](../testing/operational-acceptance-plan.md) là gate, hiện NOT RUN.
