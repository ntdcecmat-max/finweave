"""Generate Agent DESIGN, not backend/model implementation. No network or dependency changes."""
from pathlib import Path
from copy import deepcopy
import csv, hashlib, json
R=Path(__file__).resolve().parents[2];D=R/'docs/agent';A=R/'docs/contracts/v2-t1-r5'
E=R/'docs/execution/evidence/arch-12-agent-2026-10-09';OLD=R/'docs/execution/evidence/arch-11-sources-2026-10-09'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):
    p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def md(name,s):
    p=D/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(s.strip()+'\n',encoding='utf-8')
def preserve():
    p=E/'preservation-before.json'
    if p.exists():protected=json.loads(p.read_text(encoding='utf-8'))['files']
    else:
        old=json.loads((OLD/'preservation-before.json').read_text(encoding='utf-8'))['files']
        manifest=json.loads((OLD/'artifact-manifest.json').read_text(encoding='utf-8'))
        current=set(json.loads((OLD/'current-documents.json').read_text(encoding='utf-8'))['files'])
        assert all(sha(R/n)==h for n,h in old.items())
        assert all(sha(R/n)==v['sha256'] for n,v in manifest['files'].items())
        protected=dict(old);protected.update({n:v['sha256'] for n,v in manifest['files'].items() if n not in current})
        protected[(OLD/'artifact-manifest.json').relative_to(R).as_posix()]=sha(OLD/'artifact-manifest.json')
        put(p,{'date':'2026-10-09','scope':'Prior frontend/baselines/API004/DB005/security/domain/async/Android/Sources packages/tools/evidence; current overview documents excluded','files':dict(sorted(protected.items()))})
    assert all((R/n).exists() and sha(R/n)==h for n,h in protected.items()),'Protected drift'

def api_revision():
    prior=R/'docs/contracts/v2-t1-r4/openapi.json';old=json.loads(prior.read_text(encoding='utf-8'));api=deepcopy(old)
    modes=[];counter=[]
    def walk(x,path):
        if isinstance(x,dict):
            if x.get('const')=='FW-API-T1-D1J2-004':x['const']='FW-API-T1-D1J2-005'
            if x.get('const')=='scripted_mock':
                x.pop('const');x['enum']=['scripted_mock','deterministic','local_model','hosted_model'];modes.append(path)
            if 'toolCalls' in x.get('properties',{}):
                x['properties']['toolCalls'].update(minimum=0,maximum=8);counter.append(path+'/properties/toolCalls')
            for k,v in x.items():walk(v,path+'/'+k)
        elif isinstance(x,list):
            for i,v in enumerate(x):walk(v,path+'/'+str(i))
    walk(api,'')
    api['info'].update(title='FinWeave API v2 — Agent revision 005 (unreleased)',description='ARCH12 expands five Assistant result.mode projections beyond scripted_mock and bounds Agent toolCalls0..8. Inputs/routes/auth unchanged; revision+hash exact. Model/backend/native/consumers NOT_RUN.')
    api['x-finweave-revision'].update(id='FW-API-T1-D1J2-005',supersedesWorkingTarget='docs/contracts/v2-t1-r4/openapi.json',previousOpenapiSha256=sha(prior))
    put(A/'openapi.json',api);put(A/'schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','components':api['components']})
    changed=[n for n in old['components']['schemas'] if old['components']['schemas'][n]!=api['components']['schemas'][n]]
    put(A/'revision-diff.json',{'previous':'FW-API-T1-D1J2-004','current':'FW-API-T1-D1J2-005','modePaths':modes,'toolCounterPaths':counter,'changedSchemas':changed,'inputSchemasChanged':[],'operationsAdded':[],'authChanges':False,'databaseChanges':False,'wireVersion':'2.0.0 unreleased target; exact revision header005 required'})
    put(A/'revision.json',{'id':'FW-API-T1-D1J2-005','status':'DESIGN_NOT_IMPLEMENTED','operations':len(api['paths']),'schemas':len(api['components']['schemas']),'openapiSha256':sha(A/'openapi.json'),'previousOpenapiSha256':sha(prior)})
    (A/'README.md').write_text('''# API T1 — revision005 / Agent execution modes

09/10/2026 · **FW-API-T1-D1J2-005 — DESIGN SPECIFIED / NOT IMPLEMENTED.**
[OpenAPI](openapi.json), [schemas](schemas.json), [revision/hash](revision.json), [exact diff](revision-diff.json), [consumer delta](consumer-delta.md).

**153 operations / 634 schemas**, body contractVersion2.0.0, header X-FW-Contract-Revision exact005. API004 và các packages/baselines cũ giữ nguyên. Đây là target chưa phát hành, không tự đổi API công khai đã deploy.

`result.mode` trong getConversation/listMessages/sendAssistantMessage/getAssistantMessage/cancelAssistantMessage được mở từ const scripted_mock thành enum scripted_mock/deterministic/local_model/hosted_model. Scripted fixture cũ vẫn hợp lệ; mode mới chỉ khi thực sự chạy đúng adapter. processingKind rule/single_tool/agent/scripted vẫn riêng: cách xử lý khác nơi thực thi. Mode không cấp quyền egress hoặc xác nhận real ready.

Agent toolCalls output được bound integer0..8 ở mọi projection AgentRun; model rounds ở private checkpoint, không thêm wire field. Counter âm/vượt8 là lỗi implementation, không clamp để PASS. Run state vẫn queued/reading/awaiting_user/simulating/draft_ready/completed/partial/failed/cancelled; không thêm planning/paused enum.

Inputs, routes, auth/permissions, money fields, database DB005 giữ nguyên. [Agent architecture](../../agent/README.md) định nghĩa guards/budgets/grounded rendering. Native bridge003 kế thừa bridge002 với exact API005 handshake; consumer chưa migrate, frontend không sửa. Runtime/backend/model/native/security/eval NOT RUN.
''',encoding='utf-8')
    (A/'consumer-delta.md').write_text('''# Consumer delta004→005

User/admin/native/backend pin API005+OpenAPI checksum; không chỉ nhìn body2.0.0. Các153operation actors/security/request schemas giữ nguyên; API004 Assistant payload chỉ scripted_mock không được giả làm model thật.

User web + Android: accept bốn result.mode, giữ processingKind độc lập, render facts/quality/classification từ tool results; legacy mode/scripted history còn hợp lệ. Model unavailable dùng deterministic/manual với nhãn thật. toolCalls0..8; terminal/cancel/stale không bị late response ghi đè. Admin không đọc messages/prompts/finance; Ops health vẫn metadata. Backend serializers/query/history cache update cả năm result projections và Agent counter bounds.

Native: [bridge003](../../agent/native-bridge-003.json) đổi capabilities.apiRevision→005 và bridgeRevision→003 ở các projections; typed methods/owner broker/input handlers giữ nguyên. Không báo bridge002 là compatible005 khi capabilities schema004 chưa đổi. Android docs/bundle cũ immutable, current binding theo [bundle mới](../../agent/implementation-bundle.json).

Source API inputs/quote/source outputs không đổi; Sources policy004 kế thừa semantics với binding005. Security/async/domain permission matrices unchanged; new AgentAdmission registered private payload/quota ports cần grants/transactions runtime test trước enable. Không phải permission đã enforce.
''',encoding='utf-8')
    bridge=json.loads((R/'docs/android/native-bridge-schemas.json').read_text(encoding='utf-8'))
    def bridge_walk(x):
        if isinstance(x,dict):
            for k,v in x.items():
                if v=='FW-API-T1-D1J2-004':x[k]='FW-API-T1-D1J2-005'
                elif v=='FW-NATIVE-BRIDGE-002':x[k]='FW-NATIVE-BRIDGE-003'
                else:bridge_walk(v)
        elif isinstance(x,list):
            for i,v in enumerate(x):
                if v=='FW-API-T1-D1J2-004':x[i]='FW-API-T1-D1J2-005'
                elif v=='FW-NATIVE-BRIDGE-002':x[i]='FW-NATIVE-BRIDGE-003'
                else:bridge_walk(v)
    bridge_walk(bridge);bridge['$id']='https://schemas.finweave.invalid/native-bridge-003';put(D/'native-bridge-003.json',bridge)
    return api

def main():
    preserve();api=api_revision();s=api['components']['schemas']
    md('README.md','''
# Agent runtime design — ARCH-12

**FW-AGENT-DESIGN-001 · 09/10/2026 · DESIGN SPECIFIED / REAL MODEL NOT SELECTED / NOT RUN.**
Đây là **LLD/refinement** của [AI-SPEC-001](../product/ai-agent-specification.md), không một đặc tả sản phẩm AI cạnh tranh. Giữ AI-FR-001…024, AI-NFR-001…008, AC-27/28/38…40 và toàn bộ41 AC: hỏi–đáp, chat/history/panel/linh vật, manual planner và Agent Plan–Goals/điều tra đều phải triển khai.

Agent vẫn dùng tool calling. Khác biệt là vòng lặp chọn câu hỏi, bằng chứng hoặc phương án tiếp theo dựa vào kết quả thực, trong giới hạn server kiểm soát. Không có khẳng định lập trình cố định “không thể làm”; giá trị Agent cần đo bằng kết quả so với baseline mạnh, không số lượng tool calls.

| Hồ sơ | Nội dung |
| --- | --- |
| [Vai trò và workflows](roles-and-workflows.md) | Simple assistant, PG-01/02/03, INV-01 và trace mẫu |
| [Architecture/options](architecture-and-options.md) | Orchestrator TS/J2/Engine, local model candidate, optional cloud |
| [Execution/budgets](execution-and-recovery.md) | Decisions/state/lease/action journal/retry/cancel/admission |
| [Tools/context](tools-and-context.md) | 13 capabilities, frozen facts, privacy/injection và grounded rendering |
| [Contract/storage](contract-storage-addendum.md) | API005153ops/634schemas, DB005 unchanged, bridge003, quota/private registry |
| [Provider/model](model-provider-design.md) | Ollama/Qwen3-4B PoC, pinned artifacts/cost/egress/capability gates |
| [Evaluation](evaluation-plan.md) | 30 public challenge cases, regression12, held-out protocol/baselines/gates |
| [Acceptance](acceptance-plan.md) | 32 runtime cases NOT RUN và mapping AI-FR/NFR |

[Policy](agent-policy.json) · [Registry](tool-registry.json) · [Decision schemas](decision-schemas.json) · [Consumer/storage map](contract-storage-map.json) · [Traceability](requirement-traceability.json) · [Research](research-sources.json) · [Bundle](implementation-bundle.json).

API004 phát hiện mode=scripted_mock const ở năm Assistant projections, không thể dùng làm nhãn model thật. Tạo **[API005](../contracts/v2-t1-r5/README.md)**; [DB00587bảng/1001cột](../data/target-t1-async/README.md) giữ nguyên, **native bridge003** đổi handshake exact005. API005 không thêm endpoint/request field hoặc quyền. r1/r2, API004, các package ARCH06–11 và frontend immutable trong task này. Runtime consumers còn cần adapters/migration implementation.

Ưu tiên local PoC **Ollama + Qwen3-4B**, chưa pin GGUF/quantization/digest/runtime/model template hoặc benchmark; không tải/chạy/gọi model. Scripted và deterministic/manual baseline luôn còn. Không ngầm dùng cloud/paid/external model hoặc biến model lỗi thành lý do bỏ feature.
''')
    md('roles-and-workflows.md','''
# Vai trò thực chất và workflows

## Khi nào dùng Agent

Câu hỏi “Tôi có bao nhiêu tiền?”, xem tiến độ Goal, daily price và parse notification là read/Engine/rule jobs phù hợp luồng cố định. Giữ câu trả lời nhanh và đầy đủ context; không bắt mọi câu hỏi tạo AgentRun. Task mở có nhiều ràng buộc hoặc chưa biết nguyên nhân mới cần Agent chọn bước tiếp theo. Router server xác nhận mode/intent và scope; model classification là gợi ý, không quyền tự chuyển sang draft/active changes.

| Hành trình kế thừa | Agent làm gì khác một nút trigger | Đầu ra/authority |
| --- | --- | --- |
| PG-01 Goal-first | Đọc khả năng hiện tại/coverage/competing goals; hỏi reserve/deadline nếu thiếu; thử phương án đóng góp hoặc thay lịch; chọn lại theo violations | Goal+Plan draft có assumptions/evidence, không tăng funded |
| PG-02 Plan-first | Chuyển ý định mở thành items/constraints; đề xuất Goals hợp lý; xử lý tháng bỏ đóng góp, thu nhập bất định và ưu tiên mâu thuẫn | Plan draft, optional Goals/links; không ép item nào cũng gắn Goal |
| PG-03 actual replanning | Đọc variance và phân biệt chi tiêu thật/transfer/valuation/coverage; thử amendments giữ reserve/những Goal khác; giải thích trade-offs | Amendment draft, active versions giữ tới owner confirm |
| INV-01 investigation | Chọn kiểm coverage trước hoặc split cashflow/valuation, rồi evidence/transfer/duplicate/fee/refund theo quan sát; tìm cả phản chứng | Conclusion/partial và Review proposal, không sửa actual |

Ví dụ giả: owner muốn Goal60triệu/12tháng, có Plan sửa nhà và cần reserve. Sau read thấy reserve chưa xác nhận → hỏi. Owner trả lời thì Engine compare phương án; nếu tháng12 bỏ đóng góp thì Agent đổi timeline, không chỉ cộng bình quân một lần. Thiếu cash capacity không được tự thêm income/bán cổ phiếu/giảm reserve hoặc tăng lợi suất. Deadline/target là ràng buộc cứng cho tới owner chọn trade-off; profile growth không là bảo đảm lợi nhuận.

## Trace bounded, không diễn kịch Agent

Một trace PG-01 có thể là getPlanningContext → askClarification → compareScenarios(tối đa3candidates, cùng snapshot/constraints) → proposePlanningDraft → finishRun. Nếu phải sửa sau violations thì amendPlanningDraft → simulatePlan → finishRun, tổng không vượt8acceptedactions. Đây là trace minh họa, runtime chọn bước theo evidence, không bắt làm đủ để “trông thông minh”. Simple case không hỏi lại reserve đã xác nhận; clean investigation có thể dừng sớm. Budget hết trả partial và draft/evidence hiện có, không vòng lặp vô hạn.

Compare là pure bounded batch trong Engine (không recursive model/tool), một call phải charge toàn compute slice/bytes/variants và tất cả underlying domain reads. Không giấu nhiều egress/tool calls trong helper để né budget. Heavy stochastic forecast dùng ForecastWorker đã có, không poll/spawn vô hạn trong Agent60s; nếu vượt active budget trả partial/deep-link existing forecast flow, vẫn giữ feature full forecast.

Owner xem/chỉnh/discard draft bằng form hoặc chat cùng conversation. Preview/confirm do **owner service riêng**, atomic Plan+Goals+links; chat “đồng ý” không confirm; không tạo actual, chuyển tiền hoặc đặt lệnh chứng khoán. Agent không gọi allocateGoal/markGoalAchieved/confirmPlanningDraft/postDraft. Manual form/simulator và các capability cũ vẫn hoạt động khi model unavailable hoặc quota hết; giữ Agent use cases trong backlog để cải thiện, không bỏ feature khi eval chưa đạt.
''')
    md('architecture-and-options.md','''
# Kiến trúc và phương án

Chọn **custom TypeScript orchestrator nhỏ trong module Assistant/Agent**, chạy AgentWorker P2 và J2 Postgres của ARCH09. Dùng state/action validators, ContextBuilder, ToolGateway, ModelAdapter, GroundedRenderer, Engine ports, private journal và admission broker. Không framework thứ hai sở hữu queue, financial truth hoặc conversation. Đây là thiết kế, chưa package/runtime.

| Option | Trade-off | Disposition |
| --- | --- | --- |
| O1 Typed TS state loop + existing J2 | Ít phụ thuộc; quyền/replay/budget gắn cùng UoW; phải tự kiểm checkpoint/cancel/trace | **Chốt hướng orchestration** theo stack đã chọn |
| O2 LangGraph/agent framework | Hữu ích graph lớn; thêm checkpoint/retry semantics và integration complexity; không tự thay J2 hoặc grants | Optional review nếu O1 thật sự khó bảo trì, chưa cài/chọn |
| O3 Hosted agent execution | Managed loop/hosting; thêm cost/egress/retention/trust và tool permissions | Không baseline; cần explicit provider/security/budget approval |

Flow: owner API→frozen context + message/run + J2 enqueue (atomic)→AgentWorker ticket→ModelAdapter single decision→ToolGateway auth/schema/live fence→Engine read/pure simulate hoặc draft-only command→private checkpoint/tool result→next decision→server-rendered reply. Không DB transaction giữ trong lúc chờ model; all mutations và checkpoints dưới current generation/recovery epoch. Model service không DB/token/service credentials/Internet tools; Ollama inference process chỉ weights và sanitized request, không browser truy cập trực tiếp.

I0 local model loopback ở cùng trusted host. I1 chỉ co-host inference trên private network nếu RAM/CPU/quota/backup/latency đo đạt; không hứa Oracle free VM đủ chạy cùng PostgreSQL/workers/model. Backend cloud không thể gọi localhost máy owner; remote host/tunnel cần T1 service auth/network review riêng, chưa chọn hoặc mở port. Một process inference concurrent1 khởi điểm, admission fair perworkspace, queue wait hiển thị; không chiếm API loop hoặc chặn ForecastWorker.

Chọn hướng model PoC local **Ollama/Qwen3-4B** để kiểm chất lượng và chi phí trước. Exact runtime/weights/tokenizer/chat template/quantization/license/digest pin trước test. Hosted optional adapter giữ cùng capabilities và server guards; không tự fallback hoặc dùng API key/cost của owner nếu chưa có quyền. Model card/tool support không chứng minh tiếng Việt, tool correctness, RAM hay60s đạt.
''')
    md('execution-and-recovery.md','''
# Execution, budgets và recovery

## Action loop và state

Kế thừa API005 states queued/reading/awaiting_user/simulating/draft_ready/completed/partial/failed/cancelled. “Planning” là bước nội bộ dưới reading, không enum mới. “Pause vì budget/stale” là partial + safe reason; awaiting_user chỉ khi thật sự có questionId/structured question. Simple messages có state processing/completed/failed/cancelled, không AgentRun giả chỉ để vừa enum.

Mỗi model round sinh đúng một decision(capability,arguments) schema; model không chỉ định owner/workspace/run/nonce/epoch/token/URL. Server lấy captured principal/context và stable server actionOrdinal/ID. Tất cả13capabilities, gồm askClarification/finishRun, charge vào **8 accepted actions/tool_calls**; invalid/forbidden decisions không execute nhưng model round vẫn charged. Max12model rounds, repair tối đa1 cho một invalid model response, 60s active cộng dồn model/tool/validation work, tối đa2clarifications. Các limits model/prompt là starting config chưa benchmark, không SLO; không reset sau resume/retry/restart. Token/byte limits còn phải enforce thực, không cắt snapshot/constraints im lặng.

Active budget loại queue wait/user wait nhưng gồm cold start/model load/inference/parse/tool compute. Monotonic supervisor time; reserve remaining slice trước egress, network timeout≤slice/cap25s. Crash/unknown charge full reservation; chỉ observed completion settle unused delta một lần đúng action/generation. User wait release lease, question immutable record trong checkpoint; answerAgentRun owner/question/expectedVersion/idempotency CAS consume → enqueue đúng một continuation. Authority/schema/rules/rights/versions kiểm lại; stale thì partial/re-preview/newrun, không đổi original snapshot ngầm. Run mới cần owner action và admission mới, không recursive auto restart để né8/60s.

## Journal và at-least-once

Private action intent allocated/reserved→sent_unknown→observed/result_committed theo current J2 ticket. Model response chưa durable sau crash được discard/re-call dưới budget còn; không giả provider exactly-once hoặc gọi lại miễn phí. Pure reads có thể retry bounded; draft tool dùng persisted server action ID + normalized args digest + deterministic result ref và same UoW: draft/result/checkpoint committed cùng nhau. Retry lookup trả committed result; changed args cùng actionId conflict. Không dùng model/provider call_id làm idempotency authority. Receipt/checkpoint content private, ops logs chỉ safe code/latency buckets.

Cancel terminal CAS fences unpublished reply/next call, best effort abort in-flight inference không hứa hoàn tiền/secure erase provider RAM. Tool draft đã commit có thể còn draft, không tự apply/delete; UI phân biệt cancel run và discard draft. Late model reply không revive cancelled run hoặc ghi owner mới. Revoke/logout/delete/restore invalidates epochs; witness áp trước data serving, old jobs/messages/drafts không auto replay. Awaiting question content mất/expired thì partial có reason và yêu cầu owner bắt đầu rõ, không đoán answer.

## Admission và toàn hệ thống

Starting cap10model-backed interactions/workspace/UTCday,50global/UTCday, concurrent inference1. Admission identity=(root message hoặc run, UTCday). Continuation không tạo logical run mới hoặc reset8/60s, cùng ngày chỉ charge một lần. **Cross-day queue/resume phải reserve current-day capacity trước model egress**, không dùng reservation ngày cũ vượt daily quota; root checkpoint giữ admission refs sau bucket expiry. Simple deterministic/scripted không tính model-admission, nhưng vẫn request rate limits. Nếu message nối AgentRun thì cùng root reference, không charge hai lần. Private perworkspace usage bucket + global coarse aggregate counter reserve cùng transaction admission/message-or-run/enqueue, restore không reset để vượt cap. Cần scope/time-window identity, DB-clock midnight, row-lock/CAS và idempotency; chỉ count trong-memory hoặc count rows rồi enqueue không đủ concurrency safe.

Model rounds/output tokens/service allocations còn per-root budget; hosted cost cap=0 khi chưa được duyệt. Quota/budget unknown sau crash/restore không refund tự động. Breaker5transient failures trong5min → pause inference60s khởi điểm, half-open1probe không dữ liệu thật nếu mất consent; model unavailable dùng deterministic/manual và nhãn thật. Các giá trị phải PoC, không vendor guarantees. [Storage broker](contract-storage-addendum.md) không tự có grants chỉ vì có tài liệu.
''')
    md('tools-and-context.md','''
# Tool gateway, context và kết quả có căn cứ

## Registry và quyền

Worker gọi **local application ports** dưới executeAgentStep ticket và live captured-owner authorization, không gọi owner HTTP endpoints bằng service token hoặc mượn bearer của owner. API operation names trong registry là mapping request/result semantics; worker authority là narrow job capability, không impersonation. Planning module thực thi draft commands, Assistant/Agent orchestrator không có direct arbitrary Planning table write. Investigation intent không có draft/pure planning tools; simple message chỉ read/control subset. Confirmed hard constraints được gateway/Engine kiểm độc lập model; candidate vi phạm phải marked infeasible/unapproved trade-off, không âm thầm sửa để pass.

[13capabilities](tool-registry.json) là application ports, không bộ HTTP endpoints mới. Read ports gọi authorized query/snapshot/Engine và paging hiện hành; pure compare/simulate không ghi actual; propose/amend chỉ planning_drafts. ask/finish là control actions được tính budget. Legacy logical names getPlans/getGoals/getAllocations resolve getPlanningContext; không xóa capability cũ. Không generic invoke API, SQL, arbitrary HTTP/shell/browser/email/payment/trade, Ops/admin, collector keys hoặc owner confirm/active mutation. Prompt/user/model output không nâng quyền.

Mọi input/output strict server schema, nested object authorization và snapshot dependency closure. Model chỉ thấy opaque aliases account/goal/event; Gateway resolve lại workspace/object/version/rights, alias khác scope/stale reject. Không pass `ownerId` do model gửi. Read page max50rows/action và evidence refs max20/action là initial context caps, phải báo truncated/nextCursor và charge next action; không kết luận đầy đủ từ subset. Goal allocations snapshot phải bao gồm mọi competing allocations; quá cap không truncate rồi simulate “đủ tiền”, chuyển partial/manual hoặc tighten scope có owner.

propose/amend body theo exact API createPlanningDraft/reviseDraft body (max20goals/100items/100links); scopes server resolve, uniqueness/date/positive amounts/bounds/reserve/baseline consistency validate bằng Engine. Model đề xuất numbers trong draft là **proposed assumptions**, không factual actual; body không tự markfunded/achieved. compareScenarios tối đa3candidate bodies, pure bounded Engine cùng frozen snapshot/constraints; lưu simulation refs đúng base/current drafts, amended revision invalidate cũ. Extended MonteCarlo có existing forecast flow; không hidden recursive tool/egress dưới compare.

## Context và injection

ContextBuilder frozen closure: authorized balances/holdings/quote quality/coverage, relevant Plan/Goals + mọi reservations cạnh tranh, source/model/Engine versions, confirmed constraints và timeline. Only minimum authorized facts, no raw notifications/OTP/auth secret/account number/ref/merchant memo/transactionRef/source error body/system debug. Market-derived data gửi model cần đúng source license/use; local cũng là non-display/derived use, external cần thêm externalModel grant. T1 inference host operator thấy prompt in memory; không anti-root guarantee.

Chat/user goal labels/history/evidence/model output đều untrusted data. Free text intake bounded và privacy-screen trước persistence/model; suspected secret/raw bank text → không egress, redacted history placeholder + hỏi user rephrase. Screening không phải bằng chứng nhận biết mọi PII; model context còn phải allowlist structured facts và sanitized/pseudonymized intent. Chỉ field cần thiết được truyền; không nhét toàn history hoặc bank evidence vào system prompt. No downloadable executable instructions/tools hoặc model-selected endpoint. Injection vào tên Goal/citation yêu cầu bỏ rule hoặc gọi confirm đều bị gateway chặn, không cần model tự nhớ.

## Grounding/mask/history

Model trả finishRun gồm conclusion codes + evidenceRefs + assumptionRefs + proposalRefs, không model-authored factual amount string. **GroundedRenderer** lấy numeric facts từ ToolResult/Engine snapshot, diễn giải bằng clauses/templates đã versioned. Mọi fact phải resolve được evidence/classification(actual/planned/simulated/unknown)/quality/asOf/rights; invalid ref không được stringify thành kết quả. Không dùng regex nhận diện digits như bằng chứng mọi câu nói khớp số — số viết bằng chữ vẫn có thể bịa. Model free prose không đi thẳng thành factual answer; names/assumptions ghi nhãn đề xuất, không đảm bảo đầu tư.

Wire text/summary≤500chars là safe server-rendered summary không finance literals để masking không leak qua narrative; số/chi tiết nằm trong result metrics/drill/evidence hoặc draft fields có classification và mask theo UI. Full↔panel↔history cùng message/context/result identity; không tạo second chat transcript. Privacy mode phải mask numeric prose/cards/history/accessibility, source/model state thật không animation giả. History deleted/expired refs→unavailable, không đọc current snapshot thay history; prompt retention không được dựa vào model cloud store làm authority.

Không lưu/hiển thị chain-of-thought/thinking tokens. Reasoning audit là action name/status/refs, assumptions, constraint violations và concise explanation codes; model trace/SDK/logger phải scrub/disable prompt/body/token dumps. Chat history theo owner history lifecycle đã disclose/consent trước REAL; typed execution payload TTL90d hoặc nguồn license ngắn hơn, draft chưa confirm30d, confirmed domain history owner lifecycle, erasure/backup35d theo ARCH07. Không copy full prompts/private tool conversation vào một kho90d thứ hai.
''')
    md('contract-storage-addendum.md','''
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
''')
    md('model-provider-design.md','''
# Model/provider và khả năng chạy thực tế

| Profile | Chọn/hạn chế |
| --- | --- |
| Scripted synthetic | Chốt baseline demo/regression, result.mode=scripted_mock; không giả là Agent thật |
| Deterministic tools/manual | Chốt luôn còn, mode=deterministic khi không model; numeric Engine authority |
| Ollama local + Qwen3-4B | **Ứng viên PoC ưu tiên**, mode=local_model chỉ sau actual call; chưa exact pin/benchmark/enable |
| Hosted optional | Không chọn model/tài khoản/API plan hoặc paid quota; mode=hosted_model chỉ sau rights/privacy/budget và actual execution |

Ollama docs có tool loop và JSON-schema structured outputs; Qwen3-4B card/license là Apache2.0 tại09/10, không chứng minh runtime artifact cụ thể/chat template/quantization/tiếng Việt phù hợp. [Ollama tools](https://docs.ollama.com/capabilities/tool-calling), [structured](https://docs.ollama.com/capabilities/structured-outputs), [Qwen card](https://huggingface.co/Qwen/Qwen3-4B). **Ollama Cloud hiện không hỗ trợ structured outputs theo docs đã đọc**, không đồng nhất local và cloud. Không dùng mutable model tag làm lockfile.

Local adapter candidate POST/api/chat non-stream, schema-constrained single Decision JSON, think=false khi model/runtime hỗ trợ; không assumption format+native tools combination hoạt động. Tool execution luôn server. Native tool-calling adapter khác phải normalize một action, no automatic execute từ SDK. Exact model/tool schema compatibility/response sizes/refusal/truncation phải test. Model supports thinking không là quyền lưu thinking; parse chọn content field, không spill raw response/thinking ra history/logger khi JSON lỗi.

Khởi điểm context8192tokens, max output1024tokens, sanitized prompt≤48KiB, response≤64KiB, concurrent1, generation timeout≤25s và remaining active budget. Đây là **config đề xuất cần PoC**; tokenizer/KV cache/model RAM/cold start/CPU/GPU/ARM64 trên I0/I1 chưa đo. Input/output bytes và tokenizer estimate phải kiểm trước request, giữ room system+decision schema+answer; vượt cap trả context-too-large/partial, không âm thầm drop competing allocations. Small model chưa đạt thì tune/quantization/model alternative được benchmark trong budget, không auto paid fallback.

Local-only config disable Ollama cloud (OLLAMA_NO_CLOUD=1 theo FAQ), loopback/private ACL, no public11434 hoặc direct browser access. Agent process chỉ inference route, không pull/delete/create model/admin endpoints. Model installation là deployment step có pinned origin/checksum/license review, không runtime request từ model. Cùng-host T1 operator vẫn có thể đọc RAM; local inference không hóa đơn API nhưng dùng CPU/RAM/điện và có thể không đáp ứng latency. [Ollama FAQ](https://docs.ollama.com/faq).

Hosted OpenAI adapter nếu được chọn sau: official function-calling strict schema, additionalProperties=false/all fields required with nullable where appropriate, parallel_tool_calls=false, application vẫn validate auth/semantic constraints. Strict structure **không bảo đảm financial correctness/quyền**; provider refusal/unknown response là explicit failure, không tool success. [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling). API schema subset phải compile per-tool, không pass nguyên private checkpoint JSONschema như provider-supported. Không dùng hosted agent state/traces/memory làm DB authority; retention/source/model egress terms còn phải kiểm trước real, chưa claim ZDR hoặc miễn phí.

Provider manifest bắt buộc runtimeVersion/imageDigest/model origin+revision+weightsDigest+quantization/tokenizer/chatTemplateDigest/licenseDigest/promptVersion+hash/toolRegistryHash/decisionSchemaHash/EngineVersion/timeout/context caps. Hiện missing artifact pins nên modelEnabled=false. Registry/preflight metadata/public docs không thay model smoke tests, safety eval hoặc latency evidence. Không tải model, sửa dependencies, mở network service hoặc gọi API ở lượt này.
''')
    policy={'id':'FW-AGENT-POLICY-001','date':'2026-10-09','status':'DESIGN_ONLY','apiRevision':'FW-API-T1-D1J2-005','databaseRevision':'FW-PHYS-T1-ASYNC-005','nativeBridgeRevision':'FW-NATIVE-BRIDGE-003',
      'productSpec':'AI-SPEC-001','parentAcCount':41,'modelEnabled':False,'externalBudgetVnd':0,'hostedFallback':False,
      'budget':{'acceptedActions':8,'activeMillis':60000,'clarifications':2,'modelRounds':12,'repairPerResponse':1,'resetOnResume':False,'askAndFinishCountAsActions':True},
      'modelCandidate':{'runtime':'Ollama local-only','model':'Qwen/Qwen3-4B','runtimePin':None,'weightsDigest':None,'quantization':None,'tokenizerDigest':None,'chatTemplateDigest':None,'license':'Apache-2.0 candidate card, actual artifact review pending','benchmark':'NOT_RUN'},
      'limits':{'contextTokens':8192,'outputTokens':1024,'promptBytes':49152,'responseBytes':65536,'inferenceConcurrency':1,'generationTimeoutSeconds':25,'compareCandidates':3,'readPageSize':50,'evidenceRefs':20},
      'admission':{'workspaceModelInteractionsPerUtcDay':10,'globalPerUtcDay':50,'continuationNewAdmission':False,'unit':'ROOT_ID_AND_UTC_DAY','dailyReservationRecheckedOnResume':True,'unknownUsage':'DENY_UNTIL_TRUSTED_RESET'},
      'forbidden':['confirmPlanningDraft','postDraft','recordIncome','recordExpense','recordTransfer','allocateGoal','markGoalAchieved','executeSql','fetchUrl','sendEmail','trade','payment','impersonate'],
      'authority':{'financialCalculations':'ENGINE_ONLY','actualWrites':False,'activePlanGoalWrites':False,'draftWrites':True,'ownerConfirmSeparate':True},
      'privacy':{'rawNotificationToModel':False,'otpToModel':False,'credentialsToModel':False,'accountRefToModel':False,'transactionRefToModel':False,'thinkingPersisted':False,'rawModelReplyPublished':False,'unverifiedNumericNarrative':False},
      'runtime':'NOT_RUN'}
    put(D/'agent-policy.json',policy)
    caps=[
      ('getFinancialSnapshot','read',['getPresentationSnapshot','getPortfolio'],'Authorized frozen financial facts; no invented totals'),
      ('getCoverage','read',['listCoverage','listCoverageGaps'],'Bounded explicit completeness; pages charge actions'),
      ('getTransactions','read',['listTransactions'],'Authorized filters only, no memo/ref to model'),
      ('getEvidence','read',['getEvidence'],'Sanitized structured evidence; original refs stay server'),
      ('getPlanningContext','read',['listPlanItems','listGoals','getGoalProgress'],'Full competing reservation closure via local scoped query ports or partial, never truncated as complete'),
      ('getPlanActualVariance','read',[],'Local Engine/query port over frozen authorized Plan/actual lineage'),
      ('simulatePlan','pure',['simulatePlanningDraft'],'Pure Engine; live draft expectedVersion or frozen candidate input'),
      ('compareScenarios','pure',[],'Local pure bounded Engine batch up to3 candidates, no recursive egress'),
      ('proposePlanningDraft','draft',['createPlanningDraft'],'Same UoW draft + tool result + action checkpoint, no owner confirm'),
      ('amendPlanningDraft','draft',['reviseDraft'],'Expected draft/context versions, no actual/active writes'),
      ('proposeReviewActions','proposal',[],'Private recommendations + evidence only; no Review merge/post'),
      ('askClarification','control',[],'CAS question plus release lease, max2, counted action'),
      ('finishRun','control',[],'Grounded conclusion refs rendered by server; counted action'),
    ]
    put(D/'tool-registry.json',{'id':'FW-AGENT-TOOLS-001','allActionsChargeBudget':True,'capabilities':[{'name':n,'kind':k,'apiOperations':ops,'intents':['goal','plan'] if k in ('draft','pure') else ['goal','plan','investigation'],'portScope':'SERVER_CAPTURED_OWNER_FROZEN_CONTEXT','actualAuthority':False,'requiresLiveAuthorization':True,'rule':rule} for n,k,ops,rule in caps],
      'legacyAliases':{'getPlans':'getPlanningContext','getGoals':'getPlanningContext','getAllocations':'getPlanningContext','simulatePlanningDraft':'simulatePlan','compareDraftOptions':'compareScenarios','createGoalDraft':'proposePlanningDraft','createPlanDraft':'proposePlanningDraft','updatePlanningDraft':'amendPlanningDraft'},'runtime':'NOT_RUN'})
    # Private tool decision definitions reuse exact API draft body; provider adapter compiles a supported subset.
    ident={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'};refs={'type':'array','items':ident,'maxItems':20,'uniqueItems':True}
    empty={'type':'object','properties':{},'required':[],'additionalProperties':False}
    arguments={n:deepcopy(empty) for n,_,_,_ in caps}
    arguments['getTransactions']={'type':'object','properties':{'cursor':{'type':['string','null'],'maxLength':1024},'kind':{'enum':['all','income','expense','transfer','refund','investment','unknown']}},'required':['cursor','kind'],'additionalProperties':False}
    arguments['getEvidence']={'type':'object','properties':{'evidenceRefs':refs},'required':['evidenceRefs'],'additionalProperties':False}
    arguments['getCoverage']={'type':'object','properties':{'cursor':{'type':['string','null'],'maxLength':1024}},'required':['cursor'],'additionalProperties':False}
    arguments['simulatePlan']={'type':'object','properties':{'draftRef':ident,'expectedVersion':{'type':'integer','minimum':0}},'required':['draftRef','expectedVersion'],'additionalProperties':False}
    body=deepcopy(s['createPlanningDraftInput']['properties']['body'])
    arguments['compareScenarios']={'type':'object','properties':{'candidates':{'type':'array','items':body,'minItems':1,'maxItems':3}},'required':['candidates'],'additionalProperties':False}
    arguments['proposePlanningDraft']={'type':'object','properties':{'body':body},'required':['body'],'additionalProperties':False}
    arguments['amendPlanningDraft']={'type':'object','properties':{'draftRef':ident,'expectedVersion':{'type':'integer','minimum':0},'body':body},'required':['draftRef','expectedVersion','body'],'additionalProperties':False}
    arguments['proposeReviewActions']={'type':'object','properties':{'evidenceRefs':refs,'reasonCodes':{'type':'array','items':{'enum':['POSSIBLE_DUPLICATE','TRANSFER_UNRESOLVED','COVERAGE_GAP','REFUND_LINEAGE_MISSING','FEE_AMBIGUOUS']},'minItems':1,'maxItems':5,'uniqueItems':True}},'required':['evidenceRefs','reasonCodes'],'additionalProperties':False}
    arguments['askClarification']={'type':'object','properties':{'missingFields':{'type':'array','items':{'enum':['target','deadline','reserve','priorities','income_assumptions','skip_months']},'minItems':1,'maxItems':6,'uniqueItems':True}},'required':['missingFields'],'additionalProperties':False}
    arguments['finishRun']={'type':'object','properties':{'conclusion':{'enum':['FACTS_EXPLAINED','DRAFT_READY','INFEASIBLE','NEEDS_REVIEW','PARTIAL','NO_DATA']},'evidenceRefs':refs,'assumptionRefs':refs,'proposalRefs':refs},'required':['conclusion','evidenceRefs','assumptionRefs','proposalRefs'],'additionalProperties':False}
    defs={n+'Args':v for n,v in arguments.items()}
    defs['Decision']={'oneOf':[{'type':'object','properties':{'capability':{'const':n},'arguments':{'$ref':'#/$defs/'+n+'Args'}},'required':['capability','arguments'],'additionalProperties':False} for n,_,_,_ in caps]}
    put(D/'decision-schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://schemas.finweave.invalid/agent-decisions-001','$defs':defs,'providerCompatibility':'NOT_TESTED; compile per-tool supported schema, local canonical server validation always required'})
    maps=[('startAgentRun',['agent_runs','jobs']),('answerAgentRun',['agent_runs','jobs']),('cancelAgentRun',['agent_runs','jobs']),('executeAgentStep',['agent_runs','tool_results','payload_objects','planning_drafts']),('sendAssistantMessage',['messages','jobs']),('getAssistantMessage',['messages','tool_results']),('getConversation',['conversations','messages']),('listMessages',['messages']),('createPlanningDraft',['planning_drafts']),('reviseDraft',['planning_drafts']),('simulatePlanningDraft',['planning_drafts','simulations']),('previewPlanningDraft',['planning_drafts']),('confirmPlanningDraft',['planning_drafts','planning_revisions','goals'])]
    put(D/'contract-storage-map.json',{'apiRevision':policy['apiRevision'],'databaseRevision':policy['databaseRevision'],'nativeBridgeRevision':policy['nativeBridgeRevision'],'postgresChanges':False,'operations':[{'operationId':op,'tables':tables,'agentCapabilityMayInvoke':op in {x for _,kind,ops,_ in caps for x in ops} and op!='confirmPlanningDraft'} for op,tables in maps],
      'privateKinds':[{'name':'agent_execution_checkpoint','owner':'Assistant','table':'payload_objects','maxBytes':262144,'genericCrud':False},{'name':'agent_usage_bucket','owner':'Assistant','table':'payload_objects','maxBytes':262144,'genericCrud':False}],
      'globalAdmission':{'table':'ops_quotas','capability':'AgentAdmission narrow aggregate broker','namespaced':True,'workspaceIdsInGlobalRows':False,'runtime':'NOT_RUN'},
      'baseCompatibility':{'asyncApi':'004','sourceApi':'004','securityApi':'002','currentApi':'005','routeActorsChanged':False,'requestSchemasChanged':False,'databaseChanged':False,'oldAndroidBridge':'002 exactAPI004','currentAndroidBridge':'003 exactAPI005'},'consumerMigration':'NOT_IMPLEMENTED'})
    # Primary-source notes short, no external calls/model installation.
    research=[('OLLAMA-TOOLS','https://docs.ollama.com/capabilities/tool-calling','Application executes tools/loop; docs not model quality proof.'),('OLLAMA-STRUCTURED','https://docs.ollama.com/capabilities/structured-outputs','Local JSON schema; cloud currently unsupported, exact model/runtime semantics need test.'),('OLLAMA-CHAT','https://docs.ollama.com/api/chat','Chat options/content/thinking/usage; no assumption all models support identical fields.'),('OLLAMA-FAQ','https://docs.ollama.com/faq','Local-only/cloud-disable and loopback documented; resource/capability must measure.'),('QWEN-CARD','https://huggingface.co/Qwen/Qwen3-4B','4B candidate with Apache2.0 card; not installed/artifact-pinned or VN benchmarked.'),('QWEN-LICENSE','https://huggingface.co/Qwen/Qwen3-4B/blob/main/LICENSE','License file read, actual deployed weight/runtime derivative licenses must pin.'),('OPENAI-TOOLS','https://developers.openai.com/api/docs/guides/function-calling','Optional hosted strict per-tool schemas and one-call setting; structure not authority or financial correctness.')]
    put(D/'research-sources.json',{'asOf':'2026-10-09','method':'Official primary documentation only; no model/API/key/download','sources':[{'id':i,'url':u,'finding':f} for i,u,f in research]})
    put(D/'model-manifest-template.json',{'status':'UNPINNED_MODEL_DISABLED','runtimeVersion':None,'runtimeImageDigest':None,'modelOrigin':'https://huggingface.co/Qwen/Qwen3-4B','modelRevision':None,'weightsDigest':None,'quantization':None,'tokenizerDigest':None,'chatTemplateDigest':None,'licenseDigest':None,'promptVersion':'FW-AGENT-PROMPT-001','promptHash':None,'toolRegistryHash':sha(D/'tool-registry.json'),'decisionSchemaHash':sha(D/'decision-schemas.json'),'engineVersion':'FW-ENGINE-DESIGN-001; implementation pin missing','runtimePoc':'NOT_RUN'})
    print(json.dumps({'status':'BUILT_AGENT_DESIGN','protectedFiles':len(json.loads((E/'preservation-before.json').read_text(encoding='utf-8'))['files']),'apiRevision':'005','runtime':'NOT_RUN'}))

if __name__=='__main__':main()
