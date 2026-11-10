import { z } from 'zod';
import { isISODate } from '../domain/import';
// Explicit additive v2 contract. The existing v1 financial/read/chat contract stays intact.
const id = z.string().min(1).max(120), text = z.string().trim().min(1).max(500);
const date = z.string().refine(isISODate, 'Ngày không hợp lệ');
const amount = z.string().regex(/^\d{1,13}$/).refine(v => Number(v) <= 1e12);
const quantity = z.string().regex(/^\d+(\.\d{1,6})?$/).refine(v => Number(v) > 0 && Number(v) <= 1e8);
export const ForecastAssumptions = z.strictObject({ months: z.number().int().min(1).max(360), income: amount.nullable(), expense: amount.nullable(), incomeGrowth: z.number().min(-50).max(30), inflation: z.number().min(-5).max(25), cashReturn: z.number().min(0).max(20), stockReturn: z.number().min(-50).max(40), goldReturn: z.number().min(-50).max(40), stockVolatility: z.number().min(0).max(80), goldVolatility: z.number().min(0).max(80), incomeVolatility: z.number().min(0).max(60), expenseVolatility: z.number().min(0).max(60), reserveMonths: z.number().min(0).max(24), investSurplus: z.number().min(0).max(100), goldWeight: z.number().min(0).max(100), debt: amount.nullable(), debtAPR: z.number().min(0).max(60), debtPayment: amount, stress: z.boolean(), stressStart: z.number().int().min(1).max(360), stressMonths: z.number().int().min(1).max(120), incomeDrop: z.number().min(0).max(100), stockShock: z.number().min(-90).max(0), inflationShock: z.number().min(0).max(20), realMoney: z.boolean(), poolCash: z.boolean() });
export const Instrument = z.strictObject({ id, symbol: text, name: text, exchange: text, currency: z.literal('VND'), unit: z.literal('share'), supported: z.boolean() });
export const GoldProfile = z.strictObject({ id, name: text, product: text, purity: text, source: text, side: z.enum(['buy', 'sell']), currency: z.literal('VND'), unit: z.literal('chi') });
export const Device = z.strictObject({ id, name: text, version: z.number().int(), appVersion: text, consentVersion: text, status: z.enum(['active', 'revoked']), permission: z.enum(['granted', 'denied', 'unknown']), network: z.enum(['online', 'offline', 'unknown']), lastSeen: z.string().nullable(), lastObserved: z.string().nullable(), lastAck: z.string().nullable(), pending: z.number().int().nonnegative(), gaps: z.array(text), synthetic: z.boolean() });
export const Binding = z.strictObject({ id, deviceId: id, packageName: text, accountId: id, parserProfileId: id, version: z.number().int(), enabled: z.boolean() });
export const Support = z.strictObject({ packageName: text, name: text, parserProfileId: id, supported: z.boolean(), reason: text });
export const Receipt = z.strictObject({ id, deviceId: id, source: text, parserVersion: text, observedAt: z.string(), ackAt: z.string().nullable(), state: z.enum(['received', 'parsed', 'posted', 'needs_review', 'ignored', 'failed']), eventId: id.nullable(), reviewId: id.nullable(), reason: text.nullable() });
export const PriceJob = z.strictObject({ id, status: z.enum(['queued', 'running', 'succeeded', 'partial', 'failed', 'rate_limited']), requestedAt: z.string(), fetchedAt: z.string().nullable(), quoteAsOf: z.string().nullable(), due: z.number(), results: z.array(z.strictObject({ holdingId: id, state: z.enum(['updated', 'retained', 'missing']), reason: text })), retryAfter: z.string().nullable(), coalesced: z.boolean() });
export const DraftGoal = z.strictObject({ existingId: id.nullable(), name: z.string().trim().min(1).max(80), target: amount.refine(v => Number(v) > 0), due: date, account: id, contribution: amount, start: date, day: z.number().int().min(1).max(31), skipMonths: z.array(z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/)).max(360), profile: z.enum(['cash', 'balanced', 'growth']) });
export const DraftItem = z.strictObject({ ref: id, existingId: id.nullable(), name: z.string().trim().min(1).max(80), kind: z.enum(['income', 'expense', 'investment']), amount: amount.refine(v => Number(v) > 0), account: id, date, end: date, recurrence: z.enum(['once', 'monthly']), day: z.number().int().min(1).max(31), category: text, holding: id.nullable(), supportsGoal: z.boolean() });
export const DraftBody = z.strictObject({ goal: DraftGoal, canonical:z.any().optional(), items: z.array(DraftItem).max(20), scope: z.array(id).min(1), reserve: amount, income: amount, expense: amount, priority: z.enum(['goal_first', 'preserve_plans']), notes: z.string().max(500), settings: ForecastAssumptions });
export const PlanningDraft = z.strictObject({ id, runId: id.nullable(), conversationId: id, version: z.number().int(), baseVersion: z.number().int(), state: z.enum(['draft', 'previewed', 'confirmed', 'superseded']), body: DraftBody, revisions: z.array(text), createdAt: z.string(), confirmedIds: z.array(id), preview: z.strictObject({ token: id, digest: text, expiresAt: z.string(), version: z.number().int() }).nullable() });
export const AgentRun = z.strictObject({ id, conversationId: id, version: z.number().int(), intent: z.enum(['goal', 'plan', 'investigation']), state: z.enum(['queued', 'reading', 'awaiting_user', 'simulating', 'draft_ready', 'completed', 'partial', 'failed', 'cancelled']), baseVersion: z.number().int(), context: z.strictObject({ route: text, scope: z.array(id), snapshotVersion: z.number().int(), periodStart: date, periodEnd: date }), goalId: id.nullable(), settings: ForecastAssumptions, questionId: id.nullable(), draftId: id.nullable(), summary: text, steps: z.array(text), evidence: z.array(id), createdAt: z.string(), due: z.number(), toolCalls: z.number().int() });
export const OperationalSnapshot = z.strictObject({ devices: z.array(Device), bindings: z.array(Binding), support: z.array(Support), receipts: z.array(Receipt), priceJobs: z.array(PriceJob), runs: z.array(AgentRun), drafts: z.array(PlanningDraft), dailyPriceSchedule: text.nullable(), synthetic: z.boolean() });
const holdingInput = z.strictObject({ existingId: id.nullable(), kind: z.enum(['stock', 'gold']), catalogId: id, quantity, date, cost: amount.nullable(), profileConfirmed: z.boolean() });
export const v2Operations = {
    simulatePlanningDraft: {input:z.strictObject({id,expectedVersion:z.number().int()}),output:z.any()},
    getState: { input: z.strictObject({}), output: OperationalSnapshot },
    searchInstruments: { input: z.strictObject({ query: z.string().max(30) }), output: z.array(Instrument) },
    getGoldProfiles: { input: z.strictObject({}), output: z.array(GoldProfile) },
    previewHolding: { input: holdingInput, output: z.strictObject({ token: id, expiresAt: z.string(), name: text, unit: text, version: z.number().int() }) },
    confirmHolding: { input: holdingInput.extend({ token: id }), output: z.strictObject({ id, version: z.number().int() }) },
    requestPriceRefresh: { input: z.strictObject({ holdingIds: z.array(id).max(100) }), output: PriceJob },
    registerExampleDevice: { input: z.strictObject({ acknowledgeSynthetic: z.literal(true) }), output: Device },
    bindCollector: { input: z.strictObject({ deviceId: id, packageName: text, accountId: id, parserProfileId: id, expectedVersion: z.number().int() }), output: Binding },
    testCollector: { input: z.strictObject({ deviceId: id, bindingId: id }), output: Receipt },
    revokeDevice: { input: z.strictObject({ id, expectedVersion: z.number().int(), reason: text }), output: Device },
    startAgentRun: { input: z.strictObject({ conversationId: id, intent: z.enum(['goal', 'plan', 'investigation']), context: AgentRun.shape.context, goalId: id.nullable(), settings: ForecastAssumptions }), output: AgentRun },
    answerAgentRun: { input: z.strictObject({ id, expectedVersion: z.number().int(), questionId: id, body: DraftBody }), output: PlanningDraft },
    cancelAgentRun: { input: z.strictObject({ id, expectedVersion: z.number().int() }), output: AgentRun },
    reviseDraft: { input: z.strictObject({ id, expectedVersion: z.number().int(), body: DraftBody, reason: text }), output: PlanningDraft },
    reviseDraftByMessage: { input: z.strictObject({ id, expectedVersion: z.number().int(), text }), output: PlanningDraft },
    refreshDraft: { input: z.strictObject({ id, expectedVersion: z.number().int() }), output: PlanningDraft },
    previewPlanningDraft: { input: z.strictObject({ id, expectedVersion: z.number().int() }), output: PlanningDraft },
    confirmPlanningDraft: { input: z.strictObject({ id, expectedVersion: z.number().int(), token: id, digest: text }), output: PlanningDraft }
} as const;
export type V2Operation = keyof typeof v2Operations;
export type OpInput<K extends V2Operation> = z.input<(typeof v2Operations)[K]['input']>;
export type OpOutput<K extends V2Operation> = z.output<(typeof v2Operations)[K]['output']>;
export type OperationalState = z.infer<typeof OperationalSnapshot>;
export type PlanningDraftDTO = z.infer<typeof PlanningDraft>;
export type DraftBodyDTO = z.infer<typeof DraftBody>;
export type AgentRunDTO = z.infer<typeof AgentRun>;
export const V2Request = z.strictObject({ contractVersion: z.literal('2.0.0'), requestId: id, operation: z.enum(Object.keys(v2Operations) as [
        V2Operation,
        ...V2Operation[]
    ]), input: z.unknown(), idempotencyKey: id.nullable(), expectedWorkspaceVersion: z.number().int().nullable() });
