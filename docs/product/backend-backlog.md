> **Implementation 11/10/2026:** [BE14/15 local](../execution/backend-assistant-local-2026-10-11.md) bổ sung 23 owner operations, deterministic Agent và 18 nhóm PostgreSQL PASS. [APK pilot](../../artifacts/android/README.md) đã build/ký, chưa collector hoặc device test. Giữ đủ 21 BE/41 AC; model/evals/adapters/Ops/production/UAT còn mở.

> **Local business implementation — 10/10/2026:** BE-05/09/10/11/12/13 có API/database và workers PostgreSQL thực thi, với immutable snapshots, atomic CSV, Review resolutions, Plan/Goal funding và frozen simulation/forecast. [Evidence](../execution/backend-business-local-2026-10-10.md), [contract FW-BUSINESS-001](../contracts/local-business/README.md), [mapping đủ41 AC](../execution/backend-business-ac41.csv). Đây là local API/database tested; UI/native/Agent/provider/UAT và các BE khác giữ scope riêng. Các notice NOT RUN bên dưới là lịch sử thiết kế, không phủ định evidence runtime mới.

> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-06 current target08/10/2026:** [identity protocol](../security/identity/identity-access-design.md), [API FW-API-T1-D1J2-002](../contracts/v2-t1-r2/README.md), [auth DB expand](../data/target-t1-auth/README.md).147operations/82tables là target design, không implementation. Revision001 và baselines giữ nguyên; auth follow-up06 đã có spec, runtime/SQL/native/mail/security NOT RUN. Notes ARCH-05 bên dưới là revision001 reference khi mâu thuẫn identity002.

> **Local implementation — 09/10/2026:** [FW-BE-FOUNDATION-001](../execution/backend-foundation-2026-10-09.md) thêm runner/DDL guards/Engine exact kernel và kiểm PostgreSQL thực. Đây là tiến độ nền BE02/04/18/21, chưa đủ hoàn tất bất kỳ gói đầy đủ hoặc parent AC nào. Mọi21 gói bên dưới vẫn REQUIRED; API005/DB005/native003 giữ nguyên. [Addendum](../data/local-foundation/README.md) ghi các sửa thiết kế triển khai, không ghi đè history/bundle.

# Backlog backend và tích hợp — toàn bộ chức năng đã chọn

BE-BL-001 · 08/10/2026 · **SPECIFIED / IMPLEMENTATION NOT RUN**. Tất cả gói REQUIRED; không cắt MVP, không dùng priority để bỏ feature. AI chịu trách nhiệm thiết kế/code/test/điều tra/sửa; owner đưa ý tưởng, phản hồi và quyết định thay yêu cầu/quyền/ngân sách. Dependency chỉ quyết định thứ tự triển khai.

Nguồn: [catalogue](../design/interface-catalogue.md), [SRS](../requirements/srs.md), [AI-SPEC](ai-agent-specification.md), [API đích](../contracts/v2/openapi.json), [consumer mapping](../contracts/v2/consumer-operation-mapping.csv), [r1](../governance/baselines/FW-HANDOVER-20261008-r1/README.md), [r2](../governance/baselines/FW-HANDOVER-20261008-r2/README.md).

| ID | Phải triển khai đầy đủ | Phụ thuộc chính | Bằng chứng hoàn tất |
| --- | --- | --- | --- |
| BE-01 | Identity/registration/challenge/reset, session/renew/revoke/logout, workspace/membership/object authorization | Kiến trúc identity/trust; DB | Deny cross-user/workspace/object; revoke hiệu lực; recovery tài khoản/device/data được tách quyền theo T1; app-admin không bypass hoặc impersonate |
| BE-02 | Runtime v2, strict DTO/errors, preview/version/idempotency/transaction và validation | DB; BE-01 | Contract tests; replay đúng; key khác payload bị từ chối; read không mutation ẩn |
| BE-03 | Accounts/bank/wallet/cash, opening/date, settings, details/history/archive | BE-01/02/04 | Opening không income; archive giữ history; đủ setup hiện có |
| BE-04 | Ledger/events/draft/pending/posting, thu/chi/đầu tư/transfer/phí/refund/correction/category/cash count | BE-01/02; DB | Oracle độc lập, atomic/balanced/immutable; concurrency và retry không double effect |
| BE-05 | Snapshot/Home/reports tích hợp, flow/scope/time/category, portfolio/insights/giải thích số | BE-03/04/06/07 | Card/chart/table/detail cùng snapshot; unknown/coverage/stale rõ; không cộng page thành báo cáo |
| BE-06 | Holdings/catalog/gold profiles, setup mã+số lượng/chỉ, movements/cost/history và preview/confirm | BE-01/02/03 | Đơn vị/profile/decimal đúng; giá không tự xác định lượng |
| BE-07 | Quotes/FX/manual price, daily/manual refresh, freshness/last-good, quota/entitlement | BE-06/17; nguồn có quyền | Client tắt vẫn cập nhật; không quote giả; không đổi cash/quantity |
| BE-08 | Sources, device enrollment/revoke, consent/binding/support, notification receipts/revisions/ACK/sync | BE-01/02/17/20 | Lưu bền trước ACK; owner fence; dedupe mơ hồ→Review; không gửi raw/OTP |
| BE-09 | CSV template/staging/mapping/preview/selection/confirm/jobs/history/retry | BE-01/02/04/17 | Invalid/duplicate/partial/TTL; cùng request không import hai lần |
| BE-10 | Review/evidence và mọi resolution pending/duplicate/transfer/refund/cash/quality | BE-04/08/09 | Đủ nhánh hiện có; preview/confirm/quyền/history; không tự sửa actual từ nghi vấn |
| BE-11 | Plan CRUD/version/archive, income/expense/investment, actual link/unlink, forecast/remaining/overspend | BE-02/04/05 | Đủ lifecycle; same-owner refs; planned không thành funded |
| BE-12 | Goals/contributions/allocations/release/achieve/archive/progress/shortfall/history | BE-03/04/11 | Đa mục tiêu không dùng trùng cash; actual không bị chặn vì allocation |
| BE-13 | Engine/simulation theo ngày/horizon, save/consume/invest, comparisons/frozen history | BE-04/06/11/12 | Oracle/bounds/unknown; không actual writes; assumptions rõ |
| BE-14 | Q&A/contextual chat/panel/mascot support/conversation/message/history/result/evidence/cancel | BE-01/05/13 | Giữ capability cũ; frozen context/masking; late reply không ghi đè context mới |
| BE-15 | Agent Goal-first/Plan-first, multi-goal/plan-only draft, clarify/simulate/compare/revise/investigate/replan, atomic confirm | BE-11/12/13/14/17 | Toàn bộ AI-FR-001…024/AI-NFR-001…008; limits/cancel/stale/race; owner confirm chỉ Plan/Goals, không actual |
| BE-16 | Admin auth/MFA, overview/accounts/sources/jobs/quotas/releases/incidents/audit, safe preview/confirm | BE-01/02/17/18 | [LOCAL_POSTGRES_IMPL: 14 ops/7 màn](../execution/backend-ops-local-2026-10-11.md); metadata-only, cross-role denial, reason/audit, accepted/applied/rejected, unknown/committed; UI BE-19 pending |
| BE-17 | Queue/dispatcher, receipt/price/Agent workers, lease/fencing/retry/catch-up/retention | BE-02/04/08 | Crash/race/lost ACK; reads không advance jobs; internal identity riêng; cleanup không phá ledger |
| BE-18 | T1 trusted-server security, keys/enrollment/recovery, secrets/redaction/backup/restore | [ADR-008 A + T1](../architecture/adr/ADR-008-modular-backend-trusted-server.md) + security spikes | SEC-REAL-T1 evidence và restore drill; root/DBA được tin, app-admin/tenant isolation bắt buộc; không bắt buộc protected PoC |
| BE-19 | User web/mobile và admin adapters API005/native003, read/mutation/loading/error/empty/stale/denied và local interactions | BE-01…18; frontend r2 | [LOCAL_INTEGRATION_TESTED_SUBSET](../frontend/be19-report.md): 13 real HTTP/PG, 67 mock browser, 140 unit PASS; user/admin build PASS; Android build/44 JVM PASS, device E2E NOT RUN (user confirmed no device); chưa DONE toàn bộ ba clients/41 AC |
| BE-20 | Kotlin listener/bridge/allowlist/map/Keystore outbox/worker, permission/status, signed APK install/update | BE-01/08/17/18; device PoC | Thiết bị thật: offline/reboot/screen-off/revoke/logout/switch; support matrix rõ |
| BE-21 | Environments/CI/deployment/signing/scheduler/observability/quota/cost/rollback/runbook/UAT | Các gói liên quan | Full integration/Agent/device/UAT; phiên bản dịch vụ/APK; không critical chưa xử lý |

BE-18/21 bổ sung [Operations runtime synthetic 13/10/2026](../execution/backend-operations-2026-10-13.md),
[runbooks thực thi](../operations/runtime-runbooks.md) và [OPS-01…32 / real gates](../operations/runtime-acceptance.json).
Đây là bằng chứng local có phạm vi; SEC-REAL-T1, off-host custody/alerts, retention nhiều ngày và full UAT vẫn chưa đóng.

## Đối chiếu để không bỏ sót

- [133 operation API](backend-operation-backlog.csv): URL, actor/kind, gói phụ trách, storage dependencies và trạng thái. Không suy nhóm nghiệp vụ chỉ từ tag; updateDraft/postDraft thuộc ledger BE-04.
- [86 thao tác kế thừa](backend-action-coverage.csv): named calls nối backend; local/fixture được giữ đúng nơi, không tạo production endpoint giả.
- [50 mục giao diện](backend-screen-coverage.csv): từng ID có gói backend/native/UI phụ trách, kể cả native chưa triển khai.
- [41 parent yêu cầu](backend-requirement-coverage.csv): giữ AC/REQ và operation đích; AI refinements vẫn theo AI-SPEC, không cộng thành parent AC mới.

Mapping là kế hoạch, không evidence implementation. Các gói còn NOT_IMPLEMENTED; cần phân biệt specified, implemented, integrated và tested. “Không cần backend riêng” không có nghĩa bỏ feature: local interactions vẫn BE-19; reset/fault/demo giữ ở synthetic, không công khai production. Số 50/86/41/133 chỉ là kiểm kê; nếu rà LLD thấy thiếu behavior/API, bổ sung contract/backlog có version, không bỏ feature để giữ số.

Chốt [kiến trúc](../architecture/architecture-decision-agenda.md), chạy [spikes](../testing/technical-spikes.md) và DB, xây toàn bộ module theo dependency, kiểm trong lúc xây rồi tiếp tục tối ưu. Không chờ viết xong mọi code mới phát hiện lỗi ledger/quyền/collector. Không mở vòng lựa chọn bỏ tính năng hoặc buộc owner tự viết backlog.

## ARCH-05 contract delta — REQUIRED, không cắt tính năng

[API T1 revision141 operations](../contracts/v2-t1/README.md) và [ADR-012](../architecture/adr/ADR-012-unified-t1-contract-revision.md) là working target mới. Giữ 21 gói và41 parent AC;8 operations bổ sung làm rõ đầu việc còn thiếu, không bỏ tính năng frontend.

| Gói liên quan | Bổ sung implementation |
| --- | --- |
| BE-01/02/18 | Native challenge/refresh, collector challenge/credential; current auth-before-replay; credential storage/rotation/CSRF theo ARCH-06 |
| BE-08/17 | Collector-only scope, epochs/durable ACK/reconcile, restore fence/replay horizon |
| BE-09/17 | executeImportJob typed ticket/lease/fence, selected-set atomic |
| BE-02/16 | Owner/Ops command outcome; expired body giữ committed tombstone; không lộ secrets/finance |
| BE-19/20/21 | Fresh consumer/field/transport adapters; build pin revision/hash, request/reply conformance và31 scenarios |

[DB delta](../contracts/v2-t1/db-contract-delta.md) bắt buộc hoàn thiện trước implement auth. Không coi expand design70 bảng đã đủ credential rotation. Runtime checks mới SPECIFIED/NOT RUN.

## ARCH-06 — BE identity/security implementation inputs

Không giảm21 REQUIRED items/41 parent AC. Identity, device, admin và common security backend phải implement [API002](../contracts/v2-t1-r2/README.md), [DB auth delta](../data/target-t1-auth/README.md), [147-operation permissions](../security/identity/operation-permissions.csv) và [AUTH-01…30](../security/identity/acceptance-plan.md). Domain/Agent features giữ nguyên;6ops mới là hỗ trợ auth/reauth/recovery/background renewal, chưa có consumer callsites. Trạng thái DESIGN_SPECIFIED / IMPLEMENTATION_NOT_RUN, không DONE.

## ARCH-07 — Công việc bảo mật áp dụng cho toàn bộ backend

[Hồ sơ T1](../security/t1/README.md) bổ sung chi tiết BE-18 và các yêu cầu xuyên suốt BE-01…21; giữ đủ **21 mục REQUIRED / 41 AC**. Mọi module phải áp dụng phân quyền theo object/workspace, kiểm tra trạng thái chặn, logs theo allowlist và egress đúng mục đích.

Backend cần triển khai secret/key custody theo process; publication thu hồi/xóa có thể retry đúng lệnh; witness độc lập; backup mã hóa ngoài host; restore khóa mặc định; xóa theo dependency và kiểm chứng mọi bản sao. DB đích revision 003 có 84 bảng / 960 cột; API002 giữ nguyên. 32 ca SEC và các ca AUTH/domain/native vẫn cần chạy, không được thay bằng kiểm tra tài liệu.

## ARCH-08 — Engine/domain implementation inputs

Giữ đủ21mục REQUIRED/41AC. BE-03/04/05 thực hiện opening/posting/refund/transfer/correction/quantity; BE-12/13/14 thực hiện snapshots, actual links, shared funding, Goal criteria, long-term forecast; BE-15 chỉ Agent read/simulate/draft; BE-17 dùng typed forecast job trên J2; BE-19 adapters planned; BE-20/21 chạy oracle/domain/SQL/concurrency/fault/UAT thật.

[30 refinements ENG](../domain/requirement-traceability.csv) là chi tiết yêu cầu, không thêm parent AC hoặc bỏ tính năng. [API003](../contracts/v2-t1-r3/README.md) thêm4forecast operations; [DB004](../data/target-t1-domain/README.md) thêm2bảng compute/result. Current frontend forecast local phải adapter khi tích hợp, không gửi whole Store hoặc dùng collector token. State SPECIFIED / NOT_IMPLEMENTED / NOT_INTEGRATED / RUNTIME_NOT_RUN; oracle artifacts không là backend DONE.

## ARCH-09 — Implementation inputs — giữ đủ21 REQUIRED/41 AC

BE-08/09 implement intake/dedupe/atomic import; BE-06/07 prices/scheduler/quota; BE-15 Assistant/Agent budgets/continuation; BE-13/14 forecast chunk worker; BE-17 J2 SQL/fences/reaper; BE-18 security/restore/retention; BE-19 API004 adapters/coverage paging; BE-20/21 chạy32ASN cases thật. Không bỏ feature hoặc nhận documentation/model checks là DONE.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Full21required groups/41parent AC unchanged. Android32refinements cover registration/proof/persistence/ACK/revoke/backup/update/support. No feature de-prioritization; native/server security tests remain NOT RUN.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

Giữ toàn bộ feature và 41 AC; thêm SRC-01…SRC-32 cho source adapters/support/finality/binding/economic dedupe/unit/time/rights/quota/fallback/restore. Không drop feature khi real source gate chưa đủ; build synthetic ports trước.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

Giữ tất cả 41 AC / AI-FR-001…024 và AI-NFR-001…008. ART-01…ART-32 bao phủ runtime/tools/draft/admission/recovery/grounding/privacy/eval; API005/bridge003 adapters còn phải code. Không bỏ tính năng khi model/source gates chưa đủ.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

BE-19 cập nhật 12/10/2026: [catalogue/mapping/RTM và bằng chứng](../frontend/be19-report.md) giữ toàn bộ feature inventory, tách mock regression khỏi real transport synthetic-local. Native003 device E2E/cross-native sync và các prototype synthetic-only operations còn mở; không nhận build/JVM hoặc HTTP representative cases thay toàn bộ acceptance.

Giữ đủ21 BE/41 AC và toàn Agent. BE21 cần CI/release/migration/drain/alerts/restore; BE18 giữ secrets/witness/privacy; BE17 giữ J2/quota/pins. Chưa DONE khi thiếu bằng chứng runtime.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
