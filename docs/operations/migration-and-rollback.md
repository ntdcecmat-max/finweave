# Migration, phát hành và rollback

## 1. Một migrator, checksum bất biến

001–003 hiện là executable synthetic DDL chưa chạy; target D1/J2→DB005 vẫn expand design. Khi implementation mới viết004+ theo approved plans, không giả hiện có87bảng thực thi. Infrastructure migration history schema riêng ghi ID/checksum/status/timestamps/release và phase progress không finance; schema/grants này phải có DDL đã review, được kê trong physical deployment inventory ngoài87 domaintables. Không sửa migration đã applied để sửa checksum.

Runner giữ session-level PostgreSQL advisory lock trên dedicated connection suốt release, reject runner khác; mất connection→dừng/quarantine, không tiếp tục phase từ memory. Journal+DDL atomic trong mỗi transaction nếu hỗ trợ; checksum mismatch/unknown prior schema→halt. Explicit lock_timeout5s/statement_timeout60s là starting candidate, per migration review, không vô hạn toàn bộ; backfill chunk/timeouts/resume checkpoints riêng. Không network/provider/model hoặc long batch trong financial transaction.

Expand nullable tables/columns/guards→bounded resumable backfill→verify constraints/indexes/projections/permissions/invariants→cutover. Domain effect idempotency, revoked epochs, recovery denies, quotas, job deadlines và frozen payload versions phải giữ. Unknown legacy ownership/rights/input→quarantine, không đoán. Contract/drop chỉ release sau khi toàn bộ readers/writers/jobs/installed APK compatible, retention/archive/backup reviewed. Không dual dispatch J2+legacy.

PostgreSQL `CREATE INDEX CONCURRENTLY` không trong transaction; thất bại có thể để invalid index. Journal phase intended→catalog observed→verified/applied, inspect validity/definition/duplicates, controlled repair before retry. Không `IF NOT EXISTS` coi tên trùng là cùng index. Role/grants/RLS/triggers cùng negative tests, direct SQL stale worker tests; không production seed.

## 2. Maintenance stop/start

Release coordinator đặc quyền giữ deploy lock và DB maintenance state; public ingress từ chối new owner/Ops mutations, native uploads và enqueue. Read chỉ nếu version/recovery/privacy safe; nếu chưa chứng minh thì maintenance503 cho toàn finance, UI không báo saved. Exceptions deny/revoke/erase phải dùng trusted narrow control path; active app mutation bị chặn không được nhận giả success. Tiếp tục witness delivery, denial/erase deadlines, backup và alerts trong maintenance.

Stop scheduler/claim mới→drain active workers với grace90s starting bound; heartbeat/cancel còn sống để kết thúc. Khi quá hạn: fence persisted execution/recovery generation và service authority, terminate process, xác minh old writer/DB connection đã hết; chưa chứng minh fence thì không migrate/open. J2 rows không reset attempts/deadlines/budgets, unknown external calls quota charged, financial unknown COMMIT lookup marker. Old network response không được publish sau fence. Backup consistent pre-release và witness pending đã reconcile trước irreversible DDL.

Migrate→start API private, validate schema/grants/registry/fences→new workers đúng job/payload policies→synthetic smoke/negative safe cases→restore scheduler→mở ingress. Smoke không tạo fakefinance vào real ledger; dùng tenant synthetic riêng chỉ khi environment có isolation reviewed, real smoke read-only+authorized explicit controlled test. Atomic release config/current pointer, no mixed API serializers/frontend target. Startup catches missed business occurrences qua J2, không replay mọi timer tick.

## 3. Rollback không rewind tài chính

Prior code chỉ rollback nếu release manifest cho phép đọc DB/schema/guards và mọi queued job/payload/auth/API/native revisions hiện có. Không rollback to legacy dispatch hoặc bỏ deny/quota. Nếu không compatible: maintenance + forward fix hoặc quarantine job profile có evidence, không xóa jobs/reset counters để xanh.

Không tự down-migrate, truncate/reset DB hoặc restore pre-deploy dump: dữ liệu đã ACK sau backup sẽ mất, thu hồi/xóa có thể hồi sinh. Restore là incident riêng: fence oldhost, locked restore, latest witness, reset credentials, reconcile quota/gaps theo ARCH07; owner-aware loss statement/RPO. Migration fail giữ serving closed, transactional phase rollback, nontransactional phase inspect catalog rồi repair đúng ID/checksum.

[PG16 index behavior](https://www.postgresql.org/docs/16/sql-createindex.html). Release coordinator/maintenance gate/journal/fences mới SPECIFIED, chưa triển khai.
