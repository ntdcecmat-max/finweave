"""Validate design consistency/strict metadata schemas/hashes. No crypto, SQL or restore execution."""
from pathlib import Path
import copy,csv,hashlib,json,re,sys,warnings
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'work/handover-deps'))
warnings.filterwarnings('ignore',category=DeprecationWarning)
from jsonschema import Draft202012Validator,FormatChecker
S=ROOT/'docs/security/t1';D=ROOT/'docs/data/target-t1-security';E=ROOT/'docs/execution/evidence/arch-07-t1-security-2026-10-09'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def read(p):return json.loads(p.read_text(encoding='utf-8'))
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def rows(name):return list(csv.DictReader((S/name).open(encoding='utf-8')))
def main():
    checks=[]
    def record(name,ok,detail):checks.append({'check':name,'status':'PASS' if ok else 'FAIL','detail':detail})
    # Initialize self-linked report as pending, never a fabricated PASS placeholder.
    dump(E/'validation.json',{'status':'VALIDATING_NOT_ACCEPTED','scope':'Static artifact consistency only'})
    m=read(D/'target-model.json');tables={t['name']:t for t in m['tables']};base=read(ROOT/'docs/data/target-t1-auth/target-model.json')
    rev=read(D/'revision.json');policy=read(S/'security-policy.json');bundle=read(S/'implementation-bundle.json')
    record('full_model_counts_and_hash',len(tables)==84 and sum(len(t['columns']) for t in tables.values())==960 and rev['modelSha256']==sha(D/'target-model.json'),rev)
    record('inherit_all_82_tables_and_columns',all(t['name'] in tables and {c['name'] for c in t['columns']}<={c['name'] for c in tables[t['name']]['columns']} for t in base['tables']),len(base['tables']))
    bad=[]
    for f in m['foreignKeys']:
        if f['table'] not in tables or f['target'] not in tables or not set(f['columns'])<={c['name'] for c in tables[f['table']]['columns']} or not set(f['targetColumns'])<={c['name'] for c in tables[f['target']]['columns']}:bad.append(f)
    record('foreign_key_reference_columns',not bad,{'foreignKeys':len(m['foreignKeys']),'bad':bad})
    record('only_two_new_control_tables',set(tables)-{t['name'] for t in base['tables']}=={'recovery_delivery_state','erasure_requests'},'Control outbox/state only; not another financial lease authority')
    record('target_control_tokens_and_distinct_epochs',all({'recovery_token','recovery_control_epoch'}<={c['name'] for c in tables[t]['columns']} for t in ['identities','workspaces','devices']),'Random stable target mapping, domain epochs separate')
    erasure_rules=' '.join(tables['erasure_requests']['rules'])
    record('locked_restore_and_erase_storage',{'access_state'}<={c['name'] for c in tables['workspaces']['columns']} and 'recovery_reset_required' in {c['name'] for c in tables['identities']['columns']} and any(f['table']=='erasure_requests' and f['target']=='erasure_requests' for f in m['foreignKeys']) and 'no self-link or cycles' in erasure_rules and 'original parent deadline' in erasure_rules,'No erased-owner FK; acyclic typed parent-child inventory and original deadline required')
    classes=rows('table-data-classification.csv')
    record('all_84_tables_classified_once',len(classes)==len(tables) and {r['table'] for r in classes}==set(tables),len(classes))
    by_class={r['table']:r for r in classes}
    record('finance_and_credentials_not_ops_direct',all(r['opsExposure']=='DENY_DIRECT' for r in classes if r['classification'] in ['finance_private','credential_secret','identity_private','recovery_control','security_restricted']) and all(by_class[t['name']]['classification']=='finance_private' for t in m['tables'] if t['owner']=='Market' and t.get('tenant')) and all(by_class[n]['classification']=='security_restricted' for n in ['jobs','job_attempts','scheduler_state','ops_previews','ops_idempotency']), 'Tenant quotes are private; dispatcher leases and Ops replay/preview tokens require narrow purpose grants, not direct admin exposure')
    api=read(ROOT/'docs/contracts/v2-t1-r2/openapi.json');opnames={it['post']['operationId'] for it in api['paths'].values()};ops=rows('operation-security-overlay.csv')
    record('full_147_operation_overlay',len(ops)==147 and {r['operation'] for r in ops}==opnames,147)
    record('api002_and_security_bundle_pins',bundle['apiSha256']==sha(ROOT/'docs/contracts/v2-t1-r2/openapi.json') and policy['apiSha256']==bundle['apiSha256'] and bundle['securityPolicySha256']==sha(S/'security-policy.json') and bundle['databaseModelSha256']==sha(D/'target-model.json'),'No public API mutation/revision upgrade')
    keys=rows('key-inventory.csv')
    record('key_inventory_unique_and_separated',len(keys)==20 and len({r['keyId'] for r in keys})==20 and {r['custody'] for r in keys if r['keyId'].startswith('owner_')}=={'Identity'} and {r['custody'] for r in keys if r['keyId'].startswith('ops_')}=={'OpsIdentity'},'20metadata key classes; no key material generated')
    record('witness_private_key_not_finance_host',next(r for r in keys if r['keyId']=='checkpoint_witness')['custody']=='Independent witness custodian','No anti-trusted-root guarantee')
    record('no_real_enable_or_provision_claim',not policy['realEnabled'] and not policy['frontendMutation'] and not policy['backup']['measured'] and not policy['checkpoint']['witnessProvisioned'],'All actual execution gates remain NOT_RUN')
    record('backup_hard_age_and_purge_bound',policy['backup']['snapshotHardMaxAgeDays']*24+policy['backup']['unreferencedPackPurgeMaxHours']<=policy['backup']['erasureMaxDaysFromRequest']*24 and not policy['backup']['writerCanDelete'], '34d+24h<=35d target, not a runtime measurement')
    record('independent_deny_checkpoint_required',all(policy['checkpoint'][x] for x in ['independent','denyOnly','successRequiresDurableAnchor','latestHeadRequiresFreshNonce','retainUntilAllCopiesExpired']) and not policy['checkpoint']['publicFinancePayloadAllowed'],'Pending local deny is not successful recovery-safe completion')
    record('restore_invalidates_old_auth',policy['restore']['invalidateAllSessionsTokensChallengesRecoveryCodes'] and policy['restore']['requireFreshOwnerPasswordReset'] and not policy['restore']['reactivateOldAuthReplay'] and policy['restore']['oldHostMustBeFenced'],'Schema policy only, actual restore NOT_RUN')
    record('egress_and_logs_default_deny',policy['egress']['default']=='DENY' and not policy['egress']['externalLLMFinanceDefault'] and not policy['egress']['bankRawAnywhere'] and {'body','headers','token','password','amount','prompt','sqlParameters'}<=set(policy['logs']['forbidden']),'FinWeave own auth code allowed only auth purpose, never logs')
    schemas={n:read(S/n) for n in ['recovery-event.schema.json','witness-receipt.schema.json','witness-head.schema.json']};invalid_schemas=[]
    for name,v in schemas.items():
        try:Draft202012Validator.check_schema(v)
        except Exception as exc:invalid_schemas.append([name,str(exc)[:150]])
    record('strict_metadata_schema_definitions',not invalid_schemas and all(v.get('additionalProperties') is False for v in schemas.values()),invalid_schemas)
    token='A'*43;sig='A'*86;digest='0'*64
    event={'profile':'FW-RECOVERY-EVENT-001','eventId':'SYNTHETIC_EVENT','environmentId':'SYNTHETIC_ENV','scopeKind':'workspace','targetToken':token,'epoch':1,'kind':'workspace_erase','createdAt':'2026-10-09T00:00:00Z','producerKeyId':'SYNTHETIC_PRODUCER'}
    receipt={'profile':'FW-WITNESS-RECEIPT-001','environmentId':'SYNTHETIC_ENV','eventId':'SYNTHETIC_EVENT','eventDigest':digest,'sequence':1,'previousRecordHash':digest,'recordHash':digest,'witnessKeyId':'SYNTHETIC_WITNESS','storedAt':'2026-10-09T00:00:01Z','signature':sig}
    head={'profile':'FW-WITNESS-HEAD-001','environmentId':'SYNTHETIC_ENV','sequence':1,'recordHash':digest,'challengeNonce':token,'issuedAt':'2026-10-09T00:00:02Z','witnessKeyId':'SYNTHETIC_WITNESS','signature':sig}
    positive=[];negative=[]
    def valid(name,value):return Draft202012Validator(schemas[name],format_checker=FormatChecker()).is_valid(value)
    for name,v in [('recovery-event.schema.json',event),('witness-receipt.schema.json',receipt),('witness-head.schema.json',head)]:positive.append({'schema':name,'payload':v,'valid':valid(name,v),'scope':'SYNTHETIC STRUCTURAL ONLY; signatures/digests are deliberately placeholders, NOT cryptographic proof'})
    def neg(name,title,value,change):
        v=copy.deepcopy(value);change(v);negative.append({'schema':name,'case':title,'payload':v,'rejected':not valid(name,v)})
    for field in ['amount','email','bankOTP','rawNotification','prompt','arbitraryMetadata']:
        neg('recovery-event.schema.json','Forbidden field '+field,event,lambda v,f=field:v.update({f:'SYNTHETIC_FORBIDDEN'}))
    neg('recovery-event.schema.json','Permit kind forbidden',event,lambda v:v.update(kind='grant_owner'))
    neg('recovery-event.schema.json','Wrong target kind',event,lambda v:v.update(scopeKind='identity'))
    neg('recovery-event.schema.json','Epoch zero forbidden',event,lambda v:v.update(epoch=0))
    neg('recovery-event.schema.json','Target token must be full256bit shape',event,lambda v:v.update(targetToken='123456'))
    neg('witness-receipt.schema.json','Sequence positive required',receipt,lambda v:v.update(sequence=0))
    neg('witness-receipt.schema.json','Signature field required',receipt,lambda v:v.pop('signature'))
    neg('witness-head.schema.json','Fresh query nonce must be present',head,lambda v:v.pop('challengeNonce'))
    neg('witness-head.schema.json','No financial body in head',head,lambda v:v.update(balance='100000'))
    neg('witness-head.schema.json','Epoch counter safe integer',head,lambda v:v.update(sequence=9007199254740992))
    dump(E/'metadata-shape-fixtures.json',{'positive':positive,'negative':negative,'scope':'Schema shapes only; does NOT verify signature/hashchain/nonce freshness/durability or access control'})
    record('positive_metadata_shapes_3',all(v['valid'] for v in positive),len(positive))
    record('negative_metadata_shapes_15',len(negative)==15 and all(v['rejected'] for v in negative),len(negative))
    threats=rows('threat-register.csv');accept=(S/'acceptance-plan.md').read_text(encoding='utf-8');caseids=set(re.findall(r'\| (SEC-\d\d) \|',accept))
    record('threats_and_runtime_cases_complete',len(threats)==16 and caseids=={f'SEC-{i:02d}' for i in range(1,33)} and all(set(r['runtimeCases'].split(','))<=caseids for r in threats),'16 threats mapped to32 runtime cases, all NOT_RUN')
    record('runtime_states_not_upgraded','ALL 32 RUNTIME CASES NOT RUN' in accept and all(r['status']=='DESIGN_SPECIFIED_RUNTIME_NOT_RUN' for r in threats),'Security tests not executed in this task')
    before=read(E/'preservation-before.json')['files'];drift=[p for p,h in before.items() if not (ROOT/p).exists() or sha(ROOT/p)!=h]
    dump(E/'preservation.json',{'status':'PASS' if not drift else 'FAIL','checkedFiles':len(before),'drift':drift,'scope':'Frontend/config/lockfiles, original API/DB/baselines, ARCH05 and ARCH06 frozen packages/tools/evidence'})
    record('protected_source_and_packages',not drift,{'checkedFiles':len(before),'drift':drift})
    paths=list(S.glob('*.md'))+list(D.glob('*.md'))+[ROOT/'docs/architecture/adr/ADR-014-t1-data-protection-and-recovery-witness.md',ROOT/'docs/architecture/ARCH-07-change-report.md']
    broken=[];count=0
    for p in paths:
        if not p.exists():broken.append(str(p.relative_to(ROOT)));continue
        for target in re.findall(r'\]\(([^)]+)\)',p.read_text(encoding='utf-8')):
            if target.startswith(('https:','http:','#')):continue
            count+=1
            if not (p.parent/target.split('#')[0]).resolve().exists():broken.append([str(p.relative_to(ROOT)),target])
    record('security_document_links',not broken,{'localLinks':count,'broken':broken})
    result={'status':'STATIC_PASS' if all(c['status']=='PASS' for c in checks) else 'FAIL','date':'2026-10-09','scope':'DESIGN CONSISTENCY / SCHEMA SHAPES / HASH PRESERVATION ONLY','checks':checks,'runtime':'SEC01..32/AUTH01..30/crypto/TLS/SQL/grants/native/backup/prune/witness/restore NOT_RUN','bundle':bundle}
    dump(E/'validation.json',result);print(json.dumps({'status':result['status'],'checks':len(checks),'failed':[c for c in checks if c['status']=='FAIL']},ensure_ascii=True))
    if result['status']=='FAIL':raise SystemExit(1)
if __name__=='__main__':main()
