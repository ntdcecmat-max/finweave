import { useEffect, useState } from 'react';
import { Button } from '../components/ui';
import { nativeCollector } from '../native/collector';
import { notificationTestAction, notificationTestStatus, postTestNotification } from '../native/notification-test';
import type { NotificationTestStatus } from '../native/notification-test';

const errors: Record<string, string> = {
  TEST_CONSENT_OR_ACCESS_REQUIRED: 'Hãy xác nhận phần giải thích và cấp quyền đọc thông báo cho FinWeave trong Android.',
  TEST_LISTENER_NOT_BOUND: 'Android chưa kết nối listener. Kiểm tra quyền đọc thông báo, quay lại app rồi thử lại.',
  TEST_POST_PERMISSION_REQUIRED: 'Hãy cho phép FinWeave hiển thị thông báo và kiểm tra kênh thông báo kiểm thử trong cài đặt Android.',
  TEST_SESSION_REQUIRED: 'Phiên kiểm thử đã hết hạn. Bật lại bài test để tiếp tục.',
  TEST_QUEUE_FULL: 'Đã đủ thông báo trong phiên. Dừng rồi bật lại bài test.',
};
export function NotificationTestPanel() {
  const [status, setStatus] = useState<NotificationTestStatus | null>(null);
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const refresh = async () => setStatus(await notificationTestStatus());
  useEffect(() => {
    let disposed = false;
    const update = async () => { if (document.hidden) return; try { const s = await notificationTestStatus(); if (!disposed) { setStatus(s); setReadError(''); } } catch { if (!disposed) setReadError('Chưa đọc được trạng thái bài test. Hãy kiểm tra lại hoặc mở lại FinWeave.'); } };
    void update(); const timer = window.setInterval(() => void update(), 2000);
    document.addEventListener('visibilitychange', update);
    return () => { disposed = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  async function run(work: () => Promise<unknown>) {
    setBusy(true); setError('');
    try { await work(); await refresh(); }
    catch (e) { const message = (e as Error).message; setError(errors[message] ?? message); }
    finally { setBusy(false); }
  }
  return <section className="card stack" aria-label="Kiểm thử thông báo Android">
    <h2>Test nhận thông báo trên điện thoại</h2>
    <p>FinWeave phát thông báo giao dịch giả qua Android, chờ listener nhận lại rồi đọc số tiền và hướng tiền. Bài test chỉ nhận những thông báo giả do chính FinWeave tạo.</p>
    <p className="notice">Kết quả kiểm thử lưu tạm trong phiên tối đa 15 phút. Không gửi lên máy chủ hoặc ghi vào sổ giao dịch. Nguồn ngân hàng/ví thật vẫn cần xác minh và đăng ký thiết bị.</p>
    <label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>Tôi đồng ý test bằng dữ liệu giả và chủ động cấp quyền đọc thông báo.</label>
    <p className="small">{status ? `Quyền đọc: ${status.accessGranted ? 'Đã cấp' : 'Chưa cấp'} · Listener: ${status.listenerBound ? 'Đã kết nối' : 'Chưa kết nối'} · Kênh thông báo test: ${status.canPost ? 'Được phép' : 'Đang bị tắt'}` : 'Đang kiểm tra quyền và kênh thông báo…'}</p>
    {status?.active && <p className="small">Android đang giữ {status.systemNotificationCount} thông báo test. Vuốt thanh thông báo xuống để xem; khi bạn xóa thông báo, số này giảm.</p>}
    {status && status.channelImportance !== null && status.channelImportance < 4 && <p className="small muted">Kênh test hiện không dùng mức bật biểu ngữ. Bạn vẫn có thể xem trong thanh thông báo nếu kênh được bật; tùy chọn hiển thị nằm trong cài đặt bên dưới.</p>}
    <div className="op-actions">
      <Button disabled={!consent || busy} onClick={() => void run(async () => { await nativeCollector('consent'); await nativeCollector('settings'); })}>1. Mở quyền đọc thông báo</Button>
      <Button disabled={!consent || busy || !status?.accessGranted || !status.listenerBound} onClick={() => void run(async () => {
        await nativeCollector('consent'); const s = await notificationTestAction('requestPostPermission');
        if (!s.canPost) throw Error('TEST_POST_PERMISSION_REQUIRED'); await notificationTestAction('start');
      })}>2. Bật bài test</Button>
      <Button disabled={busy} onClick={() => void run(refresh)}>Kiểm tra lại</Button>
      <Button disabled={busy} onClick={() => void run(() => notificationTestAction('openTestNotificationSettings'))}>Cài đặt thông báo FinWeave</Button>
    </div>
    <div className="op-actions">
      <Button disabled={busy || !status?.active} onClick={() => void run(() => postTestNotification('income'))}>Test tiền vào</Button>
      <Button disabled={busy || !status?.active} onClick={() => void run(() => postTestNotification('expense'))}>Test tiền ra</Button>
      <Button disabled={busy || !status?.active} onClick={() => void run(() => postTestNotification('otp'))}>Test loại OTP</Button>
      <Button disabled={busy || !status?.active} onClick={() => void run(() => notificationTestAction('stop'))}>Dừng và xóa kết quả test</Button>
    </div>
    {status?.pending ? <p role="status">Đã phát {status.pending} thông báo, đang chờ Android gọi listener. Nếu không nhận được, kiểm tra kênh thông báo và quyền Android; chưa tính là PASS.</p> : null}
    {status?.results.map(r => <article className="notice info" key={r.id}>
      <strong>Android đã gọi listener · {r.fixture === 'income' ? 'Tiền vào giả lập' : r.fixture === 'expense' ? 'Tiền ra giả lập' : 'OTP giả lập'}</strong>
      <p>{r.outcome === 'PARSED_SYNTHETIC' ? `${r.direction === 'income' ? 'Tiền vào' : 'Tiền ra'}: ${Number(r.amount).toLocaleString('vi-VN')} VND · chờ kiểm tra, chưa ghi sổ` : r.outcome === 'OTP_DISCARDED' ? 'Đã loại bỏ OTP; không tạo giao dịch.' : r.outcome}</p>
    </article>)}
    {(error || readError) && <p role="alert" className="notice error">{error || readError}</p>}
  </section>;
}
