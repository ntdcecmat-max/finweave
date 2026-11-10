import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {Client} from 'pg';
import {root} from '../src/pins.ts';
import {migrate} from '../src/database/migrate.ts';
import {backfillDb005} from '../src/database/backfill-db005.ts';

// Dedicated privileged disposable connection only. No default password/database/remote host.
const required=['PGHOST','PGPORT','PGUSER','PGPASSWORD','PGDATABASE'];
if(required.some(k=>!process.env[k]))throw new Error('EXPLICIT_LOCAL_PG_CONFIG_REQUIRED');
if(!['127.0.0.1','localhost','::1'].includes(process.env.PGHOST!))throw new Error('LOCAL_HOST_REQUIRED');
const args=process.argv.slice(2);const value=(flag:string)=>{const i=args.indexOf(flag);return i<0?undefined:args[i+1];};
if(args.some(a=>a.startsWith('--')&&!['--through','--backfill-input','--release'].includes(a)))throw new Error('UNKNOWN_OPTION');
const migrations=JSON.parse(await readFile(resolve(root,'finweave-backend/database/db005-manifest.json'),'utf8')).migrations;
const client=new Client();await client.connect();
try{
 const releaseId=value('--release')??'FW-DB005-LOCAL-001';const through=value('--through');
 if(through){console.log(JSON.stringify({applied:await migrate(client,{releaseId,migrations,through})}));}
 else{
  const known=(await client.query("SELECT to_regclass('fw_infra.migration_journal') AS j")).rows[0].j;
  const last=known?(await client.query('SELECT max(migration_name) AS id FROM fw_infra.migration_journal')).rows[0].id:null;
  if(last&&last>='007')console.log(JSON.stringify({applied:await migrate(client,{releaseId,migrations})}));
  else{
   const expanded=await migrate(client,{releaseId,migrations,through:'006'});
   const path=value('--backfill-input');
   const inputs=path?JSON.parse(await readFile(resolve(path),'utf8')):{revision:'EMPTY_DISPOSABLE_INSTALL_001',rows:{}};
   const checkpoints=await backfillDb005(client,inputs);
   const constrained=await migrate(client,{releaseId,migrations});
   console.log(JSON.stringify({applied:[...expanded,...constrained],backfill:checkpoints.map(p=>({table:p.table_name,rows:p.rows_done,completed:p.completed}))}));
  }
 }
}finally{await client.end();}
