> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

# FinWeave — Thiết kế bảo vệ dữ liệu T1 v2.0

09/10/2026 · **ARCH-07 ACCEPTED DESIGN theo ủy quyền tiếp tục; SEC-REAL-T1 NOT RUN**. T1 đã được owner chọn tại [ADR-008](../architecture/adr/ADR-008-modular-backend-trusted-server.md); [ADR-014](../architecture/adr/ADR-014-t1-data-protection-and-recovery-witness.md) chốt controls/recovery. [Security pack hiện hành](t1/README.md), [identity ARCH-06](identity/identity-access-design.md), [security bundle/hash](t1/implementation-bundle.json).

## Trust và authority

Backend/runtime/root/DBA/cloud host/backup/key custodians có khả năng đọc plaintext theo T1. App-admin khác infrastructure operator, không được đọc finance/impersonate/reset owner. Tenant/workspace/object/device authorization, P2 process/pool/grants và Agent draft-only vẫn bắt buộc. RLS/encryption/masking không chống chính root được tin hoặc tự cô lập một compromised owner API; residual risks ghi ở [threat model](t1/threat-model.md).

## Hồ sơ có thể bàn giao

| Nhóm | Specification hiện hành | Trạng thái |
| --- | --- | --- |
| Authentication/permissions | [Identity](identity/identity-access-design.md), API002, 147 operations, owner/admin/native/collector/service authorities riêng | Design accepted; implementation/crypto/mail/native NOT RUN |
| Data isolation/network/provider/model | [Isolation/egress](t1/isolation-and-egress.md), [table classification](t1/table-data-classification.csv) | Grants/network/egress controls NOT RUN |
| Secrets/keys/storage | [Custody/rotation](t1/keys-and-secrets.md), [20 nhóm khóa](t1/key-inventory.csv) | Chưa cấp khóa hoặc volume thực tế |
| Logs/privacy/retention | [Policy](t1/logging-and-retention.md), allowlist/no private bodies/SQL params/metrics labels | Runtime sinks/expiry/purge NOT RUN |
| Backup/restore/erasure | [Runbook](t1/backup-restore-erasure.md), signed independent deny witness, restore giữ LOCKED cho tới khi đủ điều kiện | Repository/witness/restore/prune NOT RUN |
| Storage and deployment contract | [Schema bảo mật đích](../data/target-t1-security/README.md), [API/storage addendum](t1/contract-storage-delta.md) | 84 bảng / 960 cột thiết kế; chưa có migration chạy được; API wire giữ nguyên |
| Verification | [SEC-01…32](t1/acceptance-plan.md), [AUTH-01…30](identity/acceptance-plan.md) | All runtime NOT RUN; static evidence separate |

Bank/wallet raw notification/OTP/extras không gửi server/LLM/logs; native memory filtering rồi discard. FinWeave's own verification/reset/TOTP code chỉ đúng auth/mail purpose, không logs/LLM. Normalized financial evidence, CSV/Plan–Goals/chat/tools private trong owner+backend được tin scope; external inference mặc định deny và cần ARCH-12 privacy/eval. Giá public/redistribution chỉ khi nguồn/license cho phép.

## Những điểm chốt mới và giới hạn

Secret files riêng theo process nằm trên storage mã hóa; không thêm paid KMS/Vault cluster. Dữ liệu tài chính vẫn là bản ghi PostgreSQL có cấu trúc. Export nhất quán được lưu vào repository restic mã hóa ngoài host, với quyền upload/prune tách biệt và recovery capsule mã hóa bằng age. Endpoint, versions, capacity và thử nghiệm khôi phục chưa có, nên chưa thể cam kết miễn phí hoặc sẵn sàng chạy thật.

Lịch giữ 7 bản ngày / 4 bản tuần nằm trong tuổi snapshot tối đa 34 ngày, sau đó prune dữ liệu không tham chiếu trong 24 giờ. Deadline xóa mọi bản sao do server kiểm soát là 35 ngày từ yêu cầu gốc, không trượt khi retry và không tự hoàn thành chỉ vì đã hết thời gian.

Witness ngoài host/DB lưu metadata thu hồi/xóa tối thiểu. Chặn local trước; chỉ xác nhận hoàn tất an toàn cho recovery sau durable receipt. Restore phải chặn host cũ, kiểm head/chain mới nhất, áp dụng deny trước đọc tài chính và vô hiệu hóa credentials cũ. Owner cần reset mật khẩu mới; admin provision lại factors. Thiếu witness hoặc mapping/khóa thì giữ LOCKED. T1 không cam kết HA, zero loss hay xóa riêng một owner tức thì khỏi mọi backup bằng crypto.

**SEC-REAL-T1** chỉ đạt sau bằng chứng thực thi tenant/admin/device/auth, secrets, logs, encryption, backup, key access, replay, restore, xóa và privacy. Native/source/Agent/domain/UAT là các gate riêng. Kiểm tra artifact hoặc frontend mock PASS không thay thế chúng. Tài liệu không bật dữ liệu thật, cloud, provider hoặc model thật.

API002, r1/r2 và các gói physical/D1J2/auth cùng evidence trước giữ nguyên. Security pack/policy/ADR-014 là đặc tả hiện hành cho bảo vệ dữ liệu và recovery; ARCH-06 tiếp tục quy định cơ chế auth, có các bổ sung cụ thể từ ARCH-07. [Bản master trước ARCH-07](../execution/evidence/arch-07-t1-security-2026-10-09/security-design-before-arch07.md) được giữ để review.

## ARCH-08 — Binding tiếp nối cho domain/forecast

Security policy FW-SEC-T1-001 giữ binding lịch sử002/003; [Engine bundle](../domain/implementation-bundle.json) có securityBindingAddendum pin API003/DB004 cùng [151-operation overlay](../domain/operation-security-overlay.csv), [permissions](../domain/operation-permissions.csv) và [86-table classification](../domain/table-data-classification.csv). Không giả base policy hash đã đổi.

ForecastWorker compute-only theo exact service profile, không Agent/ingestion/owner credentials. Forecast inputs/checkpoints/results là finance_private, admin chỉ aggregate health; logs/egress/backup/erasure/locked restore theo ARCH-07. Source snapshot/history pin không cấp quyền sau revoke. Security/grants/crypto/worker/restore vẫn NOT RUN.

## ARCH-09 — Async security binding

Base ARCH-07 policy/bundle giữ hash lịch sử. ARCH-09 addendum pin API004/DB005 và matrix153/classification87; narrow MarketQuota broker, no direct Ops finance/coverage/quota namespace read. Current consent/revoke/erase/epoch kiểm tại intake, claim và finalize. Witness restore gate và secret custody không đổi; chưa security runtime PASS.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Payload-level encryption not full encrypted Room; non-sensitive local metadata visible. Hardware Keystore backing must measure; AFU background key no per-use biometric, server reauth separate. No root-proof/E2EE/anti-Ops claim.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

T1 giữ nguyên. Source egress default deny, read-only secrets, shared-key quota, no raw/error-body log. Rights/history/backup/LLM use-specific; native signature không bank proof. Private refs không app-admin.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

No raw/OTP/credentials/accountRef/transactionRef/thinking/model free factual-money output. Nested auth/per-intent caps, injection cannot grant tools, current epochs checked per action. Model service private/no DB/upstream keys, no arbitrary HTTP/trade/confirm.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

T1 custody và deny protocol giữ nguyên. Secret mount không thay KMS; CI ngoài finance host, app/Ops không có Docker socket. Restore cần fresh witness, fence writer cũ, reset credentials; purge34d+24h và erase35d phải thực sự xóa.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
