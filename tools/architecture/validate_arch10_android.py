"""Static/schema/model-only validation. Does not execute Android/backend/SQL/crypto."""
from pathlib import Path
from copy import deepcopy
import csv, hashlib, json, re, sys
R=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(R/'work/handover-deps'))
from jsonschema import Draft202012Validator, FormatChecker

D=R/'docs/android'; E=R/'docs/execution/evidence/arch-10-android-2026-10-09'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def write(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    checks=[]
    def ck(name,ok,detail=None):
        checks.append({'name':name,'status':'PASS' if ok else 'FAIL','detail':detail})
    protected=read(E/'preservation-before.json')['files']
    drift=[n for n,h in protected.items() if not (R/n).exists() or sha(R/n)!=h]
    ck('Protected prior source/packages/evidence/baselines hashes',not drift,{'files':len(protected),'drift':drift})
    source=read(E/'source-observations.json')
    ck('Selected source observations still exact',all(sha(R/n)==h for n,h in source['files'].items()))
    p=read(D/'android-policy.json');bundle=read(D/'implementation-bundle.json')
    ck('Bundle pins exist and match',all(sha(R/v['path'])==v['sha256'] for v in bundle['files'].values()))
    api=read(R/'docs/contracts/v2-t1-r4/openapi.json')
    ck('API004 unchanged count',len(api['paths'])==153 and len(api['components']['schemas'])==634)
    ck('Exact API/DB revision retained',p['apiRevision']=='FW-API-T1-D1J2-004' and p['databaseRevision']=='FW-PHYS-T1-ASYNC-005')
    ck('Room not a PostgreSQL revision',not read(D/'local-model.json')['postgresChanges'] and len(read(D/'local-model.json')['tables'])==8)
    ck('Raw privacy policy',all(p['rawNotification'][x] is False for x in ('persist','upload','log','model')))
    ck('Bounded outbox and batches',p['outbox']=={'maxItems':1000,'maxBytes':8388608,'unackedBudgetIncludesQuarantine':True,'autoRetryDays':7,'quarantineAdditionalDays':7,'maxBatchItems':50,'maxEnvelopeBytes':262144})
    ck('Bounded ACK no auto reingest',p['ackReplay']=={'maxItems':1000,'maxBytes':8388608,'maxAgeDays':7,'autoReingestMissing':False})
    ck('Work timing honest',p['work']=={'periodicMinutes':15,'backoffSeconds':30,'scopedUploaders':1,'exactTimingGuarantee':False})
    ck('AFU keys and clock honest',not p['keys']['backgroundPerUseBiometric'] and not p['keys']['strongBoxGuaranteed'] and not p['clock']['physicalDeletionWhileOffGuaranteed'])
    ck('REAL release gates unresolved not invented',p['realBuildGates']=={'appId':None,'apiHttpsOrigin':None,'releaseCertificate':None,'verifiedDeviceMatrix':False,'verifiedSourceCatalog':False})
    ck('Distribution no account/fee commitment',not p['distribution']['commercialEligibilityConfirmed'] and not p['distribution']['accountCreated'])
    mapping=read(D/'consumer-operation-map.json')
    rows=list(csv.DictReader((R/'docs/async/operation-permissions.csv').open(encoding='utf-8')))
    actors={x['operation']:x['actor'] for x in rows}
    groups=['ownerBroker','nativeIdentityHandlers','managedEnrollmentHandlers','backgroundCollector']
    flat=[op for group in groups for op in mapping[group]]
    ck('Mapped operations exist unique',len(flat)==len(set(flat)) and all(op in actors for op in flat),{'mapped':len(flat),'ownerBroker':len(mapping['ownerBroker'])})
    ck('Owner broker only owner/current-session ops',all(actors[op] in ('owner','owner-session') for op in mapping['ownerBroker']))
    expected={op for op,actor in actors.items() if actor in ('owner','owner-session')}-{ 'renewSession'}
    actual=set(mapping['ownerBroker']+mapping['nativeIdentityHandlers']+mapping['managedEnrollmentHandlers'])
    ck('All owner features retain a native route',expected<=actual,{'missing':sorted(expected-actual)})
    ck('Background exact least privilege',mapping['backgroundCollector']==['ingestNotifications','reconcileReceipts','renewCollectorCredential'] and all(actors[op] in ('device','device-renew') for op in mapping['backgroundCollector']))
    ck('Auth/secret ops not generic',all(op not in mapping['ownerBroker'] for op in ['verifyNativeIdentityChallenge','renewNativeSession','registerDevice','issueCollectorCredential','rotateOwnerRecoveryCodes','signOut','renewSession']))
    schemas=read(D/'native-bridge-schemas.json')
    Draft202012Validator.check_schema(schemas)
    ck('Native bridge metaschema',True,{'definitions':len(schemas['$defs'])})
    legacy=schemas['$defs']['LegacyStatus']
    old_source=(R/'finweave-web/src/native/collector.ts').read_text(encoding='utf-8')
    exact=['permission','consented','network','enrolled','ownerBound','lastObserved','lastAck','pausedReason','queue']
    ck('Legacy strict key projection preserved',set(legacy['properties'])==set(exact) and not legacy['additionalProperties'] and all(x+':' in old_source for x in exact))
    ck('Broker enum agrees operation map',schemas['$defs']['OwnerInvocation']['properties']['operationId']['enum']==mapping['ownerBroker'])
    ts='2026-10-09T12:00:00Z'
    good={
      'LegacyQueueItem':{'id':'item1','state':'pending','observedAt':ts,'source':'synthetic','reason':None,'retryAfter':None},
      'LegacyStatus':{'permission':'granted','consented':True,'network':'online','enrolled':True,'ownerBound':True,'lastObserved':None,'lastAck':None,'pausedReason':None,'queue':[]},
      'Capabilities':{'bridgeRevision':'FW-NATIVE-BRIDGE-002','apiRevision':'FW-API-T1-D1J2-004','profile':'SYNTHETIC','buildId':'design-fixture','requiredConsentVersion':'fixture-v1','nativeAvailable':True},
      'StatusV2':{'bridgeRevision':'FW-NATIVE-BRIDGE-002','generation':1,'checkedAt':ts,'permission':'granted','network':'online','enrolled':True,'ownerBound':True,'listenerBound':True,'consent':'accepted','vault':'ready','clock':'trusted','readiness':'ready','reason':None,'pendingCount':0,'pendingBytes':0,'quarantineCount':0,'ackReplayCount':0,'queueTruncated':False,'lastObserved':None,'lastAck':None,'physicalPurgeOverdue':False,'revokePending':False},
      'ConfigureCapture':{'generation':1,'consentVersion':'fixture-v1','bindingIds':['binding1']},
      'ListQueueInput':{'generation':1,'cursor':None,'pageSize':100},
      'QueuePage':{'generation':1,'items':[],'nextCursor':None},
      'OwnerInvocation':{'generation':1,'operationId':'listAccounts','input':{'includeArchived':False,'page':{'cursor':None,'pageSize':50}},'idempotencyKey':None},
      'BridgeError':{'code':'CLOCK_UNTRUSTED','retryAfter':None},
    }
    fixtures=[]
    for name,value in good.items():fixtures.append({'name':name+'_valid','schema':name,'value':value,'expectedValid':True})
    mutations=[('LegacyStatus','accessToken','secret'),('LegacyStatus','queue',[good['LegacyQueueItem']]*101),('LegacyStatus','permission','maybe'),('LegacyQueueItem','observedAt','yesterday'),('LegacyQueueItem','rawText','OTP'),('Capabilities','apiRevision','FW-API-T1-D1J2-003'),('Capabilities','nativeAvailable',False),('ConfigureCapture','bindingIds',['a','a']),('ConfigureCapture','generation',0),('ConfigureCapture','ownerId','other'),('ListQueueInput','pageSize',101),('ListQueueInput','cursor','x'*1025),('QueuePage','items',[good['LegacyQueueItem']]*101),('StatusV2','pendingCount',1001),('StatusV2','pendingBytes',8388609),('StatusV2','listenerBound','yes'),('StatusV2','checkedAt','invalid'),('OwnerInvocation','operationId','renewCollectorCredential'),('OwnerInvocation','url','https://attacker.invalid'),('OwnerInvocation','headers',{'Authorization':'secret'}),('OwnerInvocation','operationId','rotateOwnerRecoveryCodes'),('BridgeError','code','SQL_RAW_ERROR')]
    for i,(name,key,value) in enumerate(mutations,1):
      bad=deepcopy(good[name]);bad[key]=value
      fixtures.append({'name':f'{name}_negative_{i}','schema':name,'value':bad,'expectedValid':False})
    results=[]
    for f in fixtures:
      schema={'$schema':schemas['$schema'],'$defs':schemas['$defs'],'$ref':'#/$defs/'+f['schema']}
      errors=list(Draft202012Validator(schema,format_checker=FormatChecker()).iter_errors(f['value']))
      actual=not errors
      results.append({'case':f['name'],'actualValid':actual,'expectedValid':f['expectedValid'],'status':'PASS' if actual==f['expectedValid'] else 'FAIL'})
    # Outer broker shape is not sufficient: exact pinned API input schema validation required.
    api_schemas=api['components']['schemas']
    handlers=read(D/'managed-handler-contract.json')['handlers']
    handler_ok=len(handlers)==15 and {x['operationId'] for x in handlers}==set(mapping['nativeIdentityHandlers']+mapping['managedEnrollmentHandlers'])
    for h in handlers:
      parts=[h['uiInputFields'],h['nativeDialogOnlyFields'],h['nativeInjectedInputFields']]
      fields=[k for part in parts for k in part]
      expected_fields=set(api_schemas[h['operationId']+'Input'].get('properties',{}))
      handler_ok=handler_ok and len(fields)==len(set(fields)) and set(fields)==expected_fields
      handler_ok=handler_ok and not (set(h['nativeConsumedResponseFields']) & set(h['jsResponseProjectionFields']))
      handler_ok=handler_ok and h['uiPayloadAdditionalProperties'] is False
    ck('15 managed auth/enrollment field maps exact no secret projection',handler_ok)
    list_accounts={'components':api['components'],'$ref':'#/components/schemas/listAccountsInput'}
    input_ok=not list(Draft202012Validator(list_accounts).iter_errors(good['OwnerInvocation']['input']))
    input_bad=bool(list(Draft202012Validator(list_accounts).iter_errors({**good['OwnerInvocation']['input'],'ownerId':'other'})))
    ck('Bridge schema examples/negative cases',all(x['status']=='PASS' for x in results),{'positive':len(good),'negative':len(mutations)})
    ck('Broker exact API input needed and rejects injected owner',input_ok and input_bad)
    write(D/'bridge-examples.json',{'scope':'Synthetic schema fixtures only; no Android or actual API execution','cases':fixtures})
    write(E/'bridge-schema-validation.json',{'status':'PASS' if all(x['status']=='PASS' for x in results) else 'FAIL','runtime':'NOT_RUN','results':results})
    trace=read(D/'requirement-traceability.json')['requirements']
    ck('32 requirement/acceptance links unique all NOT RUN',len(trace)==32 and len({x['id'] for x in trace})==32 and len({x['acceptanceId'] for x in trace})==32 and all(x['runtime']=='NOT_RUN' for x in trace))
    research=read(D/'research-sources.json')
    ck('Primary-source research dated',research['asOf']=='2026-10-09' and len(research['sources'])==14 and all(x['url'].startswith(('https://developer.android.com/','https://capacitorjs.com/','https://support.google.com/')) for x in research['sources']))
    docs=read(E/'current-documents.json')['files']
    links=[];broken=[]
    paths=list(D.glob('*.md'))+[R/'docs/architecture/ARCH-10-change-report.md',R/'docs/architecture/adr/ADR-017-android-native-collector-and-signed-apk.md']
    for name in docs:
      path=R/name;content=path.read_text(encoding='utf-8');selected=[];active=False
      for line in content.splitlines():
        if line.startswith('#'):active='ARCH-10' in line
        if active or 'ARCH-10' in line:selected.append(line)
      links.append({'file':name,'hasArch10':bool(selected),'sha256':sha(path)})
      for target in re.findall(r'\]\(([^)]+)\)','\n'.join(selected)):
        if not target.startswith(('http:','https:','#')) and not (path.parent/target.split('#')[0]).resolve().exists():broken.append({'file':name,'target':target})
    for path in paths:
      for target in re.findall(r'\]\(([^)]+)\)',path.read_text(encoding='utf-8')):
        if not target.startswith(('http:','https:','#')) and not (path.parent/target.split('#')[0]).resolve().exists():broken.append({'file':path.relative_to(R).as_posix(),'target':target})
    ck('26 current documents synced scoped links',len(links)==26 and all(x['hasArch10'] for x in links) and not broken,{'brokenLinks':broken})
    write(E/'document-sync-validation.json',{'scope':'ARCH10 notices/sections current docs and all new Android/ADR/report links, not historical links','files':links,'brokenLinks':broken,'runtime':'NOT_RUN'})
    # Independent explicit input/expected examples; interpreter is a specification model, not production code.
    vectors=[]
    base={'native':True,'consent':True,'permission':True,'bound':True,'vault':True,'clock':True,'authorization':True,'source':True,'capacity':True,'generation':True}
    vectors.append({'id':'ready_all','kind':'ready','input':base,'expected':True})
    for flag in base:
      x=base.copy();x[flag]=False;vectors.append({'id':'ready_denies_'+flag,'kind':'ready','input':x,'expected':False})
    for label,x,expected in [
      ('under7d',{'upperAge':604799,'anchor':True,'sameBoot':True},True),
      ('at7d',{'upperAge':604800,'anchor':True,'sameBoot':True},False),
      ('over7d',{'upperAge':604801,'anchor':True,'sameBoot':True},False),
      ('unknownTime',{'upperAge':3,'anchor':False,'sameBoot':True},False),
      ('rebootOffline',{'upperAge':3,'anchor':False,'sameBoot':False},False),
      ('rebootReanchored',{'upperAge':3,'anchor':True,'sameBoot':False},True),
      ('negativeAge',{'upperAge':-1,'anchor':True,'sameBoot':True},False),
      ('ageUncertaintyPastDeadline',{'upperAge':604801,'anchor':True,'sameBoot':True},False)]:
      vectors.append({'id':label,'kind':'eligible','input':x,'expected':expected})
    for label,x,expected in [
      ('sameScope',{'owner':['A','A'],'workspace':['W','W'],'device':['D','D'],'epoch':[1,1],'generation':[2,2]},True),
      ('differentOwner',{'owner':['A','B'],'workspace':['W','W'],'device':['D','D'],'epoch':[1,1],'generation':[2,2]},False),
      ('differentWorkspace',{'owner':['A','A'],'workspace':['W','Z'],'device':['D','D'],'epoch':[1,1],'generation':[2,2]},False),
      ('differentDevice',{'owner':['A','A'],'workspace':['W','W'],'device':['D','X'],'epoch':[1,1],'generation':[2,2]},False),
      ('revokedEpoch',{'owner':['A','A'],'workspace':['W','W'],'device':['D','D'],'epoch':[1,2],'generation':[2,2]},False),
      ('lateResponseGeneration',{'owner':['A','A'],'workspace':['W','W'],'device':['D','D'],'epoch':[1,1],'generation':[1,2]},False)]:
      vectors.append({'id':label,'kind':'scope','input':x,'expected':expected})
    ack={'durable':True,'scope':True,'requestBound':True,'itemRevision':True,'digest':True}
    vectors.append({'id':'ackExact','kind':'ack','input':ack,'expected':True})
    for flag in ack:
      x=ack.copy();x[flag]=False;vectors.append({'id':'ackDeny_'+flag,'kind':'ack','input':x,'expected':False})
    # A digest-absent reply is accepted only through exact immutable request binding (separate case).
    vectors.append({'id':'ackNoDigestExactRequest','kind':'ackNoDigest','input':{'durable':True,'scope':True,'requestBound':True,'itemRevision':True},'expected':True})
    vectors.append({'id':'ackNoDigestUnbound','kind':'ackNoDigest','input':{'durable':True,'scope':True,'requestBound':False,'itemRevision':True},'expected':False})
    for count,size,expected in [(50,262144,True),(51,262144,False),(50,262145,False),(1,1500,True),(0,100,False),(1,0,False)]:
      vectors.append({'id':f'batch_{count}_{size}','kind':'batch','input':{'count':count,'bytes':size},'expected':expected})
    for label,gates,expected in [('all', [True]*5,True),('missingOrigin',[True,False,True,True,True],False),('missingCert',[True,True,False,True,True],False),('unverifiedSource',[True,True,True,True,False],False)]:
      vectors.append({'id':'release_'+label,'kind':'release','input':gates,'expected':expected})
    def model(v):
      x=v['input'];kind=v['kind']
      if kind in ('ready','ack','ackNoDigest'):return all(value is True for value in x.values())
      if kind=='scope':return all(pair[0]==pair[1] for pair in x.values())
      if kind=='eligible':return x['anchor'] and 0<=x['upperAge']<p['outbox']['autoRetryDays']*86400
      if kind=='batch':return 0<x['count']<=p['outbox']['maxBatchItems'] and 0<x['bytes']<=p['outbox']['maxEnvelopeBytes']
      if kind=='release':return all(x)
      raise ValueError(kind)
    vr=[]
    for v in vectors:
      value=model(v);vr.append({'id':v['id'],'expected':v['expected'],'actual':value,'status':'PASS' if value==v['expected'] else 'FAIL'})
    write(D/'model-vectors.json',{'scope':'Independent expected model-only examples; not Android/backend/SQL/crypto functions','vectors':vectors})
    write(E/'model-validation.json',{'scope':'Python specification interpreter only, not production implementation','status':'PASS' if all(x['status']=='PASS' for x in vr) else 'FAIL','count':len(vr),'runtime':'NOT_RUN','results':vr})
    ck('Specification models (not implementation)',all(x['status']=='PASS' for x in vr),{'vectors':len(vr)})
    status='PASS' if all(x['status']=='PASS' for x in checks) else 'FAIL'
    write(E/'static-validation.json',{'date':'2026-10-09','status':status,'scope':'Artifacts/source-hash/schema/links/model-only checks','checks':checks,'count':len(checks),'runtime':'NOT_RUN','apk':'NOT_BUILT'})
    print(json.dumps({'status':status,'checks':len(checks),'schemaPositive':len(good),'schemaNegative':len(mutations),'modelVectors':len(vr),'protected':len(protected)}))
    if status!='PASS':
      print(json.dumps([x for x in checks if x['status']=='FAIL'],ensure_ascii=False));sys.exit(1)

if __name__=='__main__': main()
