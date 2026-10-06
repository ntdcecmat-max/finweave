# FinWeave — Problem Statement

Ngày 05/10/2026; version2.0, scope-v2. Các nhận định là giả thuyết từ Ideas, không phải kết quả phỏng vấn. Liên kết vấn đề với scope qua UP-01…05.

## Phát biểu vấn đề

Cá nhân theo dõi tiền và tài sản từ nhiều nơi có thể phải tự nhập, cộng và kiểm tra những dữ liệu khác loại. Khi thông báo, sao kê, tiền mặt khai báo và giá thị trường được trình bày như các thông tin tương đương, người dùng có thể nhầm tổng tiền với tổng tài sản, đếm chuyển nội bộ hai lần hoặc tin số liệu chưa đủ/cũ là số thực tế đầy đủ. FinWeave cần giúp họ trả lời câu hỏi tài chính trong phạm vi dữ liệu có căn cứ và sửa phần chưa rõ.

| Vấn đề | Nguyên nhân giả định | Hệ quả cần xác minh | Yêu cầu kiểm chứng |
|---|---|---|---|
| UP-01: tiền ở nhiều tài khoản | Thiếu cái nhìn cùng phạm vi/mốc | Tốn thời gian cộng, bỏ sót nguồn | AC-01…03,13–14: đọc đúng tổng và nguồn đóng góp |
| UP-02: tiền mặt thiếu/có lệch | Nhập muộn, không kiểm đếm, nhầm rút tiền là chi | Chi tiêu và tiền còn lại có thể sai | AC-08–09: ghi chi và hiểu lệch, không tự tạo chi |
| UP-03: lượng và giá không đồng thời | Quote mới nhưng holdings khai báo cũ, đơn vị vàng khác | Định giá thiếu căn cứ hoặc hiểu sai tiền sẵn có | AC-04–05,10,16: tách lượng/giá/time/unit |
| UP-04: tổng khó giải thích | Chart không mở căn cứ, giao dịch thiếu nhóm | Khó tìm khoản chi lớn hoặc sửa nhóm | AC-11–14: tìm đúng khoản và giữ ngữ cảnh |
| UP-05: dữ liệu nhiều nguồn khó kiểm tra | Trùng evidence, transfer/refund/missing fields mơ hồ | Có thể đếm lặp hoặc xác nhận sai | AC-06–07,15: preview, bằng chứng, thay đổi một lần |

## Cần nghiên cứu gì

Chưa biết mức thường gặp/tần suất, công cụ user đang dùng, độ khó nhập, lý do bỏ cuộc và nhu cầu quản lý holdings. Các phương án user có thể đang dùng như sổ, bảng tính, ứng dụng ngân hàng riêng là giả định về hành vi, chưa phải nghiên cứu đối thủ.

Khi có người tham gia, hỏi ba câu hỏi tài chính họ thực sự cần trả lời, lần gần nhất gặp lệch/trùng, cách họ khai báo cash/holdings và thiết bị thường dùng. Cho họ chạy tác vụ giả; ghi điều quan sát, trợ giúp và câu trả lời. Không yêu cầu dữ liệu tài chính thật chỉ để xác minh prototype.

## Ranh giới giải quyết

M1 giải quyết cách đưa dữ liệu giả vào, hiểu số và Review trên giao diện. Không chứng minh giảm công nhập tự động ngoài đời, độ chính xác nguồn, sổ bền vững hoặc Ops không đọc được tài chính. Plan/Goals/AI và Insights được chọn qua D-19/AC-19…28; Alerts và Budget advanced độc lập vẫn chưa chọn.

## Vấn đề bổ sung từ ý tưởng 5 navigation — giả thuyết

| ID | Vấn đề giả định | Yêu cầu kiểm chứng |
|---|---|---|
| UP-06 | Dữ liệu hiện tại tách khỏi dự định thu–chi/đầu tư; chưa biết chênh lệch hoặc nguồn goal bị hụt | AC-22…26: lập Plan, link actual, so variance, goals/shortfall và mô phỏng; không cộng dự kiến vào actual |
| UP-07 | Phải tự đọc chart/detail để giải thích; chat mất ngữ cảnh khi chuyển trang | AC-21/27/28: insight có căn cứ, AI theo period/scope/object và mascot dùng cùng chat |
| UP-08 | Nhiều màn rời rạc, khó tìm tài sản/Review và đọc báo cáo nhiều kỳ | AC-19/20: đúng 5 navigation, tài sản dưới Home, Sources/Review dưới Dữ liệu; period/as-of đúng |

A-05: user muốn Plan/Goals liên kết actual; A-06: AI contextual giúp hiểu số. Đây là giả thuyết tác động, không nghiên cứu đã thực hiện. PO/AG theo dõi, đánh giá thật khi có người ở bước 3.
