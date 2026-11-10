# Runbooks — chưa diễn tập

Baseline thiết kế ARCH-13. Bản lệnh/harness bổ sung và evidence scope ở
[runtime-runbooks.md](runtime-runbooks.md); [real gates](real-gates.md) vẫn chặn REAL.

Operator là capability vận hành hạ tầng được tin theo T1; app-admin không có các quyền này. Một người có thể giữ nhiều vai trò trong dự án cá nhân, nhưng credentials/process/custody vẫn tách. Prune và witness ở ngoài finance host.

Mỗi lần thực hiện cần ghi môi trường/release, actor purpose, điều kiện đầu vào, thời gian, kết quả và bằng chứng an toàn. Các thủ tục dưới đây chưa chạy; drill dùng synthetic/disposable target đã xác minh, không phá dữ liệu hoặc khóa thật để tạo evidence.

## RB-01 — Khởi động và reboot

**Điều kiện:** Operator có release đã kiểm, khóa và đúng volume mã hóa.

**Thực hiện:** Giữ cổng công khai đóng. Mở khóa và xác minh mount; kiểm cấu hình, quyền file và secrets. Khởi động PG, kiểm schema/grants/recovery gate; sau đó API riêng, workers, scheduler và reverse proxy.

**Dừng khi:** Sai mount/khóa/schema, recovery còn khóa hoặc chưa biết writer cũ đã dừng. Không tạo thư mục plaintext thay mount.

**Bằng chứng:** Mount identity, phiên bản, kết quả readiness và kiểm tra bị từ chối; không xuất secret.

## RB-02 — Phát hành có bảo trì

**Điều kiện:** Release operator có artifact đã kiểm/ký, ma trận tương thích, backup và witness hợp lệ.

**Thực hiện:** Giữ deploy lock; bật maintenance; chặn enqueue/claim mới. Drain hoặc fence worker cũ. Chạy migration; kiểm readiness và smoke riêng; bật workers/scheduler rồi mở cổng.

**Dừng khi:** Checksum, migration, quyền hoặc smoke sai. Chỉ quay lại code trước nếu đã chứng minh tương thích dữ liệu hiện tại.

**Bằng chứng:** Hash source/image/migration, từng gate, thời gian bảo trì và bằng chứng fence.

## RB-03 — Migration lỗi và rollback

**Điều kiện:** Một migrator giữ lock, có journal và quyền xem catalog.

**Thực hiện:** Giữ maintenance. Phân biệt DDL có transaction và phase ngoài transaction; kiểm trạng thái catalog thực. Sửa đúng phase hoặc forward fix, giữ ID/checksum; chạy lại kiểm tra liên quan.

**Dừng khi:** Không sửa checksum đã applied, reset journal, tự down-migrate hay restore dump để quay phiên bản.

**Bằng chứng:** Phase, index không hợp lệ, schema/grants/invariants và release sửa lỗi.

## RB-04 — Job kẹt hoặc worker chết

**Điều kiện:** Operator đúng capability dùng procedure có scope.

**Thực hiện:** Kiểm lease, policy, deadline, quyền hiện tại và quota. Fence attempt cũ; reaper/retry cùng job khi còn đủ điều kiện. Tra marker để xác định effect có COMMIT hay chưa.

**Dừng khi:** Không tạo key/job mới cho outcome chưa biết, không reset attempts/budgets. Lỗi vĩnh viễn phải quarantine.

**Bằng chứng:** Trạng thái job/profile, marker và kết quả fault/replay; không đưa body tài chính vào Ops.

## RB-05 — Nguồn giá hoặc notification lỗi

**Điều kiện:** Source operator có profile, quyền nguồn và quota đã xác nhận.

**Thực hiện:** Tạm dừng profile bị ảnh hưởng. Giữ giá tốt cuối với nhãn stale; báo coverage cho owner. Kiểm phiên bản, binding, đơn vị, thời điểm; chỉ bật lại sau regression phù hợp.

**Dừng khi:** Không scrape nguồn khác hoặc bật parser chưa được phép. Không thu raw/OTP để debug; mơ hồ chuyển Review.

**Bằng chứng:** Phiên bản/profile, quyền nguồn, lỗi tổng hợp; bằng chứng riêng của owner giữ trong phạm vi riêng.

## RB-06 — Model chậm, injection hoặc hết quota

**Điều kiện:** Assistant operator có artifact/schema/policy đã pin.

**Thực hiện:** Cancel/fence run và chặn kết quả đến muộn. Kiểm quyết định và guard bằng bằng chứng an toàn. Dùng fallback rõ nhãn; sửa runtime và chạy evaluation trước bật lại.

**Dừng khi:** Không tự chuyển cloud, tăng quyền tool, reset giới hạn 8 hành động/60 giây hoặc tự ghi actual.

**Bằng chứng:** Trạng thái run trong phạm vi riêng, metrics đã lọc, phiên bản model và kết quả evaluation.

## RB-07 — Cạn disk, pool, RAM hoặc quota

**Điều kiện:** Infrastructure operator có metrics và dung lượng dự phòng.

**Thực hiện:** Chặn thêm import/forecast/inference nặng; backpressure ingress. Giữ denial/witness/erasure hoạt động. Chỉ tăng tài nguyên trong quyền và ngân sách đã được duyệt.

**Dừng khi:** Không xóa ledger hoặc backup tốt cuối để cứu dung lượng; không tự chọn VM tính phí. Đóng finance nếu ghi tiếp không an toàn.

**Bằng chứng:** Dung lượng, pools, queue age, quota và phương án capacity; không chứa số tài chính.

## RB-08 — Backup, destination hoặc prune lỗi

**Điều kiện:** Backup writer và custodian độc lập có catalog tin cậy.

**Thực hiện:** Giữ bản tốt cuối. Kiểm export, snapshot start, capsule, destination receipt, lock và scratch cho repack. Retry đúng identity; báo lỗi qua kênh ngoài host.

**Dừng khi:** Age vượt 24 giờ là fail RPO target. Snapshot quá 34 ngày hoặc pack chưa purge sau 24 giờ là sự cố retention; không sửa timestamp để che lỗi.

**Bằng chứng:** Catalog/receipt, inventory, mã lỗi và kết quả restore drill.

## RB-09 — Mất host hoặc database

**Điều kiện:** Recovery operator có witness, khóa và backup độc lập.

**Thực hiện:** Fence host cũ. Restore cô lập, khóa mặc định; kiểm schema/data; lấy latest witness head và áp denies. Vô hiệu credentials; đối chiếu jobs/quotas; smoke có kiểm soát rồi mới mở.

**Dừng khi:** Thiếu fresh head, khóa, denied scan hoặc bằng chứng writer cũ đã dừng: giữ LOCKED. Báo rõ dữ liệu mất hoặc chưa xác định.

**Bằng chứng:** Snapshot lower bound, timeline, fence, witness head, invariants và RPO/RTO thực đo.

## RB-10 — Secret lộ hoặc host bị chiếm

**Điều kiện:** Incident operator có kênh điều khiển độc lập.

**Thực hiện:** Cô lập host/egress. Deny và anchor revoke; giữ bằng chứng đã lọc. Rotate đúng phạm vi, build host/release sạch và dùng quy trình restore khóa mặc định.

**Dừng khi:** Không cấp root qua Ops UI. Lộ repository master key cần repo/key mới và backup sạch; đổi password wrapper không đủ.

**Bằng chứng:** Purpose/key version, custody, revocation và khôi phục; không dump secrets/finance vào báo cáo.

## RB-11 — Erase, revoke hoặc witness lỗi

**Điều kiện:** Profile recovery/erase đã được ủy quyền giữ identity của yêu cầu gốc.

**Thực hiện:** Deny local ngay. Retry đúng deny event tới witness; giữ deadline và danh sách children đã freeze. Purge active data và mọi bản sao đã kiểm kê; xác minh trước completion.

**Dừng khi:** Không bỏ deny để lấy availability, không reset mốc 35 ngày, không nhận hoàn tất khi pack còn dữ liệu.

**Bằng chứng:** Deadline gốc, receipt đã anchor, inventory/purge và giới hạn với thiết bị ngoài kiểm soát server.

## RB-12 — TLS, DNS, clock hoặc alerts lỗi

**Điều kiện:** Infrastructure operator có domain/trust đã xác minh.

**Thực hiện:** Đóng các luồng auth không an toàn. Sửa thời gian/cert/origin bằng nguồn tin cậy; kiểm truy cập ngoài và cảnh báo; đánh giá lại sessions/jobs đã hết hạn.

**Dừng khi:** Không tắt TLS/CSRF, kéo TTL, tin witness head cũ hoặc dùng domain mẫu làm domain thật.

**Bằng chứng:** Cert/time/origin và kết quả timeout, delivery, recovery của receiver.

## RB-13 — APK không tương thích, update hoặc queue gap

**Điều kiện:** Release/native support có channel và signing continuity đúng.

**Thực hiện:** Kiểm signer/hash/support; hướng dẫn update. Giữ identity queue; từ chối revision không hỗ trợ trước ACK. Re-enroll qua luồng owner, thể hiện khoảng trống dữ liệu.

**Dừng khi:** Không gán item cũ cho owner mới, phát debug APK thật, dùng remote URL tùy ý hoặc ép cài ngoài quyền OS. Không hứa cứu dữ liệu mất Keystore.

**Bằng chứng:** Thiết bị/OS/app versions, cài/update và các trường hợp gap bằng dữ liệu thử.

## RB-14 — Đóng sự cố và mở lại

**Điều kiện:** Incident operator có nguyên nhân đã sửa và kiểm tra mọi gate bị ảnh hưởng.

**Thực hiện:** Kiểm lại correctness/auth/replay/recovery; mở lại từng phần có kiểm soát. Ghi postmortem an toàn, bổ sung regression và cập nhật runbook.

**Dừng khi:** Critical chưa rõ, cross-tenant leak, sai sổ hoặc rủi ro erasure: giữ halted. Không nhận PASS vượt phạm vi đã thử.

**Bằng chứng:** Phạm vi/thời gian ảnh hưởng, dữ liệu mất/chưa biết, hành động sửa và evidence.
