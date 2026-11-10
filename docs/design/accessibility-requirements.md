# Accessibility, privacy và responsive requirements

DES-A11Y-001 · v1.0 · 08/10/2026 · SPECIFIED; mở rộng AX-01…11, thêm AX-12…16.
Nguồn nội bộ: REQ-UX-01/NAV-01/AI-02/SURFACE-01/APK-01, AI-NFR-002/007, NFR-20. Giữ ID AX cũ, không xóa capability mascot. [Evidence cũ](../testing/accessibility-responsive-report.md) chỉ áp scope mock; các bổ sung chưa test/chứng nhận accessibility.

| ID | Yêu cầu thiết kế và cách kiểm |
| --- | --- |
| AX-01 | lang=vi, main/nav landmarks, một h1 mỗi màn, skip link; native screen heading/accessible name tương đương |
| AX-02 | Mọi action keyboard/native accessible; Tab hợp lý, focus rõ3px+offset2px; drag mascot có arrows/buttons thay thế, không phụ thuộc hover |
| AX-03 | Dialog tên/mô tả/trap/return focus, Escape/Back khi chưa commit; pending/uncertain có đường rời an toàn và tra kết quả, không khóa vô hạn hoặc coi close=rollback |
| AX-04 | Label/required/hints/error bằng chữ, aria-invalid/describedby web hoặc native equivalent; focus lỗi đầu, summary server error, giữ draft |
| AX-05 | Không dùng màu duy nhất: thu/chi/refund/planned/simulated/unknown/stale/needs_review có chữ+icon+unit |
| AX-06 | Chart caption thời gian/nguồn/unit/snapshot, bảng thay thế và keyboard drill; unknown gaps không vẽ0; legend actual/planned/simulated rõ |
| AX-07 | Web1440×900/390×844/360×844, zoom200%/400%: không page overflow/CTA overlap; tables scroll nội bộ hoặc cards; web touch≥44 CSSpx |
| AX-08 | Reduced motion/pause: mascot ảnh tĩnh và chart không animation khi preference; action/history vẫn dùng; wave/celebrate không loop vô hạn |
| AX-09 | Mask tiền/lượng/progress/chart/tooltip/input/free text/prompt/answer/history/evidence/alternatives cả DOM accessible text; không money/secret/private search URL |
| AX-10 | Loading/run/queue status có live announcement vừa đủ, error alert, disabled reason; missing/empty/error/zero khác; không đọc lại toàn chat mỗi poll |
| AX-11 | Tiếng Việt đầy đủ dấu, body16px baseline, metadata12px, tabular numbers, text wrap; text scale tăng không cắt labels/errors/controls |
| AX-12 | Android TalkBack, focus order, screen heading, switch/permission controls có tên/state; target≥48dp, text scale200%, screen sizes/insets/keyboard/Back và real-device test |
| AX-13 | Async Agent: queued/awaiting_user/draft_ready/stale/partial/cancelled bằng text; câu hỏi gắn label và action; cập nhật không giật focus khi user đang sửa; cancel được xác nhận |
| AX-14 | Draft comparison/diff có bản danh sách/bảng đọc được, không chỉ màu +/-; label chưa áp dụng, snapshot/assumptions/shortfall đọc được; confirm nêu đối tượng/effect/version |
| AX-15 | Collector: consent tách OS permission, denied/unknown/revoked có hướng làm tiếp; ACK/posted/Review phân biệt bằng chữ; queue/gap warning không chỉ toast tự mất |
| AX-16 | Admin metadata table/status/action confirmation keyboard+screen reader, denied không đọc dữ liệu cũ; sanitized output và privacy không chỉ CSS hiding |

## Cách xác nhận

Mỗi flow thử keyboard, focus/return, labels, loading/empty/error/conflict/uncertain, masking và viewport/zoom; automated axe bổ trợ web, TalkBack walkthrough bổ trợ Android. Kiểm contrast và focus tại composition/tokens thực tế, không suy ra đạt từ màu hex riêng. Test mascot drag bằng keyboard, hide/show/pause/reduced motion, chat full/panel/history, Android keyboard không che confirm.

Cần review bằng assistive technology và user khi có điều kiện; automation0violations không chứng nhận toàn bộ. Ghi device/OS/browser/build, steps, expected/actual và screenshots không private data. [UI checks](ui-requirement-traceability.md) phân rõ automated subset đã chạy và phần chưa kiểm; assistive technology/native/user review vẫn **NOT RUN**. Mask là UX riêng tư, không thay authorization/encryption/security gate.