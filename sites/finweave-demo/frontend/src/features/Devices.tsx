import {activeWorkspace} from '../services/real-transport';import {dataMode} from '../services/api';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Smartphone, ShieldCheck, RefreshCw, ArrowRight, Wifi, CheckCircle2 } from 'lucide-react';
import { useApp, PrivateText } from '../app/context';
import { useOperational } from '../app/operational-context';
import { Button, Badge, Modal, Empty } from '../components/ui';
import { Subtabs } from './Home';
import { collectorAvailable, collectorStatus, nativeCollector, nativeShellAvailable } from '../native/collector';
import type { CollectorStatus } from '../native/collector';
import { demoSources } from '../native/demo-sources';
import { NotificationTestPanel } from './NotificationTestPanel';
import { ZaloPayPreviewPanel } from './ZaloPayPreviewPanel';
import { notificationTestAvailable } from '../native/notification-test';
import type { OperationalState } from '../contracts/operational';
import { operational } from '../services/operational';
import './operational.css';
export const dataTabs = [{ path: '/data', label: 'Nguồn dữ liệu' }, { path: '/data/review', label: 'Kiểm tra dữ liệu' }, { path: '/data/devices', label: 'Thiết bị & đồng bộ' }, { path: '/data/android', label: 'Thiết lập Android' }];
const time = (v: string | null) => v ? new Date(v).toLocaleString('vi-VN') : 'Chưa có thông tin';
export const receiptLabels = { received: 'Đã gửi lên máy chủ', parsed: 'Đã đọc thông tin', posted: 'Đã ghi sổ', needs_review: 'Chờ kiểm tra', ignored: 'Không phải giao dịch', failed: 'Xử lý thất bại' };
function Header({ title }: {
    title: string;
}) { return <><div className="page-heading"><div><div className="eyebrow">DỮ LIỆU · KẾT NỐI TRONG TẦM KIỂM SOÁT</div><h1>{title}</h1></div></div><Subtabs items={dataTabs}/></>; }
export function CoverageStrip() { const op = useOperational(); if (!op.state)
    return null; const active = op.state.devices.filter(d => d.status === 'active'), review = op.state.receipts.filter(r => r.state === 'needs_review').length; return <div className="op-coverage"><span className="small">{active.length ? `${active.length} thiết bị minh họa · ${review} thông báo chờ kiểm tra` : 'Chưa kết nối điện thoại · Bạn vẫn có thể nhập giao dịch thủ công hoặc CSV.'}</span><Link className="table-btn" to="/data/devices">Thiết bị & đồng bộ <ArrowRight size={14}/></Link></div>; }
export function Devices() {
    const op = useOperational(), { store } = useApp(), nav = useNavigate();
    const [revoke, setRevoke] = useState<OperationalState['devices'][number] | null>(null), [reason, setReason] = useState(''), [preview, setPreview] = useState(false), [error, setError] = useState('');
    return <div className="stack"><Header title="Thiết bị & đồng bộ"/>{op.loading && <p role="status">Đang tải thiết bị…</p>}{op.error && <div role="alert" className="notice error">Không tải được trạng thái thiết bị. <Button onClick={() => void op.refresh()}>Thử lại</Button></div>}{op.state?.devices.length === 0 && <Empty title="Bạn chưa kết nối điện thoại" action={<Link className="btn primary" to="/data/android">Thiết lập trên Android</Link>}>Điện thoại Android có thể gửi bằng chứng giao dịch từ các ứng dụng bạn chọn. Web vẫn hoạt động với nhập tay và CSV.</Empty>}
 {op.state?.devices.map(d => <article className="card" key={d.id}><div className="op-device-head"><Smartphone size={32}/><div><h2>{d.name}</h2><p className="small muted">{d.appVersion} · {d.synthetic ? 'Thiết bị minh họa' : 'Android'} · {d.id}</p></div><Badge tone={d.status === 'revoked' ? 'unknown' : ''}>{d.status === 'active' ? 'Đang hoạt động' : 'Đã thu hồi'}</Badge></div><dl className="op-status-grid"><div><dt>Quyền đọc thông báo (lần báo cáo cuối)</dt><dd>{d.permission === 'granted' ? 'Đã cho phép' : d.permission === 'denied' ? 'Chưa cho phép' : 'Chưa xác định'}</dd></div><div><dt>Kết nối mạng (lần báo cáo cuối)</dt><dd>{d.network === 'online' ? 'Có kết nối' : d.network === 'offline' ? 'Ngoại tuyến' : 'Chưa xác định'}</dd></div><div><dt>Thiết bị báo trạng thái lúc</dt><dd>{time(d.lastSeen)}</dd></div><div><dt>Thông báo gần nhất</dt><dd>{time(d.lastObserved)}</dd></div><div><dt>Máy chủ xác nhận nhận dữ liệu</dt><dd>{time(d.lastAck)}</dd></div><div><dt>Đang chờ gửi</dt><dd>{d.pending} mục</dd></div></dl>{d.gaps.map(g => <p className="notice" key={g}>{g}</p>)}<div className="op-actions"><Button onClick={() => nav('/data/android')}>Nguồn & hàng đợi</Button>{d.status === 'active' && <Button onClick={() => { setRevoke(d); setReason(''); setPreview(false); setError(''); }}>Thu hồi kết nối</Button>}</div></article>)}
 <Receipts />
 <section className="card stack"><h2>Cài và cập nhật ứng dụng</h2><p>Ứng dụng Android sử dụng cùng tài khoản và dữ liệu tài chính với web. Chỉ những nguồn bạn chọn mới được xử lý.</p><div className="op-native-note">Chưa có APK đã ký được công bố trong prototype. Khi có bản phát hành, trang này sẽ hiển thị phiên bản, mã kiểm tra tệp và hướng dẫn cài đặt.</div><ol><li>Nhận APK từ kênh phát hành chính thức của FinWeave.</li><li>Kiểm tra phiên bản và mã kiểm tra tệp trước khi cài.</li><li>Đăng nhập, đọc phần giải thích rồi chủ động cấp quyền trong Android.</li><li>Chọn nguồn được hỗ trợ, gắn đúng tài khoản và kiểm tra kết quả.</li></ol><p className="small muted">Cập nhật cần cùng danh tính ký ứng dụng. Gỡ app có thể làm mất các mục chưa gửi; kiểm tra hàng đợi trước khi gỡ.</p><Link className="btn" to="/data">Nhập CSV hoặc dùng thủ công</Link></section>
 {revoke && <Modal open onClose={() => setRevoke(null)} title="Thu hồi kết nối điện thoại" description="Dừng nhận và gửi dữ liệu mới từ thiết bị. Giao dịch đã ghi sổ và lịch sử vẫn được giữ."><form className="stack" onSubmit={async (e) => { e.preventDefault(); if (!preview) {
        setPreview(true);
        return;
    } try {
        await op.execute('revokeDevice', { id: revoke.id, expectedVersion: revoke.version, reason });
        setRevoke(null);
    }
    catch (e) {
        setError((e as Error).message);
        setPreview(false);
    } }}><div className="field"><label htmlFor="revoke-reason">Lý do thu hồi *</label><input id="revoke-reason" required minLength={3} value={reason} onChange={e => { setReason(e.target.value); setPreview(false); }}/></div>{preview && <div className="notice">Thu hồi {revoke.name}. Các nguồn gắn thiết bị này sẽ bị tắt. Tác vụ đang gửi phải kiểm tra quyền lại trên máy chủ.</div>}{error && <div className="notice error" role="alert">{error}</div>}<div className="dialog-footer"><Button type="button" onClick={() => setRevoke(null)}>Hủy</Button><Button type="submit" variant="primary" disabled={op.busy}>{preview ? 'Xác nhận thu hồi' : 'Xem tác động'}</Button></div></form></Modal>}
 </div>;
}
export function Receipts() { const op = useOperational(), { store } = useApp(); return <section className="card stack"><h2>Kết quả tiếp nhận</h2><p className="small muted">Máy chủ nhận được dữ liệu chưa đồng nghĩa với giao dịch đã ghi sổ.</p>{op.state?.receipts.length ? op.state.receipts.slice().reverse().map(r => <article className="op-run" key={r.id}><div className="row between"><strong className="op-receipt-state">{receiptLabels[r.state]}</strong><span className="meta muted">{r.id}</span></div><p className="small muted">{r.source} · bộ đọc {r.parserVersion}</p><p className="small">Nhận trên thiết bị: {time(r.observedAt)} · Máy chủ xác nhận: {time(r.ackAt)}</p>{r.reason && <p className="small"><PrivateText>{r.reason}</PrivateText></p>}{r.reviewId && <Link className="btn" to="/data/review">Kiểm tra và bổ sung thông tin</Link>}{r.eventId && <Link className="btn" to={'/transactions?selected=event:' + encodeURIComponent(r.eventId)}>Mở giao dịch</Link>}</article>) : <p className="small muted">Chưa có kết quả tiếp nhận từ điện thoại.</p>}</section>; }
export function AndroidSetup() {
    const op = useOperational(), { store, masked } = useApp();
    const [step, setStep] = useState(0), [consent, setConsent] = useState(false), [example, setExample] = useState(false), [packages, setPackages] = useState<string[]>([]), [mapping, setMapping] = useState<Record<string, string>>({}), [error, setError] = useState(''), [native, setNative] = useState<CollectorStatus | null>(null), [receipt, setReceipt] = useState<string | null>(null), [deleteReason, setDeleteReason] = useState<string | null>(null);
    const device = op.state?.devices.find(d => d.status === 'active'), available = collectorAvailable();
    const recheck = async () => { try {
        setNative(await collectorStatus());
    }
    catch (e) {
        setError((e as Error).message);
    } };
    useEffect(() => { void recheck(); const visible = () => { if (!document.hidden)
        void recheck(); }; document.addEventListener('visibilitychange', visible); return () => document.removeEventListener('visibilitychange', visible); }, []);
    const runNative = async (action: 'settings' | 'consent' | 'retry' | 'delete') => { try {
        setError('');
        await nativeCollector(action, { reason: deleteReason ?? undefined });
        await recheck();
        return true;
    }
    catch (e) {
        setError((e as Error).message);
        return false;
    } };
    const steps = ['Giải thích & quyền', 'Chọn nguồn', 'Gắn tài khoản', 'Kiểm tra', 'Trạng thái & hàng đợi'];
    const supported = dataMode==='backend'?op.state?.support??[]:nativeShellAvailable() ? [] : op.state?.support ?? [], accounts = store?.accounts.filter(a => !a.archived && a.kind !== 'cash') ?? [];
    return <div className="stack op-android"><Header title="Thiết lập tự động ghi nhận"/>{notificationTestAvailable() && <><NotificationTestPanel /><ZaloPayPreviewPanel /></>}{nativeShellAvailable() && <section className="card stack"><h2>Hai nguồn demo đã chọn</h2>{demoSources.map(source => <article key={source.id}><div className="row"><img src={source.logo} alt="" width={48} height={48} style={{ objectFit: "contain" }}/><strong>{source.name}</strong></div><p className="small muted">{source.reason}</p><Badge tone="warning">Chưa bật · chờ xác minh</Badge></article>)}<p className="notice">APK có collector native để tự động ghi nhận giao dịch. Nguồn thật chỉ bật sau khi profile và đăng ký thiết bị được xác minh; nhập tay và CSV vẫn sử dụng được.</p></section>}<ol className="op-stepper" aria-label="Các bước thiết lập">{steps.map((s, i) => <li key={s} aria-current={step === i ? 'step' : undefined}>{i + 1}. {s}</li>)}</ol>
 {step === 0 && <section className="card stack"><h2>Bạn chọn nguồn, FinWeave ghi nhận giúp bạn</h2><p>Chỉ xử lý thông báo giao dịch từ ứng dụng ngân hàng hoặc ví bạn đã chọn. Nội dung được lọc trên điện thoại; không gửi OTP, mật khẩu, thông báo từ app khác hoặc toàn bộ nội dung thô lên máy chủ.</p><p>Khi được hỗ trợ, app gửi các thông tin tối thiểu như số tiền, hướng tiền, thời điểm và tài khoản đã che để kiểm tra. Bạn có thể tắt nguồn, thu hồi kết nối hoặc tiếp tục nhập tay bất kỳ lúc nào.</p><div className="notice">FinWeave không thể khôi phục mọi giao dịch đã bỏ lỡ. Quyền Android, mạng và giới hạn chạy nền có thể tạo khoảng trống dữ liệu.</div><label className="check"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)}/>Tôi hiểu dữ liệu được xử lý và muốn thiết lập nguồn do tôi chọn.</label>{available ? <><p>Quyền đọc thông báo: <strong>{native?.permission === 'granted' ? 'Đã cho phép' : native?.permission === 'denied' ? 'Chưa cho phép' : 'Chưa xác định'}</strong></p><div className="op-actions"><Button disabled={!consent} onClick={async () => { if(await runNative('consent'))await runNative('settings'); }}>Mở cài đặt quyền Android</Button><Button onClick={() => void recheck()}>Kiểm tra lại quyền</Button><Button disabled={native?.permission !== 'granted' || !native?.enrolled} onClick={() => setStep(1)}>Tiếp tục</Button></div>{!native?.enrolled && dataMode==='backend'&&<Button disabled={!consent} onClick={async()=>{try{const b=(window as any).Capacitor?.Plugins?.FinWeaveOwner;await nativeCollector('consent');await b.enroll({workspaceId:activeWorkspace(),key:crypto.randomUUID()});await recheck();await op.refresh();}catch(e){setError((e as Error).message);}}}>Đăng ký điện thoại với máy chủ</Button>}{!native?.enrolled && <p className="notice">Thiết bị chưa đăng ký với máy chủ. Phần native cần hoàn tất đăng ký trước khi nhận dữ liệu thật.</p>}</> : <><div className="op-native-note">{nativeShellAvailable() ? 'Đang kiểm kết nối collector. Nếu phiên bản không tương thích, cần cập nhật ứng dụng. Nguồn thật và đăng ký thiết bị chưa bật; luồng minh họa bên dưới không nhận dữ liệu ngân hàng thật.' : 'Bạn đang xem giao diện web. Quyền đọc thông báo và hàng đợi nền chỉ hoạt động trong ứng dụng Android có phần native đã kết nối.'}</div><label className="check"><input type="checkbox" checked={example} onChange={e => setExample(e.target.checked)}/>Trải nghiệm luồng bằng thiết bị và thông báo minh họa</label><Button variant="primary" disabled={!consent || !example || op.busy} onClick={async () => { try {
        await op.execute('registerExampleDevice', { acknowledgeSynthetic: true });
        setStep(1);
    }
    catch (e) {
        setError((e as Error).message);
    } }}>Bắt đầu bản minh họa</Button></>}<Link to="/data" className="table-btn">Để sau, sử dụng nhập tay hoặc CSV</Link></section>}
 {step === 1 && <section className="card stack"><h2>Chọn ứng dụng được hỗ trợ</h2><p className="small muted">Không tự chọn tất cả ứng dụng. Danh sách dưới đây mới chỉ kiểm chứng luồng bằng dữ liệu minh họa.</p><div className="op-source-select">{supported.map(s => <label key={s.packageName}><input type="checkbox" disabled={!s.supported} checked={packages.includes(s.packageName)} onChange={e => setPackages(v => e.target.checked ? [...v, s.packageName] : v.filter(p => p !== s.packageName))}/><span>{s.name}<small>{s.reason}</small></span></label>)}</div><div className="op-actions"><Button onClick={() => setStep(0)}>Quay lại</Button><Button variant="primary" disabled={!packages.length} onClick={() => setStep(2)}>Gắn tài khoản</Button></div></section>}
 {step === 2 && <section className="card stack"><h2>Mỗi nguồn gửi vào tài khoản nào?</h2><p>Chọn đúng tài khoản bạn đang theo dõi. Nếu chưa rõ tài khoản, để lại bước này và tiếp tục bằng nhập tay.</p>{packages.map(p => <div className="field" key={p}><label htmlFor={'mapping-' + p}>{supported.find(s => s.packageName === p)?.name}</label><select id={'mapping-' + p} value={mapping[p] ?? ''} onChange={e => setMapping(v => ({ ...v, [p]: e.target.value }))}><option value="">Chọn tài khoản…</option>{accounts.map(a => <option key={a.id} value={a.id}>{masked ? 'Tài khoản đã ẩn' : a.name}</option>)}</select></div>)}{!accounts.length && <p className="notice">Thêm tài khoản ngân hàng hoặc ví ở Tài khoản & Tài sản trước khi gắn nguồn.</p>}<div className="notice info">Nguồn có nhiều tài khoản nhưng chưa nhận diện được tài khoản sẽ chuyển sang kiểm tra. Không tự chọn tài khoản đầu tiên, không đổi lịch sử đã ghi.</div><div className="op-actions"><Button onClick={() => setStep(1)}>Quay lại</Button><Button variant="primary" disabled={op.busy || packages.some(p => !mapping[p]) || !device} onClick={async () => { try {
        for (const p of packages) {
            const current = await operationalDevice(device!.id);
            await op.execute('bindCollector', { deviceId: current.id, expectedVersion: current.version, packageName: p, accountId: mapping[p], parserProfileId: supported.find(s => s.packageName === p)!.parserProfileId });
        }
        setStep(3);
    }
    catch (e) {
        setError((e as Error).message);
    } }}>Xác nhận gắn nguồn</Button></div></section>}
 {step === 3 && <section className="card stack"><h2>Kiểm tra đường đi của dữ liệu</h2><ol className="op-progress-steps"><li>Điện thoại nhận thông báo từ nguồn đã chọn</li><li>Lưu bằng chứng tối thiểu vào hàng đợi</li><li>Máy chủ xác nhận nhận dữ liệu</li><li>Ghi sổ hoặc chuyển sang kiểm tra</li></ol><p className="notice">Bài kiểm tra dùng thông báo minh họa thiếu thông tin để bạn thấy luồng Review. Không cần chuyển tiền thật.</p><Button variant="primary" disabled={op.busy || !device} onClick={async () => { try {
        const b = op.state?.bindings.find(b => b.deviceId === device?.id && b.enabled);
        if (!b)
            throw Error('Chưa có nguồn được gắn. Quay lại chọn tài khoản.');
        const r = await op.execute('testCollector', { deviceId: device!.id, bindingId: b.id });
        setReceipt(r.id);
    }
    catch (e) {
        setError((e as Error).message);
    } }}>Gửi thông báo kiểm tra minh họa</Button>{receipt && <div className="notice info"><p>Đã gửi lên máy chủ · Chờ kiểm tra. Chưa tạo giao dịch.</p><p className="meta muted">{receipt}</p><Link to="/data/review" className="btn">Mở phần kiểm tra dữ liệu</Link></div>}<div className="op-actions"><Button onClick={() => setStep(2)}>Quay lại</Button><Button onClick={() => setStep(4)}>Xem trạng thái & hàng đợi</Button></div></section>}
 {step === 4 && <><section className="card stack"><div className="row between"><h2>Hàng đợi trên điện thoại</h2><Button onClick={() => void recheck()}><RefreshCw size={16}/>Kiểm tra lại</Button></div><div className="notice info">Hàng đợi thật được lưu và xử lý bởi phần native, độc lập với màn hình React. Web không thay thế hàng đợi này.</div>{native?.queue.length ? native.queue.map(q => <div className="list-row" key={q.id}><div><strong>{q.source}</strong><p className="small muted">{time(q.observedAt)} · {q.state}</p><p className="small">{q.reason}</p>{q.retryAfter && <p className="small muted">Thử lại sau {time(q.retryAfter)}</p>}</div><span className="meta">{q.id}</span></div>) : <p>{available ? 'Không có mục chờ gửi được thiết bị báo cáo.' : 'Chưa có hàng đợi native kết nối. Các receipt minh họa nằm ở bên dưới.'}</p>}<p className="small muted">Tối đa 7 ngày hoặc 1.000 mục chưa nhận ACK. Chạm ngưỡng sẽ dừng nhận mới; mục hết hạn cần xử lý riêng, không xóa âm thầm. Sau ACK xóa payload; receipt metadata giữ 7 ngày.</p><div className="op-actions"><Button disabled={!available || !native?.ownerBound} onClick={() => void runNative('retry')}>Thử gửi lại các mục hợp lệ</Button><Button disabled={!available || !native?.queue.some(q => q.state === 'quarantined')} onClick={() => setDeleteReason('')}>Xóa mục bị cách ly</Button><Button onClick={() => setStep(1)}>Đổi nguồn</Button><Link className="btn" to="/data/devices">Thu hồi kết nối</Link></div><p className="small muted">Đăng xuất sẽ dừng nhận/gửi và cách ly hàng đợi theo tài khoản. Dữ liệu của chủ cũ không được gửi dưới phiên đăng nhập mới.</p></section><Receipts /></>}
 {error && <div className="notice error" role="alert">{error}</div>}{op.actionError && !error && <div className="notice error" role="alert">{op.actionError}</div>}
 {step !== 0 && <div className="row"><Button onClick={() => setStep(4)}>Trạng thái & hàng đợi</Button><Link to="/data" className="table-btn">Dùng nhập tay hoặc CSV</Link></div>}
 {deleteReason !== null && <Modal open onClose={() => setDeleteReason(null)} title="Xóa các mục bị cách ly" description="Chỉ xóa dữ liệu chưa được ghi sổ trong hàng đợi bị cách ly. Không xóa giao dịch đã đồng bộ."><form className="stack" onSubmit={async (e) => { e.preventDefault(); if(await runNative('delete'))setDeleteReason(null); }}><p>{native?.queue.filter(q => q.state === 'quarantined').length ?? 0} mục bị cách ly sẽ bị xóa khỏi điện thoại.</p><div className="field"><label htmlFor="delete-queue-reason">Lý do *</label><input required minLength={3} id="delete-queue-reason" value={deleteReason} onChange={e => setDeleteReason(e.target.value)}/></div><div className="dialog-footer"><Button type="button" onClick={() => setDeleteReason(null)}>Hủy</Button><Button type="submit" variant="primary">Xác nhận xóa</Button></div></form></Modal>}
 </div>;
}
async function operationalDevice(id: string) { const state = await operational('getState', {}); const device = state.devices.find(d => d.id === id && d.status === 'active'); if (!device)
    throw Error('Thiết bị đã thu hồi. Thiết lập lại trước khi tiếp tục.'); return device; }
