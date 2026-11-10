import { generateKeyPairSync } from 'node:crypto';
import { mkdir,readFile,writeFile,copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const stateFile=resolve('.local/runtime-state.json');await readFile(stateFile); // local:init must already exist; never resets DB.
const dir=resolve('.local/operations');await mkdir(dir,{recursive:false});await mkdir(resolve(dir,'repository'));await mkdir(resolve(dir,'scratch'));await mkdir(resolve(dir,'media1'));await mkdir(resolve(dir,'media2'));
const capsule=generateKeyPairSync('rsa',{modulusLength:3072}),catalog=generateKeyPairSync('ed25519');
const capsulePublicFile=resolve(dir,'capsule-public.pem'),capsulePrivateFile=resolve(dir,'media1/capsule-private.pem'),catalogPublicFile=resolve(dir,'catalog-public.pem'),catalogPrivateFile=resolve(dir,'catalog-private.pem');
for(const [file,key,type] of [[capsulePublicFile,capsule.publicKey,'spki'],[capsulePrivateFile,capsule.privateKey,'pkcs8'],[catalogPublicFile,catalog.publicKey,'spki'],[catalogPrivateFile,catalog.privateKey,'pkcs8']] as const)await writeFile(file,key.export({type,format:'pem'}),{flag:'wx'});
await copyFile(capsulePrivateFile,resolve(dir,'media2/capsule-private.pem'));
const state=JSON.parse(await readFile(stateFile,'utf8'));
const config={mode:'synthetic-local',runtimeStateFile:stateFile,repository:resolve(dir,'repository'),scratch:resolve(dir,'scratch'),capsulePublicFile,capsulePrivateFile,catalogPublicFile,catalogPrivateFile,receiptFile:resolve(dir,'last-receipt.json'),releaseFile:'REPLACE_WITH_LOCAL_RELEASE_JSON',graceMs:90000,reserveBytes:256*1024*1024,restoreDatabase:'fw_restore_synthetic_'+Date.now(),oldWriterFenced:false,subjectId:'REPLACE_WITH_SYNTHETIC_SUBJECT',witnessJournal:resolve(state.dir,'witness-journal.json'),witnessPrivateFile:resolve(state.dir,'witness-private.pem'),witnessPublicFile:resolve(state.dir,'witness-public.pem')};
const output=resolve(dir,'operator.json');await writeFile(output,JSON.stringify(config,null,2),{flag:'wx'});console.log('Synthetic operator file: '+output);console.log('Same-host keys/media/repository are fixtures; off-host custody NOT PROVEN.');
