# Task 9 — VCB + ZaloPay collector candidate

12/10/2026. Phạm vi mới theo yêu cầu owner: **VCB + ZaloPay; MoMo để task sau**. Không sửa BE-16 hoặc các frozen API/native/source bundles. Implementation và fixture execution dưới đây không đóng BE-20 hay acceptance ngân hàng/ví thật.

## Đã code

Kotlin native plugin được đăng ký bằng Capacitor 8, handshake **API005 / native bridge003**, legacy status giữ exact keys. Consent required-version, Notification Access Settings handoff và kiểm lại OS permission khi resume; permission khác listener-bound. JS proxy không tự làm native available. Bridge không nhận credentials, ownerId để mở vault, raw notification, origin tùy ý, SQL hoặc bytes để ký.

NotificationListener chỉ lookup built-in allowlist trước khi đọc extras; gate package/current signer set/version/Android/OEM/model/profile expiry, consent, unlocked state, native owner/device scope, binding/version, trusted clock và generation. Callback không retain Notification/RemoteViews/PendingIntent; text tối đa16KiB, channel32, lỗi/overflow fence và không log raw. **Registry capture hiện rỗng**, do chưa có nguồn được xác minh. Không đoán package/signer từ logo/ảnh.

Parser văn bản VCB ứng viên `vcb-text-candidate-1` đọc title/text/bigText/subText; loại OTP, số/locale/date sai, conflicting extras, balance-only, nhiều amount/fee hoặc thông báo khác. Hai fixture VCB dùng toàn bộ giá trị giả. Grammar chỉ nhận amount/direction/masked suffix; **sourceOccurredAt=null, transactionRef=null, ruleStatus=incomplete** vì timezone, ref namespace và finality chưa xác minh. Không bật thành parser app thật.

Resolver yêu cầu binding enabled, đúng profile/package và selected binding ID; masked discriminator phải khớp. Không chọn account đầu hoặc dùng account khác khi suffix mâu thuẫn. Discriminator chỉ là snapshot local; không thêm field vào `bindCollector`. UI Android hiện đúng hai candidate và logo brand do owner cung cấp, với trạng thái chưa bật. Không đưa ảnh giao dịch gốc hoặc private account/name/ref/balance vào assets/fixture/evidence.

Room có8 bảng, exported schema v1, FK scope/key version, không destructive migration. Payload/auth/batch/identity/ACK/gap AES256-GCM; DEK wrap-once bằng Android Keystore, AAD theo vault/kind/row/key/schema; nonce prefix+counter reservation commit trước encryption và payload transaction. Mỗi repository/process có DEK mới; retired key decrypt-only, cap64 → fail closed. DB/WAL/SHM trong credential-protected noBackupFilesDir; cloud/device-transfer/legacy backup exclusions. Key invalidation/32MiB guard dừng, không tự tạo vault thay dữ liệu bị mất.

Capture giữ CSPRNG eventKey và HMAC OS occurrence index; duplicate exact normalized digest không tạo item; occurrence update không chứng minh economic revision thì gap/Review local. Minimal API005 DTO dùng `income/expense/unknown`, không dựa vào enum prose cũ. Digest SHA256 toàn item bỏ payloadDigest, khớp backend hiện hành. Pending+quarantine≤1000/8MiB, pending7d+quarantine7d; ACK riêng≤1000/8MiB/7d; capture index2000/14d, gaps256/14d. Clock anchor dựa server time+elapsedRealtime+boot count; reboot không có anchor mới → CLOCK_UNTRUSTED.

Worker giữ encrypted immutable request trước HTTP, batch≤50/256KiB UTF8, system HTTPS/hostname validation, không redirects/trust-all/dev URL. ES256 Keystore→raw64, SPKI, canonical supported JSON subset và proof005 đúng purpose/path/audience/body/credential/time/nonce. Timeout/invalid ACK giữ command, fresh proof trên exact semantic retry; durable matching receipts được journal cùng xóa pending trong transaction. ACK không có state posted. All422 phải đúng not_committed và itemErrors toàn batch; permanent rejection giữ quarantine. Definitive413 split giữ item identities; Retry-After floor persistent. Collector credential rotation có encrypted pending command/replay5min và atomic secret consumption, không dùng owner refresh trong worker.

Logout fence native chạy trước request sign-out; hủy work/quarantine scope cũ và xóa owner projection. Restore session ciphertext không tự cho foreground owner quyền xem queue/configure/delete. Mọi native identity/enrollment phải là authenticated native authority; **chưa nối15 managed identity/enrollment handlers hoặc owner broker với backend**. UI login demo React không trở thành native enrollment.

## Bốn trường hợp yêu cầu

| Case | Kết quả fixture | Real source/device acceptance |
| --- | --- | --- |
| VCB tiền vào | PASS cấu trúc văn bản tổng hợp: amount/direction/mask; binding resolver riêng PASS. Time/finality chưa đủ, incomplete | NOT RUN; ảnh không chứng minh NLS extras/package/signer/version |
| VCB tiền ra | PASS cấu trúc văn bản tổng hợp, tương tự | NOT RUN |
| ZaloPay tiền vào | BLOCKED_MISSING_SAMPLE; không tạo fixture positive/grammar giả | NOT RUN |
| ZaloPay tiền ra | BLOCKED_NOTIFICATION_TEMPLATE; ảnh nhận diện ZaloPay là màn chi tiết/biên lai; chỉ test negative | NOT RUN |

Các test wallet âm tính/placeholder không được tính thành hai fixture ZaloPay positive. Instrumentation có hai case ví đánh dấu Ignore với lý do thiếu đầu vào. Không OCR, không raw-training UI, không parser code/regex editor cho admin.

## Kiểm chứng

- Kotlin:21 collector unit cases PASS (13 parser/profile/binding +8 wire/proof/ACK); template ExampleUnitTest của shell được ghi riêng, không tính collector.
- Web:135/135 unit PASS, gồm4 handshake/revision/consent/logout/strict projection tests. Web TypeScript+Vite build PASS.
- Browser:1 synthetic native-branch regression PASS ở390×844, không Service Worker: login/local command/logout, chỉ VCB/ZaloPay, không MoMo, không nhận OS permission từ proxy và không thể chọn/bind nguồn qua phiên mock. Đây không phải Android device execution. Lượt đầu test thiếu checkbox xác nhận trải nghiệm dữ liệu minh họa nên timeout; bổ sung bước test, giữ `browser-results-before.json`/trace và kết quả PASS riêng. Không sửa runtime để bỏ consent.
- Application release lint PASS,0 errors/37 warnings; warnings là dependency updates, locale/resource/obsolete config và các notice đã lưu, không suppress lỗi NewApi.
- Kotlin-generated synthetic wire vector qua validator API005 của backend PASS; whole-item digest/JCS/body/credential digest khớp Node, raw64 ES256 xác minh PASS và altered-purpose signature bị từ chối. Đây là JVM interoperability; Android Keystore/native HTTP NOT RUN. Script `finweave-web/scripts/verify-collector.cjs` kiểm hash toàn source/assets/APK và chứng thư pilot khớp0.1.1.
- APK0.1.2-pilot versionCode3 ký v2/v3; merged APK manifest có NotificationListener bảo vệ bằng BIND_NOTIFICATION_LISTENER_SERVICE, allowBackup=false, cleartext=false, không debuggable. Consent gate mở Notification Access Settings được thực thi native; không chỉ dựa checkbox React.
- Instrumentation APK COMPILED; **NOT RUN**. ADB liệt kê0 devices; SDK không có emulator/system image. Không có OS/OEM/model/source package/version/signer đã đo. Cài/nâng cấp, Notification Settings, screen-off/offline/reboot, Room/Keystore/privacy/crash và end-to-end phone→API→ledger đều chưa nghiệm thu.
- [Evidence](evidence/android-collector-2026-10-12/) và [APK/build/signature manifest](../../artifacts/android/README.md). Signed candidate dùng key pilot cũ; không có production key/appId/origin đã duyệt. Build/signature không phải production release.

Lỗi đã sửa: bridge Kotlin nullable input, InputStream API33 không tương thích min24 (đổi bounded stream read), filesystem sandbox ngăn TypeScript resolve PNPM junctions (build với quyền đọc dependency), unqualified Gradle instrumentation task chạy cả Cordova library test dependency cũ (đổi sang `:app:` tasks). Không thay canonical schema hoặc hạ minSDK để làm PASS.

## Mapping và các finding còn mở

| Screen / capability | Code / API005 mapping | Gate |
| --- | --- | --- |
| UI-M-01 consent/permission | FinWeaveCollectorPlugin acceptDisclosure/openNotificationSettings/getStatusV2, runtime resume check | Cần device OS test |
| UI-M-02 nguồn | local demo-sources.ts VCB/ZaloPay; SourceCatalog.liveProfiles, AppVerifier | Hai source real profiles chưa khai báo |
| UI-M-03 binding | BindingResolver + configureCapture, exact bindCollector/listCollectorBindings/disableCollectorBinding DTO | Native authenticated enrollment/binding sync chưa nối; không dùng mock IDs |
| UI-M-04 setup/receipt | encrypted outbox + Wire/CollectorWorker, ingestNotifications; ACK durable khác posted/Review | Origin null; getReceipt/reconcileReceipts chưa có end-to-end/native owner broker |
| UI-M-05 queue/control | listQueue generation-bound cursors, stop/retry/native-confirm delete; clock/caps/generation | Background/device tests NOT RUN |
| UI-M-06 APK | build-apk.ps1, manifest/source/assets hashes, stable pilot cert/versionCode3 | Candidate signed; install/upgrade NOT RUN |

Finding T9-01: `listSourceSupport` API005 yêu cầu packageName/parserProfileId non-null. Nguồn chưa biết package/parser không thể giả projected API object. Candidate labels hiện local display metadata, không gửi placeholder package lên backend. Nếu cần discovery của nguồn chưa định danh trên server, đề xuất revision riêng với candidate state/nullable identity và consumer migration; **không sửa005 trong task này**.

Finding T9-02: API005 không có operation upload local coverage gap; giữ bounded local gap/reason. Đề xuất một revision riêng chỉ aggregate coverage metadata, không raw; không thêm field vào ingestNotifications.

Finding T9-03: backend runtime hiện chỉ nhận `dev.finweave.synthetic / synthetic-v1 / synthetic-bank`, consent synthetic riêng. Đây là server source-admission gate, không phải lý do tự sửa input/role/revision. Không gửi VCB candidate dưới danh tính synthetic để bypass.

Input còn thiếu: hai notification ZaloPay vào/ra đã khử định danh và cấu trúc title/text/bigText/subText thực trên Android; VCB cần xác nhận ảnh là Android notification hay SMS/in-app; cả hai cần package/version/current signer, OS/OEM/model, timezone/finality và masked discriminator đủ tin cậy. Cần native HTTPS deployment origin và hoàn thiện identity/enrollment adapter trước enable capture/upload. Không xin password/OTP/full bank account hoặc yêu cầu phát sinh chuyển tiền thật.
