import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {contract,revision} from '../src/runtime/contracts.ts';
import {assistantOperations} from '../src/runtime/assistant.ts';
import {sha} from '../src/runtime/crypto.ts';

const assistantRevision='FW-ASSISTANT-002';
const paths=structuredClone(Object.fromEntries(Object.entries(contract.paths).filter(([,p]:any)=>assistantOperations.includes(p.post.operationId))));
for(const p of Object.values(paths) as any[]){
 p.post['x-finweave']={...p.post['x-finweave'],availability:'LOCAL_DETERMINISTIC_POSTGRES',assistantRevision};
 for(const [status,response] of Object.entries(p.post.responses) as any){
  if(Number(status)>=400)response.content['application/json'].schema={$ref:'#/components/schemas/Error'};
  response.headers={...response.headers,'X-FW-Assistant-Revision':{schema:{const:assistantRevision}}};
 }
}
const needed=new Set<string>();
function collect(value:any){
 for(const m of JSON.stringify(value).matchAll(/#\/components\/schemas\/([A-Za-z0-9]+)/g)){
  if(!needed.has(m[1]!)){needed.add(m[1]!);collect(contract.components.schemas[m[1]!]);}
 }
}
collect(paths);
const subset={...contract,info:{...contract.info,title:'FinWeave local Assistant and Planning API',description:'Deterministic PostgreSQL implementation. No real model or frontend API005 integration acceptance.'},paths,components:{...contract.components,schemas:Object.fromEntries([...needed].sort().map(n=>[n,contract.components.schemas[n]]))},'x-assistant-revision':assistantRevision};
const dir=resolve('../docs/contracts/local-assistant');await mkdir(dir,{recursive:true});
const bytes=JSON.stringify(subset,null,2)+'\n';await writeFile(resolve(dir,'openapi.json'),bytes);
await writeFile(resolve(dir,'runtime-policy.json'),JSON.stringify({id:assistantRevision,baseRevision:revision,baseSha256:sha(await readFile('../docs/contracts/v2-t1-r5/openapi.json')),subsetSha256:sha(bytes),operations:assistantOperations,extensionOperations:['getPlanningSimulation','getAgentEvidence'],changes:{planOnlySimulation:{goalId:'nullable',goalVersion:'nullable',amount:'zero allowed for proposed contribution only'},typedIntent:['startAgentRun.proposalBody','startAgentRun.draftId','startAgentRun.reserveConfirmed','answerAgentRun.proposalBody','answerAgentRun.reserveConfirmed','answerAgentRun.settings'],errors:['PRIVACY_REPHRASE','MODEL_UNAVAILABLE','HISTORY_UNAVAILABLE','CONTEXT_LIMIT','QUESTION_CONFLICT']},modelEnabled:false,mode:'deterministic',agentLimits:{actions:8,activeMilliseconds:60000,reservationMilliseconds:25000,clarifications:2,modelRounds:12,rootInputTokens:32768,rootOutputTokens:4096,promptBytes:49152,responseBytes:65536,contextTokens:8192,outputTokensPerRound:1024,scenarioCount:3,simulationMonths:24,inputBytes:524288,checkpointBytes:49152},admission:{workspacePerUtcDay:10,globalPerUtcDay:50,concurrency:1,continuations:'same root; current day rechecked',unknownReservation:'full charge'},databaseMigrations:['database/runtime/008_assistant_planning.sql','database/runtime/009_agent_runtime.sql'],retentionDays:{messages:90,runs:90,drafts:30},ownerEffects:'Plan + Goal + support links only; no ledger or funded allocations',unsupported:['reviseDraftByMessage natural language requires a selected model and intent adapter','real Ollama/Qwen model pins and hardware/safety/benefit evaluation','full natural-language/formula/transaction-filter coverage','frontend API005/auth integration BE19','production/real-data activation']},null,2)+'\n');
console.log(JSON.stringify({path:dir,operations:assistantOperations.length,schemas:needed.size,revision:assistantRevision}));

