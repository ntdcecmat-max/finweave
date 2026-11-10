import { statfs,readdir,readFile,writeFile,unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sign,verify } from 'node:crypto';
import type { BackupReceipt } from './operations-backup.ts';
import { purgeSyntheticCopy } from './operations-backup.ts';
import { jcs,sha } from './crypto.ts';
export async function saveCatalog(repository:string,receipt:BackupReceipt,privatePem:string) {
  const signature=sign(null,Buffer.from(jcs(receipt)),privatePem).toString('base64url');
  await writeFile(resolve(repository,receipt.id+'.receipt.json'),jcs({receipt,signature}),{flag:'wx',flush:true});
}
export async function pruneSyntheticRepository(repository:string,scratch:string,publicPem:string,reserveBytes:number,hardAgeMs=34*86400000) {
  if(!Number.isSafeInteger(reserveBytes)||reserveBytes<1||!Number.isFinite(hardAgeMs)||hardAgeMs<=0)throw Error('PRUNE_POLICY_INVALID');
  const space=await statfs(scratch),available=Number(space.bavail)*Number(space.bsize);
  // Real filesystem measurement even in a fault-policy drill. No deleting first.
  if(available<reserveBytes)throw Error('PRUNE_SCRATCH_RESERVE_UNAVAILABLE');
  const names=await readdir(repository),catalog=[];
  for(const name of names) {
    if(!/^[A-Za-z0-9_-]{43}\.(sealed|receipt\.json)$/.test(name))throw Error('RETENTION_UNKNOWN_OBJECT');
    const id=name.slice(0,43);if(!names.includes(id+'.sealed')||!names.includes(id+'.receipt.json'))throw Error('RETENTION_ORPHAN_OR_SOFT_DELETE');
    if(!name.endsWith('.receipt.json'))continue;
    const {receipt,signature}=JSON.parse(await readFile(resolve(repository,name),'utf8'));
    if(receipt.id!==id||!verify(null,Buffer.from(jcs(receipt)),publicPem,Buffer.from(signature,'base64url')))throw Error('CATALOG_SIGNATURE_INVALID');
    const snapshot=Date.parse(receipt.snapshotStart),completed=Date.parse(receipt.completedAt);
    if(!Number.isFinite(snapshot)||!Number.isFinite(completed)||snapshot>completed||completed>Date.now()+5000)throw Error('CATALOG_CLOCK_INVALID');
    if(sha(await readFile(resolve(repository,id+'.sealed')))!==receipt.cipherHash)throw Error('CATALOG_COPY_MISMATCH');
    catalog.push(receipt as BackupReceipt);
  }
  const expired=catalog.filter(r=>Date.now()-Date.parse(r.snapshotStart)>=hardAgeMs),purged=[];
  for(const r of expired){await purgeSyntheticCopy(repository,r.id);await unlink(resolve(repository,r.id+'.receipt.json'));purged.push(r.id);}
  return {scope:'SYNTHETIC_LOCAL_FILESYSTEM_NO_RESTIC_PACKS',availableScratchBytes:available,reserveBytes,hardAgeMs,purged:purged.length,lastGoodPrivacyConflict:expired.length>0&&expired.length===catalog.length,productionRetentionObserved:false};
}
