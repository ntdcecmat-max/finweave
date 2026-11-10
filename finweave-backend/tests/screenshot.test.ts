import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseScreenshot} from '../src/runtime/screenshot-parser.ts';
import {decodeScreenshot} from '../src/runtime/screenshot-ocr.ts';
export const notice=(amount='-10,000',ref='SYNTHETIC-001',extra='')=>`BIDV xin thong bao toi Quy khach
Thoi gian giao dich: 14:58 03/11/2026
Tai khoan thanh toan:
1234567890
So tien GD: ${amount} VND
So du cuoi: 900,000 VND
Noi dung giao dich: Thanh toan thu nghiem ${extra}
Ma giao dich: ${ref}`;
test('two BIDV notices produce separate signed transactions; balances are ignored',()=>{
 const rows=parseScreenshot(notice()+'\n'+notice('+10,000','SYNTHETIC-002').replace('14:58','14:56'));
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>[r.kind,r.amount,r.date,r.time,r.warnings]),[['expense','10000','2026-11-03','14:58',[]],['income','10000','2026-11-03','14:56',[]]]);
});
test('English OCR accent variants and CD/GD confusion match the provided layout',()=>{
 const row=parseScreenshot(notice().replace('So tien GD','Sötién CD').replace('Tai khoan','Tåi khoån').replace('Ma giao dich','Mä giao dich'))[0];
 assert.equal(row.amount,'10000');assert.equal(row.bankAccount,'1234567890');assert.equal(row.warnings.length,0);
});
test('ending balance alone never becomes a transaction amount',()=>{const row=parseScreenshot(notice().replace('So tien GD: -10,000 VND',''))[0];assert.equal(row.amount,'');assert(row.warnings.length);});
test('unsigned, ambiguous and decimal amounts require review',()=>{for(const amount of ['10,000','10.50','1e6','0','-0'])assert(parseScreenshot(notice(amount))[0].warnings.length);});
test('invalid and multiple dates are not silently defaulted',()=>{assert.equal(parseScreenshot(notice().replace('03/11/2026','31/02/2026'))[0].date,'');assert.equal(parseScreenshot(notice()+'\n04/11/2026')[0].date,'');});
test('failed/pending/refund/internal-transfer evidence cannot auto-post',()=>{for(const extra of ['that bai','dang xu ly','hoan tien','chuyen noi bo'])assert(parseScreenshot(notice('-10,000','SYNTHETIC-001',extra))[0].warnings.length);});
test('foreign/missing currency and ambiguous amounts require review; unknown bank names do not',()=>{assert(parseScreenshot(notice().replace(/VND/g,'USD'))[0].warnings.length);assert(parseScreenshot(notice().replace(/ VND/g,''))[0].warnings.length);assert(parseScreenshot(notice()+'\nSo tien GD: -20,000 VND')[0].warnings.length);assert.equal(parseScreenshot(notice().replace('BIDV xin thong bao toi Quy khach','Receipt'))[0].warnings.length,0);});
test('only bounded JPEG/PNG bytes are accepted',()=>{for(const value of ['a'.repeat(50),'!!!!',Buffer.alloc(170*1024).toString('base64')])assert.throws(()=>decodeScreenshot(value,'image/png'));});
