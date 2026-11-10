# ADR-020 — Vận hành local trước và phát hành có bảo trì

09/10/2026 · **ACCEPTED DESIGN / IMPLEMENTATION NOT RUN**. Đây là chi tiết trong A+T1, S1+P2, I0+I1 có điều kiện và D1+J2 đã được giao tiếp tục; không cấp quyền provision, chi phí hoặc deploy.

Hệ thống một host cần giữ đúng source/version/schema/workers/clients trong lúc nâng cấp. Rollback không được reset dedupe, quyền đã thu hồi, quota/budgets hoặc mất dữ liệu tài chính. Các lớp ARCH01–12 đã có hợp đồng và LLD, chưa có bằng chứng runtime.

Chọn CI local trên dữ liệu giả lập, hosted CI tùy chọn sau kiểm quota và quyền. Build/test/hash/sign cùng artifact. Release theo maintenance→drain/fence→migrate→kiểm riêng→mở lại. Migrator độc lập có checksum journal và đối chiếu catalog cho phase ngoài transaction. Chỉ rollback code nếu tương thích DB/jobs/payloads/clients đang có; không tự down-migrate hoặc restore DB.

Giữ secrets theo process, volume mã hóa và P2 least privilege; metrics tổng hợp và cảnh báo ngoài host. Kế thừa restic off-host append-only, witness, age capsule và deadline xóa. Lịch backup12h là candidate tạo khoảng dự phòng cho mục tiêu RPO24h chưa đo. Giữ toàn bộ21 BE/41 AC/Agent, API005/DB005/native003 không đổi.

Hosted auto-CD, rolling/blue-green, Kubernetes, managed KMS, monitoring lớn hoặc PITR có thể xem lại khi có nhu cầu đo và ngân sách. CI trên finance host, Docker socket cho app/Ops và rollback bằng reset DB/legacy queue không được chọn. Không hứa HA, zero downtime hoặc zero loss.

Exact toolchain/signer/destinations/alerts/account/capacity/quota còn là gates triển khai. Infrastructure migration journal nằm ngoài87 bảng domain và cần DDL/grants đã review trước thực thi. Nguồn/model/native/security/UAT vẫn NOT RUN. [Operations](../../operations/README.md) · [Acceptance](../../operations/acceptance-plan.md) · [Report](../ARCH-13-change-report.md).
