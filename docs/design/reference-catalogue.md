> AI-SPEC-001 — 08/10/2026: nguồn chức năng AI hiện hành là [đặc tả hợp nhất](../product/ai-agent-specification.md). Các mô tả scripted/read-only bên dưới ghi implementation/mock cũ; chat/history/mascot được kế thừa, Agent có quyền tạo draft theo spec và owner xác nhận riêng để áp dụng. Không hiểu mô tả mock như yêu cầu xóa capability cũ hoặc cấm draft mới.

# Reference catalogue

DES-REF-001 · v0.1 · 05/10/2026 · AG đã mở và xem trực tiếp đủ40 ảnh. Tên file bên dưới là đường dẫn tương đối trong References nguồn; không chỉ suy luận filename. Ảnh có bản quyền/nguồn chưa xác minh: chỉ học bố cục và interaction, không embed/copy logo, số liệu, code, illustration hoặc animation vào app. Các phần thiếu tự đề xuất từ 28UC/AC, ghi tại UX specification và decision log. Không cần user tìm ảnh thêm.

| File | Màn/component | Phần học | Phần điều chỉnh |
|---|---|---|---|
| 01-37-home-loading.jpg | Home/loading | Skeleton có cấu trúc, trạng thái chờ | Không fake %; lỗi/retry khác loading |
| 03-01-plan-overview.png | Plan/milestone | Điều kiện mốc và bối cảnh | Chỉ kế hoạch tài chính đã chốt; bỏ retirement/debt |
| 03-02-plan-cash-forecast.png | Plan/forecast | Baseline đối chiếu dự phóng | Không số market/success rate; assumptions hữu hạn |
| 03-03-plan-timeline.png | Plan/timeline | Thanh thời gian và tooltip mốc | Chỉ horizon kế hoạch, không lịch sử gia đình giả |
| 03-14-plan-version-assumptions.png | Plan/version | Version và giả định cạnh biểu đồ | Không Monte Carlo/quantile chưa có mô hình |
| AI Agent 01.png | AI/chat empty | Gợi ý câu hỏi, composer | Scripted/read-only, nhãn demo |
| AI Agent 010.png | AI/context | Context đổi và empty history | Không coi concept UI là asset |
| AI Agent 02.png | AI/result | Chips và card có biểu đồ | ToolResult/evidence/table theo snapshot |
| AI Agent 03.png | AI/evidence | Reference drawer và giải thích | Không khuyến nghị ticker hoặc lợi suất |
| AI Agent 04.png | AI/history | Chi tiết lịch sử/capture context | Không ghi kế hoạch qua chat |
| AI Agent 05.png | AI/mascot | Idle/hover và điểm vào | SVG static tự vẽ; không sprite/Lottie từ board |
| AI Agent 06.png | AI/global panel | Panel gắn Home/Giao dịch | Một conversation dùng chung |
| AI Agent 07.png | AI/navigation | Plan/Data context→full chat | 5 navigation giữ kỳ/scope |
| AI Agent 08.png | AI/mobile | Composer/pending/cancel | Không pha generation giả; focus và viewport |
| AI Agent 09.png | AI/error | Denied/tool/quota | Không upgrade/billing hay paid fallback |
| Goal 01.jpg | Goal/card | Tiến độ và deadline mobile | Earmark tiền thật, không project management |
| Goal 02.jpg | Goal/milestone | Mốc tiến độ dễ đọc | Không streak động viên thay funded progress |
| Goal 03.jpg | Goal/dashboard | Progress card | Không health score/chỉ số sức khỏe |
| Home - Tổng quan & Báo cáo\01-02-money-summary.jpg | Home/summary | Hierarchy tổng tiền và tài khoản | VND số giả nhất quán; bỏ rewards/logo |
| Home - Tổng quan & Báo cáo\01-03-account-balances.jpg | Home/account | Danh sách balance mobile | 4 nhóm scope, nguồn/time |
| Home - Tổng quan & Báo cáo\01-03-account-balances.png | Home/assets | Nhóm tài sản và bảng | Không balance sheet nợ hay tài sản ngoài scope |
| Home - Tổng quan & Báo cáo\01-04-income-expense-refund-summary.png | Home/income-expense | Kỳ và phân rã thu/chi/refund | Gross/refund/net riêng, actual |
| Home - Tổng quan & Báo cáo\01-05-cashflow-chart.png | Home/cashflow | Luồng tiền có hướng | Bar bridge rõ ở mobile; transfer không chi |
| Home - Tổng quan & Báo cáo\01-06-expense-category-chart.png | Home/spending | Legend/ranking và drill | Bar giúp so nhóm, có bảng gross/net |
| Home - Tổng quan & Báo cáo\01-08-asset-allocation-chart.png | Home/allocation | Chart+bảng chi tiết | Ảnh thực là spending: lấy cấu trúc, không suy nội dung từ tên |
| Home - Tổng quan & Báo cáo\01-10-insights-cards.png | Home/insights | Card nhận xét có hành động | Rule-based evidence; không trend/idle cash bịa |
| Home - Tổng quan & Báo cáo\01-12-reports-overview.jpg | Home/reports | Bố trí đa biểu đồ | Không radar/lịch sử chưa có dữ liệu |
| Khung ứng dụng dùng chung\00-01-app-shell-sidebar.jpg | Shell/sidebar | Nav có hierarchy | Đủ5; bỏ billing/sidebar phụ ngoài scope |
| Khung ứng dụng dùng chung\00-02-navigation-active-subtabs.jpg | Shell/mobile nav | Active state và nhãn | Đủ5, không nút thứ6 ưu tiên giả |
| Khung ứng dụng dùng chung\00-03-period-selector.jpg | Shell/period | Period presets | Tháng/quý/năm/custom half-open+trackingStart |
| Khung ứng dụng dùng chung\00-04-custom-date-range.jpg | Shell/custom dates | Start/end nhìn rõ | Validation và preview kỳ |
| Khung ứng dụng dùng chung\00-05-account-scope-selector.png | Shell/scope | Danh mục tài sản/account | Ảnh menu Sure không scope picker: tự đề xuất checkbox theo nghiệp vụ |
| Khung ứng dụng dùng chung\00-06-profile-settings-menu.png | Shell/profile | Popover/settings group | Chỉ thiết lập/demo/privacy/design, bỏ billing/contact/auth giả |
| Khung ứng dụng dùng chung\00-07-privacy-mask.jpg | Shell/privacy | Privacy là trạng thái chung | Mask toàn app; không giả biometrics/security |
| Khung ứng dụng dùng chung\01-01-home-tong-hop.jpg | Home/layout | Light green/cards/spacing | Không payment/reward/progress tài chính bịa |
| Linh vật AI Agent.png | AI/mascot concept | Thần Tài thân thiện, contextual entry | Concept board không usable asset/animation; SVG nguyên bản nhỏ |
| Transaction 01.png | Transaction/form | Type/account/date/details | Preview/confirm/cancel, positiveVND, không invoice |
| Transaction 02.png | Transaction/filter | Panel và filter chips | Nhãn nghiệp vụ, scope/context giữ khi drill |
| Transaction 03.png | Transaction/category | Rows có category state | Không split/batch ngoài scope |
| Transaction 04.jpg | Transaction/detail | Ledger+right details | Nguồn/version/evidence, không business billing |
