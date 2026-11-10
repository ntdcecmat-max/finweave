# ADR-015 — Engine chính xác và forecast được đóng băng

09/10/2026 · **ACCEPTED DESIGN theo hướng đã được ủy quyền; implementation NOT RUN**.

## Bối cảnh

Một ledger authority, modular Fastify/TypeScript và J2 đã chọn. Frontend có decimal selectors, Plan–Goals và forecast dài hạn với Monte Carlo; API002 mới bao phủ short Plan forecast/simple Goal simulation, chưa có settings/result/run tương ứng cho extended forecast. Chép frontend mock sang backend sẽ giữ cả rounding, calendar, dependency và resource assumptions chưa được chứng minh.

## Quyết định

- Shared pure Engine: actual/funding dùng exact decimal/scaled integer; calendar Việt Nam, immutable source refs và consistent snapshots. Không controller/SQL/UI tự tính một balance khác. Candidate decimal.js context riêng, không global mutation; package/precision/interop phải kiểm trước pin.
- Posting group sealed, opening đúng một lần, exact reversal/replacement, clearing cho transfer thiếu chân, refund cap dưới locks. Quantity set/delta theo lịch sử, giá/quantity/cash tách biệt; unknown khác0.
- Plan/Goals giữ toàn bộ capability. Shared account funding/pro-rata deterministic, active actual matching qua family/scope/revisions; owner confirm atomic chỉ thay planning. Agent read/simulate/draft, không actual/confirmation.
- Extended forecast giữ mọi settings/presets và tiêu chí hiện tại, nhưng version daily grid/RNG/rounding/baseline/Plan replacement. Probability là conditional simulation, có sample size/missing/assumptions, không actual đạt Goal hoặc forecast thị trường đã calibration.
- Thêm async forecast runs/pages qua J2 hiện có; private compute-only ForecastWorker, frozen input/checkpoint/results, publication atomic và paging bounded. API003151operations/626schemas, DB00486bảng/988cột/161FK. Giữ nguyên prior packages và source frontend.

## Alternatives và hệ quả

Client-only forecast có thể tiếp tục làm preview, nhưng không làm authority chung cho web/mobile/Agent hoặc persistent run history. HTTP synchronous whole forecast không được chọn vì horizon/trials/Goals có thể tốn CPU; chưa benchmark, không suy freeVM đủ vì chạy được mock. Forecast service/queue/DB riêng làm phức tạp consistency, không cần ở giai đoạn này.

Mọi output của new Engine khác prototype phải có rule/version và integration test trước thay UI. API003 chưa phát hành/implement; schema cũ không đổi nhưng exact revision headers và4operation mới cần adapter/registry. Request budgets/backpressure không được silently cắt tính năng, horizon hoặc số trials. T1 và security/recovery ARCH-07 tiếp tục áp dụng; không phát sinh tài nguyên hoặc chi phí.

## Kiểm chứng

[Engine/domain](../../domain/README.md), [acceptance](../../domain/acceptance-plan.md), [API003](../../contracts/v2-t1-r3/README.md), [DB004](../../data/target-t1-domain/README.md), [báo cáo](../ARCH-08-change-report.md). Fraction/integer/calendar oracle chỉ kiểm expected vectors độc lập; production Engine/SQL/concurrency/Monte Carlo/performance/security/native/UAT vẫn NOT RUN. Tiếp ARCH-09 Async/sync.
