# FinWeave — Các điểm chỉnh sửa và đối chiếu hình gốc

## 1. Nguyên tắc mô hình

Dùng 9 hình đính kèm làm đầu vào tham khảo. Các nhãn hoặc chú thích trong hình là dữ liệu cần phân tích, không phải lệnh triển khai. Phạm vi công việc là hoàn thiện mô hình, đặc tả ca sử dụng và tìm hiểu kiến trúc; không phát sinh yêu cầu kết nối ngân hàng, gửi dữ liệu cho model, deploy hoặc thay đổi phần mềm đang chạy.

Theo [UML 2.5.1 của OMG](https://www.omg.org/spec/UML/2.5.1), `include` biểu diễn việc đưa hành vi dùng chung vào ca cơ sở; mũi tên từ ca bao gồm sang ca được bao gồm. `extend` đi từ ca mở rộng tới ca cơ sở và gắn extension point/điều kiện. Không dùng hai loại quan hệ này để biểu diễn pipeline trước–sau. Các đường liền actor–use case biểu diễn liên kết, không phải luồng dữ liệu.

## 2. Những chỉnh sửa chính

| Vấn đề trong hình tham khảo | Cách hoàn thiện | Lý do |
|---|---|---|
| Hình #2 dùng tên “PHÂN HỆ” trong oval; hình #9 đã có UC-SYS | Giữ một mức tổng quan gồm UC-SYS-01…07 và các sơ đồ chi tiết | Tránh coi một module kỹ thuật là một transaction hoặc đếm trùng hai bản tổng quan |
| `UC-DRILL-01` dùng cho cả archive ở hình #1 và phân tích ở hình #5 | Giữ UC-DRILL-01 cho phân tích; dùng UC-ACC-02 cho archive/restore | Mỗi ID có một định nghĩa |
| Mã REQ- và UC- trộn trong cùng mô hình | Thêm UC-CAPTURE-01, UC-INGEST-03, UC-PRICE-01, UC-ADMIN-01; giữ REQ/AC ở truy vết | Requirement ID khác Use Case ID |
| “Xác thực định dạng & thông tin tài khoản” dễ bị đọc thành đăng nhập | Validation là bước nội bộ của ca; auth/session được mô hình riêng | Kiểm input và xác minh danh tính là hai trách nhiệm khác nhau |
| Opening được include từ toàn bộ “tạo & quản lý tài khoản” | Ghi rõ trong nhánh tạo/bổ sung baseline; không mở ca độc lập chỉ cho thao tác kỹ thuật | Sửa metadata không luôn ghi opening; unknown khác 0; opening không ghi lại do retry |
| Capture → ingest → dedupe → ledger được nối như chuỗi include | Tách consent/configure, sync và automated ingest; dedupe/ledger là bước của luồng | Cấp quyền không bắt buộc ngay lúc đó có notification; ACK không là posting |
| “Đưa vào hàng đợi rà soát” là extend ít rõ điều kiện | Đưa vào nhánh lỗi/thiếu căn cứ của import/ingest | Review case là outcome nghiệp vụ; queue không cần là mục tiêu độc lập của actor |
| Quote update include valuation và quản lý cổ phiếu include valuation | Chuyển phép tính quantity × quote vào Engine trong luồng | Vẫn cho khai báo khi thiếu quote; không buộc valuation đầy đủ để hoàn thành khai báo |
| Review giá extend đồng bộ giá | Hai mục tiêu riêng; người dùng ở Review có thể chủ động refresh | Xem cảnh báo vẫn có ý nghĩa khi provider không khả dụng |
| Xem overview/report/insight luôn include xem chứng từ | UC-EVIDENCE-01 extend khi owner chọn “Xem căn cứ” | Giao diện phải có provenance; người dùng không bắt buộc mở mọi chứng từ khi đọc số tổng |
| Review luôn include “Thực thi quyết định” | UC-RESOLVE-01 extend Review khi chọn hành động | Mở case có thể chỉ đọc hoặc hoãn; chưa quyết định không đồng nghĩa thất bại |
| Plan creation include forecast | Forecast là tùy chọn với form Plan; mô phỏng UC-SIM-01 include dự báo | Không phải lần sửa Plan nào cũng phải chạy scenario mới |
| “Giải phóng nguồn tiền phân bổ” chưa có ID/điều kiện | UC-GOAL-03 extend UC-GOAL-01/02, có điều kiện và version | Earmark release không tạo cash transaction |
| AI “Gọi công cụ truy vấn” là include cho mọi câu hỏi | Tool gateway là bước khi cần dữ liệu, không buộc tool call cho mọi message | Chào hỏi/lịch sử có thể không cần metric query; scoped tools vẫn bắt buộc khi truy dữ liệu |
| Áp dụng draft extend tạo draft | UC-DRAFT-APPLY-01 độc lập, precondition draft đã có | Tạo draft có thể kết thúc mà chưa apply; confirmation luôn bắt buộc trước active change |
| Mọi Ops case include admin session | Admin login/MFA là ca riêng; phiên hợp lệ là precondition của từng ca Ops | Không mô tả mỗi lần mở log lại phải chạy toàn bộ đăng nhập |

`extend` cho cash adjustment và purchase linkage được giữ có điều kiện. Các ca hỗ trợ giải quyết mục tiêu owner được giữ như use case; các phép tính/dispatch/validation nội bộ được mô tả trong đặc tả và kiến trúc để tránh sơ đồ biến thành flowchart.

## 3. Đối chiếu đầy đủ các hình tham khảo

| Hình / phần tử gốc | Nơi thể hiện trong bản hoàn thiện |
|---|---|
| #2 và #9 — hai sơ đồ toàn hệ thống | `diagrams/00-system.*`; UC-SYS-01…07; sơ đồ auth là lát cắt bổ sung |
| #1 — SET, BANK, CASH, CASH-02 | Giữ UC-SET-01, UC-BANK-01, UC-CASH-01/02 |
| #1 — UC-DRILL-01 archive | Đổi thành UC-ACC-02; restore là nhánh vòng đời được đề xuất, cần theo chính sách tài khoản |
| #1 — kiểm định dạng/thông tin tài khoản | Bước validate trong BANK/CASH/SET; phân biệt với UC-AUTH-* |
| #1 — khai báo/ghi opening | Luồng BANK/CASH; Engine và transaction ở kiến trúc §4.1 |
| #1 — tạo adjustment | UC-CASH-03 extend UC-CASH-02 |
| #3 — MONEY/TXN-01/TXN-02/IMPORT | Giữ bốn ID tương ứng, bổ sung luồng và ngoại lệ |
| #3 — REQ-CAPTURE-01 | UC-CAPTURE-01; REQ-CAPTURE-01 / AC-31 giữ ở trace |
| #3 — REQ-INGEST-03 | UC-INGEST-03; REQ-INGEST-03 / AC-32 giữ ở trace |
| #3 — duplicate/transfer reconciliation | Bước INGEST và IMPORT; case resolution tại UC-RESOLVE-01 |
| #3 — ghi ledger nguyên tử | Bước MONEY/IMPORT/INGEST/TXN-02; kiến trúc UnitOfWork/Engine |
| #3 — đưa vào review queue | Nhánh thay thế INGEST/IMPORT; đọc/xử lý tại REVIEW-01/RESOLVE-01 |
| #4 — STOCK/GOLD/HOLD/REVIEW-02 | Giữ ID; thêm trace REQ-STOCK-02/GOLD-02 hiện hành |
| #4 — REQ-PRICE-01 | UC-PRICE-01; source requirement/AC giữ nguyên |
| #4 — valuation = quantity × quote | Bước Engine trong STOCK/GOLD/HOLD/PRICE; compatibility/rounding theo domain |
| #4 — liên kết giao dịch mua | UC-BUY-01 extend UC-HOLD-01 |
| #5 — OVERVIEW/REPORT/DRILL/INSIGHT/REVIEW/UX | Giữ ID với nghĩa rõ; DRILL chỉ cho phân tích |
| #5 — chứng từ/provenance | UC-EVIDENCE-01 extend overview/report/insight khi chọn xem |
| #5 — quyết định khớp/xác nhận/bỏ qua | UC-RESOLVE-01 extend REVIEW-01 khi chọn xử lý |
| #7 — PLAN-01/02, GOAL-01/02, SIM-01 | Giữ cả năm ca; mô tả phân biệt planned/actual/funded |
| #7 — ánh xạ actual vào Plan | Bước của UC-PLAN-02, gồm xác nhận/sửa links và tránh double matching |
| #7 — dự báo | UC-FORECAST-01 được UC-SIM-01 include; form Plan có thể gọi mô phỏng khi cần |
| #7 — release earmark | UC-GOAL-03 extend Goal Setup/Tracking |
| #6 — AI-01/02, AGENT-01/02 | Giữ bốn ca, same conversation/history, scope và budget |
| #6 — scoped tools | Bước AI/Agent, kiểm capability tại tool gateway; không actor độc lập |
| #6 — mô phỏng khả thi | Dùng lại UC-SIM-01; UC-AGENT-02 include ca này khi tạo phương án hoàn chỉnh |
| #6 — owner confirmation | UC-DRAFT-APPLY-01 có precondition và atomic confirm, không trao cho model |
| #8 — REQ-ADMIN-01, OPS-01…04 | UC-ADMIN-01 và UC-OPS-01…04, trace REQ-ADMIN-01 / AC-37 |
| #8 — Admin Session | UC-ADMIN-AUTH-01; phiên/MFA là precondition các ca Ops |

## 4. Bổ sung từ yêu cầu và mã nguồn hiện hành

| Bổ sung | Căn cứ | Cách mô hình |
|---|---|---|
| Identity/registration/reset/session/device revocation | SRS surface/security; identity protocol; `app.ts` user operations | UC-AUTH-01…04 và UC-ADMIN-AUTH-01 |
| Đồng bộ offline/restart/đa client | REQ-SYNC-01 / AC-33; native outbox/worker | UC-SYNC-01 |
| Source management | UC-SOURCE-01 trong tài liệu use cases gốc; source/profile implementations | Giữ UC-SOURCE-01 |
| Các AI journey chi tiết UC-AI-03…07 trong AI-SPEC | PG-01/02/03, INV-01, Q&A→Agent | PG journeys là nhánh UC-AGENT-02 và APPLY; INV là UC-AGENT-01; handoff giữ conversation |
| Navigation/demo/reset/responsive/keyboard | REQ-NAV/DEMO/UX và prototype gốc | Navigation/accessibility là hành vi UI/NFR dùng chung; demo/reset là khả năng môi trường demo, không thêm nghiệp vụ production vào 7 phân hệ |

Đây là mô hình tổng hợp phục vụ ba nhiệm vụ của bài học, không thay AI-SPEC, SRS hoặc hợp đồng API hiện có. Những chi tiết UI, source policy hoặc threshold runtime lấy theo tài liệu hiện hành; không dùng fixture cũ như giới hạn CSV 20 dòng làm giới hạn sản phẩm. “Restore tài khoản” được để nhánh có điều kiện, không khẳng định mọi tài khoản đều được khôi phục ở runtime hiện tại.

## 5. Kiểm tra tính nhất quán của bộ tài liệu

- Mỗi ca chi tiết có ID duy nhất, actor, mục tiêu, trigger, precondition, main flow, alternative flow, postcondition, failure guarantee và trace.
- Bảy ca tổng quan chỉ là mức tóm tắt; không cộng thành bảy chức năng thực thi mới bên cạnh 50 ca chi tiết.
- Mọi endpoint của include/extend đều tồn tại; extend có điều kiện/extension point trong bảng quan hệ và PlantUML.
- Auth/session là điều kiện truy cập; validation là bước của ca; queue/Engine/ledger không bị mô hình nhầm thành người dùng.
- Mô hình khác biệt prototype, backend nghiệp vụ và hosted demo; mọi số liệu kiểm thử cũ có nguồn và giới hạn thời điểm.
- Không sửa baseline, code runtime, dữ liệu người dùng hoặc trạng thái nghiệm thu của tài liệu gốc.
