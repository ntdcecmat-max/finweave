import type {Store,Command} from '../domain/model';
import {services,queryOptions,mutationOptions,syntheticControl,ApiError,dataMode} from './api';
import {objectVersions} from './object-versions';
import {clearImportTransport} from './real-import';
import {clearOperationalDrafts} from './real-operational';
import {realCall,allPages,activeVersion} from './real-transport';
import {commandOperation,syntheticCommand} from './command-adapter';
import {applyCommand} from '../domain/commands';
import type {DTO} from '../contracts/schemas';
import type {OperationId} from '../contracts/operations';
const pendingPreviews=new Map<string,{operation:OperationId;input:any;token:string|null;objects:Record<string,number>}>();
const importRequests=new Map<string,{input:any;options:ReturnType<typeof mutationOptions>}>();
const commitRequests=new Map<string,{operation:OperationId;input:any;options:ReturnType<typeof mutationOptions>}>();
export const businessClockView=(timestamp:string)=>new Date(Date.parse(timestamp)+7*3600000).toISOString().replace('Z','+07:00');
export const readPresentation=async(signal?:AbortSignal)=>{const reply=await services.getPresentationSnapshot({},queryOptions(signal));if(reply.data.snapshotVersion!==reply.data.data.version||reply.workspaceVersion!==reply.data.snapshotVersion)throw Error('Response snapshot không nhất quán.');if(dataMode==='backend'&&activeVersion()!==null&&reply.workspaceVersion<activeVersion()!)throw new ApiError('Phản hồi snapshot cũ đã bị loại. Đọc lại dữ liệu hiện tại.','STALE_RESPONSE',409,true);return dataMode==='backend'?{...reply.data.data,clock:businessClockView(reply.data.data.clock)} as Store:reply.data.data as Store;};
const values=(r:DTO<'Report'>)=>({cash:r.cash.value?.value??null,assets:r.assets.value?.value??null,income:r.income.value?.value??null,gross:r.grossExpense.value?.value??null,refund:r.refunds.value?.value??null,net:r.netExpense.value?.value??null});
export async function previewAction(c:Command,s:Store) {
 if(syntheticCommand(c)){const r=await services.getOverview({context:{period:{start:s.clock.slice(0,7)+'-01',endExclusive:'2026-12-01',timezone:'Asia/Ho_Chi_Minh'},accountIds:s.accounts.map(a=>a.id),snapshotVersion:s.version}},queryOptions());return {version:s.version,before:values(r.data),after:values(r.data),note:'Synthetic settings/scenario control; không ghi tiền qua preview.'};}
 if(c.kind==='import'&&c.data.retryJobId){const store=await readPresentation();return {version:store.version,before:{cash:null,assets:null,income:'0',gross:'0',refund:'0',net:'0'},after:{cash:null,assets:null,income:'0',gross:'0',refund:'0',net:'0'},note:'Retry cùng job/key: không ghi lại tiền.'};}

 let {operation,input}=commandOperation(c,s);let objects=dataMode==='backend'?await objectVersions(s):{};
 if(dataMode==='backend'&&['disconnectSource','reconnectSource'].includes(operation)){
  const source=(await allPages('listSources')).find(x=>x.id===input.id);if(!source)throw new ApiError('Nguồn không tồn tại.','NOT_FOUND',404);
  const report=await services.getOverview({context:{period:{start:s.tracking,endExclusive:new Date(Date.parse(s.clock.slice(0,10)+'T00:00:00Z')+86400000).toISOString().slice(0,10),timezone:'Asia/Ho_Chi_Minh'},accountIds:[],snapshotVersion:s.version}},queryOptions());
  pendingPreviews.set(c.key,{operation,input,token:null,objects:{[source.id]:source.version}});return {version:s.version,before:values(report.data),after:values(report.data),note:'Đổi trạng thái kết nối nguồn; giữ nguyên giao dịch đã ghi. Máy chủ kiểm quyền và phiên bản nguồn khi xác nhận.'};
 }
 if(dataMode==='backend'&&operation==='unlinkPlanActual'){
  const transaction=await realCall('getTransaction',{id:c.data.event});const forecast=await realCall('getPlanForecast',{horizon:[s.clock.slice(0,10),...s.plans.map(p=>p.end)].sort().at(-1)});
  const link=forecast.data.items.flatMap((row:any)=>row.links).find((l:any)=>l.id===transaction.data.planLinkId);if(!link)throw new ApiError('Không còn liên kết kế hoạch trong snapshot.','NOT_FOUND',404);
  input={id:link.id,reason:input.reason};objects={...objects,[link.id]:link.version};
 }
 const result=await services.previewMutation({operationId:operation,input,expectedWorkspaceVersion:c.version,expectedObjectVersions:objects},queryOptions());pendingPreviews.set(c.key,{operation,input,token:result.data.previewToken,objects});return {version:result.data.workspaceVersion,before:values(result.data.before),after:values(result.data.after),note:result.data.warnings.join(' · ')};
}
export async function executeAction(c:Command,s:Store) {
 if(syntheticCommand(c)){const input=c.kind==='reset'?{action:'reset',scenario:c.data.scenario||'F-BASE'}:c.kind==='fault'?{action:'fault',mode:c.data.mode}:c.kind==='advance'?{action:'advance',date:c.data.date}:{action:'sourceScenario',sourceId:c.data.id,outcome:c.data.action};return syntheticControl(input);}
 if(c.kind==='import'&&c.data.retryJobId){const saved=importRequests.get(c.data.retryJobId);if(!saved)throw Error('Batch không còn request trong phiên. Preview CSV lại; không gửi một commit đoán lại.');return services.confirmImport(saved.input,saved.options);}
 let saved=commitRequests.get(c.key);if(!saved){const preview=pendingPreviews.get(c.key),{operation,input}=preview??commandOperation(c,s);const token=c.kind==='import'?c.data.previewToken:preview?.token||null;saved={operation,input,options:mutationOptions(c.version,c.key,token,preview?.objects??{})};commitRequests.set(c.key,saved);}const {operation,input,options}=saved;let result:any;try{result=await services[operation](input,options);}catch(e){if(e instanceof ApiError&&e.status>=400&&e.status<500&&e.outcome!=='unknown'&&e.outcome!=='committed')commitRequests.delete(c.key);throw e;}
 if(c.kind==='import')importRequests.set(result.data.id,{input,options});
 if(c.kind==='import'){let job=result.data;const deadline=Date.now()+10000;while(job.state==='pending'||job.state==='running'){if(Date.now()>deadline)throw Error('Import đang xử lý. Giữ batch/key và kiểm tra lịch sử job; không gửi batch mới.');await new Promise(resolve=>setTimeout(resolve,250));job=(await services.getImportJob({id:job.id},queryOptions())).data;}if(job.state==='failed')throw Error('Import thất bại: '+job.errorCode+'. Chưa ghi event. Preview lại sau khi khôi phục.');}
 return result;
}
export function settleAction(key:string){commitRequests.delete(key);pendingPreviews.delete(key);}
export function clearPresentationDrafts(){pendingPreviews.clear();importRequests.clear();commitRequests.clear();clearImportTransport();clearOperationalDrafts();}
export function simulatePlanningDraft(s: Store, c: Command): Store | undefined {
  const planning=['plan','goal','simulate','allocate','goalAction','planArchive','planLink'].includes(c.kind);
  return planning ? applyCommand(s, c) : undefined;
}
