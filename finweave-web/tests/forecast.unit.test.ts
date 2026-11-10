import {describe,it,expect} from 'vitest';
import {fixture} from '../src/domain/fixtures';
import {applyCommand} from '../src/domain/commands';
import {DEFAULT_FORECAST,FORECAST_PRESETS,forecastBaseline,simulateForecast} from '../src/domain/forecast';
import type {ForecastSettings} from '../src/domain/forecast';
import type {Store} from '../src/domain/model';
import {commandOperation} from '../src/services/command-adapter';
import {toDomainCommand} from '../src/mocks/command-mapping';
import {validateInput,validateOutput} from '../src/contracts/operations';
import {Goal as GoalSchema} from '../src/contracts/schemas';
import {Projections} from '../src/mocks/projections';
const run=(s:Store,kind:string,data:Record<string,string>)=>applyCommand(s,{kind,data,version:s.version,key:crypto.randomUUID()});
const settings:ForecastSettings={...DEFAULT_FORECAST,months:12,cashReturn:0,stockReturn:0,goldReturn:0,stockVolatility:0,goldVolatility:0,incomeVolatility:0,expenseVolatility:0,incomeGrowth:0,inflation:0,investSurplus:0,reserveMonths:0};
const model=(s:Store,patch:Partial<ForecastSettings>={},n=60)=>simulateForecast(s,{...settings,...patch},undefined,n);
const goal=(s:Store,data:Record<string,string>={})=>run(s,'goal',{name:'Tích lũy',target:'1000000000',due:'2026-11-30',contribution:'100000000',contributionAccount:'bank',contributionStart:'2026-11-15',contributionDay:'15',reason:'Lưu mục tiêu',...data});
const plan=(s:Store,data:Record<string,string>)=>run(s,'plan',{name:'Kế hoạch',kind:'expense',amount:'1000000',account:'bank',date:'2026-11-15',end:'2026-11-15',recurrence:'once',day:'15',category:'Mua sắm',reason:'Lưu kế hoạch',...data});

describe('Conditional forecasts from recorded finances',()=>{
 it('uses actual gross spending without turning past refunds into future recurring income',()=>{
  const b=forecastBaseline(fixture());expect(b).toMatchObject({income:10000000,expense:1100000,months:1,complete:true});
  expect(b.snap.cash).toBe('31100000');expect(b.snap.assets).toBe('76100000');
  expect(forecastBaseline({...fixture(),clock:'2026-10-15T18:00:00+07:00'}).complete).toBe(false);
 });
 it('projects twelve monthly operating surpluses, with identical percentiles at zero volatility',()=>{
  const p=model(fixture()),end=p.points.at(-1)!;
  expect(end.assets.p50).toBeCloseTo(76100000+12*8900000,0);expect(end.assets.p10).toEqual(end.assets.p90);
  expect(end.assets.p50).toBe(p.counterfactual.at(-1)!.assets.p50);expect(p.solvency).toBe(100);expect(p.central.at(-1)!.cash).toBeCloseTo(31100000+12*8900000,0);
 });
 it('does not manufacture the requested 100 million and retains source/reserve constraints',()=>{
  const s=goal(fixture()),p=model(s,{months:1,reserveMonths:3});
  expect(p.goals[0].requested).toBe(100000000);expect(p.goals[0].feasible).toBeLessThan(40000000);expect(p.goals[0].funded).toBe(p.goals[0].feasible);
  expect(p.goals[0].probability).toBe(0);expect(p.points.at(-1)!.assets.p50).toBeCloseTo(85000000,0);
 });
 it('does not allocate the same source money to competing goals',()=>{
  let s=goal(fixture());s=goal(s);const p=model(s,{months:1});
  expect(p.goals.reduce((sum,g)=>sum+g.feasible,0)).toBeLessThan(40000000);expect(p.goals[1].feasible).toBe(0);
 });
 it('preserves total wealth when money becomes an investment or a goal allocation',()=>{
  const s=plan(fixture(),{kind:'investment',holding:'stock',amount:'1000000'}),base=model(fixture(),{months:1}),p=model(s,{months:1});
  expect(p.points.at(-1)!.assets.p50).toBeCloseTo(base.points.at(-1)!.assets.p50,0);
  expect(p.points.at(-1)!.cash.p50).toBeCloseTo(base.points.at(-1)!.cash.p50-1000000,0);
  let funded=goal(fixture(),{contribution:'',target:'20000000'});funded=run(funded,'allocate',{id:funded.goals[0].id,account:'bank',amount:'10000000',reason:'Dành tiền'});
  expect(model(funded).points[0].assets.p50).toBe(76100000);expect(funded.goals[0].allocations[0].date).toBe('2026-10-31');
  expect(model(funded).goals[0].streak).toBe(1);
 });
 it('exposes an unfunded investment instead of manufacturing shares or cash',()=>{
  const s=plan(fixture(),{kind:'investment',holding:'stock',amount:'100000000'}),p=model(s,{months:1});
  expect(p.central.reduce((n,f)=>n+f.unfundedInvestment,0)).toBeGreaterThan(60000000);
  expect(p.points.at(-1)!.assets.p50).toBeCloseTo(85000000,0);
 });
 it('replaces recurring income and the matching expense category, while adding one-off spending',()=>{
  let s=plan(fixture(),{kind:'income',amount:'12000000',recurrence:'monthly',end:'2026-11-30',category:'Lương'});
  s=plan(s,{amount:'1000000',recurrence:'monthly',end:'2026-11-30',category:'Mua sắm'});
  s=plan(s,{amount:'2000000',category:'Mua sắm',date:'2026-11-20',end:'2026-11-20'});
  const p=model(s,{months:1}),total=p.central.reduce((v,r)=>({income:v.income+r.income,expense:v.expense+r.expense}),{income:0,expense:0});
  expect(p.points.at(-1)!.assets.p50).toBeLessThan(p.counterfactual.at(-1)!.assets.p50);expect(total.income).toBeCloseTo(12000000,0);expect(total.expense).toBeCloseTo(3500000,0);
 });
 it('has reproducible nonzero uncertainty and responds to a macroeconomic shock',()=>{
  const s=fixture(),p=model(s,{...DEFAULT_FORECAST,months:36},120),end=p.points.at(-1)!;
  expect(end.assets.p10).toBeLessThan(end.assets.p50);expect(end.assets.p50).toBeLessThan(end.assets.p90);
  expect(model(structuredClone(s),{...DEFAULT_FORECAST,months:36},120).points).toEqual(p.points);
  const stressed=model(s,{...DEFAULT_FORECAST,months:36,...FORECAST_PRESETS.find(p=>p.id==='recession')!.patch},120);
  expect(stressed.points.at(-1)!.assets.p50).toBeLessThan(end.assets.p50);
 });
 it('raises living costs and today-money targets with inflation',()=>{
  const s=goal(fixture(),{target:'100000000',due:'2027-10-31',targetBasis:'today',criterion:'savings',profile:'cash',contribution:'1000000'});
  const p=model(s,{inflation:10});expect(p.goals[0].target).toBeGreaterThan(109000000);
  expect(p.central.filter(f=>f.date.startsWith('2027-10')).reduce((n,f)=>n+f.expense,0)).toBeGreaterThan(1100000);expect(p.points.at(-1)!.inflation).toBeGreaterThan(1.09);
 });
 it('evaluates asset milestones with an AND liquidity condition instead of earmarked progress',()=>{
  const s=goal(fixture(),{target:'80000000',criterion:'assets',contribution:'',liquidMonths:'0'});
  expect(model(s,{months:1}).goals[0].probability).toBe(100);
  const strict=goal(fixture(),{target:'80000000',criterion:'assets',contribution:'',liquidMonths:'24'});
  expect(model(strict,{months:1,expense:'5000000'}).goals[0].probability).toBe(0);
 });
 it('does not give a whole-portfolio probability with missing asset prices or undeclared debt',()=>{
  const s=goal(fixture('F-MISSING'),{criterion:'assets',contribution:''});expect(model(s).goals[0].probability).toBeNull();expect(model(s).missingAssets).toBe(true);
  const fi=goal(fixture(),{criterion:'independence',contribution:''});expect(model(fi).goals[0].probability).toBeNull();expect(model(fi,{debt:'0'}).goals[0].probability).not.toBeNull();
 });
 it('limits the scope of actual reserved funds and never mutates ledger balances',()=>{
  let s=goal(fixture(),{target:'10000000',contribution:''});s=run(s,'allocate',{id:s.goals[0].id,account:'bank',amount:'10000000',reason:'Dành tiền'});
  const previous=JSON.stringify(s),p=simulateForecast(s,settings,['cash'],10);expect(p.points[0].cash.p50).toBe(2850000);expect(p.points[0].goals[s.goals[0].id].p50).toBe(0);expect(JSON.stringify(s)).toBe(previous);
 });
 it('completes milestones only from actual assets and enforces the liquidity condition',()=>{
  let s=goal(fixture(),{target:'70000000',criterion:'assets',contribution:''});
  const c={kind:'goalAction',version:s.version,key:'K',data:{id:s.goals[0].id,action:'achieved',assessedExpense:'1100000',assessedDebt:'0',reason:'Đủ tài sản'}};
  const request=commandOperation(c,s);validateInput(request.operation,request.input);
  const next=applyCommand(s,toDomainCommand(request.operation,request.input,s));expect(next.goals[0].status).toBe('achieved');
  s=goal(fixture(),{target:'70000000',criterion:'assets',contribution:'',liquidMonths:'24'});
  expect(()=>run(s,'goalAction',{id:s.goals[0].id,action:'achieved',assessedExpense:'5000000',reason:'Đủ tài sản'})).toThrow(/dự phòng/);
 });
 it('supports long-term schedules and preserves criteria through validated service requests',()=>{
  const s=goal(fixture(),{criterion:'independence',targetBasis:'today',profile:'growth',expenseMultiple:'25',liquidMonths:'6',icon:'retirement',due:'2046-10-31',contribution:'3000000'});
  const form={kind:'goal',version:s.version,key:'K',data:{id:s.goals[0].id,name:'Nghỉ hưu',target:s.goals[0].target,due:s.goals[0].due,criterion:'independence',targetBasis:'today',profile:'growth',expenseMultiple:'25',liquidMonths:'6',icon:'retirement'}};
  const request=commandOperation(form,s);validateInput(request.operation,request.input);const command=toDomainCommand(request.operation,request.input,s);const updated=applyCommand(s,command);
  expect(updated.goals[0].projection).toMatchObject({criterion:'independence',profile:'growth',liquidMonths:6});
  GoalSchema.parse(new Projections(updated,()=>1).goal(updated.goals[0]));
  expect(model(s,{months:240},10).points.length).toBeGreaterThan(200);
 });
});
