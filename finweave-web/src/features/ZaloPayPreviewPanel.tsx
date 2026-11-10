import { useEffect, useState } from 'react';
import { Button } from '../components/ui';
import { nativeCollector } from '../native/collector';
import { openZaloNotificationSettings, startZaloPreview, stopZaloPreview, testZaloParser, zaloPreviewStatus } from '../native/notification-test';
import type { ZaloAnalysis, ZaloPreviewStatus } from '../native/notification-test';

const errors: Record<string, string> = {
  TEST_CONSENT_OR_ACCESS_REQUIRED: 'Hãy cấp quyền đọc thông báo, quay lại FinWeave rồi kiểm tra lại.',
  TEST_SOURCE_IDENTITY_CHANGED: 'App, phiên bản hoặc thiết bị khác bản đã kiểm tra. Cần xác minh lại nguồn trước khi nhận thử.',
  TEST_FAILED: 'Chưa đọc được trạng thái kiểm thử. Hãy kiểm tra lại hoặc mở lại FinWeave.',
};
function message(error: unknown) {
  const code = error instanceof Error ? error.message : 'TEST_FAILED';
  return errors[code] ?? 'Chưa đọc được trạng thái kiểm thử. Hãy kiểm tra lại hoặc mở lại FinWeave.';
}
const reasons = {
  NOT_STARTED: 'Phiên chưa bật.', STOPPED: 'Phiên đã dừng.', WAITING: 'Đang nhận thử.',
  EXPIRED: 'Phiên đã hết 15 phút. Bật lại để tiếp tục.', ACCESS_OR_LISTENER_LOST: 'Phiên dừng vì mất quyền, consent hoặc kết nối listener. Kiểm tra thẻ test phía trên.',
  SOURCE_CHANGED: 'Phiên dừng vì ZaloPay hoặc thiết bị không còn khớp bản đã kiểm tra.', CAPACITY: 'Phiên đạt giới hạn. Bật lại để tiếp tục.',
};
const unknownReasons = {
  OVERSIZE: 'Thông báo quá dài.', OTP_DISCARDED: 'Đã loại nội dung xác thực.',
  NON_FINAL: 'Giao dịch chưa hoàn tất, bị hủy hoặc thất bại.', PROMOTIONAL: 'Có dấu hiệu quảng cáo, lời mời hoặc yêu cầu thao tác.',
  INTERNAL_TRANSFER: 'Có dấu hiệu chuyển nội bộ/Số dư sinh lời; chưa tính thành thu hoặc chi.',
  REFUND_UNVERIFIED: 'Hoàn tiền cần đối chiếu giao dịch gốc.', UNSUPPORTED: 'Chưa có câu chữ xác định rõ tiền vào/ra và số tiền VND.',
  CONFLICTING_FIELDS: 'Nội dung thu gọn và mở rộng không khớp.', INVALID_AMOUNT: 'Số tiền không hợp lệ.',
  AMBIGUOUS_AMOUNT: 'Có nhiều số tiền; chưa xác định số tiền giao dịch.', CONFLICTING_DIRECTION: 'Dấu số tiền và câu chữ hướng tiền không khớp.',
};
function Analysis({ value }: { value: ZaloAnalysis }) {
  if (value.status === 'UNKNOWN') return <p className="small muted">Chưa xác định tiền vào/ra. {unknownReasons[value.reason]}</p>;
  return <>
    <p><strong>{value.direction === 'income' ? 'Tiền vào' : 'Tiền ra'}: {value.amount.replace(/\B(?=(\d{3})+(?!\d))/g, '.')} đ</strong></p>
    <p className="small muted">Nhận diện thử theo quy tắc chung; mẫu ZaloPay thật chưa được đối chiếu. Chưa ghi vào giao dịch hoặc số dư.</p>
  </>;
}
export function ZaloPayPreviewPanel() {
  const [status, setStatus] = useState<ZaloPreviewStatus | null>(null);
  const [consent, setConsent] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [readError, setReadError] = useState('');
  const [synthetic, setSynthetic] = useState<{ fixture: 'income' | 'expense' | 'unknown'; analysis: ZaloAnalysis } | null>(null);
  useEffect(() => {
    let disposed = false;
    const update = async () => {
      if (document.hidden) return;
      try { const next = await zaloPreviewStatus(); if (!disposed) { setStatus(next); setReadError(''); } }
      catch (e) { if (!disposed) setReadError(message(e)); }
    };
    void update(); const timer = window.setInterval(() => void update(), 3000);
    document.addEventListener('visibilitychange', update);
    return () => { disposed = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, []);
  async function run(work: () => Promise<ZaloPreviewStatus>) {
    setBusy(true); setError('');
    try { setStatus(await work()); } catch (e) { setError(message(e)); } finally { setBusy(false); }
  }
  return <section className="card stack" aria-label="Nhận thử thông báo ZaloPay">
    <h2>Xem trước ZaloPay thật</h2>
    <p>Bật phiên này rồi sử dụng ZaloPay bình thường. Khi ZaloPay phát thông báo mới qua Android, mẫu đã che thông tin sẽ hiện tại đây. Mở app hoặc xem biên lai không tự tạo thông báo.</p>
    <p className="notice">Phiên tối đa 15 phút nhận thông báo và thử đọc số tiền/hướng tiền khi câu chữ rõ ràng. Chỉ số tiền và hướng nhận diện được hiện tại đây; tên, tài khoản, mã giao dịch và nội dung riêng được che. OTP và mã xác thực bị loại bỏ. Kết quả lưu tạm trên điện thoại, không gửi lên máy chủ. Chưa tự ghi giao dịch thật.</p>
    <p className="small">Nguồn: {status ? (status.sourceVerified ? `ZaloPay ${status.sourceVersion} · đúng app và thiết bị đã kiểm tra` : 'Chưa khớp app/phiên bản/thiết bị đã kiểm tra') : 'Đang kiểm tra…'}</p>
    {status && <p className="small">Quyền đọc: {status.accessGranted ? 'Đã cấp' : 'Chưa cấp'} · Listener: {status.listenerBound ? 'Đã kết nối' : 'Chưa kết nối'}</p>}
    <label className="check"><input type="checkbox" checked={consent} disabled={busy} onChange={e => {
      setConsent(e.target.checked);
      if (!e.target.checked && status?.active) void run(stopZaloPreview);
    }}/>Tôi đồng ý nhận thử và phân tích số tiền/hướng tiền cục bộ từ thông báo ZaloPay trong phiên này.</label>
    <div className="op-actions">
      <Button disabled={!consent || busy || !status?.sourceVerified || status.active} onClick={() => void run(async () => { await nativeCollector('consent'); return startZaloPreview(); })}>Bật nhận thử ZaloPay</Button>
      <Button disabled={busy} onClick={() => void run(zaloPreviewStatus)}>Kiểm tra lại ZaloPay</Button>
      <Button disabled={busy || !status?.sourceVerified} onClick={() => void run(openZaloNotificationSettings)}>Cài đặt thông báo ZaloPay</Button>
      <Button disabled={busy || !status?.active} onClick={() => { setSynthetic(null); void run(stopZaloPreview); }}>Dừng và xóa mẫu</Button>
    </div>
    {status?.active && <>
      <p role="status">Đang nhận thử · còn {Math.ceil(status.remainingSeconds / 60)} phút · Android đã chuyển {status.callbacks} thông báo ZaloPay · {status.samples.length} mẫu. Bạn có thể rời FinWeave rồi quay lại.</p>
      {!status.callbacks && <p className="notice">Chưa nhận được thông báo ZaloPay trong phiên này. Bật quyền không tự tạo thông báo; FinWeave chỉ đọc thông báo mà ZaloPay phát qua Android, không đọc màn hình biên lai. Phiên này không phát thông báo giao dịch riêng từ FinWeave.</p>}
      {!!status.skipped && <p className="small">Đã bỏ qua {status.skipped} bản tóm tắt nhóm, bản không có trường chữ hoặc vượt giới hạn.</p>}
    </>}
    {status && !status.active && <p className="small muted">{reasons[status.reason]} Các mẫu của phiên đã kết thúc được xóa.</p>}
    {!!status?.discardedSensitive && <p className="small">Đã loại {status.discardedSensitive} thông báo có nội dung xác thực hoặc nhạy cảm.</p>}
    {status?.samples.map((sample, index) => <article key={sample.id} className="notice info">
      <strong>Android đã chuyển thông báo ZaloPay · mẫu {index + 1}</strong>
      {([['Tiêu đề', sample.title], ['Nội dung', sample.text], ['Nội dung mở rộng', sample.bigText], ['Dòng phụ', sample.subText]] as const).map(([label, value]) => value && <p key={label} className="small">{label}: {value}</p>)}
      <Analysis value={sample.analysis}/>
    </article>)}
    <div className="stack">
      <h3>Test bộ đọc ZaloPay bằng dữ liệu giả</h3>
      <p className="small">Không cần giao dịch hay thông báo ZaloPay. Các câu thử là ví dụ của quy tắc chung, không phải mẫu lấy từ ví thật. Bài test này kiểm bộ đọc; thẻ test Android phía trên kiểm việc phát/nhận thông báo.</p>
      <div className="op-actions">{(['income', 'expense', 'unknown'] as const).map(fixture => <Button key={fixture} disabled={busy} onClick={() => {
        setBusy(true); setError('');
        void testZaloParser(fixture).then(analysis => setSynthetic({ fixture, analysis })).catch(e => setError(message(e))).finally(() => setBusy(false));
      }}>{fixture === 'income' ? 'Test ZaloPay tiền vào' : fixture === 'expense' ? 'Test ZaloPay tiền ra' : 'Test không xác định'}</Button>)}</div>
      {synthetic && <article className="notice info" role="status"><strong>Dữ liệu giả · {synthetic.fixture === 'income' ? 'Tiền vào' : synthetic.fixture === 'expense' ? 'Tiền ra' : 'Thông báo thiếu thông tin'}</strong><Analysis value={synthetic.analysis}/></article>}
    </div>
    {(error || readError) && <p role="alert" className="notice error">{error || readError}</p>}
  </section>;
}
