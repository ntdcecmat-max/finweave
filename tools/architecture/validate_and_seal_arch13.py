"""Static artifact/schema and abstract-policy validation only; no runtime services are invoked."""
from pathlib import Path
import hashlib,json,re,sys
from urllib.parse import unquote
R=Path(__file__).resolve().parents[2];D=R/'docs/operations';E=R/'docs/execution/evidence/arch-13-operations-2026-10-09'
sys.path.insert(0,str(R/'work/handover-deps'))
from jsonschema import Draft202012Validator,FormatChecker
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def oracle(kind,x):
 if kind=='canOpen':return x['phase']=='smoke_passed' and all(x[k] for k in ['deployLockHeld','maintenance','oldWriterFenced','noActiveClaims','schemaChecksumsMatch','grantsVerified','registryCompatible','recoveryGateOpen','smokePassed','backupVerified','pendingDeniesAnchored'])
 if kind=='canRollback':return x['deployLockHeld'] and x['maintenance'] and x['oldWriterFenced'] and x['noActiveClaims'] and x['priorCodeCompatible']
 if kind=='rpo':return x['snapshotAgeHours']<=24 and x['durableReceipt'] and x['inventoryVerified']
 if kind=='snapshotMustRemove':return x['ageDays']>34
 if kind=='canCompleteErasure':return all(x[k] for k in ['witnessAnchored','activePurged','actualPacksPurged','allCopiesInventoried'])
 if kind=='gatePass':return x['status']=='PASS' and x['sameSource'] and x['sameConfig'] and x['executed']
 raise ValueError(kind)

def main():
 for name in ['validation-report.json','artifact-manifest.json']:
  target=E/name
  if not target.exists():put(target,{'status':'PENDING_VALIDATION_NOT_SEALED','runtime':'NOT_RUN'})
 checks=[]
 def check(n,ok):
  checks.append({'id':n,'pass':bool(ok)})
  if not ok:raise AssertionError(n)
 protected=read(E/'preservation-before.json')['files']
 current=read(E/'current-documents.json')['files']
 check('prior-536-protected-files-stable',all((R/n).exists() and sha(R/n)==h for n,h in protected.items()))
 check('no-current-ai-spec-pin-mutation','docs/product/ai-agent-specification.md' in protected and 'docs/product/ai-agent-specification.md' not in current)
 agent=read(R/'docs/agent/implementation-bundle.json')
 check('agent-bundle-all-pins-still-valid',all(sha(R/x['path'])==x['sha256'] for x in agent['files'].values()))
 bundle=read(D/'implementation-bundle.json')
 check('operations-bundle-all-pins-valid',all(sha(R/x['path'])==x['sha256'] for x in bundle['files'].values()))
 api=read(R/'docs/contracts/v2-t1-r5/openapi.json');db=read(R/'docs/data/target-t1-async/target-model.json')
 check('api005-153-634-unchanged',len(api['paths'])==153 and len(api['components']['schemas'])==634 and sha(R/'docs/contracts/v2-t1-r5/openapi.json')==agent['files']['api']['sha256'])
 check('db005-87-1001-162-unchanged',len(db['tables'])==87 and sum(len(t['columns']) for t in db['tables'])==1001 and len(db['foreignKeys'])==162 and sha(R/'docs/data/target-t1-async/target-model.json')==agent['files']['database']['sha256'])
 check('native003-unchanged',sha(R/'docs/agent/native-bridge-003.json')==agent['files']['nativeBridge']['sha256'])
 p=read(D/'operations-policy.json');s=read(D/'operations-schemas.json')
 security=read(R/'docs/security/t1/security-policy.json');asyncp=read(R/'docs/async/async-policy.json')
 check('schema-metaschema',bool(Draft202012Validator.check_schema(s) is None))
 check('security-retention-baseline-unreduced',p['backup']['snapshotHardMaxAgeDays']==security['backup']['snapshotHardMaxAgeDays'] and p['backup']['unreferencedPurgeHoursMax']==security['backup']['unreferencedPackPurgeMaxHours'] and p['backup']['erasureDeadlineDays']==security['backup']['erasureMaxDaysFromRequest'])
 check('rpo-rto-goals-unmeasured',p['backup']['rpoHoursTarget']==p['backup']['rtoHoursTarget']==24 and not p['backup']['measured'] and p['backup']['snapshotTimeForRpo']=='DB_SNAPSHOT_START_LOWER_BOUND_NOT_UPLOAD_END')
 check('local-first-budget0-no-activation',p['deployment']['externalBudgetVnd']==0 and all(not p['deployment'][k] for k in ['autoDeploy','autoPaidFallback','realEnabled','modelEnabled','sourcesEnabled']))
 check('ci-no-financehost-untrustedsecrets',not p['ci']['runnerOnFinanceHost'] and not p['ci']['untrustedRunsHaveSecrets'] and p['ci']['artifactFromTestedSourceOnly'])
 check('readiness-not-only-liveness',p['release']['readinessChecksSchemaGrantsAndRecoveryGate'] and p['release']['forceKillNeedsFence'])
 check('no-auto-downmigration-db-rewind',not p['release']['automaticDownMigration'] and not p['release']['automaticDatabaseRestore'])
 check('independent-backup-witness-fence',p['backup']['offHost'] and p['backup']['appendOnlySource'] and p['backup']['latestWitnessRequired'] and p['backup']['oldWriterFenceRequired'] and not p['backup']['destinationProvisioned'])
 check('erasure-denial-live-maintenance',all(n in p['release']['retains'] for n in ['local_denial','recovery_witness_delivery','erase_deadlines']))
 check('safe-telemetry-no-identifying-labels',all(n in p['telemetry']['forbidden'] for n in ['rawNotification','amount','balance','prompt','workspaceId','deviceId','payloadDigest']) and not p['telemetry']['clientReplayScreenshots'])
 check('alerts-independent-unprovisioned',p['alerts']['missingHeartbeatSeconds']>p['alerts']['independentHeartbeatSeconds'] and not p['alerts']['receiverProvisioned'] and not p['alerts']['notificationDeliveryTested'])
 check('quota-unknown-deny-afterrestore',p['cost']['unknownQuota']=='DENY' and p['cost']['chargedUnknownOutcome'] and p['cost']['restoreQuota']=='DENY_UNTIL_TRUSTED_RESET_OR_RECONCILIATION')
 check('strict-runtime-schema',s['$defs']['RuntimeConfig']['additionalProperties'] is False and s['$defs']['OperationalLog']['additionalProperties'] is False and s['$defs']['ExternalAlert']['additionalProperties'] is False)
 check('async-scheduler-retention-unchanged',read(D/'config-example.json')['hostTickSeconds']==asyncp['dispatch']['hostTickSeconds']==60 and p['retention']['opsLogsDays']==security['logs']['retentionDays'])
 fixture_results=[]
 for f in read(D/'schema-fixtures.json')['cases']:
  schema={**s,'$ref':'#/$defs/'+f['definition']}
  errors=list(Draft202012Validator(schema,format_checker=FormatChecker()).iter_errors(f['input']))
  passed=(not errors)==f['valid']
  fixture_results.append({'id':f['id'],'expectedValid':f['valid'],'observedValid':not errors,'pass':passed,'errorCount':len(errors)})
  assert passed,f['id']+': '+str(errors[:1])
 put(E/'schema-validation.json',{'scope':'SCHEMA_EXAMPLES_ONLY_NOT_DEPLOYED_LOADER_LOGGER_SIGNER','cases':fixture_results,'passed':sum(x['pass'] for x in fixture_results),'total':len(fixture_results)})
 check('schema-positive-negative-examples',all(x['pass'] for x in fixture_results) and any(x['expectedValid'] for x in fixture_results) and any(not x['expectedValid'] for x in fixture_results))
 vectors=read(D/'decision-examples.json')['cases'];vr=[]
 for v in vectors:
  actual=oracle(v['kind'],v['input']);vr.append({'id':v['id'],'expected':v['expected'],'actual':actual,'pass':actual==v['expected']});assert actual==v['expected'],v['id']
 put(E/'decision-validation.json',{'scope':'ABSTRACT_POLICY_EXAMPLES_NOT_PRODUCTION_RELEASE_RESTORE_FUNCTIONS','passed':len(vr),'total':len(vr),'cases':vr})
 check('abstract-policy-counterexamples',all(x['pass'] for x in vr) and len({x['kind'] for x in vectors})==6)
 rtm=read(D/'requirement-traceability.json');rb=read(D/'runbooks.json')['runbooks']
 check('runtime32-notrun-not-staticpass',len(rtm['cases'])==32 and len({c['id'] for c in rtm['cases']})==32 and all(c['status']=='SPECIFIED_NOT_RUN' for c in rtm['cases']))
 check('all41-parents-21-backlog-preserved',len(rtm['parentAcceptance'])==len(set(rtm['parentAcceptance']))==41 and rtm['requiredBacklog']==[f'BE-{i:02}' for i in range(1,22)])
 check('runbook-gate-references-resolve',len(rb)==14 and all(c['runbook'] in {x['id'] for x in rb} and c['gate'] in read(D/'release-manifest-template.json')['gates'] for c in rtm['cases']))
 tmpl=read(D/'release-manifest-template.json')
 check('no-fabricated-build-runtime-signature',tmpl['status']=='DESIGN_TEMPLATE' and tmpl['runtime']=='NOT_RUN' and not tmpl['signature']['verified'] and all(x['status']=='NOT_BUILT' and x['sha256'] is None for x in tmpl['artifacts']))
 check('no-fabricated-gate-pass',all(x['status']=='NOT_RUN' and x['executedAt'] is None for x in tmpl['gates'].values()))
 names=['README.md','architecture-and-options.md','configuration-and-secrets.md','ci-and-release.md','migration-and-rollback.md','observability-and-alerting.md','backup-restore-and-retention.md','runbooks.md','release-checklist.md','implementation-and-spikes.md','acceptance-plan.md']
 check('operational-documents-exist',all((D/n).exists() and (D/n).stat().st_size>700 for n in names))
 check('agenda-all13-designed', '| ARCH-13 Operations — ACCEPTED DESIGN |' in (R/'docs/architecture/architecture-decision-agenda.md').read_text(encoding='utf-8'))
 check('current19-overview-notice',len(current)==19 and all((R/n).read_text(encoding='utf-8').startswith('> **ARCH-13 hiện hành') for n in current))
 sources=read(D/'research-sources.json')['sources']
 check('ten-primary-research-links-dated',len(sources)==10 and read(D/'research-sources.json')['date']=='2026-10-09' and all(x['url'].startswith(('https://www.postgresql.org/','https://github.com/systemd/','https://docs.docker.com/','https://docs.github.com/','https://restic.readthedocs.io/')) for x in sources))
 links=[]
 for file in list(D.glob('*.md'))+[R/'docs/architecture/ARCH-13-change-report.md',R/'docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md']:
  for target in re.findall(r'\]\(([^)]+)\)',file.read_text(encoding='utf-8')):
   if target.startswith(('https:','http:','#','mailto:')):continue
   target=unquote(target.split('#')[0].strip('<>'))
   if target:links.append((file,target,(file.parent/target).resolve().exists()))
 check('new-markdown-local-links-resolve',all(x[2] for x in links))
 report={'id':'FW-OPS-VALIDATION-001','date':'2026-10-09','status':'PASS_DESIGN_STATIC_SCHEMA_POLICY_ONLY','runtime':'NOT_RUN','sql':'NOT_RUN','releaseRestoreAlerts':'NOT_RUN','checksPassed':len(checks),'checksTotal':len(checks),'schemaCases':len(fixture_results),'policyExamples':len(vr),'protectedFiles':len(protected),'currentDocs':len(current),'checks':checks}
 put(E/'validation-report.json',report)
 manifest=E/'artifact-manifest.json'
 paths={R/n for n in current}
 for folder in [D,E]:paths.update(p for p in folder.rglob('*') if p.is_file() and p!=manifest)
 paths.update((R/'tools/architecture').glob('*arch13*.py'))
 paths.update([R/'docs/architecture/ARCH-13-change-report.md',R/'docs/architecture/adr/ADR-020-local-first-operations-and-fenced-releases.md'])
 files={p.relative_to(R).as_posix():{'sha256':sha(p),'bytes':p.stat().st_size} for p in sorted(paths)}
 put(manifest,{'id':'FW-ARCH13-OPS-DESIGN-001','date':'2026-10-09','status':'SEALED_DESIGN_STATIC_SCHEMA_POLICY_VALIDATED','runtime':'NOT_RUN','apiRevision':'FW-API-T1-D1J2-005','databaseRevision':'FW-PHYS-T1-ASYNC-005','nativeBridgeRevision':'FW-NATIVE-BRIDGE-003','fileCount':len(files),'files':files,'selfHash':'Excluded; returned by sealing tool'})
 assert all(sha(R/n)==v['sha256'] for n,v in files.items())
 assert all(sha(R/n)==h for n,h in protected.items())
 print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
 print(json.dumps({'sealedFiles':len(files),'manifestSha256':sha(manifest)}))
if __name__=='__main__':main()
