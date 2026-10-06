# FinWeave — Glossary

ID REQ-GLO-001 · v2.0 · analysis-v2/scope-v2 · 05/10/2026 · in-review. Agent owner/self-review; PO pending. Nguồn Scope/Ideas và [Rules](../product/business-rules.md)/[Data](../data/data-requirements.md); dùng thống nhất trong PRD/SRS/UC/scenarios, không cần diễn giải ledger trong UI.

| Thuật ngữ | Định nghĩa trong phạm vi / phân biệt |
|---|---|
| Chủ workspace demo | Actor quản lý dữ liệu giả, không là bằng chứng identity/isolation thật |
| Account / tài khoản tiền | Bank/wallet/cash user theo dõi, khác ledger account nội bộ |
| Asset / holding | Asset định danh mã+thị trường hoặc sản phẩm vàng; holding là lượng user khai báo của asset |
| Opening / số dư đầu kỳ | Số tại mốc bắt đầu; vốn ban đầu, không income; biến động sau mốc không chứa opening lần hai |
| Balance calculated / observed | Số tính từ committed effects; số đếm/tham chiếu tại mốc là quan sát độc lập, không tự thay số tính |
| Source record / evidence / event | Bản ghi đầu vào; căn cứ liên kết; sự kiện nghiệp vụ. Nhiều bản ghi có thể là evidence một event |
| Posting / reconciliation / categorization | Ghi sổ, đối soát, phân loại độc lập; posted có thể chưa matched, uncategorized vẫn tính chi |
| Draft / pending / posted / reversed | Nháp/chờ không có committed money effect; posted có; reversed original vẫn được tính cùng reversal theo dấu |
| Income / gross expense / refund / net expense | Thu nhập sinh hoạt; chi tiêu gộp; hoàn tiền event riêng; chi thuần=gross−refund kỳ nhận, có thể âm |
| Cash flow / dòng tiền | Tiền vào−ra qua ranh giới account tiền đã chọn; khác income−expense khi có đầu tư, adjustment hoặc transfer ngoài scope |
| Transfer / fee / clearing | Chuyển giữ a tài khoản; phí expense riêng; clearing biểu diễn phía chưa đủ căn cứ, không giả tiền ở tài khoản đích |
| Unresolved receipt | Tiền nhận đủ căn cứ nhưng loại chưa rõ; vào clearing, chưa gán income/refund cho tới quyết định có evidence |
| Adjustment unknown | Điều chỉnh tiền được user xác nhận có lý do nhưng chưa rõ nguyên nhân; không tự expense hoặc income sinh hoạt |
| Reversal / replacement / reclassification | Đảo tác động gốc; event thay thế; đổi phân loại có dấu vết. Giữ original, không xóa lịch sử |
| Category override / source revision | Quyết định category thủ công ưu tiên; revision nguồn là thay dữ liệu gốc, không đè override |
| Idempotency / deduplication | Retry cùng thao tác không tác động hai lần; xác định nhiều evidence mô tả cùng event. Cùng amount/date chưa đủ dedupe |
| Price quote / FX / valuation | Giá theo unit/time/source; tỷ giá có pair/time/source; lượng×giá tương thích×FX. Giá thay không tạo cash flow |
| International reference / compatible quote | Giá quốc tế dù đổi ra VND/chỉ vẫn quốc tế; compatible phải đúng product/purity/unit/market, không tự thành giá thu mua nội địa |
| Quantity as-of / quote as-of / last success | Mốc lượng; mốc giá; lần cập nhật nguồn thành công; không thay thế nhau |
| Fresh / stale / unknown | Tuổi trong/ngoài ngưỡng fixture OD-02 hoặc thiếu căn cứ; stale không mất dữ liệu, unknown không số0 |
| Tài sản đang theo dõi | Tiền+holdings có định giá trong scope; chưa bao phủ nợ nên không “tài sản ròng đầy đủ” |
| Known subtotal / missing components | Tổng phần đã biết kèm phần chưa định giá; không số0 thay thiếu, không tổng đầy đủ/tỷ trọng đầy đủ |
| Snapshot / version / as-of / period | Kết quả cùng nguồn versions/scope; revision dữ liệu; mốc tính; kỳ half-open +07. UI không tự cộng một sổ khác |
| Scope / archived | Tập tài khoản/tài sản được tính; lưu trữ ngăn mutation mới, giữ lịch sử. Archive không delete và scope không ownership |
| Review case / resolution | Nghi vấn với evidence/preview/decision; resolved có thể accept/reject, user_confirmed không độc lập ngân hàng |
| Connection / import status | Trạng thái kết nối khác job, row, posting và quality. Connected vẫn có thể stale |
| Synthetic / fixture / oracle | Dữ liệu hư cấu; bộ scenario/reset cố định; expected tính độc lập từ input, không lấy output app làm expected |
| M1 / M2 / M3 | Prototype mô phỏng; frontend/API layer+mock; sản phẩm backend thật đủ gate. Hồ sơ bước 2 chưa đạt M1 |
| Agent phát triển / Assistant | Agent tạo hồ sơ/code; Assistant AI trong sản phẩm được chọn scripted M1. Không có Gemini integration nhiệm vụ này |
| Privacy masking / protected boundary | Che hiển thị; ranh giới giải mã chống Ops cần PoC/test thật. Masking/demo/DB encryption riêng không chứng minh boundary |
| Verified / in-review / working baseline | Verified phải nêu loại bằng chứng (tài liệu hoặc sản phẩm); in-review artefact chờ PO; baseline làm việc không formal approval |

Tiếng UI thống nhất: “Tổng quan”, “Giao dịch”, “Tài khoản & Tài sản”, “Nguồn dữ liệu”, “Kiểm tra dữ liệu”, “tự khai báo”, “chưa có dữ liệu”, “giá tham chiếu”, “dữ liệu demo”. Không dùng “đã xác minh” cho khai báo user hoặc “realtime” cho quote fixture.

## Thuật ngữ scope-v2

| Term | Nghĩa |
|---|---|
| 5 navigation | Tổng quan & Báo cáo; Giao dịch; Plan; Dữ liệu; Trợ lý AI. Tài sản nằm trong Home, Sources/Review trong Dữ liệu, settings qua hồ sơ |
| Period / effective as-of / coverage | Activity trong khoảng half-open; balance/valuation tại thời điểm không vượt clock hoặc cuối kỳ. Coverage nêu phần dữ liệu biết được sau trackingStart; quý/năm có thể partial |
| Cơ cấu tài sản / balance sheet trong scope | Cơ cấu 4 nhóm tài sản theo dõi; chưa có liabilities nên không là full balance sheet hoặc net-worth |
| Planned / actual / simulated | Dự kiến user khai báo; events/holdings đã ghi nhận; kết quả giả định từ frozen baseline. Không cộng cả ba như actual |
| Remaining forecast / variance | Dự kiến còn lại sau actual mapping; chênh so Plan ban đầu. Overspend riêng, không chi lại khoản đã actual |
| Goal allocation / funded / shortfall | Earmark cash hiện có; phần thực sự được cash tài trợ; thiếu nguồn. Allocation không là cash movement hoặc tài sản mới |
| Goal achieved | User xác nhận khi funded đủ target; status không tạo tiền/tài sản. Funding về sau có thể hụt và vẫn giữ history đạt |
| Insight | Nhận xét rule/scripted AI có source/snapshot/version/period/action; thiếu comparison không khẳng định trend |
| ToolResult / captured context | Kết quả Engine/read-only có refs/quality; navigation/period/scope/object/versions được chụp cho message. History narrative không là current snapshot |
| Linh vật / mascot | Icon mở chat FinWeave ở cả 5 navigation; cùng conversation với full chat |
| Scripted AI demo | Phản hồi mẫu cùng result cards xác định để thử luồng UX; không chứng minh model/provider đã hoạt động |
