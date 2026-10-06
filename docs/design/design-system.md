# FinWeave Design System v0.1

DES-SYS-001 · v0.1 · draft05/10, cập nhật06/10/2026 · scope-v2/analysis-v2 · render-reviewed AG, in-review. Owner AG; reviewer AG tự review; PO pending. Không khóa style chưa kiểm chứng. Nguồn: 40 References, UC/BR/DR hiện hành, ADR-001.

## Design Principles & Process — DES-PRN-001

1. **Đọc tiền trước:** tiền đang có là số lớn nhất; số dư từng tài khoản ngay dưới. Thu/chi/hoàn/dòng tiền riêng. Tài sản theo dõi ở khối kế tiếp; không gọi là net worth khi thiếu mô hình nợ.
2. **Mỗi số có đường về căn cứ:** card → chart/table → giao dịch hoặc holding → source/date/unit/history. Period/scope/snapshot được giữ qua Back và gửi AI.
3. **Chất lượng dữ liệu là nội dung:** unknown dùng chữ và subtotal, stale giữ mốc cũ, tự khai báo không thành verified. Không trend% khi thiếu kỳ so; quote mới không làm lượng mới.
4. **Dự định có ranh giới:** actual xanh/slate, planned indigo và chữ Dự kiến, simulated amber và chữ Mô phỏng. Goal chỉ earmark; không cộng tiền lần2.
5. **Tác vụ có kết thúc:** nhập → kiểm tra → xác nhận → kết quả; hủy/validation/conflict/retry giữ input. M1 phản hồi gắn nhãn mô phỏng.
6. **Một trải nghiệm ở ba độ rộng:** hierarchy giữ nguyên tại1440,390,360. Mobile một cột và5navigation; bảng scroll nội bộ. Touch targets44px, focus visible, chart có bảng/button tương đương.

Quy trình: wireframe + tokens/spec v0.1 → dựng primitives và /design → render browser → xem ảnh + đọc DOM/accessibility → sửa token/composition → mở rộng feature → chạy AC → chụp lại. Decision log tại execution/decisions.md, defect/fix tại validation-report.md. Mỗi vòng ghi observed/expected; không kết luận user hiểu khi chỉ AG thao tác.

Rubric visual: tổng tiền và kỳ thấy ngay; 3account phân biệt; chi lớn có nhãn/gross/refund/net; tiền/tài sản không trộn; 16pxbody/12pxmetadata không bị cắt dấu Việt; số căn phải/tabular; 5nav có trạng thái active cả icon+text; labels/source/time/unit rõ; hover/focus/loading/error/empty không lấn dữ liệu; mascot chỉ điểm truy cập, không banner tài chính.

## Style Guide — DES-STY-001

Light-first: nền #F5F7F6, surface trắng, ink#17342D, primary#1C5143, primary-soft#E8F2ED. Income#16714D; expense#B94B43; refund#3269A8; warning#805B10; error#AB352F; planned#6654A4; simulated#88601A. Chart bank xanh đậm, wallet teal, cash sage, stock violet, gold ochre. Chữ trạng thái luôn kèm màu/icon; không dùng đỏ cho mọi Review.

Font Segoe UI, Arial, sans-serif (font hệ điều hành, glyph tiếng Việt); body16/24, small14/21, metadata12/18, h2 22/30, h1 30/38, metric36/44; hero42/50 desktop,36/44 mobile; secondary metric30/38 mobile. Weight400/500/600/700. Money tabular-nums, unitVND cạnh số, không viết dấu $; số đầy đủ trong table/detail. Không rút số bằng ký hiệu m/k trong kết quả.

Lucide stroke1.8 size18/20/24, cùng hệ cho chức năng: House(Home), ArrowLeftRight(giao dịch/chuyển), Route(Plan), Database(Dữ liệu), Sparkles(AI), EyeOff(mask), Plus, Search, Calendar, ArrowUpRight(drill), ShieldCheck(căn cứ), AlertTriangle(cảnh báo). Icon trang trí aria-hidden, icon-only button có label. Logo SVG weave do AG tự dựng, không giống logoSure/Coinest; linh vật SVG Thần Tài giản lược do AG tự dựng, tĩnh trong M1. Concept user cung cấp chỉ reference, quyền tái phân phối reference chưa xác minh, không đóng gói thành UI. Lucide ISC + một số icon MIT theo upstream notices; system font không nhúng file. Không stock photo/avatar thật, illustration tối đa empty/chat64–120px, không bày coins giữa số liệu.

## Design Tokens — DES-TOK-001

Nguồn code: src/design/tokens.css; tên semantic dùng trong components. Bảng cập nhật theo CSS và render; v0.1 chưa PO sign-off. Mọi tên CSS có prefix --. Colors chart resolve từ computed CSS tokens; media query dùng thresholds literal vì CSS custom properties không làm điều kiện media.

| Nhóm/tên | Ý nghĩa | Giá trị |
|---|---|---|
| color-bg/surface/ink/muted | nền, card, chữ, metadata | #F5F7F6/#FFFFFF/#17342D/#60716B |
| color-primary/primary-soft | hành động/chọn | #1C5143/#E8F2ED |
| color-income/expense/refund | tài chính | #16714D/#B94B43/#3269A8 |
| color-warning/error/planned/simulated/unknown | semantic states | #805B10/#AB352F/#6654A4/#88601A/#60716B |
| color-border/focus | ranh giới/focus | #DCE5DF/#386FE0 |
| chart-bank/wallet/cash/stock/gold | breakdown | #1C5143/#3D9180/#8BB89E/#8172AF/#C4A052 |
| font-body/text-body/text-small/text-meta/text-h1/text-h2/text-metric | chữ | Segoe UI,Arial;16/14/12/30/22/36px |
| weight-regular/medium/semibold/bold | hierarchy | 400/500/600/700 |
| line-body/small/meta/h1/h2/metric | px line heights | 24/21/18/38/30/44px |
| space-1/2/3/4/5/6/8/10 | rhythm | 4,8,12,16,20,24,32,40px |
| sidebar/content-max/control/chart-height/panel-width | dimensions | 224/1240/44/240/420px |
| radius-sm/md/lg/pill | corners | 8/12/20/999px |
| border-width | divider/card | 1px |
| shadow-card/dialog | depth | 0 2px 12px #17342d05 / 0 20px 80px #10251b26 |
| breakpoint-mobile/shell + nav/wide thresholds | composition | tokens640/1000px; nav760px, wide1200px trong media. Sidebar184 compact; bottomnav72; entry44px |
| z-nav/header/mascot/overlay/dialog/toast | layering | 20/25/30/40/50/60 |
| motion-fast/normal/ease | feedback | 120/180ms/cubic-bezier(.2,.8,.2,1) |
| reduced-motion | user preference | animations/transitions=0ms; chart animation=false |

## Component Specifications, Patterns và render decisions

DES-CMP-001 tại [spec chi tiết](component-specifications.md) mô tả anatomy/API thật/state/validation/events/focus/responsive; không khai props busy/unit chưa có. DES-PAT-001 tại [Pattern Library](pattern-library.md) có5templates và snippets từ code đã chạy. [UX/IA/Flows/Wireframes](ux-ui-specification.md) và [Accessibility](accessibility-requirements.md) là tiêu chí review.

Vòng đầu: tạo tài liệu v0.1 trước scaffold features, primitives/tokens/DesignPage → mở /design và thao tác dialog trực tiếp → mở rộng5nav. Vòng render sau: xếp hero1cột dưới1200; 36pxmoneyhero mobile; chart/card/table longtext wrap; giữ native options; dialog captured origin/fallback focus. Vòng cuối: linh vật44px trong header normalflow ởmọiwidth đểkhônglấnprofile/CTA; faultsettings lock trong lúc đổi; field select/textarea cóerror-describedby; chartpalette dùng CSS tokens. D-24/25/26/27 và defectlog ghi căn cứ.

Không khóa thiết kế chưa qua render. Hiện /design và12routes đã render tại3widths, screenshots + tự browser walkthrough; chưa useracceptance. [Validation Report](validation-report.md) giữ kết quả và limitations. Logo+linh vật SVG tự dựng original, không sao concept; source trong App/Assistant. Lucide license/notices và dependency inventory được đóng gói; system fonts không nhúng. References không phân phối như asset.

## Bổ sung bước 4: authentication và catalogue đã render

06/10/2026: giữ tokens/components và hướng tài chính v0.1. Auth dùng primary green, system Vietnamese typography, native field/Button/Badge, Lucide, 44px targets; desktop story + form, mobile brandbar + form. Không assets/reference/billing ngoài scope. /design có13module links,86semantic actions và states từ interface-catalogue.ts, không chỉ5templates. [Auth specification](authentication-specification.md) và [Screen behavior](screen-behavior-specification.md) bổ sung systematic states. Auth là synthetic UI; khôngsecuritygate. Bằng chứng render/test mới ở [Step4report](../execution/evidence/step4-validation-report.md); giữbáocáoM1làlịchsử.
