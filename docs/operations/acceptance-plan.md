# OPS-01…32 — Kiểm thử vận hành cần thực thi

Bảng dưới giữ baseline acceptance ARCH-13. Trạng thái implementation/evidence mới xem
[runtime-acceptance.json](runtime-acceptance.json) và [real-gates.md](real-gates.md).
Local evidence không nhận full OPS/AC PASS hoặc production retention observation.

**ALL SPECIFIED / NOT RUN.**32 ca là chi tiết triển khai xuyên suốt21 BE và41 parent AC, không thêm parent requirements và không chứng nhận AC bằng kiểm tra tài liệu. Mỗi ca cần runtime/harness đúng phạm vi, oracle độc lập, synthetic fault injection, logs an toàn và source/config/release hash. [JSON RTM](requirement-traceability.json).

| ID | Thủ tục / điều kiện đạt | Liên quan | Runbook / gate | Trạng thái |
| --- | --- | --- | --- | --- |
| OPS-01 Configuration | Loader từ chối field lạ, inline secret, sai môi trường/revision; public config chỉ có field được phép. | BE-18/19/20/21 | RB-01 / G-ARTIFACT | NOT RUN |
| OPS-02 Encrypted mount | Thiếu/sai mount hoặc quyền file dưới UID thực của container thì dừng; không tạo plaintext fallback. | BE-18/21 | RB-01 / G-SEC-T1 | NOT RUN |
| OPS-03 Environment isolation | DB/roles/keys/origins/APK channels cách ly; REAL không seed/reset hoặc dùng credentials thử. | BE-01/18/19/20/21 | RB-01 / G-AUTH | NOT RUN |
| OPS-04 Secret custody | Secret đúng profile/purpose/version; rotation không mất đường decrypt; browser/APK/Ops/logs không có secret. | BE-01/16/18/20/21 | RB-10 / G-SEC-T1 | NOT RUN |
| OPS-05 Untrusted CI | PR/dependency code không vào finance host, secrets, Docker socket, signing hoặc publish; quota CI được chặn. | BE-18/21 | RB-02 / G-ARTIFACT | NOT RUN |
| OPS-06 Artifact provenance | Source gồm untracked/deletions và lock/toolchain pins; artifact được test chính là artifact ký/phát hành. | BE-02/19/20/21 | RB-02 / G-ARTIFACT | NOT RUN |
| OPS-07 Required gates | Thiếu/skipped/cancelled/stale/wrong-source evidence thì không promote; giữ đủ41 AC/21 gói. | BE-01…21 | RB-02 / G-UAT | NOT RUN |
| OPS-08 Maintenance ingress | Maintenance chặn mutations/native upload/enqueue trước ACK; denial/erase/witness/backup vẫn hoạt động. | BE-01/04/08/16/17/18/21 | RB-02 / G-OPS | NOT RUN |
| OPS-09 Drain/cancel/fence | Kill khi external call hoặc COMMIT chưa biết; worker cũ không publish; attempts/deadline/budget/quota không reset. | BE-04/07/08/09/13/15/17/21 | RB-04 / G-J2 | NOT RUN |
| OPS-10 Migrator exclusivity | Hai migrators, mất connection hoặc checksum mismatch đều dừng đúng; API không tự chạy DDL. | BE-02/18/21 | RB-03 / G-DB | NOT RUN |
| OPS-11 Clean/upgrade/backfill | Clean install và upgrade001–003+004+ tới DB005 đúng types/grants/invariants; backfill tiếp tục đúng checkpoint. | BE-01…18/21 | RB-03 / G-DB | NOT RUN |
| OPS-12 Nontransaction DDL | Ngắt index create ngoài transaction; phát hiện invalid index và phase journal, sửa đúng trước retry. | BE-02/21 | RB-03 / G-DB | NOT RUN |
| OPS-13 Compatibility rollback | Chặn code cũ nếu không biết tương thích DB/job/payload/API/native; không down-migrate, rewind DB hoặc bật legacy queue. | BE-02/08/15/17/19/20/21 | RB-03 / G-OPS | NOT RUN |
| OPS-14 Readiness | TCP/SELECT1 xanh nhưng sai grants/schema hoặc recovery còn khóa thì không phục vụ finance; reconnect có giới hạn. | BE-01/02/18/21 | RB-01 / G-AUTH | NOT RUN |
| OPS-15 Scheduler catchup | Clients tắt, host ngủ/reboot, timer trùng: latest due J2 không trùng và có missed coverage; quan sát ít nhất7 ngày. | BE-07/17/21 | RB-04 / G-J2 | NOT RUN |
| OPS-16 Provider outage | 429, quota chưa biết, thu hồi rights, sai đơn vị hoặc đổi parser: deny call/last good/Review, không thu raw. | BE-06/07/08/10/17/21 | RB-05 / G-SOURCE | NOT RUN |
| OPS-17 Agent outage | Model chậm/lỗi/injection/cross-day resume/cancel: giữ budget/quyền/fence, không tự chuyển hosted. | BE-11/12/13/14/15/17/21 | RB-06 / G-AGENT | NOT RUN |
| OPS-18 APK release | Cài/update APK đúng signer; sai origin/revision bị chặn trước ACK; outbox không đổi owner; ghi gap thực. | BE-08/19/20/21 | RB-13 / G-NATIVE | NOT RUN |
| OPS-19 Safe telemetry | Bơm raw/PII/secret/amount/prompt qua app/proxy/DB/dependency/error/crash; kiểm output thực không lộ. | BE-01…21 | RB-10 / G-SEC-T1 | NOT RUN |
| OPS-20 Independent alert | Tắt host/network; receiver bên ngoài phát hiện heartbeat mất, xử lý duplicate/recovery an toàn, không chứa finance. | BE-16/18/21 | RB-12 / G-OPS | NOT RUN |
| OPS-21 TLS/clock failure | Cert hết hạn/sai domain hoặc clock skew/rollback không bypass auth/lease/witness; sửa rồi kiểm lại. | BE-01/08/17/18/20/21 | RB-12 / G-AUTH | NOT RUN |
| OPS-22 Resource/cost pressure | Cạn disk/pool/RAM/model/scratch/VM quota: backpressure đúng, giữ denial/erasure, không xóa ledger/tự tăng phí. | BE-07/09/13/15/17/18/21 | RB-07 / G-OPS | NOT RUN |
| OPS-23 Backup complete | Export lỗi/thiếu tenant/objects/receipt ngoài host không successful; inventory và key refs đầy đủ. | BE-01…18/21 | RB-08 / G-OPS | NOT RUN |
| OPS-24 RPO measurement | RPO dùng snapshot start, không upload end; lịch12h và dump/network chậm phải báo age/loss/breach thực. | BE-18/21 | RB-08 / G-OPS | NOT RUN |
| OPS-25 Restore keys | Mất VM, một capsule media hoặc current key: đường decrypt còn hoạt động hoặc báo LOCKED; không phụ thuộc khóa vòng. | BE-18/21 | RB-09 / G-SEC-T1 | NOT RUN |
| OPS-26 Restore fence/witness | Writer cũ chưa fence, witness stale, mapping lạ hoặc erased target: chặn trước finance read/export. | BE-01/04/08/18/21 | RB-09 / G-SEC-T1 | NOT RUN |
| OPS-27 Restore credentials | Mọi credentials/password login/replay/factors/bindings cũ bị vô hiệu; cần identity proof/reset/enrollment mới. | BE-01/08/16/18/20/21 | RB-09 / G-AUTH | NOT RUN |
| OPS-28 Restore financial/quotas | Ledger/history/Plan–Goals đúng sau restore; không tự post receipt cũ; market/model quota chưa tin cậy thì deny. | BE-03…15/17/18/21 | RB-09 / G-DOMAIN | NOT RUN |
| OPS-29 Backup retention | Kiểm mọi tags/hosts/timestamp giả/soft delete: hard34d và pack purge≤24h; xung đột last-good/privacy phải lộ rõ. | BE-18/21 | RB-08 / G-SEC-T1 | NOT RUN |
| OPS-30 Erasure | Deny ngay khi witness lỗi; request key khác không reset35d/children; chỉ completion sau purge mọi bản thuộc server. | BE-01…18/21 | RB-11 / G-SEC-T1 | NOT RUN |
| OPS-31 Runtime retention | Giữ active pins/history/dedupe/deny tombstones; TTL auth/source được thực thi bằng xóa thật, không chỉ expiry timestamp. | BE-01/04/08/09/11/12/14/15/17/18/21 | RB-11 / G-SEC-T1 | NOT RUN |
| OPS-32 Full acceptance and incident close | Đủ41 AC/21 gói/AI requirements trên ba clients và nguồn/model/device thật; RPO/RTO/UAT có phạm vi rõ, không PASS từ mock. | BE-01…21 | RB-14 / G-UAT | NOT RUN |

Schema và ví dụ release/policy không thay các ca runtime này. RPO/RTO/thresholds cần đo; provider/model/device/independence thật cần quyền, thiết bị và endpoints. Giữ toàn bộ AI-SPEC/41 AC/features tới UAT; critical/authorization/recovery/erasure chưa rõ thì không bật thật.
