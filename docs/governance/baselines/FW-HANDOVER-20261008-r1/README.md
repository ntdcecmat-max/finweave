# FW-HANDOVER-20261008-r1

08/10/2026 · Asia/Saigon · **READY_LOCAL_SYNTHETIC_BASELINE** sau khi các kiểm tra và seal trong manifest đạt. Trạng thái machine-readable và thời điểm chốt chính xác ở [manifest.json](manifest.json); [SHA256SUMS](SHA256SUMS.txt) kiểm manifest và [payload.zip](payload.zip).

Source được chọn: working tree đã review, gồm thay đổi chưa commit và tệp untracked, trên HEAD `fac053c5ccb7c7792feb5325409e68974b8aad84`. Không lấy HEAD hoặc bản archive thay source đang có. [Source baseline](../../../execution/evidence/FW-HANDOVER-20261008-r1/source-baseline.json) ghi Git status/deletions, source/config/lock/assets SHA256 và output build riêng. [Preservation](../../../execution/evidence/FW-HANDOVER-20261008-r1/frontend-preservation.json) chỉ nói khoảng thời gian revision này.

API target **2.0.0**, canonical [OpenAPI](../../../contracts/v2/openapi.json). Model artifact **FW-PHYS-SYNTHETIC-001**, PostgreSQL synthetic profile, migrations **001/002/003** chưa chạy; checksum từng migration trong manifest. Metadata phụ thuộc bảng được sửa, wire/DTO giữ nguyên. Package r1 không đổi API semantic version chỉ vì đóng gói.

Đọc [review report](review-report.md), [changelog](CHANGELOG.md), [consumer mapping](../../../contracts/v2/consumer-operation-mapping.csv), [storage transformations](../../../contracts/v2/storage-field-mapping.csv) và [chính sách/cách kiểm lại](../../../handover/baseline-policy.md). MISSING trong mapping là implementation/backend chưa có, không được ghi thành capability đã chạy. Không có consumer nào được công nhận đã chuyển trọn sang target chỉ vì DTO giống nhau.

Payload là snapshot source và tài liệu theo đường dẫn tương đối root repo, có các tài liệu nghiệp vụ kế thừa và file evidence được liên kết. Giải nén vào thư mục trống riêng để review, không giải nén đè working tree hiện tại. Giữ manifest/SHA256SUMS cùng payload; khi cần duyệt các link seal trong bản giải nén, đặt các companion files vào `docs/governance/baselines/FW-HANDOVER-20261008-r1/`. Bulk browser trace/video không được dẫn trực tiếp không đóng gói. Frozen archives có thể giữ link tới original đã xóa; đó là lịch sử, không phục hồi thành source hiện hành.

Kiểm từ workspace: `python tools/handover/baseline.py verify --package-id FW-HANDOVER-20261008-r1`. Công cụ so cả bytes trong ZIP lẫn working files; nếu người dùng sửa tiếp, workspace drift là bình thường và cần revision mới, không sửa manifest đã seal.

Phạm vi có thể bàn giao: bắt đầu xây backend local synthetic, domain/authorization/concurrency tests, adapters và native PoC theo gaps. **Chưa nghiệm thu frontend, chưa chạy migration/domain/authorization/security/device suites; không production-ready.** Historical preservation FAIL được giữ nguyên và reconciliation r1 không chứng minh task trước không thay frontend.
