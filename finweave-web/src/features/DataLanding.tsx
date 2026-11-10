import { Link } from 'react-router';
import { Smartphone, RefreshCw, FileUp } from 'lucide-react';
import { useApp, PrivateText } from '../app/context';
import { Badge } from '../components/ui';
import { Subtabs } from './Home';
import { dataTabs, Receipts, CoverageStrip } from './Devices';
import { ScreenshotImport } from './ScreenshotImport';
import { ImportWizard } from './ImportWizard';
import { ImportJobs } from './ImportJobs';
import { isStale } from '../domain/selectors';
export function DataLanding() {
    const { store } = useApp();
    if (!store)
        return null;
    return <div className="stack"><div className="page-heading"><div><div className="eyebrow">DỮ LIỆU · NGUỒN & CHẤT LƯỢNG</div><h1>Quản lý nguồn dữ liệu</h1></div><Badge tone="warning">Dữ liệu minh họa</Badge></div><Subtabs items={dataTabs}/><CoverageStrip />
 <section className="grid three"><article className="card stack"><Smartphone size={28}/><h2>Thông báo Android (tùy chọn)</h2><p className="small muted">Chọn nguồn ngân hàng / ví và gắn đúng tài khoản. Xem trạng thái nhận, gửi, hàng đợi và kiểm tra dữ liệu.</p><Link className="btn" to="/data/android">Thiết lập tự động ghi nhận</Link><Link className="table-btn" to="/data/devices">Xem thiết bị & lần đồng bộ</Link></article><article className="card stack"><RefreshCw size={28}/><h2>Giá cổ phiếu & vàng</h2><p className="small muted">Cập nhật giá theo tác vụ. Giữ giá tốt gần nhất khi nguồn lỗi; không thay số lượng hoặc tiền trong tài khoản.</p><Link className="btn" to="/home/assets">Cập nhật & theo dõi giá</Link></article><article className="card stack"><FileUp size={28}/><h2>Ảnh giao dịch & CSV</h2><p className="small muted">Chụp hoặc chọn ảnh giao dịch để đọc số tiền và lưu tự động. Ảnh thiếu thông tin sẽ chờ kiểm tra.</p><a href="#screenshot-import" className="btn">Nhập ảnh giao dịch</a><Link className="table-btn" to="/transactions">Ghi giao dịch thủ công</Link></article></section>
 <section className="card stack"><h2>Trạng thái nguồn</h2>{store.sources.map(s => <article className="list-row" key={s.id}><div><h3>{s.name}</h3><p className="small muted">Thành công gần nhất: {(s.lastSuccess?new Date(s.lastSuccess).toLocaleString('vi-VN'):'Chưa có')}</p>{s.error && <p className="small" role="alert">{s.error}</p>}</div><div className="row"><Badge tone={s.connection !== 'connected' || isStale(store.clock, s.lastSuccess, 48) ? 'warning' : ''}>{s.connection === 'revoked' ? 'Quyền đã thu hồi' : s.connection === 'disconnected' ? 'Đã ngắt' : isStale(store.clock, s.lastSuccess, 48) ? 'Dữ liệu cũ' : 'Đang kết nối minh họa'}</Badge><Link className="btn" to={'/data/sources/' + s.id}>Xem chi tiết</Link></div></article>)}<p className="small muted">Nguồn ngắt kết nối không đồng nghĩa với không phát sinh giao dịch.</p></section><ScreenshotImport/><Receipts /><section id="csv-import"><ImportWizard /></section><ImportJobs /><section className="card stack"><h2>Lịch sử nhập dữ liệu</h2>{store.imports.length ? store.imports.map(j => <div className="list-row" key={j.id}><div><strong>{j.id}</strong><p className="small muted"><PrivateText>{j.history.join(' · ')}</PrivateText></p></div><Badge>Đã xác nhận</Badge></div>) : <p className="small muted">Chưa xác nhận lô dữ liệu nào.</p>}<details><summary>Nhật ký thay đổi · {store.audit.length}</summary><div className="small muted"><PrivateText replacement="Đã ẩn nhật ký có nội dung tài chính">{store.audit.map((line, i) => <p key={i}>{line}</p>)}</PrivateText></div></details></section>
 </div>;
}
