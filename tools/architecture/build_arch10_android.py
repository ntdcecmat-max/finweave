"""Build Android design artifacts only. Never install packages or modify frontend."""
from pathlib import Path
import csv, hashlib, json, re

R = Path(__file__).resolve().parents[2]
D = R / 'docs/android'
E = R / 'docs/execution/evidence/arch-10-android-2026-10-09'
OLD = R / 'docs/execution/evidence/arch-09-async-2026-10-09'

def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
def js(p, x):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(x, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
def md(name, s):
    p = D / name
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(s.strip() + '\n', encoding='utf-8')

def preserve():
    E.mkdir(parents=True, exist_ok=True)
    p = E / 'preservation-before.json'
    if p.exists():
        x = json.loads(p.read_text(encoding='utf-8'))['files']
        assert all(sha(R / n) == h for n, h in x.items()), 'Protected drift'
        return
    old = json.loads((OLD / 'preservation-before.json').read_text(encoding='utf-8'))['files']
    manifest = json.loads((OLD / 'artifact-manifest.json').read_text(encoding='utf-8'))
    assert all(sha(R / n) == h for n, h in old.items())
    assert all(sha(R / n) == v['sha256'] for n, v in manifest['files'].items())
    mutable = set(json.loads((OLD / 'current-documents.json').read_text(encoding='utf-8'))['files'])
    protected = dict(old)
    protected.update({n: v['sha256'] for n, v in manifest['files'].items() if n not in mutable})
    protected[(OLD / 'artifact-manifest.json').relative_to(R).as_posix()] = sha(OLD / 'artifact-manifest.json')
    js(p, {'date': '2026-10-09', 'scope': 'Prior baselines, frontend, API004, DB005, ARCH07–09 packages/tools/evidence/reports; current overview docs excluded', 'files': dict(sorted(protected.items()))})

def main():
    preserve()
    D.mkdir(parents=True, exist_ok=True)
    source = ['finweave-web/src/native/collector.ts', 'finweave-web/capacitor.config.json', 'finweave-web/package.json', 'finweave-web/android-shell/README.md']
    js(E / 'source-observations.json', {
        'date': '2026-10-09', 'files': {n: sha(R/n) for n in source},
        'observed': {'bridge': 'window.Capacitor.Plugins.FinWeaveCollector', 'methods': ['getStatus','acceptDisclosure','openNotificationSettings','setSources','stopAndQuarantine','retryQueue','deleteQuarantined'],
                     'disclosureLiteral': '2026-10-08', 'appId': 'test.finweave.prototype', 'webDir': 'dist',
                     'capacitorDependencyInPackageJson': False, 'gradleProjectUnderFrontend': False},
        'limit': 'Static inspection of selected source paths; not build/install/native behavior proof'})
    research = [
        ('CAP8','https://capacitorjs.com/docs/updating/8-0','Capacitor8: Node22+, minSDK24, compile/target36; guide toolchain starting values, not installed/latest patch'),
        ('PLUGIN','https://capacitorjs.com/docs/plugins/creating-plugins','Native plugin integration requires actual Android project and registration; legacy proxy is not native implementation'),
        ('NLS','https://developer.android.com/reference/android/service/notification/NotificationListenerService','System-bound listener, API24+ callbacks main thread; managed/low-RAM limitations'),
        ('OTP15','https://developer.android.com/about/versions/15/behavior-changes-all','Android15 can redact OTP from untrusted notification listeners'),
        ('WM','https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work','Periodic minimum15min; constraints/OS affect timing'),
        ('KEYSTORE','https://developer.android.com/privacy-and-security/keystore','Non-exportable keys; hardware optional; compromised process may use keys'),
        ('WEBVIEW','https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges','Native bridge attack surface; restrict loading and capabilities'),
        ('BACKUP','https://developer.android.com/identity/data/autobackup','allowBackup=false alone insufficient on some OEM D2D; noBackupFilesDir excluded; per-mode extraction rules'),
        ('BOOT','https://developer.android.com/privacy-and-security/direct-boot','Credential-encrypted storage unavailable before first unlock'),
        ('PACKAGES','https://developer.android.com/training/package-visibility/declaring','Targeted package queries; no broad inventory requirement'),
        ('RESTRICTED','https://support.google.com/android/answer/12623953?hl=en','Sideloaded apps may encounter restricted settings; user-controlled OS handoff'),
        ('VERIFY','https://developer.android.com/developer-verification','Sept30,2026 initial listed regions; wider rollout2027, recheck before distribution'),
        ('LIMITED','https://developer.android.com/developer-verification/guides/limited-distribution','Free limited distribution≤20 explicitly authorized devices; account/2SV/payments-profile/contact requirements; personal/learning use'),
        ('REGISTER','https://developer.android.com/developer-verification/guides/android-developer-console','Package name/certificate ownership registration, no universal unlimited free distribution promise'),
    ]
    js(D / 'research-sources.json', {'asOf':'2026-10-09','type':'official primary documentation read; no account or provider calls','sources':[{'id':i,'url':u,'finding':f} for i,u,f in research]})
    md('README.md', '''
# Android implementation design — ARCH-10

**FW-ANDROID-DESIGN-001 · 09/10/2026 · DESIGN SPECIFIED / NATIVE NOT BUILT / NOT RUN.**
Kế thừa React/Vite đã nghiệm thu synthetic, thêm **Capacitor8 + Kotlin** cho Android. Không viết lại UI bằng framework khác. Listener, native identity, Room, Keystore và WorkManager là phần native phải xây; WebView đóng không được là điều kiện để upload. Đây là đặc tả chuẩn bị implementation, chưa phải APK/PoC chạy thật.

| Hồ sơ | Nội dung |
| --- | --- |
| [Architecture/support](architecture-and-support.md) | Component ownership, Android/OEM matrix, permission và giới hạn |
| [Capture/identity](capture-and-identity.md) | Filter, parser, event/revision, binding, native auth, revoke |
| [Local storage](local-storage.md) | Room ciphertext, tám bảng local, clock/retention, owner isolation |
| [Bridge/consumer](bridge-and-consumer.md) | Giữ bảy methods cũ qua adapter; native bridge2 riêng API004 |
| [APK/release](apk-release.md) | Toolchain, signing, upgrade, artifact, free distribution có điều kiện |
| [Sequences](sequences.md) | Capture→durable ACK, logout/recovery, update |
| [Acceptance](acceptance-plan.md) | 32 ca Android thực tế NOT RUN, evidence bắt buộc |

[Policy](android-policy.json), [bridge schemas](native-bridge-schemas.json), [local model](local-model.json), [consumer operation map](consumer-operation-map.json), [traceability](requirement-traceability.json), [bundle pin](implementation-bundle.json). Các fixture/schema/model checks chỉ kiểm tài liệu, không thay thế Android instrumentation, crypto interoperability, SQL hay APK nghiệm thu.

Backend giữ [API004153operations/634schemas](../contracts/v2-t1-r4/README.md), [DB00587bảng/1001cột](../data/target-t1-async/README.md), [identity](../security/identity/identity-access-design.md), [T1](../security/t1/README.md), [J2/ACK](../async/README.md). Native Room là database trên điện thoại, **không cộng tám bảng local vào PostgreSQL**. Giữ nguyên tất cả feature user/Plan–Goals/Agent/manual/CSV; collector optional, quyền OS không phải điều kiện để dùng phần còn lại.

Sáu [màn Android UI-M-01…06](../design/android-ui-specification.md) vẫn native_pending. Frontend cũ còn cần migration adapter/reauth/bridge khi implementation, chưa kết nối bằng công việc này. ARCH-11 tiếp theo chốt nguồn ngân hàng/ví/giá và license/parser samples; ARCH-12 Agent; ARCH-13 vận hành.
''')
    md('architecture-and-support.md', '''
# Android component ownership và support

## Quyết định

React/Vite assets đóng trong APK, Capacitor8 làm shell; Kotlin chịu quyền OS, auth/proof/HTTP, notification capture, Room, Keystore, WorkManager. Owner UI vẫn có toàn bộ nghiệp vụ user như web. Không có admin UI/worker service credentials trong APK. Server Engine duy nhất quyết định actual; capture/ACK/native parser không tự tạo ledger. Không remote web app thay assets qua server.url ở REAL; cập nhật code qua signed APK.

| Component | Trách nhiệm / không vượt quyền |
| --- | --- |
| Bundled WebView | Render owner data/draft; gọi typed bridge, không giữ access/refresh/collector token hoặc raw notification |
| FinWeaveIdentity | Installation key, owner login/challenge/reauth/refresh, token vault, collector enrollment handlers; không cung cấp sign arbitrary bytes |
| FinWeaveOwnerApi | Allowlist owner operationId + API004 input schema; native inject auth/proof, validate bounded reply; không arbitrary URL/header/credential |
| FinWeaveCollector | Seven legacy methods qua adapter + v2 status/config actions; consent/source/binding/status, không generic SQL/file/HTTP |
| NotificationListenerService | Chỉ callback sources được bật và support catalog hợp lệ; extract tối thiểu có bound, normalize memory, enqueue ciphertext |
| LocalQueueRepository | Một owner/workspace/device epoch bất biến mỗi item; atomic state/batch/ACK journal; không actual |
| NativeUploader/WorkManager | Một scoped uploader; network/retry constraints + ARCH09; không cần owner login mỗi ngày |
| API/Engine | Auth/receipt/dedupe/review/posting/version/coverage; Ops app-admin không đọc finance |

## Android/permission matrix

[Capacitor8 guide](https://capacitorjs.com/docs/updating/8-0) cho framework floor API24 và target/compile36. **Product APK minSdk24**, giữ khả năng kiểm cả máy cũ; chưa OS/OEM nào được chứng nhận hỗ trợ collector. Ma trận kiểm ban đầu: API24/29/32 compatibility; API33/34/35/36 full suites; API37+ chưa thẩm định, không tự ghi supported. Release support được xác định bởi kết quả trên model/OS/source app/version cụ thể, không chỉ minSdk. Không tự cắt feature trên máy cũ; fallback manual/CSV khi collector không khả dụng. Toolchain snapshot không phải lời khẳng định phiên bản patch mới nhất.

Emulator kiểm install/bridge/Room/faults bằng notifications synthetic; ít nhất một Android thật do owner dùng, cộng model/OEM thứ hai trước tuyên bố đa OEM. Ghi Android build/security patch/WebView/app bank/parser/build/cert; emulator không chứng minh notification ngân hàng thật. Thử low RAM/API29, work profile và enterprise policy nếu muốn hỗ trợ; [NLS](https://developer.android.com/reference/android/service/notification/NotificationListenerService) nêu giới hạn các môi trường này.

Notification access là OS special access qua Settings, khác `POST_NOTIFICATIONS` cho thông báo trạng thái FinWeave ở API33+. Không xin READ_SMS/email/Accessibility/QUERY_ALL_PACKAGES, không pretend browser đọc notification. Manifest listener có BIND_NOTIFICATION_LISTENER_SERVICE và action chuẩn; nếu exported để hệ thống bind thì chỉ permission đặc quyền đó cho phép, thử app khác gọi service phải bị chặn. Các component nội bộ không exported; launcher Activity chỉ nhận intents đã kiểm, không arbitrary bridge deep link. `<queries>` chỉ packages nguồn định hỗ trợ theo [package visibility](https://developer.android.com/training/package-visibility/declaring), xác minh signer/version của source; ARCH11 chưa chọn package thật.

Permission granted chưa đủ: cần consent version hiện hành, listener bound, unlocked vault, valid clock, enrolled live owner/device/binding/catalog, capacity và không paused. `onListenerConnected`/disconnect và foreground recheck mới cập nhật readiness, không coi quay lại Settings là granted. Own-push denied không được ghi notification access denied; hiển thị cảnh báo health riêng. [Restricted settings](https://support.google.com/android/answer/12623953?hl=en) có thể ảnh hưởng APK sideload; mở hướng dẫn OS phù hợp, không bypass hay yêu cầu tắt bảo vệ toàn thiết bị. [Android15](https://developer.android.com/about/versions/15/behavior-changes-all) có thể che OTP; không tìm cách lấy lại OTP.

WorkManager một lần khi capture/network recovery, periodic safety15min và backoff tối thiểu30s; OS có thể hoãn, [không lịch chạy chính xác](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work). No exact alarm/always foreground service/default battery-exemption request. Một unique work name theo opaque scoped vault ID, database fence + upload mutex, không email/account ở work name/Data. Reboot chỉ tiếp tục sau first unlock và eligibility/clock check. Không DirectBoot lưu financial data theo [storage model](https://developer.android.com/privacy-and-security/direct-boot).

Doze/OEM/force-stop/permission revoke/network gap có thể làm mất observation chưa thấy; ghi gap từ last confirmed health đến resumed health, không biết chính xác số giao dịch mất. Startup inventory activeNotifications chỉ kiểm health, **không tự ingest lịch sử**. Không notification không có nghĩa không phát sinh giao dịch. Phần server price scheduler chạy độc lập điện thoại.
''')
    md('capture-and-identity.md', '''
# Capture, event identity và native auth

## Capture boundary

Gate consent/source signer/version/parser/binding/owner epoch/unlocked/clock/capacity trước extract. Callback NLS main thread không I/O/network/crypto nặng; bounded memory channel32 envelopes, tối đa16KiB text projection/item (đề xuất đo PoC). Copy chỉ fields parser cần; không retain Notification/RemoteViews/PendingIntent. Summary/OTP/non-transaction discard. Overflow/oversize không truncate thành transaction hợp lệ: pause + gap metadata, không raw fallback. Kotlin processor parse memory, loại OTP và mask identity trước serialize normalized allowed DTO; lỗi không ghi text vào exception/log/crash SDK/WorkData/SQLite/temp/LLM. Unknown/redacted→minimal reason/source/time Review theo API schema, không tự bịa amount=0. Raw lifetime best-effort references cleared; JVM memory không hứa secure zeroization.

Catalog packages + allowed signing certificate lineage/app versions/parser version được pin trong release/validated server configuration, không download executable parsers. REAL source enable cần ARCH11 fixture consent/license/support; user setSources không tự chứng minh source supported. Một app nhiều tài khoản dùng server collector_binding immutable ID/version và masked discriminator; ambiguous/unmapped→Review, không account đầu tiên. Binding mới chỉ áp dụng lần capture mới; old item binding/version/capture owner_epoch không đổi. Offline capture dùng last validated encrypted binding/catalog/authorization snapshot chưa hết hạn; không biết remote revoke ngay. Server kiểm live fences khi intake/commit; stale snapshot không là quyền ghi ledger, unknown/expired local authority pause + gap.

EventKey local CSPRNG identity gán trong transaction khi callback occurrence đầu được nhận; persisted capture index lookup bằng HMAC scope+OS notification key+postTime. OS key có thể bị reuse, postTime/update không đáng tin như bank transaction ID. Exact repeat cùng known occurrence+same normalized digest không tăng revision; changed normalized payload cùng proved occurrence tăng revision trong một Room transaction. Uncertain occurrence/repost tạo evidence đánh dấu ambiguous để server Review; không auto suppress chỉ vì cùng amount/time/OS key. Bank transaction reference chỉ semantic authority theo parser/source profile verified ARCH11. Không hash raw text/OTP làm id; canonical digest typed DTO theo ARCH09, payloadDigest loại khỏi digest, transport recoveryEpoch không retag domain identity. Remove callback không xóa outbox hoặc actual.

## Identity/proof frozen

Tuân thủ nguyên văn [ARCH06 identity](../security/identity/identity-access-design.md), [API004](../contracts/v2-t1-r4/openapi.json), [permissions](../async/operation-permissions.csv): installation P-256 trước native login; collector P-256 riêng workspace; owner AES vault riêng. SPKI DER base64url; ES256 wire raw r||s64bytes (Android DER phải chuyển bằng thư viện), JCS RFC8785 claims/full envelope SHA256, không double hash. Purpose/method/path/audience/bodyDigest/credentialDigest/challenge/time/nonce strict, server ±60s/one-use nonce; retry giữ semantic idempotency key/input, fresh proof nonce/requestId. Không đưa private key/raw token vào JS.

Owner access15min/refresh family30d; native mutex + encrypted pending rotation command trước gửi; exact consumed-token replay5min theo protocol, wrong reuse revokes. Collector bearer24h renew bằng collector key+renewCollectorCredential, **không dùng owner refresh trong upload worker**. Owner authorization30d tuyệt đối; expired token≤7d chỉ renewal reference, không ingest; live auth/consent/device/binding/recovery epochs vẫn kiểm server. Fresh owner reauth5min cho enrollment/issuance/high-risk actions; biometric có thể là local UX lock, không thay server reauth. Bộ handlers native tự dựng proof/credentials; JS không cung cấp authority claims, signing bytes hay target origin.

Token storage: only authenticated-encrypted native vault, no JS local/sessionStorage/cookie/preferences plaintext. HTTP restricted compiled HTTPS API origin, system trust chain and hostname validation; không custom trust-all/debug CA ở REAL, reject cross-origin redirects. Proxy/mTLS worker credentials không có trên app. Local HTTP exception chỉ SYNTHETIC loopback/testing profile riêng, không đẩy data thật qua LAN HTTP. TLS certificate pinning chưa chọn vận hành, không hứa đã pin; release signing fingerprint khác TLS pin.

## Revoke/logout/restore

Local logout/stop/source disable lập tức increment native generation, stop capture/upload, cancel work/in-flight best effort, quarantine captured old scope. Server revoke cố gắng online rồi wipe tokens/cache, báo rõ offline revoke pending (logout offline không chứng minh server đã revoke). Request cũ đã đến server không thể undo bằng cancel; ACK xử lý trong old vault nếu còn, không hiển thị owner mới. Ghi tombstone/pending revoke không token plaintext; lần reconnect cùng owner hoàn tất revoke/reauth trước resume. `stopAndQuarantine` không tự coi là server consent revoke; UI cần phân biệt dừng máy và revoke device/consent thực qua owner API.

Switch A→B không đổi scope bất kỳ row, batch, ACK, pending auth hay key; B không đọc/mở/xóa vault A. Same-owner reconnect còn phải kiểm live captured epochs/binding; nếu revoked/reset/restore thì old item remains quarantine/investigation, không tự retag/replay. Server recoveryEpoch mới làm invalidate caches/credentials; reconcile bằng new live enrollment chỉ khi protocol cho phép, missing receipt **không auto ingest lại**. Android backup/clone/reinstall/new device không tái dùng keys/credentials; tạo installation mới và owner re-enroll, chưa ACK local có thể mất.
''')
    tables = [
        ('installation_meta','id, local_schema_version, generation, encrypted_state, updated_at','Installation/key alias references and trusted clock anchors; no owner finance in clear'),
        ('owner_vaults','id, scope_hmac, state, key_version, wrapped_dek, nonce_prefix, nonce_counter, iv, encrypted_state','Owner/workspace/device/capture epoch and credentials inside ciphertext; distinct DEK per vault; durable nonce counter outside ciphertext'),
        ('outbox_items','id, vault_id, state, sequence, key_version, iv, encrypted_payload, eligible_until, bytes','Immutable normalized observation/binding/parser/event/revision/digest; local dates inside ciphertext authoritative'),
        ('capture_identities','id, vault_id, lookup_hmac, key_version, iv, encrypted_state, expires_at','OS occurrence and last digest/revision; bounded index, not reliable bank identity'),
        ('upload_batches','id, vault_id, state, generation, key_version, iv, encrypted_manifest','Immutable ordered item IDs/revisions/digests + exact semantic command; no retag after split/retry'),
        ('ack_replay','id, vault_id, key_version, iv, encrypted_payload, expires_at, bytes','Bounded normalized observation+durable ACK identity; never converted to pending automatically'),
        ('coverage_gaps','id, vault_id, reason, key_version, iv, encrypted_detail, expires_at','No raw/money/source text; local uncertainty interval pending explicit server mapping'),
        ('auth_pending','id, vault_id, purpose, state, key_version, iv, encrypted_command, expires_at','Rotation/revoke pending intent plus exact idempotency binding; replay lifetime from ARCH06'),
    ]
    js(D/'local-model.json', {'id':'FW-ANDROID-LOCAL-001','status':'ROOM_DESIGN_NOT_EXECUTABLE','postgresChanges':False,
        'tables':[{'name':n,'columns':c.split(', '),'purpose':p} for n,c,p in tables],
        'constraints':['FK vault_id RESTRICT for every scoped table; explicit atomic vault delete only after cancellation/drain fence','UNIQUE vault_id+lookup_hmac for capture identity','UNIQUE vault_id+sequence for outbox; immutable encrypted observation tuple','AEAD nonce uniqueness per DEK enforced across all encrypted tables via repository nonce reservation; not merely table-local unique','Single batch transition/ACK transaction removes pending row only after valid durable ACK plus journal policy; lost ACK retries same semantic IDs','Indexes vault_id/state/sequence, expiration metadata, lookup_hmac; no financial plaintext indexes','Auth secrets are ciphertext; no automatic destructive Room migrations; versioned export schema + migration tests'],
        'limits':{'unackedPendingAndQuarantineItems':1000,'unackedPendingAndQuarantineBytes':8388608,'pendingItems':1000,'pendingBytes':8388608,'captureIndexItems':2000,'localGapItems':256,'activeUploadBatchesPerVault':1,'ackReplayItems':1000,'ackReplayBytes':8388608},'runtime':'NOT_RUN'})
    md('local-storage.md', '''
# Local persistence, keys, retention và clock

Room/SQLite chọn để transaction, migrations và crash recovery. **Payload-level AES-256-GCM**, không gọi toàn bộ database đã mã hóa: opaque IDs/state/count/timing metadata có thể lộ dưới T1/compromised device. Không thêm SQLCipher/NDK dependency mặc định; xem xét sau PoC nếu threat model đòi full database encryption. Toàn bộ Room DB/WAL/SHM, auth vault, attachments nếu có phải ở credential-protected `noBackupFilesDir` qua custom database path được kiểm; no device-protected sensitive storage. `allowBackup=false` + legacy backup rules và Android12+ cloud/D2D extraction exclusions; test OEM transfer, vì [allowBackup=false không đủ mọi OEM](https://developer.android.com/identity/data/autobackup). No cross-platform export of vault. Reinstall/restore phát hiện mất key thì seal/purge orphan ciphertext, không plaintext fallback.

## Keys và model

[Local model](local-model.json) có tám bảng local, không thêm bảng PostgreSQL. Per-vault random DEK256 được wrap bằng Android Keystore AES key; installation P-256 signing, per-collector P-256 signing và wrapping keys tách purpose/alias. DEK chỉ memory lúc dùng, clear references best effort; Keystore key không export. AES-GCM row IV12bytes theo reserved nonce scheme bên dưới, tag16bytes, AAD includes vaultId/scope digest/rowId/revision/schema/keyVersion/purpose. Cross-table durable nonce reservation/counter under repository transaction phải bảo đảm không reuse một key+IV; persist reservation trước encryption/commit, collision/crash retry dùng nonce mới, không claim random IV tự đủ. Design dùng namespace gồm fixed per-DEK random prefix4bytes + monotonically reserved uint64-encoded counter, rotate before overflow; use audited platform crypto API supporting this scheme, **không tự chế cipher**. Không coi local counter là anti-rollback hardware. Tất cả native components chạy cùng app process; reserve serialized theo một repository. Mỗi process start hoặc DB reopen sau crash/integrity error tạo current DEK/keyVersion mới bằng CSPRNG, retired DEKs decrypt-only; DB rollback sau restart không dùng lại nonce namespace cũ. KeyVersion/KEK alias không reuse, kiểm collision. Bounded retained key versions≤64; native compaction re-encrypt retained rows bằng current DEK trước prune retired key, pause capture nếu cap/integrity chưa giải quyết. Không đổi domain identity khi re-encrypt. Copy vault/backup bị cấm; root hoặc cloned concurrent process vượt bảo đảm, không hứa root-proof.

Counter nằm ở owner_vaults.nonce_counter/nonce_prefix ngoài encrypted_state để tránh recursion khi reserve nonce. SQLite signed counter chỉ dùng0…2^63-1 encode thành unsigned64big-endian, rotate trước overflow; persist reservation bằng transaction riêng trước encryption, lost reservation không reuse. Newly created vault ở preparing/không eligible cho tới initialized payload hoàn tất. Retired DEKs decrypt-only, mọi write chuyển current key version. wrapped_dek là AEAD envelope riêng chứa alias/IV/tag; KEK alias riêng mỗi vault+DEKversion wrap-once, wrap crash/retry tạo KEK alias mới thay vì reuse key để encrypt lại. DEK AEAD chạy bằng platform API với explicit reserved nonce; Keystore randomized-encryption wrapping dùng platform-generated IV riêng. Không nhầm IV wrapping với IV row. Implementation phải kiểm concurrency/power loss/rotation với Android provider, chưa có crypto code ở đây.

Background upload cần dùng key sau first unlock khi màn hình khóa: không per-use biometric cho collector/queue key; owner high-risk vẫn fresh server reauth. StrongBox ưu tiên nếu available nhưng fallback TEE/software phải ghi actual security level/eligibility, chưa tự chứng nhận REAL; [Keystore](https://developer.android.com/privacy-and-security/keystore) không ngăn process bị xâm phạm dùng key. Device unlocked/vault state, not biometric mỗi15min, là background boundary. Hardening không thay T1 trusted server.

| Local table | Mục đích |
| --- | --- |
''' + '\n'.join('| '+n+' | '+p+' |' for n,c,p in tables) + '''

scope owner/workspace/device/captureEpoch nằm encrypted state có authenticated scope HMAC tham chiếu; không nhận ownerId từ JS để mở vault tùy ý. WorkManager DB chỉ opaque vault/work IDs, không serialized observations/credential. Database transactions serialized per vault; upload generation/captured tuple immutable checked again trước gửi và ACK. Batches reference immutable row revision; item sending không cho parser overwrite dưới cùng ID/revision; new revision creates new record/sequence.

Pending≤1000items/8MiB; aggregate not-yet-ACKed pending+quarantine cũng≤1000items/8MiB để repeated stop/quarantine không tăng vô hạn. Chuyển pending→quarantine không tăng tổng budget, capture chỉ resume khi tổng có chỗ (ACK/owner-confirmed delete/expiry cleanup), không evict pending để lấy chỗ. Automatic send≤7days từ capture. Đến hạn move quarantine thêm tối đa7days, giữ initial deadline, không reset khi retry/login/source change. ACK replay riêng≤1000items/8MiB/7days từ ACK, encrypted normalized payload + ACK phục vụ reconcile, không raw. Journal eviction only ACKed oldest with visible recovery gap; pending full **pause capture**, không silent evict. Bounded capture index2000/14days, local gaps256/14days (coalesce same reason+interval; overflow sticky aggregate unknown flag), terminal batch metadata24h/count≤100, nonce reservations prune only after DEK retirement. Byte caps dùng actual ciphertext+IV/tag plus row/serialized overhead accounting; total file-size guard32MiB proposed, no success promise until measure WAL/SQLite. Full/IO/crypto failure leaves prior queue intact, pause capture + gap/health warning, fail close upload if integrity uncertain. No ciphertext into public external storage.

## Clock and physical deletion

Trong cùng boot dùng elapsedRealtime gồm sleep để tăng tuổi từ capture; wall clock có thể bị sửa. Trusted anchor lấy time interval từ authenticated HTTPS server response/challenge + bounded RTT, propagate monotonic duration. Eligibility dùng **upper age bound** để không gửi quá hạn, absolute retention không tự kéo dài. Reboot/boot-ID change/clock rollback/unknown bounds: seal old payloads, không decrypt/display/upload hoặc capture REAL cho tới trusted server time re-established; không dùng wall clock đơn độc. Re-anchor chỉ tăng conservative age; future timestamps/rollback record CLOCK_UNTRUSTED, không gia hạn item. Server date riêng không chứng minh hardware secure clock hay malicious server defense.

Expiry eligibility checked before decrypt/render/send, at worker start/resume and callbacks; cleanup scheduled and on next execution. **OS tắt/force-stop không bảo đảm physical delete đúng giờ**. Overdue ciphertext inaccessible through normal API, purge next execution, count overdue metadata shown. Nếu strong deletion deadline là yêu cầu mới thì cần giải pháp khác/đổi consent; chưa tuyên bố đạt. Deleted row không bảo đảm flash/WAL secure overwrite; rotate/delete vault DEK for cryptographic erasure when toàn vault authorized purge, mark loss of pending observations, reconcile server history unaffected. Per-row erase không hứa cryptographic wipe khi cùng DEK giữ rows khác. Keys retention follows bounded queue/quarantine/ACK deadlines, owner logout quarantines chứ không auto-destroy pending key.

Clock/nonce local rollback protection has limits against rooted/cloned app. Native process compromise can invoke allowed capabilities/read plaintext while decrypting; test scope and hardening, không mô tả E2EE/anti-Ops.
''')
    rows = list(csv.DictReader((R/'docs/async/operation-permissions.csv').open(encoding='utf-8')))
    owner = [x['operation'] for x in rows if x['actor'] in ('owner','owner-session') and x['operation'] != 'renewSession']
    auth = ['signIn','registerIdentity','requestPasswordReset','resetIdentityPassword','verifyNativeIdentityChallenge','renewNativeSession','requestOwnerReauthentication','verifyOwnerReauthentication','redeemOwnerRecoveryCode','signOut']
    managed = ['registerDevice','requestDeviceEnrollment','requestCollectorCredentialChallenge','issueCollectorCredential']
    owner = [x for x in owner if x not in managed and x not in auth]
    # Identity-only operations must never expose newly minted tokens via generic owner replies.
    secrets = ['rotateOwnerRecoveryCodes']
    owner = [x for x in owner if x not in secrets]
    auth += secrets
    js(D/'consumer-operation-map.json', {'apiRevision':'FW-API-T1-D1J2-004','nativeBridgeRevision':'FW-NATIVE-BRIDGE-002',
        'ownerBroker':owner,'nativeIdentityHandlers':auth,'managedEnrollmentHandlers':managed,
        'backgroundCollector':['ingestNotifications','reconcileReceipts','renewCollectorCredential'],
        'excludedBrowserOnly':['verifyIdentityChallenge','renewSession'],
        'allOtherOperations':'No native generic access: admin/internal/service/browser-only; owner capabilities never from JS role string',
        'secretPolicy':'Auth minting replies consumed natively; recovery codes shown only native secure owner screen after reauth, not generic JS JSON', 'runtime':'NOT_RUN'})
    api_schemas=json.loads((R/'docs/contracts/v2-t1-r4/schemas.json').read_text(encoding='utf-8'))['components']['schemas']
    handler_rules={
      'signIn':(['email','password'],[],['challengeId','nonce'],['flowId','state','expiresAt','channel','synthetic']),
      'registerIdentity':(['email','name','password','passwordConfirmation','syntheticAcknowledgement'],[],['challengeId','nonce'],['flowId','state','expiresAt','channel','synthetic']),
      'requestPasswordReset':(['email'],[],[],['message','synthetic']),
      'resetIdentityPassword':(['password','passwordConfirmation'],[],[],['message','synthetic']),
      'verifyNativeIdentityChallenge':(['code'],[],['tokens'],['session','profile','synthetic']),
      'renewNativeSession':([],[],['tokens'],['session','profile','synthetic']),
      'requestOwnerReauthentication':(['password'],[],['challengeId','nonce'],['flowId','expiresAt','channel']),
      'verifyOwnerReauthentication':(['code'],[],[],['reauthenticatedUntil']),
      'redeemOwnerRecoveryCode':([],['email','recoveryCode'],['resetToken'],['flowId','expiresAt','state']),
      'signOut':([],[],[],['signedOut','synthetic','revokePending']),
      'rotateOwnerRecoveryCodes':([],[],['codes'],['completed','generatedAt']),
      'requestDeviceEnrollment':([],[],['challengeId','nonce'],['flowId','expiresAt']),
      'registerDevice':(['name'],[],[],list(api_schemas['registerDeviceOutput']['properties'])),
      'requestCollectorCredentialChallenge':([],[],['challengeId','nonce'],['flowId','expiresAt']),
      'issueCollectorCredential':([],[],['token'],['deviceId','expiresAt','authorizedUntil']),
    }
    handlers=[]
    for op in auth+managed:
      ui,dialog,consume,projection=handler_rules[op]
      api_fields=list(api_schemas[op+'Input'].get('properties',{}))
      native=[field for field in api_fields if field not in ui+dialog]
      handlers.append({'operationId':op,'uiInputFields':ui,'nativeDialogOnlyFields':dialog,'nativeInjectedInputFields':native,
                       'nativeConsumedResponseFields':consume,'jsResponseProjectionFields':projection,
                       'uiPayloadAdditionalProperties':False,'exactApiInputSchema':op+'Input','exactApiOutputSchema':op+'Output'})
    js(D/'managed-handler-contract.json',{'revision':'FW-NATIVE-BRIDGE-002','handlers':handlers,
      'flow':'Opaque CSPRNG flowId scoped installation/current owner where applicable/local generation/purpose/expiry, one active pending challenge per flow. Never JS-provided server challenge/nonce/proof/publicKey/resetToken/token. Local flowId is not serialized as an API field.',
      'nativeValues':'installation SPKI, pending challenge ID/nonce, current session/device, android platform, actual native build/required accepted consent, collector SPKI/proof and native-vault reset token. Validate final request against API004 after injection.',
      'recovery':'redeem code and display rotated codes in native secure dialogs; resetToken remains vault-only and is consumed on password reset. Mail reset links must be verified/captured natively, never injected into WebView URL/JS; REAL link host remains a release gate.',
      'runtime':'NOT_RUN'})
    md('bridge-and-consumer.md', '''
# Native bridge2, API004 consumer mapping

Source hiện tại `finweave-web/src/native/collector.ts` có strict Zod NativeStatus, bảy methods, `window.Capacitor.Plugins.FinWeaveCollector`, consent literal2026-10-08; `capacitor.config.json` appId test.finweave.prototype/webDir dist. package.json chưa có Capacitor; chưa có Gradle native project ở frontend. Các source hashes trong evidence. **Không sửa source/dependencies ở ARCH10**.

Bridge revision `FW-NATIVE-BRIDGE-002` là hợp đồng nội bộ JS↔Kotlin, **không đổi API contractVersion/revision004**. Khi implementation dùng Capacitor registration/proxy hỗ trợ8.x và typed adapter; legacy global access không được giả có native vì wrapper tồn tại. Handshake `getCapabilities` kiểm bridge/API revision/profile/native build trước enable collector, mismatch→UPDATE_REQUIRED/manual mode. Browser web mock giữ fixture label, không giả listener granted trên Android thật. Không đặt rich v2 status trực tiếp vào strict NativeStatus cũ; adapter xuất chính xác legacy keys, không thêm unknown properties. `getStatusV2` là method riêng có schema.

| Legacy method | Native2 mapping / authority |
| --- | --- |
| getStatus | NativeStatus cũ projected từ v2; granted chỉ OS grant, readiness phải xem listenerBound/vault/clock/authorization riêng; queue≤100 + truncated flag hiển thị qua adapter v2 |
| acceptDisclosure({version}) | So sánh đúng release-required consent, user action + stored timestamp; version cũ không tự được nâng, CONSENT_UPDATE_REQUIRED |
| openNotificationSettings | Chỉ OS settings handoff, không tự grant; check permission/bound after resume |
| setSources({packages}) | Legacy selection request only; native resolve catalog + live server bindings. Mapping chưa đủ trả BINDING_REQUIRED, không tự map account đầu |
| stopAndQuarantine | Immediate local fence/cancel/quarantine, không khẳng định server consent/device revoked |
| retryQueue | Same scope + exact event/revision/digest, no reset expiry/epoch/attempt identity, serverRetryAfter floor |
| deleteQuarantined({reason}) | Current vault only, native confirmation count/interval/loss, no other-owner delete/no server actual delete |

Native2 thêm `getCapabilities`, `getStatusV2`, `listQueue`, `configureCapture` và native identity/typed owner invocation. [JSON schemas](native-bridge-schemas.json) quy định shape, bounded pages/enum; [operation map](consumer-operation-map.json) phân generic owner vs native managed handlers vs collector. Page cursors opaque current vault+generation bound, change generation invalidates, no unbounded status queue. Required broker inputs API004 validated against pinned schemas. Local vault/capture generation không field mới được tự thêm vào API004 envelope; strip local fields and inject exact revision/requestId/idempotency/proofs as spec.

Native identity methods get operation-specific input, credentials inserted natively, secret-bearing responses consumed in vault and projected secret-free session status; no generic fetch/sign/readKeystore. register/enroll/issue handlers build collector proof natively, not JS-supplied proof. Generic owner map excludes browser renewSession/verifyIdentityChallenge, minting/recovery-code paths, admin and internal ops. All feature operations còn lại giữ đầy đủ; currently frontend session headers/mock remain separate until real adapter implementation. Recovery codes shown native secure owner UI only with reauth, no logging/screenshots.

[Managed handler contract](managed-handler-contract.json) liệt kê chính xác15auth/enrollment operations: fields UI được gửi, fields chỉ native dialog, fields native inject, response fields native consume và projection được trả JS. Password/code FinWeave từ UI không được persist/log; không liên quan OTP ngân hàng bị listener loại. flowId opaque scope/generation/purpose/expiry-bound thay server challengeId; final wire input vẫn validate API004. Native inject actual platform/appVersion/accepted consent/public keys/proofs/session/device/resetToken, reject JS overrides. Recovery resetToken không vào JS/deep-link WebView; native verified link/dialog handler giữ token, host REAL cần xác minh. Logout local fence chạy trước request, không đợi HTTP thành công mới ngăn upload.

## WebView boundary

Only bundled main-frame application origin, deny remote navigation/iframes/remote executable scripts/mixed/file/content access; external links in system browser/Custom Tab without FinWeave bridge. Native WebView client checks navigation/resource allowlist, CSP no unsafe remote execution, no arbitrary JS messaging from all frames. Release no web debugging/server.url/dynamic remote code. All bridge calls verify current foreground owner session/native generation and capability, schema, payload bounds; background uploader not accessible through arbitrary JS endpoint. Do not trust caller-provided headers/role/ownerId/url; backend current authorization independent.

[Native bridge risks](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges): origin restrictions reduce remote injection but **same-origin XSS vẫn có thể gọi owner capabilities**. Token kept native không bảo đảm XSS không đọc owner business data/call normal actions. High-risk commit/delete/config needs server fresh reauth + native trusted confirmation bound exact operation/input digest/generation, never approve previous dialog for modified JS input. This is defense in depth, not proof against fully compromised native process. No bridge capability makes agent auto-post actual.

## Status/error contract

Status includes observed timestamps and uncertainty; READY requires all prerequisites, no UI derivation from granted/enrolled booleans alone. Errors include NATIVE_UNAVAILABLE, UPDATE_REQUIRED, CONSENT_UPDATE_REQUIRED, PERMISSION_DENIED, LISTENER_UNBOUND, BINDING_REQUIRED, OWNER_MISMATCH, REAUTH_REQUIRED, CLOCK_UNTRUSTED, QUEUE_FULL, KEY_UNAVAILABLE, EPOCH_CHANGED, EXPIRED, NETWORK_WAIT, SERVER_RETRY_AFTER, INTEGRITY_FAILED. User action descriptions from bounded enums, no raw exceptions/text/SQL/server secrets. API business reply/version/cache ordering theo ARCH09, ACK riêng actual, local key doesn't confer server authorization.
''')
    md('apk-release.md', '''
# APK build, signing, upgrade và distribution

## Profiles và toolchain

SYNTHETIC: existing prototype identity chỉ local test namespace, signed test keystore riêng và fixture endpoints. REAL candidate: appId/backend HTTPS origin/release certificate/required consent/source catalog **chưa được cấu hình**, build fail closed nếu thiếu; không tự lấy test.finweave.prototype hoặc domain ví dụ làm production. Fixed bundled assets, cleartext/mixed/debug disabled, no injected dev server. No admin dashboard or worker/provider/model secrets in APK. MinSdk24/compile+target36 theo [Capacitor8 upgrade guide](https://capacitorjs.com/docs/updating/8-0); Capacitor core/android/cli/App cùng compatible8.x patch exact phải resolve/review/pin lockfile khi implementation, không dùng @latest trong reproducible CI. Node22+; guide baseline AGP8.13.0/Gradle8.14.3/Kotlin2.2.20 và Android Studio2025.2.1+. JDK theo compatible AGP/Studio bundled runtime được ghi build manifest, không tự pin khác chưa kiểm. Check updates/support advisory tại implementation/release, upgrade qua ADR/tests. Không cài toolchain hoặc sửa lockfile ở bước này.

Pipeline dự kiến: pinned dependency verification → web user build → copy bundled dist with source hash → Capacitor sync checked → Kotlin/Room schema migration/unit/instrumentation → lint/security manifest scan → assemble release → zipalign/sign/apksigner verify → manifest/checksums/SBOM → device install/update evidence → publish only approved artifact. No destructive Room migrations. Build succeeds không chứng minh native behavior/support. ABI/native dependencies nếu có phải kiểm supported architectures/16KiB-page devices; tránh thêm NDK dependencies mặc định không thay kiểm packaged libraries.

## Signing/updates

Offline owner-controlled signing keystore, password protected; backup offline thứ hai, key/password không VCS/code/app/env committed/log/process arguments. CI signing only explicit authorized secret handling, no upload private key to hosting. Same stable appId+signing lineage và versionCode strictly increasing; certificate rotation phải lập/test migration strategy, không auto new key làm update uninstall. Version rollback APK lower versionCode không là recovery plan: roll forward signed fixed build và compatible Room migrations; old code opening newer schema fail closed/manual recovery, không wipe data để chạy.

Release record bắt buộc appId/versionName/versionCode/min+targetSDK/source+asset hashes/dependency+toolchain/SBOM/API004+bridge2/consent/parser catalog/signing-cert SHA256/APK SHA256/bytes/OS support results/date/signature verification. Hash từ cùng compromised website không tự chứng minh trust: app trust anchor là Android signing identity và verified/pinned release policy. Optional signed release metadata bằng offline release key có public key đã pin, không mint key trong task; no updater generic code execution. Download HTTPS explicit user request, Android package installer user-confirmed, no silent install/REQUEST_INSTALL_PACKAGES default. Web Devices/admin release UI chỉ show download khi artifact thật+verified metadata+available; hiện **APK_NOT_BUILT**, không tạo link giả.

## Free-first nhưng không hứa phát hành vô hạn miễn phí

Local build/test trên phần cứng đang có không phát sinh phí dịch vụ build bắt buộc; cần dung lượng/SDK/network/device. Direct APK dùng download hosting đã được duyệt, không mặc định free bandwidth vô hạn. Không đăng ký tài khoản/provision/upload/publish/payment ở ARCH10.

Kiểm ngày09/10/2026: [limited distribution account](https://developer.android.com/developer-verification/guides/limited-distribution) miễn phí, tối đa20 thiết bị được user authorize, hướng personal/learning/noncommercial; cần Google account/2SV/payments profile/contact. Đây là option cho project/synthetic pilot phù hợp, không khẳng định SaaS thương mại đủ điều kiện hoặc toàn bộ user chỉ cần link download là xong. [Verification rollout](https://developer.android.com/developer-verification) bắt đầu30/09/2026 ở các khu vực được liệt kê, mở rộng2027; phải kiểm lại quốc gia/thiết bị/store/account/fees ở release. Không tuyên bố hiện mọi máy Việt Nam bị chặn hoặc mọi APK đều miễn phí mãi mãi. [Package/certificate registration](https://developer.android.com/developer-verification/guides/android-developer-console) cần ownership; broad commercial distribution/Play fee chưa approved, no automatic paid fallback.

Release gates còn mở: owned appId/origin, actual phone/OEM, source/parser licenses ARCH11, real server identity/security/restore PoCs, measured storage/battery/gaps, signing custody/distribution eligibility, UAT. Các gate không cắt feature hoặc cản backend synthetic implementation; chúng cản tuyên bố APK thật/production.
''')
    md('sequences.md', '''
# Native sequences và state transitions

## Capture→ACK

1. System callback → gate current local generation/consent/source signer/binding/unlock/clock/capacity.
2. Bounded memory extract → normalize/filter → Room transaction event/revision + nonce reservation + encrypted outbox insert (crash prior commit = not accepted locally; gap possible).
3. Unique scoped worker → live eligibility → immutable batch snapshot≤50items/256KiB actual serialized UTF8 API envelope → credential renewal only if needed → send outside Room transaction.
4. 413 split same identities; 429 RetryAfter floor; timeout/lost response same semantic IDs, fresh proof where required. No queued item rewrite while in-flight.
5. Validate API revision/reply/schema/current request binding/receipt matching identity. ARCH09 mixed202/all422 outcomes; only durable accepted/matching already-ACKed result qualifies ACK. Permanent reject→quarantine, transient→retry, not all HTTP2xx mean accepted.
6. Single Room transaction store bounded ACK replay+receipt metadata and remove that exact pending revision. Invalid/reordered/wrong-owner/wrong-digest/request-mismatch response leaves pending, health failure. ACK without digest only trusted if exact immutable request pairing preserved. Poll/query server receipt for posted/Review; native no actual write.

States pending→sending→retry_wait→sending; exact ACK→ack_replay; permanent/revoked/expired/generation mismatch→quarantined; explicit current-owner delete or retention expiry→removed. Expired sending becomes quarantine before any next retry. ACK replay expiration/overflow records recovery gap then removes oldest journal only. Queue identity and old-owner scope never migrate.

## Logout/switch/restore

Local generation fence→capture stop→cancel worker/request best effort→quarantine old vault→attempt server revoke (offline pending explicit)→clear UI/auth sessions→new owner different vault. Late callback/ACK cannot cross vault; server already accepted old observation stays old owner authority. Reconnect same owner validates all epochs before action; restore calls reconcile only with new live creds/protocol, missing receipts investigate, no auto replay. Reinstall cannot decrypt old copied vault, no backup identity reuse.

## Install/update

Verify published release metadata/certificate/source→user package installer→same-app signed upgrade→Room migration atomic/rollback tested→vault/key/clock/generation check→bridge+API compatibility→onboarding consent update if required→permission health + server sync. Missing signing key or migration error fail closed; no destructive migration/default database recreation hiding pending data loss. Back action/keyboard/dialog/wizard never commits financial draft implicitly.
''')
    policy = {'id':'FW-ANDROID-POLICY-001','date':'2026-10-09','status':'DESIGN_ONLY','nativeBridgeRevision':'FW-NATIVE-BRIDGE-002',
        'apiRevision':'FW-API-T1-D1J2-004','databaseRevision':'FW-PHYS-T1-ASYNC-005',
        'stack':{'shell':'Capacitor8.x compatible exact patches at implementation','native':'Kotlin','storage':'Room plus AES256GCM sensitive payloads','minSdk':24,'compileSdk':36,'targetSdk':36},
        'rawNotification':{'persist':False,'upload':False,'log':False,'model':False,'memoryChannelItems':32,'textProjectionBytes':16384},
        'outbox':{'maxItems':1000,'maxBytes':8388608,'unackedBudgetIncludesQuarantine':True,'autoRetryDays':7,'quarantineAdditionalDays':7,'maxBatchItems':50,'maxEnvelopeBytes':262144},
        'ackReplay':{'maxItems':1000,'maxBytes':8388608,'maxAgeDays':7,'autoReingestMissing':False},
        'work':{'periodicMinutes':15,'backoffSeconds':30,'scopedUploaders':1,'exactTimingGuarantee':False},
        'keys':{'installation':'P256','collector':'separate P256 per scoped enrollment','vault':'per-vault AES256GCM DEK wrapped by Keystore','backgroundPerUseBiometric':False,'strongBoxGuaranteed':False},
        'clock':{'sameBoot':'elapsedRealtime plus trusted TLS server interval','rebootWithoutTrustedAnchor':'seal payload and pause real capture','useUpperAgeBound':True,'physicalDeletionWhileOffGuaranteed':False},
        'distribution':{'preferred':'local synthetic APK; eligible limited distribution optional','freeDeviceLimit':20,'commercialEligibilityConfirmed':False,'accountCreated':False},
        'realBuildGates':{'appId':None,'apiHttpsOrigin':None,'releaseCertificate':None,'verifiedDeviceMatrix':False,'verifiedSourceCatalog':False},'runtime':'NOT_RUN'}
    js(D/'android-policy.json',policy)
    def obj(props, required=None): return {'type':'object','additionalProperties':False,'required':required if required is not None else list(props),'properties':props}
    def en(*v): return {'type':'string','enum':list(v)}
    def st(n=120): return {'type':'string','minLength':1,'maxLength':n}
    def nullable(s): return {'anyOf':[s,{'type':'null'}]}
    def integer(a=0,b=2147483647):return {'type':'integer','minimum':a,'maximum':b}
    ref=lambda n:{'$ref':'#/$defs/'+n}
    timestamp={'type':'string','format':'date-time'}
    queue=obj({'id':st(),'state':en('pending','sending','retry_wait','quarantined'),'observedAt':timestamp,'source':st(),'reason':nullable(st()),'retryAfter':nullable(timestamp)})
    defs={
      'LegacyStatus':obj({'permission':en('granted','denied','unknown'),'consented':{'type':'boolean'},'network':en('online','offline','unknown'),'enrolled':{'type':'boolean'},'ownerBound':{'type':'boolean'},'lastObserved':nullable(timestamp),'lastAck':nullable(timestamp),'pausedReason':nullable(st()),'queue':{'type':'array','maxItems':100,'items':ref('LegacyQueueItem')}}),
      'LegacyQueueItem':queue,
      'Capabilities':obj({'bridgeRevision':en('FW-NATIVE-BRIDGE-002'),'apiRevision':en('FW-API-T1-D1J2-004'),'profile':en('SYNTHETIC','REAL'),'buildId':st(),'requiredConsentVersion':st(),'nativeAvailable':{'const':True}}),
      'StatusV2':obj({'bridgeRevision':en('FW-NATIVE-BRIDGE-002'),'generation':integer(1),'checkedAt':timestamp,'permission':en('granted','denied','unknown'),'network':en('online','offline','unknown'),'enrolled':{'type':'boolean'},'ownerBound':{'type':'boolean'},'listenerBound':{'type':'boolean'},'consent':en('required','accepted','update_required','revoked'),'vault':en('locked','ready','quarantined','key_unavailable'),'clock':en('trusted','uncertain'),'readiness':en('ready','paused','setup_required','update_required'),'reason':nullable(st()),'pendingCount':integer(0,1000),'pendingBytes':integer(0,8388608),'quarantineCount':integer(0,1000),'ackReplayCount':integer(0,1000),'queueTruncated':{'type':'boolean'},'lastObserved':nullable(timestamp),'lastAck':nullable(timestamp),'physicalPurgeOverdue':{'type':'boolean'},'revokePending':{'type':'boolean'}}),
      'ConfigureCapture':obj({'generation':integer(1),'consentVersion':st(),'bindingIds':{'type':'array','maxItems':100,'uniqueItems':True,'items':st()}}),
      'ListQueueInput':obj({'generation':integer(1),'cursor':nullable(st(1024)),'pageSize':integer(1,100)}),
      'QueuePage':obj({'generation':integer(1),'items':{'type':'array','maxItems':100,'items':ref('LegacyQueueItem')},'nextCursor':nullable(st(1024))}),
      'OwnerInvocation':obj({'generation':integer(1),'operationId':{'type':'string','enum':owner},'input':{'type':'object'},'idempotencyKey':nullable(st(200))}),
      'BridgeError':obj({'code':en('NATIVE_UNAVAILABLE','UPDATE_REQUIRED','CONSENT_UPDATE_REQUIRED','PERMISSION_DENIED','LISTENER_UNBOUND','BINDING_REQUIRED','OWNER_MISMATCH','REAUTH_REQUIRED','CLOCK_UNTRUSTED','QUEUE_FULL','KEY_UNAVAILABLE','EPOCH_CHANGED','EXPIRED','NETWORK_WAIT','SERVER_RETRY_AFTER','INTEGRITY_FAILED'),'retryAfter':nullable(timestamp)})
    }
    js(D/'native-bridge-schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'urn:finweave:native-bridge:002','description':'Design only. OwnerInvocation.input must additionally validate exact pinned API004 per-operation schema; JSON outer shape alone insufficient. Legacy projection exact keys.','type':'object','$defs':defs})
    cases=[
      ('Build/toolchain pin and APK signature verify','UI-M-06','Signed APK, package/certificate/hash/manifest/supply-chain scan'),
      ('Bridge2 handshake/legacy strict status/browser absence','UI-M-05','Actual Capacitor registration and mismatch/manual behavior'),
      ('OS access grant/deny/revoke/resume','UI-M-01','System settings plus listener bound timestamps, no return=grant'),
      ('Own POST_NOTIFICATIONS denied independent access','UI-M-01','Distinct permissions/health warning'),
      ('Sideload restricted settings supported OS flow','UI-M-06','No bypass; exact country/install source/build'),
      ('Source signer/version/catalog filter','UI-M-02','Forged package/signature/unsupported app rejected'),
      ('Consent update/revoke and capture fence','UI-M-01','Old literal cannot silently accept new consent'),
      ('Multi-account bindings/version/ambiguous Review','UI-M-03','No first-account fallback or old-item retag'),
      ('Callback duplicate/update/remove/repost identity','UI-M-04','OS key reuse and weak semantic match remain Review'),
      ('OTP/group-summary/redacted/unknown privacy','UI-M-04','Disk/network/log/heap scope evidence; no raw persisted'),
      ('Main-thread bound/channel overflow/oversize','UI-M-05','Capture latency and explicit pause/gap, no truncation posting'),
      ('Room crash/IO/full/transaction integrity','UI-M-05','Before/after commit kills, WAL encrypted finance scan'),
      ('AES-GCM nonce/AAD/bitflip/cross-vault','UI-M-05','Nonce allocation crash/rollback; crypto library/Android vectors'),
      ('Keystore AFU screen-off/first-unlock/invalidation','UI-M-05','Background key usable after unlock; no DirectBoot finance'),
      ('Native ES256/JCS/SPKI cross-runtime proof','UI-M-04','Android DER↔raw64 Node verify; nonce/time/body/audience negative'),
      ('Owner refresh race/lost-reply/reuse','UI-M-05','Mutex durable exact replay5min wrong-reuse revoke'),
      ('Collector renewal and30d authorization','UI-M-05','24h renewal no owner refresh; expired ref≤7d only renewal'),
      ('Offline outbox/network recovery/WorkManager','UI-M-05','UI closed/restart, scoped one uploader; delays measured'),
      ('Doze/OEM/force-stop/reboot gaps','UI-M-05','Android13–16 plus compatibility24/29/32 candidate matrix'),
      ('Batch50/256KiB/413/retryAfter','UI-M-05','Actual UTF8 envelope bytes; identities immutable on split'),
      ('ACK mixed202/all422/lost/mismatch/reordering','UI-M-04','Room exact ACK journal atomic; no false posted'),
      ('Pending caps/7d+quarantine7d/ACK replay caps','UI-M-05','No pending silent eviction; explicit gap after journal eviction'),
      ('Clock rollback/rebootoffline/deadline access','UI-M-05','Upper-age bound, no decrypt/upload expired, cleanup overdue honest'),
      ('Logout offline/revoke pending/late ACK','UI-M-05','Old scope held, no claim remote revoked until response'),
      ('Owner A→B and same-owner revoked epoch','UI-M-05','Other vault inaccessible, no delete/retag/replay'),
      ('Server restore witness/epoch/reconcile missing','UI-M-05','New credentials; missing receipt investigation not auto ingest'),
      ('Backup/D2D/clone/reinstall/key missing','UI-M-06','Inspect all DB/WAL/WorkData/keys backup; new installation'),
      ('WebView navigation/frame/XSS/bridge capabilities','UI-M-05','No generic signing/fetch, fresh native confirmation binds input'),
      ('Same-key APK upgrade/Room migration/failure','UI-M-06','Preserve pending journal; wrong signer/version fails/no destructive path'),
      ('Download authenticity/distribution eligibility','UI-M-06','Real artifact metadata+fingerprint; optional free20-device enrollment'),
      ('TalkBack/text scale/keyboard/back/insets','UI-M-01…06','48dp, cancel/draft safe, Android system UI verified'),
      ('End-to-end phone→API→ledger→web/Plan–Goals','UI-M-04','Actual integration+owner UAT, no Agent actual authority'),
    ]
    trace=[{'id':f'AND-{i:02d}','requirement':title,'screen':screen,'acceptanceId':f'ANDR-{i:02d}','evidenceRequired':ev,'status':'SPECIFIED','runtime':'NOT_RUN'} for i,(title,screen,ev) in enumerate(cases,1)]
    js(D/'requirement-traceability.json',{'parentScope':'Existing41 product AC + full21 required backlog groups unchanged; these32 Android refinements do not replace/count as new product AC','requirements':trace})
    md('acceptance-plan.md','''
# Android acceptance plan — all runtime NOT RUN

32 refinements AND-01…32 / executable acceptance intentions ANDR-01…32; existing41 parent AC và21 backlog groups giữ nguyên. JSON schema/model/static PASS chỉ chứng minh artifact có shape/liên kết/luật thiết kế, không chứng minh Android, cryptography, privacy, OS/OEM support hoặc backend. [Traceability](requirement-traceability.json).

| Case | Kiểm thực tế | Evidence |
| --- | --- | --- |
'''+'\n'.join('| '+x['acceptanceId']+' — NOT RUN | '+x['requirement']+' | '+x['evidenceRequired']+' |' for x in trace)+'''

Evidence mỗi case: source/lock/toolchain/native/API/schema hashes, appId/cert/APK hash, device/model/OS/security patch/WebView/source-app/parser, preconditions/setup/synthetic-vs-consented-real marker, timed observations, expected/actual, privacy-redacted logs/capture, result/failure/caveat. Không đưa notification raw/OTP/private keys/tokens vào evidence. Không yêu cầu owner thực hiện chuyển tiền thật để “test”; synthetic notification test app riêng và permitted prior samples được ARCH11 quản lý. REAL end-to-end chỉ sau security/auth/restore/server/source gates, owner UAT riêng.

Thứ tự triển khai PoC: registration+signed debug-free synthetic APK/OS access → Keystore/Room/proof interoperability → offline ACK/epochs/clock faults → signed upgrade/backup/D2D → OEM/source integration → actual phone/web ledger + UAT. Nếu platform/source không đủ dữ liệu, giữ full features qua manual/CSV và báo collector gap, cập nhật ADR thay vì invent notification capabilities. Test signatures/schema/money-domain code thật không viết trong giai đoạn documentation này.
''')
    bundle_paths={
      'api':'docs/contracts/v2-t1-r4/openapi.json','database':'docs/data/target-t1-async/target-model.json',
      'asyncBundle':'docs/async/implementation-bundle.json','identity':'docs/security/identity/identity-access-design.md',
      'security':'docs/security/t1/README.md','policy':'docs/android/android-policy.json','bridge':'docs/android/native-bridge-schemas.json',
      'localModel':'docs/android/local-model.json','consumerMap':'docs/android/consumer-operation-map.json','managedHandlers':'docs/android/managed-handler-contract.json'}
    js(D/'implementation-bundle.json',{'id':'FW-ANDROID-BUNDLE-20261009','status':'DESIGN_ONLY','apiRevision':'FW-API-T1-D1J2-004','databaseRevision':'FW-PHYS-T1-ASYNC-005','nativeBridgeRevision':'FW-NATIVE-BRIDGE-002','files':{k:{'path':v,'sha256':sha(R/v)} for k,v in bundle_paths.items()},'runtime':'NOT_RUN'})
    print(json.dumps({'status':'DESIGN_BUILT','protectedFiles':len(json.loads((E/'preservation-before.json').read_text(encoding='utf-8'))['files']),'androidArtifacts':len(list(D.glob('*'))),'requirements':len(trace)}))

if __name__=='__main__': main()
