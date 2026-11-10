import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {root,sha256} from '../src/pins.ts';
const foundation=JSON.parse(await readFile(resolve(root,'finweave-backend/database/manifest.json'),'utf8'));
const migrations=[...foundation.migrations];
for(const [id,name] of [['005','expand'],['006','backfill_infrastructure'],['007','constraints'],['008','guards_and_capabilities']] ){
 const path=`finweave-backend/database/db005/${id}_${name}.sql`;
 migrations.push({id,path,sha256:sha256(await readFile(resolve(root,path)))});
}
for(const [id,name,definition] of [
 ['009','db005_due',"CREATE INDEX db005_due ON fw.jobs USING btree (job_type, next_attempt_at, created_at, workspace_id, id) WHERE (state = 'queued'::text)"],
 ['010','db005_reaper',"CREATE INDEX db005_reaper ON fw.jobs USING btree (lease_until, workspace_id, id) WHERE (state = 'running'::text)"],
 ['011','db005_quota',"CREATE UNIQUE INDEX db005_quota ON fw.provider_quota_buckets USING btree (namespace_digest, window_start, window_end)"]
]){
 const path=`finweave-backend/database/db005/${id}_${name}.sql`;
 const sql=definition.replace('CREATE UNIQUE INDEX ','CREATE UNIQUE INDEX CONCURRENTLY ').replace(/^CREATE INDEX /,'CREATE INDEX CONCURRENTLY ')+';\n';
 await writeFile(resolve(root,path),sql);
 migrations.push({id,path,sha256:sha256(sql),concurrentIndex:{name:`fw.${name}`,definition}});
}
await writeFile(resolve(root,'finweave-backend/database/db005-manifest.json'),JSON.stringify({revision:'FW-DB005-LOCAL-001',targetRevision:foundation.targetRevision,status:'EXECUTABLE_LOCAL_REQUIRES_SEMANTIC_REVIEW',migrations},null,2)+'\n');
const registryBytes=await readFile(resolve(root,'docs/async/job-registry.json'));
const registry=JSON.parse(registryBytes.toString());
const roles:Record<string,string>={IngestionWorker:'fw_ingestion',MarketWorker:'fw_market',ImportWorker:'fw_import',AgentWorker:'fw_agent',ForecastWorker:'fw_forecast'};
const quote=(s:string)=>"'"+s.replaceAll("'","''")+"'";
const registrySql=`-- Pinned registry SHA256 ${sha256(registryBytes)}. Trusted static SQL only.\nBEGIN;\nCREATE TABLE fw_infra.job_registry(job_type text PRIMARY KEY,domain_kind text NOT NULL,domain_table text NOT NULL,worker_role text NOT NULL,policy_version text NOT NULL,lease_seconds integer NOT NULL,attempts_max integer NOT NULL,deadline_seconds integer NOT NULL,concurrency_max integer NOT NULL);\nINSERT INTO fw_infra.job_registry VALUES\n${registry.jobs.map((j:any)=>'('+[j.jobType,j.domainKind,j.domainTable,roles[j.workerProfile],j.policyVersion].map(quote).concat([j.leaseSeconds,j.automaticAttemptsMax,j.deadlineFromCreatedSeconds,j.profileConcurrencyMax].map(String)).join(',')+')').join(',\n')};\nCREATE TRIGGER registry_immutable BEFORE UPDATE OR DELETE OR TRUNCATE ON fw_infra.job_registry FOR EACH STATEMENT EXECUTE FUNCTION fw_infra.deny_journal_mutation();\nREVOKE ALL ON fw_infra.job_registry FROM PUBLIC;\nCOMMIT;\n`;
await writeFile(resolve(root,'finweave-backend/database/db005/013_job_registry.sql'),registrySql);
for(const [id,name] of [['012','domain_ports'],['013','job_registry'],['014','job_ticket_ports']]){
 const path=`finweave-backend/database/db005/${id}_${name}.sql`;
 migrations.push({id,path,sha256:sha256(await readFile(resolve(root,path)))});
}
await writeFile(resolve(root,'finweave-backend/database/db005-manifest.json'),JSON.stringify({revision:'FW-DB005-LOCAL-001',targetRevision:foundation.targetRevision,status:'EXECUTABLE_LOCAL_REQUIRES_SEMANTIC_REVIEW',migrations},null,2)+'\n');
console.log(JSON.stringify({migrations:migrations.length}));
