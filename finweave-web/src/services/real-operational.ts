import {allPages,realCall,requestOptions,activeVersion} from './real-transport';
import {ApiError} from './api-error';
const holdingPreviews=new Map<string,{digest:string;version:number;objects:Record<string,number>}>();
const draftBodies=new Map<string,any>();
// Explicit view projection: retain all canonical goals/links so an edit never drops them.
function bodyToWire(body:any){const {goal,...rest}=body;const prior=body.canonical;
 const ref=prior?.goals?.[0]?.ref??'primary_goal';
 const goals=goal?[{...goal,ref},...(prior?.goals?.slice(1)??[])]:prior?.goals??[];
 const links=goal?[...(prior?.links??[]).filter((l:any)=>l.goalRef!==ref),...rest.items.filter((i:any)=>i.supportsGoal).map((i:any)=>({itemRef:i.ref,goalRef:ref}))]:prior?.links??[];
 const {canonical,...fields}=rest;return {...fields,goals,links};
}
export const draftBodySignature=(body:any)=>JSON.stringify(bodyToWire(body));
function draftToView(draft:any){draftBodies.set(draft.id,draft.body);return {...draft,body:{...draft.body,goal:draft.body.goals[0]??null,canonical:draft.body}};}
export function clearOperationalDrafts(){holdingPreviews.clear();draftBodies.clear();}
export async function realOperational(operation:string,input:any,options:{key?:string;version?:number;signal?:AbortSignal}={}){
 const signal=options.signal;
 const invoke=async(op:string,i:any,token:string|null=null,objects:Record<string,number>={})=>(await realCall(op,i,{signal,mutation:requestOptions(options.key,options.version??activeVersion(),token,objects)})).data;
 if(operation==='getState'){
  const [devices,receipts,priceJobs,conversations]=await Promise.all([allPages('listDevices',{},signal),allPages('listReceipts',{deviceId:null},signal),allPages('listRefreshJobs',{},signal),allPages('listConversations',{},signal)]);
  const [runs,drafts]=await Promise.all([Promise.all(conversations.map(c=>allPages('listAgentRuns',{conversationId:c.id},signal))).then(r=>r.flat()),Promise.all(conversations.map(c=>allPages('listPlanningDrafts',{conversationId:c.id},signal))).then(r=>r.flat())]);
  const bindings=(await Promise.all(devices.map(d=>allPages('listCollectorBindings',{deviceId:d.id},signal)))).flat();
  const native=!!(window as any).Capacitor?.isNativePlatform?.();let appVersion='web',androidApi=0;
  if(native){const c=await (window as any).Capacitor.Plugins.FinWeaveOwner.getCapabilities();if(c.apiRevision!=='FW-API-T1-D1J2-005'||c.bridgeRevision!=='FW-NATIVE-BRIDGE-003'||typeof c.appVersion!=='string'||!Number.isInteger(c.androidApi))throw new ApiError('Native capabilities không khớp.','UPDATE_REQUIRED');appVersion=c.appVersion;androidApi=c.androidApi;}
  const support=await allPages('listSourceSupport',{appVersion,androidApi},signal);
  return {devices,receipts,priceJobs,runs,drafts:drafts.map(draftToView),bindings,support,dailyPriceSchedule:null,synthetic:devices.every(d=>d.synthetic)};
 }
 if(operation==='searchInstruments')return allPages(operation,{...input,exchange:null},signal);
 if(operation==='getGoldProfiles')return allPages(operation,{},signal);
 if(operation==='previewHolding'){const objects:Record<string,number>={};if(input.existingId){const h=await invoke('getHolding',{id:input.existingId});objects[h.id]=h.version;}const p=await invoke(operation,input,null,objects);holdingPreviews.set(p.token,{digest:p.digest,version:p.version,objects});return p;}
 if(operation==='confirmHolding'){const preview=holdingPreviews.get(input.token);if(!preview)throw new ApiError('Dự tính không còn trong phiên; xem lại.','PREVIEW_EXPIRED',409);return invoke(operation,{...input,digest:preview.digest},input.token,preview.objects);}
 if(['registerExampleDevice','testCollector'].includes(operation))throw new ApiError('Thao tác dữ liệu minh họa chỉ có ở môi trường mock. Đăng ký thiết bị qua native.','SYNTHETIC_ONLY',403);
 if(operation==='answerAgentRun'){const {body,...rest}=input;const run=await invoke(operation,{...rest,answer:body.notes||'Xác nhận đề xuất đã nhập',proposalBody:bodyToWire(body),reserveConfirmed:true,settings:body.settings},null,{[input.id]:input.expectedVersion});if(!run.draftId)throw new ApiError('Agent đang xử lý; chờ kết quả từ máy chủ.','RUN_PENDING',409,true);return draftToView(await invoke('getPlanningDraft',{id:run.draftId}));}
 if(operation==='reviseDraft'){const {body,...rest}=input;return draftToView(await invoke(operation,{...rest,body:bodyToWire(body)},null,{[input.id]:input.expectedVersion}));}
 const result=await invoke(operation,input,operation==='confirmPlanningDraft'?input.token:null,input.id&&Number.isInteger(input.expectedVersion)?{[input.id]:input.expectedVersion}:{});
 return ['reviseDraftByMessage','refreshDraft','previewPlanningDraft','confirmPlanningDraft'].includes(operation)?draftToView(result):result;
}
