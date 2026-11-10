import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { money, sumMoney, decimal, halfUp, valueHolding, knownTotal } from '../src/engine/exact.ts';
import { root, verifyPins } from '../src/pins.ts';
import { transactionBody } from '../src/database/migrate.ts';

test('target pins are exact API005/DB005/native003', verifyPins);
const vectors = JSON.parse(await readFile(resolve(root,'docs/domain/golden-vectors.json'),'utf8'));
for (const vector of vectors.filter((v: {kind:string}) => ['money_valid','sum','valuation','known_total'].includes(v.kind))) {
  test(`independent handover oracle ${vector.id} (${vector.kind})`, () => {
    let actual;
    if (vector.kind === 'money_valid') { try { money(vector.input.value,'signed'); actual=true; } catch { actual=false; } }
    if (vector.kind === 'sum') actual=sumMoney(vector.input.values);
    if (vector.kind === 'valuation') { const result=valueHolding(vector.input); actual=result.known ? result.amount : null; }
    if (vector.kind === 'known_total') actual=knownTotal(vector.input.values);
    assert.deepEqual(actual,vector.expected);
  });
}
test('reject binary64, coercion, exponent, padding and nonfinite inputs', () => {
  for (const bad of [1, NaN, Infinity, undefined, null, {}, '01', '-0', '+1', '1e2', '1.0', ' 1', '1,000']) assert.throws(()=>money(bad));
  for (const bad of [1, '1.000000000', 'NaN', '-1', '.5', '1.', '100000000000000000000']) assert.throws(()=>decimal(bad));
  assert.throws(()=>money('0','positive'));
  assert.throws(()=>money('-1'));
});
test('BigInt keeps units beyond Number.MAX_SAFE_INTEGER and reports overflow', () => {
  assert.equal(sumMoney(['9007199254740993','1']), '9007199254740994');
  assert.equal(sumMoney(['999999999999999999','999999999999999999','-999999999999999999']), '999999999999999999');
  assert.throws(()=>sumMoney(['999999999999999999','1']), /MONEY_OVERFLOW/);
  assert.throws(()=>valueHolding({quantity:'99999999999999999999',price:'99999999999999999999',unit:'share',currency:'VND',fx:null}), /MONEY_OVERFLOW/);
});
test('holding rounding happens before summing; missing price stays unknown', () => {
  const holding=valueHolding({quantity:'0.5',price:'1',unit:'share',currency:'VND',fx:null});
  assert.equal(holding.known,true);
  assert.deepEqual(holding,{known:true,amount:'1'});
  assert.equal(sumMoney(['1','1']),'2');
  assert.deepEqual(valueHolding({quantity:'1',price:null,unit:'share',currency:'VND',fx:null}),{known:false,reason:'PRICE_UNKNOWN'});
});
test('81 fractional valuations match an independent integer-ratio oracle', () => {
  for (let q=1n;q<=9n;q++) for(let p=1n;p<=9n;p++) {
    const expected=((q*p+50n)/100n).toString();
    assert.deepEqual(valueHolding({quantity:`0.${q}`,price:`0.${p}`,unit:'share',currency:'VND',fx:null}),{known:true,amount:expected});
  }
  assert.equal(halfUp(-5n,2n),-3n);
  assert.equal(halfUp(5n,2n),3n);
});
test('runner owns historical transaction wrappers and rejects nontransactional phases', () => {
  assert.equal(transactionBody('-- retained history\r\nBEGIN;\r\nSELECT 1;\r\nCOMMIT;\r\n'),'SELECT 1;');
  assert.throws(()=>transactionBody('SELECT 1;'), /TRANSACTIONAL_MIGRATION_REQUIRED/);
  assert.throws(()=>transactionBody('BEGIN; CREATE INDEX CONCURRENTLY i ON fw.t(id); COMMIT;'), /TRANSACTIONAL_MIGRATION_REQUIRED/);
});
