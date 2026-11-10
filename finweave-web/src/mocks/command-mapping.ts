import type {Store,Command} from '../domain/model';
import type {OperationId} from '../contracts/operations';
export function toDomainCommand(operation:OperationId,input:any,store:Store,key='PREVIEW'):Command {
 const i=input;let kind='',data:Record<string,string>={};const fields=(value:any)=>Object.fromEntries(Object.entries(value).map(([k,v])=>[k,String(v??'')]));
 const event=(v:any)=>fields({kind:v.kind,amount:v.amount.value,date:v.date,account:v.accountId,description:v.description,category:v.category,posting:v.posting,reference:v.reference,to:v.toAccountId,fee:v.fee?.value,oneLeg:v.oneLeg,origin:v.originId,holding:v.holdingId,quantity:v.quantity?.value});
 const plan=(v:any)=>fields({name:v.name,kind:v.kind,amount:v.amount.value,account:v.accountId,date:v.start,end:v.end,recurrence:v.recurrence,day:v.dayOfMonth,category:v.category,holding:v.holdingId,reason:i.reason||'Lưu planned item'});
 const goal=(v:any)=>fields({name:v.name,target:v.target.value,due:v.due,...v.projection,contribution:v.contributionSchedule?.amount.value,contributionAccount:v.contributionSchedule?.accountId,contributionStart:v.contributionSchedule?.start,contributionDay:v.contributionSchedule?.dayOfMonth,contributionSkipMonths:v.contributionSchedule?.skipMonths?JSON.stringify(v.contributionSchedule.skipMonths):undefined,reason:i.reason||'Lưu mục tiêu'});
 switch(operation) {
 case 'updateTrackingSettings':kind='tracking';data={date:i.trackingStart};break;
 case 'createAccount':kind='account';data=fields({name:i.name,kind:i.kind,opening:i.opening.value,date:i.openingDate});break;
 case 'archiveAccount':kind='accountArchive';data=i;break;
 case 'createHolding':kind='holding';data=fields({name:i.name,kind:i.kind,quantity:i.quantity.value,unit:i.quantity.unit,date:i.quantityDate,market:i.market,product:i.product,purity:i.purity,cost:i.cost?.value});break;
 case 'updateHoldingQuantity':kind='quantity';data=fields({id:i.id,quantity:i.quantity.value,unit:i.quantity.unit,date:i.date,reason:i.reason});break;
 case 'updateHoldingCost':kind='cost';data=fields({id:i.id,cost:i.cost?.value,date:i.date,reason:i.reason});break;
 case 'recordPriceQuote':kind='quote';data=fields({id:i.holdingId,price:i.price.value,currency:i.price.currency,unit:i.price.per,date:i.at.slice(0,10),fx:i.fxVndPerUsd,compatible:i.compatible});break;
 case 'createEvent':kind='event';data=event(i);break;
 case 'updateDraft':case 'correctPostedEvent':kind='correct';data=fields({id:i.id,amount:i.amount.value,description:i.description,reason:i.reason});break;
 case 'updateCategory':kind='category';data=i;break;
 case 'postDraft':kind='postDraft';data=i;break;
 case 'recordCashCount':kind='cashCount';data=fields({account:i.accountId,observed:i.observed.value,reason:i.reason});break;
 case 'refreshSource':case 'disconnectSource':case 'reconnectSource':kind='source';data={id:i.id,action:operation==='refreshSource'?'success':operation==='disconnectSource'?'disconnect':'reconnect'};break;
 case 'ingestSourceEvidence':kind='source';data={id:i.sourceId,action:'notification'};break;
 case 'reviseSourceRecord':kind='revision';data={id:i.eventId,amount:i.amount.value,reason:i.reason};break;
 case 'createPlanItem':case 'updatePlanItem':kind='plan';data={...plan(i.item||i),...(i.id?{id:i.id}:{})};break;
 case 'archivePlanItem':kind='planArchive';data=i;break;
 case 'linkPlanActual':kind='planLink';data={event:i.eventId,plan:i.planItemId,reason:i.reason};break;
 case 'unlinkPlanActual':kind='planLink';data={event:i.id,plan:'unlink',reason:i.reason};break;
 case 'createGoal':case 'updateGoal':kind='goal';data={...goal(i.goal||i),...(i.id?{id:i.id}:{})};break;
 case 'allocateGoal':kind='allocate';data={id:i.goalId,account:i.accountId,amount:i.amount.value,reason:i.reason};break;
 case 'releaseGoalAllocation':case 'markGoalAchieved':case 'archiveGoal':kind='goalAction';data=fields({id:i.goalId||i.id,allocation:i.allocationId,action:operation==='releaseGoalAllocation'?'release':operation==='markGoalAchieved'?'achieved':'archive',assessedExpense:i.assessment?.monthlyExpense.value,assessedDebt:i.assessment?.debt?.value,reason:i.reason});break;
 case 'simulateGoalOutcome':kind='simulate';data=fields({goal:i.goalId,mode:i.mode,amount:i.amount.value,count:i.count,account:i.accountId,firstDate:i.firstDate,intervalDays:i.intervalDays,horizon:i.horizon});break;
 case 'resolveReviewCase':{kind='resolve';const names:Record<string,string>={defer:'ignore',adjustUnknown:'adjust',forgottenExpense:'expense',confirmTransfer:'received',mergeDuplicate:'duplicate',linkRefund:'link',categorize:'categorize',postPending:'post',rejectPending:'reject',acknowledgeQuality:'resolve',dismissInvalid:'dismiss',supplementInvalid:'supplement'};data={id:i.id,action:names[i.resolution.action],reason:i.resolution.reason,...(i.resolution.category?{category:i.resolution.category}:{}),...(i.resolution.originId?{origin:i.resolution.originId}:{}),...(i.resolution.event?event(i.resolution.event):{})};break;}
 case 'linkRefund':{const review=store.reviews.find(r=>r.event===i.refundId&&r.type==='refund');if(!review)throw Error('Khoản nhận chưa có case refund phù hợp.');kind='resolve';data={id:review.id,action:'link',origin:i.originId,reason:i.reason};break;}
 default:throw Error('Operation không có domain command: '+operation);
 }
 return {kind,data,key,version:store.version};
}
