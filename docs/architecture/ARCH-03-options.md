# ARCH-03 — Infrastructure/platform: các phương án để owner chọn

ARC-03-OPTIONS-001 · 08/10/2026 · **ACCEPTED BY OWNER: I0 + I1 — DESIGN, NOT DEPLOYED**. Owner chọn trực tiếp “tôi chọn I0 + I1”. [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [topology v0.4](deployment-topology.md), [environment matrix](environment-matrix.md) và [cost v4](../product/cost-model.md) ghi hướng được chọn. Alternatives và nghiên cứu dưới đây giữ lại; account/quota/runtime chưa kiểm.

Đầu vào: [ARCH-01 A + T1](adr/ADR-008-modular-backend-trusted-server.md), [ARCH-02 S1 + P2](adr/ADR-009-fastify-and-isolated-processes.md), [Stack](tech-stack.md), [module HLD](module-high-level-design.md), [full backend backlog](../product/backend-backlog.md), [technical spikes](../testing/technical-spikes.md). Nghiên cứu tài liệu công khai; chưa kiểm tài khoản, quota thực cấp, billing console hoặc benchmark.

## 1. Kết luận để chọn

**Có thể phát triển đủ tính năng mà không thuê cloud. Có đường thử cloud miễn phí. Chưa có bằng chứng toàn bộ sản phẩm chạy liên tục, đủ Agent và nguồn giá thật, với tổng chi phí bằng 0.** Free hosting, free inference và quyền dùng dữ liệu thị trường là ba vấn đề khác nhau.

Khuyến nghị theo ưu tiên hiện tại: **I0 là môi trường phát triển chung; chọn I1 làm hướng cloud pilot có điều kiện**, giữ cấu hình có thể chuyển sang I2. Không cấp được máy miễn phí thì tiếp tục I0, không tự chuyển sang tài khoản trả phí. Nếu ưu tiên tính sẵn có hơn mức phí 0, chọn I2. I3 dành cho lựa chọn giảm việc quản trị máy chủ với ngân sách cao hơn.

| Mã | Cách triển khai | Chi phí nền tảng tham chiếu/tháng | Được gì | Đánh đổi |
| --- | --- | --- | --- | --- |
| I0 — Local | Máy sẵn có: hai API, các worker, PostgreSQL, web/admin và model thử nghiệm | 0 USD tiền thuê cloud; vẫn có điện, mạng, thiết bị | Phát triển/test toàn bộ backend và APK qua mạng test | Máy tắt thì backend/model/scheduler dừng; chưa là SaaS công khai hoạt động liên tục |
| I1 — Free VM | Oracle Always Free; PostgreSQL và các process P2 chung VM, phân quyền riêng | Có thể 0 USD trong tài nguyên đủ điều kiện; dịch vụ phụ tính riêng | Chủ động scheduler/workers; không phụ thuộc free web service bị sleep | Cấp máy phụ thuộc capacity; có thể bị thu hồi; tự vận hành/backup; chưa chứng minh tải |
| I2 — Paid VM | Một Linux VM, hai API + worker profiles + PG + static web; backup ngoài máy | Ví dụ DigitalOcean Basic 2 vCPU/4 GiB: 24 USD; chưa phụ phí | Cấu trúc đơn giản, tài nguyên dễ dự toán, phù hợp P2 | Tự vá lỗi, bảo vệ, restore; một máy là một điểm lỗi; không mặc định HA |
| I3 — PaaS + managed DB | Railway cho API/workers; Supabase Pro PostgreSQL; web cùng ingress hoặc static host | Railway tối thiểu 5 USD + Supabase từ 25 USD; thực tế tăng theo dùng | Giảm quản trị OS/DB, quản lý deploy/metrics thuận tiện | Nhiều dịch vụ và pool DB; phí theo dùng, không coi 30 USD là trọn gói |

Giá là USD theo trang chính thức tại ngày nghiên cứu, không quy đổi VND hoặc mặc định đã gồm thuế, phí thẻ, tên miền, backup ngoài gói, egress vượt mức, model và nguồn giá. Bảng này so sánh hạ tầng, không giảm bất kỳ feature nào trong backlog. [DigitalOcean pricing](https://www.digitalocean.com/pricing/droplets), [Railway pricing](https://railway.com/pricing), [Supabase pricing](https://supabase.com/pricing).

## 2. Vì sao không giữ nguyên bộ free cũ

| Candidate cũ | Bằng chứng chính thức | Hệ quả cho FinWeave |
| --- | --- | --- |
| Render Free | Sleep sau 15 phút idle; khoảng 1 phút wake; 750 giờ/workspace/tháng dùng chung; background worker không có Free | Hai API chạy cả tháng đã vượt 750 giờ. Không thể suy free web hosting đáp ứng worker P2 liên tục |
| Render Free PostgreSQL | Hết hạn sau 30 ngày | Không dùng làm DB lưu tài chính lâu dài |
| Supabase Free | DB 500 MB; có thể pause khi ít hoạt động trong 7 ngày; phải tự xuất backup | Dùng thử synthetic được; không mặc định đủ dung lượng/availability/restore cho real |
| Vercel Hobby | Chỉ personal, non-commercial | Có thể dùng demo cá nhân; không mặc định là nơi host SaaS thương mại miễn phí |
| Railway Free | Credit nhỏ và giới hạn dịch vụ | Không chọn làm baseline cho toàn bộ API, worker profiles và DB luôn chạy |

Nguồn: [Render Free](https://render.com/docs/free), [Supabase pricing](https://supabase.com/pricing), [Supabase pausing](https://supabase.com/docs/guides/platform/free-project-pausing), [Supabase backups](https://supabase.com/docs/guides/platform/backups), [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Railway plans](https://docs.railway.com/pricing/plans).

Đây là vấn đề topology và vận hành; không giải quyết bằng cách nhập Ops API vào User API, cho HTTP process chạy job dài hoặc liên tục ping để né chính sách idle. Candidate cloud ngày07/10 và cost v3 protected/anti-Ops đã được thay bằng [topology v0.4](deployment-topology.md) và [cost v4](../product/cost-model.md) theo I0 + I1/T1; các bản lịch sử vẫn nằm trong snapshots.

## 3. Các thành phần trong từng phương án

| Thành phần | I0 | I1 / I2 | I3 |
| --- | --- | --- | --- |
| User/device API | Process local riêng | Container/process riêng, qua HTTPS reverse proxy | Service riêng |
| Ops API | Process local riêng | Container/process, credentials/role riêng | Service riêng |
| Ingestion/import worker | Profile được cấp quyền phù hợp | Process riêng; không chia secrets với market/Agent | Worker service riêng |
| Market / Agent / retention | Profile riêng | Mỗi ranh giới quyền là process/container riêng | Mỗi ranh giới quyền là worker service riêng |
| PostgreSQL | Local disposable/persistent theo test | DB private trên volume bền vững; không public port5432 | Supabase; server-only credentials, TLS và network policy phù hợp |
| Scheduler | Khi máy bật | Host timer gọi command enqueue; worker đọc durable jobs | Scheduler service/timer enqueue vào cùng DB |
| User/admin web | Hai build và origin test | Hai static builds qua reverse proxy | Static assets cùng origin của API tương ứng hoặc host riêng sau kiểm auth |
| APK | Build/ký local; cài máy test | Download HTTPS trên release storage/server | Release storage/server; không nhúng secrets vào APK |
| Model inference | Runtime local nếu máy đủ tài nguyên | Endpoint riêng; tự host chỉ sau benchmark | Endpoint riêng; chưa mặc định gói compute có model |
| Backup | Xuất mã hóa ra vị trí khác | Ngoài VM + thêm bản độc lập tài khoản khi cần | Backup DB của vendor + bản export độc lập + object backups |

Một host có thể chạy nhiều process: P2 không yêu cầu mua một VM cho mỗi API/worker. Ngược lại, đặt nhiều profile khác quyền chung một process với toàn bộ secrets không đáp ứng phân tách đã chọn. Migration runner là tác vụ riêng, không đưa credential DDL vào API. Không thêm Redis/Kafka/Kubernetes chỉ để deploy; queue implementation tiếp tục chốt tại ARCH-09.

Budget tài nguyên ban đầu để **thử tải**, không phải kết quả đo: khoảng 4 GiB cho host backend/PG không inference; giới hạn từng worker, import batch và concurrency. Chạy inference trên cùng host có thể làm chậm DB/API, vì vậy không lấy dung lượng RAM đủ chứa model làm bằng chứng đạt budget Agent 60 giây. Tổng connection pool tính trên mọi process/replica, dự phòng migration/backup, không đặt mỗi pool mặc định lớn rồi cộng dồn. Đo trước khi chốt sizing.

## 4. Chi tiết I1: miễn phí có điều kiện

Trang Oracle hiện ghi A1 **2 OCPU/12 GB**, 200 GB boot/block volume dùng chung và 5 volume backups. Không lấy con số 4 OCPU/24 GB trong hướng dẫn cũ làm quota hiện hành. Capacity có thể không đủ; máy ít dùng có thể bị reclaim. Phải đối chiếu quota/shape/region thực trong tài khoản. [Always Free resources](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).

Oracle yêu cầu thẻ phù hợp để xác minh, có thể giữ khoản xác thực tạm thời. Điều đó khác phí thuê tài nguyên. [Free Tier FAQ](https://www.oracle.com/cloud/free/faq/).

Cách dùng đề xuất:

1. Synthetic trước; image/runtime hỗ trợ ARM64, PostgreSQL và backend cùng region, phân tách secrets/roles/volumes.
2. Kiểm labels Always Free và tổng quota, tránh nhầm credit dùng thử có hạn với tài nguyên miễn phí dài hạn. Chưa tự nâng tài khoản PAYG.
3. Dùng backup logic mã hóa ra ngoài VM; volume backup của vendor không thay restore drill hoặc bảo vệ khỏi mất tài khoản.
4. Không tạo tải giả để tránh reclaim. Khi mất máy, dựng lại từ cấu hình + backup; đo thời gian phục hồi.
5. Pilot real chỉ sau SEC-REAL-T1, benchmark, restore và chấp nhận gián đoạn. Khi cần vận hành đáng tin cậy hơn, trình phương án I2 với chi phí cụ thể.

## 5. Chi phí I2/I3 và phần thường bị bỏ sót

I2 lấy DigitalOcean làm ví dụ có giá công khai: gói 4 GiB/2 vCPU, 80 GiB SSD, 4.000 GiB transfer là **24 USD/tháng**. Đây là mốc so sánh, không khẳng định rẻ nhất thị trường hoặc đủ mọi tải. Backup dịch vụ/add-ons tính riêng. [Droplet pricing](https://www.digitalocean.com/pricing/droplets).

I3: Railway Hobby thu tối thiểu 5 USD và trừ vào usage; Supabase Pro từ 25 USD cho project đầu. Không cộng 5 USD lần nữa vào toàn bộ usage. Mô hình: `max(5, Railway usage) + Supabase plan/compute/add-ons + extras`. [Railway pricing](https://railway.com/pricing), [Supabase pricing](https://supabase.com/pricing).

Ví dụ tính toán, **không phải benchmark**: giả sử app services cộng lại dùng RAM trung bình 1 GiB, CPU trung bình 0,1 vCPU suốt 30 ngày, 5 GB egress. Theo đơn giá Railway đã xem, usage xấp xỉ 12,26 USD; cộng DB 25 USD thành **37,26 USD/tháng**, chưa storage/add-ons và model. Con số đổi mạnh nếu worker giữ nhiều RAM hoặc staging chạy song song. Không gán nhãn “full backend chỉ 5 USD”.

Supabase Pro có daily backup giữ 7 ngày; backup DB không chứa file objects và không giữ password của custom roles. Cần backup file/signing/config và runbook role recovery riêng. [Database backups](https://supabase.com/docs/guides/platform/backups).

Các khoản bổ sung phải có trong dự toán: staging hoạt động đồng thời; off-host backup và versioning; egress/APK downloads; domain; email phục hồi tài khoản; metrics/alerts; LLM tokens hoặc máy inference; license dữ liệu giá; distribution; thuế và chi phí thiết bị/điện. Free email hoặc trial credit cũng không tự chứng minh recovery chạy được lâu dài.

Ngân sách 0 yêu cầu không tự bật dịch vụ tính phí. Với tài khoản có billing, cảnh báo chi phí không đồng nghĩa hard cap; cần giới hạn ứng dụng/concurrency/retention và kiểm hành vi khi hết quota. Không xóa ledger hoặc ngừng backup âm thầm để tiết kiệm; báo suy giảm rõ và có phương án nâng tài nguyên được duyệt.

## 6. Môi trường, network và trust T1

| Environment | Dữ liệu | Mục tiêu | Điều kiện |
| --- | --- | --- | --- |
| LOCAL-SYNTHETIC | Fixtures giả | Migrations, domain, concurrency, API/native integration | Có thể dựng/xóa DB test; không secrets real |
| STAGING-SYNTHETIC | Dữ liệu giả, tài khoản test | HTTPS/auth, lịch ngày, APK, restore, end-to-end | Deploy cùng code/image dự kiến; DB/roles/keys tách real |
| REAL-T1 | Dữ liệu thật có consent | Sử dụng sản phẩm | SEC-REAL-T1, quyền nguồn/model, native/UAT/restore đạt; chưa được bật |

Ưu tiên cùng dạng cấu hình/container qua ba môi trường, chỉ khác cấu hình và secrets. Không clone finance thật vào staging. Nếu chung VM vì tiết kiệm, cần DB/roles/volumes/network riêng và resource limits; vẫn chung failure domain. Khi chạy real, khuyến nghị staging ở local hoặc host khác, không chạy test phá hủy trên máy real.

Đề xuất user web và user API cùng origin (`app.<domain>/api`); admin web và Ops API cùng origin riêng (`admin.<domain>/api`). APK trỏ API URL của đúng environment. Reverse proxy chỉ định tuyến; backend vẫn auth/authorize từng request. Cách này giảm rủi ro cross-site cookie của nhiều provider domains. Tên miền là placeholder; chưa có domain thật. Nếu chưa mua domain, phải xác minh hostname HTTPS được cấp hoặc phương án DNS miễn phí phù hợp, không hứa VM tự có app domain/TLS.

DB và model không public không-auth. Remote DB dùng TLS, role riêng và kiểm pooling/transaction context; migrations dùng connection thích hợp. HTTPS ingress, quản trị host qua SSH key/restricted access; worker chỉ có egress cần thiết. App-admin không được xem finance, raw notification hoặc prompt; root/DBA thuộc trusted operators theo T1. Secret store/env injection chỉ cấp theo process, không gói vào React/APK/image hoặc logs.

## 7. Scheduler, đồng bộ và phục hồi

Đề xuất daily18:00 giờ Việt Nam (11:00 UTC), giữ business timezone rõ ràng. Scheduler chỉ enqueue job có unique key cho nguồn/entitlement/ngày; worker thực hiện, ghi kết quả và trạng thái bền vững. Manual refresh dùng cùng policy quota/dedupe. Retry/backoff, lease/fencing, startup catch-up và stop/restart cần test ở ARCH-09. Không giữ SQL transaction khi gọi nguồn/model.

Khi host/scheduler mất mạng hoặc dừng: client thấy last-good + timestamp/stale; không hiển thị quote cũ là vừa cập nhật. Khi lên lại, catch-up latest và ghi nhận missed coverage; không bịa lịch sử. Android lưu outbox mã hóa và retry, ACK receipt không đồng nghĩa đã ghi sổ. User web fetch snapshot version sau commit; cadence poll20s hiện là đề xuất cần đo, không tăng egress vô hạn.

Backup đề xuất: logical dump mã hóa hằng ngày, 7 daily + 4 weekly, ngoài host; backup file objects/signing/recovery riêng. RPO24h/RTO1ngày là mục tiêu ban đầu **chưa đo**, không SLA. Tính tổng dung lượng retention trước khi kết luận free đủ. Khôi phục ra môi trường sạch, kiểm counts/invariants/idempotency/roles; áp dụng deletion journal sau restore để không phục hồi dữ liệu đã yêu cầu xóa. Retention cuối cùng chốt ARCH-07/13; không xóa immutable baseline r1/r2.

Theo dõi metadata: API error/latency, DB disk/connections, queue age, overdue jobs, price freshness, backup age/restore result, native sync gap và model budget. Cảnh báo phải có đường nhận độc lập khi host chết; không coi dashboard nằm trên chính host lỗi là cơ chế báo động đủ.

## 8. Static hosting và APK

Đơn giản nhất trên VM: phục vụ hai static builds và signed APK qua HTTPS. APK cần versionCode, checksum, signing continuity, release metadata và luồng tải/cập nhật; key ký không nằm trên public download host. Android native collector vẫn phải thực hiện, không thay bằng responsive web.

Cloudflare Pages là candidate cho static UI tách riêng; giới hạn asset **25 MiB**, nên APK lớn phải ở release server/object storage. Pages không thay thế Fastify/worker runtime. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/).

R2 Standard có free allowance 10 GB-month; vượt storage/request allowance phát sinh phí dù egress trực tiếp miễn phí. Backup bucket private và release bucket public phải tách policy; không dùng chung quyền. Đây là candidate, chưa bật billing hoặc chọn làm nơi phân phối production. [R2 pricing](https://developers.cloudflare.com/r2/pricing/).

Build/cài APK trực tiếp không bắt buộc phát hành Google Play. Tuy nhiên phải xét developer verification theo khu vực/thời điểm; không hứa sideload luôn bỏ qua mọi yêu cầu đăng ký. Android có limited distribution miễn phí tối đa20 thiết bị được người dùng cho phép, phù hợp hobby/test, không dùng nó làm cam kết phân phối SaaS thương mại rộng rãi. [Android verification](https://developer.android.com/developer-verification), [Limited distribution](https://developer.android.com/developer-verification/guides/limited-distribution). Chi tiết thiết bị/OS/signing/rollout tiếp ARCH-10.

## 9. Model và nguồn giá: không gộp vào “free hosting”

| Cách inference | Phù hợp | Giới hạn cần chốt |
| --- | --- | --- |
| Runtime trên máy sẵn có | Synthetic/eval; không phí API theo token | Phụ thuộc máy bật, RAM/CPU/GPU; model license và chất lượng cần kiểm |
| Self-host trên VM | Kiểm soát dữ liệu trong T1 | RAM đủ chưa chắc latency đạt; đo cạnh tranh tài nguyên với DB; tách host khi cần |
| Model API free tier | Synthetic nếu terms cho phép | Rate/quota/availability; không mặc định chấp nhận finance thật |
| Model API trả phí | Candidate cho Agent real khi đạt eval/privacy | Giá theo tokens/context/tools; daily budget, retention và vendor trust riêng |

Ví dụ Gemini: điều khoản unpaid service có quy định dùng dữ liệu để cải thiện sản phẩm và yêu cầu không gửi thông tin nhạy cảm/cá nhân/bí mật; có ngoại lệ theo khu vực/billing nên phải kiểm đúng account. Không chọn free model bằng mỗi bảng giá. [Gemini API terms](https://ai.google.dev/gemini-api/terms), [pricing](https://ai.google.dev/gemini-api/docs/pricing).

Model gateway là ranh giới hạ tầng được giữ trong ARCH-03; model/provider cụ thể, eval tiếng Việt, structured tools, 60s/8 calls và quyền dữ liệu chốt ARCH-12. Không có model thì manual Plan/Goals vẫn chạy, nhưng **chưa nghiệm thu đầy đủ Agent**. Agent không được ghi actual ledger; owner confirm chỉ đổi Plan/Goals theo thiết kế đã duyệt.

Nguồn cổ phiếu/vàng cần quyền truy cập/automation/cache/redistribution, quota và freshness; website công khai không chứng minh API/license miễn phí. Chốt ARCH-11 trước integration thật. Manual quote và fixtures giúp tiếp tục phát triển, không thay tiêu chí cập nhật giá tự động của sản phẩm.

## 10. Các thử nghiệm trước khi nhận phương án

Tất cả dưới đây **SPECIFIED / NOT RUN**; là refinement của spikes hiện có, không bằng chứng test mới.

| Kiểm tra | Điều kiện đạt / kết quả cần ghi |
| --- | --- |
| Vendor/account/quota | Plan, region, shape, quota, commercial terms và đơn giá chính xác; không chỉ dùng tên “Free” |
| Full P2 boot | Hai API và đủ worker profiles chạy; capabilities/roles tách; Ops không đọc finance |
| CPU/RAM/connections | Tải đồng thời API/import/price/Agent/backup; không OOM/pool starvation; chốt capacity sau đo |
| Scheduler outage | Tắt host qua giờ chạy; lên lại catch-up có bounded retry, không duplicate effect |
| DB restore | Restore sang DB sạch, roles/secrets cấp lại, invariant và replay đúng, RPO/RTO đo được |
| Web/native network | HTTPS, browser cookie/CSRF/logout, token revoke, Android offline/retry và đúng environment |
| Storage/cost | Quota/disk/budget gần ngưỡng được cảnh báo; bản backup recoverable; ghi estimated và actual riêng |
| Model/provider | Timeout/quota không khóa ledger; không rò finance; full Agent/price chỉ pass khi có eval/nguồn thật |
| Release/distribution | APK ký đúng, cài/cập nhật trên thiết bị, tải được, kiểm quy định distribution áp dụng |

## 11. Quyết định owner và hồ sơ hiện hành

Chọn **I1** nếu giữ ưu tiên cloud miễn phí và chấp nhận điều kiện cấp máy/khả năng gián đoạn; **I2** nếu muốn VM trả phí với dự toán rõ; **I3** nếu ưu tiên dịch vụ quản lý. **I0 luôn giữ** cho phát triển và kiểm thử, cũng là lựa chọn tạm thời nếu chưa muốn dùng tài khoản cloud.

Khuyến nghị **I0 + I1, không tự fallback trả phí**. Đây là hướng thử nghiệm và triển khai có điều kiện, không chứng nhận sản phẩm real đã sẵn sàng hoặc toàn bộ chi phí bằng0. Mô hình inference/nguồn giá chưa đủ bằng chứng để chốt miễn phí dài hạn.

**Owner đã chọn I0 + I1 ngày08/10/2026.** [ADR-010](adr/ADR-010-local-and-conditional-free-cloud.md), [topology](deployment-topology.md), [environment matrix](environment-matrix.md), [cost model](../product/cost-model.md), HLD/views và Stack được đồng bộ; [change report](ARCH-03-change-report.md) liệt kê thay đổi/verification. Oracle Always Free là hướng compute/platform được chọn có điều kiện; account/shape/region/hostname/backup destination/model chưa kiểm hoặc chưa chọn. I2/I3 giữ alternatives, không auto paid fallback. Backend/SQL/native/security/restore vẫn NOT RUN; runtime frontend, contracts/schema và snapshot r1/r2 giữ nguyên.
