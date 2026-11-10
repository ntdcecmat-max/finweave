"""Build ARCH-04 expand-design documentation only; never emits or executes SQL.

Reads frozen physical inputs; writes only docs/data/target-t1 generated artifacts.
Handwritten migration/permission/invariant documents remain independent.
"""
from pathlib import Path
import csv
import hashlib
import json
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/data/target-t1'
BASE = ROOT / 'docs/data/physical/physical-model.json'
SQL = ROOT / 'docs/data/physical/migrations/001_synthetic_tables.sql'

OWNERS = {
    'Identity': 'identities workspaces sessions identity_challenges devices',
    'Accounts': 'accounts',
    'Ledger': 'ledger_accounts events entry_groups posting_lines cash_observations',
    'Portfolio': 'holdings holding_movements',
    'Market': 'instruments gold_profiles provider_entitlements quote_observations refresh_jobs',
    'Ingestion': 'sources evidence event_evidence source_records collector_bindings ingestion_receipts receipt_evidence coverage_gaps',
    'Imports': 'import_previews import_jobs',
    'Review': 'reviews',
    'Planning': 'financial_plans plan_items actual_links goals plan_goal_links goal_allocations simulations planning_drafts',
    'ReadModels': 'snapshots',
    'Assistant': 'conversations messages agent_runs tool_results',
    'Ops': 'ops_accounts ops_sources ops_jobs ops_quotas ops_releases ops_incidents ops_previews ops_idempotency ops_audit',
    'SharedTX': 'version_history proposal_previews idempotency_records',
}
OWNER = {t: o for o, names in OWNERS.items() for t in names.split()}

def fields(spec):
    result = []
    for item in spec.split(';'):
        name, typ, meaning = item.strip().split('|', 2)
        nullable = name.endswith('?')
        result.append(dict(name=name.rstrip('?'), type=typ, nullable=nullable, meaning=meaning))
    return result

def table(name, owner, tenant, spec, rules, retention):
    common = ('workspace_id|text|Owner workspace;' if tenant else '') + 'id|text|Opaque stable ID;created_at|timestamptz|Server UTC creation time;'
    return dict(name=name, owner=owner, tenant=tenant, stage='NEW_DESIGN', columns=fields(common+spec), rules=rules, retention=retention)

NEW = [
    table('jobs','SharedJobs',True,
          'job_type|text|Registered worker capability;domain_kind|text|Registered domain reference type;domain_id|text|Domain record in this workspace;dedupe_key|text|Business dispatch identity;state|text|queued running succeeded failed cancelled;next_attempt_at|timestamptz|UTC due time;lease_until?|timestamptz|Claim expiry;lease_token?|text|Unpredictable claim token;generation|bigint|Monotonic fencing counter;attempt_count|integer|Started attempts;max_attempts|integer|Bounded retry limit;cancel_requested|boolean|Cooperative cancellation;recovery_epoch|bigint|Workspace restore fence;updated_at|timestamptz|Last dispatcher transition',
          ['PK(workspace_id,id)','UNIQUE(workspace_id,job_type,dedupe_key)','generation>=0; 0<=attempt_count<=max_attempts; max_attempts>0','Lease fields both present iff running; bounded counters','domain reference validated by typed registry in same UnitOfWork; no arbitrary JSON payload'],
          'Keep dispatch tombstone through business replay horizon; no finance/prompt/raw notification'),
    table('job_attempts','SharedJobs',True,
          'job_id|text|Parent dispatch;attempt_no|integer|Attempt number;generation|bigint|Fence captured on claim;worker_profile|text|Capability identity;started_at|timestamptz|Claim time;finished_at?|timestamptz|Terminal time;outcome?|text|success retry failed cancelled expired;error_code?|text|Allowlisted sanitized error',
          ['PK(workspace_id,id)','UNIQUE(workspace_id,job_id,attempt_no)','Append attempt; finalize once under matching generation; times ordered'], 'Operational audit, bounded retention after terminal job'),
    table('scheduler_state','SharedJobs',False,
          'schedule_key|text|Registered schedule;scope_key|text|global or opaque workspace key;workspace_id?|text|Optional tenant target;timezone|text|Business timezone;next_due_at|timestamptz|Next due instant;last_dispatched_at?|timestamptz|Committed enqueue watermark;version|bigint|Optimistic state version',
          ['PK(id)','UNIQUE(schedule_key,scope_key)','Workspace schedules require matching workspace reference; global schedules use explicit global scope','Only scheduler role; catch-up bounded and coalesced'], 'Retain watermark across restart'),
    table('planning_scopes','Planning',True,
          'kind|text|plan or standalone;plan_id?|text|Owning plan when kind=plan;current_revision|bigint|Monotonic revision counter;version|bigint|Optimistic aggregate version',
          ['PK(workspace_id,id)','UNIQUE NULLS NOT DISTINCT(workspace_id,plan_id)','CHECK kind=plan iff plan_id IS NOT NULL; exactly one standalone scope per workspace'], 'Stable identity, archive rather than retarget'),
    table('planning_revisions','Planning',True,
          'scope_id|text|Stable plan or standalone scope;revision_no|bigint|Scope-local revision;base_snapshot_id|text|Frozen financial context;source_versions|jsonb|Validated bounded version refs;engine_version|text|Simulation rules version;bundle_digest|text|Frozen bundle checksum',
          ['PK(workspace_id,id)','UNIQUE(workspace_id,scope_id,revision_no)','Immutable; revision_no>0; bounded typed source refs'], 'Pinned history until authorized workspace erasure'),
    table('planning_revision_items','Planning',True,
          'planning_revision_id|text|Frozen parent revision;plan_item_id|text|Stable item identity;plan_item_version|bigint|Captured item version;frozen_item|jsonb|Typed immutable item body;item_digest|text|Frozen body checksum',
          ['PK(workspace_id,id)','UNIQUE(workspace_id,planning_revision_id,plan_item_id,plan_item_version)','Immutable; no hard delete of referenced current item'], 'Same as planning revision'),
    table('projection_cache','ReadModels',True,
          'snapshot_id|text|Pinned facts descriptor;query_digest|text|Scope period asOf versions engine and DTO schema;result_payload_id?|text|Expirable result object;expires_at|timestamptz|Cache expiry;updated_at|timestamptz|Refresh time',
          ['PK(workspace_id,id)','UNIQUE(workspace_id,snapshot_id,query_digest)','Discard cache without deleting pinned facts/history'], 'TTL, rebuildable'),
    table('import_rows','Imports',True,
          'preview_id|text|Parent preview;row_key|text|Stable parsed row identity;row_number|integer|Original file row;status|text|valid invalid selected confirmed redacted;normalized_row?|jsonb|Minimal typed row;row_digest|text|Canonical row checksum;error_code?|text|Sanitized validation result;expires_at|timestamptz|Staging retention;redacted_at?|timestamptz|Payload deletion time',
          ['PK(workspace_id,id)','UNIQUE(workspace_id,preview_id,row_key)','row_number>0; bounded row payload; redacted payload must be NULL'], 'Expire staging payload; retain selected-set/result digests as required for replay'),
    table('admin_principals','OpsIdentity',False,
          'login_name|text|Normalized admin identifier;auth_ref|text|Controlled credential or external subject reference;status|text|active suspended revoked;auth_epoch|bigint|Session revocation epoch;mfa_required|boolean|Mandatory for privileged access;version|bigint|Optimistic state version',
          ['PK(id)','UNIQUE(login_name)','UNIQUE(auth_ref)','No customer identity grants; auth mechanism decided ARCH-06'], 'Until admin offboarding then minimum audit tombstone'),
    table('admin_sessions','OpsIdentity',False,
          'principal_id|text|Admin principal;token_digest|text|Digest only, never bearer secret;auth_epoch|bigint|Principal epoch at issue;expires_at|timestamptz|Session expiry;revoked_at?|timestamptz|Revocation;mfa_verified_at?|timestamptz|Step-up time',
          ['PK(id)','UNIQUE(token_digest)','Expiry and epoch checked on every request'], 'Short session lifetime; sanitized audit separately'),
    table('admin_mfa_factors','OpsIdentity',False,
          'principal_id|text|Admin principal;method|text|Registered MFA method;secret_ref|text|Vault or public-key reference;status|text|pending active revoked;counter|bigint|Replay or usage counter',
          ['PK(id)','Counter nonnegative; method-specific validation ARCH-06; no raw secret in JSON'], 'Revoke before deleting secret material'),
    table('admin_challenges','OpsIdentity',False,
          'principal_id?|text|Resolved admin principal;purpose|text|Registered authentication step;challenge_digest|text|Digest only;expires_at|timestamptz|Challenge expiry;attempts|integer|Bounded attempts;consumed_at?|timestamptz|One-time consumption',
          ['PK(id)','UNIQUE(challenge_digest)','Bounded attempts, expiry, consume once atomically'], 'Expire promptly, keep sanitized security audit'),
    table('payload_objects','SharedTX',True,
          'owner_module|text|Registered domain capability;object_kind|text|Registered payload schema;object_id|text|Domain identity within this workspace;schema_ref|text|Validator version;content_digest|text|Canonical content checksum;content?|jsonb|Bounded sensitive typed content;policy|text|Registered retention class;expires_at?|timestamptz|Policy expiry;redacted_at?|timestamptz|Irreversible content purge marker',
          ['PK(workspace_id,id)','No generic cross-module CRUD; domain registry validates reference','Redacted content must be NULL; digest must not contain raw PII; no OTP/raw bank notification'], 'By domain policy; immutable identity distinct from expirable content'),
    table('recovery_journal','Recovery',False,
          'workspace_token|text|Opaque recovery identifier;event_kind|text|delete revoke restore;epoch|bigint|Monotonic recovery fence;event_digest|text|Integrity checksum;checkpoint_ref?|text|Independent off-host durable checkpoint;metadata|jsonb|Allowlisted operational metadata only',
          ['PK(id)','UNIQUE(workspace_token,epoch)','Append only; deliberately no FK to workspace; must outlive erased DB row','Local copy is not independent recovery authority'], 'Keep through maximum recoverable backup and replay horizon'),
    table('ops_control_requests','Ops',False,
          'principal_id|text|Authorized admin;target_kind|text|Allowlisted ops source/job metadata;target_ops_id|text|Sanitized target identity;action|text|Allowlisted pause resume retry;expected_version|bigint|Target version precondition;request_key|text|Idempotency key;request_digest|text|Canonical safe request checksum;state|text|requested accepted rejected completed;reason_code|text|Allowlisted reason;updated_at|timestamptz|Transition time',
          ['PK(id)','UNIQUE(principal_id,request_key)','No arbitrary workspace/finance payload; dispatcher rechecks safe action and revocation'], 'Sanitized admin audit/replay horizon'),
    table('migration_journal','Migrations',False,
          'migration_name|text|Immutable migration identity;checksum|text|Reviewed file checksum;schema_from|text|Expected prior revision;schema_to|text|Committed revision;applied_at|timestamptz|Successful transaction timestamp;runner_version|text|Controlled runner build',
          ['PK(id)','UNIQUE(migration_name)','Migration role only; preflight verifies baseline before bootstrap','Failed attempt diagnostics external; no success entry on rollback'], 'Permanent schema history'),
]

ALTER = {
    'workspaces': ('recovery_epoch|bigint|Monotonic external-restore fence', 'Replace synthetic-only profile constraint only in a separately gated T1 migration; never enable real by client input.'),
    'devices': ('owner_epoch|bigint|Enrollment or revocation epoch', 'Revocation fence checked at receipt acceptance and financial commit.'),
    'entry_groups': ('seal_state|text|building or sealed;sealed_at?|timestamptz|Final immutable bundle seal', 'Replace immutable trigger intentionally: new group builds only within one transaction; must seal before commit; sealed bundle rejects append/update/delete.'),
    'plan_items': ('scope_id|text|Stable plan or standalone scope', 'Backfill from plan_id, or explicit standalone scope; freeze revisions under scope lock.'),
    'actual_links': ('planning_revision_id|text|Unambiguous frozen plan scope/revision', 'Replace active unique index with (workspace_id,planning_revision_id,event_id) WHERE released_at IS NULL; FK to frozen item version. Resolve scope from authorized item, never from bare plan_version.'),
    'snapshots': ('refs_digest|text|Pinned immutable input identity;engine_version|text|Financial rules version', 'Replace UNIQUE(workspace_id,financial_version) with (workspace_id,financial_version,as_of,refs_digest,engine_version); move projection to projection_cache after cutover.'),
    'quote_observations': ('profile_snapshot|jsonb|Frozen instrument gold profile units side and normalization versions', 'Freeze source price/currency/unit, quoteAsOf and FX provenance; quality exposed by API is derived at read asOf, not permanently fresh.'),
    'holding_movements': ('sequence_no|bigint|Monotonic per-holding ordering;quantity_mode|text|set or delta', 'UNIQUE(workspace_id,holding_id,sequence_no); quantity is resulting balance; delta only for delta mode, declaration not purchase.'),
    'ingestion_receipts': ('capture_epoch|bigint|Device epoch captured and checked;result_payload_id?|text|Expirable minimal receipt evidence', 'After verified payload cutover remove normalized_evidence; after J2 cutover remove delivery lease/retry fields; retain transport dedupe identity and minimal result tombstone.'),
    'evidence': ('content_payload_id?|text|Domain-owned expirable content object', 'After verified move remove content field, retain digest/identity/refs; no raw notification or OTP.'),
    'import_previews': ('row_count|integer|Staged row count;rows_digest|text|Ordered row-set digest', 'Move rows array to import_rows; retain preview token, expiry and selected-set digest; budget applies per row and per request, not whole CSV in one JSON.'),
    'refresh_jobs': ('result_payload_id?|text|Expirable detailed refresh result', 'Domain lifecycle remains; remove inline result after payload cutover and lease/retry fields after J2 cutover.'),
    'import_jobs': ('result_payload_id?|text|Expirable detailed import result', 'Domain lifecycle remains; remove inline result after payload cutover and lease/retry fields after J2 cutover; selected set atomic.'),
    'idempotency_records': ('result_payload_id?|text|Expirable response body separate from command tombstone', 'Remove inline result after verified payload cutover; retain operation/key/digest and committed effect refs beyond result TTL; old key never silently re-executes.'),
    'tool_results': ('result_payload_id?|text|Agent-owned tool evidence object', 'Remove inline result after verified payload cutover; typed evidence retention separate from operational attempt logs.'),
    'agent_runs': ('', 'Delivery lease/retry/cancel execution authority moves to J2; Agent logical state and budget stay in domain record.'),
    'ledger_accounts': ('', 'Immutable account_id/kind once used by posted bundle; archive allowed, no retarget.'),
    'identities': ('', 'Synthetic .test restriction kept in original migrations; gated profile-aware auth validation replaces it only for real-T1 deployment. No raw PII in logs.'),
    'sessions': ('', 'Customer sessions role becomes owner only after migrating admin authentication to OpsIdentity; session.device_id semantic clarified ARCH-06, not guessed as FK.'),
}

# Explicit new FKs; use exact composite keys, not naming heuristics.
EXTRA_FKS = [
    ('job_attempts','job_id','jobs'), ('planning_scopes','plan_id','financial_plans'),
    ('planning_revisions','scope_id','planning_scopes'), ('planning_revisions','base_snapshot_id','snapshots'),
    ('planning_revision_items','planning_revision_id','planning_revisions'), ('planning_revision_items','plan_item_id','plan_items'),
    ('projection_cache','snapshot_id','snapshots'), ('projection_cache','result_payload_id','payload_objects'),
    ('import_rows','preview_id','import_previews'), ('plan_items','scope_id','planning_scopes'),
    ('actual_links','planning_revision_id','planning_revisions'),
    ('admin_sessions','principal_id','admin_principals'), ('admin_mfa_factors','principal_id','admin_principals'),
    ('admin_challenges','principal_id','admin_principals'), ('ops_control_requests','principal_id','admin_principals'),
] + [(t, c, 'payload_objects') for t,c in [('ingestion_receipts','result_payload_id'),('evidence','content_payload_id'),('refresh_jobs','result_payload_id'),('import_jobs','result_payload_id'),('idempotency_records','result_payload_id'),('tool_results','result_payload_id')]]

def main():
    OUT.mkdir(parents=True, exist_ok=True)
    base = json.loads(BASE.read_text(encoding='utf-8-sig'))
    tables = []
    for old in base['tables']:
        t = dict(name=old['name'], owner=OWNER[old['name']], tenant=old['tenant'], stage='INHERITED_EXPAND', columns=[], rules=old['constraints'], retention=old['retention'])
        for c in old['columns']:
            typ = re.match(r'\w+\s+([\w]+(?:\([^)]*\))?)', c['sql']).group(1)
            t['columns'].append(dict(name=c['name'], type=typ, nullable=c['nullable'], meaning=c['meaning'], baselineDeclaration=c['sql']))
        if t['name'] in ALTER:
            spec, note = ALTER[t['name']]
            if spec:
                t['columns'] += fields(spec)
            t['contractPhaseChange'] = note
        tables.append(t)
    tables += NEW
    by_name = {t['name']: t for t in tables}
    assert len(by_name) == len(tables) == 70
    # Extract all baseline table-level, inline and late FKs from frozen SQL.
    text = SQL.read_text(encoding='utf-8-sig')
    fks = []
    def add(src, cols, dst, refs, origin):
        cs, rs = [x.strip() for x in cols.split(',')], [x.strip() for x in refs.split(',')]
        assert len(cs) == len(rs)
        for name in cs:
            assert name in {c['name'] for c in by_name[src]['columns']}, (src,name)
        for name in rs:
            assert name in {c['name'] for c in by_name[dst]['columns']}, (dst,name)
        nullable = any(c['nullable'] for c in by_name[src]['columns'] if c['name'] in cs)
        fks.append(dict(table=src, columns=cs, target=dst, targetColumns=rs, optional=nullable, origin=origin))
    for name, body in re.findall(r'CREATE TABLE fw\.(\w+) \(\n(.*?)\n\);', text, re.S):
        for line in body.splitlines():
            m = re.search(r'FOREIGN KEY \(([^)]+)\) REFERENCES fw\.(\w+)\(([^)]+)\)', line)
            if m:
                add(name,m[1],m[2],m[3],'baseline')
            elif 'REFERENCES fw.' in line:
                m = re.search(r'^\s*(\w+).*?REFERENCES fw\.(\w+)\(([^)]+)\)', line)
                add(name,m[1],m[2],m[3],'baseline-inline')
    for src, cols, dst, refs in re.findall(r'ALTER TABLE fw\.(\w+) ADD FOREIGN KEY \(([^)]+)\) REFERENCES fw\.(\w+)\(([^)]+)\)', text):
        add(src,cols,dst,refs,'baseline-late')
    assert len(fks) == 110, len(fks)
    for t in NEW:
        if t['tenant']:
            add(t['name'],'workspace_id','workspaces','id','new-design')
    add('scheduler_state','workspace_id','workspaces','id','new-design')
    for src, col, dst in EXTRA_FKS:
        prefix = 'workspace_id,' if by_name[src]['tenant'] and by_name[dst]['tenant'] else ''
        add(src,prefix+col,dst,prefix+'id','new-design')
    add('actual_links','workspace_id,planning_revision_id,plan_item_id,plan_item_version',
        'planning_revision_items','workspace_id,planning_revision_id,plan_item_id,plan_item_version','new-design')
    model = dict(id='FW-DB-T1-D1-J2-001',status='EXPAND_DESIGN_NOT_EXECUTABLE',postgresMajor=16,
                 baselineSha256=hashlib.sha256(BASE.read_bytes()).hexdigest(),
                 warning='Inherited declarations/constraints coexist during expand; migration-plan defines replacements and contract removals. Not final DDL. New nonnullable columns require staged backfill before NOT NULL.',
                 tables=tables,foreignKeys=fks,baselineIndexes=base['indexes'])
    (OUT/'target-model.json').write_text(json.dumps(model,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    with (OUT/'table-inventory.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.writer(f); w.writerow(['table','owner','tenant','stage','expandColumns','contractChange'])
        for t in tables:
            w.writerow([t['name'],t['owner'],t['tenant'],t['stage'],len(t['columns']),t.get('contractPhaseChange','')])
    dictionary = ['# Từ điển dữ liệu — D1 + J2 expand design\n',
                  '**DESIGN ONLY, không phải DDL đã chạy.** 54 bảng kế thừa +16 bảng mới; cột cũ vẫn tồn tại trong expand. Xem [kế hoạch migration](migration-plan.md) cho replacements/removals và [invariants](invariants-and-workflows.md) cho ý nghĩa nghiệp vụ, units, checks và retention. Baseline meaning ngắn được giữ nguyên, không gọi đó là đặc tả nghiệp vụ mới.\n']
    erd=['erDiagram']
    for t in tables:
        dictionary += [f"## {t['name']} — {t['owner']}\n",f"Tenant: {t['tenant']}; stage: {t['stage']}. Retention: {t['retention']}.\n"]
        if t.get('contractPhaseChange'):
            dictionary.append('Contract-phase change: '+t['contractPhaseChange']+'\n')
        dictionary += ['| Trường | Kiểu | Nullable | Ý nghĩa / nguồn |','| --- | --- | --- | --- |']
        for c in t['columns']:
            meaning=c['meaning']+(' (baseline)' if 'baselineDeclaration' in c else ' (D1 target)')
            dictionary.append(f"| {c['name']} | {c['type']} | {c['nullable']} | {meaning} |")
        dictionary += ['','Rules (design): '+ '; '.join(t['rules'])+'\n']
        erd += [f"    {t['name']} {{",'        text id','    }']
    # Cardinality child-side determined from exact unique/PK sets, not index names.
    unique = {t['name']: [] for t in tables}
    for t in tables:
        for rule in t['rules']:
            m=re.match(r'(?:PRIMARY KEY|PK|UNIQUE(?: NULLS NOT DISTINCT)?)\s*\(([^)]+)\)',rule)
            if m:
                unique[t['name']].append(set(x.strip() for x in m[1].split(',')))
        for c in t['columns']:
            if re.search(r'\b(?:UNIQUE|PRIMARY KEY)\b',c.get('baselineDeclaration','')):
                unique[t['name']].append({c['name']})
    for fk in fks:
        one = any(u <= set(fk['columns']) for u in unique[fk['table']])
        left='|o' if fk['optional'] else '||'
        right='o|' if one else 'o{'
        erd.append(f"    {fk['target']} {left}--{right} {fk['table']} : \"{','.join(fk['columns'])}\"")
    (OUT/'data-dictionary.md').write_text('\n'.join(dictionary)+'\n',encoding='utf-8')
    (OUT/'erd.mmd').write_text('\n'.join(erd)+'\n',encoding='utf-8')
    (OUT/'erd.md').write_text('# ERD — D1 + J2 expand design\n\n70 entities; toàn bộ110 FK baseline và FK mới explicit, kể cả tenant/global/late FK. Optionality dựa nullable; child cardinality dựa PK/UNIQUE. Partial unique indexes không coi là uniqueness toàn bảng. Typed polymorphic domain references jobs/payloads/control requests không vẽ giả FK; phải kiểm bằng owner procedure. Không là bằng chứng SQL execution.\n\n```mermaid\n'+'\n'.join(erd)+'\n```\n',encoding='utf-8')
    # Dependency overlay, not a fabricated field-to-column or implementation proof.
    dependencies = {
        'snapshots': {'projection_cache'},
        'financial_plans': {'planning_scopes','planning_revisions','planning_revision_items'},
        'plan_items': {'planning_scopes','planning_revisions','planning_revision_items'},
        'actual_links': {'planning_scopes','planning_revisions','planning_revision_items'},
        'import_previews': {'import_rows'},
        'evidence': {'payload_objects'},
        'ingestion_receipts': {'jobs','job_attempts','payload_objects'},
        'refresh_jobs': {'jobs','job_attempts','payload_objects'},
        'import_jobs': {'jobs','job_attempts','import_rows','payload_objects'},
        'agent_runs': {'jobs','job_attempts','payload_objects'},
        'tool_results': {'payload_objects'},
        'idempotency_records': {'payload_objects'},
    }
    operations=list(csv.DictReader((ROOT/'docs/contracts/v2/operation-inventory.csv').open(encoding='utf-8-sig')))
    assert len(operations)==len({r['operation'] for r in operations})==133
    with (OUT/'operation-storage-overlay.csv').open('w',newline='',encoding='utf-8') as f:
        w=csv.writer(f); w.writerow(['operation','actor','baselineTables','targetAdditionalDependencies','replacedDependency','status'])
        for r in operations:
            names=set(filter(None,r['tables'].split(',')))
            extra=set().union(*(dependencies.get(n,set()) for n in names)) if names else set()
            replaced=''
            if r['actor'].startswith('admin'):
                extra |= {'admin_principals','admin_sessions'}
                replaced='Customer auth tables, if present in baseline dependency list, are not Ops auth authority'
            if r['operation']=='adminSignIn':
                extra |= {'admin_challenges','admin_mfa_factors'}
            if r['operation'] in {'opsPreviewAction','opsConfirmAction'}:
                extra.add('ops_control_requests')
            if r['operation']=='dispatchJobs':
                extra |= {'jobs','job_attempts','scheduler_state','ops_control_requests'}
            if r['operation']=='purgeExpiredData':
                extra |= {'payload_objects','projection_cache','import_rows'}
            if r['operation'] in {'revokeDevice','disableCollectorBinding','disconnectSource'}:
                extra.add('recovery_journal')
            assert (names|extra) <= set(by_name), names|extra-set(by_name)
            w.writerow([r['operation'],r['actor'],r['tables'],','.join(sorted(extra)),replaced,'DEPENDENCY_DESIGN_ONLY; FIELD/QUERY/ROLE EXECUTION NOT RUN'])
    print(json.dumps(dict(tables=len(tables),baselineTables=54,newTables=len(NEW),expandColumns=sum(len(t['columns']) for t in tables),baselineFKs=110,expandFKs=len(fks),status=model['status'])))

if __name__ == '__main__':
    main()
