# Deployment topology v0.1

07/10/2026 · thiết kế, chưa tạo service/domain/credentials. Các hostname dưới là placeholder, không địa chỉ live hoặc quyền sở hữu được xác nhận. [Trust profiles](adr/ADR-006-deployment-trust-profiles.md) áp dụng trước dữ liệu thật.

## 1. SYNTHETIC-CLOUD, ưu tiên free tier

| Thành phần | Tọa độ minh họa | Access/config |
| --- | --- | --- |
| User web | https://finweave-user-example.vercel.app | Static Vite dist; API_BASE_URL cấu hình công khai, không secrets |
| Admin web | https://finweave-admin-example.vercel.app | Build/session/role riêng; không finance privileges |
| Fastify API | https://finweave-api-example.onrender.com | HTTPS public ingress, API authentication/object checks; DB/provider credentials server-only |
| PostgreSQL | Endpoint/pooler do Supabase project cấp | Backend kết nối TLS với role quyền tối thiểu; không DB credentials trong web/APK; public schema/anonymous grants bị khóa |
| Scheduler | Supabase Cron trong DB | Durable job enqueue + pg_net wake API; scheduler secret trong secret store/Vault, không client |
| Android APK | File ký + HTTPS download trong đợt release được chọn | UI assets bundled; API URL cùng environment; local encrypted queue/cache |
| Model | Local PoC trên máy sẵn có hoặc endpoint được đánh giá | Không đưa local Ollama ra Internet không bảo vệ; cloud inference/provider còn mở, không nằm trong free Render baseline |

Không cần mua domain/IP tĩnh cho pilot. Sau này domain minh họa `app.vitoi.com`, `admin.vitoi.com`, `api.vitoi.com` chỉ dùng nếu có quyền sở hữu/config DNS; mobile gọi API domain, không dashboard URL. Database không có endpoint dành cho client truy cập bằng quyền quản trị. iOS/IPA ngoài release này.

## 2. Lịch ngày, sleep và durable execution

Đề xuất daily18:00 Asia/Ho_Chi_Minh =11:00UTC. Scheduler enqueue một job/source/entitlement/businessDate và thực hiện HTTP wake; chỉ payload operational ID, không finance trong cron logs/pg_net response. Queue nghiệp vụ là bảng durable Postgres, không dùng pg_net request/response làm nguồn sự thật.

API claim job bằng lease, chạy từng batch có giới hạn, lưu progress/results; HTTP wake response chỉ metadata. Khi còn pending hoặc retry tới hạn, cron dispatch có điều kiện theo nhịp5 phút; không ping vô nghĩa để lách sleep. Startup cũng quét overdue; lease expiry phục hồi crash. Daily miss chạy bù latest, không bịa daily historical quotes. Attempts tối đa3 mỗi chu kỳ trước failed+retryAt; provider429 tôn trọng retryAfter, manual không bỏ quota.

[Render Free](https://render.com/docs/free) ngủ khi idle15 phút và cold-start có thể khoảng1 phút. [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) có timeout cấu hình và queue mạng không thay business job persistence. Thiết kế đề xuất wake timeout90s, cần PoC đo và kiểm quota; timed-out wake không tự đồng nghĩa job failed. Không dùng setInterval trong browser/API làm scheduler duy nhất. Chưa có continuous worker/SLA; nếu không đạt cửa sổ cập nhật phải đổi runtime/budget, không báo pass.

## 3. Client sync

Sau ingest/post/price commit tăng relevant snapshot version. UI foreground poll20s và refresh-on-focus; mutation job view poll có backoff. Background dừng polling; Android native uploader độc lập UI. “Server đẩy lên web” là dữ liệu sẵn sàng ở API và client fetch; realtime socket là tùy chọn tối ưu, không lời hứa đã có. Cold-start/maintenance có nhãn, last-good cache không tự biến thành fresh.

## 4. Environments và vận hành

Local dev dùng mock hoặc local synthetic API/PG. Synthetic-cloud dùng project/dataset riêng, không clone real finance vào demo. Real environment chưa bật; base URLs/allowed origins/app identifiers/signing và credentials tách môi trường. Browser auth qua backend HttpOnly cookie (native cơ chế token riêng), exact CORS allowlist, CSRF/Origin checks; cross-site cookie policy phải được thử với provider subdomains trước release, không assume hoạt động trên mọi browser.

Database/file backups ngoài ephemeral Render filesystem; restore drill trước R1, theo RPO/RTO đề xuất trong SRS. Theo dõi job overdue/lease retries/quote freshness/quota/DB size/storage/outbox failures bằng metadata. Alert có trạng thái rõ khi free project pause; không hứa backup trả phí đi kèm Free. APK signing/recovery keys có backup kiểm soát riêng.

## 5. PROTECTED-REAL chưa được giải quyết bởi sơ đồ free

Đối với yêu cầu anti-Ops hiện có: trusted signed/enrolled clients → opaque relay → attested protected processing → encrypted DB/backups và encrypted results. Provider,key authority,client distribution/recovery/cost còn mở. Không thể vẽ Render Fastify plaintext vào protected box rồi coi đạt bảo mật. [Security design](../security/security-design.md) vẫn là gate; TRUSTED-SERVER chỉ là lựa chọn khác chờ quyết định sản phẩm.
