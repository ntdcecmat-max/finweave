import {useQuery} from '@tanstack/react-query';
import {useApp} from '../app/context';
import {realCall} from '../services/real-transport';
export function ScreenshotProvenance({eventId}:{eventId:string}){
 const {masked}=useApp();
 const query=useQuery({queryKey:['fw','screenshot-evidence',eventId],enabled:!masked,queryFn:async({signal})=>{
  const transaction=await realCall('getTransaction',{id:eventId},{signal});
  const evidence=await Promise.all(transaction.data.evidenceIds.map((id:string)=>realCall('getEvidence',{id},{signal})));
  return evidence.find(e=>e.data.sourceId==='screenshot-owner')?.data;
 }});
 if(masked)return <div className="notice">Đã ẩn thông tin đọc từ ảnh giao dịch.</div>;
 if(query.isPending)return <p role="status">Đang tải thông tin ảnh giao dịch…</p>;
 if(query.error)return <div role="alert" className="notice error">Chưa tải được thông tin ảnh giao dịch.</div>;
 const fields=query.data?.content?.normalizedFields;if(!fields)return null;
 return <section className="notice stack"><strong>Nguồn ảnh giao dịch</strong><dl className="detail-list"><dt>Ngân hàng / số tài khoản</dt><dd>{fields.bank} · {fields.bankAccount}</dd><dt>Giờ giao dịch trên ảnh</dt><dd>{fields.time||'Chưa đọc được'} · {query.data.observedDate}</dd><dt>Bộ đọc</dt><dd>{fields.engine} · {fields.language}</dd><dt>Cách lưu</dt><dd>{fields.mode==='auto'?'Tự động sau khi đọc đủ thông tin':'Đã kiểm tra và xác nhận'}</dd><dt>Mã ảnh</dt><dd className="break">{fields.imageDigest}</dd></dl>{fields.rawText&&<details><summary>Văn bản đọc từ ảnh</summary><pre className="screenshot-raw">{fields.rawText}</pre></details>}</section>;
}
