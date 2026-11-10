import {useEffect,useId,useMemo,useRef,useState} from 'react';
import * as echarts from 'echarts/core';
import {SankeyChart} from 'echarts/charts';
import {TooltipComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import {EyeOff,GitBranch,Table2} from 'lucide-react';
import type {Event} from '../domain/model';
import {cashflowGraph} from '../domain/cashflow';
import {D,money} from '../domain/selectors';
import {useApp,MoneyValue,PrivateText} from '../app/context';
import './cashflow.css';

echarts.use([SankeyChart,TooltipComponent,SVGRenderer]);
export function CashflowChart({events,scope,period,onDrill}:{events:Event[];scope:string[];period:string;onDrill:(filter:Record<string,string>)=>void}){
 const{masked}=useApp();const id=useId();const ref=useRef<HTMLDivElement>(null);
 const[grouping,setGrouping]=useState<'category'|'group'>('category'),[view,setView]=useState<'flow'|'table'>('flow');
 const graph=useMemo(()=>cashflowGraph(events,scope,grouping),[events,scope,grouping]);
 const percentage=(value:string)=>D(graph.volume).isZero()?'—':D(value).div(graph.volume).mul(100).toFixed(1)+'%';
 useEffect(()=>{
  if(masked||view!=='flow'||!ref.current||!graph.nodes.length)return;
  const chart=echarts.init(ref.current,undefined,{renderer:'svg'});
  const byName=new Map(graph.nodes.map(node=>[node.name,node]));
  chart.setOption({animation:!matchMedia('(prefers-reduced-motion: reduce)').matches,animationDuration:250,tooltip:{trigger:'item',renderMode:'richText',confine:true,formatter:(params:any)=>{
   if(params.dataType==='edge')return `${byName.get(params.data.source)?.label} → ${byName.get(params.data.target)?.label}\n${money(params.data.value)}`;
   const node=byName.get(params.name);return node?`${node.label}\n${money(node.value)} · ${percentage(node.value)}${node.name.startsWith('balance-')?'\n'+node.note:''}`:'';
  }},series:[{type:'sankey',left:12,right:18,top:24,bottom:24,nodeWidth:12,nodeGap:44,nodeAlign:'left',draggable:false,layoutIterations:32,emphasis:{focus:'adjacency'},lineStyle:{color:'gradient',opacity:.28,curveness:.5},label:{color:'#26362d',fontFamily:'Segoe UI, Arial, sans-serif',fontSize:12,lineHeight:19,formatter:(params:any)=>{
   const node=byName.get(params.name);return node?`${node.label}\n${money(node.value)} (${percentage(node.value)})`:'';
  }},data:graph.nodes.map(node=>({...node,value:Number(node.value),itemStyle:{color:node.color,borderWidth:0},label:{position:node.depth>=2?'left':'right',distance:8}})),links:graph.links}]});
  chart.on('click',(params:any)=>{const name=params.dataType==='edge'?params.data.target:params.name;const node=byName.get(name);if(node?.filter)onDrill(node.filter);});
  const observer=new ResizeObserver(()=>chart.resize());observer.observe(ref.current);return()=>{observer.disconnect();chart.dispose();};
 },[graph,masked,view,onDrill]);
 const table=<div className="table-wrap"><table className="cashflow-table"><caption className="sr-only">Nguồn và phân bổ dòng tiền · {period}</caption><thead><tr><th>Nguồn / nhóm</th><th className="num">Số tiền</th><th className="num">Tỷ trọng luồng</th></tr></thead><tbody>{graph.nodes.filter(node=>node.name!=='cash-pool').map(node=><tr key={node.name}><td><span className="cashflow-table-label" style={{paddingLeft:node.depth===3?18:0}}><span className="dot" style={{background:node.color}}/>{node.filter?<button className="table-btn" onClick={()=>onDrill(node.filter!)}><PrivateText>{node.label}</PrivateText></button>:<PrivateText>{node.label}</PrivateText>}</span></td><td className="num"><MoneyValue value={node.value}/></td><td className="num">{masked?'•••':percentage(node.value)}</td></tr>)}</tbody></table></div>;
 return <div className="cashflow-view">
  <div className="cashflow-metrics">{[{label:'Tiền vào',value:graph.inflow,tone:'income'},{label:'Tiền ra',value:graph.outflow,tone:'expense'},{label:'Thay đổi số dư',value:graph.change,tone:D(graph.change).isNegative()?'expense':'income'}].map(metric=><div key={metric.label}><span>{metric.label}</span><strong className={'cashflow-'+metric.tone}><MoneyValue value={metric.value}/></strong></div>)}</div>
  <div className="cashflow-toolbar"><div><p className="eyebrow">DÒNG TIỀN TRONG KỲ</p><p className="cashflow-period">{period}</p></div><div className="cashflow-controls"><label className="sr-only" htmlFor={id}>Phân nhóm dòng tiền</label><select id={id} value={grouping} onChange={event=>setGrouping(event.target.value as 'category'|'group')}><option value="category">Theo nhóm & danh mục</option><option value="group">Theo nhóm</option></select><div className="cashflow-view-toggle" role="group" aria-label="Cách xem dòng tiền"><button type="button" aria-label="Sơ đồ dòng tiền" aria-pressed={view==='flow'} title="Sơ đồ dòng tiền" onClick={()=>setView('flow')}><GitBranch size={18}/></button><button type="button" aria-label="Bảng dòng tiền" aria-pressed={view==='table'} title="Bảng dòng tiền" onClick={()=>setView('table')}><Table2 size={18}/></button></div></div></div>
  {!graph.nodes.length?<div className="cashflow-empty">Chưa có dòng tiền đã ghi sổ trong kỳ và phạm vi này.</div>:view==='table'?table:masked?<div key="privacy" className="privacy-placeholder"><EyeOff size={20}/>Biểu đồ đã ẩn cùng số tiền</div>:<div key="chart" className="cashflow-scroll" tabIndex={0} role="region" aria-label="Sơ đồ dòng tiền, có thể cuộn ngang"><div className="cashflow-sankey" ref={ref} style={{height:Math.max(430,graph.nodes.filter(node=>node.depth===3).length*70)}} aria-hidden="true"/></div>}
  <p className="meta muted cashflow-note">Tiền vào được phân bổ sang tiền ra và phần tăng số dư. Chuyển giữa các tài khoản trong phạm vi được loại trừ. Hoàn tiền được tính ở tiền vào.</p>
  {view==='flow'&&graph.nodes.length>0&&<details className="chart-table"><summary>Xem bảng dòng tiền và mở chi tiết</summary>{table}</details>}
 </div>;
}
