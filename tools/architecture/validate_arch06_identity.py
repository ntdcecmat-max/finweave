"""Static OpenAPI/schema/model/permission/preservation validation, never security PoC."""
from pathlib import Path
import base64,copy,csv,hashlib,json,re,sys,warnings
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/handover-deps'))
warnings.filterwarnings('ignore',category=DeprecationWarning)
from jsonschema import Draft202012Validator,FormatChecker,RefResolver
from openapi_spec_validator import validate_spec
C=ROOT/'docs/contracts/v2-t1-r2';D=ROOT/'docs/data/target-t1-auth';E=ROOT/'docs/execution/evidence/arch-06-identity-2026-10-08'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def main():
    checks=[]
    def record(n,ok,detail):checks.append({'check':n,'status':'PASS' if ok else 'FAIL','detail':detail})
    doc=json.loads((C/'openapi.json').read_text(encoding='utf-8'));s=doc['components']['schemas'];ops={v['post']['operationId']:(p,v['post']) for p,v in doc['paths'].items()}
    resolver=RefResolver.from_schema(doc)
    def valid(schema,value):return Draft202012Validator(schema,resolver=resolver,format_checker=FormatChecker()).is_valid(value)
    try:validate_spec(doc);record('OpenAPI31',True,len(ops))
    except Exception as exc:record('OpenAPI31',False,str(exc)[:1200])
    bad=[]
    for n,v in s.items():
        try:Draft202012Validator.check_schema(v)
        except Exception as exc:bad.append([n,str(exc)[:150]])
    record('JSONSchema2020_12',not bad,{'schemas':len(s),'bad':bad})
    refs=[]
    def visit(v):
        if isinstance(v,dict):
            if '$ref' in v:refs.append(v['$ref'])
            for x in v.values():visit(x)
        elif isinstance(v,list):
            for x in v:visit(x)
    visit(doc);record('resolved_local_refs',all(r.startswith('#/components/schemas/') and r.split('/')[-1] in s for r in refs),len(refs))
    prev=json.loads((ROOT/'docs/contracts/v2-t1/openapi.json').read_text(encoding='utf-8'));previous={v['post']['operationId'] for v in prev['paths'].values()}
    record('preserve_141_full_feature_operations',previous<=set(ops) and len(ops)==147 and len(doc['paths'])==147,{'previous':len(previous),'current':len(ops),'added':sorted(set(ops)-previous)})
    rev=json.loads((C/'revision.json').read_text(encoding='utf-8'))
    record('revision_and_digest',rev['openapiSha256']==sha(C/'openapi.json') and rev['previousOpenapiSha256']==sha(ROOT/'docs/contracts/v2-t1/openapi.json') and rev['revision']=='FW-API-T1-D1J2-002',rev['revision'])
    record('schema_bundle_matches',json.loads((C/'schemas.json').read_text(encoding='utf-8'))['components']['schemas']==s,len(s))
    record('operation_refs_and_context',all(s[n+'Request']['properties']['operationId']=={'const':n} and o['requestBody']['content']['application/json']['schema']['$ref'].endswith(n+'Request') and any(o['responses'][code]['content']['application/json']['schema']['$ref'].endswith(n+'Reply') for code in ['200','202'] if code in o['responses']) for n,(_,o) in ops.items()),'Operation ID belongs to request; response is the operation-specific Reply schema, not a fabricated operationId field')
    record('host_cookie_names',doc['components']['securitySchemes']['OwnerCookie']['name']=='__Host-fw_session' and doc['components']['securitySchemes']['AdminCookie']['name']=='__Host-fw_admin_session','Cookie flags are runtime tests')
    device={n for n,(_,o) in ops.items() if any('DeviceBearer' in x for x in o.get('security',[]))}
    renewal={n for n,(_,o) in ops.items() if any('DeviceRenewalBearer' in x for x in o.get('security',[]))}
    record('collector_authority_narrow',device=={'ingestNotifications','reconcileReceipts'} and renewal=={'renewCollectorCredential'},{'device':sorted(device),'renewal':sorted(renewal)})
    record('native_refresh_isolated',{n for n,(_,o) in ops.items() if any('NativeRefreshBearer' in x for x in o.get('security',[]))}=={'renewNativeSession'},'No access-cookie-collector fallback')
    rows=list(csv.DictReader((ROOT/'docs/security/identity/operation-permissions.csv').open(encoding='utf-8')))
    record('complete_permission_matrix',len(rows)==len(ops) and {r['operation'] for r in rows}==set(ops),'147 operations, not implemented DB grants')
    record('cookie_mutations_csrf',all(o['x-finweave']['identityPolicy']['csrfIfCookieMutation'] for _,o in ops.values() if o['x-finweave']['kind']=='mutation' and any('OwnerCookie' in x or 'AdminCookie' in x for x in o.get('security',[]))),'Conditional runtime enforcement NOT RUN')
    private=[o for p,o in ops.values() if p.startswith('/internal/')]
    record('private_identity_and_signature',all(o['security']==[{'ServiceMTLS':[],'SchedulerSignature':[]}] for o in private),len(private))
    m=json.loads((D/'target-model.json').read_text(encoding='utf-8'));tables={t['name']:t for t in m['tables']}
    base=json.loads((ROOT/'docs/data/target-t1/target-model.json').read_text(encoding='utf-8'))
    record('model_expand_no_column_loss',all(set(c['name'] for c in t['columns'])<=set(c['name'] for c in tables[t['name']]['columns']) for t in base['tables']),{'tables':len(tables),'columns':sum(len(t['columns']) for t in tables.values())})
    missing=[(f['table'],f['target']) for f in m['foreignKeys'] if f['table'] not in tables or f['target'] not in tables or not set(f['columns'])<={c['name'] for c in tables.get(f['table'],{}).get('columns',[])} or not set(f['targetColumns'])<={c['name'] for c in tables.get(f['target'],{}).get('columns',[])}]
    record('foreign_key_column_refs',not missing,{'foreignKeys':len(m['foreignKeys']),'bad':missing})
    record('operation_storage_dependencies',all(set(o['x-finweave']['persistenceTables'])<=set(tables) for _,o in ops.values()),'Dependencies are not grants or write effects')
    record('owner_ops_replay_rate_separation',tables['auth_replays']['owner']=='Identity' and tables['ops_auth_replays']['owner']=='OpsIdentity' and tables['auth_rate_buckets']['owner']!=tables['ops_auth_rate_buckets']['owner'],'No shared owner/Ops secret result table')
    record('separate_nonce_authorities',all(t in tables for t in ['service_nonces','native_proof_nonces','collector_proof_nonces']),'Purpose-specific indexes/procedures still SQL NOT RUN')
    # Structural examples; retain valid historical examples and recursively fill changed fields.
    old={x['operationId']:x for x in json.loads((ROOT/'docs/contracts/v2-t1/examples.json').read_text(encoding='utf-8'))}
    def sample(schema,prior=None):
        if prior is not None and valid(schema,prior):return prior
        if '$ref' in schema:return sample(s[schema['$ref'].split('/')[-1]],prior)
        if 'const' in schema:return schema['const']
        if 'enum' in schema:return schema['enum'][0]
        for union in ['oneOf','anyOf']:
            if union in schema:
                for branch in schema[union]:
                    try:
                        value=sample(branch,prior)
                        if valid(schema,value):return value
                    except ValueError:pass
                raise ValueError('No union sample')
        typ=schema.get('type')
        if isinstance(typ,list):return None if 'null' in typ else sample({**schema,'type':typ[0]},prior)
        if typ=='null':return None
        if typ=='object':return {k:sample(v,prior.get(k) if isinstance(prior,dict) else None) for k,v in schema.get('properties',{}).items() if k in schema.get('required',[])}
        if typ=='array':
            if schema.get('uniqueItems') and schema.get('items',{}).get('pattern')=='^[A-Za-z0-9_-]{43}$':
                return [base64.urlsafe_b64encode(hashlib.sha256(('SYNTHETIC_NOT_SECRET_'+str(i)).encode()).digest()).decode().rstrip('=') for i in range(schema.get('minItems',0))]
            return [sample(schema['items'],prior[i] if isinstance(prior,list) and i<len(prior) else None) for i in range(schema.get('minItems',0))]
        if typ in ['integer','number']:return max(schema.get('minimum',0),schema.get('exclusiveMinimum',-1)+1)
        if typ=='boolean':return True
        if typ=='string':
            for value in ['SYNTHETIC_ID','demo@finweave.test','2026-10-08T11:00:00+07:00','2026-10-08','2026-10','123456','100000','1','0','0'*64,'A'*43,'A'*86,'FinWeaveSynthetic!2026','https://example.invalid/artifact.apk','A'*max(schema.get('minLength',1),1),'']:
                if valid(schema,value):return value
        raise ValueError('Cannot sample '+str(schema)[:100])
    examples=[];fail=[]
    for n in ops:
        try:
            request=sample(s[n+'Request'],old.get(n,{}).get('request'));reply=sample(s[n+'Reply'],old.get(n,{}).get('reply'))
            assert valid(s[n+'Request'],request) and valid(s[n+'Reply'],reply)
            examples.append({'operationId':n,'request':request,'reply':reply,'scope':'SYNTHETIC SHAPE ONLY; signatures/password/code are NOT live credentials or security vectors'})
        except Exception as exc:fail.append([n,str(exc)[:250]])
    dump(C/'examples.json',examples);record('positive_shapes_294',len(examples)==147 and not fail,{'requestReplyShapes':len(examples)*2,'failed':fail})
    ex={x['operationId']:x for x in examples};negative=[]
    def neg(n,title,change,part='request'):
        v=copy.deepcopy(ex[n][part]);change(v);negative.append({'operationId':n,'case':title,'part':part,'payload':v,'rejected':not valid(s[n+('Request' if part=='request' else 'Reply')],v)})
    for n in ['signIn','registerIdentity','resetIdentityPassword','adminSignIn']:neg(n,'Password shorter than15',lambda v:v['input'].update(password='A'*14))
    neg('signIn','installationPublicKey explicitly required',lambda v:v['input'].pop('installationPublicKey'))
    neg('registerIdentity','unknown arbitrary role forbidden',lambda v:v['input'].update(role='admin'))
    neg('redeemOwnerRecoveryCode','short recovery code rejected',lambda v:v['input'].update(recoveryCode='123456'))
    neg('resetIdentityPassword','short reset token rejected',lambda v:v['input'].update(resetToken='123456'))
    neg('renewCollectorCredential','workspace required',lambda v:v.update(workspaceId=None))
    neg('renewCollectorCredential','epoch required',lambda v:v['input'].pop('recoveryEpoch'))
    neg('renewNativeSession','no refresh token JSON',lambda v:v['input'].update(refreshToken='A'*43))
    neg('registerDevice','DER-shaped/non-raw proof forbidden',lambda v:v['input'].update(proof='A'*96))
    neg('adminReauthenticate','owner workspace forbidden',lambda v:v.update(workspaceId='OTHER'))
    neg('verifyOwnerReauthentication','extra subject cannot choose owner',lambda v:v['input'].update(subjectId='OTHER'))
    neg('ingestNotifications','raw notification forbidden',lambda v:v['input']['items'][0].update(rawNotification='SYNTHETIC_FORBIDDEN'))
    neg('rotateOwnerRecoveryCodes','recovery codes must be distinct',lambda v:v['data']['codes'].__setitem__(1,v['data']['codes'][0]),'reply')
    dump(C/'invalid-requests.json',negative);record('negative_shapes_16',len(negative)==16 and all(x['rejected'] for x in negative),len(negative))
    # Runtime cases are explicitly planned, not simulated into PASS.
    acceptance=(ROOT/'docs/security/identity/acceptance-plan.md').read_text(encoding='utf-8')
    record('30_runtime_cases_marked_not_run',len(set(re.findall(r'\| (AUTH-\d\d) \|',acceptance)))==30 and 'ALL RUNTIME CASES NOT RUN' in acceptance,'No crypto/server/native execution performed')
    before=json.loads((E/'preservation-before.json').read_text(encoding='utf-8'))['files'];drift=[]
    for rel,digest in before.items():
        p=ROOT/rel
        if not p.exists() or sha(p)!=digest:drift.append(rel)
    dump(E/'preservation.json',{'status':'PASS' if not drift else 'FAIL','checkedFiles':len(before),'drift':drift,'scope':'Prior frontend/config/baselines/API001/DB physical and D1J2/research/evidence/tools capture'})
    record('protected_hashes',not drift,{'checked':len(before),'drift':drift})
    paths=list(C.glob('*.md'))+list(D.glob('*.md'))+list((ROOT/'docs/security/identity').glob('*.md'))+[ROOT/'docs/architecture/adr/ADR-013-first-party-identity-and-scoped-credentials.md',ROOT/'docs/architecture/ARCH-06-change-report.md']
    broken=[];linkcount=0
    for p in paths:
        if not p.exists():broken.append(str(p.relative_to(ROOT)));continue
        for target in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            if target.startswith(('https:','http:','#')):continue
            linkcount+=1
            if not (p.parent/target.split('#')[0]).resolve().exists():broken.append([str(p.relative_to(ROOT)),target])
    record('new_document_links',not broken,{'localLinks':linkcount,'broken':broken})
    evidence={'status':'STATIC_PASS' if all(x['status']=='PASS' for x in checks) else 'FAIL','scope':'DESIGN ARTIFACTS AND SYNTHETIC SCHEMA SHAPES ONLY','checks':checks,'runtime':'AUTH-01..30 NOT RUN; SQL/backend/crypto/mail/native/security/restore NOT RUN','revision':rev}
    dump(E/'validation.json',evidence)
    print(json.dumps({'status':evidence['status'],'checks':len(checks),'failed':[x for x in checks if x['status']=='FAIL']},ensure_ascii=True))
    if evidence['status']=='FAIL':raise SystemExit(1)
if __name__=='__main__':main()
