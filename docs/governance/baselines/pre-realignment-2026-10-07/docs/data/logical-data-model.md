# Logical Data Models v0.1 — M2 contract boundary

ARC-DATA-001 · 06/10/2026 · DR-01…22 hiện hành, no physicalSQL schema/vendor selected. Version1logicalDTOs `src/contracts/schemas.ts`; semantic guards ởBR/LLD. M2syntheticmemory, realfinancialentities toàn bộinsideprotected encryptedboundary.

Mỗiownedrecord có workspaceId/owner scope kiểm bênrepository, objectversion, created/updated timestamps vàopaqueid. Workspace field có thể nằmlogicalrequest/context; DTO omit duplicateownershipfield nhưngservicekhông đượcomit authorization. Atrest encryptedrecord AAD binds internalworkspaceId/recordId/version/schemaVersion; noencryptedfield searches tạiOps. API money/price/quantity có units/time/null và snapshotrefs, khác form locale. Property bỏtrongM1legacyđược đánhplannedmap, khôngbịa đã códatabase.

| DR / entity | DTO / primaryrelations / constraints | M1 → M2 implementation boundary |
|---|---|---|
| DR-01 Workspace/Tracking | Workspace; 1:N allownedobjects; currencyVND/timezone/+07/businessClock/version/trackingStart | Store.clock/tracking/version; futuretrustedowner/sessionseparate |
| DR-02 Account | Account/AccountInput, openingbalance+date/kind/archived; 1:N events/observations/allocations | Account.source text→EvidenceID; M1noobjectversion, M2 introduceversion1/importadapter explicitly |
| DR-03 AssetIdentity | Holding.kind/name/market/product/purity/unit; quotecompatibilityidentity | InternalvalueobjectembeddedHolding; M2stockgoldonly; nooutsideassettypes |
| DR-04 Holding/QuantityMovement | Holding+HoldingMovement; movement quantityDelta/date/kind/eventId/evidenceIds/version; History riêng cho decision history | Legacy quantities movementsource; structured movement/actor/version adapter planned; quantitypointas-ofnotpricedate |
| DR-05 CostBasis | Holding.cost/costDate/costQuantitynullable; optionalselfdeclaredcost coverage | Legacyoptionalcost normalization; noledger mutation; nofalseP/Lifmissing |
| DR-06 Source/SourceRecord/profile | Source, SourceRecord; Source1:Nrecords; parser/mapping/profileversions/evidence/ref | Sourcestate exists; SourceRecord/staging IDs/newprofilebinding planned; dummycredentials only |
| DR-07 Event/Transaction | Transaction/EventInput; account/to/origin/reversal/holding/planLink refs; posting/reconciliation/categoryaxes | Event.version/history exists; useactual linked reversals andnotbooleanalone whenmappingcorrection; exactassociation preserved |
| DR-08 EntryGroup/Entry | EntryGroup; event1:N groups; debit=creditperVND, reversal refs, atomiccomplete | M1signedeffects notpersistentdoubleentry; explicitlogicalmodel foradapter/domain verification; noM3gate |
| DR-09 Evidence/DecisionHistory | Evidence/History/SourceRecord; evidenceN:M events/cases; subjectRefs và nullable content(format/rawText/normalizedFields); immutable rawversions | M1textsource/history→structuredsyntheticevidence; raw và normalized giữ provenance; actor demo notrealverifiedowner |
| DR-10 ReviewCase | Review/ResolutionInput; type→eligibleaction/state/version; nullableobserved/variance/refs | Legacy Reviewamount→variance; noobjectversionM1, M2 introduce; deferredopen, historyimmutable |
| DR-11 Price/FXQuote | Quote/Price/Quantity; Quote có id/version; source/identity/time/per/currency/FX/compatibility; snapshotquoteIDs | LegacyQuote noid/version→stablemockIDs+explicit version; unpriced_metricnull (notvalidQuote0); USDpriceonly |
| DR-12 CashObservation | CashObservation; account/asOf/observed/matchedsnapshot/variance/case/evidence | Legacycase observedamount; keepobservationseparatefromadjustEvent; asOfsamebaseline |
| DR-13 ImportPreview/Job/Row | ImportPreview/ImportJob/ImportRow/ImportMapping; owner/workspace/account/source bound token; fileDigest/mappingDigest/profileVersion/mappingVersion; jobstates | M1localpreview+imports payloadhistory noasyncjob; M2 newjobstate+token persistence adapter planned |
| DR-14 ReportSnapshot/Quality | Report/Metric/Quality/SnapshotRefs; allcard/chart/table same snapshot; drillsource refs | M1selector derivedfullStore; M2projectionDTO+versions; notsumlistpage |
| DR-15 OperationContext/Demo | LogicalRequest/MutationOptions/Reply/ErrorDTO; localprivacy/filter/draftdemo generation | M1Commandkey/version/datastrings; typedoperationnormalize, resetnoAPIbusinessoperation |
| DR-16 Period/NavigationContext | Period/QueryContext/AIContext; periodhalfopen/scope/selected/filter/versions/asOf | LegacyPeriod.end→endExclusive; scope→accountIds; purelocalURLadapter, sensitivefilterssealedfuture |
| DR-17 FinancialPlan/PlannedItem | FinancialPlan/PlanItem/PlanInput; FinancialPlan1:Nitems; baseline/horizon/itemversion/occurrences | M1workspaceimplicitplancontainer; M2useoneFinancialPlanaggregate, noextraUI/newscope; actualnotcopy |
| DR-18 ActualLink/Tracking | ActualLink/PlanForecast; unique(planVersion,eventId); item/eventversions/occurrence/money effects | Legacyevent.plan/planVersion→explicitlinkID/version/occurrence; noautofuzzymatch |
| DR-19 Goal/Allocation/Progress | Goal/GoalInput/Allocation/ContributionSchedule; accountbacking/allocated/funded/shortfall/ratio/lifecycle | M1noGoalversion; addstructuredversions; earmarknotcashasset; realretentionunselected |
| DR-20 Simulation/Result | SimulationInput/Simulation/SnapshotRefs; immutablebase/steps/assumptions/results/classification; base/future/cumulative cash/assets/income/gross/net/flow metrics | LegacycontextJSON→typedcontext; simulation.versionstorebase, newobjectversionseparate; stepsdate/unitpreserved; actual/planned/simulated/unknown không trộn |
| DR-21 Insight | Insight; ruleid/versioninternal, context/metric/target/quality/evidence | M1rulecards→DTO; no trendfakebaseline; regenerate oncontextversion |
| DR-22 Conversation/Message/ToolResult | Conversation/Message/AIContext/AIResult; sameconversationfull/panel, capturedref/resultterminalversion | M1localchatstate→services/history DTOs planned, scriptedM2; noLLMrealtokens/retention |

## Cardinality và constraints

Workspace→Account/Holding/Source/Transaction/Review/FinancialPlan/Goal/Simulation/Conversation; Transaction→Evidence/EntryGroup, holding→quantitymovements/quotes; Refund.originId vàreversalOf referencecurrentworkspaceevent; historyappendonly. SourceRecord normalizedEventId nullable untilprocessed/matched. ImportPreview→Rows→ImportJobSelectedSubset; validrowIDunique andrawimmutable. Completedjob committedeventIDs unique, failed0all, source/evidence matching notfinancialdup.

FinancialPlan→versionedPlanItems→Occurrences→ActualLinks(Transaction). Multipleitems nhưngunique(planVersion,eventId) prohibitsoneactualdoubletracking; archivedversions retained. Goal→Allocation(Account); sameaccountmultiplegoals aggregatebackingpro-rata; noaccountledgerlock. Simulation refsbaselineactual/plan/goal/quote/FXversion, noentrycascade. Conversation→Messages→capturedAIContext→authorizedToolResult; stale resultimmutablehistory, nocurrentStoreauthority.

## Transport/storage classification

Private: allfinancialrecord fields, accountnames/amounts/categories/descriptions/date/filter/positions/goals/cases/files/prompts/results/audit/identitysecrets. Minimalpublic/candidateoutermetadata onlytransportVersion/opaquechannelId/sequence/ciphertext; size/timing exposedneedsriskreview. Publicquotecandidates needlicense andmustnotattachprivateholding/accountquery. Staging/cache/report/debug/queues/backups equallyprotected; DBadmin cannotdecryption/APIimpersonation. No assumptionplaintextlogicalDTOstoredinrelationalDBwill“fitlater”.

Physicalmodel/SQL indexes/keylayout/retention/backup/sharding notchosen untilsecurityPoC. Logicaldecimalprecisionlimit18/8digits ispayloadconstraint, notDB numericdecision. EncryptedatrestoutsideTEEsearchneedsprotectedprocessor; donotaddsearchableplaintextcolumns forconvenience. In-memoryM2recordscopeuntilreset explicit; realretention policyopenOD-07/09, notkeepforever.
