import Decimal from 'decimal.js';import type {Store,Period,Event,PlanItem} from './model';
Decimal.set({precision:30,rounding:Decimal.ROUND_HALF_UP});
export const D=(s:Decimal.Value=0)=>new Decimal(s);export const sum=(xs:Decimal.Value[])=>xs.reduce<Decimal>((a,b)=>a.plus(b),D()).toFixed(0);
export const money=(v:string|number|null)=>v===null?'Chưa biết':new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(typeof v==='string'&&/^-?\d+$/.test(v)?BigInt(v):Number(v))+' ₫';
export const quantityLabel=(v:string|null)=>{if(v===null)return 'Chưa biết';const [whole,fraction]=D(v).toFixed(8).split('.');const tail=fraction.replace(/0+$/,'');return new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(BigInt(whole))+(tail?','+tail:'');};export const day=(date:string|null)=>(date??'').slice(0,10);export const fmtDate=(date:string|null)=>date===null?'Chưa có':day(date).split('-').reverse().join('/');
export const isStale=(clock:string,time:string|null,hours:number)=>!time||new Date(clock).getTime()-new Date(time.includes('T')?time:time+'T18:00:00+07:00').getTime()>hours*3600000;
export function periodPreset(name:string,s:Store):Period{let start=s.clock.slice(0,7)+'-01',end=new Date(Date.UTC(Number(start.slice(0,4)),Number(start.slice(5,7)),1)).toISOString().slice(0,10),label='Tháng '+Number(start.slice(5,7))+'/'+start.slice(0,4);if(name==='quarter'){start='2026-10-01';end='2027-01-01';label='Quý IV/2026';}if(name==='year'){start='2026-01-01';end='2027-01-01';label='Năm 2026';}if(name==='nov'){start='2026-11-01';end='2026-12-01';label='Tháng 11/2026';}return {start,end,label,scope:s.accounts.filter(a=>!a.archived).map(a=>a.id)};}
export const eligible=(e:Event)=>e.posting==='posted'||e.posting==='reversed';
export function movement(e:Event,account:string):Decimal{if(!eligible(e))return D();let n=D(e.amount).mul(e.reversal?-1:1);if(e.kind==='transfer')return (e.account===account?n.neg():D()).plus(e.to===account&&!e.oneLeg?n:D());if(e.account!==account)return D();return ['expense','investment'].includes(e.kind)?n.neg():n;}
export function snapshot(s:Store,p:Period){
 const cutoff=day(s.clock)<p.end?day(s.clock)+'~':p.end;const active=s.accounts.filter(a=>p.scope.includes(a.id));
 const balances=active.map(a=>({...a,balance:sum([a.date<cutoff?a.opening:0,...s.events.filter(e=>e.date>=a.date&&e.date<cutoff).map(e=>movement(e,a.id))])}));
 const cash=balances.length?sum(balances.map(a=>a.balance)):null;
 const events=s.events.filter(e=>e.date>=p.start&&e.date>=s.tracking&&e.date<p.end&&e.date<=day(s.clock)&&(p.scope.includes(e.account)||(e.to&&p.scope.includes(e.to))));const posted=events.filter(eligible);
 const signed=(e:Event)=>D(e.amount).mul(e.reversal?-1:1);
 const income=sum(posted.filter(e=>e.kind==='income').map(signed));const gross=sum(posted.filter(e=>e.kind==='expense').map(signed));const refund=sum(posted.filter(e=>e.kind==='refund'&&e.origin).map(signed));const net=D(gross).minus(refund).toFixed(0);
 const flow=sum(posted.flatMap(e=>p.scope.map(a=>movement(e,a))));
 const cats=[...new Set(posted.filter(e=>e.kind==='expense'||e.kind==='refund'&&e.origin).map(e=>e.category))].map(name=>{const es=posted.filter(e=>e.category===name);const g=sum(es.filter(e=>e.kind==='expense').map(signed));const r=sum(es.filter(e=>e.kind==='refund'&&e.origin).map(signed));return {name,gross:g,refund:r,net:D(g).minus(r).toFixed(0),ids:es.map(e=>e.id)};}).sort((a,b)=>D(b.net).cmp(a.net));
 const holdings=s.holdings.filter(h=>!h.archived).map(h=>{const qs=h.quantities.filter(q=>q.date<cutoff).sort((a,b)=>a.date.localeCompare(b.date));const quantity=qs.at(-1)?.quantity??null;const qtyTime=qs.at(-1)?.date??'';const quote=h.quotes.filter(q=>day(q.date)<cutoff).sort((a,b)=>a.date.localeCompare(b.date)).at(-1);let value:string|null=null;let issue='';if(quantity===null)issue='Chưa có số lượng tại thời điểm chọn';else if(!quote)issue='Thiếu giá tại thời điểm chọn';else if(!quote.compatible)issue='Giá không phù hợp sản phẩm/thị trường';else if(quote.currency==='USD'&&!quote.fx)issue='Thiếu tỷ giá FX';else if(h.kind==='stock'&&quote.unit!=='share'||h.kind==='gold'&&quote.unit==='share')issue='Đơn vị giá không phù hợp';else value=D(quantity).mul(quote.price).mul(quote.currency==='USD'?quote.fx!:1).div(quote.unit==='luong'?10:1).toDecimalPlaces(0).toFixed(0);return {...h,quantityAt:quantity,quote,value,issue,qtyTime,staleQuantity:isStale(s.clock,qtyTime,30*24),stalePrice:quote?isStale(s.clock,quote.date,24):false,staleFx:quote?.currency==='USD'?isStale(s.clock,quote.fxDate||'',24):false};});
 const known=sum([cash??0,...holdings.map(h=>h.value??0)]);const complete=cash!==null&&holdings.every(h=>h.value!==null);return {cash,income,gross,refund,net,flow,balances,events,cats,holdings,known,assets:complete?known:null,asof:cutoff.endsWith('~')?day(s.clock):previousDay(p.end),partial:p.start<s.tracking||p.end>day(s.clock)+'~',pending:events.filter(e=>!eligible(e)).length,version:s.version,period:p};
}
export const previousDay=(date:string)=>new Date(new Date(date+'T00:00:00Z').getTime()-86400000).toISOString().slice(0,10);
export function occurrences(item:PlanItem){if(item.archived)return[];if(item.recurrence==='once')return [{id:item.id+'@'+item.date,date:item.date,amount:item.amount}];const rows=[];let[y,m]=item.date.split('-').map(Number);const[endY,endM]=item.end.split('-').map(Number);for(let i=0;i<360&&(y<endY||y===endY&&m<=endM);i++){const dd=Math.min(item.day,new Date(Date.UTC(y,m,0)).getUTCDate());const date=`${y}-${String(m).padStart(2,'0')}-${String(dd).padStart(2,'0')}`;if(date>=item.date&&date<=item.end)rows.push({id:item.id+'@'+date,date,amount:item.amount});m++;if(m===13){m=1;y++;}}return rows;}
export function planSummary(s:Store,p:Period){
 const snap=snapshot(s,p);
 const items=s.plans.filter(i=>!i.archived&&p.scope.includes(i.account)).map(i=>{
  const rows=plannedRows(s,i),planned=sum(rows.map(r=>r.amount)),actual=sum(rows.map(r=>r.actual)),remaining=sum(rows.map(r=>r.remaining));
  return {...i,rows,planned,actual,remaining,overspend:i.kind==='expense'?sum(rows.map(r=>r.overspend)):'0'};
 });
 const remainingFlow=sum(items.map(i=>D(i.remaining).mul(i.kind==='income'?1:-1)));
 const remainingAsset=sum(items.filter(i=>i.kind!=='investment').map(i=>D(i.remaining).mul(i.kind==='income'?1:-1)));
 const originalCash=items[0]?.baselineCash===null||!items.length?null:D(items[0].baselineCash!).plus(sum(items.map(i=>D(i.planned).mul(i.kind==='income'?1:-1)))).toFixed(0);
 const forecastCash=snap.cash===null?null:D(snap.cash).plus(remainingFlow).toFixed(0);
 return {items,originalCash,gap:originalCash===null||forecastCash===null?null:D(forecastCash).minus(originalCash).toFixed(0),cash:forecastCash,assets:snap.assets===null?null:D(snap.assets).plus(remainingAsset).toFixed(0),snap};
}
export function goalSummary(s:Store,p:Period){const current=periodPreset('month',s);current.scope=s.accounts.map(a=>a.id);const snap=snapshot(s,current);const all=s.goals.filter(g=>g.status!=='archived');const funded:Record<string,string>={};for(const a of s.accounts){const allocations=all.flatMap(g=>g.allocations.filter(x=>x.account===a.id)).sort((x,y)=>x.id.localeCompare(y.id));const allocated=D(sum(allocations.map(x=>x.amount)));const balance=Decimal.max(0,snap.balances.find(x=>x.id===a.id)?.balance??0);const capacity=Decimal.min(allocated,balance);let assigned=D();allocations.forEach(x=>{const n=allocated.isZero()?D():capacity.mul(x.amount).div(allocated).floor();funded[x.id]=n.toFixed(0);assigned=assigned.plus(n);});let remainder=capacity.minus(assigned).toNumber();for(let i=0;i<allocations.length&&remainder>0;i++,remainder--)funded[allocations[i].id]=D(funded[allocations[i].id]).plus(1).toFixed(0);}
 return all.map(g=>{const allocated=sum(g.allocations.map(a=>a.amount));const amount=sum(g.allocations.map(a=>funded[a.id]??0));return {...g,allocated,funded:amount,remaining:Decimal.max(0,D(g.target).minus(amount)).toFixed(0),shortfall:Decimal.max(0,D(allocated).minus(amount)).toFixed(0),progress:D(g.target).isZero()?0:Decimal.min(100,D(amount).div(g.target).mul(100)).toNumber()};});}
export function accountAvailable(s:Store,account:string){const p=periodPreset('month',s);p.scope=s.accounts.map(a=>a.id);const balance=snapshot(s,p).balances.find(a=>a.id===account)?.balance??'0';const allocated=sum(s.goals.filter(g=>g.status!=='archived').flatMap(g=>g.allocations.filter(a=>a.account===account).map(a=>a.amount)));return Decimal.max(0,D(balance).minus(allocated)).toFixed(0);}

/** Match each actual to one scheduled occurrence, so overspending this month cannot pay next month. */
export function plannedRows(s:Store,item:Store['plans'][number]){
 const rows=occurrences(item).map(row=>({...row,actual:'0',remaining:row.amount,overspend:'0'}));
 for(const event of s.events.filter(e=>e.plan===item.id&&eligible(e)&&e.date<=day(s.clock)&&e.account===item.account&&(item.kind!=='investment'||e.holding===item.holding)&&(e.kind===item.kind||item.kind==='expense'&&e.kind==='refund')&&e.date>=item.date&&e.date<=item.end)){
  // Refund follows the original expense's occurrence, even when received later.
  const original=event.kind==='refund'?s.events.find(e=>e.id===event.origin):undefined;
  const row=rows.find(r=>r.date>=(original?.date??event.date))??rows.at(-1);
  if(row)row.actual=D(row.actual).plus(D(event.amount).mul(event.reversal?-1:1).mul(event.kind==='refund'?-1:1)).toFixed(0);
 }
 return rows.map(row=>({...row,remaining:Decimal.max(0,D(row.amount).minus(row.actual)).toFixed(0),overspend:Decimal.max(0,D(row.actual).minus(row.amount)).toFixed(0)}));
}
