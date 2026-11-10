import type { Pool } from 'pg';
import { unitOfWork } from './uow.ts';
export async function expireAuthArtifacts(pool:Pool,profile:'user'|'ops') {
  const schema=profile==='ops'?'fw_ops':'fw_auth';
  await unitOfWork(pool,async tx=>{
    // Keep original keyed markers: a consumed refresh can only require reauth, never rotate again.
    await tx.query(`UPDATE ${schema}.replays SET body=NULL WHERE body IS NOT NULL AND expires_at<=clock_timestamp()`);
    if(profile==='user') {
      await tx.query('DELETE FROM fw_auth.nonces WHERE expires_at<=clock_timestamp()');
      await tx.query("DELETE FROM fw_auth.challenges WHERE expires_at<clock_timestamp()-interval '24 hours'");
    }
  });
}
