// Privileged infrastructure CLI; never mounted in an API process or exposed as a route.
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { token,totp,equal,hashPassword,seal,open } from '../src/runtime/crypto.ts';
import { unitOfWork } from '../src/runtime/uow.ts';
if(process.env.FW_MODE!=='synthetic-local')throw Error('SYNTHETIC_LOCAL_ONLY');
const chunks:Buffer[]=[];let bytes=0;
for await(const chunk of process.stdin) {bytes+=chunk.length;if(bytes>4096)throw Error('PROVISIONING_INPUT_TOO_LARGE');chunks.push(Buffer.from(chunk));}
const input=JSON.parse(Buffer.concat(chunks).toString());
if(Object.keys(input).sort().join(',')!=='email,firstCode,password,secondCode,seed')throw Error('INVALID_PROVISIONING_FIELDS');
if(typeof input.email!=='string'||!input.email.endsWith('.test'))throw Error('SYNTHETIC_EMAIL_REQUIRED');
const seed=Buffer.from(input.seed,'base64url'),step=Math.floor(Date.now()/30000);
if(seed.length!==20||seed.toString('base64url')!==input.seed||!equal(totp(seed,step-1),input.firstCode)||!equal(totp(seed,step),input.secondCode))throw Error('TWO_CONSECUTIVE_TOTP_CODES_REQUIRED');
const state=JSON.parse(await readFile(process.env.FW_INFRA_FILE??'.local/runtime-state.json','utf8')),ops=JSON.parse(await readFile(resolve(state.dir,'ops.json'),'utf8'));
if(!['127.0.0.1','localhost'].includes(new URL(state.adminUrl).hostname))throw Error('LOCAL_INFRASTRUCTURE_REQUIRED');
const key=Buffer.from(ops.factorKey,'base64url');if(key.length!==32)throw Error('OPS_FACTOR_KEY_REQUIRED');
const phc=await hashPassword(input.password),admin=new Pool({connectionString:state.adminUrl,max:1});
try {
  await unitOfWork(admin,async tx=>{
    const existing=await tx.one('SELECT * FROM fw_ops.identities WHERE email=$1 FOR UPDATE',[input.email.toLowerCase()]);
    if(existing?.active)throw Error('ADMIN_FACTOR_ALREADY_ACTIVE');
    if(existing&&equal(open<string>(key,existing.seed,'totp:'+existing.id),input.seed))throw Error('NEW_FACTOR_REQUIRED');
    const id=existing?.id??token(),encrypted=seal(key,seed.toString('base64url'),'totp:'+id);
    if(existing)await tx.query('UPDATE fw_ops.identities SET password=$1,seed=$2,last_step=$3,active=true WHERE id=$4',[phc,encrypted,step,id]);
    else await tx.query('INSERT INTO fw_ops.identities(id,email,password,seed,last_step) VALUES($1,$2,$3,$4,$5)',[id,input.email.toLowerCase(),phc,encrypted,step]);
  });
  console.log('Admin provisioned; activation codes consumed. Sign in with the next timestep.');
} finally {await admin.end();}
