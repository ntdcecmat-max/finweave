# FinWeave0.1.7 — chẩn đoán notification

Người dùng xác nhận đã giao dịch ZaloPay nhưng không thấy thông báo ZaloPay; bấm Test tiền vào vẫn thấy notification giả FinWeave. Metadata thiết bị vẫn0.1.6/Sony-SO01M/Android11, quyền đọc và OS listener binding true, zen_mode0. Chưa kết luận ZaloPay đã phát OS notification hoặc FinWeave đã bỏ lỡ callback.

## Sửa

- Preflight phát notification test kiểm cả quyền app, channel importance NONE và channel group bị tắt; trước đây chỉ kiểm quyền toàn app. Channel vẫn cùng ID/default importance; không tạo channel thay thế hoặc đổi thiết lập người dùng.
- Trạng thái test hiện số thông báo của chính FinWeave mà NotificationManager đang giữ. Chỉ kiểm id/tag do probe phát, không đọc extras hoặc notifications app khác. Không đồng nhất notify() với callback thành công.
- Có nút mở settings đúng channel test FinWeave và app ZaloPay. Chỉ điều hướng, không tự bật permission/channel/priority/Play Protect. Nút ZaloPay kiểm exact app/version/signerset/device trước điều hướng.
- ZaloPay hiện quyền/listener, thời gian còn lại, callback count và số mẫu/sensitive/skipped. Callback count tăng trước lọc summary/OTP/empty/oversize; chỉ exact verified package/phiên opt-in. Không đọc app khác. End-session reason phân biệt chưa bật/dừng/hết hạn/mất gate/nguồn đổi/đầy. TTL không ghi đè lý do khi polling inactive.
- Poll errors được hiển thị, trạng thái chưa tải không bị gọi là quyền denied. UI nói rõ preview không phát thông báo FinWeave sau giao dịch, không đọc màn hình biên lai, không tự ghi tiền thật.
- Giữ mọi collector/source/backend gate,0.1.7/code8 cùng khóa ký pilot. Live registry vẫn0, native identity/backend chưa nối, tiền thật chưa tự ghi.

## Kiểm

Web136tests PASS. Native29tests + template1 PASS; release/lint0errors40warnings PASS. Hai warnings mới chỉ gợi ý KTX toUri. Signature/manifest/DEX/source-assets-APK hashes và API005/JCS/ES256 contract proof PASS. Cài USB0.1.7/code8 Success, process chạy, quyền và OS listener binding PASS; instrumentation chỉ compile. [Kiểm chứng](evidence/android-notification-diagnostics-2026-10-12/verification.json), [thiết bị](evidence/android-notification-diagnostics-2026-10-12/device-install.json). Chưa có callback ZaloPay thật được nghiệm thu. Không thực hiện/chỉ dẫn thêm giao dịch tài chính để test. Không đọc raw notification bằng ADB, không export tài khoản.

Không coi sửa chẩn đoán là sửa push của ZaloPay hoặc được Google Play Protect duyệt. Internet sideload verdict vẫn chưa xác nhận, hồ sơ Google0.1.4 chưa gửi.

Kênh notification tuân theo [Android channel API](https://developer.android.com/develop/ui/compose/notifications/channels): app không tự đổi importance sau khi tạo; người dùng chỉnh trong settings.

Đã điều hướng Android tới settings thông báo đúng package ZaloPay để người dùng kiểm các danh mục; chỉ mở trang, không tự sửa thiết lập. UI danh mục đang chờ người dùng xác nhận. Các phiên RAM cũ mất khi nâng cấp APK; cần opt-in phiên mới, không hồi đọc thông báo lịch sử.

Người dùng xác nhận các danh mục thông báo ZaloPay đều bật; chưa thấy OS notification sau giao dịch. Bài test notification giả FinWeave vẫn hiển thị. Thiết bị thực hiện giao dịch đang chờ xác nhận; không đọc tài khoản/credentials ZaloPay để suy đoán và không công bố lỗi push ZaloPay đã sửa.

Người dùng xác nhận giao dịch trực tiếp trên cùng Sony SO-01M. Metadata: Google Play Services enabled; ZaloPay không stopped, enabled mode0/default; airplane_mode0; RUN_ANY_IN_BACKGROUND chưa có app-op explicit. Không đủ để chứng minh mạng FCM/server push hoặc lý do thiếu notification. Không coi bật mọi danh mục là bằng chứng có OS notification; real callback/parser vẫn NOT_CONFIRMED/NOT_IMPLEMENTED.

Ảnh người dùng gửi tiếp: receipt nạp vào Số dư sinh lời thành công; notification shade có thông báo Gmail/ứng dụng khác, chưa thấy ZaloPay. Metadata ADB xác minh foreground vn.com.vng.zalopay/.miniapp.ui.MiniAppActivity, FinWeave0.1.7 và access/binding true. Không coi receipt là OS notification, không nhận diện Gmail làm nguồn bank/wallet, không lưu amount/ref/order/account/image vào repo. Dòng callback counter/active session đang chờ người dùng báo để phân biệt không có callback với lọc hoặc hết phiên. Không đủ dữ liệu để khẳng định lý do ZaloPay không phát push hoặc loại giao dịch này luôn không phát push.

Ảnh UI FinWeave người dùng cung cấp tiếp xác nhận nguồn ZaloPay11.14.0 đúng app/thiết bị, quyền đọc đã cấp/listener kết nối, phiên đang bật còn10phút, Android đã chuyển1 notification ZaloPay và tạo1 mẫu. Đổi trạng thái real callback sang USER_PHOTO_CONFIRMED. Trường mẫu nằm dưới vùng ảnh nên chưa xác định notification thuộc giao dịch hay marketing, không suy ra số tiền/hướng tiền/finality/binding hoặc tự ghi sổ PASS. Ảnh notification shade trước đó không thấy ZaloPay không đủ chứng minh không có callback; không cần tiếp tục xử lý như source chưa từng phát notification.

Ảnh tiếp theo hiển thị mẫu1: tiêu đề `[TEXT]`, nội dung `[TEXT]`, phiên còn8phút. Xác nhận việc nhận nguồn; không có bằng chứng đây là thông báo giao dịch hay hướng tiền. Code0.1.7 chỉ xuất hình dạng đã che và parser ZaloPay trả TEMPLATE_NOT_VERIFIED; chưa triển khai parser tiền vào/ra. Không thể phục hồi câu chữ/số tiền từ mẫu đã che. Cần mẫu câu chữ do chủ thiết bị tự thay tên/tài khoản/mã giao dịch/số tiền bằng dữ liệu giả trước khi viết và kiểm bộ đọc; không đọc raw qua ADB, không yêu cầu giao dịch thêm. Đếm ngược chỉ là TTL phiên nhận, không phải tiến trình phân loại.
