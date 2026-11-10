# Dọn bổ sung — 28/10/2026

Giải phóng thêm khoảng **6.83 GiB**; cộng hai lượt khoảng **28.22 GiB**.

| Cách giảm dung lượng | Kết quả |
| --- | ---: |
| Xóa 50 mục thừa: bộ công cụ Android trùng, bộ cài PostgreSQL đã giải nén, APK cũ/tạm, máy chủ AI thử nghiệm thay thế, dữ liệu kiểm thử dùng một lần và trace tạm bị bỏ dở | 2.20 GiB |
| Gộp 71 bản sao giống hệt nội dung, giữ nguyên đường dẫn và mã băm bằng hard link | 3.53 GiB |
| Nén Git, giữ đủ 4.001 đối tượng và xóa 10 tệp Git tạm không hợp lệ | 1.10 GiB |

Dữ liệu duy nhất còn khoảng **17.03 GiB**. Tổng kích thước khi cộng mọi đường dẫn vẫn khoảng **20.56 GiB**, vì hai đường dẫn hard link cùng trỏ tới một bản dữ liệu. Các con số tính theo byte dữ liệu; dung lượng cấp phát thật có thể khác với tệp sparse.

## Kiểm tra bảo toàn

- **25 kiểm tra đều đạt**; 1.101 tệp mã nguồn/tài liệu/cấu hình/metadata hiện có giữ nguyên SHA-256.
- Web mở Login/Home/Design và tải worker, JavaScript/CSS thành công.
- APK 0.1.8 kiểm chữ ký thành công; các APK 0.1.2/0.1.4 cần cho script Play Protect được giữ lại và khớp hash.
- Mô hình AI, runtime Ollama và tokenizer/template/license khớp toàn bộ hash đã ghim; các đường dẫn vẫn tồn tại.
- Runtime, staging, observation và các gói phát hành được cấu hình sử dụng vẫn đầy đủ.
- Danh sách 4.001 đối tượng Git trước/sau giống hệt; git fsck toàn bộ đạt, không còn tệp rác Git. Không sửa lịch sử, nhánh, index hoặc các thay đổi có sẵn của người dùng.

## Phần còn lại

SDK và ảnh máy ảo Android, runtime/mô hình AI, thư viện phụ thuộc, bản web hiện hành và dữ liệu đang sử dụng vẫn cần cho các luồng chạy/build/kiểm thử của project. Các báo cáo lịch sử cuối cùng được giữ và giảm bản sao vật lý khi nội dung giống nhau. Việc xóa tiếp các nhóm này sẽ làm mất dữ liệu hoặc phải cài/tải lại công cụ.

Lượt này kiểm bảo toàn, chữ ký và chạy thử HTTP; chưa chạy luồng trình duyệt toàn diện, AI inference hoặc thiết bị Android. Giới hạn thiếu thư viện của bộ kiểm thử đầy đủ đã được ghi trong [báo cáo lượt đầu](cleanup-2026-10-28.md).

[Xem danh sách chính xác và bằng chứng](cleanup-additional-2026-10-28.json).
