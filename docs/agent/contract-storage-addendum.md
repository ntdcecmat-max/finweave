# Contract/storage/consumer addendum

## API005 và native003

[Diff API](../contracts/v2-t1-r5/revision-diff.json): năm Assistant result.mode projections mở enum scripted_mock/deterministic/local_model/hosted_model, Agent toolCalls output0..8, exact header005. Không request/route/actor/auth change. Native bridge003 chỉ đổi bridgeRevision và capabilities.apiRevision tương ứng; typed handler fields/owner broker unchanged. API004/Android package vẫn immutable, current consumers dùng [bundle pin](implementation-bundle.json) và [compatibility matrix](contract-storage-map.json).

Không public planning/paused state mới; question text/slot summary trong existing summary/steps/message projections và questionId, payload structured riêng. API request periods/aliases cần semantic validation server dù wire string rộng; run intent không grant draft writes. `getAgentRunOutput.due` giữ field wire cũ, không dùng nó làm clock/budget authority. Model counters ở private checkpoint, public toolCalls server verified không âm/vượt8.

## DB005 và registered private kinds

Giữ87tables/1001cols/162FK, không migration mới. Existing conversations/messages/agent_runs/planning_drafts/tool_results/simulations/snapshots/jobs/job_attempts/payload_objects có đủ storage khi bổ sung **typed registry** dưới đây. Không generic CRUD, JSON tùy ý hoặc quyền DB toàn cục cho AgentWorker.

| Kind/port | Owner và storage | Quy tắc |
| --- | --- | --- |
| agent_execution_checkpoint | Assistant (AgentWorker); payload_objects private keyed run/message + ordinal/generation | Bounded256KiB; action intent/reservations/model rounds/provider manifest/clarification/result refs, không raw prompt/thinking; semantic versions CAS |
| agent_usage_bucket | Assistant; perworkspace payload_objects private keyed UTC window/root admission refs | Bounded256KiB; used/limit/window/revision/root registry; serialized row lock/content_digest CAS, no recreate expired current window to reset |
| AgentAdmission global counter | Narrow trusted quota broker → **ops_quotas** model-admission aggregate rows | used/limit/reset/cooldown chỉ coarse global data, no workspace IDs/prompts/amounts; không AgentWorker SELECT all Ops rows hoặc sửa limit |
| tool_results | Assistant; existing scoped rows + result_payload_id | Stable server actionID/result refs, private body, same UoW với Planning draft/checkpoint; no provider call_id authority |

AgentAdmission capability là **grant/registry addendum SPECIFIED**, không assertion đã enforce. Thứ tự lock kế thừa workspace→conversation/run→job→sortedquota; perworkspace usage payload locked trước globalcounter, không global lock rồi gọi tenant transaction. Reserve global+tenant+root result+enqueue atomically một DB client, worker/pure Engine không nested pool transactions. Broker chỉ constant-namespaced model-admission rows, rate-limit roles không sửa root grant/limit từ model. Không dùng MarketQuota bucket cho model hoặc auth_rate_buckets làm finance counter. Counter rows hết window được cleanup theo policy; restore unknown usage deny mới tới trusted reset, không tự replenish.

Checkpoint/root counter không bị expiry30d của draft xóa khi pending job còn pin. Payload content expires≤90d (counter window+24h; question theo run validity/explicit stale policy), tombstone/idempotency controls theo auth/backup horizon và existing erasure workflow. Confirmed Plan/Goals phải freeze facts/assumptions/simulation refs không phụ thuộc transient model payload. Message history owner lifecycle đã disclose; private prompt/thinking không persistent. Nếu PoC chứng minh registry/broker không enforce được required uniqueness/retention/grants thì thêm DB revision có migration trước REAL, không tuyên bố json schema là constraint đã chạy.
