import {test,expect} from 'vitest';
import {money,quantityLabel} from '../src/domain/selectors';
import {businessClockView} from '../src/services/presentation';
test('API005 decimal text stays exact in VND and quantity labels',()=>{expect(money('9007199254740993')).toBe('9.007.199.254.740.993 ₫');expect(money('-9007199254740993')).toBe('-9.007.199.254.740.993 ₫');expect(quantityLabel('9007199254740993.00000001')).toBe('9.007.199.254.740.993,00000001');expect(money(null)).toBe('Chưa biết');});
test('UTC wire clock projects to Ho Chi Minh business day without changing instant',()=>{const wire='2026-10-12T18:03:04.123Z',view=businessClockView(wire);expect(view.slice(0,10)).toBe('2026-10-13');expect(Date.parse(view)).toBe(Date.parse(wire));});
