# FinWeave — Bộ phân tích ca sử dụng và kiến trúc

Hoàn thiện ngày 28/10/2026 từ 9 hình tham khảo, PRD/SRS/AI-SPEC và mã nguồn trong dự án.

**Mở [báo cáo tổng hợp](report.html)** để đọc sơ đồ, tìm ca theo ID/tên và xem kiến trúc trong cùng một tài liệu. Tài liệu HTML mở cục bộ, không cần server và không gửi dữ liệu lên mạng.

| Nhiệm vụ | Kết quả |
|---|---|
| Hoàn thiện biểu đồ ca sử dụng | [Sơ đồ và danh mục](01-diagrams-and-catalogue.md): 1 tổng quan, 1 xác thực dùng chung, 7 phân hệ; SVG/PNG và PlantUML chỉnh sửa |
| Mô tả từng ca | [Đặc tả](02-use-case-specifications.md): 50 ca chi tiết + 7 tóm tắt cấp hệ thống; đầy đủ luồng và truy vết |
| Tìm hiểu kiến trúc đang dùng | [Phân tích kiến trúc](03-system-architecture.md): backend Fastify/PostgreSQL và hosted demo Worker/D1, 2 hình kiến trúc cùng dẫn chứng |
| Giải thích các điểm đã sửa | [Đối chiếu hình gốc](04-review-and-mapping.md): sửa ID trùng, include/extend, phạm vi actor và bước nội bộ |

[Model JSON](use-case-model.json) là dữ liệu dùng sinh đặc tả và sơ đồ. PlantUML nằm trong `diagrams/`; SVG và PNG mở trực tiếp hoặc chèn vào báo cáo. Số ca là cách phân rã của tài liệu này, không phải số API operations hoặc số AC nghiệm thu.

Điểm kiến trúc quan trọng: backend nghiệp vụ là **modular monolith nhiều process**, sử dụng Fastify/TypeScript và PostgreSQL; **bản demo đã publish dùng Cloudflare Workers + D1 riêng**. Có kiểm thử local trong hồ sơ không đồng nghĩa model thật, nguồn ngân hàng thật, Android E2E và production đã nghiệm thu.

Lượt này chỉ tạo bộ tài liệu phân tích và công cụ dựng tài liệu, không thay runtime/baseline cũ. [Biên bản kiểm tra bộ tài liệu](validation.md) ghi phạm vi kiểm mới; bằng chứng triển khai lịch sử được dẫn riêng trong phần kiến trúc.
