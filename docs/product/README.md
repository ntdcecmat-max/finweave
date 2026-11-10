> Baseline v3 — 07/10/2026: nội dung dưới giữ phân tích/quy tắc lịch sử v2. Khi khác phạm vi, ưu tiên [PRD v3](prd.md), [Scope v3](scope.md), [SRS v3](../requirements/srs.md) và [Agent trong Plan/Goals](ai-agent-specification.md). Không dùng giới hạn web/mock/M2 dưới đây làm giới hạn sản phẩm mới; invariant nghiệp vụ và anti-Ops vẫn giữ trừ delta được ghi rõ.

# FinWeave — Bộ hồ sơ bước1–3 / M1

Baseline `scope-v2` bước 1, `analysis-v2` bước 2; cập nhật06/10/2026, execution/register version2.1. Chuẩn bị M1 cho bốn nhóm lõi cùng Home/Plan/Goals/AI theo 5 navigation. M1 PASS qua AG self-walkthrough/automation; pending formal PO acceptance. Chưa user research thật; [Validation](../design/validation-report.md) và [coverage](../execution/evidence/m1-coverage.md) là evidence sản phẩm.

| Artefact | File / câu hỏi được giải quyết |
|---|---|
| Product Vision | [product-vision.md](product-vision.md) — hướng sản phẩm, user dự kiến và thước đo giá trị |
| Problem Statement | [problem-statement.md](problem-statement.md) — vấn đề nào cần giải quyết và còn thiếu bằng chứng gì |
| Value Proposition | [value-proposition.md](value-proposition.md) — chức năng đem lại lợi ích nào, chứng minh bằng cách nào |
| Project Charter | [project-charter.md](project-charter.md) — mục tiêu, quyền, trách nhiệm, deliverables, gate |
| Scope | [scope.md](scope.md) — M1/M2/M3, bốn nhóm × năm chức năng, AC và phần chưa chọn |
| Feasibility Study | [feasibility-study.md](feasibility-study.md) — khả thi sơ bộ và điều kiện chưa kiểm chứng |
| Options Analysis | [options-analysis.md](options-analysis.md) — phương án bàn giao và lý do chọn |
| Cost Model | [cost-model.md](cost-model.md) — effort, biến chi phí, công thức và kịch bản |
| Assumptions/Constraints | [assumptions-constraints.md](assumptions-constraints.md) — điều đã chốt, điều giả định, cách xác minh |
| Risk Register | [risk-register.md](risk-register.md) — rủi ro, trigger, owner, biện pháp và phần dư |
| Roadmap | [roadmap.md](roadmap.md) — mốc theo gate, phụ thuộc và điều kiện mở rộng |
| Backlog | [backlog.md](backlog.md) — công việc cụ thể, priority, output và dependency |

Đọc Charter → Problem/Vision/Value → Scope → Feasibility/Options/Cost/Risks → Roadmap/Backlog. Bước 2 dùng Scope, Assumptions, Decisions và Traceability làm nguồn trực tiếp. Hồ sơ execution: [plan](../execution/plan.md), [progress](../execution/progress.md), [decisions](../execution/decisions.md), [traceability](../execution/traceability.md), [evidence bước 1](../execution/evidence/step-1-review.md).

## Gói bước 2 — đủ theo Playbook

| Artefact / ID | Nguồn sự thật |
|---|---|
| Stakeholder Needs / PRD-NEED-001 | [stakeholder-needs.md](stakeholder-needs.md) — nhu cầu giả định và người cần review |
| Context Model / REQ-CTX-001 | [context-model.md](../requirements/context-model.md) — actors, ranh giới, interfaces |
| Operational Scenarios / REQ-SCN-001 | [operational-scenarios.md](operational-scenarios.md) — 28 scenario chính, 14 nhánh và oracle/reset |
| PRD / PRD-001 | [prd.md](prd.md) — mục tiêu/benefit/scope/gate |
| SRS FR + NFR / REQ-SRS-001 | [srs.md](../requirements/srs.md) — 28 FR, 15 NFR mục tiêu |
| Use Cases / REQ-UC-001 | [use-cases.md](use-cases.md) — 28 UC đầy đủ trường/nhánh |
| Business Rules Catalogue / REQ-BR-001 | [business-rules.md](business-rules.md) — 36 rules, states và assumptions |
| Data Requirements / DAT-REQ-001 | [data-requirements.md](../data/data-requirements.md) — 22 nhóm dữ liệu/dictionary/lineage |
| Glossary / REQ-GLO-001 | [glossary.md](../requirements/glossary.md) — nghĩa thuật ngữ và nhãn Việt |
| RTM / REQ-RTM-001 | [traceability.md](../execution/traceability.md) — needs/REQ/UC/SCN/AC/rules/data/NFR tới screen/API/test/evidence |

Quản trị: [Artifact Register](../governance/artifact-register.md); bằng chứng và gate: [Step2 Review](../execution/evidence/step-2-review.md). Đọc Needs/Context/PRD → SRS/UC → Rules/Data/Glossary → Scenarios/RTM. IDs và đường dẫn trong register là nguồn catalogue; không tạo `data-dictionary.md` riêng cạnh Data Requirements để tránh hai nguồn sự thật.

Cấu trúc sản phẩm hiện hành: **Tổng quan & Báo cáo · Giao dịch · Plan · Dữ liệu · Trợ lý AI**. Navigation con, dashboard, tài khoản/chi tiết tài sản và linh vật được định nghĩa ở [Scope §10](scope.md#10-nguồn-thay-đổi-và-cấu-trúc-5-navigation-hiện-hành). 28 REQ/AC gồm 18 core hồi quy và 10 phần mở rộng. [Archive v1](../governance/baselines/scope-v1-analysis-v1.zip) chỉ là lịch sử; baseline hiện hành scope-v2/analysis-v2.

## Bước3 — thiết kế và prototype M1

[Hướng dẫn mở](../../README.md) · [Home](http://127.0.0.1:4179/home) · [/design](http://127.0.0.1:4179/design).

- [Research Plan/status0participants](../design/research-plan.md), [40Reference catalogue](../design/reference-catalogue.md).
- [Principles/Process, Style, Tokens](../design/design-system.md), [Component Specifications](../design/component-specifications.md), [Pattern Library](../design/pattern-library.md).
- [User Flows/IA/Wireframes/UXUI/Frontend Spec](../design/ux-ui-specification.md), [Accessibility Requirements](../design/accessibility-requirements.md).
- [ADR stack](../architecture/adr/ADR-001-frontend.md), [Prototype Validation/Gate](../design/validation-report.md), [Demo Script](../execution/evidence/demo-script.md).

Các artefact chuyên đề có thể gộp trong một file có nội dung cụ thể; register giữ từng ID/source, không tạo file rỗng cho đủ số. DừngM1; M2/M3 chưa được thực hiện.
