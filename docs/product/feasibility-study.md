# Feasibility v3 — khả thi có điều kiện

07/10/2026 · desk review, chưa native/backend/provider PoC. [Audit](../execution/product-realignment-audit.md), [nguồn kiểm chứng](../architecture/feasibility-sources.md).

| Hạng mục | Kết luận / điều kiện cần chứng minh |
| --- | --- |
| React web → APK | Có đường Capacitor/native plugin; chưa có Android code/APK trong repo. Giữ frontend, thử native collector trước quyết định rewrite |
| Đọc notification Android | Nền tảng có NotificationListenerService; mỗi app/OS/OEM vẫn cần test, không lịch sử đầy đủ/OTP/force-stop guarantees |
| Cổ phiếu chỉ mã+quantity | Form khả thi với instrument catalog; provider server entitlement chưa được chứng minh. SSI có tài liệu API, không tự đồng nghĩa free redistribution cho mọi user |
| Vàng chỉ quantity | Khả thi sau xác nhận profile; trang giá PNJ/SJC không chứng minh có API miễn phí được phép dùng/phân phối. Chưa chọn provider thực |
| Daily/manual và sync | Backend jobs + PG persistence + polling khả thi về thiết kế; free-tier pause/cold-start làm SLA có điều kiện, phải PoC 7 ngày |
| Ba giao diện | Cùng React và backend có thể tiết kiệm công; admin cần authorization riêng, mobile cần native code; hiện chỉ web prototype |
| Agent trong Plan/Goals | Tác vụ draft/clarify/simulate/replan có giả thuyết giá trị; model/privacy/cost/eval chưa chứng minh, manual fallback vẫn cần |
| Miễn phí + anti-root-Ops | Chưa có cấu hình đáp ứng đồng thời. Free cloud conventional chỉ synthetic; protected real giữ gate hoặc user quyết định đổi trust model |

## Chọn ít nguồn nhưng kiểm thật

Trước R1 chọn một ngân hàng và một ví người dùng cần, thu samples đã khử nhạy cảm có quyền, lập support matrix/template/parser và device tests. Chưa có tên được chọn nên không tự tuyên bố hỗ trợ bất kỳ ngân hàng nào.

Provider cổ phiếu cần xác minh coverage HOSE/HNX/UPCOM theo phạm vi đã chọn, unit, quote delay/market day, authentication, quota, phí, caching/display/redistribution rights. Provider vàng cần profile/brand/purity/side/unit/time và quyền máy đọc. Giá tham chiếu thủ công là fallback minh bạch, **không đạt yêu cầu automatic daily price**. Nếu không có nguồn miễn phí phù hợp, phải báo dependency/budget còn mở, không scrape không kiểm quyền hoặc dùng giá giả.

## Privacy là quyết định có ảnh hưởng phạm vi

App-admin không xem finance có thể thiết kế bằng role/API; chống cả DBA/root Ops đòi trust/key/client/runtime khác. [ADR-006](../architecture/adr/ADR-006-deployment-trust-profiles.md) giữ rõ hai mức, không tự giảm yêu cầu. Hoàn thiện documentation và synthetic PoC không cần đưa dữ liệu thật vào môi trường chưa đủ điều kiện.
