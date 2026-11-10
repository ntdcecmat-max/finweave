# ADR-017 — Capacitor/Kotlin native collector, scoped local vault và signed APK

09/10/2026 · **ACCEPTED DESIGN within existing Capacitor/Kotlin direction; implementation NOT RUN, APK NOT BUILT.** Kế thừa ADR008…016. Không đổi T1/P2/J2/API004/DB005 hoặc phạm vi đầy đủ user features.

## Context

Giao diện React/Vite đã có native bridge skeleton bảy methods nhưng package.json chưa có Capacitor, chưa Gradle project/APK; browser/mock acceptance không chứng minh Android. Cần thu notification, normalize tối thiểu, durable offline delivery, giữ đúng owner/epoch và server actual authority. Chưa quyết định appId/origin/certificate thật/source/OEM và distribution eligibility. Không sửa frontend trong vòng documentation này.

## Alternatives

| Hướng | Nhận xét |
| --- | --- |
| PWA/browser only | Không cung cấp Android notification listener; không đáp ứng collector |
| React Native/Flutter rewrite | Vẫn cần native listener/keys/storage, thêm migration UI mà chưa có bằng chứng cần thiết |
| Kotlin toàn bộ UI | Có native control, nhưng thay toàn bộ user UI đã dựng; chưa có lý do chi phí/UX cần thiết |
| **Bundled React/Vite + Capacitor8/Kotlin** | Kế thừa UI, Kotlin giữ OS/background/auth/storage; phù hợp hướng đã duyệt. Native implementation/tests vẫn bắt buộc |

## Decision

1. [Android design](../../android/README.md) là master hiện hành. MinSdk24/compile+target36 theo guide Capacitor8 tại ngày nghiên cứu; compatible exact toolchain/dependencies pin ở implementation. Không giả support mọi Android chỉ vì minSdk24.
2. Listener + bounded memory normalize, raw/OTP không disk/server/log/model; source signing/version/parser catalog và immutable binding. OS notification key không reliable bank transaction key; uncertain evidence→Review.
3. Room payload AES256GCM với scoped vault/Keystore, tám bảng **local**; nonce reservation/clock/retention/crash fences theo [storage](../../android/local-storage.md). Không claim full database encryption/root-proof/physical delete khi máy tắt.
4. WorkManager scoped uploader, durable immutable ACK pairing/journal và ARCH09 retry; no UI-open dependency/exact timing guarantee. Offline revoke pending hiển thị trung thực. Scope A không chuyển sang B, restore missing receipt không auto repost.
5. Native auth giữ ARCH06: installation/collector keys riêng, native owner proof/refresh vs background collector renewal; no tokens/private keys/raw notification to JS. Same-origin XSS còn có thể gọi normal owner capabilities; high-risk cần fresh server reauth/native confirmation bound exact input.
6. Bridge2 là protocol nội bộ riêng API004; giữ bảy methods cũ qua future adapter, rich status separate strict legacy schema, typed operation allowlist/managed identity handlers. Backend API004153operations634schemas/DB00587tables1001cols giữ nguyên hashes.
7. Signed APK update stable identity/version/schema, không destructive Room migration; release fail closed thiếu real appId/origin/cert/source/device proof. Free-first local synthetic build; optional limited distribution account phù hợp≤20devices theo điều kiện hiện hành, không hứa free broad commercial distribution. Không đăng ký/publish/pay trong task.
8. UI-M01…06 cập nhật specification; status native_pending. [32 runtime cases](../../android/acceptance-plan.md) NOT RUN; schema/static/model checks chỉ artifact validation.

## Consequences và remaining gates

Có hồ sơ để xây Android native song song backend synthetic sau các architecture reviews. Exact device/source/parser/verified domain/signing/distribution account là gate release/PoC thật, không cắt feature hoặc blocker cho mock code. ARCH11 chốt providers/licensing/sample profiles; ARCH12 Agent; ARCH13 operations. [Bundle](../../android/implementation-bundle.json), [change report](../ARCH-10-change-report.md), [official sources](../../android/research-sources.json) giữ revision/hash và giới hạn bằng chứng.
