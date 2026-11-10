# ARCH-08 — Báo cáo thay đổi Engine/domain

09/10/2026 · **ACCEPTED DESIGN; PRODUCTION ENGINE / SQL / CONCURRENCY NOT RUN**. [ADR-015](adr/ADR-015-exact-financial-engine-and-frozen-forecast-runs.md), [hồ sơ domain](../domain/README.md).

| Thay đổi/bổ sung | Lý do |
| --- | --- |
| Exact money/quantity/FX, rounding và input bounds | Không mất unit tiền vì Number/cast DB; valuation round từng holding rồi sum; unknown khác0 |
| Calendar Việt Nam, recurring anchor và snapshots hai mốc thời gian | Không nhầm UTC với ngày nghiệp vụ, mất occurrence361 hoặc dùng giá tương lai cho history |
| Opening, sealed ledger, transfer clearing/fee/refund/correction lineage | Chỉ một authority, không cộng opening/refund/transfer hai lần, không sửa sealed facts |
| Shared Plan–Goals funding, actual family links, current criteria/liquidity | Không double-spend cùng nguồn tiền; không dùng projected success để mark actual achieved |
| Full extended forecast: nợ/lạm phát/stress/profiles/pooling/uncertainty/counterfactual | Bao phủ khả năng frontend đã có; settings, giả định, missing và probability được định nghĩa rõ |
| Async frozen forecast runs/checkpoints/pages, compute-only worker trên J2 | Không nghẽn HTTP vì long horizon; không publish partial trials hoặc tạo queue authority thứ hai |
| API003:151operations/626schemas; DB004:86bảng/988cột/161FK | Thêm4operations/26schemas và2bảng để đóng khoảng trống forecast dài hạn; prior packages giữ nguyên |
| 30 refinements/cases,14 source observations, golden oracle độc lập | Có đặc tả và ví dụ kiểm trước khi build; không lấy frontend làm oracle duy nhất |

Giữ đủ21backlog REQUIRED /41parentAC. Không sửa frontend, dependencies/lockfiles, r1/r2 hoặc prior API/DB/auth/security packages/evidence. API003 chưa phát hành, consumers chưa migrate. Không chạy lại browser suite hay thay kết luận nghiệm thu frontend synthetic.

Kết quả kiểm tra hồ sơ: **26 kiểm tra tĩnh PASS**, 8 request/reply mẫu mới và 294 mẫu kế thừa đúng schema; 17 input sai cấu trúc bị từ chối. Sáu ví dụ chuỗi số vượt ngưỡng minh họa vì sao backend còn phải kiểm ngữ nghĩa ngoài schema. **57 ví dụ tính độc lập PASS** và **332 tệp được bảo vệ giữ nguyên hash**. Đây không phải số lượng bài kiểm thử backend đã chạy.

[Validation](../execution/evidence/arch-08-domain-2026-10-09/validation.json), [oracle results](../execution/evidence/arch-08-domain-2026-10-09/oracle-results.json), [preservation](../execution/evidence/arch-08-domain-2026-10-09/preservation.json), [đồng bộ tài liệu](../execution/evidence/arch-08-domain-2026-10-09/document-sync-validation.json) và [manifest SHA256](../execution/evidence/arch-08-domain-2026-10-09/artifact-manifest.json) ghi kết quả và phiên bản kiểm tra. Oracle chỉ tính independent Fraction/integer/calendar vectors; không chạy production Engine hoặc chứng minh Monte Carlo calibration. Manifest này ghi nhận hồ sơ thiết kế ARCH-08, không thay thế baseline bàn giao r1/r2.

[30 ca DOM](../domain/acceptance-plan.md) đều **NOT RUN** trên backend. SQL/grants/upgrade, concurrency/faults, forecast worker/Model/RNG/ARM64 performance, crypto/security/restore, Android/provider/Agent/UAT vẫn chưa nghiệm thu. Không dùng dữ liệu thật, provision, chi tiền, deploy, commit hoặc push.

Bước kế tiếp **ARCH-09 Async/sync**: typed J2 registry, lease/heartbeat/fence/chunk budgets, cancellation/retry/outcome, receipt dedupe/ACK/reconcile, scheduler/catch-up, polling và offline synchronization. Không chuyển sang build backend trước khi các ranh giới này và DB/spikes cần thiết được kiểm.
