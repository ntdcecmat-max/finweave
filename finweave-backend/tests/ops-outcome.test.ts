import assert from 'node:assert/strict';
import { test } from 'node:test';
import { unitOfWork } from '../src/runtime/uow.ts';
import { ApiError } from '../src/runtime/errors.ts';

test('lost COMMIT acknowledgement reports unknown and does not rerun a command',async()=>{
 let calls=0,released=false;const client:any={on(){},removeListener(){},release(broken:boolean){released=broken;},async query(sql:string){if(sql==='COMMIT')throw Object.assign(Error('socket closed'),{code:'ECONNRESET'});return {rows:[]};}};
 await assert.rejects(unitOfWork({async connect(){return client;}} as any,async()=>{calls++;return {committed:true};}),e=>e instanceof ApiError&&e.code==='OUTCOME_UNKNOWN'&&e.outcome==='unknown');
 assert.equal(calls,1);assert.equal(released,true);
});
test('response validation failure before COMMIT rolls back without unknown outcome',async()=>{
 const queries:string[]=[];const client:any={on(){},removeListener(){},release(){},async query(sql:string){queries.push(sql);return {rows:[]};}};
 await assert.rejects(unitOfWork({async connect(){return client;}} as any,async()=>{throw Error('RESPONSE_CONTRACT');}),/RESPONSE_CONTRACT/);
 assert(queries.includes('ROLLBACK'));assert(!queries.includes('COMMIT'));
});
