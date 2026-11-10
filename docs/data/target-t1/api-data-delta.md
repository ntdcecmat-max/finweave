# API2.0.0 → D1 + J2 storage delta

08/10/2026 · **DESIGN OVERLAY, CONFORMANCE NOT RUN**. Canonical [133 operations](../../contracts/v2/operation-inventory.csv)/schemas giữ nguyên byte. [Overlay133 dòng](operation-storage-overlay.csv) bổ sung dependency thiết kế, không thay field mapping lịch sử hoặc chứng minh adapter/query đã chạy. API DTO là projection/application contract, không một DTO=một bảng.

| Consumer/workflow | Storage transformation đích | Wire/authority cần giữ |
| --- | --- | --- |
| User web/admin/native services | Core1.1.0 + operational prototype2.0.0 hiện có cần adapter→canonical2.0.0 | Không yêu cầu backend duy trì hybrid production chỉ để khớp prototype; không sửa frontend trong task docs |
| Ledger/Review/confirm/import | Narrow UnitOfWork writes sealed groups+lines+history+replay; tiền server/Engine tính | Existing expected versions/preview semantics vẫn bắt buộc; retries không duplicate effect |
| Plan items/actual linking | Resolve planning scope từ authorized item; frozen planning revision+item version | Không map bare planVersion thành unique global revision; DTO không cần biết storage PK mới |
| Agent/Plan–Goal confirmation | Run/tool context payload refs; revision history; owner confirm active bundle riêng | Agent chỉ draft, không actual/active plan confirm; Goal-first/Plan-first/standalone giữ đủ |
| Home/report/simulation | Snapshot refs identity + projection cache keyed query scope/asOf/versions | Cache expires không xóa pinned context; derived financialVersion/source quality đúng |
| Android notification/receipt | Device/restore epoch+transport dedupe; minimal evidence payload ref; J2 job | ACK receipt khác posting; revoke kiểm lại khi commit; raw/OTP bị loại trước server |
| Daily/manual price | refresh_jobs domain status + typed J2 dispatch; frozen quote/profile/FX | API quality derived at read; không đổi cash/quantity; last-good/error riêng |
| CSV | Preview identity/token/count/digest + import_rows stable row keys | Selected rows semantics giữ, file budget qua staging không nhét cả file vào JSON256KiB |
| Admin auth | OpsIdentity principal/session/MFA/challenge; customer sessions không Ops authority | Auth/step-up error and endpoint completeness rà ARCH-05/06; không tự giả thêm operations |
| Ops control | ops_control_requests + sanitized Ops projection + safe dispatcher | Admin không query raw finance/jobs payload, không impersonation/bypass revocation |
| Async internal | Registered job type → domain owner record, jobs/attempts unique dispatch authority | Internal worker identity/grants khác owner/admin/device, never trust caller-supplied role |
| Replay after response TTL | Tombstone command key/digest/committed refs giữ; expired body không trigger lại command | ARCH-05 chốt reconciliation/error DTO; không tự thêm error enum vào canonical artifact |
| Recovery/erasure/schema runner | Independent latest deletion/revoke checkpoints; epoch gates; migration_journal | Internal/runbook workflows; endpoints erasure/recovery/MFA nếu thiếu phải ghi gap ARCH-05/06/07, không coi133 là đủ tự động |

## Những điểm ARCH-05 phải chốt tiếp

1. Field-by-field mappings cho storage refs, enum/status/time/version/decimal bounds, paging, replay-expired/recovery fence/step-up errors; giữ semantic payload digest ổn định qua adapter.
2. T1 transport/auth semantics thay protected-only/anti-Ops wording còn trong canonical v2; cần reviewed revision cụ thể, không chỉ sửa version label. Payload schemas có thể giữ nhưng authorization/errors/transport phải đối chiếu.
3. Explicit admin authentication/MFA/session revoke, native reconciliation after restore, owner erasure/recovery flows có đủ operations/schema hay cần bổ sung; no feature cut.133 là inventory baseline, không giới hạn target.
4. Consumer calls→operation→field→authorized owner→tables→transaction/query→test mapping. Overlay hiện là dependency catalogue, không chứng minh toàn bộ JSON leaves đã map hoặc mọi table read/write hợp lệ theo role.

Quyết định D1/J2 không mở lại API version hybrid và không chứng nhận consumer/backend compatibility. Source snapshots r1/r2/canonical v2 baseline giữ nguyên; ARCH-05 làm working revision riêng khi chốt.
