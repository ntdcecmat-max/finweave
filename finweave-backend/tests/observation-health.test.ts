import {test} from 'node:test';
import assert from 'node:assert/strict';
import {observationHealth} from '../scripts/observation-health.ts';
const day=86400000,now=Date.parse('2026-10-20T12:00:00Z'),start=new Date(now-7*day).toISOString();
const samples=()=>Array.from({length:8},(_,i)=>({sampledAt:new Date(now-(7-i)*day).toISOString(),localDay:'2026-10-'+(13+i),sourceHash:'source',services:{ingestion:{healthy:true},market:{healthy:true}},metrics:{failed:0,dailyMissed:0,schedulerOverdue:0,coverageMissing:0,staleQuotes:0}}));
test('seven days requires a healthy source-bound window, independent from fresh quote UAT',()=>{const s=samples();assert.equal(observationHealth(s,start,now,'source').accepted,true);s[4]!.metrics.staleQuotes=2;const q=observationHealth(s,start,now,'source');assert.equal(q.accepted,true);assert.equal(q.quoteFreshnessAccepted,false);});
test('elapsed days cannot hide a dead worker, missed job or changed source',()=>{for(const alter of [(s:ReturnType<typeof samples>)=>s[3]!.services.market.healthy=false,(s:ReturnType<typeof samples>)=>s[3]!.metrics.dailyMissed=1,(s:ReturnType<typeof samples>)=>s[3]!.sourceHash='different']){const s=samples();alter(s);assert.equal(observationHealth(s,start,now,'source').accepted,false);}});
test('missing dates, long gaps, future samples and insufficient elapsed time fail closed',()=>{const s=samples();assert.equal(observationHealth(s.slice(2),start,now,'source').accepted,false);assert.equal(observationHealth(s,new Date(now-6*day).toISOString(),now,'source').accepted,false);s.push({...s[0]!,sampledAt:new Date(now+day).toISOString()});assert.equal(observationHealth(s,start,now,'source').accepted,false);});
test('old unhealthy history remains recorded but a later clean rolling window can qualify',()=>{const s=samples();s.unshift({...s[0]!,sampledAt:new Date(now-9*day).toISOString(),services:{ingestion:{healthy:false},market:{healthy:false}}});assert.equal(observationHealth(s,new Date(now-9*day).toISOString(),now,'source').accepted,true);});
test('a new observation is pending without inventing a gap before it started',()=>{const q=observationHealth(samples().slice(4),new Date(now-3*day).toISOString(),now,'source');assert.equal(q.accepted,false);assert.equal(q.maxGapHours,24);assert.equal(q.reasons.includes('SAMPLE_GAP_OVER_26_HOURS'),false);});
test('historical cumulative misses do not permanently poison a later healthy window or permit counter resets',()=>{
 const s=samples();for(const row of s)row.metrics.dailyMissed=15;
 const q=observationHealth(s,start,now,'source');assert(q.accepted);assert.equal(q.missedCountAtWindowStart,15);assert(q.noNewMisses);
 s[5]!.metrics.dailyMissed=16;assert(!observationHealth(s,start,now,'source').accepted);
 s[5]!.metrics.dailyMissed=0;assert(!observationHealth(s,start,now,'source').accepted);
});
