import { readFile,writeFile,mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes,generateKeyPairSync } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pg_ctl } from '@embedded-postgres/windows-x64';
import { Pool } from 'pg';
import { startCluster } from './runtime-cluster.ts';
import { hashPassword,seal,token,totp } from '../src/runtime/crypto.ts';
import { FileWitness,anchorDenies,fenceRestore,reconcileRestore } from '../src/runtime/recovery.ts';
import { migrateRuntime } from '../src/runtime/migrate.ts';
const statePath=resolve(process.env.FINWEAVE_TEST_RUNTIME_STATE??'.local/runtime-state.json'),command=process.argv[2];
if(command==='init') {
  try {await readFile(statePath);throw Error('LOCAL_RUNTIME_ALREADY_INITIALIZED');} catch(e){if((e as any).code!=='ENOENT')throw e;}
  const cluster=await startCluster('runtime-local-'+Date.now());
  try {
    for(const [profile,c] of Object.entries(cluster.configs)) await writeFile(resolve(cluster.dir,profile+'.json'),JSON.stringify({...c,pepper:c.pepper.toString('base64url'),replayKey:c.replayKey.toString('base64url'),...(c.factorKey?{factorKey:c.factorKey.toString('base64url')}:{})},null,2),{flag:'wx'});
    const id=token(),seed=randomBytes(20),password='Synthetic Ops password 2026!';
    // Synthetic local fixture only; the factor still follows RFC6238 and one-use counter rules.
    const step=Math.floor(Date.now()/30000),first=totp(seed,step),second=totp(seed,step+1);
    if(first.length!==6||second.length!==6)throw Error('FACTOR_PROVISIONING_FAILED');
    await cluster.admin.query('INSERT INTO fw_ops.identities(id,email,password,seed) VALUES($1,$2,$3,$4)',[id,'operator@ops.test',await hashPassword(password),seal(cluster.configs.ops.factorKey!,seed.toString('base64url'),'totp:'+id)]);
    const keys=generateKeyPairSync('ed25519');
    await writeFile(resolve(cluster.dir,'witness-private.pem'),keys.privateKey.export({type:'pkcs8',format:'pem'}),{flag:'wx'});
    await writeFile(resolve(cluster.dir,'witness-public.pem'),keys.publicKey.export({type:'spki',format:'pem'}),{flag:'wx'});
    await writeFile(resolve(cluster.dir,'witness-journal.json'),'[]',{flag:'wx',flush:true});
    await writeFile(resolve(cluster.dir,'ops-fixture.json'),JSON.stringify({email:'operator@ops.test',password,seed:seed.toString('base64url')},null,2),{flag:'wx'});
    await writeFile(statePath,JSON.stringify({dir:cluster.dir,cluster:cluster.cluster,adminUrl:cluster.adminUrl},null,2),{flag:'wx'});
    console.log('Synthetic local PostgreSQL ready. Secret directory: '+cluster.dir);
  } catch(e) {await cluster.stop();throw e;} finally {await cluster.admin.end();}
} else {
  const state=JSON.parse(await readFile(statePath,'utf8'));
  if(command==='mfa') {const f=JSON.parse(await readFile(resolve(state.dir,'ops-fixture.json'),'utf8'));console.log(totp(Buffer.from(f.seed,'base64url'),Math.floor(Date.now()/30000)));}
  else if(command==='start'||command==='stop') {
    const target=new URL(state.adminUrl),port=Number(target.port);
    if(target.hostname!=='127.0.0.1'||!Number.isInteger(port)||port<1||port>65535)throw Error('LOCAL_CLUSTER_BINDING_INVALID');
    await promisify(execFile)(pg_ctl,['-D',state.cluster,'-w',command,...(command==='start'?['-l',resolve(state.dir,'postgres.log'),'-o',`-h 127.0.0.1 -p ${port} -c timezone=UTC -c max_connections=30`]:['-m','fast'])],{windowsHide:true,timeout:30000});
  }
  else if(command==='migrate'){
    const admin=new Pool({connectionString:state.adminUrl,max:2});
    try {
      await migrateRuntime(admin);
      const opsPath=resolve(state.dir,'ops.json'),opsConfig=JSON.parse(await readFile(opsPath,'utf8'));
      if(!opsConfig.opsBusinessDatabaseUrl) {
        const login='fw_local_ops_business_'+randomBytes(6).toString('hex'),password=randomBytes(32).toString('hex');
        await admin.query(`CREATE ROLE ${login} LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${password}' IN ROLE fw_runtime_ops_business`);
        const url=new URL(state.adminUrl);url.username=login;url.password=password;
        opsConfig.opsBusinessDatabaseUrl=url.toString();await writeFile(opsPath,JSON.stringify(opsConfig,null,2),{flush:true});
      }
      console.log('Runtime migrations and Ops pool configuration verified/applied');
    }finally{await admin.end();}
  }
  else if(['anchor','restore-fence','restore-reconcile'].includes(command??'')) {
    const admin=new Pool({connectionString:state.adminUrl,max:2});
    try {
      const privatePem=await readFile(resolve(state.dir,'witness-private.pem'),'utf8'),publicPem=await readFile(resolve(state.dir,'witness-public.pem'),'utf8');
      const witness=new FileWitness(resolve(state.dir,'witness-journal.json'),privatePem);
      if(command==='anchor')await anchorDenies(admin,witness,publicPem);
      else if(command==='restore-fence')await fenceRestore(admin);
      else {
        await reconcileRestore(admin,witness,publicPem);
        const epoch=(await admin.query('SELECT epoch FROM fw_control.state')).rows[0].epoch;
        for(const profile of ['user','ops','ingestion','market','forecast','agent','retention']) {
          const path=resolve(state.dir,profile+'.json'),config=JSON.parse(await readFile(path,'utf8'));config.recoveryEpoch=epoch;await writeFile(path,JSON.stringify(config,null,2),{flush:true});
        }
      }
      console.log(command+' complete');
    } finally {await admin.end();}
  } else if(command==='paths')console.log(JSON.stringify({user:resolve(state.dir,'user.json'),ops:resolve(state.dir,'ops.json'),mail:resolve(state.dir,'mail')},null,2));
  else throw Error('Use init|paths|mfa|start|stop|migrate|anchor|restore-fence|restore-reconcile');
}
