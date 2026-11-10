# Sources — ARCH-11

**FW-SOURCES-DESIGN-001 · 09/10/2026 · DESIGN SPECIFIED / REAL SOURCES NOT ACTIVATED.**
Kế thừa toàn bộ feature hiện có: nhập tài sản, notification capture, manual/CSV, cập nhật giá hằng ngày/chủ động, Review/provenance, Plan–Goals/Agent và admin vận hành. Nguồn thật chưa chọn cuối cùng hoặc chưa có quyền/PoC không làm mất feature; adapter và acceptance vẫn phải xây đầy đủ, dùng synthetic để kiểm trước.

| Hồ sơ | Nội dung |
| --- | --- |
| [Options/decisions](source-options-and-decisions.md) | SSI V3, nguồn được cấp phép, Vnstock, PNJ/SJC, ngân hàng/ví và các thông tin còn thiếu |
| [Collector profiles](collector-profiles.md) | Package/signer/version/template, finality, account binding, duplicate/transfer và privacy |
| [Market normalization](market-normalization.md) | Exact money/unit/side/profile/time, catalogue, lịch phiên, correction/fallback |
| [Entitlements/egress](entitlements-and-egress.md) | Access/cache/display/redistribution/history/derived/LLM rights, secret/quota/revocation |
| [Contract/storage addendum](contract-storage-addendum.md) | API004/DB005, thiếu binding, wallet projection, versioned config và consumer mapping |
| [Operational policy](operational-policy.md) | Daily/manual, timeout/backoff, last-good, support lifecycle và phục hồi |
| [Acceptance](acceptance-plan.md) | 32 ca runtime chưa chạy, đầu vào và evidence phải có |

[Policy](source-policy.json) · [Provider registry](provider-registry.json) · [Profile schemas](profile-schemas.json) · [Storage/consumer mapping](contract-storage-map.json) · [Traceability](requirement-traceability.json) · [Research](research-sources.json) · [Bundle/hashes](implementation-bundle.json).

## Hiện trạng và precedence

Nguồn cơ sở chốt là synthetic + owner-confirmed manual/CSV. SSI FastConnect **V3 read-only market data** là ứng viên cổ phiếu ưu tiên để PoC; PNJ/SJC là bảng đối chiếu ứng viên vàng, **chưa chứng minh public API hay quyền tự động lấy/chia sẻ dữ liệu**. VCB Digibank/MoMo chỉ shortlist, chưa phải app owner đã chọn; signer/version/thiết bị/template thật còn thiếu, supported=false. Chi phí provider và quyền SaaS chưa được xác nhận; không suy ra total cost=0 từ API miễn phí.

API hiện hành vẫn [FW-API-T1-D1J2-004153ops/634schemas](../contracts/v2-t1-r4/README.md); PostgreSQL [FW-PHYS-T1-ASYNC-00587tables/1001columns](../data/target-t1-async/README.md); Android [bridge2/native design](../android/README.md). **SSI V3 là phiên bản upstream, không đổi FinWeave API v2.0.0.** Không sửa các gói đã niêm phong/r1/r2 hay runtime frontend. ARCH11 làm rõ giới hạn binding/Review và nguồn; ARCH06–10 tiếp tục quyết định auth/security/ledger/async/native. Nếu rights cần retention hoặc payload mới vượt hợp đồng hiện tại, dừng nguồn đó và tạo revision có migration, không nhét field mới vào API004.

Static/schema/model checks trong package chỉ kiểm tính nhất quán tài liệu và ví dụ giả; không kiểm parser VCB/MoMo, API SSI, vàng thật, SQL, APK hay chất lượng end-to-end. ARCH-12 tiếp theo chốt Agent/model/evals; ARCH-13 vận hành; các source PoC là release gates độc lập.
