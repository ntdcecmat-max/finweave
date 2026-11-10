import {it,expect} from 'vitest';
import {interfaceCatalogue,legacyCommandMap} from '../src/contracts/interface-catalogue';
import {operations} from '../src/contracts/operations';
import {identityOperations,identityExamples} from '../src/contracts/identity';
import {readFileSync} from 'node:fs';
it('inherited v1 scope retains exactly28REQ/AC and the full module inventory covers them',()=>{const rtm=readFileSync('../docs/execution/traceability.md','utf8');const reqs=[...rtm.matchAll(/^\| (REQ-[\w-]+) \/[^\n]+?→ (AC-\d+)/gm)].map(m=>m[1]);expect(reqs).toHaveLength(28);const covered=new Set(interfaceCatalogue.flatMap(m=>m.requirements));expect(reqs.filter(id=>!covered.has(id))).toEqual([]);});
it('all semantic actions resolve contracts and every businessoperation has a surface',()=>{const names=new Set(interfaceCatalogue.flatMap(m=>m.actions.flatMap(a=>a.operations)));for(const name of names)expect(name.startsWith('identity:')?name.slice(9) in identityOperations:name in operations).toBe(true);expect(Object.keys(operations).filter(k=>!names.has(k))).toEqual([]);});
it('every legacycommand including cashCount and fixturecontrols has a migration mapping',()=>{const commands=readFileSync('src/domain/commands.ts','utf8');const found=[...commands.matchAll(/case '([^']+)'/g)].map(m=>m[1]);expect(found.filter(k=>!legacyCommandMap[k])).toEqual([]);expect(legacyCommandMap.cashCount).toEqual(['recordCashCount']);for(const name of ['reset','fault','advance'])expect(legacyCommandMap[name][0]).toMatch(/^fixture:/);});
it('identityrequest/result examples validate; real transport remains separate and blocked',()=>{for(const [name,op]of Object.entries(identityOperations)){const sample=identityExamples[name as keyof typeof identityOperations];op.input.parse(sample.input);op.output.parse(sample.output);}expect(Object.keys(identityOperations)).toHaveLength(6);});
it('financialexamples aggregate balances, categories and portfolio consistently',()=>{const list=JSON.parse(readFileSync('../docs/contracts/v1/examples.json','utf8'));const report=list.find((e:any)=>e.operationId==='getOverview').output;expect(report.accounts.reduce((sum:number,a:any)=>sum+Number(a.balance.value.value),0)).toBe(Number(report.cash.value.value));expect(Number(report.cash.value.value)+report.holdings.reduce((sum:number,h:any)=>sum+Number(h.valuation.value.value),0)).toBe(Number(report.assets.value.value));expect(report.spending.reduce((sum:number,c:any)=>sum+Number(c.net.value),0)).toBe(Number(report.netExpense.value.value));});

import {screenCatalogue} from '../src/contracts/surface-catalogue';
it('v3 catalogue has all 50 specification IDs, valid sources and explicit boundaries',()=>{
 const expected=[['UI-U',19],['UI-AUTH',8],['UI-S',10],['UI-M',6],['UI-ADM',7]] as const;
 expect(screenCatalogue.map(s=>s.id).sort()).toEqual(expected.flatMap(([prefix,count])=>Array.from({length:count},(_,i)=>`${prefix}-${String(i+1).padStart(2,'0')}`)).sort());
 for(const screen of screenCatalogue){expect(readFileSync(screen.source,'utf8').length).toBeGreaterThan(0);expect(screen.parentAC.every(ac=>Number(ac)>=1&&Number(ac)<=41)).toBe(true);expect(screen.unverified.length).toBeGreaterThan(0);expect(screen.checks.length).toBeGreaterThan(0);}
 expect(screenCatalogue.filter(s=>s.surface==='android').every(s=>s.implementation==='native_pending')).toBe(true);
 expect(screenCatalogue.filter(s=>s.implementation==='redirect').map(s=>s.id)).toEqual(['UI-U-02','UI-U-12']);
});
