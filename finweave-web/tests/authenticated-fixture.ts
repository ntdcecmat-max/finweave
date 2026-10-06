import {test as base,expect} from '@playwright/test';
// Existing business walkthroughs retain their steps and now declare the auth precondition.
export const test=base.extend({page:async({page},use)=>{await page.goto('/auth/login');await page.getByRole('button',{name:'Điền thông tin mẫu',exact:true}).click();await page.getByRole('button',{name:'Đăng nhập demo',exact:true}).click();await page.getByLabel('Mã xác thực demo').fill('123456');await page.getByRole('button',{name:'Xác nhận mã demo',exact:true}).click();await expect(page.locator('#main h1')).toBeVisible();await use(page);}});
export {expect};
