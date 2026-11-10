# BE-18/21 — Operations runtime, 13/10/2026

Đã triển khai và diễn tập local synthetic. REAL vẫn bị chặn; không nhận DONE cho toàn bộ21BE/41AC hoặc OPS-01…32.

- Host CLI: strict secrets/config, role/schema readiness, maintenance→drain/fence→migration, compatibility-only rollback checks, source/artifact evidence gates.
- Telemetry: allowlist DTO, sanitized process crash, native PG ordinary SQL/parameter logging suppression; signed heartbeat producer/receiver riêng process.
- Backup/restore: consistent exported PostgreSQL snapshot, custom dump, encrypted archive+runtime key inventory, signed catalog, wrong-key failure, reserve/prune controller; isolated restore LOCKED, witness/credential/job/quota fences.
- Erasure/TTL: local deny, frozen children/original deadline, base-table and registered LO purge with independent residual/reopen queries; privileged TTL deletion survives maintenance. All-copy completion intentionally remains PENDING.

Operations runtime: **12 nhóm PASS**, source stable; regressions: **8/8 PASS**.
Host CLI positive smoke: **9/9 PASS** (status/backup/witness/maintenance/drain/fence/migrate/rollback-check/open), cluster riêng đã dừng; không deploy service thật.
RPO snapshot-start age synthetic **1.807s**; **1** record sau snapshot thực sự không có trong restore.
RTO partial drill **2.776s**: decrypt/import/inventory/fence/credentials+quota/fresh witness. Chưa gồm host/custody/off-host download/TLS/new proof/enrollment/finance reopening.
Load **400 requests / concurrency 10**, gồm authenticated PG reads/invalid ingress/health; p95 **100.1ms**, p99 **266.8ms**. Không phải production capacity SLO.

Không dùng hashes/typecheck/gate unit tests thay runtime drills. TTL2s dùng wall clock thật nhưng không chứng minh production5min/24h/30/90/180d. Short prune policy/deadline metadata fault không chứng minh34d/24h/35d đã quan sát. Cùng host không chứng minh off-host independence.

Artifact source gzip được tạo trước test và chính bytes đã giải nén được test/typecheck rồi ký bằng ephemeral synthetic signer. Dependency junction, signer và runner chưa có production custody/attestation. Không publish/deploy tự động.
Source manifest giữ snapshot tại lúc build. Acceptance/report được cập nhật sau build là output evidence; runtime backend bytes vẫn phải khớp artifact khi mở service.

[Runbooks chạy được](../operations/runtime-runbooks.md) · [32 OPS RTM](../operations/runtime-acceptance.json) · [real gates/implementation gaps](../operations/real-gates.md)

Raw operations: [JSON](evidence/backend-operations-2026-10-12/final-operations.json); [regression receipt](evidence/backend-operations-2026-10-12/regressions-1791875749087.json).
Tested artifact receipt: [release.json](<D:/HK1-26-27/MoHinhHoa/Information Systems Modeling and Design/finweave-backend/.local/releases/OY78cI3WIXNLHsG3TDRdg1NnIZcDLmnk8hiUflGefTE/release.json>). Artifact digest: f4220287c9d16b2564c08bfabd2f5ff7192e75c8a917620cdd055cb673821acb.
Host CLI receipt: [JSON](evidence/backend-operations-2026-10-12/release-smoke-1791877157377.json).

Evidence raw/.local đang gitignored theo repository policy. Summary và runbooks được lưu trong docs; muốn chia sẻ raw cần chọn bản đã review riêng.

Lượt fail/invalid trước được giữ: sandbox loopback denial; thiếu client tools; teardown/pg connection-loss harness errors; view bị chọn nhầm khi purge; J2 oracle cũ còn kỳ vọng rights/quota tự mở; DB foundation source thay đổi trong lúc chạy; bundle thiếu catalogue/golden vectors/package ESM và Windows staging path quá sâu. Các lượt này không được dùng để promote. Current evidence phải khớp source, không lấy PASS cũ cho source mới.

| OPS | Runtime scope |
| --- | --- |
| OPS-01 | Loader strict/profile/purpose/loopback/REAL deny; public client config/revision on real clients still gate. |
| OPS-02 | Encrypted mount, actual UID/ACL/reboot and plaintext-fallback fault NOT RUN. |
| OPS-03 | All seven disjoint non-root SQL profiles/readiness and cross-grants tested locally; real environment namespaces/keys/channels remain open. |
| OPS-04 | Purpose keys and restored key inventory checked; rotation, age/offline custody and all-client leakage remain open. |
| OPS-05 | Trusted local build only; untrusted runner isolation has not been proven. Untrusted build must stay disabled. |
| OPS-06 | Artifact made before tests; extracted artifact tested then signed. Local dependency junction/ephemeral signer are not production supply-chain custody. |
| OPS-07 | Missing/skipped/cancelled/stale/source/artifact receipts fail gate helper; CLI missing artifact denies; full21BE/41AC/UAT still closed. |
| OPS-08 | Real local HTTP mutation/enqueue/claim maintenance denied; signout/privileged retention/witness/erase kept; proxy/native topology remains gate. |
| OPS-09 | Actual stale ticket publication blocked; attempts/deadline preserved. J2 crash/sent_unknown/COMMIT regressions synthetic only. |
| OPS-10 | Actual migration contention, terminated connection, checksum fault and host CLI checked; target migrator regressions executed. |
| OPS-11 | Local001..011 and DB foundation/DB005 upgrade runtime executed; production backfill/roles topology remains gate. |
| OPS-12 | DB005 nontransaction phase/catalog invalid-index recovery regression executed; target deployment still gated. |
| OPS-13 | Exact compatibility helper and CLI fail-closed gates; no DB rewind/down migration. Actual old-code deployment rollback remains gate. |
| OPS-14 | SELECT1 cannot bypass missing table, required grants, root/combined role or recovery lock; actual deployed readiness still needs smoke. |
| OPS-15 | Synthetic scheduler catchup regression; 7-day actual observation NOT RUN, fake due timestamps do not count. |
| OPS-16 | Provider stub rights/units/outage/quota regressions; real licensed endpoint/profile tests NOT RUN. |
| OPS-17 | Bounded Assistant/Agent synthetic regressions; approved actual local model inference/long-run privacy NOT RUN. |
| OPS-18 | No APK signer/install/update/owner-device UAT executed by this operations run. |
| OPS-19 | Actual HTTP error/telemetry, process dependency crash, SQL exception/native PG log sentinels checked. Proxy/OS/core/PANIC/provider sinks NOT RUN. |
| OPS-20 | Killed separate producer detected by separate signed receiver on same host; off-host host/network/power loss and external notification NOT RUN. |
| OPS-21 | Signed heartbeat freshness/duplicate policy partly covered; TLS expiry/domain and clock rollback/skew failures NOT RUN. |
| OPS-22 | 400 requests concurrency10 including authenticated PostgreSQL reads, real bounded pool exhaustion and measured scratch reserve failure; production capacity/SLO NOT PROVEN. |
| OPS-23 | Actual exported snapshot/custom dump/encrypted archive+keys/full fw-table and LO inventory, failed destination and scratch cleanup; off-host append-only durable receipt NOT PROVEN. |
| OPS-24 | Measured DB snapshot-start age includes export/readback; one actual post-snapshot synthetic record absent after restore. Scheduled24h production RPO NOT PROVEN. |
| OPS-25 | Wrong capsule key fails, one local media deleted and second restores current keyring; same-host fixtures do not prove source-host loss/age custody/rotation. |
| OPS-26 | Fresh-nonce stale signature denial and erased target mapping checked; physical old-writer fence and independent latest witness remain gates. |
| OPS-27 | Restored sessions/replay/collector/challenges/devices/admin/bindings revoked or blocked, old login CONNECT denied; actual fresh identity/reset/enrollment remains gate. |
| OPS-28 | Actual ledger/events/history/Plan–Goals+LO roundtrip, jobs cancelled and market/model quota deny infinity; full finance service/real provider reconciliation NOT RUN. |
| OPS-29 | Signed catalog tamper, measured scratch reserve, short-policy actual unlink/reopen and last-good conflict checked; real34d/restic packs24h observation=0. |
| OPS-30 | Deny despite witness failure, immutable duplicate deadline/children, queried base-table/registered LO purge; deadline branch uses explicit fault metadata. All-copy physical completion remains PENDING. |
| OPS-31 | Actual2-second wall-clock deletion of auth nonce/body/messages/tools during maintenance, markers retained. Production multi-day/license TTL and active-payload sanitation remain gates. |
| OPS-32 | Full21BE/41AC/AI/3-client real UAT and incident close NOT RUN; local runtime never certifies full acceptance. |
