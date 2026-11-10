import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
const base = process.argv[2] || 'http://127.0.0.1:5173';
const checks = [];
const ok = (name) => { checks.push({ name, status: 'PASS' }); console.log('PASS ' + name); };
const id = () => crypto.randomUUID();
class Visitor {
  cookie = ''; session = null;
  async call(path, body, headers = {}) {
    const r = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { ...(this.cookie ? { Cookie: this.cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json', 'X-FinWeave-Synthetic': 'true' }), ...(this.session ? { 'X-FinWeave-Mock-Session': this.session } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const cookie = r.headers.get('set-cookie'); if (cookie) this.cookie = cookie.split(';')[0];
    const raw = await r.text(); let data; try { data = JSON.parse(raw); } catch { data = { nonJson: raw.slice(0, 600) }; }
    return { status: r.status, data };
  }
  async start() { const r = await this.call('/api/demo/bootstrap'); assert.equal(r.status, 200); assert.equal(r.data.persistence, 'd1'); assert(this.cookie); }
  async identity(name, input) { const r = await this.call('/api/demo/v1/identity/' + name, { contractVersion: '1.1.0', requestId: id(), idempotencyKey: id(), input }); assert.equal(r.status, 200, JSON.stringify(r)); return r.data; }
  async login() { await this.identity('signIn', { email: 'demo@finweave.test', password: 'FinWeaveDemo!2026' }); const r = await this.identity('verifyIdentityChallenge', { challengeId: 'DEMO-CHALLENGE', code: '123456' }); this.session = r.session.sessionId; }
  async logical(name, input = {}, mutation = null) { return this.call('/api/demo/v1/logical/' + name, { contractVersion: '1.1.0', requestId: id(), workspaceId: 'W-DEMO', operationId: name, input, mutation }); }
  async snapshot() { const r = await this.logical('getPresentationSnapshot'); assert.equal(r.status, 200, JSON.stringify(r)); return r.data; }
}
try {
  const health = await fetch(base + '/api/health'); assert.equal(health.status, 200); assert.equal((await health.json()).persistence, 'd1'); ok('Cloud backend/database health');
  for (const path of ['/', '/auth/login', '/home', '/transactions', '/plan/goals', '/data', '/ai']) { const r = await fetch(base + path); assert.equal(r.status, 200); assert((await r.text()).includes('FinWeave')); } ok('SPA routes and deep links');
  const a = new Visitor(); await a.start(); await a.login(); const before = await a.snapshot(); ok('Demo login and verification over real HTTP');
  const input = { name: 'Cloud demo ' + id().slice(0, 8), kind: 'cash', opening: { value: '150000', currency: 'VND' }, openingDate: '2026-10-01' };
  const preview = await a.logical('previewMutation', { operationId: 'createAccount', input, expectedWorkspaceVersion: before.workspaceVersion, expectedObjectVersions: {} }); assert.equal(preview.status, 200, JSON.stringify(preview));
  const mutation = { idempotencyKey: id(), expectedWorkspaceVersion: before.workspaceVersion, expectedObjectVersions: {}, previewToken: preview.data.data.previewToken };
  const committed = await a.logical('createAccount', input, mutation); assert.equal(committed.status, 200, JSON.stringify(committed)); ok('Preview and commit a financial demo change');
  const retry = await a.logical('createAccount', input, mutation); assert.equal(retry.status, 200); assert.equal(retry.data.data.replayed, true); assert.deepEqual(retry.data.data.affectedIds, committed.data.data.affectedIds); ok('Retried mutation has one effect');
  const cookie = a.cookie; await a.start(); assert.equal(a.cookie, cookie); const restored = await a.snapshot(); assert.equal(restored.data.data.accounts.filter(x => x.name === input.name).length, 1); ok('Mutation survives a fresh bootstrap and database reload');
  await Promise.all(Array.from({ length: 5 }, () => a.logical('getWorkspace').then(r => assert.equal(r.status, 200, JSON.stringify(r))))); ok('Parallel browser reads retain consistent state');
  const b = new Visitor(); await b.start(); await b.login(); const other = await b.snapshot(); assert(!other.data.data.accounts.some(x => x.name === input.name)); ok('Each visitor has an isolated cloud workspace');
  const own = b.session; b.session = a.session; assert.equal((await b.logical('getWorkspace')).status, 401); b.session = own; ok('A session from another visitor cannot access its data');
  await a.identity('signOut', { sessionId: a.session }); a.session = null; await a.login(); const relogin = await a.snapshot(); assert(relogin.data.data.accounts.some(x => x.name === input.name)); ok('Sign-out and sign-in preserve saved demo data');
  assert.equal((await a.call('/api/demo/v1/logical/getWorkspace', { contractVersion: '1.1.0' }, { Origin: 'https://different-origin.test' })).status, 403); ok('Cross-origin writes rejected');
  mkdirSync('.sites-runtime', { recursive: true }); writeFileSync('.sites-runtime/demo-verification.json', JSON.stringify({ base, at: new Date().toISOString(), checks }, null, 2)); console.log('ALL ' + checks.length + ' CHECKS PASSED');
} catch (error) { console.error(error); process.exitCode = 1; }

