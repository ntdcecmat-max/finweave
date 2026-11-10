import type { Pool, PoolClient, QueryResultRow } from 'pg';
import { ApiError } from './errors.ts';
export class Tx {
  private client:PoolClient;
  constructor(client: PoolClient) { this.client=client; }
  query<T extends QueryResultRow = QueryResultRow>(sql: string, values: unknown[] = []) { return this.client.query<T>(sql,values); }
  async one(sql: string, values: unknown[] = []) { return (await this.query(sql,values)).rows[0]; }
  async lock(scope: string) { await this.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[scope]); }
  async context(subject: string, workspace: string|null) { await this.query("SELECT set_config('fw.subject',$1,true),set_config('fw.workspace',$2,true)",[subject,workspace??'']); }
  async now(): Promise<number> { return Number((await this.one('SELECT extract(epoch FROM clock_timestamp())*1000 AS now'))!.now); }
}
export async function unitOfWork<T>(pool: Pool, work: (tx: Tx)=>Promise<T>,repeatableRead=false): Promise<T> {
  for(let attempt=0;;attempt++) {
    const client=await pool.connect(); let committing=false,broken=false;
    const connectionError=()=>{broken=true;};client.on('error',connectionError);
    try {
      await client.query(repeatableRead?'BEGIN ISOLATION LEVEL REPEATABLE READ':'BEGIN'); await client.query("SET LOCAL lock_timeout='5s'; SET LOCAL statement_timeout='15s'");
      const result=await work(new Tx(client)); committing=true; await client.query('COMMIT'); return result;
    } catch(e) {
      await client.query('ROLLBACK').catch(()=>{broken=true;});
      const code=(e as {code?:string}).code;
      if (!committing && ['40001','40P01'].includes(code??'') && attempt<2) continue;
      if(committing && !['40001','40P01','23514','23505'].includes(code??'')) {broken=true;throw new ApiError('OUTCOME_UNKNOWN',503,'unknown');}
      throw e;
    } finally { client.release(broken);client.removeListener('error',connectionError); }
  }
}
