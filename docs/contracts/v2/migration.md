# Chuyển đổi các consumers

08/10/2026. **Không sửa frontend trong lượt bàn giao.** [Mapping đầy đủ](consumer-operation-mapping.csv) có từng operation v1/v2/admin và native bridge; [call-site inventory](consumer-calls.csv) ghi file+dòng quan sát. Dynamic proxy `bindServices`, generic hooks và registry actions được đối chiếu qua toàn bộ70 declarations, không suy mọi operation đã được UI gọi hoặc đã test.

R1 bổ sung [AST inventory](../../execution/evidence/FW-HANDOVER-20261008-r1/consumer-ast.json), [field diff](../../execution/evidence/FW-HANDOVER-20261008-r1/consumer-field-differences.json), source symbols và transformation/status từng mapping. `consumer-calls.csv` là literal subset; AST giữ cả indexed/dynamic dispatch và các tham chiếu. `simulatePlanningDraft` trong presentation service là local synthetic function, không phải call tới operation cùng tên. UI ActionForm VND15 digits hẹp hơn target18; local forecast Number không thay exact decimal backend Engine.

| Khoảng cách hiện tại | Đích / cách chuyển |
| --- | --- |
| v1.1.0 logical70 + identity6, typed services/MSW | Giữ operation identity nghiệp vụ; explicit v2 adapter chuyển envelope/version/errors. Không đổi /__mock thành production URL bằng search-replace. Run fixtures và oracle regression từng nghiệp vụ trước thay feature flag |
| v2.0.0 operational18 additive nhưng envelope khác, getState tổng hợp | Cùng chữ2.0.0 chưa chứng minh cùng contract. Target dùng unified operationId/mutation/workspace version; split reads paginated. Khóa version build + contract digest; không hỗ trợ implicit negotiation hoặc fallback v1 |
| getState query thực tế advance mock jobs | Target reads side-effect-free; worker tiến trình durable. UI poll getRun/getRefreshJob/getReceipt; không dựa việc đọc snapshot để chạy task |
| registerExampleDevice/testCollector | Chỉ fixture demo. Native real cần requestDeviceEnrollment/registerDevice proof + ingestNotifications. Không quảng cáo bank supported từ test.finweave.bank/wallet |
| quantity <=6 lẻ/v2 amount cap1e12; v1 <=8 lẻ/18 digits | Target unified decimal <=8/18; native DTO+UI validation phải migrate explicit. Hoạt động UI số nhỏ hiện tại vẫn cần adapter vì shapes amount scalar/value object khác; không dùng Number cho ledger |
| DraftBody một goal bắt buộc, runId bắt buộc | Target bundle0..20 goals+items+links; manual draft runId=null hợp lệ. Convert single goal thành array có ref; preserve conversation/run/draft IDs, base versions, skipMonths; plan-only/multi-goal cần UI work sau |
| answerAgentRun gửi body đầy đủ, trả draft | Target answer text + question/version, trả run continuation. Form chỉnh draft dùng reviseDraft; simulation/preview riêng. Không ép free text thành full financial object hoặc mất clarification state |
| confirmPlanningDraft/holding token, digest không đồng nhất | Bind normalized payload+baseVersions+expiry, confirm explicit key/digest/object versions. Replay immutable original request qua lost ACK; refetch snapshot không áp old ACK lên cache |
| v1 getEvidence rawText, ingestSourceEvidence rawEvidence | Target normalized only; migrate evidence view theo fields/reason/provenance, không gửi OTP/raw text vào server/model. Raw CSV là private bounded import input, không logs; target staging normalized rows |
| v1 Message không refs/mode mới | Add processingKind/runId/draftId trong cùng history, old scripted messages label scripted. Không kho chat mới; giữ captured context/version/evidence và pagination |
| adminGateway chạy trong bộ nhớ, expiry epoch, reasons free text | Separate admin transport/session/MFA, ISO timestamps, reason-code allowlist; preview/confirm/audit v2, metadata only. Không import user store hoặc trả metadata có raw reason financial text |
| NativeStatus/bridge chỉ TypeScript, chưa Kotlin | Validate bridge DTO trong native; local bridge calls không server endpoints. Enrollment/queue key lifecycle/revoke/offline ACK cần device PoC. Native adapter áp v2 batch, source support signed manifest |
| createHolding v1 vẫn nhập name/market tự do; manual quote source | Adapter resolve exact identity/profile và owner confirmation trước preview, không đoán ticker. recordPriceQuote chỉ manual synthetic; provider ingestion internal có entitlement. Chuyển UI về catalogue flows giữ existing quantity/history |
| Reports route | /home/reports redirect /home hiện tại; reports nghiệp vụ vẫn getOverview/getSpendingReport/getPortfolio. Không bỏ API báo cáo vì bỏ navigation riêng |

Thứ tự: backend synthetic implement contract+DB/domain oracle → contract fixture tests và negative auth/concurrency → user adapter read/history rồi financial mutations/import/planning → operational catalogue/jobs/drafts → admin adapter metadata+actions → native DTO/enrollment/outbox/receipt PoC. Mỗi consumer cắt chuyển theo build/version/digest, không release nửa adapter. Không backfill real finance trong migration này.

V1 OpenAPI/examples và các báo cáo Step4–6 là lịch sử exact mock, giữ nguyên. Snapshot quan sát mới nằm trong evidence, không tự regenerate v1 để che drift. Backend CI phải kiểm request/reply bằng canonical source và domain tests độc lập; schema PASS không chứng minh behavior/native/security.
