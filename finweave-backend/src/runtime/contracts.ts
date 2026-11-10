import { readFileSync } from 'node:fs';
import { Ajv } from 'ajv';
import formats from 'ajv-formats';
import type { ValidateFunction } from 'ajv';
import { fail } from './errors.ts';
import { createHash } from 'node:crypto';
import { extendBusinessContract } from './business-contract.ts';
import { extendOpsContract } from './ops-contract.ts';
import { extendScreenshotContract } from './screenshot-contract.ts';
export const revision='FW-API-T1-D1J2-005';
const contractBytes=readFileSync(new URL('../../../docs/contracts/v2-t1-r5/openapi.json',import.meta.url));
if(createHash('sha256').update(contractBytes).digest('hex')!=='35ebbbabd8d6dbc6f19cc9a123c2c6c2df3e1d0a3046c16d795adc9ed8b81802')throw Error('API005_PIN_MISMATCH');
export const contract=extendScreenshotContract(extendOpsContract(extendBusinessContract(JSON.parse(contractBytes.toString()))));
const ajv=new Ajv({strict:false,allErrors:true,coerceTypes:false,removeAdditional:false,useDefaults:false});
(formats as unknown as (a: Ajv)=>void)(ajv);
ajv.addSchema({$id:'api005',components:contract.components});
const validators=new Map<string,ValidateFunction>();
export function validator(name: string) { let v=validators.get(name); if(!v) { v=ajv.compile({$ref:'api005#/components/schemas/'+name}); validators.set(name,v); } return v; }
export interface Envelope { contractVersion:'2.0.0'; requestId:string; operationId:string; workspaceId:string|null; input:Record<string,any>; mutation:{idempotencyKey:string;expectedWorkspaceVersion:number|null;expectedObjectVersions:Record<string,number>;previewToken:string|null}|null; }
export function parse(op: string, body: unknown): Envelope { if(!validator(op+'Request')(body)) fail('BAD_REQUEST'); return body as Envelope; }
export function reply(op: string, req: Envelope, data: unknown, version: number|null=null) {
  const value={contractVersion:'2.0.0',requestId:req.requestId,workspaceVersion:version,data};
  if(!validator(op+'Reply')(value)) throw Error('RESPONSE_CONTRACT:'+op+':'+JSON.stringify(validator(op+'Reply').errors));
  return value;
}
