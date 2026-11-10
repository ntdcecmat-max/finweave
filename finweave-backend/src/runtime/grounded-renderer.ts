import {goalDTO,planForecast,dateAt,metric} from '../engine/business.ts';
const summaries:Record<string,string>={FACTS_EXPLAINED:'Các chỉ số và bằng chứng đã được đối chiếu. Định giá tài sản được tách khỏi dòng tiền.',DRAFT_READY:'Bản nháp có mô phỏng có điều kiện. Xem thay đổi và xác nhận Plan/Goals trước khi áp dụng.',INFEASIBLE:'Các phương án đã thử chưa đáp ứng ràng buộc. Cần xem cảnh báo và chọn thay đổi giả định.',PARTIAL:'Chưa đủ bằng chứng để kết luận đầy đủ. Giữ nguyên dữ liệu và các ràng buộc đã xác nhận.',NO_DATA:'Phạm vi chưa có dữ liệu để phân tích.',NEEDS_REVIEW:'Có bằng chứng cần xem xét. Đề xuất Review chưa thay đổi dữ liệu thực tế.'};
export function renderGrounded(conclusion:string,results:any[],refs:string[],mode:string){
 const selected=refs.map(ref=>{const r=results.find(x=>x.ref===ref);if(!r)throw Error('INVALID_DECISION');return r;});
 const metrics:any[]=[];
 const visit=(value:any,path:string,ref:string)=>{
  if(!value||typeof value!=='object')return;
  if(['actual','planned','simulated','unknown'].includes(value.classification)&&value.quality&&Object.hasOwn(value,'value')){
   metrics.push({label:path.slice(0,100),...value,evidenceIds:[ref]});return;
  }
  if(Array.isArray(value)){value.forEach((x,n)=>visit(x,path+'.'+n,ref));return;}
  for(const [key,x]of Object.entries(value))visit(x,path?path+'.'+key:key,ref);
 };
 selected.forEach(r=>visit(r.value,r.capability,r.ref));
 return {rendererVersion:'FW-GROUNDED-002',text:summaries[conclusion]??'Kết quả chưa hoàn tất. Xem trạng thái và bằng chứng đã lưu.',mode,metrics,evidenceRefs:refs};
}
export function assistantMetrics(f:any,snap:any,ctx:any,now:number,simulation:any=null){
 if(ctx.selected?.type==='goal'){
  const row=f.goals.find((g:any)=>g.id===ctx.selected.id),goal=goalDTO(f,row,now);
  return {tool:'goals',metrics:[{label:'Tiền đã dành thực tế',...goal.funded},{label:'Còn cần dành',...metric(BigInt(goal.shortfall.value),now,'planned')}]};
 }
 if(simulation)return {tool:'simulation',metrics:['cash','assets','goalFunded','netExpense'].map(k=>({label:k,...simulation[k]}))};
 if(ctx.navigation==='plan'){
  const x=planForecast(f,snap,dateAt(now),now);
  return {tool:'plans',metrics:[{label:'Tiền hiện tại',...x.actualCash},{label:'Tiền theo kế hoạch',...x.forecastCash}]};
 }
 return {tool:ctx.selected?.type==='holding'?'portfolio':'reports',metrics:[{label:'Tiền trong phạm vi',...snap.cash},{label:'Tài sản định giá trong phạm vi',...snap.assets},{label:'Thu nhập trong kỳ',...snap.income},{label:'Chi tiêu ròng trong kỳ',...snap.netExpense}]};
}
