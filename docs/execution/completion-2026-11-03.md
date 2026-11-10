# FinWeave — hoàn thiện bản local ngày 03/11/2026

Phạm vi bàn giao được chốt theo lựa chọn của chủ dự án: chạy trên Windows hiện tại, có bản Android thử bằng giả lập; máy chủ công khai và email thật để sau. `finweave-demo.com` chỉ là tên miền dự kiến, chưa đăng ký hoặc cấu hình DNS trong lần này.

## Đã hoàn thiện

- Bộ mở app, cài thư viện theo lockfile, lấy OTP local và mở model local: `Setup-FinWeave.cmd`, `Start-FinWeave.cmd`, `Local-Login-Code.cmd`, `Start-Local-AI.cmd`. Backend dùng PostgreSQL lưu bền; user/admin tách cổng và quyền. Trình chạy giữ dữ liệu hiện có và từ chối chiếm cổng của tiến trình khác.
- Agent Qwen/Ollama chạy thật với protocol lựa chọn bằng chứng và đề xuất có giới hạn. Engine cung cấp số tiền và nội dung đề xuất; server kiểm schema, cursor, vòng gọi và ngân sách. Model được làm nóng trước lượt chạy. Không tự ghi giao dịch khi tạo hoặc sửa đề xuất.
- Sửa bản nháp bằng câu tiếng Việt rõ nghĩa; thay đổi làm mất hiệu lực preview cũ, kiểm version và retry. Lệnh nhập nhằng hoặc không xác định mục tiêu bị từ chối. Đây là tập lệnh hỗ trợ có giới hạn, không phải hiểu mọi câu tiếng Việt.
- Native owner broker: kiểm origin trên UI thread, chứng minh khóa cài đặt, đăng nhập/OTP, xác minh lại mật khẩu và OTP trước enrollment, credential nằm trong native. Khôi phục phiên sau khi tiến trình bị đóng vẫn kiểm tra với server.
- Tách rõ APK minh họa đã ký và APK debug nối backend local. Pipeline tự build đúng data mode và đồng bộ Capacitor trước Gradle; bản đã ký nối backend phải có HTTPS origin cụ thể. Giữ chứng thư pilot cũ. Chỉ bản debug bật WebView debugging.
- Migration 012 sửa retention của preview hết hạn mà giữ ràng buộc bất biến của lịch sử tài chính. Công cụ nâng cấp local sao lưu trước, kiểm hash công cụ backup, không reset database. Cả database app và database quan sát đã nâng cấp.
- Lịch lấy mẫu scheduler mỗi giờ; cửa sổ bảy ngày xét lỗi mới trong cửa sổ, vẫn giữ bộ đếm và khoảng gián đoạn lịch sử. Không ghi nhận đạt chỉ vì đã trôi qua bảy ngày lịch.
- Bộ kiểm tra local và cấu hình CI kiểm type, unit, user/admin build và pipeline giá. Workflow CI đã viết; chưa có lượt chạy trên GitHub để kết luận CI remote đạt.

## Bằng chứng đã chạy

Mỗi thư mục là một lượt chạy riêng. Không ghi đè lịch sử thất bại hoặc diễn giải kết quả build thành nghiệm thu thiết bị thật.

| Phạm vi | Kết quả và bằng chứng |
| --- | --- |
| Type, unit, build | 8 nhóm đạt; 77 backend unit, 140 frontend unit, 7 market unit và 7 nhóm market pipeline; [kết quả](evidence/completion-2026-11-03/1793690746218/results.json) |
| Web ↔ HTTP ↔ PostgreSQL | 14/14 integration đạt, gồm sửa draft, vô hiệu preview, retry và không đổi số dư ngoài ý muốn; [manifest](evidence/be19/integration-1793690793002/manifest.json) |
| Assistant PostgreSQL | 33 nhóm regression đạt; [kết quả](evidence/backend-assistant-local-2026-10-11/assistant-1793677029002.json) |
| Model local thật | Hai kịch bản đạt kiểm an toàn và yêu cầu chất lượng của test: điều tra kết thúc PARTIAL khi thiếu bằng chứng; lập mục tiêu tạo DRAFT_READY. 3/4 vòng model, khoảng 8,6/20,4 giây hoạt động; [kết quả](evidence/release-review/real-agent-1793678753212.json). Chưa phải đánh giá held-out hoặc nghiệm thu người dùng. |
| Native Android + web độc lập | 6 luồng đạt trên Android 15 sau sửa tương thích: đăng ký/OTP, preview/commit/retry, web đọc dữ liệu Android, Android đọc dữ liệu web, enrollment có xác minh lại, khôi phục phiên; [kết quả](evidence/completion-2026-11-03/native-1793691579081/results.json). Dữ liệu synthetic và APK debug; hash trùng APK bàn giao. |
| Retention PostgreSQL | 4 nhóm đạt: chỉ xóa preview hết hạn, giữ preview còn hạn, giữ immutable trigger/quyền, chạy lặp an toàn; [kết quả](evidence/completion-2026-11-03/retention-1793678289223.json) |
| Instrumentation Android 11 | 5 test thực thi đạt; 2 test phụ thuộc notification ZaloPay thật bỏ qua, không tính là đạt. Các test JVM native có 44 test. |

Kiểm phát hành phát hiện lời gọi `InputStream.readNBytes` cần API 33 trong broker; đã thay bằng đọc từng khối có giới hạn 256 KiB tương thích Android cũ. Kiểm lại sau sửa:

- [Android build/JVM](evidence/be19/android-1793691388160/manifest.json): PASS, 44 JVM tests; [instrumentation Android 15](evidence/completion-2026-11-03/instrumentation-final-api35.log): 5 test thực thi PASS, các test đòi notification ZaloPay thật chưa chạy.
- [67/67 browser tests](evidence/be19/mockbrowser-1793691405209/manifest.json): PASS, không skip/flaky, source không đổi trong lượt chạy; [mock build user/admin](evidence/be19/mockbuild-1793691402627/manifest.json): PASS.
- APK 0.1.9-pilot versionCode10: release lint/build/sign/manifest/DEX PASS. [Manifest](../../artifacts/android/manifest-0.1.9-pilot.json) và [chữ ký](../../artifacts/android/signature-0.1.9-pilot.txt). Cùng chứng thư pilot; SHA-256 `ae50f5910a3a63eee88b4310a5c3e50201e91bc64acca84794b3e88871847d09`.
- [APK đã ký trên giả lập](evidence/completion-2026-11-03/signed-smoke-1793692066839/results.json): cài/mở, đăng nhập demo và Home PASS; installed package không debuggable. Kiểm WebView debug socket trên thiết bị sản xuất **chưa kết luận** vì image `userdebug` tự mở debugging theo [tài liệu Chromium](https://chromium.googlesource.com/chromium/src/+/HEAD/android_webview/docs/net-debugging.md). Cấu hình release vẫn false; chưa coi đây là nghiệm thu bảo mật thiết bị thật.
- Trình mở app local: backend/user/admin readiness PASS, sau đó dừng đúng dịch vụ của lần smoke. Công cụ mở model đã khởi động thành công runtime/model đã pin trên loopback; không tải model thay thế hoặc dùng cloud.

## Cách sử dụng

Đọc [hướng dẫn local](../LOCAL-QUICKSTART.md). Chạy `Start-FinWeave.cmd`, mở user tại `http://127.0.0.1:5173` hoặc admin tại `http://127.0.0.1:4183`. Mã xác nhận được lấy trên máy bằng `Local-Login-Code.cmd`; chưa có dịch vụ email thật.

APK và giới hạn tương ứng ở [trang bàn giao Android](../../artifacts/android/README.md). Giao diện cần WebView Chromium 120 trở lên; image Android 11 có WebView 83 chỉ dùng cho các kiểm thử native phù hợp và sẽ yêu cầu cập nhật khi mở giao diện.

## Những điều kiện còn cần trước khi dùng dữ liệu thật

| Điều kiện | Trạng thái và việc cần làm |
| --- | --- |
| Nguồn ngân hàng/ví, giá thật | Chưa kích hoạt. Cần quyền sử dụng nguồn, signer/profile, mẫu notification giao dịch thật, đối chiếu amount/direction/time và kiểm trùng. Candidate parser không phải nguồn đã nghiệm thu. |
| Điện thoại thật và phân phối | Chủ dự án chưa có điện thoại kết nối; đã dùng giả lập theo yêu cầu. Cần nghiệm thu OEM, notification/offline/reboot/revoke và Play Protect trên bản phân phối. |
| Quan sát scheduler bảy ngày | Chưa đạt vì lịch sử có gián đoạn và source thay đổi. Tiếp tục lấy mẫu khi máy hoạt động; máy ngủ/tắt không được tính là quan sát liên tục. [Mẫu hiện hành](evidence/backend-async-observation/latest.json). |
| Model đủ chất lượng sản phẩm | Đã chứng minh hai kịch bản thật; vẫn cần held-out tiếng Việt, so sánh baseline, đo lợi ích và nghiệm thu người dùng. |
| Máy chủ công khai/email | Để giai đoạn sau theo lựa chọn hiện tại. Cần máy chủ, HTTPS/domain, mail provider, custody khóa, backup ngoài máy và recovery witness độc lập trước mở production. |

Bản local có thể dùng và kiểm thử trong phạm vi nêu trên. Không đánh dấu toàn bộ 41 tiêu chí sản phẩm hoặc production hoàn tất khi các điều kiện nguồn thật, thiết bị thật và vận hành còn mở. Các báo cáo tháng 10 là bằng chứng lịch sử tại thời điểm viết; trạng thái hiện tại đọc từ báo cáo này và các receipt mới.
