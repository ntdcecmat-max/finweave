# FinWeave — Use Cases

ID REQ-UC-001 · v2.0 · analysis-v2/scope-v2 · 05/10/2026 · in-review. Agent owner/self-review; PO pending external review. Nguồn [SRS](../requirements/srs.md), [Rules](business-rules.md), [Data](../data/data-requirements.md), [Scenarios](operational-scenarios.md). Mọi luồng M1 là mô phỏng synthetic, chưa chạy prototype. M2 yêu cầu request/API/mock; M3 quyền/transaction/ledger thật; hậu điều kiện hiện là đặc tả, không evidence persistence.

## Convention và nhánh dùng chung

Actor C = chủ workspace demo; actor N = nguồn fixture mô phỏng. Mỗi UC dưới áp dụng CF khi có read/mutation; các tham chiếu CF là phần của alternative/error flows của UC, không bỏ quanhánh riêng.

- CF-01 validation: báo field lỗi bằng chữ, giữ input, không commit. Cancel trước xác nhận đóng/quay focus và không mutation; preview chưa commit. Nếu operation đã confirm đang chạy, không gọi Cancel là rollback; kiểm tra kết quả, cần chỉnh thì qua UC-TXN-02.
- CF-02 processing/read error/offline/timeout: giữ filters/input, hiển thị state/retry; không thay lỗi bằng0/empty hoặc success. Timeout sau confirm chưa rõ kết quả: kiểm tra/retry cùng operation key, không confirm mới với key khác; rejected payload đổi dùng key mới sau re-preview.
- CF-03 denied/revoked: dừng read/mutation mới, báo cần reconnect/phiên, không giả bypass; M1 chỉ scenario. Mất quyền nguồn khác quyền workspace, dữ liệu cũ giữ nhãn nguồn đã ngắt; quyền workspace revoked không tiếp tục đọc cache nhạy cảm ở M3.
- CF-04 version conflict/double submit: không ghi đè response mới, giữ input/diff, reload/re-preview trước quyết định lại; confirmation resolved hoặc cùng payload/key trả kết quả cũ. Snapshot/source changes báo căn cứ đã đổi, không âm thầm apply preview cũ.

## UC-SET-01 — Thiết lập mốc theo dõi

Actor: C. Mục tiêu: biết kỳ/VND/phạm vi demo. Trigger: mở demo mới hoặc chọn sửa mốc. Precondition: dataset synthetic chọn rõ, C ở workspace demo; nếu đổi mốc sau có event phải preview tác động.

Luồng chính: (1) C mở thiết lập; hệ thống hiện demo, currency VND/timezone +07 và kỳ OD-02. (2) C chọn mốc01/10/2026, hệ thống kiểm tra ngày và giải thích opening khác income. (3) C xác nhận, hệ thống lưu settings version và dẫn tới tài khoản/holdings. (4) C mở Tổng quan; hệ thống dùng cùng mốc/scope. Lần vào sau mở Tổng quan trực tiếp.

Alternative/error flows: date invalid/future so clock → CF-01; đổi mốc có dữ liệu → preview, cancel giữ mốc cũ, không tạo opening lần2; chưa có account → empty có action thiết lập; missing balance không tổng0; CF-02/03/04 cho load/save. Review open không chặn Tổng quan.

Business rules: BR-01/03/04/19/24. Dữ liệu liên quan: DR-01/02/14/15. Postcondition: settings version nhất quán, không money event mới chỉ vì mở lại. Truy vết: REQ-SET-01, AC-01, SCN-SET-01.

## UC-BANK-01 — Tạo ngân hàng và ví

Actor: C. Mục tiêu: theo dõi riêng bank/wallet. Trigger: chọn Thêm tài khoản tiền. Precondition: UC-SET-01 có mốc; không currency ngoài VND; workspace đúng.

Luồng chính: (1) C chọn bank, nhập tên/opening20m/date; hệ thống hiện source self-declaration/demo statement. (2) Hệ thống validate và preview opening, không income. (3) C confirm; account+opening effect lưu cùng operation, thẻ có ngày/nguồn/version. (4) C lặp với wallet opening0; hệ thống hiển thị số0 đã khai báo, Tổng quan opening bank+wallet20m.

Alternative/error flows: thiếu tên/date hoặc amount âm/ambiguous → CF-01; bỏ opening → lựa chọn “chưa có dữ liệu”, openingAmount=null, chưa báo tổng đầy đủ; same name không tự gộp account, nhắc kiểm tra; cancel không account; CF-02/03/04 cho confirm, double confirm không account/opening mới. Archive/toggle qua UC-DRILL-01, không xóa history.

Business rules: BR-01/02/04/09/20. Dữ liệu liên quan: DR-02/07/08/14/15. Postcondition: bank và wallet có IDs riêng, opening đúng một lần; tổng không tăng bởi retry. Truy vết: REQ-BANK-01, AC-02, SCN-BANK-01.

## UC-CASH-01 — Tạo ví tiền mặt

Actor: C. Mục tiêu: bắt đầu theo dõi cash tự khai báo. Trigger: Thêm ví tiền mặt. Precondition: mốc/workspace demo đã có.

Luồng chính: (1) C nhập tên/opening2m/date. (2) Hệ thống validate, preview cash self-declared và giải thích số tính khác kiểm đếm. (3) C confirm; hệ thống tạo cash/opening và nhãn tự khai báo. (4) C xem thẻ: calculated2m, counted “chưa kiểm đếm”.

Alternative/error flows: thiếu opening → giữ unknown, bổ sung 2m sau re-preview; cash count 0 không thay opening vì là observation khác; amount âm/thiếu tên/date CF-01; cancel không đổi tổng; CF-02/03/04 khi save/read, retry không opening 2 lần. Kiểm đếm qua UC-CASH-02, không tự điều chỉnh ở UC này.

Business rules: BR-01/02/04/14. Dữ liệu liên quan: DR-02/07/08/12/15. Postcondition: cash2m khi khai báo hợp lệ; count vẫn unknown, không chứng minh tiền thực. Truy vết: REQ-CASH-01, AC-03, SCN-CASH-01.

## UC-STOCK-01 — Khai báo cổ phiếu

Actor: C; N cung cấp quote demo. Mục tiêu: biết lượng khai báo và định giá riêng. Trigger: Thêm cổ phiếu. Precondition: workspace/mốc có; fixture DEMO-A/marketDEMO và quote fake phù hợp.

Luồng chính: (1) C nhập ticker+market, quantity100 share/date, bỏ cost basis. (2) Hệ thống validate, hiện quote50k VND/share/time riêng. (3) C confirm; hệ thống tạo identity/holding/declaration movement. (4) Detail hiện5m, quantityAsOf và quotedAt riêng; gain/loss chưa xác định.

Alternative/error flows: market missing/quantity âm CF-01; cùng ticker khác market là asset khác, quote phải đúng market; quote missing/stale → valuation unknown hoặc số cũ có nhãn, không 0; cost missing không tạo cost 0/gain 5m; không có source connection vẫn cho declaration, không pretend fetch; CF-02/03/04 save/read/cancel.

Business rules: BR-02/15/18/19/22. Dữ liệu liên quan: DR-03/04/05/11/14. Postcondition: holding tự khai báo100, valuation5m nếu quote đủ; không money/income event. Truy vết: REQ-STOCK-01, AC-04, SCN-STOCK-01.

## UC-GOLD-01 — Khai báo vàng và đổi đơn vị

Actor: C; N quote/FX demo. Mục tiêu: định giá đúng loại/đơn vị. Trigger: Thêm vàng hoặc đổi display unit. Precondition: workspace/mốc; quote OD-04 cho nhẫn demo9999; không gold provider thật.

Luồng chính: (1) C chọn nhẫn demo9999,5 chỉ/date, optional cost. (2) Hệ thống validate product/purity/unit và preview quote8m VND/chỉ/source/time. (3) C confirm; hệ thống tạo holding40m. (4) C chuyển display sang lượng; hệ thống hiện0,5 lượng, vẫn40m và nguồn giá riêng.

Alternative/error flows: quote USD/lượng3200 + FX25000 → preview40m với nhãn quốc tế; FX absent → chưa định giá; khác product/purity hoặc unit không mapping → không apply quote, Review; quantity âm/loại thiếu CF-01; không nhân purity lần nữa khi quote đã phù hợp; stale quote giữ thời điểm; CF-02/03/04 save/refresh/cancel.

Business rules: BR-02/15/16/18/19. Dữ liệu liên quan: DR-03/04/05/10/11/14. Postcondition: unit display đổi không quantity economics/value; declaration không money event. Truy vết: REQ-GOLD-01, AC-05, SCN-GOLD-01/X09.

## UC-IMPORT-01 — Import sao kê CSV demo

Actor: C; N file CSV fixture. Mục tiêu: xem trước và ghi phần được chọn một lần. Trigger: Nhập sao kê. Precondition: bank active, profile OD-03, file≤20rows synthetic, operation key và account/mapping rõ.

Luồng chính: (1) C chọn file/account, map date/reference/debit/credit/description/currency; hệ thống giữ raw/parser/mapping. (2) Hệ thống validate, preview gốc/chuẩn hóa/row states và impact. (3) C chọn valid rows, xem số selected và excluded; ambiguous/missing/duplicate candidates chưa post. (4) C confirm; hệ thống mô phỏng atomic selected set, nối evidence/event, publish cases cho excluded actionable rows. (5) Hệ thống hiện job/result IDs/history, refresh Tổng quan và Review.

Alternative/error flows: thiếu account/date/amount/currency,2cột dương, ambiguous separators → blocked với field error; missing reference cho phép valid nhưng dedupe không guess; missing category vẫn valid uncategorized; duplicate candidate vào Review, exact confirmed source evidence không event2; >20rows/unsupported file chặn trước preview; cancel trước confirm giữ tiền/case count cũ; CF-02 fail commit không partial, timeout sau confirm retry cùng key; CF-03 source revoked không confirm; CF-04 mapping/file/version đổi cần validate preview/key mới, payload khác cùng key conflict.

Business rules: BR-01/02/03/09/10/11/12/21. Dữ liệu liên quan: DR-06…10/13/14/15. Postcondition: selected valid rows applied once hoặc không gì; excluded không money effects mới, case/history rõ; demo không parser thật. Truy vết: REQ-INPUT-01, AC-06, SCN-IMPORT-01/X10/X11.

## UC-SOURCE-01 — Nguồn dữ liệu và cập nhật demo

Actor: C; N notification/stock/gold/FX. Mục tiêu: biết capability/freshness/action. Trigger: mở Nguồn hoặc bấm Cập nhật/Kết nối/Ngắt. Precondition: một nguồn fixture, dummy credentials, không key thật.

Luồng chính: (1) Hệ thống hiện loại dữ liệu nguồn, status/lastSuccess/lastAttempt. (2) C chọn connect dummy rồi refresh; hệ thống connecting/processing chưa success. (3) N trả notification record hoặc quote; hệ thống validate/match/provenance hoặc compatibility. (4) Hệ thống cập nhật event/evidence qua luồng phù hợp hoặc chỉ quote valuation, lastSuccess/time và snapshot liên quan. (5) C disconnect; source disconnected dừng future refresh, giữ lịch sử.

Alternative/error flows: source error/timeout/offline CF-02, quote cũ giữ timestamp; permission_revoked CF-03 yêu cầu reconnect dummy; stale connection có nhãn dù connected; notification thiếu/trùng tạo Review, không holdings quantity; quote sai unit/purity/market vào quality case; cancel connect không source active; CF-04 response cũ/version mới không ghi đè, retry cùng record không thêm event.

Business rules: BR-09/10/18/19/22. Dữ liệu liên quan: DR-06/07/09/10/11/13/14/15. Postcondition: chỉ capability được phép cập nhật, dữ liệu cũ không biến0, disconnected không delete history. Truy vết: REQ-INPUT-02, AC-07, SCN-SOURCE-01.

## UC-MONEY-01 — Ghi thu/chi, chuyển, phí và refund

Actor: C. Mục tiêu: tiền và thu–chi đúng loại. Trigger: chọn ghi sự kiện tiền. Precondition: account active cùng workspace/VND; đủ căn cứ theo loại, event date không vượt demo clock; không cần tất cả tài khoản có balance known để ghi movement.

Luồng chính: (1) C chọn type/account(s), amount/date, category nếu thu/chi; transfer chọn from/to khác nhau; refund chọn purchase gốc. (2) Hệ thống validate và preview signed effects: income tăng tiền/income; expense giảm tiền/gross; transfer hai legs không income/gross; fee riêng; refund tăng tiền/refund kỳ nhận. (3) C confirm; hệ thống ghi group mô phỏng nhất quán cùng operation và evidence. (4) Detail hiển thị type, trạng thái riêng, lịch sử; snapshot refresh. Sequence DEMO-01…08 ở SCN-OVERVIEW-01.

Alternative/error flows: amount≤0/missing date/account/type/same transfer endpoints → CF-01; chưa category vẫn expense hợp lệ; refund không original/evidence → unresolved_receipt + Review nếu đủ money fields, không gán income; multiple/over-refund → BR-07/08 case, pending giữ chưa post; transfer chỉ một phía đủ → clearing + Review, không fake destination; fee khác currency chặn; insufficient known balance báo cần kiểm tra, không auto lending (scope không nợ); pending chọn scenario không ảnh hưởng posted totals; cancel CF-01; CF-02/03/04 cho save/retry/conflict.

Business rules: BR-01…09/12/13/19. Dữ liệu liên quan: DR-02/07/08/09/10/14/15. Postcondition: đúng một event/group type phù hợp hoặc pending/Review với giới hạn rõ; không đếm transfer là income/expense. Truy vết: REQ-MONEY-01, AC-08, SCN-MONEY-01/X03…06/X11.

## UC-CASH-02 — Kiểm đếm và giải quyết lệch

Actor: C. Mục tiêu: so tiền đếm với tiền tính mà không gán nguyên nhân giả. Trigger: Kiểm đếm tiền mặt. Precondition: cash active, same asOf/currency/book basis và calculated snapshot có version; missing opening cần bổ sung trước so absolute balance.

Luồng chính: (1) C nhập counted2,8m/asOf tương ứng balance2,85m; hệ thống lưu observation self-declared. (2) Hệ thống hiện variance−50k, chưa post; C chọn kiểm tra căn cứ. (3) Nếu chưa rõ, C chọn adjustment_unknown, nhập reason; hệ thống preview cash2,8m, gross/net giữ nguyên, flow−50k. (4) C confirm; hệ thống linked adjustment/history, refresh snapshot; case resolved user_confirmed.

Alternative/error flows: tìm khoản chi quên50k có căn cứ → mở UC-MONEY-01 expense, không thêm adjustment; counted0 hợp lệ; different time/type/currency hoặc unknown opening → không so, yêu cầu mốc/fields đúng; không reason CF-01; hủy resolution giữ money2,85m (observation đã lưu ở bước 1 có thể giữ), defer giữ case open; CF-02/03/04 save/count/resolve, balance thay đổi phải re-preview.

Business rules: BR-02/04/14/21. Dữ liệu liên quan: DR-02/07/08/09/10/12/14/15. Postcondition: quan sát riêng; tiền chỉ đổi sau xác nhận event/adjustment, không automatic expense. Truy vết: REQ-CASH-02, AC-09, SCN-CASH-02/X07.

## UC-HOLD-01 — Cập nhật lượng, giá và mua đủ căn cứ

Actor: C; N quote demo. Mục tiêu: hiểu nguồn thay đổi valuation. Trigger: chỉnh quantity/refresh quote/ghi ví dụ purchase. Precondition: holding/identity có version, quote đúng unit; purchase có money account và evidence.

Luồng chính: (1) C chọn cập nhật giá, hệ thống lấy fixture DEMO-A55k và gold8,2m/chỉ. (2) Hệ thống validate/time, preview valuation increase1,5m, tiền/thu–chi không đổi; C confirm. (3) Trong scenario khác sau reset, C sửa stock100→110, date/reason; hệ thống preview5→5,5m và lưu movement khai báo. (4) Trong purchase scenario riêng, C nhập mua10share×50k từ bank, evidence/date; hệ thống preview bank−500k/stock+500k linked, không chi sinh hoạt; C confirm.

Alternative/error flows: thiếu date/reason/âm CF-01; quote stale/missing/incompatible/FXmissing giữ cũ có nhãn hoặc unknown, UC-REVIEW-02; quantity changed bằng quote không được phép; purchase thiếu money/evidence chỉ correction/declaration có nhãn, không tạo fake linked event; CF-02/03/04, cancel không quantity/quote/money mới; failed purchase không nửa cash/holding.

Business rules: BR-02/13/15/16/17/18/19. Dữ liệu liên quan: DR-04/05/07/08/09/11/14/15. Postcondition: mỗi update history riêng, quantity/price dates độc lập; linked purchase không double-count assets. Truy vết: REQ-HOLD-01, AC-10, SCN-HOLD-01/X08/X09.

## UC-TXN-01 — Tìm và xem căn cứ giao dịch

Actor: C. Mục tiêu: tìm transaction theo phạm vi và trạng thái đúng nghĩa. Trigger: mở Giao dịch hoặc drill-down. Precondition: workspace demo, current period/scope/filter context; có thể dataset empty.

Luồng chính: (1) C chọn kỳ/account/type/category/posting/reconciliation; hệ thống query một snapshot/version. (2) Hệ thống hiện results và pending riêng với label. (3) C mở DEMO-06; hệ thống detail money/date/account/event type/evidence/parser/history/các trục status. (4) C Back; hệ thống phục hồi filters/period/scroll ngữ cảnh phù hợp.

Alternative/error flows: no results → empty có clear filter, không service error; source evidence missing → nhãn thiếu, không fabricate reference; archived account có explicit history view; CF-02 read error/timeout giữ context, retry; CF-03 denied không detail; CF-04 response cũ không overwrite filter mới, dữ liệu thay đổi nêu version; close detail không mutation. Pending70k không trộn posted totals.

Business rules: BR-03/05/12/19/20. Dữ liệu liên quan: DR-06/07/08/09/14/15. Postcondition: read-only, mọi item đúng filter và căn cứ có link; không đổi money. Truy vết: REQ-TXN-01, AC-11, SCN-TXN-01/X02.

## UC-TXN-02 — Sửa draft/category hoặc posted event

Actor: C. Mục tiêu: sửa sai có dấu vết. Trigger: Sửa/Đổi nhóm/Điều chỉnh trong detail. Precondition: object same workspace active, version và original loaded; reason required nếu posted adjustment.

Luồng chính: (1) C chọn nhánh draft/category/posted; hệ thống hiển thị fields và limitations. (2) C sửa draft amount hoặc category DEMO-08→Khác; hệ thống preview không đổi total tiền/gross với category-only. (3) Với posted cash150k→120k, C nhập reason; hệ thống preview original−150k/reversal+150k/replacement−120k, cash+30k. (4) C confirm; hệ thống apply versioned action, history/override và linked entries, snapshot refresh. (5) Reimport scenario giữ manual override.

Alternative/error flows: draft missing/amount≤0 CF-01, draft save không post; thiếu reason chặn; loại sự kiện không đổi qua category, muốn sửa type cần preview adjustment phù hợp; original reversed rồi không đảo lần2, mở replacement; CF-02 timeout check/retry giữ key; CF-03 denied; CF-04 stale version showdiff/reload/re-preview, không lost update. Cancel trước confirm giữ money/category cũ.

Business rules: BR-05/09/12/13/19. Dữ liệu liên quan: DR-06/07/08/09/10/14/15. Postcondition: draft không totals; category override giữ qua revision; posted correction có original+trace, chỉ delta30k một lần. Truy vết: REQ-TXN-02, AC-12, SCN-TXN-02/X01/X10/X11.

## UC-OVERVIEW-01 — Xem tình hình tài chính

Actor: C. Mục tiêu: thấy tiền/thu–chi/dòng tiền/tài sản cùng căn cứ. Trigger: mở Tổng quan hoặc hoàn tất mutation. Precondition: settings/scope/period; F-COMPLETE hoặc dataset chosen rõ; Review open không chặn.

Luồng chính: (1) Hệ thống lấy snapshot cùng versions/asOf/scope. (2) Hiện cash31,1m, income10m, gross1,1m/refund0,2m/net0,9m, flow9,1m và assets76,1m tại quote baseline. (3) Breakdown Ăn uống400k/Mua hàng gross600k-refund200k/Chưa phân loại100k; chart/table cùng số. (4) C xem labels/time/source/quality và chọn drill-down UC-DRILL-01.

Alternative/error flows: no accounts/events → empty có setup, không pretend measured0; missing opening/quote/FX → known subtotal + unknown components, không total đầy đủ/tỷ trọng fake; quote old giữ nhãn/time; pending riêng; CF-02 snapshot error/retry giữ kỳ không dùng old như fresh; CF-03 denied; CF-04 mutation invalidate/refetch chung card/chart/table. Mask qua UC-UX-01.

Business rules: BR-03…08/17/18/19/23. Dữ liệu liên quan: DR-01/02/04/07/08/11/14/15. Postcondition: chỉ đọc snapshot, các chỉ số phân biệt và truy được inputs; chưa full net-worth. Truy vết: REQ-TRACK-01, AC-13, SCN-OVERVIEW-01.

## UC-DRILL-01 — Drill-down, phạm vi và archive

Actor: C. Mục tiêu: xem đóng góp và giữ ngữ cảnh. Trigger: click chart/category/asset hoặc toggle scope/archive. Precondition: snapshot có period/scope/version và filter criteria; archive account active không mutation pending.

Luồng chính: (1) C click Ăn uống; hệ thống mở DEMO-04/05 cùng kỳ/account scope; click stock mở holding tương ứng. (2) C Back, hệ thống giữ kỳ/scope/filter. (3) C tắt wallet khỏi cash scope; hệ thống preview/refetch cash29,35m/flow7,35m, giải thích transfer2m ra phạm vi. (4) Scenario riêng C archive wallet sau preview; hệ thống bỏ scope mặc định, ngăn mutation mới, giữ history; C xem include-archive history vẫn thấy DEMO-02/05.

Alternative/error flows: missing quote → known subtotal/detailunknown, không drill fake0; clicked snapshot stale → notice/new snapshot và giữ filter re-evaluated; archive khi mutationpending → chờ kết quả hoặc hủy trướccommit, không discard committed; cancel scope/archive preview không đổi; CF-02/03/04 cho read/update; crossworkspace/unknown refs denied, no link guessed.

Business rules: BR-01/06/19/20. Dữ liệu liên quan: DR-02/04/07/11/14/15. Postcondition: same context chính xác, history intact; scope chỉ đổi totals theo ranh giới, không ledger effect. Truy vết: REQ-TRACK-02, AC-14, SCN-DRILL-01.

## UC-REVIEW-01 — Kiểm tra dữ liệu tiền

Actor: C. Mục tiêu: xử lý nghi vấn trước quyết định có tác động. Trigger: mở case thiếu/trùng/transfer/refund/category/pending/balance. Precondition: case/evidence version và snapshot được load; object cùng workspace, chưa resolved.

Luồng chính: (1) Hệ thống hiện issue/evidence/căn cứ/missing fields/đề xuất. (2) C chọn action theo case; hệ thống preview before/after/delta. (3) C bổ sung evidence hoặc xác nhận/từ chối có reason. (4) Hệ thống apply case/version và money change nếu có, history rõ, refetch snapshot. (5) C quay lại Tổng quan, không buộc làm hết case.

Alternative/error flows theo loại: duplicate DEMO-06 đủ criteria → link evidence delta0; same amount/day ambiguous → không tự gộp, reject/defer giữ nguyên. Transfer một phía → request nhận/evidence hoặc defer, không fake account đích; khi đủ ghép clearing không post lại phía nguồn. Refund chưa link → chọn purchase/evidence, reclassify receipt không cộng cash 2 lần; over-refund giữ pending cho tới căn cứ/decision, không cap số. Missing mandatory → bổ sung+validate trước post; category missing → assign category, posted gross giữ; pending lâu → review evidence, không auto posted theo thời gian; balance → UC-CASH-02 hoặc kiểm tra source cùng mốc, không auto expense. Cancel/defer không apply money; CF-02/03/04 read/confirm, case đã resolved trả decision cũ delta0, case version đổi cần preview mới.

Business rules: BR-05…14/21. Dữ liệu liên quan: DR-06/07/08/09/10/12/14/15. Postcondition: resolved/deferred với đúng decision; căn cứ/history và delta khớp, user_confirmed không độc lập xác minh. Truy vết: REQ-REVIEW-01, AC-15, SCN-REVIEW-01/X03/X05/X06/X07/X11.

## UC-REVIEW-02 — Kiểm tra holdings/giá/nguồn

Actor: C; N quote/FX/source demo. Mục tiêu: phân biệt lượng cũ và giá thiếu/cũ/sai. Trigger: mở case quantity_stale/price_stale/missing/FX/incompatible/source. Precondition: holding/quote/source timestamps và case version, synthetic.

Luồng chính: (1) Hệ thống nêu quantityAsOf, quoteAt, FXAt, sourceSuccess riêng và policy OD-02. (2) C xem thiếu/cũ/sai nào ảnh hưởng valuation; hệ thống preview phần known/unknown. (3) C chọn cập nhật quantity qua UC-HOLD-01 hoặc quote/source qua UC-SOURCE-01. (4) Hệ thống chỉ resolve nếu cause đã xử lý phù hợp; snapshot refresh, ghi evidence/decision.

Alternative/error flows: user từ chối cập nhật/defer → giữ stale label, không đổi time để giả mới; xác nhận lượng lần nữa là self-declared mới, không verified ownership; missingFX không quote0; product/purity/unit/market sai không apply; source revoked cần reconnect, không user confirm bypass; CF-02/03/04; cancel no mutation/resolve. Không confidence/coverage% chưa đo.

Business rules: BR-15/16/18/19/21/22. Dữ liệu liên quan: DR-03/04/05/06/10/11/14/15. Postcondition: quality thật theo dữ liệu mới hoặc chưa xử lý có nhãn; không false precision/realtime. Truy vết: REQ-REVIEW-02, AC-16, SCN-REVIEW-02/X09.

## UC-UX-01 — Đọc và thao tác responsive/keyboard/privacy

Actor: C. Mục tiêu: dùng đầy đủ giao diện tiếng Việt, kiểm soát lộ số trên màn hình. Trigger: thao tác desktop/mobile/bàn phím hoặc bật Ẩn số. Precondition: scenario demo có đủ card/chart/table/detail/form/Review; prototype sẽ xây bước 3.

Luồng chính: (1) C điều hướng keyboard mở form/dialog, hệ thống focus đúng, labels/errors chữ. (2) C nhập/confirm hoặc cancel; hệ thống phản hồi và trả focus khi đóng. (3) C đọc chart bằng bảng tương đương. (4) C bật masking, hệ thống che card/chart/tooltip/table/detail/Review/accessibility values. (5) C đổi viewport; mọi action vẫn đọc/bấm được.

Alternative/error flows: validation CF-01 không color-only; narrow viewport cho table scroll trong container không overflow page; animation reduced motion; data missing/stale nêu chữ, không dùng0; CF-02 loading/error/retry accessible và giữ input; CF-03 denied có explanation; CF-04 rapid navigation không flash dữ liệu cũ/unmasked. Cancel dialog không financial effect; masking toggle không sửa financial records.

Business rules: BR-19/23/24. Dữ liệu liên quan: DR-14/15. Postcondition: tương đương chức năng/context ở các viewport, giá trị nhạy cảm che toàn bề mặt; masking không privacy backend. Truy vết: REQ-UX-01, AC-17, SCN-UX-01; NFR-02/03/09/11.

## UC-DEMO-01 — Mở, chọn scenario và reset

Actor: C. Mục tiêu: lặp tác vụ với dataset/clock rõ. Trigger: mở demo/chọn scenario/Reset. Precondition: hướng dẫn local có ở bước 3, only synthetic; state demo không real data, scenario specification sẵn.

Luồng chính: (1) Hệ thống hiện nhãn dữ liệu/giá/ngày giả và fixture version. (2) C chọn F-BASE hoặc F-COMPLETE hay fixture nhánh; hệ thống ghi scenario/reset boundary. (3) C thực hiện tác vụ; edits/state trong demo được thể hiện nhất quán. (4) C Reset, xác nhận mất demo edits; hệ thống xóa state/filter/draft/operations rồi load fixture chọn rõ. (5) Hệ thống hiện opening hoặc completed expected theo lựa chọn, clock không theo ngày máy.

Alternative/error flows: cancel Reset giữ edits; load/reset fail CF-02 không báo success, giữ state có nhãn hoặc retry reset; CF-04 reset đang chạy chặn double reset/mutation chưa resolve; import file/key thật không được yêu cầu/chấp nhận vào scenario. CF-03 không bypass quyền real workspace. F-EMPTY khác F-BASE, không reset một phần cases/quotes. Có Plan/Goals/AI scripted được gắn nhãn; không menu Alerts/Budget advanced hoạt động, no fake backend reload claim.

Business rules: BR-01/09/23/24. Dữ liệu liên quan: DR-01…22. Postcondition: fixture/scenario/filter/versions reproducible, money đúng expected, history saureset là history của fixture chọn. Truy vết: REQ-DEMO-01, AC-18, SCN-DEMO-01.

## UC-NAV-01 — Điều hướng năm khu vực và giữ ngữ cảnh

Actor: C — chủ workspace demo. Mục tiêu: tìm đủ chức năng trong 5 navigation. Trigger: mở Home hoặc chuyển tab/detail. Precondition: session demo và context hợp lệ; không cần xử lý hết Review.

Luồng chính: (1) C mở Home với các tab Tổng hợp, Báo cáo, Tài khoản & Tài sản. (2) C mở tài khoản/holding để xem hoặc cập nhật theo UC tương ứng. (3) C vào Dữ liệu để nhập nguồn hoặc kiểm tra case. (4) C chuyển Giao dịch, Plan, AI hoặc mở linh vật. (5) Back phục hồi kỳ, phạm vi, bộ lọc và đối tượng; settings nằm trong hồ sơ.

Alternative/error flows: Route/object không tồn tại hoặc mất quyền: CF-03, không đoán đối tượng. Kỳ sai: CF-01. Read lỗi: CF-02 giữ route/filter. Response route cũ: CF-04. Cancel giữ dữ liệu; Escape trả focus. Plan tương lai có nhãn kế hoạch, không thay kỳ báo cáo actual.

Business rules: BR-25/26/35/36. Dữ liệu liên quan: DR-15/16/22. Postcondition: đúng 5 navigation, các thao tác tài sản/Review vẫn đầy đủ, Back giữ context. Truy vết: REQ-NAV-01, AC-19, SCN-NAV-01.

## UC-REPORT-01 — Xem Home và báo cáo theo kỳ

Actor: C — chủ workspace demo. Mục tiêu: hiểu hoạt động trong kỳ và số dư tại thời điểm. Trigger: chọn tháng/quý/năm/custom trên Home. Precondition: trackingStart, clock và versions rõ; có thể thiếu giá lịch sử.

Luồng chính: (1) C chọn khoảng ngày/phạm vi. (2) Hệ thống chuẩn hóa kỳ half-open +07 và as-of. (3) Hiện hai khối Tiền & Hoạt động / Tài sản & Cơ cấu cùng chart/table. (4) C xem thu–chi, dòng tiền, Insights, coverage và căn cứ. (5) Chọn 02–08/10: tiền as-of 08/10 là 31,2m; không dùng quote 31/10 cho ngày 08/10.

Alternative/error flows: Ngày thiếu/start>end: CF-01; cancel giữ kỳ cũ. Kỳ trước trackingStart có nhãn unknown. Quý/năm chưa đủ có nhãn partial/future; không cộng các số dư tháng. Thiếu quantity/quote lịch sử: subtotal và total unknown; giá cũ hợp lệ có timestamp. CF-02/03/04 cho lỗi đọc, quyền và chuyển kỳ liên tiếp.

Business rules: BR-03/18/19/26/36. Dữ liệu liên quan: DR-01/04/11/14/16. Postcondition: activity theo kỳ và balance/valuation as-of nhất quán, không ghi actual hoặc dùng giá tương lai. Truy vết: REQ-REPORT-01, AC-20, SCN-REPORT-01.

## UC-INSIGHT-01 — Đọc insight và mở căn cứ

Actor: C — chủ workspace demo. Mục tiêu: hiểu điểm đáng chú ý và hành động tiếp theo. Trigger: Home hiển thị insight hoặc C chọn một card. Precondition: snapshot có period/scope/version và evidence đủ cho nhận xét.

Luồng chính: (1) Hệ thống lấy insight xác định: food400k hoặc uncategorized100k. (2) C đọc nhận xét, kỳ, quality và nhãn rule/scripted AI. (3) C chọn Xem căn cứ để mở giao dịch/đối tượng đúng bộ lọc. (4) Đổi kỳ/phạm vi khiến insight được tính lại theo snapshot mới.

Alternative/error flows: Thiếu kỳ so sánh: không tạo trend% hoặc kết luận nguyên nhân. Dữ liệu thiếu: nêu giới hạn hoặc không phát insight. CF-02 cho tool/read failure; CF-03 cho mất quyền; CF-04 cho căn cứ đổi. Đóng card không tác động tài chính; không phát Alerts hoặc tự sửa Plan.

Business rules: BR-19/27/34/36. Dữ liệu liên quan: DR-14/16/21/22. Postcondition: card/nhận xét có căn cứ hoặc giới hạn rõ, không ghi actual. Truy vết: REQ-INSIGHT-01, AC-21, SCN-INSIGHT-01.

## UC-PLAN-01 — Lập và chỉnh kế hoạch tài chính

Actor: C — chủ workspace demo. Mục tiêu: đặt dự kiến thu nhập/chi tiêu/đầu tư và xem forecast. Trigger: tạo Plan hoặc sửa version hiện tại. Precondition: baseline actual, currency/account/horizon và giả định rõ.

Luồng chính: (1) C chọn 11/2026 từ F-COMPLETE. (2) Nhập thu5m/chi2m/đầu tư1m cùng ngày và recurrence nếu cần. (3) Xác nhận giả định giá cố định/liên kết holding. (4) Preview tiền33,1m/tài sản79,1m với nhãn planned rồi confirm. (5) Xem dashboard/timeline, sửa hoặc archive có history/version.

Alternative/error flows: Amount≤0, thiếu account/date/horizon: CF-01. Thiếu balance: forecast partial. Recurrence chỉ tạo occurrences trong horizon, không trùng. Thiếu giá/liên kết đầu tư: forecast cash vẫn có, assets unknown. CF-02/03/04 cho lỗi lưu, quyền, version; cancel giữ draft; archive không posting. Thu tương lai không tài trợ goal actual.

Business rules: BR-28/32/36. Dữ liệu liên quan: DR-14/17/20. Postcondition: Plan/version/schedule có giả định; actual ledger không đổi, forecast có điều kiện. Truy vết: REQ-PLAN-01, AC-22, SCN-PLAN-01.

## UC-PLAN-02 — Ánh xạ thực tế và theo dõi chênh lệch

Actor: C — chủ workspace demo. Mục tiêu: so actual với Plan và dự kiến còn lại. Trigger: mở Tracking hoặc chọn liên kết giao dịch. Precondition: Plan active/version và event cùng workspace/currency/period/type/account.

Luồng chính: (1) C chọn item và event đủ điều kiện. (2) Preview actual/remaining/variance, kiểm tra trùng liên kết. (3) Confirm lưu link/history, không copy event. (4) Fixture actual thu4m/chi2,5m/đầu tư0,5m cho tiền32,1m. (5) Remaining thu1m/chi0/đầu tư0,5m cho forecast32,6m, overspend500k và gap−500k. Unlink có preview/history.

Alternative/error flows: Pending/transfer không phải expense hoặc sai account/type/period: từ chối có lý do CF-01/03. Refund giảm expense ở kỳ nhận; reversal dùng signed effects. Một event không gắn hai items trong cùng planVersion. Revision làm actual đổi: tính lại tracking. CF-02/04 cho lỗi/version; cancel giữ links; balance thiếu thì forecast partial.

Business rules: BR-05/07/29/36. Dữ liệu liên quan: DR-07/08/17/18. Postcondition: mapping unique và có history, remaining không đếm actual lần hai, ledger không đổi. Truy vết: REQ-PLAN-02, AC-23, SCN-PLAN-02.

## UC-GOAL-01 — Tạo mục tiêu và phân bổ tiền

Actor: C — chủ workspace demo. Mục tiêu: dành tiền hiện có cho target có hạn. Trigger: tạo/sửa goal, phân bổ hoặc release. Precondition: actual balance và tổng allocations cùng workspace/VND/version rõ.

Luồng chính: (1) C tạo goal5m, hạn30/11, nguồn bank. (2) Phân bổ3m từ bank26,5m. (3) Preview available23,5m/progress60%/remaining2m, tiền31,1m/tài sản76,1m giữ nguyên. (4) Confirm lưu goal/allocation/version/history. (5) Sửa/release có preview; archive cần preview/confirm release allocations và giữ history, không nhận allocation mới. Release chỉ gỡ earmark.

Alternative/error flows: Target≤0, thiếu hạn, allocation âm: CF-01. Goal2 phân bổ24m làm tổng27m>26,5m: chặn. Thu tương lai/stock valuation không là eligible cash. Balance unknown: draft không xác nhận capacity. CF-02/03/04 cho lỗi, quyền, stale balance; cancel không earmark. Funded đủ không tự chuyển tiền/mua tài sản.

Business rules: BR-30/31/32. Dữ liệu liên quan: DR-02/19. Postcondition: goal và allocations có version, không tạo money movement/cashflow/tài sản. Truy vết: REQ-GOAL-01, AC-24, SCN-GOAL-01.

## UC-GOAL-02 — Theo dõi tiến độ và hụt nguồn

Actor: C — chủ workspace demo. Mục tiêu: biết funded progress sau actual thay đổi. Trigger: mở Goal Tracking hoặc actual balance đổi. Precondition: goal/allocations/actual snapshot có quality; không chặn actual đã xảy ra.

Luồng chính: (1) Hệ thống tính funded từ các account. (2) Bank chi24m còn2,5m, allocation vẫn3m. (3) Hiện funded2,5m/progress50%, allocated60%, shortfall500k/remaining2,5m. (4) C xem thêm nguồn/release/chỉnh kế hoạch có preview. (5) Khi funded≥target, C có thể đánh dấu achieved; archive độc lập. Mọi thay đổi status có history.

Alternative/error flows: Nhiều goal dùng cùng account thiếu tiền: pro-rata và stable allocation ID rounding, không cấp đủ cùng một khoản cash cho từng goal. Balance unknown: progress unknown. Contribution planned chưa nhận không funded. Funded<target không cho đánh dấu achieved. CF-02/03/04 cho read/quyền/version; cancel giữ earmark/status; hụt nguồn không tự xóa allocations.

Business rules: BR-30/31/32/36. Dữ liệu liên quan: DR-02/07/19. Postcondition: funded/allocated/shortfall/lifecycle riêng; goal status không sinh actual money. Truy vết: REQ-GOAL-02, AC-25, SCN-GOAL-02/X14.

## UC-SIM-01 — Mô phỏng đạt goal và thay đổi tài chính

Actor: C — chủ workspace demo. Mục tiêu: so phương án có điều kiện trước hành động. Trigger: chọn Mô phỏng từ Plan/Goal hoặc AI read-only tool. Precondition: baseline/Plan/Goal versions được chụp, horizon/steps/giả định rõ.

Luồng chính: (1) Goal5m có earmark3m; thêm hai đóng góp1m từ cash đã có trong scenario. (2) Đạt goal chỉ earmark, tiền31,1m/tài sản76,1m không đổi. (3) Mô phỏng mua tiêu dùng5m: tiền26,1m/tài sản71,1m; cumulative gross6,1m/net5,9m, future period riêng chi5m. (4) Scenario đầu tư1m theo giá cố định: tiền30,1m/tài sản76,1m. (5) So kết quả và lưu scenario, không commit actual.

Alternative/error flows: Thiếu cash/horizon hoặc thứ tự ngày sai: CF-01. Thiếu quote/FX: partial valuation. Thu tương lai chỉ giả định. Versions đổi: CF-04 báo stale/recompute, không tự sửa scenario cũ. CF-02/03 cho tool lỗi/quyền; cancel không writes. Không tự thanh lý stock hoặc giả định chắc chắn giá tăng.

Business rules: BR-28/30/31/32/36. Dữ liệu liên quan: DR-17/19/20. Postcondition: result có nhãn simulated/conditional/version/quality; actual và allocations giữ nguyên. Truy vết: REQ-SIM-01, AC-26, SCN-SIM-01.

## UC-AI-01 — Hỏi–đáp có căn cứ và xem lịch sử

Actor: C — chủ workspace demo. Mục tiêu: hiểu tài chính từ kết quả đọc được phép. Trigger: gửi câu hỏi hoặc mở lịch sử. Precondition: chỉ synthetic; context/versions chụp rõ, whitelist tools, không model/key thật.

Luồng chính: (1) C hỏi chi tháng10, thấy context chip/processing. (2) Demo chọn report tool và kiểm tra workspace/object. (3) Engine fixture trả gross1,1m/refund200k/net900k/refs. (4) Hiện lời giải thích scripted, cards và drill links từ result, không tự cộng sổ. (5) Hỏi food/giá/Plan hoặc mở history; message giữ context/time và nhãn stale khi căn cứ đổi.

Alternative/error flows: No-data/tool-error/timeout/quota: CF-02 nêu giới hạn, không bịa0/số hoặc paid fallback. SQL/write/trade từ prompt/source/model bị từ chối. CF-03 deny/redact result khác workspace/mất quyền. CF-04 response giữ context cũ; muốn hiện tại phải refresh. Cancel câu hỏi không ghi tài chính; chat text là dữ liệu, không cấp quyền. Real-data AI cần gate riêng.

Business rules: BR-27/33/34/35/36. Dữ liệu liên quan: DR-14/16/17/18/19/20/21/22. Postcondition: có authorized result hoặc giới hạn rõ, history dùng chung, không actual/Plan mutation/trade. Truy vết: REQ-AI-01, AC-27, SCN-AI-01/X13.

## UC-AI-02 — Chat qua linh vật ở mọi khu vực

Actor: C — chủ workspace demo. Mục tiêu: hỏi theo ngữ cảnh trang đang xem. Trigger: click/focus/Enter icon linh vật ở một trong 5 navigation. Precondition: shared conversation/session; route/period/scope/object hợp lệ, masking rõ.

Luồng chính: (1) C mở panel có context chip và hội thoại hiện có. (2) Kiểm tra context rồi gửi câu hỏi qua UC-AI-01. (3) Cards/refs/câu trả lời đồng bộ trang AI đầy đủ, không tạo conversation lặp. (4) Điều hướng khi chờ response: message giữ context cũ, trang mới có nhãn context riêng. (5) Escape/close trả focus và giữ history; Reset xóa chat/context/results.

Alternative/error flows: Object sai/xóa/denied: CF-01/03, không chuyển dữ liệu qua workspace khác. Loading/error: CF-02 có text accessible. Race/stale: CF-04 không giả dữ liệu cũ là current. Mobile không che form/confirm. Mask structured numbers và ẩn free-text/narrative/history ở cả panel/full chat/tooltips/accessible text. Close không xóa chat hoặc tự writes; tôn trọng reduced motion.

Business rules: BR-25/33/34/35/36. Dữ liệu liên quan: DR-15/16/22. Postcondition: hội thoại/context rõ ở 5 navigation, masking/reset/bàn phím nhất quán, không tác động tài chính. Truy vết: REQ-AI-02, AC-28, SCN-AI-02.

