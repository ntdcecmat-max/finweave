# ADR-016 — PostgreSQL dispatch và đồng bộ có kết quả rõ ràng

09/10/2026 · **ACCEPTED DESIGN theo ủy quyền tiếp tục; IMPLEMENTATION NOT RUN**. Kế thừa ADR-008…015 và lựa chọn J2, không mở lại microservices hoặc queue vendor.

## Quyết định

Chọn narrow `pg`/SQL queue ports trên jobs/job_attempts/scheduler_state hiện hành. Transactional domain+enqueue; typed registry6job kinds, capability riêng, one lease authority. Claim workspace anchor trước job lock, DB-time live generation/token/epoch; atomic effects/domain result/replay, bounded retry/deadline/cancel. LISTEN/NOTIFY nếu dùng chỉ wake-up, periodic due scans vẫn authority; không đưa private IDs/payload vào channel. [PostgreSQL NOTIFY](https://www.postgresql.org/docs/18/sql-notify.html) gắn delivery với transaction, không thay durable queue.

Native encrypted outbox/ACK journal có count/byte/age bounds, ACK≠posted; semantic dedupe tách transport identity. Restore áp witness/denies và fence trước uploader/workers; missing không tự cho phép repost. Daily fetch18hVN server-side + latest catch-up, exact frozen selection/coalesce, persistent shared provider quota và cooldown, giữ last-good/provenance. Các timings là starting config, không guarantee uptime/timing của free VM/Android/provider.

Import selected set atomic/pinned; Assistant Q&A cũ giữ local typed message worker; Agent clarification release lease và cumulative budget không reset; forecast CPU trên bounded worker_threads pool trong supervisor process, không block heartbeat hoặc publish incomplete paths. Ops safe control và global retention không tạo fake tenant jobs hoặc cấp app-admin finance read.

API target004153operations/634schemas sửa CSV selectors và bounded sync completeness, thêm2queries coverage phân trang. [DB005](../../data/target-t1-async/README.md)87bảng/1001cột/162FK thêm queue policy/deadline, refresh input pointer và private quota counters. Không sửa các artifact/API/DB/security/identity/domain cũ; [bundle](../../async/implementation-bundle.json) pin các addenda chính xác. Consumers chưa migrate.

## Alternatives và consequences

Queue library mang schema riêng (pg-boss/Graphile hoặc tương tự) có ưu điểm framework nhưng tạo thêm migration/mapping/fence surface cho J2 đang thiết kế; không chọn mặc định và không nhận đã nghiên cứu benchmark/version của chúng. Redis/vendor queue làm mất atomic cùng PostgreSQL nếu không thêm outbox, chi phí/vận hành không cần cho hướng hiện tại. Domain-specific leases trái J2 đã chọn.

Narrow SQL ports cần tự kiểm concurrency/reaper/metrics/fairness/cutover nghiêm túc; đây không là shortcut đã được chứng minh. Single PostgreSQL/host có failure surface chung; không HA/exactly-once network/zero-loss restore. Bounded budgets có thể trả capacity/error, phải benchmark/tune để phục vụ toàn bộ feature, không giảm fidelity hoặc cắt feature. API004 là wire change trong target chưa phát hành, phải adapter/test, không “hybrid tương thích tự động”.

## Kiểm chứng và bước sau

[32 cases](../../async/acceptance-plan.md) tất cả NOT RUN; [report](../ARCH-09-change-report.md) tách static/schema/model/preservation khỏi runtime. Chưa SQL004+, worker/backend/native/provider/model/security/UAT. ARCH-10 chốt Android listener/queue/keystore/permission/support/APK; ARCH-11sources, ARCH-12Agent, ARCH-13operations vẫn cần hoàn thiện và thử rủi ro. Không deploy/provision/chi tiền/gọi nguồn thật/commit/push hoặc sửa frontend.
