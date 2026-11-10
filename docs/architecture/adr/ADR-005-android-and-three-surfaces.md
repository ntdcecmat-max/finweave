# ADR-005 — Ba giao diện, tái sử dụng React qua Capacitor

07/10/2026 · selected design direction; native PoC pending; documentation only.

**Context:** frontend hiện tại React/Vite là web synthetic. User yêu cầu admin web, user web và APK Android thu notification. Không có bằng chứng framework hiện tại phải bỏ.

**Decision:** giữ web; bổ sung Android Capacitor dùng bundled assets và Kotlin NotificationListenerService/WorkManager/encrypted Room outbox; console admin có entry/build/role riêng. Không gắn collection vào JavaScript timer hoặc plugin Push Notifications. Một backend/ledger cho cả hai user clients.

**Alternatives:** React Native/Flutter/Kotlin UI toàn bộ đều cần native collector; rewrite UI chỉ đáng cân nhắc nếu PoC hybrid thất bại có số liệu. PWA/browser thu notification app khác không đáp ứng yêu cầu. Android project và dependencies chưa được tạo.

**Gate:** signed APK trên real devices, receive sau screen-off/UI gone, offline/reboot/revoke/force-stop/redaction, account-switch và idempotency. Unsupported device/app phải công bố; không hứa tất cả. [PoC specification](../android-collector.md).

Nguồn: [Capacitor](https://capacitorjs.com/docs), [Android plugin](https://capacitorjs.com/docs/plugins/android), [NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService).
