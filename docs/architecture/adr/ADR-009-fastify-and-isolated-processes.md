# ADR-009 — Fastify TypeScript và process isolation P2

08/10/2026 · **ACCEPTED BY OWNER — DESIGN, NOT IMPLEMENTED** · ARCH-02.

## Context và quyết định

Owner chọn trực tiếp: **“Tôi chọn S1 + P2 bạn hãy cập nhật lại tài liệu ARCH-02/Stack/module HLD/ADR”**. [Options/research](../ARCH-02-options.md) so sánh S1/S2/S3, P1/P2 và transaction/module responsibilities. Kế thừa [ADR-008 A + T1](ADR-008-modular-backend-trusted-server.md), không thay trust hoặc phạm vi.

**S1:** Fastify + TypeScript modular backend, explicit dependency composition, pure Financial Engine, public module services/private repositories, PostgreSQL/`pg`/parameterized SQL và UnitOfWork. Canonical OpenAPI v2 là nguồn wire; validation/serialization2020-12 phải có compatible compiler/registry và PoC trước claim conformance.

**P2:** user/device API và Ops API là **processes riêng**, workers chạy profile-specific processes/credentials/pools, migration runner quyền riêng. Cùng versioned domain codebase/database consistency boundary; không tách microservices. Ops API không có finance pool; Agent worker chỉ scoped read/simulate/draft và không actual/active-plan confirmation.

## Lý do

S1 phù hợp nền TypeScript/decimal hiện có, giảm chuyển đổi ngôn ngữ và giữ transaction workflow dễ theo dõi. Fastify plugin encapsulation hữu ích cho route scopes nhưng không thay import rules, DB grants hoặc authorization. P2 làm rõ bootstrap/credentials/lifecycle và giảm rủi ro accidental cross-role access giữa user/admin/worker.

S2 Nest/Fastify và S3 Spring/Java giữ làm alternatives đã khảo sát, P1 chung user/Ops API chưa chọn. Không dùng benchmark framework hoặc tốc độ AI sinh code để tuyên bố domain/concurrency đúng.

## Hệ quả bắt buộc

- [Stack](../tech-stack.md) và [module HLD](../module-high-level-design.md) là working design hiện hành. Chốt ownership54 bảng hiện có cho12 business modules + shared transaction infrastructure; Engine không có ledger riêng. Physical schema/grants chưa đổi và chưa chạy.
- Module khác gọi public owner service trong shared TxContext, không import private repository hoặc tự ghi bảng; cross-module read projections qua authorized query layer có snapshot/version nhất quán.
- Confirm Plan/Goals/links/history/replay cùng transaction; Agent không confirm thay owner, kể cả owner confirm cũng không actual write. Ledger correction/reversal và related movements/history/replay atomic; receipt ACK sau durable commit.
- Mọi transaction dùng cùng checked-out PG client; lock anchors/order, idempotency, bounded serialization retries và lease/binding fencing có tests. Không transaction xuyên provider/model call.
- Worker profile khác privilege phải tách process để isolation thật; không claim từ profile string trong process giữ mọi keys. Ops safe control requests không mở financial command proxy hoặc payload access.
- Không dùng ORM auto-sync thay reviewed SQL; không tự thêm Redis/Kafka/Python service/queue library. Exact runtime/library versions và platform resource budgets chốt khi implementation/ARCH-03/04/09/12.
- P2 không buộc thuê máy/server riêng cho mỗi process; free-tier worker/runtime support và pools phải đo, không bảo đảm tổng chi phí0.

## Phần chưa nghiệm thu và tiếp theo

Backend/package/dependencies, migrations/roles, auth, worker runtime, contract2020-12 conformance, native/APK, providers/real Agent, security/restore/UAT đều NOT RUN trong lượt này. SEC-REAL-T1 giữ nguyên. Source frontend/API/schema và immutable r1/r2 không đổi; đây là working-doc delta sau r2, chưa seal revision mới.

ARCH-03 chốt infrastructure/platform/cost, ARCH-04 kiểm database, ARCH-05/06 chốt adapters/auth T1, ARCH-08/09 domain/queues, ARCH-12 model và ARCH-13 operations. Không tạo backend code, deploy, paid resource hoặc provider call bởi ADR này.
