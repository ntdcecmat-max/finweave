> **Cập nhật 03/11/2026:** `reviseDraftByMessage` đã triển khai tập lệnh tiếng Việt có giới hạn; preview cũ bị vô hiệu và số dư thực không tự đổi. Qwen/Ollama local đã chạy hai kịch bản end-to-end, web API005 và Android native cũng đã kiểm trong phạm vi local. Xem [báo cáo hiện hành](../docs/execution/completion-2026-11-03.md) và [cách dùng](../docs/LOCAL-QUICKSTART.md). Những mô tả NOT RUN/unsupported phía dưới phản ánh thời điểm tháng 10; không mở rộng thành nghiệm thu mọi intent hoặc model quality đầy đủ.

# Assistant / Agent runtime local — FW-ASSISTANT-002

Chạy kiểm chứng từ `finweave-backend`:

```powershell
node scripts/build-assistant-contract.ts
node scripts/check-business.ts
node scripts/test-assistant.ts
node scripts/verify-assistant-evidence.ts
node scripts/evaluate-agent.ts
```

Harness tạo PostgreSQL synthetic riêng, áp dụng migration 001–009, dùng owner/worker login không superuser, rồi dừng cluster trong `finally`. Evidence có source/tool schema hashes và trạng thái cluster. Không dùng harness với DB thật.

User API và Agent worker dùng cùng một cluster đã có migration 008. Theo [RUNTIME.md](RUNTIME.md), mở User API với profile `user`; mở một process khác với profile `agent`, secret riêng `agent.json`. Worker không có public HTTP listener. `src/runtime/main.ts` đã đăng ký `AgentWorker`, không dùng probe để giả kết quả Agent.

Không reset hoặc migrate cluster đang thu thập quan sát scheduler 7 ngày. Thay đổi process/source/migration của cluster đó sẽ cần ghi nhận tác động vào evidence. Kiểm chứng mới dùng cluster riêng; production/REAL vẫn bị chặn trong config.

Luồng planning:

1. Đăng nhập owner và chọn workspace; tạo conversation.
2. Tạo manual planning draft hoặc `startAgentRun` với scope, period, settings và selected Goal đã xác nhận.
3. Worker chọn bước từ kết quả đã journal: thiếu reserve thì hỏi; thiếu coverage thì partial; phương án không đạt thì thử lịch góp khác trong budget. Phép tính mức góp và mô phỏng thuộc Engine. Draft-ready cần phương án đã được Engine kiểm.
4. Owner gọi `simulatePlanningDraft`; query `getPlanningSimulation` đọc lại lịch sử đã đóng băng.
5. Owner có thể `reviseDraft` hoặc `refreshDraft` rõ ràng. Agent amendments cũng cần expected draft version và candidate đã evaluate.
6. `previewPlanningDraft` cấp token/digest/TTL; `confirmPlanningDraft` ghi Plan + Goal + links trong một UnitOfWork. Cùng keyed command replay lại kết quả; không double effects.

Mỗi lần sửa cần lấy version mới; không tái dùng preview cũ. Workspace đổi sau snapshot làm confirm stale, cần refresh rõ ràng. Agent không có quyền xác nhận thay owner và không tạo actual postings hoặc funded allocations.

13 capability handlers: snapshot, coverage, transactions, evidence, planning context, Plan/actual variance, pure draft simulation, scenario comparison, draft proposal/amendment, Review recommendations, clarification và finish. Decision schemas từ `docs/agent` được AJV kiểm trước reservation; intent allowlist và server-captured authority chặn workspace/active-write injection.

Plan-first: gửi `proposalBody` theo schema `createPlanningDraftInput.body` trong `startAgentRun`, hoặc gửi cùng `answerAgentRun` sau câu hỏi priorities. Multi-goal và Plan-only dùng chung body. `reserveConfirmed:false` buộc hỏi; owner trả `reserveConfirmed:true` để xác nhận reserve. Thiếu income/expense thì Agent hỏi; owner có thể gửi typed `settings` trong `answerAgentRun`, giữ cùng run và budget. Assumptions được versioned trong checkpoint; comparisons cũ không dùng để tạo draft mới. Scope/facts/period vẫn đóng băng, muốn đổi chúng cần owner khởi tạo run mới.

Replan: gửi `draftId` và `proposalBody` được owner chọn cùng conversation. Worker đọc Plan/actual variance và amendments giữ cùng draft identity, kiểm expected version và vô hiệu preview cũ. Chỉ owner proposal được đổi hard target/deadline/Plan; model không tự cấp quyền bằng priority. `getAgentEvidence` trả journal, mode, metrics có classification/quality và counters, không trả prompt/thinking. Terminal/question replies xuất hiện trong cùng `listMessages` với run/draft refs. `getToolResult` đọc snapshot Q&A gốc, không dựng lại từ dữ liệu hiện tại.

Budget cộng dồn: 8 accepted actions kể cả ask/finish, 60 giây active, 2 clarifications; model tối đa 12 rounds, 32768 input tokens và 4096 output tokens/root. Reservation unknown bị tính đủ, settlement CAS theo generation chỉ một lần. Quota PostgreSQL 10 roots/workspace và 50 toàn cục/ngày UTC, concurrency 1; continuation cùng root vẫn kiểm admission ngày hiện tại. Budget không reset khi resume/restart/cancel. Cancel abort best effort và live ticket/session/epoch/version fences chặn publish muộn.

Mode mặc định là `deterministic`: controller có lựa chọn theo quan sát nhưng không phải một model LLM. Scripted UI/demo tiếp tục ghi `scripted_mock`. Provider test double chỉ dùng trong suite có nhãn TEST_DOUBLE, không có egress và không phải evidence model. `FW_MODEL_MANIFEST` có thể chọn adapter Ollama loopback đã pin; preflight kiểm artifact bytes, runtime version, Ollama manifest digest, prompt/schema/registry/Engine hashes và synthetic-only/cloud-disabled. Không có manifest/runtime hợp lệ thì deterministic. Không tải model hoặc chuyển hosted/paid fallback. Bộ đếm và alias/masking gates đã thực thi; compatibility, conservative context byte/token bounds, cold load và model quality chưa smoke-test trên model thật.

Evaluator freeze source trước khi process riêng sinh 12 held-out instances bằng entropy mới, lưu dữ liệu/seed trong `.local` với ACL riêng, public chỉ digest và aggregates. Chạy cùng tools/Engine với manual+Engine compute emulator, single-tool và fixed branching, 3 repeats. Thời gian thao tác của người dùng và model cold-start/tokens/RAM chưa đo; không suy từ tốc độ code. Có coverage inventory đủ 30 public specifications, các refinement chưa executable được ghi NOT_RUN. Không nhận benefit release PASS khi chưa vượt baseline mạnh nhất và blind human review.

`reviseDraftByMessage` natural-language vẫn trả `MODEL_UNAVAILABLE`; formula và toàn bộ transaction-filter/natural-language coverage chưa hoàn tất. Browser/APK giữ synthetic UI, consumer API005/auth integration thuộc BE19. Physical purge, production recovery/unknown usage và đầy đủ ART/UAT còn mở. Xem [report mới](../docs/execution/backend-agent-runtime-2026-10-11.md), [report trước](../docs/execution/backend-assistant-local-2026-10-11.md) và [contract](../docs/contracts/local-assistant/README.md).
