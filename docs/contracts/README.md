> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](../product/screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 current target08/10/2026:** [identity protocol](../security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](../contracts/v2-t1-r2/README.md), [auth DB expand](../data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> **Retained revision08/10/2026 — ARCH-05:** [API T1/D1/J2 revision FW-API-T1-D1J2-001](v2-t1/README.md), [OpenAPI](v2-t1/openapi.json), [revision/hash](v2-t1/revision.json).141 operations; exact revision/hash pin vì payload 2.0.0 pre-release khôngcompatible chỉ từnhãn. `v2/` làimmutablehandoverbaseline thamchiếu; khôngregenerate nóđểchechange. v1/frontendmock dướiđây làhistory/observedimplementation, khôngtargetproduction. Backend/consumer/native/auth/security NOT RUN.

# Contracts — điểm vào hiện hành

08/10/2026. [Bộ API v2 thống nhất](v2/README.md) và [openapi.json](v2/openapi.json) là nguồn chuẩn **đích bàn giao**, chưa là backend triển khai. [Operational API](operational-api-spec.md) nối inventory, examples, schema, quyền và migration.

Phần dưới là baseline mock1.1.0 lịch sử, còn đúng cho implementation v1 trong frontend; các chữ “hiện hành”/“current” trong phần này chỉ nói Step6 ngày06/10, không ghi đè v2 bàn giao hoặc UI implementation08/10. Không regenerate v1 trong lượt này. [Nguồn trước bàn giao](../governance/baselines/handover-before-2026-10-08/docs/contracts/README.md).

---

> Baseline v3 — 07/10/2026: phần dưới mô tả thiết kế/triển khai mock lịch sử. Phạm vi hiện hành theo [PRD](../product/prd.md), [SRS](../requirements/srs.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md) và [audit](../execution/product-realignment-audit.md). Chưa migrate runtime/schema; không dùng evidence cũ làm PASS cho Android/backend/Agent thật.

# FinWeave — Contract package1.1.0 / bước6

ARC-API-001 · 06/10/2026 · logical/synthetic contract. 70 business operations+6identity;64named base schemas, generated OpenAPI3.1.1 và JSONSchema2020-12 cùng examples. Schema source Zod/operations/identity/presentation; generated v1 directory chứa exact1.1.0. Baseline1.0.0 được giữ trong governance/baselines/contracts-step4-v1.

MSW network có stateful handlers chạy trong frontend local; không backend thật. HttpSyntheticTransport validate DTO; requests version/owner/idempotency/preview, raw file mappings/job, planned/actual/goal/simulation/AI context/history đều xử lý. [Implementation](../frontend/mock-implementation.md), [ADR004 migration/read model](../architecture/adr/ADR-004-stateful-mock-and-read-model.md), [current catalogue](../execution/evidence/step6-action-coverage.md). UI read model aggregate và local selectors dùng một version cho cards/charts/detail; resources cũng có typed query handlers/tests.

Exact version không negotiate/fallback reader1.0: Session response bổ sung sessionId là identity client migration chưa công bố, không backward-compatibility claim. Real contract release cần major/migration review; mọi financial logical payload đều synthetic JSON ở /__mock/v1. ProtectedEnvelope chỉ là adapter boundary, không cryptographic wire format đã kiểm chứng. Mode thật fail-closed; [SecurityDesign](../security/security-design.md), ADR003/004 ghi PoC blocked.

Generate/check: trong finweave-web chạy node scripts/check-step6.cjs contracts. Named services và query/mutationOptions giữ requestId/workspaceId/signal cùng mutation versions/token/key. Source-to-target/File/Event/Error/Auth/Idempotency models bước4 vẫn áp dụng; phần lifecycle thực thi được chi tiết trong Mock Implementation.

## Money, unit, time và null

Ledger money VND nguyên đồng dạng string chuẩn không dấu+, exponent, leading zero, phân cách hay float; signed Money cho flow/variance, Amount>0 cho event/plan/allocation; OpeningAmount≥0 cho opening/count/cost. Precision technical bound18 integer digits; quantity/price/FX≤8 decimals để giới hạn payload, đây là quyết định kỹ thuật cho mock M2, không cam kết hỗ trợ thị trường ngoài scope. Decimal10.6.0 tính nội bộ; round-half-up 1VND từng holding theo BR-02, không làm tròn từng intermediate conversion. Number chỉ ở chart display boundary.

Canonical stock share, gold chỉ; nhập lượng đổi×10 chỉ có evidence original unit. USD chỉ là giá quốc tế/FX, không mở USD account hay multi-currency ledger. Price>0 và FX>0 nếu có; gold product/purity/market/compatibility giữ riêng; quote không phù hợp không định giá. Missing price/FX không là0. Quantity0 đã khai báo hợp lệ; chưa có lượng là thiếu/unknown ngoài quantity có giá trị.

DateOnly `YYYY-MM-DD` là business date, không gán giờ UTC giả. Timestamp RFC3339 có offset, UI+07; timezone chuẩn `Asia/Ho_Chi_Minh`. Kỳ `[start,endExclusive)`, balance as-of khác activity kỳ; custom UI inclusive last day đổi sang next date. Dates calendar và start<end kiểm ở boundary. `null` bắt buộc cho trường optional được khai báo; thiếu field là schema error. Metric null phải có missingReason, classification unknown; zero vẫn Money0 với reason null. Stale có giá trị và quality stale, không đổi thành unknown/zero. SnapshotRefs/version/source/time luôn đi cùng số.

## Query, pagination, filtering

Mặc định pageSize25, range1–100; cursor opaque do trusted service tạo/ký hoặc seal, bind owner/workspace/filter/sort/snapshotVersion/expiry. Không base64 plaintext filter ở gateway. Sort `date_desc_id`/`date_asc_id` stable date+id; totalCount null nghĩa chưa tính,0 nghĩa biết không hàng. Thay filter/snapshot phải reset cursor; CURSOR_INVALID yêu cầu tải page1. Pages không dùng để tính tổng/report; protected Engine tính toàn scope một snapshot. Source/Review/Goal collections dùng page25; Goal funded theo full business clock/accounts, không scope report. Snapshot version requested null lấy latest; requested immutable snapshot unavailable trả409 hoặc metric OUTSIDE_SNAPSHOT theo loại, không lấy quote tương lai.

Filter controls là local drafts. Apply/URL navigation có thể kích hoạt query khi key đổi; không ép select/open panel/button Back gọi mutation. URL hiện M1 giữ category/search; real mode phải giữ private search/filter trong client state/sealed body, URL chỉ allowlist period presets và opaque selection khi leakage được review. Privacy masking local renderer, không encryption hay revoke authorization.

## Mutation, preview, concurrency và idempotency

Owner session/device authorized trước mọi read/write; workspaceId là selector. Mutation có idempotencyKey, expectedWorkspaceVersion, expectedObjectVersions và previewToken nullable. Operation metadata chỉ rõ preview required; financial forms/Review/plans/goals/simulation có generic preview; import dùng riêng ImportPreview, không generic preview. source refresh/connect và chat không financial confirmation preview. Cancel form local không gọi API/ghi audit financial.

Generic preview bind operation+normalized payload digest+workspace+owner+object/workspace versions, TTL10min mock; before/after từ clone cùng versions; không commit. Confirm kiểm lại quyền, expiry/digest/versions và business rules bên trong cùng atomic transaction. VượtTTL→PREVIEW_EXPIRED; sửa input→re-preview/new key; source snapshot đổi→409 giữ input rồi refetch/re-preview, không tự retry mutation với version mới. Schema tokens opaque; production TTL/persistence/crypto chưa selected.

Idempotency scope `(authorized workspace,operation,key)` với normalized semantic payload digest, lưu result ID/version atomically cùng commit. Same payload retry trả cùng acknowledgement/result IDs không commit thêm; khác payload409 IDEMPOTENCY_CONFLICT. Key randomUUID sau input/preview mới; giữ key qua timeout/offline/429/503. Không gồm requestId/network timestamp trong digest; include payload/expected versions/preview binding. Canonicalization thực phải theo thư viện chuẩn và test vectors ([RFC8785](https://www.rfc-editor.org/rfc/rfc8785)); fixture structural equality chỉ là mock, không digest mật mã. Entry effects+audit+idempotency+job completion all-or-none. M2 session in-memory tới reset; retention/expiry real keys còn phải chốt, không tự xóa evidence/replay record sớm.

Reply chỉ acknowledgement và affected IDs/version, không trả Store cũ để replay đè cache. UI invalidate các keys ghi trong operation metadata, refetch affected snapshot; chặn incoming workspaceVersion<cache version. Preview/completion nêu actual/planned/simulated; simulate lưu scenario, không actual ledger. Import accepted202 chưa invalidation finance; khi job completed mới invalidate financial keys.

## Error/auth

[Error/Auth/Idempotency model](error-auth-idempotency.md) quy định HTTP/logical codes và xử lý UI. HTTP401/403/404/409/422/429/503 áp dụng mock route. Trong real mode authorized errors bên trong ciphertext; outer errors chỉ generic channel reject/availability với opaque request correlation, không leak object tồn tại. network offline/timeout/cancel có status0 local, không HTTP0 trên wire. Auth/session expiry/recovery đã implement synthetic qua network; real auth/provider secrets chưa implement. Không biến fixture credential thành real auth.

Static protocol fixtures kiểm schema/status/version nhưng không thay hành vi. Stateful MockRepository/MSW đã implement bước5 và kiểm lại bước6: preview TTL/binding, atomic ledger/job, ownership, idempotency, HTTP errors. Behavioral assertions dùng oracle tài chính độc lập; [Contract Results](../testing/contract-test-results.md), [Acceptance](../testing/frontend-acceptance-report.md).

## Identity/bootstrap contract và thực thi auth mock

User bổ sung auth screens. `identity.openapi.json`/`identity-examples.json`/`identity-scenarios.json` exact1.1.0 có6operations pre-auth/signout; `IdentityServices` trong src/contracts/identity.ts. Pre-auth không giảworkspaceId chứng minhowner: authenticate/register/challenge/recovery trước membership. IdentityError có INVALID_CREDENTIALS, EMAIL_INVALID/EXISTS, PASSWORD_POLICY/MISMATCH, CHALLENGE_INVALID/EXPIRED, RESET_INVALID, UNAUTHENTICATED, RATE_LIMITED, TIMEOUT/OFFLINE/UNAVAILABLE và closed-securityerror. Inputs password/token/code là logicalprivate; realbootstrap/sealedtransport/authorityindependentOps vẫnblocked.

UI auth hiện gọi6identity operations qua HTTP/MSW. .test credential memory only, challenge123456 single-use/5min, tab marker30min chứa opaque synthetic sessionId/profile, không password/key. Register/reset/signin cùng memory identity; reload seed reset dummy credentials/financialfixture, marker có thể còn nếu hợp lệ. Logout/expiry clear marker/cache/chat/forms. Không email/SMS/provider thật; real identity/bootstrap/transport vẫn blocked.

Bước6 API rejects malformed envelope/DTO với502, HTML500 giữ server classification; mutation unknown ACK giữ immutable originalrequest/key đến successrefetch. Local synthetic lifecycle wake sau idle dùng MSW publicstop/start, không reset repository hoặc tự retry mutation. [Handover](../testing/integration-handover.md) ghi rõ cách tắt mock và phần real integration cònblocked.

## ARCH-10 — Android implementation handover

API004153operations634schemas unchanged. FW-NATIVE-BRIDGE-002 separate internal protocol; seven legacy methods need explicit adapter, native auth reply secrets never forwarded generically to JS.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

API004153operations634schemas giữ nguyên; upstream SSI V3 không đổi FinWeave API v2.0.0. DB wallet→wire legacy bank grouping. Unbound no receipt; extra lifecycle/public subtype cần revision trước implementation.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

API005153operations634schemas supersedes unreleased004; five Assistant result.mode consts mở enum4 và Agent counters0..8. Request/routes/actors unchanged. Native003 exact005; các gói004 vẫn historical immutable.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

API005 vẫn153 operations/634 schemas, native003 giữ nguyên. Runbooks không thêm public API. Release kiểm serializers, installed clients, payload/job policies; không dùng hybrid fallback production.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
