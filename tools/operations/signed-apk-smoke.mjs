import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const root=process.cwd(),run=promisify(execFile),serial='emulator-5554',pkg='test.finweave.prototype';
process.env.PLAYWRIGHT_BROWSERS_PATH??=resolve(root,'.local/playwright');
const adb=async(...args)=>(await run(resolve(root,'.local/android-toolchain/sdk/platform-tools/adb.exe'),['-s',serial,...args],{windowsHide:true,timeout:30000})).stdout.trim();
assert.equal((await adb('emu','avd','name')).split('\n')[0].trim(),'FinWeave_Completion_API35');
const manifest=JSON.parse(await readFile(resolve(root,'artifacts/android/manifest-0.1.9-pilot.json'),'utf8'));
const apk=await readFile(resolve(root,'artifacts/android',manifest.apk));assert.equal(createHash('sha256').update(apk).digest('hex'),manifest.sha256);
const installed=await adb('shell','dumpsys','package',pkg);assert.match(installed,/versionName=0\.1\.9-pilot/);assert(!/flags=\[[^\]]*DEBUGGABLE/.test(installed));
const {_android}=createRequire(resolve(root,'finweave-web/package.json'))('playwright');
const device=(await _android.devices()).find(d=>d.serial()===serial);assert(device);
const out=resolve(root,'docs/execution/evidence/completion-2026-11-03/signed-smoke-'+Date.now());await mkdir(out,{recursive:true});
const receipt={scope:'SIGNED_STANDALONE_SYNTHETIC_APK_EMULATOR_UI_NOT_BACKEND_OR_REAL_SOURCE_ACCEPTANCE',apkSha256:manifest.sha256,startedAt:new Date().toISOString(),checks:[],status:'FAIL'};
try{
 device.setDefaultTimeout(30000);
 await adb('shell','pm','clear',pkg);await adb('shell','am','start','-n',pkg+'/.MainActivity');
 async function wait(text){const deadline=Date.now()+60000;while(true){try{return await device.wait({text},{timeout:10000});}catch(error){if(Date.now()>=deadline)throw error;await new Promise(ok=>setTimeout(ok,300));}}}
 await wait('Đăng nhập demo');await device.tap({text:'Đăng nhập demo'});
 await wait('Xác nhận mã demo');await device.fill({clazz:'android.widget.EditText'},'123456');await adb('shell','input','keyevent','4');await device.tap({text:'Xác nhận mã demo'});
 await wait('Hiểu rõ hơn tiền của bạn');receipt.checks.push('Signed APK installs, launches, signs into synthetic demo and renders Home');
 await device.screenshot({path:resolve(out,'signed-home.png')});
 const pid=await adb('shell','pidof',pkg),unix=await adb('shell','cat','/proc/net/unix'),buildType=await adb('shell','getprop','ro.build.type');
 receipt.checks.push('Installed release package does not declare DEBUGGABLE');
 receipt.imageBuildType=buildType;
 const socketVisible=unix.includes('@webview_devtools_remote_'+pid);
 if(socketVisible){assert(['userdebug','eng'].includes(buildType));receipt.webViewSocketAcceptance='INCONCLUSIVE_OS_DEBUG_IMAGE_AUTO_ENABLES_WEBVIEW_DEBUGGING';}
 else receipt.webViewSocketAcceptance='NO_APP_WEBVIEW_DEBUG_SOCKET_OBSERVED';
 receipt.status='PASS_CHECKED_SCOPE';
}finally{await device.close();receipt.finishedAt=new Date().toISOString();await writeFile(resolve(out,'results.json'),JSON.stringify(receipt,null,2));console.log('Signed APK evidence: '+out);}
process.exit(receipt.status==='PASS_CHECKED_SCOPE'?0:1);
