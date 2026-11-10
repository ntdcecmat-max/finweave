import {readFileSync,openSync,readSync,closeSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {sha,jcs} from './crypto.ts';
import {engineDigest} from './engine-pin.ts';
import {alias,scopedPlanningContext} from './tool-gateway.ts';
import type {Decision} from './tool-gateway.ts';
import {goalCandidate} from '../engine/planning.ts';
import {Ajv2020} from 'ajv/dist/2020.js';
export interface DecisionProvider {
 readonly mode:'local_model';
 prepare(state:any):{prompt:string;inputTokens:number};
 decide(prompt:string,signal:AbortSignal):Promise<{decision:Decision;outputTokens:number}>;
}
// Display labels stay on the server. The model selects Engine/owner proposals;
// it does not recreate money, account identities or private names from prose.
function proposedBodies(state:any):any[]{
 const owner=state.checkpoint.answers?.findLast((a:any)=>a.proposal)?.proposal??state.input.proposalBody;
 const values=[owner,...(state.checkpoint.candidates??[]),state.draft?.body];
 if(state.run.goalId)for(const day of [undefined,1,28])values.push(goalCandidate(state,day));
 return [...new Map(values.filter(Boolean).map(body=>[jcs(body),body])).values()];
}
function bodyForModel(state:any,body:any){
 const value=structuredClone(body),run=state.run.id;
 value.notes='';value.scope=value.scope.map((id:string)=>alias(run,'account',id));
 for(const [kind,rows]of [['goal',value.goals],['plan',value.items]] as const)for(const row of rows){
  row.name=kind==='goal'?'Goal':'Plan';row.account=alias(run,'account',row.account);
  if(row.existingId)row.existingId=alias(run,kind,row.existingId);
  if(row.holding)row.holding=alias(run,'holding',row.holding);
 }
 return value;
}
export function providerFormat(state:any){
 const canonical=JSON.parse(readFileSync(new URL('../../../docs/agent/decision-schemas.json',import.meta.url),'utf8'));
 const defs=structuredClone(canonical.$defs);
 for(const capability of ['getCoverage','getTransactions']){
  const issued=state.checkpoint.results.filter((r:any)=>r.capability===capability).map((r:any)=>r.value?.nextCursor).filter((v:any)=>typeof v==='string');
  defs[capability+'Args'].properties.cursor={enum:[null,...new Set(issued)]};
 }
 const results=state.checkpoint.results,refs=results.map((r:any)=>r.ref);
 const bindRefs=(property:any,values:string[])=>Object.assign(property,{items:values.length?{enum:values}:{type:'string'},maxItems:Math.min(20,values.length)});
 for(const name of ['getEvidenceArgs','proposeReviewActionsArgs','finishRunArgs'])bindRefs(defs[name].properties.evidenceRefs,refs);
 bindRefs(defs.finishRunArgs.properties.assumptionRefs,refs);
 bindRefs(defs.finishRunArgs.properties.proposalRefs,state.run.draftId?[state.run.draftId]:[]);
 // Shared body schema removes three identical copies. Grammar is compiled for
 // the captured intent, while the canonical server validator stays authoritative.
 defs.PlanningBody=defs.compareScenariosArgs.properties.candidates.items;
 defs.compareScenariosArgs.properties.candidates.items={$ref:'#/$defs/PlanningBody'};
 defs.proposePlanningDraftArgs.properties.body={$ref:'#/$defs/PlanningBody'};
 defs.amendPlanningDraftArgs.properties.body={$ref:'#/$defs/PlanningBody'};
 const registry=JSON.parse(readFileSync(new URL('../../../docs/agent/tool-registry.json',import.meta.url),'utf8'));
 const allowed=new Set(registry.capabilities.filter((c:any)=>c.intents.includes(state.run.intent)).map((c:any)=>c.name));
 const latest=(name:string)=>results.findLast((r:any)=>r.capability===name&&(r.constraintRevision??0)===(state.checkpoint.constraintRevision??0));
 for(const name of ['getCoverage','getTransactions','getFinancialSnapshot','getPlanningContext','getPlanActualVariance']){
  const prior=state.checkpoint.results.findLast((r:any)=>r.capability===name&&(r.constraintRevision??0)===(state.checkpoint.constraintRevision??0));
  if(prior&&!prior.value?.nextCursor)allowed.delete(name);
 }
 if(!state.checkpoint.results.length)for(const name of [...allowed])if(!['getFinancialSnapshot','getPlanningContext','getCoverage','askClarification','finishRun'].includes(name as string))allowed.delete(name);
 if(!refs.length||latest('getEvidence'))allowed.delete('getEvidence');
 const reasons=[...new Set<string>(results.filter((r:any)=>r.capability==='getTransactions').flatMap((r:any)=>r.value.items??[]).flatMap((row:any)=>[...(row.reviewReasons??[]),...(row.kind==='transfer'&&row.oneLeg?['TRANSFER_UNRESOLVED']:[]),...(row.kind==='refund'&&!row.originVerified?['REFUND_LINEAGE_MISSING']:[])]))];
 if(!reasons.length||latest('proposeReviewActions'))allowed.delete('proposeReviewActions');
 else defs.proposeReviewActionsArgs.properties.reasonCodes.items={enum:reasons};
 const missing:string[]=[];
 if(state.input.reserveConfirmed===false&&!state.checkpoint.answers?.some((a:any)=>a.reserveConfirmed))missing.push('reserve');
 if(state.run.settings.income===null||state.run.settings.expense===null)missing.push('income_assumptions');
 if(state.run.intent!=='investigation'&&!state.run.goalId&&!state.input.proposalBody&&!state.checkpoint.answers?.some((a:any)=>a.proposal))missing.push('priorities');
 if(!missing.length||state.checkpoint.clarifications>=2)allowed.delete('askClarification');
 else defs.askClarificationArgs.properties.missingFields.items={enum:missing};
 const proposals=proposedBodies(state),compared=latest('compareScenarios');
 const evaluated=(state.checkpoint.candidates??[]).filter((_:any,index:number)=>compared?.value[index]?.feasible);
 // A draft body must have been evaluated in this constraint revision. Matching
 // the entire proposal also preserves owner labels when resolving it server-side.
 const bindBodies=(name:string,bodies:any[])=>{
  if(!bodies.length)allowed.delete(name);
  else defs[name+'Args'].properties.body={enum:bodies.map(body=>bodyForModel(state,body))};
 };
 if(state.run.draftId){allowed.delete('proposePlanningDraft');const alreadyFeasible=state.draft&&evaluated.some((body:any)=>jcs(body)===jcs(state.draft.body));bindBodies('amendPlanningDraft',alreadyFeasible?[]:evaluated);}
 else {allowed.delete('amendPlanningDraft');bindBodies('proposePlanningDraft',evaluated);}
 if(!latest('getPlanningContext')||missing.length||!proposals.length)allowed.delete('compareScenarios');
 else defs.compareScenariosArgs.properties.candidates.items={enum:proposals.map(body=>bodyForModel(state,body))};
 for(const name of ['simulatePlan','amendPlanningDraft']){
  if(!state.run.draftId||!state.draft)allowed.delete(name);
  else {defs[name+'Args'].properties.draftRef={const:state.run.draftId};defs[name+'Args'].properties.expectedVersion={const:state.draft.version};}
 }
 let conclusions=['PARTIAL'];
 if(!state.input.scope.length)conclusions=['NO_DATA'];
 else if(state.run.intent==='investigation'){
  const coverage=latest('getCoverage'),snapshot=latest('getFinancialSnapshot'),transactions=latest('getTransactions');
  if(!snapshot)for(const name of ['getTransactions','getEvidence','getPlanningContext','getPlanActualVariance','proposeReviewActions'])allowed.delete(name);
  if(!coverage||!snapshot)allowed.delete('finishRun');
  if(coverage&&snapshot&&!coverage.value.complete&&!coverage.value.nextCursor)for(const name of [...allowed])if(name!=='finishRun')allowed.delete(name);
  else if(coverage.value.complete&&transactions&&!transactions.value.nextCursor){
   const uncertain=results.filter((r:any)=>r.capability==='getTransactions').flatMap((r:any)=>r.value.items??[]).some((r:any)=>r.posting!=='posted'||r.kind==='unknown'||r.reviewReasons?.length||r.oneLeg);
   if(!uncertain)conclusions=['FACTS_EXPLAINED'];
   else if(reasons.length&&latest('proposeReviewActions'))conclusions=['NEEDS_REVIEW'];
  }
 }else{
  // Planning comparisons already inspect frozen ledger/coverage in the Engine.
  // Re-reading transaction pages cannot improve a typed proposal and used to
  // exhaust the model's budget before it reached the planning tools.
  for(const name of ['getCoverage','getTransactions','getEvidence','proposeReviewActions'])allowed.delete(name);
  if(!latest('getPlanningContext'))allowed.delete('getFinancialSnapshot');
  if(state.run.intent!=='plan'||!scopedPlanningContext(state).plans.length)allowed.delete('getPlanActualVariance');
  if(!latest('getPlanningContext'))allowed.delete('finishRun');
  if(compared&&evaluated.length&&state.run.draftId&&state.draft)conclusions=['DRAFT_READY'];
  else if(compared&&compared.value.every((r:any)=>!r.feasible)&&!compared.value.some((r:any)=>r.warnings.some((w:string)=>/UNKNOWN|COVERAGE/.test(w))))conclusions=['INFEASIBLE'];
  if(compared&&evaluated.length)for(const name of [...allowed])if(!['proposePlanningDraft','amendPlanningDraft','finishRun'].includes(name as string))allowed.delete(name);
 }
 defs.finishRunArgs.properties.conclusion.enum=conclusions;
 defs.Decision.oneOf=defs.Decision.oneOf.filter((d:any)=>allowed.has(d.properties.capability.const));
 const needed=new Set<string>(['Decision']);
 const collect=(value:any)=>{for(const ref of jcs(value).matchAll(/#\/\$defs\/([A-Za-z0-9]+)/g)){if(!needed.has(ref[1]!)){needed.add(ref[1]!);collect(defs[ref[1]!]);}}};collect(defs.Decision);
 return {$defs:Object.fromEntries([...needed].map(key=>[key,defs[key]])),$ref:'#/$defs/Decision'};
}
const digest=(path:string)=>sha(readFileSync(new URL('../../../docs/agent/'+path,import.meta.url)));
function artifactDigest(path:string){
 const fd=openSync(path,'r'),hash=createHash('sha256'),buffer=Buffer.allocUnsafe(1024*1024);
 try{for(;;){const count=readSync(fd,buffer,0,buffer.length,null);if(!count)break;hash.update(buffer.subarray(0,count));}return hash.digest('hex');}
 finally{closeSync(fd);}
}
export function validateModelManifest(m:any){
 if(m.status!=='PINNED_SYNTHETIC_LOCAL'||m.cloudDisabled!==true||m.syntheticOnly!==true||m.modelOrigin!=='https://huggingface.co/Qwen/Qwen3-4B')throw Error('MODEL_UNAVAILABLE');
 for(const field of ['runtimeImageDigest','weightsDigest','ollamaManifestDigest','tokenizerDigest','chatTemplateDigest','licenseDigest'])if(!/^[a-f0-9]{64}$/.test(m[field]??''))throw Error('MODEL_UNAVAILABLE');
 for(const field of ['runtimeVersion','modelRevision','quantization','modelName'])if(typeof m[field]!=='string'||!m[field].trim())throw Error('MODEL_UNAVAILABLE');
 for(const [key,path]of [['promptHash','prompt-template.md'],['toolRegistryHash','tool-registry.json'],['decisionSchemaHash','decision-schemas.json']])if(m[key]!==digest(path!))throw Error('MODEL_UNAVAILABLE');
 if(m.engineDigest!==engineDigest)throw Error('MODEL_UNAVAILABLE');
 const url=new URL(m.endpoint);
 if(url.protocol!=='http:'||url.hostname!=='127.0.0.1'||url.port!=='11434'||url.pathname!=='/'||url.username||url.password||url.search||url.hash)throw Error('MODEL_UNAVAILABLE');
 for(const [key,path]of [['runtimeImageDigest','runtimeArtifact'],['weightsDigest','weightsArtifact'],['ollamaManifestDigest','ollamaManifestArtifact'],['tokenizerDigest','tokenizerArtifact'],['chatTemplateDigest','chatTemplateArtifact'],['licenseDigest','licenseArtifact']])if(!m[path!]||artifactDigest(m[path!])!==m[key!])throw Error('MODEL_UNAVAILABLE');
}
export function modelContext(state:any){
 const {run,input,checkpoint}=state;
 if(input.facts.holdings.length||input.facts.quotes.length)throw Error('MODEL_UNAVAILABLE');
 const context=scopedPlanningContext(state),accounts=input.scope.map((id:string)=>alias(run.id,'account',id));
 const safe=(value:any):any=>{
  if(typeof value==='string'){
   for(const [kind,rows]of [['account',input.facts.accounts],['goal',input.facts.goals],['plan',input.facts.plans],['holding',input.facts.holdings]] as const){const row=rows.find((r:any)=>r.id===value);if(row)return alias(run.id,kind,row.id);}
   return value;
  }
  if(Array.isArray(value))return value.map(safe);
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['name','notes','category','sourceIds','snapshotRefs','context','accountId','goalId','simulationId','id'].includes(k)).map(([k,v])=>[k,safe(v)]));
  return value;
 };
 const proposal=checkpoint.answers.findLast((a:any)=>a.proposal)?.proposal??input.proposalBody;
 const comparison=checkpoint.results.findLast((r:any)=>r.capability==='compareScenarios'&&(r.constraintRevision??0)===(checkpoint.constraintRevision??0));
 const options=run.draftId||!checkpoint.results.some((r:any)=>r.capability==='getPlanningContext')?[]:comparison?(checkpoint.candidates??[]):proposedBodies(state).slice(0,1);
 const observation=(r:any)=>r.capability==='compareScenarios'?r.value.map((v:any)=>({feasible:v.feasible,warnings:v.warnings})):safe(r.value);
 return {intent:run.intent,selectedGoal:run.goalId?alias(run.id,'goal',run.goalId):null,accounts,settings:run.settings,constraintRevision:checkpoint.constraintRevision??0,asOf:new Date(input.asOf).toISOString(),planning:context,results:checkpoint.results.map((r:any)=>({ref:r.ref,capability:r.capability,constraintRevision:r.constraintRevision??0,value:observation(r)})),draft:state.draft?{ref:state.draft.id,version:state.draft.version}:null,ownerProposal:proposal?{available:true}:null,proposalOptions:options.map((body:any)=>bodyForModel(state,body)),remainingActions:8-run.toolCalls};
}
export function resolveModelDecision(state:any,decision:Decision):Decision {
 const mapping=new Map<string,string>();
 for(const [kind,rows]of [['account',state.input.facts.accounts],['goal',state.input.facts.goals],['plan',state.input.facts.plans],['holding',state.input.facts.holdings]] as const)for(const row of rows)mapping.set(alias(state.run.id,kind,row.id),row.id);
 const d=structuredClone(decision),body=d.arguments.body,candidates=d.arguments.candidates;
 for(const b of candidates??(body?[body]:[])){
  const original=proposedBodies(state).find(candidate=>jcs(bodyForModel(state,candidate))===jcs(b));
  if(original){Object.assign(b,structuredClone(original));continue;}
  const resolve=(ref:string)=>{const id=mapping.get(ref);if(!id)throw Error('INVALID_DECISION');return id;};
  b.scope=b.scope.map(resolve);
  for(const row of [...b.goals,...b.items]){row.account=resolve(row.account);if(row.existingId)row.existingId=resolve(row.existingId);if(row.holding)row.holding=resolve(row.holding);}
 }
 return d;
}
export function compactModelRequest(state:any){
 const format:any=providerFormat(state),context:any=modelContext(state),proposals:Record<string,any>={};
 const refs=(bodies:any[])=>bodies.map(body=>{const ref='proposal_'+sha(jcs(body)).slice(0,16);proposals[ref]=body;return ref;});
 const replace=(name:string,key:string,next:string,array=false)=>{
  const schema=format.$defs[name+'Args'];if(!schema)return;
  const bodies=array?schema.properties[key].items.enum:schema.properties[key].enum;
  if(!bodies)return;const ids=refs(bodies),old=schema.properties[key];delete schema.properties[key];
  schema.properties[next]=array?{...old,items:{enum:ids}}:{enum:ids};
  schema.required=schema.required.map((k:string)=>k===key?next:k);
 };
 replace('compareScenarios','candidates','candidateRefs',true);
 replace('proposePlanningDraft','body','proposalRef');replace('amendPlanningDraft','body','proposalRef');
 context.proposalOptions=Object.entries(proposals).map(([ref,body]:[string,any])=>({ref,goals:body.goals.map((g:any)=>({target:g.target,due:g.due,contribution:g.contribution,day:g.day,skipMonths:g.skipMonths})),items:body.items.map((p:any)=>({kind:p.kind,amount:p.amount})),reserve:body.reserve,income:body.income,expense:body.expense}));
 return {format,context,proposals};
}
export function expandModelDecision(decision:Decision,proposals:Record<string,any>):Decision{
 const value=structuredClone(decision),args=value.arguments;
 const body=(ref:string)=>{if(!Object.hasOwn(proposals,ref))throw Error('INVALID_DECISION');return structuredClone(proposals[ref]);};
 if(value.capability==='compareScenarios'){args.candidates=args.candidateRefs.map(body);delete args.candidateRefs;}
 if(['proposePlanningDraft','amendPlanningDraft'].includes(value.capability)){args.body=body(args.proposalRef);delete args.proposalRef;}
 return value;
}
async function boundedJSON(response:Response,cap:number){
 if(!response.ok||!response.body)throw Error('MODEL_UNAVAILABLE');
 const reader=response.body.getReader();let size=0;const chunks:Uint8Array[]=[];
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>cap)throw Error('CONTEXT_LIMIT');chunks.push(value);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}finally{await reader.cancel().catch(()=>{});}
}
export class OllamaProvider implements DecisionProvider {
 readonly mode='local_model' as const;private manifest:any;
 constructor(manifest:any){validateModelManifest(manifest);this.manifest=manifest;}
 async preflight(){
  const get=async(path:string)=>boundedJSON(await fetch('http://127.0.0.1:11434'+path,{redirect:'error',signal:AbortSignal.timeout(3000)}),65536);
  const version=await get('/api/version'),tags=await get('/api/tags');
  if(version.version!==this.manifest.runtimeVersion||!tags.models?.some((m:any)=>m.name===this.manifest.modelName&&m.digest===this.manifest.ollamaManifestDigest))throw Error('MODEL_UNAVAILABLE');
  // Load pinned weights before claiming a user's bounded job. No owner context
  // is sent here and cold-start time cannot consume that job's action budget.
  const loaded=await boundedJSON(await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',redirect:'error',signal:AbortSignal.timeout(90000),headers:{'content-type':'application/json'},body:JSON.stringify({model:this.manifest.modelName,messages:[],stream:false,keep_alive:'10m',options:{num_ctx:8192}})}),65536);
  if(loaded.done!==true)throw Error('MODEL_UNAVAILABLE');
 }
 prepare(state:any){
  const {format,context,proposals}=compactModelRequest(state);
  const allowedCapabilities=format.$defs.Decision.oneOf.map((decision:any)=>({name:decision.properties.capability.const,argumentKeys:Object.keys(format.$defs[decision.properties.arguments.$ref.split('/').at(-1)!]?.properties??{})}));
  // Grammar is sent through the decoder's format channel; do not repeat the full
  // PlanningBody schema in the model's input or charge it as prompt tokens.
  const text=jcs({context,allowedCapabilities}),prompt=jcs({context,format,text,proposals});
  const bytes=Buffer.byteLength(text)+Buffer.byteLength(readFileSync(new URL('../../../docs/agent/prompt-template.md',import.meta.url)));
  if(Buffer.byteLength(jcs(format))>49152||bytes>7168)throw Error('CONTEXT_LIMIT');return {prompt,inputTokens:bytes};
 }
 async decide(prompt:string,signal:AbortSignal){
  const prepared=JSON.parse(prompt),format=prepared.format;
  const raw=await boundedJSON(await fetch('http://127.0.0.1:11434/api/chat',{method:'POST',redirect:'error',signal,headers:{'content-type':'application/json'},body:JSON.stringify({model:this.manifest.modelName,stream:false,think:false,format,messages:[{role:'system',content:readFileSync(new URL('../../../docs/agent/prompt-template.md',import.meta.url),'utf8')},{role:'user',content:prepared.text}],options:{temperature:0,seed:0,num_ctx:8192,num_predict:1024}})}),65536);
  if(raw.done!==true||raw.done_reason==='length'||raw.message?.thinking||typeof raw.message?.content!=='string'||!Number.isInteger(raw.eval_count)||raw.eval_count<0||raw.eval_count>1024)throw Error('INVALID_DECISION');
  let decision:Decision;try{decision=JSON.parse(raw.message.content);}catch{throw Error('INVALID_DECISION');}
  if(!new Ajv2020({strict:false}).compile(format)(decision))throw Error('INVALID_DECISION');
  return {decision:expandModelDecision(decision,prepared.proposals),outputTokens:raw.eval_count};
 }
}
export async function configuredProvider(path:string|undefined){
 if(!path)return null;
 try{const p=new OllamaProvider(JSON.parse(readFileSync(path,'utf8')));await p.preflight();return p;}catch{return null;}
}
