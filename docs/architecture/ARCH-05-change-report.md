# ARCH-05 — API T1 / D1 + J2

08/10/2026 · **ACCEPTED CONTRACT DESIGN / IMPLEMENTATION NOT RUN**. Owner giao tiếp tục theo hướng phù hợp nhất. [ADR-012](adr/ADR-012-unified-t1-contract-revision.md), [working API package](../contracts/v2-t1/README.md).

| Thay đổi | Lý do |
| --- | --- |
| Working OpenAPI3.1/JSON Schema2020-12, revision/hash riêng; payload2.0.0 chưa phát hành | Baseline protected-only và mock cùng nhãn không tự tương thích; giữ lịch sử và chốt một target mới |
| Giữ133 operations, thêm8, tổng141 | Bổ sung native credentials, collector credentials, outcome/reconcile và private import execution |
| OwnerBearer khác DeviceBearer; refresh-purpose riêng; admin OpsIdentity; private mTLS+signature | Collector không được dùng như user session; admin/worker có quyền khác nhau |
| Context null cho identity/admin/global services; tenant context và ticket fence cho worker | Resolve composite keys đúngJ2, không đoán receipt ID là globally unique |
| Durable/rejected ACK union, epochs và recovery/outcome semantics | ACK không là posting; restore/retry không tự tạo trùng hoặc khôi phục quyền đã thu hồi |
| REPLAY_EXPIRED outcome=committed; expired body giữ tombstone; HTTP415 cho media type không hỗ trợ | Không nhận định not_committed khi command cũ đã commit |
| Fresh source/schema/AST/field diff; consumer145 rows; field inventory và41 reviewed storage rules | Không lấy r1 call sites làm hiện trạng; phân parameters/projections với column mappings |
| DB credential/challenge delta và31 runtime acceptance cases | Không coi target70 bảng đã đủ auth hoặc structural PASS là runtime PASS |
| Đồng bộ HLD/LLD/Stack/views/agenda/index/backlog/security/handover | Các nhóm dùng cùng target contract và thấy rõ ARCH-06 follow-up |

Counts và hashes chính xác tại [revision](../contracts/v2-t1/revision.json)/[diff](../contracts/v2-t1/revision-diff.json). [Validation](../execution/evidence/arch-05-t1-2026-10-08/validation.json) ghi OpenAPI/schema/positive-negative fixtures/mapping/links/preservation; [source hashes](../execution/evidence/arch-05-t1-2026-10-08/preservation.json). Structural PASS không là SQL/Fastify/backend/domain/auth/native/Agent/UAT PASS.

Không sửa runtime frontend/dependencies/lockfile, canonicalv2 baseline, DB physical/targetD1J2, r1/r2 hoặc research evidence. Không deploy/cloud/model/provider hoặc tạo tài nguyên trả phí. ARCH-06 tiếp tục identity/session/permissions/challenges/rotation/CSRF/MFA và storage đích; ARCH-07/08/09 giữ các dependencies đã ghi.
