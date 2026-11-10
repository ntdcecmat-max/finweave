import {describe,expect,it} from 'vitest';
import {cashflowGraph} from '../src/domain/cashflow';
import type {Event} from '../src/domain/model';

const event=(changes:Partial<Event>):Event=>({id:'test',kind:'income',amount:'1000',date:'2026-10-07',account:'bank',category:'Lương',description:'Test',posting:'posted',reconciliation:'clear',source:'Test',version:1,history:[],...changes});
describe('cashflow graph',()=>{
 it('balances income, refunds, category expenses and the increase in balance',()=>{
  const graph=cashflowGraph([event({amount:'10000'}),event({kind:'expense',amount:'3000',category:'Mua sắm'}),event({kind:'refund',amount:'500',category:'Mua sắm',origin:'expense'})],['bank']);
  expect([graph.inflow,graph.outflow,graph.change]).toEqual(['10500','3000','7500']);
  expect(graph.nodes.find(node=>node.name==='balance-increase')?.value).toBe('7500');
  expect(graph.links.filter(link=>link.target==='cash-pool').reduce((sum,link)=>sum+link.value,0)).toBe(10500);
  expect(graph.links.filter(link=>link.source==='cash-pool').reduce((sum,link)=>sum+link.value,0)).toBe(10500);
 });
 it('excludes internal transfers but includes a transfer crossing the selected scope',()=>{
  const transfer=event({kind:'transfer',amount:'2000',to:'cash'});
  expect(cashflowGraph([transfer],['bank','cash']).nodes).toEqual([]);
  expect(cashflowGraph([transfer],['bank']).change).toBe('-2000');
  expect(cashflowGraph([transfer],['cash']).inflow).toBe('2000');
 });
 it('adds a balance decrease when spending exceeds inflows, with no negative ribbons',()=>{
  const graph=cashflowGraph([event({amount:'1000'}),event({kind:'expense',amount:'4000'})],['bank']);
  expect(graph.nodes.find(node=>node.name==='balance-decrease')?.value).toBe('3000');
  expect(graph.change).toBe('-3000');expect(graph.links.every(link=>link.value>0)).toBe(true);
 });
 it('keeps reversals, investments and adjustments in the correct cash direction and ignores drafts',()=>{
  const graph=cashflowGraph([event({kind:'expense',reversal:true,amount:'800'}),event({kind:'investment',amount:'500'}),event({kind:'adjustment',amount:'-100'}),event({posting:'draft',amount:'90000'})],['bank']);
  expect([graph.inflow,graph.outflow,graph.change]).toEqual(['800','600','200']);
  expect(graph.nodes.some(node=>node.label==='Đầu tư')).toBe(true);
 });
 it('preserves totals when categories are collapsed to groups',()=>{
  const events=[event({}),event({kind:'expense',amount:'100'})];
  const detailed=cashflowGraph(events,['bank']),grouped=cashflowGraph(events,['bank'],'group');
  expect(grouped.nodes.some(node=>node.depth===3)).toBe(false);
  expect([grouped.inflow,grouped.outflow,grouped.change]).toEqual([detailed.inflow,detailed.outflow,detailed.change]);
 });
});
