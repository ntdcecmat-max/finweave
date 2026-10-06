# FinWeave — Context Model

ID REQ-CTX-001 · v2.0 · analysis-v2/scope-v2 · 05/10/2026 · in-review. Agent owner/self-review; PO pending external review. Nguồn: [Scope](../product/scope.md), [Needs](../product/stakeholder-needs.md), Ideas §1/19; ranh giới nghiệp vụ, **không là HLD hay contract API**.

## Ranh giới và actors

Hệ thống hiện phân tích: một workspace demo FinWeave, bốn nhóm tiền/tài sản, dữ liệu giả, VND và Asia/Ho_Chi_Minh. Actor chính **chủ workspace demo**. Actor phụ **nguồn mô phỏng** phát CSV/thông báo/quote/FX; đây là fixture, không provider đã tích hợp. Agent phát triển và chủ sản phẩm là stakeholder quản trị, khác AI Assistant trong sản phẩm (nay đã được chọn M1 demo). Admin/Ops không là actor có quyền đọc tài chính; ở M1 chưa xây bề mặt Ops.

| Interface ID | Bên ngoài → FinWeave / chiều trả | Dữ liệu trao đổi / hành vi | REQ / giới hạn |
|---|---|---|---|
| IF-01 | Chủ workspace ↔ thiết lập tài khoản/holdings | Mốc, opening, loại tiền, ticker+market, lượng/unit/purity → nhãn và giá trị | SET/BANK/CASH-01/STOCK/GOLD; UC setup |
| IF-02 | Chủ workspace ↔ ghi nhận/quản lý | Thu/chi/transfer/refund, count, quantity change, category/lý do → preview/kết quả/lịch sử | MONEY/CASH-02/HOLD/TXN |
| IF-03 | Fixture CSV/thông báo → thu thập; chủ workspace xác nhận | Dòng gốc, parser version, mapping/account → preview, event/evidence hoặc Review | INPUT-01/02; OD-03; không đọc điện thoại thật |
| IF-04 | Fixture giá/FX ↔ định giá | Quote theo mã/thị trường hoặc vàng tương thích, unit/currency/time → valuation/thiếu/cũ | STOCK/GOLD/HOLD/REVIEW-02; OD-04; API giá không cập nhật lượng |
| IF-05 | Chủ workspace ↔ Tổng quan/drill-down/Review | Kỳ/phạm vi/filter/decision → snapshot, căn cứ, tác động, case version | TRACK/REVIEW; IF-02/03 invalidate snapshot |
| IF-06 | Chủ workspace ↔ demo/reset/privacy | Scenario selector/Reset/masking → fixture khôi phục, số được che | UX/DEMO; chỉ local synthetic |
| IF-FUT-01 | Nguồn thật/client/identity → protected boundary tương lai | Transport/auth/secret/license/quyền xử lý | NFR-07/08; OD-05…07; chưa triển khai, không plaintext qua Ops |

ID REQ trong bảng có tiền tố `REQ-`, rút gọn để dễ đọc. Xem [RTM](../execution/traceability.md) cho ID đầy đủ.

## Mô hình luồng logic

| Từ | Qua | Đến / điều kiện |
|---|---|---|
| Khai báo ban đầu | Validation + opening/holding declaration | Account/holding; không income hoặc giao dịch mua giả |
| Form hoặc source record | Chuẩn hóa + provenance + kiểm tra idempotency/matching | Event hợp lệ; dòng thiếu/ambiguous vào Review; missing category vẫn posted được |
| Event posted và movements | Tính toán xác định từ cùng version | Report snapshot → Tổng quan/chart/table → giao dịch/holding/evidence |
| Price/FX | Kiểm tra tương thích/timestamp/unit | Định giá holding; chỉ valuation thay đổi, không tiền/thu–chi |
| Quyết định Review/sửa | Preview + xác nhận version | Liên kết evidence hoặc adjustment; invalidate snapshot liên quan |

M1 thể hiện kết quả đã biết bằng state demo; M2 dự kiến mock API; M3 nguồn sự thật Ledger/Financial Engine trong boundary bảo vệ. Local state không chứng minh database, quyền workspace hay anti-Ops. Có luồng Plan/Goals và AI scripted đọc Engine/results, không actual LLM/Alerts hay Budget advanced. Status nguồn và badge case thuộc lõi; không phải module Alerts.

Các điểm tin cậy: self-declared quantity/count không thành independent verification; source accepted không chứng minh lịch sử đầy đủ; quote mới không chứng minh quantity mới; matching balance không chứng minh từng giao dịch. Rủi ro/owner/dependency: [Risk Register](../product/risk-register.md), [Decisions](../execution/decisions.md). Triển khai M2/M3 cần thay IF-FUT-01 bằng contract được xét privacy ở bước 4/7, không phải công việc bước 2.

## Context bổ sung theo 5 navigation

C chủ workspace thao tác **Home→Giao dịch→Plan→Dữ liệu→Trợ lý AI**, mascot gọi cùng chat ở mọi navigation. Các nguồn fixture vẫn ngoại hệ thống; AI scripted là capability bên trong, không external provider đang chạy. AI Financial Assistant khác Agent phát triển và không Codex Work Pet. Identity/current period/account/holding/planId/caseId được capture thành context có version; user biết scope trước gửi câu hỏi.

| Interface | Luồng / dữ liệu | Ranh giới / truy vết |
|---|---|---|
| IF-07 | C ↔ Home report periods/Insights: selection→snapshot/insight refs→detail/AI | REQ-REPORT-01/INSIGHT-01; DR-16/21; as-of khác movement kỳ, không giá tương lai |
| IF-08 | C ↔ Plan/Goals/Simulation: planned items/allocations/scenario→forecast/actual mapping/progress | REQ-PLAN-01/02/GOAL-01/02/SIM-01; DR-17…20; không commit financial event actual |
| IF-09 | C ↔ full AI chat/mascot ↔ read-only Engine/Plan tools | REQ-AI-01/02; DR-22; whitelist/caller rights/result refs/context; không financial mutation/khuyến nghị đặt lệnh |
| IF-FUT-02 | Protected boundary ↔ LLM được chọn sau provider/privacy review | Chưa tích hợp: OD-09/OD-07/NFR-15, M1 scripted synthetic; không tự gửi tài chính thật/model key |

Snapshot/report và actual events feed Plan read-only; Plan maps actual bằng links, không import event lần2. Simulation dùng frozen baseline và assumptions, tạo simulated result riêng. Goal earmark chỉ quan hệ phân bổ cash, không tài sản mới. Insight/AI kết quả luôn truy về source versions; output AI không quay lại thành nguồn ledger.
