# UI/UX v3 — điểm vào và bản đồ thay đổi

DES-DELTA-001 · v1.0 · 08/10/2026 · documentation only.

Phần delta định hướng trước đây đã được đưa vào **bộ đặc tả chính**. Không còn dùng một bảng bổ sung ngắn như thay thế thiết kế chi tiết. [PRD](../product/prd.md), [SRS](../requirements/srs.md), [AI-SPEC-001](../product/ai-agent-specification.md) giữ authority chức năng; các tài liệu dưới đây mô tả giao diện/hành vi.

| Cần đọc | Tài liệu hiện hành / nội dung |
| --- | --- |
| Màn nào giữ, mở rộng, mới | [Catalogue](interface-catalogue.md): user core/shared/native/admin/auth, route hiện có và route đề xuất |
| Người dùng đi thế nào | [UX/UI](ux-ui-specification.md): IA năm navigation,16flows, hierarchy, copy, responsive |
| Mỗi màn làm gì | [Screen behavior](screen-behavior-specification.md): input/action/validation/quyền/states/forms/Review/Agent confirmation |
| Android có gì riêng | [Android UI](android-ui-specification.md): permission/allowlist/mapping/test/native queue/retention/APK/real-device acceptance |
| Admin có gì riêng | [Admin UI](admin-ui-specification.md): metadata screens, retry/disable/audit, privacy/rights |
| Thành phần và style | [Components](component-specifications.md), [Patterns](pattern-library.md), [Design system](design-system.md): kế thừa tokens/controls/mascot/charts, thêm components mới |
| Đăng nhập và sử dụng an toàn | [Authentication](authentication-specification.md), [A11y](accessibility-requirements.md): session/role/cache/native/mask/keyboard/motion |
| Đối chiếu yêu cầu/kiểm thử | [UI RTM](ui-requirement-traceability.md):41parent AC,24AI-FR/8AI-NFR,26 nhóm UI check: trạng thái CHECKED_SUBSET/NOT_RUN theo RTM hiện hành |
| Đã sửa gì và kiểm tài liệu ra sao | [Báo cáo thay đổi](../execution/ui-documentation-update.md) |

**Kế thừa:** năm navigation; account/Tx/CSV/Review/report/Plan/Goals/simulation thủ công; Q&A/chat/history/context/evidence/mascot. **Mở rộng:** stock/gold input, giá daily/manual, source/device/coverage, shared Agent draft and run states. **Mới:** Android native screens, admin operational screens, linked draft editor/run detail và UI trace/acceptance.

UI specs này thay phần mô tả đích bị lỗi thời trong design docs; các file nguồn cũ được [snapshot byte-for-byte](../governance/baselines/ui-before-v3-2026-10-08/manifest.json). Evidence Step3…6 vẫn lịch sử, không coi các bổ sung đã implement hoặc PASS. Đó là trạng thái tại lượt cập nhật tài liệu ban đầu. Sau đó đã bổ sung UI/mock user/admin/Agent và wizard Android; xem [triển khai](../execution/ui-implementation-2026-10-08.md), [catalogue hiện hành](interface-catalogue.md) và [nghiệm thu](../testing/frontend-acceptance-report.md). Core vẫn v1.1; operational prototype chưa canonical v2; native chưa triển khai.

Đủ cơ sở để dựng wireframe và bổ sung UI có truy vết; **chưa phải bộ mockups pixel hoàn chỉnh, generated API v2, Android/admin runtime hoặc UAT đã đạt**. Security/privacy/native/source/provider/contract gates theo hồ sơ hệ thống vẫn giữ.