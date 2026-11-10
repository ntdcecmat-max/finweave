// Explicit owner edits only. Unsupported or ambiguous language is rejected;
// this parser neither calls a model nor writes active plans or financial events.
export function editDraftMessage(body:any,text:string){
 const input=text.normalize('NFC').trim().toLocaleLowerCase('vi').replace(/\s+/g,' '),next=structuredClone(body);
 const invalid=():never=>{throw Error('DRAFT_EDIT_UNSUPPORTED');};
 const goal=()=>next.goals.length===1?next.goals[0]:invalid();
 const money=input.match(/^(góp|thu nhập|chi tiêu|dự phòng|mục tiêu)(?: là| thành)? (\d{1,18}|[1-9]\d{0,2}(?:[.,]\d{3})+)(?: vnd| đồng| đ)?(?: mỗi tháng)?[.!]?$/u);
 if(money){
  const literal=money[2]!;
  if(/[.,]/.test(literal)&&!/^\d{1,3}([.,])\d{3}(?:\1\d{3})*$/.test(literal))invalid();
  const amount=BigInt(literal.replace(/[.,]/g,'')).toString();if(amount.length>18)invalid();
  switch(money[1]){
   case 'góp':goal().contribution=amount;break;
   case 'mục tiêu':if(amount==='0')invalid();goal().target=amount;break;
   case 'thu nhập':next.income=amount;next.settings.income=amount;break;
   case 'chi tiêu':next.expense=amount;next.settings.expense=amount;break;
   case 'dự phòng':next.reserve=amount;break;
  }
  return next;
 }
 const deadline=input.match(/^(?:hạn(?: đến)?|gia hạn(?: đến)?) (\d{4}-\d{2}-\d{2})$/u);
 if(deadline){const date=deadline[1]!;if(!Number.isFinite(Date.parse(date))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)invalid();goal().due=date;return next;}
 const day=input.match(/^(?:ngày góp|góp vào ngày)(?: là| thành)? (\d{1,2})$/u);
 if(day){const value=Number(day[1]);if(value<1||value>31)invalid();goal().day=value;return next;}
 const skip=input.match(/^tháng (\d{1,2})[/-](\d{4}) (?:không|bỏ|ngừng) góp$/u);
 if(skip){
  const month=Number(skip[1]);if(month<1||month>12)invalid();const value=skip[2]+'-'+String(month).padStart(2,'0'),g=goal();
  if(value<g.start.slice(0,7)||value>g.due.slice(0,7))invalid();
  g.skipMonths=[...new Set([...g.skipMonths,value])].sort();return next;
 }
 return invalid();
}
