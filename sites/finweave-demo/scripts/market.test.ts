import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchMarket, parseGold, parseStock, parsePnj } from '../server/market.ts';
const now = Date.parse('2026-11-03T10:00:00+07:00');
const stock = (extra = {}) => ({ code: 'SUCCESS', data: { stockSymbol: 'FPT', exchange: 'hose', tradingCurrencyISOCode: 'VND', tradingDate: '20261103', matchedPrice: 50300, ...extra } });
const goldRow = (index: number, name: string, value: string, date = '03/11/2026 09:00') => ({ '@row': String(index), ['@n_' + index]: name, ['@h_' + index]: '999.9', ['@pb_' + index]: value, ['@ps_' + index]: '99999999', ['@d_' + index]: date });
test('stocks retain VND units and the session date, not fetch time', () => {
  const q = parseStock(stock(), 'FPT', now);
  assert.equal(q.price, '50300'); assert.equal(q.unit, 'share'); assert.equal(q.date, '2026-11-03T00:00:00+07:00');
  assert.match(q.source, /không có giờ khớp/);
});
test('reject wrong symbol/exchange/currency, zero, malformed and future data', () => {
  for (const extra of [{ stockSymbol: 'VCB' }, { exchange: 'hnx' }, { tradingCurrencyISOCode: 'USD' }, { matchedPrice: 0 }, { matchedPrice: -10 }, { matchedPrice: '1e5' }, { tradingDate: '20260230' }, { tradingDate: '20271103' }]) assert.throws(() => parseStock(stock(extra), 'FPT', now));
});
test('gold selects exact product, newest quote and buy price in VND/chi', () => {
  const data = { DataList: { Data: [goldRow(1, 'VÀNG MIẾNG VRTL (Vàng Rồng Thăng Long)', '111'), goldRow(2, 'VÀNG MIẾNG SJC (Vàng SJC)', '13570000'), goldRow(3, 'VÀNG MIẾNG SJC (Vàng SJC)', '13000000', '02/11/2026 09:00'), goldRow(4, 'NHẪN TRÒN TRƠN (Vàng Rồng Thăng Long)', '13560000')] } };
  assert.equal(parseGold(data, 'G_SJC_BUY', now).price, '13570000');
  const q = parseGold(data, 'G_RING_BUY', now); assert.equal(q.price, '13560000'); assert.equal(q.unit, 'chi'); assert.equal(q.date, '2026-11-03T09:00:00+07:00');
});
test('gold never substitutes another product or invalid observation', () => {
  for (const row of [goldRow(1, 'VÀNG MIẾNG VRTL (Vàng Rồng Thăng Long)', '100'), goldRow(2, 'VÀNG MIẾNG SJC (Vàng SJC)', '0'), goldRow(3, 'VÀNG MIẾNG SJC (Vàng SJC)', '100', '30/02/2026 09:00')]) assert.throws(() => parseGold({ DataList: { Data: [row] } }, 'G_SJC_BUY', now));
});
test('upstream failure is isolated by asset; unsupported IDs never fetch', async () => {
  let calls = 0;
  const fake = (async (url: any, init: any) => { calls++; assert.match(init.headers['User-Agent'], /^FinWeave\//); return String(url).includes('/stock/') ? Response.json(stock()) : new Response('down', { status: 503 }); }) as typeof fetch;
  const result = await fetchMarket(['VN_FPT', 'VN_FPT', 'G_SJC_BUY', 'UNKNOWN'], fake);
  assert.equal(calls, 2); assert.equal(result.VN_FPT.quote?.price, '50300'); assert.ok(result.G_SJC_BUY.error); assert.ok(result.UNKNOWN.error);
});
test('both gold profiles share one upstream request and rate limit has explicit result', async () => {
  let calls = 0;
  const fake = (async () => { calls++; return new Response('', { status: 429 }); }) as typeof fetch;
  const result = await fetchMarket(['G_RING_BUY', 'G_SJC_BUY'], fake);
  assert.equal(calls, 1); assert.match(result.G_RING_BUY.error!, /giới hạn/); assert.match(result.G_SJC_BUY.error!, /giới hạn/);
});
test('PNJ uses exact product/region, buy side, and converts thousand VND per chi exactly', () => {
  const data = { chinhanh: 'hochiminh', updateDate: '03/11/2026 08:47:43', data: [{ masp: 'N24K', tensp: 'Nhẫn Trơn PNJ 999.9', giamua: 13550, giaban: 13950 }, { masp: 'SJC', tensp: 'Vàng miếng SJC 999.9', giamua: 13820 }] };
  const q = parsePnj(data, 'G_PNJ_RING_BUY', now);
  assert.equal(q.price, '13550000'); assert.equal(q.unit, 'chi'); assert.equal(q.date, '2026-11-03T08:47:43+07:00');
  assert.equal(parsePnj(data, 'G_PNJ_SJC_BUY', now).price, '13820000');
  for (const changed of [{ ...data, chinhanh: 'hanoi' }, { ...data, updateDate: '30/02/2026 09:00:00' }, { ...data, data: [{ ...data.data[0], giamua: 0 }] }, { ...data, data: [{ ...data.data[0], tensp: 'Other gold' }] }]) assert.throws(() => parsePnj(changed, 'G_PNJ_RING_BUY', now));
  assert.throws(() => parsePnj(data, 'G_RING_BUY', now));
});
