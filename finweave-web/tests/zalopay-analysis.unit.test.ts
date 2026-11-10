import { expect, test } from 'vitest';
import { zaloAnalysisSchema } from '../src/native/notification-test';

test('only bounded exact VND candidates or unknown values can cross the preview bridge', () => {
  const candidate = { status: 'CANDIDATE', amount: '10000', direction: 'income', reason: 'CANDIDATE_GENERIC_TEMPLATE_UNVERIFIED' };
  expect(zaloAnalysisSchema.parse(candidate)).toEqual(candidate);
  for (const amount of ['0', '01', '-10000', '10.000', '1000000000000000000'])
    expect(zaloAnalysisSchema.safeParse({ ...candidate, amount }).success).toBe(false);
  expect(zaloAnalysisSchema.safeParse({ ...candidate, raw: 'private notification' }).success).toBe(false);
  expect(zaloAnalysisSchema.safeParse({ ...candidate, direction: 'unknown' }).success).toBe(false);
  expect(zaloAnalysisSchema.safeParse({ ...candidate, reason: 'VERIFIED' }).success).toBe(false);
});
test('unknown cannot carry an amount or direction that the UI could mistake for a transaction', () => {
  const unknown = { status: 'UNKNOWN', amount: null, direction: null, reason: 'UNSUPPORTED' };
  expect(zaloAnalysisSchema.parse(unknown)).toEqual(unknown);
  expect(zaloAnalysisSchema.safeParse({ ...unknown, amount: '10000' }).success).toBe(false);
  expect(zaloAnalysisSchema.safeParse({ ...unknown, direction: 'expense' }).success).toBe(false);
});
