import {readFile,mkdir,stat,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),backend=resolve(root,'finweave-backend'),run=promisify(execFile);
const statePath=resolve(backend,process.argv.includes('--observation')?'.local/async-observation-state.json':'.local/runtime-state.json');
const state=JSON.parse(await readFile(statePath,'utf8')),url=new URL(state.adminUrl);
if(url.protocol!=='postgresql:'||url.hostname!=='127.0.0.1')throw Error('LOCAL_DATABASE_REQUIRED');
const {postgres}=createRequire(resolve(backend,'package.json'))('@embedded-postgres/windows-x64');
const embeddedDump=resolve(dirname(postgres),'pg_dump.exe');
const dump=existsSync(embeddedDump)?embeddedDump:resolve(backend,'.local/tools/postgres-bin/pg_dump.exe');
if(!existsSync(dump))throw Error('LOCAL_BACKUP_TOOL_REQUIRED');
if(dump!==embeddedDump){const pins=JSON.parse(await readFile(resolve(backend,'database/runtime/operations-toolchain.json'),'utf8'));if(createHash('sha256').update(await readFile(dump)).digest('hex')!==pins.files['pg_dump.exe'])throw Error('LOCAL_BACKUP_TOOL_PIN_MISMATCH');}
const folder=resolve(root,'.local/pre-upgrade-backups',String(Date.now()));await mkdir(folder,{recursive:true});
const backup=resolve(folder,'database.dump');
try{
 await run(dump,['--format=custom','--file',backup],{cwd:backend,windowsHide:true,timeout:120000,env:{...process.env,PGHOST:url.hostname,PGPORT:url.port,PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:url.pathname.slice(1)||'postgres',PGSSLMODE:'disable'}});
 if((await stat(backup)).size===0)throw Error('EMPTY_BACKUP');
 const sha256=createHash('sha256').update(await readFile(backup)).digest('hex');
 const migrated=await run(process.execPath,['scripts/local-runtime.ts','migrate'],{cwd:backend,windowsHide:true,timeout:120000,env:{...process.env,FINWEAVE_TEST_RUNTIME_STATE:statePath}});
 await writeFile(resolve(folder,'receipt.json'),JSON.stringify({scope:'LOCAL_SYNTHETIC_PRE_UPGRADE_BACKUP_NOT_OFFHOST_RECOVERY_ACCEPTANCE',sha256,status:'BACKED_UP_AND_MIGRATED',at:new Date().toISOString()},null,2),{flag:'wx'});
 console.log(migrated.stdout.trim());console.log('Private pre-upgrade backup: '+folder);
}catch{console.error('Local upgrade failed; preserve the backup directory and inspect the migration state. No reset was performed.');process.exitCode=1;}
