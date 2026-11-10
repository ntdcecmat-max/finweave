# Health, logs, metrics và cảnh báo

## Ranh giới thông tin

Public health chỉ boolean/status không version/topology/DB errors. Internal authenticated readiness có release/schema/policy registry/recovery status cho trusted operator; Ops API chỉ approved aggregates, không finance/provider credentials/prompts. Không thêm public APIoperation trong ARCH13. Per-workspace coverage/quote staleness là owner UI, không metrics label/alert payload ra vendor. Restricted security audit có opaque actor theo ARCH07 và quyền riêng, không stream sang app-admin.

Log schema allowlist safe codes/requestId opaque/operationClass/profile/release/environmentClass/latency bucket. Proxy route template, không URL/query/pathIDs/header/cookie/body/referrer. No SQL params/error rows/model text/raw bank/OTP/amount/holding/quantity/email/accountRef/payload digest. Dependencies/DB stderr/crash cores/build scanners/backup tools đều thuộc kiểm tra, không chỉ logger chính. Disable session replay/screenshot analytics; debug chỉ synthetic sanitized. Logs30d, job/incidentmetadata90d, restricted audit180d theo policy; rotation byte cap perprofile cần đo, expiry phải actual purge.

| Tín hiệu | Hành động ban đầu | Điều kiện không được suy |
| --- | --- | --- |
| API error/rate/latency, pool wait/connections | Aggregate theo allowlisted operation class; alert sustained baseline deviation | SELECT1/HTTP200 không chứng minh authorization/domain |
| Heartbeat host mỗi60s; missing>180s | Alert receiver ở failure domain khác; xác minh mất host/network | App-host tự gửi không phát hiện chính nó mất nếu không có external timeout |
| Dispatch/J2 oldest due>300s, scheduler watermark, retry/deadletter | Điều tra profile/DB/quota/license; no mass reset | Queue length0 không chứng minh job được tạo đúng |
| Backup snapshot-start age≥20h warn, >24h critical | Independent destination receipt+snapshot lowerbound; backup/restore check | Upload end mới không làm snapshot cũ fresh |
| Disk75/85/90% + reserve bytes | Warn/critical/stop imports, forecast, inference và new heavy work; giữ denial/control | Không xóa ledger/backup last-good vô điều kiện; quota% đủ chưa chắc repack có scratch |
| Clock skew>60s | Hold auth-sensitive ops/witness/lease assumptions, fix trusted clock | Không tăng TTL/rewind clocks để PASS |
| TLS còn14/7days | Warn/critical renewal; verify correct origin/cert chain | Renewal success job không chứng minh public cert mới |
| Erasure day30 warn, day35 critical hoặc pack purge>24h | Privacy incident, keep denied, no deadline extension | Snapshot forgotten/TTL expired không là data physically removed |
| Witness lag, latest-head verification failure | Restore blocked; local denials stay | Healthy witness ping không là fresh nonce-bound signed head |
| Price/job/source license/quota, Agent budget/concurrency | Coarse safe status; owner sees quality separately | Disabled source/model không tính reliable daily/Agent fullfeature PASS |

Mọi ngưỡng là starting configuration, chưa SLO đã đo. RPO/RTO24h targets; không đặt uptime99.9 hoặc exact low latency khi single host/freequota chưa kiểm. Quote stale>24h theo sourcepolicy, chỉ bằng24h chưa stale; giữ quoteAsOf/fetchedAt riêng, không dùng HTTPhealth thay freshness.

Independent alert receiver chưa chọn/provision; chỉ nhận environmentClass/releaseId/profile/safeCode/severity/time và opaque incident ref, không owner IDs/values. Alert/recovery key trust độc lập host; integration test hostdown/destinationdown/duplicate/recoverynotification và quota 0. Không gửi email/chat nào từ task thiết kế này. Nếu receiver hoặc contact chưa cấu hình thì real gate BLOCKED, local console chỉ demo.
