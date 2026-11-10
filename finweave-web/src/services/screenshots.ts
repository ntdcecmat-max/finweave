import {realCall,requestOptions} from './real-transport';
export interface ScreenshotRow {index:number;amount:string;kind:'income'|'expense'|'unknown';date:string;time:string;description:string;reference:string;bankAccount:string;bank:string;warnings:string[];category?:string}
export interface ScreenshotScan {id:string;accountId:string;engine:string;language:string;imageDigest:string;rawText:string;expiresAt:string;rows:ScreenshotRow[]}
export interface ScreenshotResult {scanId:string;saved:{index:number;eventId:string}[];duplicates:{index:number;eventId:string}[]}
export async function prepareScreenshot(file:File):Promise<{mimeType:'image/jpeg';imageBase64:string}> {
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>10*1024*1024)throw Error('Chọn ảnh PNG, JPG hoặc WebP tối đa 10 MB.');
 const bitmap=await createImageBitmap(file);
 try{
  if(bitmap.width*bitmap.height>24000000)throw Error('Ảnh quá lớn. Hãy cắt vùng chứa giao dịch.');
  const scale=Math.min(1,2400/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
  const context=canvas.getContext('2d');if(!context)throw Error('Không mở được ảnh.');context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.92,.85,.75,.65]){const imageBase64=canvas.toDataURL('image/jpeg',quality).split(',')[1];if(imageBase64.length<=218452)return {mimeType:'image/jpeg',imageBase64};}
  throw Error('Ảnh có quá nhiều nội dung. Hãy cắt ảnh nhỏ hơn để giữ chữ rõ.');
 }finally{bitmap.close();}
}
export async function scanScreenshot(accountId:string,file:File,signal:AbortSignal){const image=await prepareScreenshot(file);return (await realCall('scanScreenshot',{accountId,...image},{signal})).data as ScreenshotScan;}
export const saveInput=(scan:ScreenshotScan,rows:ScreenshotRow[],mode:'auto'|'reviewed',confirmSimilar=false)=>({scanId:scan.id,mode,...(confirmSimilar?{confirmSimilar:true}:{}),rows:rows.map(({warnings,category,...fields})=>({...fields,category:category||'Chưa phân loại'}))});
export async function saveScreenshot(input:ReturnType<typeof saveInput>,key:string,version:number,signal:AbortSignal){return (await realCall('saveScreenshot',input,{mutation:requestOptions(key,version),signal})).data as ScreenshotResult;}
