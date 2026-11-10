# Engine và BE-03/04/06 — PostgreSQL local

Ngày 09/10/2026 · **EXECUTED_LOCAL_PASS** cho phạm vi dưới đây. T1 synthetic-local theo runtime hiện hữu; không bật REAL profile, cloud, provider feed hoặc frontend integration. User API đang chạy tại `http://127.0.0.1:4310`; PostgreSQL persistent bind IPv4 loopback ở cổng đã lưu trong `.local/runtime-state.json`.

## Kết quả triển khai

| Phần | Hành vi chạy thật |
| --- | --- |
| Engine | BigInt coefficient/rational arithmetic, VND integer 18 digits, quantity/price/FX decimal exact, valuation HALF_UP từng holding; không binary64 actual |
| BE-03 | Cash/bank/wallet, explicit opening/date, ledger mapping, balance từ sealed lines, tracking settings, archive giữ lịch sử và balance |
| BE-04 | Append-only event revisions, draft/pending/post, income/expense/transfer, fee riêng atomic, one-leg clearing/receiving confirm, refund/cap/link, reversal/replacement correction, category override, cash observation/owner resolution |
| BE-06 | Manual catalog/profile, preview/confirm, stock share/gold canonical chi, exact 1 lượng = 10 chỉ, ordered set/delta movements/backdate, cost basis audit, manual quote/FX valuation và lịch sử |
| Protocol | Workspace anchor, referenced object versions, subject/workspace/input/version-bound 5-minute previews, authorization trước replay, effect/history/version/replay cùng transaction |
| PostgreSQL | Runtime migration 005 additive, RLS, composite workspace FKs, JSON event reference guards, immutable history/mapping, sealed group append denial, deferred balance/posted-event/refund guards |

Opening dùng equity, không income; opening 0 không tạo zero posting group. Actual recorded expense được phép tạo balance âm. Investment cash và quantity atomic, không expense sinh hoạt. Cash count không tự posting. Giá chỉ đổi valuation, không cash/quantity. Refund linked giảm net expense, không income; late link chỉ reclassify đối ứng. Corrections giữ original và ghi exact reversal/replacement; cap dùng expense family còn hiệu lực.

SQL sử dụng unconstrained numeric cùng CHECK trước typmod rounding; mọi JSON financial values là string. Account declaration được reconcile đúng một lần khi upgrade runtime cũ. Migration journal/checksum không cho chạy lại opening hoặc sửa migration đã áp dụng.

## API contracts và chạy lại

[Contract thực thi](../contracts/local-finance/README.md), [OpenAPI 33 operations/147 schemas](../contracts/local-finance/openapi.json), [runtime preconditions](../contracts/local-finance/runtime-policy.json). Schemas/path giống API005 đã pin; inherited historical contract không bị sửa. Cả request/reply được validate, reply trước COMMIT.

Trong `finweave-backend`:

```powershell
node scripts/check.ts
node scripts/test-finance.ts
node scripts/test-runtime.ts
node scripts/build-finance-contract.ts
node scripts/verify-finance-evidence.ts
```

Oracle Python độc lập dùng standard-library `Decimal`, precision 100; không import Engine/SQL/frontend hoặc lấy balance dự kiến từ implementation. Mặc định dùng Python bundled; có thể đặt `FW_ORACLE_PYTHON` sang executable khác. PostgreSQL test clusters được tạo riêng và dừng sau test. Loopback phải được môi trường thực thi cho phép.

Persistent local, sau khi đã init:

```powershell
node scripts/local-runtime.ts start
node scripts/local-runtime.ts migrate
./scripts/start-finance-local.ps1
node scripts/smoke-finance-local.ts
```

Không chạy `start` khi cluster đang chạy; không mở thêm User API khi cổng 4310 đã dùng. API launcher chạy process ẩn và ghi logs/PID vào `.local/finance-service.json`. Startup PG đã được sửa để giữ đúng port của cluster, IPv4 loopback, UTC và max_connections thay vì rơi về port 5432 mặc định. Demo credentials chỉ lưu trong ignored local fixture, không nằm trong evidence.

## Evidence correctness và concurrency

[Financial evidence](evidence/backend-finance-local-2026-10-09/finance-1791544630640.json): **19 nhóm PASS**, 54 oracle actions, Node 24.19.0, PostgreSQL 16.14, source/SQL/contract hashes, 0 nhóm posting vi phạm balance. Hai backend PIDs độc lập **7016 và 13396** trong direct SQL refund race: một refund 75/100 committed, một refund 75 bị deferred cap reject với SQLSTATE23514.

| Kiểm chứng | Kết quả |
| --- | --- |
| Exact opening >2^53, zero opening | Giá trị exact; không income/double opening |
| Parallel same-key postDraft | Một group/effect, cả hai trả cùng committed result; changed payload cùng key bị409 |
| Different-key posting/refunds | Workspace serialization, một commit/một version conflict; fresh retry kiểm lại cap |
| Correction vs refund | Một winner; command thua re-preview bị cap reject nếu không còn hợp lệ |
| Unknown COMMIT / lost ACK | Suppress ACK sau COMMIT thật → unknown/committed; retry cùng key không thêm effect |
| Physical disconnect trước COMMIT | Backend connection bị terminate → unknown/not_found; connection hỏng bị loại và retry cùng key chỉ commit một lần |
| Lỗi sau ledger+quantity | Cash/quantity/version/history/replay rollback toàn bộ, cùng command retry thành công |
| Stale/mismatch/expired preview và catalog version | Bị reject trước effect; replay đã committed vẫn được trả |
| Cross-owner/reference | Account/transfer/refund/event references và reads bị deny; SQL trigger cũng từ chối khác workspace |
| Immutable/atomic SQL | Sealed append/update/delete, event delete, empty/unsealed COMMIT, TRUNCATE và posted event không group bị reject |
| Gold/stock/history | Conversion, backdated set/delta, HALF_UP/FX, manual price/cost không đổi cash/quantity; archive giữ facts |

Lost ACK được tiêm có kiểm soát ngay sau lệnh COMMIT thành công; disconnect dùng `pg_terminate_backend` thật. Đây là kiểm chứng fault trên PG local, không phải mô phỏng power loss/replication/HA.

[Persistent HTTP smoke](evidence/backend-finance-local-2026-10-09/local-smoke-1791544624543.json): đăng ký/xác minh owner thật với local mail sink → create workspace/account/opening → thu100/chi40/refund10 → stock2/price75. Balance **1070 VND**, quantity **2 share**, valuation **150 VND**, migration001…005 và PostgreSQL version được ghi trong evidence. Database và User API được giữ chạy sau smoke.

[Typecheck/pins/exact unit](evidence/backend-foundation-2026-10-09/checks-2026-10-09T11-16-22-826Z.json) PASS (32/32 unit tests). [Regression auth/API005/J2/recovery](evidence/backend-auth-local-2026-10-09/runtime-1791544350174.json) đã PASS 19 groups. `verify-finance-evidence.ts` kiểm các source hashes của run tài chính còn khớp và toàn bộ contract subset có thể compile độc lập.

## Phạm vi còn lại

Catalog hiện là explicit manual declarations; chưa có exchange catalog/provider refresh/entitlement BE-07. Transfer/investment correction, sale/shorting/corporate actions và Review branches ingestion không được mở bằng input ngoài contract; trả ACTION_NOT_ALLOWED. Account opening là immutable baseline, contract hiện không có port chỉnh baseline. Account create/archive history persist append-only trong SQL; transaction/holding/quote/Review history có read API theo API005. Snapshot pagination yêu cầu client gửi snapshotVersion để phát hiện thay đổi; chưa cung cấp historical snapshot materialization BE-05. Forecast/Planning/Agent/native/import/frontend binding nằm ngoài gói này và không được nghiệm thu từ kết quả finance local.

[Source/contract audit cuối](evidence/backend-finance-local-2026-10-09/source-contract-audit-1791544640387.json): 35 source hashes còn khớp, 33 operations/147 schemas compile độc lập; overflow valuation bị từ chối trong preview và reversal không thể bị correction lại.
