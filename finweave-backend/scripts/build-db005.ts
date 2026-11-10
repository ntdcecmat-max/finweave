import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { root, sha256 } from '../src/pins.ts';

// Generates additive DDL only. Never regenerates a historical migration or target package.
const model = JSON.parse(await readFile(resolve(root,'docs/data/target-t1-async/target-model.json'),'utf8'));
const baseline = JSON.parse(await readFile(resolve(root,'docs/data/physical/physical-model.json'),'utf8'));
const dir=resolve(root,'finweave-backend/database/db005');
await mkdir(dir,{recursive:true});
const q=(s:string)=>'"'+s.replaceAll('"','""')+'"';
const table=(s:string)=>s==='migration_journal'?'fw_infra.migration_journal':`fw.${q(s)}`;
const old=new Map(baseline.tables.map((t:any)=>[t.name,t]));
const expand=['-- DB005 additive expand. Existing added fields stay nullable until verified backfill.','BEGIN;'];
const constraints=['-- DB005 structural constraints. Missing provenance aborts; no guessed backfill.','BEGIN;'];
const semantic:any[]=[];
for(const t of model.tables){
  const inherited:any=old.get(t.name);
  if(t.name==='migration_journal') continue;
  if(!inherited){
    expand.push(`CREATE TABLE ${table(t.name)} (\n${t.columns.map((c:any)=>'  '+q(c.name)+' '+c.type+(c.nullable?'':' NOT NULL')+(c.name==='created_at'||c.name==='updated_at'?' DEFAULT clock_timestamp()':'')).join(',\n')}\n);`);
    for(const rule of t.rules){
      const match=rule.match(/^(?:PK|PRIMARY KEY)\s*\(([^)]+)\)$/i);
      const unique=rule.match(/^UNIQUE\s*(NULLS NOT DISTINCT)?\s*\(([^)]+)\)$/i);
      if(match) expand.push(`ALTER TABLE ${table(t.name)} ADD PRIMARY KEY (${match[1]});`);
      else if(unique && !(t.name==='recovery_journal')) expand.push(`ALTER TABLE ${table(t.name)} ADD UNIQUE ${unique[1]||''} (${unique[2]});`);
      else semantic.push({table:t.name,rule});
    }
    expand.push(`ALTER TABLE ${table(t.name)} ENABLE ROW LEVEL SECURITY; ALTER TABLE ${table(t.name)} FORCE ROW LEVEL SECURITY;`);
  }else{
    for(const c of t.columns.filter((c:any)=>!inherited.columns.some((b:any)=>b.name===c.name))){
      if(t.name==='entry_groups') continue; // already implemented in immutable historical004
      expand.push(`ALTER TABLE ${table(t.name)} ADD COLUMN ${q(c.name)} ${c.type};`);
      if(!c.nullable) constraints.push(`ALTER TABLE ${table(t.name)} ALTER COLUMN ${q(c.name)} SET NOT NULL;`);
    }
  }
  for(const rule of t.targetRules||[]) semantic.push({table:t.name,rule});
}
expand.push('ALTER DEFAULT PRIVILEGES IN SCHEMA fw REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;','REVOKE ALL ON ALL TABLES IN SCHEMA fw FROM PUBLIC;','COMMIT;');
constraints.push('ALTER TABLE fw.sessions ADD UNIQUE(id,subject_id);','ALTER TABLE fw.admin_sessions ADD UNIQUE(id,principal_id);');
for(const [i,f] of model.foreignKeys.entries()){
  if((f.origin||'').startsWith('baseline')) continue;
  constraints.push(`ALTER TABLE ${table(f.table)} ADD CONSTRAINT db005_fk_${i} FOREIGN KEY (${f.columns.join(',')}) REFERENCES ${table(f.target)} (${f.targetColumns.join(',')}) DEFERRABLE INITIALLY DEFERRED NOT VALID;`);
  constraints.push(`ALTER TABLE ${table(f.table)} VALIDATE CONSTRAINT db005_fk_${i};`);
}
// Guards reject coercion before validation, matching004's integer-money correction.
for(const t of model.tables){
  for(const c of t.columns){
    if(/^numeric\(/.test(c.type)){
      const [,p,s]=c.type.match(/^numeric\((\d+),(\d+)\)$/)!;
      if(p==='18'&&s==='0'&&old.has(t.name)) continue;
      constraints.push(`ALTER TABLE ${table(t.name)} ALTER COLUMN ${q(c.name)} TYPE numeric;`);
      constraints.push(`ALTER TABLE ${table(t.name)} ADD CONSTRAINT db005_exact_${c.name} CHECK (${q(c.name)} NOT IN ('NaN'::numeric,'Infinity'::numeric,'-Infinity'::numeric) AND ${q(c.name)}=trunc(${q(c.name)},${s}) AND abs(${q(c.name)}) < power(10::numeric,${Number(p)-Number(s)}));`);
    }
    if(c.type==='bigint') constraints.push(`ALTER TABLE ${table(t.name)} ADD CONSTRAINT db005_safe_${c.name} CHECK (${q(c.name)} BETWEEN ${c.name==='version'||c.name==='financial_version'||c.name==='revision_no'||c.name==='plan_item_version'?1:0} AND 9007199254740991);`);
    if(c.type==='jsonb'&&!c.baselineDeclaration) constraints.push(`ALTER TABLE ${table(t.name)} ADD CONSTRAINT db005_bytes_${c.name} CHECK (octet_length(${q(c.name)}::text)<=${c.name==='event_body'?8192:262144});`);
  }
}
constraints.push('COMMIT;');
await writeFile(resolve(dir,'005_expand.sql'),expand.join('\n')+'\n');
await writeFile(resolve(dir,'007_constraints.sql'),constraints.join('\n')+'\n');
await writeFile(resolve(dir,'semantic-inventory.json'),JSON.stringify(semantic,null,2)+'\n');
console.log(JSON.stringify({model:sha256(await readFile(resolve(root,'docs/data/target-t1-async/target-model.json'))),tables:model.tables.length,semanticRules:semantic.length}));
