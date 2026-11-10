// FW-ENGINE-EXACT-001. One exact coefficient/rational kernel; no binary64 actual arithmetic.
export class EngineInputError extends Error {
  code: string;
  constructor(code: string) { super(code); this.name = 'EngineInputError'; this.code = code; }
}
const moneyMax = 999999999999999999n;
type MoneySign = 'nonnegative' | 'positive' | 'signed';
export function money(value: unknown, sign: MoneySign = 'nonnegative'): bigint {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,17}|-[1-9][0-9]{0,17})$/.test(value)) throw new EngineInputError('MONEY_FORMAT');
  const coefficient = BigInt(value);
  if (sign !== 'signed' && coefficient < 0n || sign === 'positive' && coefficient === 0n) throw new EngineInputError('MONEY_SIGN');
  return coefficient;
}
function bounded(value: bigint): string {
  if (value > moneyMax || value < -moneyMax) throw new EngineInputError('MONEY_OVERFLOW');
  return value.toString();
}
export function sumMoney(values: readonly unknown[]): string {
  // Check final aggregate, not intermediate ordering: exact offsetting postings may exceed bounds transiently.
  return bounded(values.reduce<bigint>((total, value) => total + money(value, 'signed'), 0n));
}
export function decimal(value: unknown, positive = false): { coefficient: bigint; scale: number } {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,19})(?:\.[0-9]{1,8})?$/.test(value)) throw new EngineInputError('DECIMAL_FORMAT');
  const [whole, fraction = ''] = value.split('.');
  const coefficient = BigInt(whole + fraction);
  if (positive && coefficient === 0n) throw new EngineInputError('DECIMAL_SIGN');
  return { coefficient, scale: fraction.length };
}
export function halfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator <= 0n) throw new EngineInputError('INVALID_DENOMINATOR');
  const absolute = numerator < 0n ? -numerator : numerator;
  const quotient = absolute / denominator;
  const rounded = quotient + (2n * (absolute % denominator) >= denominator ? 1n : 0n);
  return numerator < 0n ? -rounded : rounded;
}
export type Valuation = { known: true; amount: string } | { known: false; reason: 'QUANTITY_UNKNOWN' | 'PRICE_UNKNOWN' | 'FX_UNKNOWN' | 'UNIT_UNKNOWN' };
export function valueHolding(input: {
  quantity: unknown; price: unknown; unit: string | null; currency: string; fx: unknown;
}): Valuation {
  if (input.quantity === null) return { known: false, reason: 'QUANTITY_UNKNOWN' };
  const quantity = decimal(input.quantity);
  if (quantity.coefficient === 0n) return { known: true, amount: '0' };
  if (input.price === null) return { known: false, reason: 'PRICE_UNKNOWN' };
  const price = decimal(input.price, true);
  if (!['share','chi','luong'].includes(input.unit ?? '')) return { known: false, reason: 'UNIT_UNKNOWN' };
  if (!['VND','USD'].includes(input.currency)) return { known: false, reason: 'FX_UNKNOWN' };
  if (input.currency === 'USD' && input.fx === null) return { known: false, reason: 'FX_UNKNOWN' };
  const fx = input.currency === 'USD' ? decimal(input.fx, true) : { coefficient: 1n, scale: 0 };
  const numerator = quantity.coefficient * price.coefficient * fx.coefficient;
  const denominator = 10n ** BigInt(quantity.scale + price.scale + fx.scale) * (input.unit === 'luong' ? 10n : 1n);
  return { known: true, amount: bounded(halfUp(numerator, denominator)) };
}
export function knownTotal(values: readonly (string | null)[]) {
  const knownSubtotal = sumMoney(values.filter((v): v is string => v !== null));
  const complete = values.every(v => v !== null);
  return { knownSubtotal, total: complete ? knownSubtotal : null };
}
