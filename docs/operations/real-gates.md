# Real gates còn thiếu — BE-18/21

Không bật REAL, không provision/publish, không gán DONE cho 21 BE/41 AC từ local drills.
Đây gồm external inputs **và** implementation/hardening còn thiếu; không chỉ checklist giấy.

| Gate | Cần đầu vào và bằng chứng đóng gate | OPS |
| --- | --- | --- |
| G-MOUNT-NETWORK | Volume mã hóa/key unlock/ACL dưới UID thật; missing/wrong mount fail; service separation/container restrictions; private firewall/egress và TLS topology; reboot thật | 02–04,14,21 |
| G-SECRET-CUSTODY | Purpose/version keyring, rotation/revocation không mất decrypt; age capsule độc lập ≥2 media ngoài host; signer/CA/APK secrets tách; loss current key/one medium/host thật | 04,18,25 |
| G-CI-ARTIFACT | Runner ngoài finance host, untrusted PR không đọc secrets/socket/publish; frozen independent install, dependency/SBOM provenance/attestation, signer custody production; test đúng deploy artifact/APK | 05–07,18 |
| G-RELEASE | Deploy lock/process inventory; ingress proxy/native drain/fence kill tại external sent_unknown/unknown COMMIT; approved compatibility expansion; actual schema/grants readiness; operator smoke trước mở; full migration tuple | 08–14 |
| G-DB-TARGET | Clean và001–003+004→DB005 production topology, resumable backfill; concurrent migrator/connection loss; nontransaction invalid index runtime; temporary restore trigger exceptions audited | 10–12,28 |
| G-J2-OBSERVATION | Scheduler catchup khi clients tắt/host sleep/reboot/timer duplicate quan sát≥7 ngày với lịch thật; không nhận fake-clock test là observation | 09,15 |
| G-SOURCE-MODEL-NATIVE | Provider rights/parser/units/calendar/429/quota thực; pinned approved local model/resource/privacy/injection; signed install/update/outbox owner/device/Keystore/collector tests | 16–18,28,32 |
| G-PRIVACY-LOGS | Runtime sentinel injection qua proxy/PG/dependency/OS crash/export và tất cả sinks dưới deployment thật; bounded label cardinality; auth/business load representative, pressure RAM/pool/disk/model/VM | 19,22 |
| G-ALERT-INDEPENDENCE | Receiver ngoài finance failure domain, authenticated TLS/challenge/signature/key rotation; actual stop host/power/network và duplicate/recovery; external alert delivery receipt không finance | 20–21 |
| G-BACKUP-OFFHOST | Destination thật TLS, append-only writer, custodian prune riêng; consistent full tenant/export/roles/object/key inventory; signed durable receipt/head ngoài host; fail quota/destination/dump; restore sau source-host loss | 23–26 |
| G-RPO-RTO | Backup candidate12h phải được quan sát dưới export/network failure; RPO từ snapshot start; production RTO recovery declaration→controlled finance service gồm host/keys/download/witness/identity reset, actual loss/gap | 24–28,32 |
| G-RESTORE-TRUST | Physical old-writer fence, fresh independent latest witness/head/key history, unknown mapping/erased targets denied **before** finance/export; new login proof/admin factor/device enrollment; quota reset/reconcile có nguồn tin cậy | 25–28 |
| G-RETENTION-OBSERVED | Real restic snapshots/all hosts/tags/paths/versioning/soft-delete inventory; hard34d, packs prune≤24h, repack scratch pressure và actual deleted-object fetch failure; lịch quan sát nhiều ngày và last-good/privacy conflict | 29 |
| G-ERASURE-COMPLETE | Original deadline35d, local deny khi witness outage, immutable frozen children; kiểm DB/files/LO/WAL/restore scratch/mail/logs/capsules/offline copies; bounded tombstones≥90d plus copies+7d; complete chỉ khi witness+all-copy physical purge có receipt | 30 |
| G-PAYLOAD-TTL | Production5min/24h/30/90/180d và license-shorter TTL thực; registry cho mọi external/unregistered object/key version; sanitation expired active checkpoints/input/results/receipt/import payloads với partial/tombstone semantics, không kéo private content vì pins vô hạn | 31 |
| G-UAT-41 | Toàn bộ21 BE/41 parent AC, AI requirements trên3 clients, authorized providers/model/device thật; full faults/load/privacy/UAT và incident close; missing/skipped/stale/unknown không promote | 07,32 |

Hai thư mục/capsule hoặc hai subprocess cùng Windows host chỉ là local fixtures. Hash,
signature và source manifest chứng minh binding/integrity trong trust đã nêu; không tự chứng
minh drills đã chạy. Short-policy retention hoặc sửa deadline metadata chỉ kiểm controller
branch; không tăng `observedRetentionDays` và không đóng G-RETENTION/G-ERASURE.
