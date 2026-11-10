import {ScreenshotFailure} from '../frontend/src/domain/screenshot-import';
import { env } from 'cloudflare:workers';
import { ZodError } from 'zod';
import { MockRepository, MockFailure } from '../frontend/src/mocks/repository';
import { OperationalFailure } from '../frontend/src/mocks/operational';
import { DomainError } from '../frontend/src/domain/commands';
import { operations } from '../frontend/src/contracts/operations';
import { CONTRACT_VERSION } from '../frontend/src/contracts/schemas';
import { saveRepository, loadRepository } from './snapshot';
import { fetchMarket } from './market';

const lifetime = 7 * 24 * 60 * 60 * 1000;
const cookieName = '__Host-fw_demo';
const maxBytes = 1024 * 1024;
const database = () => {
  if (!env.DB) throw new Error('DEMO_DATABASE_UNAVAILABLE');
  return env.DB;
};
function reply(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-FinWeave-Backend': 'cloud-demo', 'X-Content-Type-Options': 'nosniff', ...headers } });
}
function visitorId(request: Request) {
  const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
function randomId() { return [...crypto.getRandomValues(new Uint8Array(32))].map(v => v.toString(16).padStart(2, '0')).join(''); }
export async function bootstrap(request: Request) {
  const db = database(), now = Date.now();
  let id = readId(request);
  const exists = id ? await db.prepare('SELECT id FROM demo_sessions WHERE id = ? AND expires_at > ?').bind(id, now).first() : null;
  if (!exists) {
    id = randomId();
    await db.prepare('INSERT INTO demo_sessions (id, revision, payload, created_at, updated_at, expires_at) VALUES (?, 1, ?, ?, ?, ?)').bind(id, saveRepository(new MockRepository()), now, now, now + lifetime).run();
  }
  await db.prepare('DELETE FROM demo_sessions WHERE id IN (SELECT id FROM demo_sessions WHERE expires_at <= ? LIMIT 25)').bind(now).run();
  const secure = new URL(request.url).protocol === 'https:';
  // __Host cookies require HTTPS; Miniflare local HTTP uses its equivalent local name.
  return reply({ backend: 'cloud-demo', persistence: 'd1', synthetic: true, retentionDays: 7 }, 200, {
    'Set-Cookie': `${secure ? cookieName : 'fw_demo_local'}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${lifetime / 1000}${secure ? '; Secure' : ''}`,
  });
}
function errorReply(error: unknown, requestId: string) {
  const known = error instanceof ScreenshotFailure || error instanceof MockFailure || error instanceof OperationalFailure || error instanceof DomainError || error instanceof ZodError;
  const code = error instanceof ZodError ? 'VALIDATION' : known ? (error as any).code : 'SERVICE_UNAVAILABLE';
  const status = error instanceof ScreenshotFailure || error instanceof MockFailure || error instanceof OperationalFailure ? error.status : error instanceof DomainError ? code.includes('CONFLICT') ? 409 : 422 : error instanceof ZodError ? 422 : 503;
  const message = known ? error instanceof ZodError ? 'Dữ liệu chưa hợp lệ. Kiểm tra lại biểu mẫu.' : (error as Error).message.slice(0, 500) : 'Máy chủ demo tạm thời chưa sẵn sàng. Vui lòng thử lại.';
  return reply({ contractVersion: CONTRACT_VERSION, requestId, code, message, retryable: status >= 500 || status === 429, fieldErrors: [], currentVersion: null, retryAfterSeconds: status === 429 ? 30 : null }, status);
}
function readId(request: Request) {
  if (new URL(request.url).protocol === 'https:') return visitorId(request);
  const value = request.headers.get('cookie')?.split(';').map(v => v.trim()).find(v => v.startsWith('fw_demo_local='))?.slice(14);
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export async function dispatchDemo(request: Request) {
  let requestId = 'REQ-error';
  try {
    if (request.method !== 'POST') return reply({ code: 'METHOD_NOT_ALLOWED', message: 'Dùng POST cho thao tác demo.' }, 405, { Allow: 'POST' });
    const origin = request.headers.get('origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('X-FinWeave-Synthetic') !== 'true') throw new MockFailure('FORBIDDEN', 'Chỉ nhận yêu cầu từ bản demo này.', 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) throw new MockFailure('VALIDATION', 'Yêu cầu JSON.', 415);
    const declared = Number(request.headers.get('content-length') || 0);
    if (declared > maxBytes) throw new MockFailure('PAYLOAD_TOO_LARGE', 'Nội dung demo quá lớn.', 413);
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > maxBytes) throw new MockFailure('PAYLOAD_TOO_LARGE', 'Nội dung demo quá lớn.', 413);
    let body: any; try { body = JSON.parse(text); } catch { throw new MockFailure('VALIDATION', 'JSON chưa hợp lệ.', 422); }
    requestId = typeof body?.requestId === 'string' ? body.requestId.slice(0, 128) : 'REQ-error';
    const id = readId(request);
    if (!id) throw new MockFailure('UNAUTHENTICATED', 'Mở lại trang demo để khởi tạo phiên.', 401);
    const route = new URL(request.url).pathname.slice('/api/demo/'.length);
    const token = request.headers.get('X-FinWeave-Mock-Session');
    const db = database();
    for (let attempt = 0; attempt < 6; attempt++) {
      const row = await db.prepare('SELECT payload, revision FROM demo_sessions WHERE id = ? AND expires_at > ?').bind(id, Date.now()).first<{ payload: string; revision: number }>();
      if (!row) throw new MockFailure('UNAUTHENTICATED', 'Phiên demo đã hết hạn. Tải lại trang để bắt đầu.', 401);
      const repo = loadRepository(row.payload);
      let result: unknown, status = 200;
      if (route === 'screenshots') result = await repo.dispatchScreenshot(body, token);
      else if (route === 'v1/control') result = repo.control(body, token);
      else if (route === 'v2/operational') result = await repo.dispatchV2(body, token, fetchMarket);
      else if (route.startsWith('v1/identity/')) result = await repo.identity(route.slice('v1/identity/'.length) as any, body, token);
      else if (route.startsWith('v1/logical/')) {
        const name = route.slice('v1/logical/'.length);
        if (!Object.hasOwn(operations, name)) throw new MockFailure('NOT_FOUND', 'Thao tác không tồn tại.', 404);
        result = await repo.dispatch(name as any, body, token); status = (operations as any)[name].status;
      } else throw new MockFailure('NOT_FOUND', 'Đường dẫn demo không tồn tại.', 404);
      const payload = saveRepository(repo);
      if (new TextEncoder().encode(payload).byteLength > 2 * maxBytes) throw new MockFailure('DEMO_LIMIT', 'Phiên demo đã đầy. Dùng Reset demo để bắt đầu lại.', 422);
      const saved = await db.prepare('UPDATE demo_sessions SET payload = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND revision = ?').bind(payload, Date.now(), id, row.revision).run();
      if (saved.meta.changes === 1) return reply(result, status);
      // Provider requests are read-only and cached; retry only without a committed workspace change.
    }
    throw new MockFailure('VERSION_CONFLICT', 'Có thao tác đồng thời. Giữ nội dung và thử lại.', 409);
  } catch (error) { return errorReply(error, requestId); }
}
export async function health() {
  try { await database().prepare('SELECT 1 AS ok').first(); return reply({ status: 'ok', app: 'FinWeave', mode: 'cloud-demo', persistence: 'd1', synthetic: true }); }
  catch { return reply({ status: 'unavailable', app: 'FinWeave' }, 503); }
}



