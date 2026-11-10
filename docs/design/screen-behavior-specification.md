> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](../product/screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

# Đặc tả hành vi màn hình và form

DES-BHV-001 · v1.0 · 08/10/2026 · target scope-v3 · đặc tả conformance đầy đủ. Prototype triển khai/kiểm một phần; [catalogue](interface-catalogue.md) và [UI RTM](ui-requirement-traceability.md) ghi từng màn/nhóm check, không coi toàn bộ đặc tả đã nghiệm thu.
Nguồn: [catalogue](interface-catalogue.md), [SRS](../requirements/srs.md), [AI spec](../product/ai-agent-specification.md), [API đích](../contracts/operational-api-spec.md). [Bản trước](../governance/baselines/ui-before-v3-2026-10-08/screen-behavior-specification.md) giữ chi tiết mock1.1 và lịch sử Step4…6. Tài liệu này không sửa code hoặc sinh schema v2.

## 1. Quy tắc dùng chung

**Read:** initial → loading → loaded/empty/partial/stale/error/denied. Refetch giữ last-good đúng owner cùng nhãn updating; lỗi không thay bằng0 hoặc mất quoteAsOf. Partial phải chỉ ra phần thiếu. 401 khóa nghiệp vụ và reauth; 403 bỏ dữ liệu không được phép, không giữ cache cũ để lộ số; 404 thông báo không còn đối tượng và đường quay lại.

**Financial form:** editing → validating → previewing → preview_ready → confirming → succeeded; có invalid/error/conflict/uncertain. Preview gắn payload digest, object/snapshot versions và expiry. Sửa field làm preview hết hiệu lực. Confirm có latch và cùng idempotency key; timeout sau submit là uncertain, truy kết quả/replay cùng key trước khi cho tạo request mới. 409/PREVIEW_EXPIRED/STALE_PROPOSAL giữ draft, refetch và preview lại; 422 focus lỗi; 429 theo retryAfter; 503 bounded retry. Cancel trước confirm không effects; sau khi confirm đã gửi không gọi “Hủy” như thể rollback. Có thể rời màn với thông báo operation vẫn xử lý và tra kết quả sau; không tạo modal khóa vô hạn khi mất mạng.

**Snapshot:** acknowledgement không là full financial snapshot. Refetch/invalidate theo ảnh hưởng nghiệp vụ; chỉ nhận workspaceVersion mới hơn hoặc bằng hợp lệ; chart/table/metric trong một report đồng nhất. Không tự cộng tiền theo response tạm, không optimistic financial writes.

**Owner/session:** mọi object/action kiểm phía authority, không tin workspaceId hidden hoặc nút disabled. Logout/session revoke xóa cache/chat/UI drafts theo chính sách; outbox Android theo owner riêng ở native spec. Không prompt/raw/secrets trong URL/log/error/telemetry. Mask áp dụng mọi financial content và accessible text. Các query/operation dưới đây là semantics, không tuyên bố đã wire real API.

## 2. User màn chính

| Màn | Nội dung, input và actions | Kết quả / trạng thái đặc thù |
| --- | --- | --- |
| UI-U-01 Tổng quan | Period preset/custom, scope; cash/assets/thu/gross/refund/net; charts + bảng; Ghi giao dịch, drill formula/account/holding, hỏi AI | Cùng report snapshot; no accounts → setup; thiếu giá → subtotal + unknown; thiếu baseline → không trend; sync gap tách khỏi quote stale |
| UI-U-02 Báo cáo | Chọn kỳ/scope, flow/spend/allocation, bảng thay chart, drill với filters | Empty kỳ khác thiếu lịch sử; không nội suy market history; transfer qua scope là flow, không expense |
| UI-U-03 Assets | List bank/wallet/cash và stock/gold; thêm F01/F02; quantity/cost/quote/count; Cập nhật giá | Refresh trả job UI-S-10, không thay quantity/cash; unknown source/FX/profile hoặc partial rõ; archive giữ history |
| UI-U-04 Tx tất cả | Filters account/type/category/posting/reconciliation/plan/search, Apply/Clear/sort; row/detail/add/correct/category/post/link | Filter draft không ghi ledger; ba trục posting/reconcile/category độc lập; source notification có device/receipt/parser metadata owner được phép |
| UI-U-05 Thu–chi | Preset income/expense/refund, cùng actions eligible của Tx | Gross/refund/net riêng, opening/transfer/investment/valuation không expense hoặc income |
| UI-U-06 Chuyển tiền | Transfer form hai accounts/fee, list/detail; incomplete → Review | Cùng account invalid; hai legs + fee atomic; missing leg không tự ghép dựa amount duy nhất |
| UI-U-07 Hoàn tiền | Eligible origin, amount/date/account, origin detail; thiếu origin vào Review | Remaining refund guard, kỳ nhận tiền không bị dời về kỳ gốc; refund không tăng income |
| UI-U-08 Plan | Forecast/actual/remaining, assumptions, create thủ công hoặc “Cùng trợ lý lập kế hoạch”; “Phân tích và điều chỉnh” | Plan-first UX-FL-14; kết quả AI là draft; actual vs plan có version, uncertainty và shortfall; giữ lịch sử |
| UI-U-09 Khoản dự kiến | F10, recurrence, edit/archive, link/unlink actual F11 | Future schedule/horizon và ngày cuối tháng đúng; không tự ghi actual; archive không xóa lịch sử |
| UI-U-10 Đầu tư dự kiến | F10 kind investment + holding, amount/date/account; compare/link actual | Không auto-trade hoặc gán lợi suất; ảnh hưởng dự kiến cash/holding tách valuation |
| UI-U-11 Goals | F12…14; target/deadline/progress/backing/shortfall/history; tạo manual hoặc Goal-first Agent | Allocation từ cash hiện có; contribution chỉ planned; achieved cần đủ funded; new draft chưa progress thực |
| UI-U-12 Mô phỏng | F15 save/consume/invest; run/compare/rerun; assumptions và frozen snapshot | Engine trả kết quả; không actual write; infeasible nêu bước thiếu cash; missing price không thành0; cũ có stale label |
| UI-U-13 Dữ liệu | Sources/capability/coverage, Android setup, CSV, jobs, Review; chọn nguồn → UI-U-19 | Connection/permission/freshness riêng; browser không đọc notification app khác; fake fault/reset chỉ demo |
| UI-U-14 Review | Filter status/type/source; UI-S-04 evidence; supplement/match/defer; AI điều tra | Agent chỉ đề xuất; owner vẫn preview/confirm; unresolved không fake success; raw notification không tải cloud |
| UI-U-15 Trợ lý | Full chat/context/mode/send/cancel/retry/evidence/drill/draft/run; tạo/chọn conversation | Một conversation authority với panel/Plan/Goals; Q&A trực tiếp và Agent đa bước khác status, không mất capability cũ |
| UI-U-16 History | Page/load more/chọn conversation/message, xem captured context, mở panel/full/tiếp tục draft | Lỗi có tải lại; không truncate thành lịch sử đầy đủ; old result không tự thành current; mask free text |
| UI-U-17 Settings | Profile/session/privacy, workspace/tracking, devices/APK/help/logout; demo tools gated | Settings hiện dialog, không giả route mới đã có; logout stop collector/cache policy; real mode không Reset finance |
| UI-U-18 Devices & sync | Own devices/platform/version/lastSeen/lastAck/permissions/coverage; chi tiết/revoke/install guide/refresh | Revoke reason + confirm, chặn upload mới; lịch sử đã sync giữ nguyên. Browser không biết quyền OS hiện tại nếu device chưa báo; hiện “Chưa xác nhận” + timestamp |
| UI-U-19 Source detail | Package/profile/parser support, account binding, lastObserved/lastAttempt/lastSuccess; reconnect/refresh/remap khi eligible | Android mapping thực hiện trên đúng device; web giải thích cần mở app. Price-source chỉ refresh pipeline, không nhận tùy ý provider URL; disconnect không xóa history |

## 3. Forms kế thừa và sửa input

Dấu * = required theo nghiệp vụ. Schema runtime1.1 vẫn lịch sử; chi tiết transport/giới hạn production phải chốt vào schema v2 trước build. Currency VND mặc định; money/quantity decimal strings, date hợp lệ theo workspace/timezone và authorized clock, không dùng clock fixture production. Reasons bắt buộc cho correction/decision/archive; tên hiển thị giới hạn theo schema, không sao chép giới hạn mock làm policy mới.

| ID | Fields / validation / thay đổi | Hậu quả và giới hạn |
| --- | --- | --- |
| F00 Tracking | trackingStart*, reason*; không tương lai/không loại posted history | Recompute coverage/snapshot, không xóa history |
| F01 Account | name*, kind* bank/wallet/cash, opening*≥0 hoặc trạng thái chưa biết được contract hỗ trợ, openingDate*; archive id/reason | Opening không income; không cho “chưa biết” lén gửi0; unsupported unknown opening thì giữ setup incomplete |
| F02 Holding | Stock: search ticker* → xác nhận instrument/sàn/currency/unit, quantity*≥0. Gold: chọn/xác nhận product/purity/source/side profile* một lần → quantity chỉ*≥0. Acquisition/cost optional | Metadata resolve, không buộc gõ thủ công; ticker ambiguous phải chọn, unsupported không fake pricing. Thiếu cost → P/L unknown; không cash event |
| F03 Event | kind*, amount*>0,date*,active account*,description*,category theo loại, posting*; transfer to≠from/fee≥0/one-leg; refund origin optional; investment holding/quantity* | Posted balanced/atomic; pending/draft không balance; thiếu evidence → Review, không tự đoán account |
| F04 Category | eventId*, category*, reason* | Không thay type/money; manual override giữ qua source revision |
| F05 Correction/post | id*, newamount*>0/description/reason*, expectedVersion; draft sửa trước post, posted đảo/thay thế | Immutable old entries; link/refund/holding consistency; uncertain replay không post lần2 |
| F06 Quantity | holding*,quantity*≥0,unit theo instrument/profile,date*,reason* | Declaration không cash; không double-count investment movement |
| F07 Cost | holding*,cost nullable≥0,date*,reason* | P/L coverage, không ledger; thiếu cost không0 |
| F08 Quote | “Cập nhật giá” request holdingIds/all + reason=manual. Quote nhập tay chỉ nếu nghiệp vụ/manual-price policy được authority cho phép và gắn nhãn user-declared | Market pipeline kiểm instrument/profile/side/unit/FX/asOf; không lấy client quote làm market fact. Legacy manual quote giữ provenance và không ghi đè giả provider |
| F09 Cash count | active cash account*,observed*≥0,asOf/reason* | Observation/variance → Review; chưa tự expense/adjustment |
| F10 Plan item | name*,kind*,amount*>0,account*,start/end*,recurrence*,day1–31 khi monthly,category/holding khi cần; edit/archive reason/version | Start future, horizon theo contract (baseline24 tháng), clamp day cuối tháng; kế hoạch không ledger |
| F11 Actual link | eventId/version*,planItemId/version*,occurrenceId*,reason*; unlink linkId/reason | Posted eligible, account/type/currency/date phù hợp; no duplicate link hoặc actual write |
| F12 Goal | name*,target*>0,due*,reserve/priority nếu Agent cần; contribution optional amount/account/start/day | Planned contribution không funded; currency đồng nhất; invalid due giữ draft |
| F13 Allocate | goal*,account*,amount*>0,reason* | Aggregate free cash guard, unknown balance deny; earmark không transfer |
| F14 Goal lifecycle | goal*,action* release/achieved/archive, allocationId tùy action,reason* | Achieved funded≥target; archive/release không đổi cash ledger |
| F15 Simulation | goal*,mode*,amount*>0,count positive integer,account*,firstDate*,interval*,horizon* | Steps tăng dần trong horizon; constraints/bounds theo schema; baseline count≤24/interval1–366 là giới hạn engine cần giữ hoặc version rõ; không actual writes |
| F16 CSV | file*,target account*,date/amount/description mapping*,formats*,selected validrowIds* | Template/preview/selected subset bound digest/token. 64KiB/20rows chỉ mock fixture; production công bố limit từ API, lỗi quá cỡ rõ. Cancel preview không job/post |
| F17 Review | case/version*,action*,reason*,origin/category/supplement fields theo loại | Resolution immutable/audited; server kiểm điều kiện; không gửi raw cloud để xử lý nhầm |
| F18 Chat/Agent | conversation*,text/context* hoặc questionId/answer/runVersion*,constraints theo intent | Prompt length theo active schema (mock500); gửi capture snapshot, không đổi response khi điều hướng. Role/workspace/tool permission không lấy từ prompt |
| F19 Planning draft | draft/version/digest*,Goal/Plan items/links/constraints/assumptions; sửa form hoặc chat | Sửa làm simulation/preview cũ invalid; preview/confirm atomic bundle theo API, không active trước owner confirm |
| F20 Device/source | device*,consentVersion*,supported package*,binding account*,parser profile*,expectedVersion; revoke reason | Same owner/workspace; ambiguous không bind bừa; stop capture/upload khi revoke, không xóa ledger |

F02 thay form phải điền nhiều metadata bằng catalog/profile + input đơn giản; F08 chuyển ưu tiên sang refresh giá thật. Các field chi tiết vẫn xem tại UI-S-02, không xóa quantity/cost/evidence cũ.

## 4. Review decision matrix — UI-S-04

| Case | Action được phép / guards |
| --- | --- |
| Cash variance | Adjust unknown / forgotten expense (chỉ thiếu tiền, category*) / defer; preview signed effect, không overwrite count |
| Transfer | Confirm match có đủ refs/legs/currency/accounts/time/uniqueness / defer; không auto-expense |
| Duplicate | Merge evidence nếu đủ căn cứ/version / defer; hai event cùng amount không đủ để gộp |
| Refund | Link eligible origin trong remaining/date/account constraints / defer |
| Category | Categorize/manual override / defer; không đổi money |
| Pending | Post khi đủ căn cứ / reject / defer; posting đúng một lần; rejected không giả posted |
| Quality | Sửa quantity/price/FX/source ở màn tương ứng rồi acknowledge khi issue hết / defer |
| Invalid hoặc notification thiếu | Bổ sung normalized fields account/amount/direction/date nếu service cho phép / dismiss / defer; giữ provenance và dedupe lại |
| Account mapping/gap/redacted | Chọn đúng account khi đủ evidence hoặc nhập tay/CSV/defer; gap không được “resolve” bằng số/giao dịch do AI bịa |

AI gợi ý hành động dẫn sang màn quyết định, không tự thực hiện resolution. Case resolved retry trả cùng kết quả; case/version thay đổi cần preview mới.

## 5. Draft và Agent — UI-S-05/06/07/08

Kế thừa full chat/panel/history/evidence/mascot; nguồn yêu cầu duy nhất là AI-SPEC-001.
1. Entry “Cùng trợ lý lập kế hoạch” từ Plan hoặc Goals chụp context+versions vào cùng conversation; “Hỏi về màn này” vẫn Q&A, không tạo Goal vô cớ.
2. Run hiển thị queued/planning/reading/awaiting_user/simulating/draft_ready/completed/partial/failed/cancelled bằng chữ Việt. Câu hỏi chứa lý do cần target/deadline/reserve/priorities, input và trả lời/để sau; không expose chain-of-thought, chỉ tiến trình/tóm tắt hành động/căn cứ được phép.
3. Draft card: goal targets, plan items và links, reserve, assumptions, unknown/shortfall; “Chỉnh bằng hội thoại”, “Chỉnh bản nháp”, “So phương án”, “Xem thay đổi”. So sánh dùng Engine cùng baseline, không LLM tính tiền.
4. Preview: before/after active plan, proposed goals/items/links/eligible allocations, versions/asOf/digest/expiry/warnings; nhắc rõ chưa actual money. User owner mới có “Xác nhận áp dụng”; narration “đồng ý” trong chat không thay confirm service.
5. Succeeded dùng persisted IDs/version; refresh Plan/Goals, giữ draft/run refs/history. Cancel trước confirm giữ hoặc bỏ draft theo lựa chọn, active không đổi; không đánh dấu completed run là “đã áp dụng”.
6. Snapshot mới/stale, draft edit, concurrent confirm hoặc expired → disable apply, nêu gì đổi, recompute+preview lại. Không tự nâng baseline rồi dùng token cũ. Không đủ cash không dùng future income để allocate.
7. Actual replan/investigation: hiển thị evidence chắc/thiếu và ràng buộc giữ nguyên; amendment draft có lý do, giữ active version cũ đến owner confirm. Evidence link về object được phép, không user data trong admin.
8. Cancel run cần ACK; pending cancel/error có “Thử dừng lại”, không giả đã dừng. Partial/budget/quota nêu đã làm/chưa làm và choices tiếp tục khi hợp lệ hoặc bàn giao thủ công; không provider paid fallback. Mặc định8 tool calls/60s active/2 clarification theo spec; thời gian chờ user không tính active.
9. Đóng panel không xóa hội thoại hoặc cancel run; reopen cùng pending/draft. Privacy mask che cả prompt/answer/evidence/alternatives/free text, không chỉ amount structured. History pagination và UI latest reply tiếp tục được giữ.

## 6. Job/receipt và lỗi đồng bộ — UI-S-10

Price job: queued/running/succeeded/partial/failed/rate_limited; hiển thị requested/fetched/lastSuccess/quoteAsOf riêng. Daily mặc định18:00 +07 theo NFR-18; label lịch chạy mục tiêu, không SLA. Nếu manual/daily coalesced, mở cùng job; pending không hiển thị giá giả mới. Partial chỉ holding hợp lệ được cập nhật, còn lại giữ last-good/unknown.

Ingest receipt: received/parsed/posted/needs_review/ignored/failed; mỗi receipt có opaque ID, source/time/parser và linked objects owner được phép. ACK durable cho phép outbox xóa payload, không kết luận ghi sổ. Refresh foreground lấy currentVersion; response cũ không đè mới. Retry network cùng eventId/key, manual refresh không tạo notification mới.

[Android](android-ui-specification.md), [admin](admin-ui-specification.md) và [auth](authentication-specification.md) bổ sung native/role-specific behavior. [Traceability](ui-requirement-traceability.md) là checklist thiết kế/acceptance; tất cả trường hợp mới chưa chạy.