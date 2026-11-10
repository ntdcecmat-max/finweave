"""Seal source design/evidence only; never bless live source or frontend acceptance."""
from pathlib import Path
import hashlib,json,subprocess,sys
R=Path(__file__).resolve().parents[2];E=R/'docs/execution/evidence/arch-11-sources-2026-10-09'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
    manifest=E/'artifact-manifest.json'
    if not manifest.exists():put(manifest,{'status':'UNSEALED_DESIGN','runtime':'NOT_RUN'})
    subprocess.run([sys.executable,str(R/'tools/architecture/validate_arch11_sources.py')],cwd=R,check=True)
    current=json.loads((E/'current-documents.json').read_text(encoding='utf-8'))['files']
    paths={R/n for n in current}
    for folder in [R/'docs/sources',E]:paths.update(p for p in folder.rglob('*') if p.is_file() and p!=manifest)
    paths.update((R/'tools/architecture').glob('*arch11*.py'))
    paths.update([R/'docs/architecture/ARCH-11-change-report.md',R/'docs/architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md'])
    files={p.relative_to(R).as_posix():{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths)}
    put(manifest,{'artifactId':'FW-ARCH11-SOURCES-DESIGN-001','date':'2026-10-09','status':'DESIGN_ARTIFACTS_STATIC_VALIDATED','apiRevision':'FW-API-T1-D1J2-004','databaseRevision':'FW-PHYS-T1-ASYNC-005','nativeBridgeRevision':'FW-NATIVE-BRIDGE-002','runtime':'NOT_RUN','realProviders':'NOT_ACTIVATED','scope':'Source documentation/tools/evidence; no new r1/r2/frontend/native/backend/production acceptance','selfHash':'Excluded, printed by sealing tool','fileCount':len(files),'files':files})
    protected=json.loads((E/'preservation-before.json').read_text(encoding='utf-8'))['files']
    assert all(sha(R/n)==v['sha256'] for n,v in files.items())
    assert all(sha(R/n)==h for n,h in protected.items())
    print(json.dumps({'status':'SEALED_DESIGN_ONLY','files':len(files),'protectedFiles':len(protected),'currentDocs':len(current),'manifestSha256':sha(manifest)}))
if __name__=='__main__':main()
