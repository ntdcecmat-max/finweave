# Android implementation design — ARCH-10

> **Pilot 11/10/2026:** [APK 0.1.1](../../artifacts/android/README.md) đã build/lint/ký; [evidence](../execution/android-pilot-2026-10-11.md). Đây là synthetic UI shell, chưa collector/native identity/outbox và chưa kiểm điện thoại thật. Notices NATIVE NOT BUILT dưới đây thuộc design baseline; BE-20 chưa nghiệm thu.

**FW-ANDROID-DESIGN-001 · 09/10/2026 · DESIGN SPECIFIED / NATIVE NOT BUILT / NOT RUN.**
Kế thừa React/Vite đã nghiệm thu synthetic, thêm **Capacitor8 + Kotlin** cho Android. Không viết lại UI bằng framework khác. Listener, native identity, Room, Keystore và WorkManager là phần native phải xây; WebView đóng không được là điều kiện để upload. Đây là đặc tả chuẩn bị implementation, chưa phải APK/PoC chạy thật.

| Hồ sơ | Nội dung |
| --- | --- |
| [Architecture/support](architecture-and-support.md) | Component ownership, Android/OEM matrix, permission và giới hạn |
| [Capture/identity](capture-and-identity.md) | Filter, parser, event/revision, binding, native auth, revoke |
| [Local storage](local-storage.md) | Room ciphertext, tám bảng local, clock/retention, owner isolation |
| [Bridge/consumer](bridge-and-consumer.md) | Giữ bảy methods cũ qua adapter; native bridge2 riêng API004 |
| [APK/release](apk-release.md) | Toolchain, signing, upgrade, artifact, free distribution có điều kiện |
| [Sequences](sequences.md) | Capture→durable ACK, logout/recovery, update |
| [Acceptance](acceptance-plan.md) | 32 ca Android thực tế NOT RUN, evidence bắt buộc |

[Policy](android-policy.json), [bridge schemas](native-bridge-schemas.json), [local model](local-model.json), [consumer operation map](consumer-operation-map.json), [traceability](requirement-traceability.json), [bundle pin](implementation-bundle.json). Các fixture/schema/model checks chỉ kiểm tài liệu, không thay thế Android instrumentation, crypto interoperability, SQL hay APK nghiệm thu.

Backend giữ [API004153operations/634schemas](../contracts/v2-t1-r4/README.md), [DB00587bảng/1001cột](../data/target-t1-async/README.md), [identity](../security/identity/identity-access-design.md), [T1](../security/t1/README.md), [J2/ACK](../async/README.md). Native Room là database trên điện thoại, **không cộng tám bảng local vào PostgreSQL**. Giữ nguyên tất cả feature user/Plan–Goals/Agent/manual/CSV; collector optional, quyền OS không phải điều kiện để dùng phần còn lại.

Sáu [màn Android UI-M-01…06](../design/android-ui-specification.md) vẫn native_pending. Frontend cũ còn cần migration adapter/reauth/bridge khi implementation, chưa kết nối bằng công việc này. ARCH-11 tiếp theo chốt nguồn ngân hàng/ví/giá và license/parser samples; ARCH-12 Agent; ARCH-13 vận hành.
