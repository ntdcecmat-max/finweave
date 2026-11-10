# Database target005 — Async execution

**FW-PHYS-T1-ASYNC-005 · EXPAND DESIGN / SQL NOT RUN.** [Model](target-model.json), [revision/hash](revision.json), [dictionary](data-dictionary.md), [migration/grants](migration-plan.md). Kế thừa DB00486bảng/988cột/161FK; target005 **87 bảng/1001cột/162FK**, thêm1bảng và3trường, không phá bảng/trường cũ trong expand model.

| Bổ sung | Vì sao |
| --- | --- |
| jobs.policy_version, deadline_at | Retry/restart/deploy không đổi luật hoặc gia hạn deadline âm thầm |
| refresh_jobs.request_payload_id | Freeze selection/rights/profile và parent/child manifests, request intents thay vì đọc lại live holdings |
| provider_quota_buckets | Shared-credential + per-entitlement quota/cooldown bền vững; ops_quotas không là private authority |

Logical payload kinds mới refresh_input/refresh_checkpoint/coverage_snapshot dùng existing payload_objects/snapshots; không tạo generic CRUD. Registry, attempt/request CAS và scope validity phải kiểm bằng procedures dưới cùng UoW. Jobs không giữ finance body. Old domain delivery columns/indexes chỉ lịch sử expand, phải cutover về J2 duy nhất.

[Security classification87](../../async/table-data-classification.csv), [bundle](../../async/implementation-bundle.json), [acceptance](../../async/acceptance-plan.md). Retention/witness/restore giữ ARCH-07. API004 là target153operations/634schemas, consumers chưa migrate. No executable migration, database, upgrade/restore or grants tests have run.
