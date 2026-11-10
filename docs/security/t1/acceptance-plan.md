# SEC-REAL-T1 — acceptance plan ARCH-07

**ALL 32 RUNTIME CASES NOT RUN**. [AUTH-01…30](../identity/acceptance-plan.md) vẫn required, không thay bằng bảng này. Static checks chỉ schema/coverage/hashes/link integrity; security gate không được chuyển PASS từ artifact validation. Tất cả test local/staging dùng synthetic trước.

| ID | Test/evidence bắt buộc | Expected outcome |
| --- | --- | --- |
| SEC-01 | OwnerA đổi workspace/nested account/evidence/Plan/Goal/run ID củaB qua direct API | Consistent deny/no existence/body leak |
| SEC-02 | SQL roles/RLS/FK/pool reset và workspace access_state pendingerase | No cross-tenant context leak; denied workspace không financial reads/jobs |
| SEC-03 | Owner gọiOps/admin gọifinance/export/auth secrets | Separateauthority/pool/grants deny |
| SEC-04 | Ops DTO/metadata/metrics/source status snapshots và errorpaths | No private finance/IDs/digests/prompts in allowedOpsprojection |
| SEC-05 | SQL injection/unsafe identifier/upload serialization/provider response cases | Parameterized/typed/bounded paths; no arbitrary execution |
| SEC-06 | P2 nonroot/read-only/capabilities/container socket/patch/dependency policy | No unintended host privileges; document compromisedAPI blast radius |
| SEC-07 | Wrong workerprofile/lease/generation/workspace/recoveryepoch | No unauthorized effect or broad credential access |
| SEC-08 | Agent prompt/tool/resume/cancel adversarial cases và Plan–Goals bundle | Draft-only; no activeplan/actual/confirmation escalation |
| SEC-09 | Real-device bankOTP/raw/extras and unknown notification cases | Raw memorydiscard; normalized schemaonly; no upload/log/model leakage |
| SEC-10 | CSV/formula/oversize/invalid number/calendar/provenance cases | Reject/quarantine safely; no log/rawexception/execution |
| SEC-11 | Keystore invalidation/lostdevice/WebView/bridge arbitraryURL | Failclosed, no native secrets exposed; outbox loss/gap reported |
| SEC-12 | Offline/logout/accountswitchA→B/uninstall/revoke race | No retarget/capture after revoke; explicit bounded quarantine |
| SEC-13 | Browser Origin/CSRF/cookie flags/session fixation/XSS/CSP checks | Session authority đúng, UIhide không là authorization |
| SEC-14 | Signed APK/release/dependency integrity và environment mismatch | Reject wrong origin/revision/image; no real secrets in bundle |
| SEC-15 | Enumerate mounted credentials/env/proc/CI/buildlogs/stdout scopes | Purpose-separated files, no crossprofile/secret dump |
| SEC-16 | Faultinject proxy/APM/SQL/errors/metrics labels với sentinel finance/secret strings | No sentinel in any operational sink; logsallowlist maintained |
| SEC-17 | Poweredoff encryptedvolume/dump/repo/capsule read và corruption | Unauthorized offline reads/tamper denied; no plaintext fallback |
| SEC-18 | LostVM/keyversion/media/password restore with synthetic fixtures | Authorized decryptpath reproducible; keyloss not silently bypassed |
| SEC-19 | Source backup writer attempts delete/prune/change existing object | Offhost append-only permission denies; no pruning credential on source |
| SEC-20 | Tampered/future snapshot metadata/quota/fullrepo/overdue backup | Trusted catalog decision, alert from independent host, no falseRPO |
| SEC-21 | Restore old snapshot after acknowledged erase/revoke, current witness head | Denied targets never reopen or reappear in finance views |
| SEC-22 | Stale signed prefix/head, wrong nonce/env/key/chain gap/witness offline | Restore stays LOCKED; no localjournal fallback |
| SEC-23 | Crash tại local deny → append → receipt → commit lần hai; retry đồng thời và publication sai thứ tự target epoch | Deny không bị rollback; retry đúng event/key; witness giữ max epoch, không ACK trước durability |
| SEC-24 | Logout/reset chờ publication; credential gốc hết hạn; timeout; reset cũ hoàn tất sau revoke/erase mới | Chỉ tiếp tục lệnh gốc; không finance grant hoặc bỏ qua deny mới; phân rõ unknown/local committed |
| SEC-25 | Irregularbackup/tag/path groups, lastgood older34d, forget withoutprune | No false35d compliance; actualcopy purge/deadline verified or fail |
| SEC-26 | Race xóa identity/tạo workspace, child lỗi, parent sai loại hoặc chu trình, FK/history và bản sao ngoài DB | Parent chờ đủ children/bản sao; không chu trình; deadline gốc không đổi cả khi gửi key mới; không xóa nhầm user |
| SEC-27 | Public-provider URL redirects/DNSrebinding/metadataIP/model override | Egress deny; exactapproved profile exceptiononly |
| SEC-28 | FinWeavemail authcodes vs bankOTP; model minimumcontext/retention/consent | Purpose-specific outbound only; externalfinance defaultdeny |
| SEC-29 | Oldhost still serving /wrongenv restore /forgedrelease config | No reopening until oldwriter fenced and bundle hashes match |
| SEC-30 | Restore old password/recoverycode/refresh/replay/TOTP/devicebinding | Old auth invalidated; freshownerreset/adminprovision, no replaysecret resurrection |
| SEC-31 | Operator/breakglass/key/backup audit and scopes | Access auditable; no appadmin masquerading as trustedcustodian |
| SEC-32 | Restore dryrun ledger/domain/permissions oracle, elapsedtime/backupage measurements | RPO/RTO truthfully measured; root plaintext ability statedT1limit |

Evidence mỗi case: pinned source/API/DB/policy hashes, environment/tool versions, role/deviceprofile, synthetic fixture IDs, controlled clock, expected/actual, sanitized proof. No actual password/seed/recoverycode/finance trace in report. Gates require behavioral evidence và review, không count script PASS. Real native/provider/model/UAT là các gate riêng; đạt security không tự đạt toàn bộ product.
