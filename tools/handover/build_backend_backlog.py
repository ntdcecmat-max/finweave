"""Build full-scope planning inventories; no frontend/runtime or sealed baseline writes."""
import csv
import hashlib
import io
import json
import pathlib
import re

R = pathlib.Path(__file__).resolve().parents[2]
OUT = R / 'docs/product'
EVIDENCE = R / 'docs/execution/evidence/backend-planning-2026-10-08'

# Explicit responsibility assignments: OpenAPI tags alone are not authoritative
# (ledger updateDraft/postDraft currently carry an 'agent' tag).
GROUPS = {
    'BE-01': 'getSession getWorkspace signIn registerIdentity verifyIdentityChallenge requestPasswordReset resetIdentityPassword signOut listSessions renewSession revokeSession listWorkspaces createWorkspace',
    'BE-02': 'previewMutation',
    'BE-03': 'updateTrackingSettings listAccounts getAccount createAccount archiveAccount',
    'BE-04': 'listTransactions getTransaction createEvent updateDraft postDraft correctPostedEvent updateCategory linkRefund recordCashCount',
    'BE-05': 'getPresentationSnapshot getOverview getSpendingReport getPortfolio getInsights',
    'BE-06': 'listHoldings getHolding createHolding updateHoldingQuantity updateHoldingCost listHoldingMovements searchInstruments getGoldProfiles previewHolding confirmHolding',
    'BE-07': 'listPriceQuotes recordPriceQuote requestPriceRefresh getRefreshJob listRefreshJobs',
    'BE-08': 'ingestSourceEvidence reviseSourceRecord listSources refreshSource disconnectSource reconnectSource bindCollector revokeDevice registerDevice requestDeviceEnrollment listDevices listCollectorBindings disableCollectorBinding listSourceSupport ingestNotifications getReceipt listReceipts getSyncState',
    'BE-09': 'getImportTemplate previewImport confirmImport getImportJob listImportJobs',
    'BE-10': 'listReviewCases getReviewCase resolveReviewCase getEvidence',
    'BE-11': 'listPlanItems createPlanItem updatePlanItem archivePlanItem getPlanForecast linkPlanActual unlinkPlanActual',
    'BE-12': 'listGoals getGoalProgress createGoal updateGoal allocateGoal releaseGoalAllocation markGoalAchieved archiveGoal',
    'BE-13': 'simulateGoalOutcome listSimulations getSimulation',
    'BE-14': 'listConversations createConversation getConversation listMessages sendAssistantMessage getAssistantMessage cancelAssistantMessage',
    'BE-15': 'startAgentRun answerAgentRun cancelAgentRun reviseDraft reviseDraftByMessage refreshDraft previewPlanningDraft confirmPlanningDraft getAgentRun listAgentRuns getPlanningDraft listPlanningDrafts createPlanningDraft discardPlanningDraft simulatePlanningDraft getToolResult',
    'BE-16': 'adminSignIn adminSignOut opsStatus opsListAccounts opsListSources opsListJobs opsListQuotas opsListReleases opsListIncidents opsListAudit opsPreviewAction opsConfirmAction',
    'BE-17': 'dispatchJobs processIngestionReceipt executePriceRefresh executeAgentStep purgeExpiredData',
}
USER_GROUPS = [
    '05', '05', '03 06 07', '04 05', '04 05', '04 10', '04 10',
    '11 13 15', '11 13 15', '11 13 15', '12 13 15', '12 13',
    '08 09', '10', '14 15', '14', '01 03', '08 20 21', '07 08',
]
SHARED_GROUPS = ['03 04', '06 07', '04', '10', '11 12 13 15', '02', '15', '14 15', '09', '08 09 17']


def read(rel):
    return json.loads((R / rel).read_text(encoding='utf-8-sig'))


def hash_file(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def dump_csv(name, rows):
    buffer = io.StringIO(newline='')
    writer = csv.DictWriter(buffer, fieldnames=list(rows[0]), lineterminator='\n')
    writer.writeheader()
    writer.writerows(rows)
    return OUT / name, buffer.getvalue().encode('utf-8')


def main():
    parent_paths = [p for rev in ('r1', 'r2') for p in
                    (R / ('docs/governance/baselines/FW-HANDOVER-20261008-' + rev)).rglob('*') if p.is_file()]
    baseline_before = {p.relative_to(R).as_posix(): hash_file(p) for p in parent_paths}
    pins = read('docs/execution/evidence/frontend-review-2026-10-08/acceptance-2/source-manifest.json')['files']
    assert all(hash_file(R / p) == h for p, h in pins.items()), 'Accepted frontend source drift; review before generating mapping'
    api = read('docs/contracts/v2/openapi.json')
    operations = {item['post']['operationId']: (url, item['post']) for url, item in api['paths'].items()}
    assigned = [(op, group) for group, names in GROUPS.items() for op in names.split()]
    owner = dict(assigned)
    assert len(assigned) == len(owner), 'Duplicate operation responsibility'
    assert set(owner) == set(operations), {'unassigned': sorted(set(operations) - set(owner)), 'unknown': sorted(set(owner) - set(operations))}
    assert len(operations) == 133, 'Update the baseline counts explicitly when API scope changes'
    mapping_path = R / 'docs/contracts/v2/consumer-operation-mapping.csv'
    with mapping_path.open(encoding='utf-8-sig', newline='') as stream:
        consumers = list(csv.DictReader(stream))
    op_rows = []
    for op, (url, item) in operations.items():
        metadata = item['x-finweave']
        refs = [x for x in consumers if op in x['targetOperations'].split(',')]
        op_rows.append({'operation': op, 'backlog': owner[op], 'required': 'YES', 'method': 'POST', 'path': url,
                        'actor': metadata.get('actor', ''), 'kind': metadata.get('kind', ''),
                        'storageDependenciesNotGrants': ','.join(metadata.get('persistenceTables', [])),
                        'consumers': ';'.join(sorted({x['sourceSymbol'] for x in refs})),
                        'status': 'NOT_IMPLEMENTED', 'acceptance': 'backend-backlog.md#' + owner[op].lower()})
    # Markdown table is the current accepted UI catalogue, not a legacy generated audit.
    catalogue = (R / 'docs/design/interface-catalogue.md').read_text(encoding='utf-8-sig')
    actions = re.findall(r'^\| ([A-Z]+\d+) / (MOD-[A-Z]+) \| (.*?) \| (.*?) \| (.*?) \| (.*?) \|$', catalogue, re.M)
    assert len(actions) == len({x[0] for x in actions}) == 86
    action_rows = []
    for action, module, label, kind, contracts, states in actions:
        local = kind in {'local', 'fixture'}
        calls = [] if local else [name.strip().removeprefix('identity:') for name in contracts.split(',')]
        assert all(op in owner for op in calls), (action, calls)
        groups = sorted({owner[op] for op in calls} | {'BE-19'} | ({'BE-21'} if kind == 'fixture' else set()))
        action_rows.append({'action': action, 'module': module, 'label': label, 'kind': kind,
                            'targetOperations': ','.join(calls), 'backlog': ','.join(groups), 'required': 'YES',
                            'disposition': 'KEEP_SYNTHETIC_CONTROL' if kind == 'fixture' else 'KEEP_LOCAL_INTERACTION' if local else 'IMPLEMENT_AND_ADAPT',
                            'states': states, 'status': 'PLANNED_NOT_RUNTIME_VERIFIED'})
    screens = read('docs/execution/evidence/frontend-review-2026-10-08/acceptance-2/source-contract-audit.json')['catalogue']
    screen_rows = []
    for screen in screens:
        sid = screen['id']
        number = int(sid.rsplit('-', 1)[1])
        if sid.startswith('UI-U-'):
            packages = USER_GROUPS[number - 1]
        elif sid.startswith('UI-S-'):
            packages = SHARED_GROUPS[number - 1]
        elif sid.startswith('UI-AUTH-'):
            packages = '01'
        elif sid.startswith('UI-ADM-'):
            packages = '16'
        elif sid.startswith('UI-M-'):
            packages = '08 20' if number < 6 else '16 20 21'
        else:
            raise ValueError(sid)
        groups = sorted({'BE-' + x for x in packages.split()} | {'BE-19'})
        screen_rows.append({'screen': sid, 'title': screen['title'], 'route': screen['route'] or 'shared/local',
                            'backlog': ','.join(groups), 'required': 'YES', 'currentImplementation': screen['implementation'],
                            'source': screen['source'], 'remaining': screen['unverified'], 'status': 'PLANNED_NOT_BACKEND_ACCEPTED'})
    assert len(screens) == len({x['screen'] for x in screen_rows}) == 50
    with (R / 'docs/execution/handover-traceability.csv').open(encoding='utf-8-sig', newline='') as stream:
        requirements = list(csv.DictReader(stream))
    req_rows = []
    for req in requirements:
        calls = [name.strip() for name in req['operations'].split(',') if name.strip()]
        assert all(op in owner for op in calls), req['AC']
        groups = {owner[op] for op in calls} | {'BE-02', 'BE-18', 'BE-19', 'BE-21'}
        if req['AC'] in {'AC-29', 'AC-30', 'AC-31', 'AC-32', 'AC-33'}:
            groups.add('BE-20')
        req_rows.append({'AC': req['AC'], 'requirement': req['requirement'], 'required': 'YES',
                         'backlog': ','.join(sorted(groups)), 'targetOperations': ','.join(calls),
                         'remaining': req['remaining'], 'status': 'PLANNED_NOT_BACKEND_ACCEPTED'})
    assert {x['AC'] for x in req_rows} == {'AC-%02d' % i for i in range(1, 42)}
    artifacts = [dump_csv('backend-operation-backlog.csv', op_rows), dump_csv('backend-action-coverage.csv', action_rows),
                 dump_csv('backend-screen-coverage.csv', screen_rows), dump_csv('backend-requirement-coverage.csv', req_rows)]
    # Validate references without creating fake anchors on Markdown table rows.
    for row in op_rows:
        row['acceptance'] = 'backend-backlog.md; package ' + row['backlog']
    artifacts[0] = dump_csv('backend-operation-backlog.csv', op_rows)
    all_groups = {g for rows in [op_rows, action_rows, screen_rows, req_rows] for row in rows for g in row['backlog'].split(',')}
    expected_groups = {'BE-%02d' % i for i in range(1, 22)}
    assert all_groups == expected_groups, (expected_groups - all_groups, all_groups - expected_groups)
    for path, data in artifacts:
        path.write_bytes(data)
    baseline_after = {p.relative_to(R).as_posix(): hash_file(p) for p in parent_paths}
    assert baseline_before == baseline_after, 'Sealed baseline changed'
    assert all(hash_file(R / p) == h for p, h in pins.items()), 'Frontend source changed'
    docs = [OUT / name for name in ['backlog.md', 'backend-backlog.md', 'roadmap.md']]
    docs += [R / 'docs/architecture/architecture-decision-agenda.md', R / 'docs/testing/technical-spikes.md']
    missing = []
    for path in docs:
        for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', path.read_text(encoding='utf-8-sig')):
            if not re.match(r'^https?://', target) and not (path.parent / target.split('#')[0]).exists():
                missing.append(str(path) + ' -> ' + target)
    assert not missing, missing
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    report = {'scope': 'Planning inventory only; not backend runtime coverage or architecture approval',
              'pass': True, 'counts': {'packages': 21, 'operations': 133, 'actions': 86, 'screens': 50, 'parentAC': 41,
                                      'architectureTopics': 13, 'technicalSpikes': 15},
              'frontendAcceptedManifestFilesUnchanged': len(pins), 'sealedBaselinesUnchanged': baseline_after,
              'sourceInputs': {name: hash_file(R / name) for name in ['docs/contracts/v2/openapi.json',
                   'docs/contracts/v2/consumer-operation-mapping.csv', 'docs/design/interface-catalogue.md',
                   'docs/execution/handover-traceability.csv']},
              'outputs': {p.relative_to(R).as_posix(): hash_file(p) for p, _ in artifacts},
              'documents': {p.relative_to(R).as_posix(): hash_file(p) for p in docs},
              'checks': ['Exact unique 133 operations assigned once', '86 unique actions with valid API calls or explicit local/fixture disposition',
                         '50 unique screen IDs assigned', 'Exact AC-01 through AC-41 assigned', 'All 21 REQUIRED packages referenced',
                         'Local document links exist', 'Accepted frontend source hashes unchanged', 'r1/r2 snapshot bytes unchanged'],
              'execution': 'SQL/backend/native/provider/model/security NOT RUN'}
    (EVIDENCE / 'coverage-validation.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'pass': True, 'counts': report['counts'], 'frontendUnchanged': True, 'r1r2Unchanged': True}))


if __name__ == '__main__':
    main()
