# FinWeave Design System

DES-SYS-001 · v1.0 · 08/10/2026 · kế thừa tokens hiện có, bổ sung quy tắc ba surface. Documentation only; chưa render-review phần mới.

## 1. Nguyên tắc và nguồn

Giữ nền sáng, primary xanh, font hệ thống tiếng Việt, hierarchy tài chính, chart có bảng, mascot và các controls hiện có. Không đổi brand hoặc tự coi tokens là chứng nhận accessibility. [Bản cũ](../governance/baselines/ui-before-v3-2026-10-08/design-system.md) giữ lịch sử render; [mascot hiện hành](../frontend/mascot-interactions.md) là nguồn tham chiếu implementation, [AI spec](../product/ai-agent-specification.md) là nguồn chức năng.

Tiền trước → căn cứ sau → hành động rõ. Tiền thực tế/dự kiến/mô phỏng/valuation tách nghĩa; nguồn mới không làm lượng mới. Chất lượng và coverage là nội dung bắt buộc. Ba surface dùng cùng ngôn ngữ hình ảnh nhưng không chia sẻ quyền.

## 2. Tokens kế thừa từ CSS hiện có

Tên dưới đây là semantic token hiện tồn tại; không thêm prop/component/token giả vào runtime. Android chuyển cùng ý nghĩa sang native dp/sp, không coi CSS px là physical pixel.
| Nhóm / tên (prefix --) | Giá trị hiện có / quy tắc |
| --- | --- |
| color-bg/surface/ink/muted | #F5F7F6 / #FFFFFF / #17342D / #60716B |
| color-primary/primary-soft | #1C5143 / #E8F2ED |
| color-income/expense/refund | #16714D / #B94B43 / #3269A8 |
| color-warning/error/planned/simulated/unknown | #805B10 / #AB352F / #6654A4 / #88601A / #60716B |
| color-border/focus | #DCE5DF / #386FE0; focus outline3px + offset2px |
| chart-bank/wallet/cash/stock/gold | #1C5143 / #3D9180 / #8BB89E / #8172AF / #C4A052 |
| font-body | Segoe UI, Arial, sans-serif; không cần tải font riêng |
| text-meta/small/body/h2/h1/metric | 12/14/16/22/30/36px; dưới640 h1=26, metric=30 |
| line-meta/small/body/h2/h1/metric | 18/21/24/30/38/44px; mobile h1=34, metric=38 |
| weight-regular/medium/semibold/bold | 400/500/600/700 |
| space-1/2/3/4/5/6/8/10 | 4/8/12/16/20/24/32/40px |
| sidebar/content-max/control/chart-height/panel-width | 224/1240/44/240/420px; mobile panel100% |
| radius-sm/md/lg/pill | 8/12/20/999px |
| border-width; shadow-card/dialog | 1px; 0 2px 12px #17342d05 / 0 20px 80px #10251b26 |
| breakpoint-mobile/shell | 640/1000px; nav760/wide1200 là media thresholds literal |
| z-nav/header/mascot/overlay/dialog/toast | 20/25/30/40/50/60 |
| motion-fast/normal/ease | 120/180ms / cubic-bezier(.2,.8,.2,1); reduced motion0 |

VND/quantity dùng tabular numerals, căn phải trong bảng, số đầy đủ khi xem detail; chart có unit/scale rõ. Null ghi “Chưa biết”, zero hiển thị0; subtotal không thay total khi chưa đủ dữ liệu. Icon Lucide18/20/24, stroke1.8; icon-only có accessible label. Định dạng tiền chỉ ở presentation, phép tính dùng Engine/decimal contract.

## 3. Mở rộng semantic states

Không tạo palette mới cho từng API state. Dùng tokens sẵn có + icon + chữ:
| Nội dung | Visual và copy bắt buộc |
| --- | --- |
| Giá/source cũ hoặc partial | warning + last-good/asOf + “Cũ”/“Thiếu một phần”; không thay bằng0 |
| Queue/Agent đang chạy | neutral/primary + text status; không chạy celebration |
| Needs review/awaiting user | warning + lý do + action; không gọi lỗi bảo mật |
| Failed/denied | error + hướng khôi phục hợp lệ; denied không render dữ liệu cũ |
| Draft/planned | planned + “Bản nháp — chưa áp dụng” hoặc “Dự kiến” |
| Simulated | simulated + “Mô phỏng” + snapshot/assumptions |
| ACK/posted/confirmed | state text riêng; màu thành công không chứng minh verification hoặc chuyển tiền |

## 4. Responsive và mascot

User desktop/sidebar và mobile bottom nav theo [UX](ux-ui-specification.md). Không để panel, toast, sticky confirm hoặc mascot che CTA, bàn phím, tab và safe-area. Android touch target≥48dp, web≥44 CSSpx theo dự án; không fixed height khi text scale tăng. Admin bảng cuộn nội bộ hoặc responsive rows, không thu chữ để ép cột.

Kế thừa mascot hiện tại: idle/thinking/wave/celebrate, floating pet di chuyển/collapse/khôi phục/pause/reset vị trí, static avatar/history, shared pending state. Timings/asset sizes trong implementation note là baseline tham khảo, không khóa bất biến sản phẩm. Thinking theo run thực; wave không vô hạn; celebrate chỉ completion mới có ý nghĩa, không loaded history hoặc failure/cancel. Reduced motion/video lỗi dùng ảnh tĩnh, vẫn mở chat được. Không đổi mascot cũ về SVG tĩnh chỉ vì mô tả v0.1 đã lỗi thời.

## 5. Review và chuyển sang build

[Components](component-specifications.md) định nghĩa anatomy/behavior, [Patterns](pattern-library.md) định nghĩa composition, [A11y](accessibility-requirements.md) định nghĩa kiểm tra. Mockups mới phải xem tại1440/390/360, keyboard/zoom/mask và Android thực; xác nhận palette/contrast ở composition mới. Không dùng ảnh render cũ để đánh dấu UI Android/admin/Agent mới đã đạt.