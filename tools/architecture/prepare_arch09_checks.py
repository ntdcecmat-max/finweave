"""Author ARCH09 specification fixtures and traceability; not a backend or device test."""
from pathlib import Path
import copy,csv,hashlib,json
R=Path(__file__).resolve().parents[2];D=R/'docs/async';E=R/'docs/execution/evidence/arch-09-async-2026-10-09'
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()

def main():
    reqs=[
      ('Sole J2 authority','queue-protocol.md','BE-17','AC-36/37'),
      ('Atomic domain acceptance/enqueue','queue-protocol.md','BE-08/09/17','AC-15/16/36'),
      ('Typed capability/ticket','queue-protocol.md','BE-17/18','AC-36/37/41'),
      ('Workspace-before-job lock order','queue-protocol.md','BE-17/18','AC-36/41'),
      ('DB wall-clock/live lease','queue-protocol.md','BE-17','AC-36/37'),
      ('Heartbeat and immutable deadlines','queue-protocol.md','BE-17','AC-36/37'),
      ('Atomic effect/result/replay','queue-protocol.md','BE-03/08/09/17','AC-08/15/16/36'),
      ('Bounded retry and floors','queue-protocol.md','BE-17','AC-36/37'),
      ('Capacity/pause/fairness','queue-protocol.md','BE-16/17','AC-37/41'),
      ('Supported cancellation races','queue-protocol.md','BE-15/17','AC-28/38/39/40'),
      ('Native immutable identity/digest','notification-sync.md','BE-08/19','AC-36'),
      ('ACK pairing and mixed rejection','notification-sync.md','BE-08/19','AC-36'),
      ('Transport vs semantic dedupe','notification-sync.md','BE-03/08/09','AC-15/16/36'),
      ('Current epoch/binding/consent','notification-sync.md','BE-08/18/19','AC-36/41'),
      ('Bounded encrypted pending/replay/quarantine','notification-sync.md','BE-18/19','AC-36'),
      ('Native background independent WebView','notification-sync.md','BE-19','AC-36'),
      ('Restore missing fail-closed','notification-sync.md','BE-18/19/21','AC-36/41'),
      ('Daily server scheduler','price-scheduler.md','BE-06/07/17','AC-34/35'),
      ('Frozen refresh and exact coalesce','price-scheduler.md','BE-06/07/17','AC-34/35'),
      ('Persistent shared quota/cooldown','price-scheduler.md','BE-06/07/17/18','AC-34/35/41'),
      ('Partial/last-good/fenced publish','price-scheduler.md','BE-05/06/07','AC-34/35'),
      ('Watermark and bounded catch-up','price-scheduler.md','BE-17','AC-34/35'),
      ('Atomic selected import/pins','workflow-lifecycles.md','BE-09','AC-16/17/18'),
      ('Inherited Assistant/message work','workflow-lifecycles.md','BE-15/17','AC-27/28'),
      ('Agent continuation/cumulative budget','workflow-lifecycles.md','BE-15/17','AC-38/39/40'),
      ('Forecast compute/checkpoint/publication','workflow-lifecycles.md','BE-13/14/17','AC-21/24/26/39'),
      ('Ops safe control/global retention','workflow-lifecycles.md','BE-16/18/21','AC-37/41'),
      ('Bounded typed polling','client-sync.md','BE-19','AC-28/34/35/36'),
      ('Session/recovery/control version ordering','client-sync.md','BE-02/12/19','AC-20/36/41'),
      ('Unknown command outcome','client-sync.md','BE-02/19','AC-08/36/39'),
      ('CSV selectors and paged coverage wire','contract-storage-addendum.md','BE-09/19/20','AC-16/36'),
      ('Preservation and truthful evidence','acceptance-plan.md','BE-20/21','AC-01…41')]
    with (D/'requirement-traceability.csv').open('w',encoding='utf-8',newline='') as f:
      w=csv.writer(f);w.writerow(['requirement','description','document','backend','parentAC','runtimeCase','status'])
      for i,(desc,doc,be,ac) in enumerate(reqs,1):w.writerow([f'ASY-{i:02d}',desc,doc,be,ac,f'ASN-{i:02d}','SPECIFIED_RUNTIME_NOT_RUN'])
    cases=[]
    def add(kind,title,inp,expected):cases.append({'id':f'AM-{len(cases)+1:02d}','kind':kind,'case':title,'input':inp,'expected':expected})
    ticket={'now':100,'leaseUntil':101,'generation':2,'token':'SYN_T','epoch':4,'domain':'SYN_D','workspace':'SYN_W','profile':'ForecastWorker','authorized':True,
      'expectedGeneration':2,'expectedToken':'SYN_T','expectedEpoch':4,'expectedDomain':'SYN_D','expectedWorkspace':'SYN_W','expectedProfile':'ForecastWorker'}
    add('fence','live exact ticket',ticket,True)
    for field,value,title in [('now',101,'equality is expired'),('now',102,'expired'),('generation',1,'stale generation'),('token','SYN_OLD','wrong token'),('epoch',3,'restore epoch'),('domain','SYN_OTHER','wrong domain'),('workspace','SYN_OTHER','wrong workspace'),('profile','AgentWorker','wrong capability'),('authorized',False,'revoked access')]:
      v=copy.deepcopy(ticket);v[field]=value;add('fence',title,v,False)
    for title,inp,out in [
      ('first equal-jitter lower',{'attempt':1,'u':'0','retryFloorMs':0,'deadlineMs':10000},2500),
      ('first equal-jitter upper',{'attempt':1,'u':'1','retryFloorMs':0,'deadlineMs':10000},5000),
      ('exponential capped',{'attempt':20,'u':'1','retryFloorMs':0,'deadlineMs':1000000},900000),
      ('provider floor exceeds cap',{'attempt':20,'u':'0','retryFloorMs':3600000,'deadlineMs':4000000},3600000),
      ('floor beyond deadline fails',{'attempt':1,'u':'0','retryFloorMs':60000,'deadlineMs':50000},None)]:add('retry',title,inp,out)
    for title,inp,out in [
      ('durable matching ACK',{'request':['A','B'],'reply':[('A','durable'),('B','rejected')],'bound':True},['A']),
      ('all rejected not ACK',{'request':['A'],'reply':[('A','rejected')],'bound':True},[]),
      ('missing identity retains whole uncertain batch',{'request':['A','B'],'reply':[('A','durable')],'bound':True},[]),
      ('duplicate ACK identity',{'request':['A','B'],'reply':[('A','durable'),('A','durable')],'bound':True},[]),
      ('foreign identity',{'request':['A'],'reply':[('B','durable')],'bound':True},[]),
      ('reply from wrong in-flight payload',{'request':['A'],'reply':[('A','durable')],'bound':False},[])]:add('ack',title,inp,out)
    for title,inp,out in [
      ('same transport and digest',{'sameTransport':True,'sameDigest':True,'trustedRef':False},'REPLAY'),
      ('same transport different digest',{'sameTransport':True,'sameDigest':False,'trustedRef':True},'CONFLICT'),
      ('equal amount/time weak identity',{'sameTransport':False,'sameDigest':True,'trustedRef':False},'REVIEW'),
      ('cross-device trusted reference',{'sameTransport':False,'sameDigest':False,'trustedRef':True},'LINK_EXISTING')]:add('dedupe',title,inp,out)
    for title,inp,out in [
      ('reserve shared and entitlement',{'used':[1,2],'limits':[3,5],'now':100,'cooldown':0},[2,3]),
      ('one bucket full denies all',{'used':[1,5],'limits':[3,5],'now':100,'cooldown':0},None),
      ('cooldown survives restart',{'used':[0],'limits':[5],'now':100,'cooldown':101},None),
      ('license quota0 denies',{'used':[0],'limits':[0],'now':100,'cooldown':0},None),
      ('unknown prior call remains charged',{'used':[4],'limits':[5],'now':100,'cooldown':0},[5])]:add('quota',title,inp,out)
    for title,utc,out in [('before local18','2026-10-09T10:59:59+00:00','2026-10-08'),('at local18','2026-10-09T11:00:00+00:00','2026-10-09'),('outage latest only','2026-10-16T11:00:00+00:00','2026-10-16')]:add('schedule',title,{'now':utc},out)
    sync={'localGeneration':2,'responseGeneration':2,'localEpoch':4,'responseEpoch':4,'localVersion':7,'responseVersion':8}
    add('sync','new financial version same epoch',sync,'ACCEPT')
    for field,value,out,title in [('responseVersion',6,'DROP','older financial'),('responseGeneration',1,'DROP','old owner session'),('responseEpoch',3,'DROP','old restore epoch'),('responseEpoch',5,'RECOVERY_GATE','new epoch even financial version may fall')]:
      v=copy.deepcopy(sync);v[field]=value;add('sync',title,v,out)
    for title,inp,out in [('finish already won',{'state':'succeeded','mode':'forecast'},'succeeded'),('running forecast request',{'state':'running','mode':'forecast'},'cancel_requested'),('queued forecast',{'state':'queued','mode':'forecast'},'cancelled'),('Agent terminal cancel',{'state':'running','mode':'agent'},'cancelled')]:add('cancel',title,inp,out)
    for title,inp,out in [('last free item slot',{'items':999,'bytes':0,'newBytes':100,'ageDays':0},'ENQUEUE'),('bytes exhausted',{'items':1,'bytes':8388608,'newBytes':1,'ageDays':0},'PAUSE_GAP'),('7day deadline',{'items':1,'bytes':100,'newBytes':0,'ageDays':7},'QUARANTINE')]:add('native_capacity',title,inp,out)
    for state,out in [('committed','READ_TYPED_STATUS'),('not_found','RETRY_SAME_KEY'),('unknown','INVESTIGATE_KEEP_IDENTITY')]:add('outcome',state,{'state':state},out)
    assert len(cases)==48
    put(D/'model-vectors.json',{'scope':'48 manually expected specification decisions; no DB/device/provider/worker execution','cases':cases})
    observations=[
      {'source':'docs/contracts/v2-t1-r3/openapi.json','pointer':'/components/schemas/previewImportInput/properties/mapping/properties/date','finding':'Date column selector incorrectly constrained to calendar date','resolution':'API004 bounded header selector; runtime NOT_RUN'},
      {'source':'docs/contracts/v2-t1-r3/openapi.json','pointer':'/components/schemas/getSyncStateOutput','finding':'Bounded coverage array has no completeness flags or coverage pagination','resolution':'API004 flags +2 paged queries; consumer migration NOT_RUN'},
      {'source':'finweave-web/src/app/operational-context.tsx','pointer':'operational getState useQuery/refetchInterval','finding':'Prototype aggregate polling differs from planned typed status sync','resolution':'Planned adapter only; frontend unchanged'},
      {'source':'docs/data/target-t1-domain/target-model.json','pointer':'/tables/jobs,refresh_jobs,provider_entitlements','finding':'No pinned queue policy/deadline/frozen refresh input/durable private quota counter','resolution':'DB005 design +3columns/1table; SQL NOT_RUN'}]
    for x in observations:x.update(sha256=sha(R/x['source']),runtime='NOT_RUN',modified=False)
    put(E/'source-observations.json',{'date':'2026-10-09','scope':'Static exact-source observations, not runtime reproduction','observations':observations})
    put(E/'research-sources.json',{'date':'2026-10-09','sources':[
      {'url':'https://www.postgresql.org/docs/18/sql-select.html','supports':'SKIP LOCKED queue consumers; inconsistent general view, not financial snapshots'},
      {'url':'https://www.postgresql.org/docs/18/functions-datetime.html','supports':'clock_timestamp vs transaction timestamp'},
      {'url':'https://www.postgresql.org/docs/18/sql-notify.html','supports':'NOTIFY after commit, signals not durable work authority'},
      {'url':'https://nodejs.org/api/worker_threads.html','supports':'CPU worker pool; not security sandbox or automatic I/O optimization'},
      {'url':'https://developer.android.com/develop/background-work/background-tasks/persistent/getting-started/define-work','supports':'periodic minimum15min, minimumbackoff10s, scheduling can be delayed'},
      {'url':'https://www.rfc-editor.org/rfc/rfc9110.html','supports':'202 acceptance and Retry-After seconds/date'}],
      'projectPolicy':'J2 implementation/profile deadlines, local18daily, jitter/quota/retention values are design choices, not vendor guarantees; exact Node/PG/Android versions not pinned by reading docs'})
    m=json.loads((R/'docs/data/target-t1-async/target-model.json').read_text(encoding='utf-8'))
    lines=['# DB005 dictionary additions','','DESIGN / SQL NOT RUN. Inherited columns in full target-model.json; only additions listed here.','']
    for name,cols in [('jobs',['policy_version','deadline_at']),('refresh_jobs',['request_payload_id']),('provider_quota_buckets',None)]:
      t=next(t for t in m['tables'] if t['name']==name);lines+=['## '+name,'','| Field | Type | Nullable | Meaning |','| --- | --- | --- | --- |']
      for c in t['columns']:
        if cols is None or c['name'] in cols:lines.append('| '+c['name']+' | '+c['type']+' | '+str(c['nullable'])+' | '+c['meaning']+' |')
      lines+=['']
    (R/'docs/data/target-t1-async/data-dictionary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({'requirements':len(reqs),'modelVectors':len(cases),'sourceObservations':len(observations)}))

if __name__=='__main__':main()
