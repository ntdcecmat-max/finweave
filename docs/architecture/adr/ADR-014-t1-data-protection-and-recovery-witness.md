# ADR-014 — Bảo vệ dữ liệu T1, backup và witness độc lập

09/10/2026 · **ACCEPTED DESIGN theo hướng đã được ủy quyền; IMPLEMENTATION NOT RUN**.

## Bối cảnh

A+T1, S1+P2, I0+I1, D1+J2 và auth ARCH-06 đã được chọn. Cần làm rõ custody khóa, backup/restore và xóa dữ liệu. Journal nằm trong DB cũ không chứng minh lệnh thu hồi/xóa mới nhất; lịch 7 bản ngày / 4 bản tuần cũng không tự bảo đảm xóa trong 35 ngày. Free-first không có nghĩa endpoint backup và recovery keys đã sẵn sàng.

## Quyết định

- Secret files và quyền riêng theo process, storage mã hóa, runtime không root. Không thêm paid KMS/Vault cluster. T1 vẫn tin root/DBA/runtime/custodians; RLS không chống process đã chiếm DB authority. Secret/auth AEAD theo ARCH-06; tài chính giữ cấu trúc PostgreSQL hiện hành.
- Export PostgreSQL nhất quán hằng ngày vào repository restic mã hóa ngoài host. Source writer chỉ append; credential prune giữ riêng. Recovery capsule mã hóa bằng age, khóa recipient offline riêng. Destination, capacity, versions và availability chưa provision.
- Witness độc lập nhận metadata thu hồi/xóa có chữ ký. Chặn local trước; chỉ ACK hoàn tất an toàn cho recovery sau durable receipt. Head mới nhất phải gắn nonce mới; gọi network ngoài DB transaction; retry đúng lệnh gốc. Epoch của từng target và sequence của witness là hai bộ đếm riêng; publication sai thứ tự không làm giảm deny floor.
- Restore giữ LOCKED: chặn host cũ, kiểm witness/keys/chain mới nhất, áp dụng deny trước đọc tài chính, vô hiệu hóa sessions/challenges/codes/replay/devices/bindings cũ. Owner reset mật khẩu mới, admin provision factors lại. Thiếu bằng chứng thì không mở hệ thống.
- Ưu tiên 7 bản ngày / 4 bản tuần trong tuổi snapshot tối đa 34 ngày, prune dữ liệu không tham chiếu trong 24 giờ. Xóa mọi bản sao do server kiểm soát trong 35 ngày từ yêu cầu gốc phải có inventory và bằng chứng; không tự complete theo clock.
- API002 giữ nguyên 147 operations / 600 schemas; pin thêm security profile và schema đích qua [bundle](../../security/t1/implementation-bundle.json). Thêm 2 bảng điều khiển và 12 trường vào bảng hiện có; không sửa package auth 82 bảng hoặc snapshots. Không tự thêm public erase endpoint.

## Alternatives và hệ quả

Journal local hoặc bản sao journal chỉ cập nhật hằng ngày không đủ làm authority mới nhất khi restore. Witness cùng VM dùng được cho synthetic spike, nhưng không chứng minh tính độc lập. Paid KMS, managed storage hoặc HA cần review chi phí/điều khoản riêng, không được tự bật.

Witness và repository ngoài host chưa có nên gate real còn mở. Witness lỗi có thể làm reset/revoke chờ xác nhận hoàn tất, nhưng không được rollback deny local. Secret files và mở LUKS thủ công giảm dependencies, đồng thời cần operator sau reboot/restore. Repository dùng khóa chung không xóa riêng một owner tức thì; phải prune và kiểm mọi bản sao. Lộ master key cần repository mới, không chỉ đổi password. Giữ đủ mọi tính năng trong backlog.

## Hồ sơ và bằng chứng

[Hồ sơ bảo mật](../../security/t1/README.md), [migration plan](../../data/target-t1-security/migration-plan.md), [32 ca nghiệm thu](../../security/t1/acceptance-plan.md), [báo cáo thay đổi](../ARCH-07-change-report.md). Nguồn chính thức nằm trong từng đặc tả. Static PASS không phải nghiệm thu security/backend/SQL/native/vendor/backup/restore. Tiếp theo ARCH-08 Engine/domain.
