import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {sha,jcs} from '../src/runtime/crypto.ts';
import {ToolGateway} from '../src/runtime/tool-gateway.ts';
import {adaptiveDecision,fixedWorkflowDecision} from '../src/runtime/agent-selector.ts';
import {goalCandidate} from '../src/engine/planning.ts';
import {engineDigest} from '../src/runtime/engine-pin.ts';
import {publicCases} from '../evaluation/cases.ts';
import type {EvaluationCase} from '../evaluation/cases.ts';
const gateway=new ToolGateway(),dir=resolve('../docs/execution/evidence/backend-agent-runtime-2026-10-11'),privateDir=resolve('.local/agent-eval-'+Date.now());mkdirSync(dir,{recursive:true});
const source:Record<string,string>={};for(const folder of ['src/runtime','src/engine','database/runtime','evaluation'])for(const name of readdirSync(folder))source[folder+'/'+name]=sha(readFileSync(folder+'/'+name));
for(const path of ['scripts/evaluate-agent.ts','../docs/agent/prompt-template.md','../docs/agent/tool-registry.json','../docs/agent/decision-schemas.json','../docs/agent/evaluation-cases.json'])source[path]=sha(readFileSync(path));
const freeze={at:new Date().toISOString(),source,engineDigest,node:process.version,decoder:'deterministic; model NOT_RUN',tools:'FW-AGENT-TOOLS-001',rubric:'typed Engine outcomes + immutable actual/active inputs + financial oracle scalars'};
const freezePath=resolve(dir,'freeze-'+Date.now()+'.json');writeFileSync(freezePath,JSON.stringify(freeze,null,2)+'\n',{flag:'wx'});
const heldoutMetadata=JSON.parse(execFileSync(process.execPath,['evaluation/generate-heldout.ts',privateDir],{windowsHide:true,encoding:'utf8'}));
const splitPath=resolve(dir,'split-'+Date.now()+'.json');writeFileSync(splitPath,JSON.stringify({freezeDigest:sha(readFileSync(freezePath)),...heldoutMetadata,publicCasesBlind:false,tunedAfterGeneration:false},null,2)+'\n',{flag:'wx'});
const heldoutFile=readFileSync(resolve(privateDir,'heldout.json'));if(sha(heldoutFile)!==heldoutMetadata.digest)throw Error('HELDOUT_DIGEST');
const cases=[...publicCases().map(c=>({...c,split:'public-development'})),...JSON.parse(heldoutFile.toString()).cases.map((c:EvaluationCase)=>({...c,split:'held-out-process-generated'}))];
const modes=['manual_engine_compute','single_tool_assistant','fixed_branching_workflow','adaptive_deterministic'] as const;
const outcomes:any[]=[];
for(const c of cases)for(const mode of modes)for(let repeat=0;repeat<3;repeat++){
 const s=structuredClone(c.state),initial=jcs(s.input.facts),start=performance.now(),cpu=process.cpuUsage();let conclusion='PARTIAL',failure:null|string=null;
 try{for(let step=0;step<8;step++){
  let decision:any;
  if(mode==='single_tool_assistant'){
   if(step)break;decision={capability:'getFinancialSnapshot',arguments:{}};
  }else if(mode==='manual_engine_compute'&&s.run.intent!=='investigation'){
   if(s.input.reserveConfirmed===false){conclusion='CLARIFICATION';break;}
   const compared=s.checkpoint.results.find((r:any)=>r.capability==='compareScenarios');
   if(!compared){const candidate=s.input.proposalBody??goalCandidate(s);if(!candidate)break;const bodies=s.input.proposalBody?[candidate]:[candidate,goalCandidate(s,28),goalCandidate(s,1)].filter(Boolean);decision={capability:'compareScenarios',arguments:{candidates:bodies}};}
   else{const n=compared.value.findIndex((r:any)=>r.feasible);if(n<0){conclusion=compared.value.some((r:any)=>r.warnings.some((x:string)=>/UNKNOWN|COVERAGE/.test(x)))?'PARTIAL':'INFEASIBLE';break;}if(!s.run.draftId)decision={capability:'proposePlanningDraft',arguments:{body:s.checkpoint.candidates[n]}};else decision={capability:'finishRun',arguments:{conclusion:'DRAFT_READY',evidenceRefs:s.checkpoint.results.map((r:any)=>r.ref),assumptionRefs:[],proposalRefs:[s.run.draftId]}};}
  }else decision=(mode==='fixed_branching_workflow'?fixedWorkflowDecision:adaptiveDecision)(s);
  const result=gateway.execute(s,decision,step+1);s.run=result.next;s.checkpoint=result.cp;if(result.draft)s.draft=result.draft;
  if(s.run.state==='awaiting_user'){conclusion='CLARIFICATION';break;}if(s.run.state!=='reading'){conclusion=s.run.summary;break;}
 }}catch(e){failure=(e as Error).message;}
 const unchanged=initial===jcs(s.input.facts),oracle=c.oracle?(()=>{const metric=s.checkpoint.rendered?.metrics.find((r:any)=>r.label===c.oracle!.metric);return metric?.value?.value===c.oracle!.value;})():true;
 const success=!failure&&unchanged&&oracle&&conclusion===c.expected;
 outcomes.push({id:c.id,split:c.split,group:c.group,mode,repeat,success,conclusion,failure,actualAndActiveUnchanged:unchanged,oraclePassed:oracle,latencyMs:performance.now()-start,cpuMicros:Object.values(process.cpuUsage(cpu)).reduce((a,b)=>a+b,0),actions:s.run.toolCalls,ownerSteps:null,operatorElapsedMs:null,modelTokens:0,modelCalls:0,externalApiCostVnd:0,localComputeEnergyCost:null,steps:s.run.steps});
}
for(const [path,digest]of Object.entries(source))if(sha(readFileSync(path))!==digest)throw Error('FROZEN_SOURCE_CHANGED');
const percentile=(values:number[],fraction:number)=>[...values].sort((a,b)=>a-b)[Math.max(0,Math.ceil(values.length*fraction)-1)];
const summary=modes.map(mode=>{const rows=outcomes.filter(r=>r.mode===mode);return {mode,successes:rows.filter(r=>r.success).length,total:rows.length,completion:rows.filter(r=>r.success).length/rows.length,p50Ms:percentile(rows.map(r=>r.latencyMs),.5),p95Ms:percentile(rows.map(r=>r.latencyMs),.95),groups:['plan','adjust'].map(group=>{const selected=rows.filter(r=>r.group===group);return {group,successes:selected.filter(r=>r.success).length,total:selected.length};})};});
const strongest=Math.max(...summary.slice(0,3).map(r=>r.completion)),adaptive=summary.at(-1)!,gain=adaptive.completion-strongest;
const wilson=(successes:number,total:number)=>{const z=1.96,p=successes/total,d=1+z*z/total,center=(p+z*z/(2*total))/d,half=z*Math.sqrt(p*(1-p)/total+z*z/(4*total*total))/d;return {lower:Math.max(0,center-half),upper:Math.min(1,center+half),method:'Wilson 95%; descriptive only, generated tasks are not a population-random sample'};};
const taskSummary=modes.flatMap(mode=>['public-development','held-out-process-generated'].map(split=>{const rows=outcomes.filter(r=>r.mode===mode&&r.split===split),ids=[...new Set(rows.map(r=>r.id))],successes=ids.filter(id=>rows.filter(r=>r.id===id).every(r=>r.success)).length;return {mode,split,allRepeatsSucceeded:successes,distinctTasks:ids.length,confidence:wilson(successes,ids.length),unstableTasks:ids.filter(id=>{const values=rows.filter(r=>r.id===id);return new Set(values.map(r=>r.conclusion+'|'+r.success)).size>1;})};}));
const publicSpecifications=JSON.parse(readFileSync('../docs/agent/evaluation-cases.json','utf8')).cases.map((c:any)=>({id:c.id,title:c.title,blind:false,status:cases.some(t=>t.id===c.id)?'EXECUTED_BOUNDED_TYPED_RUBRIC':'NOT_RUN_BY_THIS_EVALUATOR',fullChallengeAccepted:false}));
const report={scope:'EXECUTED_DETERMINISTIC_TYPED_TOOL_ENGINE_EVALUATION; NOT_REAL_MODEL_OR_HUMAN_UAT',status:'MEASURED',at:new Date().toISOString(),freeze:freezePath,split:splitPath,source,heldout:heldoutMetadata,publicSpecifications,summary,taskSummary,benefit:{strongestApplicableBaselineCompletion:strongest,adaptiveCompletion:adaptive.completion,gainPercentagePoints:gain*100,gate:adaptive.completion>=.8&&gain>=.15?'COMPUTE_RUBRIC_GAIN_ONLY':'NOT_DEMONSTRATED',humanInteractionBenefit:'NOT_MEASURED',modelBenefit:'NOT_RUN'},resources:{nodePeakRssKb:process.resourceUsage().maxRSS,modelPeakRam:null,modelColdStartMs:null},limits:['16 public typed instances are partial refinements of the 30 published specifications; safety/concurrency is measured separately by PostgreSQL suites.','Held-out generator runs separately after freeze; implementer authored the generator. Independent human-reviewed blind evaluation remains pending.','No human operator elapsed time/steps or natural-language/model quality was inferred from compute speed.','Repeated deterministic runs are not independent task samples; small sample completion uncertainty remains.'],outcomes};
Object.assign(report,{measurementEnvironment:{isolation:'shared local host; not a controlled hardware benchmark',order:'case then mode then three repeats; cache/order may affect compute latency',latencyScope:'in-process Gateway + Engine; excludes PostgreSQL, network, model load/inference and owner time',latencyBenefitAccepted:false}});
const path=resolve(dir,'evaluation-'+Date.now()+'.json');writeFileSync(path,JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path,summary,benefit:report.benefit}));
