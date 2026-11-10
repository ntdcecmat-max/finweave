"""Read-only schema research; writes derived inventory under ARCH-04 evidence only.

No generator invocation, database connection, SQL execution or runtime acceptance.
Run from any cwd; preservation-before.json must already exist for this research task.
"""
from pathlib import Path
import csv
import hashlib
import json
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'docs/execution/evidence/arch-04-research-2026-10-08'


def read(name):
    return (ROOT / name).read_text(encoding='utf-8-sig')


def save(name, value):
    (OUT / name).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def digest(name):
    p = ROOT / name
    return hashlib.sha256(p.read_bytes()).hexdigest() if p.is_file() else None


def write_csv(name, headers, rows):
    with (OUT / name).open('w', encoding='utf-8-sig', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    before = json.loads((OUT / 'preservation-before.json').read_text(encoding='utf-8'))['files']
    model = json.loads(read('docs/data/physical/physical-model.json'))
    sql = read('docs/data/physical/migrations/001_synthetic_tables.sql')
    erd = read('docs/data/physical/erd.mmd')
    table_names = {t['name'] for t in model['tables']}
    sql_tables = set(re.findall(r'CREATE TABLE fw\.(\w+)', sql))
    edges = re.findall(r'^\s*(\w+) \|\|--o\{ (\w+) : (\w+)', erd, re.M)
    erd_nodes = {n for parent, child, _ in edges for n in (parent, child)}
    owners = {}
    duplicate_owners = []
    for line in read('docs/architecture/module-high-level-design.md').splitlines():
        if not line.startswith('|'):
            continue
        cells = [s.strip() for s in line.split('|')]
        if len(cells) < 4:
            continue
        for name in cells[2].split(','):
            name = name.strip().strip('`')
            if name in table_names:
                if name in owners:
                    duplicate_owners.append(name)
                owners[name] = cells[1]

    affected = {
        'F01': set(t['name'] for t in model['tables'] if t['tenant']),
        'F02': {'events', 'entry_groups', 'posting_lines'},
        'F03': {'ledger_accounts', 'posting_lines'},
        'F04': {'financial_plans', 'plan_items', 'actual_links'},
        'F05': {t['name'] for t in model['tables'] if any(' numeric' in c['sql'] or c['name'] == 'version' for c in t['columns'])},
        'F06': {'snapshots', 'workspaces', 'goals'},
        'F07': {'version_history', 'snapshots', 'financial_plans', 'simulations', 'agent_runs', 'proposal_previews', 'planning_drafts', 'plan_goal_links'},
        'F08': {'ingestion_receipts', 'refresh_jobs', 'import_jobs', 'agent_runs', 'ops_jobs'},
        'F09': {'goal_allocations', 'goals', 'accounts', 'events', 'planning_drafts', 'financial_plans', 'proposal_previews', 'idempotency_records'},
        'F10': {'evidence', 'event_evidence', 'receipt_evidence', 'ingestion_receipts', 'snapshots', 'import_previews', 'import_jobs', 'idempotency_records', 'tool_results', 'messages', 'ops_idempotency'},
        'F11': {'identities', 'workspaces', 'sessions', 'identity_challenges', 'ops_accounts', 'ops_previews', 'ops_audit'},
        'F12': table_names,
        'F13': {'instruments', 'gold_profiles', 'holdings', 'quote_observations', 'provider_entitlements', 'refresh_jobs'},
        'F14': {'holdings', 'holding_movements', 'import_previews', 'import_jobs'},
        'F15': table_names,
        'F16': {'posting_lines', 'ingestion_receipts', 'refresh_jobs', 'import_jobs', 'agent_runs', 'version_history', 'actual_links'},
        'F17': table_names,
    }
    table_rows = []
    column_rows = []
    sql_declaration_gaps = []
    for table in model['tables']:
        name = table['name']
        block = re.search(r'CREATE TABLE fw\.' + re.escape(name) + r' \((.*?)\n\);', sql, re.S)
        table_rows.append({
            'table': name, 'owner': owners.get(name, 'MISSING'),
            'columns': len(table['columns']), 'tenant': table['tenant'], 'mutable': table['mutable'],
            'explicit_indexes': ';'.join(i['name'] for i in model['indexes'] if i['table'] == name),
            'erd_node_present': name in erd_nodes, 'retention_current': table['retention'],
            'review_findings': ';'.join('DB04-' + key for key, names in affected.items() if name in names),
            'runtime_status': 'NOT RUN',
        })
        for column in table['columns']:
            present = bool(block and column['sql'] in block.group(1))
            if not present:
                sql_declaration_gaps.append(name + '.' + column['name'])
            column_rows.append({
                'table': name, 'owner': owners.get(name, 'MISSING'), 'column': column['name'],
                'declaration': column['sql'], 'nullable': column['nullable'],
                'dictionary_meaning_current': column['meaning'],
                'declaration_present_in_001': present, 'runtime_status': 'NOT RUN',
            })
    write_csv('table-audit.csv', list(table_rows[0]), table_rows)
    write_csv('column-inventory.csv', list(column_rows[0]), column_rows)

    refs = re.findall(r'REFERENCES fw\.(\w+)', sql)
    findings = re.findall(r'^## (DB04-F\d+) ', read('docs/architecture/ARCH-04-schema-review.md'), re.M)
    inventory = {
        'status': 'STATIC_INVENTORY_COMPLETE_SCHEMA_GAPS_OPEN', 'sql_execution': 'NOT RUN',
        'tables': len(table_names), 'columns': len(column_rows),
        'tenant_tables': sum(t['tenant'] for t in model['tables']),
        'explicit_indexes': len(model['indexes']),
        'explicit_unique_indexes': len(re.findall(r'CREATE UNIQUE INDEX', sql)),
        'implicit_constraint_indexes': 'Not included in explicit index count; introspection NOT RUN',
        'numeric_columns': sum(' numeric' in r['declaration'] for r in column_rows),
        'jsonb_columns': sum(' jsonb' in r['declaration'] for r in column_rows),
        'sql_fk_reference_count': len(refs),
        'model_relation_edges': sum(len(t['relations']) for t in model['tables']),
        'erd_edges': len(edges), 'erd_table_nodes': len(erd_nodes),
        'erd_missing_tables': sorted(table_names - erd_nodes),
        'unknown_fk_targets': sorted(set(refs) - table_names),
        'ownership_tables': len(owners), 'duplicate_owners': duplicate_owners,
        'missing_owners': sorted(table_names - set(owners)),
        'sql_model_table_difference': sorted(table_names ^ sql_tables),
        'sql_declaration_gaps': sql_declaration_gaps,
        'open_findings': findings,
        'limits': 'Inventory/declaration checks only; not full semantic proof, PL/pgSQL compilation, RLS or migration acceptance.',
    }
    save('static-inventory.json', inventory)
    changed = [p for p, h in before.items() if digest(p) != h]
    save('preservation.json', {'status': 'PASS' if not changed else 'FAIL', 'checked_files': len(before), 'changed': changed})
    documents = [
        'docs/architecture/ARCH-04-options.md', 'docs/architecture/ARCH-04-schema-review.md',
        'docs/architecture/architecture-decision-agenda.md', 'docs/architecture/README.md',
    ]
    bad_links = []
    link_count = 0
    for name in documents:
        for target in re.findall(r'\]\(([^)]+)\)', read(name)):
            if target.startswith(('https://', 'http://', '#')):
                continue
            link_count += 1
            if not (ROOT / name).parent.joinpath(target.split('#')[0].strip('<>')).exists():
                bad_links.append({'file': name, 'target': target})
    mechanical_pass = not any([changed, bad_links, duplicate_owners, inventory['missing_owners'],
                               inventory['sql_declaration_gaps'], inventory['unknown_fk_targets'],
                               inventory['sql_model_table_difference']])
    save('document-validation.json', {
        'status': 'PASS' if mechanical_pass else 'FAIL', 'meaning': 'Mechanical research artifact checks only; 17 schema findings remain open.',
        'documents': len(documents), 'local_link_occurrences': link_count, 'broken_links': bad_links,
        'input_sha256': {p: h for p, h in before.items() if p.startswith(('docs/data/physical/', 'docs/contracts/v2/')) or p == 'tools/handover/build_data.py'},
        'output_sha256': {p: digest(p) for p in documents + ['tools/architecture/audit_arch04.py']},
        'runtime_tests': 'NOT RUN',
    })
    print(json.dumps({'artifact_checks': 'PASS' if mechanical_pass else 'FAIL', 'tables': len(table_names),
                      'columns': len(column_rows), 'owners': len(owners), 'open_findings': len(findings),
                      'preserved_files': len(before), 'changed': changed, 'broken_links': bad_links,
                      'local_links': link_count, 'sql_execution': 'NOT RUN'}))
    if not mechanical_pass:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
