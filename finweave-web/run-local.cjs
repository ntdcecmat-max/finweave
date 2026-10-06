// Static local runner for the current synthetic build (Step 5 frontend with stateful network mock). No dependency install is needed to view dist/.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const dist=path.resolve(__dirname,'dist'),port=Number(process.argv[2]||4181);
if(!fs.existsSync(path.join(dist,'index.html')))throw Error('Thiếu dist/. Chạy npm ci và npm run build trong finweave-web trước.');
if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Cổng local phải từ1024 đến65535.');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
const server=http.createServer((req,res)=>{let relative;try{relative=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\/+/, '');}catch{res.writeHead(400);res.end();return;}let file=path.resolve(dist,relative||'index.html');if(file!==dist&&!file.startsWith(dist+path.sep)){res.writeHead(403);res.end();return;}if(!fs.existsSync(file)||fs.statSync(file).isDirectory()){if(!path.extname(relative))file=path.join(dist,'index.html');else{res.writeHead(404);res.end();return;}}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});
server.on('error',e=>{console.error(e.code==='EADDRINUSE'?`Cổng${port} đang dùng. Mở http://127.0.0.1:${port}/home hoặc chạy với cổng khác.`:e.message);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>console.log(`FinWeave local synthetic · http://127.0.0.1:${port}/auth/login · /design · Ctrl+C để dừng. Dữ liệu giả, reload reset.`));
