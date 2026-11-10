import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const sha256 = (bytes: string | Buffer) => createHash('sha256').update(bytes).digest('hex');
export const pins = {
  api: { revision: 'FW-API-T1-D1J2-005', path: 'docs/contracts/v2-t1-r5/openapi.json', sha256: '35ebbbabd8d6dbc6f19cc9a123c2c6c2df3e1d0a3046c16d795adc9ed8b81802' },
  database: { revision: 'FW-PHYS-T1-ASYNC-005', path: 'docs/data/target-t1-async/target-model.json', sha256: '84698a505073909a3e5f0ac86aa80aedd877039a13e6f584c0c1dbd0c41e5424' },
  nativeBridge: { revision: 'FW-NATIVE-BRIDGE-003', path: 'docs/agent/native-bridge-003.json', sha256: 'ed1cc91f2201fa7bcc3e7d56ff75651deee1a5d3839743799f5b28021ef97c66' }
} as const;
export async function verifyPins() {
  for (const pin of Object.values(pins)) {
    if (sha256(await readFile(resolve(root, pin.path))) !== pin.sha256) throw new Error(`PIN_MISMATCH:${pin.revision}`);
  }
}
