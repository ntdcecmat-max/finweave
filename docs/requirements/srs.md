> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](../product/screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

> **ARCH-08 hiện hành — 09/10/2026:** [Financial Engine/domain](../domain/README.md), [API revision 003: 151 operations / 626 schemas](../contracts/v2-t1-r3/README.md), [DB revision 004: 86 bảng / 988 cột](../data/target-t1-domain/README.md) và [bundle/hashes](../domain/implementation-bundle.json). Kế thừa T1/auth/security; bổ sung 4 operations dự báo và 2 bảng qua J2, không sửa prior packages, frontend hoặc snapshots. **Thiết kế đã chốt; Engine/SQL/concurrency/forecast thực tế NOT RUN.** Các notice ARCH-05…07 dưới đây giữ lịch sử revision; target hiện hành theo 003/004 và các addenda này.

> **ARCH-07 — 09/10/2026:** [Hồ sơ bảo vệ dữ liệu T1](../security/t1/README.md), [bundle và hashes](../security/t1/implementation-bundle.json), [schema đích 84 bảng / 960 cột](../data/target-t1-security/README.md). API revision 002 giữ nguyên 147 operations; các gói và snapshot trước được giữ nguyên. Security profile bổ sung yêu cầu triển khai, không đổi payload API. SQL, bảo mật, backup, witness và restore thực tế đều **NOT RUN**; giữ đủ tính năng và 41 AC. Nội dung ARCH-07 hiện hành làm rõ các phần còn mở trong tài liệu kế thừa.

# FinWeave — SRS v3

REQ-SRS-001 · 07/10/2026 · operational-v3 · SPECIFIED, NOT IMPLEMENTED/ACCEPTED.

Nguồn: [PRD](../product/prd.md), [Scope](../product/scope.md). [SRS v2](../governance/baselines/pre-realignment-2026-10-07/docs/requirements/srs.md) giữ nguyên chi tiết 28 FR/AC và 15 NFR cũ, kế thừa bằng tham chiếu với delta dưới đây. [RTM v3](../execution/realignment-traceability.md) phân biệt test lịch sử và test mới. Không sửa schemas/runtime frontend trong nhiệm vụ này.

## 1. Migration 28 yêu cầu cũ

| ID/AC | Hành vi giữ lại hoặc thay thế |
| --- | --- |
| SET-01/BANK-01/CASH-01; AC-01…03 | Workspace/owner thật, VND/timezone, opening/date; missing khác zero; demo giữ synthetic |
| STOCK-01/GOLD-01; AC-04/05 | Quantity/quote/cost/source compatibility; đơn giản hóa input theo REQ-STOCK-02/GOLD-02, metadata được resolve hoặc xác nhận một lần |
| INPUT-01; AC-06 | CSV fallback, mapping/preview/confirm/idempotency. Giới hạn 20 rows chỉ là fixture |
| INPUT-02; AC-07 | Dummy source được thay bằng capability/permission/device/provider/jobs thật theo AC-31/36 |
| MONEY-01/CASH-02/HOLD-01; AC-08…10 | Thu/chi/transfer/refund/fee/count/correction với history; giá mới không thành income |
| TXN-01/02, TRACK-01/02; AC-11…14 | Filter/detail/correction/snapshot/drill/scope; server là authority real mode |
| REVIEW-01/02; AC-15/16 | Evidence/quality/decision và không double money; bổ sung notification ambiguity |
| UX-01; AC-17 | Việt, keyboard, mask, responsive; bổ sung real-device native tests |
| DEMO-01; AC-18 | Chỉ demo profile; production không reset finance bằng nút demo |
| NAV-01/REPORT-01/INSIGHT-01; AC-19…21 | Năm đích user; admin riêng. Reports đúng snapshot/kỳ, deterministic insights |
| PLAN-01/02, GOAL-01/02, SIM-01; AC-22…26 | Giữ planned/actual/simulated và allocation rules; bổ sung draft Plan–Goal do Agent tạo và user xác nhận ở AC-39 |
| AI-01/02; AC-27/28 | Hỏi–đáp/giải thích, chat/history/context/evidence và linh vật tiếp tục là tính năng sản phẩm, được kế thừa và phát triển. Scripted adapter hiện có giữ làm demo/regression; Agent đa bước bổ sung theo AC-38…40 trong cùng trợ lý |

Tên rút gọn trong bảng đều có tiền tố REQ-. BR-01…36/DR-01…22 giữ semantics nghiệp vụ; BR-37…44 bổ sung draft/nguồn/sync. NFR-15 và BR-33 về AI read-only được làm rõ: Agent được ghi draft theo BR-37, vẫn không được ghi actual, áp dụng active plan hoặc xác nhận thay owner. Mock clocks/stale thresholds/reset không tự trở thành policy production. NFR-07/08 trust/privacy được cập nhật có phạm vi theo lựa chọn owner A + T1 bên dưới; không còn target anti-Ops chống root/DBA. Không tuyên bố security đã đạt.

### Nguồn đặc tả AI hợp nhất — 08/10/2026

[AI-SPEC-001 v1.0](../product/ai-agent-specification.md) là nguồn chi tiết duy nhất cho trợ lý kế thừa và Agent phát triển thêm. Giữ REQ-AI-01/02 và REQ-AGENT-01/02/03 cùng AC-27/28/38/39/40;24 AI-FR và8 AI-NFR là refinement, không tăng inventory41 AC hệ thống. Các hàng Agent bên dưới là tóm tắt cấp hệ thống; bảng§9 của AI-SPEC định nghĩa mapping đầy đủ.

| Requirement hệ thống | Nội dung kế thừa / mở rộng | Mã chi tiết |
| --- | --- | --- |
| REQ-AI-01 / AC-27 | Hỏi–đáp, giải thích, history, captured context, evidence/drill và lỗi; dùng capability đọc tiếp tục phát triển | AI-FR-001…007/009/019…021/023; AI-NFR-001…006 |
| REQ-AI-02 / AC-28 | Full chat/panel/linh vật dùng chung hội thoại và các trạng thái, keyboard/mask/mobile/reduced-motion | AI-FR-004…008/019; AI-NFR-002/007 |
| REQ-AGENT-01 / AC-38 | Điều tra đa bước mở rộng từ đọc/giải thích, cùng hội thoại và nguồn căn cứ | AI-FR-002/006/007/017…021/023; AI-NFR-001…006/008 |
| REQ-AGENT-02 / AC-39 | Clarify/create/revise/simulate/confirm linked Plan–Goal drafts và manual handoff | AI-FR-010…016/019…024; AI-NFR-001…008 |
| REQ-AGENT-03 / AC-40 | Shared runtime/tool boundaries, budget/errors và regression+Agent evaluation | AI-FR-009/019…024; AI-NFR-001…008 |

## 2. Functional requirements mới

Mọi số trong AC là fixture, không giá thị trường. **Toàn bộ AC-29…41: NOT RUN.**

| ID / release | Hành vi và acceptance criteria |
| --- | --- |
| REQ-SURFACE-01 / R1 | **AC-29:** web/mobile cùng owner/workspace đọc cùng version; user gọi admin API bị 403, admin gọi finance API user bị 403 dù sửa object ID; logout xóa cache phiên |
| REQ-APK-01 / R1 | **AC-30:** APK release có ký cài/cập nhật trên real device thuộc support matrix; assets bundled; tắt UI vẫn nhận fixture notification và sync. Update cùng signing identity giữ trạng thái hợp lệ; emulator/build-only chưa đủ |
| REQ-CAPTURE-01 / R1 | **AC-31:** consent + OS permission + source/account allowlist; deny/revoke/OTP/app ngoài allowlist/redacted/unsupported/disconnected/force-stop đều đúng trạng thái, không giả coverage đầy đủ |
| REQ-INGEST-03 / R1 | **AC-32:** durable receipt, parser version, idempotency và domain dedupe. Retry 10 lần/timeout sau commit không nhân posting; hai giao dịch thật cùng amount không bị xóa. Hai legs transfer nội bộ ghép đúng, phí riêng; thiếu dữ liệu vào Review |
| REQ-SYNC-01 / R1 | **AC-33:** offline nhận 3 events, restart rồi online gửi đủ một lần; hai UI đồng nhất sau foreground refresh; response cũ không đè mới; revoke chặn upload; queue user A không được gửi bằng user B |
| REQ-STOCK-02 / R1 | **AC-34:** ticker catalog + quantity, market/unit/date resolve tự động, cost optional; fixture 100×25.000 = 2.500.000 VND, đổi giá 26.000 → 2.600.000 nhưng quantity/cash/income không đổi; mã mơ hồ không đoán |
| REQ-GOLD-02 / R1 | **AC-35:** profile được xác nhận, nhập chỉ; 2×8.000.000 = 16.000.000 VND, 0,2 lượng tương đương. Quote khác product/purity/side/unit bị từ chối; missing không 0 |
| REQ-PRICE-01 / R1 | **AC-36:** tắt mọi client vẫn chạy daily; manual/daily đang trùng key dùng cùng job; không giữ quoteAsOf giả hôm nay vào ngày nghỉ. Timeout/429/partial giữ last-good; recovery lấy latest có quyền, không bịa lịch sử |
| REQ-ADMIN-01 / R1 | **AC-37:** console có jobs/provider/parser/quota/release metadata và retry/disable có audit; không amount/raw/prompt trong response/log/UI. Retry không double posting; disable parser ngăn xử lý mới, không xóa evidence cũ |
| REQ-AGENT-01 / R1.1 | **AC-38:** điều tra có branching theo evidence/coverage, clarification và stop; case trùng + transfer + gap nêu đúng phần chắc/chưa chắc, case sạch không bịa lỗi. Mỗi số truy ToolResult/snapshot; không actual write |
| REQ-AGENT-02 / R1.1 | **AC-39:** từ Plan hoặc Goals, user nêu mục tiêu → Agent hỏi reserve/target/deadline/priorities còn thiếu → tạo GoalDraft+PlanDraft liên kết → Engine mô phỏng → user sửa bằng hội thoại → preview/confirm lưu atomic. Cancel không thay active plan; confirm lặp không duplicate; snapshot mới gây stale/re-preview; phương án bất khả thi nêu lý do. Điều chỉnh theo actual cũng phải qua draft/confirm |
| REQ-AGENT-03 / R1.1 | **AC-40:** tối đa 8 tool calls/run, 60s active budget, 2 lượt clarification rồi pause; user wait không tính active time. Quota/offline/injection/cross-tenant/stale/cancel được kiểm; agent đạt evaluation rubric trước release |
| REQ-RECOVERY-01 / R1 | **AC-41:** crash trước commit không effects, sau commit replay same result; restore synthetic DB/files/key configuration tái tạo snapshot; outbox chưa ACK không mất sau restart. Uninstall có thể mất queue local và phải được giải thích |

### NFR-08 — Trust model được owner chọn ngày 08/10/2026

**TRUSTED-SERVER T1, theo [ADR-008](../architecture/adr/ADR-008-modular-backend-trusted-server.md).** Backend/runtime/DB/backup/key operators được tin và có khả năng đọc finance hoặc thay runtime. Thay phần NFR-08 kế thừa yêu cầu ngăn chính root/DBA/Ops và bắt buộc protected attestation/independent key-client authority. App-admin vẫn không được đọc finance, impersonate hoặc tạo actual writes qua quyền ứng dụng; tenant/object/device authorization bắt buộc.

NFR-07 kế thừa được làm rõ cho T1: authenticated TLS tới trusted backend, encrypted native outbox, mã hóa storage/backup, secret separation/redaction/minimization; không bắt buộc opaque ciphertext-only gateway tới enclave. Server xử lý finance dạng rõ không có nghĩa được ghi finance/raw/OTP/prompt/token vào logs, repo hoặc gửi external LLM tùy ý. NFR-19/20 tiếp tục áp dụng.

**SEC-REAL-T1: NOT RUN / BLOCKED_PENDING_IMPLEMENTATION_AND_TESTS.** Điều kiện: direct-API/DB tenant và admin negative tests, device/enrollment/revoke, transport/secrets/log redaction, encryption/key access, restore/erasure/replay, retention và provider/privacy controls có evidence. Root/DBA không đọc finance và protected-client/attestation PoC không còn tiêu chí bắt buộc T1; vẫn ghi nhận rủi ro privileged access. Không đổi 41 AC, wire API/schema hoặc frontend guards trong task tài liệu này.

## 3. NFR bổ sung

| ID | Mục tiêu và cách kiểm |
| --- | --- |
| NFR-16 / coverage | Support matrix package/appVersion/parser/Android/OEM từ device tests. Một ngân hàng + một ví có end-to-end evidence trước R1; lastObserved/lastAck/gaps rõ, không notification không chứng minh không giao dịch |
| NFR-17 / sync | Design target: ≥95% trong ít nhất 30 lượt fixture từ durable receipt tới hai UI foreground cùng snapshot ≤30s khi network/backend sẵn sàng. Đo riêng cold-start và Android scheduling; không delivery guarantee khi OS ngắt |
| NFR-18 / schedule & cost | Daily mặc định18:00 +07, cửa sổ mục tiêu60 phút trong môi trường khỏe, đo7 ngày; overdue/partial phải thấy. Quota/cost cap không silent paid fallback; free tier không SLA |
| NFR-19 / ingestion privacy | Lọc tại device, không OTP/credentials/app khác; raw không log/analytics/LLM. Outbox mã hóa với Keystore; dữ liệu chưa ACK không silent drop; retention theo policy trong Android/data specs |
| NFR-20 / access | Server session/device/workspace/object checks, admin tách role; không token trong URL/localStorage; revoke/logout dừng collector. RLS/TLS là defense in depth; T1 tin infrastructure operators, app-admin và tenant isolation vẫn bắt buộc theo NFR-08 cập nhật |
| NFR-21 / recovery | Đề xuất pilot RPO≤24h/RTO≤1 ngày, đo bằng restore drill; job/receipt/event/quote/run refs truy vết. Cloud không đồng nghĩa đã có backup đúng policy |

Các ngưỡng/budget trên là mặc định thiết kế do người soạn đề xuất, chưa benchmark hoặc PO sign-off. Kế hoạch test: [Operational acceptance](../testing/operational-acceptance-plan.md).

## 4. State và gate

Device consent/OS permission/connection/network là các trục riêng. Outbox queued/sending/acknowledged/retry_wait/quarantined, không xóa trước durable receipt. Ingestion received/parsed/posted/needs_review/ignored/failed; receipt không tự đồng nghĩa posted.

Price job queued/running/succeeded/partial/failed/rate_limited. Agent queued/planning/reading/awaiting_user/simulating/draft_ready/completed/partial/failed/cancelled; resume kiểm lại quyền và snapshot. Draft Plan–Goal chưa active trước owner confirmation, confirmation dùng version/digest/idempotency/transaction.

R1 cần AC core, các invariant kế thừa liên quan, nguồn/quyền/Android/security/restore/UAT thật. R1.1 thêm real Plan/Goals và AC-38…40. Trust đã chọn T1; cloud real còn chờ SEC-REAL-T1/auth/native/source/restore và UAT evidence. Không dùng PASS frontend synthetic để bỏ gates. Nhãn R1/R1.1 là lịch sử nhóm triển khai, không cho phép bỏ feature: backlog hiện hành giữ toàn bộ REQUIRED.

## ARCH-07 — Tham chiếu triển khai bảo mật (09/10/2026)

NFR-07/08/19/20 và recovery NFR-21 được cụ thể hóa trong [hồ sơ T1](../security/t1/README.md), [SEC-01…32](../security/t1/acceptance-plan.md) và [các ca AUTH](../security/identity/acceptance-plan.md). Giữ đầy đủ tính năng và 41 AC.

Lệnh cấm raw/OTP của ngân hàng không cấm mã xác thực riêng của FinWeave tại đúng auth verifier/mail adapter; cả hai đều không được ghi logs hay gửi LLM. RPO 24 giờ / RTO 24 giờ là mục tiêu chưa đo. Dữ liệu được ACK sau backup gần nhất vẫn có thể mất khi restore; witness nhằm ngăn hồi sinh lệnh xóa/thu hồi đã được xác nhận an toàn cho recovery trước khi mở hệ thống. Tất cả ca SEC thực tế NOT RUN; tài liệu chưa chứng nhận compliance hay bảo mật đã triển khai.

## ARCH-08 — Đặc tả domain thực thi (09/10/2026)

[Engine/domain](../domain/README.md) cụ thể hóa AC tài khoản/giao dịch/tài sản/Plan–Goals/Agent và NFR accuracy/consistency; giữ41parentAC. Extended forecast kế thừa nợ/lạm phát/stress/pooling/profiles/uncertainty/criteria đã có ở frontend; probability là conditional simulation, không mark actual achieved.

Exact money/quantity, sealed posting, consistent snapshot, scoped current authorization và atomic owner planning confirmation bắt buộc. API003/DB004 là target tiếp nối, consumers chưa tích hợp. [DOM-01…30](../domain/acceptance-plan.md) chưa chạy trên backend; oracle độc lập chỉ kiểm expected examples. Missing/partial/stale phải có nhãn và căn cứ, không0 giả hoặc calibrated forecast claim.

## ARCH-09 — ASY-01…32 refinements

Giữ41parentAC/full scope. ASY làm rõ acceptance/enqueue, typed work/fence/retry, notification ACK/dedupe/offline/restore, daily/manual prices/quota, atomic import, inherited Assistant/Agent/forecast, owner sync/cursors/outcome. Các32ASN runtime cases đều NOT RUN; không gộp UI/mock/schema/model thành integrated/real PASS.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Add AND01…32 Android design refinements linked UI-M01…06, no change existing41parent AC. Real support requires exact OS/OEM/source matrix evidence; all Android runtime cases NOT RUN.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

SRC-01…SRC-32 giữ mọi feature và 41 AC gốc; hỗ trợ thật phải package/signer/template/device+finality verified. Daily job attempt khác giá fresh daily; missing/failure giữ last-good/Review/gap thay zero hoặc simulated live.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

AI-FR-001…024 / AI-NFR-001…008 và 41 AC giữ đủ, ART-01…ART-32 thêm runtime detail. Simple Q&A không forcedAgent, multi-step Goal/Plan/variance/investigation có draft/evidence/clarification và owner-confirm riêng.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).
