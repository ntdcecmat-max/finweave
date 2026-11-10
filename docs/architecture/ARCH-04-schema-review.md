# ARCH-04 — Findings của schema hiện tại

08/10/2026 · **STATIC REVIEW, CHƯA SQL EXECUTION**. Đây là audit/research phục vụ [lựa chọn D1/D2 + J1/J2](ARCH-04-options.md); chưa thay schema hoặc nhận lỗi đã tái hiện runtime. Mức “bắt buộc xử lý” áp dụng trước nhận target backend/real tùy gate, không làm mất nghiệm thu frontend synthetic.

## Đầu vào và kiểm kê

[Model](../data/physical/physical-model.json), [dictionary](../data/physical/data-dictionary.md), [SQL001](../data/physical/migrations/001_synthetic_tables.sql), [guards002](../data/physical/migrations/002_guards_and_boundaries.sql), [triggers003](../data/physical/migrations/003_mutable_and_immutable_triggers.sql), [role grants](../data/physical/role-provisioning.sql), [ERD](../data/physical/erd.mmd), [generator](../../tools/handover/build_data.py), [postflight](../data/physical/postflight.sql), [negative fixtures](../data/physical/negative-fixtures.sql), [API mapping](../contracts/v2/api-data-mapping.csv), [backlog](../product/backend-backlog.md), [module HLD](module-high-level-design.md).

Inventory gồm54 bảng/610 cột;39 tenant tables;18 explicit indexes (3 UNIQUE), ngoài indexes ngầm của PK/UNIQUE;15 numeric và31 JSONB. SQL001 có110 references; model.relations/ERD có62 edges, ERD chỉ36 table nodes. [Bằng chứng kiểm kê](../execution/evidence/arch-04-research-2026-10-08/static-inventory.json) và [table audit](../execution/evidence/arch-04-research-2026-10-08/table-audit.csv) ghi ownership và findings IDs; [column inventory](../execution/evidence/arch-04-research-2026-10-08/column-inventory.csv) liệt kê đủ610 declarations.

## DB04-F01 — Worker grants chưa khớp P2

**Artifact xác nhận:** role-provisioning tạo một fw_worker, cấp SELECT/INSERT/UPDATE trên mọi bảng có workspace_id cho fw_app/fw_worker, EXECUTE mọi function hiện có cho nhiều service roles. Không có roles market/Agent/retention riêng. RLS giới hạn workspace, không tự phân biệt business capability.

**Hệ quả:** gán credential fw_worker cho Agent/market có khả năng ghi bảng actual/active planning vượt ARCH-02; không thể nhận “draft-only” từ process name. Cần explicit role/grant/procedure matrix, default privileges kiểm soát và profile-specific negative tests, không cấp chung rồi chỉ trông vào coding conventions. Không khẳng định SQL grants hiện đang chạy ở môi trường nào.

## DB04-F02 — Immutable posted group chưa chặn INSERT thêm

**Artifact xác nhận:**003 chặn UPDATE/DELETE posting_lines/entry_groups;002 kiểm balance deferred sau INSERT. Chưa guard seal/commit boundary khi INSERT thêm lines vào group đã commit.

**Phản ví dụ suy luận từ SQL:** một nhóm đã cân có thể nhận thêm hai dòng +100/−100 vào các ledger accounts khác nhau; vẫn sum0 và event posted, nhưng balances thay đổi. Cần narrow posting boundary, group lifecycle/seal và serialized guard chặn append sau commit; correction tạo nhóm mới. Test cả balanced/unbalanced append và race giữa seal/append bằng hai connections. Không gọi đây là test đã chạy.

## DB04-F03 — Retarget ledger account làm thay đổi diễn giải sổ cũ

ledger_accounts là mutable, account_id/kind chưa có immutable-on-use guard;003 chỉ yêu cầu version+1. posting_lines giữ ledger_account_id nhưng truy vấn balance join account_id. Retarget một ledger account đã có postings sang account khác có thể dời lịch sử mà không đổi dòng ledger. Cần freeze identity/kind/account binding đã được dùng, mapping mới tạo row mới; test retarget trong cùng tenant và concurrency. Archive/display metadata có thể đổi theo policy mà không retarget.

## DB04-F04 — Plan version không có định danh aggregate

SQL001 tạo actual_unique_active(workspace_id,plan_version,event_id), nhưng plan_version là bigint; financial_plans có id và version tăng riêng. Hai plans đều version1 có thể va chạm; số1 không định danh một plan revision. plan_items.plan_id còn nullable cho standalone items.

Theo BR-29 cần làm rõ planning scope/revision identity. Đề xuất stable plan/scope ID + revision, derive từ authorized plan item; composite FK hoặc revision record kiểm tính nhất quán. Standalone items cần scope rõ; không bịa planId từ số version, không tự thêm wire field nếu server có thể derive. Test hai plans cùng version, hai items cùng revision, unlink/relink, historical revisions và aggregate reporting không double-count.

## DB04-F05 — Decimal checks chưa đủ và bounds cần mapping rõ

Model dùng numeric(18,0), numeric(28,8), phần lớn CHECK >0/>=0 nhưng không finite checks. PostgreSQL numeric NaN có so sánh đặc biệt và numeric(p,s) làm tròn khi scale input lớn hơn s; CHECK sau coercion không biết input bị làm tròn. Cần reject NaN, input fractional VND/excess precision trước cast và chốt normalization boundary; test direct writes qua mọi role được phép, không chỉ HTTP. [Numeric types](https://www.postgresql.org/docs/16/datatype-numeric.html).

MoneyDecimal canonical có tối đa18 digits phù hợp numeric18; quantity wire tối đa18 digits phần nguyên,8 phần thập phân trong khi numeric28,8 chứa20 digits phần nguyên. Đó là storage capacity rộng hơn, không tự là defect, nhưng conversions/valuation overflow phải có policy. Version BIGINT >0 ở DB khác wire minimum0 và safe integer max: derive/validate đúng expected vs stored; không âm thầm truncate hoặc cast tiền sang Number.

## DB04-F06 — Snapshot facts và projection cache chưa tách rõ

snapshots UNIQUE(workspace_id,financial_version), có as_of/refs/projection. BR-19/26 yêu cầu scope/period/asOf nhất quán. Một facts snapshot dùng chung cho nhiều query là hợp lệ **nếu** projection derive theo query; một cached response cho mọi query thì sai. Current artifact chưa chốt cái nào. Không thể kết luận schema hỏng chỉ từ unique key.

Đề xuất canonical facts descriptor theo source versions; projection cache key gồm query scope/period/asOf/engine/schema version và source refs phù hợp. Quote, planning, coverage, category revisions cần invalidation/source version rõ. Test hai filters cùng financial_version, thời gian trôi làm stale mà không mutation, cache rebuild và historical render.

## DB04-F07 — History/retention đang dựa vào cam kết service

003 bump_version chỉ kiểm version+1 và updated_at, không tạo version_history. Dictionary nói service phải lưu history, chưa có implementation. Polymorphic object_type/object_id không có FK tới object/revision; mutable table UPDATE hợp lệ có thể không có old payload/version refs nếu workflow thiếu bước.

Cần mọi mutation thuộc một UnitOfWork ghi current+revision/history+replay/version atomic; narrow DB guard/procedure cho critical writes hoặc kiểm complete history trước commit. Tách frozen history/snapshot refs phải giữ khỏi cache TTL30d; financial_plans/simulations/agent_runs đang FK snapshots nên xóa cache row sẽ vướng history. Test failed bundle rollback, historic plans/quotes/categories tái hiện đúng và retention không làm mất frozen context.

## DB04-F08 — Queue fields không đồng nhất, chưa có fencing protocol

Receipts/refresh_jobs có next_attempt/attempts/lease_until/lease_token; import_jobs thiếu next_attempt, agent_runs thiếu next_attempt/attempts, awaiting_user không giống retry runnable. Không có generic schedule checkpoint/attempt journal/retention queue. Không có conditional claim/finish SQL hoặc fencing tests. Lease_token text có thể dùng fencing nếu protocol đúng; thiếu số generation không tự chứng minh lỗi.

Chọn J1 hay J2 rồi chốt một authority cho delivery state; cancellation/revoke checks lúc commit, queue claim bounded và stale lease reject. Không dùng ops_jobs làm queue chứa private finance/prompt. Test crash trước/sau effect commit, expired lease, duplicate schedule, await-user resume, cancellation và graceful shutdown.

## DB04-F09 — Allocation/refund/owner confirm cần khóa chung

goal_allocations amount>0 và FK không bảo đảm tổng allocations<=eligible cash. Cross-row cumulative refunds, expected versions và atomic draft confirmation tương tự. Điều này đã được README phân công service, nhưng chưa có SQL runtime/oracle nên không là domain correctness PASS.

Lock account/aggregate anchor theo order chung, hoặc SERIALIZABLE với whole-transaction retry; không chỉ khóa những allocation rows đang tồn tại. Actual chi tiêu không bị chặn bởi earmarks. Owner confirm draft chỉ Plans/Goals/links/history/replay, không actual. Test concurrent allocations/refunds, race owner edits/confirm, stale preview và lost response replay.

## DB04-F10 — Retention không thực thi được bằng generic delete/update

Evidence/content, snapshot/projection, idempotency/result là immutable rows;003 cấm cả UPDATE/DELETE. Import preview giữ staged rows trong blob nhưng import_jobs FK preview khiến xóa preview sau24h không đơn giản. Không có retention role/procedures/deletion journal; role file thừa nhận chưa cấp DELETE.

Giữ identities/digests/replay tombstones, tách expirable payload/cache/staging hoặc narrow audited redaction procedure. Preserve dedupe trong window đã chọn; purge customer data theo owner authorization và backup window, không BYPASSRLS chung. Test expired payload vẫn retry-safe, erasure qua FK graph và restore không resurrect dữ liệu đã xóa.

## DB04-F11 — Synthetic constraints và admin auth chưa thành T1 real design

identities.email chỉ nhận .test; workspaces.profile chỉ synthetic. Đó là safety gate có chủ ý của baseline, **không xóa đại để “bật real”**. Target T1 cần environment policy/seed separation/rollout riêng.

ops_accounts chứa subject_token/workspace_token/device_health của khách hàng, không có credential/MFA của admin. sessions.role cho owner/admin nhưng subject FK identities; ops role không có quyền sessions. Chưa thấy storage/API lifecycle cho admin login/MFA/reset đủ feature BE-16. Cần dedicated auth design (tables hoặc identity provider được chọn), session audience, MFA/recovery/revoke và contracts bổ sung tại ARCH-05/06; không gắn admin credential vào ops_accounts metadata.

## DB04-F12 — RLS, membership và tenant references cần kiểm bằng role thật

39 tenant tables có composite keys/FKs là nền tốt. RLS dùng app.subject_id/workspace_id và workspaces.owner_id; app/worker phải lấy context từ trusted auth và SET LOCAL. Đây là owner model, không có yêu cầu tự thêm collaboration/memberships. GUC do backend thiết lập không chống compromised trusted backend; FORCE RLS không chống superuser theo T1. [Row security](https://www.postgresql.org/docs/16/ddl-rowsecurity.html).

sessions.device_id là text không FK; có thể là browser client identifier thay native device ID nên cần định nghĩa trước khi thêm FK. Các global references/catalogue grants, role inheritance/permissive policy OR, trigger SELECT privileges, tenant error leakage và pool context reset cần direct-role tests. Fixture schema-owner hiện không chứng minh những điều đó.

## DB04-F13 — Quote/profile history và freshness

gold_profiles/instruments/holding references mutable; quote_observations có holding/provider/entitlement/unit/side/time nhưng chưa explicit frozen instrument/profile version/FX provenance đầy đủ. Thay holding/profile có thể làm lookup cũ bị diễn giải theo cấu hình mới nếu chỉ join current state. quality immutable 'fresh' cũng không phản ánh stale khi thời gian trôi; chỉ dùng như quality-at-ingest nếu có định nghĩa.

Đề xuất freeze compatibility refs/profile/version và original unit/source price/FX provenance cần thiết; current freshness derive từ quoteAsOf/evaluation time/source calendar. Repeated fetch cùng fingerprint giữ quote record, cập nhật fetch/job metadata đúng semantics. Không provider calls mang private holdings dư thừa; cross-workspace shared quote cache chỉ khi license cho phép, chưa cần tách market DB.

## DB04-F14 — Holdings và CSV cần quy tắc lưu cụ thể

holding_movements có quantity>=0 và delta nullable, kind declaration/investment/correction nhưng chưa quyết định authoritative balance-after hay delta aggregation cho từng kind. Cần deterministic order/history, initial declaration không giả purchase, correction reason/reversal rules và atomic investment cash+quantity. Chưa thấy constraint cost_date/cost/profile confirmation versions đủ nghĩa; service validation và historical readers phải khớp.

import_previews.rows giới hạn256KiB cho cả array; cap1000rows không bảo đảm vừa khi descriptions dài. Cần normalized import_rows/chunks và stable row IDs, selected set digest, row outcomes; hoặc chứng minh giới hạn payload phù hợp contract mà không bỏ feature. Ledger selected batch vẫn atomic theo BR-11, staging chia rows không cho phép commit nửa batch âm thầm.

## DB04-F15 — Migration/backup/restore chưa đủ executable acceptance

preflight/postflight chủ yếu SELECT/comment, không tự fail khi sai counts/invariants; chưa migration journal/lock/checksum runner. negative fixtures chỉ3 blocks và yêu cầu schema owner; chưa validate P2/RLS/concurrency. Đây là test templates, không coverage đủ.

Daily dump + client xóa outbox sau ACK có thể mất receipt ACK sau backup khi server restore. Cần recovery epoch, latest deletion/revocation/dedupe journals ngoài backup cũ, replay window hoặc WAL protection theo RPO đã chọn; không claim zero data loss. Backup toàn DB phải không bị RLS lọc; role/config/key/signing backups riêng. Sau restore dừng traffic tới khi reconciliation/roles/fences đạt; đo RPO/RTO. Không chạy protected-candidate.sql để bù gaps T1.

## DB04-F16 — Indexes cần theo query, chưa có EXPLAIN

lines_balance(workspace_id,ledger_account_id,group_id) hữu ích cho balance nhưng không có group_id ngay sau workspace để tối ưu trigger query WHERE workspace_id/group_id; cân nhắc group lookup index sau đo. receipt_pending theo workspace/created_at thay next_attempt/lease; import/Agent due selection và history/expiry cần indexes hoặc queue layer tương ứng. Chưa có cost/cardinality plans.

Review table keys/actual key phải sửa theo F04 trước tạo index. Không index mọi FK/JSON field; chọn leading columns theo authorized query/pagination/predicate, partial index filter khớp state machine. EXPLAIN (ANALYZE, BUFFERS) chỉ trên synthetic representative data; benchmark trên I0/I1 profile, kể cả backlog lớn và hot account concurrency.

## DB04-F17 — ERD/dictionary chưa biểu diễn đầy đủ schema

ERD generator chỉ từ model.relations nên thiếu inline global FKs, workspace edges và2 late messages FKs được thêm riêng trong001. Chỉ36/54 bảng xuất hiện;18 bảng vắng gồm auth/ops/history/preview/replay và global catalogue. Nullable FKs được vẽ mandatory; uniqueness1:1 của entry_groups.event_id chưa phản ánh. Model indexes không có explicit unique boolean; generator suy từ tên index. Column meaning hiện nhiều ô chỉ tách tên bằng dấu cách.

Cần model FK metadata đủ, nullable/cardinality/unique rõ, tất cả entities gồm isolated ops tables; generator target edition xuất SQL/model/dictionary/ERD cùng authority, tránh overwrite lịch sử. Dictionary thêm unit/scale/null semantics/state/owner/security/retention/provenance/oracle, không chỉ đổi underscore thành space. Mọi delta đi kèm mapping consumer/API review. R1/r2 giữ nguyên.

## Kết luận và mức chứng minh

17 findings trên gồm defects suy luận trực tiếp từ cấu trúc và các design/runtime gaps. Chưa có database chạy để kết luận SQLSTATE hoặc test PASS. [Static inventory](../execution/evidence/arch-04-research-2026-10-08/static-inventory.json) chỉ xác nhận inventory/ownership/artifact parity; [preservation](../execution/evidence/arch-04-research-2026-10-08/preservation.json) xác nhận source/schema/baselines không bị sửa trong research.

Khuyến nghị D1 + J2. Khi được chọn, cập nhật ERD/dictionary/target migrations/P2 grants và ADR-011; tiếp execution PostgreSQL disposable theo scope tiếp theo, với failure cases ở từng finding. Phần BR-44 anti-root-Ops cũ cần đồng bộ về T1; không sửa yêu cầu trở lại T2.
