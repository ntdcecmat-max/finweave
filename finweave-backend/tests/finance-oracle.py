"""Independent Decimal oracle: no imports from TS engine, SQL or expected balances."""
import json, sys
from decimal import Decimal, localcontext, ROUND_HALF_UP

with localcontext() as ctx:
    ctx.prec = 100
    actions = json.load(sys.stdin)
    cash, moves, quotes = {}, {}, {}
    income = expense = refunds = Decimal(0)
    sequence = 0
    for a in actions:
        kind = a['kind']
        amount = Decimal(a.get('amount', '0'))
        account = a.get('account')
        if kind == 'opening':
            cash[account] = amount
        elif kind in ('income', 'expense', 'refund', 'investment', 'adjustment'):
            cash[account] += -amount if kind in ('expense', 'investment') else amount
            if kind == 'income': income += amount
            if kind == 'expense': expense += amount
            if kind == 'refund': refunds += amount
        elif kind == 'transfer':
            fee = Decimal(a['fee'])
            cash[account] -= amount + fee
            cash[a['to']] += amount
            expense += fee
        elif kind == 'correction':
            difference = amount - Decimal(a['old'])
            cash[account] += -difference if a['originalKind'] == 'expense' else difference
            if a['originalKind'] == 'expense': expense += difference
            if a['originalKind'] == 'income': income += difference
            if a['originalKind'] == 'refund': refunds += difference
        if 'quantity' in a:
            sequence += 1
            qty = Decimal(a['quantity']) * (10 if a['unit'] == 'luong' else 1)
            moves.setdefault(a['holding'], []).append((a['date'], sequence, a.get('mode', 'set'), qty))
        if kind == 'quote': quotes[a['holding']] = a
    quantities, valuations = {}, {}
    for holding, rows in moves.items():
        qty = Decimal(0)
        for _, _, mode, value in sorted(rows):
            qty = value if mode == 'set' else qty + value
            assert qty >= 0
        quantities[holding] = format(qty.normalize(), 'f')
        quote = quotes.get(holding)
        if qty == 0: valuations[holding] = '0'
        elif not quote: valuations[holding] = None
        else:
            value = qty * Decimal(quote['price']) * Decimal(quote.get('fx', '1')) / (10 if quote['per'] == 'luong' else 1)
            valuations[holding] = str(value.quantize(Decimal(1), rounding=ROUND_HALF_UP))
    print(json.dumps({'cash': {k: str(v) for k, v in cash.items()}, 'quantities': quantities,
                      'valuations': valuations, 'income': str(income), 'grossExpense': str(expense),
                      'refunds': str(refunds), 'netExpense': str(expense-refunds)}))
