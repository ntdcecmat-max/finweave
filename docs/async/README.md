# ARCH-09 — Xử lý nền và đồng bộ

09/10/2026 · **ACCEPTED DESIGN theo hướng đã được ủy quyền; RUNTIME NOT RUN**. Policy **FW-ASYNC-J2-001**. Giữ A+T1, S1+P2, I0+I1, D1+J2, đủ 21 mục backend REQUIRED / 41 AC; không sửa code frontend hoặc các gói đã chốt.

| Tài liệu | Nội dung |
| --- | --- |
| [Queue/lease/fence](queue-protocol.md) | Một delivery authority, lock order, heartbeat, thời hạn, retry và cancellation |
| [Thông báo/offline/restore](notification-sync.md) | Native outbox, ACK, hai lớp dedupe, retention, recovery và coverage gap |
| [Giá và lịch chạy](price-scheduler.md) | Daily/manual, coalesce, quota bền vững, catch-up, last-good và quyền nguồn |
| [Imports/Assistant/Agent/forecast/Ops](workflow-lifecycles.md) | Không bỏ chat cũ; atomic import, clarification không giữ lease, tính dự báo riêng luồng HTTP |
| [Client sync](client-sync.md) | Polling, phiên/epoch/version, kết quả chưa xác định và giới hạn offline |
| [API/storage addendum](contract-storage-addendum.md) | API004 sửa CSV selectors, bổ sung coverage phân trang; DB005 hoàn thiện metadata thực thi |
| [Sequences/states](sequences-and-states.md) | Ranh giới commit và các race quan trọng, không giả query làm worker |
| [Acceptance](acceptance-plan.md), [traceability](requirement-traceability.csv) | 32 ca runtime, tất cả NOT RUN; refinements không tăng 41 AC |
| [Policy](async-policy.json), [registry](job-registry.json), [transitions](job-transitions.csv) | Các cấu hình ban đầu có phiên bản; không coi timings là SLO đã đạt |
| [Bundle/hashes](implementation-bundle.json) | Pin API003, DB005, Engine và security addenda |

Chọn **narrow SQL queue ports trên `pg`** cho schema J2 hiện có. Không thêm Redis, cloud queue hay thư viện mang queue schema khác. PostgreSQL là nơi lưu receipt/domain/job và commit nguyên tử; process worker chỉ thi hành đúng capability. Chỉ lấy `SKIP LOCKED` để chia work, không dùng nó tính số dư hoặc lấy snapshot tài chính. [PostgreSQL SELECT](https://www.postgresql.org/docs/18/sql-select.html) giải thích giới hạn của cách đọc này.

[API004](../contracts/v2-t1-r4/README.md) có **153 operations / 634 schemas**: kế thừa151 operations, thêm2 queries coverage; sửa2 schema đã phát hiện sai/thiếu. Đây là revision target chưa phát hành, cần adapter migration, không sửa API003. [DB005](../data/target-t1-async/README.md) có **87 bảng / 1001 cột / 162 FK** ở mức thiết kế: thêm policy/deadline cho job, con trỏ input của refresh và một bảng quota riêng. Số lượng không là bằng chứng chạy đúng. SQL, network, Android, provider, model, concurrency, performance, security và UAT chưa chạy.

Các ví dụ mô hình chỉ kiểm quy tắc quyết định và ranh giới; không chứng minh worker, scheduler, thiết bị hoặc database đã thực hiện được. Bước tiếp theo **ARCH-10 Android**: thiết kế listener/WorkManager/Keystore/outbox, đóng gói và ký APK, support matrix và các ca kiểm OS/OEM thực tế.
