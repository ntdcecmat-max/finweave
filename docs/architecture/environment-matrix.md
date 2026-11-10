> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

# Environment matrix — I0 + I1

ARC-ENV-001 · 08/10/2026 · **ACCEPTED DESIGN / NOT PROVISIONED**. Theo [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [topology](deployment-topology.md), [cost](../product/cost-model.md).

| Thuộc tính | LOCAL-SYNTHETIC — I0 | STAGING-SYNTHETIC — I1 | REAL-T1 — I1 có điều kiện |
| --- | --- | --- | --- |
| Mục đích | Xây đầy đủ backend, SQL/domain/concurrency, adapters và native integration | Kiểm deploy/HTTPS/auth/schedule/restore/APK end-to-end | Sử dụng thật sau gates, chưa được bật |
| Host | Máy sẵn có; localhost/LAN test | Oracle Always Free VM nếu được cấp đúng quota | VM đủ điều kiện đã kiểm; không hứa uptime/HA |
| Dữ liệu | Fixtures/synthetic accounts | Synthetic riêng; không clone real | Owner consent và provider entitlement; không trộn synthetic |
| Process | user-api, ops-api, worker profiles, migrate tách bootstrap | Container/process P2, secrets/DB roles riêng | Cùng topology được kiểm; signed/versioned release |
| PostgreSQL | DB test disposable hoặc volume local riêng | Persistent volume, private network | Volume/keys/backup riêng; schema upgrade đã rehearsal |
| Scheduler | Chỉ khi máy bật; kiểm clock/catch-up | Host timer enqueue, worker chạy | Durable scheduling/catch-up; theo dõi overdue/freshness |
| Web/Admin | Hai builds và origin test | Hai origins HTTPS, proxy API tương ứng | Hostnames đã xác minh; auth/MFA/CSRF/Origin controls |
| Android | Local API chỉ trong test; không tắt TLS policy release | Application ID/config test; signed test APK, test enrollment | API real, signing continuity, device/token revoke đã kiểm |
| Model/sources | Scripted/mocked hoặc PoC đã được phép | Synthetic input, provider calls chỉ khi đã chọn/quyền phù hợp | Provider/model có privacy/license/quota/eval; chưa chọn |
| Secrets | Test secrets, không dùng key real | Scope riêng từng process/environment | Real secrets/key custody và recovery, không copy về staging |
| Backup/restore | Export mã hóa ra vị trí khác, restore DB test | Off-host backup và restore sạch; đo RPO/RTO | Off-host destination và alert độc lập có evidence, deletion replay |
| Trạng thái | Hướng được chọn; backend/DB chưa thực thi | Hướng được chọn; chưa có tài khoản/VM/hostname được kiểm | **NOT READY / SEC-REAL-T1 NOT RUN** |

Các environments dùng cùng source/image version và schema migration chain tương thích; không dùng cùng secrets/session keys hoặc DB roles. LOCAL DB disposable có scope rõ; tuyệt đối không để lệnh reset test kết nối REAL.

Nếu tiết kiệm bằng chung host, vẫn tách DB/roles/volumes/network/resource limits; điều đó không tạo host-level isolation. Khi có REAL, ưu tiên staging ở I0 hoặc host khác. Không chạy load/destructive test trên host real. Chuyển từ staging sang real cần export/redeploy/configure và kiểm môi trường sạch; không đổi environment flag rồi tiếp nhận dữ liệu thật vào DB demo.

## Hợp đồng cấu hình

Các nhóm cấu hình cần triển khai: environment identity; public user/admin/API URLs; allowed origins/cookie settings; server-only connection strings theo role; worker profile/concurrency/pool budget; scheduler timezone/cadence; provider/model allowlist/budgets; backup destination/retention/key reference; APK API URL/application ID/release channel; telemetry redaction. Chưa đặt tên env vars cố định hoặc chứa secret values trong tài liệu.

API URL/client environment là công khai; DB/provider/model/signing credentials là secrets. Health endpoints chỉ metadata; readiness kiểm dependency phù hợp và không lộ connection strings. Release pipeline phải phát hiện frontend/APK trỏ nhầm environment và migration artifact lệch version trước deploy.

## Điều kiện cloud pilot và real

Cloud synthetic cần quota thực, image ARM64, DNS/TLS, P2 capability/role tests, SQL execution, network/APK và off-host restore có kết quả. Nếu chưa có backup destination luôn sẵn sàng, không nhận backup schedule PASS. Mục tiêu RPO24h/RTO1ngày chưa đo.

REAL cần thêm SEC-REAL-T1, UAT/native matrix, nguồn giá/notification parser và Agent thật được nghiệm thu theo scope đầy đủ; owner data consent và provider rights có bằng chứng. Environment matrix không cấp quyền deploy hoặc chi tiền.

## ARCH-06 — Auth environment gate

I0 synthetic dùng `.test`/mail sink/TOTP fixtures và loopback test cookies riêng; không seed123456 ở real profile. I1 vẫn synthetic cho tới SEC-REAL-T1/AUTH-MAIL-REAL. Real mail provider/quota/domain/TLS/delivery/secret custody chưa chọn/kiểm; không free email guarantee hoặc paid fallback. Production-cookie Secure/__Host không hạ security cho LAN, native tokens/seed không vào WebView/frontend bundle.

## ARCH-07 — Điều kiện bảo mật theo môi trường

I0 và I1 dùng dữ liệu synthetic cho tới khi các gate thực tế đạt. Witness chạy cùng máy chỉ phục vụ kiểm thử protocol, không chứng minh tính độc lập ngoài host. Không dùng secrets, notification hoặc tài chính thật để thử backup/restore.

Môi trường real cần storage mã hóa và quy trình mở khóa, secret files đúng process, repository ngoài host với quyền append/prune tách biệt, witness độc lập có head mới nhất, mạng/egress theo allowlist và cảnh báo ngoài VM. Destination, quota, tool versions, quyền truy cập, thời gian backup/prune/restore đều cần bằng chứng; chưa provision trong ARCH-07.

## ARCH-08 — Engine/forecast environment checks

I0/I1 vẫn synthetic. Freeze Engine/model/runtime versions, controlled clock/seed, API003/DB004/security overlay hashes. Golden oracle chạy bằng independent calculator không phải production Engine và không chứng minh Linux ARM64 numerical/performance conformance. Forecast chunks cần separate compute capability/process theo P2; không thêm queue ngoài J2.

CPU/RAM/admission/chunk budgets chưa đo; không giữ Node event loop bị blocked rồi claim async đủ. ARCH-09 phải chốt compute isolation/heartbeat/checkpoint strategy dựa benchmark. Không dùng finance thật hoặc cloud/mode paid để thử tải khi chưa được phép.

## ARCH-09 — Async environment gate

Local synthetic dùng fake adapters/clock để test faults; I1 conditional không có quota/availability proof. Real egress/native uploads phải qua AUTH/SEC/provider/native gates. Các timings/capacity trong registry là initial config, không SLO đã đạt.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

SYNTHETIC có namespace/key/endpoints riêng; REAL appId/origin/cert/source/device evidence chưa có, build fail closed. No secrets/admin/service credentials in APK.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

I0 synthetic không calls; REAL source cần access/rights/quota/units/basis/time/retention/native PoC evidence. Không auto production fallback khi SSI UAT chưa available; account/key/endpoint chưa provision.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Scripted/deterministic baseline riêng local_model/hosted_model output modes. Missing model/runtime/artifact pins/eval/egress rights→model disabled. API005/bridge003 design only, no deployment/account/weights download.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Local/staging synthetic và REAL dùng DB/roles/keys/origins/namespaces/channels riêng. Thiếu mount/secret/schema/recovery gate thì dừng. Không clone dữ liệu thật vào test hoặc tự bật nguồn/model/chi phí.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](ARCH-13-change-report.md).
