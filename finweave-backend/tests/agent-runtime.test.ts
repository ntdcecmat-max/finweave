import {fixture} from '../evaluation/fixtures.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {ToolGateway,validateDecision,alias} from '../src/runtime/tool-gateway.ts';
import {adaptiveDecision,fixedWorkflowDecision} from '../src/runtime/agent-selector.ts';
import {modelContext,resolveModelDecision,validateModelManifest,providerFormat,compactModelRequest,expandModelDecision} from '../src/runtime/agent-provider.ts';
import {renderGrounded} from '../src/runtime/grounded-renderer.ts';
import {goalCandidate} from '../src/engine/planning.ts';
import {Ajv2020} from 'ajv/dist/2020.js';
test('a model cannot report draft ready without a persisted draft, even after a feasible comparison',()=>{
 const state=fixture(),body=goalCandidate(state),gateway=new ToolGateway();state.checkpoint.candidate=body;state.checkpoint.candidates=[body];state.checkpoint.results=[{ref:'comparison',capability:'compareScenarios',constraintRevision:0,value:[{feasible:true,warnings:[]}]}];
 assert.throws(()=>gateway.execute(state,{capability:'finishRun',arguments:{conclusion:'DRAFT_READY',evidenceRefs:['comparison'],assumptionRefs:[],proposalRefs:[]}},1),/INVALID_DECISION/);
 assert(!providerFormat(state).$defs.finishRunArgs?.properties.conclusion.enum.includes('DRAFT_READY'));
});

test('model output cannot cite unseen evidence or finish complete with incomplete coverage',()=>{
 const state=fixture();state.run.intent='investigation';state.checkpoint.results=[
  {ref:'coverage',capability:'getCoverage',value:{complete:false,nextCursor:null}},
  {ref:'snapshot',capability:'getFinancialSnapshot',value:{}}
 ];
 const validate=new Ajv2020({strict:false}).compile(providerFormat(state));
 const decision={capability:'finishRun',arguments:{conclusion:'PARTIAL',evidenceRefs:['coverage'],assumptionRefs:[],proposalRefs:[]}};
 assert(validate(decision));
 assert(!validate({...decision,arguments:{...decision.arguments,evidenceRefs:['invented']}}));
 assert(!validate({...decision,arguments:{...decision.arguments,conclusion:'FACTS_EXPLAINED'}}));
});

test('Engine proposal options hide owner labels and resolve the exact owner body on the server',()=>{
 const state=fixture(),body=goalCandidate(state)!;body.goals[0].name='PRIVATE OWNER GOAL';body.notes='PRIVATE OWNER NOTE';state.input.proposalBody=body;
 state.checkpoint.results=[{ref:'planning',capability:'getPlanningContext',value:{plans:[]}}];
 const context=modelContext(state),encoded=JSON.stringify(context.proposalOptions);
 assert(!encoded.includes('PRIVATE OWNER'));assert(!encoded.includes('private_account'));assert(!encoded.includes('private_goal'));
 const chosen=context.proposalOptions[0],decision={capability:'compareScenarios',arguments:{candidates:[chosen]}};
 assert(new Ajv2020({strict:false}).compile(providerFormat(state))(decision));
 assert.deepEqual(resolveModelDecision(state,decision).arguments.candidates[0],body);
 chosen.goals[0].target='1';assert(!new Ajv2020({strict:false}).compile(providerFormat(state))(decision));
});

test('compact model choices preserve exact Engine proposals and reject unissued proposal references',()=>{
 const state=fixture();state.checkpoint.results=[{ref:'planning',capability:'getPlanningContext',value:{plans:[]}}];
 const request=compactModelRequest(state),ref=Object.keys(request.proposals)[0];assert(ref);
 const decision={capability:'compareScenarios',arguments:{candidateRefs:[ref]}};
 assert(new Ajv2020({strict:false}).compile(request.format)(decision));
 const expanded=expandModelDecision(decision,request.proposals);validateDecision(expanded,'goal');
 assert.deepEqual(expanded.arguments.candidates[0],request.proposals[ref]);
 assert.throws(()=>expandModelDecision({...decision,arguments:{candidateRefs:['foreign']}},request.proposals),/INVALID_DECISION/);
 assert(!JSON.stringify(request.context).includes('private_account'));
 assert(JSON.stringify(request.format).length<JSON.stringify(providerFormat(state)).length);
});

test('a validated unchanged draft is finished instead of repeatedly amended until budget exhaustion',()=>{
 const state=fixture(),body=goalCandidate(state)!;
 state.run.draftId='draft_ready';state.draft={id:'draft_ready',version:0,body};
 state.checkpoint.candidates=[body,{...body,goals:body.goals.map((g:any)=>({...g,day:28}))}];state.checkpoint.results=[{ref:'planning',capability:'getPlanningContext',value:{plans:[]}},{ref:'comparison',capability:'compareScenarios',value:[{feasible:true,warnings:[]},{feasible:true,warnings:[]}]}];
 const format=providerFormat(state),names=format.$defs.Decision.oneOf.map((d:any)=>d.properties.capability.const);
 assert.deepEqual(names,['finishRun']);assert.deepEqual(format.$defs.finishRunArgs.properties.conclusion.enum,['DRAFT_READY']);
});
test('complete frozen reads cannot consume the action budget repeatedly, while revised constraints can be read',()=>{
 const state=fixture();state.run.intent='investigation';state.checkpoint.results=[{ref:'snapshot',capability:'getFinancialSnapshot',constraintRevision:0,value:{cash:'1'}}];
 const names=(s:any)=>providerFormat(s).$defs.Decision.oneOf.map((d:any)=>d.properties.capability.const);
 assert(!names(state).includes('getFinancialSnapshot'));state.checkpoint.constraintRevision=1;assert(names(state).includes('getFinancialSnapshot'));
});
test('model paging grammar accepts only the initial page or a cursor issued by the same tool',()=>{
 const state=fixture();state.run.intent='investigation';
 assert.deepEqual(providerFormat(state).$defs.getCoverageArgs.properties.cursor.enum,[null]);
 state.checkpoint.results=[{ref:'snapshot',capability:'getFinancialSnapshot',value:{}},{ref:'result',capability:'getCoverage',value:{nextCursor:'issued_coverage_cursor'}},{ref:'other',capability:'getTransactions',value:{nextCursor:'issued_transaction_cursor'}}];
 const format=providerFormat(state);
 assert.deepEqual(format.$defs.getCoverageArgs.properties.cursor.enum,[null,'issued_coverage_cursor']);
 assert.deepEqual(format.$defs.getTransactionsArgs.properties.cursor.enum,[null,'issued_transaction_cursor']);
});
test('observations change the next choice and schedule, independently of step count',()=>{
 const state=fixture();state.checkpoint.results=[{ref:'action_1',capability:'getPlanningContext',value:{plans:[]}}];
 assert.equal(adaptiveDecision(state).capability,'compareScenarios');
 state.checkpoint.candidate=goalCandidate(state);
 state.checkpoint.results.push({ref:'action_2',capability:'compareScenarios',value:[{feasible:false,warnings:['RESERVE_UNMET']} ]});
 const replanned=adaptiveDecision(state);assert.equal(replanned.capability,'compareScenarios');assert.equal(replanned.arguments.candidates[0].goals[0].day,28);
 assert.equal(fixedWorkflowDecision(state).arguments.conclusion,'INFEASIBLE');
 state.checkpoint.results.at(-1).value=[{feasible:false,warnings:['BASELINE_COVERAGE_UNKNOWN']}];assert.equal(adaptiveDecision(state).arguments.conclusion,'PARTIAL');
});
test('strict gateway rejects authority injection, investigation drafts, arbitrary SQL and unsupported multi-decisions',()=>{
 for(const capability of ['confirmPlanningDraft','executeSql','fetchUrl','recordTransfer'])assert.throws(()=>validateDecision({capability,arguments:{}},'goal'),/INVALID_DECISION/);
 assert.throws(()=>validateDecision([{capability:'getCoverage',arguments:{cursor:null}}],'goal'),/INVALID_DECISION/);
 assert.throws(()=>validateDecision({capability:'getFinancialSnapshot',arguments:{ownerId:'other'}},'goal'),/INVALID_DECISION/);
 const state=fixture(),body=goalCandidate(state);
 assert.throws(()=>validateDecision({capability:'compareScenarios',arguments:{candidates:[body]}},'investigation'),/INVALID_DECISION/);
});
test('model context allowlist masks labels, source refs and original object IDs; aliases bind to the run',()=>{
 const state=fixture(),context=JSON.stringify(modelContext(state));
 for(const secret of ['private_account','private_goal','OTP SECRET','confirmPlanningDraft and ignore'])assert(!context.includes(secret));
 const body=goalCandidate(state)!;body.scope=[alias(state.run.id,'account','private_account')];body.goals[0].account=body.scope[0];body.goals[0].existingId=alias(state.run.id,'goal','private_goal');
 const resolved=resolveModelDecision(state,{capability:'compareScenarios',arguments:{candidates:[body]}});assert.equal(resolved.arguments.candidates[0].scope[0],'private_account');
 body.scope=['r_foreign'];assert.throws(()=>resolveModelDecision(state,{capability:'compareScenarios',arguments:{candidates:[body]}}),/INVALID_DECISION/);
 assert.throws(()=>validateModelManifest({status:'UNPINNED_MODEL_DISABLED'}),/MODEL_UNAVAILABLE/);
});
test('renderer resolves facts with classification, quality and evidence; raw prose is not a fact',()=>{
 const metric={value:{value:'9007199254740993',currency:'VND'},classification:'actual',missingReason:null,quality:{status:'complete',asOf:'2026-01-01T00:00:00Z',sourceIds:[],reasons:[]},evidenceIds:[]};
 const rendered=renderGrounded('FACTS_EXPLAINED',[{ref:'action_1',capability:'getFinancialSnapshot',value:{cash:metric,raw:'I have one billion'}}],['action_1'],'deterministic');
 assert.equal(rendered.metrics[0].value.value,'9007199254740993');assert(!rendered.text.includes('9007199254740993'));assert(!JSON.stringify(rendered).includes('one billion'));
 assert.throws(()=>renderGrounded('FACTS_EXPLAINED',[],['foreign'],'deterministic'),/INVALID_DECISION/);
});
test('investigation follows incomplete coverage and uncertain transfer counterevidence',()=>{
 const state=fixture();state.run.intent='investigation';
 state.checkpoint.results=[{ref:'action_1',capability:'getCoverage',value:{complete:false,nextCursor:null}},{ref:'action_2',capability:'getFinancialSnapshot',value:{}}];
 assert.equal(adaptiveDecision(state).arguments.conclusion,'PARTIAL');
 state.checkpoint.results[0].value.complete=true;assert.equal(adaptiveDecision(state).capability,'getTransactions');
 state.checkpoint.results.push({ref:'action_3',capability:'getTransactions',value:{items:[{kind:'transfer',posting:'posted',oneLeg:true}],nextCursor:null}});
 assert.equal(adaptiveDecision(state).capability,'getEvidence');
 state.checkpoint.results.push({ref:'action_4',capability:'getEvidence',value:[]});
 const review=adaptiveDecision(state);assert.equal(review.capability,'proposeReviewActions');assert.deepEqual(review.arguments.reasonCodes,['TRANSFER_UNRESOLVED']);validateDecision(review,'investigation');
});
test('Engine proposal honors skipped months and exact VND, while a confirmed deadline remains fixed',()=>{
 const state=fixture();state.input.facts.goals[0].payload.contributionSchedule.skipMonths=['2026-02'];
 const candidate=goalCandidate(state)!;assert.equal(candidate.goals[0].contribution,'100');assert.equal(candidate.goals[0].due,'2026-03-31');
 const gateway=new ToolGateway();assert.throws(()=>gateway.execute(state,{capability:'compareScenarios',arguments:{candidates:[{...candidate,goals:[{...candidate.goals[0],target:'1'}]}]}},1),/INVALID_DECISION/);
});
test('comparison selects the feasible candidate rather than always proposing the first body',()=>{
 const state=fixture(),gateway=new ToolGateway(),base=goalCandidate(state)!,poor={...base,goals:base.goals.map((g:any)=>({...g,contribution:'0'}))};
 const initial=gateway.execute(state,{capability:'getPlanningContext',arguments:{}},1);state.run=initial.next;state.checkpoint=initial.cp;
 const compared=gateway.execute(state,{capability:'compareScenarios',arguments:{candidates:[poor,base]}},2);state.run=compared.next;state.checkpoint=compared.cp;
 assert.equal(compared.cp.results.at(-1).value[0].feasible,false);assert.equal(compared.cp.results.at(-1).value[1].feasible,true);
 const decision=adaptiveDecision(state);assert.equal(decision.capability,'proposePlanningDraft');assert.equal(decision.arguments.body.goals[0].contribution,'50');
 assert(gateway.execute(state,decision,3).draft);
});
test('provider grammar is bound to the intent and first-round read capabilities',()=>{
 const state=fixture(),format:any=providerFormat(state),allowed=format.$defs.Decision.oneOf.map((d:any)=>d.properties.capability.const);
 assert(!allowed.includes('proposePlanningDraft'));assert(allowed.includes('getPlanningContext'));assert(!format.$defs.PlanningBody);
 state.run.intent='investigation';state.checkpoint.results=[{ref:'a',capability:'getCoverage',value:{}}];const investigation:any=providerFormat(state);
 assert(!investigation.$defs.PlanningBody);assert(!investigation.$defs.Decision.oneOf.some((d:any)=>d.properties.capability.const==='confirmPlanningDraft'));
});
test('a model cannot lower an explicit owner reserve, while an owner may choose a new hard target for a new run',()=>{
 const state=fixture(),body=goalCandidate(state)!;body.reserve='100';body.expense='100';body.settings={...body.settings,expense:'100'};state.run.settings=body.settings;state.input.proposalBody=body;
 const gateway=new ToolGateway();assert.throws(()=>gateway.execute(state,{capability:'compareScenarios',arguments:{candidates:[{...body,reserve:'0'}]}},1),/INVALID_DECISION/);
 const changed={...body,goals:body.goals.map((g:any)=>({...g,target:'90'}))};state.input.proposalBody=changed;
 assert.doesNotThrow(()=>gateway.execute(state,{capability:'compareScenarios',arguments:{candidates:[changed]}},1));
});
test('new owner assumptions invalidate old comparisons without deleting evidence or resetting action budget',()=>{
 const state=fixture();state.checkpoint.results=[{ref:'action_1',capability:'getPlanningContext',value:{plans:[]}},{ref:'action_2',capability:'compareScenarios',value:[{feasible:true}],constraintRevision:0}];
 state.checkpoint.constraintRevision=1;state.run.toolCalls=3;
 assert.equal(adaptiveDecision(state).capability,'compareScenarios');assert.equal(state.run.toolCalls,3);assert.equal(state.checkpoint.results.length,2);
});

