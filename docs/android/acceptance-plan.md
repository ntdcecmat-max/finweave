# Android acceptance plan — all runtime NOT RUN

32 refinements AND-01…32 / executable acceptance intentions ANDR-01…32; existing41 parent AC và21 backlog groups giữ nguyên. JSON schema/model/static PASS chỉ chứng minh artifact có shape/liên kết/luật thiết kế, không chứng minh Android, cryptography, privacy, OS/OEM support hoặc backend. [Traceability](requirement-traceability.json).

| Case | Kiểm thực tế | Evidence |
| --- | --- | --- |
| ANDR-01 — NOT RUN | Build/toolchain pin and APK signature verify | Signed APK, package/certificate/hash/manifest/supply-chain scan |
| ANDR-02 — NOT RUN | Bridge2 handshake/legacy strict status/browser absence | Actual Capacitor registration and mismatch/manual behavior |
| ANDR-03 — NOT RUN | OS access grant/deny/revoke/resume | System settings plus listener bound timestamps, no return=grant |
| ANDR-04 — NOT RUN | Own POST_NOTIFICATIONS denied independent access | Distinct permissions/health warning |
| ANDR-05 — NOT RUN | Sideload restricted settings supported OS flow | No bypass; exact country/install source/build |
| ANDR-06 — NOT RUN | Source signer/version/catalog filter | Forged package/signature/unsupported app rejected |
| ANDR-07 — NOT RUN | Consent update/revoke and capture fence | Old literal cannot silently accept new consent |
| ANDR-08 — NOT RUN | Multi-account bindings/version/ambiguous Review | No first-account fallback or old-item retag |
| ANDR-09 — NOT RUN | Callback duplicate/update/remove/repost identity | OS key reuse and weak semantic match remain Review |
| ANDR-10 — NOT RUN | OTP/group-summary/redacted/unknown privacy | Disk/network/log/heap scope evidence; no raw persisted |
| ANDR-11 — NOT RUN | Main-thread bound/channel overflow/oversize | Capture latency and explicit pause/gap, no truncation posting |
| ANDR-12 — NOT RUN | Room crash/IO/full/transaction integrity | Before/after commit kills, WAL encrypted finance scan |
| ANDR-13 — NOT RUN | AES-GCM nonce/AAD/bitflip/cross-vault | Nonce allocation crash/rollback; crypto library/Android vectors |
| ANDR-14 — NOT RUN | Keystore AFU screen-off/first-unlock/invalidation | Background key usable after unlock; no DirectBoot finance |
| ANDR-15 — NOT RUN | Native ES256/JCS/SPKI cross-runtime proof | Android DER↔raw64 Node verify; nonce/time/body/audience negative |
| ANDR-16 — NOT RUN | Owner refresh race/lost-reply/reuse | Mutex durable exact replay5min wrong-reuse revoke |
| ANDR-17 — NOT RUN | Collector renewal and30d authorization | 24h renewal no owner refresh; expired ref≤7d only renewal |
| ANDR-18 — NOT RUN | Offline outbox/network recovery/WorkManager | UI closed/restart, scoped one uploader; delays measured |
| ANDR-19 — NOT RUN | Doze/OEM/force-stop/reboot gaps | Android13–16 plus compatibility24/29/32 candidate matrix |
| ANDR-20 — NOT RUN | Batch50/256KiB/413/retryAfter | Actual UTF8 envelope bytes; identities immutable on split |
| ANDR-21 — NOT RUN | ACK mixed202/all422/lost/mismatch/reordering | Room exact ACK journal atomic; no false posted |
| ANDR-22 — NOT RUN | Pending caps/7d+quarantine7d/ACK replay caps | No pending silent eviction; explicit gap after journal eviction |
| ANDR-23 — NOT RUN | Clock rollback/rebootoffline/deadline access | Upper-age bound, no decrypt/upload expired, cleanup overdue honest |
| ANDR-24 — NOT RUN | Logout offline/revoke pending/late ACK | Old scope held, no claim remote revoked until response |
| ANDR-25 — NOT RUN | Owner A→B and same-owner revoked epoch | Other vault inaccessible, no delete/retag/replay |
| ANDR-26 — NOT RUN | Server restore witness/epoch/reconcile missing | New credentials; missing receipt investigation not auto ingest |
| ANDR-27 — NOT RUN | Backup/D2D/clone/reinstall/key missing | Inspect all DB/WAL/WorkData/keys backup; new installation |
| ANDR-28 — NOT RUN | WebView navigation/frame/XSS/bridge capabilities | No generic signing/fetch, fresh native confirmation binds input |
| ANDR-29 — NOT RUN | Same-key APK upgrade/Room migration/failure | Preserve pending journal; wrong signer/version fails/no destructive path |
| ANDR-30 — NOT RUN | Download authenticity/distribution eligibility | Real artifact metadata+fingerprint; optional free20-device enrollment |
| ANDR-31 — NOT RUN | TalkBack/text scale/keyboard/back/insets | 48dp, cancel/draft safe, Android system UI verified |
| ANDR-32 — NOT RUN | End-to-end phone→API→ledger→web/Plan–Goals | Actual integration+owner UAT, no Agent actual authority |

Evidence mỗi case: source/lock/toolchain/native/API/schema hashes, appId/cert/APK hash, device/model/OS/security patch/WebView/source-app/parser, preconditions/setup/synthetic-vs-consented-real marker, timed observations, expected/actual, privacy-redacted logs/capture, result/failure/caveat. Không đưa notification raw/OTP/private keys/tokens vào evidence. Không yêu cầu owner thực hiện chuyển tiền thật để “test”; synthetic notification test app riêng và permitted prior samples được ARCH11 quản lý. REAL end-to-end chỉ sau security/auth/restore/server/source gates, owner UAT riêng.

Thứ tự triển khai PoC: registration+signed debug-free synthetic APK/OS access → Keystore/Room/proof interoperability → offline ACK/epochs/clock faults → signed upgrade/backup/D2D → OEM/source integration → actual phone/web ledger + UAT. Nếu platform/source không đủ dữ liệu, giữ full features qua manual/CSV và báo collector gap, cập nhật ADR thay vì invent notification capabilities. Test signatures/schema/money-domain code thật không viết trong giai đoạn documentation này.
