import { randomBytes,createCipheriv,createDecipheriv,publicEncrypt,privateDecrypt,constants } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir,readFile,writeFile,unlink,stat,open,rename } from 'node:fs/promises';
import { dirname,resolve } from 'node:path';
import { Pool } from 'pg';
import { token,sha,jcs } from './crypto.ts';
import { fenceRestore } from './recovery.ts';
const exec=promisify(execFile);
const maxBytes=64*1024*1024;
export interface BackupReceipt {id:string;snapshotStart:string;completedAt:string;cipherHash:string;bytes:number;inventory:Record<string,number>;largeObjects:number;scope:'SYNTHETIC_SAME_HOST';keyVersion:string;}
function pgEnvironment(url:string) {
  const u=new URL(url);if(u.protocol!=='postgresql:'||!['localhost','127.0.0.1'].includes(u.hostname))throw Error('SYNTHETIC_LOOPBACK_REQUIRED');
  return {...process.env,PGHOST:u.hostname,PGPORT:u.port,PGUSER:decodeURIComponent(u.username),PGPASSWORD:decodeURIComponent(u.password),PGDATABASE:u.pathname.slice(1)};
}
async function pg(tool:string,args:string[],url:string) {
  const tools=JSON.parse(await readFile('database/runtime/operations-toolchain.json','utf8'));
  for(const [file,hash] of Object.entries(tools.files))if(sha(await readFile(resolve('.local/tools/postgres-bin',file)))!==hash)throw Error('PG_CLIENT_TOOLCHAIN_MISMATCH');
  try {return await exec(resolve('.local/tools/postgres-bin',tool+'.exe'),args,{env:pgEnvironment(url),windowsHide:true,timeout:60000,maxBuffer:4*1024*1024});}
  catch {throw Error('PG_'+tool.toUpperCase()+'_FAILED');} // Never leak child stderr or credentials.
}
export async function inventory(pool:Pool) {
  const client=await pool.connect();try{return await inventoryClient(client);}finally{client.release();}
}
async function inventoryClient(client:{query:Pool['query']}) {
  const tables=(await client.query("SELECT schemaname,tablename FROM pg_tables WHERE schemaname LIKE 'fw\\_%' ESCAPE '\\' ORDER BY schemaname,tablename")).rows;
  const out:Record<string,number>={};
  for(const t of tables) {
    if(!/^[a-z0-9_]+$/.test(t.schemaname+t.tablename))throw Error('INVENTORY_IDENTIFIER_INVALID');
    out[t.schemaname+'.'+t.tablename]=Number((await client.query(`SELECT count(*) AS n FROM "${t.schemaname}"."${t.tablename}"`)).rows[0].n);
  }return out;
}
function encrypt(key:Buffer,bytes:Buffer,aad:string) {
  const nonce=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,nonce);cipher.setAAD(Buffer.from(aad));
  const content=Buffer.concat([cipher.update(bytes),cipher.final()]);return Buffer.concat([nonce,cipher.getAuthTag(),content]);
}
function decrypt(key:Buffer,bytes:Buffer,aad:string) {
  const cipher=createDecipheriv('aes-256-gcm',key,bytes.subarray(0,12));cipher.setAAD(Buffer.from(aad));cipher.setAuthTag(bytes.subarray(12,28));
  return Buffer.concat([cipher.update(bytes.subarray(28)),cipher.final()]);
}
export async function backupSynthetic(pool:Pool,url:string,scratchRoot:string,destination:string,capsulePublicPem:string,runtimeKeys:Record<string,string>):Promise<BackupReceipt> {
  if(!Object.keys(runtimeKeys).length||Object.entries(runtimeKeys).some(([k,v])=>!/^\w+:(pepper|replayKey|factorKey):v1$/.test(k)||Buffer.from(v,'base64url').length!==32))throw Error('RUNTIME_KEY_INVENTORY_REQUIRED');
  const id=token(),dir=resolve(scratchRoot,'backup-'+id);await mkdir(dir,{recursive:false});
  const dump=resolve(dir,'database.dump'),pending=resolve(destination,id+'.pending'),target=resolve(destination,id+'.sealed');
  const client=await pool.connect();let committed=false;
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    // Lower bound precedes snapshot creation; never use dump/upload completion for RPO.
    const snapshotStart=(await client.query('SELECT clock_timestamp() AS started')).rows[0].started.toISOString();
    const snapshot=(await client.query('SELECT pg_export_snapshot() AS snapshot')).rows[0].snapshot;
    const counts=await inventoryClient(client),largeObjects=Number((await client.query('SELECT count(*) AS n FROM pg_largeobject_metadata')).rows[0].n);
    await pg('pg_dump',['--format=custom','--snapshot='+snapshot,'--file='+dump],url);
    await client.query('COMMIT');committed=true;
    if((await stat(dump)).size>maxBytes)throw Error('SYNTHETIC_BACKUP_SIZE_LIMIT');
    const key=randomBytes(32),keyVersion='synthetic-capsule-v1';
    const capsule=publicEncrypt({key:capsulePublicPem,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},key).toString('base64url');
    const metadata={id,snapshotStart,inventory:counts,largeObjects,keyVersion,scope:'SYNTHETIC_SAME_HOST' as const};
    const bytes=encrypt(key,Buffer.from(jcs({dump:(await readFile(dump)).toString('base64url'),runtimeKeys})),jcs(metadata));key.fill(0);
    const pack=Buffer.from(jcs({metadata,capsule,cipher:bytes.toString('base64url')}));
    await writeFile(pending,pack,{flag:'wx',flush:true});await rename(pending,target);
    // Read-back is a local receipt, never proof of independent off-host durability.
    const received=await readFile(target);if(sha(received)!==sha(pack))throw Error('DESTINATION_READBACK_FAILED');
    return {...metadata,completedAt:new Date().toISOString(),cipherHash:sha(received),bytes:received.length};
  } finally {
    if(!committed)await client.query('ROLLBACK').catch(()=>{});client.release();
    await unlink(dump).catch(()=>{});await unlink(pending).catch(()=>{});
    // Only this function's freshly-created scratch directory is removed.
    const {rmdir}=await import('node:fs/promises');await rmdir(dir);
  }
}
export async function restoreSynthetic(url:string,receipt:BackupReceipt,repository:string,scratchRoot:string,privatePem:string) {
  const dir=resolve(scratchRoot,'restore-'+token());await mkdir(dir);const dump=resolve(dir,'database.dump');
  try {
    const pack=await readFile(resolve(repository,receipt.id+'.sealed'));if(sha(pack)!==receipt.cipherHash)throw Error('BACKUP_RECEIPT_MISMATCH');
    const payload=JSON.parse(pack.toString());
    if(jcs(payload.metadata)!==jcs(({id:receipt.id,snapshotStart:receipt.snapshotStart,inventory:receipt.inventory,largeObjects:receipt.largeObjects,keyVersion:receipt.keyVersion,scope:receipt.scope})))throw Error('BACKUP_INVENTORY_MISMATCH');
    const key=privateDecrypt({key:privatePem,oaepHash:'sha256',padding:constants.RSA_PKCS1_OAEP_PADDING},Buffer.from(payload.capsule,'base64url'));
    let runtimeKeys:Record<string,string>;
    try {const clear=JSON.parse(decrypt(key,Buffer.from(payload.cipher,'base64url'),jcs(payload.metadata)).toString());runtimeKeys=clear.runtimeKeys;await writeFile(dump,Buffer.from(clear.dump,'base64url'),{flag:'wx'});}finally{key.fill(0);}
    // Target database must be a fresh, disconnected scratch database, never an existing DB.
    const pool=new Pool({connectionString:url});try {
      const meta=(await pool.query("SELECT current_database() AS db,(SELECT count(*) FROM pg_namespace WHERE nspname LIKE 'fw\\_%' ESCAPE '\\') AS schemas")).rows[0];
      if(!/^fw_restore_[a-z0-9_]+$/.test(meta.db)||Number(meta.schemas)!==0)throw Error('EMPTY_RESTORE_TARGET_REQUIRED');
      await pool.query(`REVOKE CONNECT ON DATABASE ${meta.db} FROM PUBLIC`);
    }finally{await pool.end();}
    await pg('pg_restore',['--exit-on-error','--single-transaction','--dbname='+new URL(url).pathname.slice(1),dump],url);
    const restored=new Pool({connectionString:url});try {
      const observed=await inventory(restored);
      if(jcs(observed)!==jcs(receipt.inventory)||Number((await restored.query('SELECT count(*) AS n FROM pg_largeobject_metadata')).rows[0].n)!==receipt.largeObjects)throw Error('RESTORED_INVENTORY_MISMATCH');
      await fenceRestore(restored);
      return {runtimeKeys,locked:true,inventoryVerified:true};
    }catch(e){await restored.query('UPDATE fw_control.state SET locked=true').catch(()=>{});throw e;}finally{await restored.end();}
  }finally{await unlink(dump).catch(()=>{});const {rmdir}=await import('node:fs/promises');await rmdir(dir);}
}
export function rpoMs(receipt:BackupReceipt,failureTime:number) {
  const start=Date.parse(receipt.snapshotStart);if(!Number.isFinite(start)||failureTime<start)throw Error('RPO_CLOCK_INVALID');return failureTime-start;
}
export async function purgeSyntheticCopy(repository:string,id:string) {
  if(!/^[A-Za-z0-9_-]{43}$/.test(id))throw Error('BACKUP_ID_INVALID');
  const target=resolve(repository,id+'.sealed');await unlink(target);
  try {await open(target,'r');throw Error('PURGE_NOT_CONFIRMED');}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;}
  return {scope:'LOCAL_FILESYSTEM_UNLINK_AND_REOPEN_ENOENT',physicalMediaErasure:false};
}
