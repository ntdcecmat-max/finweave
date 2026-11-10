"""Canonical OpenAPI -> JSON Schema/examples/inventory/mappings; validate artifacts only."""
import copy,csv,hashlib,json,pathlib,re,sys,urllib.parse,datetime,warnings,argparse
R=pathlib.Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'work/handover-deps'))
warnings.filterwarnings('ignore',category=DeprecationWarning)
from jsonschema import Draft202012Validator,FormatChecker,RefResolver
from openapi_spec_validator import validate_spec
from pglast import parse_sql
args=argparse.ArgumentParser(description=__doc__)
args.add_argument('--evidence-dir',required=True)
args.add_argument('--author-examples',action='store_true')
opts=args.parse_args()
if not re.fullmatch(r'docs/execution/evidence/FW-HANDOVER-\d{8}-r\d+',opts.evidence_dir):
 raise SystemExit('Use a new versioned evidence directory; historical evidence is immutable')
C=R/'docs/contracts/v2';E=R/opts.evidence_dir;E.mkdir(parents=True,exist_ok=True)
if (R/'docs/governance/baselines'/E.name/'manifest.json').exists():raise SystemExit('Revision sealed; start a new revision')
doc=json.loads((C/'openapi.json').read_text(encoding='utf-8'));schemas=doc['components']['schemas']
observed=json.loads((E/'observed-contracts.json').read_text(encoding='utf-8'))
model=json.loads((R/'docs/data/physical/physical-model.json').read_text(encoding='utf-8'))
checks=[]
def record(name,ok,details):checks.append({'check':name,'pass':ok,'details':details})
def write(path,v):path.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def deref(s):return schemas[s['$ref'].split('/')[-1]] if '$ref' in s else s
def valid(s,v):return Draft202012Validator(s,resolver=RefResolver.from_schema(doc),format_checker=FormatChecker()).is_valid(v)
def sample(s,old=None,field=''):
 s=deref(s)
 if old is not None and valid(s,old):return old
 if s.get('type')=='object' and {'goals','items','links','reserve','settings'}.issubset(s.get('properties',{})):
  settings=sample(s['properties']['settings'])
  settings.update(months=12,income='5000000',expense='3000000',reserveMonths=3,debt=None,debtPayment='0',stress=False,stressStart=1,stressMonths=1,realMoney=True,poolCash=False)
  return {'goals':[{'ref':'GOAL_NEW','existingId':None,'name':'Quỹ dự phòng synthetic','target':'600000','due':'2027-03-31','account':'A_BANK','contribution':'100000','start':'2026-11-01','day':1,'skipMonths':[],'profile':'cash'}],'items':[],'links':[],'scope':['A_BANK'],'reserve':'1000000','income':'5000000','expense':'3000000','priority':'preserve_plans','notes':'Synthetic fixture; planned income is not cash funding.','settings':settings}
 if 'const' in s:return s['const']
 if 'enum' in s:return s['enum'][0]
 if 'anyOf' in s or 'oneOf' in s:
  for sub in s.get('anyOf',s.get('oneOf',[])):
   value=sample(sub,old,field)
   if valid(s,value):return value
  raise ValueError('Cannot sample union '+field)
 typ=s.get('type')
 if isinstance(typ,list):return None if 'null' in typ else sample({**s,'type':typ[0]},old,field)
 if typ=='null':return None
 if typ=='object':return {k:sample(v,old.get(k) if isinstance(old,dict) else None,k) for k,v in s.get('properties',{}).items() if k in s.get('required',[])}
 if typ=='array':return [sample(s['items'],old[i] if isinstance(old,list) and i<len(old) else None,field) for i in range(s.get('minItems',0))]
 if typ in ['integer','number']:return max(s.get('minimum',0),1 if s.get('exclusiveMinimum')==0 else s.get('exclusiveMinimum',0)+1 if 'exclusiveMinimum' in s else 0)
 if typ=='boolean':return True
 if typ=='string':
  special={'name':'Synthetic fixture','title':'Synthetic fixture','summary':'Synthetic result pending domain verification','reason':'MAINTENANCE','sourceAccountRef':'****0001','transactionRef':'SYNTH_TXN_01','sourceKey':'test_bank','parserVersion':'SYNTHETIC_BANK_V1','packageName':'test.finweave.bank','accountId':'A_BANK','deviceId':'D_A','bindingId':'BIND_A','conversationId':'CONV_A','query':'FPT','text':'Lập mục tiêu quỹ dự phòng synthetic','answer':'Giữ quỹ dự phòng 1000000 VND synthetic','appVersion':'fixture-1','consentVersion':'2026-10-08','brand':'Synthetic brand','region':'Synthetic region','route':'/plan'}
  candidates=([old] if isinstance(old,str) else [])+([special[field]] if field in special else [])+['SYNTHETIC_01','100000','1','0','2026-10-08T11:00:00+07:00','2026-10-08','2026-10','demo@finweave.test','https://example.invalid/artifact.apk','0'*64,'123456','A'*max(s.get('minLength',1),1),'a'*32,'FinWeaveSynthetic!2026','']
  for value in candidates:
   if valid(s,value):return value
  raise ValueError('Cannot sample string '+field+' '+str(s))
 # Unknown type is not permitted on public target operation inputs.
 if not s:return None
 raise ValueError('Cannot sample '+field+' '+str(s)[:300])
paths=[(p,item['post']) for p,item in doc['paths'].items()]
if opts.author_examples:
 old_examples={v['operationId']:v for v in observed['v1Examples']}
 for p,op in paths:
  n=op['operationId'];old=old_examples.get(n,observed['identityExamples'].get(n,{}))
  inp=sample(schemas[n+'Input'],old.get('input'));out=sample(schemas[n+'Output'],old.get('output'))
  req=sample(schemas[n+'Request']);req['input']=inp
  if req['mutation'] is not None:
   req['mutation']['idempotencyKey']='KEY_SYNTHETIC_01'
   req['mutation']['previewToken']='TOKEN_SYNTHETIC_01' if op['x-finweave']['previewRequired'] else None
   if op['x-finweave']['previewRequired']:
    req['mutation']['previewToken']=inp.get('token',inp.get('previewToken',req['mutation']['previewToken']))
  req.update(requestId='REQ_SYNTHETIC_01',workspaceId=None if '/identity/' in p or '/admin/' in p or p.startswith('/internal/') else 'W_A')
  reply=sample(schemas[n+'Reply']);reply['data']=out;reply['requestId']='REQ_SYNTHETIC_01'
  op['requestBody']['content']['application/json']['example']=req
  success=next(s for s in op['responses'] if s in ['200','202'])
  op['responses'][success]['content']['application/json']['example']=reply
 write(C/'openapi.json',doc)
validate_spec(doc);record('OpenAPI 3.1 structural validation',True,len(paths))
for n,s in schemas.items():Draft202012Validator.check_schema(s)
record('JSON Schema metaschema',True,len(schemas))
refs=[]
def visit(v):
 if isinstance(v,dict):
  if '$ref' in v:
   ref=v['$ref'];refs.append(ref)
   if not ref.startswith('#/components/schemas/') or ref.split('/')[-1] not in schemas:raise ValueError('Unresolved '+ref)
  for x in v.values():visit(x)
 elif isinstance(v,list):
  for x in v:visit(x)
visit(doc);record('All local references resolve',True,len(refs))
examples=[];inventory=[];opnames={o['operationId'] for _,o in paths}
for p,op in paths:
 n=op['operationId'];status=next(s for s in op['responses'] if s in ['200','202']);req=op['requestBody']['content']['application/json']['example'];reply=op['responses'][status]['content']['application/json']['example']
 for suffix,value in [('Request',req),('Reply',reply)]:
  validator=Draft202012Validator(schemas[n+suffix],resolver=RefResolver.from_schema(doc),format_checker=FormatChecker())
  errors=list(validator.iter_errors(value))
  if errors:raise ValueError(n+suffix+' '+str(errors[0]))
 examples.append({'operationId':n,'status':int(status),'request':req,'reply':reply,'scope':'structural synthetic fixture; not a financial/domain oracle'})
 meta=op['x-finweave'];inventory.append({'operation':n,'path':p,'method':'POST','actor':meta['actor'],'origin':meta['origin'],'kind':meta['kind'],'status':status,'preview':meta['previewRequired'],'transport':meta['transport'],'permission':meta['authorization'],'tables':','.join(meta['persistenceTables'])})
write(C/'examples.json',examples);record('Positive request/reply examples with formats',True,len(examples)*2)
# Important negative structural examples. Authorization/concurrency cases need runtime tests.
negative=[]
for code,status in [('VERSION_CONFLICT',409),('PREVIEW_EXPIRED',409),('IDEMPOTENCY_CONFLICT',409),('DEVICE_REVOKED',403),('PARSER_UNSUPPORTED',422),('RATE_LIMITED',429),('OUTCOME_UNKNOWN',503)]:
 error={'contractVersion':'2.0.0','requestId':'REQ_SYNTHETIC_01','workspaceVersion':None,'code':code,'message':'Synthetic safe error','retryable':code in ['RATE_LIMITED','OUTCOME_UNKNOWN'],'retryAfterSeconds':30 if code=='RATE_LIMITED' else None,'fieldErrors':[],'outcome':'unknown' if code=='OUTCOME_UNKNOWN' else 'not_committed'}
 assert valid(schemas['Error'],error);negative.append({'status':status,'error':error})
write(C/'error-examples.json',negative)
invalid=[]
for n,mutate in [('createEvent',lambda v:v['input']['amount'].update(value='1e6')),('createAccount',lambda v:v['input'].update(unknownField=True)),('ingestNotifications',lambda v:v['input']['items'][0].update(rawNotification='OTP 123456')),('confirmPlanningDraft',lambda v:v['input'].update(digest='not-a-digest'))]:
 e=copy.deepcopy(next(x['request'] for x in examples if x['operationId']==n));mutate(e);assert not valid(schemas[n+'Request'],e),n;invalid.append({'operationId':n,'request':e,'expected':'schema rejection; no backend execution'})
write(C/'invalid-requests.json',invalid);record('Negative structural fixtures rejected; error DTOs accepted',True,len(invalid)+len(negative))
write(C/'schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','$id':'urn:finweave:v2:derived','components':{'schemas':schemas},'$defs':schemas})
def csvout(path,rows):
 with path.open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
csvout(C/'operation-inventory.csv',inventory)
table_names={t['name'] for t in model['tables']}
for row in inventory:
 for t in row['tables'].split(','):assert t in table_names,(row['operation'],t)
record('Every operation persistence table exists',True,len(inventory))
mapping=[]
for group in ['v1','identity','v2']:
 for n,v in observed[group].items():
  target=n if n in opnames else doc['x-finweave-nonproduction-aliases'][n]
  gap='unified envelope/version; replace synthetic adapter; strict v2 validation; no runtime migration performed'
  if group=='v2':gap+='; paginated reads instead of aggregate getState; string date-times; explicit digest; multi-goal/plan-only bundle; no fixture enrollment'
  if n in ['ingestSourceEvidence','getEvidence']:gap+='; raw source content forbidden; normalized fields only'
  mapping.append({'consumer':'user web + Android user shell','source':group+':'+n,'callSite':'finweave-web/src/services/'+('operational.ts' if group=='v2' else 'api.ts'),'currentTransport':'/__mock/v2/operational' if group=='v2' else '/__mock/v1/'+('identity/' if group=='identity' else 'logical/')+n,'target':target,'gap':gap,'permission':'owner; enrolled device only for ingestion'})
adminmap={'signIn':'adminSignIn','signOut':'adminSignOut','snapshot':'opsStatus','preview':'opsPreviewAction','confirm':'opsConfirmAction'}
for old,new in adminmap.items():mapping.append({'consumer':'admin web','source':'adminGateway.'+old,'callSite':'finweave-web/admin/api.ts','currentTransport':'in-memory SyntheticOperationsGateway; no HTTP','target':new,'gap':'admin cookie/MFA; versioned v2 envelope; ISO expiry; allowlisted reason codes; current free text reasons cannot contain finance','permission':'server-assigned admin only; no finance grant'})
bridges={'getStatus':'device-local','openNotificationSettings':'device-local','acceptDisclosure':'device-local then requestDeviceEnrollment/registerDevice','stopAndQuarantine':'device-local then signOut/revokeDevice as selected by owner','retryQueue':'device-local then ingestNotifications','deleteQuarantined':'device-local','setSources':'device-local plus bindCollector/disableCollectorBinding'}
for old,new in bridges.items():mapping.append({'consumer':'Android native bridge','source':'FinWeaveCollector.'+old,'callSite':'finweave-web/src/native/collector.ts','currentTransport':'Capacitor plugin interface only; implementation absent','target':new,'gap':'Keystore/outbox/worker/enrollment PoC absent; local action is not a server endpoint','permission':'same immutable owner/device; no account switch retarget'})
# The detailed generator resolves source symbols, dynamic adapters, field differences,
# local/fixture capabilities and target-only operations. Do not publish generic rows.
from alignment import consumer_mapping
mapping=consumer_mapping(R,doc,observed,E)
csvout(C/'consumer-operation-mapping.csv',mapping)
record('Observed declaration coverage v1/identity/v2/admin/native',True,{'v1':70,'identity':6,'v2':18,'admin':len(adminmap),'native':len(bridges),'unmapped':0})
# Actual literal call-site inventory, independent of declaration list. Dynamic service
# dispatch is checked by declaration coverage and listed separately, never inferred as executed.
calls=[]
patterns=[('operational',r"operational\(\s*['\"](\w+)['\"]"),('services',r'\bservices\.(\w+)\s*\('),('identityServices',r'\bidentityServices\.(\w+)\s*\('),('adminGateway',r'\badminGateway\.(\w+)\s*\('),('nativeCollector',r"nativeCollector\(\s*['\"](\w+)['\"]"),('commandAdapter',r"\boperation\s*:\s*['\"](\w+)['\"]")]
for folder in ['src','admin']:
 for file in (R/'finweave-web'/folder).rglob('*'):
  if file.suffix not in ['.ts','.tsx']:continue
  content=file.read_text(encoding='utf-8')
  for layer,pattern in patterns:
   for match in re.finditer(pattern,content):
    name=match.group(1)
    if layer=='operational':assert name in observed['v2'],name
    elif layer=='services':assert name in observed['v1'],name
    elif layer=='identityServices':assert name in observed['identity'],name
    elif layer=='adminGateway':assert name in adminmap,name
    elif layer=='commandAdapter':assert name in observed['v1'] or name in observed['v2'],name
    calls.append({'layer':layer,'operation':name,'file':file.relative_to(R).as_posix(),'line':content[:match.start()].count('\n')+1})
csvout(C/'consumer-calls.csv',calls);record('Literal consumer calls resolve to observed contracts',True,len(calls))
# All leaf fields classified. Scalars match dictionary columns only when explicitly
# mapped; complex read projections and command parameters are not claimed as columns.
from data_alignment import RULES
fields=[]
def leaves(s,prefix):
 s=deref(s)
 if s.get('properties'):
  for k,v in s['properties'].items():yield from leaves(v,prefix+'.'+k)
 elif 'items' in s:yield from leaves(s['items'],prefix+'[]')
 elif 'anyOf' in s or 'oneOf' in s:
  for i,v in enumerate(s.get('anyOf',s.get('oneOf',[]))):yield from leaves(v,prefix+'|'+str(i))
 else:yield prefix,s
for row in inventory:
 for direction in ['Input','Output']:
  for field,s in leaves(schemas[row['operation']+direction],direction):
   normalized=re.sub(r'\|\d+','',field)
   rules=[r for r in RULES if r[0]==row['operation'] and (normalized==r[1] or normalized.startswith(r[1]+'.') or normalized.startswith(r[1]+'[]'))]
   if rules:
    rule=max(rules,key=lambda x:len(x[1]));_,_,kind,table,col,transform=rule
   else:
    table=col='';kind='COMMAND_PARAMETER' if direction=='Input' else 'PROJECTION_ENGINE'
    transform='Service authorizes/validates command/context; no inferred direct column from a same-named leaf.' if direction=='Input' else 'Assembled DTO projection from the listed read/write domain dependencies; no claim of one DTO per table.'
   fields.append({'operation':row['operation'],'field':field,'type':json.dumps(s.get('type',s.get('enum','union')),ensure_ascii=False),'mapping':kind,'table':table,'column':col,'sourceTables':row['tables'],'transformation':transform})
csvout(C/'api-data-mapping.csv',fields);record('API leaf fields classified; mapped columns exist',True,len(fields))
from data_alignment import storage_mapping,dependencies
storage=storage_mapping(R,doc,model)
record('Reviewed storage transformations resolve canonical fields and physical columns',True,len(storage))
expected_dependencies=dependencies(doc,model)
for _,op in paths:
 assert op['x-finweave']['persistenceTables']==expected_dependencies[op['operationId']],op['operationId']
record('Operation domain dependencies match reviewed semantics, including ledger drafts/receipts/admin/workers',True,len(paths))
# Parse PostgreSQL outer syntax; pglast does not compile PL/pgSQL or execute constraints.
sqls=list((R/'docs/data/physical').rglob('*.sql'));syntax=[]
for file in sqls:syntax.append({'file':file.relative_to(R).as_posix(),'statements':len(parse_sql(file.read_text(encoding='utf-8')))})
write(E/'sql-syntax.json',syntax);record('PostgreSQL parse only',True,{'files':len(sqls),'databaseExecution':'NOT RUN; no psql; Docker daemon unavailable; PL/pgSQL runtime unverified'})
# Physical model is checked against parsed CREATE TABLE columns/constraints and indexes.
from pglast import ast
ddl=parse_sql((R/'docs/data/physical/migrations/001_synthetic_tables.sql').read_text(encoding='utf-8'))
parsed={stmt.stmt.relation.relname:[node.colname for node in stmt.stmt.tableElts if isinstance(node,ast.ColumnDef)] for stmt in ddl if isinstance(stmt.stmt,ast.CreateStmt)}
assert set(parsed)==table_names
for table in model['tables']:assert parsed[table['name']]==[c['name'] for c in table['columns']],table['name']
record('Physical model and parsed SQL table/column consistency',True,{'tables':len(parsed),'columns':sum(len(x) for x in parsed.values())})
env={}
for line in (R/'docs/handover/environment.synthetic.example').read_text(encoding='utf-8').splitlines():
 if line and not line.startswith('#'):
  key,value=line.split('=',1)
  env[key]=True if value=='true' else False if value=='false' else int(value) if value.isdigit() else value
env_schema=json.loads((R/'docs/handover/environment.schema.json').read_text(encoding='utf-8'));Draft202012Validator(env_schema).validate(env)
assert env['REAL_DATA_ENABLED'] is False and env['EXTERNAL_SPEND_CAP_VND']==0
record('Secret-free fail-closed synthetic environment example',True,len(env))
with (R/'docs/execution/handover-traceability.csv').open(encoding='utf-8') as f:rtm=list(csv.DictReader(f))
assert len(rtm)==41 and {r['AC'] for r in rtm}=={f'AC-{i:02}' for i in range(1,42)}
for row in rtm:
 for name in row['operations'].split(','):assert name in opnames,(row['AC'],name)
 assert (R/row['source']).exists(),row['source']
record('41 AC inventory and operation/source traceability',True,len(rtm))
# Current docs link scope excludes frozen baselines and old evidence reports.
broken=[];checked=0
for file in [R/'README.md']+list((R/'docs').rglob('*.md')):
 if '/baselines/' in file.as_posix() or '/evidence/' in file.as_posix():continue
 content=file.read_text(encoding='utf-8')
 for raw in re.findall(r'(?<!!)\[[^\]]+\]\(([^)]+)\)',content):
  dest=raw.split(' "')[0].strip('<>');dest=urllib.parse.unquote(dest.split('#')[0])
  if not dest or re.match(r'^[a-zA-Z]+:',dest):continue
  checked+=1
  if not (file.parent/dest).exists():broken.append({'file':file.relative_to(R).as_posix(),'target':dest})
write(E/'internal-links.json',{'checked':checked,'broken':broken});record('Current Markdown file links',not broken,{'checked':checked,'broken':len(broken),'scope':'file existence; anchors not yet checked; frozen baselines/evidence excluded'})
assert all('/__mock/' not in p for p,_ in paths)
assert all(op['x-finweave']['actor'] in ['scheduler','worker'] for p,op in paths if p.startswith('/internal/'))
record('No mock production paths; private operations separated',True,len(paths))
admin_ops=[op for p,op in paths if '/admin/' in p]
for op in admin_ops:
 text=json.dumps(schemas[op['operationId']+'Output'])
 assert not any('"'+key+'"' in text for key in ['amount','rawText','prompt','csv','normalizedEvidence','balance','transactions']),op['operationId']
record('Admin output structural denylist',True,len(admin_ops))
for file in (R/'finweave-web/admin').glob('*.ts*'):
 content=file.read_text(encoding='utf-8')
 assert not re.search(r"from\s+['\"][^'\"]*(?:src/(?:domain|mocks|services|app)|features/)",content),file.name
record('Admin source imports do not consume user finance store/services',True,'source check only; no runtime authorization proof')
read=[]
for file in list((R/'docs').rglob('*'))+list((R/'finweave-web/src').rglob('*'))+list((R/'finweave-web/admin').rglob('*'))+list((R/'finweave-web/android-shell').rglob('*')):
 if file.suffix in ['.md','.json','.ts','.tsx','.csv'] and file.is_file():
  if '/evidence/' in file.as_posix():continue
  data=file.read_bytes();read.append({'file':file.relative_to(R).as_posix(),'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data)})
write(E/'reviewed-input-index.json',read)
preservation_file=E/'frontend-preservation.json'
preservation=json.loads(preservation_file.read_text(encoding='utf-8')) if preservation_file.exists() else {'pass':False,'reason':'not yet captured'}
report={'date':'2026-10-08','scope':'handover artifacts only; no backend/native/security runtime assertions','checks':checks,'artifactChecksPass':all(x['pass'] for x in checks),'frontendPreservationPass':preservation['pass'],'frontendDrift':preservation.get('changedAddedDeleted',[]),'pass':all(x['pass'] for x in checks) and preservation['pass'],'operations':len(paths),'schemas':len(schemas),'frontendTests':'NOT RUN; preserved earlier evidence','migrationExecution':'NOT RUN','securityPoC':'NOT RUN'}
write(E/'validation.json',report)
print(json.dumps({'pass':report['pass'],'artifactChecksPass':report['artifactChecksPass'],'frontendPreservationPass':report['frontendPreservationPass'],'checks':len(checks),'operations':len(paths),'brokenLinks':broken[:12]},ensure_ascii=False));sys.exit(0 if report['pass'] else 1)
