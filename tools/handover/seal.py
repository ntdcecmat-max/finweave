"""Hash delivered handover artifacts, preserving the separate validation results."""
import datetime
import hashlib
import json
from pathlib import Path

root = Path(__file__).resolve().parents[2]
evidence = root / 'docs/execution/evidence/handover-2026-10-08'
target = evidence / 'artifact-manifest.json'
folders = [
    'docs/contracts/v2', 'docs/data/physical', 'docs/handover',
    'tools/handover', 'docs/governance/baselines/handover-before-2026-10-08',
    'docs/execution/evidence/handover-2026-10-08',
]
updated = [
    'README.md', 'docs/architecture/README.md',
    'docs/architecture/high-level-design.md',
    'docs/architecture/deployment-topology.md',
    'docs/architecture/adr/ADR-007-technical-handover-baseline.md',
    'docs/contracts/README.md', 'docs/contracts/operational-api-spec.md',
    'docs/data/logical-data-model.md', 'docs/design/README.md',
    'docs/design/interface-catalogue.md', 'docs/execution/progress.md',
    'docs/execution/realignment-traceability.md',
    'docs/execution/handover-traceability.csv', 'docs/execution/traceability.md',
    'docs/frontend/configuration-baseline.md', 'docs/frontend/mock-implementation.md',
    'docs/governance/artifact-register.md', 'docs/product/cost-model.md',
    'docs/security/security-design.md', 'docs/testing/integration-test-plan.md',
]
paths = {root / name for name in updated if (root / name).is_file()}
for name in folders:
    paths.update(p for p in (root / name).rglob('*') if p.is_file()
                 and '__pycache__' not in p.parts and p != target)
entries = []
for path in sorted(paths):
    data = path.read_bytes()
    entries.append({'file': path.relative_to(root).as_posix(), 'bytes': len(data),
                    'sha256': hashlib.sha256(data).hexdigest()})
validation = json.loads((evidence / 'validation.json').read_text(encoding='utf-8'))
manifest = {
    'capturedAtUTC': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Delivered artifacts only. Hashes do not prove runtime correctness or authorship.',
    'exclusions': ['this manifest itself', 'frontend source/build outputs', 'work dependencies'],
    'artifactChecksPass': validation['artifactChecksPass'],
    'frontendPreservationPass': validation['frontendPreservationPass'],
    'overallPass': validation['pass'],
    'files': entries,
}
target.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'manifest': target.relative_to(root).as_posix(), 'files': len(entries),
                  'overallPass': manifest['overallPass']}))
