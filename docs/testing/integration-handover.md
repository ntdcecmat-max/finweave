> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 current target08/10/2026:** [identity protocol](../security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](../contracts/v2-t1-r2/README.md), [auth DB expand](../data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> Hiện hành 08/10/2026: xem [nghiệm thu frontend](frontend-acceptance-report.md), [catalogue 50 screen IDs](../design/interface-catalogue.md), [truy vết UI](../design/ui-requirement-traceability.md). Các số liệu Step4–6 bên dưới là lịch sử; không dùng làm nghiệm thu v3.

## Runtime và phiên bản API — hiệu chỉnh 08/10/2026

> **BE-19 current — 12/10/2026:** bảng 08/10 và các notice DESIGN/NOT RUN bên dưới là lịch sử. [Báo cáo tích hợp](../frontend/be19-report.md) và [index có source/backend SHA256](../frontend/be19-evidence-index.json) ghi kết quả hiện tại: 13 HTTP/PostgreSQL integration PASS, 67 browser mock PASS, 140 unit PASS, user/admin build PASS, Android build/44 JVM PASS. API005/native003 adapters đã code; Android device E2E chưa chạy vì người dùng xác nhận không có thiết bị. Dữ liệu synthetic-local, REAL/provider/model/security gates chưa được mở hoặc nghiệm thu bằng các run này. Chưa chốt toàn bộ BE-19/41 AC.

| Phần chạy hiện tại | Hợp đồng/transport thực tế | Kết luận |
|---|---|---|
| User core + identity | `1.1.0`, 70 business + 6 identity, `/__mock/v1/logical/*` và identity mock | Đang dùng schema synthetic v1.1; không là production auth |
| User operational | 18 operations, nhãn `2.0.0`, **một** endpoint `/__mock/v2/operational` | Prototype riêng. Envelope, tên operation, fields và URL khác canonical v2; cùng nhãn không chứng minh tương thích |
| Admin | `adminGateway` trong bộ nhớ, strict metadata DTO, 5 methods | Bundle riêng, chưa HTTP admin API hoặc production authorization |
| Android | React wizard + `FinWeaveCollector` bridge interface | Chưa Kotlin collector, hàng đợi durable, signed APK hoặc evidence trên máy thật |
| API bàn giao đích | `docs/contracts/v2/openapi.json`, 133 operations, `/v2/operations/*`, `/v2/identity/*`, `/v2/admin/*`, internal paths | Hợp đồng đích, chưa được frontend hiện tại tuân thủ đầy đủ; adapter/backend cần triển khai |

[Consumer mapping](../contracts/v2/consumer-operation-mapping.csv) ghi các khác biệt cần chuyển đổi. Kiểm schema/examples và version label không thay thế kiểm quyền, atomic commit hoặc conformance. Ba operation `getState`, `registerExampleDevice`, `testCollector` chỉ phục vụ fixture/prototype.

# Integration Handover — frontend M2 synthetic

INT-HO-001 · v1.0 · 06/10/2026. Same `finweave-web` app, React/Router/Vite/TypeScript, tokens/components `/design` retained. Scope28REQ/AC, 5 primary nav, 16 business tabs +7 auth +/design, 13 modules/86 actions. Core synthetic contract **1.1.0**; operational prototype mang nhãn **2.0.0** nhưng **chưa canonical v2 conformance**, 70 business +6 identity operations/64 base schemas. Candidate protected transport **0.1** is separate and unverified. Backend developer can implement against logical contracts; **real-data integration is BLOCKED_SECURITY_POC** until trusted client/code/key/auth/recovery/Anti-Ops proof is verified.

## Chạy lại kiểm tra hiện hành, giữ nguyên evidence lịch sử

Từ `finweave-web`, với Node theo package engines trong PATH và Chrome đã cài:

```powershell
$env:FINWEAVE_REVIEW_RUN='rerun-20261008-1'
node scripts/check-frontend-review.cjs rerun-20261008-1
node node_modules/@playwright/test/cli.js test --config playwright.frontend-review.config.ts
```

Chọn tên run mới mỗi lần; JSON/HTML/trace/screenshot nằm trong `docs/execution/evidence/frontend-review-2026-10-08/<run>/`. Browser runner tự mở hai server kiểm thử 4184/4185, tách cache khỏi preview; không cần mở frontend thủ công. 0 retries, không exclude/skip các ca thất bại. `check-frontend-review.cjs` lưu typecheck, AST lint, unit, build user/admin và source/contract audit; không sinh lại schema.

Không dùng `run-contracts.cjs` hoặc `check-step6.cjs contracts` để kiểm canonical v2: generator cũ ghi lại v1. Không chạy các runner Step6 lên hồ sơ lịch sử. Tái lập kiểm canonical bàn giao theo [baseline policy](../handover/baseline-policy.md), ở evidence directory mới.

Auth walkthrough: **Điền thông tin mẫu → Đăng nhập demo → 123456**. Dữ liệu fixture, không gửi email/SMS, không provider thật. Reload financial Store về fixture; kết quả không chứng minh persistence.

## Boundaries and mapping

| Layer | Integration point | Responsibility |
|---|---|---|
| Components/features | src/components, features, app/context, chat-provider | Local filter/open/close/privacy/panel; forms through hooks; no fixture imports/directfetch |
| Queries/mutations | src/services/presentation.ts, contracts.ts | Single strict readonly presentation snapshot → selectors/cards/charts/details; named typed mutations; cancel query then refetch/invalidate |
| API | src/services/api.ts / logical transport | Strict core envelope **1.1.0**; operational prototype envelope riêng có nhãn **2.0.0**, khác canonical v2, requestId/workspaceVersion, Abort5s, no automatic retry/fallback |
| Contracts | src/contracts + docs/contracts/v1, v2 | DTOs, operations, schemas/OpenAPI/examples; source-to-target map; validation/date/money/error semantics |
| Mock only | src/mocks/browser.ts, handlers.ts, repository.ts | Lazy MSW worker, stateful atomic command handling, reset/jobs/AI/auth; replace adapter, never import mock into production UI |
| Protected candidate | src/services transport boundary + docs/security | Closed adapter refuses before network. No plaintext fallback; secure transport construction still blocked |

Money is integer VND decimal string, quantity/quote decimal strings, half-up per holding; display tabular numerals. Time is ISO offset +07 with date-only fields separately validated, periods half-open. Null/unknown carries reason, source and asOf; actual/planned/simulated/draft distinct. Read model version aligns cards/charts/table/detail. Pagination cursor binds filter and workspaceVersion (stale409); IDs opaque logical. Error includes code/message/retryable/fieldErrors/currentVersion/retryAfterSeconds; HTML500 remains server error, malformed success DTO becomes retryable502 and never enters cache.

Mutation: preview token + object/workspace expectedversion + idempotencykey; definitive4xx rejects before commit, refresh/repreview allowed. If response is lost/timeout/offline/5xx after commit is possible, **retain exact original request body/requestId/key/options** and retry that request; never recompute key from a newer snapshot. User sees unconfirmed outcome. Commit ACK alone is not projection: fetch latest presentation; replay older ACK must not replace a newer snapshot. After successful refetch release cached request. Concurrent submit latch and disabled preview inputs prevent inconsistent confirmation.

Import: rawCSV + mapping/profile/account → preview/errors/immutable staging token; select subset → confirm202 samekey → pending/running/completed job polling → atomic ledger events/refetch. Replay samejob no secondmoney; reject expired/mismatch/staleversion without partialcommit. Source revision preserves manual overrides, posts delta only. Raw/source evidence SHA/history defined in [source mapping](../contracts/source-to-target-mapping.csv).

AI M2 is scripted read-only. Capture nav/period/scope/filter/selectedrecord/snapshotVersion at send; result/evidence/history preserve that capture; navigation changes mark result stale. Server pending/result/cancel and cursor page10. Cancel failure retains pending and announces unconfirmed cancel; retry explicit. No real LLM key, database SQL or trading/write tool.

## Disable mock / protected work remaining

`.env.example` public enum `VITE_DATA_MODE=synthetic_mock`; absent selects explicit build default mock. To disable worker, set `VITE_DATA_MODE=protected` **before build**; startup fails closed and protected adapter throws beforefetch. This does not enable a real backend. There is no supported `VITE_API_URL` production switch. Do not swap plaintext `/__mock/...` for gateway endpoints and assume Anti-Ops compliance.

Implement secure adapter to the established LogicalTransport interface after independent trusted-client distribution, key/bootstrap authority, identity binding, encrypted authenticated envelope, attestation/recovery/revocation and gateway metadata minimization PoC. Current synthetic identity HTTP header and financial plaintext transport are test-only. Real cookies/CSRF/CORS/credentials/session/key lifetime must follow verified design; no secret in publicenv/bundle/localStorage. Preserve logical DTO validations inside trusted client, ciphertext-only gateway/Ops boundary. Protected negative tests prove **refusal**, not encryption/security readiness. [Security Design](../security/security-design.md), [ADR003](../architecture/adr/ADR-003-privacy-boundary.md) and [contracts](../contracts/README.md) record blockers; backend framework/physicalDB not chosen here.

Memory Store/importjobs/chat reset on reload to F-COMPLETE; fake auth marker may survive same-tab reload. Explicit Reset clears fixture/forms/filter/mask/chat/jobs; Logout clears session/cache/drafts. None demonstrates durable backend storage, backup, provider collection or data recovery. No backend fallback/demo success on real API failure. Final self-assessment and open limits: [Acceptance](frontend-acceptance-report.md).

## Hồ sơ Step6 lịch sử và quy trình hiện hành

Các script `verify-step6.cjs`, `check-step6.cjs` và cấu hình AI regression cũ được giữ để truy vết cách kiểm ngày 06/10. Chúng ghi vào tên evidence Step6 dùng chung và dựa trên inventory v1; không dùng chúng để chốt nghiệm thu UI v3 hoặc canonical API v2. Báo cáo 06/10 ghi PASS nhưng raw lần 08/10 trước rà soát có 24 PASS/35 FAIL, nên kết luận cũ đã được thay bằng báo cáo hiện hành.

Chạy lại bằng hai lệnh ở phần đầu với tên run mới. Suite hiện có 67 ca browser (59 kế thừa + 8 operational) và catalogue 50 screen IDs; số unit thực chạy nằm trong raw JSON của từng lượt. Bằng chứng mới giữ riêng JSON/HTML/trace/screenshot, baseline hash và source hash trước/sau. Không cộng các lượt regression vào số ca duy nhất, không dùng PASS của một subset thay toàn bộ suite.

MSW idle wake giữ cùng repository/session và dùng public worker lifecycle APIs; có deadline, không tự reset tài chính hoặc retry mutation. Core mapping 1.1.0 và operational prototype có nhãn 2.0.0 là hai hợp đồng khác nhau; cả hai chưa chứng minh canonical v2 conformance. Q&A kế thừa dùng công cụ đọc; luồng Agent mới tạo bản nháp và chỉ áp dụng Plan/Goal sau xác nhận của người dùng.

## ARCH-08 — Bàn giao Engine và forecast mới

Target hiện hành [API003](../contracts/v2-t1-r3/README.md)/[DB004](../data/target-t1-domain/README.md)/[Engine bundle](../domain/implementation-bundle.json). Old payload schemas600 giữ nguyên, exact revision header đổi và4forecast operations mới. Adapters source hiện tại chưa migrate, long-term forecast vẫn local synthetic. Backend không copy browser Store/Number thành ledger authority.

Trước tích hợp phải chạy production Engine vs independent vectors, PostgreSQL constraints/transactions/tenant grants, concurrency/faults và forecast worker/page/cancel/quality/performance cases. Frontend acceptance synthetic cũ không được nâng lên backend/native/security/UAT; không sửa source trong task này.

## ARCH-09 — Async integration handover

Target hiện hành API004 với CSV header selector fix/completeness flags/coverage paging; prototype vẫn hybrid và consumers chưa migrate. SQL005 design/bundle/registry cần backend implementation trước integration. Pending status/query không advance jobs; ACK/enqueue khác completion.32ASN cases và AUTH/SEC/DOM/native/provider gates chưa chạy.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Native2 mismatch requires adapter migration; production cannot use legacy mock/session headers. Compile/install/proof/Room/backup/D2D/upgrade/OEM/source/phone-web end-to-end cases32 NOT RUN; historical frontend synthetic acceptance unchanged.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Consumer source mapping exact API004/DB005 thêm schemas private metadata; runtime frontend hybrid cần adapter riêng. 32 source cases NOT RUN; không suy source support từ historical67browser/131unit.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Current target API005 exact+hash/native003, DB005 unchanged. Old source/async/security bundles bind via explicit inheritance (request/actor unchanged). Frontend prototype hybrid not migrated; five result.mode projections and counter bounds cần runtime tests.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Pin cùng source/artifact đã kiểm, API005/DB005/native003. Required gates ghi đúng trạng thái.32 ca vận hành chưa chạy; schema/policy examples không thay nghiệm thu release/restore/auth/CI.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
