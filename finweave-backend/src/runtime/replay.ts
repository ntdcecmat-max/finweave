import type { Tx } from './uow.ts';
import type { Config } from './config.ts';
import type { Envelope } from './contracts.ts';
import { digest, jcs, seal, open, token } from './crypto.ts';
import { ApiError, fail } from './errors.ts';
export interface Delivery { data: any; version?: number|null; cookies?: string[]; authority?:{kind:'owner'|'ops'|'device';id:string}; mail?: {email:string;challengeId?:string;code?:string;resetToken?:string}; }
export function semantic(config: Config, req: Envelope) { return digest(config.pepper,'semantic',jcs({operationId:req.operationId,workspaceId:req.workspaceId,input:req.input,mutation:req.mutation})); }
export async function authReplay(tx: Tx, config: Config, scope: string, req: Envelope, work: ()=>Promise<Delivery|ApiError>): Promise<Delivery|ApiError> {
  const table=config.profile==='ops'?'fw_ops.replays':'fw_auth.replays', key=req.mutation!.idempotencyKey, hash=semantic(config,req), aad=jcs({scope,op:req.operationId,key});
  await tx.lock('issuer:'+scope+':'+req.operationId+':'+key);
  const old=await tx.one(`SELECT * FROM ${table} WHERE scope=$1 AND operation=$2 AND key=$3`,[scope,req.operationId,key]);
  if(old) {
    if(old.digest!==hash) fail('IDEMPOTENCY_CONFLICT',409);
    if(!old.body||new Date(old.expires_at).getTime()<=await tx.now()) fail('REAUTH_REQUIRED',401);
    const result=open<Delivery>(config.replayKey,old.body,aad);
    if(result.authority) {
      const a=result.authority,table=a.kind==='ops'?'fw_ops.sessions':a.kind==='device'?'fw_auth.devices':'fw_auth.sessions';
      const live=await tx.one(`SELECT * FROM ${table} WHERE id=$1`,[a.id]);
      if(!live||live.revoked)fail('UNAUTHENTICATED',401);
    }
    return result;
  }
  const result=await work();
  if(result instanceof ApiError) return result;
  const {mail,...stored}=result;
  await tx.query(`INSERT INTO ${table}(scope,operation,key,digest,body,expires_at) VALUES($1,$2,$3,$4,$5,clock_timestamp()+interval '5 minutes')`,[scope,req.operationId,key,hash,seal(config.replayKey,stored,aad)]);
  return result;
}
export async function command(tx: Tx, config: Config, subject: string, req: Envelope, version: number|null, work: ()=>Promise<Delivery>): Promise<Delivery> {
  const workspace=req.workspaceId??'',key=req.mutation!.idempotencyKey;
  await tx.lock('command:'+subject+':'+workspace+':'+req.operationId+':'+key);
  const old=await tx.one('SELECT * FROM fw_finance.commands WHERE subject_id=$1 AND workspace_id=$2 AND operation=$3 AND key=$4',[subject,workspace,req.operationId,key]);
  if(old) {
    if(old.digest!==semantic(config,req)) fail('IDEMPOTENCY_CONFLICT',409);
    if(!old.result || new Date(old.expires_at).getTime()<=await tx.now()) throw new ApiError('REPLAY_EXPIRED',409,'committed',old.result_ref);
    return { data:old.result,version:old.version };
  }
  if(req.workspaceId && req.mutation!.expectedWorkspaceVersion!==version) fail('VERSION_CONFLICT',409);
  const result=await work(), ref=token();
  await tx.query('INSERT INTO fw_finance.commands(subject_id,workspace_id,operation,key,digest,result_ref,result,version) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[subject,workspace,req.operationId,key,semantic(config,req),ref,result.data,result.version??null]);
  await tx.query('INSERT INTO fw_finance.audit(id,subject_id,workspace_id,operation,result_ref) VALUES($1,$2,$3,$4,$5)',[token(),subject,workspace,req.operationId,ref]);
  return result;
}
