# UX Research Plan — chưa có nghiên cứu người dùng

DES-RSR-001 · v0.1 · 06/10/2026 · scope-v2/analysis-v2 · in-review. AG chuẩn bị; tuyển người và reviewer nghiên cứu chưa được chỉ định. **0 người tham gia, 0 phỏng vấn, 0 khảo sát.** Không tạo Research Results. Kết quả [Agent tự kiểm chứng kỹ thuật](validation-report.md) được ghi riêng.

## Câu hỏi và giả thuyết

Kế hoạch kiểm chứng A-01…06: người quản lý nhiều tài khoản có tìm được tiền đang ở đâu; hiểu tiền khác tài sản đang theo dõi; đọc gross/refund/net; mở được giao dịch tạo nên tổng; phân biệt lượng sở hữu và giá cập nhật; hiểu planned, goal earmark và simulated không là tiền đã phát sinh; panel AI có giúp tìm căn cứ hay làm nhầm context.

Đề xuất 5 người tự quản lý ít nhất hai tài khoản tiền, có sử dụng cash và ít nhất một nhóm cổ phiếu/vàng; gồm người dùng mobile thường xuyên và desktop. Đây là mẫu khám phá nhỏ, chưa tuyển, không đại diện thị trường. Không yêu cầu dữ liệu tài chính thật. Chỉ dùng fixture giả của prototype. Rubric đề xuất ≥4/5 hoàn thành độc lập cần thống nhất trước session; hiện không có tỷ lệ kết quả.

## Session dự kiến 35–45 phút

| Tác vụ | Câu hỏi / điều cần quan sát |
|---|---|
| Khai báo bốn nhóm | Tìm thiết lập và trường opening; có nhầm opening thành income hay không |
| Ghi chi cash150k | Nhập, preview, hủy rồi xác nhận; giải thích tác động lên cash và expense |
| Import CSV giả | Hiểu valid/invalid/duplicate, chọn subset và biết khi nào dữ liệu được ghi |
| Đọc Tổng hợp | Trả lời tiền ở đâu, nhóm chi nào lớn; bấm để giải thích một số và source/time/unit |
| Xử lý nghi vấn | Mở duplicate hoặc transfer, đọc evidence; phân biệt observation với điều chỉnh có tác động |
| Plan và Goal | Nhập thu5m/chi2m/đầu tư1m; đọc actual vs remaining; allocate3m vào goal5m và hiểu shortfall |
| Simulation | So góp tiền, mua tiêu dùng và đầu tư; nhận biết frozen snapshot/giả định và actual không đổi |
| AI và privacy | Panel → full chat/history; đổi kỳ khi chờ; mở căn cứ; bật mask và giải thích context của kết quả cũ |

Đổi thứ tự desktop/mobile giữa người tham gia; không huấn luyện thao tác trước tác vụ. Moderator hỏi trung tính “Bạn đang nghĩ gì?” và ghi mọi lần trợ giúp. Không dẫn người tham gia đến nút cần tìm rồi gọi đó là hoàn thành độc lập.

## Thu thập, đánh giá và quyền riêng tư

Ghi participant ID ẩn danh, thiết bị/viewport, tác vụ, giờ bắt đầu/kết thúc, completion độc lập/assisted/fail, path, lỗi, số lần trợ giúp, câu trả lời về khái niệm và trích dẫn khi đã consent. Completion không đồng nghĩa satisfaction. Ghi rõ bỏ tác vụ/lỗi kỹ thuật để không nhầm với lỗi hiểu nghiệp vụ.

Phân loại critical khi sai cách hiểu tài chính hoặc không hoàn thành tác vụ; major khi mất ngữ cảnh/không tìm được action; minor khi visual chưa rõ. Tổng hợp theo tác vụ/thiết bị, giữ số người và giới hạn mẫu. Consent, quyền ghi âm/ảnh, retention và nơi lưu phải thống nhất trước ghi dữ liệu participant; không tự lấy thông tin cá nhân hoặc số dư thật.

Khi có nghiên cứu thật mới tạo Results gồm mẫu/phương pháp/data, findings có evidence, mức nghiêm trọng, thiết kế sửa và tác vụ kiểm lại. Hiện chỉ có plan và status0participants. Không suy walkthrough của Agent thành bằng chứng A/OD đã được người dùng xác nhận.
