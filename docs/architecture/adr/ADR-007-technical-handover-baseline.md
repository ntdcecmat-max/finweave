# ADR-007 — baseline bàn giao và phần chưa được phê duyệt

08/10/2026 · Chốt thiết kế local synthetic trong phạm vi tài liệu/artifacts; không phê duyệt real-data hoặc chi phí.

| Quyết định | Trạng thái / lý do |
| --- | --- |
| Canonical API | Chốt OpenAPI3.1.1 v2 JSON cho toàn bộ operation; derived schemas/examples/CSV, frontend source ghi nhận implementation. RPC POST giữ typed operation organization, tách identity/admin/internal |
| Dữ liệu | Chốt PostgreSQL16+ conventional synthetic, composite workspace keys, exact decimals, durable jobs/receipts/idempotency, history và transaction guards. Migration chỉ artifact; thực thi disposable còn gate |
| Backend | Chốt modular TypeScript/Fastify theo HLD, một authority Ledger/Engine/PlanGoals/Assistant; phiên bản package/lock chốt lúc backend implementation, không tạo runtime trong lượt này |
| Clients | Giữ user web/admin build riêng, Android bundled web shell + native service/worker/outbox; không remote JavaScript update cho real protected client trước đánh giá signing/trust |
| Local | Chốt loopback API+PG synthetic, scripted Assistant và synthetic sources; external spend cap0, no provider credentials hoặc billing signup |
| Cloud synthetic | Baseline tạm Render Free API + Supabase Free PG/Cron + Vercel Hobby personal static; không deploy trong lượt này. Cần quota/restore/cold-start PoC trước nhận cloud integration hoàn thành |
| Market/collector/model | Shortlist và fallback cụ thể trong [operational decisions](../../handover/operational-decisions.md); synthetic adapters là baseline được chốt. Real source license/credentials và device/template evidence chưa có |
| Anti-Ops | Giữ NFR-08/ADR-003/006. Conventional chỉ synthetic. Khuyến nghị protected PoC sau bản synthetic; không chuyển sang trusted-server nếu chưa có quyết định chủ sản phẩm rõ và cập nhật requirements |
| Protected storage | Candidate ciphertext store database riêng; chưa crypto protocol hoặc executable trusted processing. Không nhận là đủ bàn giao protected backend. KMS/signing/enrollment/recovery authority phải độc lập hạ tầng Ops |

Trade-off: conventional giúp xây/test nghiệp vụ với chi phí ngoài0 nhưng runtime/DBA đọc được mọi plaintext synthetic. Protected có thể bảo vệ real finance nếu attestation, independent keys/client distribution/recovery và anti-rollback chứng minh được; chi phí/vận hành phức tạp và metadata leakage còn đánh giá. Trusted-server đơn giản hơn nhưng thay cam kết root/Ops, chỉ là lựa chọn cần người dùng quyết định, chưa chọn.

Không tăng41 AC hoặc tạo AI spec mới. [Handover index](../../handover/README.md) xác định scope readiness, [validation](../../handover/validation-report.md) xác định kiểm tra thực chạy. Mọi quyết định kỹ thuật ở đây là đặc tả, không chứng cứ backend/native/cloud đã hoạt động.
