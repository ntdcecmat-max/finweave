> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

# FinWeave — Scope v3

07/10/2026 · yêu cầu cho sản phẩm vận hành · chỉ sửa tài liệu. [PRD](prd.md) định nghĩa sản phẩm, [SRS](../requirements/srs.md) định nghĩa hành vi và AC. [Scope-v2](../governance/baselines/pre-realignment-2026-10-07/docs/product/scope.md) được giữ để truy vết lịch sử.

## Đích sản phẩm và mức bằng chứng

- M1/M2 là bằng chứng prototype/mock lịch sử, không phải đích sản phẩm. M2 có báo cáo kiểm thử synthetic, chưa có backend/Android/security/UAT thật.
- R1: core vận hành ba giao diện, Android ingestion, giá hằng ngày/chủ động và đồng bộ.
- R1.1: Plan/Goals/simulation có Agent tích hợp vào tạo, so sánh và điều chỉnh draft; user preview/confirm để áp dụng. Đánh giá Agent là gate chất lượng, không tách Agent thành chat ngoài Plan/Goals. Không xóa chức năng frontend; AI không chặn tracking khi model lỗi.
- Trợ lý hỏi–đáp/giải thích, chat/history, evidence/context và linh vật tiếp tục là tính năng sản phẩm; Agent phát triển thêm trong cùng trợ lý. Nguồn yêu cầu AI duy nhất: [AI-SPEC-001](ai-agent-specification.md), kế thừa mã REQ-AI và nối mã REQ-AGENT.
- R2: nguồn bổ sung, tối ưu hoặc iOS viewer khi được chọn; không mặc định iOS thu được thông báo app khác.

## R1

| Nhóm | Phạm vi |
| --- | --- |
| Bề mặt | Admin web, user web, user Android APK; một backend/ledger, phân quyền server |
| Tiền | Bank/wallet/cash; opening/date/coverage, thu/chi/transfer/refund, correction history và CSV/manual fallback |
| Tài sản | Cổ phiếu VN thuộc catalog hỗ trợ: mã + số lượng; vàng: số chỉ sau một lần chọn hồ sơ chuẩn |
| Nguồn | Notification Android cho app đã kiểm chứng; daily/manual price, freshness, Review và quản lý thiết bị |
| Sync | Outbox bền vững, idempotency/dedupe, version, catch-up, restart/revoke/error |
| Admin | Metadata vận hành, quản lý parser/provider, retry/disable có audit; không đọc tài chính user |
| Chất lượng | Decimal, nguồn/đơn vị rõ, privacy/authorization, backup/restore, giới hạn free tier và UAT thật |

Năm navigation hiện có áp dụng cho user UI, không bắt console admin cũng có năm đích. Native settings/collector health là phần mới; responsive viewport chưa chứng minh capability Android.

## Ngoài R1

SMS/email/accessibility scraping; iOS collection/IPA; chuyển tiền hoặc trading; mọi ngân hàng/ví; tự biết quantity từ quote; bảo đảm dữ liệu đủ khi điện thoại tắt; AI tự sửa ledger; SLA miễn phí; domain mua riêng. Không âm thầm hạ yêu cầu anti-Ops.

## Kế thừa và ưu tiên

28 REQ/AC v2 giữ ID và lịch sử. Invariant money/transfer/refund/missing/snapshot/plan/simulation vẫn áp dụng. SRS ghi migration và thêm AC-29…41; test cũ không chứng minh AC mới đã đạt.

Ưu tiên: chỉ dẫn mới của user → PRD/scope-v3 → SRS-v3 → ADR/architecture/contracts đích → tài liệu mock lịch sử. Ideas là đầu vào brainstorm, không thay PRD. Yêu cầu bảo mật chưa được thay thế vẫn giữ; cloud tiết kiệm và anti-Ops phải ghi thành hai profile riêng với giới hạn rõ ràng.
