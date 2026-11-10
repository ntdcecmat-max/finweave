# FinWeave — High-Level Design v0.2

07/10/2026 · scope-v3 · target design, chưa triển khai. [PRD](../product/prd.md), [SRS](../requirements/srs.md), [LLD](low-level-design.md), [deployment](deployment-topology.md), [trust profiles](adr/ADR-006-deployment-trust-profiles.md). HLD v0.1 lưu trong baseline ngày07/10.

## 1. Ranh giới hệ thống

Ba clients: User Web, User Android và Admin Web. Một modular backend, một ledger và Financial Engine. User UI vẫn có năm navigation hiện có; admin có ops views riêng. Android bổ sung collector native, outbox và device health. Provider giá ở phía backend; mobile không giữ provider secrets hoặc gọi thị trường thay scheduler.

| Module | Quyền và trách nhiệm |
| --- | --- |
| Identity/Devices | Session/membership, register/revoke device, consent/account-source binding; mọi object scoped theo quyền server |
| Ingestion | Receipt idempotency, parser versions, domain dedupe, evidence, Review; không coi notification là authority ngân hàng |
| Ledger | Atomic entries/balancing/correction/reversal; không amount từ AI/chart thành authority |
| Market/Holdings | Instrument catalog, gold profiles, quote jobs/cache theo entitlement, timestamp/compatibility; quantity độc lập giá |
| Financial Engine | Deterministic balance/flow/valuation/plan/goal/simulation, versioned snapshot và provenance |
| PlanGoals | Plan/Goal/draft và quan hệ mục tiêu–planned items; explicit confirm/versioning, không future income thành funded |
| Agent | Điều tra và co-create Plan/Goals, tools typed/bounded, hỏi thêm, draft/preview; không direct ledger/trade/SQL |
| Ops | Metadata jobs/provider/parser/versions/quota và audit; không user financial read/impersonation |
| Job dispatcher | Durable queue/lease/retry/catch-up; không phụ thuộc browser hoặc process Render sống liên tục |

## 2. Notification → hai giao diện

Android OS → native listener → app/account allowlist + sensitive filtering → encrypted durable outbox → authenticated device upload → server durable receipt → parser/matching → atomic posting hoặc Review → workspaceVersion mới → foreground client fetch snapshot. ACK receipt trước posting; trạng thái riêng. Cả web/mobile chỉ render snapshot của cùng authority, không tự cộng transactions page thành số dư.

Retry cùng eventId/device trả cùng receipt; semantic duplicate giữa device/CSV cần evidence matching riêng, không dedupe chỉ amount+minute. Thiếu mở đầu hoặc khoảng mất capture làm coverage partial. UI hiển thị observation versus calculated balance.

## 3. Quote flow

Server-side schedule/manual request → durable refresh job → provider adapter có quyền → kiểm instrument/product/side/unit/time → immutable quote observation → Engine valuation/snapshot. Provider lastSuccess khác quoteAsOf. Quotes chỉ chia cache giữa user nếu entitlement cho phép; key cá nhân không mặc nhiên cho redistribution. Profile protected giữ private ownership/subscriptions trong protected boundary.

## 4. Agent trong Plan/Goals

Một Assistant service/conversation boundary cung cấp cả hỏi–đáp/giải thích được kế thừa và orchestration đa bước theo [AI-SPEC-001](../product/ai-agent-specification.md). Read tool routing đơn giản và Agent dùng cùng auth/context/Engine/result/history; không thay full chat/panel/linh vật bằng một app Agent riêng. AI-FR-001…009 giữ capability cũ, AI-FR-010…024 mở rộng journeys/controls.

Entry từ Plan/Goals (và chat phụ) → user intent/context → Agent đọc authorized snapshot → hỏi ràng buộc → tạo planning draft → Engine simulate/compare → Agent chỉnh draft → user preview → explicit confirmation → PlanGoals service revalidate/atomic versioned commit. Agent có quyền viết **draft riêng**, không quyền xác nhận thay owner hay ghi actual. Analysis-only investigation trả evidence/proposals, không biến case nghi vấn thành correction.

User sửa plan thủ công trong lúc Agent đang chạy làm draft stale; phải rebase/re-preview. Resume sau clarification kiểm quyền/snapshot lại; không replay proposal cũ lên dữ liệu mới. Model không khả dụng thì manual planner và Engine vẫn dùng được.

## 5. Trust boundary bắt buộc ghi rõ

Conventional cloud topology khả thi cho synthetic integration. NFR-08 anti-Ops là yêu cầu cũ chưa được thay thế: real data cần trusted client + protected runtime + independent signing/key/enrollment/recovery. Các logical modules không được triển khai plaintext trên Render/Supabase rồi tuyên bố chống Ops.

Nếu chọn trusted-server sau quyết định sản phẩm rõ ràng, backend/DBA là trusted principals, UI admin vẫn không được đọc finance; threat model/NFR/API/auth phải cập nhật trước data thật. Hiện status: real deployment blocked by unresolved trust/source/PoC, không ngăn hoàn thiện tài liệu/PoC synthetic.

## 6. Reuse và migration

Giữ React components, decimal rules, typed services và mock để regression. Contract1.1/OpenAPI hiện tại là baseline synthetic, không tự đổi version/schema code trong lượt document-only. [API delta](../contracts/operational-api-spec.md) quy định các nhóm mới và migration dự kiến. Legacy specs/evidence được đánh dấu lịch sử; không gọi schema mới đã generated.
