# FinWeave — Báo cáo kiểm chứng và chỉnh hướng tài liệu

Rà soát07–08/10/2026 (Asia/Saigon). Phạm vi **documentation only** theo yêu cầu user; không frontend/backend implementation, không deploy. Đây là technical/product desk review và tự kiểm nhất quán, chưa user research, independent security audit hoặc UAT.

## 1. Kết luận

Tài liệu cũ phù hợp cho web prototype dữ liệu giả, nhưng **chưa đủ và lệch đích** so với sản phẩm vận hành user vừa làm rõ. Không có căn cứ kết luận React/Vite phải bỏ. Những phần cần sửa chủ yếu là phạm vi sản phẩm, mobile native/nguồn/sync, deployment thực, tính khả thi giá miễn phí và vai trò Agent trong Plan/Goals.

## 2. Findings có bằng chứng

| Finding | Bằng chứng hiện trạng | Sửa và lý do |
| --- | --- | --- |
| F-01 PRD/SRS lấy milestone mock làm đích | PRD v2: mục tiêu web responsive local, nguồn thật/collector hoãn; SRS28 AC phần lớn synthetic | PRD/scope/SRS-v3 tách product requirements khỏi trạng thái M2, thêm13 AC/6 NFR vận hành; tránh coi frontend demo là sản phẩm hoàn chỉnh |
| F-02 Chưa đủ ba bề mặt | Ideas có ý admin/collector nhưng scope triển khai và code chỉ user web; không Android/Capacitor manifest hay native project | Đặc tả user web, Android APK và admin console; native permission/outbox/worker, quyền admin riêng; tránh coi mobile viewport là app đã cài |
| F-03 Stack đề xuất cũ không khớp implementation | package.json/ADR001 dùng CSS nội bộ/Radix, không Tailwind/shadcn/Table như đề xuất cũ; stack còn nói chưa code | Tech stack ghi đúng manifest hiện tại, giữ React; thêm Capacitor+Kotlin có PoC gate thay vì rewrite tùy tiện |
| F-04 Giá/notification còn demo | INPUT-02 dummy connection, fixture quotes và notification sample; chưa provider entitlement hoặc device tests | Luồng ticker+quantity/gold profile+chỉ, daily/manual jobs, supported sources/coverage, fail/partial/duplicate/retry và timestamp semantics |
| F-05 Thiếu deployment vận hành khả thi | Kiến trúc cũ tập trung protected runtime còn mở, chưa tọa độ/schedule/recovery cho3 clients | Thêm topology conventional synthetic, DB persistent, external scheduler/leases/cold-start, polling/restore/cost; protected real giữ giới hạn riêng |
| F-06 “AI” đang scripted read routing | `finweave-web/src/mocks/scripted-assistant.ts` dùng regex chọn report/portfolio/plans/goals/simulation và trả mode scripted_mock | Agent co-create Plan/Goals và investigation: clarification, iterative simulation, drafts, preview/confirm, evaluation với baseline deterministic; không đổi tên UI thành proof Agent |
| F-07 Miễn phí xung đột yêu cầu anti-Ops | Ideas§15, SRS NFR-08, Security Design/ADR003 đòi chống cả root/DBA; ProtectedTransport ném SECURITY_TRANSPORT_NOT_VERIFIED trước gọi thật | ADR006 phân biệt app-admin permissions với operator privacy; không claim Render/Supabase plaintext đạt anti-Ops hoặc tự bỏ gate |
| F-08 Tài liệu chưa đủ traceability cho hướng mới | API1.1/codegen và test evidence cũ chỉ mock | Thêm API/data/UI delta, RTM/test plan mới; giữ schema runtime và test lịch sử nguyên trạng; archive12 tài liệu trước sửa |

Bằng chứng code được đọc tĩnh từ [manifest](../../finweave-web/package.json), [App](../../finweave-web/src/app/App.tsx), [scripted assistant](../../finweave-web/src/mocks/scripted-assistant.ts), [blocked transport](../../finweave-web/src/services/protected-transport.ts), [contracts](../../finweave-web/src/contracts/operations.ts). Không mở UI để tuyên bố đã visual-test toàn frontend; không chạy lại tests ứng dụng trong lượt docs-only.

## 3. Tài liệu đã sửa/tạo

| Nhóm | Tài liệu hiện hành |
| --- | --- |
| Sản phẩm | [PRD](../product/prd.md), [Scope](../product/scope.md), [SRS](../requirements/srs.md), [Feasibility](../product/feasibility-study.md), [Cost](../product/cost-model.md), [Roadmap](../product/roadmap.md), BR-37…44 trong [Rules](../product/business-rules.md) |
| Tech/architecture | [topology hiện hành; nguồn Tech Stack ở root đã bị xóa](../architecture/deployment-topology.md), [HLD](../architecture/high-level-design.md), [LLD](../architecture/low-level-design.md), [Views](../architecture/views/architecture-views.md), [Android](../architecture/android-collector.md), [Deployment](../architecture/deployment-topology.md), [ADR005](../architecture/adr/ADR-005-android-and-three-surfaces.md), [ADR006](../architecture/adr/ADR-006-deployment-trust-profiles.md) |
| Plan/Goals Agent | [Agent spec](../product/ai-agent-specification.md): PG-01 tạo từ Goal, PG-02 tạo từ Plan, PG-03 điều chỉnh theo actual, INV-01 điều tra |
| Tích hợp/kiểm thử | [Data model](../data/logical-data-model.md), [API delta](../contracts/operational-api-spec.md), [UI delta](../design/operational-design-delta.md), [RTM v3](realignment-traceability.md), [Acceptance plan](../testing/operational-acceptance-plan.md) |
| Quản trị | README/index/precedence notes, D-47…52, artifact register; [snapshot và manifest](../governance/baselines/pre-realignment-2026-10-07/manifest.json) |

Các file phụ cũ được gắn notice đầu file để không đọc scope mock như yêu cầu vận hành hiện tại. Nội dung lịch sử/fixture/rules/evidence giữ lại; không giả làm mọi trang legacy đã được viết lại chi tiết. API v2 là draft contract delta, chưa executable OpenAPI/schema. Physical SQL protected profile còn mở; tài liệu data là logical mapping và proposal, không migration chạy được.

## 4. Agent tích hợp Plan/Goals như thế nào

User nêu mục tiêu → Agent đọc dữ liệu đủ quyền/coverage, hỏi ràng buộc → tạo GoalDraft+PlanDraft liên kết → Engine tính cashflow/khả thi/shortfall → user chỉnh bằng hội thoại hoặc form → Agent mô phỏng lại/so phương án → preview → user xác nhận → service lưu bundle/version/audit. Khi thực tế lệch, Agent điều tra rồi đề xuất amendment draft.

Agent được ghi **draft**, không tự xác nhận active changes hoặc ghi actual money. Draft persistence là thay đổi rõ so với read-only assistant cũ, đã nối PRD/SRS/BR/API/data/design/tests. Tools vẫn là cách Agent hành động; giá trị cần đo nằm ở clarification/branching/iteration, không một danh sách tool dài hơn.

## 5. Giới hạn còn cần quyết định/thử nghiệm

- Chọn và thử một ngân hàng + một ví cụ thể trên Android/OEM; capability của nền tảng chưa chứng minh support thực tế.
- Xác minh provider/entitlement cổ phiếu và vàng. Chưa có API miễn phí/redistribution được xác nhận cho FinWeave; trang công bố giá không đủ. Gold quantity-only cần profile xác nhận một lần.
- Giải quyết trust model: giữ anti-Ops thì cần protected PoC/budget; chọn trusted-server phải thay requirement rõ. Chưa tự chọn giảm privacy.
- Model/provider/hardware/privacy/cost và benchmark giá trị Agent chưa được thử. Local inference không tự đáp ứng cloud luôn online/anti-Ops.
- Native APK/backend/admin/jobs/schema mới chưa build. Free-tier pause/cold-start và backup/restore chưa được đo; target SLO/eval thresholds là đề xuất thiết kế.

[Nguồn chính thức đã đọc](../architecture/feasibility-sources.md) ghi rõ capability và giới hạn. Việc kiểm chứng ở đây là tài liệu/implementation inspection, không chứng nhận hệ thống chạy thật.

## 6. Verification

Kết quả kiểm tra documentation và frontend hashes được ghi trong [verification report](document-realignment-verification.md). Không lấy git working tree bẩn có sẵn làm thay đổi do lượt này; hash snapshot riêng được dùng để kiểm tra frontend nguyên trạng. Không deploy, không nâng dịch vụ trả phí, không gửi tài chính thật cho provider/model.
