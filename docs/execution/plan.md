> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# FinWeave — Kế hoạch execution bước 3–5

EXE-PLAN-001 · v2.2 · 06/10/2026 · scope-v2 / analysis-v2; M1-v0.1 · in-review. Owner AG; PO formal review pending. D-23 thay giới hạn nhiệm vụ bước 2 cũ; scope, 28 REQ/AC và oracle hiện hành giữ nguyên.

| Trường | Giá trị hiện hành |
|---|---|
| Nguồn | Ba tài liệu FinWeave, navigations.md, hồ sơ bước1–2/docs/execution và quy định workspace; Tech Stack là cấu hình tham khảo |
| TARGET_LEVEL / STEP_RANGE | Thực hiện đủ bước3 để đạt M1, đánh giá gate và dừng |
| FEATURE_SCOPE | Ngân hàng/ví, cash, cổ phiếu, vàng; setup/cập nhật/giao dịch/theo dõi/Review; Home/Báo cáo/Insights, Plan/actual tracking, Goals/mô phỏng, AI chat/history và panel contextual |
| NAVIGATION | Đúng5: Home (Tổng hợp/Báo cáo/Tài khoản & Tài sản), Giao dịch, Plan, Dữ liệu (Nguồn/Review), Trợ lý AI; Settings qua profile |
| DATA_MODE / quyền | Local synthetic, browser review/tests, viết code/design/execution; không nguồn/LLM thật, paid service hoặc public deployment |
| Stack / app | ADR-001 trước scaffold; React/Vite/TS/Router/CSS/Radix/RHF/Zod/Query/Decimal/ECharts/MSW; finweave-web; 21 direct pins và package-lock |
| Ngoài phạm vi | Budget độc lập nâng cao, Alerts, nợ/thẻ/BĐS/đa tiền tệ tài khoản/collector/trade engine đầy đủ; không khôi phục exclusions Goals/AI cũ |

## Thứ tự thực hiện và kết quả

1. Đọc input hiện hành, kiểm kê code/runtime/rules; trực tiếp xem toàn bộ40 ảnh References và lập catalogue. Không có app/AGENTS hay stack đã chốt. Chọn frontend bằng ADR, kiểm official docs/peer/engine/license và exact versions.
2. Viết design v0.1 cụ thể: financial hierarchy/style/tokens/components, IA/flows/wireframes/UX/UI/frontend/a11y, research plan. Dựng /design với tokens/components chạy được trước triển khai diện rộng; render → browser review → sửa và ghi decision log.
3. Xây toàn bộ5navigation từ scope/use cases/rules; domain synthetic cùng snapshot, charts/table/drill, form preview/confirm/cancel, Review, Plan/Goals/simulation, AI shared context/history và privacy/reset. Mock service chỉ là seam tái dùng M2, không công bố gate M2.
4. Tự walkthrough đúng tác vụ setup→cash→source import→Tổng hợp→giao dịch→nghi vấn; thêm Plan/Goal/Simulation/AI/context/failed states. Kiểm3viewport/keyboard/mask/reduced motion, sửa lỗi; 28 unit và24 browser cases; coverage28AC, ảnh/raw results/performance.
5. Cập nhật RTM/backlog/register/progress, validation report và hướng dẫn mở; đóng gói code/dist/docs/notices. Bản outputs là snapshot bàn giao; code và hồ sơ thay đổi đồng bộ project nguồn, giữ các nguồn gốc và archive.
6. Gate M1 PASS qua Agent self-review; dừng M1. BL-11 participant research chưa thực hiện (0 người), không tạo Results giả. M2/M3/FUT chỉ kế hoạch tương lai.

## DoR / DoD và gate

DoR: baseline scope-v2/analysis-v2 có28AC/28UC/28SCN+14nhánh/36BR/22DR/15NFR; user giao bước3 và cho chủ động chọn thiết kế. OD-02/03/04/08/09 được giữ là giả định demo, không cần PO duyệt từng màn để tiếp tục.

DoD M1: prototype local mở lại được; đủ5navigation và28AC có action/state/evidence; số và nhãn actual/planned/simulated/unknown nhất quán; charts có source/time/unit/table/drill; form có lỗi/hủy/kết quả; a11y/keyboard/responsive/privacy được kiểm; lỗi quan trọng tìm thấy đã sửa hoặc giới hạn ghi rõ. Design docs cập nhật theo render, snippet lấy từ code thật. Research status trung thực. Formal PO acceptance vẫn pending, không tự biến AG thành reviewer độc lập.

Nguồn kết quả: [Validation/Gate](../design/validation-report.md), [Coverage](evidence/m1-coverage.md), [ADR](../architecture/adr/ADR-001-frontend.md), [RTM](traceability.md), [Register](../governance/artifact-register.md), [Progress](progress.md), [Demo](evidence/demo-script.md).

## Nhiệm vụ hiện hành: bước4 / v2.2

D-30 supersedes stopM1cho nhiệm vụ mới. Đã kiểm lạicode/runtime/ADR/tokens/components,/design vàscope28REQ/AC; formal contracts/DTO/services/scenarios/securityadapterboundary; HLD/views/LLD/data/FileEvent/mapping/error/auth/idempotency; screenbehaviors; userbổsungauth+allmodulecatalogue đãimplementmock. Chạy schema/unit/type/build/authbrowser vàfullfinancialregression,3viewports/keyboard/privacy/axe; register/RTM/progress/evidence cậpnhật. Không chọn backend/làmapp2/clone/deploy/paid, không realdata. Gatebước4 dựaEVD-S4-001; M2 cầnbước5statefulmockservicewiring vàbước6integration, securityrealgate riêngblocked.

## Nhiệm vụ hiện hành: bước 5 / v2.3

User giao frontend đầy đủ với mock trong scope M2. Đã thực hiện wiring hooks/services/API/MSW, đồng bộ snapshot, preview/commit/retry/reset, import staging/job và AI scripted/history/panel, auth network. Tái dùng stack và design hiện hành. Hoàn thành tự walkthrough/regression, sửa lỗi, bàn giao source, components, mock, manifest/lock, configuration, scripts và tài liệu. [Report bước 5](evidence/step5-validation-report.md) ghi kết quả thật và giới hạn. Dừng sau bước 5; bước 6 và gate M2 chính thức chưa thực hiện.
