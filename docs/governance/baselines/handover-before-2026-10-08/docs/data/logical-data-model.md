# Logical data model v0.2 — operational target

07/10/2026 · design only, chưa SQL migration/schema runtime. [DR-01…22](data-requirements.md), [model M2 lưu trữ](../governance/baselines/pre-realignment-2026-10-07/docs/data/logical-data-model.md), [LLD](../architecture/low-level-design.md).

## 1. Kế thừa

Workspace→Account/Holding/Source/Event/EntryGroup/Evidence/Review/Plan/Goal/Simulation/Conversation giữ nguyên. Posted entries immutable, correction reversal/replacement, amount decimal string VND, quantity/price decimal, date-only khác timestamp; snapshot refs có asOf/versions/provenance. Engine xác định actual/planned/simulated/unknown. Không cộng dữ liệu phân trang thành report.

## 2. Entities và constraints bổ sung

| Entity | Fields/relations và invariants |
| --- | --- |
| Device | id,ownerId,workspaceId,platform,appVersion,consentVersion,status,registeredAt,revokedAt,lastSeen; unique opaque device identity, server xác minh owner |
| CollectorBinding | deviceId,packageName,sourceAccountId,parserProfileId,consentAt,enabled; account cùng workspace, nhiều account không tự map theo tên app |
| SourceSupportProfile | packageName,appVersionRange,parserVersion,OS/OEM matrix,status; publish/disable có audit, không template tự viết bằng model rồi phát hành |
| IngestionReceipt | workspaceId/deviceId/eventId unique,sourceKey/revision,observedAt,receivedAt,payloadDigest,normalizedEvidence,parserVersion,state,eventRefs,reviewRefs; ACK chỉ sau persistence |
| LocalOutbox | device-only eventId,owner binding,encrypted payload,attempts,nextAttempt,status; không nằm trong server schema, không đổi owner sau logout |
| SourceCoverage | account/source/device,connectedFrom,lastObserved,lastAck,gapIntervals,reason; không dùng silence để suy hoàn chỉnh |
| Instrument | id,type,symbol,exchange,currency,unit,activeFrom/to; stock key=(exchange,symbol), canonical share; symbol re-use/delisting cần version |
| GoldProfile | product,purity,brand,region,quoteSide,unit,currency,providerId,confirmationVersion; owner xác nhận default, canonical chỉ |
| Holding | workspaceId,instrumentId hoặc goldProfileId,quantity movements; quantity≥0, cost optional, không quote tự thay quantity |
| ProviderEntitlement | source,scope/user/service,rightsVersion,allowedAssets,quota,credentialRef; secrets không DTO, cache scope không vượt quyền |
| QuoteObservation | instrument/profile,provider,entitlementScope,quoteAsOf,fetchedAt,currency,unit,side,price,quality; immutable/source fingerprint unique; price>0, no fake latest timestamp |
| RefreshJob | trigger,dedupeKey,entitlementScope,businessDate,status,leaseUntil,attempts,nextAttempt,lastError,succeededQuoteRefs; unique key theo policy LLD |
| AgentRun/Step | owner/workspace,baseSnapshot,intent,constraints,status,budget,modelPolicy,toolRefs; audit nội dung riêng tư, Ops chỉ run status/cost metadata |
| PlanningDraft | owner/workspace,runId optional,baseVersions,status,goalDrafts,planDraft,assumptions,constraints,resultRefs,expiresAt; draft không active/funded |
| PlanGoalLink | planVersion,plannedItemId,goalId,contributionRole; một goal có nhiều items, plan có items không gắn goal; link không tự là cash allocation |
| ProposalPreview | draftId,digest,owner,baseVersions,expiresAt,changeSummary; confirm tạo Goal/Plan/links/audit atomic và idempotent |
| OpsAudit | actor,action,targetOpaqueId,time,outcome,reasonCode; không raw finance hoặc chat, không admin impersonation |

## 3. Quan hệ và giao dịch

AI hợp nhất theo [AI-SPEC-001](../product/ai-agent-specification.md): một Conversation→Messages dùng chung cho read-only Q&A và Agent nhiều bước; Message giữ captured context, processingKind/mode, nullable ToolResult/AgentRun/PlanningDraft refs. Không đổi identity lịch sử hoặc tạo kho hội thoại khác khi chuyển từ hỏi tiến độ Goal sang lập phương án mới. Read result history vẫn immutable; draft/active financial versions tách riêng. Đây là logical proposal, chưa thay schema runtime.

Workspace1:NDevices/Receipts/Drafts/Runs. Device1:NBindings/Receipts; ReceiptN:MEvidence/Event qua association để nhiều nguồn chứng minh một giao dịch. Event không bị xóa khi source revoked. Transfer hai legs trong một entry group, không link bằng amount alone. Receipt replay không tạo event lần2; ambiguous duplicates giữ review.

Instrument/GoldProfile1:NQuoteObservation; Holding tham chiếu identity, không copy một giá rồi mất source/time. Snapshot giữ quote refs≤asOf. Provider daily job có thể dùng chung public quote cache nếu license cho phép; private position links không public metadata.

PlanningDraft có thể chứa một hoặc nhiều GoalDrafts và một PlanDraft; user xác nhận bundle là transaction duy nhất. PlanGoalLink không thay ActualLink hoặc GoalAllocation: contribution dự kiến, giao dịch thực tế và earmark cash là ba quan hệ khác nhau. Mục tiêu/plan đang active giữ version history; stale draft không commit đè version mới.

## 4. Physical mapping proposal

Profile thông thường/synthetic: PostgreSQL UUID keys, timestamptz cho instants, date cho business dates, numeric(18,0) VND và numeric(28,8) quantity/price, version bigint; structured relational fields/FK/check/unique và JSONB chỉ cho bounded versioned evidence/constraints. Domain API vẫn enforce18-digit money/8-decimal limits; không tự nới contract runtime. Composite tenant FK/queries scoped; index receipt identity, due jobs(status,nextAttempt), quote(identity,asOf), events(workspace,date,id), draft(owner,status).

NFR-08 protected profile: các fields tài chính trên là **logical inner records**, ciphertext ở storage ngoài boundary; không tạo plaintext indexes cho ownership/amount/search rồi nói đáp ứng anti-Ops. Physical protected schema/index/key layout chưa chốt, cần security PoC. Đây là hai mapping khác nhau; chưa có migration executable được phát hành.

## 5. Retention

Raw notification không lưu server; normalized evidence theo history/correction/retention policy, không forever mặc định. Pilot đề xuất receipt payload90 ngày, idempotency identity tombstone giữ tới khi xóa workspace để thiết bị cũ không re-post; tombstone không amount/text. Logs operational30 ngày; draft chưa áp dụng30 ngày; completed plan/goal versions theo user data lifecycle. Đây là đề xuất cần đồng bộ privacy policy trước real release; deletion/backup retention phải có restore test tránh phục hồi dữ liệu đã yêu cầu xóa. [Android spec](../architecture/android-collector.md) quy định retention local riêng.
