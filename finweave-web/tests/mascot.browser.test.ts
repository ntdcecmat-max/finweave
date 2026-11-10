import {evidencePrefix} from './evidence-paths';
import fs from 'node:fs';
const petEvidence=`../docs/execution/evidence/${evidencePrefix}-screenshots`;fs.mkdirSync(petEvidence,{recursive:true});
import {test,expect} from './authenticated-fixture';
import AxeBuilder from '@axe-core/playwright';
import {injectFault} from './fault-harness';

test('PET-01 idle video has a transparent backdrop; hover celebrates once and click greets in chat',async({page})=>{
 const pet=page.locator('.floating-pet'),visual=pet.locator('.mascot-visual');
 await expect(visual).toHaveAttribute('data-mascot-state','idle');
 await expect(visual).toHaveAttribute('data-video-ready','true');
 const alpha=await pet.locator('canvas').evaluate(canvas=>{const context=(canvas as HTMLCanvasElement).getContext('2d')!;return {edge:context.getImageData(0,0,1,1).data[3],center:context.getImageData(96,96,1,1).data[3]};});
 expect(alpha.edge).toBe(0);expect(alpha.center).toBeGreaterThan(0);
 await page.getByRole('button',{name:'Trò chuyện với Thần tài',exact:true}).hover();
 await expect(visual).toHaveAttribute('data-mascot-state','celebrate');
 await expect(visual).toHaveAttribute('data-mascot-state','idle',{timeout:10000});
 await page.waitForTimeout(400);await expect(visual).toHaveAttribute('data-mascot-state','idle');
 await page.getByRole('button',{name:'Trò chuyện với Thần tài',exact:true}).click();
 await expect(pet).toHaveCount(0);
 await expect(page.locator('.chat-mascot .mascot-visual')).toHaveAttribute('data-mascot-state','wave');
 await expect(page.locator('.chat-mascot .mascot-visual')).toHaveAttribute('data-mascot-state','idle',{timeout:7000});
 await page.screenshot({path:petEvidence+'/mascot-test-chat.png'});
});

test('PET-02 thinking follows the request, success celebrates, cancelled and failed requests return to idle',async({page})=>{
 await page.getByRole('button',{name:'Mở trợ lý contextual',exact:true}).click();
 const visual=page.locator('.chat-mascot .mascot-visual');
 await injectFault(page,'sendAssistantMessage','delay',500,'SERVICE_UNAVAILABLE',1400);
 await page.getByLabel('Câu hỏi cho trợ lý').fill('Tiền đang ở đâu?');
 await page.getByRole('button',{name:'Gửi câu hỏi',exact:true}).click();
 await expect(visual).toHaveAttribute('data-mascot-state','thinking');
 await expect(visual).toHaveAttribute('data-video-ready','true');
 await page.screenshot({path:petEvidence+'/mascot-test-thinking.png'});
 await expect(page.locator('.ai-metrics')).toBeVisible();
 await expect(visual).toHaveAttribute('data-mascot-state','celebrate');
 await expect(visual).toHaveAttribute('data-mascot-state','idle',{timeout:10000});
 await injectFault(page,'createConversation','delay',500,'SERVICE_UNAVAILABLE',1600);
 await page.getByRole('button',{name:'Hội thoại mới',exact:true}).click();
 await page.getByLabel('Câu hỏi cho trợ lý').fill('Hủy câu hỏi đang chờ');
 await page.getByRole('button',{name:'Gửi câu hỏi',exact:true}).click();
 await expect(visual).toHaveAttribute('data-mascot-state','thinking');
 await page.getByRole('button',{name:'Hủy phản hồi đang chờ',exact:true}).click();
 await expect(visual).toHaveAttribute('data-mascot-state','idle');
 await injectFault(page,'sendAssistantMessage','status');
 await page.getByLabel('Câu hỏi cho trợ lý').fill('Nhóm chi nào lớn nhất?');
 await page.getByRole('button',{name:'Gửi câu hỏi',exact:true}).click();
 await expect(page.getByRole('alert')).toBeVisible();
 await expect(visual).toHaveAttribute('data-mascot-state','idle');
});

test('PET-03 drag and keyboard movement stay on screen, minimise and motion preferences survive reload',async({page})=>{
 const character=page.getByRole('button',{name:'Trò chuyện với Thần tài',exact:true}),pet=page.locator('.floating-pet');
 const before=(await character.boundingBox())!;
 await page.mouse.move(before.x+before.width/2,before.y+before.height/2);await page.mouse.down();await page.mouse.move(before.x-180,before.y-100,{steps:8});await page.mouse.up();
 await expect(page.getByRole('dialog')).toHaveCount(0);
 const after=(await character.boundingBox())!;expect(after.x).toBeLessThan(before.x-100);
 await character.focus();await page.keyboard.press('ArrowLeft');
 expect((await character.boundingBox())!.x).toBeLessThan(after.x);
 await page.getByRole('button',{name:'Tùy chọn linh vật',exact:true}).click();
 await page.getByRole('button',{name:'Tạm dừng chuyển động',exact:true}).click();
 await expect(pet.locator('.mascot-visual')).toHaveAttribute('data-animated','false');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Thu gọn linh vật',exact:true}).click();
 await expect(page.getByRole('button',{name:'Hiện linh vật Thần tài',exact:true})).toBeVisible();
 await page.reload();await page.getByRole('button',{name:'Hiện linh vật Thần tài',exact:true}).click();
 await expect(pet.locator('.mascot-visual')).toHaveAttribute('data-animated','false');
 await page.setViewportSize({width:360,height:844});
 const rect=(await pet.boundingBox())!;expect(rect.x).toBeGreaterThanOrEqual(0);expect(rect.x+rect.width).toBeLessThanOrEqual(360);expect(rect.y).toBeGreaterThanOrEqual(0);expect(rect.y+rect.height).toBeLessThanOrEqual(844-72);
 await page.screenshot({path:petEvidence+'/mascot-test-mobile.png'});
 expect((await new AxeBuilder({page}).include('.floating-pet').analyze()).violations).toEqual([]);
});

test('PET-04 reduced motion uses the supplied PNG, pet stays clear of dialogs and logout',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});
 await expect(page.locator('.pet-character .mascot-visual')).toHaveAttribute('data-animated','false');
 await expect(page.locator('.pet-character img')).toHaveAttribute('src','/mascot/mascot_idle.png');
 await page.getByRole('button',{name:'Ghi giao dịch',exact:true}).click();
 await expect(page.locator('.floating-pet')).toHaveCount(0);
 await page.getByRole('button',{name:'Đóng',exact:true}).click();
 await expect(page.locator('.floating-pet')).toBeVisible();
 await page.getByRole('button',{name:'Thiết lập và demo',exact:true}).click();
 await page.getByRole('button',{name:'Đăng xuất demo',exact:true}).click();
 await expect(page.locator('.floating-pet')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Đăng nhập FinWeave',exact:true})).toBeVisible();
});
