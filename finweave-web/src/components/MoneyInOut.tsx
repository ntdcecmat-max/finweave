import {useEffect,useMemo,useRef,useState} from 'react';
import * as echarts from 'echarts/core';
import {BarChart} from 'echarts/charts';
import {GridComponent,TooltipComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import {ChevronDown,EyeOff} from 'lucide-react';
import {useApp,MoneyValue,PrivateText} from '../app/context';
import {D,eligible,fmtDate,money,previousDay,snapshot,sum} from '../domain/selectors';
import './money-in-out.css';

echarts.use([BarChart,GridComponent,TooltipComponent,SVGRenderer]);
export const shiftMonth=(month:string,offset:number)=>{const [year,m]=month.split('-').map(Number);return new Date(Date.UTC(year,m-1+offset,1)).toISOString().slice(0,7);};
const monthLabel=(month:string)=>`Tháng ${Number(month.slice(5))}/${month.slice(0,4)}`;

export function MoneyInOut(){
 const{store,period,masked}=useApp();
 const defaultMonth=(store&&store.clock.slice(0,10)<period.end?store.clock.slice(0,10):previousDay(period.end)).slice(0,7);
 const[anchor,setAnchor]=useState(defaultMonth),[selected,setSelected]=useState(defaultMonth),[account,setAccount]=useState('scope');
 const[showExpense,setShowExpense]=useState(false),[showIncome,setShowIncome]=useState(false);
 const ref=useRef<HTMLDivElement>(null);
 useEffect(()=>{setAnchor(defaultMonth);setSelected(defaultMonth);},[defaultMonth,period.start,period.end]);
 const scope=account==='scope'||!period.scope.includes(account)?period.scope:[account];
 const scopeKey=scope.join(',');
 const months=useMemo(()=>store?Array.from({length:6},(_,i)=>{
  const month=shiftMonth(anchor,i-5),end=shiftMonth(month,1)+'-01';
  const snap=snapshot(store,{start:month+'-01',end,label:monthLabel(month),scope:scopeKey.split(',').filter(Boolean)});
  return{month,snap,available:end>store.tracking&&month+'-01'<=store.clock.slice(0,10)};
 }):[],[store,anchor,scopeKey]);
 const current=months.find(m=>m.month===selected)||months.at(-1);
 useEffect(()=>{
  if(masked||!ref.current||!months.length)return;
  const chart=echarts.init(ref.current,undefined,{renderer:'svg'});
  chart.setOption({animation:!matchMedia('(prefers-reduced-motion: reduce)').matches,animationDuration:200,
   grid:{left:18,right:18,top:26,bottom:8},
   tooltip:{trigger:'axis',renderMode:'richText',confine:true,axisPointer:{type:'shadow'},formatter:(items:any[])=>{
    const row=months[items[0]?.dataIndex];return row?`${monthLabel(row.month)}\n${row.available?`Thu nhập: ${money(row.snap.income)}\nChi tiêu: ${money(row.snap.net)}`:'Chưa có dữ liệu theo dõi'}`:'';
   }},
   xAxis:{type:'category',data:months.map(m=>m.month),axisLine:{show:false},axisTick:{show:false},axisLabel:{show:false,interval:0,color:'#788079',fontSize:12,formatter:(m:string)=>m===selected?`{selected|${monthLabel(m)}}`:monthLabel(m),rich:{selected:{color:'#173f32',fontWeight:700}}},triggerEvent:true},
   yAxis:{type:'value',show:false},
   series:[{name:'Thu nhập',key:'income',color:'#07945b'},{name:'Chi tiêu',key:'net',color:'#dc4545'}].map(s=>({name:s.name,type:'bar',barMaxWidth:40,barGap:'18%',itemStyle:{borderRadius:[4,4,0,0]},data:months.map(m=>({value:m.available?Number(m.snap[s.key as 'income'|'net']):null,itemStyle:{color:s.color,opacity:m.month===selected ? .85 : .35}}))}))
  });
  chart.on('click',(event:any)=>{const month=event.componentType==='xAxis'?event.value:months[event.dataIndex]?.month;if(month)setSelected(month);});
  const observer=new ResizeObserver(()=>chart.resize());observer.observe(ref.current);
  return()=>{observer.disconnect();chart.dispose();};
 },[months,selected,masked]);
 if(!store||!current)return null;
 const categories=(kind:'income'|'expense')=>{
  if(kind==='expense')return current.snap.cats.map(c=>({name:c.name,value:c.net}));
  const rows=current.snap.events.filter(e=>eligible(e)&&e.kind==='income');
  return [...new Set(rows.map(e=>e.category))].map(name=>({name,value:sum(rows.filter(e=>e.category===name).map(e=>D(e.amount).mul(e.reversal?-1:1)))}));
 };
 const start=selected+'-01'>store.tracking?selected+'-01':store.tracking;
 const end=previousDay(shiftMonth(selected,1)+'-01')<store.clock.slice(0,10)?previousDay(shiftMonth(selected,1)+'-01'):store.clock.slice(0,10);
 return <div className="money-in-out">
  <div className="money-flow-toolbar"><span className="muted">{current.available?`${fmtDate(start)} – ${fmtDate(end)}`:monthLabel(selected)}</span><div className="money-flow-controls"><label><span className="sr-only">Tháng xem thu chi</span><input type="month" value={anchor} max={store.clock.slice(0,7)} onChange={e=>{if(/^\d{4}-\d{2}$/.test(e.target.value)){setAnchor(e.target.value);setSelected(e.target.value);}}}/></label><label><span className="sr-only">Tài khoản xem thu chi</span><select value={scope.length===1&&account!=='scope'?account:'scope'} onChange={e=>setAccount(e.target.value)}><option value="scope">{period.scope.length===store.accounts.filter(a=>!a.archived).length?'Tất cả tài khoản':'Phạm vi đã chọn'}</option>{store.accounts.filter(a=>period.scope.includes(a.id)).map(a=><option key={a.id} value={a.id}>{masked?'Tài khoản '+a.id:a.name}</option>)}</select></label></div></div>
  <div className="money-flow-legend"><span><i className="income-dot"/>Thu nhập</span><span><i className="expense-dot"/>Chi tiêu</span><span className="muted">6 tháng gần nhất</span></div>
  {masked?<div key="privacy" className="privacy-placeholder"><EyeOff size={20}/>Biểu đồ đã ẩn cùng số tiền</div>:<div key="chart" className="money-flow-chart-scroll"><div className="money-flow-chart" ref={ref} aria-hidden="true"/></div>}
  <div className="money-flow-months" role="group" aria-label="Chọn tháng xem chi tiết">{months.map(m=><button key={m.month} type="button" aria-pressed={m.month===selected} onClick={()=>setSelected(m.month)}>{monthLabel(m.month)}</button>)}</div>
  <div className="money-flow-balance"><span><strong>{monthLabel(current.month)}</strong><span className="muted">Chênh lệch thu chi</span></span><strong className={D(current.snap.income).minus(current.snap.net).isNegative()?'expense-text':'income-text'}><MoneyValue value={current.available?D(current.snap.income).minus(current.snap.net).toFixed(0):null}/></strong></div>
  {([{kind:'income',label:'Chi tiết thu nhập',open:showIncome,setOpen:setShowIncome,value:current.snap.income},{kind:'expense',label:'Chi tiết chi tiêu',open:showExpense,setOpen:setShowExpense,value:current.snap.net}] as const).map(detail=><section className="money-flow-detail" key={detail.kind}><button type="button" className="money-flow-detail-toggle" aria-expanded={detail.open} aria-controls={`money-flow-${detail.kind}`} onClick={()=>detail.setOpen(!detail.open)}><span><i className={detail.kind+'-dot'}/>{detail.label}</span><span className={detail.kind+'-text'}><MoneyValue value={current.available?detail.value:null}/><ChevronDown size={18} style={{transform:detail.open?'rotate(180deg)':'rotate(-90deg)'}}/></span></button><div id={`money-flow-${detail.kind}`} hidden={!detail.open} className="money-flow-detail-body">{!current.available?<p className="muted small">Chưa có dữ liệu theo dõi trong tháng này.</p>:<>{detail.kind==='expense'&&<p className="muted small">Chi gộp: <MoneyValue value={current.snap.gross}/> · Hoàn tiền: <MoneyValue value={current.snap.refund}/> · Chi tiêu đã trừ hoàn tiền.</p>}{categories(detail.kind).length?<ul>{categories(detail.kind).map(c=><li key={c.name}><PrivateText>{c.name}</PrivateText><strong className={detail.kind+'-text'}><MoneyValue value={c.value}/></strong></li>)}</ul>:<p className="muted small">Chưa có {detail.kind==='income'?'thu nhập':'chi tiêu'} trong tháng này.</p>}</>}</div></section>)}
 </div>;
}
