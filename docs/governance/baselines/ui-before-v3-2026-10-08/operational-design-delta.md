# UI/UX delta v3 — chỉ đặc tả, chưa sửa frontend

07/10/2026 · bổ sung vào bộ design mock hiện tại; [PRD](../product/prd.md), [Agent](../product/ai-agent-specification.md).

| Surface | Thay đổi cần thiết khi triển khai |
| --- | --- |
| User web assets | Ticker search+quantity; vàng profile confirmation+quantity chỉ; daily/manual job state,last-good/source/asOf, mismatch/missing |
| User web data/settings | Source support/coverage, device permission/lastSeen/lastAck, revoke; giải thích Android requirement cho auto notification, manual/CSV vẫn dùng |
| Android onboarding | Disclosure→OS Notification access→app allowlist→account binding→test collector; deny/revoke/unsupported fallback rõ |
| Android status | Native queue pending/sync/retry/gaps, encrypted local cache, logout/account-switch warnings; không để mascot che action |
| Plan/Goals | “Cùng trợ lý lập kế hoạch”, constraint questions, linked Plan–Goal draft, compare scenarios, edit via chat/form, preview changes/confirm/cancel, stale/conflict; manual flow song song |
| Plan/Goals monitoring | Actual vs planned, shortfall và “Phân tích và điều chỉnh”; amendment draft có lý do/evidence, không tự thay active plan |
| Assistant | Giữ full chat/panel/history nhưng liên kết draft thật; tách “đang điều tra”, “cần bạn trả lời”, “bản nháp”, “đã áp dụng” và actual/planned/simulated |
| Admin | Source/parser/release support, jobs/quota/incidents/device operational health, retry/disable+reason/audit; không finance charts hay user chat |

Ba giao diện dùng chung design tokens, không chung quyền. Mask áp dụng cả proposal/evidence/hội thoại; mobile behavior cần real-device tests ngoài viewport. Mọi con số trạng thái xuất phát từ contract, không hard-code success. Không ghi các màn mới đã được thiết kế chi tiết/pixel-reviewed hoặc implement.

## AI kế thừa và tích hợp — 08/10/2026

Nguồn chức năng duy nhất: [AI-SPEC-001](../product/ai-agent-specification.md). Giữ chat/hỏi–đáp/giải thích/history/context/evidence và linh vật (AI-FR-001…009), mở rộng cùng conversation sang Plan/Goals drafting/Agent runs (AI-FR-010…024). Không buộc câu hỏi đơn giản vào multi-step planner; không tách Agent thành trợ lý thứ hai. Trong cùng hội thoại phải thấy trạng thái read result, đang điều tra/cần trả lời, draft/preview/confirmed/partial/stale và các căn cứ. Animation controls/keyboard/mobile/reduced-motion tiếp tục theo AI-FR-008 và AI-NFR-007.
