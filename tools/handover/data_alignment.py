"""Reviewed domain dependencies and explicit field storage transformations.

Dependencies include reads and writes; they are neither grants nor a promise that
every listed table is written. Shared infrastructure is described separately.
"""
import csv,json
from alignment import schema_fields

GROUPS=[
 ('getPresentationSnapshot getOverview getSpendingReport getPortfolio getInsights', 'accounts ledger_accounts events entry_groups posting_lines holdings holding_movements instruments gold_profiles quote_observations sources evidence event_evidence reviews coverage_gaps snapshots financial_plans plan_items actual_links goals goal_allocations plan_goal_links'),
 ('getImportTemplate', 'accounts holdings instruments gold_profiles'),
 ('getSession getWorkspace updateTrackingSettings', 'identities sessions workspaces snapshots'),
 ('listAccounts getAccount createAccount archiveAccount recordCashCount', 'accounts ledger_accounts events entry_groups posting_lines evidence reviews cash_observations collector_bindings plan_items snapshots'),
 ('listHoldings getHolding createHolding updateHoldingQuantity updateHoldingCost listHoldingMovements listPriceQuotes recordPriceQuote searchInstruments getGoldProfiles previewHolding confirmHolding requestPriceRefresh getRefreshJob listRefreshJobs', 'holdings holding_movements quote_observations refresh_jobs instruments gold_profiles provider_entitlements snapshots'),
 ('listTransactions getTransaction createEvent updateDraft correctPostedEvent updateCategory postDraft linkRefund', 'accounts ledger_accounts events entry_groups posting_lines holdings holding_movements evidence event_evidence source_records reviews snapshots'),
 ('ingestSourceEvidence reviseSourceRecord listSources refreshSource disconnectSource reconnectSource getEvidence', 'sources source_records evidence event_evidence devices collector_bindings ingestion_receipts receipt_evidence coverage_gaps accounts events entry_groups posting_lines reviews snapshots'),
 ('previewImport confirmImport getImportJob listImportJobs', 'import_previews import_jobs accounts holdings instruments gold_profiles source_records evidence events entry_groups posting_lines holding_movements reviews snapshots'),
 ('listReviewCases getReviewCase resolveReviewCase', 'reviews accounts events entry_groups posting_lines source_records evidence event_evidence cash_observations holdings holding_movements snapshots'),
 ('listPlanItems createPlanItem updatePlanItem archivePlanItem getPlanForecast linkPlanActual unlinkPlanActual listGoals getGoalProgress createGoal updateGoal allocateGoal releaseGoalAllocation markGoalAchieved archiveGoal simulateGoalOutcome listSimulations getSimulation', 'financial_plans plan_items actual_links goals plan_goal_links goal_allocations simulations accounts ledger_accounts posting_lines events holdings holding_movements quote_observations snapshots'),
 ('listConversations createConversation getConversation listMessages sendAssistantMessage getAssistantMessage cancelAssistantMessage startAgentRun answerAgentRun cancelAgentRun reviseDraft reviseDraftByMessage refreshDraft previewPlanningDraft getAgentRun listAgentRuns getPlanningDraft listPlanningDrafts createPlanningDraft discardPlanningDraft simulatePlanningDraft getToolResult', 'conversations messages agent_runs planning_drafts tool_results simulations snapshots financial_plans plan_items goals plan_goal_links goal_allocations accounts posting_lines'),
 ('confirmPlanningDraft', 'planning_drafts conversations messages agent_runs tool_results financial_plans plan_items goals plan_goal_links goal_allocations accounts posting_lines snapshots'),
 ('previewMutation', 'proposal_previews snapshots accounts events entry_groups posting_lines holdings holding_movements quote_observations reviews sources source_records evidence financial_plans plan_items actual_links goals plan_goal_links goal_allocations simulations'),
 ('signIn registerIdentity verifyIdentityChallenge requestPasswordReset resetIdentityPassword signOut listSessions renewSession revokeSession listWorkspaces createWorkspace', 'identities sessions identity_challenges workspaces'),
 ('registerDevice requestDeviceEnrollment listDevices listCollectorBindings disableCollectorBinding listSourceSupport bindCollector revokeDevice getReceipt listReceipts getSyncState', 'identities sessions workspaces devices collector_bindings accounts sources ingestion_receipts receipt_evidence source_records evidence coverage_gaps'),
 ('ingestNotifications', 'devices collector_bindings ingestion_receipts receipt_evidence evidence sources source_records coverage_gaps'),
 ('adminSignIn adminSignOut', 'identities sessions'),
 ('opsStatus', 'ops_accounts ops_sources ops_jobs ops_quotas ops_releases ops_incidents ops_audit'),
 ('opsListAccounts','ops_accounts'),('opsListSources','ops_sources'),('opsListJobs','ops_jobs'),('opsListQuotas','ops_quotas'),('opsListReleases','ops_releases'),('opsListIncidents','ops_incidents'),('opsListAudit','ops_audit'),
 ('opsPreviewAction opsConfirmAction','ops_previews ops_idempotency ops_audit ops_jobs ops_sources'),
 ('dispatchJobs','ops_jobs ops_sources refresh_jobs import_jobs ingestion_receipts agent_runs provider_entitlements'),
 ('processIngestionReceipt','devices collector_bindings ingestion_receipts receipt_evidence sources source_records evidence event_evidence accounts ledger_accounts events entry_groups posting_lines holdings holding_movements reviews coverage_gaps snapshots'),
 ('executePriceRefresh','refresh_jobs provider_entitlements holdings instruments gold_profiles quote_observations snapshots ops_jobs ops_sources ops_quotas'),
 ('executeAgentStep','agent_runs conversations messages planning_drafts tool_results simulations snapshots financial_plans plan_items actual_links goals plan_goal_links goal_allocations accounts posting_lines holdings holding_movements quote_observations ops_quotas'),
]

def dependencies(doc,model):
 result={}
 for operations,tables in GROUPS:
  for operation in operations.split():
   assert operation not in result,operation
   result[operation]=tables.split()
 result['purgeExpiredData']=[t['name'] for t in model['tables']]
 assert set(result)=={v['post']['operationId'] for v in doc['paths'].values()}
 return result

# Each row is a reviewed domain transformation, not a heuristic by leaf name.
RULES=[
 ('createAccount','Input.opening.value','NORMALIZED','accounts','opening','Decimal string -> numeric(18,0), VND fixed; >=0. Zero opening creates no zero-amount event; positive opening produces balanced equity posting, excluded from income.'),
 ('createAccount','Input.openingDate','DIRECT','accounts','opening_date','Calendar date, no artificial midnight timezone.'),
 ('createEvent','Input.amount.value','NORMALIZED','events','amount','Positive decimal string -> numeric(18,0); not a balance. Balanced lines derived; account ownership locked.'),
 ('createEvent','Input.date','DIRECT','events','business_date','Calendar business date; report period [start,endExclusive).'),
 ('createEvent','Input.accountId','DIRECT','events','account_id','Tenant composite FK plus service authorization; client ID cannot grant access.'),
 ('createEvent','Input.toAccountId','DIRECT','events','to_account_id','Transfer-only branch; distinct from source account, atomic two legs; fee is separate event.'),
 ('createEvent','Input.originId','DIRECT','events','origin_id','Refund-only nullable origin; missing/ambiguous -> Review. Refund limits need lock/oracle, not just FK.'),
 ('createEvent','Input.quantity.value','NORMALIZED','holding_movements','quantity','Investment-only quantity input; normalize luong x10 to chi, share stays share. Store resulting movement with event in one transaction; delta/new quantity derived, not a blind overwrite.'),
 ('createEvent','Input.fee','COMMAND_PARAMETER','','','Transfer fee value object creates separate fee event/lines; no events.fee column.'),
 ('createEvent','Input.oneLeg','COMMAND_PARAMETER','','','One-leg evidence selects pending/Review; not a bool column and cannot be posted as balanced transfer without receiving evidence.'),
 ('correctPostedEvent','Input.amount.value','COMMAND_PARAMETER','','','Replacement amount for immutable reversal+replacement; never UPDATE old events.amount.'),
 ('updateCategory','Input.category','FROZEN_CONTEXT_RESULT','version_history','payload','event_category overlay; immutable posted event preserved. Public DTO version = aggregate annotation history version.'),
 ('recordCashCount','Input.observed.value','NORMALIZED','cash_observations','observed','Nonnegative VND -> numeric(18,0); observation/variance/Review does not post expense.'),
 ('createHolding','Input.cost','NORMALIZED','holdings','cost','Nullable Money.value -> nullable numeric(18,0); currency fixed VND. Null means unknown P/L, not zero.'),
 ('createHolding','Input.costDate','DIRECT','holdings','cost_date','Nullable calendar date; nonnull cost must have valid cost date by service rule.'),
 ('createHolding','Input.catalogId','NORMALIZED','holdings','instrument_id','Stock kind resolves exact global instrument; gold kind resolves gold_profile_id instead; XOR table CHECK. Name/market alone insufficient.'),
 ('createHolding','Input.profileConfirmedVersion','DIRECT','holdings','profile_confirmed_version','Nullable JSON safe version -> bigint; check exact resolved profile/version, no inferred confirmation.'),
 ('createHolding','Input.quantity.value','NORMALIZED','holding_movements','quantity','Decimal<=18+8 fits numeric(28,8); 28 total/8 scale allows20 integer, API restricts18. Normalize gold luong to chi, preserve provenance in evidence/history. Declaration does not post cash.'),
 ('createHolding','Input.quantityDate','DIRECT','holding_movements','business_date','Initial declaration is dated movement, not holdings.quantity column.'),
 ('recordPriceQuote','Input.price.value','NORMALIZED','quote_observations','price','Positive decimal string -> numeric(28,8); no cash/event/movement effects. Manual synthetic entitlement row required; no provider entitlement fabricated.'),
 ('recordPriceQuote','Input.price.currency','DIRECT','quote_observations','currency','VND/USD quote currency only; USD requires dated FX. Ledger remains VND.'),
 ('recordPriceQuote','Input.price.per','NORMALIZED','quote_observations','unit','Original share/chi/luong quote unit retained with conversion at valuation; compatible product/profile/side required.'),
 ('recordPriceQuote','Input.at','DIRECT','quote_observations','quote_as_of','RFC3339 instant -> timestamptz; fetched_at server acquisition time separately, not assumed identical.'),
 ('recordPriceQuote','Input.fxVndPerUsd','NORMALIZED','quote_observations','fx_vnd_per_usd','Nullable positive decimal -> numeric(28,8); missing FX yields unknown valuation, not zero.'),
 ('ingestNotifications','Input.items[].eventKey','DIRECT','ingestion_receipts','event_key','Stable logical transport identity, scoped workspace/device/revision. Not semantic duplicate test.'),
 ('ingestNotifications','Input.items[].revision','DIRECT','ingestion_receipts','revision','Integer safe JSON -> bigint >=0; new revision does not overwrite posted event.'),
 ('ingestNotifications','Input.items[].payloadDigest','DIRECT','ingestion_receipts','payload_digest','SHA256 normalized payload identity; changed digest for same key conflicts.'),
 ('ingestNotifications','Input.items[].normalizedEvidence','FROZEN_CONTEXT_RESULT','ingestion_receipts','normalized_evidence','Bounded validated normalized evidence JSONB; no raw/OTP. Durable receipt commit before202, later parsing/posting separate.'),
 ('ingestNotifications','Input.items[].bindingVersion','DIRECT','ingestion_receipts','binding_version','Snapshot of live binding version at acceptance; receipt identity immutable, service rechecks at processing.'),
 ('createPlanningDraft','Input.body','FROZEN_CONTEXT_RESULT','planning_drafts','body','Canonical nonempty goals/items/links bundle frozen JSONB + schema_ref; not actual tables until explicit confirm.'),
 ('reviseDraft','Input.body','FROZEN_CONTEXT_RESULT','planning_drafts','body','New revision/history and version increment, invalidate preview/simulation; preserve base snapshot.'),
 ('startAgentRun','Input.settings','FROZEN_CONTEXT_RESULT','agent_runs','settings','Forecast assumptions percent/year, months and VND/month explicitly; JSONB schema checked by service.'),
 ('sendAssistantMessage','Input.context','FROZEN_CONTEXT_RESULT','messages','captured_context','Capture route/period/scope/selected/refs at send; history never reinterpreted with current cache.'),
 ('confirmPlanningDraft','Input.token','COMMAND_PARAMETER','proposal_previews','token_digest','Hash token; equality with mutation.previewToken, owner/op/digest/versions/expiry/unused checked; consume atomically with bundle.'),
 ('confirmPlanningDraft','Input.digest','COMMAND_PARAMETER','proposal_previews','digest','Canonical JSON digest of body+base versions; confirm does not trust client financial result.'),
 ('allocateGoal','Input.amount.value','NORMALIZED','goal_allocations','amount','Positive VND->numeric(18,0), existing eligible cash only. Sum all goals under lock; no second asset or ledger posting.'),
 ('getGoalProgress','Output.funded.value','PROJECTION_ENGINE','','','Sum eligible existing cash allocation across goals; proportional floor VND and stable remainder. No goals.funded column.'),
 ('getOverview','Output.cash','PROJECTION_ENGINE','','','Snapshot projection from balanced posted lines; exclude draft/pending and distinguish missing from zero.'),
]

def storage_mapping(root,doc,model):
 tables={t['name']:{c['name'] for c in t['columns']} for t in model['tables']};rows=[]
 for op,field,category,table,column,transform in RULES:
  direction,path=field.split('.',1);schema=doc['components']['schemas'][op+direction]
  fields=schema_fields(schema,doc,prefix=direction)
  import re
  candidates=[k for k in fields if re.sub(r'\|(?:oneOf|anyOf|allOf)\d+','',k)==field]
  assert candidates,(op,field)
  if table:assert column in tables[table],(op,table,column)
  rows.append({'operation':op,'apiField':field,'classification':category,'table':table,'column':column,'canonicalPaths':';'.join(candidates),'transformation':transform,'authority':'canonical schema + semantics.md + physical-model + SRS/BR; runtime NOT RUN'})
 with (root/'docs/contracts/v2/storage-field-mapping.csv').open('w',newline='',encoding='utf-8') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 return rows
