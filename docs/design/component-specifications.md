# Component specifications — kế thừa và mở rộng

DES-CMP-001 · v1.0 · 08/10/2026 · SPECIFIED. Component đích dưới đây là hợp đồng UX, không tuyên bố tên export/props mới đã có trong code.

[Design system](design-system.md) giữ tokens; [bản cũ](../governance/baselines/ui-before-v3-2026-10-08/component-specifications.md) giữ API React/mock1.1 lịch sử. [Screen spec](screen-behavior-specification.md) là nguồn validation/actions, [AI-SPEC](../product/ai-agent-specification.md) là nguồn chức năng AI. Không viết lại Engine trong component.

## 1. Thành phần đã có cần tái sử dụng

Button/native input/select/textarea, Modal, Table, Badge/Empty/Evidence, MoneyValue/PrivateText/Freshness, ActionForm/MoneyInput, FinancialChart/CashflowChart/MoneyInOut, ForecastDashboard/ForecastChart/PlanningResults/GoalPlanner, CollapsibleCard/BrandLogo, Mascot/FloatingPet, ImportWizard/ImportJobs là nền tảng kế thừa. Feature composition không nhất thiết là exported component riêng. Không xóa các thành phần này để tạo ba app có style khác nhau.

Button hiện dùng native attributes + variant; busy do caller control, không giả prop busy đã tồn tại. Modal hiện open/onClose/title/description/children/panel/lockClose; cần tiến hóa behavior uncertain/leave-with-status theo spec, không khóa modal vĩnh viễn khi mất mạng. MoneyValue hiện value/metric/sign và Freshness time/stale/source là API baseline; target có thể mở rộng sau review, không silently đổi contract.

## 2. Hợp đồng UX chung

Anatomy: label → value/action → unit/state → source/asOf → evidence/drill. Native keyboard semantics, focus visible, required/error text, 44px web/48dp Android. Dialog title/description/trap/return focus; readonly detail không biến toàn row vô danh thành nút. Fields giữ input khi validation/network/conflict; amount/quantity dùng decimal parsing domain, không JS floating-point tính tiền.

Mask không chỉ style: MoneyValue/null, PrivateText/free narrative, chart geometry/tooltips, accessible text, quantity/progress/history/evidence/alternatives đều che theo quyền. Unknown khác0; Badge tone không cấp verified. Chart có bảng/button drill cùng snapshot. Admin không reuse financial cards nhận private DTO.

## 3. Component đích và states

K = kế thừa/mở rộng, M = composition mới; đây là mã thiết kế ổn định.
| ID / phần | Anatomy / dữ liệu cần có | Events, states và validation / keyboard |
| --- | --- | --- |
| CMP-01 Controls & form K | Label, hint, input, field error, summary, Cancel/Preview/Confirm; current values/versions/digest | change/validate/preview/confirm/cancel; editing/invalid/busy/conflict/uncertain. Không mất draft, sửa field invalidate preview, focus lỗi đầu; live alert tránh đọc mỗi keystroke |
| CMP-02 Money/PrivateText K | Value nullable/unit/sign/quality, private narrative; source/asOf khi cần | Read-only; masked/known/unknown; accessible text cùng mask, không tooltip leak; không tự tính tổng |
| CMP-03 Freshness/evidence K | QuantityAsOf/quoteAsOf/fetchedAt/lastSuccess riêng, source/profile/version, drill target | Open source/evidence/detail; fresh/stale/missing/incompatible; chữ lý do. Evidence permission check khi mở, không raw notification cloud |
| CMP-04 Financial chart/table K | Caption/period/scope/unit/snapshot, series/known gaps, table alternative, drill controls | Toggle bảng/drill; loading/partial/empty/stale; keyboard action tương đương; không vẽ0 cho missing hoặc double actual/planned |
| CMP-05 Instrument picker M | Search mã, instrument/sàn/currency/unit/support; selected chip, quantity field riêng | Bounded search/select/clear, debounce/cancel stale results; ambiguous/unsupported/no results; keyboard listbox đúng hoặc native chọn, không auto-pick ticker mơ hồ |
| CMP-06 Gold profile M | Product/purity/source/side/quote unit, “Xác nhận profile”, quantity chỉ, compatibility hint | Select/confirm/edit; unconfirmed/compatible/incompatible/unpriced; đổi profile invalidate quote preview, không đoán cùng mã vàng |
| CMP-07 Price refresh/status M | Cập nhật giá, schedule mục tiêu, job ID, fetched/quoteAsOf/last-good per holding | Request/open job/retry hợp lệ; queued/running/partial/failed/rate_limited/coalesced. Disabled có retryAfter/lý do, không giả succeeded hoặc bypass quota |
| CMP-08 Device/coverage M | Permission/network/source/enrollment riêng, timestamp lastSeen/observed/ACK/gaps, receipt link | Setup/recheck/revoke/open Android; unknown remote permission label. Empty devices có APK/manual fallback; không “không giao dịch” vì không nhận notification |
| CMP-09 Native permission step M | Disclosure/version, allow/skip, OS handoff, checked status | Consent/open settings/recheck; denied/revoked/unknown; không bind consent với granted, focus khi trở lại app, TalkBack label đầy đủ |
| CMP-10 Queue/receipt M | Count/time/status/retryAfter, per-item outcome, owner scope, retention warning | Retry/re-auth/delete-quarantine-confirm/open Review; queued/sending/retry_wait/quarantined/ACK; no raw/OTP, no cross-owner upload |
| CMP-11 Review decision K | Case/evidence/type/status/eligible decisions + supplemental fields/reason | Preview/confirm/defer/open source; resolved/version conflict; form guards đúng case; AI suggestion không tự commit |
| CMP-12 Chat/context/history K | Context chip/captured versions, messages/evidence, composer, mode label, pagination | Send/cancel/retry/select/new/load more/expand panel; simple Q&A giữ trực tiếp, không mỗi nav tạo chat; masked/stale/error đủ |
| CMP-13 Agent run M | Intent, short safe progress, question/options/input, evidence, budget/stop state, draft refs | Answer/pause/cancel/resume/open draft; all run states theo SRS; cancel cần ACK, không expose hidden reasoning/raw tool secrets |
| CMP-14 Planning draft editor M | Targets/deadlines/reserve/priorities/assumptions, linked goals/items, simulation results, before/after | Edit chat/form/simulate/compare/preview; draft/stale/invalid/infeasible; concurrent edit có version, no financial active effect |
| CMP-15 Scenario comparison K | Engine scenarios same baseline, cash/reserve/funding/shortfall, assumptions/unknown | Select/rerun/edit draft; simulated label trên cards/chart; thiếu căn cứ không xếp hạng giả hoặc hứa lợi nhuận |
| CMP-16 Confirmation K | Summary/diff/effects/exclusions/warnings, expected versions/digest/expiry, confirm/cancel | Preview→confirm→persisted IDs; expired/conflict/uncertain/replayed; narration “đồng ý” không substitute owner confirm; admin dùng metadata-only variant |
| CMP-17 Mascot/panel K | Floating/inline avatar, show/collapse/pause/reset position, panel/full/history, current run state | Click/keyboard/drag alternative; idle/thinking/wave/celebrate, static fallback/reduced motion. Không che CTA; close giữ chat, fail/cancel/history không celebrate |
| CMP-18 Operational table/action M | Safe metadata rows/filters/status/version/action/reason/audit | Read/open/retry/disable-confirm; denied/stale/uncertain; không hidden private fields, icon-only accessible name, readonly quota/releases |
| CMP-19 Import wizard/job K | File/template/map, raw CSV owner-preview+normalized/errors/selected subset, bound token/digest, job status | Preview/select/confirm/poll/retry/cancel; template fail vẫn manualCSV nếu schema cho phép; empty draft giữ rỗng; quá limit đúng API production |
| CMP-20 Plan/Goal core K | Forecast, planned items, goal backing/allocations/progress/history, actual links | Create/edit/archive/link/allocate/release/achieve/simulate; same rules F10…15; Agent entry là bổ sung vào core, không thay manual flow |

Raw CSV là file người dùng chủ động cung cấp được preview trong boundary có quyền, khác raw notification collector phải lọc local; không gom cả hai vào một permission.

## 4. Responsive và kiểm tra

Mobile fields stack, long Vietnamese wrap, tables scroll nội bộ hoặc card semantic; drawer fullwidth khi cần, không overlap bottom nav/keyboard. Android native components giữ same hierarchy và adapted dp/sp. Mascot động/tĩnh kế thừa theo [implementation note](../frontend/mascot-interactions.md), không khóa video timings như yêu cầu UX bất biến.

[Traceability](ui-requirement-traceability.md) liên kết component/screens/checks. Gallery /design hiện chỉ evidence mock; bổ sung demo states cho components mới là nhiệm vụ build sau tài liệu. Chưa tuyên bố render, native accessibility, rights hoặc backend contract tests đạt.