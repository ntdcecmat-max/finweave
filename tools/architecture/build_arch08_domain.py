"""ARCH-08: build design artifacts only; no runtime, SQL, frontend or previous-package writes."""
from pathlib import Path
import copy,csv,hashlib,json
R=Path(__file__).resolve().parents[2]
D=R/'docs/domain'; A=R/'docs/contracts/v2-t1-r3'; B=R/'docs/data/target-t1-domain'
REV='FW-API-T1-D1J2-003'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def csvout(p,rows):
    with p.open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def obj(p,optional=()):return {'type':'object','properties':p,'required':[k for k in p if k not in optional],'additionalProperties':False}
def arr(v,n=50):return {'type':'array','items':v,'maxItems':n}
def ref(n):return {'$ref':'#/components/schemas/'+n}
def null(v):return {'anyOf':[v,{'type':'null'}]}
def integer(lo=0,hi=9007199254740991):return {'type':'integer','minimum':lo,'maximum':hi}
def enum(*v):return {'enum':list(v)}
ID={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'}
TXT={'type':'string','minLength':1,'maxLength':240}
MONEY={'type':'string','pattern':'^(0|[1-9][0-9]{0,17})$'}
SIGNED={'type':'string','pattern':'^(0|[1-9][0-9]{0,17}|-[1-9][0-9]{0,17})$'}
RATE={'type':'string','pattern':'^(0|[1-9][0-9]{0,2}|-[1-9][0-9]{0,2}|-0)(\\.[0-9]{1,6})?$'}
def main():
    for p in [D,A,B]:p.mkdir(parents=True,exist_ok=True)
    previous=R/'docs/contracts/v2-t1-r2/openapi.json';old=json.loads(previous.read_text(encoding='utf-8'));api=copy.deepcopy(old)
    # Exact revision headers/metadata change; all 600 inherited schema definitions remain byte-equivalent as JSON values.
    def revision(x):
        if isinstance(x,dict):return {k:revision(v) for k,v in x.items()}
        if isinstance(x,list):return [revision(v) for v in x]
        return REV if x=='FW-API-T1-D1J2-002' else x
    api=revision(api);api['info'].update(title='FinWeave API v2 — domain revision 003 (unreleased)',description='ARCH-08 adds frozen asynchronous financial forecasts. Prior packages immutable; runtime NOT RUN. Same 2.0.0 label does not mean compatibility.')
    s=api['components']['schemas'];new={}
    date=copy.deepcopy(s['getPlanForecastInput']['properties']['horizon'])
    stamp={'type':'string','format':'date-time'}
    digest={'type':'string','pattern':'^[a-f0-9]{64}$'}
    rates=['incomeGrowth','inflation','cashReturn','stockReturn','goldReturn','stockVolatility','goldVolatility','incomeVolatility','expenseVolatility','reserveMonths','investSurplus','goldWeight','debtAPR','incomeDrop','stockShock','inflationShock']
    settings={n:copy.deepcopy(RATE) for n in rates}
    settings.update(months=integer(1,360),income=null(MONEY),expense=null(MONEY),debt=null(MONEY),debtPayment=MONEY,stress={'type':'boolean'},stressStart=integer(1,360),stressMonths=integer(1,120),realMoney={'type':'boolean'},poolCash={'type':'boolean'})
    new['ForecastSettings']=obj(settings)
    new['ForecastValue']=null(SIGNED)
    new['ForecastBands']=obj({n:ref('ForecastValue') for n in ['p10','p25','p50','p75','p90']})
    new['ForecastGoalValue']=obj({'goalId':ID,'bands':ref('ForecastBands')})
    new['ForecastPoint']=obj({'date':date,'assets':ref('ForecastBands'),'cash':ref('ForecastBands'),'netWorth':ref('ForecastBands'),'goals':arr(ref('ForecastGoalValue')),'inflationIndex':{'type':'string','pattern':'^[0-9]{1,18}(\\.[0-9]{1,12})?$'}})
    new['ForecastFlow']=obj({'date':date,**{n:ref('ForecastValue') for n in ['cash','stock','gold','assets','debt','income','expense','invested','unfundedInvestment','goalContributions','debtPaid','growth']},'inflationIndex':{'type':'string','pattern':'^[0-9]{1,18}(\\.[0-9]{1,12})?$'}})
    new['ForecastGoalOutcome']=obj({'goalId':ID,'criterion':enum('savings','assets','independence'),'due':date,'probabilityPercent':null({'type':'number','minimum':0,'maximum':100}),'trials':integer(1,1000),'successes':null(integer(0,1000)),**{n:ref('ForecastValue') for n in ['target','initial','funded','requested','feasible','gap','requiredMonthly','monthlyCapacity']},'firstReach':null(date),'outOfRange':{'type':'boolean'},'streak':integer(),'contributions':integer(),'missingReasons':arr(TXT,20)})
    baseline=obj({'asOf':stamp,'monthStarts':arr(date,6),'complete':{'type':'boolean'},'hasEvents':{'type':'boolean'},'income':ref('ForecastValue'),'expense':ref('ForecastValue'),'initialCash':ref('ForecastValue'),'initialAssets':ref('ForecastValue'),'history':arr(obj({'monthStart':date,'endExclusive':date,**{n:ref('ForecastValue') for n in ['income','expense','refund','net']}}),6),'missingReasons':arr(TXT,20)})
    new['ForecastSummary']=obj({'baseline':baseline,'engineVersion':{'const':'FW-ENGINE-DOMAIN-001'},'forecastModelVersion':{'const':'FW-FORECAST-MODEL-001'},'seed':ID,'trials':integer(1,1000),'settings':ref('ForecastSettings'),'overduePolicy':enum('retain_overdue','defer_next_day'),'moneyBasis':{'const':'nominal'},'inputDigest':digest,'baseSnapshotId':ID,'baseFinancialVersion':integer(),'scopeAccountIds':arr(ID,100),'outputGoalIds':arr(ID,50),'horizon':date,'solvencyPercent':null({'type':'number','minimum':0,'maximum':100}),'missingReasons':arr(TXT,50),'assumptions':arr(TXT,50),'classification':{'const':'simulated'},'allPathsComplete':{'type':'boolean'}})
    new['ForecastResultPage']=obj({'pageIndex':integer(),'pageCount':integer(1,100),'summary':ref('ForecastSummary'),'points':arr(ref('ForecastPoint'),12),'central':arr(ref('ForecastFlow'),12),'withoutPlans':arr(ref('ForecastFlow'),12),'counterfactual':arr(ref('ForecastPoint'),12),'goalOutcomes':arr(ref('ForecastGoalOutcome'),50)})
    new['ForecastRun']=obj({'id':ID,'version':integer(1),'state':enum('queued','running','succeeded','failed','cancelled','expired'),'cancelRequested':{'type':'boolean'},'baseSnapshotId':ID,'baseFinancialVersion':integer(),'createdAt':stamp,'completedAt':null(stamp),'resultExpiresAt':null(stamp),'safeErrorCode':null(enum('WORK_BUDGET_EXCEEDED','RESULT_TOO_LARGE','INPUT_INVALID','CANCELLED','INTERNAL_ERROR','SNAPSHOT_UNAVAILABLE','RESULT_EXPIRED'))})
    definitions={
      'startForecastRun':('startAgentRun',obj({'baseSnapshotId':null(ID),'settings':ref('ForecastSettings'),'scopeAccountIds':{**arr(ID,100),'minItems':1,'uniqueItems':True},'goalIds':{**arr(ID,50),'uniqueItems':True},'seed':ID,'trials':integer(1,1000),'overduePolicy':enum('retain_overdue','defer_next_day')}),ref('ForecastRun')),
      'getForecastRun':('getAgentRun',obj({'id':ID,'cursor':null({'type':'string','minLength':1,'maxLength':2048})}),obj({'run':ref('ForecastRun'),'page':null(ref('ForecastResultPage')),'nextCursor':null({'type':'string','minLength':1,'maxLength':2048})})),
      'cancelForecastRun':('cancelAgentRun',obj({'id':ID,'expectedVersion':integer(1)}),ref('ForecastRun')),
      'executeForecastRun':('executeAgentStep',obj({'runId':ID,**{n:copy.deepcopy(s['executeAgentStepInput']['properties'][n]) for n in ['leaseToken','dispatchJobId','generation','recoveryEpoch']}}),obj({'runId':ID,'state':enum('running','succeeded','failed','cancelled'),'completed':{'type':'boolean'}})),
    }
    for name,(template,inp,out) in definitions.items():
        new[name+'Input']=inp;new[name+'Output']=out
        for suffix in ['Request','Reply']:
            v=copy.deepcopy(s[template+suffix])
            if suffix=='Request':v['properties']['operationId']={'const':name}
            v['properties']['input' if suffix=='Request' else 'data']=ref(name+('Input' if suffix=='Request' else 'Output'))
            new[name+suffix]=v
        source=next(item['post'] for item in api['paths'].values() if item['post']['operationId']==template)
        op=copy.deepcopy(source);op['operationId']=name;op['summary']=name+' — frozen forecast, no actual/active-planning effect';op['tags']=['planning']
        op['requestBody']['content']['application/json']['schema']=ref(name+'Request')
        for status,response in op['responses'].items():
            if status.startswith('2'):response['content']['application/json']['schema']=ref(name+'Reply')
        if name=='startForecastRun':
            success=next(v for k,v in op['responses'].items() if k.startswith('2'));op['responses']={k:v for k,v in op['responses'].items() if not k.startswith('2')};op['responses']['202']=success
        meta=op['x-finweave'];meta.update(origin='ARCH08:conditional-forecast',domainOwner='Planning',objectSelectors=['baseSnapshotId','scopeAccountIds','goalIds'] if name=='startForecastRun' else ['runId' if name=='executeForecastRun' else 'id'],previewRequired=False,persistenceTables=['forecast_runs','forecast_result_pages','snapshots','payload_objects','jobs','job_attempts','workspaces'],contractRevision=REV,forecastAuthority='Pure simulation only; no actual, active Plan/Goal, owner confirmation, market or LLM calls',concurrency='Frozen authorized snapshot+complete dependency closure; J2 lease/fence; repeatable result pages',polling='getForecastRun foreground only, bounded polling; ARCH09 specifies timing',permission='Owner workspace/object scope; internal ForecastWorker profile is compute-only, no Agent or ingestion authority' if name=='executeForecastRun' else 'Current owner/workspace/object authorization; no collector or app-admin')
        meta['identityPolicy']['csrfIfCookieMutation']=name in ['startForecastRun','cancelForecastRun']
        if name=='executeForecastRun':
            # Keep mTLS AND signature schemes, but do not inherit AgentStep authority.
            op['security']=[{'ServiceMTLS':[],'SchedulerSignature':[]}];meta['serviceProfile']='ForecastWorker';meta['authorization']='Exact ForecastWorker capability AND mTLS AND per-profile HMAC; scoped live J2 ticket, no owner session'
        prefix='/internal/v2/' if name=='executeForecastRun' else '/v2/operations/'
        api['paths'][prefix+name]={'post':op}
    s.update(new)
    put(A/'openapi.json',api);put(A/'schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','components':{'schemas':s}})
    put(A/'revision.json',{'revision':REV,'contractVersion':'2.0.0','status':'ACCEPTED_DESIGN_NOT_IMPLEMENTED','openapiSha256':sha(A/'openapi.json'),'previousOpenapiSha256':sha(previous),'operations':len(api['paths']),'schemas':len(s),'inheritedSchemasUnchanged':len(old['components']['schemas']),'newOperations':list(definitions),'previous':'../v2-t1-r2/revision.json'})
    put(A/'revision-diff.json',{'previous':'FW-API-T1-D1J2-002','current':REV,'addedOperations':list(definitions),'addedSchemas':list(new),'changedInheritedSchemas':[],'headerMetadataChangesOnlyForInheritedOperations':True,'consumerMigration':'NOT_IMPLEMENTED; current frontend forecasts are local, no matching network callsite'})
    # Storage revision is additive and cannot overwrite the ARCH07 package.
    prevdb=R/'docs/data/target-t1-security/target-model.json';model=json.loads(prevdb.read_text(encoding='utf-8'));model.update(id='FW-PHYS-T1-DOMAIN-004',previousSha256=sha(prevdb),status='EXPAND_DESIGN_SQL_NOT_RUN',warning='Inherited declarations are historical; ARCH08 adds domain rules and forecast storage as design, not executable DDL.')
    def table(name,cols,rules):
        t={'name':name,'owner':'Planning','tenant':True,'stage':'ARCH08_NEW_DESIGN','columns':[{'name':n,'type':typ,'nullable':nullable,'meaning':meaning} for n,typ,nullable,meaning in cols],'rules':['PRIMARY KEY(workspace_id,id)']+rules,'retention':'Unpinned run/result 30 days; pinned domain/Agent history until explicit release or authorized erasure'};model['tables'].append(t)
    common=[('workspace_id','text',False,'Owner workspace'),('id','text',False,'Opaque id'),('created_at','timestamptz',False,'Server UTC creation')]
    table('forecast_runs',common+[
      ('version','bigint',False,'Run control version, not financial version'),('state','text',False,'queued running succeeded failed cancelled expired'),('base_snapshot_id','text',False,'Immutable authorized dependency closure'),('base_financial_version','bigint',False,'Financial snapshot version'),('inputs_payload_id','text',False,'Strict frozen settings/scope/goal selection/seed, private payload'),('checkpoint_payload_id','text',True,'Private versioned compute cursor/aggregate/RNG state; fenced update, never a second lease authority'),('input_digest','text',False,'Private semantic digest, never Ops logs'),('engine_version','text',False,'Exact engine release'),('model_version','text',False,'Exact forecast formula/RNG/grid version'),('seed','text',False,'Reproducibility seed, not security credential'),('trials','integer',False,'1..1000; completed paths only'),('cancel_requested','boolean',False,'Checked between bounded compute chunks'),('completed_at','timestamptz',True,'Terminal completion'),('result_expires_at','timestamptz',True,'Content expiry, not permission expiry'),('safe_error_code','text',True,'Enum only; no financial exception text'),('updated_at','timestamptz',False,'Control change')],['Inputs immutable after enqueue; no partial run probability published','UNIQUE(workspace_id,id,base_snapshot_id)','J2 jobs owns dispatch/lease/generation, not this table','Result expiry preserves run/input digest tombstone; pinned history cannot be silently purged'])
    table('forecast_result_pages',common+[
      ('run_id','text',False,'Frozen run'),('page_index','integer',False,'Zero-based deterministic page'),('payload_id','text',False,'Strict bounded result page in payload_objects'),('content_digest','text',False,'Private canonical page digest'),('schema_ref','text',False,'ForecastResultPage schema + model version'),('published_at','timestamptz',True,'Visible only after full run atomically succeeded')],['UNIQUE(workspace_id,run_id,page_index)','Immutable pages; staged pages cannot be served until run succeeded','Page bytes<=262144; max12 chronological rows, max50 selected output goals; no silent truncation'])
    fks=[('forecast_runs',['workspace_id'],'workspaces',['id']),('forecast_runs',['workspace_id','base_snapshot_id'],'snapshots',['workspace_id','id']),('forecast_runs',['workspace_id','inputs_payload_id'],'payload_objects',['workspace_id','id']),('forecast_result_pages',['workspace_id','run_id'],'forecast_runs',['workspace_id','id']),('forecast_result_pages',['workspace_id','payload_id'],'payload_objects',['workspace_id','id'])]
    for t,c,target,tc in fks:model['foreignKeys'].append({'table':t,'columns':c,'target':target,'targetColumns':tc,'optional':False,'origin':'arch08-design'})
    model['foreignKeys'].append({'table':'forecast_runs','columns':['workspace_id','checkpoint_payload_id'],'target':'payload_objects','targetColumns':['workspace_id','id'],'optional':True,'origin':'arch08-design'})
    targetrules={
      'accounts':['Opening is posted once through opening event/equity group; declaration column is not added again','Missing opening or unresolved coverage cannot become known zero; current createAccount requires an explicit owner declaration, otherwise source remains unbound/needs_setup'],
      'ledger_accounts':['Internal account_id NULL accounts use unique purpose kind within workspace; no retarget after posted use'],
      'entry_groups':['Deferred commit guard rejects building groups, empty groups and nonzero sum; sealed groups reject balanced append as well as update/delete','Reversal mirrors every original ledger account/currency/amount exactly once; lineage and replacement written atomically'],
      'holding_movements':['Order by business_date then immutable sequence_no for equal-date facts; historical rebuild applies set versus delta, never sums quantity after-values','Retroactive correction revalidates every later quantity state; cannot create negative quantities or mutate a frozen old snapshot'],
      'actual_links':['No event family linked to two active occurrences in the same planning scope, including different revisions; old revision history remains immutable','Current projection resolves signed reversal/refund/replacement lineage without duplicating cash or actual matching'],
      'jobs':['Register typed forecast_run domain kind + forecast job_type; ForecastWorker compute-only capability; same J2 authority'],
      'snapshots':['Freeze effective business cutoff AND recorded knowledge version, scope, quote/FX/profile/quantity refs, settings/model/rules versions','A run freezes all competing goals/allocations and account funding dependencies, not only selected output goalIds'],
    }
    for t in model['tables']:
        if t['name'] in targetrules:t.setdefault('targetRules',[]).extend(targetrules[t['name']])
    put(B/'target-model.json',model);put(B/'revision.json',{'id':model['id'],'status':model['status'],'tables':len(model['tables']),'columns':sum(len(t['columns']) for t in model['tables']),'foreignKeys':len(model['foreignKeys']),'newTables':2,'addedExistingColumns':0,'modelSha256':sha(B/'target-model.json'),'previousModelSha256':sha(prevdb)})
    put(B/'domain-delta.json',{'newTables':['forecast_runs','forecast_result_pages'],'existingRulesAddenda':targetrules,'sql':'NOT_AUTHORED_NOT_RUN','jobAuthority':'J2_UNCHANGED'})
    policies={'id':'FW-ENGINE-DOMAIN-001','forecastModel':'FW-FORECAST-MODEL-001','status':'ACCEPTED_DESIGN_RUNTIME_NOT_RUN','actualCurrency':'VND','timezone':'Asia/Ho_Chi_Minh','moneyDigits':18,'quantityPrecision':28,'quantityScale':8,'decimalPrecisionCandidate':80,'moneyRounding':'ROUND_HALF_UP_PER_HOLDING_THEN_SUM','actualArithmetic':'EXACT_DECIMAL_NO_BINARY64','forecastArithmetic':'Exact baseline and funding ledger; versioned approximate transcendental factors permitted for simulation only; not actual writes','forecastTrialsMax':1000,'forecastMonthsMax':360,'forecastPageRowsMax':12,'forecastPageBytesMax':262144,'financialWritesByForecast':False,'financialWritesByAgent':False,'sqlConcurrency':'Short READ COMMITTED write UoW with workspace financial anchor; REPEATABLE READ read snapshot; bounded full-transaction retry','runtime':'NOT_RUN'}
    put(D/'engine-policy.json',policies)
    put(D/'implementation-bundle.json',{'id':'FW-DOMAIN-BUNDLE-20261009','status':'DESIGN_ONLY','apiRevision':REV,'apiSha256':sha(A/'openapi.json'),'databaseRevision':model['id'],'databaseModelSha256':sha(B/'target-model.json'),'enginePolicy':policies['id'],'enginePolicySha256':sha(D/'engine-policy.json'),'securityProfile':'FW-SEC-T1-001','securityPolicySha256':sha(R/'docs/security/t1/security-policy.json'),'identityPolicy':'ARCH06 inherited mechanisms; operation matrix extended in ARCH08','runtime':'NOT_RUN'})
    classification=list(csv.DictReader((R/'docs/security/t1/table-data-classification.csv').open(encoding='utf-8')))
    for name in ['forecast_runs','forecast_result_pages']:
        row=copy.deepcopy(next(x for x in classification if x['table']=='simulations'));row['table']=name;row['owner']='Planning';classification.append(row)
    csvout(D/'table-data-classification.csv',classification)
    permissions=list(csv.DictReader((R/'docs/security/identity/operation-permissions.csv').open(encoding='utf-8')))
    for name,(template,_,_) in definitions.items():
        row=copy.deepcopy(next(x for x in permissions if x.get('operation')==template));row['operation']=name
        for k,v in row.items():
            if isinstance(v,str):row[k]=v.replace(template,name).replace('AgentWorker','ForecastWorker').replace('AgentStep','ForecastRun')
        if name=='executeForecastRun':
            row['objectScope']='Exact ForecastWorker capability; live scoped J2 ticket; frozen input only; current workspace access/recovery fence; no actual/active-plan/auth secret grants'
            for k in row:
                if k.lower() in ['authority','capability','role','permission','profile','purpose']:row[k]='ForecastWorker: compute scoped frozen input only; current J2 ticket + mTLS AND per-profile MAC; no actual/active-planning/auth secret grants'
        permissions.append(row)
    csvout(D/'operation-permissions.csv',permissions)
    overlay=list(csv.DictReader((R/'docs/security/t1/operation-security-overlay.csv').open(encoding='utf-8')))
    for row in overlay:row['apiRevision']=REV;row['authority']='ARCH08 operation-permissions.csv + inherited ARCH06 protocol'
    for name in definitions:
        row=copy.deepcopy(overlay[0]);row['operation']=name;row['actor']='worker' if name=='executeForecastRun' else 'owner';overlay.append(row)
    csvout(D/'operation-security-overlay.csv',overlay)
    bundle=json.loads((D/'implementation-bundle.json').read_text(encoding='utf-8'))
    bundle['securityBindingAddendum']={'baseApiRevision':'FW-API-T1-D1J2-002','currentApiRevision':REV,'currentApiSha256':sha(A/'openapi.json'),'baseDatabaseRevision':'FW-PHYS-T1-SECURITY-003','currentDatabaseRevision':model['id'],'operationOverlaySha256':sha(D/'operation-security-overlay.csv'),'tableClassificationSha256':sha(D/'table-data-classification.csv'),'permissionMatrixSha256':sha(D/'operation-permissions.csv'),'baseSecurityControlsUnchanged':True,'newProfile':'ForecastWorker: compute-only; no actual/active-plan/Agent/ingestion authority'}
    put(D/'implementation-bundle.json',bundle)
    print(json.dumps({'operations':len(api['paths']),'schemas':len(s),'tables':len(model['tables']),'columns':sum(len(t['columns']) for t in model['tables']),'foreignKeys':len(model['foreignKeys']),'permissionRows':len(permissions)}))
if __name__=='__main__':main()
