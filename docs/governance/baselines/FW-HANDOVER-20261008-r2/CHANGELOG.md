# Changelog r2 — 08/10/2026

- Bổ sung mốc frontend acceptance-2: 67 browser và 131 unit PASS, kèm logs, raw reports, screenshots, source/doc manifests và giới hạn kiểm chứng.
- Đóng gói source/frontend tests đã nghiệm thu cùng tài liệu hiện hành; lưu delta checksum so với r1. Không sửa runtime frontend, dependencies hoặc lockfile trong task ghi nhận.
- Kế thừa API/model/migrations r1 bằng checksum; không tăng API version, không chạy migration hoặc tuyên bố canonical v2 conformance.
- Giữ nguyên toàn bộ snapshot r1 và historical FAIL; không chạy legacy audit ghi đè evidence.
- Bổ sung công cụ standard-library `record_frontend.py` để ghi nhận có giới hạn và kiểm lại ZIP/workspace/parent; không thay workflow full alignment `baseline.py`.
