import { decimal, money, sumMoney, EngineInputError } from './exact.ts';
export type Line={ledger:string;amount:string};
export function posting(input:Record<string,any>):Line[] {
 const amount=money(input.amount.value,'positive'),asset='asset:'+input.accountId;
 let lines:Line[];
 switch(input.kind) {
 case 'opening':case 'income':case 'refund': lines=[{ledger:asset,amount:amount.toString()},{ledger:'counter:'+(input.kind==='refund'?(input.originId?'refund':'suspense'):input.kind),amount:(-amount).toString()}];break;
 case 'expense':case 'investment': lines=[{ledger:asset,amount:(-amount).toString()},{ledger:'counter:'+input.kind,amount:amount.toString()}];break;
 case 'transfer':
  if(input.accountId===input.toAccountId)throw new EngineInputError('SELF_TRANSFER');
  lines=[{ledger:asset,amount:(-amount).toString()},{ledger:input.oneLeg?'counter:transfer':'asset:'+input.toAccountId,amount:amount.toString()}];break;
 case 'adjustment': {
  const signed=money(input.signed,'signed');if(!signed)throw new EngineInputError('ZERO_POSTING');
  lines=[{ledger:asset,amount:signed.toString()},{ledger:'counter:adjustment',amount:(-signed).toString()}];break;
 }
 default:throw new EngineInputError('UNSUPPORTED_KIND');
 }
 assertBalanced(lines);return lines;
}
export function assertBalanced(lines:readonly Line[]) {
 if(lines.length<2||lines.some(x=>money(x.amount,'signed')===0n)||sumMoney(lines.map(x=>x.amount))!=='0')throw new EngineInputError('UNBALANCED');
}
export function quantity(value:unknown,unit:string,kind:string):string {
 if(kind==='stock'?unit!=='share':!['chi','luong'].includes(unit))throw new EngineInputError('UNIT_INCOMPATIBLE');
 const d=decimal(value),coefficient=d.coefficient*10n**BigInt(8-d.scale)*(unit==='luong'?10n:1n);
 if(coefficient>=10n**28n)throw new EngineInputError('QUANTITY_OVERFLOW');
 return formatQuantity(coefficient);
}
export function formatQuantity(coefficient:bigint) {return (coefficient/100000000n).toString()+((coefficient%100000000n)?'.'+(coefficient%100000000n).toString().padStart(8,'0').replace(/0+$/,''):'');}
export function replayQuantity(movements:readonly {mode:string;quantity:string}[]) {
 let value=0n;
 for(const m of movements) {const d=decimal(m.quantity),q=d.coefficient*10n**BigInt(8-d.scale);value=m.mode==='set'?q:value+q;if(value<0n||value>=10n**28n)throw new EngineInputError('QUANTITY_OVERFLOW');}
 return formatQuantity(value);
}
