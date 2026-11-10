# ARCH-02 — Cấu trúc backend và lựa chọn stack

08/10/2026 · **ACCEPTED: S1 + P2** theo lựa chọn trực tiếp của owner. Kế thừa [ARCH-01 A + T1 / ADR-008](adr/ADR-008-modular-backend-trusted-server.md). Research từ source/docs hiện có và tài liệu chính thức; chưa benchmark, cài dependencies, xây backend hoặc chạy PostgreSQL. Các đánh giá phù hợp/độ phức tạp là suy luận cho FinWeave, không số đo hiệu năng.

## 1. Quyết định đã chọn

**S1 + P2 ĐÃ CHỌN:** Fastify + TypeScript, modules nghiệp vụ với public interfaces rõ, Financial Engine độc lập framework, PostgreSQL qua repositories/SQL, user API và Ops API tách process; worker entrypoint chạy theo profile/quyền. Cùng codebase/domain/DB, không tách thành microservices.

S1 có mức chuyển đổi thấp nhất từ source hiện có; P2 giúp tránh Ops process nắm finance credentials và dễ kiểm quyền. P2 là cách đóng gói/process, không yêu cầu mua từng server riêng. RAM/connection pools và giới hạn platform phải đo ở ARCH-03; không bảo đảm free hosting đáp ứng cấu hình này.

[ADR-009](adr/ADR-009-fastify-and-isolated-processes.md) ghi quyết định chính thức. [Stack](tech-stack.md), [module HLD](module-high-level-design.md) và [HLD](high-level-design.md) là working design hiện hành. S2/S3/P1 giữ làm alternatives nghiên cứu, không còn câu hỏi chưa chọn. Giữ đủ BE-01…21 và toàn bộ chức năng.

## 2. Kết quả rà source và artifact

| Bằng chứng local | Ý nghĩa cho ARCH-02 |
| --- | --- |
| [Frontend package](../../finweave-web/package.json): TypeScript, decimal.js, Vitest; Node engines thuộc major24 | Có nền TS để reuse có kiểm chứng; chưa có backend Fastify runtime trong package này |
| [Planning](../../finweave-web/src/domain/planning.ts), [forecast](../../finweave-web/src/domain/forecast.ts), [commands](../../finweave-web/src/domain/commands.ts) | Có arithmetic/business behavior để kế thừa, nhưng code mock gắn Store và assumptions; forecast có Number conversions. Không copy toàn bộ thành authoritative backend hoặc coi mọi phép tính đã đúng production |
| [Canonical OpenAPI](../contracts/v2/openapi.json): v2.0.0, OpenAPI3.1.1, JSON Schema2020-12,133 operations | Contract-first; cần runtime validator/serializer phù hợp dialect, adapters cho mock1.1/prototype2.0 |
| [Physical schema](../data/physical/README.md):54 bảng, SQL migrations001–003 | Đã có SQL/guards cần reuse/review; không để ORM tự sync và sinh schema khác. SQL/domain/RLS chưa thực thi |
| [Backlog](../product/backend-backlog.md):21 REQUIRED packages | Chọn framework không thay phạm vi; 21 gói công việc không đồng nghĩa21 service hoặc21 deploy |

Canonical OpenAPI và physical profile vẫn ghi synthetic/blocked theo baseline cũ. ADR-008 đã đổi trust ở tài liệu working, nhưng artifact bytes không được đổi ngầm trong nghiên cứu này. Metadata/transport/auth alignment cho T1 là việc cần xử lý có revision ở ARCH-05/06; không tự bật real endpoint.

## 3. Lựa chọn framework/cấu trúc

| Mã | Cấu trúc | Điểm phù hợp | Chi phí kỹ thuật/đánh đổi | Đánh giá cho FinWeave |
| --- | --- | --- | --- | --- |
| **S1 — Fastify + TypeScript modules** | Fastify làm HTTP/auth hooks/validation; modules có application services, domain, repositories và public API; dependencies được truyền rõ tại bootstrap | Reuse TS/decimal/test fixtures; ít framework abstraction; dễ theo dõi một command đến SQL transaction | Phải tự chuẩn hóa composition, module imports, transaction wrapper, error mapping, observability và enforce bằng checks | **ĐÃ CHỌN**; đủ cho toàn bộ feature nếu làm ranh giới nghiêm túc |
| **S2 — NestJS + Fastify adapter** | Controllers/providers/modules/guards theo Nest, HTTP qua Fastify; domain/Engine vẫn thuần TS | Có conventions và dependency injection rõ, thuận lợi nếu codebase nhiều modules/entrypoints | Thêm framework/decorators/configuration; phải kiểm compatibility Fastify plugins; tránh hai nguồn DTO giữa decorators và canonical OpenAPI | Alternative tốt nếu ưu tiên quy ước framework; không tự làm transaction hoặc privacy đúng hơn |
| **S3 — Spring Boot + Java + Spring Modulith** | Modular backend JVM, public/internal packages, JDBC/repositories, transaction services; Engine Java/BigDecimal | Có module verification và transaction support; phù hợp nếu quyết định theo hệ Java | Phải port Engine TS và chạy parity/oracle tests; thêm toolchain/runtime; không còn reuse implementation TS trực tiếp | Chưa có nhu cầu Java đủ mạnh để biện minh đổi stack; vẫn khả thi và giữ nguyên contract |

Fastify encapsulation giới hạn phạm vi hooks/decorators/plugins; không là sandbox bảo mật hay tự cấm TypeScript import chéo. Nest module imports/exports kiểm visibility của providers; vẫn cần enforce source dependencies và quyền dữ liệu. Spring Modulith có thể kiểm cycles và truy cập internal packages. [Fastify encapsulation](https://fastify.dev/docs/latest/Reference/Encapsulation/), [Nest modules](https://docs.nestjs.com/modules), [Spring Modulith verification](https://docs.spring.io/spring-modulith/reference/verification.html).

Nest hỗ trợ Fastify qua adapter; middleware/recipes phụ thuộc Express không mặc nhiên tương thích. Không dùng benchmark của framework để hứa tốc độ FinWeave. [Nest Fastify adapter](https://docs.nestjs.com/techniques/performance).

Các framework có bản mã nguồn mở: Fastify/Nest MIT, Spring Boot Apache2.0; không cần mua license framework để xây app theo các license đó. Hosting/DB/model/provider/support thương mại có chi phí riêng. [Fastify license](https://github.com/fastify/fastify/blob/main/LICENSE), [Nest license](https://github.com/nestjs/nest/blob/master/LICENSE), [Spring Boot license](https://github.com/spring-projects/spring-boot/blob/main/LICENSE.txt).

## 4. Lựa chọn API/worker process

| Mã | Cách chạy | Ưu điểm | Đánh đổi |
| --- | --- | --- | --- |
| **P1 — User/Ops API chung process, workers riêng** | HTTP process đăng ký hai route trees/auth contexts; pools và DTO riêng; worker profiles ngoài HTTP | Ít HTTP processes để quản lý, có thể giảm overhead; phù hợp local/synthetic | API process giữ cả user/ops credentials; lỗi cấu hình dễ lan giữa hai surfaces, restart chung; plugin isolation không là security boundary |
| **P2 — User API, Ops API và worker profiles riêng** | Hai HTTP composition roots; worker entrypoint theo role/profile; cùng domain package/database | Ops process không có finance pool/credentials; middleware/restarts/pools rõ; Agent worker có thể chỉ nắm quyền tools/drafts | Nhiều process/pools/config hơn; cần resource budget và kiểm platform có chạy được worker |

**P2 đã được owner chọn.** Logical separation đã chọn ở ARCH-01 không tự bắt buộc mỗi process một paid cloud service. Cùng máy/host vẫn có thể chạy nhiều process; cả P1/P2 đều là A + T1. Process separation không bảo vệ khỏi root operator đã được tin theo T1.

Worker là job consumer bền vững, không phải Node worker_thread. Entry `worker` nhận profile như ingestion/import, market, Agent, retention. Profile quyết định modules, job allowlist, DB credentials và concurrency; không claim queue khác profile. Theo P2, để có DB-enforced separation, các profile khác quyền chạy ở process/container riêng, không chỉ đặt tên khác trong một process giữ mọi credentials. Cấu hình gộp worker cho synthetic phải ghi rõ giới hạn, không nhận là isolation thật.

Scheduler enqueue idempotently vào durable job mechanism, startup/catch-up xử lý overdue. Host sleep/tắt sẽ ảnh hưởng scheduler/worker; process design không giải quyết free-tier availability. Không chạy job dài sau HTTP response kiểu fire-and-forget, không lấy browser/setInterval làm durable scheduler duy nhất.

Gọi price/LLM API chủ yếu là I/O có concurrency/timeouts/budgets. CPU-heavy simulation cần đo event-loop lag rồi cân nhắc bounded worker-thread pool hoặc compute worker; không spawn thread mỗi request. Node docs phân biệt worker_threads cho CPU với async I/O. [Node worker_threads](https://nodejs.org/api/worker_threads.html).

## 5. Stack S1 đã chọn — nguồn hiện hành ở tech-stack.md

| Lớp | Hướng triển khai | Điều kiện cần kiểm |
| --- | --- | --- |
| Runtime | Node LTS được Fastify hỗ trợ; major24 là candidate khớp frontend engine hiện có; pin patch/dependencies khi implementation | Không dùng @types/node làm bằng chứng runtime version; kiểm compatibility/security/support lúc lock |
| HTTP | Fastify/TypeScript, explicit composition; route plugin cho mỗi module/surface, auth/error/response hooks theo scope | Không expose shared root decorator chứa mọi quyền; Fastify plugin không thay permission checks |
| Contract | Canonical OpenAPI v2 → generated types + runtime validators; DTO mapping riêng domain/storage | Một nguồn wire schema; TypeScript types không kiểm input lúc chạy; frontend Zod không tự thành server authority |
| Persistence | PostgreSQL + node-postgres (`pg`), parameterized SQL trong repositories, explicit UnitOfWork | Cùng checked-out client trong transaction, typed row mapping, numeric/date/JSON conversion có tests; không raw interpolation |
| Migrations | Giữ pipeline SQL reviewed/checksum của hồ sơ, runner/journal riêng | Không auto-sync ORM; migrations đã chạy không sửa checksum. ARCH-04 kiểm thực thi/constraints/roles/indexes |
| Engine | Pure TypeScript/decimal arithmetic, explicit clock/snapshot/assumptions, không HTTP/DB/provider dependency | Reuse thuật toán sau audit/oracle; money/quantity khác ratios/chart values. Backend là authority; preview client không đủ làm commit |
| Async | Jobs port + durable PostgreSQL-backed implementation | Chọn custom/library tại ARCH-09 sau rà schema/transaction support; chưa chọn pg-boss/Redis/BullMQ hoặc thêm job tables |
| Checks | Typecheck/import-boundary checks; unit/domain oracles; PostgreSQL integration/concurrency; contract/direct API/security tests | Giữ browser regression; frontend mock PASS không thay backend correctness |

Không cần thêm Redis/Kafka hoặc một AI service Python chỉ vì tên Agent. Nếu inference cần runtime riêng, đó là provider adapter được chốt ARCH-12; orchestration vẫn có thể TypeScript. Query builder/ORM có thể xét ở ARCH-04 nếu có lợi thực tế, không thay SQL authority hay transaction semantics ngầm.

Fastify có support policy theo major/Node LTS; pin versions sau compatibility check. [Fastify LTS](https://fastify.dev/docs/latest/Reference/LTS/).

### Điểm phải thử: JSON Schema2020-12

Canonical hiện dùng2020-12. Fastify docs minh họa Draft7; Ajv default export dùng draft7 và cần class riêng cho2020-12, không trộn hai dialect trong cùng instance. Vì thế không đưa toàn bộ OpenAPI document vào route schema rồi coi tương thích. [Fastify validation/serialization](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/), [Ajv dialects](https://ajv.js.org/json-schema.html).

Đề xuất compiler/registry2020-12 riêng cho các component/input/output canonical; resolve refs/annotations đúng, pin formats, không nhận schemas từ user. Response serializer phải cùng semantics hoặc serialize DTO đã allowlist+validate; không mặc định default serializer hỗ trợ mọi keyword. Kiểm decimal-string/null/required/unknown-fields/refs/union/error responses và redaction; không coercion âm thầm biến string thành number hay bỏ fields để PASS. Nest/Spring cũng phải giải quyết compatibility với canonical schema.

## 6. Module ownership — đối chiếu đủ54 bảng hiện có

Logical ownership đã chốt trong [module HLD](module-high-level-design.md), chưa đổi physical schema/grants. Bảng nghiên cứu bên dưới giữ để truy căn cứ; module HLD là nguồn hiện hành khi có revision tiếp. Một bảng có một logical owner; các consumer dùng public operations hoặc read projections được duyệt. Owned không có nghĩa mỗi module có DB/server riêng. Cross-module reads/joins được phép qua query layer đã authorize; cross-module writes phải gọi owner command trong cùng transaction khi cần atomic.

| Module / nhóm | Bảng owned đề xuất | Ranh giới nghiệp vụ / backlog |
| --- | --- | --- |
| Identity & Access | identities, workspaces, sessions, identity_challenges, devices | BE-01; register/auth/membership/enrollment/revoke; app-admin auth dùng identity primitives nhưng tách authority |
| Accounts | accounts | BE-03; tài khoản/opening configuration/archive/settings; actual effects qua Ledger |
| Ledger | ledger_accounts, events, entry_groups, posting_lines, cash_observations | BE-04; posting/balancing/transfer/refund/correction/count; không import Agent/Planning |
| Portfolio | holdings, holding_movements | BE-06; declarations/quantity/cost/history; investment actual workflow phối hợp Ledger |
| Market | instruments, gold_profiles, provider_entitlements, quote_observations, refresh_jobs | BE-06/07; catalog/gold compatibility/FX/quotes; không ghi cash/quantity |
| Ingestion & Connections | sources, evidence, event_evidence, source_records, collector_bindings, ingestion_receipts, receipt_evidence, coverage_gaps | BE-08; consent/source binding/receipt/parse/evidence; dùng Identity device checks, không tự đổi owner |
| Imports | import_previews, import_jobs | BE-09; CSV staging/mapping/preview/selection/confirm; normalized data vào ingestion/domain workflow |
| Review | reviews | BE-10; cases/decision lifecycle; actual resolution gọi Ledger, không ghi bảng Ledger trực tiếp |
| Planning | financial_plans, plan_items, actual_links, goals, plan_goal_links, goal_allocations, simulations, planning_drafts | BE-11/12/13/15; Plan/Goal chung consistency boundary, linked draft/allocations; read actual, không write actual |
| Read Models | snapshots | BE-05; consistent projections cho Home/report/insights/drill-down; không tự tạo finance events |
| Assistant | conversations, messages, agent_runs, tool_results | BE-14/15; Q&A/context/history/mascot/run orchestration; planning draft ghi qua Planning public draft API |
| Ops | ops_accounts, ops_sources, ops_jobs, ops_quotas, ops_releases, ops_incidents, ops_previews, ops_idempotency, ops_audit | BE-16; sanitized metadata/auth lifecycle/safe commands, không join finance cho admin |
| Shared transaction infrastructure | version_history, proposal_previews, idempotency_records | BE-02/17/18; domain owner quyết định payload/policy; không generic public CRUD xuyên modules |

Financial Engine là code tính toán, không sở hữu một ledger thứ hai hoặc bảng riêng. Shared infrastructure không là `common` chứa mọi business logic. BE-19/20 thuộc adapters/native và BE-21 thuộc release/operations; không cần tạo bảng/module backend giả chỉ để ánh xạ.

54 bảng chỉ là inventory hiện có, không chứng minh schema đủ. Ví dụ durable generic dispatch/lease, scheduler state, retention/deletion journal và cấu hình recovery cần ARCH-04/09 đối chiếu cụ thể; thư viện jobs có thể cần additional tables/migrations. Giữ toàn bộ behavior và bổ sung có kiểm soát nếu thiếu.

## 7. Dependencies và cách tổ chức code

Đề xuất codebase backend riêng trong cùng repository, chưa đổi frontend workspace/package/lockfile:

```text
finweave-backend/
  src/entrypoints/       user-api, ops-api, worker, migrate
  src/modules/          identity, accounts, ledger, portfolio, market,
                        ingestion, imports, review, planning, read-models,
                        assistant, ops
  src/engine/           pure calculations, immutable inputs/results
  src/workflows/        cross-module application transactions
  src/platform/         db, UnitOfWork, jobs, auth primitives, telemetry
  src/adapters/         HTTP, providers, SQL repositories, model gateway
  src/contracts/        generated canonical wire types and validators
  tests/                domain, SQL, contracts, concurrency, authorization
```

Mỗi module có public application API, domain rules và private repositories. HTTP routes/worker handlers là adapters gọi cùng use cases; worker không gọi HTTP vòng về API của chính mình để reuse business logic. Shared backend domain không import React/fixtures/Store mock/frontend command engine.

Hướng dependency: entrypoints/adapters/workflows → module public services → domain/Engine và infrastructure ports. Planning đọc financial facts qua authorized reader interface; Ledger không phụ thuộc Planning. Agent gọi scoped read/simulate/draft services; Planning không phụ thuộc Agent. Ingestion/Review workflows gọi Ledger/Portfolio public mutation ports; Ledger không import ngược Review hoặc parsers.

Cross-module atomic workflow thuộc application coordinator, truyền opaque transaction context vào owner services. Không import repository private của module khác, không nested independent commit. Read-model builder dùng approved query layer, consistent snapshot và version refs; không ghép nhiều reads khác version rồi đóng nhãn một snapshot. Atomic writes giữ same database consistency boundary; phân tách module không ép phải network RPC.

Enforce ở CI bằng no-cycles/import rules/public export allowlist và tests quyền process/DB. Module chỉ có folder đẹp nhưng import chéo toàn bộ không đạt. P2 ops bootstrap chỉ inject Ops permissions/pool; worker profiles chỉ nhận capabilities được phép.

## 8. Giữ atomic transactions qua modules

| Use case | Phải cùng một transaction | Tách ra ngoài transaction |
| --- | --- | --- |
| Posting/transfer/refund/correction | Domain validation dưới locks, event/groups/lines, related movements/evidence links cần thiết, history/version/replay; correction reversal+replacement cùng commit | Provider/model calls, UI notification; projection work có thể async nếu giữ version/coverage đúng |
| Confirm Plan–Goal draft | Revalidate owner/preview/digest/versions/current eligibility; Plans/Goals/links/allocations/history/preview consumption/replay | Model inference, clarification và simulation dài; actual ledger không đổi |
| Nhận notification | Receipt identity/digest+normalized payload và durable dispatch state | Parse/matching/posting về sau; ACK chỉ sau receipt transaction commit |
| Worker hoàn tất posting | Ledger effect cùng durable processed marker/result/dedupe tương ứng; fence lease/binding trước commit | Queue housekeeping có thể retry; job delivery không được coi là exactly-once business effect |

UnitOfWork lấy một PG client, BEGIN, đặt actor/workspace context theo transaction, phối hợp module owner services, COMMIT hoặc ROLLBACK và release. Tất cả repository calls thuộc transaction phải dùng client đó, không `pool.query` rời rạc. node-postgres nêu rõ yêu cầu cùng client. [Transactions](https://node-postgres.com/features/transactions).

Concurrency không tự đúng chỉ vì có BEGIN/COMMIT. Phải chọn lock order và lock key chung cho mọi writer của invariant: ví dụ concurrent Goal allocation không chỉ khóa allocation rows đã tồn tại mà cần account/aggregate anchor hoặc SERIALIZABLE phù hợp để tránh hai bên cùng thấy available cash. Actual chi tiêu vẫn được ghi và làm Goal shortfall khi cần; allocation không được dùng làm lý do cấm actual.

Serialization failure/deadlock có bounded whole-transaction retry; không retry external side effect, không tự bỏ stale preview. Replay idempotency trong cùng owner/workspace context; existing committed result được xét trước stale version, same key khác digest conflict. Atomicity/isolation phải test bằng concurrent DB connections và fault injection. PostgreSQL yêu cầu retry transaction khi isolation báo serialization failure; framework không loại bỏ nghĩa vụ này. [PostgreSQL isolation](https://www.postgresql.org/docs/current/transaction-iso.html).

Spring transaction annotations cũng cần gọi đúng transaction boundary; default proxy không áp dụng annotation cho self-invocation. Đây là ví dụ S3 vẫn cần test, không chọn framework để né concurrency design. [Spring transactions](https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html).

## 9. Evidence cần có trước khi nhận cấu trúc backend

Các kiểm tra dưới đây là SPECIFIED/NOT RUN, refinement của [SP-08/09/13/14/15](../testing/technical-spikes.md):

1. Canonical2020-12 compiler/input/output/error responses; native/admin/user adapters không đổi decimal/null/required semantics.
2. Import boundaries không cycles; user API/Ops API/worker bootstrap đúng capabilities; Ops không có finance DB access, Agent không có confirmation/posting tools.
3. SQL migration+roles chạy disposable DB; rollback giữa Plan/Goal bundle và reversal/replacement không để half-state; concurrent refund/allocation đúng independent oracle.
4. Lost ACK/retry/worker crash sau business commit chỉ một financial effect; job lease hết hạn không cho stale worker ghi thêm; owner revoke/binding fence có tests.
5. Read snapshots nhất quán; Engine reuse có parity và independent oracle, explicit business clock/rounding/coverage; không chép mock assumption thành production rule.
6. Đo RSS/CPU/event-loop/pool counts khi API+worker profiles cùng chạy, inference unavailable, graceful shutdown/mixed-version jobs. Chốt deployment/queue concurrency bằng measurement ở ARCH-03/09.

## 10. Kết quả và bước tiếp theo

**Owner đã chọn S1 + P2 ngày08/10/2026.** [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [Stack](tech-stack.md), [module HLD](module-high-level-design.md), [HLD](high-level-design.md) ghi thiết kế được chọn. PostgreSQL, một ledger mỗi workspace, T1 và toàn bộ feature tiếp tục theo ARCH-01. AI chốt chi tiết thường lệ trong hướng này.

Tiếp ARCH-03 infrastructure/platform/cost và ARCH-04 DB execution/schema; ARCH-05/06 contracts/auth và ARCH-09 queues cần đối chiếu P2. Exact dependency versions, platform resources, SQL grants/new tables, providers/model và runtime evidence còn mở. Không đổi API/schema/frontend/runtime/dependencies hoặc snapshots r1/r2, không coi decision accepted là tests PASS.
