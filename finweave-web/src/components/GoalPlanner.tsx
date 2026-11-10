import {useMemo,useState} from 'react';
import {ChevronLeft,ChevronRight,House,Shield,Plane,Flag,Target,GraduationCap,TreePalm} from 'lucide-react';
import type {Store,Goal} from '../domain/model';
import {day,fmtDate} from '../domain/selectors';
import {forecastBaseline,forecastMoney,goalSchedule,shiftMonth,simulateForecast} from '../domain/forecast';
import {useForecast} from '../app/forecast-context';
import {useApp,MoneyValue,PrivateText} from '../app/context';
import {Button} from './ui';
const icons={target:Target,house:House,shield:Shield,travel:Plane,flag:Flag,graduation:GraduationCap,retirement:TreePalm};
export function GoalIcon({goal}:{goal:Goal}){const Icon=icons[goal.projection?.icon??'target'];return <Icon size={21}/>;}
export function GoalTemplates({store,onCreate}:{store:Store;onCreate:(fields:Record<string,string>)=>void}){
 const {settings}=useForecast(),baseline=forecastBaseline(store),expense=Number(settings.expense??baseline.expense),income=Number(settings.income??baseline.income);
 const now=day(store.clock),next=shiftMonth(now.slice(0,7)+'-01',1),contribution=forecastMoney(Math.max(0,income-expense)*.4);
 const templates=[{name:'Quỹ dự phòng',icon:Shield,key:'shield',target:Math.max(expense*6,1000000),months:12,description:'6 tháng chi tiêu, giữ bằng tiền',criterion:'savings',profile:'cash'},
  {name:'Mua nhà',icon:House,key:'house',target:500000000,months:60,description:'Tích lũy cho khoản trả trước',criterion:'savings',profile:'balanced'},
  {name:'Cột mốc 1 tỷ',icon:Flag,key:'flag',target:1000000000,months:120,description:'Theo dõi tổng tài sản',criterion:'assets',profile:'balanced'},
  {name:'Độc lập tài chính',icon:TreePalm,key:'retirement',target:Math.max(1,expense*12*25),months:240,description:'Tài sản ròng ≥ 25 năm chi tiêu',criterion:'independence',profile:'growth'}];
 return <div className="goal-template-grid">{templates.map(t=><button className={'goal-template goal-template-'+t.key} key={t.key} onClick={()=>onCreate({name:t.name,icon:t.key,target:forecastMoney(t.target),criterion:t.criterion,profile:t.profile,due:shiftMonth(now,t.months),targetBasis:'today',expenseMultiple:'25',liquidMonths:t.criterion==='independence'?'6':'0',contribution:Number(contribution)>0?contribution:'',contributionStart:next,contributionDay:'15'})}><span><t.icon size={22}/></span><strong>{t.name}</strong><small>{t.description}</small><b>Đặt mục tiêu →</b></button>)}</div>;
}

export function GoalCalendar({store,onEdit,onAllocate}:{store:Store;onEdit:(id:string)=>void;onAllocate:(id:string)=>void}){
 const now=day(store.clock),[month,setMonth]=useState(now.slice(0,7)+'-01'),[chosen,setChosen]=useState(now),{masked}=useApp();
 const goals=store.goals.filter(g=>g.status!=='archived'),end=shiftMonth(month,1),lastDay=Number(new Date(Date.parse(end+'T00:00:00Z')-86400000).toISOString().slice(8,10));
 const first=(new Date(month+'T00:00:00Z').getUTCDay()+6)%7;
 const entries=goals.flatMap(g=>[
  ...goalSchedule(g,now,shiftMonth(now,360)).filter(r=>r.date>=month&&r.date<end).map(r=>({date:r.date,goal:g,amount:r.amount,type:'planned' as const})),
  ...g.allocations.filter(a=>a.date&&a.date>=month&&a.date<end).map(a=>({date:a.date!,goal:g,amount:Number(a.amount),type:'actual' as const})),
  ...(g.due>=month&&g.due<end?[{date:g.due,goal:g,amount:Number(g.target),type:'due' as const}]:[])
 ]).sort((a,b)=>a.date.localeCompare(b.date));
 const active=entries.filter(e=>e.date===chosen),next=goals.flatMap(g=>goalSchedule(g,now,shiftMonth(now,360)).map(r=>({...r,goal:g}))).sort((a,b)=>a.date.localeCompare(b.date))[0];
 const move=(n:number)=>{const date=shiftMonth(month,n);setMonth(date);setChosen(date);};
 return <div className="goal-calendar-layout"><section className="goal-calendar"><div className="row between"><h3>Lịch mục tiêu</h3><div className="row"><Button className="icon-btn" aria-label="Tháng trước" onClick={()=>move(-1)}><ChevronLeft size={17}/></Button><strong>{month.slice(5,7)}/{month.slice(0,4)}</strong><Button className="icon-btn" aria-label="Tháng sau" onClick={()=>move(1)}><ChevronRight size={17}/></Button></div></div><div className="goal-calendar-days">{['T2','T3','T4','T5','T6','T7','CN'].map(d=><span key={d} className="calendar-weekday">{d}</span>)}{Array.from({length:first},(_,i)=><span key={'blank'+i}/>)}{Array.from({length:lastDay},(_,i)=>{const date=month.slice(0,8)+String(i+1).padStart(2,'0'),rows=entries.filter(e=>e.date===date);return <button key={date} aria-label={fmtDate(date)+', '+rows.length+' mốc'} aria-pressed={chosen===date} className={date===now?'is-today':''} onClick={()=>setChosen(date)}><span>{i+1}</span><i className="calendar-dots">{!masked&&['actual','planned','due'].filter(kind=>rows.some(e=>e.type===kind)).map(kind=><b key={kind} className={'calendar-dot '+kind}/>)}</i></button>;})}</div><div className="forecast-legend"><span><i style={{background:'#279c72'}}/>Đã góp</span><span><i style={{background:'#9e83d0'}}/>Lịch góp</span><span><i style={{background:'#e8b55c'}}/>Hạn mục tiêu</span></div></section><section className="goal-agenda"><p className="eyebrow">{fmtDate(chosen)}</p><h3>Việc cần làm</h3>{active.length?active.map((e,i)=><div className="goal-agenda-item" key={i}><span className={'goal-agenda-icon '+e.type}><GoalIcon goal={e.goal}/></span><div><strong><PrivateText>{e.goal.name}</PrivateText></strong><p className="small muted">{e.type==='actual'?'Đã dành tiền':e.type==='planned'?'Khoản góp dự kiến':'Hạn hoàn thành'} · <MoneyValue value={forecastMoney(e.amount)}/></p><Button variant="ghost" onClick={()=>e.type==='planned'?onAllocate(e.goal.id):onEdit(e.goal.id)}>{e.type==='planned'?'Dành tiền hiện có':'Xem mục tiêu'} →</Button></div></div>):<p className="small muted">Chưa có mốc trong ngày này. Chọn ngày có dấu chấm để xem chi tiết.</p>}{next&&<div className="goal-next-action"><span className="eyebrow">LẦN GÓP TIẾP THEO · {fmtDate(next.date)}</span><strong><PrivateText>{next.goal.name}</PrivateText></strong><MoneyValue value={forecastMoney(next.amount)}/><Button onClick={()=>onAllocate(next.goal.id)}>Dành tiền cho mục tiêu</Button><p className="meta muted">Chỉ thực hiện khi nguồn hiện có đủ tiền.</p></div>}</section></div>;
}

export function GoalMilestones({store,onEdit}:{store:Store;onEdit:(id:string)=>void}){
 const {settings}=useForecast(),{masked}=useApp(),result=useMemo(()=>simulateForecast(store,settings),[store,settings]);
 const goals=store.goals.filter(g=>g.status!=='archived');
 if(!goals.length)return <p className="small muted">Thêm mục tiêu để đánh dấu các cột mốc trên dự báo.</p>;
 return <div className="goal-milestones">{goals.map(g=>{const outcome=result.goals.find(x=>x.id===g.id)!,criterion=g.projection?.criterion??'savings';return <div className="goal-milestone" key={g.id}><button className="goal-milestone-name" onClick={()=>onEdit(g.id)}><GoalIcon goal={g}/><strong><PrivateText>{g.name}</PrivateText></strong></button><div className="goal-condition"><small>Điều kiện</small><strong>{criterion==='savings'?'Tiền dành riêng':criterion==='assets'?'Tổng tài sản':'Tài sản ròng'}</strong></div><span className="goal-condition-operator">≥</span><div className="goal-condition"><small>{criterion==='independence'?`${g.projection?.expenseMultiple??25} năm chi tiêu`:'Ngưỡng mục tiêu'}</small><MoneyValue value={g.target}/></div>{!!g.projection?.liquidMonths&&<span className="goal-condition-and">VÀ tiền ≥ {g.projection.liquidMonths} tháng chi</span>}<div className="goal-milestone-status"><span>{fmtDate(g.due)}</span><strong className={outcome.probability!==null&&outcome.probability<50?'expense':'income'}>{masked?'•••':outcome.outOfRange?'Ngoài kỳ dự báo':outcome.probability===null?'Thiếu dữ liệu':outcome.probability.toFixed(0)+'% đạt đích'}</strong></div></div>;})}<p className="meta muted">Tỷ lệ đạt đích có điều kiện theo mô hình hiện tại; thay đổi giả định để so sánh. Mỗi cột mốc đồng thời phải duy trì đủ tiền sinh hoạt.</p></div>;
}
