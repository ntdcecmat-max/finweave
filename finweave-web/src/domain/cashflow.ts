import type {Event} from './model';
import {D,eligible,movement} from './selectors';

export type FlowNode={name:string;label:string;value:string;color:string;depth:number;filter?:Record<string,string>;note?:string};
export type FlowLink={source:string;target:string;value:number};
export type CashflowGraph={nodes:FlowNode[];links:FlowLink[];inflow:string;outflow:string;change:string;volume:string};
const palette=['#e9ad30','#cf4796','#6574cd','#e27658','#47a99c','#aa80c4','#a4a24c'];

/** A balanced view of posted cash movements. Internal transfers cancel across scope. */
export function cashflowGraph(events:Event[],scope:string[],grouping:'category'|'group'='category'):CashflowGraph{
 const sources=new Map<string,FlowNode>(),groups=new Map<string,FlowNode>(),leaves=new Map<string,FlowNode>();
 let inflow=D(),outflow=D();
 const add=(map:Map<string,FlowNode>,node:FlowNode)=>{const old=map.get(node.name);map.set(node.name,{...node,color:old?.color||node.color,value:D(old?.value||0).plus(node.value).toFixed(0)});};
 for(const event of events.filter(eligible)){
  const amount=scope.reduce((sum,id)=>sum.plus(movement(event,id)),D());if(amount.isZero())continue;
  const category=event.category||'Chưa phân loại';
  if(amount.isPositive()){
   inflow=inflow.plus(amount);
   const label=event.kind==='income'?category:event.kind==='refund'?'Hoàn tiền':event.kind==='transfer'?'Chuyển vào phạm vi':event.kind==='expense'?'Đảo khoản chi':event.kind==='investment'?'Đảo đầu tư':'Điều chỉnh tăng & thu khác';
   const name='in:'+event.kind+':'+(event.kind==='income'?category:'all');
   add(sources,{name,label,value:amount.toFixed(0),color:event.kind==='refund'?'#6385c5':'#0b9cbb',depth:0,filter:{type:event.kind,...(event.kind==='income'?{category}:{})}});
  }else{
   outflow=outflow.plus(amount.abs());
   const group=event.kind==='expense'?'Chi tiêu':event.kind==='investment'?'Đầu tư':event.kind==='transfer'?'Chuyển ra phạm vi':event.kind==='income'?'Đảo thu nhập':event.kind==='refund'?'Đảo hoàn tiền':'Điều chỉnh giảm & chi khác';
   const name='out:'+group,color=event.kind==='expense'?'#e4ac32':event.kind==='investment'?'#8b6bb9':event.kind==='transfer'?'#499fb2':'#da7c66';
   add(groups,{name,label:group,value:amount.abs().toFixed(0),color,depth:2,filter:{type:event.kind}});
   add(leaves,{name:name+':'+category,label:category,value:amount.abs().toFixed(0),color:palette[leaves.size%palette.length],depth:3,filter:{type:event.kind,category},note:name});
  }
 }
 const change=inflow.minus(outflow),volume=inflow.greaterThan(outflow)?inflow:outflow,nodes:FlowNode[]=[...sources.values()],links:FlowLink[]=[];
 if(volume.isZero())return {nodes:[],links:[],inflow:'0',outflow:'0',change:'0',volume:'0'};
 if(change.isNegative())nodes.push({name:'balance-decrease',label:'Giảm số dư',value:change.abs().toFixed(0),color:'#b78664',depth:0,note:'Phần tiền ra vượt tiền vào trong kỳ.'});
 for(const node of nodes)links.push({source:node.name,target:'cash-pool',value:Number(node.value)});
 nodes.push({name:'cash-pool',label:'Dòng tiền',value:volume.toFixed(0),color:'#329954',depth:1});
 if(change.isPositive()){
  nodes.push({name:'balance-increase',label:'Tăng số dư',value:change.toFixed(0),color:'#329954',depth:2,note:'Tiền vào trừ tiền ra trong kỳ; không phải số dư cuối kỳ.'});
  links.push({source:'cash-pool',target:'balance-increase',value:change.toNumber()});
 }
 for(const node of groups.values()){nodes.push(node);links.push({source:'cash-pool',target:node.name,value:Number(node.value)});}
 if(grouping==='category')for(const node of leaves.values()){nodes.push(node);links.push({source:node.note!,target:node.name,value:Number(node.value)});}
 return {nodes,links,inflow:inflow.toFixed(0),outflow:outflow.toFixed(0),change:change.toFixed(0),volume:volume.toFixed(0)};
}
