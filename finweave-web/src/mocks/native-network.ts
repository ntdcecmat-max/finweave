import { MockRepository, MockFailure } from './repository';
import { DomainError } from '../domain/commands';
import { OperationalFailure } from './operational';
import { ZodError } from 'zod';
import { operations } from '../contracts/operations';
import type { OperationId } from '../contracts/operations';
import type { IdentityOperationId } from '../contracts/identity';
import { CONTRACT_VERSION } from '../contracts/schemas';

// Android WebView does not require a Service Worker for the synthetic pilot.
// Reuse the exact repository/contract/auth checks; never send mock data externally.
export function startNativeSyntheticNetwork() {
  let restored;
  try {
    const user = JSON.parse(sessionStorage.getItem('fw:synthetic-session') || 'null');
    if (user?.synthetic === true && user?.sessionId && user.expiresAt > Date.now())
      restored = { sessionId: user.sessionId, subjectId: 'OWNER-DEMO', deviceId: 'DEVICE-DEMO', workspaceIds: ['W-DEMO'], role: 'owner' as const, expiresAt: new Date(user.expiresAt).toISOString(), synthetic: true as const };
  } catch { /* An invalid stored session must not grant access. */ }
  const repository = new MockRepository(restored);
  const original = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const request = input instanceof Request ? new Request(input, init) : new Request(new URL(String(input), location.origin), init);
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/__mock/')) return original(input, init);
    if (url.origin !== location.origin || request.method !== 'POST') return Response.json({ code: 'FORBIDDEN', message: 'Synthetic local only.' }, { status: 403 });
    if (request.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    let requestId = 'REQ-error';
    try {
      if (request.headers.get('X-FinWeave-Synthetic') !== 'true') throw new MockFailure('FORBIDDEN', 'Synthetic local only.', 403);
      const body = await request.json(); requestId = body.requestId || requestId;
      const session = request.headers.get('X-FinWeave-Mock-Session');
      if (url.pathname === '/__mock/v2/operational') return Response.json(await repository.dispatchV2(body, session));
      if (url.pathname === '/__mock/v1/control') return Response.json(repository.control(body, session));
      const name = url.pathname.split('/').at(-1)!;
      if (url.pathname.startsWith('/__mock/v1/identity/')) return Response.json(await repository.identity(name as IdentityOperationId, body, session));
      if (url.pathname.startsWith('/__mock/v1/logical/') && Object.hasOwn(operations, name)) {
        const op = name as OperationId;
        return Response.json(await repository.dispatch(op, body, session), { status: operations[op].status });
      }
      return Response.json({ code: 'NOT_FOUND', message: 'Unknown synthetic operation.' }, { status: 404 });
    } catch (error) {
      const code = error instanceof MockFailure || error instanceof DomainError || error instanceof OperationalFailure ? error.code : 'VALIDATION';
      const status = error instanceof MockFailure || error instanceof OperationalFailure ? error.status : code.includes('CONFLICT') ? 409 : code === 'OFFLINE' || code === 'TIMEOUT' ? 503 : 422;
      return Response.json({ contractVersion: CONTRACT_VERSION, requestId, code, message: error instanceof Error ? error.message.slice(0, 500) : code, retryable: status >= 500 || status === 429, fieldErrors: error instanceof ZodError ? error.issues.map(issue => ({ field: issue.path.join('.') || 'input', code: 'INVALID_VALUE', message: issue.message.slice(0, 500) })) : [], currentVersion: repository.store.version, retryAfterSeconds: status === 429 ? 30 : null }, { status });
    }
  };
}
