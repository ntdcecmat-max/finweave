import Ajv from 'ajv';
import formats from 'ajv-formats';
import pin from '../contracts/api005.generated.json';
import {ApiError} from './api-error';
export const API_REVISION=pin.revision;
export const runtimeContract:any=pin.contract;
const ajv=new Ajv({strict:false,strictNumbers:true,allErrors:true,coerceTypes:false,removeAdditional:false,useDefaults:false});
formats(ajv);ajv.addSchema({$id:'api005',components:runtimeContract.components});
const validators=new Map<string,ReturnType<typeof ajv.compile>>();
export function validateWire(name:string,value:unknown){let v=validators.get(name);if(!v){v=ajv.compile({$ref:'api005#/components/schemas/'+name});validators.set(name,v);}if(!v(value))throw new ApiError('Dữ liệu không khớp '+name+'.','CONTRACT_INVALID',422,false,v.errors??[]);return value as any;}
export const routeFor=(operation:string):string=>{const route=Object.entries(runtimeContract.paths).find(([,p]:any)=>p.post.operationId===operation)?.[0];if(!route)throw new ApiError('Operation chưa có contract.','OPERATION_UNSUPPORTED');return route;};
export const isMutation=(operation:string)=>runtimeContract.components.schemas[operation+'Request'].properties.mutation.type!=='null';
let workspaceId:string|null=null,version:number|null=null,epoch=0;
const inflight=new Set<AbortController>();
let nativeCapabilities:Promise<any>|undefined;
export const activeWorkspace=()=>workspaceId;
export const activeVersion=()=>version;
export function selectWorkspace(id:string|null){if(workspaceId!==id){invalidateTransport();workspaceId=id;version=null;}}
export function invalidateTransport(){epoch++;for(const c of inflight)c.abort();inflight.clear();}
export const requestOptions=(key:string=crypto.randomUUID(),expectedVersion:number|null=version,previewToken:string|null=null,objects:Record<string,number>={})=>({idempotencyKey:key,expectedWorkspaceVersion:expectedVersion,expectedObjectVersions:objects,previewToken});
export interface RealOptions{requestId?:string;workspaceId?:string|null;mutation?:ReturnType<typeof requestOptions>|null;signal?:AbortSignal;profile?:'user'|'ops';}
export async function realCall(operation:string,input:unknown,options:RealOptions={}){
 const profile=options.profile??'user',requestId=options.requestId??crypto.randomUUID();
 const workspaceSchema=runtimeContract.components.schemas[operation+'Request']?.properties.workspaceId;
 const scoped=workspaceSchema?.type==='null'?null:workspaceId;
 const request={contractVersion:'2.0.0',requestId,operationId:operation,workspaceId:options.workspaceId===undefined?(profile==='ops'?null:scoped):options.workspaceId,input,mutation:isMutation(operation)?options.mutation??requestOptions():null};
 validateWire(operation+'Request',request);
 const captured=epoch,c=new AbortController(),abort=()=>c.abort();inflight.add(c);
 if(options.signal?.aborted)c.abort();else options.signal?.addEventListener('abort',abort,{once:true});
 let timeout=false;const timer=setTimeout(()=>{timeout=true;c.abort();},20000);
 try{
  const native=profile==='user'&&!!(window as any).Capacitor?.isNativePlatform?.();
  let response:Response;
  if(native){const broker=(window as any).Capacitor?.Plugins?.FinWeaveOwner;if(!broker)throw new ApiError('Native owner broker chưa kết nối.','NATIVE_UNAVAILABLE');if(c.signal.aborted)throw new DOMException('Aborted','AbortError');const aborted=new Promise((_resolve,reject)=>c.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true}));const caps:any=await Promise.race([nativeCapabilities??=broker.getCapabilities(),aborted]);if(caps.apiRevision!==API_REVISION||caps.bridgeRevision!=='FW-NATIVE-BRIDGE-003')throw new ApiError('Native owner broker không khớp API005/native003.','UPDATE_REQUIRED');if(!caps.configured)throw new ApiError('Native endpoint chưa được cấu hình.','ENDPOINT_NOT_CONFIGURED');if(c.signal.aborted||captured!==epoch)throw new DOMException('Aborted','AbortError');const canonical=(v:any):string=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}'):JSON.stringify(v);const result:any=await Promise.race([broker.invoke({canonicalRequest:canonical(request)}),aborted]);response=new Response(JSON.stringify(result.body),{status:result.status,headers:result.headers});}
  else{
   const csrfName=profile==='ops'?'fw_test_admin_csrf':'fw_test_csrf';
   const csrf=document.cookie.split('; ').find(x=>x.startsWith(csrfName+'='))?.slice(csrfName.length+1);
   const base=profile==='ops'?import.meta.env.VITE_OPS_API_URL:import.meta.env.VITE_API_URL;
   response=await fetch((base??'')+routeFor(operation),{method:'POST',credentials:'include',headers:{'Content-Type':'application/json','X-FW-Contract-Revision':API_REVISION,'X-FW-Client':'web',...(request.mutation&&csrf?{'X-FW-CSRF':decodeURIComponent(csrf)}:{})},body:JSON.stringify(request),signal:c.signal});
  }
  if(captured!==epoch||c.signal.aborted)throw new ApiError('Phản hồi thuộc phiên cũ đã bị loại.','CANCELLED');
  if(response.headers.get('X-FW-Contract-Revision')!==API_REVISION)throw new ApiError('Backend không khớp API005.','UPDATE_REQUIRED',502);
  let body:any;try{body=await response.json();}catch{throw new ApiError('Phản hồi không hợp lệ; chưa biết kết quả.','OUTCOME_UNKNOWN',502,true,[],null,'unknown');}
  if(body.requestId!==requestId)throw new ApiError('Request ID phản hồi không khớp.','CONTRACT_INVALID',502);
  if(!response.ok){validateWire('Error',body);if(profile==='user'&&body.code==='UNAUTHENTICATED'&&!['signIn','registerIdentity','verifyIdentityChallenge','verifyNativeIdentityChallenge','requestPasswordReset','resetIdentityPassword','signOut'].includes(operation))window.dispatchEvent(new Event('fw:session-expired'));throw new ApiError(body.message,body.code,response.status,body.retryable,body.fieldErrors,body.retryAfterSeconds,body.outcome,body.resultRef??null);}
  validateWire(operation+'Reply',body);
  if(body.workspaceVersion!==null&&request.workspaceId===workspaceId)version=version===null?body.workspaceVersion:Math.max(version,body.workspaceVersion);
  return body;
 }catch(e){if(e instanceof ApiError)throw e;const code=(e as any)?.code;if(code==='NETWORK_WAIT')throw new ApiError('Không kết nối được native transport; giữ nguyên yêu cầu để đối chiếu.','OFFLINE',0,true,[],null,request.mutation?'unknown':null);if(typeof code==='string'&&(runtimeContract.components.schemas.Error.properties.code.enum.includes(code)||['CANCELLED','REAUTH_REQUIRED','UPDATE_REQUIRED','ENDPOINT_NOT_CONFIGURED','EPOCH_CHANGED','NATIVE_UNAVAILABLE','NETWORK_WAIT'].includes(code)))throw new ApiError(code,code,code==='CANCELLED'?0:code==='REAUTH_REQUIRED'?401:409,false);if(c.signal.aborted)throw new ApiError(timeout?'Hết thời gian; chưa biết kết quả. Thử lại cùng yêu cầu.':'Đã hủy yêu cầu.',timeout?'TIMEOUT':'CANCELLED',0,timeout,[],null,timeout?'unknown':null);throw new ApiError('Không kết nối được máy chủ. Giữ nội dung để thử lại.','OFFLINE',0,true,[],null,request.mutation?'unknown':null);}
 finally{clearTimeout(timer);inflight.delete(c);options.signal?.removeEventListener('abort',abort);}
}
export async function allPages(operation:string,input:Record<string,unknown>={},signal?:AbortSignal){let cursor:string|null=null,snapshot:number|undefined;const items:any[]=[],seen=new Set<string>();do{const r=await realCall(operation,{...input,page:{cursor,pageSize:100}},{signal});if(snapshot!==undefined&&snapshot!==r.data.snapshotVersion)throw new ApiError('Dữ liệu đã thay đổi giữa các trang; tải lại.','CURSOR_INVALID',409);snapshot=r.data.snapshotVersion;items.push(...r.data.items);cursor=r.data.nextCursor;if(cursor){if(seen.has(cursor))throw new ApiError('Cursor bị lặp.','CONTRACT_INVALID',502);seen.add(cursor);}}while(cursor);return items;}
