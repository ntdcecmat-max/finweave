import { Capacitor, registerPlugin } from '@capacitor/core';
import { z } from 'zod';
const Status = z.strictObject({
  active: z.boolean(), listenerBound: z.boolean(), accessGranted: z.boolean(), canPost: z.boolean(), pending: z.number().int().nonnegative(),
  channelImportance: z.number().int().nullable(), systemNotificationCount: z.number().int().min(0).max(20),
  results: z.array(z.strictObject({ id: z.number().int(), fixture: z.enum(['income', 'expense', 'otp']),
    amount: z.string().nullable(), direction: z.enum(['income', 'expense']).nullable(), outcome: z.string() })),
});
export type NotificationTestStatus = z.infer<typeof Status>;
const Shape = z.string().regex(/^(?:\[(?:TEXT|NUMBER|INCOMING|TRANSFER|PAYMENT|SUCCESS|FAILED|PENDING|REFUND|OUTGOING|VND|TRUNCATED)\](?: |$))*$/).max(1200).nullable();
export const zaloAnalysisSchema = z.discriminatedUnion('status', [
  z.strictObject({ status: z.literal('CANDIDATE'), amount: z.string().regex(/^[1-9][0-9]{0,17}$/), direction: z.enum(['income', 'expense']), reason: z.literal('CANDIDATE_GENERIC_TEMPLATE_UNVERIFIED') }),
  z.strictObject({ status: z.literal('UNKNOWN'), amount: z.null(), direction: z.null(), reason: z.enum(['OVERSIZE', 'OTP_DISCARDED', 'NON_FINAL', 'PROMOTIONAL', 'INTERNAL_TRANSFER', 'REFUND_UNVERIFIED', 'UNSUPPORTED', 'CONFLICTING_FIELDS', 'INVALID_AMOUNT', 'AMBIGUOUS_AMOUNT', 'CONFLICTING_DIRECTION']) }),
]);
export type ZaloAnalysis = z.infer<typeof zaloAnalysisSchema>;
const ZaloStatus = z.strictObject({ active: z.boolean(), sourceVerified: z.boolean(), sourceVersion: z.literal('11.14.0'),
  accessGranted: z.boolean(), listenerBound: z.boolean(), consented: z.boolean(), remainingSeconds: z.number().int().min(0).max(900),
  reason: z.enum(['NOT_STARTED', 'STOPPED', 'WAITING', 'EXPIRED', 'ACCESS_OR_LISTENER_LOST', 'SOURCE_CHANGED', 'CAPACITY']),
  callbacks: z.number().int().min(0).max(10000), skipped: z.number().int().min(0).max(10000),
  discardedSensitive: z.number().int().min(0).max(10000), samples: z.array(z.strictObject({
    id: z.string().max(80), title: Shape, text: Shape, bigText: Shape, subText: Shape, analysis: zaloAnalysisSchema,
  })).max(20) });
export type ZaloPreviewStatus = z.infer<typeof ZaloStatus>;
type Probe = { getStatus(): Promise<unknown>; start(): Promise<unknown>; stop(): Promise<unknown>;
  openTestNotificationSettings(): Promise<unknown>; openZaloNotificationSettings(): Promise<unknown>;
  getZaloPreviewStatus(): Promise<unknown>; startZaloPreview(input: { acknowledge: true; analyzeTransactions: true }): Promise<unknown>; stopZaloPreview(): Promise<unknown>;
  testZaloParser(input: { fixture: 'income' | 'expense' | 'unknown' }): Promise<unknown>;
  requestPostPermission(): Promise<unknown>; post(input: { fixture: 'income' | 'expense' | 'otp' }): Promise<{ id: number }> };
const probe = registerPlugin<Probe>('FinWeaveNotificationTest');
export const notificationTestAvailable = () => Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('FinWeaveNotificationTest');
export const notificationTestStatus = async () => Status.parse(await probe.getStatus());
export async function notificationTestAction(action: 'start' | 'stop' | 'requestPostPermission' | 'openTestNotificationSettings') { return Status.parse(await probe[action]()); }
export const postTestNotification = (fixture: 'income' | 'expense' | 'otp') => probe.post({ fixture });
export const zaloPreviewStatus = async () => ZaloStatus.parse(await probe.getZaloPreviewStatus());
export const startZaloPreview = async () => ZaloStatus.parse(await probe.startZaloPreview({ acknowledge: true, analyzeTransactions: true }));
export const testZaloParser = async (fixture: 'income' | 'expense' | 'unknown') => zaloAnalysisSchema.parse(await probe.testZaloParser({ fixture }));
export const stopZaloPreview = async () => ZaloStatus.parse(await probe.stopZaloPreview());
export const openZaloNotificationSettings = async () => ZaloStatus.parse(await probe.openZaloNotificationSettings());
