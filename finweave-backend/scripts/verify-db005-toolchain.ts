import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {postgres,initdb,pg_ctl} from '@embedded-postgres/windows-x64';
import {root,sha256} from '../src/pins.ts';
const baseline=JSON.parse(await readFile(resolve(root,'finweave-backend/database/db005-toolchain.json'),'utf8'));
const lockHash=sha256(await readFile(resolve(root,'finweave-backend/pnpm-lock.yaml')));
const expected=lockHash===baseline.lockSha256?baseline:JSON.parse(await readFile(resolve(root,'finweave-backend/database/runtime/toolchain.json'),'utf8'));
if(expected!==baseline&&expected.baseLockSha256!==baseline.lockSha256)throw new Error('RUNTIME_TOOLCHAIN_BASE_MISMATCH');
if(expected!==baseline)for(const [path,hash] of Object.entries(expected.runtimeMigrations as Record<string,string>))if(sha256(await readFile(resolve(root,'finweave-backend',path)))!==hash)throw new Error('RUNTIME_SQL_PIN_MISMATCH:'+path);
if(process.platform!=='win32'||process.arch!=='x64'||process.version!==expected.node)throw new Error('PINNED_WINDOWS_X64_NODE_REQUIRED');
const pkg=JSON.parse(await readFile(resolve(root,'finweave-backend/package.json'),'utf8'));
for(const [name,version] of Object.entries({...pkg.dependencies,...pkg.devDependencies})){
 if(expected!==baseline&&expected.dependencies[name]!==version)throw new Error(`RUNTIME_DEPENDENCY_PIN_MISMATCH:${name}`);
 const installed=JSON.parse(await readFile(resolve(root,'finweave-backend/node_modules',name,'package.json'),'utf8'));
 if(installed.version!==version)throw new Error(`DEPENDENCY_VERSION_MISMATCH:${name}`);
}
for(const [name,path] of Object.entries({node:process.execPath,postgres,initdb,pg_ctl}))if(sha256(await readFile(path))!==expected.executables[name])throw new Error(`EXECUTABLE_HASH_MISMATCH:${name}`);
if(sha256(await readFile(resolve(root,'finweave-backend/pnpm-lock.yaml')))!==expected.lockSha256)throw new Error('LOCKFILE_HASH_MISMATCH');
const server=execFileSync(postgres,['--version'],{windowsHide:true,encoding:'utf8'}).trim();
if(server!=='postgres (PostgreSQL) 16.14')throw new Error('POSTGRES_BINARY_VERSION_MISMATCH');
console.log(JSON.stringify({status:'PASS',node:process.version,postgres:server,lockSha256:expected.lockSha256}));
