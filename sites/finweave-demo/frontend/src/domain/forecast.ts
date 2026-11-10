import type {Goal,Store} from './model';
import {day,eligible,plannedRows,snapshot} from './selectors';
import {currentPlanningPeriod} from './planning';

export type ForecastSettings={months:number;income:string|null;expense:string|null;incomeGrowth:number;inflation:number;cashReturn:number;stockReturn:number;goldReturn:number;stockVolatility:number;goldVolatility:number;incomeVolatility:number;expenseVolatility:number;reserveMonths:number;investSurplus:number;goldWeight:number;debt:string|null;debtAPR:number;debtPayment:string;stress:boolean;stressStart:number;stressMonths:number;incomeDrop:number;stockShock:number;inflationShock:number;realMoney:boolean;poolCash:boolean};
export const DEFAULT_FORECAST:ForecastSettings={months:60,income:null,expense:null,incomeGrowth:5,inflation:3.5,cashReturn:2,stockReturn:7,goldReturn:3,stockVolatility:18,goldVolatility:14,incomeVolatility:3,expenseVolatility:8,reserveMonths:3,investSurplus:30,goldWeight:25,debt:null,debtAPR:8,debtPayment:'0',stress:false,stressStart:3,stressMonths:12,incomeDrop:20,stockShock:-25,inflationShock:2,realMoney:false,poolCash:true};
export const FORECAST_PRESETS=[
 {id:'base',name:'Cơ sở',description:'Tăng trưởng vừa phải',patch:{inflation:3.5,incomeGrowth:5,stockReturn:7,goldReturn:3,stockVolatility:18,stress:false}},
 {id:'inflation',name:'Lạm phát cao',description:'Chi phí tăng nhanh hơn thu nhập',patch:{inflation:7,incomeGrowth:3,stockReturn:5,goldReturn:5,stockVolatility:22,stress:false}},
 {id:'recession',name:'Suy giảm',description:'Thu nhập giảm, cổ phiếu chịu cú sốc',patch:{inflation:5,incomeGrowth:1,stockReturn:3,goldReturn:4,stockVolatility:28,stress:true,stressStart:1,stressMonths:12,incomeDrop:20,stockShock:-25,inflationShock:2}},
 {id:'growth',name:'Thuận lợi',description:'Thu nhập và tài sản tăng trưởng tốt',patch:{inflation:3,incomeGrowth:8,stockReturn:10,goldReturn:4,stockVolatility:18,stress:false}}
] satisfies {id:string;name:string;description:string;patch:Partial<ForecastSettings>}[];

export function normalizeForecast(value:Partial<ForecastSettings>):ForecastSettings{
 const s={...DEFAULT_FORECAST,...value};
 const bounds:Partial<Record<keyof ForecastSettings,[number,number]>>={months:[1,360],incomeGrowth:[-50,30],inflation:[-5,25],cashReturn:[0,20],stockReturn:[-50,40],goldReturn:[-50,40],stockVolatility:[0,80],goldVolatility:[0,80],incomeVolatility:[0,60],expenseVolatility:[0,60],reserveMonths:[0,24],investSurplus:[0,100],goldWeight:[0,100],debtAPR:[0,60],stressStart:[1,360],stressMonths:[1,120],incomeDrop:[0,100],stockShock:[-90,0],inflationShock:[0,20]};
 for(const key of Object.keys(bounds) as (keyof ForecastSettings)[]){const [lo,hi]=bounds[key]!;const v=s[key];(s as any)[key]=typeof v==='number'&&Number.isFinite(v)?Math.max(lo,Math.min(hi,v)):DEFAULT_FORECAST[key];}
 for(const key of ['income','expense','debt','debtPayment'] as const){if(s[key]!==null&&(!/^\d{1,13}$/.test(s[key]!)||Number(s[key])>1e12))(s as any)[key]=DEFAULT_FORECAST[key];}
 s.months=Math.round(s.months);s.stressStart=Math.round(s.stressStart);s.stressMonths=Math.round(s.stressMonths);
 s.stress=s.stress===true;s.realMoney=s.realMoney===true;s.poolCash=s.poolCash!==false;return s;
}

type Bucket={account:string;category:string;amount:number};
const monthStart=(date:string)=>date.slice(0,7)+'-01';
const monthEnd=(date:string)=>{const [y,m]=date.split('-').map(Number);return new Date(Date.UTC(y,m,0)).toISOString().slice(0,10);};
export function shiftMonth(date:string,n:number){const [y,m,d]=date.split('-').map(Number);const first=new Date(Date.UTC(y,m-1+n,1));const last=new Date(Date.UTC(first.getUTCFullYear(),first.getUTCMonth()+1,0)).getUTCDate();first.setUTCDate(Math.min(d,last));return first.toISOString().slice(0,10);}
const millis=(date:string)=>Date.parse(date+'T00:00:00Z');
const days=(a:string,b:string)=>(millis(b)-millis(a))/86400000;
const number=(value:string|null)=>value===null?0:Number(value);
const vnd=(n:number)=>Math.round(n).toFixed(0);

/** Calendar coverage is inferred only from the workspace's declared tracking window. */
export function forecastBaseline(s:Store,scope=s.accounts.filter(a=>!a.archived).map(a=>a.id)){
 const now=day(s.clock),start=monthStart(shiftMonth(now,-5));
 const months:string[]=[];for(let m=start;m<=monthStart(now);m=shiftMonth(m,1))if(m>=s.tracking&&monthEnd(m)<=now)months.push(m);
 const complete=months.length>0;
 if(!complete)months.push(monthStart(now));
 const history=months.map(m=>{
  const p={...currentPlanningPeriod(s,scope),start:m,end:shiftMonth(m,1)};const row=snapshot(s,p);
  return {date:monthEnd(m)>now?now:monthEnd(m),income:row.income,expense:row.gross,refund:row.refund,net:row.net};
 });
 const events=s.events.filter(e=>eligible(e)&&e.date>=s.tracking&&e.date<=now&&scope.includes(e.account)&&months.includes(monthStart(e.date)));
 const buckets=(kind:'income'|'expense')=>{
  const map=new Map<string,Bucket>();for(const e of events.filter(e=>e.kind===kind)){const key=e.account+'|'+e.category;const b=map.get(key)??{account:e.account,category:e.category,amount:0};b.amount+=Number(e.amount)*(e.reversal?-1:1);map.set(key,b);}
  return [...map.values()].map(b=>({...b,amount:Math.max(0,b.amount/months.length)}));
 };
 const snap=snapshot(s,currentPlanningPeriod(s,scope)),incomes=buckets('income'),expenses=buckets('expense');
 return {snap,history,incomes,expenses,income:incomes.reduce((a,b)=>a+b.amount,0),expense:expenses.reduce((a,b)=>a+b.amount,0),complete,months:months.length,hasEvents:events.some(e=>e.kind==='income'||e.kind==='expense'),scope};
}

export function goalSchedule(goal:Goal,after:string,until:string){
 const c=goal.contributionSchedule;if(!c||goal.status!=='active')return [];
 const end=goal.due<until?goal.due:until,rows:{date:string;amount:number;account:string}[]=[];
 for(let m=monthStart(c.start),n=0;m<=monthStart(end)&&n<360;m=shiftMonth(m,1),n++){
  const d=Math.min(c.day,Number(monthEnd(m).slice(-2))),date=m.slice(0,8)+String(d).padStart(2,'0');
  if(date>=c.start&&date>after&&date<=end&&!c.skipMonths?.includes(date.slice(0,7)))rows.push({date,amount:Number(c.amount),account:c.account});
 }
 return rows;
}

export type Bands={p10:number;p25:number;p50:number;p75:number;p90:number};
export type ForecastPoint={date:string;assets:Bands;cash:Bands;netWorth:Bands;goals:Record<string,Bands>;inflation:number};
export type ForecastFlow={date:string;cash:number;stock:number;gold:number;assets:number;debt:number;income:number;expense:number;invested:number;unfundedInvestment:number;goalContributions:number;debtPaid:number;growth:number;inflation:number;goals:Record<string,number>};
export type GoalOutcome={id:string;due:string;probability:number|null;target:number;funded:number;requested:number;feasible:number;gap:number;firstReach:string|null;requiredMonthly:number;monthlyCapacity:number;outOfRange:boolean;initial:number;streak:number;contributions:number};
export type ForecastResult={baseline:ReturnType<typeof forecastBaseline>;settings:ForecastSettings;points:ForecastPoint[];central:ForecastFlow[];withoutPlans:ForecastFlow[];counterfactual:ForecastPoint[];goals:GoalOutcome[];trials:number;solvency:number;missingAssets:boolean;noCash:boolean;horizon:string};
const quantile=(sorted:number[],p:number)=>{const i=(sorted.length-1)*p,lo=Math.floor(i),w=i-lo;return sorted[lo]+(sorted[Math.ceil(i)]-sorted[lo])*w;};
const bands=(values:number[]):Bands=>{values.sort((a,b)=>a-b);return {p10:quantile(values,.1),p25:quantile(values,.25),p50:quantile(values,.5),p75:quantile(values,.75),p90:quantile(values,.9)};};
function rng(seed:number){let n=seed;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return(n+.5)/4294967296;};}
function normal(random:()=>number){return Math.sqrt(-2*Math.log(random()))*Math.cos(2*Math.PI*random());}
const category=(name:string)=>name.trim().toLocaleLowerCase();
const profiles={cash:[1,0,0],balanced:[.2,.5,.3],growth:[0,.8,.2]} as const;

const cache=new WeakMap<Store,Map<string,ForecastResult>>();
/** Seeded, conditional Monte Carlo. All paths use ledger balances; no future money is invented. */
export function simulateForecast(s:Store,input:ForecastSettings,scope?:string[],trialCount=300):ForecastResult{
 const settings=normalizeForecast(input),key=JSON.stringify([settings,scope,trialCount]);let saved=cache.get(s);if(saved?.has(key))return saved.get(key)!;
 const baseline=forecastBaseline(s,scope),now=day(s.clock),horizon=shiftMonth(now,settings.months);
 const accounts=baseline.snap.balances.map(a=>a.id),primary=accounts[0]??'';
 const goals=s.goals.filter(g=>g.status!=='archived');
 const income=settings.income===null?baseline.income:number(settings.income),expense=settings.expense===null?baseline.expense:number(settings.expense);
 const rescale=(b:Bucket[],total:number)=>{const sum=b.reduce((a,x)=>a+x.amount,0);return sum>0?b.map(x=>({...x,amount:x.amount*total/sum})):[{account:primary,category:'Khác',amount:total}];};
 const incomes=rescale(baseline.incomes,income),expenses=rescale(baseline.expenses,expense);
 const planned=s.plans.filter(p=>!p.archived&&accounts.includes(p.account)).flatMap(p=>plannedRows(s,p).filter(r=>Number(r.remaining)>0&&r.date<=horizon).map(r=>({date:r.date<=now?new Date(millis(now)+86400000).toISOString().slice(0,10):r.date,item:p,amount:Number(r.remaining)})));
 const schedules=goals.map(g=>goalSchedule(g,now,horizon));
 const output=new Set<string>([now,horizon]);for(let m=monthStart(now);m<=monthStart(horizon);m=shiftMonth(m,1)){const end=monthEnd(m);if(end>now&&end<horizon)output.add(end);}for(const g of goals)if(g.due>now&&g.due<=horizon)output.add(g.due);
 const dates=[...new Set([...output,...planned.map(p=>p.date),...schedules.flatMap(rows=>rows.map(r=>r.date))])].filter(d=>d>=now&&d<=horizon).sort();
 for(const rows of schedules)for(const r of rows)output.add(r.date);for(const p of planned)output.add(p.date);
 const outputDates=dates.filter(d=>output.has(d)),outputIndex=new Map(outputDates.map((d,i)=>[d,i]));
 const initialVaults=goals.map(()=>({cash:0,stock:0,gold:0}));
 const reserved:Record<string,number>={};
 for(const id of accounts){
  const rows=goals.flatMap((g,gi)=>g.allocations.filter(a=>a.account===id).map(a=>({...a,goal:gi}))).sort((a,b)=>a.id.localeCompare(b.id));
  const total=rows.reduce((a,r)=>a+Number(r.amount),0),capacity=Math.max(0,Math.min(total,Number(baseline.snap.balances.find(a=>a.id===id)?.balance??0)));
  let assigned=0;const backed=rows.map(a=>{const n=total?Math.floor(capacity*Number(a.amount)/total):0;assigned+=n;return n;});
  for(let n=0;n<capacity-assigned;n++)backed[n]++;
  rows.forEach((row,i)=>{initialVaults[row.goal].cash+=backed[i];});reserved[id]=capacity;
 }
 const recurring=new Map<string,typeof planned>();for(const row of planned.filter(r=>r.item.recurrence==='monthly'&&r.item.kind!=='investment')){const m=monthStart(row.date);recurring.set(m,[...(recurring.get(m)??[]),row]);}
 const prepared=dates.slice(1).map((date,index)=>{
  const previous=dates[index],dt=days(previous,date)/365.25,month=monthStart(date),monthFraction=days(previous,date)/Number(monthEnd(date).slice(-2)),years=days(now,date)/365.25;
  const replacements=recurring.get(month)??[];
  const regularIncome=incomes.filter(b=>!replacements.some(p=>p.item.kind==='income'&&p.item.account===b.account));
  const regularExpense=expenses.filter(b=>!replacements.some(p=>p.item.kind==='expense'&&p.item.account===b.account&&category(p.item.category)===category(b.category)));
  return {date,dt,monthFraction,years,incomes:regularIncome,expenses:regularExpense,plans:planned.filter(r=>r.date===date),contributions:schedules.map(rows=>rows.filter(r=>r.date===date)),out:outputIndex.get(date),monthEnd:date===monthEnd(date)};
 });
 const initialStock=baseline.snap.holdings.filter(h=>h.kind==='stock').reduce((a,h)=>a+number(h.value),0),initialGold=baseline.snap.holdings.filter(h=>h.kind==='gold').reduce((a,h)=>a+number(h.value),0);
 type Trial={flows:ForecastFlow[];values:number[][];cash:number[][];goalValues:number[][];success:boolean[];reached:(string|null)[];shortfall:boolean;contributed:number[][]};
 const run=(trial:number,stochastic:boolean,includePlans:boolean):Trial=>{
  const random=rng(0x6f17a+trial*7919),balances=Object.fromEntries(baseline.snap.balances.map(a=>[a.id,Number(a.balance)-(reserved[a.id]??0)]));
  const vaults=initialVaults.map(v=>({...v}));let stock=initialStock,gold=initialGold,debt=number(settings.debt),inflation=1,shortfall=false;
  const success=goals.map(()=>false),reached:(string|null)[]=goals.map(()=>null),goalValues:number[][]=goals.map(()=>[]);
  const contributed:number[][]=goals.map(()=>[]),paid=goals.map(()=>0);
  const spend=(account:string,value:number)=>{balances[account]-=value;if(settings.poolCash&&balances[account]<0){let gap=-balances[account];for(const other of accounts.filter(id=>id!==account)){const transfer=Math.min(Math.max(0,balances[other]),gap);balances[other]-=transfer;balances[account]+=transfer;gap-=transfer;}}};
  const flows:ForecastFlow[]=[],values:number[][]=[],cashValues:number[][]=[];let since={income:0,expense:0,invested:0,unfundedInvestment:0,goalContributions:0,debtPaid:0,growth:0};
  const cashTotal=()=>Object.values(balances).reduce((a,b)=>a+b,0)+vaults.reduce((a,v)=>a+v.cash,0);
  const free=()=>Object.values(balances).reduce((a,b)=>a+b,0);
  const totalAssets=()=>cashTotal()+stock+gold+vaults.reduce((a,v)=>a+v.stock+v.gold,0);
  const budget=(account:string,reserve:number)=>Math.max(0,Math.min(balances[account]??0,free()-reserve));
  const measure=(date:string)=>{
   const cash=cashTotal(),assets=totalAssets();
   const gv=goals.map((g,i)=>g.projection?.criterion==='assets'?assets:g.projection?.criterion==='independence'?assets-debt:vaults[i].cash+vaults[i].stock+vaults[i].gold);
   flows.push({date,cash,stock:stock+vaults.reduce((a,v)=>a+v.stock,0),gold:gold+vaults.reduce((a,v)=>a+v.gold,0),assets,debt,...since,inflation,goals:Object.fromEntries(goals.map((g,i)=>[g.id,gv[i]]))});
   values.push([assets,assets-debt]);cashValues.push([cash]);gv.forEach((v,i)=>{goalValues[i].push(v);contributed[i].push(paid[i]);});since={income:0,expense:0,invested:0,unfundedInvestment:0,goalContributions:0,debtPaid:0,growth:0};
  };
  measure(now);
  for(const step of prepared){
   const month=Math.max(1,Math.ceil(step.years*12)),stress=settings.stress&&month>=settings.stressStart&&month<settings.stressStart+settings.stressMonths;
   const macro=stochastic?normal(random):0,zStock=stochastic?.65*macro+Math.sqrt(1-.65**2)*normal(random):0,zGold=stochastic?.2*macro+Math.sqrt(1-.2**2)*normal(random):0;
   const growthFactor=(rate:number,vol:number,z:number)=>Math.exp((Math.log1p(rate/100)-(stochastic?.5*(vol/100)**2:0))*step.dt+(vol/100)*Math.sqrt(step.dt)*z);
   const cashFactor=growthFactor(settings.cashReturn,0,0),stockFactor=growthFactor(settings.stockReturn,settings.stockVolatility,zStock),goldFactor=growthFactor(settings.goldReturn,settings.goldVolatility,zGold);
   const before=totalAssets();stock*=stockFactor;gold*=goldFactor;
   for(const id of accounts)if(balances[id]>0)balances[id]*=cashFactor;
   for(const v of vaults){v.cash*=cashFactor;v.stock*=stockFactor;v.gold*=goldFactor;}
   // Apply the recession shock once, when crossing its start date, rather than once per event.
   const oldMonth=Math.max(0,Math.ceil((step.years-step.dt)*12));
   if(settings.stress&&month>=settings.stressStart&&oldMonth<settings.stressStart){stock*=1+settings.stockShock/100;for(const v of vaults)v.stock*=1+settings.stockShock/100;}
   since.growth+=totalAssets()-before;
   inflation*=Math.exp(Math.log1p((settings.inflation+(stress?settings.inflationShock:0))/100)*step.dt);
   const wageGrowth=Math.pow(1+settings.incomeGrowth/100,step.years),incomeShock=stress?1-settings.incomeDrop/100:1;
   const wageNoise=stochastic?Math.exp(settings.incomeVolatility/100*Math.sqrt(step.monthFraction)*normal(random)-.5*(settings.incomeVolatility/100)**2*step.monthFraction):1;
   const costNoise=stochastic?Math.exp(settings.expenseVolatility/100*Math.sqrt(step.monthFraction)*normal(random)-.5*(settings.expenseVolatility/100)**2*step.monthFraction):1;
   const regularIncome=includePlans?step.incomes:incomes,regularExpense=includePlans?step.expenses:expenses;
   for(const b of regularIncome){const value=b.amount*wageGrowth*incomeShock*wageNoise*step.monthFraction;if(b.account in balances){balances[b.account]+=value;since.income+=value;}}
   for(const b of regularExpense){const value=b.amount*inflation*costNoise*step.monthFraction;if(b.account in balances){spend(b.account,value);since.expense+=value;}}
   debt*=Math.pow(1+settings.debtAPR/100,step.dt);
   const payment=Math.min(debt,number(settings.debtPayment)*step.monthFraction);debt-=payment;if(primary){spend(primary,payment);since.debtPaid+=payment;}
   if(includePlans){
    for(const p of step.plans.filter(p=>p.item.kind!=='investment')){if(p.item.kind==='income'){balances[p.item.account]+=p.amount;since.income+=p.amount;}else{spend(p.item.account,p.amount);since.expense+=p.amount;}}
   }
   // Expenses may expose a financing gap. No borrowing or sale of holdings is assumed.
   if(accounts.some(id=>balances[id]<-.5))shortfall=true;
   if(includePlans){
    for(const p of step.plans.filter(p=>p.item.kind==='investment')){const buy=Math.min(p.amount,budget(p.item.account,0));since.unfundedInvestment+=p.amount-buy;balances[p.item.account]-=buy;const h=s.holdings.find(h=>h.id===p.item.holding);if(h?.kind==='gold')gold+=buy;else stock+=buy;since.invested+=buy;}
    for(let i=0;i<goals.length;i++)for(const c of step.contributions[i]){
     const g=goals[i];if(g.status!=='active'||!(c.account in balances))continue;
     const reserve=expense*inflation*settings.reserveMonths,contribution=Math.min(c.amount,budget(c.account,reserve)),weights=profiles[g.projection?.profile??'cash'];
     paid[i]+=contribution;balances[c.account]-=contribution;vaults[i].cash+=contribution*weights[0];vaults[i].stock+=contribution*weights[1];vaults[i].gold+=contribution*weights[2];since.goalContributions+=contribution;since.invested+=contribution*(weights[1]+weights[2]);
    }
   }
   if(step.monthEnd&&settings.investSurplus>0){const surplus=Math.max(0,free()-expense*inflation*settings.reserveMonths)*settings.investSurplus/100;let left=surplus;for(const id of accounts){const amount=Math.min(Math.max(0,balances[id]),left);balances[id]-=amount;left-=amount;}stock+=surplus*(1-settings.goldWeight/100);gold+=surplus*settings.goldWeight/100;since.invested+=surplus;}
   for(let i=0;i<goals.length;i++){
    const g=goals[i],criterion=g.projection?.criterion??'savings',funded=criterion==='assets'?totalAssets():criterion==='independence'?totalAssets()-debt:vaults[i].cash+vaults[i].stock+vaults[i].gold;
    const target=criterion==='independence'?expense*inflation*12*(g.projection?.expenseMultiple??25):Number(g.target)*(g.projection?.targetBasis==='today'?inflation:1);
    const reserveEnough=free()>=expense*inflation*(g.projection?.liquidMonths??0);
    const passes=target>0&&funded+.5>=target&&reserveEnough&&!shortfall;
    if(!reached[i]&&passes)reached[i]=step.date;
    if(step.date===g.due)success[i]=passes;
    if(g.due<=now)success[i]=goals[i].status==='achieved';
   }
   if(step.out!==undefined)measure(step.date);
  }
  return {flows,values,cash:cashValues,goalValues,success,reached,shortfall,contributed};
 };
 const trials=Math.max(1,Math.min(1000,Math.round(trialCount))),runs=Array.from({length:trials},(_,i)=>run(i,true,true)),central=run(0,false,true),withoutPlans=run(0,false,false);
 const points:ForecastPoint[]=outputDates.map((date,i)=>({date,assets:bands(runs.map(r=>r.values[i][0])),netWorth:bands(runs.map(r=>r.values[i][1])),cash:bands(runs.map(r=>r.cash[i][0])),goals:Object.fromEntries(goals.map((g,n)=>[g.id,bands(runs.map(r=>r.goalValues[n][i]))])),inflation:central.flows[i].inflation}));
 const comparisonRuns=planned.length||schedules.some(rows=>rows.length)?Array.from({length:trials},(_,i)=>run(i,true,false)):runs;
 const counterfactual:ForecastPoint[]=outputDates.map((date,i)=>({date,assets:bands(comparisonRuns.map(r=>r.values[i][0])),netWorth:bands(comparisonRuns.map(r=>r.values[i][1])),cash:bands(comparisonRuns.map(r=>r.cash[i][0])),goals:{},inflation:central.flows[i].inflation}));
 const outcomes:GoalOutcome[]=goals.map((g,i)=>{
  const index=outputDates.indexOf(g.due),outOfRange=g.due>horizon,at=index<0?points[0]:points[index],flow=index<0?central.flows[0]:central.flows[index],criterion=g.projection?.criterion??'savings';
  const target=criterion==='independence'?expense*flow.inflation*12*(g.projection?.expenseMultiple??25):Number(g.target)*(g.projection?.targetBasis==='today'?flow.inflation:1);
  const funded=(criterion==='assets'?at.assets:criterion==='independence'?at.netWorth:at.goals[g.id]).p50,initial=points[0].goals[g.id].p50;
  const requested=schedules[i].reduce((a,r)=>a+r.amount,0),n=Math.max(1,schedules[i].length),requiredMonthly=Math.max(0,target-initial)/n;
  const allocationMonths=[...new Set(g.allocations.filter(a=>a.date).map(a=>a.date!.slice(0,7)))].sort().reverse();let streak=0,latest=monthStart(now);if(allocationMonths[0]===shiftMonth(latest,-1).slice(0,7))latest=shiftMonth(latest,-1);for(const m of allocationMonths){if(m===latest.slice(0,7)){streak++;latest=shiftMonth(latest,-1);}else break;}
  return {id:g.id,due:g.due,probability:outOfRange||baseline.snap.cash===null||(criterion!=='savings'&&(baseline.snap.assets===null||criterion==='independence'&&(settings.debt===null||expense<=0)))?null:runs.filter(r=>r.success[i]).length/trials*100,target,funded,initial,requested,feasible:central.contributed[i][index<0?0:index],gap:Math.max(0,target-funded),firstReach:central.reached[i],requiredMonthly,monthlyCapacity:Math.max(0,income-expense-number(settings.debtPayment)),outOfRange,streak,contributions:g.allocations.length};
 });
 const result:ForecastResult={baseline,settings,points,central:central.flows,withoutPlans:withoutPlans.flows,counterfactual,goals:outcomes,trials,solvency:runs.filter(r=>!r.shortfall).length/trials*100,missingAssets:baseline.snap.holdings.some(h=>h.value===null),noCash:baseline.snap.cash===null,horizon};
 if(!saved){saved=new Map();cache.set(s,saved);}if(saved.size>=8)saved.delete(saved.keys().next().value!);saved.set(key,result);return result;
}

export const forecastMoney=(value:number)=>vnd(value);
