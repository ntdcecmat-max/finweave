import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { gzipSync,gunzipSync } from 'node:zlib';
import { generateKeyPairSync,sign } from 'node:crypto';
import { mkdir,readFile,writeFile,lstat,symlink,mkdtemp } from 'node:fs/promises';
import { resolve,dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { sha,jcs,token } from '../src/runtime/crypto.ts';
import { compatibilityTuple,requireGates } from '../src/runtime/operations-release.ts';
const exec=promisify(execFile),root=resolve('..');
if(process.env.FW_UNTRUSTED_BUILD)throw Error('UNTRUSTED_CI_REQUIRES_INDEPENDENT_SECRETLESS_RUNNER');
const toolchain=JSON.parse(await readFile('database/runtime/toolchain.json','utf8'));
if(process.version!==toolchain.node||process.platform+'-'+process.arch!==toolchain.platform||sha(await readFile(process.execPath))!==toolchain.executables.node||sha(await readFile('pnpm-lock.yaml'))!==toolchain.lockSha256)throw Error('RELEASE_TOOLCHAIN_PIN_MISMATCH');
const git=(await exec('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,maxBuffer:4*1024*1024,windowsHide:true})).stdout.split('\0').filter(Boolean);
const paths=[...new Set(git)].sort(),source:Record<string,string|null>={},files:Record<string,string>={};
for(const p of paths) {
  if(p.includes('..')||resolve(root,p)===root)throw Error('SOURCE_PATH_INVALID');
  try {
    const file=await lstat(resolve(root,p));if(!file.isFile()||file.isSymbolicLink())throw Error('SOURCE_SPECIAL_FILE_UNSUPPORTED');
    const bytes=await readFile(resolve(root,p));source[p]=sha(bytes);
    // Complete backend source + pinned document contracts; deletions remain in source manifest.
    if(p.startsWith('finweave-backend/')||p.startsWith('docs/')||['finweave-web/package.json','finweave-web/src/contracts/interface-catalogue.ts','finweave-web/src/contracts/surface-catalogue.ts'].includes(p))files[p]=bytes.toString('base64');
  }catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')source[p]=null;else throw e;}
}
const sourceDigest=sha(jcs(source)),out=resolve('.local','releases',token());await mkdir(out,{recursive:true});
const artifactPath=resolve(out,'backend-source.json.gz'),artifact=gzipSync(Buffer.from(jcs({source,files})));await writeFile(artifactPath,artifact,{flag:'wx'});
// Keep native PostgreSQL dump/restore paths below Windows client path limits.
// Artifact and attestation remain in the workspace; only the disposable stage is temp.
const artifactDigest=sha(artifact),stage=await mkdtemp(resolve(tmpdir(),'fw-release-'));
for(const [p,value] of Object.entries(JSON.parse(gunzipSync(await readFile(artifactPath)).toString()).files) as [string,string][]) {
  const destination=resolve(stage,p);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,Buffer.from(value,'base64'),{flag:'wx'});assertDigest(p,await readFile(destination));
}
function assertDigest(p:string,bytes:Buffer){if(source[p]!==sha(bytes))throw Error('EXTRACTED_ARTIFACT_MISMATCH');}
const backend=resolve(stage,'finweave-backend');await symlink(resolve('node_modules'),resolve(backend,'node_modules'),'junction');
await mkdir(resolve(backend,'.local'));await symlink(resolve('.local/tools'),resolve(backend,'.local/tools'),'junction');
// Synthetic trusted local build only. Test children receive no DB/provider/signing secrets.
const environment=Object.fromEntries(Object.entries(process.env).filter(([k])=>['systemroot','windir','path','temp','tmp','comspec','pathext','userprofile','appdata','localappdata'].includes(k.toLowerCase())));
const checks:any[]=[];
try {
  for(const [id,args] of [
    ['typecheck',['node_modules/typescript/bin/tsc','--noEmit']],
    ['unit',['--test','--test-concurrency=1','tests/exact.test.ts','tests/posting.test.ts','tests/operations-release.test.ts']],
    ['operations',['scripts/test-operations.ts']]
  ] as [string,string[]][]) {
    console.log('Running artifact gate '+id);
    let result;
    try {result=await exec(process.execPath,args,{cwd:backend,env:environment,windowsHide:true,timeout:300000,maxBuffer:4*1024*1024});}
    catch(e){await writeFile(resolve(out,id+'.log'),(e as any).stdout+(e as any).stderr);checks.push({id,status:'FAIL',sourceDigest,artifactDigest,finishedAt:new Date().toISOString(),scope:'SYNTHETIC_LOCAL_TRUSTED_ARTIFACT'});throw Error('ARTIFACT_GATE_FAILED');}
    await writeFile(resolve(out,id+'.log'),result.stdout+result.stderr);checks.push({id,status:'PASS',sourceDigest,artifactDigest,finishedAt:new Date().toISOString(),scope:'SYNTHETIC_LOCAL_TRUSTED_ARTIFACT'});
  }
  // Detect modifications after tests, and checkout changes while capture/build was running.
  for(const p of Object.keys(files))assertDigest(p,await readFile(resolve(stage,p)));
  const currentPaths=[...new Set((await exec('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,windowsHide:true})).stdout.split('\0').filter(Boolean))].sort();
  if(jcs(currentPaths)!==jcs(paths))throw Error('SOURCE_CHANGED_DURING_BUILD');
  for(const p of paths){let actual:string|null;try{actual=sha(await readFile(resolve(root,p)));}catch(e){if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e;actual=null;}if(actual!==source[p])throw Error('SOURCE_CHANGED_DURING_BUILD');}
  requireGates(checks,['typecheck','unit','operations'],sourceDigest,artifactDigest);
  const pem=generateKeyPairSync('ed25519'),signature=sign(null,Buffer.from(artifactDigest),pem.privateKey).toString('base64url');
  const manifest={mode:'synthetic-local',status:'SYNTHETIC_VERIFIED_REAL_CLOSED',sourceDigest,artifactDigest,artifactPath,testedStage:stage,source,checks,compatibility:await compatibilityTuple(stage),signature,signer:pem.publicKey.export({type:'spki',format:'pem'}).toString(),signerScope:'EPHEMERAL_SYNTHETIC_SIGNER_NOT_RELEASE_CUSTODY',dependencyScope:'existing pinned local node_modules junction; independent frozen install and SBOM still real gates',finishedAt:new Date().toISOString()};
  await writeFile(resolve(out,'release.json'),JSON.stringify(manifest,null,2));console.log('Verified synthetic artifact: '+resolve(out,'release.json'));
}catch(e){await writeFile(resolve(out,'failed.json'),JSON.stringify({status:'FAIL',checks,code:'BUILD_OR_RUNTIME_GATE_FAILED'}));throw e;}
