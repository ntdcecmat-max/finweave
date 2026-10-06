# FinWeave — Brainstorm Ideas về Modules và Tính năng

**Loại sản phẩm:** Personal Finance Management SaaS  
**Mục tiêu:** Hợp nhất tiền tại ngân hàng/ví, tiền mặt, cổ phiếu và vàng; theo dõi thu–chi, dòng tiền và giá trị tài sản trong phạm vi dữ liệu đã thu thập; trình bày trực quan và hỗ trợ quyết định bằng công cụ tài chính cùng AI Agent. Bất động sản và phần vốn kinh doanh là phạm vi mở rộng.  
**Trạng thái:** Brainstorm — chưa phải phạm vi hoặc yêu cầu đã được phê duyệt.

## 1. Định hướng thiết kế tổng thể

FinWeave nên được tổ chức theo ba lớp:

1. **Nền tảng dữ liệu tài chính:** thu thập, chuẩn hóa, lưu trữ và đối soát giao dịch.
2. **Trải nghiệm quản lý tiền:** accounts, transactions, dashboard, reports, budget và goals.
3. **AI hỗ trợ quyết định:** giải thích kết quả đã được Financial Engine tính và đưa ra các lựa chọn để người dùng cân nhắc.

Financial Engine phải là nguồn sự thật. AI không trực tiếp tính sổ tài chính, phân quyền hoặc tự thực hiện giao dịch.

### 1.1. Thu thập dữ liệu — phạm vi và nguyên tắc

FinWeave kết hợp **dữ liệu người dùng cung cấp**, **dữ liệu giao dịch từ thông báo/sao kê** và **giá thị trường từ API**. Mục tiêu là giảm công nhập liệu và tạo bức tranh tài chính có thể truy ngược nguồn, không mặc định mọi dữ liệu đều tự động hoặc đã được xác minh.

**Phạm vi phiên bản đầu:** ngân hàng/ví điện tử, tiền mặt, cổ phiếu và vàng. Bất động sản và phần vốn tại cơ sở kinh doanh thuộc hướng mở rộng sau.

Phân biệt hai loại cập nhật:

- **Giao dịch và số lượng sở hữu:** tiền vào/ra, mua/bán, số cổ phiếu hoặc khối lượng vàng; đến từ nguồn giao dịch hoặc người dùng khai báo.
- **Giá thị trường:** dùng để tính giá trị tham chiếu của lượng tài sản đã khai báo. API giá không tự biết người dùng vừa mua/bán và không xác minh quyền sở hữu.

Chỉ công bố hỗ trợ một nguồn sau khi đã kiểm tra quyền truy cập, điều kiện sử dụng và dữ liệu thực tế. Không cam kết bao phủ 90% hoặc realtime toàn bộ khi chưa có kết quả đo trong phạm vi cụ thể.

### 1.2. Bốn nhóm dữ liệu của phiên bản đầu

| Nhóm | Người dùng cung cấp | Hệ thống thu thập và sử dụng | Giới hạn cần hiển thị |
|---|---|---|---|
| Ngân hàng, ví điện tử | Chọn tài khoản, cấp quyền đọc nguồn được hỗ trợ hoặc nhập sao kê; bổ sung số dư ban đầu nếu cần | Tiền vào/ra, số tiền, tiền tệ, thời gian, nội dung; tài khoản, số dư và người gửi/nhận nếu nguồn có thể hiện | Chỉ hỗ trợ nguồn đã kiểm thử; có thể thiếu giao dịch hoặc trường thông tin |
| Tiền mặt | Số dư ban đầu, các khoản thu–chi và số tiền kiểm đếm | Tính số dư, tổng hợp thu–chi, phát hiện chênh lệch khi kiểm đếm | Dữ liệu tự khai báo, không tự xác minh tiền thực tế |
| Cổ phiếu | API key riêng từ tài khoản tại nhà cung cấp được hỗ trợ; mã, thị trường, số lượng và giá vốn nếu có | Nhận giá thị trường, tính giá trị danh mục và biến động; tính lãi/lỗ theo dữ liệu giá vốn đã có | API giá không đồng bộ số lượng nắm giữ; độ cập nhật và quyền truy cập phụ thuộc nhà cung cấp |
| Vàng | Loại vàng, thương hiệu nếu áp dụng, độ tinh khiết, khối lượng, đơn vị và giá vốn nếu có | Nhận giá phù hợp từ nguồn được hỗ trợ, quy đổi đơn vị và tính giá trị tham chiếu | Giá quốc tế không mặc nhiên là giá bán lại vàng vật chất tại Việt Nam |

#### A. Ngân hàng và ví điện tử

- **Kênh thu thập tự động ưu tiên khảo sát:** thông báo ứng dụng trên Android, qua quyền truy cập thông báo do người dùng cấp.
- **Kênh bổ sung và kiểm tra lại:** sao kê/lịch sử giao dịch do người dùng nhập. Ưu tiên CSV hoặc dữ liệu có cấu trúc nếu nguồn hỗ trợ; chỉ hỗ trợ PDF/ảnh sau khi kiểm thử bộ đọc tương ứng.
- SMS và email là kênh mở rộng có điều kiện. Quyền đọc SMS trên Google Play cần được xét duyệt; tích hợp hộp thư như Gmail có yêu cầu quyền truy cập và xác minh riêng.
- Không cam kết chức năng tự đọc thông báo/SMS tương đương Android trên iPhone. Web và các thiết bị khác có thể dùng nhập file hoặc nhập tay.
- Xây bộ trích xuất theo từng ngân hàng/ví và phiên bản mẫu dữ liệu. Thiếu tên người gửi/nhận, mã giao dịch hoặc thời gian thì để thiếu hoặc ghi rõ giá trị thay thế; không tự suy đoán thành dữ kiện.
- Thông báo giúp cập nhật sớm nhưng không chứng minh lịch sử đã đầy đủ. Cần phát hiện trùng giữa thông báo, email và sao kê; hiển thị thời điểm cập nhật và thời điểm đối soát riêng.
- Không coi API thanh toán dành cho đối tác bán hàng là API đọc toàn bộ lịch sử tài khoản/ví cá nhân.

#### B. Tiền mặt

- Người dùng nhập số dư ban đầu và thu–chi; hỗ trợ thao tác nhập nhanh.
- Cho phép kiểm đếm định kỳ và đối chiếu với số dư tính toán. Khi lệch, đề nghị bổ sung giao dịch hoặc xác nhận điều chỉnh có lý do; không tự gán khoản lệch vào một nhóm chi tiêu.
- Rút ATM hoặc nộp tiền vào tài khoản là chuyển giữa tiền mặt và ngân hàng; phí được ghi riêng.
- Giữ nhãn tự khai báo và lịch sử chỉnh sửa. FinWeave phục vụ quản lý tài chính cá nhân, không dùng số dư tự nhập để chứng nhận tài sản.

#### C. Cổ phiếu — kết nối bằng API key của từng người dùng

- Người dùng đăng ký API tại công ty chứng khoán/nhà cung cấp mà FinWeave hỗ trợ rồi kết nối bằng key của chính mình. SSI FastConnect là ứng viên đã xác nhận có tài liệu API dữ liệu thị trường, cần kiểm thử bằng tài khoản được cấp quyền trước khi chốt tích hợp.
- Chỉ sử dụng quyền đọc dữ liệu thị trường cần thiết; không yêu cầu quyền đặt lệnh trong phạm vi này. Không dùng một key cá nhân chung để phân phối dữ liệu cho toàn bộ khách hàng.
- Trước khi phát hành, xác nhận nhà cung cấp cho phép ứng dụng bên thứ ba sử dụng/lưu key theo mô hình đã chọn. Việc người dùng có key riêng không tự thay thế các điều kiện cấp phép dữ liệu.
- Nếu lưu key trên server, phải mã hóa, giới hạn truy cập, không ghi key vào log; cho phép ngắt kết nối và xóa thông tin kết nối. Người dùng có thể cần thu hồi key trực tiếp tại nhà cung cấp.
- Phiên bản đầu dùng API để lấy **giá**, còn mã, số lượng và giá vốn do người dùng khai báo/cập nhật. Cần hỗ trợ điều chỉnh số lượng do mua/bán, chia tách hoặc cổ tức bằng cổ phiếu.
- Giá trị tham chiếu = số lượng đang nắm giữ × giá thị trường, sau khi chuẩn hóa đơn vị giá và tiền tệ. Lãi/lỗ so với giá vốn không đồng nghĩa tổng hiệu quả đầu tư nếu chưa có phí, cổ tức và lịch sử giao dịch đầy đủ.
- Hiển thị thời điểm giá gần nhất; chỉ gọi là realtime khi kênh dữ liệu thực sự đáp ứng. Tự đồng bộ danh mục cá nhân qua API tài khoản là tính năng mở rộng riêng.

#### D. Vàng

- Người dùng khai báo cụ thể, ví dụ loại vàng nhẫn/miếng, thương hiệu, độ tinh khiết và khối lượng; cập nhật khi mua/bán.
- **Phương án đã có nguồn thử được:** giá vàng quốc tế qua `gold-api.com`. Endpoint `GET https://api.gold-api.com/price/XAU` đã trả JSON thành công trong lần kiểm tra ngày 04/10/2026. Kết quả này xác nhận khả năng kết nối tại thời điểm kiểm tra, không phải bảo đảm độ chính xác hoặc tính sẵn sàng lâu dài.
- Chuẩn hóa đơn vị khối lượng và đơn vị báo giá. Nếu quy đổi từ USD sang VND, phải có nguồn tỷ giá và thời điểm tỷ giá; không mặc định giá USD đã là giá VND.
- Khi dùng giá quốc tế, gắn nhãn **giá trị tham chiếu theo giá vàng quốc tế**, không trình bày như giá thu mua SJC/PNJ/DOJI.
- Giá vàng bán lẻ Việt Nam chỉ được tự động hóa sau khi xác minh nguồn, loại sản phẩm, đơn vị, quyền sử dụng và độ cập nhật. Bảng giá công khai không mặc nhiên là API chính thức được cấp phép.
- Nếu có nguồn phù hợp, dùng giá mua vào để tham chiếu giá trị bán lại và giữ riêng giá bán ra; giá trị thu mua thực tế vẫn có thể khác theo điều kiện sản phẩm.
- Khi nguồn lỗi hoặc cũ, giữ giá gần nhất kèm cảnh báo thời điểm; không hiển thị như đang cập nhật realtime.

### 1.3. Hướng mở rộng: bất động sản và cơ sở kinh doanh

#### Bất động sản

- Người dùng khai báo tài sản, vị trí, diện tích, tỷ lệ sở hữu và khoản vay liên quan.
- Lưu giá trị ước tính theo từng thời điểm, cùng nguồn: tự ước tính, môi giới, đơn vị thẩm định hoặc báo cáo được cung cấp.
- Theo dõi riêng tiền thuê, chi phí, tiền trả nợ; phân biệt phần trả gốc và lãi.
- Có thể bổ sung dữ liệu tài sản tương tự khi có nguồn hợp lệ, nhưng không coi giá rao bán là giá giao dịch đã hoàn tất.
- **Mức khả thi đã xác định:** quản lý tài sản và cập nhật định giá định kỳ làm được. Chưa xác minh được API công khai miễn phí đủ điều kiện để FinWeave tự định giá thị trường từng bất động sản Việt Nam; không cam kết realtime.

#### Phần vốn tại cơ sở kinh doanh

- Người dùng khai báo cơ sở kinh doanh, vốn góp, tỷ lệ sở hữu, các lần góp thêm/rút vốn và lợi nhuận thực nhận.
- Lưu giá trị phần sở hữu do người dùng hoặc nguồn thẩm định cung cấp theo từng thời điểm.
- Khi có báo cáo đủ dữ liệu, có thể tính tham chiếu phần tài sản thuần: (tài sản − nợ phải trả) × tỷ lệ sở hữu, với giả định quyền lợi được phân chia theo tỷ lệ đó. Đây không mặc nhiên là giá bán doanh nghiệp.
- Có thể mở rộng kết nối phần mềm quản lý/kế toán mà cơ sở đang dùng và cấp quyền, ví dụ KiotViet Public API. Không có tích hợp chung mặc định cho mọi cơ sở; dữ liệu bán hàng có thể chưa đủ để định giá.
- Tránh cộng trùng toàn bộ tài sản của cơ sở và giá trị phần vốn sở hữu vào tổng tài sản cá nhân.
- **Mức khả thi đã xác định:** theo dõi phần vốn, dòng tiền cá nhân và định giá khai báo làm được; tự động hóa phụ thuộc phần mềm nguồn và quyền truy cập.

### 1.4. Điều kiện chất lượng và trạng thái kiểm chứng

- Mỗi bản ghi cần biết nguồn, thời điểm xảy ra/định giá nếu có, thời điểm thu thập và trạng thái kiểm tra. Dữ liệu tự nhập, đọc từ thông báo và nhập từ sao kê không được đánh đồng với tài sản đã xác minh độc lập.
- Phân biệt giá mới với số lượng sở hữu mới: giá cập nhật liên tục vẫn có thể cho danh mục sai nếu người dùng chưa cập nhật số lượng.
- Mỗi nguồn phải được kiểm tra bằng dữ liệu thực: trường đọc được, độ trễ, dữ liệu thiếu, trùng, thay đổi mẫu và cách khôi phục khi mất kết nối.
- Các kết luận về API cần kiểm tra lại trước tích hợp/phát hành vì giá, hạn mức và điều khoản có thể thay đổi. Không giả định có API đồng nghĩa miễn phí, không giới hạn hoặc được phân phối lại dữ liệu.
- Mục 1 ghi nhận định hướng thu thập; các mục 2–21 cụ thể hóa module theo hai mức **prototype** và **bản hoàn thiện đầy đủ**. Prototype dùng dữ liệu giả để kiểm chứng; bản hoàn thiện tích hợp nguồn thực sau khi đáp ứng điều kiện dữ liệu, quyền sử dụng và bảo mật.

**Nguồn kiểm chứng tham khảo — rà soát ngày 04/10/2026:**

- [Android NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService) và [chính sách quyền SMS của Google Play](https://support.google.com/googleplay/android-developer/answer/10208820).
- [Giới hạn API lọc SMS/MMS của Apple](https://developer.apple.com/documentation/identitylookup/sms-and-mms-message-filtering) và [quyền truy cập Gmail API](https://developers.google.com/workspace/gmail/api/auth/scopes).
- [Điều kiện sử dụng SSI FastConnect](https://developers.ssi.com.vn/docs/faq/service-overview) và [dữ liệu thị trường SSI](https://developers.ssi.com.vn/docs/faq/market-data). Tài liệu công bố hiện chưa thu phí dịch vụ; quyền dùng key và hiển thị dữ liệu trong FinWeave vẫn cần xác nhận cho mô hình cụ thể.
- [Gold API: tài liệu](https://gold-api.com/docs), [bảng giá](https://gold-api.com/pricing), [điều khoản sử dụng thương mại](https://gold-api.com/terms). Có gói giá hiện tại miễn phí, nhưng phải tuân thủ điều kiện sử dụng và chống lạm dụng.
- [Bảng giá PNJ](https://www.pnj.com.vn/bgv/index.html?zone=00), [công cụ định giá OneHousing](https://onehousing.vn/cong-cu/dinh-gia) và [KiotViet Public API](https://www.kiotviet.vn/huong-dan-su-dung-kiotviet/retail-ket-noi-api/public-api/).

### 1.5. Chuẩn hóa dữ liệu — mục đích và phạm vi

Chuẩn hóa chuyển dữ liệu đã thu thập từ nhiều nguồn về cách biểu diễn thống nhất để Financial Engine có thể tính toán đúng. Phần phức tạp nhất nằm ở **định dạng thông báo/sao kê ngân hàng và ví điện tử**; tiếp theo là **đơn vị và tiền tệ của giá vàng**. Cổ phiếu và tiền mặt vẫn cần chuẩn hóa nhưng phạm vi nhẹ hơn.

| Nhóm | Nội dung cần chuẩn hóa | Kết quả mong muốn |
|---|---|---|
| Ngân hàng, ví điện tử | Mẫu thông báo, tên cột sao kê, cách viết số tiền, dấu tăng/giảm, ngày giờ và thông tin tài khoản | Một cấu trúc giao dịch chung, không phụ thuộc cách trình bày của từng ngân hàng/ví |
| Vàng | Đơn vị khối lượng, đơn vị báo giá, tiền tệ, loại vàng và độ tinh khiết | Giá và khối lượng tương thích để tính giá trị tham chiếu, có nguồn và thời điểm |
| Cổ phiếu | Mã đi cùng thị trường, đơn vị giá, tiền tệ và thời điểm cập nhật | Giá được gắn đúng tài sản, đúng đơn vị; không mặc định mọi nguồn cùng cách báo giá |
| Tiền mặt | Số tiền, tiền tệ, ngày, chiều thu/chi và ví tiền mặt | Form nhập tạo dữ liệu đúng cấu trúc ngay từ đầu; kiểm tra trước khi lưu |

Nếu không chuẩn hóa, hệ thống có thể đọc sai dấu phân cách số, nhầm thu với chi, cộng tiền khác loại hoặc nhân giá theo một đơn vị với khối lượng theo đơn vị khác. Chuẩn hóa không chứng minh dữ liệu gốc là đầy đủ hoặc đúng ngoài thực tế.

### 1.6. Cơ chế chuẩn hóa cho phiên bản đầu

1. **Giữ dấu vết đầu vào:** lưu phần dữ liệu gốc cần thiết, nguồn và thời điểm thu thập để kiểm tra lại khi trích xuất sai; không lưu toàn bộ nội dung cá nhân không liên quan.
2. **Đọc theo từng nguồn:** dùng bộ trích xuất riêng cho mẫu thông báo/sao kê hoặc ánh xạ trường API. Ghi nhận phiên bản bộ đọc để có thể truy nguyên và xử lý lại khi mẫu thay đổi.
3. **Chuyển về quy ước chung:** chuẩn hóa số tiền, tiền tệ, đơn vị, thời gian và liên kết tài khoản/tài sản.
4. **Kiểm tra trường bắt buộc:** thiếu hoặc mơ hồ về tài khoản, số tiền, tiền tệ hay chiều tiền thì đưa vào hàng chờ xác nhận; không tự điền bằng phỏng đoán. Thiếu nhóm chi tiêu vẫn có thể ghi nhận giao dịch với trạng thái chưa phân loại.
5. **Chuyển dữ liệu hợp lệ sang sổ và khâu đối soát:** dữ liệu đủ cấu trúc được dùng để kiểm tra trùng, ghép chuyển nội bộ và đối chiếu số dư trước khi tổng hợp theo trạng thái phù hợp.

**Ví dụ ngân hàng/ví:** thông báo ghi `-150,000 VND` và sao kê có cột `Ghi nợ = 150000` đều có thể được diễn giải thành số tiền `150000`, tiền tệ `VND`, chiều `ra`, gắn với tài khoản tương ứng. Quy tắc đọc dấu phân cách phải theo định dạng của nguồn, không xóa dấu một cách tùy ý. Hai bản ghi chỉ được xem là cùng giao dịch sau bước đối soát, không chỉ vì có cùng số tiền.

**Ví dụ vàng:** người dùng nhập 5 chỉ, còn nguồn báo giá theo lượng thì phải đổi khối lượng sang lượng trước khi nhân. Nếu nguồn báo giá quốc tế bằng USD trên một đơn vị khối lượng khác, cần đổi về cùng đơn vị và áp dụng tỷ giá có nguồn, có thời điểm. Chỉ điều chỉnh độ tinh khiết khi giá nguồn chưa phản ánh độ tinh khiết đó, tránh quy đổi hai lần.

Giá quốc tế đã quy đổi sang VND/chỉ vẫn là **giá tham chiếu quốc tế theo đơn vị Việt Nam**, không tự trở thành giá mua vào của SJC, PNJ hoặc DOJI. Phép quy đổi này được gọi là quy đổi **đơn vị và tiền tệ**, không phải đổi mệnh giá.

### 1.7. Quy ước chung và ranh giới với đối soát

- **Số tiền:** lưu bằng kiểu số chính xác phù hợp, luôn kèm tiền tệ; tránh số thực dấu phẩy động cho hạch toán. Giữ giá trị gốc khi có quy đổi và chỉ làm tròn theo quy tắc rõ ràng.
- **Thời gian:** phân biệt thời điểm giao dịch, ghi sổ, nhận dữ liệu và cập nhật giá; giữ múi giờ hoặc ghi rõ khi nguồn chỉ cung cấp ngày. Không tự coi thời điểm nhận thông báo là thời điểm giao dịch đã xác nhận.
- **Tài khoản/tài sản:** ánh xạ về đối tượng cụ thể trong workspace của người dùng. Không nhận diện tài khoản chỉ bằng vài số cuối nếu có nhiều tài khoản cùng khớp.
- **Nguồn gốc:** giữ nguồn dữ liệu, trường còn thiếu, giá trị thay thế và trạng thái kiểm tra. Nhận diện dữ liệu tự khai báo riêng với dữ liệu trích xuất.
- **Cấu trúc đầu ra:** tách giao dịch tiền, số dư tại thời điểm, khoản nắm giữ và giá/định giá tại thời điểm. Giá cổ phiếu/vàng tăng không phải giao dịch tiền vào.
- **Đối soát là bước riêng:** chống trùng giữa các nguồn, ghép chuyển nội bộ, liên kết hoàn tiền và so số dư tính toán với số dư tham chiếu sử dụng dữ liệu đã chuẩn hóa. Chuẩn hóa tạo đầu vào rõ nghĩa, không tự quyết định các bản ghi giống nhau là một giao dịch.
- **Cách triển khai ưu tiên:** bộ đọc theo từng nguồn, quy tắc xác định và hàng chờ xác nhận khi mơ hồ. Phiên bản đầu chưa cần AI để chuẩn hóa; bổ sung nguồn nào thì kiểm thử bộ đọc và quy tắc của nguồn đó.

### 1.8. Lưu trữ — kiến trúc SaaS tập trung

FinWeave sử dụng kiến trúc **client–server, backend tập trung và cơ sở dữ liệu đa tenant**. Backend quản lý sổ chính thức, tiếp nhận dữ liệu, chuẩn hóa, đối soát và cung cấp báo cáo cho mọi client.

**Kiến trúc ban đầu:** modular monolith, PostgreSQL, background worker và object storage cho file. Các module có ranh giới rõ nhưng chưa tách thành microservices. Worker có thể chạy thành tiến trình riêng, dùng chung codebase và quy tắc nghiệp vụ với backend.

| Thành phần | Trách nhiệm |
|---|---|
| Web / giao diện máy tính | Quản lý tài khoản, import file, khai báo tài sản, xử lý đối soát và xem báo cáo qua backend API |
| Mobile Android | Giao diện và data collector thu thập thông báo; giữ cache và hàng chờ gửi dữ liệu khi mất mạng |
| Backend API | Xác thực, phân quyền, tiếp nhận yêu cầu và thực hiện các thao tác nghiệp vụ |
| Background worker | Xử lý import, chuẩn hóa, matching, cập nhật giá và tác vụ nền có retry |
| PostgreSQL | Nguồn dữ liệu chính thức cho sổ tài chính, danh mục, liên kết nguồn và trạng thái xử lý |
| Object storage | Lưu file sao kê/tài liệu gốc cần giữ; database lưu metadata và tham chiếu nội bộ |

Local không duy trì một sổ tài chính độc lập để đồng bộ ngang hàng với server. Client đọc trạng thái chính thức từ backend; thao tác chưa gửi thành công được hiển thị riêng là đang chờ đồng bộ.

Luồng xử lý đề xuất:

```text
Client / data collector / file import
→ Ingestion API xác thực và lưu đầu vào
→ Tạo job xử lý bền vững
→ Worker chuẩn hóa và kiểm tra đối soát ban đầu
→ Ghi sổ bằng database transaction khi đủ điều kiện
→ Reporting API cung cấp dữ liệu cho client
→ Tiếp tục đối soát khi có thêm sao kê hoặc bằng chứng
```

Luồng trên mô tả trách nhiệm logic, không cấp quyền đọc bản rõ cho mọi tiến trình backend. Với dữ liệu thật, ingestion/queue bên ngoài chỉ giữ ciphertext và metadata; parser, ledger logic, đối soát, Engine và reporting nhạy cảm chạy trong vùng xử lý bảo vệ ở mục 15. Modular monolith vẫn là hướng tổ chức code; ranh giới runtime bảo mật phải tách đúng khi triển khai.

Import lớn trả `import_job_id` để client theo dõi trạng thái. Lưu đầu vào và tạo job phải bảo đảm không có bản ghi được tiếp nhận nhưng bị bỏ quên do tiến trình dừng; có thể dùng bảng job trong PostgreSQL hoặc transactional outbox nếu dùng queue ngoài. Bắt đầu bằng cơ chế đơn giản phù hợp tải thực tế, chưa cần hạ tầng phân tán phức tạp.

### 1.9. Mô hình lưu trữ và cô lập dữ liệu

Các nhóm bảng dưới đây là thiết kế sơ bộ, chưa phải schema triển khai cuối cùng:

| Nhóm bảng | Nội dung |
|---|---|
| `workspaces`, `memberships` | Tenant, thành viên và quyền truy cập |
| `financial_accounts`, `ledger_accounts` | Tài khoản hiển thị cho người dùng và hệ thống tài khoản ghi sổ nội bộ |
| `source_connections`, `import_jobs` | Kết nối nguồn, phạm vi quyền và lịch sử xử lý import |
| `source_records` | Bản ghi đầu vào, mã nguồn, thời điểm nhận, phiên bản parser và trạng thái xử lý |
| `financial_events`, `ledger_entries` | Sự kiện tài chính và các bút toán đã ghi nhận |
| `event_evidence` | Liên kết một sự kiện với nhiều bằng chứng từ thông báo, sao kê hoặc nguồn khác |
| `reconciliation_cases` | Nghi vấn trùng, chuyển tiền, hoàn tiền, thiếu dữ liệu hoặc sai lệch số dư |
| `balance_snapshots` | Số dư tham chiếu, loại số dư, tài khoản và mốc thời gian |
| `holdings`, `holding_movements` | Khoản nắm giữ và lịch sử thay đổi số lượng |
| `price_quotes` | Giá, nguồn, đơn vị, tiền tệ, thời điểm và phạm vi quyền sử dụng |
| `audit_logs` | Lịch sử thao tác, xác nhận và chỉnh sửa nghiệp vụ; không chứa API secret |

- Bảng dữ liệu riêng của khách hàng mang `workspace_id`. Backend xác định workspace từ phiên đăng nhập và kiểm tra membership, không tin workspace do client gửi mà không kiểm tra quyền. Dữ liệu tài chính phải được mã hóa ở lớp ứng dụng; quyền giải mã và nơi xử lý bản rõ tuân theo ranh giới bảo mật ở mục 15–16, không chỉ dựa vào mã hóa ổ đĩa hoặc quyền database.
- Foreign key/unique constraint phải xét tenant khi cần, ngăn liên kết giao dịch, bằng chứng hoặc tài khoản giữa hai workspace. File trong object storage cũng được truy cập qua kiểm tra quyền hoặc liên kết có thời hạn, không công khai mặc định.
- Dữ liệu giá chỉ được dùng chung giữa người dùng nếu điều kiện nguồn cho phép. Với API key cổ phiếu riêng, không tự coi dữ liệu nhận được là kho giá chung được phép phân phối lại.
- Dùng kiểu số chính xác cho tiền, số lượng và giá; giữ tiền tệ, đơn vị và quy tắc làm tròn rõ ràng.
- Mã hóa kết nối truyền dữ liệu và bảo vệ dữ liệu lưu trữ; API secret được mã hóa với cơ chế quản lý khóa riêng, không đưa vào log hoặc trả lại trong API thông thường.
- Có chính sách lưu/xóa file và nội dung gốc, sao lưu định kỳ và kiểm tra khôi phục. Không giữ vô hạn dữ liệu nhạy cảm chỉ để thuận tiện debug.

### 1.10. Ledger — ghi sổ kép ở backend

Định hướng sử dụng **double-entry ledger** cho phần ghi sổ. Giao diện vẫn cung cấp thao tác thu, chi, chuyển tiền; backend ánh xạ thành các bút toán Nợ/Có. `ledger_accounts` bao gồm tài sản, nợ phải trả, vốn/số dư đầu kỳ, thu nhập, chi phí và các tài khoản trung gian cần thiết, không chỉ ngân hàng và ví trên giao diện.

**Ví dụ cùng tiền tệ, không có phí:**

| Sự kiện | Bút toán Nợ | Bút toán Có | Tác động lên báo cáo |
|---|---|---|---|
| Chuyển 500.000 VND từ ngân hàng sang ví | Tài sản: Ví điện tử 500.000 | Tài sản: Ngân hàng 500.000 | Không tăng thu nhập hoặc chi phí |
| Thanh toán ăn uống 150.000 VND | Chi phí: Ăn uống 150.000 | Tài sản: Ngân hàng 150.000 | Ghi nhận chi phí 150.000 |

- Nhóm bút toán của một sự kiện phải cân bằng theo quy tắc tiền tệ. Không cộng trực tiếp số tiền khác tiền tệ để kiểm tra cân bằng; nghiệp vụ đổi ngoại tệ cần quy tắc tỷ giá, tài khoản chuyển đổi và làm tròn riêng trước khi hỗ trợ.
- Chỉ ghi toàn bộ nhóm bút toán hoặc không ghi gì, trong một database transaction. Không cho phép ghi một nửa sự kiện tài chính.
- Số dư được suy ra từ ledger. Bảng tổng hợp/cache phục vụ hiệu năng phải có khả năng xây lại từ ledger, không là nguồn sự thật độc lập.
- Bản nháp được sửa; bút toán đã ghi sổ được điều chỉnh bằng đảo/thay thế hoặc bút toán điều chỉnh có liên kết, giữ dấu vết. Sửa category đã ảnh hưởng tài khoản chi phí phải cập nhật sổ theo cùng nguyên tắc.
- Giá cổ phiếu/vàng mới chỉ cập nhật định giá danh mục; không tự ghi thành tiền vào. Thay đổi khoản nắm giữ và giao dịch tiền liên quan phải được liên kết khi có đủ dữ liệu, tránh tính mua tài sản thành chi tiêu sinh hoạt.

### 1.11. Đối soát giao dịch — pipeline backend

Đối soát sử dụng dữ liệu đã chuẩn hóa để xác định các bản ghi liên quan và phát hiện sai lệch. Quy tắc xác định xử lý trường hợp chắc chắn; trường hợp mơ hồ tạo `reconciliation_case` để người dùng xem xét.

#### A. Chống xử lý lặp và chống trùng giữa các nguồn

| Bài toán | Cơ chế |
|---|---|
| Client gửi lại cùng một bản ghi vì timeout/mất mạng | `idempotency_key` và unique constraint theo workspace/nguồn; cùng key nhưng payload khác phải bị phát hiện |
| Worker nhận lại cùng một job | Kiểm tra trạng thái, khóa/ràng buộc dữ liệu phù hợp; retry không tạo thêm tác động tài chính |
| Thông báo và sao kê cùng mô tả một giao dịch | Matching theo tài khoản, reference, số tiền, tiền tệ, chiều tiền, thời gian và nội dung; liên kết nhiều bằng chứng vào một sự kiện |
| Hai phía của một lần chuyển nội bộ | Transfer matching riêng; đây là hai biến động tài khoản hợp lệ, không phải hai bản ghi để xóa bớt |

Chỉ giống số tiền hoặc ngày chưa đủ để gộp. Hash nội dung hỗ trợ nhận diện đầu vào giống nhau nhưng không thay thế matching nghiệp vụ. Khi matching có nhiều ứng viên, giữ nguyên dữ liệu và yêu cầu xác nhận.

#### B. Ghép chuyển nội bộ

- Chỉ ghép các tài khoản thuộc cùng workspace và đã xác định quyền sở hữu phù hợp.
- So chiều tiền đối ứng, số tiền/tiền tệ, reference và khoảng thời gian; phí được tách riêng. Không yêu cầu số tiền hai phía bằng nhau một cách máy móc nếu có phí hoặc đổi ngoại tệ.
- Khi mới có một phía, giữ trạng thái chưa đủ bằng chứng. Nếu cần ghi sổ ngay, dùng tài khoản trung gian phù hợp; không tự ghi tăng tài khoản đích khi chưa có căn cứ.
- Khi phía còn lại được xác nhận, hoàn tất liên kết và giải quyết bút toán trung gian trong một transaction, không ghi thêm lần chuyển trùng.
- Chuyển nội bộ không được tính thành thu nhập/chi tiêu. Rút ATM liên quan tiền mặt có thể cần người dùng xác nhận phía nhận.

#### C. Đối chiếu số dư

```text
Số dư tính toán tại mốc đối chiếu
= Số dư đầu kỳ + Biến động đã ghi sổ đến mốc đó

Chênh lệch
= Số dư tham chiếu − Số dư tính toán cùng mốc
```

- Chỉ đối chiếu cùng tài khoản, tiền tệ, loại số dư và mốc thời gian. Không so số dư khả dụng với số dư ghi sổ mà bỏ qua khoản phong tỏa/pending.
- Khi lệch, tìm giao dịch thiếu/trùng, sai phí, sai mốc ghi sổ hoặc sai số dư đầu kỳ. Không tự sinh một khoản chi/thu để ép số dư khớp.
- Nếu người dùng xác nhận điều chỉnh chưa rõ nguyên nhân, lưu đúng loại điều chỉnh, lý do và dấu vết xác nhận.
- Số dư khớp không chứng minh mọi giao dịch đều đầy đủ: các khoản thiếu có thể bù trừ. Trạng thái khớp số dư và khớp từng giao dịch cần được phân biệt.

#### D. Hoàn tiền và sửa đổi từ nguồn

- Ghi hoàn tiền thành sự kiện riêng và liên kết với giao dịch gốc khi xác định được; hỗ trợ hoàn một phần và nhiều lần hoàn.
- Giữ giao dịch mua ban đầu để tính chi tiêu gộp, hoàn tiền và chi tiêu thuần riêng biệt.
- Nguồn báo sửa/hủy giao dịch phải được hiểu theo quy tắc của nguồn. Không xóa giao dịch chỉ vì nó không xuất hiện trong một lần import có phạm vi khác.
- Lưu revision và dùng cơ chế điều chỉnh ledger cho thay đổi đã xác nhận. Dữ liệu nguồn và override của người dùng được tách riêng, tránh import sau ghi đè chỉnh sửa đã chấp nhận.

### 1.12. Trạng thái, tính nhất quán và giới hạn phiên bản đầu

**Trạng thái ghi sổ và trạng thái đối soát độc lập:** một giao dịch có đủ dữ liệu có thể được ghi sổ trước khi có sao kê đối chiếu. Không buộc người dùng chờ sao kê mới xem được chi tiêu.

| Trạng thái đối soát | Ý nghĩa |
|---|---|
| Chưa đối soát | Đã có dữ liệu nhưng chưa khớp với nguồn tham chiếu |
| Cần xem xét | Có nghi vấn trùng, thiếu hoặc mâu thuẫn |
| Đã khớp | Đã khớp theo tiêu chí với nguồn cụ thể; lưu nguồn và phạm vi khớp |
| Người dùng xác nhận | Được xác nhận thủ công, không đồng nghĩa xác minh độc lập từ ngân hàng |

- Dùng optimistic concurrency/version để phát hiện hai client cùng sửa một đối tượng; không âm thầm dùng thao tác đến sau ghi đè mọi thay đổi.
- Worker xử lý theo mô hình có thể nhận lại tác vụ; idempotency và database constraint bảo đảm không tạo tác động ghi sổ lặp. Không giả định hạ tầng queue cung cấp exactly-once tuyệt đối.
- Ghi ledger, cập nhật liên kết và trạng thái nghiệp vụ liên quan phải nhất quán trong transaction. Trạng thái job và lỗi cần đủ rõ để retry hoặc xử lý thủ công.
- Cổ phiếu/vàng phiên bản đầu lấy số lượng do người dùng khai báo và giá từ API: kiểm tra được tính hợp lệ, nguồn và độ mới của giá; chưa đối soát độc lập được lượng tài sản thực sự sở hữu nếu không có thêm sao kê hoặc API danh mục.
- Phạm vi ưu tiên: chống gửi lặp, matching thông báo–sao kê, ghép chuyển nội bộ, liên kết hoàn tiền, đối chiếu số dư và màn hình xử lý nghi vấn. Mở rộng nguồn sau khi các cơ chế này đáng tin cậy.
- Nội dung mục 1.8–1.12 là định hướng kiến trúc SaaS; các mục 2–21 cụ thể hóa nghiệp vụ, giao diện và lộ trình. Với dữ liệu mã hóa, truy vấn/tính toán tài chính phải đi qua vùng xử lý được phép giải mã ở mục 15; PostgreSQL lưu sổ chính thức nhưng không được để lộ bản rõ cho DBA/Ops.

### 1.13. AI hỗ trợ quyết định — mục tiêu và phạm vi

FinWeave cung cấp **AI Agent sử dụng công cụ nghiệp vụ (tool calling)** để giúp người dùng hiểu dữ liệu tài chính, giải thích biến động và so sánh phương án theo mục tiêu cá nhân. **Financial Engine tính toán; LLM hiểu câu hỏi, lựa chọn công cụ và diễn giải kết quả.**

| Khả năng | Ví dụ | Đầu ra mong muốn |
|---|---|---|
| Hỏi–đáp tài chính | Tháng này tôi đã chi bao nhiêu? | Số liệu, kỳ phân tích và phạm vi tài khoản được tính |
| Giải thích biến động | Vì sao tháng này chi nhiều hơn? | Nhóm chi/giao dịch đóng góp vào mức thay đổi |
| Phân tích cơ cấu tài sản | Tài sản đang tập trung vào đâu? | Tỷ trọng tài sản; phân biệt tiền có thể sử dụng với tài sản khác |
| Theo dõi mục tiêu | Tôi đang chậm mục tiêu tiết kiệm bao nhiêu? | Tiến độ và chênh lệch so với kế hoạch |
| Mô phỏng | Mua laptop 25 triệu ảnh hưởng thế nào? | Tác động lên tiền dự phòng và mục tiêu theo giả định xác định |
| Đề xuất lựa chọn | Làm sao đạt mục tiêu sớm hơn? | Phương án, đánh đổi và điều kiện phù hợp ưu tiên người dùng |

Phiên bản đầu không dự đoán giá, khuyến nghị mua/bán mã cổ phiếu cụ thể, đặt lệnh hoặc tự sửa sổ tài chính. Chưa cần RAG, vector database hoặc nhiều agent; RAG chỉ được xem xét khi bổ sung nhu cầu truy xuất hợp đồng/tài liệu.

### 1.14. Lựa chọn LLM — Gemini Developer API Free Tier

**Lựa chọn hiện tại cho phát triển/demo:** Google Gemini Developer API, gói Free Tier; tạo API key qua Google AI Studio. Model khởi đầu dự kiến là `gemini-3.8-flash`, theo bảng giá đã kiểm tra ngày 04/10/2026. Phải xác nhận model còn khả dụng và có quota miễn phí trên project khi tích hợp; model ID được cấu hình, không hard-code vào nghiệp vụ.

- Backend giữ API key của ứng dụng, gọi Gemini để hiểu câu hỏi, function calling và diễn giải. Không đưa key xuống client hoặc vào log.
- Giai đoạn này không self-host LLM, không thuê GPU. Chi phí backend/database vẫn tồn tại; Free Tier chỉ liên quan chi phí LLM trong hạn mức và tính năng được miễn phí.
- Giới hạn lượt hỏi, token, số vòng tool calling, thời gian và số tác vụ đồng thời. Hạn mức nhà cung cấp áp dụng cho project theo chính sách hiện hành, không mặc định mỗi user có một quota riêng.
- Khi hết quota, thông báo thử lại sau; không tự chuyển model/dịch vụ trả phí. Dashboard và Financial Engine vẫn hoạt động khi AI không khả dụng. Cấu hình project ở Free Tier, chưa bật billing cho phương án này.
- Mỗi câu hỏi có thể phát sinh nhiều lần gọi model; theo dõi mức sử dụng thực tế để điều chỉnh hạn mức nội bộ.

**Giới hạn dữ liệu bắt buộc của lựa chọn này:** Gemini Free Tier có thể dùng nội dung để cải thiện sản phẩm; điều khoản dịch vụ miễn phí yêu cầu không gửi thông tin cá nhân, nhạy cảm hoặc bí mật. Vì vậy Agent dùng gói này chỉ hoạt động với **dữ liệu giả/tổng hợp được tạo cho demo**, không kết nối công cụ tới dữ liệu tài chính thật của khách hàng. Chỉ bỏ tên và số tài khoản, hoặc tổng hợp dữ liệu thật, chưa đủ để coi dữ liệu đó phù hợp gửi đi.

Tách workspace demo và nguồn công cụ demo khỏi dữ liệu thật; không bật Agent Free Tier cho workspace thật. Giao diện demo nhắc không nhập thông tin nhạy cảm vào chat. Trước khi mở AI cho dữ liệu thật phải đánh giá lại nhà cung cấp/gói dịch vụ hoặc self-host và điều kiện xử lý dữ liệu; đây là quyết định chưa chốt, không tự nâng cấp phát sinh phí.

Tham khảo: [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing), [function calling](https://ai.google.dev/gemini-api/docs/function-calling), [rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [điều khoản](https://ai.google.dev/gemini-api/terms). Giá, model và chính sách cần được kiểm tra lại trước phát hành.

### 1.15. Kiến trúc Agent trong backend SaaS

| Thành phần | Trách nhiệm |
|---|---|
| Chat API | Xác thực người dùng, kiểm tra quyền dùng AI và quản lý hội thoại |
| Agent Orchestrator | Điều phối model/công cụ, timeout, retry có giới hạn và ngân sách xử lý |
| LLM Provider Adapter | Kết nối Gemini hiện tại; cho phép thay model/provider mà không viết lại logic tài chính |
| Tool Registry | Khai báo công cụ, schema đầu vào/đầu ra và phạm vi quyền |
| Financial Services / Engine | Truy vấn, so sánh và mô phỏng bằng logic xác định dùng chung với dashboard |
| Conversation Store | Lưu ngữ cảnh, tham chiếu mục tiêu/kịch bản và giả định đã xác nhận |
| Execution Log & Validation | Theo dõi tool call, kết quả tham chiếu, hiệu năng, lỗi và kiểm tra đầu ra có cấu trúc |

Agent là một module của modular monolith. Model chạy tại nhà cung cấp; backend thực thi công cụ. Không cho model truy cập trực tiếp PostgreSQL, chạy SQL tùy ý hoặc tự chọn workspace. Backend xác định workspace từ phiên đăng nhập, kiểm tra quyền ở mỗi tool call và áp dụng giới hạn demo của mục 1.14.

Luồng một lượt hỏi:

```text
Câu hỏi → xác thực và kiểm tra quyền dùng AI
→ gửi ngữ cảnh tối thiểu cùng schema công cụ cho model
→ model đề nghị tool call
→ backend kiểm tra tham số/quyền rồi thực thi
→ trả kết quả có cấu trúc cho model
→ gọi thêm công cụ hoặc hỏi làm rõ nếu cần, trong giới hạn
→ trả diễn giải và dữ liệu hiển thị cho client
```

### 1.16. Công cụ nghiệp vụ và mô phỏng

| Công cụ dự kiến | Chức năng |
|---|---|
| `get_data_status()` | Dữ liệu thiếu, cũ và trạng thái đối soát |
| `get_financial_overview(period)` | Tổng quan tài chính trong phạm vi theo dõi |
| `compare_spending(period_a, period_b)` | So sánh hai kỳ và các thành phần đóng góp |
| `list_transactions(filters, cursor)` | Lấy giao dịch liên quan, có phân trang và giới hạn |
| `get_goal_progress(goal_id)` | Tiến độ, thời hạn và giả định của mục tiêu |
| `get_portfolio_exposure()` | Cơ cấu tài sản theo các chiều đã hỗ trợ |
| `simulate_purchase(scenario)` | Tác động của khoản mua tới tiền và mục tiêu |
| `simulate_savings_plan(scenario)` | So sánh các kịch bản tiết kiệm |

Kết quả công cụ có `result_id`, số liệu, tiền tệ/đơn vị, phạm vi tài khoản, kỳ phân tích, thời điểm dữ liệu, phần thiếu/chưa đối soát và giả định. LLM diễn giải các kết quả này, không tự tính số liệu tài chính thay engine.

Ví dụ câu hỏi mua laptop 25 triệu: Agent xác định mục tiêu và nguồn tiền, lấy số tiền có thể sử dụng, nghĩa vụ thanh toán đã khai báo và mức dự phòng; hỏi thông tin còn thiếu làm thay đổi kết quả; gọi engine so sánh mua ngay, mua sau hoặc giảm ngân sách. Kết quả nêu tác động và điều kiện thay vì kết luận chắc chắn rằng người dùng đủ khả năng mua.

- Mục tiêu, thời hạn, khoản bắt buộc/có thể điều chỉnh, mức dự phòng và ưu tiên do người dùng khai báo hoặc xác nhận.
- Thu nhập/chi tiêu lịch sử chỉ làm giả định tương lai khi được nêu rõ; không biến thành khoản thu/chi chắc chắn.
- Tổng tài sản không đồng nghĩa tiền sẵn có. Tài sản cần bán để lấy tiền phải được thể hiện trong giả định, không tự coi đã thanh lý.
- Người dùng có thể sửa giả định để chạy lại; mọi số tiền và thời gian dự kiến được engine tính theo mô hình đã xác định.

### 1.17. Ngữ cảnh, trình bày và quyền hạn

- Giữ ngữ cảnh hội thoại để hiểu câu tiếp nối, mục tiêu đang xét và kịch bản đã so sánh. Tóm tắt hội thoại dài khi cần, không cần vector database cho phạm vi này.
- Tách hồ sơ ưu tiên đã xác nhận khỏi suy đoán của model. Số dư, giao dịch và giá được lấy lại qua công cụ khi cần; không dùng bản tóm tắt cũ làm nguồn sự thật.
- Trình bày lời giải thích cùng thẻ số liệu/bảng phương án render trực tiếp từ kết quả backend, giả định có thể chỉnh và liên kết xem dữ liệu căn cứ.
- Thiếu dữ liệu tiền mặt thì giới hạn kết luận ở phần chi tiêu ghi nhận được. Giá mới nhưng số lượng nắm giữ cũ phải được nêu khi ảnh hưởng kết quả.
- Phiên bản đầu chỉ đọc và mô phỏng. Đề xuất ngân sách hoặc rule chỉ là bản nháp; thao tác ghi sau này cần cơ chế xem trước, xác nhận và API nghiệp vụ được phân quyền riêng.
- Nội dung giao dịch, ghi chú, file và tool output là dữ liệu, không phải chỉ thị cho Agent. Không đưa API secret hoặc thông tin không cần thiết vào prompt.
- Cô lập conversation, kết quả công cụ và cache theo workspace; kiểm tra quyền cả khi người dùng yêu cầu xem lại một kết quả cũ.
- Khi công cụ lỗi hoặc thiếu căn cứ, báo giới hạn; không tự tạo số thay thế. Kiểm tra các số được trích dẫn bằng kết quả tham chiếu khi có thể, nhưng không coi kiểm tra schema là bảo đảm toàn bộ diễn giải đúng.

### 1.18. Kiểm chứng, chi phí và hướng mở rộng AI

Trước khi mở chức năng, đánh giá bằng bộ tình huống dữ liệu giả có kết quả biết trước: chuyển nội bộ, hoàn tiền, tăng giá tài sản, thiếu dữ liệu, giả định mô phỏng, lỗi công cụ và truy cập chéo workspace.

- Đo tỷ lệ chọn đúng công cụ/tham số, độ đúng của số liệu và giải thích, thời gian phản hồi, token/lượt và số vòng gọi model.
- Kiểm tra hoạt động khi hết quota, timeout và retry; không lặp vô hạn hoặc làm các chức năng tài chính chính ngừng hoạt động theo AI.
- Ưu tiên công cụ trả dữ liệu tổng hợp; chỉ lấy chi tiết khi cần. Các câu hỏi đơn giản có thể trả bằng chức năng xác định mà không gọi model.
- Execution log lưu công cụ, thời gian, tham chiếu kết quả và lỗi với chính sách truy cập/lưu giữ phù hợp; không cần lưu suy nghĩ nội bộ của model.
- Chỉ mở rộng khi Agent trả lời đúng nghiệp vụ, biểu đạt đúng giới hạn dữ liệu và đáp ứng ngân sách. Free Tier chưa là cam kết phục vụ SaaS ở mọi quy mô.
- Insight chủ động thuộc hướng sau: backend phát hiện vượt ngân sách, chậm mục tiêu hoặc biến động bằng quy tắc; LLM diễn giải khi cần, không gọi cho mọi giao dịch. Việc gửi dữ liệu cho model vẫn phải tuân thủ mục 1.14.
- Mục 13 cụ thể hóa Agent cho prototype và bản hoàn thiện. Gemini Free Tier vẫn chỉ dùng dữ liệu giả; lựa chọn AI cho dữ liệu thật chưa được chốt và không được tự thay bằng gói trả phí.

## 2. Identity & Personal Workspace

Module xác định chủ sở hữu, phiên truy cập và phạm vi dữ liệu. Một tài khoản người dùng có workspace cá nhân; admin vận hành không là thành viên workspace khách hàng.

### Prototype

- Đăng ký, đăng nhập, đăng xuất và đặt lại mật khẩu qua luồng xác thực thử nghiệm.
- Một workspace cá nhân; chọn tiền tệ hiển thị và múi giờ.
- Workspace demo chỉ có dữ liệu giả, tách khỏi môi trường/dữ liệu thật; Agent Free Tier chỉ được truy cập demo.
- Kiểm tra quyền ở API và công cụ Agent; không lấy `workspace_id` do client gửi làm căn cứ duy nhất.
- Hiển thị phiên/thiết bị hiện tại và thao tác kết thúc phiên.

### Bản hoàn thiện đầy đủ

- Xác minh email, MFA, quản lý thiết bị và thu hồi các phiên đăng nhập; xác thực lại cho export, xóa dữ liệu và thay đổi bảo mật.
- Quản lý consent theo nguồn và quyền; không yêu cầu thông tin đăng nhập ngân hàng để đọc thông báo.
- Xuất/xóa dữ liệu qua luồng của chủ sở hữu; thông báo rõ thời hạn xử lý và vòng đời bản sao lưu.
- Khôi phục tài khoản không cho phép support impersonate hoặc tự giải mã dữ liệu. Thiết kế khôi phục khóa và thu hồi thiết bị theo mục 15.
- Chia sẻ hộ gia đình, nếu được chọn, cần quyền và khóa chia sẻ riêng; không là tính năng mặc định của workspace cá nhân.

### Trải nghiệm và tiêu chí hoàn thành

Onboarding ngắn: tạo workspace → chọn nguồn/tài sản → khai báo mốc theo dõi → xem tổng quan. Các bước có trạng thái tiến độ, quyền truy cập được giải thích đúng lúc. Kiểm thử hai workspace không thể đọc, sửa, export hoặc gọi công cụ lấy dữ liệu của nhau.

## 3. Financial Accounts

Module quản lý **tài khoản tiền và danh mục tài sản**. Tài khoản hiển thị cho người dùng khác hệ thống tài khoản kế toán nội bộ của ledger.

### Prototype

- Tạo ngân hàng, ví điện tử và ví tiền mặt; khai báo tiền tệ, số dư đầu kỳ và mốc bắt đầu theo dõi.
- Danh mục cổ phiếu: mã + thị trường, số lượng, giá vốn nếu có và ngày khai báo; giá có thể là fixture/demo.
- Danh mục vàng: loại, độ tinh khiết, thương hiệu nếu áp dụng, khối lượng, đơn vị và giá vốn; phân biệt nguồn quốc tế/nội địa.
- Hiển thị số dư tính toán và số dư tham chiếu nếu có; đánh dấu nguồn và thời điểm của từng số.
- Lưu trữ tài khoản, bật/tắt khỏi phạm vi dashboard; không xóa lịch sử ledger để ẩn tài khoản.

### Bản hoàn thiện đầy đủ

- Nguồn ngân hàng/ví đã kiểm thử, danh mục được định giá bằng API được cấp quyền; key cổ phiếu của từng người dùng.
- Theo dõi thay đổi số lượng, giá vốn, mua/bán, chia tách hoặc cổ tức bằng cổ phiếu; liên kết sự kiện tài sản với dòng tiền khi đủ dữ liệu.
- Phân biệt khai báo danh mục ban đầu với giao dịch mua mới: khai báo đang có 100 cổ phiếu không tạo 100 cổ phiếu mua và một khoản thu nhập giả.
- Tài khoản tiết kiệm và nghĩa vụ nợ/thẻ tín dụng khi mô hình ghi sổ tương ứng được hoàn thiện; gốc, lãi và phí tách riêng.
- Bất động sản/phần vốn kinh doanh theo mục 1.3: tỷ lệ sở hữu, định giá theo thời điểm, khoản vay và dòng tiền liên quan.
- Tỷ giá có nguồn/thời điểm cho giá trị tổng hợp; giữ đơn vị gốc và trạng thái chưa thể định giá nếu thiếu nguồn phù hợp.

### Trải nghiệm và tiêu chí hoàn thành

Thẻ tài khoản có tên, loại, số dư và trạng thái cập nhật; danh mục có biểu đồ cơ cấu và đường giá trị theo thời gian. Ngày cập nhật số lượng và ngày cập nhật giá luôn tách biệt. Tổng hợp không cộng trùng tiền tài khoản đầu tư, giá trị chứng khoán và tài sản đã khai báo; chưa đủ phạm vi nợ thì dùng tên **tài sản đang theo dõi**.

## 4. Data Sources & Connections

Module tiếp nhận đầu vào theo mục 1.1–1.7, quản lý quyền kết nối và job xử lý. Tự động thu thập giao dịch và tự cập nhật giá là hai khả năng khác nhau.

### Prototype

- Nhập CSV với fixture sao kê của một vài định dạng đã chọn; preview, ánh xạ cột, kiểm tra tiền tệ/ngày/chiều tiền và chọn tài khoản đích.
- Nhập tiền mặt và khai báo khoản nắm giữ bằng form có kiểm tra.
- Mô phỏng thông báo Android, API giá cổ phiếu/vàng và lỗi kết nối bằng dữ liệu giả; bộ đọc có version.
- Import theo cơ chế **validate → preview → confirm → commit**; batch prototype giới hạn kích thước và ghi toàn bộ phần đã xác nhận trong một transaction. Dòng lỗi hoặc nghi trùng không tự ghi vào sổ.
- `import_job_id`, `idempotency_key`, lịch sử import, hàng chờ gửi trên thiết bị và retry không tạo thêm giao dịch.

### Bản hoàn thiện đầy đủ

- Android collector theo quyền truy cập thông báo; chỉ đọc nguồn người dùng chọn. iPhone/web dùng import và nhập tay khi không có kênh tự động tương đương.
- Ngân hàng/ví chỉ được công bố hỗ trợ sau thử nghiệm mẫu thật. CSV ưu tiên; PDF/ảnh bổ sung theo bộ đọc đã kiểm tra. SMS/Gmail chỉ tích hợp khi đáp ứng quyền và chính sách riêng.
- Cổ phiếu: kết nối key người dùng, phạm vi đọc giá, reconnect/thu hồi và giới hạn quota. Không có quyền đặt lệnh; đồng bộ danh mục là capability riêng, không suy ra từ API giá.
- Vàng quốc tế: giá có đơn vị và timestamp; tỷ giá riêng nếu đổi USD/VND. Giá nội địa chỉ khi xác minh nguồn, sản phẩm và quyền sử dụng.
- File và payload thật được bảo vệ từ đầu vào đến vùng xử lý ở mục 15. Job/queue ngoài vùng bảo vệ chỉ chứa ID, mã lỗi và tham chiếu ciphertext.
- Import lớn dùng staging và chính sách commit rõ ràng: nếu chia lô phải thể hiện tiến độ, phần đã commit và khả năng tiếp tục; không quảng bá toàn file atomic khi thực tế commit từng lô.
- Cache giá chỉ dùng chung khi license cho phép; dữ liệu từ key cá nhân không tự trở thành kho giá chung. BĐS/kinh doanh nhận định giá/báo cáo định kỳ hoặc tích hợp riêng đã cấp quyền.

### Trải nghiệm và tiêu chí hoàn thành

Connection cards thể hiện **nguồn → loại dữ liệu lấy được → cập nhật gần nhất → cần hành động gì**. Wizard import có preview trước/sau chuẩn hóa, dòng lỗi có chỉ dẫn. Gửi lại bản ghi, mất mạng hoặc chạy lại job không làm tăng số giao dịch đã ghi sổ; disconnect dừng job tương lai nhưng giữ lịch sử theo chính sách người dùng chọn.

## 5. Transaction Ledger

Ledger giữ sự kiện tài chính và bút toán sổ kép; không đồng nhất một dòng thông báo với một giao dịch chính thức. Dữ liệu gốc, event, bút toán, bằng chứng và override được liên kết nhưng có vòng đời riêng.

### Prototype

- Sự kiện thu, chi, chuyển nội bộ, hoàn tiền, phí và số dư đầu kỳ trên dữ liệu giả.
- Nhóm bút toán Nợ/Có cân bằng cùng tiền tệ; ghi atomic, idempotency và kiểm tra ownership.
- Danh sách giao dịch, bộ lọc ngày/tài khoản/loại/nhóm/trạng thái; trang chi tiết nguồn và lịch sử.
- Sửa draft; posted được đảo/thay thế hoặc điều chỉnh có liên kết. Không ghi đè hoặc xóa bút toán lịch sử để làm số dư đẹp hơn.
- Các trạng thái tách riêng: `draft/pending/posted/reversed`, trạng thái đối soát, trạng thái phân loại và revision nguồn. Nguồn báo hủy không được tự hiểu là xóa dữ liệu.
- `reversed` là trạng thái của event; bút toán gốc đã commit vẫn tham gia tính sổ cùng bút toán đảo. Không loại bút toán gốc khỏi tổng rồi chỉ cộng bút toán đảo.

### Bản hoàn thiện đầy đủ

- Ghi sổ dữ liệu thật trong vùng xử lý được phép giải mã; PostgreSQL lưu payload nhạy cảm dạng ciphertext theo mục 15.
- Liên kết sự kiện mua/bán tài sản và biến động số lượng; tiền đầu tư không mặc nhiên là chi phí sinh hoạt.
- Khóa/version khi sửa, manual override giữ qua import lại; cập nhật ledger và liên kết cùng transaction.
- Hỗ trợ tiền tệ bổ sung khi có thiết kế FX, phí và rounding; chưa đủ mô hình thì chặn nghiệp vụ thay vì ghép tiền khác loại.
- Export do user yêu cầu, tìm kiếm/phân trang qua dịch vụ có quyền; dữ liệu giải mã không xuất hiện trong index/log dùng cho admin.

### Cấu trúc và trải nghiệm

```text
Event: workspace_id, event_id, account_refs, amount, currency,
       direction, event_type, occurred_at, booked_at,
       posting_status, reconciliation_status, category_status, version
Evidence: source_record_ids, source_reference (nếu có), parser_version
Entries: ledger_account, debit/credit, amount, currency, reversal_link
```

Đây là schema logic, không phải toàn bộ các trường được lưu bản rõ. Timeline giao dịch có icon/nhãn loại, số tiền, tài khoản và trạng thái; drawer chi tiết đi từ tác động tài chính đến bằng chứng. User không cần đọc bút toán kế toán để hiểu giao dịch.

## 6. Transfer & Refund Reconciliation

Module đối soát độc lập với parser và Financial Engine, xử lý matching bằng chứng, chuyển nội bộ, hoàn tiền và kiểm tra số dư theo mục 1.11.

### Prototype

- Chống gửi lặp và matching thông báo–sao kê bằng reference khi có; nghi trùng tạo case, không tự gộp theo số tiền/ngày.
- Gợi ý cặp chuyển trong cùng workspace, cùng tiền tệ; xác nhận/từ chối và lưu bằng chứng quyết định.
- ATM/top-up là transfer khi tài khoản đích thuộc người dùng; phí riêng, một phía thiếu giữ trạng thái chưa đầy đủ.
- Liên kết hoàn một phần/nhiều lần với khoản mua; giao dịch refund vẫn có thời điểm riêng.
- So số dư tính và số dư tham chiếu cùng mốc; khoản lệch cần giải thích hoặc điều chỉnh được user xác nhận.

### Bản hoàn thiện đầy đủ

- Matching nhiều nguồn, fee tách, giới hạn thời gian theo nguồn; mỗi quyết định có rule version và tiêu chí.
- Transfer chưa đủ hai phía có tài khoản trung gian; khi ghép phải giải quyết bút toán cũ, không cộng thêm lần chuyển.
- Cross-currency transfer chỉ sau thiết kế FX: giá trị hai phía, tỷ giá, phí và cách cân bằng sổ được lưu rõ.
- Source revisions, hủy và partial import không tự xóa giao dịch ngoài phạm vi kỳ; phục hồi khi matching sai bằng điều chỉnh có lịch sử.
- Các thao tác xác nhận song song được bảo vệ bằng version/transaction; không ghép giữa tenant.

### Trải nghiệm và tiêu chí hoàn thành

Hiển thị hai phía bằng thẻ **từ tài khoản → đến tài khoản**, phí ở dòng riêng; nghi trùng có so sánh cạnh nhau; số dư lệch dùng thanh/bridge giữa số tính và số tham chiếu. Giải thích vì sao đề xuất ghép, cho xem kết quả trước khi xác nhận. Xử lý lại không làm đổi số dư lần hai; số dư khớp và từng giao dịch khớp là hai kết quả khác nhau.

## 7. Transaction Categorization

Module gắn nhóm thu/chi để báo cáo và budget dễ hiểu. **Loại sự kiện** như transfer/refund/mua tài sản được xác định trước; category như ăn uống/di chuyển không được đổi ý nghĩa kế toán của sự kiện.

### Prototype

- Category thu/chi hệ thống, icon và tên tiếng Việt; quy tắc từ khóa trên dữ liệu giả.
- Sửa thủ công, tạo rule cá nhân, preview phạm vi ảnh hưởng và áp dụng hàng loạt có xác nhận.
- Giao dịch không chắc giữ chưa phân loại; vẫn tính số tiền hợp lệ trong tổng và hiển thị nhóm chưa phân loại.
- Override ưu tiên hơn rule, không bị import sau ghi đè; lưu nguồn quyết định và rule version.

### Bản hoàn thiện đầy đủ

- Bộ category riêng, rule có điều kiện tài khoản/merchant/nội dung, xử lý xung đột và lịch sử thay đổi.
- Chạy rule trên dữ liệu đã giải mã trong vùng bảo vệ; rule chứa từ khóa riêng của user cũng được mã hóa.
- Đổi category làm thay đổi tài khoản chi phí của ledger phải tạo điều chỉnh phù hợp, không chỉ đổi nhãn dashboard.
- Gợi ý AI chỉ được bật với dữ liệu/provider đã đáp ứng mục 13 và 15; Gemini Free Tier không nhận mô tả giao dịch thật.

### Thứ tự ưu tiên và trải nghiệm

```text
Manual override → User-approved rule → System rule
→ AI suggestion đã được phép → Uncategorized / Needs review
```

Category chips có icon, nhãn và màu nhất quán; gợi ý thể hiện căn cứ như rule nào khớp. Preview trước khi áp dụng hàng loạt; không dùng màu đơn lẻ để diễn đạt trạng thái hoặc hiển thị confidence phần trăm khi chưa được hiệu chỉnh.

## 8. Financial Engine

Module tính toán xác định, dùng chung cho dashboard, budget, goals và công cụ Agent. Phân biệt **thu–chi sinh hoạt**, **dòng tiền** và **thay đổi giá trị tài sản**.

### Prototype

- Số dư tài khoản từ các bút toán đã commit, gồm cả bút toán gốc và bút toán đảo/điều chỉnh; thu nhập, chi phí, hoàn tiền và chi tiêu thuần trên dữ liệu giả.
- Transfer nội bộ loại khỏi thu nhập/chi phí; pending hiển thị riêng, không trộn vào tổng posted.
- Danh mục bốn nhóm: ngân hàng/ví, tiền mặt, cổ phiếu và vàng; tính giá trị tham chiếu theo lượng sở hữu, đơn vị giá và FX fixture.
- Budget, tiến độ mục tiêu và mô phỏng đơn giản có giả định; tiền dành cho mục tiêu không tạo thêm tài sản.
- Mỗi kết quả có phạm vi tài khoản, kỳ, timezone, phiên bản và trạng thái dữ liệu.

### Bản hoàn thiện đầy đủ

- Tính dữ liệu thật trong vùng xử lý được quyền giải mã; aggregate/cache nhạy cảm cũng mã hóa. Không thực hiện SQL `SUM` trên ciphertext hoặc lưu số tiền bản rõ để tiện báo cáo.
- Phân tách mua/bán tài sản, vay/trả gốc, lãi, phí và thu nhập; chúng có thể thay đổi tiền nhưng không đều là thu nhập/chi phí sinh hoạt.
- Giá trị tài sản theo nguồn và timestamp, lãi/lỗ chưa thực hiện riêng; chỉ đo hiệu quả đầu tư đầy đủ khi có lịch sử dòng tiền, phí và phân phối tương ứng.
- Theo dõi nợ, BĐS và vốn kinh doanh; tính tài sản ròng **trong phạm vi khai báo** khi có đủ mô hình tài sản/nợ, không tuyên bố biết toàn bộ tài sản thực tế.
- Snapshot/report có ledger version; cache được vô hiệu hóa khi dữ liệu thay đổi và có thể xây lại. Cross-currency có policy FX, rounding và mốc quy đổi.

### Công thức và phạm vi tính

```text
Số dư tiền = Số dư tại mốc đầu kỳ + Biến động ghi sổ sau mốc đầu kỳ
Chi tiêu thuần trong kỳ = Chi phí tiêu dùng trong kỳ − Hoàn tiền được ghi nhận trong kỳ
Dòng tiền ròng của phạm vi tài khoản tiền = External cash inflows − External cash outflows
Giá trị khoản nắm giữ = Số lượng × Giá trên cùng đơn vị × Tỷ giá phù hợp nếu cần
Tài sản ròng đang theo dõi = Giá trị tài sản đang theo dõi − Nghĩa vụ nợ đang theo dõi
```

Số dư chính thức được suy ra từ toàn bộ bút toán đã commit đến mốc cần tính. Công thức đầu kỳ là cách phân rã báo cáo: phần biến động sau mốc không chứa lại posting khởi tạo/số dư đầu kỳ; bút toán gốc và đảo đều được tính theo dấu. Draft/pending chưa commit không tác động số dư.

`External` được xác định theo ranh giới tài khoản tiền đã chọn, không suy ra đơn giản từ nhãn income/expense. Mua chứng khoán có thể làm tiền giảm và tài sản khác tăng; chuyển giữa hai tài khoản tiền đều trong phạm vi không làm tổng tiền đổi. Báo cáo giải thích trường hợp tài khoản đích nằm ngoài phạm vi/không được theo dõi.

Hoàn tiền tác động dòng tiền tại ngày nhận; mặc định báo cáo chi tiêu/budget ghi giảm ở kỳ nhận. Phân tích giao dịch mua gốc có thể liên kết hoàn tiền qua nhiều kỳ nhưng không âm thầm viết lại báo cáo kỳ trước. Chi tiêu thuần của một category/kỳ có thể âm và cần được giải thích.

### Tiêu chí hoàn thành

Các phép tính lặp lại trên cùng version cho cùng kết quả. Invariant ledger, chống cộng trùng tài sản, transfer, refund qua kỳ, FX và dữ liệu thiếu có bộ tình huống kiểm chứng; số liệu dashboard và Agent cùng nguồn tính.

## 9. Dashboard & Reports

Module chuyển kết quả Financial Engine thành **bức tranh dễ đọc và có hành động tiếp theo**. Visual là yêu cầu cốt lõi: người dùng nhìn ra xu hướng, cơ cấu và vấn đề trước khi đọc chi tiết từng con số.

### Prototype

- Overview có tối đa một vài chỉ số chính: tiền theo dõi, tài sản theo dõi, chi tiêu và dòng tiền; không gộp tiền sẵn có với tài sản cần bán.
- Dashboard bốn nhóm tài sản trên dữ liệu giả, kèm trạng thái nguồn/giá/số lượng và phạm vi kỳ.
- Biểu đồ thu–chi, cơ cấu chi tiêu, tài sản, budget và goal; click biểu đồ mở giao dịch hoặc khoản nắm giữ làm căn cứ.
- Report cơ bản: thu nhập, chi tiêu theo nhóm, biến động tiền, hoạt động tài khoản và danh mục. Chế độ privacy che giá trị trên màn hình.

### Bản hoàn thiện đầy đủ

- Báo cáo dữ liệu thật được tính trong vùng bảo vệ và trả riêng cho user, có ledger/report version; không có bản dashboard tài chính cho admin.
- Bộ lọc tài khoản/tài sản/kỳ, so cùng độ dài kỳ khi tháng hiện tại chưa kết thúc; cả chênh lệch tiền và phần trăm đều có baseline.
- Diễn giải yếu tố đóng góp vào thay đổi: góp thêm/rút vốn, thu–chi và tăng/giảm giá tách riêng. Portfolio không nối đường liên tục qua khoảng không có dữ liệu như thể đã đo được.
- CSV/PDF export theo quyền chủ sở hữu, có phạm vi, nguồn và mốc dữ liệu; nội dung/report file được mã hóa, liên kết tải ngắn hạn không làm lộ bản rõ cho ops.
- Dashboard mở rộng BĐS/kinh doanh/nợ, tùy chỉnh widget và so sánh kịch bản theo khả năng Engine đã kiểm chứng.

### Hợp đồng trình bày trực quan

| Câu hỏi user cần hiểu | Visual ưu tiên | Drill-down / hành động |
|---|---|---|
| Tiền thay đổi vì đâu? | Waterfall hoặc cột thu/chi; đầu tư/vay/phí tách nhãn | Xem nhóm dòng tiền và giao dịch |
| Tôi chi nhiều vào gì? | Thanh ngang xếp theo mức chi, nhóm chưa phân loại hiện rõ | Xem giao dịch, sửa category hoặc budget |
| Tài sản tập trung ở đâu? | Stacked bar/treemap có nhãn, giá trị và tỷ trọng | Xem danh mục và nguồn định giá |
| Cổ phiếu/vàng biến động thế nào? | Sparkline/line chart theo kỳ có dữ liệu | Xem giá, lịch sử lượng sở hữu và thời điểm cập nhật |
| Tôi còn bao nhiêu budget? | Progress bar đã dùng/giới hạn; phần vượt hiện riêng | Xem khoản đóng góp và chỉnh giới hạn |
| Mục tiêu đang đi đến đâu? | Thanh tiến độ và timeline mốc dự kiến | Xem phân bổ, đổi giả định hoặc mô phỏng |
| Dữ liệu có vấn đề gì? | Status chip + số case + hành động cụ thể | Mở Review hoặc reconnect nguồn |

- Phân cấp: **kết quả chính → xu hướng/cơ cấu → giải thích → chi tiết**; bảng số là chế độ bổ sung để kiểm tra, không là toàn bộ trải nghiệm.
- Mọi biểu đồ có tiêu đề mô tả câu hỏi, đơn vị, nhãn/tooltip, legend nếu cần và bảng dữ liệu thay thế. Không dùng màu làm tín hiệu duy nhất; hỗ trợ bàn phím, trình đọc màn hình, tương phản và reduced motion.
- Không dùng biểu đồ 3D hoặc animation trang trí làm sai cảm nhận; animation chỉ phục vụ phản hồi và chuyển trạng thái.
- Không biến `unknown` thành `0`; dữ liệu thiếu/cũ hiển thị cạnh chỉ số liên quan. Giá quốc tế, tự khai báo và chưa đối soát có nhãn rõ.
- Responsive: desktop có overview và drawer drill-down; mobile ưu tiên một cột, biểu đồ phù hợp chiều rộng và quick action.

### Tiêu chí hoàn thành

Người dùng có thể xác định xu hướng chính, nhóm đóng góp lớn và một hành động tiếp theo từ overview; truy ngược một chỉ số tới dữ liệu căn cứ. Kiểm tra với tác vụ sử dụng thực tế, không chỉ đánh giá giao diện đẹp; biểu đồ và bảng dùng cùng số liệu.

## 10. Budget Management

Module giúp người dùng phân bổ và kiểm soát chi tiêu, dùng kết quả Engine thay vì tự cộng lại giao dịch.

### Prototype

- Ngân sách theo category và tháng; khai báo giới hạn và tài khoản trong phạm vi.
- Chi tiêu gộp, refund kỳ nhận, chi tiêu thuần và còn lại; phần pending hiển thị như dự kiến riêng.
- Transfer nội bộ, mua tài sản và trả gốc nợ không mặc nhiên tiêu thụ ngân sách sinh hoạt; phí/lãi có nhóm chi phù hợp.
- Cảnh báo ngưỡng người dùng chọn; giao dịch chưa phân loại hiện rõ ngoài các nhóm đã biết.
- Sửa ngân sách có xác nhận; Agent không tự cập nhật.

### Bản hoàn thiện đầy đủ

- Kỳ tuần/tháng/kỳ lương, rollover có quy tắc công khai, tổng budget và nhóm linh hoạt.
- Mô phỏng đổi phân bổ, so lịch sử cùng độ dài kỳ, gợi ý có căn cứ khi dữ liệu và AI provider được phép.
- Rule chống cộng hai lần khi budget cha/con hoặc nhiều phạm vi chồng nhau; thay category/refund làm cập nhật đúng kỳ theo policy mục 8.
- Ngân sách và aggregate mã hóa; chia sẻ chỉ khi quyền workspace đã được thiết kế.

### Trải nghiệm và tiêu chí hoàn thành

Budget cards dùng thanh tiến độ, phần vượt, số còn lại và nhịp chi theo thời gian; preview cho thấy đổi giới hạn ảnh hưởng thế nào. Khi dữ liệu thiếu, cảnh báo ngay trên budget. Hoàn tiền qua kỳ, category override và transfer không làm báo cáo ngân sách mâu thuẫn với Engine.

## 11. Goals & Financial Planning

Module theo dõi mục tiêu và mô phỏng lựa chọn theo ưu tiên của người dùng. Tiền phân bổ cho mục tiêu là phần tiền đã có được dành riêng, không phải tài sản mới.

### Prototype

- Tạo mục tiêu, số tiền, thời hạn và mức đóng góp; chọn tài khoản tiền hoặc ghi nhận phần phân bổ.
- Tổng phân bổ từ một nguồn không vượt số tiền đủ điều kiện; không cộng số dư mục tiêu thêm lần nữa vào tài sản.
- Nếu chi tiêu phát sinh làm số tiền hiện có thấp hơn phần đã phân bổ, báo thiếu hụt/cần điều chỉnh kế hoạch. Không chặn ghi nhận giao dịch đã xảy ra, tự tạo tiền hoặc âm thầm xóa phân bổ để ép khớp.
- Tiến độ, khoản còn thiếu, số tiền cần để dành mỗi kỳ và scenario tiết kiệm cố định.
- Mô phỏng mua món giá X: nguồn tiền, thời điểm mua, mức dự phòng, tác động lên mục tiêu.
- Các giả định tương lai do người dùng xác nhận; kết quả là kịch bản, không là bảo đảm đạt mục tiêu.

### Bản hoàn thiện đầy đủ

- Nhiều mục tiêu có ưu tiên, kế hoạch đóng góp và mốc thay đổi; phân bổ/giải phóng có lịch sử.
- Dòng tiền dự kiến tách phần chắc chắn đã khai báo và phần ước tính; nghĩa vụ nợ gốc/lãi được đưa vào khi có mô hình.
- So mua ngay/chờ/giảm ngân sách bằng Engine; tài sản phải bán mới có tiền cần giả định thanh lý, giá và phí riêng.
- Liên kết Agent theo quyền dữ liệu ở mục 13; user luôn xác nhận thay đổi kế hoạch. Dữ liệu mục tiêu cũng thuộc phạm vi mã hóa.

### Trải nghiệm và tiêu chí hoàn thành

Goal cards có tiến độ, timeline và số cần để dành; mô phỏng dùng input/slider, bảng phương án và đường dự kiến có nhãn giả định. Đổi một biến phải chạy Engine lại; không chỉ thay nội dung chat. Tổng tài sản không tăng khi tạo hoặc góp vào mục tiêu bằng phân bổ nội bộ.

## 12. Notifications & Alerts

Module phát hiện sự kiện bằng rule/Engine và gửi lời nhắc có thể hành động. Không cần gọi LLM cho mỗi giao dịch.

### Prototype

- In-app inbox: gần/vượt budget, cần review, lệch số dư, nguồn cũ và nhắc kiểm đếm tiền mặt.
- Ngưỡng giao dịch lớn và tần suất do user chọn; bất thường nghĩa là khác lịch sử, không kết luận gian lận.
- Dedupe cảnh báo theo sự kiện và rule version; không spam khi retry/job xử lý lại.
- Bản demo dùng dữ liệu giả; nội dung ngoài app chỉ là thông báo chung.

### Bản hoàn thiện đầy đủ

- Push/email tùy chọn, quiet hours theo timezone, digest tuần/tháng và tắt từng loại.
- Quy tắc đánh giá tài chính chạy trong vùng bảo vệ; hệ thống gửi bên ngoài chỉ nhận template chung, đích nhận và opaque event ID.
- Khóa màn hình/email mặc định không có số tiền, số dư, merchant, danh mục hay nội dung chat. Mở chi tiết cần đăng nhập và kiểm tra quyền.
- Nhắc cập nhật lượng cổ phiếu/vàng và định giá BĐS/kinh doanh theo thời gian user chọn; không tạo khuyến nghị giao dịch tự động.
- Alert resolution khi người dùng xử lý case; tỷ lệ giao gửi, retry và provider failures chỉ dùng metadata vận hành.

### Trải nghiệm và tiêu chí hoàn thành

Inbox chia nhóm mức ưu tiên với icon/nhãn, mô tả lý do và nút xử lý; thông báo dẫn tới đúng màn hình Review/Budget/Connection sau xác thực. Không lộ nội dung tài chính trong push payload, mail template hoặc log gửi.

## 13. AI Financial Assistant

Module triển khai Agent ở mục 1.13–1.18: một orchestrator, công cụ backend và LLM Provider Adapter; không cần RAG/vector database cho dữ liệu tài chính có cấu trúc.

### Prototype

- **Google Gemini Developer API Free Tier**, model dự kiến `gemini-3.8-flash` theo lần kiểm tra 04/10/2026; xác nhận model/quota trên project khi tích hợp, cấu hình model ID.
- Chỉ dùng workspace và tool data giả; UI nêu rõ không nhập thông tin nhạy cảm. Agent không có route tới nguồn tài chính thật.
- Hỏi–đáp, giải thích thu–chi và cơ cấu tài sản, tiến độ mục tiêu, mô phỏng mua sắm/tiết kiệm.
- Model đề nghị tool call; backend kiểm tra schema/quyền rồi thực thi. Engine trả số liệu, phạm vi, `result_id`, version, thời điểm, giả định và phần thiếu.
- Giới hạn token, số vòng/tool call, thời gian và quota theo user/project; hết quota báo thử lại, không tự bật billing hoặc model trả phí.

### Bản hoàn thiện đầy đủ

- Giữ API/tool contract để thay provider/model khi được chốt; **AI với dữ liệu thật là phụ thuộc chưa giải quyết**, không mặc định miễn phí.
- Chỉ bật khi điều kiện dữ liệu nhà cung cấp và ranh giới bảo mật được duyệt. Self-host, nếu chọn, chạy trong môi trường được phép thấy bản rõ; self-host trên server do Ops toàn quyền kiểm soát không tự đạt yêu cầu mục 15.
- Dữ liệu tài chính thật đã tổng hợp hoặc bỏ tên vẫn không được gửi Gemini Free Tier. Không dùng AI để lách giới hạn quyền dữ liệu.
- Context hội thoại và hồ sơ ưu tiên đã xác nhận tách khỏi số dư/giá hiện tại; kết quả mới phải lấy lại qua công cụ và conversation thật phải được mã hóa.
- Insight chủ động do rule phát hiện trước; LLM chỉ giải thích khi được phép. Không dự đoán giá, đặt lệnh, tự thay ledger/budget hoặc đưa chỉ thị đầu tư ngoài phạm vi.
- Cấu hình production data AI chưa đạt thì hệ thống vẫn cung cấp dashboard, mô phỏng xác định và insight mẫu từ Engine; không quảng bá Agent dữ liệu thật đã có.

### Trải nghiệm và tiêu chí hoàn thành

Chat kèm thẻ số liệu và biểu đồ từ Engine, nút xem căn cứ, đổi kỳ và chỉnh giả định. Insight theo cấu trúc **quan sát → căn cứ → diễn giải → phương án → giả định/giới hạn**. Các số chính render từ tool output, không để model tự tính/chép lại thành nguồn sự thật.

Bộ đánh giá gồm transfer, refund qua kỳ, tăng giá tài sản, lượng sở hữu cũ, thiếu tiền mặt, lỗi công cụ, prompt injection và truy cập chéo tenant. Agent không khả dụng không làm dừng ghi sổ hoặc báo cáo; metric gồm chọn tool đúng, tham số hợp lệ, thời gian và số lượt gọi.

## 14. Data Quality & Review Center

Module tập trung các vấn đề để **chủ dữ liệu** kiểm tra và sửa; không là màn hình vận hành dành cho admin.

### Prototype

- Hàng chờ thiếu trường bắt buộc, chưa phân loại, nghi trùng, transfer một phía, refund chưa liên kết và số dư lệch.
- Nguồn/giá cũ, pending lâu và tiền mặt chưa kiểm đếm theo kỳ đã chọn; phân biệt chưa biết với không phát sinh.
- Case có bằng chứng, đề xuất, tác động dự kiến và lựa chọn xác nhận/từ chối/bổ sung; lưu lịch sử quyết định.
- Chỉ báo theo số case và thời điểm đối soát, không tạo tỷ lệ độ chính xác hoặc bao phủ toàn bộ tài chính khi chưa biết mẫu số.

### Bản hoàn thiện đầy đủ

- Ưu tiên theo tác động đã tính trong vùng bảo vệ, loại lỗi và mức độ chắc chắn; xử lý hàng loạt có preview và version check.
- Case tái mở khi nguồn sửa dữ liệu; user biết xác nhận trước đã bị ảnh hưởng, không âm thầm ghi đè.
- Chất lượng danh mục: lượng tự khai báo cũ, thiếu giá/FX, không khớp loại vàng và định giá BĐS/kinh doanh quá hạn theo chính sách.
- Review content mã hóa; kết quả sửa đồng bộ ledger, report, budget và goal theo dependency.

### Trải nghiệm và tiêu chí hoàn thành

Trang Review ưu tiên một case có thể xử lý: so sánh hai bản ghi cạnh nhau, highlight điểm khớp/mâu thuẫn, preview số dư/report trước và sau. Phân biệt **đã khớp nguồn**, **user xác nhận** và **chưa có dữ liệu**. Một case không được giải quyết hai lần bởi hai thiết bị hoặc ảnh hưởng tenant khác.

## 15. Audit, Privacy & Security

**Yêu cầu bắt buộc:** Admin, Support, DBA và Operations không được xem nội dung tài chính của user, lấy khóa giải mã, impersonate user để đọc dữ liệu hoặc tự đổi chính sách để cấp cho mình quyền đó. Yêu cầu áp dụng cả database, file, backup, cache, báo cáo, công cụ debug và runtime thuộc quyền vận hành; không chỉ giao diện admin.

### Prototype

- Chỉ dữ liệu giả; triển khai mã hóa xác thực ở lớp ứng dụng bằng thư viện đã được kiểm chứng, không tự viết thuật toán.
- **Envelope encryption:** khóa dữ liệu (DEK) theo workspace; DEK được bọc bởi khóa quản lý (KEK) ở dịch vụ quản lý khóa tách biệt. Không để key bản rõ trong database/repository/log.
- Mã hóa payload và file, chứng minh user đọc được dữ liệu của mình nhưng role admin/DB dump chỉ thấy ciphertext; kiểm thử quyền và audit thao tác.
- Prototype giải mã trong runtime thông thường chưa chống được người toàn quyền kiểm soát runtime đó. Không dùng dữ liệu thật hoặc tuyên bố đã đạt bảo đảm cho Ops hạ tầng khi chưa hoàn thiện ranh giới bảo vệ.

### Bản hoàn thiện đầy đủ

**Hướng thiết kế để giữ backend tập trung:** một **vùng xử lý tài chính được bảo vệ (confidential computing có attestation)**, kết hợp quyền quản lý khóa và chấp thuận mã tách khỏi đội vận hành. Đây là yêu cầu kiến trúc cần làm PoC và nghiệm thu, chưa chốt nhà cung cấp/hạ tầng hoặc chi phí.

| Lớp | Cách bảo vệ |
|---|---|
| Client → vùng xử lý tài chính | Payload nhạy cảm được mã hóa tới danh tính/khóa của vùng đã xác minh; TLS bên ngoài là lớp bổ sung, gateway không kết thúc đường bảo vệ bằng bản rõ |
| PostgreSQL / object storage / backup | Ciphertext, opaque IDs và metadata tối thiểu; không lưu bản rõ số tiền, nội dung, tài sản hay tài liệu |
| Vùng xử lý tài chính | Chuẩn hóa, đối soát, ledger, tính toán, search và lập report; chỉ workload được chấp thuận nhận quyền giải mã |
| Quản lý khóa | Ràng buộc cấp khóa với attestation của workload; Admin/Ops không có quyền giải mã hoặc tự sửa policy/assume role để lấy khóa |
| Kết quả về user | Kênh xác thực/mã hóa tới thiết bị chủ sở hữu; API gateway, cache vận hành và log không nhận report bản rõ |
| Admin/Ops | Chỉ metadata đã được allowlist; không có nút xem dữ liệu, export workspace hoặc support impersonation |

- Phạm vi nhạy cảm gồm số tiền/số dư, nội dung/người gửi/nhận, khoản nắm giữ, API secret, goals, budgets, rule cá nhân, case review, file, report, conversation và tool output thật. Giá thị trường công khai được lưu tách khi license cho phép; danh sách mã user sở hữu vẫn là riêng tư.
- PostgreSQL giữ quan hệ, version và transaction trên IDs/ciphertext. Phép tính, tìm kiếm và sắp xếp theo nội dung tài chính thực hiện trong vùng bảo vệ; aggregate/index nhạy cảm lưu mã hóa, không để bản rõ để đổi lấy hiệu năng. Các index metadata được phép dùng phải nêu rõ thông tin có thể lộ.
- DEK/KEK có version, rotation, thu hồi và kế hoạch backup/khôi phục. Dùng AEAD gắn workspace, record và version làm authenticated context, nonce theo quy tắc thư viện; xử lý rollback/replay bằng cơ chế integrity/version được thiết kế riêng.
- Tách quyền vận hành máy, chấp thuận code image/client update và sửa key policy. Một operator không được tự ký workload mới hoặc cập nhật client lấy cắp dữ liệu rồi yêu cầu cấp khóa.
- Vùng bảo vệ kiểm tra bằng chứng user/thiết bị và quyền workspace; attestation chứng minh workload, không thay thế xác thực caller. Registry thiết bị, recovery và quyền ký token phải nằm trong ranh giới tin cậy hoặc có bằng chứng độc lập Ops không giả mạo được.
- Reset password, recovery, đăng ký thiết bị mới và đổi khóa không mở đường support lấy tài chính. Khôi phục do chủ sở hữu cho phép; giải thích rõ hậu quả mất khóa và cơ chế dự phòng đã chọn.
- Export chỉ do chủ dữ liệu xác thực yêu cầu; render/export nhạy cảm chạy trong vùng bảo vệ. Retry/debug/support dùng mã lỗi và tham chiếu, không gửi ảnh sao kê hoặc financial payload thật cho operator.
- Audit tài chính mã hóa và chỉ user/vùng xử lý có quyền đọc; audit vận hành có ID/mã hành động nhưng không before/after chứa nội dung tài chính. Traces, crash dumps, analytics và log proxy cũng phải được kiểm tra.
- Xóa dữ liệu/thu hồi nguồn có policy rõ cho dữ liệu chính, cache và backup; thu hồi khóa hỗ trợ giảm khả năng truy cập nhưng không thay thế toàn bộ quy trình xóa.

**Phạm vi bảo đảm:** tin cậy nền tảng confidential computing, cơ chế chấp thuận mã/khóa độc lập và thiết bị/client user đã xác minh. Không tuyên bố an toàn tuyệt đối trước một chủ thể đồng thời kiểm soát cả client, code approval, xác thực và key policy. Nếu không thiết lập được sự tách quyền này, phải thiết kế lại trust model; chưa được hạ yêu cầu thành “admin mặc định không thấy”.

### Điều kiện mở dữ liệu thật

1. DB dump, object file, backup và cache vận hành không chứa bản rõ tài chính.
2. Role Admin/Support/DBA/Ops bị từ chối truy vấn giải mã, giả mạo user, thêm thiết bị recovery hoặc tự cấp quyền khóa.
3. Workload bị sửa hoặc không có attestation hợp lệ không nhận khóa; operator không tự phê duyệt lại được. Kiểm thử client update chưa được chấp thuận, token giả và thay registry thiết bị đều không tạo đường truy cập dữ liệu.
4. Gateway, queue, proxy, logs, telemetry và đường trả kết quả không làm lộ bản rõ; phạm vi metadata còn thấy được đã ghi nhận.
5. Search/report/ledger hoạt động và giữ tính đúng trong vùng bảo vệ; backup/restore, key rotation và phát hiện rollback/replay ledger hoặc ciphertext cũ được thử thực tế.

**Nguồn thiết kế tham khảo:** [Envelope encryption — Google Cloud KMS](https://docs.cloud.google.com/kms/docs/envelope-encryption); [giới hạn bảo mật của PostgreSQL pgcrypto](https://www.postgresql.org/docs/17/pgcrypto.html); [AWS Nitro Enclaves security](https://docs.aws.amazon.com/enclaves/latest/user/security.html) và [KMS Decrypt với attestation recipient](https://docs.aws.amazon.com/kms/latest/APIReference/API_Decrypt.html); [Confidential Space security overview](https://docs.cloud.google.com/docs/security/confidential-space). Mã hóa ổ đĩa, `pgcrypto` hoặc RLS đơn lẻ không là bằng chứng đạt yêu cầu chống Admin/Ops: ranh giới runtime và quyền đổi policy cũng phải được bảo vệ.

## 16. Admin & Operations

Module quản trị **trạng thái dịch vụ**, không quản trị nội dung tài chính của khách hàng. Quyền này được cưỡng chế bởi mã hóa và ranh giới giải mã mục 15, không chỉ ẩn nút trên giao diện.

### Prototype

- Console demo: job ID, adapter/parser version, trạng thái, mã lỗi, thời gian xử lý và retry count.
- Theo dõi queue length, độ trễ API, lỗi kết nối, quota AI và số lần gọi; fixture kiểm tra việc lọc log.
- Quản lý category/rule hệ thống bằng dữ liệu tổng hợp; feature flag cho demo, audit operator.
- Thử dump DB bằng quyền vận hành không đọc được nội dung mã hóa; không cho impersonation hoặc mở raw payload.

### Bản hoàn thiện đầy đủ

- Theo dõi health của gateway, worker, database, key service và vùng xử lý; cảnh báo sự cố và khả năng phục hồi.
- Role tách biệt: Support xử lý tình trạng tài khoản/kết nối; Operations xử lý job/hạ tầng; quản trị policy/code approval có quyền riêng theo trust model, không cấp mặc định cho hai role trên.
- Retry/cancel/reprocess theo opaque job ID với policy và audit; thao tác vận hành không cho sửa số tiền hay bỏ qua invariant.
- Quản lý quota/gói SaaS và feature flags; không bật AI Free Tier cho dữ liệu thật. Billing/thu phí, nếu đưa vào product, là tích hợp riêng với consent, không dùng secret tài chính user.
- Backup/restore giữ ciphertext, chuyển version schema không cần mở nội dung; thay đổi thuật toán nghiệp vụ phải qua release được chấp thuận.
- Diagnostics gửi về support chỉ có mã lỗi, trace ID và metadata được allowlist; không đề nghị user đưa sao kê thật vào ticket nội bộ.
- Metrics tổng hợp về service có thể gồm throughput/error/latency/usage; không có tổng tài sản, merchant, prompt hay report theo user để phân tích hành vi.

### Trải nghiệm và tiêu chí hoàn thành

Operations dashboard dùng biểu đồ latency, queue và lỗi theo adapter; drill-down dừng ở metadata. Trạng thái workspace user có thể truy cập khác biệt với thông tin tài chính; mọi human access đều audit. Các tài khoản vận hành có quyền DB/hạ tầng vẫn không đọc được bản rõ trong phạm vi bảo đảm đã nghiệm thu.

## 17. Lộ trình module qua ba giai đoạn

Hai mức **prototype / bản hoàn thiện đầy đủ** mô tả độ hoàn thiện của từng module, không phải hai giai đoạn roadmap. Roadmap dưới đây có đúng ba giai đoạn; một module có thể được đặt nền ở giai đoạn 1 rồi mở rộng ở 2–3. Không suy từ lịch roadmap rằng mọi API đã được cấp quyền hoặc bảo mật đã tự đáp ứng.

### Giai đoạn 1 — Nền tảng và prototype

| Module | Deliverable |
|---|---|
| 2. Identity & Workspace | Xác thực, workspace demo, isolation và thiết bị cơ bản |
| 3. Accounts & Assets | Bốn nhóm đầu với baseline tiền/số lượng và giá giả |
| 4. Sources | CSV preview/commit, nhập tiền mặt, mock thông báo/API và job idempotency |
| 5. Ledger | Sổ kép cùng tiền tệ, posting/reversal và evidence trên dữ liệu giả |
| 6. Reconciliation | Transfer/refund/duplicate/balance fixtures và xác nhận |
| 7. Categorization | Rules, manual override và category schema |
| 8. Engine | Số dư/thu–chi/dòng tiền/định giá bốn nhóm, contract snapshot |
| 9. Dashboard | Prototype visual có drill-down và dữ liệu thiếu |
| 14. Review | Hàng chờ nghi vấn và preview thay đổi |
| 15. Security | Envelope encryption demo, isolation; PoC ranh giới xử lý và key policy |
| 16. Operations | Console metadata, logs được lọc và metric cơ bản |

**Điều kiện qua giai đoạn:** hoàn thành một vòng thu thập → chuẩn hóa → ghi sổ → đối soát → báo cáo trên dữ liệu giả; invariant tài chính được kiểm chứng và visual giải thích được số liệu. PoC bảo mật xác định được cách đáp ứng mục 15 và chi phí; không mở dữ liệu thật chỉ vì dashboard đã chạy.

### Giai đoạn 2 — Hoạt động nghiệp vụ end-to-end

| Module | Deliverable |
|---|---|
| 4. Sources | Android adapters chọn lọc, sao kê mẫu thật; thử key cổ phiếu cá nhân, nguồn vàng/FX đã kiểm tra |
| 3, 5–8 | Bốn nhóm đầu hoạt động với dữ liệu được cấp quyền, amount/units/transfer/refund và định giá đúng |
| 10. Budgets | Budget kỳ tháng, actual/refund/unclassified và cảnh báo |
| 11. Goals | Phân bổ tiền, tiến độ, mô phỏng bằng Engine |
| 12. Alerts | In-app, ngưỡng, nhắc nguồn/case, tùy chọn và thông báo ngoài app an toàn |
| 13. Agent | Gemini Free Tier chỉ demo giả; tool calling, simulation, evaluation và quota |
| 9, 14 | Dashboard/report/Review hoàn thiện luồng người dùng với dữ liệu có nguồn |
| 2, 15–16 | MFA/recovery, vùng xử lý bảo vệ, mã hóa end-to-boundary, audit và vận hành metadata |

**Điều kiện qua giai đoạn:** trước khi dùng dữ liệu thật phải qua toàn bộ gate mục 15; nếu chưa đạt, thử nguồn bằng dữ liệu giả/đã chuẩn bị an toàn. Nguồn công bố hỗ trợ có mẫu kiểm thử và quyền sử dụng; mất mạng/retry không ghi lặp. Gemini demo tuyệt đối không nhận dữ liệu thật. Budget/goals/ledger nhất quán và user xử lý được một case review.

### Giai đoạn 3 — Tối ưu và hoàn thiện product

| Module | Deliverable |
|---|---|
| 2–4. Workspace/Assets/Sources | Nguồn bổ sung đủ điều kiện, BĐS/vốn kinh doanh định kỳ, mô hình nợ và FX khi được chọn |
| 5–8. Core finance | Matching/revision phức tạp, hiệu năng protected search/report, thêm invariant cho nghiệp vụ mới |
| 9. Dashboard & Reports | Responsive/accessibility, report xuất, giải thích biến động tài sản, widget theo nhu cầu |
| 10–11. Budgets & Goals | Rollover/kỳ lương, nhiều mục tiêu, phân bổ và scenario nâng cao |
| 12. Alerts | Digest, quiet hours, chống spam và insight quy tắc |
| 13. Agent | Tối ưu tool/latency/quota; dữ liệu thật chỉ nếu chốt được lựa chọn LLM đáp ứng privacy/ngân sách |
| 14. Review | Ưu tiên case, batch actions và chất lượng danh mục |
| 15–16. Security & Operations | Rotation/recovery/restore, kiểm thử bảo mật, quan sát tải, incident và vận hành production |
| SaaS product | Onboarding, hướng dẫn, tài liệu nguồn hỗ trợ, retention và cơ chế gói/quota; billing chỉ nếu đã chọn mô hình kinh doanh |

**Điều kiện hoàn thiện:** benchmark workload FinWeave có cả API, import và worker; backup/restore, key lifecycle và failure recovery đã thử; user hiểu các biểu đồ qua tác vụ thực. Các phụ thuộc chưa được xác minh vẫn gắn trạng thái chưa phát hành, không trở thành lời hứa realtime/AI miễn phí không giới hạn.

## 18. Cấu trúc navigation gợi ý

### Prototype

Responsive web là nơi kiểm chứng các màn hình chính; app/collector Android phục vụ thu thập thông báo, không đồng nghĩa phải xây hai sản phẩm đầy đủ cùng lúc. Đây là đề xuất triển khai cần xác nhận ở mục 21.

```text
Tổng quan             — dòng tiền, tài sản, budget, mục tiêu và chất lượng dữ liệu
Giao dịch             — timeline, bộ lọc, transfer/refund và chi tiết chứng cứ
Tài khoản & Tài sản   — tiền ngân hàng/ví/tiền mặt, cổ phiếu và vàng
Kế hoạch              — Ngân sách | Mục tiêu | Mô phỏng
Trợ lý                — Agent trên workspace demo, ghi rõ dữ liệu giả
Kiểm tra dữ liệu      — case cần xác nhận, dữ liệu thiếu và đối soát
Nguồn dữ liệu         — kết nối, nhập sao kê, trạng thái đồng bộ
Cài đặt               — hồ sơ, thiết bị, quyền, privacy và phục hồi
```

Trên mobile, rút navigation chính còn `Tổng quan / Giao dịch / Tài sản / Kế hoạch / Thêm`; các màn còn lại nằm trong `Thêm`. Quick action `Ghi tiền mặt` và `Nhập dữ liệu` dễ tiếp cận nhưng không chiếm thêm tab. Badge Review chỉ báo số case cần người dùng xử lý; không dùng badge đỏ cho mọi thông báo.

### Bản hoàn thiện đầy đủ

- Giữ cấu trúc lõi, bổ sung `Báo cáo` trong Tổng quan và các loại tài sản/nợ đã được hỗ trợ trong Tài khoản & Tài sản; không tạo một sidebar riêng cho từng API.
- Mọi biểu đồ drill-down tới cùng màn Giao dịch, Tài sản hoặc Review với bộ lọc tương ứng. Back navigation giữ kỳ thời gian/bộ lọc để người dùng không mất ngữ cảnh.
- Trợ lý trên workspace thật chỉ xuất hiện khi đáp ứng điều kiện mục 13; nếu chưa đáp ứng, hiển thị phân tích bằng Engine/rules và demo tách biệt, không giả vờ AI đang đọc dữ liệu thật.
- Console Admin/Ops là bề mặt quản trị riêng với role/session riêng, không phải một tab cho phép chuyển sang workspace tài chính của user. Dùng chung branding không có nghĩa dùng chung quyền truy cập.
- Ưu tiên progressive disclosure: màn tổng quan trả lời câu hỏi chính, chi tiết kỹ thuật/nguồn nằm ở drawer hoặc màn chi tiết. Bảo đảm keyboard, screen reader, contrast và chế độ ẩn số tiền theo mục 9.

## 19. Luồng dữ liệu tổng quát

### Luồng giao dịch

1. **Thu thập:** thông báo ngân hàng/ví, sao kê hoặc nhập thu–chi tiền mặt. Prototype dùng fixture/mock; nguồn thật chỉ bật sau các gate dữ liệu và bảo mật.
2. **Tiếp nhận:** nguồn đầu vào được đóng gói với source ID, import/job ID và provenance. Với dữ liệu thật, mã hóa trước khi đi qua gateway/queue/lưu trữ ngoài vùng xử lý bảo vệ; nguồn cần polling được truy cập từ bên trong vùng đó.
3. **Chuẩn hóa trong vùng bảo vệ:** parser xác định tài khoản, số tiền, tiền tệ, thời gian, nội dung, reference và người gửi/nhận nếu nguồn có. Giữ bằng chứng nguồn, phiên bản parser và trường chưa xác định; không tự bịa giá trị thiếu.
4. **Xử lý nghiệp vụ:** idempotency và deduplication; xác định loại sự kiện/category; tạo hoặc cập nhật case transfer/refund/balance. Kết quả chưa chắc chắn vào Review; không chờ đối soát hoàn hảo mới ghi nhận mọi giao dịch hợp lệ.
5. **Ghi sổ:** posting cân bằng, source mapping và thay đổi trạng thái được commit theo transaction DB. Dữ liệu nghiệp vụ được mã hóa trước khi lưu PostgreSQL/object storage; retry không tạo thêm posting. Sửa posted event bằng reversal/adjustment có dấu vết.
6. **Tính toán:** Financial Engine trong vùng bảo vệ đọc phần dữ liệu được phép, tính số dư/thu–chi/dòng tiền/budget/goals và tạo snapshot có version, kỳ, nguồn và độ đầy đủ. Đối soát hoặc chỉnh sửa phát sinh sẽ làm snapshot liên quan hết hiệu lực rồi tính lại.
7. **Hiển thị:** trả kết quả mã hóa tới client đã xác thực của user; client trình bày biểu đồ/cards và drill-down. Dashboard, báo cáo, budget, goals và cảnh báo cùng dựa trên contract số liệu của Engine.

### Luồng tài sản và định giá

```text
User khai báo sở hữu                 Nguồn giá được cấp quyền
mã/loại, số lượng, đơn vị, giá vốn    cổ phiếu / vàng / FX + timestamp
               \                    /
                Chuẩn hóa và kiểm tra
                          |
          Financial Engine: định giá theo thời điểm
                          |
      Snapshot tài sản + nguồn giá + độ mới/độ đầy đủ
                          |
              Dashboard / Reports / Goals
```

Giá thị trường thay đổi **không tự tạo một khoản thu/chi trong Ledger**. Số lượng sở hữu thay đổi cần nguồn giao dịch sở hữu hoặc thao tác khai báo/điều chỉnh có ngày và căn cứ; market API không tự biết user đã mua/bán. BĐS và vốn kinh doanh ở bản đầy đủ đi vào nhánh định giá bằng valuation định kỳ có căn cứ, không giả định có giá realtime. Khi có giao dịch mua/bán/vốn góp thật, liên kết sự kiện tài sản với dòng tiền để tránh đếm hai lần.

### Nhánh AI và ranh giới vận hành

- UI → Agent orchestrator → tools có whitelist và workspace authorization → Engine/simulation → kết quả có bằng chứng → UI. AI là một consumer hỗ trợ giải thích, không phải bước bắt buộc giữa Engine và Dashboard.
- Gemini Free Tier chỉ nhận dữ liệu giả từ workspace demo tách biệt. Nhánh Agent dùng dữ liệu thật chưa được bật cho tới khi chọn được phương án LLM đáp ứng điều kiện mục 13 và 15; không đưa snapshot thật ra provider chỉ vì đã bỏ tên user.
- Gateway, worker điều phối, Admin/Ops, backup và log ngoài vùng bảo vệ chỉ giữ ciphertext/metadata tối thiểu. Mọi nơi cần plaintext tài chính — parser, ledger logic, search, Engine, alert và AI tools — phải nằm trong ranh giới đã kiểm chứng; client user là nơi hiển thị plaintext được phép.
- Khi lỗi: giữ trạng thái job/case có mã lỗi an toàn; UI chỉ rõ nguồn nào chưa cập nhật. Không thay lỗi API bằng giá 0, không âm thầm dùng snapshot cũ như dữ liệu mới.

## 20. Giá trị khác biệt đề xuất

> FinWeave biến dữ liệu tài chính phân tán thành một bức tranh trực quan, có thể truy ngược và kiểm tra: user hiểu tiền đang ở đâu, vì sao biến động, kế hoạch còn khả thi hay không, đồng thời dữ liệu tài chính không lộ cho đội vận hành.

Đây là **đề xuất giá trị cần kiểm chứng**, không phải tuyên bố đã có ưu thế thị trường hoặc đã triển khai xong bảo mật.

| Trụ cột | Cách thể hiện trong sản phẩm | Điều kiện chứng minh |
|---|---|---|
| Hợp nhất nhưng trung thực | Bốn nhóm đầu chung một workspace; tiền, sở hữu và định giá tách rõ; BĐS/vốn kinh doanh khi đủ điều kiện | Công bố phạm vi, nguồn hỗ trợ, ngày giá và dữ liệu thiếu; không hứa tracking 90% mọi tài sản khi chưa có căn cứ |
| Trực quan và hành động được | Biểu đồ dòng tiền/tài sản, budget progress, goal timeline, comparison và drill-down | User trả lời được câu hỏi tài chính thực qua tác vụ thử nghiệm; không chỉ đánh giá màn hình đẹp |
| Số liệu có thể giải thích | Chứng cứ nguồn, posting, matching và snapshot version; Review cho user sửa có preview | Từng con số tổng hợp truy tới được dữ liệu đầu vào và công thức; sửa dữ liệu tạo thay đổi nhất quán |
| Quyền riêng tư trước vận hành | Mã hóa dữ liệu và vùng xử lý bảo vệ, Ops chỉ metadata | Vượt gate mục 15, kể cả runtime/key/auth; không dùng riêng disk encryption để tuyên bố Admin không thấy |
| Hỗ trợ quyết định có căn cứ | Engine tính scenario; Agent trình bày giả định, nguồn và lựa chọn | Prototype chứng minh trên dữ liệu giả; AI thật chỉ phát hành khi đáp ứng privacy và ngân sách |

Chi phí được tối ưu bằng phạm vi adapter chọn lọc, modular monolith và đo workload thực. Không đánh đổi điều kiện bảo mật để đạt một mức giá server định trước; free tier/API cá nhân là phụ thuộc có quota và quyền sử dụng, không phải cam kết dữ liệu/AI miễn phí vô hạn.

## 21. Những quyết định cần brainstorm tiếp

### Định hướng đã làm rõ, không cần mở lại từ đầu

- SaaS có backend trung tâm, hướng modular monolith, PostgreSQL + worker + object storage; client không giữ một Ledger độc lập cạnh tranh với server.
- Bốn nhóm khởi đầu là ngân hàng/ví, tiền mặt, cổ phiếu và vàng; BĐS/vốn kinh doanh là mở rộng của bản đầy đủ.
- Cổ phiếu dùng key cá nhân từ provider hỗ trợ, ưu tiên quyền đọc; user khai báo holdings khi chưa có API holdings. Vàng phải đúng loại/đơn vị/tiền tệ và phân biệt giá quốc tế với giá trong nước.
- Agent gọi tools của Engine, chưa cần RAG; Gemini Free Tier chỉ dùng workspace giả. Hiện chưa có phương án miễn phí đã xác nhận phù hợp với dữ liệu tài chính thật.
- Mã hóa ngăn Admin/Ops đọc dữ liệu tài chính là yêu cầu bắt buộc; bản đầy đủ chưa được xử lý dữ liệu thật trước khi vượt gate bảo mật. Hai mức module và roadmap ba giai đoạn giữ như mục 17.

### Quyết định còn mở và cách kiểm chứng

| Ưu tiên | Quyết định cần chốt | Vì sao quan trọng / cách kiểm chứng |
|---|---|---|
| Trước dữ liệu thật | Vùng xử lý bảo vệ dùng công nghệ/provider nào; ai giữ quyền key policy và phê duyệt workload/client? | PoC encrypted ingress/egress, attestation và chi phí; thử DBA/root Ops, workload sửa đổi, auth/recovery giả mạo theo mục 15. Nếu ngân sách không đủ, chưa mở dữ liệu thật thay vì hạ yêu cầu âm thầm |
| Trước dữ liệu thật | Recovery của user, đăng ký thiết bị và khóa mất/hỏng được giải quyết ra sao? | Thử mất thiết bị, mất yếu tố xác thực, mất key và restore; recovery không tạo đường cho support/admin đọc dữ liệu |
| Trước tích hợp | Ngân hàng/ví nào được hỗ trợ đầu tiên, trên Android hay cả iOS? | Thu thập mẫu có quyền sử dụng, kiểm tra permission và format thay đổi; chọn ít adapter có test tốt, sao kê là fallback. Không mặc định iOS có quyền đọc thông báo của app khác |
| Trước tích hợp | Provider cổ phiếu, quyền dùng key cá nhân, quota/phí và quyền sử dụng dữ liệu trong SaaS? | Xác minh tài liệu/điều khoản và tài khoản thử; SSI là ứng viên, chưa coi mọi user hay thị trường đều được miễn phí/realtime |
| Trước định giá | Nguồn vàng trong nước/quốc tế, FX, tần suất refresh và loại giá dùng để định giá? | Kiểm tra đơn vị, purity, timestamp, buy/sell, license và dữ liệu stale; quyết định UI hiển thị giá tham chiếu hay giá thanh lý ước tính |
| Trước thiết kế UX | Người dùng đầu tiên và ba câu hỏi họ cần trả lời hằng tuần là gì? | Phỏng vấn/thử tác vụ để ưu tiên cash flow, budget hay portfolio; xác định thời gian tìm hiểu, tỷ lệ xử lý Review và khả năng hiểu biểu đồ |
| Trước chốt prototype | Bài nộp cần modelling, clickable prototype hay ứng dụng demo chạy được? Responsive web-first có phù hợp? | Chốt deliverable và thiết bị đánh giá; tách collector Android khỏi dashboard để tránh trải rộng công việc |
| Trước mở rộng nghiệp vụ | Có đưa thẻ tín dụng, khoản vay, lãi/phí, tiền tệ khác và tiền gửi vào đợt vận hành đầu không? | Test định nghĩa dòng tiền/thu–chi/net worth và Ledger; nếu chưa hỗ trợ nợ phải ghi rõ tài sản thuần chưa đầy đủ |
| Trước mở rộng tài sản | Giá BĐS/phần vốn kinh doanh có nguồn nào, định kỳ bao lâu, sở hữu và khoản nợ liên kết thế nào? | Chốt schema valuation có căn cứ và ngày; tránh nhầm tài sản thuần với giá bán doanh nghiệp, tránh double-count khoản vay/vốn góp |
| Trước AI thật | Với yêu cầu free, có phương án LLM nào vừa đủ quota vừa cho phép dữ liệu nhạy cảm và đáp ứng privacy? | Xác minh terms tại thời điểm dùng. Nếu chưa có, giữ Agent demo và Engine/rules cho dữ liệu thật; self-host cũng phải giải quyết plaintext runtime, không chỉ bỏ API bên ngoài |
| Trước tối ưu tải | Stack backend, worker/queue và lịch refresh nào phù hợp ngân sách đã gồm hạ tầng bảo mật? | Benchmark API/import/Engine/crypto với workload FinWeave; không suy số user từ bài benchmark một server $12 hoặc ngôn ngữ riêng lẻ |
| Trước phát hành | Chỉ số giá trị, onboarding, quota và mô hình SaaS cần gì? | Đo activation, thời gian ra insight, xử lý dữ liệu thiếu, retention và chi phí/workspace; chốt billing khi thực sự chọn mô hình thương mại |

Ưu tiên chốt **bảo mật + nguồn dữ liệu có quyền sử dụng + nhu cầu user** trước khi thêm nhiều tính năng. Những điểm đã có đề xuất nhưng chưa kiểm chứng phải được ghi là giả định/PoC, không biến thành cam kết sản phẩm.
