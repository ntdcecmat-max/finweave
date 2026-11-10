# RTM v3 — yêu cầu vận hành và trạng thái bằng chứng

07/10/2026 · documentation traceability. [SRS](../requirements/srs.md) có28 inherited+13 new AC; số lượng41 là inventory yêu cầu, không tỷ lệ hoàn thành. RTM cũ giữ lịch sử tại [traceability](traceability.md).

| REQ / AC | Thiết kế / data/API | Test dự kiến / trạng thái |
| --- | --- | --- |
| REQ-AI-01 /27 | AI-SPEC-001: AI-FR-001…007/009/019…021/023; hỏi–đáp/giải thích/history/context/evidence tiếp tục phát triển | OP-AI-01/02/05/06; historical synthetic evidence only, unified suites NOT RUN |
| REQ-AI-02 /28 | AI-SPEC-001: AI-FR-004…008/019; shared chat/panel/history/mascot | OP-AI-02; historical synthetic evidence only, unified suite NOT RUN |
| REQ-SURFACE-01 /29 | HLD + ADR005/006, Identity/Devices/Ops | OP-01; NOT RUN |
| REQ-APK-01 /30 | Android spec/ADR005 | OP-02; NOT RUN |
| REQ-CAPTURE-01 /31 | Android spec, Binding/SupportProfile | OP-02; NOT RUN |
| REQ-INGEST-03 /32 | LLD§2, IngestionReceipt/Evidence, batch API | OP-03; NOT RUN |
| REQ-SYNC-01 /33 | LLD§4, SyncState/Device/Outbox | OP-04; NOT RUN |
| REQ-STOCK-02 /34 | PRD§4, Instrument/Holding/Quote | OP-05; NOT RUN |
| REQ-GOLD-02 /35 | PRD§4, GoldProfile/Quote | OP-05; NOT RUN |
| REQ-PRICE-01 /36 | LLD§3, Deployment§2, RefreshJob | OP-06; NOT RUN |
| REQ-ADMIN-01 /37 | HLD/OpsAudit, admin API | OP-07; NOT RUN |
| REQ-AGENT-01 /38 | AI-SPEC-001: AI-FR-002/006/007/017…021/023; UC-AI-06/INV-01 | OP-08, OP-AI-03/05/06; NOT RUN |
| REQ-AGENT-02 /39 | AI-SPEC-001: AI-FR-010…016/019…024; UC-AI-03/04/05/07, PlanningDraft/PlanGoalLink/Preview | OP-09, OP-AI-04/05/06; NOT RUN |
| REQ-AGENT-03 /40 | AI-SPEC-001: AI-FR-009/019…024 và AI-NFR-001…008; shared runtime/eval | OP-08/09, OP-AI-05/06; NOT RUN |
| REQ-RECOVERY-01 /41 | Deployment/data retention/idempotency/lease | OP-10; NOT RUN |

NFR-16→Android/support OP-02/12; NFR-17→sync OP-04; NFR-18→schedule/quota OP-06; NFR-19/20→privacy/ownership OP-01/02/12; NFR-21→OP-10. NFR-01…15/AC-01…28 tiếp tục theo migration SRS-v3 và OP-11/12; implementation M2 synthetic không evidence real.

Tài liệu liên quan: [PRD](../product/prd.md), [HLD](../architecture/high-level-design.md), [LLD](../architecture/low-level-design.md), [Android](../architecture/android-collector.md), [Deployment](../architecture/deployment-topology.md), [Data](../data/logical-data-model.md), [API](../contracts/operational-api-spec.md), [Agent](../product/ai-agent-specification.md), [test plan](../testing/operational-acceptance-plan.md).

08/10/2026: AI-SPEC-001 là nguồn đặc tả AI duy nhất,24 AI-FR và8 AI-NFR chi tiết hóa5 requirements hệ thống AI đã có; không tăng41 AC hệ thống. AI-NFR mapping chi tiết theo§9 của spec, OP-AI suites theo§10; bộ test Agent không thay regression capability cũ.
