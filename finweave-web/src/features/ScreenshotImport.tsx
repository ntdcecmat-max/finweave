import {useEffect,useRef,useState} from 'react';
import {Camera,Upload,CheckCircle2} from 'lucide-react';
import {useQueryClient} from '@tanstack/react-query';
import {useApp} from '../app/context';
import {Button,Badge} from '../components/ui';
import {dataMode} from '../services/api';
import {scanScreenshot,saveScreenshot,saveInput,type ScreenshotScan,type ScreenshotRow,type ScreenshotResult} from '../services/screenshots';
import './screenshot-import.css';
const errorText=(error:unknown)=>{
 const code=(error as any)?.code;
 const messages:Record<string,string>={OCR_UNAVAILABLE:'Bộ đọc ảnh Windows chưa sẵn sàng. Mở ứng dụng với backend trên Windows và thử lại.',SCREENSHOT_POSSIBLE_DUPLICATE:'Có giao dịch tương tự nhưng ảnh không có mã tham chiếu để xác định trùng. Hãy đối chiếu trước khi xác nhận thêm mới.',SCREENSHOT_REVIEW_REQUIRED:'Thông tin cần kiểm tra trước khi ghi. Hãy sửa các trường thiếu rồi xác nhận.',SCREENSHOT_ACCOUNT_MISMATCH:'Số tài khoản trên ảnh khác với số đã ghi nhận cho tài khoản được chọn. Hãy chọn đúng tài khoản.',VERSION_CONFLICT:'Dữ liệu vừa thay đổi. Đã tải lại; nhấn lưu để thử lại.',VALIDATION:'Kiểm tra số tiền, ngày trong thời gian theo dõi và nội dung giao dịch.',PREVIEW_EXPIRED:'Bản đọc ảnh đã hết hạn sau 24 giờ. Hãy quét lại ảnh.'};
 return messages[code]||(error as Error).message;
};
export function ScreenshotImport(){
 const {store,masked,generation}=useApp(),client=useQueryClient();
 const [account,setAccount]=useState(''),[auto,setAuto]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[scan,setScan]=useState<ScreenshotScan|null>(null),[rows,setRows]=useState<ScreenshotRow[]>([]),[selected,setSelected]=useState<number[]>([]),[result,setResult]=useState<ScreenshotResult|null>(null),[image,setImage]=useState('');
 const [possibleDuplicate,setPossibleDuplicate]=useState(false),[confirmSimilar,setConfirmSimilar]=useState(false);
 const fileInput=useRef<HTMLInputElement>(null),cameraInput=useRef<HTMLInputElement>(null),controller=useRef<AbortController|null>(null),lock=useRef(false),alive=useRef(true),ticket=useRef(0),pending=useRef<{input:ReturnType<typeof saveInput>;key:string;version:number}|null>(null);
 const accounts=store?.accounts.filter(a=>!a.archived)??[];
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort();};},[]);
 useEffect(()=>()=>{if(image)URL.revokeObjectURL(image);},[image]);
 useEffect(()=>{ticket.current++;controller.current?.abort();lock.current=false;pending.current=null;setScan(null);setRows([]);setResult(null);setImage('');setPossibleDuplicate(false);setConfirmSimilar(false);setError('');setBusy(false);},[generation]);
 useEffect(()=>{if(!accounts.some(a=>a.id===account))setAccount(accounts[0]?.id||'');},[account,accounts.map(a=>a.id).join(',')]);
 if(!store)return null;
 const reset=()=>{ticket.current++;controller.current?.abort();pending.current=null;setScan(null);setRows([]);setSelected([]);setResult(null);setError('');setImage('');setPossibleDuplicate(false);setConfirmSimilar(false);};
 const refresh=()=>client.invalidateQueries({queryKey:['fw']});
 const recover=async(e:unknown)=>{setError(errorText(e));const error=e as any;if(error.code==='SCREENSHOT_POSSIBLE_DUPLICATE')setPossibleDuplicate(true);if(error.status>=400&&error.status<500&&error.outcome!=='unknown'&&error.outcome!=='committed')pending.current=null;if(error.code==='VERSION_CONFLICT')await refresh();};
 const persist=async(currentScan:ScreenshotScan,currentRows:ScreenshotRow[],mode:'auto'|'reviewed',signal:AbortSignal)=>{
  const input=saveInput(currentScan,currentRows,mode,mode==='reviewed'&&confirmSimilar);if(!pending.current)pending.current={input,key:crypto.randomUUID(),version:store.version};
  const saved=await saveScreenshot(pending.current.input,pending.current.key,pending.current.version,signal);
  if(signal.aborted||!alive.current)return;pending.current=null;setResult(saved);await refresh();
 };
 const choose=async(file?:File)=>{
  if(!file||lock.current)return;reset();const currentTicket=ticket.current;lock.current=true;setBusy(true);const c=new AbortController();controller.current=c;
  try{setImage(URL.createObjectURL(file));const value=await scanScreenshot(account,file,c.signal);if(c.signal.aborted||!alive.current||ticket.current!==currentTicket)return;
   setScan(value);setRows(value.rows);setSelected(value.rows.map(r=>r.index));
   if(auto&&value.rows.every(r=>!r.warnings.length&&r.kind!=='unknown'))await persist(value,value.rows,'auto',c.signal);
  }catch(e){if(!c.signal.aborted&&alive.current&&ticket.current===currentTicket)await recover(e);}
  finally{if(ticket.current===currentTicket){lock.current=false;if(alive.current)setBusy(false);}}
 };
 const save=async()=>{if(!scan||lock.current)return;lock.current=true;setBusy(true);setError('');const c=new AbortController();controller.current=c;try{await persist(scan,rows.filter(r=>selected.includes(r.index)),'reviewed',c.signal);}catch(e){if(!c.signal.aborted&&alive.current)await recover(e);}finally{lock.current=false;if(alive.current)setBusy(false);}};
 const update=(index:number,key:string,value:string)=>{if(pending.current)return;setRows(old=>old.map(r=>r.index===index?{...r,[key]:value}:r));};
 const uncertain=!!pending.current;
 return <section className="card stack screenshot-import" id="screenshot-import" aria-busy={busy}>
  <div className="card-head"><div><div className="eyebrow">NHẬP GIAO DỊCH BẰNG ẢNH</div><h2>Chụp ảnh, tự động ghi nhận</h2><p className="small muted">Đọc số tiền, chiều thu/chi, ngày giờ, nội dung và mã giao dịch. Một ảnh có thể chứa nhiều giao dịch.</p></div><Camera size={28}/></div>
  {dataMode==='synthetic_mock'?<div className="notice">Mở bản local bằng Start-FinWeave.cmd để quét ảnh và lưu vào hệ thống. Bộ đọc ảnh chưa hoạt động trong bản minh họa.</div>:masked?<div className="notice">Bật hiển thị nội dung để nhập ảnh giao dịch.</div>:<>
   <div className="field"><label htmlFor="screenshot-account">Ghi vào tài khoản</label><select id="screenshot-account" value={account} disabled={busy||!!scan} onChange={e=>{setAccount(e.target.value);reset();}}><option value="" disabled>Chọn tài khoản</option>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select><p className="small muted">Chọn đúng tài khoản nhận biến động, kể cả khi ảnh che số tài khoản hoặc không hiện tên ngân hàng.</p></div>
   <label className="screenshot-auto"><input type="checkbox" checked={auto} disabled={busy||!!scan} onChange={e=>setAuto(e.target.checked)}/><span>Tự động lưu khi đọc đủ thông tin<small>Ảnh thiếu thông tin sẽ chờ bạn kiểm tra. Giao dịch trùng được bỏ qua.</small></span></label>
   <div className="row"><Button variant="primary" onClick={()=>fileInput.current?.click()} disabled={busy||!account||!!scan}><Upload size={18}/>Chọn ảnh giao dịch</Button><Button onClick={()=>cameraInput.current?.click()} disabled={busy||!account||!!scan}><Camera size={18}/>Chụp ảnh</Button>{(scan||image)&&<Button disabled={busy||uncertain} onClick={reset}>Nhập ảnh khác</Button>}</div>
   <input ref={fileInput} className="sr-only" aria-label="Tệp ảnh giao dịch" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
   <input ref={cameraInput} className="sr-only" aria-label="Máy ảnh giao dịch" type="file" accept="image/*" capture="environment" onChange={e=>{void choose(e.target.files?.[0]);e.target.value='';}}/>
   <p className="small muted">PNG, JPG, WebP · tối đa 10 MB · nhận diện cục bộ trên máy Windows. Đọc theo thông tin giao dịch, không giới hạn tên ngân hàng. Ảnh không rõ sẽ chờ kiểm tra.</p>
   {!accounts.length&&<div className="notice">Thêm tài khoản tiền trước khi nhập ảnh.</div>}
   {busy&&<div role="status" className="notice">Đang đọc ảnh và xử lý giao dịch…</div>}{error&&<div role="alert" className="notice error">{error}</div>}
   {result&&<div className="notice screenshot-success" role="status"><CheckCircle2 size={20}/><span>Đã lưu {result.saved.length} giao dịch. Bỏ qua {result.duplicates.length} giao dịch trùng. Dữ liệu đã được lưu vào hệ thống. Biến động đã được cập nhật vào số dư tài khoản.</span></div>}
   {scan&&<div className="screenshot-columns"><div>{image&&<img className="screenshot-preview" src={image} alt="Ảnh giao dịch vừa chọn"/>}<p className="small muted">Bộ đọc: {scan.engine} · {scan.language}</p><details><summary>Văn bản đọc từ ảnh</summary><pre className="screenshot-raw">{scan.rawText}</pre></details></div><div className="stack">
    <div className="row between"><h3>{rows.length} giao dịch tìm thấy</h3><Badge tone={result?'':'warning'}>{result?'Đã xử lý':'Kiểm tra thông tin'}</Badge></div>
    {rows.map((r,n)=><article className="screenshot-row stack" key={r.index}><label className="row"><input type="checkbox" aria-label={'Chọn giao dịch '+(n+1)} checked={selected.includes(r.index)} disabled={busy||!!result||uncertain} onChange={e=>setSelected(e.target.checked?[...selected,r.index]:selected.filter(x=>x!==r.index))}/><strong>Giao dịch {n+1}</strong><Badge tone={r.kind==='income'?'':'warning'}>{r.kind==='income'?'Tiền vào':r.kind==='expense'?'Tiền ra':'Chưa rõ thu/chi'}</Badge></label>
     <p className="small muted">{r.bank||accounts.find(a=>a.id===scan.accountId)?.name||'Tài khoản đã chọn'} · tài khoản {r.bankAccount||'chưa đọc được'} · {r.time||'chưa rõ giờ'}</p>
     {!!r.warnings.length&&!result&&<ul className="small screenshot-warnings">{r.warnings.map(w=><li key={w}>{w.replace('BLOCKED: ','')}</li>)}</ul>}
     <fieldset disabled={busy||!!result||uncertain} className="screenshot-fields"><legend className="sr-only">Thông tin giao dịch {n+1}</legend>
      <div className="field"><label htmlFor={'ss-kind-'+n}>Loại giao dịch {n+1}</label><select id={'ss-kind-'+n} value={r.kind} onChange={e=>update(r.index,'kind',e.target.value)}><option value="unknown">Chọn thu/chi</option><option value="expense">Chi tiêu</option><option value="income">Thu nhập</option></select></div>
      <div className="field"><label htmlFor={'ss-amount-'+n}>Số tiền {n+1} (VND)</label><input id={'ss-amount-'+n} inputMode="numeric" value={r.amount} onChange={e=>update(r.index,'amount',e.target.value.replace(/\D/g,''))}/></div>
      <div className="field"><label htmlFor={'ss-date-'+n}>Ngày giao dịch {n+1}</label><input id={'ss-date-'+n} type="date" value={r.date} onChange={e=>update(r.index,'date',e.target.value)}/></div>
      <div className="field"><label htmlFor={'ss-time-'+n}>Giờ giao dịch {n+1}</label><input id={'ss-time-'+n} type="time" step="1" value={r.time} onChange={e=>update(r.index,'time',e.target.value)}/></div>
      <div className="field"><label htmlFor={'ss-ref-'+n}>Mã giao dịch {n+1}</label><input id={'ss-ref-'+n} maxLength={80} value={r.reference} onChange={e=>update(r.index,'reference',e.target.value)}/></div>
      <div className="field wide"><label htmlFor={'ss-desc-'+n}>Nội dung giao dịch {n+1}</label><textarea id={'ss-desc-'+n} rows={3} maxLength={500} value={r.description} onChange={e=>update(r.index,'description',e.target.value)}/></div>
     </fieldset>
    </article>)}
    {!result&&<><p className="small muted">Chuyển giữa các tài khoản của bạn, hoàn tiền và phí riêng cần dùng biểu mẫu “Ghi giao dịch” để chọn đúng nghiệp vụ.</p>{possibleDuplicate&&<label className="row"><input type="checkbox" checked={confirmSimilar} disabled={busy||uncertain} onChange={e=>setConfirmSimilar(e.target.checked)}/>Tôi đã đối chiếu và xác nhận đây là giao dịch khác, cần ghi thêm</label>}<Button variant="primary" onClick={()=>void save()} disabled={busy||possibleDuplicate&&!confirmSimilar||!selected.length||rows.filter(r=>selected.includes(r.index)).some(r=>r.kind==='unknown'||!r.amount||!r.date||!r.description||r.warnings.some(w=>w.startsWith('BLOCKED:')))}>{uncertain?'Thử lại cùng yêu cầu lưu':'Xác nhận và lưu '+selected.length+' giao dịch'}</Button></>}
   </div></div>}
  </>}
 </section>;
}
