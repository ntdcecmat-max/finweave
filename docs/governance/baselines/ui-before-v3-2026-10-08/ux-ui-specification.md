> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# UX/UI & Frontend Technical Specification v0.1

DES-UX-001 · 06/10/2026 · scope-v2/analysis-v2 (28REQ/AC) · implemented, render-reviewed bởi AG; PO formal review pending. Bản nháp được tạo trước /design và trước triển khai features; nội dung này cập nhật theo code/render thực tế. [ADR](../architecture/adr/ADR-001-frontend.md), [Design System](design-system.md), [Components](component-specifications.md), [Patterns](pattern-library.md), [Accessibility](accessibility-requirements.md), [Validation](validation-report.md).

## Information Architecture — DES-IA-001

| Navigation chính | Tabs/routes thực tế | Câu hỏi / đối tượng và hành động |
|---|---|---|
| Home | /home Tổng hợp; /home/reports Báo cáo; /home/assets Tài khoản & Tài sản | Tiền ở đâu, chi lớn, tài sản có giá nào; account/holding CRUD, history, quantity/quote, cash count |
| Giao dịch | /transactions; /transactions/flow; /transactions/transfers; /transactions/refunds | Tất cả / Thu–chi / Chuyển / Hoàn; ghi, lọc, detail, sửa/category/posted correction, evidence, plan match |
| Plan | /plan; /plan/items; /plan/investments; /plan/goals; /plan/simulation | Tổng quan; Thu nhập & Chi tiêu; Đầu tư; Mục tiêu; Mô phỏng; forecast/versions/actual tracking |
| Dữ liệu | /data Nguồn dữ liệu; /data/review Kiểm tra dữ liệu | Source capability/connection/freshness, CSV mapping/staging/jobs; case/evidence/resolution/quality |
| Trợ lý AI | /ai chat; /ai/history | Scripted read-only result+evidence; shared conversation với panel contextual |
| Utility qua Thiết lập | /design; dialogs Thiết lập/Scope/Khoảng tùy chọn | Không navigation thứ6. Settings là dialog qua profile; desktop thêm shortcut cuối sidebar |

Object detail là dialog deep-link qua query **selected=event:id / account:id / holding:id / review:id / formula:cash|assets|flow**. Không tạo route :id hoặc /settings chưa có. Base / chuyển Home; route không tồn tại có CTA về Home. Mobile bottom nav đúng5đích luôn có icon+label; desktop sidebar đúng5đích.

URL giữ period/start/end/scope và transaction filters category/type/account/posting/reconciliation/search/plan/selected. Không đưa amount/raw/key/prompt vào URL. Date range start inclusive/end exclusive; custom UI chọn ngày cuối inclusive rồi chuyển ngày sau. Back phục hồi URL/context trước; close detail bỏ selected. Period/scope giữ khi đổi nav. Plan horizon và goal funded tại business clock độc lập report filter; không bỏ backing chỉ vì ẩn account khỏi báo cáo.

## User Flows — DES-FLW-001

| Flow / REQ | Tác vụ cụ thể và kết thúc | Nhánh khác / guard |
|---|---|---|
| FL-01 Setup, AC01–05 | Thiết lập→Reset F-EMPTY→mốc theo dõi→Home/Assets thêm bank/wallet/cash→thêm DEMO-A/gold→quote→preview/confirm→Home | Invalid tên/amount/date/market/unit chặn; cancel không item. Opening tách income. Missing/null khác khai báo0; cash tự khai báo, chưa count |
| FL-02 Ghi cash/chuyển/refund, AC08 | Giao dịch→Ghi giao dịch→kind/account/amount/date/category hoặc to/origin/fee→Xem tác động→Xác nhận→list/detail/Home | Transfer 2legs+fee riêng; refund nhận ngày nào tính ngày đó; draft/pending chưa posted; investment linked cash+holding không expense |
| FL-03 Import/source, AC06/07 | Dữ liệu→sample/file giả+account+mapping→preview raw/normalized/status→select valid→subset impact→confirm→job/Review | Hủy chưa job/case; retry same batch delta0; invalid/duplicate cần Review. Refresh lỗi giữ quote; revoke→reconnect giả→retry; không key thật |
| FL-04 Hiểu số, AC11/13/14/20/21 | Home→metric explanation hoặc chart Ăn uống→DEMO04/05→detail/evidence→Back; assetmark→holding→quantity/quote/unit/source | Scope ngoài wallet giải thích transfer flow; custom08Oct không dùng31Octquote; no results clear filter; unknown partial subtotal |
| FL-05 Xử lý nghi vấn, AC09/12/15/16 | Cash count2,8m khi calculated2,85m→observation−50k→Review evidence→adjustunknown hoặc forgottenexpense→reason/preview/confirm/history | Observation không post; cancel giữ money; duplicate hợp nhất evidence không double; source revision giữ manual category; quality lượng/giá/FX/nguồn riêng |
| FL-06 Plan tracking, AC22/23 | Plan→thu5m/chi2m/invest1m Nov→forecast33,1m→edit/version→clockNov30→actual4m/2,5m/0,5m+10shares→link từngitem→remaining/overspend | Forecast không actual; transfer/wrongaccount/date/kind chặn; unlink không ledger; recurrence clamp31; conflict giữ input và re-preview |
| FL-07 Goals, AC24/25 | Goal5m dueNov30→allocatebank3m→funded60%/available23,5m→actualbankspend24m→funded50%/shortfall0,5m | Goal2allocate24m chặn aggregate; spending thật vẫn ghi; allocation giữ; achieved cần đủ funded; release/archive không moneyevent |
| FL-08 Mô phỏng, AC26 | Goal3mallocated→góp1m×2 save; consume5m; invest1m→lưu3conditionalcards→so với frozen actual→tính lại phiên mới | Save chỉ earmark; consume/invest khác cash/assets/gross; partial nếu thiếu quote; actual không mutation; version/horizon/assumptions rõ |
| FL-09 Contextual AI, AC27/28 | Bất kỳ5nav/selected→headerlinh vật→chipcontext→send→pending→result/ref→fullchat/history→drill | Response giữ capture lúc gửi; navigate không thay oldresult; no-data/tool/timeout/quota/denied không số bịa; cancel khôngresult; maskall; resetclear |

[Demo script](../execution/evidence/demo-script.md) có dữ liệu và bước lặp lại. Đây là flows đã Agent tự walkthrough, không nghiên cứu người tham gia.

## Wireframes — DES-WIR-001

Wireframe section /design là layout giản lược có5templates và link mở màn thật. Cấu trúc đọc theo DOM:

Home: shell/context → title+CTA → subtabs/coverage → CASH HERO | ASSET HERO → INCOME/GROSS/REFUND/NET → FLOW | SPEND → ALLOCATION | ACCOUNT BALANCES → INSIGHTS.
Giao dịch: title+CTA → 4tabs → filters → rows/cells hoặc mobile cards → detail/evidence/adjust.
Plan: title/CTA+5tabs → planned metrics → forecast line/timeline → items actual/remaining → goals backing/progress hoặc frozen simulation comparisons.
Dữ liệu: 2tabs → source cards → CSV staging/mapping/preview → jobs/audit; Review: status → case cards → quality warnings → detail proposals.
AI: context+scripted label → questions hoặc captured conversation → result/evidence/drill → composer; History giữ cùng capture version.

Desktop sidebar224px, header kỳ/scope/privacy/profile/mascot, content max1240px. Dưới1000 sidebar184px; dưới760 sidebar biến thành bottom5nav72px. Dưới1200 hero xếp1cột để số lớn dễ đọc; dưới640 layout business1cột, summary4cards thành2×2, form1cột, chart220px. Header linh vật44px nằm trong normal flow ở mọi width, không floating phủ CTA/profile. Sidebar/header labels phụ nhỏ hơn body nhưng không mang financial value chính.

## Frontend structure và data boundary

finweave-web/src/app: App/routes/shell, Query store/context, URL filters, action builders và detail/action view context.
components: Button/Badge/Modal/Empty/Freshness/Evidence, ActionForm và FinancialChart.
features: Home, Transactions, Details, Plan, Data, Assistant; design: tokens/base/layout/DesignPage.
domain: model, fixtures, import parser, deterministic Decimal selectors và commands.
services/demo: fetch/AbortController; mocks/browser: MSW handlers và memory store.

Query key hiện tại ['store'] duy nhất cho local demo single workspace; report là selector của store+URL context, không cache report thứ2. Commit trả store mới→setQueryData; error không optimistic-post. Reset tăng generation, clear filters/mask/drafts/dialogs/chat và nạp fixture chính xác. Đây là seam tái sử dụng M2; M2 phải bổ sung workspace/versioned query keys, formal contracts/transport/auth/error/pagination, không coi ['/demo'] là đã nghiệm thu bước4.

Network thực tế GET /demo/state, POST /demo/preview, POST /demo/command intercepted MSW tại cùng origin. Memory clone preview; key+payload check; expected store.version và command guards; commit atomic trong synthetic memory. CSV batch identity giữ payload/mapping/account/selection. Service abort5s; fault modes không chứng minh fault handling backend thật. Không persistence, provider, LLM, paid service hoặc public host.

Money decimal string, VND integer round-half-up từngholding trước cộng; quantity decimal. Date-only giữ nghĩa Asia/Ho_Chi_Minh, timestamp+07 riêng. Full valuation null nếu thiếu; known subtotal không gọi full/net worth. Phân loại/posting/reconciliation riêng. Actual/planned/simulated không dùng chung row như đã xảy ra.

## Charts và interactions

ECharts modular SVG bar/pie/line; màu từ CSS semantic tokens; caption source/unit/time và native table/drill. Axis triệu VND được ghi rõ, tiền đầy đủ ở table/detail. Home spend theo net nhưng table/căn cứ giữ gross/refund. Tie ăn uống/mua sắm400k ghi đồng hạng. Flow không chỉ nét expense; scope boundary tách transfer.

Donut chỉ portions đã định giá, unknown không dựng lát0; Home cảnh báo total unknown và giữ known subtotal. Holding detail phép tínhqty×quote×FX/unit/time. Reports price movement cần hai quote hợp lệ cùng khoảng; chưa đủ thì unknown, không historical chart giả. Plan forecast line có Dự kiến và fixed-price assumption. Simulation so frozen values với conditional result, không giá thị trường forecast.

UI actions đều có input/action/result hoặc link tới scope object. No-data/invalid/offline/timeout/conflict/revoked/loading/stale/empty/cancel/retry có cách tiếp tục. Form preview→confirm; confirm busy chặn repeat/đóng. AI processing clone capture; không để pending result đè context mới. Privacy gỡ toàn geometry và nhạy cảm text; masking chỉ UI synthetic, không security guarantee.

## Visual checklist và assumptions

Xem trực tiếp đủ40References; học hierarchy/dashboard, readable table, provenance, plan/AI composition. Không sao số/logo/billing/asset/concept animation. Phần thiếu tự đề xuất: before/after financial preview, independent timestamps, boundary explanation, full unknown subtotal, goal backed capacity, captured AI result, mobile action placement. Căn cứ28UC/BR/DR, D23…27 và catalogue; không chờ user thêm ảnh.

Kiểm1440×900,390×844,360×844; no page overflow; dấu Việt/số dài; label/status/time/source/unit; table alternative; touch/focus/trap/Escape/return; planned/simulated/actual; maskcards/chart/detail/AI/history; reset/replay. [Validation](validation-report.md) ghi result thực tế, defects và giới hạn; thiết kế v0.1 tiếp tục in-review, chưa khóa PO acceptance. Bundle còn lớn và chưa cold-load/production capacity benchmark. Không có participant, không research result giả.

## Frontend technical specification v0.2 — bước5

React app hiện hành,16business+7authroutes+/design; đúng5navigation. AuthGate trước AppProvider; QueryClient → Auth/App/Chat providers → View/detail/forms. Services/API layer và mock network tách module; protected mode đóng. [ADR004](../architecture/adr/ADR-004-stateful-mock-and-read-model.md), [Mock Implementation](../frontend/mock-implementation.md) quy định state/data boundary và lifecycle.

Responsive/tokens/charts/keyboard/privacy tiếp tục design đã kiểm. Shared snapshot cho card/chart/table/detail, source/time/unit/missing và actual/planned/simulated classification. Account/holding mutations refetch; quote cập nhậtvaluation, quantity không tự tạoexpense. Import asyncjob và Review có evidence; Plan/Goal không ghiactual, simulation frozen. UI không giảm thành5screens; [catalogue](interface-catalogue.md) liệt kê13modules/86actions với contracts/local actions.

Checklist thực hiện: ba viewport, chart table fallback và drill, mobileform/preview/detail/panel; keyboard dialog trap/return, errorinput preservation, duplicate-submit block, import replay, chat cancellation/context/history, mask mọifinancial displays. Kết quả và defects thực ở Step5report; chưa usertest, real provider/security/capacity.


## Bước6 kiểm chứng và correction

Build hiện hành v0.3 giữ tokens/architecture; leaderlabel/insight nói rõ mọi đồnghạng. Previewfields lockpending; uncertaincommit retry immutable request; cancellationerror explicitpending; CSVtemplate-loading race fixed. Visual đối chiếu8ref trực tiếp lần này,40refcatalogueM1 giữlịch sử. [A11y/responsive](../testing/accessibility-responsive-report.md), [Acceptance](../testing/frontend-acceptance-report.md), [Handover](../testing/integration-handover.md). Agent tự review,0participants; design không là userresearch/signoff/securityproof.
