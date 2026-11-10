# Documentation verification — 08/10/2026

Phạm vi: tài liệu thay đổi trong lượt realignment07–08/10; frontend/source/runtime không được chỉnh. Đây không phải product test report.

Kết quả tự kiểm bằng script PowerShell trên workspace:

| Kiểm tra | Kết quả |
| --- | --- |
|161 frontend files đã hash trước khi sửa docs | Không file thay đổi/mất; không file mới trong cùng inventory. Bao gồm source/tests/config/public do rg liệt kê, loại node_modules/dist/work/test-results/playwright-report/.git |
|12 snapshot tài liệu trước thay đổi | SHA256 khớp manifest, không sửa bytes cũ |
|Local Markdown links trong60 tài liệu thay đổi/tạo mới | Không link file bị thiếu; snapshot archive được loại vì giữ link tương đối theo vị trí cũ. Không kiểm URL mạng hoặc anchors bằng filesystem test |
|Acceptance criteria mới | Đủ AC-29…41, không trùng; tổng13 mới,28 cũ kế thừa bằng tham chiếu |
|NFR mới | Đủ NFR-16…21, tổng6 mới |
|Kiểm tra nội dung | PRD/SRS/BR/API/data/design/Agent cùng quy định draft→preview→owner confirm; anti-Ops không bị bỏ; mock evidence không chuyển thành PASS v3 |

Machine output: [document checks](evidence/document-realignment-checks.json). Manifest frontend trước sửa: [frontend preservation](evidence/frontend-preservation-manifest.json). Các thay đổi frontend có sẵn trước lượt này không bị revert/overwrite.

Không chạy build/test ứng dụng vì nhiệm vụ chỉ thay documentation; Android/backend/provider/model/security/UAT vẫn NOT RUN. Không tuyên bố all requirements đã được kiểm thử hoặc external sign-off. Các comment/status trên tài liệu legacy là thông báo precedence, không claim mọi chi tiết legacy đã migrate sang API v2.
