> **03/11/2026 — Nhập giao dịch bằng ảnh:** phương thức nhập chính chuyển sang người dùng chọn/chụp ảnh, OCR tách từng giao dịch và tự lưu khi đủ thông tin; trường thiếu chờ kiểm tra. Notification Android là tùy chọn. [Yêu cầu và thiết kế hiện hành](screenshot-transaction-entry.md). Các mô tả collector bắt buộc bên dưới là lịch sử phương án trước thay đổi này.

# FinWeave — Product Requirements Document v3

PRD-001 · 07/10/2026 · scope-v3 / operational-v3 · yêu cầu làm việc, chưa nghiệm thu sản phẩm.

Mục tiêu: sản phẩm chạy thực tế với admin web, user web và user Android, ưu tiên chi phí thấp. Lần rà soát này **chỉ sửa tài liệu**, không sửa frontend/backend hoặc deploy. [Báo cáo](../execution/product-realignment-audit.md) ghi bằng chứng; [PRD v2](../governance/baselines/pre-realignment-2026-10-07/docs/product/prd.md) giữ lịch sử. Không đánh đồng tài liệu mới với phần mềm đã triển khai.

## 1. Vấn đề và giá trị

Người dùng cá nhân cần nhìn chung tiền ở ngân hàng/ví/tiền mặt và giá trị cổ phiếu/vàng, giảm nhập giao dịch thủ công, hiểu nguyên nhân biến động và chuyển mục tiêu thành kế hoạch khả thi. Mỗi số liệu có nguồn, thời điểm và độ đầy đủ; không gọi số dư tính toán là số dư ngân hàng đã xác minh, không gọi tổng bốn nhóm là tài sản ròng đầy đủ khi chưa có nợ.

Giả thuyết khác biệt: nối thu nhận Android, định giá tài sản Việt Nam và Agent cùng người dùng xây dựng/điều chỉnh Plan–Goals có căn cứ. Đây chưa phải USP đã được nghiên cứu thị trường chứng minh. Chat/linh vật không tự tạo ra lợi thế sản phẩm.

## 2. Ba giao diện

| Giao diện | Trách nhiệm |
| --- | --- |
| User web | Theo dõi/sửa dữ liệu của mình, tài sản, giao dịch, Review, thiết bị; tạo Plan/Goals thủ công hoặc cùng Agent |
| User Android | Các tác vụ user cốt lõi và native notification access, chọn app nguồn, trạng thái collector/outbox; APK có ký |
| Admin web | Tình trạng tài khoản, app/parser/provider/jobs/quotas, lỗi đã khử dữ liệu và hành động vận hành có audit; không đọc sổ tiền, raw notifications hay hội thoại của user |

Một backend, một ledger, cùng workspace trên web/mobile. Web vẫn dùng được với manual/CSV khi chưa cài Android; chỉ thu nhận notification phụ thuộc điện thoại đã cài app và cấp quyền. Admin có role/session/API riêng, không nút đổi sang workspace tài chính của user.

## 3. Phạm vi và thứ tự phát hành

- **R1 tracking:** identity thật, ba giao diện, persistence, Android notification cho app được xác minh, manual/CSV fallback, holdings cổ phiếu/vàng, daily/manual prices, sync/Review, quyền và restore.
- **R1.1 Plan/Goals có Agent:** Plan/Goals/simulation đã có thiết kế được nối dữ liệu thật; Agent tích hợp ngay trong tạo/chỉnh/theo dõi kế hoạch và mục tiêu, không chỉ trang chat riêng. Thử nghiệm giá trị Agent là gate nghiệm thu tính năng, không lý do tách nó khỏi Plan/Goals. Tracking vẫn hoạt động khi model không khả dụng.

Ưu tiên miễn phí, không cam kết dữ liệu thị trường, AI, domain hoặc quy mô nào cũng 0đ. Ngoài R1: iOS collection/IPA, SMS/email, Accessibility scraping, tự đăng nhập ngân hàng, chuyển tiền/đặt lệnh, mọi ngân hàng/ví, realtime tick, nợ/đa tiền tệ và microservices. Giữ frontend hiện có để tái sử dụng; thứ tự release không có nghĩa xóa màn.

## 4. Cổ phiếu và vàng

### Cổ phiếu

User chọn mã từ catalog hỗ trợ và nhập số cổ phiếu; hệ thống gắn instrumentId/sàn/đơn vị, ngày khai báo mặc định hôm nay. Chỉ hỏi thêm khi mã không duy nhất; cost basis tùy chọn. Không bắt user nhập API key để khai báo holdings. Nếu provider chỉ cho key cá nhân, đó là dependency chưa đạt luồng tối giản, không tự thêm vào onboarding bắt buộc.

Giá trị = quantity × quote hợp lệ VND/cổ phiếu. Quote không thay quantity hoặc cash/income. Thiếu giá vốn thì lãi/lỗ unknown, vẫn định giá được. Quantity do user khai báo/sửa có lịch sử; instrument đổi hoặc corporate action chưa xử lý phải Review, không suy đoán holdings từ giá.

### Vàng

User xác nhận **một hồ sơ vàng mặc định** trong onboarding: loại, tuổi vàng, thương hiệu/nguồn, chiều mua/bán. Sau đó chỉ nhập số chỉ; có thể chọn loại khác khi cần. Đề xuất vàng nhẫn 9999 của một nguồn nội địa có quyền, dùng giá mua vào để ước tính bán lại. Nguồn/sản phẩm cụ thể còn phải xác minh; không dùng profile demo làm giá thật.

Giá trị = số chỉ × giá mua vào VND/chỉ; một lượng = 10 chỉ. Ghi là giá trị tham chiếu, không giá bán lại được bảo đảm. Không gộp nhẫn/miếng/tuổi vàng/thương hiệu, không lấy giá quốc tế quy đổi làm giá thu mua trong nước. Hồ sơ chưa xác nhận hoặc quote không tương thích: giữ quantity và hiển thị chưa định giá.

### Giá hằng ngày và cập nhật chủ động

Server lập lịch một lượt mỗi ngày; mặc định thiết kế 18:00 Asia/Ho_Chi_Minh, cấu hình được. Không bảo đảm provider có giá đóng cửa đúng thời điểm đó. Ngày nghỉ dùng giá phiên gần nhất với quoteAsOf gốc. Nút Cập nhật yêu cầu lấy dữ liệu mới nhất nguồn cho phép, không hứa giá sẽ đổi.

Daily/manual dùng chung pipeline, coalesce job đang chạy, cooldown/cache/quota theo quyền dữ liệu. Phân biệt lastAttempt, lastSuccess, quoteAsOf và trạng thái job. Lỗi/partial giữ giá cuối cùng có nhãn, không thay missing bằng 0 hoặc đổi timestamp giá khi chưa có giá mới. Giá biến động không tạo income/expense trong ledger.

## 5. Giao dịch ngân hàng/ví qua Android

Luồng: giải thích quyền → user bật Notification access trong Android → chọn app hỗ trợ → map nguồn với tài khoản → thu notification mới → lọc/chuẩn hóa → durable receipt trên server → posting hoặc Review → hai client lấy snapshot mới.

Từ chối/thu hồi quyền không ngăn dùng manual/CSV. Chỉ xử lý app được chọn, không thu OTP/credentials/nội dung app khác. Notification là evidence quan sát, không chứng nhận giao dịch cuối cùng ở ngân hàng. Thiếu amount/direction/account, mẫu không hỗ trợ hoặc nội dung che: Review, không bịa bút toán.

Phân biệt gửi lại cùng sự kiện, notification bị update, hai thiết bị, CSV chồng dữ liệu với hai giao dịch thật cùng số tiền. Transfer nội bộ có thể có hai thông báo nhưng chỉ một transfer hai legs, phí riêng. Thiếu opening/coverage thì số dư mang nhãn tính toán/không đầy đủ.

Không hứa thu hồi lịch sử đã mất, nguồn không phát thông báo, force-stop, OS redaction hay mọi OEM. Phải có support matrix từ thử thiết bị thật; [thiết kế Android](../architecture/android-collector.md) nêu giới hạn. Không dùng SMS/email như fallback tự động chưa được user chọn.

## 6. Sync và authority

Server giữ ledger/snapshot chuẩn; mobile giữ encrypted outbox và cache versioned. ACK received chưa phải posted. Sau commit, client refresh snapshot. Foreground polling + refresh-on-focus là baseline; realtime push là tối ưu sau, không bắt buộc để đạt cùng dữ liệu khi mở app.

Retry không double money; conflict yêu cầu xem lại, không last-write-wins. Logout/revoke dừng capture/upload. Không gửi hàng đợi user A bằng phiên user B. Client không cần bật để server cập nhật giá hằng ngày.

## 7. Agent tích hợp Plan và Goals

**Kế thừa và phát triển cùng một trợ lý:** giữ hỏi–đáp/giải thích tiền, giao dịch, tài sản, Plan/Goals/mô phỏng; full chat, history, evidence/drill và linh vật contextual. Agent đa bước bổ sung trên nền đó, dùng chung conversation và Engine. Người dùng hỏi câu đơn giản vẫn được trả lời trực tiếp. [AI-SPEC-001](ai-agent-specification.md) hợp nhất yêu cầu cũ/mới với mã AI-FR-001…024 và AI-NFR-001…008; không yêu cầu xóa capability cũ. Scripted adapter là demo/baseline, implementation thật có thể tiến hóa mà giữ capability.

**UC-PG-AGENT:** user nêu mục tiêu → Agent đọc snapshot tài chính/Plan/Goals được phép → hỏi target/deadline/priorities/reserve khi thiếu → đề xuất GoalDraft và PlanDraft liên kết → Engine tính khả thi, shortfall, cashflow và allocations → Agent so sánh/điều chỉnh theo phản hồi → user xem preview thay đổi → xác nhận → backend lưu phiên bản mới có audit.

User có thể tạo Goal trước rồi nhờ Agent xây Plan, hoặc nhờ Agent xây Plan tổng thể rồi đề xuất các Goal phù hợp. Không phải mọi planned item đều gắn một Goal. Tiền dự kiến không trở thành funded allocation. Khi thực tế lệch kế hoạch, user mở “Phân tích và điều chỉnh”; Agent điều tra nguyên nhân, nêu dữ liệu thiếu, tạo amendment draft; không tự sửa active plan. Nhắc rà soát định kỳ có thể dùng rule trigger, còn cuộc điều tra dùng Agent nếu thực sự cần.

**UC-INVESTIGATE:** “Vì sao tiền giảm dù thu nhập không đổi?” Agent kiểm coverage, transfer/refund/trùng/phí, planned-vs-actual và biến động giá; chọn bước tiếp theo dựa trên kết quả; trả evidence, kết luận và phần chưa xác định. Đề xuất xử lý case không đồng nghĩa đã sửa ledger.

Agent vẫn sử dụng tool calling; giá trị là chuỗi quyết định phụ thuộc evidence, hỏi lại, lặp mô phỏng và xử lý mục tiêu mở. Scheduler/định giá/số dư/sync/dedupe chắc chắn dùng thuật toán xác định. Không tuyên bố workflow lập trình thường không thể làm các tác vụ này; cần đo Agent có giúp hoàn thành tốt hơn và giảm công người dùng hay không.

[Agent spec](ai-agent-specification.md) định nghĩa draft tools, state/budget, so sánh baseline và failure modes. Linh vật/chat riêng là điểm truy cập phụ; entry points trong Plan/Goals là bắt buộc ở release tính năng này.

## 8. Nghiệm thu và dependency chưa giải quyết

R1 cần APK cài được, một ngân hàng và một ví cụ thể được thử end-to-end, nguồn giá có quyền, daily/manual jobs, persistence/restart, sync, admin authorization, restore và UAT theo [SRS](../requirements/srs.md). Các nguồn chưa thử phải ghi unsupported. AC mock cũ chỉ là evidence synthetic ở thời điểm test.

Owner đã chọn **A + T1 TRUSTED-SERVER** ngày08/10/2026 tại [ADR-008](../architecture/adr/ADR-008-modular-backend-trusted-server.md): modular backend/shared Engine, infrastructure/runtime/DBA được tin xử lý finance dạng rõ; app-admin vẫn không đọc finance. Thay target chống root Ops trước đây theo [SRS NFR-08 cập nhật](../requirements/srs.md); không cam kết anti-Ops. Chưa xác minh: ngân hàng/ví, provider/entitlement/chi phí, gold profile, Android/OEM, model/privacy/budget và security/runtime evidence. T1 không bảo đảm miễn phí hoặc tự cho phép dữ liệu thật trước SEC-REAL-T1.
