"""One-time authoring aid. openapi.json is canonical after bootstrap; never run on validation."""
import copy, json, pathlib, sys
R=pathlib.Path(__file__).resolve().parents[2]
O=json.loads((R/'docs/execution/evidence/handover-2026-10-08/observed-contracts.json').read_text(encoding='utf-8'))
OUT=R/'docs/contracts/v2';OUT.mkdir(parents=True,exist_ok=True)
if (OUT/'openapi.json').exists() and '--replace-authoring-draft' not in sys.argv: raise SystemExit('Canonical exists; edit it directly.')
def obj(p,optional=()):return {'type':'object','properties':p,'required':[k for k in p if k not in optional],'additionalProperties':False}
def arr(s,n=100):return {'type':'array','items':s,'maxItems':n}
def enum(*v):return {'type':'string','enum':list(v)}
def nullable(s):return {'anyOf':[s,{'type':'null'}]}
ID={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'}
TEXT={'type':'string','minLength':1,'maxLength':500}
VER={'type':'integer','minimum':0,'maximum':9007199254740991}
TS={'type':'string','format':'date-time'}
DATE={'type':'string','format':'date'}
BOOL={'type':'boolean'}
MONEY={'type':'string','pattern':'^(0|[1-9][0-9]{0,17})$'}
DIGEST={'type':'string','pattern':'^[a-f0-9]{64}$'}
EMPTY=obj({});BYID=obj({'id':ID});PAGE=obj({'cursor':nullable(TEXT),'pageSize':{'type':'integer','minimum':1,'maximum':100}})
def page(s):return obj({'items':arr(s),'nextCursor':nullable(TEXT),'snapshotVersion':VER,'totalCount':nullable(VER)})
def clean(s):
 s=copy.deepcopy(s)
 def walk(v,name=''):
  if isinstance(v,dict):
   v.pop('$schema',None)
   if name=='synthetic' and v.get('const') is True:v.pop('const');v['type']='boolean'
   if v.get('type')=='string' and name in ['createdAt','observedAt','ackAt','lastSeen','lastObserved','lastAck','requestedAt','fetchedAt','quoteAsOf','expiresAt','retryAfter','lastSuccess','resetAt','cooldownUntil','publishedAt','leaseUntil','updatedAt','at']:v['format']='date-time'
   if v.get('type')=='string' and name in ['date','start','end','due']:v['format']='date'
   p=v.get('properties',{})
   if 'rawText' in p:
    p.pop('rawText');v['required']=[x for x in v.get('required',[]) if x!='rawText']
   for k,x in v.items():
    if k=='properties':
     for field,ss in x.items():walk(ss,field)
    elif isinstance(x,(dict,list)):walk(x,name)
  elif isinstance(v,list):
   for x in v:walk(x,name)
 walk(s);return s
SC={'Id':ID,'Version':VER,'Timestamp':TS,'DateOnly':DATE,'MoneyDecimal':MONEY,'Digest':DIGEST}
ops={}
def add(name,inp,out,kind='query',actor='owner',status=200,preview=False,origin=None):
 ops[name]={'input':clean(inp),'output':clean(out),'kind':kind,'actor':actor,'status':status,'preview':preview,'origin':origin or 'new-target'}
for n,v in O['v1'].items():add(n,v['input'],v['output'],v['kind'],'owner',v['status'],v['preview'],'v1:'+n)
for n,v in O['identity'].items():add(n,v['input'],v['output'],'mutation','owner-session' if v['authorized'] else 'pre-auth',origin='identity:'+n)
for n,v in O['v2'].items():
 if n in ['getState','registerExampleDevice','testCollector']:continue
 add(n,v['input'],v['output'],'query' if n in ['searchInstruments','getGoldProfiles'] else 'mutation',origin='v2:'+n)
# Remove unbounded raw source submission; normalized observations only.
EVIDENCE=obj({'amount':nullable(MONEY),'currency':{'const':'VND'},'direction':enum('income','expense','unknown'),'sourceAccountRef':nullable(TEXT),'transactionRef':nullable(TEXT),'sourceOccurredAt':nullable(TS),'ruleStatus':enum('complete','incomplete','redacted','unsupported')})
ops['ingestSourceEvidence']['input']=obj({'sourceId':ID,'matchedEventId':ID,'normalizedEvidence':EVIDENCE,'parserVersion':ID})
ops['searchInstruments']['input']=obj({'query':{'type':'string','maxLength':30},'exchange':nullable(enum('HOSE','HNX','UPCOM')),'page':PAGE})
ops['searchInstruments']['output']=page(O['v2']['searchInstruments']['output']['items'])
ops['getGoldProfiles']['input']=obj({'page':PAGE})
ops['getGoldProfiles']['output']=page(O['v2']['getGoldProfiles']['output']['items'])
for n in ['previewHolding','confirmHolding']:
 ops[n]['input']['properties']['quantity']={'type':'string','pattern':'^[1-9][0-9]{0,17}(\\.[0-9]{1,8})?$|^0\\.[0-9]{1,8}$'}
 ops[n]['input']['properties']['cost']=nullable(MONEY)
ops['previewHolding']['output']['properties']['digest']=DIGEST;ops['previewHolding']['output']['required'].append('digest')
ops['confirmHolding']['input']['properties']['digest']=DIGEST;ops['confirmHolding']['input']['required'].append('digest');ops['confirmHolding']['preview']=True
DEVICE=clean(O['v2']['registerExampleDevice']['output'])
BINDING=clean(O['v2']['bindCollector']['output'])
RECEIPT=clean(O['v2']['testCollector']['output'])
RECEIPT['properties'].update({'eventKey':ID,'revision':VER,'bindingId':ID,'payloadDigest':DIGEST,'errorCode':nullable(ID)})
RECEIPT['required']=list(RECEIPT['properties'])
JOB=clean(O['v2']['requestPriceRefresh']['output'])
RUN=clean(O['v2']['startAgentRun']['output'])
DRAFT=clean(O['v2']['reviseDraft']['output'])
SC.update({'NormalizedEvidence':EVIDENCE,'Device':DEVICE,'Binding':BINDING,'Receipt':RECEIPT,'PriceJob':JOB})
add('listSessions',obj({'page':PAGE}),page(obj({'sessionId':ID,'deviceId':nullable(ID),'expiresAt':TS,'current':BOOL})),'query','owner-session')
add('renewSession',EMPTY,clean(O['identity']['verifyIdentityChallenge']['output']),'mutation','owner-session')
add('revokeSession',BYID,obj({'revoked':BOOL}),'mutation','owner-session')
add('listWorkspaces',obj({'page':PAGE}),page(O['v1']['getWorkspace']['output']),'query','owner-session')
add('createWorkspace',obj({'trackingStart':DATE,'currency':{'const':'VND'},'timezone':{'const':'Asia/Ho_Chi_Minh'}}),O['v1']['getWorkspace']['output'],'mutation','owner-session')
add('registerDevice',obj({'name':TEXT,'platform':{'const':'android'},'appVersion':TEXT,'consentVersion':TEXT,'publicKey':{'type':'string','minLength':32,'maxLength':4096},'challengeId':ID,'proof':{'type':'string','minLength':32,'maxLength':4096}}),DEVICE,'mutation')
add('requestDeviceEnrollment',obj({'platform':{'const':'android'},'publicKeyDigest':DIGEST}),obj({'challengeId':ID,'nonce':TEXT,'expiresAt':TS}),'mutation')
add('listDevices',obj({'page':PAGE}),page(DEVICE))
add('listCollectorBindings',obj({'deviceId':ID,'page':PAGE}),page(BINDING))
add('disableCollectorBinding',obj({'id':ID,'expectedVersion':VER,'reason':TEXT}),BINDING,'mutation')
SUPPORT=O['v2']['getState']['output']['properties']['support']['items']
add('listSourceSupport',obj({'appVersion':TEXT,'androidApi':VER,'page':PAGE}),page(SUPPORT))
ITEM=obj({'eventKey':ID,'bindingId':ID,'bindingVersion':VER,'sourceKey':ID,'revision':VER,'observedAt':TS,'parserVersion':ID,'payloadDigest':DIGEST,'normalizedEvidence':EVIDENCE})
BATCH=obj({'deviceId':ID,'items':{**arr(ITEM,50),'minItems':1}})
ACK=obj({'eventKey':ID,'revision':VER,'receiptId':nullable(ID),'state':enum('durable','rejected'),'errorCode':nullable(ID)})
add('ingestNotifications',BATCH,obj({'receipts':arr(ACK,50),'acceptedAt':TS}),'mutation','device',202)
add('getReceipt',BYID,RECEIPT)
add('listReceipts',obj({'deviceId':nullable(ID),'page':PAGE}),page(RECEIPT))
add('getSyncState',obj({'lastKnownVersion':nullable(VER)}),obj({'workspaceVersion':VER,'asOf':TS,'changed':BOOL,'deviceIds':arr(ID),'coverage':arr(obj({'accountId':ID,'lastObserved':nullable(TS),'lastAck':nullable(TS),'gaps':arr(obj({'start':TS,'end':nullable(TS),'reason':ID}))}))}))
add('getRefreshJob',BYID,JOB)
add('listRefreshJobs',obj({'page':PAGE}),page(JOB))
# General bundle handles zero/multiple goals and plan-only drafts, unlike current mock.
GOAL=clean(O['v2']['answerAgentRun']['input']['properties']['body']['properties']['goal'])
GOAL['properties']['ref']=ID;GOAL['required'].append('ref')
PLANITEM=clean(O['v2']['reviseDraft']['input']['properties']['body']['properties']['items']['items'])
BUNDLE=obj({'goals':arr(GOAL,20),'items':arr(PLANITEM,100),'links':arr(obj({'itemRef':ID,'goalRef':ID}),100),'scope':{**arr(ID),'minItems':1},'reserve':MONEY,'income':nullable(MONEY),'expense':nullable(MONEY),'priority':enum('goal_first','preserve_plans'),'notes':{'type':'string','maxLength':500},'settings':O['v2']['reviseDraft']['input']['properties']['body']['properties']['settings']})
DRAFT['properties']['body']=BUNDLE
DRAFT['properties']['runId']=nullable(ID)
DRAFT['properties']['state']=enum('draft','previewed','confirmed','superseded','expired')
DRAFT['properties']['preview']=nullable(obj({'token':ID,'digest':DIGEST,'expiresAt':TS,'version':VER}))
for n in ['reviseDraft','reviseDraftByMessage','refreshDraft','previewPlanningDraft','confirmPlanningDraft']:ops[n]['output']=DRAFT
ops['reviseDraft']['input']['properties']['body']=BUNDLE
ops['answerAgentRun']['input']=obj({'id':ID,'expectedVersion':VER,'questionId':ID,'answer':TEXT})
ops['answerAgentRun']['output']=RUN
ops['startAgentRun']['status']=202
ops['confirmPlanningDraft']['preview']=True
add('getAgentRun',BYID,RUN)
add('listAgentRuns',obj({'conversationId':ID,'page':PAGE}),page(RUN))
add('getPlanningDraft',BYID,DRAFT)
add('listPlanningDrafts',obj({'conversationId':nullable(ID),'page':PAGE}),page(DRAFT))
add('createPlanningDraft',obj({'conversationId':ID,'body':BUNDLE}),DRAFT,'mutation')
add('discardPlanningDraft',obj({'id':ID,'expectedVersion':VER,'reason':TEXT}),DRAFT,'mutation')
add('simulatePlanningDraft',obj({'id':ID,'expectedVersion':VER}),obj({'simulationId':ID,'baseVersion':VER,'feasible':BOOL,'warnings':arr(TEXT),'result':O['v1']['getSimulation']['output']}),'mutation')
add('getToolResult',BYID,obj({'id':ID,'snapshotVersion':VER,'classification':enum('actual','planned','simulated','unknown'),'evidenceIds':arr(ID),'result':O['v1']['getOverview']['output']}))
# Current Q&A history stays shared; additive refs identify processing, never a second store.
def message_refs(schema):
 if isinstance(schema,dict):
  if schema.get('type')=='object' and 'conversationId' in schema.get('properties',{}) and 'state' in schema.get('properties',{}) and 'text' in schema.get('properties',{}):
   schema['properties'].update({'processingKind':enum('rule','single_tool','agent','scripted'),'agentRunId':nullable(ID),'planningDraftId':nullable(ID)})
   schema['required']=list(schema['properties'])
  for v in schema.values():message_refs(v)
 elif isinstance(schema,list):
  for v in schema:message_refs(v)
for v in ops.values():message_refs(v['output'])
ADMIN=clean(O['admin']['OpsSnapshot'])
add('adminSignIn',obj({'email':{'type':'string','format':'email'},'password':{'type':'string','minLength':12,'maxLength':128},'mfaCode':{'type':'string','pattern':'^[0-9]{6}$'}}),obj({'subjectId':ID,'role':{'const':'admin'},'expiresAt':TS}),'mutation','admin-pre-auth')
add('adminSignOut',EMPTY,obj({'signedOut':{'const':True}}),'mutation','admin')
add('opsStatus',EMPTY,ADMIN,'query','admin')
for n,key in [('opsListAccounts','accounts'),('opsListSources','sources'),('opsListJobs','jobs'),('opsListQuotas','quotas'),('opsListReleases','releases'),('opsListIncidents','incidents'),('opsListAudit','audit')]:
 add(n,obj({'page':PAGE}),page(ADMIN['properties'][key]['items']),'query','admin')
add('opsPreviewAction',O['admin']['OpsAction'],O['admin']['OpsPreview'],'mutation','admin')
add('opsConfirmAction',obj({'previewToken':ID,'digest':DIGEST,'expectedOpsVersion':VER}),obj({'opsVersion':VER,'auditId':ID,'objectId':ID}),'mutation','admin',preview=True)
add('dispatchJobs',obj({'batchLimit':{'type':'integer','minimum':1,'maximum':20},'leaseSeconds':{'type':'integer','minimum':30,'maximum':120}}),obj({'claimed':VER,'deferred':VER}),'mutation','scheduler',202)
add('processIngestionReceipt',obj({'receiptId':ID,'leaseToken':ID}),obj({'receiptId':ID,'state':enum('posted','needs_review','ignored','failed')}),'mutation','worker')
add('executePriceRefresh',obj({'jobId':ID,'leaseToken':ID}),obj({'jobId':ID,'state':enum('succeeded','partial','failed','rate_limited')}),'mutation','worker')
add('executeAgentStep',obj({'runId':ID,'leaseToken':ID}),obj({'runId':ID,'state':RUN['properties']['state']}),'mutation','worker')
add('purgeExpiredData',obj({'before':TS,'batchLimit':{'type':'integer','minimum':1,'maximum':1000}}),obj({'purged':VER,'tombstonesRetained':VER}),'mutation','scheduler')
# Generic preview is a closed union of permitted finance mutations, not arbitrary JSON.
allowed=[n for n,v in ops.items() if v['preview'] and v['origin'].startswith('v1:') and n!='confirmImport']
ops['previewMutation']['input']={'oneOf':[obj({'operationId':{'const':n},'input':ops[n]['input'],'expectedWorkspaceVersion':VER,'expectedObjectVersions':{'type':'object','additionalProperties':VER}}) for n in allowed]}
ops['previewMutation']['kind']='mutation'
ERRORS={400:['BAD_REQUEST','CONTRACT_VERSION_UNSUPPORTED'],401:['UNAUTHENTICATED','INVALID_CREDENTIALS','CHALLENGE_INVALID','CHALLENGE_EXPIRED','RESET_INVALID'],403:['FORBIDDEN','DEVICE_REVOKED','CONSENT_REQUIRED','ENTITLEMENT_REQUIRED'],404:['NOT_FOUND'],409:['VERSION_CONFLICT','STALE_PROPOSAL','PREVIEW_EXPIRED','PREVIEW_MISMATCH','IDEMPOTENCY_CONFLICT','CURSOR_INVALID','ACTION_NOT_ALLOWED','BINDING_CHANGED'],413:['PAYLOAD_TOO_LARGE'],422:['VALIDATION','UNIT_INCOMPATIBLE','INSUFFICIENT_CASH','PARSER_UNSUPPORTED','PASSWORD_POLICY','PASSWORD_MISMATCH'],429:['RATE_LIMITED','QUOTA_EXCEEDED'],503:['SERVICE_UNAVAILABLE','UPSTREAM_UNAVAILABLE','OUTCOME_UNKNOWN','SECURITY_TRANSPORT_NOT_VERIFIED']}
SC['Error']=obj({'contractVersion':{'const':'2.0.0'},'requestId':ID,'workspaceVersion':nullable(VER),'code':enum(*[c for cs in ERRORS.values() for c in cs]),'message':TEXT,'retryable':BOOL,'retryAfterSeconds':nullable({'type':'integer','minimum':1,'maximum':86400}),'fieldErrors':arr(obj({'field':TEXT,'code':ID})),'outcome':enum('not_committed','unknown')})
PATHS={}
for n,v in ops.items():
 actor=v['actor'];internal=actor in ['scheduler','worker'];admin=actor.startswith('admin');identity=v['origin'].startswith('identity:') or actor in ['owner-session','pre-auth']
 base='/internal/v2/' if internal else '/v2/admin/' if admin else '/v2/identity/' if identity else '/v2/operations/'
 SC[n+'Input']=v['input'];SC[n+'Output']=v['output']
 workspace=nullable(ID) if admin or identity or internal else ID
 mutation=obj({'idempotencyKey':ID,'expectedWorkspaceVersion':nullable(VER) if admin or identity or internal else VER,'expectedObjectVersions':{'type':'object','additionalProperties':VER},'previewToken':nullable(ID)}) if v['kind']=='mutation' else {'type':'null'}
 SC[n+'Request']=obj({'contractVersion':{'const':'2.0.0'},'requestId':ID,'workspaceId':workspace,'operationId':{'const':n},'input':{'$ref':'#/components/schemas/'+n+'Input'},'mutation':mutation})
 SC[n+'Reply']=obj({'contractVersion':{'const':'2.0.0'},'requestId':ID,'workspaceVersion':nullable(VER) if admin or identity or internal else VER,'data':{'$ref':'#/components/schemas/'+n+'Output'}})
 ref=lambda k:{'$ref':'#/components/schemas/'+k}
 security=[] if actor in ['pre-auth','admin-pre-auth'] else [{'SchedulerSignature':[]}] if internal else [{'AdminCookie':[]}] if admin else [{'DeviceBearer':[]}] if actor=='device' else [{'OwnerCookie':[]},{'DeviceBearer':[]}]
 response={str(v['status']):{'description':'Durably accepted; completion requires polling.' if v['status']==202 else 'Validated logical result.','content':{'application/json':{'schema':ref(n+'Reply')}}}}
 for status,codes in ERRORS.items():response[str(status)]={'description':', '.join(codes),'content':{'application/json':{'schema':{'allOf':[ref('Error'),{'properties':{'code':{'enum':codes}}}]}}}}
 object_fields=[k for k in v['input'].get('properties',{}) if k.endswith('Id') or k in ['id','holdingIds','scope','token']]
 scope='scheduler/worker principal; signed service identity, lease and purpose; no public user access' if internal else 'server-assigned admin role; metadata allowlist only; no owner impersonation or finance scope' if admin else 'challenge/session ownership; anti-enumeration; no role from request' if identity else 'authenticated owner of selected workspace; every nested object and reference must belong to it; device upload additionally matches live device/binding/consent'
 group='ops' if admin or internal else 'identity' if identity else 'agent' if any(s in n.lower() for s in ['agent','draft','conversation','message','tool']) else 'ingestion' if any(s in n.lower() for s in ['device','collector','receipt','sync','source']) else 'market' if any(s in n.lower() for s in ['holding','quote','instrument','gold','refresh']) else 'planning' if any(s in n.lower() for s in ['plan','goal','simulation']) else 'ledger'
 tables={'ops':['ops_jobs','ops_sources','ops_audit'],'identity':['identities','sessions','workspaces'],'agent':['conversations','messages','agent_runs','planning_drafts','tool_results'],'ingestion':['devices','collector_bindings','ingestion_receipts','source_records','evidence','coverage_gaps'],'market':['holdings','holding_movements','quote_observations','refresh_jobs','instruments','gold_profiles'],'planning':['financial_plans','plan_items','actual_links','goals','goal_allocations','simulations'],'ledger':['accounts','events','entry_groups','posting_lines','evidence','reviews','snapshots']}[group]
 PATHS[base+n]={'post':{'operationId':n,'tags':[group],'summary':n+' — '+v['kind'],'security':security,'requestBody':{'required':True,'content':{'application/json':{'schema':ref(n+'Request')}}},'responses':response,'x-finweave':{'kind':v['kind'],'actor':actor,'authorization':scope,'objectSelectors':object_fields,'previewRequired':v['preview'],'origin':v['origin'],'persistenceTables':tables,'transport':'internal-private' if internal else 'synthetic-json-only; protected inner operation after SEC-REAL','concurrency':'replay-before-version-check; lock workspace then sorted objects; revalidate in atomic transaction' if v['kind']=='mutation' else 'snapshot-bound cursor; no mixed-version aggregation','idempotency':'workspace+principal+operation+key; semantic digest includes expected versions and token; tombstone until workspace erasure' if v['kind']=='mutation' else 'read has no domain effects','polling':'lifecycles.md; 1/2/4/8/15s+jitter for pending, pause background, respect Retry-After' if v['status']==202 or group in ['agent','ingestion','market'] else 'none; foreground sync version every 20s','validation':'strict JSON Schema plus semantics.md and business rules; unknown fields reject; bytes<=256KiB except bounded CSV<=64KiB','availability':'synthetic build target; implementation NOT PRESENT','permission':scope}}}
DOC={'openapi':'3.1.1','jsonSchemaDialect':'https://json-schema.org/draft/2020-12/schema','info':{'title':'FinWeave unified logical API v2 — synthetic implementation target','version':'2.0.0','description':'Canonical source for all logical operations. No production plaintext finance endpoint is authorized. Security protocol remains blocked; internal routes are private. Examples and mappings derive from this file.'},'servers':[{'url':'http://127.0.0.1:8080','description':'Planned disposable synthetic backend, not running or deployed'}],'paths':PATHS,'components':{'schemas':SC,'securitySchemes':{'OwnerCookie':{'type':'apiKey','in':'cookie','name':'fw_session'},'AdminCookie':{'type':'apiKey','in':'cookie','name':'fw_admin_session'},'DeviceBearer':{'type':'http','scheme':'bearer','description':'Enrolled, revocable device token; never user-controlled identity'},'SchedulerSignature':{'type':'apiKey','in':'header','name':'X-FW-Service-Signature','description':'Private mTLS plus timestamp/nonce/body signature; anti-replay. Not a static public bearer.'}}},'x-finweave-canonical':True,'x-finweave-nonproduction-aliases':{'getState':'split into listDevices/listCollectorBindings/listSourceSupport/listReceipts/listRefreshJobs/listAgentRuns/listPlanningDrafts','registerExampleDevice':'mock fixture only; requestDeviceEnrollment/registerDevice require key proof','testCollector':'mock fixture only; native normalized batch goes to ingestNotifications'},'x-finweave-policy':{'money':'VND integer string, <=18 digits; no exponent/separators/leading zeros','quantity':'<=18 integer digits, <=8 fractional; stock share/gold chi; luong converted x10 with evidence','time':'business dates YYYY-MM-DD; instants RFC3339 offset; Asia/Ho_Chi_Minh; half-open periods','null':'required nullable must be present; optional absent only when not in required; unknown metrics carry reason','privacy':'all finance/context/IDs/search/CSV/evidence/errors/session bootstrap sealed end-to-end to approved protected workload for real data; current JSON synthetic only'}}
(OUT/'openapi.json').write_text(json.dumps(DOC,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'operations':len(ops),'schemas':len(SC),'canonical':'docs/contracts/v2/openapi.json'}))
