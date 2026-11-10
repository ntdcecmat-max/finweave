import { verifyPins, pins } from '../src/pins.ts';
await verifyPins();
console.log(JSON.stringify({ status: 'PASS', scope: 'STATIC_ARTIFACT_PINS_ONLY', pins }));
