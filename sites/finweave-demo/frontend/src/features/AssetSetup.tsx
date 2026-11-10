import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, TrendingUp, Coins, CheckCircle2 } from 'lucide-react';
import { Button, Modal, Badge } from '../components/ui';
import { MoneyInput } from '../components/MoneyInput';
import { useApp, PrivateText } from '../app/context';
import { useView } from '../app/view';
import { useOperational } from '../app/operational-context';
import { operational } from '../services/operational';
import type { OpInput, OpOutput } from '../contracts/operational';
import { fmtDate, quantityLabel } from '../domain/selectors';
import './operational.css';
export function AssetSetup({ onClose, holdingId }: {
    onClose: () => void;
    holdingId?: string;
}) {
    const { store, masked } = useApp(), op = useOperational();
    const existing = store?.holdings.find(h => h.id === holdingId);
    const [kind, setKind] = useState<'stock' | 'gold'>(existing?.kind ?? 'stock'), [search, setSearch] = useState(''), [catalogId, setCatalog] = useState(''), [quantity, setQuantity] = useState(existing?.quantity ?? ''), [cost, setCost] = useState(existing?.cost?.amount ?? ''), [date, setDate] = useState(existing?.date ?? store?.clock.slice(0, 10) ?? ''), [confirmed, setConfirmed] = useState(false), [error, setError] = useState('');
    const [preview, setPreview] = useState<{
        result: OpOutput<'previewHolding'>;
        input: OpInput<'previewHolding'>;
    } | null>(null);
    const instruments = useQuery({ queryKey: ['fw', '2.0.0', 'instruments', search], queryFn: ({ signal }) => operational('searchInstruments', { query: search }, { signal }) });
    const gold = useQuery({ queryKey: ['fw', '2.0.0', 'gold-profiles'], queryFn: ({ signal }) => operational('getGoldProfiles', {}, { signal }) });
    useEffect(() => { setCatalog(''); setConfirmed(false); setPreview(null); if (kind === 'gold' && !existing) {
        try {
            const id = sessionStorage.getItem('fw:gold-profile');
            if (id) {
                setCatalog(id);
                setConfirmed(true);
            }
        }
        catch { }
    } }, [kind]);
    const input: OpInput<'previewHolding'> = { existingId: holdingId ?? null, kind, catalogId, quantity: quantity.replace(',', '.'), date, cost: cost || null, profileConfirmed: kind === 'stock' || confirmed };
    useEffect(() => { setPreview(null); setError(''); }, [kind, catalogId, quantity, date, cost, confirmed]);
    const submit = async () => { try {
        const result = await op.execute('previewHolding', input);
        setPreview({ result, input });
    }
    catch (e) {
        setError((e as Error).message.includes('[') ? 'Kiểm tra mã tài sản, số lượng lớn hơn 0, ngày và số tiền hợp lệ.' : (e as Error).message);
    } };
    return <Modal open onClose={onClose} title={existing ? 'Xác nhận mã / bảng giá tài sản' : 'Thêm tài sản'} description="Chọn tài sản và khai báo số lượng bạn đang sở hữu. Thao tác này không tạo giao dịch mua hoặc trừ tiền.">
  {masked ? <div className="notice">Bật hiển thị thông tin tài chính để nhập tài sản.</div> : <form className="stack" onSubmit={e => { e.preventDefault(); void submit(); }}>
   <div className="op-segment" role="group" aria-label="Loại tài sản">{(['stock', 'gold'] as const).map(k => <Button type="button" key={k} aria-pressed={kind === k} disabled={!!existing} onClick={() => setKind(k)}>{k === 'stock' ? <TrendingUp size={18}/> : <Coins size={18}/>} {k === 'stock' ? 'Cổ phiếu' : 'Vàng'}</Button>)}</div>
   <div className="notice info small">Giá thị trường từ SSI iBoard, PNJ và BTMC. Chọn đúng mã / sàn hoặc sản phẩm vàng để cập nhật giá; số lượng do bạn khai báo.</div>
   {kind === 'stock' ? <><div className="field"><label htmlFor="instrument-search">Mã cổ phiếu</label><input id="instrument-search" value={search} onChange={e => { setSearch(e.target.value.toUpperCase()); setCatalog(''); }} maxLength={30} placeholder="Ví dụ: FPT, VCB, HPG" autoComplete="off"/></div><div className="field"><label htmlFor="instrument-choice">Chọn đúng mã và sàn giao dịch</label><select id="instrument-choice" required value={catalogId} onChange={e => setCatalog(e.target.value)}><option value="">Chọn cổ phiếu…</option>{instruments.data?.map(i => <option key={i.id} value={i.id} disabled={!i.supported}>{i.symbol} · {i.exchange} · {i.name}{i.supported ? '' : ' · chưa hỗ trợ'}</option>)}</select>{instruments.isPending && <span role="status">Đang tìm mã…</span>}{instruments.error && <p role="alert">Không tải được danh mục. <Button type="button" onClick={() => void instruments.refetch()}>Thử lại</Button></p>}{instruments.data?.length === 0 && <p className="small muted">Không tìm thấy mã được hỗ trợ. Chọn mã khác hoặc thử lại sau.</p>}<span className="small muted">Tiền tệ VND · Đơn vị cổ phiếu</span></div></> : <div className="stack"><div className="field"><label htmlFor="gold-profile">Loại vàng & bảng giá</label><select id="gold-profile" required value={catalogId} onChange={e => { setCatalog(e.target.value); setConfirmed(false); }}><option value="">Chọn loại vàng…</option>{gold.data?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>{gold.error && <p role="alert">Không tải được loại vàng. <Button type="button" onClick={() => void gold.refetch()}>Thử lại</Button></p>}</div>{catalogId && <div className="notice info"><p className="small">{gold.data?.find(p => p.id === catalogId)?.source} · VND / chỉ. Dùng giá mua vào để tham khảo giá trị có thể bán.</p>{confirmed ? <p className="row small"><CheckCircle2 size={18}/>Đã xác nhận loại vàng <Button type="button" variant="ghost" onClick={() => setConfirmed(false)}>Đổi xác nhận</Button></p> : <Button type="button" onClick={() => { setConfirmed(true); try {
            sessionStorage.setItem('fw:gold-profile', catalogId);
        }
        catch { } }}>Xác nhận loại vàng này</Button>}</div>}</div>}
   <div className="form-grid"><div className="field"><label htmlFor="asset-quantity">{kind === 'stock' ? 'Số cổ phiếu' : 'Số chỉ vàng'} *</label><input id="asset-quantity" required inputMode="decimal" value={quantity} onChange={e => setQuantity(e.target.value)} disabled={!!existing || kind === 'gold' && !confirmed} placeholder={kind === 'stock' ? '100' : '1,5'}/></div><div className="field"><label htmlFor="asset-date">Ngày khai báo số lượng *</label><input id="asset-date" type="date" disabled={!!existing} required min={store?.tracking} max={store?.clock.slice(0, 10)} value={date} onChange={e => setDate(e.target.value)}/></div></div>
   <details><summary>Thêm giá vốn (tùy chọn)</summary><div className="field"><label htmlFor="asset-cost">Tổng giá vốn</label><MoneyInput id="asset-cost" disabled={!!existing} value={cost} onValueChange={setCost}/><p className="small muted">Giá vốn giúp theo dõi chênh lệch định giá; không tạo khoản chi mới.</p></div></details>
   {preview && <section className="notice info stack"><strong>{preview.result.name}</strong><p>{preview.input.quantity} {preview.result.unit} · khai báo ngày {fmtDate(date)}</p><p className="small">Giá trị cần giá tương thích với mã hoặc bảng giá đã chọn. Cập nhật giá sau khi xác nhận; lịch sử và số lượng được giữ.</p></section>}
   {(error || op.actionError) && <div role="alert" className="notice error">{error || op.actionError}</div>}
   <div className="dialog-footer"><Button type="button" onClick={onClose}>Hủy</Button>{preview ? <Button type="button" variant="primary" disabled={op.busy || preview.result.version !== store?.version || Date.parse(preview.result.expiresAt) <= Date.now()} onClick={async () => { try {
            await op.execute('confirmHolding', { ...preview.input, token: preview.result.token });
            onClose();
        }
        catch (e) {
            setError((e as Error).message);
        } }}>{op.busy ? 'Đang lưu…' : 'Xác nhận thêm tài sản'}</Button> : <Button type="submit" variant="primary" disabled={op.busy || !catalogId || !quantity || kind === 'gold' && !confirmed}>{op.busy ? 'Đang kiểm tra…' : 'Xem lại thông tin'}</Button>}</div>
   {preview && preview.result.version !== store?.version && <p className="notice" role="alert">Dữ liệu đã đổi. <Button type="button" onClick={() => void submit()}>Xem lại thông tin mới</Button></p>}
  </form>}
 </Modal>;
}
const jobLabels = { queued: 'Đang chờ', running: 'Đang cập nhật', succeeded: 'Đã cập nhật', partial: 'Cập nhật một phần', failed: 'Chưa cập nhật được', rate_limited: 'Cần chờ hạn mức' };
function marketTime(value: string, dateOnly = false) {
    return new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', ...(!dateOnly && { hour: '2-digit', minute: '2-digit' }) });
}
export function PriceRefresh() {
    const { store } = useApp(), { openAction } = useView(), op = useOperational();
    const job = op.state?.priceJobs.at(-1), pending = job && ['queued', 'running'].includes(job.status);
    const holdings = store?.holdings.filter(h => !h.archived) ?? [];
    const [error, setError] = useState('');
    return <section className="card op-price-panel" aria-label="Bảng giá tài sản">
        <div className="market-price-heading">
            <div><h2>Bảng giá tài sản</h2><p className="small muted">Tự cập nhật mỗi phút khi mở ứng dụng</p></div>
            <Button disabled={op.busy || !!pending || !holdings.length} onClick={async () => {
                try { setError(''); await op.execute('requestPriceRefresh', { holdingIds: [] }); }
                catch (e) { setError((e as Error).message); }
            }}><RefreshCw size={16} className={pending ? 'op-spin' : ''}/>{pending || op.busy ? 'Đang cập nhật…' : 'Cập nhật giá'}</Button>
        </div>
        <div className="market-price-status" role="status">
            {job ? <Badge tone={job.status === 'failed' ? 'error' : job.status === 'partial' ? 'warning' : ''}>{jobLabels[job.status]}</Badge> : <span className="small muted">Đang chờ cập nhật</span>}
            {job?.fetchedAt && <span className="meta muted">Kiểm tra gần nhất: {marketTime(job.fetchedAt)}</span>}
        </div>
        <div className="market-price-grid">
            {holdings.map(h => {
                const quote = h.quotes.filter(q => q.compatible && (h.kind === 'gold' ? q.unit !== 'share' : q.unit === 'share')).sort((a, b) => Date.parse(a.date) - Date.parse(b.date)).at(-1);
                const result = job?.results.find(r => r.holdingId === h.id);
                const example = !!quote && /minh họa|^S-PRICE$|demo/i.test(quote.source);
                const provider = quote?.source.startsWith('SSI iBoard') ? 'SSI iBoard' : quote?.source.startsWith('PNJ') ? 'PNJ · TP.HCM' : quote?.source.startsWith('BTMC') ? 'BTMC' : example ? 'Dữ liệu minh họa' : quote?.source;
                const stale = quote && Date.now() - Date.parse(quote.date) > 24 * 3600000;
                const confirm = !quote || !!result && /Xác nhận|Chưa xác nhận/.test(result.reason);
                const retained = result && result.state !== 'updated';
                return <article className={'market-price-card ' + (h.kind === 'gold' ? 'market-price-gold' : 'market-price-stock')} key={h.id} aria-labelledby={'market-price-' + h.id}>
                    <div className="market-price-card-head">
                        <span className="market-price-icon" aria-hidden="true">{h.kind === 'gold' ? <Coins size={21}/> : <TrendingUp size={21}/>}</span>
                        <div><p className="market-price-kind">{h.kind === 'gold' ? 'Vàng' : 'Cổ phiếu'}</p><h3 id={'market-price-' + h.id}><PrivateText>{h.name}</PrivateText></h3></div>
                        {example ? <Badge tone="warning">Giá mẫu</Badge> : retained && quote ? <Badge tone="warning">Giữ giá gần nhất</Badge> : stale ? <Badge tone="warning">Giá cũ</Badge> : null}
                    </div>
                    <div className="market-price-value-block">
                        <p className="market-price-caption">{h.kind === 'gold' && /PNJ|BTMC/.test(provider ?? '') ? 'Giá mua vào' : 'Giá tham chiếu'}</p>
                        <div className="market-price-value"><PrivateText>{quote ? <><strong>{quantityLabel(quote.price)}</strong><span className="market-price-currency">{quote.currency === 'VND' ? '₫' : 'USD'}</span></> : <strong className="market-price-missing">Chưa có giá</strong>}</PrivateText></div>
                        <p className="market-price-unit">{quote?.unit === 'luong' ? 'cho 1 lượng vàng' : h.kind === 'gold' ? 'cho 1 chỉ vàng' : 'cho 1 cổ phiếu'}</p>
                    </div>
                    <dl className="market-price-metadata"><div><dt>Nguồn</dt><dd>{provider ?? 'Chưa có nguồn giá'}</dd></div><div><dt>{h.kind === 'stock' ? 'Phiên giao dịch' : 'Giá niêm yết lúc'}</dt><dd>{quote ? marketTime(quote.date, h.kind === 'stock') : 'Chưa cập nhật'}</dd></div></dl>
                    {retained && !confirm && <p className="market-price-note">{result.reason}</p>}
                    {confirm && <div className="market-price-confirm"><p className="small muted">Chọn đúng mã hoặc bảng giá để nhận giá thị trường.</p><Button onClick={() => openAction('holding', h.id)}>Xác nhận mã / bảng giá</Button></div>}
                </article>;
            })}
        </div>
        {!holdings.length && <p className="notice info">Thêm cổ phiếu hoặc vàng để bắt đầu theo dõi giá.</p>}
        {(error || op.actionError) && <p className="notice error" role="alert">{error || op.actionError}</p>}
        <div className="market-price-footer"><p className="meta muted">Giá có thể trễ theo nguồn. Vàng trong nước dùng giá mua vào.</p>
            {job && <details className="market-price-details"><summary>Chi tiết cập nhật</summary><div className="market-price-detail-content"><p className="small muted">{op.state?.dailyPriceSchedule}</p><p className="meta muted">Mã lần cập nhật: {job.id}</p>{job.coalesced && <p className="small muted">Đang dùng chung lần cập nhật đã yêu cầu.</p>}{job.results.map(r => <p className="small muted" key={r.holdingId}><PrivateText>{store?.holdings.find(h => h.id === r.holdingId)?.name ?? r.holdingId}</PrivateText>: {r.reason}</p>)}<p className="small muted">Nguồn: <a href="https://iboard.ssi.com.vn/" target="_blank" rel="noreferrer">SSI iBoard</a> · <a href="https://www.pnj.com.vn/site/gia-vang" target="_blank" rel="noreferrer">PNJ</a> · <a href="https://btmc.vn/" target="_blank" rel="noreferrer">BTMC</a></p></div></details>}
        </div>
    </section>;
}
