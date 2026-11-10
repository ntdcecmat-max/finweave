# Vai trò thực chất và workflows

## Khi nào dùng Agent

Câu hỏi “Tôi có bao nhiêu tiền?”, xem tiến độ Goal, daily price và parse notification là read/Engine/rule jobs phù hợp luồng cố định. Giữ câu trả lời nhanh và đầy đủ context; không bắt mọi câu hỏi tạo AgentRun. Task mở có nhiều ràng buộc hoặc chưa biết nguyên nhân mới cần Agent chọn bước tiếp theo. Router server xác nhận mode/intent và scope; model classification là gợi ý, không quyền tự chuyển sang draft/active changes.

| Hành trình kế thừa | Agent làm gì khác một nút trigger | Đầu ra/authority |
| --- | --- | --- |
| PG-01 Goal-first | Đọc khả năng hiện tại/coverage/competing goals; hỏi reserve/deadline nếu thiếu; thử phương án đóng góp hoặc thay lịch; chọn lại theo violations | Goal+Plan draft có assumptions/evidence, không tăng funded |
| PG-02 Plan-first | Chuyển ý định mở thành items/constraints; đề xuất Goals hợp lý; xử lý tháng bỏ đóng góp, thu nhập bất định và ưu tiên mâu thuẫn | Plan draft, optional Goals/links; không ép item nào cũng gắn Goal |
| PG-03 actual replanning | Đọc variance và phân biệt chi tiêu thật/transfer/valuation/coverage; thử amendments giữ reserve/những Goal khác; giải thích trade-offs | Amendment draft, active versions giữ tới owner confirm |
| INV-01 investigation | Chọn kiểm coverage trước hoặc split cashflow/valuation, rồi evidence/transfer/duplicate/fee/refund theo quan sát; tìm cả phản chứng | Conclusion/partial và Review proposal, không sửa actual |

Ví dụ giả: owner muốn Goal60triệu/12tháng, có Plan sửa nhà và cần reserve. Sau read thấy reserve chưa xác nhận → hỏi. Owner trả lời thì Engine compare phương án; nếu tháng12 bỏ đóng góp thì Agent đổi timeline, không chỉ cộng bình quân một lần. Thiếu cash capacity không được tự thêm income/bán cổ phiếu/giảm reserve hoặc tăng lợi suất. Deadline/target là ràng buộc cứng cho tới owner chọn trade-off; profile growth không là bảo đảm lợi nhuận.

## Trace bounded, không diễn kịch Agent

Một trace PG-01 có thể là getPlanningContext → askClarification → compareScenarios(tối đa3candidates, cùng snapshot/constraints) → proposePlanningDraft → finishRun. Nếu phải sửa sau violations thì amendPlanningDraft → simulatePlan → finishRun, tổng không vượt8acceptedactions. Đây là trace minh họa, runtime chọn bước theo evidence, không bắt làm đủ để “trông thông minh”. Simple case không hỏi lại reserve đã xác nhận; clean investigation có thể dừng sớm. Budget hết trả partial và draft/evidence hiện có, không vòng lặp vô hạn.

Compare là pure bounded batch trong Engine (không recursive model/tool), một call phải charge toàn compute slice/bytes/variants và tất cả underlying domain reads. Không giấu nhiều egress/tool calls trong helper để né budget. Heavy stochastic forecast dùng ForecastWorker đã có, không poll/spawn vô hạn trong Agent60s; nếu vượt active budget trả partial/deep-link existing forecast flow, vẫn giữ feature full forecast.

Owner xem/chỉnh/discard draft bằng form hoặc chat cùng conversation. Preview/confirm do **owner service riêng**, atomic Plan+Goals+links; chat “đồng ý” không confirm; không tạo actual, chuyển tiền hoặc đặt lệnh chứng khoán. Agent không gọi allocateGoal/markGoalAchieved/confirmPlanningDraft/postDraft. Manual form/simulator và các capability cũ vẫn hoạt động khi model unavailable hoặc quota hết; giữ Agent use cases trong backlog để cải thiện, không bỏ feature khi eval chưa đạt.
