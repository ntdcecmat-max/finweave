import { readFile } from 'node:fs/promises';
import { sign } from 'node:crypto';
import { jcs } from '../src/runtime/crypto.ts';
const config=JSON.parse(await readFile(process.argv[2],'utf8'));if(config.mode!=='synthetic-local')throw Error('SYNTHETIC_PRODUCER_REQUIRED');
const pem=await readFile(config.privateKeyFile,'utf8');let seq=config.sequenceStart??0;
if(!/^http:\/\/127\.0\.0\.1:\d+\/heartbeat$/.test(config.url))throw Error('LOOPBACK_REQUIRED');
const send=async()=>{const claims={at:Date.now(),sequence:seq++,code:'HEARTBEAT'};await fetch(config.url,{method:'POST',body:JSON.stringify({...claims,signature:sign(null,Buffer.from(jcs(claims)),pem).toString('base64url')}),signal:AbortSignal.timeout(500)}).catch(()=>{});};
await send();const timer=setInterval(()=>void send(),200);process.once('SIGTERM',()=>{clearInterval(timer);});
