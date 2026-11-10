import type { Store } from './model';
import type { DraftBodyDTO } from '../contracts/operational';
import { applyCommand } from './commands';
import { normalizeForecast, simulateForecast } from './forecast';
import { D } from './selectors';
/** The mock service and preview UI use the same existing financial commands and Engine. */
export function materializeDraft(store: Store, body: DraftBodyDTO) {
    let next = structuredClone(store);
    const g = body.goal;
    const existing = store.goals.find(goal => goal.id === g.existingId), projection = existing?.projection;
    if (!body.scope.includes(g.account) || body.items.some(i => !body.scope.includes(i.account)))
        throw Error('Nguồn góp hoặc kế hoạch nằm ngoài phạm vi đã chọn.');
    const goalData = { ...(g.existingId ? { id: g.existingId } : {}), name: g.name, target: g.target, due: g.due, contribution: g.contribution === '0' ? '' : g.contribution, contributionAccount: g.account, contributionStart: g.start, contributionDay: String(g.day), contributionSkipMonths: JSON.stringify(g.skipMonths), criterion: projection?.criterion ?? 'savings', profile: g.profile, targetBasis: projection?.targetBasis ?? 'nominal', icon: projection?.icon ?? 'target', expenseMultiple: String(projection?.expenseMultiple ?? 25), liquidMonths: String(projection?.liquidMonths ?? 0), reason: 'Áp dụng bản nháp đã xác nhận' };
    next = applyCommand(next, { kind: 'goal', data: goalData, version: next.version, key: 'draft-goal' });
    const goalId = g.existingId ?? next.goals.at(-1)!.id, ids = [goalId];
    const links = next.planningLinks?.filter(link => link.goalId !== goalId) ?? [];
    for (const item of body.items) {
        const { ref, existingId, supportsGoal, ...values } = item;
        next = applyCommand(next, { kind: 'plan', data: { ...Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v === null ? '' : String(v)])), ...(existingId ? { id: existingId } : {}), reason: 'Bản nháp liên kết mục tiêu' }, version: next.version, key: ref });
        const planId = existingId ?? next.plans.at(-1)!.id;
        ids.push(planId);
        if (supportsGoal)
            links.push({ goalId, planId, relation: 'supports' });
    }
    if (body.priority === 'goal_first')
        next.goals = [next.goals.find(g => g.id === goalId)!, ...next.goals.filter(g => g.id !== goalId)];
    next.planningLinks = links;
    next.version = store.version + 1;
    next.audit = [...store.audit, 'v' + next.version + ' · Xác nhận đồng thời mục tiêu, kế hoạch và liên kết: ' + ids.join(', ') + '. Không ghi dòng tiền thực tế.'];
    return { store: next, ids, goalId };
}
export function simulateDraft(store: Store, body: DraftBodyDTO) {
    const materialized = materializeDraft(store, body);
    const months = Math.max(1, Math.min(360, Math.ceil((Date.parse(body.goal.due) - Date.parse(store.clock.slice(0, 10))) / 2629800000) + 1));
    const reserveMonths = D(body.expense).gt(0) ? D(body.reserve).div(body.expense).toNumber() : 0;
    if (D(body.expense).isZero() && D(body.reserve).gt(0))
        throw Error('Nhập chi tiêu hàng tháng để bảo vệ quỹ dự phòng trong mô phỏng.');
    if (reserveMonths > 24)
        throw Error('Quỹ dự phòng vượt 24 tháng chi tiêu. Điều chỉnh ngân sách hoặc thời gian dự phòng.');
    const settings = normalizeForecast({ ...body.settings, months, income: body.income, expense: body.expense, reserveMonths, investSurplus: 0 });
    const result = simulateForecast(materialized.store, settings, body.scope);
    const outcome = result.goals.find(g => g.id === materialized.goalId);
    return { ...materialized, result, outcome, settings };
}
