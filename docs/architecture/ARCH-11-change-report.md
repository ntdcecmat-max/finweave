# ARCH-11 — Báo cáo nguồn dữ liệu

09/10/2026 · **DESIGN SPECIFIED / REAL SOURCES NOT ACTIVATED / RUNTIME NOT RUN.**

Đã thiết kế chi tiết nguồn notification và giá stock/gold trong hướng kiến trúc đã chọn, giữ đầy đủ feature. [Package](../sources/README.md) và [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) là hồ sơ hiện hành; source candidates/desk research chưa phải lựa chọn tài khoản/entitlement hoặc nghiệm thu live.

## Những gì thay đổi và vì sao

| Thay đổi | Lý do |
| --- | --- |
| SSI V3 read-only candidate, V2 chỉ lịch sử; đối chiếu options/licensing Vnstock | Không bắt đầu integration mới từ API sắp ngừng; không nhầm software license/API fee0 với quyền cung cấp dữ liệu SaaS |
| Registry support theo package/signer/app/template/OS/OEM, hai app thật supported=false | Play package không chứng minh signer/template hay owner dùng app đó; không bịa parser ngân hàng |
| Finality/binding/duplicate/internal transfer/correction disposition | Pending/redacted/ambiguous/multiple amounts không được auto actual hoặc ghi trùng |
| Unbound chỉ local warning/gap; bound incomplete đúng schema vào server Review | API004 bắt buộc bindingId, không lifecycle field; không fake account hoặc hứa có receipt chưa tạo |
| Exact gold scale/unit/side/profile, stock identity/basis, distinct quoteAsOf/fetchedAt | Ngăn sai1000/10, double purity và giả fresh; giữ sourceUnit trong quote, conversion exact ở valuation |
| Explicit rights/cache/history/backup/derived/model/quota/egress gates | Public board/API free không tự cấp quyền automation/redistribution; license thiếu hoặc không tương thích lịch sử phải fail closed |
| API/storage/consumer mapping và private metadata schemas, wallet→bank compatibility projection | Kế thừa API004/DB005/bridge2 không tự thêm enum/lifecycle/account fields; giữ tất cả feature |
| 32 requirements/32 runtime cases và PoC source cụ thể; đồng bộ27currentdocs | Tách SPECIFIED/static/model evidence khỏi native/provider/SQL/cron/UAT thực tế |

## Kiểm chứng và preservation

[Validation](../execution/evidence/arch-11-sources-2026-10-09/validation-report.json), [schema fixtures](../execution/evidence/arch-11-sources-2026-10-09/schema-validation.json), [model-only examples](../execution/evidence/arch-11-sources-2026-10-09/model-validation.json), [protected hashes](../execution/evidence/arch-11-sources-2026-10-09/preservation-before.json), [manifest](../execution/evidence/arch-11-sources-2026-10-09/artifact-manifest.json).

API **FW-API-T1-D1J2-004 — 153 operations / 634 schemas** và DB **FW-PHYS-T1-ASYNC-005 — 87 bảng / 1001 cột / 162 khóa ngoại** giữ nguyên hashes. Bridge2 và các gói ARCH06–10 không sửa; **457 tệp được bảo vệ** gồm frontend/baselines/packages/tools/evidence trước được đối chiếu. Các tài liệu tổng quan hiện hành được phép cập nhật, ghi lại hashes mới trong manifest ARCH11; không sửa hash trong manifests lịch sử. r1/r2 snapshots không thay.

Kết quả thực thi: **28/28 kiểm tra nhất quán đạt; 37/37 ca schema (8 hợp lệ, 29 không hợp lệ đúng kỳ vọng) và 66/66 ví dụ mô hình đạt**. Manifest ghi 55 artifacts, gồm 27 tài liệu hiện hành được đồng bộ; manifest tự loại khỏi checksum của chính nó. 457 tệp được bảo vệ không thay đổi. Các ca mô hình dùng dữ liệu giả và không phải implementation parser/Engine/quota.

Static/schema/model PASS **không phải** bank parser, market API, migration/grants, Room/Keystore, background/OEM, real daily price, Agent/model, security/restore hay UAT PASS. Không kiểm thử frontend lại hoặc thay thế báo cáo67browser/131unit lịch sử.

## Các điểm còn mở

- Tên ngân hàng/ví owner thực dùng và Android/OEM/app versions; signer/template/local consented samples chưa có.
- SSI account/read-only entitlement/quota/scale/finality/time/paging/retention/display/model rights chưa có; UAT chưa chứng minh available cho account.
- PNJ/SJC chưa có authorized API/channel/automation/license/timestamp đáp ứng; chưa cài vnstock/chọn tier hoặc mua source.
- Runtime adapters/DB/native/backend/scheduler/security/source end-to-end vẫn NOT RUN; nếu source đòi fields/retention ngoài contract, phải tạo revision tiếp theo trước bật.

Không thay runtime frontend/dependencies/lockfiles, không commit/push/deploy/account/vendor call hoặc external spend. Tiếp theo **ARCH-12 Agent/model/runtime/evals**; source PoC thực hiện theo gates, chưa đòi owner quyết định lại những hướng đã chốt.
