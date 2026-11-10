# API v2 — T1 / D1 + J2 working revision

FW-API-T1-D1J2-001 · 08/10/2026 · **ACCEPTED CONTRACT DESIGN / IMPLEMENTATION NOT RUN**. Owner yêu cầu tiếp tục theo hướng phù hợp nhất sau ARCH-04; [ADR-012](../../architecture/adr/ADR-012-unified-t1-contract-revision.md) ghi lựa chọn. Không sửa frontend, physical baseline hoặc snapshot r1/r2.

[openapi.json](openapi.json) là **working source chuẩn mới** cho backend mục tiêu T1. [v2 cũ](../v2/README.md) giữ nguyên làm baseline tham chiếu; không chạy generator cũ để ghi đè. Payload contractVersion vẫn2.0.0 vì chưa phát hành API backend; revision này có thay đổi không tương thích baseline ở một số schemas, nên **bắt buộc pin revision+OpenAPI SHA256**, không nhận compatible chỉ vì cùng nhãn2.0.0. API đã phát hành sau này thay đổi không tương thích phải tăng phiên bản; không dùng revision header để né versioning published API.

## Hồ sơ hiện hành

| Artifact | Vai trò |
| --- | --- |
| [OpenAPI](openapi.json), [schemas](schemas.json), [revision](revision.json), [diff](revision-diff.json) | OpenAPI3.1/JSON Schema2020-12, exact revision/hash, thay đổi so baseline |
| [141 operations](operation-inventory.csv) | Giữ133 operations, bổ sung8 hợp đồng cho native credentials, outcome/recovery và import worker |
| [Semantics](semantics.md) | Context, quyền, preview/replay, HTTP/error/paging/cache và recovery |
| [Transport policy](transport-policy.json), [lifecycles](lifecycles.md) | Context/header/credential policy từng operation và tiến trình async, không tương đương runtime proof |
| [Consumer mapping](consumer-operation-mapping.csv), [adapter plan](adapter-plan.md) |145 dòng mapping declarations/target gaps/local capabilities, fresh source observation; không đồng nghĩa145 UI actions |
| [Field handling](field-handling.csv), [reviewed storage transformations](storage-transformations.csv) | Đủ Input/Output paths/branches có owner/dependencies; phân direct/transform với service parameter/projection, không đoán DB column từ tên; envelope/errors/headers trong OpenAPI/transport policy |
| [DB delta](db-contract-delta.md) | Điểm tiếp nối target D1/J2; native credentials/challenge storage cần ARCH-06 cụ thể hóa |
| [Acceptance](acceptance-plan.md), [examples](examples.json), [negative fixtures](invalid-requests.json) | Structural fixtures và runtime scenarios tách trạng thái; không oracle tài chính |
| [Source observation](../../execution/evidence/arch-05-t1-2026-10-08/observed-contracts.json), [AST](../../execution/evidence/arch-05-t1-2026-10-08/consumer-ast.json), [field diff](../../execution/evidence/arch-05-t1-2026-10-08/consumer-field-differences.json) | Đọc source hiện tại, giữ dynamic dispatch, không copy historical call sites làm bằng chứng mới |
| [Validation](../../execution/evidence/arch-05-t1-2026-10-08/validation.json), [preservation](../../execution/evidence/arch-05-t1-2026-10-08/preservation.json) | Chỉ structural/docs/source hashes; backend/native/DB/security/consumer migration NOT RUN |

##8 operations bổ sung, không cắt feature

| Operation | Vì sao cần |
| --- | --- |
| verifyNativeIdentityChallenge | Native hoàn tất challenge và nhận owner session/credentials; browser giữ cookie flow riêng |
| renewNativeSession | Refresh native credential rotation; không dùng cookie hoặc collector token thay owner session |
| requestCollectorCredentialChallenge | Nonce riêng cho device credential; không tái sử dụng enrollment proof |
| issueCollectorCredential | Owner session + live device/key proof cấp collector-only token gắn epochs |
| getCommandOutcome | Owner tra kết quả command sau lost response/body expiry; không tự bấm lại với key mới |
| opsGetCommandOutcome | Admin tra safe Ops command riêng; không truy finance replay store |
| reconcileReceipts | Collector so identity/digest receipts sau restart/restore, không đọc sổ user |
| executeImportJob | Private import worker contract có typed job ticket/fence; trước đó import queue thiếu operation xử lý tương ứng |

MFA admin ban đầu đã có email/password/mfaCode trong adminSignIn; không tạo thêm agent hoặc tool để thay xác thực. Admin session/factor provisioning/recovery là privileged ARCH-06 runbook; workspace erasure/recovery là ARCH-07 workflow, không giả purgeExpiredData là endpoint xóa toàn tài khoản.

## Điều đã chốt / phần còn lại

Chốt logical contract revision, actor/context boundaries,8 bổ sung, consumer transformations và acceptance scenarios. Chưa deploy hoặc migrate consumer. ARCH-06 chốt identity/keys/challenges/rotation/CSRF implementation và DB credential delta; ARCH-07 threat model/privacy; ARCH-08 Engine; ARCH-09 queue protocols. Fastify JSON Schema2020-12 request **và response** validation PoC vẫn bắt buộc; tools structural PASS không tự chứng minh default Fastify compiler hỗ trợ dialect. [OpenAPI3.1](https://spec.openapis.org/oas/v3.1.0.html), [JSON Schema2020-12](https://json-schema.org/draft/2020-12/json-schema-validation).
