> Trạng thái hiện hành 06/10/2026: bước5 đã chuyển frontend sang stateful mock network contract1.1.0. Phần “planned/Step5pending” bên dưới giữ lịch sử thiết kế bước4; implementation thực tế, lựa chọn read model và giới hạn ở [ADR004](../adr/ADR-004-stateful-mock-and-read-model.md) và [Mock Implementation](../../frontend/mock-implementation.md). Real transport/security vẫn BLOCKED.

# Architecture Views v0.1

ARC-VIEW-001 · 06/10/2026 · logical target cho M2; “candidate” không là deployment đã có. [HLD](../high-level-design.md), [Security](../../security/security-design.md).

## V01 — Context và container

```mermaid
flowchart LR
  Owner[Owner device] --> UI[FinWeave React app: 5 navigation + design]
  UI --> Services[Typed logical services v1]
  Services --> Mock[M2 synthetic adapter: planned stateful MSW]
  Mock --> Engine[Shared synthetic domain projections]
  Services --> Closed[Protected adapter: BLOCKED]
  Closed -. candidate encrypted channel .-> Relay[Gateway relay: opaque only]
  Relay -. ciphertext .-> Core[Authorized attested core: candidate]
  Core -. ciphertext .-> Storage[Encrypted storage and queues]
  Keys[Independent key and code authority: unselected] -. verified release .-> Core
```

UI/Services/Engine code hiện cùng project; M1 MSW3 endpoints đang chạy, M2statefuladapter chưa wire. Protected adapter closed làcode thực; candidate relay/core/keyauthority/storage chưa tạo. Owners xemplaintext tại trusteddevice; relay/Ops không trở thành financialactor. No actualbank/LLM arrows vìM2scripted/fixture.

## V02 — Functional/modules/data view

```mermaid
flowchart TD
  Ingest[Source parser and import staging] --> Evidence[SourceRecord and Evidence]
  Evidence --> Review[Review decision]
  Review --> Ledger[Events and balanced EntryGroups]
  Ledger --> Reports[Cash and report snapshot]
  Positions[Holding movements and compatible quotes] --> Reports
  Plan[Versioned planned items] --> Forecast[Remaining and forecast]
  Ledger --> Links[Explicit ActualLink]
  Links --> Forecast
  Reports --> Goals[Allocation backing and goal progress]
  Forecast --> Sim[Frozen conditional simulations]
  Goals --> Sim
  Reports --> Tools[Whitelisted scripted read tools]
  Forecast --> Tools
  Goals --> Tools
  Sim --> Tools
  Tools --> AI[Conversation message and captured result]
```

Authoritative actualmoney: Events/EntryGroups; quantity/price source separate. Goalearmark/Plan/Simulation/AI không đượcpostactual. Reviewresolvedcasekhông bằng postedfinanceevent. Data22entities mapping ởDataModels. M2sharedmemory; real moduleexecution bênprotectedcore, nofinancialbusinesslogic bênrelay.

## V03 — Preview/confirm/import runtime

```mermaid
sequenceDiagram
  participant UI as Owner UI
  participant S as Logical services
  participant R as Authorized repository
  UI->>S: previewImport(file, mapping, account, version)
  S->>R: authorize and stage protected rows
  R-->>UI: token, digests, version, rows, expiry
  UI->>UI: select valid subset or cancel locally
  UI->>S: confirmImport(token, selectedRows, key, versions)
  S->>R: recheck authorization and bindings
  R-->>UI: 202 pending job, zero committed IDs
  UI->>S: getImportJob(jobId)
  R->>R: atomic effects + evidence + cases + replay record
  R-->>UI: completed IDs and resultWorkspaceVersion
  UI->>S: refetch affected snapshot keys
```

TrongM2bước5RsyntheticMSWmemory; realRrequiresattestedruntime/encryptedstorage. Duplicate retry returns samejob, khôngcopyledger. Conflict/expiredpreview giữinput→refetch/re-preview, noautoconfirm. Crash trướcatomiccommit→failed0 hoặc retryrunning; crash saucommit→completedack từreplayrecord.

## V04 — Deployment/trust/threat view

```mermaid
flowchart LR
  Client[Trusted owner client: distribution unresolved] -->|sealed logical request| Gateway[Untrusted Ops gateway]
  Gateway -->|ciphertext| TEE[Approved attested processing]
  TEE -->|encrypted rows and files| DB[Ops database and backups]
  TEE -->|sealed result to enrolled owner device| Gateway
  Authority[Independent enrollment, signing, key policy] -->|verified identity and approved measurement| TEE
  Ops[Ops and Support] -->|availability operations only| Gateway
  Ops -->|ciphertext administration| DB
```

Noplaintextarrow từTEE→DB/Gateway/Ops. Threats cònunverified: operatorwritesbrowserJS, selfapproveskeypolicy, enrollsdevice/userimpersonation, debugsruntime, proxiesTLS, rollbacksnapshot/replayrequests, readscrashlogs. Attestationkhôngtự giải quyếtđườngclient/auth/recovery. Actortrustmatrix và test plan ởSecurityDesign, khôngdiagram tự chứngminhgate.

## V05 — AI capture/history sequence

```mermaid
sequenceDiagram
  participant P as Shared panel or full chat
  participant A as Assistant service
  participant E as Authorized read tools
  P->>P: capture nav, period, scope, filter, selected, versions
  P->>A: send message with context and key
  A-->>P: processing message ID
  A->>E: authorize explicit whitelisted read operation
  E-->>A: structured metrics, quality and evidence from captured version
  P->>P: navigate; current context may change
  P->>A: get message
  A-->>P: completed frozen result or failed with null result
  P->>P: label stale; drill with original context; privacy render
```

NoSQL/mutation/tool từprompt; M2scripted classifier nhậnintentởallowlist, textuntrustedkhôngchọnworkspace. Fullchat/history/panel dùngsameconversation ID. Cancellation vàterminalresult race kiểmmessageversion; khôngghi vàoresultđãcancelled.
