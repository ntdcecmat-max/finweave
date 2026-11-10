import {realCall} from './real-transport';
import {ApiError} from './api-error';
import type {CallOptions} from './contracts';
const previews=new Map<string,{workspaceVersion:number;objects:Record<string,number>}>();
export function clearImportTransport(){previews.clear();}
export async function importCall(operation:string,input:any,options:CallOptions){
 const base={requestId:options.requestId,signal:options.signal,mutation:options.mutation};
 if(operation==='previewImport'){
  const account=await realCall('getAccount',{id:input.accountId},{signal:options.signal});
  if(account.workspaceVersion!==input.expectedWorkspaceVersion)throw new ApiError('Dữ liệu đã đổi; đọc lại trước khi preview CSV.','STALE_PROPOSAL',409);
  const reply=await realCall(operation,input,base);
  previews.set(reply.data.id,{workspaceVersion:reply.data.workspaceVersion,objects:{[account.data.id]:account.data.version}});return reply;
 }
 const captured=previews.get(input.previewId);
 if(!captured||!options.mutation)throw new ApiError('Preview không còn trong phiên; xem lại CSV trước khi xác nhận.','PREVIEW_EXPIRED',409);
 return realCall(operation,input,{...base,mutation:{...options.mutation,expectedWorkspaceVersion:captured.workspaceVersion,expectedObjectVersions:captured.objects}});
}
