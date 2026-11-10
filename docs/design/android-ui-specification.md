> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

# Android UI — onboarding, collector và APK

DES-ANDROID-001 · v1.1 · 09/10/2026 · Mới / SPECIFIED / native PoC NOT RUN.
React wizard có minh họa consent/allowlist/binding/receipt; OP02/OP07 chỉ kiểm phần browser. Cả sáu screen IDs vẫn `native_pending`; [nghiệm thu](../testing/frontend-acceptance-report.md) không chứng nhận quyền OS, collector hoặc APK.

Nguồn: [Android collector](../architecture/android-collector.md), [SRS](../requirements/srs.md), [API004](../contracts/v2-t1-r4/README.md). Core user UI dùng UI-U-01…19 và UI-S như web, cùng authority; đặc tả này bổ sung native, không thay thế toàn bộ user app.

## 1. Native onboarding

User có thể bỏ qua và dùng manual/CSV/Plan/Goals; setup có thể tiếp tục từ Dữ liệu.
| Màn | Nội dung / fields / action | States và kết quả |
| --- | --- | --- |
| UI-M-01 Consent & permission | Giải thích đọc notification giao dịch từ app được chọn, lọc tối thiểu rồi gửi server để sync; không OTP/app khác; coverage có thể thiếu; cách tắt/xóa queue. “Đồng ý và mở cài đặt”/“Để sau” | Chưa consent/consented/OS denied/granted/revoked/unknown; kiểm quyền khi app foreground, không coi quay lại từ OS là granted. Không nhầm quyền push FinWeave với quyền đọc app khác |
| UI-M-02 Chọn app | Danh sách package/appVersion/parser và support đã kiểm; chọn allowlist, chưa hỗ trợ có lý do/fallback | Không select tất cả mặc định; unsupported không ghi supported do có icon app. Consent/permission thiếu thì chưa capture; thay allowlist không gửi dữ liệu ngoài nguồn |
| UI-M-03 Map account | Source + masked identifier → account owner; chọn/tạo bank/wallet, preview binding; xem binding hiện có | Một app nhiều account cần phân biệt; ambiguous → “Chưa xác định”/Review, không chọn account đầu. Mapping đổi có version, không retroactive rewrite history |
| UI-M-04 Test setup | “Kiểm tra kết nối”; timestamp các bước quyền/binding/native queue/server ACK/posted hoặc Review; mở receipt | Synthetic rõ nếu fixture; real transaction không tự phát sinh bằng nút test. Không đòi user chuyển tiền để test. Timeout/denied/unsupported/needs_review khác nhau; ACK không xanh “đã ghi sổ” |
| UI-M-05 Status & queue | Permission/source/network/worker trạng thái riêng; lastObserved/lastAck/lastSeen; pending/retry_wait/quarantine và coverage gaps; xem receipts/retry/đổi nguồn/mở OS/revoke/fallback | Native persistence độc lập UI. Offline/restart vẫn queue owner cũ; retry cùng eventKey/revision/digest và captured scope; expired enrollment cần reauth đúng owner, không dùng user mới |
| UI-M-06 Cài/cập nhật APK | Version/build/download nguồn chính thức được cấu hình, support matrix, hướng dẫn OS bảo vệ, signing fingerprint metadata; cập nhật và quay lại status | Không hứa mọi Android; PoC chưa chạy. Không ép tắt bảo vệ toàn thiết bị hoặc hướng dẫn bypass. Build-only/emulator không là nghiệm thu cài/cập nhật |

UI-M-01…04 là wizard nhưng back/edit an toàn; chỉ nút hoàn thành khi từng điều kiện đã xác nhận. Mở OS settings là handoff, không tự toggle permission. UI-M-06 cũng được liên kết từ web Devices; đường tải chỉ hiện sau khi release artifact thực sự tồn tại, không link APK giả.

## 2. Queue, giới hạn và actions

| Tình huống | UI phải thể hiện / hành động |
| --- | --- |
| Mất mạng/429/503 | “Đang chờ gửi”, lastAttempt và retryAfter khi có; automatic bounded retry/native scheduler, user retry không reset identity |
| Durable ACK | Chuyển khỏi pending chỉ sau durable ACK đúng immutable request/item; normalized encrypted ACK replay riêng≤1.000items/8MiB/7days, không raw. ACK khác posted/Review, không tự replay missing receipt sau restore |
| Parser unknown/redacted | Minimal source/time/reason → Review/manual input; không lưu raw/OTP để debug hoặc gửi LLM |
| Queue đạt7 ngày hoặc1.000 items/8MiB | Pause capture + cảnh báo ngưỡng; retry hoặc xóa có confirm/số items; quá hạn quarantine thêm tối đa7days, không silent pending drop; expiry chặn đọc/gửi, purge khi OS cho thực thi, không hứa xóa vật lý đúng giờ lúc máy tắt |
| Permission revoke/source disable | Dừng capture; chặn upload theo authorization; hiển thị queue owner cùng hướng khôi phục, không giả empty=no transactions |
| Logout/switch account | Dừng capture/upload, xóa finance cache. Queue chưa ACK khóa/quarantine theo owner; trở lại cùng owner mới được resume sau kiểm quyền; không migrate sang owner B |
| Owner chọn xóa queue | Preview số items/khoảng thời gian và nguy cơ mất observations chưa sync, reason/confirm; không xóa giao dịch đã ghi sổ |
| Uninstall/xóa app data | Nêu queue local có thể mất; không hứa server khôi phục observations chưa ACK |
| OS/OEM ngắt hoặc force-stop | Coverage gap/permission health có timestamp “Lần kiểm tra gần nhất”, hướng mở lại app hoặc fallback; không hứa chạy nền liên tục |

Raw chỉ memory-normalize, không có màn “Xem raw notification trên cloud”. Owner evidence là normalized DTO được phép; source text vẫn sensitive/masked. Keystore/encryption/worker do kiến trúc quy định, UI không chứng minh chúng đạt.

## 3. Trải nghiệm native

Bottom nav năm đích; Android Back ưu tiên keyboard → overlay → wizard step → screen history, dirty draft có giữ/bỏ rõ; không back lén confirm. Safe-area/keyboard không che composer/confirm, touch≥48dp và TalkBack semantics. Không mở nested modal với OS sheet. App resume lấy permission + sync state, không resubmit draft hay reset conversation. Real-time sync không là guarantee khi background/OS/network unavailable.

## 4. Tiêu chí bàn giao

Phải thử signed APK cài/cập nhật trên thiết bị support, UI đóng/screen off/reboot/offline/retry/revoke/logout/multi-account/multi-device, TalkBack/text scale/keyboard/insets. Ghi OS/OEM/app/parser/build versions và kết quả từng bước. Tất cả **NOT RUN**, fixture pass không chứng minh một ngân hàng/ví thật đã được hỗ trợ. Các UI-AC tương ứng ở [traceability](ui-requirement-traceability.md).

## ARCH-10 — UI delta chuẩn bị native implementation

Giữ UI-M-01…06 và core user screens. Nội dung chưa được dựng/kết nối trong frontend hiện tại; tất cả native_pending/SPECIFIED/NOT RUN.

| Screen | Bổ sung UI/UX phải triển khai |
| --- | --- |
| UI-M-01 | Consent required-version handshake, listener bound khác permission granted; own-push permission riêng; không auto nâng literal2026-10-08 |
| UI-M-02 | Supported-source catalog có signer/app-version/parser evidence; không icon=đã support, không chọn tất cả. Native config phải resolve live bindings |
| UI-M-03 | Binding ID/version và captured epoch; multi-account ambiguous→Review, reconnect không retag observations cũ |
| UI-M-04 | Native/synthetic label; permission→bound→queue→durable ACK→posted/Review từng timestamp; missing/redacted không giả test thành công |
| UI-M-05 | Clock untrusted/key unavailable/update required, last health time, truncated queue paging/counts/bytes, overdue physical purge, offline revoke pending, pending/quarantine/ACK replay tách biệt. Stop máy khác server revoke; xóa current-owner quarantine có native confirm/count/loss |
| UI-M-06 | APK_NOT_BUILT tới khi signed artifact thật; verified appId/cert/hash/version/OS-OEM support/distribution eligibility; upgrade giữ queue và Room migration. Không fake button hoặc hứa mọi Android |

Reauth/confirmation native cho sensitive owner action phải bind exact operation/input/generation; recovery codes hiển thị native secure screen, không JSON token trả JS. Khi bridge2/API004 mismatch giữ manual mode và hướng update, không giả enrolled/ready. Android Back/keyboard/TalkBack48dp/insets phải kiểm signed APK, không kế thừa PASS browser thành native PASS. Nội dung Android hiện hành: [architecture/support](../android/architecture-and-support.md), [bridge](../android/bridge-and-consumer.md), [storage/clock](../android/local-storage.md), [acceptance32](../android/acceptance-plan.md).

ARCH-10 local budget clarification: pending+quarantine dùng chung≤1.000items/8MiB; ACK replay budget riêng. Chuyển quarantine không giải phóng chỗ capture, không silent pending eviction. Native key generation/nonce rotation và clock checks theo [local storage](../android/local-storage.md).

## ARCH-11 — Source integration handover

UI-M phải phân source supported/permission/binding/coverage; ambiguous/unbound local warning chưa có cloud receipt. Pending/incomplete có binding dùng Review; không tự hiển thị lifecycle subtype API không trả. Không sửa màn UI/runtime trong task này.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Owner mobile Agent flows giữ đủ: Plan/Goal entry↔chat/panel same refs, state/partial/cancel/stale/manualhandoff. Bridge003/API005 execution mode truthfulness và mask mọi narrative/cards/accessibility; native source capture không Agent task.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).
