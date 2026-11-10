> Baseline v3 — 07/10/2026: yêu cầu anti-Ops trong tài liệu này vẫn giữ và chưa đạt. [ADR-006](../architecture/adr/ADR-006-deployment-trust-profiles.md) làm rõ conventional cloud hiện chỉ synthetic; TRUSTED-SERVER là phương án chưa chọn cho real data. Device/outbox/Agent drafts bổ sung trong [Android](../architecture/android-collector.md), [SRS](../requirements/srs.md) và [Agent spec](../product/ai-agent-specification.md). Không có crypto/code change trong lượt này.

# Security Design & PoC Gate v0.1

ARC-SEC-001 · 06/10/2026 · design/threat model only; security PoC NOT EXECUTED, real data NOT READY. Ideas§15–16/NFR-07/08/15/DEP-04 kiểm soát thiết kế. Auth UI scripted mock không xác minh crypto, tenant isolation, recovery hay chống Ops.

## Assets/trust boundary

Sensitive: accounts/amounts/events/descriptions/categories/holdings/quantities/quoteslinkedpositions/goals/Plan/cases/rawfiles/report/cache/financialaudit/prompt/toolresult/sourcekeys/ownercredentials. Ownerdevice vàapprovedprotectedprocessor xemplaintext đểthực hiện nghiệp vụ. Gateway/Ops/Support/DBA/storage/backup/cachequeue khôngtrustedplaintextholders. Trustroots code signing/keyrelease/identityenrollment phải độc lậpOps, chưa chọnauthority/hạ tầng/ngân sách. Vendorconfidentialcomputing capability khôngevidenceFinWeaveconfiguration.

| Threat / ID | Required control | PoC evidence / trạng thái |
|---|---|---|
| SEC-01 Ops đọc DB/files/backup/cache/report | Ciphertext-only atrest; DEKworkspace wrapped by KEKpolicy; metadataallowlist; encryptedreports/staging/audit | canaryplaintext scan DB/objectstorage/snapshots/caches/queues, denieddecryptbyOps — NOT RUN |
| SEC-02 Ops proxy TLS/logs/crashdump | Owner-toattestedruntime sealedpayload/result; relayopaqueheaders/URL/envelope; nofinanciallog/traces/heapdump | captureproxy/queues/logs/crashes responses, verifycanary absent; documenttiming/size/channelmetadata — NOT RUN |
| SEC-03 modified/debug/unattestedworkload | approvedmeasurement+freshattestation, independentcoderelease/keypolicy, denydebug; bind channel identity | alteredimage/debug/rollbackmeasurement keyrelease fails; no operator selfapproval — NOT RUN |
| SEC-04 impersonateowner/crossworkspace/tools | trusteddevice registry/sessionverification+workspace/objectcheckinsideboundary; prompt cannotsetidentity | signedinvaliddevice/token/workspace substitution/recovery attacks denied — NOT RUN |
| SEC-05 Ops ships maliciousclient JS | trustedclientdistribution/update signing independentOps, rollback protection, ownerverification | maliciousupdate cannotobtain finance/decrypt/session; browserSPAservingmodelunresolved — BLOCKED |
| SEC-06 nonce/replay/rollback | auditedAEAD/sessionlibrary; AADworkspace/record/schema/version; nonce uniqueness; rollbackresistanttrustedcounter/keyversion | replaycapturedrequests/restoreoldencryptedstate reject or dedupe safely; ciphertexttamperfail — NOT RUN |
| SEC-07 keyrotation/revocation/recovery | workspaceDEK/KEKwrap/keyversions; independentelevatedpolicy; ownerconsent; newdeviceenrollment revocation | rotate/revoke/decrypt deniedOps, restore oldbackups correctauthorizedpolicy, noSupport recoveryreadpath — NOT RUN |
| SEC-08 ingest/query/businesslogicoutsideTEE | parse/match/search/sort/pagination/ledger/report/PlanGoalSim/AItools insideauthorizedboundary | representativeCSV/reports/entrybalance/propertytests run insidePoC, no plaintextintermediate — NOT RUN |
| SEC-09 thirdparty AI/provider leaks | M2scripted noLLM; realprovider/license/quota/egress/retention policy beforeintegration | nooutboundsecrets/promptfixture; realLLMegress/rights NOT SELECTED |
| SEC-10 lifecycle/retention | encryptedstaging/job/history/cache/audit/backups; explicitretention/deletion/restore policy | ownerpolicyapproval+deletion/restoretests; OD-07/09 open — NOT RUN |

## Candidate protocol and storage

Logical finance schemas are innerdata. Publiccandidate transport onlytransportVersion/opaquechannelId/sequence/ciphertext; outershapevalidatedstrictlybutnoencryptionimplemented. ProtectedEnvelopefieldscannotinclude workspace/operation/prompt/amount/csv/key/token. Proposedsequence notrollbackproof byschema; requiresattestedchannel cryptographicbinding, acceptedcounterstorage andtest. Nonce/algorithm/keysize/sessionprotocol intentionallyunselected; useauditedstandardlibraryafterPoC, nohomegrowncrypto.

Withinprotectedruntime session/deviceauthorization→schema/domainvalidation→atomicfinancialoperation→encryptedatrest/result. Keyreleaseidentitymustbindapprovedcode/attestation andownerworkspace rights. Authentication≠attestation; TLS≠privacyfromgateway; columnencryption≠runtimeOpsprotection. EncodedJSON/Base64≠encryptedtransport. Realplaintexterror/log/crashsnippetsprohibited. Publicquotesonlywithoutprivatepositionlinks andlicense verification; currentpricesallsynthetic.

PoC evaluation uses upstreamreferences [Nitro Enclaves](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave.html), [KMS Recipient decrypt](https://docs.aws.amazon.com/kms/latest/APIReference/API_Decrypt.html), [Confidential Space](https://docs.cloud.google.com/confidential-computing/confidential-space/docs/confidential-space-overview). Noproject/resources/paidaccountcreated; candidatevendorfeature notindependenttrustrootpolicy. Backendframework/DB/productionauth/KEKauthority selection waitsPoC.

## Gate SEC-REAL / Ideas§15

Allrequiredconditions currentlyunverified: (1) nofinancialplaintext instorage/backup/cache; (2) Ops/Support denieddecrypt/impersonation/recovery/keypolicyselfchange; (3) modifiedunattestedworkload/keyrelease andclientupdate/enrollmentattacks resisted; (4) gateway/queues/logs/responsesciphertextonlywithdocumentedmetadata; (5) protectedledger/search/reportcorrectness, restore/rotation/replay/rollback tested. Independent reviewer/PO acceptance required beforeclaimingsecuritygate; AGcontracttests are notthesePoCtests.

Currentguard `BlockedProtectedTransport` throwsbeforefetch; testconfirmsclosedpathandallowlistonly. Authscreensmockverifytestemail/password/OTP andlocalfixture states, neverrealcredentials/provider; mockpermissionssynthetic only. Operationalmetrics nofinancialdata realready. M2synthetic Step5/6 mayproceed; realfinancialintegration staysBLOCKEDSEC-REAL, no“laterencryptionwillfit”assumption. Iftrustauthority cannotindependentofOps, redesignratherthanscopeweaken.
