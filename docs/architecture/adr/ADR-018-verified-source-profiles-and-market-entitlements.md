# ADR-018 — Verified source profiles và market entitlements

09/10/2026 · **ACCEPTED SOURCE INTEGRATION DESIGN** trong A+T1/S1+P2/D1+J2/Capacitor–Kotlin đã chọn. **Real providers NOT ACTIVATED; quyền/thiết bị/app/PoC chưa xác nhận.** Không thay yêu cầu sản phẩm hoặc tự chọn app của owner.

## Vấn đề

Public page, API fee0 và package name không đủ để auto ghi sổ hoặc cung cấp giá cho SaaS. Thông báo có thể pending/redacted/không có account identity; giá có thể sai scale/chỉ-lượng/side/time/basis, và license có thể không cho lưu history/backup/LLM use. Tài liệu cũ SSI V2 không còn phù hợp để bắt đầu adapter mới. API004 không nhận unbound notification/lifecycle field và chỉ có bank/price source enum trong listSources.

## Quyết định

1. Giữ toàn bộ feature; xây synthetic/manual/CSV ports trước, real adapters phải có source-specific gates. SSI V3 read-only là ứng viên PoC stock; PNJ/SJC là reference candidates, không scraper baseline; VCB/MoMo chưa owner-selected/supported. Vnstock không dependency bắt buộc, cần software+upstream rights riêng.
2. Native built-in parser profile versioned theo package/signer/app/template/device. Raw/OTP không disk/server/log/chat/model. Pending/ambiguous không actual; unbound/ambiguous account local warning/gap, không fake binding hoặc server receipt. Bound incomplete đúng DTO vào Review. Engine giữ authority ledger/economic dedupe/transfer/correction.
3. Quote scale-expanded VND/sourceUnit immutable, exact canonical valuation VND/share hoặc VND/chỉ; không double scale/unit/purity. Finality/timezone/calendar/quoteAsOf verified, không dùng fetchedAt thay source time. Unknown giữ last-good, không giá0 hoặc fabricated daily bar. Source history/profile/rights pin riêng thời điểm biết dữ liệu.
4. Explicit use-specific entitlement/access/quota/cache/history/backup/derived/LLM gate; default deny unknown. Read-only secret chỉ Market, allowlisted HTTPS egress, quota mọi shared key/window/reservation theo ARCH09. Retention không tương thích history hiện hành thì không activate, cần provider/revision được review.
5. API004/DB005/bridge2 giữ nguyên. Bổ sung private profile schemas + tenant Market entitlement payload registry addendum, consumer mappings; DB wallet→wire legacy bank group. Nhu cầu lifecycle/subtype/raw/retention mới phải version contract/schema trước, không tùy ý thêm fields.

## Alternatives và hậu quả

Generic regex/LLM đọc thông báo, scrape trang public tự động hoặc share một key/cache mọi user bị loại vì mất finality/privacy/rights/quota authority. Yêu cầu chọn và trả tiền provider ngay cũng không cần để xây synthetic toàn bộ product. Licensed vendor/BYOK có thể review sau, chưa cấp quyền/chi phí. Tốc độ tạo code không thay thế source/OS/license evidence.

Design hiện đủ bàn giao adapters/failure UX và32 source acceptance cases, chưa đủ live claims. [Sources](../../sources/README.md), [research](../../sources/research-sources.json), [bundle](../../sources/implementation-bundle.json), [report](../ARCH-11-change-report.md). Không sửa runtime/frontend/dependencies/baselines, gọi provider, tạo account hay phát sinh phí.
