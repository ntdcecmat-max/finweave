# Contract Test Results — logical API 1.1.0

TST-CTR-001 · v1.0 · 06/10/2026. [Raw Vitest](../execution/evidence/step6-unit-results.json) ghi **99/99** assertions PASS, 14 suites, 0failed/pending. Đây gồm domain/auth/contracts/repository/HTTP, không phải99endpointcases. [Contract audit log](../execution/evidence/step6-contracts.log) exit0 sau sửa portablebaseline path; [initial audit failure](../execution/evidence/step6-contracts-initial-failure.log) retained.

| Kiểm | Kết quả thực tế / giới hạn |
|---|---|
| Schema/examples | Every70business operations request/result +6identity schema examples;64baseschemas và resolvableOpenAPI paths; invalidrequired/extrakeys/decimal/date/unknown contradictions reject |
| Money/business | Opening/ledger/refund/transfer/fee/correction/delta/manualoverride/holdings/goldFX/rounding; planned/goalscapacity/shortfall/simulationactualseparation; rollback/no partialcommit |
| Ownership/auth | Mocksession mandatory, wrong/expired credentials/challenge, foreignworkspace/record denied; synthetic .test registration/reset rules. Not productionauthenticationproof |
| Conflict/idempotency | Preview token/TTL/input mismatch, object/workspace version, competingmutation serialization; replay originalACK; changedpayloadsamekey rejected; stalecursor/filterversion rejected |
| Import/AI async | RawSHA/mapping/staging/subset202job atomic/replay; failedjob noeventids; cancellation/resultstate/no metrics onfailure; frozencontext/evidence/read-onlytool denial; historypagination |
| Actual fetch | MSW networkDTO → commit→refetch same snapshot; 503/401/errors nofixturefallback; protectedadapter nofetch |
| Step6 added12boundary +2scripted assertions | 6HTTP statuses401/403/409/422/429/500, HTML500 serverclassification;4independent corruptions of contractVersion/requestId/schema/workspaceVersion; lostACK replay exactrequest even after anothermutation; explicit simulation intent/classification and tied spending summary |

Static audit found28currentREQ/AC,13modules/16businessroutes/7authroutes/86actions,70business+6identityops and24legacycommandkinds allmapped. Original5inputs +dependencylock SHA unchanged. This demonstrates declaredcoverage/contracts, not execution of everyoperation/state permutation. Browser results supply user-visiblevalidation/error/retry/commit states; [Cases/data](test-cases-data.md), [Acceptance](frontend-acceptance-report.md).

Plaintext mocknetwork transports synthetic fixtures only. Logicalv1.1.0 is not proof candidateprotected0.1 ready, encrypted or safe for realfinancialdata; SEC-REAL remains blocked. No realbackend/provider/LLM/auth/storage integration test ran.
