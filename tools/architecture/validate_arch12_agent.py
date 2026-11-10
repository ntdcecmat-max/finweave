"""Static/schema/design-model checks only. No model/Agent/Engine/SQL/native execution."""
from pathlib import Path
from copy import deepcopy
from collections import Counter
import csv,hashlib,json,re,sys
R=Path(__file__).resolve().parents[2];sys.path.insert(0,str(R/'work/handover-deps'))
from jsonschema import Draft202012Validator,FormatChecker
D=R/'docs/agent';A=R/'docs/contracts/v2-t1-r5';E=R/'docs/execution/evidence/arch-12-agent-2026-10-09'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def ptr(x,path):
    for k in path.strip('/').split('/'):x=x[int(k)] if isinstance(x,list) else x[k]
    return x
def main():
    if not (E/'validation-report.json').exists():put(E/'validation-report.json',{'status':'VALIDATION_PENDING','runtime':'NOT_RUN'})
    checks=[]
    def ck(name,ok,detail=None):checks.append({'name':name,'status':'PASS' if ok else 'FAIL','detail':detail})
    protected=read(E/'preservation-before.json')['files'];drift=[n for n,h in protected.items() if not (R/n).exists() or sha(R/n)!=h]
    ck('Prior source/baselines/packages/tools/evidence exact',not drift,{'protected':len(protected),'drift':drift})
    bundle=read(D/'implementation-bundle.json');p=read(D/'agent-policy.json');registry=read(D/'tool-registry.json');api=read(A/'openapi.json');old=read(R/'docs/contracts/v2-t1-r4/openapi.json');db=read(R/'docs/data/target-t1-async/target-model.json')
    ck('Bundle pins match current files',all(sha(R/x['path'])==x['sha256'] for x in bundle['files'].values()))
    ck('API005 and DB005 exact counts',len(api['paths'])==153 and len(api['components']['schemas'])==634 and len(db['tables'])==87 and sum(len(t['columns']) for t in db['tables'])==1001 and len(db['foreignKeys'])==162)
    ck('Revision body version and exact all route headers',api['info']['version']=='2.0.0' and api['x-finweave-revision']['id']=='FW-API-T1-D1J2-005' and all(any(h.get('name')=='X-FW-Contract-Revision' and h['schema']=={'const':'FW-API-T1-D1J2-005'} for h in x['post'].get('parameters',[])) for x in api['paths'].values()))
    ck('Routes/auth/security/actors unchanged',set(api['paths'])==set(old['paths']) and api['components']['securitySchemes']==old['components']['securitySchemes'] and all(api['paths'][k]['post']['security']==old['paths'][k]['post']['security'] for k in api['paths']))
    schemas=api['components']['schemas'];oldschemas=old['components']['schemas']
    ck('All input schemas unchanged',all(v==oldschemas[n] for n,v in schemas.items() if n.endswith('Input')))
    diff=read(A/'revision-diff.json');modes=['scripted_mock','deterministic','local_model','hosted_model']
    ck('Exactly five mode and five Agent counter projections',len(diff['modePaths'])==5 and len(diff['toolCounterPaths'])==5 and all(ptr(api,n).get('enum')==modes and 'const' not in ptr(api,n) for n in diff['modePaths']) and all(ptr(api,n)['minimum']==0 and ptr(api,n)['maximum']==8 for n in diff['toolCounterPaths']))
    restored=deepcopy(api)
    for n in diff['modePaths']:
        target=ptr(restored,n);target.clear();target.update(ptr(old,n))
    for n in diff['toolCounterPaths']:
        target=ptr(restored,n);target.clear();target.update(ptr(old,n))
    ck('No other component schema change',restored['components']==old['components'] and len(diff['changedSchemas'])==10)
    ck('Revision checksum/projections file exact',read(A/'revision.json')['openapiSha256']==sha(A/'openapi.json') and read(A/'schemas.json')['components']==api['components'])
    for s in schemas.values():Draft202012Validator.check_schema(s)
    ck('All634 canonical schemas valid metaschema',True)
    decisions=read(D/'decision-schemas.json');bridge=read(D/'native-bridge-003.json');priorbridge=read(R/'docs/android/native-bridge-schemas.json')
    Draft202012Validator.check_schema(decisions);Draft202012Validator.check_schema(bridge)
    ck('Decision and bridge metaschemas',True)
    def replace_strings(x,changes):
        if isinstance(x,dict):return {k:replace_strings(v,changes) for k,v in x.items()}
        if isinstance(x,list):return [replace_strings(v,changes) for v in x]
        return changes.get(x,x) if isinstance(x,str) else x
    expected_bridge=replace_strings(priorbridge,{'FW-API-T1-D1J2-004':'FW-API-T1-D1J2-005','FW-NATIVE-BRIDGE-002':'FW-NATIVE-BRIDGE-003'});expected_bridge['$id']=bridge['$id']
    ck('Bridge003 only handshake identifiers changed',bridge==expected_bridge and '003' in bridge['$id'])
    names={x['name'] for x in registry['capabilities']}
    ck('13 capabilities exact decision variants',len(names)==13 and names=={x['properties']['capability']['const'] for x in decisions['$defs']['Decision']['oneOf']} and all(x['actualAuthority'] is False and x['requiresLiveAuthorization'] for x in registry['capabilities']))
    ck('No forbidden capability and intent boundaries',not names.intersection(p['forbidden']) and all(x['intents']==['goal','plan'] for x in registry['capabilities'] if x['kind'] in ('draft','pure')))
    operations={x['post']['operationId'] for x in api['paths'].values()};tables={t['name'] for t in db['tables']};mapping=read(D/'contract-storage-map.json')
    ck('Registry APIs and storage maps actually exist',all(set(x['apiOperations'])<=operations for x in registry['capabilities']) and all(x['operationId'] in operations and set(x['tables'])<=tables for x in mapping['operations']))
    ck('Owner confirm not Agent port',all(x['operationId']!='confirmPlanningDraft' or not x['agentCapabilityMayInvoke'] for x in mapping['operations']) and 'confirmPlanningDraft' not in {op for x in registry['capabilities'] for op in x['apiOperations']})
    ck('DB unchanged private registry named Assistant bounded',not mapping['postgresChanges'] and all(x['table']=='payload_objects' and x['owner']=='Assistant' and x['maxBytes']==262144 and not x['genericCrud'] for x in mapping['privateKinds']))
    ck('Global quota aggregate no private finance scope',mapping['globalAdmission']['table']=='ops_quotas' and not mapping['globalAdmission']['workspaceIdsInGlobalRows'] and mapping['globalAdmission']['runtime']=='NOT_RUN')
    ck('Run budget cumulative and controls charged',p['budget']=={'acceptedActions':8,'activeMillis':60000,'clarifications':2,'modelRounds':12,'repairPerResponse':1,'resetOnResume':False,'askAndFinishCountAsActions':True})
    ck('Cross-day reservation cannot bypass daily quota',p['admission']['unit']=='ROOT_ID_AND_UTC_DAY' and p['admission']['dailyReservationRecheckedOnResume'] and not p['admission']['continuationNewAdmission'])
    ck('Model disabled unpinned and no paid fallback',not p['modelEnabled'] and p['externalBudgetVnd']==0 and not p['hostedFallback'] and p['modelCandidate']['weightsDigest'] is None and read(D/'model-manifest-template.json')['status']=='UNPINNED_MODEL_DISABLED')
    ck('Privacy and numeric authority explicit',all(v is False for v in p['privacy'].values()) and p['authority']=={'financialCalculations':'ENGINE_ONLY','actualWrites':False,'activePlanGoalWrites':False,'draftWrites':True,'ownerConfirmSeparate':True})
    settings={k:(None if k in ['income','expense','debt'] else '0' if k=='debtPayment' else False if v.get('type')=='boolean' else max(0,v.get('minimum',0))) for k,v in schemas['startAgentRunInput']['properties']['settings']['properties'].items()}
    settings.update(months=12,stressStart=1,stressMonths=1,income='5000000',expense='0')
    body={'goals':[{'existingId':None,'name':'Synthetic goal','target':'60000000','due':'2027-10-01','account':'accountA','contribution':'5000000','start':'2026-10-01','day':1,'skipMonths':[],'profile':'cash','ref':'goalA'}],'items':[],'links':[],'scope':['accountA'],'reserve':'1000000','income':'5000000','expense':'0','priority':'goal_first','notes':'Synthetic fixture, not real finance','settings':settings}
    args={x['name']:{} for x in registry['capabilities']}
    args.update(getTransactions={'cursor':None,'kind':'all'},getCoverage={'cursor':None},getEvidence={'evidenceRefs':['evA']},simulatePlan={'draftRef':'draftA','expectedVersion':1},compareScenarios={'candidates':[body]},proposePlanningDraft={'body':body},amendPlanningDraft={'draftRef':'draftA','expectedVersion':1,'body':body},proposeReviewActions={'evidenceRefs':['evA'],'reasonCodes':['COVERAGE_GAP']},askClarification={'missingFields':['reserve']},finishRun={'conclusion':'DRAFT_READY','evidenceRefs':['evA'],'assumptionRefs':[],'proposalRefs':['draftA']})
    fixtures=[]
    def add(id,schema,v,expected=True):fixtures.append({'id':id,'schema':schema,'value':deepcopy(v),'expectedValid':expected})
    for cap,arg in args.items():add('decision_'+cap,'Decision',{'capability':cap,'arguments':arg})
    bad=[('forbidden_tool',{'capability':'confirmPlanningDraft','arguments':{}}),('two_decisions',[{'capability':'finishRun','arguments':args['finishRun']}]*2),('owner_injected',{'capability':'getFinancialSnapshot','arguments':{'ownerId':'other'}}),('raw_injected',{'capability':'getEvidence','arguments':{'evidenceRefs':[],'rawText':'forbidden'}}),('finish_model_money',{'capability':'finishRun','arguments':{**args['finishRun'],'money':'999'}}),('negative_version',{'capability':'simulatePlan','arguments':{'draftRef':'draftA','expectedVersion':-1}}),('too_many_candidates',{'capability':'compareScenarios','arguments':{'candidates':[body]*4}}),('invalid_question',{'capability':'askClarification','arguments':{'missingFields':['password']}}),('duplicate_question_slots',{'capability':'askClarification','arguments':{'missingFields':['reserve','reserve']}})]
    for id,v in bad:add(id,'Decision',v,False)
    for id,mutate in [('fractional_money',lambda x:x.update(reserve='1.5')),('invalid_date',lambda x:x['goals'][0].update(due='2026-02-29')),('empty_scope',lambda x:x.update(scope=[]))]:
        b=deepcopy(body);mutate(b);add(id,'Decision',{'capability':'proposePlanningDraft','arguments':{'body':b}},False)
    cap={'bridgeRevision':'FW-NATIVE-BRIDGE-003','apiRevision':'FW-API-T1-D1J2-005','profile':'SYNTHETIC','buildId':'design-only','requiredConsentVersion':'fixture1','nativeAvailable':True}
    add('native003_exact005','BridgeCapabilities',cap)
    add('native_old_handshake','BridgeCapabilities',{**cap,'apiRevision':'FW-API-T1-D1J2-004'},False)
    ts='2026-10-09T08:00:00Z';context={'navigation':'ai','route':'/home/ai','query':{'period':{'start':'2026-10-01','endExclusive':'2026-11-01','timezone':'Asia/Ho_Chi_Minh'},'accountIds':[],'snapshotVersion':1},'transactionFilter':None,'selected':None,'workspaceVersion':1,'snapshotRefs':{'workspaceVersion':1,'sourceVersions':{},'holdingVersions':{},'quoteIds':[],'eventVersions':{},'planVersions':{},'goalVersions':{}},'capturedAt':ts}
    result={'id':'resultA','messageId':'messageA','mode':'scripted_mock','context':context,'tool':'goals','text':'Kết quả từ snapshot đã chọn.','metrics':[],'evidenceIds':[],'targets':[],'stale':False,'createdAt':ts}
    for i,path in enumerate(diff['modePaths']):
        root=path.rsplit('/properties/mode',1)[0]
        for mode in modes:add('mode_'+str(i)+'_'+mode,'ApiFragment:'+root,{**result,'mode':mode})
        add('invalid_mode_'+str(i),'ApiFragment:'+root,{**result,'mode':'real_but_mock'},False)
    for i,path in enumerate(diff['toolCounterPaths']):
        for v,ok in [(0,True),(8,True),(-1,False),(9,False),(0.5,False)]:add('counter_'+str(i)+'_'+str(v),'ApiFragment:'+path,v,ok)
    results=[]
    for f in fixtures:
        if f['schema']=='Decision':sch={'$defs':decisions['$defs'],'$ref':'#/$defs/Decision'}
        elif f['schema']=='BridgeCapabilities':sch={'$defs':bridge['$defs'],'$ref':'#/$defs/Capabilities'}
        else:sch={'components':api['components'],**ptr(api,f['schema'].split(':',1)[1])}
        errors=list(Draft202012Validator(sch,format_checker=FormatChecker()).iter_errors(f['value']));valid=not errors
        results.append({'case':f['id'],'expectedValid':f['expectedValid'],'actualValid':valid,'status':'PASS' if valid==f['expectedValid'] else 'FAIL'})
    put(D/'schema-fixtures.json',{'scope':'Synthetic Decision/API fragments/bridge shape examples, not endpoint/Agent/model/financial correctness tests','cases':fixtures})
    put(E/'schema-validation.json',{'scope':'SCHEMA_ONLY','runtime':'NOT_RUN','positive':sum(f['expectedValid'] for f in fixtures),'negative':sum(not f['expectedValid'] for f in fixtures),'results':results})
    ck('Decision/API005/native003 positive and negative fixtures',all(x['status']=='PASS' for x in results),{'cases':len(results),'failed':[x['case'] for x in results if x['status']=='FAIL']})
    vectors=[]
    def vec(id,kind,x,expect):vectors.append({'id':id,'kind':kind,'input':x,'expected':expect})
    base={'actions':7,'active':59000,'clarifications':1,'modelRounds':11,'currentGeneration':True,'authorized':True,'rights':True,'constraintPreserved':True}
    vec('eligible_last_action','eligible',base,True)
    for k,v in [('actions',8),('active',60000),('clarifications',3),('modelRounds',12),('currentGeneration',False),('authorized',False),('rights',False),('constraintPreserved',False)]:vec('denied_'+k,'eligible',{**base,k:v},False)
    vec('resume_budget_not_reset','remaining',{'used':7,'resume':True},1)
    vec('exhausted_not_restart','remaining',{'used':8,'resume':True},0)
    for committed,same,expected in [(True,True,'RETURN_COMMITTED'),(True,False,'CONFLICT'),(False,True,'EXECUTE_WITH_SAME_ACTION')]:vec('replay_'+str(len(vectors)),'replay',{'committed':committed,'sameDigest':same},expected)
    for savedDay,currentDay,charged,expected in [('2026-10-09','2026-10-09',True,'NO_SECOND_CHARGE'),('2026-10-08','2026-10-09',True,'RESERVE_CURRENT_DAY'),('2026-10-09','2026-10-09',False,'RESERVE_CURRENT_DAY')]:vec('admission_'+str(len(vectors)),'admission',{'savedDay':savedDay,'currentDay':currentDay,'charged':charged},expected)
    for kind in ['draft','pure','read','control','proposal']:vec('investigation_'+kind,'intent',{'kind':kind,'intent':'investigation'},kind not in ('draft','pure'))
    vec('model_confirm_denied','capability',{'name':'confirmPlanningDraft'},False)
    vec('draft_port_allowed','capability',{'name':'proposePlanningDraft'},True)
    vec('grounded_fact','ground',{'evidenceExists':True,'sameSnapshot':True,'authorized':True,'modelProse':False},'RENDER_ENGINE_FACT')
    for k in ['evidenceExists','sameSnapshot','authorized']:vec('ungrounded_'+k,'ground',{'evidenceExists':True,'sameSnapshot':True,'authorized':True,'modelProse':False,k:False},'UNAVAILABLE')
    vec('numeric_prose_ignored','ground',{'evidenceExists':True,'sameSnapshot':True,'authorized':True,'modelProse':True},'REJECT_FREE_FACTUAL_PROSE')
    vec('unknown_inference_charged','reservation',{'reserved':25000,'observed':None},25000)
    vec('observed_inference_settled','reservation',{'reserved':25000,'observed':7000},7000)
    vec('cancel_late_no_publish','publish',{'cancelled':True,'liveEpoch':True},False)
    vec('recovery_no_publish','publish',{'cancelled':False,'liveEpoch':False},False)
    vec('live_publish_model','publish',{'cancelled':False,'liveEpoch':True},True)
    def model(v):
        x=v['input'];k=v['kind']
        if k=='eligible':return x['actions']<8 and x['active']<60000 and x['clarifications']<=2 and x['modelRounds']<12 and all(x[t] for t in ['currentGeneration','authorized','rights','constraintPreserved'])
        if k=='remaining':return max(0,8-x['used'])
        if k=='replay':return 'CONFLICT' if not x['sameDigest'] else ('RETURN_COMMITTED' if x['committed'] else 'EXECUTE_WITH_SAME_ACTION')
        if k=='admission':return 'NO_SECOND_CHARGE' if x['savedDay']==x['currentDay'] and x['charged'] else 'RESERVE_CURRENT_DAY'
        if k=='intent':return x['kind'] not in ('draft','pure') if x['intent']=='investigation' else True
        if k=='capability':return x['name'] in names and x['name'] not in p['forbidden']
        if k=='ground':return 'REJECT_FREE_FACTUAL_PROSE' if x['modelProse'] else ('RENDER_ENGINE_FACT' if x['evidenceExists'] and x['sameSnapshot'] and x['authorized'] else 'UNAVAILABLE')
        if k=='reservation':return x['reserved'] if x['observed'] is None else x['observed']
        if k=='publish':return not x['cancelled'] and x['liveEpoch']
        raise ValueError(k)
    mr=[{'case':v['id'],'expected':v['expected'],'actual':model(v),'status':'PASS' if model(v)==v['expected'] else 'FAIL'} for v in vectors]
    put(D/'model-vectors.json',{'scope':'Design predicate examples only, not Agent/Engine/SQL/model performance','vectors':vectors})
    put(E/'model-validation.json',{'runtime':'NOT_RUN','scope':'MODEL_ONLY','results':mr})
    ck('Budget/replay/admission/scope/grounding model examples',all(x['status']=='PASS' for x in mr),{'examples':len(mr)})
    trace=read(D/'requirement-traceability.json')['requirements'];req={x for row in trace for x in row['requirements']}
    wanted={f'AI-FR-{i:03}' for i in range(1,25)}|{f'AI-NFR-{i:03}' for i in range(1,9)}
    ck('32 ART cases cover all24FR/8NFR no new product inventory',len(trace)==32 and len({x['id'] for x in trace})==32 and req==wanted and all(x['runtime']=='NOT_RUN' and (D/x['spec']).exists() for x in trace))
    parent=list(csv.DictReader((R/'docs/product/backend-requirement-coverage.csv').open(encoding='utf-8')))
    ck('All41 parent AC required retained',len(parent)==41 and all(x['required']=='YES' for x in parent))
    spec=(R/'docs/product/ai-agent-specification.md').read_text(encoding='utf-8')
    ck('One canonical product spec v1.1 with stable codes', 'AI-SPEC-001 · v1.1' in spec and all(x in spec for x in wanted) and 'queued→planning/reading' not in spec)
    ev=read(D/'evaluation-cases.json')['cases'];rg=read(D/'regression-cases.json')['cases']
    ck('30 public challenges+12regression honestly NOT RUN',len(ev)==30 and Counter(x['group'] for x in ev)=={'plan':10,'adjust':10,'safety':10} and all(x['split']=='PUBLIC_CHALLENGE_NOT_BLIND' and x['runtime']=='NOT_RUN' for x in ev) and len(rg)==12 and all(x['runtime']=='NOT_RUN' for x in rg))
    sources=read(D/'research-sources.json');ck('Dated official research, no model execution claimed',sources['asOf']=='2026-10-09' and len(sources['sources'])==7 and all(x['url'].startswith(('https://docs.ollama.com/','https://huggingface.co/Qwen/','https://developers.openai.com/')) for x in sources['sources']))
    current=read(E/'current-documents.json')['files'];ck('27 current docs show current Agent/API005 notice',len(current)==27 and all('> **ARCH-12 hiện hành' in (R/n).read_text(encoding='utf-8') for n in current))
    paths=list(D.glob('*.md'))+list(A.glob('*.md'))+[R/'docs/architecture/ARCH-12-change-report.md',R/'docs/architecture/adr/ADR-019-bounded-agent-runtime-and-grounded-planning.md'];broken=[]
    for path in paths+[R/n for n in current]:
        s=path.read_text(encoding='utf-8')
        if path not in paths:
            chosen=[];active=False
            for line in s.splitlines():
                if line.startswith('#'):active='ARCH-12' in line
                if active or 'ARCH-12' in line:chosen.append(line)
            s='\n'.join(chosen)
        for dest in re.findall(r'\]\(([^)]+)\)',s):
            dest=dest.split('#')[0].strip('<>')
            if dest and '://' not in dest and not dest.startswith('mailto:') and not (path.parent/dest).resolve().exists():broken.append({'file':path.relative_to(R).as_posix(),'link':dest})
    ck('New/current ARCH12 links resolve',not broken,broken)
    ok=all(c['status']=='PASS' for c in checks)
    report={'id':'FW-ARCH12-AGENT-VALIDATION-001','date':'2026-10-09','status':'PASS_DESIGN_STATIC_MODEL_ONLY' if ok else 'FAIL','runtime':'NOT_RUN','modelEvaluation':'NOT_RUN','checksPassed':sum(c['status']=='PASS' for c in checks),'checksTotal':len(checks),'protectedFiles':len(protected),'currentDocs':len(current),'schemaCases':len(fixtures),'modelExamples':len(vectors),'checks':checks}
    put(E/'validation-report.json',report);print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
    if not ok:print(json.dumps([c for c in checks if c['status']=='FAIL'],ensure_ascii=False));sys.exit(1)
if __name__=='__main__':main()
