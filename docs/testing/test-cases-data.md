# Test Cases và Data — M2

TST-CASE-001 · v1.0 · 06/10/2026. [28 REQ/AC runtime matrix](../execution/evidence/step6-runtime-coverage.md) và [13 module/86 actions](../execution/evidence/step6-action-coverage.md) là index scope; raw JSON ghi từng assertion thực chạy. Không claim exhaustive mọi tổ hợp của 86 actions.

## Oracles và isolation

F-COMPLETE: bank26.500.000₫ + wallet1.750.000₫ + cash2.850.000₫ = cash31.100.000₫. Stock100×50.000=5m; gold5chỉ×8m=40m; assets76.1m. Income10m, gross1.1m, refund0.2m, net0.9m, flow9.1m. Ăn uống400k và mua sắm net400k đồng hạng, mua sắm gross600k/refund200k; không gán tùy tiện một nhóm lớn hơn. Ghi expense50k từ cash: cash31.05m, assets76.05m, gross1.15m/net0.95m, food450k; cash account2.8m, chỉ một event.

F-EMPTY/F-BASE cho setup/opening, F-MISSING cho giá/FX unknown, F-STALE cho quantity/quote/source riêng, F-PENDING cho draft, F-TRANSFER cho một leg nghi vấn. Reset clears filters/privacy/forms/jobs/AI; fresh Playwright context và fake auth mỗi case. Dates dùng October2026/+07; tiền decimal string VND integer ledger, Decimal arithmetic/half-up per holding; unknown dùng null+reason, không zero.

## Case groups hiện hành

| Cases / source | Preconditions và thao tác | Expected states/oracle | Coverage |
|---|---|---|---|
| B01–06 walkthrough.browser | Setup tài khoản/tài sản; ledger/CSV/count/quote; duplicate/refund/transfer/evidence | Validation/cancel/history; delta atomic; refund giảm net; transfer không expense; source fail giữ quote; unknown labels | AC01–16,20 |
| B07–09 | Plan CRUD/match/unlink; Goals allocate/release/shortfall; save/consume/invest simulation | Planned không đổi actual; allocated≠funded; capacity reject; dated frozen result; no fake success | AC22–26 |
| B10–11,B18–19 | AI read-only/scripted/context/history/panel và keyboard | Denied mutation; references/time/unit; stale captured context; shared conversation; focus trap/Escape/return | AC19,21,27–28 |
| B12×3,B13×2,B21 | Every business tab + /design at 3 widths, auth separate; mobile dialogs; reduced motion | No critical/serious axe/page overflow; table alternative; masking removes chart/financial text; target/focus checks | AC17–19,28 |
| B14–16,B20 | Holding/FX/cost/quantity, source revoke/refresh, errors; contribution/simulation/Review supplement | Same snapshot; history/version/retained data; no cash from cost or planned contribution | AC04–07,10,12,16,22,24,26 |
| B17 performance | Warm filter/period measurement | Record actual performance; không production cold-start/SLO claim | NFR performance |
| N01–03 | API preview→confirm double click; offline/timeout then recovery; import202 job/replay | Submit latch; input retained; exactly one commit; status pending/running/completed; retry same job/key | AC06,08,12–13,18 |
| N04–07 | AI cancel/history/pagination/context; new bank generated ID + CSV | Server cancellation; 12 messages/page10+more; correct filter context; emptyCSV stays empty | AC02,06,27–28 |
| AUTH-UI01…08 | Deep link/login/wrong code/register/recovery/signout/expired/denied; 7 views×3widths | Allowlist redirect, field errors, mock session only; logout clears forms/chat/cache; no foreign workspace | Auth bổ sung; không renumber AC |
| S6-E01×6 | Inject preview 401/403/409/422/429/500; preserve amount50k; retry | Honest error, no preview/success; same input; recovery commit cash31.05m | API failure/retry, AC08/12/17 |
| S6-E02 | Real Abort timeout5s while preview; retry | No commit on timeout; input retained; once-only mutation after recovery | Timeout/submit |
| S6-E03 | Commit succeeds at worker, client loses ACK; retry | Unknown-outcome label; cannot generate different request; identical body/key; single event and cash31.05m | Idempotency/no double money |
| S6-E04 | Delay AI food result; switch transaction category Shopping | Captured Food150k remains captured/stale; current filter unaffected | Stale response/context |
| S6-E05 | Delay CSV preview; change raw input | Old preview discarded; new1row preview; no hidden old subset | Stale response/data |
| S6-E06 | Delay financial preview while form pending | Inputs disabled; confirmation uses exact originalamount | Submit/preview race |
| S6-E07 | Server AI cancel500 then retrycancel | Pending retained, error announces unconfirmed cancel; recovery clears pending; no fake cancellation | AI error recovery |
| S6-HTTP/CONTRACT/RETRY unit | 6 statuses; HTML500; mutate4 response dimensions; lostACK plus intervening mutation | Retry metadata, API502 for invalidsuccess; original request replay exact; no invalidStore/no fixturefallback | Boundary/security/financial |

Source tests are executable cases, not screenshots only. [Strategy](test-strategy.md) sets exit criteria; [raw unit](../execution/evidence/step6-unit-results.json) lists independent domain/protocol oracles; [raw browser](../execution/evidence/step6-browser-results.json) lists actual runtime outcomes.

S6-E08 kiểm mọi leader đồnghạng400k rồi recompute Food450k aftercash50k; E09 queuedcancel trướcsendACK giữ0sendrequest, câu sau hoạtđộng; E10 actual21sidle, workerwake cùngledger/session, requestData thenexpense20k yields31.03m, khôngreload. S6-E11 thêm prompt explicit mô phỏng có từ tài sản/mục tiêu/kế hoạch: cash simulated26.1m/assets71.1m, actual31.1m unchanged; report gọi cả Food/Shopping đồnghạng400k. Two scripted-acceptance units cover routing/classification and tie independently. Latest55 distinct PASS = full54 + finalAI8 (7overlap,1new); [AI regression](../execution/evidence/step6-ai-regression-results.json). Current source suite55cases; raw results record actual runs.
