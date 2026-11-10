"""Static ARCH-04 documentation/preservation validation; no DB or runtime calls."""
from pathlib import Path
import csv
import hashlib
import json
import re
import subprocess
import sys
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[2]
TARGET=ROOT/'docs/data/target-t1'
EVIDENCE=ROOT/'docs/execution/evidence/arch-04-d1-j2-2026-10-08'

def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    checks=[]
    def check(name,ok,detail):
        checks.append(dict(check=name,status='PASS' if ok else 'FAIL',detail=detail))
    before=json.loads((EVIDENCE/'preservation-before.json').read_text(encoding='utf-8-sig'))['files']
    drift=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
    preservation=dict(status='PASS' if not drift else 'FAIL',protectedFiles=len(before),changed=drift,
                      files={p:sha(ROOT/p) if (ROOT/p).is_file() else None for p in before})
    (EVIDENCE/'preservation.json').write_text(json.dumps(preservation,indent=2)+'\n',encoding='utf-8')
    check('protected_inputs_unchanged',not drift,dict(count=len(before),changed=drift))
    generated=['target-model.json','table-inventory.csv','data-dictionary.md','erd.mmd','erd.md','operation-storage-overlay.csv']
    initial={p:sha(TARGET/p) for p in generated}
    run=subprocess.run([sys.executable,str(ROOT/'tools/architecture/build_arch04_target.py')],capture_output=True,text=True)
    check('generator_succeeds',run.returncode==0,dict(stdout=run.stdout.strip(),stderr=run.stderr.strip()))
    check('generated_artifacts_deterministic',all(sha(TARGET/p)==h for p,h in initial.items()),generated)
    m=json.loads((TARGET/'target-model.json').read_text(encoding='utf-8'))
    base=json.loads((ROOT/'docs/data/physical/physical-model.json').read_text(encoding='utf-8-sig'))
    names={t['name'] for t in m['tables']}
    bm={t['name']:t for t in base['tables']}
    tm={t['name']:t for t in m['tables']}
    check('baseline_table_identities_preserved',set(bm)<=names,dict(baseline=len(bm),target=len(names)))
    check('new_table_inventory',len(names)==len(m['tables'])==70 and len(names-set(bm))==16,sorted(names-set(bm)))
    check('expand_column_inventory',sum(len(t['columns']) for t in m['tables'])==782,'782 expand columns, legacy columns retained')
    check('unique_columns_and_owners',all(len({c['name'] for c in t['columns']})==len(t['columns']) and t['owner'] for t in m['tables']),'All70 tables')
    inherited=all(all(any(x['name']==c['name'] and x.get('baselineDeclaration')==c['sql'] for x in tm[n]['columns']) for c in t['columns']) for n,t in bm.items())
    check('all_610_baseline_declarations_preserved',inherited,'Changes are explicit contract-phase design, not silent baseline rewrites')
    fks=m['foreignKeys']
    fkvalid=True
    for fk in fks:
        fkvalid &= len(fk['columns'])==len(fk['targetColumns'])
        fkvalid &= set(fk['columns']) <= {c['name'] for c in tm[fk['table']]['columns']}
        fkvalid &= set(fk['targetColumns']) <= {c['name'] for c in tm[fk['target']]['columns']}
        if tm[fk['table']]['tenant'] and tm[fk['target']]['tenant']:
            fkvalid &= 'workspace_id' in fk['columns'] and 'workspace_id' in fk['targetColumns']
    check('FK_column_and_tenant_metadata',fkvalid,dict(targetFKs=len(fks),baselineFKs=sum(x['origin'].startswith('baseline') for x in fks)))
    check('all_110_baseline_FKs_included',sum(x['origin'].startswith('baseline') for x in fks)==110,'Inline global, tenant and late ALTER FKs included')
    erd=(TARGET/'erd.mmd').read_text(encoding='utf-8')
    erdnodes=set(re.findall(r'^    (\w+) \{',erd,re.M))
    check('ERD_entity_and_FK_coverage',erdnodes==names and len(re.findall(r'--',erd))==len(fks),'70 nodes /141 edges; rendering and DB catalog parity NOT RUN')
    rows=list(csv.DictReader((TARGET/'table-inventory.csv').open(encoding='utf-8')))
    check('table_CSV_parity',{r['table'] for r in rows}==names and len(rows)==70,'One owner per table')
    dictionary=(TARGET/'data-dictionary.md').read_text(encoding='utf-8')
    check('dictionary_table_and_column_coverage',len(re.findall(r'^## ',dictionary,re.M))==70 and len(re.findall(r'^\| [a-z][a-z0-9_]* \|',dictionary,re.M))==782,'Full expand inventory, excludes Markdown separators and headers; baseline meanings labeled as inherited')
    ops=list(csv.DictReader((ROOT/'docs/contracts/v2/operation-inventory.csv').open(encoding='utf-8-sig')))
    overlay=list(csv.DictReader((TARGET/'operation-storage-overlay.csv').open(encoding='utf-8')))
    check('operation_overlay_133_exact_IDs',len(overlay)==133 and {r['operation'] for r in overlay}=={r['operation'] for r in ops},'Dependency design only; no field/query/consumer conformance claimed')
    check('overlay_dependencies_exist',all(set(filter(None,(r['baselineTables']+','+r['targetAdditionalDependencies']).split(',')))<=names for r in overlay),'All declared dependencies name known target tables')
    dispositions=list(csv.DictReader((TARGET/'finding-disposition.csv').open(encoding='utf-8')))
    check('17_findings_not_falsely_closed',len(dispositions)==17 and {r['finding'] for r in dispositions}=={'DB04-F%02d'%i for i in range(1,18)} and all('NOT_RUN' in r['status'] for r in dispositions),'Design specified, no SQL/runtime PASS')
    check('queue_has_no_JSON_payload',all(c['type']!='jsonb' for t in m['tables'] if t['name'] in {'jobs','job_attempts','scheduler_state'} for c in t['columns']),'Typed domain reference; authorized owner fetch required')
    newdocs=list(TARGET.glob('*.md'))+[ROOT/'docs/architecture/adr/ADR-011-evolving-schema-and-shared-jobs.md',ROOT/'docs/architecture/ARCH-04-change-report.md']
    broken=[]; links=0
    for p in newdocs:
        for ref in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            ref=ref.strip('<>')
            if re.match(r'\w+://',ref) or ref.startswith('#'):
                continue
            dest=(p.parent/unquote(ref.split('#')[0])).resolve()
            links+=1
            if not dest.exists() and dest != (EVIDENCE/'validation.json').resolve():
                broken.append(dict(file=str(p.relative_to(ROOT)),link=ref))
    check('new_document_local_links',not broken,dict(checked=links,broken=broken))
    agenda=(ROOT/'docs/architecture/architecture-decision-agenda.md').read_text(encoding='utf-8')
    options=(ROOT/'docs/architecture/ARCH-04-options.md').read_text(encoding='utf-8')
    check('owner_decision_recorded','ARCH-04 ACCEPTED D1 + J2' in agenda and 'ACCEPTED BY OWNER: D1 + J2' in options,'D1 + J2; ARCH-05…13 pending')
    # Verify protected bytes again after generator; docs generation must never mutate inputs.
    finaldrift=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
    check('generator_keeps_protected_inputs',not finaldrift,dict(protected=len(before),changed=finaldrift))
    result=dict(status='PASS_STATIC_DOCUMENTATION' if all(c['status']=='PASS' for c in checks) else 'FAIL',
                designDecision='D1 + J2',checks=checks,
                notRun=['SQL004+ implementation/execution','RLS/grants/procedure execution','Domain/concurrency/queue correctness','Migration upgrade/rollback/backup/restore','API field/consumer conformance','Mermaid visual render','Backend/native/security/UAT'],
                artifactHashes={str(p.relative_to(ROOT)):sha(p) for p in sorted(TARGET.iterdir()) if p.is_file()})
    (EVIDENCE/'validation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(dict(status=result['status'],checks=len(checks),passed=sum(c['status']=='PASS' for c in checks),failed=[c['check'] for c in checks if c['status']!='PASS'],protected=len(before)),ensure_ascii=True))
    return 0 if result['status']=='PASS_STATIC_DOCUMENTATION' else 1

if __name__=='__main__':
    raise SystemExit(main())
