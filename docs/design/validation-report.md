# FinWeave — Prototype Validation Report và gate M1

EVD-M1-001 · v0.1 · 06/10/2026 · Asia/Saigon · scope-v2 / analysis-v2, **28 REQ/AC**. Owner và người kiểm tra: AG. Trạng thái hồ sơ: in-review; chưa có reviewer độc lập hoặc PO sign-off. Loại bằng chứng: Agent tự walkthrough, browser automation và unit tests trên synthetic data; **0 người tham gia user test**, không có Research Results hay UAT thật.

## Kết luận gate

**PASS M1 qua Agent tự kiểm chứng**, theo Playbook §6 và nhiệm vụ bước 3 hiện tại. Prototype web local tiếng Việt chạy được, đủ năm navigation và các thao tác trong scope; visual đi tới giao dịch/holding, có nguồn/ngày/đơn vị và trạng thái thiếu/cũ. Các tác vụ nhập, preview, hủy, xác nhận, Review, Plan/Goals/mô phỏng và AI contextual có kết quả nhất quán. Lỗi UX quan trọng tìm thấy đã sửa và kiểm lại. Dừng ở M1. Formal acceptance của PO chưa diễn ra; không suy PASS này thành M2/M3, khả năng mô hình AI, tích hợp thật hoặc bảo mật chống Ops.

| Tiêu chí M1 | Kết quả / căn cứ |
|---|---|
| Scope và luồng | 28 hàng REQ/AC hiện hành trong [coverage](../execution/evidence/m1-coverage.md), đối chiếu [RTM](../execution/traceability.md); không dùng exclusions hay gate 18 AC cũ |
| Prototype và cách mở | [Home](http://127.0.0.1:4179/home), [/design](http://127.0.0.1:4179/design), dist và Start-Prototype.cmd; hướng dẫn [README](../../README.md) |
| Design có nội dung và đã render | Catalogue trực tiếp 40 ảnh; principles/style/tokens, component specs, pattern library, IA/flows/wireframes/UX/UI/frontend/a11y; tokens thực thi trong CSS; gallery trước mở rộng và cập nhật sau browser review |
| Hiểu tiền và drill-down | Home phân biệt tiền với tài sản, gross/refund/net; bar cashflow/spend, donut cơ cấu, line Plan và bar simulation; bảng thay thế có nút mở detail; source/time/unit và unknown/partial |
| Tương tác nhất quán | Setup bốn nhóm, cash, CSV subset/retry, source lỗi, Review, corrections; actual khác planned/simulated; Goal earmark không sinh tiền; shared AI history và captured context |
| Responsive/keyboard/privacy | 1440×900, 390×844 và 360×844; 36 ảnh route, mobile form/panel, keyboard/focus/Escape, mask toàn app và reduced-motion; raw a11y JSON |
| Lỗi và evidence | Defect log dưới đây; unit/browser/build và ảnh thực tế. Chưa user test thật; yêu cầu participant test có điều kiện được ghi trung thực |

## Phương pháp và môi trường

Đọc Ideas, Playbook, Human Setup, navigations, hồ sơ bước 1–2 hiện hành, docs/execution và quy định workspace trước thiết kế. Tech Stack là đề xuất, được thay bằng ADR frontend trước scaffold. Trực tiếp xem từng ảnh trong References; không dùng concept như asset/animation sẵn có. Kế hoạch nghiên cứu giả thuyết riêng tại [Research Plan](research-plan.md).

Browser walkthrough dùng Chrome 154.0.8037.98 với profile kiểm thử riêng, phục vụ **dist bằng run-local.cjs**, HTTP loopback 127.0.0.1:4179. Máy: Windows 10.0.26200, Intel i5-1155G7 @2.50GHz, RAM 8GiB; Node bundled 24.19.0. TypeScript strict, Vite production build. Browser trong Codex được dùng thêm để xem /design, Home và thao tác chart → giao dịch. Dataset mặc định F-COMPLETE: 8 events, 3 tài khoản tiền, 2 holdings, business clock 31/10/2026 18:00 +07. F-BASE/F-EMPTY/F-MISSING/F-STALE/F-TRANSFER/F-PENDING được reset rõ cho từng nhánh. Reload không là persistence: nó nạp lại F-COMPLETE.

| Kiểm tra | Kết quả cuối / raw evidence |
|---|---|
| Strict typecheck và build | PASS; [build.log](../execution/evidence/build.log). Main chunk khoảng 1.182MB minified, 386kB gzip; Vite cảnh báo >500kB được giữ nguyên trong log |
| Unit oracle nghiệp vụ | **28 passed / 0 failed**, 2 files; [unit-results.json](../execution/evidence/unit-results.json). Expected số tiền độc lập trong test, không chỉ gọi selector rồi tự so với chính nó |
| Browser walkthrough | **24 passed / 0 unexpected / 0 skipped / 0 flaky**; [browser-results.json](../execution/evidence/browser-results.json), [HTML report](../execution/evidence/browser-report/index.html). B12 ×3 và B13 ×2 là các ca riêng trong tổng 24 |
| Axe 12 routes ×3 viewport | **0 violations** trong các [1440](../execution/evidence/accessibility-1440.json), [390](../execution/evidence/accessibility-390.json), [360](../execution/evidence/accessibility-360.json) JSON. Không là chứng nhận WCAG |
| Reduced motion | B21: matchMedia reduce=true, thời lượng CSS bằng 0; [JSON](../execution/evidence/reduced-motion.json). Chart animation tắt khi reduce |
| Đo local warm filter | 10 warm-up +10 samples: median 45.3ms, p95/max 67.32ms, target giả định ≤1000ms; kết quả chính xác ở [performance-results.json](../execution/evidence/performance-results.json). Chỉ đo filter đã tải, có overhead thao tác/assertion; chưa cold load, backend, provider, AI latency hay production capacity |

Ảnh bằng chứng trong [screenshots](../execution/evidence/screenshots/B12-1440-_home.png): AG trực tiếp rà 36 ảnh route thuộc ba kích thước; xem thêm B07 Plan matched, B08 shortfall, B09 ba mô phỏng, B10 privacy, B13-360 validation/preview/detail/panel và B20 dated simulation/supplement. Đã xem trực tiếp /design trước triển khai diện rộng rồi sửa theo render. Full-page capture có thể chụp sticky header hoặc bottom navigation ở giữa ảnh dài khi trang đang cuộn; đây là vị trí viewport lúc capture. Kiểm tra giao nhau của entry/CTA và dialog thực hiện ở viewport thật bằng B13/B19, không suy từ ảnh ghép.

## Kết quả tác vụ và oracle chính

| Tác vụ / trạng thái | Kết quả quan sát và bằng chứng |
|---|---|
| Thiết lập tài sản | Bank20m + wallet0 + cash2m; stock100×50k=5m, gold5chỉ×8m=40m; cash22m/assets67m, opening không income. Required fields, amount/date/unit/market lỗi và hủy không ghi. B01/B14/U opening |
| Ghi cash và xem Tổng hợp | 8 events chuẩn: cash31,1m, income10m, gross1,1m, refund0,2m, net0,9m, flow9,1m, assets76,1m. Bank26,5m/wallet1,75m/cash2,85m. B02/U full ledger |
| Hiểu nhóm chi và một con số | Ăn uống và Mua sắm đồng hạng net400k; shopping gross600k−refund200k. Bấm food đến DEMO04/05, detail source/date/history; dấu hỏi mở công thức. Scope bỏ wallet → cash29,35m/flow7,35m; custom 02–08Oct → cash31,2m/net0,8m/flow9,2m, historical full assets unknown. B02/B05/B15 |
| Nhập nguồn giả và nghi vấn | CSV valid income100k/invalid missing date50k/duplicate600k: preview hủy không job/case; commit valid subset cash31,2m; retry không event mới. Supplement invalid với date12Oct/expense50k → cash31,15m, raw/history giữ. Duplicate dismiss delta0. B04/B20 |
| Cash count/correction/transfer | Observation 2,8m vs2,85m chưa đổi tiền; unknown adjustment −50k không sinh expense; forgotten expense là expense riêng. Posted150→120k → cash31,13m và giữ original/reversal/replacement. Transfer một chân21m → đủ bằng chứng22m, không trừ ngân hàng lần hai. B03/B06/U |
| Holding và chất lượng | Price refresh55k/8,2m → assets77,6m, cash không đổi; quantity110shares →5,5m; buy500k+10shares đổi cash/holding nhưng không expense. USD3200/lượng thiếu FX unknown, FX25k compatible→40m. Quote/source/quantity có tuổi riêng; lỗi giữ giá cuối. Optional cost/P-L không hạch toán actual. B05/B14/B15/B20 |
| Plan/actual/tracking | Planned Nov5m/2m/1m → forecast33,1m/79,1m, actual không đổi. Matched actual4m/2,5m/0,5m+10shares → actual32,1m/77,6m; remaining1m/0/0,5m → forecast32,6m/78,6m, overspend500k/gap−500k. Create/edit/archive/version, unlink, recurrence31 calendar clamp. B07/U |
| Goal capacity và shortfall | Target5m, bank allocation3m → funded60%, available23,5m; goal2 allocate24m bị chặn. Actual spend24m vẫn được ghi: cash7,1m/assets52,1m, funded2,5m/50%, allocation3m/60%, shortfall500k. Pro-rata rounding stable tới1VND; schedule góp chỉ planned; archive/release không money event. B08/B13/B20/U |
| Simulation | Frozen save1m×2 → funded5m/cash31,1m/assets76,1m; dated steps15/30Nov. Consume5m → cash26,1m/assets71,1m, future gross/net5m; invest1m→cash30,1m/assets76,1m/expense0. Actual không đổi, version/assumptions hiện rõ. B09/B20/U |
| AI giữa 5 navigation | Panel/header và full chat/history cùng conversation; capture context trước gửi, chuyển route/kỳ khi chờ không đổi context của kết quả cũ. SQL/write/trade/workspace khác bị từ chối; tool/quota/timeout/no-authorized-data không có số giả. Cancel pending không result; mask ẩn cả free text/raw/quantity/charts/goal progress. B10/B11/B16/B18/B19 |

## Defect log và quyết định sau render

| ID / mức | Finding | Sửa và kiểm lại |
|---|---|---|
| UX-M1-01 / quan trọng | Semantic color var không được chart canvas/SVG giải quyết như CSS thông thường | Resolve custom properties tại chart boundary; cashflow/spend/assets giữ màu chức năng; trực tiếp review /design/Home |
| UX-M1-02 / quan trọng | Linh vật fixed trong header chịu backdrop-filter, có thể đè profile/CTA | Entry 44px nằm trong flow header ở mọi width; B19 đo rect cả3widths, B13 thao tác mobile |
| UX-M1-03 / quan trọng | Select/textarea lỗi chưa có aria-describedby và focus cần trả về origin khi Escape | Bổ sung field association, focus capture/fallback và trap; B11/B13, axe0 |
| UX-M1-04 / quan trọng | Có thể đóng Settings trước request fault hoàn tất, tạo race ở AI quota | Disable khi busy, lock close tới response; B10/B16/B18 kiểm lỗi/no metrics và input/context |
| UX-M1-05 / vừa | Auto-skip nhãn line chart Plan ở360px làm mất nhãn planned | Grid riêng cho line và category interval0; build/browser B07/B12 kiểm lại, bảng luôn có đầy đủ số |
| UX-M1-06 / vừa | Đối chiếu SRS thấy thiếu cost khai báo, lịch góp planned, ngày từng bước mô phỏng và xử lý invalid import | Thêm optional fields/guards, dated table, supplement giữ raw và post-once; 4 unit bổ sung và B20. Không thêm REQ/AC hoặc đổi oracle |
| QA-M1-01 / harness | Sandbox Vitest worker ban đầu ENOENT, 0 tests thực thi | Chạy bằng Node24.19 ngoài hạn chế worker sandbox; chỉ kết quả chạy thật 28PASS được ghi |
| QA-M1-02 / harness | Reduced-motion assertion so literal0ms trong khi build chuẩn hóa0s | Đo parseFloat(duration)=0 và matchMedia; B21 PASS; không đổi hành vi app để khớp test |

Không còn lỗi quan trọng đã biết chặn các tác vụ M1 trong evidence. Các điểm còn cần đánh giá: wording/độ hiểu của người thật, thiết bị và trình đọc màn hình thật, 200% zoom/forced colors, tải lạnh và bundle splitting. Chưa gọi những việc này là đã PASS. Không có lint configuration cũ bắt buộc trong repository; không bịa lint output.

Phép đo B17 được chạy lại riêng sau khi làm rõ median là trung bình hai mẫu giữa cho n=10, p95 nearest-rank; [performance-rerun.log](../execution/evidence/performance-rerun.log) PASS. Report đầy đủ24ca browser được giữ nguyên. [Evidence summary](../execution/evidence/m1-evidence-summary.json) tổng hợp counts và raw measurements, không thay JSON gốc.

## Giới hạn và việc sau M1

AI là scripted/read-only tools trên demo, không gọi LLM. Nguồn ngân hàng/ví/giá/FX đều giả; không có kiểm chứng provider/quota/license tài chính thật. Privacy masking là UI display, không mã hóa dữ liệu hay chứng minh chống Ops. Memory repository, idempotency và conflict là demo; không database durability, multi-user authorization hay backend concurrency/crash/restore. M2 formal contract/transport/security boundary/backend stack vẫn chưa chọn và chưa được thực hiện.

Giấy phép npm đã kiểm metadata/peer/engine, exact versions và lock; notices giữ file upstream được package cung cấp. Một số transitive package không kèm license file riêng được ghi trong inventory, không suy đây là legal clearance cho phát hành public. References không được đóng gói thành asset; SVG FinWeave tự vẽ và system fonts không nhúng font. Không clone toàn bộ app tham khảo, không deploy public hoặc đăng ký dịch vụ trả phí.

Kế hoạch tuyển/thử tác vụ tại research-plan.md; Results chỉ tạo khi có người tham gia thật. Các giả định A-01…06/OD-01/02/03/04/08/09 chưa được user research xác nhận. Theo nhiệm vụ M1 tại thời điểm báo cáo, bàn giao prototype và hồ sơ, **dừng ở M1**.

## Cập nhật sau báo cáo M1 — 06/10/2026

User đã giao bước 4 và bổ sung auth cùng danh mục module. [Báo cáo bước 4 hiện hành](../execution/evidence/step4-validation-report.md) ghi 13 module, 86 thao tác, 7 màn auth, logical contracts và các kiểm tra mới. M1 ở trên là kết quả lịch sử; kết luận dừng M1 đã được nhiệm vụ bước 4 thay thế. Bước 4 đạt mức chuẩn bị M2; M2 product gate và real security/auth/transport vẫn chưa đạt. Nghiên cứu vẫn chưa có người tham gia.
