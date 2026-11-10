"""ARCH-07 design only: no frontend, SQL, API revision or live secret mutation."""
from pathlib import Path
import copy,csv,hashlib,json
ROOT=Path(__file__).resolve().parents[2]
S=ROOT/'docs/security/t1';D=ROOT/'docs/data/target-t1-security'
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def csvout(p,rows):
    with p.open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
def main():
    S.mkdir(parents=True,exist_ok=True);D.mkdir(parents=True,exist_ok=True)
    old=ROOT/'docs/data/target-t1-auth/target-model.json';m=json.loads(old.read_text(encoding='utf-8'))
    m.update(id='FW-PHYS-T1-SECURITY-003',status='EXPAND_DESIGN_SQL_NOT_RUN',previousSha256=sha(old),warning='Inherited declarations are historical. ARCH07 targetRules/migration plan add security recovery storage, not executable DDL. All implementation NOT RUN.')
    by={t['name']:t for t in m['tables']};delta=[]
    def add(table,spec,rules):
        t=by[table];names=[]
        for n,typ,null,meaning in spec:
            assert n not in {c['name'] for c in t['columns']}
            t['columns'].append({'name':n,'type':typ,'nullable':null,'meaning':meaning,'stage':'ARCH07_EXPAND'});names.append(n)
        t.setdefault('targetRules',[]).extend(rules);delta.append({'table':table,'addedColumns':names,'targetRules':rules})
    for table in ['identities','workspaces','devices']:
        add(table,[('recovery_token','text',False,'Stable random256bit opaque recovery target, generated once; not finance/PII hash'),('recovery_control_epoch','bigint',False,'Monotonic recovery event counter independent of auth/device/domain epochs')],['UNIQUE(recovery_token); no regeneration on backup/restore; typed target_kind separates scopes','recovery_control_epoch>=0; lock target anchor before allocating event epoch; do not replace domain auth/device/recovery epoch with this counter'])
    add('workspaces',[('access_state','text',False,'active denied erasing; deny before erasure publication')],['Every finance query/mutation/worker rechecks workspace access_state; erasing cannot reactivate through ordinary owner/admin operation'])
    add('identities',[('recovery_reset_required','boolean',False,'Restore-only gate: false after freshly authorized reset, true after restore')],['Old password PHC cannot authorize sign-in while recovery_reset_required; no fallback to old backup credentials'])
    add('recovery_journal',[
      ('scope_kind','text',False,'identity workspace or device; historical workspace_token is target-token alias'),('environment_id','text',False,'Pinned environment stream, never synthetic↔real'),('producer_key_id','text',False,'Approved Ed25519 public key registry id'),('producer_signature','text',False,'Signature on immutable canonical event body')],['workspace_token is legacy-named opaque target_token, no workspace FK','UNIQUE(scope_kind,workspace_token,epoch) replaces legacy two-column unique at cutover','Append only; event body stored in delivery state must hash exactly to event_digest','epoch comes from target.recovery_control_epoch; auth/device/domain epochs remain distinct; deny events only'])
    common=[('id','text',False,'Opaque id'),('created_at','timestamptz',False,'UTC creation')]
    def new(name,spec,rules,retention):
        t={'name':name,'owner':'Recovery','tenant':False,'stage':'ARCH07_NEW_DESIGN','columns':[{'name':n,'type':typ,'nullable':null,'meaning':meaning} for n,typ,null,meaning in common+spec],'rules':['PRIMARY KEY(id)']+rules,'retention':retention};m['tables'].append(t);by[name]=t;delta.append({'table':name,'new':True,'targetRules':t['rules']})
    new('recovery_delivery_state',[
      ('journal_id','text',False,'Immutable recovery_journal reference'),('state','text',False,'prepared anchored applied failed'),('command_operation','text',False,'Registered auth/erasure operation or runbook command'),('command_principal_token','text',False,'Opaque authorized actor scope'),('command_key_digest','text',False,'Keyed original command key, no bearer/password'),('event_body','jsonb',False,'Strict RecoveryEvent; max8192bytes; no financial/free-text payload'),('witness_sequence','bigint',True,'Independent durable append sequence'),('witness_receipt','jsonb',True,'Signed strict receipt, not trusted merely from DB'),('attempt_count','integer',False,'Bounded publication attempts; no second finance queue'),('last_safe_error','text',True,'Enum only'),('updated_at','timestamptz',False,'Last control state change')],['UNIQUE(journal_id)','UNIQUE(command_principal_token,command_operation,command_key_digest,journal_id)','Anchored/applied require verified witness receipt matching event digest/environment/target','No update to original journal to fill checkpoint_ref; acknowledgment lives here','Recovery coordinator only; jobs table not duplicated; no finance dispatch claim'], 'Through max recoverable backup + native replay horizon; minimum90days for denies, no auto expiry while unsafe copies remain')
    new('erasure_requests',[
      ('scope_kind','text',False,'identity or workspace'),('target_token','text',False,'Opaque token, deliberately no erased-owner FK'),('parent_request_id','text',True,'Identity erasure parent for frozen workspace child inventory'),('request_key_digest','text',False,'Keyed authorized original erasure request'),('state','text',False,'requested denied anchored active_purged backup_pending completed failed'),('requested_by_token','text',False,'Opaque verified owner/privileged-runbook actor'),('checkpoint_ref','text',True,'Verified independent deny checkpoint'),('active_purged_at','timestamptz',True,'All active stores purged, not only UI hidden'),('backup_purge_due_at','timestamptz',False,'Original request +35days; never slides after retry'),('completed_at','timestamptz',True,'All tracked copies verified purged'),('last_safe_error','text',True,'Enum only'),('updated_at','timestamptz',False,'Control status update')],['UNIQUE(scope_kind,target_token,request_key_digest)','Completed requires checkpoint+active purge+all copy inventories verified; not deadline alone','Identity parent completes only after every frozen workspace child completes; no cascade to erased owner','Parent, when present, must be an identity request; child must be a workspace request; identity parent has no parent; no self-link or cycles','Child inherits the original parent deadline; frozen inventory must contain every owned workspace under ownership locks','No financial body/email/raw/free text; target tombstone survives workspace deletion'], 'Minimum90days and until every affected backup/export copy retired; then approved minimization')
    m['foreignKeys'].append({'table':'recovery_delivery_state','columns':['journal_id'],'target':'recovery_journal','targetColumns':['id'],'optional':False,'origin':'arch07-design'})
    m['foreignKeys'].append({'table':'erasure_requests','columns':['parent_request_id'],'target':'erasure_requests','targetColumns':['id'],'optional':True,'origin':'arch07-design'})
    dump(D/'target-model.json',m);dump(D/'security-delta.json',{'previousModelSha256':sha(old),'status':'DESIGN_NOT_SQL','changes':delta})
    dump(D/'revision.json',{'id':m['id'],'status':m['status'],'tables':len(m['tables']),'columns':sum(len(t['columns']) for t in m['tables']),'foreignKeys':len(m['foreignKeys']),'newTables':2,'addedExistingColumns':sum(len(d.get('addedColumns',[])) for d in delta),'modelSha256':sha(D/'target-model.json')})
    lines=['# ARCH-07 security dictionary delta','','Inherited82-table dictionary remains in target-t1-auth; this lists only new security fields/tables. SQL NOT RUN.','']
    for x in delta:
        t=by[x['table']];cs=t['columns'] if x.get('new') else [c for c in t['columns'] if c['name'] in x['addedColumns']]
        lines+=['## '+t['name'],'','| Column | Type | Null | Meaning |','| --- | --- | --- | --- |']+[f"| {c['name']} | {c['type']} | {c['nullable']} | {c['meaning']} |" for c in cs]+['']+['- '+r for r in x['targetRules']]+['']
    (D/'data-dictionary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    (D/'security-erd.mmd').write_text('erDiagram\n  recovery_journal ||--o| recovery_delivery_state : journal_id\n  erasure_requests |o--o{ erasure_requests : parent_request_id\n',encoding='utf-8')
    keys=[
      ('owner_credential_pepper','Identity','HMAC-SHA256','90d review; retain until all active verifier versions retired','Never silently invalidate active refresh/recovery refs'),
      ('owner_challenge_pepper','Identity','HMAC-SHA256','90d; old15min+retry horizon','No OTP plaintext'),
      ('owner_auth_replay_aead','Identity','AES-256-GCM','90d or compromise; old5min body horizon','Restore discards all replay bodies'),
      ('owner_csrf_hmac','Identity','HMAC-SHA256','90d; rotate sessions on retirement','Browser only'),
      ('owner_request_digest','Identity','HMAC-SHA256','90d; retain tombstone versions','No public password digest'),
      ('owner_recovery_code_pepper','Identity','HMAC-SHA256','90d review; retire after active codes rotate','Outstanding offline codes may be long-lived'),
      ('ops_credential_pepper','OpsIdentity','HMAC-SHA256','90d; revoke admin sessions on retire','No owner use'),
      ('ops_auth_replay_aead','OpsIdentity','AES-256-GCM','90d; old5min horizon','No customer bodies'),
      ('ops_totp_aead','OpsIdentity','AES-256-GCM','90d; reencrypt live factors; old keys until backups retire','Seed restored only in locked recovery, admin reprovision'),
      ('ops_csrf_hmac','OpsIdentity','HMAC-SHA256','90d; rotate admin sessions','No customer use'),
      ('ops_request_digest','OpsIdentity','HMAC-SHA256','90d; preserve replay tombstone versions','Independent material from owner keys'),
      ('service_signature_per_profile','Exact P2 profile','HMAC-SHA256','30d coordinated drain/cutover','No shared key across profiles'),
      ('service_ca','Offline infrastructure custodian','Private CA signing key','Annual review; leaf30d','CA private key never in app containers'),
      ('checkpoint_producer','Recovery coordinator','Ed25519','90d review; public history retained','Deny events only; no finance signing authority'),
      ('checkpoint_witness','Independent witness custodian','Ed25519','90d review; preserve trust-key history','Private key never on finance VM'),
      ('volume_unlock','Infrastructure custodian','LUKS2 key material','Compromise/recovery review','Offline recovery copy; no plaintext same-volume unlock key'),
      ('backup_repository_password','Backup custodian; runtime backup reader','Restic native encrypted repository','90d access review; compromise => new repository','Password change alone is not master-key rotation'),
      ('key_capsule_recipient','Offline owner/infrastructure custodian','age recipient private key','Compromise/recovery review','Private recipient key not in capsule or finance backup'),
      ('apk_release_signing','Offline release custodian','Android signing key','Continuity; platform-specific rotation ARCH10/13','Not the native device key; never generic90d rotation'),
      ('provider_credentials','Exact approved adapter','Provider-specific','Terms/compromise-specific','Inactive/not selected until ARCH11/12 gates'),
    ]
    csvout(S/'key-inventory.csv',[{'keyId':a,'custody':b,'mechanism':c,'rotation':d,'restriction':e,'status':'DESIGN_NOT_PROVISIONED'} for a,b,c,d,e in keys])
    threats=[
      ('TH-01','Cross-tenant/object access','Application auth/object scope+RLS/FX refs','SEC-01,SEC-02'),
      ('TH-02','App-admin reads finance or impersonates','Separate Ops pool/DTO and denied DB grants','SEC-03,SEC-04'),
      ('TH-03','RCE/SQL injection in user API','Patch/parameterization/process hardening; user API compromise may affect multiple tenants','SEC-05,SEC-06'),
      ('TH-04','Worker/Agent privilege escalation','Per-profile grants; typed tickets; no active-plan confirm/actual tools','SEC-07,SEC-08'),
      ('TH-05','Native raw bank data/OTP leakage','Memory filter + normalized allowlist; no server raw capture','SEC-09,SEC-10'),
      ('TH-06','Native key/token loss or account switch','Keystore and owner-bound quarantine; no WebView secrets','SEC-11,SEC-12'),
      ('TH-07','Browser CSRF/XSS/supply-chain script','Cookie/CSRF/CSP/dependency/release tests','SEC-13,SEC-14'),
      ('TH-08','Credential/secret exposure via config/logs','Purpose-isolated files, no VITE/env dumps/traces','SEC-15,SEC-16'),
      ('TH-09','Disk/dump/backup theft or corruption','Encrypted volume/dump/repository/key capsule; restore integrity checks','SEC-17,SEC-18'),
      ('TH-10','Ransomware or source host deletes backups','Off-host append-only writer, offline pruning credential','SEC-19,SEC-20'),
      ('TH-11','Stale restore resurrects deletes/revokes','Independent latest signed deny witness + locked restore','SEC-21,SEC-22'),
      ('TH-12','Crash/ACK/replay ambiguity around security mutation','Deny locally first, anchor before success, exact-key resume','SEC-23,SEC-24'),
      ('TH-13','Retention overrun/unsafe erasure','Hard age cutoff, prune verification, copy inventory','SEC-25,SEC-26'),
      ('TH-14','Provider/model egress or prompt injection','Default-deny per adapter/class and scoped tool registry','SEC-27,SEC-28'),
      ('TH-15','Split-brain restore or environment confusion','Fence old host, pin env/API/schema/policy/key manifests','SEC-29,SEC-30'),
      ('TH-16','Trusted root/provider/DBA sees plaintext','Explicit T1 trust limit, access auditing; no anti-root-Ops claim','SEC-31,SEC-32'),
    ]
    csvout(S/'threat-register.csv',[{'id':a,'threat':b,'control':c,'runtimeCases':d,'residual':'See threat-model.md; not eliminated by a static check','status':'DESIGN_SPECIFIED_RUNTIME_NOT_RUN'} for a,b,c,d in threats])
    ownerclasses={'Accounts':'finance_private','Assistant':'finance_private','Imports':'finance_private','Ingestion':'finance_private','Ledger':'finance_private','Planning':'finance_private','Portfolio':'finance_private','ReadModels':'finance_private','Review':'finance_private','SharedTX':'finance_private','Identity':'identity_private','IdentityAudit':'security_restricted','OpsIdentity':'credential_secret','PlatformSecurity':'security_restricted','Recovery':'recovery_control','Ops':'ops_restricted','SharedJobs':'ops_restricted','Migrations':'security_restricted','Market':'licensed_market'}
    secret_tables={'identities','sessions','identity_challenges','session_credentials','auth_replays','owner_recovery_codes','admin_principals','admin_sessions','admin_mfa_factors','admin_challenges','ops_auth_replays'}
    # Tenant quotes include holding/entitlement references: they are not public catalog data.
    market_private={t['name'] for t in m['tables'] if t['owner']=='Market' and t.get('tenant')}
    control_private={'jobs','job_attempts','scheduler_state','ops_previews','ops_idempotency'}
    table_rows=[]
    for t in m['tables']:
        assert t['owner'] in ownerclasses,t['owner']
        klass='credential_secret' if t['name'] in secret_tables else 'finance_private' if t['name'] in market_private else 'security_restricted' if t['name'] in control_private else ownerclasses[t['owner']]
        table_rows.append({'table':t['name'],'owner':t['owner'],'classification':klass,'storage':'Encrypted PG volume; secret AEAD/digest where defined','opsExposure':'ALLOWLIST_PROJECTION_ONLY' if klass=='ops_restricted' else 'DENY_DIRECT','modelExposure':'SCOPED_APPROVED_TOOL_PROJECTION_ONLY' if klass=='finance_private' else 'DENY','backup':'Encrypted privileged T1 export; locked restore and erasure rules','status':'DESIGN_NOT_GRANTS'})
    csvout(S/'table-data-classification.csv',table_rows)
    api=json.loads((ROOT/'docs/contracts/v2-t1-r2/openapi.json').read_text(encoding='utf-8'))
    op_rows=[]
    for path,item in api['paths'].items():
        o=item['post'];actor=o['x-finweave']['actor']
        op_rows.append({'operation':o['operationId'],'actor':actor,'apiRevision':'FW-API-T1-D1J2-002','responseLog':'DENY_BODY_HEADERS_FILTERS','authority':'ARCH06 operation-permissions.csv','egress':'DEFAULT_DENY_EXCEPT_APPROVED_PROFILE','securityProfile':'FW-SEC-T1-001','runtime':'NOT_RUN'})
    csvout(S/'operation-security-overlay.csv',op_rows)
    policy={'id':'FW-SEC-T1-001','date':'2026-10-09','status':'ACCEPTED_DESIGN_RUNTIME_NOT_RUN','trust':'T1_TRUSTED_SERVER','trustLimits':['trusted infrastructure/root/DBA/backup/key operators can read plaintext','RLS does not contain a compromised owner API with its DB authority','no zero-loss/HA or immediate crypto-erasure claim'],'apiRevision':'FW-API-T1-D1J2-002','apiSha256':sha(ROOT/'docs/contracts/v2-t1-r2/openapi.json'),'database':m['id'],'frontendMutation':False,'realEnabled':False,'logs':{'allowed':['requestId','operationClass','statusClass','safeCode','latencyBucket','workerProfile','attemptBucket','releaseId','environmentId'],'forbidden':['body','headers','token','password','bankOTP','rawNotification','amount','balance','quantity','accountRef','email','prompt','sqlParameters','privateURL'],'retentionDays':30},'backup':{'tool':'restic','databaseExport':'pg_dump custom consistent logical export; global role manifest reconstructed separately','repository':'Off-host append-only authenticated TLS rest-server; exact destination not provisioned','writerCanDelete':False,'normalSchedule':'daily','dailyCount':7,'weeklyCount':4,'snapshotHardMaxAgeDays':34,'unreferencedPackPurgeMaxHours':24,'erasureMaxDaysFromRequest':35,'rpoHoursTarget':24,'rtoHoursTarget':24,'measured':False},'checkpoint':{'independent':True,'denyOnly':True,'successRequiresDurableAnchor':True,'latestHeadRequiresFreshNonce':True,'publicFinancePayloadAllowed':False,'minRetentionDays':90,'retainUntilAllCopiesExpired':True,'witnessProvisioned':False},'restore':{'state':'LOCKED_UNTIL_RECONCILED','oldHostMustBeFenced':True,'invalidateAllSessionsTokensChallengesRecoveryCodes':True,'requireFreshOwnerPasswordReset':True,'reactivateOldAuthReplay':False},'egress':{'default':'DENY','profiles':['licensed_market','auth_mail','approved_inference','encrypted_backup','recovery_witness'],'externalLLMFinanceDefault':False,'bankRawAnywhere':False},'gates':['SEC-REAL-T1','AUTH-MAIL-REAL','GATE-NATIVE','GATE-SOURCE','GATE-AGENT','GATE-RESTORE'],'runtimeCases':32}
    dump(S/'security-policy.json',policy)
    # Strict metadata schemas: private opaque target identifiers, never arbitrary finance metadata.
    token={'type':'string','pattern':'^[A-Za-z0-9_-]{43}$'};ident={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'};digest={'type':'string','pattern':'^[a-f0-9]{64}$'}
    eventprops={'profile':{'const':'FW-RECOVERY-EVENT-001'},'eventId':ident,'environmentId':ident,'scopeKind':{'enum':['identity','workspace','device']},'targetToken':token,'epoch':{'type':'integer','minimum':1,'maximum':9007199254740991},'kind':{'enum':['identity_revoke','workspace_erase','identity_erase','device_revoke']},'createdAt':{'type':'string','format':'date-time'},'producerKeyId':ident}
    event={'$schema':'https://json-schema.org/draft/2020-12/schema','type':'object','additionalProperties':False,'properties':eventprops,'required':list(eventprops),'allOf':[{'if':{'properties':{'kind':{'enum':['identity_revoke','identity_erase']}}},'then':{'properties':{'scopeKind':{'const':'identity'}}}},{'if':{'properties':{'kind':{'const':'workspace_erase'}}},'then':{'properties':{'scopeKind':{'const':'workspace'}}}},{'if':{'properties':{'kind':{'const':'device_revoke'}}},'then':{'properties':{'scopeKind':{'const':'device'}}}}]}
    receiptprops={'profile':{'const':'FW-WITNESS-RECEIPT-001'},'environmentId':ident,'eventId':ident,'eventDigest':digest,'sequence':{'type':'integer','minimum':1,'maximum':9007199254740991},'previousRecordHash':digest,'recordHash':digest,'witnessKeyId':ident,'storedAt':{'type':'string','format':'date-time'},'signature':{'type':'string','pattern':'^[A-Za-z0-9_-]{86}$'}}
    receipt={'$schema':'https://json-schema.org/draft/2020-12/schema','type':'object','additionalProperties':False,'properties':receiptprops,'required':list(receiptprops)}
    headprops={'profile':{'const':'FW-WITNESS-HEAD-001'},'environmentId':ident,'sequence':{'type':'integer','minimum':0,'maximum':9007199254740991},'recordHash':digest,'challengeNonce':token,'issuedAt':{'type':'string','format':'date-time'},'witnessKeyId':ident,'signature':{'type':'string','pattern':'^[A-Za-z0-9_-]{86}$'}}
    head={'$schema':'https://json-schema.org/draft/2020-12/schema','type':'object','additionalProperties':False,'properties':headprops,'required':list(headprops)}
    dump(S/'recovery-event.schema.json',event);dump(S/'witness-receipt.schema.json',receipt);dump(S/'witness-head.schema.json',head)
    dump(S/'implementation-bundle.json',{'id':'FW-SECURITY-BUNDLE-20261009','status':'DESIGN_ONLY','apiRevision':policy['apiRevision'],'apiSha256':policy['apiSha256'],'securityProfile':policy['id'],'securityPolicySha256':sha(S/'security-policy.json'),'databaseRevision':m['id'],'databaseModelSha256':sha(D/'target-model.json'),'previousAPINotRewritten':True,'previousDBNotRewritten':True,'runtime':'NOT_RUN'})
    print(json.dumps({'tables':len(m['tables']),'columns':sum(len(t['columns']) for t in m['tables']),'foreignKeys':len(m['foreignKeys']),'tableClassifications':len(table_rows),'operations':len(op_rows),'keys':len(keys),'threats':len(threats)}))
if __name__=='__main__':main()
