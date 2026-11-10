"""Derived mapping from canonical API + fresh observed schemas + reviewed semantic rules."""
import csv,json,re

BASE=('Wrap/unwrap target Request/Reply and Error; exact target contractVersion=2.0.0; '
      'server-authorized workspace/actor/object refs; preserve unknown/null vs zero; decimal strings '
      '(VND integer<=18 digits, quantity/price<=18+8), explicit currency/unit and RFC3339 offsets; '
      'no Number conversion for ledger. Query mutation=null; mutation exact key+expected workspace/object '
      'versions+preview binding. Unknown outcome retains original semantic request; replay before fresh version check. '
      'Opaque cursor/filter/snapshot pagination; do not concatenate pages as a financial report. '
      'Validate target fields/required/null/enums/bounds using the linked field diff; adapter must reject unsupported '
      'values and obtain required business context, never fabricate missing fields.')

SPECIAL={
 'getPresentationSnapshot':'Read DTO is a projection, not writable Store authority; normalize target fields into observed Store/selectors at one snapshot version.',
 'createHolding':'Resolve exact instrument exchange or confirmed gold profile; add catalogId/profileConfirmedVersion; luong -> chi x10 with original unit evidence. quantityDate -> movement date; declaration does not post cash; missing cost stays null.',
 'previewHolding':'Observed expiry epoch -> RFC3339; preserve exact identity, versions and quantity. Target preview digest and confirmation binding required.',
 'confirmHolding':'Retain preview digest and bind token to mutation.previewToken; return only accepted target result then refetch projection.',
 'createEvent':'Date -> business_date; scalar amount -> numeric(18,0) after decimal validation. Transfer distinct accounts/atomic two legs + separate fee; oneLeg -> pending Review. Refund origin/limit checked under lock. Investment movement atomic with posted event.',
 'correctPostedEvent':'Exact reversal plus replacement, not UPDATE posted row; retain original semantic request/key through lost ACK.',
 'updateCategory':'Category annotation stored in version_history overlay; DTO event version is aggregate history version, not immutable events.version.',
 'recordPriceQuote':'Manual synthetic only. Price/FX/unit normalization and dated provenance; no ledger/quantity write; provider refresh remains worker+entitlement.',
 'ingestSourceEvidence':'Remove rawEvidence; produce allowlisted normalizedEvidence + parser/source provenance locally; raw notification/OTP must never cross API. matchedEventId requires same workspace.',
 'getEvidence':'Target has normalized evidence; remove dependency on rawText display and retain reason/reference/provenance.',
 'reviseSourceRecord':'New immutable source revision and correction preview; no overwrite of posted event.',
 'previewImport':'Target bounds 64KiB/1000 rows, selected<=100 versus observed 20 rows; use immutable staged rows/file+mapping digest; no production fixture controls.',
 'confirmImport':'Only selected valid row IDs in preview; accepted durable job differs from completed atomic posting. Keep original preview token/key; poll job separately.',
 'getImportJob':'Read is side-effect-free on target; worker advances durable job. Only completed state exposes committedEventIds/resultWorkspaceVersion.',
 'allocateGoal':'Earmark existing eligible cash across ALL goals under account lock; no planned-income funding or second asset/ledger posting. Funded projection pro-rata floor VND + stable remainder.',
 'releaseGoalAllocation':'Release earmark only; aggregate cross-goal funded projection refetched, no cash posting.',
 'markGoalAchieved':'Target rechecks currently funded>=target and owner-selected assessment; UI forecast is not authoritative cash.',
 'archiveGoal':'Preview releases active earmarks; actual cash remains unchanged.',
 'createGoal':'contributionSchedule is required/nullable; optional projection may remain absent under the canonical required list. Preserve percent-per-year assumptions; goal is not cash.',
 'updateGoal':'Nested goal projection/contributionSchedule follow the actual required/null rules (do not convert every optional field into required null); preserve object versions/history.',
 'createPlanItem':'Retain observed optional skipMonths; recurrence occurrence IDs need stable normalized form. Target plan does not post actual.',
 'updatePlanItem':'Retain skipMonths and recurrence version; linked actual eligibility checked without double counting.',
 'linkPlanActual':'Stable occurrenceId, plan/event versions; correct type/account/currency/time; one eligible actual link, no second posting.',
 'requestPriceRefresh':'Target holding selection authorized and bounded; foreground getState must not drive jobs. Poll getRefreshJob; coalesced/rate-limited/partial are explicit.',
 'searchInstruments':'Observed array -> target page shape; exact exchange+symbol identity. No guessed ticker.',
 'getGoldProfiles':'Observed array -> target page shape; product/purity/brand/region/source/side identity, chi unit.',
 'bindCollector':'Bind immutable owner/device/account; disable/recreate to retarget; target consent/binding-version/context required.',
 'revokeDevice':'Fence uploader and local quarantine; server revocation does not prove local queue erased or permission revoked.',
 'startAgentRun':'Freeze conversation/context/base versions; scripted mock is not LLM execution. Target budgets/steps/states and read-only tools required.',
 'answerAgentRun':'Observed input.body and Draft reply differ: collect answer text for outstanding question/version; target continues Run, then fetch draft. Form edit uses reviseDraft.',
 'cancelAgentRun':'Terminal compare-and-set + lease fence; cancelled response does not discard existing draft or confirm it.',
 'reviseDraft':'Observed one-goal body -> goals[ref]+items+links; preserve skipMonths/settings. runId nullable on manual drafts; target plan-only/multi-goal need future UI. Revise invalidates preview.',
 'reviseDraftByMessage':'Target supports bounded text revision; unsupported text asks owner; no tool confirm authority.',
 'refreshDraft':'Explicit rebase with diff; never silently replace captured base versions/constraints.',
 'previewPlanningDraft':'Separate frozen simulation and preview; bind body digest/base versions/TTL; actual money unchanged.',
 'confirmPlanningDraft':'Target reply is still a Draft DTO: adapt bundled body, nullable runId, revisions/timestamps and confirmedIds; retain digest/token/key and object versions. Atomic goals+plans+links+history+preview consumption+idempotency; no actual posting.',
 'sendAssistantMessage':'Target message modes/refs, captured context and async state; same history across chat/panel/Plan; no authority from user text.',
 'signIn':'Observed identity returns bare Zod DTO and mock session header; target versioned envelope + synthetic cookie/session policy, CSRF/origin controls; .test identities only.',
 'signOut':'Clear observed in-memory/cache state; target revokes server session family as specified, separately quarantine native owner queue.'
}

ADMIN={'signIn':'adminSignIn','signOut':'adminSignOut','snapshot':'opsStatus','preview':'opsPreviewAction','confirm':'opsConfirmAction'}
BRIDGE={'getStatus':([], 'Read and validate local NativeStatus; ISO times/queue health are local observations, not proof of server state.'),
 'openNotificationSettings':([], 'Open Android OS settings; only the OS/user grants permission; no REST grants permission.'),
 'acceptDisclosure':(['requestDeviceEnrollment','registerDevice'],'Versioned local consent, then separate signed key proof enrollment; consent alone cannot enroll.'),
 'stopAndQuarantine':(['signOut','revokeDevice'],'Stop capture and quarantine immutable old-owner queue locally; optional server logout/revoke is a distinct action.'),
 'retryQueue':(['ingestNotifications'],'Same owner/device/binding/eventKey/revision/payload digest; delete only durable per-item ACKs, not merely HTTP202.'),
 'deleteQuarantined':([], 'Explicit reason/owner action deletes local encrypted outbox; no server endpoint and no server history erasure.'),
 'setSources':(['bindCollector','disableCollectorBinding'],'Local supported package allowlist plus explicit server binding; permission and account ownership cannot be inferred.')}

def dump(path,obj):path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def schema_fields(schema,doc,prefix='$',required=True):
 if '$ref' in schema:schema=doc['components']['schemas'][schema['$ref'].split('/')[-1]]
 result={prefix:{'required':required,**{k:v for k,v in schema.items() if k in ['type','enum','const','pattern','format','minimum','maximum','exclusiveMinimum','minLength','maxLength','minItems','maxItems','additionalProperties']}}}
 for key,child in schema.get('properties',{}).items():result.update(schema_fields(child,doc,prefix+'.'+key,key in schema.get('required',[])))
 if 'items' in schema:result.update(schema_fields(schema['items'],doc,prefix+'[]'))
 for union in ['oneOf','anyOf','allOf']:
  for i,child in enumerate(schema.get(union,[])):result.update(schema_fields(child,doc,prefix+'|'+union+str(i)))
 return result

def consumer_mapping(root,doc,observed,evidence):
 ops={v['post']['operationId']:v['post'] for v in doc['paths'].values()};ast=json.loads((evidence/'consumer-ast.json').read_text(encoding='utf-8'))['rows']
 rows=[];diffs=[];covered=set()
 for group in ['v1','identity','v2']:
  for name,value in observed[group].items():
   path='finweave-web/src/contracts/'+{'v1':'operations','identity':'identity','v2':'operational'}[group]+'.ts'
   service='finweave-web/src/services/'+('operational.ts' if group=='v2' else 'api.ts')
   status='NEEDS_ADAPTER';targets=[name] if name in ops else []
   transform=BASE+' '+SPECIAL.get(name,'Preserve business semantics in semantics.md/lifecycles.md; target fields are authoritative.')
   if name=='getState':
    status='SYNTHETIC_MOCK';targets=['listDevices','listCollectorBindings','listSourceSupport','listReceipts','listRefreshJobs','listAgentRuns','listPlanningDrafts'];transform='Split aggregate fixture state into paginated target reads; remove mock advance side effects; durable workers own progress. Daily schedule is server policy, synthetic flag is not production evidence.'
   elif name in ['registerExampleDevice','testCollector']:
    status='SYNTHETIC_MOCK';transform=doc['x-finweave-nonproduction-aliases'][name]+'; NO production endpoint mapping. Use separately reviewed enrollment/ingestion flows after native implementation.'
   opdiff=[]
   if len(targets)==1:
    for direction in ['input','output']:
     old=schema_fields(value[direction],doc);new=schema_fields(doc['components']['schemas'][name+direction.title()],doc)
     for field in sorted(set(old)|set(new)):
      if old.get(field)!=new.get(field):opdiff.append({'direction':direction,'field':field,'observed':old.get(field),'target':new.get(field),'action':'validate and adapt explicitly; added required values need authorized context; unsupported values reject'})
   diffs.append({'source':group+':'+name,'targetOperations':targets,'semanticTransform':transform,'fieldDifferences':opdiff})
   calls=[r for r in ast if r['operation']==name and r['kind'] in ['literal_call','operation_reference']]
   refs=';'.join(sorted({r['file']+':'+str(r['line'])+' '+r['kind'] for r in calls}))
   symbol={'v1':'operations','identity':'identityOperations','v2':'v2Operations'}[group]+'.'+name
   rows.append({'consumer':'user web / Android user shell','sourcePath':path,'sourceSymbol':symbol,'servicePath':service,'observedVersion':'1.1.0' if group!='v2' else '2.0.0 operational mock', 'currentTransport':'/__mock/v2/operational' if group=='v2' else '/__mock/v1/'+('identity/' if group=='identity' else 'logical/')+name,'targetOperations':','.join(targets),'status':status,'sourceReferences':refs or 'declaration only; dynamic typed dispatch available','fieldDiffKey':group+':'+name,'transformations':transform,'permission':'server-derived owner/workspace/object; device only after enrollment'})
   covered.update(targets)
 for name,target in ADMIN.items():
  covered.add(target)
  empty={'type':'object','properties':{},'additionalProperties':False}
  input_schema=observed['admin']['OpsAction'] if name=='preview' else observed['admin']['OpsPreview'] if name=='confirm' else empty
  output_schema=observed['admin'][{'signIn':'AdminSession','snapshot':'OpsSnapshot','preview':'OpsPreview','confirm':'OpsSnapshot'}[name]] if name!='signOut' else {'type':'null'}
  opdiff=[]
  for direction,s in [('input',input_schema),('output',output_schema)]:
   old=schema_fields(s,doc);new=schema_fields(doc['components']['schemas'][target+direction.title()],doc)
   for field in sorted(set(old)|set(new)):
    if old.get(field)!=new.get(field):opdiff.append({'direction':direction,'field':field,'observed':old.get(field),'target':new.get(field),'action':'extract/restructure via reviewed gateway adapter; credentials are explicit owner/admin input, no synthetic defaults'})
  transform='Separate admin cookie/MFA; wrap target envelope; signIn() has no credentials now: collect email/password/mfaCode for target; epoch expiresAt -> RFC3339; free reason -> allowlisted reason code (no finance text). opsStatus retains bounded aggregate metadata snapshot; opsList* support separate pagination. Preview input/action -> action DTO; confirm extracts previewToken/digest/expectedOpsVersion + mutation key; target confirms opsVersion/auditId/objectId then refetches snapshot instead of returning mock OpsSnapshot. Replace JSON.stringify digest with canonical JSON per semantics; replay immutable result before version checks. '+BASE
  diffs.append({'source':'admin:'+name,'targetOperations':[target],'semanticTransform':transform,'fieldDifferences':opdiff})
  rows.append({'consumer':'admin web','sourcePath':'finweave-web/admin/api.ts','sourceSymbol':'SyntheticOperationsGateway.'+name,'servicePath':'finweave-web/admin/api.ts','observedVersion':'admin Zod prototype','currentTransport':'in-memory gateway','targetOperations':target,'status':'NEEDS_ADAPTER','sourceReferences':';'.join(r['file']+':'+str(r['line']) for r in ast if r['symbol']=='adminGateway.'+name),'fieldDiffKey':'admin:'+name,'transformations':transform,'permission':'server-assigned admin, metadata only; no user finance grant'})
 for name,(targets,transform) in BRIDGE.items():
  covered.update(targets)
  rows.append({'consumer':'Android native bridge','sourcePath':'finweave-web/src/native/collector.ts','sourceSymbol':'Bridge.'+name,'servicePath':'finweave-web/src/native/collector.ts','observedVersion':'TypeScript interface; no Kotlin/Gradle implementation','currentTransport':'Capacitor FinWeaveCollector local capability','targetOperations':','.join(targets),'status':'LOCAL_NATIVE_CAPABILITY','sourceReferences':';'.join(r['file']+':'+str(r['line']) for r in ast if r['kind']=='native_bridge_call' and r['operation']==name),'fieldDiffKey':'native:'+name,'transformations':transform+' Native Keystore/outbox/worker/device PoC NOT RUN. Local operation is not a REST endpoint.','permission':'Android OS/user consent + immutable owner/device epoch; server checks live binding'})
 for name,op in ops.items():
  if name in covered:continue
  actor=op['x-finweave']['actor'];internal=actor in ['worker','scheduler']
  rows.append({'consumer':'scheduler/internal operations' if internal else 'target integration gap','sourcePath':'docs/contracts/v2/openapi.json','sourceSymbol':name,'servicePath':'none; backend absent','observedVersion':'target 2.0.0','currentTransport':'not implemented','targetOperations':name,'status':'MISSING','sourceReferences':'canonical declaration only','fieldDiffKey':'target:'+name,'transformations':('Implement private service identity, timestamp/nonce/digest, lease/fence/attempt<=3 and durable atomic results; purge returns unavailable until narrow retention procedure is reviewed. ' if internal else 'Target-only capability; add reviewed consumer adapter when needed. No claim a UI button must call this endpoint. ')+BASE,'permission':op['x-finweave']['authorization']})
 for consumer,path,symbol,status,transport,transform in [
  ('synthetic controls','finweave-web/src/services/api.ts','syntheticControl','SYNTHETIC_MOCK','/__mock/v1/control','Only reset/fault/advance/sourceScenario fixture controls; no production endpoints and no production reset operation.'),
  ('local planning preview','finweave-web/src/services/presentation.ts','simulatePlanningDraft','SYNTHETIC_MOCK','local applyCommand/forecast','Local preview invoked by ActionForm plus named previewAction; same symbol as target operation does not mean an HTTP call. Number-based forecast and UI15-digit bound do not establish decimal ledger correctness. Target Engine/oracle remains backend work.'),
  ('Android Back capability','finweave-web/src/native/collector.ts','installAndroidBackHandler','LOCAL_NATIVE_CAPABILITY','Capacitor App.addListener/backButton','Blur input, dismiss modal or browser history locally; no API and no OS permission grant.'),
  ('legacy demo URL','finweave-web/src/mocks/handlers.ts','/demo/*','RETIRED_REDIRECT','mock HTTP410','Retired synthetic route; do not expose in production or redirect arbitrary demo calls to finance operations.')]:
  rows.append({'consumer':consumer,'sourcePath':path,'sourceSymbol':symbol,'servicePath':path,'observedVersion':'selected working tree','currentTransport':transport,'targetOperations':'','status':status,'sourceReferences':symbol,'fieldDiffKey':'local:'+symbol,'transformations':transform,'permission':'local/synthetic only; no server authority'})
 rows.append({'consumer':'user navigation','sourcePath':'finweave-web/src/app/App.tsx','sourceSymbol':'/home/reports redirect','servicePath':'finweave-web/src/services/api.ts','observedVersion':'current working tree','currentTransport':'React router local redirect','targetOperations':'getOverview,getSpendingReport,getPortfolio','status':'RETIRED_REDIRECT','sourceReferences':'route redirect, no separate report navigation','fieldDiffKey':'local:reports','transformations':'Preserve report capabilities in Home projections; navigation redirect does not retire business report operations.','permission':'owner read scope'})
 dump(evidence/'consumer-field-differences.json',diffs)
 return rows
