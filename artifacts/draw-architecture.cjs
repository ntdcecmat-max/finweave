const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('../finweave-web/node_modules/@playwright/test');
const out=path.join(__dirname,'finweave-architecture-verified-v1');
let s=[];const esc=x=>String(x).replaceAll('&','&amp;').replaceAll('<','&lt;');
const text=(x,y,v,size=24,color='#173451',weight=400,anchor='start')=>s.push(`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${esc(v)}</text>`);
function box(x,y,w,h,title,lines=[],color='#edf5fc',stroke='#91adc6',titleSize=27){s.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${color}" stroke="${stroke}" stroke-width="2"/>`);text(x+22,y+40,title,titleSize,'#173451',700);lines.forEach((v,i)=>text(x+22,y+77+i*31,v,22));}
function area(x,y,w,h,title,color='#eaf3fa'){s.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${color}" stroke="#7291ae" stroke-width="2" stroke-dasharray="9 6"/>`);text(x+20,y+37,title,24,'#173451',700);}
function arrow(d,c='#245d91',dash=false){s.push(`<path d="${d}" fill="none" stroke="white" stroke-width="10" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round" ${dash?'stroke-dasharray="9 6"':''} marker-end="url(#${c==='#7652a5'?'purple':'blue'})"/>`);}
s.push(`<svg xmlns="http://www.w3.org/2000/svg" width="2200" height="1780" viewBox="0 0 2200 1780"><defs><marker id="blue" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#245d91"/></marker><marker id="purple" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10" fill="#7652a5"/></marker></defs><rect width="2200" height="1780" fill="#fff"/><g font-family="Segoe UI,Arial,sans-serif">`);
text(55,65,'FINWEAVE — KIẾN TRÚC HỆ THỐNG',43,'#113352',750);
text(55,108,'Client–Server  •  Modular Monolith  •  Phân lớp trách nhiệm  •  Tách tiến trình và quyền',26);
text(55,147,'Đối chiếu mã nguồn local ngày 03/11/2026 · Sơ đồ thành phần và các kết nối chính',22,'#577087');
text(55,215,'ỨNG DỤNG CLIENT',25,'#173451',700);
text(520,215,'BACKEND: CÙNG CODEBASE TYPESCRIPT / FINANCIAL ENGINE',25,'#173451',700);
text(1700,215,'TÍCH HỢP LOCAL',25,'#173451',700);
box(55,275,330,150,'User Web',['React · TypeScript · Vite','5 nhóm màn hình chính']);
box(55,505,330,150,'Android App',['React WebView · Capacitor','Kotlin · Native bridge']);
box(55,890,330,150,'Admin Web',['React · Build riêng','API và phiên quản trị riêng'],'#f3effb','#aa95c7');
area(510,245,940,565,'TIẾN TRÌNH USER / DEVICE API — Node.js + Fastify');
box(540,300,880,94,'HTTP API · Contract / DTO · Identity / Authorization',[], '#fff','#91adc6',25);
box(540,430,880,210,'APPLICATION SERVICES / NHÓM NGHIỆP VỤ',[
 'Accounts · Ledger · Portfolio · Market',
 'Ingestion · CSV / Ảnh OCR · Review',
 'Planning & Goals · Read Models · Assistant'
], '#fff','#91adc6',25);
box(540,690,880,87,'Financial Engine: exact money · posting · planning · forecast',[],'#dff3f0','#6aa59f',25);
arrow('M385 340 H465 V345 H540');
arrow('M385 580 H445 V370 H540');
text(400,286,'HTTP',20);text(395,617,'HTTP',18);
arrow('M980 394 V430');arrow('M980 640 V690');
area(510,860,940,215,'TIẾN TRÌNH OPS API — Node.js + Fastify','#f5f0fb');
box(540,925,880,115,'Ops Identity + Ops services',[
 'Metadata · Safe preview / confirm · Audit · Control requests'
],'#fff','#aa95c7',26);
arrow('M385 965 H540','#7652a5');text(405,948,'HTTP',20,'#7652a5');
area(510,1135,940,270,'CÁC TIẾN TRÌNH WORKER — profile / credential riêng','#f5f0fb');
text(540,1210,'PostgreSQL dispatch: claim · lease · heartbeat · retry · complete',22);
const names=['Ingestion','Market','Forecast','Agent','Retention'];
const xs=[540,717,894,1071,1248];
names.forEach((n,i)=>box(xs[i],1250,160,108,n,[i===0?'Nhập dữ liệu':i===1?'Cập nhật giá':i===2?'Dự báo':i===3?'Tool / draft':'Dọn hết hạn'],'#fff','#aa95c7',24));
box(1700,265,445,125,'Local Mail Sink',['Nhận OTP / mail thử nghiệm']);
box(1700,445,445,150,'Windows OCR',['Ảnh → chữ → parser trường','Gọi từ luồng scanScreenshot']);
box(1700,1200,445,150,'Ollama / Qwen',['Model local cho Agent','Quyết định qua ToolGateway']);
arrow('M1420 345 H1700');text(1490,328,'Gửi mail sau commit',20);
arrow('M1420 510 H1700');text(1480,493,'Gọi OCR local',20);
arrow('M1151 1250 V1170 H1660 V1275 H1700','#7652a5');
text(1490,1150,'Agent gọi model',20,'#7652a5');
// DB connections use separate corridors. Crossings have a white halo; no junction dot means no join.
arrow('M1420 620 H1500 V1515');text(1518,805,'SQL / pg',21);text(1518,834,'UnitOfWork / Tx',21);
arrow('M1450 990 H1585 V1515','#7652a5');text(1603,1008,'Pool / role Ops riêng',21,'#7652a5');text(1603,1038,'Không có finance pool',21,'#7652a5');
xs.forEach(x=>arrow(`M${x+80} 1358 V1515`,'#7652a5'));
box(510,1515,1635,130,'POSTGRESQL — CÙNG RANH GIỚI NHẤT QUÁN DỮ LIỆU',[
 'Finance / Ledger · Business · Identity · Ops metadata · Durable Jobs / Dispatch',
 'Schema / role tách quyền · Workers truy cập theo nhiệm vụ · Không có database riêng cho mỗi domain'
],'#eaf3fa','#7291ae',28);
box(55,1160,330,245,'CÁCH ĐỌC',['Mũi tên: bên gọi → bên nhận','Đường SQL: truy cập dữ liệu','Giao cắt không có nút: tách biệt','Các ô nghiệp vụ là nhóm','trách nhiệm trong codebase'],'#f7f9fb','#bdccd8',25);
text(55,1480,'RANH GIỚI DỮ LIỆU',23,'#173451',700);
text(55,1688,'QUY TẮC: Ops chỉ nhận metadata / lệnh an toàn • Agent tạo draft, không tự ghi actual ledger • Nguồn nhập dùng ledger chung',24,'#173451',600);
text(55,1727,'Phạm vi local; nguồn tài chính thật và production chưa kích hoạt. Các hộp biểu diễn trách nhiệm, không khẳng định phân lớp tuyệt đối.',22,'#577087');
s.push('</g></svg>');fs.writeFileSync(out+'.svg',s.join('\n'));
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:2200,height:1780},deviceScaleFactor:1.5});await page.setContent(s.join('\n'));await page.screenshot({path:out+'.png',fullPage:true});await browser.close();console.log(out+'.png');})();


