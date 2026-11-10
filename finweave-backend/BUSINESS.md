# BE-05/09/10/11/12/13 — API và PostgreSQL

Runtime local có Home/reports/portfolio/insights, CSV, Review, Plan, Goals, simulation và forecast. Các read/write đi qua Fastify, AJV, credential owner và PostgreSQL; dữ liệu không nằm trong mock frontend. Không thêm màn Báo cáo. [Contract](../docs/contracts/local-business/README.md), [mapping 41 AC](../docs/execution/backend-business-ac41.csv) và [báo cáo](../docs/execution/backend-business-local-2026-10-10.md).

## Chạy lại

Node 24.19.x, dependencies theo lockfile. PostgreSQL 16.14 bundled; không cần database/cloud/provider ngoài máy. Python bundled dùng cho oracle tài chính; đặt `FW_ORACLE_PYTHON` nếu dùng executable khác.

```powershell
node scripts/check-business.ts
node scripts/test-business.ts
node scripts/test-finance.ts
node scripts/test-async.ts
node scripts/test-runtime.ts
node scripts/build-business-contract.ts
node scripts/verify-business-evidence.ts
```

Mỗi integration suite tạo database/roles riêng trong `.local`, rồi dừng cluster trong `finally`. Test atomic import chủ động tạo lỗi ở posting thứ hai; không chạy fixture lỗi này trên database dùng chung. Evidence có source hashes và trạng thái riêng, không ghi đè các lần thất bại trước.

Persistent runtime đã được cấu hình: chạy `node scripts/local-runtime.ts migrate` trước khi khởi động lại User API và hai profiles `ingestion`, `forecast`, theo [RUNTIME.md](RUNTIME.md). Một DB đã ghi checksum migration 007 khác không được sửa journal để ép tiếp tục; dùng database mới hoặc migration nâng cấp có version riêng. Bộ test dùng clean database. Không có SQL/manual fixture cần owner tự thực hiện để làm nghiệp vụ chạy.

Chạy local dịch vụ đã cấu hình:

```powershell
./scripts/start-business-local.ps1 -Restart
node scripts/smoke-business-local.ts
```

User API ở `http://127.0.0.1:4310`; ingestion/forecast process riêng và ẩn. Smoke chạy TCP, CSV worker và forecast worker trên dữ liệu synthetic; credentials fixture chỉ ở ignored `.local`.

## Protocol

Owner cookie/CSRF/Origin hoặc native owner credentials; header `X-FW-Contract-Revision: FW-API-T1-D1J2-005`. Response thêm `X-FW-Business-Revision: FW-BUSINESS-001`; canonical API005/DB005/native003 giữ nguyên byte. Local extension routes dưới `/v2/business/`; mọi canonical route vẫn `/v2/operations/`.

Plan/Goal và Review mutations dùng `previewMutation`, token 5 phút, expected workspace/object versions, rồi confirm chính input với key command riêng. Replay đã committed được xét trước freshness/version, sau current authorization. Phải giữ nguyên key/payload khi mất response; `getCommandOutcome` xác định kết quả. Simulate/start forecast/cancel forecast không cần preview token, vẫn kiểm command versions/replay.

CSV preview là query có staging, không ghi actual. Gửi expected workspace version trong input; confirm có command envelope, preview token, account version và selected row IDs. Token 24 giờ, tối đa 1.000 rows/file, 100 selected rows/job. Signed integer hoặc debit/credit, UTF-8, hai date formats; quote/newline/CRLF được parse đúng. Worker chỉ đọc selected pins, recheck dedupe/current authority, ghi trọn bundle hoặc rollback trọn bundle. Invalid/collision thành Review. Retry chỉ nhận failed transient/expired lease, giữ nguyên input/deadline và có cap; không nhập lại từ CSV.

Home/report/portfolio trả cùng projection. Dùng `context.snapshotVersion` đã nhận cho chart/table/detail và paging; các detail/list Plan/Goal cũng nhận optional context. Closure bao gồm ledger/event heads, effective movements/quotes/FX, sources, Plan/Goals/links/allocations và history. Recorded clock và knowledge version cố định; future actual không lọt vào card/table/detail trước cutoff. Source/price metadata và missing reasons được giữ; thiếu valuation trả null và known subtotal. Partial cash account scope không giả các holdings thuộc account đó.

Allocations không ledger posting. Tất cả Goals chưa archive, kể cả achieved, cạnh tranh cùng cash. Actual âm vẫn ghi hợp lệ; funded giảm pro-rata bằng integer VND và remainder theo allocation ID. Goal schedule là planned; achieved chỉ dựa trên actual funded/assets hoặc actual assets trừ owner-declared debt, cộng điều kiện liquidity AND. Decision evidence giữ snapshot và declarations.

Simulation lưu outputs, steps, assumptions, snapshot refs và Goal version bất biến. Save earmark, consume chi tiền, invest chuyển cash sang simulated asset. Shared daily engine áp Plan remaining/refund lineage và mọi Goal cạnh tranh nguồn, không tự vay/bán tài sản. Comparison chỉ báo same baseline khi dependency refs khớp.

Forecast start đóng băng request, facts, model/Engine/runtime/seed/digest và hash mã tính. `getForecastInputs` đọc inputs cả khi run failed/cancelled/expired; `getBusinessHistory` với type forecast đọc lifecycle. Coverage chỉ đủ khi explicit owner-declared intervals bao phủ trọn calendar month cho mọi selected account; silence không chứng minh zero. Unknown recurring baseline làm future monetary outputs/probabilities null. Debt unknown không được xem bằng zero.

Forecast supervisor có một compute thread, heartbeat/cancel trên loop riêng; daily checkpoints giữ exact residual/RNG draw position, atomic manifest và parts tối đa 256 KiB. Slice dừng sau 1,9 giây hoặc 10.000 ngày; attempt cap 600 giây, deadline 24 giờ. Completed trial checkpoints và with/without Plan dùng cùng draw grid. Publish chỉ sau đủ trials và strict pages, tối đa 12 points/page; DB kiểm manifest/digest/page bounds. Cursor HMAC ràng buộc owner/workspace/run/input/index/expiry. Cancellation/recovery/generation cũ không publish được. Engine hash/runtime phải khớp khi resume; legacy inputs chưa có hash vẫn đọc history nhưng không tự chạy bằng mã mới. Capacity/bounds failure trả rõ; không giảm trials hoặc trả xác suất từ paths dở.

Review actions: defer; cash adjustUnknown/forgottenExpense; pending postPending/rejectPending; transfer confirmTransfer; refund linkRefund; duplicate mergeDuplicate; invalid supplementInvalid/dismissInvalid; quality acknowledgeQuality; category categorize. Supplement pending/one-leg/refund thiếu origin tạo Review tiếp theo thay vì tự kết luận clear. Evidence trả normalized fields; nested/long declarations được chia JSON chunks bảo toàn nội dung, không raw notification/OTP.

Đây là implementation/test local. Việc nối adapters web/native, real providers, Agent, deployment và UAT thuộc các BE còn lại; mapping ghi rõ từng AC có evidence nào, không gọi 41 parent AC là nghiệm thu toàn sản phẩm.
