# BE-14/15 — Assistant và Planning local

11/10/2026 · **LOCAL_DETERMINISTIC_API_DATABASE_TESTED_PASS · FW-ASSISTANT-001**. [23 owner operations](../contracts/local-assistant/openapi.json), [runtime policy](../contracts/local-assistant/runtime-policy.json), [runbook](../../finweave-backend/ASSISTANT.md). Chưa phải nghiệm thu toàn bộ AI, Android hoặc production.

## Code đã bổ sung

- Conversation/message dùng chung transcript PostgreSQL, sequence/cursor, ownership và command replay. Simple Assistant trả metrics Engine từ frozen scope/period đã xác thực; lịch sử giữ baseline và được đánh dấu stale khi workspace thay đổi.
- Manual multi-goal/Plan-only draft; kiểm scope/owner/active refs/date/links/settings. Revise/refresh rõ ràng, preview 5 phút gắn version/digest/token; confirm Plan + Goal + support links nguyên tử với một workspace version increment. Không ghi ledger hoặc funded allocation.
- Pure simulation immutable cùng draft/base version, engine digest, Node runtime và asOf; `getPlanningSimulation` đọc lại lịch sử. Plan-only không bịa Goal ID. Reserve kiểm tiền tự do nhỏ nhất theo ngày, kể cả thu nhập đến muộn và tiền dành cho Goal.
- Agent worker/J2 handler thực; frozen input/captured owner session, durable action reservations/checkpoints, 8 actions/60 giây active/max2 câu hỏi. Clarification CAS giữ cùng job/counters/deadline; cancel/epoch/lease/generation fences chặn kết quả muộn. Heartbeat trước mỗi action loop.
- Strict schema/intent gateway cho 13 capability handlers. Candidate không được tự hạ target/deadline hoặc đổi settings/scope. Draft proposal/amendment và result/checkpoint commit cùng UnitOfWork; amendment kiểm expected version, không sửa owner-confirmed draft.
- Scoped planning context giữ full competing funding closure trong nguồn đã chọn và chặn vượt context bound. Read DTO dùng opaque aliases, bỏ memo/reference nguồn. Review tool chỉ đề xuất, không resolve/merge/post. Không có model egress.

Migration 008 additive; không đổi historical API005/DB005/native003. [Delta contract](../contracts/local-assistant/README.md) ghi Plan-only Goal nullable/proposed contribution zero; actual amount giữ quy tắc cũ. Engine thêm minimumFreeCash/finalFreeCash và checkpoint tương ứng; public forecast output giữ contract hiện có.

## Kiểm chứng

[Assistant integration](evidence/backend-assistant-local-2026-10-11/assistant-1791662419223.json): **18 nhóm PASS**, PostgreSQL thật với owner/worker không superuser. [Verifier](../../finweave-backend/scripts/verify-assistant-evidence.ts) PASS **55 source/schema hashes** và 23 operations. Cluster thử được dừng sau test.

Nhóm test bao gồm grounded/replay/transcript, privacy rejection trước persistence, pure simulation không cash effects, reserve theo ngày, foreign refs/links denial, injected failure chứng minh rollback toàn Plan+Goal+links rồi retry/replay, immutable history, Plan-only/stale refresh, candidate→draft, calendar/scoped competition, simulation+atomic amendment, authority/active-write injection denial, hard constraints, clarification/concurrent answers, cancellation sau claim, durable budget, SQL isolation/frozen input/recovery fences.

[Typecheck/pins/unit PASS](evidence/backend-business-local-2026-10-10/checks-1791662456073.json): 47 unit tests gồm independent Fraction oracle và checkpoint equivalence. Hồi quy business/finance/auth/async cuối nằm trong [tổng hợp kiểm chứng](evidence/backend-assistant-local-2026-10-11/final-verification.json). File này kiểm hash thực tế, không thay suite logs.

FAIL/STALE evidence trước được giữ nguyên để truy vết. Các suite lấy source trước thay đổi heartbeat đã được chạy lại; không sửa hash của evidence cũ để làm PASS. Các cluster thử độc lập; không reset/nâng cấp cluster đang theo dõi scheduler 7 ngày.

## Phần còn lại

| Phần | Trạng thái |
| --- | --- |
| Model/adaptive Agent | Chưa cài/chọn/pin model; provider admission, round/token counters, prompt/masking audit, challenge/held-out eval chưa chạy. Deterministic baseline không phải model PASS. |
| Natural-language coverage | Simple answer mới scope/period metrics; chưa đủ formula, transaction filter, intent routing/narrative. reviseDraftByMessage trả MODEL_UNAVAILABLE. Plan-first từ lời nói chưa có; manual form dùng được. |
| Lifecycle/retention | Read TTL có guard; physical purge và public terminal projection khi dispatcher cạn retry/deadline còn mở. Chưa nghiệm thu toàn bộ 32 ART cases. |
| Web/mobile adapters | UI vẫn synthetic mock 1.1.0; chưa nối toàn bộ API005/auth/native proof/error/decimal adapters. |
| Android collector | [APK pilot đã build/ký](android-pilot-2026-10-11.md); chưa NotificationListener/Keystore/Room/WorkManager/native auth, chưa kiểm điện thoại thật. |
| Providers/Ops/deployment | Chưa live entitlement/provider, full Ops ports/UI, production recovery/release/UAT. REAL vẫn tắt. |
| Quan sát 7 ngày | Từ 10/10/2026; sớm nhất đủ thời gian 17/10, không tính fake-clock thành PASS. |

BE-14/15 là local partial implementation có evidence mới; giữ đầy đủ AI-FR/NFR và 21 BE/41 parent AC. 18 nhóm này chưa chứng minh mọi phần khó hoặc mọi yêu cầu đã hoàn tất.
