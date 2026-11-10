"""Build ARCH-06 design artifacts only. Prior API/DB packages are read-only."""
from pathlib import Path
import copy,csv,hashlib,json

ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/contracts/v2-t1-r2'
DB=ROOT/'docs/data/target-t1-auth'
SEC=ROOT/'docs/security/identity'
REV='FW-API-T1-D1J2-002'
def dump(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def obj(p):return {'type':'object','properties':p,'required':list(p),'additionalProperties':False}
def nullable(s):return {'anyOf':[s,{'type':'null'}]}
ID={'type':'string','pattern':'^[A-Za-z0-9_-]{1,80}$'}
SECRET={'type':'string','pattern':'^[A-Za-z0-9_-]{43}$','x-sensitive':True}
TIME={'type':'string','format':'date-time','maxLength':64}
BOOL={'type':'boolean'}
PASSWORD={'type':'string','minLength':15,'maxLength':128,'writeOnly':True,'x-sensitive':True}
CODE={'type':'string','pattern':'^[0-9]{6}$','writeOnly':True,'x-sensitive':True}

def main():
    for p in [OUT,DB,SEC]:p.mkdir(parents=True,exist_ok=True)
    source=ROOT/'docs/contracts/v2-t1/openapi.json'
    doc=json.loads(source.read_text(encoding='utf-8'));old=copy.deepcopy(doc)
    s=doc['components']['schemas'];ops={v['post']['operationId']:(p,v['post']) for p,v in doc['paths'].items()}
    def replace_rev(v):
        if isinstance(v,dict):return {k:replace_rev(x) for k,x in v.items()}
        if isinstance(v,list):return [replace_rev(x) for x in v]
        if isinstance(v,str):return v.replace('FW-API-T1-D1J2-001',REV)
        return v
    doc=replace_rev(doc);s=doc['components']['schemas'];ops={v['post']['operationId']:(p,v['post']) for p,v in doc['paths'].items()}
    doc['info']['title']='FinWeave API v2 — T1 identity revision 002 (unreleased)'
    doc['info']['description']='ARCH-06 current working target. Prior revision001 is retained unchanged. Backend/native/auth implementation NOT RUN; no compatibility by contractVersion label alone.'
    doc['x-finweave-revision'].update(id=REV,supersedesWorkingTarget='docs/contracts/v2-t1/openapi.json',baselineSha256=sha(source))
    for name in ['signIn','registerIdentity','resetIdentityPassword','adminSignIn']:
        for key in ['password','passwordConfirmation']:
            if key in s[name+'Input']['properties']:s[name+'Input']['properties'][key]=copy.deepcopy(PASSWORD)
    for name in ['signIn','registerIdentity']:
        s[name+'Input']['properties']['installationPublicKey']=nullable({'type':'string','minLength':40,'maxLength':512,'description':'base64url DER SPKI P-256; required non-null for X-FW-Client=android; web must send null'})
        s[name+'Input']['required'].append('installationPublicKey')
        s[name+'Output']['properties']['nonce']=copy.deepcopy(SECRET)
        s[name+'Output']['properties']['channel']={'const':'email'}
        s[name+'Output']['required']+=['nonce','channel']
    for name in ['verifyIdentityChallenge','renewSession','verifyNativeIdentityChallenge','renewNativeSession']:
        session=s[name+'Output']['properties']['session']
        session['properties']['deviceId']=nullable(copy.deepcopy(ID))
        session['properties']['deviceId']['description']='Legacy transport field: installation/client ID or null for browser; NOT collector device FK or upload permission.'
    s['resetIdentityPasswordInput']['properties']['resetToken']=copy.deepcopy(SECRET)
    s['getSessionOutput']['properties']['deviceId']=nullable(copy.deepcopy(ID))
    s['getSessionOutput']['properties']['deviceId']['description']='Auth installation identifier for native, null for browser; never collector device authority.'
    for name in ['requestDeviceEnrollment','requestCollectorCredentialChallenge']:
        s[name+'Output']['properties']['nonce']=copy.deepcopy(SECRET)
    s['issueCollectorCredentialOutput']['properties']['authorizedUntil']=copy.deepcopy(TIME)
    s['issueCollectorCredentialOutput']['required'].append('authorizedUntil')
    s['registerDeviceInput']['properties']['publicKey'].update(description='base64url DER SPKI P-256, canonical digest SHA256 decoded DER; strict DER parser and curve check required')
    s['registerDeviceInput']['properties']['proof'].update(pattern='^[A-Za-z0-9_-]{86}$',description='ES256 signature raw r||s (64 bytes) base64url, NOT ASN.1 DER')
    s['issueCollectorCredentialInput']['properties']['proof'].update(pattern='^[A-Za-z0-9_-]{86}$',description='ES256 raw r||s signature on identity protocol transcript')
    new=[
      ('requestOwnerReauthentication','owner-session',obj({'password':PASSWORD}),obj({'challengeId':ID,'nonce':SECRET,'expiresAt':TIME,'channel':{'const':'email'}}),['identities','sessions','identity_challenges','auth_rate_buckets']),
      ('verifyOwnerReauthentication','owner-session',obj({'challengeId':ID,'code':CODE}),obj({'reauthenticatedUntil':TIME}),['identities','sessions','identity_challenges','auth_replays']),
      ('adminReauthenticate','admin',obj({'password':PASSWORD,'mfaCode':CODE}),obj({'reauthenticatedUntil':TIME}),['admin_principals','admin_sessions','admin_mfa_factors','ops_auth_replays','ops_auth_rate_buckets']),
      ('rotateOwnerRecoveryCodes','owner-session',obj({}),obj({'codes':{'type':'array','items':SECRET,'minItems':10,'maxItems':10,'uniqueItems':True},'generatedAt':TIME}),['identities','sessions','owner_recovery_codes','auth_replays']),
      ('redeemOwnerRecoveryCode','pre-auth',obj({'email':copy.deepcopy(s['signInInput']['properties']['email']),'recoveryCode':SECRET}),obj({'resetToken':SECRET,'expiresAt':TIME}),['identities','identity_challenges','owner_recovery_codes','auth_replays','auth_rate_buckets']),
      ('renewCollectorCredential','device-renew',obj({'deviceId':ID,'deviceEpoch':{'type':'integer','minimum':0},'recoveryEpoch':{'type':'integer','minimum':0}}),obj({'deviceId':ID,'token':SECRET,'expiresAt':TIME,'authorizedUntil':TIME,'deviceEpoch':{'type':'integer','minimum':0},'recoveryEpoch':{'type':'integer','minimum':0}}),['identities','devices','session_credentials','auth_replays','collector_proof_nonces']),
    ]
    for name,actor,inp,out,tables in new:
        template='adminSignIn' if actor=='admin' else 'signIn'
        operation=copy.deepcopy(ops[template][1]);operation['operationId']=name;operation['summary']=name
        operation['security']=([{'AdminCookie':[]}] if actor=='admin' else [{'DeviceRenewalBearer':[]}] if actor=='device-renew' else [{'OwnerCookie':[]},{'OwnerBearer':[]}] if actor=='owner-session' else [])
        for suffix,value in [('Input',inp),('Output',out)]:s[name+suffix]=copy.deepcopy(value)
        for suffix in ['Request','Reply']:
            value=copy.deepcopy(s[template+suffix])
            if suffix=='Request':value['properties']['operationId']={'const':name}
            field='input' if suffix=='Request' else 'result'
            # Original reply uses output rather than result; discover rather than guess.
            if suffix=='Reply':field=next(k for k,v in value['properties'].items() if isinstance(v,dict) and v.get('$ref','').endswith(template+'Output'))
            value['properties'][field]={'$ref':'#/components/schemas/'+name+('Input' if suffix=='Request' else 'Output')}
            s[name+suffix]=value
        if actor=='device-renew':
            s[name+'Request']['properties']['workspaceId']=copy.deepcopy(ID)
            s[name+'Reply']['properties']['workspaceVersion']={'type':'null'}
        operation['requestBody']['content']['application/json']['schema']={'$ref':'#/components/schemas/'+name+'Request'}
        operation['responses']['200']['content']['application/json']['schema']={'$ref':'#/components/schemas/'+name+'Reply'}
        operation['parameters']=[p for p in operation.get('parameters',[]) if p.get('name')!='X-FW-Client']
        meta=operation['x-finweave'];meta.update(actor=actor,module='OpsIdentity' if actor=='admin' else 'Identity',persistenceTables=tables,contractRevision=REV,kind='mutation',authorization='identity-access-design.md and operation-permissions.csv; current identity/epoch + purpose + fresh reauth where required; never finance/admin impersonation')
        path='/v2/'+('admin' if actor=='admin' else 'identity')+'/'+name
        doc['paths'][path]={'post':operation};ops[name]=(path,operation)
    # Credentials and anti-CSRF names are purpose-specific and host-only.
    sec=doc['components']['securitySchemes']
    sec['OwnerCookie']['name']='__Host-fw_session';sec['AdminCookie']['name']='__Host-fw_admin_session'
    sec['DeviceRenewalBearer']={'type':'http','scheme':'bearer','description':'Collector credential accepted only by renewCollectorCredential with collector-key proof and live30day authorization. Expired access<=7days may be renewal-only authority, never ingest/reconcile authority. Rotation replay rules apply.'}
    fresh={'requestDeviceEnrollment','registerDevice','requestCollectorCredentialChallenge','issueCollectorCredential','rotateOwnerRecoveryCodes'}
    for name in ops:
        if any(term in name.lower() for term in ['erase','export']):fresh.add(name)
    rows=[]
    for name,(path,o) in ops.items():
        actor=o['x-finweave']['actor'];is_native=name in ['verifyNativeIdentityChallenge','renewNativeSession','requestDeviceEnrollment','registerDevice','requestCollectorCredentialChallenge','issueCollectorCredential']
        if name=='requestDeviceEnrollment' or name=='registerDevice':
            o['security']=[{'OwnerBearer':[]}]
        if is_native:
            o.setdefault('parameters',[]).append({'name':'X-FW-Native-Proof','in':'header','required':True,'schema':{'type':'string','minLength':20,'maxLength':2048},'description':'base64url RFC8785 proof JSON + dot + ES256 raw signature; bound installation key, token digest (except first verify), body digest, purpose, path, timestamp and one-use nonce; identity protocol defines exact transcript'})
        if name=='renewCollectorCredential':
            o.setdefault('parameters',[]).append({'name':'X-FW-Collector-Proof','in':'header','required':True,'schema':{'type':'string','minLength':20,'maxLength':2048},'description':'Same proof claims format as native protocol, but bound collector key/device/epochs and renewCollectorCredential purpose; no owner access/refresh accepted.'})
        csrf=any('OwnerCookie' in a or 'AdminCookie' in a for a in o.get('security',[])) and o['x-finweave'].get('kind')=='mutation'
        if csrf and not any(p.get('name')=='X-FW-CSRF' for p in o.get('parameters',[])):
            o.setdefault('parameters',[]).append({'name':'X-FW-CSRF','in':'header','required':False,'schema':{'type':'string','minLength':32,'maxLength':512},'description':'Mandatory for cookie authority; forbidden as cookie fallback for native bearer; conditional rule enforced by server.'})
        o['x-finweave']['identityPolicy']={'currentEpoch':True,'csrfIfCookieMutation':csrf,'freshReauth':name in fresh or (actor=='admin' and o['x-finweave'].get('kind')=='mutation' and name not in ['adminSignOut','adminReauthenticate']),'installationProof':is_native,'policyDocument':'docs/security/identity/identity-access-design.md'}
        if actor in ['owner','owner-session','native-refresh','pre-auth']:
            o['x-finweave']['persistenceTables']=sorted(set(o['x-finweave'].get('persistenceTables',[]))|{'identities','sessions','session_credentials','auth_replays','auth_rate_buckets'})
        if actor.startswith('admin'):
            o['x-finweave']['persistenceTables']=sorted(set(o['x-finweave'].get('persistenceTables',[]))|{'admin_principals','admin_sessions','ops_auth_replays','ops_auth_rate_buckets'})
        if actor in ['device','device-renew']:o['x-finweave']['persistenceTables']=sorted(set(o['x-finweave']['persistenceTables'])|{'session_credentials'})
        rows.append({'operation':name,'path':path,'actor':actor,'security':json.dumps(o.get('security',[]),separators=(',',':')),'cookieMutationCSRF':csrf,'freshReauth':o['x-finweave']['identityPolicy']['freshReauth'],'installationProof':is_native,'collectorProof':name=='renewCollectorCredential','objectScope':'principal-derived + nested tenant/object checks; global identity/Ops has null workspace context','runtime':'NOT_RUN'})
    dump(OUT/'openapi.json',doc)
    dump(OUT/'schemas.json',{'$schema':'https://json-schema.org/draft/2020-12/schema','components':{'schemas':s}})
    changed=[n for n in old['components']['schemas'] if old['components']['schemas'][n]!=s[n]]
    dump(OUT/'revision-diff.json',{'from':'FW-API-T1-D1J2-001','to':REV,'addedOperations':[r[0] for r in new],'changedSchemas':changed,'changedWirePolicies':['host-prefixed cookies','15-character passwords','installationPublicKey and nonce/channel','native proof header','native-only collector enrollment','5 reauth/recovery operations plus collector-key renewal'],'published':False})
    dump(OUT/'revision.json',{'revision':REV,'contractVersion':'2.0.0','status':'ACCEPTED_DESIGN_NOT_IMPLEMENTED','openapiSha256':sha(OUT/'openapi.json'),'previousOpenapiSha256':sha(source),'operations':len(ops),'schemas':len(s),'permissionRows':len(rows),'previous':'../v2-t1/revision.json'})
    with (SEC/'operation-permissions.csv').open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
    # Complete inherited model + explicit expand delta; baseline declarations remain historical.
    m=json.loads((ROOT/'docs/data/target-t1/target-model.json').read_text(encoding='utf-8'))
    m['id']='FW-PHYS-T1-AUTH-002';m['status']='EXPAND_DESIGN_SQL_NOT_RUN';m['previousSha256']=sha(ROOT/'docs/data/target-t1/target-model.json')
    m['warning']='Inherited baselineDeclaration is historical. targetRules/identityDelta and migration-plan.md supersede old checks after cutover. No executable migration or runtime SQL validation.'
    by={t['name']:t for t in m['tables']};delta=[]
    def columns(table,spec,rules):
        t=by[table];added=[]
        for n,typ,null,meaning in spec:
            assert n not in {c['name'] for c in t['columns']},(table,n)
            t['columns'].append({'name':n,'type':typ,'nullable':null,'meaning':meaning,'stage':'ARCH06_EXPAND'});added.append(n)
        t.setdefault('targetRules',[]).extend(rules);delta.append({'table':table,'addedColumns':added,'targetRules':rules})
    columns('identities',[
      ('auth_epoch','bigint',False,'Monotonic all-session revocation fence'),('email_verified_at','timestamptz',True,'Email verification, not MFA assurance')],
      ['auth_epoch>=0','State expands to pending_verification active suspended deleted; pending registration cannot access workspaces','Only password PHC Argon2id hash in credential_hash; admin authority prohibited'])
    columns('sessions',[
      ('kind','text',False,'browser or native'),('installation_id','text',True,'Native auth client, NOT collector device'),('auth_epoch','bigint',False,'Identity epoch at issue'),('last_user_activity_at','timestamptz',False,'Meaningful user activity; polling/renew do not extend idle'),('absolute_expires_at','timestamptz',False,'Browser12h/native30d fixed family limit'),('reauthenticated_at','timestamptz',True,'Fresh password+email challenge'),('refresh_generation','bigint',False,'Monotonic native rotation generation'),('csrf_key_ref','text',True,'Session-bound CSRF key reference, browser only'),('revoke_reason','text',True,'Safe enum only')],
      ['role=owner only; no legacy admin session migrated into customer authority','kind=native iff installation_id IS NOT NULL; sessions.device_id deprecated legacy alias, never FK to collector','Unique(id,subject_id); last_user_activity_at<=absolute_expires_at; generation>=0','Legacy token_digest no longer authorization for native; all legacy sessions revoked at cutover'])
    columns('identity_challenges',[
      ('flow_purpose','text',False,'signin_web signin_native register_web register_native reset reauth enrollment collector_token'),('bound_session_id','text',True,'Owner reauth/enrollment/collector only'),('client_key_digest','text',True,'Installation or collector key transcript binding'),('nonce_digest','text',False,'256-bit challenge nonce digest'),('nonce_value','text',False,'Public base64url nonce to reconstruct collector proof transcript; NOT OTP/reset/bearer'),('auth_epoch','bigint',True,'Subject epoch at issue'),('workspace_id','text',True,'Enrollment/collector exact workspace'),('device_id','text',True,'Existing collector device if issuing token'),('device_epoch','bigint',True,'Exact live collector epoch'),('recovery_epoch','bigint',True,'Exact workspace epoch'),('state','text',False,'pending consumed expired locked')],
      ['purpose legacy enum expands collector_token and reauth; flow_purpose controls verifier and channel','5 attempts maximum,5min expiry; reset high-entropy token15min; consume+session issue/epoch update atomic','bound_session_id references sessions; scoped collector device FK(workspace_id,device_id); subject owner match verified under lock'])
    columns('devices',[
      ('signing_algorithm','text',False,'ES256/P-256'),('public_key_format','text',False,'base64url DER SPKI'),('credential_epoch','bigint',False,'Collector token generation fence'),('installation_id','text',False,'Enrolling native owner installation'),('authorized_until','timestamptz',False,'30days owner-approved collector authority; renewal cannot extend')],
      ['Stored public_key validated SPKI P-256; key_digest=SHA256 decoded DER; no arbitrary PEM/key type','device revoke increments credential_epoch and owner_epoch; session_credentials owner/workspace/device must match devices'])
    columns('admin_principals',[('password_hash','text',False,'PHC Argon2id, separate customer credential domain')],['mfa_required=true; no owner identity FK/grants; auth_ref controlled local identifier, not automatic external IdP'])
    columns('admin_sessions',[
      ('last_user_activity_at','timestamptz',False,'Idle15min'),('absolute_expires_at','timestamptz',False,'Fixed4h'),('csrf_key_ref','text',False,'Ops CSRF binding'),('reauthenticated_at','timestamptz',False,'Latest password+TOTP'),('revoke_reason','text',True,'Safe enum')],['UNIQUE(id,principal_id); epoch/current active MFA checked each request'])
    columns('admin_mfa_factors',[('key_version','text',False,'AEAD envelope key id'),('secret_ciphertext','bytea',False,'AES-256-GCM seed envelope with unique nonce/tag/AAD')],['method=totp_sha1_6_30; counter is largest accepted RFC6238 time-step, transactional compare/update; decrypt OpsIdentity only'])
    common=[('id','text',False,'Opaque record id'),('created_at','timestamptz',False,'UTC server creation')]
    def table(name,owner,spec,rules,retention):
        t={'name':name,'owner':owner,'tenant':False,'stage':'ARCH06_NEW_DESIGN','columns':[{'name':n,'type':typ,'nullable':null,'meaning':meaning} for n,typ,null,meaning in common+spec],'rules':['PRIMARY KEY(id)']+rules,'retention':retention};m['tables'].append(t);by[name]=t;delta.append({'table':name,'new':True,'targetRules':t['rules']})
    table('auth_client_instances','Identity',[
      ('subject_id','text',False,'Owner after successful native verify'),('public_key_spki','text',False,'Native P-256 signing public key'),('key_digest','text',False,'SHA256 decoded SPKI'),('state','text',False,'active revoked'),('auth_epoch','bigint',False,'Subject epoch'),('revoked_at','timestamptz',True,'Revoked instance')],['UNIQUE(id,subject_id)','UNIQUE(subject_id,key_digest)','State/revoked_at coherent; key possession at first verify; no financial/collector authority'], 'Active owner lifecycle; revoked30d subject to erasure')
    table('session_credentials','Identity',[
      ('subject_id','text',False,'Owner principal'),('session_id','text',True,'Browser/native family; null for collector'),('workspace_id','text',True,'Collector workspace only'),('device_id','text',True,'Collector device only'),('audience','text',False,'owner_access owner_refresh collector'),('token_digest','text',False,'HMAC-SHA256 purpose-separated pepper'),('key_version','text',False,'Digest pepper version'),('generation','bigint',False,'Native rotation or collector issue generation'),('auth_epoch','bigint',False,'Identity epoch'),('device_epoch','bigint',True,'Collector capture epoch'),('recovery_epoch','bigint',True,'Collector restore fence'),('expires_at','timestamptz',False,'Access15m,refresh fixed30d,collector24h'),('consumed_at','timestamptz',True,'Refresh/collector previous token marker'),('revoked_at','timestamptz',True,'Revocation'),('rotation_key_digest','text',True,'Original idempotency key binding for exact lost-response replay')],['UNIQUE(key_version,audience,token_digest)','UNIQUE(session_id,audience,generation) for owner credentials','UNIQUE(workspace_id,device_id,audience,generation) for collector credentials','Exactly collector branch has workspace/device/epochs and null session_id; owner branches inverse','Composite FK(session_id,subject_id) and collector owner match by checked transaction; random token32bytes'], 'Refresh used-token digests through family expiry+30d; no secret tokens; collector expired metadata30d')
    replay_spec=[('principal_id','text',False,'Customer subject or resolved preauth challenge principal'),('authority_ref','text',False,'Session/challenge/credential family ID'),('operation_id','text',False,'Allowed auth operation'),('key_digest','text',False,'HMAC idempotency key'),('input_digest','text',False,'Keyed semantic digest; no public password digest'),('response_ciphertext','bytea',True,'Short AEAD response only; wipe after5min'),('key_version','text',False,'AEAD key version'),('expires_at','timestamptz',False,'Body horizon max5min'),('committed_at','timestamptz',False,'Atomic command commit'),('revoked_at','timestamptz',True,'Revocation fences even retained body')]
    table('auth_replays','Identity',replay_spec,['UNIQUE(principal_id,authority_ref,operation_id,key_digest)','Owner API only; no generic90day result payload; AEAD AAD includes scope/op/key/epoch'], 'Encrypted body5min; digest tombstone through authority expiry+30d; never restore old credentials')
    table('ops_auth_replays','OpsIdentity',replay_spec,['UNIQUE(principal_id,authority_ref,operation_id,key_digest)','Ops process only; no customer rows; no customer FK'], 'Encrypted body5min; tombstone until admin authority expiry+30d')
    rate_spec=[('bucket_digest','text',False,'HMAC login/IP-prefix+purpose; no raw PII'),('purpose','text',False,'Bounded allowed operation class'),('window_start','timestamptz',False,'Server time bucket'),('attempts','integer',False,'Atomic bounded attempts'),('blocked_until','timestamptz',True,'Bounded throttle not permanent account lock')]
    table('auth_rate_buckets','Identity',rate_spec,['UNIQUE(bucket_digest,purpose,window_start)','Atomic counter; minimum limit enforced across API replicas; fail closed if unavailable'], 'Expiry24h; rotating HMAC key/version supplied through purpose namespace')
    table('ops_auth_rate_buckets','OpsIdentity',rate_spec,['UNIQUE(bucket_digest,purpose,window_start)','Ops counters/credentials separate; fail closed'], 'Expiry24h')
    table('owner_recovery_codes','Identity',[
      ('subject_id','text',False,'Owner only'),('batch_id','text',False,'Current code batch'),('code_digest','text',False,'HMAC 256-bit single-use code; no plaintext'),('key_version','text',False,'Pepper version'),('consumed_at','timestamptz',True,'Atomic redeem'),('revoked_at','timestamptz',True,'Rotation invalidates all previous codes')],['UNIQUE(key_version,code_digest)','10 codes per active batch; rotate requires fresh owner reauth; code alone is powerful recovery secret'], 'Until used/revoked or owner erasure; consumed metadata30d')
    table('service_principals','PlatformSecurity',[
      ('name','text',False,'Per-profile stable identity'),('certificate_fingerprint','text',False,'Pinned SHA256 leaf certificate'),('signature_key_ref','text',False,'HMAC-SHA256 key outside DB, per principal'),('capabilities','text[]',False,'Server registered job types only'),('auth_epoch','bigint',False,'Revoke fence'),('expires_at','timestamptz',False,'Cert/key lifecycle'),('revoked_at','timestamptz',True,'Revoke')],['UNIQUE(name)','Ops/API/worker profile is not caller-supplied role; private TLS authenticated; no secrets in table'], 'Revoked principal audit30d; rotation history outside live grants')
    table('service_nonces','PlatformSecurity',[
      ('principal_id','text',False,'Same mTLS+signature principal'),('nonce_digest','text',False,'SHA256 256-bit nonce'),('expires_at','timestamptz',False,'Retain minimum5min')],['UNIQUE(principal_id,nonce_digest)','Atomic insert before acceptance; bounded clock skew60s; replays denied'], '5min minimum and clock-skew horizon; unavailable => reject')
    table('native_proof_nonces','Identity',[
      ('installation_id','text',False,'Authenticated client instance'),('nonce_digest','text',False,'SHA256 256-bit nonce'),('expires_at','timestamptz',False,'Retain minimum5min')],['UNIQUE(installation_id,nonce_digest)','First native verify uses one-time identity challenge before instance exists; subsequent proofs use this store','Separate from service nonce privileges'], '5min minimum and clock-skew horizon; unavailable => reject')
    table('collector_proof_nonces','Identity',[
      ('workspace_id','text',False,'Collector workspace'),('device_id','text',False,'Collector device'),('nonce_digest','text',False,'SHA256 nonce'),('expires_at','timestamptz',False,'Minimum5min')],['UNIQUE(workspace_id,device_id,nonce_digest)','Scoped collector proof store, not owner/service nonce authority'], '5min minimum and clock-skew horizon; unavailable => reject')
    table('security_audit_events','IdentityAudit',[
      ('principal_token','text',True,'Opaque pseudonymous subject'),('event_kind','text',False,'Allowlisted authentication/revocation/recovery enum'),('actor_kind','text',False,'owner admin service infra'),('correlation_id','text',False,'Opaque request ID'),('reason_code','text',False,'Allowlisted code'),('authority_epoch','bigint',True,'Fence number')],['Append-only narrow writer, no finance/email/IP/code/secret/body fields','Ops reads aggregate/sanitized subset only; no user session tracking query'], '180d proposed with erasure policy; independent recovery checkpoint separate')
    # Explicit FK additions; polymorphic nonce principal is intentionally verified by registry, not a false FK.
    def fk(t,c,target,tc,optional=False):m['foreignKeys'].append({'table':t,'columns':c,'target':target,'targetColumns':tc,'optional':optional,'origin':'arch06-design'})
    fk('auth_client_instances',['subject_id'],'identities',['id'])
    fk('sessions',['installation_id','subject_id'],'auth_client_instances',['id','subject_id'],True)
    fk('session_credentials',['subject_id'],'identities',['id'])
    fk('session_credentials',['session_id','subject_id'],'sessions',['id','subject_id'],True)
    fk('session_credentials',['workspace_id','device_id'],'devices',['workspace_id','id'],True)
    fk('owner_recovery_codes',['subject_id'],'identities',['id'])
    fk('identity_challenges',['bound_session_id'],'sessions',['id'],True)
    fk('identity_challenges',['workspace_id','device_id'],'devices',['workspace_id','id'],True)
    fk('native_proof_nonces',['installation_id'],'auth_client_instances',['id'])
    fk('collector_proof_nonces',['workspace_id','device_id'],'devices',['workspace_id','id'])
    fk('devices',['installation_id','owner_id'],'auth_client_instances',['id','subject_id'])
    fk('service_nonces',['principal_id'],'service_principals',['id'])
    dump(DB/'target-model.json',m);dump(DB/'identity-delta.json',{'previousModelSha256':m['previousSha256'],'status':'DESIGN_NOT_SQL','changes':delta})
    with (DB/'table-inventory.csv').open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=['table','owner','columns','stage']);w.writeheader();w.writerows({'table':t['name'],'owner':t['owner'],'columns':len(t['columns']),'stage':t['stage']} for t in m['tables'])
    lines=['# Identity target data dictionary','', 'Inherited declarations are historical, not executable target DDL. All SQL/migration checks NOT RUN.','']
    for change in delta:
        t=by[change['table']];lines+=['## '+t['name'],'','Owner: '+t['owner']+'.','', '| Column | Type | Null | Meaning |','| --- | --- | --- | --- |']
        selected=t['columns'] if change.get('new') else [c for c in t['columns'] if c['name'] in change['addedColumns']]
        lines += [f"| {c['name']} | {c['type']} | {c['nullable']} | {c['meaning']} |" for c in selected]
        lines+=['']+['- '+r for r in change['targetRules']]+['']
    (DB/'data-dictionary.md').write_text('\n'.join(lines)+'\n',encoding='utf-8')
    erd=['erDiagram']
    for f in m['foreignKeys']:
        if f.get('origin')=='arch06-design':erd.append('  '+f['target']+' ||--o{ '+f['table']+' : '+ '_'.join(f['columns']))
    (DB/'identity-erd.mmd').write_text('\n'.join(erd)+'\n',encoding='utf-8')
    dump(DB/'revision.json',{'id':m['id'],'status':m['status'],'tables':len(m['tables']),'columns':sum(len(t['columns']) for t in m['tables']),'foreignKeys':len(m['foreignKeys']),'newTables':sum(bool(d.get('new')) for d in delta),'changedTables':len(delta),'targetModelSha256':sha(DB/'target-model.json')})
    print(json.dumps({'apiOperations':len(ops),'schemas':len(s),'changedSchemas':len(changed),'dbTables':len(m['tables']),'dbColumns':sum(len(t['columns']) for t in m['tables']),'newTables':sum(bool(d.get('new')) for d in delta)}))

if __name__=='__main__':main()
