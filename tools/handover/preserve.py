"""Read-only frontend inventory; writes evidence outside frontend. No Git restore."""
import hashlib, json, pathlib, subprocess, sys, datetime
ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/execution/evidence/handover-2026-10-08'
OUT.mkdir(parents=True, exist_ok=True)
if len(sys.argv) != 2 or sys.argv[1] not in {'before', 'after'}:
    raise SystemExit('Usage: preserve.py before|after')
mode = sys.argv[1]
if mode == 'before' and (OUT / 'frontend-before.json').exists():
    raise SystemExit('Original before baseline exists; refusing to replace preservation evidence.')
if mode == 'after' and not (OUT / 'frontend-before.json').exists():
    raise SystemExit('Original before baseline is required; no comparison was written.')
excluded = {'node_modules', '.git', 'npm-cache', '.vite', '.vite-temp'}
files = {}
for p in (ROOT / 'finweave-web').rglob('*'):
    if p.is_file() and not (set(p.relative_to(ROOT).parts) & excluded):
        files[p.relative_to(ROOT).as_posix()] = hashlib.sha256(p.read_bytes()).hexdigest()
status = subprocess.check_output(['git','status','--porcelain=v1','-uall'],cwd=ROOT).decode('utf-8')
result = {'capturedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(), 'exclusions':sorted(excluded), 'files':files, 'gitStatus':status}
(OUT / ('frontend-'+mode+'.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
if mode == 'after':
    before = json.loads((OUT/'frontend-before.json').read_text(encoding='utf-8'))
    changes = [k for k in sorted(set(before['files'])|set(files)) if before['files'].get(k)!=files.get(k)]
    old = [s for s in before['gitStatus'].splitlines() if 'finweave-web/' in s]
    new = [s for s in status.splitlines() if 'finweave-web/' in s]
    report = {'filesBefore':len(before['files']),'filesAfter':len(files),'filesCompared':len(set(before['files'])|set(files)),'changedAddedDeleted':changes,'frontendGitStatusUnchanged':old==new,'pass':not changes and old==new,'exclusions':sorted(excluded)}
    if changes:
        drift={'attribution':'Not determined from filesystem hashes. This task edited docs/tools only and did not run frontend build/tests. Do not revert concurrent changes.','baselineUTC':before['capturedAtUTC'],'comparisonUTC':result['capturedAtUTC'],'files':[{'path':k,'beforeSHA256':before['files'].get(k),'afterSHA256':files.get(k)} for k in changes]}
        (OUT/'frontend-observed-drift.json').write_text(json.dumps(drift,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/'frontend-preservation.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(report)); sys.exit(0 if report['pass'] else 1)
print(json.dumps({'mode':mode,'files':len(files),'existingGitChanges':len(status.splitlines())}))
