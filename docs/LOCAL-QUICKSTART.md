# Dùng FinWeave trên máy cá nhân

Bản hiện hành phục vụ chạy và kiểm thử cục bộ trên Windows. Dữ liệu mẫu, hộp thư xác nhận cục bộ và chế độ backend được ghi rõ trong ứng dụng. Tên miền dự kiến cho giai đoạn máy chủ là `finweave-demo.com`; chưa có cấu hình DNS hoặc dịch vụ email thật từ lần bàn giao này.

## Mở ứng dụng

1. Lần đầu trên máy: chạy [Setup-FinWeave.cmd](../Setup-FinWeave.cmd). Công cụ cài đúng phiên bản thư viện và kiểm tra backend, frontend, build user/admin và giá tài sản. Cần Node.js 24.19 trở lên trong nhánh 24 và pnpm 11.25.0; công cụ cũng nhận bộ Node/pnpm đã có trong Codex trên máy này.
2. Chạy [Start-FinWeave.cmd](../Start-FinWeave.cmd), giữ cửa sổ đó mở.
3. Mở [FinWeave local](http://127.0.0.1:5173). Bản này lưu dữ liệu qua PostgreSQL cục bộ. Các lần mở lại giữ nguyên dữ liệu; trình chạy không reset database và không chiếm dịch vụ khác đang dùng cổng.
4. Tạo tài khoản thử nghiệm, ví dụ `you@finweave.test`, và dùng mật khẩu ít nhất 15 ký tự.
5. Khi cần mã xác nhận, chạy [Local-Login-Code.cmd](../Local-Login-Code.cmd), nhập đúng email vừa đăng ký rồi sao chép mã vào ứng dụng. Công cụ chỉ đọc hộp thư thử nghiệm trên máy này, không gửi email ra ngoài. Mã cho thao tác xác minh lại chủ tài khoản cũng được lấy theo cách này.
6. Nhấn `Ctrl+C` ở cửa sổ chạy app để dừng những dịch vụ do cửa sổ đó khởi động. Không đóng cửa sổ giữa một lần ghi hoặc nhập CSV đang thực hiện.

Nếu chỉ muốn xem giao diện với dữ liệu minh họa, dùng [Start-Prototype.cmd](../Start-Prototype.cmd). Chế độ này dùng nút điền thông tin mẫu và mã `123456`, có phạm vi lưu trữ khác bản backend local.

## Nhập giao dịch bằng ảnh

1. Mở bản local trên Windows, vào **Giao dịch** và chọn đúng tài khoản ngân hàng. Nếu chưa có, thêm tài khoản tiền trước.
2. Chọn **Chọn ảnh giao dịch** hoặc **Chụp ảnh**. Bộ đọc dùng chung cho nhiều bố cục ngân hàng, có thể chứa nhiều giao dịch; tên ngân hàng không phải điều kiện để nhận diện.
3. Tùy chọn tự lưu được bật sẵn. Khi đủ trường, hệ thống tự ghi từng giao dịch và bỏ qua mã trùng; ảnh thiếu thông tin sẽ chờ sửa và xác nhận. Muốn xem trước mọi ảnh, tắt tùy chọn này trước khi tải.
4. Mở chi tiết để xem nguồn ảnh, giờ giao dịch, dữ liệu đọc và mã ảnh. Số dư cuối trong ảnh không tự thay số dư/tiền đầu kỳ.

Ảnh PNG/JPG/WebP tối đa 10 MB; xử lý cục bộ bằng Windows OCR. Máy hiện dùng ngôn ngữ en-US nên chữ tiếng Việt có thể mất dấu hoặc đọc sai. Không cần mở model chat để OCR hoạt động. Bản minh họa không chạy OCR; dùng `Start-FinWeave.cmd`. Ảnh đã nén và bản đọc tạm hết hạn sau 24 giờ; dữ liệu tài chính và bằng chứng text/hash đã lưu giữ trong hệ thống. [Chi tiết và giới hạn](product/screenshot-transaction-entry.md).

## Trợ lý và lập kế hoạch

- Trên máy đã có model được kiểm hash, chạy [Start-Local-AI.cmd](../Start-Local-AI.cmd) trước, sau đó mở FinWeave. Giữ cửa sổ model mở trong lúc sử dụng. Không tự tải model khác hoặc chuyển sang dịch vụ AI trả phí.
- Nếu model chưa kết nối, các thao tác ghi nhận tài chính và lập kế hoạch bằng biểu mẫu vẫn hoạt động. Chế độ quyết định của Agent được ghi trong bằng chứng của từng lượt chạy.
- Có thể sửa một bản nháp bằng các câu lệnh rõ ràng: `góp 2.000.000 VND mỗi tháng`, `thu nhập 20.000.000 VND`, `chi tiêu 8.000.000 VND`, `dự phòng 30.000.000 VND`, `hạn đến 2028-12-31`, `ngày góp thành 28`, `tháng 12/2026 không góp`.
- Các lệnh sửa mục tiêu áp dụng khi bản nháp có đúng một mục tiêu. Với nhiều mục tiêu hoặc yêu cầu phức tạp, dùng biểu mẫu. Câu không rõ nghĩa bị từ chối, không âm thầm đoán thay đổi.
- Sửa bản nháp hủy preview cũ. Bạn vẫn phải xem thay đổi và xác nhận riêng; Agent không tự chuyển tiền hoặc tạo giao dịch thực tế.

## Android

Hai bản APK có mục đích khác nhau:

- **APK pilot ký:** dùng xem và thao tác với dữ liệu minh họa trên điện thoại; xem [trang APK](../artifacts/android/README.md). Giữ nguyên chứng thư pilot để có thể nâng cấp bản cũ.
- **APK debug tích hợp local:** dành cho kiểm thử với backend trên máy tính, tại `artifacts/android/be19/finweave-be19-local-debug.apk`. Bản này dùng địa chỉ loopback qua ADB reverse, không phải một URL máy chủ công khai. Trên thiết bị thử nghiệm kết nối ADB, cần ánh xạ `tcp:4310` sang `tcp:4310` của máy tính.

Ứng dụng cần Android System WebView có Chromium 120 trở lên cho giao diện hiện tại. Một image Android 11 cũ có WebView 83 sẽ hiện yêu cầu cập nhật. Luồng giao diện native được kiểm trên image Android 15; kiểm Keystore/Room và parser cũng có lượt chạy trên Android 11.

Kết nối thiết bị yêu cầu đồng ý xử lý dữ liệu, mật khẩu và mã xác nhận trong hộp thoại native. Token và khóa ký nằm trong vùng native, không trả vào JavaScript. Nguồn ngân hàng/ví thật chỉ được mở sau khi xác minh hồ sơ ứng dụng và notification; bản thử nghiệm không tự giả có dữ liệu đã thu được.

## Quản trị và bảo trì

- [Admin local](http://127.0.0.1:4183) dùng tài khoản/factor cục bộ riêng. Fixture mặc định của môi trường thử là `operator@ops.test`; cách cấp tài khoản và lấy MFA ở [RUNTIME.md](../finweave-backend/RUNTIME.md). Có thể chạy `Local-Login-Code.cmd --admin` để đọc mã MFA của fixture trên máy của mình.
- Nếu database cũ cần nâng cấp, dùng `node tools/upgrade-local.mjs` sau khi bật PostgreSQL local. Công cụ tạo bản sao lưu riêng, kiểm hash công cụ backup rồi áp dụng migration; không reset dữ liệu. Các bản sao này nằm trong `.local/pre-upgrade-backups`, không đưa lên Git.
- Lịch `FinWeave-Local-Synthetic-Observation` lấy mẫu scheduler mỗi giờ khi máy hoạt động. Xem `docs/execution/evidence/backend-async-observation/latest.json`. Bảy ngày chỉ được đánh dấu đạt sau khi có đủ quan sát thật; lịch sử gián đoạn và bộ đếm cũ được giữ nguyên.
- Muốn gỡ lịch đã tạo, chạy `powershell -NoProfile -ExecutionPolicy Bypass -File tools/observe-local.ps1 -RemoveSchedule`.
- Chạy `node tools/verify-local.mjs` để kiểm tra lại bản local. Mỗi lần chạy lưu kết quả vào thư mục mới dưới `docs/execution/evidence/completion-2026-11-03/`.

Các lượt kiểm thử local không thay nghiệm thu nguồn tài chính thật, phân phối APK qua Play Protect, hoạt động trên mọi OEM, backup ngoài máy hoặc môi trường máy chủ dùng dữ liệu thật. Trạng thái hiện hành và bằng chứng nằm ở [báo cáo hoàn thiện](execution/completion-2026-11-03.md).
