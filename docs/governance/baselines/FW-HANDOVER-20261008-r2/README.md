# FW-HANDOVER-20261008-r2 — ghi nhận frontend đã kiểm

08/10/2026 · Asia/Saigon · **RECORDED_FRONTEND_SYNTHETIC_CHECKED_SCOPE** sau khi manifest và kiểm tra đóng gói đạt.

Revision này bổ sung source và bằng chứng frontend vào [hồ sơ r1](../FW-HANDOVER-20261008-r1/README.md), giữ nguyên snapshot r1. Đây là mốc ghi nhận frontend synthetic trong phạm vi đã kiểm, không phải nghiệm thu toàn bộ v3 hoặc lần xác nhận mới cho mọi mapping API/schema.

## Phạm vi ghi nhận

- [Báo cáo nghiệm thu](../../../testing/frontend-acceptance-report.md): **PASS_FRONTEND_SYNTHETIC_CHECKED_SCOPE**; v3 vẫn PARTIAL.
- [Browser acceptance-2](../../../execution/evidence/frontend-review-2026-10-08/acceptance-2/browser-results.json): 67/67 PASS trong một lượt đầy đủ, 0 FAIL/SKIP/FLAKY, không retry.
- [Unit](../../../execution/evidence/frontend-review-2026-10-08/acceptance-2/unit-results.json): 131/131 PASS. [Kiểm tra/build](../../../execution/evidence/frontend-review-2026-10-08/acceptance-2/checks.json): typecheck, lint, user/admin build và source audit exit 0.
- 174 tệp trong manifest source của lượt nghiệm thu được đối chiếu với source-before-run và workspace. 37 tệp tài liệu trong manifest hoàn tất cũng được đối chiếu. Toàn bộ source/config/assets/tests/tooling frontend được inventory riêng; không suy rằng mọi tệp hoặc mọi nhánh đều được test.
- [Catalogue](../../../design/interface-catalogue.md): 50 mục giao diện. [RTM](../../../execution/realignment-traceability.md): 41 parent AC; [UI RTM](../../../design/ui-requirement-traceability.md): 26 nhóm UI-AC, phân biệt CHECKED_SUBSET/NOT_RUN.

Source được chọn là working tree gồm modified/untracked; HEAD chỉ là mốc tham chiếu, không thay thế manifest. [Source baseline](../../../execution/evidence/FW-HANDOVER-20261008-r2/source-baseline.json), [thay đổi so với r1](../../../execution/evidence/FW-HANDOVER-20261008-r2/changes-from-r1.json) và [kiểm tra ghi nhận](../../../execution/evidence/FW-HANDOVER-20261008-r2/record-validation.json) nằm trong payload. Tác nhân thay đổi không suy từ checksum.

## Quan hệ với r1 và giới hạn

API đích vẫn **2.0.0**; physical artifact **FW-PHYS-SYNTHETIC-001**, migrations **001–003**. Bytes API/model/migrations được đối chiếu với r1, không thay phiên bản. R1 tiếp tục là mốc review hợp đồng/schema; mapping consumer là backlog cần kiểm lại khi triển khai adapters. Core/identity runtime vẫn 1.1.0, operational prototype nhãn 2.0.0 khác canonical target; admin dùng memory gateway, native mới bridge interface.

Không chạy lại tests/build trong task ghi nhận này; kết quả được kế thừa từ acceptance-2 và đối chiếu source hashes. SQL execution, backend/auth thật, canonical v2 integration, APK/Kotlin/device tests, Agent/model thật, provider/daily jobs, security/Anti-Ops/recovery và human UAT vẫn chưa nghiệm thu. Hashes không thay chữ ký PO hoặc chứng nhận bảo mật. Historical FAIL và evidence các lần trước giữ nguyên.

## Đóng gói và kiểm lại

[Manifest](manifest.json) pin từng tệp source/docs/evidence, API/model/migrations và parent r1. [SHA256SUMS](SHA256SUMS.txt) pin manifest và [payload ZIP](payload.zip). ZIP chứa final run và screenshots, raw/log/JSON điều tra cũ; không nhân bản toàn bộ media/trace diagnostic cũ. Secrets, dependencies cài sẵn, cache và build output không đóng gói; build output chỉ là inventory.

Giải nén payload vào thư mục trống riêng, không ghi đè workspace. Giữ manifest/SHA256SUMS cạnh payload; parent r1 payload giữ ở thư mục gốc của nó. Một số tài liệu lịch sử còn liên kết tới original đã xóa hoặc media diagnostic ngoài gói; đó không phải bằng chứng runtime mới.

Từ root repository, dùng Python runtime có sẵn:

```powershell
python tools/handover/record_frontend.py verify --package-id FW-HANDOVER-20261008-r2
```

Verifier so ZIP và workspace với manifest, đồng thời kiểm snapshot r1. Workspace đổi tiếp thì báo drift, tạo revision mới nếu cần bàn giao; không sửa manifest r2 đã seal. Bước tiếp theo: PostgreSQL disposable/migration và backend local synthetic, giữ các gate dữ liệu thật.
