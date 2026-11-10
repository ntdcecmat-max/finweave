# Thần tài: chat và floating pet

Tài nguyên gốc nằm trong `asset linh vật agent/`, được giữ nguyên. Frontend dùng các bản sao với tên ASCII trong `finweave-web/public/mascot/`.

| Tài nguyên | Trạng thái | Hành vi |
| --- | --- | --- |
| Thần tài 2 | `idle` | Trạng thái mặc định; video lặp ở tốc độ 0,75×. PNG thay biểu tượng SVG cũ. |
| Thần tài 3 | `thinking` | Lặp 0,85× trong thời gian yêu cầu AI đang chờ, kể cả khi hủy chưa được xác nhận. |
| Thần tài 4 | `wave` | Chào khi mở panel/chat, bấm avatar hoặc hover avatar chat lần đầu; phát đoạn 0–5,6 giây ở 1,4×, sau đó về idle. |
| Thần tài 1 | `celebrate` | Kết quả AI thành công, xác nhận thay đổi dữ liệu hoặc hover pet; phát đoạn 0–8 giây ở 1,25×, sau đó về idle. |

Pet nổi: khung nhân vật 112px trên desktop, 92px trên mobile. Avatar chat 60px; avatar trong lịch sử phản hồi 36px và chỉ dùng ảnh tĩnh. Nút mở trợ lý trên header 44px dùng ảnh Thần tài 2.

Pet hỗ trợ kéo bằng pointer/touch, phím mũi tên (16px; Shift: 32px), bấm để mở trợ lý, thu gọn, khôi phục, tạm dừng chuyển động và đặt lại vị trí. Vị trí và các tùy chọn này được lưu trong sessionStorage cùng tab. Pet ẩn khi có dialog/panel hoặc đang xem trang AI, và không xuất hiện ở màn đăng nhập. Trên mobile, vị trí được giữ phía trên thanh điều hướng.

Các MP4 gốc là video 1280×720, dài khoảng 10 giây, có nền sáng. `Mascot.tsx` cắt khung giữa khi hiển thị và loại phần nền sáng trung tính nối với biên bằng canvas 192×192, 15 khung/giây. Đây là xử lý lúc hiển thị; không thay đổi tài nguyên gốc. PNG nền trong suốt được dùng trong lúc tải, khi video lỗi, khi tạm dừng hoặc khi `prefers-reduced-motion` được bật. Video tắt tiếng, dừng khi tab ẩn hoặc avatar ngoài vùng nhìn thấy; chỉ avatar đang hiển thị phát chuyển động.

`MascotProvider` dùng trạng thái chờ và ID phản hồi hoàn tất từ `ChatProvider`, không suy đoán thành công từ lịch sử được tải lại. Phản hồi lỗi/hủy trở về idle. Video một lần có giới hạn thời gian dự phòng để không kẹt trạng thái nếu video bị gián đoạn.

Kiểm tra: `tests/mascot.browser.test.ts` bao gồm nền trong suốt khi phát video, hover một lần, greeting, thinking/success/error/cancel, kéo và bàn phím, thu gọn/tạm dừng qua reload, viewport mobile, reduced motion, ẩn khi có dialog/logout và axe cho vùng pet. Các regression AI/context/cancellation và vị trí nút header được chạy cùng cấu hình local `work/mascot-review.config.ts`. Không thay đổi kết quả nghiệm thu M2 trước đây.
