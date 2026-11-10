"""Apply reviewed data-dependency errata once; never bootstrap the contract again."""
import copy,json,pathlib,sys
from data_alignment import dependencies
root=pathlib.Path(__file__).resolve().parents[2]
package=sys.argv[1] if len(sys.argv)==2 else ''
import re
if not re.fullmatch(r'FW-HANDOVER-\d{8}-r\d+',package):raise SystemExit('Pass a new package ID')
e=root/'docs/execution/evidence'/package;c=root/'docs/contracts/v2/openapi.json'
if (e/'canonical-before.json').exists():raise SystemExit('Original contract already captured; refuse re-apply')
e.mkdir(parents=True,exist_ok=True);(e/'canonical-before.json').write_bytes(c.read_bytes())
doc=json.loads(c.read_text(encoding='utf-8'));model=json.loads((root/'docs/data/physical/physical-model.json').read_text(encoding='utf-8'));before=copy.deepcopy(doc)
expected=dependencies(doc,model);changes=[]
for item in doc['paths'].values():
 op=item['post'];meta=op['x-finweave'];old=copy.deepcopy(meta)
 meta['persistenceTables']=expected[op['operationId']]
 meta['persistenceScope']='domain read/write dependencies, not grants or per-table write effects; shared session/workspace authorization, version_history, proposal_previews and idempotency infrastructure also apply by actor/operation'
 if op['operationId'] in ['postDraft','updateDraft']:meta['polling']='none; ledger draft command, not a planning draft or agent job'
 if op['operationId']=='previewImport':meta['stagingPolicy']='wire-compatible query with mutation=null; bounded immutable TTL staging cache keyed by owner/workspace/file+mapping digest; no financial version change or ledger effect; confirmImport is durable idempotent mutation'
 if meta!=old:changes.append({'operation':op['operationId'],'before':old,'after':meta,'impact':'domain dependency/documentation erratum; request/reply/error schema and wire shape unchanged'})
assert before['components']==doc['components']
def wire(v):
 if isinstance(v,dict):return {k:wire(x) for k,x in v.items() if k!='x-finweave'}
 if isinstance(v,list):return [wire(x) for x in v]
 return v
assert wire(before)==wire(doc)
c.write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(e/'canonical-semantic-diff.json').write_text(json.dumps({'apiVersionBefore':'2.0.0','apiVersionAfter':'2.0.0','versionPolicy':'2.0.0 remains the unpublished implementation target; metadata dependency errata do not change endpoints, request/response/error shapes, required/null/enums or existing domain behavior. Package r1 pins amended canonical bytes. Any future wire/behavior change needs explicit semantic-version/migration review; package-only edits never bump API version.','wireSchemasUnchanged':True,'schemaMigrationsUnchanged':True,'changes':changes},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'metadataErrata':len(changes),'wireSchemasUnchanged':True,'apiVersion':'2.0.0'}))
