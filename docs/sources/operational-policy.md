# Vận hành nguồn và phục hồi

## Daily và chủ động

18:00 Asia/Ho_Chi_Minh hằng ngày, host timer mỗi60s enqueue durable work; clients đóng vẫn chạy nếu host hoạt động. Khi host chết/cạn quota/không có final quote, không claim daily success. Catch-up lấy latest eligible actual quote, không tạo giá lịch sử giả. Manual button cooldown60s, exact compatible unfinished request coalesce; source/rights/profile/basis/holdings đóng băng tại accept. Market job không đổi asset quantity/cash/Plan; valuation update khác ledger actual.

Parent manifest/child entitlement credential partitions và J2 lease/fence/reserved→sent_unknown→observed theo ARCH09. Timeout25s là target ứng dụng, chưa benchmark; response/pagination bounds/ratelimits chưa xác nhận vendor thì nguồn real chưa runnable. Partial symbols/profile failures ghi item outcomes; giữ last-good từng holding, aggregate job không báo allfresh chỉ vì HTTP200. GET polling không advance job. Unknown secret/license/quota/time/basis trả allowlisted code, không leak raw response/endpointsecret.

## Health, rollout và restore

Per profile lifecycle CANDIDATE→SYNTHETIC_VERIFIED→REAL_POC→SUPPORTED (exact observed app/OS/OEM/template)/PAUSED/RETIRED. Candidate không được supported=true chỉ vì có Play page hoặc README pattern. Source update package/version/signer/template/time/terms drift → pause affected profile, không fallback generic parser. Rollout via signed APK/config integrity + versioned built-in parser; server có kill switch metadata, app phải revalidate offline config expiry. Không remote executable code hoặc downloaded regex tùy ý từ admin.

Owner thấy source/quoteAsOf/fetchedAt/lastAttempt/lastSuccess/coverage gap/support reason và pending/review; nếu schema chưa có subtype chỉ render metadata hiện có hoặc local warnings, không payload field mới. Admin thấy aggregate operational outcomes/error codes/job health/quota state theo approved coarse metadata, không amount/accountRef/transactionRef/holdings/quote private selections. Monitor không dựa vào bank raw/memo, labels không chứa tenant financial identifiers.

Restore theo T1 witness: revoke/delete applied trước data serving, credential/quota/rights current heads reconcile trước egress. Không tự retry receipt mất sau restore; owner investigation/ACK journal protocol ARCH09. License/key rotation không reset used quota namespace; unknownquota charged. Historic parser/profile/rights/calendar phải còn exact refs để đọc provenance được phép; không rerun oldsource raw vì raw không tồn tại. Revocation hoặc license incompatibility cần incident checklist và explicit data-retention decision trước resume.

## Các PoC phải thực hiện sớm

1. Synthetic test app → native listener/background/summary/duplicate/update/offline/binding isolation → durable ACK/Review; không cần ngân hàng thật.
2. Owner-selected app/device: verify package/signer/version; consented local capture test incoming/outgoing/pending/final/refund/fee/internal transfer/redaction/multi-account. Không yêu cầu raw/OTP gửi chat; unsupported cases hiển thị gap/manual.
3. SSI authorized read-only test: identity/catalogue, price scale, finality/date/timezone, paging, error bodies/headers/quota concurrency, cash-stock basis và allowed asset rights. UAT only if actually available; production calls cần quyền rõ và cap approved, chưa được cho phép ở task này.
4. Gold authorized channel: source permission/API stability/locale/scalex1000/chỉ-lượng/product/region/side/source timestamp; public board thiếu quyền/time thì chỉ manual reference, không scraper ngầm.
5. License/storage/derived/model/backup compatibility, rights expiry/revoke, shared-key quotas + restore, last-good and fallback provenance. Staging fixtures là dữ liệu giả, không copy quotes/vendor errorbody thật vào repo.

32 acceptance IDs chi tiết trong [plan](acceptance-plan.md). Chưa run bất kỳ PoC/runtime nào trong ARCH11; static checks không đổi trạng thái đó. Không cắt source-dependent feature khỏi backlog khi gate mở; giữ adapter implementation + failure UX + tests và đánh dấu real integration bị chặn bởi evidence cụ thể.
