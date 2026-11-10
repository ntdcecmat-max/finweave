import {describe,it,expect} from 'vitest';
import {fixture} from '../src/domain/fixtures';
import {applyCommand} from '../src/domain/commands';
import {forecastPlans,projectGoal,investmentEstimate} from '../src/domain/planning';
import {planSummary,periodPreset,snapshot} from '../src/domain/selectors';
import {commandOperation} from '../src/services/command-adapter';
import {toDomainCommand} from '../src/mocks/command-mapping';
import {Projections} from '../src/mocks/projections';
import {validateInput} from '../src/contracts/operations';
import {planningAction} from '../src/app/planning-actions';
import {groupedMoney,moneyDigits} from '../src/components/MoneyInput';
import type {Store,Command} from '../src/domain/model';

const run=(s:Store,kind:string,data:Record<string,string>)=>applyCommand(s,{kind,data,version:s.version,key:crypto.randomUUID()});
const plan=(s:Store,data:Record<string,string>={})=>run(s,'plan',{name:'Kế hoạch',kind:'expense',amount:'1000000',account:'bank',date:'2026-11-01',end:'2026-11-30',recurrence:'once',day:'1',category:'Khác',reason:'Lưu kế hoạch',...data});
const goal=(s:Store,data:Record<string,string>={})=>run(s,'goal',{name:'Mục tiêu',target:'1000000000',due:'2026-11-30',contribution:'100000000',contributionAccount:'bank',contributionStart:'2026-11-15',contributionDay:'15',reason:'Lưu mục tiêu',...data});

describe('Planning projections and form submission',()=>{
 it('formats a billion VND and preserves integer strings through pasting',()=>{expect(groupedMoney('1000000000')).toBe('1.000.000.000');expect(moneyDigits('1.000.000.000 VND')).toBe('1000000000');});
 it('projects the reported billion goal as 100 million, identifies 900 million gap and insufficient funds',()=>{
  const s=goal(fixture()),p=projectGoal(s,s.goals[0]);
  expect(p).toMatchObject({funded:'0',projected:'100000000',gap:'900000000',required:'1000000000',achievedAt:null});
  expect(p.shortage).toEqual({date:'2026-11-15',amount:'73500000'});
  expect(snapshot(s,periodPreset('month',s)).cash).toBe('31100000');
 });
 it('accounts for planned future income when checking goal contribution affordability',()=>{
  let s=plan(fixture(),{kind:'income',amount:'100000000',date:'2026-11-01'});s=goal(s);
  expect(projectGoal(s,s.goals[0]).shortage).toBeNull();
 });
 it('finds an achievable date and rounds monthly requirement up to integer VND',()=>{
  const s=goal(fixture(),{target:'5000001',contribution:'3000000',due:'2026-12-31'}),p=projectGoal(s,s.goals[0]);
  expect(p).toMatchObject({required:'2500001',projected:'6000000',gap:'0',achievedAt:'2026-12-15'});
 });
 it('checks competing goals against the same account',()=>{
  let s=goal(fixture(),{target:'20000000',contribution:'15000000'});s=goal(s,{target:'20000000',contribution:'15000000'});
  expect(projectGoal(s,s.goals[1]).shortage).toEqual({date:'2026-11-15',amount:'3500000'});
 });
 it('forecasts income, expense, investment and detects an early cash shortage even when ending cash recovers',()=>{
  let s=plan(fixture(),{amount:'30000000',date:'2026-11-01'});s=plan(s,{kind:'income',amount:'40000000',date:'2026-11-15'});s=plan(s,{kind:'investment',holding:'gold',amount:'1000000',date:'2026-11-20'});
  const p=forecastPlans(s);expect(p).toMatchObject({cash:'40100000',assets:'86100000'});expect(p.shortages[0]).toEqual({date:'2026-11-01',account:'bank',balance:'-3500000'});
  expect(investmentEstimate(s,'gold','1000000').quantity).toBe('0.125');
 });
 it('does not use a past global report period as the planning balance',()=>{
  const s=plan(fixture(),{kind:'income',amount:'1000000'});expect(forecastPlans(s).snap.cash).toBe('31100000');expect(forecastPlans(s,['cash']).items).toHaveLength(0);
 });
 it('keeps next month outstanding after overspending this month',()=>{
  let s=plan(fixture(),{date:'2026-11-15',end:'2026-12-31',recurrence:'monthly',day:'15'});s=run(s,'advance',{date:'2026-11-30'});
  s=run(s,'event',{kind:'expense',account:'bank',amount:'1500000',date:'2026-11-15',description:'Chi theo kế hoạch',category:'Khác',posting:'posted'});s=run(s,'planLink',{event:s.events.at(-1)!.id,plan:s.plans[0].id,reason:'Liên kết thực tế'});
  const p=planSummary(s,periodPreset('month',s));expect(p.items[0]).toMatchObject({actual:'1500000',remaining:'1000000',overspend:'500000'});expect(p.items[0].rows.map(r=>r.remaining)).toEqual(['0','1000000']);
 });
 it('retains linked actual after editing and uses the same remaining amounts in the service forecast',()=>{
  let s=plan(fixture(),{date:'2026-11-15',end:'2026-12-31',recurrence:'monthly',day:'15'});s=run(s,'advance',{date:'2026-11-30'});
  s=run(s,'event',{kind:'expense',account:'bank',amount:'1500000',date:'2026-11-15',description:'Chi kế hoạch',category:'Khác',posting:'posted'});s=run(s,'planLink',{event:s.events.at(-1)!.id,plan:s.plans[0].id,reason:'Liên kết'});
  s=plan(s,{id:s.plans[0].id,amount:'2000000',date:'2026-11-15',end:'2026-12-31',recurrence:'monthly',day:'15'});
  const dto=new Projections(s,()=>1).forecast('2026-12-31');
  expect(dto.items.map(r=>r.actual.value)).toEqual(['1500000','0']);expect(dto.items.map(r=>r.remaining.value)).toEqual(['500000','2000000']);
  expect(dto.forecastCash.value?.value).toBe(forecastPlans(s).cash);
 });
 it('applies a later refund to the original expense occurrence',()=>{
  let s=plan(fixture(),{date:'2026-11-15',end:'2026-12-31',recurrence:'monthly',day:'15'});s=run(s,'advance',{date:'2026-11-30'});
  s=run(s,'event',{kind:'expense',account:'bank',amount:'1500000',date:'2026-11-15',description:'Chi kế hoạch',category:'Khác',posting:'posted'});const expense=s.events.at(-1)!;
  s=run(s,'planLink',{event:expense.id,plan:s.plans[0].id,reason:'Liên kết'});s={...s,clock:'2026-12-31T18:00:00+07:00'};
  s=run(s,'event',{kind:'refund',account:'bank',amount:'500000',date:'2026-12-20',description:'Hoàn khoản chi tháng 11',origin:expense.id,category:'Khác',posting:'posted'});
  s=run(s,'planLink',{event:s.events.at(-1)!.id,plan:s.plans[0].id,reason:'Liên kết hoàn tiền'});
  expect(planSummary(s,periodPreset('month',s)).items[0].rows.map(r=>r.actual)).toEqual(['1000000','0']);
  expect(new Projections(s,()=>1).forecast('2026-12-31').items.map(r=>r.actual.value)).toEqual(['1000000','0']);
 });
 it('rejects a monthly plan or goal with zero scheduled occurrences',()=>{
  expect(()=>plan(fixture(),{date:'2026-11-15',end:'2026-11-20',recurrence:'monthly',day:'1'})).toThrow(/chưa có lần thực hiện/);
  expect(()=>goal(fixture(),{contributionStart:'2026-11-15',contributionDay:'1',due:'2026-11-20'})).toThrow(/chưa có lần nào/);
 });
 it('form defaults follow the current clock and investment context; all three commands survive service mapping',()=>{
  const s=fixture();expect(planningAction(s,'plan',undefined,'investment').fields.find(f=>f.key==='kind')?.initial).toBe('investment');
  for(const kind of ['plan','goal','simulate']){
   const base=kind==='simulate'?goal(s,{target:'5000000',contribution:'1000000'}):s;
   const spec=planningAction(base,kind,kind==='simulate'?base.goals[0].id:undefined,'investment');
   const data={...spec.data,...Object.fromEntries(spec.fields.map(f=>[f.key,f.initial??''])),name:'Lưu thử',amount:'1000000',target:'5000000',reason:'Lưu thử kế hoạch'};
   const c:Command={kind,data,key:crypto.randomUUID(),version:base.version};const op=commandOperation(c,base);validateInput(op.operation,op.input);
   const next=applyCommand(base,toDomainCommand(op.operation,op.input,base));
   expect(next[kind==='plan'?'plans':kind==='goal'?'goals':'simulations']).toHaveLength(1);
  }
 });
});
