interface Sample {sampledAt:string;localDay:string;sourceHash:string;services:Record<string,{healthy:boolean}>;metrics:Record<string,unknown>;}
export function observationHealth(samples:Sample[],startedAt:string,now:number,sourceHash:string) {
 const day=86400000,start=Date.parse(startedAt),windowStart=now-7*day;
 const invalid=samples.some(s=>!Number.isFinite(Date.parse(s.sampledAt))||Date.parse(s.sampledAt)>now);
 const sorted=samples.filter(s=>Number.isFinite(Date.parse(s.sampledAt))&&Date.parse(s.sampledAt)<=now).sort((a,b)=>Date.parse(a.sampledAt)-Date.parse(b.sampledAt));
 const baseline=sorted.filter(s=>Date.parse(s.sampledAt)<=windowStart).at(-1);
 const window=[...(baseline?[baseline]:[]),...sorted.filter(s=>Date.parse(s.sampledAt)>windowStart)];
 const evaluatedFrom=Number.isFinite(start)?Math.max(windowStart,start):windowStart;
 const times=[evaluatedFrom,...window.map(s=>Math.max(evaluatedFrom,Date.parse(s.sampledAt))),now].sort((a,b)=>a-b);
 const maxGapHours=Math.max(0,...times.slice(1).map((t,i)=>(t-times[i]!)/3600000));
 const days=new Set(window.map(s=>s.localDay)).size;
 // dailyMissed is a lifetime counter. Preserve historical misses, but qualify
 // a rolling window on no NEW misses; never reset the underlying counter.
 const initialMissed=window[0]?.metrics?.dailyMissed;
 const noNewMisses=Number.isSafeInteger(initialMissed)&&Number(initialMissed)>=0&&window.every(s=>s.metrics?.dailyMissed===initialMissed);
 const healthy=window.length>0&&noNewMisses&&window.every(s=>s.sourceHash===sourceHash&&s.services?.ingestion?.healthy===true&&s.services?.market?.healthy===true&&['failed','schedulerOverdue','coverageMissing'].every(k=>s.metrics?.[k]===0));
 const reasons:string[]=[];
 if(!Number.isFinite(start)||start>windowStart)reasons.push('LESS_THAN_SEVEN_ELAPSED_DAYS');
 if(invalid)reasons.push('INVALID_OR_FUTURE_SAMPLE');
 if(days<8)reasons.push('FEWER_THAN_EIGHT_OBSERVED_LOCAL_DATES');
 if(maxGapHours>26)reasons.push('SAMPLE_GAP_OVER_26_HOURS');
 if(!healthy)reasons.push('UNHEALTHY_MISSING_OR_SOURCE_CHANGED_SAMPLE');
 return {accepted:reasons.length===0,windowStart:new Date(windowStart).toISOString(),evaluatedFrom:new Date(evaluatedFrom).toISOString(),windowSamples:window.length,observedDays:days,maxGapHours,reasons,missedCountAtWindowStart:initialMissed??null,noNewMisses,quoteFreshnessAccepted:window.length>0&&window.every(s=>s.metrics?.staleQuotes===0)};
}
