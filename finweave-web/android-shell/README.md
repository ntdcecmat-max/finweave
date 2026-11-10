# Android shell integration

> **Play Protect handling, 12/10/2026:** APK 0.1.4 retains the complete notification collector, Room/Keystore outbox and WorkManager uploader. No reduced build is used. Direct APK distribution requires resolving the Play Protect classification through the official review process; no Google approval or device verification is claimed. See [report](../../docs/execution/android-play-protect-2026-10-12.md).

> Current implementation, 12/10/2026: Kotlin collector candidate and signed APK 0.1.2 now exist. API005/native003 handshake, encrypted Room/Keystore outbox and WorkManager are implemented. VCB + ZaloPay are display candidates; live profiles are empty, native identity/enrollment and HTTPS origin are not connected. Device tests are NOT RUN. See [Task 9 report](../../docs/execution/android-collector-2026-10-12.md). The frontend-only handover below is historical.

The user UI remains the React application in `src`. `capacitor.config.json` packages the compiled `dist` assets, with no development-server URL, no mixed content and no production WebView debugging. The prototype application ID is not a production identity.

## Delivered frontend

- `/data/android`: disclosure, consent, permission handoff/recheck, supported-source selection, explicit account mapping, synthetic connectivity test, native queue status and quarantine deletion confirmation.
- `/data/devices`: last-reported permission/network/last-seen/observed/ACK, gaps, source bindings and revoke confirmation.
- `src/native/collector.ts`: validated native status boundary, native Back handling and stop/quarantine on logout. A browser cannot fabricate OS permission or native queue state.
- `src/features/operational.css`: responsive single-column forms and 48px Android controls. Existing mobile navigation, mascot and shared conversation remain in use.

## Native integration still required

No Android Gradle project, signed APK or real collector has been built in this frontend change. Capacitor packages, Android SDK and a production identity must be selected and installed in a native implementation task. The official [configuration](https://capacitorjs.com/docs/config), [Android plugin](https://capacitorjs.com/docs/plugins/android) and [App/Back](https://capacitorjs.com/docs/apis/app) references were checked while adding this boundary.

The host must register `FinWeaveCollector` and `App` using Capacitor's JavaScript plugin registration, then expose the registered proxies to `window.Capacitor.Plugins` before React starts. `FinWeaveCollector` must implement:

| Method | Requirement |
| --- | --- |
| `getStatus()` | Return the exact `NativeStatus` schema. Permission is re-read from Android, queue comes from native persistence, `enrolled` and `ownerBound` come from verified device enrollment. |
| `acceptDisclosure({version})` | Record explicit consent, independently of OS permission. |
| `openNotificationSettings()` | Open Android notification-listener access only after consent; returning does not grant permission. |
| `setSources({packages})` | Enforce a tested allowlist and account bindings; no default-all selection. |
| `stopAndQuarantine()` | Stop capture and upload and lock the old owner's outbox before logout/switch. |
| `retryQueue()` | Reuse event IDs/idempotency keys, obey retry-after, permission, enrollment and owner binding. |
| `deleteQuarantined({reason})` | Delete only explicitly confirmed quarantined local items; preserve posted server records. |

The independent Kotlin listener → encrypted persistent outbox → WorkManager uploader, Keystore protection, seven-day/1,000-item limits, durable receipt API and raw/OTP filtering remain native/backend work. Unsupported/redacted templates must create minimal Review evidence, not guessed transactions. Do not put this collector in a React timer, WebView lifecycle or browser storage.

No real notification-source compatibility, APK signing/install/update, background capture, reboot/offline recovery or TalkBack result is claimed. All real-device acceptance checks remain NOT RUN. The web prototype exposes an explicitly selected synthetic walkthrough so these UI steps can be reviewed without pretending to connect a bank or phone.
