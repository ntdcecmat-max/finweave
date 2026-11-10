> Cập nhật 08/10/2026: **ARCH-01 A + T1 đã được owner chọn** tại [ADR-008](ADR-008-modular-backend-trusted-server.md). Target real hiện hành là TRUSTED-SERVER; phần bắt buộc anti-Ops/protected-only/ciphertext-only dưới đây được supersede cho T1. Giữ nội dung cũ để truy lịch sử; logical DTO/transport separation, auth/tenant/admin isolation và no fake crypto vẫn áp dụng. Current frontend fail-closed transport không đổi và chưa có real-data acceptance.

# ADR-006 — Chi phí cloud và ranh giới tin cậy

07/10/2026 · conflict identified; lựa chọn cho real data còn mở. Không thay NFR-08/ADR-003 bằng một bảo đảm thấp hơn.

## Context

Ideas§15–16, SRS-v2 NFR-08 và security-design yêu cầu cả root Ops/DBA không xem finance, không giả user hoặc sửa code/key policy để đọc. User mới ưu tiên miễn phí và server đồng bộ web/mobile; chưa nói bỏ yêu cầu này. App admin không có quyền xem dữ liệu và chủ hạ tầng không thể giải mã là hai cam kết khác nhau.

## Các profile

| Profile | Tin ai / dữ liệu | Trạng thái |
| --- | --- | --- |
| SYNTHETIC-CLOUD | Runtime/DBA thông thường, chỉ dữ liệu giả; Render API/Supabase PG/Vercel clients | Được đặc tả để làm integration PoC; chưa deploy |
| TRUSTED-SERVER | Backend runtime, DBA/host được tin xử lý plaintext; app-admin role bị hạn chế UI/API | Phương án tiết kiệm nếu user chủ động đổi privacy requirement; chưa được chọn cho real finance |
| PROTECTED-REAL | Chỉ owner client + protected workload đã xác minh; Ops lưu ciphertext, keys/client signing/enrollment độc lập | Giữ làm target của yêu cầu hiện có; vendor/cost/key authority/client distribution chưa được chứng minh |

## Decision

Tài liệu tiến hành đầy đủ trên logical contract và synthetic topology; real integration vẫn fail closed. Không gán RLS/TLS/encryption-at-rest chức năng chống root runtime. Không khai báo cloud miễn phí đáp ứng PROTECTED-REAL. Không dùng thời gian chờ hoặc sửa docs như sự đồng ý hạ bảo mật.

Nếu chủ sản phẩm chọn TRUSTED-SERVER sau khi xem tradeoff, cần sửa rõ NFR-08/Ideas/security/auth/transport/retention và threat tests trước triển khai real data. Nếu giữ PROTECTED-REAL, phải PoC trusted client/attestation/key/recovery và xác định ngân sách trước chọn cloud cuối cùng. Các công việc Android/provider/Agent trên synthetic vẫn tiến hành được.

Đây là dependency thiết kế thật, không phải kết luận sản phẩm không thể làm. Không có thay đổi code hoặc hành động cloud trong ADR này.
