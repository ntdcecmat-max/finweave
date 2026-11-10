"""Independent zero-return daily oracle: stdlib Fraction/calendar; no Engine code."""
import calendar, datetime as dt, json, sys
from fractions import Fraction

def shift(day, months):
    index = day.year * 12 + day.month - 1 + months
    year, month = divmod(index, 12)
    return dt.date(year, month + 1, min(day.day, calendar.monthrange(year, month + 1)[1]))

def path(case):
    now = dt.date.fromisoformat(case['date'])
    end = shift(now, case['months'])
    balance, debt = int(case['cash']), int(case['debt'])
    stock = 0
    vaults = {g['id']: 0 for g in case['goals']}
    remainders = {'income': Fraction(), 'expense': Fraction(), 'debt': Fraction()}
    output = []
    def emit(day):
        cash = balance + sum(vaults.values())
        output.append({'date': day.isoformat(), 'cash': str(cash), 'assets': str(cash + stock), 'netWorth': str(cash + stock - debt), 'goals': {k:str(v) for k,v in vaults.items()}})
    emit(now)
    day = now + dt.timedelta(days=1)
    while day <= end:
        days = calendar.monthrange(day.year, day.month)[1]
        daily = {}
        for key in remainders:
            amount = int(case['payment'] if key == 'debt' else case[key])
            remainders[key] += Fraction(amount, days)
            daily[key] = remainders[key].numerator // remainders[key].denominator
            remainders[key] -= daily[key]
        balance += daily['income']
        for p in case['plans']:
            if p['date'] == day.isoformat() and p['kind'] == 'income': balance += int(p['amount'])
        balance -= daily['expense']
        for p in case['plans']:
            if p['date'] == day.isoformat() and p['kind'] == 'expense': balance -= int(p['amount'])
        paid = min(debt, daily['debt'])
        balance -= paid
        debt -= paid
        for p in case['plans']:
            if p['date'] == day.isoformat() and p['kind'] == 'investment':
                bought = min(max(balance,0), int(p['amount']))
                balance -= bought
                stock += bought
        for g in sorted(case['goals'], key=lambda g:(g['due'],g['id'])):
            if day.day == min(g['day'],days) and day.isoformat() >= g['start'] and day.isoformat() <= g['due'] and day.strftime('%Y-%m') not in g['skip']:
                amount = min(max(balance,0), int(g['amount']))
                balance -= amount
                vaults[g['id']] += amount
        if day.day == days or day == end or any(g['due'] == day.isoformat() for g in case['goals']): emit(day)
        day += dt.timedelta(days=1)
    return output

print(json.dumps([path(c) for c in json.load(sys.stdin)]))
