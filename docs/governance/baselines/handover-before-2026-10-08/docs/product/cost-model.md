# Cost model v3 — ưu tiên miễn phí, không cam kết chi phí bằng 0

07/10/2026 · design estimate, chưa actual billing/capacity measurement. [Stack](../../FinWeave_Tech_Stack.md), [Deployment](../architecture/deployment-topology.md), [nguồn](../architecture/feasibility-sources.md).

| Khoản | Pilot đề xuất | Giới hạn / trigger xem lại |
| --- | --- | --- |
| User/admin static web | Vercel Hobby, hai project/subdomain | Chỉ personal non-commercial; đổi plan/provider khi thương mại hoặc vượt quota |
| API | Render Free | Sleep/cold-start/runtime quota; cần dịch vụ khác/budget nếu không đạt cửa sổ job |
| DB | Supabase Free | Storage/egress/pause limits; không free Render Postgres30-day cho dữ liệu dài hạn |
| Scheduler | Supabase Cron/pg_net + durable jobs | HTTP wake có timeout/chi phí tài nguyên; không always-on guarantee |
| Android | Công cụ build local + signed APK | Máy/điện/công phát triển/test devices không bằng0; kiểm quy định phân phối/signing/verifications |
| Giá cổ phiếu/vàng | Chưa xác minh nguồn đáp ứng miễn phí và quyền dùng | Không dùng license chưa rõ; manual quote không thay automatic acceptance |
| AI | Local synthetic PoC hoặc provider có budget/terms phù hợp | Không có model runtime miễn phí được chứng minh đủ dùng thật; local không always-on, quota/latency/hardware riêng |
| Security/backup | Chưa có phương án protected real miễn phí được chứng minh | Key/runtime/client trust/restore có effort và hạ tầng; encryption-at-rest cloud không đủ |
| Domain | Dùng provider subdomain | Domain riêng tùy chọn, chưa mua |

Cost total = hosting + DB/storage/egress + source entitlement + model inference + backup/security + distribution + thời gian/thiết bị/điện. Theo dõi monthly caps và giới hạn dữ liệu; không silent paid fallback. Mô hình chi phí này thay estimate cũ gắn web-only, không suy số user chịu tải khi chưa benchmark workload thực.
