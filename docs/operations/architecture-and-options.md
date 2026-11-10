# Phương án và ranh giới vận hành

## Lựa chọn trong hướng đã duyệt

| Quyết định | Chọn | Alternatives / điều kiện xem lại |
| --- | --- | --- |
| CI | Chạy cùng tập lệnh local trên dữ liệu giả lập; hosted CI tùy chọn sau kiểm account/quota | GitHub Actions cần pin actions/quyền và tránh overage; không tự đăng ký. Không public repository để lấy free |
| Release | Build một lần, kiểm/ký, chuyển đúng artifact; stop/start trong maintenance | Blue/green hoặc rolling chỉ sau có hai writer fences, DB/job backward compatibility và capacity; hiện không hứa zero downtime |
| Supervisor | Linux systemd quản Compose/process profiles; Windows I0 chạy local harness tương đương | Không Kubernetes/Vault/Redis mới. Exact OS/runtime/image/tool versions cần pin trước build |
| Monitoring | Aggregate collector nội bộ + log rotation + heartbeat/alerts ngoài host | Prometheus/Grafana có thể thêm nếu đo cần; chưa cài, chưa chọn alert vendor |
| Backup | Kế thừa pg_dump custom + restic off-host append-only, custodian prune độc lập | WAL/PITR phù hợp khi cần RPO thấp hơn/DB lớn; cần thiết kế retention/keys/witness/chi phí và restore riêng |

CI và release có cùng trust boundary: mã PR/dependency/untrusted test có thể thực thi, không được chạy trên finance VM, giữ secret thật hoặc có Docker socket/production access. App-admin chỉ xem aggregate và yêu cầu các thao tác có hợp đồng; không là root, không deploy/migrate/prune/restore/erase qua dashboard. Người vận hành trusted infrastructure có trách nhiệm các runbook đặc quyền; AI chuẩn bị và thực hiện các bước local được giao, còn tài khoản, thiết bị, dữ liệu/quyền riêng và chi phí cần đầu vào thật.

P2 giữ tách user-api, ops-api, ingestion/import, Market, Assistant/Agent, Forecast và retention capabilities; scheduler chỉ enqueue, witness coordinator deny-only, backup reader trusted, migrator DDL riêng. Shared code/DB/J2 không biến chúng thành microservices. Không cho Ops API pool finance, không dùng container names/labels làm bằng chứng isolation.

Health/readiness, restore unlock, provider enable và release approval là các trạng thái khác nhau. Một API liveness xanh không chứng minh ledger/authorization/native/Agent đúng. Full product completion vẫn cần toàn bộ41 AC, 21 BE và mọi use case Agent; real gate chưa đạt chỉ chặn bật thật, không xóa tính năng/backlog.

Nghiên cứu: [GitHub security](https://docs.github.com/en/actions/reference/security/secure-use), [billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [Docker daemon](https://docs.docker.com/engine/security/protect-access/). Chọn local/maintenance/thresholds là quyết định dự án; không vendor SLA.
