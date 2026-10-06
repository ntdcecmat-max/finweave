# FinWeave — Quyết định và giả định

Cập nhật: 06/10/2026. Version 2.1, scope-v2 → analysis-v2 (kế thừa v1). Phân biệt quyết định theo nhiệm vụ, lựa chọn phân tích và vấn đề còn mở. Không có phỏng vấn hoặc xác minh API mới trong lần này. Owner theo dõi: Agent; PO reviewer/approver pending external review.

## Quyết định nền và lịch sử (trạng thái superseded nêu rõ)

| ID | Quyết định / trạng thái | Căn cứ | Tác động |
|---|---|---|---|
| D-01 | M1, chỉ bước 1 ở nhiệm vụ cũ — superseded **chỉ phần STEP_RANGE** bởi D-12 | User và Playbook mục 4 | M1/synthetic giữ nguyên; scope-v1 nay được D-19 thay bằng scope-v2; nhiệm vụ mới thực hiện bước 2 rồi dừng |
| D-02 | Bốn nhóm × năm chức năng, web responsive tiếng Việt, synthetic — chốt | User | Không collector thật, không sản phẩm Android thứ hai |
| D-03 | Ranh giới cũ Budget/Goals/Alerts/Assistant ngoài bàn giao — **superseded phần Goals/Assistant bởi D-19** | Nhiệm vụ ban đầu | Budget độc lập nâng cao/Alerts vẫn ngoài phạm vi; Plan/Goals/AI/Insights hiện được chọn |
| D-04 | Prototype Ideas ánh xạ theo mức thực thi Playbook — chốt cách diễn giải | Playbook mục 1, 15 và Human Setup | Backend ledger/job/security thật thuộc M3; M1 chứng minh hành vi và nguồn số giả |
| D-05 | Một workspace demo, VND, +07:00, mốc theo dõi; không auth thật — baseline thiết kế | User synthetic; Ideas 2–3; giả định A-01 | Onboarding không cần signup; currency khác chỉ trong fixture quote FX, không đa tiền tệ tài khoản |
| D-06 | Tiền khác tài sản; dùng “tài sản đang theo dõi”; opening/transfer/refund/reversal và pending đúng nguồn — giữ yêu cầu | Ideas 1.10–1.12, 8–9; Playbook 13 | Oracle/visual phải nhất quán; giá tăng không thành income |
| D-07 | M1 category hệ thống + override từng mục; holdings có lịch sử khai báo/điều chỉnh; hoãn rules/batch/trade engine/export | Chọn mức tối thiểu trong phạm vi user và Ideas | Không tự mang toàn module prototype vào mốc; có ví dụ mua đủ căn cứ nhưng không đặt lệnh/hiệu quả đầu tư đầy đủ |
| D-08 | Web prototype chạy local là hướng chính cho bước 3; chưa chọn stack | User responsive web; Human Prompt 3 | Đủ thao tác/reset; chọn công cụ khi xây, không cài thư viện bước 1 |
| D-09 | Security/Ops yêu cầu vẫn bắt buộc trước dữ liệu thật; chưa làm PoC | Ideas 15–16; Playbook 2.4 | Ghi DEP-04, không tự hạ bảo đảm; PoC không là gate prototype UI |
| D-10 | Mở rộng hồ sơ bước 1 đủ 11 artefact chuyên nghiệp — chốt theo yêu cầu bổ sung | User yêu cầu Vision/Problem/Value/Charter/Scope/Feasibility/Options/Cost/Assumptions-Constraints/Risks/Roadmap | Tạo bộ Markdown và mục lục; giữ backlog/execution, không mở rộng tính năng hoặc sửa ba nguồn |
| D-11 | Cost model dùng effort low/base/high và biến đơn giá chưa chốt — ước lượng lập kế hoạch | Chưa có budget/time log/báo giá/capacity | Không hẹn ngày/tổng VND; cập nhật sau rules và vòng UX đầu; không mua dịch vụ |

## Giả định nghiên cứu chưa kiểm chứng

| ID | Giả định | Tác động / cần kiểm chứng |
|---|---|---|
| A-01 | User đầu là cá nhân tự quản lý nhiều tài khoản tiền và khai báo cổ phiếu/vàng | Form và ngôn ngữ dành cho chủ dữ liệu; cần phỏng vấn/thử tác vụ |
| A-02 | Ba câu hỏi ưu tiên: tiền ở đâu, chi vào gì, dữ liệu nào cần kiểm tra | Hierarchy Tổng quan; chưa có bằng chứng tần suất/giá trị |
| A-03 | Dùng mobile nhập nhanh và desktop kiểm tra chi tiết | Viewport/UX đề xuất; cần kiểm chứng thiết bị thật |
| A-04 | 5 người thử, ≥4/5 hoàn thành là mục tiêu khả thi cho đánh giá nhỏ | Đề xuất đo, chưa tuyển người, chưa có tỷ lệ thực; không là khảo sát đại diện |

## Quyết định còn mở có tác động thực tế

Các mặc định dưới đây hỗ trợ phân tích synthetic; phần mở rộng do user chọn qua D-19, không suy từ giả định. Chủ sản phẩm có thể đổi trước khi thiết kế; mọi thay đổi cập nhật scope/version/scenarios, không ghi thành đã được user duyệt.

| ID / hạn cần chốt | Vấn đề còn mở | Mặc định đề xuất / lựa chọn | Tác động nếu đổi / cách kiểm chứng |
|---|---|---|---|
| OD-01 / trước đánh giá UX | User đầu và người tham gia có đủ bốn nhóm? Có rubric yêu cầu bổ sung? | A-01…03, chưa có người tham gia/rubric; chỉ tự walkthrough nếu không có | Có thể đổi ưu tiên/nhãn và kịch bản; phỏng vấn/test thật khi có người, không tự thêm Budget |
| OD-02 / bước 2 | Kỳ demo, timestamp và khi nào nguồn/lượng/giá được coi cũ | Kỳ 01–31/10/2026, thời điểm mô phỏng 31/10/2026 18:00 +07; giá quá 24h, lượng quá 30 ngày, nguồn quá 48h là fixture cũ | Ngưỡng chỉ phục vụ demo, không cam kết SLA nguồn/chu kỳ thị trường; rules cần nêu quote lịch sử/phiên giao dịch; đổi thì sửa fixture và nhãn |
| OD-03 / bước 2 | CSV và số mẫu dùng trong import | Một schema sao kê demo: ngày, reference, ghi nợ, ghi có, nội dung, VND; biến thể tên cột để thử mapping; không parser bank thật | Khác định dạng làm đổi validation/preview; chuẩn bị fixture hợp lệ/lỗi/trùng, không đưa file thật |
| OD-04 / bước 2 | Quote vàng/FX và phạm vi mua/bán tối thiểu | Quote giả VND/chỉ tương thích vàng nhẫn demo 9999; scenario quốc tế USD + FX giả riêng; 1 lượng=10 chỉ; nhánh sai đơn vị/purity/thiếu FX. Lượng thay đổi bằng form có ngày/lý do, một ví dụ mua gắn dòng tiền | Nếu chọn giá mua vào/thanh lý cần nhãn khác; bước 2 chốt quy đổi/rounding và tách price/quantity. Không thêm trade lifecycle đầy đủ |
| OD-05 / trước nguồn thật | Ngân hàng/ví hỗ trợ đầu, kênh thu thập và provider cổ phiếu/key/license/quota | Chưa chọn; SSI chỉ ứng viên trong Ideas | Quyết định thay schema/adapter/quyền; phải thử mẫu có quyền và terms thời điểm tích hợp; không cản M1 |
| OD-06 / trước định giá thật | Nguồn vàng nội địa/quốc tế, FX, loại quote và lịch refresh | Chưa chọn; thông tin thử Gold API trong Ideas không phải kiểm chứng lần này | License/unit/time/buy-sell tác động giá trị báo cáo; phải xác minh trước gọi nguồn thật |
| OD-07 / trước contract transport M2 và dữ liệu thật M3 | Protected boundary/provider, key/code approval độc lập Ops, user/device/recovery, ngân sách | Chưa chọn, chưa PoC; không hạ yêu cầu chống Ops | Có thể đổi transport và runtime; FUT-02/DEP-04 cần PoC/chi phí/gate. Chưa đạt thì chỉ synthetic integration |

Hiện không có quyết định thiếu làm chặn hoàn thành bước 1. Stack M1 là lựa chọn kỹ thuật thông thường ở bước 3; public deployment, ngân sách mới và dữ liệu thật chưa được cấp quyền. Không coi thời gian trôi qua là phê duyệt các lựa chọn còn mở.

## Các quyết định phân tích v1 được kế thừa / điều chỉnh

Ngày áp dụng 05/10/2026. D-12 là quyền user cấp; D-13…18 là **giả định phân tích chưa PO phê duyệt**, AG chịu trách nhiệm consistency, PO review trước đổi baseline. Không thay yêu cầu nguồn để khớp số. Nguồn trực tiếp lịch sử: Playbook §3.5/5/13, scope-v1/18 REQ–AC và nhiệm vụ chat trước thay đổi D-19.

| ID / trạng thái | Lựa chọn / căn cứ | Alternatives và tác động | Artefact/rule bị ảnh hưởng |
|---|---|---|---|
| D-12 / chốt theo nhiệm vụ | Hoàn thiện quản trị bước 1 trước phân tích, làm đủ 10 artefact bước 2, đánh giá gate rồi dừng. Register đăng ký owner/version/source/trace; vẫn M1 preparatory, không bước 3 | Mô tả cũ chỉ UC/rules/dictionary thiếu Playbook; superseded tại plan/progress/backlog/Scope§9/Charter/Roadmap. Phần tính năng sau đó được D-19 mở rộng | GOV-REG-001; EXE; PRD/REQ/DAT gói 2; D-01 partial superseded |
| D-13 / giả định OD-02/04 | Kỳ10/2026 half-open +07, clock31/10 18:00. Tuổi strict >24h giá/FX, >30d lượng, >48h lastSuccess nguồn; timestamp unknown/future không giả fresh. VND mutation nguyên, quantity/quote/FX decimal string; valuation round-half-up từng holding tới1VND rồi cộng. 1lượng=10chỉ; quote9999 compatible không purity-adjust lần2; USD/lượng3200×FX25000 fixture quốc tế riêng | Theo phiên thị trường/FX source policy là lựa chọn thật chưa chốt; per-total rounding có thể khác1VND, chưa chọn. FX24h bổ sung là demo assumption, không market/SLA. Quote baseline31/10 17:00, lượng01/10 18:00 cho ngưỡng đúng 30d; không giá lịch sử opening | BR-02/03/16/18; DR-01/04/11/14; SCN-X05/X09; OD-02/04 vẫn assumption |
| D-14 / giả định OD-03 | CSV demo UTF-8 date/reference/debit/credit/description/currency, ISO date-only precision giữ date, VND integer profile, exactly one positive direction; reference optional không giả ref; ≤20rows. Commit atomic selected valid subset, excluded Review chỉ publish sau confirm; cancel preview không money/case mutation. Same key/payload retry; changed payload conflict; expectedVersion re-preview | Thực hiện full-file hoặc chunking/locale-specific bank parser là phương án sau; không tuyên bố prototype hỗ trợ bank thật. Cancel sau commit không rollback, cần adjustment. Category missing không blocked | BR-09…13/21; DR-06/13/15; UC-IMPORT/MONEY/TXN/REVIEW; SCN-X10/X11 |
| D-15 / giả định xử lý cash phù hợp nguồn | Count là observation, variance không posting. Unknown adjustment có reason+preview+confirm tác động cash/flow, **không sinh hoạt income/expense**. Nếu evidence chi quên thì expense riêng, không đồng thời adjustment | Auto expense để ép khớp bị nguồn cấm. Khi tìm nguyên nhân sau, reclassify/adjust có history, không overwrite count/event. Cancel resolution giữ money, observation đã lưu có thể giữ | BR-14; DR-07/08/12; UC-CASH-02; SCN-X07 |
| D-16 / giả định receipt/refund phù hợp nguồn | Receipt đủ money fields chưa rõ loại có thể posted vào unresolved_receipt/clearing, tiền nhận phản ánh nhưng chưa income/refund. Resolve liên kết refund reclassify không cash lần2. Candidate refund vượt gốc giữ pending/case, không auto cap hoặc auto income | Giữ toàn bộ receipt pending sẽ làm cash khác scenario; phân tích chọn clearing để phản ánh money known/type unknown. Alternative chỉ đổi qua decision/version+SCN. Cross-period refund giảm chi kỳ nhận là **giữ nguồn**, không lựa chọn mở | BR-07/08/21; DR-07/08/10/14; UC-MONEY/REVIEW; SCN-X05/X06 |
| D-17 / giả định scope/archive phù hợp nguồn | Archive ngăn mutations mới, mặc định bỏ scope hiện tại, giữ history/include-archive reporting. Snapshot missing component → full total null + known subtotal/list missing; không tỷ trọng tổng đầy đủ. Version changed phải refresh/re-preview | Archive vẫn in-scope là alternative chưa chọn; nguồn yêu cầu không delete history vẫn giữ ở cả hai. Client tự cộng tổng khác Engine không được chọn. Toggle scope không ledger change | BR-19/20; DR-02/14; UC-OVERVIEW/DRILL; SCN-DRILL/X09 |
| D-18 / giả định UX/demo target, superseded phần số lượng bởi D-19 | V1 có 18 UC/18 SCN chính/12 nhánh/24 BR/15 DR/11 NFR; v2 có 28/28/14/36/22/15, giữ IDs cũ. F-BASE default Reset, F-COMPLETE lựa chọn rõ. Local demo≤20rows proposed≤1s rendering/filter/preview, 10 lượt đo sau warm-up ghi máy/browser/max; chưa đo | Bỏ hiệu năng threshold chỉ định qualitative là alternative; PO review trước UX validation. M3 SLO/capacity cần benchmark riêng, không kế thừa 1s local. Chưa chọn storage/stack bước 3 | NFR-02/03/06/09/11; BR-23/24; DR-15; UC-UX/DEMO; SCN-UX/DEMO |

## Thay đổi user và các mặc định analysis-v2

| ID / trạng thái | Lựa chọn / căn cứ | Alternatives, tác động và giới hạn | Owner / artefact |
|---|---|---|---|
| D-19 / user đã chọn phạm vi | Yêu cầu sửa tài liệu bước 1–2 theo 5 navigation: Tổng quan & Báo cáo, Giao dịch, Plan, Dữ liệu, Trợ lý AI. Home theo tháng/quý/năm/custom, Insights; Plan thu nhập/chi tiêu/đầu tư, Goals, tracking và mô phỏng; AI full chat/history và linh vật dùng mọi navigation. Scope-v2/analysis-v2 thay bản làm việc v1 | Supersedes D-03 phần Goals/Assistant và exclusion EXT-02/04. Thêm 10 REQ/AC, giữ chính xác 18 core và oracle. Đây là quyền sửa hồ sơ, chưa quyền xây bước 3/provider thật. Archive v1 có manifest SHA256, evidence cũ chỉ có giá trị lịch sử | AG cập nhật, PO chọn scope; toàn bộ bước 1–2, register/RTM/backlog/gate |
| D-20 / giả định IA và báo cáo | Home có 2 khối lớn Tiền & Hoạt động / Tài sản & Cơ cấu; quản lý tài khoản và chi tiết cổ phiếu/vàng ở tab Home. Settings qua profile, không nav thứ 6. Activity lấy kỳ half-open +07, balances/quotes lấy as-of; không lấy quote sau as-of. Quý/năm thiếu history/future có coverage/partial, không suy thiếu thành 0. Chưa có nợ nên nhãn cơ cấu tài sản, không báo tài sản ròng đầy đủ | User cho phép 1 hoặc 2 dashboard; chọn 2 là mặc định phân tích, có thể đổi qua UX. Tách Assets thành nav riêng làm vượt 5 nav nên hiện không chọn. Nợ/liabilities chỉ thêm bằng scope riêng. OD-02 clock cố định là mặc định reset; fixture Nov có clock riêng và nhãn rõ | AG đề xuất, PO review trước thiết kế; Scope §10, BR-25/26/36, DR-16, NFR-12/13 |
| D-21 / giả định Plan/Goals/mô phỏng, OD-08 open | Planned items có account/date/currency/type/amount, occurrence ID/version; monthly recurrence theo calendar. Ánh xạ actual bằng lựa chọn thủ công có preview; unique(planVersion,eventId), posted effects signed, pending không actual, refund ở kỳ nhận. Remaining từng item=max(planned−eligible actual,0), overspend riêng. Forecast=actual closing + remaining income − remaining expense − remaining investment; không cộng actual hai lần. Goal earmark tiền hiện có, không thêm tài sản; archive có preview/confirm release allocations và giữ history, không nhận allocation mới; chưa cho phân bổ thu tương lai. Không tự chặn actual spending khi goal hụt nguồn. Funding nhiều goal trong cùng account pro-rata rồi floor 1VND và chia dư theo stable allocation ID. Simulation giữ versions và giả định, không ghi actual | Alternative auto matching/many-to-many/split event chưa chọn, phải đổi data/rules/scenarios nếu cần. Alternative goal hard lock không chọn vì allocation chỉ quản lý mục tiêu; shortfall hiện rõ. Tỷ trọng ưu tiên thay pro-rata chưa chọn, cần PO review. Goal chỉ mark achieved khi funded≥target tại lúc user xác nhận; funding về sau độc lập và có thể shortfall, history giữ nguyên. Goal achieved chỉ đổi earmark; chỉ giả định mua tiêu dùng làm giảm tài sản, mua đầu tư chuyển loại tài sản. Tháng thiếu ngày lịch dùng ngày cuối tháng, tránh occurrence trùng | AG đề xuất, PO review; BR-28…32/36, DR-17…20, REQ-PLAN/GOAL/SIM, SCN-X14 |
| D-22 / giả định AI M1 và ngữ cảnh, OD-09 open | M1 scripted chat/result cards có nhãn demo, không model/key/provider call. AI đọc kết quả Engine fixture qua whitelist report/portfolio/plan/goal/simulation/insight tools; không raw ledger dump, SQL, mutations, trade hoặc tự cộng sổ. Caller workspace/object authorization không lấy từ prompt. Full chat và mascot dùng cùng conversation; mỗi message chụp context/versions, response cũ không ghi đè context mới, history có time/stale label. Privacy mask che structured amounts và ẩn toàn bộ free-text chat/narrative để tránh số lọt qua lời kể | Real LLM, model/license/quota/retention/privacy boundary chưa chọn; chỉ đánh giá ở M2/M3 khi được giao và đủ quyền. M1 chỉ chứng minh UI/result routing, không chứng minh năng lực mô hình. Alternative mascot tạo thread riêng chưa chọn vì mất lịch sử/context. Không tạo Codex Work Pet. Prompt injection/ID swap/error/quota đều fixture synthetic; không security PoC hoặc provider verification | AG đề xuất, PO review; BR-33…36, DR-22, UC-AI-01/02, NFR-15, SCN-X13 |

A-05: người dùng nhận giá trị từ Plan/Goals/tracking; A-06: AI contextual giúp hiểu báo cáo và tìm căn cứ. Đây là hypotheses từ idea, chưa user research. AG giữ nhãn; PO/người tham gia kiểm chứng khi có người ở BL-11.

EST-01 cũ superseded: estimate scope-v1 28/42/60 giờ không áp dụng scope-v2. EST-02 là effort mới TBD sau UX/stack, không actual/cam kết. D-11 giữ nguyên nguyên tắc estimate có nhãn và không tự mua dịch vụ.

OD-02/03/04 **vẫn được áp dụng làm giả định**, không closed/approved. D-13…17 giữ nguyên với phần period/as-of làm rõ qua D-20; D-18 chỉ thay số lượng và reset dữ liệu mở rộng, performance ≤1s vẫn là target chưa đo. OD-08/09 cũng open. AG quản lý tác động, PO review policy trước implementation. Nếu có mâu thuẫn phải sửa đồng bộ scope, BR/DR, UC/SCN, SRS/RTM, version và evidence; không sửa oracle cũ để che sai khác. A-01…06/OD-01 và OD-05…07 chưa kiểm chứng; D-09 privacy chống Ops không superseded.

[Review/Gate v2](evidence/step-2-review.md) đánh giá hồ sơ; [Register](../governance/artifact-register.md) đăng ký current baseline và [archive v1](../governance/baselines/scope-v1-analysis-v1.zip). Artefact in-review, PO formal sign-off pending; không hai RTM/dictionary cùng hiệu lực.

## Quyết định bước 3 và review M1 (06/10/2026)

Các quyết định dưới đây là quyền nhiệm vụ hoặc lựa chọn triển khai có evidence, không là user research/formal PO sign-off. Những đoạn bước1–2 ở trên giữ lịch sử theo thời điểm, giới hạn không xây bước3 đã được D-23 supersede.

| ID / trạng thái | Quyết định, căn cứ và tác động | Evidence / giới hạn |
|---|---|---|
| D-23 / user giao | Thực hiện đủ bước3 tới M1, đúng scope-v2/analysis-v2 và5nav, chủ động chọn design/stack, không chờ duyệt từng màn; dừngM1 | Thay STEP_RANGE D-12/19 và phần chưa scaffold D-08/18; không mở public/provider/paid/M2/M3 |
| D-24 / implemented technical choice | ADR-001 trước scaffold: React/Vite/TS/Router, CSS/Radix, RHF/Zod, Query/fetch/context+URL, ECharts/Decimal, MSW và Vitest/Playwright/axe. Không dùng Rails vì Sure | Official docs/peer/engine/license trước cài,21pins+lock; Node24.19 build/tests; backend/transport open |
| D-25 / implemented design choice | Đọc và xem40References, học hierarchy/card/charts/nav/forms; FinWeave xanh tiền/vàng tài sản, functional Lucide; SVG logo/mascot tự vẽ, concept không có quyền/animation mặc định. /design và docs trước mở rộng, render→review→sửa | Catalogue/design/component/pattern/spec/a11y có nội dung; system fonts không nhúng; research0participants |
| D-26 / verified UX fixes | Entry mascot44px trong flow header; focus trap/Escape/return; semantic colors resolve tại chart boundary; line Plan hiện cả2nhãn trên360; Settings busy không đóng trước fault request | B11/B12/B13/B19/B21, render/defect log; không screenreader certification |
| D-27 / verified financial/context boundaries | Một memory store, Query ['store'], commit trả snapshot và setQueryData; URL period/scope/selected, không tổng phụ riêng. Goal funded dựa full business clock/all source accounts; AI capture trước send, stale label, mask cảtext/geometry | 28unit/24browser và coverage28AC; demo idempotency/conflict không backend security/concurrency proof |
| D-28 / implemented SRS details | Optional holding cost/P-L theo lượng/date không actual; contributionSchedule chỉ planned; simulation có dated steps; invalid CSV supplement giữ raw/history/postonce | B20 và4unit bổ sung; không đổi28AC/oracle, không tự sinh cash hay trade engine |
| D-29 / gate M1 self-review | M1 PASS bằng AG self-walkthrough/automation, đủ scope và defect fixes; formal PO acceptance pending. DừngM1, giữ tất cả giới hạn nghiên cứu/security/provider và bundle/coldload | EVD-M1-001, EVD-COV-001, JSON/ảnh/demo;0participants, không kết quả research giả |

OD-02/03/04/08/09 vẫn giả định demo; A-01…06/OD-01 chưa participant research. D-18 local≤1s đã có đo warm filter (khôngcoldstart), actual numbers ở performance-results.json. EVD-S2-001 vẫn chỉ gate hồ sơ bước2. [Gate sản phẩm M1](../design/validation-report.md) và [Register](../governance/artifact-register.md) là cập nhật hiện hành.

## Quyết định bước4 và yêu cầu bổ sung 06/10/2026

| ID | Quyết định / căn cứ | Hệ quả / mức bằng chứng |
|---|---|---|
| D-30 | User giao thực hiện bước4, chuẩn bịM2; supersedes chỉdừngM1 cho nhiệm vụ hiện tại, khôngđổiscope28REQ/AC | Reuseapp/stack/design; completecontracts/hồsơ; dừngbước4, chưaStep5/6/M2gate |
| D-31 | ADR002 giữ21exactpins/lock và Node24.19; Zod→OpenAPI3.1.1/JSONSchema2020-12, typedservices/scenarios | No secondapp/backendframework/newdependency; logicalcontracttests khôngstatefulM2implementation |
| D-32 | ADR003 giữlogicalDTOprivate vàclosedrealadapter; ciphertext-onlycandidate, khôngplaintextgateway assumption | SEC-REALblocked: independentclient/code/key/auth/recovery/PoC chưaverified; nofakecrypto |
| D-33 | User chỉrõ thiếuđăngnhập/authvàyêucầucatalogue đầyđủ; thêm7authutilityroutes+session section và13modulecatalogue trong /design | Authmock/scripted .test only, register/recovery/challenge/signout/expiry/denied; no sixnavigation/newAC renumber; realauthblocked |
| D-34 | Authguardtrướcfinancialprovider; sessionmarker synthetic30min tabstorage(no password/key) cho reload, credentialsmemoryonly; logout/expiryresetquery/mockstore/chat; redirectallowlist vàroutepage title | AuthUIcases/unit/browser/3viewport/axe+M1regression; marker khôngsecurityidentityproof. Errors sandbox/temp được xửlýđúngmôi trường, khôngđổicodebỏguard |

FormalPOreview/participantresearch/realprovider/securityPoC cònpending. Chi tiết kết quả thật tạiEVD-S4-001; không dùng protocolfixtures đểtuyênbốbackend/securitygatePASS.


| D-35 | 06/10/2026 / user giao bước5 | Reuse app/stack/design, explicitstatefulMSW network và aggregate strictreadonly snapshot; typednamed mutations, khôngUIfixture/fallback. | ADR004; prototype sameproject on4181 |
| D-36 | 06/10/2026 / implementation | Contract1.1.0 exactmigration +70ops; sessionId response bổsung thuộc mockidentity, khôngclaim1.0compat hay realtransport. Baseline1.0kept. | schema/codegen/API docs |
| D-37 | 06/10/2026 / defects found | MSW policy choGETsameorigin documents; APIunknownerror. Formamountmsg đúng>0; asyncauthlogout/expired routing; CSVdraft/epoch/reset; job/serverAIerrors/history. | Runtime regressionreport, no fakeuserresearch |


D-38 · 06/10/2026: AI history qua cursor/pageSize10, automatic page đến phản hồi mới; capture transaction tab/search/filter và mark stale khi đổi. Expiry route có destination và latch, tránh route guard đổi expired thành login. Regression targeted sau full run; raw failures giữ nguyên, không thay số bằng kết quả giả.

## Bước6 /06-10-2026

| ID | Quyết định / căn cứ | Hệ quả / bằng chứng |
|---|---|---|
| D-39 | User giao testing/bàn giao/nghiệmthuM2, stopM2 | Sameapp/current28REQ/AC/5nav+auth, noStep7–9/realbackend/deploy |
| D-40 | LostcommitACK can produce secondmoney if retry rebuilt | Saveexactrequest/options untilsuccessrefetch; unknownUIretry/key invariant; S6-RETRY/E03 |
| D-41 | Verifyfailureandstalecontext, notstaticcatalogueonly |6HTTPcodes/actualdeadline/CSVepoch/cancel500/queuedcancel/72renderaxe; newrawreportsnotoverwritehistory |
| D-42 | N05 initialtemplate race and IABidleinterception observed | Loadinglocks preserveemptydraft; publicMSW lifecyclewake afteridle keepsrepositorymemory, nofallback/reset; pilotN05/E10 |
| D-43 | Homeinsight tied400k Food/Shopping initiallyambiguous | Allleaders label sharedsnapshot/figure, E08 aftermutation changescorrectly |
| D-44 | §9M2 concerns frontendwithmock; realprivacyPoC unresolved | Evaluate M2mockgate separately; realprotectedintegrationBLOCKED_SECURITY_POC, no UAT/research/securityfabrication |


D-45 · 06/10/2026: Manual prompt “mô phỏng mục tiêu” exposed scripted intent priority; explicit simulation now precedes portfolio/plans/goals after denial/fault guards. Two independent unit oracles and E11 check simulated labels/actual separation and all tied spending leaders; final8-case AI regression PASS on final dist.

D-46 · 06/10/2026: Gate M2 PASS_FRONTEND_SYNTHETIC_MOCK from99unit, full54+AI8=55distinct and72axe renders. Self-review only; real-data integration BLOCKED_SECURITY_POC, P3bundle backlog. Evidence manifests/history preserved; stop M2, no Step7–9.
