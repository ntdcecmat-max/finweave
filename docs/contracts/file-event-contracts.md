> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# File & Event Contracts v1.0.0

ARC-FILE-001 / ARC-EVT-001 · 06/10/2026 · M2synthetic spec; no collector/real provider/eventbus installed. [Source-to-target](source-to-target-mapping.csv), [API](README.md).

## FILE-CSV-01 — Synthetic CSV profile

UTF-8(no secret), optionalBOM stripped; filename displayonly sanitized max500, notserverpath. Comma delimiter/RFC4180 quoted fields/newlines handled by parser; initialprofile≤64KiBbytes,20datarows headerexcluded. Filetype/content sniff reject binary/nonUTF8/invalidCSV; do nottrustextension. Headers `date,amount,description,reference` defaults; usermappingnames supported, duplicates/missingrequiredheaders422. `yyyy-MM-dd` hoặc `dd/MM/yyyy` mappedcalendar; amount canonical signedVND integer: positiveincome, negativeexpense absoluteAmount; zeroinvalid, exponent/locale separators notsilentlyparsed. Account externalnotCSVauthority: activebank selectedowneraccount checked.

Example hợp lệ:

```csv
date,amount,description,reference
2026-10-12,100000,Thu khác giả lập,DEMO-NEW
2026-10-12,-50000,Chi giả lập,DEMO-COST
```

date/amount/descriptionrequired; referenceoptionalnull. Normalized EventInput kindincome/expense/postingposted; khôngtựinfertransfer/refund/investment từdescription. RawSourceRecord/evidence khôngghiđè. Duplicate byauthorizedsourceRecordId/reference+account/currency/amount/date/parsercriteria; fuzzy candidates onlyReview, khôngautomerge khácdate/amount. Source revision linkedversion usescorrection rulespreservemanualcategoryoverride. Notificationfixture cũngsameNormalizedEvent/evidence path, noAndroidcollectorM2.

previewImportlogicalbody carriescsv mapping expectedworkspaceVersion; response ImportPreview rowsrawEvidenceId/normalized/errors/status, token10min绑定owner/workspace/account/fileSHA256/mappingcanonicaldigest/profileVersion/workspaceVersion. Raw evidencequery protected; noCSV/log/filename financialrealURL. selectedRowIds stable withinpreview; invalid/duplicate unselectable; mixedbatchconfirms validselected atomically vàpublish Review forremainingrows oncompletion. `confirmImport`202returnsjob with0committedIDs; pollingterminalresult/version. Wrongsubset/token/expired/version409 nofinancialcommit. Cancelpreview localdiscardsstage/nocases/jobs. Filedownload/export outsidecurrent scope; nophantomfeature。

Real filecontract transport blocked: uploadciphertext fromtrustedclient toauthorizedprocessing; raw/normalized/staging/error snippets encryptedstorage &responses; gatewayobjectstorage neverplaintext. sizebucket/bytecount mayleak, documentallowlistbeforePoC. No tmp plaintextfiles/parserstderr/crashheap outsideTEE.

## Domain events (internal, not public finance feeds)

Logical event envelope: `{eventId, eventType, eventVersion:1, workspaceId, workspaceVersion, occurredAt, causationRequestId, correlationId, payload}`. OwnerfinancialIDs/versions/payload allprivate; wholeenvelope encrypted in realqueues/logs. `eventId` stableopaque; consumersidempotent byeventId, perworkspaceversionorder, ignoreolderdup, gap→refetchauthoritative snapshot. Mockevents memory; no broker/outbox infra claimed. Deliveryatleastonce candidate; financialexactlyonceeffect comesfromidempotentatomiccommit, no transportexactlyoncepromise.

| Event type | Payload schema / publisher | Consumer / effect |
|---|---|---|
| WorkspaceSnapshotChanged.v1 | MutationAck (affectedIDs/objectversions), repositoryatomiccommit | Queryinvalidation/report/goals/plan/insights; no before/afterplaintextgateway |
| ImportJobStateChanged.v1 | ImportJob; pipelineonlyterminalcommittedIDs | Poll cache update; only completed triggersfinancialrefetch |
| SourceStateChanged.v1 | Source; refresh/disconnect/reconnect | Freshness/capabilitycache; failure doesnoterasequotes |
| ReviewCaseChanged.v1 | Review + relatedMutationAck ifmoneycommit | Reviewlists/detail/history +financialrefetch onlyifentryeffects |
| PlanItemChanged.v1 | PlanItem + workspaceversion | Forecast/linkversionstaleness; noactualentry |
| GoalChanged.v1 | Goal + Allocation versions | Progress projections/shortfall, no moneygeneration |
| SimulationStored.v1 | Simulation frozen refs | Comparisons/history; noactualqueryoverwrite |
| AssistantMessageChanged.v1 | Message processing/completed/failed/cancelled | Sameconversationfull/panel/history; terminalCAS; noresultiffailed/cancel |

Eventpayload schemas referenced in generated JSONSchema; no deployed eventbuscontract validation orcrossprocessatomicity asserted. Bước5M2mayuse in-memory notifications/invalidation rather thaninstallbroker. OuterOpsoperational events onlyopaquechannel correlation/statuscode/timing, separateallowlist fromtheseprivate events. Futurepush/SSE/LLMstream ngoàiM2scriptedpollingdecision.
