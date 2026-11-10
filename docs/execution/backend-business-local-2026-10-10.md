# BE-05/09/10/11/12/13 — API/database thực thi

10/10/2026 · **LOCAL_API_DATABASE_TESTED_PASS · FW-BUSINESS-001**. 49 API operations và 223 schemas trong [contract thực thi](../contracts/local-business/README.md); migration 007, owner/RLS và workers PostgreSQL chạy thật. Không thêm màn Báo cáo; Home/report/portfolio là các projections tích hợp dùng cùng snapshot. [Mapping đủ 41 AC](backend-business-ac41.csv) và [summary máy đọc](backend-business-summary.json).

## Hành vi đã triển khai

| Gói | API/database và invariant |
| --- | --- |
| BE-05 | Home/overview/spending/portfolio/insights, immutable facts/version và recorded clock; card/chart/table/detail, scope, period, category, effective movement/quote/FX và paging cùng snapshot. Missing totals null, known subtotal riêng; partial cash scope không gán holdings tùy tiện. |
| BE-09 | UTF-8 CSV signed/debit-credit mapping, staging/evidence, preview24h, selection, confirmation, J2 atomic posting, exact/ref dedupe, invalid/collision Review, jobs/history và bounded retry với selected pins giữ nguyên. |
| BE-10 | Evidence/history/owner authorization; defer, post/reject pending, duplicate canonical merge, invalid supplement/dismiss, one-leg transfer confirm, refund link/cap, unknown adjustment/forgotten expense, quality acknowledgement và category override. |
| BE-11 | Plan CRUD/archive/version/history; anchored monthly/once occurrences; eligible actual family link/unlink, correction/reversal/refund lineage, remaining/overspend và investment forecast. Planned không posting actual. |
| BE-12 | Goal create/update/schedule, allocate/release/progress/shortfall/achieve/archive/history; shared account capacity, exact stable-ID pro-rata; valid actual không bị allocation chặn. Savings/assets/independence và liquidity AND dùng actual hoặc explicit owner declarations. |
| BE-13 | Daily save/consume/invest, comparisons, frozen outputs/history; conditional Monte Carlo with/without Plan, shared competing Goals, baseline coverage, debt/stress/inflation, frozen inputs/seed/model/runtime/digest và hash mã tính; worker thread, daily residual checkpoints, cancellation/replay/recovery và atomic paged publish. |

Migration 007 bổ sung fw_business và typed worker ports, không sửa historical API005/DB005/native003. JSON money là exact integer strings; simulation rate factors dùng fixed-scale approximation có giới hạn. Goal allocations không sửa ledger; actual expense tạo balance âm vẫn hợp lệ. Database chặn sửa snapshot/evidence/simulation/input/result/checkpoint. Snapshot quantity/ledger/allocation serialization tránh JSON Number mất precision trên 2^53.

## Kiểm chứng

- [Typecheck/pins/unit](evidence/backend-business-local-2026-10-10/checks-1791619599417.json): 47/47 tests PASS, gồm 15 paths kiểm bởi Python Fraction oracle độc lập (không import Engine), exact pro-rata, leap/day31, rational daily residuals, unknown baseline, competing Goals và checkpoint equivalence.
- [Business integration](evidence/backend-business-local-2026-10-10/business-1791619660758.json): 23 nhóm PASS. Có injected failure ở posting thứ hai chứng minh import rollback toàn selected set; TTL/dedupe/stale confirm/retry/replay; allocations race và actual giảm capacity; mọi nhóm Review; lifecycle/history/evidence; forecast restart bằng checkpoint cho kết quả bằng chạy liền mạch; active cancellation; cursor/tenant/epoch fences; frozen-input/result SQL rejection.
- [Financial regression](evidence/backend-finance-local-2026-10-09/finance-1791619659004.json): 19 nhóm PASS, oracle Python Decimal độc lập, lost COMMIT acknowledgement, concurrent refund cap trên hai PG backends, exact balances/quantity/HALF_UP/FX và atomic investment rollback.
- [Async/source regression](evidence/backend-async-local-2026-10-09/async-1791619651582.json): 17 nhóm PASS, crash/retry/lease/quota/scheduler/recovery và owner fences. Fixture holding khai báo quantity rõ; missing quantity không tự được coi zero.
- [Auth/runtime](evidence/backend-auth-local-2026-10-09/runtime-1791619655376.json): 19 nhóm PASS, cookies/CSRF, native-shaped signed credentials, replay trước stale nhưng sau current authorization, Ops isolation và recovery witness.

- [Persistent TCP smoke](evidence/backend-business-local-2026-10-10/local-smoke-1791619730403.json): User API tại http://127.0.0.1:4310 cùng ingestion/forecast processes riêng; CSV ghi2events, cash1090VND, funded200VND, simulation không ghi actual và forecast succeeded.

Evidence lưu source hashes, Node24.19.0 và PostgreSQL16.14; các integration clusters được dừng sau test. Các lần FAIL trước vẫn giữ để truy vết; các links ở trên chỉ tới lần PASS cuối. Replay/cancellation không tạo run mới hoặc cash effects. Public API validate request/reply trước commit; workers chỉ nhận dữ liệu qua narrow live-ticket SQL ports.

## Contract và sử dụng

[Hướng dẫn chạy](../../finweave-backend/BUSINESS.md), [OpenAPI](../contracts/local-business/openapi.json), [runtime policy](../contracts/local-business/runtime-policy.json). Header base API005 giữ nguyên; response thêm X-FW-Business-Revision. Local extension có retry/history/comparison/input-list/coverage ports và optional snapshot context cho details/Plan/Goal lists. Presentation source timestamps có thể null khi chưa có attempt/success, không bịa một lần sync.

Run forecast giữ inputs cả khi failed/cancelled/expired; supervisor và compute thread kiểm hash byte mã Engine/adapter cùng Node runtime, không resume dưới bản mã khác. Legacy inputs không có hash giữ lịch sử và fail rõ khi execute; pages dùng cursor HMAC owner/workspace/run/digest/index/expiry. Selected Goals là output filter; những Goal khác dùng cùng nguồn vẫn được tính khi chia funding. Baseline không suy coverage từ calendar/notification silence. Forecast thiếu recurring inputs không hiển thị các tiền tương lai giả như known zero hoặc full probability.

Bounded worker có một thread/profile, heartbeat riêng, checkpoint sau tối đa1,9s/10.000 trial-days, parts/pages≤256KiB và≤12 points/page. Runtime admission tối đa360months/1.000trials/50outputGoals; attempt600s/deadline24h. Bộ test xác nhận bounds, cancellation của run360months và resume; chưa dùng kết quả này để chứng nhận capacity của tổ hợp lớn nhất1.000trials×360months×50Goals trên mọi host/ARM64. Budget failure giữ failed rõ, không giảm fidelity hoặc publish paths dở.

## Mapping 41 AC

CSV giữ nguyên AC-01…41 và REQ tương ứng; mỗi row có package, operations, storage, evidence và remaining. 16 parent rows có local business implementation evidence; các rows khác có tested dependency/partial support hoặc rõ ngoài phạm vi yêu cầu. **Không đổi 41 parent AC thành full UAT accepted**: Assistant/Agent, Android APK/device, real providers, adapters web/native, operational release/restore và UAT thuộc các BE khác vẫn cần nghiệm thu riêng. Không dùng synthetic runtime làm evidence real financial deployment.
