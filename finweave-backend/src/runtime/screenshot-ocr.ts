import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fail } from './errors.ts';
import {parseScreenshot} from './screenshot-parser.ts';
const run=promisify(execFile);let active=0;
export interface OcrResult {text:string;language:string;engine:string;warnings?:string[]}
export function selectOcrText(texts:string[]):{text:string;warnings:string[]} {
 const candidates=[...new Set(texts)].map(text=>{const rows=parseScreenshot(text),complete=rows.filter(r=>r.amount&&r.kind!=='unknown'&&r.date);return {text,rows,complete,score:complete.length*100-rows.reduce((s,r)=>s+r.warnings.length,0)};}).sort((a,b)=>b.score-a.score||b.text.length-a.text.length);
 const best=candidates[0],warnings:string[]=[];
 for(const other of candidates.slice(1)){if(!best.complete.length||!other.complete.length)continue;
  if(best.complete.length!==other.complete.length||best.complete.some((r,n)=>{const p=other.complete[n];return p&&(r.amount!==p.amount||r.kind!==p.kind||r.date!==p.date||r.bankAccount&&p.bankAccount&&r.bankAccount!==p.bankAccount);}))warnings.push('Các lượt đọc ảnh không thống nhất về thông tin giao dịch; cần kiểm tra trước khi lưu.');
 }
 return {text:best?.text??'',warnings:[...new Set(warnings)]};
}
export function decodeScreenshot(base64:string,mimeType:string) {
 if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))fail('SCREENSHOT_INVALID');
 const bytes=Buffer.from(base64,'base64');
 if(bytes.length<32||bytes.length>160*1024)fail('SCREENSHOT_INVALID');
 if(mimeType==='image/png'?!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):mimeType!=='image/jpeg'||bytes[0]!==255||bytes[1]!==216||bytes[2]!==255)fail('SCREENSHOT_INVALID');
 return bytes;
}
export async function recognizeScreenshot(bytes:Buffer):Promise<OcrResult> {
 if(process.platform!=='win32')fail('OCR_UNAVAILABLE',503);
 if(active>=2)fail('SERVICE_UNAVAILABLE',503);active++;
 let dir:string|undefined;
 try {
  dir=await mkdtemp(join(tmpdir(),'finweave-ocr-'));const path=join(dir,'image');await writeFile(path,bytes,{flag:'wx'});
  const result=await run('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('../../scripts/recognize-screenshot.ps1',import.meta.url)),'-ImagePath',path],{windowsHide:true,timeout:12000,maxBuffer:128*1024,encoding:'utf8'});
  const value=JSON.parse(result.stdout.replace(/^\uFEFF/,''));
  if(typeof value.text!=='string'||value.text.length>30000||typeof value.language!=='string'||value.engine!=='windows-ocr')fail('OCR_UNAVAILABLE',503);
  const alternatives=Array.isArray(value.alternatives)?value.alternatives:[];
  if(alternatives.length>2||alternatives.some((t:unknown)=>typeof t!=='string'||t.length>30000))fail('OCR_UNAVAILABLE',503);
  return {...selectOcrText([value.text,...alternatives]),engine:value.engine,language:value.language};
 }catch{return fail('OCR_UNAVAILABLE',503);}finally{active--;if(dir)await rm(dir,{recursive:true,force:true});}
}
