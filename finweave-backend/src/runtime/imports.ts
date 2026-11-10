import type { Tx } from './uow.ts';
import type { Actor } from './identity.ts';
import type { Config } from './config.ts';
import type { Envelope } from './contracts.ts';
import { validator } from './contracts.ts';
import { authorizeWorkspace,page } from './workspace.ts';
import { command } from './replay.ts';
import { token,sha,jcs } from './crypto.ts';
import { fail } from './errors.ts';
import { object,history } from './finance-store.ts';
import { enqueue,businessObject } from './business.ts';
import { metric } from '../engine/business.ts';
export const importOperations=['getImportTemplate','previewImport','confirmImport','getImportJob','listImportJobs'];
export function parseCSV(csv:string) {
 const rows:string[][]=[],row:string[]=[];let value='',quoted=false,closed=false;
 for(let n=0;n<csv.length;n++){const c=csv[n];if(quoted){if(c==='"'){if(csv[n+1]==='"'){value+='"';n++;}else{quoted=false;closed=true;}}else value+=c;}
  else if(c==='"'){if(value||closed)fail('CSV_INVALID');quoted=true;}
  else if(c===','||c==='\n'||c==='\r'){row.push(value);value='';closed=false;if(c!==','){if(c==='\r'&&csv[n+1]==='\n')n++;if(row.some(x=>x!==''))rows.push([...row]);row.length=0;}}
  else {if(closed)fail('CSV_INVALID');value+=c;}
 }if(quoted)fail('CSV_INVALID');if(value||row.length){row.push(value);rows.push([...row]);}if(rows.length<2||rows.length>1001)fail('CSV_LIMIT');return rows;
}
export async function importOperation(tx:Tx,config:Config,a:Actor,req:Envelope):Promise<any> {
 const w=await authorizeWorkspace(tx,a,req),i=req.input,op=req.operationId;
 if(op==='getImportTemplate')return {data:{csv:'date,amount,description,reference,currency\n2026-10-01,-100000,Chi tiêu,REF-001,VND\n'},version:w.version};
 if(op==='getImportJob')return {data:(await businessObject(tx,w.id,'imports',i.id)).payload,version:w.version};
 if(op==='listImportJobs')return page(tx,req,'SELECT * FROM fw_business.imports WHERE workspace_id=$1 ORDER BY id',[w.id],r=>r.payload,w.version);
 const work=async()=>{
  const account=op==='previewImport'?await object(tx,w.id,'accounts',i.accountId):null;
  if(op==='previewImport'){
   if(i.expectedWorkspaceVersion!==w.version)fail('VERSION_CONFLICT',409);if(account!.payload.archived)fail('ACTION_NOT_ALLOWED');
   const parsed=parseCSV(i.csv.replace(/^\uFEFF/,'')),headers=parsed.shift()!,m=i.mapping;
   if(new Set(headers).size!==headers.length)fail('CSV_MAPPING_INVALID');for(const key of ['date','description','reference','currency',...(m.amountFormat==='signed_integer_vnd'?['amount']:['debit','credit'])])if(m[key]&&!headers.includes(m[key]))fail('CSV_MAPPING_INVALID');
   const id=token(),seen=new Set<string>(),rows:any[]=[],pins:any[]=[];
   for(const [index,cells]of parsed.entries()){
    const raw=Object.fromEntries(headers.map((h,n)=>[h,cells[n]??''])),read=(k:string)=>raw[m[k]]?.trim()??'',errors:any[]=[];let normalized:any=null,matchedEventId:string|null=null;
    try{
     if(cells.length!==headers.length)throw Error('COLUMN_COUNT');let date=read('date');if(m.dateFormat==='dd/MM/yyyy'){if(!/^\d{2}\/\d{2}\/\d{4}$/.test(date))throw Error('DATE');const [d,mo,y]=date.split('/');date=y+'-'+mo+'-'+d;}
     let signed=read('amount');if(m.amountFormat==='debit_credit_vnd'){const debit=read('debit')||'0',credit=read('credit')||'0';if(!/^\d{1,18}$/.test(debit)||!/^\d{1,18}$/.test(credit)||BigInt(debit)>0n&&BigInt(credit)>0n)throw Error('AMOUNT');signed=(BigInt(credit)-BigInt(debit)).toString();}
     if(!/^-?[1-9]\d{0,17}$/.test(signed))throw Error('AMOUNT');const amount=BigInt(signed);if(m.currency&&read('currency')!=='VND')throw Error('CURRENCY');
     normalized={kind:amount<0n?'expense':'income',amount:{value:(amount<0n?-amount:amount).toString(),currency:'VND'},date,accountId:account!.id,description:read('description'),category:'uncategorized',posting:'posted',reference:m.reference?read('reference')||null:null};
     if(!validator('createEventInput')(normalized)||date<account!.payload.openingDate||date<w.tracking_start)throw Error('ROW_INVALID');
    }catch(error){errors.push({field:'row',code:(error as Error).message,message:(error as Error).message});normalized=null;}
    const fingerprint=sha(jcs(normalized??raw)),referenceMatch=normalized?.reference?await tx.one("SELECT id FROM fw_finance.event_heads WHERE workspace_id=$1 AND payload->>'accountId'=$2 AND payload->>'reference'=$3 ORDER BY id LIMIT 1",[w.id,account!.id,normalized.reference]):null,prior=await tx.one('SELECT event_id FROM fw_business.import_dedupe WHERE workspace_id=$1 AND account_id=$2 AND fingerprint=$3',[w.id,account!.id,fingerprint]);matchedEventId=prior?.event_id??referenceMatch?.id??null;
    const evidenceId=token(),row={id:token(),index:index+1,rawEvidenceId:evidenceId,status:normalized?(seen.has(fingerprint)||matchedEventId?'duplicate':'valid'):'invalid',normalized,errors,matchedEventId};seen.add(fingerprint);rows.push(row);pins.push({...row,fingerprint});
    await tx.query('INSERT INTO fw_business.evidence VALUES($1,$2,$3)',[w.id,evidenceId,{id:evidenceId,sourceId:null,kind:'import',recordedAt:new Date(a.now).toISOString(),observedDate:normalized?.date??null,reference:normalized?.reference??null,subjectRefs:[{type:'account',id:account!.id}],content:{format:'csv_row',normalizedFields:raw}}]);
   }
   const output={id,previewToken:token(),expiresAt:new Date(a.now+86400000).toISOString(),workspaceVersion:w.version,fileDigest:sha(i.csv),mappingDigest:sha(jcs(m)),profileVersion:'csv-v1',mappingVersion:1,accountId:account!.id,rows,quality:{...metric('0',a.now).quality,status:rows.every(r=>r.status==='valid')?'complete':'partial'}};
   await tx.query('INSERT INTO fw_business.import_previews VALUES($1,$2,$3,$4,$5,$6)',[w.id,id,a.identity.id,w.version,output.expiresAt,{output,pins,mapping:m,accountVersion:account!.version}]);return {data:output,version:w.version};
  }
  if(op==='confirmImport'){
   const p=await tx.one('SELECT * FROM fw_business.import_previews WHERE workspace_id=$1 AND id=$2 AND subject_id=$3',[w.id,i.previewId,a.identity.id]);if(!p||p.payload.output.previewToken!==i.previewToken)fail('PREVIEW_MISMATCH',409);if(Date.parse(p.expires_at)<=await tx.now())fail('PREVIEW_EXPIRED',409);if(p.version!==w.version)fail('STALE_PROPOSAL',409);
   if(new Set(i.selectedRowIds).size!==i.selectedRowIds.length)fail('SELECTION_INVALID');const rows=p.payload.pins.filter((r:any)=>i.selectedRowIds.includes(r.id));if(rows.length!==i.selectedRowIds.length)fail('SELECTION_INVALID');const account=await object(tx,w.id,'accounts',p.payload.output.accountId);if(account.payload.archived||account.version!==p.payload.accountVersion||req.mutation!.expectedObjectVersions[account.id]!==account.version)fail('STALE_PROPOSAL',409);
   if(await tx.one('SELECT id FROM fw_business.imports WHERE workspace_id=$1 AND preview_id=$2',[w.id,p.id]))fail('PREVIEW_ALREADY_CONFIRMED',409);
   const id=token(),date=new Date(a.now).toISOString(),job={id,version:0,state:'pending',previewId:p.id,accountId:account.id,sourceId:'csv-owner',profileVersion:'csv-v1',mappingVersion:1,selectedRowIds:[...i.selectedRowIds].sort(),committedEventIds:[],reviewCaseIds:[],resultWorkspaceVersion:null,errorCode:null,createdAt:date,updatedAt:date};
   await tx.query('INSERT INTO fw_business.imports VALUES($1,$2,$3,$4,$5)',[w.id,id,p.id,{rows,accountVersion:account.version,mapping:p.payload.mapping},job]);await history(tx,a,w.id,id,0,op);await enqueue(tx,a,w,'import',id);return {data:job,version:w.version};
  }fail('ACTION_NOT_ALLOWED');
 };return op==='previewImport'?work():command(tx,config,a.identity.id,req,w.version,work);
}
