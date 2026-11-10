import { readFile,writeFile,statfs } from 'node:fs/promises';
import { resolve,relative,isAbsolute } from 'node:path';
import { verify } from 'node:crypto';
import { Pool } from 'pg';
import { migrateRuntime } from '../src/runtime/migrate.ts';
import { sha,jcs } from '../src/runtime/crypto.ts';
import { compatibilityTuple,rollbackCompatible,requireGates,realPromotion } from '../src/runtime/operations-release.ts';
import { backupSynthetic,restoreSynthetic } from '../src/runtime/operations-backup.ts';
import { saveCatalog,pruneSyntheticRepository } from '../src/runtime/operations-prune.ts';
import { beginErasure,purgeActiveSynthetic,verifyActivePurge } from '../src/runtime/operations-erasure.ts';
import { reconcileRestore,FileWitness,anchorDenies,verifiedHead } from '../src/runtime/recovery.ts';
import { readiness } from '../src/runtime/readiness.ts';
import type { Config } from '../src/runtime/config.ts';
const [command,file]=process.argv.slice(2);
const local=resolve('.local');
function localPath(path:string) {const p=resolve(path),r=relative(local,p);if(!r||r.startsWith('..')||isAbsolute(r))throw Error('DISPOSABLE_LOCAL_PATH_REQUIRED');return p;}
async function run() {
  if(process.env.FW_MODE!=='synthetic-local')realPromotion();
  if(!file)throw Error('OPERATIONS_FILE_REQUIRED');
  const config=JSON.parse(await readFile(localPath(file),'utf8'));
  if(config.mode!=='synthetic-local'||!config.runtimeStateFile)throw Error('SYNTHETIC_OPERATOR_CONFIG_REQUIRED');
  const state=JSON.parse(await readFile(localPath(config.runtimeStateFile),'utf8')),url=new URL(state.adminUrl);
  if(!['localhost','127.0.0.1'].includes(url.hostname)||url.pathname!=='/postgres')throw Error('LOCAL_SYNTHETIC_DATABASE_REQUIRED');
  const pool=new Pool({connectionString:state.adminUrl,connectionTimeoutMillis:5000});pool.on('error',()=>{});
  try {
    switch(command) {
      case 'status':{const space=await statfs(local);console.log(JSON.stringify({...(await pool.query('SELECT fw_control.safe_metrics() AS metrics')).rows[0].metrics,availableBytes:Number(space.bavail)*Number(space.bsize),realEnabled:false}));break;}
      case 'maintenance':await pool.query('SELECT fw_control.enter_maintenance()');console.log('MAINTENANCE');break;
      case 'drain':{if(!(await pool.query('SELECT maintenance FROM fw_control.state')).rows[0].maintenance)throw Error('MAINTENANCE_REQUIRED');const deadline=Date.now()+Math.min(config.graceMs??90000,90000);let n=0;do{n=Number((await pool.query("SELECT count(*) AS n FROM fw_dispatch.jobs WHERE state='running' AND profile<>'retention'")).rows[0].n);if(!n)break;await new Promise(r=>setTimeout(r,250));}while(Date.now()<deadline);if(n)throw Error('DRAIN_TIMEOUT_FENCE_BEFORE_KILL');console.log('DRAINED');break;}
      case 'fence':console.log(JSON.stringify({fenced:(await pool.query('SELECT fw_control.fence_workers() AS n')).rows[0].n}));break;
      case 'migrate':if(!(await pool.query('SELECT maintenance FROM fw_control.state')).rows[0].maintenance)throw Error('MAINTENANCE_REQUIRED');await migrateRuntime(pool);console.log('MIGRATED');break;
      case 'open':case 'rollback-check':{
        const release=JSON.parse(await readFile(localPath(config.releaseFile),'utf8'));
        if(release.mode!=='synthetic-local'||release.status!=='SYNTHETIC_VERIFIED_REAL_CLOSED')throw Error('UNVERIFIED_ARTIFACT');
        const bytes=await readFile(localPath(release.artifactPath));if(sha(bytes)!==release.artifactDigest||!verify(null,Buffer.from(release.artifactDigest),release.signer,Buffer.from(release.signature,'base64url')))throw Error('ARTIFACT_SIGNATURE_INVALID');
        requireGates(release.checks,['typecheck','unit','operations'],release.sourceDigest,release.artifactDigest);
        const current=await compatibilityTuple(resolve('..'));rollbackCompatible(current,release.compatibility);
        if(command==='open')for(const [p,hash] of Object.entries(release.source) as [string,string|null][])if(p.startsWith('finweave-backend/')){let observed:string|null;try{observed=sha(await readFile(resolve('..',p)));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;observed=null;}if(observed!==hash)throw Error('RUNNING_SOURCE_DIFFERS_FROM_TESTED_ARTIFACT');}
        const migrations=(await pool.query('SELECT id,checksum FROM fw_runtime_meta.migrations ORDER BY id')).rows;
        if(migrations.length!==Object.keys(current).filter(k=>k.endsWith('.sql')).length||migrations.some(m=>current[Object.keys(current).find(k=>k.includes('/'+m.id+'_'))??'']!==m.checksum))throw Error('DATABASE_RELEASE_MISMATCH');
        const control=(await pool.query('SELECT * FROM fw_control.state')).rows[0];if(control.locked)throw Error('RECOVERY_LOCKED');
        for(const profile of ['user','ops','ingestion','market','forecast','agent','retention']){const c=JSON.parse(await readFile(localPath(resolve(state.dir,profile+'.json')),'utf8'));const p=new Pool({connectionString:c.databaseUrl,connectionTimeoutMillis:5000});p.on('error',()=>{});try{await readiness(p,{...c,pepper:Buffer.from(c.pepper,'base64url'),replayKey:Buffer.from(c.replayKey,'base64url')} as Config);}finally{await p.end();}}
        const receipt=JSON.parse(await readFile(localPath(config.receiptFile),'utf8'));
        if(Date.now()-Date.parse(receipt.snapshotStart)>86400000||!Number.isFinite(Date.parse(receipt.snapshotStart)))throw Error('PRERELEASE_BACKUP_AGE_GATE');
        const stored=JSON.parse(await readFile(localPath(resolve(config.repository,receipt.id+'.receipt.json')),'utf8'));
        if(jcs(stored.receipt)!==jcs(receipt)||!verify(null,Buffer.from(jcs(receipt)),await readFile(localPath(config.catalogPublicFile),'utf8'),Buffer.from(stored.signature,'base64url'))||sha(await readFile(localPath(resolve(config.repository,receipt.id+'.sealed'))))!==receipt.cipherHash)throw Error('PRERELEASE_BACKUP_RECEIPT_GATE');
        const witness=new FileWitness(localPath(config.witnessJournal),await readFile(localPath(config.witnessPrivateFile),'utf8')),nonce=(await import('../src/runtime/crypto.ts')).token(),head=await witness.head(nonce);verifiedHead(head,nonce,await readFile(localPath(config.witnessPublicFile),'utf8'));
        const localDenies=(await pool.query('SELECT id FROM fw_control.denies')).rows;if(localDenies.some(d=>!head.entries.some(e=>e.id===d.id)))throw Error('PRERELEASE_WITNESS_BEHIND');
        if(Number((await pool.query("SELECT count(*) AS n FROM fw_dispatch.jobs WHERE state='running' AND profile<>'retention'")).rows[0].n))throw Error('WORKERS_NOT_DRAINED');
        if(command==='open'){await pool.query('UPDATE fw_control.state SET maintenance=false');console.log('SYNTHETIC_OPEN');}else console.log('CODE_ONLY_COMPATIBLE_NO_DATABASE_REWIND');break;
      }
      case 'backup':{
        const keyring:Record<string,string>={};for(const profile of ['user','ops','ingestion','market','forecast','agent','retention']){const c=JSON.parse(await readFile(localPath(resolve(state.dir,profile+'.json')),'utf8'));for(const k of ['pepper','replayKey','factorKey'])if(c[k])keyring[profile+':'+k+':v1']=c[k];}
        const receipt=await backupSynthetic(pool,state.adminUrl,localPath(config.scratch),localPath(config.repository),await readFile(localPath(config.capsulePublicFile),'utf8'),keyring);
        await saveCatalog(localPath(config.repository),receipt,await readFile(localPath(config.catalogPrivateFile),'utf8'));
        await writeFile(localPath(config.receiptFile),JSON.stringify(receipt,null,2));console.log(JSON.stringify({status:'SYNTHETIC_BACKUP_READBACK',snapshotStart:receipt.snapshotStart,offHost:false}));break;
      }
      case 'prune':console.log(JSON.stringify(await pruneSyntheticRepository(localPath(config.repository),localPath(config.scratch),await readFile(localPath(config.catalogPublicFile),'utf8'),config.reserveBytes)));break;
      case 'restore':{
        // Empty scratch DB enforced by restoreSynthetic; old host fencing is still a gate.
        if(config.oldWriterFenced!==true)throw Error('OLD_WRITER_FENCE_REQUIRED');
        const restoreDb=config.restoreDatabase;if(!/^fw_restore_[a-z0-9_]+$/.test(restoreDb))throw Error('SCRATCH_RESTORE_DATABASE_REQUIRED');
        await pool.query('CREATE DATABASE '+restoreDb);const target=new URL(state.adminUrl);target.pathname='/'+restoreDb;
        const receipt=JSON.parse(await readFile(localPath(config.receiptFile),'utf8'));
        await restoreSynthetic(target.href,receipt,localPath(config.repository),localPath(config.scratch),await readFile(localPath(config.capsulePrivateFile),'utf8'));
        console.log('RESTORED_LOCKED; new proof/enrollment and trusted quota reconciliation still required');break;
      }
      case 'witness-reconcile':{
        if(config.oldWriterFenced!==true)throw Error('OLD_WRITER_FENCE_REQUIRED');if(!/^fw_restore_[a-z0-9_]+$/.test(config.restoreDatabase))throw Error('SCRATCH_RESTORE_DATABASE_REQUIRED');
        const target=new URL(state.adminUrl);target.pathname='/'+config.restoreDatabase;const restored=new Pool({connectionString:target.href});try{await reconcileRestore(restored,new FileWitness(localPath(config.witnessJournal),await readFile(localPath(config.witnessPrivateFile),'utf8')),await readFile(localPath(config.witnessPublicFile),'utf8'));}finally{await restored.end();}console.log('WITNESS_RECONCILED_IDENTITIES_BLOCKED_QUOTAS_DENIED');break;
      }
      case 'witness-anchor':await anchorDenies(pool,new FileWitness(localPath(config.witnessJournal),await readFile(localPath(config.witnessPrivateFile),'utf8')),await readFile(localPath(config.witnessPublicFile),'utf8'));console.log('SYNTHETIC_DENIES_ANCHORED');break;
      case 'erase-deny':case 'erase-purge':case 'erase-verify':{
        const c=JSON.parse(await readFile(localPath(resolve(state.dir,'user.json')),'utf8'));
        if(command==='erase-deny'){const r=await beginErasure(pool,config.subjectId,Buffer.from(c.pepper,'base64url'));console.log(JSON.stringify({status:'DENIED_PENDING_WITNESS_AND_COPIES',deadline:r.deadline}));}
        if(command==='erase-purge')console.log(JSON.stringify(await purgeActiveSynthetic(pool,config.subjectId)));
        if(command==='erase-verify')console.log(JSON.stringify(await verifyActivePurge(pool,config.subjectId)));break;
      }
      default:throw Error('UNKNOWN_OPERATIONS_COMMAND');
    }
  }finally{await pool.end();}
}
try{await run();}catch{console.error('{"safeCode":"OPERATIONS_FAILED_CLOSED"}');process.exitCode=1;}
