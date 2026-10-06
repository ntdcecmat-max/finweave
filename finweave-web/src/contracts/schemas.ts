import { z } from 'zod';
import {PresentationSnapshot} from './presentation';

/** Logical contracts only. Financial DTOs MUST NOT be sent to a real gateway. */
export const CONTRACT_VERSION = '1.1.0' as const;
const obj = z.strictObject;
export const Id = z.string().regex(/^[A-Za-z0-9_-]{1,80}$/);
export const DateOnly = z.iso.date();
export const Timestamp = z.iso.datetime({ offset: true });
export const Version = z.number().int().nonnegative();
export const Digest = z.string().regex(/^[a-f0-9]{64}$/);
export const Text = z.string().trim().min(1).max(500);
export const Reason = z.string().trim().min(1).max(500);
export const DecimalText = z.string().regex(/^-?(0|[1-9]\d{0,17})(\.\d{1,8})?$/);
export const NonnegativeDecimal = z.string().regex(/^(0|[1-9]\d{0,17})(\.\d{1,8})?$/);
export const PositiveInteger = z.string().regex(/^[1-9]\d{0,17}$/, 'Số tiền phải là VND nguyên >0, không dấu phân cách.');
export const NonnegativeInteger = z.string().regex(/^(0|[1-9]\d{0,17})$/);
export const Money = obj({ value: z.string().regex(/^(0|[1-9]\d{0,17}|-[1-9]\d{0,17})$/), currency: z.literal('VND') });
export const Amount = obj({ value: PositiveInteger, currency: z.literal('VND') });
export const OpeningAmount = obj({ value: NonnegativeInteger, currency: z.literal('VND') });
export const Quantity = obj({ value: NonnegativeDecimal, unit: z.enum(['share','chi','luong']) });
export const Price = obj({ value: NonnegativeDecimal, currency: z.enum(['VND','USD']), per: z.enum(['share','chi','luong']) });
export const Period = obj({ start: DateOnly, endExclusive: DateOnly, timezone: z.literal('Asia/Ho_Chi_Minh') });
export const Evidence = obj({ id: Id, sourceId: Id.nullable(), kind: z.enum(['manual','import','provider','calculated']), recordedAt: Timestamp, observedDate: DateOnly.nullable(), reference: Text.nullable(),subjectRefs:z.array(obj({type:z.enum(['account','holding','event','review','quote','observation','plan','goal','simulation','message']),id:Id})),content:obj({format:z.enum(['text','csv_row','normalized_event','manual_declaration','decision']),rawText:z.string().max(65536).nullable(),normalizedFields:z.record(z.string().min(1).max(100),z.string().max(1000)).nullable()}).nullable() });
export const Quality = obj({ status: z.enum(['complete','partial','unknown','stale']), sourceIds: z.array(Id), asOf: Timestamp, reasons: z.array(z.enum(['MISSING_QUANTITY','MISSING_PRICE','MISSING_FX','INCOMPATIBLE_UNIT','STALE_SOURCE','NO_DATA','OUTSIDE_SNAPSHOT'])) });
export const Metric = obj({label:Text.optional(), value: Money.nullable(), missingReason: z.enum(['MISSING_QUANTITY','MISSING_PRICE','MISSING_FX','INCOMPATIBLE_UNIT','NO_DATA','OUTSIDE_SNAPSHOT']).nullable(), classification: z.enum(['actual','planned','simulated','unknown']), quality: Quality, evidenceIds: z.array(Id) });
export const History = obj({ id: Id, at: Timestamp, action: Text, reason: Reason.nullable(), actorId: Id, version: Version, evidenceIds: z.array(Id) });
export const SourceRecord = obj({id:Id,sourceId:Id,sourceRecordId:Id,sourceVersion:Version,parserVersion:Id,mappingVersion:Id,rawEvidenceId:Id,normalizedEventId:Id.nullable(),status:z.enum(['staged','invalid','duplicate','linked'])});
export const EntryGroup = obj({id:Id,eventId:Id,version:Version,reversalOf:Id.nullable(),committedAt:Timestamp,entries:z.array(obj({accountRef:Id,side:z.enum(['debit','credit']),amount:Amount})).min(2)});
export const CashObservation = obj({id:Id,accountId:Id,observed:OpeningAmount,asOf:Timestamp,matchedWorkspaceVersion:Version,variance:Money,caseId:Id.nullable(),evidenceId:Id});
export const SnapshotRefs = obj({workspaceVersion:Version,sourceVersions:z.record(Id,Version),holdingVersions:z.record(Id,Version),quoteIds:z.array(Id),eventVersions:z.record(Id,Version),planVersions:z.record(Id,Version),goalVersions:z.record(Id,Version)});
export const FinancialPlan = obj({id:Id,workspaceId:Id,version:Version,currency:z.literal('VND'),horizon:DateOnly,baselineSnapshotId:Id,baselineWorkspaceVersion:Version,lifecycle:z.enum(['active','archived']),assumptions:z.array(Text),itemIds:z.array(Id)});
export const Workspace = obj({ id: Id, version: Version, businessClock: Timestamp, trackingStart: DateOnly, currency: z.literal('VND'), timezone: z.literal('Asia/Ho_Chi_Minh'), synthetic: z.boolean() });
export const Account = obj({ id: Id, version: Version, name: Text, kind: z.enum(['bank','wallet','cash']), opening: OpeningAmount, openingDate: DateOnly, archived: z.boolean(), balance: Metric, evidenceIds: z.array(Id) });
export const AccountInput = obj({ name: Text, kind: z.enum(['bank','wallet','cash']), opening: OpeningAmount, openingDate: DateOnly });
export const Holding = obj({ id: Id, version: Version, name: Text, kind: z.enum(['stock','gold']), quantity: Quantity, quantityDate: DateOnly, market: Text, product: Text.nullable(), purity: Text.nullable(), cost: OpeningAmount.nullable(), costDate: DateOnly.nullable(), costQuantity: Quantity.nullable(), archived: z.boolean(), valuation: Metric, evidenceIds: z.array(Id) });
export const HoldingInput = obj({ name: Text, kind: z.enum(['stock','gold']), quantity: Quantity, quantityDate: DateOnly, market: Text, product: Text.nullable(), purity: Text.nullable(), cost: OpeningAmount.nullable(), costDate: DateOnly.nullable() });
export const HoldingMovement = obj({id:Id,holdingId:Id,version:Version,quantity:Quantity,delta:DecimalText.nullable(),date:DateOnly,kind:z.enum(['declaration','investment','correction']),eventId:Id.nullable(),reason:Reason,evidenceIds:z.array(Id)});
export const Quote = obj({ id: Id, version:Version, holdingId: Id, price: Price, at: Timestamp, sourceId: Id, fxVndPerUsd: NonnegativeDecimal.nullable(), fxAt: Timestamp.nullable(), compatible: z.boolean(), evidenceIds: z.array(Id) });
export const QuoteInput = Quote.omit({id:true,version:true,evidenceIds:true});
export const Transaction = obj({ id: Id, version: Version, kind: z.enum(['income','expense','transfer','refund','investment','adjustment','unknown']), amount: Money, date: DateOnly, accountId: Id, toAccountId: Id.nullable(), category: Text, description: Text, posting: z.enum(['posted','pending','draft','reversed']), reconciliation: z.enum(['clear','review','linked']), reference: Text.nullable(), originId: Id.nullable(), reversalOf: Id.nullable(), holdingId: Id.nullable(), planLinkId: Id.nullable(), manualCategoryOverride: z.boolean(), evidenceIds: z.array(Id), history: z.array(History) });
const EventBase = { amount: Amount, date: DateOnly, accountId: Id, description: Text, category: Text, posting: z.enum(['posted','draft','pending']), reference: Text.nullable() };
export const EventInput = z.discriminatedUnion('kind',[
  obj({...EventBase,kind:z.literal('income')}), obj({...EventBase,kind:z.literal('expense')}),
  obj({...EventBase,kind:z.literal('transfer'),toAccountId:Id,oneLeg:z.boolean(),fee:OpeningAmount}),
  obj({...EventBase,kind:z.literal('refund'),originId:Id.nullable()}),
  obj({...EventBase,kind:z.literal('investment'),holdingId:Id,quantity:Quantity})
]);
export const Source = obj({ id: Id, version: Version, name: Text, kind: z.enum(['bank','price']), connection: z.enum(['connected','disconnected','revoked']), lastSuccess: Timestamp.nullable(), lastAttempt: Timestamp.nullable(), errorCode: Id.nullable(), freshness: Quality });
export const Review = obj({ id: Id, version: Version, type: z.enum(['cash','duplicate','invalid','transfer','refund','quality','category','pending']), title: Text, status: z.enum(['open','resolved']), eventId: Id.nullable(), holdingId: Id.nullable(), accountId: Id.nullable(), variance: Money.nullable(), observed: OpeningAmount.nullable(), rawEvidenceId: Id.nullable(), history: z.array(History) });
export const ResolutionInput = z.discriminatedUnion('action',[
 obj({action:z.literal('defer'),reason:Reason}),obj({action:z.literal('adjustUnknown'),reason:Reason}),obj({action:z.literal('forgottenExpense'),category:Text,reason:Reason}),
 obj({action:z.literal('confirmTransfer'),reason:Reason}),obj({action:z.literal('mergeDuplicate'),reason:Reason}),obj({action:z.literal('linkRefund'),originId:Id,reason:Reason}),
 obj({action:z.literal('categorize'),category:Text,reason:Reason}),obj({action:z.literal('postPending'),reason:Reason}),obj({action:z.literal('rejectPending'),reason:Reason}),
 obj({action:z.literal('acknowledgeQuality'),reason:Reason}),obj({action:z.literal('dismissInvalid'),reason:Reason}),obj({action:z.literal('supplementInvalid'),event:EventInput,reason:Reason})
]);
export const QueryContext = obj({ period: Period, accountIds: z.array(Id).max(100), snapshotVersion: Version.nullable() });
export const PageInput = obj({ cursor: z.string().min(1).max(1024).nullable(), pageSize: z.number().int().min(1).max(100) });
export function page<T extends z.ZodType>(item:T) {return obj({items:z.array(item),nextCursor:z.string().min(1).max(1024).nullable(),snapshotVersion:Version,totalCount:z.number().int().nonnegative().nullable()});}
export const TransactionFilter = obj({ context: QueryContext, page: PageInput, kind:z.enum(['all','income','expense','transfer','refund','investment','unknown']), posting:z.enum(['all','posted','draft','pending','reversed']), reconciliation:z.enum(['all','clear','review','linked']), category:Text.nullable(), accountId:Id.nullable(), planItemId:Id.nullable(), search:z.string().max(100), sort:z.enum(['date_desc_id','date_asc_id']) });
export const Report = obj({ id:Id, version:Version, context:QueryContext, snapshotRefs:SnapshotRefs, cash:Metric, assets:Metric, income:Metric, grossExpense:Metric, refunds:Metric, netExpense:Metric, scopedFlow:Metric, knownAssetSubtotal:Money, spending:z.array(obj({category:Text,gross:Money,refunds:Money,net:Money,eventIds:z.array(Id)})), accounts:z.array(Account), holdings:z.array(Holding), evidenceIds:z.array(Id) });
export const Insight = obj({id:Id,version:Version,title:Text,text:Text,context:QueryContext,metric:Metric.nullable(),target:obj({navigation:z.enum(['home','transactions','plan','data','ai']),objectType:z.enum(['account','holding','event','review','goal','plan','formula']).nullable(),objectId:Id.nullable()}),evidenceIds:z.array(Id)});
export const ImportMapping = obj({ date:Text, amount:Text, description:Text, reference:Text.nullable(),debit:Text.optional(),credit:Text.optional(),currency:Text.optional(), dateFormat:z.enum(['yyyy-MM-dd','dd/MM/yyyy']), amountFormat:z.enum(['signed_integer_vnd','debit_credit_vnd']), encoding:z.literal('UTF-8') });
export const ImportRow = obj({id:Id,index:z.number().int().min(1),rawEvidenceId:Id,status:z.enum(['valid','invalid','duplicate']),normalized:EventInput.nullable(),errors:z.array(obj({field:Id,code:Id,message:Text})),matchedEventId:Id.nullable()});
export const ImportPreview = obj({id:Id,previewToken:Id,expiresAt:Timestamp,workspaceVersion:Version,fileDigest:Digest,mappingDigest:Digest,profileVersion:Id,mappingVersion:Version,accountId:Id,rows:z.array(ImportRow),quality:Quality});
export const ImportJob = obj({id:Id,version:Version,state:z.enum(['pending','running','completed','failed']),previewId:Id,accountId:Id,sourceId:Id,profileVersion:Id,mappingVersion:Version,selectedRowIds:z.array(Id),committedEventIds:z.array(Id),reviewCaseIds:z.array(Id),resultWorkspaceVersion:Version.nullable(),errorCode:Id.nullable(),createdAt:Timestamp,updatedAt:Timestamp});
export const PlanInput = obj({name:Text,kind:z.enum(['income','expense','investment']),amount:Amount,accountId:Id,start:DateOnly,end:DateOnly,recurrence:z.enum(['once','monthly']),dayOfMonth:z.number().int().min(1).max(31),category:Text,holdingId:Id.nullable()});
export const PlanItem = PlanInput.extend({id:Id,version:Version,archived:z.boolean(),baselineCash:Money.nullable(),baselineAssets:Money.nullable(),history:z.array(History)});
export const ActualLink = obj({id:Id,version:Version,planItemId:Id,planItemVersion:Version,occurrenceId:Id,eventId:Id,eventVersion:Version,reason:Reason});
export const PlanForecast = obj({version:Version,horizon:DateOnly,actualCash:Metric,actualAssets:Metric,forecastCash:Metric,forecastAssets:Metric,items:z.array(obj({item:PlanItem,occurrenceId:Id,date:DateOnly,actual:Money,remaining:Money,overspend:Money,links:z.array(ActualLink)})),assumptions:z.array(Text)});
export const ContributionSchedule = obj({amount:Amount,accountId:Id,start:DateOnly,dayOfMonth:z.number().int().min(1).max(31)});
export const GoalInput = obj({name:Text,target:Amount,due:DateOnly,contributionSchedule:ContributionSchedule.nullable()});
export const Allocation = obj({id:Id,version:Version,goalId:Id,accountId:Id,earmarked:Amount,funded:OpeningAmount,shortfall:OpeningAmount,active:z.boolean()});
export const Goal = GoalInput.extend({id:Id,version:Version,status:z.enum(['active','achieved','archived']),allocations:z.array(Allocation),funded:Metric,shortfall:OpeningAmount,progressPercent:NonnegativeDecimal,history:z.array(History)});
export const SimulationInput = obj({goalId:Id,mode:z.enum(['save','consume','invest']),amount:Amount,count:z.number().int().min(1).max(24),accountId:Id,firstDate:DateOnly,intervalDays:z.number().int().min(1).max(366),horizon:DateOnly});
export const Simulation = SimulationInput.extend({id:Id,version:Version,baseWorkspaceVersion:Version,goalVersion:Version,snapshotRefs:SnapshotRefs,context:QueryContext,steps:z.array(obj({date:DateOnly,amount:Amount,mode:z.enum(['save','consume','invest'])})),baseCash:Metric,baseAssets:Metric,baseIncome:Metric,baseGrossExpense:Metric,baseNetExpense:Metric,baseScopedFlow:Metric,cash:Metric,assets:Metric,income:Metric,scopedFlow:Metric,grossExpense:Metric,netExpense:Metric,cumulativeGrossExpense:Metric,cumulativeNetExpense:Metric,goalFunded:Metric,assumptions:z.array(Text),createdAt:Timestamp});
export const AIContext = obj({navigation:z.enum(['home','transactions','plan','data','ai']),route:Text,query:QueryContext,transactionFilter:TransactionFilter.nullable(),selected:obj({type:z.enum(['event','holding','account','review','plan','goal','simulation','formula']),id:Id}).nullable(),workspaceVersion:Version,snapshotRefs:SnapshotRefs,capturedAt:Timestamp});
export const Conversation = obj({id:Id,version:Version,title:Text,createdAt:Timestamp,updatedAt:Timestamp,lastContext:AIContext.nullable()});
export const AIResult = obj({id:Id,messageId:Id,mode:z.literal('scripted_mock'),context:AIContext,tool:z.enum(['reports','portfolio','plans','goals','simulation','insights']),text:Text,metrics:z.array(Metric),evidenceIds:z.array(Id),targets:z.array(Insight.shape.target),stale:z.boolean(),createdAt:Timestamp});
export const Message = obj({id:Id,conversationId:Id,version:Version,role:z.enum(['user','assistant']),text:Text,context:AIContext,state:z.enum(['processing','completed','failed','cancelled']),result:AIResult.nullable(),errorCode:Id.nullable(),createdAt:Timestamp});
export const Session = obj({sessionId:Id,subjectId:Id,deviceId:Id,workspaceIds:z.array(Id),role:z.literal('owner'),expiresAt:Timestamp,synthetic:z.boolean()});
export const MutationAck = obj({operationId:Id,workspaceVersion:Version,objectVersions:z.record(Id,Version),affectedIds:z.array(Id),replayed:z.boolean()});
export const MutationPreview = obj({previewToken:Id,operationId:Id,workspaceVersion:Version,expiresAt:Timestamp,before:Report,after:Report,warnings:z.array(Text),classification:z.enum(['actual','planned','simulated'])});
export const ErrorDTO = obj({contractVersion:z.literal(CONTRACT_VERSION),requestId:Id,code:z.enum(['VALIDATION','UNAUTHENTICATED','FORBIDDEN','NOT_FOUND','VERSION_CONFLICT','IDEMPOTENCY_CONFLICT','PREVIEW_EXPIRED','PREVIEW_MISMATCH','CURSOR_INVALID','RATE_LIMITED','TIMEOUT','OFFLINE','SERVICE_UNAVAILABLE','CANCELLED','SECURITY_TRANSPORT_NOT_VERIFIED']),message:Text,retryable:z.boolean(),fieldErrors:z.array(obj({field:Text,code:Id,message:Text})),currentVersion:Version.nullable(),retryAfterSeconds:z.number().int().min(1).nullable()});
export const MutationOptions = obj({idempotencyKey:Id,expectedWorkspaceVersion:Version,expectedObjectVersions:z.record(Id,Version),previewToken:Id.nullable()});
export const LogicalRequest = obj({contractVersion:z.literal(CONTRACT_VERSION),requestId:Id,workspaceId:Id,operationId:Id,input:z.unknown(),mutation:MutationOptions.nullable()});
// Allowlisted, candidate outer shape. Bytes are opaque; this schema is NOT encryption.
export const ProtectedEnvelope = obj({transportVersion:z.literal('1'),channelId:Id,sequence:z.string().regex(/^(0|[1-9]\d{0,19})$/),ciphertext:z.string().min(1).max(2000000)});
export const schemas = {Id,DateOnly,Timestamp,Version,Digest,Money,Amount,OpeningAmount,Quantity,Price,Period,Evidence,Quality,Metric,History,SourceRecord,EntryGroup,CashObservation,SnapshotRefs,FinancialPlan,Workspace,Account,AccountInput,Holding,HoldingInput,HoldingMovement,Quote,QuoteInput,Transaction,EventInput,Source,Review,ResolutionInput,QueryContext,PageInput,TransactionFilter,Report,Insight,ImportMapping,ImportRow,ImportPreview,ImportJob,PlanInput,PlanItem,ActualLink,PlanForecast,ContributionSchedule,GoalInput,Allocation,Goal,SimulationInput,Simulation,AIContext,Conversation,AIResult,Message,Session,MutationAck,MutationPreview,ErrorDTO,MutationOptions,LogicalRequest,ProtectedEnvelope,PresentationSnapshot};
export type SchemaName = keyof typeof schemas;
export type DTO<N extends SchemaName> = z.infer<(typeof schemas)[N]>;
