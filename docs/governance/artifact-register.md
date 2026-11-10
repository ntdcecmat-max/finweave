> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> Rà frontend 08/10/2026: kết luận hiện hành tại [nghiệm thu](../testing/frontend-acceptance-report.md), [RTM 41 AC](../execution/realignment-traceability.md), [UI RTM](../design/ui-requirement-traceability.md) và [catalogue 50 mục](../design/interface-catalogue.md). Các counts/PASS của Step4–6 và tuyên bố chưa regression trong hồ sơ cũ bên dưới là lịch sử, đã được thay bằng lượt acceptance-2. Operational prototype nhãn 2.0.0 khác canonical v2; native/backend/security/UAT chưa nghiệm thu.

> Bổ sung bàn giao08/10/2026: [index](../handover/README.md), [API v2 canonical](../contracts/v2/README.md), [physical schema](../data/physical/README.md), [quyết định vận hành](../handover/operational-decisions.md) và [validation](../handover/validation-report.md). Các tuyên bố chưa generated/chỉ logical hoặc mọi lựa chọn còn mở trong phần ngày07/10 là trạng thái lịch sử; frontend hiện có additive v2/admin mock nhưng chưa backend/native/security thật.

> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# FinWeave — Artifact Register

Cập nhật 06/10/2026 (Asia/Saigon). ID: GOV-REG-001; version 2.2. Nguồn quản trị: [scenarios hiện hành; Playbook ở root đã bị xóa](../product/operational-scenarios.md). Register đăng ký nguồn yêu cầu/design và evidence sản phẩm M1 theo đúng mức, không biến approval hồ sơ thành user acceptance.

## Quy ước trách nhiệm và baseline

AG = Agent thực hiện, owner tài liệu và reviewer tự rà soát. PO = chủ sản phẩm (user giao nhiệm vụ), reviewer/approver bên ngoài **pending external review**; chưa có sign-off. AG không phải reviewer độc lập. Các owner nguồn/security tương lai chưa được chỉ định: AG chỉ theo dõi dependency, PO cần chỉ định trước tích hợp.

`scope-v2` / `analysis-v2` là baseline làm việc hiện hành v2.0 theo thay đổi 5 navigation của user (D-19), ngày 05/10/2026. S1 = v2.0/scope-v2; S2 = v2.0/analysis-v2, kế thừa scope-v2. Mọi artefact hiện hành in-review; chưa PO formal sign-off. Evidence bước 1 v1 giữ nguyên và chỉ mô tả lịch sử. Archive scope-v1/analysis-v1 superseded chứa nội dung và manifest SHA256 trước sửa; giữ 18 REQ/AC/oracle để hồi quy. Trạng thái artefact khác trạng thái triển khai. **M1-v0.1 đã implemented/verified bằng AG self-walkthrough/automation theo D-23…29**, EVD-M1-001; formal PO acceptance pending. Hồ sơ thiết kế in-review, không khóa baseline đã user test. S1/S2 nội dung requirements giữ nguyên; execution/RTM/backlog/index/register cập nhật v2.1.

## Artefact bước 1 đã có

| Artifact ID | Bước | Tên / đường dẫn | Mục đích / phạm vi | Owner / reviewer / approver | Mức | Trạng thái | Version / baseline | Nguồn / phụ thuộc | Truy vết / ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| PRD-VIS-001 | 1 | [Product Vision](../product/product-vision.md) | Giá trị và hướng bốn nhóm lõi | AG / AG + PO pending / PO pending | M1; kế thừa M2/M3 | in-review | S1 | Ideas; D-02/19 | UP-01…08; REQ; EVD-S2-001 v2; EVD-S1-001 historical |
| PRD-PRO-001 | 1 | [Problem Statement](../product/problem-statement.md) | Vấn đề giả định cần kiểm chứng | AG / AG + PO pending / PO pending | M1 | in-review | S1 | Ideas; A-01…06 | UP-01…08; EVD-S2-001 v2; EVD-S1-001 historical |
| PRD-VAL-001 | 1 | [Value Proposition](../product/value-proposition.md) | Benefit → chức năng → đánh giá | AG / AG + PO pending / PO pending | M1 | in-review | S1 | Vision/Problem/Scope | 28 REQ/AC; EVD-S2-001 v2; EVD-S1-001 historical |
| GOV-CHA-001 | 1,2 | [Project Charter](../product/project-charter.md) | Quyền, trách nhiệm và gate | AG / AG + PO pending / PO pending | M1 | in-review | S1 | Nhiệm vụ; Playbook | D-01/D-12/D-19; EXE-PLAN-001 |
| PRD-SCP-001 | 1,2 | [Scope](../product/scope.md) | Matrix 4×5; 28 REQ/AC, oracle, exclusions | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S1 | Ideas/Playbook §13; D-02…07 | REQ/AC; REQ-RTM-001; giữ 18 lõi/oracle; thêm 10 REQ/AC theo D-19 |
| PRD-FEA-001 | 1,2 | [Feasibility Study](../product/feasibility-study.md) | Khả thi sơ bộ, dependency chưa kiểm chứng | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S1 | DEP-01…04; OD-05…07 | FUT-01…04; EVD-S2-001 v2; EVD-S1-001 historical; cập nhật quyền nhiệm vụ, chưa PoC/provider |
| PRD-OPT-001 | 1 | [Options Analysis](../product/options-analysis.md) | Lựa chọn bàn giao local M1 | AG / AG + PO pending / PO pending | M1 | in-review | S1 | D-04/08; Scope | BL-07…10; EVD-S2-001 v2; EVD-S1-001 historical |
| PRD-CST-001 | 1,2 | [Cost Model](../product/cost-model.md) | Effort và biến chi phí, không báo giá | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S1 | EST-02; D-11/19 | Roadmap; EVD-S2-001 v2; EVD-S1-001 historical; estimate v1 superseded; effort mới TBD, không actual |
| GOV-ASM-001 | 1,2 | [Assumptions/Constraints](../product/assumptions-constraints.md) | Ràng buộc và giả định có hạn xử lý | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | S1 | Decisions; Scope | A-01…06; OD-01…09; CON-01…11 |
| GOV-RSK-001 | 1 | [Risk Register](../product/risk-register.md) | Trigger, owner và biện pháp rủi ro | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S1 | Scope; DEP; A/OD | Backlog; EVD-S2-001 v2; EVD-S1-001 historical |
| PRD-RDM-001 | 1,2 | [Roadmap](../product/roadmap.md) | Mốc theo gate, không lịch cam kết | AG / AG + PO pending / PO pending | M1/M2/M3 | in-review | S1 | Playbook; Scope; Backlog | RDM-01…05; FUT/EXT |
| EXE-BKL-001 | 1,2,3 | [Backlog](../product/backlog.md) | Priority, phụ thuộc, output, trạng thái | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | Scope; Playbook; D-12/19 | BL-01…18; FUT/EXT/DEP; EXT-02/04 superseded |
| EXE-IDX-001 | 1,2,3 | [Mục lục](../product/README.md) | Điều hướng hồ sơ | AG / AG / không cần approval riêng | M1 | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | Các artefact product | Register/RTM/evidence |
| EXE-PLAN-001 | 1,2,3 | [Plan](../execution/plan.md) | Quyền, thứ tự, DoR/DoD | AG / AG + PO pending / PO pending | M1 | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | User; Playbook; D-12/19 | Bước3 completed/D-23; BL-07…10/12…17 verified M1 |
| EXE-PRG-001 | 1,2,3 | [Progress](../execution/progress.md) | Tiến độ thực tế và giới hạn | AG / AG / PO pending gate | M1 | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | Review evidence | EVD-M1-001 current product; EVD-S2-001/EVD-S1-001 historical document gates |
| GOV-DEC-001 | 1,2,3 | [Decisions](../execution/decisions.md) | Quyết định/giả định/tác động | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | User; Ideas; Playbook | D-23…29 và D/A/OD lịch sử; Scope/Rules/RTM |
| REQ-RTM-001 | 1,2,3 | [RTM](../execution/traceability.md) | Need/FR/NFR → UC/rule/data/scenario → design/test/evidence | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | 28 REQ/AC; Ideas; bộ bước 2 | UC/SCN giữ nguyên; screen/tests M1 verified; API M2 planned; EVD-M1-001/EVD-COV-001 |
| EVD-S1-001 | 1 | [Step 1 Review](../execution/evidence/step-1-review.md) | Kết quả rà soát lịch sử bước 1 | AG / AG / PO pending | M1 chuẩn bị | baselined | v1.0/scope-v1; historical, chỉ có hiệu lực cho review cũ | Bộ bước 1; oracle | Evidence lịch sử; không gate scope-v2 |

## Gói artefact bước 2 và hồ sơ review

| Artifact ID | Bước | Tên / đường dẫn | Mục đích / phạm vi | Owner / reviewer / approver | Mức | Trạng thái | Version / baseline | Nguồn / phụ thuộc | Truy vết / ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| PRD-NEED-001 | 2 | [Stakeholder Needs](../product/stakeholder-needs.md) | SN-01…12 giả định và nhu cầu quản trị | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S2 | Problem/Scope; A-01…06 | SN→REQ/AC; RTM; chưa research |
| REQ-CTX-001 | 2 | [Context Model](../requirements/context-model.md) | Actors, boundary, 9 interfaces và future boundary | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S2 | Scope/Needs/Ideas19 | IF→REQ/UC/DR; không HLD |
| REQ-SCN-001 | 2 | [Operational Scenarios](../product/operational-scenarios.md) | 28 SCN+14 edges; reset và independent expected | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | S2 | Playbook13;28 AC;BR/DR;OD-02…04 | UC/AC/O-01…10; fixtures/reset app có EVD-M1-001, giữ EVD-S2-001 history |
| PRD-001 | 2 | [PRD](../product/prd.md) | Mục tiêu/benefit/scope/quality/dependencies | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | S2 | Scope/Needs/Context | SRS/UC/RTM; scope-v2 theo user D-19 |
| REQ-SRS-001 | 2 | [SRS FR/NFR](../requirements/srs.md) | 28 FR/15 NFR kiểm chứng được theo mức | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S2 | Scope/PRD;Ideas;D-13…22 | REQ/AC/NFR→UC/SCN/BR/DR; M1 coverage28AC + evidence, real security/provider pending |
| REQ-UC-001 | 2 | [Use Cases](../product/use-cases.md) | 28 UC đủ actor/trigger/pre/main/alt/errors/rules/data/post | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | S2 | SRS/Scope;BR/DR | UC→SCN/AC; CF-01…04; M1 self-walkthrough EVD-M1-001,0participants |
| REQ-BR-001 | 2 | [Business Rules Catalogue](../product/business-rules.md) | 36 rules testable, states riêng | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | S2 | Ideas1.5…1.12;Scope;D-13…22 | BR→SCN/DR; assumptions labeled |
| DAT-REQ-001 | 2 | [Data Requirements](../data/data-requirements.md) | 22 data groups/dictionary/relations/quality/lineage | AG / AG + PO pending / PO pending | M1; hướng M2/M3 | in-review | S2 | Scope/BR;Ideas1.9 | DR→UC/BR/SCN; không DB/API schema |
| REQ-GLO-001 | 2 | [Glossary](../requirements/glossary.md) | Nghĩa thuật ngữ và nhãn UI Việt | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | S2 | Scope/BR/DR | PRD/SRS/UC/RTM dùng chung |
| EVD-S2-001 | 2 | [Step2 Review](../execution/evidence/step-2-review.md) | Kết quả structural/numerical/manual review và gate | AG / AG self-review / PO pending | M1 chuẩn bị | in-review | S2 | Bộ bước 2; verification script+JSON | Tài liệu verified; chưa M1/research/provider/PoC |
| GOV-REG-001 | 1,2,3 | [Artifact Register](artifact-register.md) | Catalogue nguồn sự thật/version/trách nhiệm | AG / AG + PO pending / PO pending | M1; kế thừa | in-review | v2.1 / scope-v2+analysis-v2; M1-v0.1 | Playbook3.4; toàn bộ artefact | EXE/RTM/EVD; không sign-off |

RTM là artefact thứ10 của gói bước 2, nằm trong bảng cập nhật bước 1 ở trên, **không tạo RTM thứ hai**. Script và JSON kiểm tra là attachments của EVD-S2-001, không artefact phân tích mới. Không tạo Research Results/Supplier Verification/Security PoC trống hoặc giả để đủ số.


## Gói bước3 — thiết kế, prototype và evidence hiện hành

| Artifact ID | Bước | Tên / đường dẫn | Nội dung | Owner / reviewer / approver | Mức | Trạng thái | Version / baseline | Nguồn / evidence |
|---|---|---|---|---|---|---|---|---|
| ARC-ADR-001 | 3 | [Frontend ADR](../architecture/adr/ADR-001-frontend.md) | Lựa chọn trước scaffold, official docs/peer/engine/license/exact pins, M1→M2 reuse | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | D-23/24; runtime inventory; EVD-M1-001 |
| DES-REF-001 | 3 | [Reference Catalogue](../design/reference-catalogue.md) | 40file→screen/component→learn→adjust; đã trực tiếp xem hết, không asset rights mặc định | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | References40; no embedded reference assets |
| DES-RSR-001 | 3 | [UX Research Plan](../design/research-plan.md) | Hypotheses/tasks/recruit/rubric/consent, status0participants; Results chưa có vì chưa nghiên cứu | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | A-01…06/OD-01; BL-11 |
| DES-PRN-001 / DES-STY-001 / DES-TOK-001 / DES-SYS-001 | 3 | [Design System](../design/design-system.md) | Principles/process/decision log, style/icons/assets rights, full token names/meaning/values/CSS | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | /design render review; src/design/tokens.css |
| DES-CMP-001 | 3 | [Component Specifications](../design/component-specifications.md) | Foundation/business anatomy/variants/states/props/events/validation/a11y/responsive/usage | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | Running component APIs; B11/12/13/19 |
| DES-PAT-001 | 3 | [Pattern Library](../design/pattern-library.md) | 5navigation templates; drill/forms/import/Review/Plan/Goals/simulation/contextualchat; real snippets | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | Running code, no invented component exports |
| DES-IA-001 / DES-FLW-001 / DES-WIR-001 / DES-UX-001 | 3 | [IA/Flows/Wireframes/UXUI & Frontend Spec](../design/ux-ui-specification.md) | 5nav/routes,9flows, /design wireframes, shell/boundary/charts/states/responsive/visual checklist | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | Scope/UC/BR/DR; actual routes; EVD-COV-001 |
| DES-A11Y-001 | 3 | [Accessibility Requirements](../design/accessibility-requirements.md) | AX01…11 keyboard/focus/table/privacy/motion/locale; implementation/evidence/limits | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | B11/12/13/19/21; axe36pages; no certification |
| DES-PRO-001 | 3 | [Interactive Prototype + source](../../finweave-web/package.json) | Full M1 synthetic responsive Vietnamese; dist, start script; /design gallery and5nav | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1.0 / M1-v0.1 | ADR/design/28AC; 21pins+lock; no durable backend |
| EVD-COV-001 | 3 | [Coverage Matrix](../execution/evidence/m1-coverage.md) | 28REQ/AC→navigation/action/state/oracle→U/B/ảnh; NFR đúng mức | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | Unit28/browser24 actual JSON |
| EVD-DEMO-001 | 3 | [Demo Script](../execution/evidence/demo-script.md) | Cách mở/reset và tác vụ có số expected,5nav/AI/errors/privacy/keyboard | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | README/Start-Prototype/dist; no participant test |
| EVD-M1-001 | 3 | [Prototype Validation Report/Gate](../design/validation-report.md) | Kết quả self-walkthrough/automation, environment/oracles/defectlog/limits và M1 gate | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | Type/build/28unit/24browser/36axe/ảnh/performance; PO pending |
| EXE-RUN-001 | 3 | [README và mở local](../../README.md) | Instructions xem/develop/replay/boundary; Start-Prototype.cmd/run-local.cjs | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | Dist loopback4179, Node24.x; no Internet install to view |
| ARC-DEP-001 | 3 | [Dependency Inventory](../../finweave-web/dependency-inventory.json) | 21exact direct pins, lock187dependency entries (188 gồm root)/162installed, engine/peer/license metadata | AG / AG tự review + PO pending / PO pending | M1 | in-review; implemented/verified ở mức đã ghi | v0.1 / M1-v0.1 | package.json/package-lock + license-file-inventory/notices; not public legal clearance |

User Flows/IA/Wireframes và Principles/Style/Tokens gộp có sections/IDs cụ thể trong files nêu trên, không tạo file rỗng. Research Results/UAT Results chưa tạo:0participants/0interviews/0surveys. Screenshot/rawJSON/HTML/build/performance/reduced-motion/defectlog và license files là attachments tương ứng, không giả artefact đã approved. Reference images ở project gốc, không tái phân phối vào prototype.

## Nguồn điều khiển

[PRD hiện hành; đầu vào Ideas ở root đã bị xóa](../product/prd.md), [scenarios hiện hành; Playbook ở root đã bị xóa](../product/operational-scenarios.md), [hồ sơ bàn giao hiện hành; setup/prompts ở root đã bị xóa](../handover/README.md) là nguồn do user cung cấp, owner PO; AG chỉ đọc, không tự sửa hay tuyên bố xác minh provider trong nguồn. Nhiệm vụ trước cho bước2 và OD-02/03/04; nhiệm vụ hiện tại cho đủ bước3 tớiM1 qua D-23. Tech Stack là proposal, ADR-001 chọn thực tế. Navigations do user cung cấp, giữ nguyên. Không sửa nguồn gốc.

## Lịch sử thay đổi và bản được thay thế

| Artifact ID | Bước | Tên / đường dẫn | Mục đích / phạm vi | Owner / reviewer / approver | Mức | Trạng thái | Version / baseline | Nguồn / phụ thuộc | Truy vết / ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| GOV-BASE-001 | 1,2 | [Archive v1 + manifest](baselines/scope-v1-analysis-v1.zip) | Snapshot trước thay đổi: 29 Markdown, checker/JSON, 3 nguồn; manifest SHA256 | AG / AG tự kiểm tra / không sign-off sản phẩm | Chuẩn bị M1 | superseded | scope-v1/analysis-v1, versions nguyên trong archive | Hồ sơ v1 trước D-19 | Regression 18 REQ/AC và oracle; EVD-S1-001/EVD-S2-001 v1 chỉ lịch sử |

- v1.0: đăng ký bộ bước 1 trước phân tích bước 2.
- v1.1: bổ sung 9 artefact bước 2 + RTM cập nhật, evidence và 29 nguồn Markdown.
- v2.0: user chọn 5 navigation; scope-v2/analysis-v2 thay các phiên bản hiện hành v1 tại cùng path, trừ EVD-S1-001 giữ lịch sử. Bổ sung 10 FR/AC, Plan/Goals/AI/Insights; cập nhật toàn gói và gate. GOV-BASE-001 giữ bản superseded; catalogue có 29 Markdown + 1 archive, script/JSON là attachments của EVD-S2-001. Không evidence v1 nào tự chứng minh scope-v2 đã đạt.

- v2.1 / M1-v0.1: bước3 đã completed theo D-23; thêm design/ADR/prototype/evidence, cập nhật execution/RTM/backlog. M1 PASS qua AG self-review; formal PO acceptance pending. Source yêu cầu28AC giữ hiệu lực; archivev1 chỉ lịch sử. DừngM1, không thực hiệnM2/M3.

## Bước 4 hiện hành — chuẩn bị M2, version2.2

User giao bước4 và bổ sung authentication + danh mục toànmodule theoD-30…34. Baseline requirements scope-v2/analysis-v2 vẫn28REQ/AC, khôngrenumber và không khôi phục exclusion cũ. Artefacts dướiđây AG thực hiện/tựreview, PO externalformalreview pending. Bước4spec/preparation khácgateM2product/security.

| Artifact ID | Bước | Đường dẫn | Nội dung | Mức/trạng thái | Version/phụ thuộc |
|---|---|---|---|---|---|
| ARC-HLD-001 / ARC-VIEW-001 | 4 | [HLD](../architecture/high-level-design.md), [5ArchitectureViews](../architecture/views/architecture-views.md) | components, runtime, deployment/trust, data/sequence/AI | reviewed logicaldesign; realdeploymentcandidate | v0.1 / ADR001…003 |
| ARC-ADR-002 / ARC-ADR-003 | 4 | [reuse/contracts](../architecture/adr/ADR-002-contracts-and-m2-reuse.md), [privacyboundary](../architecture/adr/ADR-003-privacy-boundary.md) | unchanged21pins; logical/private transportadapter closed | acceptedwithinuserauthorizedwork; PoCunverified | v0.1 / Ideas§15 |
| ARC-LLD-001 | 4 | [LLD](../architecture/low-level-design.md) | service/cache/mutation/financialguards/importjob/AI implementationplan | speccompleted; statefulv1integration Step5pending | v0.1 / BR01…36 |
| ARC-API-001 / ARC-FILE-001 / ARC-EVT-001 / ARC-EAI-001 | 4 | [Contracts](../contracts/README.md), [File/Event](../contracts/file-event-contracts.md), [Error/Auth/Idempotency](../contracts/error-auth-idempotency.md) | version1.0.0,66business+6identity, schemas/examples/services/scenarios, pagination/auth/errors/keys/previewjob | schema/protocolfixture tested; no v1HTTP serverclaimed | v1.0.0 / sourcecontracts.ts + generatedfiles |
| ARC-MAP-001 | 4 | [Source-to-Target](../contracts/source-to-target-mapping.csv) | 48field/recordmaps + evidence/guards/security/implementationlevel | speccompleted; mappingadapterplanned | v1.0.0 / DR01…22 |
| ARC-DATA-001 | 4 | [LogicalDataModels](../data/logical-data-model.md) | DR01…22, relationships/versions/invariants/privacy; legacygaps | logicalmodelscomplete; no physicalDBselected | v0.1 / datarequirements |
| ARC-SEC-001 | 4 | [SecurityDesign/PoCgate](../security/security-design.md) | threatmodel,10controls/tests, independentOpsboundary/key/client/auth/recovery | realdata BLOCKED; PoCnotrun | v0.1 / NFR07/08/15 |
| DES-BHV-001 / DES-AUTH-001 / DES-CAT-001 | 4 + userclarification | [ScreenBehavior](../design/screen-behavior-specification.md), [Auth](../design/authentication-specification.md), [Catalogue](../execution/evidence/step4-action-coverage.md) | 13modules→interfaces→86actions→states; fields/validation/rights/postmutation;7authscreens | Auth/catalogueimplementedsynthetic; businessUI M1reused; servicev1planned | v0.2 / designv0.1/28AC/AUTH-UI01…08 |
| EVD-S4-COV-001 / EVD-S4-001 | 4 | [Inventory](../execution/evidence/step4-action-inventory.json), [Validation](../execution/evidence/step4-validation-report.md) | allREQ/action/command/contract checks; actualunit/browser/axe/build evidence+limits | AGselfverification; POformalpending | v0.1 / currentcode, M1historicalsnapshotpreserved |

Sourceinputs5files/lock unchangedSHA; M1 snapshot và manifests làlịchsử, newStep4manifest làhiệnhành. Userresearch vẫn0participants, nofakeResearchResults. Không deploy public/paid provider/realsecuritysignoff. [Packageindex](../architecture/README.md) liệtkêcácdeliverables.

Kết quả chốt EVD-S4-001: 57 unit checks và 32 browser cases PASS; 36 render nghiệp vụ đại diện + 21 render auth ở ba viewports, axe 0 violations. [Delivery checks](../execution/evidence/step4-delivery-checks.json) kiểm liên kết, schema references, mappings và input/lock hashes; [evidence summary](../execution/evidence/step4-evidence-summary.json) giữ counts, mức kiểm chứng và blockers. Các số này là AG automation/self-review, không là user research hoặc xác nhận security thật.

## Bước5 — frontend đầy đủ với mock / version2.3

| Artifact ID | Deliverable | Location | Trạng thái/phụ thuộc |
|---|---|---|---|
| IMP-SRC-001 | Source Code frontend sameapp | finweave-web/src app/components/features/design/contracts/services/mocks/domain | synthetic network, reused ADR/tokens/components; source/lock in SHA manifest |
| IMP-MOCK-001 | Mock Implementation | [Stateful mock](../frontend/mock-implementation.md) | ledger state/mutations/reset, importjob, scripted AI/history và auth mock; realblocked |
| CFG-S5-001 | Manifest/Lock/Configuration/Build Scripts | [Baseline](../frontend/configuration-baseline.md), package.json/package-lock.json/.env.example, scripts/check.cjs |21 exactpins/lock unchanged; Node24; localmode/commands |
| ARC-ADR-004 / ARC-API-001 | Wiring/read-model ADR/contracts | [ADR004](../architecture/adr/ADR-004-stateful-mock-and-read-model.md), contracts/v1 | exact1.1.0;70business+6identity/64baseschemas;1.0baseline kept |
| DES-COMP-001 / DES-BHV-001 / DES-CAT-001 | Component/screen/pattern/designgallery/catalogue | [Components](../design/component-specifications.md), [Screens](../design/screen-behavior-specification.md), [Catalogue](../design/interface-catalogue.md) | v0.2/0.3,13modules/23routes+/design/86actions, unchanged28AC |
| EVD-S5-001 / EVD-S5-COV-001 | Validation/progress/traceability | [Report](../execution/evidence/step5-validation-report.md), [coverage](../execution/evidence/step5-action-coverage.md), rawunit/browser/axe/screenshots | AG automation/selfwalkthrough; userresearch0, formalM2gateStep6pending |
| REPO-S5-001 | Repository Documentation/local build/run | [README](../../README.md), finweave-web/README.md, Start-Prototype.cmd | originalproject code/dist on4181; no secondapp/publicdeploy/backend |

Scope/PRD/SRS/RTM requirement baseline giữ nguyên. Step3/4 reports lịch sử; Step5network/progress là implementation hiện hành. Dừng saubước5; không tự nghiệm thu security/realdata/gateM2haytriển khaibước6.


Chốt EVD-S5-001: build/typecheck PASS, 85 unit checks; kết quả cuối 39 browser cases distinct PASS qua nhiều run, 57 representative axe renders 0 violations. [Raw summary](../execution/evidence/step5-evidence-summary.json), [Delivery checks](../execution/evidence/step5-delivery-checks.json), [Runtime coverage](../execution/evidence/step5-runtime-coverage.md), [SHA manifest](../../step5-manifest-sha256.json). Không user research/UAT, không formal gate M2 bước 6 hay security gate.

## Bước6 — testing / acceptance / handover

| Artifact ID | Deliverable | Location | Status / dependencies |
|---|---|---|---|
| TST-STR-001 | Test Strategy | [Strategy](../testing/test-strategy.md) | scope28REQ/AC, layers/gate/environment/limits |
| TST-CASE-001 | Test Cases/Data | [Cases](../testing/test-cases-data.md), finweave-web/tests | Independentfinancialoracles, errors/races/ownership/plan/goals/sim/auth/AI |
| TST-AUTO-001 | Automated Tests | tests/*.unit.test.ts / *.browser.test.ts, fault-harness.ts, scripts/check-step6.cjs/lint.cjs, playwright.step6.config.ts | Source/actualreports/pilot/failurehistory |
| TST-CTR-001 | Contract Test Results | [Results](../testing/contract-test-results.md) |99units+portablestaticaudit, logical1.1.0, no realtransportproof |
| TST-ACC-001 | A11y/Responsive/Visual | [Report](../testing/accessibility-responsive-report.md), step6screenshots/axe/raw |1440×900/390×844/360×844; agentreview, notcertification |
| TST-DEF-001 | Defect Log | [Defects](../testing/defect-log.md) | RuntimeFAILhistory retained; financial/race fixes; P3bundle,SEC-REALblocked |
| TST-FA-001 | Frontend Acceptance Report | [Acceptance](../testing/frontend-acceptance-report.md) | PASS_FRONTEND_SYNTHETIC_MOCK; actual99unit/full54+AI8=55distinct/72axe; no PO/UATsignoff |
| INT-HO-001 | Integration Handover | [Handover](../testing/integration-handover.md) | baseURL/auth/env/transport/contracts/adapters/commands/persistence/securityblock |
| CFG-S6-001 / EVD-S6-001 / EVD-S6-COV-001 | Baseline/traceability/register/delivery | [Coverage](../execution/evidence/step6-runtime-coverage.md), [inventory](../execution/evidence/step6-action-inventory.json), [summary](../execution/evidence/step6-acceptance-summary.json), [manifest](../../step6-manifest-sha256.json) |5inputs/lockpreserved; Step3–5history unchanged |

Step6 supersedes earlier stopping-at-Step5 status for current task. Research0participants, no usertest/UAT/POsign-off, security/datareal blocked. StopafterM2 peruser, no automaticStep7–9.

Chốt bước6: **PASS_FRONTEND_SYNTHETIC_MOCK**. Typecheck/customAST lint/build/contracts exit0;99/99unit, full54/54 + finalAI8/8 =55distinct PASS,72representative renders0axe violations. Raw run1FAIL/initial harness failures kept separately; all scope-affecting findings fixed/regressed. [Delivery checks](../execution/evidence/step6-delivery-checks.json), [manual review](../execution/evidence/step6-manual-review.json). P3bundle backlog; realintegration BLOCKED_SECURITY_POC,0participants/UATpending. Historical stopping statements above belong to their earlier step; current stop is M2.

## Đăng ký delta operational-v3 — 08/10/2026

| Artifact | Vai trò / trạng thái |
| --- | --- |
| PRD/scope/SRS-v3 | Baseline yêu cầu làm việc, chưa user UAT hoặc implementation mới |
| Tech stack v0.2, HLD/LLD/views/data v0.2 | Kiến trúc đích, conventional synthetic và protected real tách riêng |
| ADR005/006 | Android/3 surfaces và trust-profile conflict; native/security PoC pending |
| Android collector / Deployment topology / Feasibility sources | Capability, jobs/cost/limits và tài liệu tham chiếu đã desk-reviewed |
| Operational API spec / UI design delta | Spec mới, chưa generate schema hoặc sửa UI/runtime |
| Agent specification | Co-create/replan Plan–Goals và investigation; model/eval chưa thực hiện |
| RTM v3 / Operational acceptance plan |41 AC inventory,13 AC mới và6 NFR mới chưa chạy |
| Product realignment audit | Findings, changes, limitations và verification documentation |
| pre-realignment-2026-10-07 |12 tài liệu cũ giữ nguyên byte, manifest SHA256; không nguồn yêu cầu hiện hành |

[Điểm vào hồ sơ v3](../../README.md), [Audit](../execution/product-realignment-audit.md). Agent là người soạn/tự rà; không tự nhận independent review hoặc PO sign-off.

## AI-SPEC-001 v1.0 — 08/10/2026

[Đặc tả hợp nhất AI](../product/ai-agent-specification.md) là nguồn chi tiết duy nhất của REQ-AI-01/02 và REQ-AGENT-01/02/03:24 functional requirements,8 quality requirements,7 use cases. Kế thừa Q&A/explanations/chat/history/context/evidence/mascot; phát triển Agent Plan–Goals/investigation trên cùng authority. SRS giữ inventory41 AC; refinements không được tính như32 AC cấp hệ thống mới. [Pre-unification snapshot](baselines/ai-before-unification-2026-10-08/README.md) giữ lịch sử; unified tests/evaluation chưa chạy. [Verification](../execution/ai-unification-verification.md) ghi kiểm tra tài liệu/frontend preservation cho lượt hợp nhất.

## UI/UX v1.0 — 08/10/2026

User đã duyệt hướng cập nhật chi tiết tài liệu giao diện, kế thừa frontend hiện có và chỉ sửa docs. Bộ [UI/UX hiện hành](../design/README.md) gồm DES-CAT/UX/BHV/CMP/PAT/SYS/AUTH/A11Y/DELTA v1.0; bổ sung DES-ANDROID-001, DES-ADMIN-001, DES-RTM-001. Phân loại user web/core Android/native/admin/auth,16 flows, forms/states/rights, Agent Plan–Goals cùng Q&A/mascot/history.41 parent AC và24 AI-FR/8 AI-NFR giữ nguyên;26 nhóm UI acceptance NOT RUN. Snapshot9 tài liệu và manifest tại [ui-before-v3](baselines/ui-before-v3-2026-10-08/README.md); [báo cáo thay đổi/verification](../execution/ui-documentation-update.md). Chưa pixel/user review, native PoC, contract v2 hoặc implementation mới; code frontend không thay đổi trong lượt này.

## Rà frontend 08/10/2026 — kết quả hiện hành

| Hồ sơ | Trạng thái và bằng chứng |
|---|---|
| TST-FA-001 | PASS_FRONTEND_SYNTHETIC_CHECKED_SCOPE; 67/67 browser một lượt, 0 retry; 131/131 unit; [raw/checks](../execution/evidence/frontend-review-2026-10-08/acceptance-2/) |
| DES-CAT-001 / DES-RTM-001 | 50 screen IDs đối chiếu source/spec/test; 26 UI-AC và 41 parent AC phân CHECKED_SUBSET/NOT_RUN, không PASS toàn bộ v3 |
| Điều tra lỗi | 35 ca baseline, mọi lỗi diagnostic và lượt full trước giữ raw/trace/nguyên nhân/oracle; source và baseline có đối chiếu SHA-256 |
| API/runtime | Core/identity 1.1.0; operational prototype 18 operations nhãn 2.0.0; admin memory gateway. Canonical v2 target 133 operations chưa conformance |
| Gate ngoài frontend | Signed APK/native, backend/security/real providers/Agent eval và UAT/PO chưa kiểm chứng; v3 PARTIAL |

AG tự kiểm tự động; không manual visual review mới hoặc formal PO sign-off. Bản bàn giao đóng dấu và các baseline lịch sử giữ nguyên.

## ARCH-04 — D1 + J2 accepted08/10/2026

[ADR-011](../architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md), [target DB package](../data/target-t1/README.md), [change report](../architecture/ARCH-04-change-report.md). D1 kế thừa54-table synthetic baseline bằng004+ migration design; J2 một shared dispatch authority. Expand design70 bảng/782 cột/141 FK, permissions/invariants/API dependency overlay133 và17 finding dispositions. API/physical baseline/r1/r2/source frontend không đổi; SQL/grants/domain/upgrade/restore NOT RUN. Không tự tạo baseline revision mới hoặc PO/UAT sign-off.

## ARCH-05 — T1 contract design08/10/2026

[ADR-012](../architecture/adr/ADR-012-unified-t1-contract-revision.md), [working API T1/D1/J2](../contracts/v2-t1/README.md), [change report](../architecture/ARCH-05-change-report.md). Giữ133 operations, thêm8 thành141; payload2.0.0 pre-release với exact revision/hash pin. Không mặc định tương thích baseline/mock.

Fresh source/schema/AST/field diff,145 consumer mapping rows,41 reviewed storage rules,31 runtime scenarios SPECIFIED. Auth/DB credential delta tiếp tục ARCH-06; Fastify/backend/native/security/UAT NOT RUN. Frontend/canonical baseline/DB target/r1/r2/research giữ hashes; không tạo handover revision mới.

## ARCH-06 — 08/10/2026

| Artifact | State |
| --- | --- |
| [ADR-013](../architecture/adr/ADR-013-first-party-identity-and-scoped-credentials.md), [identity LLD](../security/identity/identity-access-design.md), [operation permissions](../security/identity/operation-permissions.csv) | ACCEPTED DESIGN / RUNTIME NOT RUN |
| [API002](../contracts/v2-t1-r2/README.md), [auth DB target](../data/target-t1-auth/README.md) | Unreleased target, previous001/D1J2 immutable; SQL NOT RUN |
| [Change report](../architecture/ARCH-06-change-report.md), [validation](../execution/evidence/arch-06-identity-2026-10-08/validation.json) | Static artifact scope only |
| [Auth acceptance](../security/identity/acceptance-plan.md) |30 runtime cases NOT RUN |

## ARCH-07 — 09/10/2026

| Artifact | Phạm vi/trạng thái |
| --- | --- |
| [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [ADR-014](../architecture/adr/ADR-014-t1-data-protection-and-recovery-witness.md) | Threat model, custody khóa, phân quyền, logs, egress, backup và recovery; thiết kế đã chọn |
| [Schema bảo mật revision 003](../data/target-t1-security/README.md), [bundle](../security/t1/implementation-bundle.json) | 84 bảng / 960 cột / 155 FK; API002 giữ nguyên; SQL NOT RUN |
| [32 ca SEC](../security/t1/acceptance-plan.md), [spikes](../testing/technical-spikes.md) | Tất cả kiểm thử security thực tế NOT RUN |
| [Báo cáo thay đổi](../architecture/ARCH-07-change-report.md), [validation](../execution/evidence/arch-07-t1-security-2026-10-09/validation.json) | Kiểm tra artifact và bảo toàn hashes; không thay runtime acceptance |

## ARCH-08 — 09/10/2026

| Artifact | Nội dung/trạng thái |
| --- | --- |
| [Engine/domain](../domain/README.md), [ADR-015](../architecture/adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md) | Exact ledger/planning/quantity/calendar và conditional forecast; design accepted |
| [API003](../contracts/v2-t1-r3/README.md), [DB004](../data/target-t1-domain/README.md), [bundle](../domain/implementation-bundle.json) |151operations/626schemas,86bảng/988cột/161FK; prior packages giữ nguyên |
| [30 requirements/cases](../domain/acceptance-plan.md), [source review](../domain/source-review.md), [golden vectors](../domain/golden-vectors.json) | Refinements và expected examples; production runtime NOT RUN |
| [Change report](../architecture/ARCH-08-change-report.md), [validation](../execution/evidence/arch-08-domain-2026-10-09/validation.json) | Static artifact/oracle/hash evidence, không backend acceptance |

## ARCH-09 — Current async artifacts

Register FW-ASYNC-J2-001, FW-J2-REGISTRY-001, API FW-API-T1-D1J2-004, DB FW-PHYS-T1-ASYNC-005, ADR-016, ASY/ASN32refinements/cases. Prior r1/r2/ARCH01…08 packs/evidence preserved. Manifest ARCH09 chỉ design revision, không backend release hoặc frontend acceptance revision.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Register FW-ANDROID-DESIGN-001 / FW-ANDROID-LOCAL-001 / FW-NATIVE-BRIDGE-002 / ADR017, evidence arch-10-android-2026-10-09. Prior manifests/snapshots/source/API004/DB005 unchanged.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Register FW-SOURCES-DESIGN-001 / FW-SOURCES-POLICY-001 / FW-SOURCE-REGISTRY-001 / FW-SOURCES-RTM-001 / ADR018; source implementation bundle pins API004/DB005/Android. Prior manifests remain immutable historical evidence.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Register FW-AGENT-DESIGN-001 / FW-AGENT-POLICY-001 / FW-AGENT-TOOLS-001 / FW-AGENT-EVAL-001 / ADR019 / API005 / native bridge003. Prior ARCH06–11/API004/baselines unchanged; current overview hashes nằm manifest ARCH12.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Ghi FW-OPS-DESIGN-001, FW-OPS-POLICY-001, schemas, OPS-01…32, RB-01…14, ADR020 và manifest ARCH13. Giữ nguyên các gói/snapshot trước; cập nhật19 tài liệu tổng quan.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
