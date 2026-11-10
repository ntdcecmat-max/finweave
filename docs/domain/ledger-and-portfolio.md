# Ledger, giao dịch và tài sản

**ENG-07…13 · DESIGN; SQL/domain implementation NOT RUN.** BR-04…17/40/42/43 tiếp tục áp dụng.

## 1. Posting model

Posting group có ít nhất2 lines khác0, tổng signed_amount theo currency bằng0. Actual currency hiện VND. Draft/pending/receipt/Review không là posted cash. Group building chỉ tồn tại trong transaction; deferred guard cấm commit building, empty, unbalanced. Group sealed chặn cả balanced append lẫn UPDATE/DELETE; không dựa riêng sum0 trigger. Runtime không được TRUNCATE, retarget ledger account hoặc bỏ guard.

| Nghiệp vụ | Các signed lines | Thu–chi |
| --- | --- | --- |
| Opening dương | +cash asset, −opening equity | Không income/expense |
| Income | +cash asset, −income counteraccount | Income dương |
| Expense | −cash asset, +expense counteraccount | Gross expense dương |
| Refund liên kết | +cash asset, −refund/expense counteraccount | Giảm net expense kỳ nhận; không income |
| Transfer đủ hai chân | −asset nguồn, +asset đích | Không income/expense; flow theo selected scope |
| Transfer mới biết chân đi | −asset nguồn, +transfer clearing | Không tự tăng asset đích; needs_review |
| Xác nhận chân nhận sau | −transfer clearing, +asset đích | Chỉ effect mới của chân nhận; không sửa sealed group gốc |
| Investment purchase | −cash asset, +investment clearing/capital counteraccount; quantity delta cùng UoW | Không expense sinh hoạt; holding valuation trình bày riêng |
| Unknown receipt/adjustment | Asset signed effect và đối ứng suspense/adjustment rõ reason | Không giả income/expense; cần Review/provenance |

Counteraccounts là bookkeeping nội bộ, không thêm vào tracked assets rồi cộng holding lần hai. Internal ledger accounts có account_id=NULL và purpose kind duy nhất theo workspace; user account có đúng mapping immutable. Zero opening giữ declaration/history nhưng không tạo2 zero lines; sửa opening về0 dùng reversal của opening cũ, không tạo zero event trái amount>0.

Balance đọc sealed posted lines; accounts.opening là declaration/provenance và không cộng lần nữa nếu đã có opening group. Migration baseline phải reconcile declaration với opening event trước cutover, không tự post lại. createAccount API hiện yêu cầu opening explicit; nếu owner chưa có baseline thì giữ source unbound/needs_setup, không tự truyền0 để kết nối. Coverage gap sau baseline có thể làm absolute balance unknown dù movements đã biết. Số dư là recorded estimate, không bank-verified balance. Actual observation có thể làm balance âm; không chặn sự kiện thực chỉ vì không đủ tiền trong sổ hoặc đã earmark. Planning/simulation funding có kiểm đủ tiền riêng.

## 2. Transfers, fees và matching

Membership hai account trong selected scope quyết flow: cả hai nằm trong scope thì transfer net0, chỉ nguồn thì âm, chỉ đích thì dương. Fee là expense riêng, cùng bundle nếu được xác nhận cùng lúc; transfer pending/draft không được làm fee tự posted. Amount chuyển không bị âm thầm giảm fee.

Hai observations của một transfer cần matching căn cứ source reference/account/time/direction; cùng amount/date không đủ. Mỗi observation/digest chỉ attach đúng lineage; nhận evidence mới có thể match delta0 nếu cả hai effects đã posted, không cộng destination lần hai. Một chân đi và một chân nhận có thể khác ngày; clearing tồn tại tới matching và không giả asset thực. Notification không chứng minh account balance, opening hoặc coverage đầy đủ.

Transport replay riêng semantic dedupe. Source evidence trùng chỉ tăng provenance/history, không thêm ledger effects. Ambiguous duplicate/refund/transfer vào Review. Generic parser, API retry hoặc Agent không được tự xác nhận thay owner ở các trường hợp cần quyết định.

## 3. Refund và correction

Refund liên kết expense cùng workspace/account/currency theo API hiện hành; giữ ngày tiền nhận, kể cả expense ở tháng trước. Tổng net refunds còn hiệu lực của expense family không vượt expense còn được hoàn. Refund chưa tìm origin là unknown receipt có cash effect nếu evidence đủ; link origin chỉ reclassify/reconcile, **không post cash lần nữa**. Refund vượt cap chưa post hoặc vào Review, không tự cap số tiền.

Posted correction tạo exact reversal theo mọi ledger account/currency của group gốc, rồi replacement/history/replay atomic. Original vẫn được tính cùng reversal; không loại original vì status reversed. Mỗi group chỉ bị reverse một lần; replacement có lineage riêng. Metadata/category override có version/history, không mutate immutable money facts; source revision không đè override.

Current correctPostedEvent API chỉ có amount/description/reason, không tự mở chức năng đổi quantity/two-leg transfer bằng input bịa. Những bundle có dependent refunds, completed receiving leg hoặc holding movements phải dựng preview dependency closure; giảm expense dưới refunds đang hiệu lực bị conflict/requires_review, không cascade âm thầm. Existing resolveReviewCase là port xử lý loại case được hỗ trợ; hành vi mới ngoài schema cần revision riêng trước implement.

Backdated correction có effective business date trong phạm vi được phép, committed time/history riêng. Report current-knowledge được tính lại; snapshot cũ không sửa. Unknown adjustment direction lấy từ sealed posting lines, không đoán từ positive event.amount hoặc event.kind. Cash count observation không tự post; resolution rechecks current account/version và variance tại cutoff trước khi xác nhận.

## 4. Quantity, giá và P/L

Declaration/correction dùng movement mode=set; purchase là mode=delta với cash và quantity cùng transaction. Gold canonical chỉ (1lượng=10chỉ), stock canonical share. Không quantity âm hoặc short position. Movement được sắp business_date rồi sequence_no ổn định; sau mỗi bước phải không âm. quantity after-value của record chỉ là audit tại lúc ghi, không cộng các after-values và không dùng làm truth khi có backdated facts; replay set/delta mới là authority của quantity projection.

Sửa fact cũ phải rebuild và kiểm mọi downstream quantity/links dưới holding lock. Không cho correction làm mất quantity đã bán hoặc biến delta thành declaration để né validation. P/L chỉ tính khi cost basis đủ, đúng quantity/currency/asOf; actual quote gain không income/cash. Giá mới chỉ thay valuation, không quantity, allocations hoặc actual. Corporate action/sale/capital-gain/tax không tự được thêm vào API vì có field cost; nguồn unsupported giữ Review/không giả dữ liệu.

CSV selected-set commit atomic, receipts và manual entries cùng gọi Ledger posting port. Không có import/collector ledger riêng. Source raw/OTP vẫn bị cấm; chỉ normalized evidence đã có consent/profile/owner binding và private retention policy.
