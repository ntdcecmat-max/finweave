# Frontend Acceptance Report — M2

TST-FA-001 · v1.0 · 06/10/2026 · **PASS_FRONTEND_SYNTHETIC_MOCK**. Scope-v2/analysis-v2 giữ nguyên 28 REQ/AC hiện hành. Bao phủ Home, Giao dịch, Plan/Goals/mô phỏng, Dữ liệu/Review, Trợ lý AI/chat/history/panel và authentication. Dừng ở M2; không triển khai bước 7–9.

Gate này đánh giá frontend với stateful synthetic mock theo bước 6/§9 playbook. **Real-data integration: BLOCKED_SECURITY_POC**. Kết quả không chứng nhận auth thật, encryption/Anti-Ops, phân phối khóa, provider hay backend storage. Đây là agent tự kiểm và walkthrough; research 0 participants, chưa có user test/UAT/PO sign-off bên ngoài.

## Kết quả thực tế

| Kiểm tra | Kết quả | Evidence |
|---|---|---|
| Typecheck / lint / build | Exit 0 cả ba; lint AST/architecture 6 rules, không phải ESLint; build có chunk warning | [Typecheck](../execution/evidence/step6-typecheck.log), [lint](../execution/evidence/step6-lint-results.json), [build](../execution/evidence/step6-build.log) |
| Unit/domain/HTTP | **99/99** assertions, 14 suites; 0 failed/pending | [Raw unit](../execution/evidence/step6-unit-results.json) |
| Browser full | **54/54 PASS**, 0 skipped/flaky | [Full run](../execution/evidence/step6-browser-results.json) |
| Final AI regression | **8/8 PASS** sau sửa intent/tied report; 7 case trùng full run + 1 case mới | [Regression](../execution/evidence/step6-ai-regression-results.json) |
| Browser coverage cuối | **55 case khác nhau PASS** qua hai lượt trên; không phải một lượt 55 case | [Machine summary](../execution/evidence/step6-acceptance-summary.json) |
| Accessibility/responsive | **72 render, 0 axe violations**, không page overflow; 1440×900, 390×844, 360×844 | [Report](accessibility-responsive-report.md) |
| Contracts / inventory | Exact 1.1.0; 70 business + 6 identity operations; 13 module, 86 actions, 28 REQ/AC | [Contract results](contract-test-results.md), [inventory](../execution/evidence/step6-action-inventory.json) |
| Direct browser / visual | Cash, drill-down, CSV/job/Review, Goals/simulation, AI/history/panel, keyboard và ba widths; 8 references xem lại | [Manual record](../execution/evidence/step6-manual-review.json), [visual report](accessibility-responsive-report.md) |

Lượt full chạy trước chỉnh nhỏ cuối ở scripted AI. Hai thay đổi cuối được kiểm lại bằng 2 unit riêng và 8 browser regression liên quan, trên dist build cuối. Các phần không bị tác động dùng bằng chứng full run. Source test suite hiện có 55 case; có thể chạy lại cả suite bằng lệnh trong handover.

Warm filter measurement: 10 warmups/10 samples, median 44.81ms, p95/max 56.83ms trên Chrome local. Đây có overhead Playwright và chỉ dữ liệu mẫu nhỏ; không chứng minh cold start hoặc production SLO. [Raw measurement](../execution/evidence/step6-performance-results.json).

## Lịch sử lỗi được giữ nguyên

| Run | Kết quả ban đầu / xử lý |
|---|---|
| Run0 | Interrupted vì server4181 không chạy; [environment record](../execution/evidence/step6-run0-environment.json), không dùng làm PASS |
| Initial contract audit | ENOENT do harness copy nhầm baseline path; [failure log](../execution/evidence/step6-contracts-initial-failure.log), sửa và rerun exit0 |
| Browser run1 | **50/51 PASS**, N05 CSV clearing race FAIL; [raw run1](../execution/evidence/step6-browser-run1-results.json), [error context](../execution/evidence/step6-run1-artifacts/network.browser-N05-setup--60302-ID-clearing-CSV-stays-empty/error-context.md) |
| Targeted pilot | **4/4 PASS** sau sửa N05, đồng thời kiểm tie/queued cancel/idle wake; [pilot](../execution/evidence/step6-pilot-results.json) |
| AI test harness đầu | 2 assertion/build lỗi vì test đọc classification sai cấp DTO; [unit failure](../execution/evidence/step6-ai-unit-initial-failure.json), [build failure](../execution/evidence/step6-ai-build-initial-failure.log); sửa test, rerun 99 unit và build PASS |
| Manual AI intent | Câu có “mô phỏng … mục tiêu” chọn goal tool; sửa ưu tiên intent explicit simulation, E11 PASS; ảnh trước sửa giữ nhãn failure trong manual record |

Không thay raw FAIL bằng PASS. [Defect log](defect-log.md) ghi trigger, ảnh hưởng, sửa và regression. Không còn blocker chức năng trong scope frontend mock. P3 tối ưu bundle/cold-start để backlog với tác động; integration security vẫn blocked riêng.

## Scope và giới hạn nghiệm thu

[Runtime matrix](../execution/evidence/step6-runtime-coverage.md) nối toàn bộ 28 REQ/AC → navigation/màn → action/state → oracle/evidence. [Action catalogue](../execution/evidence/step6-action-coverage.md) có 86 semantic actions, phân biệt local UI với query/mutation. Inventory và schema examples không đồng nghĩa mọi tổ hợp trạng thái của mọi action đã được thực thi; case/data ghi rõ mức kiểm thực tế.

Đã kiểm validation, 401/403/409/422/429/500, timeout/offline/retry, submit lặp, lost ACK, stale response/context, mutation/refetch cùng snapshot, actual/planned/simulated/unknown, privacy masking và chart tables. Các lỗi ảnh hưởng tiền, action chính, mất dữ liệu trong phiên hoặc responsive/a11y nghiêm trọng đã sửa và regression. 72 axe render chỉ là các trang đại diện, không certification, screen-reader audit, mobile hardware hoặc cross-browser matrix.

Reload trả financial store về F-COMPLETE; mock auth marker còn hạn có thể tồn tại trong cùng tab. Dữ liệu tiền/jobs/chat là memory; không có durable backend. AI là scripted mock; không provider/LLM thật, public deploy hoặc tài chính thật.

Hồ sơ: [Strategy](test-strategy.md), [Cases/data](test-cases-data.md), [Contracts](contract-test-results.md), [A11y/visual](accessibility-responsive-report.md), [Defects](defect-log.md), [Integration Handover](integration-handover.md), [delivery checks](../execution/evidence/step6-delivery-checks.json), [SHA manifest](../../step6-manifest-sha256.json). Manifest nhận diện gói source/dist/docs/evidence; không phải chữ ký PO. Bàn giao frontend M2 mock và dừng tại M2.
