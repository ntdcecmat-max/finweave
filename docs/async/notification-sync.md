# Notification → native outbox → receipt → actual

**ASY-11…17 · DESIGN / ANDROID, SQL, NETWORK & RESTORE NOT RUN.** Kế thừa [collector](../architecture/android-collector.md), [identity](../security/identity/identity-access-design.md), [recovery](../security/t1/backup-restore-erasure.md).

## 1. Capture và nhận bền vững

Listener chỉ xử lý app được allowlist và binding/consent còn hiệu lực. Raw notification/OTP ở memory trong thời gian parse, không ghi disk/server/log/model. Lưu normalized minimum evidence đã lọc, immutable owner/workspace/device/capture epoch, binding ID/version, parser/source version, eventKey/revision và digest trong encrypted native outbox **trước** schedule upload. Callback/UI/WebView không là queue authority. Android capture identity canonicalization và key/Room encryption implementation thuộc ARCH-10; không nhận Room mặc định là encrypted.

Digest là SHA256 của canonical typed item, gồm eventKey/revision/bindingId/bindingVersion/sourceKey/observedAt/parserVersion/normalizedEvidence, bỏ chính payloadDigest. Owner/workspace/device/captureEpoch được bind trong outbox/AAD và scoped receipt key; không lấy raw notification hash. Recovery epoch là transport precondition hiện tại, không nằm trong item digest để retry sau reconciliation không đổi identity. Parser redaction phải chặn full account identifiers/OTP/free raw text dù schema chấp nhận string; server kiểm profile/semantic bounds độc lập. Sửa normalized content nghĩa revision mới, không thay digest của cùng identity.

Upload ≤50 items và ≤256KiB **UTF-8 envelope thực**, có headroom auth/envelope; split trước gửi,413 split giữ item keys/digests. Một item quá lớn chuyển local quarantine, không cắt text/amount để vừa. Batch cùng device/capture epoch; authenticated collector hiện tại không được đổi owner/epoch của item cũ. Duplicate identities trong batch reject trước ghi để không có ACK mơ hồ.

Intake transaction kiểm auth/revoke/binding/consent/recovery trước replay. Mỗi valid item: receipt identity/digest/evidence và J2 enqueue durable cùng commit. Same key+same digest trả receipt cũ; same key+khác digest rejected conflict, không overwrite. Mixed202 ACK từng item đúng cặp eventKey/revision; all-rejected422 itemErrors không là durable ACK. Envelope sai không đủ pairing thì giữ batch/quarantine. Chỉ xóa pending sau **durable ACK đúng identity/digest đã gửi**; malformed/missing/duplicate ACK items giữ pending và báo protocol error. ACK không chứa digest nên native phải bind reply với immutable in-flight request, không ghép receipt theo vị trí không kiểm identity.

## 2. Hai lớp chống trùng và posting

Transport key `(workspace,device,eventKey,revision)` chặn retries; semantic key tin cậy do parser/version/account namespace resolve chặn cùng giao dịch qua hai devices/CSV. Unique source_records chỉ trong một source chưa đủ cross-source dedupe: dưới workspace anchor, Ingestion owner service kiểm trusted transaction reference namespace và existing event/evidence trước post. Không có reference đủ mạnh thì ambiguous→Review; amount/time giống nhau không tự gộp. Notification update/revision không tự correction posted amount.

Worker parse/match ngoài transaction, finalize recheck capture epoch/binding version/current consent/source support/live J2 ticket. Domain effect + source record + receipt state/evidence + ledger sealed group/history/version + job result cùng UoW. Posted có event ref; needs_review có Review ref. Parser unsupported/incomplete đi Review hoặc ignored theo rule, không retry vô hạn. User quyết định Review không đổi receipt thành giao dịch lần hai khi event đã có.

Thiếu nguồn/permission/OS capture tạo **coverage gap**, không tạo giao dịch ước lượng hoặc số0. Web/mobile chỉ cộng posted events; receipt accepted/parsed/needs_review là trạng thái chờ riêng. Notification không thấy không chứng minh ngân hàng không có giao dịch.

## 3. Offline và capacity

Worker native unique theo installation/workspace/capture epoch, một uploader hoạt động; enqueue one-time có network constraint khi capture/network recovery, periodic15min chỉ làm safety scan. WorkManager retry dùng30s trở lên và persisted Retry-After floor. Không dùng browser timer cho background. Android WorkManager có minimum periodic15min/backoff10s và có thể trì hoãn; các con số app không là bảo đảm thời gian OS. [Android work requests](https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work).

Chốt ban đầu pending tối đa1000 items/8MiB, auto retry tối đa7d. ACK replay journal riêng tối đa7d/1000items/8MiB, chứa normalized encrypted item+ACK identity cần reconciliation, không raw text. Kiểm count **và bytes**, không coi1000items mặc định vừa mọi điện thoại. Gần đầy cảnh báo, tới ngưỡng pause capture có gap; không evict pending cũ để nhận mới âm thầm. ACK journal đầy thì có thể dừng lưu replay mới với cảnh báo recovery coverage gap, không biến ACK thành pending thất bại hoặc post lại.

Pending quá7d chuyển quarantine; policy này làm rõ phần retention còn mở trước đây: quarantine thêm tối đa7d rồi purge normalized payload theo consent/version đã hiển thị khi bật collector; giữ gap/identity tối thiểu để điều tra. Trước deadline có cảnh báo và thao tác retry/export được phép/xóa. Không chỉ đổi status rồi giữ payload vô hạn. App chưa được bật dữ liệu thật; UX consent/OS cleanup/cảnh báo cần ARCH-10 kiểm trước release. ACK payload xóa khi hết7d, logout/revoke/erase theo policy; key mất/reinstall không bảo đảm khôi phục queue. Metadata gap coalesce theo khoảng/source, có bounds và erasure; không giữ full tài khoản trong diagnostics.

Các mốc trên là deadline đủ điều kiện retry/read và cleanup due, không là bằng chứng OS xóa file đúng giờ khi thiết bị tắt/force-stop. Native phải refuse decrypt/display/upload payload quá deadline, purge ngay lần execution tiếp theo và báo overdue nếu scheduler bị chặn; queue excluded khỏi Android/cloud auto-backup theo ARCH-10. Không claim physical erase14d trên mọi OS/OEM từ timer. Cảnh báo/consent phải nói rõ giới hạn này; server vẫn chỉ nhận evidence còn hợp lệ, không gia hạn tuổi queue bằng đổi observedAt hoặc capture identity.

401 chỉ renew collector bằng native flow được phép, không mượn owner cookie. 403 revoke dừng upload/capture và xử lý keys/queue theo reason; disconnect binding chặn gửi tới mapping khác.429/5xx/network giữ identity và retry floor. Auto transport retry không tạo key mới sau timeout. Không tự chia sẻ capture queue giữa hai tài khoản đăng nhập.

## 4. Restore và reconciliation

Trước mở worker/uploader sau restore: ARCH-07 lấy fresh independent witness head, áp deny/erase/reset, fence host cũ và tăng recovery epoch. Old credential không được dùng để tiếp tục chỉ vì còn trong APK. Owner reauth/proof cấp collector mới; nếu capture owner_epoch đã thay vì revoke/owner switch thì queue cũ quarantine, không retag.

reconcileReceipts chỉ trả durable/missing/conflict của chính device/epoch: durable phải digest khớp; conflict giữ quarantine; missing **không chứng minh chưa từng post trước backup**. Cả pending unknown-ACK và ACK journal nằm trong khoảng restore đều cần điều tra, không automatic repost với recoveryEpoch mới. API003 không có recovery-replay authorization operation riêng; safe default là owner đối chiếu lịch sử/CSV/manual evidence và Review workflow hiện có. Không tạo endpoint giả hoặc hứa tự phục hồi toàn bộ ledger. Gap cần hiển thị cho tới khi có đủ bằng chứng reconcile.

ACK replay horizon7d không phủ RPO/restore outage bất kỳ; native queue mất, ACK eviction, force-stop/OEM/capture gap hoặc backup quá cũ có thể thiếu dữ liệu. T1 single host không zero-loss. Restore rehearsal với real protocol/synthetic data và thiết bị là gate, không dùng các ví dụ mô hình làm bằng chứng.
