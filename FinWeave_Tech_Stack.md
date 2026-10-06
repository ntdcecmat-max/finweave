# FinWeave — Tech stack A–Z và lộ trình triển khai

**ID: TECH-STACK-001 · FW-TECH-v0.1 · 05/10/2026 (Asia/Saigon) · proposed / pending review.** Owner: Agent soạn thảo; người quyết định sản phẩm: chủ dự án. Đây là phương án kỹ thuật để triển khai, không phải bằng chứng phần mềm đã chạy, quyết định đã được phê duyệt hoặc benchmark đã đạt.

Đọc cùng [Ideas](FinWeave_Ideas.md), [Navigation](navigations.md), [Scope](docs/product/scope.md), [PRD](docs/product/prd.md), [SRS](docs/requirements/srs.md), [Business Rules](docs/product/business-rules.md), [Data Requirements](docs/data/data-requirements.md), [Playbook](FinWeave_Agent_Execution_Playbook.md) và [Human Setup & Prompts](FinWeave_Human_Setup_and_Prompts.md).

Tài liệu mẫu của dự án khác chỉ cung cấp **cấu trúc trình bày**. Lựa chọn bên dưới xuất phát từ FinWeave: frontend trực quan, đủ năm navigation, phát triển nhỏ, ưu tiên không phát sinh phí dịch vụ, có đường tiến tới SaaS và yêu cầu bảo vệ tài chính khỏi Admin/Ops. Không mang nghiệp vụ, ngưỡng hiệu năng hoặc phần cứng của mẫu sang đây.

## 1. Quyết định tổng thể và ba giai đoạn

Đề xuất **một frontend React/TypeScript dùng xuyên suốt**, khởi đầu chạy local với mock. Chuyển sang dữ liệu thật bằng lớp services/contracts/transport, không viết lại giao diện chỉ vì thay backend. Backend tổ chức modular monolith, PostgreSQL và worker khi cần; chưa dùng microservices.

| Giai đoạn sản phẩm | Mục tiêu | Cấu hình đề xuất | Điều kiện / giới hạn |
| --- | --- | --- | --- |
| **G1 — Prototype → frontend đầy đủ** | Thiết kế đẹp và tác vụ của đủ 5 navigation chạy được | React + TypeScript + Vite; design system; MSW; dữ liệu synthetic; AI scripted | Bao gồm M1 rồi M2 của playbook. M1 không chỉ ba màn; M2 không backend thật |
| **G2 — Bản hoạt động để demo và dùng cá nhân** | UI nối backend, lưu thật, Engine/ledger/import/Plan hoạt động thực | Giữ frontend; backend được chọn sau spike tái sử dụng; phương án tự xây ở mục 3; PostgreSQL/private storage; AI local nếu đạt thử nghiệm | Mục tiêu 0đ **phí dịch vụ bổ sung** trên thiết bị sẵn có. Dữ liệu thật vẫn bị gate privacy hiện hành; không tự miễn gate vì chỉ một user |
| **G3 — SaaS công khai** | Nhiều workspace, nguồn có quyền, bảo mật và vận hành thực | Hạ tầng được phê duyệt; vùng xử lý bảo vệ/khóa/client trust; ingress HTTPS, backup, monitoring, capacity | Cần ngân sách và security PoC. Không cam kết free tier đáp ứng tải, SLA hoặc chống Ops |

M1/M2/M3 là **mức bằng chứng**, G1/G2/G3 là **lộ trình sản phẩm**. G2 lưu được dữ liệu synthetic với backend thật chưa đồng nghĩa M3 được xử lý tài chính thật. Nếu muốn một bản cá nhân dùng dữ liệu thật trên máy do chính chủ sở hữu kiểm soát nhưng không có confidential computing, phải phê duyệt riêng trust model và sửa scope/security tương ứng; tài liệu này **không tự cấp ngoại lệ** đó.

“0 đồng” không gồm giá máy, điện, Internet đang có, nhân công, ổ backup hay subscription Agent đã dùng. Mục tiêu miễn phí dịch vụ không bảo đảm mọi provider hoặc AI thật khả thi. Phần không đạt phải được báo riêng, không thay bằng mock rồi gọi là hoạt động thực sự.

## 2. Hiện trạng và mức độ chắc chắn

Kiểm kê workspace ngày 05/10/2026 cho nhiệm vụ viết tài liệu này:

| Phần | Bằng chứng đã có | Chưa được phép suy ra |
| --- | --- | --- |
| Hồ sơ sản phẩm | Scope-v2/analysis-v2: 28 REQ/AC; bốn nhóm lõi; Plan/Goals/Insights/AI và 5 navigation | Chưa là prototype, code hoặc user acceptance |
| Reference | 40 ảnh trong `References`; đã xem các mẫu đại diện ở phiên trước | Không phải mọi ảnh đã được phân tích đầy đủ; concept không tự là asset triển khai |
| Hướng dẫn Agent | Prompt bước 3–6 có bộ thiết kế, contracts, mock, tests và cách chạy liên tục | Chưa chứng minh execution hoàn thành hoặc đã chọn phiên bản dependency |
| Source/runtime ứng dụng | Chưa thấy package manifest, lockfile hoặc code app trong kiểm kê hiện tại | Chưa scaffold, cài package, chạy app hay test frontend |
| Công cụ trên PATH | Có đường dẫn Node, npm, Git, Docker CLI | Chưa kiểm version/daemon hoặc build compatibility; Docker CLI không chứng minh container chạy |
| PostgreSQL/Ollama | Không tìm thấy `psql` và `ollama` trên PATH trong lần kiểm tra | Không kết luận chưa cài; chưa xác minh dịch vụ, RAM/GPU/VRAM hoặc hiệu năng |
| Backend tham khảo | Đã nghiên cứu sơ bộ Sure/Firefly III/Ghostfolio ở các phiên trước; đối chiếu lại repository chính thức cho tài liệu này | Chưa clone/run, chưa có fit-gap, license assessment hoặc security evidence cho FinWeave |
| Security, nguồn và AI thật | Có yêu cầu/ứng viên trong Ideas | Chưa provider integration, confidential-computing PoC, model eval hoặc quyền phân phối dữ liệu |

Trạng thái dùng trong tài liệu:

- **Đề xuất baseline:** công nghệ nên dùng khi triển khai; chưa installed/tested/PO-approved.
- **Cần spike:** ứng viên phải thử bằng code, dữ liệu và report trước khi chốt.
- **Có điều kiện:** chỉ triển khai sau quyền, gate hoặc trigger cụ thể.
- **Chưa triển khai:** trạng thái thực tế của toàn bộ stack ứng dụng tại thời điểm viết.

Không chọn số patch chỉ từ tên mới nhất. Ngày rà soát, [Node 24 là LTS, Node 26 là Current](https://nodejs.org/en/about/previous-releases); đề xuất Node 24 LTS, khóa patch sau doctor/compatibility check. Phiên bản các thư viện còn lại khóa bằng lockfile khi cài; chỉ dùng bản stable tương thích, không chọn alpha/canary để chạy demo.

## 3. Tech stack theo lớp

### 3.1. Frontend — baseline đề xuất cho G1 và kế thừa G2/G3

| Lớp / module | Lựa chọn | Trách nhiệm / lý do và giới hạn |
| --- | --- | --- |
| Ngôn ngữ/toolchain | TypeScript strict + Node 24 LTS + npm | Types thống nhất; npm đủ cho dự án nhỏ, không cần nhiều package managers. Runtime browser không cần Node trên máy user |
| UI/build | React + Vite, SPA | Dashboard nghiệp vụ, tương tác nhiều; build static. Không cần SSR/Next.js chỉ để app có vẻ chuyên nghiệp. [Vite có template React/TS](https://vite.dev/guide/) |
| Routing | React Router, declarative mode | Routes theo 5 navigation; nested tabs, deep links, query params cho kỳ/filter. Data-fetch thuộc Query, tránh hai cache cạnh tranh. [Tích hợp Vite](https://reactrouter.com/start/declarative/installation) |
| Styling/tokens | Tailwind CSS + CSS custom properties | Layout responsive nhanh, semantic tokens là nguồn chuẩn; không rải mã màu trực tiếp. Dùng tích hợp [Tailwind/Vite](https://tailwindcss.com/docs/installation/using-vite) tương ứng phiên bản đã khóa |
| Primitives/components | shadcn/ui, chọn nền Radix cho component cần dùng | Tái sử dụng hành vi dialog/menu/tabs; chỉnh anatomy/style theo FinWeave. shadcn cung cấp code có thể tùy chỉnh, không phải theme tự bảo đảm đẹp. [shadcn](https://ui.shadcn.com/docs), [Radix](https://www.radix-ui.com/primitives/docs/overview/introduction) |
| Server state | TanStack Query | Query keys có workspace/period/scope/version; cache, invalidate sau mutation, loading/error. Không lưu cùng report ở nhiều global stores. [Query](https://tanstack.com/query/latest/docs/framework/react/overview) |
| UI state | React state/reducer/context + URL | Dialog, privacy mask, selected object, conversation UI. Không chọn Redux/Zustand trước khi xuất hiện nhu cầu thật; filter có thể chia sẻ giữ trong URL, không chứa secret |
| Forms | React Hook Form + Zod resolver | Input/dirty/errors, validation typed, giữ dữ liệu khi lỗi. Backend vẫn phải validate; validation client không là authorization. [RHF](https://github.com/react-hook-form/react-hook-form), [Zod](https://zod.dev/) |
| Tables | TanStack Table + semantic HTML | Headless model cho sorting/filter/pagination; style bằng design tokens. Quyết định client/server filtering theo contract; không auto thêm batch/export ngoài scope. [Table](https://tanstack.com/table/latest) |
| Charts | Apache ECharts, bọc bởi component React nội bộ | Line/bar/donut/Sankey khi dữ liệu phù hợp; tooltip/drill-down và bảng thay thế. Import modular, lazy-load; không cài thêm Recharts/Chart.js cùng lúc. [ECharts](https://echarts.apache.org/en/index.html) |
| Số chính xác | decimal.js + tiền/quantity dưới dạng decimal string trong DTO | Hạch toán/định giá không dùng floating point. Chuyển number chỉ ở ranh giới chart, số label vẫn từ giá trị chính xác. [decimal.js](https://github.com/MikeMcl/decimal.js) |
| Ngày/tiền hiển thị | Intl + date-fns và timezone utilities khi cần | `vi-VN`, Asia/Ho_Chi_Minh; date-only khác timestamp, kỳ half-open theo rules. Không thêm nhiều date libraries cùng chức năng |
| Icons | Lucide React, một hệ line icon | Stroke/kích thước thống nhất; nhãn đi cùng thao tác quan trọng. Logo/thương hiệu và linh vật là asset riêng. [Lucide](https://lucide.dev/guide/react) |
| Typography/assets | Be Vietnam Pro WOFF2 local là ứng viên font; SVG/WebP/PNG theo asset | Kiểm font license/glyph tiếng Việt/numerals trước dùng. Reference giữ trong thư mục riêng; không đóng gói screenshot người khác thành UI production |
| Motion | CSS transitions trước; Motion for React khi cần layout/presence | Microinteraction hỗ trợ thao tác, reduced-motion; không cinematic scroll-jacking trong dashboard. Chỉ core library cần thiết, không Motion+ trả phí. [Motion](https://motion.dev/docs/react) |
| AI/linh vật G1 | Scripted assistant adapter + React chat/result cards | Cùng conversation giữa panel và full chat, context/version rõ; không key/LLM API. Linh vật tĩnh là baseline; animation phụ thuộc asset thật |
| API client | Fetch wrapper + AbortController + typed services | Central errors, credentials, timeout/context cancellation, auth/crypto transport adapter. Không gọi fetch trực tiếp rải trong page |
| Contract schemas | Zod logical schemas + generated JSON Schema/OpenAPI ở bước 4 | Một nguồn DTO; conversion phải kiểm giới hạn/refinements. Business rules không thay bằng schema; không viết hai bộ schema lệch nhau |
| Mock | MSW browser/Node + stateful demo repository | Cùng đường request như real adapter, fixtures chỉ trong mock/test; seed/reset/idempotency/error modes rõ. [MSW](https://mswjs.io/docs/) |
| Demo persistence | Memory mặc định; IndexedDB chỉ cho synthetic demo nếu cần reload | Không token/key/real finance trong localStorage. Seed version/reset rõ; persistence mock không chứng minh backend durability |
| Tests/QA | Vitest + Testing Library + Playwright + axe-core | Unit/component/contract/E2E, responsive, keyboard, a11y và screenshots. Auto checks không thay manual visual review. [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro) |
| Code quality | ESLint + Prettier + tsc | Scripts kiểm tra được; không bật hai linters/formatters cạnh tranh. Dùng config tương thích toolchain đã khóa |

**Quyết định thiết kế:** chọn primitives/code nền để tiết kiệm công hành vi, nhưng xây tokens, composition và components nghiệp vụ riêng. Không dùng nguyên bộ shadcn mặc định rồi coi đã khớp gu reference. Light-first là hướng đề xuất; dark mode chưa là phạm vi bắt buộc và không được thêm bằng cách bỏ các chức năng đã chọn.

### 3.2. Backend và dữ liệu — phương án tự xây để đối chiếu với tái sử dụng

Các dòng sau là **baseline ứng viên cho G2**, không yêu cầu cài trong G1. Quyết định dùng backend tự xây hay Sure còn ở gate mục 6. Chúng mô tả năng lực logic; **runtime thường không đạt bảo đảm chống Ops ở mục 9**.

| Lớp / module | Lựa chọn đề xuất | Trách nhiệm / điều kiện |
| --- | --- | --- |
| API | Node/TypeScript + Fastify | Modular monolith nhẹ, plugins có compatibility checks; controllers gọi application/domain services. Không lấy benchmark chung làm capacity dự án. [Fastify](https://fastify.dev/) |
| Domain modules | Identity/Accounts/Ingestion/Ledger/Reconciliation/Holdings/Engine/Plan/Goals/AI/Audit | Ranh giới code rõ, không tách service theo mỗi navigation; UI không quyết định transaction boundary |
| Persistence | PostgreSQL + `pg` + SQL migrations | FK, unique, version, transaction, locking; schema review ledger dễ nhìn. Không bắt ORM nếu không đem lợi ích; service chạy trong vùng bảo vệ trước dữ liệu thật |
| DB version | PostgreSQL 17, latest supported minor khi setup, là baseline ứng viên | Không bê PG17 từ mẫu: chọn nhánh supported và thử driver/queue/deployment; đổi sang nhánh supported khác bằng ADR nếu có lợi. [Versioning policy](https://www.postgresql.org/support/versioning/) |
| Async jobs | pg-boss + PostgreSQL | Import/update source/report jobs, retry/schedule; transaction-aware enqueue hoặc outbox cùng transaction ingress. Chỉ job IDs/ciphertext ở queue ngoài vùng bảo vệ. [pg-boss](https://github.com/timgit/pg-boss) |
| Worker | Node process riêng, cùng domain services | Giới hạn concurrency, leases/retry; không inference hoặc import dài trong request. Retry không thay ledger idempotency; crash recovery phải test |
| CSV/parser | `csv-parse` + source adapters có version | Read theo profile/locale; preview/confirm chọn subset, validation/provenance. Giới hạn dung lượng/rows; không tự coi CSV bất kỳ là sao kê hỗ trợ |
| Ledger | Domain service + atomic PG transactions | Balanced postings, immutable posted history, reversal/replacement, unique command key; không dùng table CRUD làm kế toán |
| Financial Engine | Deterministic domain library + versioned snapshots | Số dư, flow, valuation, planned/actual/remaining/goals/simulation đúng rules; một nguồn số, không để LLM hoặc chart tự tính nguồn sự thật |
| Storage | Private filesystem + storage adapter | File gốc/provenance cần giữ; không `public/`. Khi có nhiều host mới xem S3-compatible storage; financial bytes mã hóa theo boundary |
| Auth | Server-side opaque session, HttpOnly cookie; scrypt từ Node crypto là ứng viên | CSRF/Origin guard, session revoke/expiry, password policy/rate-limit có tests. M1/M2 chỉ mock; SaaS chống Ops cần trusted identity/device/recovery riêng, không ordinary gateway tự ký token mở finance |
| Tenant authorization | Workspace-scoped services + ownership checks + DB defense-in-depth | Mọi object/query/job/tool có quyền; PostgreSQL RLS có thể bổ sung nhưng không chống DBA đọc plaintext |
| API docs | OpenAPI + contract examples/tests | Logical DTO khác encrypted transport envelope; schema version, money/time/null, pagination, conflict/idempotency rõ |
| Logs/health | Pino JSON + allowlist/redaction + readiness checks | Operation IDs/status/timing; không tiền, nội dung, holdings, prompt, provider key hoặc report; financial audit mã hóa riêng |
| Backup | pg_dump/pg_restore + encrypted private file snapshot + key/recovery plan | Backup ngoài máy chạy nếu có thiết bị sẵn; restore drill, version/hash consistency. Backup DB không đủ khi thiếu file/khóa |
| Reverse proxy | Caddy hoặc reverse proxy đã có | Một origin web/API, HTTPS khi ra ngoài loopback; TLS không thay end-to-protected-workload encryption |
| Packaging | Native local trước; Linux + Docker Engine/Compose khi cần đóng gói | Có health/persistent volumes; không buộc Docker Desktop cho G1. Điều kiện license Desktop phải kiểm riêng nếu dùng |
| AI real | Ollama + model open-weight phù hợp, **cần spike** | Không thuê token nếu chạy local; model terms/hardware/quality/egress cần thử. Không lựa model chỉ theo dung lượng file |

Chưa chọn Redis, Kubernetes, Kafka, Elasticsearch, vector database, paid auth/monitoring hoặc AI framework lớn. Với nhu cầu hiện hành chưa có bằng chứng phải thêm chúng.

## 4. Stack thiết kế và tài liệu phải có trước triển khai diện rộng

Đây là gói cần xây ở bước 3, **chưa được tạo chỉ nhờ file tech stack**. Agent dùng bộ reference đã có, không buộc user tìm thêm mẫu.

| Artefact | Nội dung bắt buộc | Gắn với code / kiểm chứng |
| --- | --- | --- |
| Design Principles & Process | Thứ bậc tiền/tài sản/nguồn; dễ đọc; vòng render/review/sửa; rubric và decision log | Review đủ 5 navigation, không cần user chọn từng màn mới làm |
| Style Guide | Semantic colors, type scale tiếng Việt, icons, logo, illustrations, mascot, asset rights | Không trộn line/flat/3D cho cùng vai trò; không chỉ màu để báo lỗi |
| Design Tokens | Primitive → semantic → component; typography, spacing, radius, border/shadow, breakpoint, z-index, motion | CSS variables/Tailwind theme map; chart cũng lấy token, không theme riêng |
| Component Specifications | Anatomy/props/events/variants/states/usage/a11y/responsive | Components thật ở `/design`; unit/component tests; không chỉ hình button |
| Pattern Library | Templates/layouts; filter/drill-down, forms, import/review, plan/goal/simulation, chat/context | Code snippets từ code chạy được; pattern references và trạng thái có ví dụ |
| UX/UI Specification | Màn hình, luồng, fields/actions/errors, mobile, keyboard, labels/unknown | REQ/AC → screen/action/state → test/evidence |
| Frontend Technical Specification | Routes, folders, data/cache/transport, validation, chart adapters, build/test | Contract và code thống nhất, một nguồn số; chưa là HLD hoàn chỉnh cho G3 |

Baseline visual cần kiểm bằng render: màu primary phục vụ hành động, income/expense/status semantic có text; type scale đọc được với số dài và dấu tiếng Việt; tabular numerals/căn phải cột tiền; icon line thống nhất; illustrations dành cho welcome/empty/AI, không lấn át report. Components nghiệp vụ tối thiểu: `MoneyValue`, `PeriodScope`, `DataFreshness`, `SourceEvidence`, `TransactionRow`, `HoldingCard`, `GoalProgress`, `ReviewCase`, `AIResultCard`.

Ảnh AI/Thần Tài hiện có là concept board. Chưa có bằng chứng sprite/Lottie/video-ready: không hứa animation đầy đủ trước asset preparation. G1 có thể dùng asset tĩnh phù hợp và microinteraction; không biến concept screenshot thành trang chat giả.

## 5. Kết nối, tổ chức code và luồng dữ liệu

### 5.1. Profiles triển khai

| Profile | Kết nối | Nguồn sự thật | Trạng thái |
| --- | --- | --- | --- |
| G1 mock | Browser → React/service → fetch `/api/v1` → MSW → mock repository | Synthetic demo store; report snapshots mô phỏng có version | Đề xuất, chưa dựng |
| G2 synthetic integration | Browser → service/transport → API → domain/worker → PostgreSQL/private files | Backend thật, dữ liệu vẫn synthetic | Chỉ xây khi bước 7–9 được giao |
| G2/G3 real-data target | Trusted client → encrypted ingress qua gateway → attested protected workload → ciphertext storage; encrypted result về client | Domain/Engine trong vùng bảo vệ; identities/key policy độc lập Ops | Cần security PoC; chưa provider/hardware/cost |

`Vite` chỉ là development server; build static có thể serve cùng API/reverse proxy. Đề xuất dev loopback `5173` cho web, `3000` cho API, PG `5432`, Ollama `11434` nếu dùng. Các cổng là quy ước cấu hình dự kiến, không chứng minh service đang chạy. Bind localhost mặc định; không tự `0.0.0.0`, port-forward hoặc public tunnel. Container `localhost` là container đó, không là host.

Route đề xuất: `/home`, `/home/reports`, `/home/assets`, asset/account detail; `/transactions`; `/plan` và tabs; `/data/sources`, `/data/review`; `/assistant`, history; `/settings` qua hồ sơ. `/design` và demo controls là công cụ dev/demo, không navigation chính thứ sáu. Không đặt financial payload hoặc keys vào URL.

### 5.2. Cấu trúc repository đề xuất

- Giữ tài liệu nguồn, `docs/` và `References/` hiện có ở root; không scaffold đè.
- Frontend đặt `finweave-web/`: `src/app`, `features`, `components/ui`, `components/finance`, `design`, `services`, `lib`, `mocks`, `assets`, tests. Trong G1 dùng package/lockfile tại đây; không tạo monorepo chỉ vì dự định có backend.
- Nếu tự xây backend ở G2: thêm `finweave-server/` và shared contracts/domain packages khi cần. Có thể chuyển sang npm workspaces với migration/lockfile plan; không giữ hai nguồn contract khác nhau.
- Code repo tham khảo, nếu được tải, đặt `reference-code/` riêng; không nhầm với ảnh `References/`, không tự chép vào sản phẩm.
- Private runtime data/keys ngoài source tree và ngoài public root; Git ignore không thay kiểm soát quyền/crypto.

### 5.3. Dữ liệu và snapshot

1. UI gọi feature services; services validate logical DTO rồi đi qua transport/mock mode đã cấu hình.
2. Mutation mang expected version/idempotency key theo contract; submit đang xử lý bị chặn, retry dùng cùng command identity khi phù hợp.
3. Mock hoặc real backend thực hiện nghiệp vụ và trả version/result; Query invalidate các report/detail liên quan.
4. Card/chart/table/detail cùng snapshot và period/scope/as-of. Đổi context phải abort hoặc bỏ qua response cũ; không thay report mới bằng kết quả chat cũ.
5. Financial Engine quyết định số; frontend chỉ format, chọn visual và drill-down. Form draft/planned/simulated không ghi actual ledger.

M1 có thể mô phỏng phép tính bằng deterministic demo logic cho fixture, nhưng ghi rõ không phải ledger/security backend thật. M2 mock và G2 Engine cần test oracle độc lập; chia sẻ helper không được khiến expected và actual cùng một lỗi.

## 6. Tái sử dụng backend: khảo sát trước khi quyết định

Mục tiêu tiết kiệm backend vẫn giữ. Không bỏ Sure vì frontend dùng TypeScript, và không đổi frontend sang Ruby chỉ vì tham khảo Sure. API adapter có thể kết nối backend khác ngôn ngữ.

| Phương án | Giá trị tham khảo / tái sử dụng | Điều kiện quyết định |
| --- | --- | --- |
| [Sure](https://github.com/we-promise/sure) | Ưu tiên spike đầu: accounts, imports, transactions, holdings, balances/reconciliation; Rails/PostgreSQL | Pin commit, chạy synthetic flows, audit endpoint coverage/rules/upgrade effort/privacy. Không suy từ tên module rằng semantics giống FinWeave |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | Đối chiếu ledger, transfer, rules/API quản lý tiền | Holdings/gold/Plan/AI là fit-gap cần tính; không ghép thành ledger thứ hai mặc định |
| [Ghostfolio](https://github.com/ghostfolio/ghostfolio) | Đối chiếu portfolio/activity/performance và frontend tài sản | Không coi investment backend là cashflow backend toàn diện; tránh thêm cả NestJS/Prisma/Redis chỉ để lấy một module |
| Backend Fastify tự xây ở mục 3.2 | Khớp domain/contracts và một ngôn ngữ ở phương án tự xây | Tốn công ledger/auth/import; chỉ chọn sau so effort/risk với reuse, không gọi là tiết kiệm hơn khi chưa đo |

**Gate reuse trước bước 7:** lập fit-gap theo REQ/BR, kiểm các flow oracle, lỗi/retry/version, mapping API, privacy/decryption path, license/notices, effort thay đổi và vận hành. Kết luận một trong: dùng API có sẵn; fork có chủ đích; học patterns và tự xây. Nếu chưa có report, backend vẫn **chưa chốt**; frontend G1 không phải đợi.

Sure/Firefly III/Ghostfolio hiện dùng AGPL; chép/fork/distribute/network deployment phải đánh giá đúng giấy phép và phiên bản cụ thể. [Sure LICENSE](https://github.com/we-promise/sure/blob/main/LICENSE) là một nguồn kiểm. Học ý tưởng và sao chép code là hai hoạt động khác nhau; không kết luận tự động toàn frontend tách biệt phải AGPL, cũng không hứa dùng API sẽ miễn mọi nghĩa vụ. Cần kiểm license của code/assets/dependencies thật được đưa vào trước phát hành.

**Không vận hành đồng thời ba backend tài chính** trong baseline. Nếu chọn Sure, sửa tài liệu/ADR để dùng runtime/database/queue của Sure đã kiểm chứng, thay nhánh Fastify liên quan; không giữ cả hai chỉ để bảng stack đủ tên.

## 7. Năm navigation được thực hiện bằng gì

| Navigation / REQ-AC hiện hành | Thành phần triển khai | Bằng chứng cần có |
| --- | --- | --- |
| Home — TRACK/REPORT/INSIGHT; AC13/14/20/21 | PeriodScope, Query report snapshot, ECharts, tài khoản/holdings detail, freshness/evidence | Oracle khớp, drill-down giữ context; kỳ thiếu không giả0; tiền/tài sản và tác động giá khác giao dịch |
| Giao dịch — MONEY/TXN; AC08/11/12 | RHF/Zod, Table, dialogs/detail, services và mutation state | Thêm/sửa/category/transfer/refund/fee; history/preview; retry không tăng số lần; pending không vào posted |
| Plan — PLAN/GOAL/SIM; AC22–26 | Planned-item forms, actual links, allocation/progress, forecast và scenario views | Actual/planned/simulated tách; allocation không thêm tiền; shortfall đúng; simulation không actual write |
| Dữ liệu — INPUT/REVIEW; AC06/07/09/15/16 | Source cards, import wizard/mapping, review cases/evidence/impact | Preview cancel không mutation, confirm đúng subset, import lặp không trùng; source/quantity/price/FX issues riêng |
| Trợ lý AI — AI; AC27/28 | Chat/history, result cards, context capture, global mascot panel, assistant adapter | Cùng conversation; source/result refs; tool/error/no-data/stale context đúng; scripted label, không model thật G1 |
| Dùng chung — SET/BANK/CASH/STOCK/GOLD/UX/DEMO/NAV; AC01–05/10/17–19 | Workspace/settings, 4 nhóm, source/time/unit labels, privacy mask, responsive shell/reset | Đúng 5 đích; form/detail hoạt động; keyboard và 3 viewports; reset nhất quán; không financial data lọt qua narrative khi mask |

Bảng này là phân bổ kỹ thuật, **không thay RTM hoặc toàn bộ AC**. Giữ 28 AC hiện hành; các kỹ thuật bổ sung ở đây không tự thêm Budget advanced, Alerts, nợ/thẻ, BĐS, vốn kinh doanh hoặc export vào scope G1.

Quy tắc dữ liệu: tiền và decimal strings có currency/unit; VND nguyên theo rules hiện hành; quantities/quotes/FX có precision và rounding policy; date-only giữ precision; unknown là null/status kèm lý do, không0. Giá mới không chứng minh lượng mới. Giá quốc tế quy đổi không thành giá bán lẻ Việt Nam. Không gọi cơ cấu bốn nhóm là tài sản ròng đầy đủ.

## 8. Nguồn dữ liệu và AI với mục tiêu không thuê dịch vụ

### 8.1. Thu thập

| Nhóm | G1 | G2 ứng viên | Điều kiện trước nguồn thật |
| --- | --- | --- | --- |
| Ngân hàng/ví | CSV fixture và notification-source simulation | CSV có profile hỗ trợ; nguồn thông báo Android trong nhánh collector riêng | Quyền/adapter/parser fixtures và dedupe; web không tự đọc SMS/notification điện thoại; collector không thuộc code G1 |
| Tiền mặt | Form/count synthetic | Nhập/kiểm đếm và điều chỉnh có căn cứ qua backend | Tự khai báo, không chứng nhận tài sản; lệch không tự thành chi sinh hoạt |
| Cổ phiếu | Holdings/quotes synthetic | User key read-only cho provider hỗ trợ, SSI là ứng viên từ Ideas | Xác nhận entitlement/use/redistribution/units/timestamps; provider và FinWeave support thực tế; không key dùng chung và không quyền đặt lệnh |
| Vàng | Quote/FX giả có nhãn | Quốc tế/FX hoặc nguồn VN đã kiểm; nhập giá tham chiếu thủ công là nhánh riêng cần scope | Không hard-code FX hoặc scrape tùy ý; price type/purity/unit/source/date rõ; không gọi realtime khi chưa chứng minh |

Không có nguồn API miễn phí hợp lệ không chặn G1. G2 có thể dùng nhập có cấu trúc cho các nhánh đã chọn nhưng phải báo nguồn nào manual/automatic; đổi cách thu thập hoặc giảm yêu cầu cần decision, không âm thầm thay tích hợp thật bằng mock.

### 8.2. AI

- **G1:** scripted assistant; whitelist tool-result mô phỏng gắn Engine snapshot. Không Ollama, API key hoặc RAG/vector DB bắt buộc.
- **G2 ứng viên:** Ollama local qua assistant provider adapter. Thử model nhỏ phù hợp tiếng Việt/function calling trên máy hiện có, rồi mới pin model ID/digest/context/quantization/license. Tài liệu này chưa chọn model thắng và chưa cam kết latency. [Ollama FAQ](https://docs.ollama.com/faq) là nguồn kiểm cấu hình/local-only trước tích hợp.
- **Gemini Free Tier:** chỉ là lựa chọn thử riêng bằng dữ liệu synthetic nếu được giao; không runtime bắt buộc của frontend. Không mang model ID cũ chưa xác minh trong Ideas thành dependency chốt. [Điều khoản dịch vụ miễn phí](https://ai.google.dev/gemini-api/terms) cần đối chiếu trước gọi; không gửi dữ liệu tài chính thật chỉ vì đã xóa tên hoặc cộng tổng.
- AI gọi tools đã kiểm quyền để lấy số, diễn giải và đề xuất bản nháp; không SQL trực tiếp, tự cộng ledger, tự đặt lệnh hoặc ghi tài chính. Tool inputs/outputs validate, context/version gắn từng message, limits/cancellation rõ.
- RAG chưa cần cho số liệu có cấu trúc. Chỉ xem xét khi thêm corpus tài liệu hợp lệ và có bài toán retrieval đo được; không thêm pgvector vì dùng chữ “Agent”.
- AI local giảm việc gửi cho provider nhưng **không chống operator toàn quyền máy inference**. Với dữ liệu thật, inference/tool results vẫn phải nằm trong trust boundary đã nghiệm thu; máy Ollama thường không tự thỏa mục 15 Ideas.

Nếu hardware/model không đủ, AI thật là blocker được báo; không tự đổi sang API trả phí hoặc báo mọi module đã dùng thật. Máy, RAM/GPU, disk và thời gian eval chưa được đo trong nhiệm vụ tài liệu này.

## 9. Bảo mật: điều kiện stack thường chưa giải quyết

Yêu cầu FinWeave không chỉ “ẩn admin UI”: Admin/Support/DBA/Ops không đọc finance, lấy key, giả user hoặc tự sửa policy/client để lấy quyền. Phạm vi nhạy cảm gồm money, descriptions, holdings, provider secrets, Plan/Goals, review, files, reports, conversations và tool results.

| Lớp | Baseline thiết kế / gate cần có | Không được tuyên bố |
| --- | --- | --- |
| Data at rest | AEAD/envelope encryption, DEK/workspace, KEK độc lập, rotation/backup | pgcrypto/disk encryption làm operator toàn quyền không đọc được |
| Ingress/egress | Client xác minh vùng bảo vệ; sensitive payload/result mã hóa tới đúng endpoint/thiết bị | HTTPS terminate ở ordinary gateway đạt zero-plaintext gateway |
| Runtime | Confidential computing/attestation; approved workload mới nhận key | Container/non-root/private network tự là protected compute |
| Identity/device/recovery | Trusted proof/registry; policy approval độc lập; owner-controlled recovery | Cookie/JWT của service do Ops toàn quyền quản lý ngăn impersonation |
| SQL/jobs/files | Opaque IDs, minimal allowlisted metadata, ciphertext; decrypt/compute/search trong vùng bảo vệ | Query SUM(amount)/merchant index plaintext ở DB vẫn không lộ finance |
| Client/update supply chain | Phê duyệt/bảo vệ client code, không cùng operator tự sửa web để lấy dữ liệu/khóa | Server confidential nhưng web do Ops thay tùy ý đã an toàn đầy đủ |
| Logs/backup/audit | Redaction tests, encrypted finance audit, ciphertext backups, restore+keys+anti-replay | Có pg_dump là đã phục hồi hoặc đạt chống Ops |

[PostgreSQL pgcrypto lưu ý phải tin system/database administrators](https://www.postgresql.org/docs/current/pgcrypto.html); vì vậy không chọn pgcrypto làm bằng chứng đạt yêu cầu này. [AWS Nitro Enclaves security](https://docs.aws.amazon.com/enclaves/latest/user/security.html) chỉ là một nguồn khảo sát attested runtime, **không phải provider đã chọn, free tier hoặc giải pháp end-to-end đã hoàn tất**.

Các bất biến ledger cần compute/validation trong vùng tin cậy; database chỉ cưỡng chế phần quan hệ/version/atomicity trên cấu trúc được phép. Không để lượng/số tiền plaintext cho constraint rồi vẫn gọi ciphertext-only. Performance/caching/search và leakage metadata phải được thiết kế lại khi chốt encrypted representation; không chỉ thêm cột encrypted sau cùng.

**Blocker kiến trúc đã biết:** chưa có cấu hình 0đ được chứng minh thỏa toàn bộ trust model tập trung chống Ops. G1/G2 synthetic vẫn làm được. Trước dữ liệu thật: PoC key release/attestation, encrypted transport, caller/client/recovery, operator attack và restore/replay; nếu không đạt thì giữ synthetic hoặc xin quyết định thay trust model có ghi rõ, không hạ yêu cầu âm thầm.

## 10. Kiểm chứng, hiệu năng và vận hành

Các gate dưới là kế hoạch, **chưa có PASS ứng dụng**. Không lấy thông số máy mẫu hay benchmark framework để hứa số user.

| Gate | Cách kiểm | Điều kiện đạt / giới hạn |
| --- | --- | --- |
| G0 — Setup tái lập | Install từ lock trên môi trường ghi rõ; typecheck/lint/build; mở app/reset | Scripts thực tồn tại/chạy; versions/config/license inventory rõ |
| G1 — Visual/components | `/design` và đủ 5 navigation; đối chiếu reference/tokens/patterns | Hierarchy/type/icon/colors nhất quán; không screenshot giả thay UI; review thẩm mỹ Agent khác PO duyệt |
| G2 — M1 tasks | Toàn 28 AC, 4 nhóm, Plan/Goals/AI và edge scenarios | Oracle khớp, actions hoạt động, không lỗi hiểu sai finance; research chưa làm ghi walkthrough |
| G3 — M2 contract/mock | Validation, 401/403/409/429/500, timeout/offline/retry, old response, duplicate submit | Request qua layer đúng, snapshot/reset đúng, mock-only label; không tuyên bố authorization server thật |
| G4 — Responsive/a11y | 1440×900, 390×844, rộng360; keyboard, focus, dialog, chart table, privacy mask | Không tràn/chồng làm mất action, không chỉ màu, nội dung tiếng Việt đọc được; auto axe và review tay |
| G5 — Frontend speed | Theo NFR/fixture hiện hành: 10 lượt warm-up rồi đo filter/render/preview; ghi máy/browser/dataset | Target local ≤1s của hồ sơ là giả định chưa đo; không áp sang API/nguồn/AI. Chart payload/lazy route/bundle cần report |
| G6 — Real backend synthetic | Migrations, reload, concurrent command, retry-after-commit, worker kill, import replay | Backend thật giữ invariant, không duplicate, không mất job; independent expected, restart/recovery đúng |
| G7 — Privacy/real data | Operator/DBA/root, modified workload/client, fake token/device/recovery, log/cache/backup inspection | Toàn gate Ideas15; chưa đạt thì không bật dữ liệu thật, dù G6 đạt |
| G8 — Providers/AI | Data source entitlement/field/unit/freshness/error; model actual eval tiếng Việt và tools | Chỉ claim nguồn/model đã thử; AI quality/latency riêng, không thay bằng chat screenshot |
| G9 — Restore/deploy/capacity | Restore DB+files+key policy vào môi trường khác; smoke; workload/fault measurements | Đo RPO/RTO, resource limits và capacity trước SLA; một máy không HA |

Oracle hồi quy từ scope: tiền cuối kỳ **31.100.000 VND**; thu10.000.000; chi gộp1.100.000; refund200.000; chi thuần900.000; dòng tiền+9.100.000; assets76.100.000 →77.600.000 khi chỉ đổi giá. Mô phỏng Plan/Goals dùng expected riêng trong AC22–26, không cộng vào oracle thực tế. Giá trị trên là fixture, không benchmark hoặc dữ liệu user.

Vận hành G2/G3 cần: ready/health khác liveness, startup/migration owner duy nhất, config fail khi secret placeholder, retry/backoff/rate-limit theo provider, disk-low behavior, logs rotation, backup độc lập, restore test trước dùng thật. Raw upload/parser là untrusted; giới hạn bytes/rows/time/process, không shell interpolation hay public file execution. Không cần PDF/OCR trong G1; thêm khi scope và samples có kiểm chứng.

Scripts cần được triển khai khi viết code: `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, `test:e2e`; doctor/config/schema/test bổ sung theo backend. Đây là **yêu cầu script tương lai**, hiện chưa có package để chạy. Local checks đủ G1; CI cloud tùy chọn, không tự bật paid usage.

## 11. Ngân sách, license và nâng cấp có điều kiện

### 11.1. Chi phí

| Khoản | G1 / mục tiêu G2 | Có thể phát sinh |
| --- | --- | --- |
| Frontend libraries/build/tests | Công cụ open-source chạy local; không service fee bắt buộc | Asset/font/package cụ thể vẫn kiểm license; không mua template/UI kit mặc định |
| Backend/PostgreSQL/worker | Tự host trên máy sẵn có nếu chọn nhánh này | Điện, CPU/RAM/disk, maintenance/backup; repo reuse có obligation riêng |
| AI scripted | Không phí API/hardware model | Không được gọi là inference thật |
| AI local | Không phí thuê token khi máy sẵn đáp ứng | RAM/GPU/disk/electricity/model license/eval; không bảo đảm đủ hardware |
| Provider stock/gold/FX | Chỉ chọn nguồn có quyền và chi phí đã xác nhận | Free quota thay đổi, entitlement/delayed data/commercial display; không hứa realtime miễn phí |
| Storage/backup | Thiết bị sẵn có | Chưa có bản backup độc lập thì phải bổ sung hoặc báo gate chưa đạt |
| Docker | G1 không cần; Linux Engine/Compose là ứng viên G2 | Docker Desktop có điều kiện license riêng; chưa xác minh eligibility máy này |
| Git/CI | Git local; CI tùy chọn | Quota/cloud runner/artifact retention; local test không bắt buộc subscription |
| Hosting/domain/monitoring SaaS | Không cần để demo loopback | Public hosting/traffic/domain/uptime/managed services khi G3 được cấp ngân sách |
| Confidential compute/key trust | Chưa xác minh cấu hình/chi phí | Có thể là khoản bắt buộc lớn; không gộp vào lời hứa G2 0đ |
| Công cụ coding Agent | Tận dụng quyền dùng hiện có | Subscription/quota phát triển riêng, không phải runtime FinWeave |

Không dùng cloud free tier làm cơ sở duy nhất cho dữ liệu thật/bảo mật/backup. Runtime cá nhân không cần giữ subscription coding Agent sau build, nhưng bảo trì vẫn có công sức và chi phí.

### 11.2. Trigger nâng cấp

| Trigger | Tối ưu trước | Lựa chọn sau khi đo | Gate phải giữ |
| --- | --- | --- | --- |
| Table/chart nhiều dữ liệu chậm | Pagination, downsampling chart có nhãn, lazy imports, query profiling | Virtualization hoặc aggregation backend | Số chính xác/coverage/drill-down; a11y không mất |
| Module/state quá phức tạp | Feature boundaries, reducers, Query cache và URL rõ | Zustand khi UI shared state thật cần | Không duplicate server state; version/context tests |
| Queue/DB bottleneck | Index metadata cho phép, pools, jobs scheduling, bounded concurrency | PgBouncer, host riêng hoặc broker khi có evidence | Outbox/idempotency/fence và crypto boundary giữ đúng |
| Files/multiple workers vượt filesystem | Measure growth và retention | Object storage S3-compatible đã review | Ciphertext/auth/hash/backup, license/cost rõ |
| AI chậm hoặc kém chất lượng | Context/tool limit, model/quantization eval, cache an toàn exact version | Máy inference riêng hoặc model khác | Private trust boundary + quality/latency, không auto cloud fallback |
| Notification intake cần dùng thật | CSV/manual trên web trước | Android Kotlin collector, permissions/offline outbox có scope riêng | Consent, parser/version/dedupe, platform policy; không giả iOS tương đương |
| Multi-user/public access | Threat/abuse model, quota, trusted client/key design, capacity | Cloud/VPS/confidential platform được duyệt | Gate privacy, restore, load/fault; chưa SLA từ việc mua VPS |
| Operations khó quan sát | Safe structured logs/IDs/health trước | OpenTelemetry/Prometheus khi cần | No sensitive telemetry, bounded retention/cardinality |
| Cần HA/cluster | Restore drills, máy thay thế, đo downtime | Replication/multiple hosts; Kubernetes chỉ khi năng lực vận hành đủ | Ngân sách/failover/key boundary; không thuộc G1 |

Mỗi thay đổi có ADR: vấn đề/đo đạc → alternatives → lựa chọn → scope/license/cost/privacy impact → tests → rollback → người duyệt. Không cài toàn bộ cột tương lai.

## 12. Thứ tự thực hiện và bàn giao

1. **Chuẩn bị kỹ thuật:** đọc baseline/reference, kiểm runtime, xác nhận frontend choices qua ADR; bộ thiết kế v0.1 và contract boundaries; chưa cài backend.
2. **Xây G1 liên tục bước 3–6:** một codebase, `/design`, đủ 5 navigation; logical contracts, stateful MSW, form/error/mutation/visual tests. Có thể tổ chức thành lát công việc nhỏ nhưng không dừng bàn giao ở ba màn. Đánh giá M1/M2 riêng.
3. **Gate backend:** Sure spike ưu tiên, Firefly/Ghostfolio tham khảo khi có fit-gap cụ thể; so phương án tự xây; chọn một nguồn sự thật. Chưa giao bước7 thì ghi backlog, không tự clone/run toàn stack.
4. **Privacy/provider/AI feasibility trước dữ liệu thật:** spike synthetic/public samples; xác nhận hardware, licenses/entitlements, protected runtime/client/key design, quality và chi phí. Công việc này không cần nhiều Agent và không phải quyền triển khai cloud tự động.
5. **G2 khi được giao:** backend/DB/files/auth/jobs thật, synthetic E2E trước; chuyển từng capability sang real adapter sau gate. Không đổi label để biến simulation thành tích hợp thật. Dữ liệu cá nhân thật chỉ theo trust model đã duyệt.
6. **G3 khi được giao:** platform/budget/security approval, public deployment, isolation/abuse/operations/restore/capacity; phần real AI/provider chưa đạt không được quảng bá đã có.

G1 bàn giao code/README/lockfile/config, design docs và `/design`, contracts/mock scenarios, coverage/RTM, actual tests/screenshots, defects và integration notes. G2/G3 bổ sung runtime/deployment manifest, migrations, source/license register, threat/key/client design, provider/model reports, backup/restore/runbooks và release acceptance.

**Không dùng file tech stack thay Design System, HLD/LLD, OpenAPI, Security Design hoặc báo cáo test.** Tài liệu này định hướng lựa chọn; các artefact kia phải có nội dung triển khai và bằng chứng riêng.

## 13. Nguồn và cách áp dụng trong phiên Agent tiếp theo

Các liên kết công nghệ ở từng dòng đã đối chiếu bằng tài liệu/repository chính thức ngày 05/10/2026; khả năng của thư viện không là kết quả benchmark FinWeave. Các sources bổ sung cần đọc trước phần triển khai tương ứng:

- [Docker Engine](https://docs.docker.com/engine/) và [Docker Desktop license](https://docs.docker.com/subscription/desktop-license/): kiểm điều kiện trước chọn packaging.
- [PostgreSQL backup](https://www.postgresql.org/docs/current/backup.html): restore procedure/consistency cần thiết kế và thử thực.
- [Caddy automatic HTTPS](https://caddyserver.com/docs/automatic-https): trust/cert và network profile; không public hóa loopback tự động.
- [Gold API docs](https://gold-api.com/docs), [SSI overview](https://developers.ssi.com.vn/docs/faq/service-overview): là ứng viên từ Ideas, cần verify quyền và kết nối tại thời điểm tích hợp; nhiệm vụ này chưa gọi API hay xác minh account.

Trong chat mới, thêm `FinWeave_Tech_Stack.md` vào danh sách đọc của prompt liên tục bước3–6. Agent dùng frontend baseline ở mục3.1, chốt patch/config bằng doctor/ADR/lockfile; không lựa stack lại vô cớ. Có thể thay ứng viên khi có compatibility/requirement evidence và decision record; phải báo tác động. Các phần backend/privacy/provider/AI thật là kế hoạch có gate, không lệnh bắt đầu bước7–9.

**Trạng thái kết thúc:** đã có đề xuất tech stack A–Z và lộ trình riêng cho FinWeave. Chưa code, cài package, chạy app, chọn backend reuse cuối cùng, verify provider/model/hardware hoặc đạt M1/M2/M3. Chủ dự án review phương án trước khi coi là approved baseline.
