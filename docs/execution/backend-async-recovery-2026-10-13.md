# Async/Sources — recovery và kiểm định, 13/10/2026

**PASS_LOCAL_RECOVERY_AND_CURRENT_SOURCE; SEVEN_DAY_PENDING.** Hai worker ingestion/market chạy trên cluster quan sát cũ. Migration 001–011 và Ops broker grants đã có khi kiểm tra lần này; đã xác nhận checksum và readiness, không tạo DB mới hoặc tự grant để né lỗi.

Nguyên nhân lỗi 12/10 là runtime mới gọi `fw_ops.apply_controls` trong khi cluster lúc đó chỉ có 001–006. Mẫu lỗi/overdue và log recovery được giữ nguyên. Không coi giai đoạn đó là vận hành khỏe liên tục.

## Thay đổi

[Launcher](../../finweave-backend/scripts/start-async-observation.ps1) resume cluster cũ rồi chạy [preflight chỉ đọc](../../finweave-backend/scripts/check-async-observation.ts). Preflight kiểm đúng loopback/đường dẫn `.local`, checksum của toàn bộ migrations, role non-superuser từng worker, recovery/maintenance state và quyền thực thi broker Ops. Sai checksum hoặc thiếu port khiến launch bị chặn; không tự sửa schema hay cấp thêm quyền.

Launcher kiểm PID/start time, stdout readiness và stderr trước khi báo ready. Source/Node hash được lưu cùng mỗi worker và đối chiếu với source hiện tại trong từng sample. Worker có source cũ được reload khi idle; có job running thì báo cần drain trước. Snapshot trước/sau reload chứng minh receipts, generation/state, attempts, deadlines, max_attempts, retry_cycles và quota buckets giữ nguyên.

Source audits hỗ trợ cả evidence cũ chỉ pin migration 006 và evidence mới pin aggregate runtime/Engine/migrations/lock/observer/API005. Không sửa evidence cũ để khớp bản mới.

Restore hiện đóng quyền nguồn và quota chưa biết cho đến trusted reconciliation rõ ràng. Qua UTC window mới hoặc cấp ticket mới không làm used counter cũ trở nên đáng tin; ca thử snapshot-counter cũ vẫn bị từ chối.

## Kiểm định mã hiện hành

| Bộ kiểm | Kết quả | Evidence |
|---|---|---|
| Async/Sources | 18 nhóm PASS | [Async](evidence/backend-async-local-2026-10-09/async-1791895633712.json) |
| Auth/J2 | 19 nhóm PASS | [Runtime](evidence/backend-auth-local-2026-10-09/runtime-1791895633995.json) |
| Finance/Engine | 19 nhóm, 54 oracle actions PASS | [Finance](evidence/backend-finance-local-2026-10-09/finance-1791895641531.json) |
| TypeScript/pins/Engine units | PASS, 32 unit tests | [Checks](evidence/backend-foundation-2026-10-09/checks-2026-10-13T12-49-12-978Z.json) |

Nhóm Async mới kiểm trực tiếp role worker trên PostgreSQL disposable: migration drift và broker EXECUTE bị revoke đều chặn preflight; grant được khôi phục trong test fixture. Các ca crash/lost ACK/retry/revoke/stale worker/shared quota/restore counters/clients tắt vẫn PASS. Không fault-inject cluster quan sát. Năm unit tests qualification kiểm elapsed/healthy/source/gaps/future samples và rolling window; chúng không tính thành quan sát thật.

[Acceptance index hiện hành](evidence/backend-async-local-2026-10-09/acceptance-latest.json) đối chiếu SHA nguồn của ba suite và snapshot quan sát. Chạy lại theo [runbook](../../finweave-backend/ASYNC.md).

## Quan sát thực tế

[Evidence preservation](evidence/backend-async-observation/recovery-1791895942706.json) ghi SHA trước/sau bằng nhau cho một receipt, sáu jobs và bốn quota buckets. StartedAt giữ `2026-10-09T17:21:28.222Z`, tức **10/10 00:21 Bangkok**. Không reset attempts/budgets/deadlines hoặc recovery epoch.

Mẫu **13/10 19:52 Bangkok**: cả hai worker alive/ready/codeMatches, stderr rỗng; failed/queued/running/overdue/missing đều 0, receipt posted 1, daily occurrences 4, tổng quota reserved 5. QuoteAsOf và fetchedAt gốc giữ nguyên; hai quote stub stale đúng dự kiến. Daily tiếp tục 18:00, heartbeat 18:10 Bangkok; thời gian host/app ngủ/tắt được ghi nhận bằng gap/catch-up, không thay bằng mẫu giả.

Hiện **3,81 ngày elapsed, bốn ngày địa phương**, gap lớn nhất **25,38 giờ**. Seven-day qualification vẫn false vì chưa đủ thời gian/ngày và còn các mẫu unhealthy/source-changed. Một rolling window khỏe và cùng source mới có thể được nghiệm thu; mốc 17/10 đủ elapsed từ start cũ không tự chứng minh bản hiện tại đủ bảy ngày. Raw history và startedAt được giữ nguyên. Theo dõi [latest](evidence/backend-async-observation/latest.json) và [samples](evidence/backend-async-observation/samples.ndjson).

Phạm vi vẫn là native simulator/provider stub; Android thật, nguồn giá thật và REAL deployment chưa được bật. Không upload raw/OTP hoặc tạo historical quote giả. Runtime seven-day acceptance và fresh-real-quote UAT là hai kết quả riêng.
