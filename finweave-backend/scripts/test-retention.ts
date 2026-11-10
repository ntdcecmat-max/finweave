import assert from 'node:assert/strict';
import {Pool} from 'pg';
import {startCluster} from './runtime-cluster.ts';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {sha} from '../src/runtime/crypto.ts';
const cluster=await startCluster('expired-preview-'+Date.now());
const worker=new Pool({connectionString:cluster.configs.retention.databaseUrl,max:1});
const user=new Pool({connectionString:cluster.configs.user.databaseUrl,max:1});
const result:any={scope:'EXECUTED_POSTGRES_EXPIRED_PREVIEW_PURGE_WITH_IMMUTABILITY_AND_ROLE_REGRESSION',startedAt:new Date().toISOString(),checks:[],status:'FAIL',source:{}};
try{
 await cluster.admin.query("INSERT INTO fw_auth.identities(id,email,name,password,state) VALUES('ttl-owner','ttl@synthetic.test','Synthetic TTL owner','no-login','active')");
 await cluster.admin.query("INSERT INTO fw_finance.workspaces(id,subject_id,tracking_start) VALUES('ttl-workspace','ttl-owner','2026-01-01')");
 await cluster.admin.query("INSERT INTO fw_finance.previews VALUES('ttl-workspace','expired','ttl-owner',0,'expired-digest',clock_timestamp()-interval '1 minute','{}'),('ttl-workspace','active','ttl-owner',0,'active-digest',clock_timestamp()+interval '1 hour','{}')");
 await worker.query('SELECT fw_control.purge_runtime_payloads()');
 assert.deepEqual((await cluster.admin.query('SELECT id FROM fw_finance.previews ORDER BY id')).rows,[{id:'active'}]);result.checks.push('Expired preview removed; active preview retained');
 await assert.rejects(cluster.admin.query("DELETE FROM fw_finance.previews WHERE id='active'"),(e:any)=>e.code==='23514'&&e.message==='IMMUTABLE_FINANCIAL_HISTORY');result.checks.push('Immutable trigger remains effective after cleanup');
 assert.equal((await worker.query("SELECT current_setting('session_replication_role') AS value")).rows[0].value,'origin');
 await assert.rejects(user.query('SELECT fw_control.purge_runtime_payloads()'),(e:any)=>e.code==='42501');
 await assert.rejects(worker.query("SET session_replication_role='replica'"),(e:any)=>e.code==='42501');result.checks.push('No trigger-bypass capability or cleanup port granted to client roles');
 await worker.query('SELECT fw_control.purge_runtime_payloads()');assert.equal((await cluster.admin.query('SELECT count(*)::integer AS n FROM fw_finance.previews')).rows[0].n,1);result.checks.push('Repeated cleanup is harmless');
 for(const file of ['database/runtime/012_expired_preview_retention.sql','src/runtime/migrate.ts','scripts/test-retention.ts'])result.source[file]=sha(await readFile(file));
 result.status='PASS';console.log('PASS '+result.checks.join('; '));
}catch(error){result.safeCode=/^[A-Z_]+$/.test((error as Error).message)?(error as Error).message:(error as any).code??'TEST_FAILED';process.exitCode=1;console.error(result.safeCode);}
finally{await worker.end();await user.end();await cluster.stop();result.clusterStopped=true;result.finishedAt=new Date().toISOString();const out=resolve('../docs/execution/evidence/completion-2026-11-03','retention-'+Date.now()+'.json');await mkdir(resolve(out,'..'),{recursive:true});await writeFile(out,JSON.stringify(result,null,2));console.log('Retention evidence: '+out);}
