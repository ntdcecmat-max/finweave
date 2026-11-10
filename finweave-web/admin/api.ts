import { AdminSession, OpsAction, OpsPreview, OpsSnapshot } from './contracts';
import type { AdminSessionDTO, OpsState, OpsActionInput, OpsPreviewDTO } from './contracts';
import {realCall,requestOptions,invalidateTransport} from '../src/services/real-transport';
const now = () => new Date().toISOString(), uid = (prefix: string) => prefix + '_' + crypto.randomUUID();
class AdminFailure extends Error {
    constructor(message: string, public code: string) { super(message); }
}
function fail(message: string, code: string): never { throw new AdminFailure(message, code); }
// This adapter contains operational DTOs only. It imports no user store, finance service or fixtures.
class SyntheticOperationsGateway {
    private sessions = new Map<string, AdminSessionDTO>();
    private previews = new Map<string, OpsPreviewDTO>();
    private keys = new Map<string, {
        signature: string;
        result: OpsState;
    }>();
    private state: OpsState = OpsSnapshot.parse({ version: 1, environment: 'synthetic', build: 'ops-prototype-0.3', asOf: now(), sources: [{ id: 'OPS_BANK', name: 'Nguồn ngân hàng minh họa', packageName: 'test.finweave.bank', parserVersion: 'SYNTHETIC_BANK_V1', appCompatibility: 'Ứng dụng thông báo kiểm tra', status: 'enabled', bindings: 2, version: 1, lastSuccess: now(), errorCode: null }, { id: 'OPS_WALLET', name: 'Nguồn ví minh họa', packageName: 'test.finweave.wallet', parserVersion: 'SYNTHETIC_WALLET_V1', appCompatibility: 'Ứng dụng thông báo kiểm tra', status: 'degraded', bindings: 1, version: 1, lastSuccess: null, errorCode: 'PARSER_UNSUPPORTED' }, { id: 'OPS_PRICE', name: 'Nguồn giá minh họa', packageName: 'price.synthetic', parserVersion: 'SYNTHETIC_PRICE_V1', appCompatibility: 'VND · cổ phiếu / chỉ vàng', status: 'enabled', bindings: 3, version: 1, lastSuccess: now(), errorCode: null }], jobs: [{ id: 'JOB_01', type: 'price_refresh', state: 'failed', sourceId: 'OPS_PRICE', version: 1, attempts: 2, leaseUntil: null, requestedAt: now(), updatedAt: now(), errorCode: 'UPSTREAM_UNAVAILABLE', requestId: 'REQ_01' }, { id: 'JOB_02', type: 'ingestion', state: 'running', sourceId: 'OPS_BANK', version: 1, attempts: 1, leaseUntil: new Date(Date.now() + 600000).toISOString(), requestedAt: now(), updatedAt: now(), errorCode: null, requestId: 'REQ_02' }, { id: 'JOB_03', type: 'sync', state: 'succeeded', sourceId: 'OPS_BANK', version: 1, attempts: 1, leaseUntil: null, requestedAt: now(), updatedAt: now(), errorCode: null, requestId: 'REQ_03' }], accounts: [{ id: 'SAAS_001', workspaceId: 'WORKSPACE_001', status: 'active', devices: [{ id: 'DEVICE_001', appVersion: 'prototype-0.3', lastSeen: now(), health: 'online' }] }, { id: 'SAAS_002', workspaceId: 'WORKSPACE_002', status: 'active', devices: [{ id: 'DEVICE_002', appVersion: 'prototype-0.3', lastSeen: now(), health: 'unknown' }] }], quotas: [{ id: 'QUOTA_PRICE', name: 'Tác vụ cập nhật giá', used: 24, limit: 100, resetAt: new Date(Date.now() + 86400000).toISOString(), cooldownUntil: null }, { id: 'QUOTA_AGENT', name: 'Lượt xử lý trợ lý', used: 8, limit: 50, resetAt: new Date(Date.now() + 86400000).toISOString(), cooldownUntil: null }], releases: [{ id: 'RELEASE_03', versionName: '0.3 · đang chuẩn bị', channel: 'Nội bộ', publishedAt: null, artifact: null, compatibility: 'Android / OEM chưa kiểm chứng', testState: 'not_run' }], incidents: [{ id: 'INC_01', severity: 'warning', sourceId: 'OPS_WALLET', code: 'PARSER_UNSUPPORTED', status: 'open', createdAt: now() }, { id: 'INC_02', severity: 'warning', sourceId: 'OPS_PRICE', code: 'UPSTREAM_UNAVAILABLE', status: 'open', createdAt: now() }], audit: [] });
    private require(id: string) { const session = this.sessions.get(id); if (!session || session.expiresAt <= Date.now())
        fail('Phiên quản trị hết hạn. Mở lại phiên minh họa.', 'UNAUTHENTICATED'); if (session.role !== 'admin')
        fail('Không có quyền quản trị.', 'FORBIDDEN'); return session; }
    private gate() { if ((import.meta.env.VITE_ADMIN_DATA_MODE ?? 'synthetic_mock') !== 'synthetic_mock')
        fail('Kết nối quản trị thật chưa được cấu hình. Không chuyển sang dữ liệu minh họa.', 'TRANSPORT_NOT_READY'); }
    async signIn(_credentials?:{email:string;password:string;mfaCode:string}) { this.gate(); const session = AdminSession.parse({ id: uid('ADMIN_SESSION'), subjectId: 'ADMIN_SYNTHETIC', role: 'admin', expiresAt: Date.now() + 900000, synthetic: true }); this.sessions.set(session.id, session); return session; }
    async signOut(id: string) { this.sessions.delete(id); for (const [token, p] of this.previews)
        if (token.startsWith(id))
            this.previews.delete(token); }
    async snapshot(id: string) { this.gate(); this.require(id); return OpsSnapshot.parse(structuredClone(this.state)); }
    async preview(id: string, raw: OpsActionInput) {
        this.require(id);
        const action = OpsAction.parse(raw);
        const target = action.action === 'retry_job' ? this.state.jobs.find(j => j.id === action.id) : this.state.sources.find(s => s.id === action.id);
        if (!target)
            fail('Không tìm thấy đối tượng.', 'NOT_FOUND');
        if (target.version !== action.expectedVersion)
            fail('Đối tượng đã thay đổi. Tải lại rồi xác nhận lại.', 'VERSION_CONFLICT');
        let impact: string;
        if (action.action === 'retry_job') {
            const job = this.state.jobs.find(j => j.id === action.id)!;
            if (job.state !== 'failed' || job.leaseUntil && Date.parse(job.leaseUntil) > Date.now())
                fail('Chỉ thử lại tác vụ thất bại không có lease đang hoạt động.', 'ACTION_NOT_ALLOWED');
            if (this.state.sources.find(s => s.id === job.sourceId)?.status === 'disabled')
                fail('Nguồn đã tắt. Không được thử lại tác vụ.', 'ACTION_NOT_ALLOWED');
            impact = 'Đưa tác vụ thất bại vào hàng đợi. Không ép thành công hoặc thay dữ liệu tài chính.';
        }
        else {
            const source = this.state.sources.find(s => s.id === action.id)!;
            if (source.status === 'disabled')
                fail('Nguồn đã bị tắt.', 'ACTION_NOT_ALLOWED');
            impact = `Tắt nguồn cho ${source.bindings} liên kết minh họa. Tác vụ chưa chạy sẽ tạm dừng; giữ dữ liệu đã tiếp nhận.`;
        }
        const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(action)));
        const digest = Array.from(new Uint8Array(hash), b => b.toString(16).padStart(2, '0')).join('');
        const preview = OpsPreview.parse({ token: id + '_' + uid('PREVIEW'), digest, expiresAt: new Date(Date.now() + 600000).toISOString(), action, impact, snapshotVersion: this.state.version });
        this.previews.set(preview.token, preview);
        return preview;
    }
    async confirm(id: string, preview: OpsPreviewDTO, key: string) {
        const session = this.require(id), signature = JSON.stringify(preview), prior = this.keys.get(id + key);
        if (prior) {
            if (prior.signature !== signature)
                fail('Mã yêu cầu được dùng cho nội dung khác.', 'IDEMPOTENCY_CONFLICT');
            return structuredClone(prior.result);
        }
        const bound = this.previews.get(preview.token);
        if (!bound || JSON.stringify(bound) !== signature || !preview.token.startsWith(id) || Date.parse(bound.expiresAt) <= Date.now())
            fail('Dự tính đã hết hạn hoặc không khớp.', 'PREVIEW_EXPIRED');
        if (this.state.version !== bound.snapshotVersion)
            fail('Dữ liệu vận hành đã thay đổi. Xem tác động mới.', 'VERSION_CONFLICT');
        const next = structuredClone(this.state), action = bound.action;
        const source = action.action === 'disable_source' ? next.sources.find(s => s.id === action.id) : null, job = action.action === 'retry_job' ? next.jobs.find(j => j.id === action.id) : null;
        if (job) {
            if(job.version!==action.expectedVersion||job.state!=='failed'||job.leaseUntil&&Date.parse(job.leaseUntil)>Date.now()||next.sources.find(s=>s.id===job.sourceId)?.status==='disabled')fail('Tác vụ đã đổi hoặc không còn đủ điều kiện thử lại. Xem lại tác động.','VERSION_CONFLICT');
            job.state = 'queued';
            job.version++;
            job.attempts++;
            job.errorCode = null;
            job.updatedAt = now();
        }
        if (source) {
            if(source.version!==action.expectedVersion||source.status==='disabled')fail('Nguồn đã thay đổi. Xem lại tác động.','VERSION_CONFLICT');
            source.status = 'disabled';
            source.version++;
            for (const j of next.jobs.filter(j => j.sourceId === source.id && j.state === 'queued')) {
                j.state = 'paused';
                j.version++;
                j.updatedAt = now();
            }
        }
        next.version++;
        next.asOf = now();
        next.audit.push({ id: uid('AUDIT'), actorId: session.subjectId, action: action.action, objectId: action.id, reason: action.reason, fromVersion: action.expectedVersion, toVersion: action.expectedVersion + 1, result: 'succeeded', requestId: uid('REQ'), at: now() });
        const checked = OpsSnapshot.parse(next);
        this.state = checked;
        this.keys.set(id + key, { signature, result: structuredClone(checked) });
        return checked;
    }
}
export const adminDataMode=import.meta.env.VITE_ADMIN_DATA_MODE??'synthetic_mock';
class RealOperationsGateway {
 private session:AdminSessionDTO|null=null;
 private attempts=new Map<string,ReturnType<typeof requestOptions>>();
 private async call(op:string,input:unknown,mutation?:ReturnType<typeof requestOptions>){return (await realCall(op,input,{profile:'ops',workspaceId:null,mutation})).data;}
 private keyed(signature:string){let value=this.attempts.get(signature);if(!value){value=requestOptions(crypto.randomUUID(),null);this.attempts.set(signature,value);}return value;}
 async signIn(credentials?:{email:string;password:string;mfaCode:string}){if(!credentials)throw Error('Nhập email, mật khẩu và mã MFA.');const input=credentials;const data=await this.call('adminSignIn',input,this.keyed(JSON.stringify(input)));this.attempts.clear();this.session={id:data.subjectId,subjectId:data.subjectId,role:data.role,expiresAt:Date.parse(data.expiresAt),synthetic:true};return this.session;}
 async signOut(_id:string){const request=this.call('adminSignOut',{},requestOptions(crypto.randomUUID(),null));await request.finally(()=>{this.session=null;this.attempts.clear();invalidateTransport();});}
 async snapshot(_id:string){return this.call('opsStatus',{});}
 async preview(_id:string,input:OpsActionInput){return this.call('opsPreviewAction',input,this.keyed(JSON.stringify(input)));}
 async confirm(_id:string,p:OpsPreviewDTO,key:string){return this.call('opsConfirmAction',{previewToken:p.token,digest:p.digest,expectedOpsVersion:p.snapshotVersion},requestOptions(key,null,p.token,{[p.action.id]:p.action.expectedVersion}));}
 async outcome(key:string){return this.call('opsGetCommandOutcome',{operationId:'opsConfirmAction',idempotencyKey:key});}
 async reauthenticate(password:string,mfaCode:string){return this.call('adminReauthenticate',{password,mfaCode},this.keyed(JSON.stringify({password,mfaCode})));}
}
export const adminGateway=adminDataMode==='synthetic_mock'?new SyntheticOperationsGateway():new RealOperationsGateway();
export const reauthenticateAdmin=(password:string,mfaCode:string)=>(adminGateway as RealOperationsGateway).reauthenticate(password,mfaCode);
