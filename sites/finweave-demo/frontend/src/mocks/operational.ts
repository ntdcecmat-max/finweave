import { V2Request, v2Operations, DraftBody, OperationalSnapshot } from '../contracts/operational';
import type { OperationalState, AgentRunDTO, PlanningDraftDTO } from '../contracts/operational';
import type { Store } from '../domain/model';
import { applyCommand } from '../domain/commands';
import { simulateDraft } from '../domain/planning-draft';
import { snapshot, day, plannedRows } from '../domain/selectors';
import { currentPlanningPeriod } from '../domain/planning';
import { reviseDraftMessage } from '../domain/draft-message';
const uid = (prefix: string) => prefix + '_' + crypto.randomUUID(), now = () => new Date().toISOString();
export class OperationalFailure extends Error {
    constructor(public code: string, message: string, public status = 422) { super(message); }
}
function fail(code: string, message: string, status = 422): never { throw new OperationalFailure(code, message, status); }
export const instruments = [
    { id: 'VN_FPT', symbol: 'FPT', name: 'Công ty cổ phần FPT', exchange: 'HOSE', currency: 'VND' as const, unit: 'share' as const, supported: true },
    { id: 'VN_VCB', symbol: 'VCB', name: 'Ngân hàng Vietcombank', exchange: 'HOSE', currency: 'VND' as const, unit: 'share' as const, supported: true },
    { id: 'VN_HPG', symbol: 'HPG', name: 'Tập đoàn Hòa Phát', exchange: 'HOSE', currency: 'VND' as const, unit: 'share' as const, supported: true },
    { id: 'US_FPT', symbol: 'FPT', name: 'Mã trùng tên ở thị trường khác', exchange: 'Ngoài thị trường hỗ trợ', currency: 'VND' as const, unit: 'share' as const, supported: false }
];
export const goldProfiles = [
    { id: 'G_RING_BUY', name: 'Nhẫn trơn 9999 · giá mua vào', product: 'Nhẫn trơn', purity: '9999', source: 'Bảng giá minh họa trong nước', side: 'buy' as const, currency: 'VND' as const, unit: 'chi' as const },
    { id: 'G_SJC_BUY', name: 'Vàng miếng SJC 9999 · giá mua vào', product: 'Vàng miếng SJC', purity: '9999', source: 'Bảng giá minh họa trong nước', side: 'buy' as const, currency: 'VND' as const, unit: 'chi' as const }
];
export const liveGoldProfiles = [
    { ...goldProfiles[0], id: 'G_PNJ_RING_BUY', name: 'Nhẫn trơn PNJ 9999 · PNJ TP.HCM mua vào', product: 'Nhẫn trơn PNJ', source: 'PNJ · TP.HCM · mua vào · VND/chỉ' },
    { ...goldProfiles[1], id: 'G_PNJ_SJC_BUY', name: 'Vàng miếng SJC 9999 · PNJ TP.HCM mua vào', source: 'PNJ · TP.HCM · mua vào · VND/chỉ' },
    { ...goldProfiles[0], name: 'Nhẫn tròn trơn Rồng Thăng Long 9999 · BTMC mua vào (nguồn cloud đang gián đoạn)', product: 'Nhẫn tròn trơn Rồng Thăng Long', source: 'BTMC · mua vào · VND/chỉ' },
    { ...goldProfiles[1], name: 'Vàng miếng SJC 9999 · BTMC mua vào', source: 'BTMC · mua vào · VND/chỉ' }
];
const emptyState = (): OperationalState => ({ devices: [], bindings: [], support: [{ packageName: 'test.finweave.bank', name: 'Ngân hàng minh họa', parserProfileId: 'SYNTHETIC_BANK_V1', supported: true, reason: 'Chỉ thông báo tổng hợp để dựng prototype; chưa xác minh app ngân hàng thật.' }, { packageName: 'test.finweave.wallet', name: 'Ví minh họa', parserProfileId: 'SYNTHETIC_WALLET_V1', supported: true, reason: 'Chỉ dữ liệu minh họa.' }, { packageName: 'unsupported', name: 'Ngân hàng / ví khác', parserProfileId: 'UNSUPPORTED', supported: false, reason: 'Chưa có bộ đọc đã kiểm chứng. Sử dụng nhập tay hoặc CSV.' }], receipts: [], priceJobs: [], runs: [], drafts: [], dailyPriceSchedule: 'Lịch đích: 18:00 hằng ngày (GMT+7). Prototype chưa có tác vụ nền trên máy chủ.', synthetic: true });
type Host = {
    prices?: (catalogs: string[]) => Promise<Record<string, { quote?: { price: string; currency: 'VND'; unit: 'share' | 'chi'; date: string; source: string }; error?: string }>>;
    get: () => Store;
    replace: (s: Store) => void;
    conversation: (id: string) => void;
};
export class OperationalRepository {
    private state = emptyState();
    private keys = new Map<string, {
        signature: string;
        value: unknown;
    }>();
    private holdingPreviews = new Map<string, {
        input: string;
        version: number;
        expires: number;
    }>();
    private catalogs = new Map<string, string>();
    reset() { this.state = emptyState(); this.keys.clear(); this.holdingPreviews.clear(); this.catalogs.clear(); }
    private async digest(value: unknown) { const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(value))); return Array.from(new Uint8Array(bytes), v => v.toString(16).padStart(2, '0')).join(''); }
    async dispatch(raw: unknown, host: Host) {
        const request = V2Request.parse(raw), operation = request.operation, input = v2Operations[operation].input.parse(request.input) as any;
        const signature = JSON.stringify({ operation, input, version: request.expectedWorkspaceVersion }), key = request.idempotencyKey, read = ['getState', 'searchInstruments', 'getGoldProfiles'].includes(operation);
        if (!read && !key)
            fail('VALIDATION', 'Thiếu mã yêu cầu để thử lại an toàn.');
        const prior = key ? this.keys.get(key) : null;
        if (prior) {
            if (prior.signature !== signature)
                fail('IDEMPOTENCY_CONFLICT', 'Mã yêu cầu đã được dùng cho nội dung khác.', 409);
            return this.reply(request, structuredClone(prior.value), host.get().version);
        }
        const store = host.get();
        if (!read && store.fault === 'conflict') fail('VERSION_CONFLICT','Dữ liệu đã thay đổi. Tải lại rồi xem dự tính mới.',409);
        if (!read && store.fault === 'offline')
            fail('OFFLINE', 'Không kết nối được. Giữ bản nháp để thử lại.', 503);
        if (!read && store.fault === 'timeout')
            fail('TIMEOUT', 'Chưa xác định kết quả. Thử lại cùng yêu cầu.', 503);
        if (!read && request.expectedWorkspaceVersion !== store.version)
            fail('VERSION_CONFLICT', 'Dữ liệu đã thay đổi. Tải lại rồi xem dự tính mới.', 409);
        if (operation === 'startAgentRun' && store.fault === 'quota')
            fail('RATE_LIMITED', 'Đã hết hạn mức xử lý. Bạn có thể lập kế hoạch thủ công.', 429);
        let result: unknown;
        switch (operation) {
            case 'getState':
                if (host.prices) this.state.dailyPriceSchedule = 'Tự kiểm tra mỗi phút khi app đang mở · SSI iBoard / PNJ / BTMC · có thể có độ trễ từ nguồn.';
                this.advance(host);
                result = OperationalSnapshot.parse(this.state);
                break;
            case 'searchInstruments':
                result = instruments.filter(i => (i.symbol + ' ' + i.name).toLocaleLowerCase('vi').includes(input.query.toLocaleLowerCase('vi')));
                break;
            case 'getGoldProfiles':
                result = host.prices ? liveGoldProfiles : goldProfiles;
                break;
            case 'previewHolding': {
                const c = this.catalog(input, !!host.prices);
                if (input.existingId) {
                    const h = store.holdings.find(h => h.id === input.existingId && !h.archived);
                    if (!h || h.kind !== input.kind || h.quantity !== input.quantity || h.date !== input.date)
                        fail('VERSION_CONFLICT', 'Thông tin tài sản đã thay đổi. Mở lại để xác nhận mã hoặc bảng giá.', 409);
                }
                applyCommand(store, { kind: 'holding', version: store.version, key: uid('VALIDATE'), data: this.holdingData(input, c) });
                const token = uid('HP');
                this.holdingPreviews.set(token, { input: JSON.stringify(input), version: store.version, expires: Date.now() + 600000 });
                result = { token, expiresAt: new Date(Date.now() + 600000).toISOString(), name: c.name, unit: input.kind === 'stock' ? 'cổ phiếu' : 'chỉ', version: store.version };
                break;
            }
            case 'confirmHolding': {
                const { token, ...body } = input, p = this.holdingPreviews.get(token);
                if (!p || p.expires < Date.now())
                    fail('PREVIEW_EXPIRED', 'Dự tính đã hết hạn. Xem lại trước khi lưu.', 409);
                if (p.version !== store.version || p.input !== JSON.stringify(body))
                    fail('PREVIEW_MISMATCH', 'Nội dung đã thay đổi. Xem lại dự tính.', 409);
                const c = this.catalog(body, !!host.prices);
                let next: Store, holding: Store['holdings'][number];
                if (body.existingId) {
                    next = structuredClone(store);
                    const h = next.holdings.find(h => h.id === body.existingId && !h.archived);
                    if (!h || h.kind !== body.kind || h.quantity !== body.quantity || h.date !== body.date)
                        fail('VERSION_CONFLICT', 'Số lượng hoặc thông tin tài sản đã thay đổi.', 409);
                    holding = h;
                    const metadata = this.holdingData(body, c);
                    h.name = metadata.name;
                    h.market = metadata.market;
                    h.product = metadata.product;
                    h.purity = metadata.purity;
                    if (this.catalogs.get(h.id) !== c.id)
                        h.quotes = h.quotes.map(q => ({ ...q, compatible: false }));
                    next.version++;
                    next.audit.push('Xác nhận mã / bảng giá của ' + h.id + '; giữ số lượng và lịch sử.');
                }
                else {
                    next = applyCommand(store, { kind: 'holding', data: this.holdingData(body, c), version: store.version, key: key! });
                    holding = next.holdings.at(-1)!;
                }
                this.catalogs.set(holding.id, c.id);
                host.replace(next);
                result = { id: holding.id, version: next.version };
                break;
            }
            case 'requestPriceRefresh': {
                const pending = this.state.priceJobs.find(j => j.status === 'queued' || j.status === 'running');
                if (pending) {
                    pending.coalesced = true; result = pending;
                    break;
                }
                const last = this.state.priceJobs.at(-1);
                if (!host.prices && last && Date.now() - Date.parse(last.requestedAt) < 30000)
                    fail('RATE_LIMITED', 'Vui lòng chờ 30 giây giữa hai lần cập nhật giá.', 429);
                const ids = input.holdingIds.length ? input.holdingIds : store.holdings.filter(h => !h.archived).map(h => h.id);
                if (!ids.length)
                    fail('VALIDATION', 'Thêm tài sản trước khi cập nhật giá.');
                for (const id of ids)
                    if (!store.holdings.some(h => h.id === id && !h.archived))
                        fail('NOT_FOUND', 'Tài sản không còn được theo dõi.', 404);
                const job: OperationalState['priceJobs'][number] = { id: uid('PRICE'), status: 'queued', requestedAt: now(), fetchedAt: null, quoteAsOf: null, due: Date.now() + 1600, results: ids.map((holdingId: string) => ({ holdingId, state: 'retained', reason: 'Đang chờ cập nhật.' })), retryAfter: new Date(Date.now() + 30000).toISOString(), coalesced: false };
                this.state.priceJobs.push(job);
                if (host.prices) {
                    job.retryAfter = null;
                    const catalogFor = (h: Store['holdings'][number]) => this.catalogs.get(h.id) ?? (h.kind === 'stock' && h.market === 'HOSE' && instruments.some(i => i.supported && i.symbol === h.name) ? 'VN_' + h.name : undefined);
                    const selected = store.holdings.filter(h => ids.includes(h.id));
                    const connected = store.sources.find(s => s.kind === 'price')?.connection;
                    const quotes = await host.prices(connected && connected !== 'connected' ? [] : selected.map(h => catalogFor(h) ?? '').filter(Boolean));
                    const next = structuredClone(store), fetched = now();
                    const businessNow = new Date(Date.now() + 7 * 3600000).toISOString().replace('Z', '+07:00');
                    next.clock = Date.parse(next.clock) > Date.parse(fetched) ? next.clock : businessNow;
                    let updated = 0;
                    const observations: string[] = [];
                    job.results = job.results.map(row => {
                        const h = next.holdings.find(h => h.id === row.holdingId)!, catalog = catalogFor(h), value = catalog ? quotes[catalog] : undefined;
                        const retained = (reason: string) => ({ ...row, state: h.quotes.length ? 'retained' as const : 'missing' as const, reason });
                        const source = next.sources.find(s => s.kind === 'price');
                        if (source && source.connection !== 'connected') return retained('Nguồn giá đã ngắt kết nối. Giữ lịch sử giá.');
                        if (!catalog) return retained('Xác nhận đúng mã / sàn hoặc bảng giá vàng đã chọn để lấy giá thật.');
                        const q = value?.quote;
                        if (!q || q.unit !== h.unit) return retained(value?.error ?? 'Nguồn chưa có giá tương thích. Giữ giá gần nhất.');
                        const latest = h.quotes.filter(q => q.compatible).sort((a, b) => Date.parse(b.date) - Date.parse(a.date))[0];
                        if (latest && Date.parse(latest.date) > Date.parse(q.date)) return retained('Báo giá từ nguồn cũ hơn giá đang có; giữ giá gần nhất.');
                        if (!h.quotes.some(old => old.date === q.date && old.source === q.source && old.price === q.price)) h.quotes.push({ ...q, compatible: true });
                        observations.push(q.date); updated++;
                        return { ...row, state: 'updated', reason: q.source + ' · ' + Number(q.price).toLocaleString('vi-VN') + (h.unit === 'chi' ? ' ₫/chỉ' : ' ₫/cổ phiếu') };
                    });
                    const source = next.sources.find(s => s.kind === 'price');
                    if (source) { source.name = 'SSI iBoard / BTMC · giá thị trường'; source.lastAttempt = fetched; source.version++; if (updated) { source.lastSuccess = fetched; source.error = undefined; } else source.error = 'Chưa lấy được giá tương thích; giữ giá gần nhất.'; }
                    next.version++; next.audit.push('Kiểm tra giá thị trường SSI iBoard / BTMC; giữ nguyên số lượng và tiền.'); host.replace(next);
                    job.fetchedAt = fetched; job.quoteAsOf = observations.sort()[0] ?? null;
                    job.status = updated === job.results.length ? 'succeeded' : updated ? 'partial' : 'failed';
                    job.due = Date.now();
                    this.state.priceJobs = this.state.priceJobs.slice(-50);
                    const retainedJobs = new Set(this.state.priceJobs.map(j => j.id));
                    for (const [oldKey, entry] of this.keys) if (entry.signature.startsWith('{"operation":"requestPriceRefresh"') && !retainedJobs.has((entry.value as { id: string }).id)) this.keys.delete(oldKey);
                }
                result = job;
                break;
            }
            case 'registerExampleDevice': {
                const existing = this.state.devices.find(d => d.status === 'active');
                if (existing) {
                    result = existing;
                    break;
                }
                const device: OperationalState['devices'][number] = { id: uid('DEVICE'), name: 'Điện thoại minh họa', appVersion: 'prototype-0.3', consentVersion: 'synthetic-2026-10', version: 1, status: 'active', permission: 'granted', network: 'online', lastSeen: now(), lastObserved: null, lastAck: null, pending: 0, gaps: ['Dữ liệu minh họa không chứng minh kết nối với điện thoại hoặc ngân hàng thật.'], synthetic: true };
                this.state.devices.push(device);
                result = device;
                break;
            }
            case 'bindCollector': {
                const device = this.device(input.deviceId);
                if (device.version !== input.expectedVersion)
                    fail('VERSION_CONFLICT', 'Thiết bị đã đổi. Tải lại để chọn nguồn.', 409);
                const support = this.state.support.find(s => s.packageName === input.packageName && s.parserProfileId === input.parserProfileId && s.supported);
                if (!support)
                    fail('VALIDATION', 'Nguồn này chưa được hỗ trợ.');
                const account = store.accounts.find(a => a.id === input.accountId && !a.archived && a.kind !== 'cash');
                if (!account)
                    fail('VALIDATION', 'Chọn tài khoản ngân hàng hoặc ví đang theo dõi.');
                let binding = this.state.bindings.find(b => b.deviceId === device.id && b.packageName === input.packageName);
                if (binding) {
                    binding.accountId = input.accountId;
                    binding.enabled = true;
                    binding.version++;
                }
                else {
                    binding = { id: uid('BIND'), deviceId: device.id, packageName: input.packageName, accountId: input.accountId, parserProfileId: input.parserProfileId, version: 1, enabled: true };
                    this.state.bindings.push(binding);
                }
                device.version++;
                result = binding;
                break;
            }
            case 'testCollector': {
                const device = this.device(input.deviceId), binding = this.state.bindings.find(b => b.id === input.bindingId && b.deviceId === device.id && b.enabled);
                if (!binding)
                    fail('VALIDATION', 'Chưa gắn tài khoản cho nguồn này.');
                const reviewId = uid('REVIEW'), receipt: OperationalState['receipts'][number] = { id: uid('RECEIPT'), deviceId: device.id, source: binding.packageName, parserVersion: binding.parserProfileId, observedAt: now(), ackAt: now(), state: 'needs_review', eventId: null, reviewId, reason: 'Thông báo minh họa thiếu số tiền và hướng tiền. Cần người dùng bổ sung; chưa ghi sổ.' };
                const next = structuredClone(store);
                next.reviews.push({ id: reviewId, type: 'invalid', title: 'Thông báo cần kiểm tra thông tin', status: 'open', account: binding.accountId, history: ['Receipt ' + receipt.id + ' · nguồn ' + binding.packageName + ' · parser ' + binding.parserProfileId + ' · thiếu số tiền / hướng tiền; không có nội dung thông báo thô.'] });
                next.version++;
                next.audit.push('Tiếp nhận bằng chứng minh họa, tạo Review; không ghi tiền.');
                host.replace(next);
                device.lastObserved = receipt.observedAt;
                device.lastAck = receipt.ackAt;
                device.lastSeen = now();
                device.version++;
                this.state.receipts.push(receipt);
                result = receipt;
                break;
            }
            case 'revokeDevice': {
                const device = this.device(input.id);
                if (device.version !== input.expectedVersion)
                    fail('VERSION_CONFLICT', 'Thiết bị đã thay đổi. Kiểm tra lại trước khi thu hồi.', 409);
                device.status = 'revoked';
                device.permission = 'unknown';
                device.version++;
                for (const b of this.state.bindings.filter(b => b.deviceId === device.id))
                    b.enabled = false;
                result = device;
                break;
            }
            case 'startAgentRun': {
                host.conversation(input.conversationId);
                if (input.context.snapshotVersion !== store.version)
                    fail('VERSION_CONFLICT', 'Ngữ cảnh đã cũ. Mở lại yêu cầu từ dữ liệu hiện tại.', 409);
                for (const id of input.context.scope)
                    if (!store.accounts.some(a => a.id === id))
                        fail('FORBIDDEN', 'Tài khoản ngoài phạm vi.', 403);
                if (input.goalId && !store.goals.some(g => g.id === input.goalId && g.status === 'active'))
                    fail('NOT_FOUND', 'Mục tiêu không còn hoạt động.', 404);
                const run: AgentRunDTO = { id: uid('RUN'), conversationId: input.conversationId, version: 1, intent: input.intent, state: 'queued', baseVersion: store.version, context: input.context, goalId: input.goalId, settings: input.settings, questionId: null, draftId: null, summary: 'Đang xếp yêu cầu vào hàng đợi minh họa.', steps: [], evidence: [], createdAt: now(), due: Date.now() + 1000, toolCalls: 0 };
                this.state.runs.push(run);
                result = run;
                break;
            }
            case 'answerAgentRun': {
                const run = this.run(input.id);
                if (run.version !== input.expectedVersion || run.state !== 'awaiting_user' || run.questionId !== input.questionId)
                    fail('VERSION_CONFLICT', 'Câu hỏi đã thay đổi. Tải lại tiến trình.', 409);
                if (run.baseVersion !== store.version)
                    fail('STALE_PROPOSAL', 'Dữ liệu mới đã xuất hiện. Bắt đầu lại với dữ liệu hiện tại.', 409);
                const body = DraftBody.parse(input.body);
                if (body.goal.existingId !== run.goalId)
                    fail('VALIDATION', 'Mục tiêu không khớp yêu cầu.');
                simulateDraft(store, body);
                const draft: PlanningDraftDTO = { id: uid('DRAFT'), runId: run.id, conversationId: run.conversationId, version: 1, baseVersion: store.version, state: 'draft', body, revisions: ['v1 · Ràng buộc do người dùng xác nhận.'], createdAt: now(), confirmedIds: [], preview: null };
                this.state.drafts.push(draft);
                run.state = 'draft_ready';
                run.summary = 'Đã tạo bản nháp liên kết. Mô phỏng theo ràng buộc đã nhập; chưa áp dụng.';
                run.version++;
                run.toolCalls += 2;
                run.steps.push('Tạo bản nháp, kiểm tra bằng Financial Engine.');
                run.draftId = draft.id;
                result = draft;
                break;
            }
            case 'cancelAgentRun': {
                const run = this.run(input.id);
                if (run.version !== input.expectedVersion)
                    fail('VERSION_CONFLICT', 'Tiến trình đã thay đổi. Tải lại trạng thái.', 409);
                if (!['completed', 'failed', 'cancelled'].includes(run.state)) {
                    run.state = 'cancelled';
                    run.summary = 'Đã dừng yêu cầu. Bản nháp đã tạo vẫn chưa áp dụng.';
                    run.version++;
                }
                result = run;
                break;
            }
            case 'reviseDraft': {
                const draft = this.editableDraft(input.id, input.expectedVersion);
                DraftBody.parse(input.body);
                simulateDraft(store, input.body);
                draft.body = input.body;
                draft.version++;
                draft.state = 'draft';
                draft.preview = null;
                draft.revisions.push('v' + draft.version + ' · ' + input.reason);
                result = draft;
                break;
            }
            case 'reviseDraftByMessage': {
                const draft = this.editableDraft(input.id, input.expectedVersion);
                const body = DraftBody.parse(reviseDraftMessage(draft.body, input.text));
                simulateDraft(store, body);
                draft.body = body;
                draft.version++;
                draft.state = 'draft';
                draft.preview = null;
                draft.revisions.push('v' + draft.version + ' · Hội thoại: ' + input.text);
                const run = this.run(draft.runId!);
                run.summary = 'Đã sửa bản nháp theo yêu cầu trong hội thoại. Dự tính cũ đã được hủy; chưa áp dụng.';
                run.version++;
                result = draft;
                break;
            }
            case 'refreshDraft': {
                const draft = this.editableDraft(input.id, input.expectedVersion);
                simulateDraft(store, draft.body);
                draft.baseVersion = store.version;
                draft.version++;
                draft.state = 'draft';
                draft.preview = null;
                draft.revisions.push('v' + draft.version + ' · Tính lại từ dữ liệu hiện tại.');
                result = draft;
                break;
            }
            case 'previewPlanningDraft': {
                const draft = this.editableDraft(input.id, input.expectedVersion);
                if (draft.baseVersion !== store.version)
                    fail('STALE_PROPOSAL', 'Bản nháp đang dùng dữ liệu cũ. Tính lại trước khi xem thay đổi.', 409);
                simulateDraft(store, draft.body);
                draft.preview = { token: uid('PREVIEW'), digest: await this.digest(draft.body), expiresAt: new Date(Date.now() + 600000).toISOString(), version: store.version };
                draft.state = 'previewed';
                result = draft;
                break;
            }
            case 'confirmPlanningDraft': {
                const draft = this.editableDraft(input.id, input.expectedVersion), p = draft.preview;
                if (!p || Date.parse(p.expiresAt) <= Date.now())
                    fail('PREVIEW_EXPIRED', 'Dự tính đã hết hạn. Xem thay đổi lại.', 409);
                if (draft.baseVersion !== store.version || p.version !== store.version || p.token !== input.token || p.digest !== input.digest || p.digest !== await this.digest(draft.body))
                    fail('PREVIEW_MISMATCH', 'Dự tính không còn khớp bản nháp hoặc dữ liệu hiện tại.', 409);
                const materialized = simulateDraft(store, draft.body);
                host.replace(materialized.store);
                draft.confirmedIds = materialized.ids;
                draft.state = 'confirmed';
                draft.version++;
                const run = this.run(draft.runId!);
                run.state = 'completed';
                run.summary = 'Người dùng đã xác nhận áp dụng mục tiêu, kế hoạch và liên kết. Không có giao dịch thực tế mới.';
                run.version++;
                result = draft;
                break;
            }
        }
        const parsed = v2Operations[operation].output.parse(result);
        if (key)
            this.keys.set(key, { signature, value: structuredClone(parsed) });
        return this.reply(request, parsed, host.get().version);
    }
    private reply(request: {
        requestId: string;
    }, data: unknown, version: number) { return { contractVersion: '2.0.0', requestId: request.requestId, workspaceVersion: version, data }; }
    private catalog(input: any, live = false) { let c: any = input.kind === 'stock' ? instruments.find(i => i.id === input.catalogId && i.supported) : (live ? liveGoldProfiles : goldProfiles).find(p => p.id === input.catalogId); if (!c)
        fail('VALIDATION', 'Chọn mã hoặc loại vàng được hỗ trợ.'); if (input.kind === 'gold' && !input.profileConfirmed)
        fail('VALIDATION', 'Xác nhận loại vàng, độ tinh khiết và bảng giá trước khi nhập lượng.'); return c; }
    private holdingData(input: any, c: any) { return { kind: input.kind, name: input.kind === 'stock' ? c.symbol : c.product, quantity: input.quantity, unit: input.kind === 'stock' ? 'share' : 'chi', market: input.kind === 'stock' ? c.exchange : c.source, product: input.kind === 'gold' ? c.product : 'Cổ phiếu', purity: input.kind === 'gold' ? c.purity : '', date: input.date, cost: input.cost ?? '' }; }
    private device(id: string) { const d = this.state.devices.find(d => d.id === id && d.status === 'active'); if (!d)
        fail('FORBIDDEN', 'Thiết bị đã thu hồi hoặc không thuộc phiên này.', 403); return d; }
    private run(id: string) { const run = this.state.runs.find(r => r.id === id); if (!run)
        fail('NOT_FOUND', 'Không tìm thấy yêu cầu.', 404); return run; }
    private editableDraft(id: string, version: number) { const d = this.state.drafts.find(d => d.id === id); if (!d)
        fail('NOT_FOUND', 'Không tìm thấy bản nháp.', 404); if (d.version !== version || ['confirmed', 'superseded'].includes(d.state))
        fail('VERSION_CONFLICT', 'Bản nháp đã thay đổi hoặc đã áp dụng.', 409); return d; }
    private advance(host: Host) {
        for (const receipt of this.state.receipts.filter(r => r.state === 'needs_review')) {
            const review = host.get().reviews.find(r => r.id === receipt.reviewId);
            if (review?.status !== 'resolved')
                continue;
            const event = host.get().events.find(e => e.id === review.event && e.posting === 'posted');
            if (event) {
                receipt.state = 'posted';
                receipt.eventId = event.id;
                receipt.reason = 'Đã ghi sổ sau khi người dùng bổ sung và xác nhận.';
            }
            else {
                receipt.state = 'ignored';
                receipt.reason = 'Đã xử lý và không tạo giao dịch.';
            }
        }
        for (const run of this.state.runs) {
            if (run.state === 'queued') {
                run.state = 'reading';
                run.version++;
                run.summary = 'Đang kiểm tra thu nhập, chi tiêu, kế hoạch và dữ liệu còn thiếu.';
                continue;
            }
            if (run.state !== 'reading' || Date.now() < run.due)
                continue;
            const s = host.get();
            if (s.version !== run.baseVersion) {
                run.state = 'partial';
                run.summary = 'Dữ liệu đã thay đổi trong lúc đọc. Bắt đầu lại để dùng dữ liệu mới.';
                run.version++;
                continue;
            }
            const snap = snapshot(s, currentPlanningPeriod(s, run.context.scope));
            run.evidence = [...snap.events.map(e => e.id), ...s.plans.filter(p => !p.archived).map(p => p.id)];
            run.toolCalls = 3;
            run.steps = ['Đọc số dư và giao dịch trong phạm vi đã chọn.', 'Đối chiếu kế hoạch và chất lượng nguồn dữ liệu.'];
            if (run.intent === 'investigation') {
                const overspend = s.plans.filter(p => plannedRows(s, p).some(r => Number(r.actual) > Number(r.amount)));
                const gaps = this.state.devices.some(d => d.gaps.length) || snap.holdings.some(h => h.issue || h.stalePrice);
                run.state = 'completed';
                run.summary = overspend.length ? `Có ${overspend.length} kế hoạch vượt dự kiến. Mở giao dịch liên kết để kiểm tra, hoặc tạo bản nháp điều chỉnh.` : gaps ? 'Chưa đủ độ phủ hoặc có giá cũ để kết luận đầy đủ. Kiểm tra Nguồn dữ liệu và các giao dịch trước khi điều chỉnh.' : 'Chưa thấy kế hoạch vượt dự kiến trong dữ liệu đã ghi. Giao dịch chuyển nội bộ và tăng giá tài sản không được coi là thu nhập mới.';
            }
            else {
                run.state = 'awaiting_user';
                run.questionId = uid('QUESTION');
                run.summary = 'Bạn muốn đạt điều gì, vào lúc nào, và cần giữ lại bao nhiêu tiền dự phòng? Xác nhận ngân sách để mình lập bản nháp.';
            }
            run.version++;
        }
        for (const job of this.state.priceJobs) {
            if (host.prices && ['queued', 'running'].includes(job.status)) {
                job.status = 'failed'; job.fetchedAt = now();
                job.results = job.results.map(row => ({ ...row, state: 'retained', reason: 'Tác vụ minh họa cũ đã dừng. Yêu cầu lại để lấy giá thị trường.' }));
                continue;
            }
            if (job.status === 'queued') {
                job.status = 'running';
                continue;
            }
            if (job.status !== 'running' || Date.now() < job.due)
                continue;
            const s = host.get(), next = structuredClone(s);
            let updates = 0;
            job.results = job.results.map(row => { const h = next.holdings.find(h => h.id === row.holdingId); if (!h || h.archived)
                return { ...row, state: 'retained', reason: 'Tài sản đã lưu trữ; giữ lịch sử.' }; const source = s.sources.find(s => s.kind === 'price'); if (source && source.connection !== 'connected')
                return { ...row, state: h.quotes.length ? 'retained' : 'missing', reason: 'Nguồn giá chưa kết nối. Giữ giá tốt gần nhất.' }; const catalog = this.catalogs.get(h.id), price = ({ VN_FPT: '95000', VN_VCB: '85000', VN_HPG: '26000', G_RING_BUY: '8500000', G_SJC_BUY: '9000000' } as Record<string, string>)[catalog ?? '']; if (!price)
                return { ...row, state: h.quotes.length ? 'retained' : 'missing', reason: 'Chưa xác nhận mã / bảng giá tương thích. Giữ dữ liệu đã có.' }; h.quotes.push({ price, currency: 'VND', unit: h.unit, date: s.clock, source: 'Giá minh họa · ' + catalog, compatible: true }); updates++; return { ...row, state: 'updated', reason: 'Đã cập nhật từ bảng giá minh họa, không phải giá thị trường thật.' }; });
            if (updates) {
                next.version++;
                next.audit.push('Cập nhật giá minh họa; giữ nguyên số lượng và tiền.');
                host.replace(next);
            }
            job.fetchedAt = now();
            job.quoteAsOf = updates ? s.clock : null;
            job.status = updates === job.results.length ? 'succeeded' : updates ? 'partial' : 'failed';
        }
    }
}
