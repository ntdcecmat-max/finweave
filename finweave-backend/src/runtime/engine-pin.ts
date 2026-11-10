import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
// Hash executable mathematics and compute adapter bytes, not just a version label.
export const engineDigest=createHash('sha256').update(JSON.stringify(['../engine/exact.ts','../engine/posting.ts','../engine/business.ts','../engine/forecast.ts','../engine/planning.ts','planning-drafts.ts','forecast-worker.ts','forecast-thread.ts','engine-pin.ts'].map(path=>[path,createHash('sha256').update(readFileSync(new URL(path,import.meta.url))).digest('hex')]))).digest('hex');
