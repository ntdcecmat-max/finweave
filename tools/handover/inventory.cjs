// Parse source without importing runtime modules or running any audit/build script.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),req=createRequire(path.join(root,'finweave-web/package.json')),ts=req('typescript');
const out=process.env.FW_HANDOVER_EVIDENCE;
if(!out||!/^docs\/execution\/evidence\/FW-HANDOVER-\d{8}-r\d+$/.test(out))throw Error('Versioned evidence directory required');
if(fs.existsSync(path.join(root,'docs/governance/baselines',path.basename(out),'manifest.json')))throw Error('Revision sealed; start a new revision');
const observed=JSON.parse(fs.readFileSync(path.join(root,out,'observed-contracts.json'),'utf8'));
const names=new Set([...Object.keys(observed.v1),...Object.keys(observed.identity),...Object.keys(observed.v2)]),rows=[];
function scan(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
 const file=path.join(dir,entry.name);if(entry.isDirectory()){scan(file);continue;}if(!/\.tsx?$/.test(file))continue;
 const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true),relative=path.relative(root,file).replaceAll('\\','/');
 function add(node,kind,symbol,operation){rows.push({file:relative,line:source.getLineAndCharacterOfPosition(node.getStart(source)).line+1,kind,symbol,operation:operation||null,runtimeExecuted:false});}
 function visit(node){
  if(ts.isCallExpression(node)){
   const expr=node.expression,text=expr.getText(source),first=node.arguments[0];
   if(ts.isPropertyAccessExpression(expr)&&['services','identityServices','adminGateway'].includes(expr.expression.getText(source)))add(node,'literal_call',text,expr.name.text);
   else if(ts.isElementAccessExpression(expr)&&expr.expression.getText(source)==='services')add(node,'dynamic_dispatch',text,null);
   else if(['operational','nativeCollector'].includes(text))add(node,first&&ts.isStringLiteral(first)?'literal_call':'dynamic_dispatch',text,first&&ts.isStringLiteral(first)?first.text:null);
   else if(['bindServices','commandOperation','collectorStatus','simulatePlanningDraft','syntheticControl'].includes(text))add(node,'adapter_or_local_call',text,null);
   else if(ts.isPropertyAccessExpression(expr)&&expr.expression.getText(source)==='b'&&relative.endsWith('/native/collector.ts'))add(node,'native_bridge_call',text,expr.name.text);
  }
  if(ts.isStringLiteral(node)&&names.has(node.text))add(node,'operation_reference',node.parent.getText(source).slice(0,160),node.text);
  ts.forEachChild(node,visit);
 }visit(source);
}}
scan(path.join(root,'finweave-web/src'));scan(path.join(root,'finweave-web/admin'));
const lock=fs.readFileSync(path.join(root,'finweave-web/package-lock.json'));
const runtime={node:process.version,typescript:ts.version,zod:JSON.parse(fs.readFileSync(path.join(root,'finweave-web/node_modules/zod/package.json'),'utf8')).version,lockSHA256:require('node:crypto').createHash('sha256').update(lock).digest('hex')};
fs.writeFileSync(path.join(root,out,'consumer-ast.json'),JSON.stringify({parser:'installed TypeScript AST',runtime,scope:'static declarations/references and calls; dynamic dispatch explicitly retained; no runtime execution',rows},null,2)+'\n');
console.log(JSON.stringify({astEntries:rows.length,dynamic:rows.filter(r=>r.kind==='dynamic_dispatch').length}));
