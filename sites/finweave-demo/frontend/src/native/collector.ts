import { z } from 'zod';
const QueueItem = z.strictObject({ id: z.string(), state: z.enum(['pending', 'sending', 'retry_wait', 'quarantined']), observedAt: z.string(), source: z.string(), reason: z.string().nullable(), retryAfter: z.string().nullable() });
export const NativeStatus = z.strictObject({ permission: z.enum(['granted', 'denied', 'unknown']), consented: z.boolean(), network: z.enum(['online', 'offline', 'unknown']), enrolled: z.boolean(), ownerBound: z.boolean(), lastObserved: z.string().nullable(), lastAck: z.string().nullable(), pausedReason: z.string().nullable(), queue: z.array(QueueItem) });
export type CollectorStatus = z.infer<typeof NativeStatus>;
type Bridge = {
    getCapabilities: () => Promise<unknown>;
    getStatus: () => Promise<unknown>;
    openNotificationSettings: () => Promise<void>;
    acceptDisclosure: (v: {
        version: string;
    }) => Promise<void>;
    stopAndQuarantine: () => Promise<void>;
    retryQueue: () => Promise<void>;
    deleteQuarantined: (v: {
        reason: string;
    }) => Promise<void>;
    setSources: (v: {
        packages: string[];
    }) => Promise<void>;
};
function bridge(): Bridge | null { const cap = (window as unknown as {
    Capacitor?: {
        isNativePlatform?: () => boolean;
        Plugins?: {
            FinWeaveCollector?: Bridge;
        };
    };
}).Capacitor; return cap?.isNativePlatform?.() ? cap.Plugins?.FinWeaveCollector ?? null : null; }
const Capabilities = z.strictObject({
    bridgeRevision: z.literal('FW-NATIVE-BRIDGE-003'), apiRevision: z.literal('FW-API-T1-D1J2-005'),
    profile: z.enum(['SYNTHETIC', 'REAL']), buildId: z.string().min(1).max(120),
    requiredConsentVersion: z.string().min(1).max(120), nativeAvailable: z.literal(true),
});
let capability: z.infer<typeof Capabilities> | null = null;
export async function initializeCollector() {
    const b = bridge();
    if (!b) { capability = null; return; }
    try { capability = Capabilities.parse(await b.getCapabilities()); }
    catch { capability = null; }
}
export const collectorAvailable = () => capability !== null && !!bridge();
export const nativeShellAvailable = () => !!(window as any).Capacitor?.isNativePlatform?.();
export async function collectorStatus() { await initializeCollector(); const b = bridge(); return b && capability ? NativeStatus.parse(await b.getStatus()) : null; }
export async function nativeCollector(action: 'settings' | 'consent' | 'stop' | 'retry' | 'delete' | 'sources', options: {
    reason?: string;
    packages?: string[];
} = {}) {
    const b = bridge();
    if (!b)
        throw Error('Chức năng này cần ứng dụng Android có phần native đã kết nối. Trình duyệt không đọc thông báo ngân hàng.');
    if (action === 'stop') return b.stopAndQuarantine();
    await initializeCollector();
    if (!capability) throw Error('UPDATE_REQUIRED: APK không khớp API005/native bridge003.');
    if (action === 'settings')
        return b.openNotificationSettings();
    if (action === 'consent')
        return b.acceptDisclosure({ version: capability.requiredConsentVersion });
    if (action === 'retry')
        return b.retryQueue();
    if (action === 'delete')
        return b.deleteQuarantined({ reason: options.reason ?? '' });
    return b.setSources({ packages: options.packages ?? [] });
}
export function installAndroidBackHandler() {
    const capacitor = (window as unknown as {
        Capacitor?: {
            Plugins?: {
                App?: {
                    addListener: (name: string, fn: () => void) => Promise<{
                        remove: () => void;
                    }>;
                };
            };
        };
    }).Capacitor;
    const app = capacitor?.Plugins?.App;
    if (!app)
        return () => { };
    let handle: {
        remove: () => void;
    } | undefined, disposed = false;
    void app.addListener('backButton', () => { const focused = document.activeElement; if (focused instanceof HTMLElement && ['INPUT', 'TEXTAREA'].includes(focused.tagName)) {
        focused.blur();
        return;
    } const dialog = document.querySelector('[role="dialog"]'); if (dialog) {
        dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        return;
    } if (history.length > 1)
        history.back(); }).then(h => { if (disposed)
        h.remove();
    else
        handle = h; });
    return () => { disposed = true; handle?.remove(); };
}
