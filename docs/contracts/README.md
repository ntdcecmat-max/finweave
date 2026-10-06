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
