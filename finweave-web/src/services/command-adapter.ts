import type {Command,Store} from '../domain/model';
import type {OperationId} from '../contracts/operations';
import {occurrences,day} from '../domain/selectors';
const money=(value:string)=>({value,currency:'VND'});
const why=(d:Record<string,string>)=>d.reason||'Xác nhận thao tác thủ công';
export function commandOperation(c:Command,s:Store):{operation:OperationId;input:any} {
 const d=c.data;if(import.meta.env.VITE_DATA_MODE==='backend'&&(c.kind==='revision'||c.kind==='source'&&['notification','fail','revoke'].includes(d.action)))throw Error('SYNTHETIC_ONLY: công cụ dữ liệu minh họa chỉ chạy trong môi trường mock.');let operation:OperationId,input:any;
 const plan=()=>({name:d.name,kind:d.kind,amount:money(d.amount),accountId:d.account,start:d.date,end:d.end,recurrence:d.recurrence,dayOfMonth:Number(d.day||d.date.slice(-2)),category:d.category||'Chưa phân loại',holdingId:d.kind==='investment'?d.holding:null});
 const goal=()=>({name:d.name,target:money(d.target),due:d.due,...(d.criterion?{projection:{criterion:d.criterion,profile:d.profile||'cash',targetBasis:d.targetBasis||'nominal',expenseMultiple:Number(d.expenseMultiple||25),liquidMonths:Number(d.liquidMonths||0),icon:d.icon||'target'}}:{}),contributionSchedule:d.contribution?{amount:money(d.contribution),accountId:d.contributionAccount,start:d.contributionStart,dayOfMonth:Number(d.contributionDay||d.contributionStart.slice(-2))}:null});
 const event=(data:Record<string,string>)=>({kind:data.kind,amount:money(data.amount),date:data.date,accountId:data.account,description:data.description,category:data.category||'Chưa phân loại',posting:data.posting||'posted',reference:data.reference||null,...(data.kind==='transfer'?{toAccountId:data.to,oneLeg:data.oneLeg==='true',fee:money(data.fee||'0')}:{}),...(data.kind==='refund'?{originId:data.origin||null}:{}),...(data.kind==='investment'?{holdingId:data.holding,quantity:{value:data.quantity,unit:s.holdings.find(h=>h.id===data.holding)?.unit||'share'}}:{})});
 switch(c.kind) {
 case 'tracking':operation='updateTrackingSettings';input={trackingStart:d.date,reason:why(d)};break;
 case 'account':operation='createAccount';input={name:d.name,kind:d.kind,opening:money(d.opening),openingDate:d.date};break;
 case 'accountArchive':operation='archiveAccount';input={id:d.id,reason:why(d)};break;
 case 'holding':operation='createHolding';input={name:d.name,kind:d.kind,quantity:{value:d.quantity,unit:d.unit},quantityDate:d.date,market:d.market,product:d.kind==='gold'?d.product:null,purity:d.kind==='gold'?d.purity:null,cost:d.cost?money(d.cost):null,costDate:d.cost?d.date:null};break;
 case 'quantity':operation='updateHoldingQuantity';input={id:d.id,quantity:{value:d.quantity,unit:d.unit},date:d.date,reason:why(d)};break;
 case 'cost':operation='updateHoldingCost';input={id:d.id,cost:d.cost?money(d.cost):null,date:d.date,reason:why(d)};break;
 case 'quote':operation='recordPriceQuote';input={holdingId:d.id,price:{value:d.price,currency:d.currency,per:d.unit},at:d.date===day(s.clock)?s.clock:d.date+'T17:00:00+07:00',sourceId:'MANUAL',fxVndPerUsd:d.fx||null,fxAt:d.fx?d.date+'T17:00:00+07:00':null,compatible:d.compatible!=='false'};break;
 case 'event':operation='createEvent';input=event(d);break;
 case 'category':operation='updateCategory';input={id:d.id,category:d.category,reason:why(d)};break;
 case 'correct':operation=s.events.find(e=>e.id===d.id)?.posting==='posted'?'correctPostedEvent':'updateDraft';input={id:d.id,amount:money(d.amount),description:d.description||s.events.find(e=>e.id===d.id)?.description,reason:why(d)};break;
 case 'postDraft':operation='postDraft';input={id:d.id,reason:why(d)};break;
 case 'cashCount':operation='recordCashCount';input={accountId:d.account,observed:money(d.observed),reason:why(d)};break;
 case 'source':operation=({success:'refreshSource',disconnect:'disconnectSource',reconnect:'reconnectSource',notification:'ingestSourceEvidence'} as Record<string,OperationId>)[d.action];if(!operation)throw Error('Source scenario chỉ dùng synthetic control.');input=operation==='ingestSourceEvidence'?{sourceId:d.id,matchedEventId:'DEMO-06',rawEvidence:'Thông báo mẫu · REF-DEMO-06 · 600000 VND'}:operation==='disconnectSource'?{id:d.id,reason:why(d)}:{id:d.id};break;
 case 'revision':operation='reviseSourceRecord';input={sourceId:'S-BANK',eventId:d.id,amount:money(d.amount),reason:why(d)};break;
 case 'plan':operation=d.id?'updatePlanItem':'createPlanItem';input=d.id?{id:d.id,item:plan(),reason:why(d)}:plan();break;
 case 'planArchive':operation='archivePlanItem';input={id:d.id,reason:why(d)};break;
 case 'planLink':{const e=s.events.find(e=>e.id===d.event)!;if(d.plan==='unlink'){operation='unlinkPlanActual';input={id:e.id,reason:why(d)};}else{const p=s.plans.find(p=>p.id===d.plan);if(!p)throw Error('Kế hoạch không tồn tại.');const row=occurrences(p).find(row=>row.date>=e.date)||occurrences(p).at(-1);operation='linkPlanActual';input={planItemId:p.id,planItemVersion:p.version,occurrenceId:(row?.id||'').replace(/@/g,'_'),eventId:e.id,eventVersion:e.version,reason:why(d)};}break;}
 case 'goal':operation=d.id?'updateGoal':'createGoal';input=d.id?{id:d.id,goal:goal(),reason:why(d)}:goal();break;
 case 'allocate':operation='allocateGoal';input={goalId:d.id,accountId:d.account,amount:money(d.amount),reason:why(d)};break;
 case 'goalAction':operation=d.action==='release'?'releaseGoalAllocation':d.action==='achieved'?'markGoalAchieved':'archiveGoal';input=operation==='releaseGoalAllocation'?{goalId:d.id,allocationId:d.allocation||null,reason:why(d)}:{id:d.id,reason:why(d),...(d.action==='achieved'&&d.assessedExpense?{assessment:{monthlyExpense:money(d.assessedExpense),debt:d.assessedDebt?money(d.assessedDebt):null}}:{})};break;
 case 'simulate':{operation='simulateGoalOutcome';const from=Date.parse(day(s.clock)+'T00:00:00Z'),span=Math.round((Date.parse(d.horizon+'T00:00:00Z')-from)/86400000),count=Number(d.count);const firstDate=d.firstDate||new Date(from+Math.ceil(span/count)*86400000).toISOString().slice(0,10);input={goalId:d.goal,mode:d.mode,amount:money(d.amount),count,accountId:d.account,firstDate,intervalDays:Number(d.firstDate?d.intervalDays||15:Math.max(1,Math.floor(span/count))),horizon:d.horizon};break;}
 case 'resolve':{operation='resolveReviewCase';const names:Record<string,string>={ignore:'defer',adjust:'adjustUnknown',expense:'forgottenExpense',received:'confirmTransfer',duplicate:'mergeDuplicate',link:'linkRefund',categorize:'categorize',post:'postPending',reject:'rejectPending',resolve:'acknowledgeQuality',dismiss:'dismissInvalid',supplement:'supplementInvalid'};const action=names[d.action];input={id:d.id,resolution:{action,reason:why(d),...(['forgottenExpense','categorize'].includes(action)?{category:d.category||'Chưa phân loại'}:{}),...(action==='linkRefund'?{originId:d.origin}:{}),...(action==='supplementInvalid'?{event:event({...d,account:d.account||s.reviews.find(r=>r.id===d.id)?.account||'',posting:'posted'})}:{})}};break;}
 case 'import':operation='confirmImport';input={previewId:d.previewId,previewToken:d.previewToken,selectedRowIds:JSON.parse(d.selectedRowIds||'[]')};break;
 default:throw Error('Thao tác chưa được ánh xạ vào service.');
 }
 return {operation,input};
}
/** Only explicitly synthetic settings/scenarios; no arbitrary business command over this channel. */
export function syntheticCommand(c:Command){return ['reset','fault','advance'].includes(c.kind)||(c.kind==='source'&&['fail','revoke'].includes(c.data.action));}
