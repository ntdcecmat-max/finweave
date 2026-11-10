import {expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import type {OperationId,Input,Output} from '../src/contracts/operations';

export async function confirmAction(page: Page) {
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', {name:/^Xem (tác động|dự tính)$/}).click();
  const confirm = dialog.getByRole('button', {name:/^(Xác nhận|Lưu mục tiêu|Lưu kế hoạch|Lưu kịch bản)$/});
  await expect(confirm).toBeVisible();
  await confirm.click();
  await expect(dialog).toHaveCount(0);
}
export async function openFilters(page: Page) {
  const filter = page.locator('details.filter-card');
  if ((await filter.getAttribute('open')) === null) await filter.locator('summary').click();
  await expect(page.getByLabel('Tìm mô tả / reference')).toBeVisible();
}
export async function openSourceTools(page: Page, id='S-PRICE') {
  await page.getByRole('link',{name:'Nguồn dữ liệu',exact:true}).click();
  await page.locator(`a[href="/data/sources/${id}"]`).click();
  await page.getByText('Công cụ nguồn synthetic để kiểm chứng',{exact:true}).click();
}
export async function simulationForGoal(page: Page) {
  await page.getByRole('button',{name:'Thử kịch bản với tiền hiện có',exact:true}).click();
}
export async function logicalRead<K extends OperationId>(page:Page, operationId:K, input:Input<K>):Promise<Output<K>> {
  // A full navigation resolves before async MSW startup; wait for the actual app.
  await expect(page.locator('#main h1')).toBeVisible();
  return page.evaluate(async({operationId,input})=>{
    const session=JSON.parse(sessionStorage.getItem('fw:synthetic-session')!);
    const response=await fetch('/__mock/v1/logical/'+operationId,{method:'POST',headers:{'Content-Type':'application/json','X-FinWeave-Synthetic':'true','X-FinWeave-Mock-Session':session.sessionId},body:JSON.stringify({contractVersion:'1.1.0',requestId:crypto.randomUUID(),workspaceId:'W-DEMO',operationId,input,mutation:null})});
    if(!response.ok)throw new Error(await response.text());
    return (await response.json()).data;
  },{operationId,input});
}
