"""Record existing frontend acceptance evidence; never run tests or change runtime.

This is a scoped supplement, not the full API/schema alignment workflow in
baseline.py. Sealed revisions are immutable. Only Python's standard library is used.
"""
import argparse
import hashlib
import json
import pathlib
import re
import zipfile

import baseline as handover

R = handover.R
REVIEW = R / 'docs/execution/evidence/frontend-review-2026-10-08'
RUN = REVIEW / 'acceptance-2'
PARENT = 'FW-HANDOVER-20261008-r1'
STATUS = 'RECORDED_FRONTEND_SYNTHETIC_CHECKED_SCOPE'


def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def hashes(paths):
    return {p.relative_to(R).as_posix(): sha(p) for p in sorted(paths)}


def diff(expected, actual):
    return handover.compare(expected, actual)


def read(path):
    return handover.read(path)


def write(path, data):
    handover.write(path, data)


def check_archive(folder, manifest, workspace=False):
    errors = []
    archive = folder / 'payload.zip'
    if sha(archive) != manifest['archive']['sha256']:
        errors.append('payload.zip checksum')
    sums = dict(line.rsplit('  ', 1)[::-1] for line in
                (folder / 'SHA256SUMS.txt').read_text(encoding='utf-8').splitlines())
    if sha(folder / 'manifest.json') != sums.get('manifest.json'):
        errors.append('manifest.json checksum')
    if sha(archive) != sums.get('payload.zip'):
        errors.append('payload.zip sidecar checksum')
    with zipfile.ZipFile(archive) as z:
        if z.testzip():
            errors.append('ZIP integrity')
        if set(z.namelist()) != {x['path'] for x in manifest['files']}:
            errors.append('ZIP inventory differs from manifest')
        for item in manifest['files']:
            name = item['path']
            if hashlib.sha256(z.read(name)).hexdigest() != item['sha256']:
                errors.append('ZIP bytes: ' + name)
            if workspace and (not (R / name).is_file() or sha(R / name) != item['sha256']):
                errors.append('Workspace drift: ' + name)
    return errors


def specs(suites):
    for suite in suites:
        yield from suite.get('specs', [])
        yield from specs(suite.get('suites', []))


def record(package):
    folder = R / 'docs/governance/baselines' / package
    evidence = R / 'docs/execution/evidence' / package
    if (folder / 'manifest.json').exists() or evidence.exists():
        raise SystemExit('Revision already recorded; use verify or a new revision')
    if not (folder / 'README.md').is_file():
        raise SystemExit('Write the scoped revision README before recording')
    parent_folder = folder.parent / PARENT
    parent_manifest = read(parent_folder / 'manifest.json')
    parent_before = hashes(p for p in parent_folder.rglob('*') if p.is_file())
    source_before = {p: x['sha256'] for p, x in handover.frontend().items()}
    head = handover.git('rev-parse', 'HEAD')
    git_status = handover.git('status', '--porcelain=v1', '-uall')
    review_before = hashes(p for p in REVIEW.rglob('*') if p.is_file())
    checks = []

    def check(name, ok, details):
        checks.append({'check': name, 'pass': bool(ok), 'details': details})

    parent_errors = check_archive(parent_folder, parent_manifest)
    check('Parent r1 archive and checksum sidecar', not parent_errors, parent_errors)
    run_source = read(RUN / 'source-manifest.json')['files']
    before_run = read(RUN / 'source-before-run.json')['files']
    current_source = {name: sha(R / name) if (R / name).is_file() else None for name in run_source}
    source_drift = diff(run_source, current_source)
    check('Recorded source matches source-before-run and current bytes',
          run_source == before_run and not source_drift,
          {'files': len(run_source), 'drift': source_drift})
    run_docs = read(RUN / 'documentation-manifest.json')['files']
    docs_drift = diff(run_docs, {name: sha(R / name) if (R / name).is_file() else None for name in run_docs})
    check('Acceptance documentation matches completion manifest', not docs_drift,
          {'files': len(run_docs), 'drift': docs_drift})
    browser = read(RUN / 'browser-results.json')
    browser_specs = list(specs(browser['suites']))
    browser_tests = [t for s in browser_specs for t in s.get('tests', [])]
    stats = browser['stats']
    check('One full browser run, 67 passed, no retries/failures/skips/flaky',
          len(browser_tests) == 67 and stats['expected'] == 67 and
          all(stats[k] == 0 for k in ['unexpected', 'skipped', 'flaky']) and
          all(t['status'] == 'expected' and len(t['results']) == 1 and
              t['results'][0]['status'] == 'passed' and t['results'][0].get('retry', 0) == 0
              for t in browser_tests), stats)
    unit = read(RUN / 'unit-results.json')
    unit_stats = {k: unit.get(k) for k in ['numTotalTests', 'numPassedTests', 'numFailedTests', 'numPendingTests']}
    check('Unit run 131 passed, no failures/pending',
          unit_stats == {'numTotalTests': 131, 'numPassedTests': 131, 'numFailedTests': 0, 'numPendingTests': 0}, unit_stats)
    commands = read(RUN / 'checks.json')
    check('Typecheck/lint/unit/user-build/admin-build/source-audit succeeded',
          {x['name'] for x in commands} == {'typecheck', 'lint', 'unit', 'build-user', 'build-admin', 'source-contract-audit'} and
          all(x['exitCode'] == 0 and x['error'] is None for x in commands), commands)
    summary = read(RUN / 'acceptance-summary.json')
    check('Acceptance scope remains partial synthetic with open gates',
          summary['result'] == 'PASS_FRONTEND_SYNTHETIC_CHECKED_SCOPE' and
          summary['runtimeCanonicalV2Compatible'] is False and
          summary['uniqueBrowserCases'] == 67 and summary['unit']['numPassedTests'] == 131 and
          summary['baselineFailuresInvestigated'] == summary['baselineFailuresClosed'] == 35 and
          summary['catalogueScreens'] == 50 and len(summary['unverified']) >= 7,
          {'result': summary['result'], 'v3Acceptance': summary['v3Acceptance'], 'unverified': summary['unverified']})
    for name in ['source-integrity.json', 'baseline-integrity.json', 'documentation-checks.json', 'source-contract-audit.json']:
        report = read(RUN / name)
        check('Existing evidence: ' + name, report['pass'] is True,
              {'sha256': sha(RUN / name), 'execution': 'Existing evidence; not rerun by this revision'})
    inherited = [parent_manifest['api']['canonicalPath'], 'docs/data/physical/physical-model.json']
    inherited += [x['path'] for x in parent_manifest['schema']['migrations']]
    parent_files = {x['path']: x for x in parent_manifest['files']}
    inherited_drift = [name for name in inherited if sha(R / name) != parent_files[name]['sha256']]
    check('API target/model/migrations unchanged from r1', not inherited_drift,
          {'files': inherited, 'drift': inherited_drift, 'SQL execution': 'NOT RUN'})
    if not all(x['pass'] for x in checks):
        print(json.dumps({'status': 'BLOCKED', 'checks': checks}, ensure_ascii=True))
        raise SystemExit(1)

    evidence.mkdir(parents=True)
    write(evidence / 'source-baseline.json', {
        'capturedAt': handover.now(), 'head': head, 'gitStatus': git_status,
        'selection': 'Current working tree including uncommitted/untracked source; accepted-run manifest independently compared',
        'files': source_before, 'acceptedRunFiles': run_source,
        'generatedOutputs': [p for p, x in handover.frontend().items() if x['classification'] == 'generated-build-output'],
        'deletedTrackedPaths': handover.git('ls-files', '--deleted').splitlines()})
    write(evidence / 'parent-integrity.json', {'parent': PARENT, 'before': parent_before,
          'scope': 'Original r1 files and archive stay in place; never compare r1 to newer working files as a preservation claim'})
    current_frontend = {p: x for p, x in handover.frontend().items() if x['classification'] != 'generated-build-output'}
    parent_frontend = {x['path']: x['sha256'] for x in parent_manifest['source']['manifest'] if x['path'].startswith('finweave-web/')}
    write(evidence / 'changes-from-r1.json', {
        'parent': PARENT, 'head': head, 'changes': diff(parent_frontend, {p: x['sha256'] for p, x in current_frontend.items()}),
        'attribution': 'UNKNOWN; hashes identify bytes, not author',
        'purpose': 'Frontend acceptance revision; no canonical v2/backend/security conformance claimed'})
    write(evidence / 'record-validation.json', {'packageId': package, 'observedAt': handover.now(),
          'pass': True, 'checks': checks, 'testsExecutedByThisTask': False,
          'evidenceRun': RUN.relative_to(R).as_posix(), 'notRun': summary['unverified']})

    paths = set(handover.selected(evidence, folder))
    # Keep the complete final run, its screenshots and root axe results. Retain
    # compact diagnostic records, but not a second copy of >1 GB of old traces.
    for p in REVIEW.rglob('*'):
        if not p.is_file():
            continue
        rel = p.relative_to(REVIEW)
        if rel.parts[0].startswith('acceptance-2') or p.suffix.lower() in {'.json', '.md', '.log', '.txt'}:
            paths.add(p)
    paths.update(parent_folder / name for name in ['README.md', 'review-report.md', 'CHANGELOG.md', 'manifest.json', 'SHA256SUMS.txt'])
    paths.discard(parent_folder / 'payload.zip')
    payload = {p.relative_to(R).as_posix(): p.read_bytes() for p in sorted(paths)}
    archive = folder / 'payload.zip'
    with zipfile.ZipFile(archive, 'x', zipfile.ZIP_DEFLATED) as z:
        for name, data in payload.items():
            z.writestr(name, data)
    drift = [name for name, data in payload.items() if not (R / name).is_file() or
             hashlib.sha256((R / name).read_bytes()).hexdigest() != hashlib.sha256(data).hexdigest()]
    parent_after = hashes(p for p in parent_folder.rglob('*') if p.is_file())
    review_after = hashes(p for p in REVIEW.rglob('*') if p.is_file())
    source_after = {p: x['sha256'] for p, x in handover.frontend().items()}
    if drift or diff(parent_before, parent_after) or diff(review_before, review_after) or diff(source_before, source_after) or head != handover.git('rev-parse', 'HEAD'):
        raise SystemExit('BLOCKED_DRIFT; no manifest sealed; retain draft for review and use a fresh revision')
    files = [{'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
              'classification': handover.kind(R / name) if name.startswith('finweave-web/') else
              ('evidence' if '/evidence/' in name else 'documentation-or-tooling')}
             for name, data in sorted(payload.items())]
    manifest = {'packageId': package, 'kind': 'frontend-acceptance-supplement', 'status': STATUS,
        'sealedAt': handover.now(), 'parent': {'packageId': PARENT,
            'manifestSHA256': sha(parent_folder / 'manifest.json'),
            'archiveSHA256': parent_manifest['archive']['sha256'], 'files': parent_before,
            'relation': 'Adds accepted frontend source/evidence; inherits r1 API/schema. Does not replace r1 snapshot or revalidate all handover mappings.'},
        'api': parent_manifest['api'], 'schema': parent_manifest['schema'],
        'source': {'head': head, 'selection': 'Current working tree, accepted-run source hashes matched',
                   'manifest': [x for x in files if x['path'].startswith('finweave-web/')]},
        'acceptance': {'result': summary['result'], 'evidenceRun': RUN.relative_to(R).as_posix(),
                       'browser': stats, 'unit': unit_stats, 'v3Acceptance': summary['v3Acceptance'],
                       'testsExecutedByThisTask': False, 'canonicalV2Conformance': False},
        'validation': {'recordChecksPass': True, 'recordChecks': len(checks), 'sourcePreservationPass': True,
                       'parentPreservationPass': True, 'acceptanceEvidencePreservationPass': True,
                       'artifactDriftDuringSeal': []},
        'archive': {'path': archive.relative_to(R).as_posix(), 'sha256': sha(archive), 'bytes': archive.stat().st_size},
        'exclusions': sorted(handover.EXCLUDED) + ['secrets/private keys', 'generated build outputs (inventory only)',
            'older diagnostic media/trace archives unless linked as individual files',
            'parent r1 payload.zip remains in original directory; parent manifest/docs included',
            'this manifest and SHA256SUMS (avoid self-reference)'],
        'notRun': summary['unverified'], 'files': files}
    write(folder / 'manifest.json', manifest)
    (folder / 'SHA256SUMS.txt').write_text(sha(folder / 'manifest.json') + '  manifest.json\n' +
                                         sha(archive) + '  payload.zip\n', encoding='utf-8')
    print(json.dumps({'packageId': package, 'status': STATUS, 'files': len(files),
                     'manifestSHA256': sha(folder / 'manifest.json'), 'archiveBytes': archive.stat().st_size}))
    return verify(package)


def verify(package):
    folder = R / 'docs/governance/baselines' / package
    manifest = read(folder / 'manifest.json')
    errors = check_archive(folder, manifest, workspace=True)
    parent_paths = [R / name for name in manifest['parent']['files']]
    parent_actual = {p.relative_to(R).as_posix(): sha(p) if p.is_file() else None for p in parent_paths}
    if diff(manifest['parent']['files'], parent_actual):
        errors.append('Parent r1 bytes changed')
    parent_folder = folder.parent / manifest['parent']['packageId']
    errors.extend('Parent: ' + x for x in check_archive(parent_folder, read(parent_folder / 'manifest.json')))
    print(json.dumps({'packageId': package, 'status': manifest['status'],
                     'verifiedFiles': len(manifest['files']), 'pass': not errors, 'errors': errors}, ensure_ascii=True))
    return not errors


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['record', 'verify'])
    parser.add_argument('--package-id', required=True)
    args = parser.parse_args()
    if not re.fullmatch(r'FW-HANDOVER-\d{8}-r\d+', args.package_id) or args.package_id == PARENT:
        raise SystemExit('Use a new FW-HANDOVER revision, never r1')
    raise SystemExit(0 if (record(args.package_id) if args.command == 'record' else verify(args.package_id)) else 1)
