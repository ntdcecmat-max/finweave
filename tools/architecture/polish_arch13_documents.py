"""Readable final prose and scoped runbooks; update bundle after this editorial pass."""
from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[2];D=R/'docs/operations'
def md(n,s):(D/n).write_text(s.strip()+'\n',encoding='utf-8')
def put(n,x):(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def runbooks():
 rows=[
 ('Khởi động và reboot','Operator có release đã kiểm, khóa và đúng volume mã hóa.',
  'Giữ cổng công khai đóng. Mở khóa và xác minh mount; kiểm cấu hình, quyền file và secrets. Khởi động PG, kiểm schema/grants/recovery gate; sau đó API riêng, workers, scheduler và reverse proxy.',
  'Sai mount/khóa/schema, recovery còn khóa hoặc chưa biết writer cũ đã dừng. Không tạo thư mục plaintext thay mount.',
  'Mount identity, phiên bản, kết quả readiness và kiểm tra bị từ chối; không xuất secret.'),
 ('Phát hành có bảo trì','Release operator có artifact đã kiểm/ký, ma trận tương thích, backup và witness hợp lệ.',
  'Giữ deploy lock; bật maintenance; chặn enqueue/claim mới. Drain hoặc fence worker cũ. Chạy migration; kiểm readiness và smoke riêng; bật workers/scheduler rồi mở cổng.',
  'Checksum, migration, quyền hoặc smoke sai. Chỉ quay lại code trước nếu đã chứng minh tương thích dữ liệu hiện tại.',
  'Hash source/image/migration, từng gate, thời gian bảo trì và bằng chứng fence.'),
 ('Migration lỗi và rollback','Một migrator giữ lock, có journal và quyền xem catalog.',
  'Giữ maintenance. Phân biệt DDL có transaction và phase ngoài transaction; kiểm trạng thái catalog thực. Sửa đúng phase hoặc forward fix, giữ ID/checksum; chạy lại kiểm tra liên quan.',
  'Không sửa checksum đã applied, reset journal, tự down-migrate hay restore dump để quay phiên bản.',
  'Phase, index không hợp lệ, schema/grants/invariants và release sửa lỗi.'),
 ('Job kẹt hoặc worker chết','Operator đúng capability dùng procedure có scope.',
  'Kiểm lease, policy, deadline, quyền hiện tại và quota. Fence attempt cũ; reaper/retry cùng job khi còn đủ điều kiện. Tra marker để xác định effect có COMMIT hay chưa.',
  'Không tạo key/job mới cho outcome chưa biết, không reset attempts/budgets. Lỗi vĩnh viễn phải quarantine.',
  'Trạng thái job/profile, marker và kết quả fault/replay; không đưa body tài chính vào Ops.'),
 ('Nguồn giá hoặc notification lỗi','Source operator có profile, quyền nguồn và quota đã xác nhận.',
  'Tạm dừng profile bị ảnh hưởng. Giữ giá tốt cuối với nhãn stale; báo coverage cho owner. Kiểm phiên bản, binding, đơn vị, thời điểm; chỉ bật lại sau regression phù hợp.',
  'Không scrape nguồn khác hoặc bật parser chưa được phép. Không thu raw/OTP để debug; mơ hồ chuyển Review.',
  'Phiên bản/profile, quyền nguồn, lỗi tổng hợp; bằng chứng riêng của owner giữ trong phạm vi riêng.'),
 ('Model chậm, injection hoặc hết quota','Assistant operator có artifact/schema/policy đã pin.',
  'Cancel/fence run và chặn kết quả đến muộn. Kiểm quyết định và guard bằng bằng chứng an toàn. Dùng fallback rõ nhãn; sửa runtime và chạy evaluation trước bật lại.',
  'Không tự chuyển cloud, tăng quyền tool, reset giới hạn 8 hành động/60 giây hoặc tự ghi actual.',
  'Trạng thái run trong phạm vi riêng, metrics đã lọc, phiên bản model và kết quả evaluation.'),
 ('Cạn disk, pool, RAM hoặc quota','Infrastructure operator có metrics và dung lượng dự phòng.',
  'Chặn thêm import/forecast/inference nặng; backpressure ingress. Giữ denial/witness/erasure hoạt động. Chỉ tăng tài nguyên trong quyền và ngân sách đã được duyệt.',
  'Không xóa ledger hoặc backup tốt cuối để cứu dung lượng; không tự chọn VM tính phí. Đóng finance nếu ghi tiếp không an toàn.',
  'Dung lượng, pools, queue age, quota và phương án capacity; không chứa số tài chính.'),
 ('Backup, destination hoặc prune lỗi','Backup writer và custodian độc lập có catalog tin cậy.',
  'Giữ bản tốt cuối. Kiểm export, snapshot start, capsule, destination receipt, lock và scratch cho repack. Retry đúng identity; báo lỗi qua kênh ngoài host.',
  'Age vượt 24 giờ là fail RPO target. Snapshot quá 34 ngày hoặc pack chưa purge sau 24 giờ là sự cố retention; không sửa timestamp để che lỗi.',
  'Catalog/receipt, inventory, mã lỗi và kết quả restore drill.'),
 ('Mất host hoặc database','Recovery operator có witness, khóa và backup độc lập.',
  'Fence host cũ. Restore cô lập, khóa mặc định; kiểm schema/data; lấy latest witness head và áp denies. Vô hiệu credentials; đối chiếu jobs/quotas; smoke có kiểm soát rồi mới mở.',
  'Thiếu fresh head, khóa, denied scan hoặc bằng chứng writer cũ đã dừng: giữ LOCKED. Báo rõ dữ liệu mất hoặc chưa xác định.',
  'Snapshot lower bound, timeline, fence, witness head, invariants và RPO/RTO thực đo.'),
 ('Secret lộ hoặc host bị chiếm','Incident operator có kênh điều khiển độc lập.',
  'Cô lập host/egress. Deny và anchor revoke; giữ bằng chứng đã lọc. Rotate đúng phạm vi, build host/release sạch và dùng quy trình restore khóa mặc định.',
  'Không cấp root qua Ops UI. Lộ repository master key cần repo/key mới và backup sạch; đổi password wrapper không đủ.',
  'Purpose/key version, custody, revocation và khôi phục; không dump secrets/finance vào báo cáo.'),
 ('Erase, revoke hoặc witness lỗi','Profile recovery/erase đã được ủy quyền giữ identity của yêu cầu gốc.',
  'Deny local ngay. Retry đúng deny event tới witness; giữ deadline và danh sách children đã freeze. Purge active data và mọi bản sao đã kiểm kê; xác minh trước completion.',
  'Không bỏ deny để lấy availability, không reset mốc 35 ngày, không nhận hoàn tất khi pack còn dữ liệu.',
  'Deadline gốc, receipt đã anchor, inventory/purge và giới hạn với thiết bị ngoài kiểm soát server.'),
 ('TLS, DNS, clock hoặc alerts lỗi','Infrastructure operator có domain/trust đã xác minh.',
  'Đóng các luồng auth không an toàn. Sửa thời gian/cert/origin bằng nguồn tin cậy; kiểm truy cập ngoài và cảnh báo; đánh giá lại sessions/jobs đã hết hạn.',
  'Không tắt TLS/CSRF, kéo TTL, tin witness head cũ hoặc dùng domain mẫu làm domain thật.',
  'Cert/time/origin và kết quả timeout, delivery, recovery của receiver.'),
 ('APK không tương thích, update hoặc queue gap','Release/native support có channel và signing continuity đúng.',
  'Kiểm signer/hash/support; hướng dẫn update. Giữ identity queue; từ chối revision không hỗ trợ trước ACK. Re-enroll qua luồng owner, thể hiện khoảng trống dữ liệu.',
  'Không gán item cũ cho owner mới, phát debug APK thật, dùng remote URL tùy ý hoặc ép cài ngoài quyền OS. Không hứa cứu dữ liệu mất Keystore.',
  'Thiết bị/OS/app versions, cài/update và các trường hợp gap bằng dữ liệu thử.'),
 ('Đóng sự cố và mở lại','Incident operator có nguyên nhân đã sửa và kiểm tra mọi gate bị ảnh hưởng.',
  'Kiểm lại correctness/auth/replay/recovery; mở lại từng phần có kiểm soát. Ghi postmortem an toàn, bổ sung regression và cập nhật runbook.',
  'Critical chưa rõ, cross-tenant leak, sai sổ hoặc rủi ro erasure: giữ halted. Không nhận PASS vượt phạm vi đã thử.',
  'Phạm vi/thời gian ảnh hưởng, dữ liệu mất/chưa biết, hành động sửa và evidence.')]
 data=[{'id':f'RB-{i:02}','name':n,'preconditions':p,'steps':s,'stopConditions':h,'evidence':e} for i,(n,p,s,h,e) in enumerate(rows,1)]
 put('runbooks.json',{'status':'PROCEDURES_SPECIFIED_NOT_REHEARSED','runbooks':data})
 md('runbooks.md','''# Runbooks — chưa diễn tập

Operator là capability vận hành hạ tầng được tin theo T1; app-admin không có các quyền này. Một người có thể giữ nhiều vai trò trong dự án cá nhân, nhưng credentials/process/custody vẫn tách. Prune và witness ở ngoài finance host.

Mỗi lần thực hiện cần ghi môi trường/release, actor purpose, điều kiện đầu vào, thời gian, kết quả và bằng chứng an toàn. Các thủ tục dưới đây chưa chạy; drill dùng synthetic/disposable target đã xác minh, không phá dữ liệu hoặc khóa thật để tạo evidence.

'''+ '\n\n'.join(f"## {x['id']} — {x['name']}\n\n**Điều kiện:** {x['preconditions']}\n\n**Thực hiện:** {x['steps']}\n\n**Dừng khi:** {x['stopConditions']}\n\n**Bằng chứng:** {x['evidence']}" for x in data))

def backup():
 md('backup-restore-and-retention.md','''# Sao lưu, khôi phục và retention

Kế thừa nguyên [recovery protocol](../security/t1/backup-restore-erasure.md), [custody khóa](../security/t1/keys-and-secrets.md) và [retention](../security/t1/logging-and-retention.md). ARCH13 làm rõ cách vận hành, không giảm deny witness hoặc thay crypto.

## 1. Backup nhất quán, đủ thành phần và có bản ngoài host

PostgreSQL16 custom export giữ snapshot nhất quán của một DB. Backup còn cần manifests schema/migrations/grants/release, inventory payload và objects ngoài PG, tham chiếu key capsule và recovery checkpoint. Dùng client tools cùng major đã pin; backup role được tin phải đọc đủ tenants, không bật RLS lọc rồi coi export là hoàn chỉnh. Source/staging export ở volume mã hóa; restic repository mã hóa ngoài host, TLS authenticated, writer chỉ append. Custodian prune/delete ở ngoài finance host; age recipient private key giữ offline, CA/APK secrets ở compartment riêng.

[pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html) không tự backup toàn cluster roles và external objects. [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html) có thể thực thi mã từ archive; hash chỉ chứng minh integrity so với manifest tin cậy. Cần review archive/allowlist và dựng schema từ pinned migrations. Chọn logical backup cho hệ thống nhỏ, một host; nếu dump/restore không đạt mục tiêu thì xem lại WAL/PITR, retention, keys, capacity và chi phí. Chưa tự bật PITR hoặc paid service.

Backup chỉ successful sau export exit0, inventory đầy đủ, receipt bền từ destination, integrity/catalog và tham chiếu capsule/checkpoint đã kiểm. Không thay bản tốt cuối bằng export lỗi hoặc thiếu thành phần. Đo RPO từ lower bound thời điểm snapshot bắt đầu tại DB, không từ lúc upload xong.

Lịch đúng mỗi 24 giờ cộng thời gian export/upload có thể vượt mục tiêu RPO24h. Đề xuất ban đầu mỗi12h để có dự phòng; vẫn chọn preferred7 bản ngày/4 bản tuần trong hard age34d. Các bản trong ngày cần tính thêm capacity. Đây là candidate chưa đo, không bảo đảm RPO. Backup lock phải phối hợp với migration/release/pruner, tránh DDL và repository lock xung đột. Đo worst-case snapshot age, mất mạng, thời gian dump, băng thông và dung lượng.

Restore drill ban đầu mỗi≤30 ngày, trước thay đổi lớn về schema/keys/roles/toolchain và sau sự cố. Repository integrity check mỗi chu kỳ và full data read theo budget không thay SQL restore drill. Capacity cần đủ initial full backup, các thay đổi, scratch repack, catalog và capsule. Destination/quota/availability hiện chưa chọn hoặc provision.

## 2. Xóa thật, không chỉ xóa metadata

Giữ hard snapshot age≤34 ngày; dữ liệu không còn tham chiếu trong packs phải purge≤24 giờ. Erasure deadline tính từ yêu cầu gốc+35 ngày, không reset khi retry. Custodian kiểm mọi snapshots/hosts/paths/tags, versioning, soft delete và bản offline thuộc server; dùng trusted inventory/receive times, không tin timestamp giả từ source host bị compromise.

Restic `forget` bỏ snapshot metadata; `prune` mới xử lý dữ liệu. Repack cần scratch và có thể giữ repository lock. Policy phải xử lý mọi pack có dữ liệu đã xóa; `--max-unused 0` là candidate cần review/benchmark. Default cho phép unused data hoặc giới hạn repack không được dùng để tuyên bố purge hoàn tất. Pack còn chứa dữ liệu owner thì chưa completion dù snapshot không còn thấy. [Restic retention/pruning](https://restic.readthedocs.io/en/stable/060_forget.html).

Runtime cleanup dùng typed procedures, bảo vệ active pins, confirmed history, dedupe tombstones và deny controls. Source license có thể buộc TTL ngắn hơn90d; auth replay5min không dùng TTL payload90d. Checkpoint/budget còn live không kéo retention nội dung vô hạn: sanitize thành tombstone và trả partial rõ khi nội dung hết hạn. Ledger/Plan/history đã xác nhận giữ theo owner lifecycle; erase profile đặc quyền là ngoại lệ riêng, không normal retention DELETE.

Xung đột giữa privacy deadline và khả năng recovery phải thành incident, không âm thầm giữ backup quá hạn hoặc xóa bản tốt cuối rồi vẫn claim RPO. Thiết bị offline, file người dùng tải và logs của provider ngoài server control có giới hạn xóa được công bố rõ.

## 3. Restore luôn khóa cho tới khi đối chiếu xong

Fence writer cũ trước khi mở writer mới. Restore vào môi trường cô lập: providers/model/mail/uploads/financial workers và public finance đều tắt. Dựng schema từ pinned migrations; data restore theo allowlist/profile đã review. Nếu cần temporary restore guard để nạp data, phải audit, bật lại và validate toàn bộ trước readiness; không tắt mọi triggers/RLS rồi quên.

Lấy latest witness head với fresh nonce, xác minh chữ ký/chain/key history; áp erasure và deny trước bất kỳ finance read/export nào. Mapping không biết hoặc witness thiếu/stale thì quarantine/LOCKED. Vô hiệu restored passwords dùng để đăng nhập trực tiếp, sessions, refresh/access/collector tokens, challenges, replay, bindings và factors; fresh identity proof/reset/enrollment và admin reprovision theo ARCH07.

Restored jobs không tự chạy. Đối chiếu leases/effects, source consent/rights và market/model quotas; counter chưa tin cậy thì chặn egress tới khi reconcile hoặc reset window tin cậy. Không gán outbox cũ cho owner mới; receipt mất sau restore chuyển gap/investigation, không tự post lại.

RTO đo từ recovery declaration đến service có kiểm soát, gồm chờ operator/keys, tải backup, migrations, witness, grants, invariant checks và đường reset identity hoạt động. Báo riêng partial service và thời gian owner reset/re-enroll; không nhận full recovery nếu chỉ API chạy. RPO báo khoảng dữ liệu thực mất hoặc chưa xác định, không hứa zero loss nhờ native replay.

Backup/witness/alert ở failure domain khác finance host. Chạy khác process trên cùng VM chỉ chứng minh logic synthetic, không chứng minh độc lập. Endpoints/custody thật còn thiếu nên REAL vẫn bị chặn. ARCH13 không chạy backup/restore hoặc tạo khóa.
''')

def prose_cleanup():
 # Repair compressed prose inherited from authoring shorthand; identifiers and schemas stay intact.
 words={
  'singlehost':'single host','financehost':'finance host','offhost':'off-host','outsidefinancehost':'outside finance host',
  'fullbackend':'full backend','fullproduct':'full product','fullAgent':'full Agent','allfeatures':'all features',
  'localfirst':'local first','localDB':'local DB','localruntime':'local runtime','runtimeevidence':'runtime evidence',
  'localmodel':'local model','modelquality':'model quality','realprovider':'real provider','realupdates':'real updates',
  'realdevice':'real device','realdata':'real data','realusers':'real users','realsource':'real source',
  'coldwarm':'cold/warm','modelartifact':'model artifact','public30caseblindclaim':'claim rằng 30 ca công khai là blind test',
  'exactsource':'exact source','exactpins':'exact pins','correctscope':'correct scope',
  'firstbank':'first bank','lastgood':'last good','unknownquota':'unknown quota','providerentitlement':'provider entitlement',
  'noautoupgrade':'no auto upgrade','noautoDownMigration':'no auto down migration','noauto':'no auto ',
  'noKubernetes':'no Kubernetes','noDocker':'no Docker','nohybridproductionfallback':'no hybrid production fallback',
  'no microservices':'no microservices','noautoDown':'no auto down',
  'paidfallback':'paid fallback','hostedquota':'hosted quota','quota0':'quota 0','budget0':'budget 0',
  'backupcandidateheadroom':'backup candidate headroom','dailyminimum':'daily minimum','independentalerts':'independent alerts',
  'independentheartbeat':'independent heartbeat','independentoffhost':'independent off-host',
  'independentbackup':'independent backup','failure domainfinancehost':'failure domain finance host',
  'failure domain':'failure domain','failure domain+':'failure domain + ',
  'startuplock':'startup lock','failstartup':'fail startup','missingmount':'missing mount',
  'deploylock':'deploy lock','PGadvisorylock':'PG advisory lock','migrationjournal':'migration journal',
  'phasecatalog':'phase catalog','payload/jobpolicy':'payload/job policy','jobpolicy':'job policy',
  'compatibilityrollback':'compatibility rollback','current19overviews':'19 current overviews',
  'workerfence':'worker fence','oldworker':'old worker','newwriter':'new writer','oldwriter':'old writer',
  'resetdenies':'reset denies','unknownCOMMIT':'unknown COMMIT','unknowncommit':'unknown COMMIT',
  'grants/RLS':'grants/RLS','actualprune':'actual prune','actualpurge':'actual purge','actualpackpurge':'actual pack purge',
  'erase35d':'erase 35d','erase35':'erase 35','erasecontrol':'erase control','eraserisk':'erasure risk',
  'erasedeadline':'erasure deadline','erasedeadlines':'erasure deadlines','childfreeze':'child freeze',
  'original35d':'original 35d','originalrequest':'original request','deniedscan':'denied scan',
  'freshwitness':'fresh witness','latestwitness':'latest witness','currentkey':'current key',
  'freshhead':'fresh head','oldfence':'old fence','oldpassword':'old password','directdenial':'direct denial',
  'secretcompromise':'secret compromise','cross-tenant':'cross-tenant','financialcorruption':'financial corruption',
  'recoverystale':'recovery stale','rawleak':'raw leak','authoritybypass':'authority bypass',
  'stale worker':'stale worker','capturedmatrix':'captured matrix','supportmatrix':'support matrix',
  'typedresults':'typed results','fullintegration':'full integration','crossclient':'cross-client',
  'exact bridge':'exact bridge','syntheticnotification':'synthetic notification','notificationprofile':'notification profile',
  'noOTP/raw':'no OTP/raw','durableIDs':'durable IDs','no nativeautorepost':'no native auto repost',
  'no autorepost':'no auto repost','nativeautorepost':'native auto repost','rights revoked':'rights revoked',
  'latepublish':'late publish','toolpermissionincrease':'tool permission increase','actualwrite':'actual write',
  'newJobs':'newJobs','notexecuted':'not executed','notDONE':'not DONE','notclockonly':'not clock only',
  'notpublic':'not public','notfinance':'not finance','notroot':'not root','no raw':'no raw',
  'no fees':'no fees','actualdeleted':'actually deleted','expireddata':'expired data',
  'operations32':'operations 32','32runtimecases':'32 runtime cases','30publiceval':'30 public eval',
  'artifacttested':'artifact tested','artifactdeploy':'artifact deployed','signingtool':'signing tool',
  'sameartifact':'same artifact','test/build/sign/deploy':'test/build/sign/deploy',
  'API serializers/frontend':'API serializers/frontend','publicdeploy':'public deploy',
  'correcttarget':'correct target','safealertreceiver':'safe alert receiver','evidence stale':'evidence stale',
  'source/model/device independence':'source/model/device independence',
  'sourcefixture':'source fixture','sourcefixtures':'source fixtures','toolchain pins':'toolchain pins',
  'schema/decisionmodels':'schema/decision models','realBLOCKED':'REAL BLOCKED','realready':'real ready',
  'productionready':'production ready','privatevalidate':'private validate','privatereadiness':'private readiness',
  'source/policy':'source/policy','18secrets':'18 secrets','17J2':'17 J2','BE21 operational':'BE21 operational',
  'all41AC':'all 41 AC','21BE':'21 BE','41AC':'41 AC','all21':'all 21 ',
  'ledgerdelete':'ledger delete','keyrefs':'key refs','sourcehash':'source hash','failureattempts':'failed attempts',
  'hypothesistarget':'hypothesis/target','expectedevidence':'expected evidence','rights/time/unit/quotas':'rights/time/unit/quotas',
  'tests giữ':'tests giữ','purecompute':'pure compute','noautodeploy':'no auto deploy',
 }
 targets=list(D.glob('*.md'))+[R/'docs/architecture/ARCH-13-change-report.md',R/'docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md']
 current=json.loads((R/'docs/execution/evidence/arch-13-operations-2026-10-09/current-documents.json').read_text(encoding='utf-8'))['files']
 # Only touch the new appended handover prose of current docs; preserve prior notices/history.
 for p in targets:
  s=p.read_text(encoding='utf-8')
  for a,b in sorted(words.items(),key=lambda x:len(x[0]),reverse=True):s=s.replace(a,b)
  p.write_text(s,encoding='utf-8')
 for n in current:
  p=R/n;s=p.read_text(encoding='utf-8');marker='\n## ARCH-13 — Operations handover\n'
  a,b=s.split(marker,1)
  for x,y in sorted(words.items(),key=lambda x:len(x[0]),reverse=True):b=b.replace(x,y)
  p.write_text(a+marker+b,encoding='utf-8')

def report():
 p=R/'docs/architecture/ARCH-13-change-report.md'
 p.write_text('''# ARCH-13 — Báo cáo thiết kế vận hành

09/10/2026 · **DESIGN SPECIFIED / RUNTIME NOT RUN**.

Đã hoàn thiện [hồ sơ vận hành](../operations/README.md) và [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). Giữ đủ21 gói backend/41 AC và toàn bộ yêu cầu Agent. API005:153 operations/634 schemas; DB005:87 bảng/1001 cột/162 FK; native bridge003 đều không đổi.

| Bổ sung/chốt | Vì sao |
| --- | --- |
| CI local; pin source, toolchain và artifact; hosted CI cần kiểm quota | Ưu tiên không phát sinh phí; bảo đảm source đã kiểm chính là source đem phát hành |
| Cấu hình strict, secrets theo process, kiểm mount/readiness | Không lộ secrets hoặc tự tạo plaintext fallback; API chạy không đồng nghĩa đủ quyền/an toàn recovery |
| Release có bảo trì; drain/fence workers; migration journal; rollback theo tương thích | Worker cũ không được ghi sau upgrade; không reset dedupe, quyền đã thu hồi, attempts/budgets hoặc tự rewind DB |
| Logs/metrics an toàn và heartbeat/alerts ngoài host | Admin chỉ xem aggregate; host mất phải có bên ngoài phát hiện, không gửi finance/raw/prompt qua cảnh báo |
| Backup, restore và retention cụ thể | Đo RPO từ snapshot start; thử lịch12h tạo dự phòng cho mục tiêu24h; restore cần khóa/witness; purge đúng34d+24h và erase35d |
|14 runbooks,32 ca nghiệm thu và10 nhóm thử nghiệm rủi ro | Có thủ tục, điều kiện dừng, bằng chứng và thứ tự thực thi từ DB local đến full product |

19 tài liệu tổng quan được cập nhật. **536 tệp được bảo vệ không thay đổi**, gồm frontend, snapshot r1/r2, hợp đồng và các gói/evidence trước. Không đổi runtime/dependencies/lockfiles.

**Kết quả kiểm tra thiết kế:33/33 kiểm tra nhất quán,40/40 ca schema,39/39 ví dụ quyết định đạt.** Đây chỉ là kiểm tra artifact/schema và mô hình policy, không phải config loader/release/SQL/backup/restore/alerts đã triển khai.32 ca nghiệm thu vận hành vẫn NOT RUN. [Validation](../execution/evidence/arch-13-operations-2026-10-09/validation-report.json) · [Manifest/hashes](../execution/evidence/arch-13-operations-2026-10-09/artifact-manifest.json).

Chưa pin/cài toolchain thật, chưa provision cloud/backup/witness/alerts hoặc đo capacity/RPO/RTO; nguồn/model/APK/UAT vẫn chưa nghiệm thu. Không tạo secrets, gọi nguồn/model, gửi thông báo, commit/push/deploy hoặc phát sinh phí.

Các lớp ARCH01–13 đã có hồ sơ thiết kế để bắt đầu implementation và kiểm rủi ro. **Bước tiếp theo: chuẩn bị PostgreSQL local disposable và executable migrations, kiểm database trước khi xây full backend**, theo [kế hoạch](../operations/implementation-and-spikes.md). Những gates thật còn thiếu không bị coi là đã đạt hoặc dùng để bỏ tính năng.
''',encoding='utf-8')

def next_steps_and_adr():
 md('implementation-and-spikes.md','''# Sau ARCH13: thử rủi ro, database và full backend

Các lớp ARCH01–13 đã có thiết kế; SQL/APK/model/production vẫn cần triển khai và kiểm chứng. Giữ đủ21 gói backend,41 AC và toàn bộ AI-FR/NFR. Thử rủi ro sớm, xây toàn backend theo phụ thuộc và kiểm trong lúc xây.

| ID | Thử nghiệm | Đầu vào | Điều kiện đạt / bằng chứng |
| --- | --- | --- | --- |
| OPS-SP01 | PostgreSQL16 local cô lập; executable migrations; quyền/guards và precision | Runtime đã pin, DB disposable; dữ liệu giả lập | Clean install và upgrade001–003 tới DB005; journal/backfill/rollback/concurrency đúng, không chỉ đủ số bảng |
| OPS-SP02 | APK ký thử, notification giả, Keystore/Room; offline/reboot/screen-off/revoke/lost ACK | Android toolchain và thiết bị owner cấp | Bridge003/API005 đúng; giữ identity outbox; không raw/OTP; ghi support/gap matrix trên thiết bị thật |
| OPS-SP03 | Auth/CSRF/native proof/service identity; witness/capsule/backup/locked restore | Credentials và endpoints thử riêng | Deny/replay/fence đúng, credentials cũ sau restore bị từ chối, latest head được xác minh; cùng host chưa chứng minh độc lập |
| OPS-SP04 | Model local: quyết định đúng schema, tiếng Việt, Plan/Goal/điều tra, cold/warm và tài nguyên | Exact model/runtime artifacts; quyền tải và tài nguyên trước khi tải thật | Đo quality/safety/budget và lợi ích so với ba baseline;30 ca công khai không nhận là blind test |
| OPS-SP05 | Quyền nguồn cổ phiếu/vàng, đơn vị/thời điểm/finality; ngân hàng/ví đầu tiên | App/device owner chọn, mẫu được phép, provider entitlement/credentials | Bằng chứng quyền; parser/profile có phiên bản; oracle độc lập về đơn vị; không tự scrape |
| OPS-SP06 | Release/drain/lock; lỗi index ngoài transaction; backfill; rollback khi còn job/APK cũ | Các process và DDL local đã có | Worker cũ không ghi được; giữ attempts/budgets/denies; chặn downgrade không tương thích |
| OPS-SP07 | Daily/manual schedule khi tắt clients, host ngủ/restart,429 và restore quota | J2 và stub trước; nguồn có quyền sau | Quan sát≥7 ngày; ghi missed coverage, quota bền; không bịa giá lịch sử |
| OPS-SP08 | Backup12h candidate, restore/capsule và retention34d+24h | Destination/receiver độc lập thử; đủ scratch | Đo RPO/RTO cả tình huống chậm/lỗi; fresh witness; dữ liệu đã xóa không hồi sinh; packs thực sự purge |
| OPS-SP09 | Host mất, disk/pool/clock/TLS/quota lỗi và cảnh báo ngoài host | Failure domain riêng và contact được duyệt khi có | Timeout/delivery/recovery alerts an toàn; backpressure giữ denial/erasure; không tự tăng phí |
| OPS-SP10 | Tích hợp ba clients, Agent/model thật, nguồn thật, tải và UAT | Backend/adapters/native/providers/model hoàn chỉnh | Đủ41 AC/21 gói; kiểm mọi feature và ghi rõ phạm vi, không che phần thiếu bằng mock |

Thứ tự thực hiện:

1. Chuẩn bị local runtime, disposable DB, executable DDL và harness thử lỗi; làm OPS-SP01/03, chuẩn bị native synthetic.
2. Xây nền backend/auth/Engine/J2; tiếp tục mọi module BE03…18 theo dependencies đã có.
3. Tích hợp adapters, Android, Agent và sources; thực hiện BE19/20 cùng các thử nghiệm tương ứng.
4. Diễn tập vận hành/restore, đo load/quota, hoàn thiện BE21 và UAT toàn sản phẩm.

Có thể chuẩn bị source/model/device độc lập trong lúc xây nền. Thiếu đầu vào thật không chặn code local với stub, nhưng phải giữ real gate chưa đạt. Spike fail thì sửa ADR/schema/contracts có revision rồi chạy lại phần bị ảnh hưởng; không bỏ tính năng, đổi T1 hoặc tự phát sinh phí.

Mỗi evidence ghi giả thuyết, exact source/config/artifact revisions, dataset/quyền, expected/actual, cả lần thất bại và logs đã lọc. Bước tiếp theo cụ thể là **chuẩn bị và kiểm PostgreSQL local disposable**; ARCH13 chưa chạy database.
''')
 (R/'docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md').write_text('''# ADR-020 — Vận hành local trước và phát hành có bảo trì

09/10/2026 · **ACCEPTED DESIGN / IMPLEMENTATION NOT RUN**. Đây là chi tiết trong A+T1, S1+P2, I0+I1 có điều kiện và D1+J2 đã được giao tiếp tục; không cấp quyền provision, chi phí hoặc deploy.

Hệ thống một host cần giữ đúng source/version/schema/workers/clients trong lúc nâng cấp. Rollback không được reset dedupe, quyền đã thu hồi, quota/budgets hoặc mất dữ liệu tài chính. Các lớp ARCH01–12 đã có hợp đồng và LLD, chưa có bằng chứng runtime.

Chọn CI local trên dữ liệu giả lập, hosted CI tùy chọn sau kiểm quota và quyền. Build/test/hash/sign cùng artifact. Release theo maintenance→drain/fence→migrate→kiểm riêng→mở lại. Migrator độc lập có checksum journal và đối chiếu catalog cho phase ngoài transaction. Chỉ rollback code nếu tương thích DB/jobs/payloads/clients đang có; không tự down-migrate hoặc restore DB.

Giữ secrets theo process, volume mã hóa và P2 least privilege; metrics tổng hợp và cảnh báo ngoài host. Kế thừa restic off-host append-only, witness, age capsule và deadline xóa. Lịch backup12h là candidate tạo khoảng dự phòng cho mục tiêu RPO24h chưa đo. Giữ toàn bộ21 BE/41 AC/Agent, API005/DB005/native003 không đổi.

Hosted auto-CD, rolling/blue-green, Kubernetes, managed KMS, monitoring lớn hoặc PITR có thể xem lại khi có nhu cầu đo và ngân sách. CI trên finance host, Docker socket cho app/Ops và rollback bằng reset DB/legacy queue không được chọn. Không hứa HA, zero downtime hoặc zero loss.

Exact toolchain/signer/destinations/alerts/account/capacity/quota còn là gates triển khai. Infrastructure migration journal nằm ngoài87 bảng domain và cần DDL/grants đã review trước thực thi. Nguồn/model/native/security/UAT vẫn NOT RUN. [Operations](../../operations/README.md) · [Acceptance](../../operations/acceptance-plan.md) · [Report](../ARCH-13-change-report.md).
''',encoding='utf-8')

def current_overviews():
 text={
 'README.md':'ARCH01–13 đã có thiết kế để triển khai và thử rủi ro. Tiếp theo: PostgreSQL local disposable, executable migrations, rồi full backend đủ21 gói/41 AC. Chưa nghiệm thu runtime/production.',
 'docs/architecture/README.md':'ARCH13 chọn CI local, release có bảo trì, artifact bất biến, migration/rollback có kiểm tương thích, giám sát an toàn và recovery ngoài host. Không thêm microservices hoặc tự phát sinh phí.',
 'docs/architecture/architecture-decision-agenda.md':'ARCH13 đã chốt thiết kế vận hành trong hướng đã duyệt. Các lớp01–13 sẵn hồ sơ để triển khai/thử rủi ro; chưa có nghiệm thu runtime/production.',
 'docs/architecture/deployment-topology.md':'Systemd/Compose quản các process P2 trên một host; PG/model private. Backup, witness và cảnh báo cần failure domain khác. Endpoints/versions/quota chưa provision; lịch backup12h mới là candidate tạo dự phòng.',
 'docs/architecture/environment-matrix.md':'Local/staging synthetic và REAL dùng DB/roles/keys/origins/namespaces/channels riêng. Thiếu mount/secret/schema/recovery gate thì dừng. Không clone dữ liệu thật vào test hoặc tự bật nguồn/model/chi phí.',
 'docs/architecture/high-level-design.md':'CI nằm ngoài finance host. Release operator, migrator, backup, witness và pruner tách capability. Health, readiness, recovery và bật provider là các gate khác nhau; app-admin không là root.',
 'docs/architecture/low-level-design.md':'Deploy lock, maintenance, drain và worker fence bảo vệ lúc nâng cấp. Migrator dùng PG advisory lock và journal/phase catalog. Rollback phải tương thích; không rewind DB hoặc reset attempts/budgets.',
 'docs/architecture/module-high-level-design.md':'Journal/maintenance infrastructure cần inventory và DDL riêng ngoài87 bảng domain. Ops API không có quyền finance/DDL/deploy/restore/prune. Denial, witness và deadline erase vẫn hoạt động khi bảo trì.',
 'docs/architecture/tech-stack.md':'CI local dùng cùng tập lệnh kiểm; hosted CI có gate quota/quyền. Systemd/Compose, pg_dump/restic/age kế thừa kiến trúc hiện hành. Exact runtime/image/actions/signer còn phải pin trước triển khai; dependencies không đổi.',
 'docs/architecture/views/architecture-views.md':'Luồng phát hành: build/test/sign cùng artifact→maintenance→drain/fence→migration→readiness/smoke riêng→workers/scheduler→mở cổng. Backup/witness/alerts ngoài host; không claim HA hoặc zero downtime.',
 'docs/contracts/README.md':'API005 vẫn153 operations/634 schemas, native003 giữ nguyên. Runbooks không thêm public API. Release kiểm serializers, installed clients, payload/job policies; không dùng hybrid fallback production.',
 'docs/governance/artifact-register.md':'Ghi FW-OPS-DESIGN-001, FW-OPS-POLICY-001, schemas, OPS-01…32, RB-01…14, ADR020 và manifest ARCH13. Giữ nguyên các gói/snapshot trước; cập nhật19 tài liệu tổng quan.',
 'docs/handover/README.md':'Bổ sung CI/config/secrets/release/migration/rollback/health/backup/retention/incidents và32 ca vận hành chưa chạy. API005/DB005/native003 không đổi. Tiếp theo là DB local và implementation.',
 'docs/product/backend-backlog.md':'Giữ đủ21 BE/41 AC và toàn Agent. BE21 cần CI/release/migration/drain/alerts/restore; BE18 giữ secrets/witness/privacy; BE17 giữ J2/quota/pins. Chưa DONE khi thiếu bằng chứng runtime.',
 'docs/product/cost-model.md':'Ngân sách dịch vụ bổ sung mặc định0; không tự nâng gói. Hosted CI chỉ sau kiểm quota/storage. Availability của backup/alerts và tài nguyên inference chưa đo; VM miễn phí không bảo đảm mọi thành phần không có phí.',
 'docs/security/security-design.md':'T1 custody và deny protocol giữ nguyên. Secret mount không thay KMS; CI ngoài finance host, app/Ops không có Docker socket. Restore cần fresh witness, fence writer cũ, reset credentials; purge34d+24h và erase35d phải thực sự xóa.',
 'docs/testing/integration-handover.md':'Pin cùng source/artifact đã kiểm, API005/DB005/native003. Required gates ghi đúng trạng thái.32 ca vận hành chưa chạy; schema/policy examples không thay nghiệm thu release/restore/auth/CI.',
 'docs/testing/technical-spikes.md':'OPS-SP01…10 ghi chi tiết rủi ro, đầu vào và bằng chứng. Làm DB local trước; chuẩn bị native/auth/model/source độc lập khi có thể.30 ca Agent công khai và held-out mới theo ARCH12 là hai tập khác nhau.',
 'docs/handover/operational-decisions.md':'Chọn CI local, release có bảo trì, giám sát tổng hợp và off-host recovery kế thừa. Endpoint/account/contact/quota/exact pins còn thiếu nên REAL bị chặn; không tự provision hoặc trả phí.'}
 for name,body in text.items():
  p=R/name;s=p.read_text(encoding='utf-8');marker='\n## ARCH-13 — Operations handover\n';before,after=s.split(marker,1)
  links=after[after.rfind('\n\n[Hồ sơ vận hành]'):]
  p.write_text(before+marker+'\n'+body+links,encoding='utf-8')

def acceptance_prose():
 descriptions=[
 'Loader từ chối field lạ, inline secret, sai môi trường/revision; public config chỉ có field được phép.',
 'Thiếu/sai mount hoặc quyền file dưới UID thực của container thì dừng; không tạo plaintext fallback.',
 'DB/roles/keys/origins/APK channels cách ly; REAL không seed/reset hoặc dùng credentials thử.',
 'Secret đúng profile/purpose/version; rotation không mất đường decrypt; browser/APK/Ops/logs không có secret.',
 'PR/dependency code không vào finance host, secrets, Docker socket, signing hoặc publish; quota CI được chặn.',
 'Source gồm untracked/deletions và lock/toolchain pins; artifact được test chính là artifact ký/phát hành.',
 'Thiếu/skipped/cancelled/stale/wrong-source evidence thì không promote; giữ đủ41 AC/21 gói.',
 'Maintenance chặn mutations/native upload/enqueue trước ACK; denial/erase/witness/backup vẫn hoạt động.',
 'Kill khi external call hoặc COMMIT chưa biết; worker cũ không publish; attempts/deadline/budget/quota không reset.',
 'Hai migrators, mất connection hoặc checksum mismatch đều dừng đúng; API không tự chạy DDL.',
 'Clean install và upgrade001–003+004+ tới DB005 đúng types/grants/invariants; backfill tiếp tục đúng checkpoint.',
 'Ngắt index create ngoài transaction; phát hiện invalid index và phase journal, sửa đúng trước retry.',
 'Chặn code cũ nếu không biết tương thích DB/job/payload/API/native; không down-migrate, rewind DB hoặc bật legacy queue.',
 'TCP/SELECT1 xanh nhưng sai grants/schema hoặc recovery còn khóa thì không phục vụ finance; reconnect có giới hạn.',
 'Clients tắt, host ngủ/reboot, timer trùng: latest due J2 không trùng và có missed coverage; quan sát ít nhất7 ngày.',
 '429, quota chưa biết, thu hồi rights, sai đơn vị hoặc đổi parser: deny call/last good/Review, không thu raw.',
 'Model chậm/lỗi/injection/cross-day resume/cancel: giữ budget/quyền/fence, không tự chuyển hosted.',
 'Cài/update APK đúng signer; sai origin/revision bị chặn trước ACK; outbox không đổi owner; ghi gap thực.',
 'Bơm raw/PII/secret/amount/prompt qua app/proxy/DB/dependency/error/crash; kiểm output thực không lộ.',
 'Tắt host/network; receiver bên ngoài phát hiện heartbeat mất, xử lý duplicate/recovery an toàn, không chứa finance.',
 'Cert hết hạn/sai domain hoặc clock skew/rollback không bypass auth/lease/witness; sửa rồi kiểm lại.',
 'Cạn disk/pool/RAM/model/scratch/VM quota: backpressure đúng, giữ denial/erasure, không xóa ledger/tự tăng phí.',
 'Export lỗi/thiếu tenant/objects/receipt ngoài host không successful; inventory và key refs đầy đủ.',
 'RPO dùng snapshot start, không upload end; lịch12h và dump/network chậm phải báo age/loss/breach thực.',
 'Mất VM, một capsule media hoặc current key: đường decrypt còn hoạt động hoặc báo LOCKED; không phụ thuộc khóa vòng.',
 'Writer cũ chưa fence, witness stale, mapping lạ hoặc erased target: chặn trước finance read/export.',
 'Mọi credentials/password login/replay/factors/bindings cũ bị vô hiệu; cần identity proof/reset/enrollment mới.',
 'Ledger/history/Plan–Goals đúng sau restore; không tự post receipt cũ; market/model quota chưa tin cậy thì deny.',
 'Kiểm mọi tags/hosts/timestamp giả/soft delete: hard34d và pack purge≤24h; xung đột last-good/privacy phải lộ rõ.',
 'Deny ngay khi witness lỗi; request key khác không reset35d/children; chỉ completion sau purge mọi bản thuộc server.',
 'Giữ active pins/history/dedupe/deny tombstones; TTL auth/source được thực thi bằng xóa thật, không chỉ expiry timestamp.',
 'Đủ41 AC/21 gói/AI requirements trên ba clients và nguồn/model/device thật; RPO/RTO/UAT có phạm vi rõ, không PASS từ mock.'
 ]
 rtm=json.loads((D/'requirement-traceability.json').read_text(encoding='utf-8'))
 for c,t in zip(rtm['cases'],descriptions,strict=True):c['procedure']=t
 put('requirement-traceability.json',rtm)
 md('acceptance-plan.md','''# OPS-01…32 — Kiểm thử vận hành cần thực thi

**ALL SPECIFIED / NOT RUN.**32 ca là chi tiết triển khai xuyên suốt21 BE và41 parent AC, không thêm parent requirements và không chứng nhận AC bằng kiểm tra tài liệu. Mỗi ca cần runtime/harness đúng phạm vi, oracle độc lập, synthetic fault injection, logs an toàn và source/config/release hash. [JSON RTM](requirement-traceability.json).

| ID | Thủ tục / điều kiện đạt | Liên quan | Runbook / gate | Trạng thái |
| --- | --- | --- | --- | --- |
'''+''.join(f"| {c['id']} {c['title']} | {c['procedure']} | {c['backlog']} | {c['runbook']} / {c['gate']} | NOT RUN |\n" for c in rtm['cases'])+'''
Schema và ví dụ release/policy không thay các ca runtime này. RPO/RTO/thresholds cần đo; provider/model/device/independence thật cần quyền, thiết bị và endpoints. Giữ toàn bộ AI-SPEC/41 AC/features tới UAT; critical/authorization/recovery/erasure chưa rõ thì không bật thật.
''')

def release_checklist():
 rows=[
 ('G-ARTIFACT','Source bất biến đã review; lock/toolchain/image hashes; trusted signature; API005/DB005/native003 và policy tương thích','Chỉ có thiết kế/static evidence; runtime artifact chưa build'),
 ('G-DB','Executable migrations tới DB005; clean/upgrade/backfill/grants/RLS/triggers/precision/concurrency/restore','NOT RUN'),
 ('G-DOMAIN','Ledger/planning/forecast/quantity/history đúng oracle; replay/cancel/partial không double effect','NOT RUN'),
 ('G-AUTH','Browser/native/Ops/worker scopes, CSRF/MFA/revoke/reset/mail; deny cross-tenant/object','NOT RUN'),
 ('G-J2','Queue/scheduler/crash/fence/ACK/sync/quota; quan sát daily synthetic ít nhất7 ngày','NOT RUN'),
 ('G-CONSUMERS','User/admin/Android adapters canonical005/003, mọi UI state và regression; installed-version policy','NOT RUN; frontend mock lịch sử nghiệm thu riêng'),
 ('G-NATIVE','APK ký thật cài/update; permission/allowlist/offline/OEM/Keystore/revoke/gaps trên thiết bị thật','NOT RUN'),
 ('G-SOURCE','App/device/profile/signer/mẫu parser/rights/time/unit/quota đã xác minh; giá daily/manual thật','NOT RUN; candidates chưa activate'),
 ('G-AGENT','Exact model/runtime/prompt/tool pins; quality tiếng Việt, benefit so với ba baseline, held-out và safety/budget đo thật','NOT RUN; model disabled'),
 ('G-SEC-T1','Grants/logs/secrets/egress/custody; witness độc lập, erase/recovery đã thử','NOT RUN'),
 ('G-OPS','Deploy/drain/migration/failure/rollback/load/quota/alerts; backup/restore/capsule và purge đã diễn tập','NOT RUN'),
 ('G-UAT','Đủ41 AC trên ba clients và toàn bộ Agent/nguồn thật; owner consent/disclosure; không critical chưa xử lý','NOT RUN')]
 md('release-checklist.md','''# Checklist phát hành và trạng thái bằng chứng

**SPECIFIED / NOT RUN không bằng PASS.** Schema hợp lệ và manifest checksum chỉ kiểm artifact, không chứng minh runtime/recovery/security. Không chọn vài feature để nhận toàn product hoàn thành.

| Gate | Điều kiện / bằng chứng | Hiện tại |
| --- | --- | --- |
'''+''.join(f'| {g} | {t} | {s} |\n' for g,t,s in rows)+'''
LOCAL-SYNTHETIC có thể bắt đầu implementation bằng stub/sink/no-egress và disposable DB, không cần real provider/device/model để viết và kiểm nền. Chỉ nghiệm thu phạm vi local đã chạy. Một drill cố ý bỏ gate off-host chỉ là synthetic logic proof, không chứng minh gate độc lập hoặc cấp quyền bật REAL.

STAGING-SYNTHETIC cần deployment/TLS/config/quota, integration và ops drills với dữ liệu thử; không gọi là production UAT. REAL-T1 phải đạt mọi gate liên quan trước bật thật. Full product phải có toàn bộ features; manual fallback hữu ích nhưng không thay nghiệm thu Agent/native/automatic prices.

Trước phát hành cần xác minh đúng target và không có writer cạnh tranh; bằng chứng safety trên đúng source/config/artifact; backup ngoài host và đường restore đã thử; witness pending và erase deadlines; reserve tài nguyên; compatibility rollback/installed clients; thời gian bảo trì và keys; receiver cảnh báo đã kiểm. Source/config thay đổi thì chạy lại checks bị ảnh hưởng, không dùng evidence cũ cho behavior mới.

Giữ halted nếu sai sổ, cross-tenant leak, raw/secret lộ, bypass authority, recovery stale hoặc rủi ro erasure. Không có critical quan sát trong phạm vi thử là điều kiện cần, không bảo đảm không bao giờ có lỗi. Release notes ghi giới hạn/known bugs thật. Checklist không cấp quyền deploy, mua dịch vụ hoặc tạo tài khoản.
''')

def schedule_notes():
 p=D/'ci-and-release.md';s=p.read_text(encoding='utf-8')
 marker='\n## Lịch, inventory và thứ tự tái tạo hồ sơ\n'
 s=s.split(marker,1)[0].rstrip()+marker+'''

Host tick60s chỉ enqueue/due scan theo J2; daily price18:00 Asia/Ho_Chi_Minh do business scheduler kiểm occurrence. Backup candidate12h, custodian kiểm retention hằng ngày và purge trong24h; các lịch này cần runner, lock, heartbeat và diễn tập. `Persistent=true` của systemd chỉ áp dụng `OnCalendar` và kích hoạt bù khi bị lỡ; không replay từng occurrence và không chứng minh công việc đã hoàn thành. [systemd timer source](https://github.com/systemd/systemd/blob/main/man/systemd.timer.xml). I0 Windows dùng harness tương đương trước khi kiểm Linux units thật.

Infrastructure journal/maintenance state có schema/grants riêng cần DDL đã review và inventory deployment ngoài87 bảng domain. Không tạo bảng/runtime trong task tài liệu này. Public ingress/readiness phải tôn trọng state đó; restart process không tự mở maintenance/recovery gate. Logs chỉ dùng releaseId/operation enums từ registry tin cậy, không lấy chuỗi người dùng làm label để né allowlist.

Tái tạo artifact thiết kế theo thứ tự: `build_arch13_operations.py` → `build_arch13_validation_inputs.py` → `polish_arch13_documents.py` → hàm `bundle()` của builder → `validate_and_seal_arch13.py`. Đây là công cụ author/validate tài liệu, không pipeline CI/deploy đang chạy. Không chạy lại generator gói ARCH cũ để sửa evidence lịch sử.
'''
 p.write_text(s,encoding='utf-8')

def main():
 runbooks();backup();prose_cleanup();next_steps_and_adr();current_overviews();acceptance_prose();release_checklist();schedule_notes();report()
 policy=json.loads((D/'operations-policy.json').read_text(encoding='utf-8'));policy['backup']['intervalHoursCandidate']=12
 put('operations-policy.json',policy)
 print(json.dumps({'status':'PROSE_AND_RUNBOOKS_REVIEWED','runtime':'NOT_RUN'}))
if __name__=='__main__':main()
