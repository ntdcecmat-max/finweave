import {http,HttpResponse,delay} from 'msw';
import {ZodError} from 'zod';
import {MockRepository,MockFailure} from './repository';
import {DomainError} from '../domain/commands';
import {CONTRACT_VERSION} from '../contracts/schemas';
import type {OperationId} from '../contracts/operations';
import {operations} from '../contracts/operations';
import {OperationalFailure} from './operational';
import type {IdentityOperationId} from '../contracts/identity';
export function createHandlers(repository:MockRepository,base=""){
function error(e:unknown,requestId='REQ-error') {const code=e instanceof MockFailure||e instanceof DomainError?e.code:'VALIDATION';const status=e instanceof MockFailure?e.status:code.includes('CONFLICT')?409:code==='OFFLINE'||code==='TIMEOUT'?503:422;const fieldErrors=e instanceof ZodError?e.issues.map(issue=>({field:issue.path.join('.')||'input',code:'INVALID_VALUE',message:issue.message.slice(0,500)})):[];return HttpResponse.json({contractVersion:CONTRACT_VERSION,requestId,code,message:(e instanceof ZodError?'Dữ liệu không khớp schema. Kiểm tra trường bắt buộc, ngày và đơn vị.':e instanceof Error?e.message:'Không xử lý được request.').slice(0,500),retryable:['TIMEOUT','OFFLINE','RATE_LIMITED','SERVICE_UNAVAILABLE'].includes(code),fieldErrors,currentVersion:repository.store.version,retryAfterSeconds:status===429?30:null},{status,headers:status===429?{'Retry-After':'30'}:{}});}
const authorizeMode=(request:Request)=>{if(request.headers.get('X-FinWeave-Synthetic')!=='true')throw new MockFailure('FORBIDDEN','Endpoint này chỉ nhận synthetic mock.',403);};
return [
 http.post(base+'/__mock/v2/operational',async({request})=>{await delay(80);try{authorizeMode(request);return HttpResponse.json(await repository.dispatchV2(await request.json(),request.headers.get('X-FinWeave-Mock-Session')));}catch(e){if(e instanceof OperationalFailure)return HttpResponse.json({code:e.code,message:e.message,retryAfterSeconds:e.status===429?30:null},{status:e.status});return error(e);}}),
 http.post(base+'/__mock/v1/logical/:operation',async({request,params})=>{await delay(80);let id='REQ-error';try{authorizeMode(request);const body=await request.json() as any;id=body.requestId;const result=await repository.dispatch(params.operation as OperationId,body,request.headers.get('X-FinWeave-Mock-Session'));return HttpResponse.json(result,{status:operations[params.operation as OperationId].status});}catch(e){return error(e,id);}}),
 http.post(base+'/__mock/v1/identity/:operation',async({request,params})=>{await delay(80);let id='REQ-error';try{authorizeMode(request);const body=await request.json() as any;id=body.requestId;return HttpResponse.json(await repository.identity(params.operation as IdentityOperationId,body,request.headers.get('X-FinWeave-Mock-Session')));}catch(e){return error(e,id);}}),
 http.post(base+'/__mock/v1/control',async({request})=>{await delay(80);try{authorizeMode(request);return HttpResponse.json(repository.control(await request.json(),request.headers.get('X-FinWeave-Mock-Session')));}catch(e){return error(e);}}),
 http.all(base+'/demo/*',()=>HttpResponse.json({message:'Legacy demo endpoint retired.',code:'NOT_FOUND'},{status:410})),
 ];}
