# Precision, calendar và snapshots

**ENG-01…06 · DESIGN; production implementation NOT RUN.**

## 1. Số tiền và số lượng

Tiền actual VND là integer decimal string canonical, tối đa18 chữ số phần nguyên; amount giao dịch dương, opening/count không âm, posting line có dấu và khác0. Quantity/quote/FX dùng numeric(28,8): tối đa20 chữ số nguyên,8 chữ số lẻ; quantity không âm, quote/FX dương. Server kiểm lexical shape, finite, sign, scale, range **trước cast DB**. Không nhận NaN/Infinity, dấu phân cách, exponent hoặc Number cho money; không để typmod tự làm tròn input sai. PostgreSQL numeric có rounding và special values riêng, nên CHECK(value>0) không đủ. [PostgreSQL numeric](https://www.postgresql.org/docs/18/datatype-numeric.html).

Canonical output không exponent, dấu cộng, negative zero hoặc padding không cần thiết. Có thể normalize trailing zeros của quantity/rates sau khi kiểm scale đầu vào, trước semantic digest; không nhận `1.000000000` rồi âm thầm làm tròn8 số. Adapter đổi đơn vị/source scaling phải dùng chuỗi chính xác, không qua Number. Giới hạn1e12/6 decimals hiện ở frontend là giới hạn prototype, không phải DB production limit; adapter UI phải được kiểm riêng trước mở rộng input.

Phép cộng/trừ actual dùng exact integer/scaled decimal. Với valuation, giữ numerator chính xác của quantity × price × FX, denominator là10^scale và hệ số đơn vị; round HALF_UP tới1VND **mỗi holding rồi cộng**. Không round unit price trước multiplication. Half-up cho signed projections là tie away from zero; actual input không tự round. Ratio pro-rata dùng integer division/remainder, không float hoặc decimal division gần đúng rồi floor.

decimal.js được chọn làm hướng thư viện decimal TypeScript; clone context riêng, precision80 là candidate, không global mutable Decimal.set làm lệch module khác. Package/version/known vectors/ARM64 chưa pin hoặc benchmark. Với bounds lớn, phải chứng minh phép toán không mất unit: dùng exact coefficient/BigInt numerator-denominator tại valuation và pro-rata; không coi precision80 tự đủ cho mọi tích tùy ý. Tràn phạm vi input/output/aggregate trả lỗi có kiểm soát, không clamp, wrap, zero hoặc rút bớt dữ liệu. [decimal.js API](https://mikemcl.github.io/decimal.js/).

Actual/Goals/planning funding không binary64. Transcendental factors của mô phỏng stochastic được phép approximate theo model version; output vẫn có nhãn simulated và không ghi actual. Money JSON của API mới là strings; tỷ lệ xác suất là bounded number phục vụ trình bày, không input amount.

## 2. Calendar và as-of

UTC timestamptz cho received/committed/expiry/lease; business_date và kỳ theo Asia/Ho_Chi_Minh. Không dùng slice(0,10) của timestamp UTC để suy ngày Việt Nam. Date-only CSV giữ precision=date, không bịa giờ xảy ra. Kỳ `[start 00:00,endExclusive 00:00)`; endExclusive được loại hoàn toàn. Khi cutoff là ngày, semantics end-of-day được biểu diễn bằng đầu ngày kế tiếp exclusive, không dùng ký tự `~` hoặc trừ1ms làm identity thời gian.

Report hiện tại cắt ở clock thật; history cắt ở kỳ đã chọn. Tracking window, opening, coverage gaps và future interval có metadata riêng. Không thể kết luận đủ dữ liệu chỉ vì calendar month hoàn tất hoặc không nhận notification. Quarter/year tính từ calendar đang chọn, không hardcodeQ4/2026. Valid Gregorian date, leap year, day1…31 và thứ tự start/end được kiểm độc lập timezone máy.

Monthly recurrence tính từng năm/tháng từ **anchor day gốc**, clamp tới ngày cuối tháng rồi áp dụng start/end inclusive của lịch. Ví dụ31/01 →28/02 →31/03, không29/03 hoặc28/03 do nối từ ngày đã clamp. Occurrence opaque ID lấy từ scope/item revision và nominal date qua deterministic bounded identifier registry; không dùng chuỗi `item@date` vào ID regex chỉ nhận chữ/số/_/-. Skip month không sinh occurrence; vượt horizon/budget báo lỗi, không truncate im lặng.

## 3. Hai mốc thời gian và nguồn giá

Snapshot chụp business cutoff cùng recorded knowledge version: “giá trị tại ngàyT dựa trên facts đã được biết khi tạo snapshot”. Late import/correction thay report được tính mới, không sửa snapshot đã pin. Chỉ chọn quote/quantity/FX effective tại hoặc trướcT và có trong recorded cutoff; không lấy quote tương lai hoặc FX mới nhất hiện nay để lấp lịch sử.

Chọn quote theo profile/instrument/side/unit/currency/entitlement tương thích trước; sort quoteAsOf, sau đó provenance revision/record ID ổn định. quoteAsOf, fetchedAt và lastSuccess khác nhau. Profile/version, source scale, FX direction/asOf, quantity movement refs và normalization version được freeze. Không nhân purity9999 lần nữa nếu quote đã cho đúng sản phẩm. Không trộn giá bán với giá mua để làm “latest”.

VND/share và VND/chỉ là canonical valuation; VND/lượng chia10, USD/lượng ×VND-per-USD÷10. Chưa mở actual multi-currency ledger chỉ vì quotes cóUSD. Thiếu FX/unit/profile/quote/quantity → unknown với reason, không0. Quantity biết bằng0 thì valuation biết0 mà không cần giá; quantity unknown không được coi bằng0. Thiếu cost chỉ làm P/L unknown; basis coverage không đủ sau đổi quantity thì không suy realized P/L.

Stale price giữ last-good và asOf thật. Candidate inherited freshness: quote/FX>24h, quantity>30ngày, source success>48h; bằng ngưỡng chưa stale. Provider-specific calendar/cache policy ARCH-11 phải version nếu khác, không thay elapsed time bằng “vừa fetch” để giả fresh.

## 4. Snapshot consistency và cache

Read transaction REPEATABLE READ chụp workspace financial version, Plan/Goal revisions, scope, domain history refs, quote/FX/profile và Engine/rules version. Every card/table/tool dùng cùng snapshot; aggregate không lấy component ở version khác. Snapshot phải đóng dependency closure, gồm **mọi competing allocations** trên các account được chọn, không chỉ goal hiển thị.

Projection cache chứa dữ liệu dẫn xuất có thể rebuild; key gồm scope, period/cutoffs, refs digest, versions, Engine/model/DTO schemas. Facts/history có pin không bị TTL cache xóa. Portfolio thiếu một holding: full total=null, known subtotal và missing list riêng; stale/unknown/partial là các trục, không phải số0. Không mặc định tất cả holdings thuộc một subset account: cash account scope và portfolio holdings scope phải công bố riêng; không nhận scope không biểu đạt được để tính một tổng giả.
