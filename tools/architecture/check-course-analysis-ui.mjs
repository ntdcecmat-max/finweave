import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {chromium}=require('C:/Users/ntdce/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=resolve('docs/course-analysis-2026-10-28');
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const checks=[];function ok(value,label){if(!value)throw Error(label);checks.push(label);}
try{
 await page.goto(pathToFileURL(resolve(root,'report.html')).href);
 await page.locator('main img').first().waitFor();
 ok(await page.locator('details.case').count()===50,'50 UC cards rendered');
 ok(await page.locator('main img').count()===11,'11 embedded diagrams rendered');
 const imageState=await page.locator('main img').evaluateAll(imgs=>imgs.every(i=>i.complete&&i.naturalWidth>0));ok(imageState,'All embedded images decoded');
 await page.screenshot({path:resolve(root,'report-preview.png')});
 await page.locator('#q').fill('UC-DRAFT-APPLY-01');
 ok(await page.locator('details.case:visible').count()===1,'Search by UC ID isolates one case');
 await page.locator('#expand').click();
 ok(await page.locator('#UC-DRAFT-APPLY-01').getAttribute('open')!==null,'Expand selected case');
 ok((await page.locator('#UC-DRAFT-APPLY-01').innerText()).includes('Hậu điều kiện thành công'),'Expanded case contains postconditions');
 await page.locator('#q').fill('');await page.locator('#group').selectOption('6');
 ok(await page.locator('details.case:visible').count()===5,'Group filter finds 5 Assistant cases');
 await page.locator('#group').selectOption('all');await page.locator('#q').fill('dong bo');
 ok(await page.locator('details.case:visible').count()>=2,'Vietnamese search works without accents');
 await page.locator('#q').fill('');await page.locator('#collapse').click();
 await page.locator('main img').first().click();ok(await page.locator('#zoom').evaluate(d=>d.open),'Diagram opens in zoom dialog');await page.locator('#closeZoom').click();
 await page.setViewportSize({width:390,height:844});await page.goto(pathToFileURL(resolve(root,'report.html')).href);
 await page.screenshot({path:resolve(root,'report-mobile-preview.png')});
 const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,items:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1).slice(0,12).map(e=>({tag:e.tagName,id:e.id,class:e.className,right:e.getBoundingClientRect().right}))}));
 if(overflow.scroll>overflow.width+1)console.log(JSON.stringify(overflow));
 ok(overflow.scroll<=overflow.width+1,'Mobile layout has no page-level horizontal overflow');
 ok(errors.length===0,'No JavaScript errors');
 await writeFile(resolve(root,'ui-validation.json'),JSON.stringify({date:'2026-10-28',checks,errors},null,2));
 console.log(JSON.stringify({checks,errors}));
}finally{await browser.close();}
