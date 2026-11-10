"""Static schemas/pins/preservation review only. Never claims production Engine/DB/security PASS."""
from pathlib import Path
from fractions import Fraction
import copy,csv,hashlib,json,re,sys,warnings
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'work/handover-deps'));warnings.filterwarnings('ignore',category=DeprecationWarning)
from jsonschema import Draft202012Validator,FormatChecker,RefResolver
D=R/'docs/domain';A=R/'docs/contracts/v2-t1-r3';B=R/'docs/data/target-t1-domain';E=R/'docs/execution/evidence/arch-08-domain-2026-10-09'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def rows(p):return list(csv.DictReader(p.open(encoding='utf-8')))
def replace_revision(x):
    if isinstance(x,dict):return {k:replace_revision(v) for k,v in x.items()}
    if isinstance(x,list):return [replace_revision(v) for v in x]
    return 'FW-API-T1-D1J2-003' if x=='FW-API-T1-D1J2-002' else x
def main():
    checks=[]
    def check(n,ok,detail):checks.append({'check':n,'status':'PASS' if ok else 'FAIL','detail':detail})
    put(E/'validation.json',{'status':'VALIDATING_NOT_ACCEPTED','scope':'Static artifacts only'})
    a=read(A/'openapi.json');old=read(R/'docs/contracts/v2-t1-r2/openapi.json');s=a['components']['schemas'];rev=read(A/'revision.json');bundle=read(D/'implementation-bundle.json');policy=read(D/'engine-policy.json')
    check('api003_counts_and_pin',len(a['paths'])==151 and len(s)==626 and rev['openapiSha256']==sha(A/'openapi.json'),rev)
    check('all_600_inherited_schemas_unchanged',all(s[n]==v for n,v in old['components']['schemas'].items()),'New schemas only; no hidden old payload change')
    check('all_147_inherited_operations_only_revision_metadata',all(a['paths'][p]==replace_revision(v) for p,v in old['paths'].items()),'Exact header/metadata revision replacement, not wire schema upgrade by label')
    check('standalone_schema_registry_matches',read(A/'schemas.json')['components']['schemas']==s,'Internal #/components/schemas references resolve in standalone registry')
    badrefs=[];refcount=0
    def walk(v):
        nonlocal refcount
        if isinstance(v,dict):
            if '$ref' in v:
                refcount+=1;target=v['$ref']
                if not target.startswith('#/components/schemas/') or target.split('/')[-1] not in s:badrefs.append(target)
            for w in v.values():walk(w)
        elif isinstance(v,list):
            for w in v:walk(w)
    walk(a);check('all_internal_schema_refs_resolve',not badrefs,{'count':refcount,'bad':badrefs})
    diff=read(A/'revision-diff.json');news=diff['addedSchemas'];invalid=[]
    for n in news:
        try:Draft202012Validator.check_schema(s[n])
        except Exception as exc:invalid.append([n,str(exc)[:150]])
    check('new_26_schema_definitions',len(news)==26 and not invalid,invalid)
    resolver=RefResolver.from_schema(a)
    def valid(n,v):return Draft202012Validator(s[n],resolver=resolver,format_checker=FormatChecker()).is_valid(v)
    examples=read(A/'examples.json');positive=[]
    for x in examples:
        for side,suffix in [('request','Request'),('reply','Reply')]:positive.append({'operation':x['operationId'],'side':side,'valid':valid(x['operationId']+suffix,x[side])})
    check('new_operation_examples_8_shapes',len(positive)==8 and all(x['valid'] for x in positive),positive)
    # All inherited examples remain valid payloads under the inherited schemas, without new runtime claims.
    inherited=read(R/'docs/contracts/v2-t1-r2/examples.json');oldbad=[]
    for x in inherited:
        for side,suffix in [('request','Request'),('reply','Reply')]:
            if not valid(x['operationId']+suffix,x[side]):oldbad.append([x['operationId'],side])
    check('inherited_294_example_shapes',len(inherited)==147 and not oldbad,{'shapes':len(inherited)*2,'bad':oldbad})
    base=copy.deepcopy(next(x['request']['input'] for x in examples if x['operationId']=='startForecastRun'));negative=[]
    def neg(title,change):
        v=copy.deepcopy(base);change(v);negative.append({'case':title,'rejected':not valid('startForecastRunInput',v)})
    for field in ['rawNotification','bankOTP','ledger','actualBalance','prompt','role']:neg('forbidden '+field,lambda v,f=field:v.update({f:'SYN_FORBIDDEN'}))
    neg('money Number forbidden',lambda v:v['settings'].update(income=100))
    neg('nonfinite rate forbidden',lambda v:v['settings'].update(inflation='NaN'))
    neg('rate scale9 forbidden',lambda v:v['settings'].update(inflation='1.123456789'))
    neg('months0 forbidden',lambda v:v['settings'].update(months=0))
    neg('months361 forbidden',lambda v:v['settings'].update(months=361))
    neg('trials0 forbidden',lambda v:v.update(trials=0))
    neg('trials1001 forbidden',lambda v:v.update(trials=1001))
    neg('duplicate account forbidden',lambda v:v.update(scopeAccountIds=['A','A']))
    neg('empty account scope forbidden',lambda v:v.update(scopeAccountIds=[]))
    neg('goal selection51 forbidden',lambda v:v.update(goalIds=[f'G{i}' for i in range(51)]))
    neg('unknown overdue policy forbidden',lambda v:v.update(overduePolicy='invent_income'))
    check('negative_request_shapes_17',len(negative)==17 and all(x['rejected'] for x in negative),negative)
    bounds={'incomeGrowth':(-50,30),'inflation':(-5,25),'cashReturn':(0,20),'stockReturn':(-50,40),'goldReturn':(-50,40),'stockVolatility':(0,80),'goldVolatility':(0,80),'incomeVolatility':(0,60),'expenseVolatility':(0,60),'reserveMonths':(0,24),'investSurplus':(0,100),'goldWeight':(0,100),'debtAPR':(0,60),'incomeDrop':(0,100),'stockShock':(-90,0),'inflationShock':(0,20)}
    semantic=[]
    for field,value in [('inflation','26'),('cashReturn','-1'),('debtAPR','61'),('goldWeight','101'),('stockShock','-91'),('reserveMonths','25')]:
        # Shape-valid numeric strings still require semantic validation; this calculator is not backend enforcement.
        v=copy.deepcopy(base);v['settings'][field]=value;lo,hi=bounds[field]
        semantic.append({'field':field,'value':value,'shapeValid':valid('startForecastRunInput',v),'semanticRejected':not lo<=Fraction(value)<=hi})
    check('semantic_numeric_string_bound_examples',all(x['shapeValid'] and x['semanticRejected'] for x in semantic),'6 shape-valid bad rates; mandatory backend semantic validators remain NOT_RUN')
    put(E/'schema-shape-results.json',{'scope':'SYNTHETIC SHAPES ONLY; no endpoint/worker or math conformance','positive':positive,'negative':negative,'semanticBoundExamples':semantic})
    newops={p:it['post'] for p,it in a['paths'].items() if it['post']['operationId'] in diff['addedOperations']};names={it['post']['operationId'] for it in a['paths'].values()}
    ownerops=[v for v in newops.values() if v['operationId']!='executeForecastRun'];worker=next(v for v in newops.values() if v['operationId']=='executeForecastRun')
    check('new_owner_and_worker_authority',all(v['security']==[{'OwnerCookie':[]},{'OwnerBearer':[]}] for v in ownerops) and worker['security']==[{'ServiceMTLS':[],'SchedulerSignature':[]}] and worker['x-finweave']['serviceProfile']=='ForecastWorker','Collector/admin denied; ForecastWorker separate from Agent/ingestion')
    check('forecast_acceptance_is_async_202','202' in next(v for v in ownerops if v['operationId']=='startForecastRun')['responses'],'Freeze+enqueue only, not completed forecast')
    perms=rows(D/'operation-permissions.csv');overlay=rows(D/'operation-security-overlay.csv')
    check('all_151_permissions_and_security_overlay',len(perms)==len(overlay)==151 and {x['operation'] for x in perms}==names=={x['operation'] for x in overlay},'Current operation coverage; actual grants NOT_RUN')
    m=read(B/'target-model.json');oldm=read(R/'docs/data/target-t1-security/target-model.json');tables={t['name']:t for t in m['tables']};dbrev=read(B/'revision.json')
    check('db004_counts_and_hash',len(tables)==86 and sum(len(t['columns']) for t in tables.values())==988 and len(m['foreignKeys'])==161 and dbrev['modelSha256']==sha(B/'target-model.json'),dbrev)
    check('all_84_old_tables_and_columns_preserved',all(t['name'] in tables and t['columns']==tables[t['name']]['columns'] for t in oldm['tables']),'Only2new structures, no destructive old field change')
    bad=[]
    for fk in m['foreignKeys']:
        if fk['table'] not in tables or fk['target'] not in tables or not set(fk['columns'])<={c['name'] for c in tables[fk['table']]['columns']} or not set(fk['targetColumns'])<={c['name'] for c in tables[fk['target']]['columns']}:bad.append(fk)
    check('all_161_fk_column_references',not bad,bad)
    check('one_j2_authority_forecast_checkpoint',set(tables)-{t['name'] for t in oldm['tables']}=={'forecast_runs','forecast_result_pages'} and 'checkpoint_payload_id' in {c['name'] for c in tables['forecast_runs']['columns']} and not {'lease_token','generation','lease_until'}&{c['name'] for c in tables['forecast_runs']['columns']},'Compute checkpoint pointer separate from single J2 lease authority')
    classes=rows(D/'table-data-classification.csv')
    check('all_86_tables_classified_and_new_private',len(classes)==86 and {x['table'] for x in classes}==set(tables) and all(x['classification']=='finance_private' and x['opsExposure']=='DENY_DIRECT' for x in classes if x['table'].startswith('forecast_')),'No finance results/settings/digests in Ops')
    check('bundle_api_db_engine_security_pins',bundle['apiSha256']==sha(A/'openapi.json') and bundle['databaseModelSha256']==sha(B/'target-model.json') and bundle['enginePolicySha256']==sha(D/'engine-policy.json') and bundle['securityPolicySha256']==sha(R/'docs/security/t1/security-policy.json') and bundle['securityBindingAddendum']['operationOverlaySha256']==sha(D/'operation-security-overlay.csv') and bundle['securityBindingAddendum']['tableClassificationSha256']==sha(D/'table-data-classification.csv') and bundle['securityBindingAddendum']['permissionMatrixSha256']==sha(D/'operation-permissions.csv') and bundle['securityBindingAddendum']['currentApiSha256']==sha(A/'openapi.json'),'Old security policy remains unchanged, operation/table addenda explicit')
    check('no_actual_or_agent_write_authority',policy['actualArithmetic']=='EXACT_DECIMAL_NO_BINARY64' and not policy['financialWritesByForecast'] and not policy['financialWritesByAgent'],'Pure simulation/draft; owner planning confirmation still not actual')
    req=rows(D/'requirement-traceability.csv');accept=(D/'acceptance-plan.md').read_text(encoding='utf-8')
    check('all_30_requirements_and_runtime_cases',len(req)==30 and {x['requirement'] for x in req}=={f'ENG-{i:02d}' for i in range(1,31)} and set(re.findall(r'\| (DOM-\d\d) /',accept))=={f'DOM-{i:02d}' for i in range(1,31)},'Refinements, not new parent ACs')
    check('runtime_not_upgraded','ALL 30 RUNTIME CASES NOT RUN' in accept and all(x['status']=='SPECIFIED_RUNTIME_NOT_RUN' for x in req) and policy['runtime']=='NOT_RUN','No SQL/Engine/concurrency/MonteCarlo/performance/UAT claim')
    oracle=read(E/'oracle-results.json');vectors=read(D/'golden-vectors.json')
    check('independent_golden_oracle_results',oracle['status']=='ORACLE_ONLY_PASS' and len(oracle['cases'])==len(vectors)==57 and all(x['status']=='PASS' for x in oracle['cases']),'57 hand-expected independent integer/Fraction/calendar vectors; not production conformance')
    before=read(E/'preservation-before.json')['files'];drift=[n for n,h in before.items() if not (R/n).is_file() or sha(R/n)!=h]
    put(E/'preservation.json',{'status':'PASS' if not drift else 'FAIL','checkedFiles':len(before),'drift':drift,'scope':'Captured protected source, previous packages/snapshots/evidence/tools'})
    check('protected_332_hashes',len(before)==332 and not drift,{'checked':len(before),'drift':drift})
    obs=read(E/'source-observations.json')['observations']
    check('source_review_14_hashes',len(obs)==14 and all(sha(R/x['source'])==x['sha256'] and x['runtimeStatus']=='NOT_RUN' and not x['frontendModified'] for x in obs),'Static source observations only, not bug reproduction')
    paths=list(D.glob('*.md'))+list(A.glob('*.md'))+list(B.glob('*.md'))+[R/'docs/architecture/adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md',R/'docs/architecture/ARCH-08-change-report.md'];broken=[];count=0
    for p in paths:
        if not p.exists():broken.append(str(p.relative_to(R)));continue
        for target in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            if target.startswith(('https:','http:','#')):continue
            count+=1
            if not (p.parent/target.split('#')[0]).resolve().exists():broken.append([str(p.relative_to(R)),target])
    check('new_document_local_links',not broken,{'count':count,'broken':broken})
    output={'date':'2026-10-09','status':'STATIC_PASS' if all(x['status']=='PASS' for x in checks) else 'FAIL','checks':checks,'scope':'Artifact definitions/references/pins/structural fixtures/oracle report/hash preservation only','runtime':'Production Engine/SQL/grants/concurrency/forecast model calibration/performance/security/native/provider/Agent/UAT NOT_RUN'}
    put(E/'validation.json',output);print(json.dumps({'status':output['status'],'checks':len(checks),'failed':[x for x in checks if x['status']=='FAIL']},ensure_ascii=True))
    if output['status']=='FAIL':raise SystemExit(1)
if __name__=='__main__':main()
