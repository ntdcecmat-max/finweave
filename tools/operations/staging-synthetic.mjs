import {execFile,spawn} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {createRequire} from 'node:module';
import {resolve,dirname,relative,extname} from 'node:path';
import {generateKeyPairSync,randomBytes,createHash} from 'node:crypto';
import https from 'node:https';
import http from 'node:http';
import {createServer as tcpServer} from 'node:net';
const run=promisify(execFile),root=process.cwd(),backend=resolve(root,'finweave-backend'),command=process.argv[2];
const stateFile=resolve(root,'.local/staging-synthetic/state.json');
const safeEnv=Object.fromEntries(Object.entries(process.env).filter(([k])=>!k.startsWith('FW_')));
const sha=b=>createHash('sha256').update(b).digest('hex');
async function available(ports){for(const port of ports){const probe=tcpServer();await new Promise((ok,fail)=>{probe.once('error',fail);probe.listen(port,'127.0.0.1',ok)});await new Promise(ok=>probe.close(ok));}}
process.chdir(backend);
const {startCluster}=await import('../../finweave-backend/scripts/runtime-cluster.ts');
const {hashPassword,seal,token}=await import('../../finweave-backend/src/runtime/crypto.ts');
const {pg_ctl}=createRequire(resolve(backend,'package.json'))('@embedded-postgres/windows-x64');
if(command==='create'){
 try{await readFile(stateFile);throw Error('STAGING_ALREADY_EXISTS');}catch(e){if(e.code!=='ENOENT')throw e;}
 await available([4310,4311,4450,4451]);
 const cluster=await startCluster('staging-synthetic-'+Date.now());
 try{
  for(const [profile,c]of Object.entries(cluster.configs))await writeFile(resolve(cluster.dir,profile+'.json'),JSON.stringify({...c,pepper:c.pepper.toString('base64url'),replayKey:c.replayKey.toString('base64url'),...(c.factorKey?{factorKey:c.factorKey.toString('base64url')}:{})}),{flag:'wx'});
  const seed=randomBytes(20),id=token();await cluster.admin.query('INSERT INTO fw_ops.identities(id,email,password,seed) VALUES($1,$2,$3,$4)',[id,'operator@ops.test',await hashPassword('Synthetic Ops password 2026!'),seal(cluster.configs.ops.factorKey,seed.toString('base64url'),'totp:'+id)]);
  await writeFile(resolve(cluster.dir,'ops-fixture.json'),JSON.stringify({seed:seed.toString('base64url')}),{flag:'wx'});
  await cluster.admin.query('SELECT fw_control.enter_maintenance()');
  await run('pwsh',['-NoProfile','-File',resolve(root,'tools/operations/create-staging-cert.ps1'),'-OutputDirectory',resolve(cluster.dir,'tls')],{windowsHide:true,timeout:30000});
  await writeFile(resolve(cluster.dir,'control-key'),token(),{flag:'wx'});
  const state={id:'FW-STG-SYN-20261013-01',mode:'synthetic-local',environmentClass:'STAGING_SYNTHETIC_LOCAL_SAME_HOST',status:'PREPARED_MAINTENANCE',dir:cluster.dir,cluster:cluster.cluster,adminUrl:cluster.adminUrl,userUrl:'https://127.0.0.1:4450',adminUrlPublic:'https://localhost:4451',realEnabled:false,modelManifest:null,releaseFile:null,createdAt:new Date().toISOString()};
  await mkdir(dirname(stateFile),{recursive:true});await writeFile(stateFile,JSON.stringify(state,null,2),{flag:'wx'});
 }finally{await cluster.stop();}
 console.log('Staging synthetic prepared; private state: '+stateFile);
}else{
 const state=JSON.parse(await readFile(stateFile,'utf8'));
 if(state.mode!=='synthetic-local'||state.realEnabled!==false||!relative(resolve(backend,'.local'),state.dir)||relative(resolve(backend,'.local'),state.dir).startsWith('..'))throw Error('STAGING_TARGET_INVALID');
 if(command==='status'){console.log(JSON.stringify({id:state.id,status:state.status,userUrl:state.userUrl,adminUrl:state.adminUrlPublic,releaseFile:state.releaseFile,modelManifestConfigured:!!state.modelManifest,realEnabled:false}));}
 else if(command==='upgrade'){
  if(state.status!=='STOPPED'||!process.argv[3])throw Error('STOPPED_STAGING_AND_TESTED_RELEASE_REQUIRED');
  await available([4310,4311,4450,4451]);
  const releaseFile=resolve(root,process.argv[3]),candidate=JSON.parse(await readFile(releaseFile,'utf8')),previous=JSON.parse(await readFile(state.releaseFile,'utf8'));
  if(candidate.status!=='SYNTHETIC_VERIFIED_REAL_CLOSED'||candidate.mode!=='synthetic-local')throw Error('VERIFIED_SYNTHETIC_RELEASE_REQUIRED');
  const dimensions=[...new Set([...Object.keys(previous.compatibility),...Object.keys(candidate.compatibility)])].filter(k=>previous.compatibility[k]!==candidate.compatibility[k]);
  const reviewed=['finweave-backend/src/runtime/agent-provider.ts','finweave-backend/src/runtime/tool-gateway.ts'];
  if(dimensions.some(k=>!reviewed.includes(k)))throw Error('UPGRADE_COMPATIBILITY_REVIEW_REQUIRED');
  state.releaseHistory=[...(state.releaseHistory??[]),{releaseFile:state.releaseFile,artifactDigest:state.artifactDigest,stoppedAt:state.stoppedAt}];
  state.forwardUpgrade={at:new Date().toISOString(),dimensions,scope:'model streaming digest, bounded prompt/issued cursors, completed-read pruning and persisted-draft guard; API/DB/native/job/config formats unchanged; prior-model code rollback unverified'};
  const operator=JSON.parse(await readFile(resolve(state.dir,'operator.json'),'utf8'));operator.releaseFile=releaseFile;await writeFile(resolve(state.dir,'operator.json'),JSON.stringify(operator));
  state.releaseFile=releaseFile;state.artifactDigest=candidate.artifactDigest;await writeFile(stateFile,JSON.stringify(state,null,2));console.log('Stopped staging forward release pointer prepared; startup gates will verify signature/source/DB/backup before open.');
 }
 else if(command==='stop'){
  const key=(await readFile(resolve(state.dir,'control-key'),'utf8')).trim(),cert=await readFile(resolve(state.dir,'tls/localhost-cert.pem'));
  await new Promise((ok,fail)=>{const request=https.request(state.userUrl+'/_synthetic/control/stop',{method:'POST',ca:cert,headers:{authorization:'Bearer '+key}},r=>{r.resume();r.statusCode===204?ok():fail(Error('STAGING_STOP_DENIED'))});request.on('error',fail);request.end();});
  console.log('Staging shutdown requested; inspect status before restart.');
 }else if(command==='start'){
  const releaseFile=resolve(root,process.argv[3]??'');if(!process.argv[3])throw Error('TESTED_RELEASE_MANIFEST_REQUIRED');
  await available([4310,4311,4450,4451]);
  const release=JSON.parse(await readFile(releaseFile,'utf8'));if(release.status!=='SYNTHETIC_VERIFIED_REAL_CLOSED')throw Error('SYNTHETIC_RELEASE_NOT_VERIFIED');
  const runtimeStateFile=resolve(state.dir,'runtime-state.json');await writeFile(runtimeStateFile,JSON.stringify({dir:state.dir,cluster:state.cluster,adminUrl:state.adminUrl}));
  if(state.releaseFile&&state.artifactDigest!==release.artifactDigest)throw Error('STAGING_UPGRADE_REQUIRES_REHEARSED_DRAIN_AND_NEW_ASSET_DIRECTORY');
  if(process.argv[4]){
   const {OllamaProvider}=await import('../../finweave-backend/src/runtime/agent-provider.ts');
   state.modelManifest=resolve(root,process.argv[4]);
   const provider=new OllamaProvider(JSON.parse(await readFile(state.modelManifest,'utf8')));await provider.preflight();
  }
  await run(pg_ctl,['-D',state.cluster,'-l',resolve(state.dir,'postgres.log'),'-w','start','-o',`-h 127.0.0.1 -p ${new URL(state.adminUrl).port} -c timezone=UTC -c max_connections=30`],{windowsHide:true,timeout:30000});
  const children=[],streams=[],servers=[];let closing=false;
  async function shutdown(){if(closing)return;closing=true;try{await run(process.execPath,['scripts/operate.ts','maintenance',resolve(state.dir,'operator.json')],{cwd:backend,env:{...safeEnv,FW_MODE:'synthetic-local'},windowsHide:true,timeout:30000});await run(process.execPath,['scripts/operate.ts','drain',resolve(state.dir,'operator.json')],{cwd:backend,env:{...safeEnv,FW_MODE:'synthetic-local'},windowsHide:true,timeout:30000}).catch(()=>{});await run(process.execPath,['scripts/operate.ts','fence',resolve(state.dir,'operator.json')],{cwd:backend,env:{...safeEnv,FW_MODE:'synthetic-local'},windowsHide:true,timeout:30000});}catch{if(servers.length){closing=false;throw Error('STAGING_SHUTDOWN_FENCE_REQUIRED');}}for(const server of servers)await new Promise(ok=>server.close(ok));for(const child of children)if(child.exitCode===null){const done=new Promise(ok=>child.once('exit',ok));child.kill();await done;}for(const stream of streams)stream.end();await run(pg_ctl,['-D',state.cluster,'-w','stop','-m','fast'],{windowsHide:true,timeout:30000});state.status='STOPPED';state.stoppedAt=new Date().toISOString();await writeFile(stateFile,JSON.stringify(state,null,2));}
  try{
   let existingOperator;try{existingOperator=JSON.parse(await readFile(resolve(state.dir,'operator.json'),'utf8'))}catch(e){if(e.code!=='ENOENT')throw e;}
   if(!existingOperator){
   const capsule=generateKeyPairSync('rsa',{modulusLength:3072}),catalog=generateKeyPairSync('ed25519'),witness=generateKeyPairSync('ed25519');
   for(const [name,key,type]of[['capsule-public',capsule.publicKey,'spki'],['capsule-private',capsule.privateKey,'pkcs8'],['catalog-public',catalog.publicKey,'spki'],['catalog-private',catalog.privateKey,'pkcs8'],['witness-public',witness.publicKey,'spki'],['witness-private',witness.privateKey,'pkcs8']])await writeFile(resolve(state.dir,name+'.pem'),key.export({type,format:'pem'}),{flag:'wx'});
   await mkdir(resolve(state.dir,'repository'));await mkdir(resolve(state.dir,'scratch'));await writeFile(resolve(state.dir,'witness.json'),'[]',{flag:'wx'});
   const operator={mode:'synthetic-local',runtimeStateFile,releaseFile,repository:resolve(state.dir,'repository'),scratch:resolve(state.dir,'scratch'),capsulePublicFile:resolve(state.dir,'capsule-public.pem'),capsulePrivateFile:resolve(state.dir,'capsule-private.pem'),catalogPublicFile:resolve(state.dir,'catalog-public.pem'),catalogPrivateFile:resolve(state.dir,'catalog-private.pem'),receiptFile:resolve(state.dir,'last-receipt.json'),witnessJournal:resolve(state.dir,'witness.json'),witnessPrivateFile:resolve(state.dir,'witness-private.pem'),witnessPublicFile:resolve(state.dir,'witness-public.pem'),reserveBytes:268435456,graceMs:1000,oldWriterFenced:false};
   await writeFile(resolve(state.dir,'operator.json'),JSON.stringify(operator),{flag:'wx'});
   }else{
    if(state.releaseFile&&existingOperator.releaseFile!==releaseFile)throw Error('STAGING_RESTART_RELEASE_POINTER_CHANGED');
    await writeFile(resolve(state.dir,'operator.json'),JSON.stringify({...existingOperator,runtimeStateFile,releaseFile}));
   }
   // Freeze a fresh client snapshot for every deployment; retain all previous assets.
   const assetRevision=Date.now();state.userAssets='user-assets-'+assetRevision;state.adminAssets='admin-assets-'+assetRevision;
   await cp(resolve(root,'finweave-web/dist'),resolve(state.dir,state.userAssets),{recursive:true,errorOnExist:true,force:false});
   await cp(resolve(root,'finweave-web/dist-admin'),resolve(state.dir,state.adminAssets),{recursive:true,errorOnExist:true,force:false});
   for(const profile of ['user','ops','ingestion','market','forecast','agent','retention']){const child=spawn(process.execPath,['src/runtime/main.ts'],{cwd:backend,env:{...safeEnv,FW_MODE:'synthetic-local',FW_PROFILE:profile,FW_SECRET_FILE:resolve(state.dir,profile+'.json'),...(profile==='agent'&&state.modelManifest?{FW_MODEL_MANIFEST:state.modelManifest}:{})},windowsHide:true,stdio:['ignore','pipe','pipe']});children.push(child);const stream=createWriteStream(resolve(state.dir,profile+'.log'));streams.push(stream);child.stdout.pipe(stream,{end:false});child.stderr.pipe(stream,{end:false});}
   for(const action of ['backup','witness-anchor','maintenance','drain','fence','migrate','rollback-check','open']){await run(process.execPath,['scripts/operate.ts',action,resolve(state.dir,'operator.json')],{cwd:backend,env:{...safeEnv,FW_MODE:'synthetic-local'},windowsHide:true,timeout:60000});}
   const cert=await readFile(resolve(state.dir,'tls/localhost-cert.pem')),key=await readFile(resolve(state.dir,'tls/localhost-key.pem')),control=(await readFile(resolve(state.dir,'control-key'),'utf8')).trim();
   for(const [port,assetDir,target,allowed]of[[4450,state.userAssets,'http://127.0.0.1:4310','https://127.0.0.1:4450'],[4451,state.adminAssets,'http://127.0.0.1:4311','https://localhost:4451']]){
    const server=https.createServer({key,cert,minVersion:'TLSv1.2'},async(req,res)=>{
     if(port===4450&&req.url==='/_synthetic/control/stop'){if(req.method!=='POST'||req.headers.authorization!=='Bearer '+control){res.writeHead(403);res.end();return;}res.writeHead(204);res.end();void shutdown();return;}
     if(req.url?.startsWith('/v2/')||req.url==='/health'){
      const headers={...req.headers,host:new URL(target).host};if(headers.origin===allowed)headers.origin=target;
      const upstream=http.request(target+req.url,{method:req.method,headers},response=>{const h={...response.headers};if(h['set-cookie'])h['set-cookie']=h['set-cookie'].map(c=>c+'; Secure');res.writeHead(response.statusCode??502,h);response.pipe(res);});upstream.on('error',()=>{res.writeHead(503);res.end('SYNTHETIC_UPSTREAM_UNAVAILABLE')});req.pipe(upstream);return;
     }
     if(req.method!=='GET'){res.writeHead(405);res.end();return;}
     try{const base=resolve(state.dir,assetDir),path=resolve(base,'.'+decodeURIComponent(new URL(req.url??'/',allowed).pathname));if(relative(base,path).startsWith('..'))throw Error('PATH');let bytes;try{bytes=await readFile(path)}catch{bytes=await readFile(resolve(base,'index.html'))}res.writeHead(200,{'content-type':({'.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.html':'text/html'})[extname(path)]??'text/html','cache-control':'no-store'});res.end(bytes);}catch{res.writeHead(404);res.end();}
    });await new Promise(ok=>server.listen(port,'127.0.0.1',ok));servers.push(server);
   }
   state.status='RUNNING_SYNTHETIC';state.releaseFile=releaseFile;state.artifactDigest=release.artifactDigest;state.tlsCertSha256=sha(cert);state.supervisorPid=process.pid;state.startedAt=new Date().toISOString();await writeFile(stateFile,JSON.stringify(state,null,2));console.log('Staging synthetic listening: '+state.userUrl+' / '+state.adminUrlPublic);
   process.once('SIGINT',()=>void shutdown());process.once('SIGTERM',()=>void shutdown());
  }catch(e){await shutdown();throw e;}
 }else throw Error('Use create|start <tested-release.json>|status|stop');
}
