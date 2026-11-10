import { createServer } from 'node:http';
import { verify } from 'node:crypto';
import { readFile,appendFile,writeFile } from 'node:fs/promises';
import { jcs } from '../src/runtime/crypto.ts';
const [configPath]=process.argv.slice(2),config=JSON.parse(await readFile(configPath,'utf8'));
if(config.mode!=='synthetic-local'||!Number.isInteger(config.missingMs)||config.missingMs<300)throw Error('SYNTHETIC_RECEIVER_CONFIG_REQUIRED');
const publicPem=await readFile(config.publicKeyFile,'utf8');let seq=-1,last=performance.now(),missing=false;
const event=async(code:string)=>appendFile(config.eventsFile,JSON.stringify({environmentClass:'synthetic',safeCode:code,at:new Date().toISOString()})+'\n');
const server=createServer(async(req,res)=>{
  try {
    if(req.method!=='POST'||req.url!=='/heartbeat')throw Error();
    let data='';for await(const chunk of req){data+=chunk;if(data.length>4096)throw Error();}
    const body=JSON.parse(data),{signature,...claims}=body;
    if(Object.keys(claims).sort().join(',')!=='at,code,sequence'||claims.code!=='HEARTBEAT'||!Number.isInteger(claims.sequence)||claims.sequence<=seq||!Number.isFinite(claims.at)||Math.abs(Date.now()-claims.at)>5000||!verify(null,Buffer.from(jcs(claims)),publicPem,Buffer.from(signature,'base64url')))throw Error();
    seq=claims.sequence;last=performance.now();if(missing){missing=false;await event('HEARTBEAT_RECOVERED');}
    res.writeHead(204).end();
  }catch{res.writeHead(400).end();}
});
await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
await writeFile(config.readyFile,JSON.stringify({port:(server.address() as {port:number}).port}),{flag:'wx'});
const timer=setInterval(()=>{if(!missing&&performance.now()-last>config.missingMs){missing=true;void event('HEARTBEAT_MISSING');}},100);
process.once('SIGTERM',()=>{clearInterval(timer);server.close();});
