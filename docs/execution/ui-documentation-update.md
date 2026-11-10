> Hồ sơ của lượt cập nhật **chỉ tài liệu**, được giữ nguyên bối cảnh lịch sử. Việc triển khai và rà soát sau đó nằm ở [implementation 08/10](ui-implementation-2026-10-08.md) và [nghiệm thu frontend](../testing/frontend-acceptance-report.md); các câu “chưa thực hiện” bên dưới nói về thời điểm bàn giao tài liệu.

# UI/UX documentation update — thay đổi và giới hạn

DOC-UI-UPDATE-001 · 08/10/2026 · thực hiện theo hướng user đã đồng ý; chỉ documentation.

## 1. Những gì thay đổi, nói dễ hiểu

| Phần | Đã bổ sung/sửa | Vì sao |
| --- | --- | --- |
| Danh mục giao diện | Phân rõ user web, user Android, admin; mỗi màn có mã, route hiện có/đề xuất và trạng thái kế thừa/mới | Không coi responsive web là đã có app Android hoặc admin |
| Luồng sử dụng | Viết16 hành trình: giữ các nghiệp vụ cũ; thêm cài/thiết lập Android, notification→server→hai UI, giá, Agent và vận hành | Designer/build/test hiểu user bắt đầu ở đâu, kết thúc thế nào và gặp lỗi làm gì |
| Màn và form | Quy định input/action/validation/quyền/preview/confirm/loading/empty/error/stale/conflict/uncertain | Tránh tự đoán hành vi hoặc báo thành công khi chưa có kết quả server |
| Stock/gold | Stock chọn mã + số lượng; gold xác nhận profile một lần + số chỉ; quantity/cost/evidence vẫn giữ | Đúng cách nhập đơn giản user cần nhưng không gán sai instrument/loại vàng/giá |
| Giá và đồng bộ | Daily/manual job, last-good/asOf/partial/quota; device/coverage/receipt và snapshot version | Giá cũ không thành0; upload ACK không bị gọi là đã ghi sổ; web/mobile có cùng authority |
| Android | Tài liệu mới cho consent/quyền OS/app nguồn/account mapping/test/queue/offline/revoke/logout/APK | Chỉ rõ phần native thật cần xây và kiểm trên điện thoại |
| Admin | Tài liệu mới cho sources/parsers/jobs/quota/releases/incidents và account/device metadata | Có giao diện vận hành thực chất, vẫn không đọc tài chính/chat/raw của user |
| Agent trong Plan/Goals | Goal-first/Plan-first, hỏi ràng buộc, draft liên kết, Engine compare, chỉnh chat/form, owner confirm, actual replan/điều tra | Agent tham gia công việc mở nhiều bước; không chỉ là nút trigger hay tự sửa tài chính |
| Components/pattern/style | Giữ tokens/controls/chart/mascot, bổ sung picker/profile/refresh/device/queue/draft/run/admin compositions | Kế thừa frontend hiện có để tiếp tục phát triển, không tái thiết kế từ đầu |
| Auth/a11y | Cập nhật session/role/cache/native permission, mask, keyboard/TalkBack/motion/focus | Đúng ba surface và không biến auth/security mock thành bảo đảm production |
| Traceability/acceptance | Mã50 màn/compositions,16flows,20components,17patterns;41parent AC và32 AI refinements được nối tới26 nhóm UI checks | Có căn cứ bàn giao và kiểm tra; các nhóm check không phải requirements sản phẩm mới |

## 2. Những gì được kế thừa

Giữ năm user navigation, các nghiệp vụ tài chính và luồng Plan/Goals/mô phỏng thủ công. Giữ Q&A/giải thích, full chat, lịch sử, panel/context/evidence và linh vật động cùng keyboard/collapse/pause/static fallback. Agent mở rộng cùng conversation và Engine, không tạo trợ lý hoặc kho kế hoạch khác.

Không sửa frontend source/assets/config/tests/runtime schemas hoặc các tài liệu PRD/SRS/AI chức năng trong lượt này. Snapshot9 bản gốc giữ nguyên để đối chiếu. Các hồ sơ/evidence implementation cũ không bị viết lại thành PASS mới.

## 3. Tài liệu hiện hành

[Điểm vào UI/UX](../design/operational-design-delta.md), [Catalogue](../design/interface-catalogue.md), [UX/flows](../design/ux-ui-specification.md), [Màn/form](../design/screen-behavior-specification.md), [Android](../design/android-ui-specification.md), [Admin](../design/admin-ui-specification.md), [UI trace/checks](../design/ui-requirement-traceability.md). Design system/components/pattern/auth/a11y liên kết từ điểm vào.

## 4. Mức sẵn sàng và xác minh

Đã đặc tả để dựng wireframe/bổ sung UI có căn cứ. Mockups pixel, render review mới, contract v2 generation, signed APK/native PoC, backend/admin/Agent implementation, UI-AC execution và user UAT đều **chưa thực hiện**. Dịch vụ miễn phí vẫn có quota; conventional cloud chưa dùng dữ liệu thật khi anti-Ops/security gate chưa đạt.

Kiểm tài liệu: [machine evidence](evidence/ui-documentation-checks.json) ghi hash snapshot, links nội bộ của bộ cập nhật, mã/coverage và hash frontend trước/sau. Chỉ kiểm tĩnh consistency/tính toàn vẹn, không phải functional acceptance, independent review hoặc user sign-off.