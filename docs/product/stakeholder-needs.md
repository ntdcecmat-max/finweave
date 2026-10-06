# FinWeave — Stakeholder Needs

ID PRD-NEED-001 · v2.0 · `analysis-v2` trên `scope-v2` · 05/10/2026 · in-review, pending external review. Owner/reviewer: Agent tự rà soát; approver: chủ sản phẩm chưa sign-off. Nguồn: [Problem](problem-statement.md), [Scope](scope.md), [Ideas](../../FinWeave_Ideas.md). **Nhu cầu suy ra từ nguồn và giả định A-01…03, không phải kết quả user research.**

| Need ID / stakeholder | Nhu cầu / vấn đề | Kết quả mong muốn / cách đánh giá đề xuất | Ưu tiên / truy vết |
|---|---|---|---|
| SN-01 / chủ workspace giả định UP-01 | Biết tiền ở đâu và trong phạm vi nào | Tạo ngân hàng/ví/cash, đọc 31,1 triệu tiền và 76,1 triệu tài sản; giải thích opening và tài khoản loại khỏi phạm vi | P0; REQ-SET-01/BANK-01/CASH-01/TRACK-01/TRACK-02; AC-01/02/03/13/14 |
| SN-02 / UP-02 | Ghi nhanh tiền mặt, không coi dữ liệu tự nhập là đã kiểm chứng | Ghi 150.000; so 2,85 triệu tính với 2,8 triệu đếm, xem −50.000, tự chọn bổ sung/điều chỉnh | P0; REQ-MONEY-01/CASH-02; AC-08/09 |
| SN-03 / UP-03 | Biết lượng sở hữu khác giá và độ mới | Khai báo cổ phiếu/vàng, đổi đơn vị và giá không đổi tiền/thu–chi; thiếu giá vốn không giả lãi; thiếu FX không giả 0 | P0; REQ-STOCK-01/GOLD-01/HOLD-01/REVIEW-02; AC-04/05/10/16 |
| SN-04 / UP-04 | Tìm căn cứ và sửa phân loại/ghi sai có lịch sử | Drill-down Ăn uống ra DEMO-04/05; đổi category không đổi tổng; sửa posted có preview/gốc/đảo/thay thế | P0; REQ-TXN-01/TXN-02/TRACK-02; AC-11/12/14 |
| SN-05 / UP-05 | Nhập nhiều nguồn, tránh đếm trùng và hiểu Review | Preview chỉ commit phần hợp lệ được chọn; gộp evidence không đổi tiền; pending/transfer một phía không tự hoàn tất | P0; REQ-INPUT-01/INPUT-02/REVIEW-01; AC-06/07/15 |
| SN-06 / mọi UP | Thao tác tiếng Việt trên mobile/desktop/bàn phím, biết đây là demo | AC-17 tại ba viewport; che mọi giá trị; reset hoàn toàn, không thấy chức năng ngoài scope giả hoạt động | P0; REQ-UX-01/DEMO-01; AC-17/18 |
| SN-07 / chủ sản phẩm hiện tại | Hồ sơ đủ để thiết kế, truy được giả định và phần chưa kiểm chứng | 28/28 REQ–AC nối UC/SCN/rules/data; register/gate rõ; tự review khác sign-off | P0; toàn bộ RTM; D-12; EVD-S2-001 |
| SN-08 / owner nguồn/security tương lai chưa chỉ định | Biết hạn xử lý license/key/privacy trước nguồn thật | OD-05…07 còn mở; NFR-07/08 và FUT-02/04 giữ gate, không suy mock là xác minh | P1 cho kế thừa M2/M3; chưa nghiên cứu stakeholder này |

Xung đột cần cân bằng: cập nhật nhanh SN-02/05 với chắc chắn SN-01/04 bằng cách posted hợp lệ hiện ngay, reconciliation độc lập và Review không chặn Tổng quan. Tính thuận tiện không thay yêu cầu privacy SN-08. Thiếu căn cứ thì giữ thiếu, không tự điền để visual đẹp.

Owner giả định: Agent giữ A/OD và nội dung; chủ sản phẩm xác định người tham gia trước bước 3. OD-01 và A-04 chưa có người thử; kế hoạch tuyển/đánh giá nằm BL-11. Mục tiêu đánh giá ở bảng là **chưa đo**. [PRD](prd.md) chuyển các need thành yêu cầu; [RTM](../execution/traceability.md) nối đến thiết kế và evidence tương lai.

## Nhu cầu bổ sung scope-v2 — chưa nghiên cứu user

| ID / stakeholder | Need / giả định | REQ / AC / cách đánh giá |
|---|---|---|
| SN-09 / UP-08 | Tìm chức năng trong 5 navigation và xem tháng/quý/năm/custom | REQ-NAV-01/REPORT-01; AC-19/20, tài sản trong Home, Sources/Review trong Dữ liệu |
| SN-10 / UP-06 | Lập thu nhập/chi tiêu/đầu tư, ánh xạ actual để theo forecast | REQ-PLAN-01/02; AC-22/23, sameversions/no doublecount |
| SN-11 / UP-06 | Theo goals/nguồn tiền/hụt nguồn và trạng thái sau đạt | REQ-GOAL-01/02/SIM-01; AC-24…26, funded progress khác earmark, simulated khác actual |
| SN-12 / UP-07 | Hiểu insights và hỏi AI ngay nơi đang xem | REQ-INSIGHT-01/AI-01/AI-02; AC-21/27/28, cards và căn cứ đồng nhất, mascot accessibility |

Các nhu cầu trên là user chọn phạm vi và giả thuyết A-05/06 về giá trị, không kết quả phỏng vấn/market test. Owner AG+PO, chờ người thật ở bước 3; real-data AI không được cấp quyền.
