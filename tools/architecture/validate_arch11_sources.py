"""Validate DESIGN consistency, exact synthetic schema fixtures and independent model examples.
No provider/native/backend/SQL execution. Model helpers are not production implementations.
"""
from pathlib import Path
from copy import deepcopy
from fractions import Fraction
import csv, hashlib, json, re, sys
R=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(R/'work/handover-deps'))
from jsonschema import Draft202012Validator, FormatChecker
D=R/'docs/sources'; E=R/'docs/execution/evidence/arch-11-sources-2026-10-09'
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def put(p,x):p.write_text(json.dumps(x,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def main():
    if not (E/'validation-report.json').exists():put(E/'validation-report.json',{'status':'VALIDATION_PENDING','runtime':'NOT_RUN'})
    checks=[]
    def ck(name,ok,detail=None):checks.append({'name':name,'status':'PASS' if ok else 'FAIL','detail':detail})
    protected=read(E/'preservation-before.json')['files']
    drift=[n for n,h in protected.items() if not (R/n).exists() or sha(R/n)!=h]
    ck('Prior protected source/packages/evidence/baselines exact',not drift,{'files':len(protected),'drift':drift})
    bundle=read(D/'implementation-bundle.json');p=read(D/'source-policy.json');registry=read(D/'provider-registry.json')
    ck('Bundle pins match actual files',all(sha(R/x['path'])==x['sha256'] for x in bundle['files'].values()))
    api=read(R/'docs/contracts/v2-t1-r4/openapi.json');db=read(R/'docs/data/target-t1-async/target-model.json')
    schemas=api['components']['schemas'];tablemap={t['name']:t for t in db['tables']}
    ck('Exact API004 and DB005 counts',len(api['paths'])==153 and len(schemas)==634 and len(db['tables'])==87 and sum(len(t['columns']) for t in db['tables'])==1001 and len(db['foreignKeys'])==162)
    ck('Source design not activated no fee authorization',p['status']=='DESIGN_ONLY' and not p['realActivated'] and p['externalBudgetVnd']==0 and registry['externalCallsMade']==0 and p['runtime']=='NOT_RUN')
    ck('Missing owner app/device/commercial decision remains unknown',p['userBankSelection'] is None and p['userDevice'] is None and not p['commercialUseConfirmed'])
    real=[x for x in registry['providers'] if x['id'] not in ('synthetic-market','owner-manual')]
    ck('All real candidates unresolved and not supported',len(real)==6 and all(not x['supportedReal'] and not x['selectedByOwner'] and not x['parserImplemented'] and x['credentialRef'] is None for x in real))
    banks=[x for x in real if x['kind'] in ('bank','wallet')]
    ck('Real bank package known but no fabricated signer/version/template', {x['packageName'] for x in banks}=={'com.VCB','com.mservice.momotransfer'} and all(not x['signerCertificates'] and not x['testedAppVersions'] and not x['verifiedTemplateIds'] for x in banks))
    ck('Unknown market rights/quota deny',p['unknownRights']=='DENY' and p['unknownQuotaCap']==0 and all(all(v is None for v in x['rights'].values()) and not x['verifiedQuotaWindows'] for x in real))
    ck('Raw privacy explicit at all boundaries',all(v is False for v in p['rawNotification'].values()) and set(p['rawNotification'])=={'persist','upload','log','model','chat'})
    ck('No unbound upload/pending actual or bank-proof claim',p['unboundDisposition']=='LOCAL_WARNING_AND_GAP_NO_UPLOAD' and not p['pendingAutoPost'] and not p['deviceSignatureIsBankProof'] and not p['wireLifecycleFieldAdded'])
    ck('Exact gold units and no double purity',p['goldCanonicalUnit']=='chi' and p['chiPerLuong']==10 and p['thousandVndMultiplier']==1000 and not p['multiplyPurityAgain'])
    ck('Frozen time/freshness and no price cash/quantity writes',p['priceStaleAfterSeconds']==86400 and p['sourceStaleAfterSeconds']==172800 and p['quantityStaleAfterDays']==30 and not p['fetchedAtSubstitutesQuoteAsOf'] and not p['priceJobCanWriteCashOrQuantity'])
    ck('Daily scheduler aligned to ARCH09',p['daily']=={'hourLocal':18,'timezone':'Asia/Ho_Chi_Minh','timerSeconds':60,'manualCooldownSeconds':60,'exactSuccessGuarantee':False})
    mapping=read(D/'contract-storage-map.json')
    rows=list(csv.DictReader((R/'docs/async/operation-permissions.csv').open(encoding='utf-8')))
    actors={r['operation']:r['actor'] for r in rows}
    ck('Operations/actors/DB refs exact',all(m['operationId'] in actors and actors[m['operationId']]==m['actor'] and all(t in tablemap for t in m['tables']) for m in mapping['operations']),{'operations':len(mapping['operations'])})
    ck('Exact input field lists not invented',all(m['exactInputFields'] is None or set(m['exactInputFields'])==set(schemas[m['operationId']+'Input']['properties']) for m in mapping['operations']))
    ck('Private metadata columns exist',all(m['table'] in tablemap and m['column'] in {c['name'] for c in tablemap[m['table']]['columns']} for m in mapping['metadataMappings']))
    ck('No wire/PG revision hidden',not mapping['wireChanges'] and not mapping['postgresChanges'] and p['apiRevision']==bundle['apiRevision']=='FW-API-T1-D1J2-004' and p['databaseRevision']==bundle['databaseRevision']=='FW-PHYS-T1-ASYNC-005')
    wallet=mapping['walletProjection'];wirekinds=schemas['listSourcesOutput']['properties']['items']['items']['properties']['kind']['enum']
    kindcolumn=next(c for c in tablemap['sources']['columns'] if c['name']=='kind')['baselineDeclaration']
    ck('Wallet storage vs public projection documented',wallet=={'bank':'bank','wallet':'bank','price':'price','manual':None,'csv':None} and wirekinds==['bank','price'] and "'wallet'" in kindcolumn)
    ck('Unbound cannot masquerade receipt',not mapping['unbound']['uploadable'] and not mapping['unbound']['serverReceiptCreated'] and 'bindingId' in schemas['ingestNotificationsInput']['properties']['items']['items']['required'])
    payload=mapping['privatePayloadRegistryAddendum']
    ck('Registered private payload bounded non-generic',payload['objectKind']=='market_entitlement_snapshot' and payload['ownerModule']=='Market' and payload['maxBytes']==262144 and not payload['genericCrud'] and payload['runtime']=='NOT_RUN')
    profile=read(D/'profile-schemas.json');Draft202012Validator.check_schema(profile)
    ck('Private profiles valid metaschema',True,{'definitions':len(profile['$defs'])})
    ts='2026-10-09T08:00:00Z'
    parser={'id':'synthetic_parser1','packageName':'test.finweave.bank','version':'fixture1','supportedReal':False,'signerCertificates':[],'appVersions':[],'templateIds':[],'deviceEvidenceRefs':[],'currency':'VND','locale':'vi-VN','economicKeyVersion':'fixture1','finalityVerified':False,'privacyPassed':False,'sourceAccountMaskOnly':True}
    quote={'sourceId':'synthetic-market','adapterVersion':'fixture1','instrumentOrGoldProfileId':'fixture-gold1','profileVersion':'fixture1','rightsVersion':'fixture-rights1','rightsDigest':'a'*64,'sourceCurrency':'VND','sourceUnit':'luong','canonicalUnit':'chi','priceScale':'1000','side':'buy','basis':'RETAIL_PRODUCT_BUY','locale':'vi-VN','timePrecision':'source_datetime','timeSemantics':'SOURCE_DATETIME','sourceBusinessDate':None,'calendarVersion':None,'finalityVerified':True,'sourceTimeZone':'Asia/Ho_Chi_Minh','normalizationVersion':'FW-SOURCE-NORMALIZATION-001'}
    grant={'id':'fixture-grant','providerId':'synthetic-market','rightsVersion':'fixture-rights1','evidenceRef':'fabricated-not-vendor-grant','evidenceDigest':'b'*64,'use':'SAAS_DISPLAY','grantedCapabilities':['automation','serverNonDisplay','cache','historicalRetention','backup','derivedValuation','saasRedistribution'],'approvedAt':ts,'approvedBy':'fixture-only','expiresAt':None,'cacheScope':'WORKSPACE','storageCompatible':True,'quotaConfigVersion':'fixture1','configDigest':'c'*64}
    notification={'deviceId':'fixture-device','deviceEpoch':1,'recoveryEpoch':1,'items':[{'eventKey':'fixture-event','bindingId':'fixture-binding','bindingVersion':1,'sourceKey':'synthetic_bank','revision':0,'observedAt':ts,'parserVersion':'fixture1','payloadDigest':'d'*64,'normalizedEvidence':{'amount':'100123','currency':'VND','direction':'income','sourceAccountRef':'fixture-mask-01','transactionRef':'fabricated-ref-01','sourceOccurredAt':None,'ruleStatus':'complete'}}]}
    support={'items':[{'packageName':x['packageName'],'name':x['id'],'parserProfileId':x['id'].replace('-','_')+'_candidate1','supported':False,'reason':'SOURCE_POC_NOT_RUN'} for x in banks],'nextCursor':None,'snapshotVersion':1,'totalCount':2}
    manual={'holdingId':'fixture-holding','price':{'value':'12345000','currency':'VND','per':'luong'},'at':ts,'sourceId':'owner-manual','fxVndPerUsd':None,'fxAt':None,'compatible':True}
    fixtures=[]
    def add(name,family,definition,value,valid=True):fixtures.append({'id':name,'family':family,'definition':definition,'value':value,'expectedValid':valid})
    for n,v in [('ParserProfile',parser),('QuoteProfileSnapshot',quote),('EntitlementSnapshot',grant)]:add(n+'_valid','private',n,v)
    q=deepcopy(quote);q.update(timePrecision='session_bound',timeSemantics='VERIFIED_SESSION_FINAL_BOUND',sourceBusinessDate='2026-10-08',calendarVersion='fictional-calendar1')
    add('derived_time_with_pinned_calendar','private','QuoteProfileSnapshot',q)
    for name,key,value in [('parser_no_signer','supportedReal',True),('parser_raw','rawText','forbidden'),('parser_full_account','sourceAccountMaskOnly',False),('parser_invalid_cert','signerCertificates',['guess']),('parser_extra_currency','currency','USD')]:
        v=deepcopy(parser);v[key]=value;add(name,'private','ParserProfile',v,False)
    for name,key,value in [('quote_no_finality','finalityVerified',False),('quote_bad_unit','sourceUnit','oz'),('quote_wrong_canonical','canonicalUnit','share'),('quote_wrong_side','side','sell'),('quote_fetched_mode','timeSemantics','FETCHED_AT'),('quote_unknown_scale','priceScale','unknown')]:
        v=deepcopy(quote);v[key]=value;add(name,'private','QuoteProfileSnapshot',v,False)
    for name,key,value in [('session_no_calendar','calendarVersion',None),('session_invalid_date','sourceBusinessDate','2026-02-29'),('session_wrong_precision','timePrecision','source_datetime')]:
        v=deepcopy(q);v[key]=value;add(name,'private','QuoteProfileSnapshot',v,False)
    for name,key,value in [('rights_no_redistribution','grantedCapabilities',[]),('rights_storage_incompatible','storageCompatible',False),('rights_bad_expiry','expiresAt','yesterday'),('rights_external_model_not_granted','use','EXTERNAL_MODEL'),('rights_raw_credential','token','forbidden')]:
        v=deepcopy(grant);v[key]=value;add(name,'private','EntitlementSnapshot',v,False)
    add('normalized_notification','api','ingestNotificationsInput',notification)
    incomplete=deepcopy(notification);incomplete['items'][0]['normalizedEvidence'].update(amount=None,direction='unknown',ruleStatus='incomplete')
    add('bound_incomplete_review','api','ingestNotificationsInput',incomplete)
    add('real_candidates_supported_false','api','listSourceSupportOutput',support)
    add('manual_luong_no_double_divide','api','recordPriceQuoteInput',manual)
    for name,mutation in [
        ('unbound_null',lambda x:x['items'][0].update(bindingId=None)),
        ('missing_binding',lambda x:x['items'][0].pop('bindingId')),
        ('raw_forbidden',lambda x:x['items'][0]['normalizedEvidence'].update(rawText='forbidden')),
        ('lifecycle_field_not_on_wire',lambda x:x['items'][0]['normalizedEvidence'].update(status='pending')),
        ('formatted_amount_forbidden',lambda x:x['items'][0]['normalizedEvidence'].update(amount='100.123')),
        ('negative_amount_forbidden',lambda x:x['items'][0]['normalizedEvidence'].update(amount='-1')),
        ('non_vnd',lambda x:x['items'][0]['normalizedEvidence'].update(currency='USD')),
        ('fees_field_not_on_wire',lambda x:x['items'][0]['normalizedEvidence'].update(fee='1')),
        ('unknown_bank_time_not_fabricated',lambda x:x['items'][0]['normalizedEvidence'].update(sourceOccurredAt='unknown')),
        ('batch_too_large',lambda x:x.update(items=x['items']*51)),
    ]:
        v=deepcopy(notification);mutation(v);add(name,'api','ingestNotificationsInput',v,False)
    results=[]
    for f in fixtures:
        s={'$schema':'https://json-schema.org/draft/2020-12/schema',**({'$defs':profile['$defs'],'$ref':'#/$defs/'+f['definition']} if f['family']=='private' else {'components':api['components'],'$ref':'#/components/schemas/'+f['definition']})}
        valid=not list(Draft202012Validator(s,format_checker=FormatChecker()).iter_errors(f['value']))
        results.append({'case':f['id'],'expectedValid':f['expectedValid'],'actualValid':valid,'status':'PASS' if valid==f['expectedValid'] else 'FAIL'})
    put(D/'schema-fixtures.json',{'scope':'Synthetic schema examples; fabricated amounts/references/rights, not bank templates or vendor grants; placeholder digest strings not crypto vectors','fixtures':fixtures})
    put(E/'schema-validation.json',{'runtime':'NOT_RUN','positive':sum(f['expectedValid'] for f in fixtures),'negative':sum(not f['expectedValid'] for f in fixtures),'results':results})
    ck('Synthetic API/private schema positive and negative examples',all(r['status']=='PASS' for r in results),{'cases':len(results)})

    # Hand-selected expected outcomes; document models only, not provider or parser tests.
    vectors=[]
    def vec(id,kind,input,expected):vectors.append({'id':id,'kind':kind,'input':input,'expected':expected})
    def gold(raw,locale,scale,unit,stored,num,den):
        vec('gold_'+str(len(vectors)+1),'gold',{'raw':raw,'locale':locale,'scale':scale,'unit':unit},{'stored':stored,'unit':unit,'canonicalNumerator':str(num),'canonicalDenominator':str(den)})
    gold('1234.5','en-US','1000','chi','1234500',1234500,1)
    gold('12345','en-US','1000','luong','12345000',1234500,1)
    gold('1.234,5','vi-VN','1000','chi','1234500',1234500,1)
    gold('1,234.50','en-US','1','luong','1234.5',2469,20)
    gold('0.00000001','en-US','1','luong','0.00000001',1,1000000000)
    gold('1,234','en-US','1','chi','1234',1234,1)
    gold('1,234','vi-VN','1','chi','1.234',617,500)
    for raw,locale,unit in [('0','en-US','chi'),('-1','en-US','chi'),('1e3','en-US','chi'),('NaN','en-US','chi'),('12.34,5','vi-VN','chi'),('1,23.4','en-US','chi'),('1.000000001','en-US','chi'),('1234567890123456789','en-US','chi'),('123','en-US','oz'),('١٢٣','en-US','chi')]:
        vec('gold_invalid_'+str(len(vectors)+1),'gold',{'raw':raw,'locale':locale,'scale':'1','unit':unit},'REJECT')
    market={k:True for k in p['realMarketGates']}
    vec('market_all_hypothetical_gates','market_gate',market,True)
    for k in market:vec('market_missing_'+k,'market_gate',{**market,k:False},False)
    collector={k:True for k in p['realCollectorGates']}
    vec('capture_all_hypothetical_gates','collector_gate',collector,'ELIGIBLE_NOT_BANK_PROOF')
    for k in collector:vec('capture_missing_'+k,'collector_gate',{**collector,k:False},'LOCAL_WARNING_NO_UPLOAD' if k=='bindingUnambiguous' else 'PAUSE')
    for state,bound,currency,amount,expected in [
      ('settled',True,'VND','100123','ELIGIBLE_ENGINE_REVIEW_OR_POST'),('pending',True,'VND','100123','BOUND_INCOMPLETE_REVIEW'),
      ('failed_no_movement',True,'VND','100123','DISCARD_NO_ACTUAL'),('redacted',True,'VND',None,'BOUND_INCOMPLETE_REVIEW'),
      ('settled',False,'VND','100123','LOCAL_WARNING_NO_UPLOAD'),('settled',True,'USD','100123','BOUND_INCOMPLETE_REVIEW'),
      ('settled',True,'VND',None,'BOUND_INCOMPLETE_REVIEW'),('settled',True,'VND','0','BOUND_INCOMPLETE_REVIEW'),
      ('fee_ambiguous',True,'VND','100123','BOUND_INCOMPLETE_REVIEW')]:
        vec('finality_'+str(len(vectors)+1),'finality',{'state':state,'bound':bound,'currency':currency,'amount':amount},expected)
    for mode,final,calendar,future,expected in [('SOURCE_DATETIME',True,False,False,True),('SOURCE_DATETIME',False,False,False,False),('SOURCE_DATETIME',True,False,True,False),('VERIFIED_SESSION_FINAL_BOUND',True,True,False,True),('VERIFIED_SESSION_FINAL_BOUND',True,False,False,False),('MISSING',True,True,False,False)]:
        vec('quote_time_'+str(len(vectors)+1),'time',{'mode':mode,'final':final,'calendar':calendar,'future':future},expected)
    for seconds,expected in [(86399,False),(86400,False),(86401,True)]:vec('stale_'+str(seconds),'stale',{'seconds':seconds},expected)
    for kind,expected in mapping['walletProjection'].items():vec('wallet_projection_'+kind,'projection',{'kind':kind},expected)
    vec('same_amount_time_not_economic_identity','dedupe',{'trustedSameEconomicKey':False,'restoredReceiptMissing':False},'REVIEW_NOT_SUPPRESS')
    vec('cross_device_verified_same_economic_key','dedupe',{'trustedSameEconomicKey':True,'restoredReceiptMissing':False},'PROVENANCE_ONLY_DELTA_ZERO')
    vec('restore_missing_not_auto_reingest','dedupe',{'trustedSameEconomicKey':True,'restoredReceiptMissing':True},'INVESTIGATE_NO_REINGEST')
    put(D/'model-vectors.json',{'scope':'Independent expected DESIGN models only; no bank regex, real provider data, Engine/backend/native/quota/crypto implementation executed','vectors':vectors})
    def decimal_string(f):
        sign='-' if f<0 else '';f=abs(f);scale=0
        while (f*10**scale).denominator!=1:scale+=1;assert scale<=32
        digits=str((f*10**scale).numerator)
        if not scale:return sign+digits
        digits=digits.zfill(scale+1);return (sign+digits[:-scale]+'.'+digits[-scale:]).rstrip('0').rstrip('.')
    def model(v):
        x=v['input'];k=v['kind']
        if k=='gold':
            try:
                if x['unit'] not in ('chi','luong') or x['scale'] not in ('1','1000'):return 'REJECT'
                pattern=r'(?:[0-9]+|[1-9][0-9]{0,2}(?:\.[0-9]{3})+)(?:,[0-9]{1,8})?' if x['locale']=='vi-VN' else r'(?:[0-9]+|[1-9][0-9]{0,2}(?:,[0-9]{3})+)(?:\.[0-9]{1,8})?'
                if not re.fullmatch(pattern,x['raw']):return 'REJECT'
                raw=x['raw'].replace('.','').replace(',','.') if x['locale']=='vi-VN' else x['raw'].replace(',','')
                value=Fraction(raw)*int(x['scale']);stored=decimal_string(value)
                if value<=0 or not re.fullmatch(r'(0|[1-9][0-9]{0,17})(\.[0-9]{1,8})?',stored):return 'REJECT'
                canonical=value/(10 if x['unit']=='luong' else 1)
                return {'stored':stored,'unit':x['unit'],'canonicalNumerator':str(canonical.numerator),'canonicalDenominator':str(canonical.denominator)}
            except (ValueError,ZeroDivisionError):return 'REJECT'
        if k=='market_gate':return all(x.get(key) is True for key in p['realMarketGates'])
        if k=='collector_gate':
            if not x['bindingUnambiguous']:return 'LOCAL_WARNING_NO_UPLOAD'
            return 'ELIGIBLE_NOT_BANK_PROOF' if all(x.get(key) is True for key in p['realCollectorGates']) else 'PAUSE'
        if k=='finality':
            if not x['bound']:return 'LOCAL_WARNING_NO_UPLOAD'
            if x['state']=='failed_no_movement':return 'DISCARD_NO_ACTUAL'
            return 'ELIGIBLE_ENGINE_REVIEW_OR_POST' if x['state']=='settled' and x['currency']=='VND' and x['amount'] is not None and int(x['amount'])>0 else 'BOUND_INCOMPLETE_REVIEW'
        if k=='time':return x['final'] and not x['future'] and (x['mode']=='SOURCE_DATETIME' or x['mode']=='VERIFIED_SESSION_FINAL_BOUND' and x['calendar'])
        if k=='stale':return x['seconds']>86400
        if k=='projection':return mapping['walletProjection'][x['kind']]
        if k=='dedupe':return 'INVESTIGATE_NO_REINGEST' if x['restoredReceiptMissing'] else ('PROVENANCE_ONLY_DELTA_ZERO' if x['trustedSameEconomicKey'] else 'REVIEW_NOT_SUPPRESS')
        raise ValueError(k)
    mresults=[{'case':v['id'],'expected':v['expected'],'actual':model(v),'status':'PASS' if model(v)==v['expected'] else 'FAIL'} for v in vectors]
    put(E/'model-validation.json',{'scope':'MODEL_ONLY, not runtime integration tests','runtime':'NOT_RUN','results':mresults})
    ck('Exact conversion/gating/finality/time/projection examples',all(r['status']=='PASS' for r in mresults),{'examples':len(mresults)})
    trace=read(D/'requirement-traceability.json')['requirements']
    ck('32 unique requirements/acceptance all NOT RUN',len(trace)==32 and len({x['id'] for x in trace})==32 and len({x['acceptanceId'] for x in trace})==32 and all(x['runtime']=='NOT_RUN' and (D/x['spec']).exists() and x['acceptanceId'] in (D/'acceptance-plan.md').read_text(encoding='utf-8') for x in trace))
    parent=list(csv.DictReader((R/'docs/product/backend-requirement-coverage.csv').open(encoding='utf-8')))
    ck('Parent all41 AC retained no scope drop',len(parent)==41 and len({x['AC'] for x in parent})==41 and all(x['required']=='YES' for x in parent))
    research=read(D/'research-sources.json')
    ck('Dated primary-source research vs integration status',research['asOf']=='2026-10-09' and len(research['sources'])==18 and all(x['url'].startswith('https://') and x['liveIntegration']=='NOT_RUN' for x in research['sources']))
    names=read(E/'current-documents.json')['files']
    ck('27currentdocs updated with current source notice',len(names)==27 and all('> **ARCH-11 hiện hành' in (R/n).read_text(encoding='utf-8') for n in names))
    # Only links introduced by ARCH11; historical source packages are deliberately immutable.
    targets=list(D.glob('*.md'))+[R/'docs/architecture/ARCH-11-change-report.md',R/'docs/architecture/adr/ADR-018-verified-source-profiles-and-market-entitlements.md']
    broken=[]
    for path in targets+[R/n for n in names]:
        content=path.read_text(encoding='utf-8')
        if path not in targets:
            lines=[];active=False
            for line in content.splitlines():
                if line.startswith('#'):active='ARCH-11' in line
                if active or 'ARCH-11' in line:lines.append(line)
            content='\n'.join(lines)
        for dest in re.findall(r'\]\(([^)]+)\)',content):
            dest=dest.split('#')[0].strip('<>')
            if not dest or '://' in dest or dest.startswith('mailto:'):continue
            if not (path.parent/dest).resolve().exists():broken.append({'from':path.relative_to(R).as_posix(),'to':dest})
    ck('ARCH11 local references resolve',not broken,broken)
    allgood=all(c['status']=='PASS' for c in checks)
    report={'id':'FW-ARCH11-SOURCES-VALIDATION-001','date':'2026-10-09','status':'PASS_DESIGN_STATIC_MODEL_ONLY' if allgood else 'FAIL','runtime':'NOT_RUN','realProviders':'NOT_ACTIVATED','checksPassed':sum(c['status']=='PASS' for c in checks),'checksTotal':len(checks),'protectedFiles':len(protected),'currentDocs':len(names),'schemaCases':len(fixtures),'modelExamples':len(vectors),'checks':checks}
    put(E/'validation-report.json',report)
    print(json.dumps({k:v for k,v in report.items() if k!='checks'}))
    if not allgood:
        print(json.dumps([c for c in checks if c['status']=='FAIL'],ensure_ascii=False));sys.exit(1)

if __name__=='__main__':main()
