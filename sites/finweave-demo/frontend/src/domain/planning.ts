import Decimal from 'decimal.js';
import type {Goal,Period,Store} from './model';
import {D,accountAvailable,day,goalSummary,occurrences,periodPreset,planSummary,snapshot,sum} from './selectors';

export const cleanAssetName=(name:string)=>name==='DEMO-A'?'Cổ phiếu':name.replace(/DEMO(?:-VN)?/gi,'').replace(/mẫu/gi,'').trim();
export const addDays=(date:string,n:number)=>new Date(Date.parse(date+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export function nextMonthEnd(date:string){const [y,m]=date.split('-').map(Number);return new Date(Date.UTC(y,m+1,0)).toISOString().slice(0,10);}
export function currentPlanningPeriod(s:Store,scope=s.accounts.filter(a=>!a.archived).map(a=>a.id)):Period{return {...periodPreset('month',s),scope};}

/** Project remaining occurrences from today's balances, including overdue unmatched items. */
export function forecastPlans(s:Store,scope?:string[]){
 const p=currentPlanningPeriod(s,scope),summary=planSummary(s,p);
 const balances=Object.fromEntries(summary.snap.balances.map(a=>[a.id,a.balance]));
 let cash=summary.snap.cash,assets=summary.snap.assets;
 const baseline={date:day(s.clock),cash,assets};
 const steps=summary.items.flatMap(item=>item.rows.map(row=>({...row,item}))).filter(row=>D(row.remaining).gt(0)).sort((a,b)=>a.date.localeCompare(b.date)||Number(b.item.kind==='income')-Number(a.item.kind==='income')||a.item.id.localeCompare(b.item.id));
 const timeline=[baseline];
 const shortages:{date:string;account:string;balance:string}[]=[];
 for(const step of steps){
  const flow=D(step.remaining).mul(step.item.kind==='income'?1:-1);
  balances[step.item.account]=D(balances[step.item.account]??0).plus(flow).toFixed(0);
  if(cash!==null)cash=D(cash).plus(flow).toFixed(0);
  if(assets!==null&&step.item.kind!=='investment')assets=D(assets).plus(flow).toFixed(0);
  if(D(balances[step.item.account]).lt(0))shortages.push({date:step.date,account:step.item.account,balance:balances[step.item.account]});
  const date=step.date<day(s.clock)?day(s.clock):step.date;
  if(timeline.at(-1)?.date===date&&timeline.length>1)timeline[timeline.length-1]={date,cash,assets};else timeline.push({date,cash,assets});
 }
 return {...summary,cash,assets,timeline,shortages,balances,
  income:sum(summary.items.filter(i=>i.kind==='income').map(i=>i.remaining)),
  expense:sum(summary.items.filter(i=>i.kind==='expense').map(i=>i.remaining)),
  investment:sum(summary.items.filter(i=>i.kind==='investment').map(i=>i.remaining)),
  horizon:steps.at(-1)?.date??day(s.clock)};
}

export function investmentEstimate(s:Store,holdingId:string|undefined,budget:string){
 const holding=snapshot(s,currentPlanningPeriod(s)).holdings.find(h=>h.id===holdingId);
 if(!holding||!holding.quote||holding.issue)return {holding,unitPrice:null,quantity:null,spent:null,remainder:null};
 const q=holding.quote,price=D(q.price).mul(q.currency==='USD'?q.fx!:1).div(q.unit==='luong'?10:1);
 if(price.lte(0))return {holding,unitPrice:null,quantity:null,spent:null,remainder:null};
 const quantity=D(budget).div(price).toDecimalPlaces(holding.kind==='stock'?0:6,1);
 const spent=quantity.mul(price).toDecimalPlaces(0).toFixed(0);
 return {holding,unitPrice:price.toFixed(0),quantity:quantity.toFixed(),spent,remainder:D(budget).minus(spent).toFixed(0)};
}

/** A contribution schedule is a future assumption; it never increases actual funded money. */
export function projectGoal(s:Store,goal:Goal){
 const p=currentPlanningPeriod(s),funded=goalSummary(s,p).find(g=>g.id===goal.id)?.funded??'0';
 const schedule=goal.contributionSchedule;
 const dates=schedule?occurrences({id:goal.id,name:goal.name,kind:'expense',amount:schedule.amount,account:schedule.account,date:schedule.start,end:goal.due,recurrence:'monthly',day:schedule.day,category:'Mục tiêu',archived:false,version:1,baselineCash:null,baselineAssets:null,history:[]}).filter(row=>row.date>day(s.clock)&&!schedule.skipMonths?.includes(row.date.slice(0,7))):[];
 const remaining=Decimal.max(0,D(goal.target).minus(funded));
 const required=dates.length?remaining.div(dates.length).ceil().toFixed(0):null;
 let total=D(funded),achievedAt=D(funded).gte(goal.target)?day(s.clock):null;
 const timeline=[{date:day(s.clock),amount:funded}];
 for(const row of dates){total=total.plus(row.amount);timeline.push({date:row.date,amount:total.toFixed(0)});if(!achievedAt&&total.gte(goal.target))achievedAt=row.date;}
 const forecast=forecastPlans(s);
 // Include other goals competing for the same account, without treating savings as spending.
 const reservations=s.goals.filter(g=>g.status==='active'&&g.id!==goal.id&&g.contributionSchedule).flatMap(g=>{
  const c=g.contributionSchedule!;
  return occurrences({id:g.id,name:g.name,kind:'expense',amount:c.amount,account:c.account,date:c.start,end:g.due,recurrence:'monthly',day:c.day,category:'Mục tiêu',archived:false,version:1,baselineCash:null,baselineAssets:null,history:[]}).filter(r=>r.date>day(s.clock)&&r.date<=goal.due&&!c.skipMonths?.includes(r.date.slice(0,7))).map(r=>({...r,account:c.account,goal:g.id}));
 });
 let available=schedule?D(accountAvailable(s,schedule.account)):D();
 const sourceSteps=forecast.items.filter(i=>i.account===schedule?.account).flatMap(i=>i.rows.filter(r=>r.date<=goal.due&&D(r.remaining).gt(0)).map(r=>({date:r.date,amount:D(r.remaining).mul(i.kind==='income'?1:-1),reserve:false})));
 const fundingSteps=[...sourceSteps,...reservations.filter(r=>r.account===schedule?.account).map(r=>({date:r.date,amount:D(r.amount).neg(),reserve:true})),...dates.map(r=>({date:r.date,amount:D(r.amount).neg(),reserve:true}))].sort((a,b)=>a.date.localeCompare(b.date)||Number(a.reserve)-Number(b.reserve)||b.amount.cmp(a.amount));
 let shortage:{date:string;amount:string}|null=null;
 for(const step of fundingSteps){available=available.plus(step.amount);if(!shortage&&available.lt(0))shortage={date:step.date,amount:available.neg().toFixed(0)};}
 return {funded,projected:total.toFixed(0),scheduled:sum(dates.map(r=>r.amount)),gap:Decimal.max(0,D(goal.target).minus(total)).toFixed(0),required,dates,timeline,achievedAt,shortage,
  progress:Decimal.min(100,D(funded).div(goal.target).mul(100)).toNumber(),
  projectedProgress:Decimal.min(100,total.div(goal.target).mul(100)).toNumber(),
  extraContributions:schedule?Decimal.max(0,D(goal.target).minus(total)).div(schedule.amount).ceil().toNumber():null};
}

