# Cập nhật frontend theo bộ UI/UX ngày 08/10/2026

Phạm vi: mở rộng frontend hiện có theo `docs/design/operational-design-delta.md` và các đặc tả màn, Android, admin, Agent. Giữ năm mục điều hướng người dùng, các thao tác tài chính thủ công, CSV, hội thoại và linh vật. Không phục hồi mục Báo cáo đã được người dùng yêu cầu bỏ trước đó.

## Web người dùng

- Tài khoản & tài sản: luồng thêm cổ phiếu bằng mã và số lượng, chọn đúng sàn; vàng xác nhận bảng giá/loại vàng rồi nhập số chỉ. Tài sản đang có được xác nhận lại mã/bảng giá mà không thay số lượng hay lịch sử.
- Giá: yêu cầu cập nhật, tiến trình, kết quả từng tài sản, thời điểm giá và lần lấy dữ liệu; giữ giá gần nhất khi thiếu kết quả. Dữ liệu và tác vụ hiện dùng adapter minh họa, chưa kết nối thị trường thật hoặc lịch chạy hằng ngày trên server.
- Dữ liệu: nguồn dữ liệu, chi tiết nguồn, thiết bị & đồng bộ, hướng dẫn thiết lập Android, quyền và ánh xạ tài khoản, kết quả tiếp nhận và đường dẫn sang Review/giao dịch. Tiếp nhận thành công không tự đồng nghĩa đã ghi sổ.
- Plan/Goals: Agent tham gia cùng hội thoại; thu thập ràng buộc, tạo và chỉnh bản nháp bằng biểu mẫu hoặc câu lệnh được hỗ trợ, liên kết kế hoạch thu/chi/đầu tư với mục tiêu. Liên kết không tự trừ tiền góp lần hai.
- Dự tính bản nháp dùng lại Financial Engine: thu nhập, chi tiêu, tài sản, các kế hoạch đang có, lịch góp/ngoại lệ, quỹ dự phòng và giả định lợi suất/lạm phát. Có biểu đồ phân vị, bảng theo thời gian, cảnh báo khả năng góp và so sánh mức góp thấp hơn 20%.
- Trước áp dụng có bảng thay đổi, xác nhận riêng, phiên bản dữ liệu, mã nội dung và hạn của bản xem trước. Dữ liệu nền thay đổi thì phải tính lại; thử lại cùng yêu cầu không nhân đôi mục tiêu/kế hoạch. Áp dụng bản nháp không tạo giao dịch thực tế.

Các route chính: `/home/assets`, `/data`, `/data/sources/:id`, `/data/devices`, `/data/android`, `/plan`, `/plan/goals`, `/plan/drafts/:id`, `/ai` và panel cùng hội thoại.

## Giao diện Android và ranh giới native

Đã thêm các bước đồng ý sử dụng, chuyển tới quyền hệ thống, chọn nguồn hỗ trợ, gắn tài khoản, kiểm tra tiếp nhận, hàng đợi và xác nhận xóa dữ liệu cách ly. Bố cục thích ứng điện thoại; có giao diện cầu nối native, xử lý Back và dừng/cách ly khi đăng xuất.

Trình duyệt chỉ cung cấp luồng minh họa được người dùng chọn rõ ràng. Không giả cấp quyền Android hoặc giả thiết bị đã kết nối. `capacitor.config.json` và [hướng dẫn tích hợp](../../finweave-web/android-shell/README.md) mô tả ranh giới đóng gói.

**Chưa có dự án Gradle, collector Kotlin, hàng đợi mã hóa độc lập, tích hợp enrollment/backend thật hay APK được ký.** Chưa kiểm trên điện thoại; không coi responsive web hoặc tệp cấu hình Capacitor là APK đã hoàn thành.

## Admin riêng

Điểm vào và bản dựng riêng, phiên admin riêng, hợp đồng chỉ nhận metadata vận hành. Các màn: tổng quan, tài khoản/thiết bị hỗ trợ, nguồn dữ liệu, tác vụ, hạn mức, phiên bản, sự cố/nhật ký. Không nhập store tài chính, giao dịch, nội dung chat hay thông báo thô của người dùng vào admin.

Thử lại tác vụ và tạm ngừng nguồn có lý do, bản xem trước, xác nhận, kiểm phiên bản và nhật ký. Hạn mức/phiên bản chỉ đọc; không tạo nút tải APK khi chưa có bản phát hành. Adapter admin hiện là minh họa; chế độ dịch vụ thật chưa được cấu hình sẽ báo chưa khả dụng.

Từ thư mục `finweave-web`, `npm run dev:admin` mở máy chủ admin tại `http://127.0.0.1:4183/admin/overview`. Lệnh `npm run build:admin` xuất `dist-admin`; web người dùng vẫn dùng các lệnh cũ.

## Giới hạn và bàn giao

Đã bổ sung hợp đồng operational prototype có nhãn 2.0.0 (khác canonical API v2 bàn giao) và adapter minh họa có xác thực/phiên bản cho các luồng mới, cùng hợp đồng admin riêng. Đây chưa phải triển khai API production, nhà cung cấp LLM, dữ liệu vĩ mô trực tiếp, tác vụ nền thật hoặc bảo đảm an ninh production. Agent dùng kịch bản minh họa có giới hạn; chỉnh hội thoại ngoài các mẫu hỗ trợ sẽ được hướng dẫn sang biểu mẫu.

Kết quả rà soát và chạy lại hiện hành nằm ở [báo cáo nghiệm thu frontend](../testing/frontend-acceptance-report.md). Lượt trước rà soát ghi **24 passed, 35 failed**; bản raw và log đã giữ trong [baseline](evidence/frontend-review-2026-10-08/baseline/). Các lỗi có cả test lỗi thời và lỗi sản phẩm, không được gọi toàn bộ là lỗi UI thực tế. Unit trước rà soát 130 tests pass; bản mới phải đọc cùng timestamp/hash của lượt chạy tương ứng. Không chạy generator v1 cũ để lấy chứng nhận canonical v2. Những file gốc `relocated_unverified` vẫn chưa có direct original-hash proof; không dùng manifest kế thừa làm PO sign-off. Native, backend thật, security và UAT vẫn cần evidence riêng.
