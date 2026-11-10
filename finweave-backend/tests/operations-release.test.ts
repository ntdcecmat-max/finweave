import assert from 'node:assert/strict';
import test from 'node:test';
import { requireGates,rollbackCompatible,realPromotion } from '../src/runtime/operations-release.ts';
test('release gates reject missing/skipped/cancelled/stale/wrong-source and artifact evidence',()=>{
  const good={id:'runtime',status:'PASS',sourceDigest:'source',artifactDigest:'artifact',finishedAt:new Date().toISOString(),scope:'synthetic'};
  requireGates([good],['runtime'],'source','artifact');
  for(const bad of [{status:'SKIPPED'},{status:'CANCELLED'},{sourceDigest:'other'},{artifactDigest:'other'},{finishedAt:'2020-01-01T00:00:00Z'},{finishedAt:'invalid'}])assert.throws(()=>requireGates([{...good,...bad}],['runtime'],'source','artifact'));
  assert.throws(()=>requireGates([],['runtime'],'source','artifact'));assert.throws(()=>requireGates([good,good],['runtime'],'source','artifact'));assert.throws(()=>requireGates([good],[],'source','artifact'));
});
test('unknown compatibility fails closed, real promotion remains denied',()=>{
  assert(rollbackCompatible({db:'1',jobs:'2',payload:'3',keys:'4',api:'5',native:'6'},{db:'1',jobs:'2',payload:'3',keys:'4',api:'5',native:'6'}));
  for(const candidate of [{db:'1'},{db:'2',jobs:'2',payload:'3',keys:'4',api:'5',native:'6'}] as Record<string,string>[])assert.throws(()=>rollbackCompatible({db:'1',jobs:'2',payload:'3',keys:'4',api:'5',native:'6'},candidate));
  assert.throws(realPromotion,/REAL_GATES_UNSATISFIED/);
});
