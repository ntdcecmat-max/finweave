"""Versioned handover snapshots and fail-closed sealing; never executes SQL or frontend."""
import argparse,csv,datetime,hashlib,importlib.metadata,json,pathlib,re,subprocess,sys,zipfile
R=pathlib.Path(__file__).resolve().parents[2]
EXCLUDED={'node_modules','.git','npm-cache','.vite','.vite-temp','__pycache__','.cache'}
OLD=R/'docs/execution/evidence/handover-2026-10-08'
def sha(data):return hashlib.sha256(data).hexdigest()
def read(path):return json.loads(path.read_text(encoding='utf-8-sig'))
def write(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def git(*args):return subprocess.check_output(['git',*args],cwd=R).decode('utf-8').strip()
def now():
 utc=datetime.datetime.now(datetime.timezone.utc)
 return {'utc':utc.isoformat(),'local':utc.astimezone(datetime.timezone(datetime.timedelta(hours=7))).isoformat(),'timezone':'Asia/Saigon'}
def allowed(p):
 rel=p.relative_to(R)
 return not set(rel.parts)&EXCLUDED and not (p.name.startswith('.env') and not p.name.endswith(('.example','.sample'))) and not p.suffix.lower() in {'.pem','.key','.p12','.jks','.keystore'}
def kind(p):
 rel=p.relative_to(R)
 if 'dist' in rel.parts or 'dist-admin' in rel.parts or p.suffix=='.tsbuildinfo':return 'generated-build-output'
 if 'src' in rel.parts or 'admin' in rel.parts or 'android-shell' in rel.parts:return 'implementation-source'
 if 'scripts' in rel.parts or 'tests' in rel.parts:return 'tooling-or-tests'
 if 'public' in rel.parts:return 'source-asset'
 return 'source-config-lockfile'
def entry(p):
 data=p.read_bytes();return {'path':p.relative_to(R).as_posix(),'sha256':sha(data),'bytes':len(data),'classification':kind(p)}
def frontend():return {x['path']:x for x in (entry(p) for p in (R/'finweave-web').rglob('*') if p.is_file() and allowed(p))}
def immutable(package=None):
 paths=list(OLD.rglob('*'))+list((R/'docs/governance/baselines').rglob('*'))
 return {p.relative_to(R).as_posix():sha(p.read_bytes()) for p in paths if p.is_file() and package not in p.relative_to(R).parts}
def compare(a,b):return [{'path':p,'beforeSHA256':a.get(p),'afterSHA256':b.get(p)} for p in sorted(set(a)|set(b)) if a.get(p)!=b.get(p)]
def source_preservation(e):
 before=read(e/'source-before.json');after=frontend();hashes={k:v['sha256'] for k,v in after.items()}
 changes=compare(before['files'],hashes)
 old_status=[x for x in before['gitStatus'].splitlines() if 'finweave-web/' in x]
 new_status=[x for x in git('status','--porcelain=v1','-uall').splitlines() if 'finweave-web/' in x]
 report={'intervalStartUTC':before['capturedAtUTC'],'intervalEnd':now(),'filesBefore':len(before['files']),'filesAfter':len(after),'changedAddedDeleted':[x['path'] for x in changes],'changes':changes,'headUnchanged':before['head']==git('rev-parse','HEAD'),'frontendGitStatusUnchanged':old_status==new_status,'pass':not changes and old_status==new_status and before['head']==git('rev-parse','HEAD'),'scope':'this revision interval only; historical preservation FAIL remains unchanged','exclusions':sorted(EXCLUDED)}
 write(e/'frontend-preservation.json',report)
 write(e/'source-after.json',{'observedAt':now(),'head':git('rev-parse','HEAD'),'files':after,'gitStatus':git('status','--porcelain=v1','-uall')})
 return report
def prepare(e):
 if (e/'immutable-before.json').exists():raise SystemExit('prepare already captured; refusing overwrite')
 if not (e/'source-before.json').exists():
  write(e/'source-before.json',{'capturedAtUTC':now()['utc'],'timezone':'Asia/Saigon','head':git('rev-parse','HEAD'),'files':{k:v['sha256'] for k,v in frontend().items()},'gitStatus':git('status','--porcelain=v1','-uall')})
 if not (e/'canonical-before.json').exists():(e/'canonical-before.json').write_bytes((R/'docs/contracts/v2/openapi.json').read_bytes())
 write(e/'immutable-before.json',immutable(e.name))
 write(e/'artifact-before.json',{p.relative_to(R).as_posix():sha(p.read_bytes()) for folder in ['docs/contracts/v2','docs/data/physical','tools/handover','docs/handover'] for p in (R/folder).rglob('*') if p.is_file() and allowed(p)})
 write(e/'source-baseline.json',{'packageId':e.name,'observation':now(),'head':git('rev-parse','HEAD'),'selection':'current working tree including reviewed uncommitted/untracked files; HEAD is context, not whole implementation','gitStatus':git('status','--porcelain=v1','-uall'),'sourceAndBuildFiles':frontend(),'rootConfig':[entry(p) for p in [R/'.gitignore',R/'Start-Prototype.cmd'] if p.exists()],'deletedPaths':git('ls-files','--deleted').splitlines(),'exclusions':sorted(EXCLUDED)+['secrets (.env except examples, private key/keystore files)','build outputs excluded from source authority and package payload'],'historicalSources':'archives are evidence only; deleted original files not restored'})
 drift=read(OLD/'frontend-observed-drift.json');rows=[]
 for item in drift['files']:
  p=R/item['path'];current=sha(p.read_bytes()) if p.is_file() else None;classification=kind(p)
  reason='Generated compiler/bundler output; file replacement/removal/addition is observed, build provenance and runtime equivalence not established. Exclude from source authority.'
  detail=None
  if classification!='generated-build-output':
   content=p.read_text(encoding='utf-8');blob=subprocess.check_output(['git','show','HEAD:'+item['path']],cwd=R)
   base_matches=sha(blob)==item['beforeSHA256']
   detail={'headBlobSHA256':sha(blob),'headMatchesHistoricalBefore':base_matches}
   diff=subprocess.check_output(['git','diff','--no-ext-diff','--',item['path']],cwd=R)
   target=e/(p.stem+'-review.diff');target.write_bytes(diff)
   detail['reviewDiff']=target.relative_to(R).as_posix()
   if p.name=='ActionForm.tsx':reason='Reviewed conditional form rules, money input, planning forecast/preview using simulatePlanningDraft, draft goal assessment and retained preview/confirm flow. UI limit 15 digits is narrower than canonical18: explicit consumer gap; local Number forecast is not ledger authority. No operation declaration changes in this path.'
   elif p.name=='presentation.ts':reason='Adds applyCommand-based simulatePlanningDraft for local plan/goal/simulation previews; executeAction continues dynamic services[operation], cached immutable retries and preview tokens. Local engine preview is synthetic, not backend validation or a production endpoint.'
   else:reason='Missing/relocated input now remains unverified instead of false preserved; current script removes catalogue overwrite. Still writes old Step6 evidence and keeps historical v1 metadata: reviewed as tooling, never run during this revision.'
   if not base_matches:reason+=' HEAD diff is review context only; historical-before bytes cannot be reconstructed from hashes.'
  rows.append({**item,'currentSHA256':current,'classification':classification,'review':reason,'contentEvidence':detail,'apiSchemaImpact':'no canonical API/schema change; adapter/local forecast distinctions recorded' if classification!='generated-build-output' else 'none as source authority; cannot certify bundle semantics from hash','decision':'RECONCILED_FOR_NEW_WORKING_TREE_BASELINE','attribution':'UNKNOWN; hashes and content correspondence do not identify author/task'})
 write(e/'drift-reconciliation.json',{'historicalPreservationPass':False,'historicalOverallPass':False,'historicalObservedAt':drift['comparisonUTC'],'reviewedAt':now(),'files':rows,'unresolvedAuthorship':'All nine paths; not needed to select the reviewed content baseline','policy':'historical FAIL and hashes unchanged; this revision is not proof earlier task preserved frontend'})
 print(json.dumps({'prepared':e.name,'driftPaths':len(rows),'sourceFiles':len(frontend())}))

def extended(e):
 sys.path.insert(0,str(R/'work/handover-deps'))
 from pglast import ast,parse_sql
 from alignment import schema_fields
 checks=[]
 def check(name,ok,details):checks.append({'check':name,'pass':bool(ok),'details':details})
 doc=read(R/'docs/contracts/v2/openapi.json');model=read(R/'docs/data/physical/physical-model.json')
 ddl=parse_sql((R/'docs/data/physical/migrations/001_synthetic_tables.sql').read_text(encoding='utf-8'))
 actual={x.stmt.relation.relname:x.stmt for x in ddl if isinstance(x.stmt,ast.CreateStmt)}
 mismatches=[]
 for table in model['tables']:
  # Compare complete parsed column AST: SQL types/precision, nullability, defaults,
  # inline checks/FKs/uniqueness. Line locations have no semantic significance.
  for col,node in zip(table['columns'],[x for x in actual[table['name']].tableElts if isinstance(x,ast.ColumnDef)]):
   reference=parse_sql('CREATE TABLE sample ('+col['sql']+');')[0].stmt.tableElts[0]
   def clean(v):
    if isinstance(v,dict):return {k:clean(x) for k,x in v.items() if k not in ['location','stmt_len','stmt_location']}
    if isinstance(v,(tuple,list)):return [clean(x) for x in v]
    return v
   if clean(node())!=clean(reference()):mismatches.append(table['name']+'.'+col['name'])
   nullable=not any(c.contype.name in ['CONSTR_NOTNULL','CONSTR_PRIMARY'] for c in (node.constraints or ()))
   if col['nullable']!=nullable:mismatches.append(table['name']+'.'+col['name']+' nullable metadata')
  constraints=[x for x in actual[table['name']].tableElts if isinstance(x,ast.Constraint)]
  expected=parse_sql('CREATE TABLE sample (dummy text'+''.join(', '+x for x in table['constraints'])+');')[0].stmt.tableElts[1:]
  if [clean(x()) for x in constraints]!=[clean(x()) for x in expected]:mismatches.append(table['name']+' table constraints')
 check('Physical column types/precision/nullability/defaults/checks/FKs and table constraints',not mismatches,mismatches)
 indexes={x.stmt.idxname:x.stmt for x in ddl if isinstance(x.stmt,ast.IndexStmt)}
 idx_errors=[]
 for index in model['indexes']:
  node=indexes.get(index['name'])
  if node is None or node.relation.relname!=index['table']:idx_errors.append(index['name'])
 check('Model index declarations resolve in parsed SQL',not idx_errors,idx_errors)
 # The generator is inspected/executed into an isolated directory: compare all
 # physical derivatives byte-for-byte, without overwriting canonical SQL.
 import tempfile
 source=(R/'tools/handover/build_data.py').read_text(encoding='utf-8')
 with tempfile.TemporaryDirectory(dir=R/'work',prefix='physical-verify-') as temp:
  sandbox=pathlib.Path(temp)
  original="OUT=R/'docs/data/physical'"
  if original not in source:raise ValueError('Generator output boundary changed; review required')
  code=source.replace(original,'OUT=pathlib.Path('+repr(str(sandbox))+')',1)
  exec(compile(code,'build_data-isolated-review','exec'),{'__file__':str(R/'tools/handover/build_data.py'),'__name__':'__artifact_review__'})
  generated=[p for p in sandbox.rglob('*') if p.is_file()]
  errors=[p.relative_to(sandbox).as_posix() for p in generated if not (R/'docs/data/physical'/p.relative_to(sandbox)).is_file() or p.read_bytes()!=(R/'docs/data/physical'/p.relative_to(sandbox)).read_bytes()]
 check('Physical model/001/dictionary/ERD reproduce from reviewed generator',not errors,{'files':len(generated),'mismatches':errors})
 schemas=read(R/'docs/contracts/v2/schemas.json')
 check('Derived schemas exactly match canonical components',schemas['components']['schemas']==doc['components']['schemas'],sha((R/'docs/contracts/v2/openapi.json').read_bytes()))
 mappings=list(csv.DictReader((R/'docs/contracts/v2/consumer-operation-mapping.csv').open(encoding='utf-8')))
 opnames={v['post']['operationId'] for v in doc['paths'].values()}
 errors=[]
 for row in mappings:
  if not (R/row['sourcePath']).is_file():errors.append(row['sourcePath'])
  if not row['transformations'] or not row['status']:errors.append(row['sourceSymbol'])
  for name in filter(None,row['targetOperations'].split(',')):
   if name not in opnames:errors.append(name)
 check('Detailed consumer coverage and transformations/target/source resolution',not errors,{'rows':len(mappings),'errors':errors,'runtimeCoverage':'NOT RUN'})
 ast_inventory=read(e/'consumer-ast.json')['rows']
 check('Dynamic adapters retained alongside AST call/reference inventory',any(x['kind']=='dynamic_dispatch' for x in ast_inventory),{'entries':len(ast_inventory),'dynamic':[x for x in ast_inventory if x['kind']=='dynamic_dispatch']})
 text=(R/'finweave-web/scripts/audit-step6.ts').read_text(encoding='utf-8')
 check('Step6 catalogue overwrite absent; old evidence writer quarantined by workflow',not re.search(r"writeFileSync\(resolve\(root,'docs/design/interface-catalogue.md'",text),'NOT RUN; writes legacy step6 evidence; not safe for current baseline')
 check('Historical evidence and baselines unchanged',not compare(read(e/'immutable-before.json'),immutable(e.name)),compare(read(e/'immutable-before.json'),immutable(e.name)))
 def wire(v):
  if isinstance(v,dict):return {k:wire(x) for k,x in v.items() if k!='x-finweave'}
  if isinstance(v,list):return [wire(x) for x in v]
  return v
 original=read(e/'canonical-before.json')
 check('API wire schemas/paths/examples/version unchanged after metadata errata',doc['info']['version']=='2.0.0' and wire(doc)==wire(original) and sha((e/'canonical-before.json').read_bytes())==read(e/'artifact-before.json')['docs/contracts/v2/openapi.json'],'API2.0.0 retained; canonical-semantic-diff.json records metadata dependency corrections; physical migrations unchanged')
 for name in ['001_synthetic_tables.sql','002_guards_and_boundaries.sql','003_mutable_and_immutable_triggers.sql']:
  p=R/'docs/data/physical/migrations'/name
  check('Migration checksum preserved '+name,sha(p.read_bytes())==read(e/'artifact-before.json')[p.relative_to(R).as_posix()],sha(p.read_bytes()))
 versions={n:importlib.metadata.version(n) for n in ['jsonschema','openapi-spec-validator','pglast']}
 check('Validation dependencies match pinned requirements',versions=={'jsonschema':'4.26.0','openapi-spec-validator':'0.7.2','pglast':'7.10'},versions)
 observer=read(e/'consumer-ast.json')['runtime'];lock=read(R/'finweave-web/package-lock.json');package=read(R/'finweave-web/package.json')
 check('Observer dependencies and package declarations match lockfile',observer['lockSHA256']==sha((R/'finweave-web/package-lock.json').read_bytes()) and all(observer[n]==lock['packages']['node_modules/'+n]['version'] for n in ['typescript','zod']) and all(package.get(n,{})==lock['packages'][''].get(n,{}) for n in ['dependencies','devDependencies']),observer)
 root_config=read(e/'source-baseline.json')['rootConfig']
 check('Root source configuration preserved',all((R/x['path']).is_file() and sha((R/x['path']).read_bytes())==x['sha256'] for x in root_config),root_config)
 raw={}
 for name in ['step6-unit-results.json','step6-browser-results.json']:
  p=R/'docs/execution/evidence'/name
  value=read(p)
  raw[name]={'sha256':sha(p.read_bytes()),'observedAt':now(),'stats':{k:value[k] for k in ['numTotalTests','numPassedTests','numFailedTests','startTime','stats'] if k in value},'attribution':'existing raw artifact, not executed by this revision; source identity of its run is not assumed'}
 write(e/'existing-runtime-evidence.json',raw)
 preservation=source_preservation(e);check('Source preservation during this revision',preservation['pass'],preservation)
 report={'packageId':e.name,'observedAt':now(),'checks':checks,'pass':all(x['pass'] for x in checks),'runtime':{x:'NOT RUN' for x in ['SQL execution','PLpgSQL compile','domain correctness','authorization','security PoC','frontend acceptance','native device tests']}}
 write(e/'alignment-validation.json',report);print(json.dumps({'extendedChecks':len(checks),'pass':report['pass'],'failed':[x['check'] for x in checks if not x['pass']]}))
 # Pin the exact validated artifacts/dependencies. The two preservation records
 # are refreshed by seal; source bytes remain independently pinned to before.
 b=R/'docs/governance/baselines'/e.name
 inputs={p.relative_to(R).as_posix():sha(p.read_bytes()) for p in selected(e,b) if p.name not in ['validated-input-manifest.json','frontend-preservation.json','source-after.json']}
 write(e/'validated-input-manifest.json',{'capturedAt':now(),'files':inputs,'exclusions':['this manifest','source-after.json/frontend-preservation.json refreshed by seal with independent source hash comparison']})
 return report

def selected(e,b):
 files=set()
 for folder in ['finweave-web','docs','tools/handover']:
  for p in (R/folder).rglob('*'):
   if not p.is_file() or not allowed(p):continue
   rel=p.relative_to(R).as_posix()
   if kind(p)=='generated-build-output':continue
   if '/baselines/' in rel and re.search(r'/FW-HANDOVER-\d{8}-r\d+/',rel):continue
   if '/evidence/' in rel and not (p.is_relative_to(OLD) or p.is_relative_to(e)):continue
   if p.is_relative_to(b):continue
   files.add(p)
 for name in ['README.md','.gitignore','Start-Prototype.cmd','delivery-input-manifest.json','source-sync-manifest.json','manifest-sha256.json','step4-manifest-sha256.json','step5-manifest-sha256.json','step6-manifest-sha256.json']:
  if (R/name).is_file():files.add(R/name)
 files.update(p for p in b.glob('*.md'))
 # Include the transitive file-link dependencies of packaged Markdown, including
 # inherited business requirements and cited historical text/JSON evidence.
 # Bulk browser traces/videos are excluded unless explicitly linked as files.
 import urllib.parse
 pending=[p for p in files if p.suffix=='.md'];seen=set()
 while pending:
  p=pending.pop()
  if p in seen:continue
  seen.add(p)
  for raw in re.findall(r'!?\[[^\]]*\]\(([^)]+)\)',p.read_text(encoding='utf-8-sig')):
   name=urllib.parse.unquote(raw.split(' "')[0].strip('<>').split('#')[0])
   if not name or re.match(r'^[a-zA-Z]+:',name):continue
   dest=(p.parent/name).resolve()
   if dest.is_file() and dest.is_relative_to(R) and allowed(dest) and not dest.is_relative_to(b) and kind(dest)!='generated-build-output' and dest not in files:
    files.add(dest)
    if dest.suffix=='.md':pending.append(dest)
 return sorted(files)

def seal(e):
 b=R/'docs/governance/baselines'/e.name
 if (b/'manifest.json').exists():raise SystemExit('Sealed revision already exists; create a new revision instead')
 b.mkdir(parents=True,exist_ok=True)
 validation=read(e/'validation.json');alignment=read(e/'alignment-validation.json');pres=source_preservation(e)
 historical_changes=compare(read(e/'immutable-before.json'),immutable(e.name))
 pinned=read(e/'validated-input-manifest.json')['files']
 current={p.relative_to(R).as_posix():sha(p.read_bytes()) for p in selected(e,b) if p.name not in ['validated-input-manifest.json','frontend-preservation.json','source-after.json']}
 validation_drift=compare(pinned,current)
 status='READY_LOCAL_SYNTHETIC_BASELINE' if validation['artifactChecksPass'] and alignment['pass'] and pres['pass'] and not historical_changes else ('BLOCKED_SOURCE_DRIFT' if not pres['pass'] else 'BLOCKED_ALIGNMENT')
 if validation_drift:status='BLOCKED_ALIGNMENT'
 # Materialize bytes once, then recheck both source and selected artifacts after
 # ZIP writing. Never seal a package assembled from changing inputs.
 paths=selected(e,b);payload={p.relative_to(R).as_posix():p.read_bytes() for p in paths}
 source_expected=read(e/'source-baseline.json')['sourceAndBuildFiles']
 for name,info in source_expected.items():
  if info['classification']!='generated-build-output' and name in payload and sha(payload[name])!=info['sha256']:status='BLOCKED_SOURCE_DRIFT'
 archive=b/'payload.zip'
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for name,data in payload.items():z.writestr(name,data)
 drift=[name for name,data in payload.items() if not (R/name).is_file() or sha((R/name).read_bytes())!=sha(data)]
 if drift:status='BLOCKED_SOURCE_DRIFT'
 final_source=frontend();final_changes=compare(read(e/'source-before.json')['files'],{k:v['sha256'] for k,v in final_source.items()})
 if final_changes or git('rev-parse','HEAD')!=read(e/'source-baseline.json')['head']:status='BLOCKED_SOURCE_DRIFT'
 for x in read(e/'source-baseline.json')['rootConfig']:
  if not (R/x['path']).is_file() or sha((R/x['path']).read_bytes())!=x['sha256']:status='BLOCKED_SOURCE_DRIFT'
 files=[{'path':name,'bytes':len(data),'sha256':sha(data),'classification':kind(R/name) if name.startswith('finweave-web/') else ('evidence' if '/evidence/' in name else 'handover-artifact')} for name,data in sorted(payload.items())]
 source_manifest=[x for x in files if x['path'].startswith('finweave-web/') or x['path'] in ['.gitignore','Start-Prototype.cmd']]
 model=R/'docs/data/physical/physical-model.json';api=R/'docs/contracts/v2/openapi.json'
 manifest={'packageId':e.name,'status':status,'sealedAt':now(),'api':{'version':read(api)['info']['version'],'canonicalPath':api.relative_to(R).as_posix(),'sha256':sha(api.read_bytes())},'schema':{'artifactVersion':'FW-PHYS-SYNTHETIC-001','profile':'SYNTHETIC-ONLY','modelSHA256':sha(model.read_bytes()),'migrations':[entry(p) for p in sorted((R/'docs/data/physical/migrations').glob('*.sql'))],'execution':'NOT RUN'},'source':{'head':git('rev-parse','HEAD'),'selection':'reviewed current working tree with uncommitted/untracked changes; source-baseline.json records full git status/deletions','manifest':source_manifest},'archive':{'path':archive.relative_to(R).as_posix(),'sha256':sha(archive.read_bytes()),'bytes':archive.stat().st_size},'historicalResult':{'artifactChecksPass':True,'frontendPreservationPass':False,'overallPass':False,'unchanged':not historical_changes},'validation':{'artifactChecksPass':validation['artifactChecksPass'],'alignmentPass':alignment['pass'],'sourcePreservationPass':pres['pass'],'artifactDriftDuringSeal':drift,'sourceDriftDuringSeal':final_changes},'exclusions':sorted(EXCLUDED)+['secret env/private key/keystore files','build outputs (separate source inventory only)','bulk historical browser traces/videos not explicitly linked; frozen documents may retain unavailable deleted-original links as historical context','this manifest and checksum sidecar (self-hash excluded)'],'notRun':alignment['runtime'],'files':files}
 write(b/'manifest.json',manifest)
 (b/'SHA256SUMS.txt').write_text(sha((b/'manifest.json').read_bytes())+'  manifest.json\n'+sha(archive.read_bytes())+'  payload.zip\n',encoding='utf-8')
 print(json.dumps({'packageId':e.name,'status':status,'files':len(files),'manifestSHA256':sha((b/'manifest.json').read_bytes()),'archiveSHA256':sha(archive.read_bytes()),'archiveBytes':archive.stat().st_size}))

def verify(e):
 b=R/'docs/governance/baselines'/e.name;m=read(b/'manifest.json');errors=[]
 if sha((b/'payload.zip').read_bytes())!=m['archive']['sha256']:errors.append('archive hash')
 sums=(b/'SHA256SUMS.txt').read_text(encoding='utf-8').splitlines()
 if sha((b/'manifest.json').read_bytes())!=sums[0].split()[0]:errors.append('manifest hash')
 with zipfile.ZipFile(b/'payload.zip') as z:
  if z.testzip():errors.append('zip integrity')
  for x in m['files']:
   if sha(z.read(x['path']))!=x['sha256']:errors.append('payload '+x['path'])
   if not (R/x['path']).exists() or sha((R/x['path']).read_bytes())!=x['sha256']:errors.append('workspace drift '+x['path'])
 if compare(read(e/'immutable-before.json'),immutable(e.name)):errors.append('historical evidence drift')
 print(json.dumps({'packageId':e.name,'status':m['status'],'verifiedFiles':len(m['files']),'pass':not errors,'errors':errors}));return not errors

if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('command',choices=['prepare','preserve','validate','seal','verify']);p.add_argument('--package-id',required=True);a=p.parse_args()
 if not re.fullmatch(r'FW-HANDOVER-\d{8}-r\d+',a.package_id):raise SystemExit('Invalid package ID')
 e=R/'docs/execution/evidence'/a.package_id;e.mkdir(parents=True,exist_ok=True)
 if a.command!='verify' and (R/'docs/governance/baselines'/a.package_id/'manifest.json').exists():raise SystemExit('Revision sealed; use verify or start a new package revision')
 if a.command=='prepare':prepare(e)
 elif a.command=='preserve':print(json.dumps(source_preservation(e)))
 elif a.command=='validate':extended(e)
 elif a.command=='seal':seal(e)
 else:sys.exit(0 if verify(e) else 1)
