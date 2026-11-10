import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const root=resolve(import.meta.dirname,'../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const output=resolve(root,'docs/execution/evidence/db005-local-2026-10-09');await mkdir(output,{recursive:true});
const files={};
async function inventory(path){for(const e of await readdir(resolve(root,path),{withFileTypes:true})){if(['node_modules','.local','.git','__pycache__'].includes(e.name))continue;const p=path+'/'+e.name;if(e.isDirectory())await inventory(p);else{const b=await readFile(resolve(root,p));files[p]={bytes:b.length,sha256:hash(b)};}}}
for(const p of ['docs/data/physical','docs/data/target-t1','docs/data/target-t1-auth','docs/data/target-t1-security','docs/data/target-t1-domain','docs/data/target-t1-async','docs/data/local-foundation','docs/handover','docs/operations','finweave-web','docs/governance/baselines/FW-HANDOVER-20261008-r1','docs/governance/baselines/FW-HANDOVER-20261008-r2'])await inventory(p);
const original=JSON.parse(await readFile(resolve(root,'finweave-backend/database/manifest.json'),'utf8'));
const integrity=original.migrations.map(m=>({...m,actual:hashFrom(m.path),pass:hashFrom(m.path)===m.sha256}));
function hashFrom(p){return files[p]?.sha256;}
//004 lives outside the inventoried design tree, but its original manifest remains authority.
for(const entry of integrity)if(!entry.actual){entry.actual=hash(await readFile(resolve(root,entry.path)));entry.pass=entry.actual===entry.sha256;}
const models=[];
for(const p of ['docs/data/physical/physical-model.json','docs/data/target-t1/target-model.json','docs/data/target-t1-auth/target-model.json','docs/data/target-t1-security/target-model.json','docs/data/target-t1-domain/target-model.json','docs/data/target-t1-async/target-model.json']){const m=JSON.parse(await readFile(resolve(root,p),'utf8'));models.push({path:p,sha256:files[p].sha256,id:m.id,tables:m.tables.length,columns:m.tables.reduce((s,t)=>s+t.columns.length,0),foreignKeys:m.foreignKeys?.length??null,designStatus:m.status});}
const required=['migration-plan.md','data-dictionary.md','target-model.json'];
const completeness=models.filter(m=>!m.path.includes('/physical/')).map(m=>({package:m.path.slice(0,m.path.lastIndexOf('/')),required:required.map(n=>({name:n,present:!!files[m.path.replace('target-model.json',n)]}))}));
const previousPath=resolve(output,'handover-inventory.json');let before;try{before=JSON.parse(await readFile(previousPath,'utf8'));}catch{}
const preservation=before?Object.entries(before.files).filter(([p])=>p.startsWith('finweave-web/')||p.startsWith('docs/data/')||p.startsWith('docs/governance/baselines/')).map(([p,f])=>({path:p,unchanged:f.sha256===files[p]?.sha256})):[];
const result={scope:'HANDOVER_FILES_AND_IMMUTABLE_INPUTS_NOT_RUNTIME_ACCEPTANCE',capturedAt:new Date().toISOString(),historicalMigrationIntegrity:integrity,models,completeness,preservation,files};
if(integrity.some(x=>!x.pass)||preservation.some(x=>!x.unchanged))process.exitCode=1;
await writeFile(resolve(output,before?'handover-preservation-after.json':'handover-inventory.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({historicalMigrationIntegrity:integrity.map(x=>({id:x.id,pass:x.pass})),models,files:Object.keys(files).length,preservationFailures:preservation.filter(x=>!x.unchanged)}));
