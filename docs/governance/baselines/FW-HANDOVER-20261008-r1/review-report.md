# Review bàn giao FinWeave r1

Kết luận: **READY_LOCAL_SYNTHETIC_BASELINE** khi seal/verification trong [manifest](manifest.json) đạt. Có thể bàn giao artifact để xây backend local synthetic. Source hiện tại chưa có backend durable, collector Kotlin/APK hoặc provider/model thật; frontend còn mock và browser failures. Đây không phải nghiệm thu frontend, migration/security PASS hoặc production-ready.

## Source, version và authority

Package **FW-HANDOVER-20261008-r1**; ngày 08/10/2026, timezone Asia/Saigon. Observation đầu frontend `2026-10-08T07:35:47.8896229Z` (=14:35:47+07). Thời điểm source baseline/reconciliation/validation/seal lưu độc lập trong JSON. Chọn working tree đã review trên HEAD `fac053c5ccb7c7792feb5325409e68974b8aad84`, gồm toàn bộ modified/untracked/deleted trong [source-baseline](../../../execution/evidence/FW-HANDOVER-20261008-r1/source-baseline.json). Không reset/restore hoặc dùng archived originals làm implementation hiện hành.

SRS/BR/DR và AI-SPEC-001 là authority nghiệp vụ; canonical target API [OpenAPI v2](../../../contracts/v2/openapi.json) **2.0.0** là authority hợp đồng; frontend/admin/native là implementation quan sát. V1 **1.1.0** khác operational mock **2.0.0** và target **2.0.0** dù hai bản sau có cùng chuỗi version. Physical artifact **FW-PHYS-SYNTHETIC-001**, migrations **001/002/003** và SQL hỗ trợ đều có SHA trong manifest; migration execution NOT RUN.

245 tệp frontend/config/assets/build được so trong khoảng revision mới, Git status frontend và HEAD được kiểm lại. Source/config/lock/asset có manifest riêng; dist/dist-admin/tsbuildinfo phân loại output sinh, không làm authority. Snapshot ZIP loại cache/node_modules/secrets/build, giữ source đang chọn cùng tài liệu/evidence cần review. Deletion 5 tệp original tại root được ghi nhận, không phục hồi. Hash xác nhận bytes, không xác định tác nhân hoặc tính đúng runtime.

## Reconciliation chín đường dẫn cũ

Hash before/after **đầy đủ, giữ nguyên** ở [historical drift](../../../execution/evidence/handover-2026-10-08/frontend-observed-drift.json). [Reconciliation mới](../../../execution/evidence/FW-HANDOVER-20261008-r1/drift-reconciliation.json) thêm current SHA, phân loại, review diff và giới hạn chứng cứ. Old [preservation FAIL](../../../execution/evidence/handover-2026-10-08/frontend-preservation.json) và [overall pass=false](../../../execution/evidence/handover-2026-10-08/validation.json) giữ nguyên.

| Đường dẫn dưới finweave-web | Loại thay đổi / tác động | Xử lý |
| --- | --- | --- |
| src/components/ActionForm.tsx | Conditional validation, MoneyInput, planning preview/forecast/goal assessment; UI VND15 digits hẹp hơn target18 | Review current content, giữ nguyên source; ghi adapter/decimal/Engine gap. HEAD blob không trùng raw before, nên Git diff chỉ là context, không tự nhận exact historical diff |
| src/services/presentation.ts | Thêm simulatePlanningDraft dùng applyCommand cho local planning preview; giữ dynamic named commit và request replay | HEAD blob khớp historical-before; review diff có căn cứ bytes. Preview local synthetic khác target Engine, không endpoint mới |
| scripts/audit-step6.ts | Current SHA khác historical-after; missing originals vẫn unverified; current đã bỏ catalogue overwrite, vẫn ghi raw Step6 files | Tooling được review và giữ nguyên; không chạy. Không dùng matching manifest thay chứng minh original tồn tại |
| dist/assets/browser-BllVAMLy.js | Old bundle removed | Generated, không khôi phục hoặc làm authority |
| dist/assets/browser-DtvqgRaj.js | New bundle added | Generated; build provenance/equivalence chưa chứng minh |
| dist/assets/index-ewUqyVpM.js | Old bundle removed | Generated, giữ deletion |
| dist/assets/index-l3wT13XQ.js | New bundle added | Generated, không thay source validation |
| dist/index.html | Entry bundle reference đổi | Review loại artifact; hash trùng historical-after, không suy runtime accepted |
| tsconfig.tsbuildinfo | Incremental compiler state đổi | Generated cache/output, loại khỏi payload source |

Tám đường dẫn vẫn có state/hash bằng historical-after; audit-step6 có revision tiếp theo đã tồn tại khi quan sát task này. Không có unresolved business-purpose change cần quyết định để chọn source; **tác nhân của cả chín đường dẫn vẫn UNKNOWN**. Không chứng minh lại task cũ “không đổi frontend”; r1 là baseline mới sau review.

## Mâu thuẫn artifact đã sửa

[Canonical semantic diff](../../../execution/evidence/FW-HANDOVER-20261008-r1/canonical-semantic-diff.json) ghi metadata before/after cho từng operation. Sửa heuristic theo tên đã gán updateDraft/postDraft sang chat/planning, ingestion sang ledger nhưng thiếu receipt, confirmPlanningDraft thiếu tables active Plan–Goal/link, account/report thiếu scope, import thiếu staging/jobs, admin/internal gán cùng vài bảng ops. Dependency hiện dùng domain cụ thể và có scope “reads/writes, không phải grants”; infrastructure authorization/history/preview/replay áp dụng riêng. Phân biệt ingestNotifications commit receipt với processIngestionReceipt commit ledger; price worker không ghi cash/quantity.

Request/reply/error schemas, required/optional/null, enums, URLs và examples **không đổi**. API giữ2.0.0 theo [version policy](../../../handover/baseline-policy.md); package pin canonical SHA mới. Model/migrations cũng không đổi. Không dùng operation/table/column counts làm bằng chứng semantic alignment.

Một exception cần triển khai rõ: previewImport giữ wire query `mutation=null`, chỉ tạo bounded immutable TTL staging cache theo owner/workspace/file+mapping digest, không đổi financial version/ledger; confirmImport mới là durable keyed mutation. Không bắt adapter gửi mutation object vào schema query hoặc áp rule generic preview mù quáng. Các preview mutation khác giữ key/versions/token như canonical.

CSV mapping cũ chỉ kiểm declaration/literal calls và dùng câu gap chung; mapping mới có source path/symbol/version/transport/references/status/transformations. API/data mapping bỏ suy luận trực tiếp bằng tên leaf, thêm rules theo operation/path. [Storage mapping](../../../contracts/v2/storage-field-mapping.csv) xác định DIRECT/NORMALIZED/PROJECTION_ENGINE/COMMAND_PARAMETER/FROZEN_CONTEXT_RESULT; các leaf chưa có storage rule được giữ là command/projection, không invent column.

## Những transformations vẫn phải làm khi tích hợp

| Consumer | Quan sát và phần chuyển đổi bắt buộc |
| --- | --- |
| User v1 | typed Proxy bindServices, services[operation], commandOperation với switch/ternary/source lookup; giữ named business identity nhưng đổi envelope/version/error, owner/workspace refs và exact key/versions/token. Input schema giống nhau cũng chưa là direct wire compatibility |
| Operational mock | field diff từng operation: arrays→pages; timestamp/expiry/digest; single-goal→nonempty multi-goal/items/links; manual runId nullable; answerAgentRun body→answer text + Run continuation. ConfirmPlanningDraft vẫn Draft DTO nhưng body/refs/history cần adapt. getState không được advance durable jobs trên reads |
| Local preview | ActionForm gọi local simulatePlanningDraft và previewAction; forecast Number và UI15-digit limit không là decimal ledger authority. Backend Engine dùng exact decimal và independent oracle; không đổi frontend trong task này |
| Fixtures | getState là aggregate mock cần split reads; registerExampleDevice/testCollector/control/reset/fault/advance chỉ synthetic, không tạo production endpoints |
| Admin | Memory gateway→separate admin transport/cookie/MFA; signIn hiện không credentials; epoch expiry→RFC3339; free reasons→codes; canonical JSON digest; confirm extracts token/digest/ops version/key rồi refetch thay mock snapshot result. opsStatus aggregate metadata và opsList* pagination cùng tồn tại |
| Android | 7 FinWeaveCollector bridge methods + Back local capability; chưa Kotlin/Keystore/outbox/worker. OS settings không tự cấp quyền. Signed enrollment, immutable owner epoch, per-item durable ACK, quarantine và binding fence là PoC/runtime work |
| Scheduler/internal | dispatchJobs/processIngestionReceipt/executePriceRefresh/executeAgentStep/purgeExpiredData chỉ target declarations, implementation MISSING. Private service identity/purpose, lease/fence/attempt<=3; retention endpoint unavailable tới khi có narrow procedure |

[Consumer mapping](../../../contracts/v2/consumer-operation-mapping.csv), [AST inventory](../../../execution/evidence/FW-HANDOVER-20261008-r1/consumer-ast.json), [field diffs](../../../execution/evidence/FW-HANDOVER-20261008-r1/consumer-field-differences.json) là evidence chi tiết. Trạng thái là NEEDS_ADAPTER, SYNTHETIC_MOCK, LOCAL_NATIVE_CAPABILITY, RETIRED_REDIRECT hoặc MISSING; không suy declarations/reference thành runtime coverage. Một UI click không bị ép một endpoint; một DTO không bị ép một table.

## API–schema và invariants

VND string<=18 integer digits→numeric(18,0); quantity/price<=18+8→numeric(28,8), service giữ bound18 dù DB cho20 integer. Decimal arithmetic, gold luong×10 chi có provenance, USD chỉ quote+dated FX. Date calendar→date; instants offset→timestamptz; JSON version<=2^53−1→positive bigint persisted; expectedVersion0 là create sentinel, không row version0. IDs opaque text và composite workspace keys; catalogue global khác tenant records. Nullable cost/FX/context không default0; SQL JSONB chỉ outer type/size, service validate canonical schema_ref.

Posting/correction/transfer/refund: immutable posted event/group/lines, exact balanced reversal+replacement, transfer fees riêng; draft/pending không report tiền, refund origin/remaining check under lock. Zero opening không sinh zero-amount event. Price quote nằm riêng movement/cash; holdings quantity là dated movement/projection. Receipt unique workspace/device/eventKey/revision khác semantic dedupe, ACK durable khác posted. Generic idempotency scope principal/op/key, result90d/tombstone không recommit. Goal allocations chỉ existing eligible cash; cross-goal funded prorata/remainder, actual posting không bị chặn chỉ vì allocation. Draft confirm phải lock/validate rồi commit plans+goals+links+history+preview-consumption+workspace version+result atomic, không actual posting.

Các invariant trên được review từ SRS/BR/semantics/model/SQL; SQL checks chưa chứng minh service locks, domain oracle hoặc authorization. Frozen snapshot/context/results giữ lịch sử và refs; precision overflow hoặc missing dữ liệu phải có explicit bounded error/unknown handling theo schema, không cắt số hay tự làm zero. Retention worker/procedure còn thiếu; protected storage candidate tách DB/profile và SEC-REAL vẫn blocked.

## Kiểm tra và giới hạn

[Artifact validation](../../../execution/evidence/FW-HANDOVER-20261008-r1/validation.json) kiểm OpenAPI/JSONSchema/refs/examples/negative fixtures, declarations/calls/mapping, canonical-data dependency và storage rules, outer SQL parse, model tables/columns,41 AC/environment/links/admin boundary. [Extended validation](../../../execution/evidence/FW-HANDOVER-20261008-r1/alignment-validation.json) kiểm parsed column types/precision/null/default/check/FK/table constraints/index, isolated regenerate physical derivatives, schemas exact, dynamic adapters, dependency versions, canonical wire diff, migration checksums và preservation/history.

Đọc machine-readable results để biết counts và mọi lỗi; không che FAIL bằng bỏ check. Validation tools đã review: observer/contracts examples không chạy services; physical generator chỉ chạy vào thư mục tạm; legacy audit/generators không chạy. Python validation deps pinned jsonschema4.26.0/openapi-spec-validator0.7.2/pglast7.10, không đổi frontend dependencies/lockfile.

Raw Step6 hiện có 130 unit pass và browser24 pass/35 fail khi đọc; các tổng kết99/55 trong hồ sơ cũ là observations lịch sử khác. R1 không chạy lại hoặc ghi đè các raw files, không gắn results đó với source hash r1. UI report hiện cũng có câu99 stale; cần xử lý trong task nghiệm thu frontend riêng. SQL execution/PLpgSQL compile/domain correctness/auth/security PoC/frontend acceptance/native device tests **NOT RUN** trong task này.

## Backend local tiếp theo

1. Dùng source/API/schema SHA trong manifest để khởi tạo implementation synthetic; giữ contract fixtures làm structural checks và viết independent domain oracles.
2. Chạy SQL preflight→001/002/003→roles→synthetic seed→postflight/negative fixtures trên disposable PostgreSQL; lưu logs/checksum journal, compile PLpgSQL/RLS/constraints, không dựa pglast PASS.
3. Implement sessions/workspace/object/device authorization; transaction posting/reversal/refund/Goal/draft bundle, exact replay/lost ACK/concurrency, receipt/job/run workers và restore/retention tests.
4. Qua backend gates rồi làm user/admin adapters theo field diffs; sửa frontend regression/browser failures trong task riêng. Native enrollment/outbox/device matrix PoC sau đó; source entitlement/security/provider gates riêng, synthetic/spend0 tới khi được duyệt.
