# Nguồn kiểm chứng kỹ thuật và chi phí

Rà soát07/10/2026 (Asia/Saigon). Tài liệu chính thức, desk review; không benchmark hoặc xác nhận tài khoản/quota của dự án. Các policy/giá cần kiểm lại lúc triển khai. Không đưa secrets hoặc mẫu ngân hàng thật vào lần rà soát này.

| Nguồn | Điều xác minh được / không suy ra |
| --- | --- |
| [Capacitor overview](https://capacitorjs.com/docs), [Android](https://capacitorjs.com/docs/android), [plugin guide](https://capacitorjs.com/docs/plugins/android) | Có runtime đưa web UI vào Android và native plugin. Không chứng minh frontend này đã được port hoặc plugin collector đã có |
| [Environment setup](https://capacitorjs.com/docs/getting-started/environment-setup) | Android cần SDK/Studio; iOS build có yêu cầu riêng, không nằm trong Android APK release |
| [NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService) | OS API nhận notification với quyền tương ứng và platform constraints; không guarantee mỗi bank/template/OEM |
| [Android15 behavior](https://developer.android.com/about/versions/15/behavior-changes-all), [restricted settings](https://support.google.com/android/answer/12623953?hl=en) | Sensitive/OTP redaction và hạn chế cấp quyền app có thể ảnh hưởng capture. Không né bảo vệ OS |
| [WorkManager](https://developer.android.com/develop/background-work/background-tasks/persistent) | Persistent background work cho upload/retry, không exact realtime notification delivery |
| [Release APK](https://developer.android.com/studio/publish/preparing), [developer verification](https://developer.android.com/developer-verification) | Build/sign/distribution phải được xem xét theo thiết bị/vùng/thời điểm; không khẳng định APK bất kỳ luôn cài không điều kiện |
| [Render Free](https://render.com/docs/free) | Idle spin-down, cold start, ephemeral filesystem, free PostgreSQL expiry; không chọn free DB này cho lâu dài |
| [Supabase pricing](https://supabase.com/pricing) | Free có quota/pause; không tự cho SLA/backup/security anti-Ops |
| [Supabase Cron](https://supabase.com/docs/guides/cron), [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) | Schedule SQL/HTTP; queue HTTP/timeout không thay durable business queue |
| [Vercel Hobby](https://vercel.com/docs/plans/hobby) | Personal non-commercial limits, không mặc định dùng cho SaaS thương mại miễn phí |
| [SSI FastConnect Data](https://guide.ssi.com.vn/ssi-products/fastconnect-data), [SSI hướng dẫn kết nối](https://guide.ssi.com.vn/ssi-products/tieng-viet/fastconnect-data/huong-dan-ket-noi) | Có market-data API/cách kết nối được mô tả; chưa xác minh quyền tài khoản, phí, cache hoặc redistribution cho FinWeave |
| [PNJ giá vàng](https://www.pnj.com.vn/blog/gia-vang/), [SJC](https://www.sjc.com.vn/) | Có nguồn công bố giá/thông tin sản phẩm; chưa chứng minh API public miễn phí hoặc quyền automation/redistribution |

## Kết luận giới hạn

Không có provider credential/API probe hay dữ liệu giá live được đưa vào hệ thống. Không xác minh nguồn tự động miễn phí đủ quyền chỉ bằng thấy một trang bảng giá. Các lựa chọn stack/topology/Agent là suy luận thiết kế từ requirements và capability nền tảng, không claim vendor endorsement hay implementation đã chạy.
