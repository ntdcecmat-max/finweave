# Lựa chọn nguồn và quyết định

Ngày kiểm09/10/2026, desk research tài liệu công khai; không tạo account/key, gọi market API, scrape bảng giá hay lấy thông báo thật. [Research register](research-sources.json) ghi nguồn primary và giới hạn. Đây là lựa chọn kiến trúc adapter; provider thật cần entitlement và PoC, không coi im lặng là phê duyệt.

## Cổ phiếu Việt Nam

| Option | Phù hợp và trade-off | Kết luận |
| --- | --- | --- |
| M0 Synthetic + owner manual dated quote | Không phụ thuộc quota/keys; manual không đáp ứng tự cập nhật giá thật | Baseline để xây và kiểm đủ feature; không gắn nhãn live |
| M1 SSI FastConnect V3 REST read-only | Official documented catalogue/daily data; cần tài khoản SSI, read-only scope, quyền dùng theo consumer và quota thật. Finality/price scale/time mapping phải chứng minh | **Ứng viên ưu tiên cho PoC**, chưa activate/đăng ký; không trading |
| M2 Licensed market data provider | Có thể có SLA/rights rõ cho nhiều user; cần báo giá/license/contract cụ thể | Adapter cùng interface, không vendor/chi phí ngầm được chọn |
| M3 Vnstock như connector tùy điều kiện | Software license riêng, upstream rights riêng; thêm dependency/Python nếu dùng bản Python, không tự nhiên khớp Fastify TS | Không bắt buộc trong stack; chưa cài, chưa chọn tier/nguồn |

SSI xác định V3 là hướng thay V2, V2 hết phát triển tính năng mới01/01/2027 và cần chuyển trước30/06/2027. Không khởi tạo adapter mới bằng V2 hoặc lấy unit/page limits V2 áp sang V3. [SSI migration](https://developers.ssi.com.vn/docs/faq/v2-to-v3-migration).

SSI hiện chưa thu phí FastConnect, yêu cầu tài khoản chứng khoán; key có thể scope chỉ đọc Market Data, quota theo key/endpoint/method; UAT còn tùy việc SSI công bố sẵn sàng. Đây chưa chứng minh quyền SaaS, cache hay redisplay. [SSI overview](https://developers.ssi.com.vn/docs/faq/service-overview).

Tài liệu V3 catalogue/summary/OHLC được ghi riêng trong research. Field giá chuỗi, tradingDate và paging không tự xác nhận scale/quote timestamp/finality/adjusted basis. Không chạy interactive API explorer hoặc dùng credentials. UAT endpoint, pagination hard cap và reset-header units chưa được suy đoán.

Vnstock license-2026.09 phân biệt phần mềm và dữ liệu; có các use case chuyên môn/thương mại trong phạm vi cấp và điều kiện riêng cho tổ chức/redistribution/data-service. Không kết luận mọi thương mại bị cấm, cũng không coi một free account cấp quyền SaaS toàn bộ user. Cần rà đúng tier/use case và từng nguồn upstream. [License chính thức](https://vnstocks.com/onboard/giay-phep-su-dung). Không mặc định license MIT theo bài cũ.

## Vàng

G0 synthetic/manual chốt. G1 PNJ hoặc G2 SJC chỉ là nguồn bảng giá đối chiếu để đánh giá quyền automation/API, product/brand/purity/region/side/unit/time. [PNJ](https://www.pnj.com.vn/blog/gia-vang/) dùng nghìn VND/chỉ; [SJC](https://www.sjc.com.vn/) ghi nghìn VND/lượng. Đây không phải API contract hoặc grant sao chép. Tài liệu truy xuất PNJ chưa có thời điểm cập nhật điền đầy đủ; SJC chưa trả đủ dòng giá trong HTML đã đọc. Không lấy thời gian tải trang thay quoteAsOf, không truy tìm endpoint nội bộ để vượt giới hạn.

Giữ profile vàng versioned; người dùng chỉ nhập số chỉ sau bước xác nhận profile đúng. Đề xuất giá mua vào cho ước tính bán tài sản, phải thể hiện side rõ; giá bán là basis khác. Không lấy nhẫn PNJ thay vàng miếng SJC, không lấy XAU/USD thay vàng bán lẻ VN. Quote là tham khảo, không cam kết giá mua lại thực tế.

## Ngân hàng/ví và dữ liệu còn cần owner cung cấp

VCB Digibank (package `com.VCB`) và MoMo (`com.mservice.momotransfer`) xác nhận được từ trang Play chính thức, **không xác nhận signer/appVersion/template đang cài**. Đây chỉ shortlist khi chưa biết app owner dùng. Chọn app không có nghĩa hỗ trợ capture mọi giao dịch. Quyền Notification Access khác quyền thông báo của app ngân hàng và không cung cấp lịch sử sao kê.

VCB mô tả OTT/Voice OTT nhận thông báo; MoMo công bố luồng pending và thông báo khi có kết quả. Không từ đó suy ra mọi debit/credit đều có external Android notification đầy đủ. [VCB Voice OTT](https://vietcombank.com.vn/vi-VN/Trang-thong-tin-dien-tu/Articles/2025/02/24/20250224_VCB_Thong-tin-bao-chi-Voice-OTT), [MoMo lifecycle](https://www.momo.vn/tin-tuc/thong-bao/chuyen-tien-muot-hon-bao-gio-het-khong-can-doi-8878).

Các thông tin đang mở: tên app thực dùng; điện thoại/Android/OEM; mục đích cá nhân hay SaaS nhiều user; tài khoản/entitlement provider nếu owner có. Chưa trả lời vẫn thiết kế khả năng nhiều user theo least privilege, **không** tự nhận quyền thương mại. Không xin mật khẩu/OTP/raw notification trong chat. Mẫu thật chỉ kiểm trên máy owner có consent và tạo bản cấu trúc đã thay dữ liệu nhạy cảm nếu cần fixture.
