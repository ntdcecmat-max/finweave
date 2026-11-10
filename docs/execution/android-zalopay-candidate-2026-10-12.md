# FinWeave0.1.8 — bộ đọc ZaloPay ứng viên

Người dùng không còn thông báo ZaloPay gốc và yêu cầu dùng cách đọc tương tự các nguồn hiện có. Ảnh0.1.7 xác nhận1callback/1mẫu, chỉ có title/text `[TEXT]`; không thể phục hồi câu chữ hoặc xác nhận tiền/hướng từ mẫu đó. Không có mẫu giao dịch thật để đối chiếu. Quy tắc mới là generic, không khai báo rằng ZaloPay thực tế phát những câu này.

## Thay đổi

- `ZaloTextCandidate` dùng nguyên tắc của VCB candidate: giới hạn16KiB, loại OTP ở mọi field, đối chiếu text/bigText, amount nguyên VND tối đa18chữ số, giữ evidence incomplete. Quy tắc chỉ nhận câu rõ chủ thể “Bạn đã nhận…”/“Bạn đã chuyển/gửi…” hoặc “Thanh toán thành công…”; không suy hướng từ từ “chuyển tiền” hoặc dấu số riêng lẻ. Dot/comma grouping hợp lệ; không dùng floating point.
- Loại pending/failed/cancelled, quảng cáo/lời mời/đề nghị, nhiều số tiền, khác nhau giữa fields/title/sign. Hoàn tiền và Số dư sinh lời/chuyển nội bộ được để unknown; không tính như thu–chi thông thường.
- Phiên preview có consent phân tích amount/direction mới, native bắt buộc cả acknowledge và analyzeTransactions. Trước đọc extras vẫn cần exact package/signers/version/device/installer/unlock/permission/listener/consent/session. Bỏ chọn trong UI dừng/xóa. JSON strict chỉ mang shape và amount/direction/status/reason, không raw/tên/account/ref/time. Tối đa15phút/20mẫu/100occurrence RAM; source khác hoặc mất gate dừng/xóa như trước.
- UI hiện tiền vào/ra và số tiền ứng viên, hoặc lý do chưa xác định. Không đánh dấu đã ghi sổ. Có3test fixture native cố định: income130000VND, expense45000VND, unknown. Tách khỏi counter/callback thật, ghi rõ dữ liệu giả; không giả package nguồn hoặc phát notification thay ZaloPay.
- OTP detector chuẩn hóa Unicode NFC và khoảng trắng để không bỏ lọt mã xác thực dùng combining marks/nonbreaking spaces.
- Giữ collector/VCB/Android test/nhập tay/CSV/Plan–Goals/Assistant hiện có, cùng appId/khóa pilot,0.1.8/code9. Live registry vẫn trống; profile nguồn thật/enrollment/backend/auto posting chưa nối. Không thay Play Protect hoặc kênh notification.

## Kiểm chứng

Web138tests PASS. Native39tests gồm9test candidate mới PASS; lint0errors40warnings, release và instrumentation compile PASS (instrumentation chưa chạy). Signature/merged manifest/DEX và source-assets-APK contract proof PASS. SHA256 APK `6850a729cbd8980f52132f2160cf3bedfa13428103f92a676e40af297fb7d811`; cùng chứng thư pilot. Cài USB nâng cấp Success,0.1.8/code9 và process được xác minh trên SonySO-01M/Android11, quyền đọc vẫn có. [Kiểm chứng](evidence/android-zalopay-candidate-2026-10-12/verification.json), [thiết bị](evidence/android-zalopay-candidate-2026-10-12/device-install.json).

Test nút trên UI thiết bị mới chờ chủ thiết bị xác nhận. Parser nguồn thật/finality/account binding/ledger chưa nghiệm thu, không coi fixture generic là mẫu ZaloPay thật hoặc Google approval. Các mẫu `[TEXT]` từ0.1.7 không phục hồi hoặc hồi đọc; sau nâng cấp cần tự bật phiên mới bằng consent mới. Không đọc raw bằngADB hay thực hiện/yêu cầu thêm giao dịch tài chính.
