import { Pool } from 'pg';
import type { Config } from './config.ts';
import { readiness } from './readiness.ts';

// Read-only deployment check; never migrates, grants privileges, claims work or resets counters.
export async function checkObservationCompatibility(admin:Pool,configs:Config[],expected:Record<string,string>) {
 const installed=(await admin.query('SELECT id,checksum FROM fw_runtime_meta.migrations ORDER BY id')).rows;
 if(installed.length!==Object.keys(expected).length||installed.some(m=>expected[m.id]!==m.checksum))throw Error('OBSERVATION_MIGRATION_MISMATCH');
 const control=(await admin.query('SELECT * FROM fw_control.read_state()')).rows[0];
 if(control?.locked||control?.maintenance!==false)throw Error('OBSERVATION_ADMISSION_CLOSED');
 for(const config of configs) {
  if(!['ingestion','market'].includes(config.profile))throw Error('OBSERVATION_PROFILE_INVALID');
  const pool=new Pool({connectionString:config.databaseUrl,max:1,connectionTimeoutMillis:5000});
  try {
   await readiness(pool,config);
   const ports=(await pool.query("SELECT has_schema_privilege(current_user,to_regnamespace('fw_ops'),'USAGE') AS usage,has_function_privilege(current_user,to_regprocedure('fw_ops.apply_controls(text)'),'EXECUTE') AS execute")).rows[0];
   if(ports?.usage!==true||ports?.execute!==true)throw Error('OBSERVATION_WORKER_PORT_DENIED');
  }finally {await pool.end();}
 }
 return {migrations:installed.map(m=>m.id),profiles:configs.map(c=>c.profile)};
}
