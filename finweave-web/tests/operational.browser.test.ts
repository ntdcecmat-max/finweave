import {test,expect} from './authenticated-fixture';
import type {Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import {evidencePrefix} from './evidence-paths';
import {logicalRead,confirmAction} from './ui-workflow';
const evidence=path.resolve('../docs/execution/evidence/'+evidencePrefix+'-screenshots');
fs.mkdirSync(evidence,{recursive:true});
async function capture(page:Page,id:string){await page.screenshot({path:path.join(evidence,id+'.png'),fullPage:true});}
async function state(page:Page){return page.evaluate(async()=>{
 const session=JSON.parse(sessionStorage.getItem('fw:synthetic-session')!);
 const response=await fetch('/__mock/v2/operational',{method:'POST',headers:{'Content-Type':'application/json','X-FinWeave-Synthetic':'true','X-FinWeave-Mock-Session':session.sessionId},body:JSON.stringify({contractVersion:'2.0.0',requestId:crypto.randomUUID(),operation:'getState',input:{},idempotencyKey:null,expectedWorkspaceVersion:null})});
 if(!response.ok)throw Error(await response.text());return (await response.json()).data;
 });}
async function beginDraft(page:Page,route='/plan/goals'){
 await page.goto(route);await page.getByRole('button',{name:'Bắt đầu cùng trợ lý',exact:true}).first().click();
 const panel=page.getByRole('dialog');
 await expect(panel.getByText('Cần bạn xác nhận ràng buộc',{exact:true})).toBeVisible();
 await panel.getByLabel('Tên mục tiêu *',{exact:true}).fill('Quỹ kiểm chứng Agent');
 await panel.getByLabel('Số tiền cần đạt *',{exact:true}).fill('12000000');
 await panel.getByLabel('Dự kiến góp mỗi tháng *',{exact:true}).fill('1000000');
 await panel.getByLabel('Hạn hoàn thành *',{exact:true}).fill('2027-10-31');
 await panel.getByRole('button',{name:'Xác nhận ràng buộc & tạo bản nháp',exact:true}).click();
 await expect(panel.getByText('Bản nháp đã sẵn sàng',{exact:true})).toBeVisible();
 await panel.getByRole('button',{name:'Mở bản nháp / xem thay đổi',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'Bản nháp kế hoạch & mục tiêu',exact:true})).toBeVisible();
}

test('OP01 catalog selection, partial price job retains last-good and never moves cash or quantity',async({page})=>{
 await page.goto('/home/assets');const before=await logicalRead(page,'getPresentationSnapshot',{});
 await page.getByRole('button',{name:'Thêm tài sản',exact:true}).click();
 await page.getByLabel('Mã cổ phiếu').fill('FPT');
 const catalog=page.getByLabel('Chọn đúng mã và sàn giao dịch');
 await expect(catalog).toHaveValue('');
 await catalog.selectOption('VN_FPT');await page.locator('#asset-quantity').fill('100');
 await page.getByRole('button',{name:'Xem lại thông tin',exact:true}).click();
 await page.getByRole('button',{name:'Xác nhận thêm tài sản',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.locator('.op-price-panel').getByRole('button',{name:'Cập nhật giá',exact:true}).click();
 await expect(page.locator('.op-price-panel').getByText('Cập nhật một phần',{exact:true})).toBeVisible();
 await expect(page.locator('.op-price-panel').getByRole('button',{name:'Cập nhật giá',exact:true})).toBeDisabled();
 const after=await logicalRead(page,'getPresentationSnapshot',{}),op=await state(page);
 expect(after.data.events).toEqual(before.data.events);expect(after.data.accounts).toEqual(before.data.accounts);
 const added=after.data.holdings.find(h=>!before.data.holdings.some(old=>old.id===h.id));
 expect(added).toBeDefined();expect(added!.quantities.at(-1)?.quantity).toBe('100');expect(added!.quotes.at(-1)?.price).toBe('95000');
 for(const old of before.data.holdings){const current=after.data.holdings.find(h=>h.id===old.id)!;expect(current.quotes).toEqual(old.quotes);expect(current.quantities).toEqual(old.quantities);expect(current.quantity).toBe(old.quantity);}
 expect(op.priceJobs).toHaveLength(1);expect(op.priceJobs[0].results.some((r:any)=>r.state==='retained')).toBe(true);
 await page.locator('.holding-tile').filter({hasText:'FPT'}).click();await expect(page.getByRole('dialog')).toContainText('9.500.000 ₫');
 await capture(page,'OP01-price-partial');
});

test('OP02 Android browser walkthrough requires consent, explicit binding, Review receipt and revoke',async({page})=>{
 await page.goto('/data/android');const before=await logicalRead(page,'getPresentationSnapshot',{});
 await expect(page.getByRole('button',{name:'Bắt đầu bản minh họa'})).toBeDisabled();
 await page.getByLabel('Tôi hiểu dữ liệu được xử lý và muốn thiết lập nguồn do tôi chọn.').check();
 await expect(page.getByRole('button',{name:'Bắt đầu bản minh họa'})).toBeDisabled();
 await page.getByLabel('Trải nghiệm luồng bằng thiết bị và thông báo minh họa').check();
 await page.getByRole('button',{name:'Bắt đầu bản minh họa'}).click();
 await expect(page.getByRole('checkbox',{name:/Ngân hàng minh họa/})).not.toBeChecked();
 await expect(page.getByRole('checkbox',{name:/Ngân hàng \/ ví khác/})).toBeDisabled();
 await page.getByRole('checkbox',{name:/Ngân hàng minh họa/}).check();await page.getByRole('button',{name:'Gắn tài khoản',exact:true}).click();
 await expect(page.getByRole('button',{name:'Xác nhận gắn nguồn'})).toBeDisabled();
 await page.getByLabel('Ngân hàng minh họa',{exact:true}).selectOption('bank');
 await page.getByRole('button',{name:'Xác nhận gắn nguồn'}).click();
 await page.getByRole('button',{name:'Gửi thông báo kiểm tra minh họa'}).click();
 await expect(page.getByText('Đã gửi lên máy chủ · Chờ kiểm tra. Chưa tạo giao dịch.',{exact:true})).toBeVisible();
 const op=await state(page),after=await logicalRead(page,'getPresentationSnapshot',{});
 expect(op.bindings).toHaveLength(1);expect(op.bindings[0].accountId).toBe('bank');
 expect(op.receipts).toHaveLength(1);expect(op.receipts[0].state).toBe('needs_review');expect(op.receipts[0].eventId).toBeNull();
 expect(after.data.events).toEqual(before.data.events);expect(after.data.reviews.length).toBe(before.data.reviews.length+1);
 await page.getByRole('button',{name:'Xem trạng thái & hàng đợi'}).click();
 await expect(page.getByRole('button',{name:'Thử gửi lại các mục hợp lệ'})).toBeDisabled();
 await page.locator('a[href="/data/devices"]').first().click();
 await page.getByRole('button',{name:'Thu hồi kết nối',exact:true}).click();
 await page.getByLabel('Lý do thu hồi *').fill('Ngừng nguồn minh họa để kiểm chứng');
 await page.getByRole('dialog').getByRole('button',{name:'Xem tác động'}).click();
 await page.getByRole('button',{name:'Xác nhận thu hồi'}).click();
 await expect(page.getByText('Đã thu hồi',{exact:true})).toBeVisible();
 const revoked=await state(page);expect(revoked.bindings.every((b:any)=>!b.enabled)).toBe(true);
 expect(revoked.receipts).toEqual(op.receipts);await capture(page,'OP02-revoke-keeps-receipt');
});

for(const entry of ['goal','plan'])test(`OP03-${entry} Agent draft edits and compares before atomic owner confirmation`,async({page})=>{
 const before=await logicalRead(page,'getPresentationSnapshot',{});
 await beginDraft(page,entry==='goal'?'/plan/goals':'/plan');
 expect((await logicalRead(page,'getPresentationSnapshot',{})).data).toEqual(before.data);
 await page.getByRole('button',{name:'So với phương án giảm mức góp 20%',exact:true}).click();
 await expect(page.locator('.op-summary').filter({hasText:'Mức góp thay thế'})).toContainText('800.000 ₫');
 await page.getByText('Các khoản thu, chi, đầu tư liên kết · 0',{exact:true}).click();
 await page.getByRole('button',{name:'Thêm khoản hỗ trợ mới',exact:true}).click();
 await page.locator('#item-name-0').fill('Thu nhập hỗ trợ mục tiêu');await page.locator('#item-amount-0').fill('300000');
 await page.getByRole('button',{name:'Lưu chỉnh sửa & tính lại bản nháp'}).click();
 await expect(page.getByRole('button',{name:'Xem thay đổi trước khi áp dụng'})).toBeEnabled();
 await page.getByRole('button',{name:'Xem thay đổi trước khi áp dụng'}).click();
 await page.getByRole('button',{name:'Xác nhận áp dụng kế hoạch & mục tiêu'}).dblclick();
 await expect(page.getByRole('dialog')).toContainText('Đã áp dụng từ lần xác nhận trước');
 const after=await logicalRead(page,'getPresentationSnapshot',{}),op=await state(page);
 expect(after.data.goals.length).toBe(before.data.goals.length+1);expect(after.data.plans.length).toBe(before.data.plans.length+1);
 expect(after.data.planningLinks).toHaveLength(1);expect(after.data.events).toEqual(before.data.events);
 expect(op.drafts[0].confirmedIds).toHaveLength(2);expect(op.drafts[0].state).toBe('confirmed');
 await capture(page,'OP03-'+entry+'-atomic-draft');
});

test('OP04 changed financial snapshot disables draft confirmation until explicit recompute and preview',async({page})=>{
 await beginDraft(page);await page.getByRole('dialog').getByRole('button',{name:'Đóng',exact:true}).click();
 await page.getByRole('navigation',{name:'Điều hướng chính',exact:true}).getByRole('link',{name:/Giao dịch/}).click();
 await page.getByRole('button',{name:'Ghi giao dịch',exact:true}).click();
 await page.locator('#field-description').fill('Cập nhật nền sau bản nháp');await page.locator('#field-amount').fill('10000');await confirmAction(page);
 await page.getByRole('button',{name:'Mở trợ lý contextual',exact:true}).click();
 await page.getByRole('button',{name:'Mở bản nháp / xem thay đổi',exact:true}).click();
 await expect(page.getByRole('alert').filter({hasText:'Dữ liệu nền đã thay đổi'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Xem thay đổi trước khi áp dụng'})).toBeDisabled();
 await page.getByRole('button',{name:'Tính lại từ dữ liệu hiện tại'}).click();
 await expect(page.getByRole('button',{name:'Xem thay đổi trước khi áp dụng'})).toBeEnabled();
 expect((await logicalRead(page,'getPresentationSnapshot',{})).data.goals).toHaveLength(0);
 await capture(page,'OP04-stale-recomputed-unapplied');
});

test('OP05 cancelling an Agent run leaves no active Goal, Plan or automatic finance write',async({page})=>{
 await page.goto('/plan');const before=await logicalRead(page,'getPresentationSnapshot',{});
 await page.getByRole('button',{name:'Bắt đầu cùng trợ lý',exact:true}).click();
 await page.getByRole('button',{name:'Dừng yêu cầu',exact:true}).click();
 await expect(page.getByText('Đã dừng',{exact:true})).toBeVisible();
 expect((await logicalRead(page,'getPresentationSnapshot',{})).data).toEqual(before.data);
 expect((await state(page)).runs[0].state).toBe('cancelled');await capture(page,'OP05-cancel');
});

test('OP06 separate admin renders seven metadata views; safe retry and disable require preview and audit',async({page})=>{
 test.setTimeout(180000);await page.goto((process.env.FINWEAVE_ADMIN_URL||'http://127.0.0.1:4185')+'/admin/overview');
 await page.getByRole('button',{name:'Mở phiên quản trị minh họa'}).click();
 const findings=[];
 for(const width of [1440,390,360]){
  await page.setViewportSize({width,height:900});
  for(const [route,title] of [['overview','Tổng quan vận hành'],['accounts','Tài khoản & thiết bị'],['sources','Nguồn & bộ đọc'],['jobs','Tác vụ'],['quotas','Hạn mức'],['releases','Phiên bản Android'],['incidents','Sự cố & nhật ký']]){
   await page.getByRole('navigation').getByRole('link',{name:title,exact:true}).click();
   await expect(page.locator('#admin-main h1')).toHaveText(title);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' overflow '+width).toBe(true);
   await expect(page.locator('body')).not.toContainText('31.100.000');
   const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
   findings.push({width,route,violations:axe.violations});
   fs.writeFileSync(path.resolve('../docs/execution/evidence/'+evidencePrefix+'-admin-accessibility.json'),JSON.stringify(findings,null,2));
   expect(axe.violations.filter(v=>v.impact==='critical'||v.impact==='serious')).toEqual([]);
   await capture(page,`OP06-${route}-${width}`);
  }
 }
 await page.getByRole('navigation').getByRole('link',{name:'Tác vụ',exact:true}).click();
 await expect(page.getByRole('row').filter({hasText:'JOB_02'}).getByRole('button',{name:'Thử lại',exact:true})).toBeDisabled();
 await page.getByRole('row').filter({hasText:'JOB_01'}).getByRole('button',{name:'Thử lại',exact:true}).click();
 await expect(page.getByRole('dialog').getByRole('button',{name:'Xem tác động'})).toBeDisabled();
 await page.getByLabel('Lý do thao tác *').fill('Thử lại tác vụ lỗi sau kiểm tra nguồn');
 await page.getByRole('dialog').getByRole('button',{name:'Xem tác động'}).click();
 await page.getByRole('button',{name:'Xác nhận thao tác'}).dblclick();
 await expect(page.getByRole('row').filter({hasText:'JOB_01'})).toContainText('Đang chờ');
 await page.getByRole('navigation').getByRole('link',{name:'Nguồn & bộ đọc',exact:true}).click();
 await page.locator('article').filter({hasText:'OPS_PRICE'}).getByRole('button',{name:'Tắt nguồn có xác nhận'}).click();
 await page.getByLabel('Lý do thao tác *').fill('Tạm dừng nguồn minh họa');
 await page.getByRole('dialog').getByRole('button',{name:'Xem tác động'}).click();await page.getByRole('button',{name:'Xác nhận thao tác'}).click();
 await page.getByRole('navigation').getByRole('link',{name:'Sự cố & nhật ký',exact:true}).click();
 await expect(page.locator('.admin-record')).toHaveCount(2);
 await expect(page.locator('.admin-record').filter({hasText:'JOB_01'})).toHaveCount(1);
 await capture(page,'OP06-audit-two-confirmed-actions');
});

test('OP07 browser makes native and APK unavailability explicit while retaining manual fallback',async({page})=>{
 await page.goto('/data/android');await expect(page.getByText(/Bạn đang xem giao diện web/)).toBeVisible();
 await expect(page.getByRole('button',{name:'Mở cài đặt quyền Android'})).toHaveCount(0);
 await page.getByRole('link',{name:'Để sau, sử dụng nhập tay hoặc CSV'}).click();await expect(page).toHaveURL(/\/data$/);
 await expect(page.getByRole('button',{name:'Preview CSV',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Thiết bị & đồng bộ',exact:true}).first().click();
 await expect(page.getByText(/Chưa có APK đã ký được công bố/)).toBeVisible();await expect(page.locator('a[href$=".apk"]')).toHaveCount(0);
 await capture(page,'OP07-native-not-claimed');
});
