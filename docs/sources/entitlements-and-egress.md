# Quyền dữ liệu, secrets và egress

## Quyền nhiều chiều, unknown không phải granted

Tách API fee, software connector license, data license và infrastructure cost. “API đang miễn phí” không có nghĩa được cung cấp giá cho SaaS mọi user; trang giá public không có nghĩa public automation API. Per-provider/per-entitlement cần access method, permitted asset/venue, user/device/audience, automated server/non-display usage, cache scope/TTL, historical retention/backup, redistribution/display/export, derived portfolio/forecast use, **external model/LLM egress**, attribution/expiry/revocation. Chỉ capability cần dùng được grant mới bật; chưa biết là null và deny, không infer từ key hoạt động.

Rights record là cấu hình quản trị versioned có evidence ref/digest, approver/time và effective dates, không field client tự nâng quyền. Public research findings không là signed entitlement. Owner/BYOK chưa phải phương án chốt và không tự cấp quyền provider; key cá nhân không tự trở thành shared server key. Credential chỉ Market worker secret reference, market-read-only. Không key upstream trong browser/APK/Agent/admin logs; không gửi account ngân hàng/password/OTP để lấy giá.

## Storage/history compat gate

Current DB quote/history retention workspace lifecycle. Muốn bật nguồn có cache TTL ngắn/xóa lịch sử/backup ban phải chứng minh policy đáp ứng đồng thời finance audit/sealed history/T1 erasure. **Chưa có implementation retention revision thì không admit nguồn đó**. Không chỉ xóa quote row rồi vẫn để giá trong snapshots/forecast/export/backups. Rights expiry/revoke lập tức chặn new egress/refresh/display/derived/model theo phạm vi, purge phải theo từng granted policy + retained audit tối thiểu hợp lệ; không giữ plaintext market history “vì đã từng được phép”. Nếu nguồn không cho retention sản phẩm cần, chọn provider khác hoặc revision storage/history được review, không âm thầm bỏ feature.

Forecast/Agent dùng giá trị derived vẫn cần use-specific grant; không suy ra đã “ẩn giá” thì được gửi model. Tool truyền owner-scoped snapshots/derived allowlisted fields khi cả privacy và provider rights cho phép; raw notification/transactionRef/accountRef/upstream credentials luôn không gửi. Tool thiếu live data phải trả unavailable/stale/citation chính xác, agent vẫn làm Plan–Goals với manual/synthetic/owner-confirmed assumptions và không ghi actual. ARCH12 sẽ chốt model/runtime/eval, chưa chọn external model ở ARCH11.

## Egress và quota

Egress default deny theo server config provider+HTTPS origin+exact route/method/query allowlist; không client URL/redirect/arbitrary fetch, không SSRF qua symbol hoặc nextPage link. DNS/resolved addresses must public allowed destination; reject private/loopback/link-local/metadata/port/redirect except riêng SYNTHETIC stub. Pin CA/hostname standard TLS; API path v3 pin không tự chuyển version theo redirect. Max response bytes/time/pages/schema bounds cần PoC, tới đó gate closed thay vì set vendor limit giả. Error body không log nguyên văn.

Kế thừa MarketQuota/ARCH09: `provider_entitlements.quota_daily` là configuredcap (unknown→0), **không số lượt đã dùng**. Global credential namespace + entitlement + endpoint/method + every applicable window buckets reserve atomically trước từng HTTP/pagination/retry; unknown outcome charged. Không “mỗi workspace có quota riêng” để nhân vượt key shared. Cooldown manual không thay quota. Header limit/remaining/reset cần verified adapter units và nhiều concurrency; Retry-After floor persistent, không cap xuống; restore chặn egress đến trusted usage/reset. 401/403 suspend authorization, 429 cooldown, 5xx boundedretry, HTML/captcha/schema drift → pause, không né chặn hoặc scrape fallback.

I0 scripted/local không external spend. SSI currentfee0 chưa chứng minh SaaSfee0; gold license/backup/model/APK có điều kiện riêng. Budget external hiện0; paid source/plan cần báo giá và owner cho phép trước dùng. Không rotatekeys/accounts để né quota, không miễn phí giả nhờ bỏ backup hoặc retention safeguards.
