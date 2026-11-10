# Sao lưu, khôi phục và retention

Kế thừa nguyên [recovery protocol](../security/t1/backup-restore-erasure.md), [custody khóa](../security/t1/keys-and-secrets.md) và [retention](../security/t1/logging-and-retention.md). ARCH13 làm rõ cách vận hành, không giảm deny witness hoặc thay crypto.

## 1. Backup nhất quán, đủ thành phần và có bản ngoài host

PostgreSQL16 custom export giữ snapshot nhất quán của một DB. Backup còn cần manifests schema/migrations/grants/release, inventory payload và objects ngoài PG, tham chiếu key capsule và recovery checkpoint. Dùng client tools cùng major đã pin; backup role được tin phải đọc đủ tenants, không bật RLS lọc rồi coi export là hoàn chỉnh. Source/staging export ở volume mã hóa; restic repository mã hóa ngoài host, TLS authenticated, writer chỉ append. Custodian prune/delete ở ngoài finance host; age recipient private key giữ offline, CA/APK secrets ở compartment riêng.

[pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html) không tự backup toàn cluster roles và external objects. [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html) có thể thực thi mã từ archive; hash chỉ chứng minh integrity so với manifest tin cậy. Cần review archive/allowlist và dựng schema từ pinned migrations. Chọn logical backup cho hệ thống nhỏ, một host; nếu dump/restore không đạt mục tiêu thì xem lại WAL/PITR, retention, keys, capacity và chi phí. Chưa tự bật PITR hoặc paid service.

Backup chỉ successful sau export exit0, inventory đầy đủ, receipt bền từ destination, integrity/catalog và tham chiếu capsule/checkpoint đã kiểm. Không thay bản tốt cuối bằng export lỗi hoặc thiếu thành phần. Đo RPO từ lower bound thời điểm snapshot bắt đầu tại DB, không từ lúc upload xong.

Lịch đúng mỗi 24 giờ cộng thời gian export/upload có thể vượt mục tiêu RPO24h. Đề xuất ban đầu mỗi12h để có dự phòng; vẫn chọn preferred7 bản ngày/4 bản tuần trong hard age34d. Các bản trong ngày cần tính thêm capacity. Đây là candidate chưa đo, không bảo đảm RPO. Backup lock phải phối hợp với migration/release/pruner, tránh DDL và repository lock xung đột. Đo worst-case snapshot age, mất mạng, thời gian dump, băng thông và dung lượng.

Restore drill ban đầu mỗi≤30 ngày, trước thay đổi lớn về schema/keys/roles/toolchain và sau sự cố. Repository integrity check mỗi chu kỳ và full data read theo budget không thay SQL restore drill. Capacity cần đủ initial full backup, các thay đổi, scratch repack, catalog và capsule. Destination/quota/availability hiện chưa chọn hoặc provision.

## 2. Xóa thật, không chỉ xóa metadata

Giữ hard snapshot age≤34 ngày; dữ liệu không còn tham chiếu trong packs phải purge≤24 giờ. Erasure deadline tính từ yêu cầu gốc+35 ngày, không reset khi retry. Custodian kiểm mọi snapshots/hosts/paths/tags, versioning, soft delete và bản offline thuộc server; dùng trusted inventory/receive times, không tin timestamp giả từ source host bị compromise.

Restic `forget` bỏ snapshot metadata; `prune` mới xử lý dữ liệu. Repack cần scratch và có thể giữ repository lock. Policy phải xử lý mọi pack có dữ liệu đã xóa; `--max-unused 0` là candidate cần review/benchmark. Default cho phép unused data hoặc giới hạn repack không được dùng để tuyên bố purge hoàn tất. Pack còn chứa dữ liệu owner thì chưa completion dù snapshot không còn thấy. [Restic retention/pruning](https://restic.readthedocs.io/en/stable/060_forget.html).

Runtime cleanup dùng typed procedures, bảo vệ active pins, confirmed history, dedupe tombstones và deny controls. Source license có thể buộc TTL ngắn hơn90d; auth replay5min không dùng TTL payload90d. Checkpoint/budget còn live không kéo retention nội dung vô hạn: sanitize thành tombstone và trả partial rõ khi nội dung hết hạn. Ledger/Plan/history đã xác nhận giữ theo owner lifecycle; erase profile đặc quyền là ngoại lệ riêng, không normal retention DELETE.

Xung đột giữa privacy deadline và khả năng recovery phải thành incident, không âm thầm giữ backup quá hạn hoặc xóa bản tốt cuối rồi vẫn claim RPO. Thiết bị offline, file người dùng tải và logs của provider ngoài server control có giới hạn xóa được công bố rõ.

## 3. Restore luôn khóa cho tới khi đối chiếu xong

Fence writer cũ trước khi mở writer mới. Restore vào môi trường cô lập: providers/model/mail/uploads/financial workers và public finance đều tắt. Dựng schema từ pinned migrations; data restore theo allowlist/profile đã review. Nếu cần temporary restore guard để nạp data, phải audit, bật lại và validate toàn bộ trước readiness; không tắt mọi triggers/RLS rồi quên.

Lấy latest witness head với fresh nonce, xác minh chữ ký/chain/key history; áp erasure và deny trước bất kỳ finance read/export nào. Mapping không biết hoặc witness thiếu/stale thì quarantine/LOCKED. Vô hiệu restored passwords dùng để đăng nhập trực tiếp, sessions, refresh/access/collector tokens, challenges, replay, bindings và factors; fresh identity proof/reset/enrollment và admin reprovision theo ARCH07.

Restored jobs không tự chạy. Đối chiếu leases/effects, source consent/rights và market/model quotas; counter chưa tin cậy thì chặn egress tới khi reconcile hoặc reset window tin cậy. Không gán outbox cũ cho owner mới; receipt mất sau restore chuyển gap/investigation, không tự post lại.

RTO đo từ recovery declaration đến service có kiểm soát, gồm chờ operator/keys, tải backup, migrations, witness, grants, invariant checks và đường reset identity hoạt động. Báo riêng partial service và thời gian owner reset/re-enroll; không nhận full recovery nếu chỉ API chạy. RPO báo khoảng dữ liệu thực mất hoặc chưa xác định, không hứa zero loss nhờ native replay.

Backup/witness/alert ở failure domain khác finance host. Chạy khác process trên cùng VM chỉ chứng minh logic synthetic, không chứng minh độc lập. Endpoints/custody thật còn thiếu nên REAL vẫn bị chặn. ARCH13 không chạy backup/restore hoặc tạo khóa.
