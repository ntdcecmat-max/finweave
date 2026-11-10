# Collector source profiles và an toàn ghi sổ

## Support registry, không có regex ngân hàng bịa

Một profile immutable gồm source ID/package case-sensitive, signer policy/lineage, app versions đã kiểm, OS/OEM matrix, template IDs/version, locale/amount/direction/finality semantics, account discriminator, reference namespace và revision policy. Metadata/schema ở [registry](provider-registry.json)/[schemas](profile-schemas.json). Hai source thật hiện supported=false; parser versions/profile IDs là **candidate placeholder**, không có implementation hay pattern đã chứng minh. Synthetic app/profile hoàn toàn riêng, không bắt chước signer thật.

Kiểm package + signer + version + profile trước extract theo ARCH10. Android API28+ SigningInfo có lineage cho rotation; một signer rotated cần lineage đã kiểm, multi-signer cần exact approved set. API24–27 là compatibility branch phải PoC riêng; không chấp nhận bất kỳ cert nào chỉ vì cùng package hoặc có một cert cũ trong history. Cert fingerprints/version ranges chưa biết là null/empty và REAL bị chặn, không lấy từ Play page.

Template chỉ cho `complete` khi đã chứng minh amount/direction/currency/account/finality. Pending, failed, refund/reversal, fee, multiple amount, redacted/OTP, account ambiguous và changed format cần disposition riêng. Complete trong DTO **không phải** bằng chứng bank xác thực; native signature chỉ xác thực collector được cấp quyền. Không dùng LLM đọc raw hoặc đoán parse để ghi actual.

## Binding và nội dung được phép

Owner dùng `bindCollector` chọn account thuộc workspace, exact device/package/parser và expectedVersion; mobile encrypted config lưu masked discriminator để phân biệt nhiều account. API không nhận số tài khoản đầy đủ trong binding. Không thấy discriminator đáng tin/khớp nhiều bindings thì **local setup/Review warning + gap**, không chọn account đầu tiên. API004 ingest bắt buộc bindingId nên **không gửi** unbound/ambiguous item bằng null/sentinel/fake binding. Mapping mới chỉ áp dụng capture sau đó; lịch sử thiếu dùng manual/CSV hoặc owner nhập bằng port hiện hành, không retag outbox cũ. ARCH11 làm rõ câu “unmapped→Review” trong ARCH10: local warning, chưa có server receipt.

Binding rõ nhưng template incomplete/redacted có thể gửi DTO tối thiểu hợp lệ theo API để server Review. `amount=null`, direction unknown khi không chắc; không amount0 thay missing. API004 không có field lifecycle/reason/raw/fee: pending chỉ được ánh xạ incomplete ở profile đã duyệt, server không được tuyên bố biết pending subtype từ DTO nếu không có dữ liệu. Template chỉ báo thất bại và không có economic movement có thể discard + gap/health reason; không tạo expense. Nếu cần preserve thêm lifecycle để hợp nhất exact event, mở revision contract riêng trước implementation.

Normalized payload chỉ bảy fields của API: amount integer VND string/null, currency VND, direction, sourceAccountRef mask/null, transactionRef opaque/null, sourceOccurredAt/null, ruleStatus. Không names/memo/full account/card/balance/raw/OTP. Ref cần thiết là private financial evidence, không log/model/Ops; không coi hash OTP/raw là vô danh. Missing bank time vẫn null, observedAt riêng. Non-VND hoặc mixed fee/net/gross unsupported/incomplete, không tự FX hoặc cộng trừ. SourceAccountRef không đủ phân biệt thì Review, không đoán account.

## Identity, finality và reconciliation

EventKey/revision/digest native chỉ transport occurrence (ARCH09/10), không bank economic ID. Cùng verified reference namespace + account + economic type + direction + source version có thể giúp server dedupe; không loại giao dịch dựa mỗi amount/time. Cross-device/CSV/manual cần same trusted economic identity hoặc owner Review. Exact digest repeat không tác động ledger hai lần. Bank ref và wallet ref không tự cùng namespace; một ref có thể có fee/multi-leg, phải profile-specific economic key.

Pending/final notification có thể reuse hoặc đổi OS key/postTime; không tự gộp theo đó. Khi không có trusted lifecycle/ref, tạo Review, không hoàn tất actual bằng inference. Hủy/điều chỉnh sau posting dùng immutable correction/reversal+replacement của Engine trong một UnitOfWork, giữ source lineage; không update amount của ledger đã đóng. Refund phải có linkage hoặc owner xác nhận, không match bừa cùng tiền/ngày.

Chuyển giữa tài khoản của owner kế thừa ARCH08: debit đã xác minh có thể đi vào transfer-clearing/needs_review, destination chưa nhận không bịa credit; khi đã có bằng chứng leg nhận thì settle clearing đúng một lần. Cùng một movement đã ghi từ manual/CSV thì thêm provenance, delta=0. Không biến bank→wallet thành expense+income làm sai cashflow full scope; fee chỉ expense khi xác minh riêng. Nếu không xác định được internal transfer, owner Review trước phân loại hoàn tất.

## Privacy, mẫu và support lifecycle

Raw chỉ memory bounded của native, không Room/WAL/upload/log/crash/WorkData/temp/chat/LLM. Fixture bank thật không lấy từ email/chat; sample review có consent ngay thiết bị, thay identity/reference/free-text bằng dữ liệu giả nhất quán trước export; OTP luôn loại. Không hash raw làm evidence. Dùng synthetic test app cho callback/summary/update/lock/OEM trước, rồi consented real matrix. Source format/version mới → pause affected profile, outbox cũ giữ parser/binding/owner epoch; không auto chạy parser mới trên raw đã xóa.

Coverage luôn là **các notification đã quan sát**, không bảo đảm mọi giao dịch/số dư/sao kê. Permission/OEM/offline/force-stop/no external notification gây gap; activeNotifications không là lịch sử. Reconcile bằng manual/CSV/owner statement, giữ gap/lastSuccess truthful. Admin chỉ health/error code/parser rollout, không payload/account refs/amount. Collector optional; từ chối quyền OS vẫn dùng đầy đủ manual/CSV/Plan–Goals.
