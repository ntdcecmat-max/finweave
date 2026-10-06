import { writeFileSync,mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { schemas,CONTRACT_VERSION,ErrorDTO } from '../src/contracts/schemas.ts';
import { operations,validateInput,validateOutput } from '../src/contracts/operations.ts';
import type { OperationId } from '../src/contracts/operations.ts';
import { allExamples } from '../src/contracts/examples.ts';
import { commonScenarios } from '../src/mocks/contract-fixtures.ts';
import {identityOperations,identityExamples,IdentityError} from '../src/contracts/identity.ts';
const out=resolve('../docs/contracts/v1');mkdirSync(out,{recursive:true});
const json=(name:string,value:unknown)=>writeFileSync(resolve(out,name),JSON.stringify(value,null,2)+'\n','utf8');
const convert=(schema:z.ZodType)=>z.toJSONSchema(schema,{target:'draft-2020-12',io:'input'});
const components:Record<string,unknown>={};for(const [name,schema] of Object.entries(schemas)) components[name]=convert(schema);
const paths:Record<string,unknown>={};
for(const [name,op] of Object.entries(operations)) {
 const id=name as OperationId;
 components[name+'Input']=convert(op.input);
 components[name+'Output']=convert(op.output);
 components[name+'Request']=convert(z.strictObject({contractVersion:z.literal(CONTRACT_VERSION),requestId:schemas.Id,workspaceId:schemas.Id,operationId:z.literal(name),input:op.input,mutation:op.kind==='mutation'?schemas.MutationOptions:z.null()}));
 components[name+'Reply']=convert(z.strictObject({contractVersion:z.literal(CONTRACT_VERSION),requestId:schemas.Id,workspaceVersion:schemas.Version,data:op.output}));
 const sample=allExamples().find(x=>x.operationId===id)!;validateInput(id,sample.input);validateOutput(id,sample.output);
 paths['/__mock/v1/logical/'+name]={post:{operationId:name,summary:`${op.kind}; synthetic mock only`,tags:[op.kind],security:[{SyntheticOwner:[]}],parameters:[{in:'header',name:'X-FinWeave-Synthetic',required:true,schema:{type:'string',const:'true'}}],requestBody:{required:true,content:{'application/json':{schema:{$ref:'#/components/schemas/'+name+'Request'},example:{contractVersion:CONTRACT_VERSION,requestId:'REQ-demo-01',workspaceId:'W-DEMO',operationId:name,input:sample.input,mutation:op.kind==='mutation'?{idempotencyKey:'KEY-demo-01',expectedWorkspaceVersion:10,expectedObjectVersions:{},previewToken:op.preview?'PT-01':null}:null}}}},responses:{[op.status]:{description:op.status===202?'Accepted, NOT completed':'Logical result',content:{'application/json':{schema:{$ref:'#/components/schemas/'+name+'Reply'},example:{contractVersion:CONTRACT_VERSION,requestId:'REQ-demo-01',workspaceVersion:10,data:sample.output}}}},...Object.fromEntries([401,403,404,409,422,429,503].map(status=>[status,{description:'Encrypted logical error in protected mode; synthetic plaintext only here',content:{'application/json':{schema:{$ref:'#/components/schemas/ErrorDTO'}}}}]))},'x-finweave-kind':op.kind,'x-finweave-preview-required':op.preview,'x-finweave-invalidation':op.impact,'x-real-transport':'BLOCKED; no plaintext real endpoint'}};
}
json('logical.openapi.json',{openapi:'3.1.1',jsonSchemaDialect:'https://json-schema.org/draft/2020-12/schema',info:{title:'FinWeave logical / SYNTHETIC MOCK ONLY',version:CONTRACT_VERSION,description:'Stateful logical handlers implemented by MSW for synthetic demo only. Protected real transport remains blocked.'},servers:[{url:'http://127.0.0.1:4181',description:'Step 5 local frontend build with stateful mock network.'}],paths,components:{schemas:components,securitySchemes:{SyntheticOwner:{type:'apiKey',in:'header',name:'X-FinWeave-Mock-Session',description:'Opaque synthetic session marker; never a real credential. Real authorization and privacy PoC unverified.'}}}});
json('schemas.json',{$schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:finweave:contracts:'+CONTRACT_VERSION,$defs:components});
json('examples.json',allExamples());
const authPaths:Record<string,unknown>={};
for(const [name,op]of Object.entries(identityOperations)){
 const sample=identityExamples[name as keyof typeof identityOperations];op.input.parse(sample.input);op.output.parse(sample.output);
 authPaths['/__mock/v1/identity/'+name]={post:{operationId:name,summary:'Synthetic identity contract; real identity bootstrap BLOCKED',requestBody:{required:true,content:{'application/json':{schema:convert(z.strictObject({contractVersion:z.literal(CONTRACT_VERSION),requestId:schemas.Id,idempotencyKey:schemas.Id,input:op.input})),example:{contractVersion:CONTRACT_VERSION,requestId:'ID-REQ-01',idempotencyKey:'ID-KEY-01',input:sample.input}}}},responses:{'200':{description:'Synthetic identity outcome only',content:{'application/json':{schema:convert(op.output),example:sample.output}}},...Object.fromEntries([401,409,422,429,503].map(status=>[status,{description:'Logical identity error; must be sealed in protected bootstrap',content:{'application/json':{schema:convert(IdentityError)}}}]))},'x-authorized-session-required':op.authorized,'x-real-transport':'BLOCKED; identity bootstrap, registration/recovery independent Ops unverified'}};
}
for(const [name,op]of Object.entries(identityOperations)){
 const post=(authPaths['/__mock/v1/identity/'+name] as any).post;
 post.parameters=[{in:'header',name:'X-FinWeave-Synthetic',required:true,schema:{type:'string',const:'true'}},...(op.authorized?[{in:'header',name:'X-FinWeave-Mock-Session',required:true,schema:{type:'string'},description:'Ephemeral synthetic session ID, never a real credential.'}]:[])];
}
json('identity.openapi.json',{openapi:'3.1.1',info:{title:'FinWeave identity logical / SYNTHETIC ONLY',version:CONTRACT_VERSION},servers:[{url:'http://127.0.0.1:4181',description:'Stateful synthetic mock, real identity bootstrap blocked.'}],paths:authPaths});
json('identity-examples.json',identityExamples);
json('identity-scenarios.json',Object.keys(identityOperations).map(operationId=>({operationId,scenarios:['success','validation','invalid_credential_or_challenge','expired_challenge_or_token','rate_limited','timeout','offline','unavailable','duplicate_idempotency'],level:'Network mock implemented with session ownership/idempotency; scenario list is a specification, actual executed cases are in Step 5 validation. Real identity remains blocked.'})));
json('mock-scenarios.json',Object.entries(operations).map(([operationId,op])=>({operationId,kind:op.kind,scenarios:commonScenarios,additional:operationId==='getImportJob'?['job_running','job_completed','job_failed']:operationId==='getAssistantMessage'?['ai_no_data','ai_tool_failed']:[],level:'Stateful mock handlers implemented in Step 5. Scenario list is not runtime coverage; executed cases and limits are in Step 5 validation.'})));
json('transport.openapi.json',{openapi:'3.1.1',info:{title:'FinWeave protected transport candidate / BLOCKED',version:'0.1.0',description:'Opaque shape only; algorithm/session/attestation/key-release protocol unselected. DO NOT USE for real data.'},paths:{'/transport/v1/exchange':{post:{operationId:'protectedExchangeCandidate',requestBody:{required:true,content:{'application/octet-stream':{schema:{$ref:'#/components/schemas/ProtectedEnvelope'}}}},responses:{'200':{description:'Sealed inner Reply or ErrorDTO; never plaintext financial response',content:{'application/octet-stream':{schema:{$ref:'#/components/schemas/ProtectedEnvelope'}}}}},'x-status':'BLOCKED_SECURITY_POC'}}},components:{schemas:{ProtectedEnvelope:convert(schemas.ProtectedEnvelope)}}});
console.log(JSON.stringify({version:CONTRACT_VERSION,businessOperations:Object.keys(operations).length,identityOperations:Object.keys(identityOperations).length,namedSchemas:Object.keys(schemas).length,generatedFiles:8}));
