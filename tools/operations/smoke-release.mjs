import { resolve } from 'node:path';
import { mkdir,readFile,writeFile } from 'node:fs/promises';
import { generateKeyPairSync } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const root=process.cwd(),backend=resolve('finweave-backend'),releaseFile=resolve(process.argv[2]);process.chdir(backend);
const {startCluster}=await import('../../finweave-backend/scripts/runtime-cluster.ts');
const cluster=await startCluster('release-smoke-'+Date.now()),dir=cluster.dir,operatorFile=resolve(dir,'operator.json'),stateFile=resolve(dir,'state.json');
const receipt={scope:'SYNTHETIC_HOST_CLI_RELEASE_NO_DEPLOY',releaseFile,startedAt:new Date().toISOString(),checks:[],status:'FAIL'};
const run=promisify(execFile);
try {
 for(const [p,c] of Object.entries(cluster.configs))await writeFile(resolve(dir,p+'.json'),JSON.stringify({...c,pepper:c.pepper.toString('base64url'),replayKey:c.replayKey.toString('base64url'),...(c.factorKey?{factorKey:c.factorKey.toString('base64url')}:{})}));
 await writeFile(stateFile,JSON.stringify({dir,adminUrl:cluster.adminUrl}));
 const capsule=generateKeyPairSync('rsa',{modulusLength:3072}),catalog=generateKeyPairSync('ed25519'),witness=generateKeyPairSync('ed25519');
 for(const [name,key,type] of [['capsule-public',capsule.publicKey,'spki'],['capsule-private',capsule.privateKey,'pkcs8'],['catalog-public',catalog.publicKey,'spki'],['catalog-private',catalog.privateKey,'pkcs8'],['witness-public',witness.publicKey,'spki'],['witness-private',witness.privateKey,'pkcs8']])await writeFile(resolve(dir,name+'.pem'),key.export({type,format:'pem'}));
 await mkdir(resolve(dir,'repository'));await mkdir(resolve(dir,'scratch'));await writeFile(resolve(dir,'witness.json'),'[]');
 const config={mode:'synthetic-local',runtimeStateFile:stateFile,releaseFile,repository:resolve(dir,'repository'),scratch:resolve(dir,'scratch'),capsulePublicFile:resolve(dir,'capsule-public.pem'),capsulePrivateFile:resolve(dir,'capsule-private.pem'),catalogPublicFile:resolve(dir,'catalog-public.pem'),catalogPrivateFile:resolve(dir,'catalog-private.pem'),receiptFile:resolve(dir,'last-receipt.json'),witnessJournal:resolve(dir,'witness.json'),witnessPrivateFile:resolve(dir,'witness-private.pem'),witnessPublicFile:resolve(dir,'witness-public.pem'),reserveBytes:268435456,graceMs:500,oldWriterFenced:false};
 await writeFile(operatorFile,JSON.stringify(config));
 for(const command of ['status','backup','witness-anchor','maintenance','drain','fence','migrate','rollback-check','open']){
   const result=await run(process.execPath,['scripts/operate.ts',command,operatorFile],{cwd:backend,env:{...process.env,FW_MODE:'synthetic-local'},windowsHide:true,timeout:60000,maxBuffer:1024*1024});
   receipt.checks.push({command,status:'PASS',safeOutput:result.stdout.trim()});console.log('PASS host CLI '+command);
 }
 if((await cluster.admin.query('SELECT maintenance,locked FROM fw_control.state')).rows[0].maintenance)throw Error('OPEN_DID_NOT_CHANGE_STATE');
 receipt.status='PASS';
}finally{await cluster.stop();receipt.finishedAt=new Date().toISOString();receipt.clusterStopped=true;const out=resolve(root,'docs/execution/evidence/backend-operations-2026-10-12','release-smoke-'+Date.now()+'.json');await writeFile(out,JSON.stringify(receipt,null,2));console.log('Evidence: '+out);}
