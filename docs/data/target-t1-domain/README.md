# PostgreSQL domain target — revision004

**FW-PHYS-T1-DOMAIN-004 — EXPAND DESIGN / SQL NOT AUTHORED OR RUN**. Kế thừa nguyên84 bảng và các trường của [security revision003](../target-t1-security/README.md); thêm2 bảng, không đổi tên hoặc xóa cấu trúc cũ. Counts/hash: [revision](revision.json).

[Full model](target-model.json), [delta](domain-delta.json), [dictionary](data-dictionary.md), [ERD delta](domain-erd.mmd), [migration/grants](migration-plan.md). Dictionary và ERD ở đây chỉ thể hiện2bảng mới; toàn bộ FK hiện hành nằm trong full model, không giả sơ đồ nhỏ là full ERD.

forecast_runs giữ frozen input reference, base snapshot/version, Engine/model/seed/trials, checkpoint pointer và lifecycle. forecast_result_pages giữ trang kết quả private, immutable sau publish. Payloads nằm trong payload_objects typed registry, không generic CRUD; new tables classification finance_private. J2 jobs vẫn authority duy nhất cho dispatch/generation/lease, run không tự giữ lease riêng.

Existing-table addenda làm rõ opening posted once, sealed groups, internal ledger mapping, ordered quantity replay, unique active actual family/scope, snapshot closure và typed forecast job. Đây là targetRules cần chuyển thành checked procedures/constraints khi viếtSQL; declaration lịch sử không tự là SQL executable đúng toàn bộ rules.

[API003](../../contracts/v2-t1-r3/README.md), [Engine docs](../../domain/README.md), [bundle](../../domain/implementation-bundle.json). Trạng thái SQL/RLS/upgrade/restore/domain/concurrency vẫn NOT RUN; không sửa migrations001–003 hoặc các gói ARCH-04…07.
