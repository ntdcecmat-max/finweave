"""Validate and hash ARCH-08 documentation only; no runtime or earlier-package writes."""
from pathlib import Path
import hashlib,json,re,subprocess,sys

R=Path(__file__).resolve().parents[2]
E=R/'docs/execution/evidence/arch-08-domain-2026-10-09'

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    current=json.loads((E/'current-documents.json').read_text(encoding='utf-8'))['files']
    checks=[]
    # Only the new notice/sections are checked here; inherited historical links
    # are not silently reported as reviewed or fixed.
    for name in current:
        p=R/name;text=p.read_text(encoding='utf-8');lines=text.splitlines();selected=[];active=False
        for line in lines:
            if line.startswith('#'):
                active='ARCH-08' in line or 'V13' in line
            if active or 'ARCH-08' in line:selected.append(line)
        links=[];broken=[]
        for target in re.findall(r'\]\(([^)]+)\)','\n'.join(selected)):
            if target.startswith(('https:','http:','#')):continue
            links.append(target)
            if not (p.parent/target.split('#')[0]).resolve().exists():broken.append(target)
        checks.append({'file':name,'sha256':sha(p),'hasArch08':bool(selected),
                       'checkedScopedLinks':len(links),'brokenScopedLinks':broken})
    ok=len(checks)==22 and all(c['hasArch08'] and not c['brokenScopedLinks'] for c in checks)
    put(E/'document-sync-validation.json',{'date':'2026-10-09','status':'PASS' if ok else 'FAIL',
        'scope':'22 current overview documents; only new ARCH-08 notice/sections and V13 links',
        'runtime':'NOT_RUN','files':checks})
    if not ok:raise SystemExit('Document synchronization check failed')
    manifest=E/'artifact-manifest.json'
    if not manifest.exists():put(manifest,{'status':'UNSEALED'})
    subprocess.run([sys.executable,str(R/'tools/architecture/validate_arch08_domain.py')],cwd=R,check=True)
    paths={R/n for n in current}
    for directory in ['docs/domain','docs/contracts/v2-t1-r3','docs/data/target-t1-domain',str(E.relative_to(R))]:
        paths.update(p for p in (R/directory).rglob('*') if p.is_file() and p!=manifest)
    paths.update([R/'docs/architecture/ARCH-08-change-report.md',
        R/'docs/architecture/adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md'])
    paths.update((R/'tools/architecture').glob('*arch08*.py'))
    files={p.relative_to(R).as_posix():{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths)}
    put(manifest,{'artifactId':'FW-ARCH08-DOMAIN-DESIGN-001','date':'2026-10-09',
        'status':'DESIGN_ARTIFACTS_STATIC_VALIDATED','apiRevision':'FW-API-T1-D1J2-003',
        'databaseRevision':'FW-PHYS-T1-DOMAIN-004','enginePolicy':'FW-ENGINE-DOMAIN-001',
        'scope':'Current ARCH-08 design, tools and evidence; not a released backend or handover baseline',
        'runtime':'NOT_RUN','selfHash':'Excluded to avoid a self-reference; printed by the sealing tool',
        'fileCount':len(files),'files':files})
    drift=[n for n,v in files.items() if sha(R/n)!=v['sha256']]
    if drift:raise SystemExit('Manifest drift: '+repr(drift))
    print(json.dumps({'status':'SEALED_DESIGN_ONLY','files':len(files),
        'currentDocuments':len(checks),'manifestSha256':sha(manifest)},ensure_ascii=True))

if __name__=='__main__':main()
