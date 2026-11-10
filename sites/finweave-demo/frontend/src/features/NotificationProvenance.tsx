import { Link } from 'react-router';
import { useOperational } from '../app/operational-context';
import { receiptLabels } from './Devices';
export function NotificationProvenance({ eventId, reviewId }: {
    eventId?: string;
    reviewId?: string;
}) { const { state } = useOperational(); const receipt = state?.receipts.find(r => eventId ? r.eventId === eventId : r.reviewId === reviewId); if (!receipt)
    return null; return <section className="notice info stack"><strong>Nguồn thông báo & kết quả tiếp nhận</strong><dl className="detail-list"><dt>Nguồn</dt><dd>{receipt.source}</dd><dt>Thiết bị</dt><dd>{receipt.deviceId}</dd><dt>Bộ đọc</dt><dd>{receipt.parserVersion}</dd><dt>Nhận trên thiết bị</dt><dd>{new Date(receipt.observedAt).toLocaleString('vi-VN')}</dd><dt>Máy chủ nhận dữ liệu</dt><dd>{receipt.ackAt ? new Date(receipt.ackAt).toLocaleString('vi-VN') : 'Chưa xác nhận'}</dd><dt>Kết quả</dt><dd>{receiptLabels[receipt.state]}</dd><dt>Mã tiếp nhận</dt><dd>{receipt.id}</dd></dl><Link className="btn" to="/data/devices">Xem thiết bị & đồng bộ</Link></section>; }
