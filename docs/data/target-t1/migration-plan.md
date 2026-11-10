# D1 — Kế hoạch migrations tiếp nối

08/10/2026 · **DESIGN SPECIFIED; SQL FILES004+ NOT IMPLEMENTED/NOT RUN**. [Target](README.md), [permissions](permissions.md), [invariants](invariants-and-workflows.md). Các số004–009 dưới đây là nhóm dự kiến cho runner, không phải file SQL đã tồn tại; có thể chia thành nhiều migration khi triển khai. Không sửa001–003, không chạy generator cũ để ghi đè baseline.

##1. Chuỗi thay đổi

| Nhóm dự kiến | Expand/backfill | Cutover/contract và điều kiện |
| --- | --- | --- |
|004 — foundations | migration_journal; admin identity; recovery_journal; payload_objects; Ops control; jobs/attempts/scheduler; roles mới default deny | Bootstrap journal chỉ sau preflight xác nhận checksum/schema001–003; revoke PUBLIC/default grants; chưa dùng fw_worker rộng cho worker mới |
|005 — ledger/domain guards | Thêm seal fields nullable, phân loại groups hiện có; kiểm balance/exact reversal, tài khoản đã dùng; numeric validation boundary; holding sequence/mode | Seal nhóm legacy chỉ khi invariant đúng; vi phạm quarantine/dừng migration, không tự bù tiền. Thay guard003 có chủ đích để building→sealed chỉ trong transaction mới, chặn append vào group cũ; giới hạn account retarget |
|006 — planning/history/cache | planning_scopes/revisions/items, plan_items.scope_id, actual_links.planning_revision_id; snapshot refs/engine key; projection_cache | Backfill từ plan identity + immutable history, standalone scope riêng; không đoán từ plan_version. Nếu thiếu provenance ghi imported baseline revision tại thời điểm migration, không giả lịch sử đã mất; links không xác định dừng/quarantine. Validate composite FK rồi thay active unique index |
|007 — payload/import/price | import_rows; payload refs; profile_snapshot; device/capture/workspace epochs | Copy và kiểm row counts, digests, selected-set identity, pinned snapshot refs; quote profile phải từ provenance đúng thời điểm, thiếu thì unknown/quarantine, không dùng profile mới giả lịch sử. Không xoá inline payload tới khi reader mới đã đối chiếu |
|008 — J2 workers/scheduler | Map domain tasks sang typed jobs; seed business dedupe/watermarks; thêm due/attempt indexes; profile-specific claim/finalize procedures | Dừng/drain legacy claimers, revoke old lease writes, backfill unfinished work, bật duy nhất J2 authority. Chưa xác định job đã commit effect thì reconcile domain replay, không blindly retry. Bỏ lease/attempt/next_attempt delivery fields ở domain sau cutover; lifecycle nghiệp vụ vẫn giữ |
|009 — contract/hardening | Thay synthetic profile/auth constraints theo environment gate; migrate customer/admin sessions; shrink legacy payload/queue fields; indexes/retention procedures | Chỉ sau full parity, rollback/restore rehearsal và ARCH-05/06/07/09 sign-off kỹ thuật. REAL-T1 vẫn cần SEC-REAL-T1/nguồn/native/UAT; migration không tự bật real |

New NOT NULL cột trong target model là **trạng thái cuối mong muốn**: expand thêm nullable/default có kiểm, backfill, validate, rồi mới SET NOT NULL. Các constraints baseline liệt kê trong JSON còn để đối chiếu, không mặc định tương thích với trạng thái contract. No-op dữ liệu hợp lệ vẫn phải kiểm schema thực tế.

##2. Runner và atomicity

- Một migration runner versioned, checksum cố định, advisory lock cấp DB cho một runner; preflight schema/extension/role/ownership/search_path/encoding/timezone và migration order. Dedicated migration role có DDL; application/worker/Ops không có DDL/BYPASSRLS/TRUNCATE hoặc migration secret.
- Mỗi migration transactional khi PostgreSQL cho phép; SQL+successful journal entry cùng transaction. Crash/rollback không ghi success; checksum mismatch dừng, không sửa lịch sử file. Bootstrap001–003 chỉ khi đối chiếu catalog thành công, không tự nhận đã chạy từ tên file.
- `CREATE INDEX CONCURRENTLY` nếu cần không chạy trong transaction block: dùng step riêng restart-safe, kiểm invalid index và journal phase; local chưa có DB lớn nên ưu tiên transactional normal index trước khi cần tối ưu. [PostgreSQL CREATE INDEX](https://www.postgresql.org/docs/16/sql-createindex.html).
- Maintenance window cho destructive contract/queue cutover. App/workers phải từ chối schema revision ngoài compatibility range. Backup và rehearsal trước contract; rollback bằng compatible image/forward repair khi còn expand, restore khi destructive với mất dữ liệu theo RPO đã đo, không hứa down migration không mất dữ liệu.

##3. Index/constraint catalogue bổ sung

| Bảng | Candidate bắt buộc rà | Mục đích / chú ý |
| --- | --- | --- |
| posting_lines | (workspace_id,group_id), (workspace_id,ledger_account_id,created_at,id) | Seal/balance và sổ chi tiết; FK index không tự sinh ở child |
| jobs | Partial (job_type,next_attempt_at,workspace_id,id) WHERE state='queued'; running lease expiry; business dedupe unique | Claim theo capability/global due scan trong trusted queue procedure; ordering fairness chưa đo |
| job_attempts | UNIQUE(workspace_id,job_id,attempt_no) | Audit/fence, tránh duplicate attempt |
| actual_links | UNIQUE(workspace_id,planning_revision_id,event_id) WHERE released_at IS NULL | Một actual event chỉ gắn một item trong cùng frozen revision; khác Plan không va chạm |
| planning_revisions/items | Các UNIQUE trong model và scope/history lookup | FK tới frozen item version, stable standalone scope |
| import_rows | UNIQUE(workspace_id,preview_id,row_key), expiry/status index | Stable selection và cleanup |
| projection_cache/payload_objects | cache unique key, expires_at partial index | Cache eviction/purge tách pinned history |
| recovery/admin/control | journal workspace_token+epoch unique; session token digest unique; control replay unique | Revoke/replay/schema gates |

Giữ các indexes baseline còn đúng; thay actual_unique_active và snapshots unique có kế hoạch. Không khẳng định mọi FK đã có index. Kiểm bằng workload thực tế `EXPLAIN (ANALYZE, BUFFERS)` và write overhead rồi mới chốt tuning; tất cả **NOT RUN**. [PostgreSQL constraints](https://www.postgresql.org/docs/16/ddl-constraints.html).

##4. Acceptance cần chạy trên disposable PostgreSQL

1. Clean install001→latest và upgrade001–003→latest với full-feature fixtures; so catalog/schema diff, row counts/digests/FKs/RLS/roles, migration rerun/checksum failure/crash recovery.
2. Ledger append cân bằng vào group cũ, update/delete/reversal/retarget, NaN/fraction/overflow; hai connections seal/append và races allocations/refund/confirm. Đối chiếu Engine độc lập; whole-transaction retry có bounded attempts.
3. Hai workspace + user/device/Ops/Agent/market/retention identities; forged context, pooled connection reuse, global reference misuse, SECURITY DEFINER escalation, negative direct SQL tests.
4. Hai Plan cùng revision number và standalone items; frozen refs/history không đổi sau edit; cache TTL không mất simulation context; import large file theo budget, cancel/expired/retry/no partial commit selected set.
5. Worker crash trước/sau commit và queue ACK; expired lease/fence, replay digest mismatch, double delivery, revoked binding, startup catch-up; không double financial effect.
6. Logical dump + roles/config/key refs vào host độc lập rồi restore; trước mở uploader so independent latest recovery journal/epoch, xóa lại dữ liệu đã erasure/revoke, đo RPO/RTO. Backup trước receipt ACK có thể thiếu receipt: native phải có reconciliation/replay horizon, không coi ACK là bảo đảm vượt mọi backup. Dump không là PITR; PITR cần base backup+WAL riêng. [PostgreSQL backup](https://www.postgresql.org/docs/16/backup-dump.html), [PITR](https://www.postgresql.org/docs/16/continuous-archiving.html).

Không đánh dấu PASS bất kỳ case nào chỉ vì đã có target model hoặc fixture. 21 gói backend,133 operations và toàn bộ feature vẫn trong backlog.
