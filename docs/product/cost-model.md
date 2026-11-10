> **ARCH-13 hiện hành — 09/10/2026:** [Operations](../operations/README.md) / [ADR020](../architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md). API005 / DB005 / native003 giữ nguyên; local-first CI, release có bảo trì, backup/witness/alerts ngoài host. **DESIGN SPECIFIED; runtime/SQL/release/restore NOT RUN; REAL chưa bật.** Các notice revision cũ bên dưới là lịch sử; source/policy đích theo [bundle](../operations/implementation-bundle.json).

> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

# Cost model v4 — I0 + I1, mục tiêu tiền thuê cloud0 có điều kiện

08/10/2026 · **ACCEPTED DESIGN, NOT ACTUAL BILLING**. Owner chọn I0 + I1 tại [ADR-010](../architecture/adr/ADR-010-local-and-conditional-free-cloud.md), kế thừa A + T1/S1 + P2. [Topology](../architecture/deployment-topology.md), [environment matrix](../architecture/environment-matrix.md), [ARCH-03 research](../architecture/ARCH-03-options.md). Chưa có cloud resource, benchmark hoặc hóa đơn FinWeave được kiểm.

## 1. Mô hình được chọn

| Khoản | I0 local / I1 cloud direction | Dự toán và điều kiện |
| --- | --- | --- |
| Compute/API/workers | Máy sẵn có; Oracle Always Free VM cho synthetic pilot | Mục tiêu0 USD tiền thuê trong quota; account/capacity/shape/region/terms chưa kiểm. Không một paid server cho mỗi process |
| PostgreSQL | Self-host trên local/VM, persistent volume, private network | Không Supabase subscription trong baseline đã chọn; disk/CPU/RAM/pools và encryption có chi phí tài nguyên |
| Scheduler | Local/host timer enqueue durable PostgreSQL jobs | Không thuê cron service riêng; host dừng thì lịch dừng, phải catch-up và kiểm overdue |
| User/admin static web | Hai builds qua host reverse proxy | Không mặc định cần Vercel Hobby hoặc gói thương mại; transfer tính vào quota host |
| Network/DNS/TLS | HTTPS bắt buộc khi cloud pilot; hostname miễn phí/sẵn có cần xác minh | Chưa chọn domain/DNS/certificate automation; domain trả phí không nằm trong hướng được duyệt |
| Backup/storage | Encrypted off-host exports + file/signing/recovery backups | Destination chưa chọn; tính tổng7 daily+4 weekly, egress và key custody; chưa chứng minh miễn phí hoặc restore đạt |
| Model inference | Scripted synthetic, local/self-host/API qua gateway sau eval | Chưa chọn model/provider; phí API có thể0 với local nhưng vẫn điện/hardware/availability. Không ngầm coi model nằm trong free hosting |
| Market data | Nguồn stock/gold có entitlement/license cần ARCH-11 | Chưa có fee/quota/automation/redistribution quyền xác nhận; không giả định miễn phí |
| Android build/APK | Công cụ local, signed APK qua HTTPS release storage | Điện/thiết bị/test/signing recovery; distribution/verification cần kiểm theo đối tượng và khu vực |
| Email/monitoring | Recovery/alerts và metrics bằng metadata | Vendor/quota chưa chọn; alert độc lập host, không mặc định email lâu dài miễn phí |
| Security T1 | Trusted server, auth/roles/TLS/encryption/redaction/restore | Không chi phí enclave bắt buộc. Công triển khai và backup/key/recovery resources vẫn có; SEC-REAL-T1 chưa kiểm |
| Environments | Local synthetic + cloud synthetic; real có điều kiện | Chạy hai cloud environments cùng lúc phải cộng tài nguyên, không quota gấp đôi tự động |
| Thiết bị/điện/mạng/công vận hành | Máy hiện có và các thiết bị test | Không phải phí thuê cloud nhưng không bằng0; chưa định giá công sức |

Total = compute + DB/storage/egress + backup + domain/network + model + source entitlement + email/monitoring/distribution + devices/electricity/operations. Các lớp có thể cùng host nên không cộng subscription giả; tài nguyên dùng chung vẫn có quota và failure domain.

## 2. Ý nghĩa của ngân sách0

Owner chọn hướng ưu tiên miễn phí, **không chứng minh full product có tổng chi phí0**. I0 tiếp tục được khi chưa có máy cloud. I1 chỉ triển khai trong tài nguyên đủ điều kiện; trial credits không là miễn phí dài hạn, billing alert không là hard cap.

Không tự chuyển PAYG/I2/I3, mua domain, bật paid storage/model/source hoặc trả overage. Nếu quota/capacity/backup/model/license không đáp ứng, báo số liệu và phương án cụ thể để owner chọn. Không bỏ feature/đổi acceptance sang manual-only, không xóa ledger hay tắt backup âm thầm để giữ giá0.

Dự toán cloud compute/storage tham chiếu theo [Oracle Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm); xác minh quota/labels/terms trong tài khoản ngay trước provision. Mất máy/reclaim là rủi ro availability, không giải quyết bằng tải giả hoặc tự nâng plan.

## 3. Đo và kiểm soát

- Ghi estimated/actual riêng cho RAM/CPU/disk/transfer, số process/replica, DB pools, job backlog, model tokens và source quota. Không suy tải production từ fixtures.
- Alert quota70/90% là mức khởi đầu để kiểm, không giới hạn vendor hoặc hard cap billing. Admission control có safe error/backpressure; ledger giữ đúng, quote stale có nhãn.
- Backup phải có destination ngoài host đủ dung lượng và restore evidence; RPO24h/RTO1ngày là mục tiêu chưa đo. Không tính bản cùng VM là off-host.
- Nếu local model/destination backup phụ thuộc máy cá nhân bật, ghi downtime/gaps; không tuyên bố always-on.
- Review account/project resources để tránh tài nguyên ngoài Always Free, disk/backup/network overage và trial hết hạn trước deploy; exact budgets sau benchmark.

## 4. Alternatives giữ để tham khảo

I2 paid VM và I3 PaaS/managed DB không được chọn. Giá tham chiếu và công thức tính tại [ARCH-03 options](../architecture/ARCH-03-options.md), phải kiểm lại lúc cần quyết định. Không giữ Render Free/Supabase Free/Vercel Hobby/Supabase Cron thành baseline sau ADR-010.

Cost v3 mô tả candidate ngày07/10 và protected/anti-Ops target cũ; T1 theo ADR-008 đã thay target đó. Bản lịch sử nằm trong snapshots, không làm kế hoạch chi phí hiện hành. Không thay bytes r1/r2 hoặc tự restore tệp root bị xóa.

## ARCH-07 — Tài nguyên bảo mật cần tính (09/10/2026)

Dự toán phải gồm volume mã hóa, chỗ lưu export tạm, repository backup ngoài host, dung lượng prune/repack, repository mới khi khóa chính bị lộ, endpoint witness và cảnh báo độc lập, media chứa recovery capsule cùng điện, mạng và công vận hành. Lịch giữ 7 bản ngày / 4 bản tuần chỉ áp dụng trong giới hạn tuổi snapshot 34 ngày.

Chưa có endpoint, quota, dung lượng hoặc benchmark nên chưa thể kết luận các mục này miễn phí. Chưa mua hoặc provision dịch vụ; không tự thêm paid KMS, managed IdP hay phương án trả phí. Nếu dùng máy cá nhân đang tắt, backup/witness sẽ quá hạn hoặc lệnh đang chờ, không được báo always-on.

## ARCH-08 — Chi phí tài nguyên forecast cần đo

Long horizon/trials/Goals làm tăng CPU, RAM, queue time, private payload/checkpoint/result storage và pins/backup. Worker cùng source/DB/J2 không có nghĩa compute miễn phí hoặc Always Free VM đủ tải. Đo trên target ARM64 bằng synthetic trước khi chốt chunk/admission/parallelism; không tự giảm trials/horizon/Goal outputs hoặc gọi paid model để che overload.

Forecast không cần LLM/provider call để thực hiện numerical simulation. Giữ mọi Agent capability riêng ở ARCH-12. Chưa provision, benchmark hoặc phát sinh chi phí; bổ sung measured budgets tại ARCH-09/13.

## ARCH-09 — Async resource/cost assumptions

Không thêm queue vendor hoặc phí thuê dịch vụ do lựa chọn J2; vẫn có CPU/RAM/disk/network/backup/model/provider cost/quota phải đo theo môi trường. Daily18hVN, worker slots, largest1000trials/360months và encrypted journals chưa benchmark; free VM có điều kiện không bảo đảm đủ tải. No silent paid fallback/quota overrun.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

No mandatory cloud build service fee for local APK using existing hardware. Limited distribution free≤20authorized devices only under current eligibility/verification rules; commercial broad distribution not approved. Recheck terms before release, no auto pay.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

External budget vẫn0. SSI currently API fee0 theo FAQ09/10 không chứng minh total SaaS cost0 hoặc redisplay license; PNJ/SJC rights/quota chưa biết. Vnstock phần mềm/nguồn upstream tách phí/quyền. Không signup/buy/call real.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

External budget0, scripted/deterministic local baseline. Ollama local inference không API invoice nhưng RAM/CPU/điện/chất lượng chưa đo;10workspace/50global model roots mỗiUTCday là starting caps, no paid/cloud silent fallback.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).

## ARCH-13 — Operations handover

Ngân sách dịch vụ bổ sung mặc định0; không tự nâng gói. Hosted CI chỉ sau kiểm quota/storage. Availability của backup/alerts và tài nguyên inference chưa đo; VM miễn phí không bảo đảm mọi thành phần không có phí.

[Hồ sơ vận hành](../operations/README.md) · [Acceptance32 NOT RUN](../operations/acceptance-plan.md) · [Báo cáo](../architecture/ARCH-13-change-report.md).
