> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 hiện hành:** [Identity/session/permissions](../security/identity/identity-access-design.md), [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [API002](../contracts/v2-t1-r2/README.md), [identity DB delta](../data/target-t1-auth/README.md). Auth design supersede follow-up ARCH-06 trước đây; implementation/crypto/SQL/mail/native/security vẫn NOT RUN. API001 và DB D1/J2 giữ lịch sử, không overwrite.

# FinWeave — Tech Stack v1.7

ARC-STACK-001 · 08/10/2026 · **ARCH-02 ACCEPTED: S1 + P2; ARCH-03 ACCEPTED: I0 + I1; ARCH-04 ACCEPTED: D1 + J2**. Owner chọn Fastify + TypeScript và API user/Ops/workers tách process; kế thừa A + T1. [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [HLD](high-level-design.md), [module HLD](module-high-level-design.md), [nghiên cứu](ARCH-02-options.md).

Đây là nguồn stack working hiện hành. Giữ nguyên tệp FinWeave_Tech_Stack.md ở root đã bị xóa; không phục hồi từ baseline. Các stack cũ trong snapshots giữ lịch sử. ACCEPTED là lựa chọn thiết kế, chưa có backend package/runtime hoặc dependency lock được triển khai trong nhiệm vụ này.

## 1. Stack theo lớp

| Lớp | Lựa chọn hiện hành | Trạng thái / điều kiện |
| --- | --- | --- |
| User Web / Admin Web | Kế thừa React/Vite/TypeScript hiện có, hai builds/surfaces và sessions riêng | Frontend r2 synthetic checked-scope; không thay package/lockfile/code trong lượt này |
| Android | UI qua Capacitor + native Kotlin cho permission/listener/Keystore/outbox/WorkManager | Native/Gradle/release APK/device matrix chưa nghiệm thu |
| Backend language/HTTP | TypeScript + Fastify, explicit composition và scoped route plugins | **S1 ACCEPTED**; không thêm Nest/Spring, không có backend implementation |
| Backend runtime | Node LTS tương thích Fastify; major24 là candidate khớp engine frontend hiện có | Exact major/patch/plugins pin khi compatibility/support check; không suy runtime từ @types/node |
| Persistence | PostgreSQL, node-postgres (`pg`), parameterized SQL repositories, UnitOfWork | SQL-first; pg client/row types/conversions cần integration tests; không SQL interpolation |
| Schema/migrations | D1 SQL-first migrations004+ expand/backfill/cutover; [target DB](../data/target-t1/README.md), checksum/journal | 001–003 giữ nguyên và chưa thực thi;004+ mới có design, không ORM auto-sync; SQL/domain/RLS/upgrade/restore NOT RUN |
| Contracts | Canonical OpenAPI v2.0.0 + JSON Schema2020-12 → generated wire types/runtime validation | Canonical source duy nhất; v1/prototype adapters vẫn cần; chưa thay bytes/wire |
| Validation/serialization | Compiler/registry2020-12 riêng, Ajv2020 là implementation direction; typed allowlisted responses kiểm cùng semantics | Refs/formats/null/union/decimal/errors/unknown fields phải PoC; không coi default Fastify compiler/serializer tự tương thích |
| Financial Engine | Pure TypeScript/decimal arithmetic, explicit clock/versions/assumptions | Độc lập HTTP/DB/providers; kế thừa thuật toán sau parity/oracle, không copy Store mock làm authority |
| Background jobs | Durable PostgreSQL-backed jobs qua Jobs port; profile-specific worker processes | Queue library/schema/dispatch chi tiết chưa chọn, thuộc ARCH-04/09; không mặc định Redis/BullMQ/Kafka |
| Agent | TypeScript orchestration/scoped tools/persisted runs/drafts; inference qua provider adapter | Model/runtime/egress/latency/cost ở ARCH-12; không tự thêm Python service hoặc cloud LLM |
| Tests/quality | TypeScript/import boundaries, domain/oracles, Vitest candidate; PostgreSQL integration/concurrency, contracts/direct API/security; browser regression kế thừa | Tool versions pin riêng khi implementation; frontend PASS không thay backend evidence |
| Deployment | I0 local + I1 Oracle Always Free Linux VM có điều kiện; containers/Compose, P2 roots, private PG, reverse proxy HTTPS, host timer enqueue | Account/quota/ARM64/shape/region/pools/sizing/DNS/TLS/backup chưa kiểm; exact versions pin khi implement, không auto paid fallback |

S1 không bảo đảm toàn bộ sản phẩm miễn phí. P2 không yêu cầu mỗi process một paid cloud service; platform phải hỗ trợ worker và đo đủ RAM/CPU/connection limits. Không cài package, tải model, chạy migration, tạo service hoặc chi phí trong nhiệm vụ tài liệu.

## 2. Process và quyền theo P2

- `user-api`: user/device routes, owner authorization, previews/confirmation và queries; dùng finance role có kiểm tenant/object/device.
- `ops-api`: admin auth/MFA, sanitized DTOs và safe operational commands; chỉ Ops pool/credentials, không finance pool, private job payload, provider/model secrets hoặc owner confirmation.
- `worker` với profile ingestion/import, market, Agent, retention: mỗi profile có modules/job allowlist/credentials/pool/concurrency riêng. Các profiles khác DB quyền chạy process riêng để có isolation thật; synthetic gộp chỉ là configuration thử, không claim isolation.
- `migrate`: one-off runner có quyền DDL tách API/workers, không public HTTP route. Scheduler là host timer gọi enqueue adapter/catch-up với service identity quyền hẹp theo ADR-010; queue/leases/fencing chi tiết thuộc ARCH-09.

Agent worker không có ledger/active-plan-confirm credentials hoặc tools. Read/simulate/draft quyền hẹp qua interfaces/procedures được duyệt; không generic SQL/network tool. Ops chỉ enqueue safe request bằng operational IDs qua restricted command path; worker kiểm quyền/state/quota, không nhận finance command tùy ý từ admin.

## 3. Contract và data discipline

Frontend Zod là implementation quan sát, không nguồn wire thứ hai. OpenAPI types không tự validate runtime; compiler2020-12 và response DTO allowlist phải được kiểm. Không nhận schema từ user, không coercion/strip data âm thầm để PASS; decimal money/quantity giữ canonical string qua transport, parse bằng Decimal/SQL numeric theo mục đích, không global conversion thành Number.

DTO, domain inputs và DB rows có mapping riêng, giữ required/null/time/units/version semantics. Mọi câu lệnh của một transaction dùng cùng checked-out PG client; actor/workspace đặt theo transaction, không session state rò qua pool. Exact driver/type/crypto/instrumentation library versions chưa được chốt bằng việc owner chọn S1.

## 4. Nguồn và phần thiết kế tiếp

Framework capabilities/compatibility research có nguồn chính thức trong [ARCH-02](ARCH-02-options.md); không có benchmark FinWeave đã chạy. [Module HLD](module-high-level-design.md) chốt ownership/dependencies/UnitOfWork/process capabilities. ARCH-03 đã chọn I0 + I1 tại [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [topology](deployment-topology.md) và [environment matrix](environment-matrix.md); process budgets/quota/boot/restore chưa đo. ARCH-04 schema/SQL execution; ARCH-05/06 contracts/auth T1; ARCH-08/09 domain/jobs; ARCH-12 Agent và ARCH-13 operations.

SEC-REAL-T1/backend/native/security/UAT vẫn NOT RUN. API/schema bytes và snapshots r1/r2 không đổi; stack working này là delta sau r2.

## Database decision ARCH-04

[ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md) chốt D1 + J2. PostgreSQL16 baseline major, pg/UnitOfWork giữ;70 bảng/782 cột là expand design, không production count. Shared PostgreSQL dispatch dùng typed references và per-profile capabilities; không chọn queue package hoặc Redis. ARCH-09 đối chiếu queue library/schema để chỉ có một lease authority. SQL implementation/grants/migrations mới phải kiểm trước backend acceptance.

## Contract source ARCH-05

[OpenAPI T1 working revision](../contracts/v2-t1/openapi.json) và [revision/hash](../contracts/v2-t1/revision.json) là target backend/consumer mới; [v2 baseline](../contracts/v2/README.md) giữ lịch sử.141 operations, OpenAPI3.1/JSON Schema2020-12; payload2.0.0 pre-release với revision pin, không hybrid production fallback. Browser cookie, native owner bearer, collector-only bearer và private service profiles tách authority.

Fastify request compiler và response serializer phải có dialect compatibility PoC; structural validation không chứng minh default plugins hỗ trợ đầy đủ. Exact dependency versions chưa chọn/lock.

## ARCH-06 — Identity stack decision

First-party opaque credentials/PostgreSQL, Argon2id candidate64MiB/t3/p4, CSPRNG256bit tokens, purpose-separated HMAC-SHA256 digests; AES256GCM short auth replay/seed envelope, ES256/P-256 native proof và mTLS+HMAC services. Không managed IdP/Redis/paid addition. Crypto primitives dùng thư viện chuẩn; package/version/ARM64/interop benchmark chưa pin. Owner password+email verification không claim MFA; admin RFC6238 TOTP bắt buộc. Email adapter/provider thật còn AUTH-MAIL-REAL BLOCKED. [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md).

## ARCH-07 — Công cụ bảo mật và backup được chọn

Secret files riêng theo process nằm trên volume LUKS2 mã hóa; operator mở khóa khi khởi động, thiếu khóa thì dừng an toàn. Không thêm paid KMS/Vault cluster. Backup dùng pg_dump custom export nhất quán và repository restic mã hóa qua TLS ngoài host; source writer chỉ append, custodian prune riêng. Recovery capsule mã hóa bằng age, khóa recipient giữ offline riêng biệt.

Metadata thu hồi/xóa dùng Ed25519, SHA256 và RFC8785; dùng thư viện chuẩn, không tự viết crypto primitive. Đây là hướng thiết kế: versions, binary integrity, ARM64, storage, permissions và restore benchmark đều NOT RUN. Endpoint/capacity chưa provision, chưa thể cam kết miễn phí. Crypto format của restic không được nhầm với AES-GCM của auth envelopes ARCH-06.

## ARCH-08 — Engine và numerical model

Shared TypeScript pure Engine; exact VND/scaled decimal/BigInt coefficient boundaries. decimal.js là hướng chọn, clone context riêng; precision80 candidate cần known vectors/package/runtime validation, không tin global precision hoặc frontend Number làm actual authority. PostgreSQL numeric được kiểm trước typmod cast.

Stochastic forecast là simulator có model/RNG/grid/rounding version, được phép approximate transcendental math và trả labeled simulated output; không viết actual. Không thêm Python service: công cụ Fraction/Python trong hồ sơ chỉ kiểm specification độc lập. ForecastWorker cùng source/module Planning, process capability hẹp trên J2; không Redis/Kafka/queue thứhai. Package/ARM64/latency/memory vẫn NOT RUN.

## ARCH-09 — Queue/compute implementation choice

Chọn pg narrow SQL queue ports cho J2, không thêm Redis/vendor queue/library schema khác. ForecastWorker supervisor dùng bounded worker_threads pool1 cho pure compute; heartbeat/cancel/DB trên supervisor loop. Exact runtime versions/ARM64/performance chưa pin/benchmark; threads không là security sandbox.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Capacitor8.x/Kotlin/Room/AES256GCM/Keystore/WorkManager design; min24 target+compile36. Pin compatible exact patches/AGP/JDK at implementation; no installed dependency/toolchain claim.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Fastify TS provider adapters + built-in Kotlin parser. SSI V3 candidate, không V2 SDK baseline. Vnstock optional connector chưa cài/chọn, software license khác data rights. Không thêm Python sidecar/dependency ở task này.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Custom TypeScript orchestrator trong Fastify/P2/J2, không thêm framework queue authority. Local Ollama+Qwen3-4B candidate chưa cài/pin; runtime/model/tokenizer/chat template/quantization phải benchmark. No dependency/lockfile change.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

CI local dùng cùng tập lệnh kiểm; hosted CI có gate quota/quyền. Systemd/Compose, pg_dump/restic/age kế thừa kiến trúc hiện hành. Exact runtime/image/actions/signer còn phải pin trước triển khai; dependencies không đổi.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
