# ADR-011 — Evolve schema D1 và shared PostgreSQL jobs J2

08/10/2026 · **ACCEPTED BY OWNER**. Owner trả lời “D1 và J2”. Decision design, chưa SQL/runtime nghiệm thu. Kế thừa [ADR-008 A + T1](ADR-008-modular-backend-trusted-server.md), [ADR-009 S1 + P2](ADR-009-fastify-and-isolated-processes.md), [ADR-010 I0 + I1](ADR-010-local-and-conditional-free-cloud.md). [Research/options](../ARCH-04-options.md), [17 findings](../ARCH-04-schema-review.md).

## Context

Physical synthetic54 bảng/610 cột,001–003 chưa chạy. Audit phát hiện broad worker grants, posted-group append gap, planning revision identity thiếu scope, history/cache/payload lifecycle và queue fencing cần thiết kế rõ. Không mặc định số bảng hiện tại đúng hoặc từ bỏ feature frontend.

## Decision

- **D1** giữ domain/table identities có ý nghĩa và API mapping history; thay guards/keys/permissions, bổ sung structures bằng004+ expand/backfill/verify/cutover/contract. Không rewrite001–003/r1/r2 hoặc restore file người dùng đã xóa.
- **J2** dùng một durable dispatch layer trong PostgreSQL cho profiles khác quyền. Logical jobs/attempts/scheduler state riêng; domain receipt/refresh/import/Agent records giữ nghiệp vụ. Typed domain refs, no private payload in Ops queue, transactional enqueue, generation/token/epoch fences, at-least-once delivery+idempotent effects. Một lease authority sau cutover.
- Target [package](../../data/target-t1/README.md):70 entities/782 cột **expand design**,16 structures mới,141 explicit FK links gồm110baseline. Không là final production count/DDL. [Migration plan](../../data/target-t1/migration-plan.md), [permissions](../../data/target-t1/permissions.md), [invariants](../../data/target-t1/invariants-and-workflows.md) quy định guards/retention/history/recovery.
- Ledger posted bundle seal; account mappings không retarget sau sử dụng. Plan/standalone stable scope+immutable revisions/items. Projection cache/payload TTL tách khỏi pinned history/dedupe identity. Admin identity/session/MFA tách customer auth. T1 operators được tin; app-admin và Agent không actual authority.
- PostgreSQL16 baseline major tiếp tục, exact supported patch pin khi implement. `pg`/SQL-first/UnitOfWork giữ. Không thêm Redis/queue vendor, external auth vendor hoặc microservice DB. ARCH-09 chốt queue implementation; có thể map logical storage sang library schema nhưng không vận hành queue authority song song.

## Alternatives và consequences

D2 clean baseline không chọn: mapping/backfill thay đổi rộng hơn mà baseline domain vẫn dùng được. J1 domain-specific delivery không chọn: nhiều nơi phải duy trì lease/retry/fence/catch-up dễ lệch. Options giữ để truy lịch sử, không xóa.

D1 có chi phí migration/backfill/cutover và cleanup thực sự, không chỉ thêm bảng. J2 thêm shared dispatch failure surface; profile capabilities và typed refs phải kiểm trên SQL. Recovery journal local không độc lập backup; cần off-host latest fence và native reconciliation. Một PostgreSQL vẫn giữ atomic transactions; không hứa HA/exactly-once delivery/zero-loss restore.

## Verification và follow-up

Chỉ kiểm structural artifacts/preservation trong lượt này.17 findings **DESIGN SPECIFIED / IMPLEMENTATION NOT RUN**, không gọi runtime fixed. ARCH-05/06/07/08/09 bổ sung contract/auth/privacy/Engine/queue details; implement SQL004+ rồi clean install/upgrade/role/domain/concurrency/restore tests trên disposable PostgreSQL. Real vẫn cần SEC-REAL-T1/provider/native/UAT gates, không phát sinh cloud/model/provider chi phí hoặc frontend edits.
