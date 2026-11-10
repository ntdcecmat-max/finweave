> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](../product/screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 hiện hành:** [Identity/session/permissions](../security/identity/identity-access-design.md), [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [API002](../contracts/v2-t1-r2/README.md), [identity DB delta](../data/target-t1-auth/README.md). Auth design supersede follow-up ARCH-06 trước đây; implementation/crypto/SQL/mail/native/security vẫn NOT RUN. API001 và DB D1/J2 giữ lịch sử, không overwrite.

# FinWeave — High-Level Design v1.1

08/10/2026 · **ARCH-01 ACCEPTED: A + T1; ARCH-02 ACCEPTED: S1 + P2; ARCH-03 ACCEPTED: I0 + I1; ARCH-04 ACCEPTED: D1 + J2; ARCH-05 ACCEPTED CONTRACT DESIGN** theo các lựa chọn và ủy quyền kỹ thuật của owner. Thiết kế đích; backend/native/security chưa triển khai hoặc nghiệm thu. [ADR-008](adr/ADR-008-modular-backend-trusted-server.md), [context](../requirements/context-model.md), [views](views/architecture-views.md), [LLD](low-level-design.md), [agenda](architecture-decision-agenda.md), [Stack](tech-stack.md), [module HLD](module-high-level-design.md), [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md), [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md).

## 1. Quyết định tổng thể

**A:** backend chia module trong cùng codebase, dùng chung domain services và Financial Engine; user/device API, Ops API và workers là các entrypoints có lifecycle và quyền riêng. **T1 TRUSTED-SERVER:** backend được xử lý finance dạng rõ; người kiểm soát host/runtime/DB/backup/khóa máy chủ thuộc bên được tin và có khả năng truy cập dữ liệu. App-admin chỉ có quyền vận hành qua API/DTO giới hạn.

Lựa chọn này thay target anti-Ops/protected-real trước đây theo NFR-08 cập nhật trong [SRS](../requirements/srs.md). Không cam kết chống root/DBA đọc finance. TLS, mã hóa lưu trữ/backup, least privilege, tenant isolation, log redaction và audit vẫn cần thiết kế và kiểm chứng. T2/T3 là alternative tham khảo, không là điều kiện bắt buộc của release T1.

Giữ đủ mọi tính năng trong [21 gói REQUIRED](../product/backend-backlog.md). ARCH-02 đã chọn **Fastify + TypeScript (S1)** và **user API/Ops API/worker processes riêng (P2)**. ARCH-03 chọn **I0 local + I1 Oracle Always Free VM có điều kiện**, PostgreSQL/backend/workers cùng host nếu đủ tài nguyên, tách process/quyền. Account/quota/shape/region, exact runtime/dependency versions, replica, domain, backup destination và model còn cần kiểm/chốt; không chọn gói trả phí. Ưu tiên miễn phí không bảo đảm toàn bộ sản phẩm luôn có chi phí bằng0.

## 2. Ba clients và ngoại hệ thống

User Web và User Android dùng cùng user/device API và dữ liệu theo workspace. Android APK kế thừa UI qua Capacitor và bổ sung collector/outbox/uploader Kotlin native; listener không đợi WebView mở. Admin Web có build, identity/session, Ops API và DTO riêng. Clients không giữ DB/provider credentials hoặc truy cập trực tiếp database.

App ngân hàng/ví cung cấp notifications trên thiết bị, chưa có bank API integration hoặc khả năng chuyển tiền qua ngân hàng. Notifications có thể thiếu/trùng/đổi template; ledger FinWeave không mặc nhiên là sao kê đầy đủ. Price/model providers có entitlement/privacy/cost riêng; T1 không tự cho phép gửi finance tới cloud LLM.

## 3. Thành phần và quyền

| Module / thành phần | Trách nhiệm | Giới hạn |
| --- | --- | --- |
| Identity/Devices | Sessions/membership, enrollment/revoke; source consent/bindings phối hợp Ingestion | Server xác lập subject/workspace/role; upload chỉ theo binding còn hiệu lực |
| User/device API | Typed validation, authorization, preview/idempotency, commands/queries | Không tin role/workspace từ body hoặc client |
| Accounts/Ledger | Opening/date, bank/wallet/cash, thu/chi/transfer/fee/refund/count/correction/reversal/history | Actual effects qua domain rules và atomic transactions |
| Ingestion/CSV/Review | Durable receipt, normalized evidence, parser/matching, semantic dedupe, import preview và Review resolution | ACK không là posted; ambiguity vào Review; không raw/OTP hoặc dedupe chỉ amount+minute |
| Holdings/Market | Stock ticker/quantity, gold profile/chỉ, catalog/quotes/refresh/last-good | Giá không đổi cash/quantity/income; provider không cần nhận private holdings |
| Financial Engine | Balance/flow/valuation/forecast/allocation/Goals/simulation, versioned results/provenance | Deterministic, shared domain library; AI/chart không là authority số tiền |
| Read models/Insights | Home/report/transactions/assets/insights/drill-down | Dẫn xuất từ canonical state+quotes+versions; cache không là ledger riêng |
| PlanGoals | Manual Plan/Goal, links/allocations, drafts/preview/confirm/history/stale detection | Atomic Plan/Goal bundle sau owner confirm; không actual write |
| Assistant/Agent | Chat/history/context/mascot, investigation, Goal-first/Plan-first/replan/clarification | Typed scoped read/simulate/draft tools; không confirm thay owner, SQL/network tùy ý hoặc ledger write |
| Workers/Scheduler | Receipt/import, daily/manual prices, Agent steps, retry/catch-up/retention | Durable jobs/lease/fencing; không phụ thuộc browser hoặc transaction xuyên provider call |
| Ops API/Admin | Health/sources/parser/jobs/quota/release/incidents/sanitized audit, safe retry/disable | Không finance/evidence/prompt read, impersonation hoặc actual commands |
| PostgreSQL/backup | Canonical records, jobs/receipts/replay/history/projections và recovery | Module ownership và DB roles riêng; restore phải kiểm dedupe/deletion |

Worker roles khác nhau: ingestion có domain posting được kiểm; price chỉ quotes/valuation; Agent chỉ tools/drafts; retention chỉ policy đã duyệt. Shared codebase/DB không cấp mọi module quyền ghi mọi bảng. Ops job views không lộ private payload qua queue.

## 4. Một nguồn dữ liệu tài chính đúng

Mỗi workspace có một canonical ledger chứa actual events/movements và correction history. Holdings, quotes, evidence và Plan/Goals có authority/provenance/versions riêng; Engine kết hợp chúng để tạo read models. Web/mobile không tự cộng trang giao dịch hoặc giữ hai sổ độc lập. Manual entry, CSV và notification dùng cùng domain invariants.

Posting transaction gồm effects/history/relevant versions/replay result. Retry cùng key/digest trả prior committed result; semantic dedupe giữa devices/CSV khác transport idempotency. Account/holding declaration không tự tạo income hoặc giao dịch mua giả. Missing không thành 0; coverage gaps và observation khác calculated balance phải hiện rõ.

PostgreSQL + durable DB jobs là baseline để rà chi tiết. [54 bảng/610 cột, migrations001–003](../data/physical/README.md) vẫn là artifact synthetic chưa chạy. T1 cho phép storage thông thường trong trusted server, nhưng artifact đó chưa được chứng nhận đúng domain/security hoặc production-ready. ARCH-04 đã chốt [D1 + J2 / ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md): [target model/ERD/dictionary](../data/target-t1/README.md) tiếp nối bằng migrations004+, expand design70 bảng/782 cột. SQL implementation/ownership/constraints/indexes/upgrade/restore còn phải kiểm trước sử dụng.

## 5. Notification → web và Android

Android consent/OS permission/allowlist/binding → filter OTP/raw và normalize tối thiểu tại device → encrypted owner-bound durable outbox với event ID cố định → authenticated device API → commit receipt+job bền rồi ACK → ingestion worker kiểm binding/parse/match/dedupe → atomic posting hoặc Review → relevant snapshot version mới → foreground web/mobile fetch/poll/refresh-on-focus.

Lost ACK cho phép resend cùng ID; receipt status khác posting status. Hai giao dịch thật cùng amount không bị gộp tùy tiện. Logout/switch/revoke ngăn queue A gửi bằng B; force-stop/OEM/mất permission phải báo gaps. Không gọi model cho mọi notification; Agent điều tra khi cần và chỉ đề xuất.

## 6. Daily/manual prices

Daily scheduler/manual request → coalesce/cooldown/quota theo source/entitlement/date → durable job → licensed provider adapter → kiểm instrument/product/purity/side/unit/currency/time → quote observation → Engine valuation với quantity hiện có → versioned read model. Last provider success khác quoteAsOf; ngày nghỉ không đổi timestamp giả mới. Timeout/429/partial giữ last-good có nhãn.

Clients tắt không tắt scheduler; host timer enqueue durable jobs theo topology I0 + I1. Host dừng thì lịch dừng; startup catch-up/overdue cần kiểm. Worker lease/retry xử lý restart, không giữ DB transaction khi chờ provider. Clock không thay business queue. Quota/reclaim/reliability theo ADR-010; chi tiết queue/catch-up ARCH-09, chưa có SLA đã đo.

## 7. Plan–Goals và Agent

Một Assistant kế thừa Q&A/chat/history/context/evidence/mascot theo [AI-SPEC-001](../product/ai-agent-specification.md), thêm Goal-first/Plan-first/investigation/replan trong cùng orchestration/tool boundary.

Owner intent → authorized context → clarification → Engine simulate/compare → linked draft → owner sửa/preview → **owner confirm** qua PlanGoals API → kiểm quyền/digest/expiry/expected versions → atomic Plan/Goal/links/history/replay. Kể cả sau confirm, luồng này không tạo actual transaction hoặc ghi ledger. Agent không có confirmation tool.

Run/steps có state/cancel/quota/budget; resume kiểm quyền và snapshot lại. Concurrent edits làm draft stale và cần re-preview. Model calls ngoài DB transaction; manual planner/Engine tiếp tục khi model unavailable. External model/private-context egress phải được chốt ở ARCH-12/security.

## 8. Runtime, contracts và gates

**P2 đã chốt:** user/device API và Ops API là hai processes riêng; workers chạy profile-specific processes theo credentials/job allowlist/pool/quyền. Dùng chung versioned domain codebase/Financial Engine, có thể chung build artifact nhưng bootstrap khác nhau; không chung API process kiểu P1. Ops bootstrap không inject finance pool/provider/model secrets; Agent không có posting/active-plan-confirm capabilities. Profiles khác privilege không gộp trong process giữ mọi credentials rồi claim isolation.

I0 + I1 đã chọn chung local/Oracle VM nếu đủ tài nguyên, không một paid server mỗi process. [Topology](deployment-topology.md) và [environment matrix](environment-matrix.md) quy định private PG, hai API/worker processes, static web/admin + signed APK qua HTTPS reverse proxy, host timer enqueue. RAM/CPU/tổng pools/replicas phải benchmark; DNS/TLS/backup destination chưa kiểm. Scheduler execution chi tiết thuộc ARCH-09; migration runner quyền riêng, không public HTTP route. Native consent/identity chi tiết thuộc ARCH-06/10.

[Canonical API v2 2.0.0](../contracts/v2/README.md) là đích; legacy reply1.1.0 và operational prototype 2.0.0 vẫn cần adapters. Cùng version string không chứng minh cùng contract. Thay trust không đổi wire schema hoặc bật frontend transport hiện fail-closed.

Frontend r2 chỉ nghiệm thu synthetic checked-scope. SQL/backend/auth/native/sources/real Agent/security/UAT vẫn NOT RUN. **SEC-REAL-T1** đòi tenant/admin/object/device authorization, safe transport/secrets/logs, encrypted storage/backup, restore/erasure và provider/privacy controls có evidence trước real data. Protected anti-Ops PoC không còn là gate T1. Immutable r1/r2 giữ nguyên; working docs là delta sau r2.

## 9. Độ phủ đầy đủ

| Gói REQUIRED | Thành phần thực hiện |
| --- | --- |
| BE-01/02/03/04/05 | Identity/API/accounts/ledger/read models/Engine |
| BE-06/07 | Holdings/Market/price worker/providers |
| BE-08/09/10 | Devices/sources/ingestion/CSV/Review/evidence |
| BE-11/12/13 | PlanGoals/Engine/simulation |
| BE-14/15 | Assistant/history/Agent/tools/drafts |
| BE-16/17 | Ops API/admin/scheduler/durable workers |
| BE-18 | T1 trust/auth/keys/logging/backup/recovery |
| BE-19/20 | Web/admin adapters/Android UI/native APK |
| BE-21 | Deployment/monitor/migrations/release/UAT/restore |

Đây là mapping trách nhiệm, không là bằng chứng runtime coverage.

## 10. Cấu trúc modules S1 và transaction ownership

[Module HLD ARC-MOD-001](module-high-level-design.md) chốt12 business modules: Identity/Accounts/Ledger/Portfolio/Market/Ingestion/Imports/Review/Planning/Read Models/Assistant/Ops; Financial Engine thuần và shared transaction infrastructure hỗ trợ. Đối chiếu đủ54 bảng hiện có với một logical owner mỗi bảng. Đây không là giới hạn số bảng; ARCH-04 đã bổ sung16 structures cho dispatch/lease/planning revisions/cache/import/admin auth/payload/retention/recovery/control/migration journal trong target design; ARCH-09 chốt queue implementation, không hai lease authorities.

Entrypoints/HTTP/provider/SQL adapters và application workflows gọi public module services; private repositories không import xuyên module. Ledger không phụ thuộc Planning/Review/Agent; Planning đọc authorized facts và gọi Engine, không import Agent hoặc ghi actual. Read-model joins chỉ qua authorized query layer với versions nhất quán. Engine không HTTP/DB/React/fixture dependency.

Cross-module coordinator sở hữu UnitOfWork; mọi repository call cùng transaction dùng **cùng checked-out PG client** và TxContext, actor/workspace context transaction-scoped. Owner confirm Plan/Goal/links/history/preview/replay atomic; correction/reversal/replacement và related effects atomic. Không nested independent commits, không transaction xuyên model/provider call. Locks/anchors/order, replay/digest và bounded whole-transaction retry phải có concurrency/fault evidence.

[Stack ARC-STACK-001](tech-stack.md): Fastify/TypeScript, pg/parameterized SQL repositories, canonical OpenAPI v2/2020-12 validators và pure decimal Engine. Pin dependencies/compatibility và validator/serializer2020-12 PoC trước nhận conformance; không copy frontend mock/Zod thành canonical server source. Reviewed SQL giữ authority; không ORM auto-sync hoặc tự thêm Redis/Kafka/Python service.

Import-boundary/no-cycle checks, direct API/DB role tests và worker profile capability tests bắt buộc khi implement. Current docs acceptance không chứng nhận runtime/module isolation. [ADR-009](adr/ADR-009-fastify-and-isolated-processes.md) ghi lựa chọn/đánh đổi S1 + P2; ADR-010 bổ sung infrastructure, ADR-011 bổ sung database D1 + J2; các chi tiết ARCH-05…13 còn mở.

## 11. Infrastructure I0 + I1

[ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md) chốt local để phát triển và Oracle Always Free cho cloud synthetic pilot có điều kiện. Containers/Compose giữ cùng code/image và migration chain; secrets/DB/client URLs tách theo environment. Khi chạy real, staging ở local hoặc host khác; không clone real vào demo hoặc test phá hủy trên real host.

Hạ tầng single-host không HA, có rủi ro capacity/reclaim/outage. Off-host encrypted backup và alert độc lập host, restore/deletion replay là điều kiện trước real; RPO24h/RTO1ngày chưa đo. Không cấp được máy free thì giữ local, không tự PAYG/I2/I3. [Cost v4](../product/cost-model.md) tách hosting khỏi model/market data/domain/backup/distribution và thiết bị/điện; full Agent và auto price vẫn phải nghiệm thu, không thay bằng fallback manual.

## 12. Database target D1 + J2

[ADR-011](adr/ADR-011-evolving-schema-and-shared-jobs.md) giữ domain identities và một DB consistency boundary. [Permissions](../data/target-t1/permissions.md) giới hạn từng P2 profile, [invariants](../data/target-t1/invariants-and-workflows.md) quy định sealed ledger/revisions/precision/history/cache/retention. Agent và market không actual writes; app-admin chỉ metadata/safe control; host/DBA vẫn trusted T1.

J2 jobs/attempts/scheduler_state là dispatch authority duy nhất; receipt/refresh/import/Agent domain status giữ riêng. Typed refs, không finance payload trong Ops-visible queue. Domain+enqueue atomic; effect+processed marker+replay atomic; lease generation/token/epoch ngăn stale worker. External calls ngoài transaction. Queue library chưa chọn; migration cutover phải drain/fence legacy claimers.

Planning scope/revisions/items giải quyết cross-plan version collision và standalone; cache expiry không xóa pinned history. Payload lifecycle tách dedupe identities. Recovery cần latest independent off-host revoke/delete checkpoint trước mở uploader sau restore; local journal không đủ. [Migration plan](../data/target-t1/migration-plan.md) và [API overlay](../data/target-t1/api-data-delta.md) là thiết kế, không DB execution/conformance.

## 13. API contract revision T1/D1/J2

[ADR-012](adr/ADR-012-unified-t1-contract-revision.md) và [working API](../contracts/v2-t1/README.md) xác định target mới thay protected-only baseline. Giữ 133 operations, thêm 8 thành 141; payload version 2.0.0 chưa phát hành. Mỗi build pin revision và OpenAPI hash vì schemas, context, errors và security đã thay đổi; không suy tương thích từ nhãn version. Baseline/r1/r2 giữ nguyên.

Owner native session bearer khác collector-only token; collector chỉ ingest/reconcile. Admin session/MFA/OpsIdentity riêng; private profiles yêu cầu mTLS AND signature. J2 worker ticket gồm workspace, dispatch ID, generation/token/epoch và typed domain ID. Native token/proof/rotation/CSRF và credential storage đã được cụ thể hóa trong ARCH-06 bên dưới; revision001/70-table target giữ lịch sử, chưa tự đủ auth.

[DB delta](../contracts/v2-t1/db-contract-delta.md) và [31 acceptance scenarios](../contracts/v2-t1/acceptance-plan.md) ghi rõ follow-up. Frontend adapters/native bridge chưa migrate; structural artifacts không là backend acceptance.

## ARCH-06 — Identity authority và dữ liệu

User/API Identity phục vụ password/email challenge, browser cookie hoặc native owner family; OpsIdentity ở process/pool riêng phục vụ password+TOTP admin. Native installation key không là collector device key; collector token/renewal chỉ ingestion/reconcile/credential renewal và không đọc finance. Service profile dùng mTLS+per-profile signature, Engine nhận verified TxContext, Agent không owner confirm.

Current working API147operations revision002; DB82tables/921columns expand design kế thừa70-table D1/J2. Auth replay5min, finance replay90d khác lifecycle. Revoke/reset/restore epochs thắng replay, old device outbox không retarget owner. Cookie/CSRF, native proof/refresh, email delivery và actual DB grants phải kiểm qua AUTH-01…30; không implementation PASS.

## ARCH-07 — Bảo vệ dữ liệu và khôi phục

Bundle hiện hành ghép API revision 002 giữ nguyên với security profile FW-SEC-T1-001 và schema bảo mật revision 003: **84 bảng / 960 cột**. Khóa của Identity, Ops và từng worker tách riêng. Dữ liệu tài chính vẫn là bản ghi PostgreSQL có cấu trúc, được bảo vệ bằng mã hóa storage, đường truyền và backup; máy chủ được tin theo T1 vẫn đọc được dữ liệu rõ.

[Hồ sơ bảo mật](../security/t1/README.md) chốt secret files theo process, mở volume bởi operator, backup PostgreSQL nhất quán sang repository restic mã hóa ngoài host. Process tải backup lên chỉ có quyền append; quyền prune và khóa mở recovery capsule giữ riêng. Chưa cấp hạ tầng, khóa hay endpoint thực tế.

Witness độc lập lưu metadata thu hồi/xóa, không chứa dữ liệu tài chính. Hệ thống chặn quyền tại local trước, gọi witness ngoài DB transaction, rồi mới xác nhận hoàn tất an toàn cho recovery. Restore phải chặn host cũ, xác minh head mới nhất và áp dụng lệnh xóa trước mọi lượt đọc tài chính; đồng thời vô hiệu hóa credentials cũ. Thiếu witness, khóa hoặc mapping thì giữ trạng thái LOCKED. Đây là thành phần kiểm soát recovery, không tạo thêm business microservice hay authority hàng đợi J2. RPO/RTO vẫn là mục tiêu chưa đo.

## ARCH-08 — Financial Engine và forecast

[ADR-015](adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md) chốt shared pure Engine: actual/funding dùng exact decimal/scaled integers; calendar Việt Nam, sealed ledger, ordered quantity facts và immutable snapshot closure. Một authority tính balance/valuation/Plan–Goals; UI/SQL/controller không tạo kết quả tiền riêng. Agent chỉ đọc/mô phỏng/draft; owner confirm chỉ sửa planning bundle.

Extended forecast giữ đầy đủ settings/nợ/lạm phát/stress/uncertainty/Goal criteria của frontend. Frozen run dùng ForecastWorker compute-only trên J2, checkpoint và pages private, publish atomic sau đủ paths. API003151operations/626schemas và DB00486bảng/988cột/161FK là target thiết kế mới; prior packages giữ nguyên. Forecast không gọi nguồn/model thật và không posting. [Domain LLD](../domain/README.md), [30 ca runtime](../domain/acceptance-plan.md); implementation/concurrency/performance NOT RUN.

## ARCH-09 — Async HLD

Một PostgreSQL J2 dispatch authority; user/API accept atomic domain+enqueue, workers profiles riêng thi hành typed tickets. Native upload→durable receipt→worker effect/Review→typed client sync; daily/manual prices freeze input và quota, Agent continuation và forecast checkpoint không tạo financial authority thứ hai.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Native identity/owner broker/listener/Room/WorkManager độc lập WebView lifecycle. Server Engine actual authority; ACK khác posted; native parser không ghi ledger.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Ingestion/native parser normalize và giữ provenance; server Engine actual authority. Market adapter/quota/entitlement isolate khỏi clients; stock/gold quote không ghi cash/quantity. Source coverage không là bank statement.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Assistant module orchestration adaptive evidence→clarify/compare/draft/finish; Engine financial authority; Planning module draft commands. Owner confirm separate no actual. Một conversation/history, không Agent ledger/runtime queue thứ hai.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

CI nằm ngoài finance host. Release operator, migrator, backup, witness và pruner tách capability. Health, readiness, recovery và bật provider là các gate khác nhau; app-admin không là root.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
