import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { mkdir,writeFile,unlink,readFile,appendFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'node:net';
import { Pool } from 'pg';
import { initdb,pg_ctl } from '@embedded-postgres/windows-x64';
import { migrateRuntime } from '../src/runtime/migrate.ts';
import type { Config,Profile } from '../src/runtime/config.ts';
const exec=promisify(execFile);
export async function startCluster(label:string) {
  const dir=resolve('.local',label);await mkdir(dir,{recursive:true});
  const password=randomBytes(32).toString('hex'),pw=resolve(dir,'pw.tmp'),cluster=resolve(dir,'pg');
  const server=createServer();await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const port=(server.address() as {port:number}).port;await new Promise<void>(r=>server.close(()=>r()));
  await writeFile(pw,password,{flag:'wx'});
  try {await exec(initdb,['-D',cluster,'-U','fw_local','--auth=scram-sha-256','--pwfile',pw,'--encoding=UTF8','--locale=C'],{windowsHide:true,timeout:30000});} finally {await unlink(pw);}
  // Persist across restarts: never send SQL parameters/error detail to native logs.
  await appendFile(resolve(cluster,'postgresql.conf'),'\n'+await readFile('database/runtime/private-logging.conf','utf8'));
  await exec(pg_ctl,['-D',cluster,'-l',resolve(dir,'postgres.log'),'-w','start','-o',`-h 127.0.0.1 -p ${port} -c timezone=UTC -c max_connections=30`],{windowsHide:true,timeout:30000});
  const adminUrl=`postgresql://fw_local:${password}@127.0.0.1:${port}/postgres`,admin=new Pool({connectionString:adminUrl,max:4});
  const configs={} as Record<Profile,Config>;
  try {
    await migrateRuntime(admin);
    for(const profile of ['user','ops','ingestion','market','forecast','agent','retention'] as Profile[]) {
      const login='fw_local_'+profile,pass=randomBytes(32).toString('hex');
      // Fixed allowlisted identifiers and hex-generated secrets; no user SQL interpolation.
      await admin.query(`CREATE ROLE ${login} LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${pass}' IN ROLE fw_runtime_${profile}`);
      configs[profile]={profile,databaseUrl:`postgresql://${login}:${pass}@127.0.0.1:${port}/postgres`,origin:profile==='ops'?'http://127.0.0.1:4311':'http://127.0.0.1:4310',pepper:randomBytes(32),replayKey:randomBytes(32),...(profile==='ops'?{factorKey:randomBytes(32)}:{}),recoveryEpoch:0,local:true};
    }
    const businessPassword=randomBytes(32).toString('hex');
    await admin.query(`CREATE ROLE fw_local_ops_business LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${businessPassword}' IN ROLE fw_runtime_ops_business`);
    configs.ops.opsBusinessDatabaseUrl=`postgresql://fw_local_ops_business:${businessPassword}@127.0.0.1:${port}/postgres`;
  } catch(e){await admin.end();await exec(pg_ctl,['-D',cluster,'-w','stop','-m','fast'],{windowsHide:true});throw e;}
  return {dir,cluster,admin,adminUrl,configs,async stop(){await admin.end();await exec(pg_ctl,['-D',cluster,'-w','stop','-m','fast'],{windowsHide:true,timeout:30000});}};
}
