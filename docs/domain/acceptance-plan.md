# ARCH-08 — Acceptance và traceability

**ALL 30 RUNTIME CASES NOT RUN**. Các case dưới áp dụng production backend/SQL, không phải kết quả chạy frontend. Oracle độc lập chỉ kiểm phép tính trong [golden vectors](golden-vectors.json); [kết quả oracle](../execution/evidence/arch-08-domain-2026-10-09/oracle-results.json) không chứng minh Engine đã implement.

| Case / requirement | Test bắt buộc | Expected |
| --- | --- | --- |
| DOM-01 / ENG-01 | Raw Number/NaN/fractional VND/exponent/scale/range qua API và raw SQL boundary | Reject trước cast; exact strings, không silent round |
| DOM-02 / ENG-02 | Giá trị vượt safe Number; gold/FX product; per-holding half-up; intermediate limits | Đúng unit VND, reject overflow; tổng từ rounded holding values |
| DOM-03 / ENG-03 | UTC→ngày Việt Nam, endExclusive, leap day/date-only CSV/future time | Không timezone máy hoặc giờ bịa; period boundaries đúng |
| DOM-04 / ENG-04 | 31Jan→Feb→Mar, skip months,30năm inclusive, occurrence ID regex/collision | Giữ anchor gốc, không truncate361occurrences hoặc fabricate ID |
| DOM-05 / ENG-05 | Side/unit/profile/FX/history cutoff/zero quantity/missing price | Không future quote/FX hoặc unknown→0;0quantity là0known |
| DOM-06 / ENG-06 | Quote/quantity race, cash subset/portfolio scope, competing Goals, stale cache | Một knowledge version; pins giữ history; current auth vẫn áp dụng |
| DOM-07 / ENG-07 | Opening migration/double posting/zero opening/missing baseline/coverage gaps | Posted once, không income; không fabricate0 cho unknown |
| DOM-08 / ENG-08 | Empty/unbalanced/building commit; append cân bằng vào sealed; raw SQL writes | Deferred integrity và immutability guards deny; một ledger authority |
| DOM-09 / ENG-09 | One-leg/late receive/second evidence; fee của draft/pending; selected scope | Không destination double-credit, fee không tự posted, flow đúngscope |
| DOM-10 / ENG-10 | Unknown receipt→linked refund, crossmonth, cap race, account mismatch | Không tăng cash lần2; nhận đúng kỳ; refund cap serialized |
| DOM-11 / ENG-11 | Exact reversal/replacement, refunds dependents, reimport category override | Atomic/history/replay; không xóa original hoặc reverse2lần |
| DOM-12 / ENG-12 | Backdated set vs purchase, same-date sequence, negative suffix/cost coverage | Rebuild ordered facts; không sum after-values hoặc invent P/L |
| DOM-13 / ENG-13 | Selected import rollback, notification retry/semantic duplicate/ambiguous observations | Một posting port; ACK≠posted; Review thay suy đoán |
| DOM-14 / ENG-14 | Plan-only/Goal-first/standalone, mixed item baselines, frozen revisions | Snapshot chung; không lấy baseline item đầu hoặc bareplanVersion |
| DOM-15 / ENG-15 | Same family across revisions/occurrences, reversal/refund/replacement, unlink | Không duplicate match; signedactual/remaining/overspend đúng |
| DOM-16 / ENG-16 | Nhiều Goals cạnh tranh, negative/unknown balance, archive account/Goal | Không cash writes; current eligibility; actual không bị chặn vì earmark |
| DOM-17 / ENG-17 | IDs khác query order, unequal amounts/capacity/range; stable-ID remainder | Tổng funded=capacity; từng phần≤allocation; không float |
| DOM-18 / ENG-18 | Schedules/skip months/linked planned expense, competing Goals cùng nguồn | Requested khác feasible; không double-spend/contribution thành income |
| DOM-19 / ENG-19 | Savings/assets/independence, liquidity AND, unknown debt, declined funding | Current actual/declared refs; probability không mark achieved |
| DOM-20 / ENG-20 | Stale/competing Goal bundle, Agent escalation, confirmation atomic faults | Draft-only; owner confirm planning, không actual |
| DOM-21 / ENG-21 | Tất cả settings/presets, bounds, missing/partial coverage, null debt vs0 | Giữ capability; no silentclamp/defaults, giả định có nguồn |
| DOM-22 / ENG-22 | Recurring replacement vs oneoff, overdue policy, interval qua tháng | Không doublecount baseline; daily proration đúngmonth; assumptions rõ |
| DOM-23 / ENG-23 | Common random streams, thêm chart/Goal dates, one-time stress, zero vol | Reproducible pinned model/tolerance; không calibrated market claim |
| DOM-24 / ENG-24 | Principal cap/interest, cash pools on/off, reserve/allocation competition | Không vay/bán tự động; netWorth không trừ principal2lần |
| DOM-25 / ENG-25 | Incomplete paths, missing prices/debt, past due/out-of-range, first reach | Null khi thiếu; sample size/assumptions; due pass khác first reach |
| DOM-26 / ENG-26 | J2 chunks/crash/checkpoint/fence, page corruption/expiry, cancel vs finish | Chỉ full publish; no silenttruncation; current auth; no rerun oldkey |
| DOM-27 / ENG-27 | Nhiều PG connections, reverse lock order, nested repository commits | Một checked-outclient; same lock registry, không partial effect |
| DOM-28 / ENG-28 | Response loss after commit, samekey differentinput, stale preview retry | Current auth trước replay; samekey exactly same effect, no autobumpversions |
| DOM-29 / ENG-29 | Provider call giữa transactions, stale completion, two commits mixed read | Không network khi locks; snapshot consistent; current fences thắng |
| DOM-30 / ENG-30 | ProductionEngine vs independent vectors; actualSQL constraints/restore/faults | PASS artifact/oracle không nâng runtime; giữfullscope |

Mỗi runtime case ghi source/API/DB/Engine/model/security hashes, environment/runtime/package versions, input/frozen refs, expected/observed, test role, clock và sanitized evidence. Concurrency cần ít nhất2 DB connections và fault points; không thay bằng sequential unit test. Monte Carlo cần zero-vol analytic checks, deterministic RNG vectors, perturbation/stress/common-random tests, finite/range/quality tests và latency/memory measurement. Không log finance/private digests/raw notification/password/prompt.

Các chỉ tiêu performance/free-VM capacity chưa đo. Golden cases không test distribution calibration, entireforecast, crypto, SQL hoặc quyền. AUTH/SEC/native/source/Agent/UAT gates tiếp tục độc lập; giữ41parentAC, các ENG là refinements không thêm parent requirements.
