import type {Tx} from './uow.ts';
import type {Config} from './config.ts';
import type {Actor} from './identity.ts';
import type {Envelope} from './contracts.ts';
import {authorizeWorkspace,page} from './workspace.ts';
import {command} from './replay.ts';
import {facts,checkContext,defaultContext} from './business.ts';
import {token,jcs} from './crypto.ts';
import {fail} from './errors.ts';
import {overview,planForecast,dateAt} from '../engine/business.ts';
import {screenText,materializePlanning,evaluatePlanning,commitPlanning,draftDigest,normalizedSettings} from './planning-drafts.ts';
import {engineDigest} from './engine-pin.ts';
import {validator} from './contracts.ts';
import {assistantMetrics,renderGrounded} from './grounded-renderer.ts';
import {checkHardConstraints} from './tool-gateway.ts';
import {editDraftMessage} from '../engine/draft-edit.ts';

export const assistantOperations=['listConversations','createConversation','getConversation','listMessages','sendAssistantMessage','getAssistantMessage','cancelAssistantMessage','startAgentRun','answerAgentRun','cancelAgentRun','getAgentRun','listAgentRuns','getPlanningDraft','listPlanningDrafts','createPlanningDraft','reviseDraft','reviseDraftByMessage','refreshDraft','previewPlanningDraft','confirmPlanningDraft','discardPlanningDraft','simulatePlanningDraft','getPlanningSimulation','getAgentEvidence','getToolResult'];
const terminal=['completed','partial','failed','cancelled','draft_ready'];
async function row(tx:Tx,w:string,table:string,id:string){if(!['conversations','messages','drafts','runs'].includes(table))throw Error('ASSISTANT_TABLE_PORT');const r=await tx.one(`SELECT * FROM fw_assistant.${table} WHERE workspace_id=$1 AND id=$2 FOR UPDATE`,[w,id]);if(!r)fail('NOT_FOUND',404);if(r.expires_at&&new Date(r.expires_at).getTime()<=await tx.now()&&r.payload.state!=='confirmed')fail('HISTORY_UNAVAILABLE',410);return r;}
async function save(tx:Tx,w:string,table:string,p:any){await tx.query(`UPDATE fw_assistant.${table} SET payload=$3 WHERE workspace_id=$1 AND id=$2`,[w,p.id,p]);}
export function newDraft(conversationId:string,body:any,baseVersion:number,now:number,id=token(),runId:string|null=null){return {id,runId,conversationId,version:0,baseVersion,state:'draft',body,revisions:[],createdAt:new Date(now).toISOString(),confirmedIds:[],preview:null};}
export async function assistantOperation(tx:Tx,config:Config,a:Actor,req:Envelope):Promise<any> {
 const w=await authorizeWorkspace(tx,a,req),op=req.operationId,i=req.input;
 if(op==='getToolResult'){const r=await tx.one('SELECT payload FROM fw_assistant.tool_snapshots WHERE workspace_id=$1 AND id=$2 AND expires_at>clock_timestamp()',[w.id,i.id]);if(!r)fail('HISTORY_UNAVAILABLE',410);return {data:r.payload,version:w.version};}
 if(op==='getAgentEvidence'){
  const r=await row(tx,w.id,'runs',i.id),p=r.payload,cp=r.checkpoint,rendered=cp.rendered??renderGrounded('PARTIAL',[],[],cp.mode??'deterministic');
  const journal=(await tx.query('SELECT ordinal,phase,digest,generation FROM fw_assistant.actions WHERE workspace_id=$1 AND run_id=$2 ORDER BY ordinal',[w.id,i.id])).rows.map(x=>({...x,capability:cp.results.find((y:any)=>y.ref==='action_'+x.ordinal)?.capability??null}));
  return {data:{runId:p.id,mode:cp.mode??'deterministic',baseVersion:p.baseVersion,stale:p.baseVersion!==w.version,activeMillis:cp.activeMillis,modelRounds:cp.rounds,inputTokens:cp.inputTokens??0,outputTokens:cp.outputTokens??0,actions:p.toolCalls,text:rendered.text,metrics:rendered.metrics,journal},version:w.version};
 }
 if(op==='getPlanningSimulation'){const r=await tx.one('SELECT payload FROM fw_assistant.simulations WHERE workspace_id=$1 AND id=$2',[w.id,i.id]);if(!r)fail('NOT_FOUND',404);return {data:r.payload,version:w.version};}
 if(['listConversations','listAgentRuns','listPlanningDrafts'].includes(op)){
  const table=op==='listConversations'?'conversations':op==='listAgentRuns'?'runs':'drafts';
  if(i.conversationId)await row(tx,w.id,'conversations',i.conversationId);
  return page(tx,req,`SELECT * FROM fw_assistant.${table} WHERE workspace_id=$1 ${table==='conversations'?'':"AND (expires_at>clock_timestamp() OR payload->>'state'='confirmed')"} ${i.conversationId?'AND conversation_id=$2':''} ORDER BY id`,i.conversationId?[w.id,i.conversationId]:[w.id],r=>r.payload,w.version);
 }
 if(op==='getConversation'){const conversation=(await row(tx,w.id,'conversations',i.id)).payload;return {data:{conversation,messages:await messagePage(tx,w,i.id,null,50)},version:w.version};}
 if(op==='listMessages'){await row(tx,w.id,'conversations',i.conversationId);return {data:await messagePage(tx,w,i.conversationId,i.page.cursor,i.page.pageSize),version:w.version};}
 if(['getAssistantMessage','getAgentRun','getPlanningDraft'].includes(op)){const t=op==='getAssistantMessage'?'messages':op==='getAgentRun'?'runs':'drafts';const p=(await row(tx,w.id,t,i.id)).payload;
  if(op==='getAssistantMessage'&&p.result)return {data:{...p,result:{...p.result,stale:p.result.stale||p.context.workspaceVersion!==w.version}},version:w.version};
  return {data:p,version:w.version};
 }
 return command(tx,config,a.identity.id,req,w.version,async()=>{
  const delivery=(data:any,version=w.version)=>({data,version});
  if(op==='createConversation'){const now=new Date(a.now).toISOString(),p={id:token(),version:0,title:screenText(i.title),createdAt:now,updatedAt:now,lastContext:null};if(!p.title)fail('VALIDATION');await tx.query('INSERT INTO fw_assistant.conversations VALUES($1,$2,$3)',[w.id,p.id,p]);return delivery(p);}
  if(op==='sendAssistantMessage'){
   const c=(await row(tx,w.id,'conversations',i.conversationId)).payload,text=screenText(i.text),ctx=i.context;
   if(!text)fail('VALIDATION');if(ctx.workspaceVersion!==w.version||ctx.query.snapshotVersion!==w.version||ctx.snapshotRefs.workspaceVersion!==w.version)fail('STALE_PROPOSAL',409);
   const f=await facts(tx,w);checkContext(f.payload,ctx.query);const snap=overview(f.payload,w.id,w.version,ctx.query,new Date(f.recorded_at).getTime());
   if(jcs(ctx.snapshotRefs)!==jcs(snap.snapshotRefs))fail('STALE_PROPOSAL',409);
   if(ctx.selected){const key={account:'accounts',holding:'holdings',event:'events',review:'reviews',plan:'plans',goal:'goals'}[ctx.selected.type as string];if(key&&!f.payload[key].some((r:any)=>r.id===ctx.selected.id))fail('NOT_FOUND',404);if(ctx.selected.type==='simulation')await tx.one('SELECT payload FROM fw_business.simulations WHERE workspace_id=$1 AND id=$2',[w.id,ctx.selected.id]).then(r=>{if(!r)fail('NOT_FOUND',404);});if(ctx.selected.type==='formula')fail('ACTION_NOT_ALLOWED');}
   const id=token(),now=new Date(a.now).toISOString(),p={id,conversationId:c.id,version:0,role:'user',text,context:ctx,state:'completed',result:null,errorCode:null,createdAt:now,processingKind:'single_tool',agentRunId:null,planningDraftId:null},replyId=token();
   const selectedSimulation=ctx.selected?.type==='simulation'?(await tx.one('SELECT payload FROM fw_business.simulations WHERE workspace_id=$1 AND id=$2',[w.id,ctx.selected.id]))?.payload:null;
   const {tool,metrics}=assistantMetrics(f.payload,snap,ctx,a.now,selectedSimulation),toolResultId=token();
   const message={...p,id:replyId,role:'assistant',text:'Kết quả đọc từ dữ liệu đã chụp. Chi tiết số liệu và chất lượng nằm trong các chỉ số.',result:{id:toolResultId,messageId:replyId,mode:'deterministic',context:ctx,tool,text:'Kết quả được tính bởi Engine từ phạm vi và kỳ đã chọn.',metrics,evidenceIds:[toolResultId],targets:[],stale:!!selectedSimulation&&selectedSimulation.baseWorkspaceVersion!==w.version,createdAt:now}};
   await tx.query('INSERT INTO fw_assistant.tool_snapshots(workspace_id,id,payload) VALUES($1,$2,$3)',[w.id,toolResultId,{id:toolResultId,snapshotVersion:w.version,classification:'actual',evidenceIds:snap.evidenceIds,result:snap}]);
   await tx.query('INSERT INTO fw_assistant.messages(workspace_id,id,conversation_id,payload) VALUES($1,$2,$3,$4),($1,$5,$3,$6)',[w.id,id,c.id,p,replyId,message]);
   await save(tx,w.id,'conversations',{...c,version:c.version+1,updatedAt:now,lastContext:ctx});return delivery(message);
  }
  if(op==='cancelAssistantMessage'){const p=(await row(tx,w.id,'messages',i.id)).payload;if(p.state!=='processing')fail('ACTION_NOT_ALLOWED');const next={...p,version:p.version+1,state:'cancelled',result:null,errorCode:'CANCELLED'};await save(tx,w.id,'messages',next);return delivery(next);}
  if(op==='createPlanningDraft'){await row(tx,w.id,'conversations',i.conversationId);const f=await facts(tx,w);materializePlanning(f.payload,i.body,w.tracking_start,a.now);const p=newDraft(i.conversationId,i.body,w.version,a.now);await tx.query('INSERT INTO fw_assistant.drafts(workspace_id,id,conversation_id,payload) VALUES($1,$2,$3,$4)',[w.id,p.id,p.conversationId,p]);return delivery(p);}
  if(['reviseDraft','reviseDraftByMessage','refreshDraft','discardPlanningDraft','previewPlanningDraft','confirmPlanningDraft','simulatePlanningDraft'].includes(op)){
   const p=(await row(tx,w.id,'drafts',i.id)).payload;
   if(p.version!==i.expectedVersion)fail('VERSION_CONFLICT',409);if(['confirmed','superseded','expired'].includes(p.state))fail('ACTION_NOT_ALLOWED');
   if(op==='reviseDraftByMessage'){
    let body;try{body=editDraftMessage(p.body,i.text);}catch{fail('VALIDATION',422);}
    const f=await facts(tx,w);materializePlanning(f.payload,body,w.tracking_start,a.now);
    const next={...p,body,version:p.version+1,baseVersion:w.version,state:'draft',preview:null,revisions:[...p.revisions,'OWNER_REVISED_BY_MESSAGE']};
    await save(tx,w.id,'drafts',next);return delivery(next);
   }
   const f=await facts(tx,w);
   if(op==='discardPlanningDraft'){screenText(i.reason);const next={...p,version:p.version+1,state:'superseded',preview:null,revisions:[...p.revisions,'DISCARDED']};await save(tx,w.id,'drafts',next);return delivery(next);}
   if(op==='reviseDraft'||op==='refreshDraft'){
    const body=op==='reviseDraft'?i.body:p.body;if(op==='reviseDraft')screenText(i.reason);materializePlanning(f.payload,body,w.tracking_start,a.now);const next={...p,body,version:p.version+1,baseVersion:w.version,state:'draft',preview:null,revisions:[...p.revisions,op==='refreshDraft'?'OWNER_REFRESHED_CONTEXT':'OWNER_REVISED']};await save(tx,w.id,'drafts',next);return delivery(next);
   }
   if(p.baseVersion!==w.version)fail('STALE_PROPOSAL',409);
   if(op==='simulatePlanningDraft'){const simulation=evaluatePlanning(f.payload,p.body,w,new Date(f.recorded_at).getTime(),token());await tx.query('INSERT INTO fw_assistant.simulations VALUES($1,$2,$3,$4,$5)',[w.id,simulation.simulationId,p.id,{draftVersion:p.version,baseVersion:w.version,draftDigest:draftDigest(p),asOf:new Date(f.recorded_at).toISOString(),engineDigest,runtimeVersion:process.version},simulation]);return delivery(simulation);}
   materializePlanning(f.payload,p.body,w.tracking_start,a.now);
   if(op==='previewPlanningDraft'){const next={...p,state:'previewed',version:p.version+1,preview:null};next.preview={token:token(),digest:draftDigest(next),expiresAt:new Date(a.now+300000).toISOString(),version:w.version};await save(tx,w.id,'drafts',next);return delivery(next);}
   if(p.state!=='previewed'||!p.preview||p.preview.token!==i.token||p.preview.digest!==i.digest||draftDigest(p)!==i.digest)fail('PREVIEW_MISMATCH',409);
   if(new Date(p.preview.expiresAt).getTime()<=await tx.now())fail('PREVIEW_EXPIRED',409);
   const ids=await commitPlanning(tx,a,w,f.payload,p),next={...p,state:'confirmed',version:p.version+1,confirmedIds:ids,preview:null};await save(tx,w.id,'drafts',next);return delivery(next,w.version+1);
  }
  if(op==='startAgentRun'){
   await row(tx,w.id,'conversations',i.conversationId);if(i.context.snapshotVersion!==w.version)fail('STALE_PROPOSAL',409);
   const f=await facts(tx,w),scope=i.context.scope.length?i.context.scope:f.payload.accounts.filter((x:any)=>!x.payload.archived).map((x:any)=>x.id);
   const context={period:{start:i.context.periodStart,endExclusive:i.context.periodEnd,timezone:'Asia/Ho_Chi_Minh'},accountIds:scope,snapshotVersion:w.version};if(!validator('getOverviewInput')({context}))fail('VALIDATION');checkContext(f.payload,context);
   if(i.goalId&&!f.payload.goals.some((g:any)=>g.id===i.goalId&&g.payload.status==='active'))fail('NOT_FOUND',404);
   const current=i.draftId?(await row(tx,w.id,'drafts',i.draftId)).payload:null;
   if(current&&(current.baseVersion!==w.version||current.conversationId!==i.conversationId||!['draft','previewed'].includes(current.state)))fail('STALE_PROPOSAL',409);
   const p={id:token(),conversationId:i.conversationId,version:0,intent:i.intent,state:'queued',baseVersion:w.version,context:i.context,goalId:i.goalId,settings:i.settings,questionId:null,draftId:current?.id??null,summary:'Queued; decision mode is recorded in run evidence.',steps:[],evidence:[],createdAt:new Date(a.now).toISOString(),due:a.now+86400000,toolCalls:0};
   const captured=overview(f.payload,w.id,w.version,context,new Date(f.recorded_at).getTime());
   const aiContext={navigation:i.intent==='investigation'?'transactions':'plan',route:i.context.route,query:context,transactionFilter:null,selected:i.goalId?{type:'goal',id:i.goalId}:null,workspaceVersion:w.version,snapshotRefs:captured.snapshotRefs,capturedAt:new Date(a.now).toISOString()};
   const input={workspace:w,facts:f.payload,asOf:new Date(f.recorded_at).getTime(),context,scope,mode:'deterministic',proposalBody:i.proposalBody??current?.body??null,reserveConfirmed:i.reserveConfirmed??true,aiContext};
   if(input.proposalBody){materializePlanning(f.payload,input.proposalBody,w.tracking_start,a.now);try{checkHardConstraints({run:p,input:{...input,reserveConfirmed:true}},input.proposalBody);}catch{fail('VALIDATION');}}
   if(current){const next={...current,runId:p.id,version:current.version+1,state:'draft',preview:null};await save(tx,w.id,'drafts',next);}
   if(Buffer.byteLength(jcs(input))>512*1024)fail('CONTEXT_LIMIT',413);
   await tx.query('INSERT INTO fw_assistant.runs(workspace_id,id,conversation_id,session_id,input,payload) VALUES($1,$2,$3,$4,$5,$6)',[w.id,p.id,p.conversationId,a.session.id,input,p]);await enqueueAgent(tx,a,w,p.id);return delivery(p);
  }
  if(op==='answerAgentRun'||op==='cancelAgentRun'){
   const r=await row(tx,w.id,'runs',i.id),p=r.payload;if(p.version!==i.expectedVersion)fail('VERSION_CONFLICT',409);if(terminal.includes(p.state))fail('ACTION_NOT_ALLOWED');
   if(op==='cancelAgentRun'){const next={...p,state:'cancelled',version:p.version+1,questionId:null,summary:'CANCELLED'};await save(tx,w.id,'runs',next);await tx.query('SELECT fw_assistant.cancel_run($1,$2)',[w.id,p.id]);return delivery(next);}
   if(p.state!=='awaiting_user'||!p.questionId||i.questionId!==p.questionId)fail('QUESTION_CONFLICT',409);
   const answer=screenText(i.answer);if(!answer)fail('VALIDATION');if(p.baseVersion!==w.version)fail('STALE_PROPOSAL',409);
   if(i.settings){normalizedSettings(i.settings);if(r.input.proposalBody&&!i.proposalBody)fail('VALIDATION');}
   const next={...p,settings:i.settings??p.settings,state:'queued',version:p.version+1,questionId:null},answerRecord={questionId:p.questionId,answer,...(i.proposalBody?{proposal:i.proposalBody}:{}),...(i.reserveConfirmed?{reserveConfirmed:true}:{}),...(i.settings?{previousSettings:p.settings,settings:i.settings}:{})};
   if(i.proposalBody){materializePlanning(r.input.facts,i.proposalBody,w.tracking_start,a.now);try{checkHardConstraints({run:next,input:r.input,checkpoint:{...r.checkpoint,answers:[...r.checkpoint.answers,answerRecord]}},i.proposalBody);}catch{fail('VALIDATION');}}
   await tx.query('UPDATE fw_assistant.runs SET payload=$3,checkpoint=$4 WHERE workspace_id=$1 AND id=$2',[w.id,p.id,next,{...r.checkpoint,constraintRevision:(r.checkpoint.constraintRevision??0)+(i.settings||i.proposalBody?1:0),answers:[...r.checkpoint.answers,answerRecord]}]);await enqueueAgent(tx,a,w,p.id);return delivery(next);
  }
  fail('ACTION_NOT_ALLOWED');
 });
}
async function enqueueAgent(tx:Tx,a:Actor,w:any,id:string){if(!(await tx.one('SELECT fw_assistant.enqueue_run($1,$2) AS accepted',[w.id,id]))!.accepted)fail('ACTION_NOT_ALLOWED');}
async function messagePage(tx:Tx,w:any,conversationId:string,cursor:string|null,size:number){let after='0';if(cursor){const previous=await tx.one('SELECT sequence FROM fw_assistant.messages WHERE workspace_id=$1 AND conversation_id=$2 AND id=$3 AND expires_at>clock_timestamp()',[w.id,conversationId,cursor]);if(!previous)fail('CURSOR_INVALID');after=previous.sequence;}const rows=(await tx.query('SELECT id,payload FROM fw_assistant.messages WHERE workspace_id=$1 AND conversation_id=$2 AND sequence>$3 AND expires_at>clock_timestamp() ORDER BY sequence LIMIT $4',[w.id,conversationId,after,size+1])).rows;return {items:rows.slice(0,size).map(r=>{const p=r.payload;return p.result?{...p,result:{...p.result,stale:p.result.stale||p.context.workspaceVersion!==w.version}}:p;}),nextCursor:rows.length>size?rows[size-1].id:null,snapshotVersion:w.version,totalCount:null};}
