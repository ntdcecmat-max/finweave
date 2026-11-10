# Đối chiếu source phục vụ ARCH-08

**STATIC OBSERVATIONS — KHÔNG CHẠY LẠI FRONTEND HOẶC XÁC NHẬN LỖI RUNTIME.** Các disposition là yêu cầu thiết kế/tích hợp, không phải bản vá source. Frontend synthetic đã nghiệm thu giữ lịch sử; quy tắc backend mới không tự chứng minh frontend hiện sai ở runtime.

| ID | Source | Quan sát | Disposition |
| --- | --- | --- | --- |
| SRC-01 / ENG-01/02 | [selectors.ts:2](../../finweave-web/src/domain/selectors.ts) | Selectors dùng decimal.js precision30 và global context | Kế thừa decimal arithmetic; context riêng và exact coefficient boundaries; không nói mọi frontend đều float |
| SRC-02 / ENG-21/23/25 | [forecast.ts:29](../../finweave-web/src/domain/forecast.ts) | Extended forecast dùng Number/Math và null→0 helper | Không dùng cho actual; dependency quality phải propagateunknown, mô hình/version riêng |
| SRC-03 / ENG-03 | [selectors.ts:7](../../finweave-web/src/domain/selectors.ts) | Quarter/year chứa calendar năm2026 cố định | Backend calendar generalized, timezone/cutoff typed |
| SRC-04 / ENG-03/05 | [selectors.ts:5](../../finweave-web/src/domain/selectors.ts) | day lấy prefixtimestamp, quote chọn theo prefixngày | Timestamp UTC phải đổi business timezone; lịch sử không future fact |
| SRC-05 / ENG-04 | [selectors.ts:23](../../finweave-web/src/domain/selectors.ts) | Recurrence loop có cap360 trong intervalinclusive | Không silently mất occurrence361 ở khoảng30năm inclusive |
| SRC-06 / ENG-14 | [selectors.ts:32](../../finweave-web/src/domain/selectors.ts) | Original forecast dùng baseline item đầu tiên | Freeze snapshot/revision chung, explicit mismatch handling |
| SRC-07 / ENG-09 | [commands.ts:33](../../finweave-web/src/domain/commands.ts) | Fee addEvent không truyền posting của transfer | Backend bundle không post fee khi transferdraft/pending; cần integration test, chưa sửaUI |
| SRC-08 / ENG-15 | [commands.ts:52](../../finweave-web/src/domain/commands.ts) | Prototype one-event→oneplan, targetDB unique hiện theo revision | Thêm family/scope active validation xuyênrevision dưới workspace lock |
| SRC-09 / ENG-22 | [forecast.ts:100](../../finweave-web/src/domain/forecast.ts) | Proration dùng số ngày tháng tại endpoint cho cả interval | Daily/calendar boundaries và residual carry; thêm chartpoint không đổiflows |
| SRC-10 / ENG-23 | [forecast.ts:109](../../finweave-web/src/domain/forecast.ts) | Random stream tuần tự theo dates loop | Versioned date/factor keyed draws và common random counterfactual |
| SRC-11 / ENG-25 | [forecast.ts:168](../../finweave-web/src/domain/forecast.ts) | Past-due success suy từ status achieved, initial firstReach không set ởmeasure | Không suy xác suất dự báo quá khứ; firstReach=now khi initialpass |
| SRC-12 / ENG-21/26 | [forecast-context.tsx:8](../../finweave-web/src/app/forecast-context.tsx) | Forecast settings/local engine chưa có network run lifecycle | API003plannedadapter, frozen result/history/paging across clients |
| SRC-13 / ENG-16/17 | [selectors.ts:36](../../finweave-web/src/domain/selectors.ts) | Current Goal funding chia pro-rata/stableallocationId | Kế thừa rule; exact integer floors/remainders và competing scope closure |
| SRC-14 / ENG-19/20 | [commands.ts:55](../../finweave-web/src/domain/commands.ts) | Actual achieved dùngcriteria/assessment, khôngforecastprobability | Kế thừaactualboundary, server-current snapshot/ownerdeclared inputs và atomic confirm |

API002 getPlanForecast chỉ nhận horizon và trả short forecast; simulateGoalOutcome chỉ mô phỏng save/consume/invest. Chúng không chứa extended settings/bands/counterfactual/run lifecycle. Thêm4operations trong003, giữ schema cũ; xem [consumer delta](../contracts/v2-t1-r3/consumer-delta.md).

Phân biệt kết luận design với behavioral evidence: precision30/globalcontext hoặc Number không tự chứng minh case cụ thể sai; risk phải được test khi tích hợp. Không phục hồi tệp root bị user xóa, sửa dependencies/lockfiles, chạy vendor/model hoặc thay snapshot.
