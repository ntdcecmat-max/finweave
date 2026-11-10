> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

> **ARCH-06 hiện hành:** [Identity/session/permissions](../security/identity/identity-access-design.md), [ADR-013](adr/ADR-013-first-party-identity-and-scoped-credentials.md), [API002](../contracts/v2-t1-r2/README.md), [identity DB delta](../data/target-t1-auth/README.md). Auth design supersede follow-up ARCH-06 trước đây; implementation/crypto/SQL/mail/native/security vẫn NOT RUN. API001 và DB D1/J2 giữ lịch sử, không overwrite.

# Deployment topology v0.4 — I0 + I1 / A + T1 / S1 + P2

08/10/2026 · **ARCH-03 ACCEPTED BY OWNER — DESIGN, NOT DEPLOYED**. Theo [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [environment matrix](environment-matrix.md), [cost model](../product/cost-model.md), [Stack](tech-stack.md) và [module HLD](module-high-level-design.md). Hostnames/IP dưới đây chỉ là mẫu, không endpoint đã cấp hoặc domain đã sở hữu.

## 1. Topology được chọn

**I0:** local cho phát triển/kiểm thử đầy đủ. **I1:** Oracle Always Free VM cho cloud synthetic pilot khi được cấp tài nguyên hợp lệ; real T1 có điều kiện sau gates. Một Linux host có thể chạy PostgreSQL, hai API và worker profiles; P2 tách processes/credentials/roles, không buộc thuê một máy cho mỗi process. Containers/Compose là hướng đóng gói, exact versions chưa pin.

| Thành phần | I0 local | I1 cloud pilot | Ranh giới |
| --- | --- | --- | --- |
| User web | Build/dev server riêng | Static assets qua HTTPS reverse proxy, origin user | Public config/API URL, không secrets |
| Admin web | Build/dev server và origin riêng | Static assets qua HTTPS origin admin | Session/admin identity riêng, metadata-only |
| User/device API | user-api process | Container/process riêng, internal port | Finance role có tenant/object/device authorization |
| Ops API | ops-api process | Container/process riêng, internal port | Ops role, không finance pool/prompt/evidence/provider secrets |
| Ingestion/import | Worker profile process | Process riêng | Domain posting qua authorized services/transactions |
| Market worker | Profile riêng | Process riêng | Quotes/jobs, không sửa cash/quantity |
| Agent worker | Profile riêng | Process riêng | Scoped read/simulate/draft, không actual/owner confirmation |
| Retention | Profile riêng | Process riêng hoặc bounded task với cùng role boundary | Policy/allowlist, không generic DB admin |
| PostgreSQL | Loopback/private container network, DB test riêng | Persistent volume, private container network | Không public port5432; role riêng mỗi capability |
| Scheduler | Khi máy bật | Host timer gọi bounded enqueue command | Durable job unique keys; không chạy provider work trong HTTP |
| Migration runner | One-off test runner | One-off release runner | DDL role riêng; không cấp cho API/workers |
| APK | Build/ký/cài local | Signed artifact qua release HTTPS path | Native collector/outbox; không embedded secrets |
| Model | Scripted synthetic hoặc local PoC | Endpoint riêng được kiểm, chưa chọn provider | Không public unauthenticated; inference không mặc định đủ tài nguyên |
| Backup/alerts | Ngoài runtime/DB test | Backup mã hóa ngoài VM, alert độc lập host | Destination/quota/keys chưa chọn; chưa có restore evidence |

User API, Ops API và worker profiles dùng chung versioned backend codebase/Engine và cùng database consistency boundary. Phân tách process không là microservices hoặc nhiều canonical ledgers. DB grants/import boundaries/network/auth vẫn phải kiểm, container label không là proof isolation.

## 2. Network và tọa độ

Cách định tuyến đích: `https://app.<domain>/` phục vụ user web và `/api` proxy User API; `https://admin.<domain>/` phục vụ admin web và `/api` proxy Ops API. APK dùng User/device API URL của environment, không dashboard route. Release artifact ở HTTPS path/host riêng theo policy; khóa ký không trên public host.

VM không tự cung cấp domain ứng dụng/TLS. DNS/hostname miễn phí hoặc domain sẵn có cần kiểm quyền sở hữu, certificate automation và renewal trước cloud pilot; domain trả phí chưa được duyệt. Nếu dùng nhiều provider domains thay topology cùng origin, phải review lại cookie/CORS/CSRF trên browser thật.

Chỉ public HTTPS và kênh quản trị host được giới hạn; các internal API ports/DB/model không mở Internet trực tiếp. Browser dùng backend HttpOnly session cookie với CSRF/Origin checks; native token/enrollment/revoke riêng theo ARCH-06/10. Credentials DB/provider/model/signing không vào React/APK/logs. Remote DB connections hoặc dịch vụ ngoài host dùng TLS và verified role/network configuration.

## 3. Oracle Always Free và điều kiện tài nguyên

Chọn Oracle Always Free làm hướng I1, chưa xác minh tài khoản/capacity/region. Hạn mức công khai được nghiên cứu tại [ARCH-03 options](ARCH-03-options.md), phải kiểm lại console/terms/Always Free eligibility ngay trước provision. Không nhầm trial credits có hạn với entitlement miễn phí lâu dài; không tự PAYG hoặc chọn tài nguyên tính phí.

Một VM chung backend/DB là một failure domain, không HA. Capacity/reclaim/outage có thể làm gián đoạn API và scheduler. Khi không cấp được máy hoặc không đủ tài nguyên, giữ I0 và báo điều kiện thiếu; I2/I3 chỉ là alternatives cần quyết định mới. Không tạo tải giả để né reclaim.

Sizing khởi đầu để thử: backend/PG host khoảng4 GiB RAM không gồm inference, giới hạn memory/concurrency/import batches theo process; không capacity claim. Image/dependencies phải hỗ trợ ARM64. Tổng DB pools gồm tất cả roots/replicas và dành connection cho backup/migration; đo RSS/CPU/event-loop/disk/pool wait/queue age trước chốt giới hạn.

## 4. Scheduler và daily/manual refresh

Hướng lịch giữ daily18:00 Asia/Ho_Chi_Minh (11:00 UTC); exact cadence/window là cấu hình cần kiểm trong ARCH-09. Host timer chỉ enqueue job theo source/entitlement/businessDate; worker claim lease, gọi provider ngoài transaction và commit kết quả có fencing/idempotency. Manual refresh đi cùng quota/cooldown/coalesce, không bỏ giới hạn nguồn.

Không còn thiết kế Supabase Cron/pg_net wake API làm baseline. Startup và nhịp kiểm overdue tạo catch-up có bounded retry; timer restart không tự chứng minh job đã chạy. Host dừng thì schedule dừng. Khi lên lại chỉ cập nhật latest hợp lệ và ghi missed coverage, không bịa historical quotes hoặc biến last-good thành fresh.

Retry/backoff/lease duration/attempts/concurrency là cấu hình đích để ARCH-09 và spike đo; không nhận các con số draft cũ là SLO. Cần kiểm ít nhất7 ngày lịch thực trong synthetic trước claim daily reliable. Không setInterval trong browser hoặc HTTP request fire-and-forget làm scheduler duy nhất.

## 5. Đồng bộ clients

Receipt+durable dispatch commit trước ACK, worker post hoặc Review sau đó. Retry/lost ACK/restart không được duplicate effects; revoke/binding/owner epoch phải fence. Android uploader/outbox native hoạt động độc lập WebView nhưng bị giới hạn OS/OEM phải báo coverage gaps.

Sau mutation/price commit, snapshot version được cập nhật và clients fetch; foreground polling20s/refresh-on-focus là candidate cần đo quota/latency. Background dừng polling; Android queue native vẫn retry theo policy. API lỗi, cache stale hoặc collector gap phải có nhãn thật. Socket/push là tối ưu tùy chọn, không điều kiện bắt buộc của topology này.

## 6. Environments và real T1

[Environment matrix](environment-matrix.md) tách LOCAL-SYNTHETIC, STAGING-SYNTHETIC và REAL-T1 bằng DB/roles/keys/client URLs/signing channel phù hợp. Không copy finance real vào staging. Khi cloud pilot chuyển real, staging giữ ở local hoặc host khác; không chạy test phá hủy trên host real và không đổi nhãn DB demo rồi nhận real.

T1 theo [ADR-008](adr/ADR-008-modular-backend-trusted-server.md): runtime/root/DBA/key operators có khả năng đọc finance; app-admin không có quyền finance. TLS, encrypted storage/backups, tenant/admin/device authorization, redaction, privacy/provider controls và recovery vẫn bắt buộc. Enclave/anti-Ops protected PoC không là gate T1.

REAL chưa bật. SEC-REAL-T1, SQL/domain/concurrency, auth, native/APK/UAT, source rights/parser, Agent/model eval và restore phải có evidence tương ứng. Chọn I1 không nghiệm thu các điều kiện này.

## 7. Backup, logs và phục hồi

Hướng backup: logical export mã hóa hằng ngày ra ngoài VM,7 daily+4 weekly; file objects/release artifacts/signing/recovery/config cần backup riêng. Bản cùng volume/VM không tính off-host. Destination, access keys, dung lượng retention và quota còn cần kiểm; không mặc định object storage miễn phí đã được chọn.

Máy cá nhân nhận backup chỉ là destination đủ dùng nếu availability/freshness đạt mục tiêu; khi máy tắt hoặc mất kết nối phải báo backup overdue, không claim RPO24h. Cần destination và alert độc lập host trước real. Mục tiêu RPO24h/RTO1ngày chưa đo; restore drill ra DB sạch, kiểm invariants/replay/roles/keys và deletion journal trước nhận recovery.

Theo dõi API latency/errors, DB disk/connections, queue age/overdue, quote freshness, backup age, restore result, quota và native sync gaps bằng metadata. Không finance/raw/OTP/token/prompt trong logs. Log retention/deletion chi tiết thuộc ARCH-07/13, không giữ vô hạn hoặc xóa ledger để lách quota.

## 8. Model, sources và giới hạn chi phí

Model gateway/runtime riêng; local model tự host hoặc cloud model chỉ chọn sau ARCH-12 eval/privacy/cost. Không hứa model đủ nhanh vì host có RAM. Manual planner vẫn hoạt động khi model unavailable, nhưng đầy đủ Agent chưa pass. Nguồn stock/gold cần entitlement/quota/automation/cache rights ARCH-11; synthetic/manual không thay yêu cầu auto updates.

Mục tiêu cloud rent0 trong Always Free quota; [cost model](../product/cost-model.md) theo dõi model, sources, domain, backup, email/distribution và điện/thiết bị riêng. Không auto upgrade/paid fallback. Cloud account/VM/DNS/TLS/SQL/runtime/provider/restore/security vẫn NOT RUN; đây là thiết kế được chọn, chưa triển khai.

Candidate Render/Supabase/Vercel/Supabase Cron của v0.3 được thay bởi ADR-010. [Options](ARCH-03-options.md) giữ alternatives và nguồn nghiên cứu; r1/r2 giữ lịch sử nguyên trạng.

## ARCH-07 — Vị trí thành phần bảo mật chưa provision

Finance host cần volume mã hóa và secret files theo process. Repository backup mã hóa và endpoint witness phải ở ngoài host; recovery capsule và khóa recipient có custody offline riêng. Domain/IP, quota, TLS credentials và versions chưa được chọn/cấp. Witness hoặc repository trên cùng VM chỉ dùng thử synthetic, không đạt điều kiện độc lập.

Restore chỉ mở hệ thống mới sau khi đã chặn writer cũ. Lệnh thu hồi/xóa có hiệu lực local khi witness lỗi; xác nhận hoàn tất an toàn cho recovery phải chờ durable anchor. Backup giữ 7 bản ngày / 4 bản tuần trong tuổi tối đa 34 ngày, prune dữ liệu không tham chiếu trong 24 giờ. Cảnh báo quá hạn, thiếu khóa và recovery đang chờ phải độc lập finance host. [Runbook chi tiết](../security/t1/backup-restore-erasure.md).

## ARCH-08 — Forecast compute placement

ForecastWorker là compute-only capability trên shared Planning source, cùng J2/PG consistency boundary. Cần tách compute-heavy chunks khỏi HTTP/heartbeat event loop bằng worker process/thread profile phù hợp, chốt và benchmark tại ARCH-09; không tự sinh external model service/Redis/queue riêng. Không public executeForecastRun, không cấp worker quyền actual hoặc Agent tools.

Private input/checkpoint/result pages được lưu theo [DB004](../data/target-t1-domain/README.md), mã hóa/backup/xóa theo ARCH-07. Không provision hoặc khẳng định free-VM capacity từ schema/design.

## ARCH-09 — Scheduler và worker runtime topology

I0/I1 không đổi. Host tick60s và durable due scans chạy dù mọi clients tắt; private worker lanes theo capability, CPU pool bounded, native WorkManager chỉ uploader riêng. LISTEN/NOTIFY optional wake-up không durable queue. Quota/backup/restore gates vẫn phải đo; không provision hoặc auto paid fallback.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

APK assets bundled, compiled HTTPS API origin khi REAL; không remote server.url. Build/distribution local free-first; optional limited account20devices conditional, chưa provision/publish/register.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Market worker chỉ egress read-only provider origin/routes đã duyệt; no provider secret trong web/APK/admin. Public gold page không tự là API. Host timer không hứa source ready hoặc total fee0.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Inference service local/private ACL chỉ AgentWorker→chat route, no public11434/browser access. I1 cohost cần đo RAM/CPU, không bảo đảm free VM đủ model; không tunnel/paid/cloud tự động.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Systemd/Compose quản các process P2 trên một host; PG/model private. Backup, witness và cảnh báo cần failure domain khác. Endpoints/versions/quota chưa provision; lịch backup12h mới là candidate tạo dự phòng.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
