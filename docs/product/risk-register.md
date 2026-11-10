> Baseline v3 — 07/10/2026: nội dung dưới giữ phân tích/quy tắc lịch sử v2. Khi khác phạm vi, ưu tiên [PRD v3](prd.md), [Scope v3](scope.md), [SRS v3](../requirements/srs.md) và [Agent trong Plan/Goals](ai-agent-specification.md). Không dùng giới hạn web/mock/M2 dưới đây làm giới hạn sản phẩm mới; invariant nghiệp vụ và anti-Ops vẫn giữ trừ delta được ghi rõ.

# FinWeave — Risk Register

Ngày 05/10/2026; version2.0, scope-v2. Xác suất và tác động là đánh giá định tính phục vụ lập kế hoạch, chưa đo: thấp/vừa/cao. Owner là vai trò dự kiến, không gán người chưa được chỉ định. Tất cả rủi ro còn theo dõi; biện pháp trong tài liệu chưa chứng minh rủi ro đã được loại bỏ.

| ID | Rủi ro / trigger | Xác suất / tác động / ưu tiên | Owner | Biện pháp, việc liên quan | Phần dư / thời điểm rà soát |
|---|---|---|---|---|---|
| R-01 | Hiểu “prototype” Ideas là phải xây ledger/DB thật trước UI; backlog bắt đầu thêm backend | Cao / cao / P0 | Agent + chủ sản phẩm | Ánh xạ Scope mục 4; D-04; BL-01/02 | Review phạm vi đầu bước 2 và trước xây; M1 chưa đạt |
| R-02 | Thiếu nhóm hoặc chỉ import→dashboard; cash/holdings/Review không có tác vụ | Vừa / cao / P0 | Agent | Matrix 4×5, REQ/AC; BL-02…06 và BL-10 | Rà use cases rồi walkthrough đủ nhóm |
| R-03 | State/chart/detail lệch, transfer/refund/giá bị đếm sai | Cao / cao / P0 | Agent | Oracle độc lập, fixture/reset, rules và scenario; AC-08…15 | Bước 2 rules, bước 3 sau từng mutation; M3 cần Engine thật |
| R-04 | Persona/value hoặc tỷ lệ user test được viết như nghiên cứu đã làm | Vừa / cao / P0 | Agent + chủ sản phẩm | A-01…06 và UP có nhãn; BL-11 chỉ khi có người | Nhu cầu vẫn chưa kiểm chứng nếu chỉ walkthrough |
| R-05 | Unknown/stale/self-declared bị hiểu thành 0/mới/xác minh; vàng quốc tế thành giá thu mua | Vừa / cao / P0 | Agent | Source/time/unit/purity/FX labels, AC-04/05/07/16 | Rà quote và empty/partial totals ở bước 2–3 |
| R-06 | Responsive/keyboard chỉ đẹp ở desktop; mobile form/chart bị cắt | Vừa / vừa / P1 | Agent | AC-17, BL-07/10; focus/error/table thay chart | Kiểm tra thật ở ba viewport khi có prototype |
| R-07 | Mở rộng vượt Plan/Goals/AI đã được user chọn, như Budget advanced/Alerts/backend thật | Cao / cao / P0 | Chủ sản phẩm + Agent | D-19 thay feature scope có truy vết; giữ EXT cho phần chưa được chọn | Kiểm tra mỗi yêu cầu thay đổi; chi phí rework vẫn có thể tăng |
| R-08 | Effort/deadline vượt kỳ vọng; estimate bị coi là báo giá | Vừa / cao / P1 | Chủ sản phẩm + người thực hiện | EST-02 mới TBD; estimate v1 đã superseded, chưa hẹn ngày; tái ước lượng sau UX/stack | Chưa có capacity/actual/đơn giá nên còn bất định |
| R-09 | Provider/key/quota/license không phù hợp SaaS hoặc format thay đổi | Chưa biết / cao / P1 tương lai | Vai trò nguồn chưa chỉ định | DEP-01…03, FUT-04; mock M1, xác minh mẫu/terms trước thật | M3 nguồn chưa được chọn, không cản M1 |
| R-10 | Encryption thông thường bị coi đã chống Ops; transport phải đổi sau M2 | Cao / rất cao / P0 tương lai | Vai trò security chưa chỉ định | OD-07/DEP-04/FUT-02; PoC sớm trước contract; gate Ideas 15 | Chưa có PoC/budget, M3 thật chưa đủ điều kiện |
| R-11 | Dữ liệu thật/key vô tình đưa vào demo/repo/log/LLM | Vừa / cao / P0 | Agent + chủ sản phẩm | CON-03/05/07, synthetic/dummy only; Assistant scripted demo/read-only trong scope, real-data LLM chưa được phép | Kiểm tra fixture/evidence trước chia sẻ; không mở nguồn thật |
| R-12 | Rubric/định dạng bàn giao khác dự kiến, cần làm lại | Chưa biết / vừa / P1 | Chủ sản phẩm | OD-01/UNK-02; hướng web tiếng Việt đã chốt; không suy rubric từ folder | Khi có rubric, đánh giá tác động và cập nhật charter |

Các issue hiện hữu: chưa có app, user research, nguồn tích hợp, security PoC; đây là trạng thái thực tế theo mức chứ chưa là blocker bước 1. Khi trigger xảy ra, ghi defect/issue cụ thể và tác động gate trong progress; không chỉ giảm mức rủi ro vì đã có tài liệu.

## Rủi ro scope-v2

| ID | Trigger / tác động | Owner / biện pháp / thời điểm |
|---|---|---|
| R-13 | Planned/goal/simulation bị cộng vào ledger hoặc tài sản lần2 | AG; BR-28…32, AC-22…26; kiểm tra mỗi mutation và tracking bước 3 |
| R-14 | Chi thực làm nguồn earmarked hụt nhưng goal vẫn đủ/auto xóa allocation | AG; funded vs allocated progress/shortfall; AC-24/25; actual không bị chặn |
| R-15 | Model/context cũ bịa số hoặc lộ dữ liệu trong mascot/history/log | AG, PO chỉ định security/LLM reviewer thật trước tích hợp; scripted M1, read-only tools, result refs/masking; AC-27/28 |
| R-16 | Range lịch sử dùng quote tương lai/thiếu bị coi0, quarterly/yearly chưa đủ thành report đầy đủ | AG; period/as-of/coverage/quote≤asOf, AC-20, NFR-13 |
| R-17 | Gộp nav làm mất quản lý tài sản/Review hoặc icon che form/mobile | AG; đúng 5 navigation, asset detail giữ actions, AC-19/28/NFR-12 |
| R-18 | Plan/AI mở rộng nhưng effort/capacity vẫn theo scope-v1 | PO + AG; cost-v2 và backlog, chốt capacity trước lịch; chưa actual |
