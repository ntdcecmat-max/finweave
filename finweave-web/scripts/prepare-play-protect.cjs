const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const artifacts = path.join(root, 'artifacts/android');
const out = path.join(artifacts, 'play-protect');
function artifact(version) {
  const m = JSON.parse(fs.readFileSync(path.join(artifacts, `manifest-${version}.json`), 'utf8'));
  const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(artifacts, m.apk))).digest('hex');
  assert.equal(actual, m.sha256, `APK digest mismatch: ${version}`);
  return { apk: m.apk, packageName: m.appId, versionName: m.versionName, versionCode: m.versionCode,
    sha256: actual, signingCertificateSha256: m.certificateSha256 };
}
const observed = artifact('0.1.2-pilot');
const candidate = artifact('0.1.4-pilot');
assert.equal(candidate.signingCertificateSha256, observed.signingCertificateSha256);
const m = JSON.parse(fs.readFileSync(path.join(artifacts, 'manifest-0.1.4-pilot.json'), 'utf8'));
assert.equal(m.collectorNativeImplemented, true);
assert.equal(m.distribution, 'direct-full');
const rationale = `FinWeave is a personal-finance prototype whose intended core feature is to record transactions from notifications from bank or wallet apps explicitly selected by the user. NotificationListenerService is intentionally declared for this purpose; removing it would remove the core feature.

The in-app setup explains the data access and asks for affirmative consent before opening Android notification-access settings. The native bridge checks the consent version. Capture requires a verified source profile, source signer/version, account binding and native enrollment. The prototype currently has no live source profiles or connected native enrollment/backend, so real capture is not activated. No bank login credentials are requested. The parser rejects OTP content and retains only minimized financial evidence. Collector code uses an encrypted Room/Android Keystore outbox and a WorkManager uploader for a future authorized backend connection.

The app does not declare READ_SMS, RECEIVE_SMS, an accessibility service, QUERY_ALL_PACKAGES or REQUEST_INSTALL_PACKAGES. It does not hide notification access or ask users to turn off Play Protect. Please review whether the classification is appropriate for this declared, consent-based personal-finance use case. We understand that approval is not guaranteed and this request is not a request for advice on a future implementation.
`;
fs.mkdirSync(out, { recursive: true });
const recordPath = path.join(out, 'submission-record.json');
const previous = fs.existsSync(recordPath) ? JSON.parse(fs.readFileSync(recordPath, 'utf8')) : {};
// Regeneration verifies binaries without discarding the external-action audit.
fs.writeFileSync(path.join(out, 'submission-record.json'), JSON.stringify({ status: 'PREPARED_NOT_SUBMITTED',
  createdAt: new Date().toISOString(), developerEmail: null, developerName: null,
  suspectedBlockedArtifact: observed, screenshotVersionConfirmed: false, fullCandidateArtifact: candidate,
  candidateDeviceTest: 'NOT_RUN', candidateBlockObserved: false, virusTotalUploaded: false,
  externalUploadAuthorized: false, googleAppealSubmitted: false,
  appealUrl: 'https://support.google.com/googleplay/android-developer/contact/protectappeals',
  guidanceUrl: 'https://developers.google.com/android/play-protect/warning-dev-guidance',
  ...previous,
  suspectedBlockedArtifact: observed, fullCandidateArtifact: candidate
}, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'appeal-observed-0.1.2.txt'),
  `DRAFT — NOT SUBMITTED — CONFIRM THE BLOCKED APK VERSION FIRST\nPackage: ${observed.packageName}\nVersion: ${observed.versionName} (${observed.versionCode})\nAPK SHA-256: ${observed.sha256}\n\nThe supplied screenshot shows Google Play Protect blocking FinWeave during direct installation from a Google Drive/file-manager source with the sensitive-data/financial-fraud warning. The version is not visible in the screenshot. The 0.1.2 pilot was the current complete artifact before this task; confirm the exact blocked file before submitting this draft and hash.\n\n${rationale}`);
fs.writeFileSync(path.join(out, 'candidate-0.1.4.txt'),
  `FULL CANDIDATE — DEVICE TEST AND GOOGLE REVIEW NOT RUN\nPackage: ${candidate.packageName}\nVersion: ${candidate.versionName} (${candidate.versionCode})\nAPK SHA-256: ${candidate.sha256}\nCertificate SHA-256: ${candidate.signingCertificateSha256}\n\nThis APK preserves all existing collector and application code. The supplied screenshot predates this candidate; do not claim that this version was blocked until it has been tested. If this version is blocked, use this exact APK and hash with the new evidence.\n\n${rationale}`);
console.log('Play Protect packet prepared locally; no upload or submission performed.');
