import { afterEach, expect, test, vi } from 'vitest';
import { collectorAvailable, collectorStatus, initializeCollector, nativeCollector } from '../src/native/collector';
import { demoSources } from '../src/native/demo-sources';

const capabilities = { bridgeRevision: 'FW-NATIVE-BRIDGE-003', apiRevision: 'FW-API-T1-D1J2-005', profile: 'SYNTHETIC', buildId: 'candidate', requiredConsentVersion: '2026-10-08', nativeAvailable: true };
const status = { permission: 'denied', consented: false, network: 'offline', enrolled: false, ownerBound: false, lastObserved: null, lastAck: null, pausedReason: 'BINDING_REQUIRED', queue: [] };
function install(reply: unknown = capabilities) {
  const plugin = { getCapabilities: vi.fn(async () => reply), getStatus: vi.fn(async () => status), acceptDisclosure: vi.fn(async () => {}), stopAndQuarantine: vi.fn(async () => {}) };
  vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true, Plugins: { FinWeaveCollector: plugin } } });
  return plugin;
}
afterEach(() => vi.unstubAllGlobals());
test('an Android shell missing its native plugin cannot fabricate notification capability', async () => {
  vi.stubGlobal('window', { Capacitor: { isNativePlatform: () => true, Plugins: {} } });
  await initializeCollector();
  expect(collectorAvailable()).toBe(false);
  expect(await collectorStatus()).toBeNull();
  await expect(nativeCollector('settings')).rejects.toThrow('Chức năng này cần ứng dụng Android');
});
test('a JS proxy does not establish native support; exact handshake does', async () => {
  install({ ...capabilities, apiRevision: 'FW-API-T1-D1J2-004' });
  await initializeCollector(); expect(collectorAvailable()).toBe(false); expect(await collectorStatus()).toBeNull();
  install(); await initializeCollector(); expect(collectorAvailable()).toBe(true); expect(await collectorStatus()).toEqual(status);
});
test('consent uses required version and mismatch fails closed', async () => {
  const plugin = install(); await nativeCollector('consent');
  expect(plugin.acceptDisclosure).toHaveBeenCalledWith({ version: '2026-10-08' });
  install({ ...capabilities, bridgeRevision: 'FW-NATIVE-BRIDGE-002' });
  await expect(nativeCollector('consent')).rejects.toThrow('UPDATE_REQUIRED');
});
test('logout fence remains available during incompatible handshake', async () => {
  const plugin = install({ ...capabilities, apiRevision: 'wrong' });
  await nativeCollector('stop'); expect(plugin.stopAndQuarantine).toHaveBeenCalledOnce();
});
test('legacy status stays strict and ACK cannot add posted fields', async () => {
  const plugin = install();
  plugin.getStatus.mockResolvedValueOnce({ ...status, posted: true } as typeof status);
  await expect(collectorStatus()).rejects.toThrow();
  expect(demoSources.map(s => s.id)).toEqual(['vcb', 'zalopay']);
  expect(demoSources.every(s => !('packageName' in s))).toBe(true);
});
