import {readFile,readdir,stat} from 'node:fs/promises';
import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),backend=resolve(root,'finweave-backend');
if(process.argv.includes('--help')){console.log('Local test mailbox only. Run without flags for the newest OTP for your email; --reset reads your reset token; --admin reads the local fixture MFA code. No messages are sent.');process.exit(0);}
if(process.argv.includes('--admin')){const r=await promisify(execFile)(process.execPath,['scripts/local-runtime.ts','mfa'],{cwd:backend,windowsHide:true});console.log('Local admin MFA: '+r.stdout.trim());process.exit(0);}
const prompt=createInterface({input:stdin,output:stdout});let email;try{email=(await prompt.question('Your local test email: ')).trim().toLowerCase();}finally{prompt.close();}
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('A valid local account email is required.');
const state=JSON.parse(await readFile(resolve(backend,'.local/runtime-state.json'),'utf8')),folder=resolve(state.dir,'mail'),reset=process.argv.includes('--reset');
const messages=[];
for(const name of await readdir(folder)){if(!name.endsWith('.json'))continue;const path=resolve(folder,name),info=await stat(path);if(Date.now()-info.mtimeMs>(reset?15:10)*60000)continue;const mail=JSON.parse(await readFile(path,'utf8'));if(mail.email?.toLowerCase()===email&&(reset?typeof mail.resetToken==='string':/^[0-9]{6}$/.test(mail.code??'')))messages.push({time:info.mtimeMs,mail});}
messages.sort((a,b)=>b.time-a.time);if(!messages.length){console.log('No recent matching message. Request a new code in FinWeave, then run this tool again.');process.exitCode=1;}else console.log((reset?'Local reset token: ':'Local verification code: ')+(reset?messages[0].mail.resetToken:messages[0].mail.code));
