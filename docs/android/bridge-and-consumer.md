# Native bridge2, API004 consumer mapping

Source hiện tại `finweave-web/src/native/collector.ts` có strict Zod NativeStatus, bảy methods, `window.Capacitor.Plugins.FinWeaveCollector`, consent literal2026-10-08; `capacitor.config.json` appId test.finweave.prototype/webDir dist. package.json chưa có Capacitor; chưa có Gradle native project ở frontend. Các source hashes trong evidence. **Không sửa source/dependencies ở ARCH10**.

Bridge revision `FW-NATIVE-BRIDGE-002` là hợp đồng nội bộ JS↔Kotlin, **không đổi API contractVersion/revision004**. Khi implementation dùng Capacitor registration/proxy hỗ trợ8.x và typed adapter; legacy global access không được giả có native vì wrapper tồn tại. Handshake `getCapabilities` kiểm bridge/API revision/profile/native build trước enable collector, mismatch→UPDATE_REQUIRED/manual mode. Browser web mock giữ fixture label, không giả listener granted trên Android thật. Không đặt rich v2 status trực tiếp vào strict NativeStatus cũ; adapter xuất chính xác legacy keys, không thêm unknown properties. `getStatusV2` là method riêng có schema.

| Legacy method | Native2 mapping / authority |
| --- | --- |
| getStatus | NativeStatus cũ projected từ v2; granted chỉ OS grant, readiness phải xem listenerBound/vault/clock/authorization riêng; queue≤100 + truncated flag hiển thị qua adapter v2 |
| acceptDisclosure({version}) | So sánh đúng release-required consent, user action + stored timestamp; version cũ không tự được nâng, CONSENT_UPDATE_REQUIRED |
| openNotificationSettings | Chỉ OS settings handoff, không tự grant; check permission/bound after resume |
| setSources({packages}) | Legacy selection request only; native resolve catalog + live server bindings. Mapping chưa đủ trả BINDING_REQUIRED, không tự map account đầu |
| stopAndQuarantine | Immediate local fence/cancel/quarantine, không khẳng định server consent/device revoked |
| retryQueue | Same scope + exact event/revision/digest, no reset expiry/epoch/attempt identity, serverRetryAfter floor |
| deleteQuarantined({reason}) | Current vault only, native confirmation count/interval/loss, no other-owner delete/no server actual delete |

Native2 thêm `getCapabilities`, `getStatusV2`, `listQueue`, `configureCapture` và native identity/typed owner invocation. [JSON schemas](native-bridge-schemas.json) quy định shape, bounded pages/enum; [operation map](consumer-operation-map.json) phân generic owner vs native managed handlers vs collector. Page cursors opaque current vault+generation bound, change generation invalidates, no unbounded status queue. Required broker inputs API004 validated against pinned schemas. Local vault/capture generation không field mới được tự thêm vào API004 envelope; strip local fields and inject exact revision/requestId/idempotency/proofs as spec.

Native identity methods get operation-specific input, credentials inserted natively, secret-bearing responses consumed in vault and projected secret-free session status; no generic fetch/sign/readKeystore. register/enroll/issue handlers build collector proof natively, not JS-supplied proof. Generic owner map excludes browser renewSession/verifyIdentityChallenge, minting/recovery-code paths, admin and internal ops. All feature operations còn lại giữ đầy đủ; currently frontend session headers/mock remain separate until real adapter implementation. Recovery codes shown native secure owner UI only with reauth, no logging/screenshots.

[Managed handler contract](managed-handler-contract.json) liệt kê chính xác15auth/enrollment operations: fields UI được gửi, fields chỉ native dialog, fields native inject, response fields native consume và projection được trả JS. Password/code FinWeave từ UI không được persist/log; không liên quan OTP ngân hàng bị listener loại. flowId opaque scope/generation/purpose/expiry-bound thay server challengeId; final wire input vẫn validate API004. Native inject actual platform/appVersion/accepted consent/public keys/proofs/session/device/resetToken, reject JS overrides. Recovery resetToken không vào JS/deep-link WebView; native verified link/dialog handler giữ token, host REAL cần xác minh. Logout local fence chạy trước request, không đợi HTTP thành công mới ngăn upload.

## WebView boundary

Only bundled main-frame application origin, deny remote navigation/iframes/remote executable scripts/mixed/file/content access; external links in system browser/Custom Tab without FinWeave bridge. Native WebView client checks navigation/resource allowlist, CSP no unsafe remote execution, no arbitrary JS messaging from all frames. Release no web debugging/server.url/dynamic remote code. All bridge calls verify current foreground owner session/native generation and capability, schema, payload bounds; background uploader not accessible through arbitrary JS endpoint. Do not trust caller-provided headers/role/ownerId/url; backend current authorization independent.

[Native bridge risks](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges): origin restrictions reduce remote injection but **same-origin XSS vẫn có thể gọi owner capabilities**. Token kept native không bảo đảm XSS không đọc owner business data/call normal actions. High-risk commit/delete/config needs server fresh reauth + native trusted confirmation bound exact operation/input digest/generation, never approve previous dialog for modified JS input. This is defense in depth, not proof against fully compromised native process. No bridge capability makes agent auto-post actual.

## Status/error contract

Status includes observed timestamps and uncertainty; READY requires all prerequisites, no UI derivation from granted/enrolled booleans alone. Errors include NATIVE_UNAVAILABLE, UPDATE_REQUIRED, CONSENT_UPDATE_REQUIRED, PERMISSION_DENIED, LISTENER_UNBOUND, BINDING_REQUIRED, OWNER_MISMATCH, REAUTH_REQUIRED, CLOCK_UNTRUSTED, QUEUE_FULL, KEY_UNAVAILABLE, EPOCH_CHANGED, EXPIRED, NETWORK_WAIT, SERVER_RETRY_AFTER, INTEGRITY_FAILED. User action descriptions from bounded enums, no raw exceptions/text/SQL/server secrets. API business reply/version/cache ordering theo ARCH09, ACK riêng actual, local key doesn't confer server authorization.
