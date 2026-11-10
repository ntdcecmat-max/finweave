> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# Architecture package — current M2 frontend mock

ARC-PKG-001 · v0.3 ·06/10/2026. [ADR004](adr/ADR-004-stateful-mock-and-read-model.md) implements same-app network/read model; logical1.1.0 has70business+6identity/64baseschemas. [Integration Handover](../testing/integration-handover.md), [Acceptance](../testing/frontend-acceptance-report.md) and [current catalogue](../execution/evidence/step6-action-coverage.md) supersede wiring status below. Real transport/security integration remains BLOCKED_SECURITY_POC.

## Bước4 architecture baseline retained

# Bước 4 — kiến trúc/contract và giao diện hệ thống

ARC-PKG-001 · v0.1 · 06/10/2026 · chuẩn bị M2 trong cùng `finweave-web`. [Danh mục đầy đủ](../execution/evidence/step4-action-coverage.md), [Validation/Gate bước4](../execution/evidence/step4-validation-report.md).

| Deliverable | Nguồn hiện hành |
|---|---|
| HLD | [high-level-design.md](high-level-design.md) |
| Architecture Views | [views/architecture-views.md](views/architecture-views.md),5views |
| ADRs | [ADR-001 frontend kế thừa](adr/ADR-001-frontend.md), [ADR-002 reuse/contracts](adr/ADR-002-contracts-and-m2-reuse.md), [ADR-003 protectedboundary](adr/ADR-003-privacy-boundary.md) |
| LLD | [low-level-design.md](low-level-design.md), pipeline/query/cache/guard/import/job/AI |
| API/DTO/examples/services | [Contract package](../contracts/README.md),66business+6identityoperations,63namedbase schemas; generatedOpenAPI/JSONSchema/examples; typedservices incode |
| File/Event contracts | [file-event-contracts.md](../contracts/file-event-contracts.md) |
| Source-to-Target Mapping | [source-to-target-mapping.csv](../contracts/source-to-target-mapping.csv),48maps |
| Error/Auth/Idempotency models | [error-auth-idempotency.md](../contracts/error-auth-idempotency.md) |
| Data models | [logical-data-model.md](../data/logical-data-model.md),DR01…22 |
| Security design/PoC blockers | [security-design.md](../security/security-design.md) |
| Screen behaviors/fields/validation/rights/error/mutation | [screen-behavior-specification.md](../design/screen-behavior-specification.md) |
| Auth screens/flows/states | [authentication-specification.md](../design/authentication-specification.md) |
| Module → interface → action → state / REQ/AC | [step4-action-coverage.md](../execution/evidence/step4-action-coverage.md), [machine-readableinventory](../execution/evidence/step4-action-inventory.json); /design đọc cùngsource |

UI tài chính/M1 đủ28AC và16routes, kế thừa nguyên5navigation; auth/system surfaces bổ sung theo yêu cầu mới:7authroutes+sessionsection, có localmock. Schemas/interfaces/protocolfixtures mới thựcthi test nhưng endpointsv1/statefulM2domain/querymigration chưa wire. Step4 complete không bằngM2productgate. Khôngrealdata/LLM/provider/paid/publicdeployment. Realprotectedtransport/auth/coderoots/keypolicy vàsecurityPoC vẫnBLOCKED.
