# PostgreSQL physical schema và migrations

08/10/2026 · **artifact cho local/disposable synthetic**. 54 bảng/18 indexes trong [physical-model.json](physical-model.json), [dictionary](data-dictionary.md), [ERD](erd.md). Định nghĩa physical model trong `tools/handover/build_data.py` tạo JSON+001+dictionary+ERD cùng nhau trước lần triển khai đầu; sau khi migration được thực thi phải tạo migration mới, không sửa checksum lịch sử. Các guards/security SQL được review riêng, không generated từ DTO.

| Thứ tự | Artifact | Mục đích |
| --- | --- | --- |
| 0 | [preflight](preflight.sql) | Read-only: PostgreSQL>=16, dedicated disposable synthetic DB, chưa có schema fw; không shared/real data |
| 1 | [001](migrations/001_synthetic_tables.sql) | Tables, composite tenant FKs, unique/check constraints, query indexes; transaction riêng |
| 2 | [002](migrations/002_guards_and_boundaries.sql) | Device/binding/receipt boundaries, immutable posted ledger, deferred balancing, FORCE RLS/default deny |
| 3 | [003](migrations/003_mutable_and_immutable_triggers.sql) | Mutable versions increment exactly1, immutable records reject generic UPDATE/DELETE |
| 4 | [role provisioning](role-provisioning.sql) | Dedicated NOLOGIN roles/grants/policies. Deployment tạo LOGIN credentials bên ngoài repo; schema ownership không cấp app/admin |
| 5 | [seed](seed-synthetic.sql) | Chỉ disposable DBA/superuser; .test users A/B, opening balanced, durable unposted receipt; không account dùng thật |
| 6 | [postflight](postflight.sql), [negative fixtures](negative-fixtures.sql) | Expected54 tables/RLS/balancing/receipt; lỗi cross-tenant/replay/immutable; **chưa chạy** |

Không có database khả dụng trong lượt này: không psql, Docker daemon chưa chạy. pglast kiểm cú pháp SQL ngoài; không compile PL/pgSQL, validate references bằng PostgreSQL, chạy constraints/RLS, đo indexes hoặc migration PASS. Backend team phải chạy toàn chuỗi và lưu logs trên database disposable trước chấp nhận schema.

Mỗi migration chạy `ON_ERROR_STOP=1` và transaction của tệp; lock_timeout5s, statement_timeout60s do runner đặt. Runner bên backend phải ghi filename+SHA256 vào migration journal sau success, refuse checksum đổi. Không `IF NOT EXISTS` che drift. Nếu001 fail: transaction rollback, schema không được coi đã tạo; nếu002/003 fail: giữ schema từ bước trước, dừng traffic, rollback transaction thất bại, sửa/review rồi chạy lại từ checkpoint. Không chạy lại001 trên schema đã có. Artifact này chưa dùng ngoài DB disposable; phục hồi local test bằng tạo DB disposable mới và replay, không tự DROP hoặc rollback dữ liệu đã commit trên shared DB.

Trước môi trường lâu dài: snapshot/pg_dump trước đổi, restore drill ra DB khác, expand/contract thay destructive down, test interrupted migration. Không kèm down DROP CASCADE. Tài liệu [vận hành](../../handover/operational-decisions.md) đặt RPO/RTO/backup retention; restore phải reapply deletion journal và receipt/idempotency tombstones trước mở uploader.

| Invariant | DB artifact | Trách nhiệm service/Engine còn phải triển khai và kiểm |
| --- | --- | --- |
| Retry không effects trùng | Unique receipt workspace/device/eventKey/revision; unique principal/operation/key; immutable commit IDs | Semantic digest conflict, replay-before-version-check, one transaction effects+result; semantic dedupe khác transport identity |
| Posting/transfer/correction | >=2 lines/group, signed sum0 deferred; group requires posted event; exact reversal per ledger account; posted lines/event immutable | Validate đúng account/type/amount/fee/currency, reversal+replacement atomic, transfer không expense, origin refund limits under lock |
| Opening không income | Event kind opening, seeded equity counterpart | Report filter opening/equity; account creation generates đúng postings; không tổng cộng opening hai lần |
| Giá không đổi quantity | Quotes/movements bảng riêng, quote unique fingerprint | Price worker chỉ insert quote+projection version, không event/movement; historical compatibility/FX/rounding oracle |
| Planned income không funding | Plan rows khác actual posting | Lock account, derive current eligible cash từ lines; không lấy forecast làm available cash |
| Goal không cộng tài sản lần2 | Allocation/link tables không ledger posting | Sum allocations across all goals, funded pro-rata/floor+remainder, actual shortfall không chặn posting; need concurrent allocation test |
| Draft bundle atomic | Composite FKs, immutable history/idempotency, expected versions | Single transaction goals+plans+links+preview-consumption+history+workspace version+result; simulated failure giữa bundle must rollback |
| Durable receipt khác posted | State+eventId nullable, ACK timestamp khác committed ledger | Commit receipt trước202; parse/matching async; needs_review không tiền; retry payload giữ digest |
| Queue/binding không đổi owner | Device owner must match workspace; device key immutable, binding retarget forbidden; receipt validates live binding | Local queue không ở server schema. Keystore/outbox immutable owner epoch; revoke/capture race fence; account switch quarantine. DB không chứng minh Android behavior |
| Version/concurrency | Mutable row version exactly+1, snapshots unique financialVersion | Expected object versions locked+checked; event annotation/category history không UPDATE posted event. Category override nằm version_history object_type=event_category, snapshot projection overlay; event payload immutable. Public event DTO version lấy aggregate version từ history, không chỉ events.version |
| Retention/erase | Table retention trong dictionary; default generic delete denied for immutable records | Retention worker cần procedure quyền hẹp và test trước bật. Hiện purgeExpiredData trả unavailable tới khi procedure được review; không dùng owner BYPASSRLS. Payload redaction giữ identity/digest; explicit workspace erasure cần deletion journal/backup window |

JSONB chỉ cho normalized evidence, frozen contexts/results, staged rows/draft bundle/history. `schema_ref` trỏ canonical v2 component+version; backend validate trước insert và sau đọc, size bound256KiB/record. SQL JSONB không được quảng cáo tự kiểm toàn schema hoặc ciphertext domain. [API↔data mapping](../../contracts/v2/api-data-mapping.csv) tách scalar maps, structured conversions và projections/command parameters; không giả mọi DTO field là cột DB.

[Protected storage candidate](protected-candidate.sql) là **database khác**, bốn bảng ciphertext/opaque tags/queue. Không chạy cùng conventional tables, không dùng plaintext SQL amount checks/indexes cho encrypted records. Protected runtime phải validate logical constraints, indexes và atomic bundle trước sealing; DB chỉ bảo toàn ciphertext references/atomic writes. Nonce/key-release/anti-rollback/restore/access-pattern leakage còn NOT RUN và SEC-REAL blocked. Không đủ bàn giao triển khai protected backend chỉ từ candidate này.
