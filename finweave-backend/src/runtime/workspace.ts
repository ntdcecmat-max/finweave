import type { Tx } from './uow.ts';
import type { Envelope } from './contracts.ts';
import type { Actor } from './identity.ts';
import type { Config } from './config.ts';
import { token } from './crypto.ts';
import { fail } from './errors.ts';
import { command } from './replay.ts';
import { opening, accountProjection, history } from './finance-store.ts';
import { previewCheck } from './finance-preview.ts';
import { facts,checkContext,defaultContext } from './business.ts';
import { overview } from '../engine/business.ts';
// Public Workspace owner ports; callers coordinate using their existing Tx, never a second pool.
export async function ownedWorkspaceIds(tx:Tx,subject:string) {return (await tx.query('SELECT id FROM fw_finance.workspaces WHERE subject_id=$1 AND NOT blocked ORDER BY id',[subject])).rows.map(x=>x.id as string);}
export async function blockOwnedWorkspaces(tx:Tx,subject:string,blocked:boolean) {await tx.query('UPDATE fw_finance.workspaces SET blocked=$2 WHERE subject_id=$1',[subject,blocked]);}
export async function authorizeWorkspace(tx:Tx,a:Actor,req:Envelope) {
  const w=await tx.one('SELECT * FROM fw_finance.workspaces WHERE id=$1 AND subject_id=$2 FOR UPDATE',[req.workspaceId,a.identity.id]);
  if(!w)fail('NOT_FOUND',404); if(w.blocked)fail('RECOVERY_FENCE',403); return w;
}
export function workspaceProjection(w:any,now:number) { return {id:w.id,version:w.version,businessClock:new Date(now).toISOString(),trackingStart:w.tracking_start,currency:'VND',timezone:'Asia/Ho_Chi_Minh',synthetic:true}; }
export async function page(tx:Tx,req:Envelope,query:string,values:unknown[],project:(x:any)=>any,version:number) {
  const cursor=req.input.page.cursor;
  if(cursor!==null && !/^[A-Za-z0-9_-]{1,80}$/.test(cursor))fail('CURSOR_INVALID');
  const rows=(await tx.query(query,values)).rows.filter(x=>!cursor||x.id>cursor);
  const selected=rows.slice(0,req.input.page.pageSize);
  const items=[];for(const row of selected)items.push(await project(row));
  return {data:{items,nextCursor:rows.length>selected.length?selected.at(-1)!.id:null,snapshotVersion:version,totalCount:null},version:req.workspaceId?version:null};
}
export async function workspaceOperation(tx:Tx,config:Config,a:Actor,req:Envelope,previewMode=false) {
  if(req.operationId==='createWorkspace')return command(tx,config,a.identity.id,req,null,async()=>{
    const w={id:token(),version:0,tracking_start:req.input.trackingStart};
    await tx.query('INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES($1,$2,$3)',[w.id,a.identity.id,w.tracking_start]);
    await tx.context(a.identity.id,w.id);
    await tx.query("INSERT INTO fw_async.schedules(workspace_id,next_due_at) VALUES($1,date_trunc('day',clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh') AT TIME ZONE 'Asia/Ho_Chi_Minh'+interval '18 hours')",[w.id]);
    return {data:workspaceProjection(w,a.now)};
  });
  if(req.operationId==='listWorkspaces')return page(tx,req,'SELECT * FROM fw_finance.workspaces WHERE subject_id=$1 AND NOT blocked ORDER BY id',[a.identity.id],w=>workspaceProjection(w,a.now),a.identity.epoch);
  const w=await authorizeWorkspace(tx,a,req);
  if(req.operationId==='getWorkspace')return {data:workspaceProjection(w,a.now),version:w.version};
  if(req.operationId==='getCommandOutcome') {
    const r=await tx.one('SELECT * FROM fw_finance.commands WHERE subject_id=$1 AND workspace_id=$2 AND operation=$3 AND key=$4',[a.identity.id,w.id,req.input.operationId,req.input.idempotencyKey]);
    return {data:{state:r?'committed':'not_found',resultRef:r?.result_ref??null,replayAvailable:!!r?.result&&new Date(r.expires_at).getTime()>a.now,committedVersion:r?.version??null},version:w.version};
  }
  if(req.operationId==='listAccounts')return page(tx,req,"SELECT * FROM fw_finance.accounts WHERE workspace_id=$1 AND ($2 OR NOT (payload->>'archived')::boolean) ORDER BY id",[w.id,req.input.includeArchived],r=>accountProjection(tx,r,a.now),w.version);
  const account=req.input.id?await tx.one('SELECT * FROM fw_finance.accounts WHERE workspace_id=$1 AND id=$2 FOR UPDATE',[w.id,req.input.id]):null;
  if(req.input.id&&!account)fail('NOT_FOUND',404);
  if(req.operationId==='getAccount'){
    if(req.input.context){const r=await facts(tx,w,req.input.context.snapshotVersion);checkContext(r.payload,req.input.context);const value=overview(r.payload,w.id,r.version,req.input.context,new Date(r.recorded_at).getTime()).accounts.find((a:any)=>a.id===req.input.id);if(!value)fail('NOT_FOUND',404);return {data:value,version:r.version};}
    const r=await facts(tx,w),value=overview(r.payload,w.id,r.version,defaultContext(w,a.now),new Date(r.recorded_at).getTime()).accounts.find((a:any)=>a.id===req.input.id);if(!value)fail('NOT_FOUND',404);return {data:value,version:r.version};
  }
  return command(tx,config,a.identity.id,req,w.version,async()=>{
    if(!previewMode)await previewCheck(tx,a,w,req);
    for(const [reference,expected] of Object.entries(req.mutation!.expectedObjectVersions)) {
      let r:any;for(const table of ['accounts','holdings','event_heads','reviews']) {r=await tx.one(`SELECT version FROM fw_finance.${table} WHERE workspace_id=$1 AND id=$2`,[w.id,reference]);if(r)break;}
      if(!r)fail('NOT_FOUND',404);if(r.version!==expected)fail('VERSION_CONFLICT',409);
    }
    const id=account?.id??token();
    if(account && req.mutation!.expectedObjectVersions[id]!==account.version)fail('VERSION_CONFLICT',409);
    if(req.operationId==='createAccount') {
      if(req.input.openingDate<w.tracking_start)fail('VALIDATION');
      await tx.query('INSERT INTO fw_finance.accounts(workspace_id,id,payload) VALUES($1,$2,$3)',[w.id,id,{...req.input,archived:false}]);
      await opening(tx,a,w.id,id,req.input);
    } else if(req.operationId==='archiveAccount') await tx.query("UPDATE fw_finance.accounts SET version=version+1,payload=jsonb_set(payload,'{archived}','true') WHERE workspace_id=$1 AND id=$2",[w.id,id]);
    else fail('ACTION_NOT_ALLOWED');
    if(account)await history(tx,a,w.id,id,account.version+1,req.operationId,req.input.reason??null);
    await tx.query('UPDATE fw_finance.workspaces SET version=version+1 WHERE id=$1',[w.id]);
    const version=w.version+1;
    return {data:{operationId:req.operationId,workspaceVersion:version,objectVersions:{[id]:account?account.version+1:0},affectedIds:[id],replayed:false},version};
  });
}
