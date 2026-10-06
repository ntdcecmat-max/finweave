import {setupWorker} from 'msw/browser';
import {MockRepository} from './repository';
import {createHandlers} from './handlers';
function restore(){try{const user=JSON.parse(sessionStorage.getItem('fw:synthetic-session')||'null');if(user?.synthetic===true&&user?.sessionId&&user.expiresAt>Date.now())return {sessionId:user.sessionId,subjectId:'OWNER-DEMO',deviceId:'DEVICE-DEMO',workspaceIds:['W-DEMO'],role:'owner' as const,expiresAt:new Date(user.expiresAt).toISOString(),synthetic:true};}catch{}return undefined;}
export const repository=new MockRepository(restore());
export const handlers=createHandlers(repository);
export const worker=setupWorker(...handlers);

const options:Parameters<typeof worker.start>[0]={onUnhandledFrame:({frame,defaults})=>{if(frame.protocol==='http'){const request=(frame.data as {request:Request}).request;const url=new URL(request.url);if(request.method==='GET'&&url.origin===location.origin&&!url.pathname.startsWith('/__mock/')&&!url.pathname.startsWith('/api/'))return;}defaults.error();},quiet:true};
let lastActivity=Date.now(),waking:Promise<void>|null=null;
export async function startSyntheticNetwork(){await worker.start(options);lastActivity=Date.now();}
// The browser may terminate an idle/background Service Worker. Re-enable the public
// MSW lifecycle before a new request after a gap; repository/session memory stays intact.
// This never retries a mutation or substitutes fixture data for a failed response.
export async function wakeSyntheticNetwork(){if(waking){await boundedWake(waking);return;}if(Date.now()-lastActivity<=20000){lastActivity=Date.now();return;}waking=(async()=>{await worker.stop();await worker.start(options);lastActivity=Date.now();})().finally(()=>{waking=null;});await boundedWake(waking);}
async function boundedWake(promise:Promise<void>){let timer:ReturnType<typeof setTimeout>|undefined;try{await Promise.race([promise,new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('Mock network chưa sẵn sàng; thử lại cùng yêu cầu.')),1500);})]);}finally{if(timer)clearTimeout(timer);}}
