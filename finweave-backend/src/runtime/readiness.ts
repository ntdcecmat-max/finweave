import type { Pool } from 'pg';
import type { Config } from './config.ts';
export async function readiness(pool:Pool,config:Config) {
  const role=(await pool.query(`SELECT r.rolsuper,r.rolbypassrls,r.rolcreaterole,r.rolcreatedb,r.rolreplication,
    pg_has_role(current_user,$1,'member') AS member,
    EXISTS(SELECT 1 FROM pg_roles x WHERE x.rolname<>$1 AND x.rolname<>current_user AND pg_has_role(current_user,x.oid,'member')) AS combined
    FROM pg_roles r WHERE r.rolname=current_user`,['fw_runtime_'+config.profile])).rows[0];
  if(!role?.member||role.combined||role.rolsuper||role.rolbypassrls||role.rolcreaterole||role.rolcreatedb||role.rolreplication)throw Error('PROCESS_DB_CAPABILITY_MISMATCH');
  const state=(await pool.query('SELECT * FROM fw_control.read_state()')).rows[0];
  if(!state||state.locked||state.epoch!==config.recoveryEpoch||typeof state.maintenance!=='boolean')throw Error('STARTUP_RECOVERY_OR_SCHEMA_FENCE');
  const required=['fw_control.state','fw_control.denies','fw_control.erasures','fw_finance.accounts','fw_finance.ledger_accounts','fw_finance.events','fw_finance.entry_groups','fw_finance.posting_lines','fw_dispatch.jobs','fw_dispatch.outcomes'];
  const tables=(await pool.query("SELECT n.nspname||'.'||c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind='r' AND n.nspname||'.'||c.relname=ANY($1::text[])",[required])).rows;
  if(tables.length!==required.length)throw Error('STARTUP_REQUIRED_SCHEMA_MISSING');
  // A missing required port/grant cannot be disguised by SELECT 1 succeeding.
  const port=config.profile==='user'?'fw_control.read_state()':config.profile==='ops'?'fw_control.read_state()':'fw_dispatch.claim(text,text)';
  const granted=(await pool.query('SELECT has_function_privilege(current_user,$1,\'EXECUTE\') AS granted',[port])).rows[0].granted;
  if(!granted)throw Error('STARTUP_REQUIRED_GRANT_MISSING');
  return state;
}
