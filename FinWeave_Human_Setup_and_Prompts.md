# FinWeave — Hướng dẫn setup và prompt điều khiển Agent

## 1. Cách sử dụng hai tài liệu

Bạn đóng vai trò chủ sản phẩm: xác định mức cần đạt, chọn phạm vi, xem kết quả và đưa phản hồi. Agent phân tích, tạo tài liệu, thiết kế, lập trình và kiểm chứng trong phạm vi được giao.

- [FinWeave_Ideas.md](FinWeave_Ideas.md): nguồn ý tưởng và yêu cầu nghiệp vụ hiện tại.
- [FinWeave_Agent_Execution_Playbook.md](FinWeave_Agent_Execution_Playbook.md): cách Agent thực hiện chín bước, đầu ra và điều kiện hoàn thành.
- File này: chuẩn bị môi trường, đặt nhiệm vụ, prompt và cách kiểm tra kết quả.

Đây là hướng dẫn cho Agent phát triển dự án. AI Financial Assistant trong FinWeave là một chức năng sản phẩm riêng; làm prototype/frontend không yêu cầu bạn có LLM API key cho sản phẩm.

Các file trong `docs/`, code và test nhắc dưới đây sẽ được tạo khi bạn giao nhiệm vụ thực hiện. Hai file hướng dẫn này chưa có nghĩa ứng dụng đã được xây dựng.

## 2. Chọn mức và phạm vi trước khi giao việc

| Mức | Bạn sẽ nhận | Bạn cần kiểm tra |
|---|---|---|
| M1 — Prototype | Prototype tương tác và tài liệu chức năng/thiết kế | Luồng dễ hiểu, visual giúp nhìn tài chính, tác vụ mô phỏng chạy được |
| M2 — Frontend sẵn sàng tích hợp | Frontend chạy qua API layer với mock, contract và test | Hành vi đủ trong scope, validation/request/error thật, cách nối backend rõ |
| M3 — Sản phẩm hoạt động thực tế | Frontend/backend thật, nghiệp vụ/lưu trữ/bảo mật và triển khai | Reload vẫn đúng, không ghi lặp, không truy cập chéo, Ops không đọc finance, restore được |

Nếu bắt đầu từ thư mục chỉ có ý tưởng, chọn M1. Sau khi đạt M1, có thể yêu cầu tiếp M2 mà giữ thiết kế và tài liệu đã kiểm chứng.

Phạm vi mặc định để bắt đầu là bốn nhóm ngân hàng/ví, tiền mặt, cổ phiếu và vàng, với các chức năng: thiết lập tài chính, thu thập/cập nhật, quản lý giao dịch, theo dõi và Review. Ghi riêng việc có đưa Budget, Goals, Alerts hoặc Assistant vào mốc này hay không. BĐS/vốn kinh doanh là phạm vi mở rộng.

**Mẫu nhiệm vụ:**

```text
TARGET_LEVEL: M1
STEP_RANGE: 1–3
FEATURE_SCOPE: bốn nhóm lõi; thiết lập, thu thập/cập nhật,
               quản lý giao dịch, theo dõi và Review
OPTIONAL_FEATURES: Budget/Goals/Alerts/Assistant chưa chọn cho lần bàn giao này
DATA_MODE: synthetic
PLATFORM: responsive web, tiếng Việt
AUTHORIZED_ACTIONS: tạo/sửa file, chạy ứng dụng và kiểm tra local
DEPLOYMENT: local
BUDGET: không đăng ký dịch vụ trả phí hoặc bật billing
```

Bạn có thể dùng mẫu ngay; thay các giá trị nếu đã có lựa chọn khác. Việc một chức năng chưa được chọn cho mốc hiện tại không loại nó khỏi định hướng sản phẩm.

## 3. Setup môi trường làm việc

### 3.1. Chuẩn bị thư mục và công cụ Agent

1. Mở thư mục dự án trong công cụ Agent có khả năng đọc/sửa file, chạy terminal và kiểm tra trình duyệt.
2. Đảm bảo Agent thấy ba file Markdown ở mục 1. Nếu chuyển sang thư mục hoặc phiên mới, cung cấp đường dẫn thực tế; không mặc định Agent nhớ chat cũ.
3. Cho phép Agent sửa file và chạy local trong thư mục này. Giữ yêu cầu về public deployment, tài khoản thật và chi phí trong nhiệm vụ bạn giao.
4. Khi đã có code, mở đúng repository và yêu cầu Agent đọc hiện trạng trước khi scaffold.
5. Chọn trình duyệt để tự xem kết quả. Agent có thể tự kiểm tra bằng browser khi công cụ hỗ trợ; bạn vẫn có thể chạy tác vụ để đánh giá trải nghiệm.

Tài liệu nguồn hiện có tên `FinWeave_Ideas.md`. Nếu bạn đổi tên, cập nhật đường dẫn nguồn trong prompt và progress thay vì tạo một bản yêu cầu khác không đồng bộ.

### 3.2. Công cụ cần cho mỗi mức

| Mức | Môi trường |
|---|---|
| M1 dạng prototype thiết kế | Công cụ thiết kế tương tác hoặc browser cho web prototype; chưa cần database |
| M1 dạng web và M2 | Editor/Agent, Git nếu dùng version control, Node.js/npm phù hợp stack và browser |
| M3 | Thêm runtime backend, PostgreSQL, worker/object storage và hạ tầng khóa/vùng xử lý theo kiến trúc đã chọn |

Với project mới, một cấu hình frontend tham chiếu là **React + TypeScript + Vite**, mock API bằng **MSW**, kiểm tra UI end-to-end bằng **Playwright**. Agent ghi lựa chọn/versions vào decisions và lockfile. Nếu repository đã có stack phù hợp, tiếp tục stack đó.

Theo [hướng dẫn Vite](https://vite.dev/guide/), `react-ts` là template được hỗ trợ; yêu cầu Node cần kiểm tra tại thời điểm setup. Cài Node LTS được hỗ trợ từ [Node.js](https://nodejs.org/en/download) và kiểm tra tương thích với công cụ test; không chỉ chọn bản cũ đáp ứng tối thiểu của một package.

Kiểm tra trong terminal PowerShell:

```powershell
node --version
npm --version
git --version
```

Nếu thiếu lệnh, cài công cụ tương ứng và mở lại terminal. Không cần API key ngân hàng, provider giá hoặc Gemini để đạt M1/M2 trên mock.

### 3.3. Tạo frontend khi đến bước xây dựng

Chỉ scaffold khi Agent đã kiểm tra thư mục và xác nhận chưa có ứng dụng cần tiếp tục. Không cần chạy phần này trước khi hoàn thành phân tích/thiết kế nếu bạn chọn prototype bằng công cụ thiết kế.

Đối với project mới dùng cấu hình tham chiếu, chạy từ thư mục chứa các tài liệu:

```powershell
npm create vite@latest finweave-web -- --template react-ts
Set-Location -LiteralPath '.\finweave-web'
npm install
npm run dev
```

Agent cũng có thể thực hiện các lệnh này khi được giao xây ứng dụng local. Ghi `PROJECT_ROOT` là thư mục dự án tổng và `APP_DIR` là `finweave-web`; các lệnh npm chạy ở `APP_DIR`, hồ sơ `docs/` có thể đặt tại root đã thống nhất.

Sau lần cài đầu, giữ lockfile. Với clone/checkout đã có lockfile, dùng `npm ci` để cài lại theo bản khóa. Lệnh `npm run build` có trong scaffold; các script test/typecheck khác phải được Agent cấu hình trước khi dùng.

MSW cung cấp lớp mock request độc lập với component, phù hợp để frontend gọi cùng API layer khi chuyển sang backend thật. Thiết lập theo [tài liệu MSW](https://mswjs.io/docs/); mock chỉ bật ở mode demo/test.

Khi đến bước 6, cài và cấu hình Playwright theo [hướng dẫn chính thức](https://playwright.dev/docs/intro). Ví dụ trong thư mục ứng dụng:

```powershell
npm init playwright@latest
npx playwright test
```

Lệnh init có câu hỏi cấu hình và có thể tải browser; nếu giao cho Agent, yêu cầu chọn test folder, browser và CI phù hợp phạm vi. Không cần tạo remote repository hoặc workflow cloud chỉ để chạy local tests.

### 3.4. Cấu hình demo và bí mật

Ví dụ cấu hình public frontend mà Agent có thể tạo:

```dotenv
VITE_DATA_MODE=mock
VITE_API_BASE_URL=/api
```

Agent phải implement các biến này, không chỉ tạo file `.env`. Đây là tên cấu hình đề xuất cho project mới; nếu dự án có tên khác thì dùng tên thực tế.

Không đặt API secret, provider key hoặc DEK/KEK trong biến public frontend. Các khóa thật được cấu hình qua backend/key service theo thiết kế bảo mật. `.env.example` chỉ có placeholder; file chứa secret không vào Git và không dán vào chat.

### 3.5. Khi tiến tới M3

Bạn cần xác định môi trường bàn giao, ngân sách hạ tầng và nguồn dữ liệu được phép. Agent thực hiện PoC security và báo cáo phương án trước khi mở dữ liệu thật. Một máy chạy backend/PostgreSQL chưa chứng minh được yêu cầu Admin/Ops không đọc tài chính.

Nếu chưa có provider account hoặc hạ tầng bảo vệ, vẫn có thể tích hợp backend bằng dữ liệu giả. Kết quả đó phải được ghi là thử nghiệm tích hợp; không nghiệm thu M3 với dữ liệu tài chính thật bằng cách đổi nhãn.

## 4. Cách điều khiển Agent hiệu quả

Một prompt nên có: **mục tiêu + phạm vi + nguồn + đầu ra + tiêu chí hoàn thành + quyền hành động**. Giao việc theo bước hoặc chức năng hoàn chỉnh; tránh chỉ yêu cầu “làm cho đẹp” hoặc “làm hết”.

Bạn có hai cách chạy:

- **Theo mốc:** giao bước 1–3 để đạt M1, sau đó 4–6 để đạt M2, rồi 7–9 để đạt M3. Agent tự tiếp tục trong khoảng được giao.
- **Theo từng bước:** dùng các prompt 1–9 bên dưới khi bạn muốn đọc và phản hồi mỗi đầu ra.

Trong cả hai cách, Agent tự kiểm tra và sửa lỗi trong phạm vi đã được giao. Không cần yêu cầu xin phép mỗi file, mỗi test hoặc mỗi lần chuyển bước. Các quyết định thiếu ảnh hưởng scope/ngân sách/quyền dữ liệu được hỏi cụ thể khi thật sự cần.

### 4.1. Cách quản lý bộ artefact FinWeave

Playbook đã chọn sẵn bộ artefact phù hợp cho từng bước. Các catalogue tổng quát chỉ là nguồn tham khảo; Agent chỉ bổ sung artefact ngoài danh sách khi một yêu cầu, rủi ro, nhà cung cấp hoặc nghĩa vụ cụ thể chứng minh là cần.

Agent quản lý các artefact thực sự được tạo trong `docs/governance/artifact-register.md`. Mỗi artefact cần có ID, đường dẫn, mục đích, owner, trạng thái, version/baseline, nguồn đầu vào và liên kết tới requirement/design/code/test/evidence.

Nội dung ngắn có thể gộp trong một tài liệu nếu có heading và liên kết rõ. Tách file khi artefact có owner/reviewer khác, cần phê duyệt độc lập hoặc có vòng đời thay đổi riêng. Không tạo file rỗng để trông “đủ hồ sơ”.

Mỗi lần bàn giao, bạn kiểm tra:

- gói artefact của bước đã đủ theo bảng ở playbook;
- requirement, decision, design/code, test và evidence truy vết được;
- chỉ có một nguồn sự thật đang hiệu lực, bản cũ được đánh `superseded`;
- tài liệu chưa được con người kiểm chứng ghi đúng trạng thái draft/pending review;
- không có market research, persona, user-test result, legal approval hoặc sign-off do Agent tự bịa.

## 5. Prompt khởi động phiên làm việc

Dán prompt này cùng mẫu nhiệm vụ đã điền ở mục 2:

```text
Bạn là Agent phát triển FinWeave. Đọc:
1. FinWeave_Ideas.md
2. FinWeave_Agent_Execution_Playbook.md
3. FinWeave_Human_Setup_and_Prompts.md
và quy định repository áp dụng nếu có.

Thực hiện nhiệm vụ theo TARGET_LEVEL, STEP_RANGE, FEATURE_SCOPE,
DATA_MODE và quyền hành động tôi cung cấp bên dưới.

Giá trị cốt lõi là thu thập, quản lý và theo dõi tài chính cá nhân.
Thiết kế luồng sử dụng xoay quanh chức năng người dùng:
thiết lập → đưa dữ liệu vào → xem tình hình → khám phá → điều chỉnh khi cần.
Tổng quan là điểm quay lại thường ngày; Review xử lý trường hợp chưa rõ.

Kiểm tra file/code hiện có, giữ thay đổi của tôi và tránh scaffold đè.
Phân biệt M1 prototype, M2 frontend với mock, M3 tích hợp thật.
Tạo/cập nhật plan, progress, decisions và traceability trong docs/execution.
Tạo docs/governance/artifact-register.md và gói artefact được quy định cho
từng bước trong playbook. Không tạo file rỗng cho đủ số lượng; mỗi artefact
phải có owner, trạng thái, version/baseline, nguồn, liên kết và bằng chứng
review phù hợp.

Thực hiện các bước được giao tới khi đạt tiêu chí, tự kiểm tra và sửa lỗi.
Hỏi khi thiếu quyết định làm thay đổi phạm vi/chi phí/quyền; tiếp tục phần
độc lập. Không tự bật billing, gửi dữ liệu thật cho LLM hoặc deploy public.

Cuối nhiệm vụ báo đầu ra, cách mở/chạy, kiểm tra đã thực hiện, mức đã đạt
và phần chưa kiểm chứng. Không chỉ trả lại kế hoạch nếu tôi yêu cầu thực hiện.

[DÁN MẪU NHIỆM VỤ ĐÃ ĐIỀN Ở ĐÂY]
```

Nếu đường dẫn/file đã đổi, sửa danh sách đầu vào. Chỗ trong ngoặc vuông là nội dung bạn điền, không gửi nguyên placeholder rồi mặc định Agent biết lựa chọn.

## 6. Prompt cho chín bước thực hiện

### Prompt 1 — Chốt phạm vi và nhu cầu

```text
Thực hiện bước 1 trong FinWeave_Agent_Execution_Playbook.md.
Mục tiêu: chuẩn bị phạm vi để đạt M1 cho bốn nhóm lõi của FinWeave.

Đọc FinWeave_Ideas.md và hiện trạng workspace. Tạo scope matrix M1/M2/M3,
user problems, chức năng/user benefit, acceptance criteria, backlog và
phụ thuộc. Đánh dấu giả định về nhóm user hoặc nghiên cứu chưa thực hiện.
Budget/Goals/Alerts/Assistant ghi riêng trạng thái phạm vi theo nhiệm vụ.

Tạo Product Vision, Problem/Opportunity, Value Proposition, Project Charter,
scope, feasibility/options/cost assessment, stakeholder/context sơ bộ,
RAID/dependency, roadmap và artifact register; cập nhật hồ sơ execution.
Chỉ bổ sung artefact ngoài gói bước 1 khi có nhu cầu cụ thể. Làm rõ cách
ánh xạ nhãn prototype ở idea sang định nghĩa M1,
tránh yêu cầu xây backend để chứng minh luồng giao diện.

Đầu ra phải dùng được cho bước 2. Báo các quyết định còn mở có ảnh hưởng
thực tế; không tự mở rộng scope hoặc ghi đã phỏng vấn user khi chưa làm.
```

**Bạn xem:** phạm vi có đúng ý mình, bốn nhóm có đủ, phần mở rộng được ghi rõ, tiêu chí có kiểm tra được hay chỉ là tên module.

### Prompt 2 — Phân tích chức năng và luồng

```text
Thực hiện bước 2 dựa trên scope và backlog hiện có.
Viết use cases, business rules, data dictionary và trạng thái cho các
chức năng trong scope: thiết lập, thu thập/cập nhật, quản lý giao dịch,
theo dõi tài chính và Review; thêm chức năng đã chọn nếu có.

Mỗi use case có mục tiêu user, điều kiện, luồng chính, nhánh lỗi và kết quả.
Tách luồng sản phẩm khỏi pipeline import. User có thể mở Tổng quan ngay;
không buộc xử lý toàn bộ Review trước khi xem số liệu hợp lệ.

Giữ đúng transfer/refund/opening/reversal, giá versus lượng sở hữu,
dữ liệu thiếu/cũ và phạm vi báo cáo. Dùng bộ dữ liệu giả ở playbook để
tạo demo scenarios. Cập nhật traceability và các quyết định còn thiếu.

Tạo Stakeholder Needs, Context Model, Operational Scenarios, PRD, SRS gồm
functional requirements và NFR, Use Cases, Business Rules Catalogue,
Data Requirements, Glossary và RTM. Cập nhật artifact register.
Kiểm tra các use case đủ đầu vào cho thiết kế ở bước 3 rồi báo kết quả.
```

**Bạn xem:** đọc một use case và tưởng tượng được thao tác, phản hồi, lỗi và kết quả; luồng không bị giới hạn thành nhập file → dashboard.

### Prompt 3 — Thiết kế và làm prototype

Prompt này chạy riêng thì dừng ở M1. Để xây luôn frontend đầy đủ với mock, dùng **“Thiết kế đến frontend hoàn chỉnh — bước 3–6”** ở mục 7; không cần dán lần lượt bốn prompt. Phạm vi hiện hành lấy từ scope đang hiệu lực, không từ mẫu loại Goals/Assistant của baseline cũ.

```text
Thực hiện bước 3 để đạt M1 trong phạm vi đã chốt.
Đọc ba tài liệu FinWeave, navigations.md, hồ sơ bước 1–2 hiện hành,
docs/execution và quy định repository áp dụng. Dùng scope/PRD/SRS/RTM
đang hiệu lực; không phục hồi exclusion hoặc số AC của baseline cũ.
Giữ đủ 5 navigation: Home (Tổng hợp/Báo cáo/Tài khoản & Tài sản),
Giao dịch, Plan (kế hoạch/đầu tư/goals/mô phỏng), Dữ liệu (nguồn/Review),
Trợ lý AI (chat/history và panel linh vật contextual dùng chung).

Đọc và xem trực tiếp toàn bộ ảnh trong References. Lập reference catalogue
ngắn: file → màn/component → phần học → phần điều chỉnh. Ảnh concept là
reference, không mặc định là component/asset/animation dùng được trực tiếp.
Không yêu cầu user tìm thêm ảnh như điều kiện bắt đầu; tự đề xuất phần
thiếu từ nghiệp vụ, ghi giả định và giữ nhất quán. Không sao chép số liệu,
logo, billing hay tính năng ngoài scope từ reference.

Trước khi scaffold, kiểm tra code/runtime hiện có và ghi ADR chọn stack
frontend: framework/build, routing, styling/components, form/schema,
data-fetch/cache/state, charts, mock network và tests. Cấu hình tham chiếu
ở mục 3.2 không phải quyết định đã chốt. Kiểm tra tài liệu chính thức,
tương thích/giấy phép và khóa dependency versions khi cài. Không tự chọn
backend Rails vì reference Sure, không cài cả các repo tham khảo, không
deploy public hoặc đăng ký trả phí. Chọn để tái dùng code từ M1 tới M2.

Chuẩn bị bộ thiết kế v0.1 trước khi triển khai diện rộng, nội dung cụ thể
cho FinWeave thay vì chỉ khẩu hiệu hoặc file rỗng:
1. Design Principles & Process: hierarchy tài chính, độ rõ, reference,
   vòng render → browser review → sửa; tiêu chí kiểm tra và decision log.
2. Style Guide: semantic colors theo chức năng; typography/type scale
   dễ đọc, tiếng Việt, tabular numerals; một hệ icon chức năng nhất quán;
   logo/illustrations/linh vật, nguồn/quyền sử dụng và giới hạn trang trí.
3. Design Tokens: colors, font/size/weight/line-height, spacing, dimensions,
   radius, border, shadow, breakpoints, z-index, motion/reduced-motion.
   Có tên/ý nghĩa/giá trị; triển khai thành tokens dùng được trong code.
4. Component Specifications: anatomy, variants, states, props, events,
   validation, keyboard/focus, responsive và usage. Bao gồm nền tảng
   button/input/select/dialog/table và thành phần nghiệp vụ MoneyValue,
   freshness/source/evidence, transaction/holding, goal/review/AI cards.
5. Pattern Library: templates/layouts đủ 5 navigation; filter/drill-down,
   form/mutation, import/review, plan/goal/simulation và contextual chat.
   Code snippets lấy từ component đã chạy, không giả đã implement.
6. UX/UI & frontend technical specification: cấu trúc app, routing,
   state/data boundary, responsive, charts, tương tác và checklist visual.

Tạo trang /design chạy được để kiểm tra tokens, components và states;
cập nhật tài liệu theo kết quả render, không khóa thiết kế chưa kiểm chứng.
Không bắt user chọn 2–3 phương án hoặc duyệt từng màn mới được tiếp tục.
Chủ động chọn hướng có căn cứ từ reference và xây toàn bộ phạm vi M1;
các màn chuẩn chỉ là cách tổ chức component, không phải giảm scope.
Dựa trên scope/use cases/business rules, xây information architecture,
wireframes, design tokens và prototype tương tác có cách mở rõ ràng.
Dùng cách thực hiện phù hợp công cụ/project hiện có; nếu chưa có lựa chọn,
làm web prototype local tiếng Việt, responsive.

Ưu tiên biểu đồ/trực quan giúp hiểu tiền, chi tiêu và cơ cấu tài sản.
Có drill-down tới giao dịch/holding, nguồn/time/unit và nhãn dữ liệu thiếu.
Thực hiện form/thao tác/kết quả mô phỏng với dữ liệu giả nhất quán;
không để các nút trong scope chỉ là trang trí.

Walkthrough tác vụ thiết lập tài sản, ghi cash, nhập nguồn mô phỏng,
xem Tổng quan, khám phá giao dịch và xử lý nghi vấn. Kiểm tra desktop,
mobile, keyboard và các trạng thái cần thiết; sửa lỗi tìm được.
Bao phủ thêm Plan/Goals/mô phỏng, AI chat/history/panel và context giữa
5 navigation; đối chiếu toàn bộ AC hiện hành, không chỉ happy path lõi.
Lập coverage matrix: REQ/AC → navigation/màn → action/state → evidence.
Kiểm tra 1440×900, 390×844 và rộng 360px; chart có bảng thay thế,
privacy masking toàn app; actual/planned/simulated/unknown không lẫn nhau.
Ghi đúng nếu mới tự walkthrough, chưa có user test thật.

Bàn giao UX Research Plan/Results khi có nghiên cứu, User Flows,
Information Architecture, Wireframes, Prototype, Design System, UX/UI
Specification, Accessibility Requirements và Prototype Validation Report.
Không tạo research result giả khi chưa có người tham gia. Cập nhật register.
Đánh giá gate M1. Dừng ở M1 sau khi hoàn thành vì đây là mức tôi giao.
```

**Bạn xem:** thử thao tác trên prototype; xác định được tiền đang ở đâu, nhóm chi nào lớn và bấm vào đâu để hiểu một con số.

### Prompt 4 — Đặc tả frontend và API contract

```text
Thực hiện bước 4 để chuẩn bị M2 theo thiết kế đã kiểm chứng.
Kiểm tra code/stack hiện có, ghi lựa chọn phù hợp nếu project mới.
Tái dùng ADR/tokens/components và /design từ bước 3; hoàn thiện thay vì
chọn stack lại hoặc xây app thứ hai. Phủ đủ 5 navigation trong scope hiện
hành, gồm Plan/Goals/mô phỏng và AI/panel; AI M2 là scripted mock.
Đặc tả hành vi từng màn hình: fields, validation, actions, state, quyền,
navigation, response/error và cập nhật dữ liệu sau mutation.

Tạo API contract có version, DTO/schema và ví dụ; định nghĩa tiền/đơn vị,
time/null, pagination/filter, auth, conflict/version, idempotency và
import preview/confirm/job. Tạo interface services và mock scenarios.
Phân biệt thao tác local UI (mở panel/filter) với request/query/mutation;
không ép mọi nút gọi API. Contract có planned items, actual links, goals,
allocations, simulation và AI context/result/history khi thuộc scope.

Đặc tả logical DTO và transport phù hợp yêu cầu dữ liệu thật không lộ
cho gateway/Ops. Ghi rõ phần security PoC còn cần xác minh; không dùng
contract plaintext thông thường rồi giả định sẽ tự khớp kiến trúc bảo vệ.
Nếu privacy transport chưa kiểm chứng, giữ logical contracts và adapter
boundary, ghi rõ mock synthetic transport và phần tích hợp còn blocked;
không tuyên bố sẵn sàng xử lý dữ liệu thật hoặc đã đạt gate security.

Tạo HLD, Architecture Views, ADRs, LLD cho phần cần xây, API/File/Event
Contracts, Source-to-Target Mapping, Error/Auth/Idempotency Models,
Data Models và Security Design. Cập nhật traceability/register và kiểm tra
tất cả actions trong scope đã có contract.
```

**Bạn xem:** mỗi nút thực hiện request nào, có phản hồi gì, lỗi hiển thị thế nào, tiền/ngày/đơn vị được hiểu thống nhất.

### Prompt 5 — Xây frontend với mock

```text
Thực hiện bước 5 và lập trình frontend đầy đủ trong scope M2.
Tái dùng prototype/design/code có ích; component đi qua hooks/services
và API layer theo contract. Mock network ở lớp riêng, không import
fixture trực tiếp vào UI production hoặc fallback demo khi API thật lỗi.

Xây từng chức năng hoàn chỉnh: tài khoản/tài sản, thu thập/cập nhật,
giao dịch, theo dõi, Review và các chức năng bổ sung đã chọn.
Giữ đủ Home/Giao dịch/Plan/Dữ liệu/Trợ lý AI theo scope hiện hành;
không bỏ Goals/mô phỏng/chat vì mẫu cũ gọi chúng optional. Dùng chung
design tokens/components/patterns, cập nhật /design và specifications.
Chuẩn bị asset linh vật phù hợp nếu cần; ảnh concept không được dùng
nguyên như screenshot thay cho UI. Không tự thêm tính năng ngoài scope.
Làm validation, loading/empty/error/success, retry, chặn submit đồng thời,
giữ input khi lỗi và refetch/invalidate dữ liệu liên quan.

Mock có state/mutation/reset nhất quán; biểu đồ/card/detail cùng snapshot.
Giữ responsive/accessibility và labels source/time/unknown.
Không đưa secret thật vào bundle, localStorage hoặc public env.

Tự chạy/check từng chức năng, sửa lỗi và cập nhật progress/traceability.
Bàn giao Source Code, Component Specifications, Mock Implementation,
Dependency Manifest/Lockfile, Configuration Baseline, Build Scripts,
Repository Documentation và artifact register.
```

**Bạn xem:** đổi dữ liệu qua form và thấy UI phản hồi; lỗi mock hiển thị đúng; loading/submit có xử lý; không chỉ có ảnh đẹp.

### Prompt 6 — Kiểm thử và bàn giao frontend

```text
Thực hiện bước 6 và nghiệm thu M2 trong scope đã chốt.
Chạy typecheck/lint/build và các kiểm tra phù hợp project.
Kiểm thử validation, API contract và E2E các tác vụ trên mock.
Bao phủ 401/403, validation, conflict, 429/500, timeout/offline/retry,
submit lặp, response cũ khi đổi filter và cập nhật snapshot sau mutation.

Kiểm tra trực tiếp bằng browser ở desktop/mobile và keyboard; lưu evidence.
Sửa lỗi ảnh hưởng scope rồi chạy lại kiểm tra liên quan.
Kiểm tra toàn bộ AC hiện hành và coverage 5 navigation, cả visual so với
reference: hierarchy, type scale, semantic colors, icon/component consistency,
độ đọc chart/table, labels và responsive. Sửa và chụp lại evidence.
Không hoãn lỗi sai tài chính, action không hoạt động, mất dữ liệu mock,
không truy cập được luồng chính hoặc responsive/a11y nghiêm trọng.
Lỗi thẩm mỹ nhỏ có thể ghi backlog với tác động; không báo PASS giả.
Phân biệt reload mock/local persistence với lưu backend thật.

Tạo Test Strategy, Test Cases/Data, Automated Tests, Contract Test Results,
Accessibility/Responsive Reports, Defect Log, Frontend Acceptance Report
và Integration Handover; ghi base URL,
auth/transport/env, contract version, cách tắt mock và lệnh chạy thực tế.
Đánh giá gate M2, ghi rõ chưa đạt nếu có blocker chưa giải quyết.
Dừng sau khi hoàn thành M2 vì đó là mức tôi giao.
```

**Bạn xem:** có kết quả test thực tế, lệnh chạy lặp lại được, lỗi còn lại được nêu, hướng dẫn tích hợp đủ để backend developer dùng.

### Prompt 7 — Backend, dữ liệu và bảo mật

```text
Thực hiện bước 7 cho scope M3 đã thống nhất; bắt đầu với dữ liệu giả.
Đọc contract, integration notes và yêu cầu mục 15–16 của FinWeave_Ideas.md.
Kiểm tra runtime/deployment và thiết kế vùng xử lý bảo vệ trước khi chốt stack.

Thực hiện PoC threat model, encrypted ingress/egress, attestation/key release,
user/device auth, client/code approval, recovery và chống Ops tự cấp quyền.
Ghi chi phí/phụ thuộc và phần chưa xác minh. Không tự bật dịch vụ trả phí;
tiếp tục phần độc lập nếu thiếu hạ tầng/quyền để kiểm chứng.

Implement backend/worker/migration theo contract: workspace authorization,
double-entry atomic/idempotency, parser/version, transfer/refund/review,
holdings/prices, Engine/snapshots và queue retry. Trường nhạy cảm mã hóa,
logs/admin/backup không có tài chính bản rõ theo boundary đã chọn.

Tích hợp adapter thuộc scope và có quyền; kiểm tra nguồn/unit/time/license.
Assistant thật chưa đáp ứng privacy thì giữ chưa phát hành, không gửi data
thật vào Gemini Free Tier. Không mở dữ liệu thật trước gate security.

Tạo Backend/Database Design, Ledger/Reconciliation Specification, Metric
Definitions, Data Lineage/Quality/Retention Rules, Threat Model, IAM Matrix,
Key Management Design, Supplier/License Register; AI Specification/
Evaluation Plan nếu có AI. Tạo code/test, cập nhật register và đánh giá
kết quả bước 7; ghi blocker cụ thể nếu có.
```

**Bạn xem:** backend có chạy và lưu thật không; có bằng chứng chặn Ops/DBA đọc finance hay chỉ một tuyên bố “đã mã hóa”; hạ tầng có chi phí gì.

### Prompt 8 — Tích hợp toàn hệ thống

```text
Thực hiện bước 8 với backend và frontend hiện có.
Tắt mock ở integration mode và xác minh request đi backend thật.
Chạy use cases với synthetic records lưu backend: create/update/import,
dashboard/drill-down/review, reload/logout-login và client thứ hai.

Kiểm tra idempotency/retry sau commit, job crash, concurrent edits,
opening/reversal, transfer/refund/category, stale/missing price và FX.
Kiểm tra trực tiếp API workspace A/B, report/export/source và tools.
Kiểm chứng security boundary, client/token/registry/key/workload,
logs/queue/backup và rollback/replay theo threat model.

Chỉ dùng nguồn/dữ liệu thật khi quyền và gate bảo mật đã đáp ứng.
Đo workload trong môi trường thực tế đã chọn; ghi cấu hình và kết quả.
Sửa lỗi trong scope, chạy lại test liên quan và cập nhật integration matrix.

Bàn giao Integration/System Test Reports, Financial Reconciliation Results,
Security/Performance/Resilience Reports, AI Evaluation Results nếu áp dụng,
UAT Results, RTM cập nhật, Acceptance Evidence Pack và trạng thái từng chức năng:
integrated, synthetic-only, mock-only, blocked hoặc out-of-scope.
```

**Bạn xem:** reload vẫn đúng, request lặp không nhân đôi giao dịch, tài khoản khác không thấy dữ liệu và mọi số liệu khớp bộ oracle.

### Prompt 9 — Triển khai và bàn giao

```text
Thực hiện bước 9 theo môi trường/quyền triển khai tôi đã cấp.
Tạo reproducible build/release, env example, migrations, health checks,
runbook, user guide và release notes. Triển khai trong môi trường đó;
nếu chưa có quyền/hạ tầng public, hoàn thành local/staging đã được phép
và ghi chính xác phạm vi, không công bố production đã đạt.

Smoke test sau deploy; thử backup/restore cùng key/policy/version,
recovery/rotation và nguồn lỗi/reconnect. Logs/metrics không lộ finance.
Chuẩn bị tài khoản/dữ liệu demo tách thật, demo theo chức năng người dùng.

Bàn giao Release Manifest, Deployment/Rollback Plan, Operational Readiness
Review, User Guide, Runbooks, Backup/Restore Evidence, Incident Response,
SLI/SLO, Cost/Capacity Model, Handover/Acceptance Record; cùng lệnh chạy,
test evidence, known limitations, backlog và artifact register đã cập nhật.
Đánh giá M3 theo scope/môi trường và gate trong playbook. Nếu chưa đạt,
nêu điều kiện thiếu và trạng thái thực tế; không biến synthetic integration
thành sản phẩm xử lý dữ liệu khách hàng thật chỉ bằng đổi nhãn.
```

**Bạn xem:** mở bản triển khai, tự làm tác vụ, xem báo cáo restore và hiểu phần nào đã phát hành/phần nào chưa.

## 7. Prompt chạy liên tục theo mốc

### Thiết kế đến frontend hoàn chỉnh — bước 3–6

Dùng prompt dưới đây trong chat mới tại đúng workspace để triển khai liên tục cả thiết kế và frontend; không cần chạy Prompt 3, 4, 5, 6 riêng. Không đợi duyệt mỗi màn hoặc mỗi bước. M1/M2 vẫn có kiểm tra nội bộ và evidence, không tự coi việc đi tiếp là nghiệm thu của chủ sản phẩm. “Làm ra rồi sửa” là vòng lặp trong nhiệm vụ; không bỏ kiểm thử hoặc chuyển lỗi nghiệp vụ nghiêm trọng sang bàn giao.

```text
Bạn là Agent phát triển FinWeave. Thực hiện trực tiếp, không chỉ lập kế hoạch.

TARGET_LEVEL: M2 — frontend đầy đủ với mock, chưa backend thật
STEP_RANGE: 3–6, liên tục; không dừng để chờ giao lại từng bước
FEATURE_SCOPE: toàn bộ scope baseline đang hiệu lực; đủ 5 navigation
Home/Giao dịch/Plan/Dữ liệu/Trợ lý AI và các tab, forms, states, flows
đã chọn, gồm 4 nhóm lõi, Insights, Goals, mô phỏng và AI contextual.
DATA_MODE: synthetic; AI scripted mock, không gọi LLM/provider thật
PLATFORM: responsive web tiếng Việt, local
AUTHORIZED_ACTIONS: tạo/sửa file trong workspace, cài dependencies dự án
miễn phí phù hợp, chạy app/tests và kiểm tra browser local
BUDGET: không đăng ký trả phí, bật billing hoặc mua asset
DEPLOYMENT: local; không public deployment, tài khoản/ngân hàng thật

Đọc FinWeave_Ideas.md, FinWeave_Agent_Execution_Playbook.md,
FinWeave_Human_Setup_and_Prompts.md, navigations.md, quy định repository,
docs/product/scope.md, PRD, SRS, use cases, business rules, data/scenarios,
RTM và docs/execution hiện có. Baseline hiện hành thắng mẫu/snapshot cũ;
báo mâu thuẫn thực sự thay vì âm thầm giảm hoặc mở scope. Không tạo lại
hồ sơ bước 1–2 từ đầu, chỉ cập nhật phần cần thiết có change record.

Xem trực tiếp toàn bộ ảnh trong References và lập mapping reference.
Bộ này đã chốt đủ để bắt đầu; tự thiết kế phần thiếu, không buộc tôi
tìm thêm reference hoặc chọn 2–3 phương án mới làm. Giữ đúng nghiệp vụ
FinWeave và không bê mọi tính năng/nội dung của sản phẩm tham khảo.

Thực hiện đầy đủ yêu cầu và artefact của Prompt 3–6 ở mục 6 cùng các
gói bước 3–6 trong playbook. Trước triển khai diện rộng, chuẩn bị bộ
thiết kế v0.1: principles/process, style guide, tokens, component specs,
pattern library và UX/UI/technical specs. Chọn frontend stack qua ADR
có căn cứ, kiểm tra tương thích/license, giữ lockfile; không chốt backend
thay tôi. Tạo /design chạy được, hoàn thiện tài liệu từ component thực.

Xây một codebase tái sử dụng từ prototype đến M2. Có thể tổ chức công
việc thành lát nhỏ nhưng bàn giao đủ 5 navigation; không dừng ở 3 màn,
scaffold, dashboard tĩnh hoặc chỉ tài liệu. Hoàn thiện contracts/services
và mock network trước khi mở rộng mutations; không để fixture gắn trực
tiếp vào UI production. Mock state/reset/snapshots nhất quán. API thật
lỗi không được fallback thành thành công demo. Có transport boundary và
security limitations đúng, không tuyên bố đã chống Ops hay lưu thật.

Liên tục render → kiểm tra browser → sửa → test lại. Giữ visual theo
reference, readable type scale, semantic colors, consistent iconography
và components; tiền/tài sản, giá/lượng, actual/planned/simulated/unknown
phân biệt rõ. Bao phủ forms, drill-down, import/review, Plan/Goals,
simulation, chat/history/mascot/context; không nút trang trí trong scope.

Chạy typecheck/lint/build, contract và E2E tests phù hợp; browser desktop
1440×900, mobile 390×844, rộng 360px và keyboard. Kiểm tra lỗi/retry,
conflict, response cũ, submit lặp, oracle và refresh sau mutation. Lập
coverage matrix REQ/AC → screen/action/state → test/evidence. Chỉ ghi
PASS khi đã chạy; chưa có user test thì ghi Agent walkthrough.

Tự tiếp tục và sửa lỗi trong phạm vi; không xin duyệt từng component hoặc
chuyển bước. Chỉ hỏi khi thiếu quyết định làm thay đổi scope, chi phí,
quyền, mất dữ liệu hoặc ý nghĩa tài chính; tiếp tục phần độc lập.
Nếu bị giới hạn môi trường, ghi blocker/evidence và phần chưa kiểm chứng,
không bỏ test rồi gọi M2 đạt. Lưu tiến độ rõ để phiên sau tiếp tục không
scaffold lại. Không tự coi self-review là PO sign-off.

Bàn giao app mở được cùng lệnh chạy, design system/pattern library,
contracts/mock, source/lockfile/config, test reports/visual evidence,
integration handover, defects/backlog và register/RTM/progress cập nhật.
Đánh giá M1 và M2 riêng theo bằng chứng; ghi rõ mock-only, security/backend
chưa kiểm chứng. Dừng sau bước 6; không tự làm bước 7–9.
```

### Làm từ ý tưởng đến M1

```text
Đọc ba tài liệu FinWeave và quy định repository. Thực hiện liên tục bước
1–3 của playbook để đạt M1 cho bốn nhóm lõi và năm chức năng chính.
Lập artifact register và tạo đúng gói artefact bước 1–3 trong playbook;
gộp hợp lý nhưng không bỏ traceability hoặc tạo file rỗng.
Dùng dữ liệu giả, tiếng Việt, responsive web local. Tạo tài liệu yêu cầu,
prototype chạy được, review/evidence và progress. Tự kiểm tra/sửa lỗi;
không cần hỏi lại để chuyển bước trong phạm vi này.
Kết thúc bằng cách mở prototype, đánh giá gate M1 và phần còn thiếu.
```

### Tiếp tục từ M1 đến M2

```text
Đọc progress, scope, UX và ba tài liệu FinWeave. Kiểm tra baseline M1,
hoàn thiện phần thiếu ảnh hưởng công việc rồi thực hiện bước 4–6 để đạt M2.
Cập nhật register/baseline/change records và tạo đúng gói artefact bước
4–6 về giải pháp, hợp đồng, frontend và kiểm thử trong playbook.
Giữ scope hiện có; frontend qua API layer, contract versioned, mock
network/state/error và test. Không cần backend/provider thật cho mốc này.
Tự kiểm tra/sửa lỗi và bàn giao frontend cùng integration notes/evidence.
```

### Tiếp tục từ M2 đến M3

```text
Đọc progress, scope, contract, integration notes và playbook.
Thực hiện bước 7–9 tới M3 cho scope hiện tại trong quyền/môi trường đã cấp.
Cập nhật artifact register và tạo đúng gói artefact bước 7–9. Trước khi
xử lý dữ liệu thật, các thiết kế và bằng chứng về data, security/privacy,
supplier/license, V&V và vận hành phải được review/baseline phù hợp.
Bắt đầu bằng synthetic data và security PoC; giữ yêu cầu Ops không đọc
finance. Nguồn thật/chi phí/triển khai thực hiện theo quyền đã có.
Khi thiếu quyết định bắt buộc, báo chính xác và tiếp tục phần độc lập.
Tự triển khai phần được phép, kiểm tra/sửa lỗi, bàn giao bằng chứng,
runbook và kết luận mức đạt thực tế.

Môi trường triển khai được cấp: [ĐIỀN LOCAL/STAGING/PRODUCTION VÀ PHẠM VI]
Ngân sách/hạ tầng đã cấp: [ĐIỀN GIỚI HẠN VÀ THÔNG TIN KHÔNG BÍ MẬT]
Nguồn dữ liệu được phép: [ĐIỀN NGUỒN; KHÔNG DÁN KEY VÀO CHAT]
```

## 8. Prompt tiếp tục, kiểm tra và sửa kết quả

### Tiếp tục ở phiên mới

```text
Tiếp tục FinWeave từ trạng thái thực tế. Đọc ba tài liệu hướng dẫn/ý tưởng,
docs/execution/progress.md, plan, decisions và traceability nếu đã có.
Kiểm tra code/test và giữ thay đổi hiện có. Xác định bước gần nhất có
bằng chứng verified, phần đang làm và mục tiêu được giao.
Tiếp tục phần chưa xong tới mức [M1/M2/M3], không scaffold lại hoặc chỉ
tóm tắt việc cũ. Cập nhật progress và báo kết quả có bằng chứng.
```

### Kiểm tra mức hiện tại

```text
Đánh giá FinWeave hiện đạt M1, M2 hay M3 trong scope đã chốt.
Đọc hồ sơ, kiểm tra trực tiếp sản phẩm và chạy các kiểm tra cần thiết.
Tạo bảng chức năng → claimed level → actual evidence → missing work.
Phân biệt mock/localStorage với backend lưu thật, route guard với quyền
server, thiết kế encryption với boundary đã kiểm chứng.
Chỉ đánh giá và báo cáo, chưa sửa code trong nhiệm vụ này.
```

### Yêu cầu sửa phần chưa đạt

```text
Sửa các vấn đề sau trong scope hiện tại:
1. [Bước thao tác và hành vi quan sát được]
2. [Kết quả tôi mong đợi]

Đối chiếu use cases/rules/contract. Xác định nguyên nhân, sửa đúng lớp,
cập nhật test hoặc evidence phù hợp và kiểm tra các chức năng bị ảnh hưởng.
Giữ phạm vi/kiến trúc đã thống nhất, cập nhật progress. Báo điều gì đã đổi
và cách tôi tự kiểm tra lại; không chỉ đưa lời khuyên sửa.
```

### Cải thiện visual có mục tiêu

```text
Hoàn thiện màn [TÊN MÀN] để user trả lời câu hỏi [CÂU HỎI TÀI CHÍNH].
Kiểm tra hierarchy, chart phù hợp, đơn vị/kỳ/nhãn, drill-down, mobile,
keyboard và dữ liệu thiếu/cũ. Dùng cùng snapshot/contract hiện có.
Thực hiện thay đổi và walkthrough tác vụ, bàn giao ảnh/evidence.
Không thay số liệu nghiệp vụ chỉ để giao diện trông đẹp hơn.
```

### Thêm một chức năng

```text
Thêm chức năng [TÊN] vào scope ở mức [M1/M2/M3].
Đọc hiện trạng và phân tích ảnh hưởng tới use cases/rules/UX/data/API/
security/test. Cập nhật scope/backlog/traceability rồi thực hiện đầy đủ
đầu ra của mức đã chọn, kiểm tra và bàn giao. Chỉ hỏi nếu thiếu quyết định
làm thay đổi chi phí/quyền hoặc ý nghĩa chức năng.
```

## 9. Checklist nghiệm thu dành cho bạn

### Artefact áp dụng cho mọi mức

- [ ] Có `artifact-register.md` quản lý đúng gói artefact của các bước đã thực hiện.
- [ ] Artefact bắt buộc có ID, mục đích, phạm vi, owner, trạng thái, version và liên kết.
- [ ] Nội dung gộp chỉ tới đúng tài liệu/mục; phần hoãn có lý do và điều kiện kích hoạt.
- [ ] Requirements, decisions, design/code, tests và evidence nối được trong RTM.
- [ ] Không có hai nguồn sự thật cùng hiệu lực; bản cũ được đánh superseded.
- [ ] Không có market research, persona, user-test result, legal approval hoặc acceptance sign-off do Agent tự bịa.
- [ ] Rủi ro, nghĩa vụ, supplier dependency và non-conformance quan trọng có owner/trạng thái.
- [ ] Kết luận mức bàn giao ghi rõ scope, môi trường và bằng chứng, không dựa vào số lượng tài liệu.

### M1

- [ ] Tôi thực hiện được các tác vụ mô phỏng thuộc scope.
- [ ] Luồng bắt đầu từ mục tiêu/chức năng người dùng; Tổng quan dùng được ngay khi đã có dữ liệu.
- [ ] Visual giúp tôi hiểu tiền/chi tiêu/tài sản và mở được căn cứ.
- [ ] Giá, số lượng, nguồn, thời điểm và dữ liệu thiếu được phân biệt.
- [ ] Tôi biết kết quả nào là mô phỏng; có cách mở và reset demo.
- [ ] Vấn đề UX quan trọng được ghi và xử lý.

### M2

- [ ] Mọi chức năng được chọn đã có frontend hành vi đầy đủ.
- [ ] Request đi qua API layer với mock theo contract, không chỉ set state giả trong component.
- [ ] Form validate, giữ dữ liệu khi lỗi và chống submit đồng thời.
- [ ] Loading/empty/error/conflict/timeout/retry được kiểm tra.
- [ ] Chart/card/detail dùng dữ liệu nhất quán và drill-down đúng.
- [ ] Có test report, lệnh chạy và integration notes; transport/auth không bị bỏ trống.
- [ ] Không dùng mock persistence để tuyên bố đã lưu backend thật.

### M3

- [ ] Mock đã tắt trong môi trường nghiệm thu.
- [ ] Tạo/sửa/lưu và tải lại vẫn đúng từ backend thật.
- [ ] Import/request/job lặp không ghi thêm tác động tài chính.
- [ ] Thu–chi, transfer/refund, opening/reversal và định giá khớp oracle.
- [ ] API kiểm tra quyền; workspace khác và Admin/Ops không đọc tài chính theo trust model đã kiểm chứng.
- [ ] Nguồn thật có quyền; AI thật chưa đủ điều kiện không được bật.
- [ ] Backup/restore cùng khóa thành công, có runbook và log/metric an toàn.
- [ ] Bàn giao ghi đúng scope, môi trường, phần chưa phát hành và bằng chứng.

## 10. Cách ghi phản hồi để Agent sửa nhanh

Ghi hành vi và tác động thay vì đánh giá chung. Ví dụ:

```text
Ở màn Tổng quan, tôi bấm vào thanh Ăn uống nhưng danh sách mở ra còn
các nhóm khác. Tôi muốn danh sách chỉ gồm khoản tạo nên chỉ số đó,
giữ cùng kỳ/tài khoản và Back quay về đúng biểu đồ trước đó.
Hãy sửa và kiểm tra cả desktop/mobile.
```

Hoặc:

```text
Tôi bấm Lưu hai lần khi request chậm và thấy hai khoản chi.
Ở M2 cần chặn submit đồng thời và dùng contract idempotency đúng;
ở M3 cần backend bảo đảm retry không ghi lần hai. Hãy xác định mức
đang lỗi, sửa và cung cấp bằng chứng sau kiểm tra.
```

Tiêu chí đánh giá cuối cùng là **chức năng hoàn thành đúng ở mức đã chọn**, có bằng chứng và có thể tiếp tục phát triển từ kết quả đó.
