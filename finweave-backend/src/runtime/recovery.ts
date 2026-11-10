import { createPrivateKey,createPublicKey,sign,verify } from 'node:crypto';
import { readFile,writeFile,open as openFile,rename,unlink } from 'node:fs/promises';
import type { Pool } from 'pg';
import { jcs,sha,token } from './crypto.ts';
import { unitOfWork } from './uow.ts';
export interface Deny {id:string;subjectId:string;epoch:number;kind:string;}
export interface WitnessHead {nonce:string;head:string;entries:Deny[];signature:string;}
export interface Witness {append(entry:Deny):Promise<void>;head(nonce:string):Promise<WitnessHead>;}
// Synthetic local independent signed journal. Real mode is disabled: this is not off-host custody.
export class FileWitness implements Witness {
  private path:string;private privatePem:string;
  constructor(path:string,privatePem:string) {this.path=path;this.privatePem=privatePem;}
  async journal():Promise<{entry:Deny;previous:string;signature:string}[]> {return JSON.parse(await readFile(this.path,'utf8'));}
  async entries():Promise<Deny[]> {
    const rows=await this.journal(),entries:Deny[]=[];let previous='0'.repeat(64);
    for(const row of rows) {
      if(row.previous!==previous||!verify(null,Buffer.from(jcs({entry:row.entry,previous})),createPublicKey(this.privatePem),Buffer.from(row.signature,'base64url')))throw Error('WITNESS_CHAIN_INVALID');
      entries.push(row.entry);previous=chain(entries);
    }
    return entries;
  }
  async append(entry:Deny) {
    const lock=await openFile(this.path+'.lock','wx');
    const temporary=this.path+'.'+token()+'.tmp';
    try {
      const entries=await this.entries(),old=entries.find(x=>x.id===entry.id);
      if(old&&jcs(old)!==jcs(entry))throw Error('WITNESS_CONFLICT');
      if(!old) {
        const rows=await this.journal(),previous=chain(entries),claims={entry,previous};
        rows.push({...claims,signature:sign(null,Buffer.from(jcs(claims)),createPrivateKey(this.privatePem)).toString('base64url')});
        await writeFile(temporary,jcs(rows),{flag:'wx',flush:true});await rename(temporary,this.path);
      }
    } finally {await lock.close();await unlink(this.path+'.lock');await unlink(temporary).catch(()=>{});}
  }
  async head(nonce:string) {const entries=await this.entries(),head=chain(entries),claims={nonce,head,entries};return {...claims,signature:sign(null,Buffer.from(jcs(claims)),createPrivateKey(this.privatePem)).toString('base64url')};}
}
function chain(entries:Deny[]) {let head='0'.repeat(64);for(const e of entries)head=sha(jcs({head,entry:e}));return head;}
export function verifiedHead(head:WitnessHead,nonce:string,pem:string) {
  const {signature,...claims}=head;
  if(head.nonce!==nonce||head.head!==chain(head.entries)||!verify(null,Buffer.from(jcs(claims)),createPublicKey(pem),Buffer.from(signature,'base64url')))throw Error('WITNESS_UNVERIFIED');
}
export async function anchorDenies(pool:Pool,witness:Witness,publicPem:string) {
  const pending=await unitOfWork(pool,tx=>tx.query('SELECT * FROM fw_control.denies WHERE NOT anchored ORDER BY created_at,id'));
  for(const d of pending.rows) await witness.append({id:d.id,subjectId:d.subject_id,epoch:d.epoch,kind:d.kind});
  const nonce=token(),head=await witness.head(nonce);verifiedHead(head,nonce,publicPem);
  await unitOfWork(pool,async tx=>{
    await tx.query('SELECT * FROM fw_control.state FOR UPDATE');
    for(const e of head.entries) {
      const i=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[e.subjectId]);
      const d=await tx.one('SELECT * FROM fw_control.denies WHERE id=$1 FOR UPDATE',[e.id]);
      if(!d||d.subject_id!==e.subjectId||d.epoch!==e.epoch||d.kind!==e.kind)continue;
      await tx.query('UPDATE fw_control.denies SET anchored=true WHERE id=$1',[e.id]);
      // Late receipt can never clear a newer deny/reset/erase.
      if(i&&i.epoch===e.epoch&&i.state==='blocked'&&e.kind==='reset') {
        const newer=await tx.one('SELECT id FROM fw_control.denies WHERE subject_id=$1 AND epoch>$2 LIMIT 1',[i.id,e.epoch]);
        if(!newer) {await tx.query("UPDATE fw_auth.identities SET state='active' WHERE id=$1",[i.id]);await tx.query('UPDATE fw_finance.workspaces SET blocked=false WHERE subject_id=$1',[i.id]);}
      }
    }
  });
}
export async function fenceRestore(pool:Pool) {await unitOfWork(pool,async tx=>{
  await tx.query('UPDATE fw_control.state SET locked=true,epoch=epoch+1');
  await tx.query("UPDATE fw_auth.identities SET epoch=epoch+1,state=CASE WHEN state='erased' THEN state ELSE 'blocked' END");
  await tx.query('UPDATE fw_auth.sessions SET revoked=true');await tx.query('UPDATE fw_ops.sessions SET revoked=true');
  await tx.query('UPDATE fw_ops.identities SET epoch=epoch+1,active=false');await tx.query('UPDATE fw_auth.devices SET revoked=true,epoch=epoch+1');
  await tx.query('UPDATE fw_auth.challenges SET consumed=true');await tx.query('UPDATE fw_auth.resets SET consumed=true');await tx.query('UPDATE fw_auth.recovery_codes SET consumed=true');
  await tx.query('UPDATE fw_auth.refresh_tokens SET consumed=true');
  await tx.query('UPDATE fw_auth.collectors SET consumed=true');
  await tx.query('DELETE FROM fw_auth.browser_rotations');await tx.query('DELETE FROM fw_auth.nonces');
  await tx.query('UPDATE fw_auth.replays SET body=NULL');await tx.query('UPDATE fw_ops.replays SET body=NULL');
  await tx.query('UPDATE fw_async.bindings SET enabled=false');
  await tx.query('UPDATE fw_async.entitlements SET rights_confirmed=false');
  await tx.query("UPDATE fw_async.market_gate SET blocked_until='infinity'");
  await tx.query("UPDATE fw_assistant.inference_slot SET open_until='infinity',run_id=NULL,until_at=NULL");
  await tx.query("UPDATE fw_dispatch.jobs SET state='cancelled',generation=generation+1,lease_token=NULL,lease_until=NULL WHERE state IN('queued','running')");
  await tx.query('UPDATE fw_finance.workspaces SET blocked=true');
});}
export async function reconcileRestore(pool:Pool,witness:Witness,publicPem:string) {
  const nonce=token(),head=await witness.head(nonce);verifiedHead(head,nonce,publicPem);
  await unitOfWork(pool,async tx=>{
    const state=await tx.one('SELECT * FROM fw_control.state FOR UPDATE');if(!state!.locked)throw Error('RESTORE_MUST_BE_LOCKED');
    const local=await tx.query('SELECT id FROM fw_control.denies');
    if(local.rows.some(x=>!head.entries.some(e=>e.id===x.id)))throw Error('WITNESS_HEAD_BEHIND_LOCAL_DENIES');
    for(const e of head.entries) {
      const i=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[e.subjectId]);
      if(!i)throw Error('RESTORE_TARGET_MAPPING_MISSING');
      await tx.query("UPDATE fw_auth.identities SET epoch=greatest(epoch,$2),state=CASE WHEN $3='erase' THEN 'erased' ELSE 'blocked' END WHERE id=$1",[e.subjectId,e.epoch,e.kind]);
    }
    // Existing identities remain blocked; only a new password reset + anchored deny can enable them.
    await tx.query('UPDATE fw_control.state SET locked=false');
  });
}
