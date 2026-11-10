# Transactions và concurrency của domain

**ENG-27…30 · DESIGN; PostgreSQL/fault/concurrency tests NOT RUN.** Không network/model/provider call trong transaction đang giữ financial locks.

## 1. Write protocol

Default actual/planning mutation dùng short READ COMMITTED UnitOfWork trên **một checked-out PG client**, transaction-local verified actor/workspace context. Serialize cross-row financial invariants bằng workspace financial anchor FOR UPDATE; chưa tối ưu lock partition trước khi có contention evidence. Scope serialization đơn giản phù hợp modular single-DB hiện hành; không mặc định mọi command SERIALIZABLE hoặc microservice saga.

Thứ tự: workspace access/recovery anchor → scoped command-idempotency lock/record → planning scopes (ID sort) → account/holding/goal/item/event/Review anchors (type rank rồi stable ID) → posting group/line writes. Mọi workflow cùng lock registry; không read-then-lock với facts đã dùng để validate. Current auth/revoke/access kiểm trước replay; không lộ replay trước authorization.

Sau khóa: committed replay đúng key/digest được trả trước stale preview/version check của **lệnh mới**. New command kiểm expected versions, preview/input digest/expiry và current references; rồi tính effects từ facts đã lock, apply constraints/history/version/job+replay atomic. Chỉ tăng financial_version khi financial facts/quantity/price/planning inputs ảnh hưởng projection đổi theo version registry; forecast run control/progress dùng run/workspace control version, không giả thay actual. Version_history/typed refs ghi cùng UoW, không callback sau commit.

SERIALIZABLE chỉ dùng nếu workflow không được khóa đầy đủ hoặc implementation quyết định đổi profile; khi đó phải retry toàn transaction. Deadlock/serialization retry bounded candidate tối đa3attempts với jitter; giữ original operation/key/input/expected versions, không tự tăng versions để vượt conflict. Nếu retry precondition không còn đúng thì409 và owner re-preview. Constraint/validation/auth error không retry như transient. Commit response mất → unknown outcome, không coi rollback hoặc tự tạo key mới. [Isolation](https://www.postgresql.org/docs/18/transaction-iso.html), [locks](https://www.postgresql.org/docs/18/explicit-locking.html).

## 2. Critical bundles

| Workflow | Atomic closure/recheck |
| --- | --- |
| createAccount/opening | Account, ledger mapping, optional nonzero opening group, history/replay; zero opening no zero group |
| postDraft/manual/import/ingestion | Current auth/source/device where relevant, group+all lines, event/evidence/quantity, processed marker/history/version/replay |
| transfer/fee/late receiving leg | Evidence identities, clearing balance, linked groups, fee scope/posting state; no destination double-credit |
| refund/correct/link origin | Expense family, existing net refunds, exact reversal/replacement, related mapping; original key never posts twice |
| quantity set/delta/backdate | Holding anchor, ordered history suffix and nonnegative running quantity, related cash event |
| allocate/release/achieve/archive Goal | Account actual/coverage, every competing allocation, Goal criterion/current assessment refs, atomic allocation/history |
| confirmPlanningDraft | Draft/preview, all Plan/Goal/link revisions and funds across Goals; no actual writes |
| startForecastRun | Authorized frozen dependency closure, inputs payload, run, J2 enqueue, idempotency; compute outside transaction |
| finish/cancel forecast | Live ticket/fence + run lock; all pages complete or cancellation; actual/planning tables unchanged |

## 3. Read protocol

Authorized REPEATABLE READ read transaction builds snapshot closure. Recheck workspace access/current recovery gates at entry; capability/profile không lấy từ payload/model. Projection cache có exact refs digest và Engine/model/DTO version; invalid cache bị rebuild, không merge old/new. Immutability/pinning không cấp quyền đọc sau revoke/erase: current auth/access vẫn thắng historical replay/cache.

Price fetch/LLM/native upload parsing ngoài financial transaction; finalize rechecks current target/version/lease/entitlement/profile/consent. Provider failure giữ last-good, không bump quoteAsOf hoặc successful version giả. Quote/quantity cập nhật cùng lúc phải tạo snapshot ở một knowledge version, không combine hai commits như chưa từng cùng tồn tại.

## 4. Races phải chứng minh

Hai allocations cạnh tranh; allocation vs actual expense; hai refunds vượt cap; correction vs refund; transfer destination confirm vs second evidence; postDraft vs fee; backdated set vs purchase; same event links qua hai revisions; owner confirm vs Agent amendment; stale price completion vs profile edit; same-key response loss; cache snapshot vs mutation; forecast finish vs cancel/revoke/restore; old lease checkpoint vs new worker. Mọi case cần ít nhất2 independent DB connections và fault points, không unit test tuần tự giả concurrency.

ARCH-07 workspace erasing/current auth và independent deny witness vẫn có precedence. Erasure/recovery là privileged narrow workflow, không dùng ordinary Engine mutation để xóa sealed history. Recovery token/counter khác financial/auth/device epochs. Async timings/retry/heartbeat/catch-up cụ thể thuộc ARCH-09; không tạo J2 authority thứ hai trong Engine.
