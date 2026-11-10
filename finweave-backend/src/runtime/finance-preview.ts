import type { Tx } from './uow.ts';
import type { Actor } from './identity.ts';
import type { Envelope } from './contracts.ts';
import { sha,jcs } from './crypto.ts';
import { fail } from './errors.ts';
export const previewDigest=(op:string,input:any,version:number,objects:any)=>sha(jcs({op,input,version,objects}));
export async function previewCheck(tx:Tx,a:Actor,w:any,req:Envelope) {
 const p=await tx.one('SELECT * FROM fw_finance.previews WHERE workspace_id=$1 AND id=$2 AND subject_id=$3',[w.id,req.mutation!.previewToken,a.identity.id]);
 if(!p)fail('PREVIEW_MISMATCH',409);if(new Date(p.expires_at).getTime()<=await tx.now())fail('PREVIEW_EXPIRED',409);
 if(p.version!==w.version)fail('STALE_PROPOSAL',409);
 if(p.digest!==previewDigest(req.operationId,req.input,w.version,req.mutation!.expectedObjectVersions))fail('PREVIEW_MISMATCH',409);
}
