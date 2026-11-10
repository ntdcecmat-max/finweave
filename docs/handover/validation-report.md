# Báo cáo bàn giao và validation thực tế

**Revision hiện hành:** [FW-HANDOVER-20261008-r1 / review report](../governance/baselines/FW-HANDOVER-20261008-r1/review-report.md), [validation mới](../execution/evidence/FW-HANDOVER-20261008-r1/validation.json), [extended checks](../execution/evidence/FW-HANDOVER-20261008-r1/alignment-validation.json). Baseline mới chốt artifact local synthetic theo manifest; source/mapping/metadata đã reconciliation, không nghiệm thu frontend/backend. **Các kết quả FAIL và số liệu phía dưới là báo cáo lịch sử của handover-2026-10-08, giữ nguyên theo observation đó.** Raw Step6 hiện khác summary99/55 cũ; report r1 ghi rõ130 unit và24/35 browser, không chạy lại tests.

08/10/2026. Phạm vi chỉ documentation/contracts/schema/migration/config/check tooling. Không sửa runtime frontend hoặc UI, không backend/database/native/APK thật, không chạy migration thật, không commit/push/deploy hoặc gọi model/provider với dữ liệu thật.

## Kết quả bàn giao

- Sửa README, catalogue và nguồn API: admin riêng đã có; `/home/reports` redirect Home, giữ nghiệp vụ report;18 operational Zod contracts additive không còn bị mô tả như chỉ là ý tưởng delta. Phân biệt thiết kế đích, code mock hiện tại và Step4–6 lịch sử.
- Tạo canonical API v2 với133 operations/544 components, request/reply/error schemas, positive/error/invalid examples, permissions/transport/lifecycle/idempotency/version/preview rules; inventory/mapping bao phủ cả70 v1+6 identity,18 additive v2,5 admin gateway methods và7 native bridge methods.
- Tạo physical model54 tables/18 indexes, ERD/data dictionary,3 migrations+roles+pre/postflight+synthetic seed/negative fixtures, cùng protected ciphertext storage candidate **tách profile**. Không gọi candidate là protected processing hoàn chỉnh.
- Hoàn thiện security/trust decisions, data-flow/threat model/key/recovery/retention/provider gates, source/environment/quota/cost shortlist và configuration mẫu secret-free. Giữ conventional synthetic khi anti-Ops chưa PoC.
- Cập nhật RTM41 AC với cột yêu cầu/UI/mock/tích hợp thật/kiểm tra thực thi/thiếu; không tăng requirements vì schema/tests. AI-SPEC-001 vẫn nguồn chi tiết AI duy nhất. Checklist nêu dependency/thứ tự backend→user/admin→native→source/security gates.

## Kiểm tra đã thực hiện và giới hạn

Kết quả machine-readable mới nhất ở [validation.json](../execution/evidence/handover-2026-10-08/validation.json), [SQL parse](../execution/evidence/handover-2026-10-08/sql-syntax.json), [links](../execution/evidence/handover-2026-10-08/internal-links.json), [preservation](../execution/evidence/handover-2026-10-08/frontend-preservation.json). **17 kiểm tra artifact PASS; frontend preservation FAIL do drift; kết quả tổng hợp pass=false.** Không gộp hai kết quả hoặc dùng artifact PASS để che drift. Báo cáo này không thay raw results.

| Kiểm tra | Mức bằng chứng |
| --- | --- |
| OpenAPI3.1.1 + JSON Schema2020-12 + local refs | Structural validation bằng openapi-spec-validator0.7.2/jsonschema4.26.0; không backend execution |
| Positive examples |266 request/reply fixtures của133 operations có schema+format check; synthetic cấu trúc, không oracle tiền/feasibility.7 error DTOs và4 requests quan trọng bị reject đúng schema |
| Consumer operations | All declared70+6+18 covered; direct literal call sites resolved; admin/native mapping đầy đủ. Dynamic adapters/declarations là static coverage, không bằng chứng mọi route được chạy |
| API/data/SQL | Every operation references existing tables; tất cả leaf fields trong CSV được phân loại, explicit mapped columns checked; projection/command parameters không bị coi là DB columns. Physical-model table/columns so parsed SQL, không mọi SQL cross-row domain rule đã chứng minh |
| Migration | pglast7.10 parse SQL ngoài của9 tệp;54 tables/610 columns đối chiếu tên và thứ tự cột với physical model. **NOT RUN** PostgreSQL execution/PLpgSQL compile/constraints/RLS/index plans. Không psql, Docker daemon unavailable; không khởi động Docker hoặc tạo DB để che giới hạn |
| Environment/traceability | Example khớp schema, realData=false/spend0,41 AC duy nhất và source/operation refs tồn tại |
| Link/canonical checks |871 liên kết tệp Markdown,0 đích thiếu; anchors chưa kiểm. Frozen governance baselines và old evidence excluded.9 liên kết source files đã xóa được chuyển tới nguồn hiện hành với ghi chú, không phục hồi file. Canonical API chỉ openapi.json; derived package không là nguồn riêng |
| Privacy boundaries | No production /__mock paths, internal actors tách, admin output denylist. Đây là schema/source checks, **không** backend auth, crypto hoặc chống DBA/Ops đã chạy |
| Frontend preservation | **DRIFT DETECTED**, không được báo unchanged/PASS. SHA256 before/after và Git status:245 files ở mỗi thời điểm,247 đường dẫn trong hợp hai tập, gồm src/admin/native/shell/tests/scripts/assets/config/build artifacts. Lần đối chiếu phát hiện9 đường dẫn thay đổi: ActionForm.tsx, presentation.ts, audit-step6.ts, tsconfig.tsbuildinfo và dist index/assets. Lượt này không sửa frontend hoặc chạy build; hashes không chứng minh tác nhân thay đổi. Giữ nguyên, không restore. Exclude node_modules,.git,npm-cache,.vite,.vite-temp. [Drift details](../execution/evidence/handover-2026-10-08/frontend-observed-drift.json) là bằng chứng chi tiết; final count lấy raw report |

Không chạy frontend unit/browser/UI/UAT trong lượt này; giữ báo cáo99 unit/55 browser distinct lịch sử Step6 đúng context của chúng. UI implementation08/10 ghi typecheck/web/admin build thành công trong lượt trước, không có runtime test mới. Backend/native/real-source/inference/security/restore suites **NOT RUN**. Không dùng document/schema/generated examples PASS làm evidence thay các suites đó.

## Phạm vi đủ để bàn giao

Đủ artifact để review và bắt đầu **xây backend local synthetic**, chuẩn bị adapters user/admin theo contract và chuẩn bị native DTO/PoC plan. Người nhận có schemas/operations/quyền/config/data constraints/invariants/lifecycles/known gaps/dependencies và thứ tự kiểm tra. Cần chạy migrations disposable, domain/concurrency/authorization/restore tests trước nhận backend synthetic đạt; retain/erase procedure hiện disabled chờ implementation review.

Chưa đủ để xây protected backend chỉ từ ciphertext storage candidate; protocol/key/client/attestation/indexes/anti-rollback/recovery cần PoC. Chưa đủ nhận Android collector/source support hoặc signed APK. Chưa được mở real finance/provider inference/production từ hồ sơ này. Backend synthetic readiness và real-data readiness là hai cổng khác nhau.

## Quyết định còn cần người dùng

Khuyến nghị giữ anti-Ops và synthetic trước; PoC protected/cloud trả phí cần dự toán/cap duyệt riêng. Shortlist collector VCB Digibank/MoMo chờ đúng app người dùng đang dùng. Owner-held recovery+second device cần chấp nhận trade-off mất toàn bộ keys. Live market automation và commercial hosting cần quyền nguồn/chi phí/hướng sản phẩm rõ. Chi tiết phương án/fallback/quota ở [operational decisions](operational-decisions.md); chưa có phê duyệt thì giữ synthetic/spend0.

## Lặp lại kiểm tra

Workflow phía dưới thuộc lượt lịch sử, **không chạy lại** vì có đường ghi evidence cũ. Dùng [workflow versioned](baseline-policy.md) cho mọi lần kiểm tra mới; chỉ `baseline.py verify` để đọc revision đã seal.

```powershell
node tools/handover/observe.cjs
python tools/handover/preserve.py after
python tools/handover/derive_validate.py
python tools/handover/seal.py
```

Hai lệnh đối chiếu/validation trả exit1 khi preservation có drift; đọc các cờ riêng trong validation.json. Không chạy lại `preserve.py before` để làm sạch kết quả: công cụ từ chối ghi đè baseline gốc. `seal.py` lập manifest hash, không biến kết quả FAIL thành PASS.

Bundled Node24/Python3.12 đã dùng trong lượt này; thư viện kiểm tra chỉ cài tại `work/handover-deps`, không đổi frontend dependencies/lock. Command lần đầu tải thư viện bị DNS sandbox chặn; lần có quyền mạng tải thư viện miễn phí thành công, không account/billing. Baseline docs snapshot giữ trước sửa; đầu vào/source hashes và artifact hashes nằm evidence. Không tự reset Git hoặc phục hồi tệp bị xóa.
