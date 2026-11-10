import { readFile,readdir,writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { revision,contract } from '../src/runtime/contracts.ts';
import { token,totp } from '../src/runtime/crypto.ts';
const state=JSON.parse(await readFile('.local/runtime-state.json','utf8'));
const children:ReturnType<typeof spawn>[]=[];
let sequence=0;
async function start(profile:'user'|'ops') {
  const child=spawn(process.execPath,['src/runtime/main.ts'],{windowsHide:true,env:{...process.env,FW_MODE:'synthetic-local',FW_PROFILE:profile,FW_SECRET_FILE:resolve(state.dir,profile+'.json')},stdio:['ignore','pipe','pipe']});children.push(child);
  await new Promise<void>((done,reject)=>{
    const deadline=setTimeout(()=>reject(Error('API_START_TIMEOUT')),15000);
    child.stdout!.on('data',data=>{if(data.toString().includes('API synthetic-local')){clearTimeout(deadline);done();}});
    child.once('exit',()=>{clearTimeout(deadline);reject(Error('API_PROCESS_EXITED'));});
    // Do not echo stderr containing arbitrary exception context or secrets.
    child.stderr!.resume();
  });
}
async function post(origin:string,op:string,input:unknown,cookie='',csrf='',workspaceId:string|null=null) {
  const path=Object.entries(contract.paths).find(([,v]:any)=>v.post?.operationId===op)![0];
  const mutation=contract.components.schemas[op+'Request'].properties.mutation.type==='null'?null:{idempotencyKey:token(),expectedWorkspaceVersion:workspaceId?0:null,expectedObjectVersions:{},previewToken:null};
  const response=await fetch(origin+path,{method:'POST',headers:{'content-type':'application/json','x-fw-contract-revision':revision,'x-fw-client':'web',origin,...(cookie?{cookie}:{}),...(csrf?{'x-fw-csrf':csrf}:{})},body:JSON.stringify({contractVersion:'2.0.0',requestId:'smoke_'+(++sequence),operationId:op,workspaceId,input,mutation})});
  return {status:response.status,data:await response.json() as any,cookies:response.headers.getSetCookie()};
}
function auth(cookies:string[]) {return {cookie:cookies.map(x=>x.split(';')[0]).join('; '),csrf:cookies[1]!.split(';')[0]!.split('=')[1]!};}
try {
  await start('user');await start('ops');
  const origin='http://127.0.0.1:4310',email='smoke_'+token().slice(0,10)+'@local.test',password='Synthetic smoke password 2026!';
  const register=await post(origin,'registerIdentity',{email,name:'Local smoke',password,passwordConfirmation:password,syntheticAcknowledgement:true,installationPublicKey:null});assert.equal(register.status,200);
  const mails=await Promise.all((await readdir(resolve(state.dir,'mail'))).map(async f=>JSON.parse(await readFile(resolve(state.dir,'mail',f),'utf8'))));
  const mail=mails.find(x=>x.challengeId===register.data.data.challengeId);assert(mail);
  const verified=await post(origin,'verifyIdentityChallenge',{challengeId:mail.challengeId,code:mail.code});assert.equal(verified.status,200);const a=auth(verified.cookies);
  const workspace=await post(origin,'createWorkspace',{trackingStart:'2026-10-09',currency:'VND',timezone:'Asia/Ho_Chi_Minh'},a.cookie,a.csrf);assert.equal(workspace.status,200);
  assert.equal((await post(origin,'getWorkspace',{},a.cookie,a.csrf,workspace.data.data.id)).status,200);
  assert.equal((await post(origin,'signOut',{sessionId:verified.data.data.session.sessionId},a.cookie,a.csrf)).status,200);
  assert.equal((await post(origin,'getSession',{},a.cookie,a.csrf)).status,401);
  const fixture=JSON.parse(await readFile(resolve(state.dir,'ops-fixture.json'),'utf8'));
  const opsOrigin='http://127.0.0.1:4311',admin=await post(opsOrigin,'adminSignIn',{email:fixture.email,password:fixture.password,mfaCode:totp(Buffer.from(fixture.seed,'base64url'),Math.floor(Date.now()/30000))});assert.equal(admin.status,200);const o=auth(admin.cookies);
  assert.equal((await post(opsOrigin,'getWorkspace',{},o.cookie,o.csrf,workspace.data.data.id)).status,404);
  assert.equal((await post(opsOrigin,'adminSignOut',{},o.cookie,o.csrf)).status,200);
  await writeFile(resolve(state.dir,'smoke-result.json'),JSON.stringify({status:'PASS',transport:'real loopback HTTP',userFlow:'register/mail/verify/workspace/logout/revoke',opsFlow:'password+TOTP/login/finance-denied/logout',at:new Date().toISOString()},null,2));
  console.log('Local HTTP smoke PASS: real user cookies + mail sink + Ops MFA, sessions revoked.');
} finally {
  for(const child of children) {
    child.kill();await new Promise<void>(r=>{if(child.exitCode!==null||child.signalCode!==null)r();else{child.once('exit',()=>r());setTimeout(r,5000);}});
  }
}
