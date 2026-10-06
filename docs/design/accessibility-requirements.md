# Accessibility Requirements v0.1

DES-A11Y-001 · 06/10/2026 · AC-17/19/28; NFR-02/03/12 · AG self-review, PO pending. Các tiêu chí là yêu cầu kiểm tra M1, không chứng nhận WCAG. Tham chiếu [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) cho keyboard, contrast, labels và status. Kết quả cụ thể ở [Validation](validation-report.md).

| ID | Yêu cầu và cách kiểm | Triển khai / bằng chứng |
|---|---|---|
| AX-01 | Semantic landmarks, heading h1 mỗi màn; lang=vi; skip link tới main; tên control rõ | Shell main/sidebar/nav, index lang=vi; B11/B12 axe |
| AX-02 | Mọi tác vụ scope có native button/link/input/select; Tab logic; Enter/Space hoạt động; focus rõ, không chỉ màu | CSS focus3px; B11 chỉ keyboard 5nav, form/mascot; B19 focus return |
| AX-03 | Dialog title+description, trap; Escape/X; trả trigger hoặc main nếu trigger đã mất; không đóng lúc confirmed commit đang xử lý | Radix Modal; captured origin/fallback; B11/B13/B19; busy lockClose |
| AX-04 | Label liên kết control; required bằng chữ/*; error bằng chữ và aria-invalid/describedby; server error role=alert; giữ input khi error | RHF/Zod ActionForm và domain schema; B01/B13/B16 |
| AX-05 | Financial text không dùng color làm nghĩa duy nhất; income/expense/refund, planned/simulated/unknown có nhãn, đơn vị | Badge+label+source; B02/B05/B07…10/B12 |
| AX-06 | Chart có caption time/source/unit và bảng thay thế; drill có keyboard button tương đương mark; chart SVG aria-hidden tránh duplicate | FinancialChart details/table/buttons; B02/B12 |
| AX-07 | 1440×900,390×844,360×844 không page overflow hoặc chồng actions; bảng/tabs scroll nội bộ; touch controls44px | B12 toàn12routes mỗi viewport; B13 mobile real actions; B19 header mascot/profile/CTA rects |
| AX-08 | Motion tôn trọng prefers-reduced-motion; không linh vật tự animation; reduced-motion không bỏ action | tokens duration0; ECharts animation=false khi preference; code review + B21 browser reduced-motion=reduce |
| AX-09 | Privacy mask che số/geometry/tooltip/progress, input nhạy cảm, raw/prompt/answer/history và accessible text; không money trong URL | MoneyValue/PrivateText; B10/B12; tất cả routes và panel/history |
| AX-10 | Loading/pending có role=status; mutation/error có text; disabled không mất nội dung; no-data khác error và 0 | App skeleton, toast, AI states, ActionForm; B06/B10/B16/B18 |
| AX-11 | Tiếng Việt/số dài rõ; tabular numerals; metadata tối thiểu12px ngoài nhãn shell phụ; điều hướng mobile nhãn11px không chứa tài chính | Visual screenshots3widths; CSS system fonts; copy dài wrap; B12/B13 |

Agent trực tiếp xem browser và ảnh, tự thao tác keyboard; Playwright/axe đo bổ sung. Axe0violation không kiểm hết nhận thức, đọc screen reader, zoom200%/400%, forced colors hoặc mọi ngữ cảnh lỗi. Chưa có người dùng assistive technology, chưa user test thật. Các hạng mục này đưa vào research/audit kế tiếp trước tuyên bố accessibility sản phẩm.

Privacy masking không là bảo vệ dữ liệu thật: M1 chỉ memory synthetic, devtools có fixture. Chính sách anti-Ops/encryption/auth trong SRS vẫn chưa kiểm chứng và thuộc gate sau.

## Auth/system screens bổ sung 06/10/2026

Auth views có label/form/heading/alert/status, password reveal aria-pressed, OTP inputMode numeric, focus heading khi đổi route và errorinput, keyboard Enter submit, 44px controls, tab order. Catalogue dùng native details/summary và button routes/forms. Kiểm auth7routes×3viewport khôngoverflow/axe0; actualraw và Agent visualreview ởStep4report. Khôngscreenreader/userparticipants/WCAGcertification. Privacy mask vẫn toànfinancialapp; logout/expiry unmountfinancialproviders, khôngCSShideonly.
