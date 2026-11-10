# FinWeave — bộ đọc nhiều ngân hàng

Bản local hiện hành: [FinWeave-multi-bank-local-debug.apk](FinWeave-multi-bank-local-debug.apk). [Manifest/hash](manifest-multi-bank.json), [chữ ký](signature-multi-bank.txt), [build và 44 JVM test](../../../docs/execution/evidence/screenshots-2026-11-03/android-multi-bank-build/results.json).

Bộ đọc fields-v2 không giới hạn tên ngân hàng; nhận theo thông tin giao dịch, hỗ trợ số bị che, ảnh thiếu mã và bước xử lý khả năng trùng. Cần backend Windows cập nhật tại `http://127.0.0.1:4310`; OCR không nằm trong APK. Dùng ADB reverse như hướng dẫn bên dưới khi thử local. Bản này ký debug, chưa kiểm camera trên điện thoại thật, giữ nguyên APK pilot và các bản trước. [Chi tiết thay đổi](../../../docs/execution/screenshot-multi-bank-2026-11-03.md).

## Bản trước: nhập ảnh ban đầu

[FinWeave-screenshot-local-debug.apk](FinWeave-screenshot-local-debug.apk) chứa giao diện nhập ảnh, schema và allowlist `scanScreenshot`/`saveScreenshot`. [Manifest và hash](manifest.json), [kiểm chữ ký](signature.txt), [build và 44 JVM test đạt](../../../docs/execution/evidence/screenshots-2026-11-03/android-build/results.json).

Bản này dùng chữ ký Android debug, cùng appId của dự án, không phải APK pilot đã ký để phân phối. Không ghi đè artifact pilot 0.1.9 hoặc bản debug BE19 cũ. Chưa cài/kiểm camera trên điện thoại thật trong lượt này.

Backend chạy trên Windows tại `http://127.0.0.1:4310`. Khi dùng thiết bị/giả lập Android kết nối ADB, ánh xạ `adb reverse tcp:4310 tcp:4310`, mở backend mới bằng `Start-FinWeave.cmd`, rồi vào **Giao dịch** để chọn ảnh. File APK tự nó không chứa bộ OCR Windows và không đọc ảnh khi backend ngoại tuyến.

Giao diện web local đã được kiểm với ảnh giả, OCR thật, lưu bền, chống trùng và bước sửa thông tin. [Cách dùng và giới hạn](../../../docs/product/screenshot-transaction-entry.md).

Lượt build đầu lỗi cache Kotlin. Lượt thành công dọn `:app:clean`, dùng `-Pkotlin.compiler.execution.strategy=in-process`, `-Pkotlin.incremental=false`, `--max-workers=2`, sau đó chạy unit/assemble offline; toàn bộ log cuối được giữ trong evidence. Không sửa khóa ký hoặc baseline sản phẩm.
