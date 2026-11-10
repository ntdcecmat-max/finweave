import { useMemo, useState } from 'react';
import {draftBodySignature} from '../services/real-operational';
import { useNavigate } from 'react-router';
import { Sparkles, Target, Search, Plus, Trash2, Square, ArrowRight } from 'lucide-react';
import { useApp, MoneyValue, PrivateText } from '../app/context';
import { useChat } from '../app/chat-provider';
import { useOperational } from '../app/operational-context';
import { useForecast } from '../app/forecast-context';
import type { AgentRunDTO, DraftBodyDTO, PlanningDraftDTO } from '../contracts/operational';
import { forecastBaseline, shiftMonth } from '../domain/forecast';
import { simulateDraft } from '../domain/planning-draft';
import { addDays, cleanAssetName } from '../domain/planning';
import { day, fmtDate, D } from '../domain/selectors';
import { Button, Badge, Modal } from '../components/ui';
import { MoneyInput } from '../components/MoneyInput';
import { ForecastChart } from '../components/ForecastChart';
import './operational.css';
export function AgentEntry({ goalId }: {
    goalId?: string;
}) { const op = useOperational(), { masked, location } = useApp(); return <section className="op-agent-hero"><div><div className="row"><Sparkles size={20}/><h2>Cùng trợ lý lên kế hoạch</h2></div><p>Đặt ràng buộc, thử phương án và xem tác động trước khi áp dụng. Bạn luôn là người xác nhận thay đổi.</p></div><div className="op-actions"><Button variant="primary" disabled={masked || op.busy} onClick={() => void op.beginAgent(location.pathname.includes('goals') || goalId ? 'goal' : 'plan', goalId)}><Target size={17}/>Bắt đầu cùng trợ lý</Button><Button disabled={masked || op.busy} onClick={() => void op.beginAgent('investigation')}><Search size={17}/>Kiểm tra kế hoạch</Button></div></section>; }
const states = { queued: 'Đang chờ', reading: 'Đang đọc dữ liệu', awaiting_user: 'Cần bạn xác nhận ràng buộc', simulating: 'Đang mô phỏng', draft_ready: 'Bản nháp đã sẵn sàng', completed: 'Đã hoàn tất xử lý', partial: 'Còn phần chưa hoàn tất', failed: 'Chưa xử lý được', cancelled: 'Đã dừng' };
export function AgentConversation() {
    const op = useOperational(), chat = useChat(), { masked, store } = useApp(), nav = useNavigate();
    const runs = op.state?.runs.filter(r => r.conversationId === chat.activeConversationId) ?? [];
    if (masked)
        return runs.length ? <p className="notice">Nội dung Agent và bản nháp đã ẩn.</p> : null;
    return <>{op.actionError && <div className="notice error" role="alert">{op.actionError}</div>}{runs.map(run => <article className="op-run stack" key={run.id}><div className="row between"><Badge tone={run.state === 'failed' ? 'error' : run.state === 'draft_ready' ? 'planned' : ''}>{states[run.state]}</Badge><span className="meta muted">Trợ lý theo quy tắc · minh họa</span></div><h3>{run.intent === 'goal' ? 'Cùng đặt mục tiêu' : run.intent === 'plan' ? 'Cùng lập kế hoạch' : 'Kiểm tra thực tế & kế hoạch'}</h3><p className="small">{run.summary}</p><p className="meta muted">Ngữ cảnh lúc bắt đầu: {run.context.route} · {fmtDate(run.context.periodStart)} – {fmtDate(run.context.periodEnd)} · dữ liệu v{run.baseVersion}</p>{run.baseVersion !== store?.version && <p className="notice small">Dữ liệu hiện tại đã thay đổi. Kết quả này giữ căn cứ lúc bắt đầu.</p>}
  {run.state === 'awaiting_user' && <ConstraintForm run={run}/>}
  {run.draftId && <div className="op-actions"><Button onClick={() => { chat.setPanel(false); nav('/plan/drafts/' + run.draftId); }}>Mở bản nháp / xem thay đổi</Button><Button disabled={op.state?.drafts.find(d => d.id === run.draftId)?.state === 'confirmed'} onClick={() => { chat.setEditingDraftId(run.draftId); chat.setDraft(''); }}>Chỉnh bằng hội thoại</Button>{op.state?.drafts.find(d => d.id === run.draftId)?.state === 'confirmed' && <Badge>Đã được bạn xác nhận áp dụng</Badge>}</div>}
  <details><summary>Tiến trình & căn cứ</summary><ol className="small muted">{run.steps.map((s, i) => <li key={i}>{s}</li>)}</ol><p className="meta muted">{run.toolCalls}/8 bước đọc và mô phỏng · Không có model trả phí được gọi.</p><p className="small break"><PrivateText>{run.evidence.join(' · ') || 'Đang kiểm tra dữ liệu.'}</PrivateText></p></details>
  {!['completed', 'cancelled', 'failed', 'partial'].includes(run.state) && <Button disabled={op.busy} onClick={() => void op.execute('cancelAgentRun', { id: run.id, expectedVersion: run.version }).catch(() => { })}><Square size={14}/>Dừng yêu cầu</Button>}
  {['partial', 'failed', 'cancelled'].includes(run.state) && <Button disabled={op.busy} onClick={() => void op.beginAgent(run.intent, run.goalId ?? undefined)}>Bắt đầu lại từ dữ liệu hiện tại</Button>}
 </article>)}</>;
}
export function PlanningDraftPage() { const op = useOperational(), { location } = useApp(), nav = useNavigate(); const draft = op.state?.drafts.find(d => d.id === location.pathname.split('/')[3]); return <div className="stack"><h1>Bản nháp kế hoạch</h1><p>Chỉnh phương án, so sánh và xác nhận trước khi áp dụng.</p>{op.loading ? <p role="status">Đang tải bản nháp…</p> : draft ? <DraftEditor draft={draft} onClose={() => nav('/plan/goals')}/> : <p className="notice">Bản nháp không còn trong phiên này. <Button onClick={() => nav('/plan')}>Về kế hoạch</Button></p>}</div>; }
function initialBody(run: AgentRunDTO, store: NonNullable<ReturnType<typeof useApp>['store']>): DraftBodyDTO {
    const baseline = forecastBaseline(store, run.context.scope), goal = store.goals.find(g => g.id === run.goalId), start = addDays(day(store.clock), 1), source = goal?.contributionSchedule?.account ?? run.context.scope.find(id => store.accounts.some(a => a.id === id && !a.archived)) ?? '';
    return { goal: { existingId: goal?.id ?? null, name: goal?.name ?? '', target: goal?.target ?? '', due: goal?.due ?? shiftMonth(start, 12), account: source, contribution: goal?.contributionSchedule?.amount ?? '', start: goal?.contributionSchedule?.start && goal.contributionSchedule.start > day(store.clock) ? goal.contributionSchedule.start : start, day: goal?.contributionSchedule?.day ?? Number(start.slice(-2)), skipMonths: goal?.contributionSchedule?.skipMonths ?? [], profile: goal?.projection?.profile ?? 'cash' }, items: [], scope: run.context.scope, reserve: D(run.settings.expense ?? String(Math.round(baseline.expense))).mul(run.settings.reserveMonths).toFixed(0), income: run.settings.income ?? String(Math.round(baseline.income)), expense: run.settings.expense ?? String(Math.round(baseline.expense)), priority: 'preserve_plans', notes: '', settings: run.settings };
}
function ConstraintForm({ run }: {
    run: AgentRunDTO;
}) {
    const { store } = useApp(), op = useOperational();
    const [body, setBody] = useState(() => initialBody(run, store!)), [error, setError] = useState('');
    if (!store)
        return null;
    return <form className="stack" onSubmit={async (e) => { e.preventDefault(); setError(''); try {
        await op.execute('answerAgentRun', { id: run.id, expectedVersion: run.version, questionId: run.questionId!, body });
    }
    catch (e) {
        setError(friendlyError(e));
    } }}><p className="small muted">Ngân sách được điền từ giao dịch đã ghi hoặc giả định bạn đã chọn. Hãy xác nhận mức thu, chi và khoản dự phòng cần bảo vệ; trợ lý không tự tăng thu nhập hoặc giảm quỹ dự phòng.</p><DraftFields body={body} onChange={setBody} prefix={'agent-' + run.id}/>{error && <p className="notice error" role="alert">{error}</p>}<Button type="submit" variant="primary" disabled={op.busy || run.baseVersion !== store.version}>{op.busy ? 'Đang tạo bản nháp…' : 'Xác nhận ràng buộc & tạo bản nháp'}</Button>{run.baseVersion !== store.version && <Button type="button" onClick={() => void op.beginAgent(run.intent, run.goalId ?? undefined)}>Dùng dữ liệu hiện tại</Button>}</form>;
}
function friendlyError(e: unknown) { const message = (e as Error).message; return message.startsWith('[') ? 'Kiểm tra các ô bắt buộc, số tiền, lịch góp và hạn hoàn thành.' : message; }
function DraftFields({ body, onChange, prefix = 'agent' }: {
    body: DraftBodyDTO;
    onChange: (body: DraftBodyDTO) => void;
    prefix?: string;
}) {
    const { store, masked } = useApp();
    if (!store || masked)
        return null;
    const goal = (patch: Partial<DraftBodyDTO['goal']>) => onChange({ ...body, goal: { ...body.goal, ...patch } });
    const accounts = store.accounts.filter(a => !a.archived && body.scope.includes(a.id));
    const money = (key: 'income' | 'expense' | 'reserve', label: string) => <div className="field"><label htmlFor={prefix + '-' + key}>{label} *</label><MoneyInput id={prefix + '-' + key} required value={body[key]} onValueChange={value => onChange({ ...body, [key]: value })}/></div>;
    return <div className="op-run-form">
  <div className="field"><label htmlFor={prefix + '-name'}>Tên mục tiêu *</label><input id={prefix + '-name'} required maxLength={80} value={body.goal.name} onChange={e => goal({ name: e.target.value })} placeholder="Quỹ dự phòng, mua nhà, du lịch…"/></div>
  <div className="field"><label htmlFor={prefix + '-target'}>Số tiền cần đạt *</label><MoneyInput id={prefix + '-target'} required value={body.goal.target} onValueChange={target => goal({ target })}/></div>
  <div className="field"><label htmlFor={prefix + '-due'}>Hạn hoàn thành *</label><input id={prefix + '-due'} type="date" required min={addDays(day(store.clock), 1)} value={body.goal.due} onChange={e => goal({ due: e.target.value })}/></div>
  <div className="field"><label htmlFor={prefix + '-contribution'}>Dự kiến góp mỗi tháng *</label><MoneyInput id={prefix + '-contribution'} required value={body.goal.contribution} onValueChange={contribution => goal({ contribution })}/></div>
  {money('income', 'Thu nhập mỗi tháng')}{money('expense', 'Chi tiêu mỗi tháng')}{money('reserve', 'Quỹ dự phòng cần giữ')}
  <div className="field"><label htmlFor={prefix + '-account'}>Nguồn góp *</label><select id={prefix + '-account'} required value={body.goal.account} onChange={e => goal({ account: e.target.value })}><option value="">Chọn tài khoản…</option>{accounts.map(a => <option key={a.id} value={a.id}>{cleanAssetName(a.name)}</option>)}</select></div>
  <div className="field"><label htmlFor={prefix + '-start'}>Bắt đầu lịch góp *</label><input id={prefix + '-start'} required type="date" min={addDays(day(store.clock), 1)} max={body.goal.due} value={body.goal.start} onChange={e => goal({ start: e.target.value })}/></div>
  <div className="field"><label htmlFor={prefix + '-day'}>Ngày góp hàng tháng *</label><input id={prefix + '-day'} type="number" min={1} max={31} required value={body.goal.day} onChange={e => goal({ day: Number(e.target.value) })}/></div>
  {!!body.goal.skipMonths.length && <div className="field"><span className="small muted">Các tháng bỏ góp</span><div className="op-actions">{body.goal.skipMonths.map(month => <Button type="button" key={month} onClick={() => goal({ skipMonths: body.goal.skipMonths.filter(m => m !== month) })}>{month} · Bỏ ngoại lệ ×</Button>)}</div></div>}<div className="field"><label htmlFor={prefix + '-profile'}>Cách giữ khoản tiền mục tiêu</label><select id={prefix + '-profile'} value={body.goal.profile} onChange={e => goal({ profile: e.target.value as typeof body.goal.profile })}><option value="cash">Giữ bằng tiền</option><option value="balanced">Cân bằng tiền, cổ phiếu và vàng</option><option value="growth">Ưu tiên cổ phiếu và vàng</option></select></div>
  <div className="field"><label htmlFor={prefix + '-priority'}>Ưu tiên giữa các mục tiêu</label><select id={prefix + '-priority'} value={body.priority} onChange={e => onChange({ ...body, priority: e.target.value as typeof body.priority })}><option value="preserve_plans">Giữ thứ tự các mục tiêu đang có</option><option value="goal_first">Ưu tiên mục tiêu này khi góp tiền</option></select></div>
  <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor={prefix + '-notes'}>Ràng buộc hoặc điều bạn muốn cân nhắc</label><textarea id={prefix + '-notes'} maxLength={500} rows={2} value={body.notes} onChange={e => onChange({ ...body, notes: e.target.value })} placeholder="Ghi chú này được giữ trong bản nháp. Các ràng buộc về tiền cần nhập ở các ô bên trên."/></div>
 </div>;
}
function DraftEditor(props:{draft:PlanningDraftDTO;onClose:()=>void}) {return props.draft.body.goal?<GoalDraftEditor {...props}/>:<PlanOnlyDraftEditor {...props}/>;}
function PlanOnlyDraftEditor({draft,onClose}:{draft:PlanningDraftDTO;onClose:()=>void}){
 const {store,masked}=useApp(),op=useOperational();const [body,setBody]=useState(draft.body),[error,setError]=useState(''),[simulation,setSimulation]=useState<any>(null);
 if(!store)return null;const changed=draftBodySignature(body)!==draftBodySignature(draft.body),stale=draft.baseVersion!==store.version;
 const edit=(index:number,field:string,value:unknown)=>{setBody({...body,items:body.items.map((item,i)=>i===index?{...item,[field]:value}:item)});setSimulation(null);};
 const run=async(operation:'reviseDraft'|'refreshDraft'|'previewPlanningDraft'|'confirmPlanningDraft'|'simulatePlanningDraft')=>{setError('');try{const result=await op.execute(operation,operation==='reviseDraft'?{id:draft.id,expectedVersion:draft.version,body,reason:'Chỉnh kế hoạch trong bản nháp'}:operation==='confirmPlanningDraft'?{id:draft.id,expectedVersion:draft.version,token:draft.preview!.token,digest:draft.preview!.digest}:{id:draft.id,expectedVersion:draft.version} as any);if(operation==='simulatePlanningDraft')setSimulation(result);}catch(e){setError(friendlyError(e));}};
 return <Modal open onClose={onClose} className="op-draft-dialog" title="Bản nháp kế hoạch" description="Bản nháp này không có mục tiêu. Giữ các kế hoạch và liên kết do máy chủ trả về; xác nhận chỉ ghi kế hoạch."><div className="stack"><Badge tone="planned">v{draft.version} · dữ liệu v{draft.baseVersion}</Badge>{masked?<p>Thông tin bản nháp đã ẩn.</p>:<>{body.items.map((item,index)=><section className="op-run stack" key={item.ref}><div className="field"><label htmlFor={'plan-draft-name-'+index}>Tên kế hoạch</label><input id={'plan-draft-name-'+index} value={item.name} onChange={e=>edit(index,'name',e.target.value)}/></div><div className="form-grid"><div className="field"><label>Số tiền</label><MoneyInput value={item.amount} onValueChange={v=>edit(index,'amount',v)}/></div><div className="field"><label>Loại</label><select value={item.kind} onChange={e=>edit(index,'kind',e.target.value)}><option value="income">Thu nhập</option><option value="expense">Chi tiêu</option><option value="investment">Đầu tư</option></select></div><div className="field"><label>Tài khoản</label><select value={item.account} onChange={e=>edit(index,'account',e.target.value)}>{store.accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div><div className="field"><label>Ngày bắt đầu</label><input type="date" value={item.date} onChange={e=>edit(index,'date',e.target.value)}/></div><div className="field"><label>Ngày kết thúc</label><input type="date" value={item.end} onChange={e=>edit(index,'end',e.target.value)}/></div><div className="field"><label>Tần suất</label><select value={item.recurrence} onChange={e=>edit(index,'recurrence',e.target.value)}><option value="once">Một lần</option><option value="monthly">Hàng tháng</option></select></div></div></section>)}{simulation&&<section className="notice info"><p>Mô phỏng máy chủ · snapshot v{simulation.baseVersion}</p><p>{simulation.warnings.join(' · ')}</p><MoneyValue value={simulation.result.cash?.value?.value??null}/></section>}{stale&&<p className="notice">Dữ liệu đã đổi. Tính lại trước khi xác nhận.</p>}<div className="op-actions"><Button disabled={op.busy||!changed} onClick={()=>void run('reviseDraft')}>Lưu bản chỉnh</Button><Button disabled={op.busy||changed} onClick={()=>void run('refreshDraft')}>Tính lại dữ liệu hiện tại</Button><Button disabled={op.busy||changed||stale} onClick={()=>void run('simulatePlanningDraft')}>Mô phỏng máy chủ</Button><Button disabled={op.busy||changed||stale||draft.state==='confirmed'} onClick={()=>void run('previewPlanningDraft')}>Xem thay đổi</Button><Button variant="primary" disabled={op.busy||changed||stale||!draft.preview||Date.parse(draft.preview.expiresAt)<=Date.now()||draft.state==='confirmed'} onClick={()=>void run('confirmPlanningDraft')}>Xác nhận kế hoạch</Button></div></>}{error&&<p role="alert" className="notice error">{error}</p>}</div></Modal>;
}
function GoalDraftEditor({ draft, onClose }: {
    draft: PlanningDraftDTO;
    onClose: () => void;
}) {
    const { store, masked } = useApp(), op = useOperational(), { patch } = useForecast(), chat = useChat(), nav = useNavigate();
    const [body, setBody] = useState(draft.body), [error, setError] = useState(''), [selected, setSelected] = useState(0), [compare, setCompare] = useState(false), [preview, setPreview] = useState(false), [revision, setRevision] = useState('');
    const changed = draftBodySignature(body) !== draftBodySignature(draft.body), stale = draft.baseVersion !== store?.version;
    const simulation = useMemo(() => { if (!store || masked || stale)
        return null; try {
        return simulateDraft(store, body);
    }
    catch {
        return null;
    } }, [store, body, masked, stale]);
    const alternative = useMemo(() => { if (!store || !compare || masked || stale)
        return null; try {
        return simulateDraft(store, { ...body, goal: { ...body.goal, contribution: D(body.goal.contribution || '0').mul(.8).toFixed(0) } });
    }
    catch {
        return null;
    } }, [store, body, compare, masked, stale]);
    const set = (value: DraftBodyDTO) => { setBody(value); setPreview(false); setError(''); };
    const save = async () => { try {
        await op.execute('reviseDraft', { id: draft.id, expectedVersion: draft.version, body, reason: revision || 'Người dùng chỉnh bản nháp bằng biểu mẫu' });
        setPreview(false);
        setRevision('');
        return true;
    }
    catch (e) {
        setError(friendlyError(e));
        return false;
    } };
    if (!store)
        return null;
    const outcome = simulation?.outcome, goal = simulation?.store.goals.find(g => g.id === simulation.goalId), active = store.goals.find(g => g.id === body.goal.existingId);
    return <Modal open onClose={onClose} className="op-draft-dialog" title="Bản nháp kế hoạch & mục tiêu" description="Mô phỏng từ cùng Financial Engine. Chỉ áp dụng sau khi bạn xem thay đổi và xác nhận; không tự tạo giao dịch thực tế.">
  {masked ? <p className="notice">Thông tin bản nháp đã ẩn.</p> : draft.state === 'confirmed' ? <div className="stack"><div className="notice info">Đã áp dụng từ lần xác nhận trước. Thử lại cùng yêu cầu không tạo thêm mục tiêu hoặc kế hoạch.</div><p className="small break">Đối tượng đã lưu: {draft.confirmedIds.join(' · ')}</p><Button onClick={() => { chat.setPanel(false); onClose(); nav('/plan/goals'); }}>Mở mục tiêu & kế hoạch <ArrowRight size={16}/></Button></div> : <div className="stack">
   <div className="row between"><Badge tone="planned">Bản nháp — chưa áp dụng</Badge><span className="meta muted">v{draft.version} · dữ liệu v{draft.baseVersion}</span></div>
   {stale && <div role="alert" className="notice">Dữ liệu nền đã thay đổi. Bản nháp giữ các ràng buộc bạn đã nhập; cần tính lại và xem dự tính mới trước khi áp dụng.<Button disabled={op.busy || changed} onClick={() => void op.execute('refreshDraft', { id: draft.id, expectedVersion: draft.version }).catch(e => setError(friendlyError(e)))}>Tính lại từ dữ liệu hiện tại</Button></div>}
   <form className="stack" onSubmit={async (e) => { e.preventDefault(); await save(); }}><DraftFields body={body} onChange={set} prefix={'draft-' + draft.id}/>
    <details open={body.items.length > 0}><summary>Các khoản thu, chi, đầu tư liên kết · {body.items.length}</summary><p className="small muted">Lịch góp ở mục tiêu đã được mô phỏng riêng. Liên kết dưới đây chỉ biểu thị kế hoạch hỗ trợ; không trừ tiền góp thêm lần nữa.</p><div className="stack">{body.items.map((item, index) => <article className="op-run stack" key={item.ref}><div className="field"><label htmlFor={'item-name-' + index}>Tên kế hoạch *</label><input id={'item-name-' + index} required maxLength={80} value={item.name} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, name: e.target.value } : v) })}/></div><div className="op-run-form"><div className="field"><label htmlFor={'item-kind-' + index}>Loại</label><select id={'item-kind-' + index} value={item.kind} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, kind: e.target.value as typeof v.kind } : v) })}><option value="income">Thu nhập</option><option value="expense">Chi tiêu</option><option value="investment">Đầu tư</option></select></div><div className="field"><label htmlFor={'item-amount-' + index}>Số tiền mỗi lần *</label><MoneyInput id={'item-amount-' + index} value={item.amount} required onValueChange={amount => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, amount } : v) })}/></div><div className="field"><label htmlFor={'item-account-' + index}>Tài khoản</label><select id={'item-account-' + index} value={item.account} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, account: e.target.value } : v) })}>{store.accounts.filter(a => !a.archived && body.scope.includes(a.id)).map(a => <option key={a.id} value={a.id}>{cleanAssetName(a.name)}</option>)}</select></div><div className="field"><label htmlFor={'item-recurrence-' + index}>Lặp</label><select id={'item-recurrence-' + index} value={item.recurrence} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, recurrence: e.target.value as typeof v.recurrence } : v) })}><option value="once">Một lần</option><option value="monthly">Hàng tháng</option></select></div><div className="field"><label htmlFor={'item-date-' + index}>Bắt đầu *</label><input id={'item-date-' + index} type="date" required value={item.date} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, date: e.target.value, day: Number(e.target.value.slice(-2)) } : v) })}/></div><div className="field"><label htmlFor={'item-end-' + index}>Kết thúc *</label><input id={'item-end-' + index} type="date" required min={item.date} value={item.end} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, end: e.target.value } : v) })}/></div>{item.kind === 'investment' ? <div className="field"><label htmlFor={'item-holding-' + index}>Tài sản nhận *</label><select id={'item-holding-' + index} required value={item.holding ?? ''} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, holding: e.target.value } : v) })}><option value="">Chọn tài sản…</option>{store.holdings.filter(h => !h.archived).map(h => <option key={h.id} value={h.id}>{cleanAssetName(h.name)}</option>)}</select></div> : <div className="field"><label htmlFor={'item-cat-' + index}>Danh mục *</label><input id={'item-cat-' + index} required value={item.category} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, category: e.target.value } : v) })}/></div>}</div><label className="check"><input type="checkbox" checked={item.supportsGoal} onChange={e => set({ ...body, items: body.items.map((v, i) => i === index ? { ...v, supportsGoal: e.target.checked } : v) })}/>Kế hoạch hỗ trợ mục tiêu này</label><Button type="button" onClick={() => set({ ...body, items: body.items.filter((_, i) => i !== index) })}><Trash2 size={16}/>Bỏ khỏi bản nháp</Button></article>)}</div><div className="op-actions" style={{ marginTop: 12 }}><Button type="button" disabled={body.items.length >= 20} onClick={() => set({ ...body, items: [...body.items, { ref: crypto.randomUUID(), existingId: null, name: '', kind: 'income', amount: '', account: body.goal.account, date: body.goal.start, end: body.goal.due, recurrence: 'monthly', day: body.goal.day, category: 'Thu nhập', holding: null, supportsGoal: true }] })}><Plus size={16}/>Thêm khoản hỗ trợ mới</Button><select aria-label="Chọn kế hoạch đang có để điều chỉnh" value="" onChange={e => { const p = store.plans.find(p => p.id === e.target.value); if (p)
            set({ ...body, items: [...body.items, { ref: p.id, existingId: p.id, name: p.name, kind: p.kind, amount: p.amount, account: p.account, date: p.date, end: p.end, recurrence: p.recurrence, day: p.day, category: p.category, holding: p.holding ?? null, supportsGoal: true }] }); }}><option value="">Điều chỉnh kế hoạch đang có…</option>{store.plans.filter(p => !p.archived && body.scope.includes(p.account) && !body.items.some(i => i.existingId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name} · v{p.version}</option>)}</select></div></details>
    <div className="field"><label htmlFor="draft-revision">Tóm tắt thay đổi</label><input id="draft-revision" maxLength={300} value={revision} onChange={e => setRevision(e.target.value)} placeholder="Ví dụ: giảm mức góp, kéo dài hạn, sửa lịch tháng 12…"/></div><Button type="submit" disabled={op.busy || !changed}>Lưu chỉnh sửa & tính lại bản nháp</Button>
   </form>
   {simulation && goal ? <><div className="op-summary"><div><span className="small muted">Dự tính tại hạn mục tiêu</span><strong><MoneyValue value={outcome ? Math.round(outcome.funded).toString() : null}/></strong></div><div><span className="small muted">Còn thiếu theo dự tính</span><strong><MoneyValue value={outcome ? Math.round(outcome.gap).toString() : null}/></strong></div><div><span className="small muted">Tỷ lệ đạt trong mô phỏng</span><strong>{outcome?.probability === null ? 'Chưa đủ dữ liệu' : (outcome?.probability ?? 0).toFixed(0) + '%'}</strong></div></div>
    {outcome && outcome.feasible + 1 < outcome.requested && <p className="notice error" role="alert">Lịch góp vượt khả năng sau chi tiêu, kế hoạch khác và quỹ dự phòng: yêu cầu <MoneyValue value={String(Math.round(outcome.requested))}/>, có thể bố trí <MoneyValue value={String(Math.round(outcome.feasible))}/>. Cần giảm mức góp, tăng thu nhập có căn cứ hoặc kéo dài hạn.</p>}
    <ForecastChart result={simulation.result} plot={goal.projection?.criterion === 'assets' ? 'assets' : goal.projection?.criterion === 'independence' ? 'netWorth' : 'goal'} goal={goal} selected={Math.min(selected, simulation.result.points.length - 1)} onSelect={setSelected}/>
    <p className="small muted">Mô phỏng có điều kiện · VND · {fmtDate(day(store.clock))} – {fmtDate(body.goal.due)} · {simulation.result.trials} đường chạy. Giả định lợi suất, lạm phát và thu nhập chưa phải dự báo vĩ mô thực tế.</p>
    <details><summary>Các giả định đã chụp trong bản nháp</summary><p className="small">Lạm phát {body.settings.inflation}%/năm · tăng thu nhập {body.settings.incomeGrowth}%/năm · tiền {body.settings.cashReturn}% · cổ phiếu {body.settings.stockReturn}% · vàng {body.settings.goldReturn}%. Quỹ dự phòng <MoneyValue value={body.reserve}/>. Kế hoạch hiện có vẫn được tính.</p><p className="small muted">{simulation.result.baseline.complete ? `${simulation.result.baseline.months} tháng lịch sử đầy đủ.` : 'Lịch sử chưa đủ một tháng hoàn chỉnh; ngân sách cần được bạn xác nhận.'}</p></details>
    <details><summary>Bảng dự tính theo thời gian</summary><div className="table-wrap"><table><thead><tr><th>Ngày</th><th className="num">Tiền</th><th className="num">Tài sản</th><th className="num">Mục tiêu</th></tr></thead><tbody>{simulation.result.points.map(p => <tr key={p.date}><td>{fmtDate(p.date)}</td><td className="num"><MoneyValue value={String(Math.round(p.cash.p50))}/></td><td className="num"><MoneyValue value={String(Math.round(p.assets.p50))}/></td><td className="num"><MoneyValue value={String(Math.round(p.goals[goal.id].p50))}/></td></tr>)}</tbody></table></div></details>
   </> : <p className="notice" role="status">Hoàn thiện các ô và lịch góp hợp lệ để xem mô phỏng.</p>}
   <Button onClick={() => setCompare(!compare)} aria-expanded={compare}>{compare ? 'Ẩn so sánh' : 'So với phương án giảm mức góp 20%'}</Button>{compare && alternative && <div className="op-summary"><div><span className="small muted">Mức góp thay thế</span><strong><MoneyValue value={alternative.store.goals.find(g => g.id === alternative.goalId)?.contributionSchedule?.amount ?? '0'}/></strong></div><div><span className="small muted">Dự tính tại cùng hạn</span><strong><MoneyValue value={alternative.outcome ? String(Math.round(alternative.outcome.funded)) : null}/></strong></div><div><span className="small muted">Còn thiếu</span><strong><MoneyValue value={alternative.outcome ? String(Math.round(alternative.outcome.gap)) : null}/></strong></div><Button onClick={() => set({ ...body, goal: { ...body.goal, contribution: D(body.goal.contribution || '0').mul(.8).toFixed(0) } })}>Chọn mức góp này vào bản nháp</Button></div>}
   {preview && draft.preview && <section className="op-run stack"><h3>Thay đổi sau khi xác nhận</h3><div className="table-wrap"><table><thead><tr><th>Thông tin</th><th>Đang áp dụng</th><th>Bản nháp đề xuất</th></tr></thead><tbody><tr><td>Mục tiêu</td><td>{active?.name ?? 'Chưa có'}</td><td>{body.goal.name}</td></tr><tr><td>Số tiền đích</td><td><MoneyValue value={active?.target ?? null}/></td><td><MoneyValue value={body.goal.target}/></td></tr><tr><td>Hạn hoàn thành</td><td>{active ? fmtDate(active.due) : 'Chưa có'}</td><td>{fmtDate(body.goal.due)}</td></tr><tr><td>Góp hàng tháng</td><td><MoneyValue value={active?.contributionSchedule?.amount ?? '0'}/></td><td><MoneyValue value={body.goal.contribution}/></td></tr>{body.items.map(i => <tr key={i.ref}><td>{i.kind === 'income' ? 'Thu' : i.kind === 'expense' ? 'Chi' : 'Đầu tư'} · {i.name}</td><td>{i.existingId ? <MoneyValue value={store.plans.find(p => p.id === i.existingId)?.amount ?? null}/> : 'Kế hoạch mới'}</td><td><MoneyValue value={i.amount}/> · {i.supportsGoal ? 'liên kết mục tiêu' : 'độc lập'}</td></tr>)}</tbody></table></div><p className="small">Không thay số dư, giao dịch thực tế hoặc tiền đã dành. Mục tiêu, kế hoạch và các liên kết được lưu cùng một lần.</p><p className="meta muted">Dự tính hết hạn lúc {new Date(draft.preview.expiresAt).toLocaleTimeString('vi-VN')} · dữ liệu v{draft.preview.version} · mã {draft.preview.digest.slice(0, 12)}</p></section>}
   <details><summary>Lịch sử chỉnh bản nháp</summary><div className="op-revision small">{draft.revisions.map((r, i) => <p key={i}>{r}</p>)}</div></details>
   {error && <div className="notice error" role="alert">{error}</div>}
   <div className="dialog-footer"><Button onClick={onClose}>Đóng, giữ bản nháp</Button>{preview && draft.preview ? <Button variant="primary" disabled={op.busy || changed || stale || Date.parse(draft.preview.expiresAt) <= Date.now()} onClick={async () => { try {
            await op.execute('confirmPlanningDraft', { id: draft.id, expectedVersion: draft.version, token: draft.preview!.token, digest: draft.preview!.digest });
            if (simulation)
                patch(simulation.settings);
        }
        catch (e) {
            setError(friendlyError(e));
            setPreview(false);
        } }}>{op.busy ? 'Đang áp dụng…' : 'Xác nhận áp dụng kế hoạch & mục tiêu'}</Button> : <Button variant="primary" disabled={op.busy || changed || stale || !simulation} onClick={async () => { try {
            await op.execute('previewPlanningDraft', { id: draft.id, expectedVersion: draft.version });
            setPreview(true);
        }
        catch (e) {
            setError(friendlyError(e));
        } }}>Xem thay đổi trước khi áp dụng</Button>}</div>
  </div>}
 </Modal>;
}
