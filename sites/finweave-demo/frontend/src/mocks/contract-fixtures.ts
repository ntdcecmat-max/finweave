import { operations,validateInput,validateOutput } from '../contracts/operations';
import type { OperationId,Input } from '../contracts/operations';
import { CONTRACT_VERSION,ErrorDTO,LogicalRequest } from '../contracts/schemas';
import type { DTO } from '../contracts/schemas';
import { exampleOutput,job } from '../contracts/examples';
import type { LogicalTransport,CallOptions,Reply } from '../services/contracts';

export const commonScenarios=['success','validation','unauthenticated','forbidden','not_found','version_conflict','idempotency_conflict','rate_limited','timeout','offline','unavailable','cancelled'] as const;
export type MockScenario=(typeof commonScenarios)[number]|'job_running'|'job_completed'|'job_failed'|'ai_no_data'|'ai_tool_failed';
export class ContractFailure extends Error {
 constructor(public readonly status:number,public readonly dto:DTO<'ErrorDTO'>) {super(dto.code);}
}
const failures:Partial<Record<MockScenario,[number,DTO<'ErrorDTO'>['code'],boolean]>>={validation:[422,'VALIDATION',false],unauthenticated:[401,'UNAUTHENTICATED',false],forbidden:[403,'FORBIDDEN',false],not_found:[404,'NOT_FOUND',false],version_conflict:[409,'VERSION_CONFLICT',false],idempotency_conflict:[409,'IDEMPOTENCY_CONFLICT',false],rate_limited:[429,'RATE_LIMITED',true],timeout:[0,'TIMEOUT',true],offline:[0,'OFFLINE',true],unavailable:[503,'SERVICE_UNAVAILABLE',true],cancelled:[0,'CANCELLED',false]};
/** Protocol fixture, not a ledger repository. Does not persist real or M1 UI state. */
export class SyntheticFixtureTransport implements LogicalTransport {
 readonly mode='synthetic_mock' as const;
 private keys=new Map<string,{operation:OperationId,input:unknown,reply:Reply<OperationId>}>();
 constructor(private readonly config:{syntheticDataset:true;scenario?:MockScenario;version?:number}) {
  if(config.syntheticDataset!==true) throw new Error('SYNTHETIC_DATASET_REQUIRED');
 }
 private fail(options:CallOptions,status:number,code:DTO<'ErrorDTO'>['code'],retryable=false):never {
  throw new ContractFailure(status,ErrorDTO.parse({contractVersion:CONTRACT_VERSION,requestId:options.requestId,code,message:'Lỗi mock synthetic: '+code,retryable,fieldErrors:[],currentVersion:code==='VERSION_CONFLICT'?(this.config.version??10):null,retryAfterSeconds:code==='RATE_LIMITED'?30:null}));
 }
 async call<K extends OperationId>(name:K,input:Input<K>,options:CallOptions):Promise<Reply<K>> {
  if(options.signal?.aborted) this.fail(options,0,'CANCELLED');
  LogicalRequest.parse({contractVersion:CONTRACT_VERSION,operationId:name,input,workspaceId:options.workspaceId,requestId:options.requestId,mutation:options.mutation});
  if(options.workspaceId!=='W-DEMO') this.fail(options,403,'FORBIDDEN');
  const forced=failures[this.config.scenario??'success'];if(forced)this.fail(options,...forced);
  try {validateInput(name,input);}catch {this.fail(options,422,'VALIDATION');}
  const op=operations[name];
  const version=this.config.version??10;
  if(op.kind==='mutation') {
   if(!options.mutation) this.fail(options,422,'VALIDATION');
   const prior=this.keys.get(options.mutation!.idempotencyKey);
   // Structural equality with normalized property order; fixture only, no cryptographic digest.
   if(prior) {
    if(prior.operation!==name||stable(prior.input)!==stable(input))this.fail(options,409,'IDEMPOTENCY_CONFLICT');
    const replay=structuredClone(prior.reply) as Reply<K>;
    replay.requestId=options.requestId;
    if('replayed' in (replay.data as object)) (replay.data as {replayed:boolean}).replayed=true;
    return replay;
   }
   if(options.mutation!.expectedWorkspaceVersion!==version)this.fail(options,409,'VERSION_CONFLICT');
   if(op.preview&&!options.mutation!.previewToken)this.fail(options,409,'PREVIEW_MISMATCH');
  } else if(options.mutation!==null) this.fail(options,422,'VALIDATION');
  let data=exampleOutput(name);
  if(name==='getImportJob' && this.config.scenario?.startsWith('job_')) {
   const state=this.config.scenario.slice(4);data={...job,state,version:2,committedEventIds:state==='completed'?['IMPORTED-01']:[],reviewCaseIds:state==='completed'?['REVIEW-INVALID-01']:[],resultWorkspaceVersion:state==='completed'?version+1:null,errorCode:state==='failed'?'SERVICE_UNAVAILABLE':null};
  }
  if(name==='previewMutation') data={...(data as object),operationId:(input as Input<'previewMutation'>).operationId};
  if(name==='getAssistantMessage'&&(this.config.scenario==='ai_no_data'||this.config.scenario==='ai_tool_failed')) data={...(data as object),state:'failed',result:null,errorCode:this.config.scenario==='ai_no_data'?'NO_DATA':'TOOL_FAILED'};
  const changesFinancialContext=op.kind==='mutation'&&!['confirmImport','createConversation','sendAssistantMessage','cancelAssistantMessage'].includes(name);
  const reply={contractVersion:CONTRACT_VERSION,requestId:options.requestId,workspaceVersion:changesFinancialContext?version+1:version,data:validateOutput(name,data)} as Reply<K>;
  if(op.kind==='mutation') this.keys.set(options.mutation!.idempotencyKey,{operation:name,input:structuredClone(input),reply:structuredClone(reply) as Reply<OperationId>});
  return reply;
 }
}
function stable(value:unknown):string {
 if(Array.isArray(value))return '['+value.map(stable).join(',')+']';
 if(value!==null&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+stable(v)).join(',')+'}';
 return JSON.stringify(value);
}
export function mayReplaceSnapshot(currentVersion:number,incomingVersion:number) {return incomingVersion>=currentVersion;}
