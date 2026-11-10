# Operational API — nguồn chuẩn bàn giao v2

08/10/2026. Tài liệu delta v0.1 ngày07/10 được [giữ lịch sử](../governance/baselines/handover-before-2026-10-08/docs/contracts/operational-api-spec.md). Implementation đã có18 contracts operational additive; chưa có backend thật. Delta không còn là nguồn API hiện hành.

[OpenAPI v2 canonical](v2/openapi.json) chứa133 operations bao phủ cả70 business v1+6 identity, catalogue/collector/receipt/sync, Agent/drafts, admin và internal worker/scheduler. [Package index](v2/README.md), [semantics](v2/semantics.md), [lifecycle](v2/lifecycles.md), [migration](v2/migration.md), [consumer mapping](v2/consumer-operation-mapping.csv) quy định các khoảng cách với implementation. Examples/schemas/CSV dẫn xuất từ nguồn chuẩn; không sửa frontend để che khác biệt.

Đường `/__mock/...` chỉ synthetic MSW; adminGateway là adapter memory riêng, native bridge chưa có Kotlin. Public logical JSON chỉ dành synthetic; real finance phải sealed tới approved protected workload, protocol chưa qua PoC. [Security](../security/security-design.md) và [ADR-007](../architecture/adr/ADR-007-technical-handover-baseline.md) là gate.
