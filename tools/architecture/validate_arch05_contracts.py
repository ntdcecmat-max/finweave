"""Validate T1 API artifacts and synthetic shapes; no backend/native/DB execution."""
from pathlib import Path
import copy,csv,hashlib,json,re,sys,warnings
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/handover-deps'))
warnings.filterwarnings('ignore',category=DeprecationWarning)
from jsonschema import Draft202012Validator,FormatChecker,RefResolver
from openapi_spec_validator import validate_spec

C=ROOT/'docs/contracts/v2-t1'
E=ROOT/'docs/execution/evidence/arch-05-t1-2026-10-08'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    checks=[]
    def record(name,ok,detail):checks.append({'check':name,'status':'PASS' if ok else 'FAIL','detail':detail})
    doc=json.loads((C/'openapi.json').read_text(encoding='utf-8'));s=doc['components']['schemas']
    ops={it['post']['operationId']:(p,it['post']) for p,it in doc['paths'].items()}
    resolver=RefResolver.from_schema(doc)
    def valid(schema,value):return Draft202012Validator(schema,resolver=resolver,format_checker=FormatChecker()).is_valid(value)
    try:validate_spec(doc);record('OpenAPI31',True,len(ops))
    except Exception as exc:record('OpenAPI31',False,str(exc)[:1000])
    bad=[]
    for n,v in s.items():
        try:Draft202012Validator.check_schema(v)
        except Exception:bad.append(n)
    record('JSONSchema2020_12_metaschemas',not bad,{'schemas':len(s),'bad':bad})
    refs=[]
    def visit(v):
        if isinstance(v,dict):
            if '$ref' in v:refs.append(v['$ref'])
            for child in v.values():visit(child)
        elif isinstance(v,list):
            for child in v:visit(child)
    visit(doc)
    record('all_refs_local_resolved',all(r.startswith('#/components/schemas/') and r.split('/')[-1] in s for r in refs),len(refs))
    base=json.loads((ROOT/'docs/contracts/v2/openapi.json').read_text(encoding='utf-8-sig'))
    basenames={it['post']['operationId'] for it in base['paths'].values()}
    record('full_baseline_operations_preserved',basenames<=set(ops) and len(ops)==141 and len(ops)==len(doc['paths']),{'baseline':len(basenames),'target':len(ops),'added':sorted(set(ops)-basenames)})
    rev=json.loads((C/'revision.json').read_text(encoding='utf-8'))
    record('revision_hash_pinned',rev['openapiSha256']==sha(C/'openapi.json') and rev['contractVersion']=='2.0.0',rev['revision'])
    tablecols={t['name']:{c['name'] for c in t['columns']} for t in json.loads((ROOT/'docs/data/target-t1/target-model.json').read_text(encoding='utf-8'))['tables']}
    record('operation_dependencies_exist',all(set(o['x-finweave']['persistenceTables'])<=set(tablecols) for _,o in ops.values()),'Dependencies are not grants/effects proof')
    owners={n:o['security'] for n,(_,o) in ops.items() if o['x-finweave']['actor'] in {'owner','owner-session'}}
    owner_exceptions={'renewSession':[{'OwnerCookie':[]}],'requestCollectorCredentialChallenge':[{'OwnerBearer':[]}],'issueCollectorCredential':[{'OwnerBearer':[]}]}
    record('owner_session_not_collector',all(sec==owner_exceptions.get(n,[{'OwnerCookie':[]},{'OwnerBearer':[]}]) for n,sec in owners.items()),len(owners))
    deviceops={n for n,(_,o) in ops.items() if any('DeviceBearer' in sec for sec in o['security'])}
    record('collector_only_ingest_reconcile',deviceops=={'ingestNotifications','reconcileReceipts'},sorted(deviceops))
    refreshops={n for n,(_,o) in ops.items() if any('NativeRefreshBearer' in sec for sec in o['security'])}
    record('refresh_only_renew',refreshops=={'renewNativeSession'},sorted(refreshops))
    internal={n:o for n,(p,o) in ops.items() if p.startswith('/internal/')}
    record('internal_mtls_AND_signature',all(o['security']==[{'ServiceMTLS':[],'SchedulerSignature':[]}] for o in internal.values()),list(internal))
    record('admin_no_customer_auth_dependencies',all(not(set(ops[n][1]['x-finweave']['persistenceTables'])&{'identities','sessions'}) for n in ['adminSignIn','adminSignOut']),'Admin auth uses OpsIdentity')
    record('private_worker_composite_context_and_fence',all(s[n+'Request']['properties']['workspaceId']=={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'} and {'dispatchJobId','generation','recoveryEpoch','leaseToken'}<=set(s[n+'Input']['required']) for n in ['processIngestionReceipt','executePriceRefresh','executeAgentStep','executeImportJob']),'Typed domain ID validated at runtime; SQL lease correctness NOT RUN')
    record('revision_and_no_store_headers',all(any(h['name']=='X-FW-Contract-Revision' and h.get('required') for h in o['parameters']) and all(r['headers']['Cache-Control']['schema']=={'const':'no-store'} for r in o['responses'].values()) for _,o in ops.values()),'All141 operation descriptions')
    before=json.loads((E/'preservation-before.json').read_text(encoding='utf-8'))['files']
    drift=[p for p,h in before.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
    dump(E/'preservation.json',{'status':'PASS' if not drift else 'FAIL','protectedFiles':len(before),'changed':drift,'files':{p:sha(ROOT/p) if (ROOT/p).is_file() else None for p in before}})
    record('protected_frontend_baselines_DB_research',not drift,{'files':len(before),'changed':drift})
    old_examples={x['operationId']:x for x in json.loads((ROOT/'docs/contracts/v2/examples.json').read_text(encoding='utf-8-sig'))}
    # Prefer original fixture subtree only if valid; never edit actual frontend data.
    def sample(schema,old=None,field=''):
        if '$ref' in schema:schema=s[schema['$ref'].split('/')[-1]]
        if old is not None and valid(schema,old):return copy.deepcopy(old)
        if 'const' in schema:return schema['const']
        if 'enum' in schema:return schema['enum'][0]
        if 'anyOf' in schema or 'oneOf' in schema:
            for child in schema.get('anyOf',schema.get('oneOf',[])):
                try:value=sample(child,old,field)
                except ValueError:continue
                if valid(schema,value):return value
            raise ValueError('Cannot sample union '+field)
        typ=schema.get('type')
        if isinstance(typ,list):
            if 'null' in typ:return None
            return sample({**schema,'type':typ[0]},old,field)
        if typ=='null':return None
        if typ=='object':
            value={k:sample(v,old.get(k) if isinstance(old,dict) else None,k) for k,v in schema.get('properties',{}).items() if k in schema.get('required',[])}
            if valid(schema,value):return value
            raise ValueError('Cannot sample object '+field)
        if typ=='array':return [sample(schema['items'],old[i] if isinstance(old,list) and i<len(old) else None,field) for i in range(schema.get('minItems',0))]
        if typ in {'integer','number'}:return max(schema.get('minimum',0),schema.get('exclusiveMinimum',-1)+1)
        if typ=='boolean':return True
        if typ=='string':
            choices=['SYNTHETIC_ID','2026-10-08T11:00:00+07:00','2026-10-08','2026-10','demo@finweave.test','123456','100000','1','0','0'*64,'FinWeaveSynthetic!2026','https://example.invalid/artifact.apk','A'*max(schema.get('minLength',1),1),'']
            for value in choices:
                if valid(schema,value):return value
            raise ValueError('Cannot sample string '+field)
        raise ValueError('Unsupported schema '+field)
    examples=[];failures=[]
    for n,(p,o) in ops.items():
        old=old_examples.get(n,{})
        if n in {'verifyNativeIdentityChallenge','renewNativeSession'}:old=old_examples['verifyIdentityChallenge']
        try:
            request=sample(s[n+'Request'],old.get('request'))
            reply=sample(s[n+'Reply'],old.get('reply'))
            assert valid(s[n+'Request'],request) and valid(s[n+'Reply'],reply)
            status=next(k for k in o['responses'] if k in {'200','202'})
            examples.append({'operationId':n,'status':int(status),'request':request,'reply':reply,'scope':'SYNTHETIC STRUCTURAL ONLY; no auth/domain/financial oracle; headers per OpenAPI parameters'})
        except Exception as exc:failures.append({'operation':n,'error':str(exc)[:500]})
    dump(C/'examples.json',examples)
    record('positive_request_reply_examples',not failures and len(examples)==141,{'examples':len(examples),'failed':failures})
    ex={x['operationId']:x for x in examples}
    invalid=[]
    def negative(n,title,mutate,part='request'):
        if n not in ex:return
        v=copy.deepcopy(ex[n][part]);mutate(v)
        rejected=not valid(s[n+('Request' if part=='request' else 'Reply')],v)
        invalid.append({'operationId':n,'part':part,'case':title,'payload':v,'rejected':rejected,'scope':'structural only'})
    negative('createAccount','exponent VND',lambda v:v['input']['opening'].update(value='1e6'))
    negative('createAccount','fractional VND',lambda v:v['input']['opening'].update(value='1.1'))
    negative('createAccount','unknown input field',lambda v:v['input'].update(unrecognized=True))
    negative('createAccount','invalid calendar date',lambda v:v['input'].update(openingDate='2026-02-30'))
    negative('ingestNotifications','raw notification forbidden',lambda v:v['input']['items'][0].update(rawNotification='SYNTHETIC_FORBIDDEN'))
    negative('ingestNotifications','device epoch required',lambda v:v['input'].pop('deviceEpoch'))
    negative('ingestNotifications','durable ACK cannot lack receiptID',lambda v:v['data']['receipts'][0].update(state='durable',receiptId=None,errorCode=None),'reply')
    negative('ingestNotifications','rejected ACK cannot claim receipt',lambda v:v['data']['receipts'][0].update(state='rejected',receiptId='SYNTHETIC_ID',errorCode='VALIDATION'),'reply')
    negative('executeImportJob','dispatch generation required',lambda v:v['input'].pop('generation'))
    negative('executeImportJob','worker tenant required',lambda v:v.update(workspaceId=None))
    negative('adminSignIn','admin workspace must be null',lambda v:v.update(workspaceId='W_FORGED'))
    negative('getSession','query cannot carry mutation',lambda v:v.update(mutation=ex['createAccount']['request']['mutation']))
    negative('renewNativeSession','no refresh credential in JSON input',lambda v:v['input'].update(refreshToken='SYNTHETIC_FORBIDDEN'))
    negative('linkPlanActual','no invented planVersion field',lambda v:v['input'].update(planVersion=1))
    bad_replay={'contractVersion':'2.0.0','requestId':'REQ_SYNTHETIC','workspaceVersion':None,'code':'REPLAY_EXPIRED','message':'Synthetic safe error','retryable':False,'retryAfterSeconds':None,'fieldErrors':[],'outcome':'not_committed','resultRef':'RESULT_SYNTHETIC'}
    invalid.append({'operationId':'createAccount','part':'Error','case':'Expired replay cannot claim not_committed','payload':bad_replay,'rejected':not valid(s['Error'],bad_replay),'scope':'structural only'})
    dump(C/'invalid-requests.json',invalid)
    record('negative_structural_boundaries',len(invalid)==15 and all(x['rejected'] for x in invalid),len(invalid))
    error_examples=[]
    for code,outcome in [('REPLAY_EXPIRED','committed'),('RECOVERY_FENCE','unknown'),('REAUTH_REQUIRED','not_committed'),('REFRESH_REUSE','not_committed'),('UNSUPPORTED_MEDIA_TYPE','not_committed')]:
        v={'contractVersion':'2.0.0','requestId':'REQ_SYNTHETIC','workspaceVersion':None,'code':code,'message':'Synthetic safe error','retryable':False,'retryAfterSeconds':None,'fieldErrors':[],'outcome':outcome,'resultRef':'RESULT_SYNTHETIC' if code=='REPLAY_EXPIRED' else None}
        error_examples.append({'error':v,'valid':valid(s['Error'],v),'scope':'Shape only; outcome condition must be runtime-proven'})
    batch_error={'contractVersion':'2.0.0','requestId':'REQ_SYNTHETIC','workspaceVersion':None,'code':'VALIDATION','message':'Synthetic batch rejected','retryable':False,'retryAfterSeconds':None,'fieldErrors':[],'outcome':'not_committed','itemErrors':[{'eventKey':'EVENT_SYNTHETIC','revision':0,'errorCode':'PARSER_UNSUPPORTED'}]}
    batch_schema=ops['ingestNotifications'][1]['responses']['422']['content']['application/json']['schema']
    error_examples.append({'error':batch_error,'valid':valid(s['Error'],batch_error) and valid(batch_schema,batch_error),'scope':'All-rejected item identities structural shape only; server pairing/atomicity NOT RUN'})
    dump(C/'error-examples.json',error_examples)
    record('new_error_shapes',all(x['valid'] for x in error_examples),len(error_examples))
    fields=list(csv.DictReader((C/'field-handling.csv').open(encoding='utf-8')))
    inventory=list(csv.DictReader((C/'operation-inventory.csv').open(encoding='utf-8')))
    record('141_operation_and_field_catalogue',len(inventory)==141 and {r['operation'] for r in fields}==set(ops),{'fieldRows':len(fields),'notClaim':'SQL mapping for every JSON leaf'})
    storage=list(csv.DictReader((C/'storage-transformations.csv').open(encoding='utf-8')))
    record('reviewed_storage_columns_exist',all(not r['table'] or r['column'] in tablecols.get(r['table'],set()) for r in storage),len(storage))
    mapping=list(csv.DictReader((C/'consumer-operation-mapping.csv').open(encoding='utf-8')))
    observed=json.loads((E/'observed-contracts.json').read_text(encoding='utf-8'))
    expected={('operations.' if group=='v1' else 'identityOperations.' if group=='identity' else 'v2Operations.')+n for group in ['v1','identity','v2'] for n in observed[group]}
    record('fresh_consumer_declarations_covered',expected <= {r['sourceSymbol'] for r in mapping},dict(v1=len(observed['v1']),identity=len(observed['identity']),operational=len(observed['v2']),rows=len(mapping)))
    record('mapping_target_ids_exist',all(set(filter(None,r['targetOperations'].split(',')))<=set(ops) for r in mapping),'Fixtures/local capabilities stay separate')
    ast=json.loads((E/'consumer-ast.json').read_text(encoding='utf-8'))
    record('dynamic_calls_retained_not_executed',any(r['kind']=='dynamic_dispatch' for r in ast['rows']) and all(r['runtimeExecuted'] is False for r in ast['rows']),len(ast['rows']))
    broken=[];linkcount=0
    for p in list(C.glob('*.md'))+[ROOT/'docs/architecture/adr/ADR-012-unified-t1-contract-revision.md',ROOT/'docs/architecture/ARCH-05-change-report.md']:
        if not p.exists():broken.append(str(p.relative_to(ROOT)));continue
        for ref in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            if re.match(r'\w+://',ref) or ref.startswith('#'):continue
            dest=(p.parent/ref.split('#')[0].strip('<>')).resolve();linkcount+=1
            if not dest.exists() and dest!=(E/'validation.json').resolve():broken.append({'file':str(p.relative_to(ROOT)),'link':ref})
    record('new_document_links',not broken,{'links':linkcount,'broken':broken})
    report={'status':'PASS_STATIC_CONTRACT_ARTIFACTS' if all(c['status']=='PASS' for c in checks) else 'FAIL','revision':rev,'checks':checks,
            'notRun':['Fastify compiler/serializer conformance','API auth/domain/transaction/queue correctness','SQL migrations/role/concurrency/restore','Consumer adapter implementation/regression','Kotlin/APK/device tests','SEC-REAL-T1/LLM/providers/UAT'],
            'artifactHashes':{p.name:sha(p) for p in sorted(C.iterdir()) if p.is_file()}}
    dump(E/'validation.json',report)
    print(json.dumps({'status':report['status'],'checks':len(checks),'passed':sum(c['status']=='PASS' for c in checks),'failed':[c['check'] for c in checks if c['status']!='PASS'],'exampleFailures':failures,'protected':len(before)}))
    return 0 if report['status']=='PASS_STATIC_CONTRACT_ARTIFACTS' else 1

if __name__=='__main__':raise SystemExit(main())
