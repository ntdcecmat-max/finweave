"""Build ARCH-09 design metadata only. Never edits prior packages or application code."""
from pathlib import Path
import copy,csv,hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'docs/async';B=R/'docs/data/target-t1-async';A=R/'docs/contracts/v2-t1-r4'

def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def col(n,t,meaning,nullable=False):return {'name':n,'type':t,'nullable':nullable,'meaning':meaning}

def main():
    D.mkdir(parents=True,exist_ok=True);B.mkdir(parents=True,exist_ok=True);A.mkdir(parents=True,exist_ok=True)
    priorApi=R/'docs/contracts/v2-t1-r3/openapi.json';oldapi=json.loads(priorApi.read_text(encoding='utf-8'))
    rev='FW-API-T1-D1J2-004'
    def reversion(v):
      if isinstance(v,dict):return {k:reversion(x) for k,x in v.items()}
      if isinstance(v,list):return [reversion(x) for x in v]
      return rev if v=='FW-API-T1-D1J2-003' else v
    api=reversion(copy.deepcopy(oldapi));schemas=api['components']['schemas']
    ID={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'}
    N={'type':'integer','minimum':0,'maximum':9007199254740991}
    DT={'type':'string','format':'date-time'}
    def nullable(v):return {'anyOf':[v,{'type':'null'}]}
    def obj(props,optional=()):return {'type':'object','properties':props,'required':[n for n in props if n not in optional],'additionalProperties':False}
    def ref(n):return {'$ref':'#/components/schemas/'+n}
    mapping=schemas['previewImportInput']['properties']['mapping']
    selector={'type':'string','minLength':1,'maxLength':120}
    for n in ['date','amount','description','debit','credit','currency']:mapping['properties'][n]=copy.deepcopy(selector)
    mapping['properties']['reference']=nullable(copy.deepcopy(selector))
    mapping['required']=['date','description','reference','dateFormat','amountFormat','encoding']
    mapping['allOf']=[{'if':{'properties':{'amountFormat':{'const':'signed_integer_vnd'}}},'then':{'required':['amount']}},
      {'if':{'properties':{'amountFormat':{'const':'debit_credit_vnd'}}},'then':{'required':['debit','credit']}}]
    sync=schemas['getSyncStateOutput'];sync['properties'].update({'coverageComplete':{'type':'boolean'},'deviceIdsComplete':{'type':'boolean'}})
    sync['required']+=['coverageComplete','deviceIdsComplete']
    accountFilter=nullable({'type':'array','items':ID,'minItems':1,'maxItems':100,'uniqueItems':True})
    page=obj({'cursor':nullable({'type':'string','minLength':1,'maxLength':1024}),'pageSize':{'type':'integer','minimum':1,'maximum':100}})
    coverage=obj({'accountId':ID,'trackingStart':nullable({'type':'string','format':'date'}),
      'lastObserved':nullable(DT),'lastAck':nullable(DT),'gapCount':N,'hasOpenGap':{'type':'boolean'}})
    gap=obj({'id':ID,'accountId':ID,'sourceId':nullable(ID),'deviceId':nullable(ID),'start':DT,'end':nullable(DT),'reason':ID})
    pageInfo=obj({'nextCursor':nullable({'type':'string','minLength':1,'maxLength':1024}),'snapshotId':ID,
      'asOf':DT,'coverageVersion':N,'recoveryEpoch':N})
    added=[]
    for name,row in [('listCoverage',coverage),('listCoverageGaps',gap)]:
      inp=obj({'accountIds':copy.deepcopy(accountFilter),'page':copy.deepcopy(page)})
      if name=='listCoverageGaps':inp['properties'].update({'periodStart':nullable(DT),'periodEndExclusive':nullable(DT)});inp['required']+=['periodStart','periodEndExclusive']
      schemas[name+'Input']=inp;schemas[name+'Output']=obj({'items':{'type':'array','items':row,'maxItems':100},'page':copy.deepcopy(pageInfo)})
      request=copy.deepcopy(schemas['getSyncStateRequest']);request['properties']['operationId']={'const':name};request['properties']['input']=ref(name+'Input');schemas[name+'Request']=request
      reply=copy.deepcopy(schemas['getSyncStateReply']);reply['properties']['data']=ref(name+'Output');schemas[name+'Reply']=reply
      op=copy.deepcopy(api['paths']['/v2/operations/getSyncState']['post']);op['operationId']=name;op['summary']=name+' — snapshot-bound coverage query'
      op['requestBody']['content']['application/json']['schema']=ref(name+'Request');op['responses']['200']['content']['application/json']['schema']=ref(name+'Reply')
      op['x-finweave'].update({'origin':'ARCH09:paged-coverage','objectSelectors':['accountIds'],
        'persistenceTables':['workspaces','accounts','coverage_gaps','ingestion_receipts','snapshots','payload_objects'],
        'polling':'foreground20s or focus/mutation invalidation; no read-side execution',
        'concurrency':'Coverage/control snapshot, cursor bound to owner/workspace/scope/epoch/version; no mixed pages'})
      api['paths']['/v2/operations/'+name]={'post':op};added.append(name)
    api['info']['title']='FinWeave API v2 — async revision 004 (unreleased)'
    api['info']['description']='ARCH09 revision004 fixes CSV selectors and adds explicit bounded sync coverage + paged coverage queries. Inherits ARCH08 frozen forecasts. Prior packages immutable; consumers/runtime NOT_RUN. Exact revision+hash required.'
    api['x-finweave-revision']['supersedesWorkingTarget']='docs/contracts/v2-t1-r3/openapi.json'
    put(A/'openapi.json',api);put(A/'schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','components':{'schemas':schemas}})
    changed=['previewImportInput','getSyncStateOutput']
    put(A/'revision.json',{'id':rev,'status':'DESIGN_NOT_IMPLEMENTED','operations':len(api['paths']),'schemas':len(schemas),'openapiSha256':sha(A/'openapi.json'),'previousOpenapiSha256':sha(priorApi)})
    put(A/'revision-diff.json',{'from':'FW-API-T1-D1J2-003','to':rev,'addedOperations':added,
      'changedInheritedSchemas':changed,'inheritedSchemasUnchanged':len(oldapi['components']['schemas'])-len(changed),
      'newSchemas':8,'unchangedOperationsExceptRevisionMetadata':151,'wireBreakingInUnreleasedTarget':True,'consumerMigration':'NOT_RUN'})
    examples=[]
    for name in added:
      inp={'accountIds':None,'page':{'cursor':None,'pageSize':50}}
      if name=='listCoverageGaps':inp.update(periodStart=None,periodEndExclusive=None)
      item={'accountId':'SYN_ACCOUNT','trackingStart':'2026-10-01','lastObserved':'2026-10-09T09:00:00Z','lastAck':None,'gapCount':1,'hasOpenGap':True} if name=='listCoverage' else {'id':'SYN_GAP','accountId':'SYN_ACCOUNT','sourceId':'SYN_SOURCE','deviceId':None,'start':'2026-10-09T09:00:00Z','end':None,'reason':'NETWORK_GAP'}
      data={'items':[item],'page':{'nextCursor':None,'snapshotId':'SYN_COVERAGE_SNAPSHOT','asOf':'2026-10-09T10:00:00Z','coverageVersion':8,'recoveryEpoch':2}}
      examples.append({'operationId':name,'request':{'contractVersion':'2.0.0','requestId':'SYN_REQ_'+name,'workspaceId':'SYN_WS','operationId':name,'input':inp,'mutation':None},
        'reply':{'contractVersion':'2.0.0','requestId':'SYN_REQ_'+name,'workspaceVersion':7,'data':data}})
    inherited=json.loads((R/'docs/contracts/v2-t1-r2/examples.json').read_text(encoding='utf-8'))
    for name in ['getSyncState','previewImport']:
      ex=copy.deepcopy(next(v for v in inherited if v['operationId']==name))
      if name=='getSyncState':ex['reply']['data'].update(coverageComplete=True,deviceIdsComplete=True)
      else:ex['request']['input']['mapping'].update(date='Date',amount='Amount',description='Description',reference='Reference')
      examples.append(ex)
    put(A/'examples.json',examples)
    for file in ['operation-permissions.csv','operation-security-overlay.csv']:
      rows=list(csv.DictReader((R/'docs/domain'/file).open(encoding='utf-8')))
      for row in rows:
        if 'apiRevision' in row:row['apiRevision']=rev;row['authority']='ARCH09 operation-permissions.csv + inherited ARCH06 protocol'
      template=next(row for row in rows if row['operation']=='getSyncState')
      for name in added:
        row=copy.deepcopy(template);row['operation']=name
        if 'path' in row:row['path']='/v2/operations/'+name;row['objectScope']='Current owner/workspace + every account filter; cursor scope/epoch/version and private snapshot authorization'
        rows.append(row)
      with (D/file).open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    policy={'id':'FW-ASYNC-J2-001','date':'2026-10-09','status':'DESIGN_RUNTIME_NOT_RUN',
      'delivery':'AT_LEAST_ONCE','financialEffects':'ATOMIC_DOMAIN_DEDUPE_NOT_EXACTLY_ONCE_NETWORK',
      'queueAuthority':'jobs','library':'pg narrow SQL ports; no external queue or Redis',
      'clock':'DB clock_timestamp after locks; monotonic elapsed supervisor timers',
      'dispatch':{'hostTickSeconds':60,'idleScanSeconds':5,'busyScanSeconds':1,'batchMax':20,
        'perWorkspaceRunningMax':3,'cpuForecastPoolSize':1,'notify':'OPTIONAL_WAKEUP_ONLY',
        'ordering':'available capability slots, rotating workspace lanes; due/created/id inside lane',
        'allTimings':'STARTING_CONFIG_NOT_MEASURED_SLO'},
      'retry':{'algorithm':'equal_jitter','baseSeconds':5,'capSeconds':900,
        'retryAfter':'MAX_BACKOFF_AND_SERVER_FLOOR; never cap a provider floor downward',
        'transactionAttemptsMax':3,'manualExtraCyclesMax':2,'resetAttemptCount':False,
        'permanent':['AUTH_REVOKED','CONSENT_REVOKED','RECOVERY_FENCE','DIGEST_CONFLICT','INVALID_INPUT','PREVIEW_STALE'],
        'transient':['NETWORK_UNKNOWN','UPSTREAM_5XX','TEMPORARY_UNAVAILABLE','LEASE_EXPIRED'],
        'quota':'Reserve before each provider call; unknown outcome consumes quota; no auto paid fallback'},
      'schedule':{'timezone':'Asia/Ho_Chi_Minh','dailyPriceLocalTime':'18:00:00',
        'catchUp':'latest due occurrence only; historical quote backfill separate rights-gated task',
        'manualCooldownSeconds':60,'coalesce':'exact compatible entitlement/profile/instrument set and unfinished outcome',
        'advanceWatermark':'atomic domain+enqueue or explicit missed/disabled disposition; never from last_success'},
      'native':{'batchItemsMax':50,'batchBytesMax':262144,'unackedItemsMax':1000,
        'unackedBytesMax':8388608,'unackedAutoRetryDays':7,'ackReplayDays':7,
        'ackReplayItemsMax':1000,'ackReplayBytesMax':8388608,'overdueQuarantineDays':7,
        'overflow':'PAUSE_CAPTURE_AND_EXPLICIT_COVERAGE_GAP_NO_SILENT_EVICTION',
        'backgroundBackoffSecondsMin':30,'periodicSafetyMinutes':15,
        'restoreMissing':'INVESTIGATE_NOT_AUTO_REPOST','oldOwnerRetag':False,'rawUpload':False},
      'sync':{'workspaceForegroundSeconds':20,'pendingSeconds':[1,2,4,8,15],
        'jitterFraction':0.2,'slowPendingAfterSeconds':120,'slowPendingSeconds':30,
        'backgroundPoll':False,'singleFlight':True,'readAdvancesJobs':False,
        'ordering':'session/workspace generation + recovery epoch before financial/object versions',
        'offline':'native capture allowed under live local consent; owner financial writes need online preview/commit'},
      'recovery':'ARCH07 locked restore/witness first; old jobs/tokens fenced; no automatic financial replay',
      'runtime':'SQL/concurrency/provider/native/heartbeat/cancellation/performance/security NOT_RUN'}
    put(D/'async-policy.json',policy)
    specs=[
      ('ingestion','ingestion_receipt','ingestion_receipts','IngestionWorker','processIngestionReceipt','receiptId',60,5,30,8,604800,2),
      ('price_refresh','refresh_job','refresh_jobs','MarketWorker','executePriceRefresh','jobId',90,15,60,5,21600,2),
      ('import','import_job','import_jobs','ImportWorker','executeImportJob','importJobId',90,15,60,3,86400,1),
      ('agent_step','agent_run','agent_runs','AgentWorker','executeAgentStep','runId',90,15,60,3,86400,1),
      ('assistant_message','assistant_message','messages','AgentWorker','executeAssistantMessage (local port)','messageId',90,15,60,3,86400,1),
      ('forecast','forecast_run','forecast_runs','ForecastWorker','executeForecastRun','runId',120,25,600,3,86400,1)]
    registry=[]
    for typ,kind,table,profile,port,selector,lease,hb,active,attempts,age,slots in specs:
      registry.append({'jobType':typ,'domainKind':kind,'domainTable':table,'workerProfile':profile,
        'executionPort':port,'selector':selector,'policyVersion':policy['id'],
        'leaseSeconds':lease,'heartbeatSeconds':hb,'maxActiveSecondsPerAttempt':active,
        'automaticAttemptsMax':attempts,'deadlineFromCreatedSeconds':age,'profileConcurrencyMax':slots,
        'ticketFields':['workspaceId','dispatchJobId','generation','leaseToken','recoveryEpoch',selector],
        'dedupe':'Immutable domain identity; agent continuations additionally question/answer version; no attempt number',
        'payloadInJobs':False,'runtime':'NOT_RUN'})
    put(D/'job-registry.json',{'id':'FW-J2-REGISTRY-001','status':'DESIGN_ONLY','jobs':registry,
      'globalMaintenance':'scheduler_state / scoped host lock and bounded pages; no fake tenant jobs',
      'profileNames':'Logical capabilities, not new OpenAPI security schemes; exact principal binding mandatory'})
    transitions=[
      ('queued','claim','running','due + capacity + current authority + attempts<max + deadline'),
      ('running','heartbeat','running','exact live ticket; no resurrection; within attempt deadline'),
      ('running','checkpoint','running','same live ticket + input/model digest; no public result'),
      ('running','domain_committed','succeeded','domain result/marker already durable; no duplicate effect'),
      ('running','transient_failure','queued','remaining attempts and deadline; clear lease; set next_attempt_at'),
      ('running','lease_expired','queued','invalidate ticket; remaining budget; no claim until capacity'),
      ('running','budget_exhausted','failed','clear lease; allowlisted safe error'),
      ('running','permanent_failure','failed','clear lease; never broaden capability'),
      ('queued','cancel_before_claim','cancelled','authorized supported cancellation; no committed effect'),
      ('running','cancel_requested','running','persist cancellation; block new work/publication; committed result wins'),
      ('running','cancel_ack','cancelled','live fenced ticket; no domain commit already won'),
      ('failed','manual_retry','queued','current safe policy + transient + max2cycles + same identity/deadline'),
      ('queued','deadline_exceeded','failed','no new attempt; preserves domain identity'),
      ('running','deadline_exceeded','failed','fence publication; no rollback of previously committed facts')]
    with (D/'job-transitions.csv').open('w',encoding='utf-8',newline='') as f:
      w=csv.writer(f);w.writerow(['from','event','to','guard']);w.writerows(transitions)
    previous=R/'docs/data/target-t1-domain/target-model.json';m=copy.deepcopy(json.loads(previous.read_text(encoding='utf-8')))
    m['id']='FW-PHYS-T1-ASYNC-005';m['previousSha256']=sha(previous)
    m['warning']='ARCH09 expand design; inherited declarations/indexes historical, not executable DDL or active legacy queues.'
    tables={t['name']:t for t in m['tables']}
    tables['jobs']['columns'] += [col('policy_version','text','Immutable registered policy snapshot at enqueue'),col('deadline_at','timestamptz','Absolute job admission deadline; retries never extend it')]
    tables['jobs'].setdefault('targetRules',[]).extend([
      'Known policy_version; deadline_at>created_at; max_attempts bounded by pinned profile and authorized retry cycles',
      'Claim/finalize lock workspace authorization/recovery anchor before jobs row; recheck DB wall time after locks',
      'Successful checkpoints/heartbeat keep attempt_count unchanged; attempts increment on claim only',
      'Reaper invalidates old ticket, finalizes prior attempt, clears both lease fields atomically; no direct dispatcher finance SELECT'])
    tables['refresh_jobs']['columns'].append(col('request_payload_id','text','Frozen authorized selection/profile/rights/normalization and request digest'))
    tables['refresh_jobs'].setdefault('targetRules',[]).append('request payload typed Market refresh_input bound to job/workspace; no live holdings re-selection or silent cross-entitlement coalescing')
    tables['import_rows'].setdefault('targetRules',[]).append('Confirmed selected rows pinned atomically until import terminal/replay policy; 24h preview cleanup cannot destroy pending selected work')
    tables['agent_runs'].setdefault('targetRules',[]).append('Reserve active_millis/tool_calls before model/tool call under live run ticket; crash/unknown reservations are not refunded; clarification waits release lease')
    quota={'name':'provider_quota_buckets','owner':'MarketQuota','tenant':False,'stage':'ARCH09_NEW_DESIGN',
      'columns':[col('id','text','Opaque bucket ID'),col('created_at','timestamptz','UTC creation'),
        col('namespace_digest','text','Keyed opaque credential/license/scope namespace, never a public user/provider key'),
        col('window_start','timestamptz','Provider contract window start'),col('window_end','timestamptz','Exclusive provider contract window end'),
        col('limit_value','bigint','Approved hard call quota; zero disables'),col('reserved_count','bigint','Conservatively charged calls including unknown outcomes'),
        col('cooldown_until','timestamptz','Persisted Retry-After floor',True),col('version','bigint','Serialized bucket version'),col('updated_at','timestamptz','UTC update')],
      'rules':['PRIMARY KEY(id)','UNIQUE(namespace_digest,window_start,window_end)',
        'window_end>window_start; 0<=reserved_count<=limit_value; version>0',
        'Reserve all applicable shared-credential and entitlement buckets atomically in stable namespace order',
        'Namespace and approved window/quota resolved by trusted MarketQuota port, not caller input',
        'No owner/admin/Agent/dispatcher direct SELECT; sanitized aggregate export only'],
      'retention':'Keep at least through window_end and 7d audit; longer active cooldown survives window cleanup; erase scoped namespaces by ARCH07 inventory'}
    m['tables'].append(quota)
    m['foreignKeys'].append({'table':'refresh_jobs','columns':['workspace_id','request_payload_id'],
      'target':'payload_objects','targetColumns':['workspace_id','id'],'source':'ARCH09_EXPAND_DESIGN'})
    m['targetIndexes']=[{'table':'jobs','columns':['job_type','next_attempt_at','created_at','workspace_id','id'],'where':"state='queued'",'purpose':'J2 due scan, never domain legacy queue'},
      {'table':'jobs','columns':['lease_until','workspace_id','id'],'where':"state='running'",'purpose':'bounded expired lease reaper'},
      {'table':'provider_quota_buckets','columns':['namespace_digest','window_start','window_end'],'unique':True,'purpose':'serialized shared limits'}]
    put(B/'target-model.json',m)
    put(B/'revision.json',{'id':m['id'],'status':'EXPAND_DESIGN_SQL_NOT_RUN','tables':len(m['tables']),
      'columns':sum(len(t['columns']) for t in m['tables']),'foreignKeys':len(m['foreignKeys']),
      'newTables':1,'addedExistingColumns':3,'modelSha256':sha(B/'target-model.json'),'previousModelSha256':sha(previous)})
    classes=list(csv.DictReader((R/'docs/domain/table-data-classification.csv').open(encoding='utf-8')))
    classes.append({'table':'provider_quota_buckets','owner':'MarketQuota','classification':'operational_restricted',
      'storage':'Encrypted T1 PG; keyed namespace; narrow quota reservation procedures','opsExposure':'DENY_DIRECT',
      'modelExposure':'DENY','backup':'Encrypted privileged T1 export; locked restore and scoped erasure inventory','status':'DESIGN_NOT_GRANTS'})
    with (D/'table-data-classification.csv').open('w',encoding='utf-8',newline='') as f:
      w=csv.DictWriter(f,fieldnames=list(classes[0]));w.writeheader();w.writerows(classes)
    put(D/'implementation-bundle.json',{'id':'FW-ASYNC-BUNDLE-20261009','status':'DESIGN_ONLY',
      'apiRevision':rev,'apiSha256':sha(A/'openapi.json'),
      'databaseRevision':m['id'],'databaseModelSha256':sha(B/'target-model.json'),
      'asyncPolicy':policy['id'],'asyncPolicySha256':sha(D/'async-policy.json'),'registrySha256':sha(D/'job-registry.json'),
      'engineBundleSha256':sha(R/'docs/domain/implementation-bundle.json'),
      'securityPolicySha256':sha(R/'docs/security/t1/security-policy.json'),
      'securityBindingAddendum':{'baseDomainDatabaseRevision':'FW-PHYS-T1-DOMAIN-004','currentDatabaseRevision':m['id'],
        'baseApiRevision':'FW-API-T1-D1J2-003','currentApiRevision':rev,
        'permissionMatrixSha256':sha(D/'operation-permissions.csv'),
        'operationOverlaySha256':sha(D/'operation-security-overlay.csv'),
        'tableClassificationSha256':sha(D/'table-data-classification.csv'),
        'newQuotaAccess':'MarketQuota narrow broker only; API Ops cannot select private bucket rows'},
      'runtime':'NOT_RUN'})
    print(json.dumps({'tables':len(m['tables']),'columns':sum(len(t['columns']) for t in m['tables']),
      'foreignKeys':len(m['foreignKeys']),'registeredTenantJobs':len(registry),'operations':len(api['paths']),'schemas':len(schemas)}))

if __name__=='__main__':main()
