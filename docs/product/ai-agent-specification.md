> **ARCH-12 hiện hành — 09/10/2026:** [Agent LLD](../agent/README.md) và [ADR019](../architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md). Current **[API005](../contracts/v2-t1-r5/README.md) / DB005 / native bridge003**, [bundle/hash](../agent/implementation-bundle.json); Assistant mode/counter output delta, request/roles unchanged. **Design SPECIFIED; model disabled; runtime/evals NOT RUN.** Kế thừa AI-SPEC và các gói ARCH06–11 bằng explicit binding, không sửa historical packages/frontend.

> **ARCH-11 hiện hành — 09/10/2026:** [Sources](../sources/README.md), [ADR018](../architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md) và [bundle pin](../sources/implementation-bundle.json). Chốt source profile/normalization/rights/consumer mapping; API004/DB005/bridge2 giữ nguyên. **Design SPECIFIED; REAL SOURCES NOT ACTIVATED; runtime NOT RUN.** ARCH11 làm rõ nguồn/binding/Review; notes ARCH05…10 là base và lịch sử, không evidence live support.

> **ARCH-10 hiện hành — 09/10/2026:** [Android design](../android/README.md), [ADR017](../architecture/adr/ADR-017-android-native-collector-and-signed-apk.md) và [bundle pin](../android/implementation-bundle.json). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.

> **ARCH-09 hiện hành — 09/10/2026:** [Async/sync](../async/README.md), [API004: 153 operations / 634 schemas](../contracts/v2-t1-r4/README.md), [DB005: 87 bảng / 1001 cột](../data/target-t1-async/README.md) và [bundle/hashes](../async/implementation-bundle.json). Kế thừa đầy đủ tính năng; sửa CSV selectors và coverage paging, chốt J2/retry/ACK/scheduler/quota/cancellation/offline. **Thiết kế đã chốt; backend/SQL/native/provider/concurrency NOT RUN.** Các notes ARCH-05…08 bên dưới là lịch sử revision; target hiện hành theo004/005 và addenda này.

# FinWeave — Đặc tả hợp nhất Trợ lý AI và AI Agent

ID: AI-SPEC-001 · v1.1 · 09/10/2026 · scope-v3 · documentation only.

Đây là **nguồn đặc tả AI hiện hành duy nhất**, hợp nhất yêu cầu trợ lý cũ (REQ-AI-01/02, AC-27/28) với Agent mới (REQ-AGENT-01/02/03, AC-38…40). [PRD](prd.md) mô tả giá trị sản phẩm, [SRS](../requirements/srs.md) giữ mã yêu cầu cấp hệ thống; tài liệu này định nghĩa chi tiết hành vi AI. Mã AI-FR/AI-NFR bên dưới là refinement của các mã hệ thống, không tự tăng inventory41 AC của SRS.

Nguồn hợp nhất: REQ-AI-01/02 trong [SRS v2 lưu trữ](../governance/baselines/pre-realignment-2026-10-07/docs/requirements/srs.md), UC-AI-01/02 và BR-33…35; đặc tả Agent trước hợp nhất được [lưu nguyên trạng](../governance/baselines/ai-before-unification-2026-10-08/ai-agent-specification.md). Không có yêu cầu xóa chat, history, linh vật hoặc chức năng giải thích cũ. Lượt này không thay code frontend.

## 1. Mục tiêu và nguyên tắc kế thừa

Trợ lý giúp người dùng hiểu tài chính đang có **và** cùng xây dựng/điều chỉnh Plan–Goals. Hỏi một câu đơn giản vẫn nhận câu trả lời có căn cứ; việc mở cần điều tra hoặc thử phương án thì dùng Agent nhiều bước trong cùng trải nghiệm.

| Phần | Quy định |
| --- | --- |
| Hỏi–đáp, giải thích tiền/tài sản/giao dịch/Plan/Goals/mô phỏng | Kế thừa thành tính năng sản phẩm bắt buộc, tiếp tục phát triển; không hạ thành chức năng chỉ tồn tại để test |
| Full chat, lịch sử, panel contextual, linh vật | Kế thừa và dùng chung hội thoại/context, bổ sung liên kết đến run/draft/evidence |
| Scripted assistant hiện tại | Giữ làm adapter synthetic/demo và baseline regression; không bắt giữ nguyên regex, câu mẫu hoặc implementation khi xây runtime thật |
| Agent đa bước | Phát triển thêm: hỏi ràng buộc, điều tra, tạo/sửa draft, lặp mô phỏng, đề xuất điều chỉnh |
| Financial Engine | Tiếp tục tính số xác định; mọi chế độ AI đọc cùng authority, không có ledger hoặc phép tính tiền cạnh tranh |
| Áp dụng Plan/Goals | User preview/confirm qua service có kiểm quyền/version; Agent được ghi draft, không tự áp active changes hoặc actual money |

Không tạo hai trợ lý độc lập, hai kho lịch sử hoặc hai bản kế hoạch chỉ vì có hai cách xử lý. Có thể thay adapter từng phần với contract/migration rõ; bảo toàn capability và dữ liệu được phép giữ. Privacy/source/model gates hiện có vẫn áp dụng.

## 2. Quy ước mã và mức bằng chứng

- **AI-FR-001…024:** yêu cầu chức năng chi tiết.
- **AI-NFR-001…008:** yêu cầu chất lượng, quyền, tính đúng và đánh giá.
- **REQ-AI-01/02, REQ-AGENT-01/02/03:** mã hệ thống giữ nguyên trong SRS; bảng§9 nối tới mã chi tiết.
- **UC-AI-01/02** kế thừa; **UC-AI-03…07** bổ sung hành trình trong cùng module.
- Mã ổn định khi chỉnh câu chữ; yêu cầu bỏ/thay về sau phải ghi superseded và mapping, không tái sử dụng mã cho nghĩa khác.

Trạng thái hiện tại: UX/scripted behavior có implementation synthetic và evidence lịch sử M2, không chứng minh runtime thật hoặc toàn bộ tiêu chí hợp nhất đã pass. Agent/draft/model evaluation mới: **SPECIFIED / NOT RUN**. Không sửa lịch sử tests để nhận thêm PASS.

## 3. Functional requirements — kế thừa trải nghiệm trợ lý

| Mã | Yêu cầu bắt buộc | Tiêu chí nghiệm thu |
| --- | --- | --- |
| AI-FR-001 | Phải tiếp tục hỗ trợ hỏi–đáp về dữ liệu tài chính được phép trong web và Android user UI. Câu hỏi đơn giản có thể dùng read tool/rule trực tiếp | “Tiền đang ở đâu?” trả số liệu từ snapshot và tài khoản tương ứng; không buộc chạy lập kế hoạch đa bước hoặc tạo draft |
| AI-FR-002 | Phải giải thích tiền, thu–chi, giao dịch, cổ phiếu/vàng và biến động, phân biệt dòng tiền với định giá tài sản | Quote mới làm holding tăng giá trị không được diễn giải thành tiền thu vào. Coverage thiếu hoặc giá cũ được nêu rõ; không tạo số dư chính thức từ notification thiếu |
| AI-FR-003 | Phải tiếp tục giải thích Plan/Goals/allocations và kết quả mô phỏng đã có | Hỏi tiến độ Goal trả funded/remaining/shortfall đúng Engine, tách actual/planned/simulated; đọc kết quả không thay Plan/Goal |
| AI-FR-004 | Phải dùng chung conversation và message identity giữa full chat, panel linh vật, history và entry Plan/Goals | Gửi ở panel rồi mở full chat thấy cùng message/run/draft refs, không hai bản phản hồi. Chuyển chế độ không tự nhân hội thoại |
| AI-FR-005 | Phải hỗ trợ tạo/chọn hội thoại, xem lịch sử, tải thêm trang và tiếp tục trong phạm vi owner được phép | Pagination không lặp/mất message; chọn hội thoại giữ context lịch sử. Close panel không xóa history; logout clear local cache, server retention theo policy. Demo reset chỉ reset synthetic |
| AI-FR-006 | Phải hiển thị context trước gửi và giữ context tại thời điểm gửi: route, kỳ, scope, selected object/filter phù hợp, snapshot/versions | Đổi route/kỳ khi chờ không áp snapshot mới lên câu trả lời cũ; kết quả có nhãn stale nếu context hiện tại khác, refresh là hành động rõ |
| AI-FR-007 | Phải có result cards, source/quality/time/version, evidence và drill-down giữ context | Click căn cứ mở đúng giao dịch/holding/plan/goal/simulation và quyền được kiểm lại. History narrative không trở thành snapshot hiện tại |
| AI-FR-008 | Phải kế thừa linh vật như điểm mở trợ lý ở năm navigation user, kèm thao tác accessible và animation phù hợp | Mở/đóng/trả focus đúng; thinking/error/cancel/completed phản ánh trạng thái thực, không celebrate vì vừa tải lại history; mobile không che form, hỗ trợ pause/reduced-motion và ẩn khi cần |
| AI-FR-009 | Phải phối hợp xử lý đơn giản và đa bước trong cùng trợ lý, hiển thị cách xử lý/trạng thái trung thực | Câu hỏi đọc dùng tools hiện có; task mở dùng Agent khi phù hợp. Demo ghi scripted/synthetic, run thật không gắn nhãn demo. Không có model vẫn dùng manual/rule features có hỗ trợ, không giả Agent đã chạy |

## 4. Functional requirements — phát triển Plan/Goals và điều tra

| Mã | Yêu cầu bắt buộc | Tiêu chí nghiệm thu |
| --- | --- | --- |
| AI-FR-010 | Phải hỏi thông tin còn thiếu có ảnh hưởng quyết định: target, deadline, reserve, priorities, income assumptions và phần đã dành riêng | Không hỏi lại dữ liệu đã xác nhận còn hiệu lực; thiếu reserve trong case quan trọng phải hỏi hoặc ghi rõ chưa kết luận, không ngầm lấy0 |
| AI-FR-011 | Phải tạo/sửa GoalDraft cho mục tiêu mới hoặc amendment của Goal hiện có | Draft chứa target/deadline/source/priorities/assumptions/baseGoalVersion; lưu draft không đánh dấu achieved hoặc tăng funded |
| AI-FR-012 | Phải tạo/sửa PlanDraft có thu/chi/contribution dự kiến và quan hệ với GoalDraft/Goal hiện có | Một Goal có nhiều contribution items, item có thể không gắn Goal; planned contribution khác cash allocation/ActualLink. Không double-count một nguồn tiền cho nhiều Goal |
| AI-FR-013 | Phải gọi Financial Engine mô phỏng và so sánh phương án theo frozen inputs/ràng buộc | Kết quả có cashflow/shortfall/constraint violations và assumptions; infeasible được nêu. Không tự hạ reserve, tăng income hoặc bịa lợi suất để làm phương án khả thi |
| AI-FR-014 | Phải nhận chỉnh sửa bằng hội thoại hoặc form và tính lại draft nhất quán | “Tháng12 không đóng góp” sửa đúng item/timeline; giữ revision history, show changes và invalidate kết quả mô phỏng cũ. Hai UI không tạo draft authority khác nhau |
| AI-FR-015 | Phải cho user chọn draft, xem preview và xác nhận riêng để áp dụng Plan/Goals/links | Service recheck quyền/versions/digest/expiry/allocations, commit bundle atomic và idempotent. Cancel không active changes; retry confirm không nhân Plan/Goal; chat “đồng ý” chưa thay nút xác nhận trong phạm vi hiện tại |
| AI-FR-016 | Phải hỗ trợ phân tích actual-vs-plan và đề xuất amendment khi user yêu cầu điều chỉnh | Giữ version active cũ tới khi confirm; nêu nguyên nhân/evidence và tác động tới các Goal khác. Rule nhắc review không tự cho phép Agent đổi kế hoạch |
| AI-FR-017 | Phải điều tra chênh lệch nhiều bước, chọn bước tiếp theo theo bằng chứng và biết dừng | Case trùng+transfer+gap kiểm các giả thuyết liên quan, phân tách valuation/flow, nêu counter-evidence và phần chưa biết; case sạch không bịa lỗi |
| AI-FR-018 | Phải trình bày đề xuất xử lý Review có căn cứ mà không tự sửa actual ledger | Có case/action/evidence/reason và liên kết sang Review preview của owner; click xem đề xuất không merge/post/correct giao dịch |
| AI-FR-019 | Phải giữ run states, clarification continuation và cancellation có kết quả xác định | Pending hiển thị, awaiting_user không giữ worker chờ vô hạn; cancel dừng bước chưa bắt đầu, terminal state không bị response trễ ghi đè; draft đã lưu có thể giữ với nhãn phù hợp |
| AI-FR-020 | Phải phát hiện stale context/proposal và concurrent edits trước khi tiếp tục hoặc áp dụng | User sửa plan trong lúc Agent chạy → draft stale; resume kiểm session/versions, simulate/preview lại. Không last-write-wins lên active Plan/Goal |
| AI-FR-021 | Phải xử lý no-data, missing coverage, tool/model lỗi, timeout, quota và unavailable một cách có thể tiếp tục | Không trả metric0 thay missing; có partial/giới hạn và retry đúng policy. Không tự mua thêm hoặc gọi provider khác; giữ input/draft đã lưu khi có thể |
| AI-FR-022 | Phải cung cấp entry từ Plan và Goals, đồng thời hỗ trợ bắt đầu/tiếp tục qua chat hoặc panel | Một yêu cầu từ Goal mở đúng existing Goal context; user chuyển sang chat vẫn tiếp tục cùng run/draft. Không buộc rời Plan/Goals để dùng Agent |
| AI-FR-023 | Phải duy trì ranh giới quyền: read tools, pure simulation và draft tools được phép; actual/active confirm do owner service | Agent không có SQL/arbitrary HTTP/trade/payment/impersonation/ledger-write/confirmPlanningDraft tools; prompt không cấp thêm quyền. Draft write không đồng nghĩa được confirm |
| AI-FR-024 | Phải cho user xem/chỉnh/hủy draft và sử dụng manual Plan/Goal/Engine khi không muốn dùng Agent | Tắt/hết quota model vẫn mở được draft đã lưu và các form hỗ trợ; chuyển manual không tự áp phương án hoặc mất nguồn căn cứ |

## 5. Non-functional requirements

| Mã | Yêu cầu / cách kiểm |
| --- | --- |
| AI-NFR-001 | Mọi số tài chính do authorized Engine/ToolResult trả, decimal/rounding theo business rules. Factual claim có evidence hoặc nhãn giả định; classifications actual/planned/simulated/unknown rõ. Oracle độc lập phải khớp |
| AI-NFR-002 | Mask gồm prompt/narrative/cards/history/evidence/accessible text, không chỉ số trong card. Model context tối thiểu; raw notifications/OTP/credentials không gửi model/log/analytics. Data/draft/history retention và logout theo policy, không silent retention vô hạn |
| AI-NFR-003 | Authenticate/authorize workspace/object/device theo từng tool và lúc resume/confirm, không lấy identity từ prompt. User A, user B và admin bị kiểm direct API; local/session/provider phải phù hợp trust profile hiện có |
| AI-NFR-004 | User text/source/model output là untrusted data; schema/allowlist/server guards kiểm args/results. Injection từ evidence không đổi quyền/tool/system instructions; invalid/denied tool không retry bằng cách mở quyền |
| AI-NFR-005 | Mặc định thiết kế8 tool calls,60s active budget,2 lượt clarification rồi pause; user wait không tính60s. Continuation có quota/rate-limit, hết budget trả partial/pause đúng. Tham số cần benchmark, chưa SLO đã đạt |
| AI-NFR-006 | Không silent paid fallback hoặc model egress không phù hợp privacy. Provider/model terms, cost/quota/latency phải được đánh giá trước real use; scripted/local mock không nhận là model thật |
| AI-NFR-007 | Keyboard/focus/Escape/return, mobile, reduced-motion, labels/table alternatives và thao tác pause/collapse linh vật tiếp tục áp dụng. Mascot chỉ phản ánh trạng thái, không ngụ ý số liệu đúng khi tools lỗi |
| AI-NFR-008 | Release cần cả regression capability cũ và evaluation Agent mới. Không đạt benefit thì cải thiện model/runtime hoặc dùng deterministic/manual fallback trong cùng feature, giữ Agent use cases ở backlog; không bỏ khả năng mới/cũ để hợp thức hóa benchmark |

## 6. Hành trình hợp nhất

### UC-AI-01 — Hỏi–đáp, giải thích và lịch sử (kế thừa)

User gửi câu hỏi có context → kiểm quyền → công cụ đọc/Engine trả dữ liệu → trợ lý giải thích bằng result/evidence cards → lưu message/context → drill tới căn cứ. Case đơn giản kết thúc ở đây. Nếu câu hỏi mở cần điều tra, đề nghị hoặc chuyển sang run với trạng thái rõ, vẫn cùng conversation. Errors/no-data không tạo số bịa; refresh context là hành động explicit. Áp dụng AI-FR-001…007/009/021/023 và AI-NFR-001…007.

### UC-AI-02 — Linh vật và panel contextual (kế thừa)

User mở linh vật ở một trong năm navigation → thấy context và history → gửi/tiếp tục yêu cầu → mở full chat hoặc đóng panel giữ hội thoại. Route change giữ context message đã chụp; mask cả nội dung tự do, close trả focus. Motion giữ theo lựa chọn/reduced-motion, không che action. Áp dụng AI-FR-004…009/019 và AI-NFR-002/007. Animation details hiện có ở [implementation note](../frontend/mascot-interactions.md) là tham chiếu kỹ thuật, không một đặc tả AI thứ hai.

### UC-AI-03 / PG-01 — Tạo Goal và Plan từ mục tiêu

Entry từ Goals/Plan/chat. User nêu target/deadline → đọc cash/coverage/current plans/goals → hỏi constraints còn thiếu → tạo GoalDraft+PlanDraft liên kết → Engine simulate/compare → user chỉnh → tính lại → preview → owner confirm. Kết quả là plan/goal versions có audit, không actual money. Hủy/no-data/infeasible/stale giữ draft và giới hạn rõ. Áp dụng AI-FR-010…015/019…024.

### UC-AI-04 / PG-02 — Tạo từ kế hoạch tổng thể

User muốn sắp xếp6 tháng nhưng chưa có Goal cụ thể → hỏi ưu tiên/constraints → tạo PlanDraft → đề xuất GoalDraft nếu phù hợp → simulate/compare/chỉnh/confirm như UC-AI-03. Không ép mọi item gắn Goal; một Goal nhiều contribution items. Áp dụng AI-FR-010…015/022…024.

### UC-AI-05 / PG-03 — Theo dõi và điều chỉnh

Từ Plan/Goal user chọn “Phân tích và điều chỉnh” → đọc actual-vs-plan/coverage/links → kiểm nguyên nhân và hỏi hoàn cảnh đổi → thử amendment drafts → user chọn preview/confirm phiên bản mới. Nhắc định kỳ có thể do rules, không tự kích hoạt sửa active plan hoặc chuyển tiền. Áp dụng AI-FR-013…016/019…024.

### UC-AI-06 / INV-01 — Điều tra chênh lệch

User hỏi vì sao tiền/tài sản giảm → kiểm coverage/context → phân tách flow/valuation → kiểm transfer/refund/trùng/fee/actual-vs-plan theo evidence → trả kết luận/giả thuyết/partial → đề xuất Review nếu cần. Không biến nghi vấn thành correction. Áp dụng AI-FR-002/006/007/017…021/023.

### UC-AI-07 — Chuyển tiếp giữa khả năng cũ và mới

User hỏi tiến độ Goal → trợ lý trả dữ liệu → user yêu cầu “lập lại phương án để kịp hạn” → dùng cùng hội thoại/context hợp lệ để tạo Agent run và amendment draft → user tiếp tục qua Plan/panel → simulate/preview/confirm. Đổi tác vụ từ đọc sang draft phải rõ, không mất history hoặc cấp quyền confirm cho Agent. Áp dụng AI-FR-003…007/009/014…016/019…024.

## 7. Tool registry và execution

| Tool capability | Vai trò / requirements |
| --- | --- |
| reports/portfolio/transactions/evidence/insights | Kế thừa capability đọc; getFinancialSnapshot/getCoverage/getTransactions/getEvidence là tên logic đích, không tự renaming runtime contract; AI-FR-001/002/006/007/017 |
| plans/goals/allocations/simulation | Kế thừa đọc và giải thích; getPlans/getGoals/getAllocations/getPlanActualVariance; AI-FR-003/016 |
| simulatePlan/compareScenarios | Mở rộng từ giải thích kết quả sang chạy thử phương án frozen; Engine tính, AI-FR-013/014 |
| askClarification | Ghi câu hỏi/run awaiting_user, continuation kiểm lại quyền/version; AI-FR-010/019/020 |
| proposePlanningDraft/amendPlanningDraft | Chỉ draft sandbox có owner/versions/assumptions/refs, AI-FR-011/012/014 |
| proposeReviewActions | Đề xuất evidence/actions chưa áp dụng; AI-FR-018 |
| finishRun | Structured conclusion/limitations/results/proposals; không lấy model text làm authority số, AI-FR-007/019/021 |

Router có thể chọn một tool cho câu hỏi đơn giản hoặc orchestrate nhiều bước cho task mở; cùng conversation/service boundary và Engine. `confirmPlanningDraft` chỉ là endpoint user-service, không nằm trong tool registry Agent. Tool contract validate input/output, permission từng object, frozen context và classification.

Run: queued→reading→awaiting_user hoặc simulating→draft_ready/completed/partial/failed/cancelled. Draft: draft→previewed→confirmed/superseded/expired. Message/history state khác active financial version; tải history hoặc celebrate không tự có commit.

Timeout/invalid/denied/quota không bịa fallback results. Cancel không áp draft; một draft tool đã hoàn thành có thể giữ draft với nhãn cancelled run. Không yêu cầu chain-of-thought; audit lưu tool refs/status/versions và giải thích ngắn có kiểm chứng.

## 8. Dữ liệu và tích hợp

Conversation→Messages giữ captured context và mode/processingKind rõ; một message có thể tham chiếu ToolResult, AgentRun và PlanningDraft. Run continuation/clarification cùng thread; không sao chép hội thoại thành Agent history riêng. Result cards hỗ trợ read facts, scenario comparisons và draft refs, mỗi loại vẫn có provenance/classification.

PlanningDraft có GoalDrafts, PlanDraft/items, goal links, constraints/assumptions, baseSnapshot/plan/goal versions và simulation refs. PlanGoalLink không thay ActualLink hoặc GoalAllocation. Preview ràng buộc owner/digest/versions/expiry; confirm revalidate và atomic commit plan+goals+links+audit+idempotency. Raw source notification không trở thành model context.

[Data model](../data/logical-data-model.md), [API005 hiện hành](../contracts/v2-t1-r5/README.md), [UI delta](../design/operational-design-delta.md) mô tả implementation boundary; không tạo nguồn chức năng AI song song. Migration phải giữ read operations, conversation IDs, pagination, cancel/stale/error handling và mascot state semantics. Mode labels/proposal refs mới cần schema version migration, không tự sửa code trong lượt docs này.

## 9. Truy vết mã hệ thống → mã chi tiết

| Mã hệ thống / AC giữ nguyên | Mã chi tiết hiện hành | Test suites |
| --- | --- | --- |
| REQ-AI-01 / AC-27 | AI-FR-001…007, AI-FR-009, AI-FR-019…021, AI-FR-023; AI-NFR-001…006 | OP-AI-01/02/05/06 |
| REQ-AI-02 / AC-28 | AI-FR-004…008, AI-FR-019; AI-NFR-002/007 | OP-AI-02 |
| REQ-AGENT-01 / AC-38 | AI-FR-002/006/007, AI-FR-017…021/023; AI-NFR-001…006/008 | OP-08, OP-AI-03/05/06 |
| REQ-AGENT-02 / AC-39 | AI-FR-010…016, AI-FR-019…024; AI-NFR-001…008 | OP-09, OP-AI-04/05/06 |
| REQ-AGENT-03 / AC-40 | AI-FR-009/019…024; AI-NFR-001…008 | OP-08/09, OP-AI-05/06 |

Các khoảng mã trong bảng là inclusion đầy đủ, không là requirement mới thay ID cũ. UC-AI-03/04/05 tương ứng tên PG-01/02/03 cũ, UC-AI-06 tương ứng INV-01; aliases giữ để các link/API/design đã dùng tên cũ không mất nghĩa.

## 10. Kiểm thử và điều kiện phát hành

| Suite | Phạm vi / yêu cầu |
| --- | --- |
| OP-AI-01 | Hỏi–đáp/giải thích tiền, tài sản, giao dịch, Plan/Goals/mô phỏng; AI-FR-001…003/007/009 |
| OP-AI-02 | Full↔panel↔history↔Plan/Goals continuation, pagination/context/drill/mascot/mask/focus/motion; AI-FR-004…008/019/022 |
| OP-AI-03 | Investigation evidence-dependent, mixed causes/clean case/coverage gaps/Review proposals; AI-FR-017/018/021 |
| OP-AI-04 | Goal-first/Plan-first/actual replanning, clarify/draft/simulate/revise/preview/confirm, manual handoff; AI-FR-010…016/022…024 |
| OP-AI-05 | Cancel/stale/concurrent edit/no-data/timeout/quota/injection/tenant/device/permission, no forbidden writes; AI-FR-019…024, AI-NFR-001…007 |
| OP-AI-06 | Regression capability cũ + Agent comparison/task outcomes/cost/latency; AI-NFR-008 |

Baseline A: manual forms+deterministic simulator+rule insights; Baseline B: single-tool chat routing (capability cũ vẫn là sản phẩm). Đề xuất30 cases cho Agent:10 Plan/Goals,10 điều chỉnh/điều tra,10 safety/failure, có held-out cases và oracle độc lập. Regression hỏi–đáp/history/mascot chạy riêng, không bị thay bằng30 Agent cases.

Mục tiêu đề xuất cần đo/PO review:0 unauthorized active/actual writes và cross-tenant leaks; tất cả số hiển thị khớp Engine/evidence; ≥80% completion trên case đủ dữ liệu; Agent cải thiện≥15 điểm phần trăm completion hoặc giảm≥25% thao tác/thời gian so baseline mạnh nhất mà không giảm correctness/safety. Report sample size/case group/latency/cost. Không đạt lợi ích thì giữ mọi capability/Agent use case trong backlog, cải thiện runtime và dùng fallback minh bạch; không cắt feature để đạt benchmark.

Chưa chạy các suites hợp nhất/eval, chưa chọn real model/provider/terms. Scripted M2 pass chỉ là evidence lịch sử cho đúng capability/fixture từng được thử. [Operational acceptance](../testing/operational-acceptance-plan.md) và [RTM](../execution/realignment-traceability.md) tham chiếu tài liệu này để tránh hai nguồn yêu cầu AI.

## ARCH-09 — Execution detail — kế thừa toàn bộ AI-FR/AI-NFR

Chat/Q&A/history/mascot vẫn có assistant_message job/local port; multi-step Agent giữ cùng conversation. Awaiting_user release lease, answer CAS creates step, 8tools/60sactive/2clarifications cộng dồn qua retries/continuations. Reserve before model/tool egress, unknown charge, deterministic draft tool result lookup; no actual/owner-confirm authority. Provider/model/evals ở ARCH-12, chưa chạy thật.

[Hồ sơ async](../async/README.md), [API004](../contracts/v2-t1-r4/README.md), [DB005](../data/target-t1-async/README.md), [ADR-016](../architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md), [32 ca runtime](../async/acceptance-plan.md).

## ARCH-10 — Android implementation handover

Android owner UI keeps full Plan/Goals/Agent capabilities via scoped owner APIs. Native notification raw/OTP never model input; collector enrollment/keys/retry are deterministic native handlers, not Agent authority.

[Chi tiết Android](../android/README.md) · [Acceptance32 NOT RUN](../android/acceptance-plan.md) · [Báo cáo ARCH10](../architecture/ARCH-10-change-report.md).

## ARCH-11 — Source integration handover

ARCH12 sẽ chốt Agent. Hiện source derived data/forecast/model egress cần entitlement use-specific; raw/OTP/transactionRef/accountRef/provider secrets không gửi model. Thiếu live data trả unavailable và assumptions có nhãn; Agent chỉ Plan–Goals draft/apply được owner xác nhận, không actual.

[Source design](../sources/README.md) · [Acceptance32 NOT RUN](../sources/acceptance-plan.md) · [Báo cáo ARCH11](../architecture/ARCH-11-change-report.md).

## ARCH-12 — Agent runtime handover

AI-SPEC-001 v1.1 tiếp tục nguồn product requirements duy nhất; ART-01…32 là implementation refinements, không thay AI-FR/NFR/41AC. Agent adaptive Plan–Goals/investigation vẫn tools; benefit cần baseline A/B/C và held-out mới. Không drop feature khi chưa đạt.

[Runtime design](../agent/README.md) · [Acceptance32 NOT RUN](../agent/acceptance-plan.md) · [Báo cáo ARCH12](../architecture/ARCH-12-change-report.md).
