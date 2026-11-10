> **03/11/2026:** [báo cáo hiện hành](../execution/completion-2026-11-03.md) bổ sung 14 integration web/HTTP/PostgreSQL và sáu luồng Android native trên giả lập. Các bằng chứng tháng 10 dưới đây giữ nguyên phạm vi lịch sử. Chưa nghiệm thu điện thoại và nguồn tài chính thật.

# BE-19 — tích hợp API005/native003

12/10/2026 · **User web và admin: local integration đã kiểm; Android: adapter/build/JVM đã kiểm, device E2E chưa chạy.** Người dùng xác nhận không có thiết bị Android. Vì vậy chưa nghiệm thu cả ba clients end-to-end hoặc đóng toàn bộ BE-19/41 AC.

Đây là HTTP/Fastify/PostgreSQL thật với dữ liệu **synthetic-local**; không phải provider ngân hàng/market/model production. REAL gates hiện có được giữ nguyên. Catalogue giữ 50 screen IDs và các features/thiết kế trước đó. Trạng thái mock trong catalogue là evidence lịch sử; trường `integration` riêng dẫn đến báo cáo này, không tự nâng mọi màn thành PASS.

## Revision và bằng chứng

API header `FW-API-T1-D1J2-005`, body `2.0.0`, native `FW-NATIVE-BRIDGE-003`. File canonical [API005](../contracts/v2-t1-r5/openapi.json) giữ SHA256 `35ebbbabd8d6dbc6f19cc9a123c2c6c2df3e1d0a3046c16d795adc9ed8b81802`. Runtime extensions `FW-BUSINESS-001`, `FW-ASSISTANT-002`, `FW-OPS-001` được ghi riêng; không gọi prototype v1.1 là canonical v2.

[Evidence index](be19-evidence-index.json) liên kết từng manifest, source/backend hash và loại transport. Build/JVM/mock regression dùng source digest `42df01251e391010f1d9c6c2f103628d644de6d327aedb8fb814fe38c54f8944`; integration 13 ca và typecheck mới dùng `b2d8fa27202dce16684e3e36d6d5db6da5951a8c6ff0bf9e6b718a8899c5d9ec`. Khác biệt duy nhất trong source set là file test integration bổ sung loading/error và assertion UI client thứ hai; runtime source giống nhau, digest riêng trong index. Backend subset digest giữ `5c5137fe66bf31c60ddecf5113ef95febf619ad61342571e7c395ac0e543a69f`. Working tree có thay đổi chưa commit; Git HEAD `fac053c` không đại diện riêng cho implementation này. Manifest lưu SHA256 từng file, config, lockfile, contract và build artifacts.

| Kiểm chứng | Kết quả | Evidence trên source nêu trên |
|---|---|---|
| TypeScript + build user/admin backend mode | PASS | [manifest](../execution/evidence/be19/build-1791817266988/manifest.json) |
| Genuine HTTP/PostgreSQL browser integration | 13/13 PASS, 0 skipped/flaky | [results](../execution/evidence/be19/integration-1791822427706/integration-results.json), [manifest](../execution/evidence/be19/integration-1791822427706/manifest.json) |
| Unit regression, gồm decimal/time formatting | 140/140 PASS | [results](../execution/evidence/be19/unit-1791817284122/mock-unit-results.json), [manifest](../execution/evidence/be19/unit-1791817284122/manifest.json) |
| Static browser regression user/admin synthetic mock | 67/67 PASS, 0 skipped/flaky | [results](../execution/evidence/be19/mockbrowser-1791817327854/mock-browser-results.json), [manifest](../execution/evidence/be19/mockbrowser-1791817327854/manifest.json) |
| Hai bundles explicit synthetic mock | PASS | [manifest và artifact hashes](../execution/evidence/be19/mockbuild-1791817324495/manifest.json) |
| Android debug build + JVM | PASS; 44 JVM tests, trong đó 5 ApiSchema tests | [native result](../execution/evidence/be19/android-1791817279713/native-result.json), [XML](../execution/evidence/be19/android-1791817279713/jvm-tests/), [manifest](../execution/evidence/be19/android-1791817279713/manifest.json) |
| Android Keystore/device E2E | **NOT RUN — user confirmed no device** | Không dùng build/JVM hoặc evidence pilot cũ thay kết quả run này |
| Backend Ops PostgreSQL/roles/concurrency | 9 groups PASS, revision riêng trong raw evidence | [raw](../execution/evidence/backend-ops-local-2026-10-11/ops-1791815763972.json) |
| TypeScript sau bổ sung test | PASS | [manifest](../execution/evidence/be19/typecheck-1791822670607/manifest.json) |
| Backend TypeScript, pin/mapping checker, frontend AST lint | PASS | [config manifest](../execution/evidence/be19/final-config-1791821525946/config-manifest.json), [lint](../execution/evidence/be19/final-config-1791821525946/lint-results.json) |

Gradle có thể reuse task outputs theo inputs; XML giữ timestamp gốc. Debug APK [finweave-be19-local-debug.apk](../../artifacts/android/be19/finweave-be19-local-debug.apk) SHA256 `ecbe139c16113eaa211212ea1c69b5fe81a18c19682362bd72f4c467ec5bcc8a`, Android debug signing, không thay pilot/release APK và chưa cài thiết bị.

Các run thử trước vẫn giữ nguyên: lỗi setup PostgreSQL timeout, dev browser failures khi HMR/build thay source, và `SOURCE_DRIFT` của run mock khi source còn thay đổi. Không chuyển chúng thành PASS. Các manifests được chọn trong index là evidence hiện hành; mỗi run giữ chính xác revision đã kiểm. Mock browser PASS chứng minh regression synthetic; nó không chứng minh backend integration của từng màn.

## Thay đổi tích hợp

- Environment chọn transport rõ ràng: production user/admin `backend`; `synthetic_mock` chỉ khi chọn explicit. Backend mode bỏ mock service worker cũ, không fallback sang fixtures khi HTTP lỗi. User `/v2` proxy vào 4310, Ops vào 4311; chỉ local frontend origins đã biết được chuyển sang private API origin, foreign origin bị deny.
- Web dùng cookie/CSRF, admin dùng password/MFA và Ops metadata-only. Native dùng `FinWeaveOwner` Kotlin broker: endpoint BuildConfig, installation proof P256, owner credentials trong native vault, collector credential scope riêng. JS không nhận owner/collector/reset tokens, không có generic signing endpoint. Capabilities/schema pin API005/native003 và operation allowlist kiểm trước gửi.
- Request/reply/error được validate cả envelope và fields; không coercion, strip unknown fields hoặc default fabricated values. Decimal wire giữ string, integer display dùng BigInt; test đọc/hiển thị `9007199254740993`. Null timestamp/metric/schedule giữ null. UTC businessClock chỉ chuyển presentation sang +07 tại cùng instant; schema wire giữ nguyên.
- Paging đọc hết opaque cursor và từ chối cursor lặp/snapshot đổi. Workspace/object versions đọc từ genuine snapshot; preview token/digest, adapted input và versions được giữ đến confirm. CSV confirm giữ account version lúc preview. Unlink plan dùng genuine link ID/version. Replay dùng đúng key/payload ban đầu; server frozen reply được giữ nguyên, không tự sửa `replayed`.
- Operational state được tổng hợp từ genuine paged devices/bindings/receipts/jobs/conversations/runs/drafts. Không gọi runs/drafts bằng conversation giả. Plan-only draft giữ `goal=null`; edit/preview/confirm vẫn có đầy đủ plan items. MODEL_UNAVAILABLE là lỗi thật khi model gate đóng.
- Logout/workspace change abort pending requests và fence late replies; private preview/import/draft caches được xóa. Session restore kiểm getSession và session ID trước render protected UI. Local logout thành công không đồng nghĩa server revoke đã xác nhận; lỗi revoke được hiển thị. Cancel Assistant đã completed đọc lại kết quả thật, không báo cancelled giả.
- `getSyncState` backend đọc owned workspace/device/source metadata và recovery epoch thật. `coverageComplete=false`, `lastAck=null` phản ánh chưa có đủ native ACK telemetry; không dựng ACK/epoch mặc định để enrollment qua gate.

## Consumer mapping và RTM

[Consumer mapping](be19-consumer-mapping.json) được sinh từ effective runtime contract và catalogue: 162 operation entries, 150 registered user/Ops operations. Đây là inventory implementation, không phải 150 operations đã chạy E2E. Map ghi route/request/reply/profile, runtime extensions, consumer actions, derived operations và unimplemented entries. Các schema/native assets được sinh từ cùng contract và kiểm bằng `verify:be19`.

[Screen RTM](be19-rtm.csv) giữ đầy đủ 50 screens, source, parent AC, surface và transport; [scenario RTM](be19-scenario-rtm.csv) chỉ rõ evidence runtime/mocked/native-not-run. Catalogue TypeScript có integration metadata riêng; bản consumer map API004/bridge002 trong hồ sơ Android cũ là lịch sử, asset generated005/003 mới là pin của APK này.

13 integration cases trong [source](../../finweave-web/tests/be19.integration.test.ts) bao phủ:

1. Register/OTP từ private local mail sink, createWorkspace và empty UI.
2. Trì hoãn snapshot HTTP thật để kiểm loading; connection-refused fault để kiểm error rồi UI Thử lại đọc backend thành công. Không fixture response body.
3. Financial preview/commit, decimal lớn, exact replay không duplicate và UI readback.
4. Hai browser consumers cùng session được server verify; UI client thứ hai tự polling nhận account mới, opaque paging và stale preview denial.
5. Plan/Goal commits, funded value từ backend, không bịa actual funds.
6. Operational metadata/catalog paging/null timestamps/getSyncState và sáu user routes.
7. Frontend command adapter commit dùng backend object versions.
8. CSV worker/receipt persisted, confirm replay cùng job.
9. Assistant persisted grounded result; completed-before-cancel trả refusal thật.
10. Plan-only draft goal null, edit/preview/confirm qua UI.
11. Offline, AbortSignal, response HTTP thật bị trì hoãn sau fence và bị loại.
12. Foreign origin403, workspace ownership denial, signOut và getSession bị revoke.
13. Admin password/MFA, bảy routes, user-role denial và logout.

Loading/auth restore guards, empty/error/stale/denied/offline và duplicate locks đã có trong adapters/UI; test trên là kiểm các luồng tiêu biểu, không exhaustive từng state của 50 screens. Cross-client sync đã chạy trên hai browser consumers; **web↔Android và Android↔admin chưa chạy**. Native logout/revoke/enrollment/collector queue/Keystore, OEM notification, reboot/offline retry và fresh reauthentication/recovery acceptance chưa được chứng minh bằng device run. Managed native recovery/fresh-reauth flows chưa được expose đầy đủ; không đánh dấu toàn bộ native003 acceptance PASS.

Ba action kế thừa `refreshSource`, `ingestSourceEvidence`, `reviseSourceRecord` là prototype synthetic controls, không có real implementation trong mapping. Demo fault/reset/revoke controls và `registerExampleDevice`/`testCollector` giữ trong synthetic profile; backend mode trả explicit unsupported/synthetic-only, không gửi DEMO fields sang backend. Financial/manual/CSV, genuine source binding và price refresh paths vẫn được giữ. Daily price schedule không có record trả null. Những mục này là ranh giới còn mở, không được coi là feature đã tích hợp bằng fallback.

## Chạy lại

Node 24.19.x/pnpm lock đã dùng; Edge chạy browser tests. Backend local PostgreSQL đã khởi tạo, User4310/Ops4311 và ingestion/market/forecast/agent workers phải chạy trước integration. Dùng `scripts/local-runtime.ts paths` để lấy đường dẫn cấu hình, không đưa contents secret files vào evidence. Mỗi service dùng `FW_MODE=synthetic-local`, `FW_PROFILE` phù hợp và `FW_SECRET_FILE` của profile đó. Không chạy `init` lần nữa trên state hiện có. Helper `scripts/start-be19-workers.ps1` chỉ dùng khi chưa có các workers, tránh spawn trùng.

Từ `finweave-backend`: `node scripts/build-be19-contract.ts --check`. Từ `finweave-web`:

```powershell
pnpm dev
# Terminal riêng: pnpm dev:admin
# Terminal kiểm, mỗi scope ghi evidence folder mới:
node scripts/be19-check.cjs build
node scripts/be19-check.cjs unit
node scripts/be19-check.cjs integration
node scripts/be19-check.cjs mockbuild
node scripts/be19-check.cjs mockbrowser
node scripts/be19-check.cjs android
```

Không sửa source trong lúc chạy. Mock browser dùng static bundles4184/4185; integration dùng dev5173/4183. Khi mở user và admin cùng browser, dùng origin riêng (ví dụ user127.0.0.1/adminlocalhost) hoặc browser context riêng: backend chủ động deny mixed owner/Ops cookies. Native debug endpoint127.0.0.1:4310 cần `adb reverse tcp:4310 tcp:4310` khi có thiết bị; release phải cấu hình HTTPS endpoint, không có loopback fallback. Chạy thiết bị và các gates còn mở mới đủ cơ sở chốt ba-client E2E.
