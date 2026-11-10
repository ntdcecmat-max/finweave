import assert from 'node:assert/strict';
import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {sha} from '../src/runtime/crypto.ts';
const base='../docs/execution/evidence',agentDir=base+'/backend-agent-runtime-2026-10-11';
const latest=(folder:string,pattern:RegExp)=>resolve(folder,readdirSync(folder).filter(x=>pattern.test(x)).sort().at(-1)!);
const paths={assistant:latest(base+'/backend-assistant-local-2026-10-11',/^assistant-\d+\.json$/),business:latest(base+'/backend-business-local-2026-10-10',/^business-\d+\.json$/),checks:latest(base+'/backend-business-local-2026-10-10',/^checks-\d+\.json$/),evaluation:latest(agentDir,/^evaluation-\d+\.json$/)};
const records=Object.fromEntries(Object.entries(paths).map(([name,path])=>[name,JSON.parse(readFileSync(path,'utf8'))]));
for(const [name,e]of Object.entries(records)){
 assert.equal(e.status,name==='evaluation'?'MEASURED':'PASS');
 for(const [path,digest]of Object.entries(e.source))assert.equal(sha(readFileSync(path)),digest,'STALE '+name+': '+path);
}
assert(records.assistant.clusterStopped&&records.business.clusterStopped);
assert(records.checks.checks.every((c:any)=>c.status==='PASS'));
const evaluation=records.evaluation,split=JSON.parse(readFileSync(evaluation.split,'utf8'));
assert.equal(split.freezeDigest,sha(readFileSync(evaluation.freeze)));assert.equal(split.digest,evaluation.heldout.digest);assert.equal(split.publicCasesBlind,false);assert(split.instances>=10);assert.equal(split.tunedAfterGeneration,false);
assert.equal(evaluation.publicSpecifications.length,30);assert(evaluation.publicSpecifications.every((c:any)=>!c.blind));assert(evaluation.outcomes.every((c:any)=>c.actualAndActiveUnchanged&&c.modelCalls===0&&c.modelTokens===0));
const percentile=(x:number[],p:number)=>x.sort((a,b)=>a-b)[Math.ceil(x.length*p)-1];
const measurements=records.assistant.measurements.filter((m:any)=>m.status<300),groups:any[]=[];
for(const operation of [...new Set<string>(measurements.map((m:any)=>m.operation))]){const rows=measurements.filter((m:any)=>m.operation===operation);groups.push({operation,samples:rows.length,p50Ms:percentile(rows.map((m:any)=>m.latencyMs),.5),p95Ms:percentile(rows.map((m:any)=>m.latencyMs),.95)});}
const summary={status:'LOCAL_RUNTIME_EVIDENCE_VERIFIED_NOT_FULL_MODEL_UAT',at:new Date().toISOString(),verifierHash:sha(readFileSync('scripts/verify-agent-evidence.ts')),paths,digests:Object.fromEntries(Object.entries(paths).map(([k,p])=>[k,sha(readFileSync(p))])),integrationGroups:records.assistant.results.length,businessRegressionGroups:records.business.results.length,unitTests:Number(records.checks.checks.find((c:any)=>c.id==='unit').stdout.match(/tests (\d+)/)?.[1]),benefit:evaluation.benefit,computeSummary:evaluation.summary,apiLatency:{scope:'Fastify injection + real PostgreSQL; not network, worker end-to-end or owner time',groups},model:{status:'UNPINNED_NOT_RUN',fallback:'deterministic; scripted UI remains scripted_mock',paidOrHostedFallback:false},heldout:{instances:split.instances,digest:split.digest,protocol:'separate process after freeze; generator authored by implementer, independent human blind review not run'}};
const path=resolve(agentDir,'verification-'+Date.now()+'.json');writeFileSync(path,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({path,status:summary.status,groups:summary.integrationGroups,units:summary.unitTests,benefit:summary.benefit.gate}));
