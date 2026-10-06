# FinWeave — Options Analysis

Ngày 05/10/2026; version2.0, scope-v2. So sánh định tính để chọn cách đạt M1; suy luận từ yêu cầu/playbook, chưa có benchmark hay báo giá. Các phương án không đổi bốn nhóm/phạm vi chức năng.

| Tiêu chí | A. Web prototype local, state/fixture mô phỏng | B. Prototype bằng công cụ thiết kế tương tác | C. Xây backend/provider trước prototype |
|---|---|---|---|
| Khớp responsive web đã chọn | Trực tiếp, kiểm tra browser/keyboard khi xây | Có thể mô phỏng, cần đánh giá mức tương tác/responsive | Có web nếu xây thêm UI, backend không tự chứng minh UX |
| Form, filter, mutation/reset/oracle | Có thể thực hiện trong một bộ state demo | Cần bố trí nhiều state, việc nhập linh hoạt tùy công cụ chưa chọn | Có thể thực thi thật nhưng vượt nhu cầu M1 |
| Phụ thuộc | Runtime/browser local cần kiểm tra khi xây | Công cụ/tài khoản/quyền chưa xác định | DB/jobs/provider/auth/security/hạ tầng/quyền mới |
| Tái dùng khi tiến M2 | Có thể tái dùng UX/component; phải tách API layer theo contract | Có thể tái dùng thiết kế, phải xây frontend | Có thể tái dùng backend nhưng rủi ro contract/UX phải sửa |
| Chi phí/lịch | Effort ở cost model; chưa có số đo | Chưa có effort/license được xác nhận | Chưa ước lượng; thêm gate và quyền chưa được cấp |
| Rủi ro chính | State rời rạc hoặc tưởng demo là backend | Nút chỉ chuyển màn, thiếu nhánh/không nhập được | Scope creep, làm kiến trúc thật trước nhu cầu/UX |
| Quyết định | **Hướng chọn theo D-08** | Không chọn làm cách bàn giao chính hiện tại | Hoãn tới mức phù hợp, không thực hiện ở M1 |

A phù hợp vì nhiệm vụ chọn web và cần kiểm tra thao tác cập nhật nhất quán bằng giả. B có thể dùng nội bộ cho wireframe nếu có công cụ phù hợp, không tạo một bàn giao song song hoặc tài khoản mới. C không là điều kiện chứng minh giao diện M1; rủi ro backend/security được ghi riêng và khảo sát đúng thời điểm.

Lựa chọn kỹ thuật cụ thể cho A chưa chốt. Human Setup đưa React/TypeScript/Vite làm tham chiếu; chọn ở bước 3 sau kiểm tra môi trường, không coi phiên bản/compatibility đã xác minh. Không cài stack trong bước 1. Nếu đổi A sang B cần bảo đảm vẫn đáp ứng web/responsive/interaction/AC và ghi tác động chi phí/evidence; thay platform phải do chủ sản phẩm chọn.

Phương án dữ liệu M1 đã chốt là synthetic. API thật không cần để trình bày cập nhật giá. Quote vàng VND/chỉ demo là mặc định, nhánh quốc tế/FX giả để kiểm tra giới hạn; giá thực và provider là OD-05/06 riêng.

## Impact của Plan và AI — D-19

Giữ lựa chọn A web prototype local, bổ sung state Plan/goal/simulation/result refs/context; không phải scaffolding đã làm. AI M1 chọn **scripted responses + deterministic result cards** để chứng minh luồng, lỗi/no-data và chat đồng bộ. Gọi model demo thật là alternative ở lần tích hợp được giao, cần model/quota/terms/permission tại thời điểm đó; không cài SDK/key/model trong bước 2. Linh vật là affordance chat trong FinWeave; không tạo Work Pet, sprite/animation asset ở nhiệm vụ sửa tài liệu.
