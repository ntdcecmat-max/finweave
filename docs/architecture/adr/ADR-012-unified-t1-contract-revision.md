# ADR-012 — Một API v2 working revision cho T1/D1/J2

08/10/2026 · **ACCEPTED DESIGN, delegated technical direction**. Owner yêu cầu “bạn trước tiếp làm theo hướng phù hợp nhất” sau D1 + J2. Không mở lại A/T1, S1/P2, I0/I1 hoặc cắt feature. [ADR-011](ADR-011-evolving-schema-and-shared-jobs.md), [agenda](../architecture-decision-agenda.md).

## Vấn đề

Canonical133 operations2.0.0 baseline còn protected-only transport, cho DeviceBearer vào owner APIs, customer auth dependencies cho admin và internal tenant ID/fence chưa đủ J2. Frontend core1.1.0, operational prototype2.0.0, admin memory gateway và native bridge chỉ là implementation mock; không ép backend giữ hybrid chỉ vì trùng label. Auth/native/outcome/import execution cần contract rõ.

## Quyết định

1. [docs/contracts/v2-t1](../../contracts/v2-t1/README.md) là working target mới **FW-API-T1-D1J2-001**, OpenAPI3.1/JSONSchema2020-12. Giữ body contractVersion2.0.0 **chưa phát hành**; revision/hash pin bắt buộc vì có baseline schemas thay đổi (counts/hashes trong diff). Không hứa compatible với baseline/mock. Published breaking changes sau này phải version mới, không chỉ đổi revision.
2. Giữ133 operations và thêm8 cho native challenge completion/refresh, collector challenge/token issue, owner/Ops command outcome, receipt reconcile và internal import execution. [Diff](../../contracts/v2-t1/revision-diff.json) ghi names/schemas/hashes;41 parent AC không tăng theooperation count.
3. T1 HTTPS, owner cookie/native-owner bearer khác collector-only bearer; refresh chỉ token renewal. Admin cookie/MFA riêng; private services mTLS AND signed nonce/body/method/path. Context null vs tenant-scoped workers rõ; DeviceBearer chỉ ingest/reconcile, không owner finance.
4. J2 typed dispatch/domain IDs+generation/token/epoch, effect+history+replay atomic. Durable receipt ACK không là posted; restore checkpoint/reconcile không zero-loss promise. REPLAY_EXPIRED có outcome=committed; owner/Ops outcome stores riêng; currentauth/revoke trước committed replay, replay trước freshness.
5. Reuse named operations/adapters, không thêm REST layer authority khác hoặc runtime frontend rewrite. Fresh source/schema/AST/field difference, detailed storage transformation subset; inventories không là query/runtime conformance.

## Follow-up và giới hạn

ARCH-06 phải cụ thể hóa owner/native/collector credentials, purpose/nonce/keyproof, CSRF/MFA/rotation/recovery và storage delta; ARCH-07 privacy/recovery; ARCH-08 Engine; ARCH-09 queue/budgets. Contract shapes được chốt, crypto/implementation/tests chưa. New DB credential fields/tables chưa nằm đủ trong70-table expand; [required delta](../../contracts/v2-t1/db-contract-delta.md) ghi rõ, không nhận schema đủ từcount.

Baseline contracts/v2, physical001–003/targetD1J2, r1/r2 và source frontend giữ nguyên. Không SQL/backend/native/build/deploy/provider/model/paid resources. Structural validation không thay independent review, UAT hoặc security acceptance.
