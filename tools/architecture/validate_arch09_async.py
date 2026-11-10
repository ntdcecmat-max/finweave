"""Static ARCH09 artifact/shape/model-evidence verifier. Does not execute production code/SQL."""
from pathlib import Path
from fractions import Fraction
import copy,csv,hashlib,json,re,sys,warnings
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'work/handover-deps'));warnings.filterwarnings('ignore',category=DeprecationWarning)
from jsonschema import Draft202012Validator,FormatChecker,RefResolver
D=R/'docs/async';A=R/'docs/contracts/v2-t1-r4';B=R/'docs/data/target-t1-async';E=R/'docs/execution/evidence/arch-09-async-2026-10-09'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def rows(p):return list(csv.DictReader(p.open(encoding='utf-8')))
def rev(v):
    if isinstance(v,dict):return {k:rev(x) for k,x in v.items()}
    if isinstance(v,list):return [rev(x) for x in v]
    return 'FW-API-T1-D1J2-004' if v=='FW-API-T1-D1J2-003' else v

def main():
    checks=[]
    def check(n,ok,detail):checks.append({'check':n,'status':'PASS' if ok else 'FAIL','detail':detail})
    put(E/'validation.json',{'status':'VALIDATING_NOT_ACCEPTED','runtime':'NOT_RUN'})
    api=read(A/'openapi.json');old=read(R/'docs/contracts/v2-t1-r3/openapi.json');s=api['components']['schemas'];diff=read(A/'revision-diff.json')
    check('api004_counts_hash_and_revision',len(api['paths'])==153 and len(s)==634 and read(A/'revision.json')['openapiSha256']==sha(A/'openapi.json') and api['x-finweave-revision']['id']=='FW-API-T1-D1J2-004',{'operations':len(api['paths']),'schemas':len(s)})
    changed={n for n,v in old['components']['schemas'].items() if v!=s[n]}
    check('exact_two_inherited_schema_changes',changed==set(diff['changedInheritedSchemas'])=={'previewImportInput','getSyncStateOutput'},sorted(changed))
    check('624_inherited_schemas_unchanged',len(old['components']['schemas'])-len(changed)==624,'No hidden inherited wire changes')
    check('151_inherited_paths_only_revision_metadata',all(api['paths'][p]==rev(v) for p,v in old['paths'].items()),'Requests/replies schema refs retained; two referenced schema deltas explicit')
    check('new_queries_and_8_schemas',len(set(s)-set(old['components']['schemas']))==8 and set(diff['addedOperations'])=={'listCoverage','listCoverageGaps'},'No fake public heartbeat or recovery-replay operation')
    check('standalone_schema_registry',read(A/'schemas.json')['components']['schemas']==s,'Internal refs valid in standalone components registry')
    invalidSchemas=[]
    for n,v in s.items():
      try:Draft202012Validator.check_schema(v)
      except Exception as exc:invalidSchemas.append([n,str(exc)[:160]])
    check('634_jsonschema_definitions_valid',not invalidSchemas,invalidSchemas)
    badrefs=[];refcount=0
    def walk(v):
      nonlocal refcount
      if isinstance(v,dict):
        for k,x in v.items():
          if k=='$ref':
            refcount+=1;cur=api
            if not x.startswith('#/'):badrefs.append(x);continue
            try:
              for bit in x[2:].split('/'):cur=cur[bit.replace('~1','/').replace('~0','~')]
            except (KeyError,TypeError):badrefs.append(x)
          else:walk(x)
      elif isinstance(v,list):
        for x in v:walk(x)
    walk(api);check('all_internal_references',not badrefs,{'count':refcount,'bad':badrefs})
    ops={v['post']['operationId']:v['post'] for v in api['paths'].values()}
    check('revision_headers_all153',all(o['parameters'][0]['schema']['const']=='FW-API-T1-D1J2-004' and all(r.get('headers',{}).get('X-FW-Contract-Revision',{}).get('schema',{}).get('const')=='FW-API-T1-D1J2-004' for r in o['responses'].values()) for o in ops.values()),'Exact request+response revision, label2.0.0 insufficient')
    check('coverage_owner_only',all(ops[n]['security']==[{'OwnerCookie':[]},{'OwnerBearer':[]}] and ops[n]['x-finweave']['kind']=='query' for n in diff['addedOperations']),'Collector/admin denied by target contract; runtime auth NOT_RUN')
    resolver=RefResolver.from_schema(api);fmt=FormatChecker()
    def valid(n,v):return not list(Draft202012Validator(s[n],resolver=resolver,format_checker=fmt).iter_errors(v))
    examples=read(A/'examples.json');positive=[]
    for x in examples:
      for side,suffix in [('request','Request'),('reply','Reply')]:positive.append({'operation':x['operationId'],'side':side,'valid':valid(x['operationId']+suffix,x[side])})
    check('8_new_or_modified_example_shapes',len(positive)==8 and all(v['valid'] for v in positive),positive)
    inherited=read(R/'docs/contracts/v2-t1-r2/examples.json')+read(R/'docs/contracts/v2-t1-r3/examples.json');priorbad=[];count=0
    for x in inherited:
      if x['operationId'] in ['previewImport','getSyncState']:continue
      for side,suffix in [('request','Request'),('reply','Reply')]:
        count+=1
        if not valid(x['operationId']+suffix,x[side]):priorbad.append([x['operationId'],side])
    check('298_inherited_shapes',count==298 and not priorbad,{'shapes':count,'bad':priorbad})
    base=copy.deepcopy(next(x['request']['input'] for x in examples if x['operationId']=='previewImport'));variants=[]
    def addshape(name,schema,value,expected):variants.append({'case':name,'schema':schema,'expectedValid':expected,'actualValid':valid(schema,value)})
    addshape('signed CSV header labels','previewImportInput',base,True)
    debit=copy.deepcopy(base);debit['mapping']['amountFormat']='debit_credit_vnd';debit['mapping'].pop('amount',None);debit['mapping'].update(debit='Debit',credit='Credit');addshape('debit-credit mode without unused amount','previewImportInput',debit,True)
    for title,field,value in [('empty date selector','date',''),('long amount selector','amount','A'*121),('unknown selector property','rawBankBody','SYN_FORBIDDEN')]:
      v=copy.deepcopy(base);v['mapping'][field]=value;addshape(title,'previewImportInput',v,False)
    v=copy.deepcopy(base);v['mapping'].pop('amount');addshape('signed missing amount','previewImportInput',v,False)
    for key in ['debit','credit']:
      v=copy.deepcopy(debit);v['mapping'].pop(key);addshape('debit-credit missing '+key,'previewImportInput',v,False)
    page=copy.deepcopy(next(x['request']['input'] for x in examples if x['operationId']=='listCoverageGaps'))
    for title,field,value in [('duplicate account filter','accountIds',['A','A']),('empty filter','accountIds',[]),('invalid timestamp','periodStart','not-a-time')]:
      v=copy.deepcopy(page);v[field]=value;addshape(title,'listCoverageGapsInput',v,False)
    for size in [0,101]:
      v=copy.deepcopy(page);v['page']['pageSize']=size;addshape('page size'+str(size),'listCoverageGapsInput',v,False)
    v=copy.deepcopy(page);v['page']['cursor']='';addshape('empty cursor','listCoverageGapsInput',v,False)
    data=copy.deepcopy(next(x['reply']['data'] for x in examples if x['operationId']=='getSyncState'))
    for flag in ['coverageComplete','deviceIdsComplete']:
      v=copy.deepcopy(data);v.pop(flag);addshape('missing '+flag,'getSyncStateOutput',v,False)
    neg=[v for v in variants if not v['expectedValid']]
    check('csv_and_paging_shape_cases',len(variants)==16 and all(v['expectedValid']==v['actualValid'] for v in variants),{'extraPositive':2,'negative':len(neg)})
    semantic=[]
    for start,end in [('2026-10-10T00:00:00Z','2026-10-09T00:00:00Z'),('2026-10-09T00:00:00Z',None)]:
      v=copy.deepcopy(page);v.update(periodStart=start,periodEndExclusive=end);semantic.append({'input':v,'shapeValid':valid('listCoverageGapsInput',v),'semanticRejected':end is None or start>=end})
    check('shape_valid_semantic_period_errors',all(v['shapeValid'] and v['semanticRejected'] for v in semantic),'Mandatory semantic paired/increasing timestamps, not endpoint enforcement')
    put(E/'schema-shape-results.json',{'scope':'SCHEMA SHAPES ONLY; parser/endpoint auth/paging NOT_RUN','examples':positive,'csvPagingCases':variants,'semanticExamples':semantic})
    perms=rows(D/'operation-permissions.csv');overlay=rows(D/'operation-security-overlay.csv')
    check('153_operation_permissions_overlay',len(perms)==len(overlay)==153 and {x['operation'] for x in perms}==set(ops)=={x['operation'] for x in overlay} and all(x['apiRevision']=='FW-API-T1-D1J2-004' for x in overlay),'No runtime grants claim')
    m=read(B/'target-model.json');oldm=read(R/'docs/data/target-t1-domain/target-model.json');tables={t['name']:t for t in m['tables']}
    check('db005_counts_and_pin',len(tables)==87 and sum(len(t['columns']) for t in m['tables'])==1001 and len(m['foreignKeys'])==162 and read(B/'revision.json')['modelSha256']==sha(B/'target-model.json'),'One table +3columns +1FK; design only')
    check('all86_old_columns_prefix_preserved',all(t['columns']==tables[t['name']]['columns'][:len(t['columns'])] for t in oldm['tables']),'No destructive old field change in expand design')
    check('exact_storage_delta',set(tables)-{t['name'] for t in oldm['tables']}=={'provider_quota_buckets'} and [c['name'] for c in tables['jobs']['columns'][-2:]]==['policy_version','deadline_at'] and tables['refresh_jobs']['columns'][-1]['name']=='request_payload_id','No second queue authority')
    fkbad=[]
    for fk in m['foreignKeys']:
      if fk['table'] not in tables or fk['target'] not in tables or not set(fk['columns'])<={c['name'] for c in tables[fk['table']]['columns']} or not set(fk['targetColumns'])<={c['name'] for c in tables[fk['target']]['columns']}:fkbad.append(fk)
    check('162_fk_references',not fkbad,fkbad)
    registry=read(D/'job-registry.json')['jobs'];policy=read(D/'async-policy.json');badreg=[]
    for x in registry:
      if x['domainTable'] not in tables or x['heartbeatSeconds']*3>min(x['leaseSeconds'],x['maxActiveSecondsPerAttempt']) or x['payloadInJobs'] or x['policyVersion']!=policy['id']:badreg.append(x['jobType'])
      if '(local port)' not in x['executionPort'] and (x['executionPort'] not in ops or ops[x['executionPort']]['security']!=[{'ServiceMTLS':[],'SchedulerSignature':[]}]):badreg.append(x['executionPort'])
    check('six_typed_jobs_profiles_and_timings',len(registry)==6 and not badreg,{'bad':badreg,'timings':'UNMEASURED_STARTING_CONFIG'})
    tr=rows(D/'job-transitions.csv');states={'queued','running','succeeded','failed','cancelled'}
    check('job_transition_guards_and_terminals',len(tr)==14 and all(x['from'] in states and x['to'] in states and x['guard'] for x in tr) and not any(x['from'] in {'succeeded','cancelled'} for x in tr),'Terminal jobs cannot be blindly reopened')
    classes=rows(D/'table-data-classification.csv')
    check('87_table_classifications_quota_private',len(classes)==87 and {x['table'] for x in classes}==set(tables) and next(x for x in classes if x['table']=='provider_quota_buckets')['opsExposure']=='DENY_DIRECT','App-admin does not get quota namespaces/private finance')
    bundle=read(D/'implementation-bundle.json');pins={'apiSha256':A/'openapi.json','databaseModelSha256':B/'target-model.json','asyncPolicySha256':D/'async-policy.json','registrySha256':D/'job-registry.json','engineBundleSha256':R/'docs/domain/implementation-bundle.json','securityPolicySha256':R/'docs/security/t1/security-policy.json'}
    add=bundle['securityBindingAddendum']
    check('bundle_and_security_addendum_pins',all(bundle[k]==sha(p) for k,p in pins.items()) and add['permissionMatrixSha256']==sha(D/'operation-permissions.csv') and add['operationOverlaySha256']==sha(D/'operation-security-overlay.csv') and add['tableClassificationSha256']==sha(D/'table-data-classification.csv'),'New API004/DB005 overlay explicit; old bundles not rewritten')
    req=rows(D/'requirement-traceability.csv');accept=(D/'acceptance-plan.md').read_text(encoding='utf-8')
    check('32_refinements_and_runtime_not_run',len(req)==32 and {x['requirement'] for x in req}=={f'ASY-{i:02d}' for i in range(1,33)} and set(re.findall(r'ASN-\d\d /',accept))=={f'ASN-{i:02d} /' for i in range(1,33)} and all(x['status']=='SPECIFIED_RUNTIME_NOT_RUN' for x in req) and 'ALL 32 RUNTIME CASES NOT RUN' in accept,'No parent AC count increase, no mock as real')
    model=read(E/'model-results.json');vectors=read(D/'model-vectors.json')['cases']
    check('48_specification_model_vectors',model['status']=='MODEL_ONLY_PASS' and len(model['cases'])==len(vectors)==48 and all(x['status']=='PASS' for x in model['cases']),'Not SQL/concurrency/provider/native performance evidence')
    before=read(E/'preservation-before.json')['files'];drift=[n for n,v in before.items() if not (R/n).is_file() or sha(R/n)!=v]
    put(E/'preservation.json',{'status':'PASS' if not drift else 'FAIL','checkedFiles':len(before),'drift':drift,'scope':'Protected prior source/packages/baselines/tools/evidence'})
    check('377_protected_hashes',len(before)==377 and not drift,{'checked':len(before),'drift':drift})
    obs=read(E/'source-observations.json')['observations']
    check('4_source_observations_exact_hashes',len(obs)==4 and all(sha(R/x['source'])==x['sha256'] and x['runtime']=='NOT_RUN' and not x['modified'] for x in obs),'Static observations with API004 design disposition, not bug reproduction')
    docs=list(D.glob('*.md'))+list(A.glob('*.md'))+list(B.glob('*.md'))+[R/'docs/architecture/adr/ADR-016-postgresql-dispatch-and-explicit-sync-outcomes.md',R/'docs/architecture/ARCH-09-change-report.md'];broken=[];links=0
    for p in docs:
      for target in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
        if target.startswith(('http:','https:','#')):continue
        links+=1
        if not (p.parent/target.split('#')[0]).resolve().exists():broken.append([p.relative_to(R).as_posix(),target])
    check('new_document_local_links',not broken,{'count':links,'broken':broken})
    output={'date':'2026-10-09','status':'STATIC_PASS' if all(x['status']=='PASS' for x in checks) else 'FAIL','checks':checks,
      'scope':'Artifact schemas/metadata/pins/structural examples/model report/preservation; no runtime execution',
      'runtime':'SQL/grants/workers/concurrency/native/provider/crypto/restore/model/performance/consumer migration/UAT NOT_RUN'}
    put(E/'validation.json',output);print(json.dumps({'status':output['status'],'checks':len(checks),'failed':[x for x in checks if x['status']=='FAIL']},ensure_ascii=True))
    if output['status']=='FAIL':raise SystemExit(1)

if __name__=='__main__':main()
