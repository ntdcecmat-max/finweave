import { readFile } from 'node:fs/promises';
import type { Pool } from 'pg';
import { sha } from './crypto.ts';
import { unitOfWork } from './uow.ts';
export async function migrateRuntime(pool:Pool) {
  const migrations=await Promise.all(['001_runtime.sql','002_auth_payload_expiry.sql','003_ops_restore_gate.sql','004_job_device_fences.sql','005_financial_engine.sql','006_async_sources.sql','007_business_workflows.sql','008_assistant_planning.sql','009_agent_runtime.sql','010_ops_services.sql','011_operations.sql','012_expired_preview_retention.sql'].map(async name=>{const sql=await readFile(new URL('../../database/runtime/'+name,import.meta.url),'utf8');return {id:name.slice(0,3),sql,hash:sha(sql)};}));
  return unitOfWork(pool,async tx=>{
    await tx.lock('fw-runtime-migration');
    await tx.query('CREATE SCHEMA IF NOT EXISTS fw_runtime_meta');
    await tx.query('CREATE TABLE IF NOT EXISTS fw_runtime_meta.migrations(id text PRIMARY KEY,checksum text NOT NULL)');
    let changed=false;
    for(const m of migrations) {
      const old=await tx.one('SELECT * FROM fw_runtime_meta.migrations WHERE id=$1',[m.id]);
      if(old) {if(old.checksum!==m.hash)throw Error('RUNTIME_MIGRATION_CHECKSUM_MISMATCH:'+m.id);continue;}
      await tx.query(m.sql);await tx.query('INSERT INTO fw_runtime_meta.migrations VALUES($1,$2)',[m.id,m.hash]);changed=true;
    }
    return changed;
  });
}
