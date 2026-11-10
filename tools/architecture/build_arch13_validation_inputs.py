"""Operations schemas, illustrative cases and NOT_RUN runtime acceptance. Not a deployer."""
from pathlib import Path
from copy import deepcopy
import csv,json,hashlib
R=Path(__file__).resolve().parents[2];D=R/'docs/operations'
def put(n,x):(D/n).write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(n):return hashlib.sha256((R/n).read_bytes()).hexdigest()
def obj(p,required=None):return {'type':'object','additionalProperties':False,'properties':p,'required':list(p) if required is None else required}
def enum(*a):return {'type':'string','enum':list(a)}
def integer(lo,hi):return {'type':'integer','minimum':lo,'maximum':hi}
def ref(n):return {'$ref':'#/$defs/'+n}
STR={'type':'string','minLength':1,'maxLength':160}
HASH={'type':'string','pattern':'^[a-f0-9]{64}$'}
NULLHASH={'anyOf':[HASH,{'type':'null'}]}
BOOL={'type':'boolean'}
GATES=['G-ARTIFACT','G-DB','G-DOMAIN','G-AUTH','G-J2','G-CONSUMERS','G-NATIVE','G-SOURCE','G-AGENT','G-SEC-T1','G-OPS','G-UAT']

def schemas():
 gate=obj({'status':enum('PASS','FAIL','BLOCKED','NOT_RUN'),'sourceSha256':HASH,'configSha256':HASH,'evidenceRef':{'type':['string','null'],'maxLength':240},'executedAt':{'type':['string','null'],'format':'date-time'},'scope':enum('SYNTHETIC','REAL_T1','DESIGN_ONLY')})
 gate['allOf']=[{'if':{'properties':{'status':{'const':'PASS'}},'required':['status']},'then':{'properties':{'evidenceRef':{'type':'string','minLength':1},'executedAt':{'type':'string','format':'date-time'},'scope':enum('SYNTHETIC','REAL_T1')}}}]
 pins=obj({'apiRevision':{'const':'FW-API-T1-D1J2-005'},'apiSha256':HASH,'databaseRevision':{'const':'FW-PHYS-T1-ASYNC-005'},'databaseSha256':HASH,'nativeBridgeRevision':{'const':'FW-NATIVE-BRIDGE-003'},'nativeBridgeSha256':HASH})
 secret=obj({'purpose':enum('owner_api','ops_api','market','agent','ingestion','forecast','retention','migration','backup','witness_producer'),'fileRef':{'type':'string','pattern':'^/run/secrets/[a-z0-9_-]{1,80}$'},'keyVersion':STR})
 config=obj({'environmentClass':enum('LOCAL_SYNTHETIC','STAGING_SYNTHETIC','REAL_T1'),'environmentId':STR,'releaseId':STR,'pins':ref('Pins'),
  'userOrigin':{'type':'string','format':'uri'},'adminOrigin':{'type':'string','format':'uri'},
  'dataMode':enum('SYNTHETIC','REAL'),'realEnabled':BOOL,'modelEnabled':BOOL,'sourcesEnabled':BOOL,'externalBudgetVnd':{'const':0},
  'encryptedMountRequired':BOOL,'secretRefs':{'type':'array','items':ref('SecretRef'),'minItems':1,'maxItems':24,'uniqueItems':True},
  'backupIntervalHours':integer(1,24),'backupSnapshotMaxAgeDays':{'const':34},'packPurgeMaxHours':{'const':24},'erasureMaxDays':{'const':35},
  'hostTickSeconds':{'const':60},'newJobsEnabled':BOOL,'maintenance':BOOL,'autoPaidFallback':{'const':False}})
 config['allOf']=[{'if':{'properties':{'environmentClass':{'const':'REAL_T1'}},'required':['environmentClass']},'then':{'properties':{'dataMode':{'const':'REAL'},'encryptedMountRequired':{'const':True},'userOrigin':{'pattern':'^https://'},'adminOrigin':{'pattern':'^https://'}}},'else':{'properties':{'dataMode':{'const':'SYNTHETIC'},'realEnabled':{'const':False}}}}]
 artifact=obj({'kind':enum('user_web','admin_web','backend_amd64','backend_arm64','apk','migration_set','policy_set'),'pathOrDigestRef':{'type':['string','null'],'maxLength':300},'sha256':NULLHASH,'status':enum('NOT_BUILT','BUILT_TESTED')})
 artifact['allOf']=[{'if':{'properties':{'status':{'const':'BUILT_TESTED'}},'required':['status']},'then':{'properties':{'pathOrDigestRef':{'type':'string','minLength':1},'sha256':HASH}}}]
 release=obj({'id':STR,'status':enum('DESIGN_TEMPLATE','VERIFIED_CANDIDATE'),'source':obj({'kind':enum('COMMIT','WORKING_TREE_ARCHIVE'),'head':{'type':['string','null'],'pattern':'^[a-f0-9]{40}$'},'contentSha256':NULLHASH,'includesUntrackedAndDeletions':{'const':True}}),
  'pins':ref('Pins'),'configSha256':NULLHASH,'artifacts':{'type':'array','items':ref('Artifact'),'minItems':6,'maxItems':7},
  'compatibility':obj({'previousCodeSupportsCurrentDatabase':BOOL,'jobPolicies':{'type':'array','items':STR,'uniqueItems':True},'payloadKinds':{'type':'array','items':STR,'uniqueItems':True},'installedNativeRevisions':{'type':'array','items':STR,'uniqueItems':True}}),
  'gates':obj({n:ref('GateEvidence') for n in GATES}),
  'signature':obj({'tool':{'type':['string','null'],'maxLength':80},'trustedKeyId':{'type':['string','null'],'maxLength':120},'detachedSignatureRef':{'type':['string','null'],'maxLength':240},'verified':BOOL}),
  'runtime':enum('NOT_RUN','CANDIDATE_TESTED')})
 release['allOf']=[{'if':{'properties':{'status':{'const':'VERIFIED_CANDIDATE'}},'required':['status']},'then':{'properties':{'configSha256':HASH,'source':{'properties':{'contentSha256':HASH}},'artifacts':{'items':{'properties':{'status':{'const':'BUILT_TESTED'}}}},'signature':{'properties':{'tool':{'type':'string','minLength':1},'trustedKeyId':{'type':'string','minLength':1},'detachedSignatureRef':{'type':'string','minLength':1},'verified':{'const':True}}},'runtime':{'const':'CANDIDATE_TESTED'}}}}]
 checkpoint=obj({'releaseId':STR,'phase':enum('prepared','verified','maintenance','drained','migrated','smoke_passed','opened','halted'),
  'deployLockHeld':BOOL,'maintenance':BOOL,'oldWriterFenced':BOOL,'noActiveClaims':BOOL,'schemaChecksumsMatch':BOOL,'grantsVerified':BOOL,'registryCompatible':BOOL,'recoveryGateOpen':BOOL,'smokePassed':BOOL,'backupVerified':BOOL,'pendingDeniesAnchored':BOOL,'priorCodeCompatible':BOOL})
 log=obj({'requestId':{'type':'string','pattern':'^[a-f0-9]{32}$'},'operationClass':enum('read','mutation','dispatch','backup','recovery','release'),
  'statusClass':enum('ok','denied','error','partial'),'safeCode':enum('OK','NOT_READY','AUTH_DENIED','QUOTA_HELD','BACKUP_OVERDUE','RECOVERY_LOCKED','WORKER_FENCED','SCHEMA_MISMATCH'),
  'latencyBucket':enum('lt100ms','lt1s','lt10s','ge10s'),'profile':enum('user_api','ops_api','market','agent','ingestion','forecast','retention','migration','backup','witness'),
  'releaseId':STR,'environmentClass':enum('LOCAL_SYNTHETIC','STAGING_SYNTHETIC','REAL_T1')})
 alert=obj({'safeCode':enum('HOST_MISSING','BACKUP_OVERDUE','RECOVERY_LOCKED','DISK_CRITICAL','ERASURE_OVERDUE','TLS_EXPIRING','QUEUE_OVERDUE','CLOCK_UNTRUSTED'),
  'environmentClass':enum('LOCAL_SYNTHETIC','STAGING_SYNTHETIC','REAL_T1'),'releaseId':STR,'profile':enum('host','backup','recovery','market','agent','ingestion','forecast','retention'),
  'severity':enum('warning','critical'),'at':{'type':'string','format':'date-time'},'incidentRef':{'type':'string','pattern':'^[a-f0-9]{32}$'}})
 result={'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'https://finweave.invalid/design/ops001','description':'Design contract; validators below are static examples, not deployed config/release controls.',' $comment':'No runtime implementation is present.', '$defs':{'Pins':pins,'SecretRef':secret,'RuntimeConfig':config,'GateEvidence':gate,'Artifact':artifact,'ReleaseManifest':release,'ReleaseCheckpoint':checkpoint,'OperationalLog':log,'ExternalAlert':alert}}
 result.pop(' $comment');result['$comment']='No runtime implementation is present.'
 put('operations-schemas.json',result)
 return result

def examples():
 pins={'apiRevision':'FW-API-T1-D1J2-005','apiSha256':sha('docs/contracts/v2-t1-r5/openapi.json'),'databaseRevision':'FW-PHYS-T1-ASYNC-005','databaseSha256':sha('docs/data/target-t1-async/target-model.json'),'nativeBridgeRevision':'FW-NATIVE-BRIDGE-003','nativeBridgeSha256':sha('docs/agent/native-bridge-003.json')}
 config={'environmentClass':'LOCAL_SYNTHETIC','environmentId':'example-local-synthetic-only','releaseId':'EXAMPLE-NOT-DEPLOYED','pins':pins,'userOrigin':'http://127.0.0.1:4182','adminOrigin':'http://127.0.0.1:4183','dataMode':'SYNTHETIC','realEnabled':False,'modelEnabled':False,'sourcesEnabled':False,'externalBudgetVnd':0,'encryptedMountRequired':False,'secretRefs':[{'purpose':'owner_api','fileRef':'/run/secrets/example_synthetic_owner','keyVersion':'example-not-created'}],'backupIntervalHours':12,'backupSnapshotMaxAgeDays':34,'packPurgeMaxHours':24,'erasureMaxDays':35,'hostTickSeconds':60,'newJobsEnabled':False,'maintenance':True,'autoPaidFallback':False}
 put('config-example.json',config)
 kinds=['user_web','admin_web','backend_amd64','apk','migration_set','policy_set']
 manifest={'id':'EXAMPLE-NOT-DEPLOYED','status':'DESIGN_TEMPLATE','source':{'kind':'WORKING_TREE_ARCHIVE','head':None,'contentSha256':None,'includesUntrackedAndDeletions':True},'pins':pins,'configSha256':None,'artifacts':[{'kind':k,'pathOrDigestRef':None,'sha256':None,'status':'NOT_BUILT'} for k in kinds],
  'compatibility':{'previousCodeSupportsCurrentDatabase':False,'jobPolicies':[],'payloadKinds':[],'installedNativeRevisions':['FW-NATIVE-BRIDGE-003']},
  'gates':{g:{'status':'NOT_RUN','sourceSha256':'0'*64,'configSha256':'0'*64,'evidenceRef':None,'executedAt':None,'scope':'DESIGN_ONLY'} for g in GATES},
  'signature':{'tool':None,'trustedKeyId':None,'detachedSignatureRef':None,'verified':False},'runtime':'NOT_RUN'}
 put('release-manifest-template.json',manifest)
 c={'releaseId':'EXAMPLE-NOT-DEPLOYED','phase':'prepared','deployLockHeld':False,'maintenance':True,'oldWriterFenced':False,'noActiveClaims':False,'schemaChecksumsMatch':False,'grantsVerified':False,'registryCompatible':False,'recoveryGateOpen':False,'smokePassed':False,'backupVerified':False,'pendingDeniesAnchored':False,'priorCodeCompatible':False}
 log={'requestId':'a'*32,'operationClass':'dispatch','statusClass':'denied','safeCode':'WORKER_FENCED','latencyBucket':'lt100ms','profile':'agent','releaseId':'EXAMPLE-NOT-DEPLOYED','environmentClass':'LOCAL_SYNTHETIC'}
 alert={'safeCode':'BACKUP_OVERDUE','environmentClass':'LOCAL_SYNTHETIC','releaseId':'EXAMPLE-NOT-DEPLOYED','profile':'backup','severity':'critical','at':'2026-10-09T00:00:00Z','incidentRef':'b'*32}
 fixture=[]
 def case(i,definition,value,valid):fixture.append({'id':i,'definition':definition,'input':deepcopy(value),'valid':valid})
 for n,v in [('RuntimeConfig',config),('ReleaseManifest',manifest),('ReleaseCheckpoint',c),('OperationalLog',log),('ExternalAlert',alert)]:case(n+'-valid-example',n,v,True)
 config_bad=[('secret-inline','dbPassword','example-do-not-store'),('unknown-env','environmentClass','PROD_AUTO'),('paid','externalBudgetVnd',1000),('fallback','autoPaidFallback',True),('real-label-synthetic','realEnabled',True),('revision','pins',{**pins,'apiRevision':'FW-API-T1-D1J2-004'}),('backup-age','backupSnapshotMaxAgeDays',35),('purge','packPurgeMaxHours',25),('erase','erasureMaxDays',36),('tick','hostTickSeconds',0),('secretref','secretRefs',[{'purpose':'owner_api','fileRef':'password-not-path','keyVersion':'v1'}])]
 for i,k,v in config_bad:
  q=deepcopy(config);q[k]=v;case('config-'+i,'RuntimeConfig',q,False)
 real=deepcopy(config);real.update(environmentClass='REAL_T1',dataMode='REAL',userOrigin='https://app.example.invalid',adminOrigin='https://admin.example.invalid',encryptedMountRequired=True)
 case('real-shaped-not-startup-authorized','RuntimeConfig',real,True)
 for i,k,v in [('real-http','userOrigin','http://app.example.invalid'),('real-mount','encryptedMountRequired',False),('real-fixtures','dataMode','SYNTHETIC')]:
  q=deepcopy(real);q[k]=v;case(i,'RuntimeConfig',q,False)
 for field in ['body','headers','token','amount','workspaceId','prompt','sqlParameters','rawNotification','payloadDigest']:
  q=deepcopy(log);q[field]='example-forbidden';case('log-reject-'+field,'OperationalLog',q,False)
 for field in ['email','deviceId','amount','prompt','rawUrl']:
  q=deepcopy(alert);q[field]='example-forbidden';case('alert-reject-'+field,'ExternalAlert',q,False)
 q=deepcopy(manifest);q['status']='VERIFIED_CANDIDATE';case('unbuilt-not-candidate','ReleaseManifest',q,False)
 gate=deepcopy(manifest['gates']['G-DB']);gate['status']='PASS';case('no-evidence-not-pass','GateEvidence',gate,False)
 gate.update(executedAt='2026-10-09T00:00:00Z',scope='SYNTHETIC',evidenceRef='synthetic-example-not-executed');case('illustrative-gate-structure','GateEvidence',gate,True)
 q=deepcopy(c);q['phase']='zero_downtime_ready';case('unknown-phase','ReleaseCheckpoint',q,False)
 q=deepcopy(manifest);q['gates'].pop('G-NATIVE');case('missing-gate','ReleaseManifest',q,False)
 case('wrong-hash','Pins',{**pins,'databaseSha256':'not-a-hash'},False)
 put('schema-fixtures.json',{'status':'ILLUSTRATIVE_NOT_RUNTIME','cases':fixture})
 return config,c

def acceptance():
 cases=[
 ('Configuration','Strict loader rejects unknown/inline-secret/revision/env mismatch; public config contains only approved fields','BE-18/19/20/21','RB-01','G-ARTIFACT'),
 ('Encrypted mount','Missing/wrong mount or file mode under actual container UID stops startup without plaintext fallback','BE-18/21','RB-01','G-SEC-T1'),
 ('Environment isolation','Separate DB/roles/keys/origins/APK channels; real cannot seed/reset or use synthetic credentials','BE-01/18/19/20/21','RB-01','G-AUTH'),
 ('Secret custody','Per-profile secrets/rotation/backup versions; no DB/provider/signing/key capsule in browser/APK/Ops/API logs','BE-01/16/18/20/21','RB-10','G-SEC-T1'),
 ('Untrusted CI','PR/dependency code cannot access real secrets/finance host/Docker socket/signing/publish; hosted quota0 enforced','BE-18/21','RB-02','G-ARTIFACT'),
 ('Artifact provenance','Working-tree untracked/deletions and lock/toolchain pins included; test/build/sign/deploy same exact artifact','BE-02/19/20/21','RB-02','G-ARTIFACT'),
 ('Required gates','Missing/skipped/cancelled/stale/wrongsource evidence blocks promotion; all41AC/21BE retained','BE-01…21','RB-02','G-UAT'),
 ('Maintenance ingress','Block owner/Ops writes/nativeupload/enqueue before ACK; deny/erase/witness/backup control remains effective','BE-01/04/08/16/17/18/21','RB-02','G-OPS'),
 ('Drain/cancel/fence','Kill during externalcall/unknownCOMMIT; staleworker cannot publish, attempts/deadline/budget/quota unchanged','BE-04/07/08/09/13/15/17/21','RB-04','G-J2'),
 ('Migrator exclusivity','Two runners, session loss and checksum mismatch halt correctly; never application auto-DDL','BE-02/18/21','RB-03','G-DB'),
 ('Clean/upgrade/backfill','Executable001–003+004+ clean and upgrade reach DB005 with types/grants/pins/invariants and resumable backfill','BE-01…18/21','RB-03','G-DB'),
 ('Nontransaction DDL','Interrupt concurrent index create; inspect invalid definition/journal; exact phase repair, no false applied','BE-02/21','RB-03','G-DB'),
 ('Compatibility rollback','Prior code blocked on unknown DB/job/payload/API/native compatibility; no downmigration/data rewind/legacy queue','BE-02/08/15/17/19/20/21','RB-03','G-OPS'),
 ('Readiness','Healthy TCP/SELECT1 with wronggrants/recoverylocked/schema mismatch cannot serve finance; dependency reconnect bounded','BE-01/02/18/21','RB-01','G-AUTH'),
 ('Scheduler catchup','Clients off, host sleep/reboot/duplicate timer; latestdue J2 unique and explicitmissedcoverage, ≥7days observed','BE-07/17/21','RB-04','G-J2'),
 ('Provider outage','429/unknownquota/rights revoked/stale goldunits/bankprofile changes; denycall/lastgood/Review, no raw capture','BE-06/07/08/10/17/21','RB-05','G-SOURCE'),
 ('Agent outage','Cold/slow model/injection/retry/crossday resume and cancel; authority/budgetfences, no hosted silentfallback','BE-11/12/13/14/15/17/21','RB-06','G-AGENT'),
 ('APK release','Signed install/update, wrongsigner/origin/revision, offlineoutbox continuity; no unsupportedACK/ownerretag','BE-08/19/20/21','RB-13','G-NATIVE'),
 ('Safe telemetry','Inject secrets/amount/PII/raw/prompt via app/proxy/DB/dependency/error/crash paths; scanactualoutput denied','BE-01…21','RB-10','G-SEC-T1'),
 ('Independent alert','Kill financehost/network; externalreceiver detects absentheartbeat and receives recovery/duplicate safely, no finance','BE-16/18/21','RB-12','G-OPS'),
 ('TLS/clock failure','Expiredwrongdomaincert/skew>60s/clockrollback do not bypass auth/lease/witness; operator repair','BE-01/08/17/18/20/21','RB-12','G-AUTH'),
 ('Resource/cost pressure','Disk/pool/RAM/model/backup scratch/VMquota exhaustion stopsheavy work, keepsdenies, no ledgerdelete/paidfallback','BE-07/09/13/15/17/18/21','RB-07','G-OPS'),
 ('Backup complete','Failed/partial/RLSfiltered/export missingobjects oroffhostreceipt notsuccess; independent inventory/keyrefs','BE-01…18/21','RB-08','G-OPS'),
 ('RPO measurement','Snapshotstart notuploadend;12hcandidate+network/dump delay failure drills reportactualage/loss and targetbreach','BE-18/21','RB-08','G-OPS'),
 ('Restore keys','LostVM/onecapsulemedia/currentkey; authorizeddecrypt stillworks orLOCKED honestly; no circular backupkey','BE-18/21','RB-09','G-SEC-T1'),
 ('Restore fence/witness','Oldwriter unfenced/stalehead/unknownmapping/erasedtarget blocked before finance reads and exports','BE-01/04/08/18/21','RB-09','G-SEC-T1'),
 ('Restore credentials','Oldpassword/OTP/session/token/replay/MFA/collector/binding invalid, freshidentityproof/enrollment required','BE-01/08/16/18/20/21','RB-09','G-AUTH'),
 ('Restore financial/quotas','Ledger/history/PlanGoals invariants, no nativeautorepost; unknownprovider/modelquota denieduntiltrustedreset','BE-03…15/17/18/21','RB-09','G-DOMAIN'),
 ('Backup retention','Alltags/hosts/futurepoisonedlabels/softdelete; hard34d +actualpackpurge24h withscratch; lastgood/availability conflicts visible','BE-18/21','RB-08','G-SEC-T1'),
 ('Erasure','Localdeny/witnessoutage/concurrentnewkey request keep original35d deadline/childfreeze, allcopyactualpurge beforecompletion','BE-01…18/21','RB-11','G-SEC-T1'),
 ('Runtime retention','Activepins/confirmedhistory/dedupe/denytombstones preserved, shortauthreplay/sourceTTL enforced; actualdeleted notclockonly','BE-01/04/08/09/11/12/14/15/17/18/21','RB-11','G-SEC-T1'),
 ('Full acceptance and incident close','All41AC/21BE/AIrequirements endtoend, realdevice/model/source/UAT; scopedRPO/RTO/report residuals, no fullPASS from mocks','BE-01…21','RB-14','G-UAT')]
 assert len(cases)==32
 rows=[{'id':f'OPS-{i:02}','title':t,'procedure':p,'backlog':b,'runbook':r,'gate':g,'status':'SPECIFIED_NOT_RUN','expected':'Runtime evidence with exact source/config/artifact revisions; failed attempts retained; zero observed safety violation in tested scope'} for i,(t,p,b,r,g) in enumerate(cases,1)]
 parent=list(csv.DictReader((R/'docs/product/backend-requirement-coverage.csv').open(encoding='utf-8-sig',newline='')))
 # Parent IDs from canonical handover inventory, no new acceptance IDs counted as parents.
 parents=list(csv.DictReader((R/'docs/execution/handover-traceability.csv').open(encoding='utf-8-sig',newline='')))
 ac=[r['AC'] for r in parents];assert len(ac)==len(set(ac))==41
 put('requirement-traceability.json',{'id':'FW-OPS-RTM-001','parentAcceptance':ac,'requiredBacklog':[f'BE-{i:02}' for i in range(1,22)],'parentRequirementInventoryRows':len(parent),'runtime':'NOT_RUN','cases':rows})
 (D/'acceptance-plan.md').write_text('''# OPS-01…32 — Kiểm thử vận hành cần thực thi

**ALL SPECIFIED / NOT RUN.** Đây là refinement xuyên suốt BE01…21 và41parentAC, không thêm32parentrequirements, không chứng nhận toànAC từ kiểm tra tài liệu. Mỗi ca cần harness/process/DB/native/provider/model đúng phạm vi, expected/actual độc lập, fault injection synthetic, logs sạch và source/config/release hash. [JSON RTM](requirement-traceability.json).

| ID | Trọng tâm / thủ tục | Liên quan | Runbook / gate | Trạng thái |
| --- | --- | --- | --- | --- |
'''+''.join(f"| {r['id']} {r['title']} | {r['procedure']} | {r['backlog']} | {r['runbook']} / {r['gate']} | NOT RUN |\n" for r in rows)+'''
Không dùng mock release/schema examples để PASS các ca này. TargetRPO/RTO/thresholds cần đo, nguồn/model/device independence thật cần quyền/thiết bị/endpoints. Fullproduct vẫn tất cảfeature/AI-SPEC/41AC và UAT; knowncritical/unknownauthorization/recoverystale chặnreal.
''',encoding='utf-8')

def decision_examples(checkpoint):
 # These examples exercise an explicit abstract policy oracle in the validator, not production functions.
 v=[]
 def add(i,kind,x,expect):v.append({'id':i,'kind':kind,'input':x,'expected':expect})
 ready={**checkpoint, 'phase':'smoke_passed','deployLockHeld':True,'maintenance':True,'oldWriterFenced':True,'noActiveClaims':True,'schemaChecksumsMatch':True,'grantsVerified':True,'registryCompatible':True,'recoveryGateOpen':True,'smokePassed':True,'backupVerified':True,'pendingDeniesAnchored':True}
 add('open-ready','canOpen',ready,True)
 for f in ['deployLockHeld','maintenance','oldWriterFenced','noActiveClaims','schemaChecksumsMatch','grantsVerified','registryCompatible','recoveryGateOpen','smokePassed','backupVerified','pendingDeniesAnchored']:
  add('open-deny-'+f,'canOpen',{**ready,f:False},False)
 add('open-wrong-phase','canOpen',{**ready,'phase':'migrated'},False)
 add('rollback-compatible','canRollback',{**ready,'priorCodeCompatible':True},True)
 add('rollback-unknown','canRollback',ready,False)
 add('rollback-unfenced','canRollback',{**ready,'priorCodeCompatible':True,'oldWriterFenced':False},False)
 for hours,upload,expect in [(23,0,True),(24,0,True),(24.01,0,False),(25,0,False),(23,3,True)]:
  add(f'rpo-snapshot-{hours}-{upload}','rpo',{'snapshotAgeHours':hours,'uploadAgeHours':upload,'durableReceipt':True,'inventoryVerified':True},expect)
 add('rpo-no-receipt','rpo',{'snapshotAgeHours':1,'uploadAgeHours':0,'durableReceipt':False,'inventoryVerified':True},False)
 add('rpo-no-inventory','rpo',{'snapshotAgeHours':1,'uploadAgeHours':0,'durableReceipt':True,'inventoryVerified':False},False)
 for days in [33.9,34,34.1,35]:add(f'expired-{days}','snapshotMustRemove',{'ageDays':days},days>34)
 for name,changes,expected in [('ready',{},True),('metadata-only',{'actualPacksPurged':False},False),('not-anchored',{'witnessAnchored':False},False),('active-remains',{'activePurged':False},False),('copies-unknown',{'allCopiesInventoried':False},False)]:
  add('erase-'+name,'canCompleteErasure',{'witnessAnchored':True,'activePurged':True,'actualPacksPurged':True,'allCopiesInventoried':True,**changes},expected)
 for n,val in [('PASS',True),('NOT_RUN',False),('BLOCKED',False),('FAIL',False)]:add('gate-'+n,'gatePass',{'status':n,'sameSource':True,'sameConfig':True,'executed':True},val)
 add('gate-oldsource','gatePass',{'status':'PASS','sameSource':False,'sameConfig':True,'executed':True},False)
 add('gate-oldconfig','gatePass',{'status':'PASS','sameSource':True,'sameConfig':False,'executed':True},False)
 add('gate-unexecuted','gatePass',{'status':'PASS','sameSource':True,'sameConfig':True,'executed':False},False)
 put('decision-examples.json',{'status':'ABSTRACT_POLICY_ONLY_NOT_PRODUCTION_RUNTIME','cases':v})

def main():
 schemas();config,c=examples();acceptance();decision_examples(c)
 print(json.dumps({'status':'AUTHORED_SCHEMAS_CASES_NOT_RUNTIME','definitions':9,'runtimeCases':32}))
if __name__=='__main__':main()
