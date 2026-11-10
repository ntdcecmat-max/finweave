import type { Pool } from 'pg';
import { token,digest } from './crypto.ts';
import { unitOfWork } from './uow.ts';
// Privileged host port. Excluded from application/Ops grants and HTTP surface.
export async function beginErasure(pool:Pool,subject:string,pepper:Buffer) {
  return unitOfWork(pool,async tx=>{
    await tx.query('SELECT * FROM fw_control.state FOR UPDATE');
    const prior=await tx.one('SELECT * FROM fw_control.erasures WHERE subject_id=$1',[subject]);if(prior)return prior;
    const identity=await tx.one('SELECT * FROM fw_auth.identities WHERE id=$1 FOR UPDATE',[subject]);if(!identity)throw Error('ERASURE_SUBJECT_UNKNOWN');
    const workspaces=(await tx.query('SELECT id FROM fw_finance.workspaces WHERE subject_id=$1',[subject])).rows.map(x=>x.id);
    const sessions=(await tx.query('SELECT id FROM fw_auth.sessions WHERE subject_id=$1',[subject])).rows.map(x=>x.id);
    const devices=(await tx.query('SELECT id FROM fw_auth.devices WHERE subject_id=$1',[subject])).rows.map(x=>x.id);
    const jobs=(await tx.query('SELECT id FROM fw_dispatch.jobs WHERE subject_id=$1',[subject])).rows.map(x=>x.id);
    const objects=(await tx.query('SELECT object_oid FROM fw_control.private_objects WHERE subject_id=$1',[subject])).rows.map(x=>x.object_oid);
    const authRefs=[...sessions,...devices];
    for(const query of [
      'SELECT id AS ref FROM fw_auth.challenges WHERE subject_id=$1',
      'SELECT digest AS ref FROM fw_auth.resets WHERE subject_id=$1',
      'SELECT secret_digest AS ref FROM fw_auth.sessions WHERE subject_id=$1',
      'SELECT digest AS ref FROM fw_auth.refresh_tokens WHERE session_id=ANY($1::text[])',
      'SELECT digest AS ref FROM fw_auth.browser_rotations WHERE session_id=ANY($1::text[])',
      'SELECT digest AS ref FROM fw_auth.collectors WHERE device_id=ANY($1::text[])'
    ])authRefs.push(...(await tx.query(query,[query.includes('ANY')?(query.includes('device_id')?devices:sessions):subject])).rows.map(x=>x.ref));
    authRefs.push(digest(pepper,'email',identity.email));
    const authScopes=(await tx.query("SELECT DISTINCT scope FROM fw_auth.replays WHERE split_part(scope,':',2)=ANY($1::text[])",[authRefs])).rows.map(x=>x.scope);
    const denyId=token();await tx.query("UPDATE fw_auth.identities SET state='erased',epoch=epoch+1 WHERE id=$1",[subject]);
    await tx.query('UPDATE fw_finance.workspaces SET blocked=true WHERE subject_id=$1',[subject]);
    await tx.query('UPDATE fw_auth.sessions SET revoked=true WHERE subject_id=$1',[subject]);
    await tx.query('UPDATE fw_auth.devices SET revoked=true,epoch=epoch+1 WHERE subject_id=$1',[subject]);
    await tx.query("INSERT INTO fw_control.denies(id,subject_id,epoch,kind) VALUES($1,$2,$3,'erase')",[denyId,subject,identity.epoch+1]);
    return tx.one('INSERT INTO fw_control.erasures(subject_id,deny_id,children) VALUES($1,$2,$3) RETURNING *',[subject,denyId,{workspaces,sessions,devices,jobs,authScopes,authRefs,objects}]);
  });
}
async function scopedTables(pool:Pool,subject:string) {
  const request=(await pool.query('SELECT * FROM fw_control.erasures WHERE subject_id=$1',[subject])).rows[0];if(!request)throw Error('ERASURE_REQUEST_REQUIRED');
  const rows=(await pool.query("SELECT c.table_schema,c.table_name,array_agg(c.column_name::text) AS columns FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name AND t.table_type='BASE TABLE' WHERE c.table_schema IN('fw_auth','fw_finance','fw_dispatch','fw_async','fw_business','fw_assistant','fw_ops_private') GROUP BY c.table_schema,c.table_name ORDER BY c.table_schema,c.table_name")).rows;
  return {request,tables:rows.map(t=>{
    if(!/^[a-z0-9_]+$/.test(t.table_schema+t.table_name))throw Error('ERASURE_IDENTIFIER_INVALID');
    const cols=t.columns as string[],conditions:string[]=[],args:unknown[]=[];
    const add=(column:string,value:unknown)=>{args.push(value);conditions.push(`"${column}"=ANY($${args.length}::text[])`);};
    if(cols.includes('workspace_id'))add('workspace_id',request.children.workspaces);
    if(cols.includes('subject_id')&&t.table_schema!=='fw_ops')add('subject_id',[subject]);
    if(cols.includes('session_id'))add('session_id',request.children.sessions);
    if(cols.includes('device_id'))add('device_id',request.children.devices);
    if(cols.includes('job_id'))add('job_id',request.children.jobs);
    if(t.table_schema==='fw_auth'&&t.table_name==='nonces')add('principal',request.children.authRefs);
    if(t.table_schema==='fw_auth'&&t.table_name==='replays')add('scope',request.children.authScopes);
    if(t.table_schema==='fw_ops_private'&&t.table_name==='refs'){add('scope',request.children.workspaces);add('private_id',[subject,...request.children.workspaces,...request.children.devices,...request.children.jobs]);}
    if(t.table_schema==='fw_auth'&&t.table_name==='identities')add('id',[subject]);
    return {name:`"${t.table_schema}"."${t.table_name}"`,condition:conditions.join(' OR '),args};
  }).filter(t=>t.condition)};
}
export async function purgeActiveSynthetic(pool:Pool,subject:string) {
  const {request,tables}=await scopedTables(pool,subject);
  return unitOfWork(pool,async tx=>{
    await tx.query('SELECT * FROM fw_control.state FOR UPDATE');
    // Only synthetic privileged erasure: bypass immutable-history and FK triggers for
    // this transaction after freezing the complete subject graph. No runtime grant.
    await tx.query("SET LOCAL session_replication_role='replica'");
    for(const t of tables)await tx.query(`DELETE FROM ${t.name} WHERE ${t.condition}`,t.args);
    for(const oid of request.children.objects)await tx.query('SELECT lo_unlink($1)',[oid]);
    await tx.query('DELETE FROM fw_control.private_objects WHERE subject_id=$1',[subject]);
    for(const schema of ['fw_auth','fw_ops']) {
      // User auth replays have subject scope; Ops is a separate identity namespace.
      if(schema==='fw_auth')await tx.query('DELETE FROM fw_auth.replays WHERE scope=$1',[subject]);
    }
    await tx.query('UPDATE fw_control.erasures SET active_purged_at=clock_timestamp() WHERE subject_id=$1',[subject]);
    return {tables:tables.length};
  });
}
export async function verifyActivePurge(pool:Pool,subject:string) {
  const {request,tables}=await scopedTables(pool,subject);let residual=0;
  for(const t of tables)residual+=Number((await pool.query(`SELECT count(*) AS n FROM ${t.name} WHERE ${t.condition}`,t.args)).rows[0].n);
  residual+=Number((await pool.query('SELECT count(*) AS n FROM fw_auth.replays WHERE scope=$1',[subject])).rows[0].n);
  residual+=Number((await pool.query('SELECT count(*) AS n FROM pg_largeobject_metadata WHERE oid=ANY($1::oid[])',[request.children.objects])).rows[0].n);
  return {residual,deadline:request.deadline,deadlineBreached:new Date(request.deadline).getTime()<=Date.now(),completion:'PENDING_COPY_INVENTORY_AND_WITNESS',physicalMediaErasure:false};
}
