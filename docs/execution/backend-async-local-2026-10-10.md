# BE-07/08/17 — Async/Sources local, 10/10/2026

> 13/10/2026: [recovery and current-source verification](backend-async-recovery-2026-10-13.md) supersedes this report's initial test counts and day-zero observation snapshot. The original start/history remain preserved; seven-day acceptance is still pending.

**PASS_LOCAL_ASYNC_PIPELINES; SEVEN_DAY_OBSERVATION_PENDING.** Receipt → ingestion → ledger/Review và price refresh → quota → quote/coverage chạy trên PostgreSQL local, với DTO native giả lập và provider stub. Chưa nghiệm thu Android thật, nguồn giá thật, toàn bộ target DB005 hoặc toàn bộ backend.

Mã triển khai ở [backend](../../finweave-backend/README.md), [runbook và resume](../../finweave-backend/ASYNC.md). Giữ nguyên API005, DB005 và native003 đã pin; migration runtime 006 mở rộng local, không sửa target đã niêm phong. Không deploy ra ngoài máy này.

## Pipelines đã thực thi

Receipt, normalized evidence và job commit trong cùng transaction trước ACK `durable`/HTTP 202. Identity cố định theo workspace/device/eventKey/revision; digest hoặc capture epoch khác bị conflict. Replay không tạo receipt, job hoặc ledger posting thứ hai. P-256 proof và guard owner/device epoch/consent/binding version/source/recovery được kiểm ở intake và trước effect. Không nhận raw notification, OTP hoặc account identifier đầy đủ.

Evidence hợp lệ tạo balanced sealed ledger, receipt và outcome atomically. Reference synthetic đáng tin loại duplicate; evidence mơ hồ vào Review. Preview/confirm Review theo API005 cập nhật ledger và receipt cùng transaction, kể cả lost response/replay. Evidence thiếu amount giữ Review cho chủ sở hữu điều tra, không đoán amount.

Queue lưu claim generation/token, lease, active start, heartbeat, deadline, attempts, retry cycles và outcome. Lease hết tại equality; stale worker/revoke/cancel không thể commit. Reaper lưu backoff trước claim tiếp theo. Receipt có tám automatic attempts/bảy ngày; price có năm attempts/sáu giờ. Manual retry chỉ dùng tối đa hai chu kỳ bổ sung đã giới hạn, không reset attempts, deadline, identity hoặc quota đã tiêu. Cancel là control port nội bộ; không thêm API cancel ngoài contract.

Refresh đóng băng selection/profile/source/rights versions, coalesce request active tương thích và cooldown 60 giây; same-key replay trả kết quả gốc trước kiểm tra version/cooldown mới. Parent/children enqueue atomically, parent không có lease. Results `updated/retained/missing` phủ đủ selected set. Adapter chỉ chấp nhận `stub` với quyền synthetic đã xác nhận, quota scopes rõ ràng và còn hạn.

Reservation khóa mọi tenant/shared-license scope cùng transaction; intent `sent_unknown` commit trước provider call. Crash/unknown response vẫn tiêu quota, generation mới reserve mới, không refund hoặc lặp request unknown cùng generation. Retry-After/cooldown lưu qua restart và quota windows. Restore nâng recovery epoch chặn market egress đến cửa sổ UTC mới, kể cả snapshot có used counter cũ.

Quotes giữ `quoteAsOf` riêng với `fetchedAt`; fingerprint observation ngăn daily reads tạo historical quotes giả. Invalid quote không thay last-good; holding/source freshness dùng observation time. Stub hỗ trợ VND/share và VND/chi; nguồn SSI/gold/FX thật chưa bật. Giá không sửa cash/quantity. Sửa thêm lựa chọn quote cùng as-of: ưu tiên fetchedAt mới nhất để tránh kết quả ngẫu nhiên theo generated ID và giữ kiểm tra overflow của Engine.

14 operation Sources/receipts/refresh dùng request/reply API005 trong [sources.ts](../../finweave-backend/src/runtime/sources.ts). Coverage giá nằm trong refresh results và source/holding freshness; chưa mở rộng các API coverage/sync khác ngoài phạm vi này. Agent/import/forecast còn cần domain adapters thuộc BE tương ứng.

## Bộ thử lỗi và regressions

Suite chạy trên cluster PostgreSQL dùng một lần, dừng cluster trong `finally`. API tests đi qua Fastify inject với validation/proof/auth/transaction thực; simulator mở lại encrypted outbox sau restart. Không fault-inject DB quan sát.

| Kiểm định | Kết quả | Bằng chứng |
|---|---|---|
| Async/Sources | 17 nhóm PASS | [Async](evidence/backend-async-local-2026-10-09/async-1791567325104.json) |
| Auth/security/J2 | 19 nhóm PASS | [Runtime](evidence/backend-auth-local-2026-10-09/runtime-1791566948086.json) |
| Finance/Engine integration | 19 nhóm, 54 oracle actions PASS | [Finance](evidence/backend-finance-local-2026-10-09/finance-1791566904493.json) |
| TypeScript/static pins/Engine units | PASS, 32 unit tests | [Final checks](evidence/backend-foundation-2026-10-09/checks-2026-10-09T17-39-03-213Z.json) |

17 nhóm Async gồm: lost/malformed ACK và restart outbox; rollback giữa ledger seal/commit; immutable identity/digest/semantic duplicate; Review preview/confirm/replay; rút consent sau claim fence heartbeat/effect/replay; binding/device revoke; lease equality/stale generation/manual retry/cancel; frozen selection/coalescing/cooldown; atomic fanout/coverage; observation dedupe; invalid provider/stale last-good; rights unconfirmed/revoked; worker process thực sự exit sau reservation commit; concurrent workspaces/shared quota; persisted Retry-After; host scheduler khi clients tắt; capability isolation/Ops metrics; recovery restore fence; counter cũ từ backup.

Outage nhiều ngày dùng clock/state fault injection. Restore counter cũ dùng snapshot-state injection và recovery coordinator, **không** phải physical backup/restore rehearsal. Không tính các ca này thành bảy ngày quan sát thật hoặc Android force-stop/OEM tests.

Chạy lại từ `finweave-backend`:

```powershell
node scripts/check.ts
node scripts/test-async.ts
node scripts/test-runtime.ts
node scripts/test-finance.ts
node scripts/verify-async-evidence.ts
node scripts/verify-finance-evidence.ts
node scripts/verify-async-acceptance.ts
```

[Acceptance index](evidence/backend-async-local-2026-10-09/acceptance-latest.json) kiểm SHA-256 source hiện hành của ba suite, final checks, migration quan sát và operational scripts. Giữ evidence FAIL cũ; kết quả hiện hành là những lần PASS ở trên.

## Quan sát daily theo thời gian thật

Cluster quan sát riêng ở loopback; secrets/keys/DB dưới `.local` đã ignore. Workers ingestion/market dùng credentials non-superuser riêng. Intake đầu dùng normalized payload đúng native contract, đã durable ACK và posted một receipt. Initial manual price refresh publish fixture stock/gold, reserve một request. Clients/API simulator đã đóng; host workers/scheduler tiếp tục chạy.

StartedAt giữ nguyên **10/10/2026 00:21:28.222 Asia/Bangkok** (`2026-10-09T17:21:28.222Z`). Worker được reload mã cuối đã kiểm định, giữ nguyên receipts/attempts/deadlines/quota. Mẫu thực tế kiểm PID/start time/readiness/stderr và metrics ở [latest.json](evidence/backend-async-observation/latest.json); mẫu append-only ở [samples.ndjson](evidence/backend-async-observation/samples.ndjson).

Market tick mỗi 60 giây, refresh **18:00 Asia/Ho_Chi_Minh**. Heartbeat `finweave-async-sources-daily-observation` đang ACTIVE lúc **18:10 Asia/Bangkok**, resume đúng cluster/workers và lưu mẫu mới; chỉ báo lỗi/thay đổi cần hành động hoặc mốc bảy ngày. Không reset/backdate hay chạy fault tests trong lượt quan sát.

Hiện có **một ngày địa phương và vài phút elapsed**, `sevenDayObservation=false`; chưa tới daily 18:00 đầu tiên. Không có bằng chứng daily chạy thành công bảy ngày. Sớm nhất đủ bảy elapsed days là **17/10/2026 00:21:28.222**; còn cần tám observed local dates và không sample gap quá 26 giờ. Elapsed không chứng minh mọi lượt healthy: phải đọc failed/missed/stale/coverage và tình trạng worker.

Stub quoteAsOf cố định tại setup, nên stale sau 36 giờ dù daily request chạy. Không sửa timestamp/fixtures để làm đẹp evidence. Máy/app ngủ/tắt tạo gap/catch-up cần ghi nhận, không thay bằng mẫu mô phỏng. Process probe bằng sandbox từng báo không thấy worker; kiểm lại đúng PID/start time cho thấy worker vẫn chạy, nên không ghi một outage giả.

## Phạm vi còn chờ

Android Room/Keystore/WorkManager, quarantine/cleanup thật, reboot/permission/OEM và collector renewal thuộc BE-20. Simulator local giữ normalized encrypted outbox/journal, không được coi là Android đã chạy. Provider thật chỉ bổ sung sau xác nhận entitlement/quota/mapping; runtime và DB hiện từ chối provider ngoài stub. REAL/SEC-REAL, physical restore rehearsal, toàn bộ target backend/frontend integration và nghiệm thu bảy ngày chưa được tuyên bố PASS.
