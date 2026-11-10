> AI-SPEC-001 — 08/10/2026: nguồn chức năng AI hiện hành là [đặc tả hợp nhất](../product/ai-agent-specification.md). Các mô tả scripted/read-only bên dưới ghi implementation/mock cũ; chat/history/mascot được kế thừa, Agent có quyền tạo draft theo spec và owner xác nhận riêng để áp dụng. Không hiểu mô tả mock như yêu cầu xóa capability cũ hoặc cấm draft mới.

# Component Specifications v0.1

DES-CMP-001 · 06/10/2026 · scope-v2/analysis-v2 · implemented, AG self-review; PO review pending. Các API bên dưới mô tả code M1, không hợp đồng backend M2. [Gallery chạy được](http://127.0.0.1:4179/design), [tokens/style/process](design-system.md), [coverage](../execution/evidence/m1-coverage.md).

## Quy tắc chung

Anatomy: nhãn → giá trị/hành động → đơn vị/trạng thái → nguồn/thời điểm → drill. Số tiền dùng MoneyValue; nội dung nhạy cảm dùng PrivateText. Không gắn số thật vào title, aria-label, URL hay tooltip khi mask. Caption và nhãn trạng thái giữ ý nghĩa dù mất màu. Các khối feature hiện tổ chức trong Home/Transactions/Details/Plan/Data/Assistant; những tên nghiệp vụ dưới đây là composition đã chạy, không giả rằng tất cả là exported React component riêng.

Controls tối thiểu 44px; focus outline xanh 3px và offset 2px. Enter/Space theo native control, Tab theo DOM. Inline label gắn htmlFor/id; lỗi có chữ, aria-invalid và aria-describedby. Không tự focus chart SVG. Dialog giữ focus trong phạm vi, Escape/đóng trả về trigger hoặc main nếu trigger đã unmount. Mobile stack fields, wrap actions, scroll trong dialog/bảng; trang không scroll ngang.

## Nền tảng

| Component / anatomy | API thật, events | Variants và states | Validation, keyboard, responsive, usage |
|---|---|---|---|
| Button: icon tùy chọn + text | `ButtonHTMLAttributes<HTMLButtonElement>` + `variant?:string`; onClick/type/disabled/aria-label do caller truyền | mặc định secondary; `primary`, `ghost`, `danger`; hover/focus/disabled; loading bằng text và disabled của caller | Native button. Trong form, Hủy type=button, submit type=submit. Không có prop busy riêng. Icon-only phải có aria-label. Một primary CTA cho bước đang làm |
| Input: label + control + hint/error | Native input qua RHF register; Field.key/label/type/required/hint/initial/when | text/date/money/quantity; invalid, disabled; giữ draft khi lỗi mạng/version | Money inputMode=numeric; quantity=decimal; schema boundary kiểm giá trị, không dựa browser type=number. Ngày ISO hợp lệ, amount>0 cho event, opening≥0. Form 2 cột→1 cột dưới640 |
| Select: label + native options + hint/error | Field.options `{value,label}[]`; onChange/watch; id do register | selected/disabled/invalid; không tự chọn account archived | Keyboard native, label không chỉ placeholder. ID/currency/type kiểm lại tại command. Không dropdown custom lấn viewport |
| Textarea: label + nội dung + hint/error | Field.type=textarea hoặc composer chat; RHF/native value | reason/prompt; invalid; disabled khi mask hoặc chờ | Reason bắt buộc ở correction/resolve/plan/goal. Có aria-invalid/describedby. Composer Enter tùy action native, nút Gửi luôn hiện; không tự gửi khi đổi navigation |
| Modal: overlay + title + description + body + close/actions | `open,onClose,title,description?,children,panel?,lockClose?` | form/detail/preview; contextual side panel; loading/error; lockClose khi commit hoặc đổi fault | Radix Title/Description/trap; X/Escape/click ngoài đóng khi chưa lock. Không đóng trong commit đã bắt đầu. Trả focus có fallback main. Dialog maxheight+scroll, panel mobile nằm trên bottom nav |
| Table: caption + th + rows + actions | Native table; rows do feature/chart map; action native button/link | data/empty/filter-empty; posted/pending/draft; money cột căn phải | Không clickable tr vô danh; caption nêu nội dung/unit. Table-wrap overflow nội bộ; Giao dịch có mobile cards thay bảng. Empty có clear filter/tạo/retry theo nguyên nhân |
| Badge / Empty / Evidence | Badge `{tone?,children}`; Empty `{title,children?,action?}`; Evidence `{children}` | info/warning/error/planned/simulated/unknown; no-data riêng error | Tone không mang logic hoặc cấp verified. Text bắt buộc. Evidence là container căn cứ; click/drill do caller thêm. Empty không dùng 0 thay null |

## Tài chính và chất lượng dữ liệu

**MoneyValue** (`src/app/context.tsx`): props `value:string|number|null`, `metric?:boolean`, `sign?:boolean`; không events. Anatomy số + ₫. `null` hiển thị “Chưa biết”; 0 hiển thị 0 ₫; sign chỉ thêm + cho số dương. Intl vi-VN, tabular numerals; Decimal ở domain trước formatting. Mask hiển thị `•••• ₫`, không giữ giá trị trong accessible text/title. Metric thay type scale, không thay precision. Cột/table dùng value đầy đủ; chart axis có nhãn triệu VND.

**Freshness** (`src/components/ui.tsx`): `time?:string,stale?:boolean,source?:string`; clock icon + time/“Chưa có thời điểm” + badge “Cũ”/“Đã ghi nhận” + source. Caller tính stale theo đúng loại: quote/FX >24h, quantity >30 ngày, source >48h, strict >; không gom timestamp thành “mới nhất”. Badge “Đã ghi nhận” không là độc lập xác minh. Holding detail hiện riêng lượng/quote/FX và nguồn; nguồn lỗi giữ quote tốt cuối.

**SourceEvidence**: composition Evidence + metadata trong Details/AI; source ID, raw synthetic/ref, parser/mapping khi import, mốc date-only hoặc timestamp, object/result version. Chưa có raw evidence thì ghi thiếu. onOpen chỉ dẫn object thật trong memory; không tạo URL provider giả. Mask che raw/mô tả/lịch sử. User override là nhãn khác source revision; reimport giữ override.

**TransactionRow / EventState** (`Transactions.tsx`, `Details.tsx`): date/description + account/from→to + loại tiền + posting + reconciliation + category + amount/source/ref. State axes độc lập; reversed giữ history và signed effects theo rule. onOpen→selected=event:id; onCategory/onCorrect/onPostDraft/onPlanLink qua ActionForm. Draft/pending không góp vào posted aggregate. Correction phải có reason/version và preview; giữ original/reversal/replacement, không sửa âm thầm original. Mobile card giữ nguyên thứ bậc/các badge. Refund drill có origin và ngày nhận; transfer có hai chân và fee riêng.

**HoldingCard** (`Home.tsx`, `Details.tsx`): identity/ticker+market hoặc product/purity → lượng canonical+display → date/source lượng → giá/currency/unit/FX/date → value/quality → lịch sử. Stock và gold dùng một visual anatomy, khác validation. onOpen, updateQuantity, updateQuote, linkedInvestment qua action service. Quantity edit không cash event. Gold canonical chỉ; 1 lượng=10 chỉ, 5 chỉ=0,5 lượng; USD/lượng cần FX phù hợp. Price incompatible/missingFX cho unknown. P/L hiện chưa biết khi không có cost basis, không tự tạo chart lợi nhuận. Optional total cost VND tự khai báo; Cost action giữ amount/date/quantity/source, không cash. P/L tham chiếu chỉ khi quantity tại as-of khớp cost declaration và cost date không tương lai; khác lượng/missing thì unknown.

**FinancialChart** (`components/FinancialChart.tsx`): `rows:ChartRow[]` (`name,value:string,color?,onClick?`), `title,type?:bar|pie|line,unit?,source?,time`. Anatomy SVG → caption nguồn/time/unit → details table → native drill buttons. ECharts đọc semantic CSS tokens tại chart boundary; chuyển string→number chỉ để vẽ. Không có data thì text no-data. Unknown full valuation không tạo phần thiếu trong donut; hiện known subtotal và danh sách thiếu. Mask unmount geometry/tooltip, bảng MoneyValue mask. Click mark và button/table row gọi cùng onClick. ResizeObserver; dispose khi unmount. Reduced motion tắt animation. Không phát minh historical price line từ một quote.

## Plan, Goals, Review và AI

| Composition | Anatomy / states | Props/data và events đang dùng | Validation / usage |
|---|---|---|---|
| PlanItem / Forecast | planned badge; baseline/version; horizon/recurrence; planned, actual matched, remaining, overspend; fixed-price assumptions | `planSummary(store,period)`; create/edit/archive; click actual→Giao dịch có plan filter; link/unlink tại event detail | Account/currency/kind/date phù hợp; event chỉ gắn một item/version. Recurrence monthly clamp cuối tháng, horizon≤24 tháng. Actual event không bị post lại bởi Plan; remaining không âm. Form giữ input nếu conflict |
| GoalProgress | lifecycle active/achieved/archived; target/due; funded bar và allocated riêng; remaining/shortfall; backing accounts/history/actions | `goalSummary` tại business clock, toàn account sources; create/edit/allocate/release/achieved/archive/simulate; optional contributionSchedule(amount/account/start/day monthly) chỉ planned | Aggregate allocation≤cash đủ điều kiện, không dùng planned income/stock valuation. Chi actual vẫn được ghi dù thiếu backing; pro-rata stable remainder1VND. Achieved chỉ khi funded≥target. Archive/release không ledger event. Mask gỡ progress geometry và tên/history |
| ReviewCard / detail | issue type/status + căn cứ/history + proposal + before/after + reason/actions | Review data có status open/resolved. “Để sau” giữ open và history; không enum deferred giả. `resolve` command theo từng type | Duplicate gộp evidence không tiền; invalid bổ sung input có preview, giữ raw và post một lần; transfer cần receipt; refund link/cần xem lại; category override; pending confirm/refuse; cash observation→expense hoặc adjustment. Cancel preview không mutation, retry resolved delta0. Quality holding/source là cảnh báo tính độc lập với cash case |
| SimulationCard | simulated badge; frozen snapshot/version; dated steps; assumption list; actual frozen / conditional cash-assets; future và cumulative gross/net | `simulate` save/consume/invest; mở lại form tạo lần tính mới; so cards đã lưu | Earmark không đổi cash/assets; consume giảm cả hai; invest chuyển cash sang value, không chi sinh hoạt. Steps có date tăng dần sau clock, trong horizon; firstDate+intervalDays optional, mặc định chia đều ngày. Partial nếu thiếu value. Không actual posting; không probability/return forecast giả. Version cũ hiển thị cần tính lại |
| AIResultCard | scripted/read-only label; captured nav/period/scope/object/version/time; result IDs; quality; metric/ref/action | shared ChatProvider cho trang/panel/history; ask, cancel, open full, new question, drill existing object | Processing/result/stale/denied/no-data/tool-error/timeout/quota. Clone snapshot lúc gửi; response cũ không đổi context mới. Allowlist read-only; không ledger writes/trade/SQL/workspaceB. No-data/error không metric cards bịa. Mask cả prompt/narrative/cards/history, disable composer. Reset xóa conversation/context |

## States và bằng chứng

`/design` render palette/type/controls/error/select/dialog/unknown/freshness/evidence/chart table/mask, EventState và các link mở composition thật. Business states khác được tạo bằng fixture và tác vụ: F-EMPTY, F-MISSING, F-STALE, F-TRANSFER, F-PENDING; fault none/offline/timeout/conflict/tool/quota trong Thiết lập. Case store, filter và draft không bị reset bởi điều hướng bình thường; Reset chủ động clear toàn phiên.

Browser evidence B01…B19 trong [Validation](validation-report.md) kiểm cấu trúc/flows. Chưa có user research, screen reader user test, production authorization hoặc WCAG certification. Composition inline có thể extract thành exported components khi M2 cần tái dùng ở nhiều caller; tên trong spec là nhãn thiết kế, không hứa interface chưa có.

## Components bổ sung: AuthProvider/AuthGate/AuthScreen và ModuleCatalogue

06/10/2026, usergiao authutilityscreens: AuthProvider(children) owns syntheticuser/setUser/endSession(expired), AuthGate(children) choosesauthscreen orfinancialproviders, AuthScreen controlledemail/name/password/confirmation/code/ack/busy/error/result state. Mockservice tạochallenge→verifiedownersession, reset/registermemoryidentity, signout/expiry clear/queryreset. Variants7routes; nativeField+Button/Badge; guarded/.test validation, routeheading/errorfocus, keyboardEnter, label+aria-describedby, alert/status; passwordreveal aria-pressed; showOTPdemo explicitly; desktop2panels/mobile1. Norealprovider/crypto/authsignoff.

ModuleCatalogue has13cards, routes/formsactions, native details/summary86semantic actions/stateinventory. Source interface-catalogue.ts dùngcùngsourcevới generatedcoverage; links mởroutes/Buttonquickforms; no businessrequest chỉ mởpanel/filter. Props khôngsupplyfinancialserverauthority, eventsnavigate/openAction/endSession explicitlylocal/fixture. Responsive2columns→1, minimum44pxbuttons, financial privacy unchanged. [AuthSpec](authentication-specification.md), [Catalogue](../execution/evidence/step4-action-coverage.md), [Step4report](../execution/evidence/step4-validation-report.md).

## Component Specifications v0.2 — network states bước5

Tái dùng anatomy/props/keyboard/responsive v0.1, tokens không thay stack. Runtime: components/ActionForm, features/ImportWizard/ImportJobs/Auth/Assistant, app/context/chat-provider và services/presentation.

| Component | Props/state/events | Validation/network behavior | Focus/responsive/usage |
|---|---|---|---|
| ActionForm | spec(title/kind/fields/data/onDone), onClose; editing/preview/busy/error | RHF required + typed API input validation; latch preview/confirm/provider, named mutation; cùng command key/token khi retry; input giữ lỗi, re-preview sau409; success invalidate/refetch trước onDone | busy lockclose; Escape/cancel trướccommit; label/hint/errors described;2cột desktop/1 mobile; MoneyValue dùng mask |
| ImportWizard | local CSV/account/batch/mapping/selectedRows, ImportPreviewDTO | API template query;64KB/20rows/integer/date/mapping; batch ASCII1–80; preview token/version; mutation subset; changed-input epoch bỏ response cũ; bank eligibility tự cập nhật | file/paste/select có label; table scroll trong card; raw↔normalized, unknown không0; giữ input khi lỗi,reset generation cleardraft |
| ImportJobs | listImportJobs query, pending/running/completed/failed | polling250ms khi active, manual retry query; failedjob không committedIds, lỗi có next action; successful retry batch replay samekey/job | h2+status/alert text/badge; counters PrivateText/mask; rows mobile wrap; source/time/resultVersion |
| Auth |7routes và profile utility; fields/email/password/confirm/code/ack |6identity network calls, submit latch+same intent key, validate .test/policy, no realsecret; cache/drafts cleared logout; route expired giữ đúng destination | keyboard/submit/show-hide, labels/errorfocus, responsive authstory; pendingdisabled; synthetic indicator |
| Assistant/chat panel | draft/panel/active conversation/pending/messages/localError | query resources, create/send/poll/cancel services; captured context/versions; attempt giữ key nếu không rõ phản hồi; readonly scripted; error no metrics; refetch history | shared full/panel;500chars, focusreturn, cancel terminal; chips+historybuttons disabled busy/masked; result metric classification riêng |
| MoneyValue/source/evidence | value:string/null, masked, sign; time/source/refs | data từ typed snapshot, Decimal computation ở sharedselectors; null=chưa biết; lastSuccess giữ khi refreshfail; no cachedfixture fallback | tabular vi-VN, chart thay table, mask cảamount/quantity/text/aria nhạy cảm |

Không tuyên bố mỗi state trên từng instance đã user test. Automation và tự walkthrough theo report; UI denial/auth chỉ synthetic, không permission/security thật.


AI history sử dụng listMessages/listConversations với cursor/pageSize10, Tải thêm và loading/error/retry; cùng provider cho panel và full page. Context includes transaction tab/type/search/filter; thay đổi context đánh dấu kết quả cũ. Auth expired/logout giữ destination nhất quán trước route guard, submit có latch và idempotent retry options. Tests N06/N07/AUTH-UI-05/06 xác nhận hành vi.

## Bước6 / Design v0.3 — states đã chạy

ActionForm locks input/select/textarea trong previewpending; server400–499 có thể refetch/repreview với inputgiữlại. Unknownoutcome(status0/5xx/malformedACK) giữ request/key/options gốc, Backdisabled, Thử lại cùng yêu cầu; close không hủy servercommit. Provider chỉ settle sau successrefetch. ImportWizard disableCSV vàrestore trong initialtemplateload để không tự nạp đè draftempty; epoch bỏ oldsuccess/error. Assistant cancel500 giữpending/alert/retry, queuedcancel trướcsend không tạo message. /designv0.3 ghi đúng states và link tới instances đã chạy, không giả visualexamples là mutation. E01–10/N05/B11–13 và97units theo [Acceptance](../testing/frontend-acceptance-report.md).

Money charts/insight cùng snapshot, nhãn leader gồm mọi nhóm đồnghạng. Width360/390/1440 có validation/preview/detail/panel thực chạy; nội dung ở [Visual report](../testing/accessibility-responsive-report.md).
