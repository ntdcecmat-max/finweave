# BE-16 — Admin services, quyền và safe controls

11/10/2026 · **LOCAL_POSTGRES_BE16_IMPLEMENTED** · `FW-OPS-001`.
Backend phục vụ đủ **14 operations / 7 màn admin**, không sửa giao diện hay nối
gateway mock. [Contract](../contracts/local-ops/README.md),
[mapping với catalogue](../contracts/local-ops/catalogue-mapping.json),
[runbook](../../finweave-backend/OPS.md).

## Kết quả

- Auth/MFA/sign-out/step-up dùng OpsIdentity thật. Pool metadata riêng
  `fw_runtime_ops_business` không SELECT password/seed/session/replay credentials.
  Startup từ chối superuser, BYPASSRLS, CREATEROLE/CREATEDB/REPLICATION, quyền
  owner/worker ghép thêm, finance/schema-create capabilities.
- Overview/accounts/devices/sources/jobs/quotas dùng projection live PostgreSQL;
  chỉ trường DTO được duyệt, mã opaque, mã lỗi được lọc. Device app version chỉ
  trả numeric version hoặc version được host khai báo; heartbeat chưa biết trả
  null/unknown. Quotas dùng reservation counter thật, không credential namespace.
- Releases/incidents đọc storage metadata riêng; artifact chưa verified không có
  download link. Không giả bằng chứng release/device/provider. Audit append-only
  có acceptance và broker disposition, không chứa lý do tự do hoặc private audit.
- Preview buộc phiên MFA mới, reason enum, eligible state/version; token/digest
  khóa action/reason/session/recovery epoch và expires sau 5 phút. Confirm kiểm
  lại Ops/object version, consume preview, commit control/audit/replay/journal
  trong một transaction. Cursor gắn actor/resource/page size/live digest và TTL.
- Confirm trả **202 accepted**; worker ingestion/market mới kiểm lại quyền và
  áp dụng/reject. Retry theo policy hiện có, không reset attempts/retry cycles,
  deadline, provider quota/cooldown hay domain budget; không có generic retry
  cho import/Agent/Forecast hoặc force-success. Unknown provider intent và prior
  committed outcome từ chối retry.
- Disable source ghi pause bền vững và version change; claim/publication đều
  bị fence, source lock phân định publication đã commit trước pause với
  publication bị chặn sau pause. Giữ receipts/history, không kéo dài deadline.
- Mất ACK COMMIT trả `OUTCOME_UNKNOWN/outcome=unknown`. Lookup journal trả
  `committed` riêng với `controlDisposition=accepted/applied/rejected`. Khi body
  replay hết hạn, marker vẫn chứng minh committed; không enqueue/post lại.

## Kiểm chứng và giới hạn

`node scripts/test-ops.ts`: **9 nhóm integration** với Fastify HTTP, PostgreSQL
16.14 và các SQL login thật. Kiểm tất cả admin services trước auth, TOTP race,
schema/origin/CSRF/freshness, private-data sentinels/opaque IDs, SQL permission
denials, tampered preview/version/expiry, 10 concurrent exact retries, committed
tombstone, cross-admin outcome/preview isolation, owner revoke sau acceptance,
broker rejection, durable pause và cursor stale. Kiểm DB role bị cấp worker và
CREATEROLE sai profile bị startup từ chối. Test negative gọi finance/owner API,
private prompt/evidence/credential tables, direct retry broker, role switching,
audit rewrite và root/deploy/migrate/restore/prune/impersonation routes.

`node --test tests/ops-outcome.test.ts`: **2 tests** cho lost COMMIT ACK không
rerun command và response validation failure rollback trước commit.
`node scripts/test-runtime.ts`: **19 nhóm PASS** regression auth/J2/recovery.
`node scripts/test-async.ts`: **17 nhóm PASS** regression receipt/price/quota/lease/scheduler.
Typecheck, 2 outcome unit tests và historical API005/DB005/native pins đều PASS.

Evidence source cuối: [Ops 9 nhóm](evidence/backend-ops-local-2026-10-11/ops-1791730662307.json),
[auth/J2 19 nhóm](evidence/backend-auth-local-2026-10-09/runtime-1791730675026.json),
[async 17 nhóm](evidence/backend-async-local-2026-10-09/async-1791730684458.json).
Verifier đối chiếu **20 source/contract hashes**, 14 operations và 7 screen IDs PASS.

Evidence raw theo lượt chạy nằm ở
[Ops evidence](evidence/backend-ops-local-2026-10-11/).
`node scripts/verify-ops-evidence.ts` kiểm hash source của lượt PASS mới nhất,
contract hash và coverage đủ 14 operations / 7 screens. Evidence thất bại trước
sửa được giữ nguyên; không dùng lượt PASS có hash source cũ làm nghiệm thu source
hiện hành. Cluster test được dừng trong `finally`.

BE-19 frontend adapter/auth form/reason mapping/outcome display còn pending theo
phạm vi task. Môi trường synthetic-local dùng service/credentials/DB thực; REAL,
source/model/provider production, full product UAT, infrastructure deploy,
backup/witness external và device testing không được tự bật hoặc nhận PASS.
