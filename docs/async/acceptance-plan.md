# ARCH-09 acceptance và runtime gates

**ALL 32 RUNTIME CASES NOT RUN.** ASY refinements giữ 41 parent AC và21 REQUIRED backlog items. Static schema/ref/hash và48 model vectors chỉ kiểm hồ sơ/quy tắc, không là nghiệm thu backend/Android/provider.

| Case / requirement | Phải chạy với implementation thật | Bằng chứng đạt cần có |
| --- | --- | --- |
| ASN-01 / ASY-01 | Tắt legacy dispatch, restart processes | Chỉ jobs có active lease authority, không duplicate consumers |
| ASN-02 / ASY-02 | Crash trước/sau enqueue commit | Receipt/domain+job+replay cùng tồn tại hoặc cùng rollback; ACK chỉ sau commit |
| ASN-03 / ASY-03 | Forged profile/type/domain/token/workspace | SQL/private ports deny, không side effect/cross-tenant read |
| ASN-04 / ASY-04 |≥2 connections claim/finalize/revoke đồng thời | Workspace→job lock order, no deadlock loop; one live generation |
| ASN-05 / ASY-05 | Chờ lock qua expiry, clock shift | DB-now sau lock; equality expired; stale ticket không publish |
| ASN-06 / ASY-06 | Worker treo, heartbeat mãi, redeploy policy | Attempt/job cap đúng, không gia hạn deadline hoặc resurrect lease |
| ASN-07 / ASY-07 | Mất ACK sau domain COMMIT | Retry đọc committed marker, không ledger effect lần2 |
| ASN-08 / ASY-08 |429/503/unknown, manual retry và DB retry | Retry-After floor persisted; attempts/cycles bounded; no multiplied model calls |
| ASN-09 / ASY-09 | Flood một workspace, nguồn pause, memory pressure | Không starvation theo ngưỡng benchmark đã chọn, no unbounded claims/truncation |
| ASN-10 / ASY-10 | Cancel vs publish/commit ở từng fence point | Một kết quả authoritative; committed facts không rollback bằng cancel |
| ASN-11 / ASY-11 | Native capture duplicate/update/owner switch | Fixed identity/digest/AAD; raw/OTP không disk/server/log |
| ASN-12 / ASY-12 | Mixed202/all422/partial/duplicate/wrong ACK | Chỉ durable exact pairing được retire; unknown giữ pending |
| ASN-13 / ASY-13 | Hai devices + CSV overlap, equal amount events | Strong reference link một effect; ambiguous Review, không mất real event |
| ASN-14 / ASY-14 | Binding edit/revoke/erase lúc parse | Finalize rechecks current guards, no retag old-owner data |
| ASN-15 / ASY-15 | Count/byte/age/quarantine/replay limits | Pause/gap/consent warning, bounded purge, no hidden eviction/raw retention |
| ASN-16 / ASY-16 | UI đóng/reboot/network/Doze/force-stop/OEM | Queue độc lập WebView, OS gaps hiển thị, không hứa capture khi OS chặn |
| ASN-17 / ASY-17 | Restore older backup, missing ACKed receipt | Witness first, old host fenced, missing không auto repost; gap/review đúng |
| ASN-18 / ASY-18 | Clients đều tắt, qua18hVN/day/weekend | Scheduler durable một due occurrence; last-good không giả quote mới |
| ASN-19 / ASY-19 | Manual/daily race, profile/selection edit | Exact compatible coalesce, frozen input/child manifest, no cross-entitlement leak |
| ASN-20 / ASY-20 | Concurrent shared quota, crash/cooldown/restore | Counters all-buckets atomic, unknown charged, quota restored fail-closed |
| ASN-21 / ASY-21 | Một provider child fail, stale completion | Partial đúng, retained last-good, quoteAsOf/fetchedAt tách, no quantity/cash write |
| ASN-22 / ASY-22 | Scheduler rollback/outage7days/duplicate ticks | Watermark atomic; latest catch-up một lượt, no invented historical prices |
| ASN-23 / ASY-23 | Import100selected, pin expire, fault giữa effects | All-or-nothing selected bundle, Review refs đúng, no incomplete committed IDs |
| ASN-24 / ASY-24 | Q&A/simple chat cancel/history/context | Old capabilities giữ, scoped message worker, no forced multi-step run/actual writes |
| ASN-25 / ASY-25 | Clarification duplicate/retry/crashed tool call | Cumulative8tools/60s/2questions, reserved budget not reset; saved draft no duplicate |
| ASN-26 / ASY-26 | Largest forecast, chunk crash/cancel/old runtime | Heartbeat loop responsive; resumable pinned math; complete pages only, no partial probability |
| ASN-27 / ASY-27 | Ops forged mapping/permanent retry, purge pins | Safe broker rechecks, no private finance read, cache purge không full erasure |
| ASN-28 / ASY-28 | Background/offline/focus/many tabs/timeouts | Bounded single-flight polls, no read-side worker, Retry-After honored |
| ASN-29 / ASY-29 | User switch, stale reply, restore version falls | Session+epoch precedence, fresh baseline, private cache not leaked/merged |
| ASN-30 / ASY-30 | Lost commit response/not_found/expired replay | Same key/input, typed completion status, no alternate-key double command |
| ASN-31 / ASY-31 | CSV header selectors +>100coverage/gaps dataset | API004 parser mode checks, completeness flags, full snapshot pagination/auth/byte bounds |
| ASN-32 / ASY-32 | Artifact pins, migration consumers, report audit | Prior hashes unchanged; runtime evidence separated; r1/r2/frontend acceptance preserved |

Use disposable synthetic PostgreSQL và≥2 independent connections cho races; fault injection tại transaction/network/worker kill boundaries. Android ca thực tế phải có APK/native implementation + thiết bị/emulator phù hợp, không thay bằng responsive browser. Provider/model substitutes chỉ test adapter contract khi chưa có quyền nguồn thật, không nhận provider real PASS. Performance phải ghi hardware/ARM64/runtime versions/input distributions/latency/memory/cancel delay/quota; không lấy registry constants làm đo đạc.

Liên quan: [identity cases](../security/identity/acceptance-plan.md), [security cases](../security/t1/acceptance-plan.md), [domain cases](../domain/acceptance-plan.md), [technical spikes](../testing/technical-spikes.md). Chưa được bật REAL/protected/production bằng một status trong tài liệu.
