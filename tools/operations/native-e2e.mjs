import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),backend=resolve(root,'finweave-backend'),web=resolve(root,'finweave-web'),run=promisify(execFile);
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve(root,'.local/playwright');
const adb=resolve(root,'.local/android-toolchain/sdk/platform-tools/adb.exe'),device=process.env.FINWEAVE_ANDROID_SERIAL??'emulator-5554';
const adbCall=async(...args)=>(await run(adb,['-s',device,...args],{windowsHide:true,timeout:30000,maxBuffer:1024*1024})).stdout.trim();
const {chromium}=createRequire(resolve(web,'package.json'))('@playwright/test'),{Pool}=createRequire(resolve(backend,'package.json'))('pg');
const {_android}=createRequire(resolve(web,'package.json'))('playwright');
process.chdir(backend);
const {startCluster}=await import('../../finweave-backend/scripts/runtime-cluster.ts');
const {buildApp}=await import('../../finweave-backend/src/runtime/app.ts');
const {revision,contract}=await import('../../finweave-backend/src/runtime/contracts.ts');
const cluster=await startCluster('native-e2e-'+Date.now()),pool=new Pool({connectionString:cluster.configs.user.databaseUrl}),mails=[];
const app=await buildApp(cluster.configs.user,pool,{async send(mail){mails.push(mail)}});
const receipt={scope:'ANDROID_EMULATOR_NATIVE_KEYSTORE_OWNER_PROOF_HTTP_POSTGRES_AND_INDEPENDENT_WEB_CLIENT_SYNTHETIC_ONLY',startedAt:new Date().toISOString(),device,checks:[],status:'FAIL'};
const out=resolve(root,'docs/execution/evidence/completion-2026-11-03/native-'+Date.now());await mkdir(out,{recursive:true});
let server,desktop,mobile,page;
receipt.http=[];
app.addHook('onResponse',(request,response,done)=>{if(receipt.http.length<100)receipt.http.push({operation:request.body?.operationId??'health',status:response.statusCode});done();});
const pass=name=>{receipt.checks.push({name,status:'PASS'});console.log('PASS '+name)};
try{
 await app.listen({host:'127.0.0.1',port:4310});
 const env=Object.fromEntries(Object.entries(process.env).filter(([key])=>!key.startsWith('FW_')));
 server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1'],{cwd:web,env:{...env,VITE_DATA_MODE:'backend',FINWEAVE_VITE_CACHE:'.local/vite-native-e2e'},windowsHide:true,stdio:'ignore'});
 for(let attempt=0;attempt<120;attempt++){try{if((await fetch('http://127.0.0.1:5173')).ok)break;}catch{}await new Promise(ok=>setTimeout(ok,250));}
 assert.equal(await adbCall('shell','getprop','sys.boot_completed'),'1');
 await adbCall('reverse','tcp:4310','tcp:4310');
 const apk=resolve(web,'android/app/build/outputs/apk/debug/app-debug.apk');receipt.apkSha256=createHash('sha256').update(await readFile(apk)).digest('hex');
 await adbCall('install','-r',apk);await adbCall('shell','am','force-stop','test.finweave.prototype');await adbCall('shell','am','start','-n','test.finweave.prototype/.MainActivity');
 let socket;
 for(let attempt=0;attempt<80;attempt++){const unix=await adbCall('shell','cat','/proc/net/unix');socket=unix.match(/@(webview_devtools_remote_\d+)/)?.[1];if(socket)break;await new Promise(ok=>setTimeout(ok,250));}
 assert(socket,'DEBUG_WEBVIEW_NOT_AVAILABLE');await adbCall('forward','tcp:9222','localabstract:'+socket);
 mobile=(await _android.devices()).find(d=>d.serial()===device);assert(mobile,'ANDROID_DEVICE_NOT_AVAILABLE');const view=await mobile.webView({pkg:'test.finweave.prototype'});page=await view.page();page.setDefaultTimeout(20000);
 page.on('crash',()=>{receipt.rendererCrashed=true;});
 await page.waitForURL('https://localhost/auth/login');
 const email='native-'+Date.now()+'@owner.test',password='Native integration password 2026!';
 await page.getByRole('link',{name:'Tạo tài khoản',exact:true}).click();await page.locator('#auth-name').fill('Native synthetic owner');await page.locator('#auth-email').fill(email);await page.locator('#auth-password').fill(password);await page.locator('#auth-confirm').fill(password);await page.getByRole('checkbox').check();await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();await page.waitForURL(/auth\/verify/);
 const mail=mails.findLast(m=>m.email===email);assert(mail);await page.locator('#auth-code').fill(mail.code);await page.getByRole('button',{name:'Xác nhận mã',exact:true}).click();await page.waitForURL(/\/home/);pass('native registration, OTP and installation-key proof with tokens kept outside WebView');
 let workspace=null,version=null;
 async function nativeCall(operationId,input={},mutation=null){
  if(contract.components.schemas[operationId+'Request'].properties.mutation.type==='null')mutation=null;
  const req={contractVersion:'2.0.0',requestId:crypto.randomUUID(),operationId,workspaceId:workspace,input,mutation};
  const response=await page.evaluate(async req=>{const canonical=v=>v&&typeof v==='object'?(Array.isArray(v)?'['+v.map(canonical).join(',')+']':'{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}'):JSON.stringify(v);return window.Capacitor.Plugins.FinWeaveOwner.invoke({canonicalRequest:canonical(req)});},req);
  assert(response.status<300,'NATIVE_'+operationId+'_'+response.body?.code);assert.equal(response.headers['X-FW-Contract-Revision'],revision);version=response.body.workspaceVersion??version;return response.body.data;
 }
 workspace=(await nativeCall('getSession')).workspaceIds[0];assert(workspace);const w=await nativeCall('getWorkspace');
 const input={name:'Created on Android',kind:'cash',opening:{value:'1000000',currency:'VND'},openingDate:w.businessClock.slice(0,10)};
 const preview=await nativeCall('previewMutation',{operationId:'createAccount',input,expectedWorkspaceVersion:version,expectedObjectVersions:{}},{idempotencyKey:crypto.randomUUID(),expectedWorkspaceVersion:version,expectedObjectVersions:{},previewToken:null});
 const mutation={idempotencyKey:crypto.randomUUID(),expectedWorkspaceVersion:version,expectedObjectVersions:{},previewToken:preview.previewToken};
 const created=await nativeCall('createAccount',input,mutation),replayed=await nativeCall('createAccount',input,mutation);assert.deepEqual(replayed.affectedIds,created.affectedIds);pass('native preview/commit and exact retry have one persisted effect');
 desktop=await chromium.launch({channel:'msedge',headless:true});const browserPage=await desktop.newPage();
 await browserPage.goto('http://127.0.0.1:5173/auth/login');await browserPage.locator('#auth-email').fill(email);await browserPage.locator('#auth-password').fill(password);await browserPage.getByRole('button',{name:'Đăng nhập',exact:true}).click();await browserPage.waitForURL(/auth\/verify/);
 await browserPage.locator('#auth-code').fill(mails.findLast(m=>m.email===email).code);await browserPage.getByRole('button',{name:'Xác nhận mã',exact:true}).click();await browserPage.waitForURL(/\/home/);await browserPage.goto('http://127.0.0.1:5173/home/assets');await browserPage.getByText('Created on Android',{exact:true}).filter({visible:true}).first().waitFor();pass('independent web login visibly reads the account created on Android');
 await browserPage.evaluate(async({workspace,date})=>{const api=await import('/src/services/real-transport.ts');api.selectWorkspace(workspace);const w=await api.realCall('getWorkspace',{}),input={name:'Created on Web',kind:'cash',opening:{value:'42',currency:'VND'},openingDate:date};const p=await api.realCall('previewMutation',{operationId:'createAccount',input,expectedWorkspaceVersion:w.data.version,expectedObjectVersions:{}});await api.realCall('createAccount',input,{mutation:{idempotencyKey:crypto.randomUUID(),expectedWorkspaceVersion:w.data.version,expectedObjectVersions:{},previewToken:p.data.previewToken}});},{workspace,date:w.businessClock.slice(0,10)});
 await page.goto('https://localhost/home/assets');await page.getByText('Created on Web',{exact:true}).filter({visible:true}).first().waitFor();pass('Android visibly reads the account committed by the independent web session');
 const mailCount=mails.length;let enrollmentError;
 const pendingEnrollment=page.evaluate(async workspace=>{await window.Capacitor.Plugins.FinWeaveCollector.acceptDisclosure({version:'2026-10-08'});return window.Capacitor.Plugins.FinWeaveOwner.enroll({workspaceId:workspace,key:crypto.randomUUID()});},workspace).catch(error=>{enrollmentError=error;return null;});
 await mobile.fill({desc:'FinWeave owner password'},password);await mobile.tap({res:'android:id/button1'});
 for(let attempt=0;attempt<80&&mails.length===mailCount;attempt++)await new Promise(ok=>setTimeout(ok,100));assert(mails.length>mailCount,'NATIVE_REAUTH_MAIL_MISSING');
 await mobile.fill({desc:'FinWeave owner verification code'},mails.at(-1).code);await mobile.tap({res:'android:id/button1'});
 const enrollment=await pendingEnrollment;if(enrollmentError)throw enrollmentError;assert(enrollment.device?.id);assert.deepEqual(Object.keys(enrollment),['device']);pass('native password and OTP reauthentication precede device enrollment; collector credentials remain outside WebView');
 await adbCall('shell','am','force-stop','test.finweave.prototype');await adbCall('shell','am','start','-n','test.finweave.prototype/.MainActivity');
 let restoredSocket;
 for(let attempt=0;attempt<80;attempt++){const pid=await adbCall('shell','pidof','test.finweave.prototype').catch(()=>null);const unix=await adbCall('shell','cat','/proc/net/unix');const candidate='webview_devtools_remote_'+pid;if(pid&&unix.includes('@'+candidate)){restoredSocket=candidate;break;}await new Promise(ok=>setTimeout(ok,250));}
 assert(restoredSocket,'RESTARTED_WEBVIEW_NOT_AVAILABLE');
 const restored=await mobile.webView({pkg:'test.finweave.prototype',socketName:restoredSocket});page=await restored.page();page.setDefaultTimeout(20000);await page.waitForURL(/\/home/);await page.goto('https://localhost/home/assets');await page.getByText('Created on Web',{exact:true}).filter({visible:true}).first().waitFor();
 const publicSession=await page.evaluate(()=>window.Capacitor.Plugins.FinWeaveOwner.restoreSession());assert.deepEqual(Object.keys(publicSession).sort(),['profile','session']);assert(!Object.hasOwn(publicSession,'tokens'));pass('process restart restores a server-verified owner session without exposing credentials to JavaScript');
 await page.screenshot({path:resolve(out,'android-home.png')});receipt.status='PASS_EMULATOR_CHECKED_SCOPE_REAL_SOURCES_NOT_ACTIVATED';
}catch(error){receipt.failureCode=String(error.message).slice(0,500);receipt.pageURL=page?.url();if(page&&!page.isClosed()){await page.screenshot({path:resolve(out,'failure.png')}).catch(()=>{});receipt.visibleText=await page.locator('body').innerText().catch(()=>null);}await adbCall('logcat','-b','crash','-d','-v','brief').then(log=>writeFile(resolve(out,'crash.log'),log)).catch(()=>{});throw error;}
finally{
 await mobile?.close().catch(()=>{});await desktop?.close().catch(()=>{});if(server&&server.exitCode===null){const closed=new Promise(ok=>server.once('exit',ok));server.kill();await closed;}
 await app.close();await pool.end();await cluster.stop();receipt.clusterStopped=true;receipt.finishedAt=new Date().toISOString();await writeFile(resolve(out,'results.json'),JSON.stringify(receipt,null,2));console.log('Native evidence: '+out);
}
process.exit(receipt.status==='PASS_EMULATOR_CHECKED_SCOPE_REAL_SOURCES_NOT_ACTIVATED'?0:1);
