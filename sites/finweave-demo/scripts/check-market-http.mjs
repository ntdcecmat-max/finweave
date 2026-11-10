import assert from 'node:assert/strict';
const base = process.argv[2] ?? 'http://127.0.0.1:5178';
let cookie = '', session = null, version = 1;
const id = () => crypto.randomUUID();
async function call(path, body) {
  const r = await fetch(base + path, { method: body ? 'POST' : 'GET', headers: { Cookie: cookie, ...(session ? { 'X-FinWeave-Mock-Session': session } : {}), ...(body ? { 'Content-Type': 'application/json', 'X-FinWeave-Synthetic': 'true', Origin: base } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const ownCookie = r.headers.getSetCookie().find(v => /^(?:__Host-fw_demo|fw_demo_local)=/.test(v)); if (ownCookie) cookie = ownCookie.split(';')[0];
  const data = await r.json(); assert.equal(r.status, 200, JSON.stringify(data)); return data;
}
const identity = (operation, input) => call('/api/demo/v1/identity/' + operation, { contractVersion: '1.1.0', requestId: id(), idempotencyKey: id(), input });
async function logical(operationId) { const r = await call('/api/demo/v1/logical/' + operationId, { contractVersion: '1.1.0', requestId: id(), workspaceId: 'W-DEMO', operationId, input: {}, mutation: null }); version = r.workspaceVersion; return r.data; }
async function op(operation, input) { const r = await call('/api/demo/v2/operational', { contractVersion: '2.0.0', requestId: id(), operation, input, idempotencyKey: id(), expectedWorkspaceVersion: version }); version = r.workspaceVersion; return r.data; }
await call('/api/demo/bootstrap');
await identity('signIn', { email: 'demo@finweave.test', password: 'FinWeaveDemo!2026' });
session = (await identity('verifyIdentityChallenge', { challengeId: 'DEMO-CHALLENGE', code: '123456' })).session.sessionId;
await logical('getWorkspace');
for (const [existingId, kind, catalogId, quantity] of [['stock', 'stock', 'VN_FPT', '100'], ['gold', 'gold', 'G_PNJ_RING_BUY', '5']]) {
  const input = { existingId, kind, catalogId, quantity, date: '2026-10-01', cost: null, profileConfirmed: true };
  const preview = await op('previewHolding', input); await op('confirmHolding', { ...input, token: preview.token });
}
const job = await op('requestPriceRefresh', { holdingIds: [] });
assert.equal(job.status, 'succeeded', JSON.stringify(job));
const saved = await logical('getPresentationSnapshot');
for (const holding of saved.data.holdings) { const q = holding.quotes.at(-1); assert(q.compatible); assert.match(q.source, /SSI iBoard|PNJ|BTMC/); assert(Number(q.price) > 0); assert(Date.parse(q.date) <= Date.parse(saved.data.clock)); console.log('PASS persisted live price', holding.name, q.price, q.unit, q.date); }
await call('/api/demo/bootstrap');
const reloaded = await logical('getPresentationSnapshot'); assert.deepEqual(reloaded.data.holdings, saved.data.holdings);
assert.equal((await op('getState', {})).priceJobs.at(-1).id, job.id);
let previousJob = job.id;
for (let i = 0; i < 3; i++) { const repeat = await op('requestPriceRefresh', { holdingIds: [] }); assert.equal(repeat.status, 'succeeded'); assert.equal(repeat.retryAfter, null); assert.notEqual(repeat.id, previousJob); previousJob = repeat.id; }
console.log('PASS live Worker fetch, D1 persistence, reload and three immediate repeat refreshes');
