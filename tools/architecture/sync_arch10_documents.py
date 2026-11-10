"""Update current architecture docs, leaving versioned packages/evidence intact."""
from pathlib import Path
import json, os, re
R=Path(__file__).resolve().parents[2]
E=R/'docs/execution/evidence/arch-10-android-2026-10-09'

def link(p,target): return os.path.relpath(R/target,p.parent).replace('\\','/')
def main():
    names=json.loads((R/'docs/execution/evidence/arch-09-async-2026-10-09/current-documents.json').read_text(encoding='utf-8'))['files']+['docs/design/android-ui-specification.md']
    sections={
      'README.md':'Android vẫn React/Vite + Capacitor/Kotlin. Chưa có Capacitor dependency/Gradle project/APK thật; native bridge2 và consumer adapter chỉ SPECIFIED. Tất cả feature giữ nguyên.',
      'docs/architecture/README.md':'ARCH-10 chốt native ownership/support/Room/keys/clock/bridge/APK/release; ARCH-11 Sources tiếp theo. Không nhầm tám bảng Room local với87bảng PostgreSQL.',
      'docs/architecture/architecture-decision-agenda.md':'ARCH-10 ACCEPTED ANDROID DESIGN trong hướng Capacitor/Kotlin đã duyệt; OS/OEM/source/release support chưa đo. ARCH-11…13 REVIEW PENDING.',
      'docs/architecture/deployment-topology.md':'APK assets bundled, compiled HTTPS API origin khi REAL; không remote server.url. Build/distribution local free-first; optional limited account20devices conditional, chưa provision/publish/register.',
      'docs/architecture/environment-matrix.md':'SYNTHETIC có namespace/key/endpoints riêng; REAL appId/origin/cert/source/device evidence chưa có, build fail closed. No secrets/admin/service credentials in APK.',
      'docs/architecture/high-level-design.md':'Native identity/owner broker/listener/Room/WorkManager độc lập WebView lifecycle. Server Engine actual authority; ACK khác posted; native parser không ghi ledger.',
      'docs/architecture/low-level-design.md':'Local eight-table model, AEAD scope/AAD/nonce reservation, current-generation fences, bounded immutable upload batches/ACK replay, trusted-clock expiry, no destructive migration. Native not implemented.',
      'docs/architecture/module-high-level-design.md':'Android separate first-party consumer, not P2 worker. Background token renewal uses collector key only, never owner refresh. Native broker denies admin/internal and arbitrary signing/network.',
      'docs/architecture/tech-stack.md':'Capacitor8.x/Kotlin/Room/AES256GCM/Keystore/WorkManager design; min24 target+compile36. Pin compatible exact patches/AGP/JDK at implementation; no installed dependency/toolchain claim.',
      'docs/architecture/views/architecture-views.md':'Deployment: bundled owner UI→typed bridge→native identity/owner HTTP; listener→encrypted Room→scoped WorkManager→API receipt→Engine. Trust: same-origin XSS can still invoke normal owner capabilities, fresh reauth/native confirmation for high risk.',
      'docs/contracts/README.md':'API004153operations634schemas unchanged. FW-NATIVE-BRIDGE-002 separate internal protocol; seven legacy methods need explicit adapter, native auth reply secrets never forwarded generically to JS.',
      'docs/data/data-requirements.md':'Native normalized encrypted outbox/ACK journal only; raw/OTP memory-only. Eight local Room tables do not change backend DB00587tables1001columns. Private payloads/counters/keys have distinct retention.',
      'docs/data/logical-data-model.md':'Local owner vault/outbox/capture index/upload batches/ACK replay/gaps/auth pending/installation metadata modeled separately from PostgreSQL authority. No local actual ledger copy becomes source of truth.',
      'docs/governance/artifact-register.md':'Register FW-ANDROID-DESIGN-001 / FW-ANDROID-LOCAL-001 / FW-NATIVE-BRIDGE-002 / ADR017, evidence arch-10-android-2026-10-09. Prior manifests/snapshots/source/API004/DB005 unchanged.',
      'docs/handover/README.md':'Android implementation handover now includes bridge consumer mapping/local schema/build/signing/upgrade/support and32 runtime intentions. No new r1/r2 baseline; no APK acceptance.',
      'docs/product/ai-agent-specification.md':'Android owner UI keeps full Plan/Goals/Agent capabilities via scoped owner APIs. Native notification raw/OTP never model input; collector enrollment/keys/retry are deterministic native handlers, not Agent authority.',
      'docs/product/backend-backlog.md':'Full21required groups/41parent AC unchanged. Android32refinements cover registration/proof/persistence/ACK/revoke/backup/update/support. No feature de-prioritization; native/server security tests remain NOT RUN.',
      'docs/product/business-rules.md':'Android callback/OS permission/ACK do not prove posted or complete coverage. No observation≠no transaction. Clock/epoch/owner mismatch seals/quarantines, never retag. Expiry no physical-delete guarantee while off.',
      'docs/product/cost-model.md':'No mandatory cloud build service fee for local APK using existing hardware. Limited distribution free≤20authorized devices only under current eligibility/verification rules; commercial broad distribution not approved. Recheck terms before release, no auto pay.',
      'docs/requirements/context-model.md':'Notification special access independent own-push permission; browser cannot read apps. User can decline collector and use all other features. External browser has no native FinWeave bridge.',
      'docs/requirements/srs.md':'Add AND01…32 Android design refinements linked UI-M01…06, no change existing41parent AC. Real support requires exact OS/OEM/source matrix evidence; all Android runtime cases NOT RUN.',
      'docs/security/security-design.md':'Payload-level encryption not full encrypted Room; non-sensitive local metadata visible. Hardware Keystore backing must measure; AFU background key no per-use biometric, server reauth separate. No root-proof/E2EE/anti-Ops claim.',
      'docs/testing/integration-handover.md':'Native2 mismatch requires adapter migration; production cannot use legacy mock/session headers. Compile/install/proof/Room/backup/D2D/upgrade/OEM/source/phone-web end-to-end cases32 NOT RUN; historical frontend synthetic acceptance unchanged.',
      'docs/testing/technical-spikes.md':'Early Android spikes: signed synthetic APK+listener permission; Keystore/ES256-JCS cross-runtime; Room crash/clock/offline ACK and owner fences; upgrade/backup/D2D; OEM/source behavior. See32 runtime cases/evidence rules.',
    }
    for n in names:
      p=R/n;s=p.read_text(encoding='utf-8')
      if n=='docs/architecture/android-collector.md':
        s='''# Android collector — current architecture entry

ARCH-ANDROID-001 · v2.0 · 09/10/2026 · DESIGN SPECIFIED / NATIVE NOT BUILT / NOT RUN.

Tài liệu chi tiết hiện hành ở [ARCH-10 Android](../android/README.md): component ownership, listener/permissions, event identity/binding, native auth/proofs, eight-table Room model, encrypted outbox/ACK journal, clock/retention, bridge2 và signed APK/update/support. Kế thừa ARCH-06/07/09; nội dung ARCH10 supersedes mô tả native cũ khi khác nhau. Historical revisions giữ trong snapshots/evidence, không sửa r1/r2.

React/Vite UI tiếp tục Capacitor/Kotlin; chưa có Capacitor dependency/Gradle native project/APK. Listener/WorkManager/Room/Keystore chưa triển khai. Server API004/DB005/Engine giữ authority, không generic native signing/network proxy và không raw/OTP disk/server/LLM. Native owner token15min/refresh30d riêng collector24h/authorization30d, không owner refresh trong background uploader. Dữ liệu gắn bất biến owner/workspace/device/capture epoch và binding version.

Pending≤1000items/8MiB/7days, quarantine thêm7days; encrypted normalized ACK replay riêng≤1000/8MiB/7days phục vụ reconcile. Mất receipt sau restore điều tra, không auto ingest lại. Expiry chặn decrypt/display/upload; OS tắt/force-stop không bảo đảm physical erase đúng giờ. After reboot cần trusted time trước unseal/capture REAL. No observations không có nghĩa không giao dịch; ghi coverage uncertainty, không hứa chạy nền liên tục.

[Bridge/consumer map](../android/bridge-and-consumer.md) giữ seven legacy methods qua future adapter, thêm bridge2 handshake/status/config; không sửa frontend ở vòng docs này. [Sáu màn Android](../design/android-ui-specification.md) native_pending; [32 acceptance cases](../android/acceptance-plan.md) NOT RUN. [APK/release](../android/apk-release.md) fail closed REAL khi appId/HTTPS origin/signing/support/catalog chưa xác minh, không fake download link. Full user UI/manual/CSV/Plan–Goals/Agent giữ nguyên.
'''
      elif n=='docs/design/android-ui-specification.md':
        s=s.replace('v1.0 · 08/10/2026','v1.1 · 09/10/2026')
        s=s.replace('[API](../contracts/operational-api-spec.md)','[API004](../contracts/v2-t1-r4/README.md)')
        s=s.replace('Xóa normalized payload local theo policy; receipt metadata giữ7 ngày; trạng thái posted/Review tra authority','Chuyển khỏi pending chỉ sau durable ACK đúng immutable request/item; normalized encrypted ACK replay riêng≤1.000items/8MiB/7days, không raw. ACK khác posted/Review, không tự replay missing receipt sau restore')
        s=s.replace('Queue đạt7 ngày hoặc1.000 items','Queue đạt7 ngày hoặc1.000 items/8MiB')
        s=s.replace('quá hạn quarantine chờ user, không silent drop','quá hạn quarantine thêm tối đa7days, không silent pending drop; expiry chặn đọc/gửi, purge khi OS cho thực thi, không hứa xóa vật lý đúng giờ lúc máy tắt')
        s=s.replace('retry cùng eventId','retry cùng eventKey/revision/digest và captured scope')
        if '## ARCH-10 — UI delta chuẩn bị native implementation' not in s:
          s += '''
  
  ## ARCH-10 — UI delta chuẩn bị native implementation
  
  Giữ UI-M-01…06 và core user screens. Nội dung chưa được dựng/kết nối trong frontend hiện tại; tất cả native_pending/SPECIFIED/NOT RUN.
  
  | Screen | Bổ sung UI/UX phải triển khai |
  | --- | --- |
  | UI-M-01 | Consent required-version handshake, listener bound khác permission granted; own-push permission riêng; không auto nâng literal2026-10-08 |
  | UI-M-02 | Supported-source catalog có signer/app-version/parser evidence; không icon=đã support, không chọn tất cả. Native config phải resolve live bindings |
  | UI-M-03 | Binding ID/version và captured epoch; multi-account ambiguous→Review, reconnect không retag observations cũ |
  | UI-M-04 | Native/synthetic label; permission→bound→queue→durable ACK→posted/Review từng timestamp; missing/redacted không giả test thành công |
  | UI-M-05 | Clock untrusted/key unavailable/update required, last health time, truncated queue paging/counts/bytes, overdue physical purge, offline revoke pending, pending/quarantine/ACK replay tách biệt. Stop máy khác server revoke; xóa current-owner quarantine có native confirm/count/loss |
  | UI-M-06 | APK_NOT_BUILT tới khi signed artifact thật; verified appId/cert/hash/version/OS-OEM support/distribution eligibility; upgrade giữ queue và Room migration. Không fake button hoặc hứa mọi Android |
  
  Reauth/confirmation native cho sensitive owner action phải bind exact operation/input/generation; recovery codes hiển thị native secure screen, không JSON token trả JS. Khi bridge2/API004 mismatch giữ manual mode và hướng update, không giả enrolled/ready. Android Back/keyboard/TalkBack48dp/insets phải kiểm signed APK, không kế thừa PASS browser thành native PASS. Nội dung Android hiện hành: [architecture/support](../android/architecture-and-support.md), [bridge](../android/bridge-and-consumer.md), [storage/clock](../android/local-storage.md), [acceptance32](../android/acceptance-plan.md).
  '''
      # Prepend a precedence notice; existing historical sections remain auditable.
      notice=(f'> **ARCH-10 hiện hành — 09/10/2026:** [Android design]({link(p,"docs/android/README.md")}), '
              f'[ADR017]({link(p,"docs/architecture/adr/ADR-017-android-native-collector-and-signed-apk.md")}) và '
              f'[bundle pin]({link(p,"docs/android/implementation-bundle.json")}). Capacitor/Kotlin, native identity/Room/Keystore/WorkManager, bridge2, support/clock/retention và signed APK. '
              'API004/DB005 giữ nguyên; frontend không sửa. **Design SPECIFIED; APK NOT BUILT, Android/runtime NOT RUN.** ARCH10 thay mô tả native cũ khi khác; notes ARCH05…09 là lịch sử và vẫn là base security/domain/async.\n\n')
      if not s.startswith('> **ARCH-10 hiện hành'):s=notice+s
      if n in sections and '## ARCH-10 — Android implementation handover' not in s:
        s+='\n## ARCH-10 — Android implementation handover\n\n'+sections[n]+'\n\n'+f'[Chi tiết Android]({link(p,"docs/android/README.md")}) · [Acceptance32 NOT RUN]({link(p,"docs/android/acceptance-plan.md")}) · [Báo cáo ARCH10]({link(p,"docs/architecture/ARCH-10-change-report.md")}).\n'
      if n=='docs/architecture/architecture-decision-agenda.md':
        s=s.replace('ARCH-10…13 REVIEW PENDING','ARCH-10 ACCEPTED ANDROID DESIGN; ARCH-11…13 REVIEW PENDING')
        s=s.replace('| ARCH-10 Android | Native/WebView, listener/WorkManager/Keystore, outbox/owner epoch/signing/update | Device/OS/OEM support, permission/revoke và fallback | Android/support matrix |','| ARCH-10 Android — ACCEPTED DESIGN | Capacitor8/Kotlin/Room/Keystore/WorkManager; bridge2, scoped auth/outbox/ACK/clock; signed APK/update/distribution | 32 Android runtime cases NOT RUN; appId/origin/cert/device/source REAL gates unresolved | [Android](../android/README.md)/[ADR017](adr/ADR-017-android-native-collector-and-signed-apk.md)/[report](ARCH-10-change-report.md) |')
      p.write_text(s,encoding='utf-8')
    (E/'current-documents.json').write_text(json.dumps({'date':'2026-10-09','files':names},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({'currentDocs':len(names),'frontendChangedByThisTool':False}))

if __name__=='__main__':main()
