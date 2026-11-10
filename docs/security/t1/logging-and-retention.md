# Logs, telemetry, TTL và xóa dữ liệu

**DESIGN / NOT RUN**. [Machine policy](security-policy.json), [84-table classification](table-data-classification.csv). Mọi TTL dùng server time/UTC; không coi expiry timestamp hoặc frontend masking là dữ liệu đã được xóa.

## 1. Allowlist thay vì log toàn object rồi che vài field

Operational events chỉ requestId opaque, operation class allowlisted, status/safe code, latency/attempt buckets, profile/release/environment. Không log bodies/headers/cookies/tokens/password/FinWeaveOTP/bankOTP/email/accountRefs/amount/balance/quantity/prompt/SQL parameters/private URLs. Reverse proxy ghi route template hoặc operationclass, không raw query/path IDs/referrer; browser recoveryfragment không được telemetry capture. Client-side finance crash/screenshot/session-replay analytics disabled mặc định.

Errors chỉ safe enum+correlation; stacktrace nội bộ không serialize DTO/domain/DBargs. Metrics không workspace/subject/device/transaction IDs hoặc arbitrary text làm label, tránh cả cardinality DoS và finance leakage. Security audit giữ minimal opaque principal/epoch/reason theo purpose, chỉ restricted audit profile đọc; Ops UI chỉ aggregate allowlist, không raw audit stream. Logging hướng dẫn tham chiếu [OWASP Logging](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html); phải test cả proxy/APM/DB/dependency stdout/crash path, không chỉ application logger.

Bank raw notification/extras/SMS/emailbody/OTP không persist ngay cả debug. FinWeave auth challenge/TOTP được xử lý đúng verifier/mail purpose nhưng không log. CSV/Agent text untrusted: strip control-character/log injection, không đưa raw rows/messages vào exception. Hash của email/amount/prompt không tự là anonymous; SHA256 financial payload digest của API vẫn private, không đổi thuật toán wire âm thầm và không đưa digest đó vào Ops logs/witness. Dùng domain-separated keyed bucket IDs cho throttling như ARCH-06, không reuse làm finance identifier.

## 2. Retention đích

| Dataset | Thời hạn/chuyển trạng thái | Điều không được làm |
| --- | --- | --- |
| Bank raw/OTP/extras | Native memory filter rồi discard; server zero persistent copies | Debug cache/raw log để “điều tra sau” |
| FinWeave OTP/reset/bearer plaintext | Chỉ xử lý in-memory/purpose-bound issuance; verifier digest; auth response ciphertext5min | Generic result store90d/plaintext backup/debug |
| Auth replay ciphertext |5min, clear body; keep safe digest tombstone theo authority expiry+30d | Replay secret sau revoke/restore |
| Sessions/used token metadata |30d sau expiry; active refs/FKs có thể yêu cầu minimal tombstone lâu hơn | DELETE parent còn references hoặc tái cấp quyền từ history |
| Challenge/rate counters |24h cleanup sau bounded expiry | Giữ plaintext code/mail/raw IP |
| Nonces |>=5min và clock-skew horizon trước cleanup | Xóa sớm tạo replay window |
| Ops logs |30d; incidents/job metadata90d; security audit180d proposal | Logs finance/infinite retention mặc định |
| Receipt/evidence/normalized payload |90d payload TTL, redact content độc lập immutable identity/pinned domain history | Xóa dedupe identity làm receipt repost |
| CSV/import staging |Raw CSV memory; normalized staging24h, bounded paused job state | Persist rawfile vào public upload/cache |
| Unconfirmed drafts |30d; pinned confirmed planning/actual history theo owner lifecycle | Xóa active Plan/Goal hoặc confirmed snapshot để tiết kiệm quota |
| Projection cache |TTL riêng; pins/history giữ explicit refs | Coi cache là nguồn ledger hoặc keep history bằng cache vô hạn |
| Confirmed financial ledger/history |Owner lifecycle; authorized erasure workflow privileged, không ordinary retention | Revoke source đồng nghĩa xóa ledger; orphan FK/partial deletion |
| Recovery deny/tombstone/control |>=90d **và** tới khi mọi affected backup hết + native replay horizon7d, whichever later | Auto purge theo90d khi còn archive/copy không kiểm kê |
| Backup |Hard snapshot age34d + actual pack purge<=24h; erasure deadline35d từ originalrequest | Count7+4 tự coi là age bound hoặc soft-delete snapshot là physically purged |

Các con số là baseline thiết kế, chưa là legal/SLA compliance hoặc thời gian thực đã đo. Real disclosure/privacy policy cần reflect đúng lịch và residual copies; exceptions/legal hold không tự suy ra từ tài liệu này. Không bật real hoặc giữ dữ liệu thật vô hạn do thiếu job.

## 3. Thực thi xóa

Retention profile dùng narrow typed expiry procedures dưới cùng FK/pin rules; erase profile riêng owner-authorized, không cấp DELETE toàn bộ immutable ledger cho normal worker. Erase parent identity đóng access trước freeze children; remove active finance/PII/secret/prompt/evidence/import/cache/export copies có dependency order, preserve only minimum opaque deny controls. Shared market quote không gắn owner có thể tồn tại nếu license cho phép; owner holdings/private provenance links phải mất.

Completion dựa active copy inventory, prune results và restricted restore check, không dựa clock đã quá35days. Deadline breach→critical incident/BLOCKED release, không dời deadline để PASS. User-downloaded files và offline device ngoài server control không được claim remote erased; native purge/revoke status unknown phải thể hiện thật. [Backup/restore/erasure](backup-restore-erasure.md).
