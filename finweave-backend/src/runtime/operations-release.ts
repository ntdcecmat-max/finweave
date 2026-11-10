import { readFile,readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { sha,jcs } from './crypto.ts';
export async function compatibilityTuple(root:string) {
  const paths=['docs/contracts/v2-t1-r5/openapi.json','docs/agent/native-bridge-003.json','docs/data/target-t1-async/target-model.json',
    'finweave-backend/src/runtime/agent-provider.ts','finweave-backend/src/runtime/agent-selector.ts','finweave-backend/src/runtime/tool-gateway.ts',
    'finweave-backend/src/runtime/async-pipeline.ts','finweave-backend/src/runtime/config.ts','finweave-backend/pnpm-lock.yaml'];
  const tuple:Record<string,string>={};for(const p of paths)tuple[p]=sha(await readFile(resolve(root,p)));
  for(const name of await readdir(resolve(root,'finweave-backend/database/runtime')))if(/\.(sql|conf)$/.test(name))tuple['finweave-backend/database/runtime/'+name]=sha(await readFile(resolve(root,'finweave-backend/database/runtime',name)));
  return tuple;
}
export interface GateReceipt {id:string;status:string;sourceDigest:string;artifactDigest:string;finishedAt:string;scope:string;}
export function requireGates(receipts:GateReceipt[],required:string[],sourceDigest:string,artifactDigest:string,maxAgeMs=86400000) {
  if(!required.length||new Set(required).size!==required.length)throw Error('REQUIRED_GATE_SET_INVALID');
  for(const id of required) {
    const match=receipts.filter(r=>r.id===id);
    if(match.length!==1||match[0].status!=='PASS'||match[0].sourceDigest!==sourceDigest||match[0].artifactDigest!==artifactDigest||!Number.isFinite(Date.parse(match[0].finishedAt))||Date.now()-Date.parse(match[0].finishedAt)>maxAgeMs||Date.parse(match[0].finishedAt)>Date.now()+5000)throw Error('RELEASE_EVIDENCE_GATE_DENIED');
  }
}
export function rollbackCompatible(current:Record<string,string>,candidate:Record<string,string>) {
  // Deliberately fail closed on unknown tuple dimensions; code rollback only.
  if(jcs(current)!==jcs(candidate))throw Error('ROLLBACK_COMPATIBILITY_UNKNOWN_FORWARD_FIX_REQUIRED');return true;
}
export function realPromotion():never {throw Error('REAL_GATES_UNSATISFIED');}
