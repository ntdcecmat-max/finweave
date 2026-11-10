# Android candidate — PREPARED / NOT BUILT

Isolated SYNTHETIC source fragments for a future Capacitor8/Kotlin app. This directory is **not an APK, buildable complete project, or device evidence**. No Gradle wrapper/dependency/signing key is downloaded or generated. Existing frontend is untouched.

Before assembly: resolve/pin Capacitor core/android/cli8 patch, compatible JDK/AGP/Gradle/Kotlin, Room runtime/compiler + KSP, compile/target36/min24, SDK binaries and lockfiles. Add a BridgeActivity registering `SyntheticProbePlugin`, use only bundled local assets, and install the manifest fragment in a synthetic appId selected by the owner. Configure a test certificate with custody outside VCS. `assemble`/`apksigner verify`/install/update are BLOCKED until those inputs exist. Capture actual source/asset/dependency/APK/certificate hashes, phone model/OS/OEM/security patch and observed Keystore security level.

The plugin can emit only one authored notification; the listener accepts only its own application package and discards text. It does not collect VCB/MoMo or normalize receipts. Room holds opaque probe ciphertext; Keystore signing stays native. These fragments deliberately expose no generic signing, HTTP, credentials or finance access. The full bridge003 capabilities must **not** be advertised from this incomplete probe.

Device test procedure (NOT RUN):

1. Open listener settings; deny then grant and query actual state after returning. On Android13+ grant notification posting separately. Emit fixture, then revoke/regrant listener and repeat. Record expected count vs observed count without recording text.
2. Generate signing alias; sign fixed native fixture; export SPKI/public signature only to an isolated instrumentation oracle. Verify DER and raw ES256 using a pinned conversion library. Record StrongBox/TEE/software from KeyInfo, test invalidation; never export private key.
3. Place Room database under noBackupFilesDir, insert encrypted synthetic row via instrumented repository, kill/restart/screen-off/reboot and upgrade with same certificate. Confirm row IDs and ciphertext survive supported cases. Inspect DB/WAL/SHM for raw/OTP sentinel absence; inspect cloud/D2D backup exclusion on actual OEM.
4. Implement full vault nonce reservation/key rotation and owner scope before uploading anything. Simulate partial ACK/lost response/offline429/clock rollback/revoke/switch; IDs, captured epochs and initial deadlines remain immutable. JSONL harness results do not certify these native cases.
5. Sign/update two versionCodes without losing rows. Fail opening incompatible schema; never destructive migration. Record limitations of force-stop, OEM battery restrictions and pre-first-unlock.

Blocked evidence template: `../device-evidence-template.json`. SDK/device access is a separate gate and does not block backend/auth/J2/parser development.
