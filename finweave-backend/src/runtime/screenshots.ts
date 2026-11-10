import type {Tx} from './uow.ts';
import type {Actor} from './identity.ts';
import type {Config} from './config.ts';
import type {Envelope} from './contracts.ts';
import {validator} from './contracts.ts';
import {authorizeWorkspace} from './workspace.ts';
import {object} from './finance-store.ts';
import {applyFinance} from './finance.ts';
import {command} from './replay.ts';
import {token,sha,jcs} from './crypto.ts';
import {fail} from './errors.ts';
import {parseScreenshot} from './screenshot-parser.ts';
import {recognizeScreenshot,decodeScreenshot,type OcrResult} from './screenshot-ocr.ts';
import {bankIdentity,accountCompatible} from './screenshot-identity.ts';
export type ScreenshotRecognizer=(bytes:Buffer)=>Promise<OcrResult>;
export async function screenshotOperation(tx:Tx,config:Config,a:Actor,req:Envelope,recognize:ScreenshotRecognizer=recognizeScreenshot):Promise<any> {
 const w=await authorizeWorkspace(tx,a,req),i=req.input;
 if(req.operationId==='scanScreenshot'){
  const account=await object(tx,w.id,'accounts',i.accountId);if(account.payload.archived)fail('ACTION_NOT_ALLOWED');
  const bytes=decodeScreenshot(i.imageBase64,i.mimeType),ocr=await recognize(bytes),id=token();
  const rows=parseScreenshot(ocr.text,{startDate:account.payload.openingDate>w.tracking_start?account.payload.openingDate:w.tracking_start,endDate:new Date(a.now+7*3600000).toISOString().slice(0,10)}).map(r=>({...r,warnings:[...r.warnings,...(ocr.warnings??[])]})),output={id,accountId:account.id,engine:ocr.engine,language:ocr.language,imageDigest:sha(bytes),rawText:ocr.text,expiresAt:new Date(a.now+86400000).toISOString(),rows};
  // The compressed image and OCR draft are private, expiring preview data. Committed evidence stores text/digest.
  await tx.query('INSERT INTO fw_business.import_previews VALUES($1,$2,$3,$4,$5,$6)',[w.id,id,a.identity.id,w.version,output.expiresAt,{screenshot:output,imageBase64:i.imageBase64,mimeType:i.mimeType,parserVersion:'fields-v2'}]);
  return {data:output,version:w.version};
 }
 return command(tx,config,a.identity.id,req,w.version,async()=>{
  const preview=await tx.one('SELECT * FROM fw_business.import_previews WHERE workspace_id=$1 AND id=$2 AND subject_id=$3',[w.id,i.scanId,a.identity.id]),scan=preview?.payload.screenshot;
  if(!scan)fail('NOT_FOUND',404);if(Date.parse(preview!.expires_at)<=await tx.now())fail('PREVIEW_EXPIRED',409);
  if(new Set(i.rows.map((r:any)=>r.index)).size!==i.rows.length)fail('SELECTION_INVALID');
  const account=await object(tx,w.id,'accounts',scan.accountId);if(account.payload.archived)fail('ACTION_NOT_ALLOWED');
  const saved:any[]=[],duplicates:any[]=[];let currentVersion=w.version;
  for(const row of i.rows){
   const original=scan.rows.find((r:any)=>r.index===row.index);if(!original)fail('SELECTION_INVALID');
   if(original.warnings.some((s:string)=>s.startsWith('BLOCKED:')))fail('SCREENSHOT_REVIEW_REQUIRED',409);
   const {category,...fields}=row,{warnings,...extracted}=original;
   if(i.mode==='auto'&&(warnings.length||jcs(fields)!==jcs(extracted)))fail('SCREENSHOT_REVIEW_REQUIRED',409);
   if(row.bankAccount!==original.bankAccount||row.bank!==original.bank)fail('SCREENSHOT_ACCOUNT_MISMATCH',409);
   if(row.bank&&account.payload.kind!=='bank')fail('SCREENSHOT_ACCOUNT_MISMATCH',409);
   const previous=(await tx.query("SELECT DISTINCT payload->'content'->'normalizedFields'->>'bankAccount' AS number,payload->'content'->'normalizedFields'->>'bank' AS bank FROM fw_business.evidence WHERE workspace_id=$1 AND payload->>'sourceId'='screenshot-owner' AND payload->'content'->'normalizedFields'->>'accountId'=$2 LIMIT 30",[w.id,account.id])).rows;
   for(const p of previous)if(!accountCompatible(p.number??'',row.bankAccount)||p.bank&&row.bank&&bankIdentity(p.bank)!==bankIdentity(row.bank))fail('SCREENSHOT_ACCOUNT_MISMATCH',409);
   if(row.bankAccount&&!/[*x•]/i.test(row.bankAccount)){
    const bindings=(await tx.query("SELECT DISTINCT payload->'content'->'normalizedFields'->>'accountId' AS account_id,payload->'content'->'normalizedFields'->>'bank' AS bank FROM fw_business.evidence WHERE workspace_id=$1 AND payload->>'sourceId'='screenshot-owner' AND payload->'content'->'normalizedFields'->>'bankAccount'=$2",[w.id,row.bankAccount])).rows;
    for(const binding of bindings)if(binding.account_id!==account.id){if(binding.bank&&row.bank&&bankIdentity(binding.bank)===bankIdentity(row.bank))fail('SCREENSHOT_ACCOUNT_MISMATCH',409);if((!binding.bank||!row.bank)&&i.mode==='auto')fail('SCREENSHOT_REVIEW_REQUIRED',409);}
   }
   const today=new Date(a.now+7*3600000).toISOString().slice(0,10);
   const event={kind:row.kind,amount:{value:row.amount,currency:'VND'},date:row.date,accountId:account.id,description:row.description,category:category||'Chưa phân loại',posting:'posted',reference:row.reference||null};
   if(!validator('createEventInput')(event)||event.date>today||event.date<w.tracking_start||event.date<account.payload.openingDate)fail('VALIDATION');
   // Scan identity makes retries and a resubmission after editing harmless. Reference and business fingerprint cover overlapping images/CSV/manual sources.
   const scanFingerprint=sha(jcs({scanId:scan.id,index:row.index}));
   const imageFingerprint=sha(jcs({imageDigest:scan.imageDigest,index:row.index,amount:original.amount,kind:original.kind,date:original.date,time:original.time,reference:original.reference}));
   const fingerprint=sha(jcs({source:'screenshot-v1',bank:bankIdentity(row.bank),bankAccount:row.bankAccount,date:row.date,time:row.time,amount:row.amount,kind:row.kind,reference:row.reference,...(!row.reference?{description:row.description.normalize('NFC').replace(/\s+/g,' ').trim()}:{} )}));
   const exact=await tx.one('SELECT event_id FROM fw_business.import_dedupe WHERE workspace_id=$1 AND account_id=$2 AND fingerprint IN($3,$4) LIMIT 1',[w.id,account.id,scanFingerprint,imageFingerprint]);
   if(exact){duplicates.push({index:row.index,eventId:exact.event_id});continue;}
   const old=await tx.one('SELECT event_id FROM fw_business.import_dedupe WHERE workspace_id=$1 AND account_id=$2 AND fingerprint=$3',[w.id,account.id,fingerprint]);
   const referenceMatch=row.reference?await tx.one("SELECT id FROM fw_finance.event_heads WHERE workspace_id=$1 AND payload->>'accountId'=$2 AND payload->>'reference'=$3 ORDER BY id LIMIT 1",[w.id,account.id,row.reference]):null;
   if(referenceMatch||old&&row.reference){duplicates.push({index:row.index,eventId:old?.event_id??referenceMatch!.id});continue;}
   if(old&&!row.reference&&(i.mode==='auto'||i.confirmSimilar!==true))fail('SCREENSHOT_POSSIBLE_DUPLICATE',409);
   const evidenceId=token(),current=await object(tx,w.id,'accounts',account.id);
   const result=await applyFinance(tx,a,{...w,version:currentVersion},{...req,operationId:'createEvent',input:{...event,evidenceIds:[evidenceId],screenshotId:scan.id,sourceId:'screenshot-owner',occurredTime:row.time},mutation:{...req.mutation!,expectedObjectVersions:{[account.id]:current.version}}});
   currentVersion=result.version;const eventId=result.data.affectedIds.find((id:string)=>id!==account.id);
   await tx.query('INSERT INTO fw_business.evidence VALUES($1,$2,$3)',[w.id,evidenceId,{id:evidenceId,sourceId:'screenshot-owner',kind:'import',recordedAt:new Date(a.now).toISOString(),observedDate:row.date,reference:row.reference||null,subjectRefs:[{type:'event',id:eventId},{type:'account',id:account.id}],content:{format:'normalized_event',normalizedFields:{...row,accountId:account.id,scanId:scan.id,imageDigest:scan.imageDigest,rawText:scan.rawText,engine:scan.engine,language:scan.language,mode:i.mode,parserVersion:preview!.payload.parserVersion??'bidv-v1',original}}}]);
   for(const key of [scanFingerprint,imageFingerprint,fingerprint])await tx.query('INSERT INTO fw_business.import_dedupe VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[w.id,account.id,key,eventId]);
   saved.push({index:row.index,eventId});
  }
  return {data:{scanId:scan.id,saved,duplicates},version:currentVersion};
 });
}
