> Hiện hành 08/10/2026: UI operational/user/admin đã có prototype; phần mô tả bước5 bên dưới là lịch sử core mock. Xem [nghiệm thu mới](../testing/frontend-acceptance-report.md) và [catalogue](../design/interface-catalogue.md). Chưa migrate canonical v2, native/backend/security chưa nghiệm thu.

## Runtime và phiên bản API — hiệu chỉnh 08/10/2026

| Phần chạy hiện tại | Hợp đồng/transport thực tế | Kết luận |
|---|---|---|
| User core + identity | `1.1.0`, 70 business + 6 identity, `/__mock/v1/logical/*` và identity mock | Đang dùng schema synthetic v1.1; không là production auth |
| User operational | 18 operations, nhãn `2.0.0`, **một** endpoint `/__mock/v2/operational` | Prototype riêng. Envelope, tên operation, fields và URL khác canonical v2; cùng nhãn không chứng minh tương thích |
| Admin | `adminGateway` trong bộ nhớ, strict metadata DTO, 5 methods | Bundle riêng, chưa HTTP admin API hoặc production authorization |
| Android | React wizard + `FinWeaveCollector` bridge interface | Chưa Kotlin collector, hàng đợi durable, signed APK hoặc evidence trên máy thật |
| API bàn giao đích | `docs/contracts/v2/openapi.json`, 133 operations, `/v2/operations/*`, `/v2/identity/*`, `/v2/admin/*`, internal paths | Hợp đồng đích, chưa được frontend hiện tại tuân thủ đầy đủ; adapter/backend cần triển khai |

[Consumer mapping](../contracts/v2/consumer-operation-mapping.csv) ghi các khác biệt cần chuyển đổi. Kiểm schema/examples và version label không thay thế kiểm quyền, atomic commit hoặc conformance. Ba operation `getState`, `registerExampleDevice`, `testCollector` chỉ phục vụ fixture/prototype.

# Mock Implementation — bước 5

IMP-MOCK-001 · v0.2 · 06/10/2026. Source: finweave-web/src/mocks/{browser,handlers,repository,projections,command-mapping,scripted-assistant}.ts. Contract 1.1.0, 70 business + 6 identity operations. Mock-only financial fixtures/domain commands không được import vào production features; startup chọn mock rõ ràng, không fallback khi API lỗi.

## State, lifecycle và request

Repository giữ accounts/events/holdings/sources/Review/Plan/goals/simulations/imports/audit, versions, preview tokens, idempotency replies, cursors, jobs, conversations/messages và captured AI snapshots. Financial mutations serialize. Clone/validate/commit cùng engine M1; rollback Store, versions và resource maps khi output không đúng schema. Report/card/chart/table/detail đọc một snapshot version. Query list có cursor opaque, stable sort và signature filter/pageSize/version; cursor cũ trả409. Một owner demo W-DEMO: thiếu/hết session401, workspace khác403, object không có404; không tự đổi thành fixture.

POST /__mock/v1/logical/{operation}; envelope contractVersion/requestId/workspaceId/operationId/input/mutation; query mutation=null. Mutation options expectedWorkspaceVersion, expectedObjectVersions, idempotencyKey, previewToken. Header X-FinWeave-Synthetic:true và opaque mock session bắt buộc. Response DTO validate hai phía. Mô phỏng network latency80ms; client deadline5s, abort linked query cancellation. Các lỗi 422 validation,409 version/preview/idempotency/cursor,429 quota+Retry-After30,503 offline/timeout giữ input. Không secret/provider call.

## Preview và retry

Financial preview không thay ledger; bind owner/payload/version/object versions,10phút. Confirm đổi input/version/owner hoặc hết TTL bị reject và cần re-preview. Lặp đúng key/payload trả acknowledgement replayed; cùng key khác payload conflict. Financial ack không chứa Store cũ. Sau mutation invalidate các queries fw và refetch read snapshot. Submit latch ở form/provider và auth/chat giữ key cho cùng request đang retry; không replay tự động mutation chưa rõ kết quả.

CSV UTF-8≤64KB,≤20rows, VND nguyên, ISO/dd-MM profile dd/MM/yyyy và signed integer hoặc debit/credit theo mapping. Digest file/mapping SHA256, stable row IDs, raw evidence giữ nguyên. Preview staging không publish Review/job/event. Confirm selected valid row IDs tạo202 job pending, poll→running→completed; failure/version conflict trong lúc chạy không ghi subset. Job commit tạo valid selected events cùng các invalid/duplicate Review, nguồn/raw/normalized rõ. Retry cùng request/key trả cùng job; failed job giữ input để preview mới sau recovery. Retry batch đã hoàn thành không thêm tiền. Job list có loading/error/empty/progress và manual refetch.

AI là scripted read-only tools trong server mock; capture context/period/scope/route/selected object/workspace-source-event-plan-goal versions trước gửi. Processing650ms; poll / getAssistantMessage; cancel terminal không nhận phản hồi muộn. Tools chỉ đọc captured snapshot; SQL/write/foreign workspace/provider/secret prompts bị TOOL_NOT_ALLOWED, không thực thi source text. History resource và panel dùng cùng provider/conversation. Card giữ source/time/evidence và actual/planned/simulated/unknown cho từng metric. Đổi context/version báo kết quả cũ. No-data/tool/timeout/offline/quota có lỗi, không tạo câu trả lời giả.

History dùng infinite queries listConversations/listMessages, pageSize 10, cursor và nút Tải thêm; không cắt ở 100 tin. Sau gửi, tải thêm đến trang chứa phản hồi mới; poll khi có processing. Context giữ URL filter, tab transaction, search, kỳ/scope/selected; server chỉ đọc bản ghi phù hợp. Đổi filter/tab đánh dấu kết quả trước là context cũ. N06/N07 và unit selected/search kiểm điều này. Browser worker và Node HTTP tests dùng chung createHandlers.

## Scenarios và reset

Thiết lập & demo chọn F-BASE, F-COMPLETE, F-EMPTY, F-MISSING, F-STALE, F-TRANSFER, F-PENDING; fault none/offline/timeout/conflict/tool/quota; clock 30/11; nguồn fail/revoked. Control endpoint riêng, owner synthetic; không business API cho dữ liệu thật. Reset increments generation/version, xóa jobs/keys/previews/cursors/chat/goals/plans/scenarios/filter/mask/drafts, refetch mới. Reload nạp F-COMPLETE và giữ marker auth synthetic còn hạn trong tab; dữ liệu tài chính không persist. Logout xóa tab marker/cache/drafts và session server mock; network signout lỗi vẫn xóa local, không tuyên bố revoke real session.

## Kiểm chứng và giới hạn

[Validation report](../execution/evidence/step5-validation-report.md), [unit JSON](../execution/evidence/step5-unit-results.json), [browser JSON](../execution/evidence/step5-browser-results.json), [catalogue](../execution/evidence/step5-action-coverage.md). Unit repo tests kiểm DTO thực/mutation/preview/version/atomic/ownership/pagination; job/AI tests kiểm async, signed CSV, digest, cancellation, frozen snapshot. Browser tự walkthrough đủ scope, auth, lỗi/retry/submits/chart/privacy/bàn phím/ba viewports. Không là nghiên cứu với người tham gia, user research0; gate M2 chính thức bước6 chưa thực hiện. Không xử lý tài chính thật hay đạt security gate.

## Step6 lifecycle/error hardening

API reject corrupted metadata/schema as502; HTML500 remainsservererror; nofallback. On lostACK presentation replays exactsavedrequest across newer snapshots. Synthetic-only lifecycle injectedatbootstrap, servicesnoimportmocks: afteridlegap>20s MSW publicstop/start re-enables interception while same repository/auth/ledger/jobs/chat remainsmemory; concurrentwake sharespromise, deadline1.5s. No automaticmutationretry and no implicit reset. Idlebrowsercase21s proves ledger31.05→31.03m across wake withoutreload. ObservedIAB idlelossofinterception is consistentwith workertermination, but no OS-levelcause measurement; [officialMSWstop](https://mswjs.io/api/setup-worker/stop) and [browserstart](https://mswjs.io/guides/integrations/browser) +pinned3.0.2 declarations/source informedfix. Allsourceinputs/lock unchanged,0realdata.
