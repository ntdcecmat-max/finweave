// Read existing TypeScript contracts with installed TypeScript into work/; no frontend writes.
const path = require('node:path');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname,'../..');
const req = createRequire(path.join(root,'finweave-web/package.json'));
const fs=require('node:fs'),ts=req('typescript'),{pathToFileURL}=require('node:url');
const cache=path.join(root,'work/handover-observer');
const seen=new Map();
function compile(source){
 source=path.resolve(source);if(seen.has(source))return seen.get(source);
 const target=path.join(cache,path.relative(root,source)).replace(/\.tsx?$/,'.mjs');seen.set(source,target);
 let code=ts.transpileModule(fs.readFileSync(source,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
 const parsed=ts.createSourceFile('module.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
 for(const item of parsed.statements){
  if(!(ts.isImportDeclaration(item)||ts.isExportDeclaration(item))||!item.moduleSpecifier)continue;
  const spec=item.moduleSpecifier,name=spec.text;
  if(name.startsWith('node:'))continue;
  let resolved;
  if(name.startsWith('.')){
   const base=path.resolve(path.dirname(source),name);
   resolved=[base,base+'.ts',base+'.tsx',path.join(base,'index.ts')].find(p=>fs.existsSync(p)&&fs.statSync(p).isFile());
   if(!resolved)throw Error('Unresolved '+base);
   if(/\.tsx?$/.test(resolved))resolved=compile(resolved);
  }else resolved=req.resolve(name);
  edits.push({start:spec.getStart(parsed),end:spec.end,text:JSON.stringify(pathToFileURL(resolved).href)});
 }
 for(const e of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,e.start)+e.text+code.slice(e.end);
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,code);return target;
}
import(pathToFileURL(compile(path.join(__dirname,'observe.ts'))).href).catch(e=>{console.error(e);process.exitCode=1;});
