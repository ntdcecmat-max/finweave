import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import type { Client } from 'pg';
import { root, sha256, verifyPins } from '../pins.ts';
import {catalogHash} from './migrate.ts';

const q=(s:string)=>'"'+s.replaceAll('"','""')+'"';
export interface BackfillInputs {
  revision: string;
  // Privileged, explicitly reviewed provenance. Never derived from live profiles or plan_version.
  rows: Record<string,Record<string,Record<string,unknown>>>;
}
export async function backfillDb005(client:Client, inputs:BackfillInputs, options:{chunkSize?:number; failAfterChunks?:number; evidence?:(v:unknown)=>void}={}) {
  await verifyPins();
  const meta=(await client.query("SELECT current_database() AS db,current_setting('server_version_num')::int AS v")).rows[0];
  if(!/^fw_synthetic_[a-z0-9_]+$/.test(meta.db)||meta.v<160000||meta.v>=170000) throw new Error('DISPOSABLE_POSTGRES16_REQUIRED');
  const held=(await client.query('SELECT pg_try_advisory_lock(1179997261,1) AS held')).rows[0].held;
  if(!held) throw new Error('MIGRATION_LOCK_BUSY');
  const size=options.chunkSize??100;
  if(!Number.isInteger(size)||size<1||size>1000) {await client.query('SELECT pg_advisory_unlock(1179997261,1)');throw new Error('BACKFILL_CHUNK_BOUND_INVALID');}
  const model=JSON.parse(await readFile(resolve(root,'docs/data/target-t1-async/target-model.json'),'utf8'));
  const baseline=JSON.parse(await readFile(resolve(root,'docs/data/physical/physical-model.json'),'utf8'));
  const inputHash=sha256(JSON.stringify(inputs));
  let chunks=0;
  try {
    const journal=(await client.query('SELECT migration_name FROM fw_infra.migration_journal ORDER BY migration_name')).rows.map(r=>r.migration_name);
    if(journal.at(-1)!=='006') throw new Error('BACKFILL_REQUIRES_EXPAND_006_BEFORE_CONSTRAINTS');
    const latest=(await client.query("SELECT catalog_sha256 FROM fw_infra.migration_journal WHERE migration_name='006'")).rows[0];
    if(await catalogHash(client)!==latest.catalog_sha256) throw new Error('BACKFILL_CATALOG_DRIFT');
    for(const t of model.tables){
      const old=baseline.tables.find((b:any)=>b.name===t.name);
      if(!old||t.name==='entry_groups') continue;
      const added=t.columns.filter((c:any)=>!old.columns.some((b:any)=>b.name===c.name));
      if(!added.length) continue;
      await client.query(`INSERT INTO fw_infra.backfill_progress(table_name,input_sha256) VALUES($1,$2) ON CONFLICT DO NOTHING`,[t.name,inputHash]);
      const initial=(await client.query('SELECT * FROM fw_infra.backfill_progress WHERE table_name=$1',[t.name])).rows[0];
      if(initial.input_sha256!==inputHash) throw new Error('BACKFILL_INPUT_CHECKSUM_MISMATCH');
      if(initial.completed) continue;
      const hasWorkspace=old.columns.some((c:any)=>c.name==='workspace_id');
      const keyExpr=hasWorkspace?"jsonb_build_array(workspace_id,id)::text":"jsonb_build_array(id)::text";
      for(;;){
        await client.query('BEGIN');
        try {
          const progress=(await client.query('SELECT * FROM fw_infra.backfill_progress WHERE table_name=$1 FOR UPDATE',[t.name])).rows[0];
          const rows=(await client.query(`SELECT *,${keyExpr} AS backfill_key FROM fw.${q(t.name)} WHERE ${keyExpr}>$1 ORDER BY ${keyExpr} LIMIT $2 FOR UPDATE`,[progress.last_key,size])).rows;
          if(!rows.length){await client.query('UPDATE fw_infra.backfill_progress SET completed=true,updated_at=clock_timestamp() WHERE table_name=$1',[t.name]);await client.query('COMMIT');break;}
          // Migration-only trigger suspension is transactional and restored before each commit.
          // Foreign keys and checks remain enabled. Runtime roles have no ALTER privilege.
          await client.query(`ALTER TABLE fw.${q(t.name)} DISABLE TRIGGER USER`);
          for(const row of rows){
            const supplied=inputs.rows[t.name]?.[row.backfill_key]??{};
            const fields:Record<string,unknown>={};
            for(const c of added){
              if(row[c.name]!==null) continue;
              if(c.name==='recovery_token') fields[c.name]=randomBytes(32).toString('hex');
              else if(['auth_epoch','recovery_epoch','recovery_control_epoch','owner_epoch','credential_epoch','refresh_generation','capture_epoch'].includes(c.name)) fields[c.name]=0;
              else if(c.name==='recovery_reset_required') fields[c.name]=true; // legacy disabled password never authorizes login
              else if(c.name==='access_state') fields[c.name]='blocked'; // privileged review is required to open an inherited workspace
              else if(Object.hasOwn(supplied,c.name)) fields[c.name]=supplied[c.name];
              else if(!c.nullable) throw new Error(`LEGACY_PROVENANCE_REQUIRED:${t.name}:${c.name}:${row.backfill_key}`);
            }
            // All legacy authentication is revoked, never silently converted into live credentials.
            if(t.name==='sessions') {fields.revoked_at=row.revoked_at??new Date().toISOString(); fields.revoke_reason='migration_relogin_required'; if(row.role!=='owner') throw new Error('LEGACY_ADMIN_SESSION_QUARANTINE_REQUIRED');}
            if(t.name==='devices') {fields.status='revoked';fields.revoked_at=row.revoked_at??new Date().toISOString();}
            if(t.name==='identity_challenges') {fields.state='expired';fields.consumed_at=row.consumed_at??new Date().toISOString();}
            const names=Object.keys(fields);
            if(names.length) {
              const values=names.map(n=>fields[n]);
              values.push(row.id); if(hasWorkspace) values.push(row.workspace_id);
              const sql=`UPDATE fw.${q(t.name)} SET ${names.map((n,i)=>`${q(n)}=$${i+1}`).join(',')}${old.columns.some((c:any)=>c.name==='version')?',version=version+1':''} WHERE id=$${names.length+1}${hasWorkspace?` AND workspace_id=$${names.length+2}`:''}`;
              await client.query(sql,values);
              options.evidence?.({table:t.name,key:row.backfill_key,columns:names,sql});
            }
          }
          await client.query(`ALTER TABLE fw.${q(t.name)} ENABLE TRIGGER USER`);
          await client.query('UPDATE fw_infra.backfill_progress SET last_key=$2,rows_done=rows_done+$3,updated_at=clock_timestamp() WHERE table_name=$1',[t.name,rows.at(-1).backfill_key,rows.length]);
          await client.query('COMMIT');
          options.evidence?.({table:t.name,committedRows:rows.length,checkpoint:rows.at(-1).backfill_key});
          if(++chunks===options.failAfterChunks) throw new Error('INJECTED_BACKFILL_INTERRUPTION');
        }catch(e){await client.query('ROLLBACK');throw e;}
      }
    }
    return (await client.query('SELECT table_name,rows_done,completed,input_sha256 FROM fw_infra.backfill_progress ORDER BY table_name')).rows;
  }finally{await client.query('SELECT pg_advisory_unlock(1179997261,1)').catch(()=>{});}
}
