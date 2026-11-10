# Pattern library — ba surface và Agent tích hợp

DES-PAT-001 · v1.0 · 08/10/2026 · SPECIFIED.
Giữ năm user templates, drill/Back, staged forms, CSV và chat; [bản cũ](../governance/baselines/ui-before-v3-2026-10-08/pattern-library.md) lưu snippets code đã chạy. Patterns dưới đây mô tả composition đích, không pseudo-code được coi đã implement. [Components](component-specifications.md), [UX](ux-ui-specification.md).

| Mã | Pattern / dùng tại | Composition và điều kiện |
| --- | --- | --- |
| PAT-01 | Financial overview, UI-U-01/02/03 | Period/scope/coverage → cash → assets/subtotal → thu/gross/refund/net → chart/table → evidence. Mỗi metric có unit/asOf/drill, no net-worth label khi debt chưa model |
| PAT-02 | Filter → drill → Back, UI-U-01…07/14 | Filter draft→Apply; drill giữ kỳ/scope, xóa filter xung đột có giải thích; selected opaque ID; Back phục hồi context. Sensitive search/prompt/amount không URL production |
| PAT-03 | Edit → preview → confirm, UI-S-06 | Form validate → immutable bound preview → owner confirm → result/refetch; field edit invalidate token; timeout uncertain tra kết quả/replay same key; cancel trước commit no effects |
| PAT-04 | CSV staged import, UI-S-09/10 | Template/map → raw CSV owner-preview+normalized/error → selected valid subset → bound confirm → job/status; row error không tự thành partial financial commit |
| PAT-05 | Review evidence → decision, UI-U-14/UI-S-04 | Case/source/version → chắc/thiếu → eligible action fields/reason → preview/confirm/defer; AI recommendation dẫn tới màn, không resolve hộ |
| PAT-06 | Stock/gold simple input, UI-U-03/UI-S-02 | Stock ticker→resolve→quantity; gold profile→confirm→quantity chỉ; details vẫn có cost/quote/source/history. Không bắt nhập metadata gõ tay thường lệ |
| PAT-07 | Price async refresh, UI-U-03/19/UI-S-10 | Daily/manual cùng pipeline →202job→status→partial/last-good/refetch; coalesced reuse job; fetchedAt khác quoteAsOf, không fake freshness ngày nghỉ |
| PAT-08 | Progressive Android setup, UI-M-01…04 | Explain/skip→explicit consent→OS handoff→recheck→supported allowlist→account map→test; web chỉ hướng dẫn, manual/CSV luôn tìm thấy |
| PAT-09 | Outbox → ACK → ingestion, UI-M-05/UI-U-18/UI-S-10 | Native queue owner-scoped→durable ACK→posted/Review/ignored; gaps/status riêng; retry fixed identity, không gọi ACK “đã ghi sổ” |
| PAT-10 | Manual Plan/Goals và Agent cùng entry, UI-U-08/11 | Create manual luôn còn; Agent co-create capture constraints→clarify→draft→Engine→edit/compare→preview/confirm. Không dựng module kế hoạch khác hoặc source số khác |
| PAT-11 | Goal-first / Plan-first, UI-S-05…07 | Goal-first từ target/deadline lập plan đạt goal; Plan-first từ thu/chi/reserve xác định dư/capacity và goals user chọn; cùng draft model/links, không tự đặt mục tiêu hộ |
| PAT-12 | Monitor → investigate → amendment, UI-U-08/14/15 | Actual/shortfall/coverage → evidence branching → clarify → đề xuất → amendment draft hoặc Review navigation. Active plan/history giữ, không tự lower reserve/fake income |
| PAT-13 | Một trợ lý nhiều cách xử lý, UI-U-15/16/UI-S-08 | Q&A/tool đọc đơn giản + multi-step run trong cùng conversation/history; context frozen per request, panel/full/Plan navigation không reset; mode/source/evidence rõ |
| PAT-14 | Evidence-backed scenario comparison, UI-U-12/UI-S-05 | Same baseline/assumptions → Engine results + unknown/shortfall → user chọn/edit; result cũ label frozen/stale; không thay actual hoặc giả market forecast |
| PAT-15 | Safe operational action, UI-ADM | Metadata→version/reason/impact confirm→ACK→audit/refetch; whitelist retry/disable; no finance/private payload, quota/releases read-only |
| PAT-16 | Graceful fallback, mọi user surface | Denied/unsupported/quota/offline/partial → nói rõ phần thiếu + retry/permission/manual/CSV/manual Plan; không silently paid provider, no placeholder fake success |
| PAT-17 | Privacy và auth transition, user/admin | Mask toàn content/accessibility; logout/expiry unmount clear private views/cache, queue quarantine owner; auth redirect safe relative route; server authorizes object dù menu hidden |

## Quy tắc overlay và trạng thái

Một primary CTA cho bước hiện tại; không đặt “Xác nhận” của plan bên cạnh nút Agent đang gửi mà thiếu nhãn đối tượng. Drawer/detail và contextual chat không xếp chồng nhiều focus traps; chuyển full chat hoặc đóng panel trước form confirm. Dialog chưa submit có Escape/Back; sau submit thể hiện đang xử lý/uncertain và đường tra kết quả, không gọi close là rollback.

Loading không thay số bằng0, empty có nguyên nhân và CTA phù hợp; stale giữ last-good cùng asOf, denied bỏ private data. Toast chỉ bổ trợ, kết quả dài/important nằm trong màn. Refresh/manual retry không tự reset filters/draft/conversation. Chọn source/profile/owner thay đổi phải invalidate mọi preview/run context bị ảnh hưởng.

## Kế thừa linh vật

Giữ floating pet/drag+keyboard/collapse/pause/restore, context panel, full chat/history và static fallback. Mascot thinking phản ánh processing thực; không chúc mừng lỗi/cancel/loaded history. Reduced motion tĩnh, chức năng vẫn đầy đủ; mobile vị trí không che CTA/keyboard/bottom nav. [A11y](accessibility-requirements.md) và [mascot](../frontend/mascot-interactions.md) hướng dẫn kiểm.

Không còn đưa URL localhost cố định thành “gallery hiện hành đã chạy”; /design chỉ mở khi runtime local có sẵn, evidence cũ lưu riêng. Patterns mới chưa render/native-tested.