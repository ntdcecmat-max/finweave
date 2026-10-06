> Trạng thái hiện hành 06/10/2026: bước5 đã chuyển frontend sang stateful mock network contract1.1.0. Phần “planned/Step5pending” bên dưới giữ lịch sử thiết kế bước4; implementation thực tế, lựa chọn read model và giới hạn ở [ADR004](adr/ADR-004-stateful-mock-and-read-model.md) và [Mock Implementation](../frontend/mock-implementation.md). Real transport/security vẫn BLOCKED.

# Low-Level Design v0.1

ARC-LLD-001 · 06/10/2026 · specification to build in Step5; contract/schema/protocolfixture code đã kiểm ởStep4. [Operation source](../../finweave-web/src/contracts/operations.ts), [Screen behaviors](../design/screen-behavior-specification.md), [Data model](../data/logical-data-model.md).

## L01 — Composition và migration

Giữ AppProviders/ViewContext/ChatProvider/routes/components/tokens. Thêm `Services` injected ởcompositionroot và select explicit `synthetic_mock`; real chọn BlockedProtectedTransport. Current M1 `services/demo.ts`3calls và memoryStore đang authoritative; financialfeatures chưa chuyểnv1ởbước4; authmock và catalogue đã bổsungtheouser. M2migration theo resourcegroups, mộtMockRepository duy nhấtchuyểncommandssangtypedhandlers; khôngvừaMutatelegacyStorevừa giữresourceStorethứhai. Testadapter phải đọccùngworkspace/snapshot và allderivedselectorgroups.

V1interfacecode có Workspace/Portfolio/Ledger/Data/Plan/Assistant/ReportServices. `bindServices` bindnamedfunction→validatedtransport; caller supplies options(requestId/workspaceId/signal/mutation), authorization insidehandler. `Reply.workspaceVersion` ngoài data là logicalsealedmetadata, không publicresponseheader thật. Mockprotocolfixture hiệnreturnstaticexamples, khôngrepository haypersiststate; job/failure cases explicit. Bước5khôngcopyfixtureclass đểgiả ledger đãxây.

## L02 — Queries/cache/projections

Key pattern `['fw',contractVersion,authorizedWorkspaceId,resource,normalizedFilter,snapshotVersion]`. LocalURL/privacy/draft/panel statekhôngkeyfinancialsource. `getWorkspace` xácđịnhversion/businessclock/tracking; cachedReport(id/context/version) làsingleprojection chochart/table/card. Lists sort+cursor stable snapshot; nextpagekhôngđược cộng thànhcash/report. Selectedobjectread kiểmworkspace dùIDopaque. Queryabortngănrace; delayedresponseversion<currentcachebỏ hoặcgiữchỉ frozenhistory.

Invalidation từoperations. Financial family includes accounts/events/holdings/reviews/reports/plans/goals/insights; Source mutations còn invalidate sources (cầnservice-specific bổ sung), importjobcompletion invalidateallfinancial+sources/jobs, plan/goals/planning invalidateprojections/simstaleness. Preview khônginvalidate. Simulationsaved invalidate simulations/workspace/AIstaleness, giữactualmoney. Conversation/messagekeys riêng; creation/messageprogress không làmfinancialworkspaceVersiontăng nếu domain khôngđổi; reply workspaceVersion vẫncurrent. Vìprotocolfixtureschemathểhiệnacceptedversionillustrative, M2handlersmust áp dụng chínhxác quy tắc này.

Sau mutation: nhậnackIDs/version→markaffectedkeys stale→refetchlatestversion→renderconsistentsnapshot; khôngreplayStore. `mayReplaceSnapshot` helper cótestchoincomingolderversion. OptimisticfinancialnumberdisabledM2; chỉ UIstatuspending optimistic. Forms inputpreserved througherror; newsnapshot409refetch→preview lại→keymới. Goalshortfall recompute khi cashchange không chỉgoal mutation; Planactual từ eligiblepostedeffects,manualcategoryoverride khôngbịsource refresh ghiđè.

## L03 — Atomic command pipeline

1. Authenticate/enrolleddevice→authorizeowner/workspace/objectrefs; khôngtin prompt/headeridentity.
2. ParseDTOversion/operation/shape→crossfield + domainrules/calendar/unit/active states.
3. Lookup idempotency key trướcexpectedversion check đểsamecommittedpayloadretry trả priorack; changedpayload409. Semanticpayload chứa input/versions/previewbindings; normalizedcanonical form vàdigest bêntrustedboundary.
4. Validate preview owner/operation/digest/expiry/workspace/objectversions vàcurrentexpectedversion trong transaction. Queriessnapshot và previewclone read cùngversion.
5. Produce proposed Event/EntryGroup/holdingmovement/evidence/decision; validate debit=credit, signed corrections/maxrefund/refs. Increment affectedobject versions vàglobalfinancialworkspace version once percommit; save record/replayack/auditatomic.
6. Returnack hoặcstoredresultID/version; joback202chưafinancialcommit. Serializeerrorsafe(logicalencryptedwhenreal), không dump input/stack financial.

M1commands dành implementationreuse, không có ledgerpersistent thật. M2synthetic có thể lưu explicitmockEntryGroups hoặc shared eventeffects nhưng phải testtransaction-equivalent all-or-none; khôngdeclareM3 ledgergate khi chỉevents.

## L04 — Domain guards/algorithms

| Domain | Algorithm / invariant |
|---|---|
| Balance/report | opening+signedpostedentryeffectsas-of; actualdate trongtracking…businessclock; gross/refund/net, scopedflow tách; draft/pending excluded; reversedoriginal+reversalnet0; unknownmissing khôngzero |
| Transfer/refund/invest | transferfrom/to≠ vàbalancedlegs; fee expense riêng; onelegreview chưađủbalancedtransfer; refundsameworkspaceeligibleorigincurrency/account/date/maxremaining; investmentcash↔position khôngexpense; unknownadjustsigned khônggáncategorychi |
| Corrections | draft/pendingmutableprepost; postedappendreversal+replacementwithreason/history/idempotency; incompatiblelinkedrefund/holdingguard; mergeevidencekhôngduplicatecash; categoryoverride persists afterrevision |
| Quantity/quote | quantity movementas-of; stockshare/goldcanonicalchi; goldluong×10; quotecompatibleidentity/time/market/product/purity; FXVNDUSD vớiunit/date; perholdinground1VNDhalfup; missingcomponent→totalnull+knownsubtotal; independentstale quantity>30d price/FX>24h/source>48h |
| Review | actionallowlistbytype; deferredkeepsopen/observed/noentry; invalidsupplementincome/expenseonlyfullvalidation+duplicatematch; cashunknownadjustvsforgottenexpense; qualityackonlyafterissuefixed; resolvedretryack0 |
| Plan | expandonce/monthlywithin≤24month horizon; missingcalendar day lastday; occurrence stableplanVersion/item/date. Eligibleexplicitlinkunique(planVersion,eventId), exactaccount/type/currency/occurrence; signedrefund/reversal effects. remaining=max(planned−actual,0), overspend=max(actual−planned,0), forecast=actual+remainingincome−remainingexpense−remaininginvest; investment addsassumedholdingvalue, nevergross |
| Goal | earmarkexistingcash acrossallgoals/account; capacity=max(actualbalance−activeallocated,0); unknownbalance rejectsnewalloc; actualspendneverblocked. Funded peraccountpro-rataavailablebacking; floor1VND, residualstableallocationId; progressmin(100,funded/target×100); archivedrelease/history; achievedrequiresfunded≥targetatconfirm, remainslifecycleiflaterfundingfalls |
| Simulation | clonefrozenbaseworkspace/plan/goal/quoteversions; datesfirst>clock ascending interval1–366/count≤24/all≤horizon; validatecash/earmark eachstep; saveearmarkonly, consumecash+assetsdown/grossup, investcashdownholdingup/gross0; noactualcommit; missingvaluationpartial; fixedprice assumption explicit |
| AI | scriptedintent→read whitelist only reports/portfolio/plans/goals/simulation/insights; capturedsnapshot authorized; noSQL/mutation/ownerfromtext/trade. processing→completed/failed/cancelled; versionCAS terminaltransition; no-data/denied/toolerror givesresultnull; structurednumbers fromEngine notnarrativeparser |

Guards phụ thuộc repository (refs/versions/capacity/history) chưa trongJSONschema; `validateInput` thựcthi subset crossfield, domaincommandsM1 đã có financial guards. Bước5 typedadapter phải map cảhai và giữUIfieldpaths/errorcodes. Khôngassume schemaparse đủbusinesssafety.

## L05 — Import/job

UTF-8 ≤65536bytes, ≤20datarows (headerskhôngrow); unsupportedencoding/oversize/empty/missingmapping422 trướcstage. Raw immutableEvidence; normalizedevent chỉ validshape; rowId hash(fileDigest+rowIndex+profileVersion) stable, khôngindexmới sau sort. Preview tokenbind owner/workspace/account/file+mapping+profileversions/fullselectedrowuniverse/currentworkspaceversion, TTL10minmock. Selectedsubset khôngempty chỉvalidrowIDs cùngpreview; invalid/duplicate khôngpostnhưngReview publish khi completed; cancelpreview discard staging/nojobs/cases.

Confirmsamekey→samejob; differentpayload409; jobstates pending→running→completed/failed, nofinancialIDs khi pending/running/failed; failedbeforecommit0. Atomiccomplete writes allselectedentries/evidence+remainingcases+job+keyresult once; crashaftercommit replay readcompleted khôngre-run. Poll GETlogicalquery opaquejobId membership; 1/2/5sbounded, pausebackground/cancelrequestkhôngcancelcommittedjob. Retryfailednewpreview/key saufix; timeoutconfirm usekey đểlookupjob, khôngtạo duplicatejob. Completion invalidatesfinancialkeys, 202onlyjobs.

## L06 — AI shared state

CreateconversationexplicitonfirstsendwhennoactiveID (openpanelalone khôngAPI); pendingmessage+contextcopies, textmax500. Full/panel/history giữsameconversation/message IDs. Cancelpending→terminalcancelled khôngresult; servercompletionCASpreventrace; cancellingcompleted409currentversion. Retrysamekey aftertransportfailure; retryfailedmessageintent generatesnewmessage/key withexplicitcurrentcapture, historyoldimmutable. Querycontextfilters/selectedrefs insideprotected authorization; stale result remainshistory andlabelstale. Mask removescharts/structurednumbers vàwholefreetext/history/evidencewithfinancialcontent fromrender, khôngCSSbluronly; vẫncóprotectedmemory trêntrusteddevice.

NoLLM/keys/stream/tool mutation M2. allowlist intentdeny SQL/workspaceimpersonation/trading/rawledgerdump/sourcekeys. Quota429retryAfter30fixture/no paidfallback; toolfailurecode contained no fabricatedmetrics. Historypaginationstaticfixturecurrentlyexample; statefulM2planned.

## L07 — Verification boundary

Step4 tests schemaexamples66, invalidshape/amount/date/unit, ownerworkspacesubstitution, opaqueenvelopeallowlist, blockedrealadapter, idempotencyack/versioncacheguards, faultcases/jobterminal/AIfailednoresult, OpenAPIrefs/action/28ACinventory. Đó làprotocol/preparationevidence; chưa UIv1handlers/authreal/previewcryptobinding/enclave/restore/concurrencybackend. Bước5phảikiểm input→typedservice→MSWdomain→refetchrender, all28AC+branchfails; Step6fullwalkthrough mới xétM2. SecurityPoCtests riêng khôngsubstitute bằngfixture.

## Bước5 — hiện thực hóa L01…L08

Composition main.tsx explicitmode → lazy MSW; AuthGate/AppProvider/ChatProvider giữ cùng app. AppProvider readPresentation query và executeAction service; command-adapter đặt named operation từ sharedform, không client applyCommand. Repository serialize/rollback, bound preview, snapshots/resource projections và async jobs/chat như Mock Implementation. PresentationDTO strictshape là read-only, không financial POST Store.

Invalidation prefix fw/contract/workspace giữ các resource/history/jobs nhất quán. Network timeout/abort không fixture fallback. Cache mutation acknowledgment không overwrite hiện trạng khi retrykey cũ; financial correct posted có reversal/replacement. UI import stage response có raw/local formatting, normalized/serverstatus; changed input invalidate epoch, stale preview không áp vào input mới.

AI create/send giữ attempt/key/context khi transport lỗi; terminal/cancel/reset clearattempt. Lazy server completion poll giữ captured snapshot, message cancellation terminal. Conversation/messages independentversion, không tăng financialversion vì chat. Dates/source refs strict trước capture. Financial mutation trong lúc reply xử lý báo stale; panel/history cùng provider.

