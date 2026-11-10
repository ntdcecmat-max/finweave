> **ARCH-06 current target08/10/2026:** [identity protocol](../security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](../contracts/v2-t1-r2/README.md), [auth DB expand](../data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# Error, Auth & Idempotency Models v1.0.0

ARC-EAI-001 · 06/10/2026 · synthetic logical specification. Real auth/key/session mechanisms BLOCKED theo ADR-003; fixture checks không chứng minh real auth.

## Error semantics và UI response

ErrorDTO luôn có contractVersion/requestId/code/message/retryable/fieldErrors/currentVersion/retryAfterSeconds. No amount/raw/prompt/secrets trong message/log. Field path là input property (e.g. `amount.value`, `resolution.event.date`), fieldErrorcode stable. HTTPstatus có ở mock transport; network status0 chỉ adapter nội bộ. Protected errors seal cả code/detail; outer relay không trả financial currentVersion/validation/referenceexistence.

| Code / status | Trigger | UI / retry / hậu điều kiện |
|---|---|---|
| VALIDATION /422 | DTO/calendar/unit/amount/mapping/field businessrule | focusfield/summary, giữdraft; khôngcommit; sửa→preview/keymới |
| UNAUTHENTICATED /401 | expired/invalidfixtureownercredential, futuretrustedidentityfail | khóaqueries/submits, clear sensitiveview, giữdraft theo policyclient; reauthfixturekhôngrealSSO; khôngauto retryfinance |
| FORBIDDEN /403 | workspace/object/tool không đượcownerdevice phép | nofinancialDTO/evidence, displaydenied; khôngtựswitchworkspace từprompt |
| NOT_FOUND /404 | authorizedworkspace không cóobject hoặcobjectẩn theo policy | detailunavailable+Back; khôngeraseledger; crossworkspace khôngbáotênobject |
| VERSION_CONFLICT /409 | expectedworkspace/object/snapshot khôngcurrent | refetch, giữinput, previewlại vàkeymới; khôngoverwritechanges |
| IDEMPOTENCY_CONFLICT /409 | samekey/operation reused with differentsemanticpayload | showreason, khôngretrykeycũ; payloadfix→keymới; originalresultunchanged |
| PREVIEW_EXPIRED /409 | mockTTL10min hoặcpolicyboundary expiry | giữdraft, newpreview/newkey; khôngautoconfirm |
| PREVIEW_MISMATCH /409 | wrongowner/workspace/operation/digest/selectedsubset/token | nojob/entry, reloadpreview; đừngtin tokenclient |
| CURSOR_INVALID /409 | cursorfilter/snapshot/expiry/auth mismatch | clearcursor→page1samefilter; reportkhôngđổi theo page |
| RATE_LIMITED /429 | mockquota/servicebackpressure | retryAfterSeconds30fixture, no paidfallback; giữinput/samekey |
| TIMEOUT /local0 | Abort deadline5s; server outcomeunknown | queryjob/message hoặcretrysamekey; chưasuccess; khôngnewpost |
| OFFLINE /local0 | no network | preservedraft+lastcacheddata stale; retryonrequestsamekey |
| SERVICE_UNAVAILABLE /503 | mockservice/parserfault trướccommit | boundedretry samekey; sourcequote/lastSuccess giữ; failedjobcommittedIDs[] |
| CANCELLED /local0 | client queryabort hoặccancel localprecommit | nofake result; nếucommitrequestđãrời client outcomeunknown, querykey/jobcheck |
| SECURITY_TRANSPORT_NOT_VERIFIED /local0 | protectedadapter closed | chặnrealdata, nofetch/fallback; khôngchoUI “bỏ qua” |

Domain state errors (NO_DATA/TOOL_FAILED/QUOTA/CONTEXT_STALE/INSUFFICIENT_CASH/REFUND_LIMIT) đượcmap422/429/409/Message.errorCode như operation semantics; không arbitrary500dump. AIMessage failed/cancelled córesultnull, không coi completedempty0. Source.errorCode independent connection/freshness. Jobs failed errorCodes giữsafeclassification.

## Auth/rights model

| Actor / assertion | Read / write | Trust và giới hạn |
|---|---|---|
| Enrolledownerdevice / validownersession | Chỉworkspace/member refs đượctrustedregistry cho phép; ownerfinancialCRUD/Review/PlanGoalSim/chat theo operation/state | authorization ởapprovedruntime, cryptobinddevice/channel+principal; SessionDTO projection khônggrant tựbody |
| Scriptedassistant tool | Chỉauthorized Engine projections ởcapturedcontext, no mutation/rawSQL/secret | inheritsownercontext fromservice, rechecksselectedIDs, allowlist cốđịnh; promptlàuntrusted |
| Ops/Support/admin | Allowlisted servicehealth/availability/ciphertextstorage ops | nofinancialread/decrypt/impersonation/recovery/key-policy selfchange; relay khôngdeserialize logicalDTO |
| Unknown/expired/foreigndevice | No protectedquery/mutation |401/403innerauthorizederror hoặcgenericchannelreject; khôngtươngđương workspaceIdheader |

M2mockcredential `OWNER-DEMO` vàW-DEMO membership explicit, faultscenarios401/403; khôngCSRF/cookie/OIDC thực. Real auth transport/refresh/logout/recovery chưaselected; logicalgetSession khôngthaysecurityPoC. M2resetfixturekhác realuserlogout/deletion. Client masklocal khôngđổi rights, export/analytics ngoài scope.

## Idempotency và version state machine

`unseen → in_progress → committed | failed_before_commit`; workspace/op/key/digest storage insideboundary (encryptedatrest). Concurrent samekey waits/resultpendingjob; differentdigest409. committedsamepayloadreturnsoriginalresultIDs/version evenexpectedversionnowstale; not anotherwrite. failedbeforecommit canretry samepayload/key nếunoeffects; validationbeforeaccept không giữkeypermanent. Transaction atomicallycommitskeyrecord/entries/changes/financialaudit/jobterminal; khôngmarkkeycommitted beforemoneycommit.

Preview và idem khác: token chứng minh proposedpayload/snapshot authorization, keydedupeexecution. Mutation key randomuuid; differentrequestId khôngdifferentpayload; changinganyfields/versions/selectedsubset meansnewpreview/key. Cancelbeforeconfirm noidempotencyrecord. Networkabortafteraccept notrollback; job polling/replaysdetermineoutcome. M1mock replayreturnsoldStore córisk; M2Replyack/monotonicversion +refetch giải quyết, khôngcopyoldSnapshot.

Globalfinancialworkspaceversion increasesonce per financial/domaincommit; object versions incrementaffectedones; chat/jobprocessing versions riêng; nofinancialcommit onpendingjob/preview/chatquery/cancelpanel. Goal/Plan/Simulation versionedobjects mayincrementworkspaceversion forcontextstaleness nhưngactualledger version/effects unchanged. IdempotencyRetention M2memorytillreset; realexpiry/retention vàrollbackresistantcounter chưaapproved. Testcrash/concurrency/restore trongprotectedPoC/M3, protocolfixture chưa thực hiện.

## Identity/bootstrap contract và thực thi auth mock

User bổ sung auth screens. `identity.openapi.json`/`identity-examples.json`/`identity-scenarios.json` exact1.1.0 có6operations pre-auth/signout; `IdentityServices` trong src/contracts/identity.ts. Pre-auth không giảworkspaceId chứng minhowner: authenticate/register/challenge/recovery trước membership. IdentityError có INVALID_CREDENTIALS, EMAIL_INVALID/EXISTS, PASSWORD_POLICY/MISMATCH, CHALLENGE_INVALID/EXPIRED, RESET_INVALID, UNAUTHENTICATED, RATE_LIMITED, TIMEOUT/OFFLINE/UNAVAILABLE và closed-securityerror. Inputs password/token/code là logicalprivate; realbootstrap/sealedtransport/authorityindependentOps vẫnblocked.

Identity UI hiện chạy qua HTTP/MSW6operations, .test only, credential/challenge in memory và sessionmarker30min fake; realauth/email/provider/CSRF/cookie/OIDC chưa implement. Step6network status/error/inputretention tests không chứng minh real identity.

Unknown commit outcome do status0/5xx/malformedreply: frontend giữ EXACT input/options/requestId/key từ lầnconfirm đầu và replay, không dựng từ snapshot mới. Definitive4xx reject được repreview; successrefetch mới release intent. AIcancel500 giữpending/alert/retry; queuedcancel trướcsend không tạoresult. CSV epochdiscardlate response, templatepending lockeditabletextarea; [Results](../testing/contract-test-results.md), [Defects](../testing/defect-log.md).
