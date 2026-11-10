# Database đích — D1 + J2

FW-DB-T1-D1-J2-001 · 08/10/2026 · **ACCEPTED DESIGN / SQL IMPLEMENTATION NOT RUN**. Owner chọn D1 + J2 tại [ADR-011](../../architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md). Kế thừa A + T1, S1 + P2, I0 + I1 và toàn bộ feature/backlog; không thay API wire hoặc frontend.

Đây là working design tiếp nối [54 bảng/610 cột synthetic](../physical/README.md), không thay baseline r1/r2 hoặc migrations001–003. **Expand design:70 bảng/782 cột**, gồm54 bảng kế thừa và16 bảng bổ sung. Cột legacy còn trong expand để backfill/đối chiếu; con số này không là kích thước schema sau contract hoặc mục tiêu phải giữ. Model/ERD không tự tạo bảng.

| Hồ sơ | Dùng để làm gì |
| --- | --- |
| [Target model](target-model.json), [inventory](table-inventory.csv) | Kiểu/nullability/ownership/rules của expand design; ghi rõ constraints và cột nào cần thay sau backfill |
| [ERD](erd.md), [Mermaid source](erd.mmd) | Đủ70 entities/141 FK thiết kế, gồm110 FK baseline; typed references không giả làm FK |
| [Dictionary](data-dictionary.md) | Toàn bộ782 cột expand; baseline declarations giữ provenance; ý nghĩa bổ sung và retention theo domain |
| [Migration plan](migration-plan.md) | Expand/backfill/verify/cutover/contract004+, runner/checksum, upgrade/rollback/restore |
| [Invariants/workflows](invariants-and-workflows.md) | Seal ledger, planning revisions, precision, locks, history/cache, queue/recovery |
| [Permissions](permissions.md) | P2 role/capability design; không dùng broad fw_worker cho mọi worker |
| [API/storage delta](api-data-delta.md), [133-operation dependency overlay](operation-storage-overlay.csv) | Storage transformations bổ sung trên canonical2.0.0; chưa là query/endpoint conformance |
| [Finding disposition](finding-disposition.csv) |17 findings có thiết kế xử lý và điều kiện test; chưa đóng lỗi bằng tài liệu |

##16 bảng bổ sung và lý do

| Nhóm | Bảng | Vai trò |
| --- | --- | --- |
| Jobs | jobs, job_attempts, scheduler_state | Một authority claim/retry/fence/catch-up, typed references; không chứa finance payload |
| Planning | planning_scopes, planning_revisions, planning_revision_items | Định danh Plan/standalone và item version bất biến, tránh trùng plan_version giữa các Plan |
| Read models | projection_cache | Cache có TTL riêng khỏi facts/history đã được pin |
| Imports | import_rows | CSV staging theo row, tránh nhét cả file vào một JSON256KiB |
| Admin identity | admin_principals, admin_sessions, admin_mfa_factors, admin_challenges | Tách danh tính/phiên/MFA admin khỏi customer sessions; ops_accounts vẫn là metadata khách hàng |
| Payload lifecycle | payload_objects | Tách phần nhạy cảm có thể hết hạn khỏi identity/replay tombstone bất biến |
| Recovery | recovery_journal | Fence delete/revoke/restore; cần checkpoint độc lập ngoài backup được phục hồi |
| Safe Ops control | ops_control_requests | Admin gửi yêu cầu đã lọc; dispatcher kiểm quyền và gọi owner service |
| Migrations | migration_journal | Kiểm checksum/schema revision; chỉ migration runner được ghi |

Tên/bảng jobs là logical storage contract. ARCH-09 chọn thư viện/implementation có thể map sang schema thư viện với ADR/delta, nhưng **không được có hai authority lease**. Auth storage là logical contract; ARCH-06 chốt credential/MFA mechanism. Không có external identity provider hoặc queue package nào được chọn ngầm.

## Trạng thái và thứ tự tiếp theo

Chốt hướng D1 + J2 và đặc tả đích; còn ARCH-05 contracts, ARCH-06 identity, ARCH-07 privacy, ARCH-08 Engine, ARCH-09 queue để hoàn thiện implementation details. Sau đó viết/review SQL004+ và chạy clean install + upgrade disposable PostgreSQL, negative tenant/role tests, domain/concurrency, backup/restore. **Không chạy migrations001–003 đơn lẻ rồi coi đã nhận D1 + J2.** Không có DB/role/auth/queue/security evidence mới từ lượt thiết kế này.
