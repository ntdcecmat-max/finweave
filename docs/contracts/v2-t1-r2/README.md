# API T1 — revision002 / identity

08/10/2026 · **FW-API-T1-D1J2-002 — ACCEPTED DESIGN / IMPLEMENTATION NOT RUN**. Payload contractVersion=2.0.0 **unreleased**; required X-FW-Contract-Revision exact002 và pin [OpenAPI SHA256](revision.json). Không tương thích chỉ vì cùng nhãn2.0.0. Published breaking changes cần API version mới.

[OpenAPI](openapi.json) là toàn bộ target147operations/600schemas, không chỉ patch. Giữ đủ141 operations của [revision001](../v2-t1/README.md), thêm6: requestOwnerReauthentication, verifyOwnerReauthentication, adminReauthenticate, rotateOwnerRecoveryCodes, redeemOwnerRecoveryCode, renewCollectorCredential. [Diff](revision-diff.json) liệt kê16schemas cũ thay đổi và wire policies. [Schemas](schemas.json) được trích cùng OpenAPI, không nguồn chỉnh tay thứ hai.

Các thay đổi bắt buộc adapter: cookies __Host-, password15–128, installationPublicKey=null(web)/SPKI(android), signIn/register output nonce+channel, native proof header, native-only collector enrollment, nullable session.deviceId, reauth/recovery/collector renewal mới. DeviceBearer chỉ ingest/reconcile; DeviceRenewalBearer+collector proof chỉ renew; OwnerBearer/NativeRefreshBearer vẫn tách quyền. Không sửa frontend ở bước này.

[Identity protocol](../../security/identity/identity-access-design.md), [147 operation permissions](../../security/identity/operation-permissions.csv), [identity DB](../../data/target-t1-auth/README.md), [acceptance](../../security/identity/acceptance-plan.md) là phần hợp đồng. [ARCH-05 semantics](../v2-t1/semantics.md) tiếp tục áp dụng về domain/version/money/cache/replay/outcome/ACK/typed jobs khi không bị identity002 thay; các mục auth/storage/credential follow-up06 đã được cụ thể hóa ở bộ này.

Consumer mappings/field inventory ARCH-05 là evidence source lúc001, **không tự nhận đã regenerated hoặc matched002**. Sáu operations mới chưa có frontend call site; compatibility-delta.md chỉ rõ pending integration. Không claim147 endpoints đã implement hoặc mappings thành SQL. Baseline v2,001,r1/r2 và target DB D1/J2 giữ nguyên.

Validation tại [ARCH-06 evidence](../../execution/evidence/arch-06-identity-2026-10-08/validation.json); schema/rules/hash PASS không là backend/crypto/Android/auth/mail/security PASS. Local synthetic trước; real yêu cầu SEC-REAL-T1 và AUTH-MAIL-REAL.
