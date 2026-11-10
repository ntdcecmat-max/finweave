"""Specification decision calculator only: does not import product code or connect to DB/network."""
from pathlib import Path
from fractions import Fraction
from datetime import datetime,timedelta,timezone
import json
R=Path(__file__).resolve().parents[2];E=R/'docs/execution/evidence/arch-09-async-2026-10-09'

def solve(k,x):
    if k=='fence':return x['authorized'] and x['now']<x['leaseUntil'] and all(x[a]==x[b] for a,b in [('generation','expectedGeneration'),('token','expectedToken'),('epoch','expectedEpoch'),('domain','expectedDomain'),('workspace','expectedWorkspace'),('profile','expectedProfile')])
    if k=='retry':
      base=min(900000,5000*2**(x['attempt']-1));v=max(int(Fraction(base,2)*(1+Fraction(x['u']))),x['retryFloorMs'])
      return v if v<=x['deadlineMs'] else None
    if k=='ack':
      keys=[r[0] for r in x['reply']]
      if not x['bound'] or len(keys)!=len(set(keys)) or set(keys)!=set(x['request']):return []
      return [key for key,state in x['reply'] if state=='durable']
    if k=='dedupe':return ('REPLAY' if x['sameDigest'] else 'CONFLICT') if x['sameTransport'] else ('LINK_EXISTING' if x['trustedRef'] else 'REVIEW')
    if k=='quota':return None if x['now']<x['cooldown'] or any(u>=n for u,n in zip(x['used'],x['limits'])) else [u+1 for u in x['used']]
    if k=='schedule':
      t=datetime.fromisoformat(x['now']).astimezone(timezone(timedelta(hours=7)));d=t.date()
      if (t.hour,t.minute,t.second)<(18,0,0):d-=timedelta(days=1)
      return d.isoformat()
    if k=='sync':
      if x['localGeneration']!=x['responseGeneration'] or x['responseEpoch']<x['localEpoch']:return 'DROP'
      if x['responseEpoch']>x['localEpoch']:return 'RECOVERY_GATE'
      return 'DROP' if x['responseVersion']<x['localVersion'] else 'ACCEPT'
    if k=='cancel':return 'succeeded' if x['state']=='succeeded' else ('cancel_requested' if x['state']=='running' and x['mode']=='forecast' else 'cancelled')
    if k=='native_capacity':return 'QUARANTINE' if x['ageDays']>=7 else ('PAUSE_GAP' if x['items']+1>1000 or x['bytes']+x['newBytes']>8388608 else 'ENQUEUE')
    if k=='outcome':return {'committed':'READ_TYPED_STATUS','not_found':'RETRY_SAME_KEY','unknown':'INVESTIGATE_KEEP_IDENTITY'}[x['state']]
    raise ValueError(k)

def main():
    cases=json.loads((R/'docs/async/model-vectors.json').read_text(encoding='utf-8'))['cases'];results=[]
    for v in cases:
      actual=solve(v['kind'],v['input']);results.append({'id':v['id'],'case':v['case'],'expected':v['expected'],'actual':actual,'status':'PASS' if actual==v['expected'] else 'FAIL'})
    ok=all(x['status']=='PASS' for x in results)
    data={'date':'2026-10-09','status':'MODEL_ONLY_PASS' if ok else 'FAIL','scope':'Specification decision vectors; not production functions, SQL, concurrency, network, native, timings or fault injection','runtime':'NOT_RUN','cases':results}
    (E/'model-results.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':data['status'],'vectors':len(cases),'failed':[x['id'] for x in results if x['status']!='PASS']}))
    if not ok:raise SystemExit(1)

if __name__=='__main__':main()
