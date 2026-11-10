# ARCH-13 — Hồ sơ vận hành

**Implementation bổ sung 12–13/10/2026:** [runbooks chạy được local synthetic](runtime-runbooks.md),
[OPS-01…32 runtime scope](runtime-acceptance.json), [real gates còn thiếu](real-gates.md).
Trạng thái DESIGN/NOT RUN bên dưới mô tả baseline ARCH-13; không còn là inventory toàn bộ runtime.

FW-OPS-DESIGN-001 · 09/10/2026 · **DESIGN SPECIFIED / RUNTIME NOT RUN**.

Chọn vận hành local trước; I1 cloud chỉ sau khi đủ tài nguyên/quyền và chi phí đã kiểm. Giữ A+T1, S1+P2, D1+J2, đầy đủ 21 gói backend / 41 AC. Một máy chủ, phát hành có thời gian bảo trì; không thêm Kubernetes, microservices, queue, paid monitoring hoặc tự triển khai.

| Hồ sơ | Nội dung |
| --- | --- |
| [Lựa chọn](architecture-and-options.md) | CI local, release có bảo trì, giám sát nhẹ; alternatives và lý do |
| [Cấu hình và secrets](configuration-and-secrets.md) | Phân môi trường, kiểm startup, custody/quyền/network |
| [CI và release](ci-and-release.md) | Source đã kiểm, artifact pin/sign, các cổng nghiệm thu, APK |
| [Migration/rollback](migration-and-rollback.md) | Một runner, journal/checksum, backfill, tương thích workers/clients |
| [Quan sát và cảnh báo](observability-and-alerting.md) | Health/metrics/logs an toàn, độc lập host và ngưỡng ban đầu |
| [Sao lưu/khôi phục](backup-restore-and-retention.md) | RPO/RTO, witness, khóa và deadline xóa |
| [Runbooks](runbooks.md) | Thủ tục vận hành/sự cố, vai trò, bằng chứng, điều kiện mở lại |
| [Checklist phát hành](release-checklist.md) | Local, staging, real và điều kiện dừng |
| [Thử nghiệm tiếp theo](implementation-and-spikes.md) | Danh sách rủi ro chi tiết và thứ tự thực thi |
| [Truy vết/nghiệm thu](acceptance-plan.md) | OPS-01…OPS-32, không thay 41 AC |
| [Policy](operations-policy.json) / [schemas](operations-schemas.json) | Cấu hình/release/evidence/metadata định kiểu |
| [Bundle/hash](implementation-bundle.json) | API005 / DB005 / native003 và các policy kế thừa |

Đây là hồ sơ thiết kế, không CI đang chạy hoặc runbook đã diễn tập. API vẫn153 operations/634 schemas; DB vẫn87 bảng/1001 cột/162 FK. Không tạo operation/bảng mới. Runtime migration journal thuộc infrastructure schema riêng chỉ được triển khai cùng DDL đã review, không lén tính nó là một trong87 bảng domain.

Các gói ARCH06–12 và snapshot r1/r2 giữ nguyên. Tài liệu tổng quan có notice mới; hợp đồng/policy gốc đã pin không bị ghi đè. [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md) và [báo cáo](../architecture/ARCH-13-change-report.md).
