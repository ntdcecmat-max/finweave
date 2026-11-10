import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');const base='docs/execution/evidence/db005-local-2026-10-09';
const sha=b=>createHash('sha256').update(b).digest('hex');
const candidates=[];
for(const d of await readdir(resolve(root,base),{withFileTypes:true}))if(d.isDirectory()){
 const p=`${base}/${d.name}/postgres-${d.name}.json`;
 try{const r=JSON.parse(await readFile(resolve(root,p),'utf8'));if(r.status==='PASS'&&r.sourceUnchangedDuringRun&&r.clusterStopped)candidates.push({p,r});}catch{}
}
let latest;
for(const c of candidates.sort((a,b)=>b.p.localeCompare(a.p))){
 let current=true;for(const [p,h] of Object.entries(c.r.source)){if(sha(await readFile(resolve(root,p)))!==h){current=false;break;}}
 if(current){latest=c;break;}
}
if(!latest)throw new Error('NO_PASS_EVIDENCE_FOR_CURRENT_SOURCE');
const directory=latest.p.slice(0,latest.p.lastIndexOf('/'));
const cases=JSON.parse(await readFile(resolve(root,directory,'cases.json'),'utf8'));
const diff=JSON.parse(await readFile(resolve(root,directory,'clean-schema-diff.json'),'utf8'));
const sql=JSON.parse(await readFile(resolve(root,directory,'executed-sql.json'),'utf8'));
const catalog=JSON.parse(await readFile(resolve(root,directory,'clean-catalog.json'),'utf8'));
const preserved=JSON.parse(await readFile(resolve(root,base,'handover-preservation-after.json'),'utf8'));
const result={id:'FW-DB005-LOCAL-REVIEW-001',date:'2026-10-09',runtimeChecks:'PASS',fullDb005Acceptance:'NOT_MET_SEE_REVIEW_GAPS',runtimeEvidence:latest.p,executedSql:`${directory}/executed-sql.json`,schemaDiffs:[`${directory}/clean-schema-diff.json`,`${directory}/upgrade-schema-diff.json`],cases:cases.length,passed:cases.filter(c=>c.status==='PASS').length,sqlStatements:sql.filter(s=>s.sql).length,postgres:latest.r.server,sourceStable:true,clusterStopped:true,domainTables:diff.domainTables,targetForeignKeys:diff.foreignKeys,infrastructureTables:diff.infrastructureTables,knownPhysicalTypeDifferences:diff.differences,actualIndexes:catalog.indexes.length,actualTriggers:catalog.triggers.length,actualPolicies:catalog.policies.length,historicalIntegrity:preserved.historicalMigrationIntegrity.map(x=>({id:x.id,pass:x.pass})),preservationFailures:preserved.preservation.filter(x=>!x.unchanged),report:'docs/data/local-foundation/DB005-LOCAL-REVIEW.md'};
if(result.preservationFailures.length||result.passed!==result.cases)throw new Error('EVIDENCE_OR_PRESERVATION_FAILED');
await writeFile(resolve(root,base,'latest-verified.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({cases:result.cases,passed:result.passed,evidence:latest.p,sqlStatements:result.sqlStatements,fullDb005Acceptance:result.fullDb005Acceptance}));
