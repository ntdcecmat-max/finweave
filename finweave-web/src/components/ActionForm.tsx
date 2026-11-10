import {useForecast} from '../app/forecast-context';
import {forecastBaseline} from '../domain/forecast';
import {useState,useMemo,useRef,useEffect} from 'react';
import {Controller,useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Button,Modal,Evidence} from './ui';
import {useApp,MoneyValue} from '../app/context';
import {previewAction, simulatePlanningDraft} from '../services/presentation';
import {ApiError} from '../services/api';
import type {Command,Store} from '../domain/model';
import {MoneyInput} from './MoneyInput';
import {PlanningPreview} from './PlanningResults';

export type Field={key:string;label:string;type?:'text'|'money'|'quantity'|'date'|'select'|'textarea';options?:{value:string;label:string}[];optionsFor?:(v:Record<string,string>)=>{value:string;label:string}[];required?:boolean;hint?:string;initial?:string;when?:(v:Record<string,string>)=>boolean};
export type ActionSpec={title:string;kind:string;fields:Field[];data?:Record<string,string>;description?:string;onDone?:(command?:Command)=>void};
export function ActionForm({spec,onClose}:{spec:ActionSpec;onClose:()=>void}){
 const {store,perform,masked,refetch}=useApp();const {settings:forecastSettings}=useForecast();
 const busyLock=useRef(false),previewFocus=useRef<HTMLDivElement>(null);
 const [step,setStep]=useState<'form'|'preview'>('form'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[uncertain,setUncertain]=useState(false);
 const [command,setCommand]=useState<Command>(),[proposal,setProposal]=useState<Store>(),[previewBase,setPreviewBase]=useState<Store>();
 const [result,setResult]=useState<Awaited<ReturnType<typeof previewAction>>>();
 const planning=['plan','goal','simulate','allocate','goalAction','planArchive','planLink'].includes(spec.kind);
 const schema=useMemo(()=>z.object(Object.fromEntries(spec.fields.map(f=>[f.key,z.string()]))).superRefine((data,ctx)=>{
  for(const f of spec.fields){
   if(f.when&&!f.when(data))continue;
   if(f.required&&!data[f.key]?.trim())ctx.addIssue({code:'custom',path:[f.key],message:'Vui lòng nhập trường này.'});
   if(f.type==='money'&&data[f.key]&&!/^\d{1,15}$/.test(data[f.key]))ctx.addIssue({code:'custom',path:[f.key],message:'Nhập số tiền VND nguyên, tối đa 15 chữ số.'});
   if(f.type==='select'&&data[f.key]&&!(f.optionsFor?.(data)??f.options)?.some(o=>o.value===data[f.key]))ctx.addIssue({code:'custom',path:[f.key],message:'Chọn một lựa chọn phù hợp.'});
  }
 }),[spec]);
 const {register,control,handleSubmit,watch,setValue,setError:setFieldError,formState:{errors}}=useForm<Record<string,string>>({resolver:zodResolver(schema),defaultValues:Object.fromEntries(spec.fields.map(f=>[f.key,f.initial||'']))});
 const values=watch();
 useEffect(()=>{for(const field of spec.fields){if(!field.optionsFor||field.when&&!field.when(values))continue;const opts=field.optionsFor(values);if(!opts.some(o=>o.value===values[field.key]))setValue(field.key,opts[0]?.value??'');}},[values.kind,spec,setValue]);
 const review=async(data:Record<string,string>)=>{
  if(!store||busyLock.current)return;
  busyLock.current=true;setBusy(true);setError('');setUncertain(false);
  try{
   const normalized={...spec.data,...data};
   if(spec.kind==='plan'){
    if(normalized.recurrence==='once'){normalized.end=normalized.date;normalized.day=normalized.date.slice(-2);}
    if(normalized.kind==='investment')normalized.category='Đầu tư';
    normalized.reason||='Lưu kế hoạch';
   }
   if(spec.kind==='goal'){
    normalized.reason||='Lưu mục tiêu';
    if(normalized.criterion==='independence'){
     const expense=Number(forecastSettings.expense??forecastBaseline(store).expense);
     if(expense<=0)throw Error('Nhập mức chi tiêu trong Giả định trước khi đặt mục tiêu độc lập tài chính.');
     normalized.target=Math.round(expense*12*Number(normalized.expenseMultiple||25)).toFixed(0);normalized.targetBasis='today';
    }
   }
   if(spec.kind==='goalAction'&&normalized.action==='achieved'){
    normalized.assessedExpense=String(forecastSettings.expense??Math.round(forecastBaseline(store).expense));
    normalized.assessedDebt=forecastSettings.debt??'';
   }
   const c:Command={kind:spec.kind,data:normalized,key:spec.kind==='import'&&spec.data?.batch?spec.data.batch:crypto.randomUUID(),version:store.version};
   const proposed=simulatePlanningDraft(store,c);
   const r=await previewAction(c,store);
   setCommand(c);setProposal(proposed);setPreviewBase(store);setResult(r);setStep('preview');
   requestAnimationFrame(()=>{previewFocus.current?.focus();previewFocus.current?.closest('.dialog-content')?.scrollTo({top:0});});
  }catch(e){
   const issues=(e as {fieldErrors?:{path?:unknown[];field?:string;message?:string}[]}).fieldErrors||[];
   let first='';
   for(const issue of issues){const path=issue.path?.map(String)||issue.field?.split('.')||[];const field=spec.fields.find(f=>path.includes(f.key));if(field){setFieldError(field.key,{type:'server',message:issue.message?.includes('VND nguyên')?issue.message:'Kiểm tra '+field.label.toLowerCase()+'.'});first||=field.key;}}
   if(first)requestAnimationFrame(()=>document.getElementById('field-'+first)?.focus());
   setError((e as Error).message);
  }finally{setBusy(false);busyLock.current=false;}
 };
 const confirm=async()=>{
  if(!command||busyLock.current)return;
  busyLock.current=true;setBusy(true);setError('');
  try{await perform(command);spec.onDone?.(command);onClose();}
  catch(e){setUncertain(e instanceof ApiError&&(e.status===0||e.status>=500));setError((e as Error).message);}
  finally{setBusy(false);busyLock.current=false;}
 };
 const recover=async()=>{
  if(!store||busyLock.current)return;
  busyLock.current=true;setBusy(true);
  try{await perform({kind:'fault',data:{mode:'none'},version:store.version,key:crypto.randomUUID()});setError('');}
  catch(e){setError((e as Error).message);}
  finally{busyLock.current=false;setBusy(false);}
 };
 const back=()=>{setStep('form');setError('');requestAnimationFrame(()=>document.getElementById('field-'+spec.fields[0]?.key)?.focus());};
 return <Modal open className={planning?'planning-dialog':''} lockClose={busy} onClose={onClose} title={spec.title} description={spec.description??'Nhập → xem tác động → xác nhận. Hủy không thay dữ liệu. Mọi số liệu là giả.'}>
  {planning&&<div className="planning-form-steps"><span>{step==='form'?<strong>1. Nhập thông tin</strong>:'1. Nhập thông tin'}</span><span>{step==='preview'?<strong>2. Xem dự tính</strong>:'2. Xem dự tính'}</span><span>3. Lưu</span></div>}
  {masked?<div className="notice">Đang ẩn thông tin tài chính. Đóng hộp thoại và bật hiển thị để nhập hoặc xem dự tính.</div>:step==='form'?<form onSubmit={handleSubmit(review)} noValidate>
   <div className="form-grid">{spec.fields.filter(f=>!f.when||f.when(values)).map(f=>{
    const accessibility={'aria-invalid':!!errors[f.key],'aria-describedby':errors[f.key]?'error-'+f.key:f.hint?'hint-'+f.key:undefined};
    return <div className={`field ${f.type==='textarea'?'wide':''}`} key={f.key}>
     <label htmlFor={'field-'+f.key}>{f.label}{f.required?' *':''}</label>
     {f.type==='money'?<Controller control={control} name={f.key} render={({field})=><MoneyInput id={'field-'+f.key} name={field.name} inputRef={field.ref} onBlur={field.onBlur} disabled={busy} value={field.value} onValueChange={field.onChange} {...accessibility}/>}/>:f.type==='select'?<select disabled={busy} id={'field-'+f.key} {...register(f.key)} {...accessibility}>{(f.optionsFor?.(values)??f.options)?.map(o=><option value={o.value} key={o.value}>{o.label}</option>)}</select>:f.type==='textarea'?<textarea disabled={busy} id={'field-'+f.key} {...register(f.key)} rows={3} {...accessibility}/>:<input disabled={busy} id={'field-'+f.key} {...register(f.key)} type={f.type==='date'?'date':'text'} inputMode={f.type==='quantity'?'decimal':undefined} {...accessibility}/>}
     {f.hint&&<span id={'hint-'+f.key} className="meta muted">{f.hint}</span>}{errors[f.key]&&<span id={'error-'+f.key} className="error">{errors[f.key]?.message as string}</span>}
    </div>;
   })}</div>
   {planning&&<p className="planning-help" style={{marginTop:20}}>{spec.kind==='goal'?'Chọn lịch góp để xem khả năng đạt mục tiêu, số tiền còn thiếu và mức góp cần thiết.':spec.kind==='simulate'?'Kịch bản này sử dụng tiền đang có trong tài khoản. Để dự tính các khoản góp từ thu nhập tương lai, hãy điều chỉnh lịch góp của mục tiêu.':'Bước tiếp theo sẽ hiển thị lịch thực hiện, số dư dự tính và cảnh báo nếu tài khoản không đủ tiền.'}</p>}
   {error&&<div className="notice error" role="alert" style={{marginTop:16}}><p>{error}</p>{store?.fault!=='none'&&<Button type="button" disabled={busy} onClick={recover}>Khôi phục & giữ thông tin</Button>}</div>}
   <div className="dialog-footer"><Button type="button" disabled={busy} onClick={onClose}>Hủy</Button><Button variant="primary" disabled={busy} type="submit">{busy?'Đang tính…':planning?'Xem dự tính':'Xem tác động'}</Button></div>
  </form>:<div className="planning-review" ref={previewFocus} tabIndex={-1}>
   {planning&&previewBase&&proposal&&command?<><p className="planning-preview-label">Xem lại dự tính trước khi lưu.</p><PlanningPreview before={previewBase} after={proposal} command={command}/></>:<>
    <Evidence>Preview theo snapshot v{result?.version}. Chưa ghi thay đổi.</Evidence>
    {result?.note&&<p className="notice info">{result.note}</p>}
    <div className="table-wrap" style={{marginTop:16}}><table><caption className="sr-only">Tác động trước và sau xác nhận, VND</caption><thead><tr><th>Chỉ tiêu (VND)</th><th className="num">Trước</th><th className="num">Sau</th></tr></thead><tbody>{(['cash','assets','income','gross','refund','net'] as const).map((k,i)=><tr key={k}><td>{['Tiền hiện có','Tổng tài sản','Thu nhập','Chi gộp','Hoàn tiền','Chi ròng'][i]}</td><td className="num"><MoneyValue value={result?.before[k]??null}/></td><td className="num"><MoneyValue value={result?.after[k]??null}/></td></tr>)}</tbody></table></div>
   </>}
   {error&&<div className="notice error" role="alert"><p>{error}</p>{uncertain?<><p>Chưa xác định được kết quả lưu. Thử lại cùng yêu cầu để kiểm tra.</p><Button disabled={busy} onClick={confirm}>Thử lại</Button></>:<Button onClick={()=>{refetch();back();}}>Cập nhật dữ liệu & tính lại</Button>}</div>}
   <div className="dialog-footer"><Button onClick={back} disabled={busy||uncertain}>Điều chỉnh</Button><Button onClick={onClose} disabled={busy}>Hủy</Button><Button variant="primary" disabled={busy} onClick={confirm}>{busy?'Đang lưu…':spec.kind==='goal'?'Lưu mục tiêu':spec.kind==='plan'?'Lưu kế hoạch':spec.kind==='simulate'?'Lưu kịch bản':'Xác nhận'}</Button></div>
  </div>}
 </Modal>;
}
