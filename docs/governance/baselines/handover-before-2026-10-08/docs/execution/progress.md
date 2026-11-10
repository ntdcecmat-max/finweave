> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# FinWeave — bước 6 / v2.4

Bước 6 hoàn thành. **Gate M2: PASS_FRONTEND_SYNTHETIC_MOCK** trong scope-v2/analysis-v2 với 28 REQ/AC hiện hành, đủ 5 navigation, Plan/Goals/mô phỏng, AI chat/history/panel và authentication. Catalogue giữ 13 module, 16 business tabs + 7 auth screens + /design, 86 semantic actions. Không đổi scope hoặc dependency stack.

Kết quả thực tế: typecheck/lint/build/contracts exit0; 99/99 unit assertions; 54/54 full browser + 8/8 final AI regression = 55 case khác nhau PASS (7 trùng, 1 mới). 72 render ở 1440×900,390×844,360×844 có 0 axe violations và không page overflow. Lint là 6 custom AST/architecture rules, không phải ESLint. Build có warning bundle lớn; P3 backlog ghi tác động.

Đã sửa lost-ACK retry có nguy cơ ghi tiền hai lần, phân loại lỗi/DTO, preview input race, CSV stale/empty draft, AI cancel lỗi/queued cancel, idle mock interception, insight đồng hạng và AI simulation intent. Raw failures, traces và ảnh trước sửa được giữ; regression theo phần tác động trên build cuối. Direct browser kiểm cash/refetch/drill-down, import/job/Review, Goals/simulation, AI/history/panel và keyboard; so sánh lại 8 references. Agent tự kiểm, 0 participants; chưa user test/UAT/PO sign-off.

[Acceptance](../testing/frontend-acceptance-report.md), [Strategy](../testing/test-strategy.md), [Cases/data](../testing/test-cases-data.md), [Contracts](../testing/contract-test-results.md), [Accessibility/Visual](../testing/accessibility-responsive-report.md), [Defects](../testing/defect-log.md), [Integration Handover](../testing/integration-handover.md), [runtime matrix](evidence/step6-runtime-coverage.md), [summary](evidence/step6-acceptance-summary.json), [register](../governance/artifact-register.md), [RTM](traceability.md).

Real privacy transport/Anti-Ops/auth/keys/provider/durable backend vẫn **BLOCKED_SECURITY_POC**. Mock plaintext chỉ chứa dữ liệu synthetic; protected mode fail closed trước fetch. Reload reset tiền/jobs/chat về fixture, không phải lưu backend. Giữ nguyên original inputs/lock và evidence bước 3–5. Dừng sau M2 theo mức user giao; không bước 7–9, public deploy hoặc paid account.
