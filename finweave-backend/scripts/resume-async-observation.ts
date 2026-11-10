import { readFile } from 'node:fs/promises';
import { resolve,relative,isAbsolute } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pg_ctl } from '@embedded-postgres/windows-x64';
const state=JSON.parse(await readFile(resolve('.local/async-observation-state.json'),'utf8'));
const root=resolve('.local'),target=resolve(state.cluster),relation=relative(root,target),url=new URL(state.adminUrl);
if(relation.startsWith('..')||isAbsolute(relation)||url.hostname!=='127.0.0.1'||!Number.isInteger(Number(url.port)))throw Error('OBSERVATION_TARGET_INVALID');
const exec=promisify(execFile);
try {await exec(pg_ctl,['-D',target,'status'],{windowsHide:true,timeout:5000});console.log('Observation PostgreSQL already running; counters/start preserved.');}
catch(e) {if((e as any).code!==3)throw e;await exec(pg_ctl,['-D',target,'-l',resolve(state.dir,'postgres.log'),'-w','start','-o',`-h 127.0.0.1 -p ${Number(url.port)} -c timezone=UTC -c max_connections=30`],{windowsHide:true,timeout:30000});console.log('Observation PostgreSQL resumed; original state/counters/start preserved.');}
