# FinWeave — Quy trình thực hiện dự án dành cho Agent

## 1. Mục đích và nguồn yêu cầu

Tài liệu này hướng dẫn **Agent phát triển phần mềm** thực hiện FinWeave qua chín bước, ba mức bàn giao và bộ artefact được tuyển chọn riêng cho dự án. Agent phát triển khác với **AI Financial Assistant** bên trong sản phẩm.

Nguồn ý tưởng hiện tại: [FinWeave_Ideas.md](FinWeave_Ideas.md). Hướng dẫn điều khiển: [FinWeave_Human_Setup_and_Prompts.md](FinWeave_Human_Setup_and_Prompts.md).

Giá trị cốt lõi: **thu thập, quản lý và theo dõi tài chính cá nhân trong một nền tảng hợp nhất, trực quan, có thể truy ngược dữ liệu**.

Ba mức dùng trong quy trình này được định nghĩa cụ thể dưới đây. Tài liệu ý tưởng có một số nội dung backend dưới nhãn prototype; xem chúng là yêu cầu nghiệp vụ cần thể hiện và công việc triển khai ở mức phù hợp. Khi lập kế hoạch, tạo bảng ánh xạ; không coi toàn bộ backlog ý tưởng là điều kiện của prototype giao diện.

| Mức | Phải chứng minh | Các bước chính |
|---|---|---|
| M1 — Prototype | Thiết kế, trình bày dữ liệu và luồng sử dụng phù hợp qua tác vụ mô phỏng | 1–3 |
| M2 — Frontend sẵn sàng tích hợp | Frontend đầy đủ trong phạm vi đã chốt, gọi lớp API theo hợp đồng và được kiểm thử với mock | 4–6 |
| M3 — Sản phẩm hoạt động thực tế | Frontend kết nối backend thật; dữ liệu, nghiệp vụ, phân quyền và triển khai được kiểm chứng | 7–9 |

Mức bàn giao khác với roadmap module ở mục 17 của tài liệu ý tưởng. Ví dụ một module thuộc roadmap mở rộng vẫn có thể được thiết kế ở M1, lập trình frontend ở M2 và tích hợp ở M3 khi nằm trong phạm vi được chọn.

## 2. Nguyên tắc thực hiện

### 2.1. Tổ chức quanh chức năng người dùng

Luồng sản phẩm cần thể hiện:

**Thiết lập tài khoản và tài sản → đưa dữ liệu vào → xem tình hình tài chính → khám phá giao dịch hoặc tài sản → cập nhật/điều chỉnh khi cần → tiếp tục theo dõi.**

Người dùng có thể mở Tổng quan ngay trong những lần sử dụng sau. Dữ liệu hợp lệ cập nhật báo cáo; Review là nhánh xử lý trường hợp chưa rõ. Luồng import chỉ là một use case của chức năng thu thập dữ liệu.

Ledger, chuẩn hóa, đối soát, Financial Engine, mã hóa và vận hành hỗ trợ các chức năng trên. Dùng chúng khi giải thích kiến trúc và kiểm thử, giữ ngôn ngữ giao diện theo mục tiêu của người dùng.

### 2.2. Giữ đúng phạm vi

- Bốn nhóm đầu: ngân hàng/ví, tiền mặt, cổ phiếu và vàng.
- BĐS, vốn kinh doanh, thẻ tín dụng, nợ, đa tiền tệ và chia sẻ hộ gia đình là phần mở rộng cần được chọn rõ.
- Budget, Goals, Alerts và Assistant có dòng riêng trong scope matrix; không tự mặc định đã hoàn thành hoặc loại bỏ vì tên roadmap.
- Với tính năng chưa chọn, không để nút làm người dùng tưởng tính năng đang hoạt động; ghi trạng thái demo/ngoài phạm vi khi cần trình bày.
- Không tự tạo đăng ký dịch vụ trả phí, bật billing, public deployment hoặc đưa dữ liệu thật vào hệ thống chỉ để hoàn thành mốc.
- Tự giải quyết quyết định kỹ thuật thông thường trong phạm vi. Chỉ cần hỏi khi thiếu quyết định làm thay đổi yêu cầu, chi phí hoặc quyền đã được cấp; tiếp tục công việc độc lập còn làm được.

### 2.3. Dữ liệu và độ chính xác

- M1 và M2 dùng dữ liệu giả, fixture có thể reset và ngày/giá giả được ghi rõ.
- API giá không đồng bộ lượng sở hữu. Cổ phiếu dùng key riêng của user ở nguồn được hỗ trợ; key không được đặt trong bundle frontend.
- Giá vàng quốc tế được quy đổi vẫn là tham chiếu quốc tế; đơn vị, độ tinh khiết, FX và timestamp phải rõ.
- Tiền mặt là tự khai báo. Phân biệt số dư tính toán và số kiểm đếm.
- Không biến thiếu dữ liệu thành số 0, pending thành posted hoặc tự khai báo thành tài sản đã xác minh.
- Thu nhập, chi tiêu, dòng tiền và biến động định giá là các khái niệm khác nhau.
- Nguồn sự thật tài chính khi đã tích hợp là Ledger/Financial Engine, không phải số cộng riêng trong component hoặc câu trả lời LLM.

### 2.4. Bảo mật theo yêu cầu FinWeave

Admin/Ops không được đọc nội dung tài chính của user. Mã hóa database/ổ đĩa và ẩn màn hình admin chưa đủ chứng minh yêu cầu này nếu runtime giải mã vẫn dưới toàn quyền Ops.

M3 cần thiết kế và kiểm chứng ranh giới xử lý bảo vệ theo mục 15–16 của tài liệu ý tưởng, gồm đường vào/ra, khóa, code approval, client, xác thực, recovery và log. Thực hiện PoC sớm để xác định khả thi và chi phí. Nếu chưa đáp ứng, có thể tích hợp trên dữ liệu giả nhưng trạng thái phải là **tích hợp thử nghiệm**, chưa đạt M3 với dữ liệu tài chính thật.

Assistant Gemini Free Tier trong phạm vi đã thống nhất chỉ dùng workspace giả. Không gửi dữ liệu tài chính thật vào LLM để viết code, debug, đánh giá hoặc tạo prompt; Agent phát triển dùng dữ liệu tổng hợp và lỗi đã lọc. Model, quota và điều khoản phải kiểm tra lại khi tích hợp.

## 3. Nhận nhiệm vụ và quản lý tiến độ

### 3.1. Đầu vào của mỗi lần chạy

Agent xác định các trường sau từ yêu cầu và tài liệu đã có:

```text
PROJECT_ROOT: thư mục code và tài liệu của dự án
IDEA_SOURCE: đường dẫn FinWeave_Ideas.md thực tế
TARGET_LEVEL: M1 | M2 | M3
STEP_RANGE: bước hoặc khoảng bước cần thực hiện
FEATURE_SCOPE: chức năng phải đạt, chức năng ngoài phạm vi
DATA_MODE: synthetic | authorized-real
AUTHORIZED_ACTIONS: quyền sửa file/chạy local/tích hợp/triển khai đã được cấp
KNOWN_CONSTRAINTS: ngân sách, nền tảng, stack và deadline nếu có
```

Nếu chưa xác định mức, mặc định lập kế hoạch để đạt M1 với bốn nhóm lõi và ghi giả định. Không mặc định quyền dùng dữ liệu thật hay triển khai công khai. Nếu yêu cầu đã cho phép làm đến M2/M3, tiếp tục qua các bước đủ điều kiện mà không hỏi lại từng bước.

### 3.2. Kiểm tra hiện trạng

1. Đọc quy định repository áp dụng, tài liệu nguồn và báo cáo tiến độ gần nhất.
2. Xác định stack, package manager, lệnh chạy, cấu trúc, test và môi trường hiện có.
3. Kiểm tra thay đổi đang có; giữ phần việc của user. Không scaffold đè project đang tồn tại.
4. Liệt kê phần đã có bằng chứng, phần mới là đề xuất, phần cần làm để đạt mục tiêu.
5. Ghi kế hoạch vào `docs/execution/plan.md` và cập nhật `docs/execution/progress.md`.

Các đường dẫn `docs/...` bên dưới là **đầu ra cần Agent tạo khi triển khai**, không phải các file đã tồn tại chỉ vì playbook liệt kê chúng.

### 3.3. Hồ sơ tối thiểu

| Hồ sơ | Nội dung |
|---|---|
| `docs/execution/plan.md` | Mục tiêu, phạm vi, thứ tự, phụ thuộc, mức bàn giao |
| `docs/execution/progress.md` | Đã làm, đang làm, bước kế tiếp, lệnh chạy và blocker |
| `docs/execution/decisions.md` | Quyết định, căn cứ, giả định, tác động và lựa chọn còn mở |
| `docs/execution/traceability.md` | Requirement → use case → màn hình → API → test → bằng chứng |
| `docs/execution/evidence/` | Ảnh giao diện, báo cáo kiểm tra, kết quả demo và test đã lọc |
| `docs/governance/artifact-register.md` | Catalogue artefact, owner, version/baseline, trạng thái và quyết định áp dụng |

Mẫu một dòng truy vết:

```text
REQ-CASH-01 | UC-CASH-01 | CashEntryForm | createCashExpense
| E2E-CASH-01 | M2: verified / M3: not-integrated
```

Trạng thái sử dụng: `planned`, `in-progress`, `implemented`, `verified`, `blocked`, `out-of-scope`. Mã đã viết chưa đủ để đánh dấu verified; cần bằng chứng phù hợp mức.

### 3.4. Quản trị bộ artefact FinWeave

Chín bước là trình tự thực hiện. Mỗi bước tạo một **gói artefact được tuyển chọn cho FinWeave** ở mục 3.5. Các catalogue tổng quát chỉ dùng để tham khảo khi xuất hiện nhu cầu mới; không tạo tài liệu chỉ để đủ số lượng.

Mọi artefact thực sự được chọn được quản lý trong `docs/governance/artifact-register.md`:

| Trường | Ý nghĩa |
|---|---|
| `Artifact ID` | Mã ổn định, ví dụ `REQ-SRS-001`, `ARC-HLD-001`, `TST-PLAN-001` |
| `Bước tạo/cập nhật` | Một hoặc nhiều bước trong quy trình 1–9 |
| `Tên và đường dẫn` | Tên artefact cùng vị trí nguồn sự thật |
| `Mục đích/phạm vi` | Câu hỏi artefact trả lời và phạm vi áp dụng |
| `Owner / reviewer / approver` | Người chịu trách nhiệm, rà soát và chấp thuận nếu có |
| `Mức áp dụng` | M1, M2, M3 hoặc nhiều mức |
| `Trạng thái` | proposed, draft, in-review, approved, baselined, superseded, retired |
| `Version / baseline` | Phiên bản, ngày baseline và artefact thay thế nếu có |
| `Nguồn và phụ thuộc` | Ý tưởng, requirement, decision hoặc artefact đầu vào |
| `Liên kết truy vết` | Design/code/test/evidence liên quan |
| `Ghi chú áp dụng` | Điều kiện, giới hạn hoặc lý do chưa cần tạo |

Artefact ngắn có thể được gộp khi vẫn có heading, ID hoặc liên kết truy vết rõ. Tách thành file riêng khi có owner/reviewer khác, cần baseline/phê duyệt độc lập, được nhiều thành phần sử dụng hoặc có vòng đời thay đổi riêng. Artefact không áp dụng cho phạm vi hiện tại không cần xuất hiện dưới dạng file rỗng.

Thay đổi hành vi, hợp đồng, dữ liệu, bảo mật hoặc tiêu chí nghiệm thu phải cập nhật version, impact và traceability. Bản cũ được đánh `superseded`; không để hai nguồn sự thật cùng hiệu lực.

Cấu trúc thư mục gợi ý:

```text
docs/
  governance/   # charter, artifact register, assumptions, risks, decisions
  product/      # vision, scope, roadmap, PRD, use cases, business rules
  design/       # research, flows, IA, prototype, design system, UX/a11y
  requirements/ # SRS, NFR, glossary, requirements baseline, RTM
  architecture/ # HLD/views, LLD, ADR, data/security/backend designs
  contracts/    # API/file/event contracts, mappings, auth/error/idempotency
  data/         # models, dictionary, lineage, metrics, quality, retention
  security/     # threat model, IAM, key management, security evidence
  qa/           # strategies, cases/data, results, defects, UAT, evidence
  operations/   # deploy/rollback, runbooks, SLO, restore, incident, capacity
  handover/     # user guide, release, readiness, acceptance
  execution/    # plan, progress and working coordination records
```

### 3.5. Bộ artefact chuyên nghiệp theo chín bước

| Bước | Bộ artefact FinWeave cần có |
|---|---|
| **1. Chốt phạm vi và nhu cầu** | Product Vision, Problem Statement, Value Proposition, Project Charter, Scope, Feasibility Study, Options Analysis, Cost Model, Assumptions/Constraints, Risk Register và Roadmap |
| **2. Phân tích chức năng và luồng** | Stakeholder Needs, Context Model, Operational Scenarios, PRD, SRS gồm functional requirements và NFR, Use Cases, Business Rules Catalogue, Data Requirements, Glossary và RTM |
| **3. Thiết kế và kiểm chứng prototype** | UX Research Plan/Results khi có nghiên cứu, User Flows, Information Architecture, Wireframes, Prototype, Design System, UX/UI Specification, Accessibility Requirements và Prototype Validation Report |
| **4. Đặc tả giải pháp và hợp đồng** | HLD, Architecture Views, ADRs, LLD cho phần cần xây, API/File/Event Contracts, Source-to-Target Mapping, Error/Auth/Idempotency Models, Data Models và Security Design |
| **5. Xây dựng frontend** | Source Code, Component Specifications, Mock Implementation, Dependency Manifest/Lockfile, Configuration Baseline, Build Scripts và Repository Documentation |
| **6. Kiểm thử frontend** | Test Strategy, Test Cases/Data, Automated Tests, Contract Test Results, Accessibility/Responsive Reports, Defect Log, Frontend Acceptance Report và Integration Handover |
| **7. Backend, dữ liệu và bảo mật** | Backend/Database Design, Ledger/Reconciliation Specification, Metric Definitions, Data Lineage/Quality/Retention Rules, Threat Model, IAM Matrix, Key Management Design, Supplier/License Register; AI Specification/Evaluation Plan nếu có AI |
| **8. Tích hợp và kiểm chứng** | Integration/System Test Reports, Financial Reconciliation Results, Security/Performance/Resilience Reports, AI Evaluation Results nếu áp dụng, UAT Results, RTM cập nhật và Acceptance Evidence Pack |
| **9. Triển khai và bàn giao** | Release Manifest, Deployment/Rollback Plan, Operational Readiness Review, User Guide, Runbooks, Backup/Restore Evidence, Incident Response, SLI/SLO, Cost/Capacity Model và Handover/Acceptance Record |

Đây là bộ chuẩn của FinWeave. Chỉ bổ sung artefact ngoài bảng khi một yêu cầu, rủi ro, nhà cung cấp hoặc nghĩa vụ cụ thể chứng minh là cần; ghi quyết định bổ sung trong register.

### 3.6. Artefact tích lũy theo mức bàn giao

| Mức | Bộ hồ sơ phải có |
|---|---|
| **M1 — Prototype** | Artefact bước 1–3 đã đủ dùng và nhất quán; RTM nối nhu cầu/yêu cầu với luồng, màn hình và bằng chứng prototype |
| **M2 — Frontend sẵn sàng tích hợp** | Giữ/cập nhật artefact M1, bổ sung artefact bước 4–6; contract, mock, build và test chứng minh frontend sẵn sàng |
| **M3 — Sản phẩm hoạt động thực tế** | Giữ/cập nhật artefact M1–M2, bổ sung artefact bước 7–9; bằng chứng backend, bảo mật, tích hợp, triển khai, phục hồi và chấp thuận |

### 3.7. Definition of Ready, Done và chất lượng tài liệu

Một bước **Ready** khi input bắt buộc đã được baseline hoặc giả định đã có owner; dependency, risk và tiêu chí hoàn thành đã rõ. Một bước **Done** khi:

1. gói artefact của bước đã được tạo/cập nhật và register phản ánh đúng trạng thái;
2. nội dung không mâu thuẫn với source of truth, decisions và phạm vi;
3. traceability nối requirement tới design/implementation/test/evidence phù hợp mức;
4. review/verification đã diễn ra và bằng chứng có đường dẫn;
5. rủi ro, deferred item và phần chưa được kiểm chứng có owner/điều kiện xử lý;
6. artefact bị thay thế được đánh `superseded`.

Kiểm tra mỗi artefact theo sáu tiêu chí: đúng, đủ trong phạm vi, nhất quán, rõ nghĩa, có thể kiểm chứng và truy vết được. Agent không được tạo persona, market research, user-test result, legal approval hoặc sign-off giả. Khi chưa có người phù hợp tham gia, tạo kế hoạch/template và ghi `pending external review`.

## 4. Bước 1 — Chốt phạm vi và nhu cầu

**Mục tiêu:** chuyển brainstorm thành phạm vi thực hiện có thể đánh giá.

**Cách làm:**

1. Trích xuất vấn đề, nhóm user dự kiến và các câu hỏi tài chính cần trả lời. Gắn giả định nếu chưa phỏng vấn; không viết kết quả nghiên cứu giả.
2. Đặt các mục tiêu như xem tiền đang ở đâu, tìm khoản chi lớn, theo dõi lượng tài sản/giá, kiểm tra dữ liệu chưa rõ.
3. Lập scope matrix theo chức năng và M1/M2/M3, chỉ rõ hỗ trợ, mô phỏng, hoãn hoặc ngoài phạm vi.
4. Xác định môi trường bàn giao, thiết bị chính, dữ liệu, nguồn tích hợp và quyền đã được cấp.
5. Đặt tiêu chí thành công đo được: hoàn thành tác vụ, hiểu chỉ số, truy tới bằng chứng, số lỗi nghiêm trọng còn tồn tại. Ngưỡng đề xuất phải ghi là mục tiêu, không phải kết quả đo.
6. Ghi phụ thuộc cần khảo sát sớm: nguồn thông báo, provider giá/quyền dùng key, kiến trúc ngăn Ops đọc tài chính.
7. Đưa việc làm thành backlog có priority, dependency và đầu ra, thay vì checklist tên module đơn thuần.

**Gói artefact:** Product Vision, Problem Statement, Value Proposition, Project Charter, Scope, Feasibility Study, Options Analysis, Cost Model, Assumptions/Constraints, Risk Register và Roadmap. Cập nhật artifact register, decisions và traceability.

**Hoàn thành khi:** mỗi chức năng trong phạm vi có user benefit, mức mục tiêu và acceptance criteria; phần mở rộng không bị trộn vào điều kiện của mốc đầu.

## 5. Bước 2 — Phân tích chức năng và luồng sử dụng

**Mục tiêu:** mô tả hành vi trước khi xây màn hình và API.

**Cách làm:**

1. Viết use case cho thiết lập tài chính, nhập/cập nhật dữ liệu, quản lý giao dịch, theo dõi tài sản, dashboard và Review.
2. Mỗi use case ghi actor, mục tiêu, điều kiện đầu, trigger, bước user, phản hồi hệ thống, nhánh lỗi và kết quả sau cùng.
3. Phân biệt nhánh thành công, dữ liệu thiếu, nghi trùng, hủy thao tác, pending, nguồn cũ, mất quyền và xung đột sửa.
4. Lập bảng dữ liệu nghiệp vụ: account, asset/holding, source record, event, evidence, price quote, review case và report snapshot.
5. Ghi quy tắc tiền tệ/đơn vị/ngày, category/loại sự kiện, transfer/refund, số dư đầu kỳ và phạm vi tài khoản.
6. Với rule chưa thống nhất, viết lựa chọn và tác động trước khi dùng trong thiết kế; các quyết định đã có trong nguồn phải được giữ.
7. Lập danh sách trạng thái riêng cho posting, reconciliation, categorization, connection và import; không dùng một status chung cho tất cả.
8. Tạo kịch bản đánh giá xuyên chức năng theo hành vi người dùng, kèm bộ dữ liệu giả nhất quán ở mục 13.

**Mẫu use case:**

```text
ID: UC-CASH-01
Actor: chủ workspace
Mục tiêu: ghi khoản chi tiền mặt và thấy ảnh hưởng lên tài chính
Điều kiện: có ví tiền mặt; user có quyền thao tác
Luồng: mở ghi chi → nhập tiền/ngày/nhóm → kiểm tra → gửi → xem kết quả
Nhánh: số tiền sai; thiếu trường; request lỗi; đã xử lý nhưng phản hồi bị mất
Kết quả: khoản chi xuất hiện một lần; số dư/chi tiêu cập nhật theo version
M1: mô phỏng kết quả
M2: request qua API layer và xử lý phản hồi mock
M3: backend xác thực, ghi sổ và reload vẫn đúng
```

**Gói artefact:** Stakeholder Needs, Context Model, Operational Scenarios, PRD, SRS gồm functional requirements và NFR, Use Cases, Business Rules Catalogue, Data Requirements, Glossary và RTM.

**Hoàn thành khi:** tất cả chức năng trong phạm vi có luồng và nhánh quan trọng; mỗi rule có thể chuyển thành test hoặc tác vụ đánh giá.

## 6. Bước 3 — Thiết kế và kiểm chứng prototype

**Mục tiêu:** đạt M1; user hiểu và thực hiện được chức năng qua mô phỏng.

**Cách làm:**

1. Xây information architecture: Tổng quan, Giao dịch, Tài khoản & Tài sản, Nguồn dữ liệu, Review và các mục đã chọn.
2. Vẽ wireframe luồng chính và các trạng thái quan trọng trước khi chi tiết hóa visual.
3. Tạo design tokens: màu, chữ, spacing, icon, form, card, chart, drawer và trạng thái. Nội dung mặc định tiếng Việt.
4. Dùng dữ liệu giả nhất quán giữa màn hình; nếu mô phỏng một thay đổi thì giao dịch, số dư và dashboard phải cùng phản ánh kịch bản đó.
5. Thực hiện prototype bằng công cụ thiết kế tương tác hoặc web chạy local theo môi trường hiện có; chỉ chọn một cách chính phù hợp bàn giao.
6. Ưu tiên visual trả lời câu hỏi: bar chi tiêu, cơ cấu tài sản, dòng tiền, trạng thái nguồn; có đơn vị, kỳ, nhãn và drill-down.
7. Làm đủ form mở/đóng, nhập dữ liệu, xác nhận, kết quả mô phỏng, điều hướng và hủy. Demo được ghi rõ; không chỉ đặt nút không hoạt động.
8. Kiểm tra desktop và mobile; keyboard, focus, error text và màu không là tín hiệu duy nhất. Không để nội dung chồng/clipped.
9. Chạy tác vụ với người dùng khi có người tham gia. Nếu chỉ Agent tự walkthrough, ghi đúng loại đánh giá, không gọi là nghiên cứu user.
10. Ghi vấn đề, chỉnh thiết kế và lưu ảnh/kịch bản có thể lặp lại.

**Tác vụ kiểm chứng:**

- Thiết lập ngân hàng/ví, ví tiền mặt và khai báo cổ phiếu/vàng.
- Ghi chi tiền mặt và nhận biết ảnh hưởng lên số dư/chi tiêu.
- Nhập sao kê mô phỏng, hiểu preview và dữ liệu chưa rõ.
- Từ biểu đồ chi tiêu mở các giao dịch tạo nên tổng đó.
- Xem cổ phiếu/vàng, phân biệt ngày cập nhật lượng sở hữu với ngày giá.
- Xử lý một nghi trùng hoặc transfer; hiểu điều gì thay đổi sau xác nhận.

**Gói artefact:** UX Research Plan/Results khi có nghiên cứu, User Flows, Information Architecture, Wireframes, Prototype, Design System, UX/UI Specification, Accessibility Requirements và Prototype Validation Report. Research Results chỉ được ghi là kết quả nghiên cứu khi có người và dữ liệu thật tham gia.

**Gate M1:** các tác vụ trong phạm vi chạy được bằng mô phỏng; visual đọc được; thiếu/cũ/tự khai báo có nhãn; lỗi trải nghiệm quan trọng được sửa hoặc ghi nhận. M1 không yêu cầu backend tài chính hay kết nối provider thật.

## 7. Bước 4 — Đặc tả hành vi và hợp đồng dữ liệu

**Mục tiêu:** frontend và backend có thể phát triển theo cùng contract.

**Đầu vào:** scope/use cases/UX đã có baseline. Nếu một phần chưa rõ, hoàn thiện phần đó trước khi viết contract tương ứng.

**Cách làm:**

1. Chọn stack frontend phù hợp code hiện có; ghi quyết định và lệnh chạy. Nếu project mới, xem cấu hình tham chiếu ở hướng dẫn setup.
2. Viết screen specification: trường, validation, thao tác, nguồn dữ liệu, state, điều hướng, error và quyền hiển thị.
3. Viết OpenAPI hoặc schema tương đương có version, request/response/error và ví dụ. DTO/type/schema và mock phải khớp cùng định nghĩa.
4. Định nghĩa money bằng decimal string + currency; lượng/giá là decimal string + unit, timestamp có timezone; rounding và null phải rõ.
5. Quy định pagination, filter, sort, timezone, query key, version/conflict và error code dùng ổn định.
6. Tách service calls như `createCashExpense`, `previewImport`, `confirmImport`, `listTransactions`, `getOverview`, `listHoldings`, `resolveReviewCase`.
7. Đặc tả lifecycle import: preview token/version gắn workspace/tài khoản/file mapping; confirm chỉ ghi phần được phép; job có pending/running/completed/failed và polling/refresh policy.
8. Đặc tả idempotency cho mutation: retry cùng thao tác dùng lại key; payload thay đổi không dùng lại key; frontend chặn submit đồng thời, backend kiểm soát ghi lặp ở M3.
9. Quy định cập nhật sau mutation: invalidate/refetch snapshot liên quan; optimistic update chỉ dùng khi có rollback và không tự tính sổ khác Engine.
10. Ghi auth/session semantics và chính sách secret. `workspace_id` từ client không là bằng chứng quyền truy cập.
11. Với dữ liệu thật, đặc tả lớp transport mã hóa tới vùng bảo vệ ngay từ contract: HTTP gateway có thể chỉ nhận envelope; DTO tài chính là logical API sau giải mã trong boundary. Mock mô phỏng cùng interface. Chốt bản này trước khi tuyên bố frontend sẵn sàng tích hợp với kiến trúc bảo mật thực.
12. Tạo fixtures thành công và lỗi cho từng API: validation, 401, 403, not found, conflict, rate limit, timeout, offline và lỗi dịch vụ.

**Ví dụ DTO logic, dữ liệu giả:**

```json
{
  "eventId": "evt_demo_001",
  "accountId": "cash_demo",
  "amount": { "value": "150000", "currency": "VND" },
  "eventType": "expense",
  "occurredAt": "2026-10-04T12:00:00+07:00",
  "postingStatus": "posted",
  "categoryId": "food",
  "version": 1
}
```

Ví dụ này không cho phép đưa DTO thật qua gateway bản rõ. Boundary/transport là phần contract phải được thiết kế cùng mục 15 của nguồn ý tưởng.

**Gói artefact:** HLD, Architecture Views, ADRs, LLD cho phần cần xây, API/File/Event Contracts, Source-to-Target Mapping, Error/Auth/Idempotency Models, Data Models và Security Design.

**Hoàn thành khi:** mỗi thao tác UI có contract/state/error tương ứng; mô hình tiền/đơn vị nhất quán; transport và các phụ thuộc chưa chốt được chỉ rõ, không bị che bằng mock happy path.

## 8. Bước 5 — Xây dựng frontend trong phạm vi

**Mục tiêu:** frontend thực thi đầy đủ hành vi theo contract trên mock.

**Cách làm:**

1. Tái dùng code/design đã có; tách app shell, shared components, feature modules, API client và mock.
2. Component lấy dữ liệu qua hooks/services và lớp API. Không import fixture trực tiếp vào production UI để né request.
3. Bật mock bằng cấu hình rõ. API production và mock dùng cùng interface; tắt mock phải lộ lỗi kết nối thật khi API không có, không fallback âm thầm về demo.
4. Xây theo từng chức năng hoàn chỉnh: tài khoản/tài sản → cập nhật dữ liệu → giao dịch → theo dõi → Review → phần mở rộng đã chọn.
5. Mỗi chức năng có read, mutation, validation, loading, success, empty, error, retry và cập nhật liên quan đúng phạm vi.
6. Form chặn submit đồng thời, giữ input khi lỗi, hiển thị field/server errors, xử lý cancel và không thông báo thành công trước phản hồi.
7. Phân biệt demo session/route guard với phân quyền thật ở backend. Sửa URL hoặc role frontend không được xem là đã chứng minh isolation.
8. Mock có state nhất quán theo session, hỗ trợ mutation và reset. Nếu dữ liệu giả lưu local thì ghi rõ phạm vi; kết quả reload mock không chứng minh backend lưu thật.
9. Chart/card/table dùng cùng snapshot, nguồn/version/time. Bấm chart đi đúng filter và back giữ ngữ cảnh.
10. Provider key không ở `.env` public frontend/localStorage/log. Form kết nối có thể nhận key demo hoặc cấu hình dummy; key thật phải qua transport bảo vệ khi đã được phép.
11. Hoàn thiện responsive, focus, dialog, label, table thay thế chart, privacy masking và reduced motion.
12. Với Assistant trong scope: canned response hoặc provider demo được chọn rõ, có tools/result cards; không tự biến thành backend đọc dữ liệu thật.

**Gói artefact:** Source Code, Component Specifications, Mock Implementation, Dependency Manifest/Lockfile, Configuration Baseline, Build Scripts và Repository Documentation.

**Hoàn thành khi:** mọi chức năng được chọn có hành vi đầy đủ; không còn placeholder vô nghĩa hoặc request bị bỏ qua; trạng thái lỗi đã được kiểm tra bằng mock.

## 9. Bước 6 — Kiểm thử và bàn giao frontend

**Mục tiêu:** đạt M2 với bằng chứng có thể lặp lại.

**Cách làm:**

1. Chạy typecheck, lint và build theo repository; sửa lỗi ảnh hưởng phạm vi.
2. Test validation/format/conversion cần thiết; test response/schema, API layer và state quan trọng của component.
3. E2E các tác vụ chính trên mock network: thêm account/holding, ghi tiền mặt, import, tìm/sửa category, drill-down và Review.
4. Inject lỗi: request đang chờ, 401/403, validation, conflict, 429, 500, timeout, offline và retry. Xác nhận UI không báo thành công giả hoặc mất input.
5. Test nhiều thao tác nhanh và chuyển trang khi request chưa xong; không để response cũ ghi đè kỳ/filter mới.
6. Kiểm tra responsive và keyboard trực tiếp bằng browser; lưu ảnh và ghi kích thước đã xem.
7. So sánh mock payload với contract; test phải phát hiện contract drift, không chỉ gọi handler dùng cùng object rồi tự khẳng định đúng.
8. Tạo integration checklist: base URL, transport, auth, cookies/CORS/CSRF nếu áp dụng, errors, env, version, pagination và cách tắt mock.
9. Ghi test đã chạy, kết quả, test skipped và lý do; không ghi pass khi tool không chạy được.

**Gói artefact:** Test Strategy, Test Cases/Data, Automated Tests, Contract Test Results, Accessibility/Responsive Reports, Defect Log, Frontend Acceptance Report và Integration Handover.

**Gate M2:** frontend đáp ứng scope trên mock, contract và lớp API rõ, build/check phù hợp pass, hành vi lỗi có bằng chứng, hướng dẫn tích hợp chạy được. Phụ thuộc transport chưa chốt phải được đánh giá tác động; không gọi M2 sẵn sàng với backend bảo mật đã định hướng nếu còn phải thay toàn bộ tầng dữ liệu chưa đặc tả.

## 10. Bước 7 — Backend, dữ liệu và bảo mật

**Mục tiêu:** triển khai nền tảng thật theo contract và yêu cầu bảo mật. Khảo sát/PoC của bước này có thể làm song song sớm, còn tích hợp theo baseline M2.

**Cách làm:**

1. Chọn stack backend sau khi kiểm tra runtime/deployment của vùng bảo vệ, chi phí và năng lực vận hành; giữ hướng modular monolith nếu phù hợp.
2. Ghi architecture decision, threat model và các danh tính có quyền Ops/DBA/code approval/key policy/user recovery.
3. PoC encrypted ingress/egress, workload attestation, key release, user/device auth và signed client/update theo thiết kế đã chọn. Không tự viết thuật toán crypto.
4. Xác minh Ops không sửa workload/client/token/key policy để tự đọc dữ liệu. Xác định trust assumptions, metadata lộ và recovery trước dữ liệu thật.
5. Thiết kế database/migration cho workspace, source/evidence, events/entries, holdings/prices, review và jobs. Các trường nhạy cảm lưu ciphertext; quan hệ/metadata có allowlist.
6. Implement auth/ownership tại boundary thực thi nghiệp vụ; kiểm tra membership và liên kết đối tượng cùng workspace, kể cả tool/report/export.
7. Ghi double-entry atomic, constraints và idempotency. Opening không cộng lại trong movements; original và reversal committed đều được tính; pending không tác động như posted.
8. Implement parser/version, source matching, transfer clearing, partial refund, category override và review; ambiguous case không tự đoán để khớp số dư.
9. Implement Engine và snapshot version: tiền, thu–chi, cash flow, holdings valuation; invalidate/cache mã hóa theo dependency.
10. Implement job retry, backoff, timeout và staging; queue ngoài boundary chỉ opaque IDs/ciphertext refs. Quy định whole-batch/chunk commit đúng thực tế.
11. Tích hợp nguồn đã chọn theo thứ tự ít rủi ro: CSV được hỗ trợ, cash, nguồn giá được cấp quyền, collector chọn lọc. Android collector là đầu việc riêng nếu thuộc scope.
12. Provider adapter kiểm tra quota/license/time/unit; giá cũ vẫn có nhãn, nguồn lỗi không trở thành 0. Key cá nhân không dùng làm feed chung.
13. Audit/log/telemetry/crash/export/backup kiểm tra không lộ tài chính hoặc secret; admin console chỉ metadata.
14. AI chỉ dùng data/provider được phép; nếu chưa có lựa chọn cho real data, giữ tính năng real-data AI chưa phát hành và Engine/rules vẫn hoạt động.
15. Chạy trên dữ liệu giả qua các kiểm chứng bảo mật, migration và nghiệp vụ trước khi mở nguồn thật.

**Gói artefact:** Backend/Database Design, Ledger/Reconciliation Specification, Metric Definitions, Data Lineage/Quality/Retention Rules, Threat Model, IAM Matrix, Key Management Design, Supplier/License Register; AI Specification/Evaluation Plan nếu có AI.

**Hoàn thành khi:** contract được thực thi, lưu thật và invariants có test; ranh giới giải mã được kiểm chứng. Nếu kiến trúc/ngân sách bảo mật còn thiếu, ghi blocker cụ thể và tiếp tục phần local synthetic có ích; không tự hạ yêu cầu riêng tư.

## 11. Bước 8 — Tích hợp và kiểm chứng toàn hệ thống

**Mục tiêu:** chứng minh từng chức năng vẫn đúng với backend và dữ liệu lưu thật.

**Cách làm:**

1. Tắt mock trong chế độ tích hợp; xác minh browser/API log đã lọc thể hiện backend thật, không còn service worker demo can thiệp.
2. Kiểm tra route/query/filter, transport mã hóa, auth/session/recovery và response/error version so với contract.
3. Chạy từng use case end-to-end với synthetic records lưu trong backend; reload, logout/login và client thứ hai phải đọc đúng trạng thái đã commit.
4. Gửi lại request/job/import; kiểm tra database/Engine không có tác động lần hai. Kiểm tra payload khác dùng cùng key bị từ chối.
5. Đánh giá concurrent edits, stale version, mất phản hồi sau commit, worker crash và khôi phục job.
6. Test finance cases: duplicate, transfer fee/one-sided, refund qua kỳ, opening, reversal, category override, thiếu giá/FX và lượng sở hữu cũ.
7. Test workspace A/B qua API trực tiếp, ID swap, report/export, source connections và Agent tools nếu có; route guard UI không đủ.
8. Test Admin/Ops/DB dump, gateway/queue/log/backup/runtime, attestation/code/client/token/registry và rollback/replay theo threat model.
9. Thử nguồn thật trong phạm vi đã cấp quyền sau khi gate bảo mật pass; giữ thông tin thật ngoài chat, repo, screenshots và test reports chia sẻ.
10. Chạy workload đo được: API, import, worker, crypto/search/report. Ghi cấu hình, lượng dữ liệu, concurrency, latency/error; không suy user capacity từ cấu hình server đơn lẻ.
11. Ghi lỗi, sửa phần đã được yêu cầu, chạy lại test bị ảnh hưởng; mỗi mục claimed-integrated có bằng chứng.

**Gói artefact:** Integration/System Test Reports, Financial Reconciliation Results, Security/Performance/Resilience Reports, AI Evaluation Results nếu áp dụng, UAT Results, RTM cập nhật và Acceptance Evidence Pack.

**Hoàn thành khi:** chức năng trong scope lưu/đọc đúng qua backend thật, dữ liệu bền vững, phân quyền và bảo mật có bằng chứng; phần dùng mock được ghi riêng. Backend chạy trên synthetic data là bằng chứng tích hợp kỹ thuật, không tự chứng minh quyền phát hành với real data.

## 12. Bước 9 — Triển khai, chạy thử và bàn giao

**Mục tiêu:** đạt M3 trong môi trường và phạm vi được thống nhất, có thể sử dụng và vận hành.

**Cách làm:**

1. Chuẩn bị release checklist, image/build reproducible, env example không secret và migrations versioned.
2. Thiết lập môi trường local/staging/production được chọn, secrets/key service, protected workload, auth và client integrity theo thiết kế.
3. Triển khai vào môi trường đã được cấp quyền. Nếu quyền chỉ local, hoàn thành local deployment và ghi phạm vi; public production cần quyền và hạ tầng tương ứng.
4. Chạy migration có rollback/forward recovery; backup trước thay đổi dữ liệu material theo runbook. Không reset dữ liệu user để demo.
5. Smoke test sau deploy: login, create/update, reload, báo cáo, jobs, source outage và admin metadata.
6. Thử backup/restore cùng keys/policy/version, source reconnect, recovery và key rotation; restore data nhưng mất key không là restore thành công.
7. Cấu hình health/latency/error/queue/quota alerts và log retention không lộ finance.
8. Chuẩn bị demo chức năng người dùng, tài khoản demo và reset riêng; dữ liệu demo tách môi trường/customer thật.
9. Chạy thử với người dùng khi có điều kiện; ghi phản hồi thật, sửa lỗi ảnh hưởng scope và ghi backlog còn lại.
10. Bàn giao hướng dẫn sử dụng, vận hành, integration, known limitations, release version và bằng chứng các gate.

**Gói artefact:** Release Manifest, Deployment/Rollback Plan, Operational Readiness Review, User Guide, Runbooks, Backup/Restore Evidence, Incident Response, SLI/SLO, Cost/Capacity Model và Handover/Acceptance Record.

**Gate M3:** frontend/backend thật hoạt động trong môi trường công bố; nghiệp vụ/dữ liệu/phân quyền/privacy đúng scope, khả năng restore được kiểm chứng, nguồn tích hợp có quyền sử dụng và phần chưa phát hành được ghi rõ. M3 cho scope bốn nhóm không có nghĩa mọi module tương lai đã hoàn thiện.

## 13. Bộ dữ liệu giả chuẩn để kiểm chứng

Tất cả giá, tài khoản và sự kiện dưới đây là hư cấu. Dùng kỳ demo cố định, timezone `Asia/Ho_Chi_Minh`; refund trong cùng kỳ cho baseline này. Test refund khác kỳ bằng fixture riêng.

### 13.1. Baseline

| Khoản | Giá trị giả |
|---|---|
| Ngân hàng | 20.000.000 VND |
| Ví điện tử | 0 VND |
| Tiền mặt | 2.000.000 VND |
| Cổ phiếu DEMO-A | 100 cổ phiếu × 50.000 VND = 5.000.000 VND |
| Vàng demo | 5 chỉ × 8.000.000 VND/chỉ = 40.000.000 VND |

Tổng tiền ban đầu: **22.000.000 VND**. Tổng tài sản theo dõi ban đầu: **67.000.000 VND**. Không gọi đây là tài sản ròng đầy đủ vì chưa khai báo nghĩa vụ nợ.

### 13.2. Sự kiện trong kỳ

| ID | Sự kiện | Giá trị |
|---|---|---|
| DEMO-01 | Nhận lương vào ngân hàng | +10.000.000 |
| DEMO-02 | Chuyển ngân hàng → ví | 2.000.000 |
| DEMO-03 | Rút ngân hàng → tiền mặt, không phí | 1.000.000 |
| DEMO-04 | Chi ăn uống tiền mặt | 150.000 |
| DEMO-05 | Chi ăn uống từ ví | 250.000 |
| DEMO-06 | Mua hàng bằng ngân hàng | 600.000 |
| DEMO-07 | Hoàn một phần DEMO-06 vào ngân hàng | 200.000 |
| DEMO-08 | Chi ngân hàng chưa phân loại | 100.000 |

### 13.3. Oracle kỳ vọng

| Chỉ số | Kết quả |
|---|---|
| Ngân hàng cuối kỳ | 26.500.000 VND |
| Ví cuối kỳ | 1.750.000 VND |
| Tiền mặt cuối kỳ | 2.850.000 VND |
| Tổng tiền cuối kỳ | 31.100.000 VND |
| Thu nhập | 10.000.000 VND |
| Chi tiêu gộp, gồm chưa phân loại | 1.100.000 VND |
| Refund | 200.000 VND |
| Chi tiêu thuần | 900.000 VND |
| Dòng tiền ròng toàn bộ ba tài khoản tiền | +9.100.000 VND |
| Tài sản theo dõi, giá chưa đổi | 76.100.000 VND |

Thêm bản ghi nguồn thứ hai cho DEMO-06 phải giữ nguyên kết quả. Sau đó cập nhật giá giả DEMO-A lên 55.000 VND/cổ phiếu và vàng lên 8.200.000 VND/chỉ: tài sản thành **77.600.000 VND**, tổng tiền vẫn **31.100.000 VND**, thu nhập/chi tiêu không thay đổi do giá.

Oracle được tính độc lập làm căn cứ, không lấy output của cùng Engine rồi dùng làm expected result.

### 13.4. Fixture bổ sung

- Opening/reversal: original và reversal tồn tại, tổng tác động về 0; opening không cộng hai lần.
- Transfer chỉ một phía; transfer có phí; scope tiền chỉ chứa một tài khoản.
- Refund khác kỳ, nhiều lần và nghi vượt giao dịch gốc.
- Cash count lệch nhưng chưa biết nguyên nhân, không auto expense.
- Price/FX thiếu hoặc stale; cùng ticker khác thị trường; unit vàng không khớp.
- Source sửa revision, category override giữ qua import và case được hai thiết bị xử lý.
- Request timeout sau backend commit, retry cùng key; cùng key payload khác.
- Workspace B cố đọc/update/export/source/tool của A.
- Goal earmark thiếu tiền sau chi tiêu nếu Goals nằm trong scope.

## 14. Cách Agent báo cáo và chuyển bước

Sau mỗi bước hoặc phần chức năng hoàn chỉnh, cập nhật progress và báo cáo ngắn:

```text
Mục tiêu/bước:
Đầu ra đã tạo hoặc sửa:
Chức năng đã verified và mức tương ứng:
Kiểm tra đã chạy, kết quả và evidence:
Phần chưa kiểm chứng / blocker cụ thể:
Bước kế tiếp trong phạm vi được cấp:
```

Nếu bước chưa đạt gate, xử lý lỗi hoặc phần thiếu trong phạm vi trước. Nếu cần thông tin bên ngoài, nêu chính xác quyết định/tài khoản/quyền nào còn thiếu; tiếp tục phần độc lập. Không đánh dấu xong dựa trên code tồn tại, mock persistence hoặc screenshot happy path.

Nếu nhiệm vụ yêu cầu dừng ở M1/M2, hoàn thành hồ sơ mốc đó. Nếu đã được yêu cầu làm đến M3, các gate là điểm kiểm tra chất lượng; không tự biến thành chín lần xin phép chuyển bước.

## 15. Ma trận tự đánh giá cuối cùng

| Câu hỏi | M1 | M2 | M3 |
|---|---|---|---|
| User hoàn thành tác vụ trong scope? | Mô phỏng | Frontend + mock | Frontend + backend thật |
| Dữ liệu và visual nhất quán? | Kịch bản demo | Mock snapshot/contract | Ledger/Engine snapshot |
| Form validation/request/error? | State mô phỏng cần thiết | Thực thi qua API layer | Cả frontend và backend |
| Chống ghi lặp/concurrency? | Thể hiện tình huống | Submit state + contract/mock | Idempotency/transaction thật |
| Reload chứng minh lưu backend? | Không | Không | Có |
| Phân quyền/mã hóa chống Ops? | Chỉ thiết kế/trạng thái demo | Contract và transport mock | Kiểm chứng ranh giới thật |
| Nguồn giá/giao dịch hoạt động thật? | Mock | Mock | Nguồn đã chọn và cấp quyền |
| Bàn giao vận hành? | Cách mở/demo | Setup và tích hợp | Deploy, observability, restore |

Kết luận nghiệm thu phải ghi **mức + phạm vi chức năng + môi trường + bằng chứng**. Ví dụ: “M2 cho bốn nhóm lõi trên mock local; Assistant/Android collector ngoài phạm vi lần bàn giao này.”
