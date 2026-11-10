# API tài chính thực thi local

`openapi.json` là subset của **FW-API-T1-D1J2-005**, lấy trực tiếp từ contract đã pin, gồm account/workspace/outcome và các operation tài chính đã đăng ký trong runtime. Request và reply đều được AJV kiểm; reply được kiểm **trước COMMIT**. `runtime-policy.json` mô tả preconditions và phạm vi đã triển khai. Tái sinh bằng `node scripts/build-finance-contract.ts` trong `finweave-backend`; không sửa gói contract lịch sử.

Mọi route là `POST /v2/operations/{operationId}`, JSON, header `X-FW-Contract-Revision: FW-API-T1-D1J2-005`. Dùng owner cookie + CSRF + Origin hoặc native credentials theo auth runtime. Owner/workspace lấy từ credential được xác minh, không lấy quyền từ body.

Quy trình write:

1. Đọc workspace và các object cần tham chiếu. Gửi `previewMutation` với operation/input đích, expected workspace/object versions và idempotency key của preview. Preview trả before/after trên cùng dependency closure và không ghi actual/history/quantity. Preview tồn tại 5 phút.
2. Gửi operation đích với input **giống preview**, cùng expected workspace/object versions, `mutation.previewToken` và một key riêng cho command. Không tái dùng key của preview làm key command.
3. Nếu response mất hoặc `OUTCOME_UNKNOWN`, giữ nguyên body semantic/key và dùng `getCommandOutcome`, rồi retry chính command đó. `requestId` có thể đổi. Replay committed được xét trước stale versions/expiry. `REPLAY_EXPIRED` vẫn có outcome committed/resultRef, không tạo effect lại.
4. Nếu command mới trả `VERSION_CONFLICT`/`STALE_PROPOSAL`, đọc lại facts và preview lại. Không tự tăng version để vượt kiểm tra. Retry đã committed phải giữ semantic payload cũ.

`previewHolding` → `confirmHolding` là port setup catalog riêng: gửi lại input của preview cộng token/digest; số lượng của profile vàng là **chỉ**, cổ phiếu là **share**. Create/update qua quantity object có thể nhận `luong`, Engine đổi chính xác sang chi. Catalog/profile version được kiểm lại khi confirm. Local có catalog khai báo manual rõ nguồn; không giả quote/provider hoặc quyền market.

Thu/chi/transfer/refund/investment posted và manual price quote dùng preview. Overflow valuation/aggregate bị từ chối trước actual write, kể cả update quantity bằng confirmHolding. Draft/pending giữ version/history nhưng không có cash/quantity effect. `postDraft` và pending Review resolution ghi cash, phí và quantity cùng UoW. Transfer một chân dùng clearing; confirm receiving leg chỉ ghi effect đích mới. Phí là expense riêng, không giảm amount transfer. Opening là equity, không income.

`correctPostedEvent` hỗ trợ income/expense/refund/unknown adjustment: reversal chính xác tất cả groups gốc và replacement atomic. Expense correction không được giảm dưới refunds còn hiệu lực. Transfer/investment correction bị `ACTION_NOT_ALLOWED` vì contract hiện không mô tả đủ dependency quantity/two-leg closure. Không thêm sale/shorting/corporate actions ngoài hợp đồng hiện tại.

`recordCashCount` chỉ ghi observation/Review; `resolveReviewCase` recheck variance trên balance hiện tại dưới workspace lock. `forgottenExpense` chỉ hợp lệ với thiếu tiền; `adjustUnknown` giữ hướng signed và không giả income/expense. Link refund đã nhận chỉ chuyển đối ứng suspense → refund, không ghi cash lần hai.

History: `getTransaction.history`, `listHoldingMovements`, `listPriceQuotes`, `getReviewCase.history`; account create/archive được giữ append-only trong `fw_finance.history`, và lịch sử giao dịch account đọc bằng `listTransactions` theo scope. Archive giữ balance/history. Page tiếp theo cần gửi `snapshotVersion` đã nhận để phát hiện thay đổi; runtime trả conflict cho snapshot cũ thay vì ghép hai knowledge versions.

Money truyền bằng string integer VND, quantity/price/FX bằng string decimal; không dùng JSON Number cho số tài chính. `quantity` trong movement DTO là after-value audit tại lúc ghi, `delta` là effect; quantity hiện tại replay `set/delta` theo business date rồi sequence. Giá chỉ ảnh hưởng valuation, không sửa cash/quantity. Price/fx thiếu giữ valuation unknown.
