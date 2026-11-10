import {fixture,settings} from './fixtures.ts';
import {occurrences} from '../src/engine/business.ts';
export interface EvaluationCase {id:string;group:string;state:any;expected:string;oracle?:{metric:string;value:string};coverage:string}
const coverage=(s:any)=>{s.input.facts.coverage=s.input.scope.map((account_id:string,n:number)=>({id:'coverage_'+n,account_id,payload:{start:s.input.context.period.start,endExclusive:s.input.context.period.endExclusive}}));};
const event=(id:string,kind:string,amount:string,date:string,extra:any={})=>({id,family:id,version:0,payload:{kind,amount:{value:amount,currency:'VND'},date,accountId:'private_account',category:'Synthetic',description:'Excluded private memo',posting:'posted',...extra}});
export function publicCases():EvaluationCase[]{
 const cases:EvaluationCase[]=[];
 for(let n=1;n<=20;n++){
  if([6,8,19,20].includes(n))continue; // These need additional provider/calendar/CAS/owner interaction rubrics, reported explicitly.
  const s=fixture();s.input.reserveConfirmed=true;let expected='DRAFT_READY',oracle:EvaluationCase['oracle'];
  if(n===1||n===3||n===4){s.run.settings={...settings,months:12,income:'6000000'};const g=s.input.facts.goals[0];g.payload.target.value='60000000';g.payload.due='2027-01-31';g.payload.contributionSchedule.dayOfMonth=31;g.payload.contributionSchedule.skipMonths=n===3?['2026-12']:[];s.input.facts.lines[0].signed_amount='0';if(n===4){s.input.facts.goals.push({...structuredClone(g),id:'competitor'});s.run.settings.income='5000000';expected='INFEASIBLE';}}
  if(n===2){s.input.reserveConfirmed=false;expected='CLARIFICATION';}
  if(n===5||n===9||n===11){s.run.intent='plan';s.run.goalId=null;s.run.settings={...settings,months:6};const body:any={goals:[],items:[{ref:'expense',existingId:null,name:'Owner expense',kind:'expense',amount:'10',account:'private_account',date:'2026-02-01',end:'2026-07-31',recurrence:'monthly',day:10,category:'Synthetic',holding:null,supportsGoal:false}],links:[],scope:s.input.scope,reserve:'0',income:'0',expense:'0',priority:'preserve_plans',notes:'Typed owner assumptions',settings:s.run.settings};
   if(n===9)body.items.push({...body.items[0],ref:'oneoff',amount:'20',recurrence:'once'});
   if(n===11){const p={id:'existing_plan',version:0,payload:{name:'Original Plan',kind:'expense',amount:{value:'10',currency:'VND'},accountId:'private_account',start:'2026-01-10',end:'2026-07-31',recurrence:'monthly',dayOfMonth:10,category:'Synthetic',holdingId:null,archived:false}};s.input.facts.plans=[p];s.input.facts.events=[event('actual','expense','40','2026-01-10')];s.input.facts.lines[0].signed_amount='960';s.input.facts.links=[{active:true,plan_id:p.id,event_family:'actual',payload:{planItemVersion:0,occurrenceId:occurrences(p,'2026-01-31')[0].id}}];body.items[0]={...body.items[0],existingId:p.id,amount:'9',date:p.payload.start};}
   s.input.proposalBody=body;
  }
  if(n===7){s.input.facts.lines[0].signed_amount='0';expected='INFEASIBLE';}
  if(n===10){s.input.facts.holdings=[{id:'h',version:0,payload:{name:'Excluded name',kind:'stock',market:'SYNTHETIC',quantityDate:'2026-01-01',archived:false}}];s.input.facts.movements=[{holding_id:'h',business_date:'2026-01-01',mode:'absolute',quantity:'10'}];}
  if(n===12)s.run.settings={...settings,income:'100'};
  if(n>=13){s.run.intent='investigation';s.run.goalId=null;coverage(s);expected='FACTS_EXPLAINED';
   if(n===13){s.input.facts.holdings=[{id:'h',version:0,payload:{name:'Excluded name',kind:'stock',market:'SYNTHETIC',quantityDate:'2026-01-01',archived:false}}];s.input.facts.movements=[{holding_id:'h',business_date:'2026-01-01',mode:'absolute',quantity:'10'}];s.input.facts.quotes=[{id:'quote_old',holding_id:'h',payload:{id:'quote_old',price:{value:'10',per:'share',currency:'VND'},at:'2026-01-20T12:00:00Z',sourceId:'SYNTHETIC'}},{id:'quote_new',holding_id:'h',payload:{id:'quote_new',price:{value:'5',per:'share',currency:'VND'},at:'2026-01-31T10:00:00Z',sourceId:'SYNTHETIC'}}];oracle={metric:'getFinancialSnapshot.assets',value:'1050'};}
   if(n===14){s.input.facts.accounts.push({...structuredClone(s.input.facts.accounts[0]),id:'other_account'});s.input.scope.push('other_account');s.input.context.accountIds=[...s.input.scope];coverage(s);s.input.facts.events=[event('transfer','transfer','10','2026-01-10',{toAccountId:'other_account',oneLeg:false})];oracle={metric:'getFinancialSnapshot.income',value:'0'};}
   if(n===15){s.input.facts.coverage=[];s.input.facts.events=[event('dup1','expense','10','2026-01-10'),event('dup2','expense','10','2026-01-10')];expected='PARTIAL';}
   if(n===16){s.input.facts.events=[event('refund','refund','50','2026-01-20',{originId:'prior_expense'})];oracle={metric:'getFinancialSnapshot.netExpense',value:'-50'};}
   if(n===17){s.input.facts.events=[event('fee','expense','10','2026-01-10')];s.input.facts.reviews=[{id:'fee_review',payload:{eventId:'fee',type:'fee',status:'open'}}];expected='NEEDS_REVIEW';}
   if(n===18)s.input.facts.events=[event('a','expense','10','2026-01-10'),event('b','expense','20','2026-01-11')];
  }
  cases.push({id:'AEV-'+String(n).padStart(2,'0'),group:n<=10?'plan':'adjust',state:s,expected,oracle,coverage:'BOUNDED_TYPED_ENGINE_RUBRIC; does not claim natural-language/provider/full-source integration'});
 }
 return cases;
}
// Generator imports no selector, expected answers or provider. Held-out amounts,
// schedule/order/constraint combinations are produced by a separate process.
export function instance(index:number,values:number[]):EvaluationCase{
 const s=fixture(),kind=index%5;
 s.run.id='heldout_'+index;s.input.facts.lines[0].signed_amount=String(values[0]);s.input.facts.goals[0].payload.target.value=String(values[1]);s.input.facts.goals[0].payload.contributionSchedule.dayOfMonth=values[2]%28+1;
 s.run.settings={...settings,months:3};s.input.facts.goals[0].payload.due='2026-04-30';
 let expected='DRAFT_READY';
 if(kind===1){s.input.facts.lines[0].signed_amount='0';expected='INFEASIBLE';}
 if(kind===2){s.run.intent='investigation';s.run.goalId=null;s.input.facts.coverage=[];expected='PARTIAL';}
 if(kind===3){s.run.intent='investigation';s.run.goalId=null;coverage(s);s.input.facts.events=[event('transfer','transfer',String(values[3]),'2026-01-20',{oneLeg:true})];expected='NEEDS_REVIEW';}
 if(kind===4){s.input.facts.lines[0].signed_amount='0';s.input.facts.goals[0].payload.contributionSchedule.dayOfMonth=20;s.input.facts.plans=[{id:'late_income',version:0,payload:{name:'Owner confirmed late income',kind:'income',amount:{value:String(values[1]),currency:'VND'},accountId:'private_account',start:'2026-02-27',end:'2026-02-27',recurrence:'once',dayOfMonth:27,category:'Synthetic',holdingId:null,archived:false}}];}
 s.input.facts.accounts.reverse();s.input.facts.goals.reverse();
 return {id:'HELD-'+index,group:kind<2||kind===4?'plan':'adjust',state:s,expected,coverage:'RANDOMIZED_TYPED_INSTANCES_NO_LANGUAGE_BENCHMARK'};
}
