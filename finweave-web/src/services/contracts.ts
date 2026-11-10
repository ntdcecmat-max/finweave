import type { DTO } from '../contracts/schemas';
import type { OperationId,Input,Output } from '../contracts/operations';
export interface CallOptions { requestId:string; workspaceId:string; mutation:DTO<'MutationOptions'>|null; signal?:AbortSignal; }
export interface Reply<K extends OperationId> {contractVersion:'1.1.0'|'2.0.0';requestId:string;workspaceVersion:K extends 'getSession'?number|null:number;data:Output<K>;}
export interface LogicalTransport { readonly mode:'synthetic_mock'|'protected'; call<K extends OperationId>(operation:K,input:Input<K>,options:CallOptions):Promise<Reply<K>>; }
/** Named methods, inferred from the versioned schema. Authorization remains inside the trusted service. */
export type Services = {[K in OperationId]:(input:Input<K>,options:CallOptions)=>Promise<Reply<K>>};
export type WorkspaceServices = Pick<Services,'getSession'|'getWorkspace'|'updateTrackingSettings'|'listAccounts'|'getAccount'|'createAccount'|'archiveAccount'>;
export type PortfolioServices = Pick<Services,'listHoldings'|'getHolding'|'createHolding'|'updateHoldingQuantity'|'updateHoldingCost'|'listHoldingMovements'|'listPriceQuotes'|'recordPriceQuote'|'getPortfolio'>;
export type LedgerServices = Pick<Services,'listTransactions'|'getTransaction'|'createEvent'|'updateDraft'|'correctPostedEvent'|'updateCategory'|'postDraft'|'linkRefund'|'recordCashCount'>;
export type DataServices = Pick<Services,'listSources'|'refreshSource'|'disconnectSource'|'reconnectSource'|'previewImport'|'confirmImport'|'getImportJob'|'listImportJobs'|'listReviewCases'|'getReviewCase'|'resolveReviewCase'|'getEvidence'>;
export type PlanServices = Pick<Services,'listPlanItems'|'createPlanItem'|'updatePlanItem'|'archivePlanItem'|'getPlanForecast'|'linkPlanActual'|'unlinkPlanActual'|'listGoals'|'getGoalProgress'|'createGoal'|'updateGoal'|'allocateGoal'|'releaseGoalAllocation'|'markGoalAchieved'|'archiveGoal'|'simulateGoalOutcome'|'listSimulations'|'getSimulation'>;
export type AssistantServices = Pick<Services,'listConversations'|'createConversation'|'getConversation'|'listMessages'|'sendAssistantMessage'|'getAssistantMessage'|'cancelAssistantMessage'>;
export type ReportServices = Pick<Services,'getOverview'|'getSpendingReport'|'getInsights'|'previewMutation'>;
export function bindServices(transport:LogicalTransport):Services {
 return new Proxy({} as Services,{get:(_target,name)=> (input:never,options:CallOptions)=>transport.call(name as OperationId,input,options)});
}
