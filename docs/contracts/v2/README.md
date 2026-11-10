# Hợp đồng API v2 thống nhất

08/10/2026 · 2.0.0 · **đích triển khai synthetic, chưa có backend**.

Baseline được pin SHA tại [FW-HANDOVER-20261008-r1](../../governance/baselines/FW-HANDOVER-20261008-r1/README.md). Metadata domain dependencies đã sửa theo semantics; request/reply/error schemas và API2.0.0 giữ nguyên. [Semantic diff](../../execution/evidence/FW-HANDOVER-20261008-r1/canonical-semantic-diff.json), [storage transformations](storage-field-mapping.csv), [field compatibility diff](../../execution/evidence/FW-HANDOVER-20261008-r1/consumer-field-differences.json). Mapping derived từ canonical + fresh observed source + reviewed rules trong tools/handover, không chỉnh CSV riêng.

[openapi.json](openapi.json) là nguồn chuẩn duy nhất cho operations, schemas, quyền, transport, examples và metadata. Các tệp `schemas.json`, `examples.json`, CSV inventory/mapping được dẫn xuất; sửa nguồn chuẩn rồi chạy công cụ kiểm tra. Zod trong frontend là implementation quan sát được, chưa phải nguồn chuẩn v2 bàn giao. `bootstrap_contract.py` chỉ là công cụ soạn bản đầu, không dùng để cập nhật hoặc validation.

133 operations bao phủ 70 business + 6 identity kế thừa, 15 operation v2 không phải fixture và các operations bổ sung cho enrollment/session/sync/receipts/jobs/drafts/admin/internal. Ba tên `getState`, `registerExampleDevice`, `testCollector` chỉ là mock; không cấp endpoint production cho chúng. [Inventory](operation-inventory.csv), [call sites](consumer-calls.csv), [consumer mapping](consumer-operation-mapping.csv), [field/data mapping](api-data-mapping.csv).

Chọn POST RPC logical `/v2/operations/{operationId}`, `/v2/identity/{operationId}`, `/v2/admin/{operationId}` để phù hợp typed-operation services hiện có; không tạo lớp REST và RPC có authority khác nhau. URL không chứa search, tiền, nội dung, account filters. `/internal/v2/*` chỉ private service identity. **JSON và cookie/token mô tả trong OpenAPI chỉ được triển khai conventional synthetic.** Protected-real dùng toàn bộ request/reply/error bên trong kênh tới workload được xác minh; chưa có wire protocol an toàn đã được chọn. Không chuyển nguyên JSON qua một gateway thật rồi gọi là protected.

Đọc [semantics](semantics.md), [lifecycles](lifecycles.md), [migration](migration.md) cùng schemas; schema validation không kiểm được quyền, đủ tiền hoặc atomic commit. AI chức năng và tool authority chỉ theo [AI-SPEC-001](../../product/ai-agent-specification.md).

Kiểm tra từ root, dùng Python 3.12 có các gói trong [requirements](../../../tools/handover/requirements.txt):

```powershell
python tools/handover/baseline.py verify --package-id FW-HANDOVER-20261008-r1
```

Không chạy generator cũ `finweave-web/scripts/run-contracts.cjs` trong lượt bàn giao: nó ghi lại v1 và không kiểm v2 này. Ví dụ là synthetic cấu trúc, không oracle tính toán hoặc chứng cứ backend chạy. Kết quả thực tế tại [validation](../../execution/evidence/handover-2026-10-08/validation.json).

Để tạo revision mới, dùng [workflow baseline](../../handover/baseline-policy.md) với evidence-dir mới; không chạy lại legacy preserve/seal/auditStep6 lên evidence lịch sử. [Validation r1](../../execution/evidence/FW-HANDOVER-20261008-r1/validation.json) tách khỏi historical FAIL.
