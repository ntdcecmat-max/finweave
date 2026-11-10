import html from '../../server/spa-html';
export const dynamic = 'force-dynamic';
export function GET(request: Request) {
  const path = new URL(request.url).pathname;
  if (path.startsWith('/api/') || /\.[a-z0-9]{1,8}$/i.test(path)) return new Response('Not found', { status: 404 });
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' } });
}
