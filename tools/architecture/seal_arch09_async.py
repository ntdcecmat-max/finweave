"""Validate/hashes documentation and evidence only; no frontend/DB/deploy actions."""
from pathlib import Path
import hashlib,json,re,subprocess,sys
R=Path(__file__).resolve().parents[2];E=R/'docs/execution/evidence/arch-09-async-2026-10-09'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
    current=json.loads((E/'current-documents.json').read_text(encoding='utf-8'))['files'];checks=[]
    for name in current:
      p=R/name;selected=[];active=False
      for line in p.read_text(encoding='utf-8').splitlines():
        if line.startswith('#'):active='ARCH-09' in line
        if active or 'ARCH-09' in line:selected.append(line)
      broken=[];count=0
      for target in re.findall(r'\]\(([^)]+)\)','\n'.join(selected)):
        if target.startswith(('http:','https:','#')):continue
        count+=1
        if not (p.parent/target.split('#')[0]).resolve().exists():broken.append(target)
      checks.append({'file':name,'sha256':sha(p),'hasArch09':bool(selected),'checkedScopedLinks':count,'brokenScopedLinks':broken})
    ok=len(checks)==25 and all(x['hasArch09'] and not x['brokenScopedLinks'] for x in checks)
    put(E/'document-sync-validation.json',{'date':'2026-10-09','status':'PASS' if ok else 'FAIL','scope':'25 current docs; only ARCH09 notice/sections scoped links, not all historical links','runtime':'NOT_RUN','files':checks})
    if not ok:raise SystemExit('Document sync failed')
    manifest=E/'artifact-manifest.json'
    if not manifest.exists():put(manifest,{'status':'UNSEALED'})
    subprocess.run([sys.executable,str(R/'tools/architecture/validate_arch09_async.py')],cwd=R,check=True)
    paths={R/n for n in current}
    for d in ['docs/async','docs/contracts/v2-t1-r4','docs/data/target-t1-async',E.relative_to(R).as_posix()]:
      paths.update(p for p in (R/d).rglob('*') if p.is_file() and p!=manifest)
    paths.update([R/'docs/architecture/ARCH-09-change-report.md',R/'docs/architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md'])
    paths.update((R/'tools/architecture').glob('*arch09*.py'))
    files={p.relative_to(R).as_posix():{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths)}
    put(manifest,{'artifactId':'FW-ARCH09-ASYNC-DESIGN-001','date':'2026-10-09','status':'DESIGN_ARTIFACTS_STATIC_VALIDATED',
      'apiRevision':'FW-API-T1-D1J2-004','databaseRevision':'FW-PHYS-T1-ASYNC-005','policy':'FW-ASYNC-J2-001',
      'scope':'ARCH09 design/tools/evidence; not handover baseline/released backend or runtime approval',
      'runtime':'NOT_RUN','selfHash':'Excluded; printed by sealing tool','fileCount':len(files),'files':files})
    assert all(sha(R/n)==v['sha256'] for n,v in files.items())
    print(json.dumps({'status':'SEALED_DESIGN_ONLY','files':len(files),'currentDocuments':len(checks),'manifestSha256':sha(manifest)}))
if __name__=='__main__':main()
