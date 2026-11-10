# FinWeave — Đặc tả ca sử dụng hoàn thiện

Ngày đối chiếu: 28/10/2026. Phạm vi: 9 hình người dùng cung cấp + PRD/SRS/AI-SPEC + mã nguồn hiện có. **50 ca chi tiết và 7 ca tổng quan.**

## Quy ước áp dụng cho mọi ca

Đây là đặc tả hành vi sản phẩm để hoàn thiện mô hình; một ca xuất hiện trong sơ đồ không đồng nghĩa đã triển khai hoặc nghiệm thu. Bằng chứng hiện trạng nằm ở [phần kiến trúc](03-system-architecture.md). Bảy UC-SYS là tóm tắt, không phải bảy giao dịch thực thi độc lập.

- **CF-01 — validation/cancel:** chỉ rõ trường lỗi, giữ input; hủy trước confirm không commit. Observation hoặc draft đã được lưu trước đó có thể còn; phải nêu rõ trong từng ca.
- **CF-02 — lỗi/kết quả chưa rõ:** offline/timeout không trở thành số 0 hoặc thành công. Sau confirm bị timeout, tra outcome hoặc retry cùng idempotency key và payload; không tạo lệnh mới để né kết quả chưa biết.
- **CF-03 — quyền:** kiểm actor/workspace/object/device phía server cho từng thao tác; hết phiên/thu hồi thì chặn đọc/ghi mới và xóa cache nhạy cảm theo policy.
- **CF-04 — version:** stale/conflict cần reload, xem diff và preview lại; phản hồi cũ không đè dữ liệu mới. Double submit không nhân hiệu lực.
- **CF-05 — atomicity và nguồn gốc:** thay đổi liên quan commit/rollback cùng transaction; giữ version/history/provenance. Không giữ transaction DB xuyên lời gọi provider/model.

Các số hiệu AC trỏ về bộ yêu cầu hiện có, không tạo thêm AC nghiệm thu mới chỉ vì tách ca. Trường “Quy tắc” là bổ sung cho CF-01…05. Với ca đọc thuần, không áp đặt confirm hoặc idempotency ghi.

## Các ca tổng quan

### UC-SYS-01 — Thiết lập, tài khoản và tiền mặt

- **Tác nhân:** Chủ workspace; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-SET-01, UC-BANK-01, UC-CASH-01, UC-CASH-02, UC-CASH-03, UC-ACC-02.

### UC-SYS-02 — Ghi nhận, thu nạp và giao dịch

- **Tác nhân:** Chủ workspace; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-MONEY-01, UC-TXN-01, UC-TXN-02, UC-IMPORT-01, UC-CAPTURE-01, UC-INGEST-03, UC-SYNC-01, UC-SOURCE-01.

### UC-SYS-03 — Tài sản đầu tư và giá thị trường

- **Tác nhân:** Chủ workspace; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-STOCK-01, UC-GOLD-01, UC-HOLD-01, UC-BUY-01, UC-PRICE-01, UC-REVIEW-02.

### UC-SYS-04 — Báo cáo, tổng quan và rà soát

- **Tác nhân:** Chủ workspace; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-OVERVIEW-01, UC-REPORT-01, UC-DRILL-01, UC-INSIGHT-01, UC-REVIEW-01, UC-RESOLVE-01, UC-EVIDENCE-01, UC-UX-01.

### UC-SYS-05 — Kế hoạch, mục tiêu và mô phỏng

- **Tác nhân:** Chủ workspace; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-PLAN-01, UC-PLAN-02, UC-GOAL-01, UC-GOAL-02, UC-GOAL-03, UC-SIM-01, UC-FORECAST-01.

### UC-SYS-06 — Trợ lý thông minh và Agent

- **Tác nhân:** Chủ workspace; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-AI-01, UC-AI-02, UC-AGENT-01, UC-AGENT-02, UC-DRAFT-APPLY-01.

### UC-SYS-07 — Quản trị vận hành

- **Tác nhân:** Quản trị viên ứng dụng; tác nhân ngoài theo sơ đồ tổng quan.
- **Mục tiêu/kích hoạt:** người dùng mở nhóm chức năng để thực hiện mục tiêu nghiệp vụ tương ứng.
- **Tiền điều kiện:** đúng danh tính, workspace/quyền và các điều kiện riêng của ca con.
- **Luồng chính:** (1) mở nhóm chức năng; (2) chọn ca con; (3) thực hiện luồng và nhận kết quả theo đặc tả ca con.
- **Ngoại lệ:** CF-01…05 và các nhánh ca con.
- **Hậu điều kiện:** theo ca được thực hiện; mở nhóm chức năng không tự ghi tiền.
- **Ca chi tiết:** UC-ADMIN-AUTH-01, UC-ADMIN-01, UC-OPS-01, UC-OPS-02, UC-OPS-03, UC-OPS-04.

## Dùng chung — Xác thực và phiên dùng chung

### UC-AUTH-01 — Đăng ký và xác minh tài khoản

**Tác nhân:** Người dùng chưa đăng nhập; dịch vụ email.

**Mục tiêu:** Có danh tính chủ workspace đã xác minh.

**Kích hoạt:** Chọn Đăng ký.

**Tiền điều kiện:** Chưa có phiên owner; kênh xác minh khả dụng.

**Luồng chính:**

1. Người dùng nhập email, mật khẩu và xác nhận mật khẩu.
2. Hệ thống kiểm tra dữ liệu, tạo yêu cầu xác minh và gửi mã qua kênh email.
3. Người dùng nhập mã; hệ thống kiểm thời hạn, số lần thử và mục đích mã.
4. Hệ thống hoàn tất danh tính/phiên theo giao thức và dẫn tới tạo hoặc chọn workspace.

**Luồng thay thế/ngoại lệ:**

- A1. Email đã tồn tại: phản hồi theo chính sách chống dò tài khoản.
- A2. Mã sai/hết hạn hoặc gửi quá nhiều: cho thử lại/gửi lại trong giới hạn; không mở phiên đã xác minh.
- A3. Email thực chưa cấu hình: báo chưa thể hoàn tất; mail sink local chỉ là công cụ thử.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Danh tính hợp lệ được tạo; chưa có tài khoản tiền hoặc bút toán do đăng ký.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** CF-01…05.

**Truy vết:** REQ-SURFACE-01; SRS NFR identity; identity-access-design.md.

### UC-AUTH-02 — Đăng nhập chủ workspace

**Tác nhân:** Chủ workspace; dịch vụ email.

**Mục tiêu:** Truy cập đúng workspace bằng danh tính hợp lệ.

**Kích hoạt:** Chọn Đăng nhập.

**Tiền điều kiện:** Danh tính đã đăng ký; browser/native dùng đúng loại credential.

**Luồng chính:**

1. Chủ workspace nhập thông tin đăng nhập.
2. Hệ thống kiểm credential và yêu cầu challenge theo giao thức/kênh hiện hành.
3. Người dùng hoàn tất challenge; hệ thống cấp phiên có phạm vi.
4. Người dùng chọn workspace; hệ thống tải dữ liệu được phép và phiên bản hiện hành.

**Luồng thay thế/ngoại lệ:**

- A1. Sai thông tin, khóa/tạm chặn hoặc challenge hết hạn: không cấp phiên.
- A2. Thiết bị native chưa chứng minh danh tính: không dùng đăng nhập demo thay enrollment.
- A3. Chưa có workspace: chuyển UC-SET-01; không tự đọc workspace khác.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Phiên owner có hiệu lực đúng phạm vi; không thay đổi số dư.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** CF-01…05.

**Truy vết:** REQ-SURFACE-01 / AC-29; identity-access-design.md.

### UC-AUTH-03 — Khôi phục mật khẩu

**Tác nhân:** Chủ tài khoản; dịch vụ email.

**Mục tiêu:** Khôi phục truy cập qua kênh đã xác minh.

**Kích hoạt:** Chọn Quên mật khẩu.

**Tiền điều kiện:** Có email tiếp nhận yêu cầu; không yêu cầu phiên đang đăng nhập.

**Luồng chính:**

1. Người dùng gửi yêu cầu khôi phục bằng email.
2. Hệ thống phản hồi theo chính sách chống dò và phát challenge có thời hạn nếu phù hợp.
3. Người dùng cung cấp mã/token và mật khẩu mới.
4. Hệ thống xác minh mục đích, cập nhật credential, thu hồi phiên theo chính sách và yêu cầu đăng nhập lại.

**Luồng thay thế/ngoại lệ:**

- A1. Token sai, hết hạn hoặc dùng lại: từ chối; không đổi mật khẩu.
- A2. Không truy cập được email: áp dụng recovery protocol được duyệt; app-admin không được tự nhập vai owner.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Mật khẩu đổi một lần khi hợp lệ; credential cũ bị xử lý đúng chính sách.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** CF-01…05.

**Truy vết:** identity-access-design.md; NFR-07/19.

### UC-AUTH-04 — Quản lý phiên, thiết bị và đăng xuất

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Kiểm soát nơi đang truy cập và thu hồi quyền.

**Kích hoạt:** Mở Phiên/Thiết bị hoặc chọn Đăng xuất.

**Tiền điều kiện:** Có phiên hợp lệ; thao tác nhạy cảm có thể cần xác thực lại.

**Luồng chính:**

1. Hệ thống liệt kê phiên và thiết bị của chính người dùng với metadata tối thiểu.
2. Người dùng chọn đăng xuất, thu hồi phiên hoặc thu hồi thiết bị.
3. Hệ thống yêu cầu xác nhận/xác thực lại nếu cần và thu hồi credential tương ứng.
4. Client xóa cache nhạy cảm và dừng tác vụ mới; hàng đợi native không được chuyển sang owner khác.

**Luồng thay thế/ngoại lệ:**

- A1. Thiết bị offline: server vẫn chặn lần truy cập sau; không khẳng định đã xóa vật lý dữ liệu ở thiết bị.
- A2. Thu hồi phiên hiện tại: điều hướng về đăng nhập.
- A3. Timeout: kiểm tra kết quả trước khi phát yêu cầu mới.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Quyền bị thu hồi đúng phạm vi; lịch sử tài chính vẫn tồn tại.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** CF-01…05.

**Truy vết:** REQ-SURFACE-01 / AC-29; REQ-SYNC-01 / AC-33.

## Phân hệ 1 — Thiết lập, tài khoản và tiền mặt

### UC-SET-01 — Thiết lập mốc theo dõi và thông số

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Thiết lập mốc, tiền tệ và múi giờ nhất quán.

**Kích hoạt:** Khởi tạo workspace hoặc mở Thiết lập.

**Tiền điều kiện:** Phiên owner hợp lệ; scope workspace rõ.

**Luồng chính:**

1. Hệ thống hiển thị mốc theo dõi, VND và múi giờ nghiệp vụ.
2. Người dùng nhập mốc theo dõi và thông số được hỗ trợ.
3. Hệ thống kiểm hợp lệ, giải thích số dư đầu kỳ khác thu nhập; nếu đã có dữ liệu thì xem trước tác động.
4. Người dùng xác nhận; hệ thống lưu phiên bản thiết lập và áp dụng cùng mốc cho các màn hình.

**Luồng thay thế/ngoại lệ:**

- A1. Mốc sai hoặc không được hỗ trợ: giữ nhập liệu và chỉ rõ lỗi.
- A2. Đổi mốc sau khi có dữ liệu: không tự ghi thêm opening; cần kiểm tác động trước xác nhận.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Workspace có cấu hình phiên bản mới; không sinh thu nhập.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-01/03/04/19; CF-01…05.

**Truy vết:** REQ-SET-01 / AC-01.

### UC-BANK-01 — Tạo và quản lý tài khoản ngân hàng/ví

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Theo dõi từng tài khoản tiền độc lập.

**Kích hoạt:** Chọn Thêm/Sửa tài khoản ngân hàng hoặc ví.

**Tiền điều kiện:** Đã có workspace và mốc; nguồn tiền thuộc owner.

**Luồng chính:**

1. Người dùng chọn loại ngân hàng/ví, nhập tên và thông tin định danh cần thiết.
2. Người dùng khai báo số dư đầu kỳ và ngày, hoặc chọn chưa biết số dư.
3. Hệ thống kiểm dữ liệu, hiển thị nguồn tự khai báo và tác động opening.
4. Người dùng xác nhận; hệ thống lưu tài khoản và opening hợp lệ trong một giao dịch; sửa metadata giữ lịch sử.

**Luồng thay thế/ngoại lệ:**

- A1. Bỏ số dư: lưu unknown, không coi bằng 0.
- A2. Số 0 được nhập rõ là số dư đã khai báo; không bắt tạo ledger line bằng 0.
- A3. Trùng tên: cảnh báo, không tự gộp; đổi opening đã ghi phải qua quy trình điều chỉnh có dấu vết.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Tài khoản có ID riêng; opening chỉ có hiệu lực một lần và không là income.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-02/04/09/20/45.

**Truy vết:** REQ-BANK-01 / AC-02.

### UC-CASH-01 — Tạo và quản lý ví tiền mặt

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Theo dõi tiền mặt tự khai báo tách khỏi kiểm đếm.

**Kích hoạt:** Chọn Thêm/Sửa ví tiền mặt.

**Tiền điều kiện:** Workspace và mốc đã thiết lập.

**Luồng chính:**

1. Người dùng nhập tên ví, ngày và số dư tự khai báo hoặc trạng thái chưa biết.
2. Hệ thống kiểm dữ liệu và xem trước số dư đầu kỳ.
3. Người dùng xác nhận; hệ thống tạo ví cùng opening hợp lệ.
4. Hệ thống hiển thị số tính toán và trạng thái chưa kiểm đếm riêng.

**Luồng thay thế/ngoại lệ:**

- A1. Số dư chưa biết: không tổng hợp thành số 0 đã xác minh.
- A2. Sửa tên không đổi tiền; bổ sung opening cần kiểm phiên bản và ghi một lần.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Ví tiền mặt có nguồn tự khai báo; chưa có observation kiểm đếm.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-02/04/14/45.

**Truy vết:** REQ-CASH-01 / AC-03.

### UC-CASH-02 — Kiểm đếm và đối soát tiền mặt

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Phát hiện chênh lệch giữa số đếm và số tính cùng thời điểm.

**Kích hoạt:** Chọn Kiểm đếm tiền mặt.

**Tiền điều kiện:** Ví active; số tính có baseline và snapshot; thời điểm/đơn vị so sánh tương thích.

**Luồng chính:**

1. Người dùng nhập số đếm và thời điểm kiểm đếm.
2. Hệ thống lưu observation và so với số tính tại cùng mốc.
3. Hệ thống hiển thị chênh lệch cùng căn cứ, chưa thay đổi ledger.
4. Người dùng kiểm tra nguyên nhân; nếu có khoản quên thì ghi qua UC-MONEY-01, hoặc lựa chọn điều chỉnh qua UC-CASH-03.

**Luồng thay thế/ngoại lệ:**

- A1. Số đếm 0 hợp lệ.
- A2. Thiếu baseline hoặc lệch thời điểm: không đưa ra chênh lệch giả.
- A3. Chưa rõ nguyên nhân hoặc hủy xử lý: observation có thể giữ, tiền không tự đổi.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Có biên bản kiểm đếm; ledger chỉ đổi khi một thao tác ghi tiền riêng đã xác nhận.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-14/21.

**Truy vết:** REQ-CASH-02 / AC-09.

### UC-CASH-03 — Xác nhận điều chỉnh chênh lệch tiền mặt

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Ghi nhận chênh lệch chưa xác định nguyên nhân có dấu vết.

**Kích hoạt:** Trong UC-CASH-02, chọn Điều chỉnh.

**Tiền điều kiện:** Chênh lệch khác 0; observation/snapshot còn hợp lệ; có lý do.

**Luồng chính:**

1. Hệ thống nêu số tính, số đếm, phần chênh lệch và loại adjustment.
2. Người dùng nhập lý do; hệ thống xem trước tác động tiền và thu–chi.
3. Người dùng xác nhận; hệ thống ghi adjustment, liên kết observation và audit atomically.
4. Hệ thống cập nhật snapshot và trạng thái case.

**Luồng thay thế/ngoại lệ:**

- A1. Snapshot thay đổi: tính lại trước khi xác nhận.
- A2. Tìm ra khoản chi thật: chuyển ghi expense có căn cứ, tránh thêm cả expense lẫn adjustment.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Tiền điều chỉnh một lần; không tự quy thành thu nhập hay chi tiêu sinh hoạt.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-14/21/46.

**Truy vết:** Refinement REQ-CASH-02 / AC-09.

### UC-ACC-02 — Lưu trữ và khôi phục tài khoản

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Ngừng sử dụng tài khoản mà vẫn giữ lịch sử.

**Kích hoạt:** Chọn Lưu trữ/Khôi phục trong chi tiết tài khoản.

**Tiền điều kiện:** Tài khoản thuộc workspace; phiên bản hiện hành.

**Luồng chính:**

1. Hệ thống hiển thị trạng thái, ảnh hưởng tới phạm vi và liên kết đang có.
2. Người dùng chọn lưu trữ hoặc khôi phục nếu chính sách cho phép.
3. Hệ thống xem trước và yêu cầu xác nhận.
4. Hệ thống đổi trạng thái, lưu history; tài khoản lưu trữ vẫn tra cứu trong phạm vi lịch sử.

**Luồng thay thế/ngoại lệ:**

- A1. Liên kết hoặc nghiệp vụ còn mở: cảnh báo hoặc chặn theo quy tắc; không âm thầm xóa.
- A2. Lưu trữ không thay số dư bằng 0 và không xóa giao dịch.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Trạng thái tài khoản được cập nhật; lịch sử và căn cứ giữ nguyên.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-19/20.

**Truy vết:** Tách từ UC-DRILL-01 cũ; REQ-DRILL-01 / AC-14.

## Phân hệ 2 — Ghi nhận, thu nạp và giao dịch

### UC-MONEY-01 — Ghi giao dịch thu, chi, chuyển, hoàn và phí

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Ghi biến động tiền đúng bản chất.

**Kích hoạt:** Chọn Thêm giao dịch.

**Tiền điều kiện:** Tài khoản active; workspace và VND hợp lệ; đủ căn cứ theo loại.

**Luồng chính:**

1. Người dùng chọn loại, tài khoản, số tiền, ngày và thông tin liên quan.
2. Với chuyển khoản, chọn hai tài khoản khác nhau; với hoàn tiền, cung cấp giao dịch/căn cứ gốc.
3. Hệ thống kiểm dữ liệu và xem trước các bút toán, phí, tác động tiền và thu–chi.
4. Người dùng xác nhận; hệ thống ghi nhóm bút toán cân bằng cùng history/idempotency trong một transaction.
5. Hệ thống trả kết quả và cập nhật snapshot.

**Luồng thay thế/ngoại lệ:**

- A1. Thiếu khoản gốc của refund: dùng trạng thái chưa giải quyết/Review theo policy; không tự coi income.
- A2. Transfer chỉ có một phía: dùng clearing và Review; không bịa chân còn lại.
- A3. Pending/draft không vào posted totals; phí là thành phần riêng đúng quy tắc.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Giao dịch được ghi một lần hoặc bị chặn rõ ràng; chuyển nội bộ không làm tăng tổng thu/chi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-01…13/45/46.

**Truy vết:** REQ-MONEY-01 / AC-08.

### UC-TXN-01 — Tra cứu và xem chi tiết giao dịch

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Tìm giao dịch và đọc căn cứ đầy đủ.

**Kích hoạt:** Mở Giao dịch hoặc đi từ chỉ số báo cáo.

**Tiền điều kiện:** Có quyền đọc workspace; bộ lọc/phạm vi rõ.

**Luồng chính:**

1. Người dùng chọn kỳ, tài khoản, loại, danh mục và trạng thái.
2. Hệ thống truy vấn theo snapshot và hiển thị kết quả cùng chất lượng dữ liệu.
3. Người dùng mở một giao dịch; hệ thống hiện loại, posting/reconciliation, nguồn, lịch sử và liên kết.
4. Người dùng quay lại; hệ thống giữ ngữ cảnh lọc và kỳ.

**Luồng thay thế/ngoại lệ:**

- A1. Không có kết quả: hiển thị rỗng kèm cách đổi bộ lọc.
- A2. Lỗi truy vấn không được thay bằng danh sách rỗng; thiếu evidence phải có nhãn.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Chỉ đọc; không đổi số dư, giao dịch hoặc trạng thái đối soát.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-03/05/12/19/20.

**Truy vết:** REQ-TXN-01 / AC-11.

### UC-TXN-02 — Sửa giao dịch và đảo bút toán đã ghi

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Chỉnh sai có lịch sử và giữ bất biến ledger.

**Kích hoạt:** Chọn Sửa/Điều chỉnh ở giao dịch.

**Tiền điều kiện:** Đã tải giao dịch và version; posted correction có lý do.

**Luồng chính:**

1. Hệ thống phân biệt draft, sửa metadata/danh mục và sửa tác động tài chính đã posted.
2. Người dùng sửa phần được phép và nhập lý do.
3. Hệ thống xem trước; posted correction tạo reversal/replacement thay vì sửa dòng ledger cũ.
4. Người dùng xác nhận; hệ thống lưu toàn bộ liên kết/history/tác động trong một transaction.
5. Hệ thống hiển thị bản gốc, bản đảo và bản thay thế.

**Luồng thay thế/ngoại lệ:**

- A1. Giao dịch đã đảo: không đảo lần hai; mở replacement hiện hành.
- A2. Chỉ đổi danh mục: không thay tiền; nhập lại nguồn không xóa manual override.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Sửa đúng delta một lần; ledger sealed giữ nguyên.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-05/09/12/13/46.

**Truy vết:** REQ-TXN-02 / AC-12.

### UC-IMPORT-01 — Nhập và đối soát sao kê CSV

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Nhập phần giao dịch hợp lệ đã xem trước.

**Kích hoạt:** Chọn Nhập CSV.

**Tiền điều kiện:** Tài khoản đích active; file/profile được hỗ trợ; giới hạn theo cấu hình hiện hành.

**Luồng chính:**

1. Người dùng chọn file và tài khoản; ánh xạ cột ngày, tiền, tham chiếu, nội dung và đơn vị tiền.
2. Hệ thống phân tích, giữ nguồn/parser/mapping, kiểm hợp lệ và phát hiện trùng.
3. Hệ thống hiển thị valid/invalid/duplicate/ambiguous và tác động; người dùng chọn các dòng hợp lệ.
4. Người dùng xác nhận; hệ thống ghi atomic tập được chọn và tạo Review cho phần cần xử lý theo policy.
5. Hệ thống trả job/result/history và cập nhật dữ liệu.

**Luồng thay thế/ngoại lệ:**

- A1. CSV sai định dạng, vượt giới hạn hoặc số tiền mơ hồ: chặn hoặc chỉ rõ dòng lỗi trước commit.
- A2. Exact duplicate không ghi tiền lần hai; cùng amount chưa đủ kết luận trùng.
- A3. File/mapping/selection đổi làm preview cũ mất hiệu lực.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Các dòng hợp lệ đã chọn được ghi một lần hoặc không dòng nào; phần loại trừ không âm thầm posted.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-09…12/21/42.

**Truy vết:** REQ-INPUT-01 / AC-06.

### UC-CAPTURE-01 — Cấp quyền và cấu hình thu thập thông báo

**Tác nhân:** Chủ workspace; Android OS.

**Mục tiêu:** Cho phép thu thập đúng nguồn trên đúng thiết bị.

**Kích hoạt:** Mở Kết nối thông báo Android.

**Tiền điều kiện:** APK hỗ trợ; owner/device được ràng buộc đúng; có source profile được hỗ trợ.

**Luồng chính:**

1. Hệ thống giải thích dữ liệu thu, giới hạn coverage và nguồn hỗ trợ.
2. Người dùng đồng ý, chọn nguồn/tài khoản trong allowlist và cấp Notification Access qua Android.
3. Hệ thống kiểm consent, OS permission, binding, credential và profile.
4. Hệ thống hiển thị trạng thái sẵn sàng hoặc phần còn thiếu; người dùng có thể tắt/thu hồi.

**Luồng thay thế/ngoại lệ:**

- A1. Deny/revoke hoặc thiếu enrollment: không báo đang thu thập đầy đủ.
- A2. Không nhận OTP/app ngoài allowlist; force-stop/gap được trình bày đúng.
- A3. Quyền phát notification thử và quyền đọc Notification Access là hai quyền khác nhau.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Chỉ capture khi tất cả điều kiện cho phép; cấp quyền không tự nhập lịch sử ngân hàng.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-42/43/44.

**Truy vết:** REQ-CAPTURE-01 / AC-31; REQ-APK-01 / AC-30.

### UC-INGEST-03 — Tiếp nhận và chuẩn hóa thông báo tự động

**Tác nhân:** Android OS và ứng dụng nguồn, qua collector FinWeave.

**Mục tiêu:** Biến observation hợp lệ thành receipt/giao dịch hoặc case cần rà soát.

**Kích hoạt:** Thông báo của nguồn cho phép xuất hiện và được collector tiếp nhận.

**Tiền điều kiện:** Consent, binding và profile hợp lệ; local outbox/đồng bộ bảo đảm lưu bền.

**Luồng chính:**

1. Collector kiểm nguồn và chính sách loại trừ trước khi đọc nội dung cần thiết.
2. Collector chuẩn hóa bằng parser version và lưu sự kiện vào outbox mã hóa.
3. Backend xác thực thiết bị, ghi durable receipt rồi mới ACK việc tiếp nhận.
4. Worker parse/validate, kiểm transport identity và semantic duplicate, tìm cặp transfer theo evidence.
5. Nếu đủ căn cứ, worker ghi ledger atomic; nếu chưa đủ, tạo Review và trả trạng thái xử lý rõ.

**Luồng thay thế/ngoại lệ:**

- A1. Retry cùng eventId trả cùng receipt; hai giao dịch thật cùng amount không tự gộp.
- A2. Receipt ACK không đồng nghĩa đã posted; parser lỗi/thiếu căn cứ giữ chưa posted.
- A3. Thông báo có thể thiếu hoặc sai; không chứng minh balance hay coverage đầy đủ.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Receipt có truy vết; một sự kiện không nhân posting do gửi lại.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-42/43/46.

**Truy vết:** REQ-INGEST-03 / AC-32.

### UC-SYNC-01 — Đồng bộ hàng đợi và dữ liệu đa thiết bị

**Tác nhân:** Chủ workspace; collector trên Android.

**Mục tiêu:** Đưa dữ liệu chưa gửi lên đúng owner và làm mới các giao diện.

**Kích hoạt:** Mạng trở lại, worker được lên lịch hoặc ứng dụng về foreground.

**Tiền điều kiện:** Queue có owner/device binding; credential chưa bị thu hồi.

**Luồng chính:**

1. Native worker đọc các phần tử chưa được ACK thuộc binding hiện tại.
2. Worker gửi với event identity ổn định; server ghi durable receipt và trả ACK.
3. Native chỉ đánh dấu ACK khi xác nhận receipt đúng sự kiện.
4. Client đọc trạng thái/snapshot mới; không để phản hồi cũ đè phiên bản mới.
5. Sau restart, tiếp tục phần chưa được ACK và giữ kết quả đã biết.

**Luồng thay thế/ngoại lệ:**

- A1. Offline/timeout: backoff và giữ queue; kết quả chưa rõ phải retry cùng identity.
- A2. Logout/revoke/đổi owner: chặn upload; không gửi queue A bằng credential B.
- A3. Gỡ app có thể làm mất queue local chưa sync; không cam kết tự phục hồi.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Queue được tiếp tục an toàn; các client hội tụ khi làm mới, không yêu cầu push realtime.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-42/44.

**Truy vết:** REQ-SYNC-01 / AC-33; REQ-RECOVERY-01 / AC-41.

### UC-SOURCE-01 — Quản lý nguồn dữ liệu của workspace

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Biết nguồn nào đang hoạt động và có thể cập nhật gì.

**Kích hoạt:** Mở Nguồn; chọn kết nối, cập nhật hoặc ngắt.

**Tiền điều kiện:** Có profile nguồn và quyền sử dụng phù hợp.

**Luồng chính:**

1. Hệ thống hiện capability, trạng thái, lastAttempt, lastSuccess, coverage và dữ liệu cần cấp quyền.
2. Người dùng chọn nguồn/tài khoản, cung cấp thông tin cấu hình qua kênh được phép.
3. Hệ thống kiểm profile/entitlement và hiển thị connecting/processing khi chưa xong.
4. Kết quả đi qua pipeline notification hoặc quote phù hợp; hệ thống cập nhật trạng thái và căn cứ.
5. Người dùng ngắt nguồn; hệ thống dừng thu/lấy mới, giữ lịch sử có nhãn.

**Luồng thay thế/ngoại lệ:**

- A1. Nguồn chưa được hỗ trợ hoặc chưa có quyền: không giả kết nối thành công.
- A2. Lỗi/429/revoked: giữ dữ liệu cũ với nhãn thời điểm; không về 0.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Cấu hình và trạng thái nguồn rõ; không tự sửa holdings chỉ do kết nối.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-18/19/40…44.

**Truy vết:** REQ-INPUT-02 / AC-07; REQ-CAPTURE-01/PRICE-01.

## Phân hệ 3 — Tài sản đầu tư và giá thị trường

### UC-STOCK-01 — Khai báo và quản lý danh mục cổ phiếu

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Theo dõi lượng cổ phiếu và định giá có nguồn.

**Kích hoạt:** Chọn Thêm/Sửa cổ phiếu.

**Tiền điều kiện:** Workspace hợp lệ; catalog giải quyết được định danh mã/sàn.

**Luồng chính:**

1. Người dùng chọn ticker và nhập quantity, ngày; giá vốn là tùy chọn.
2. Hệ thống resolve instrument/sàn/đơn vị và yêu cầu xác nhận nếu còn mơ hồ.
3. Hệ thống dùng quote phù hợp nếu có, hiện quantityAsOf và quoteAsOf riêng.
4. Người dùng xác nhận; hệ thống lưu khai báo/holding/history và hiển thị định giá.

**Luồng thay thế/ngoại lệ:**

- A1. Không có quote: vẫn cho lưu khai báo hợp lệ, valuation unknown.
- A2. Thiếu giá vốn: P/L unknown, không coi cost=0.
- A3. Ticker trùng nhưng khác market: không tự gộp.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Holding được lưu; khai báo không tự tạo giao dịch tiền hoặc thu nhập.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-15/18/19/22/40.

**Truy vết:** REQ-STOCK-01/02 / AC-04/34.

### UC-GOLD-01 — Khai báo và quản lý vàng

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Định giá đúng sản phẩm và đổi đơn vị nhất quán.

**Kích hoạt:** Chọn Thêm/Sửa vàng hoặc đổi đơn vị hiển thị.

**Tiền điều kiện:** Gold profile gồm loại/tuổi/nguồn/side/unit được xác nhận.

**Luồng chính:**

1. Người dùng chọn profile, nhập lượng theo đơn vị hỗ trợ, ngày và cost nếu biết.
2. Hệ thống kiểm profile và quy đổi quantity theo đơn vị chuẩn.
3. Hệ thống chọn quote tương thích và trình bày nguồn/thời điểm/đơn vị.
4. Người dùng xác nhận; hệ thống lưu holding/history và có thể đổi cách hiển thị chỉ/lượng.

**Luồng thay thế/ngoại lệ:**

- A1. Quote khác product/purity/side/unit: không áp dụng.
- A2. Thiếu FX khi thực sự cần chuyển tiền tệ: valuation unknown hoặc partial có nhãn.
- A3. Đổi 2 chỉ thành 0,2 lượng không thay giá trị kinh tế.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Holding vàng và định giá đúng compatibility; không money event từ khai báo.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-15/16/18/40.

**Truy vết:** REQ-GOLD-01/02 / AC-05/35.

### UC-HOLD-01 — Cập nhật số lượng, giá vốn và lịch sử tài sản

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Phản ánh thay đổi holding mà không nhầm với thay đổi giá.

**Kích hoạt:** Chọn Cập nhật holding.

**Tiền điều kiện:** Holding thuộc owner, có version và căn cứ ngày/lý do.

**Luồng chính:**

1. Hệ thống hiển thị quantity/cost/history hiện tại.
2. Người dùng chọn khai báo bổ sung, sửa lượng/cost hoặc nghiệp vụ mua có thanh toán.
3. Hệ thống xem trước phần thay đổi và phân biệt declaration với purchase.
4. Người dùng xác nhận khai báo/sửa hợp lệ; mua có đủ căn cứ đi qua UC-BUY-01.
5. Hệ thống lưu movement/history và tính lại valuation theo quote thích hợp.

**Luồng thay thế/ngoại lệ:**

- A1. Refresh quote không được thay quantity.
- A2. Thiếu căn cứ thanh toán: chỉ ghi khai báo/điều chỉnh có nhãn; không bịa cash movement.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Quantity/cost/history cập nhật nhất quán; không double-count cash và tài sản.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-13/15/17/19/40/46.

**Truy vết:** REQ-HOLD-01 / AC-10.

### UC-BUY-01 — Liên kết mua tài sản với tài khoản thanh toán

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Ghi đồng thời lượng mua và tiền thanh toán.

**Kích hoạt:** Trong UC-HOLD-01, chọn Mua tài sản.

**Tiền điều kiện:** Có asset identity, tài khoản tiền active và căn cứ giao dịch.

**Luồng chính:**

1. Người dùng nhập quantity, đơn giá, ngày, phí và tài khoản trả tiền.
2. Hệ thống kiểm dữ liệu và xem trước movement holding cùng bút toán tiền liên kết.
3. Người dùng xác nhận; hệ thống ghi cash/holding/history trong cùng transaction.
4. Hệ thống hiện liên kết hai phía và giá vốn theo chính sách.

**Luồng thay thế/ngoại lệ:**

- A1. Không đủ dữ liệu: không tạo giao dịch mua giả từ khai báo.
- A2. Một phần ghi thất bại: rollback toàn bộ; timeout kiểm operation cũ.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Mua có liên kết atomic một lần; không coi khoản đầu tư là chi sinh hoạt.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-13/17/46.

**Truy vết:** Refinement REQ-HOLD-01 / AC-10.

### UC-PRICE-01 — Đồng bộ giá thị trường thủ công hoặc hằng ngày

**Tác nhân:** Chủ workspace; nhà cung cấp giá thị trường.

**Mục tiêu:** Cập nhật quote có quyền mà không thay lượng nắm giữ.

**Kích hoạt:** Owner chọn Cập nhật hoặc bộ lập lịch nội bộ đến kỳ.

**Tiền điều kiện:** Provider/profile/entitlement hợp lệ; quota còn; instrument xác định.

**Luồng chính:**

1. Hệ thống tạo hoặc gộp yêu cầu vào job cùng khóa thị trường/kỳ phù hợp.
2. Market worker kiểm quyền nguồn, quota và gọi adapter provider.
3. Hệ thống kiểm market/product/purity/side/unit/currency/time; lưu quote hợp lệ kèm provenance.
4. Hệ thống tính lại valuation và công bố kết quả từng phần cùng lastAttempt/lastSuccess/quoteAsOf.

**Luồng thay thế/ngoại lệ:**

- A1. Manual trùng daily: gộp job theo policy, không gọi vô hạn.
- A2. 429/timeout/partial: retry có giới hạn, giữ last-good có nhãn.
- A3. Ngày nghỉ: không sửa quoteAsOf thành hôm nay; không tự bịa lịch sử giá.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Quote hợp lệ được cập nhật; quantity/cash/income giữ nguyên.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-18/19/40/41.

**Truy vết:** REQ-PRICE-01 / AC-36.

### UC-REVIEW-02 — Kiểm tra chất lượng giá và tài sản

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Biết valuation nào thiếu, cũ hoặc sai compatibility.

**Kích hoạt:** Mở cảnh báo giá/holding hoặc mục Rà soát.

**Tiền điều kiện:** Có quyền đọc holding, quote và provenance.

**Luồng chính:**

1. Hệ thống liệt kê thiếu quote/cost, stale quote, mismatch và nguồn đã ngắt.
2. Người dùng mở case để xem quantityAsOf, quoteAsOf, profile và căn cứ.
3. Người dùng chọn sửa profile/khai báo hoặc yêu cầu refresh nguồn đã được phép.
4. Hệ thống kiểm lại chất lượng và lưu quyết định/căn cứ; chỉ áp dụng dữ liệu hợp lệ.

**Luồng thay thế/ngoại lệ:**

- A1. Không có nguồn đủ quyền: giữ unresolved/unknown.
- A2. Refresh thất bại không đổi giá về 0 và không kết luận giá đã mới.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Có kết quả kiểm tra/chất lượng rõ; không tự sửa quantity hoặc cash.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-15/18/19/40/41.

**Truy vết:** REQ-REVIEW-02 / AC-16.

## Phân hệ 4 — Báo cáo, tổng quan và rà soát

### UC-OVERVIEW-01 — Xem tổng quan tài chính, dòng tiền và tài sản

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Đọc số liệu tổng hợp cùng phạm vi và mức đầy đủ.

**Kích hoạt:** Mở Tổng quan.

**Tiền điều kiện:** Có quyền workspace; kỳ và scope xác định.

**Luồng chính:**

1. Người dùng chọn kỳ và phạm vi tài khoản/tài sản.
2. Hệ thống đọc snapshot nhất quán và tổng hợp tiền, thu–chi, dòng tiền, cơ cấu tài sản.
3. Hệ thống hiển thị thời điểm, nguồn, phần unknown/incomplete và cảnh báo.
4. Người dùng có thể mở drill-down, báo cáo hoặc căn cứ của chỉ số.

**Luồng thay thế/ngoại lệ:**

- A1. Không dữ liệu khác lỗi dịch vụ; opening thiếu làm tổng chưa đầy đủ.
- A2. Transfer/opening/valuation change không bị cộng vào income.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Chỉ đọc, giữ scope/version của số liệu; không thay ledger.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-01…04/19/24/45.

**Truy vết:** REQ-OVERVIEW-01 / AC-13.

### UC-REPORT-01 — Xem báo cáo tài chính theo kỳ

**Tác nhân:** Chủ workspace.

**Mục tiêu:** So sánh và phân tích tài chính theo kỳ được chọn.

**Kích hoạt:** Chọn báo cáo/tháng/quý/năm/tùy chọn trên Home.

**Tiền điều kiện:** Kỳ và scope hợp lệ; snapshot đọc nhất quán.

**Luồng chính:**

1. Người dùng chọn kỳ, chỉ tiêu và phạm vi.
2. Hệ thống tính số liệu theo cùng mốc, phân loại và phiên bản.
3. Hệ thống hiển thị bảng/biểu đồ, kỳ so sánh và coverage.
4. Người dùng mở drill-down hoặc evidence nếu cần.

**Luồng thay thế/ngoại lệ:**

- A1. Kỳ không có lịch sử đủ: nêu thiếu, không suy thành toàn bộ bằng 0.
- A2. Báo cáo là chức năng tích hợp Home; không bắt buộc có màn Reports riêng.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Báo cáo có kỳ/scope/version rõ; chỉ đọc.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-03/19/24/36.

**Truy vết:** REQ-REPORT-01 / AC-20.

### UC-DRILL-01 — Phân tích chi tiết và điều chỉnh phạm vi

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Đi từ chỉ số tới thành phần và giao dịch cấu thành.

**Kích hoạt:** Chọn một chỉ số trên Tổng quan hoặc Báo cáo.

**Tiền điều kiện:** Chỉ số gắn snapshot/kỳ/scope; owner có quyền thành phần.

**Luồng chính:**

1. Hệ thống nhận chỉ số và ngữ cảnh từ màn gốc.
2. Người dùng chọn chiều phân tích hoặc tài khoản/thành phần.
3. Hệ thống hiện breakdown và danh sách cấu thành với cùng semantics.
4. Người dùng mở giao dịch/evidence rồi quay lại; ngữ cảnh phân tích được giữ.

**Luồng thay thế/ngoại lệ:**

- A1. Snapshot đã thay đổi: ghi rõ và làm mới, không trộn hai version.
- A2. Chuyển scope chỉ ảnh hưởng góc nhìn, không archive hoặc xóa dữ liệu.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Có phân tích chi tiết truy được về số tổng; dữ liệu nghiệp vụ không đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-19/20/24.

**Truy vết:** REQ-DRILL-01 / AC-14.

### UC-INSIGHT-01 — Đọc nhận định và phát hiện bất thường

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Hiểu nhận định có căn cứ và phần còn chưa chắc.

**Kích hoạt:** Mở insight/cảnh báo trên Home.

**Tiền điều kiện:** Có snapshot, coverage và bộ quy tắc/phân tích xác định.

**Luồng chính:**

1. Hệ thống phát hiện pattern từ dữ liệu được phép và có nhãn kỳ.
2. Hệ thống trình bày nhận định, metric, điều kiện và giới hạn coverage.
3. Người dùng đọc và có thể mở căn cứ hoặc yêu cầu trợ lý giải thích.
4. Hệ thống giữ liên kết metric về snapshot/evidence.

**Luồng thay thế/ngoại lệ:**

- A1. Thiếu dữ liệu: không khẳng định bất thường chắc chắn.
- A2. Insight không tự thay ledger hoặc active plan.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Insight có căn cứ và giới hạn; không ghi actual.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-19/25/36.

**Truy vết:** REQ-INSIGHT-01 / AC-21.

### UC-REVIEW-01 — Rà soát nghi vấn dữ liệu tiền

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Xử lý các nghi vấn theo evidence mà không ghi tiền tùy tiện.

**Kích hoạt:** Mở hàng đợi Review.

**Tiền điều kiện:** Case thuộc workspace; có current version.

**Luồng chính:**

1. Hệ thống liệt kê case trùng, chuyển khoản thiếu phía, refund, parse hoặc lệch tiền.
2. Người dùng chọn case và xem các observation, giao dịch, version và đề xuất.
3. Hệ thống nêu điều gì chắc chắn, còn thiếu và các quyết định cho phép.
4. Người dùng chọn xử lý qua UC-RESOLVE-01 hoặc để lại case chưa giải quyết.

**Luồng thay thế/ngoại lệ:**

- A1. Chỉ mở case chưa giải quyết nó.
- A2. Không đủ căn cứ: giữ open/deferred; không ép đoán để xóa cảnh báo.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Case được đọc/đánh dấu phù hợp; tiền chỉ đổi qua hành động được xác nhận riêng.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-09…14/21/42.

**Truy vết:** REQ-REVIEW-01 / AC-15.

### UC-RESOLVE-01 — Xác nhận quyết định xử lý case

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Áp dụng khớp/xác nhận/bỏ qua có audit và đúng quyền.

**Kích hoạt:** Trong Review, chọn một hành động xử lý.

**Tiền điều kiện:** Case/action/version hợp lệ; đủ evidence và owner confirmation.

**Luồng chính:**

1. Người dùng chọn khớp transfer, xác nhận trùng, ghi hợp lệ hoặc bỏ qua theo loại case.
2. Hệ thống xem trước thay đổi ledger/liên kết/trạng thái; yêu cầu lý do nếu cần.
3. Người dùng xác nhận; hệ thống kiểm lại quyền, version và idempotency.
4. Hệ thống commit atomic tác động được phép cùng history và đóng/cập nhật case.

**Luồng thay thế/ngoại lệ:**

- A1. Hai case cạnh tranh cùng giao dịch: báo conflict và tải lại.
- A2. Bỏ qua không xóa raw evidence theo cách tùy tiện; xác nhận duplicate không phát sinh lần ghi tiền thứ hai.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Quyết định có trace; chỉ tác động đã duyệt được áp dụng một lần.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-09/12/21/42/46.

**Truy vết:** Refinement REQ-REVIEW-01 / AC-15.

### UC-EVIDENCE-01 — Xem chứng từ và nguồn gốc số liệu

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Truy nguyên số liệu về dữ liệu/căn cứ hình thành.

**Kích hoạt:** Chọn Xem căn cứ trên chỉ số, giao dịch hoặc insight.

**Tiền điều kiện:** Có quyền đọc nguồn trong workspace; liên kết provenance có thể có.

**Luồng chính:**

1. Hệ thống nhận metric/transaction reference và version.
2. Hệ thống truy các receipt/file/khai báo/quote và parser/manual override liên quan.
3. Hệ thống trình bày nguồn, thời điểm, trạng thái và lịch sử theo quyền.
4. Người dùng mở thành phần hoặc quay lại ngữ cảnh trước.

**Luồng thay thế/ngoại lệ:**

- A1. Evidence thiếu/đã hết thời hạn lưu: báo rõ; không bịa reference.
- A2. Không hiển thị dữ liệu workspace khác hoặc bí mật credential.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Chỉ đọc, truy nguồn có giới hạn rõ; không đổi trạng thái chỉ do xem.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-19/21/36.

**Truy vết:** Refinement REQ-TXN-01/OVERVIEW-01/INSIGHT-01.

### UC-UX-01 — Bật hoặc tắt che thông tin tài chính

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Che thông tin nhạy cảm khi xem ứng dụng.

**Kích hoạt:** Chọn biểu tượng chế độ riêng tư.

**Tiền điều kiện:** Ứng dụng có phiên và preference hiện hành.

**Luồng chính:**

1. Người dùng bật chế độ che.
2. Hệ thống che amount/quantity ở thẻ, chart, tooltip và accessible text.
3. Với nội dung AI tự do có số nhạy cảm, hệ thống ẩn phần nội dung theo policy thay vì đoán bằng regex.
4. Người dùng tắt chế độ; hệ thống phục hồi hiển thị theo quyền.

**Luồng thay thế/ngoại lệ:**

- A1. Giữ ngữ cảnh kỳ/ngày nhưng không rò số qua nhãn hỗ trợ truy cập.
- A2. Masking là che giao diện, không thay authorization, mã hóa hoặc giá trị đã lưu.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Preference được áp dụng nhất quán; số liệu gốc không đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-35; accessibility requirements.

**Truy vết:** REQ-UX-01 / AC-17; NFR-12.

## Phân hệ 5 — Kế hoạch, mục tiêu và mô phỏng

### UC-PLAN-01 — Lập và điều chỉnh kế hoạch ngân sách

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Có kế hoạch thu, chi và đầu tư có phiên bản.

**Kích hoạt:** Mở Plan; chọn Tạo/Sửa.

**Tiền điều kiện:** Kỳ kế hoạch, workspace, baseline và giả định rõ.

**Luồng chính:**

1. Người dùng nhập các khoản dự kiến, lịch lặp, account, category và liên kết Goal nếu cần.
2. Hệ thống kiểm ngày, amount, recurrence và phân biệt planned với actual.
3. Người dùng xem trước tổng hợp và có thể chạy mô phỏng.
4. Người dùng xác nhận; hệ thống lưu plan/version/history cùng links hợp lệ.

**Luồng thay thế/ngoại lệ:**

- A1. Một khoản kế hoạch có thể không gắn Goal.
- A2. Đổi kế hoạch không sinh actual; conflict yêu cầu xem lại version.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Active plan được lưu khi owner xác nhận; ledger/tiền hiện có không đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-26…29/37/38/47.

**Truy vết:** REQ-PLAN-01 / AC-22.

### UC-PLAN-02 — Theo dõi thực hiện kế hoạch và độ lệch

**Tác nhân:** Chủ workspace.

**Mục tiêu:** So planned với actual trên cùng phạm vi.

**Kích hoạt:** Mở Theo dõi kế hoạch.

**Tiền điều kiện:** Có plan/version và actual snapshot; quy tắc ghép rõ.

**Luồng chính:**

1. Hệ thống tải kỳ, plan baseline và actual snapshot.
2. Hệ thống đề xuất ánh xạ giao dịch/occurrence theo quy tắc; owner xác nhận/sửa liên kết khi cần.
3. Hệ thống tính actual, planned và variance có signed effects của refund/reversal.
4. Người dùng xem phần chênh và chọn chỉnh kế hoạch thủ công hoặc yêu cầu Agent tạo amendment draft.

**Luồng thay thế/ngoại lệ:**

- A1. Một actual family không được match hai occurrences trong cùng scope qua revisions.
- A2. Actual chưa phân loại/thiếu coverage: giữ chưa ghép và nêu giới hạn.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Variance/link history nhất quán; không tự sửa actual hoặc active plan.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-27/29/39/48.

**Truy vết:** REQ-PLAN-02 / AC-23.

### UC-GOAL-01 — Thiết lập mục tiêu và phân bổ tiền

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Dành nguồn tiền cho mục tiêu mà không chuyển tiền thực.

**Kích hoạt:** Mở Goals; chọn Tạo/Sửa/Phân bổ.

**Tiền điều kiện:** Target, deadline, source accounts và reserve được xác định; balances có quality.

**Luồng chính:**

1. Người dùng nhập mục tiêu, số đích, hạn và ưu tiên.
2. Người dùng chọn nguồn tiền/phân bổ hiện có và liên kết kế hoạch dự kiến nếu cần.
3. Hệ thống tính allocated, funded và nguồn còn khả dụng trên tập Goal dùng chung.
4. Người dùng xem trước và xác nhận; hệ thống lưu Goal/allocation/version/history.

**Luồng thay thế/ngoại lệ:**

- A1. Future income/contribution chưa nhận không là funded cash.
- A2. Phân bổ trùng cùng nguồn phải kiểm tổng và reserve; số dư unknown không thành 0 chắc chắn.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Mục tiêu/phân bổ được lưu; earmarking không là chuyển khoản hay chi phí.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-30…32/38/49.

**Truy vết:** REQ-GOAL-01 / AC-24.

### UC-GOAL-02 — Theo dõi tiến độ và phát hiện hụt nguồn

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Biết funded progress, allocated và shortfall riêng.

**Kích hoạt:** Mở Goal Tracking hoặc làm mới sau actual thay đổi.

**Tiền điều kiện:** Có Goal, allocations và actual snapshot.

**Luồng chính:**

1. Hệ thống đọc trạng thái nguồn tiền hiện hành.
2. Hệ thống phân chia funding dùng chung theo policy và tính progress/shortfall.
3. Hệ thống hiển thị allocated khác funded, hạn và khả năng đáp ứng.
4. Người dùng có thể chỉnh kế hoạch, giải phóng phân bổ hoặc xác nhận lifecycle nếu đủ điều kiện.

**Luồng thay thế/ngoại lệ:**

- A1. Actual chi làm thiếu funding: không chặn sự kiện đã xảy ra và không tự xóa earmark.
- A2. Nhiều Goal thiếu chung nguồn: pro-rata và stable allocation ID rounding theo Engine.
- A3. Achieved cần actual criterion và liquidity; xác suất mô phỏng không chứng minh đạt Goal.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Tiến độ/cảnh báo có căn cứ; trạng thái Goal có history, không sinh actual money.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-30/31/32/49.

**Truy vết:** REQ-GOAL-02 / AC-25.

### UC-GOAL-03 — Giải phóng tiền đã phân bổ cho mục tiêu

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Đưa phần tiền dành riêng trở lại nguồn khả dụng.

**Kích hoạt:** Chọn Giải phóng trong Goal Setup/Tracking.

**Tiền điều kiện:** Có allocation hiện hành và quyền owner.

**Luồng chính:**

1. Người dùng chọn allocation và số cần giải phóng.
2. Hệ thống xem trước allocated/funded/available và ảnh hưởng mục tiêu.
3. Người dùng xác nhận; hệ thống lưu allocation revision/history.
4. Hệ thống tính lại funding dùng chung và tiến độ các Goal liên quan.

**Luồng thay thế/ngoại lệ:**

- A1. Vượt số đang phân bổ: báo lỗi.
- A2. Balance/version đổi: xem trước lại; không tạo giao dịch cash để giải phóng earmark.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Giảm earmark đúng một lần; tổng tiền và ledger không đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-30/31/49.

**Truy vết:** Refinement REQ-GOAL-01/02 / AC-24/25.

### UC-SIM-01 — Chạy mô phỏng kịch bản tài chính

**Tác nhân:** Chủ workspace; Agent qua tool được cấp quyền.

**Mục tiêu:** So sánh phương án có điều kiện trước quyết định.

**Kích hoạt:** Chọn Mô phỏng hoặc Agent gọi scenario tool.

**Tiền điều kiện:** Baseline/Plan/Goal versions, horizon và giả định được chụp.

**Luồng chính:**

1. Người dùng/Agent nhập kịch bản mua sắm, thay thu/chi, đầu tư hoặc stress-test.
2. Hệ thống kiểm giả định, reserve, chronology và coverage.
3. Hệ thống thực hiện UC-FORECAST-01 trên baseline đóng băng.
4. Hệ thống hiển thị kết quả cashflow/feasibility/shortfall, assumptions và phiên bản mô hình.
5. Người dùng so sánh/lưu scenario; quyết định nghiệp vụ khác cần thao tác riêng.

**Luồng thay thế/ngoại lệ:**

- A1. Input thiếu hoặc infeasible: giải thích, không tự tăng thu/hạ reserve để cho khả thi.
- A2. Stale baseline: đánh dấu, recompute trước preview/apply cần thiết.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Có kết quả simulated có nhãn; actual/active plan không tự đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-28/36/39/50/51.

**Truy vết:** REQ-SIM-01 / AC-26.

### UC-FORECAST-01 — Tính dự báo dòng tiền và nguồn khả dụng

**Tác nhân:** Chủ workspace gián tiếp qua mô phỏng.

**Mục tiêu:** Tính projection lặp lại được từ assumptions và baseline.

**Kích hoạt:** UC-SIM-01 yêu cầu Engine dự báo.

**Tiền điều kiện:** Snapshot/settings/model/RNG/seed/horizon được cố định.

**Luồng chính:**

1. Engine đọc baseline, lịch thu/chi, Goal funding và chính sách ngày.
2. Engine chạy bước thời gian và phân bổ nguồn dùng chung, giữ actual tách simulated.
3. Engine tính balances, shortfall, feasibility và thống kê khi có stochastic model.
4. Hệ thống lưu run/version/assumptions/quality và trả kết quả cho caller.

**Luồng thay thế/ngoại lệ:**

- A1. Thiếu đầu vào: trả partial/unknown có giải thích, không fake 100%.
- A2. Stochastic output phải có sample size, seed/model version; không hứa chắc lợi suất.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Frozen run truy vết được, không ghi ledger.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-47/49/50/51.

**Truy vết:** Refinement REQ-SIM-01; domain forecast-model.md.

## Phân hệ 6 — Trợ lý thông minh và Agent

### UC-AI-01 — Hỏi–đáp có căn cứ và xem lịch sử hội thoại

**Tác nhân:** Chủ workspace; dịch vụ mô hình AI được phê duyệt khi bật model mode.

**Mục tiêu:** Nhận giải thích truy được về dữ liệu được phép.

**Kích hoạt:** Gửi câu hỏi hoặc mở hội thoại cũ.

**Tiền điều kiện:** Conversation đúng owner; runtime capability/model mode hiển thị rõ.

**Luồng chính:**

1. Người dùng đặt câu hỏi với captured context kỳ/scope nếu phù hợp.
2. Hệ thống xác định câu hỏi và gọi read tools có kiểm quyền khi cần dữ liệu.
3. Hệ thống lấy metric từ ToolResult/Engine, trình bày evidence, thời điểm và giới hạn.
4. Hệ thống lưu message/history cùng conversation; người dùng mở căn cứ hoặc hỏi tiếp.

**Luồng thay thế/ngoại lệ:**

- A1. Thiếu dữ liệu hoặc model/runtime không sẵn sàng: nói rõ, không bịa con số.
- A2. Không phải câu hỏi nào cũng cần Agent run hoặc tool call.
- A3. Input/prompt injection không cấp thêm quyền tool hay cross-workspace access.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Có câu trả lời/history đúng scope; không actual write.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-33…35/37.

**Truy vết:** REQ-AI-01 / AC-27; AI-FR-001…007/009/019…021/023.

### UC-AI-02 — Tương tác trợ lý qua linh vật theo ngữ cảnh

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Mở trợ lý nhanh mà giữ cùng hội thoại/ngữ cảnh.

**Kích hoạt:** Chọn linh vật trên Home, Plan, Goals hoặc khu vực khác.

**Tiền điều kiện:** UI hỗ trợ; owner có phiên; privacy/accessibility preference có hiệu lực.

**Luồng chính:**

1. Người dùng mở panel linh vật; hệ thống chụp context được phép.
2. Người dùng đặt câu hỏi hoặc chuyển tới full chat.
3. Hệ thống dùng chung conversation/history với UC-AI-01 hoặc Agent workflow phù hợp.
4. Người dùng đóng/mở panel; ngữ cảnh, trạng thái và focus được xử lý nhất quán.

**Luồng thay thế/ngoại lệ:**

- A1. Context cũ phải hiện nhãn; không dùng nhầm kỳ vừa thay.
- A2. Masking/reduced-motion/keyboard vẫn áp dụng cho panel và chat.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Tương tác nối tiếp cùng hội thoại; linh vật là UI, không actor hay authority riêng.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-34/35.

**Truy vết:** REQ-AI-02 / AC-28; AI-FR-004…008/019.

### UC-AGENT-01 — Yêu cầu Agent điều tra biến động tài chính

**Tác nhân:** Chủ workspace; runtime AI theo mode được duyệt.

**Mục tiêu:** Điều tra nhiều bước dựa trên evidence và nêu phần chưa xác định.

**Kích hoạt:** Owner hỏi nguyên nhân biến động hoặc chọn Phân tích.

**Tiền điều kiện:** Scope/baseline rõ; bounded tools và budget được cấu hình.

**Luồng chính:**

1. Hệ thống tạo AgentRun trong cùng conversation, ghi context và giới hạn.
2. Agent đọc coverage/metrics và chọn bước tiếp theo từ observation.
3. Agent kiểm transfer/refund/duplicate/phí/variance/giá theo nhu cầu và hỏi lại khi thiếu.
4. Hệ thống kiểm schema/scope/budget của từng tool; Engine là nguồn tính toán.
5. Agent trả kết luận, evidence, điều chưa chắc và đề xuất xử lý; owner quyết định riêng.

**Luồng thay thế/ngoại lệ:**

- A1. Tối đa 8 tool calls/run, 60s active budget, 2 lượt clarification theo AC-40; chờ user không tính active time.
- A2. Thiếu coverage: kết luận giới hạn; cancel/quota/error lưu trạng thái và không ghi actual.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Có investigation trace/conclusion; không tự sửa ledger, Review hoặc active plan.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-33/37/39.

**Truy vết:** REQ-AGENT-01/03 / AC-38/40; AI-SPEC INV-01.

### UC-AGENT-02 — Yêu cầu Agent lập dự thảo Plan–Goal liên kết

**Tác nhân:** Chủ workspace; runtime AI theo mode được duyệt.

**Mục tiêu:** Có phương án dự thảo được mô phỏng trước khi áp dụng.

**Kích hoạt:** Nêu mục tiêu ở Plan/Goals hoặc yêu cầu điều chỉnh theo actual.

**Tiền điều kiện:** Đúng scope; owner constraints được xác nhận; actual snapshot có quality.

**Luồng chính:**

1. Agent nhận goal-first, plan-first hoặc replan intent trong cùng hội thoại.
2. Agent hỏi target/deadline/reserve/income/priorities còn thiếu và đọc dữ liệu được phép.
3. Agent tạo/sửa GoalDraft, PlanDraft và links; không kích hoạt kế hoạch.
4. Agent thực hiện UC-SIM-01, so sánh phương án và giải thích tính khả thi bằng Engine output.
5. Owner yêu cầu sửa hoặc chuyển sang UC-DRAFT-APPLY-01 để xem trước và xác nhận.

**Luồng thay thế/ngoại lệ:**

- A1. Không khả thi: nêu nguyên nhân và lựa chọn, không tự bịa income/return.
- A2. Agent không có tool confirm/transfer/ledger; draft không là funded allocation.
- A3. Natural language chưa được model xử lý thực phải báo mode rõ, không gọi scripted flow là LLM thật.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Draft/links/simulation có version; active plan/Goal và actual chưa đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-37/38/39.

**Truy vết:** REQ-AGENT-02/03 / AC-39/40; AI-SPEC PG-01/02/03.

### UC-DRAFT-APPLY-01 — Xem trước và xác nhận áp dụng dự thảo

**Tác nhân:** Chủ workspace.

**Mục tiêu:** Áp dụng bundle dự thảo đã kiểm tra bằng quyết định owner.

**Kích hoạt:** Chọn Xem trước/Áp dụng cho draft đã có.

**Tiền điều kiện:** Draft tồn tại, đúng owner; snapshot/versions/digest còn hợp lệ; yêu cầu mô phỏng đã đáp ứng.

**Luồng chính:**

1. Hệ thống nạp dự thảo, kết quả mô phỏng và căn cứ version.
2. Hệ thống hiển thị diff Plan/Goals/links, giả định và tác động.
3. Owner xác nhận rõ ràng; backend kiểm quyền, preview digest và idempotency.
4. Backend lưu Plan/Goal/link/history và replay result trong cùng transaction.
5. Hệ thống trả kết quả, cập nhật active versions và hội thoại.

**Luồng thay thế/ngoại lệ:**

- A1. Stale: simulate/preview lại, không áp dụng âm thầm.
- A2. Hủy: không đổi active data. Confirm lặp cùng payload/key trả kết quả cũ.
- A3. Xác nhận dự thảo không tự tạo actual allocation, transfer hoặc ledger posting.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Plan/Goal/link bundle áp dụng atomic một lần; actual không đổi.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-37/38/39.

**Truy vết:** Refinement REQ-AGENT-02 / AC-39; AI-FR-014…016/022…024.

## Phân hệ 7 — Quản trị vận hành

### UC-ADMIN-AUTH-01 — Đăng nhập và kiểm soát phiên quản trị

**Tác nhân:** Quản trị viên ứng dụng.

**Mục tiêu:** Mở phiên Ops có quyền riêng và MFA.

**Kích hoạt:** Mở admin console.

**Tiền điều kiện:** Admin identity được cấp; kênh admin riêng; TOTP cấu hình theo chính sách.

**Luồng chính:**

1. Admin nhập credential và mã TOTP.
2. Ops API xác minh danh tính/MFA, giới hạn thử và tạo phiên admin.
3. Hệ thống chỉ hiển thị chức năng vận hành được cấp.
4. Thao tác nhạy cảm cần reauthentication; logout/expiry thu hồi phiên.

**Luồng thay thế/ngoại lệ:**

- A1. Owner session gọi admin API: từ chối; admin session gọi finance API owner: từ chối.
- A2. Mất MFA: theo recovery protocol quản trị được duyệt, không bỏ qua tùy tiện.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Phiên admin chỉ có operational capabilities; không có quyền xem tài chính owner.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-44; identity admin policy.

**Truy vết:** REQ-ADMIN-01 / AC-37; REQ-SURFACE-01 / AC-29.

### UC-ADMIN-01 — Giám sát hệ thống, jobs và quota

**Tác nhân:** Quản trị viên ứng dụng.

**Mục tiêu:** Biết tình trạng xử lý mà không đọc dữ liệu tài chính.

**Kích hoạt:** Mở Dashboard/Jobs/Quota.

**Tiền điều kiện:** Phiên Ops hợp lệ; nguồn metadata sẵn sàng.

**Luồng chính:**

1. Admin chọn trạng thái hệ thống, jobs hoặc quota theo phạm vi cho phép.
2. Ops API truy metadata qua role/pool hẹp.
3. Hệ thống hiển thị health/readiness, job state, thời điểm, safe codes và quota.
4. Admin mở chi tiết vận hành hoặc yêu cầu safe action qua UC-OPS-03.

**Luồng thay thế/ngoại lệ:**

- A1. Metadata không truy được: báo unavailable, không báo khỏe chỉ từ SELECT 1.
- A2. Không trả amount/raw notification/prompt/credential qua DTO, log hay UI.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Chỉ đọc operational metadata, có dấu vết truy cập phù hợp.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-44; operations-policy.json.

**Truy vết:** REQ-ADMIN-01 / AC-37.

### UC-OPS-01 — Quản lý parser và mẫu nguồn thông báo

**Tác nhân:** Quản trị viên ứng dụng.

**Mục tiêu:** Quản lý phiên bản parser và ngăn parser lỗi xử lý mới.

**Kích hoạt:** Mở Parser Profiles; chọn kiểm tra/kích hoạt/vô hiệu hóa.

**Tiền điều kiện:** Phiên admin, quyền cấu hình; profile/version hợp lệ.

**Luồng chính:**

1. Hệ thống liệt kê parser, source profile, phiên bản và trạng thái an toàn.
2. Admin xem kết quả kiểm thử bằng fixture đã duyệt và chọn thay đổi.
3. Hệ thống xem trước tác động, yêu cầu lý do và reauthentication khi cần.
4. Admin xác nhận; hệ thống lưu configuration version/audit và áp dụng policy xử lý mới.

**Luồng thay thế/ngoại lệ:**

- A1. Vô hiệu parser không xóa receipt/evidence cũ.
- A2. Không cho admin mở raw notification người dùng để sửa parser; dùng fixture phù hợp.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Cấu hình parser đổi có kiểm soát; không tự sửa ledger lịch sử.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-42/43/44.

**Truy vết:** REQ-ADMIN-01 / AC-37.

### UC-OPS-02 — Quản lý kết nối và trạng thái nguồn giá

**Tác nhân:** Quản trị viên ứng dụng.

**Mục tiêu:** Vận hành adapter/provider và quyền nguồn giá.

**Kích hoạt:** Mở Providers; chọn cấu hình hoặc kiểm tra.

**Tiền điều kiện:** Ops session; credential được quản lý phía server; quyền nguồn hợp lệ.

**Luồng chính:**

1. Hệ thống hiện provider capability/profile/rights/quota/status dưới dạng metadata.
2. Admin chọn thay đổi được phép hoặc kiểm tra tình trạng kết nối.
3. Hệ thống validate cấu hình/quyền, xem trước, yêu cầu lý do khi thay đổi.
4. Sau xác nhận, hệ thống lưu version/audit; worker dùng cấu hình mới theo policy.

**Luồng thay thế/ngoại lệ:**

- A1. Không hiển thị secret nguyên văn.
- A2. Provider không có entitlement: giữ disabled; app-admin không cấp quyền dữ liệu chỉ bằng bật nút.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Cấu hình nguồn vận hành rõ; không sửa trực tiếp quote/holding của owner.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-41/44.

**Truy vết:** REQ-ADMIN-01 / AC-37; REQ-PRICE-01 / AC-36.

### UC-OPS-03 — Thực hiện lệnh vận hành an toàn

**Tác nhân:** Quản trị viên ứng dụng.

**Mục tiêu:** Retry/pause/disable đúng giới hạn và không nhân tác động tiền.

**Kích hoạt:** Chọn safe retry/pause/disable trên job hoặc parser.

**Tiền điều kiện:** Lệnh nằm trong allowlist; version/quota/state hợp lệ; có lý do.

**Luồng chính:**

1. Admin chọn operational ID và safe action.
2. Hệ thống xem trước tác động, kiểm quyền/state và yêu cầu reauthentication theo policy.
3. Admin xác nhận; Ops ghi command request/audit, không nhận finance payload tùy ý.
4. Worker kiểm lại capability/fence/idempotency và thực hiện hoặc từ chối.
5. Hệ thống hiển thị accepted khác completed và cho tra cứu outcome.

**Luồng thay thế/ngoại lệ:**

- A1. Retry job đã có result: trả kết quả tương ứng, không double-post.
- A2. Job đang lease/command stale: từ chối hoặc chờ theo policy; không cướp quyền worker.
- A3. Host backup/restore/migrate là kênh operator riêng, không tự cấp cho app-admin.
- A4. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Lệnh có outcome/audit; admin không trở thành proxy ghi tài chính.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-44; J2 fencing/replay.

**Truy vết:** REQ-ADMIN-01 / AC-37; REQ-RECOVERY-01 / AC-41.

### UC-OPS-04 — Tra cứu nhật ký kiểm toán vận hành

**Tác nhân:** Quản trị viên ứng dụng.

**Mục tiêu:** Truy dấu hoạt động quản trị qua nhật ký đã lược dữ liệu.

**Kích hoạt:** Mở Audit Log.

**Tiền điều kiện:** Phiên Ops còn hiệu lực; có quyền đọc audit metadata.

**Luồng chính:**

1. Admin chọn thời gian, action, operational ID và safe result.
2. Hệ thống truy audit theo phạm vi/retention và phân trang.
3. Hệ thống hiển thị actor quản trị, thời điểm, lý do, trạng thái và correlation ID đã sanitize.
4. Admin đối chiếu với job/command để điều tra sự cố.

**Luồng thay thế/ngoại lệ:**

- A1. Không đưa amount/raw notification/prompt/token vào log.
- A2. Log thiếu hoặc hết retention: nói rõ, không bịa sự kiện.
- A3. Áp dụng CF-01…05 theo loại thao tác.

**Hậu điều kiện thành công:** Chỉ đọc nhật ký; không sửa/xóa lịch sử audit qua thao tác xem.

**Bảo đảm khi thất bại:** chưa commit thì không có hiệu lực ghi dở dang; outcome chưa rõ giữ trạng thái chờ kiểm tra theo CF-02; riêng bước lưu observation/draft đã hoàn tất được giữ như đã nêu trong luồng.

**Quy tắc:** BR-44; logging-and-retention.md.

**Truy vết:** REQ-ADMIN-01 / AC-37.

## Quan hệ include/extend được giữ trong mô hình

| Ca nguồn | Quan hệ | Ca đích | Điều kiện / extension point |
|---|---|---|---|
| UC-CASH-03 | «extend» | UC-CASH-02 | có chênh lệch và owner chọn điều chỉnh; điểm mở rộng: sau khi hiển thị chênh lệch. |
| UC-BUY-01 | «extend» | UC-HOLD-01 | chọn mua và có căn cứ thanh toán; điểm mở rộng: chọn loại cập nhật holding. |
| UC-DRILL-01 | «extend» | UC-OVERVIEW-01 | chọn chỉ số để phân tích; điểm mở rộng: sau khi xem số tổng. |
| UC-DRILL-01 | «extend» | UC-REPORT-01 | chọn chỉ tiêu báo cáo; điểm mở rộng: sau khi xem báo cáo. |
| UC-EVIDENCE-01 | «extend» | UC-OVERVIEW-01 | chọn xem căn cứ; điểm mở rộng: sau khi hiển thị chỉ số. |
| UC-EVIDENCE-01 | «extend» | UC-REPORT-01 | chọn xem căn cứ; điểm mở rộng: sau khi hiển thị báo cáo. |
| UC-EVIDENCE-01 | «extend» | UC-INSIGHT-01 | chọn xem căn cứ; điểm mở rộng: sau khi đọc nhận định. |
| UC-RESOLVE-01 | «extend» | UC-REVIEW-01 | owner chọn hành động xử lý; điểm mở rộng: sau khi đọc case. |
| UC-GOAL-03 | «extend» | UC-GOAL-01 | chọn giải phóng phân bổ đã có; điểm mở rộng: khi chỉnh phân bổ. |
| UC-GOAL-03 | «extend» | UC-GOAL-02 | chọn giải phóng nguồn; điểm mở rộng: sau khi xem tiến độ. |
| UC-SIM-01 | «include» | UC-FORECAST-01 | Hành vi được gọi là phần bắt buộc của ca nguồn đã định nghĩa. |
| UC-AGENT-02 | «include» | UC-SIM-01 | Hành vi được gọi là phần bắt buộc của ca nguồn đã định nghĩa. |

UC-DRAFT-APPLY-01 là mục tiêu riêng do owner chủ động thực hiện trên draft đã có; không dùng extend để ngụ ý luôn phải apply ngay khi tạo draft. UC-CAPTURE-01, UC-SYNC-01 và UC-INGEST-03 liên quan theo vòng đời bất đồng bộ; không nối include chỉ vì chúng diễn ra trước/sau nhau.
