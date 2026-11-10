"""Author unreleased T1 contract revision; never writes v2 baseline/frontend/DB."""
from pathlib import Path
import copy,csv,hashlib,json,sys

ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools/handover'))
from alignment import consumer_mapping,schema_fields
from data_alignment import RULES

OUT=ROOT/'docs/contracts/v2-t1'
E=ROOT/'docs/execution/evidence/arch-05-t1-2026-10-08'
REV='FW-API-T1-D1J2-001'
ID={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'}
VER={'type':'integer','minimum':0,'maximum':9007199254740991}
DIGEST={'type':'string','pattern':'^[a-f0-9]{64}$'}
TIME={'type':'string','format':'date-time','maxLength':64}
SECRET={'type':'string','minLength':32,'maxLength':4096,'x-sensitive':True}
def obj(props,required=None):
    return {'type':'object','properties':props,'required':list(props) if required is None else required,'additionalProperties':False}
def nullable(s):return {'anyOf':[copy.deepcopy(s),{'type':'null'}]}
def array(s,maximum=50,minimum=0):return {'type':'array','items':s,'maxItems':maximum,'minItems':minimum}
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def csvout(p,rows):
    with p.open('w',newline='',encoding='utf-8') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    base=json.loads((ROOT/'docs/contracts/v2/openapi.json').read_text(encoding='utf-8-sig'))
    base_ops={o['post']['operationId']:o['post'] for o in base['paths'].values()}
    doc=copy.deepcopy(base);s=doc['components']['schemas']
    ops={o['post']['operationId']:(p,o['post']) for p,o in doc['paths'].items()}
    model=json.loads((ROOT/'docs/data/target-t1/target-model.json').read_text(encoding='utf-8'))
    tableowners={t['name']:t['owner'] for t in model['tables']}
    overlay={r['operation']:r for r in csv.DictReader((ROOT/'docs/data/target-t1/operation-storage-overlay.csv').open(encoding='utf-8'))}
    doc['info'].update(title='FinWeave API v2 — T1 / D1 + J2 unreleased revision',
        description='Working target revision '+REV+'. Payload contractVersion=2.0.0 is pre-release and NOT compatible by label alone. Pin revision+OpenAPI SHA256 per build. T1 trusted server; real requires SEC-REAL-T1. Baseline v2/r1/r2 immutable; no running backend.')
    doc['x-finweave-revision']={'id':REV,'status':'ACCEPTED_DESIGN_NOT_IMPLEMENTED','supersedesWorkingTarget':'docs/contracts/v2/openapi.json','baselineSha256':hashlib.sha256((ROOT/'docs/contracts/v2/openapi.json').read_bytes()).hexdigest(),'trust':'T1','database':'D1 + J2','versionPolicy':'Unreleased2.0.0 revision; before first deployed release pin revision+digest; published incompatible changes require new API version.'}
    doc['x-finweave-policy']['privacy']='T1 trusted server processes finance; app-admin/collector/Agent capabilities restricted. HTTPS, scoped auth, data minimization and SEC-REAL-T1 controls required before real. Infrastructure/root/DBA/backup operators trusted; no anti-root-Ops claim.'
    doc['servers']=[{'url':'https://api.example.invalid','description':'User/device example only; actual origin per deployment configuration. Admin and internal routes served only by their P2 roots.'}]
    sec=doc['components']['securitySchemes']
    sec['OwnerBearer']={'type':'http','scheme':'bearer','description':'Authenticated human-owner native session, separate audience/capability from collector token. Opaque access token, server checks subject/family/expiry/revoke.'}
    sec['NativeRefreshBearer']={'type':'http','scheme':'bearer','description':'Refresh credential accepted ONLY by renewNativeSession; rotating family with reuse detection, not finance/collector access.'}
    sec['ServiceMTLS']={'type':'mutualTLS','description':'Private P2 service identity; signature alone does not make endpoint public.'}
    sec['DeviceBearer']['description']='Collector-only token bound workspace/device/epochs; only ingestNotifications and reconcileReceipts. Never owner finance/plan/auth authority.'
    owner_security=[{'OwnerCookie':[]},{'OwnerBearer':[]}]
    worker_ids={'processIngestionReceipt','executePriceRefresh','executeAgentStep','executeImportJob'}
    for n,(p,o) in ops.items():
        meta=o['x-finweave'];actor=meta['actor']
        if n=='getSession':
            actor='owner-session';meta['actor']=actor
        if actor in {'owner','owner-session'}:o['security']=copy.deepcopy(owner_security)
        elif actor=='device':o['security']=[{'DeviceBearer':[]}]
        elif actor=='admin':o['security']=[{'AdminCookie':[]}]
        elif actor.endswith('pre-auth') or actor=='pre-auth':o['security']=[]
        else:o['security']=[{'ServiceMTLS':[],'SchedulerSignature':[]}]
        dep=overlay[n]
        tables=set(filter(None,(dep['baselineTables']+','+dep['targetAdditionalDependencies']).split(',')))
        if n in {'adminSignIn','adminSignOut'}:tables={'admin_principals','admin_sessions','admin_challenges','admin_mfa_factors'}
        meta['persistenceTables']=sorted(tables)
        meta['transport']='internal-private-mtls-and-signature' if p.startswith('/internal/') else 'T1-HTTPS-browser-cookie-or-native-scoped-bearer'
        meta['availability']='target design only; local synthetic first; real requires SEC-REAL-T1; runtime NOT PRESENT'
        meta['contractRevision']=REV
        meta['idempotency']='semantics.md: actor-specific scope; committed replay before versions/preview freshness, never bypass current auth/revoke; credential issuers have dedicated short-lived protected replay'
        meta['authorization']=('Admin authority only, separate session/MFA; sanitized metadata and safe control, no customer finance or impersonation.' if actor.startswith('admin') else 'Collector token only; exact live workspace/device/binding/consent/epoch; no owner finance read/write.' if actor=='device' else 'Private service capability and typed scoped job ticket; validate lease generation/token/epoch and domain preconditions.' if p.startswith('/internal/') else 'Server-derived owner identity, authorize workspace and every nested object; owner native bearer differs from collector bearer.' if actor!='pre-auth' else 'Pre-auth challenge/credential flow, bounded and anti-enumeration; no workspace finance authority.')
        meta['permission']=meta['authorization']
        req=s[n+'Request'];reply=s[n+'Reply']
        # Context cannot be an optional selector on admin/identity/global internal requests.
        null_context=('/identity/' in p or '/admin/' in p or p.startswith('/internal/') or actor=='owner-session')
        if null_context:
            req['properties']['workspaceId']={'type':'null'}
            reply['properties']['workspaceVersion']={'type':'null'}
        if actor=='device':reply['properties']['workspaceVersion']={'type':'null'}
        if n in worker_ids:req['properties']['workspaceId']=copy.deepcopy(ID)
        if req['properties']['mutation'].get('type')=='object':
            if null_context:req['properties']['mutation']['properties']['expectedWorkspaceVersion']={'type':'null'}
        # Private tickets resolve composite tenant IDs, never global receipt/run ID guesses.
        if n in worker_ids:
            inp=s[n+'Input']
            for k,v in {'dispatchJobId':ID,'generation':VER,'recoveryEpoch':VER}.items():
                inp['properties'][k]=copy.deepcopy(v);inp['required'].append(k)
        # Request/response examples in the frozen base are not auto-edited into false T1 examples.
        for media in o.get('requestBody',{}).get('content',{}).values():media.pop('example',None)
        for response in o['responses'].values():
            for media in response.get('content',{}).values():media.pop('example',None)

    # Hard structural checks for batch ACKs; ownership/digest pairing still runtime obligations.
    ack_base=s['ingestNotificationsOutput']['properties']['receipts']['items']['properties']
    durable=copy.deepcopy(ack_base);durable.update(state={'const':'durable'},receiptId=copy.deepcopy(ID),errorCode={'type':'null'})
    rejected=copy.deepcopy(ack_base);rejected.update(state={'const':'rejected'},receiptId={'type':'null'},errorCode=copy.deepcopy(ID))
    s['ingestNotificationsOutput']['properties']['receipts']=array({'oneOf':[obj(durable),obj(rejected)]},50,1)
    for k in ['deviceEpoch','recoveryEpoch']:
        s['ingestNotificationsInput']['properties'][k]=copy.deepcopy(VER);s['ingestNotificationsInput']['required'].append(k)
        s['getSyncStateOutput']['properties'][k]=copy.deepcopy(VER) if k=='recoveryEpoch' else copy.deepcopy(VER)
    # Sync is workspace state, not a single-device epoch; only recoveryEpoch belongs there.
    s['getSyncStateOutput']['properties'].pop('deviceEpoch')
    s['getSyncStateOutput']['required'].append('recoveryEpoch')
    s['Error']['properties']['code']['enum'] += ['REPLAY_EXPIRED','RECOVERY_FENCE','REAUTH_REQUIRED','REFRESH_REUSE','UNSUPPORTED_MEDIA_TYPE']
    s['Error']['properties']['outcome']['enum'].append('committed')
    s['Error']['properties']['resultRef']=nullable(ID)  # Optional; old safe errors still structurally valid.
    s['Error']['properties']['itemErrors']=array(obj({'eventKey':ID,'revision':VER,'errorCode':ID}),50,1)
    s['Error']['description']='No sensitive value echo. REPLAY_EXPIRED means original command committed; outcome=committed, resultRef required by semantic rule. No automatic re-execution. Malformed transport failures may have no JSON body.'
    s['Error']['allOf']=[{'if':{'properties':{'code':{'const':'REPLAY_EXPIRED'}},'required':['code']},'then':{'properties':{'outcome':{'const':'committed'},'retryable':{'const':False}},'required':['resultRef']}}]

    def add(n,inp,out,actor,kind,tables,path,security,status='200'):
        s[n+'Input']=copy.deepcopy(inp);s[n+'Output']=copy.deepcopy(out)
        template='adminSignOut' if actor=='admin' else 'getSession' if actor in {'owner','device'} else 'verifyIdentityChallenge' if actor=='pre-auth' else 'processIngestionReceipt'
        req=copy.deepcopy(s[template+'Request']);req['properties']['operationId']={'const':n};req['properties']['input']={'$ref':'#/components/schemas/'+n+'Input'}
        scoped=actor in {'owner','device','worker'}
        req['properties']['workspaceId']=copy.deepcopy(ID) if scoped else {'type':'null'}
        req['properties']['mutation']=copy.deepcopy(s['createEventRequest']['properties']['mutation']) if kind=='mutation' else {'type':'null'}
        if kind=='mutation' and actor in {'admin','pre-auth','owner-session','native-refresh','worker'}:
            req['properties']['mutation']['properties']['expectedWorkspaceVersion']={'type':'null'}
        reply=copy.deepcopy(s[template+'Reply']);reply['properties']['data']={'$ref':'#/components/schemas/'+n+'Output'}
        reply['properties']['workspaceVersion']=copy.deepcopy(VER) if scoped and actor not in {'worker','device'} else {'type':'null'}
        s[n+'Request']=req;s[n+'Reply']=reply
        meta={'actor':actor,'kind':kind,'origin':'ARCH-05-T1','previewRequired':False,'persistenceTables':tables,'contractRevision':REV,
              'transport':'internal-private-mtls-and-signature' if path.startswith('/internal/') else 'T1-HTTPS',
              'authorization':'See operation policies and semantics; actor/scope server-derived, no client role authority.',
              'permission':'See semantics.md','availability':'DESIGN ONLY; runtime NOT PRESENT','persistenceScope':'Read/write dependencies, not grants or proof of effects'}
        op={'operationId':n,'summary':n,'security':security,'requestBody':{'required':True,'content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+n+'Request'}}}},
            'responses':{status:{'description':'Schema-only target success; domain/auth execution NOT RUN','content':{'application/json':{'schema':{'$ref':'#/components/schemas/'+n+'Reply'}}}}},'x-finweave':meta}
        doc['paths'][path]={'post':op};ops[n]=(path,op)

    native_tokens=obj({'accessToken':SECRET,'refreshToken':SECRET,'tokenType':{'const':'Bearer'},'accessExpiresAt':TIME,'refreshExpiresAt':TIME})
    native_output=copy.deepcopy(s['verifyIdentityChallengeOutput']);native_output['properties']['tokens']=native_tokens;native_output['required'].append('tokens')
    add('verifyNativeIdentityChallenge',s['verifyIdentityChallengeInput'],native_output,'pre-auth','mutation',
        ['identities','identity_challenges','sessions'],'/v2/identity/verifyNativeIdentityChallenge',[])
    add('renewNativeSession',obj({}),native_output,'native-refresh','mutation',
        ['identities','sessions'],'/v2/identity/renewNativeSession',[{'NativeRefreshBearer':[]}])
    challenge=obj({'challengeId':ID,'nonce':DIGEST,'expiresAt':TIME})
    add('requestCollectorCredentialChallenge',obj({'deviceId':ID}),challenge,'owner','mutation',
        ['devices','identity_challenges','workspaces'],'/v2/operations/requestCollectorCredentialChallenge',owner_security)
    cred=obj({'deviceId':ID,'token':SECRET,'expiresAt':TIME,'deviceEpoch':VER,'recoveryEpoch':VER})
    add('issueCollectorCredential',obj({'deviceId':ID,'challengeId':ID,'proof':{'type':'string','minLength':32,'maxLength':8192,'writeOnly':True}}),cred,'owner','mutation',
        ['devices','identity_challenges','sessions','workspaces'],'/v2/operations/issueCollectorCredential',owner_security)
    ops['renewSession'][1]['security']=[{'OwnerCookie':[]}]
    ops['renewSession'][1]['x-finweave']['authorization']='Browser session renewal only; native refresh uses renewNativeSession with refresh audience, not access token.'
    for n in ['requestCollectorCredentialChallenge','issueCollectorCredential']:
        ops[n][1]['security']=[{'OwnerBearer':[]}]
        ops[n][1]['x-finweave']['authorization']='Native owner session plus registered device/key proof purpose; credential delivered to native code, never browser/WebView cookie flow.'
    outcome_input=obj({'operationId':ID,'idempotencyKey':ID})
    outcome=obj({'state':{'enum':['in_progress','committed','not_found','unknown']},'resultRef':nullable(ID),'replayAvailable':{'type':'boolean'},'committedVersion':nullable(VER)})
    add('getCommandOutcome',outcome_input,outcome,'owner','query',
        ['idempotency_records','payload_objects'],'/v2/operations/getCommandOutcome',owner_security)
    add('opsGetCommandOutcome',outcome_input,outcome,'admin','query',
        ['ops_idempotency'],'/v2/admin/opsGetCommandOutcome',[{'AdminCookie':[]}])
    identities=array(obj({'eventKey':ID,'revision':VER,'payloadDigest':DIGEST}),50,1)
    reconcile_out=obj({'recoveryEpoch':VER,'items':array(obj({'eventKey':ID,'revision':VER,'state':{'enum':['durable','missing','conflict']},'receiptId':nullable(ID)}),50,1)})
    add('reconcileReceipts',obj({'deviceId':ID,'deviceEpoch':VER,'items':identities}),reconcile_out,'device','query',
        ['devices','workspaces','collector_bindings','ingestion_receipts'],'/v2/operations/reconcileReceipts',[{'DeviceBearer':[]}])
    execute_in=obj({'importJobId':ID,'dispatchJobId':ID,'leaseToken':ID,'generation':VER,'recoveryEpoch':VER})
    execute_out=obj({'importJobId':ID,'state':{'enum':['completed','failed']},'resultRef':nullable(ID)})
    add('executeImportJob',execute_in,execute_out,'worker','mutation',
        ['import_jobs','import_previews','import_rows','jobs','job_attempts','accounts','events','entry_groups','posting_lines','reviews','version_history','idempotency_records'],
        '/internal/v2/executeImportJob',[{'ServiceMTLS':[],'SchedulerSignature':[]}])
    ops['purgeExpiredData'][1]['x-finweave']['actor']='retention'

    # New errors are declared at the same HTTP statuses in every operation.
    timestamp_fields={'createdAt','updatedAt','expiresAt','committedAt','receivedAt','acceptedAt','fetchedAt','quoteAsOf','fxAsOf','leaseUntil','retryAfter','lastSeen','lastObserved','lastAck','lastSuccess'}
    def fix_time(v):
        if isinstance(v,dict):
            for name,child in v.get('properties',{}).items():
                if name in timestamp_fields:
                    branches=[child]+child.get('anyOf',[])+child.get('oneOf',[])
                    for b in branches:
                        typ=b.get('type')
                        if (typ=='string' or isinstance(typ,list) and 'string' in typ) and 'format' not in b:
                            b['format']='date-time'
            for child in v.values():fix_time(child)
        elif isinstance(v,list):
            for child in v:fix_time(child)
    fix_time(s)
    additions={'409':['REPLAY_EXPIRED','RECOVERY_FENCE'],'403':['REAUTH_REQUIRED'],'401':['REFRESH_REUSE']}
    for n,(p,o) in ops.items():
        for status in ['400','401','403','404','409','413','422','429','503']:
            if status not in o['responses']:
                o['responses'][status]=copy.deepcopy(base['paths'][next(iter(base['paths']))]['post']['responses'][status])
            codes=o['responses'][status]['content']['application/json']['schema']['allOf'][1]['properties']['code']['enum']
            for code in additions.get(status,[]):
                if code not in codes:codes.append(code)
            o['responses'][status]['description']=', '.join(codes)
        o['responses'].setdefault('default',{'description':'Proxy/offline/unparseable transport failure: may not match Error JSON; no claim of not_committed.'})
        o['responses']['415']={'description':'Unsupported media type, no JSON interpretation or effect','content':{'application/json':{'schema':{'allOf':[{'$ref':'#/components/schemas/Error'},{'properties':{'code':{'const':'UNSUPPORTED_MEDIA_TYPE'}}}]}}}}
        for status,response in o['responses'].items():
            response.setdefault('headers',{})['Cache-Control']={'schema':{'const':'no-store'},'description':'Finance/auth/admin JSON must not enter shared/browser HTTP cache.'}
            response['headers']['X-FW-Contract-Revision']={'schema':{'const':REV}}
        o.setdefault('parameters',[]).append({'in':'header','name':'X-FW-Contract-Revision','required':True,'schema':{'const':REV},'description':'Build-pinned unreleased revision; body version label alone is insufficient.'})
        if n in {'signIn','registerIdentity'}:
            o['parameters'].append({'in':'header','name':'X-FW-Client','required':True,'schema':{'enum':['web','android']},'description':'Challenge flow purpose only, not authorization. Native verifier rejects browser-purpose challenges and vice versa.'})
        if o['x-finweave']['actor'] in {'owner','owner-session','admin'} and o['x-finweave']['kind']=='mutation' and any('OwnerCookie' in sec or 'AdminCookie' in sec for sec in o['security']):
            o['parameters'].append({'in':'header','name':'X-FW-CSRF','required':False,'schema':{'type':'string','minLength':32,'maxLength':256},'description':'Conditionally REQUIRED for cookie-authenticated mutation, bound to session. Native owner bearer uses no cookies; mixed credentials rejected.'})
        if n in {'verifyIdentityChallenge','renewSession','adminSignIn'}:
            o['responses']['200']['headers']['X-FW-CSRF']={'schema':{'type':'string','minLength':32,'maxLength':256},'description':'Browser session-bound CSRF value; paired readable signed CSRF cookie, HttpOnly session cookie separately.'}
        if p.startswith('/internal/'):
            for name,schema in [('X-FW-Service-Timestamp',TIME),('X-FW-Service-Nonce',ID),('X-FW-Service-Body-Digest',DIGEST)]:
                o['parameters'].append({'in':'header','name':name,'required':True,'schema':schema})
        primary=base_ops.get(n,o)['x-finweave']['persistenceTables'][0]
        o['x-finweave']['domainOwner']=('OpsIdentity' if n in {'adminSignIn','adminSignOut'} else 'SharedJobs' if n=='dispatchJobs' else 'ReadModels' if n in {'getPresentationSnapshot','getOverview','getPortfolio','getInsights','getSpendingReport'} else 'Market' if n in {'recordPriceQuote','listPriceQuotes','searchInstruments','getGoldProfiles','requestPriceRefresh','getRefreshJob','listRefreshJobs','executePriceRefresh'} else 'SharedTX' if n in {'previewMutation','getCommandOutcome','purgeExpiredData'} else tableowners[primary])
    dump(OUT/'openapi.json',doc)
    dump(OUT/'schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'urn:finweave:v2:t1:'+REV,'components':{'schemas':s}})
    inventory=[]
    for n,(p,o) in ops.items():
        meta=o['x-finweave']
        inventory.append({'operation':n,'path':p,'actor':meta['actor'],'kind':meta['kind'],'owner':meta['domainOwner'],'security':json.dumps(o['security'],separators=(',',':')),'tables':','.join(meta['persistenceTables']),'preview':meta['previewRequired'],'status':'SPECIFIED_NOT_IMPLEMENTED'})
    csvout(OUT/'operation-inventory.csv',inventory)
    # Fresh observed field differences, not copied historical call evidence.
    observed=json.loads((E/'observed-contracts.json').read_text(encoding='utf-8'))
    mapping=consumer_mapping(ROOT,doc,observed,E)
    for row in mapping:
        if row['sourcePath']=='docs/contracts/v2/openapi.json':row['sourcePath']='docs/contracts/v2-t1/openapi.json'
        targets=row['targetOperations'].split(',')
        if len(targets)==1 and targets[0] in ops and row['status']!='LOCAL_NATIVE_CAPABILITY':
            row['permission']=ops[targets[0]][1]['x-finweave']['authorization']
            if ops[targets[0]][0].startswith('/internal/'):row['consumer']='private service profile; no browser/native HTTP caller'
        row['transformations'] += ' T1 revision '+REV+' required; OwnerBearer is not collector DeviceBearer. See v2-t1 semantics and adapter plan; no consumer migrated.'
        row['transformations']=row['transformations'].replace('lease/fence/attempt<=3','typed J2 lease/generation/token/epoch; bounded attempts per job profile at ARCH-09')
        if 'recordPriceQuote' in targets:
            row['transformations']=row['transformations'].replace('Manual synthetic only.','Owner manual quote in the permitted environment; local fixtures remain synthetic.').replace('Manual synthetic entitlement row required;','Approved manual-source entitlement scope required;')
    csvout(OUT/'consumer-operation-mapping.csv',mapping)
    dump(OUT/'transport-policy.json',{'revision':REV,'policies':{n:{'security':o['security'],'requestWorkspace':s[n+'Request']['properties']['workspaceId'],'replyWorkspaceVersion':s[n+'Reply']['properties']['workspaceVersion'],'mutation':s[n+'Request']['properties']['mutation'],'headers':o['parameters'],'responseStatuses':list(o['responses']),'domainOwner':o['x-finweave']['domainOwner']} for n,(p,o) in ops.items()}})
    gates=[]
    markers=['dataMode!==','SECURITY_TRANSPORT_NOT_VERIFIED','mode:',"mode='",'W-DEMO','X-FinWeave-Mock-Session','X-FinWeave-Synthetic','class ApiError','signal?.aborted','setSyntheticWakeup']
    for rel in ['finweave-web/src/services/api.ts','finweave-web/src/services/contracts.ts','finweave-web/src/services/protected-transport.ts']:
        for line,text in enumerate((ROOT/rel).read_text(encoding='utf-8').splitlines(),1):
            found=[x for x in markers if x in text]
            if found:gates.append({'file':rel,'line':line,'markers':found,'sourceSha256':hashlib.sha256((ROOT/rel).read_bytes()).hexdigest(),'status':'OBSERVED_STATIC; ADAPTER_REQUIRED; SOURCE_UNCHANGED'})
    dump(E/'transport-source-review.json',{'scope':'Observed transport gates/context/error plumbing, no frontend execution or mutation','rows':gates})
    # Full canonical field catalogue: semantic parameters/projections are explicitly NOT direct storage columns.
    storage=[]
    for op,field,category,table,col,transform in RULES:
        if op=='ingestNotifications' and field=='Input.items[].normalizedEvidence':
            table,col,transform='payload_objects','content','Typed normalized evidence stored via receipt.result_payload_id; redact independently, retain dedupe identity. No raw/OTP.'
        if op=='recordPriceQuote':transform=transform.replace('Manual synthetic entitlement row required;','Approved manual-source entitlement scope required;')
        storage.append({'operation':op,'field':field,'classification':category,'table':table,'column':col,'transformation':transform})
    storage += [
        {'operation':'linkPlanActual','field':'Input.planItemId','classification':'DIRECT','table':'actual_links','column':'plan_item_id','transformation':'Resolve planning scope/revision from authorized item + planItemVersion. No planVersion input exists; never fabricate it. Actual link also captures planning_revision_id and frozen item version.'},
        {'operation':'ingestNotifications','field':'Input.deviceEpoch','classification':'NORMALIZED','table':'ingestion_receipts','column':'capture_epoch','transformation':'Verify live devices.owner_epoch at acceptance and effect commit; immutable captured owner, no rebind.'},
        {'operation':'ingestNotifications','field':'Input.recoveryEpoch','classification':'COMMAND_PARAMETER','table':'workspaces','column':'recovery_epoch','transformation':'Compare current restore fence; stale uploader reconciles and reauthorizes, never automatically changes owner.'},
    ]
    # Confirm the exact canonical path rather than guess a similarly named field.
    for r in storage:
        assert r['field'] in {__import__('re').sub(r'\|(?:oneOf|anyOf|allOf)\d+','',k) for k in schema_fields(s[r['operation']+r['field'].split('.')[0]],doc,prefix=r['field'].split('.')[0])},(r['operation'],r['field'])
    csvout(OUT/'storage-transformations.csv',storage)
    fieldrows=[]
    for n,(p,o) in ops.items():
        rules={r['field']:r for r in storage if r['operation']==n}
        for direction in ['Input','Output']:
            for field,shape in schema_fields(s[n+direction],doc,prefix=direction).items():
                normalized=__import__('re').sub(r'\|(?:oneOf|anyOf|allOf)\d+','',field)
                matches=[(k,r) for k,r in rules.items() if normalized==k or normalized.startswith(k+'.') or normalized.startswith(k+'[')]
                match=max(matches,key=lambda x:len(x[0]))[1] if matches else None
                fieldrows.append({'operation':n,'direction':direction,'field':field,'required':shape.get('required'),'shape':json.dumps(shape,separators=(',',':')),
                    'handling':match['classification'] if match else 'SERVICE_PARAMETER' if direction=='Input' else 'DOMAIN_PROJECTION',
                    'table':match['table'] if match else '', 'column':match['column'] if match else '',
                    'owner':o['x-finweave']['domainOwner'],'dependencies':','.join(o['x-finweave']['persistenceTables']),
                    'status':'REVIEWED_TRANSFORMATION_RUNTIME_NOT_RUN' if match else 'FIELD_INVENTORIED_SERVICE_RULES_NOT_IMPLEMENTED'})
    csvout(OUT/'field-handling.csv',fieldrows)
    changes=[]
    for n,old in base['components']['schemas'].items():
        if old!=s[n]:changes.append({'schema':n,'status':'CHANGED_UNRELEASED_REVISION','beforeSha256':hashlib.sha256(json.dumps(old,sort_keys=True).encode()).hexdigest(),'afterSha256':hashlib.sha256(json.dumps(s[n],sort_keys=True).encode()).hexdigest()})
    dump(OUT/'revision-diff.json',{'baselineOperations':133,'targetOperations':len(ops),'addedOperations':sorted(set(ops)-{v['post']['operationId'] for v in base['paths'].values()}),'changedSchemas':changes,'unchangedSchemas':len(base['components']['schemas'])-len(changes),'warning':'Unreleased revision, not wire-compatible by2.0.0 label; baseline inputs unchanged.'})
    dump(OUT/'revision.json',{'revision':REV,'contractVersion':'2.0.0','status':'ACCEPTED_DESIGN_NOT_IMPLEMENTED','openapiSha256':hashlib.sha256((OUT/'openapi.json').read_bytes()).hexdigest(),'operations':len(ops),'schemas':len(s),'fieldRows':len(fieldrows),'consumerRows':len(mapping),'observedSource':'../../execution/evidence/arch-05-t1-2026-10-08/observed-contracts.json'})
    print(json.dumps({'operations':len(ops),'schemas':len(s),'fieldRows':len(fieldrows),'consumerRows':len(mapping),'changedBaselineSchemas':len(changes)}))

if __name__=='__main__':main()
