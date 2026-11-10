import assert from 'node:assert/strict';
import { readFile,readdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Ajv } from 'ajv';
import formats from 'ajv-formats';
import { sha } from '../src/runtime/crypto.ts';
import { contract } from '../src/runtime/contracts.ts';
const dir=resolve('../docs/execution/evidence/backend-finance-local-2026-10-09');
const candidates=(await readdir(dir)).filter(x=>/^finance-\d+\.json$/.test(x)).sort().reverse();let evidence:any,name='';
for(const candidate of candidates){const e=JSON.parse(await readFile(resolve(dir,candidate),'utf8'));if(e.status==='PASS'){evidence=e;name=candidate;break;}}
assert(evidence,'FINANCE_PASS_EVIDENCE_REQUIRED');
for(const [file,expected] of Object.entries(evidence.source))assert.equal(sha(await readFile(resolve(file))),expected,'SOURCE_DRIFT:'+file);
const path=resolve('../docs/contracts/local-finance/openapi.json'),bytes=await readFile(path),subset=JSON.parse(bytes.toString()),policy=JSON.parse(await readFile(resolve('../docs/contracts/local-finance/runtime-policy.json'),'utf8'));
assert.equal(sha(bytes),policy.subsetSha256);const ajv=new Ajv({strict:false});(formats as unknown as (a:Ajv)=>void)(ajv);ajv.addSchema({$id:'finance-local',components:subset.components});
for(const [p,v] of Object.entries(subset.paths) as [string,any][]){assert.deepEqual(v,contract.paths[p]);for(const suffix of ['Request','Reply'])ajv.compile({$ref:'finance-local#/components/schemas/'+v.post.operationId+suffix});}
const audit={status:'PASS',verifiedAt:new Date().toISOString(),financeEvidence:name,sourceHashesVerified:Object.keys(evidence.source).length,oracleActionCount:evidence.results.oracleActionCount,groups:evidence.results.groups.length,openapiOperations:Object.keys(subset.paths).length,openapiSchemas:Object.keys(subset.components.schemas).length,openapiSha256:sha(bytes),toolSha256:sha(await readFile('scripts/verify-finance-evidence.ts'))};
const auditPath=resolve(dir,'source-contract-audit-'+Date.now()+'.json');await writeFile(auditPath,JSON.stringify(audit,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({...audit,evidence:auditPath}));
