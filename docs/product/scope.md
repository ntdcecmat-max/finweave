# FinWeave — Phạm vi chuẩn bị M1

> Cập nhật execution06/10/2026: nội dung requirement/scope-v2/analysis-v2 và28REQ/AC dưới đây giữ nguyên. Bước3 đã implement/kiểm chứng synthetic M1; xem [Validation](../design/validation-report.md) và [coverage](../execution/evidence/m1-coverage.md). Các câu planned/chưa app của hồ sơ bước1–2 mô tả thời điểm phân tích; trạng thái sản phẩm hiện hành nằm trong execution/register. Formal PO acceptance và user research chưa diễn ra.


Ngày lập: 05/10/2026 (Asia/Saigon). Version 2.0. Baseline hiện tại: `scope-v2`. Kế thừa scope-v1 (18 REQ/AC lõi và oracle hồi quy). Trạng thái: hồ sơ bước 1–2 được cập nhật theo thay đổi 5 navigation; các chức năng sản phẩm `planned`, chưa nghiệm thu M1.

## 1. Căn cứ và ranh giới nhiệm vụ

- [Ideas](../../FinWeave_Ideas.md): mục 1–9, 14–21 là nguồn nghiệp vụ; nhãn brainstorm không tự biến mọi module thành phạm vi được chọn.
- [Playbook](../../FinWeave_Agent_Execution_Playbook.md): mục 3–4 quy định bước 1; mục 5–6 quy định đầu vào bước 2 và gate M1; mục 13 cung cấp oracle giả.
- [Hướng dẫn](../../FinWeave_Human_Setup_and_Prompts.md): mục 2 và Prompt 1.
- Nhiệm vụ hiện tại: sửa hồ sơ bước 1 và 2 theo ý tưởng 5 navigation user đã yêu cầu; bổ sung Plan/Goals/Insights/AI, vẫn M1 synthetic; rà lại gate bước 2 rồi dừng. Không xây bước 3.
- Giao diện tiếng Việt, responsive web, dữ liệu tổng hợp. Hướng bàn giao M1: prototype web tương tác chạy local, có reset. Lần này chỉ tạo tài liệu; chưa xây prototype, backend hoặc API contract.
- Plan gồm kế hoạch thu nhập/chi tiêu/đầu tư, goals, mô phỏng và tracking; AI gồm chat toàn trang/linh vật ở mọi navigation. Lập kế hoạch chi tiêu có trong Plan; module Budget riêng với rollover/budget tree và Alerts/inbox/push/email vẫn ngoài phạm vi. Không tự triển khai nguồn thật, collector, trả phí, billing hoặc public deployment.

## 2. Hiện trạng và môi trường

Workspace là thư mục chứa ba tài liệu nguồn. Kiểm kê ban đầu không thấy code, package manifest, lockfile, test, docs/execution hoặc quy định AGENTS.md áp dụng trong workspace và các thư mục cha đã kiểm tra. Git báo đây không phải repository. Không có bằng chứng tính năng đã xây hoặc nghiên cứu user đã làm.

PROJECT_ROOT: thư mục hiện tại; IDEA_SOURCE: `FinWeave_Ideas.md`; TARGET_LEVEL: M1; STEP_RANGE lần này: cập nhật 1–2; DATA_MODE: synthetic. Chưa chọn stack/package manager/lệnh chạy app; không cài môi trường khi chỉ sửa tài liệu. Tiền hiển thị VND, timezone nghiệp vụ `Asia/Ho_Chi_Minh` (+07:00). Demo chỉ một chủ workspace, không có chia sẻ hay vai trò Ops trong UI.

Thiết bị đánh giá đề xuất: desktop 1440×900, mobile 390×844 và kiểm tra chiều rộng 360px; đây là mục tiêu cho bước 3, chưa phải kết quả đã kiểm tra.

## 3. Nhóm user và vấn đề cần kiểm chứng

**Toàn bộ nhóm user, tần suất và lợi ích dưới đây là giả thuyết sản phẩm từ Ideas, chưa có phỏng vấn, khảo sát hay usability test.** Không suy thị trường mục tiêu từ thư mục học phần của workspace.

| ID | Nhóm dự kiến / vấn đề | Câu hỏi cần trả lời | Chức năng / lợi ích mong đợi | Cách kiểm chứng sau này |
|---|---|---|---|---|
| UP-01 | Cá nhân có tiền ở nhiều ngân hàng/ví và tiền mặt; phải tự cộng | Tiền đang ở đâu, tổng tiền theo dõi là bao nhiêu? | Thiết lập và Tổng quan; thấy tiền và tài sản trong cùng phạm vi | Tác vụ thiết lập, đọc tổng và chỉ ra tài khoản đóng góp |
| UP-02 | Cá nhân dùng tiền mặt, thường bỏ sót khoản chi | Khoản chi vừa ghi ảnh hưởng thế nào; tiền kiểm đếm có khớp? | Nhập nhanh, kiểm đếm; biết chênh lệch thay vì tự coi dữ liệu đủ | Ghi chi và đối chiếu số tính/kiểm đếm |
| UP-03 | Cá nhân có cổ phiếu/vàng khai báo; nhầm giá mới với danh mục mới | Tôi có bao nhiêu, giá từ đâu, thông tin nào đã cũ? | Tách lượng/giá/ngày; hiểu giá trị tham chiếu và giới hạn | Đổi riêng giá rồi riêng lượng, giải thích tác động |
| UP-04 | Cá nhân muốn biết khoản chi lớn, thiếu nhóm hoặc khó tìm căn cứ | Nhóm nào chi nhiều; giao dịch nào tạo tổng? | Bộ lọc, phân loại, drill-down; tìm và sửa dữ liệu liên quan | Mở thanh chi tiêu tới đúng giao dịch và quay lại |
| UP-05 | Cá nhân nhập nhiều nguồn, gặp trùng/chuyển/refund chưa rõ | Giao dịch này có bị đếm hai lần; xác nhận thay đổi gì? | Preview và Review; kiểm tra bằng chứng trước khi sửa | Xử lý nghi trùng/transfer, so kết quả trước–sau |

Giả định A-01: một chủ workspace là actor chính, có thể khai báo holdings; A-02: ưu tiên ba câu hỏi hằng tuần “tiền ở đâu / chi vào gì / dữ liệu nào cần kiểm tra”; A-03: user cần cả mobile và desktop. Cần kiểm chứng các giả định với người tham gia trước khi dùng làm kết luận về nhu cầu. Không có người tham gia vẫn có thể tự walkthrough nhưng phải ghi đúng loại đánh giá.

## 4. Định nghĩa mức và ánh xạ nhãn prototype

M1 chứng minh tác vụ, cách đọc visual và phản hồi bằng mô phỏng. M2 chứng minh frontend gọi lớp API theo contract, mutation và lỗi qua mock. M3 chứng minh frontend/backend thật, dữ liệu bền vững, nghiệp vụ, quyền, privacy và vận hành trong môi trường công bố. **Các cột M2/M3 dưới đây là hướng tiếp nối có điều kiện, chưa được giao triển khai.** Roadmap ba giai đoạn của Ideas không đồng nghĩa M1/M2/M3.

| Nội dung mang nhãn prototype trong Ideas | M1 của nhiệm vụ này | Công việc chuyển sang mức phù hợp |
|---|---|---|
| Identity, isolation, thiết bị (mục 2) | Workspace demo và mốc theo dõi; không cần đăng ký/reset mật khẩu | Auth/session contract M2; xác thực, isolation và recovery thật M3 |
| CSV commit, job, parser, retry (mục 4) | Wizard fixture, preview, confirm, lỗi và kết quả mô phỏng nhất quán | API/job mock M2; parser, worker, transaction và idempotency thật M3 |
| Double-entry/atomic/reversal/ownership (mục 5) | Tác động thu–chi/chuyển/refund và dấu vết sửa thể hiện trên UI | Contract trạng thái M2; ledger cân bằng và quyền backend M3 |
| Matching, rules, Engine, snapshot (mục 6–8) | Kịch bản đã biết kết quả; category thủ công, Review, dashboard cùng số | Mock theo contract M2; matching/Engine/version thực M3 |
| Home/Plan/Goals/AI theo ý tưởng bổ sung (Ideas 8–13) | Dashboard và Plan/Goals mô phỏng; AI scripted/demo result cards, linh vật chat dùng chung | M2 mock contracts; M3 Plan/Engine thật; LLM thật chỉ sau provider/privacy gate, không tự gọi API ở M1 |
| Envelope encryption, DB dump, console Ops (mục 15–17) | Ghi yêu cầu và phụ thuộc; dùng giả, không tuyên bố đã chống Ops | PoC boundary khảo sát sớm trước chốt transport M2; kiểm chứng đầy đủ ở M3 trước dữ liệu thật |

State/fixture trong bộ nhớ hoặc lưu local để demo được phép ở M1, có nhãn/reset. Không gọi đó là ledger chính thức hay bằng chứng lưu backend. Không yêu cầu PostgreSQL, LLM key, API giá hoặc hạ tầng mã hóa để chứng minh luồng giao diện.

## 5. Scope matrix M1/M2/M3 theo chức năng

Ký hiệu: **mô phỏng** = trong M1; **hỗ trợ mock** = dự kiến M2 khi được giao; **thật có điều kiện** = dự kiến M3 sau quyền/gate; **hoãn** = giữ hướng sản phẩm nhưng không bắt buộc; **ngoài phạm vi** = chưa chọn trong nhiệm vụ.

| REQ | Chức năng và user benefit | M1 hiện chọn | M2 tiếp nối | M3 tiếp nối | AC |
|---|---|---|---|---|---|
| REQ-SET-01 | Mốc theo dõi/workspace demo; biết kỳ và phạm vi dữ liệu | Mô phỏng, VND/+07:00 | Hỗ trợ mock cấu hình/session | Thật có điều kiện auth/quyền | AC-01 |
| REQ-BANK-01 | Tạo ngân hàng và ví; thấy số dư/nguồn riêng | Mô phỏng cả hai loại | Hỗ trợ mock CRUD/archive | Thật có điều kiện lưu/quyền | AC-02 |
| REQ-CASH-01 | Tạo ví tiền mặt; biết tiền tự khai báo | Mô phỏng | Hỗ trợ mock CRUD | Thật có điều kiện | AC-03 |
| REQ-STOCK-01 | Khai báo mã/thị trường/lượng/giá vốn; biết giá trị tham chiếu | Mô phỏng | Hỗ trợ mock holdings | Thật có điều kiện; lượng khai báo, giá provider | AC-04 |
| REQ-GOLD-01 | Khai báo loại/purity/khối lượng; tránh sai đơn vị và nguồn giá | Mô phỏng | Hỗ trợ mock holdings/quotes | Thật có điều kiện nguồn/đơn vị/FX | AC-05 |
| REQ-INPUT-01 | Đưa sao kê vào, kiểm tra trước khi ghi nhận | Mô phỏng CSV mẫu và ánh xạ cột | Hỗ trợ mock preview/confirm/job | Thật có điều kiện parser/commit | AC-06 |
| REQ-INPUT-02 | Cập nhật từ nguồn, biết khi lỗi/cũ/mất quyền | Mô phỏng thông báo và nguồn giá, dummy connection | Hỗ trợ mock connection/retry | Thật có điều kiện nguồn; collector riêng nếu chọn | AC-07 |
| REQ-MONEY-01 | Nhập thu/chi ngân hàng/ví/tiền mặt, chuyển nội bộ/phí/refund | Mô phỏng form và kết quả | Hỗ trợ mock mutations | Ledger thật có điều kiện | AC-08 |
| REQ-CASH-02 | Kiểm đếm, phát hiện và xử lý chênh lệch có lý do | Mô phỏng | Hỗ trợ mock preview/resolve | Thật có điều kiện adjustment/audit | AC-09 |
| REQ-HOLD-01 | Cập nhật lượng và giá riêng; biết vì sao định giá đổi | Mô phỏng khai báo/điều chỉnh có ngày/lý do | Hỗ trợ mock movements/quotes | Thật có điều kiện; liên kết dòng tiền khi đủ dữ liệu | AC-10 |
| REQ-TXN-01 | Tìm giao dịch và xem nguồn/bằng chứng/trạng thái | Mô phỏng filter/detail | Hỗ trợ mock query/pagination | Thật có điều kiện protected search | AC-11 |
| REQ-TXN-02 | Sửa draft/category hoặc điều chỉnh posted có dấu vết | Mô phỏng thao tác từng giao dịch | Hỗ trợ mock version/conflict | Thật có điều kiện reversal/override | AC-12 |
| REQ-TRACK-01 | Tổng quan tiền, thu–chi, dòng tiền, cơ cấu bốn nhóm | Mô phỏng cùng oracle/snapshot | Hỗ trợ mock reports | Engine thật có điều kiện | AC-13 |
| REQ-TRACK-02 | Mở căn cứ từ visual, giữ ngữ cảnh/phạm vi | Mô phỏng drill-down, scope on/off/archive | Hỗ trợ mock filters/invalidation | Thật có điều kiện report version | AC-14 |
| REQ-REVIEW-01 | Kiểm tra nghi vấn tiền trước khi xác nhận | Mô phỏng thiếu trường/trùng/transfer/refund/category/pending/lệch | Hỗ trợ mock resolve/version | Thật có điều kiện matching/transaction | AC-15 |
| REQ-REVIEW-02 | Kiểm tra chất lượng holdings/giá/nguồn | Mô phỏng cũ/thiếu/không khớp, dẫn tới cập nhật | Hỗ trợ mock quality cases | Thật có điều kiện dữ liệu nguồn | AC-16 |
| REQ-UX-01 | Đọc và thao tác tiếng Việt trên web/mobile/bàn phím | Hỗ trợ UI + state mô phỏng | Frontend hoàn chỉnh với mock | Giữ UX trên dữ liệu thật | AC-17 |
| REQ-DEMO-01 | Biết đây là demo, mở/reset và lặp lại tác vụ | Hỗ trợ demo local | Demo mode tách thật, mock reset | Demo tách môi trường thật | AC-18 |

| REQ-NAV-01 | Tìm đủ chức năng qua đúng 5 navigation và context dùng chung | 5 navigation + tab/detail/mascot mô phỏng | Route/context mock | Quyền thực theo route/object | AC-19 |
| REQ-REPORT-01 | Đọc Home theo tháng/quý/năm/custom, số dư khác hoạt động kỳ | Mô phỏng report period/as-of | Mock query/snapshot | Engine reports thật có điều kiện | AC-20 |
| REQ-INSIGHT-01 | Hiểu điểm đáng chú ý có căn cứ và giới hạn | Insights xác định/scripted từ snapshot | Mock rule/result refs | Rule/Engine và AI tùy quyền | AC-21 |
| REQ-PLAN-01 | Lập/sửa kế hoạch thu nhập/chi tiêu/đầu tư có dashboard | Forecast giả, version/assumptions rõ | Mock Plan CRUD/schedules | Plan data/authorization thật | AC-22 |
| REQ-PLAN-02 | So kế hoạch với thực tế, ánh xạ không đếm trùng | Matching thủ công/variance mô phỏng | Mock mapping/version | Engine actual-vs-plan thật | AC-23 |
| REQ-GOAL-01 | Tạo mục tiêu và phân bổ tiền hiện có | Goal target/deadline/allocation giả | Mock goal/allocation CRUD | Quyền và allocation invariants thật | AC-24 |
| REQ-GOAL-02 | Theo dõi mục tiêu và hụt nguồn sau giao dịch thực | Progress/milestones/shortfall mô phỏng | Mock goal snapshots | Engine progress thật | AC-25 |
| REQ-SIM-01 | Xem tác động tài chính khi đạt goal/mua/đầu tư | Scenario điều kiện, không ghi ledger | Mock simulation | Engine simulation trong boundary | AC-26 |
| REQ-AI-01 | Hỏi–đáp/giải thích từ kết quả có căn cứ, lịch sử chat | Scripted demo không cần model/key | Mock read-only tools/history | LLM chỉ theo privacy/quota được duyệt | AC-27 |
| REQ-AI-02 | Chat qua linh vật ở cả 5 navigation, giữ context | Panel/chat đồng bộ, keyboard/mobile | Shared conversation/context mock | Quyền context/result thật | AC-28 |

### Bao phủ bốn nhóm × năm chức năng

| Nhóm | Thiết lập | Thu thập/cập nhật | Quản lý giao dịch/sự kiện | Theo dõi | Review |
|---|---|---|---|---|---|
| Ngân hàng/ví | BANK-01 (cả ngân hàng và ví) | INPUT-01/02, MONEY-01 | TXN-01/02, chuyển/phí/refund | TRACK-01/02 | REVIEW-01/02 |
| Tiền mặt | CASH-01 | MONEY-01, CASH-02 | TXN-01/02, rút/nộp là transfer | TRACK-01/02 | CASH-02, REVIEW-01 |
| Cổ phiếu | STOCK-01 | HOLD-01, INPUT-02 | Lịch sử khai báo/điều chỉnh lượng có ngày/lý do; không là tiền vào giả | TRACK-01/02 | REVIEW-02 |
| Vàng | GOLD-01 | HOLD-01, INPUT-02 | Lịch sử thay đổi khối lượng có ngày/lý do, giữ đơn vị | TRACK-01/02 | REVIEW-02 |

ID rút gọn trong bảng trên có tiền tố `REQ-`. Với cổ phiếu/vàng, M1 cần lịch sử sự kiện lượng sở hữu và một ví dụ liên kết mua với tiền nếu có đủ dữ liệu; không bao gồm đặt lệnh, đồng bộ holdings thật, corporate-action engine hay tính hiệu quả đầu tư đầy đủ.

### Trạng thái module và các phần chưa chọn

| Chức năng | M1 lần này | M2/M3 | Hệ quả UI / điều kiện mở lại |
|---|---|---|---|
| Budget độc lập (Ideas 10: rollover/tree/advanced rules) | `out-of-scope` | Chưa chọn | Plan đã có thu nhập/chi tiêu dự kiến và so actual; không mặc định toàn module Budget được chọn |
| Goals (Ideas 11) | Trong phạm vi Plan, REQ-GOAL-01/02 + SIM-01 | Mock M2; thật có điều kiện M3 | Không còn EXT-02 ngoài scope; có allocation/progress/scenario, không tạo tiền khi đạt goal |
| Alerts (Ideas 12) | `out-of-scope` | Chưa chọn | Không inbox/push/email/rule nhắc; status nguồn và số case Review vẫn thuộc lõi |
| Assistant (Ideas 13) | Trong phạm vi, REQ-AI-01/02 | M2 mock; M3 AI thật có gate riêng | M1 scripted/chat/cards/mascot, không model/API key thật; conversation không financial source of truth |
| BĐS, vốn kinh doanh, nợ/thẻ tín dụng, đa tiền tệ tài khoản, hộ gia đình | `out-of-scope` | Chưa chọn | Không dùng nhãn tài sản ròng đầy đủ; thêm cần mô hình/rule/phạm vi riêng |
| Collector Android/iOS, SMS/email, PDF/OCR, API nguồn thật | Hoãn tích hợp; chỉ mock nguồn đã chọn | M2 mock; M3 chọn riêng adapter có quyền | Web không giả vờ tự đọc thông báo điện thoại |
| Category/rule cá nhân, batch action, export CSV/PDF, widget tùy chỉnh | Hoãn | Chưa chọn mở rộng | M1 dùng category hệ thống và sửa từng mục; không có nút giả hoạt động |
| Đăng ký/MFA/reset/recovery, console Ops, billing | Ngoài luồng M1 | Auth/privacy/vận hành cần cho M3; billing chưa chọn | Không dùng route guard/demo để tuyên bố đã phân quyền/mã hóa |

## 6. Acceptance criteria M1 có thể kiểm tra

Tất cả AC sau là **mục tiêu nghiệm thu tại bước 3, chưa chạy/chưa pass**. Mỗi tác vụ reset về đúng scenario trước khi đo; form phải mở/nhập/kiểm tra/xác nhận/hủy và trả kết quả mô phỏng. Lỗi mô phỏng ghi đúng demo, không chứng minh cơ chế backend.

| AC | Tác vụ / dữ liệu đầu vào | Kết quả quan sát phải đạt |
|---|---|---|
| AC-01 | Vào demo mới, chọn mốc theo dõi rồi mở Tổng quan; quay lại demo đã có dữ liệu | Hiện VND, kỳ và +07:00; opening không là thu nhập; lần sau mở Tổng quan trực tiếp, không buộc xử lý Review |
| AC-02 | Tạo ngân hàng 20 triệu và ví 0 VND ở cùng mốc; thử bỏ tên/số tiền sai; hủy form | Hai thẻ khác loại, số dư/ngày/nguồn rõ; 0 đã khai báo khác thiếu số dư; lỗi không tạo mục, hủy không đổi tổng |
| AC-03 | Tạo tiền mặt 2 triệu; bỏ số dư rồi thử lại | Nhãn tự khai báo; số dư tính toán khác số kiểm đếm; chưa kiểm đếm là chưa có dữ liệu, không là 0 |
| AC-04 | Khai báo DEMO-A/thị trường DEMO, 100 cổ phiếu, giá giả 50.000 VND/cổ phiếu; không nhập giá vốn | Giá trị 5 triệu, lượng/ngày khai báo và giá/ngày giá riêng; lãi/lỗ chưa xác định; thiếu thị trường hoặc lượng âm bị chặn |
| AC-05 | Khai báo vàng nhẫn demo 9999, 5 chỉ, quote giả 8 triệu VND/chỉ; đổi display sang 0,5 lượng | Giá trị 40 triệu ở cả hai cách biểu diễn; hiện loại/purity/nguồn/đơn vị/ngày. Quote quốc tế có nhãn quốc tế và FX riêng; thiếu FX hoặc sai loại thì chưa thể định giá, không bằng 0 |
| AC-06 | Chọn sao kê CSV giả, tài khoản đích và cột; preview có dòng hợp lệ, thiếu trường, nghi trùng | Thấy gốc/chuẩn hóa/lỗi và số dòng được phép; hủy không đổi số; confirm chỉ phần hợp lệ đã chọn, phần nghi vấn vào Review. Xác nhận lại cùng batch mô phỏng không tăng giao dịch; có lịch sử kết quả demo |
| AC-07 | Chọn nguồn thông báo demo rồi quote demo; bật scenario lỗi/mất quyền/cũ và thử lại | Nêu loại dữ liệu nguồn lấy được, thời điểm và hành động; không yêu cầu key thật; quote mới không đổi holdings, lỗi không thành giá 0, retry có kết quả mô phỏng |
| AC-08 | Theo baseline, ghi chi cash 150.000, chuyển ngân hàng→ví 2 triệu, rút ngân hàng→cash 1 triệu; mở refund 200.000 liên kết mua 600.000 | Chi cash làm tiền mặt 3 triệu→2,85 triệu; chuyển/rút không thành thu–chi sinh hoạt; refund là sự kiện riêng ngày nhận; phí fixture riêng là chi. Bỏ số tiền/tài khoản/ngày bắt buộc, số tiền ≤0 và hủy không ghi nhận |
| AC-09 | Khi cash tính 2,85 triệu, kiểm đếm 2,8 triệu cùng mốc | Hiện lệch −50.000, chưa tự tạo chi; bổ sung giao dịch hoặc xác nhận điều chỉnh có lý do/preview/lịch sử; hủy giữ nguyên số tính |
| AC-10 | Đổi riêng giá DEMO-A 50.000→55.000 và vàng 8→8,2 triệu/chỉ; sau reset đổi lượng cổ phiếu 100→110 | Đổi giá làm tài sản cuối kỳ 76,1→77,6 triệu; tiền 31,1 triệu và thu–chi giữ nguyên. Đổi lượng tại giá 50.000 làm holdings 5→5,5 triệu, lưu ngày/lý do và nhãn khai báo; không tự tạo income/expense. Với ví dụ mua mới đủ căn cứ, tiền đầu tư và tăng holdings liên kết, không đếm mua thành chi sinh hoạt |
| AC-11 | Lọc kỳ/tài khoản/loại/category/trạng thái; mở DEMO-06, rồi mở pending fixture | Danh sách đúng bộ lọc; detail có số tiền/ngày/tài khoản/evidence/lịch sử; posting, reconciliation và category là trạng thái riêng; pending tách khỏi tổng posted; không tìm thấy có empty state |
| AC-12 | Sửa draft, đổi category DEMO-08; điều chỉnh posted cash 150.000→120.000 trong scenario riêng | Draft chưa tác động tổng; đổi category không đổi tổng chi 1,1 triệu; sửa posted có preview, gốc/đảo/thay thế hoặc adjustment liên kết, lý do và dấu vết. Cash tăng lại 30.000 đúng một lần; hủy không đổi; import lại mô phỏng giữ override |
| AC-13 | Chạy đủ DEMO-01…08 từ opening, rồi xem Tổng quan | Khớp oracle mục 7; tiền tách giá trị tài sản. Bar chi gồm ăn uống 400.000, mua hàng gộp 600.000/hoàn 200.000, chưa phân loại 100.000; visual có kỳ/đơn vị/nhãn và bảng thay thế |
| AC-14 | Click Ăn uống, click cổ phiếu, Back; tắt ví khỏi phạm vi rồi archive trong scenario riêng | Mở đúng DEMO-04/05 hoặc holding, giữ kỳ/phạm vi khi quay lại. Bỏ ví: tiền cuối kỳ 29,35 triệu, dòng tiền của ngân hàng+cash 7,35 triệu do transfer sang ví ra khỏi phạm vi; giải thích ranh giới. Archive không xóa lịch sử; thiếu quote không giả tổng đầy đủ |
| AC-15 | Mở từng case trùng, transfer thiếu một phía, refund chưa liên kết, thiếu trường, chưa phân loại, pending lâu, lệch số dư | Có căn cứ/đề xuất/tác động trước–sau và lựa chọn phù hợp xác nhận/từ chối/bổ sung/hủy. Gộp evidence thứ hai DEMO-06 không đổi oracle; xác nhận cùng case lần nữa không đổi số. Hai bản ghi cùng tiền/ngày không tự gộp; thiếu phía nhận không tự tăng tiền đích |
| AC-16 | Mở case holdings cũ, giá cũ/thiếu, FX thiếu, quote vàng sai loại; cập nhật hoặc từ chối | Phân biệt ngày lượng/ngày giá; giải thích phần chưa định giá; dẫn tới form/nguồn đúng. Giữ quote cũ có nhãn và thời điểm; không tạo độ chính xác/bao phủ % giả; xác nhận user không thành xác minh độc lập |
| AC-17 | Walkthrough ở 1440×900, 390×844, rộng 360px và chỉ bàn phím; bật ẩn số tiền | Tiếng Việt nhất quán; không chồng/cắt nội dung hay cuộn ngang toàn trang; form/visual đọc và bấm được. Focus rõ, dialog đóng/quay focus đúng, lỗi có chữ, màu không là tín hiệu duy nhất, chart có bảng; privacy che giá trị cả card/chart/detail |
| AC-18 | Mở theo hướng dẫn local, chạy scenario thành công/lỗi rồi Reset | Demo có nhãn giá/ngày/dữ liệu giả, không nút tùy chọn gây hiểu đang hoạt động; reset khôi phục opening, nguồn/case/giá và bộ lọc nhất quán; demo script lặp lại được, ghi rõ cách lưu local nếu có |

| AC-19 | Mở 5 navigation; vào tài sản từ Home, nhập CSV/Review trong Dữ liệu; mở/đóng linh vật ở từng trang | Có đúng Home/Giao dịch/Plan/Dữ liệu/Trợ lý AI; Cài đặt ở menu hồ sơ. Asset detail đọc/sửa đủ, không biến thành dashboard chỉ đọc; Back giữ kỳ/scope/filter. Linh vật không che nút và không tạo navigation thứ 6 |
| AC-20 | F-COMPLETE chọn tháng 10, quý4, năm2026 và custom02–08/10 | Tháng10/quý4/năm tại demo clock: tiền31,1m, flow9,1m; quý/năm hiện phần chưa có trước mốc theo dõi/period chưa kết thúc. Custom02–08: bank26,6m/wallet1,75m/cash2,85m/tiền31,2m, gross1m/refund200k/net800k/flow9,2m; giá tại mốc này thiếu→assets full unknown, không dùng quote31/10 như giá08/10. Kỳ sai bị chặn, kỳ thiếu không giả0 |
| AC-21 | Mở insight trên snapshot tháng 10, đổi kỳ/scope hoặc fixture pending/thiếu giá | Insight food400k/nhóm chưa phân loại100k có source/result refs và drill-down. Không khẳng định xu hướng hoặc chênh lệch % nếu thiếu kỳ so; thay context tính lại, card AI có nhãn và cùng số Engine |
| AC-22 | Từ F-COMPLETE lập Plan tháng 11: income5m, expense2m, investment1m; sửa/hủy/cancel | Forecast openingcash31,1m→closingcash33,1m; dùng giá cố định và investment linked thì assets76,1m→79,1m. Các khoản/giá/timing đều giả định. Không đổi money/events thực; save có version và reason/assumptions, invalid/conflict giữ input |
| AC-23 | Plan như AC-22; nhập synthetic actual tháng 11 income4m, expense2,5m, investment0,5m có holdings linked; map từng event vào planned item | Actual cash32,1m, assets77,6m; forecast còn lại income1m/expense0/investment0,5m→cash32,6m, gap−0,5m so plan. Income remaining không âm; expense vượt hiện500k, không chi lại2m. Transfer không consume expense; refund tách theo kỳ; cùng event không match2lần |
| AC-24 | F-COMPLETE tạo goal target5m, due30/11, allocate3m từ bank26,5m; thử goal2 allocate24m cùng bank | Progress60%, còn 2m; available bank23,5m, totalcash31,1m/assets76,1m giữ. Allocate24m bị chặn vì aggregate27m>26,5m; income dự kiến/stock valuation không tự làm tiền có thể phân bổ; hủy không allocation |
| AC-25 | F-COMPLETE goal như AC-24; fixture chi thực bank24m rồi refresh goal; complete/archive goal scenario riêng | Actual cash7,1m/assets52,1m; bank2,5m<allocation3m→shortfall500k, funded progress50%, planned allocated60% hiển thị riêng. Không chặn giao dịch đã xảy ra, không tự xóa allocation. Đánh dấu achieved/archive không tạo money/holding; release chỉ gỡ earmark có history |
| AC-26 | Reset F-COMPLETE: goal5m đãallocate3m, hai contributions 1m từ bank; mô phỏng đạt rồi mua món5m; separate mô phỏng investment1m fixedprice | Sau đạt goal chỉ earmark, cash31,1m/assets76,1m giữ; mua giả5m→cash26,1m/assets71,1m nếu là tiêu dùng, gross/net futureperiod5m; cumulative baseline+steps gross6,1m/net5,9m. Investment1m→cash30,1m/assets76,1m, không chi sinh hoạt. Kết quả điều kiện/assumptions rõ, không actual mutation |
| AC-27 | Chat hỏi chi tháng 10, food, giá tăng; đổi scope, mở history; inject tool/error/quota/nohistory | Cards income10m/gross1,1m/refund200k/net900k/food400k có period/scope/asOf/result/evidence; quote increase không income. Tool error/no authorized data không bịa số; không trade/recommend ticker/writeledger; history stale không snapshot mới. M1 canned response gắn read-only Engine result, không giả gọi model thật |
| AC-28 | Ở Home/Giao dịch/Plan/Dữ liệu/AI mở linh vật bằng chuột/bàn phím; gửi câu hỏi theo context rồi mở trang AI | Cùng conversation và kết quả; period/scope/selected object/context chip rõ. Điều hướng khi response đang chờ không áp kết quả cũ vào context mới; đổi kỳ cần refresh/capture context. Escape trả focus, mobile không che action, privacy mask cả mascot/history/cards; reset xóa chat/result/context |

## 7. Bộ số kiểm tra và quy tắc giữ nguyên

Nguồn số: Playbook mục 13. Baseline: ngân hàng 20.000.000, ví 0, cash 2.000.000; cổ phiếu 100×50.000 = 5.000.000; vàng 5 chỉ×8.000.000 = 40.000.000 VND. Tiền đầu kỳ 22.000.000; tài sản theo dõi 67.000.000.

| Sau DEMO-01…08 | VND kỳ vọng |
|---|---:|
| Ngân hàng / ví / cash | 26.500.000 / 1.750.000 / 2.850.000 |
| Tổng tiền | 31.100.000 |
| Thu nhập / chi gộp / refund / chi thuần | 10.000.000 / 1.100.000 / 200.000 / 900.000 |
| Dòng tiền ròng ba tài khoản tiền | +9.100.000 |
| Tài sản theo dõi giá ban đầu / sau đổi giá | 76.100.000 / 77.600.000 |

Nguyên tắc bắt buộc cho bước 2: opening không cộng hai lần; original và reversal cùng được tính theo dấu; pending/draft không thành posted; chưa phân loại vẫn tính khoản hợp lệ. Refund giảm chi ở kỳ nhận, có fixture khác kỳ. Transfer phụ thuộc ranh giới tài khoản tiền, phí riêng. Thiếu dữ liệu không thành 0. Không gọi tổng bốn nhóm là tài sản ròng đầy đủ. Lượng holdings/giá/FX/nguồn/độ mới là các thông tin độc lập; thay giá không là dòng tiền hoặc thu nhập.

Các nhánh bổ sung cần bước 2 mô tả: refund nhiều lần/khác kỳ/vượt mua; transfer một phía/có phí/ngoài phạm vi; opening/reversal; cash lệch; quote/FX thiếu/cũ/sai đơn vị; source revision và override; mất quyền/lỗi nguồn; xung đột sửa và retry. M1 mô phỏng nhánh quan trọng; bộ lỗi HTTP/concurrency và chứng minh idempotency thật thuộc M2/M3.

## 8. Mục tiêu kiểm chứng và gate M1 sau này

- Mục tiêu: 28/28 AC có kịch bản và bằng chứng walkthrough ở bước 3; toàn bộ số trong oracle khớp; mọi chỉ số chính có đường về dữ liệu căn cứ; đủ bốn nhóm × năm chức năng.
- Mục tiêu: 0 lỗi nghiêm trọng còn mở làm tác vụ chính không hoàn thành hoặc khiến hiểu sai số tiền/nguồn; lỗi nhỏ ghi tác động và kế hoạch sửa trong prototype-review.
- Nếu có user test: đề xuất 5 người thuộc nhóm giả định, ít nhất 4/5 hoàn thành độc lập các tác vụ chính; đọc được tiền/tài sản, khoản chi lớn, ngày lượng versus ngày giá và dữ liệu chưa rõ; ghi thời gian, trợ giúp và câu trả lời. Cỡ mẫu/ngưỡng này là đề xuất chưa chốt, chưa đo, không chứng minh đại diện thị trường.
- Nếu chưa có người tham gia: báo chỉ tự walkthrough, mức hiểu của user chưa kiểm chứng; không viết “đã phỏng vấn” hoặc tỷ lệ hoàn thành giả.
- Bước 1 hoàn thành khi scope/benefit/AC/backlog/phụ thuộc/traceability đủ cho bước 2. Điều đó **không đồng nghĩa đạt M1**; M1 cần thêm use cases, rules, thiết kế và prototype chạy được.

## 9. Phụ thuộc, quyết định và đầu vào bước 2

Xem [backlog](backlog.md) và [decisions](../execution/decisions.md). Quyết định còn mở ảnh hưởng gần: nhóm user/người tham gia, kỳ demo/ngưỡng cũ, mẫu CSV/loại quote vàng. Đã có mặc định đề xuất để viết bước 2; không cần khóa kế hoạch vì chưa có provider thật. Quyết định nguồn/quyền key, FX/license và kiến trúc chống Ops ảnh hưởng tích hợp sau này, không là điều kiện dựng M1.

Bước 2 phải tạo đủ Stakeholder Needs, Context Model, Operational Scenarios, PRD, SRS (functional requirements + NFR), Use Cases, Business Rules Catalogue, Data Requirements (gồm dictionary nghiệp vụ), Glossary và RTM theo Playbook §3.5/5; lấy REQ/AC làm baseline, giữ ID UC/SCN dự kiến trong traceability hoặc cập nhật mapping khi tách. Actor chính là chủ workspace demo. Các bề mặt nghiệp vụ nằm trong đúng 5 navigation ở §10; Thiết lập/Cài đặt qua hồ sơ, tài sản qua Home, Nguồn/Review qua Dữ liệu. Có Plan/Goals/Trợ lý/linh vật/Insights theo D-19; không Inbox Alerts.

Mỗi UC cần điều kiện/trigger, các bước user/hệ thống, thành công/thiếu/trùng/hủy/pending/nguồn cũ/mất quyền/xung đột và hậu điều kiện theo mức. Dictionary cần account, holding/movement, source record/evidence, event, quote, review case, report snapshot; rules cần tiền/đơn vị/ngày, opening/transfer/refund/reversal, nguồn sự thật và các trục trạng thái riêng. Bước 2 chưa cần OpenAPI hoặc backend.


## 10. Nguồn thay đổi và cấu trúc 5 navigation hiện hành

D-19: user yêu cầu sửa tài liệu bước 1–2 theo ý tưởng bổ sung **5 navigation**, ngày 05/10/2026. Đây là thay đổi scope được giao, supersedes exclusion Goals/Assistant và navigation 7 của đề xuất chat cũ. `scope-v1/analysis-v1` được giữ trong [snapshot superseded](../governance/baselines/scope-v1-analysis-v1.zip); không còn là baseline hiện hành. `scope-v2/analysis-v2` là baseline làm việc, pending external review, chưa sign-off/M1.

| Nav ID / chính | Mục con | Cấu trúc thông tin / điều hướng |
|---|---|---|
| NAV-HOME / Tổng quan & Báo cáo (Home) | Tổng hợp; Báo cáo; Tài khoản & Tài sản | Hai khối lớn Tiền & Hoạt động / Tài sản & Cơ cấu; thu–chi/dòng tiền/Insights/cơ cấu; tháng/quý/năm/custom; asset lists/details có mutation/history/source |
| NAV-TXN / Giao dịch | Tất cả; Thu–chi; Chuyển tiền; Hoàn tiền | Các view cùng danh sách; detail→type/state/evidence/history→sửa/Review; giao dịch mua tài sản liên kết holding khi đủ căn cứ |
| NAV-PLAN / Plan (Kế hoạch) | Tổng quan kế hoạch; Thu nhập & Chi tiêu; Đầu tư; Mục tiêu; Mô phỏng | Dữ liệu hiện tại→planned items→actual links→variance/forecast→goal tracking→scenario đạt goal, phân biệt actual/planned/simulated |
| NAV-DATA / Dữ liệu | Nguồn dữ liệu; Kiểm tra dữ liệu | Import/connection/history trong Sources; open/resolved cases trong Review, type là filter. Không mất chức năng khi gộp hai bề mặt |
| NAV-AI / Trợ lý AI | Trò chuyện; Lịch sử hội thoại | Full chat/cards/refs; linh vật toàn cục mở panel cùng conversation/context, không Pet của Codex/Work và không navigation riêng |

Cài đặt/thiết lập/demo/reset ở menu hồ sơ, không mục chính thứ 6. Mobile cũng đúng 5 đích, Dữ liệu giữ visible hoặc menu rõ cùng route; không thay Plan bằng Thêm. Period/scope/object dùng chung Home→detail→AI, read/mutation có quyền tương ứng. Kế hoạch không là sổ tài chính thứ hai; AI chỉ giải thích Engine/read-only. M1 không yêu cầu gọi provider hay tạo hình/sprite linh vật ở bước 2.

“Balance sheet” hiện được thực hiện như **Cơ cấu tài sản đang theo dõi** (4 nhóm, tiền và holdings). Liabilities/net-worth đầy đủ chưa được user chọn rõ nên vẫn deferred; không trình bày như đã biết nợ=0. D-20 giữ lựa chọn có nhãn; nếu thêm nợ phải impact data/rules/AC riêng.
