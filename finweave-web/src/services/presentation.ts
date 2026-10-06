import type {Store,Command} from '../domain/model';
import {services,queryOptions,mutationOptions,syntheticControl,ApiError} from './api';
import {commandOperation,syntheticCommand} from './command-adapter';
import type {DTO} from '../contracts/schemas';
import type {OperationId} from '../contracts/operations';
const pendingPreviews=new Map<string,{operation:OperationId;input:any;token:string}>();
const importRequests=new Map<string,{input:any;options:ReturnType<typeof mutationOptions>}>();
const commitRequests=new Map<string,{operation:OperationId;input:any;options:ReturnType<typeof mutationOptions>}>();
export const readPresentation=async(signal?:AbortSignal)=>{const reply=await services.getPresentationSnapshot({},queryOptions(signal));if(reply.data.snapshotVersion!==reply.data.data.version||reply.workspaceVersion!==reply.data.snapshotVersion)throw Error('Response snapshot không nhất quán.');return reply.data.data as Store;};
const values=(r:DTO<'Report'>)=>({cash:r.cash.value?.value??null,assets:r.assets.value?.value??null,income:r.income.value?.value??'0',gross:r.grossExpense.value?.value??'0',refund:r.refunds.value?.value??'0',net:r.netExpense.value?.value??'0'});
export async function previewAction(c:Command,s:Store) {
 if(syntheticCommand(c)){const r=await services.getOverview({context:{period:{start:s.clock.slice(0,7)+'-01',endExclusive:'2026-12-01',timezone:'Asia/Ho_Chi_Minh'},accountIds:s.accounts.map(a=>a.id),snapshotVersion:s.version}},queryOptions());return {version:s.version,before:values(r.data),after:values(r.data),note:'Synthetic settings/scenario control; không ghi tiền qua preview.'};}
 if(c.kind==='import'&&c.data.retryJobId){const store=await readPresentation();return {version:store.version,before:{cash:null,assets:null,income:'0',gross:'0',refund:'0',net:'0'},after:{cash:null,assets:null,income:'0',gross:'0',refund:'0',net:'0'},note:'Retry cùng job/key: không ghi lại tiền.'};}

 const {operation,input}=commandOperation(c,s);const result=await services.previewMutation({operationId:operation,input,expectedWorkspaceVersion:c.version,expectedObjectVersions:{}},queryOptions());pendingPreviews.set(c.key,{operation,input,token:result.data.previewToken});return {version:result.data.workspaceVersion,before:values(result.data.before),after:values(result.data.after),note:result.data.warnings.join(' · ')};
}
export async function executeAction(c:Command,s:Store) {
 if(syntheticCommand(c)){const input=c.kind==='reset'?{action:'reset',scenario:c.data.scenario||'F-BASE'}:c.kind==='fault'?{action:'fault',mode:c.data.mode}:c.kind==='advance'?{action:'advance',date:c.data.date}:{action:'sourceScenario',sourceId:c.data.id,outcome:c.data.action};return syntheticControl(input);}
 if(c.kind==='import'&&c.data.retryJobId){const saved=importRequests.get(c.data.retryJobId);if(!saved)throw Error('Batch không còn request trong phiên. Preview CSV lại; không gửi một commit đoán lại.');return services.confirmImport(saved.input,saved.options);}
 let saved=commitRequests.get(c.key);if(!saved){const {operation,input}=commandOperation(c,s),preview=pendingPreviews.get(c.key);const token=c.kind==='import'?c.data.previewToken:preview?.token||null;saved={operation,input,options:mutationOptions(c.version,c.key,token)};commitRequests.set(c.key,saved);}const {operation,input,options}=saved;let result:any;try{result=await services[operation](input,options);}catch(e){if(e instanceof ApiError&&e.status>=400&&e.status<500)commitRequests.delete(c.key);throw e;}
 if(c.kind==='import')importRequests.set(result.data.id,{input,options});
 if(c.kind==='import'){let job=result.data;const deadline=Date.now()+10000;while(job.state==='pending'||job.state==='running'){if(Date.now()>deadline)throw Error('Import đang xử lý. Giữ batch/key và kiểm tra lịch sử job; không gửi batch mới.');await new Promise(resolve=>setTimeout(resolve,250));job=(await services.getImportJob({id:job.id},queryOptions())).data;}if(job.state==='failed')throw Error('Import thất bại: '+job.errorCode+'. Chưa ghi event. Preview lại sau khi khôi phục.');}
 return result;
}
export function settleAction(key:string){commitRequests.delete(key);pendingPreviews.delete(key);}
export function clearPresentationDrafts(){pendingPreviews.clear();importRequests.clear();commitRequests.clear();}
