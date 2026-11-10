import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseScreenshot,parseVnd} from '../src/runtime/screenshot-parser.ts';
import {selectOcrText} from '../src/runtime/screenshot-ocr.ts';
import {accountCompatible} from '../src/runtime/screenshot-identity.ts';
const vcb=(amount='+10,000',ref='TKP#DEMO#020097048811031458022026s6gj932279')=>`Hôm nay • 14:58
Số dư TK VCB 1028529190 ${amount} VND lúc
03-11-2026 14:58:03. Số dư 10,000 VND. Ref
${ref}.79454.145802.NGUYEN VAN A
Chuyen tien`;
test('VCB multiline account movements are separate from ending balance',()=>{
 const rows=parseScreenshot(vcb()+'\n'+vcb('-30,000','MBVCB.16849802291.6307SYNTHETIC').replaceAll('14:58','14:32'));
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>[r.amount,r.kind,r.bankAccount,r.date,r.time,r.bank,r.warnings]),[
  ['10000','income','1028529190','2026-11-03','14:58:03','VCB',[]],['30000','expense','1028529190','2026-11-03','14:32:03','VCB',[]],
 ]);
 assert(rows[0].reference.startsWith('TKP#DEMO#'));assert(rows[0].description.includes('NGUYEN VAN A'));
});
const banks=['BIDV','Vietcombank','MBbank','Techcombank','VietinBank','ACB','VPBank','TPBank','Agribank','Sacombank','HDBank','VIB','SHB','MSB','OCB','SeABank','Eximbank','LPBank','Shinhan','HSBC','FutureBank'];
for(const bank of banks)test(bank+' uses shared fields without a bank-specific transaction template',()=>{
 const row=parseScreenshot(`Ngân hàng: ${bank}\nTài khoản nguồn: 1234567890\nGhi Có: 1.234.567 VND\nNgày giao dịch: 2026-11-03 09:10:11\nNội dung: Lương thử nghiệm\nMã tham chiếu: TX-TEST-100`)[0];
 assert.deepEqual([row.amount,row.kind,row.bankAccount,row.date,row.time,row.reference,row.warnings],['1234567','income','1234567890','2026-11-03','09:10:11','TX-TEST-100',[]]);
});
test('unsigned debit and credit words determine direction independently of bank name',()=>{
 for(const [label,kind] of [['Ghi Nợ','expense'],['Debited','expense'],['Credited','income'],['Tiền vào','income'],['Tiền ra','expense']]){
  const row=parseScreenshot(`Account: 1234567890\n${label}: 99,000 VND\n2026-11-03 12:00:00\nReference: REF-000099`)[0];assert.equal(row.kind,kind,label);assert.equal(row.amount,'99000',label);
 }
});
test('unseen or omitted bank name is not a reason to block a complete transaction',()=>{
 for(const bank of ['FutureBank','', 'Ngan hang: NganHangThuNghiem']){
  const row=parseScreenshot(`${bank}\nTK 1234567890 -25.000 ₫\n03/11/2026 11:22:33\nMa GD: TX-999888`)[0];assert.equal(row.warnings.length,0,JSON.stringify(row));assert.equal(row.amount,'25000');
 }
});
test('multiple notifications without greeting or bank brand are split by transaction fields',()=>{
 const one=(sign:string,ref:string)=>`TK 1234567890 ${sign}75,000 VND\n03/11/2026 10:00:01\nRef: ${ref}`;
 const rows=parseScreenshot(one('+','ABC-123')+'\n'+one('-','ABC-124'));assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.kind),['income','expense']);assert(rows.every(r=>!r.warnings.length));
});
test('VND formatting is exact and malformed numbers are never repaired by dropping digits',()=>{
 for(const text of ['1,234,567','1.234.567','1 234 567','1.234.567,00','1,234,567.00'])assert.equal(parseVnd(text),'1234567',text);
 for(const text of ['10.50','1,23,456','1.234,567','1e6','100 20','1000000000000000000'])assert.equal(parseVnd(text),null,text);
 assert.equal(parseVnd('9007199254740993'),'9007199254740993');
});
test('a signed ending balance is never treated as a transaction',()=>{const rows=parseScreenshot('TK 1234567890\nSố dư: -50,000 VND\n03/11/2026 10:00:00\nRef: TEST-001');assert.equal(rows[0].amount,'');});
test('masked source account is preserved and recipient bank does not become source bank',()=>{
 const row=parseScreenshot(vcb().replace('1028529190','******9190')+'\nNgan hang nguoi nhan: ACB')[0];assert.equal(row.bank,'VCB');assert.equal(row.bankAccount,'******9190');assert.equal(row.warnings.length,0);
});
test('masked-account notifications share an explicit date header and do not need a source reference',()=>{
 const row=(amount:string,time:string)=>`Thông báo biến động số dư\nTK 68xxx106|GD: ${amount}VND 29/10/26\n${time} |SD: 0VND|ND: Chuyen tien thu nghiem\n${time}`;
 const rows=parseScreenshot('29/10/2026\n'+row('-400,000','10:49')+'\n'+row('+400,000','10:48'));
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>[r.amount,r.kind,r.date,r.time,r.bankAccount,r.warnings]),[['400000','expense','2026-10-29','10:49','68xxx106',[]],['400000','income','2026-10-29','10:48','68xxx106',[]]]);
});
test('two-digit year without a matching explicit four-digit date stays unknown',()=>{const r=parseScreenshot('TK 68xxx106|GD: +400,000VND 29/10/26\n10:48 |SD: 0VND')[0];assert.equal(r.date,'');assert(r.warnings.length);});
test('two-digit year can be resolved only by a unique date inside the selected tracking window',()=>{const text='TK 68xxx106|GD: +400,000VND 29/10/26\n10:48 |SD: 0VND';assert.equal(parseScreenshot(text,{startDate:'2026-01-01',endDate:'2026-11-03'})[0].date,'2026-10-29');assert.equal(parseScreenshot(text,{startDate:'1926-01-01',endDate:'2026-11-03'})[0].date,'');});
test('date-card layout ignores phone status time and preserves transaction time',()=>{
 const row=(amount:string,time:string)=>`12/10/2026 • ${time}\nThời gian: 12/10/2026 ${time}\nTài khoản: 1234567890\nGiao dịch: ${amount} VND\nSố dư hiện tại: 0 VND\nNội dung: CT DI:12345 chuyen tien`;
 const rows=parseScreenshot('17:06\nThông báo\n12/10/2026\n'+row('-10,000','04:33')+'\n'+row('+10,000','04:32'));
 assert.equal(rows.length,2);assert.deepEqual(rows.map(r=>r.time),['04:33','04:32']);assert(rows.every(r=>!r.warnings.length));
});
test('OCR seam repairs do not silently auto-post uncertain numeric letters',()=>{
 const rows=parseScreenshot('29/10/2026\nThöng bdo bié\'n déng sö du\nTK 68xxx1061GD: -400,OOOVND 29/10/26\n10:49 ISD: OVND1ND: Chuyen tien');
 assert.equal(rows[0].amount,'400000');assert.equal(rows[0].bankAccount,'68xxx106');assert(rows[0].warnings.some(w=>w.includes('ký tự OCR')));
});
test('conflicting OCR variants require review; repeated identical text does not',()=>{
 assert(selectOcrText([vcb(),vcb('+20,000')]).warnings.length);assert.equal(selectOcrText([vcb(),vcb()]).warnings.length,0);
});
test('full and masked accounts match only compatible visible digits',()=>{assert(accountCompatible('1234567890','******7890'));assert(!accountCompatible('1234567890','******7891'));assert(!accountCompatible('1234567890','2234567890'));});
test('receipt without occurrence time stays date-only and never takes the phone status clock',()=>{const row=parseScreenshot('17:06\nBank: FutureBank\nAccount: 1234567890\nAmount: +35000 VND\n2026-11-03\nDescription: Salary')[0];assert.equal(row.time,'');assert.equal(row.warnings.length,0);});
test('two amount fields in one receipt require review rather than guessing or netting',()=>{
 const row=parseScreenshot('Bank: FutureBank\nAccount: 1234567890\nAmount: -20,000 VND\nAmount: -30,000 VND\n2026-11-03 12:00:00\nReference: ABC-123')[0];assert.equal(row.amount,'');assert(row.warnings.length);
});
