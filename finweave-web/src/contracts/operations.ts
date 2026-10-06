import { z } from 'zod';
import Decimal from 'decimal.js';
import * as S from './schemas';
import {PresentationSnapshot} from './presentation';
const obj = z.strictObject;
const empty = obj({});
const byId = obj({id:S.Id});
const reasonId = obj({id:S.Id,reason:S.Reason});
const list = obj({page:S.PageInput});
const context = obj({context:S.QueryContext});
const moneyChange = obj({id:S.Id,amount:S.Amount,description:S.Text,reason:S.Reason});
function operation<I extends z.ZodType,O extends z.ZodType>(kind:'query'|'mutation',input:I,output:O,impact:readonly string[],preview=false,status=200) {return {kind,input,output,impact,preview,status,permission:'owner' as const};}
const financial = ['workspace','accounts','transactions','reports','holdings','reviews','plans','goals','insights','aiStaleness'];
const planning = ['workspace','plans','goals','simulations','insights','aiStaleness'];
export const operations = {
 getPresentationSnapshot:operation('query',empty,PresentationSnapshot,[]),
 getImportTemplate:operation('query',empty,obj({csv:z.string().max(65536)}),[]),
 ingestSourceEvidence:operation('mutation',obj({sourceId:S.Id,matchedEventId:S.Id,rawEvidence:z.string().min(1).max(65536)}),S.MutationAck,[...financial,'sources'],true),
 reviseSourceRecord:operation('mutation',obj({sourceId:S.Id,eventId:S.Id,amount:S.Amount,reason:S.Reason}),S.MutationAck,[...financial,'sources'],true),
 getSession:operation('query',empty,S.Session,[]),
 getWorkspace:operation('query',empty,S.Workspace,[]),
 updateTrackingSettings:operation('mutation',obj({trackingStart:S.DateOnly,reason:S.Reason}),S.MutationAck,financial,true),
 listAccounts:operation('query',obj({includeArchived:z.boolean(),page:S.PageInput}),S.page(S.Account),[]),
 getAccount:operation('query',byId,S.Account,[]),
 createAccount:operation('mutation',S.AccountInput,S.MutationAck,financial,true),
 archiveAccount:operation('mutation',reasonId,S.MutationAck,financial,true),
 listHoldings:operation('query',obj({context:S.QueryContext,page:S.PageInput,kind:z.enum(['all','stock','gold'])}),S.page(S.Holding),[]),
 getHolding:operation('query',byId,S.Holding,[]),
 createHolding:operation('mutation',S.HoldingInput,S.MutationAck,financial,true),
 updateHoldingQuantity:operation('mutation',obj({id:S.Id,quantity:S.Quantity,date:S.DateOnly,reason:S.Reason}),S.MutationAck,financial,true),
 updateHoldingCost:operation('mutation',obj({id:S.Id,cost:S.OpeningAmount.nullable(),date:S.DateOnly,reason:S.Reason}),S.MutationAck,financial,true),
 listHoldingMovements:operation('query',obj({id:S.Id,page:S.PageInput}),S.page(S.HoldingMovement),[]),
 listPriceQuotes:operation('query',obj({holdingId:S.Id,page:S.PageInput,asOf:S.Timestamp}),S.page(S.Quote),[]),
 recordPriceQuote:operation('mutation',S.QuoteInput,S.MutationAck,financial,true),
 listTransactions:operation('query',S.TransactionFilter,S.page(S.Transaction),[]),
 getTransaction:operation('query',byId,S.Transaction,[]),
 createEvent:operation('mutation',S.EventInput,S.MutationAck,financial,true),
 updateDraft:operation('mutation',moneyChange,S.MutationAck,financial,true),
 correctPostedEvent:operation('mutation',moneyChange,S.MutationAck,financial,true),
 updateCategory:operation('mutation',obj({id:S.Id,category:S.Text,reason:S.Reason}),S.MutationAck,financial,true),
 postDraft:operation('mutation',reasonId,S.MutationAck,financial,true),
 linkRefund:operation('mutation',obj({refundId:S.Id,originId:S.Id,reason:S.Reason}),S.MutationAck,financial,true),
 recordCashCount:operation('mutation',obj({accountId:S.Id,observed:S.OpeningAmount,reason:S.Reason}),S.MutationAck,['workspace','reviews','accounts','aiStaleness'],true),
 getOverview:operation('query',context,S.Report,[]),
 getSpendingReport:operation('query',context,S.Report,[]),
 getPortfolio:operation('query',context,S.Report,[]),
 getInsights:operation('query',context,S.page(S.Insight),[]),
 listSources:operation('query',list,S.page(S.Source),[]),
 refreshSource:operation('mutation',byId,S.MutationAck,[...financial,'sources'],false),
 disconnectSource:operation('mutation',reasonId,S.MutationAck,['workspace','sources','reports','holdings','reviews','aiStaleness']),
 reconnectSource:operation('mutation',byId,S.MutationAck,['workspace','sources','reviews','aiStaleness']),
 previewImport:operation('query',obj({accountId:S.Id,fileName:S.Text,csv:z.string().min(1).max(65536),mapping:S.ImportMapping,expectedWorkspaceVersion:S.Version}),S.ImportPreview,[]),
 confirmImport:operation('mutation',obj({previewId:S.Id,previewToken:S.Id,selectedRowIds:z.array(S.Id).min(1).max(20)}),S.ImportJob,['importJobs'],true,202),
 getImportJob:operation('query',byId,S.ImportJob,[]),
 listImportJobs:operation('query',list,S.page(S.ImportJob),[]),
 listReviewCases:operation('query',obj({page:S.PageInput,status:z.enum(['all','open','resolved']),type:z.enum(['all','cash','duplicate','invalid','transfer','refund','quality','category','pending'])}),S.page(S.Review),[]),
 getReviewCase:operation('query',byId,S.Review,[]),
 resolveReviewCase:operation('mutation',obj({id:S.Id,resolution:S.ResolutionInput}),S.MutationAck,financial,true),
 listPlanItems:operation('query',obj({page:S.PageInput,includeArchived:z.boolean(),kind:z.enum(['all','income','expense','investment'])}),S.page(S.PlanItem),[]),
 createPlanItem:operation('mutation',S.PlanInput,S.MutationAck,planning,true),
 updatePlanItem:operation('mutation',obj({id:S.Id,item:S.PlanInput,reason:S.Reason}),S.MutationAck,planning,true),
 archivePlanItem:operation('mutation',reasonId,S.MutationAck,planning,true),
 getPlanForecast:operation('query',obj({horizon:S.DateOnly}),S.PlanForecast,[]),
 linkPlanActual:operation('mutation',obj({planItemId:S.Id,planItemVersion:S.Version,occurrenceId:S.Id,eventId:S.Id,eventVersion:S.Version,reason:S.Reason}),S.MutationAck,planning,true),
 unlinkPlanActual:operation('mutation',reasonId,S.MutationAck,planning,true),
 listGoals:operation('query',obj({page:S.PageInput,status:z.enum(['all','active','achieved','archived'])}),S.page(S.Goal),[]),
 getGoalProgress:operation('query',byId,S.Goal,[]),
 createGoal:operation('mutation',S.GoalInput,S.MutationAck,planning,true),
 updateGoal:operation('mutation',obj({id:S.Id,goal:S.GoalInput,reason:S.Reason}),S.MutationAck,planning,true),
 allocateGoal:operation('mutation',obj({goalId:S.Id,accountId:S.Id,amount:S.Amount,reason:S.Reason}),S.MutationAck,planning,true),
 releaseGoalAllocation:operation('mutation',obj({goalId:S.Id,allocationId:S.Id.nullable(),reason:S.Reason}),S.MutationAck,planning,true),
 markGoalAchieved:operation('mutation',reasonId,S.MutationAck,planning,true),
 archiveGoal:operation('mutation',reasonId,S.MutationAck,planning,true),
 simulateGoalOutcome:operation('mutation',S.SimulationInput,S.Simulation,['workspace','simulations','aiStaleness'],true),
 listSimulations:operation('query',obj({goalId:S.Id.nullable(),page:S.PageInput}),S.page(S.Simulation),[]),
 getSimulation:operation('query',byId,S.Simulation,[]),
 listConversations:operation('query',list,S.page(S.Conversation),[]),
 createConversation:operation('mutation',obj({title:S.Text}),S.Conversation,['conversations']),
 getConversation:operation('query',byId,obj({conversation:S.Conversation,messages:S.page(S.Message)}),[]),
 listMessages:operation('query',obj({conversationId:S.Id,page:S.PageInput}),S.page(S.Message),[]),
 sendAssistantMessage:operation('mutation',obj({conversationId:S.Id,text:S.Text,context:S.AIContext}),S.Message,['conversations','messages'],false,202),
 getAssistantMessage:operation('query',byId,S.Message,[]),
 cancelAssistantMessage:operation('mutation',byId,S.Message,['conversations','messages']),
 getEvidence:operation('query',byId,S.Evidence,[]),
 previewMutation:operation('query',obj({operationId:S.Id,input:z.unknown(),expectedWorkspaceVersion:S.Version,expectedObjectVersions:z.record(S.Id,S.Version)}),S.MutationPreview,[]),
} as const;
export type OperationId = keyof typeof operations;
export type Input<K extends OperationId> = z.infer<(typeof operations)[K]['input']>;
export type Output<K extends OperationId> = z.infer<(typeof operations)[K]['output']>;
export function validateInput<K extends OperationId>(name:K,input:unknown):Input<K> {
 const parsed=operations[name].input.parse(input);
 const value=parsed as any;
 const period=value.context?.period??value.context?.query?.period??value.query?.period;
 if(period&&period.start>=period.endExclusive)throw new Error('PERIOD_ORDER');
 if(name==='createEvent'&&value.kind==='transfer'&&value.accountId===value.toAccountId)throw new Error('TRANSFER_SAME_ACCOUNT');
 if(name==='createEvent'&&value.kind==='investment'&&new Decimal(value.quantity.value).lte(0))throw new Error('QUANTITY_POSITIVE');
 if(name==='createHolding'&&((value.kind==='stock'&&value.quantity.unit!=='share')||(value.kind==='gold'&&value.quantity.unit==='share')))throw new Error('UNIT_INCOMPATIBLE');
 if(name==='recordPriceQuote'&&(new Decimal(value.price.value).lte(0)||(value.fxVndPerUsd!==null&&new Decimal(value.fxVndPerUsd).lte(0))))throw new Error('PRICE_FX_POSITIVE');
 const plan=name==='createPlanItem'?value:name==='updatePlanItem'?value.item:null;
 if(plan&&plan.start>plan.end)throw new Error('HORIZON_ORDER');
 if(plan&&plan.kind==='investment'&&!plan.holdingId)throw new Error('HOLDING_REQUIRED');
 if(name==='simulateGoalOutcome'&&value.firstDate>value.horizon)throw new Error('STEPS_OUTSIDE_HORIZON');
 if(name==='resolveReviewCase'&&value.resolution.action==='supplementInvalid'&&!['income','expense'].includes(value.resolution.event.kind))throw new Error('SUPPLEMENT_KIND_INVALID');
 if(name==='previewMutation') {
  const p=parsed as Input<'previewMutation'>;
  if(!(p.operationId in operations) || operations[p.operationId as OperationId].kind!=='mutation') throw new Error('PREVIEW_OPERATION_INVALID');
  validateInput(p.operationId as OperationId,p.input);
 }
 return parsed as Input<K>;
}
export function validateOutput<K extends OperationId>(name:K,output:unknown):Output<K> {
 const parsed=operations[name].output.parse(output);
 const walk=(v:any)=>{if(!v||typeof v!=='object')return;
  if('classification' in v&&'missingReason' in v&&'quality' in v){if(v.value===null&&(!v.missingReason||v.classification!=='unknown'))throw new Error('UNKNOWN_METRIC_REASON_REQUIRED');if(v.value!==null&&(v.missingReason!==null||v.classification==='unknown'))throw new Error('KNOWN_METRIC_REASON_INVALID');}
  if('committedEventIds' in v&&v.state!=='completed'&&(v.committedEventIds.length||v.resultWorkspaceVersion!==null))throw new Error('JOB_PREMATURE_COMMIT');
  if('conversationId' in v&&['failed','cancelled'].includes(v.state)&&v.result!==null)throw new Error('AI_FAILED_RESULT_PRESENT');
  for(const child of Object.values(v))walk(child);
 };walk(parsed);return parsed as Output<K>;
}
