import {z} from 'zod';
import {parseScreenshot,type ScreenshotRow} from './screenshot-fields';
import {bankIdentity,accountCompatible} from './screenshot-identity';
import {applyCommand} from './commands';
import type {Store} from './model';
export class ScreenshotFailure extends Error {constructor(public code:string,message:string,public status=422){super(message);}}
const fail=(code:string,message:string,status=422):never=>{throw new ScreenshotFailure(code,message,status);};
const id=z.string().regex(/^[A-Za-z0-9_-]{1,80}$/),text=(n=500)=>z.string().max(n);
const row=z.strictObject({index:z.number().int().min(0).max(19),amount:z.string().regex(/^[1-9]\d{0,17}$/),kind:z.enum(['income','expense']),date:z.iso.date(),time:z.string().regex(/^(?:|(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?)$/),description:z.string().min(1).max(500),reference:text(80),bankAccount:text(24),bank:text(32),category:z.string().min(1).max(80)});
const scanRequest=z.strictObject({operation:z.literal('scan'),requestId:id,input:z.strictObject({accountId:id,rawText:z.string().min(1).max(30000),imageDigest:z.string().regex(/^[a-f0-9]{64}$/)})});
const saveRequest=z.strictObject({operation:z.literal('save'),requestId:id,key:id,version:z.number().int().nonnegative(),input:z.strictObject({scanId:id,mode:z.enum(['auto','reviewed']),confirmSimilar:z.boolean().optional(),rows:z.array(row).min(1).max(20)})});
const evidenceRequest=z.strictObject({operation:z.literal('evidence'),requestId:id,input:z.strictObject({eventId:id})});
interface Scan {id:string;accountId:string;engine:string;language:string;imageDigest:string;rawText:string;expiresAt:string;rows:ScreenshotRow[];owner:string}
export interface ScreenshotState {scans:Map<string,Scan>;replays:Map<string,{digest:string;result:any}>;dedupe:Map<string,string>;evidence:Map<string,any>}
export const newScreenshotState=():ScreenshotState=>({scans:new Map(),replays:new Map(),dedupe:new Map(),evidence:new Map()});
const canonical=(v:any):string=>JSON.stringify(v&&typeof v==='object'?(Array.isArray(v)?v.map(x=>JSON.parse(canonical(x))):Object.fromEntries(Object.keys(v).sort().map(k=>[k,JSON.parse(canonical(v[k]))]))):v);
const hash=async(v:unknown)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(canonical(v))))].map(b=>b.toString(16).padStart(2,'0')).join('');
export async function screenshotImport(store:Store,saved:ScreenshotState,owner:string,raw:unknown,now=Date.now()) {
 const request=z.discriminatedUnion('operation',[scanRequest,saveRequest,evidenceRequest]).parse(raw),state=structuredClone(saved);
 const today=new Date(now+7*3600000).toISOString().slice(0,10);
 for(const [key,scan] of state.scans)if(Date.parse(scan.expiresAt)<=now)state.scans.delete(key);
 if(request.operation==='evidence'){
  const value=state.evidence.get(request.input.eventId);if(!value||!store.events.some(e=>e.id===request.input.eventId))fail('NOT_FOUND','Không có bằng chứng của giao dịch.',404);
  return {store,state,value};
 }
 if(request.operation==='scan'){
  const account=store.accounts.find(a=>a.id===request.input.accountId&&!a.archived);if(!account)fail('NOT_FOUND','Chọn tài khoản đang hoạt động.',404);
  if(state.scans.size>=20)state.scans.delete(state.scans.keys().next().value!);
  const value:Scan={id:crypto.randomUUID(),accountId:account!.id,engine:'tesseract-browser',language:'vie+eng',imageDigest:request.input.imageDigest,rawText:request.input.rawText,expiresAt:new Date(now+86400000).toISOString(),owner,rows:parseScreenshot(request.input.rawText,{startDate:account!.date>store.tracking?account!.date:store.tracking,endDate:today})};
  state.scans.set(value.id,value);const {owner:privateOwner,...publicValue}=value;return {store,state,value:publicValue};
 }
 const i=request.input,replayKey=owner+':'+request.key,digest=await hash({input:i,version:request.version}),prior=state.replays.get(replayKey);
 if(prior){if(prior.digest!==digest)fail('IDEMPOTENCY_CONFLICT','Yêu cầu này đã dùng cho nội dung khác.',409);return {store,state,value:prior.result};}
 if(request.version!==store.version)fail('VERSION_CONFLICT','Dữ liệu vừa thay đổi. Tải lại rồi lưu.',409);
 const scan=state.scans.get(i.scanId);if(!scan||scan.owner!==owner)fail('PREVIEW_EXPIRED','Bản đọc ảnh đã hết hạn hoặc thuộc phiên khác. Hãy quét lại.',409);
 const account=store.accounts.find(a=>a.id===scan!.accountId&&!a.archived);if(!account)fail('NOT_FOUND','Tài khoản không còn hoạt động.',404);
 if(new Set(i.rows.map(r=>r.index)).size!==i.rows.length)fail('VALIDATION','Chọn mỗi giao dịch một lần.');
 let next=store;const result={scanId:i.scanId,saved:[] as {index:number;eventId:string}[],duplicates:[] as {index:number;eventId:string}[]};
 for(const r of i.rows){
  const original=scan!.rows.find(v=>v.index===r.index);if(!original)fail('VALIDATION','Giao dịch không có trong bản đọc ảnh.');
  const {warnings,...extracted}=original!,{category,...fields}=r;
  if(warnings.some(w=>w.startsWith('BLOCKED:')))fail('SCREENSHOT_REVIEW_REQUIRED','Không ghi giao dịch thất bại hoặc đã hủy.',409);
  if(i.mode==='auto'&&(warnings.length||canonical(fields)!==canonical(extracted)))fail('SCREENSHOT_REVIEW_REQUIRED','Cần kiểm tra thông tin ảnh trước khi ghi.',409);
  if(r.bankAccount!==original!.bankAccount||r.bank!==original!.bank)fail('SCREENSHOT_ACCOUNT_MISMATCH','Thông tin nguồn không khớp ảnh.',409);
  if(r.bank&&account!.kind!=='bank')fail('SCREENSHOT_ACCOUNT_MISMATCH','Chọn tài khoản ngân hàng tương ứng.',409);
  for(const evidence of state.evidence.values()){
   if(evidence.accountId===account!.id&&(!accountCompatible(evidence.bankAccount,r.bankAccount)||evidence.bank&&r.bank&&bankIdentity(evidence.bank)!==bankIdentity(r.bank)))fail('SCREENSHOT_ACCOUNT_MISMATCH','Số tài khoản hoặc ngân hàng trên ảnh không khớp tài khoản được chọn.',409);
   if(evidence.accountId!==account!.id&&r.bankAccount&&!/[*x•]/i.test(r.bankAccount)&&evidence.bankAccount===r.bankAccount&&r.bank&&evidence.bank&&bankIdentity(evidence.bank)===bankIdentity(r.bank))fail('SCREENSHOT_ACCOUNT_MISMATCH','Tài khoản ngân hàng này đã gắn vào tài khoản khác.',409);
  }
  if(r.date<store.tracking||r.date<account!.date||r.date>today)fail('VALIDATION','Ngày cần nằm trong kỳ theo dõi của tài khoản và không ở tương lai.');
  const exact=await hash({imageDigest:scan!.imageDigest,index:r.index,amount:original!.amount,kind:original!.kind,date:original!.date,time:original!.time,reference:original!.reference});
  const scanKey='scan:'+i.scanId+':'+r.index,imageKey='image:'+account!.id+':'+exact;
  const duplicate=state.dedupe.get(scanKey)||state.dedupe.get(imageKey)||next.events.find(e=>e.account===account!.id&&r.reference&&e.reference===r.reference)?.id;
  if(duplicate){result.duplicates.push({index:r.index,eventId:duplicate});continue;}
  const fingerprint=await hash({account:account!.id,bank:bankIdentity(r.bank),number:r.bankAccount,date:r.date,time:r.time,amount:r.amount,kind:r.kind,reference:r.reference,...(!r.reference?{description:r.description.replace(/\s+/g,' ').trim()}:{} )}),similar=state.dedupe.get('fields:'+fingerprint);
  if(similar&&r.reference){result.duplicates.push({index:r.index,eventId:similar});continue;}
  if(similar&&(i.mode==='auto'||!i.confirmSimilar))fail('SCREENSHOT_POSSIBLE_DUPLICATE','Có giao dịch tương tự không có mã tham chiếu. Hãy đối chiếu trước khi ghi thêm.',409);
  const working=structuredClone(next);if(working.clock<new Date(now).toISOString())working.clock=new Date(now).toISOString();
  const after=applyCommand(working,{kind:'event',data:{kind:r.kind,amount:r.amount,date:r.date,account:account!.id,description:r.description.slice(0,80),reference:r.reference,category,posting:'posted'},key:request.key+'_'+r.index,version:working.version});
  const event=after.events.find(e=>!working.events.some(old=>old.id===e.id))!;event.source='Ảnh giao dịch';event.history.push(`${r.date} ${r.time||'(không có giờ)'} · OCR ${i.mode==='auto'?'tự động':'đã kiểm tra'} · ${r.bank||account!.name}`);
  state.evidence.set(event.id,{...r,accountId:account!.id,engine:'tesseract-browser',language:'vie+eng',imageDigest:scan!.imageDigest,mode:i.mode,parserVersion:'fields-v2',recordedAt:new Date(now).toISOString()});
  state.dedupe.set(scanKey,event.id);state.dedupe.set(imageKey,event.id);if(!similar)state.dedupe.set('fields:'+fingerprint,event.id);
  next=after;result.saved.push({index:r.index,eventId:event.id});
 }
 if(state.replays.size>=200)state.replays.delete(state.replays.keys().next().value!);
 state.replays.set(replayKey,{digest,result});return {store:next,state,value:result};
}
