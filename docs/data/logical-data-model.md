> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 current target08/10/2026:** [identity protocol](../security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](../contracts/v2-t1-r2/README.md), [auth DB expand](../data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> **Delta hiện hành08/10/2026 — ARCH-04 D1 + J2 ACCEPTED:** [target model/ERD/dictionary](target-t1/README.md), [migration plan004+](target-t1/migration-plan.md), [ADR-011](../architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md). Stable planning scopes/revisions/items, shared jobs/attempts/scheduler, admin identity/session/MFA, projection cache/import rows/payload/recovery/control/schema journals bổ sung các entities dưới đây.54 bảng/610 cột là baseline;70 bảng/782 cột là expand design, không SQL đã chạy. Mô hình ngày07/10 bên dưới giữ domain provenance và được delta này cụ thể hóa.

> Bổ sung bàn giao08/10/2026: [index](../handover/README.md), [API v2 canonical](../contracts/v2/README.md), [physical schema](../data/physical/README.md), [quyết định vận hành](../handover/operational-decisions.md) và [validation](../handover/validation-report.md). Các tuyên bố chưa generated/chỉ logical hoặc mọi lựa chọn còn mở trong phần ngày07/10 là trạng thái lịch sử; frontend hiện có additive v2/admin mock nhưng chưa backend/native/security thật.

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

## ARCH-08 — Domain target tiếp nối

[DB004](target-t1-domain/README.md) kế thừa84bảng security, thêm forecast_runs/result_pages:86bảng/988cột/161FK. Frozen settings/compute checkpoint/result content dùng typed private payload_objects; J2 jobs vẫn sole lease/dispatch authority. Opening/seal/quantity/actual-family/snapshot rules được bổ sung bằng targetRules; không tự coi declaration lịch sử là executable DDL đúng mọi invariant.

[Engine semantics](../domain/README.md), [migration/grants](target-t1-domain/migration-plan.md), [bundle](../domain/implementation-bundle.json). SQL/upgrade/domain/concurrency/restore chưa chạy.

## ARCH-09 — DB005 async additions

Kế thừa86bảng/988cột, thêm provider_quota_buckets10cột, jobs.policy_version/deadline_at và refresh_jobs.request_payload_id. Target87bảng/1001cột/162FK; no destructive old-column edits, payload type/request-intent/coverage snapshot guards design only. Legacy queue fields/indexes chưa cutover, không active authority.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Local owner vault/outbox/capture index/upload batches/ACK replay/gaps/auth pending/installation metadata modeled separately from PostgreSQL authority. No local actual ledger copy becomes source of truth.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

DB00587tables1001cols162FK giữ nguyên; Market entitlement private payload registry addendum và quote profile_snapshot schemas SPECIFIED. Native masked discriminator không phải field mới trên collector_bindings wire.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Assistant/Planning ownership giữ nguyên. Stable server action identity/result refs+checkpoint/draft commit atomic; model provider call_id không authority. Typed payload registry addendum cần real uniqueness/grants/retention tests, không jsonschema=SQL PASS.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).
