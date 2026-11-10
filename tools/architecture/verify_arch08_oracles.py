"""Independent specification calculator. It never imports or executes frontend/backend Engine."""
from pathlib import Path
from fractions import Fraction as F
from datetime import date,datetime,timedelta,timezone
import calendar,json,re
R=Path(__file__).resolve().parents[2]
def round_half_up(v):
    sign=-1 if v<0 else 1;v=abs(v);q,r=divmod(v.numerator,v.denominator)
    return str(sign*(q+(2*r>=v.denominator)))
def solve(v):
    kind=v['kind'];x=v['input']
    if kind=='money_valid':return bool(re.fullmatch(r'(0|[1-9][0-9]{0,17})',x['value']))
    if kind=='sum':return str(sum(int(n) for n in x['values']))
    if kind=='valuation':
        if x['quantity'] is None:return None
        if F(x['quantity'])==0:return '0'
        if x['price'] is None or x.get('incompatible') or (x.get('currency')=='USD' and x.get('fx') is None):return None
        return round_half_up(F(x['quantity'])*F(x['price'])*F(x.get('fx') or '1')/(10 if x['unit']=='luong' else 1))
    if kind=='known_total':return {'knownSubtotal':str(sum(int(n) for n in x['values'] if n is not None)),'total':None if any(n is None for n in x['values']) else str(sum(int(n) for n in x['values']))}
    if kind=='scope_flow':return str(sum(int(n) for account,n in x['lines'] if account in x['scope']))
    if kind=='refund_cap':return sum(int(n) for n in x['refunds'])<=int(x['expense'])
    if kind=='pro_rata':
        rows=sorted(x['allocations'],key=lambda a:a['id']);total=sum(int(a['amount']) for a in rows);cap=min(max(int(x['cash']),0),total)
        allocated=[cap*int(a['amount'])//total if total else 0 for a in rows];left=cap-sum(allocated)
        for i in range(left):allocated[i]+=1
        return {a['id']:str(n) for a,n in zip(rows,allocated)}
    if kind=='remaining':
        actual=sum(int(n) for n in x['signedActual']);planned=int(x['planned'])
        return {'actual':str(actual),'remaining':str(max(planned-actual,0)),'overspend':str(max(actual-planned,0))}
    if kind=='recurrence':
        first=date.fromisoformat(x['start']);last=date.fromisoformat(x['end']);y,m=first.year,first.month;out=[]
        while (y,m)<=(last.year,last.month):
            d=date(y,m,min(x['day'],calendar.monthrange(y,m)[1]))
            if first<=d<=last and d.isoformat()[:7] not in x.get('skip',[]):out.append(d.isoformat())
            if m==12:y,m=y+1,1
            else:m+=1
        return len(out) if x.get('countOnly') else out
    if kind=='local_day':return datetime.fromisoformat(x['instant'].replace('Z','+00:00')).astimezone(timezone(timedelta(hours=7))).date().isoformat()
    if kind=='stale':return F(x['ageSeconds'])>F(x['thresholdSeconds'])
    if kind=='group_valid':return len(x['lines'])>=2 and all(int(n)!=0 for n in x['lines']) and sum(int(n) for n in x['lines'])==0 and x['sealed']
    if kind=='simple_plan':return str(int(x['actualCash'])+int(x['income'])-int(x['expense'])-int(x['investment']))
    if kind=='simulate_move':
        cash=int(x['cash']);assets=int(x['assets']);amount=int(x['amount']);mode=x['mode']
        return {'cash':str(cash-(amount if mode in ['consume','invest'] else 0)),'assets':str(assets-(amount if mode=='consume' else 0))}
    if kind=='goal_pass':
        if x['measured'] is None or x['freeCash'] is None:return None
        return int(x['measured'])>=int(x['target']) and F(x['freeCash'])>=F(x['expense'])*F(x['liquidMonths'])
    if kind=='linear_forecast':return str(int(x['initial'])+x['months']*(int(x['income'])-int(x['expense'])))
    if kind=='prorated_months':
        d=date.fromisoformat(x['firstDay']);end=date.fromisoformat(x['endExclusive']);total=F(0)
        while d<end:
            total+=F(x['monthly'][d.isoformat()[:7]])/calendar.monthrange(d.year,d.month)[1];d+=timedelta(days=1)
        return round_half_up(total)
    if kind=='quantiles':
        values=sorted(F(n) for n in x['values']);out={}
        for name,p in [('p10',F(1,10)),('p25',F(1,4)),('p50',F(1,2)),('p75',F(3,4)),('p90',F(9,10))]:
            idx=(len(values)-1)*p;lo=idx.numerator//idx.denominator;hi=min(lo+1,len(values)-1);out[name]=round_half_up(values[lo]+(values[hi]-values[lo])*(idx-lo))
        return out
    if kind=='probability':return None if not x['complete'] or x.get('missing') else str(F(x['successes']*100,x['trials']))
    if kind=='debt_principal':return {'cash':str(int(x['cash'])-int(x['payment'])),'debt':str(max(int(x['debt'])-int(x['payment']),0)),'netWorthDelta':'0'}
    raise ValueError('Unregistered oracle kind '+kind)
def main():
    vectors=json.loads((R/'docs/domain/golden-vectors.json').read_text(encoding='utf-8'));results=[]
    for v in vectors:
        actual=solve(v);results.append({'id':v['id'],'status':'PASS' if actual==v['expected'] else 'FAIL','expected':v['expected'],'observedOracle':actual})
    output={'status':'ORACLE_ONLY_PASS' if all(r['status']=='PASS' for r in results) else 'FAIL','scope':'Independent Fraction/integer/calendar specification calculations only; no frontend/backend/domain conformance, SQL, Monte Carlo or runtime acceptance','date':'2026-10-09','cases':results,'backend':'NOT_RUN'}
    (R/'docs/execution/evidence/arch-08-domain-2026-10-09/oracle-results.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'status':output['status'],'vectors':len(results),'failed':[r for r in results if r['status']=='FAIL']}))
    if output['status']=='FAIL':raise SystemExit(1)
if __name__=='__main__':main()
