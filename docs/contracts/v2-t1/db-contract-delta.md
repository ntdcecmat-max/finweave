# T1 contract → D1/J2 storage và identity follow-up

08/10/2026 · **DESIGN DELTA; SQL NOT IMPLEMENTED**. [D1/J2 target](../../data/target-t1/README.md) giữ nguyên hashes trong lượt này.141 operations tiếp nối overlay133 baseline; bảng dependencies mới không tự là grants, không phải mọi bảng sẽ được ghi.

| Contract | Owner/storage | Ràng buộc |
| --- | --- | --- |
| Admin auth/signout | OpsIdentity admin_principals/sessions/challenges/mfa_factors | Thay identities/sessions customer dependency của baseline; actual credential mechanism và step-up/recovery ARCH-06 |
| Native verify/renew | Identity identities/identity_challenges/sessions | Session family/access+refresh digest/expiry/purpose/rotation còn cần DB delta ARCH-06; không lưu token rõ vào payload_objects hoặc idempotency body90d |
| Collector challenge/issue | Identity devices + identity_challenges + workspace epochs | Purpose riêng collector credential, nonce/public-key proof/consume-once; token digest/expiry/audience/epoch storage phải bổ sung trong ARCH-06 migrations design |
| Notification intake | Ingestion receipts capture_epoch + workspaces.recovery_epoch + payload_objects | deviceEpoch→capture_epoch; recoveryEpoch là precondition; normalizedEvidence→payload_objects.content qua receipt ref, không kéo raw/OTP vào server |
| reconcileReceipts | Ingestion scoped receipt identity/digest + device/workspace checks | Chỉ same device/epoch, không trả finance body. Independent off-host recovery journal và native replay horizon không được endpoint này tự giải quyết |
| Owner outcome | SharedTX idempotency_records + payload refs | Own principal+workspace+operation+key; expired body vẫn committed tombstone; reference không tùy ý dereference qua generic API |
| Ops outcome | Ops ops_idempotency | Ops principal/version scope riêng, không user replay table |
| Plan actual linking | Planning scope/revisions/items + actual_links | Input có planItemId/version, không planVersion; resolve frozen revision ID dưới scope lock, không fabricate payload field |
| Market/history/cache | Frozen quote/profile/FX + pinned snapshot refs + projection_cache | Freshness computed asOf, cache key đủscope/period/versions; price không actual writes |
| Internal execution | Typed jobs/attempts + receipt/refresh/import/run domain records | workspace+dispatchJobId+generation/token/epoch+domain ID; different IDs không đồng nghĩa bằng nhau; một lease authority |
| Retention | payload_objects/import_rows/projection_cache | Narrow expiry/redaction giữ pins/FKs/replay tombstones; erasure privileged workflow riêng |

## Các field/storage cần ARCH-06 chốt trước backend auth

- sessions: browser/native session kind, family identity, access/refresh credential digests/expiries, generation/reuse/last-use/absolute/idle limits, revoke reason/epoch; default-deny role separation. Có thể tách credential family bảng riêng nếu cần history, không coi một token_digest cũ đã đủ rotation.
- identity_challenges: flow purpose browser/native/enrollment/collector_token, nonce digest/key binding/owner/device/workspace/epoch refs, bounded attempts/expiry/atomic consumed marker; no raw challenge/token/proof logs. Existing purpose enum phải migrate có reviewed delta, không gán collector proof thành enrollment challenge.
- devices: collector credential digest/purpose/expiry/issue epoch/revoke, hoặc riêng credential table nếu nhiều generation cần retention; proof algorithm/key encoding/nonce canonicalization và key rotation/recovery ARCH-06/10.
- auth short-lived encrypted replay: riêng credential response retention/access policy; nếu chọn storage mới phải bổ sung model/ERD/dictionary/migration design thay vì dùng generic finance result TTL. Không tuyên bố target70-table expand đã đủ auth implementation.

Owner manual quote cần approved manual-source entitlement scope, không credential của licensed provider giả. ARCH-11 rà quyền nguồn và delta fields/constraints nếu registry hiện tại chưa biểu diễn manual source không external secret; adapter không tự tạo entitlement từ free text. Real manual use vẫn chờ SEC-REAL-T1, local vẫn synthetic.

Đây là required follow-up, không API implementation PASS. D1 cho phép migrations tiếp nối và schema review có delta; không rewrite001–003 hoặc target package đã chốt để che lịch sử.41 parent AC/full-feature backlog giữ nguyên; operation count tăng không tự tạo thêm AC cấp sản phẩm.
