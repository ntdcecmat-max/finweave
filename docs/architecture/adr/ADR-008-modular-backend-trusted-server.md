# ADR-008 — Modular backend A và trusted-server T1

08/10/2026 · **ACCEPTED BY OWNER — DESIGN, NOT IMPLEMENTED** · ARCH-01.

## Context và quyết định

Owner chọn trực tiếp: **“tôi chọn A + T1 bạn hãy cập nhật lại tài liệu ARCH-01/HLD/context/views đi”**, sau khi được giải thích T1 không bảo đảm toàn bộ sản phẩm miễn phí. [Options](../ARCH-01-options.md) so sánh A/B/C và T1/T2/T3. Đây là quyết định thiết kế, không cấp ngân sách hoặc cho phép nhận dữ liệu thật ngay.

**A:** modular backend cùng codebase/domain/Financial Engine; user/device API, Ops API và durable workers tách entrypoints/lifecycle/quyền. PostgreSQL/durable DB jobs là baseline để rà chi tiết. Giữ toàn bộ BE-01…21, không cắt feature.

**T1 TRUSTED-SERVER:** backend/runtime/DB/backup/key operators được tin xử lý finance và có khả năng kỹ thuật đọc plaintext. App-admin dùng identity/session/permissions/DTO riêng, chỉ operational metadata/safe commands; không finance read, impersonation, actual write hoặc admin recovery bypass.

## Thay thế có phạm vi

- Thay target root/DBA/Ops không đọc finance của NFR-08 kế thừa bằng trusted-server boundary trong [SRS](../../requirements/srs.md) và [security design](../../security/security-design.md).
- Supersede phần bắt buộc PROTECTED-REAL/ciphertext-only transport/independent attestation-key-client authority trong [ADR-003](ADR-003-privacy-boundary.md) và [ADR-006](ADR-006-deployment-trust-profiles.md) cho target T1. Giữ nguyên nội dung cũ để truy lịch sử; separation DTO/transport, auth/tenant/admin isolation và no fake crypto vẫn áp dụng.
- T2/T3 là alternative; anti-Ops PoC không còn gate T1. Không tuyên bố PoC đã PASS.
- NFR-07/19/20, consent/minimization, encrypted native outbox, TLS, secrets/redaction, backup/recovery và Agent/owner authority tiếp tục theo T1.

## Lý do và hậu quả

A giữ consistency/atomicity/shared Engine đơn giản hơn distributed services ở hiện trạng; vẫn tách API/worker và scale khi có measurement. T1 bỏ dependency protected runtime/key distribution để dùng hạ tầng phổ thông, phù hợp hướng ưu tiên miễn phí. Root/DBA compromise hoặc misuse là rủi ro thừa nhận; encryption-at-rest/RLS không loại bỏ được.

Mỗi workspace một canonical ledger. Agent chỉ drafts; owner confirm chỉ ghi Plan/Goals/links/history, không actual ledger. Receipt ACK khác posting; quote chỉ đổi valuation.

T1 không tự cho phép external model nhận finance. ARCH-12 phải chốt inference/context/terms/retention/budget. Server-managed auth/key recovery cần LLD riêng; T1 không tự chọn reset flow hoặc cấp app-admin quyền recovery rộng.

## Phần chưa chốt và nghiệm thu

ARCH-02…13 chốt stack/modules, infrastructure, schema, contracts/adapters, identity, T1 security, Engine, jobs, Android, sources, Agent và operations. Không chọn vendor/domain/replicas/model/paid plan tại đây.

Backend/SQL/auth/native/providers/model/security/UAT vẫn NOT RUN. **SEC-REAL-T1** yêu cầu tenant/admin/object/device authorization, transport/secrets/redaction, native consent/outbox, encrypted storage/backups, restore/erasure và provider/privacy controls có evidence. Current blocked frontend transport giữ nguyên tới implementation/integration task và tests phù hợp.

[HLD](../high-level-design.md), [context](../../requirements/context-model.md), [views](../views/architecture-views.md) là thiết kế hiện hành. API/schema bytes và immutable r1/r2 không đổi; working docs là delta sau r2, chưa có baseline mới. Không frontend/backend code, deploy, paid resource hoặc real provider calls trong lượt này.
