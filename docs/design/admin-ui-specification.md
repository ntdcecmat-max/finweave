# Admin web — giao diện vận hành

DES-ADMIN-001 · v1.0 · 08/10/2026 · Đặc tả đích; đã có prototype synthetic bảy màn và gateway trong bộ nhớ. API/session/authorization production chưa triển khai. Trạng thái kiểm UI xem [nghiệm thu frontend](../testing/frontend-acceptance-report.md) và [UI RTM](ui-requirement-traceability.md).
Nguồn: REQ-SURFACE-01/ADMIN-01, NFR-20, BR-44, [API delta](../contracts/operational-api-spec.md), [trust profiles](../architecture/adr/ADR-006-deployment-trust-profiles.md).

Admin là build/shell/session/role riêng; user không thấy module này trong năm navigation. App admin chỉ gọi operational endpoints. Không finance charts, balances/amounts, transaction descriptions/raw notifications, prompts/answers/drafts, bank secrets, private emails hoặc impersonation/decryption. Quyền application-admin không giải quyết anti-root-Ops; PROTECTED-REAL vẫn gate riêng.

## 1. Màn và quyền

| ID / route đề xuất | Nội dung/filters/actions | Kết quả và giới hạn |
| --- | --- | --- |
| UI-ADM-01 /admin/overview | Environment/build, queue counts, job outcomes, source/parser health, quotas, incidents; lọc time window/source/status | Link metadata detail; partial/stale/error có timestamps; không nhận owner financial DTO rồi chỉ CSS-hide |
| UI-ADM-02 /admin/accounts | Opaque account/workspace/device IDs, enrollment/revoked/lastSeen/platform/appVersion/support state, tìm exact operational ID | “Tài khoản” ở đây là SaaS identity metadata tối thiểu, không account bank/wallet/holding. Read-only support; không login-as, cấp role/recover/reset key/export finance. Device revoke owner thực hiện từ user UI |
| UI-ADM-03 /admin/sources | Tested source/package/app/template/parser versions, release compatibility, enabled/disabled/incident; chi tiết ảnh hưởng và Disable + reason | Preview số bindings/jobs metadata bị ảnh hưởng; versioned confirmation + audit; không xóa evidence/history. Bật lại/parser sửa/phát hành cần change workflow riêng được phê duyệt, không thêm editor execute code tùy ý |
| UI-ADM-04 /admin/jobs | Opaque job ID/type, queue/run/partial/fail/rate-limit, attempts/lease/requestId/error code/time; safe retry khi eligible | Retry idempotent pipeline, không finance command trực tiếp, không “force success”; đang run/lease chưa hết thì không retry cạnh tranh. ACK chưa terminal, poll/refetch |
| UI-ADM-05 /admin/quotas | Provider quota, requests/cap/reset/cooldown, usage aggregation không financial contents; link affected jobs | Read-only current policy; limit reached → paused/rate-limited. Không có silent paid fallback/buy credit/đổi model hoặc provider tự động |
| UI-ADM-06 /admin/releases | APK/build/hash/signing fingerprint metadata, OS/OEM tested matrix, parser compatibility/status | Hiển thị verified artifact metadata từ release pipeline; không upload signing secret/remote code URL tùy ý. Chưa artifact không Download giả; không claim support bằng minSdk |
| UI-ADM-07 /admin/incidents | Sanitized incident code/time/source/job/device pseudonym, audit actor/action/reason/version/result/requestId; filter/export chỉ safe metadata nếu quyền cho phép | Không payload/error stack chứa finance/secret; reason không nhận pasted raw customer data. Audit immutable; export không được tự thêm dữ liệu user |

Release/role/quota changes ngoài safe retry/disable hiện tại là thông tin/link đến workflow kiểm soát, không chức năng mới tự cấp trong UI.

## 2. Hành vi thao tác vận hành

1. Chọn đúng environment/object, xem status/version và allowed action do server trả; nút disable có lý do bằng chữ.
2. Retry/disable mở confirm panel: action, object ID, ảnh hưởng metadata, reason required, expectedVersion; không financial preview. Enter không xác nhận phá tác vụ vô ý, focus về tiêu đề.
3. Confirm → pending → acknowledged → terminal/refetch; latch + idempotency/requestId. Timeout uncertain tra status/replay cùng key, không tạo job khác để né lỗi.
4. 409 đổi version → đọc lại rồi confirm mới; 401 reauth admin; 403 bỏ data/action; 429/503 backoff. Cancel trước gửi không effects.
5. Audit ghi actor quyền thực, thời gian, reason, object/version và outcome; browser text không tự là audit authority. Disable parser ngăn xử lý mới, không xóa posted data.
6. Source đang disabled hoặc provider fail được user UI phản ánh bằng health/coverage phù hợp; không expose ops reason chứa thông tin nội bộ/tenant khác.

## 3. States, layout và acceptance

Loading/empty/filter-empty/stale/partial/error/denied là các state bắt buộc, timestamps từng nguồn; counts0 khác fetch fail. Desktop table có caption, cột tối thiểu, details drawer; mobile nội bộ rows/cards hoặc scroll trong bảng, actions≥44px, keyboard/focus/alert/status đủ.

Kiểm cả response/log/network/admin DOM không chứa private payload; hidden menu không là test quyền. User credential gọi admin API và admin credential gọi user finance API đều phải denied. Thử safe retry10 lần/timeout sau commit không double posting; disable có audit và old history được giữ. Checklist tại [UI traceability](ui-requirement-traceability.md), phần API/log/role/worker production **NOT RUN**. Browser OP06 kiểm một phần synthetic (bảy màn, retry/disable/reason/preview/audit); không thay các kiểm quyền và recovery này.