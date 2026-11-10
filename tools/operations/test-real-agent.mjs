import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const root=process.cwd(),backend=resolve('finweave-backend');process.chdir(backend);
const {Pool}=createRequire(resolve(backend,'package.json'))('pg');
const {startCluster}=await import('../../finweave-backend/scripts/runtime-cluster.ts');
const {buildApp}=await import('../../finweave-backend/src/runtime/app.ts');
const {contract,revision}=await import('../../finweave-backend/src/runtime/contracts.ts');
const {token}=await import('../../finweave-backend/src/runtime/crypto.ts');
const {dateAt,addDays,shiftMonth}=await import('../../finweave-backend/src/engine/business.ts');
const {AgentWorker}=await import('../../finweave-backend/src/runtime/agent-worker.ts');
const {OllamaProvider}=await import('../../finweave-backend/src/runtime/agent-provider.ts');
const provider=new OllamaProvider(JSON.parse(await readFile(resolve(root,'.local/model-toolchain/finweave-model-manifest.json'),'utf8')));await provider.preflight();
const cluster=await startCluster('real-model-'+Date.now()),pool=new Pool({connectionString:cluster.configs.user.databaseUrl}),agent=new Pool({connectionString:cluster.configs.agent.databaseUrl}),mails=[];
const app=await buildApp(cluster.configs.user,pool,{async send(mail){mails.push(mail)}});
const receipt={scope:'REAL_LOCAL_QWEN_OLLAMA_FASTIFY_POSTGRES_J2_GATEWAY_SYNTHETIC_DATA_NOT_HUMAN_UAT',startedAt:new Date().toISOString(),checks:[],status:'FAIL',model:'finweave-qwen3-4b-q4km:latest',realData:false};
let auth={},workspace=null,version=0;const registry={};
const path=op=>Object.entries(contract.paths).find(([,p])=>p.post?.operationId===op)?.[0];
const envelope=(op,input,w=workspace)=>({contractVersion:'2.0.0',requestId:token(),operationId:op,workspaceId:w,input,mutation:contract.components.schemas[op+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:token(),expectedWorkspaceVersion:w?version:null,expectedObjectVersions:{...registry},previewToken:null}});
async function send(request,headers=auth){const r=await app.inject({method:'POST',url:path(request.operationId),headers:{'content-type':'application/json','x-fw-contract-revision':revision,'x-fw-client':'web',origin:cluster.configs.user.origin,...headers},payload:request});assert([200,202].includes(r.statusCode),JSON.stringify({operation:request.operationId,status:r.statusCode,code:r.json().code,fields:r.json().fieldErrors}));const b=r.json();version=b.workspaceVersion??version;if(b.data.objectVersions)Object.assign(registry,b.data.objectVersions);return {data:b.data,response:r};}
const call=(op,input)=>send(envelope(op,input)).then(r=>r.data);
try{
 const registered=await send(envelope('registerIdentity',{email:'real-model@owner.test',name:'Synthetic model owner',password:'Synthetic model password 2026!',passwordConfirmation:'Synthetic model password 2026!',syntheticAcknowledgement:true,installationPublicKey:null},null),{});
 const verified=await send(envelope('verifyIdentityChallenge',{challengeId:registered.data.challengeId,code:mails.at(-1).code},null),{}),cookies=verified.response.headers['set-cookie'];auth={cookie:cookies.map(c=>c.split(';')[0]).join('; '),'x-fw-csrf':cookies[1].split(';')[0].split('=')[1]};
 const today=dateAt(Date.now()),start=today.slice(0,7)+'-01',horizon=shiftMonth(today,2);workspace=(await call('createWorkspace',{trackingStart:start,currency:'VND',timezone:'Asia/Ho_Chi_Minh'})).id;version=0;
 const input={name:'Synthetic cash',kind:'cash',opening:{value:'10000',currency:'VND'},openingDate:start},preview=await call('previewMutation',{operationId:'createAccount',input,expectedWorkspaceVersion:version,expectedObjectVersions:registry}),request=envelope('createAccount',input);request.mutation.previewToken=preview.previewToken;const cash=(await send(request)).data.affectedIds[0];
 const conversation=await call('createConversation',{title:'Actual model synthetic E2E'}),settings={months:2,income:'0',expense:'0',incomeGrowth:0,inflation:0,cashReturn:0,stockReturn:0,goldReturn:0,stockVolatility:0,goldVolatility:0,incomeVolatility:0,expenseVolatility:0,reserveMonths:0,investSurplus:0,goldWeight:0,debt:'0',debtAPR:0,debtPayment:'0',stress:false,stressStart:1,stressMonths:1,incomeDrop:0,stockShock:0,inflationShock:0,realMoney:false,poolCash:false};
 const body={goals:[{existingId:null,name:'Synthetic goal',target:'100',due:horizon,account:cash,contribution:'50',start:addDays(today,1),day:20,skipMonths:[],profile:'cash',ref:'goal'}],items:[],links:[],scope:[cash],reserve:'0',income:'0',expense:'0',priority:'preserve_plans',notes:'Synthetic owner proposal',settings};
 const draft=await call('createPlanningDraft',{conversationId:conversation.id,body}),p=await call('previewPlanningDraft',{id:draft.id,expectedVersion:0}),confirmation=envelope('confirmPlanningDraft',{id:draft.id,expectedVersion:p.version,token:p.preview.token,digest:p.preview.digest});const confirmed=(await send(confirmation)).data;
 const base={conversationId:conversation.id,context:{route:'/plan/goals',scope:[cash],snapshotVersion:version,periodStart:start,periodEnd:addDays(today,1)},settings};
 for(const [name,input]of[['investigation',{...base,intent:'investigation',goalId:null}],['goal',{...base,intent:'goal',goalId:confirmed.confirmedIds[0],reserveConfirmed:true}]]){
  const before=(await cluster.admin.query('SELECT count(*) AS n FROM fw_finance.posting_lines')).rows[0].n,run=await call('startAgentRun',input),worker=new AgentWorker(agent,undefined,provider);await worker.runOnce();
  const result=await call('getAgentRun',{id:run.id}),evidence=await call('getAgentEvidence',{id:run.id}),rounds=(await cluster.admin.query('SELECT model,phase,elapsed_ms,output_tokens,prompt_tokens FROM fw_assistant.rounds WHERE run_id=$1 ORDER BY ordinal',[run.id])).rows;
  assert(rounds.some(r=>r.model),'REAL_MODEL_NOT_CALLED');assert.equal((await call('getAccount',{id:cash})).balance.value.value,'10000');assert.equal((await cluster.admin.query('SELECT count(*) AS n FROM fw_finance.posting_lines')).rows[0].n,before);
  const qualityAccepted=name==='investigation'?result.summary==='PARTIAL':result.state==='draft_ready';receipt.checks.push({name,transportAndSafety:'PASS',qualityAccepted,state:result.state,summary:result.summary,steps:result.steps,counters:evidence,rounds});console.log(JSON.stringify({name,state:result.state,summary:result.summary,steps:result.steps,modelRounds:rounds.filter(r=>r.model).length}));assert(qualityAccepted,'MODEL_QUALITY_NOT_ACCEPTED:'+name);
 }
 receipt.status='MODEL_E2E_TWO_SCENARIOS_PASS_REAL_DATA_CLOSED';
}catch(e){receipt.failureCode=e.message.split('\n')[0];throw e;}
finally{await app.close();await pool.end();await agent.end();await cluster.stop();receipt.clusterStopped=true;receipt.finishedAt=new Date().toISOString();const out=resolve(root,'docs/execution/evidence/release-review');await mkdir(out,{recursive:true});const file=resolve(out,'real-agent-'+Date.now()+'.json');await writeFile(file,JSON.stringify(receipt,null,2));console.log('Evidence: '+file);}
