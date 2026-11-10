> **Trạng thái hiện hành 03/11/2026:** có bằng chứng mới cho local PostgreSQL/web/admin, hai kịch bản model thật và Android native trên giả lập; xem [báo cáo hoàn thiện](../execution/completion-2026-11-03.md). Bảng gate dưới đây là baseline lịch sử cho phát hành production; không tự chuyển PASS từ kết quả local. Nguồn thật, điện thoại thật, bảy ngày liên tục, email/máy chủ và backup ngoài máy chưa nghiệm thu.

# Checklist phát hành và trạng thái bằng chứng

**SPECIFIED / NOT RUN không bằng PASS.** Schema hợp lệ và manifest checksum chỉ kiểm artifact, không chứng minh runtime/recovery/security. Không chọn vài feature để nhận toàn product hoàn thành.

| Gate | Điều kiện / bằng chứng | Hiện tại |
| --- | --- | --- |
| G-ARTIFACT | Source bất biến đã review; lock/toolchain/image hashes; trusted signature; API005/DB005/native003 và policy tương thích | Chỉ có thiết kế/static evidence; runtime artifact chưa build |
| G-DB | Executable migrations tới DB005; clean/upgrade/backfill/grants/RLS/triggers/precision/concurrency/restore | NOT RUN |
| G-DOMAIN | Ledger/planning/forecast/quantity/history đúng oracle; replay/cancel/partial không double effect | NOT RUN |
| G-AUTH | Browser/native/Ops/worker scopes, CSRF/MFA/revoke/reset/mail; deny cross-tenant/object | NOT RUN |
| G-J2 | Queue/scheduler/crash/fence/ACK/sync/quota; quan sát daily synthetic ít nhất7 ngày | NOT RUN |
| G-CONSUMERS | User/admin/Android adapters canonical005/003, mọi UI state và regression; installed-version policy | NOT RUN; frontend mock lịch sử nghiệm thu riêng |
| G-NATIVE | APK ký thật cài/update; permission/allowlist/offline/OEM/Keystore/revoke/gaps trên thiết bị thật | NOT RUN |
| G-SOURCE | App/device/profile/signer/mẫu parser/rights/time/unit/quota đã xác minh; giá daily/manual thật | NOT RUN; candidates chưa activate |
| G-AGENT | Exact model/runtime/prompt/tool pins; quality tiếng Việt, benefit so với ba baseline, held-out và safety/budget đo thật | NOT RUN; model disabled |
| G-SEC-T1 | Grants/logs/secrets/egress/custody; witness độc lập, erase/recovery đã thử | NOT RUN |
| G-OPS | Deploy/drain/migration/failure/rollback/load/quota/alerts; backup/restore/capsule và purge đã diễn tập | NOT RUN |
| G-UAT | Đủ41 AC trên ba clients và toàn bộ Agent/nguồn thật; owner consent/disclosure; không critical chưa xử lý | NOT RUN |

LOCAL-SYNTHETIC có thể bắt đầu implementation bằng stub/sink/no-egress và disposable DB, không cần real provider/device/model để viết và kiểm nền. Chỉ nghiệm thu phạm vi local đã chạy. Một drill cố ý bỏ gate off-host chỉ là synthetic logic proof, không chứng minh gate độc lập hoặc cấp quyền bật REAL.

STAGING-SYNTHETIC cần deployment/TLS/config/quota, integration và ops drills với dữ liệu thử; không gọi là production UAT. REAL-T1 phải đạt mọi gate liên quan trước bật thật. Full product phải có toàn bộ features; manual fallback hữu ích nhưng không thay nghiệm thu Agent/native/automatic prices.

Trước phát hành cần xác minh đúng target và không có writer cạnh tranh; bằng chứng safety trên đúng source/config/artifact; backup ngoài host và đường restore đã thử; witness pending và erase deadlines; reserve tài nguyên; compatibility rollback/installed clients; thời gian bảo trì và keys; receiver cảnh báo đã kiểm. Source/config thay đổi thì chạy lại checks bị ảnh hưởng, không dùng evidence cũ cho behavior mới.

Giữ halted nếu sai sổ, cross-tenant leak, raw/secret lộ, bypass authority, recovery stale hoặc rủi ro erasure. Không có critical quan sát trong phạm vi thử là điều kiện cần, không bảo đảm không bao giờ có lỗi. Release notes ghi giới hạn/known bugs thật. Checklist không cấp quyền deploy, mua dịch vụ hoặc tạo tài khoản.
