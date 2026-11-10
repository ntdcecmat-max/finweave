import {useEffect,useRef} from 'react';
import * as echarts from 'echarts/core';
import {LineChart,BarChart,CustomChart} from 'echarts/charts';
import {GridComponent,TooltipComponent,DataZoomComponent,MarkLineComponent,MarkPointComponent} from 'echarts/components';
import {SVGRenderer} from 'echarts/renderers';
import type {ForecastResult} from '../domain/forecast';
import type {Goal} from '../domain/model';
import {fmtDate,money} from '../domain/selectors';
import {useApp} from '../app/context';

echarts.use([LineChart,BarChart,CustomChart,GridComponent,TooltipComponent,DataZoomComponent,MarkLineComponent,MarkPointComponent,SVGRenderer]);
export type ForecastPlot='assets'|'cash'|'netWorth'|'flows'|'goal';
const noGoals:Goal[]=[];
const compact=(value:number)=>new Intl.NumberFormat('vi-VN',{notation:'compact',maximumFractionDigits:1}).format(value);
export function ForecastChart({result,plot,goal,goals=noGoals,selected,onSelect}:{result:ForecastResult;plot:ForecastPlot;goal?:Goal;goals?:Goal[];selected:number;onSelect:(i:number)=>void}){
 const ref=useRef<HTMLDivElement>(null),callback=useRef(onSelect),{masked}=useApp();callback.current=onSelect;
 const compare=plot!=='flows'&&plot!=='goal'&&result.points.some((p,i)=>Math.abs(p[plot].p50-result.counterfactual[i][plot].p50)>.5);
 useEffect(()=>{
  if(masked||!ref.current)return;
  const chart=echarts.init(ref.current,undefined,{renderer:'svg'}),points=result.points;
  const real=result.settings.realMoney,divide=(i:number)=>real?points[i].inflation:1;
  const data=points.map((p,i)=>{const band=plot==='goal'?p.goals[goal!.id]:p[plot==='netWorth'?'netWorth':plot==='cash'?'cash':'assets'];return [i,...[band.p10,band.p25,band.p50,band.p75,band.p90].map(v=>v/divide(i))];});
  const lines:any[]=[];
  const line=(name:string,values:number[],color:string,dashed=false)=>({name,type:'line',data:values,symbol:'none',lineStyle:{color,width:dashed?1.7:2.8,type:dashed?'dashed':'solid'},itemStyle:{color},z:4});
  const band=(name:string,lo:number,hi:number,fill:string)=>({name,type:'custom',silent:true,clip:true,data:[0],renderItem:(_params:any,api:any)=>({type:'polygon',shape:{points:[...data.map(row=>api.coord([row[0],row[lo]])),...data.slice().reverse().map(row=>api.coord([row[0],row[hi]]))]},style:{fill}}),z:1});
  if(plot==='flows'){
   const flows=result.central.map((f,i)=>{const previous=i?result.central[i-1]:null;return {income:f.income,expense:f.expense,invested:f.invested,debtPaid:f.debtPaid,change:previous?f.cash-previous.cash:0};});
   for(const [key,name,color,sign] of [['income','Thu nhập','#159b70',1],['expense','Chi tiêu','#e96972',-1],['invested','Đầu tư','#b398d4',-1],['debtPaid','Trả nợ','#dda752',-1]] as const)lines.push({name,type:'bar',stack:sign===1?'income':'out',data:flows.map((f,i)=>f[key]*sign/divide(i)),itemStyle:{color,borderRadius:2},barMaxWidth:18});
   lines.push(line('Thay đổi tiền',flows.map((f,i)=>f.change/divide(i)),'#284f69'));
  }else{
   lines.push(band('P10–P90',1,5,'rgba(71,151,214,.12)'),band('P25–P75',2,4,'rgba(71,151,214,.18)'));
   lines.push(line('P10',data.map(r=>r[1]),'#e07d89',true),line('Trung vị P50',data.map(r=>r[3]),'#287fac'),line('P90',data.map(r=>r[5]),'#8ab8d6',true));
   if(compare)lines.push(line('Trung vị chưa thêm kế hoạch',result.counterfactual.map((p,i)=>p[plot==='cash'?'cash':plot==='netWorth'?'netWorth':'assets'].p50/divide(i)),'#8b9697',true));
   if(goal&&plot==='goal'){
    const outcome=result.goals.find(g=>g.id===goal.id)!;
    const targets=points.map((p,i)=>(goal.projection?.criterion==='independence'?outcome.target*p.inflation/(points.find(p=>p.date===goal.due)?.inflation??1):Number(goal.target)*(goal.projection?.targetBasis==='today'?p.inflation:1))/divide(i));
    if(Math.max(...targets)<=Math.max(1,...data.map(r=>r[5]))*2)lines.push(line('Ngưỡng mục tiêu',targets,'#c39246',true));
   }
   const markers=goals.filter(g=>g.due>=points[0].date&&g.due<=result.horizon).map(g=>{const i=points.findIndex(p=>p.date===g.due);return i<0?null:{name:g.name,coord:[i,data[i][3]],value:'◆',symbol:'circle',symbolSize:26,itemStyle:{color:'#a28ac7'},label:{color:'#fff',fontSize:14}};}).filter(Boolean);
   if(markers.length)lines[lines.findIndex(s=>s.name==='Trung vị P50')].markPoint={data:markers};
  }
  chart.setOption({animation:false,grid:{left:64,right:20,top:28,bottom:60,containLabel:false},tooltip:{trigger:'axis',renderMode:'richText',confine:true,backgroundColor:'#fff',borderColor:'#dce6e1',textStyle:{fontSize:12,color:'#25463c'},formatter:(params:any[])=>{
   const i=Number(params[0]?.dataIndex??0);callback.current(i);
   const p=points[i];if(!p)return '';
   return fmtDate(p.date)+'\n'+params.filter(x=>x.seriesType!=='custom').map(x=>`${x.seriesName}: ${money(Math.round(x.value))}`).join('\n');
  }},xAxis:{type:'category',data:points.map(p=>p.date),boundaryGap:plot==='flows',axisLine:{lineStyle:{color:'#dee7e3'}},axisTick:{show:false},axisLabel:{color:'#7b8d86',fontSize:11,hideOverlap:true,formatter:(date:string)=>date.slice(5,7)+'/'+date.slice(0,4)},splitLine:{show:false}},yAxis:{type:'value',scale:true,axisLabel:{color:'#7b8d86',fontSize:11,formatter:compact},splitNumber:4,splitLine:{lineStyle:{type:'dashed',color:'#e3eae6'}},axisLine:{show:false}},dataZoom:points.length>18?[{type:'inside',filterMode:'none',zoomOnMouseWheel:'ctrl',moveOnMouseWheel:false},{type:'slider',bottom:0,height:18,borderColor:'transparent',fillerColor:'rgba(39,127,172,.12)',textStyle:{fontSize:10},showDataShadow:false}]:[],series:lines});
  chart.on('click',(params:any)=>{if(typeof params.dataIndex==='number'&&params.seriesType!=='custom')callback.current(params.dataIndex);});
  const observer=new ResizeObserver(()=>chart.resize());observer.observe(ref.current);return()=>{observer.disconnect();chart.dispose();};
 },[result,plot,goal,goals,masked,compare]);
 if(masked)return <div className="privacy-placeholder">Biểu đồ tài chính đã ẩn</div>;
 return <div className="forecast-visual"><div className="forecast-legend">{plot==='flows'?<><span><i style={{background:'#159b70'}}/>Thu nhập</span><span><i style={{background:'#e96972'}}/>Chi tiêu</span><span><i style={{background:'#b398d4'}}/>Đầu tư</span></>:<><span><i style={{background:'#287fac'}}/>Trung vị P50</span><span><i style={{background:'#c7deed'}}/>Vùng P10–P90</span><span><i style={{background:'#8caac4'}}/>Vùng P25–P75</span>{compare&&<span><i style={{background:'#9ba5a0'}}/>Chưa thêm kế hoạch</span>}</>}</div><div className="forecast-chart" ref={ref} role="img" aria-label={plot==='flows'?'Thu nhập, chi tiêu, đầu tư và thay đổi tiền trong từng khoảng dự báo':'Phân bố kết quả dự báo với vùng P10–P90 và đường trung vị. Chọn ngày bằng thanh trượt bên dưới.'}/><label className="forecast-date-slider">Khám phá tại {fmtDate(result.points[selected]?.date??result.horizon)}<input type="range" min={0} max={result.points.length-1} value={selected} onChange={e=>onSelect(Number(e.target.value))} aria-label="Chọn ngày xem dự báo"/></label></div>;
}
