> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

# Thử nghiệm kỹ thuật rủi ro cần làm sớm

**Runtime addendum 09/10/2026:** [Kết quả local/synthetic, ma trận rủi ro và gates](../execution/local-spikes-2026-10-09.md):13nhóm local và97ca PostgreSQL đã chạy. Các trạng thái NOT RUN của design bên dưới là lịch sử; không suy ra toàn spike/device/model/source/restore REAL đã đạt.

SPIKE-001 · 08/10/2026 · tất cả **SPECIFIED / NOT RUN**. Kiểm giả định kiến trúc, không dùng PoC để bỏ feature. AI chuẩn bị/chạy/điều tra/sửa trong phạm vi được giao. Thiếu device/credentials/quyền/ngân sách ghi rõ; không nhận mock thành real proof.

| ID | Thử nghiệm cụ thể | Điều kiện đạt / evidence | Phụ thuộc và thời điểm |
| --- | --- | --- | --- |
| SP-01 APK/bridge | APK ký thử, cài/update điện thoại thật; bundled UI→native→OS settings | Version/signing/device logs; cài/update không mất synthetic data; bridge không giả success | ARCH-10; sớm song song backend |
| SP-02 Notification | App phát thông báo giả; grant/deny/revoke/regrant; allowlist/OTP filtering/revisions | Expected/captured matrix; chỉ dữ liệu tối thiểu được consent; quay lại OS không tự coi granted | ARCH-10/11; trước parser thật |
| SP-03 Native persistence | Offline/screen-off/kill/restart/reboot/logout/switch/revoke; partial ACK/retry | Queue bền trong điều kiện hỗ trợ, same IDs; không cross-owner; force-stop/OEM limitations rõ | ARCH-09/10; trước claim background collection |
| SP-04 Parser ngân hàng/ví | Nguồn owner chọn: incoming/outgoing/refund/transfer/update/thiếu ref/trùng amount/multi-account | Mẫu độc lập có quyền, precision/coverage; ambiguous→Review; package/version/OS; không cloud raw/OTP | ARCH-11; real sample cần quyền/bảo vệ dữ liệu |
| SP-05 Stock source | Entitlement/credentials/quota/cache/redistribution; catalogue/invalid ticker/holiday/429/missing | Quyền có bằng chứng; đúng mã/time/currency; last-good; thiếu quyền→BLOCKED_SOURCE, không scrape thay | ARCH-03/11; trước live adapter |
| SP-06 Gold source | Product/brand/purity/region/buy-sell/chỉ-lượng/time và quyền automation | Không trộn nhẫn/SJC/buy-sell; unit/rounding oracle; unsupported rõ | ARCH-04/08/11; trước giá thật |
| SP-07 Scheduler | Daily/manual, sleep/cold start/client tắt/duplicate wake/crash/lease/quota; đo ít nhất7 ngày khi có môi trường | Queue/catch-up không mất/trùng; đo overdue/latency/cost; free không đạt thì đề xuất thay | ARCH-03/09; synthetic trước, trước claim daily |
| SP-08 DB/concurrency | Migrations/roles/triggers/RLS/negative fixtures; parallel posting/refund/allocation/confirm/lost ACK | SQL chạy được, deny đúng, atomic rollback; không over-refund/over-allocation/double effect; oracle độc lập | ARCH-04/08; database trước mở rộng module |
| SP-09 Auth topology | Cookie/CORS/CSRF ở topology dự kiến; native enrollment/token; expiry/revoke/cross-role/object | Browser hoạt động thực; deny cross-workspace/admin→finance; không login mock thay proof | ARCH-03/05/06; trước tích hợp diện rộng |
| SP-10 T1 security/trust | Trusted backend→DB/storage/backup; tenant/admin/device roles, secrets/key access, logs/DTO egress, unauthorized config/release changes | Negative tests deny app-admin/tenant leaks; redaction/encryption/key-access/backup audit evidence. Root/DBA có khả năng đọc finance là giới hạn T1; anti-Ops attestation PoC không bắt buộc | ARCH-07; theo [ADR-008](../architecture/adr/ADR-008-modular-backend-trusted-server.md), trước real data; không chi phí tự động |
| SP-11 Recovery T1 | Mất/revoke thiết bị, identity reset/device enrollment tách data restore; server-managed key/backup recovery, old receipts/deletion journal | Restore đúng quyền/versions/replay/deletion; app-admin không bypass/impersonate; đo RPO/RTO; recovery design cần chốt, offline owner key là alternative | ARCH-04/06/07/13; trước dữ liệu thật |
| SP-12 Model/Agent | Pin model/runtime;30 public challenge cases + fresh restricted held-out instances theo ARCH12: clarify/multi-goal/infeasible/investigate/replan/missing/stale | Rubric/tool accuracy/latency/resources/cost;8calls/60s active/2clarification theo spec; không scripted answers giả model | ARCH-12; synthetic trước chọn model |
| SP-13 Agent authority | Injection từ prompt/source, tool denial/cancel/stale/expired preview/concurrent/repeated confirm | Không SQL/network/ledger tùy ý; không tự confirm; atomic Plan/Goal, actual unchanged; manual fallback | ARCH-06/08/12; trước bật Agent thật |
| SP-14 Adapters | V1/prototype/admin/native→v2; null/decimal/time/paging/errors/replay | Request/reply thật qua adapter+validator; không fabricated fields; tests giữ nghĩa; thiếu API phải bổ sung | ARCH-05; trước tích hợp diện rộng |
| SP-15 Ops/cost/load | Nhiều workspace/jobs/holdings, DB growth/backpressure/log redaction/backup/quota | Đo tải/cost; không suy SLO từ fixture nhỏ; dừng an toàn; không log finance/secrets | ARCH-03/09/13; trước pilot/release |

Mỗi kết quả ghi giả thuyết, source/contracts/environment/device/model/provider version, quyền, dataset, script/lệnh, expected–actual, sanitized raw logs, failed attempts, PASS/FAIL/BLOCKED và thay đổi kiến trúc cần làm. FAIL→sửa thiết kế/thử lại, không bỏ feature; PoC đơn lẻ không chứng nhận toàn hệ thống.

SP-01/02/08/14 có thể chuẩn bị local synthetic sớm; SP-03/09/12/13 cần nền/runtime/thiết bị; SP-04/05/06 phụ thuộc nguồn có quyền. SP-10/11 cần làm rõ kiến trúc sớm và đạt trước dữ liệu thật. SP-07/15 cần môi trường và thời gian đo. Thiếu câu trả lời về budget/provider không phải cấp quyền. Tài liệu này chưa thực thi SQL/backend/PoC, tải model, thu notification thật hay tạo dịch vụ.

[Agenda kiến trúc](../architecture/architecture-decision-agenda.md) · [Backlog đầy đủ](../product/backend-backlog.md).

## ARCH-06 — Identity spikes bắt buộc (NOT RUN)

| Spike | Việc phải thử / evidence | Gate |
| --- | --- | --- |
| SPIKE-AUTH-01 | Argon2id64MiB/t3/p4 known vectors, ARM64 latency/RAM/concurrency2/DoS bound | Pin hash package/params |
| SPIKE-AUTH-02 | Android Keystore SPKI/P-256/DER→raw ES256 ↔Node, native bridge secret isolation | Native login/enrollment/renewal |
| SPIKE-AUTH-03 | HTTPS host-cookie/CSRF/Origin, owner/admin session isolation, idle/absolute | Browser real auth |
| SPIKE-AUTH-04 | PG locks: refresh lostresponse/reuse, collector rotation, nonce atomicity, TOTP time-step race | Credentials implementation |
| SPIKE-AUTH-05 | Synthetic mail sink failure/expired challenge; later real mail delivery/quota/privacy/domain checks | AUTH-MAIL-REAL |
| SPIKE-AUTH-06 | Epoch revoke/password reset/backup restore + independent checkpoint; old auth replay never resurrect | SEC-REAL-T1/restore |

[AUTH-01…30 detailed cases](../security/identity/acceptance-plan.md). Chưa benchmark/call vendor hoặc implement trong ARCH-06.

## ARCH-07 — Thử nghiệm bảo mật (ALL NOT RUN)

| ID | Nội dung thử cụ thể | Bằng chứng/gate |
| --- | --- | --- |
| SPIKE-SEC-01 | PostgreSQL roles/RLS, SET LOCAL và reset pool, workspace bị chặn, SECURITY DEFINER hẹp | Cách ly tenant/Ops/profile; không recursion hoặc rò scope |
| SPIKE-SEC-02 | Mount LUKS2, mở khóa thủ công, quyền secret files, swap/core/temp và sentinel trong logs | Bằng chứng storage, secret custody và redaction |
| SPIKE-SEC-03 | pg_dump đủ tenant và nhất quán → repository ngoài host chỉ append → restore sạch được phép | Quyền backup/prune; thời gian và dung lượng thực tế |
| SPIKE-SEC-04 | Ed25519/JCS, witness fsync/retry/hash chain/head gắn nonce; crash và publication sai thứ tự epoch | Không ACK sớm; deny mới nhất có hiệu lực trước đọc finance |
| SPIKE-SEC-05 | Snapshot gián đoạn hoặc timestamp giả, hard age 34 ngày, prune thực; xóa parent/child | Không báo xóa trong 35 ngày khi chưa kiểm mọi bản sao |
| SPIKE-SEC-06 | Mất VM/khóa/capsule, witness offline, host cũ còn chạy, mật khẩu cũ trong backup | LOCKED khi thiếu bằng chứng; không hồi sinh quyền/dữ liệu |
| SPIKE-SEC-07 | SSRF/DNS/redirect, prompt injection, raw bank/OTP, admin DTO và telemetry sentinel | SEC-REAL-T1 và giới hạn privacy |

[32 ca nghiệm thu bảo mật](../security/t1/acceptance-plan.md) định nghĩa expected results. PASS kiểm tra artifact không thay thế thực thi các thử nghiệm này.

## ARCH-08 — Engine/forecast spikes (ALL NOT RUN)

| ID | Thử nghiệm cần thực hiện | Evidence |
| --- | --- | --- |
| SPIKE-DOM-01 | Production TypeScript Engine vs independent integer/Fraction vectors; precision/scale/half-up/overflow and no Number coercion | Source/package/runtime pin; actual expected vs observed |
| SPIKE-DOM-02 | PostgreSQL posting seal/opening/refund/transfer/correction/quantity history; rawSQL bypass attempts | Constraints/rollback/immutable history; minimum2connections |
| SPIKE-DOM-03 | Concurrent allocations/refunds/actual links/owner confirm; deadlock/serialization/response-loss faults | Lock order/replay/no partial or duplicate effect |
| SPIKE-DOM-04 | REPEATABLE READ snapshot/history/quote FX cutoff/cache races and erasure gates | No mixed version/future quote/crossscope finance |
| SPIKE-DOM-05 | Zero-vol analytic paths, keyed RNG known vectors, chartpoint invariance, stress once, common-random counterfactual, due/missing/pastdue | Determinism/tolerance/quality; no calibration claim |
| SPIKE-DOM-06 | Long-horizon/1000trials/accounts/Goals on target ARM64; checkpoints/lease/cancel/revoke/crash and paging sizes | CPU/RAM/latency/admission budgets, no silent fidelity loss |

[30 runtime cases](../domain/acceptance-plan.md), [API003](../contracts/v2-t1-r3/README.md), [DB004](../data/target-t1-domain/README.md). Golden oracle PASS không thay những spikes này; không provision/call provider/model trong ARCH-08.

## ARCH-09 — SPIKE-ASY-01…06 — ALL NOT RUN

(01)≥2DB connections claim/fence/reaper/revoke/commit-loss; (02)shared quotas/cooldown/scheduler catch-up/restore; (03)native count/bytes/retention/ACK/device epoch/OS kill; (04)atomic import/pins/CSV parser+coverage cursors>100records; (05)Agent cumulative budget/unknown tool result/clarification; (06)largest forecast pool/checkpoint/memory/heartbeat/cancel/ARM64. Record exact runtime/hardware/fault points; mocks không real proof.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Early Android spikes: signed synthetic APK+listener permission; Keystore/ES256-JCS cross-runtime; Room crash/clock/offline ACK and owner fences; upgrade/backup/D2D; OEM/source behavior. See32 runtime cases/evidence rules.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Source PoC: local synthetic listener→receipt, owner-selected app/device finality/multi-account, authorized SSI scale/time/paging/quota, authorized gold unit/profile/time, rights/history/model/backup + restore. Chưa gọi provider hay dùng dữ liệu thật.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Agent PoC: structured decision/tiếngViệt/hardware cold-warm, grounding+injection+source rights, draft replay/action budget/cancel/answer CAS, UTCdaily quota/concurrency/restore, API005/native003, A/B/C benefit + heldout. All NOT RUN.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

OPS-SP01…10 ghi chi tiết rủi ro, đầu vào và bằng chứng. Làm DB local trước; chuẩn bị native/auth/model/source độc lập khi có thể.30 ca Agent công khai và held-out mới theo ARCH12 là hai tập khác nhau.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
