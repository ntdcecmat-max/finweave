# Sau ARCH13: thử rủi ro, database và full backend

**Evidence addendum 09/10/2026:** [Local spikes thực nghiệm](../execution/local-spikes-2026-10-09.md) ghi13nhóm synthetic/97caSQL, các lần lỗi, BLOCKED cụ thể và workstreams backend độc lập. Không đóng OPS-SP01…10 hoặc real release gate chỉ bằng subset này.

Các lớp ARCH01–13 đã có thiết kế; SQL/APK/model/production vẫn cần triển khai và kiểm chứng. Giữ đủ21 gói backend,41 AC và toàn bộ AI-FR/NFR. Thử rủi ro sớm, xây toàn backend theo phụ thuộc và kiểm trong lúc xây.

| ID | Thử nghiệm | Đầu vào | Điều kiện đạt / bằng chứng |
| --- | --- | --- | --- |
| OPS-SP01 | PostgreSQL16 local cô lập; executable migrations; quyền/guards và precision | Runtime đã pin, DB disposable; dữ liệu giả lập | Clean install và upgrade001–003 tới DB005; journal/backfill/rollback/concurrency đúng, không chỉ đủ số bảng |
| OPS-SP02 | APK ký thử, notification giả, Keystore/Room; offline/reboot/screen-off/revoke/lost ACK | Android toolchain và thiết bị owner cấp | Bridge003/API005 đúng; giữ identity outbox; không raw/OTP; ghi support/gap matrix trên thiết bị thật |
| OPS-SP03 | Auth/CSRF/native proof/service identity; witness/capsule/backup/locked restore | Credentials và endpoints thử riêng | Deny/replay/fence đúng, credentials cũ sau restore bị từ chối, latest head được xác minh; cùng host chưa chứng minh độc lập |
| OPS-SP04 | Model local: quyết định đúng schema, tiếng Việt, Plan/Goal/điều tra, cold/warm và tài nguyên | Exact model/runtime artifacts; quyền tải và tài nguyên trước khi tải thật | Đo quality/safety/budget và lợi ích so với ba baseline;30 ca công khai không nhận là blind test |
| OPS-SP05 | Quyền nguồn cổ phiếu/vàng, đơn vị/thời điểm/finality; ngân hàng/ví đầu tiên | App/device owner chọn, mẫu được phép, provider entitlement/credentials | Bằng chứng quyền; parser/profile có phiên bản; oracle độc lập về đơn vị; không tự scrape |
| OPS-SP06 | Release/drain/lock; lỗi index ngoài transaction; backfill; rollback khi còn job/APK cũ | Các process và DDL local đã có | Worker cũ không ghi được; giữ attempts/budgets/denies; chặn downgrade không tương thích |
| OPS-SP07 | Daily/manual schedule khi tắt clients, host ngủ/restart,429 và restore quota | J2 và stub trước; nguồn có quyền sau | Quan sát≥7 ngày; ghi missed coverage, quota bền; không bịa giá lịch sử |
| OPS-SP08 | Backup12h candidate, restore/capsule và retention34d+24h | Destination/receiver độc lập thử; đủ scratch | Đo RPO/RTO cả tình huống chậm/lỗi; fresh witness; dữ liệu đã xóa không hồi sinh; packs thực sự purge |
| OPS-SP09 | Host mất, disk/pool/clock/TLS/quota lỗi và cảnh báo ngoài host | Failure domain riêng và contact được duyệt khi có | Timeout/delivery/recovery alerts an toàn; backpressure giữ denial/erasure; không tự tăng phí |
| OPS-SP10 | Tích hợp ba clients, Agent/model thật, nguồn thật, tải và UAT | Backend/adapters/native/providers/model hoàn chỉnh | Đủ41 AC/21 gói; kiểm mọi feature và ghi rõ phạm vi, không che phần thiếu bằng mock |

Thứ tự thực hiện:

1. Chuẩn bị local runtime, disposable DB, executable DDL và harness thử lỗi; làm OPS-SP01/03, chuẩn bị native synthetic.
2. Xây nền backend/auth/Engine/J2; tiếp tục mọi module BE03…18 theo dependencies đã có.
3. Tích hợp adapters, Android, Agent và sources; thực hiện BE19/20 cùng các thử nghiệm tương ứng.
4. Diễn tập vận hành/restore, đo load/quota, hoàn thiện BE21 và UAT toàn sản phẩm.

Có thể chuẩn bị source/model/device độc lập trong lúc xây nền. Thiếu đầu vào thật không chặn code local với stub, nhưng phải giữ real gate chưa đạt. Spike fail thì sửa ADR/schema/contracts có revision rồi chạy lại phần bị ảnh hưởng; không bỏ tính năng, đổi T1 hoặc tự phát sinh phí.

Mỗi evidence ghi giả thuyết, exact source/config/artifact revisions, dataset/quyền, expected/actual, cả lần thất bại và logs đã lọc. Bước tiếp theo cụ thể là **chuẩn bị và kiểm PostgreSQL local disposable**; ARCH13 chưa chạy database.
