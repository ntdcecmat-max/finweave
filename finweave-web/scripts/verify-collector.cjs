const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

async function main() {
  const root = path.resolve(__dirname, '../..');
  const evidence = path.join(root, 'docs/execution/evidence/android-zalopay-candidate-2026-10-12');
  const freshVector = path.join(root, '.local/android-wire/jvm-wire.json');
  const savedVector = path.join(root, 'docs/execution/evidence/android-collector-2026-10-12/jvm-wire.json');
  const vector = JSON.parse(fs.readFileSync(fs.existsSync(freshVector) ? freshVector : savedVector, 'utf8'));
  const { validator } = await import(pathToFileURL(path.join(root, 'finweave-backend/src/runtime/contracts.ts')).href);
  const { jcs, sha } = await import(pathToFileURL(path.join(root, 'finweave-backend/src/runtime/crypto.ts')).href);
  const { itemDigest } = await import(pathToFileURL(path.join(root, 'finweave-backend/src/runtime/sources.ts')).href);
  assert(validator('ingestNotificationsRequest')(vector.request));
  assert(validator('ingestNotificationsReply')(vector.reply));
  const item = vector.request.input.items[0];
  assert.equal(item.payloadDigest, itemDigest(item));
  assert.equal(vector.canonicalClaims, jcs(vector.claims));
  assert.equal(vector.claims.bodyDigest, sha(jcs(vector.request)));
  assert.equal(vector.claims.credentialDigest, sha('fake-credential'));
  const key = crypto.createPublicKey({ key: Buffer.from(vector.spki, 'base64url'), format: 'der', type: 'spki' });
  const signature = Buffer.from(vector.signatureRaw64, 'base64url');
  assert.equal(signature.length, 64);
  assert(crypto.verify('sha256', Buffer.from(jcs(vector.claims)), { key, dsaEncoding: 'ieee-p1363' }, signature));
  assert(!crypto.verify('sha256', Buffer.from(jcs({ ...vector.claims, purpose: 'reconcileReceipts' })), { key, dsaEncoding: 'ieee-p1363' }, signature));
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/android/manifest-0.1.8-pilot.json'), 'utf8'));
  const previous = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/android/manifest-0.1.2-pilot.json'), 'utf8'));
  assert.equal(manifest.certificateSha256, previous.certificateSha256);
  assert.equal(manifest.versionCode, 9);
  assert.equal(manifest.distribution, 'direct-full');
  assert.equal(manifest.collectorNativeImplemented, true);
  assert.equal(manifest.sensitiveManifestCheck, 'PASS');
  assert.equal(manifest.dexCheck, 'PASS');
  assert.equal(manifest.collectorEnabled, false);
  for (const [file, digest] of Object.entries(manifest.source)) {
    assert.equal(sha(fs.readFileSync(path.join(root, 'finweave-web', file))), digest, 'source hash: ' + file);
  }
  assert.equal(sha(fs.readFileSync(path.join(root, 'artifacts/android', manifest.apk))), manifest.sha256);
  for (const [file, digest] of Object.entries(manifest.assets)) {
    assert.equal(sha(fs.readFileSync(path.join(root, 'finweave-web/dist', file))), digest, 'asset hash: ' + file);
  }
  const pins = {};
  for (const file of ['docs/contracts/v2-t1-r5/openapi.json', 'docs/agent/native-bridge-003.json', 'docs/android/local-model.json', 'docs/sources/contract-storage-map.json']) {
    pins[file] = sha(fs.readFileSync(path.join(root, file)));
  }
  const result = { status: 'PASS', executedAt: new Date().toISOString(), profile: 'SYNTHETIC_JVM_VECTOR',
    apiRevision: 'FW-API-T1-D1J2-005', bridgeRevision: 'FW-NATIVE-BRIDGE-003',
    checks: ['Kotlin wire request/reply pass API005 validator', 'whole-item digest agrees with backend', 'JCS claims/body/credential digests agree with Node',
      'DER→raw64 ES256 verifies in Node; altered purpose denied', 'same pilot certificate/versionCode increase', 'all manifest source/assets/APK hashes agree'],
    pins, androidKeystoreInteroperability: 'NOT_RUN', nativeHttpIntegration: 'NOT_RUN', realSourcesActivated: false };
  fs.mkdirSync(evidence, { recursive: true });
  fs.writeFileSync(path.join(evidence, 'jvm-wire.json'), JSON.stringify(vector, null, 2) + '\n');
  fs.writeFileSync(path.join(evidence, 'contract-proof.json'), JSON.stringify(result, null, 2) + '\n');
  console.log('collector contract/proof/artifact verification PASS');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
