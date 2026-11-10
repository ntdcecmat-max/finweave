import test from 'node:test';
import assert from 'node:assert/strict';
import { posting,quantity,replayQuantity } from '../src/engine/posting.ts';
test('gold conversion is exact at the eight-decimal boundary and rejects share units',()=>{
 assert.equal(quantity('0.00000001','luong','gold'),'0.0000001');
 assert.equal(quantity('9007199254740993.00000001','chi','gold'),'9007199254740993.00000001');
 assert.throws(()=>quantity('1','share','gold'));
 assert.throws(()=>quantity('1','chi','stock'));
 assert.throws(()=>quantity('0.000000001','chi','gold'));
});
test('posting preserves exact magnitude and transfer amount independent of fee',()=>{
 const p=posting({kind:'transfer',accountId:'a',toAccountId:'b',amount:{value:'999999999999999999'},fee:{value:'99'},oneLeg:false});
 assert.deepEqual(p,[{ledger:'asset:a',amount:'-999999999999999999'},{ledger:'asset:b',amount:'999999999999999999'}]);
 assert.throws(()=>posting({kind:'transfer',accountId:'a',toAccountId:'a',amount:{value:'1'},oneLeg:false}));
});
test('ordered set/delta replay preserves exact history and bounds',()=>{
 assert.equal(replayQuantity([{mode:'set',quantity:'9007199254740993.00000001'},{mode:'delta',quantity:'0.00000001'},{mode:'set',quantity:'3.01'},{mode:'delta',quantity:'0.02'}]),'3.03');
 assert.throws(()=>replayQuantity([{mode:'set',quantity:'99999999999999999999.99999999'},{mode:'delta',quantity:'0.00000001'}]));
});
