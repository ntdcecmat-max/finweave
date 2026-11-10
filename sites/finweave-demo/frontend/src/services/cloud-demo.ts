export async function startCloudDemo() {
  const registrations = await navigator.serviceWorker?.getRegistrations();
  await Promise.all((registrations ?? []).filter(r => r.active?.scriptURL.endsWith('/mockServiceWorker.js')).map(r => r.unregister()));
  const response = await fetch('/api/demo/bootstrap', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) throw new Error('Máy chủ demo chưa sẵn sàng. Vui lòng tải lại trang.');
  const status = await response.json() as { backend?: string; persistence?: string };
  if (status.backend !== 'cloud-demo' || status.persistence !== 'd1') throw new Error('Kết nối demo không hợp lệ.');
}
