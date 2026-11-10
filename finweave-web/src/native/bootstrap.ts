import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { registerPlugin } from '@capacitor/core';
import { initializeCollector } from './collector';

// Native availability is established by the pinned handshake, not a JS proxy.
export function bootstrapNative() {
  if (!Capacitor.isNativePlatform()) return;
  const target = window as unknown as { Capacitor: { Plugins?: Record<string, unknown> } };
  target.Capacitor.Plugins ??= {};
  Object.assign(target.Capacitor.Plugins, { App });
  if (Capacitor.isPluginAvailable('FinWeaveOwner'))target.Capacitor.Plugins.FinWeaveOwner=registerPlugin('FinWeaveOwner');
  if (Capacitor.isPluginAvailable('FinWeaveCollector')) {
    target.Capacitor.Plugins.FinWeaveCollector = registerPlugin('FinWeaveCollector');
  }
  void initializeCollector();
}
