# UX/UI specification — trải nghiệm đích FinWeave

DES-UX-001 · v1.0 · 08/10/2026 · SPECIFIED / visual review và user UAT pending.

Tài liệu thay thế mô tả mock làm chuẩn thiết kế tương lai; [bản cũ](../governance/baselines/ui-before-v3-2026-10-08/ux-ui-specification.md) giữ wireframe/triển khai và bằng chứng lịch sử. [Catalogue](interface-catalogue.md) xác định từng màn và phần kế thừa. Không đổi code, không nhận các màn mới đã render hoặc native-tested.

## 1. Người dùng, phạm vi và nguyên tắc

- User web: quản lý và đọc tài chính trên màn lớn; không cần cài Android để nhập tay/CSV, theo dõi giá hoặc dùng Plan/Goals.
- User Android: cùng owner/workspace/backend/ledger và các nghiệp vụ core; bổ sung collector native, permission, queue. APK là một sản phẩm cài được, không chỉ viewport nhỏ.
- Admin: vận hành nguồn/parser/jobs/quota/releases/incident qua metadata tối thiểu; không đọc finance, raw notification, chat/prompt hoặc impersonate user.

Năm nguyên tắc giữ: đọc tiền trước; mỗi số có căn cứ; missing khác zero; planned/actual/simulated tách riêng; hành động có preview và kết quả. Mở rộng: coverage hiển thị trung thực; không đồng nhất upload với posted; AI giải thích và tạo draft trong cùng trợ lý; quyền UI không thay kiểm quyền server. Chỉ dùng synthetic khi trust/security gate chưa đạt.

## 2. Kiến trúc thông tin và điều hướng

User giữ **Tổng quan — Giao dịch — Plan — Dữ liệu — Trợ lý AI**. Route đang có trong catalogue không đổi ở bước tài liệu này. Goals nằm trong Plan; Devices trong Dữ liệu; Settings từ profile. Contextual panel không tạo trợ lý hoặc kho lịch sử thứ hai. Android giữ hierarchy, có “Thiết lập tự động ghi nhận” tại Dữ liệu/Settings; không xin quyền notification khi user chỉ xem báo cáo.

Desktop giữ sidebar224px, compact184px dưới1000; dưới760 dùng bottom nav72px; max content1240px. Dưới640 fields một cột, summary2×2 khi đọc được, chart tối thiểu220px; dưới1200 hero stack. Android áp safe-area/insets, bàn phím và native Back; text scale lớn có thể chuyển summary thành một cột. Admin dùng sidebar riêng Overview/Accounts & devices/Sources & parsers/Jobs/Quotas/Releases/Incidents, không mascot đọc tài chính.

Period/scope dùng cho báo cáo, không thay business clock/goal deadline. Drill → list/detail → Back giữ context phù hợp; đổi filter không tự gửi prompt hoặc ghi dữ liệu. Legacy selected query chỉ mang loại/opaque ID trong synthetic. Đích production không chứa tiền, prompt, raw, secret hoặc mô tả/search nhạy cảm trong URL; filter nhạy cảm nằm trong trạng thái phiên đã bảo vệ. Shared context dùng DTO được phép, không sao chép URL thô.

## 3. Hành trình đầy đủ

Các UX-FL là refinement của yêu cầu hiện có, không thêm chức năng ngoài PRD.
| ID | Bắt đầu → các bước chính → kết thúc | Nhánh lỗi/quyền và màn |
| --- | --- | --- |
| UX-FL-01 | Đăng nhập/đăng ký → workspace VND/timezone/tracking → account/opening → tổng quan | Auth fail/expired/denied; missing opening không0. UI-AUTH, UI-U-17, UI-S-01 |
| UX-FL-02 | Ghi thu/chi/chuyển/hoàn → validation → preview → confirm → ledger/snapshot | Same account, thiếu leg/origin, timeout uncertain, correction có history. UI-U-04…07, UI-S-03/06 |
| UX-FL-03 | CSV → mapping → preview valid/invalid/duplicate → chọn rows → confirm → job → kết quả | Cancel không post; partial parse khác partial commit, retry cùng key. UI-U-13, UI-S-09/10 |
| UX-FL-04 | Tổng quan/báo cáo → chart/bảng/insight → chi tiết căn cứ → Back hoặc hỏi AI | Unknown/coverage/stale vẫn drill có giải thích; không chart fake. UI-U-01/02, UI-S-01…03/08 |
| UX-FL-05 | Cash count/Review → evidence → supplement/ghép/link/defer → preview → confirm | Account ambiguity/redaction không đoán; duplicate/transfer không double money. UI-U-14, UI-S-04/06 |
| UX-FL-06 | Plan thủ công → recurring item/investment → forecast → link actual → theo dõi | Eligible versions/date/capacity; planned không thành actual. UI-U-08…10 |
| UX-FL-07 | Goal thủ công → target/deadline → contribution → allocate/release/achieve/archive | Earmark không cộng tiền lần2; thiếu funding không tự đạt. UI-U-11 |
| UX-FL-08 | Goal/Plan → save/consume/invest simulation → compare assumptions → giữ scenario | Không tự trade/actual writes; snapshot cũ được gắn nhãn. UI-U-12 |
| UX-FL-09 | Mascot/full chat/history → hỏi đơn giản → read result/evidence → drill/tiếp tục | Chung conversation; cancel/quota/partial/stale; không buộc Agent. UI-U-15/16, UI-S-08 |
| UX-FL-10 | Web giới thiệu Android hoặc Dữ liệu Android → disclosure → OS permission → source → mapping → test | Deny/restricted/unsupported → manual/CSV; có thể quay lại sau. UI-M-01…04/06 |
| UX-FL-11 | Notification hợp lệ → native outbox → durable receipt → posted/Review → web/mobile refresh cùng version | Offline/restart/permission revoke/ambiguous/repeated/multi-device/gaps. UI-M-05, UI-U-18, UI-S-10 |
| UX-FL-12 | Thêm stock: mã + lượng → resolve instrument; vàng: xác nhận profile → số chỉ → lưu holding | Mã mơ hồ, wrong unit/purity/side/currency, thiếu giá đều hiện rõ. UI-U-03, UI-S-02 |
| UX-FL-13 | Backend daily hoặc user “Cập nhật giá” → job → latest valid/partial/failed → giữ last-good | Không đổi lượng/cash/income; quota/cooldown/holiday; không cần mở app. UI-U-03/19, UI-S-10 |
| UX-FL-14 | Goal-first hoặc Plan-first → Agent hỏi ràng buộc → draft liên kết → engine mô phỏng → user chỉnh → preview → confirm | Bất khả thi, cancel, quyền, stale/conflict; flow thủ công song song. UI-U-08/11/15, UI-S-05…07 |
| UX-FL-15 | Actual lệch Plan hoặc user yêu cầu điều tra → Agent đọc/so/đặt câu hỏi → evidence + đề xuất → draft amendment hoặc Review | Không tự sửa active plan, quyết định Review hoặc actual. UI-U-08/14/15, UI-S-04…07 |
| UX-FL-16 | Admin phát hiện incident/job fail → xem metadata → chọn safe retry/disable + reason → preview/confirm → audit | 403, immutable version, uncertain outcome; không mở tài chính hoặc đổi finance. UI-ADM-01…07 |

Mỗi flow phải có đường quay về, draft được giữ trong phạm vi phiên/quyền hợp lệ; logout không giữ draft tài chính mở trên màn hình. Không thêm đọc SMS/email hoặc iOS collector như fallback tự động.

## 4. Bố cục nội dung cần dựng

| Màn tiêu biểu | Thứ tự từ trên xuống / hành động chính |
| --- | --- |
| Tổng quan | Kỳ/scope + sync/coverage → tiền đang có → tài sản theo dõi/subtotal → thu/gross/refund/net → charts/bảng → insight/evidence; “Ghi giao dịch” |
| Assets | Tiền theo bank/wallet/cash → stock/gold + quoteAsOf/source/quantityAsOf → “Cập nhật giá” + job state → thêm holding đơn giản → drill |
| Dữ liệu | Source health/coverage → Android/device setup/status → CSV/importjobs → Review; không giấu fallback sau onboarding |
| Plan/Goals | Actual/dự kiến/mô phỏng label → forecast/progress/shortfall → items/goals → “Cùng trợ lý lập kế hoạch” và tạo thủ công → draft/run liên quan |
| Agent/draft | Context + quyền và dữ liệu thiếu → câu hỏi/tiến trình ngắn → phương án từ Engine + assumptions/evidence → form chỉnh → before/after → “Xác nhận áp dụng” |
| Android status | Consent/OS/network/source riêng → lastObserved/lastAck → queue/receipts/gaps → retry/permission/source mapping/fallback |
| Admin overview | Environment/version → sanitized health/counts → incidents/job queue/quota → link chi tiết; không chart tài sản user |

Đây là hierarchy và hành vi để vẽ wireframe, không phải pixel specification hoặc hình đã được user review. [Pattern library](pattern-library.md) và [design system](design-system.md) quy định composition/tokens; screen spec quy định states. Thiết kế chi tiết vòng tiếp theo cần desktop/mobile mockups, real-device prototype, keyboard/assistive review và PO review trước nghiệm thu.

## 5. Copy và quyết định người dùng

Nhãn bắt buộc: “Chưa biết”, “Phần đã biết”, “Giá cập nhật lúc…”, “Lượng khai báo lúc…”, “Có khoảng trống dữ liệu”, “Đã gửi lên máy chủ”, “Chờ kiểm tra”, “Đã ghi sổ”, “Bản nháp — chưa áp dụng”, “Dự kiến”, “Mô phỏng”. Không viết “Đồng bộ hoàn tất” khi mới nhận ACK nhưng chưa biết ingestion outcome.

Consent nêu dữ liệu đọc/gửi, nguồn được chọn, cách tắt, giới hạn coverage; không chỉ một nút “Cho phép tất cả”. Agent hỏi ưu tiên/ràng buộc còn thiếu, ghi assumptions user chưa xác nhận; không trình lời giải như sự thật tài chính hoặc hứa lợi nhuận. Errors nêu việc user có thể làm, giữ căn cứ/số cũ khi hợp lệ; secrets và internal traces không đưa vào copy.