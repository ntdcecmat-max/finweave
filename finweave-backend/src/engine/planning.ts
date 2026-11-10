import {addDays,dateAt,occurrences,goalDTO} from './business.ts';
// All amounts in a proposal are calculated here, beside the deterministic
// financial Engine. The selector chooses hypotheses; it never computes money.
export function goalCandidate(state:any,day?:number){
 const {input,run}=state,f=input.facts,g=f.goals.find((x:any)=>x.id===run.goalId),c=g?.payload.contributionSchedule;
 if(!g||!c||!input.scope.includes(c.accountId)||run.settings.income===null||run.settings.expense===null)return null;
 const start=addDays(dateAt(input.asOf),1),anchor=day??c.dayOfMonth;
 const n=occurrences({id:g.id,version:g.version,payload:{...c,start,dayOfMonth:anchor,recurrence:'monthly',end:g.payload.due}},g.payload.due).filter(x=>x.date>=start).length;
 if(!n)return null;
 const funded=BigInt(goalDTO(f,g,input.asOf).funded.value.value),gap=BigInt(g.payload.target.value)>funded?BigInt(g.payload.target.value)-funded:0n;
 const reserve=(BigInt(run.settings.expense)*BigInt(Math.ceil(run.settings.reserveMonths*1000000))+999999n)/1000000n;
 return {goals:[{existingId:g.id,name:'Selected Goal',target:g.payload.target.value,due:g.payload.due,account:c.accountId,contribution:((gap+BigInt(n)-1n)/BigInt(n)).toString(),start,day:anchor,skipMonths:c.skipMonths??[],profile:g.payload.projection?.profile??'cash',ref:'selected_goal'}],items:[],links:[],scope:input.scope,reserve:reserve.toString(),income:run.settings.income,expense:run.settings.expense,priority:'preserve_plans',notes:'Engine proposal; target, deadline and competing reservations retained.',settings:run.settings};
}
