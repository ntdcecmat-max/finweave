import {AgentEntry,PlanningDraftPage} from './AgentPlanning';
import {GoalTemplates,GoalCalendar,GoalMilestones} from '../components/GoalPlanner';
import {useState} from 'react';
import {Plus,Target,ArrowDownLeft,ArrowUpRight,ChartNoAxesCombined} from 'lucide-react';
import {Navigate,useNavigate} from 'react-router';
import {useApp,MoneyValue,PrivateText} from '../app/context';
import {useView} from '../app/view';
import {action} from '../app/actions';
import {D,fmtDate,accountAvailable,eligible,quantityLabel} from '../domain/selectors';
import {cleanAssetName,forecastPlans,investmentEstimate,projectGoal,addDays} from '../domain/planning';
import type {PlanItem} from '../domain/model';
import {Subtabs} from './Home';
import {Button,Badge,Empty} from '../components/ui';
import {CollapsibleCard} from '../components/CollapsibleCard';
import {ForecastView,GoalProjectionView,SimulationResult} from '../components/PlanningResults';
import '../components/planning.css';

const tabs=[{path:'/plan',label:'Tổng quan kế hoạch'},{path:'/plan/items',label:'Thu nhập & Chi tiêu'},{path:'/plan/investments',label:'Đầu tư'},{path:'/plan/goals',label:'Đặt mục tiêu'}];
const kindLabels={income:'Thu nhập',expense:'Chi tiêu',investment:'Đầu tư'};
export function Plan(){
 const {store,period,location,masked,setFilter}=useApp();
 const {openAction,setAction}=useView();
 const nav=useNavigate();
 const [type,setType]=useState('all'),[query,setQuery]=useState('');
 if(!store)return null;
 const section=location.pathname.split('/')[2]||'overview';
 if(section==='drafts')return <PlanningDraftPage/>;
 if(section==='simulation')return <Navigate replace to={'/plan/goals'+location.search}/>;
 const data=forecastPlans(store,period.scope),goals=store.goals.filter(g=>g.status!=='archived');
 const items=data.items.filter(i=>(section==='investments'?i.kind==='investment':section==='items'?i.kind!=='investment':true)&&(section!=='items'||type==='all'||i.kind===type)&&(masked||!query||i.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())));
 const createPlan=(kind:PlanItem['kind'])=>{
  const spec=action(store,'plan',undefined,kind);
  spec.onDone=c=>nav((c?.data.kind==='investment'?'/plan/investments':'/plan/items')+location.search);
  setAction(spec);
 };
 const actualLinks=(item:PlanItem)=>{
  const q=new URLSearchParams(location.search);q.set('plan',item.id);q.delete('category');q.delete('type');q.set('start',item.date);q.set('end',addDays(item.end,1));nav('/transactions?'+q);
 };
 const linkActual=(item:PlanItem)=>{
  const candidates=store.events.filter(e=>e.posting==='posted'&&!e.reversal&&!e.plan&&e.account===item.account&&(item.kind!=='investment'||e.holding===item.holding)&&e.date>=item.date&&e.date<=item.end&&(e.kind===item.kind||item.kind==='expense'&&e.kind==='refund'));
  setAction({kind:'planLink',title:'Liên kết giao dịch với kế hoạch',description:candidates.length?'Chọn giao dịch đã thực hiện. Số tiền này sẽ được trừ khỏi phần kế hoạch còn lại.':'Chưa có giao dịch phù hợp về loại, tài khoản và thời gian. Hãy ghi giao dịch trong Giao dịch, rồi quay lại liên kết.',data:{plan:item.id,reason:'Liên kết giao dịch thực tế'},fields:[{key:'event',label:'Giao dịch thực tế',type:'select',required:true,initial:candidates[0]?.id??'',options:candidates.map(e=>({value:e.id,label:fmtDate(e.date)+' · '+e.description}))}]});
 };
 const createGoal=(values:Record<string,string>)=>{const spec=action(store,'goal');spec.fields=spec.fields.map(f=>({...f,initial:values[f.key]??f.initial}));spec.onDone=()=>nav('/plan/goals'+location.search);setAction(spec);};
 const title=section==='goals'?'Đặt mục tiêu':section==='investments'?'Lập kế hoạch đầu tư':section==='items'?'Lập kế hoạch thu nhập & chi tiêu':'Kế hoạch tài chính';
 const archived=section==='goals'?store.goals.filter(g=>g.status==='archived'):store.plans.filter(i=>i.archived&&(section==='investments'?i.kind==='investment':section==='items'?i.kind!=='investment':true));
 return <div className="stack plan-workspace">
  <div className="page-heading"><div><div className="eyebrow">LÊN KẾ HOẠCH CHO ĐIỀU BẠN MUỐN</div><h1>{title}</h1></div><Button variant="primary" onClick={()=>section==='goals'?openAction('goal'):createPlan(section==='investments'?'investment':'income')}><Plus size={18}/>{section==='goals'?'Đặt mục tiêu mới':section==='investments'?'Thêm kế hoạch đầu tư':'Thêm kế hoạch'}</Button></div>
  <Subtabs items={tabs}/><AgentEntry/>
  {section==='goals'?<>
   <CollapsibleCard title="Chọn điều bạn muốn đạt được" storageKey="goal-templates"><GoalTemplates store={store} onCreate={createGoal}/></CollapsibleCard>
   {!!goals.length&&<CollapsibleCard title="Lịch góp & các mốc sắp tới" storageKey="goal-calendar"><GoalCalendar store={store} onEdit={id=>openAction('goal',id)} onAllocate={id=>openAction('allocate',id)}/></CollapsibleCard>}
   {!goals.length?<Empty title="Bạn muốn dành tiền cho điều gì?" action={<Button variant="primary" onClick={()=>openAction('goal')}>Đặt mục tiêu đầu tiên</Button>}>Nhập số tiền đích và lịch góp. FinWeave sẽ dự tính tiến độ và mức góp cần thiết.</Empty>:goals.map(g=>{
    const projection=projectGoal(store,g),simulations=store.simulations.filter(s=>s.goal===g.id).slice().reverse();
    return <CollapsibleCard key={g.id} storageKey={'goal-'+g.id} title={masked?'Mục tiêu đã ẩn':g.name} actions={<Badge tone={g.status==='achieved'?'':'planned'}>{g.status==='achieved'?'Đã hoàn thành':'Đang thực hiện'}</Badge>}>
     <div className="row between"><p className="small muted">Hạn hoàn thành {fmtDate(g.due)}</p><strong>Mục tiêu <MoneyValue value={g.target}/></strong></div>
     {(!g.projection||g.projection.criterion==='savings')&&<div className="goal-actual-progress">{!masked&&<div className="goal-progress-ring" style={{background:`conic-gradient(#35a67d ${projection.progress*3.6}deg,#e7eee9 0)`}} role="progressbar" aria-label="Tiến độ tiền đã dành" aria-valuenow={Math.round(projection.progress)} aria-valuemin={0} aria-valuemax={100}><span>{projection.progress.toFixed(0)}<small>%</small></span></div>}<div><p className="small muted">Tiến độ thực tế · Đã dành <MoneyValue value={projection.funded}/></p><strong>{D(projection.funded).gte(g.target)?'Đã đủ tiền cho mục tiêu':'Tích lũy từng bước, tiến gần điều bạn muốn.'}</strong>{!masked&&<div className="goal-progress-milestones">{[25,50,75,100].map(m=><span key={m} className={projection.progress>=m?'achieved':''}>{projection.progress>=m?'✓ ':''}{m}%</span>)}</div>}</div></div>}
     <GoalProjectionView store={store} goal={g}/><AgentEntry goalId={g.id}/>
     <div className="planning-card-actions"><Button variant="primary" onClick={()=>openAction('goal',g.id)}>Điều chỉnh & mô phỏng</Button><Button onClick={()=>openAction('simulate',g.id)} disabled={g.status!=='active'}>Thử kịch bản với tiền hiện có</Button><Button onClick={()=>openAction('allocate',g.id)} disabled={g.status!=='active'}>Dành tiền cho mục tiêu</Button><Button onClick={()=>openAction('goalAction',g.id)}>Hoàn thành / quản lý</Button></div>
     <details className="chart-table"><summary>Nguồn tiền & lịch sử</summary>{g.allocations.length?g.allocations.map(a=><div className="list-row" key={a.id}><PrivateText>{cleanAssetName(store.accounts.find(x=>x.id===a.account)?.name??'')}</PrivateText><MoneyValue value={a.amount}/></div>):<p className="small muted">Chưa dành khoản tiền hiện có nào cho mục tiêu này.</p>}<div className="small muted"><PrivateText replacement="Lịch sử đã ẩn">{g.history.map((line,i)=><p key={i}>{line}</p>)}</PrivateText></div></details>
     {!!simulations.length&&<details className="chart-table"><summary>Kịch bản cũ với giá cố định · {simulations.length}</summary><div className="stack">{simulations.map(sim=><div key={sim.id} className="planning-saved-simulation"><SimulationResult simulation={sim} store={store}/><Button style={{marginTop:12}} onClick={()=>{const spec=action(store,'simulate',g.id);spec.fields=spec.fields.map(f=>({...f,initial:({mode:sim.mode,account:sim.account,amount:sim.amount,count:String(sim.count),firstDate:sim.steps[0]?.date,intervalDays:sim.steps.length>1?String(Math.round((Date.parse(sim.steps[1].date)-Date.parse(sim.steps[0].date))/86400000)):'30',horizon:sim.horizon} as Record<string,string>)[f.key]??f.initial}));setAction(spec);}}>Điều chỉnh & tính lại</Button></div>)}</div></details>}
    </CollapsibleCard>;
   })}
   <CollapsibleCard title="Tiền có thể dành cho mục tiêu" storageKey="goal-available">{store.accounts.filter(a=>!a.archived).map(a=><div className="list-row" key={a.id}><PrivateText>{cleanAssetName(a.name)}</PrivateText><MoneyValue value={accountAvailable(store,a.id)}/></div>)}</CollapsibleCard>
  </>:<>
   <CollapsibleCard title="Dự báo & mô phỏng tài chính" storageKey="plan-forecast"><ForecastView store={store} scope={period.scope}/></CollapsibleCard>
   {section==='overview'&&<CollapsibleCard title="Bắt đầu một kế hoạch" storageKey="plan-start"><div className="grid three">{(['income','expense','investment'] as const).map(kind=><div className="stack" key={kind}><span className="avatar">{kind==='income'?<ArrowDownLeft/>:kind==='expense'?<ArrowUpRight/>:<ChartNoAxesCombined/>}</span><h3>{kindLabels[kind]}</h3><p className="small muted">{kind==='income'?'Lên lịch nhận lương, thưởng hoặc nguồn thu khác.':kind==='expense'?'Dự trù khoản mua sắm, hóa đơn và chi tiêu định kỳ.':'Chọn tài sản, ngân sách và lịch mua dự kiến.'}</p><Button onClick={()=>createPlan(kind)}><Plus size={16}/>Thêm {kindLabels[kind].toLowerCase()}</Button></div>)}</div></CollapsibleCard>}
   <CollapsibleCard title={section==='investments'?'Lịch đầu tư':section==='items'?'Các khoản thu & chi dự kiến':'Các kế hoạch đang thực hiện'} storageKey={'plan-list-'+section}>
    <div className="row between" style={{marginBottom:20}}>{section==='items'&&<div className="planning-types">{[{value:'all',label:'Tất cả'},{value:'income',label:'Thu nhập'},{value:'expense',label:'Chi tiêu'}].map(o=><Button key={o.value} aria-pressed={type===o.value} onClick={()=>setType(o.value)}>{o.label}</Button>)}</div>}{!masked&&<div className="field planning-list-filter"><label className="sr-only" htmlFor="plan-search">Tìm kế hoạch</label><input id="plan-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm kế hoạch…"/></div>}<Button onClick={()=>createPlan(section==='investments'?'investment':'expense')}><Plus size={16}/>Thêm kế hoạch</Button></div>
    {period.scope.length<store.accounts.filter(a=>!a.archived).length&&<div className="notice info" style={{marginBottom:16}}>Đang xem các tài khoản trong phạm vi đã chọn. <Button variant="ghost" onClick={()=>setFilter({scope:undefined})}>Hiện tất cả tài khoản</Button></div>}
    {!items.length?<Empty title={query||type!=='all'?'Không có kế hoạch khớp bộ lọc':'Chưa có kế hoạch'} action={<Button variant="primary" onClick={()=>createPlan(section==='investments'?'investment':'income')}>Tạo kế hoạch</Button>}>Chọn khoản thu, chi hoặc đầu tư, sau đó xem dự tính trước khi lưu.</Empty>:<div className="stack">{items.map(item=>{
     const estimate=item.kind==='investment'?investmentEstimate(store,item.holding,item.amount):undefined;
     return <article className="card" key={item.id}>
      <div className="planning-card-header"><div><Badge tone={item.kind==='income'?'':item.kind==='expense'?'error':'planned'}>{kindLabels[item.kind]}</Badge><h3><PrivateText>{item.name}</PrivateText></h3><p className="small muted"><PrivateText>{cleanAssetName(store.accounts.find(a=>a.id===item.account)?.name??'')}</PrivateText> · {item.recurrence==='monthly'?'Hàng tháng, ngày '+item.day:'Một lần'} · {fmtDate(item.date)}{item.recurrence==='monthly'?' → '+fmtDate(item.end):''}</p></div><strong><MoneyValue value={item.amount}/> / lần</strong></div>
      {estimate&&<p className="notice info" style={{marginTop:16}}><PrivateText>{cleanAssetName(estimate.holding?.name??'Tài sản đã lưu trữ')}</PrivateText> · {estimate.quantity!==null?<>Dự tính {quantityLabel(estimate.quantity)} {estimate.holding?.unit==='share'?'cổ phiếu':'chỉ'} / lần theo giá hiện tại.</>:'Chưa đủ giá để dự tính số lượng mua.'}</p>}
      <div className="grid three planning-metrics" style={{marginTop:16}}><div className="planning-metric"><p className="small muted">Tổng dự kiến · {item.rows.length} lần</p><strong><MoneyValue value={item.planned}/></strong></div><div className="planning-metric"><p className="small muted">Đã thực hiện</p><strong><MoneyValue value={item.actual}/></strong></div><div className="planning-metric"><p className="small muted">Còn lại</p><strong><MoneyValue value={item.remaining}/></strong></div></div>
      {D(item.overspend).gt(0)&&<p className="notice" style={{marginTop:16}}>Đã chi vượt <MoneyValue value={item.overspend}/>. Những lần thực hiện khác vẫn được giữ trong kế hoạch.</p>}
      <details className="chart-table"><summary>Lịch thực hiện & tiến độ</summary><div className="table-wrap"><table><thead><tr><th>Ngày</th><th className="num">Dự kiến</th><th className="num">Đã thực hiện</th><th className="num">Còn lại</th></tr></thead><tbody>{item.rows.map(row=><tr key={row.id}><td>{fmtDate(row.date)}{D(row.remaining).isZero()?' · Hoàn tất':''}</td><td className="num"><MoneyValue value={row.amount}/></td><td className="num"><MoneyValue value={row.actual}/></td><td className="num"><MoneyValue value={row.remaining}/></td></tr>)}</tbody></table></div></details>
      <div className="planning-card-actions"><Button onClick={()=>openAction('plan',item.id)}>Điều chỉnh & dự tính</Button><Button onClick={()=>linkActual(item)}>Liên kết giao dịch</Button><Button onClick={()=>actualLinks(item)}>Xem giao dịch đã thực hiện</Button><Button onClick={()=>openAction('planArchive',item.id)}>Lưu trữ</Button></div>
     </article>;
    })}</div>}
   </CollapsibleCard>
   {section==='overview'&&<CollapsibleCard title="Cột mốc & điều kiện hoàn thành" storageKey="plan-goal-summary"><GoalMilestones store={store} onEdit={id=>openAction('goal',id)}/><Button style={{marginTop:16}} onClick={()=>nav('/plan/goals'+location.search)}><Target size={16}/>Đặt mục tiêu</Button></CollapsibleCard>}
  </>}
  {!!store.planningLinks?.length&&<CollapsibleCard title="Kế hoạch hỗ trợ mục tiêu" storageKey="plan-goal-links">{store.planningLinks.map(link=><div className="list-row" key={link.goalId+link.planId}><PrivateText>{store.plans.find(p=>p.id===link.planId)?.name}</PrivateText><span>→ <PrivateText>{store.goals.find(g=>g.id===link.goalId)?.name}</PrivateText></span></div>)}</CollapsibleCard>}
  {!!archived.length&&<CollapsibleCard title="Đã lưu trữ" storageKey={'plan-archived-'+section}>{archived.map(i=><div className="list-row" key={i.id}><PrivateText>{i.name}</PrivateText><Badge tone="unknown">Đã lưu trữ</Badge></div>)}</CollapsibleCard>}
 </div>;
}
