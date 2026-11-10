import type {Store} from '../domain/model';
import type {ActionSpec,Field} from '../components/ActionForm';
import {accountAvailable,day,money} from '../domain/selectors';
import {addDays,cleanAssetName,nextMonthEnd} from '../domain/planning';

type Option={value:string;label:string};
const text=(key:string,label:string,initial='',type:Field['type']='text',required=true):Field=>({key,label,initial,type,required});
const select=(key:string,label:string,options:Option[],initial?:string):Field=>({key,label,type:'select',options,required:true,initial:initial??options[0]?.value??''});
const options=(values:string[])=>values.map(value=>({value,label:value}));
export function planningAction(s:Store,kind:string,id?:string,defaultKind='income'):ActionSpec{
 const accounts=s.accounts.filter(a=>!a.archived).map(a=>({value:a.id,label:cleanAssetName(a.name)}));
 const holdings=s.holdings.filter(h=>!h.archived).map(h=>({value:h.id,label:cleanAssetName(h.name)+' · '+(h.kind==='gold'?'Vàng':'Cổ phiếu')}));
 const next=addDays(day(s.clock),1),end=nextMonthEnd(day(s.clock));
 const plan=s.plans.find(i=>i.id===id),goal=s.goals.find(g=>g.id===id);
 if(kind==='plan')return {kind,title:plan?'Điều chỉnh kế hoạch':defaultKind==='investment'?'Lập kế hoạch đầu tư':'Lập kế hoạch thu nhập & chi tiêu',data:{...(id?{id}:{}),reason:'Lưu kế hoạch'},description:'Lên lịch và xem dự tính tài chính trước khi lưu.',fields:[
  text('name','Tên kế hoạch',plan?.name),select('kind','Loại kế hoạch',options(['income','expense','investment']).map(o=>({...o,label:({income:'Thu nhập',expense:'Chi tiêu',investment:'Đầu tư'} as Record<string,string>)[o.value]})),plan?.kind??defaultKind),
  text('amount','Số tiền mỗi lần',plan?.amount??'','money'),select('account','Tài khoản',accounts,plan?.account),
  select('recurrence','Tần suất',[{value:'once',label:'Một lần'},{value:'monthly',label:'Hàng tháng'}],plan?.recurrence??'once'),text('date','Ngày bắt đầu',plan?.date??next,'date'),
  {...text('end','Ngày kết thúc',plan?.end??end,'date'),when:v=>v.recurrence==='monthly'},
  {...text('day','Ngày thực hiện mỗi tháng',String(plan?.day??Number(next.slice(-2)))),when:v=>v.recurrence==='monthly',hint:'Ngày 29–31 được chuyển về ngày cuối tháng nếu tháng đó ngắn hơn.'},
  {...select('category','Danh mục',options(['Khác','Ăn uống','Mua sắm','Đi lại','Nhà ở','Hóa đơn','Sức khỏe','Giải trí','Phí']),plan?.category??'Khác'),when:v=>v.kind!=='investment',optionsFor:v=>options([...new Set([...(v.kind==='income'?['Khác','Lương','Thưởng','Kinh doanh','Lãi đầu tư']:['Khác','Ăn uống','Mua sắm','Đi lại','Nhà ở','Hóa đơn','Sức khỏe','Giải trí','Phí']),...(plan?.category?[plan.category]:[])])])},
  {...select('holding','Tài sản muốn đầu tư',holdings,plan?.holding),when:v=>v.kind==='investment',hint:holdings.length?'Số lượng mua sẽ được dự tính theo giá hiện tại.':'Hãy thêm tài sản tại Tài khoản & Tài sản trước.'}
 ]};
 if(kind==='goal')return {kind,title:goal?'Điều chỉnh & dự tính mục tiêu':'Đặt mục tiêu',data:{...(id?{id}:{}),reason:'Lưu mục tiêu'},description:'Đặt số tiền đích, chọn lịch góp và xem khả năng hoàn thành.',fields:[
  text('name','Tên mục tiêu',goal?.name),
  select('criterion','Điều kiện hoàn thành',[{value:'savings',label:'Tích lũy riêng cho mục tiêu'},{value:'assets',label:'Đạt một mốc tổng tài sản'},{value:'independence',label:'Độc lập tài chính'}],goal?.projection?.criterion),
  {...text('target','Số tiền mục tiêu',goal?.target??'','money'),when:v=>v.criterion!=='independence'},
  {...text('expenseMultiple','Tài sản ròng bằng bao nhiêu năm chi tiêu',String(goal?.projection?.expenseMultiple??25)),when:v=>v.criterion==='independence',hint:'Ví dụ 25 năm chi tiêu. Ngưỡng được tính từ mức chi tiêu trong Giả định, có điều chỉnh lạm phát.'},
  text('due','Hạn hoàn thành',goal?.due??end,'date'),
  {...select('targetBasis','Cách hiểu số tiền mục tiêu',[{value:'nominal',label:'Số tiền tại thời điểm hoàn thành'},{value:'today',label:'Theo sức mua hiện tại'}],goal?.projection?.targetBasis),when:v=>v.criterion!=='independence'},
  select('profile','Phân bổ các khoản góp mới',[{value:'cash',label:'Giữ tiền · 100% tiền'},{value:'balanced',label:'Cân bằng · 20% tiền / 50% cổ phiếu / 30% vàng'},{value:'growth',label:'Tăng trưởng · 80% cổ phiếu / 20% vàng'}],goal?.projection?.profile),
  select('liquidMonths','Điều kiện kèm theo: tiền dự phòng',[{value:'0',label:'Không thêm điều kiện'},{value:'3',label:'Còn ít nhất 3 tháng chi tiêu'},{value:'6',label:'Còn ít nhất 6 tháng chi tiêu'},{value:'12',label:'Còn ít nhất 12 tháng chi tiêu'}],String(goal?.projection?.liquidMonths??0)),
  select('icon','Loại mục tiêu',[{value:'target',label:'Mục tiêu cá nhân'},{value:'shield',label:'Quỹ dự phòng'},{value:'house',label:'Mua nhà'},{value:'travel',label:'Du lịch'},{value:'flag',label:'Mốc tài sản'},{value:'graduation',label:'Học tập'},{value:'retirement',label:'Nghỉ hưu'}],goal?.projection?.icon),
  {...text('contribution','Góp dự kiến mỗi tháng',goal?.contributionSchedule?.amount??'','money',false),hint:'Có thể bỏ trống nếu bạn muốn dành một khoản tiền hiện có cho mục tiêu.'},
  {...select('contributionAccount','Tài khoản góp',accounts,goal?.contributionSchedule?.account),when:v=>!!v.contribution},
  {...text('contributionStart','Bắt đầu góp từ ngày',goal?.contributionSchedule?.start??next,'date'),when:v=>!!v.contribution},
  {...text('contributionDay','Ngày góp mỗi tháng',String(goal?.contributionSchedule?.day??Number(next.slice(-2)))),when:v=>!!v.contribution,hint:'Nếu ngày này đã qua trong tháng bắt đầu, lần góp đầu tiên sẽ ở tháng tiếp theo.'}
 ]};
 return {kind:'simulate',title:'Thử kịch bản cho mục tiêu',description:'So sánh tác động nếu dùng tiền hiện có để tiết kiệm, chi tiêu hoặc đầu tư.',fields:[
  select('goal','Mục tiêu',s.goals.filter(g=>g.status==='active').map(g=>({value:g.id,label:g.name})),id),
  select('mode','Cách sử dụng tiền',[{value:'save',label:'Dành tiền cho mục tiêu'},{value:'consume',label:'Chi tiền cho mục tiêu'},{value:'invest',label:'Chuyển tiền sang đầu tư'}]),
  {...select('account','Tài khoản nguồn',accounts),hint:accounts.map(a=>a.label+': '+money(accountAvailable(s,a.value))+' chưa dành cho mục tiêu').join(' · ')},
  text('amount','Số tiền mỗi lần','1000000','money'),text('count','Số lần thực hiện','1'),text('firstDate','Ngày thực hiện đầu tiên',next,'date'),
  {...text('intervalDays','Cách nhau bao nhiêu ngày','30'),when:v=>Number(v.count)>1},text('horizon','Tính đến ngày',goal&&goal.due>=next?goal.due:end,'date')
 ]};
}
