// Read actual reports; reject incomplete/failed results. Never rewrite raw test status.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),app=path.join(root,'finweave-web'),ev=path.join(root,'docs/execution/evidence');
const read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const put=(p,v)=>fs.writeFileSync(path.join(root,p),typeof v==='string'?v:JSON.stringify(v,null,2)+'\n');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);},sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const unit=json('docs/execution/evidence/step6-unit-results.json');
assert(unit.success&&unit.numTotalTests===99&&unit.numPassedTests===99&&unit.numFailedTests===0&&unit.numPendingTests===0,'Unit acceptance incomplete');
const specs=suites=>suites.flatMap(s=>[...(s.specs||[]),...specs(s.suites||[])]);
const latest=new Map(),runs=[];
for(const name of ['step6-browser-results.json','step6-ai-regression-results.json']){
 const report=json('docs/execution/evidence/'+name),cases=specs(report.suites).flatMap(s=>(s.tests||[]).map(t=>({file:s.file,title:s.title,status:t.results.at(-1)?.status||'missing',report:name})));
 assert(report.errors.length===0&&report.stats.unexpected===0&&report.stats.skipped===0&&report.stats.flaky===0&&cases.every(c=>c.status==='passed'),'Browser failed/incomplete '+name);
 runs.push({file:name,stats:report.stats,cases:cases.length});cases.forEach(c=>latest.set(c.file+'::'+c.title,c));
}
assert([54,55].includes(runs[0].cases)&&runs[1].cases===8&&latest.size===55,'Expected full54/55 + affectedAI8 =55distinct');
const browserMethod=runs[0].cases===54?'Full54 PASS then8 affectedAI regression PASS, 7overlap+1new; not a single55-case run':'Full55 PASS and8 affectedAI regression PASS, all8 overlap';
const renders=['step6-accessibility-1440.json','step6-accessibility-390.json','step6-accessibility-360.json','step6-auth-accessibility.json'].flatMap(n=>json('docs/execution/evidence/'+n));
assert(renders.length===72&&renders.every(r=>r.violations.length===0),'A11y reports incomplete or violations remain');
const inv=json('docs/execution/evidence/step6-action-inventory.json');
assert(inv.metadata.requirements===28&&inv.metadata.modules===13&&inv.metadata.actions===86&&inv.metadata.businessRoutes===16&&inv.metadata.authRoutes===7&&inv.metadata.businessOperations===70&&inv.metadata.identityOperations===6,'Scope/action audit incomplete');
const lockHash=sha(path.join(app,'package-lock.json'));assert(lockHash===inv.metadata.lockHash,'Lock drift');
for(const i of inv.metadata.originalInputs)assert(sha(path.join(root,i.name))===i.sha256,'Original input drift '+i.name);
const pkg=json('finweave-web/package.json'),lock=json('finweave-web/package-lock.json'),pins={...pkg.dependencies,...pkg.devDependencies};
assert(Object.keys(pins).length===21&&Object.values(pins).every(v=>/^\d+\.\d+\.\d+$/.test(v)),'Dependency pins drift');
for(const[n,v]of Object.entries(pins))assert(lock.packages[''].dependencies?.[n]===v||lock.packages[''].devDependencies?.[n]===v,'Lock manifest mismatch '+n);
const logical=json('docs/contracts/v1/logical.openapi.json'),identity=json('docs/contracts/v1/identity.openapi.json');
assert(logical.info.version==='1.1.0'&&identity.info.version==='1.1.0'&&Object.keys(logical.paths).length===70&&Object.keys(identity.paths).length===6,'Contract version/count drift');
function refs(value){if(Array.isArray(value))value.forEach(refs);else if(value&&typeof value==='object'){if(value.$ref?.startsWith('#/components/schemas/'))assert(logical.components.schemas[value.$ref.split('/').at(-1)],'Missing schema ref '+value.$ref);Object.values(value).forEach(refs);}}refs(logical);
const lint=json('docs/execution/evidence/step6-lint-results.json');assert(lint.result==='PASS'&&lint.findings.length===0,'Lint failed');
assert(read('docs/execution/evidence/step6-build.log').includes('built in')&&!read('docs/execution/evidence/step6-build.log').includes('error TS'),'Build failed/missing');
assert(!read('docs/execution/evidence/step6-typecheck.log').includes('error TS'),'Typecheck failed');
assert(read('docs/execution/evidence/step6-contracts.log').includes('"requirements":28'),'Contract audit missing');
const manual=json('docs/execution/evidence/step6-manual-review.json');assert(manual.method==='AG self walkthrough'&&manual.participants===0&&manual.completed===true,'Direct review missing');
for(const file of manual.screenshots)assert(fs.existsSync(path.join(ev,'step6-screenshots',file)),'Manual screenshot missing '+file);
const runtime=read('docs/execution/evidence/step6-runtime-coverage.md');for(const r of inv.coverage)assert(runtime.includes(r.req+' / '+r.ac),'Runtime coverage missing '+r.req);
const summary={date:new Date().toISOString(),gateM2:'PASS_FRONTEND_SYNTHETIC_MOCK',assessment:'Agent self-verification; no user research/UAT/PO external sign-off',participants:0,scope:'scope-v2/analysis-v2',requirements:28,modules:13,actions:86,businessRoutes:16,authRoutes:7,contractVersion:'1.1.0',unit:{total:99,passed:99,failed:0,suites:unit.numTotalTestSuites,groups:unit.testResults.map(s=>({file:path.basename(s.name),checks:s.assertionResults.length,status:s.status}))},browser:{uniqueCases:55,passed:55,failed:0,method:browserMethod,runs,cases:[...latest.values()]},accessibility:{renders:72,violations:0,viewports:['1440x900','390x844','360x844'],scope:'16business tabs + /design and7auth screens at3widths; representative page states, not certification'},checks:{typecheck:'PASS',lint:'PASS customAST architecture rules',build:'PASS with chunk warning',contracts:'PASS static audit and unit/HTTP'},lockHash,pins,realIntegration:'BLOCKED_SECURITY_POC',durableBackend:false,ai:'scripted_mock_only',unresolvedScopeBlockers:[],backlog:['P3 bundle/cold-start optimization'],stopAt:'M2; no Step7–9'};
put('docs/execution/evidence/step6-acceptance-summary.json',summary);
const selected=['docs/testing/test-strategy.md','docs/testing/test-cases-data.md','docs/testing/contract-test-results.md','docs/testing/accessibility-responsive-report.md','docs/testing/defect-log.md','docs/testing/frontend-acceptance-report.md','docs/testing/integration-handover.md','docs/execution/evidence/step6-action-coverage.md','docs/execution/evidence/step6-runtime-coverage.md','docs/design/interface-catalogue.md','README.md','finweave-web/README.md'];
// These two files are this verifier's outputs; verify their existence after writing.
const generatedOutputs=['step6-manifest-sha256.json','docs/execution/evidence/step6-delivery-checks.json'].map(p=>path.join(root,p));
const broken=[];let links=0;for(const file of selected){for(const match of read(file).matchAll(/\[[^\]\n]*\]\(([^)]+)\)/g)){let target=match[1].replace(/^<|>$/g,'').split('#')[0];if(!target||/^(https?:|mailto:|app:|codex:)/.test(target))continue;links++;const dest=path.resolve(path.dirname(path.join(root,file)),decodeURIComponent(target));if(!fs.existsSync(dest)&&!generatedOutputs.includes(dest))broken.push({file,target});}}
assert(!broken.length,'Broken deliverable links: '+JSON.stringify(broken));
put('docs/execution/evidence/step6-delivery-checks.json',{date:new Date().toISOString(),result:'PASS',checks:['actual99unit','actualfull54/55+8AI/55distinct','72axe zero','28REQ/86actions','76operation refs','21exactpins/lock','5original inputs','manual evidence','local links'],localLinks:links,brokenLinks:broken,lockHash,realIntegration:'BLOCKED_SECURITY_POC'});
function walk(base){return fs.readdirSync(base,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(base,e.name)):[path.join(base,e.name)]);}
const files=new Set(['README.md','Start-Prototype.cmd',...inv.metadata.originalInputs.map(i=>i.name),...walk(path.join(app,'src')).map(p=>path.relative(root,p)),...walk(path.join(app,'tests')).map(p=>path.relative(root,p)),...walk(path.join(app,'scripts')).map(p=>path.relative(root,p)),...walk(path.join(app,'public')).map(p=>path.relative(root,p)),...walk(path.join(app,'dist')).map(p=>path.relative(root,p)),...walk(path.join(root,'docs')).filter(p=>!p.includes(path.sep+'evidence'+path.sep)||path.basename(p).startsWith('step6-')||p.includes(path.sep+'step6-screenshots'+path.sep)||p.includes(path.sep+'step6-auth-screenshots'+path.sep)||p.includes(path.sep+'step6-ai-regression-screenshots'+path.sep)||p.includes(path.sep+'step6-pilot-screenshots'+path.sep)).map(p=>path.relative(root,p)),...fs.readdirSync(app).filter(n=>/^(package.*json|tsconfig.*json|vite.config.ts|playwright.*config.ts|README.md|run-local.cjs|.env.example)$/.test(n)).map(n=>'finweave-web/'+n)]);
files.delete('docs/execution/evidence/step6-delivery-checks.json');files.add('docs/execution/evidence/step6-delivery-checks.json');
const entries=[...files].sort().map(file=>({file:file.replaceAll('\\','/'),bytes:fs.statSync(path.join(root,file)).size,sha256:sha(path.join(root,file))}));
put('step6-manifest-sha256.json',{version:'1.0',createdAt:new Date().toISOString(),gateM2:summary.gateM2,contractVersion:'1.1.0',files:entries,exclusions:'node_modules/work/tmp/git; previous Step3–5 evidence manifests preserved separately; run trace/HTML binary folders indexed by raw reports'});
assert(generatedOutputs.every(p=>fs.existsSync(p)),'Generated deliverable missing');
console.log(JSON.stringify({result:'PASS',gateM2:summary.gateM2,unit:99,browser:55,renders:72,localLinks:links,manifestFiles:entries.length,realIntegration:summary.realIntegration}));
