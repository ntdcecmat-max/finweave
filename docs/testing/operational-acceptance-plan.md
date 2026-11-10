# Operational acceptance plan v0.1

07/10/2026 · các suites production/native đích dưới đây vẫn NOT RUN đầy đủ. Rà frontend08/10 đã chạy một phần synthetic tại [báo cáo](frontend-acceptance-report.md) và [UI RTM](../design/ui-requirement-traceability.md); OP01…07 browser không đồng nhất với OP-01…12 production ở bảng này. [SRS](../requirements/srs.md), [RTM](../execution/realignment-traceability.md). Không sửa/chạy frontend implementation trong lượt documentation này; số test M2 cũ chỉ historical evidence.

| Suite | Cases chính / oracle | AC |
| --- | --- | --- |
| OP-01 roles/surfaces | Owner web/mobile same snapshot; cross-user/cross-role direct API denied; admin responses/logs không finance |29/37 |
| OP-02 native APK | Signed install/update, UI closed/screen-off/reboot; deny/revoke/restricted settings, OEM, force-stop, redaction và unsupported |30/31 |
| OP-03 ingest | Một event retry10 lần/timeout-after-commit; two actual equal-amount events; revision/group summary/multi-account/CSV overlap; internal transfer2 legs+fee |32 |
| OP-04 sync | Offline3 receipts→restart→reconnect; no duplicate, stale response ignored; switch owner/revoke không upload queue cũ |33 |
| OP-05 valuation | Stock100×25.000→2.500.000; quote26.000→2.600.000, quantity/cash/income giữ. Gold2 chỉ×8m=16m,0,2 lượng tương đương; incompatible quote/missing reject |34/35 |
| OP-06 schedule | Clients closed7 ngày, daily/manual race, weekend,429, source timeout/partial, Render cold-start, scheduler miss/recovery; quoteAsOf giữ thật |36 |
| OP-07 admin | Disable parser/provider, retry job safe, quotas/metadata/no impersonation, audit actor/reason/result |37 |
| OP-08 Agent investigation | Branching evidence/coverage, mixed causes/case sạch, no hallucination/actual writes; baseline A/B comparison |38/40 |
| OP-09 Agent Plan–Goal | Target→clarification→linked draft→simulate→revise→preview→confirm; cancel/stale/duplicate-confirm/concurrent manual edit; expected versions/history/funded invariant |39/40 |
| OP-10 durability | DB transaction crash trước/sau commit, job lease expiry, missing key/files restore, deletion tombstone, signed APK update/outbox ownership |41 |
| OP-11 inherited finance | Opening/refund/transfer/reversal/missing/version/allocation/actual-plan/simulation invariants theo BR-01…36 |01…28 theo release |
| OP-12 source/security | Source entitlement, notification support evidence, real trust profile tests, logs/backup/client/key/recovery; no real data before selected gate |NFR-07/08/16/19/20/21 |

## Release evidence

### AI hợp nhất: regression cũ + phát triển mới

Nguồn duy nhất [AI-SPEC-001](../product/ai-agent-specification.md),24 AI-FR/8 AI-NFR. Suites dưới đây chi tiết hóa OP-08/09/11 và AC-27/28/38…40, không tự tạo AC hệ thống mới. **Chưa nghiệm thu toàn bộ suites AI hợp nhất**; một phần scripted/draft synthetic đã được chạy theo báo cáo frontend, không thay LLM/provider/eval gates, dù một số capability scripted có evidence lịch sử.

| Suite | Requirements / tiêu chí |
| --- | --- |
| OP-AI-01 | AI-FR-001…003/007/009: giữ hỏi–đáp/giải thích tài chính, Plan/Goal/simulation; oracle/evidence, simple read không bắt multi-step run |
| OP-AI-02 | AI-FR-004…008/019/022, AI-NFR-002/007: full↔panel↔history↔Plan/Goals, pagination, capture context, drill, mascot/error/cancel, mask, focus, motion/mobile |
| OP-AI-03 | AI-FR-017/018/021: evidence-dependent investigation/coverage gaps/mixed causes/clean case và Review proposals |
| OP-AI-04 | AI-FR-010…016/022…024: Goal-first/Plan-first/replan, clarify, linked draft, simulate/compare, revise by chat/form, preview/confirm/cancel/manual handoff |
| OP-AI-05 | AI-FR-019…024, AI-NFR-001…007: stale/concurrency/timeout/quota/denied/injection/tenant/device/cancel; no forbidden write, explicit owner confirmation |
| OP-AI-06 | AI-NFR-008: regression capability cũ tách khỏi30 Agent eval cases; baseline strongest comparison, completion/time/cost/latency/safety |

### Hồ sơ bằng chứng

Ghi commit/build/APK hash, device/source/provider/parser versions, environment/profile, exact steps/expected/actual, source dates, sample counts/latency và defects. Snapshot fixtures/oracles độc lập; không tính user review hay security audit chưa diễn ra. Lỗi critical chặn release, lỗi còn lại được đánh giá rõ.

R1 cần ít nhất một ngân hàng và một ví được xác minh trên device đã công bố; quote providers được cấp quyền; restore đạt; owner UAT. Android synthetic fixture không tự chứng minh bank support. Agent Plan/Goal release cần rubric30 cases và baseline comparison theo [spec](../product/ai-agent-specification.md); pilot metrics không được quảng cáo như user research thị trường.

### UI/UX đặc tả chi tiết — 08/10/2026

[UI traceability và26 nhóm UI-AC](../design/ui-requirement-traceability.md) chi tiết hóa acceptance UI cho41parent AC và AI-SPEC-001. Dùng [UI package](../design/README.md) làm nguồn màn/luồng/states/input/rights; UI-AC không thay OP suites hoặc security/native/restore/model evaluations. Từng UI-AC được phân trạng thái CHECKED_SUBSET/NOT_RUN tại UI RTM; bằng chứng mock cũ giữ nguyên, chưa user UAT hoặc pixel review phần bổ sung.
