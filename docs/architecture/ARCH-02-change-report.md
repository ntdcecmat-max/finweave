# ARCH-02 — Bản ghi cập nhật S1 + P2

08/10/2026 · **ACCEPTED BY OWNER; DOCUMENTATION UPDATED**. Owner chọn trực tiếp S1 + P2, kế thừa A + T1. [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md) ghi lựa chọn/lý do/giới hạn; đây là delta tài liệu sau r2, chưa có baseline mới hoặc runtime acceptance.

## Các tài liệu chính

| Tài liệu | Nội dung đã chốt |
| --- | --- |
| [ARCH-02](ARCH-02-options.md) | S1 + P2 accepted, alternatives giữ lịch sử; không còn yêu cầu owner chọn lại |
| [Stack ARC-STACK-001](tech-stack.md) — mới | Fastify/TypeScript, pg/parameterized SQL/UnitOfWork, pure Engine, canonical2020-12 validation, durable PG jobs direction, P2 entrypoints; exact versions/platform còn cần kiểm |
| [Module HLD ARC-MOD-001](module-high-level-design.md) — mới | 12 business modules + Engine/shared infrastructure; ownership đủ54 bảng, public/private dependencies, process capabilities và atomic workflow boundaries |
| [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md) — mới | Quyết định owner, S1/P2 rationale, trade-offs, obligations và các ARCH tiếp theo |
| [HLD v0.4](high-level-design.md) | Framework và P2 đã chốt; user/Ops API processes riêng, workers theo quyền; module/transaction section mới |
| [LLD v0.3](low-level-design.md), [views v0.4](views/architecture-views.md) | TxContext/cùng PG client/import boundaries và P2 capability view; chưa triển khai SQL grants/processes |
| [Agenda](architecture-decision-agenda.md), [architecture index](README.md), [topology v0.3](deployment-topology.md) | ARCH-02 accepted; ARCH-03…13 còn chờ; cloud candidate cũ chưa được chọn thành hạ tầng P2 |
| [Handover](../handover/README.md), [operational decisions](../handover/operational-decisions.md) | Delta sau r2 và local S1/P2 direction; không mở rộng acceptance/snapshots hoặc duyệt cloud/cost |

12 tài liệu thiết kế/support được sửa hoặc tạo; báo cáo này và hai JSON evidence là bản ghi bổ sung. Stack hiện hành nằm trong docs/architecture, không khôi phục FinWeave_Tech_Stack.md ở root đã bị xóa.

## Những ranh giới quan trọng

Ops API không nắm finance credentials/pool hoặc private job payload. Agent worker chỉ authorized read/simulate/draft, không actual posting hoặc active-plan confirmation. Worker profiles khác privilege chạy process riêng để có isolation; shared codebase không đồng nghĩa shared secrets. PostgreSQL roles/procedures/negative tests vẫn chưa triển khai.

Owner confirm chỉ ghi Plan/Goals/links/history/replay atomic, không actual ledger. Ledger workflows/correction/reversal+replacement giữ atomicity; một transaction dùng cùng PG client, locks/replay/version/fencing phải có tests. Không transaction xuyên model/provider call. Ledger/read models/clients giữ một nguồn tài chính chuẩn mỗi workspace.

P2 có thể chạy nhiều processes trên cùng host nếu đủ tài nguyên; không tự cần mỗi process một paid service và không bảo đảm free hosting đủ. ARCH-03 cần worker-capable platform/RAM/CPU/pool budgets. Node/dependency patches, jobs library, SQL/schema completeness, sources/model/auth vẫn cần chốt ở các ARCH tương ứng.

## Kiểm tra và trạng thái

- [Document validation](../execution/evidence/arch-02-s1-p2-2026-10-08/document-validation.json): **PASS**,186 local link occurrences hợp lệ, markdown fences cân bằng;54/54 bảng mapped một owner, không thiếu/trùng/lạ; API target2.0.0/133 operations; root Stack vẫn absent.
- [Preservation](../execution/evidence/arch-02-s1-p2-2026-10-08/preservation.json): **PASS**,213 tệp before/after không đổi:174 accepted frontend source files,11 sealed r1/r2 files,28 canonical contract/physical files.
- Whitespace diff check đạt; không chạy backend/frontend suite, SQL/native/security/providers/model/UAT trong nhiệm vụ document-only. View mới là bảng capability, không diagram-render/runtime evidence.
- Không code frontend/backend hoặc dependencies/lockfile/API/schema changes; không commit/push/deploy/service/provider calls/phát sinh phí. Immutable r1/r2 và evidence lịch sử giữ nguyên.

Bước tiếp theo: **ARCH-03 — infrastructure/platform/environment/cost**, đối chiếu khả năng chạy P2; tiếp ARCH-04 DB execution/schema. Giữ đầy đủ BE-01…21 và SEC-REAL-T1/runtime gates.
