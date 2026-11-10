import {CONTRACT_VERSION} from '../contracts/schemas';
import {operations,validateInput,validateOutput} from '../contracts/operations';
import type {OperationId,Input} from '../contracts/operations';
import {identityOperations} from '../contracts/identity';
import type {IdentityOperationId,IdentityServices} from '../contracts/identity';
import {bindServices} from './contracts';
import type {LogicalTransport,CallOptions,Reply} from './contracts';
import {ApiError} from './api-error';
export {ApiError} from './api-error';
import {realCall,selectWorkspace,activeWorkspace,requestOptions} from './real-transport';
import {importCall} from './real-import';
export const dataMode=import.meta.env.VITE_DATA_MODE||'synthetic_mock';
let sessionId:string|null=null;
let syntheticWakeup:(()=>Promise<void>)|null=null;
// Bootstrap injects lifecycle readiness; services never import mock state.
export function setSyntheticWakeup(wakeup:()=>Promise<void>){syntheticWakeup=wakeup;}
export function setApiSession(id:string|null){sessionId=id;}
export const getApiSession=()=>sessionId;
export async function network(path:string,body:unknown,signal?:AbortSignal) {
 if(dataMode!=='synthetic_mock')throw new ApiError('Security transport chưa được kiểm chứng. Không gửi dữ liệu thật.','SECURITY_TRANSPORT_NOT_VERIFIED');
 if(import.meta.env.VITE_DEMO_TRANSPORT==='http')path=path.replace(/^\/__mock(?=\/)/,'/api/demo');
 const controller=new AbortController();const abort=()=>controller.abort();if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});let timeout=false;const timer=setTimeout(()=>{timeout=true;controller.abort();},import.meta.env.VITE_DEMO_TRANSPORT==='http'&&(body as {operation?:string})?.operation==='requestPriceRefresh'?15000:5000);
 try{await syntheticWakeup?.();const response=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json','X-FinWeave-Synthetic':'true',...(sessionId?{'X-FinWeave-Mock-Session':sessionId}:{})},body:JSON.stringify(body),signal:controller.signal});let data:any;try{data=await response.json();}catch{throw new ApiError('Phản hồi server không hợp lệ. Chưa xác nhận kết quả; giữ yêu cầu để thử lại.','SERVICE_UNAVAILABLE',response.ok?502:response.status,true);}if(!response.ok)throw new ApiError(data.message||'Request chưa hoàn tất.',data.code||'SERVICE_UNAVAILABLE',response.status,response.status>=500||!!data.retryable,data.fieldErrors||[],data.retryAfterSeconds??null);return data;}
 catch(error){if(error instanceof ApiError)throw error;if(controller.signal.aborted)throw new ApiError(timeout?'Timeout: chưa biết kết quả. Thử lại cùng yêu cầu.':'Đã hủy request.',timeout?'TIMEOUT':'CANCELLED',0,timeout);throw new ApiError('Không kết nối được mock network. Giữ input và thử lại.','OFFLINE',0,true);}
 finally{clearTimeout(timer);signal?.removeEventListener('abort',abort);}
}
export class HttpSyntheticTransport implements LogicalTransport {
 readonly mode='synthetic_mock' as const;
 async call<K extends OperationId>(operation:K,input:Input<K>,options:CallOptions):Promise<Reply<K>> {
  let parsed:Input<K>;try{parsed=validateInput(operation,input);}catch(e){const issues=(e as any).issues||[];const amountIssue=issues.find((issue:any)=>issue.message?.includes('VND nguyên'));throw new ApiError(amountIssue?.message||'Dữ liệu chưa hợp lệ. Kiểm tra số tiền, ngày và trường bắt buộc.','VALIDATION',422,false,issues);}
  const reply=await network('/__mock/v1/logical/'+operation,{contractVersion:CONTRACT_VERSION,requestId:options.requestId,workspaceId:options.workspaceId,operationId:operation,input:parsed,mutation:options.mutation},options.signal);
  if(reply.contractVersion!==CONTRACT_VERSION||reply.requestId!==options.requestId||!Number.isInteger(reply.workspaceVersion)||reply.workspaceVersion<1)throw new ApiError('Response không khớp contract. Chưa áp dụng dữ liệu.','SERVICE_UNAVAILABLE',502,true);
  try{return {...reply,data:validateOutput(operation,reply.data)};}catch{throw new ApiError('Dữ liệu phản hồi không khớp schema. Chưa áp dụng dữ liệu; giữ yêu cầu để thử lại.','SERVICE_UNAVAILABLE',502,true);}
 }
}
class RealLogicalTransport implements LogicalTransport {
 readonly mode='protected' as const;
 async call<K extends OperationId>(operation:K,input:Input<K>,options:CallOptions):Promise<Reply<K>>{
  const reply=await (['previewImport','confirmImport'].includes(operation)?importCall(operation,input,options):realCall(operation,input,{requestId:options.requestId,mutation:options.mutation,signal:options.signal}));
  // Envelope is validated as API005. Existing views consume the same named DTOs.
  return reply as Reply<K>;
 }
}
export const services=bindServices(dataMode==='synthetic_mock'?new HttpSyntheticTransport():new RealLogicalTransport());
export const queryOptions=(signal?:AbortSignal):CallOptions=>({requestId:crypto.randomUUID(),workspaceId:dataMode==='synthetic_mock'?'W-DEMO':activeWorkspace()??'',mutation:null,signal});
export const mutationOptions=(version:number,key:string,previewToken:string|null,objects:Record<string,number>={}):CallOptions=>({...queryOptions(),mutation:{idempotencyKey:key,expectedWorkspaceVersion:version,expectedObjectVersions:objects,previewToken}});
export const identityServices=new Proxy({} as IdentityServices,{get:(_target,key)=>async(input:any,options:any)=>{const name=key as IdentityOperationId;
 if(dataMode==='synthetic_mock')return identityOperations[name].output.parse(await network('/__mock/v1/identity/'+name,{contractVersion:CONTRACT_VERSION,requestId:options.requestId,idempotencyKey:options.idempotencyKey,input},options.signal));
 const native=!!(window as any).Capacitor?.isNativePlatform?.();
 if(native){const b=(window as any).Capacitor?.Plugins?.FinWeaveOwner;if(!b)throw new ApiError('Native owner broker chưa kết nối.','NATIVE_UNAVAILABLE');let result:any;if(name==='resetIdentityPassword'){result=await b.resetPassword({password:input.password,passwordConfirmation:input.passwordConfirmation,key:options.idempotencyKey});if(result.status>=400)throw new ApiError(result.body.message,result.body.code,result.status);return result.body.data;}if(name==='requestPasswordReset'){result=await b.requestReset({email:input.email,key:options.idempotencyKey});if(result.status>=400)throw new ApiError(result.body.message,result.body.code,result.status);return result.body.data;}if(['signIn','registerIdentity'].includes(name)){result=await b.startAuth({operation:name,input,key:options.idempotencyKey});if(result.status>=400)throw new ApiError(result.body.message,result.body.code,result.status);return {...result.body.data,challengeId:result.body.data.flowId};}if(name==='signOut'){result=await b.signOut({key:options.idempotencyKey});if(result.status>=400)throw new ApiError(result.body.message,result.body.code,result.status);return result.body?.data??result;}if(name==='verifyIdentityChallenge'){result=await b.verifyAuth({flowId:input.challengeId,code:input.code,key:options.idempotencyKey});if(result.status>=400)throw new ApiError(result.body.message,result.body.code,result.status);const data=result.body.data;let id=data.session.workspaceIds[0];if(!id){const w=await realCall('createWorkspace',{trackingStart:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}),currency:'VND',timezone:'Asia/Ho_Chi_Minh'},{workspaceId:null,mutation:requestOptions(options.idempotencyKey+'_workspace',null)});id=w.data.id;}selectWorkspace(id);return data;}}
 const wire=['signIn','registerIdentity'].includes(name)?{...input,installationPublicKey:null}:input;
 const reply=await realCall(name,wire,{requestId:options.requestId,workspaceId:null,mutation:requestOptions(options.idempotencyKey,null),signal:options.signal});
 if(name==='verifyIdentityChallenge'){const ids=reply.data.session.workspaceIds;let id=ids[0];if(!id){const w=await realCall('createWorkspace',{trackingStart:new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Ho_Chi_Minh'}),currency:'VND',timezone:'Asia/Ho_Chi_Minh'},{workspaceId:null,mutation:requestOptions(options.idempotencyKey+'_workspace',null)});id=w.data.id;}selectWorkspace(id);}
 return reply.data;
}});
export const identityOptions=()=>({contractVersion:CONTRACT_VERSION,requestId:crypto.randomUUID(),idempotencyKey:crypto.randomUUID()});
export const syntheticControl=(input:unknown)=>network('/__mock/v1/control',input);
