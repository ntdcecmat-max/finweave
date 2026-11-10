# API T1 — revision004 / Async & coverage

09/10/2026 · **FW-API-T1-D1J2-004 — ACCEPTED DESIGN / NOT IMPLEMENTED**. [OpenAPI](openapi.json), [schemas](schemas.json), [hash pin](revision.json), [diff](revision-diff.json), [examples](examples.json). Body contractVersion2.0.0 vẫn là unreleased target; X-FW-Contract-Revision exact004. API003, các gói cũ và r1/r2 giữ nguyên.

**153 operations / 634 schemas**:151 paths kế thừa chỉ đổi revision metadata/header;624/626 inherited schemas giữ nguyên. Sửa `previewImportInput` và `getSyncStateOutput`, thêm8 schemas cho2 owner queries. Đây là wire change có chủ đích trong target chưa phát hành, không tự suy tương thích với consumers prototype/hybrid hay003.

| Thay đổi | Quy tắc |
| --- | --- |
| previewImport.mapping | date/amount/description/debit/credit/currency là tên cột1…120 ký tự; reference nullable. signed_integer_vnd cần amount; debit_credit_vnd cần debit+credit. Semantic parser kiểm tồn tại/uniqueness/header interpretation, dateFormat, currency và row value bounds |
| getSyncState | Thêm coverageComplete/deviceIdsComplete bắt buộc. false nếu trả subset do count/bytes; coverageComplete bao gồm cả nested gaps. Không truncate không báo hoặc coi lack of notification là complete coverage |
| listCoverage | accountIds=null nghĩa mọi authorized accounts; array1…100 unique là filter. Items≤100/page với lastObserved/lastAck date-time nullable, trackingStart, gapCount, hasOpenGap |
| listCoverageGaps | Cùng account filter; periodStart/endExclusive cùng null hoặc cặp timestamp hợp lệ. Intersect interval start<endExclusive AND (gap.end null OR gap.end>periodStart), không chỉ gap bắt đầu trong kỳ. Items là từng gap, không nested list vô hạn |

Page input cursor=null ở trang đầu, pageSize1…100. Output page có nextCursor/snapshotId/asOf timestamp/coverageVersion/recoveryEpoch. Private snapshot bind owner/workspace/filter/period/ordering/control version/epoch/schema; stable order accountId cho summaries và(start,id) cho gaps; immutable facts refs/payload pages pin trong existing snapshots/payload_objects. Cursor signed TTL30min, current authorization kiểm mọi lần, expired/conflict trả CURSOR_INVALID và fetch lại, không tự đổi snapshot giữa pages. Coverage version là workspace control/version sequence đã capture, khác financialVersion trong Reply. Không cap tổng records; mỗi page≤256KiB, pageSize là ceiling, cursor progress không bỏ rows. Schema/ref/hash checks chưa là pagination/authorization runtime PASS.

[ARCH-09 semantics](../../async/README.md), [consumer delta](consumer-delta.md), [permission matrix153](../../async/operation-permissions.csv), [security overlay153](../../async/operation-security-overlay.csv), [DB005](../../data/target-t1-async/README.md), [bundle](../../async/implementation-bundle.json). Queries chỉ owner cookie OR OwnerBearer; collector/app-admin không finance/coverage read. Không read-side advance queue.

API004 không thêm recovery replay authority: reconcile missing sau restore vẫn investigation/Review; không tái gắn owner_epoch hoặc tự post. SQL/security/Fastify/adapters/native/provider/UAT **NOT RUN**.
