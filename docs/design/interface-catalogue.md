# Danh mục giao diện và chức năng hiện hành

> **BE-19 — 12/10/2026:** giữ 50 screen IDs/features. User/admin dùng backend HTTP thật ở profile synthetic-local; API005/native003 adapters và evidence tách khỏi trạng thái mock lịch sử bên dưới. Xem [báo cáo](../frontend/be19-report.md), [consumer mapping](../frontend/be19-consumer-mapping.json), [screen RTM](../frontend/be19-rtm.csv), [scenario RTM](../frontend/be19-scenario-rtm.csv). Android build/JVM PASS; device E2E **NOT RUN**, người dùng xác nhận không có thiết bị. Không coi mọi screen/41 AC đã nghiệm thu.

DES-CAT-001 · rà soát 08/10/2026. **50 screen IDs v3**: 19 user, 8 auth, 10 shared, 6 Android, 7 admin. Nguồn máy đọc được: [surface-catalogue.ts](../../finweave-web/src/contracts/surface-catalogue.ts). Một screen ID không đồng nghĩa một URL, một test hoặc một màn đã nghiệm thu. Admin là bundle riêng; Android hiện có wizard minh họa/bridge interface, chưa APK/native runtime.

13 modules/86 semantic actions bên dưới là **inventory kế thừa v1**, không phải tổng chức năng v3 hay chứng nhận 41 AC. Tham chiếu test chỉ là ánh xạ; trạng thái chạy và giới hạn nằm ở [báo cáo nghiệm thu](../testing/frontend-acceptance-report.md) và [truy vết UI](ui-requirement-traceability.md).

## 1. Danh mục từng màn v3

`mock`: triển khai synthetic; `partial`: mới một phần luồng; `redirect`: tích hợp/chuyển trang cũ; `native_pending`: UI minh họa có thể chạy trên browser nhưng phần native chưa triển khai/kiểm chứng. Không dùng các giá trị này thay PASS.

Đặc tả nguồn: [User/shared](screen-behavior-specification.md), [auth](authentication-specification.md), [Android](android-ui-specification.md), [admin](admin-ui-specification.md).

| ID | Màn / route thực tế | Triển khai | AC cha | Ca kiểm chứng | Phần chưa kiểm chứng |
|---|---|---|---|---|---|
| UI-U-01 | Tổng quan · `/home` | mock | AC-08, AC-13, AC-14, AC-20, AC-21 | B02, B12 | UAT, dữ liệu thật và nguồn giá lịch sử |
| UI-U-02 | Báo cáo tích hợp Tổng quan · `/home/reports` | redirect | AC-20, AC-21 | B02, B12 | Không có trang Báo cáo riêng; route cũ về /home theo quyết định người dùng |
| UI-U-03 | Tài khoản & Tài sản · `/home/assets` | mock | AC-01, AC-02, AC-03, AC-04, AC-05, AC-10, AC-34, AC-35, AC-36 | B01, B05, B14, B15, OP01 | Catalog/giá thực và lịch cập nhật server |
| UI-U-04 | Tất cả giao dịch · `/transactions` | mock | AC-08, AC-11, AC-12 | B03, B06, N01, N07 | Authorization và đồng bộ server thật |
| UI-U-05 | Thu–chi · `/transactions/flow` | mock | AC-08, AC-11, AC-12 | B12, N07 | Nguồn giao dịch thật |
| UI-U-06 | Chuyển tiền · `/transactions/transfers` | mock | AC-08, AC-11, AC-15 | B06, B12 | Thu thập hai chân từ nguồn thật |
| UI-U-07 | Hoàn tiền · `/transactions/refunds` | mock | AC-08, AC-11, AC-15 | B12, N07 | Đối soát nguồn thật |
| UI-U-08 | Tổng quan kế hoạch · `/plan` | mock | AC-22, AC-23, AC-39 | B07, OP03, OP04 | Hiệu chỉnh mô hình/Agent/provider thật |
| UI-U-09 | Thu nhập & Chi tiêu dự kiến · `/plan/items` | mock | AC-22, AC-23 | B07, B12 | Plan server và đồng bộ nhiều client |
| UI-U-10 | Đầu tư dự kiến · `/plan/investments` | mock | AC-22, AC-23 | B07, B12 | Phí/thuế/market assumptions; không auto trade |
| UI-U-11 | Đặt mục tiêu · `/plan/goals` | mock | AC-24, AC-25, AC-39 | B08, B13, OP03 | Khả năng đạt theo giả định, chưa là dự báo thị trường |
| UI-U-12 | Mô phỏng tích hợp Đặt mục tiêu · `/plan/simulation` | redirect | AC-26 | B09, B20, S6-E11 | Route cũ chuyển về Goals; mô phỏng cục bộ, không vĩ mô trực tiếp |
| UI-U-13 | Nguồn dữ liệu & CSV · `/data` | mock | AC-06, AC-07, AC-31 | B04, N03, N05 | Nguồn/collector server thật |
| UI-U-14 | Kiểm tra dữ liệu · `/data/review` | mock | AC-15, AC-16, AC-32, AC-38 | B03, B04, B06, B20, OP02 | Ma trận thông báo/provider thật, AI investigation đầy đủ |
| UI-U-15 | Trợ lý AI · `/ai` | mock | AC-27, AC-38, AC-39, AC-40 | B10, N04, S6-E11, OP03, OP05 | Scripted/rule based; không provider/LLM thật |
| UI-U-16 | Lịch sử hội thoại · `/ai/history` | mock | AC-28, AC-40 | B10, N04, N06 | Persistence server qua restart |
| UI-U-17 | Thiết lập & phiên · `dialog/component` | mock | AC-01, AC-17, AC-18, AC-29 | AUTH-UI-01, B11, OP07 | Dialog, không route riêng; auth real/security gate riêng |
| UI-U-18 | Thiết bị & đồng bộ · `/data/devices` | partial | AC-29, AC-30, AC-31, AC-33 | OP02, OP07 | Last-reported synthetic; không OS live hoặc background sync thật |
| UI-U-19 | Chi tiết nguồn · `/data/sources/:id` | partial | AC-07, AC-31, AC-36 | B04, B05, B16, OP01 | Pipeline thực, remap đúng device và hỗ trợ package thật |
| UI-AUTH-01 | Đăng nhập · `/auth/login` | mock | AC-17, AC-29 | AUTH-UI-01, AUTH-UI-02 | Không auth provider thật |
| UI-AUTH-02 | Đăng ký · `/auth/register` | mock | AC-17, AC-29 | AUTH-UI-03 | Policy/delivery production |
| UI-AUTH-03 | Xác minh · `/auth/verify` | mock | AC-17, AC-29 | AUTH-UI-02, AUTH-UI-03 | OTP thật và abuse control |
| UI-AUTH-04 | Quên mật khẩu · `/auth/forgot` | mock | AC-17, AC-29 | AUTH-UI-04 | Email delivery/recovery trust |
| UI-AUTH-05 | Đặt lại mật khẩu · `/auth/reset` | mock | AC-17, AC-29 | AUTH-UI-04 | Recovery production |
| UI-AUTH-06 | Hết phiên · `/auth/expired` | mock | AC-17, AC-29 | AUTH-UI-05 | Token refresh/uncertain commit server |
| UI-AUTH-07 | Từ chối quyền · `/auth/denied` | mock | AC-17, AC-29 | AUTH-UI-06 | Authorization production, không chỉ menu |
| UI-AUTH-08 | Tài khoản & phiên · `dialog/component` | mock | AC-17, AC-29 | AUTH-UI-05, OP07 | Native queue quarantine và logout server thật |
| UI-S-01 | Tài khoản: chi tiết & nhập tay · `dialog/component` | mock | AC-01, AC-02, AC-03, AC-09 | B01, B03 | Persistence/ownership production |
| UI-S-02 | Tài sản: catalog/profile & chi tiết · `dialog/component` | mock | AC-04, AC-05, AC-10, AC-34, AC-35 | B05, B14, OP01 | Catalog/provider thật |
| UI-S-03 | Giao dịch: nhập/chi tiết/lịch sử · `dialog/component` | mock | AC-08, AC-11, AC-12 | B03, B06, N01 | Server concurrency/security |
| UI-S-04 | Quyết định Review · `dialog/component` | mock | AC-15, AC-16, AC-32, AC-38 | B03, B04, B20, OP02 | Native/parser/review matrix đầy đủ |
| UI-S-05 | Bản nháp liên kết Plan/Goal · `/plan/drafts/:id` | mock | AC-22, AC-24, AC-26, AC-39, AC-40 | OP03, OP04 | Không canonical PlanDraft API hoặc provider thật |
| UI-S-06 | Preview → xác nhận · `dialog/component` | mock | AC-08, AC-12, AC-22, AC-24, AC-41 | N01, S6-E01, S6-E02, S6-E03, OP04 | Atomic DB/recovery hạ tầng thật |
| UI-S-07 | Agent run & ràng buộc · `dialog/component` | partial | AC-38, AC-39, AC-40 | OP03, OP05 | Rule based; budget/model/tool security chưa nghiệm thu production |
| UI-S-08 | Panel ngữ cảnh & linh vật · `dialog/component` | mock | AC-19, AC-27, AC-28, AC-40 | B10, B11, B13, PET | Android TalkBack và native Back |
| UI-S-09 | CSV wizard · `dialog/component` | mock | AC-06, AC-41 | B04, N03, N05, S6-E05 | Production limits/retention |
| UI-S-10 | Jobs & receipt · `dialog/component` | partial | AC-06, AC-32, AC-33, AC-36, AC-41 | N03, OP01, OP02 | Daily server scheduler, outbox native, restore infra |
| UI-M-01 | Giải thích & xin quyền · `/data/android` | native_pending | AC-30, AC-31 | OP02, OP07 | Browser chỉ minh họa consent; OS handoff chưa chạy trên Android |
| UI-M-02 | Chọn ứng dụng nguồn · `/data/android` | native_pending | AC-31 | OP02 | Allowlist synthetic; chưa matrix appVersion/package thật |
| UI-M-03 | Gắn tài khoản · `/data/android` | native_pending | AC-31, AC-32 | OP02 | Binding synthetic; chưa multi-account native |
| UI-M-04 | Kiểm tra thiết lập · `/data/android` | native_pending | AC-30, AC-31, AC-32 | OP02 | Receipt minh họa thiếu thông tin; không notification thật |
| UI-M-05 | Trạng thái & hàng đợi · `/data/android` | native_pending | AC-31, AC-33, AC-41 | OP02, OP07 | Chưa native persistence/restart/reboot/OEM/offline ACK |
| UI-M-06 | Cài/cập nhật APK · `/data/devices` | native_pending | AC-30 | OP07 | Chưa signed APK, signing metadata, cài/update/real-device evidence |
| UI-ADM-01 | Tổng quan vận hành · `/admin/overview` | mock | AC-29, AC-37 | OP06 | Admin API/session thật chưa triển khai |
| UI-ADM-02 | Tài khoản SaaS & thiết bị · `/admin/accounts` | mock | AC-29, AC-37 | OP06 | Metadata only, không bank accounts; quyền server chưa chứng minh |
| UI-ADM-03 | Nguồn & bộ đọc · `/admin/sources` | mock | AC-37 | OP06 | Disable preview/audit cục bộ; change pipeline thật chưa có |
| UI-ADM-04 | Tác vụ · `/admin/jobs` | mock | AC-37 | OP06 | Retry/lease/idempotency mock, chưa worker server |
| UI-ADM-05 | Hạn mức · `/admin/quotas` | mock | AC-37 | OP06 | Read-only quota fixture, không provider billing thật |
| UI-ADM-06 | Phiên bản Android · `/admin/releases` | mock | AC-30, AC-37 | OP06 | Không artifact verified hoặc download APK giả |
| UI-ADM-07 | Sự cố & nhật ký · `/admin/incidents` | mock | AC-37, AC-41 | OP06 | Audit in-memory, chưa immutable storage/restore |

**Cập nhật backend 11/10/2026:** [BE-16](../execution/backend-ops-local-2026-10-11.md) đã có PostgreSQL services và negative authorization cho đủ bảy màn trên; [mapping theo từng màn/thao tác](../contracts/local-ops/catalogue-mapping.json). Cột `mock` vẫn phản ánh UI gateway hiện tại. Các khoảng cách admin API/worker/audit server của baseline bảng đã được xử lý trong scope local BE-16; nối UI BE-19 và production/restore UAT còn pending.

## 2. Giao diện/module hiện hành (Kế thừa module logic)

| Module | Giao diện/routes | REQ | Mức implementation |
|---|---|---|---|
| MOD-AUTH / Authentication & phiên | /auth/login, /auth/register, /auth/forgot, /auth/reset, /auth/verify, /auth/expired, /auth/denied; Đăng nhập; Đăng ký demo; Xác thực mã; Quên mật khẩu; Đặt lại mật khẩu; Hết phiên; Từ chối truy cập; Tài khoản & phiên trong Thiết lập | AUTH-UI-01…08 bổ sung | M2 identity network mock running; real auth BLOCKED |
| MOD-HOME / Tổng hợp tài chính | /home, /home/reports (chuyển hướng); Tổng hợp; Báo cáo tích hợp Home; Dialog giải thích số liệu; Biểu đồ chi tiêu/dòng tiền/cơ cấu và bảng thay thế; Nhận xét có căn cứ | REQ-TRACK-01, REQ-TRACK-02, REQ-REPORT-01, REQ-INSIGHT-01 | M2 synthetic network running; shared read snapshot |
| MOD-ACCOUNT / Tài khoản & tiền mặt | /home/assets; Danh sách/thẻ tài khoản; Chi tiết/lịch sử/dòng tiền tài khoản; Thêm tài khoản; Lưu trữ tài khoản; Mốc theo dõi; Kiểm đếm tiền mặt | REQ-SET-01, REQ-BANK-01, REQ-CASH-01, REQ-CASH-02 | M2 synthetic network running |
| MOD-HOLDING / Cổ phiếu & vàng | /home/assets; Thẻ cổ phiếu/vàng; Chi tiết/chất lượng/lịch sử tài sản; Thêm tài sản; Cập nhật số lượng; Giá vốn; Giá/tỷ giá | REQ-STOCK-01, REQ-GOLD-01, REQ-HOLD-01, REQ-REVIEW-02 | M2 synthetic network running |
| MOD-TXN / Giao dịch | /transactions, /transactions/flow; Tất cả giao dịch; Thu–chi; Bộ lọc/tìm kiếm; Chi tiết/bằng chứng/lịch sử giao dịch; Ghi giao dịch; Phân loại; Sửa nháp/điều chỉnh đã ghi sổ; Ghi sổ nháp | REQ-MONEY-01, REQ-TXN-01, REQ-TXN-02 | M2 synthetic network running |
| MOD-TRANSFER / Chuyển tiền & hoàn tiền | /transactions/transfers, /transactions/refunds; Chuyển tiền; Hoàn tiền; Hai chân chuyển/phí/thiếu chân; Nhận hoàn/liên kết khoản mua; Kiểm tra hoàn chưa liên kết | REQ-MONEY-01, REQ-REVIEW-01 | M2 synthetic network running |
| MOD-SOURCE / Nguồn & import | /data; Kết nối/độ mới nguồn; Tải/dán/ánh xạ CSV; Preview dòng/raw/chuẩn hóa/lỗi; Xác nhận các dòng chọn; Kết quả/lịch sử import | REQ-INPUT-01, REQ-INPUT-02 | M2 synthetic network running; staged preview and async jobs |
| MOD-REVIEW / Review & bằng chứng | /data/review; Danh sách/lọc trạng thái Review; Chi tiết/raw/bằng chứng/lịch sử nghi vấn; Xử lý lệch cash; Xử lý chuyển thiếu chân; Xử lý trùng; Liên kết hoàn; Phân loại nghi vấn; Xử lý pending; Kiểm tra chất lượng; Bổ bổ sung/bỏ dòng lỗi | REQ-REVIEW-01, REQ-REVIEW-02, REQ-CASH-02 | M2 synthetic network running; typed resolutions |
| MOD-PLAN / Kế hoạch & actual | /plan, /plan/items, /plan/investments; Tổng quan/dự báo Plan; Thu nhập & Chi tiêu dự kiến; Đầu tư dự kiến; Tạo/sửa/phiên bản/lưu trữ item; Liên kết actual; Còn lại/vượt kế hoạch; Giao dịch actual đã lọc | REQ-PLAN-01, REQ-PLAN-02 | M2 synthetic network running |
| MOD-GOAL / Goals & phân bổ | /plan/goals; Thẻ mục tiêu/tiến độ/thiếu nguồn; Tạo/sửa/lịch góp; Phân bổ tiền; Giải phóng/đạt/lưu trữ mục tiêu; Lịch sử | REQ-GOAL-01, REQ-GOAL-02 | M2 synthetic network running |
| MOD-SIM / Mô phỏng trong Đặt mục tiêu | /plan/goals (route cũ /plan/simulation chuyển hướng); Nhập/preview mô phỏng; Các bước góp/tiêu dùng/đầu tư theo ngày; Thẻ kết quả phiên chụp; So sánh/tính lại | REQ-SIM-01 | M2 synthetic network running |
| MOD-AI / AI & contextual panel | /ai, /ai/history; Trò chuyện; Lịch sử hội thoại; Panel linh vật dùng chung; Ngữ cảnh lúc gửi; Kết quả scripted/bằng chứng/drill; Đang xử lý/lỗi/hủy | REQ-AI-01, REQ-AI-02, REQ-NAV-01 | M2 network scripted AI/history/panel running; no LLM |
| MOD-SYSTEM / Thiết lập & design system | /design; Thiết lập từ hồ sơ; Kỳ báo cáo; Phạm vi tài khoản; Ẩn tài chính toàn app; Reset dataset giả; Lỗi/business clock demo; Tokens/components/trạng thái; Danh mục module | REQ-UX-01, REQ-DEMO-01, REQ-NAV-01 | local/fixture_running; no real financial API for UI utilities |

## Thao tác và trạng thái

| Action / module | Thao tác / form | Local/query/mutation | Contract | States |
|---|---|---|---|---|
| AUTH01 / MOD-AUTH | Đăng nhập / F-AUTH1 | identity | identity:signIn | editing, invalid, pending, completed, expired, denied |
| AUTH02 / MOD-AUTH | Đăng ký / F-AUTH2 | identity | identity:registerIdentity | editing, invalid, pending, completed, expired, denied |
| AUTH03 / MOD-AUTH | Xác thực mã / F-AUTH3 | identity | identity:verifyIdentityChallenge | editing, invalid, pending, completed, expired, denied |
| AUTH04 / MOD-AUTH | Quên mật khẩu / F-AUTH4 | identity | identity:requestPasswordReset | editing, invalid, pending, completed, expired, denied |
| AUTH05 / MOD-AUTH | Đặt lại mật khẩu / F-AUTH5 | identity | identity:resetIdentityPassword | editing, invalid, pending, completed, expired, denied |
| AUTH06 / MOD-AUTH | Đăng xuất | identity | identity:signOut | editing, invalid, pending, completed, expired, denied |
| AUTH07 / MOD-AUTH | Điền mẫu; hiện/ẩn mật khẩu; các link auth | local | Không business API; local/control | closed, open, applied, cancelled |
| AUTH08 / MOD-AUTH | Hết phiên: clear session/cache/chat/drafts | fixture | Không business API; local/control | closed, open, applied, cancelled |
| AUTH09 / MOD-AUTH | Denied không financial DTO; về workspace owned | local | Không business API; local/control | closed, open, applied, cancelled |
| AUTH10 / MOD-AUTH | Đọc phiên/owner workspace projection | query | getSession | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| HOME01 / MOD-HOME | Đọc workspace/Tổng hợp/Báo cáo/portfolio/Insights | query | getPresentationSnapshot, getWorkspace, getOverview, getSpendingReport, getPortfolio, getInsights | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| HOME02 / MOD-HOME | Metric explanation/đổi chart sang bảng | local | Không business API; local/control | closed, open, applied, cancelled |
| HOME03 / MOD-HOME | Chart/Insight drill sang Tx/holding/AI giữ context | local | Không business API; local/control | closed, open, applied, cancelled |
| HOME04 / MOD-HOME | Preset/custom period/scope: local Apply derive same snapshot | local | Không business API; local/control | closed, open, applied, cancelled |
| ACC01 / MOD-ACCOUNT | List/detail tài khoản | query | listAccounts, getAccount | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| ACC02 / MOD-ACCOUNT | Thêm bank/wallet/cash với opening / F01 | mutation | createAccount | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| ACC03 / MOD-ACCOUNT | Archive tài khoản giữ lịch sử / F01-archive | mutation | archiveAccount | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| ACC04 / MOD-ACCOUNT | Cập nhật mốc theo dõi / F00 | mutation | updateTrackingSettings | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| ACC05 / MOD-ACCOUNT | Kiểm đếm cash chỉ observation / F09 | mutation | recordCashCount | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| ACC06 / MOD-ACCOUNT | Movements drill tới giao dịch cùng account | local | Không business API; local/control | closed, open, applied, cancelled |
| HOLD01 / MOD-HOLDING | List/detail/quantity history/quotes | query | listHoldings, getHolding, listHoldingMovements, listPriceQuotes | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| HOLD02 / MOD-HOLDING | Thêm holding / F02 | mutation | createHolding | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| HOLD03 / MOD-HOLDING | Cập nhật lượng / F06 | mutation | updateHoldingQuantity | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| HOLD04 / MOD-HOLDING | Cập nhật/xóa khai báo giá vốn / F07 | mutation | updateHoldingCost | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| HOLD05 / MOD-HOLDING | Thêm quote/FX và compatibility / F08 | mutation | recordPriceQuote | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| HOLD06 / MOD-HOLDING | Xem chất lượng độc lập nguồn/lượng/giá/FX | local | Không business API; local/control | closed, open, applied, cancelled |
| TX01 / MOD-TXN | List/filter/detail giao dịch | query | listTransactions, getTransaction | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| TX02 / MOD-TXN | Ghi thu/chi/đầu tư/draft/pending / F03 | mutation | createEvent | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| TX03 / MOD-TXN | Đổi category/override / F04 | mutation | updateCategory | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| TX04 / MOD-TXN | Sửa draft/pending hoặc correction posted / F05 | mutation | updateDraft, correctPostedEvent | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| TX05 / MOD-TXN | Xác nhận ghi sổ draft / F05-post | mutation | postDraft | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| TX06 / MOD-TXN | Filter draft/clear/search/tab/sort local; derive from shared API snapshot | local | Không business API; local/control | closed, open, applied, cancelled |
| TX07 / MOD-TXN | Detail source/evidence/history | query | getEvidence | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| MOVE01 / MOD-TRANSFER | Tạo transfer/refund bằng discriminated EventInput / F03-transfer-refund | mutation | createEvent | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| MOVE02 / MOD-TRANSFER | Liên kết refund với original / F17-refund | mutation | linkRefund | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| MOVE03 / MOD-TRANSFER | Mở Review transfer thiếu chân hoặc refund unmatched | local | Không business API; local/control | closed, open, applied, cancelled |
| SRC01 / MOD-SOURCE | Đọc sources | query | listSources, getImportTemplate | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| SRC02 / MOD-SOURCE | Refresh | mutation | refreshSource | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| SRC03 / MOD-SOURCE | Disconnect/reconnect | mutation | disconnectSource, reconnectSource | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| IMP01 / MOD-SOURCE | Chọn file/paste/mapping/sample/valid row subset local | local | Không business API; local/control | closed, open, applied, cancelled |
| IMP02 / MOD-SOURCE | Preview staged import / F16 | query | previewImport | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| IMP03 / MOD-SOURCE | Confirm bound subset returns202job / F16-confirm | mutation | confirmImport | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| IMP04 / MOD-SOURCE | Poll/list jobs tới terminal | query | getImportJob, listImportJobs | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| SRC04 / MOD-SOURCE | Thông báo/revision là mutation; fail/revoked là synthetic control | mutation | ingestSourceEvidence, reviseSourceRecord | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV01 / MOD-REVIEW | List/detail case/evidence | query | listReviewCases, getReviewCase, getEvidence | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| REV02 / MOD-REVIEW | adjustUnknown / F17-adjustUnknown | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV03 / MOD-REVIEW | forgottenExpense / F17-forgottenExpense | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV04 / MOD-REVIEW | confirmTransfer / F17-confirmTransfer | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV05 / MOD-REVIEW | mergeDuplicate / F17-mergeDuplicate | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV06 / MOD-REVIEW | linkRefund / F17-linkRefund | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV07 / MOD-REVIEW | categorize / F17-categorize | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV08 / MOD-REVIEW | postPending / F17-postPending | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV09 / MOD-REVIEW | rejectPending / F17-rejectPending | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV10 / MOD-REVIEW | acknowledgeQuality / F17-acknowledgeQuality | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV11 / MOD-REVIEW | dismissInvalid / F17-dismissInvalid | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV12 / MOD-REVIEW | supplementInvalid / F17-supplementInvalid | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV13 / MOD-REVIEW | defer / F17-defer | mutation | resolveReviewCase | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| REV14 / MOD-REVIEW | Status filter/open related holding/source/transaction | local | Không business API; local/control | closed, open, applied, cancelled |
| PLAN01 / MOD-PLAN | List items/forecast | query | listPlanItems, getPlanForecast | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| PLAN02 / MOD-PLAN | Tạo/sửa planned item / F10 | mutation | createPlanItem, updatePlanItem | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| PLAN03 / MOD-PLAN | Archive item / F10-archive | mutation | archivePlanItem | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| PLAN04 / MOD-PLAN | Link/unlink eligible posted actual / F11 | mutation | linkPlanActual, unlinkPlanActual | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| PLAN05 / MOD-PLAN | Drill actuallinks sang Tx filter; recurrence/section controls | local | Không business API; local/control | closed, open, applied, cancelled |
| GOAL01 / MOD-GOAL | List/progress | query | listGoals, getGoalProgress | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| GOAL02 / MOD-GOAL | Tạo/sửa goal/schedule / F12 | mutation | createGoal, updateGoal | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| GOAL03 / MOD-GOAL | Allocate cash backing / F13 | mutation | allocateGoal | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| GOAL04 / MOD-GOAL | Release allocation/mark achieved/archive / F14 | mutation | releaseGoalAllocation, markGoalAchieved, archiveGoal | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| GOAL05 / MOD-GOAL | Mở simulation/history | local | Không business API; local/control | closed, open, applied, cancelled |
| SIM01 / MOD-SIM | Mô phỏng và lưu conditional result / F15 | mutation | simulateGoalOutcome | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| SIM02 / MOD-SIM | List/detail frozen simulations | query | listSimulations, getSimulation | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| SIM03 / MOD-SIM | Compare/rerun form atcurrentversion; open goal/context | local | Không business API; local/control | closed, open, applied, cancelled |
| AI01 / MOD-AI | List/reopen conversation/messages | query | listConversations, getConversation, listMessages | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| AI02 / MOD-AI | Create conversation onfirstsend | mutation | createConversation | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| AI03 / MOD-AI | Send captured message / F18 | mutation | sendAssistantMessage | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| AI04 / MOD-AI | Poll result | query | getAssistantMessage | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| AI05 / MOD-AI | Cancel pending | mutation | cancelAssistantMessage | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| AI06 / MOD-AI | Open/close/expand panel; chips/draft; historicalcontext/drill | local | Không business API; local/control | closed, open, applied, cancelled |
| AI07 / MOD-AI | Retry intent withnewcapturedcontext/newmessage / F18-retry | mutation | sendAssistantMessage | editing, invalid, previewing, preview_ready, confirming, success, cancelled, validation, conflict, offline, timeout, rate_limited |
| SYS01 / MOD-SYSTEM | 5nav/subtabs/Back/deeplink/detail close | local | Không business API; local/control | closed, open, applied, cancelled |
| SYS02 / MOD-SYSTEM | Privacy mask allamounts/charts/free-text | local | Không business API; local/control | closed, open, applied, cancelled |
| SYS03 / MOD-SYSTEM | Open/close Settings/period/scope/dialogs andfields | local | Không business API; local/control | closed, open, applied, cancelled |
| SYS04 / MOD-SYSTEM | Clientvalidation/formcancel/focus/toggle table | local | Không business API; local/control | closed, open, applied, cancelled |
| SYS05 / MOD-SYSTEM | Generic mutation preview | query | previewMutation | loading, loaded, empty, partial, stale, offline, timeout, denied, not_found |
| SYS06 / MOD-SYSTEM | Confirm/retry shared form withsamekey/versions | local | Không business API; local/control | closed, open, applied, cancelled |
| SYS07 / MOD-SYSTEM | Reset/fault/advance demo fixture | fixture | Không business API; local/control | closed, open, applied, cancelled |
| SYS08 / MOD-SYSTEM | Design states/dialog/samplebuttons/module links | local | Không business API; local/control | closed, open, applied, cancelled |

[Screen/fields](screen-behavior-specification.md), [Auth](authentication-specification.md), [Services](../../finweave-web/src/services/contracts.ts), [API](../contracts/README.md).
