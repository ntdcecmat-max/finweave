# ADR-010 — Local I0 và cloud miễn phí I1 có điều kiện

08/10/2026 · **ACCEPTED BY OWNER — DESIGN, NOT DEPLOYED** · ARCH-03.

## Quyết định

Owner chọn trực tiếp: **“tôi chọn I0 + I1”** sau [nghiên cứu ARCH-03](../ARCH-03-options.md). Kế thừa [A + T1](ADR-008-modular-backend-trusted-server.md) và [S1 + P2](ADR-009-fastify-and-isolated-processes.md), giữ đủ mọi feature trong backlog.

- **I0:** môi trường local trên thiết bị sẵn có để triển khai và kiểm thử PostgreSQL/backend/web/admin/Android; inference local là candidate cần benchmark.
- **I1:** hướng cloud pilot trên **Oracle Always Free VM**, Linux ARM64 tương thích, tự host PostgreSQL, hai API và các worker profiles tách process/quyền. Cấu hình triển khai bằng containers/Compose là hướng hiện hành; timer của host enqueue durable jobs. Exact image/version/shape/region/hostname kiểm trước provision.
- Phục vụ hai static builds và release APK qua HTTPS reverse proxy trên host; app/user API cùng origin, admin/Ops API ở origin riêng. DNS/TLS thực chưa chọn; không mặc định phải mua domain, cũng không mặc định Oracle cấp sẵn app hostname.
- Dữ liệu real chỉ sau SEC-REAL-T1/native/UAT/nguồn/model/restore gates. T1 cho phép root/DBA đọc finance; app-admin chỉ operational metadata.
- Mục tiêu tiền thuê cloud0 trong quota hợp lệ. Không cấp được máy miễn phí hoặc không đạt tests thì giữ I0 và báo điều kiện thiếu; **không tự fallback I2/I3/PAYG/trial hết hạn hoặc tài nguyên trả phí**.

## Lý do

I0 không phụ thuộc capacity/cloud account để bắt đầu phát triển. I1 có thể chạy các processes P2 trên một host mà không mua dịch vụ cho từng process; scheduler/workers không phải mượn free web service. Giữ cùng domain/DB consistency boundary và cách đóng gói giữa local/cloud giúp chuyển host khi cần.

Free cloud không có bảo đảm cấp máy hoặc vận hành liên tục; reclaim/outage vẫn có thể xảy ra. Một VM chứa DB và backend là một failure domain, không HA. Chọn hướng này là chấp nhận cloud pilot có điều kiện và cần recovery; không chứng nhận full product miễn phí hoặc production-ready.

## Hệ quả

1. [Topology](../deployment-topology.md), [environment matrix](../environment-matrix.md) và [cost model](../../product/cost-model.md) là working design hiện hành. Candidate Render/Supabase/Vercel ngày07/10 được thay; options/immutable r1/r2 vẫn giữ lịch sử.
2. API và workers không có DDL credentials; migration runner riêng. PostgreSQL không public port5432, model không public unauthenticated. Các worker profiles khác quyền phải tách process/secret scope và DB roles.
3. Scheduler chỉ enqueue; worker thực thi durable jobs, lease/fencing/backoff/catch-up. Không chạy job dài trong HTTP handler hoặc tạo tải giả để né reclaim. Host chết thì schedule ngừng; startup phải tìm overdue và báo coverage/freshness đúng.
4. PostgreSQL trên persistent volume với encryption/storage policy và backup mã hóa ngoài host. Destination/keys/quota của backup phải xác minh; bản nằm trên cùng VM không được tính off-host. Mục tiêu RPO24h/RTO1ngày chưa đo; restore là điều kiện trước real.
5. Không clone real vào staging. Khi pilot chuyển real, cloud staging cũ được giữ synthetic ở host khác hoặc chuyển local; không test phá hủy trên host real. Mọi chuyển môi trường là migration/release có kiểm tra, không đổi nhãn dữ liệu tại chỗ.
6. Model/runtime và nguồn giá chưa chọn tại ARCH-03. Không model thì manual planning vẫn dùng được nhưng Agent chưa hoàn thành; synthetic/manual quote không thay acceptance tự cập nhật giá. Chi phí model/nguồn không được ẩn trong hosting0.
7. Kiểm quota/terms/account, ARM64, đầy đủ P2 boot, capacity/pool/queue, schedule outage, network/native, backup/restore và budget trước nghiệm thu. Pin runtime/libs tại implementation; không lấy quota công khai làm tài nguyên đã cấp.

## Evidence và phần chưa làm

Lựa chọn của owner là evidence chốt hướng thiết kế. Account provisioning, VM, DNS/TLS, PostgreSQL/migrations, runtime/auth/native/APK, daily jobs, model/provider, restore và security đều **NOT RUN** trong task tài liệu này. Chi phí thực chưa có. Không tạo cloud resource bởi ADR này.

Tiếp ARCH-04 schema/DB; ARCH-06/07 identity/security; ARCH-09 queue; ARCH-10 APK; ARCH-11/12 nguồn/model; ARCH-13 release/ops. Nếu quota/terms thay đổi hoặc trial khác Always Free, review ADR trước triển khai. Nguồn chính thức và các alternatives nằm trong [ARCH-03 options](../ARCH-03-options.md).
