// Transpile observations into work/, read contracts and AST only. No frontend writes.
const fs=require('node:fs'),path=require('node:path'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),req=createRequire(path.join(root,'finweave-web/package.json')),ts=req('typescript');
const {pathToFileURL}=require('node:url'),cache=path.join(root,'work/arch05-observer'),seen=new Map();
function compile(source){
 source=path.resolve(source);if(seen.has(source))return seen.get(source);
 const target=path.join(cache,path.relative(root,source)).replace(/\.tsx?$/,'.mjs');seen.set(source,target);
 const code=ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const parsed=ts.createSourceFile('module.js',code,ts.ScriptTarget.Latest,true),edits=[];
 for(const item of parsed.statements){
  if(!(ts.isImportDeclaration(item)||ts.isExportDeclaration(item))||!item.moduleSpecifier)continue;
  const spec=item.moduleSpecifier,name=spec.text;if(name.startsWith('node:'))continue;
  let resolved;
  if(name.startsWith('.')){
   const base=path.resolve(path.dirname(source),name);
   resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
   if(!resolved)throw Error('Unresolved '+base);
   if(/\.tsx?$/.test(resolved))resolved=compile(resolved);
  }else resolved=req.resolve(name);
  edits.push({start:spec.getStart(parsed),end:spec.end,text:JSON.stringify(pathToFileURL(resolved).href)});
 }
 let result=code;
 for(const e of edits.sort((a,b)=>b.start-a.start))result=result.slice(0,e.start)+e.text+result.slice(e.end);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,result);return target;
}
async function main(){
 const out=path.join(root,'docs/execution/evidence/arch-05-t1-2026-10-08');
 fs.mkdirSync(out,{recursive:true});
 await import(pathToFileURL(compile(path.join(__dirname,'observe_arch05.ts'))).href);
 const observed=JSON.parse(fs.readFileSync(path.join(out,'observed-contracts.json'),'utf8'));
 const names=new Set([...Object.keys(observed.v1),...Object.keys(observed.identity),...Object.keys(observed.v2)]),rows=[];
 function scan(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const file=path.join(dir,e.name);if(e.isDirectory()){scan(file);continue;}if(!/\.tsx?$/.test(file))continue;
  const src=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true),relative=path.relative(root,file).replaceAll('\\','/');
  function add(node,kind,symbol,operation){rows.push({file:relative,line:src.getLineAndCharacterOfPosition(node.getStart(src)).line+1,kind,symbol,operation:operation||null,runtimeExecuted:false});}
  function visit(node){
   if(ts.isCallExpression(node)){
    const expr=node.expression,text=expr.getText(src),first=node.arguments[0];
    if(ts.isPropertyAccessExpression(expr)&&['services','identityServices','adminGateway'].includes(expr.expression.getText(src)))add(node,'literal_call',text,expr.name.text);
    else if(ts.isElementAccessExpression(expr)&&expr.expression.getText(src)==='services')add(node,'dynamic_dispatch',text,null);
    else if(['operational','nativeCollector'].includes(text))add(node,first&&ts.isStringLiteral(first)?'literal_call':'dynamic_dispatch',text,first&&ts.isStringLiteral(first)?first.text:null);
    else if(['bindServices','commandOperation','collectorStatus','simulatePlanningDraft','syntheticControl'].includes(text))add(node,'adapter_or_local_call',text,null);
    else if(ts.isPropertyAccessExpression(expr)&&expr.expression.getText(src)==='b'&&relative.endsWith('/native/collector.ts'))add(node,'native_bridge_call',text,expr.name.text);
   }
   if(ts.isStringLiteral(node)&&names.has(node.text))add(node,'operation_reference',node.parent.getText(src).slice(0,160),node.text);
   ts.forEachChild(node,visit);
  }visit(src);
 }}
 scan(path.join(root,'finweave-web/src'));scan(path.join(root,'finweave-web/admin'));
 fs.writeFileSync(path.join(out,'consumer-ast.json'),JSON.stringify({parser:'installed TypeScript AST',runtime:{node:process.version,typescript:ts.version},scope:'static observation only; dynamic dispatch retained',rows},null,2)+'\n');
 console.log(JSON.stringify({v1:Object.keys(observed.v1).length,identity:Object.keys(observed.identity).length,v2:Object.keys(observed.v2).length,astEntries:rows.length}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
