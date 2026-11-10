# ARCH-01 — Bản ghi thay đổi A + T1

08/10/2026 · **ACCEPTED BY OWNER; DOCUMENTATION UPDATED**. Owner chọn trực tiếp A + T1 trong chat; [ADR-008](adr/ADR-008-modular-backend-trusted-server.md) ghi quyết định và lý do. Không phải nghiệm thu implementation hoặc baseline mới.

## Những gì đã cập nhật và vì sao

| Hồ sơ | Thay đổi |
| --- | --- |
| [ARCH-01](ARCH-01-options.md) | Ghi A + T1 đã chọn, giữ alternatives và nguồn nghiên cứu; bỏ trạng thái chưa chọn/khuyến nghị T2 làm target hiện hành |
| [HLD v0.3](high-level-design.md) | Modular backend/shared Engine, API/Ops/worker entrypoints, module ownership/permissions, canonical ledger, ba flows, mapping đủ BE-01…21 |
| [Context v3](../requirements/context-model.md) | Ba clients/actors/providers, notification OS boundary, trusted infrastructure actor, IF-01…09 kế thừa và IF-10…13 mới |
| [Views v0.3](views/architecture-views.md) | Sáu views: components, Agent confirmation, T1 trust, receipt/posting, daily/manual prices, domain ownership |
| [SRS](../requirements/srs.md), [PRD](../product/prd.md), [security](../security/security-design.md) | Sửa rõ NFR-08/NFR-07 transport theo T1; app-admin/tenant isolation, TLS/encryption/redaction/backup/device và Agent authority tiếp tục; SEC-REAL-T1 vẫn NOT RUN |
| [ADR-003](adr/ADR-003-privacy-boundary.md), [ADR-006](adr/ADR-006-deployment-trust-profiles.md) | Thêm supersession notice, giữ nguyên nội dung lịch sử; protected-only không còn là gate T1 |
| [Agenda](architecture-decision-agenda.md), [architecture index](README.md), [LLD](low-level-design.md), [topology](deployment-topology.md) | Chỉ rõ quyết định tổng thể đã chốt và các chi tiết stack/platform/worker/security còn cần ARCH-02…13 |
| [Decisions](../handover/operational-decisions.md), [handover index](../handover/README.md), [baseline policy](../handover/baseline-policy.md) | Ghi delta sau r2; trust đã chọn, vendor/cost/recovery/provider chưa chọn; không sửa snapshots |
| [Spikes](../testing/technical-spikes.md), [backlog](../product/backend-backlog.md), [roadmap](../product/roadmap.md) | SP-10/11 chuyển sang T1 security/recovery, BE-18 tương ứng; giữ đủ 21 gói và các capability, không dùng anti-Ops cũ làm blocker bắt buộc |

20 tài liệu thiết kế/requirement/support được sửa hoặc tạo (gồm ADR-008); báo cáo này và hai evidence JSON là bản ghi bổ sung.

## Ranh giới phải hiểu đúng

T1 tin backend/runtime/DBA/backup/key operators và thừa nhận họ có khả năng đọc finance. Role admin trong ứng dụng vẫn chỉ metadata/safe operations. Không cam kết anti-Ops, không gọi encryption-at-rest/RLS là chống root. External model không tự thuộc trusted-server boundary; privacy/egress/terms/retention/cost cần quyết định riêng.

Owner confirm Agent draft chỉ lưu Plan/Goals/links/history, không actual ledger. Receipt ACK khác posted, quote mới không đổi cash/quantity/income. Mỗi workspace có canonical ledger, hai clients đọc cùng state có versions; coverage gap không được giấu.

## Kiểm tra và giới hạn

- [Validation tài liệu](../execution/evidence/arch-01-a-t1-2026-10-08/document-validation.json): PASS; 193 local link occurrences hợp lệ, markdown fences cân bằng, functional AC rows không đổi, đủ BE-01…21; API target2.0.0/133 operations.
- [Preservation SHA256](../execution/evidence/arch-01-a-t1-2026-10-08/preservation.json): PASS, 213 tệp before/after không đổi, gồm 174 frontend source files trong accepted manifest, 11 baseline r1/r2 files và 28 canonical contract/physical files.
- Diagrams được rà logic dạng text; không render/benchmark hoặc chạy runtime tests. Không chạy frontend suite, migrations/backend/native/security/provider/model/UAT trong lượt document-only.
- Không sửa frontend/API/schema/dependencies/lockfile hoặc immutable r1/r2. Không commit/push/deploy/provider call/phát sinh phí. Đây là working-doc delta sau r2, chưa seal revision mới.

Bước tiếp: **ARCH-02 — cấu trúc modules, entrypoints/dependencies và stack backend**, rồi ARCH-03 infrastructure/platform/cost và ARCH-04 schema/SQL execution. Thiết kế đã chọn T1 không tự bật real frontend transport hoặc thay NOT RUN thành PASS.
