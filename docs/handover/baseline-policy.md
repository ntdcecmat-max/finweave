# Chính sách baseline bàn giao

Package ID dùng `FW-HANDOVER-YYYYMMDD-rN`; revision đóng gói độc lập API semantic version. Working tree được review là source bàn giao, gồm modified/untracked và các deletion có sẵn. Commit HEAD là mốc Git tham chiếu; không đại diện đầy đủ implementation đang có. Không reset/restore, commit/push hoặc tạo tag để đóng gói.

SRS/BR/DR và AI-SPEC-001 là authority nghiệp vụ. `docs/contracts/v2/openapi.json` là canonical API đích; `tools/handover/build_data.py` là nguồn soạn physical model/001/dictionary/ERD trước lần triển khai đầu. SQL guards/security được review riêng. Frontend/admin/native TypeScript là implementation quan sát, có thể còn khác canonical. Derived schemas/examples/CSV phải được tạo cùng nguồn và validate; không chỉnh riêng để làm PASS.

API hiện là **2.0.0**, chưa có backend. Sửa metadata phụ thuộc bảng để phù hợp semantics đã quy định không đổi wire/DTO/enum/null/required/endpoint; giữ API version và lưu canonical before/after SHA + semantic diff, pin bytes mới trong package. Đổi hành vi hoặc wire shape sau này phải review compatibility, semantic version và migration riêng; thay đổi không tương thích cần major version. Không tăng API version chỉ vì đóng gói docs. Model artifact được định danh `FW-PHYS-SYNTHETIC-001`; migration IDs `001`–`003` đi cùng SHA256, **chưa chạy**. Sau execution, không sửa migration checksum lịch sử.

`persistenceTables` mô tả các bảng domain có thể đọc/ghi khi thực hiện operation, **không** phải quyền ghi tất cả bảng. Session/workspace authorization, history, preview và replay infrastructure được nêu riêng trong `persistenceScope`. API/data CSV phân loại DIRECT, NORMALIZED, PROJECTION_ENGINE, COMMAND_PARAMETER và FROZEN_CONTEXT_RESULT; tên field giống tên cột không đủ xác lập mapping.

Baseline r1/r2 giữ nguyên profile/trust và trạng thái lịch sử lúc seal. Working docs sau r2 theo [ADR-008 A + T1](../architecture/adr/ADR-008-modular-backend-trusted-server.md); protected ciphertext candidate là alternative, không gate T1. SEC-REAL-T1 không thể thay bằng artifact checks. SQL/domain/authorization/security/native vẫn chưa nghiệm thu; frontend r2 đã nghiệm thu synthetic checked-scope, không runtime/backend/T1 security. Không sửa snapshot để làm nó phù hợp quyết định mới; đóng revision tiếp theo khi cần.

Baseline đã seal được đọc bằng `baseline.py verify`; công cụ mới từ chối ghi vào revision đó. Lần kiểm tra mới phải tạo rN mới và giữ evidence cũ. `preserve.py`, `seal.py`, `audit-step6.ts`, `run-contracts.cjs` là tooling cũ có đường ghi evidence/artifact lịch sử; không dùng cho workflow mới. `bootstrap_contract.py` là soạn bản đầu, không phải generator cập nhật canonical.

Workflow từ root, dùng Python có dependency đúng `tools/handover/requirements.txt` và TypeScript/Zod đang được cài sẵn. Không cần sửa lockfile, chạy build hay cài dependency frontend:

```powershell
$package = 'FW-HANDOVER-20261008-r2' # chọn revision CHƯA tồn tại
$env:FW_HANDOVER_EVIDENCE = "docs/execution/evidence/$package"
python tools/handover/baseline.py prepare --package-id $package
node tools/handover/observe.cjs
node tools/handover/inventory.cjs
python tools/handover/baseline.py preserve --package-id $package
python tools/handover/derive_validate.py --evidence-dir $env:FW_HANDOVER_EVIDENCE
python tools/handover/baseline.py validate --package-id $package
# Review/cập nhật docs và README revision, rồi validate lại khi có thay đổi.
python tools/handover/baseline.py seal --package-id $package
python tools/handover/baseline.py verify --package-id $package
```

`prepare` ghi snapshot ban đầu một lần. `observe` chỉ đọc contracts/examples và xuất schema quan sát ra evidence mới; observer compilation cache ở work, không ở frontend. Inventory dùng TypeScript AST, ghi rõ dynamic dispatch và không suy runtime coverage. Physical generator được tái sinh trong thư mục tạm để so byte, không ghi đè SQL hiện hành. Không chạy migrations hoặc provider. `reconcile_metadata.py` chỉ là recipe errata đã review của r1, không dùng để bootstrap hoặc chạy lại tùy ý.

Seal đọc bytes một lần để đóng ZIP, kiểm lại hashes nguồn và artifact sau khi ghi. Source drift → BLOCKED_SOURCE_DRIFT; artifact/alignment FAIL → BLOCKED_ALIGNMENT. READY_LOCAL_SYNTHETIC_BASELINE chỉ xác nhận artifact bàn giao local synthetic. Manifest chứa hashes từng tệp và ZIP; SHA256SUMS chứa hash manifest/ZIP, tránh self-reference. Secrets/cache/node_modules/build bị loại khỏi payload; build được inventory riêng và không là source authority.
