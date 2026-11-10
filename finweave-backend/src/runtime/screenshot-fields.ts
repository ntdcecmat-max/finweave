// OCR text is untrusted data. Financial fields, rather than a bank allowlist, drive extraction.
export interface ScreenshotRow {
 index:number; amount:string; kind:'income'|'expense'|'unknown'; date:string; time:string;
 description:string; reference:string; bankAccount:string; bank:string; warnings:string[];
}
export const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[đĐ]/g,'d').toLowerCase();
const normalize=(s:string)=>s.normalize('NFC').replace(/[−–—﹣]/g,'-').replace(/＋/g,'+').replace(/\u00a0/g,' ')
 .replace(/\b(?:sd|s0|s6)\s*du(?=\s|tk)/gi,'So du ')
 .replace(/(TK)([a-z]{2,24})(?=\s*[:#]?\s*[\d*])/gi,'$1 $2')
 .replace(/th[d0]i\s*gian/gi,'Thoi gian').replace(/t[ad]i\s+kho[ad]n/gi,'Tai khoan')
 .replace(/n[eéèê]i\s*dung/gi,'Noi dung').replace(/th[oö]ng\s*b[d0]o/gi,'Thong bao')
 .replace(/bi[eé]'?n\s+d[eé]ng/gi,'bien dong')
 .replace(/([\dx*])[1Il](?=(?:GD|SD|ND|DEN|TU)\s*:)/gi,'$1\n')
 .replace(/(VND)[1Il](?=(?:GD|SD|ND|DEN|TU)\s*:)/gi,'$1\n')
 .replace(/\|/g,'\n');
const validDate=(s:string)=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const amountLabel='(?:so\\s*tien(?:\\s*(?:gd|cd|giao dich|thanh toan))?|gia tri(?: giao dich)?|giao dich|transaction amount|amount|phat sinh|ps|gd)';
const balanceTail=/(?:so\s*du(?:\s*(?:cuoi|kha dung|hien tai|con lai))?|available\s*balance|balance|sdc?|sdkd)\s*[:=]?\s*$/;
const credit=/(?:\bghi\s*co\b|\bcredit(?:ed)?\b|\bnhan(?: duoc)?\b|\btien\s*vao\b|\bcong\s*tien\b|\bcash\s*in\b)/;
const debit=/(?:\bghi\s*no\b|\bdebit(?:ed)?\b|\btru\s*tien\b|\btien\s*ra\b|\bda\s*(?:chi|thanh toan|chuyen)\b|\bwithdraw(?:al|n)?\b|\bcash\s*out\b)/;
const fieldEnd=/(?:ma\s*(?:giao dich|tham chieu)|so\s*tham chieu|ref(?:erence)?(?=\s|:|$)|transaction\s*(?:id|reference)|so\s*du|balance|noi\s*dung|\bnd\s*:|description|tai\s*khoan|\btk\b|ngan\s*hang|bank\s*:|ngay\s*giao dich|thoi\s*gian)/;
const refLabel=/(?:ma\s*(?:giao\s*dich|tham\s*chieu|gd)|so\s*tham\s*chieu|\bref(?:erence)?\b|transaction\s*(?:id|reference)|trans\s*id|trace(?:\s*id)?)\s*[:#.]?\s*/i;
// Aliases only improve display names. An unseen bank uses the same extraction path.
const bankAliases:[string,RegExp][]=[
 ['VCB',/\b(?:vcb|vietcombank)\b/],['BIDV',/\bbidv\b/],['VietinBank',/\b(?:vietinbank|vietin bank|ctg)\b/],
 ['MB',/\b(?:mbbank|mb bank|mb)\b/],['Techcombank',/\b(?:techcombank|tcb)\b/],['ACB',/\bacb\b/],
 ['VPBank',/\b(?:vpbank|vp bank)\b/],['TPBank',/\b(?:tpbank|tp bank)\b/],['Sacombank',/\bsacombank\b/],
 ['Agribank',/\bagribank\b/],['HDBank',/\bhdbank\b/],['SHB',/\bshb\b/],['VIB',/\bvib\b/],['MSB',/\bmsb\b/],
 ['OCB',/\bocb\b/],['SeABank',/\bseabank\b/],['Eximbank',/\beximbank\b/],['LPBank',/\b(?:lpbank|lienvietpostbank)\b/],
 ['Bac A Bank',/\bbac\s*a\s*bank\b/],['Nam A Bank',/\bnam\s*a\s*bank\b/],['Shinhan',/\bshinhan\b/],
 ['HSBC',/\bhsbc\b/],['Standard Chartered',/\bstandard\s*chartered\b/],['UOB',/\buob\b/],
];
export function parseVnd(raw:string):string|null {
 let s=raw.trim();
 if(/\s/.test(s)){if(!/^\d{1,3}(?: \d{3})+$/.test(s))return null;s=s.replace(/ /g,'');}
 if(/^\d{1,3}(?:[.,]\d{3})+[.,]00$/.test(s))s=s.slice(0,-3);
 else if(/^\d+[.,]00$/.test(s))s=s.slice(0,-3);
 if(!/^\d+$/.test(s)&&!/^\d{1,3}(?:,\d{3})+$/.test(s)&&!/^\d{1,3}(?:\.\d{3})+$/.test(s))return null;
 s=s.replace(/[.,]/g,'').replace(/^0+(?=\d)/,'');return /^[1-9]\d{0,17}$/.test(s)?s:null;
}
interface MoneyCandidate {start:number;end:number;amount:string;sign:string;currency:string;context:string;repaired?:boolean}
function moneyCandidates(text:string):MoneyCandidate[] {
 const normalized=fold(text),items:MoneyCandidate[]=[];
 const add=(m:RegExpMatchArray,sign:string,raw:string,currency:string)=>{
  const start=m.index!,before=normalized.slice(Math.max(0,start-100),start);
  if(balanceTail.test(before)||/(?:\bphi(?: giao dich| chuyen tien)?|fee)\s*[:=]?\s*$/.test(before))return;
  const explicit=new RegExp(amountLabel+'\\s*[:=]?\\s*$').test(before)||credit.test(before.slice(-40))||debit.test(before.slice(-40));
  if(!sign&&!explicit)return;
  if(start>0&&/[\d.,+\-]/.test(text[start-1]))return;
  items.push({start,end:start+m[0].length,amount:parseVnd(raw.replace(/[Oo]/g,'0'))??'',sign,currency:fold(currency),context:before.slice(-80),repaired:/[Oo]/.test(raw)});
 };
 const currencyMoney=/(?<![\p{L}\d.,])([+\-]?)\s*(\d[\dOo., ]{0,45}?)\s*(VND|VNĐ|USD|EUR|GBP|JPY|₫|đ)(?![\p{L}\d])/giu;
 for(const m of text.matchAll(currencyMoney))add(m,m[1],m[2],m[3]);
 const noCurrency=new RegExp('(?:'+amountLabel+'|ghi\\s*(?:co|no)|credited|debited)\\s*[:=]?\\s*([+\\-]?)\\s*(\\d[\\d., ]{0,45})(?=\\n|$)','gim');
 for(const m of normalized.matchAll(noCurrency)){
  if(items.some(item=>item.start>=m.index!&&item.start<m.index!+m[0].length))continue;
  const offset=m[0].search(/[+\-]?\s*\d/),start=m.index!+offset;
  items.push({start,end:m.index!+m[0].length,amount:parseVnd(m[2])??'',sign:m[1],currency:'',context:normalized.slice(Math.max(0,start-80),start)});
 }
 return items.sort((a,b)=>a.start-b.start);
}
function splitNotifications(text:string):string[] {
 const money=moneyCandidates(text),lines=text.split('\n'),starts:number[]=[];let offset=0;
 for(const line of lines){
  const n=fold(line),greeting=/\bxin\s*(?:thong bao|chao)\b|\bthong bao (?:bien dong|giao dich)\b|^(?:hom nay|hom qua|today|yesterday)\s*[•·-]?\s*\d{2}:\d{2}/.test(n);
  const account=/^(?:so\s*du\s*)?(?:tk|tai\s*khoan(?:\s*thanh toan)?|account|a\/c|acct)\b/.test(n)&&!/thu huong|nguoi nhan|recipient|beneficiary|tai khoan nhan/.test(n);
  const dated=/^(?:(?:thoi\s*(?:gian|diem)|ngay)(?:\s*giao dich)?\s*:|\d{2}[/.\-]\d{2}[/.\-]\d{4}\s*[•·]?\s*\d{2}:)/.test(n);
  if(greeting||account||dated){const previous=starts.at(-1);if(previous===undefined||money.some(item=>item.start>=previous&&item.start<offset)){
   const priorHasDate=previous!==undefined&&/\b\d{2,4}[/.\-]\d{2}[/.\-]\d{2,4}\b/.test(text.slice(previous,offset));
   if(!dated||greeting||account||priorHasDate&&money.some(item=>item.start>=offset))starts.push(offset);
  }}
  offset+=line.length+1;
 }
 if(starts.length<2)return [text];starts[0]=0;
 return starts.map((start,n)=>text.slice(start,starts[n+1]??text.length).trim()).filter(Boolean);
}
function field(text:string,pattern:RegExp):string {
 const m=pattern.exec(fold(text));if(!m)return '';
 const tail=text.slice(m.index+m[0].length).replace(/^\s*[:=]\s*/,'');
 const next=fieldEnd.exec(fold(tail));return tail.slice(0,next?.index??tail.length).trim();
}
function accountFrom(text:string):{value:string;ambiguous:boolean} {
 const normalized=fold(text),values:string[]=[];
 const pattern=/(?:\b(?:tai\s*khoan(?:\s*thanh toan)?|account(?:\s*number)?|a\/c|acct|tk))\s*(?:(?:nguon|trich no|cua ban)\s*)?[:#]?\s*(?:[a-z][a-z0-9-]{1,24}\s+)?([\d*x•][\d*x• .]{3,30})/gi;
 for(const m of normalized.matchAll(pattern)){
  if(/(?:nguoi nhan|thu huong|recipient|beneficiary|den|\bto)\s*$/.test(normalized.slice(Math.max(0,m.index!-25),m.index!)))continue;
  const value=m[1].replace(/[ .-]/g,'');if(/^[\d*x•]{4,24}$/.test(value)&&/\d{3}/.test(value))values.push(value);
 }
 const unique=[...new Set(values)];return {value:unique.length===1?unique[0]:'',ambiguous:unique.length>1};
}
function sourceBank(text:string,money:MoneyCandidate[]):string {
 const prefix=text.slice(0,money[0]?.start??text.length).split('\n').filter(line=>!/nguoi nhan|thu huong|beneficiary|recipient|\bto bank/.test(fold(line))).join('\n'),n=fold(prefix);
 const explicit=/(?:ngan\s*hang|\bbank)\s*:\s*([^\n:]{2,32})/.exec(n);
 if(explicit){const name=prefix.slice(explicit.index+explicit[0].length-explicit[1].length,explicit.index+explicit[0].length).trim().slice(0,32);return bankAliases.find(([,pattern])=>pattern.test(fold(name)))?.[0]??name;}
 const alias=bankAliases.find(([,pattern])=>pattern.test(n));if(alias)return alias[0];
 const title=prefix.split('\n').find(line=>/\b[a-z][a-z0-9]*bank\b/i.test(line));
 return title?.match(/\b[a-z][a-z0-9]*bank\b/i)?.[0].slice(0,32)??'';
}
function referenceFrom(text:string):{reference:string;remainder:string;overflow:boolean} {
 const region=field(text,refLabel);if(!region)return {reference:'',remainder:'',overflow:false};
 const value=region.replace(/([A-Za-z0-9#._/-])\n(?=[a-z0-9][A-Za-z0-9#._/-]*\d)/g,'$1').replace(/\n/g,' ').trim();
 const token=value.match(/^[A-Za-z0-9#._/-]+/)?.[0]??'';
 const humanSuffix=token.search(/\.(?=[A-Z][a-z]{2,}$|[A-Z]{2,}$)/);
 const reference=humanSuffix>=0?token.slice(0,humanSuffix):token;
 return {reference:reference.slice(0,80).replace(/[.,;-]+$/,''),remainder:value.slice(reference.length).replace(/^[.\s]+/,''),overflow:reference.length>80};
}
export function parseScreenshot(input:string,context?:{startDate:string;endDate:string}):ScreenshotRow[] {
 const text=normalize(input).replace(/\r/g,'').trim(),blocks=splitNotifications(text);
 const fullDates=[...text.matchAll(/\b(\d{2})[/.\-](\d{2})[/.\-](\d{4})\b/g)].map(m=>`${m[3]}-${m[2]}-${m[1]}`).filter(validDate);
 return blocks.slice(0,20).map((block,index)=>{
  const n=fold(block),money=moneyCandidates(block),warnings:string[]=[],candidate=money.length===1?money[0]:undefined;
  const amount=candidate?.amount??'';
  if(candidate?.repaired)warnings.push('Số tiền có ký tự OCR giống chữ O đã được chuẩn hóa; cần đối chiếu với ảnh.');
  if(!amount)warnings.push('Chưa đọc được một số tiền giao dịch VND nguyên, dương.');
  if(money.length>1)warnings.push('Có nhiều số tiền giao dịch trong cùng phần ảnh; cần kiểm tra tách dòng.');
  if(!candidate?.currency)warnings.push('Chưa xác nhận được đơn vị VND trên dòng số tiền.');
  else if(!['vnd','d','₫'].includes(candidate.currency))warnings.push('Chỉ ghi nhận VND; ngoại tệ cần xử lý riêng.');
  let kind:ScreenshotRow['kind']='unknown';
  if(candidate){if(candidate.sign==='+')kind='income';else if(candidate.sign==='-')kind='expense';else{
   const incoming=credit.test(candidate.context),outgoing=debit.test(candidate.context);if(incoming!==outgoing)kind=incoming?'income':'expense';
  }}
  if(kind==='unknown')warnings.push('Chưa xác định được tiền vào/ra từ dấu hoặc thông tin ghi Có/ghi Nợ.');
  const dates:string[]=[],datePattern=/\b(?:(\d{4})[/.\-](\d{2})[/.\-](\d{2})|(\d{2})[/.\-](\d{2})[/.\-](\d{4}))\b/g;
  for(const m of n.matchAll(datePattern))dates.push(m[1]?`${m[1]}-${m[2]}-${m[3]}`:`${m[6]}-${m[5]}-${m[4]}`);
  if(!dates.length){const short=[...n.matchAll(/\b(\d{2})[/.\-](\d{2})[/.\-](\d{2})(?!\d)\b/g)];for(const m of short){const matching=new Set(fullDates.filter(d=>d.slice(2)===`${m[3]}-${m[2]}-${m[1]}`));if(context&&validDate(context.startDate)&&validDate(context.endDate)){const first=Number(context.startDate.slice(0,4)),last=Number(context.endDate.slice(0,4));if(last-first<=200)for(let y=first;y<=last;y++){const candidate=String(y).padStart(4,'0')+'-'+m[2]+'-'+m[1];if(String(y).slice(-2)===m[3]&&validDate(candidate)&&candidate>=context.startDate&&candidate<=context.endDate)matching.add(candidate);}}if(matching.size===1)dates.push([...matching][0]);}}
  const unique=[...new Set(dates)],date=unique.length===1&&validDate(unique[0])?unique[0]:'';
  if(!date)warnings.push('Ngày giao dịch thiếu, không hợp lệ hoặc có nhiều ngày.');
  const datedLines=block.split('\n').filter(line=>/\b\d{2,4}[/.\-]\d{2}[/.\-]\d{2,4}\b/.test(line)&&/\b\d{2}:\d{2}/.test(line));
  const datedLine=datedLines.find(line=>/thoi gian|thoi diem|ngay giao dich/.test(fold(line)))??datedLines[0]??'';
  const times=[...datedLine.matchAll(/\b([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?\b/g)];
  const timePattern='([01]\\d|2[0-3]):[0-5]\\d(?::[0-5]\\d)?';
  const labeledTime=n.match(new RegExp('(?:thoi gian|thoi diem|\\btime|\\bluc)\\s*:?\\s*('+timePattern+')'))?.[1];
  const notificationTime=n.match(new RegExp('(?:hom nay|hom qua|today|yesterday)\\s*[•·-]?\\s*('+timePattern+')'))?.[1];
  const transactionTime=candidate?n.slice(candidate.start,candidate.end+100).match(new RegExp('\\b'+timePattern+'\\b'))?.[0]:undefined;
  const time=times.at(-1)?.[0]??labeledTime??notificationTime??transactionTime??'';
  const account=accountFrom(block),bankAccount=account.value;
  if(account.ambiguous)warnings.push('Có nhiều tài khoản chưa rõ vai trò; hãy kiểm tra tài khoản được chọn.');
  const ref=referenceFrom(block),reference=ref.reference;
  if(reference&&!/^[A-Za-z0-9#._/-]{3,80}$/.test(reference)||ref.overflow)warnings.push('Mã giao dịch cần kiểm tra.');
  const content=field(block,/(?:noi\s*dung(?:\s*giao\s*dich)?|\bnd\b|description|narrative|remarks|message)\s*[:=]?\s*/i);
  const description=(content||ref.remainder||'Biến động số dư từ ảnh').replace(/\s+/g,' ').slice(0,500);
  if(/that bai|khong thanh cong|failed|huy giao dich|cancelled/.test(n))warnings.push('BLOCKED: Ảnh ghi nhận giao dịch thất bại hoặc bị hủy.');
  if(/dang xu ly|cho xu ly|pending|hoan tien|refund|noi bo/.test(n))warnings.push('Trạng thái, hoàn tiền hoặc chuyển nội bộ cần kiểm tra riêng.');
  if(/(?:\bphi|fee)\s*:\s*[1-9]/.test(n))warnings.push('Ảnh có phí riêng cần kiểm tra trước khi ghi.');
  if(blocks.length>20)warnings.push('Ảnh vượt 20 giao dịch. Hãy chia ảnh nhỏ hơn.');
  return {index,amount,kind,date,time,description,reference,bankAccount,bank:sourceBank(block,money),warnings};
 });
}
